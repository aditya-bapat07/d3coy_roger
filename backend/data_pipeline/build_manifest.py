"""
Build manifest.json summarizing all cached intelligence feeds.
"""
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
CACHE_DIR = DATA_DIR / "cache"


def build_manifest():
    manifest_entries = {}
    total_records = 0

    files_meta = {
        "cisa_kev_map.json": {
            "source_url": "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
            "description": "CISA Known Exploited Vulnerabilities Catalog (Indexed)",
            "count_key": "count",
        },
        "attack_ics_techniques.json": {
            "source_url": "https://raw.githubusercontent.com/mitre/cti/master/ics-attack/ics-attack.json",
            "description": "MITRE ATT&CK for ICS Techniques STIX Extract",
            "count_key": "count",
        },
        "selected_cves.json": {
            "source_url": "Derived from CISA KEV and NVD ICS equipment selections",
            "description": "Targeted ICS and edge remote-access candidate CVEs",
            "count_key": "total_count",
        },
        "nvd_cve_details.json": {
            "source_url": "https://services.nvd.nist.gov/rest/json/cves/2.0",
            "description": "NVD CVSS v3.x, Attack Vector, and CPE descriptions",
            "count_key": "count",
        },
        "epss_current.json": {
            "source_url": "https://api.first.org/data/v1/epss",
            "description": "FIRST Exploit Prediction Scoring System (Current Batch)",
            "count_key": "count",
        },
        "epss_history.json": {
            "source_url": "https://api.first.org/data/v1/epss?scope=time-series",
            "description": "FIRST EPSS 30-day historical time-series per CVE",
            "count_key": "count",
        },
        "threat_drop.json": {
            "source_url": "CISA KEV / NVD reserved ICS vulnerability",
            "description": "Reserved real KEV-listed ICS CVE for live demo threat drop",
            "count_key": None,
        },
    }

    for filename, meta in files_meta.items():
        filepath = CACHE_DIR / filename
        if filepath.exists():
            with open(filepath, "r", encoding="utf-8") as f:
                content = json.load(f)
            
            count = 1
            if meta["count_key"] and meta["count_key"] in content:
                count = content[meta["count_key"]]
            elif isinstance(content, dict) and "cves" in content:
                count = len(content["cves"])
            elif isinstance(content, dict) and "data" in content:
                count = len(content["data"])
            elif isinstance(content, list):
                count = len(content)

            fetched_at = content.get("fetched_at") or content.get("updated_at") or content.get("generated_at") or content.get("created_at")

            manifest_entries[filename] = {
                "file": filename,
                "description": meta["description"],
                "source_url": meta["source_url"],
                "record_count": count,
                "fetched_at": fetched_at,
                "file_size_bytes": filepath.stat().st_size,
            }
            total_records += count
        else:
            manifest_entries[filename] = {
                "file": filename,
                "status": "pending",
                "description": meta["description"],
                "source_url": meta["source_url"],
            }

    manifest = {
        "manifest_version": "1.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_files": len(manifest_entries),
        "total_records": total_records,
        "files": manifest_entries,
    }

    manifest_path = CACHE_DIR / "manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    logger.info("Manifest created at %s (%d files registered)", manifest_path, len(manifest_entries))
    return manifest


if __name__ == "__main__":
    build_manifest()

