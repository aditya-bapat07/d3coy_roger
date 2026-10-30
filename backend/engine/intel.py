"""
Threat Intelligence Loader Module.
Reads exclusively from data/cache/ to ensure 100% offline predictability.
"""
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
CACHE_DIR = DATA_DIR / "cache"

_CACHE: Dict[str, Any] = {
    "cves": None,
    "epss_current": None,
    "epss_history": None,
    "cisa_kev": None,
    "techniques": None,
}


def _load_cache():
    if _CACHE["cves"] is not None:
        return

    # Load NVD CVEs
    nvd_path = CACHE_DIR / "nvd_cve_details.json"
    if nvd_path.exists():
        with open(nvd_path, "r", encoding="utf-8") as f:
            _CACHE["cves"] = json.load(f).get("cves", {})
    else:
        _CACHE["cves"] = {}

    # Load CISA KEV
    kev_path = CACHE_DIR / "cisa_kev_map.json"
    if kev_path.exists():
        with open(kev_path, "r", encoding="utf-8") as f:
            _CACHE["cisa_kev"] = json.load(f).get("vulnerabilities", {})
    else:
        _CACHE["cisa_kev"] = {}

    # Load EPSS Current
    epss_curr_path = CACHE_DIR / "epss_current.json"
    if epss_curr_path.exists():
        with open(epss_curr_path, "r", encoding="utf-8") as f:
            _CACHE["epss_current"] = json.load(f).get("data", {})
    else:
        _CACHE["epss_current"] = {}

    # Load EPSS History
    epss_hist_path = CACHE_DIR / "epss_history.json"
    if epss_hist_path.exists():
        with open(epss_hist_path, "r", encoding="utf-8") as f:
            _CACHE["epss_history"] = json.load(f).get("data", {})
    else:
        _CACHE["epss_history"] = {}

    # Load MITRE ATT&CK for ICS Techniques
    tech_path = CACHE_DIR / "attack_ics_techniques.json"
    if tech_path.exists():
        with open(tech_path, "r", encoding="utf-8") as f:
            _CACHE["techniques"] = json.load(f).get("techniques", {})
    else:
        _CACHE["techniques"] = {}


def reload_cache():
    """Forces cache refresh from disk."""
    for key in _CACHE:
        _CACHE[key] = None
    _load_cache()


def get_cve(cve_id: str) -> Optional[Dict[str, Any]]:
    """
    Returns enriched threat intelligence for a CVE from local cache.
    Returns:
        {cvss, vector, attack_vector, epss, percentile, kev,
         kev_date_added, kev_required_action, nvd_description, fetched_at}
    """
    _load_cache()
    cve_id = cve_id.strip()

    nvd_info = _CACHE["cves"].get(cve_id, {})
    kev_info = _CACHE["cisa_kev"].get(cve_id, {})
    epss_info = _CACHE["epss_current"].get(cve_id, {})

    if not nvd_info and not kev_info and not epss_info:
        return None

    is_kev = bool(kev_info)

    return {
        "cve_id": cve_id,
        "cvss": nvd_info.get("cvss"),
        "vector": nvd_info.get("vector"),
        "attack_vector": nvd_info.get("attack_vector"),
        "epss": epss_info.get("epss"),
        "percentile": epss_info.get("percentile"),
        "kev": is_kev,
        "kev_date_added": kev_info.get("dateAdded"),
        "kev_required_action": kev_info.get("requiredAction"),
        "nvd_description": nvd_info.get("nvd_description") or kev_info.get("shortDescription"),
        "fetched_at": nvd_info.get("fetched_at") or epss_info.get("fetched_at") or kev_info.get("fetched_at"),
    }


def get_epss_history(cve_id: str) -> List[Dict[str, Any]]:
    """
    Returns ~30 day EPSS score and percentile history for a CVE.
    """
    _load_cache()
    cve_id = cve_id.strip()
    return _CACHE["epss_history"].get(cve_id, [])


def get_technique(technique_id: str) -> Optional[Dict[str, Any]]:
    """
    Returns details for a MITRE ATT&CK for ICS technique.
    """
    _load_cache()
    technique_id = technique_id.strip()
    return _CACHE["techniques"].get(technique_id)


def list_cached_cves() -> List[str]:
    """Returns list of all CVE IDs present in the local cache."""
    _load_cache()
    cve_set = set(_CACHE["cves"].keys()) | set(_CACHE["epss_current"].keys())
    return sorted(list(cve_set))

