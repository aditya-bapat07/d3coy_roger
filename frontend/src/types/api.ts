/**
 * TypeScript API contracts matching backend/app/schemas.py
 */

export type PersonaType = 'opportunistic' | 'nation_state' | 'insider';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ActionType = 'patch' | 'segment' | 'disable_remote_access' | 'mfa' | 'enhanced_monitoring';

export interface PathDetail {
  path: string[];
  probability: number;
  likelihood_score: number;
  technique_ids: string[];
  hop_count: number;
}

export interface RiskDropFactor {
  factor_id: string;
  factor_type: string;
  description: string;
  risk_drop: number;
  risk_without_factor: number;
}

export interface RiskDropIfRemoved {
  factors: RiskDropFactor[];
  note: string;
}

export interface ConfidenceRating {
  rating: 'High' | 'Medium' | 'Low';
  score: number;
  reasons: string[];
}

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
  top_3_paths?: PathDetail[];
  risk_drop_if_removed?: RiskDropIfRemoved;
  confidence?: ConfidenceRating;
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

export interface InvariantCheckItem {
  id: string;
  name: string;
  passed: boolean;
  details: string;
}

export interface InvariantsSection {
  total_checks: number;
  passed_checks: number;
  all_passed: boolean;
  summary: string;
  checks: InvariantCheckItem[];
}

export interface SensitivityParameterResult {
  parameter: string;
  label: string;
  persona_evaluated: string;
  baseline_value: number;
  minus_50_pct_value: number;
  plus_50_pct_value: number;
  kendall_tau_minus_50: number;
  kendall_tau_plus_50: number;
  min_kendall_tau: number;
  top_10_rank_shifts_minus_50: number;
  top_10_rank_shifts_plus_50: number;
  max_top_10_rank_shifts: number;
  top_3_minus_50: string[];
  top_3_plus_50: string[];
}

export interface SensitivityBaselineItem {
  rank: number;
  asset_id: string;
  name: string;
  risk_score: number;
}

export interface SensitivityAnalysisSection {
  methodology: string;
  baseline_top_10: SensitivityBaselineItem[];
  mean_min_kendall_tau: number;
  most_influential_parameters: string[];
  honest_assessment: string;
  parameters: SensitivityParameterResult[];
}

export interface CvssComparisonItem {
  asset_id: string;
  name: string;
  site: string;
  purdue_level: string;
  cvss: number;
  best_cve: string | null;
  cisa_kev: boolean;
  epss: number;
  vidura_risk_score: number;
  likelihood_score: number;
  consequence_score: number;
  vidura_rank: number;
  cvss_rank: number;
  rank_delta: number;
  abs_rank_delta: number;
  direction: 'elevated_by_vidura' | 'demoted_by_vidura' | 'aligned';
  computed_reason: string;
}

export interface CvssComparisonSection {
  kendall_tau_vs_cvss: number;
  total_assets_compared: number;
  summary: string;
  biggest_disagreements: CvssComparisonItem[];
  full_comparison: CvssComparisonItem[];
}

export interface SyntheticAnomalyEval {
  label: string;
  model: string;
  contamination: number;
  train_windows: number;
  test_windows: number;
  injected_attack_windows: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: Record<string, number>;
  notes: string;
}

export interface HaiTestbedEval {
  label: string;
  dataset: string;
  process_target: string;
  tags: string[];
  rows_train: number;
  protocol: string;
  threshold_from_train_p99_5: number;
  pointwise_precision: number;
  pointwise_recall: number;
  event_recall: number;
  attack_events_total: number;
  attack_events_detected: number;
  false_alarm_episodes: number;
  normal_hours: number;
  false_alarm_episodes_per_24h: number;
  tp: number;
  fp: number;
  fn: number;
  per_file: Record<string, any>[];
  note: string;
}

export interface AnomalyEvaluationsSection {
  separation_note: string;
  synthetic_evaluation: SyntheticAnomalyEval;
  hai_testbed_evaluation: HaiTestbedEval | null;
}

export interface KevEvidenceRow {
  group: string;
  kev_cves: number;
  with_epss: number;
  median_epss: number;
  p25_epss: number;
  p75_epss: number;
  share_below_0_1: number;
  share_below_0_5: number;
  ransomware_known: number;
}

export interface KevFloorEvidenceSection {
  sources: Record<string, string>;
  definition: string;
  small_sample_note: string;
  rows: KevEvidenceRow[];
}

export interface ValidationResponse {
  generated_at: string;
  invariants: InvariantsSection;
  sensitivity_analysis: SensitivityAnalysisSection;
  cvss_comparison: CvssComparisonSection;
  anomaly_evaluations: AnomalyEvaluationsSection;
  kev_floor_evidence: KevFloorEvidenceSection;
  [key: string]: any;
}

export interface FormulaSummary {
  risk_formula: string;
  likelihood_sentence: string;
  consequence_sentence: string;
  attack_graph_role: string;
  dependency_graph_role: string;
}

export interface DataSourceItem {
  key: string;
  file: string;
  description: string;
  source: string;
  record_count: number;
  fetched_at: string;
  file_size_bytes: number;
}

export interface AssumptionTableRow {
  parameter: string;
  value: string;
  justification: string;
  source: string;
  scenario_assumption: boolean;
}

export interface LimitationItem {
  title: string;
  description: string;
}

export interface MetaResponse {
  formula_summary: FormulaSummary;
  data_sources: DataSourceItem[];
  assumptions_table: AssumptionTableRow[];
  limitations: LimitationItem[];
  kev_floor_evidence: KevFloorEvidenceSection;
}

export async function fetchValidationReport(apiBase = '/api'): Promise<ValidationResponse> {
  const res = await fetch(`${apiBase}/validation`);
  if (!res.ok) {
    throw new Error(`Failed to fetch validation report: ${res.status}`);
  }
  return res.json();
}

export async function fetchMetaInfo(apiBase = '/api'): Promise<MetaResponse> {
  const res = await fetch(`${apiBase}/meta`);
  if (!res.ok) {
    throw new Error(`Failed to fetch methodology metadata: ${res.status}`);
  }
  return res.json();
}

