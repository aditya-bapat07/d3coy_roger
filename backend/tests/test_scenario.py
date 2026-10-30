"""
Tests for scenario and assumptions loading, graph consistency, and CVE verification.
"""
import json
import pytest
from backend.engine.scenario import load_scenario, load_assumptions, analyze_kev_floor_impact
from backend.engine.intel import get_cve, list_cached_cves


def test_scenario_loads_cleanly():
    scenario = load_scenario(validate_cves=True)
    assert scenario.scenario_metadata.city_name == "Navanagar"
    assert len(scenario.assets) >= 25
    assert len(scenario.services) >= 10
    assert len(scenario.network_rules) >= 15
    assert len(scenario.dependencies) >= 10


def test_every_cve_in_scenario_exists_in_cache():
    scenario = load_scenario(validate_cves=False)
    cached_cves = set(list_cached_cves())

    total_cves_checked = 0
    for asset in scenario.assets:
        for cve_id in asset.cves:
            total_cves_checked += 1
            assert cve_id in cached_cves, f"CVE {cve_id} on asset {asset.id} not found in offline intel cache!"
            intel = get_cve(cve_id)
            assert intel is not None, f"Intel lookup for {cve_id} returned None!"
            assert intel["cve_id"] == cve_id

    assert total_cves_checked > 0, "No CVEs found in scenario assets!"


def test_no_dangling_network_rules():
    scenario = load_scenario(validate_cves=True)
    asset_ids = {a.id for a in scenario.assets}
    for rule in scenario.network_rules:
        assert rule.from_asset in asset_ids, f"Network rule {rule.id} has invalid from_asset {rule.from_asset}"
        assert rule.to_asset in asset_ids, f"Network rule {rule.id} has invalid to_asset {rule.to_asset}"


def test_no_dangling_dependencies():
    scenario = load_scenario(validate_cves=True)
    known_nodes = {a.id for a in scenario.assets} | {s.id for s in scenario.services}
    for dep in scenario.dependencies:
        assert dep.from_node in known_nodes, f"Dependency from_node {dep.from_node} is unknown"
        assert dep.to_node in known_nodes, f"Dependency to_node {dep.to_node} is unknown"


def test_scenario_assumptions_labeled():
    scenario = load_scenario(validate_cves=True)
    assert scenario.scenario_metadata.scenario_assumption is True
    for s in scenario.services:
        assert s.scenario_assumption is True, f"Service {s.id} missing scenario_assumption flag"
    for d in scenario.dependencies:
        assert d.scenario_assumption is True, f"Dependency {d.from_node}->{d.to_node} missing scenario_assumption flag"


def test_assumptions_content():
    assumptions = load_assumptions()
    params = assumptions.get("parameters", {})
    assert "kev_floor" in params
    assert params["kev_floor"]["value"] == 0.5
    assert "credential_weakness_probabilities" in params
    assert "anomaly_boost_alpha" in params
    assert "consequence_weights" in params
    assert "personas" in params


def test_kev_floor_analysis_runs():
    impact = analyze_kev_floor_impact()
    assert impact["kev_floor"] == 0.5
    assert impact["total_vulnerable"] > 0
