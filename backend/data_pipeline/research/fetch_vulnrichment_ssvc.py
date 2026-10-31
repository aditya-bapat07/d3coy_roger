"""Fetch CISA's own SSVC decision inputs (Exploitation, Automatable, Technical Impact) for a list of CVEs
from CISA's Vulnrichment repository (github.com/cisagov/vulnrichment, CISA-ADP container).

Usage:  python fetch_vulnrichment_ssvc.py CVE-2023-6448 CVE-2021-22681 ... > data/cache/vulnrichment_ssvc.json
        python fetch_vulnrichment_ssvc.py --file cves.txt > data/cache/vulnrichment_ssvc.json

Standard library only. A CVE that CISA has not enriched is returned with "assessed": false; never fill it in by hand.
Path rule (verified on the repo tree): <year>/<number // 1000>xxx/CVE-<year>-<number>.json, e.g. 2023/6xxx/CVE-2023-6448.json.
"""
import json
import sys
import urllib.request
from datetime import datetime, timezone

BASE = "https://raw.githubusercontent.com/cisagov/vulnrichment/develop"


def path_for(cve):
    _, year, num = cve.upper().split("-")
    return f"{year}/{int(num) // 1000}xxx/CVE-{year}-{num}.json"


def fetch(cve):
    url = f"{BASE}/{path_for(cve)}"
    rec = {"cve": cve.upper(), "source_url": url, "assessed": False}
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            d = json.load(r)
    except Exception as e:  # 404 = not in Vulnrichment
        rec["error"] = str(e)
        return rec
    for adp in d.get("containers", {}).get("adp", []):
        if adp.get("providerMetadata", {}).get("shortName") != "CISA-ADP":
            continue
        for m in adp.get("metrics", []):
            o = m.get("other", {})
            if o.get("type") == "ssvc":
                c = o["content"]
                for opt in c.get("options", []):
                    rec.update({k.lower().replace(" ", "_"): v for k, v in opt.items()})
                rec.update(assessed=True, ssvc_role=c.get("role"), ssvc_version=c.get("version"),
                           cisa_timestamp=c.get("timestamp"))
    return rec


if __name__ == "__main__":
    args = sys.argv[1:]
    if args[:1] == ["--file"]:
        args = [l.strip() for l in open(args[1]) if l.strip()]
    out = {"source": "CISA Vulnrichment (CISA-ADP SSVC), github.com/cisagov/vulnrichment",
           "fetched_at": datetime.now(timezone.utc).isoformat(), "records": [fetch(c) for c in args]}
    json.dump(out, sys.stdout, indent=1)
