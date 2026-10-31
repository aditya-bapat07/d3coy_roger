"""
Pydantic v2 API Schemas and Contracts for Vidura.
All models are strictly typed and serve as the single source of truth for API serialization.
"""
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field

PersonaType = Literal["opportunistic", "nation_state", "insider"]
RiskLevel = Literal["low", "medium", "high", "critical"]
ActionType = Literal["patch", "segment", "disable_remote_access", "mfa", "enhanced_monitoring"]


class PathDetail(BaseModel):
    path: List[str]
    probability: float
    likelihood_score: float
    technique_ids: List[str] = Field(default_factory=list)
    hop_count: int = 0


class RiskDropFactor(BaseModel):
    factor_id: str
    factor_type: str
    description: str
    risk_drop: float
    risk_without_factor: float


class RiskDropIfRemoved(BaseModel):
    factors: List[RiskDropFactor] = Field(default_factory=list)
    note: str = (
        "Single-factor risk drops isolate each element's contribution and do not sum to "
        "total risk due to non-linear and overlapping path dependencies."
    )


class ConfidenceRating(BaseModel):
    rating: Literal["High", "Medium", "Low"] = "High"
    score: float = 1.0
    reasons: List[str] = Field(default_factory=list)


class AssetRiskResponse(BaseModel):
    asset_id: str
    name: str
    site: str
    purdue_level: str
    vendor: str
    product: str
    version: str
    cves: List[str] = Field(default_factory=list)
    best_cve: Optional[str] = None
    cvss: Optional[float] = None
    epss: float = 0.0
    cisa_kev: bool = False
    internet_exposed: bool = False
    remote_access: bool = False
    default_credentials: bool = False
    patchable_now: bool = True
    next_maintenance_window_days: int = 0
    anomaly_score: float = 0.0
    likelihood_raw: float = 0.0
    likelihood_score: float = 0.0
    consequence_score: float = 0.0
    risk_score: float = 0.0
    risk_level: RiskLevel = "low"
    services_impacted: List[str] = Field(default_factory=list)
    max_people_affected: int = 0
    max_safety_severity: int = 0
    max_outage_hours: float = 0.0
    path_from_entry: List[str] = Field(default_factory=list)
    path_technique_ids: List[str] = Field(default_factory=list)
    top_3_paths: List[PathDetail] = Field(default_factory=list)
    risk_drop_if_removed: Optional[RiskDropIfRemoved] = None
    confidence: Optional[ConfidenceRating] = None
    is_choke_point: bool = False
    criticality_note: str = ""
    scenario_assumption: bool = True


class RiskOverviewResponse(BaseModel):
    scenario_name: str
    fictional_population: int
    persona: str
    total_assets: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    average_risk: float
    max_risk: float
    assets: List[AssetRiskResponse]


class AttackGraphNode(BaseModel):
    id: str
    label: str
    site: str
    purdue_level: str
    risk_score: float
    risk_level: RiskLevel
    anomaly_score: float
    is_choke_point: bool
    cve_count: int
    cisa_kev: bool
    vendor: str
    product: str


class AttackGraphEdge(BaseModel):
    id: str
    source: str
    target: str
    protocol: str
    port: str
    exploit_probability: float
    technique_id: Optional[str] = None
    technique_name: Optional[str] = None
    misconfiguration: bool = False


class AttackGraphResponse(BaseModel):
    nodes: List[AttackGraphNode]
    edges: List[AttackGraphEdge]


class DependencyGraphNode(BaseModel):
    id: str
    label: str
    site: str
    type: Literal["service", "asset"]
    people_served: int
    safety_severity: int
    baseline_outage_hours: float
    backup: str = ""


class DependencyGraphEdge(BaseModel):
    id: str
    source: str
    target: str
    type: Literal["powers", "controls", "supplies_water", "monitors"]
    failure_delay_hours: float
    reason: str


class DependencyGraphResponse(BaseModel):
    nodes: List[DependencyGraphNode]
    edges: List[DependencyGraphEdge]


class ChokePointItem(BaseModel):
    asset_id: str
    name: str
    site: str
    purdue_level: str
    betweenness_centrality: float
    paths_intersected: int
    recommended_action: str
    action_type: ActionType
    estimated_risk_reduction: float
    cost_engineer_hours: float
    downtime_hours: float


class ChokePointResponse(BaseModel):
    choke_points: List[ChokePointItem]
    min_cut_edges: List[Dict[str, Any]] = Field(default_factory=list)


class RemediationActionItem(BaseModel):
    id: str
    asset_id: str
    asset_name: str
    action_type: ActionType
    description: str
    engineer_hours: float
    downtime_hours: float
    patchable_now: bool
    risk_reduction: float
    selected: bool = False
    priority: int = 1


class RemediationPlanRequest(BaseModel):
    engineer_hours_budget: float = 20.0
    max_downtime_hours: Optional[float] = None
    persona: PersonaType = "nation_state"
    apply_threat_drop: bool = False


class RemediationPlanResponse(BaseModel):
    budget_hours: float
    used_engineer_hours: float
    total_downtime_hours: float
    initial_aggregate_risk: float
    projected_aggregate_risk: float
    risk_reduction_pct: float
    actions: List[RemediationActionItem]


class SimulationRequest(BaseModel):
    persona: PersonaType = "nation_state"
    applied_actions: List[str] = Field(default_factory=list)
    apply_threat_drop: bool = False
    injected_anomalies: List[str] = Field(default_factory=list)


class AssetDelta(BaseModel):
    asset_id: str
    name: str
    baseline_risk: float
    new_risk: float
    delta_risk: float
    baseline_level: RiskLevel
    new_level: RiskLevel


class SimulationResponse(BaseModel):
    persona: str
    baseline_aggregate_risk: float
    new_aggregate_risk: float
    delta_aggregate_risk: float
    applied_actions_count: int
    threat_drop_active: bool
    asset_deltas: List[AssetDelta]


class ThreatDropResponse(BaseModel):
    cve_id: str
    vendor: str
    product: str
    vulnerability_name: str
    cisa_kev: bool
    cvss: float
    epss: float
    technique_name: str
    narrative: str
    affected_asset_id: str
    affected_asset_name: str
    pre_drop_risk: float
    post_drop_risk: float
    delta_risk: float
    date_added: str
    required_action: str

