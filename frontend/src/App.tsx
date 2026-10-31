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
import {
  X,
  Keyboard,
  ShieldAlert,
} from 'lucide-react';

export default function App() {
  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const isDemoMode = queryParams.get('demo') === '1';

  // Demo mode defaults to 'graph' tab and 'nation_state' persona
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

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Core data fetching callback
  const loadData = useCallback(async (isInitialDemoReset = false) => {
    setLoading(true);
    setError(null);
    try {
      if (isInitialDemoReset) {
        // Reset backend session state on demo initialization
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
        .filter((a: any) => a.selected)
        .map((a: any) => a.id);

      const simRes = await apiFetchJson<SimulationResponse>('/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona,
          applied_actions: selectedActionIds,
          apply_threat_drop: threatDropActive,
        }),
      });

      const [riskRes, attackRes, depRes, chokeRes, tdRes, metaRes, valRes] = await Promise.all([
        apiFetchJson<RiskOverviewResponse>(`/risk/assets?persona=${persona}`),
        apiFetchJson<AttackGraphResponse>(`/graph/attack?persona=${persona}`),
        apiFetchJson<DependencyGraphResponse>('/graph/dependency'),
        apiFetchJson<ChokePointResponse>('/choke-points'),
        apiFetchJson<ThreatDropResponse>('/threat-drop'),
        fetchMetaInfo('/api'),
        fetchValidationReport('/api'),
      ]);

      setOverview(riskRes);

      // Preselection logic:
      // In demo mode or explicit query param, preselect the water plant crown jewel
      const urlParams = new URLSearchParams(window.location.search);
      const targetAssetId = urlParams.get('asset') || (isDemoMode ? 'asset_water_plc_chlorine' : null);
      if (targetAssetId && riskRes?.assets) {
        const matched = riskRes.assets.find((a: any) => a.asset_id === targetAssetId);
        if (matched) setSelectedAsset(matched);
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
  }, [persona, threatDropActive, engineerBudget, isDemoMode]);

  // Initial load effect
  useEffect(() => {
    loadData(isDemoMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload data when parameters change (unless initial load)
  useEffect(() => {
    loadData(false);
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
    if (selectedAsset && selectedAsset.asset_id === assetId) {
      const updated = overview?.assets.find((a) => a.asset_id === assetId);
      if (updated) setSelectedAsset(updated);
    }
  }, [selectedAsset, overview, loadData]);

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

  // Keyboard shortcut listener
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
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/60 text-red-200 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadData(false)}
              className="px-3 py-1 rounded bg-red-900/60 hover:bg-red-800 text-white font-medium transition-colors"
            >
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

        {/* Tab 4: How it works (Methodology, Provenance & Validation) */}
        {currentTab === 'how' && (
          <HowItWorksView
            meta={metaInfo}
            validation={validationReport}
            loading={loading}
          />
        )}
      </main>

      {/* Floating Shortcut Legend HUD */}
      {showShortcutLegend && (
        <aside
          role="region"
          aria-label="Demo Shortcuts"
          className="fixed bottom-4 right-4 z-40 bg-[#0F172A]/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-md max-w-xs text-xs animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2 mb-2.5">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-slate-200">
                {isDemoMode ? 'Demo Mode: Active' : 'Keyboard Shortcuts'}
              </span>
              {isFallbackMode() && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Offline Fallback
                </span>
              )}
            </div>
            <button
              onClick={() => setShowShortcutLegend(false)}
              className="text-slate-400 hover:text-white p-0.5"
              title="Close Legend (? to reopen)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-slate-300 font-mono text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Risk Table</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-blue-400">1</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Topology Map</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-blue-400">2</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Remediation</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-blue-400">3</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Methodology</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-blue-400">4</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Threat Drop</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-amber-400">T</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Reset Demo</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-emerald-400">D</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Close Modal</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-400">Esc</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Toggle HUD</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-400">?</kbd>
            </div>
          </div>
        </aside>
      )}

      {/* Button to reopen shortcut legend if dismissed */}
      {!showShortcutLegend && (
        <button
          onClick={() => setShowShortcutLegend(true)}
          className="fixed bottom-4 right-4 z-30 p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 shadow-lg backdrop-blur-sm transition-all"
          title="Show keyboard shortcuts (?)"
        >
          <Keyboard className="w-4 h-4" />
        </button>
      )}

      {/* Deep-Dive Inspection Modal */}
      <AssetDetailModal
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onInjectAnomaly={handleInjectAnomaly}
      />
    </div>
  );
}
