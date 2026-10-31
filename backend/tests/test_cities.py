"""Tests for the multi-city base plan (top-10 Indian metros)."""
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def _reset_city():
    client.post("/api/city/select", json={"city_id": "navanagar"})


def test_city_registry_lists_ten_metros_plus_reference():
    res = client.get("/api/cities")
    assert res.status_code == 200
    data = res.json()
    assert len(data["cities"]) == 11
    assert data["cities"][0]["id"] == "navanagar"
    assert data["active"] == "navanagar"


def test_select_city_rescales_population_and_risk_payload():
    try:
        base = client.get("/api/risk/assets?persona=nation_state").json()
        res = client.post("/api/city/select", json={"city_id": "mumbai"})
        assert res.status_code == 200
        assert res.json()["active"] == "mumbai"

        scen = client.get("/api/scenario").json()
        assert scen["scenario_metadata"]["city_name"] == "Mumbai"
        assert scen["scenario_metadata"]["fictional_population"] == 21_700_000

        city = client.get("/api/risk/assets?persona=nation_state").json()
        assert city["fictional_population"] == 21_700_000
        assert city["total_assets"] == base["total_assets"]
        base_people = max(a["max_people_affected"] for a in base["assets"])
        city_people = max(a["max_people_affected"] for a in city["assets"])
        assert city_people > base_people
    finally:
        _reset_city()


def test_select_unknown_city_404():
    res = client.post("/api/city/select", json={"city_id": "atlantis"})
    assert res.status_code == 404
    _reset_city()

