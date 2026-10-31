import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { RiskTableView } from './components/RiskTableView';
import { GraphView } from './components/GraphView';
import { RemediationView } from './components/RemediationView';
import { AssetDetailModal } from './components/AssetDetailModal';
import {
  AssetRiskResponse,
  RiskOverviewResponse,
  AttackGraphResponse,
  DependencyGraphResponse,
  ChokePointResponse,
  RemediationPlanResponse,
  SimulationResponse,
  ThreatDropResponse,
  PersonaType,
} from './types/api';

const API_BASE = 'http://127.0.0.1:8000/api';

export default function App() {
  const initialTab = (new URLSearchParams(window.location.search).get('tab') as 'risk' | 'graph' | 'remediation') || 'risk';
  const [currentTab, setCurrentTab] = useState<'risk' | 'graph' | 'remediation'>(initialTab);
  const [persona, setPersona] = useState<PersonaType>('nation_state');
  const [threatDropActive, setThreatDropActive] = useState<boolean>(false);
  const [engineerBudget, setEngineerBudget] = useState<number>(20);
  const [selectedAsset, setSelectedAsset] = useState<AssetRiskResponse | null>(null);

  const [overview, setOverview] = useState<RiskOverviewResponse | null>(null);
  const [attackGraph, setAttackGraph] = useState<AttackGraphResponse | null>(null);
  const [dependencyGraph, setDependencyGraph] = useState<DependencyGraphResponse | null>(null);
  const [chokePoints, setChokePoints] = useState<ChokePointResponse | null>(null);
  const [plan, setPlan] = useState<RemediationPlanResponse | null>(null);
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null);
  const [threatDropInfo, setThreatDropInfo] = useState<ThreatDropResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const planData = await fetch(`${API_BASE}/remediation/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engineer_hours_budget: engineerBudget,
          persona,
          apply_threat_drop: threatDropActive,
        }),
      }).then((r) => r.json());

      const selectedActionIds = (planData?.actions || [])
        .filter((a: any) => a.selected)
        .map((a: any) => a.id);

      const simRes = await fetch(`${API_BASE}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona,
          applied_actions: selectedActionIds,
          apply_threat_drop: threatDropActive,
        }),
      }).then((r) => r.json());

      const [riskRes, attackRes, depRes, chokeRes, tdRes] = await Promise.all([
        fetch(`${API_BASE}/risk/assets?persona=${persona}`).then((r) => r.json()),
        fetch(`${API_BASE}/graph/attack?persona=${persona}`).then((r) => r.json()),
        fetch(`${API_BASE}/graph/dependency`).then((r) => r.json()),
        fetch(`${API_BASE}/choke-points`).then((r) => r.json()),
        fetch(`${API_BASE}/threat-drop`).then((r) => r.json()),
      ]);

      setOverview(riskRes);
      setAttackGraph(attackRes);
      setDependencyGraph(depRes);
      setChokePoints(chokeRes);
      setPlan(planData);
      setSimulation(simRes);
      setThreatDropInfo(tdRes);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to Vidura API';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [persona, threatDropActive, engineerBudget]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleThreatDrop = async () => {
    const nextState = !threatDropActive;
    setThreatDropActive(nextState);
    await fetch(`${API_BASE}/threat-drop/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: nextState }),
    });
    await loadData();
  };

  const handleInjectAnomaly = async (assetId: string) => {
    await fetch(`${API_BASE}/anomaly/inject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_id: assetId }),
    });
    await loadData();
    // Update selected asset if currently opened in modal
    if (selectedAsset && selectedAsset.asset_id === assetId) {
      const updated = overview?.assets.find((a) => a.asset_id === assetId);
      if (updated) setSelectedAsset(updated);
    }
  };

  const handleResetSession = async () => {
    await fetch(`${API_BASE}/session/reset`, { method: 'POST' });
    setThreatDropActive(false);
    await loadData();
  };

  const handleExportPdf = () => {
    window.open(`${API_BASE}/report/pdf?persona=${persona}`, '_blank');
  };

  const handleSelectAssetId = (assetId: string) => {
    const match = overview?.assets.find((a) => a.asset_id === assetId);
    if (match) setSelectedAsset(match);
  };

  const handleTogglePlanAction = async (actionId: string) => {
    if (!plan) return;
    const updatedActions = plan.actions.map((a) =>
      a.id === actionId ? { ...a, selected: !a.selected } : a
    );
    const selectedIds = updatedActions.filter((a) => a.selected).map((a) => a.id);

    // Re-simulate
    const simRes = await fetch(`${API_BASE}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        persona,
        applied_actions: selectedIds,
        apply_threat_drop: threatDropActive,
      }),
    }).then((r) => r.json());

    setPlan({
      ...plan,
      actions: updatedActions,
      projected_aggregate_risk: simRes.new_aggregate_risk,
      risk_reduction_pct:
        plan.initial_aggregate_risk > 0
          ? Number(
              (
                ((plan.initial_aggregate_risk - simRes.new_aggregate_risk) /
                  plan.initial_aggregate_risk) *
                100
              ).toFixed(1)
            )
          : 0,
    });
    setSimulation(simRes);
  };

  return (
    <div className="min-h-screen bg-[#0A0E17] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Application Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        persona={persona}
        onPersonaChange={setPersona}
        threatDropActive={threatDropActive}
        onToggleThreatDrop={handleToggleThreatDrop}
        onExportPdf={handleExportPdf}
        onResetSession={handleResetSession}
        loading={loading}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500 text-red-200 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={loadData} className="underline hover:text-white">
              Retry
            </button>
          </div>
        )}

        {/* Tab 1: What is most at risk? */}
        {currentTab === 'risk' && (
          <RiskTableView
            overview={overview}
            loading={loading}
            onSelectAsset={setSelectedAsset}
            onInjectAnomaly={handleInjectAnomaly}
          />
        )}

        {/* Tab 2: Why? (Attack & Dependency Graphs) */}
        {currentTab === 'graph' && (
          <GraphView
            attackGraph={attackGraph}
            dependencyGraph={dependencyGraph}
            chokePoints={chokePoints}
            loading={loading}
            onSelectAssetId={handleSelectAssetId}
          />
        )}

        {/* Tab 3: What do I do first? (Remediation & What-If) */}
        {currentTab === 'remediation' && (
          <RemediationView
            plan={plan}
            simulation={simulation}
            threatDropInfo={threatDropInfo}
            threatDropActive={threatDropActive}
            engineerBudget={engineerBudget}
            onBudgetChange={setEngineerBudget}
            onToggleAction={handleTogglePlanAction}
            onToggleThreatDrop={handleToggleThreatDrop}
            onExportPdf={handleExportPdf}
            loading={loading}
          />
        )}
      </main>

      {/* Deep-Dive Inspection Modal */}
      <AssetDetailModal
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onInjectAnomaly={handleInjectAnomaly}
      />
    </div>
  );
}
