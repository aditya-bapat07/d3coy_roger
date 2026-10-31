"""
City registry for Vidura: base plan for the 10 most populous Indian metropolitan areas.

Each city reuses the Navanagar reference topology (same ICS/OT + IT asset archetype)
and rescales population-driven consequence inputs (people served per service) to the
city's metropolitan population. Populations are approximate, rounded urban-agglomeration
estimates and are scenario assumptions, not official statistics.
"""
import copy
from typing import Any, Dict, List

BASE_CITY_ID = "navanagar"
BASE_POPULATION = 500_000

# population: approximate metro/urban-agglomeration population (people)
CITIES: List[Dict[str, Any]] = [
    {"id": "delhi", "name": "Delhi NCR", "state": "Delhi", "population": 33_000_000,
     "power_utility": "Delhi DISCOMs", "water_utility": "Delhi Jal Board"},
    {"id": "mumbai", "name": "Mumbai", "state": "Maharashtra", "population": 21_700_000,
     "power_utility": "BEST / Tata Power", "water_utility": "BMC Hydraulic Dept."},
    {"id": "kolkata", "name": "Kolkata", "state": "West Bengal", "population": 15_600_000,
     "power_utility": "CESC", "water_utility": "Kolkata Municipal Corporation"},
    {"id": "bengaluru", "name": "Bengaluru", "state": "Karnataka", "population": 14_000_000,
     "power_utility": "BESCOM", "water_utility": "BWSSB"},
    {"id": "chennai", "name": "Chennai", "state": "Tamil Nadu", "population": 11_500_000,
     "power_utility": "TANGEDCO", "water_utility": "CMWSSB"},
    {"id": "hyderabad", "name": "Hyderabad", "state": "Telangana", "population": 11_000_000,
     "power_utility": "TSSPDCL", "water_utility": "HMWSSB"},
    {"id": "ahmedabad", "name": "Ahmedabad", "state": "Gujarat", "population": 8_900_000,
     "power_utility": "Torrent Power", "water_utility": "AMC Water Supply"},
    {"id": "surat", "name": "Surat", "state": "Gujarat", "population": 8_000_000,
     "power_utility": "DGVCL", "water_utility": "SMC Water Works"},
    {"id": "pune", "name": "Pune", "state": "Maharashtra", "population": 7_400_000,
     "power_utility": "MSEDCL", "water_utility": "PMC Water Supply"},
    {"id": "lucknow", "name": "Lucknow", "state": "Uttar Pradesh", "population": 4_000_000,
     "power_utility": "LESA / UPPCL", "water_utility": "Lucknow Jal Sansthan"},
]

_CITY_INDEX = {c["id"]: c for c in CITIES}
_ACTIVE = {"city_id": BASE_CITY_ID}


def list_cities() -> Dict[str, Any]:
    """Registry payload for the API, including the Navanagar reference scenario."""
    base = {
        "id": BASE_CITY_ID,
        "name": "Navanagar (reference)",
        "state": "Fictional",
        "population": BASE_POPULATION,
        "power_utility": "Reference grid",
        "water_utility": "Reference water works",
    }
    return {"active": _ACTIVE["city_id"], "cities": [base] + [dict(c) for c in CITIES]}


def get_active_city_id() -> str:
    return _ACTIVE["city_id"]


def set_active_city(city_id: str) -> Dict[str, Any]:
    if city_id != BASE_CITY_ID and city_id not in _CITY_INDEX:
        raise KeyError(city_id)
    _ACTIVE["city_id"] = city_id
    return list_cities()


def apply_city_profile(raw_data: Dict[str, Any]) -> Dict[str, Any]:
    """Return scenario JSON rescaled to the active city (no-op for the reference scenario)."""
    city = _CITY_INDEX.get(_ACTIVE["city_id"])
    if city is None:
        return raw_data

    data = copy.deepcopy(raw_data)
    factor = city["population"] / BASE_POPULATION

    meta = data["scenario_metadata"]
    meta["city_name"] = city["name"]
    meta["fictional_population"] = city["population"]
    meta["description"] = (
        f"{city['name']} ({city['state']}) base plan: Navanagar reference ICS/OT topology rescaled to "
        f"~{city['population'] / 1_000_000:.1f}M people. Power: {city['power_utility']}; "
        f"Water: {city['water_utility']}. Populations and topology are scenario assumptions."
    )

    for svc in data["services"]:
        svc["people_served"] = max(1, int(round(svc["people_served"] * factor)))
    return data

