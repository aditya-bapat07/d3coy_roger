/**
 * Display-only helpers: short labels, asset metadata from GET /api/scenario,
 * and plain-language "why" fragments. No risk maths happens here.
 */
import { AssetRiskResponse, RiskDropFactor } from './types/api';

/** Subset of a scenario asset used purely for display (shape from GET /api/scenario). */
export interface ScenarioAssetMeta {
  id: string;
  name: string;
  type: string;
  site: string;
  purdue_level: string;
  end_of_life?: boolean;
}

export interface ScenarioMeta {
  assets: ScenarioAssetMeta[];
}

const SHORT_NAMES: Record<string, string> = {
  asset_internet: 'Internet',
  asset_vendor_vpn: 'Vendor VPN',
  asset_corp_web: 'Web portal',
  asset_corp_mail: 'Mail server',
  asset_corp_dc: 'Domain ctrl',
  asset_corp_ws1: 'IT workstation',
  asset_corp_ws2: 'Analyst WS',
  asset_dmz_jump: 'Jump server',
  asset_dmz_historian: 'Historian',
  asset_dmz_patch: 'Patch server',
  asset_pwr_scada: 'Power SCADA',
  asset_pwr_eng_ws: 'Power eng WS',
  asset_pwr_hmi: 'Power HMI',
  asset_pwr_switch: 'Sub switch',
  asset_pwr_rtu: 'Feeder RTU',
  asset_pwr_ied: 'Prot. relay',
  asset_pwr_breakers: 'Breakers',
  asset_water_scada: 'Water SCADA',
  asset_water_hmi: 'Water HMI',
  asset_water_plc_pumps: 'Pump PLC',
  asset_water_plc_chlorine: 'Chlorine PLC',
  asset_water_pumps: 'Pumps',
  asset_water_dosing_skid: 'Dosing skid',
  asset_water_level_sensors: 'Level sensors',
  asset_hosp_bms: 'Hospital BMS',
  asset_hosp_iot_gw: 'ICU gateway',
  asset_hosp_gen_ctrl: 'Generator ctrl',
  asset_city_traffic_ctrl: 'Traffic ctrl',
  asset_city_camera_gw: 'Camera gateway',
  service_feeder_substation_ss2: 'Substation SS-2',
  service_residential_power_north: 'North power',
  service_water_pumping: 'Water pumping',
  service_chlorine_dosing: 'Chlorine dosing',
  service_reservoir_level: 'Reservoir level',
  service_piped_water: 'Piped water',
  service_district_hospital: 'District hospital',
  service_hospital_bms: 'Hospital BMS svc',
  service_medical_iot: 'Medical IoT',
  service_backup_gen_ctrl: 'Backup gen',
  service_traffic_signals: 'Traffic signals',
  service_camera_gateway: 'CCTV service',
};

export function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

/** Short display label, max 14 chars. */
export function shortName(id: string, fallback?: string): string {
  return truncate(SHORT_NAMES[id] ?? fallback ?? id, 14);
}

/**
 * Crown jewels are derived, not asserted: assets whose worst-case consequence
 * reaches the maximum safety severity (4/4) in the computed cascade.
 */
export function isCrownJewel(a: AssetRiskResponse): boolean {
  return a.max_safety_severity >= 4;
}

/** Short plain-language fragment for the top risk_drop_if_removed factor (≤ 40 chars). */
export function whyFragment(a: AssetRiskResponse): string {
  const factors = (a.risk_drop_if_removed?.factors ?? []).filter((x) => x.risk_drop > 0);
  if (factors.length === 0) return '—';
  // Prefer the most specific high-drop factor over generic internet_exposure when available
  const specific = factors.find((x) => x.factor_type !== 'internet_exposure');
  const f: RiskDropFactor = specific ?? factors[0];
  let s: string;
  switch (f.factor_type) {
    case 'internet_exposure':
      s = 'Internet-reachable attack path';
      break;
    case 'misconfigured_rule':
      s = 'Misconfigured firewall rule on path';
      break;
    case 'kev':
    case 'kev_status':
      s = a.best_cve ? `KEV exploit (${a.best_cve}) on path` : 'KEV-listed exploit on path';
      break;
    case 'cve': {
      const cve = f.factor_id.replace(/^cve_/, '');
      s = a.cisa_kev ? `KEV ${cve} on path` : `Exploitable ${cve}`;
      break;
    }
    case 'anomaly_score':
      s = 'Unusual network activity on path';
      break;
    case 'consequence_component':
      if (f.factor_id.includes('safety')) s = `Severe safety impact (severity ${a.max_safety_severity}/4)`;
      else if (f.factor_id.includes('people')) s = `${Math.round(a.max_people_affected / 1000)}k people downstream`;
      else if (f.factor_id.includes('outage')) s = `Cascading outage (${a.max_outage_hours}h)`;
      else s = 'High physical consequence';
      break;
    default:
      s = f.description;
  }
  return truncate(s, 40);
}

export function factorLabel(f: RiskDropFactor): string {
  return f.description;
}

