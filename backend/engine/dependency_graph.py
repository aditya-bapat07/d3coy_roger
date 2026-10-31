"""
Consequence-driven Physical Dependency Cascade Engine.
Implements Idaho National Laboratory (INL) CCE principles and exact Navanagar counting rules:
1. Buffers stored once on edges as failure_delay_hours.
2. Downstream service hit only if upstream outage > delay (outage = upstream - delay).
3. Compromise of backup generator controller drops substation -> hospital delay from 24h to 0h.
4. People affected = max(people_served among lost services), not sum.
5. Consequence score = 0.5 * (severity/4) + 0.3 * (people/500k) + 0.2 * (outage/72).
"""
import logging
from typing import Any, Dict, List, Optional, Set, Tuple
import networkx as nx

from backend.engine.scenario import ScenarioModel, load_assumptions, load_scenario

logger = logging.getLogger(__name__)


class DependencyGraphEngine:
    def __init__(self, scenario: Optional[ScenarioModel] = None, assumptions: Optional[dict] = None):
        self.scenario = scenario or load_scenario(validate_cves=False)
        self.assumptions = assumptions or load_assumptions()
        self.service_map = {s.id: s for s in self.scenario.services}
        self.asset_map = {a.id: a for a in self.scenario.assets}

        # Build Dependency DiGraph
        self.g = nx.DiGraph()
        for s in self.scenario.services:
            self.g.add_node(
                s.id,
                kind="service",
                name=s.name,
                site=s.site,
                people_served=s.people_served,
                safety_severity=s.safety_severity,
                baseline_outage_hours=s.baseline_outage_hours,
                backup=s.backup,
            )

        for a in self.scenario.assets:
            self.g.add_node(
                a.id,
                kind="asset",
                name=a.name,
                site=a.site,
                purdue_level=a.purdue_level,
            )

        for d in self.scenario.dependencies:
            self.g.add_edge(
                d.from_node,
                d.to_node,
                dep_type=d.type,
                failure_delay_hours=d.failure_delay_hours,
                reason=d.reason,
            )

    def calculate_consequence(
        self, compromised_assets: Set[str]
    ) -> Dict[str, Any]:
        """
        Calculates physical cascade and consequence metrics for a set of compromised assets.
        """
        if not compromised_assets:
            return {
                "services_lost": [],
                "services_lost_names": [],
                "service_outages": {},
                "max_people_affected": 0,
                "max_safety_severity": 0,
                "max_outage_hours": 0.0,
                "consequence_score": 0.0,
            }

        # Rule 3: Check if backup generator controller is compromised
        generator_compromised = False
        r3 = self.scenario.rule_3_generator_override
        if r3 and r3.trigger_asset_id in compromised_assets:
            generator_compromised = True

        # Initialize service outages directly caused by compromised control assets
        service_outages: Dict[str, float] = {s_id: 0.0 for s_id in self.service_map}

        for asset_id in compromised_assets:
            # Find any controls edges from this asset to services
            if self.g.has_node(asset_id):
                for _, target, data in self.g.out_edges(asset_id, data=True):
                    if target in self.service_map:
                        base = self.service_map[target].baseline_outage_hours
                        service_outages[target] = max(service_outages[target], base)

        # Build sub-DAG of service-to-service dependencies
        service_edges = []
        for u, v, data in self.g.edges(data=True):
            if u in self.service_map and v in self.service_map:
                delay = data.get("failure_delay_hours", 0.0)
                # Apply Rule 3 if active
                if generator_compromised and r3:
                    if u == r3.affected_edge.from_node and v == r3.affected_edge.to_node:
                        delay = r3.compromised_failure_delay_hours
                service_edges.append((u, v, delay))

        # Propagate outages down service dependencies in topological order
        service_dag = nx.DiGraph()
        for s_id in self.service_map:
            service_dag.add_node(s_id)
        for u, v, delay in service_edges:
            service_dag.add_edge(u, v, delay=delay)

        try:
            topo_order = list(nx.topological_sort(service_dag))
        except nx.NetworkXUnfeasible:
            # Fallback if cycles exist
            topo_order = list(self.service_map.keys())

        # Forward propagation
        for node in topo_order:
            current_outage = service_outages.get(node, 0.0)
            if current_outage <= 0.0:
                continue

            for _, downstream, edge_data in service_dag.out_edges(node, data=True):
                delay = edge_data.get("delay", 0.0)
                if current_outage > delay:
                    downstream_outage = current_outage - delay
                    service_outages[downstream] = max(
                        service_outages.get(downstream, 0.0), downstream_outage
                    )

        # Collect services lost (outage > 0)
        lost_service_ids = [
            s_id for s_id, hrs in service_outages.items() if hrs > 0.0
        ]

        if not lost_service_ids:
            return {
                "services_lost": [],
                "services_lost_names": [],
                "service_outages": {},
                "max_people_affected": 0,
                "max_safety_severity": 0,
                "max_outage_hours": 0.0,
                "consequence_score": 0.0,
            }

        # Rule 4: People affected = max people_served among services lost
        max_people = max(self.service_map[s_id].people_served for s_id in lost_service_ids)
        max_severity = max(self.service_map[s_id].safety_severity for s_id in lost_service_ids)
        max_outage = max(service_outages[s_id] for s_id in lost_service_ids)

        # Normalization from assumptions.json
        c_norm = self.assumptions.get("parameters", {}).get("consequence_normalisation", {})
        sev_div = c_norm.get("severity_divisor", 4.0)
        peo_div = c_norm.get("people_divisor", 500000.0)
        out_div = c_norm.get("outage_hours_divisor", 72.0)

        s_n = min(1.0, max_severity / sev_div)
        p_n = min(1.0, max_people / peo_div)
        o_n = min(1.0, max_outage / out_div)

        weights = self.assumptions.get("parameters", {}).get("consequence_weights", {})
        w_sev = weights.get("safety_severity", 0.5)
        w_peo = weights.get("people_affected", 0.3)
        w_out = weights.get("outage_hours", 0.2)

        consequence_score = round(w_sev * s_n + w_peo * p_n + w_out * o_n, 4)

        return {
            "services_lost": lost_service_ids,
            "services_lost_names": [self.service_map[s_id].name for s_id in lost_service_ids],
            "service_outages": {s_id: round(service_outages[s_id], 1) for s_id in lost_service_ids},
            "max_people_affected": max_people,
            "max_safety_severity": max_severity,
            "max_outage_hours": round(max_outage, 1),
            "consequence_score": consequence_score,
            "rule_3_triggered": generator_compromised,
        }

    def get_graph_data(self) -> Dict[str, Any]:
        """Returns Cytoscape-compatible nodes and edges for dependency graph visualization."""
        nodes = []
        edges = []

        for s in self.scenario.services:
            nodes.append({
                "id": s.id,
                "label": s.name,
                "site": s.site,
                "type": "service",
                "people_served": s.people_served,
                "safety_severity": s.safety_severity,
                "baseline_outage_hours": s.baseline_outage_hours,
                "backup": s.backup,
            })

        for a in self.scenario.assets:
            if a.controls_service_id or a.id in {"asset_hospital_generator", "asset_pwr_rtu", "asset_water_plc_chlorine"}:
                nodes.append({
                    "id": a.id,
                    "label": a.name,
                    "site": a.site,
                    "type": "asset",
                    "people_served": 0,
                    "safety_severity": 0,
                    "baseline_outage_hours": 0.0,
                    "backup": "",
                })

        for idx, d in enumerate(self.scenario.dependencies):
            edges.append({
                "id": f"dep_edge_{idx}",
                "source": d.from_node,
                "target": d.to_node,
                "type": d.type,
                "failure_delay_hours": d.failure_delay_hours,
                "reason": d.reason,
            })

        return {"nodes": nodes, "edges": edges}
