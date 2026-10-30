# CASCADE model assumptions

Every value below is a tunable assumption, shown in the app as "Scenario assumption". Sources are cited only for what they actually support; the numbers themselves are design choices unless stated otherwise.

| Parameter | Value | Justification | Source or "design choice" |
|---|---|---|---|
| KEV_FLOOR | 0.5 | KEV listing means exploitation has been confirmed in the wild, so a reachable KEV CVE should never rank as unlikely, even when its EPSS is low (common for ICS CVEs). 0.5 treats it as at least a coin flip once the attacker can reach it. | CISA KEV catalog (BOD 22-01): a CVE is only added with evidence of active exploitation. The 0.5 value itself is a design choice. |
| P(success) vs default credentials | 0.9 | Default passwords are public and tried automatically by scanners and botnets; failure mostly comes from the device being changed or unreachable, not from difficulty. | Joint advisory AA23-335A (Dec 2023): IRGC-affiliated actors compromised internet-exposed Unitronics PLCs, including at US water facilities, likely by exploiting poor password security such as default passwords. Supports "this happens in practice", not the 0.9 number. |
| P(success) vs exposed remote access without MFA (RDP/VPN) | 0.3 | Needs a working credential (guessing, stuffing or a leaked password), so harder than defaults but realistic over time for an internet-facing service. | Design choice |
| Anomaly boost ALPHA | 0.3 | An anomaly is a signal, not proof of compromise. A score of 1.0 closes 30% of the remaining gap to certainty (p' = p + (1 - p) × 0.3 × score), so the ML raises priority without overriding the vulnerability evidence. | Design choice |
| Persona: opportunistic | Entry: Internet only. Max 3 hops. Only uses edges whose best CVE is KEV-listed or has EPSS ≥ 0.1 | Mass-scanning attackers go for exposed, known-exploited weaknesses and do not chain long paths into OT. | Design choice |
| Persona: nation-state | Entry: Internet + vendor VPN. Max 8 hops. All edges | Patient, well-resourced actors chain through IT and DMZ into control layers and use third-party access. | Design choice |
| Persona: insider | Entry: one corporate workstation. Holds valid domain credentials (credential edges inside IT = 1.0). Max 6 hops | Models an employee or a stolen employee account: no need to break in, only to move laterally. | Design choice |
| Consequence weights | Safety severity 0.5, people affected 0.3, outage hours 0.2 (sum = 1) | Physical safety dominates in critical infrastructure; people affected comes next; duration matters but is partly captured by the other two. | Consequence-first framing follows INL's Consequence-driven Cyber-informed Engineering (CCE). The weights themselves are a design choice. |
| Consequence normalisation | Severity ÷ 4; people affected ÷ 500,000 (city population); outage hours ÷ 72 (longest outage in the scenario) | Puts each component on 0–1 before weighting. People affected is the largest people_served among services lost, not the sum (see consequence_numbers.md, rule 4), so overlapping populations are not double-counted. | Design choice |
| Fix: patch (IT asset) | 2 engineer-hours, 0.5 h downtime | Standard OS/app patch plus a reboot, usually possible within the month. | Design choice |
| Fix: patch (PLC/RTU) | 8 engineer-hours, 4 h downtime; only in a maintenance window | Firmware updates on controllers need vendor validation, testing and a process shutdown, so they are deferred (patchable_now = false). | Design choice |
| Fix: segment a firewall rule | 3 engineer-hours, 0 h downtime | Rule change plus testing that operations traffic still flows; no process stop needed. | Design choice |
| Fix: disable remote access | 1 engineer-hour, 0 h downtime | Quick to switch off; the cost is operational (vendor support must be re-arranged), noted in the UI rather than counted as downtime. | Design choice |
| Fix: add MFA | 4 engineer-hours, 0 h downtime | Enrolment and testing for the remote-access gateway users. | Design choice |
| Fix: enhanced monitoring | 3 engineer-hours, 0 h downtime; risk reduction = 0 | Detection, not prevention: raises confidence, does not lower likelihood. | Design choice |
| MFA reduction factor | × 0.1 on credential-attack probability | Deliberately more conservative than vendor headline figures, because targeted attackers bypass MFA (push fatigue, session/token theft). | Microsoft Security blog (Aug 2019) reported that accounts using MFA are over 99.9% less likely to be compromised; we use 90% to allow for targeted bypass. The 0.1 value is a design choice. |

**What a judge will most likely question:** KEV_FLOOR, because it drives many ICS rankings and EPSS is not a per-asset probability.
**How to answer:** "EPSS estimates the chance a CVE sees exploitation activity anywhere in the next 30 days; KEV confirms it already has. We use both as relative weights gated by reachability, not as breach probabilities."
**Then show:** the sensitivity analysis, where varying KEV_FLOOR from 0.25 to 0.75 shows how much the top-10 ranking actually moves.
