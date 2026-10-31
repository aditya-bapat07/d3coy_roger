"""Index CISA ICS (OT) CSAF advisories: CVE -> advisories. Reads JSON as data only."""
import json, sys, glob, os, collections, csv

root, outdir, commit = sys.argv[1], sys.argv[2], sys.argv[3]


def norm_sector(x):
    t = x.strip().strip(".").lower()
    for pre in ("and ", "and"):
        if t.startswith(pre):
            t = t[len(pre):].strip()
    t = t.replace(" sector", "")
    rules = [("water", "Water and Wastewater Systems"), ("energy", "Energy"), ("electrical", "Energy"),
             ("oil & gas", "Energy"), ("health", "Healthcare and Public Health"), ("transport", "Transportation Systems"),
             ("government", "Government Facilities"), ("communication", "Communications"), ("telecom", "Communications"),
             ("manuf", "Critical Manufacturing"), ("emergency", "Emergency Services"), ("dams", "Dams"),
             ("chemical", "Chemical"), ("commercial", "Commercial Facilities"), ("food", "Food and Agriculture"),
             ("financial", "Financial Services"), ("information technology", "Information Technology"),
             ("nuclear", "Nuclear Reactors"), ("defense", "Defense Industrial Base")]
    return sorted({lab for key, lab in rules if key in t}) or ([x.strip()] if t else [])


def norm_vendor(v):
    t = (v or "").lower()
    for key, lab in [("schneider electric", "Schneider Electric"), ("johnson controls", "Johnson Controls"),
                     ("general electric", "GE"), ("rockwell", "Rockwell Automation"), ("hitachi energy", "Hitachi Energy"),
                     ("siemens", "Siemens"), ("mitsubishi electric", "Mitsubishi Electric")]:
        if key in t:
            return lab
    return (v or "").strip()
idx = collections.defaultdict(list)
sector_vendor = collections.defaultdict(collections.Counter)
sector_cves = collections.Counter()
n_docs = 0
bad = 0
for f in sorted(glob.glob(os.path.join(root, "csaf_files/OT/white/*/*.json"))):
    try:
        d = json.load(open(f))
    except Exception:
        bad += 1
        continue
    n_docs += 1
    doc = d.get("document", {})
    tr = doc.get("tracking", {})
    notes = {n.get("title"): n.get("text", "") for n in doc.get("notes", []) if n.get("category") == "other"}
    raw_sectors = [s.strip() for s in notes.get("Critical infrastructure sectors", "").replace(";", ",").split(",") if s.strip()]
    sectors = sorted({n for r in raw_sectors for n in norm_sector(r)})
    vendors = [b.get("name") for b in d.get("product_tree", {}).get("branches", []) if b.get("category") == "vendor"]
    year = os.path.basename(os.path.dirname(f))
    base = dict(advisory=tr.get("id"), title=doc.get("title"), released=(tr.get("initial_release_date") or "")[:10],
                vendor=", ".join(v for v in vendors if v), sectors=sectors, sectors_as_published=raw_sectors,
                countries=notes.get("Countries/areas deployed"), file=f"csaf_files/OT/white/{year}/{os.path.basename(f)}")
    cves_here = set()
    for v in d.get("vulnerabilities", []):
        cve = v.get("cve")
        if not cve:
            continue
        cves_here.add(cve)
        cv = next((s["cvss_v3"] for s in v.get("scores", []) if "cvss_v3" in s), {})
        rem = [dict(category=r.get("category"), details=(r.get("details") or "")[:600]) for r in v.get("remediations", [])]
        idx[cve].append(dict(base, cvss_v3=cv.get("baseScore"), cvss_vector=cv.get("vectorString"), remediations=rem[:4]))
    if year >= "2021":
        for s in sectors:
            sector_cves[s] += len(cves_here)
            for v in {norm_vendor(v) for v in vendors if v}:
                sector_vendor[s][v] += 1

json.dump(dict(source=f"CISA CSAF repository (github.com/cisagov/CSAF), OT advisories, commit {commit}. TLP:WHITE, 'Disclosure is not limited'.",
               advisories_indexed=n_docs, unreadable_files=bad, cves=len(idx), index=idx),
          open(os.path.join(outdir, "csaf_ot_cve_index.json"), "w"))
keep = ["Water and Wastewater Systems", "Energy", "Healthcare and Public Health", "Transportation Systems",
        "Government Facilities", "Emergency Services", "Communications"]
with open(os.path.join(outdir, "csaf_sector_vendors_2021plus.csv"), "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["sector", "vendor", "advisories_2021_onward"])
    for s in keep:
        for v, c in sector_vendor[s].most_common(15):
            w.writerow([s, v, c])
print("docs", n_docs, "bad", bad, "cves", len(idx))
for s in keep:
    print(s, "| CVEs 2021+:", sector_cves[s], "|", ", ".join(f"{v} ({c})" for v, c in sector_vendor[s].most_common(8)))
print("normalised sectors:", sorted(sector_vendor))
