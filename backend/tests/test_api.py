"""
Comprehensive API test suite for Vidura backend routes.
"""
from fastapi.testclient import TestClient
import pytest
from backend.app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"


def test_assumptions():
    res = client.get("/api/assumptions")
    assert res.status_code == 200
    data = res.json()
    assert "parameters" in data
    assert data["parameters"]["kev_floor"]["value"] == 0.5


def test_scenario():
    res = client.get("/api/scenario")
    assert res.status_code == 200
    data = res.json()
    assert "assets" in data
    assert len(data["assets"]) >= 28


def test_asset_risks():
    for persona in ["opportunistic", "nation_state", "insider"]:
        res = client.get(f"/api/risk/assets?persona={persona}")
        assert res.status_code == 200
        data = res.json()
        assert data["persona"] == persona
        assert "assets" in data
        assert len(data["assets"]) >= 28
        assert data["max_risk"] >= 0.0
        # Check first asset has required fields
        first = data["assets"][0]
        assert "asset_id" in first
        assert "risk_score" in first
        assert "consequence_score" in first
        assert "likelihood_score" in first


def test_attack_graph():
    res = client.get("/api/graph/attack?persona=nation_state")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) >= 28
    assert len(data["edges"]) >= 20


def test_dependency_graph():
    res = client.get("/api/graph/dependency")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["edges"]) >= 9


def test_choke_points():
    res = client.get("/api/choke-points")
    assert res.status_code == 200
    data = res.json()
    assert "choke_points" in data
    assert len(data["choke_points"]) > 0
    cp = data["choke_points"][0]
    assert "asset_id" in cp
    assert "betweenness_centrality" in cp
    assert "recommended_action" in cp


def test_remediation_plan():
    res = client.post("/api/remediation/plan", json={
        "engineer_hours_budget": 20.0,
        "persona": "nation_state",
        "apply_threat_drop": False,
    })
    assert res.status_code == 200
    data = res.json()
    assert "actions" in data
    assert data["budget_hours"] == 20.0
    assert data["used_engineer_hours"] <= 20.0
    assert any(a["selected"] for a in data["actions"])


def test_simulate():
    res = client.post("/api/simulate", json={
        "persona": "nation_state",
        "applied_actions": ["act_mfa_vpn", "act_seg_jump"],
        "apply_threat_drop": False,
    })
    assert res.status_code == 200
    data = res.json()
    assert "baseline_aggregate_risk" in data
    assert "new_aggregate_risk" in data
    assert data["new_aggregate_risk"] <= data["baseline_aggregate_risk"]


def test_threat_drop_flow():
    res = client.get("/api/threat-drop")
    assert res.status_code == 200
    data = res.json()
    assert data["cve_id"] == "CVE-2023-6448"
    assert data["cisa_kev"] is True

    # Toggle threat drop
    res_t = client.post("/api/threat-drop/toggle", json={"active": True})
    assert res_t.status_code == 200
    assert res_t.json()["threat_drop_active"] is True

    # Reset
    res_r = client.post("/api/session/reset")
    assert res_r.status_code == 200
    assert res_r.json()["threat_drop_active"] is False


def test_anomaly_injection():
    target = "asset_dmz_historian"
    res = client.post("/api/anomaly/inject", json={"asset_id": target})
    assert res.status_code == 200
    data = res.json()
    assert data["asset_id"] == target
    assert data["score"] >= 0.85
    assert len(data["top_contributing_features"]) > 0

    # Read anomaly endpoint
    res_g = client.get(f"/api/anomaly/{target}")
    assert res_g.status_code == 200
    data_g = res_g.json()
    assert data_g["score"] >= 0.85


def test_pdf_report_download():
    res = client.get("/api/report/pdf?persona=nation_state")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert len(res.content) > 1000
    assert res.content.startswith(b"%PDF")


def test_meta_endpoint():
    res = client.get("/api/meta")
    assert res.status_code == 200
    data = res.json()
    assert "formula_summary" in data
    assert data["formula_summary"]["risk_formula"] == "Risk = 100 × normalised likelihood × consequence"
    assert "data_sources" in data
    assert len(data["data_sources"]) >= 7
    assert "assumptions_table" in data
    assert len(data["assumptions_table"]) >= 17
    assert all(row["scenario_assumption"] is True for row in data["assumptions_table"])
    assert "limitations" in data
    assert len(data["limitations"]) >= 3
    assert "kev_floor_evidence" in data
    assert len(data["kev_floor_evidence"]["rows"]) == 6


def test_validation_endpoint():
    res = client.get("/api/validation")
    assert res.status_code == 200
    data = res.json()
    assert "invariants" in data
    assert data["invariants"]["all_passed"] is True
    assert "sensitivity_analysis" in data
    assert len(data["sensitivity_analysis"]["parameters"]) >= 10
    assert "cvss_comparison" in data
    assert len(data["cvss_comparison"]["biggest_disagreements"]) >= 4
    assert "anomaly_evaluations" in data
    assert data["anomaly_evaluations"]["synthetic_evaluation"]["label"] == "Synthetic data, injected attacks"
    assert data["anomaly_evaluations"]["hai_testbed_evaluation"]["label"] == "HAI 21.03 real testbed data"
    assert "kev_floor_evidence" in data
    assert len(data["kev_floor_evidence"]["rows"]) == 6

