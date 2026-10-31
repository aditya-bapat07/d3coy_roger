"""
Comprehensive Unit Tests for Vidura Cyber-Physical Risk Engine Modules.
"""
import pytest
from backend.engine.attack_graph import AttackGraphEngine
from backend.engine.choke_point import ChokePointEngine
from backend.engine.dependency_graph import DependencyGraphEngine
from backend.engine.remediation import RemediationPlanner
from backend.engine.risk_calculator import RiskCalculator
from backend.engine.what_if import WhatIfSimulationEngine


def test_dependency_counting_rules():
    """Verifies exact worked examples from docs/inputs/consequence_numbers.md."""
    dep = DependencyGraphEngine()

    # Worked check 1: Substation alone (asset_pwr_rtu controls service_feeder_substation_ss2)
    # North power, pumping, traffic, camera lost (12h). Hospital and piped water protected by buffers.
    res_sub = dep.calculate_consequence({"asset_pwr_rtu"})
    assert res_sub["max_people_affected"] == 200000
    assert res_sub["max_safety_severity"] == 3
    assert res_sub["max_outage_hours"] == 12.0
    assert "District hospital (300 beds, 20 ICU)" not in res_sub["services_lost_names"]
    assert "Piped water supply, plant service area" not in res_sub["services_lost_names"]
    assert res_sub["consequence_score"] == pytest.approx(0.5283, abs=0.01)

    # Worked check 2: Substation + Generator controller (Rule 3 override)
    # Hospital power buffer drops from 24h to 0h, hospital lost for 12h.
    res_combo = dep.calculate_consequence({"asset_pwr_rtu", "asset_hosp_gen_ctrl"})
    assert res_combo["rule_3_triggered"] is True
    assert "District hospital (300 beds, 20 ICU)" in res_combo["services_lost_names"]
    assert res_combo["max_people_affected"] == 500000
    assert res_combo["max_safety_severity"] == 4
    assert res_combo["max_outage_hours"] == 12.0
    assert res_combo["consequence_score"] == pytest.approx(0.8333, abs=0.01)

    # Worked check 3: Chlorine dosing alone (asset_water_plc_chlorine)
    # Unsafe water reaches piped supply in 3h (outage 69h), then hospital in 15h (outage 57h).
    res_chlor = dep.calculate_consequence({"asset_water_plc_chlorine"})
    assert "Chlorine dosing" in res_chlor["services_lost_names"]
    assert "Piped water supply, plant service area" in res_chlor["services_lost_names"]
    assert "District hospital (300 beds, 20 ICU)" in res_chlor["services_lost_names"]
    assert res_chlor["max_people_affected"] == 500000
    assert res_chlor["max_safety_severity"] == 4
    assert res_chlor["max_outage_hours"] == 72.0
    assert res_chlor["consequence_score"] == 1.0


def test_attack_graph_personas():
    """Verifies reachability and traversal filtering across opportunistic, nation-state, and insider personas."""
    ag = AttackGraphEngine()

    # Opportunistic: only high EPSS / KEV / default credentials, max 3 hops
    res_opp = ag.compute_likelihoods_for_persona("opportunistic")
    # Reachable should be limited to perimeter/weak assets
    assert res_opp["asset_vendor_vpn"]["reachable"] is True
    assert res_opp["asset_water_plc_chlorine"]["reachable"] is False

    # Nation-State: chains through VPN/DMZ into OT
    res_apt = ag.compute_likelihoods_for_persona("nation_state")
    assert res_apt["asset_vendor_vpn"]["reachable"] is True
    assert res_apt["asset_water_plc_chlorine"]["reachable"] is True
    assert res_apt["asset_water_plc_chlorine"]["likelihood_score"] > 0.0

    # Insider: starts at corporate workstation
    res_ins = ag.compute_likelihoods_for_persona("insider")
    assert res_ins["asset_corp_ws1"]["reachable"] is True
    assert res_ins["asset_corp_dc"]["reachable"] is True


def test_risk_calculator():
    """Verifies that Risk = Likelihood * Consequence * 100 on 0-100 scale."""
    rc = RiskCalculator()
    overview = rc.calculate_all("nation_state")

    assert overview["total_assets"] >= 28
    assert overview["max_risk"] > 0.0

    for a in overview["assets"]:
        expected_risk = round(a["likelihood_score"] * a["consequence_score"] * 100.0, 1)
        assert a["risk_score"] == pytest.approx(expected_risk, abs=0.1)
        if a["risk_score"] > 75.0:
            assert a["risk_level"] == "critical"
        elif a["risk_score"] > 50.0:
            assert a["risk_level"] == "high"
        elif a["risk_score"] > 25.0:
            assert a["risk_level"] == "medium"
        else:
            assert a["risk_level"] == "low"


def test_choke_point_engine():
    """Verifies identification of strategic bottleneck choke points."""
    choke_engine = ChokePointEngine()
    choke_res = choke_engine.identify_choke_points(top_n=5)

    assert len(choke_res["choke_points"]) == 5
    top_cp = choke_res["choke_points"][0]
    assert top_cp["betweenness_centrality"] >= 0.0
    assert "recommended_action" in top_cp
    assert top_cp["cost_engineer_hours"] > 0


def test_remediation_planner():
    """Verifies budget-constrained optimization with engineer hours constraint."""
    planner = RemediationPlanner()
    plan_10h = planner.build_plan(engineer_hours_budget=10.0)
    assert plan_10h["used_engineer_hours"] <= 10.0
    assert plan_10h["projected_aggregate_risk"] <= plan_10h["initial_aggregate_risk"]

    plan_40h = planner.build_plan(engineer_hours_budget=40.0)
    assert plan_40h["used_engineer_hours"] <= 40.0
    assert plan_40h["risk_reduction_pct"] >= plan_10h["risk_reduction_pct"]


def test_what_if_simulation():
    """Verifies delta risk evaluation for remediations and threat drops."""
    sim = WhatIfSimulationEngine()

    # Applying MFA to vendor VPN should reduce city risk
    res_mfa = sim.simulate(persona="nation_state", applied_actions=["act_mfa_vpn"])
    assert res_mfa["new_aggregate_risk"] <= res_mfa["baseline_aggregate_risk"]

    # Applying threat drop should increase risk on water PLCs
    res_drop = sim.simulate(persona="nation_state", apply_threat_drop=True)
    target_delta = next((d for d in res_drop["asset_deltas"] if d["asset_id"] == "asset_water_plc_chlorine"), None)
    assert target_delta is not None
    assert target_delta["new_risk"] >= target_delta["baseline_risk"]
