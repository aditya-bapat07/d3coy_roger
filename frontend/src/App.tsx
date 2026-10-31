import { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { RiskTableView } from './components/RiskTableView';
import { GraphView } from './components/GraphView';
import { RemediationView } from './components/RemediationView';
import { HowItWorksView } from './components/HowItWorksView';
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
  MetaResponse,
  ValidationResponse,
  PersonaType,
  fetchMetaInfo,
  fetchValidationReport,
} from './types/api';
import { apiFetchJson, isFallbackMode, API_BASE } from './apiClient';
import { ScenarioMeta } from './display';

export default function App() {
  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const isDemoMode = queryParams.get('demo') === '1';

  const initialTab =
    (queryParams.get('tab') as 'risk' | 'graph' | 'remediation' | 'how') ||
    (isDemoMode ? 'graph' : 'risk');

  const [currentTab, setCurrentTab] = useState<'risk' | 'graph' | 'remediation' | 'how'>(initialTab);
  const [persona, setPersona] = useState<PersonaType>('nation_state');
  const [threatDropActive, setThreatDropActive] = useState<boolean>(false);
  const [engineerBudget, setEngineerBudget] = useState<number>(20);
  const [selectedAsset, setSelectedAsset] = useState<AssetRiskResponse | null>(null);
  const [showShortcutLegend, setShowShortcutLegend] = useState<boolean>(isDemoMode);

  const [overview, setOverview] = useState<RiskOverviewResponse | null>(null);
  const [attackGraph, setAttackGraph] = useState<AttackGraphResponse | null>(null);
  const [dependencyGraph, setDependencyGraph] = useState<DependencyGraphResponse | null>(null);
  const [chokePoints, setChokePoints] = useState<ChokePointResponse | null>(null);
  const [plan, setPlan] = useState<RemediationPlanResponse | null>(null);
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null);
  const [threatDropInfo, setThreatDropInfo] = useState<ThreatDropResponse | null>(null);
  const [metaInfo, setMetaInfo] = useState<MetaResponse | null>(null);
  const [validationReport, setValidationReport] = useState<ValidationResponse | null>(null);
  const [scenarioMeta, setScenarioMeta] = useState<ScenarioMeta | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isInitialDemoReset = false) => {
    setLoading(true);
    setError(null);
    try {
      if (isInitialDemoReset) {
        await apiFetchJson('/reset', { method: 'POST' }).catch(() => {});
      }

      const planData = await apiFetchJson<RemediationPlanResponse>('/remediation/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engineer_hours_budget: engineerBudget,
          persona,
          apply_threat_drop: threatDropActive,
        }),
      });

      const selectedActionIds = (planData?.actions || [])
        .filter((a) => a.selected)
        .map((a) => a.id);

      const simRes = await apiFetchJson<SimulationResponse>('/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona,
          applied_actions: selectedActionIds,
          apply_threat_drop: threatDropActive,
        }),
      });

      const [riskRes, attackRes, depRes, chokeRes, tdRes, metaRes, valRes, scenRes] = await Promise.all([
        apiFetchJson<RiskOverviewResponse>(`/risk/assets?persona=${persona}`),
        apiFetchJson<AttackGraphResponse>(`/graph/attack?persona=${persona}`),
        apiFetchJson<DependencyGraphResponse>('/graph/dependency'),
        apiFetchJson<ChokePointResponse>('/choke-points'),
        apiFetchJson<ThreatDropResponse>('/threat-drop'),
        fetchMetaInfo('/api'),
        fetchValidationReport('/api'),
        apiFetchJson<ScenarioMeta>('/scenario'),
      ]);

      setOverview(riskRes);
      setScenarioMeta(scenRes);

      const urlParams = new URLSearchParams(window.location.search);
      const targetAssetId = urlParams.get('asset') || (isDemoMode && isInitialDemoReset ? 'asset_water_plc_chlorine' : null);
      if (targetAssetId && riskRes?.assets) {
        const matched = riskRes.assets.find((a) => a.asset_id === targetAssetId);
        if (matched) setSelectedAsset(matched);
      } else if (selectedAsset && riskRes?.assets) {
        const refreshed = riskRes.assets.find((a) => a.asset_id === selectedAsset.asset_id);
        if (refreshed) setSelectedAsset(refreshed);
      }

      setAttackGraph(attackRes);
      setDependencyGraph(depRes);
      setChokePoints(chokeRes);
      setPlan(planData);
      setSimulation(simRes);
      setThreatDropInfo(tdRes);
      setMetaInfo(metaRes);
      setValidationReport(valRes);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to Vidura API';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [persona, threatDropActive, engineerBudget, isDemoMode, selectedAsset]);

  useEffect(() => {
    loadData(isDemoMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona, threatDropActive, engineerBudget]);

  const handleToggleThreatDrop = useCallback(async () => {
    const nextState = !threatDropActive;
    setThreatDropActive(nextState);
    await apiFetchJson('/threat-drop/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: nextState }),
    }).catch(() => {});
    await loadData(false);
  }, [threatDropActive, loadData]);

  const handleInjectAnomaly = useCallback(async (assetId: string) => {
    await apiFetchJson('/anomaly/inject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_id: assetId }),
    }).catch(() => {});
    await loadData(false);
  }, [loadData]);

  const handleResetSession = useCallback(async () => {
    await apiFetchJson('/reset', { method: 'POST' }).catch(() => {});
    setThreatDropActive(false);
    await loadData(false);
  }, [loadData]);

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

    const simRes = await apiFetchJson<SimulationResponse>('/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        persona,
        applied_actions: selectedIds,
        apply_threat_drop: threatDropActive,
      }),
    });

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === '1') setCurrentTab('risk');
      else if (e.key === '2') setCurrentTab('graph');
      else if (e.key === '3') setCurrentTab('remediation');
      else if (e.key === '4') setCurrentTab('how');
      else if (e.key === 't' || e.key === 'T') handleToggleThreatDrop();
      else if (e.key === 'd' || e.key === 'D') handleResetSession();
      else if (e.key === 'Escape') setSelectedAsset(null);
      else if (e.key === '?') setShowShortcutLegend((prev) => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleThreatDrop, handleResetSession]);

  return (
    <div className="min-h-screen bg-[--bg-primary] text-[--text-primary] flex flex-col font-sans">
      {/* Thin 2px top viewport loading bar */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-50 overflow-hidden pointer-events-none">
        {loading && (
          <div
            className="h-full w-2/5 progress-indeterminate"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          />
        )}
      </div>

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
        isDemoMode={isDemoMode}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-5 space-y-5">
        {error && (
          <div className="text-red-600 text-sm flex items-center gap-3">
            <span>{error}</span>
            <button
              onClick={() => loadData(false)}
              className="underline text-ink hover:text-accent transition-colors duration-150"
            >
              Retry
            </button>
          </div>
        )}

        {/* Tab 1: Dashboard */}
        {currentTab === 'risk' && (
          <RiskTableView
            overview={overview}
            loading={loading}
            onSelectAsset={setSelectedAsset}
            onInjectAnomaly={handleInjectAnomaly}
            selectedAssetId={selectedAsset?.asset_id ?? null}
            simulation={simulation}
            scenarioMeta={scenarioMeta}
            threatDropActive={threatDropActive}
            threatDropInfo={threatDropInfo}
          />
        )}

        {/* Tab 2: Graph */}
        {currentTab === 'graph' && (
          <GraphView
            attackGraph={attackGraph}
            dependencyGraph={dependencyGraph}
            chokePoints={chokePoints}
            loading={loading}
            onSelectAssetId={handleSelectAssetId}
            onClearSelection={() => setSelectedAsset(null)}
            overview={overview}
            scenarioMeta={scenarioMeta}
            selectedAssetId={selectedAsset?.asset_id ?? null}
          />
        )}

        {/* Tab 3: Remediation */}
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
            assets={overview?.assets ?? []}
          />
        )}

        {/* Tab 4: How It Works */}
        {currentTab === 'how' && (
          <HowItWorksView
            meta={metaInfo}
            validation={validationReport}
            loading={loading}
          />
        )}
      </main>

      {/* Compact Shortcut Legend for Demo Mode */}
      {showShortcutLegend && !selectedAsset && (
        <aside
          role="region"
          aria-label="Keyboard Shortcuts"
          className="fixed bottom-3 right-3 z-20 bg-white border border-[--border-default] rounded-lg px-3 py-2 text-xs text-ink-secondary"
        >
          <div className="flex items-center justify-between gap-4 border-b border-[--border-subtle] pb-1 mb-1.5">
            <span className="font-medium text-ink">
              Shortcuts {isFallbackMode() ? '(Fallback)' : ''}
            </span>
            <button
              onClick={() => setShowShortcutLegend(false)}
              className="text-ink-tertiary hover:text-ink"
              title="Close (? to toggle)"
            >
              ×
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono text-[11px]">
            <span>1–4 Tabs</span>
            <span>T Threat drop</span>
            <span>D Reset</span>
            <span>Esc Close panel</span>
          </div>
        </aside>
      )}

      {/* Right-Sliding Asset Detail Panel */}
      <AssetDetailModal
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onInjectAnomaly={handleInjectAnomaly}
        overview={overview}
        attackGraph={attackGraph}
        dependencyGraph={dependencyGraph}
      />
    </div>
  );
}
