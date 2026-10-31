"""
Pytest configuration for Vidura test suite.
Ensures OFFLINE=1 enforcement guard is active during test runs.
"""
from backend.engine.offline_guard import install_offline_guard

install_offline_guard()
