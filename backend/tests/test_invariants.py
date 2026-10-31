"""
Invariant and Credibility Test Suite for Vidura.
Verifies:
1. Monotonicity: adding a KEV CVE never lowers risk; removing a network rule never raises likelihood.
2. Fix-never-increases-risk: applying any remediation never raises risk, and enhanced monitoring leaves risk strictly unchanged.
3. Planner-respects-budget: engineer-hours and downtime budgets are strictly respected across constraints.
4. Determinism: repeated evaluations produce bit-identical scores, rankings, and paths across all personas.
5. Cache referential integrity: every CVE and MITRE ATT&CK for ICS technique in the scenario exists in the local cache.
6. Validation file merging: running the validation script preserves keys written by other steps (e.g. recovery_greedy_vs_brute, rank_stability).
"""
import copy
import json
import pytest

from backend.engine.attack_graph import AttackGraphEngine
from backend.engine.intel import get_cve
from backend.engine.remediation import RemediationPlanner
from backend.engine.risk_calculator import RiskCalculator
from backend.engine.scenario import load_assumptions, load_scenario
from backend.engine.validation import (
    VALIDATION_FILE,
    build_validation_report,
    run_cvss_comparison,
    run_invariant_checks,
    run_sensitivity_analysis,
)
from backend.engine.what_if import WhatIfSimulationEngine


def test_invariant_monotonicity_add_kev_cve():
    """Adding a KEV-listed CVE to any asset must never decrease any asset's risk score."""
    base_sc = load_scenario(validate_cves=False)
    base_as = load_assumptions()
    base_res = RiskCalculator(scenario=base_sc, assumptions=base_as).calculate_all("nation_state")
    base_risks = {a["asset_id"]: a["risk_score"] for a in base_res["assets"]}

    kev_cve = "CVE-2023-27997"
    for asset in base_sc.assets:
        if kev_cve not in asset.cves:
            mod_sc = copy.deepcopy(base_sc)
            target = next(x for x in mod_sc.assets if x.id == asset.id)
            target.cves.append(kev_cve)
            mod_res = RiskCalculator(scenario=mod_sc, assumptions=base_as).calculate_all("nation_state")
            for m_a in mod_res["assets"]:
                assert m_a["risk_score"] + 1e-6 >= base_risks[m_a["asset_id"]], (
                    f"Adding KEV {kev_cve} to {asset.id} lowered risk on {m_a['asset_id']}"
                )


def test_invariant_monotonicity_remove_network_rule():
    """Removing a network rule must never increase attack likelihood for any asset."""
    base_sc = load_scenario(validate_cves=False)
    base_as = load_assumptions()
    base_ag = AttackGraphEngine(scenario=base_sc, assumptions=base_as)
    base_l = base_ag.compute_likelihoods_for_persona("nation_state")

    for rule in base_sc.network_rules:
        mod_sc = copy.deepcopy(base_sc)
        mod_sc.network_rules = [r for r in mod_sc.network_rules if r.id != rule.id]
        mod_ag = AttackGraphEngine(scenario=mod_sc, assumptions=base_as)
        mod_l = mod_ag.compute_likelihoods_for_persona("nation_state")
        for a_id, b_info in base_l.items():
            assert mod_l[a_id]["likelihood_raw"] <= b_info["likelihood_raw"] + 1e-9, (
                f"Removing rule {rule.id} increased likelihood on {a_id}"
            )


def test_invariant_fix_never_increases_risk_and_monitoring_unchanged():
    """Applying any remediation never raises risk, and enhanced monitoring leaves risk strictly unchanged."""
    planner = RemediationPlanner()
    sim = WhatIfSimulationEngine()

    for action in planner.generate_candidate_actions():
        res = sim.simulate(persona="nation_state", applied_actions=[action["id"]])
        assert res["new_aggregate_risk"] <= res["baseline_aggregate_risk"] + 1e-6
        for d in res["asset_deltas"]:
            assert d["new_risk"] <= d["baseline_risk"] + 1e-6

        if action["action_type"] == "enhanced_monitoring":
            assert res["new_aggregate_risk"] == pytest.approx(res["baseline_aggregate_risk"], abs=1e-6)
            for d in res["asset_deltas"]:
                assert d["new_risk"] == pytest.approx(d["baseline_risk"], abs=1e-6)
                assert d["delta_risk"] == 0.0


def test_invariant_planner_respects_budget():
    """Remediation planner strictly respects engineer-hours and downtime budgets."""
    planner = RemediationPlanner()
    for budget_h, max_down in [(1.0, None), (3.0, 0.0), (5.0, 0.5), (10.0, 1.0), (20.0, None), (40.0, 2.0)]:
        plan = planner.build_plan(engineer_hours_budget=budget_h, max_downtime_hours=max_down)
        assert plan["used_engineer_hours"] <= budget_h + 1e-6
        if max_down is not None:
            assert plan["total_downtime_hours"] <= max_down + 1e-6
        assert plan["projected_aggregate_risk"] <= plan["initial_aggregate_risk"] + 1e-6


def test_invariant_determinism():
    """Repeated evaluations across all personas yield identical scores, rankings, and paths."""
    for persona in ["opportunistic", "nation_state", "insider"]:
        r1 = RiskCalculator().calculate_all(persona)
        r2 = RiskCalculator().calculate_all(persona)
        assert r1["average_risk"] == r2["average_risk"]
        assert r1["max_risk"] == r2["max_risk"]
        assert [a["asset_id"] for a in r1["assets"]] == [a["asset_id"] for a in r2["assets"]]
        assert [a["risk_score"] for a in r1["assets"]] == [a["risk_score"] for a in r2["assets"]]
        assert [a["path_from_entry"] for a in r1["assets"]] == [a["path_from_entry"] for a in r2["assets"]]


def test_invariant_cache_referential_integrity():
    """Every CVE and MITRE ATT&CK technique in the scenario is verified against the local cache."""
    inv = run_invariant_checks()
    assert inv["all_passed"] is True
    cache_chk = next(c for c in inv["checks"] if c["id"] == "cache_referential_integrity")
    assert cache_chk["passed"] is True


def test_validation_json_merge_preserves_external_keys():
    """Saving validation.json merges into the file and preserves keys written by other steps."""
    orig_data = {}
    if VALIDATION_FILE.exists():
        with open(VALIDATION_FILE, "r", encoding="utf-8") as f:
            orig_data = json.load(f)

    try:
        seeded = dict(orig_data)
        seeded["recovery_greedy_vs_brute"] = {"matches": True, "tested_budgets": 5}
        seeded["rank_stability"] = {"stable": True}
        with open(VALIDATION_FILE, "w", encoding="utf-8") as f:
            json.dump(seeded, f, indent=2)

        merged = build_validation_report(save_and_merge=True)
        assert "recovery_greedy_vs_brute" in merged
        assert "rank_stability" in merged
        assert "invariants" in merged
        assert "sensitivity_analysis" in merged
        assert "cvss_comparison" in merged
        assert "anomaly_evaluations" in merged

        with open(VALIDATION_FILE, "r", encoding="utf-8") as f:
            disk_data = json.load(f)
        assert "recovery_greedy_vs_brute" in disk_data
        assert "rank_stability" in disk_data
    finally:
        # Restore original external keys and re-merge cleanly
        with open(VALIDATION_FILE, "w", encoding="utf-8") as f:
            json.dump(orig_data, f, indent=2)
        build_validation_report(save_and_merge=True)


def test_sensitivity_and_cvss_comparison_computed():
    """Verifies sensitivity analysis and CVSS comparison are dynamically computed."""
    sens = run_sensitivity_analysis()
    assert len(sens["parameters"]) >= 10
    for p in sens["parameters"]:
        assert -1.0 <= p["kendall_tau_minus_50"] <= 1.0
        assert -1.0 <= p["kendall_tau_plus_50"] <= 1.0

    cvss = run_cvss_comparison()
    assert len(cvss["biggest_disagreements"]) >= 4
    for d in cvss["biggest_disagreements"]:
        assert d["abs_rank_delta"] > 0
        assert len(d["computed_reason"]) > 10
