"""
Unit tests for OFFLINE=1 guard.
"""
import os
import socket
import pytest
from backend.engine.offline_guard import install_offline_guard, is_loopback


def test_is_loopback_helper():
    assert is_loopback("localhost") is True
    assert is_loopback("127.0.0.1") is True
    assert is_loopback("::1") is True
    assert is_loopback("0.0.0.0") is True
    assert is_loopback("8.8.8.8") is False
    assert is_loopback("google.com") is False
    assert is_loopback("192.168.1.50") is False


def test_offline_guard_blocks_external_lookup(monkeypatch):
    monkeypatch.setenv("OFFLINE", "1")
    install_offline_guard()

    # Attempting to resolve an external host should raise RuntimeError
    with pytest.raises(RuntimeError, match="Outbound network call blocked in OFFLINE mode"):
        socket.getaddrinfo("nvd.nist.gov", 443)

    # Attempting to connect to an external IP should raise RuntimeError
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        with pytest.raises(RuntimeError, match="Outbound network call blocked in OFFLINE mode"):
            s.connect(("8.8.8.8", 53))
    finally:
        s.close()
