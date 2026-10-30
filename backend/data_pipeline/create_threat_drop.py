"""
Extract and reserve a real KEV-listed ICS CVE for the live 'new threat drops' demo.
"""
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
CACHE_DIR = DATA_DIR / "cache"

RESERVED_CVE = "CVE-2023-6448"  # Unitronics Vision PLC default password vulnerability


def create_threat_drop():
    kev_map_file = CACHE_DIR / "cisa_kev_map.json"
    nvd_file = CACHE_DIR / "nvd_cve_details.json"
    epss_file = CACHE_DIR / "epss_current.json"

    with open(kev_map_file, "r", encoding="utf-8") as f:
        kev_data = json.load(f).get("vulnerabilities", {}).get(RESERVED_CVE, {})

    nvd_data = {}
    if nvd_file.exists():
        with open(nvd_file, "r", encoding="utf-8") as f:
            nvd_data = json.load(f).get("cves", {}).get(RESERVED_CVE, {})

    epss_data = {}
    if epss_file.exists():
        with open(epss_file, "r", encoding="utf-8") as f:
            epss_data = json.load(f).get("data", {}).get(RESERVED_CVE, {})

    threat_drop = {
        "cve_id": RESERVED_CVE,
        "vendor": kev_data.get("vendorProject", "Unitronics"),
        "product": kev_data.get("product", "Vision Series PLC/HMI"),
        "vulnerability_name": kev_data.get("vulnerabilityName", "Unitronics Vision Series Default Password Vulnerability"),
        "cisa_kev": True,
        "date_added": kev_data.get("dateAdded", "2023-11-29"),
        "required_action": kev_data.get("requiredAction", "Apply mitigations per vendor instructions."),
        "due_date": kev_data.get("dueDate", "2023-12-20"),
        "cvss": nvd_data.get("cvss", 9.8),
        "vector": nvd_data.get("vector", "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"),
        "attack_vector": nvd_data.get("attack_vector", "NETWORK"),
        "epss": epss_data.get("epss", 0.05),
        "percentile": epss_data.get("percentile", 0.92),
        "nvd_description": nvd_data.get("nvd_description", kev_data.get("shortDescription")),
        "mitre_ics_technique": "T0812",  # Default Credentials / Exploit Public-Facing Application
        "technique_name": "Default Credentials",
        "narrative": "A new CISA KEV advisory has dropped for Unitronics Vision PLCs. Exploitation allows unauthenticated remote adversaries to bypass authorization and overwrite setpoints on pump logic.",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    out_path = CACHE_DIR / "threat_drop.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(threat_drop, f, indent=2)

    logger.info("Saved reserved threat drop %s to %s", RESERVED_CVE, out_path)
    return threat_drop


if __name__ == "__main__":
    create_threat_drop()

