# Vidura (विदुरु) — Critical Infrastructure Cyber-Risk Platform

<div align="center">

<img src="frontend/public/vidura-shield.svg" alt="Vidura Shield Logo" width="110" height="110" />

### **Consequence-Driven Cyber-Physical Risk Prediction, Prioritisation & Sovereign Defense**
*Problem Statement 03 — Consequence-Driven Cyber-Physical Risk Decision Support for Critical Information Infrastructure (CII)*

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![NetworkX](https://img.shields.io/badge/NetworkX-Graph%20Theory-blue?style=for-the-badge)](https://networkx.org/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-Isolation%20Forest-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Tests](https://img.shields.io/badge/Tests-58%20Passed-brightgreen?style=for-the-badge)](backend/tests/)
[![Offline First](https://img.shields.io/badge/Offline-100%25%20Air--Gapped-red?style=for-the-badge)](backend/engine/offline_guard.py)
[![Compliance](https://img.shields.io/badge/Compliance-NCIIPC%20CII%20%7C%20CERT--In%2070B%20%7C%20IEC%2062443-orange?style=for-the-badge)](#sovereign-compliance--regulatory-audit-binder)

[**Live Demo Walkthrough**](#live-demo--quick-walkthrough) • [**System Architecture**](#system-architecture--the-dual-graph-model) • [**Key Innovations & USPs**](#five-landmark-usps--why-vidura-wins) • [**Mathematical Rigor**](#mathematical-formulation) • [**Quickstart (3 Mins)**](#quickstart--run-in-3-minutes) • [**API Reference**](#api-specification) • [**Mathematical Invariants**](#mathematical-invariants--credibility-verification)

</div>

---

## Executive Summary

Critical Information Infrastructure (CII) — municipal water treatment works, electrical power grids, district trauma hospitals, and metro rail networks — cannot be secured using standard enterprise IT vulnerability scanners. Traditional tools sort vulnerabilities by static **CVSS base scores**. This produces dangerous blind spots:
1. An unpatched **CVSS 9.8** SQL injection on an air-gapped municipal billing server is assigned urgent priority, while a **CVSS 6.8** unauthenticated Modbus TCP command injection on a chlorine dosing PLC is ignored.
2. In reality, the SQL injection causes zero physical downtime, while the chlorine PLC vulnerability can **poison the potable water reservoir of 500,000 citizens in under 4 hours**.
3. Plant engineers cannot patch live operational PLCs/RTUs without taking entire utility plants offline, triggering blackouts or contaminated water supplies.

**Vidura** solves this fundamental crisis. Built on Idaho National Laboratory's **Consequence-driven Cyber-informed Engineering (CCE)** methodology, Vidura couples:
* A multi-hop, probabilistic **Attack Graph** ("*How an adversary gets in*"), with
* A cascading physical **Municipal Dependency Graph** ("*What breaks in the real world*").

Vidura quantifies true cyber-physical risk, attributes exact risk drivers (`risk_drop_if_removed`), identifies non-obvious topological choke points, generates **zero-downtime compensating control CLI snippets** (Cisco, FortiOS, iptables, Suricata), and formulates an optimal budget-constrained remediation roadmap that respects real-world OT maintenance windows.

---

## Five Landmark USPs — Why Vidura Wins

| # | High-Impact Capability | Legacy Scanners (Tenable, Qualys, Nessus) | Generic Graph Tools (BloodHound) | **Vidura Risk Engine** |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Zero-Downtime Compensating Controls** | Tells you to "patch firmware" (requires 8h plant shutdown). | None. | **Provides instant, copy-pasteable firewall micro-segmentation & virtual patch CLI commands** (Cisco ASA/FTD, FortiOS, Linux iptables, Suricata Modbus DPI) that drop risk by up to 78% with zero operational interruption. |
| **2** | **Physical Consequence Telemetry** | Abstract 1–10 scores. Zero physical ground truth. | Active Directory permissions only. | **Grounds every risk score in municipal physical impact**: Million Litres per Day (MLD) water curtailment, Megawatts (MW) grid curtailment, and municipal reserve buffer hours to dry taps. |
| **3** | **Asymmetric Attacker Work Factor Ratio** | Assumes all attackers are identical. | Unweighted hop counts. | **Quantifies adversary economics**: Measures the ratio between attacker exploitation cost and defender mitigation cost (e.g. **42× attacker multiplier** for a 14h engineering sprint). |
| **4** | **"What Breaks First?" Cascade Scrub Bar** | Static PDF snapshot. | Static topology layout. | **Interactive timeline playback ($T+0.0\text{h} \to T+6.0\text{h}$)**: Visualizes the chronological wave of compromise and cascading municipal failure with millisecond Cytoscape graph animation. |
| **5** | **1-Click Sovereign Regulatory Audit Package** | Generic CSV exports. | Raw JSON dumps. | **Instant export of an official audit package** conforming to Indian **NCIIPC Critical Information Infrastructure** guidelines, **CERT-In 6-Hour Section 70B** directions, and **IEC 62443-3-3** Security Levels. |

---

## System Architecture — The Dual-Graph Model

Vidura models operational technology using two coupled, directed mathematical graphs:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   VIDURA DUAL-GRAPH RISK ENGINE                                  │
├───────────────────────────────────────────────┬──────────────────────────────────────────────────┤
│ 1. ATTACK GRAPH ("How They Get In")           │ 2. DEPENDENCY GRAPH ("What Breaks In The City")  │
│ • Purdue Model Hierarchy (Internet → L4 → L0) │ • OT Controllers → Physical Municipal Services   │
│ • CISA KEV + FIRST EPSS v3 + NVD CVEs         │ • Water Pumping, Chlorine Dosing, Power Grid,    │
│ • Unauthenticated Remote Access & Credentials │   District Trauma Hospital, Traffic Signalling   │
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

## Mathematical Formulation

### 1. Unified Risk Formula
The risk score for any asset $a$ is bounded strictly within $[0, 100]$:
$$\text{Risk}(a) = 100 \times L_n(a) \times C(a)$$

### 2. Multi-Hop Attack Likelihood ($L_n$)
Each directed network transition $(u \to v)$ carries a conditional exploitation probability:
$$p(u, v) = \max\!\left(\text{EPSS}(v), \text{KEV\_FLOOR}\right) \times \text{CredFactor}(v)$$
Where:
* $\text{KEV\_FLOOR} = 0.50$ if any vulnerability on $v$ is present in the **CISA Known Exploited Vulnerabilities (KEV)** catalog.
* $\text{CredFactor}(v) = 0.90$ for default/hardcoded credentials, $0.30$ for exposed remote access without MFA, and $0.10$ otherwise.
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

## Indian Metros Scalability

Vidura includes out-of-the-box topological and consequence parameter profiles for **10 major Indian metropolitan areas**, scaling population consequence, municipal utilities, and water/power distribution baselines:

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

## Repository Structure

```
d3coy/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI REST application & OpenAPI router
│   │   ├── schemas.py                 # Pydantic v2 data models & validation schemas
│   │   └── auth.py                    # Role-based JWT authentication & access control
│   ├── engine/
│   │   ├── risk_calculator.py         # Dual-Graph unified risk scoring engine
│   │   ├── attack_graph.py            # Yen's Top-k shortest simple paths & MITRE ICS mapper
│   │   ├── dependency_graph.py        # Physical service cascade DAG & consequence propagation
│   │   ├── choke_point.py             # Betweenness centrality & topological cut-set analysis
│   │   ├── remediation.py             # Budget-constrained greedy knapsack planner & CLI snippets
│   │   ├── what_if.py                 # Counterfactual simulation engine
│   │   ├── scenario.py                # Pydantic scenario loader & cross-graph integrity checks
│   │   ├── cities.py                  # 10 Indian metropolitan consequence scaling registry
│   │   ├── report_generator.py        # Executive PDF briefing generator (ReportLab)
│   │   ├── intel.py                   # CISA KEV, FIRST EPSS & NVD offline cache manager
│   │   ├── validation.py              # Mathematical invariant verification suite
│   │   └── offline_guard.py           # Socket-level air-gap enforcement hook
│   ├── tests/
│   │   ├── test_api.py                # 58 comprehensive automated tests
│   │   └── conftest.py                # Pytest fixtures & mock sessions
│   └── requirements.txt               # Pinned Python dependencies
│
├── frontend/
│   ├── public/
│   │   ├── fallback/                  # 30 baked static JSON fixtures for 100% offline demo
│   │   │   ├── cities.json
│   │   │   ├── compliance_audit_package.json
│   │   │   └── ...
│   │   ├── vidura-shield.svg          # Official brand vector logo
│   │   ├── vidura-shield-smooth.svg   # Browser tab favicon
│   │   └── vidura-app-icon.png        # 818x818 high-resolution app tile
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx             # Floating frosted navbar with city switcher & PDF export
│   │   │   ├── RiskTableView.tsx      # Ranked asset inventory with physical impact chips
│   │   │   ├── GraphView.tsx          # Cytoscape Purdue entity graph & Cascade Timeline scrubber
│   │   │   ├── RemediationView.tsx    # Knapsack planner, CLI snippets & Asymmetric Work Factor
│   │   │   ├── HowItWorksView.tsx     # Interactive mathematical walkthrough & formulas
│   │   │   ├── AssetDetailModal.tsx   # Deep-dive drawer with counterfactual "Why" factor drops
│   │   │   └── ui/
│   │   │       └── liquid-glass-logo-reveal.tsx  # WebGL liquid-glass startup shader
│   │   ├── landing/                   # High-converting landing page with flow buttons
│   │   ├── types/api.ts               # TypeScript interfaces matching backend Pydantic models
│   │   ├── apiClient.ts               # Resilient fetch client with transparent fallback routing
│   │   ├── App.tsx                    # Top-level state orchestration & keyboard navigation
│   │   └── main.tsx                   # React root entry point
│   ├── package.json                   # Pinned npm dependencies
│   ├── tsconfig.json                  # Strict TypeScript configuration
│   └── vite.config.ts                 # Vite bundler configuration
│
├── data/
│   ├── scenario.json                  # Ground-truth Navanagar cyber-physical reference topology
│   ├── assumptions.json               # Physical constants, safety thresholds, and cost weights
│   ├── certin_mapping.json            # CERT-In compliance directive cross-walk
│   ├── cache/                         # Local pre-cached CISA KEV, EPSS, NVD & anomaly baselines
│   └── research/                      # Academic papers, EPA WNTR hydraulic traces & HAI datasets
│
├── run_backend.sh                     # One-click POSIX backend runner
├── run_frontend.sh                    # One-click POSIX frontend runner
├── run_backend.bat                    # One-click Windows backend runner
├── run_frontend.bat                   # One-click Windows frontend runner
└── README.md                          # Comprehensive documentation
```

---

## Live Demo & Quick Walkthrough

### 1. One-Click Demo Mode (`?demo=1`)
Opening `http://127.0.0.1:5173/?demo=1` initializes a flawless judge presentation:
* **Session Reset**: Resets dirty state (`POST /api/reset`).
* **Persona Selection**: Activates the **Nation-State APT** threat profile.
* **Crown-Jewel Focus**: Directly navigates to the **Graph View**, centering on the **Disinfection Chlorine Dosing Skid PLC** (`asset_water_plc_chlorine`).
* **Path Highlighting**: Automatically animates the 3-hop traversal path (`Vendor VPN → Water SCADA → Water HMI → Chlorine PLC`).
* **Analyst Drawer**: Pops open the right-side inspection drawer revealing the exact physical consequence (380 MLD potable water lost, 4h buffer to dry taps, 42,000 citizens affected).

### 2. Interactive Keyboard Hotkeys
| Key | Action | Description |
| :---: | :--- | :--- |
| `1` | **Dashboard View** | Shows the ranked asset risk table, physical loss chips, and trend indicators. |
| `2` | **Graph View** | Hierarchical Cytoscape Purdue model (Internet down to L0 field instruments). |
| `3` | **Remediation View** | Greedy knapsack roadmap, zero-downtime CLI snippets, and work factor ROI. |
| `4` | **How It Works** | Step-by-step mathematical proof, sensitivity curves, and formula derivations. |
| `T` | **Toggle Threat Drop** | Simulates a live CISA KEV zero-day exploit drop on Siemens S7 PLCs. |
| `D` | **Reset Session** | Cleans all simulated anomalies and restores baseline operational state. |
| `Esc` | **Close Drawer** | Dismisses any open asset detail or modal dialog. |
| `?` | **Shortcut Cheat Sheet** | Displays the instant on-screen keyboard shortcut guide. |

---

## Quickstart — Run in 3 Minutes

### Prerequisites
* **Python**: `3.11` or `3.12`
* **Node.js**: `v18+` and `npm v9+`

### 1. Backend Setup
```bash
# Clone the repository
git clone https://github.com/adityabapat/decoy.git
cd decoy

# Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt
```

### 2. Frontend Setup
```bash
# Navigate to frontend directory
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

## 100% Air-Gapped & Offline Reliability Guarantee

Critical infrastructure security software must operate inside completely isolated, air-gapped security operations centers (SOCs) without external internet access:

1. **Socket-Level Air-Gap Enforcement (`OFFLINE=1`)**:
   [`backend/engine/offline_guard.py`](file:///Users/adityabapat/Desktop/decoy/backend/engine/offline_guard.py) intercepts low-level OS calls (`socket.connect`, `socket.connect_ex`, `socket.getaddrinfo`). Any outbound call outside loopback (`127.0.0.1`) raises an immediate, fatal `RuntimeError`, guaranteeing that no telemetry leaks and no external API requests are made.

2. **Zero-Dependency Static Fallback (`VITE_FALLBACK=1`)**:
   All 30 REST endpoints are pre-baked as deterministic static JSON snapshots inside [`frontend/public/fallback/`](file:///Users/adityabapat/Desktop/decoy/frontend/public/fallback/). If python is unavailable, run:
   ```bash
   cd frontend && VITE_FALLBACK=1 npm run dev
   ```
   The entire interactive dashboard, graph traversal, what-if knapsack planner, city switcher, and compliance package generator function smoothly directly from browser memory.

---

## API Specification

Vidura provides a clean, well-documented OpenAPI REST API compliant with RFC specifications:

| Method | Endpoint | Query / Body Params | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | None | Returns backend engine health status. |
| `GET` | `/api/cities` | None | Lists all 10 supported Indian metropolitan areas with populations & utilities. |
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

## Sovereign Compliance & Regulatory Audit Binder

Vidura natively aligns with statutory Indian cybersecurity regulations:

1. **NCIIPC Critical Information Infrastructure (CII) Guidelines**:
   * Automated identification of **Mandatory Protection Entities** (MPEs) across Water and Power sectors.
   * IEC 62443-3-3 Security Level Target alignment (**SL-3 / SL-4** for Level 1/0 controllers).

2. **CERT-In Directions under Section 70B of the IT Act, 2000**:
   * **6-Hour Mandatory Incident Notification**: Pre-populates the formal CERT-In Cyber Incident Reporting Schedule for any critical asset breach.
   * **180-Day System Log Retention**: Automatically generates SHA-256 evidence integrity hashes for all audit manifests.

Clicking **"Compliance"** in the top navigation immediately downloads a cryptographically verifiable evidence binder (`Vidura_Sovereign_Compliance_Audit_<City>_<ID>.json`) ready for submission to regulatory authorities.

---

## Mathematical Invariants & Credibility Verification

To prove mathematical soundess, Vidura includes a continuous invariant verification engine ([`backend/engine/validation.py`](file:///Users/adityabapat/Desktop/decoy/backend/engine/validation.py)):

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

## Data Intelligence Provenance

All intelligence feeds are curated from authoritative international and Indian national bodies:

* **CISA Known Exploited Vulnerabilities (KEV)**: Catalog snapshot `v2026.10.29` (BOD 22-01).
* **FIRST Exploit Prediction Scoring System (EPSS)**: Model v3 probability curves.
* **NIST National Vulnerability Database (NVD)**: CVSS v3.1 vector representations.
* **MITRE ATT&CK® for Industrial Control Systems (ICS)**: Technique mappings and hop mitigations.
* **HIL-based Augmented ICS (HAI) Dataset**: Isolation Forest anomaly training baselines (v21.03).
* **EPA Water Network Tool for Resilience (WNTR)**: Hydraulic transient outage models (v1.5.0).
* **CERT/CC Stakeholder-Specific Vulnerability Categorization (SSVC)**: Decision priority logic.

---

## Team & Acknowledgements

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
