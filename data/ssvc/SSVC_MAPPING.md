# SSVC for Vidura: official tables + proposed mapping

## What is official (copied unchanged)

From CERT/CC's SSVC repository (github.com/CERTCC/SSVC, commit bf3213b, 2026-10-22), data licensed MIT (SEI)-style; licence text in `licenses/CERTCC_SSVC_data_LICENSE.txt`.

- `deployer_patch_application_priority_1_0_0.csv`: Exploitation × System Exposure × Automatable × Human Impact → **defer / scheduled / out-of-cycle / immediate** (72 rows).
- `human_impact_1_0_0.csv`: Safety Impact × Mission Impact → **Human Impact** (16 rows).

Value sets in these files:

| Decision point | Values |
|---|---|
| Exploitation v1.1.0 | none, public poc, active |
| System Exposure v1.0.1 | small, controlled, open |
| Automatable v2.0.0 | no, yes |
| Safety Impact v2.0.1 (IEC 61508-based) | negligible, marginal, critical, catastrophic |
| Mission Impact v2.0.0 | degraded, mef support crippled, mef failure, mission failure |
| Human Impact v2.0.2 | low, medium, high, very high |

## Where each input comes from

| Input | Source | Rule |
|---|---|---|
| Exploitation | **CISA**, Vulnrichment CISA-ADP record (run `scripts/fetch_vulnrichment_ssvc.py`) | Use CISA's value as is. If CISA has not assessed the CVE, show "not assessed by CISA" and do not compute an outcome. Do not infer "public poc" from EPSS. |
| Automatable | **CISA**, same record | Same rule. |
| System Exposure | **Vidura** reachability | `open` if the asset is internet-exposed; `controlled` if it is reachable from a persona entry point only through firewall rules or the vendor VPN; `small` if no persona can reach it. |
| Safety Impact | **Vidura** consequence (scenario assumption) | severity 0–2 → negligible; 3 → marginal; 4 → critical; 4 **and** (hospital among services lost **or** people affected ≥ 100,000) → catastrophic. |
| Mission Impact | **Vidura** cascade (scenario assumption) | Essential city services = power, piped water, hospital, traffic control. No essential service lost → degraded; the asset's own function fails but every essential service rides out on its buffer → mef support crippled; exactly one essential service fails → mef failure; two or more fail → mission failure. |
| Human Impact | **Official table** | Look up Safety Impact × Mission Impact in `human_impact_1_0_0.csv`. |
| Outcome | **Official table** | Look up the four inputs in `deployer_patch_application_priority_1_0_0.csv`. |

The two Vidura-derived inputs (Safety Impact, Mission Impact) are our mapping, not CERT/CC's. Label them "Scenario assumption" in the UI, exactly like the consequence numbers.

## Why this is worth showing

- Two of the four inputs come from CISA itself, so the label is not self-graded.
- System Exposure is computed from the attack graph rather than guessed per asset, which is exactly what SSVC's definition asks for (the accessible attack surface of the affected system).
- The same CVE can get different outcomes on different assets. Checked against the official tables, with every input stated:
  - Exploitation active, exposure open, automatable yes, on the chlorine-dosing PLC. By Vidura's own cascade, unsafe water also reaches the hospital once its 12 h tanks run out, so two essential services fail: Safety catastrophic + Mission failure → Human Impact very high → `immediate`.
  - The same CVE on an isolated test bench: exposure small, Safety negligible + Mission degraded → Human Impact low → `scheduled`.
  - Exploitation active, exposure controlled (reachable only through the vendor VPN or firewall rules), Human Impact very high → `out-of-cycle`, whether or not it is automatable.
- That is the core Vidura argument, expressed in a standard framework. Note that active exploitation never drops to `defer` in this table; `defer` comes from, for example, no exploitation, small exposure, not automatable and low human impact.

## Not used

`data/csv/cisa/cisa_bod_26_04_1_0_0.csv` (CISA BOD 26-04 remediation timelines) exists in the repo but is a US federal directive for US agencies; it does not apply to an Indian municipal operator, so it is left out.
