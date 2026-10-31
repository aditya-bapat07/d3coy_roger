"""
Unified Cyber-Physical Risk Calculation Engine for Vidura.
Integrates AttackGraphEngine (Likelihood) and DependencyGraphEngine (Consequence)
to produce 0-100 prioritised risk scores grounded in real CISA KEV/EPSS threat intelligence,
ML anomaly telemetry, and INL CCE consequence modeling.
"""
import logging
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
                "is_choke_point": asset.id in choke_ids,
                "criticality_note": asset.criticality_note,
                "scenario_assumption": True,
            })

        # Rank assets descending by risk_score
        asset_responses.sort(key=lambda x: -x["risk_score"])

        total_assets = len(asset_responses)
        avg_risk = round(total_risk / total_assets, 1) if total_assets > 0 else 0.0

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
            "assets": asset_responses,
        }
