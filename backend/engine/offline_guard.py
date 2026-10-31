"""
Offline Mode Guard for Vidura.

When OFFLINE=1 is set in the environment, all outbound network calls
(HTTP, socket connections, external DNS queries) to non-loopback destinations
are immediately blocked with a RuntimeError.
"""
import ipaddress
import os
import socket
from typing import Any, Tuple, Union

_GUARD_INSTALLED = False
_ORIGINAL_CONNECT = socket.socket.connect
_ORIGINAL_CONNECT_EX = socket.socket.connect_ex
_ORIGINAL_GETADDRINFO = socket.getaddrinfo

LOOPBACK_HOSTS = {"localhost", "127.0.0.1", "::1", "0.0.0.0", "", None}


def is_loopback(host: Any) -> bool:
    """Return True if host is localhost or a loopback IP address."""
    if host in LOOPBACK_HOSTS:
        return True
    if not isinstance(host, str):
        return False
    try:
        ip = ipaddress.ip_address(host)
        return ip.is_loopback
    except ValueError:
        return False


def install_offline_guard() -> None:
    """
    Installs socket and getaddrinfo interceptors if OFFLINE=1 is present in env.
    Raises RuntimeError immediately on any non-loopback network connection or lookup.
    """
    global _GUARD_INSTALLED
    if _GUARD_INSTALLED:
        return
    if os.environ.get("OFFLINE") != "1":
        return

    def guarded_connect(self: socket.socket, address: Union[Tuple[Any, ...], str, bytes]) -> Any:
        if isinstance(address, tuple) and len(address) >= 1:
            host = address[0]
            if not is_loopback(host):
                raise RuntimeError(
                    f"Outbound network call blocked in OFFLINE mode: connecting to {address}"
                )
        return _ORIGINAL_CONNECT(self, address)

    def guarded_connect_ex(self: socket.socket, address: Union[Tuple[Any, ...], str, bytes]) -> Any:
        if isinstance(address, tuple) and len(address) >= 1:
            host = address[0]
            if not is_loopback(host):
                raise RuntimeError(
                    f"Outbound network call blocked in OFFLINE mode: connecting to {address}"
                )
        return _ORIGINAL_CONNECT_EX(self, address)

    def guarded_getaddrinfo(host: Any, port: Any, *args: Any, **kwargs: Any) -> Any:
        if host is not None and not is_loopback(host):
            raise RuntimeError(
                f"Outbound network call blocked in OFFLINE mode: DNS lookup for {host}"
            )
        return _ORIGINAL_GETADDRINFO(host, port, *args, **kwargs)

    socket.socket.connect = guarded_connect  # type: ignore
    socket.socket.connect_ex = guarded_connect_ex  # type: ignore
    socket.getaddrinfo = guarded_getaddrinfo  # type: ignore
    _GUARD_INSTALLED = True
