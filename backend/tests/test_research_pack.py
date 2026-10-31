"""
Tests for Vidura research pack integration.
Validates loading of all research pack JSON files, hop-mapping technique verification,
and CISA bad practices count.
"""
import json
from pathlib import Path
import pytest

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
RESEARCH_DIR = DATA_DIR / "research"
SSVC_DIR = DATA_DIR / "ssvc"
CACHE_DIR = DATA_DIR / "cache"


def test_load_all_json_in_research_and_ssvc():
    """Verify that every JSON file in data/research/ and data/ssvc/ is valid and readable."""
    research_jsons = list(RESEARCH_DIR.glob("*.json"))
    ssvc_jsons = list(SSVC_DIR.glob("*.json"))
    all_jsons = research_jsons + ssvc_jsons

    assert len(all_jsons) > 0, "No JSON files found in data/research/ or data/ssvc/"

    loaded = {}
    for p in all_jsons:
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)
            assert data is not None, f"Empty JSON content in {p}"
            loaded[p.name] = data

    # Confirm key files were loaded
    assert "attack_ics_hop_mapping.json" in loaded
    assert "bad_practices.json" in loaded
    assert "csaf_ot_cve_index.json" in loaded


def test_attack_ics_hop_mapping_techniques_exist_in_cache():
    """Check that every technique ID in attack_ics_hop_mapping.json exists in cached techniques."""
    hop_mapping_path = RESEARCH_DIR / "attack_ics_hop_mapping.json"
    cache_techniques_path = CACHE_DIR / "attack_ics_techniques.json"

    assert hop_mapping_path.exists(), "attack_ics_hop_mapping.json missing"
    assert cache_techniques_path.exists(), "attack_ics_techniques.json missing from cache"

    with open(hop_mapping_path, "r", encoding="utf-8") as f:
        hop_data = json.load(f)

    with open(cache_techniques_path, "r", encoding="utf-8") as f:
        tech_data = json.load(f)

    # In cache, techniques are stored in dict keyed by technique ID
    if isinstance(tech_data, dict) and "techniques" in tech_data:
        cached_techniques = tech_data["techniques"]
        if isinstance(cached_techniques, dict):
            cached_ids = set(cached_techniques.keys())
        else:
            cached_ids = {t["id"] for t in cached_techniques}
    else:
        cached_ids = {t["id"] for t in tech_data}

    # Extract technique IDs from hop_mapping
    hop_technique_ids = set()
    for item in hop_data.get("hop_types", []):
        for t in item.get("techniques", []):
            hop_technique_ids.add(t["id"])

    for item in hop_data.get("impact_types", []):
        for t in item.get("techniques", []):
            hop_technique_ids.add(t["id"])

    assert len(hop_technique_ids) > 0, "No technique IDs found in attack_ics_hop_mapping.json"

    missing = hop_technique_ids - cached_ids
    assert not missing, f"Technique IDs in hop mapping not found in cache: {missing}"


def test_bad_practices_count():
    """Check that bad_practices.json has exactly 3 practices."""
    bad_practices_path = RESEARCH_DIR / "bad_practices.json"
    assert bad_practices_path.exists(), "bad_practices.json missing"

    with open(bad_practices_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    practices = data.get("practices", [])
    assert len(practices) == 3, f"Expected exactly 3 bad practices, found {len(practices)}"

    practice_ids = [p.get("id") for p in practices]
    assert "BP-1" in practice_ids
    assert "BP-2" in practice_ids
    assert "BP-3" in practice_ids

