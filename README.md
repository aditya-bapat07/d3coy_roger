# Vidura

**AI-Based Critical Infrastructure Cyber-Risk Prediction & Prioritisation**  
*Problem Statement 03 — Consequence-Driven Cyber-Physical Risk Decision Support*

Vidura is an offline-first cyber-risk prediction and prioritisation platform designed for critical infrastructure plant security managers and municipal CISO teams. Moving beyond static CVSS base-score sorting, Vidura couples a multi-hop **Attack Graph** ("How they get in") with a physical **Dependency Graph** ("What breaks") to rank assets by true cyber-physical risk, explain the dominant risk drivers (`risk_drop_if_removed`), and compute an optimal remediation plan under real-world operational constraints (engineer-hour budgets and OT maintenance windows).

---

## Architecture Summary — The Dual-Graph Model

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         VIDURA DUAL-GRAPH RISK ENGINE                        │
├──────────────────────────────────────┬───────────────────────────────────────┤
│ 1. ATTACK GRAPH ("How they get in")  │ 2. DEPENDENCY GRAPH ("What breaks")   │
│ • Purdue levels (Internet → L4 → L0) │ • OT Controllers → Physical Services  │
│ • CISA KEV + FIRST EPSS + NVD CVEs   │ • Substations, Water Pumping, Dosing, │
│ • Credential & firewall misconfigs   │   District Hospital, Traffic Signals  │
│ • Isolation Forest ML anomaly boost  │ • Failure delay hours & backup rules  │
│ • Yen's Top-k shortest-path search   │ • Non-double-counted population cap   │
└──────────────────┬───────────────────┴───────────────────┬───────────────────┘
                   │                                       │
                   ▼                                       ▼
         Normalised Likelihood (L_n)             Physical Consequence (C)
       L_n = (log10(max(L, 10⁻⁶)) + 6) / 6     C = 0.5·S_norm + 0.3·P_norm + 0.2·T_norm
                   │                                       │
                   └───────────────►  × 100  ◄─────────────┘
                                        │
                                        ▼
                         Unified Asset Risk Score (0–100)
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        ▼                               ▼                               ▼
 "Why" Factor Drop              Choke-Point Analysis           Greedy Remediation
 (risk_drop_if_removed)       (Betweenness Centrality)      Planner & What-If Sim
```

### Core Mathematical Formulation

1. **Unified Risk Formula (`0–100`)**:
   $$\text{Risk}(a) = 100 \times L_n(a) \times C(a)$$

2. **Multi-Hop Attack Likelihood ($L_n$)**:
   * Each directed network edge $(u \to v)$ is assigned a conditional hop probability $p(u, v) \in [0, 1]$ derived from the target's best reachable CVE (`max(EPSS, KEV_FLOOR)` where `KEV_FLOOR = 0.5` for CISA KEV-listed vulnerabilities), credential exposure (`0.9` for default credentials, `0.3` for exposed remote access without MFA), and an Isolation Forest network anomaly boost:
     $$p'(u, v) = p(u, v) + (1 - p(u, v)) \times \alpha \times \text{anomaly\_score}(v), \quad \alpha = 0.3$$
   * **Yen's Top-$k$ Path Search**: Using $-\log_{10}(p'(u, v))$ edge weights (`networkx.shortest_simple_paths`), Vidura evaluates up to 50 valid paths per asset respecting the active attacker persona's entry points and hop limit (`opportunistic`: 3 hops, `insider`: 6 hops, `nation_state`: 8 hops) and returns both the primary best path and the top-3 attack paths.
   * **Fixed Log Normalisation**: Raw path probability $L \in [10^{-6}, 1]$ is mapped onto $[0, 1]$ via $L_n = (\log_{10}(\max(L, 10^{-6})) + 6) / 6$ so changing one asset never distorts another asset's score.

3. **Cascading Physical Consequence ($C$)**:
   * Propagates outage waves downstream from compromised OT controllers (`L1`/`L0`) across the 9-edge municipal service DAG (Navanagar: 500,000 residents across power, water treatment/pumping/chlorine dosing, hospital, and traffic).
   * Respects edge failure delays (`failure_delay_hours`), backup generator overrides, and prevents population double-counting by taking the maximum `people_served` across impacted services:
     $$C = 0.5 \cdot \frac{\text{safety\_severity}}{4} + 0.3 \cdot \min\!\left(1, \frac{\max(\text{people\_served})}{500,000}\right) + 0.2 \cdot \min\!\left(1, \frac{\text{max\_outage\_hours}}{72}\right)$$

4. **Explainability, Confidence & Budget-Constrained Remediation**:
   * **Counterfactual Factor Attribution (`risk_drop_if_removed`)**: Recomputes asset risk with each individual contributing factor removed one at a time (public internet exposure, misconfigured firewall rule, KEV status, individual CVEs, ML anomaly score, and consequence components).
   * **Greedy Knapsack Planner & What-If Engine**: Selects preventive controls (IT patching, firewall segmentation, disabling vendor remote access, enforcing MFA) that maximise city-wide aggregate risk reduction per engineer-hour within the operator's budget while respecting OT maintenance-window locks (`patchable_now = false` for live PLCs/RTUs).

---

## Tech Stack

* **Backend**: Python 3.11+, FastAPI, NetworkX, NumPy, Pandas, Scikit-Learn (`IsolationForest`), ReportLab (PDF executive briefing generator), Pytest
* **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Cytoscape.js (hierarchical Purdue entity graph), Lucide Icons, local `@fontsource/inter` and `@fontsource/jetbrains-mono`
* **Offline & Demo Hardening**: Socket-level outbound network blocker (`OFFLINE=1`) and static JSON fallback snapshot (`VITE_FALLBACK=1`)

---

## Setup & Run Instructions

### Prerequisites
* **Python**: 3.11 or 3.12
* **Node.js**: v18+ and npm v9+

### 1. Backend Setup (macOS / Linux)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run build
cd ..
```

### 3. Run the Application

* **Terminal 1 — Start the FastAPI Backend (`http://127.0.0.1:8000`)**:
  ```bash
  OFFLINE=1 .venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
  # Or use ./run_backend.sh
  ```

* **Terminal 2 — Start the Vite Frontend (`http://127.0.0.1:5173`)**:
  ```bash
  cd frontend && npm run dev -- --host 127.0.0.1 --port 5173
  # Or use ./run_frontend.sh
  ```

### Windows Setup (PowerShell / CMD)

```bat
python -m venv .venv
.venv\Scripts\activate
pip install -r backend\requirements.txt
cd frontend && npm install && cd ..
run_backend.bat
run_frontend.bat
```

---

## Demo Mode, Offline Guard & Fallback Snapshot

* **Demo Mode (`?demo=1`)**: Opening `http://127.0.0.1:5173/?demo=1` automatically resets session state (`POST /api/reset`), selects the **Nation-state APT** persona (which enters via the misconfigured third-party Vendor VPN), opens the **Graph** view with the crown-jewel **Disinfection Chlorine Dosing Skid PLC** (`asset_water_plc_chlorine`) pre-selected, highlights its 3-hop attack path (`Vendor VPN → Water SCADA → Water HMI → Chlorine PLC`), and opens the right-hand analyst detail panel.
* **Keyboard Shortcuts**:
  * `1` – `4`: Switch between **Dashboard**, **Graph**, **Remediation**, and **How It Works**
  * `T`: Toggle live CISA KEV **Threat drop** simulation
  * `D`: Reset session to clean baseline
  * `Esc`: Close the right-sliding asset detail panel
  * `?`: Toggle the keyboard shortcut legend
* **Socket-Level Offline Guard (`OFFLINE=1`)**: `backend/engine/offline_guard.py` hooks Python's `socket.socket.connect`, `connect_ex`, and `getaddrinfo` to block any non-loopback network connection immediately with a `RuntimeError`.
* **Static JSON Fallback (`VITE_FALLBACK=1`)**: Run `.venv/bin/python -m backend.scripts.dump_fallback` to bake all 30 GET/POST API responses into `frontend/public/fallback/*.json`. Starting Vite with `VITE_FALLBACK=1 npm run dev` serves the entire interactive demo without a running Python process.

---

## Data Sources & Evidence Pack

All intelligence feeds and empirical sector baselines are pre-cached locally under `data/cache/`, `data/research/`, and `data/ssvc/`:

| Dataset / Artifact | Local Path | Records | Provenance & Version |
| :--- | :--- | ---: | :--- |
| **CISA KEV Catalog** | `data/cache/cisa_kev_map.json` | 1,766 | CISA Known Exploited Vulnerabilities Catalog (`v2026.10.29`, BOD 22-01) |
| **FIRST EPSS (Current & 30-Day)** | `data/cache/epss_current.json`, `epss_history.json` | 38 | FIRST.org Exploit Prediction Scoring System v3 API snapshot |
| **NVD CVE Details (CVSS v3.x)** | `data/cache/nvd_cve_details.json` | 38 | NIST National Vulnerability Database REST API v2.0 |
| **MITRE ATT&CK for ICS** | `data/cache/attack_ics_techniques.json` | 118 | `mitre/cti` commit `50be388` (`ics-attack.json`) |
| **ATT&CK ICS Hop & Mitigation Maps** | `data/research/attack_ics_*.json` | 153 | Targeted asset types (18), campaigns (10), detection (3), hop map (18), mitigations (104) |
| **CISA CSAF OT Advisory Index** | `data/research/csaf_ot_cve_index.json.gz` | 105 | `cisagov/CSAF` commit `3c2594d` (TLP:WHITE OT vendor advisories) |
| **KEV × EPSS ICS Sector Evidence** | `data/research/kev_epss_ics_evidence.json` | 6 | Cross-sector empirical justification for water-sector `KEV_FLOOR = 0.5` |
| **CISA Bad Practices Catalog** | `data/research/bad_practices.json` | 3 | `cisagov/bad-practices` commit `fd26f25` |
| **HAI 21.03 Anomaly Baseline** | `data/research/hai_p3_isolation_forest_baseline.json` | 7 | HIL-based Augmented ICS (`icsdataset/hai`) Isolation Forest reference |
| **EPA WNTR Hydraulic Simulation** | `data/research/wntr_pump_outage_net3.json` | 2 | USEPA Water Network Tool for Resilience (`WNTR v1.5.0`) Net3 pump outage |
| **CERT/CC SSVC Decision Tables** | `data/ssvc/*.csv`, `SSVC_MAPPING.md` | 123 | `CERTCC/SSVC` commit `bf3213b` deployer priority & human impact matrices |
| **CERT-In Smart City & 70B Rules** | `data/certin_mapping.json`, `response_templates.json` | 11 | CERT-In Smart City Guidelines & 28 April 2022 Directions (6-hour reporting) |
| **Consequence & Assumption Inputs** | `docs/inputs/consequence_numbers.md`, `assumptions_justifications.md` | 69 | IWA *The Source* (Mohan & Abhijith, 2021), CPHEEO manual, INL CCE |

---

## Testing & Credibility Verification

```bash
# 1. Run the full 53-test unit, API, scenario, and mathematical invariant suite in offline mode
OFFLINE=1 .venv/bin/pytest -v

# 2. Recompute mathematical invariants, parameter sensitivity (Kendall's tau), and CVSS divergence report
OFFLINE=1 .venv/bin/python -m backend.scripts.run_validation

# 3. Benchmark startup & bake all 30 static fallback JSON payloads
OFFLINE=1 .venv/bin/python -m backend.scripts.dump_fallback

# 4. Type-check and build the production frontend bundle
npm --prefix frontend run build
```

---

## Team Credits

Built for **Problem Statement 03 — AI-Based Critical Infrastructure Cyber-Risk Prediction & Prioritisation**:

* **Team Vidura**: Cyber-Physical Systems Risk Modelling, Threat Intelligence & Graph Analytics, Anomaly Detection ML Pipeline, and Analyst Decision-Support UI.
* **Methodological Foundations**: Idaho National Laboratory (INL) *Consequence-driven Cyber-informed Engineering (CCE)*, CISA *Known Exploited Vulnerabilities (KEV)* & *Bad Practices*, FIRST *EPSS*, MITRE *ATT&CK for ICS*, CERT/CC *SSVC*, and *CERT-In* Smart City Security Guidelines.
