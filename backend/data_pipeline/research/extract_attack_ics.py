"""Extract ATT&CK for ICS techniques, mitigations, campaigns from a STIX bundle (read-only data)."""
import json, sys, collections

bundle = json.load(open(sys.argv[1]))
out = sys.argv[2]
objs = bundle["objects"]
by_id = {o["id"]: o for o in objs}


def ext(o):
    for r in o.get("external_references", []):
        if r.get("source_name") == "mitre-attack":
            return r.get("external_id"), r.get("url")
    return None, None


def live(o):
    return not o.get("revoked") and not o.get("x_mitre_deprecated")


techs, mits, camps, groups = {}, {}, {}, {}
for o in objs:
    if not live(o):
        continue
    eid, url = ext(o)
    if o["type"] == "attack-pattern" and eid:
        techs[o["id"]] = dict(id=eid, name=o["name"], url=url,
                              tactics=sorted({p["phase_name"] for p in o.get("kill_chain_phases", [])}))
    elif o["type"] == "course-of-action" and eid:
        mits[o["id"]] = dict(id=eid, name=o["name"], url=url)
    elif o["type"] == "campaign" and eid:
        camps[o["id"]] = dict(id=eid, name=o["name"], url=url, first_seen=o.get("first_seen"),
                              last_seen=o.get("last_seen"), techniques=[])
    elif o["type"] == "intrusion-set" and eid:
        groups[o["id"]] = dict(id=eid, name=o["name"], url=url, aliases=o.get("aliases", []), techniques=[])

mit_of = collections.defaultdict(list)
for o in objs:
    if o["type"] != "relationship" or not live(o):
        continue
    s, t, rt = o["source_ref"], o["target_ref"], o["relationship_type"]
    if rt == "mitigates" and s in mits and t in techs:
        mit_of[t].append(mits[s])
    if rt == "uses" and t in techs:
        if s in camps:
            camps[s]["techniques"].append(techs[t]["id"])
        if s in groups:
            groups[s]["techniques"].append(techs[t]["id"])

for k, v in techs.items():
    v["mitigations"] = sorted({(m["id"], m["name"]) for m in mit_of[k]})

ver = [o for o in objs if o["type"] == "x-mitre-collection"]
meta = dict(collection=ver[0]["name"] if ver else None, version=ver[0].get("x_mitre_version") if ver else None,
            modified=ver[0].get("modified") if ver else None,
            counts=dict(techniques=len(techs), mitigations=len(mits), campaigns=len(camps), groups=len(groups)))
json.dump(dict(meta=meta, techniques=sorted(techs.values(), key=lambda x: x["id"]),
               mitigations=sorted(mits.values(), key=lambda x: x["id"]),
               campaigns=sorted(camps.values(), key=lambda x: x["id"]),
               groups=sorted(groups.values(), key=lambda x: x["id"])), open(out, "w"), indent=1)
print(json.dumps(meta))
for t in sorted(techs.values(), key=lambda x: x["id"]):
    print(t["id"], "|", t["name"], "|", ",".join(t["tactics"]), "| mit:", len(t["mitigations"]))
print("--- campaigns")
for c in sorted(camps.values(), key=lambda x: x["id"]):
    print(c["id"], "|", c["name"], "|", c["first_seen"], "->", c["last_seen"], "| techs:", len(c["techniques"]))
