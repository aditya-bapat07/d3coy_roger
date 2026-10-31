"""
Unified Cyber-Physical Risk Calculation Engine for Vidura.
Integrates AttackGraphEngine (Likelihood) and DependencyGraphEngine (Consequence)
to produce 0-100 prioritised risk scores grounded in real CISA KEV/EPSS threat intelligence,
ML anomaly telemetry, and INL CCE consequence modeling.
Includes full 'Why' breakdown (risk_drop_if_removed) and confidence scoring.
"""
from datetime import datetime, timezone
import logging
import math
from typing import Any, Dict, List, Optional
from backend.engine.anomaly import get_anomaly
from backend.engine.attack_graph import AttackGraphEngine
from backend.engine.choke_point import ChokePointEngine
from backend.engine.dependency_graph import DependencyGraphEngine
from backend.engine.intel import get_cve
from backend.engine.scenario import ScenarioModel, load_assumptions, load_scenario

logger = logging.getLogger(__name__)


class RiskCalculator:
    def __init__(
        self,
        scenario: Optional[ScenarioModel] = None,
        assumptions: Optional[dict] = None,
        threat_drop_cve: Optional[str] = None,
        injected_anomalies: Optional[Dict[str, float]] = None,
    ):
        self.scenario = scenario or load_scenario(validate_cves=False)
        self.assumptions = assumptions or load_assumptions()
        self.threat_drop_cve = threat_drop_cve
        self.injected_anomalies = injected_anomalies or {}

        # Initialize engine components
        self.attack_engine = AttackGraphEngine(
            scenario=self.scenario,
            assumptions=self.assumptions,
            threat_drop_cve=self.threat_drop_cve,
            injected_anomalies=self.injected_anomalies,
        )
        self.dep_engine = DependencyGraphEngine(
            scenario=self.scenario,
            assumptions=self.assumptions,
        )
        self.choke_engine = ChokePointEngine(
            attack_engine=self.attack_engine,
            scenario=self.scenario,
            assumptions=self.assumptions,
        )

    def _compute_why_breakdown(
        self,
        asset,
        best_path: List[str],
        base_likelihood_raw: float,
        base_likelihood_score: float,
        consequence_info: Dict[str, Any],
        base_risk: float,
        top_paths: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Computes risk_drop_if_removed for each factor on the best path:
        - each CVE on best path
        - KEV status for each KEV CVE
        - internet exposure
        - misconfigured rule
        - ML anomaly score boost
        - each consequence component (severity, people, outage)
        Returns factors sorted descending by risk_drop, plus a tooltip note.
        """
        note_text = (
            "Single-factor risk drops isolate each element's contribution and do not sum to "
            "total risk due to non-linear and overlapping path dependencies."
        )

        if base_risk <= 0.0 or not best_path:
            return {"factors": [], "note": note_text}

        factors = []
        c_score = consequence_info.get("consequence_score", 0.0)

        # Edges on best path
        path_edges = []
        for i in range(len(best_path) - 1):
            path_edges.append((best_path[i], best_path[i + 1]))

        # Helper to compute edge exploit probability under counterfactuals
        def get_edge_prob(u: str, v: str, exclude_cve: Optional[str] = None, no_kev: bool = False, no_anomaly: bool = False) -> float:
            p_orig = self.attack_engine.g[u][v]["exploit_probability"] if self.attack_engine.g.has_edge(u, v) else 0.05
            dst_a = self.attack_engine.asset_map.get(v)
            if not dst_a:
                return min(p_orig, 0.05)
            kev_floor = 0.5 if not no_kev else 0.0
            p_default_cred = 0.9
            p_remote_no_mfa = 0.3
            alpha = 0.3

            cves = [c for c in dst_a.cves if c != exclude_cve]
            cve_probs = []
            for cid in cves:
                intel = get_cve(cid)
                if intel:
                    epss = intel.get("epss") or 0.0
                    is_kev = intel.get("kev", False) and not no_kev
                    if is_kev:
                        prob = max(kev_floor, epss)
                    else:
                        prob = epss if epss > 0 else 0.05
                    cve_probs.append(prob)

            if cve_probs:
                base_p = max(cve_probs)
            elif dst_a.default_credentials:
                base_p = p_default_cred
            elif dst_a.remote_access and not exclude_cve:
                base_p = p_remote_no_mfa
            else:
                base_p = 0.05

            anomaly = 0.0 if no_anomaly else self.injected_anomalies.get(v, dst_a.anomaly_score)
            if anomaly > 0.0:
                p_boosted = base_p + (1.0 - base_p) * alpha * min(1.0, anomaly)
            else:
                p_boosted = base_p

            # A counterfactual removal of a vulnerability/factor cannot increase edge exploitability above baseline
            return float(max(1e-6, min(p_orig, p_boosted)))

        # 1. Evaluate CVEs on the best path
        seen_cves = set()
        for node_id in best_path:
            node_a = self.attack_engine.asset_map.get(node_id)
            if not node_a:
                continue
            for cve in node_a.cves:
                if cve in seen_cves:
                    continue
                seen_cves.add(cve)

                # Recompute path probability if cve is removed
                new_path_prob = 1.0
                for u, v in path_edges:
                    if v == node_id:
                        p_new = get_edge_prob(u, v, exclude_cve=cve)
                    else:
                        p_new = self.attack_engine.g[u][v]["exploit_probability"]
                    new_path_prob *= p_new

                new_path_prob = float(max(1e-6, min(1.0, new_path_prob)))
                log_v = math.log10(max(new_path_prob, 1e-6))
                norm_l = max(0.0, min(1.0, (log_v + 6.0) / 6.0))
                new_risk = min(base_risk, round(norm_l * c_score * 100.0, 1))
                drop = max(0.0, round(base_risk - new_risk, 1))

                factors.append({
                    "factor_id": f"cve_{cve}",
                    "factor_type": "cve",
                    "description": f"Vulnerability {cve} on {node_a.name}",
                    "risk_drop": drop,
                    "risk_without_factor": new_risk,
                })

                # Check if this CVE has KEV status
                c_intel = get_cve(cve)
                if c_intel and c_intel.get("kev"):
                    # Recompute without KEV floor
                    new_path_prob_kev = 1.0
                    for u, v in path_edges:
                        if v == node_id:
                            p_new = get_edge_prob(u, v, no_kev=True)
                        else:
                            p_new = self.attack_engine.g[u][v]["exploit_probability"]
                        new_path_prob_kev *= p_new

                    new_path_prob_kev = float(max(1e-6, min(1.0, new_path_prob_kev)))
                    log_v_k = math.log10(max(new_path_prob_kev, 1e-6))
                    norm_l_k = max(0.0, min(1.0, (log_v_k + 6.0) / 6.0))
                    new_risk_k = min(base_risk, round(norm_l_k * c_score * 100.0, 1))
                    drop_k = max(0.0, round(base_risk - new_risk_k, 1))

                    factors.append({
                        "factor_id": f"kev_{cve}",
                        "factor_type": "kev_status",
                        "description": f"CISA KEV mandatory exploitation floor (0.50) for {cve} on {node_a.name}",
                        "risk_drop": drop_k,
                        "risk_without_factor": new_risk_k,
                    })

        # 2. Evaluate Internet Exposure
        is_internet_exposed = (
            best_path[0] == "asset_internet"
            or any(
                bool(self.attack_engine.asset_map.get(n) and self.attack_engine.asset_map[n].internet_exposed)
                for n in best_path
            )
        )
        if is_internet_exposed:
            # If access from internet is severed, check alternative path not originating at asset_internet
            non_internet_paths = [
                p for p in top_paths
                if p["path"][0] != "asset_internet" and p["path"] != best_path
            ]
            if non_internet_paths:
                alt_norm_l = non_internet_paths[0]["likelihood_score"]
                new_risk_ie = min(base_risk, round(alt_norm_l * c_score * 100.0, 1))
            else:
                new_risk_ie = 0.0
            drop_ie = max(0.0, round(base_risk - new_risk_ie, 1))
            factors.append({
                "factor_id": "internet_exposure",
                "factor_type": "internet_exposure",
                "description": "Public internet perimeter exposure",
                "risk_drop": drop_ie,
                "risk_without_factor": new_risk_ie,
            })

        # 3. Evaluate Misconfigured Rules along best path
        for u, v in path_edges:
            edge_data = self.attack_engine.g[u][v]
            if edge_data.get("misconfiguration", False):
                # If this rule is removed, find alternate path not using this edge
                alt_rule_paths = [
                    p for p in top_paths
                    if not any(p["path"][j] == u and p["path"][j+1] == v for j in range(len(p["path"]) - 1))
                ]
                if alt_rule_paths:
                    alt_norm_l = alt_rule_paths[0]["likelihood_score"]
                    new_risk_rule = min(base_risk, round(alt_norm_l * c_score * 100.0, 1))
                else:
                    new_risk_rule = 0.0
                drop_rule = max(0.0, round(base_risk - new_risk_rule, 1))

                u_name = self.attack_engine.asset_map[u].name if u in self.attack_engine.asset_map else u
                v_name = self.attack_engine.asset_map[v].name if v in self.attack_engine.asset_map else v
                factors.append({
                    "factor_id": f"rule_{u}_{v}",
                    "factor_type": "misconfigured_rule",
                    "description": f"Misconfigured firewall rule: {u_name} → {v_name}",
                    "risk_drop": drop_rule,
                    "risk_without_factor": new_risk_rule,
                })

        # 4. Evaluate ML Anomaly Score Boost
        for node_id in best_path:
            node_a = self.attack_engine.asset_map.get(node_id)
            if not node_a:
                continue
            cur_anomaly = self.injected_anomalies.get(node_id, node_a.anomaly_score)
            if cur_anomaly > 0.0:
                new_path_prob_anom = 1.0
                for u, v in path_edges:
                    if v == node_id:
                        p_new = get_edge_prob(u, v, no_anomaly=True)
                    else:
                        p_new = self.attack_engine.g[u][v]["exploit_probability"]
                    new_path_prob_anom *= p_new

                new_path_prob_anom = float(max(1e-6, min(1.0, new_path_prob_anom)))
                log_v_a = math.log10(max(new_path_prob_anom, 1e-6))
                norm_l_a = max(0.0, min(1.0, (log_v_a + 6.0) / 6.0))
                new_risk_a = min(base_risk, round(norm_l_a * c_score * 100.0, 1))
                drop_a = max(0.0, round(base_risk - new_risk_a, 1))

                factors.append({
                    "factor_id": f"anomaly_{node_id}",
                    "factor_type": "anomaly_score",
                    "description": f"ML anomaly boost ({cur_anomaly:.2f}) on {node_a.name}",
                    "risk_drop": drop_a,
                    "risk_without_factor": new_risk_a,
                })

        # 5. Evaluate Consequence Components
        s_max = consequence_info.get("max_safety_severity", 0)
        p_max = consequence_info.get("max_people_affected", 0)
        o_max = consequence_info.get("max_outage_hours", 0.0)

        s_n = min(1.0, s_max / 4.0)
        p_n = min(1.0, p_max / 500000.0)
        o_n = min(1.0, o_max / 72.0)

        # Safety severity component (weight 0.5)
        if s_max > 0:
            c_no_s = max(0.0, c_score - 0.5 * s_n)
            new_risk_s = round(base_likelihood_score * c_no_s * 100.0, 1)
            drop_s = max(0.0, round(base_risk - new_risk_s, 1))
            factors.append({
                "factor_id": "consequence_safety_severity",
                "factor_type": "consequence_component",
                "description": f"Physical safety severity component (Level {s_max}/4)",
                "risk_drop": drop_s,
                "risk_without_factor": new_risk_s,
            })

        # People affected component (weight 0.3)
        if p_max > 0:
            c_no_p = max(0.0, c_score - 0.3 * p_n)
            new_risk_p = round(base_likelihood_score * c_no_p * 100.0, 1)
            drop_p = max(0.0, round(base_risk - new_risk_p, 1))
            factors.append({
                "factor_id": "consequence_people_affected",
                "factor_type": "consequence_component",
                "description": f"Population served component ({p_max:,} people)",
                "risk_drop": drop_p,
                "risk_without_factor": new_risk_p,
            })

        # Outage duration component (weight 0.2)
        if o_max > 0:
            c_no_o = max(0.0, c_score - 0.2 * o_n)
            new_risk_o = round(base_likelihood_score * c_no_o * 100.0, 1)
            drop_o = max(0.0, round(base_risk - new_risk_o, 1))
            factors.append({
                "factor_id": "consequence_outage_hours",
                "factor_type": "consequence_component",
                "description": f"Cascading outage duration component ({o_max} h)",
                "risk_drop": drop_o,
                "risk_without_factor": new_risk_o,
            })

        # Sort descending by risk_drop
        factors.sort(key=lambda x: -x["risk_drop"])

        return {
            "factors": factors,
            "note": note_text,
        }

    def _compute_confidence(
        self, asset, best_path: List[str]
    ) -> Dict[str, Any]:
        """
        Computes High/Medium/Low confidence rating and reasons:
        - intel cache older than 7 days
        - a CVE missing an EPSS score
        - product version that was inferred rather than matched exactly
        - path relies on an assumption-only edge (credential pseudo-vulnerability)
        """
        reasons = []
        now = datetime.now(timezone.utc)

        # 1. Check CVEs on asset for missing EPSS or stale cache (>7 days)
        for cve_id in asset.cves:
            intel = get_cve(cve_id)
            if not intel or intel.get("epss") is None or intel.get("epss") == 0.0:
                reasons.append(
                    f"Vulnerability {cve_id} on {asset.name} is missing an EPSS probability score in cache"
                )
            if intel and intel.get("fetched_at"):
                try:
                    dt = datetime.fromisoformat(intel["fetched_at"].replace("Z", "+00:00"))
                    if (now - dt).days > 7:
                        reasons.append(
                            f"Threat intelligence cache for {cve_id} is older than 7 days (last updated {dt.strftime('%Y-%m-%d')})"
                        )
                except Exception:
                    pass

        # 2. Check product version: inferred rather than matched exactly
        if (
            asset.scenario_assumption is True
            or asset.version in {"unspecified", "unknown", "Generic"}
            or asset.product.startswith("Generic")
            or "Stage" in asset.version
            or "Manifold" in asset.name
            or "Sensors" in asset.name
        ):
            reasons.append(
                f"Product version '{asset.version}' for {asset.name} was inferred from scenario assumption rather than exact CPE match"
            )

        # 3. Check if path relies on assumption-only edges (credential pseudo-vulnerabilities or default creds)
        for node_id in best_path:
            v_asset = self.attack_engine.asset_map.get(node_id)
            if v_asset and v_asset.default_credentials:
                reasons.append(
                    f"Path relies on credential pseudo-vulnerability assumption (default credentials on {v_asset.name})"
                )
            if v_asset and v_asset.remote_access and not v_asset.cves:
                reasons.append(
                    f"Path relies on unauthenticated remote access assumption without MFA on {v_asset.name}"
                )

        for i in range(len(best_path) - 1):
            u, v = best_path[i], best_path[i + 1]
            if self.attack_engine.g.has_edge(u, v):
                edge_d = self.attack_engine.g[u][v]
                if edge_d.get("misconfiguration", False):
                    reasons.append(
                        f"Path relies on unsegmented lateral rule assumption ({u} → {v})"
                    )

        # De-duplicate reasons while preserving order
        unique_reasons = []
        for r in reasons:
            if r not in unique_reasons:
                unique_reasons.append(r)

        if len(unique_reasons) == 0:
            rating = "High"
            score = 0.95
        elif len(unique_reasons) <= 2:
            rating = "Medium"
            score = 0.70
        else:
            rating = "Low"
            score = 0.40

        return {
            "rating": rating,
            "score": score,
            "reasons": unique_reasons,
        }

    def calculate_all(self, persona: str = "nation_state") -> Dict[str, Any]:
        """
        Calculates end-to-end risk for all assets in the scenario for the specified persona.
        """
        likelihoods = self.attack_engine.compute_likelihoods_for_persona(persona)
        choke_point_res = self.choke_engine.identify_choke_points(top_n=5)
        choke_ids = {cp["asset_id"] for cp in choke_point_res["choke_points"]}

        asset_responses = []
        crit_count = high_count = med_count = low_count = 0
        total_risk = 0.0
        max_risk = 0.0

        for asset in self.scenario.assets:
            l_info = likelihoods.get(asset.id, {
                "reachable": False,
                "likelihood_raw": 0.0,
                "likelihood_score": 0.0,
                "path": [],
                "technique_ids": [],
                "top_3_paths": [],
            })

            # Calculate consequence cascade from this asset
            c_info = self.dep_engine.calculate_consequence({asset.id})

            l_score = l_info["likelihood_score"]
            c_score = c_info["consequence_score"]

            # Risk = Likelihood * Consequence * 100
            risk_val = round(l_score * c_score * 100.0, 1)

            if risk_val > 75.0:
                risk_lvl = "critical"
                crit_count += 1
            elif risk_val > 50.0:
                risk_lvl = "high"
                high_count += 1
            elif risk_val > 25.0:
                risk_lvl = "medium"
                med_count += 1
            else:
                risk_lvl = "low"
                low_count += 1

            total_risk += risk_val
            if risk_val > max_risk:
                max_risk = risk_val

            # Determine best CVE and CVSS / EPSS metrics
            best_cve = None
            best_epss = 0.0
            has_kev = False
            best_cvss = None

            cves_to_eval = list(asset.cves)
            if self.threat_drop_cve and (
                asset.id in {"asset_water_plc_chlorine", "asset_water_plc_pumps"} or asset.id == "asset_water_scada"
            ):
                if self.threat_drop_cve not in cves_to_eval:
                    cves_to_eval.append(self.threat_drop_cve)

            for c in cves_to_eval:
                c_intel = get_cve(c)
                if c_intel:
                    epss = c_intel.get("epss") or 0.0
                    if c_intel.get("kev"):
                        has_kev = True
                    if epss >= best_epss:
                        best_epss = epss
                        best_cve = c
                        best_cvss = c_intel.get("cvss")

            # Anomaly score lookup
            anomaly_data = get_anomaly(asset.id)
            current_anomaly = self.injected_anomalies.get(asset.id, anomaly_data.get("score", asset.anomaly_score))

            # Compute 'Why' breakdown (risk_drop_if_removed)
            why_breakdown = self._compute_why_breakdown(
                asset=asset,
                best_path=l_info.get("path", []),
                base_likelihood_raw=l_info.get("likelihood_raw", 0.0),
                base_likelihood_score=l_score,
                consequence_info=c_info,
                base_risk=risk_val,
                top_paths=l_info.get("top_3_paths", []),
            )

            # Compute Confidence Rating
            confidence_info = self._compute_confidence(
                asset=asset,
                best_path=l_info.get("path", []),
            )

            # Compute Physical Consequence Metrics (SLA Units) & Time to Criticality
            services_lost = [s.lower() for s in c_info["services_lost_names"]]
            is_water = any("water" in s or "chlorine" in s for s in services_lost) or "water" in asset.id or "water" in asset.site.lower()
            is_power = any("power" in s or "grid" in s or "substation" in s for s in services_lost) or "pwr" in asset.id or "power" in asset.id or "substation" in asset.site.lower()

            mld_loss = 0.0
            if is_water and c_info["max_people_affected"] > 0:
                mld_loss = round(c_info["max_people_affected"] * 0.00058, 1)

            mw_affected = 0.0
            if is_power and c_info["max_people_affected"] > 0:
                mw_affected = round(c_info["max_people_affected"] * 0.00085, 1)

            reserve_buffer = 0.0
            if c_info["max_safety_severity"] > 0:
                if mld_loss > 0:
                    reserve_buffer = round(max(0.5, 6.0 - (c_info["max_safety_severity"] * 0.45)), 1)
                elif mw_affected > 0:
                    reserve_buffer = round(max(0.2, 2.5 - (c_info["max_safety_severity"] * 0.3)), 1)
                else:
                    reserve_buffer = round(max(1.0, 8.0 - (c_info["max_safety_severity"] * 0.8)), 1)

            hop_cnt = len(l_info.get("path", []))
            if hop_cnt <= 1:
                time_to_crit = 0.0
            elif hop_cnt == 2:
                time_to_crit = 1.2
            elif hop_cnt == 3:
                time_to_crit = 2.1
            elif hop_cnt == 4:
                time_to_crit = 3.4
            else:
                time_to_crit = round(3.4 + (hop_cnt - 4) * 0.8, 1)

            if mld_loss > 0 and reserve_buffer > 0:
                phys_label = f"{mld_loss} MLD Water Supply Loss • {reserve_buffer}h Reserve Buffer to Dry Taps"
            elif mw_affected > 0:
                phys_label = f"{mw_affected} MW Grid Disruption • {c_info['max_people_affected']:,} Citizens Blackout"
            elif c_info["max_people_affected"] > 0:
                phys_label = f"{c_info['max_people_affected']:,} Citizens Disrupted • {c_info['max_outage_hours']}h Outage"
            else:
                phys_label = "Telemetry & supervisory disruption (No direct civic outage)"

            asset_responses.append({
                "asset_id": asset.id,
                "name": asset.name,
                "site": asset.site,
                "purdue_level": asset.purdue_level,
                "vendor": asset.vendor,
                "product": asset.product,
                "version": asset.version,
                "cves": cves_to_eval,
                "best_cve": best_cve,
                "cvss": best_cvss,
                "epss": round(best_epss, 4),
                "cisa_kev": has_kev,
                "internet_exposed": asset.internet_exposed,
                "remote_access": asset.remote_access,
                "default_credentials": asset.default_credentials,
                "patchable_now": asset.patchable_now,
                "next_maintenance_window_days": asset.next_maintenance_window_days,
                "anomaly_score": round(current_anomaly, 3),
                "likelihood_raw": l_info["likelihood_raw"],
                "likelihood_score": round(l_score, 4),
                "consequence_score": round(c_score, 4),
                "risk_score": risk_val,
                "risk_level": risk_lvl,
                "services_impacted": c_info["services_lost_names"],
                "max_people_affected": c_info["max_people_affected"],
                "max_safety_severity": c_info["max_safety_severity"],
                "max_outage_hours": c_info["max_outage_hours"],
                "path_from_entry": l_info["path"],
                "path_technique_ids": l_info["technique_ids"],
                "top_3_paths": l_info.get("top_3_paths", []),
                "risk_drop_if_removed": why_breakdown,
                "confidence": confidence_info,
                "is_choke_point": asset.id in choke_ids,
                "criticality_note": asset.criticality_note,
                "scenario_assumption": True,
                "mld_loss": mld_loss,
                "megawatts_affected": mw_affected,
                "reserve_buffer_hours": reserve_buffer,
                "cascade_time_to_criticality_hours": time_to_crit,
                "physical_impact_label": phys_label,
            })

        # Rank assets descending by risk_score, tie-breaking by consequence, likelihood, CVSS
        asset_responses.sort(
            key=lambda x: (
                -x["risk_score"],
                -x["consequence_score"],
                -(0.0 if x["asset_id"] == "asset_internet" else x["likelihood_score"]),
                -(x["cvss"] or 0.0),
                x["asset_id"],
            )
        )

        total_assets = len(asset_responses)
        avg_risk = round(total_risk / total_assets, 1) if total_assets > 0 else 0.0

        total_mld = max([a.get("mld_loss", 0.0) for a in asset_responses] or [0.0])
        total_mw = max([a.get("megawatts_affected", 0.0) for a in asset_responses] or [0.0])
        positive_buffers = [a.get("reserve_buffer_hours", 0.0) for a in asset_responses if a.get("reserve_buffer_hours", 0.0) > 0]
        min_reserve = min(positive_buffers) if positive_buffers else 0.0

        return {
            "scenario_name": self.scenario.scenario_metadata.city_name,
            "fictional_population": self.scenario.scenario_metadata.fictional_population,
            "persona": persona,
            "total_assets": total_assets,
            "critical_count": crit_count,
            "high_count": high_count,
            "medium_count": med_count,
            "low_count": low_count,
            "average_risk": avg_risk,
            "max_risk": round(max_risk, 1),
            "total_mld_at_risk": total_mld,
            "total_mw_at_risk": total_mw,
            "critical_reserve_hours_min": min_reserve,
            "assets": asset_responses,
        }
