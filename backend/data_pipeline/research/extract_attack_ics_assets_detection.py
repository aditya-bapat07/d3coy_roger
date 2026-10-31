"""From MITRE ATT&CK for ICS (ics-attack.json, read as data):
1) ICS asset types and the techniques that target each (relationship 'targets');
2) detection strategies, analytics and data components per technique (relationship 'detects'),
   used to give Vidura's 'enhanced monitoring' fix concrete content;
3) a check of which ATT&CK assets each Vidura hop technique targets.
Usage: python extract_attack_ics_assets_detection.py ics-attack.json attack_ics_hop_mapping.json <outdir> "<provenance>"
"""
import json, sys, collections

bundle, hopfile, outdir, prov = sys.argv[1:5]
objs = json.load(open(bundle))["objects"]
O = {o["id"]: o for o in objs}
live = lambda o: not o.get("revoked") and not o.get("x_mitre_deprecated")


def eid(o):
    return next((r.get("external_id") for r in o.get("external_references", []) if r.get("source_name") == "mitre-attack"), None)


tech = {o["id"]: o for o in objs if o["type"] == "attack-pattern" and live(o) and eid(o)}
assets = {o["id"]: o for o in objs if o["type"] == "x-mitre-asset" and live(o)}
targets = collections.defaultdict(set)      # asset id -> technique ids
asset_of = collections.defaultdict(set)     # technique ext id -> asset ext ids
det_of = collections.defaultdict(list)      # technique ext id -> detection strategies
for r in objs:
    if r["type"] != "relationship" or not live(r):
        continue
    s, t = r["source_ref"], r["target_ref"]
    if r["relationship_type"] == "targets" and s in tech and t in assets:
        targets[t].add(eid(tech[s]))
        asset_of[eid(tech[s])].add(eid(assets[t]))
    if r["relationship_type"] == "detects" and t in tech and s in O and live(O[s]):
        det_of[eid(tech[t])].append(O[s])

asset_rows = [dict(id=eid(a), name=a["name"], sectors=a.get("x_mitre_sectors", []),
                   related=[x["name"] for x in a.get("x_mitre_related_assets", [])],
                   techniques_targeting=sorted(targets[k])) for k, a in assets.items()]
asset_rows.sort(key=lambda x: x["id"])


def detection(tid):
    out = []
    for ds in det_of.get(tid, []):
        comps, logs, plats = set(), set(), set()
        for ar in ds.get("x_mitre_analytic_refs", []):
            an = O.get(ar)
            if not an or not live(an):
                continue
            plats.update(an.get("x_mitre_platforms", []))
            for ls in an.get("x_mitre_log_source_references", []):
                dc = O.get(ls.get("x_mitre_data_component_ref"))
                if dc:
                    comps.add(dc["name"])
                if ls.get("name"):
                    logs.add(ls["name"])
        out.append(dict(id=eid(ds), name=ds["name"], data_components=sorted(comps), log_sources=sorted(logs),
                        platforms=sorted(plats)))
    return out


det_rows = {eid(t): dict(name=t["name"], detection_strategies=detection(eid(t))) for t in tech.values()}

# Vidura asset type -> ATT&CK asset (our mapping, stated as such)
NAV = {
    "vendor_vpn_gateway": "A0011", "jump_server": "A0012", "historian": "A0006", "scada_server": "A0007",
    "hmi": "A0002", "engineering_workstation": "A0001", "employee_workstation": "A0001", "plc": "A0003",
    "rtu": "A0004", "protection_relay_ied": "A0005", "generator_controller": "A0003",
    "traffic_signal_controller": "A0003", "medical_iot_gateway": "A0009", "iot_camera_gateway": "A0009",
    "bms_server": "A0007", "firewall": "A0016",
}
name_of = {r["id"]: r["name"] for r in asset_rows}
hops = json.load(open(hopfile))
check = []
for h in hops["hop_types"] + hops["impact_types"]:
    for t in h["techniques"]:
        check.append(dict(hop=h.get("hop_type") or h.get("impact_type"), technique=t["id"], name=t["name"],
                          targets_assets=sorted(f"{a} {name_of.get(a, '')}" for a in asset_of.get(t["id"], []))))

json.dump(dict(source=prov, assets=asset_rows,
               cascade_asset_type_to_attack_asset=dict(
                   note="Vidura's mapping of Navanagar asset types to ATT&CK for ICS asset IDs (our judgement; IDs verified). Generator and traffic controllers are modelled as PLCs; BMS server as a control server; IoT/medical gateways as data gateways.",
                   mapping={k: dict(id=v, name=name_of[v]) for k, v in NAV.items()}),
               hop_technique_targets=check), open(f"{outdir}/attack_ics_assets.json", "w"), indent=1)
json.dump(dict(source=prov, note="Detection strategies -> analytics -> data components/log sources, per ICS technique. Use for the 'enhanced monitoring' fix: what to collect to detect each hop.",
               techniques=det_rows), open(f"{outdir}/attack_ics_detection.json", "w"), indent=1)

for c in check:
    print(c["hop"], c["technique"], c["name"], "->", ", ".join(c["targets_assets"]) or "(no asset links)")
print("---")
for tid in ["T0822", "T0886", "T0866", "T1692.001", "T0843", "T0836", "T1694.001", "T0883"]:
    for d in det_rows[tid]["detection_strategies"]:
        print(tid, d["id"], d["name"], "| components:", "; ".join(d["data_components"][:6]))
