/**
 * TypeScript API contracts matching backend/app/schemas.py
 */

export type PersonaType = 'opportunistic' | 'nation_state' | 'insider';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ActionType = 'patch' | 'segment' | 'disable_remote_access' | 'mfa' | 'enhanced_monitoring';

export interface AssetRiskResponse {
  asset_id: string;
  name: string;
  site: string;
  purdue_level: string;
  vendor: string;
  product: string;
  version: string;
  cves: string[];
  best_cve?: string | null;
  cvss?: number | null;
  epss: number;
  cisa_kev: boolean;
  internet_exposed: boolean;
  remote_access: boolean;
  default_credentials: boolean;
  patchable_now: boolean;
  next_maintenance_window_days: number;
  anomaly_score: number;
  likelihood_raw: number;
  likelihood_score: number;
  consequence_score: number;
  risk_score: number;
  risk_level: RiskLevel;
  services_impacted: string[];
  max_people_affected: number;
  max_safety_severity: number;
  max_outage_hours: number;
  path_from_entry: string[];
  path_technique_ids: string[];
  is_choke_point: boolean;
  criticality_note: string;
  scenario_assumption: boolean;
}

export interface RiskOverviewResponse {
  scenario_name: string;
  fictional_population: number;
  persona: string;
  total_assets: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  average_risk: number;
  max_risk: number;
  assets: AssetRiskResponse[];
}

export interface AttackGraphNode {
  id: string;
  label: string;
  site: string;
  purdue_level: string;
  risk_score: number;
  risk_level: RiskLevel;
  anomaly_score: number;
  is_choke_point: boolean;
  cve_count: number;
  cisa_kev: boolean;
  vendor: string;
  product: string;
}

export interface AttackGraphEdge {
  id: string;
  source: string;
  target: string;
  protocol: string;
  port: string;
  exploit_probability: number;
  technique_id?: string | null;
  technique_name?: string | null;
  misconfiguration: boolean;
}

export interface AttackGraphResponse {
  nodes: AttackGraphNode[];
  edges: AttackGraphEdge[];
}

export interface DependencyGraphNode {
  id: string;
  label: string;
  site: string;
  type: 'service' | 'asset';
  people_served: number;
  safety_severity: number;
  baseline_outage_hours: number;
  backup: string;
}

export interface DependencyGraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'powers' | 'controls' | 'supplies_water' | 'monitors';
  failure_delay_hours: number;
  reason: string;
}

export interface DependencyGraphResponse {
  nodes: DependencyGraphNode[];
  edges: DependencyGraphEdge[];
}

export interface ChokePointItem {
  asset_id: string;
  name: string;
  site: string;
  purdue_level: string;
  betweenness_centrality: number;
  paths_intersected: number;
  recommended_action: string;
  action_type: ActionType;
  estimated_risk_reduction: number;
  cost_engineer_hours: number;
  downtime_hours: number;
}

export interface ChokePointResponse {
  choke_points: ChokePointItem[];
  min_cut_edges: Record<string, any>[];
}

export interface RemediationActionItem {
  id: string;
  asset_id: string;
  asset_name: string;
  action_type: ActionType;
  description: string;
  engineer_hours: number;
  downtime_hours: number;
  patchable_now: boolean;
  risk_reduction: number;
  selected: boolean;
  priority: number;
}

export interface RemediationPlanRequest {
  engineer_hours_budget: number;
  max_downtime_hours?: number | null;
  persona?: PersonaType;
  apply_threat_drop?: boolean;
}

export interface RemediationPlanResponse {
  budget_hours: number;
  used_engineer_hours: number;
  total_downtime_hours: number;
  initial_aggregate_risk: number;
  projected_aggregate_risk: number;
  risk_reduction_pct: number;
  actions: RemediationActionItem[];
}

export interface SimulationRequest {
  persona?: PersonaType;
  applied_actions?: string[];
  apply_threat_drop?: boolean;
  injected_anomalies?: string[];
}

export interface AssetDelta {
  asset_id: string;
  name: string;
  baseline_risk: number;
  new_risk: number;
  delta_risk: number;
  baseline_level: RiskLevel;
  new_level: RiskLevel;
}

export interface SimulationResponse {
  persona: string;
  baseline_aggregate_risk: number;
  new_aggregate_risk: number;
  delta_aggregate_risk: number;
  applied_actions_count: number;
  threat_drop_active: boolean;
  asset_deltas: AssetDelta[];
}

export interface ThreatDropResponse {
  cve_id: string;
  vendor: string;
  product: string;
  vulnerability_name: string;
  cisa_kev: boolean;
  cvss: number;
  epss: number;
  technique_name: string;
  narrative: string;
  affected_asset_id: string;
  affected_asset_name: string;
  pre_drop_risk: number;
  post_drop_risk: number;
  delta_risk: number;
  date_added: string;
  required_action: string;
}
