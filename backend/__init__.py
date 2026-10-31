"""
Vidura Backend Root Package.
Automatically installs the offline network guard if OFFLINE=1 is set.
"""
from backend.engine.offline_guard import install_offline_guard

install_offline_guard()
