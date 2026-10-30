"""
Tests for threat intelligence loader module.
"""
import pytest
from backend.engine.intel import get_cve, get_epss_history, get_technique, list_cached_cves, reload_cache


def test_intel_cve_lookup():
    reload_cache()
    # Check a known KEV CVE
    cve = get_cve("CVE-2021-22681")
    if cve:
        assert cve["cve_id"] == "CVE-2021-22681"
        assert cve["kev"] is True
        assert cve["cvss"] is not None
        assert cve["attack_vector"] is not None


def test_intel_missing_cve():
    reload_cache()
    cve = get_cve("CVE-9999-99999")
    assert cve is None


def test_intel_technique_lookup():
    reload_cache()
    tech = get_technique("T0814")
    if tech:
        assert tech["id"] == "T0814"
        assert "Denial of Service" in tech["name"]
        assert len(tech["tactics"]) > 0

