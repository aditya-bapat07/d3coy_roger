# Vidura research pack: findings and what to do with them

Prepared 31 Oct 2026. Every number below was computed from, or copied from, the source named next to it. Nothing in `data/` was typed from memory.

## 1. What is in the pack

| File | What it is | Feeds flow step |
|---|---|---|
| `data/attack_ics_hop_mapping.json` | Each Vidura hop type → verified ATT&CK for ICS technique IDs + their mitigations | 6 (H), 7X (2) |
| `data/attack_ics_mitigations.json` | All 104 live ICS techniques → mitigation IDs/names; all 53 mitigations | 7X (2) |
| `data/attack_ics_campaigns.json` | 10 ICS campaigns with the technique IDs MITRE attributes to each | threat model, personas |
| `data/bad_practices.json` | CISA's 3 Bad Practices, verbatim, with the scenario field that triggers each | 6 (L), 2b (4) |
| `data/csaf_ot_cve_index.json.gz` | 12,835 CVEs → CISA ICS advisory ID, title, date, vendor, sectors, CVSS, vendor remediation text (3,994 advisories) | 2b (2), 7X (1) |
| `data/csaf_sector_vendors_2021plus.csv` | Which vendors appear most in CISA ICS advisories per sector, 2021 onward | scenario realism check |
| `ssvc/` | Official CERT/CC SSVC tables + our proposed mapping (`SSVC_MAPPING.md`) | 7X (5) |
| `scripts/fetch_vulnrichment_ssvc.py` | Pulls CISA's own Exploitation/Automatable/Technical Impact per CVE (tested) | 2b (5) |
| `data/hai_p3_isolation_forest_baseline.json` + `scripts/hai_p3_baseline.py` | Isolation Forest on real HAI 21.03 water-process data, fixed protocol | 5H |
| `data/wntr_pump_outage_net3.json` + `scripts/wntr_pump_outage.py` | EPA WNTR hydraulic check of the storage buffer | SW |
| `data/response_templates.json` | Response-plan templates per asset class, with CERT-In 6-hour reporting | 7X (4) |
| `data/attack_ics_assets.json` | MITRE's 18 ICS asset types, the techniques that target each, our Navanagar asset-type mapping, and which assets each hop technique targets | 6 (H) |
| `data/attack_ics_detection.json` | Per technique: MITRE detection strategies (DET IDs), data components and log sources | 7 (enhanced monitoring) |
| `data/kev_epss_ics_evidence.json` | EPSS distribution of KEV-listed ICS CVEs vs all KEV, by sector, and for VPN gateways | KEV_FLOOR justification, 14 |
| `data/kev_ics_shortlist.csv` | The 122 KEV CVEs that also have a CISA ICS advisory: sectors, vendor, product, ransomware flag, EPSS, advisory | scenario realism check |
| `data/kev_vpn_gateway_shortlist.csv` | 98 KEV CVEs in VPN/remote-access gateways with ransomware flags and EPSS | vendor VPN realism |
| `licenses/` | MITRE ATT&CK and CERT/CC SSVC licence texts (both require the notice to be kept) | README credits |
| `certin_mapping.json` | Five Vidura areas → section, title and page in CERT-In's smart-city guidelines (checked against the printed table of contents) | 12 (briefing PDF) |

## 2. Corrections this research forces on the flow

1. **Two ATT&CK IDs an agent would likely get wrong.** T0812 "Default Credentials" and T0855 "Unauthorized Command Message" are revoked in the current ATT&CK for ICS. Use **T1694.001 Default Credentials** and **T1692.001 Command Message** (sub-technique of T1692 Unauthorized Message). The hop mapping file already uses the live IDs.
2. **HAI's "water treatment" process is reservoir pumping, not chemical dosing.** HAI P3 pumps water between an upper and a lower reservoir on a Siemens S7-300 PLC. Its anomaly score may drive Navanagar's **pump-control PLC only**, never the chlorine-dosing PLC.
3. **SSVC never returns "defer" for actively exploited CVEs** in the deployer table. The mapping file's examples were checked against the official CSV.
4. **WNTR's built-in pump-outage rule does not override Net3's own pump controls.** The hydraulic check removes those controls; this is stated in the script and the results file.
5. **"ICS CVEs often have low EPSS" is not true overall.** KEV-listed ICS CVEs have a higher median EPSS than KEV as a whole (0.67 vs 0.57). It is true for water: half of the KEV-listed water-sector ICS CVEs score below 0.1. Section 12 has the numbers; the KEV_FLOOR justification now uses them.
6. **Program Download (T0843) and Modify Program (T0889) only target PLC-class controllers in MITRE's data, not RTUs or protection relays.** For a final hop onto an RTU or IED, use Command Message (T1692.001) or Modify Parameter (T0836).

## 3. Threat model: each persona has a documented real-world pattern

Technique IDs are MITRE's attributions for each campaign (`attack_ics_campaigns.json`).

| Persona | Real-world pattern | Techniques MITRE attributes | What it justifies in Vidura |
|---|---|---|---|
| Opportunistic | **C0066, 2026 U.S. water utilities attacks**: more than 30 municipal water and wastewater utilities in Minnesota from 27 July 2026; internet-facing Rockwell/Allen-Bradley MicroLogix PLCs reached through cellular gateways. **C0031, Unitronics defacement (Nov 2023)**: opportunistic, global targeting of internet-exposed Unitronics PLC/HMIs. | C0066: T0883 Internet Accessible Device, T1694.001 Default Credentials, T0836 Modify Parameter, T0889 Modify Program, T0892 Change Credential, T0826/T0827/T0829 loss of availability/control/view. C0031: T0883, T1694.001 | Short paths (max 3 hops), internet entry only, default credentials as a pseudo-vulnerability, KEV floor |
| Nation-state | **C0028, 2015 Ukraine power attack** (Sandworm): IT-to-OT intrusion into substations, remote services and valid accounts, then breaker operation. **RedEcho (Recorded Future, 28 Feb 2021)**: China-linked group targeted ten Indian power-sector organisations including four of the five Regional Load Despatch Centres, likely pre-positioning; no operational impact was claimed. | C0028: T0822 External Remote Services, T0859 Valid Accounts, T0886 Remote Services, T1692.001 Command Message, T0831 Manipulation of Control, T0813 Denial of Control | Long paths (max 8 hops), vendor VPN as an entry, credential edges, the substation as a target |
| Insider | **C0020, Maroochy water breach (2000)**: an adversary used the local government's wastewater control system and stolen engineering equipment to release 800,000 litres of raw sewage. | T0822, T0848 Rogue Master, T0860 Wireless Compromise, T0836 Modify Parameter, T1692.001 | Starting inside with valid access, credential edges at probability 1 |

Two further patterns support specific design choices:
- **Vendor/remote access without MFA:** Colonial Pipeline's CEO told the US Senate (June 2021) that attackers entered through a legacy VPN account protected only by a password, with no second factor. This supports modelling the vendor VPN as an entry point and the MFA fix.
- **Hospital IT failure forcing manual operation:** AIIMS New Delhi's servers went down on 23 November 2022 in a suspected ransomware attack; services such as OPD and sample collection were disrupted, and the servers were still down six days later. This supports the hospital consequence and the response-plan steps.
- **Municipal heating via Modbus:** C0041 FrostyGoop (January 2024) manipulated a Ukrainian municipal district-heating company's controllers with legitimate Modbus commands, affecting heating for civilians. This supports "legitimate protocol, harmful command" as a final-hop type (T0836).

## 4. Required operational flows (input for step 4b)

Legitimate traffic that a fix must never break. Ports are the protocols' standard ports; which protocol each Navanagar asset uses is a scenario assumption.

| Flow | From → To | Protocol / port | Why it must stay |
|---|---|---|---|
| RF-1 | Power SCADA server → substation RTU | IEC 60870-5-104, TCP 2404 | Telemetry and breaker control; cutting it blinds the grid operator |
| RF-2 | Substation gateway/RTU → protection relays (IED) | IEC 61850 MMS, TCP 102 | Relay status and settings; protection stays local but visibility is lost |
| RF-3 | Water SCADA/HMI → pump-control PLC | Modbus/TCP 502 (or S7comm TCP 102 for Siemens) | Pump start/stop and setpoints |
| RF-4 | Water SCADA/HMI → chlorine-dosing PLC | Modbus/TCP 502 | Dose rate control and residual-chlorine readings |
| RF-5 | Historian (L3) → water SCADA, read-only | Vendor historian protocol or OPC UA, TCP 4840 | Process records needed for water-quality compliance |
| RF-6 | Historian mirror in DMZ ← L3 historian, one-way | Historian replication | Business reporting without IT reaching into OT |
| RF-7 | Hospital BMS server → air-handling controllers | BACnet/IP, UDP 47808 | Theatre and ICU air pressure and temperature |
| RF-8 | Central traffic server → signal controllers | Vendor protocol, or NTCIP over SNMP, UDP 161 | Coordinated signal plans |

Vendor remote support is **not** a required flow: switching it off is allowed, with its operational cost shown.

## 5. End-of-life choices (input for step 4b)

Pick at most two, labelled "Scenario assumption". Both are common in real OT, where HMIs and historians outlive their operating systems:
- **Water HMI on Windows 7**: Microsoft's extended support ended 14 January 2020.
- **L3 historian on Windows Server 2012 R2**: extended support ended 10 October 2023.

Either one triggers CISA Bad Practice BP-1 (unsupported or end-of-life software).

## 6. SSVC (input for step 7X)

Details in `ssvc/SSVC_MAPPING.md`. In short: Exploitation and Automatable come from CISA's own Vulnrichment record for each CVE; System Exposure comes from Vidura reachability; Human Impact comes from Vidura's consequence via the official CERT/CC table. Checked outcomes, inputs stated in `SSVC_MAPPING.md`: actively exploited + automatable CVE on an internet-exposed chlorine-dosing PLC (two essential services fail: water and, after its tanks run out, the hospital) → **immediate**; the same CVE on an isolated bench → **scheduled**; the same CVE reachable only through the vendor VPN or firewall rules, with very high human impact → **out-of-cycle**.

## 7. Real-data anomaly baseline (input for step 5H)

HAI 21.03 (CC BY-SA 4.0 per its README; its metadata block says CC BY 4.0, so follow the stricter one), water process P3, 7 tags. Protocol fixed before scoring: train on `train1` (60 h, normal only); threshold = 99.5th percentile of training scores; alarm = 30-second mean above threshold. Scored on all five test files:

- **3 of 8 labelled water-process attacks detected** (event recall 0.375)
- **1 false-alarm episode in 111.4 hours** of normal operation (0.22 per day)
- point-wise precision 0.768, recall 0.111

Report it exactly like this, labelled "point-wise and event-level, not eTaPR". Do not compare it with HAICon leaderboards, and do not re-tune on the test files to raise it. More training data (train2, train3) is the honest way to improve it, judged on a held-out validation file.

## 8. Hydraulic check of the 12 h water buffer (stretch SW, done)

EPA's WNTR 1.5.0 on EPANET example network Net3 (**not Navanagar**), pressure-dependent demand, full service at 17 m. That is CPHEEO's minimum residual pressure for three-storey buildings (7 m one storey, 12 m two storeys).
- With all pumping lost, network storage alone keeps **100% of demand served for about 7 hours; service collapses at hour 8**.
- Reading: storage alone gives about 8 hours on a comparable network. Navanagar's 12 h assumption adds household overhead tanks and sumps, so 12 h is **plausible, not proven**. Show it as "Hydraulic check (EPANET example network): service collapses at hour 8 without household storage", next to the 12 h assumption.

## 9. Scenario realism: which vendors CISA's ICS advisories feature (2021 onward)

Advisory counts, **not market share**: they show where vulnerabilities get disclosed, not what Indian utilities buy.
- Water and wastewater: Rockwell Automation, Advantech, Schneider Electric, Siemens, ABB
- Energy: Siemens, Hitachi Energy, Schneider Electric, Johnson Controls, ABB
- Healthcare: Siemens, Philips, BD

If Navanagar's water PLCs come from Rockwell or Siemens, the scenario matches both the advisory record and C0066's target (Rockwell MicroLogix).

## 10. Which techniques fit which asset (input for step 6)

MITRE links each ICS technique to the asset types it targets (`attack_ics_assets.json`). Navanagar's mapping, ours: vendor VPN gateway → A0011 VPN Server; jump server → A0012 Jump Host; historian → A0006 Data Historian; SCADA and BMS servers → A0007 Control Server; HMI → A0002; workstations → A0001; PLCs, generator and traffic controllers → A0003 PLC; RTU → A0004; protection relay → A0005 IED; IoT and medical gateways → A0009 Data Gateway.

Engine rule: when labelling a hop onto an asset, prefer techniques whose MITRE targets include that asset type. Treat it as a hint, not a filter. MITRE's asset links are incomplete for real campaigns: it does not link T0883 Internet Accessible Device to PLCs, yet its own C0031 and C0066 campaigns used T0883 against PLCs. Where no listed technique fits, keep the hop type's default and show "technique–asset pairing not listed by MITRE".

## 11. What "enhanced monitoring" should collect (input for step 7)

From MITRE's detection strategies (`attack_ics_detection.json`):

| Hop technique | MITRE detection strategy | Data to collect |
|---|---|---|
| T0822 External Remote Services | DET0803 | Logon session creation and metadata, network traffic flow, application logs (VPN gateway) |
| T0886 Remote Services | DET0804 | Logon session creation, network connection creation, traffic flow, process creation, command execution |
| T0866 Exploitation of Remote Services | DET0767 | Network traffic content, process creation |
| T1694.001 Default Credentials | DET0756 | Logon session creation, user account authentication, network traffic content |
| T0843 Program Download | DET0752 | Application logs, asset inventory, device alarms, network traffic content |
| T0836 Modify Parameter | DET0776 | Application logs, network traffic content, **process history/live data** |
| T1692.001 Command Message | DET0794 | Application logs, network traffic content, **process history/live data**, process/event alarms |

The enhanced-monitoring fix should name these per asset on the top paths and still reduce risk by zero: it is detection, not prevention. The HAI anomaly model (section 7) is a working example of the "process history/live data" component.

## 12. Evidence for KEV_FLOOR (input for assumptions, step 14)

CISA KEV catalog v2026.10.29 (1,764 CVEs) joined with EPSS scores from the jgamblin/KEV_EPSS mirror (refreshed 30 Oct 2026, EPSS for 1,571 of them). "ICS KEV" means a KEV CVE that CISA also published an ICS advisory for (122 CVEs).

| Group | CVEs (with EPSS) | Median EPSS | Share with EPSS below 0.1 | Ransomware-linked |
|---|---|---|---|---|
| All KEV | 1,764 (1,571) | 0.567 | 23% | 361 (20%) |
| ICS KEV | 122 (114) | 0.671 | 27% | 25 |
| ICS KEV, water and wastewater | 17 (16) | 0.094 | 50% | 0 |
| ICS KEV, energy | 55 (50) | 0.490 | 36% | 9 |
| ICS KEV, healthcare | 24 (22) | 0.798 | 27% | 9 |
| KEV in VPN/remote-access gateways | 98 (80) | 0.698 | 12.5% | 45 (46%) |

Reading: for a water-sector asset, EPSS alone would call half of the actually-exploited CVEs unlikely. That is exactly what KEV_FLOOR = 0.5 corrects. The water sample is small (16 CVEs), so present it as an indication, not a law. Separately, VPN-gateway CVEs in KEV are ransomware-linked at more than twice the overall rate, which supports modelling the vendor VPN as an entry point.

## 13. Intermittent water supply (supports the 12 h buffer)

An IWA feature by S Mohan and GR Abhijith of IIT Madras (The Source, February 2021) reports average piped-water availability in Indian cities of about four hours a day, ranging from one to 11 hours. Households therefore store water by necessity, which is the household-storage part of Navanagar's 12 h buffer. The amount stored per household is still a scenario assumption. A related public-health point, from an MIT research group's intermittent-supply page (citing Andey & Kelkar, 2007): inconsistent pressure lets wastewater enter pipes. So after a long pumping outage, water should be flushed and tested before it is declared safe. That step is now in the pump-PLC response template.

## Sources

- MITRE ATT&CK for ICS, github.com/mitre/cti (commit 50be388, 2026-10-13), ics-attack.json
- CISA KEV catalog, github.com/cisagov/kev-data (catalog version 2026.10.29)
- EPSS for KEV, github.com/jgamblin/KEV_EPSS (commit bef6f7c, 2026-10-30), Apache-2.0; EPSS by FIRST
- S Mohan and GR Abhijith, "Intermittent water supply interventions for India's cities", The Source (IWA), February 2021, thesourcemagazine.org
- MIT research group page "Intermittent water supply", ajw-group.mit.edu/intermittent-water-supply
- CISA Bad Practices, github.com/cisagov/bad-practices (commit fd26f25), CC0
- CISA CSAF advisories, github.com/cisagov/CSAF (commit 3c2594d, 2026-10-29), TLP:WHITE
- CERT/CC SSVC, github.com/CERTCC/SSVC (commit bf3213b, 2026-10-22), data under MIT (SEI)-style licence
- CISA Vulnrichment, github.com/cisagov/vulnrichment (CISA-ADP SSVC records)
- HAI dataset, github.com/icsdataset/hai (HAI 21.03)
- WNTR, github.com/USEPA/WNTR (v1.5.0), Revised BSD
- CERT-In and Kaspersky, "Cyber Security Guidelines for Smart City Infrastructure" (copy checked: it.delhi.gov.in/sites/default/files/IT/generic_multiple_files/guidelines_for_smart.pdf), table of contents: sections 9, 15, 16, 17, 18
- CERT-In Directions of 28 April 2022 under Section 70B of the IT Act (summary: Internet Society, internetsociety.org/wp-content/uploads/2022/06/IIB-India-CERT-In-Directions-2022.pdf)
- Recorded Future, "China-linked Group RedEcho Targets the Indian Power Sector", 28 Feb 2021, recordedfuture.com/research/redecho-targeting-indian-power-sector
- Dark Reading on Colonial Pipeline CEO's Senate testimony, June 2021
- Business Today and others on AIIMS New Delhi server outage, 23 Nov 2022
- CPHEEO residual-pressure norms as quoted at frontdesk.co.in (Para 10.3 of the CPHEEO manual)
