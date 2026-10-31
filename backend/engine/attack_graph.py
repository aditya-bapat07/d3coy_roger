"""
Attack Graph Engine for Vidura.
Builds a directed reachability graph from network rules, calculates conditional edge exploitability
probabilities using real CISA KEV and EPSS data, incorporates ML anomaly score boosts,
implements Yen's top-k shortest paths in log-space (-log10(p)) using networkx.shortest_simple_paths,
filters paths by threat actor persona, and maps MITRE ATT&CK for ICS techniques to every traversal hop.
"""
import json
import logging
import math
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple
import networkx as nx

from backend.engine.intel import get_cve
from backend.engine.scenario import ScenarioModel, load_assumptions, load_scenario

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
HOP_MAPPING_FILE = DATA_DIR / "research" / "attack_ics_hop_mapping.json"


class AttackGraphEngine:
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
        self.asset_map = {a.id: a for a in self.scenario.assets}

        # Load MITRE ATT&CK Hop Mapping
        self.hop_mapping = {}
        if HOP_MAPPING_FILE.exists():
            with open(HOP_MAPPING_FILE, "r", encoding="utf-8") as f:
                raw_hm = json.load(f)
                for ht in raw_hm.get("hop_types", []):
                    self.hop_mapping[ht["hop_type"]] = ht

        self.g = nx.DiGraph()
        self._build_graph()

    def _determine_edge_hop_type(
        self, src: str, dst: str, protocol: str, port: str
    ) -> Tuple[str, str, str]:
        """Determines the MITRE ATT&CK hop type, technique ID, and technique name."""
        dst_asset = self.asset_map.get(dst)
        src_asset = self.asset_map.get(src)

        if src == "asset_internet":
            return "internet_exploit", "T0883", "Internet Accessible Device"

        if src == "asset_vendor_vpn" or dst == "asset_vendor_vpn":
            return "vendor_remote_access", "T0822", "External Remote Services"

        if dst_asset and dst_asset.default_credentials:
            return "default_credentials", "T1694.001", "Default Credentials"

        if dst_asset and dst_asset.purdue_level in {"L1", "L0"}:
            if protocol in {"MODBUS-TCP", "DNP3", "CIP", "ENIP", "S7COMM", "IEC-104"}:
                return "controller_command", "T1692.001", "Unauthorized Command Message"
            return "controller_logic_change", "T0843", "Program Download"

        if dst_asset and dst_asset.purdue_level in {"L2", "L3", "L3.5"}:
            if protocol in {"RDP", "SSH", "SMB", "HTTPS", "HTTP"}:
                return "remote_service_login", "T0886", "Remote Services"
            return "remote_service_exploit", "T0866", "Exploit Remote Service"

        if src_asset and src_asset.purdue_level == "L4":
            return "valid_accounts", "T0859", "Valid Accounts"

        return "remote_service_login", "T0886", "Remote Services"

    def _calculate_edge_probability(
        self,
        src: str,
        dst: str,
        protocol: str,
        port: str,
        misconfiguration: bool,
    ) -> float:
        """
        Calculates exploitability probability P(u -> v) based on target asset weaknesses,
        KEV floor, EPSS, default credentials, remote access, and ML anomaly boost.
        """
        params = self.assumptions.get("parameters", {})
        kev_floor = params.get("kev_floor", {}).get("value", 0.5)
        cred_probs = params.get("credential_weakness_probabilities", {})
        p_default_cred = cred_probs.get("default_credentials", {}).get("value", 0.9)
        p_remote_no_mfa = cred_probs.get("exposed_remote_access_no_mfa", {}).get("value", 0.3)
        alpha = params.get("anomaly_boost_alpha", {}).get("value", 0.3)
        exploit_mult = params.get("exploit_probability_multiplier", 1.0)

        dst_asset = self.asset_map.get(dst)
        if not dst_asset:
            return min(1.0, max(0.0, 0.05 * exploit_mult))

        # Check CVEs on destination asset
        cve_probs = []
        cves_to_check = list(dst_asset.cves)

        # Apply threat drop CVE if active on target
        if self.threat_drop_cve and (
            dst in {"asset_water_plc_chlorine", "asset_water_plc_pumps"} or dst == "asset_water_scada"
        ):
            if self.threat_drop_cve not in cves_to_check:
                cves_to_check.append(self.threat_drop_cve)

        for cve_id in cves_to_check:
            intel = get_cve(cve_id)
            if intel:
                epss = min(1.0, max(0.0, (intel.get("epss") or 0.0) * exploit_mult))
                is_kev = intel.get("kev", False)
                if is_kev:
                    prob = max(kev_floor, epss)
                else:
                    prob = epss if epss > 0 else min(1.0, max(0.0, 0.05 * exploit_mult))
                cve_probs.append(prob)

        if cve_probs:
            base_p = max(cve_probs)
        elif dst_asset.default_credentials:
            base_p = p_default_cred
        elif dst_asset.remote_access:
            base_p = p_remote_no_mfa
        elif misconfiguration:
            base_p = min(1.0, max(0.0, 0.4 * exploit_mult))
        else:
            base_p = min(1.0, max(0.0, 0.05 * exploit_mult))

        # Factor in anomaly score
        anomaly_score = self.injected_anomalies.get(dst, dst_asset.anomaly_score)
        if anomaly_score > 0.0:
            # P' = P + (1 - P) * alpha * anomaly_score
            p_boosted = base_p + (1.0 - base_p) * alpha * min(1.0, anomaly_score)
        else:
            p_boosted = base_p

        # Bound probability strictly in [1e-6, 0.999]
        return float(max(1e-6, min(0.999, p_boosted)))

    def _build_graph(self):
        """Constructs NetworkX directed attack graph with edge probabilities and weights."""
        for a in self.scenario.assets:
            self.g.add_node(
                a.id,
                label=a.name,
                site=a.site,
                purdue_level=a.purdue_level,
                vendor=a.vendor,
                product=a.product,
                cves=a.cves,
                anomaly_score=self.injected_anomalies.get(a.id, a.anomaly_score),
            )

        for rule in self.scenario.network_rules:
            prob = self._calculate_edge_probability(
                rule.from_asset,
                rule.to_asset,
                rule.protocol,
                rule.port,
                rule.misconfiguration,
            )
            hop_type, tech_id, tech_name = self._determine_edge_hop_type(
                rule.from_asset, rule.to_asset, rule.protocol, rule.port
            )

            # Dijkstra/Yen weight in log-space: -log10(prob) >= 0
            weight = -math.log10(prob)

            self.g.add_edge(
                rule.from_asset,
                rule.to_asset,
                id=rule.id,
                protocol=rule.protocol,
                port=rule.port,
                misconfiguration=rule.misconfiguration,
                exploit_probability=prob,
                weight=weight,
                hop_type=hop_type,
                technique_id=tech_id,
                technique_name=tech_name,
            )

    def compute_likelihoods_for_persona(
        self, persona_type: str = "nation_state"
    ) -> Dict[str, Dict[str, Any]]:
        """
        Computes the most likely attack path and normalized likelihood score for every asset
        using Yen's top-k algorithm (networkx.shortest_simple_paths) with -log10(p) weights.
        Drops edges with p = 0 before searching.
        Takes up to 50 paths per target respecting max_hops, stopping after examining 500 candidate paths.
        Returns both the single best path and top-3 paths with individual probabilities.
        """
        personas_cfg = self.assumptions.get("parameters", {}).get("personas", {})
        p_cfg = personas_cfg.get(persona_type, personas_cfg.get("nation_state", {}))

        entry_points = p_cfg.get("entry_points", ["asset_internet"])
        max_hops = p_cfg.get("max_hops", 8)

        # Opportunistic persona edge filter
        opportunistic_filter = persona_type == "opportunistic"
        opp_epss_threshold = p_cfg.get(
            "epss_threshold",
            self.assumptions.get("parameters", {}).get("opportunistic_epss_threshold", {}).get("value", 0.1),
        )

        # Insider persona internal credential boost
        internal_cred_bonus = persona_type == "insider"

        # Drop every edge with p <= 0 before searching (since -log10(0) is infinite)
        search_graph = nx.DiGraph()
        for node, data in self.g.nodes(data=True):
            search_graph.add_node(node, **data)

        for u, v, data in self.g.edges(data=True):
            p = data.get("exploit_probability", 0.0)
            if p > 0:
                # -log10(p) >= 0
                w = -math.log10(max(1e-6, min(1.0, p)))
                edge_attrs = dict(data)
                edge_attrs["weight"] = w
                search_graph.add_edge(u, v, **edge_attrs)

        results: Dict[str, Dict[str, Any]] = {}

        for asset in self.scenario.assets:
            target_id = asset.id

            if target_id in entry_points:
                results[target_id] = {
                    "reachable": True,
                    "likelihood_raw": 1.0,
                    "likelihood_score": 1.0,
                    "path": [target_id],
                    "technique_ids": [],
                    "hop_count": 0,
                    "top_3_paths": [
                        {
                            "path": [target_id],
                            "probability": 1.0,
                            "likelihood_score": 1.0,
                            "technique_ids": [],
                            "hop_count": 0,
                        }
                    ],
                }
                continue

            candidates_examined = 0
            valid_paths: List[Dict[str, Any]] = []

            for entry in entry_points:
                if not search_graph.has_node(entry) or not search_graph.has_node(target_id):
                    continue
                if not nx.has_path(search_graph, entry, target_id):
                    continue

                try:
                    # Yen's algorithm via networkx.shortest_simple_paths
                    path_gen = nx.shortest_simple_paths(
                        search_graph, source=entry, target=target_id, weight="weight"
                    )

                    for path in path_gen:
                        candidates_examined += 1
                        if candidates_examined > 500:
                            break

                        hops = len(path) - 1
                        if hops > max_hops or hops <= 0:
                            continue

                        # Check opportunistic edge filter
                        if opportunistic_filter:
                            valid_opp = True
                            for node in path[1:]:
                                v_asset = self.asset_map.get(node)
                                has_kev = False
                                epss_high = False
                                if v_asset:
                                    for cve in v_asset.cves:
                                        intel = get_cve(cve)
                                        if intel:
                                            if intel.get("kev"):
                                                has_kev = True
                                            if (intel.get("epss") or 0.0) >= opp_epss_threshold:
                                                epss_high = True
                                default_creds = v_asset.default_credentials if v_asset else False
                                if not (has_kev or epss_high or default_creds):
                                    valid_opp = False
                                    break
                            if not valid_opp:
                                continue

                        # Calculate path probability and extract techniques
                        path_prob = 1.0
                        techniques = []
                        for i in range(len(path) - 1):
                            u_node = path[i]
                            v_node = path[i + 1]
                            edge_data = search_graph[u_node][v_node]
                            edge_p = edge_data["exploit_probability"]
                            if internal_cred_bonus and (u_node.startswith("asset_corp") or u_node.startswith("asset_dmz")):
                                edge_p = max(edge_p, 0.9)
                            path_prob *= edge_p
                            techniques.append(edge_data.get("technique_id", "T0886"))

                        path_prob = float(max(1e-6, min(1.0, path_prob)))
                        log_val = math.log10(max(path_prob, 1e-6))
                        norm_l = max(0.0, min(1.0, (log_val + 6.0) / 6.0))

                        valid_paths.append({
                            "path": path,
                            "probability": round(path_prob, 6),
                            "likelihood_score": round(norm_l, 4),
                            "technique_ids": techniques,
                            "hop_count": hops,
                        })

                        if len(valid_paths) >= 50:
                            break

                except (nx.NetworkXNoPath, nx.NodeNotFound):
                    pass

                if candidates_examined >= 500 or len(valid_paths) >= 50:
                    break

            # Sort valid paths descending by probability
            valid_paths.sort(key=lambda x: -x["probability"])

            if valid_paths:
                best = valid_paths[0]
                results[target_id] = {
                    "reachable": True,
                    "likelihood_raw": best["probability"],
                    "likelihood_score": best["likelihood_score"],
                    "path": best["path"],
                    "technique_ids": best["technique_ids"],
                    "hop_count": best["hop_count"],
                    "top_3_paths": valid_paths[:3],
                }
            else:
                results[target_id] = {
                    "reachable": False,
                    "likelihood_raw": 0.0,
                    "likelihood_score": 0.0,
                    "path": [],
                    "technique_ids": [],
                    "hop_count": 0,
                    "top_3_paths": [],
                }

        return results

    def get_graph_data(
        self, likelihood_dict: Optional[Dict[str, Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Returns Cytoscape-compatible nodes and edges for attack graph rendering."""
        likelihood_dict = likelihood_dict or self.compute_likelihoods_for_persona("nation_state")

        nodes = []
        for a in self.scenario.assets:
            l_info = likelihood_dict.get(a.id, {})
            nodes.append({
                "id": a.id,
                "label": a.name,
                "site": a.site,
                "purdue_level": a.purdue_level,
                "vendor": a.vendor,
                "product": a.product,
                "anomaly_score": round(self.injected_anomalies.get(a.id, a.anomaly_score), 3),
                "likelihood_score": l_info.get("likelihood_score", 0.0),
                "cve_count": len(a.cves),
                "cisa_kev": any(
                    bool(get_cve(c) and get_cve(c).get("kev")) for c in a.cves
                ),
                "reachable": l_info.get("reachable", False),
            })

        edges = []
        for u, v, data in self.g.edges(data=True):
            edges.append({
                "id": data.get("id", f"e_{u}_{v}"),
                "source": u,
                "target": v,
                "protocol": data.get("protocol", "TCP"),
                "port": data.get("port", "Any"),
                "exploit_probability": round(data.get("exploit_probability", 0.05), 4),
                "technique_id": data.get("technique_id"),
                "technique_name": data.get("technique_name"),
                "misconfiguration": data.get("misconfiguration", False),
            })

        return {"nodes": nodes, "edges": edges}
