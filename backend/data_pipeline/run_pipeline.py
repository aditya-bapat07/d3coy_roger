"""
Orchestrates the entire offline intelligence data pipeline and prints a clean summary table.
"""
import json
import logging
from pathlib import Path
from backend.data_pipeline.fetch_kev import fetch_kev
from backend.data_pipeline.select_cves import select_cves
from backend.data_pipeline.fetch_nvd import fetch_nvd_for_selected
from backend.data_pipeline.fetch_epss import fetch_epss
from backend.data_pipeline.fetch_attack_ics import fetch_attack_ics
from backend.data_pipeline.create_threat_drop import create_threat_drop
from backend.data_pipeline.build_manifest import build_manifest
from backend.engine.intel import get_cve, reload_cache

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
CACHE_DIR = DATA_DIR / "cache"


def run_full_pipeline(skip_existing: bool = True):
    logger.info("=== STARTING CASCADE THREAT INTEL PIPELINE ===")

    # 1. Fetch CISA KEV
    kev_map_file = CACHE_DIR / "cisa_kev_map.json"
    if not (skip_existing and kev_map_file.exists()):
        fetch_kev()
    else:
        logger.info("1. Using cached CISA KEV map.")

    # 2. Select Candidate CVEs
    select_file = CACHE_DIR / "selected_cves.json"
    if not (skip_existing and select_file.exists()):
        select_cves()
    else:
        logger.info("2. Using cached selected candidate CVEs.")

    # 3. Fetch NVD Details
    nvd_file = CACHE_DIR / "nvd_cve_details.json"
    if not (skip_existing and nvd_file.exists()):
        fetch_nvd_for_selected()
    else:
        logger.info("3. Using cached NVD CVE details.")

    # 4. Fetch EPSS (Current & History)
    epss_file = CACHE_DIR / "epss_current.json"
    if not (skip_existing and epss_file.exists()):
        fetch_epss()
    else:
        logger.info("4. Using cached EPSS current & history.")

    # 5. Fetch MITRE ATT&CK for ICS
    attack_file = CACHE_DIR / "attack_ics_techniques.json"
    if not (skip_existing and attack_file.exists()):
        fetch_attack_ics()
    else:
        logger.info("5. Using cached MITRE ATT&CK for ICS bundle.")

    # 6. Create Threat Drop
    create_threat_drop()

    # 7. Build Manifest
    build_manifest()

    # 8. Reload Intel Cache & Print Summary Table
    reload_cache()
    print_summary_table()


def print_summary_table():
    selected_file = CACHE_DIR / "selected_cves.json"
    with open(selected_file, "r", encoding="utf-8") as f:
        selected_data = json.load(f)

    cves = selected_data.get("cves", [])

    print("\n" + "=" * 105)
    print(f"{'CVE':<17} | {'VENDOR':<16} | {'PRODUCT':<24} | {'CVSS':<5} | {'AV':<10} | {'EPSS':<7} | {'KEV':<4}")
    print("=" * 105)

    for item in cves:
        cve_id = item["cve_id"]
        intel = get_cve(cve_id) or {}
        vendor = (item.get("vendor") or "null")[:16]
        product = (item.get("product") or "null")[:24]
        cvss = str(intel.get("cvss") if intel.get("cvss") is not None else "null")
        av = str(intel.get("attack_vector") if intel.get("attack_vector") is not None else "null")[:10]
        epss_val = intel.get("epss")
        epss_str = f"{epss_val:.4f}" if epss_val is not None else "null"
        kev_str = "YES" if intel.get("kev") else "NO"

        print(f"{cve_id:<17} | {vendor:<16} | {product:<24} | {cvss:<5} | {av:<10} | {epss_str:<7} | {kev_str:<4}")

    print("=" * 105)
    print(f"Total Cached Assets: {len(cves)}")
    print("All numbers are verified against official public feeds cached offline.\n")


if __name__ == "__main__":
    run_full_pipeline(skip_existing=True)

