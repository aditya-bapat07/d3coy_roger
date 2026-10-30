"""
Scenario and Assumptions Loader & Validator.
Enforces strict Pydantic schemas, verifies all CVEs against the offline cache,
and validates that attack and dependency graphs contain no dangling references.
"""
import json
import logging
from pathlib import Path
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field, field_validator

from backend.engine.intel import get_cve, list_cached_cves

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
SCENARIO_FILE = DATA_DIR / "scenario.json"
ASSUMPTIONS_FILE = DATA_DIR / "assumptions.json"


class AssetModel(BaseModel):
    id: str
    name: str
    type: str
    site: Literal["power", "water", "hospital", "city", "corporate", "vendor", "external"]
    purdue_level: Literal["INTERNET", "L4", "L3.5", "L3", "L2", "L1", "L0"]
    vendor: str
    product: str
    version: str
    cves: List[str] = Field(default_factory=list)
    internet_exposed: bool = False
    remote_access: bool = False
    default_credentials: bool = False
    patchable_now: bool = True
    next_maintenance_window_days: int = 0
    criticality_note: str = ""
    anomaly_score: float = 0.0


class ServiceModel(BaseModel):
    id: str
    name: str
    site: str
    people_served: int
    safety_severity: int = Field(ge=0, le=4)
    baseline_outage_hours: float
    backup: str
    reason: str
    scenario_assumption: bool = True


class NetworkRuleModel(BaseModel):
    id: str
    from_asset: str
    to_asset: str
    protocol: str
    port: str
    justification: str
    misconfiguration: bool = False


class DependencyModel(BaseModel):
    from_node: str
    to_node: str
    type: Literal["powers", "controls", "supplies_water", "monitors"]
    failure_delay_hours: float = 0.0
    reason: str
    scenario_assumption: bool = True


class ScenarioMetadataModel(BaseModel):
    city_name: str
    fictional_population: int
    scenario_assumption: bool = True
    description: str
    version: str = "1.0"


class ScenarioModel(BaseModel):
    scenario_metadata: ScenarioMetadataModel
    assets: List[AssetModel]
    services: List[ServiceModel]
    network_rules: List[NetworkRuleModel]
    dependencies: List[DependencyModel]


def load_assumptions() -> dict:
    """Loads and returns data/assumptions.json."""
    if not ASSUMPTIONS_FILE.exists():
        raise FileNotFoundError(f"Assumptions file missing: {ASSUMPTIONS_FILE}")
    with open(ASSUMPTIONS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def load_scenario(validate_cves: bool = True) -> ScenarioModel:
    """
    Loads data/scenario.json into validated Pydantic models.
    Validates:
      1. Every CVE ID exists in the offline threat intelligence cache.
      2. No dangling asset references in network_rules (attack graph edges).
      3. No dangling node references in dependencies (dependency graph edges).
    """
    if not SCENARIO_FILE.exists():
        raise FileNotFoundError(f"Scenario file missing: {SCENARIO_FILE}")

    with open(SCENARIO_FILE, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    scenario = ScenarioModel(**raw_data)

    asset_ids = {a.id for a in scenario.assets}
    service_ids = {s.id for s in scenario.services}
    all_known_nodes = asset_ids | service_ids

    # 1. Validate CVEs
    if validate_cves:
        cached_cves = set(list_cached_cves())
        for asset in scenario.assets:
            for cve in asset.cves:
                cve_clean = cve.strip()
                if cve_clean not in cached_cves:
                    raise ValueError(
                        f"Validation Error: Asset '{asset.id}' ({asset.name}) references CVE '{cve_clean}', "
                        f"which is NOT present in the offline intelligence cache!"
                    )

    # 2. Validate Network Rules (Attack Graph)
    for rule in scenario.network_rules:
        if rule.from_asset not in asset_ids:
            raise ValueError(
                f"Validation Error in Network Rule '{rule.id}': from_asset '{rule.from_asset}' does not exist!"
            )
        if rule.to_asset not in asset_ids:
            raise ValueError(
                f"Validation Error in Network Rule '{rule.id}': to_asset '{rule.to_asset}' does not exist!"
            )

    # 3. Validate Dependencies
    for dep in scenario.dependencies:
        if dep.from_node not in all_known_nodes:
            raise ValueError(
                f"Validation Error in Dependency '{dep.from_node} -> {dep.to_node}': from_node '{dep.from_node}' does not exist!"
            )
        if dep.to_node not in all_known_nodes:
            raise ValueError(
                f"Validation Error in Dependency '{dep.from_node} -> {dep.to_node}': to_node '{dep.to_node}' does not exist!"
            )

    logger.info("Successfully loaded and validated Navanagar scenario: %d assets, %d services, %d network rules, %d dependencies.",
                len(scenario.assets), len(scenario.services), len(scenario.network_rules), len(scenario.dependencies))
    return scenario


def analyze_kev_floor_impact():
    """
    Evaluates how many assets in the scenario are driven by the KEV floor
    versus pure EPSS.
    """
    scenario = load_scenario(validate_cves=True)
    assumptions = load_assumptions()
    kev_floor = assumptions.get("parameters", {}).get("kev_floor", {}).get("value", 0.5)

    kev_assets = []
    non_kev_assets = []

    for asset in scenario.assets:
        if not asset.cves:
            continue
        has_kev = False
        max_epss = 0.0
        for cve_id in asset.cves:
            intel = get_cve(cve_id)
            if intel and intel.get("kev"):
                has_kev = True
            if intel and intel.get("epss"):
                max_epss = max(max_epss, float(intel.get("epss", 0.0)))
        
        info = {
            "id": asset.id,
            "name": asset.name,
            "purdue": asset.purdue_level,
            "has_kev": has_kev,
            "max_epss": max_epss,
            "effective_prob": max(kev_floor, max_epss) if has_kev else max_epss,
        }
        if has_kev:
            kev_assets.append(info)
        else:
            non_kev_assets.append(info)

    # Sort all assets by effective probability
    all_vuln_assets = sorted(kev_assets + non_kev_assets, key=lambda x: -x["effective_prob"])
    top_10 = all_vuln_assets[:10]
    top_10_kev_dependent = [a for a in top_10 if a["has_kev"] and a["max_epss"] < kev_floor]

    print("\n" + "=" * 80)
    print("KEV_FLOOR SENSITIVITY & IMPACT ANALYSIS")
    print("=" * 80)
    print(f"KEV Floor Parameter: {kev_floor}")
    print(f"Total Vulnerable Assets: {len(all_vuln_assets)}")
    print(f"KEV-bearing Assets: {len(kev_assets)}")
    print(f"Non-KEV Assets: {len(non_kev_assets)}")
    print(f"Top 10 High-Probability Assets depending on KEV_FLOOR ({kev_floor}): {len(top_10_kev_dependent)} / 10")
    print("\nTop 10 High-Probability Vulnerable Assets:")
    print(f"{'Asset ID':<26} | {'Purdue':<8} | {'KEV':<5} | {'Raw EPSS':<8} | {'Effective P':<11}")
    print("-" * 80)
    for a in top_10:
        kev_flag = "YES" if a["has_kev"] else "NO"
        dep_note = " (Floored)" if (a["has_kev"] and a["max_epss"] < kev_floor) else ""
        print(f"{a['id']:<26} | {a['purdue']:<8} | {kev_flag:<5} | {a['max_epss']:<8.4f} | {a['effective_prob']:<11.4f}{dep_note}")
    print("=" * 80 + "\n")

    return {
        "kev_floor": kev_floor,
        "total_vulnerable": len(all_vuln_assets),
        "kev_count": len(kev_assets),
        "top_10_kev_dependent_count": len(top_10_kev_dependent),
    }


if __name__ == "__main__":
    analyze_kev_floor_impact()
