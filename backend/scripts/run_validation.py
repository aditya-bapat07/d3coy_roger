"""
CLI script to compute all Vidura credibility, invariant, sensitivity, CVSS comparison,
and anomaly evaluation metrics and merge them into data/cache/validation.json.
Preserves any keys written by other steps (e.g. recovery_greedy_vs_brute, rank_stability).
"""
import json
import sys
from pathlib import Path

# Ensure repo root is on sys.path when invoked directly
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.engine.validation import VALIDATION_FILE, build_validation_report


def main() -> None:
    report = build_validation_report(save_and_merge=True)
    inv = report["invariants"]
    sens = report["sensitivity_analysis"]
    cvss = report["cvss_comparison"]

    print("=== Vidura Credibility & Validation Report ===")
    print(f"Saved (merged) to: {VALIDATION_FILE}")
    print(f"\n1. Invariants: {inv['summary']}")
    for chk in inv["checks"]:
        status = "PASS" if chk["passed"] else "FAIL"
        print(f"   [{status}] {chk['name']} — {chk['details']}")

    print(f"\n2. Sensitivity Analysis (mean min Kendall's tau = {sens['mean_min_kendall_tau']:.4f}):")
    for p in sens["parameters"][:5]:
        print(
            f"   - {p['label']}: tau(-50%)={p['kendall_tau_minus_50']:.3f}, "
            f"tau(+50%)={p['kendall_tau_plus_50']:.3f}, max rank shifts={p['max_top_10_rank_shifts']}/10"
        )

    print(f"\n3. CVSS Comparison: Kendall's tau vs CVSS-only = {cvss['kendall_tau_vs_cvss']:.4f}")
    for d in cvss["biggest_disagreements"][:4]:
        print(f"   - {d['name']}: Vidura #{d['vidura_rank']} vs CVSS #{d['cvss_rank']} | {d['computed_reason']}")


if __name__ == "__main__":
    main()
