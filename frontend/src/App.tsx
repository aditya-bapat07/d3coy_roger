import { useEffect, useState } from 'react';
import { Activity, ShieldAlert, Cpu, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { RISK_SCALE, PURDUE_ZONE_COLORS } from './tokens';

interface HealthResponse {
  status: string;
}

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/health');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: HealthResponse = await response.json();
      setHealth(data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Backend unreachable: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-control-bg text-control-text flex flex-col">
      {/* Control Room Top Navigation */}
      <header className="border-b border-control-border bg-control-surface/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <ShieldAlert className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wider text-lg text-white">Vidura</span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-900/50 border border-blue-500/40 text-blue-300 font-mono">
                v0.1.0-scaffold
              </span>
            </div>
            <p className="text-xs text-control-subtle">
              Critical Infrastructure Cyber-Risk Prediction & Prioritisation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-control-card border border-control-border text-xs">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-control-subtle">Persona:</span>
            <span className="font-medium text-slate-200">Plant Security Manager</span>
          </div>

          <button
            onClick={checkHealth}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Backend Health Check Status Banner */}
        <div className="p-4 rounded-xl border bg-control-card border-control-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
              ) : health?.status === 'ok' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              )}
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Backend API Health Status: <span className="font-mono text-xs">{health?.status ?? 'Connecting...'}</span>
                </h3>
                <p className="text-xs text-control-subtle">
                  Endpoint: <code className="font-mono text-slate-300">GET http://localhost:8000/api/health</code>
                </p>
              </div>
            </div>

            <div className="text-right text-xs text-control-subtle">
              {lastChecked && <span>Last checked: {lastChecked}</span>}
              {error && <span className="text-rose-400 block font-mono mt-0.5">{error}</span>}
            </div>
          </div>
        </div>

        {/* Design System Reference: Risk Color Scale (0-100) */}
        <section className="space-y-3">
          <h2 className="text-xs uppercase font-mono tracking-wider text-control-subtle flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            Unified Risk Scale Tokens (0 – 100)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(RISK_SCALE).map(([key, val]) => (
              <div
                key={key}
                style={{ borderColor: val.borderColor }}
                className="p-4 rounded-xl border bg-control-card flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">{val.label}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: val.bgColor, color: val.color }}>
                    {val.min} – {val.max}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${val.max}%`,
                      backgroundColor: val.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Purdue Zone Architectural Strata */}
        <section className="space-y-3">
          <h2 className="text-xs uppercase font-mono tracking-wider text-control-subtle">
            Purdue Model Zone Strata
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {Object.entries(PURDUE_ZONE_COLORS).map(([zone, color]) => (
              <div
                key={zone}
                className="p-3 rounded-lg border border-control-border bg-control-surface flex flex-col items-center justify-center text-center"
              >
                <div
                  className="w-3 h-3 rounded-full mb-1.5"
                  style={{ backgroundColor: color }}
                />
                <span className="font-mono text-xs font-semibold text-white">{zone}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Persona Core Questions Banner */}
        <section className="p-5 rounded-xl border border-control-border bg-control-card/60">
          <h3 className="text-xs uppercase font-mono tracking-wider text-blue-400 mb-3">
            Plant Security Manager Triad
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-control-surface border border-control-border/60">
              <span className="font-semibold text-white block mb-1">1. What is most at risk?</span>
              <p className="text-control-subtle">
                Dynamic risk priority index factoring attack likelihood, ML anomaly boost, and INL CCE consequence cascade.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-control-surface border border-control-border/60">
              <span className="font-semibold text-white block mb-1">2. Why?</span>
              <p className="text-control-subtle">
                Deterministic attack-path reachability graph with real EPSS/KEV exploitability, mapped to MITRE ATT&CK for ICS.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-control-surface border border-control-border/60">
              <span className="font-semibold text-white block mb-1">3. What do I do first?</span>
              <p className="text-control-subtle">
                Network choke-point identification and OT-realistic remediation plan (patch / segment / disable remote access / MFA).
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-control-border py-3 px-6 text-center text-xs text-control-subtle">
        Vidura &bull; Offline-Capable Prototype &bull; PS 03 AI-Based Critical Infrastructure Cyber-Risk Prediction
      </footer>
    </div>
  );
}
