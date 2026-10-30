"""
Select realistic candidate CVEs from CISA KEV and NVD for critical infrastructure modeling.
"""
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
CACHE_DIR = DATA_DIR / "cache"

# Non-KEV ICS CVEs (verified real vulnerabilities from NVD)
NON_KEV_ICS_CVES = [
    # Siemens SIMATIC PLCs & SCADA
    {"cve_id": "CVE-2020-15782", "vendor": "Siemens", "product": "SIMATIC S7-1200 / S7-1500", "role": "L1 Basic Control (PLC)"},
    {"cve_id": "CVE-2022-38465", "vendor": "Siemens", "product": "SIMATIC S7-1500 / ET 200SP", "role": "L1 Basic Control (PLC)"},
    {"cve_id": "CVE-2019-19292", "vendor": "Siemens", "product": "SIMATIC S7-1200 CPU", "role": "L1 Basic Control (PLC)"},
    {"cve_id": "CVE-2020-27664", "vendor": "Siemens", "product": "SIMATIC WinCC", "role": "L2 Supervisory / HMI"},
    # Schneider Electric Modicon PLCs & Software
    {"cve_id": "CVE-2021-22779", "vendor": "Schneider Electric", "product": "Modicon M580 / M340", "role": "L1 Basic Control (PLC)"},
    {"cve_id": "CVE-2020-28212", "vendor": "Schneider Electric", "product": "Modicon Quantum / Premium", "role": "L1 Basic Control (PLC)"},
    {"cve_id": "CVE-2021-22800", "vendor": "Schneider Electric", "product": "EcoStruxure Control Expert", "role": "L3 Engineering Workstation"},
    {"cve_id": "CVE-2015-7937", "vendor": "Schneider Electric", "product": "Modicon M340 BMXNOE", "role": "L1 Ethernet Comm Module"},
    # Rockwell Automation ControlLogix & FactoryTalk
    {"cve_id": "CVE-2023-3595", "vendor": "Rockwell Automation", "product": "1756 ControlLogix EN2T/EN3T", "role": "L1/L2 Industrial Comm Module"},
    {"cve_id": "CVE-2023-3596", "vendor": "Rockwell Automation", "product": "1756 ControlLogix", "role": "L1 Industrial Controller"},
    {"cve_id": "CVE-2022-3157", "vendor": "Rockwell Automation", "product": "FactoryTalk View SE", "role": "L2 Supervisory HMI"},
    # Moxa Industrial Ethernet & Serial Gateways
    {"cve_id": "CVE-2022-44734", "vendor": "Moxa", "product": "NPort 5110 Serial Device Server", "role": "L1/L0 Field Serial Gateway"},
    {"cve_id": "CVE-2021-31886", "vendor": "Moxa", "product": "EDS-510E Managed Switch", "role": "L2/L3 Industrial Switch"},
    {"cve_id": "CVE-2018-10609", "vendor": "Moxa", "product": "NPort 5000 Series", "role": "L1/L0 Field Device Server"},
    # Kepware OPC UA & SCADA
    {"cve_id": "CVE-2023-28157", "vendor": "PTC Kepware", "product": "KEPServerEX OPC UA", "role": "L3 OPC Gateway Server"},
    # Advantech WebAccess / SCADA
    {"cve_id": "CVE-2020-12034", "vendor": "Advantech", "product": "WebAccess/SCADA", "role": "L3 Operations SCADA Node"},
    {"cve_id": "CVE-2021-32944", "vendor": "Advantech", "product": "WebAccess/SCADA", "role": "L3 Operations SCADA Node"},
]

# Targeted KEV CVEs from ICS and Edge/Remote-Access vendors
TARGET_KEV_CVES = [
    # ICS / SCADA
    "CVE-2021-22681",  # Rockwell Logix controllers
    "CVE-2023-6448",   # Unitronics Vision PLC and HMI (Reserved candidate for Threat Drop)
    "CVE-2018-7841",   # Schneider Electric U.motion Builder
    "CVE-2016-8562",   # Siemens SIMATIC CP 1543-1
    # Edge Firewalls & VPNs (Purdue Entry / DMZ)
    "CVE-2022-42475",  # Fortinet FortiOS SSL-VPN
    "CVE-2023-27997",  # Fortinet FortiOS SSL-VPN
    "CVE-2024-21762",  # Fortinet FortiOS SSL-VPN
    "CVE-2018-13379",  # Fortinet FortiOS SSL-VPN
    "CVE-2023-46805",  # Ivanti Connect Secure
    "CVE-2024-21887",  # Ivanti Connect Secure
    "CVE-2019-11510",  # Pulse Secure Pulse Connect Secure
    "CVE-2023-3519",   # Citrix NetScaler ADC / Gateway
    "CVE-2023-4966",   # Citrix NetScaler ADC (Citrix Bleed)
    "CVE-2024-3400",   # Palo Alto Networks PAN-OS GlobalProtect
    "CVE-2020-2021",   # Palo Alto Networks PAN-OS SAML auth bypass
    "CVE-2023-20198",  # Cisco IOS XE Web UI
    "CVE-2020-3118",   # Cisco IOS XE CDP
    "CVE-2020-3452",   # Cisco ASA / Firepower
    "CVE-2018-0101",   # Cisco ASA Remote Code Execution
    # L4 Enterprise IT / Workstation / Identity
    "CVE-2020-1472",   # Microsoft Netlogon (Zerologon)
    "CVE-2021-34527",  # Microsoft Windows Print Spooler (PrintNightmare)
    "CVE-2021-26855",  # Microsoft Exchange Server (ProxyLogon)
    "CVE-2017-0144",   # Microsoft SMBv1 (EternalBlue)
]


def select_cves():
    kev_map_file = CACHE_DIR / "cisa_kev_map.json"
    if not kev_map_file.exists():
        raise FileNotFoundError(f"Missing {kev_map_file}. Run fetch_kev.py first.")

    with open(kev_map_file, "r", encoding="utf-8") as f:
        kev_cache = json.load(f)
    kev_vulns = kev_cache.get("vulnerabilities", {})

    selected = []

    # Process KEV CVEs
    for cve_id in TARGET_KEV_CVES:
        if cve_id in kev_vulns:
            k = kev_vulns[cve_id]
            selected.append({
                "cve_id": cve_id,
                "vendor": k.get("vendorProject"),
                "product": k.get("product"),
                "kev": True,
                "kev_date_added": k.get("dateAdded"),
                "kev_required_action": k.get("requiredAction"),
                "role": "Edge / Remote-Access / L4 / SCADA",
            })
        else:
            logger.warning("Target KEV CVE %s not found in KEV cache! Skipping.", cve_id)

    # Process Non-KEV ICS CVEs
    for item in NON_KEV_ICS_CVES:
        cve_id = item["cve_id"]
        is_kev = cve_id in kev_vulns
        selected.append({
            "cve_id": cve_id,
            "vendor": item["vendor"],
            "product": item["product"],
            "kev": is_kev,
            "kev_date_added": kev_vulns[cve_id].get("dateAdded") if is_kev else None,
            "kev_required_action": kev_vulns[cve_id].get("requiredAction") if is_kev else None,
            "role": item["role"],
        })

    fetch_time = datetime.now(timezone.utc).isoformat()
    output_path = CACHE_DIR / "selected_cves.json"
    result = {
        "generated_at": fetch_time,
        "total_count": len(selected),
        "kev_count": sum(1 for c in selected if c["kev"]),
        "non_kev_count": sum(1 for c in selected if not c["kev"]),
        "cves": selected,
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    logger.info("Selected %d candidate CVEs (%d KEV, %d Non-KEV) written to %s",
                result["total_count"], result["kev_count"], result["non_kev_count"], output_path)
    return result


if __name__ == "__main__":
    select_cves()

