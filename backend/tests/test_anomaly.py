"""
Tests for anomaly detection engine and flow simulation.
"""
import json
import numpy as np
import pytest
from pathlib import Path

from backend.data_pipeline.simulate_flows import generate_flows, RANDOM_SEED
from backend.engine.anomaly import train_and_evaluate, get_anomaly, inject_anomaly, CACHE_DIR, EVAL_FILE, _ENGINE_STATE


def test_flows_simulation_reproducibility():
    flows1, labels1 = generate_flows(days=2, save_to_disk=False)
    flows2, labels2 = generate_flows(days=2, save_to_disk=False)

    assert len(flows1) == len(flows2)
    assert len(labels1) == len(labels2)
    assert flows1[0]["timestamp"] == flows2[0]["timestamp"]
    assert flows1[0]["bytes"] == flows2[0]["bytes"]


def test_injected_attack_windows_score_higher_than_normal_median():
    eval_result = train_and_evaluate(contamination=0.03, random_state=RANDOM_SEED)
    assert EVAL_FILE.exists()

    with open(EVAL_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert data["evaluation_type"] == "Synthetic data, injected attacks"
    assert "metrics" in data
    assert data["metrics"]["recall"] > 0.0

    test_df = _ENGINE_STATE["test_df"]
    assert test_df is not None

    normal_windows = test_df[test_df["ground_truth"] == 0]["anomaly_score"].values
    attack_windows = test_df[test_df["ground_truth"] == 1]["anomaly_score"].values

    median_normal = float(np.median(normal_windows))
    mean_attack = float(np.mean(attack_windows))

    # Injected attack windows must score significantly higher than the median normal window
    assert mean_attack > median_normal
    assert mean_attack >= 0.70
    assert median_normal <= 0.35

    # Check top affected assets
    vpn_anomaly = get_anomaly("asset_vendor_vpn")
    scada_anomaly = get_anomaly("asset_water_scada")
    assert vpn_anomaly["score"] > median_normal
    assert scada_anomaly["score"] > median_normal


def test_get_anomaly_schema():
    anomaly_info = get_anomaly("asset_vendor_vpn")
    assert "score" in anomaly_info
    assert 0.0 <= anomaly_info["score"] <= 1.0
    assert "top_contributing_features" in anomaly_info
    assert isinstance(anomaly_info["top_contributing_features"], list)
    assert "example_flows" in anomaly_info


def test_inject_anomaly_increases_score():
    target = "asset_pwr_switch"
    initial = get_anomaly(target)["score"]
    injected = inject_anomaly(target)

    assert injected["score"] >= initial
    assert injected["score"] >= 0.85
    assert injected["injected"] is True
    assert len(injected["top_contributing_features"]) > 0
    assert len(injected["example_flows"]) > 0
