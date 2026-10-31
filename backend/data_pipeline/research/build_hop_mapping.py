"""Build Vidura hop-type -> ATT&CK for ICS technique mapping from the extracted data, verifying every ID."""
import json, sys

full = json.load(open(sys.argv[1]))
outdir = sys.argv[2]
prov = sys.argv[3]
T = {t["id"]: t for t in full["techniques"]}

HOPS = [
    ("internet_exploit", "Attacker exploits an internet-exposed asset (CVE with CVSS AV:N)", ["T0883", "T0819"]),
    ("vendor_remote_access", "Attacker enters through the third-party vendor VPN / remote-access gateway", ["T0822"]),
    ("default_credentials", "Attacker logs in with default or vendor credentials", ["T1694.001"]),
    ("valid_accounts", "Attacker uses legitimate stolen or insider credentials", ["T0859"]),
    ("phishing_entry", "Nation-state or insider entry via a phished corporate workstation", ["T0865"]),
    ("remote_service_exploit", "Lateral hop by exploiting a network service on an internal host (CVE AV:N/AV:A)", ["T0866"]),
    ("remote_service_login", "Lateral hop over RDP/SSH/VNC or similar using credentials", ["T0886"]),
    ("privilege_escalation", "Local exploit after landing on a host (CVE AV:L)", ["T0890"]),
    ("controller_logic_change", "Final hop: engineering software pushes modified logic to a PLC/RTU", ["T0843", "T0889"]),
    ("controller_command", "Final hop: unauthorised control command or setpoint change to a PLC/RTU/IED", ["T1692.001", "T0836"]),
    ("supply_chain", "Compromised vendor software or update (stretch scenario)", ["T0862"]),
]
IMPACTS = [
    ("manipulation_of_control", ["T0831"]), ("loss_of_control", ["T0827"]), ("denial_of_control", ["T0813"]),
    ("loss_of_view", ["T0829"]), ("loss_of_availability", ["T0826"]), ("loss_of_safety", ["T0880"]),
    ("damage_to_property", ["T0879"]),
]


def tech(i):
    t = T[i]  # KeyError = unverified ID, fails loudly
    return dict(id=t["id"], name=t["name"], tactics=t["tactics"], url=t["url"],
                mitigations=[dict(id=m[0], name=m[1]) for m in t["mitigations"]])


hop_map = dict(
    source=prov,
    note="Every technique ID below was looked up in MITRE ATT&CK for ICS (mitre/cti ics-attack.json); revoked/deprecated objects excluded. T0812 Default Credentials and T0855 Unauthorized Command Message are revoked; use T1694.001 and T1692.001.",
    hop_types=[dict(hop_type=h, meaning=m, techniques=[tech(i) for i in ids]) for h, m, ids in HOPS],
    impact_types=[dict(impact_type=h, techniques=[tech(i) for i in ids]) for h, ids in IMPACTS],
)
json.dump(hop_map, open(f"{outdir}/attack_ics_hop_mapping.json", "w"), indent=1)

mit = dict(source=prov, techniques=[dict(id=t["id"], name=t["name"],
           mitigations=[dict(id=m[0], name=m[1]) for m in t["mitigations"]]) for t in full["techniques"]],
           mitigations=full["mitigations"])
json.dump(mit, open(f"{outdir}/attack_ics_mitigations.json", "w"), indent=1)

camps = []
for c in full["campaigns"]:
    camps.append(dict(id=c["id"], name=c["name"], url=c["url"], first_seen=c["first_seen"], last_seen=c["last_seen"],
                      techniques=[dict(id=i, name=T[i]["name"]) for i in sorted(set(c["techniques"])) if i in T]))
json.dump(dict(source=prov, campaigns=camps), open(f"{outdir}/attack_ics_campaigns.json", "w"), indent=1)

for h, m, ids in HOPS:
    print(h, "->", ", ".join(f"{i} {T[i]['name']}" for i in ids), "| mitigations:",
          "; ".join(f"{x[0]} {x[1]}" for x in T[ids[0]]["mitigations"]))
print("---")
for c in camps:
    if c["id"] in ("C0020", "C0028", "C0031", "C0041", "C0066"):
        print(c["id"], c["name"], ":", ", ".join(f"{t['id']} {t['name']}" for t in c["techniques"]))
