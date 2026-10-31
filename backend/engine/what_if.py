"""
What-If Scenario Simulation Engine for Vidura.
Evaluates the quantitative impact of proposed remediations, threat intelligence drops,
and live network anomaly injections on city-wide cyber-physical risk.
"""
import copy
import logging
from typing import Any, Dict, List, Optional, Set
from backend.engine.risk_calculator import RiskCalculator
from backend.engine.scenario import ScenarioModel, load_assumptions, load_scenario

logger = logging.getLogger(__name__)

THREAT_DROP_CVE = "CVE-2023-6448"


class WhatIfSimulationEngine:
    def __init__(
        self,
        scenario: Optional[ScenarioModel] = None,
        assumptions: Optional[dict] = None,
    ):
        self.base_scenario = scenario or load_scenario(validate_cves=False)
        self.assumptions = assumptions or load_assumptions()

    def simulate(
        self,
        persona: str = "nation_state",
        applied_actions: Optional[List[str]] = None,
        apply_threat_drop: bool = False,
        injected_anomalies: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Runs before-and-after risk calculations given a set of applied mitigation actions,
        threat drop injection, and anomaly injections.
        """
        applied_actions = applied_actions or []
        injected_anomalies = injected_anomalies or []

        # 1. Baseline calculation
        base_rc = RiskCalculator(
            scenario=self.base_scenario,
            assumptions=self.assumptions,
            threat_drop_cve=None,
            injected_anomalies={},
        )
        base_overview = base_rc.calculate_all(persona=persona)

        # 2. Build modified scenario
        mod_scenario = copy.deepcopy(self.base_scenario)
        applied_set = set(applied_actions)

        # Apply mitigations to mod_scenario
        # 1. MFA on vendor VPN Gateway
        if any("mfa" in act for act in applied_set) or "act_mfa_vpn" in applied_set:
            for asset in mod_scenario.assets:
                if asset.id == "asset_vendor_vpn":
                    asset.cves = []  # Remediated
                    asset.remote_access = False
            # Remove direct bypass into water SCADA
            mod_scenario.network_rules = [
                r for r in mod_scenario.network_rules
                if r.id != "misconfig_vendor_vpn_to_water_scada"
            ]

        # 2. Micro-segmentation on DMZ Jump / Historian
        if any("seg" in act for act in applied_set) or "act_seg_jump" in applied_set or "act_seg_historian" in applied_set:
            mod_scenario.network_rules = [
                r for r in mod_scenario.network_rules
                if r.id not in {"misconfig_dmz_historian_to_water_hmi", "misconfig_vendor_vpn_to_water_scada"}
            ]

        # 3. Patch Citizen Web Portal
        if "act_patch_web" in applied_set or any("web" in act for act in applied_set):
            for asset in mod_scenario.assets:
                if asset.id == "asset_corp_web":
                    asset.cves = []

        # 4. Patch Active Directory DC
        if "act_patch_dc" in applied_set or any("dc" in act for act in applied_set):
            for asset in mod_scenario.assets:
                if asset.id == "asset_corp_dc":
                    asset.cves = []

        # 5. Disable default credentials / restrict traffic controller
        if "act_disable_default_creds" in applied_set:
            for asset in mod_scenario.assets:
                if asset.id == "asset_city_traffic_ctrl":
                    asset.default_credentials = False
            mod_scenario.network_rules = [
                r for r in mod_scenario.network_rules
                if r.id != "misconfig_corp_ws1_to_traffic_ctrl"
            ]

        # 6. Enhanced monitoring on water PLC (compensating control, raises detection / restricts registers)
        if "act_mon_water_plc" in applied_set:
            for asset in mod_scenario.assets:
                if asset.id == "asset_water_plc_chlorine":
                    asset.cves = asset.cves[:1]  # Reduced attack surface

        # Prepare anomaly injections map
        anomalies_map = {asset_id: 0.95 for asset_id in injected_anomalies}

        # 3. New calculation
        threat_cve = THREAT_DROP_CVE if apply_threat_drop else None
        mod_rc = RiskCalculator(
            scenario=mod_scenario,
            assumptions=self.assumptions,
            threat_drop_cve=threat_cve,
            injected_anomalies=anomalies_map,
        )
        mod_overview = mod_rc.calculate_all(persona=persona)

        # 4. Compute deltas
        base_map = {a["asset_id"]: a for a in base_overview["assets"]}
        asset_deltas = []

        for new_a in mod_overview["assets"]:
            a_id = new_a["asset_id"]
            orig_a = base_map.get(a_id, new_a)

            orig_risk = orig_a["risk_score"]
            new_risk = new_a["risk_score"]
            delta = round(new_risk - orig_risk, 1)

            asset_deltas.append({
                "asset_id": a_id,
                "name": new_a["name"],
                "baseline_risk": orig_risk,
                "new_risk": new_risk,
                "delta_risk": delta,
                "baseline_level": orig_a["risk_level"],
                "new_level": new_a["risk_level"],
            })

        asset_deltas.sort(key=lambda x: -abs(x["delta_risk"]))

        base_agg = base_overview["average_risk"]
        new_agg = mod_overview["average_risk"]
        delta_agg = round(new_agg - base_agg, 1)

        return {
            "persona": persona,
            "baseline_aggregate_risk": base_agg,
            "new_aggregate_risk": new_agg,
            "delta_aggregate_risk": delta_agg,
            "applied_actions_count": len(applied_actions),
            "threat_drop_active": apply_threat_drop,
            "asset_deltas": asset_deltas,
        }
