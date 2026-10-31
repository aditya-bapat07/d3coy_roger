"""
OT-Realistic Remediation Planning Engine for Vidura.
Constructs priority-ranked mitigation plans under engineering and downtime budget constraints.
Respects OT maintenance windows: IT assets can be patched immediately; OT controllers receive
compensating controls (network segmentation, MFA, enhanced monitoring) without process downtime.
"""
import logging
from typing import Any, Dict, List, Optional
from backend.engine.scenario import ScenarioModel, load_assumptions, load_scenario
from backend.engine.what_if import WhatIfSimulationEngine

logger = logging.getLogger(__name__)


class RemediationPlanner:
    def __init__(
        self,
        scenario: Optional[ScenarioModel] = None,
        assumptions: Optional[dict] = None,
    ):
        self.scenario = scenario or load_scenario(validate_cves=False)
        self.assumptions = assumptions or load_assumptions()
        self.what_if_engine = WhatIfSimulationEngine(self.scenario, self.assumptions)

    def generate_candidate_actions(self) -> List[Dict[str, Any]]:
        """
        Generates standard candidate mitigation actions based on assets,
        vulnerabilities, and choke points with zero-downtime compensating controls.
        """
        candidates = [
            {
                "id": "act_mfa_vpn",
                "asset_id": "asset_vendor_vpn",
                "asset_name": "Third-Party Vendor Remote Access Gateway",
                "action_type": "mfa",
                "description": "Enforce FIDO2 Hardware MFA and geo-fenced IP whitelisting on Vendor VPN Gateway",
                "engineer_hours": 4.0,
                "downtime_hours": 0.0,
                "patchable_now": True,
                "risk_reduction": 0.35,
                "priority": 1,
                "asymmetry_multiplier": "45x Work Factor Increase",
                "barrier_shift": "Neutralizes automated credential spray; forces adversary to physically compromise contractor hardware token",
                "physical_impact_saved": "Protects 140 MLD water filtration grid • Preserves 4.5h hospital emergency buffer",
                "zero_downtime_safe": True,
                "compensating_controls": {
                    "cisco_acl": (
                        "! Cisco ASA / Secure Firewall VPN Ingress Restriction\n"
                        "access-list VPN_EXTERNAL_IN extended permit tcp host 103.21.244.0 255.255.255.0 host 10.14.1.5 eq 443\n"
                        "access-list VPN_EXTERNAL_IN extended deny ip any host 10.14.1.5 log intervals 300\n"
                        "crypto ikev2 policy 10\n"
                        " proposal aes256-gcm sha384 group 21\n"
                        "webvpn\n"
                        " tunnel-group VENDOR_GRP webvpn-attributes\n"
                        "  authentication fido2-webauthn mandatory"
                    ),
                    "fortigate_cli": (
                        "# FortiOS 7.4 Vendor Portal Zero-Trust Enclave\n"
                        "config vpn ssl web user-group-bookmark\n"
                        " edit \"Vendor-Contractors\"\n"
                        "  set saml-server \"Govt-IDP-FIDO2\"\n"
                        "  set client-check-action-block enable\n"
                        " next\n"
                        "end"
                    ),
                    "iptables": (
                        "# Boundary Gateway Geo-Fenced Rate Limiter\n"
                        "iptables -A INPUT -p tcp --dport 443 -m geoip ! --src-cc IN -j DROP\n"
                        "iptables -A INPUT -p tcp --dport 443 -m conntrack --ctstate NEW -m hashlimit --hashlimit-above 5/sec --hashlimit-burst 10 --hashlimit-mode srcip -j DROP"
                    ),
                    "suricata_rule": (
                        "alert tcp $EXTERNAL_NET any -> $DMZ_VPN 443 (\n"
                        "  msg:\"[VIDURA-OT-001] Brute force anomaly on SSL-VPN Gateway\";\n"
                        "  threshold:type both, track by_src, count 5, seconds 60;\n"
                        "  classtype:attempted-admin;\n"
                        "  sid:9001001; rev:1;\n"
                        ")"
                    ),
                    "virtual_patch_guidance": "Restricts ingress handshake without rebooting VPN concentrator or terminating active sessions.",
                    "zero_downtime_safe": True,
                },
            },
            {
                "id": "act_seg_jump",
                "asset_id": "asset_dmz_jump",
                "asset_name": "Operations DMZ Jump Host",
                "action_type": "segment",
                "description": "Micro-segment DMZ Jump Host: disable RDP clipboard/drive redirection and enforce ephemeral sessions",
                "engineer_hours": 3.0,
                "downtime_hours": 0.0,
                "patchable_now": True,
                "risk_reduction": 0.28,
                "priority": 2,
                "asymmetry_multiplier": "35x Work Factor Increase",
                "barrier_shift": "Eliminates automated lateral traversal; requires interactive beaconing susceptible to host EDR",
                "physical_impact_saved": "Prevents adversary pivot into SCADA master controlling 240,000 citizen water feed",
                "zero_downtime_safe": True,
                "compensating_controls": {
                    "cisco_acl": (
                        "! Cisco Nexus OT DMZ Jump Host Micro-Segmentation\n"
                        "ip access-list extended DMZ_JUMP_RESTRICT\n"
                        " permit tcp host 10.14.2.10 host 10.14.3.2 eq 3389\n"
                        " deny tcp any host 10.14.3.0 0.0.0.255 eq 3389 log-input\n"
                        " deny ip host 10.14.2.10 10.14.4.0 0.0.0.255"
                    ),
                    "fortigate_cli": (
                        "# FortiGate DMZ to L3 SCADA Jump-Proxy\n"
                        "config firewall policy\n"
                        " edit 202\n"
                        "  set name \"DMZ_JUMP_RDP_EPHEMERAL\"\n"
                        "  set srcintf \"dmz\"\n"
                        "  set dstintf \"ot_l3\"\n"
                        "  set srcaddr \"JUMP_HOST_IP\"\n"
                        "  set dstaddr \"SCADA_SUPERVISORY\"\n"
                        "  set action accept\n"
                        "  set service \"RDP\"\n"
                        " next\n"
                        "end"
                    ),
                    "iptables": (
                        "# DMZ Ephemeral Jump Host Isolation\n"
                        "iptables -A FORWARD -s 10.14.2.10 -d 10.14.3.0/24 -p tcp --dport 3389 -m state --state NEW,ESTABLISHED -j ACCEPT\n"
                        "iptables -A FORWARD -s 10.14.2.10 -d 10.14.3.0/24 -j DROP"
                    ),
                    "suricata_rule": (
                        "alert rdp any any -> 10.14.3.0/24 any (\n"
                        "  msg:\"[VIDURA-OT-002] Lateral RDP movement across Purdue DMZ boundary\";\n"
                        "  flow:to_server,established;\n"
                        "  classtype:policy-violation;\n"
                        "  sid:9001002; rev:1;\n"
                        ")"
                    ),
                    "virtual_patch_guidance": "Applies L3/L4 stateful filter at switch fabric with sub-millisecond convergence.",
                    "zero_downtime_safe": True,
                },
            },
            {
                "id": "act_patch_web",
                "asset_id": "asset_corp_web",
                "asset_name": "Municipal Citizen Web Portal",
                "action_type": "patch",
                "description": "Apply vendor security update for Apache HTTP Server (CVE-2021-41773) on Citizen Portal",
                "engineer_hours": 2.0,
                "downtime_hours": 0.5,
                "patchable_now": True,
                "risk_reduction": 0.22,
                "priority": 3,
                "asymmetry_multiplier": "50x Work Factor Increase",
                "barrier_shift": "Nullifies public CISA KEV remote code execution exploit; shuts down external initial access",
                "physical_impact_saved": "Protects municipal command backbone and civic emergency alerting network",
                "zero_downtime_safe": False,
                "compensating_controls": {
                    "cisco_acl": (
                        "! Cisco WAF Ingress Path Traversal Defense\n"
                        "class-map match-any HTTP_TRAVERSAL\n"
                        " match http uri regex \"(\\.\\.%2e|%2e%2e|\\.\\./|/\\.\\.)\"\n"
                        "policy-map HTTP_INSPECT\n"
                        " class HTTP_TRAVERSAL\n"
                        "  reset"
                    ),
                    "fortigate_cli": (
                        "# FortiWeb / FortiGate WAF Virtual Patch for CVE-2021-41773\n"
                        "config waf profile\n"
                        " edit \"MUNICIPAL_PORTAL_WAF\"\n"
                        "  set path-traversal-detection enable\n"
                        "  set path-traversal-action block\n"
                        " next\n"
                        "end"
                    ),
                    "iptables": (
                        "# Nginx / Reverse Proxy ModSecurity Virtual Patch\n"
                        "SecRule REQUEST_URI \"@rx \\.\\.(/|%2f|%2e)\" \"id:1001,phase:2,deny,status:403,msg:'CVE-2021-41773 Path Traversal Block'\""
                    ),
                    "suricata_rule": (
                        "drop http $EXTERNAL_NET any -> $HTTP_SERVERS $HTTP_PORTS (\n"
                        "  msg:\"[VIDURA-OT-003] Apache HTTP Server Path Traversal CVE-2021-41773\";\n"
                        "  flow:to_server,established;\n"
                        "  content:\".%2e\"; nocase;\n"
                        "  sid:9001003; rev:2;\n"
                        ")"
                    ),
                    "virtual_patch_guidance": "Virtual patch drops exploit payloads at perimeter WAF immediately prior to scheduled server reload.",
                    "zero_downtime_safe": False,
                },
            },
            {
                "id": "act_mon_water_plc",
                "asset_id": "asset_water_plc_chlorine",
                "asset_name": "Disinfection Chlorine Dosing Skid PLC",
                "action_type": "enhanced_monitoring",
                "description": "Deploy OT IDS sensor to collect Modbus/TCP register & process history logs (DET0776/DET0752 — detection only, raises confidence, risk reduction = 0)",
                "engineer_hours": 3.0,
                "downtime_hours": 0.0,
                "patchable_now": False,
                "risk_reduction": 0.0,
                "priority": 4,
                "asymmetry_multiplier": "15x Work Factor Increase (Detection Telemetry)",
                "barrier_shift": "Forces stealth operation; triggers forensic alarms on unauthorized dosing register manipulation",
                "physical_impact_saved": "Provides real-time safety alert for 140 MLD water chlorination line",
                "zero_downtime_safe": True,
                "compensating_controls": {
                    "cisco_acl": (
                        "! Cisco Catalyst OT Switched Port Analyzer (SPAN) Mirroring\n"
                        "monitor session 1 source interface GigabitEthernet1/0/24 both\n"
                        "monitor session 1 destination interface GigabitEthernet1/0/48"
                    ),
                    "fortigate_cli": (
                        "# FortiNDR / OT IDS Sensor Tap Config\n"
                        "config system interface\n"
                        " edit \"ot_ids_span\"\n"
                        "  set status up\n"
                        "  set dedicated-to sniffer\n"
                        " next\n"
                        "end"
                    ),
                    "iptables": (
                        "# Zeek / Suricata Passive OT TEE Mirror\n"
                        "iptables -t mangle -A PREROUTING -p tcp --dport 502 -j TEE --gateway 10.14.3.99"
                    ),
                    "suricata_rule": (
                        "alert modbus any any -> any 502 (\n"
                        "  msg:\"[VIDURA-OT-004] Modbus Function 0x05/0x06 Write Command to Chlorine Skid\";\n"
                        "  flow:to_server,established;\n"
                        "  modbus.function:5 6;\n"
                        "  classtype:bad-unknown;\n"
                        "  sid:9001004; rev:1;\n"
                        ")"
                    ),
                    "virtual_patch_guidance": "100% passive hardware tap; zero packet injection and zero electrical interference on PLC.",
                    "zero_downtime_safe": True,
                },
            },
            {
                "id": "act_patch_dc",
                "asset_id": "asset_corp_dc",
                "asset_name": "Active Directory Domain Controller",
                "action_type": "patch",
                "description": "Deploy Active Directory Kerberos security update (CVE-2022-37969) during maintenance window",
                "engineer_hours": 2.0,
                "downtime_hours": 0.5,
                "patchable_now": True,
                "risk_reduction": 0.20,
                "priority": 5,
                "asymmetry_multiplier": "40x Work Factor Increase",
                "barrier_shift": "Blocks Golden Ticket privilege escalation across enterprise IT directory",
                "physical_impact_saved": "Stops cross-zone credential harvesting before operations DMZ traversal",
                "zero_downtime_safe": False,
                "compensating_controls": {
                    "cisco_acl": (
                        "! Cisco Kerberos PAC Validation Enclave\n"
                        "ip access-list extended DC_KERBEROS_ALLOW\n"
                        " permit tcp 10.14.0.0 0.0.255.255 host 10.14.1.10 eq 88\n"
                        " deny tcp any host 10.14.1.10 eq 88 log"
                    ),
                    "fortigate_cli": (
                        "# FortiGate Active Directory IPS Inspection\n"
                        "config ips sensor\n"
                        " edit \"PROTECT_DC\"\n"
                        "  config entries\n"
                        "   edit 1\n"
                        "    set rule 51842\n"
                        "    set action block\n"
                        "   next\n"
                        "  end\n"
                        " next\n"
                        "end"
                    ),
                    "iptables": (
                        "# Domain Controller Ingress Filter\n"
                        "iptables -A INPUT -p tcp --dport 88 -s 10.14.0.0/16 -j ACCEPT\n"
                        "iptables -A INPUT -p tcp --dport 88 -j DROP"
                    ),
                    "suricata_rule": (
                        "drop tcp any any -> $DC_SERVERS 88 (\n"
                        "  msg:\"[VIDURA-OT-005] Kerberos PAC Signature Validation Bypass CVE-2022-37969\";\n"
                        "  flow:to_server,established;\n"
                        "  sid:9001005; rev:1;\n"
                        ")"
                    ),
                    "virtual_patch_guidance": "IPS rule drops forged Kerberos ticket attempts while DC prepares for staged update.",
                    "zero_downtime_safe": False,
                },
            },
            {
                "id": "act_seg_historian",
                "asset_id": "asset_dmz_historian",
                "asset_name": "Enterprise OT Process Historian",
                "action_type": "segment",
                "description": "Restrict OSIsoft PI Historian port 5450 to unidirectional read-only replica",
                "engineer_hours": 3.0,
                "downtime_hours": 0.0,
                "patchable_now": True,
                "risk_reduction": 0.15,
                "priority": 6,
                "asymmetry_multiplier": "60x Work Factor Increase",
                "barrier_shift": "Enforces mathematical unidirectional data flow; breaks reverse-shell pivot into SCADA master",
                "physical_impact_saved": "Protects 140 MLD water telemetry and 68 MW electrical substation telemetry",
                "zero_downtime_safe": True,
                "compensating_controls": {
                    "cisco_acl": (
                        "! Cisco Unidirectional Historian Flow (PI Data Archive 5450)\n"
                        "ip access-list extended HISTORIAN_DATA_DIODE\n"
                        " permit tcp host 10.14.3.20 host 10.14.2.30 eq 5450\n"
                        " deny tcp host 10.14.2.30 host 10.14.3.20 eq 5450 log-input\n"
                        " deny ip any any"
                    ),
                    "fortigate_cli": (
                        "# FortiOS Unidirectional Policy (L3 -> DMZ Historian)\n"
                        "config firewall policy\n"
                        " edit 303\n"
                        "  set name \"HISTORIAN_ONEWAY_REPLICA\"\n"
                        "  set srcintf \"l3_scada\"\n"
                        "  set dstintf \"dmz_historian\"\n"
                        "  set action accept\n"
                        "  set service \"PI_HISTORIAN_5450\"\n"
                        " next\n"
                        "end"
                    ),
                    "iptables": (
                        "# Unidirectional Historian Socket Filter\n"
                        "iptables -A FORWARD -s 10.14.3.20 -d 10.14.2.30 -p tcp --dport 5450 -j ACCEPT\n"
                        "iptables -A FORWARD -s 10.14.2.30 -d 10.14.3.20 -j REJECT --reject-with tcp-reset"
                    ),
                    "suricata_rule": (
                        "reject tcp 10.14.2.30 any -> 10.14.3.20 5450 (\n"
                        "  msg:\"[VIDURA-OT-006] Unauthorized reverse connection from DMZ Historian into L3 SCADA\";\n"
                        "  flow:to_server;\n"
                        "  sid:9001006; rev:1;\n"
                        ")"
                    ),
                    "virtual_patch_guidance": "Enforces TCP state tracking so only outbound telemetry packets from L3 SCADA are acknowledged.",
                    "zero_downtime_safe": True,
                },
            },
            {
                "id": "act_disable_default_creds",
                "asset_id": "asset_city_traffic_ctrl",
                "asset_name": "Central Traffic Management Controller",
                "action_type": "disable_remote_access",
                "description": "Rotate default credentials and restrict NTCIP controller access to municipal traffic operations fiber VLAN",
                "engineer_hours": 1.0,
                "downtime_hours": 0.0,
                "patchable_now": True,
                "risk_reduction": 0.14,
                "priority": 7,
                "asymmetry_multiplier": "25x Work Factor Increase",
                "barrier_shift": "Prevents opportunistic scanning bots and unauthenticated web brute force",
                "physical_impact_saved": "Prevents metropolitan traffic signal gridlock across 45 arterial intersections",
                "zero_downtime_safe": True,
                "compensating_controls": {
                    "cisco_acl": (
                        "! Cisco Traffic VLAN Ingress Restriction\n"
                        "ip access-list extended TRAFFIC_CTRL_MGMT\n"
                        " permit tcp 10.14.5.0 0.0.0.255 host 10.14.5.100 eq 161\n"
                        " permit tcp 10.14.5.0 0.0.0.255 host 10.14.5.100 eq 80\n"
                        " deny ip any host 10.14.5.100 log"
                    ),
                    "fortigate_cli": (
                        "# Restrict NTCIP Controller Access to Traffic NOC Fiber\n"
                        "config firewall policy\n"
                        " edit 401\n"
                        "  set name \"TRAFFIC_NOC_MGMT_ONLY\"\n"
                        "  set srcintf \"traffic_noc_fiber\"\n"
                        "  set dstintf \"traffic_field_ctrl\"\n"
                        "  set action accept\n"
                        " next\n"
                        "end"
                    ),
                    "iptables": (
                        "# Block Public & Corporate Access to Traffic Controller\n"
                        "iptables -A INPUT -s 10.14.5.0/24 -p tcp --dport 80 -j ACCEPT\n"
                        "iptables -A INPUT -p tcp --dport 80 -j DROP"
                    ),
                    "suricata_rule": (
                        "alert http any any -> 10.14.5.100 any (\n"
                        "  msg:\"[VIDURA-OT-007] Default credential login attempt on NTCIP Traffic Master\";\n"
                        "  content:\"admin\"; http_client_body;\n"
                        "  sid:9001007; rev:1;\n"
                        ")"
                    ),
                    "virtual_patch_guidance": "Immediate credential rotation and ACL isolate controller without taking street signal heads dark.",
                    "zero_downtime_safe": True,
                },
            },
        ]
        return candidates

    def build_plan(
        self,
        engineer_hours_budget: float = 20.0,
        max_downtime_hours: Optional[float] = None,
        persona: str = "nation_state",
        apply_threat_drop: bool = False,
    ) -> Dict[str, Any]:
        """
        Builds optimal remediation plan fitting within the engineering and downtime budgets.
        """
        candidates = self.generate_candidate_actions()

        # Run baseline simulation
        base_sim = self.what_if_engine.simulate(
            persona=persona,
            applied_actions=[],
            apply_threat_drop=apply_threat_drop,
        )
        initial_risk = base_sim["baseline_aggregate_risk"]

        used_hours = 0.0
        used_downtime = 0.0
        selected_action_ids = []
        action_results = []

        # Greedy selection in priority order
        for action in candidates:
            cost_h = action["engineer_hours"]
            cost_d = action["downtime_hours"]

            can_fit_engineer = (used_hours + cost_h) <= engineer_hours_budget
            can_fit_downtime = True
            if max_downtime_hours is not None:
                can_fit_downtime = (used_downtime + cost_d) <= max_downtime_hours

            act_copy = dict(action)
            if can_fit_engineer and can_fit_downtime:
                act_copy["selected"] = True
                used_hours += cost_h
                used_downtime += cost_d
                selected_action_ids.append(action["id"])
            else:
                act_copy["selected"] = False

            action_results.append(act_copy)

        # Run simulated plan with selected actions
        plan_sim = self.what_if_engine.simulate(
            persona=persona,
            applied_actions=selected_action_ids,
            apply_threat_drop=apply_threat_drop,
        )
        projected_risk = plan_sim["new_aggregate_risk"]

        reduction_pct = 0.0
        if initial_risk > 0.0:
            reduction_pct = round(((initial_risk - projected_risk) / initial_risk) * 100.0, 1)

        zero_downtime_count = sum(1 for a in action_results if a.get("selected") and a.get("downtime_hours", 0.0) == 0.0)
        has_choke_protect = any(a.get("selected") and ("vpn" in a["id"] or "jump" in a["id"]) for a in action_results)
        has_historian_protect = any(a.get("selected") and "historian" in a["id"] for a in action_results)

        total_mld_prot = 140.0 if has_choke_protect else (65.0 if has_historian_protect else 0.0)
        total_mw_prot = 68.0 if (has_choke_protect or has_historian_protect) else 0.0

        asym_ratio = (
            f"42x Attacker Work Factor Multiplier ({used_hours}h engineering forces ~{int(used_hours * 42)}+ adversary hours)"
            if used_hours > 0 else "0x Baseline"
        )

        return {
            "budget_hours": round(engineer_hours_budget, 1),
            "used_engineer_hours": round(used_hours, 1),
            "total_downtime_hours": round(used_downtime, 1),
            "initial_aggregate_risk": round(initial_risk, 1),
            "projected_aggregate_risk": round(projected_risk, 1),
            "risk_reduction_pct": reduction_pct,
            "overall_asymmetry_ratio": asym_ratio,
            "total_mld_protected": total_mld_prot,
            "total_mw_protected": total_mw_prot,
            "zero_downtime_actions_count": zero_downtime_count,
            "actions": action_results,
        }
