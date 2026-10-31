# Vidura Methodology & Validation Documentation

Everything reported in this document is dynamically computed from the risk engine and local intelligence caches; nothing is asserted without computation.

---

## 1. Dual-Graph Architecture

Vidura separates cyber-physical risk into two directed graphs:

1. **Attack Graph (`backend/engine/attack_graph.py`) — *How they get in***
   - Nodes represent the 29 IT, DMZ, and OT assets across Purdue Model levels (`L4` Corporate IT → `L3.5` Operations DMZ → `L3` Site Operations → `L2` Supervisory HMI → `L1` Field Controllers / PLCs / RTUs → `L0` Physical Process Actuators & Sensors).
   - Directed edges represent permitted firewall rules, misconfigured cross-zone pathways, and hardwired control links.
   - Each edge `(u -> v)` carries a conditional exploit probability `p(u -> v)` derived from real CISA KEV status, FIRST EPSS scores, credential exposure, and ML network-flow anomaly telemetry.
   - **Yen's Top-k Path Search**: Edge probabilities are transformed into non-negative log-weights `w = -log10(p)` (dropping any edge with `p <= 0`). Yen's algorithm (`networkx.shortest_simple_paths`) examines up to 500 candidate paths per target and retains up to 50 valid paths respecting the threat persona's `max_hops` and edge filters, returning both the single most likely path and the top-3 attack paths.

2. **Physical Dependency Graph (`backend/engine/dependency_graph.py`) — *What breaks***
   - Models how operational technology assets control municipal infrastructure services (`controls` edges with `0 h` delay) and how outages cascade across 9 service-to-service dependencies (`powers`, `supplies_water`, `monitors`).
   - Implements Idaho National Laboratory's **Consequence-driven Cyber-informed Engineering (CCE)** and the four Navanagar counting rules:
     1. **Single buffer accounting**: Each storage or backup buffer is stored once as `failure_delay_hours` on the dependency edge.
     2. **Threshold propagation**: A downstream service is hit only if `upstream_outage_hours > failure_delay_hours`; its outage duration is `upstream_outage_hours - failure_delay_hours`.
     3. **Rule 3 compound hazard override**: Compromising the Hospital Backup Generator Controller (`asset_hosp_gen_ctrl`) drops the `Feeder substation SS-2 -> District hospital` buffer from `24 h` to `0 h`.
     4. **Non-overlapping population rule**: `people_affected = max(people_served)` across lost services (never the sum, avoiding double-counting overlapping municipal zones).

---

## 2. Plain-Text Formulas for Likelihood, Consequence, and Risk

### Edge Exploit Probability (`p`)
For a directed network edge `u -> v`:
- If destination `v` has CVEs in the cache:
  - For each CVE: if CISA KEV-listed, `p_cve = max(KEV_FLOOR, EPSS)` where `KEV_FLOOR = 0.5`; otherwise `p_cve = EPSS` (or `0.05` if EPSS is 0).
  - `base_p = max(p_cve across CVEs on v)`.
- Else if `v` has default credentials: `base_p = 0.9`.
- Else if `v` exposes remote access without MFA: `base_p = 0.3`.
- Else if the rule is a firewall misconfiguration: `base_p = 0.4`.
- Else: `base_p = 0.05`.
- **ML Anomaly Boost (`ALPHA = 0.3`)**:
  ```text
  p_edge = base_p + (1 - base_p) * 0.3 * anomaly_score(v)
  ```
  clipped to `[1e-6, 0.999]`.

### Path Likelihood (`L` and `L_n`)
Along a simple path `e_1, e_2, ..., e_k` from an active persona entry point to target asset `a`:
```text
L = product(p_edge for each edge on the highest-probability valid path)
L_n = (log10(max(L, 1e-6)) + 6) / 6
```
`L_n` is bounded in `[0, 1]` using a fixed log scale so that multi-hop EPSS products spanning orders of magnitude remain distinguishable and modifying one asset never shifts another asset's normalised likelihood.

### Physical Consequence (`C`)
Given the set of municipal services lost when asset `a` is compromised:
```text
S_n = min(1.0, max_safety_severity / 4.0)
P_n = min(1.0, max_people_affected / 500000.0)
O_n = min(1.0, max_outage_hours / 72.0)

C = 0.5 * S_n + 0.3 * P_n + 0.2 * O_n
```

### Cyber-Physical Risk Score (`0-100`)
```text
Risk = 100 * L_n * C
```
Severity bands: `Critical (> 75)`, `High (51-75)`, `Medium (26-50)`, `Low (0-25)`.

---

## 3. Data Sources, Fetch Dates, and Record Counts

All intelligence and research datasets are cached locally in `data/cache/` and `data/research/` (`manifest.json`):

| File | Description | Source | Record Count | Fetched At (UTC) |
|---|---|---|---:|---|
| `cisa_kev_map.json` | CISA Known Exploited Vulnerabilities Catalog (Indexed) | `cisa.gov/.../known_exploited_vulnerabilities.json` | 1,766 | `2026-10-30T17:37:21Z` |
| `attack_ics_techniques.json` | MITRE ATT&CK for ICS Techniques STIX Extract | `github.com/mitre/cti` (`ics-attack.json`) | 118 | `2026-10-30T17:37:43Z` |
| `selected_cves.json` | Targeted ICS and edge remote-access candidate CVEs | Derived from CISA KEV and NVD ICS selections | 39 | `2026-10-30T17:40:12Z` |
| `nvd_cve_details.json` | NVD CVSS v3.x, Attack Vector, and CPE descriptions | `services.nvd.nist.gov/rest/json/cves/2.0` | 38 | `2026-10-30T17:45:08Z` |
| `epss_current.json` | FIRST Exploit Prediction Scoring System (Current Batch) | `api.first.org/data/v1/epss` | 38 | `2026-10-30T17:46:08Z` |
| `epss_history.json` | FIRST EPSS 30-day historical time-series per CVE | `api.first.org/data/v1/epss?scope=time-series` | 38 | `2026-10-30T17:46:08Z` |
| `threat_drop.json` | Reserved real KEV-listed ICS CVE (`CVE-2023-6448`) | CISA KEV / NVD reserved ICS vulnerability | 1 | `2026-10-30T17:46:57Z` |
| `csaf_ot_cve_index.json` | CISA CSAF machine-readable OT advisories index (12,835 CVEs across 3,994 advisories) | `github.com/cisagov/CSAF` (commit `3c2594d`, 2026-10-29) | 5 | `2026-10-31T08:29:43Z` |
| `kev_epss_ics_evidence.json` | Cross-analysis of CISA KEV v2026.10.29 against EPSS distributions | `cisagov/kev-data` + `jgamblin/KEV_EPSS` (commit `bef6f7c`, 2026-10-30) | 6 | `2026-10-31T08:29:43Z` |
| `kev_ics_shortlist.csv` | CISA KEV shortlist for industrial control systems (ICS) | `github.com/cisagov/kev-data` (`v2026.10.29`) | 122 | `2026-10-31T08:29:43Z` |
| `kev_vpn_gateway_shortlist.csv` | CISA KEV shortlist for VPN and remote-access gateways | `github.com/cisagov/kev-data` (`v2026.10.29`) | 98 | `2026-10-31T08:29:43Z` |
| `hai_p3_isolation_forest_baseline.json` | HAI 21.03 testbed process anomaly baseline (water process P3) | `github.com/icsdataset/hai` (`HAI 21.03`, CC BY-SA 4.0) | 7 | `2026-10-31T08:29:43Z` |
| `wntr_pump_outage_net3.json` | EPA WNTR 1.5.0 hydraulic simulation check on EPANET Net3 | `github.com/USEPA/WNTR` (`v1.5.0`) | 6 | `2026-10-31T08:29:43Z` |
| `attack_ics_hop_mapping.json` | Hop-type to MITRE ATT&CK for ICS technique mapping | `github.com/mitre/cti` (commit `50be388`, 2026-10-13) | 18 | `2026-10-31T08:29:43Z` |
| `attack_ics_mitigations.json` | MITRE ATT&CK for ICS mitigation techniques | `github.com/mitre/cti` (commit `50be388`, 2026-10-13) | 104 | `2026-10-31T08:29:43Z` |
| `certin_mapping.json` | CERT-In Smart City Cyber Security Guidelines mapping | CERT-In, *Cyber Security Guidelines for Smart City Infrastructure*, table of contents | 5 | `2026-10-31T08:29:43Z` |

---

## 4. Assumptions Table & Empirical KEV_FLOOR Evidence

Every tunable parameter below is tagged **"Scenario assumption"** in the application:

| Parameter | Value | Justification | Source or "Design choice" |
|---|---|---|---|
| `KEV_FLOOR` | `0.5` | KEV listing means exploitation has been confirmed in the wild, so a reachable KEV CVE should never rank as unlikely because of a low EPSS. This matters most for water: of the KEV-listed CVEs that also have a CISA ICS advisory in the water sector, half have EPSS below 0.1 (median 0.09, 16 CVEs, a small sample). Across all ICS KEV entries EPSS is not lower than KEV overall (median 0.67 vs 0.57), so the floor is a water-sector correction, not a general ICS one. 0.5 treats a reachable KEV CVE as at least a coin flip. | CISA KEV catalog (BOD 22-01): a CVE is only added with evidence of active exploitation. EPSS figures: CISA KEV v2026.10.29 joined with the jgamblin/KEV_EPSS mirror (30 Oct 2026). The 0.5 value itself is a design choice. |
| `P(success)` vs default credentials | `0.9` | Default passwords are public and tried automatically by scanners and botnets; failure mostly comes from the device being changed or unreachable, not from difficulty. | Joint advisory AA23-335A (Dec 2023): IRGC-affiliated actors compromised internet-exposed Unitronics PLCs, including at US water facilities, likely by exploiting poor password security such as default passwords. Supports "this happens in practice", not the 0.9 number. |
| `P(success)` vs exposed remote access without MFA (RDP/VPN) | `0.3` | Needs a working credential (guessing, stuffing or a leaked password), so harder than defaults but realistic over time for an internet-facing service. | Design choice |
| Likelihood scale for the 0–100 score | `Fixed log scale: L_n = (log10(max(L, 10^-6)) + 6) / 6` | EPSS values differ by orders of magnitude, so a log scale keeps differences visible. The bounds are fixed, not taken from the current assets, so changing one asset never moves another asset's score. | Design choice |
| Anomaly boost `ALPHA` | `0.3` | An anomaly is a signal, not proof of compromise. A score of 1.0 closes 30% of the remaining gap to certainty (`p' = p + (1 - p) * 0.3 * score`), so the ML raises priority without overriding the vulnerability evidence. | Design choice |
| Persona: `opportunistic` | Entry: Internet only. Max 3 hops. Only uses edges whose best CVE is KEV-listed or has `EPSS >= 0.1`, or that are a default-credential weakness | Mass-scanning attackers go for exposed, known-exploited weaknesses and default passwords, and do not chain long paths into OT. | Design choice, consistent with MITRE ATT&CK for ICS campaigns C0031 (Unitronics, 2023) and C0066 (U.S. water utilities, 2026), both listing T0883 Internet Accessible Device and T1694.001 Default Credentials |
| Persona: `nation_state` | Entry: Internet + vendor VPN. Max 8 hops. All edges | Patient, well-resourced actors chain through IT and DMZ into control layers and use third-party access. | Design choice |
| Persona: `insider` | Entry: one corporate workstation. Holds valid domain credentials (credential edges inside IT = 1.0). Max 6 hops | Models an employee or a stolen employee account: no need to break in, only to move laterally. | Design choice |
| Consequence weights | Safety severity `0.5`, people affected `0.3`, outage hours `0.2` (`sum = 1`) | Physical safety dominates in critical infrastructure; people affected comes next; duration matters but is partly captured by the other two. | Consequence-first framing follows INL's Consequence-driven Cyber-informed Engineering (CCE). The weights themselves are a design choice. |
| Consequence normalisation | `Severity / 4`; `people affected / 500,000` (city population); `outage hours / 72` (longest outage in the scenario); each capped at 1 | Puts each component on 0–1 before weighting. People affected is the largest `people_served` among services lost, not the sum (see `consequence_numbers.md`, rule 4), so overlapping populations are not double-counted. | Design choice |
| Fix: patch (IT asset) | `2 engineer-hours`, `0.5 h downtime` | Standard OS/app patch plus a reboot, usually possible within the month. | Design choice |
| Fix: patch (PLC/RTU) | `8 engineer-hours`, `4 h downtime`; only in a maintenance window | Firmware updates on controllers need vendor validation, testing and a process shutdown, so they are deferred (`patchable_now = false`). | Design choice |
| Fix: segment a firewall rule | `3 engineer-hours`, `0 h downtime` | Rule change plus testing that operations traffic still flows; no process stop needed. | Design choice |
| Fix: disable remote access | `1 engineer-hour`, `0 h downtime` | Quick to switch off; the cost is operational (vendor support must be re-arranged), noted in the UI rather than counted as downtime. | Design choice |
| Fix: add MFA | `4 engineer-hours`, `0 h downtime` | Enrolment and testing for the remote-access gateway users. | Design choice |
| Fix: enhanced monitoring | `3 engineer-hours`, `0 h downtime`; `risk reduction = 0` | Detection, not prevention: raises confidence, does not lower likelihood. | Design choice |
| MFA reduction factor | `x 0.1` on credential-attack probability | Deliberately more conservative than vendor headline figures, because targeted attackers bypass MFA (push fatigue, session/token theft). | Microsoft Security blog (Aug 2019) reported that accounts using MFA are over 99.9% less likely to be compromised; we use 90% to allow for targeted bypass. The 0.1 value is a design choice. |

### Empirical Evidence for `KEV_FLOOR` (`data/research/kev_epss_ics_evidence.json`)

Cross-analysis of CISA KEV catalog v2026.10.29 (1,764 CVEs) joined with FIRST EPSS scores (`jgamblin/KEV_EPSS`, commit `bef6f7c`, 30 Oct 2026) and CISA CSAF OT advisories:

| Group | KEV CVEs (with EPSS) | Median EPSS | Share Below 0.10 | Ransomware-Linked |
|---|---:|---:|---:|---:|
| All KEV | 1,764 (1,571) | 0.5669 | 23.0% | 361 |
| ICS KEV (all sectors) | 122 (114) | 0.6707 | 27.2% | 25 |
| ICS KEV — Water and Wastewater Systems | 17 (16) | 0.0936 | 50.0% | 0 |
| ICS KEV — Energy | 55 (50) | 0.4901 | 36.0% | 9 |
| ICS KEV — Healthcare and Public Health | 24 (22) | 0.7984 | 27.3% | 9 |
| KEV — VPN / Remote-Access Gateways | 98 (80) | 0.6982 | 12.5% | 45 |

*Note: The water-sector KEV sample is small (17 KEV CVEs, 16 with EPSS scores; median EPSS = 0.0936, 50% below 0.10). It is presented as an empirical indication motivating the water-sector `KEV_FLOOR = 0.50` correction rather than a general statistical law.*

---

## 5. Known Limitations

1. **EPSS Meaning vs Asset Breach Probability**: EPSS estimates the probability that a CVE sees exploitation activity *somewhere in the wild* over the next 30 days — it is **not** the probability that our specific asset is breached. Vidura uses EPSS and KEV as relative weights gated by network reachability and persona constraints.
2. **Simulated Topology (Navanagar)**: The 29-asset IT/DMZ/OT topology, firewall rules, and 500,000-resident service capacities represent a realistic but fictional Indian municipal smart city. Every scenario parameter is labelled `"Scenario assumption"`.
3. **No Ground Truth for Cyber-Physical Risk**: There is no empirical ground-truth dataset of city-wide cyber-physical breach frequencies. Therefore, Vidura never reports an artificial "accuracy percentage" for risk scores; instead, we verify mathematical invariants, parameter sensitivity (Kendall's $\tau$), CVSS divergence explanations, and held-out anomaly detection metrics.

---

## 6. Validation Results (`data/cache/validation.json`)

### 6.1 Invariant Test Suite (`6/6 Passed`)
- **Monotonicity (Adding a KEV CVE)**: Tested adding `CVE-2023-27997` across 28 assets (812 asset-pair checks) — `0` risk decreases observed (max risk increase `+20.6`).
- **Monotonicity (Removing a Network Rule)**: Removed each of the 28 network rules one at a time (812 checks) — `0` likelihood increases observed; `7` rules directly carry best-path attack traffic.
- **Fix-Never-Increases-Risk & Monitoring Invariance**: Verified all 7 candidate remediations — `0` risk increases; `enhanced_monitoring` (`act_mon_water_plc`) produces `delta_risk = 0.0` across all assets.
- **Planner-Respects-Budget**: Tested 7 `(engineer_hours, max_downtime)` budget combinations — `used_engineer_hours <= budget_hours` and `total_downtime_hours <= max_downtime_hours` in 100% of cases.
- **Determinism**: Dual independent runs across all 3 personas (87 asset evaluations) produced bit-identical scores, rankings, and paths.
- **Cache Referential Integrity**: All 25 unique scenario CVEs and all 8 active edge ATT&CK for ICS techniques verified against local caches (`0` missing).

### 6.2 One-at-a-Time $\pm 50\%$ Parameter Sensitivity Analysis
Only uncertain model parameters are varied by $\pm 50\%$ (probabilities clipped to `[0, 1]`, hop limits rounded to whole numbers $\ge 1$, consequence weights re-normalised to sum to `1.0`). Normalisation constants, log-scale bounds, compound-hazard rules, and fix costs are held fixed.

| Parameter | Persona | Baseline | -50% | +50% | $\tau$ (-50%) | $\tau$ (+50%) | Max Top-10 Shifts |
|---|---|---:|---:|---:|---:|---:|---:|
| Persona hop limit: Insider `max_hops` | `insider` | 6 | 3 | 9 | 0.394 | 1.000 | 10/10 |
| Exploit probabilities (EPSS multiplier) | `nation_state` | 1.00 | 0.50 | 1.50 | 0.956 | 1.000 | 2/10 |
| Anomaly boost `ALPHA` | `nation_state` | 0.30 | 0.15 | 0.45 | 0.956 | 1.000 | 2/10 |
| Consequence weight: Safety severity | `nation_state` | 0.50 | 0.25 | 0.75 | 1.000 | 0.956 | 2/10 |
| `KEV_FLOOR` | `nation_state` | 0.50 | 0.25 | 0.75 | 1.000 | 1.000 | 0/10 |
| `P(success)` vs default credentials | `nation_state` | 0.90 | 0.45 | 1.00 | 1.000 | 1.000 | 0/10 |
| `P(success)` vs exposed remote access (no MFA) | `nation_state` | 0.30 | 0.15 | 0.45 | 1.000 | 1.000 | 0/10 |
| Opportunistic EPSS threshold | `opportunistic` | 0.10 | 0.05 | 0.15 | 1.000 | 1.000 | 0/10 |
| Persona hop limit: Nation-State `max_hops` | `nation_state` | 8 | 4 | 12 | 1.000 | 1.000 | 0/10 |
| Persona hop limit: Opportunistic `max_hops` | `opportunistic` | 3 | 2 | 5 | 1.000 | 1.000 | 0/10 |
| Consequence weight: People affected | `nation_state` | 0.30 | 0.15 | 0.45 | 1.000 | 1.000 | 0/10 |
| Consequence weight: Outage hours | `nation_state` | 0.20 | 0.10 | 0.30 | 1.000 | 1.000 | 0/10 |

- **Mean minimum Kendall's $\tau$**: `0.9384`.
- **Fragility finding**: Cutting the `insider` hop limit by 50% (from 6 hops to 3 hops) causes the largest ranking shift ($\tau = 0.394$) because deeper substation L1/L0 assets sit 4–5 hops from the corporate workstation (`ws1 -> jump -> pwr_scada -> pwr_hmi -> pwr_switch -> pwr_rtu`). Under `nation_state`, varying `exploit_probabilities`, `ALPHA`, or `safety_severity` weight by $\pm 50\%$ causes only minor 1-position swaps ($\tau = 0.956$), while `KEV_FLOOR` ($\pm 50\%$) preserves the top-10 ordering ($\tau = 1.000$).

### 6.3 CVSS-Only Comparison ($\tau = -0.0053$)
Comparing Vidura's cyber-physical ranking against a CVSS-only ranking shows near-zero rank correlation ($\tau = -0.0053$), demonstrating why CVSS alone misallocates OT defensive effort:

| Asset | CVSS | Vidura Rank | CVSS Rank | Computed Disagreement Reason |
|---|---:|---:|---:|---|
| Chlorine Gas Regulators & Injection Manifold | 0.0 | #3 | #26 | CVSS 0.0 (no software CVE; reached via legitimate ICS protocol commands in 4 hops), but drives physical cascade impacting 500,000 people across 3 critical services (`consequence = 1.00`). |
| High-Lift Clear Water Centrifugal Pumps | 0.0 | #6 | #28 | CVSS 0.0 (no software CVE; reached via legitimate ICS protocol commands in 4 hops), but drives physical cascade impacting 200,000 people across 2 critical services (`consequence = 0.56`). |
| Water Plant Operator Touchscreen HMI | 7.5 | #4 | #20 | CVSS 7.5 at 2 hops from entry, and directly cascades to 2 essential services (200,000 people, safety severity 3/4, `consequence = 0.56`). |
| Enterprise Operational Historian Mirror | 9.8 | #20 | #4 | CVSS 9.8 (`CVE-2018-7841`), but unreachable from any active persona entry point (`likelihood = 0.0`) and impacts 0 services. |
| Water Treatment Plant Master SCADA Server | 7.8 | #2 | #17 | CVSS 7.8 at 1 hop from entry, and directly cascades to 2 essential services (200,000 people, safety severity 3/4, `consequence = 0.56`). |
| Municipal Surveillance IoT Video Gateway | 10.0 | #16 | #1 | CVSS 10.0 (`CVE-2023-20198`), but unreachable from any active persona entry point (`likelihood = 0.0`) and impacts 1 non-essential service. |
| Third-Party Vendor Remote Access VPN | 9.8 | #18 | #3 | CVSS 9.8, CISA KEV-listed (0 hops from entry), but compromises 0 physical services directly (`consequence = 0.00`; serves as transit/entry node only). |
| Substation Sub-Ring Managed Switch | 9.8 | #21 | #7 | CVSS 9.8 (`CVE-2021-31886`), but unreachable from any active persona entry point (`likelihood = 0.0`) and impacts 0 services directly. |

### 6.4 Anomaly Detection Evaluations (Reported Separately, Never Merged)

1. **`Synthetic data, injected attacks`** (`data/cache/anomaly_eval.json`)
   - **Model**: `sklearn.ensemble.IsolationForest` (`contamination = 0.03`, `random_state = 42`)
   - **Split**: Trained on first 5 days (1,688 normal asset-hour windows); evaluated on final 2 days (696 asset-hour windows containing 6 injected attack windows: 3 a.m. vendor VPN login + water SCADA connection, workstation port scan, historian large transfer, unauthorized PLC programming).
   - **Metrics**: Precision = `0.125`, Recall = `0.8333` (`5/6` attack windows detected), F1 = `0.2174`, Confusion Matrix: `TN = 655, FP = 35, FN = 1, TP = 5`.

2. **`HAI 21.03 real testbed data`** (`data/research/hai_p3_isolation_forest_baseline.json`)
   - **Dataset**: HAI 21.03 (`github.com/icsdataset/hai`, CC BY-SA 4.0), water-treatment reservoir pumping process `P3` (Siemens S7-300 PLC, 7 process tags: `P3_FIT01`, `P3_LCP01D`, `P3_LCV01D`, `P3_LH`, `P3_LIT01`, `P3_LL`, `P3_PIT01`).
   - **Protocol**: Fixed before scoring — trained on `train1.csv.gz` (`216,001` rows, 60 h normal operation); threshold fixed at 99.5th percentile of training anomaly scores (`0.58244`); alarm triggered when 30-second rolling mean exceeds threshold.
   - **Metrics (Point-wise and event-level, not eTaPR)**:
     - **Event-level recall**: `0.375` (**3 of 8** labelled water-process attacks detected)
     - **False-alarm rate**: **1 false-alarm episode in 111.4 hours** of normal operation (`0.22` per 24 h)
     - **Point-wise**: Precision = `0.768`, Recall = `0.111` (`TP = 106, FP = 32, FN = 852`)
