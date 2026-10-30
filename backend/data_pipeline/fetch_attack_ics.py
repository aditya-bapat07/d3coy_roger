"""
Fetch MITRE ATT&CK for ICS STIX bundle and extract technique mapping.
"""
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

ATTACK_ICS_URL = "https://raw.githubusercontent.com/mitre/cti/master/ics-attack/ics-attack.json"
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
RAW_DIR = DATA_DIR / "raw"
CACHE_DIR = DATA_DIR / "cache"


def fetch_attack_ics(timeout: float = 45.0) -> dict:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    logger.info("Fetching MITRE ATT&CK for ICS from %s ...", ATTACK_ICS_URL)
    with httpx.Client(timeout=timeout, follow_redirects=True) as client:
        resp = client.get(ATTACK_ICS_URL)
        resp.raise_for_status()
        bundle = resp.json()

    fetch_time = datetime.now(timezone.utc).isoformat()
    raw_path = RAW_DIR / "ics_attack_stix.json"
    with open(raw_path, "w", encoding="utf-8") as f:
        json.dump(bundle, f, indent=2)

    logger.info("Saved raw ATT&CK for ICS bundle to %s", raw_path)

    # Extract attack-pattern objects (Techniques)
    techniques = {}
    objects = bundle.get("objects", [])
    for obj in objects:
        if obj.get("type") != "attack-pattern":
            continue
        if obj.get("revoked", False):
            continue

        # Look for MITRE technique ID in external_references
        ext_refs = obj.get("external_references", [])
        technique_id = None
        technique_url = None
        for ref in ext_refs:
            if ref.get("source_name") == "mitre-ics-attack":
                technique_id = ref.get("external_id")
                technique_url = ref.get("url")
                break
        
        if not technique_id:
            for ref in ext_refs:
                if ref.get("source_name") == "mitre-attack":
                    technique_id = ref.get("external_id")
                    technique_url = ref.get("url")
                    break

        if not technique_id:
            continue

        # Tactics
        kill_chain_phases = obj.get("kill_chain_phases", [])
        tactics = [phase.get("phase_name") for phase in kill_chain_phases if phase.get("phase_name")]

        techniques[technique_id] = {
            "id": technique_id,
            "name": obj.get("name"),
            "description": obj.get("description", "")[:400] + ("..." if len(obj.get("description", "")) > 400 else ""),
            "tactics": tactics,
            "url": technique_url,
            "platforms": obj.get("x_mitre_platforms", []),
            "data_sources": obj.get("x_mitre_data_sources", []),
            "fetched_at": fetch_time,
        }

    cache_path = CACHE_DIR / "attack_ics_techniques.json"
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump({
            "source_url": ATTACK_ICS_URL,
            "fetched_at": fetch_time,
            "count": len(techniques),
            "techniques": techniques,
        }, f, indent=2)

    logger.info("Extracted %d valid MITRE ATT&CK for ICS techniques to %s", len(techniques), cache_path)
    return techniques


if __name__ == "__main__":
    fetch_attack_ics()

