"""
OT-Realistic Remediation Planning Engine for Vidura.
Constructs priority-ranked mitigation plans under engineering and downtime budget constraints.
Respects OT maintenance windows: IT assets can be patched immediately; OT controllers receive
compensating controls (network segmentation, MFA, enhanced monitoring) without process downtime.
"""
import logging
from typing import Any, Dict, List, Optional
from backend.engine.scenario import ScenarioModel, load_assumptions, load_scenario
from backend.engine.what_if import WhatIfSimulationEngine

logger = logging.getLogger(__name__)


class RemediationPlanner:
    def __init__(
        self,
        scenario: Optional[ScenarioModel] = None,
        assumptions: Optional[dict] = None,
    ):
        self.scenario = scenario or load_scenario(validate_cves=False)
        self.assumptions = assumptions or load_assumptions()
        self.what_if_engine = WhatIfSimulationEngine(self.scenario, self.assumptions)

    def generate_candidate_actions(self) -> List[Dict[str, Any]]:
        """
        Generates standard candidate mitigation actions based on assets,
        vulnerabilities, and choke points.
        """
        candidates = [
            {
                "id": "act_mfa_vpn",
                "asset_id": "asset_vendor_vpn",
                "asset_name": "Third-Party Vendor Remote Access Gateway",
                "action_type": "mfa",
                "description": "Enforce FIDO2 Hardware MFA and geo-fenced IP whitelisting on Vendor VPN Gateway",
                "engineer_hours": 4.0,
                "downtime_hours": 0.0,
                "patchable_now": True,
                "risk_reduction": 0.35,
                "priority": 1,
            },
            {
                "id": "act_seg_jump",
                "asset_id": "asset_dmz_jump",
                "asset_name": "Operations DMZ Jump Host",
                "action_type": "segment",
                "description": "Micro-segment DMZ Jump Host: disable RDP clipboard/drive redirection and enforce ephemeral sessions",
                "engineer_hours": 3.0,
                "downtime_hours": 0.0,
                "patchable_now": True,
                "risk_reduction": 0.28,
                "priority": 2,
            },
            {
                "id": "act_patch_web",
                "asset_id": "asset_corp_web",
                "asset_name": "Municipal Citizen Web Portal",
                "action_type": "patch",
                "description": "Apply vendor security update for Apache HTTP Server (CVE-2021-41773) on Citizen Portal",
                "engineer_hours": 2.0,
                "downtime_hours": 0.5,
                "patchable_now": True,
                "risk_reduction": 0.22,
                "priority": 3,
            },
            {
                "id": "act_mon_water_plc",
                "asset_id": "asset_water_plc_chlorine",
                "asset_name": "Disinfection Chlorine Dosing Skid PLC",
                "action_type": "enhanced_monitoring",
                "description": "Deploy OT IDS sensor to collect Modbus/TCP register & process history logs (DET0776/DET0752 — detection only, raises confidence, risk reduction = 0)",
                "engineer_hours": 3.0,
                "downtime_hours": 0.0,
                "patchable_now": False,
                "risk_reduction": 0.0,
                "priority": 4,
            },
            {
                "id": "act_patch_dc",
                "asset_id": "asset_corp_dc",
                "asset_name": "Active Directory Domain Controller",
                "action_type": "patch",
                "description": "Deploy Active Directory Kerberos security update (CVE-2022-37969) during maintenance window",
                "engineer_hours": 2.0,
                "downtime_hours": 0.5,
                "patchable_now": True,
                "risk_reduction": 0.20,
                "priority": 5,
            },
            {
                "id": "act_seg_historian",
                "asset_id": "asset_dmz_historian",
                "asset_name": "Enterprise OT Process Historian",
                "action_type": "segment",
                "description": "Restrict OSIsoft PI Historian port 5450 to unidirectional read-only replica",
                "engineer_hours": 3.0,
                "downtime_hours": 0.0,
                "patchable_now": True,
                "risk_reduction": 0.15,
                "priority": 6,
            },
            {
                "id": "act_disable_default_creds",
                "asset_id": "asset_city_traffic_ctrl",
                "asset_name": "Central Traffic Management Controller",
                "action_type": "disable_remote_access",
                "description": "Rotate default credentials and restrict NTCIP controller access to municipal traffic operations fiber VLAN",
                "engineer_hours": 1.0,
                "downtime_hours": 0.0,
                "patchable_now": True,
                "risk_reduction": 0.14,
                "priority": 7,
            },
        ]
        return candidates

    def build_plan(
        self,
        engineer_hours_budget: float = 20.0,
        max_downtime_hours: Optional[float] = None,
        persona: str = "nation_state",
        apply_threat_drop: bool = False,
    ) -> Dict[str, Any]:
        """
        Builds optimal remediation plan fitting within the engineering and downtime budgets.
        """
        candidates = self.generate_candidate_actions()

        # Run baseline simulation
        base_sim = self.what_if_engine.simulate(
            persona=persona,
            applied_actions=[],
            apply_threat_drop=apply_threat_drop,
        )
        initial_risk = base_sim["baseline_aggregate_risk"]

        used_hours = 0.0
        used_downtime = 0.0
        selected_action_ids = []
        action_results = []

        # Greedy selection in priority order
        for action in candidates:
            cost_h = action["engineer_hours"]
            cost_d = action["downtime_hours"]

            can_fit_engineer = (used_hours + cost_h) <= engineer_hours_budget
            can_fit_downtime = True
            if max_downtime_hours is not None:
                can_fit_downtime = (used_downtime + cost_d) <= max_downtime_hours

            act_copy = dict(action)
            if can_fit_engineer and can_fit_downtime:
                act_copy["selected"] = True
                used_hours += cost_h
                used_downtime += cost_d
                selected_action_ids.append(action["id"])
            else:
                act_copy["selected"] = False

            action_results.append(act_copy)

        # Run simulated plan with selected actions
        plan_sim = self.what_if_engine.simulate(
            persona=persona,
            applied_actions=selected_action_ids,
            apply_threat_drop=apply_threat_drop,
        )
        projected_risk = plan_sim["new_aggregate_risk"]

        reduction_pct = 0.0
        if initial_risk > 0.0:
            reduction_pct = round(((initial_risk - projected_risk) / initial_risk) * 100.0, 1)

        return {
            "budget_hours": round(engineer_hours_budget, 1),
            "used_engineer_hours": round(used_hours, 1),
            "total_downtime_hours": round(used_downtime, 1),
            "initial_aggregate_risk": round(initial_risk, 1),
            "projected_aggregate_risk": round(projected_risk, 1),
            "risk_reduction_pct": reduction_pct,
            "actions": action_results,
        }
