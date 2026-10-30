"""
Fetch FIRST EPSS scores (current batched, and 30-day historical time-series).
"""
import json
import logging
import time
from datetime import datetime, timezone
from pathlib import Path
import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

EPSS_API_URL = "https://api.first.org/data/v1/epss"
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
CACHE_DIR = DATA_DIR / "cache"


def fetch_epss():
    # Read kept CVEs from nvd_cve_details.json or selected_cves.json
    nvd_file = CACHE_DIR / "nvd_cve_details.json"
    selected_file = CACHE_DIR / "selected_cves.json"

    cve_ids = []
    if nvd_file.exists():
        with open(nvd_file, "r", encoding="utf-8") as f:
            nvd_data = json.load(f)
            cve_ids = list(nvd_data.get("cves", {}).keys())

    if not cve_ids and selected_file.exists():
        with open(selected_file, "r", encoding="utf-8") as f:
            sel_data = json.load(f)
            cve_ids = [c["cve_id"] for c in sel_data.get("cves", [])]

    if not cve_ids:
        raise ValueError("No CVE IDs found to query EPSS for!")

    logger.info("Fetching current EPSS for %d CVEs...", len(cve_ids))
    fetch_time = datetime.now(timezone.utc).isoformat()

    # Batch current EPSS
    batch_size = 50
    current_map = {}
    with httpx.Client(timeout=30.0, follow_redirects=True) as client:
        for i in range(0, len(cve_ids), batch_size):
            chunk = cve_ids[i:i + batch_size]
            cve_param = ",".join(chunk)
            url = f"{EPSS_API_URL}?cve={cve_param}"
            resp = client.get(url)
            resp.raise_for_status()
            data = resp.json().get("data", [])
            for row in data:
                cve = row.get("cve")
                current_map[cve] = {
                    "cve": cve,
                    "epss": float(row.get("epss", 0.0)),
                    "percentile": float(row.get("percentile", 0.0)),
                    "date": row.get("date"),
                    "fetched_at": fetch_time,
                }

    # Save epss_current.json
    curr_path = CACHE_DIR / "epss_current.json"
    with open(curr_path, "w", encoding="utf-8") as f:
        json.dump({
            "source_url": EPSS_API_URL,
            "fetched_at": fetch_time,
            "count": len(current_map),
            "data": current_map,
        }, f, indent=2)
    logger.info("Saved current EPSS for %d CVEs to %s", len(current_map), curr_path)

    # Fetch 30-day time-series for each CVE
    logger.info("Fetching 30-day EPSS history for %d CVEs...", len(cve_ids))
    history_map = {}
    with httpx.Client(timeout=30.0, follow_redirects=True) as client:
        for idx, cve_id in enumerate(cve_ids, start=1):
            url = f"{EPSS_API_URL}?cve={cve_id}&scope=time-series"
            for attempt in range(3):
                try:
                    resp = client.get(url)
                    if resp.status_code == 200:
                        data = resp.json().get("data", [])
                        if data:
                            history_list = data[0].get("time-series", [])
                            # Sort chronologically
                            formatted_history = []
                            for entry in history_list:
                                formatted_history.append({
                                    "date": entry.get("date"),
                                    "epss": float(entry.get("epss", 0.0)),
                                    "percentile": float(entry.get("percentile", 0.0)),
                                })
                            formatted_history.sort(key=lambda x: x["date"])
                            history_map[cve_id] = formatted_history
                        break
                    else:
                        time.sleep(1.0)
                except Exception as ex:
                    logger.warning("Error fetching history for %s: %s", cve_id, ex)
                    time.sleep(1.0)
            time.sleep(0.2)  # fast polite throttle

    hist_path = CACHE_DIR / "epss_history.json"
    with open(hist_path, "w", encoding="utf-8") as f:
        json.dump({
            "source_url": f"{EPSS_API_URL}?scope=time-series",
            "fetched_at": fetch_time,
            "count": len(history_map),
            "data": history_map,
        }, f, indent=2)
    logger.info("Saved 30-day EPSS history for %d CVEs to %s", len(history_map), hist_path)

    return current_map, history_map


if __name__ == "__main__":
    fetch_epss()

