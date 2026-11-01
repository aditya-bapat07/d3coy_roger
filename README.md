# Vidura

**See the physical consequence before the breach occurs.**

An AI-powered cyber-physical risk prediction, prioritisation, and sovereign remediation platform for critical information infrastructure — built for **Problem Statement 03: Consequence-Driven Cyber-Physical Risk Decision Support for Critical Infrastructure**.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![NetworkX](https://img.shields.io/badge/NetworkX-3.4-blue)](https://networkx.org/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.6-F7931E?logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Cytoscape](https://img.shields.io/badge/Cytoscape.js-3.30-EA580C)](https://js.cytoscape.org/)
[![Pydantic](https://img.shields.io/badge/Pydantic-v2.10-E92063?logo=pydantic&logoColor=white)](https://docs.pydantic.dev/)
[![tests](https://img.shields.io/badge/tests-58_passing-brightgreen)](backend/tests/)
[![air-gapped](https://img.shields.io/badge/air--gapped-100%25_offline-red)](backend/engine/offline_guard.py)
[![compliance](https://img.shields.io/badge/compliance-NCIIPC_CII_%7C_CERT--In_70B-orange)](#sovereign-compliance--regulatory-audit-binder)

---

## The problem

PS03 observes that existing vulnerability management tools *"rely on static CVSS base-score sorting that completely ignores industrial control topology, physical consequence propagation, and operational downtime constraints."* They overwhelm plant engineers with thousands of generic IT CVEs while missing the critical, multi-hop kill chains that take down physical urban services.

Vidura answers the questions a critical infrastructure CISO and plant operations manager actually have:
* *Which controller breach poisons our water supply or blacks out the trauma hospital first?*
* *How long does our city have before taps run dry once telemetry drops ($T+0\text{h} \to T+6\text{h}$)?*
* *How can we neutralize 78% of the risk today when we cannot take live PLCs offline to patch firmware?*
* *Which defensive moves buy the highest safety return for the scarce 20 engineering hours we actually have?*

---

## The core idea: two graphs, not one

Most vulnerability platforms look only at isolated software flaws. Vidura couples **two directed graphs**:

1. **The Attack Graph ("How they get in")**: Models the digital ingress and multi-hop network propagation through the standard ISA-95 / Purdue Model hierarchy ($L_4 \to L_{3.5} \to L_3 \to L_2 \to L_1 \to L_0$). Edge weights combine **CISA KEV** exploit intelligence, **FIRST EPSS v3** exploitation probabilities, credential exposures, and **Isolation Forest ML** flow anomaly detection.
2. **The Physical Dependency Graph ("What breaks in the city")**: A directed acyclic graph (DAG) tracing how digital controller failure propagates into municipal utility collapse — treating water treatment pumping, chlorine chemical dosing, district power substations, hospital trauma centers, and traffic grids as interdependent physical flows.

$$\text{Unified Risk}(a) = 100 \times \underbrace{L_n(a)}_{\text{Multi-Hop Likelihood (0–1)}} \times \underbrace{C(a)}_{\text{Physical Consequence (0–1)}}$$

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   VIDURA DUAL-GRAPH RISK ENGINE                                  │
├───────────────────────────────────────────────┬──────────────────────────────────────────────────┤
│ 1. ATTACK GRAPH ("How They Get In")           │ 2. DEPENDENCY GRAPH ("What Breaks In The City")  │
│ • Purdue Model Hierarchy (Internet → L4 → L0) │ • OT Controllers → Physical Municipal Services   │
│ • CISA KEV + FIRST EPSS v3 + NVD CVEs         │ • Water Pumping, Chlorine Dosing, Power Grid,    │
│ • Credential & Remote Access Exposures        │   District Trauma Hospital, Traffic Signalling   │
│ • Scikit-Learn Isolation Forest ML Anomaly    │ • Physical failure delays & backup power rules   │
│ • Yen's Top-k Shortest Simple Paths Search    │ • Non-double-counted population bounding         │
└───────────────────────┬───────────────────────┴────────────────────────┬─────────────────────────┘
                        │                                                │
                        ▼                                                ▼
              Normalised Likelihood (L_n)                      Physical Consequence (C)
            L_n = (log₁₀(max(L, 10⁻⁶)) + 6) / 6              C = 0.5·S_norm + 0.3·P_norm + 0.2·T_norm
                        │                                                │
                        └───────────────────────►  × 100  ◄──────────────┘
                                                 │
                                                 ▼
                                  Unified Asset Risk Score (0–100)
                                                 │
             ┌───────────────────────────────────┼───────────────────────────────────┐
             ▼                                   ▼                                   ▼
   "Why" Factor Drop                  Choke-Point Analysis                  Greedy Knapsack
 (risk_drop_if_removed)             (Betweenness Centrality)             Remediation & What-If
Counterfactual attribution           Topological bottlenecks             Optimal risk reduction
for individual exposures             blocking max attack paths           under engineer-hour caps
```

---

## The 5 landmark USPs

| # | Capability | Legacy Vulnerability Scanners (Tenable, Qualys) | Generic Graph Tools (BloodHound) | **Vidura Risk Engine** |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Zero-Downtime Compensating Controls** | Demands "patch firmware immediately" (requires 8h plant shutdown). | None. | **Auto-generates virtual patch CLI snippets** (Cisco ASA/FTD, FortiOS, Linux iptables, Suricata Modbus DPI) that drop risk by up to 78% with zero operational interruption. |
| **2** | **Physical Consequence Telemetry** | Abstract 1–10 scores. Zero physical grounding. | Active Directory permissions only. | **Grounds every score in municipal utility impact**: Million Litres per Day (MLD) water volume lost, Megawatts (MW) grid curtailment, and municipal reserve buffer hours to dry taps. |
| **3** | **Asymmetric Attacker Work Factor Ratio** | Assumes all attackers are identical. | Unweighted hop counts. | **Quantifies adversary economics**: Measures the ratio between attacker exploitation cost and defender mitigation cost (e.g. **42× attacker multiplier** for a 14h engineer sprint). |
| **4** | **"What Breaks First?" Cascade Scrub Bar** | Static PDF report. | Static graph visualization. | **Interactive timeline playback ($T+0.0\text{h} \to T+6.0\text{h}$)**: Visualizes the chronological wave of compromise and cascading municipal failure with millisecond Cytoscape graph animation. |
| **5** | **1-Click Sovereign Regulatory Audit Package** | Generic CSV exports. | Raw JSON dumps. | **Instant export of an official audit package** conforming to Indian **NCIIPC Critical Information Infrastructure** guidelines, **CERT-In 6-Hour Section 70B** directions, and **IEC 62443-3-3** Security Levels. |

---

## Detailed mathematical formulation

### 1. Unified Risk Formula
The risk score for any asset $a$ is strictly bounded in $[0, 100]$:
$$\text{Risk}(a) = 100 \times L_n(a) \times C(a)$$

### 2. Multi-Hop Attack Likelihood ($L_n$)
Each directed network transition $(u \to v)$ carries a conditional exploitation probability:
$$p(u, v) = \max\!\left(\text{EPSS}(v), \text{KEV\_FLOOR}\right) \times \text{CredFactor}(v)$$

* $\text{KEV\_FLOOR} = 0.50$ if any vulnerability on $v$ is cataloged in the **CISA Known Exploited Vulnerabilities (KEV)** database.
* $\text{CredFactor}(v) = 0.90$ for default or hardcoded credentials, $0.30$ for exposed remote management without MFA, and $0.10$ otherwise.
* **Isolation Forest Anomaly Telemetry Boost**: Live network flow anomalies dynamically escalate edge transition probability:
  $$p'(u, v) = p(u, v) + \big(1 - p(u, v)\big) \times \alpha \times \text{anomaly\_score}(v), \quad \alpha = 0.30$$

* **Yen's Top-$k$ Shortest-Path Search**: Transforming edge probabilities into additive weights via $w(u, v) = -\log_{10}(p'(u, v))$, Vidura computes the optimal path and top-$k$ alternate attack trajectories using `networkx.shortest_simple_paths`. Persona hop limits enforce real-world adversary constraints:
  * **Opportunistic Script Kiddie**: Max 3 hops, per-asset CVSS floor $\ge 7.0$.
  * **Insider Threat**: Max 6 hops, direct ingress at L3.5 Operations Jump Host.
  * **Nation-State APT**: Max 8 hops, multi-stage pivot via compromised Vendor VPN gateway.

* **Fixed Logarithmic Normalisation**: Raw attack likelihood $L \in [10^{-6}, 1]$ is mapped onto $[0, 1]$ via:
  $$L_n = \frac{\log_{10}(\max(L, 10^{-6})) + 6}{6}$$
  This guarantees that updating one asset's posture **never distorts or rescales other assets' scores** (preserving strict monotonicity).

### 3. Cascading Physical Consequence ($C$)
Consequence is calculated by propagating failure waves downstream from compromised Level 1/0 controllers across the municipal service DAG:
$$C = 0.5 \times \frac{\text{safety\_severity}}{4} + 0.3 \times \min\!\left(1, \frac{\max(\text{people\_served})}{\text{BasePopulation}}\right) + 0.2 \times \min\!\left(1, \frac{\text{max\_outage\_hours}}{72}\right)$$
* **Non-Double-Counting**: Uses $\max(\text{people\_served})$ across simultaneously impaired services to prevent fictitious population inflation.
* **Backup Power & Generator Overrides**: Recognizes automatic transfer switches (e.g. Hospital 72h diesel generator backup delay) before safety severity escalates.

### 4. Counterfactual Factor Attribution (`risk_drop_if_removed`)
For complete explainability, Vidura computes an exact Shapley-inspired counterfactual delta for each asset:
$$\Delta \text{Risk}(f) = \text{Risk}_{\text{current}} - \text{Risk}_{\text{without factor } f}$$
Evaluated independently for: Internet exposure, firewall pinholes, CISA KEV status, individual CVEs, and ML telemetry anomalies.

---

## Zero-downtime compensating controls (CLI terminal)

When plant operators cannot take a live PLC offline to patch firmware, Vidura provides instant, copy-pasteable configuration snippets across 4 enterprise networking layers:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Cisco ASA / FTD Hardware ACL                                                           │
│ access-list OT_INSPECTION extended deny tcp any host 192.168.10.45 eq 502             │
│ access-list OT_INSPECTION extended permit tcp 10.0.1.0 255.255.255.0 host 192.168.10.45│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ FortiOS Virtual Patching & Decoupling                                                  │
│ config firewall policy                                                                 │
│   edit 101                                                                             │
│     set srcintf "dmz" set dstintf "ot_cell" set action accept                          │
│     set ips-sensor "Modbus_Strict_Enforce" set ssl-ssh-profile "deep-inspection"       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Linux iptables Kernel Rule                                                             │
│ iptables -I FORWARD 1 -p tcp --dport 502 -m string --hex-string "|00 00 00 00 00 06|"  │
│   --algo bm -j DROP                                                                    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Suricata Deep Packet Inspection (DPI) Rule                                             │
│ drop modbus any any -> $PLC_SUBNET 502 (msg:"VIDURA-01: Unauthorized Modbus Write";   │
│   modbus.function:5; sid:9001001; rev:1;)                                              │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 10 Indian metropolitan scaling matrix

Vidura includes built-in consequence scaling profiles for **10 major Indian metropolitan areas**, adjusting population consequence, municipal utilities, and water/power distribution baselines:

```
┌─────────────┬─────────────────┬──────────────┬────────────────────────┬──────────────────────────┐
│ City ID     │ Metro Region    │ State        │ Population (Aggl.)     │ Primary Water / Power    │
├─────────────┼─────────────────┼──────────────┼────────────────────────┼──────────────────────────┤
│ navanagar   │ Navanagar (Ref) │ Fictional    │ 500,000 citizens       │ Municipal Water Works    │
│ delhi       │ Delhi NCR       │ Delhi        │ 33.0 Million           │ Delhi Jal Board / DISCOM │
│ mumbai      │ Mumbai Metro    │ Maharashtra  │ 21.7 Million           │ BMC Hydraulic / Tata Pwr │
│ kolkata     │ Kolkata         │ West Bengal  │ 15.6 Million           │ KMC Water / CESC         │
│ bengaluru   │ Bengaluru       │ Karnataka    │ 14.0 Million           │ BWSSB / BESCOM           │
│ chennai     │ Chennai         │ Tamil Nadu   │ 11.5 Million           │ CMWSSB / TANGEDCO        │
│ hyderabad   │ Hyderabad       │ Telangana    │ 11.0 Million           │ HMWSSB / TSSPDCL         │
│ ahmedabad   │ Ahmedabad       │ Gujarat      │ 8.9 Million            │ AMC Water / Torrent Pwr  │
│ surat       │ Surat           │ Gujarat      │ 8.0 Million            │ SMC Water Works / DGVCL  │
│ pune        │ Pune Metro      │ Maharashtra  │ 7.4 Million            │ PMC Water / MSEDCL       │
│ lucknow     │ Lucknow         │ Uttar Pradesh│ 4.0 Million            │ Lucknow Jal / UPPCL      │
└─────────────┴─────────────────┴──────────────┴────────────────────────┴──────────────────────────┘
```

---

## System architecture & data flow

```
  ┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
  │   Live Ingestion Feed   │      │ Offline Intelligence    │      │ Municipal SCADA System  │
  │  Modbus TCP Telemetry   │      │ CISA KEV + FIRST EPSS   │      │ Level 0/1/2/3/4 Purdue  │
  └────────────┬────────────┘      └────────────┬────────────┘      └────────────┬────────────┘
               │                                │                                │
               ▼                                ▼                                ▼
  ┌───────────────────────────────────────────────────────────────────────────────────────────┐
  │                           VIDURA INGESTION & VALIDATION ENGINE                            │
  │            • Pydantic v2 Schema Validation • Air-Gap Socket Guard (OFFLINE=1)             │
  └─────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                                │
                                                ▼
  ┌───────────────────────────────────────────────────────────────────────────────────────────┐
  │                            ANOMALY DETECTION & GRAPH SEARCH                               │
  │ • Scikit-Learn Isolation Forest Telemetry Scorer (alpha = 0.30)                           │
  │ • Yen's Top-k Shortest Simple Paths Search via NetworkX (-log10 transition weights)       │
  │ • Betweenness Centrality Choke-Point Identification                                       │
  │ • Cascading Physical Outage Propagation across Service DAG                                │
  └─────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                                │
                                                ▼
  ┌───────────────────────────────────────────────────────────────────────────────────────────┐
  │                            DECISION SUPPORT & REMEDIATION                                 │
  │ • Dynamic Knapsack Planner: Maximize Risk Reduction within Engineer-Hour Budget           │
  │ • Zero-Downtime Virtual Patching: Cisco ACL, FortiOS, iptables, Suricata DPI              │
  │ • Asymmetric Attacker Work Factor Multiplier (e.g. 42x cost ratio)                        │
  │ • Sovereign Compliance Binder: NCIIPC Mandatory Disclosures & CERT-In Section 70B         │
  └─────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                                │
                                                ▼
  ┌───────────────────────────────────────────────────────────────────────────────────────────┐
  │                                ANALYST PRESENTATION LAYER                                 │
  │ • React 18 + TypeScript + Vite + Tailwind CSS Dark UI                                     │
  │ • Cytoscape.js Hierarchical Purdue Graph Layout                                           │
  │ • "What Breaks First?" Cascade Scrub Bar (T+0.0h to T+6.0h animated slider)               │
  │ • WebGL Liquid-Glass Startup Shader & Micro-Interactions                                  │
  │ • 1-Click Executive PDF Briefing Generator (ReportLab)                                    │
  └───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Quickstart — run in 3 minutes

### Prerequisites
* **Python**: `3.11` or `3.12`
* **Node.js**: `v18+` and `npm v9+`

### 1. Backend Setup
```bash
# Clone the repository
git clone https://github.com/adityabapat/decoy.git
cd decoy

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
```

### 2. Frontend Setup
```bash
# Install frontend dependencies and build bundle
cd frontend
npm install
npm run build
cd ..
```

### 3. Launch Vidura
Open two terminal windows:

* **Terminal 1 — Backend API** (`http://127.0.0.1:8000`):
  ```bash
  ./run_backend.sh
  # Or: OFFLINE=1 .venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
  ```

* **Terminal 2 — Frontend UI** (`http://127.0.0.1:5173`):
  ```bash
  ./run_frontend.sh
  # Or: cd frontend && npm run dev -- --host 127.0.0.1 --port 5173
  ```

### Windows Users
Simply run:
```bat
run_backend.bat
run_frontend.bat
```

---

## 100% air-gapped & offline demo guarantee

1. **Socket-Level Air-Gap Guard (`OFFLINE=1`)**:
   [`backend/engine/offline_guard.py`](file:///Users/adityabapat/Desktop/decoy/backend/engine/offline_guard.py) hooks low-level OS calls (`socket.connect`, `socket.connect_ex`, `socket.getaddrinfo`). Any outbound attempt outside loopback (`127.0.0.1`) raises an immediate, fatal `RuntimeError`, guaranteeing zero telemetry leaks.

2. **Static JSON Fallback Snapshot (`VITE_FALLBACK=1`)**:
   All 30 REST endpoints are pre-baked as deterministic static JSON snapshots in [`frontend/public/fallback/`](file:///Users/adityabapat/Desktop/decoy/frontend/public/fallback/). If python is unavailable, run:
   ```bash
   cd frontend && VITE_FALLBACK=1 npm run dev
   ```
   The entire interactive dashboard, graph traversal, what-if knapsack planner, city switcher, and compliance package generator function smoothly directly from browser memory.

---

## Demo mode & analyst shortcuts

* **One-Click Demo Mode (`?demo=1`)**: Opening `http://127.0.0.1:5173/?demo=1` automatically:
  * Resets session state (`POST /api/reset`).
  * Activates the **Nation-State APT** persona.
  * Directs focus to the **Graph View**, centering on the **Disinfection Chlorine Dosing Skid PLC** (`asset_water_plc_chlorine`).
  * Highlights the 3-hop attack path (`Vendor VPN → Water SCADA → Water HMI → Chlorine PLC`).
  * Opens the right-side analyst drawer showing physical consequences (380 MLD potable water lost, 4h buffer to dry taps, 42,000 citizens affected).

* **Keyboard Hotkeys**:
  * `1`: **Dashboard View** (Ranked asset table & physical loss chips)
  * `2`: **Graph View** (Hierarchical Cytoscape Purdue model)
  * `3`: **Remediation View** (Knapsack planner, CLI snippets, work factor ROI)
  * `4`: **How It Works** (Mathematical proofs, formulas, sensitivity curves)
  * `T`: **Toggle Threat Drop** (Live CISA KEV exploit drop simulation)
  * `D`: **Reset Session** (Cleans simulated anomalies and restores baseline)
  * `Esc`: **Close Drawer** (Dismisses open modal or analyst inspector)
  * `?`: **Shortcut Cheat Sheet** (Displays on-screen hotkey guide)

---

## API reference

| Method | Endpoint | Query / Body Params | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | None | Engine health check. |
| `GET` | `/api/cities` | None | Lists 10 Indian metropolitan areas with populations and utilities. |
| `POST` | `/api/city/select` | `{"city_id": "mumbai"}` | Rescales consequence inputs to selected metropolitan population. |
| `GET` | `/api/risk/assets` | `persona`: `nation_state` \| `opportunistic` \| `insider` | Returns assets ranked by unified risk score, MLD loss, and why factor drops. |
| `GET` | `/api/graph/attack` | `persona`: (enum) | Generates multi-hop attack graph, primary paths, and top-3 Yen trajectories. |
| `GET` | `/api/graph/dependency` | None | Returns municipal physical service dependency DAG with cascade delays. |
| `GET` | `/api/choke-points` | None | Computes topological choke points using Betweenness Centrality. |
| `POST` | `/api/remediation/plan` | `{"budget_hours": 20}` | Formulates optimal knapsack remediation plan with zero-downtime CLI snippets. |
| `POST` | `/api/simulate` | `{"applied_actions": ["act_mfa_vpn"]}` | Runs what-if counterfactual simulation recalculating system-wide delta. |
| `POST` | `/api/threat-drop/toggle` | `{"active": true}` | Injects live CISA KEV exploit (`CVE-2023-6448`) dynamically recalculating posture. |
| `POST` | `/api/anomaly/inject` | `{"asset_id": "asset_water_scada"}` | Injects Isolation Forest network flow anomaly boost. |
| `GET` | `/api/report/pdf` | `persona`: (enum) | Generates executive PDF risk briefing with ReportLab vector charts. |
| `GET` | `/api/compliance/audit-package` | `persona`: (enum) | **Exports 1-Click Sovereign NCIIPC & CERT-In 70B Regulatory Evidence Binder**. |
| `POST` | `/api/session/reset` | None | Resets injected anomalies, threat drops, and restores clean state. |

---

## Sovereign compliance & regulatory audit binder

Vidura natively aligns with statutory Indian cybersecurity regulations:

1. **NCIIPC Critical Information Infrastructure (CII) Guidelines**:
   * Automated identification of **Mandatory Protection Entities** (MPEs) across Water and Power sectors.
   * IEC 62443-3-3 Security Level Target alignment (**SL-3 / SL-4** for Level 1/0 controllers).

2. **CERT-In Directions under Section 70B of the IT Act, 2000**:
   * **6-Hour Mandatory Incident Notification**: Pre-populates the formal CERT-In Cyber Incident Reporting Schedule for any critical asset breach.
   * **180-Day System Log Retention**: Automatically generates SHA-256 evidence integrity hashes for all audit manifests.

Clicking **"Compliance"** in the top navigation immediately downloads a cryptographically verifiable evidence binder (`Vidura_Sovereign_Compliance_Audit_<City>_<ID>.json`) ready for submission to regulatory authorities.

---

## Mathematical invariants & credibility verification

Vidura includes a continuous invariant verification engine ([`backend/engine/validation.py`](file:///Users/adityabapat/Desktop/decoy/backend/engine/validation.py)):

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               MATHEMATICAL INVARIANT SUITE RESULTS                              │
├──────────────────────────────────┬──────────────────────────────────────────────────────────────┤
│ Theorem / Invariant Property     │ Empirical Proof & Verification Outcome                       │
├──────────────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 1. Strict Monotonicity           │ ✅ PASSED: d(Risk)/d(Likelihood) >= 0; d(Risk)/d(Conseq) >= 0 │
│ 2. Exact Scale Invariance        │ ✅ PASSED: Fixed log base prevents cross-asset score skew    │
│ 3. Universal Range Boundedness   │ ✅ PASSED: Forall a in Assets: 0.0 <= Risk(a) <= 100.0       │
│ 4. Graph Completeness            │ ✅ PASSED: 0 dangling references in 17 nodes and 22 edges    │
│ 5. Consequence Non-Negativity    │ ✅ PASSED: Forall a in Assets: Consequence(a) >= 0.0         │
│ 6. Knapsack Budget Feasibility   │ ✅ PASSED: Sum(action_hours) <= budget_hours (strict <=)     │
├──────────────────────────────────┴──────────────────────────────────────────────────────────────┤
│ Statistical Sensitivity: Kendall's Tau Rank Correlation = 0.941 across parameter perturbations  │
│ CVSS Divergence Proof: Kendall's Tau vs Raw CVSS = 0.218 (confirms Vidura fixes CVSS failures)  │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Run the validation suite anytime with:
```bash
OFFLINE=1 .venv/bin/pytest backend/tests/ -v
OFFLINE=1 .venv/bin/python -m backend.scripts.run_validation
```

---

## Data intelligence provenance

All intelligence feeds are curated from authoritative international and Indian national bodies:

* **CISA Known Exploited Vulnerabilities (KEV)**: Catalog snapshot `v2026.10.29` (BOD 22-01).
* **FIRST Exploit Prediction Scoring System (EPSS)**: Model v3 probability curves.
* **NIST National Vulnerability Database (NVD)**: CVSS v3.1 vector representations.
* **MITRE ATT&CK® for Industrial Control Systems (ICS)**: Technique mappings and hop mitigations.
* **HIL-based Augmented ICS (HAI) Dataset**: Isolation Forest anomaly training baselines (v21.03).
* **EPA Water Network Tool for Resilience (WNTR)**: Hydraulic transient outage models (v1.5.0).
* **CERT/CC Stakeholder-Specific Vulnerability Categorization (SSVC)**: Decision priority logic.

---

## Team & citations

Developed for **Problem Statement 03 — AI-Based Critical Infrastructure Cyber-Risk Prediction & Prioritisation**:

* **Team Vidura**:
  * **Aditya Bapat** — Cyber-Physical System Architect, Graph Algorithms & Full-Stack UI Engineering.
* **Academic & Methodological References**:
  * Idaho National Laboratory (INL) — *Consequence-driven Cyber-informed Engineering (CCE)*.
  * U.S. Cybersecurity and Infrastructure Security Agency (CISA) — *Cross-Sector Cybersecurity Performance Goals (CPGs)*.
  * National Critical Information Infrastructure Protection Centre (NCIIPC) — *Guidelines for the Protection of CII*.
  * Indian Computer Emergency Response Team (CERT-In) — *Cyber Security Directions under Section 70B*.

---

<div align="center">

**Built with pride for sovereign critical infrastructure resilience.**  
*Vidura — Seeing the consequence before the breach occurs.*

</div>
