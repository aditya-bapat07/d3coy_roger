"""
Fetch CISA Known Exploited Vulnerabilities (KEV) catalog and save to raw storage.
"""
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
RAW_DIR = DATA_DIR / "raw"
CACHE_DIR = DATA_DIR / "cache"


def fetch_kev(timeout: float = 30.0) -> dict:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    logger.info("Fetching CISA KEV catalog from %s ...", KEV_URL)
    with httpx.Client(timeout=timeout, follow_redirects=True) as client:
        resp = client.get(KEV_URL)
        resp.raise_for_status()
        kev_data = resp.json()

    fetch_time = datetime.now(timezone.utc).isoformat()
    raw_path = RAW_DIR / "known_exploited_vulnerabilities.json"
    with open(raw_path, "w", encoding="utf-8") as f:
        json.dump(kev_data, f, indent=2)

    logger.info("Successfully fetched %d KEV vulnerabilities.", len(kev_data.get("vulnerabilities", [])))
    logger.info("Saved raw KEV to %s at %s", raw_path, fetch_time)

    # Also save an indexed cache for fast offline lookup
    cve_map = {}
    for vuln in kev_data.get("vulnerabilities", []):
        cve_id = vuln.get("cveID")
        if cve_id:
            cve_map[cve_id] = {
                "cveID": cve_id,
                "vendorProject": vuln.get("vendorProject"),
                "product": vuln.get("product"),
                "vulnerabilityName": vuln.get("vulnerabilityName"),
                "dateAdded": vuln.get("dateAdded"),
                "shortDescription": vuln.get("shortDescription"),
                "requiredAction": vuln.get("requiredAction"),
                "dueDate": vuln.get("dueDate"),
                "notes": vuln.get("notes"),
                "fetched_at": fetch_time,
            }

    cache_path = CACHE_DIR / "cisa_kev_map.json"
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump({
            "source_url": KEV_URL,
            "fetched_at": fetch_time,
            "catalogVersion": kev_data.get("catalogVersion"),
            "count": len(cve_map),
            "vulnerabilities": cve_map,
        }, f, indent=2)

    logger.info("Saved indexed KEV map (%d items) to %s", len(cve_map), cache_path)
    return kev_data


if __name__ == "__main__":
    fetch_kev()

