"""
Vidura Fallback Data Dumper & Startup Performance Benchmark.

This script executes against the Vidura FastAPI application in demo state,
benchmarking response latencies across all endpoints and dumping static JSON
responses to `frontend/public/fallback/`. When VITE_FALLBACK=1 is set, the
frontend API client loads these precomputed responses directly, ensuring 100%
offline demo reliability without a live backend.

Dumped File Documentation:
--------------------------------------------------------------------------------
1.  health.json                     - GET /api/health
2.  meta.json                       - GET /api/meta
3.  assumptions.json                - GET /api/assumptions
4.  scenario.json                   - GET /api/scenario
5.  validation.json                 - GET /api/validation
6.  choke_points.json               - GET /api/choke-points
7.  graph_dependency.json           - GET /api/graph/dependency
8.  threat_drop.json                - GET /api/threat-drop
9.  risk_assets_nation_state.json   - GET /api/risk/assets?persona=nation_state
10. risk_assets_opportunistic.json  - GET /api/risk/assets?persona=opportunistic
11. risk_assets_insider.json        - GET /api/risk/assets?persona=insider
12. risk_assets.json                - Default alias to risk_assets_nation_state.json
13. graph_attack_nation_state.json  - GET /api/graph/attack?persona=nation_state
14. graph_attack_opportunistic.json - GET /api/graph/attack?persona=opportunistic
15. graph_attack_insider.json       - GET /api/graph/attack?persona=insider
16. graph_attack.json               - Default alias to graph_attack_nation_state.json
17. anomaly_water_scada.json        - GET /api/anomaly/asset_water_scada
18. anomaly_vendor_vpn.json         - GET /api/anomaly/asset_vendor_vpn
19. anomaly_water_plc.json          - GET /api/anomaly/asset_water_plc_chlorine
20. reset.json                      - POST /api/reset
21. threat_drop_toggle_active.json  - POST /api/threat-drop/toggle (active=true)
22. threat_drop_toggle_inactive.json- POST /api/threat-drop/toggle (active=false)
23. anomaly_inject_water_scada.json - POST /api/anomaly/inject (asset_water_scada)
24. remediation_plan_20h.json       - POST /api/remediation/plan (budget=20h, 3 fixes)
25. remediation_plan.json           - Default alias to remediation_plan_20h.json
26. whatif_water_plc_mfa_vpn.json   - POST /api/simulate (act_mfa_vpn)
27. whatif_water_plc_seg_jump.json  - POST /api/simulate (act_seg_jump)
28. whatif_water_plc_mon.json       - POST /api/simulate (act_mon_water_plc)
29. whatif_water_plc_all_three.json - POST /api/simulate (all 3 water PLC actions)
30. simulate.json                   - Default alias to whatif_water_plc_all_three.json
--------------------------------------------------------------------------------
"""
import json
import os
import sys
import time
from pathlib import Path
from starlette.testclient import TestClient

# Ensure OFFLINE=1 compliance
os.environ.setdefault("OFFLINE", "1")

from backend.app.main import app


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
FALLBACK_DIR = REPO_ROOT / "frontend" / "public" / "fallback"


def run_benchmark_and_dump() -> None:
    FALLBACK_DIR.mkdir(parents=True, exist_ok=True)
    print("=" * 70)
    print("Vidura Fallback Data Dumper & Startup Performance Benchmark")
    print(f"Output directory: {FALLBACK_DIR}")
    print("=" * 70)

    # 1. Benchmark startup precompute
    t_start = time.perf_counter()
    with TestClient(app) as client:
        t_startup = (time.perf_counter() - t_start) * 1000
        print(f"[*] Application Startup & Precompute Time: {t_startup:.2f} ms\n")

        timings = []

        def call_endpoint(method: str, url: str, filename: str, json_body: dict = None) -> dict:
            t0 = time.perf_counter()
            if method == "GET":
                resp = client.get(url)
            else:
                resp = client.post(url, json=json_body)
            t_elapsed = (time.perf_counter() - t0) * 1000

            assert resp.status_code == 200, f"Error calling {url}: {resp.status_code} {resp.text}"
            data = resp.json()

            out_path = FALLBACK_DIR / filename
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)

            timings.append((f"{method} {url}", t_elapsed, filename))
            print(f"  [OK] {method:<4} {url:<45} -> {filename:<32} ({t_elapsed:6.2f} ms)")
            return data

        print("--- GET Endpoints ---")
        call_endpoint("GET", "/api/health", "health.json")
        call_endpoint("GET", "/api/meta", "meta.json")
        call_endpoint("GET", "/api/assumptions", "assumptions.json")
        call_endpoint("GET", "/api/scenario", "scenario.json")
        call_endpoint("GET", "/api/validation", "validation.json")
        call_endpoint("GET", "/api/choke-points", "choke_points.json")
        call_endpoint("GET", "/api/graph/dependency", "graph_dependency.json")
        call_endpoint("GET", "/api/threat-drop", "threat_drop.json")

        call_endpoint("GET", "/api/risk/assets?persona=nation_state", "risk_assets_nation_state.json")
        call_endpoint("GET", "/api/risk/assets?persona=opportunistic", "risk_assets_opportunistic.json")
        call_endpoint("GET", "/api/risk/assets?persona=insider", "risk_assets_insider.json")
        # Default alias
        with open(FALLBACK_DIR / "risk_assets_nation_state.json", "r", encoding="utf-8") as src_f:
            with open(FALLBACK_DIR / "risk_assets.json", "w", encoding="utf-8") as dst_f:
                dst_f.write(src_f.read())

        call_endpoint("GET", "/api/graph/attack?persona=nation_state", "graph_attack_nation_state.json")
        call_endpoint("GET", "/api/graph/attack?persona=opportunistic", "graph_attack_opportunistic.json")
        call_endpoint("GET", "/api/graph/attack?persona=insider", "graph_attack_insider.json")
        # Default alias
        with open(FALLBACK_DIR / "graph_attack_nation_state.json", "r", encoding="utf-8") as src_f:
            with open(FALLBACK_DIR / "graph_attack.json", "w", encoding="utf-8") as dst_f:
                dst_f.write(src_f.read())

        call_endpoint("GET", "/api/anomaly/asset_water_scada", "anomaly_water_scada.json")
        call_endpoint("GET", "/api/anomaly/asset_vendor_vpn", "anomaly_vendor_vpn.json")
        call_endpoint("GET", "/api/anomaly/asset_water_plc_chlorine", "anomaly_water_plc.json")

        print("\n--- Demo POST Flows ---")
        call_endpoint("POST", "/api/reset", "reset.json")
        call_endpoint("POST", "/api/threat-drop/toggle", "threat_drop_toggle_active.json", {"active": True})
        call_endpoint("POST", "/api/threat-drop/toggle", "threat_drop_toggle_inactive.json", {"active": False})
        call_endpoint("POST", "/api/anomaly/inject", "anomaly_inject_water_scada.json", {"asset_id": "asset_water_scada"})

        # Plan with 3 fixes (budget=20h, persona=nation_state)
        call_endpoint("POST", "/api/remediation/plan", "remediation_plan_20h.json", {
            "engineer_hours_budget": 20.0,
            "persona": "nation_state",
            "apply_threat_drop": False,
        })
        with open(FALLBACK_DIR / "remediation_plan_20h.json", "r", encoding="utf-8") as src_f:
            with open(FALLBACK_DIR / "remediation_plan.json", "w", encoding="utf-8") as dst_f:
                dst_f.write(src_f.read())

        # What-if simulations for the 3 options on the water PLC:
        # Option 1: MFA on vendor VPN
        call_endpoint("POST", "/api/simulate", "whatif_water_plc_mfa_vpn.json", {
            "persona": "nation_state",
            "applied_actions": ["act_mfa_vpn"],
            "apply_threat_drop": False,
        })

        # Option 2: Micro-segmentation on DMZ Jump Host
        call_endpoint("POST", "/api/simulate", "whatif_water_plc_seg_jump.json", {
            "persona": "nation_state",
            "applied_actions": ["act_seg_jump"],
            "apply_threat_drop": False,
        })

        # Option 3: Enhanced monitoring on water PLC
        call_endpoint("POST", "/api/simulate", "whatif_water_plc_mon.json", {
            "persona": "nation_state",
            "applied_actions": ["act_mon_water_plc"],
            "apply_threat_drop": False,
        })

        # All 3 options combined:
        call_endpoint("POST", "/api/simulate", "whatif_water_plc_all_three.json", {
            "persona": "nation_state",
            "applied_actions": ["act_mfa_vpn", "act_seg_jump", "act_mon_water_plc"],
            "apply_threat_drop": False,
        })
        with open(FALLBACK_DIR / "whatif_water_plc_all_three.json", "r", encoding="utf-8") as src_f:
            with open(FALLBACK_DIR / "simulate.json", "w", encoding="utf-8") as dst_f:
                dst_f.write(src_f.read())

        # Reset session state after dumping
        client.post("/api/reset")

    print("\n" + "=" * 70)
    print("Performance Timing Summary:")
    print("-" * 70)
    for endpoint, latency, filename in sorted(timings, key=lambda x: x[1], reverse=True):
        print(f"  {latency:6.2f} ms | {endpoint}")
    max_latency = max(t[1] for t in timings)
    avg_latency = sum(t[1] for t in timings) / len(timings)
    print("-" * 70)
    print(f"Average Endpoint Latency : {avg_latency:6.2f} ms")
    print(f"Peak Endpoint Latency    : {max_latency:6.2f} ms")
    print(f"Total Dumped Files       : {len(list(FALLBACK_DIR.glob('*.json')))}")
    print("=" * 70)


if __name__ == "__main__":
    run_benchmark_and_dump()
