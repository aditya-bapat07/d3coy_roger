"""Evidence for KEV_FLOOR + real KEV shortlists for Navanagar.
Inputs (read as data): CISA KEV JSON (github.com/cisagov/kev-data), EPSS-for-KEV CSV (github.com/jgamblin/KEV_EPSS,
Apache-2.0), CISA CSAF OT CVE index (this pack). 'ICS KEV' = a KEV CVE that also appears in a CISA ICS (CSAF OT) advisory.
Usage: python kev_epss_ics_analysis.py kev.json epss_kev_nvd.csv csaf_ot_cve_index.json.gz <outdir> "<kev provenance>" "<epss provenance>"
"""
import json, sys, csv, gzip, statistics

kev_p, epss_p, csaf_p, outdir, kev_prov, epss_prov = sys.argv[1:7]
kev = json.load(open(kev_p))
K = {v["cveID"]: v for v in kev["vulnerabilities"]}
E = {r["CVE"]: r for r in csv.DictReader(open(epss_p))}
C = json.load(gzip.open(csaf_p))["index"]


def summary(cves):
    ep = sorted(float(E[c]["EPSS"]) for c in cves if c in E and E[c]["EPSS"] not in ("", None))
    n = len(ep)
    q = lambda p: round(ep[min(n - 1, int(p * (n - 1)))], 4) if n else None
    return dict(kev_cves=len(cves), with_epss=n, median=q(0.5), p25=q(0.25), p75=q(0.75),
                share_below_0_01=round(sum(x < 0.01 for x in ep) / n, 3) if n else None,
                share_below_0_1=round(sum(x < 0.1 for x in ep) / n, 3) if n else None,
                share_below_0_5=round(sum(x < 0.5 for x in ep) / n, 3) if n else None,
                ransomware_known=sum(K[c]["knownRansomwareCampaignUse"] == "Known" for c in cves))


ics = sorted(c for c in K if c in C)
SECT = ["Water and Wastewater Systems", "Energy", "Healthcare and Public Health", "Transportation Systems",
        "Government Facilities", "Emergency Services"]
by_sector = {s: sorted(c for c in ics if any(s in a["sectors"] for a in C[c])) for s in SECT}

VPN_KEYS = ["fortios", "fortigate", "fortiproxy", "connect secure", "pulse connect", "policy secure", "netscaler",
            "citrix adc", "citrix gateway", "pan-os", "globalprotect", "sonicos", "sma 100", "sma100",
            "secure mobile access", "asa", "firepower threat defense", "anyconnect", "forticlient"]
vpn = sorted(c for c, v in K.items() if any(k in (v["product"] + " " + v["vulnerabilityName"]).lower() for k in VPN_KEYS)
             and v["vendorProject"].lower() in ("fortinet", "ivanti", "pulse secure", "citrix", "palo alto networks",
                                                 "sonicwall", "cisco"))

res = dict(
    sources=dict(kev=kev_prov, epss=epss_prov, csaf="CISA CSAF OT index in this pack"),
    definition="ICS KEV = KEV CVE that also appears in a CISA ICS (CSAF OT) advisory.",
    all_kev=summary(list(K)), ics_kev=summary(ics),
    ics_kev_by_sector={s: summary(v) for s, v in by_sector.items()},
    vpn_gateway_kev=summary(vpn),
)
json.dump(res, open(f"{outdir}/kev_epss_ics_evidence.json", "w"), indent=1)

with open(f"{outdir}/kev_ics_shortlist.csv", "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["cve", "sectors", "vendor", "product", "kev_date_added", "ransomware", "epss", "epss_percentile",
                "cvss3", "cisa_ics_advisory", "advisory_title"])
    for c in ics:
        a = C[c][0]
        secs = sorted({s for x in C[c] for s in x["sectors"]})
        w.writerow([c, "; ".join(secs), K[c]["vendorProject"], K[c]["product"], K[c]["dateAdded"],
                    K[c]["knownRansomwareCampaignUse"], E.get(c, {}).get("EPSS", ""), E.get(c, {}).get("EPSS Percentile", ""),
                    E.get(c, {}).get("CVSS3", ""), a["advisory"], a["title"]])
with open(f"{outdir}/kev_vpn_gateway_shortlist.csv", "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["cve", "vendor", "product", "kev_date_added", "ransomware", "epss", "epss_percentile", "cvss3", "name"])
    for c in sorted(vpn, key=lambda c: K[c]["dateAdded"], reverse=True):
        w.writerow([c, K[c]["vendorProject"], K[c]["product"], K[c]["dateAdded"], K[c]["knownRansomwareCampaignUse"],
                    E.get(c, {}).get("EPSS", ""), E.get(c, {}).get("EPSS Percentile", ""), E.get(c, {}).get("CVSS3", ""),
                    K[c]["vulnerabilityName"]])
print(json.dumps({k: v for k, v in res.items() if k != "sources"}, indent=1))
