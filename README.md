# Vidura

**AI-Based Critical Infrastructure Cyber-Risk Prediction & Prioritisation**  
*Problem Statement 03 — 24-Hour Prototype*

Vidura is an AI-powered cyber-risk prediction and decision support system designed specifically for critical infrastructure plant security managers. It deterministically models the **Attack Graph** (network reachability, real EPSS exploitability, CISA KEV flags, Purdue zone crossings) and the **Dependency Graph** (physical consequence cascade across water/energy utilities and urban infrastructure based on INL CCE principles).

---

## Architecture & Tech Stack

* **Backend**: Python 3.11+, FastAPI, NetworkX, Pandas, Scikit-learn, ReportLab, Pytest
* **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Cytoscape.js, Recharts, Framer Motion, Lucide Icons
* **Offline-First**: Runs entirely local with zero external API calls during operation.

---

## Setup Instructions

### Prerequisites
* Python 3.11 or 3.12
* Node.js v18+ and npm v9+
* Git

### macOS & Linux Setup

1. **Clone the repository**:
   ```bash
   git clone <repo_url>
   cd decoy
   ```

2. **Setup Backend**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install --upgrade pip
   pip install -r backend/requirements.txt
   ```

3. **Setup Frontend**:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Run Unit Tests**:
   ```bash
   pytest
   ```

5. **Run the Services**:
   * Terminal 1 (Backend):
     ```bash
     ./run_backend.sh
     # API runs at http://127.0.0.1:8000
     ```
   * Terminal 2 (Frontend):
     ```bash
     ./run_frontend.sh
     # App runs at http://localhost:5173
     ```

---

### Windows Setup (PowerShell or Command Prompt)

1. **Setup Backend**:
   ```bat
   python -m venv .venv
   .venv\Scripts\activate
   python -m pip install --upgrade pip
   pip install -r backend\requirements.txt
   ```

2. **Setup Frontend**:
   ```bat
   cd frontend
   npm install
   cd ..
   ```

3. **Run Unit Tests**:
   ```bat
   pytest
   ```

4. **Run the Services**:
   * Terminal 1 (Backend):
     ```bat
     run_backend.bat
     ```
   * Terminal 2 (Frontend):
     ```bat
     run_frontend.bat
     ```

---

## Verification

1. Open `http://localhost:5173` in your browser.
2. Confirm the top banner displays:
   - **Backend API Health Status: `ok`**
   - **Endpoint**: `GET http://localhost:8000/api/health`
3. Review the Purdue Model zones and the Unified Risk Scale Tokens (0–100).

