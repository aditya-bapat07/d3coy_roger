import { useState, useEffect, useCallback, useMemo } from 'react';
import { Header, CityOption } from './components/Header';
import { RiskTableView } from './components/RiskTableView';
import { GraphView } from './components/GraphView';
import { RemediationView } from './components/RemediationView';
import { HowItWorksView } from './components/HowItWorksView';
import { AssetDetailModal } from './components/AssetDetailModal';
import { BackgroundBlobs } from './components/BackgroundBlobs';
import LandingPage from './landing/LandingPage';
import { ViduraGlassReveal } from './components/ui/liquid-glass-logo-reveal';
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

type Tab = 'risk' | 'graph' | 'remediation' | 'how';

interface DashboardProps {
  initialTab?: Tab;
  initialPersona?: PersonaType;
  onGoHome?: () => void;
}

export function Dashboard({ initialTab, initialPersona, onGoHome }: DashboardProps) {
  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const isDemoMode = queryParams.get('demo') === '1';
  const initialThreat = queryParams.get('threat') === '1';

  const defaultTab =
    initialTab ||
    (queryParams.get('tab') as Tab) ||
    (isDemoMode ? 'graph' : 'risk');

  const defaultPersona =
    initialPersona ||
    ((queryParams.get('persona') as PersonaType) &&
    ['nation_state', 'opportunistic', 'insider'].includes(queryParams.get('persona') as string)
      ? (queryParams.get('persona') as PersonaType)
      : 'nation_state');

  const [currentTab, setCurrentTab] = useState<Tab>(defaultTab);
  const [persona, setPersona] = useState<PersonaType>(defaultPersona);
  const [threatDropActive, setThreatDropActive] = useState<boolean>(initialThreat);
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
  const [cities, setCities] = useState<CityOption[]>([]);
  const [activeCityId, setActiveCityId] = useState<string>('navanagar');

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

  const handleTabChange = useCallback((tab: Tab) => {
    setCurrentTab(tab);
    const q = new URLSearchParams(window.location.search);
    q.set('tab', tab);
    window.history.replaceState(null, '', window.location.pathname + '?' + q.toString());
  }, []);

  const handleExportPdf = () => {
    if (isFallbackMode()) {
      alert('Executive briefing PDF generation requires a running Vidura backend API (offline static snapshot mode active).');
      return;
    }
    const cleanBase = API_BASE.replace(/\/api\/?$/, '');
    const pdfUrl = cleanBase
      ? `${cleanBase}/api/report/pdf?persona=${persona}`
      : `/api/report/pdf?persona=${persona}`;
    window.open(pdfUrl, '_blank');
  };

  useEffect(() => {
    if (isFallbackMode()) return;
    apiFetchJson<{ active: string; cities: CityOption[] }>('/cities')
      .then((res) => {
        if (Array.isArray(res?.cities)) {
          setCities(res.cities);
          setActiveCityId(res.active);
        }
      })
      .catch(() => {});
  }, []);

  const handleCityChange = useCallback(
    async (cityId: string) => {
      setActiveCityId(cityId);
      setSelectedAsset(null);
      await apiFetchJson('/city/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city_id: cityId }),
      }).catch(() => {});
      await loadData(false);
    },
    [loadData]
  );

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
      if (e.key === '1') handleTabChange('risk');
      else if (e.key === '2') handleTabChange('graph');
      else if (e.key === '3') handleTabChange('remediation');
      else if (e.key === '4') handleTabChange('how');
      else if (e.key === 't' || e.key === 'T') handleToggleThreatDrop();
      else if (e.key === 'd' || e.key === 'D') handleResetSession();
      else if (e.key === 'Escape') setSelectedAsset(null);
      else if (e.key === '?') setShowShortcutLegend((prev) => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleThreatDrop, handleResetSession]);

  return (
    <div className="relative min-h-screen bg-[#0A0706] text-white flex flex-col font-sans">
      {/* Background Ambient Blobs and Grain */}
      <BackgroundBlobs currentTab={currentTab} />

      {/* Top Thin Orange Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-50 overflow-hidden pointer-events-none">
        {loading && (
          <div
            className="h-full w-2/5 progress-indeterminate shadow-[0_0_8px_#F26A1B]"
            style={{
              background: 'linear-gradient(90deg, #F26A1B 0%, #FF7A2B 100%)',
            }}
          />
        )}
      </div>

      {/* Top Application Header */}
      <Header
        currentTab={currentTab}
        onTabChange={handleTabChange}
        persona={persona}
        onPersonaChange={setPersona}
        threatDropActive={threatDropActive}
        onToggleThreatDrop={handleToggleThreatDrop}
        onExportPdf={handleExportPdf}
        onResetSession={handleResetSession}
        loading={loading}
        isDemoMode={isDemoMode}
        onGoHome={onGoHome}
        cities={cities}
        activeCityId={activeCityId}
        onCityChange={handleCityChange}
      />

      {/* Main Content Workspace */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 pt-24 sm:pt-28 pb-12 space-y-6">
        {error && (
          <div className="glass-card bg-red-950/20 border-red-500/30 text-red-200 px-4 py-3 text-sm flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(255,77,79,0.15)]">
            <span>{error}</span>
            <button
              onClick={() => loadData(false)}
              className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 hover:bg-red-500/30 text-white border border-red-500/40 transition-colors duration-150"
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

      {/* Compact Glass Shortcut Legend for Demo Mode */}
      {showShortcutLegend && !selectedAsset && (
        <aside
          role="region"
          aria-label="Keyboard Shortcuts"
          className="glass-card fixed bottom-4 right-4 z-20 px-3.5 py-2.5 text-xs text-[#A09A96] shadow-xl"
        >
          <div className="flex items-center justify-between gap-5 border-b border-white/[0.08] pb-1.5 mb-2">
            <span className="font-semibold text-white tracking-wide flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F26A1B]" />
              Shortcuts {isFallbackMode() ? '(Fallback)' : ''}
            </span>
            <button
              onClick={() => setShowShortcutLegend(false)}
              className="text-[#6F6863] hover:text-white transition-colors"
              title="Close (? to toggle)"
            >
              ×
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-1 font-mono text-[11px]">
            <span><span className="text-[#F26A1B]">1–4</span> Tabs</span>
            <span><span className="text-[#F26A1B]">T</span> Threat drop</span>
            <span><span className="text-[#F26A1B]">D</span> Reset</span>
            <span><span className="text-[#F26A1B]">Esc</span> Close</span>
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

export default function App() {
  const [showLanding, setShowLanding] = useState<boolean>(() => {
    const q = new URLSearchParams(window.location.search);
    return !(q.get('demo') === '1' || q.get('tab') || q.get('app') === '1');
  });

  const [showIntro, setShowIntro] = useState<boolean>(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('intro') === '1') return true;
    if (q.get('demo') === '1' || q.get('tab') || q.get('app') === '1') return false;
    if (q.get('skipIntro') === '1') return false;
    // Always plays on website load and refresh (no persistent storage lockout)
    return true;
  });
  const [introFading, setIntroFading] = useState<boolean>(false);

  const dismissIntro = useCallback(() => {
    setIntroFading(true);
    setTimeout(() => {
      setShowIntro(false);
      setIntroFading(false);
    }, 400);
  }, []);

  const [activeTab, setActiveTab] = useState<Tab | undefined>(() => {
    const q = new URLSearchParams(window.location.search);
    const tabParam = q.get('tab') as Tab;
    return ['risk', 'graph', 'remediation', 'how'].includes(tabParam) ? tabParam : undefined;
  });

  const [activePersona, setActivePersona] = useState<PersonaType | undefined>(() => {
    const q = new URLSearchParams(window.location.search);
    const pParam = q.get('persona') as PersonaType;
    return ['nation_state', 'opportunistic', 'insider'].includes(pParam) ? pParam : undefined;
  });

  useEffect(() => {
    const handlePopState = () => {
      const q = new URLSearchParams(window.location.search);
      const isLanding = !(q.get('demo') === '1' || q.get('tab') || q.get('app') === '1');
      setShowLanding(isLanding);
      const tabParam = q.get('tab') as Tab;
      if (['risk', 'graph', 'remediation', 'how'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
      const pParam = q.get('persona') as PersonaType;
      if (['nation_state', 'opportunistic', 'insider'].includes(pParam)) {
        setActivePersona(pParam);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const enterDashboard = (tab?: Tab, targetPersona?: PersonaType) => {
    if (tab) setActiveTab(tab);
    if (targetPersona) setActivePersona(targetPersona);
    setShowLanding(false);

    const q = new URLSearchParams(window.location.search);
    q.set('app', '1');
    if (tab) q.set('tab', tab);
    if (targetPersona) q.set('persona', targetPersona);
    const newRelativePathQuery = window.location.pathname + '?' + q.toString();
    window.history.pushState({ app: true, tab, persona: targetPersona }, '', newRelativePathQuery);
  };

  const handleGoHome = () => {
    setShowLanding(true);
    const q = new URLSearchParams(window.location.search);
    q.delete('app');
    q.delete('tab');
    q.delete('demo');
    const newQuery = q.toString();
    const newUrl = window.location.pathname + (newQuery ? '?' + newQuery : '');
    window.history.pushState({ app: false }, '', newUrl);
  };

  if (showLanding) {
    return (
      <div className="relative min-h-screen bg-[#0A0706]">
        {/* The Landing Page is rendered underneath as the ground truth */}
        <LandingPage
          onLaunch={() => enterDashboard()}
          onLaunchTab={(tab) => enterDashboard(tab)}
          onLaunchPersona={(targetPersona) => enterDashboard(undefined, targetPersona)}
          onThreatDemo={() => {
            window.location.href = '/?demo=1&threat=1';
          }}
        />

        {/* Launching animation: seamless glass reveal integrated with the Cybrix background */}
        {showIntro && (
          <div
            className={`fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#0A0706]/65 backdrop-blur-[5px] text-white transition-opacity duration-600 select-none cursor-pointer ${
              introFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            onClick={dismissIntro}
            role="button"
            tabIndex={0}
            aria-label="Skip intro animation"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') dismissIntro();
            }}
          >
            {/* Ambient background glow layers matching Cybrix theme */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full bg-[#F26A1B]/12 blur-[150px]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full bg-[#FF7A2B]/18 blur-[90px]" />
            </div>

            {/* Liquid Glass Reveal - Transparent Background, No App Icon Plate */}
            <div className="absolute inset-0 w-full h-full flex items-center justify-center">
              <ViduraGlassReveal
                className="w-full h-full"
                look="dark"
                iconPlate={false}
                keepPlate={false}
                transparent={true}
                background="#0A0706"
                plateColor="#0A0706"
                logoColor="#F26A1B"
                loop={false}
                speed={1.15}
                onComplete={() => {
                  setTimeout(dismissIntro, 350);
                }}
              />
            </div>

            {/* Brand Title and Subtitle Floating Below Center */}
            <div className="relative z-10 flex flex-col items-center gap-2.5 mt-[300px] sm:mt-[320px] text-center px-4 pointer-events-none">
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-2xl sm:text-3xl tracking-tight text-white font-mono">
                  VIDURA
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase bg-[#F26A1B]/15 text-[#F26A1B] border border-[#F26A1B]/30 shadow-[0_0_12px_rgba(242,106,27,0.2)]">
                  AI Posture
                </span>
              </div>
              <p className="text-xs text-white/50 tracking-wider uppercase font-mono max-w-sm">
                Graph-Driven Security Posture &amp; Remediation
              </p>
            </div>

            {/* Skip Hint */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dismissIntro();
              }}
              className="absolute bottom-6 sm:bottom-8 right-6 sm:right-8 z-20 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#F26A1B]/40 text-xs text-white/60 hover:text-white transition-all flex items-center gap-1.5 font-mono shadow-sm"
            >
              <span>Skip</span>
              <span className="text-[#F26A1B]">→</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return <Dashboard initialTab={activeTab} initialPersona={activePersona} onGoHome={handleGoHome} />;
}
