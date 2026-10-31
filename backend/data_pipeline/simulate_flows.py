"""
Flow Simulator for Vidura.
Generates 7 days of realistic synthetic network flow records across the Purdue model,
injects labelled attack scenarios during the last 2 days, and saves flow logs and ground-truth labels.
"""
import json
import logging
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Tuple

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
CACHE_DIR = DATA_DIR / "cache"

RANDOM_SEED = 42


def generate_flows(days: int = 7, save_to_disk: bool = True) -> Tuple[List[Dict], List[Dict]]:
    random.seed(RANDOM_SEED)

    # Base start time: exactly 7 days ago
    start_time = datetime(2026, 10, 23, 0, 0, 0, tzinfo=timezone.utc)
    total_hours = days * 24

    flows = []
    labels = []  # list of {asset_id, hour_window, is_attack, attack_type, description}

    # Tracking sets for known normal behavior
    # Edge profiles based on scenario.json network rules:
    # 1. Periodic SCADA/HMI/PLC (continuous, 24/7)
    # 2. Corporate IT traffic (workdays 08:00 - 18:00)
    # 3. Patching / backups (scheduled off-hours windows)

    logger.info("Simulating %d days (%d hours) of synthetic flows with seed %d...", days, total_hours, RANDOM_SEED)

    for hour_idx in range(total_hours):
        current_hour_time = start_time + timedelta(hours=hour_idx)
        hour_of_day = current_hour_time.hour
        is_weekend = current_hour_time.weekday() >= 5
        is_work_hour = (8 <= hour_of_day <= 18) and not is_weekend

        # ---------------------------------------------------------------------
        # 1. Normal OT & SCADA Steady Traffic (24/7 continuous control loops)
        # ---------------------------------------------------------------------
        # Water plant HMI -> PLCs (Modbus TCP 502, S7 ISO-on-TCP 102)
        for _ in range(random.randint(15, 25)):
            sec_offset = random.randint(0, 3599)
            flow_ts = current_hour_time + timedelta(seconds=sec_offset)
            flows.append({
                "timestamp": flow_ts.isoformat(),
                "hour_window": hour_idx,
                "src": "asset_water_hmi",
                "dst": "asset_water_plc_pumps",
                "port": 102,
                "protocol": "ISO-on-TCP",
                "bytes": random.randint(400, 1200),
                "packets": random.randint(4, 10),
                "duration": round(random.uniform(0.05, 0.3), 3),
                "hour_of_day": hour_of_day,
            })
            flows.append({
                "timestamp": (flow_ts + timedelta(seconds=1)).isoformat(),
                "hour_window": hour_idx,
                "src": "asset_water_hmi",
                "dst": "asset_water_plc_chlorine",
                "port": 502,
                "protocol": "Modbus-TCP",
                "bytes": random.randint(250, 600),
                "packets": random.randint(3, 8),
                "duration": round(random.uniform(0.04, 0.25), 3),
                "hour_of_day": hour_of_day,
            })

        # Power Substation SCADA -> HMI -> RTU -> IED (DNP3, IEC-61850)
        for _ in range(random.randint(20, 30)):
            sec_offset = random.randint(0, 3599)
            flow_ts = current_hour_time + timedelta(seconds=sec_offset)
            flows.append({
                "timestamp": flow_ts.isoformat(),
                "hour_window": hour_idx,
                "src": "asset_pwr_scada",
                "dst": "asset_pwr_hmi",
                "port": 5020,
                "protocol": "TCP",
                "bytes": random.randint(800, 2400),
                "packets": random.randint(6, 16),
                "duration": round(random.uniform(0.1, 0.5), 3),
                "hour_of_day": hour_of_day,
            })
            flows.append({
                "timestamp": flow_ts.isoformat(),
                "hour_window": hour_idx,
                "src": "asset_pwr_switch",
                "dst": "asset_pwr_rtu",
                "port": 20000,
                "protocol": "DNP3",
                "bytes": random.randint(300, 900),
                "packets": random.randint(4, 10),
                "duration": round(random.uniform(0.05, 0.2), 3),
                "hour_of_day": hour_of_day,
            })

        # DMZ Historian Replication (every ~10-15 minutes)
        for _ in range(random.randint(4, 8)):
            sec_offset = random.randint(0, 3599)
            flow_ts = current_hour_time + timedelta(seconds=sec_offset)
            flows.append({
                "timestamp": flow_ts.isoformat(),
                "hour_window": hour_idx,
                "src": "asset_water_scada",
                "dst": "asset_dmz_historian",
                "port": 1433,
                "protocol": "MSSQL",
                "bytes": random.randint(5000, 25000),
                "packets": random.randint(20, 60),
                "duration": round(random.uniform(0.8, 3.5), 3),
                "hour_of_day": hour_of_day,
            })

        # ---------------------------------------------------------------------
        # 2. Corporate IT Traffic (heavier on work hours, light off-hours)
        # ---------------------------------------------------------------------
        corp_factor = 1.0 if is_work_hour else 0.05
        corp_flow_count = int(random.randint(30, 60) * corp_factor)

        for _ in range(corp_flow_count):
            sec_offset = random.randint(0, 3599)
            flow_ts = current_hour_time + timedelta(seconds=sec_offset)
            ws = random.choice(["asset_corp_ws1", "asset_corp_ws2"])
            target = random.choice(["asset_corp_dc", "asset_corp_mail"])
            port = random.choice([88, 389, 445]) if target == "asset_corp_dc" else 443

            flows.append({
                "timestamp": flow_ts.isoformat(),
                "hour_window": hour_idx,
                "src": ws,
                "dst": target,
                "port": port,
                "protocol": "TCP",
                "bytes": random.randint(1200, 8000),
                "packets": random.randint(8, 25),
                "duration": round(random.uniform(0.2, 1.5), 3),
                "hour_of_day": hour_of_day,
            })

        # Inbound citizen portal traffic (public internet -> corp_web)
        web_traffic_count = random.randint(20, 80) if is_work_hour else random.randint(5, 15)
        for _ in range(web_traffic_count):
            sec_offset = random.randint(0, 3599)
            flow_ts = current_hour_time + timedelta(seconds=sec_offset)
            flows.append({
                "timestamp": flow_ts.isoformat(),
                "hour_window": hour_idx,
                "src": "asset_internet",
                "dst": "asset_corp_web",
                "port": 443,
                "protocol": "HTTPS",
                "bytes": random.randint(1500, 35000),
                "packets": random.randint(10, 45),
                "duration": round(random.uniform(0.1, 2.0), 3),
                "hour_of_day": hour_of_day,
            })

        # Authorized DMZ Jump Server operator sessions (only a few during workdays)
        if is_work_hour and random.random() < 0.25:
            sec_offset = random.randint(0, 1800)
            flow_ts = current_hour_time + timedelta(seconds=sec_offset)
            flows.append({
                "timestamp": flow_ts.isoformat(),
                "hour_window": hour_idx,
                "src": "asset_corp_ws1",
                "dst": "asset_dmz_jump",
                "port": 3389,
                "protocol": "RDP",
                "bytes": random.randint(45000, 180000),
                "packets": random.randint(120, 400),
                "duration": round(random.uniform(300.0, 1200.0), 1),
                "hour_of_day": hour_of_day,
            })

    # =========================================================================
    # 3. Inject Labelled Attack Scenarios (During Test Period: Days 5 & 6)
    # Days 0 to 4 (Hours 0-119) = Pure Baseline Training Data
    # Days 5 to 6 (Hours 120-167) = Test Data with Injected Attacks
    # =========================================================================

    # ATTACK 1: Vendor-VPN login at 3 a.m. followed by new connection to water SCADA
    # Window: Day 5 (Hour 123, which is 03:00 UTC)
    attack_1_hour = 123
    attack_1_time = start_time + timedelta(hours=attack_1_hour)
    for i in range(12):
        ts = attack_1_time + timedelta(minutes=i * 4, seconds=random.randint(5, 45))
        flows.append({
            "timestamp": ts.isoformat(),
            "hour_window": attack_1_hour,
            "src": "asset_internet",
            "dst": "asset_vendor_vpn",
            "port": 443,
            "protocol": "HTTPS",
            "bytes": random.randint(25000, 60000),
            "packets": random.randint(80, 150),
            "duration": round(random.uniform(60.0, 240.0), 1),
            "hour_of_day": 3,
        })
        flows.append({
            "timestamp": (ts + timedelta(seconds=2)).isoformat(),
            "hour_window": attack_1_hour,
            "src": "asset_vendor_vpn",
            "dst": "asset_water_scada",
            "port": 3389,
            "protocol": "RDP",
            "bytes": random.randint(85000, 320000),
            "packets": random.randint(220, 650),
            "duration": round(random.uniform(180.0, 600.0), 1),
            "hour_of_day": 3,
        })
    labels.append({
        "asset_id": "asset_vendor_vpn",
        "hour_window": attack_1_hour,
        "is_attack": True,
        "attack_type": "Off-Hours Vendor VPN Ingress & Pivot",
        "description": "Vendor-VPN login at 3 a.m. followed by new unsegmented RDP connection to Water Plant SCADA.",
    })
    labels.append({
        "asset_id": "asset_water_scada",
        "hour_window": attack_1_hour,
        "is_attack": True,
        "attack_type": "Direct Inbound Off-Hours Connection",
        "description": "Water SCADA received sudden inbound RDP connection from Vendor VPN at 3 a.m.",
    })

    # ATTACK 2: Port scan from a compromised corporate workstation
    # Window: Day 5 (Hour 136, 16:00 UTC)
    attack_2_hour = 136
    attack_2_time = start_time + timedelta(hours=attack_2_hour)
    scan_ports = [21, 22, 23, 80, 102, 135, 139, 443, 445, 502, 1433, 3389, 4840, 5020, 8080, 20000, 44818, 47808]
    targets = ["asset_corp_dc", "asset_dmz_jump", "asset_dmz_historian", "asset_hosp_bms", "asset_city_traffic_ctrl"]
    for tgt in targets:
        for prt in scan_ports:
            ts = attack_2_time + timedelta(seconds=random.randint(0, 1800))
            flows.append({
                "timestamp": ts.isoformat(),
                "hour_window": attack_2_hour,
                "src": "asset_corp_ws1",
                "dst": tgt,
                "port": prt,
                "protocol": "TCP-SYN",
                "bytes": random.randint(40, 64),
                "packets": 1,
                "duration": round(random.uniform(0.01, 0.05), 3),
                "hour_of_day": 16,
            })
    labels.append({
        "asset_id": "asset_corp_ws1",
        "hour_window": attack_2_hour,
        "is_attack": True,
        "attack_type": "Internal Reconnaissance / Port Scan",
        "description": "High-velocity port scan across internal DMZ, Hospital BMS, and Traffic signal endpoints.",
    })

    # ATTACK 3: Large data exfiltration from the historian
    # Window: Day 6 (Hour 150, 06:00 UTC)
    attack_3_hour = 150
    attack_3_time = start_time + timedelta(hours=attack_3_hour)
    for chunk in range(25):
        ts = attack_3_time + timedelta(minutes=chunk * 2, seconds=random.randint(1, 30))
        flows.append({
            "timestamp": ts.isoformat(),
            "hour_window": attack_3_hour,
            "src": "asset_dmz_historian",
            "dst": "asset_corp_ws1",
            "port": 445,
            "protocol": "SMB",
            "bytes": random.randint(15000000, 45000000),  # 15 - 45 MB per burst (multi-gigabyte exfil)
            "packets": random.randint(12000, 35000),
            "duration": round(random.uniform(45.0, 110.0), 1),
            "hour_of_day": 6,
        })
    labels.append({
        "asset_id": "asset_dmz_historian",
        "hour_window": attack_3_hour,
        "is_attack": True,
        "attack_type": "Mass Data Exfiltration Burst",
        "description": "Unusually large outbound SMB data transfer (gigabytes) from Historian Mirror to workstation.",
    })

    # ATTACK 4: Never-before-seen PLC programming connection from non-engineering host
    # Window: Day 6 (Hour 162, 18:00 UTC)
    attack_4_hour = 162
    attack_4_time = start_time + timedelta(hours=attack_4_hour)
    for p_flow in range(18):
        ts = attack_4_time + timedelta(minutes=p_flow * 3, seconds=random.randint(5, 50))
        flows.append({
            "timestamp": ts.isoformat(),
            "hour_window": attack_4_hour,
            "src": "asset_corp_ws1",
            "dst": "asset_pwr_rtu",
            "port": 44818,  # Rockwell EtherNet/IP CIP programming port
            "protocol": "EtherNet/IP",
            "bytes": random.randint(3500, 18000),
            "packets": random.randint(25, 90),
            "duration": round(random.uniform(1.5, 6.0), 2),
            "hour_of_day": 18,
        })
    labels.append({
        "asset_id": "asset_pwr_rtu",
        "hour_window": attack_4_hour,
        "is_attack": True,
        "attack_type": "Unauthorized PLC Engineering Command",
        "description": "Never-before-seen CIP programming connection on port 44818 initiated from Corporate Workstation.",
    })
    labels.append({
        "asset_id": "asset_corp_ws1",
        "hour_window": attack_4_hour,
        "is_attack": True,
        "attack_type": "Direct OT Control Channel Manipulation",
        "description": "Corporate Workstation directly transmitting EtherNet/IP control packets to Substation RTU.",
    })

    # Save to disk
    if save_to_disk:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        flows_file = CACHE_DIR / "network_flows.json"
        with open(flows_file, "w", encoding="utf-8") as f:
            json.dump({
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "random_seed": RANDOM_SEED,
                "total_days": days,
                "total_hours": total_hours,
                "flow_count": len(flows),
                "flows": flows,
            }, f)

        labels_file = CACHE_DIR / "flow_attack_labels.json"
        with open(labels_file, "w", encoding="utf-8") as f:
            json.dump({
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "attack_count": len(labels),
                "labels": labels,
            }, f, indent=2)

        logger.info("Saved %d flow records to %s and %d attack labels to %s",
                    len(flows), flows_file, len(labels), labels_file)

    return flows, labels


if __name__ == "__main__":
    generate_flows()
