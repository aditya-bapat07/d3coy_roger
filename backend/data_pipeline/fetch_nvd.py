"""
Fetch vulnerability details from NVD API 2.0 with rate-limiting and incremental caching.
"""
import json
import logging
import time
from datetime import datetime, timezone
from pathlib import Path
import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

NVD_API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
CACHE_DIR = DATA_DIR / "cache"


def parse_nvd_item(item: dict) -> dict:
    cve_data = item.get("cve", {})
    cve_id = cve_data.get("id")

    # English description
    descriptions = cve_data.get("descriptions", [])
    desc = None
    for d in descriptions:
        if d.get("lang") == "en":
            desc = d.get("value")
            break
    if not desc and descriptions:
        desc = descriptions[0].get("value")

    # CVSS v3.1 or v3.0 metrics
    metrics = cve_data.get("metrics", {})
    cvss_v31 = metrics.get("cvssMetricV31", [])
    cvss_v30 = metrics.get("cvssMetricV30", [])
    cvss_candidates = cvss_v31 or cvss_v30

    cvss_score = None
    cvss_vector = None
    attack_vector = None
    cvss_severity = None

    if cvss_candidates:
        # Prefer primary, else take first
        primary_metric = next((m for m in cvss_candidates if m.get("type") == "Primary"), cvss_candidates[0])
        c_data = primary_metric.get("cvssData", {})
        cvss_score = c_data.get("baseScore")
        cvss_vector = c_data.get("vectorString")
        attack_vector = c_data.get("attackVector")
        cvss_severity = c_data.get("baseSeverity")
    else:
        # Fallback to CVSS v2 if v3 is not present
        cvss_v2 = metrics.get("cvssMetricV2", [])
        if cvss_v2:
            c2_data = cvss_v2[0].get("cvssData", {})
            cvss_score = c2_data.get("baseScore")
            cvss_vector = c2_data.get("vectorString")
            attack_vector = c2_data.get("accessVector")
            cvss_severity = cvss_v2[0].get("baseSeverity")

    # CPE Criteria
    cpes = []
    configs = cve_data.get("configurations", [])
    for config in configs:
        for node in config.get("nodes", []):
            for match in node.get("cpeMatch", []):
                crit = match.get("criteria")
                if crit and crit not in cpes:
                    cpes.append(crit)

    return {
        "cve_id": cve_id,
        "nvd_description": desc,
        "cvss": float(cvss_score) if cvss_score is not None else None,
        "vector": cvss_vector,
        "attack_vector": attack_vector,
        "severity": cvss_severity,
        "cpes": cpes[:5],
        "published_date": cve_data.get("published"),
        "last_modified_date": cve_data.get("lastModified"),
    }


def fetch_nvd_for_selected():
    selected_file = CACHE_DIR / "selected_cves.json"
    if not selected_file.exists():
        raise FileNotFoundError(f"Missing {selected_file}. Run select_cves.py first.")

    with open(selected_file, "r", encoding="utf-8") as f:
        selected_data = json.load(f)

    cves_to_fetch = selected_data.get("cves", [])
    cache_file = CACHE_DIR / "nvd_cve_details.json"

    cached_results = {}
    if cache_file.exists():
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                cached_results = json.load(f).get("cves", {})
                logger.info("Loaded %d previously cached CVEs from NVD cache.", len(cached_results))
        except Exception as e:
            logger.warning("Could not read existing NVD cache: %s", e)

    dropped_cves = []
    fetch_time = datetime.now(timezone.utc).isoformat()

    with httpx.Client(timeout=30.0, follow_redirects=True) as client:
        for idx, item in enumerate(cves_to_fetch, start=1):
            cve_id = item["cve_id"]

            if cve_id in cached_results and cached_results[cve_id].get("cvss") is not None:
                logger.info("[%d/%d] Using cached NVD data for %s", idx, len(cves_to_fetch), cve_id)
                continue

            url = f"{NVD_API_URL}?cveId={cve_id}"
            logger.info("[%d/%d] Fetching %s from NVD...", idx, len(cves_to_fetch), cve_id)

            success = False
            for attempt in range(3):
                try:
                    resp = client.get(url)
                    if resp.status_code == 200:
                        data = resp.json()
                        vulns = data.get("vulnerabilities", [])
                        if vulns:
                            parsed = parse_nvd_item(vulns[0])
                            parsed["fetched_at"] = fetch_time
                            cached_results[cve_id] = parsed
                            logger.info("  -> Found %s: CVSS=%s, AV=%s", cve_id, parsed.get("cvss"), parsed.get("attack_vector"))
                            success = True
                            break
                        else:
                            logger.warning("NVD returned 0 vulnerabilities for %s. Dropping.", cve_id)
                            dropped_cves.append({"cve_id": cve_id, "reason": "No vulnerabilities in NVD response"})
                            success = True
                            break
                    elif resp.status_code == 403 or resp.status_code == 429:
                        wait_sec = 8 * (attempt + 1)
                        logger.warning("Rate limit hit (%s). Waiting %ds before retry...", resp.status_code, wait_sec)
                        time.sleep(wait_sec)
                    else:
                        logger.warning("HTTP %s for %s. Retrying...", resp.status_code, cve_id)
                        time.sleep(4)
                except Exception as ex:
                    logger.warning("Exception fetching %s (attempt %d): %s", cve_id, attempt + 1, ex)
                    time.sleep(5)

            if not success:
                logger.error("Failed to fetch %s from NVD after 3 attempts. Dropping.", cve_id)
                dropped_cves.append({"cve_id": cve_id, "reason": "Request failed after retries"})

            # Save progress incrementally
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump({
                    "source_url": NVD_API_URL,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                    "count": len(cached_results),
                    "dropped": dropped_cves,
                    "cves": cached_results,
                }, f, indent=2)

            # Polite sleep between NVD requests to respect rate limits
            time.sleep(6.0)

    logger.info("Completed NVD fetching. Cached %d CVEs, dropped %d.", len(cached_results), len(dropped_cves))
    return cached_results, dropped_cves


if __name__ == "__main__":
    fetch_nvd_for_selected()

