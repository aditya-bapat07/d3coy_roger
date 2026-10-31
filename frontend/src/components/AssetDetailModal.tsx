import React, { useState } from 'react';
import {
  X,
  Shield,
  AlertTriangle,
  ArrowRight,
  Zap,
  Activity,
  Radio,
} from 'lucide-react';
import { AssetRiskResponse } from '../types/api';
import { PURDUE_ZONE_COLORS, getRiskLevel } from '../tokens';

interface AssetDetailModalProps {
  asset: AssetRiskResponse | null;
  onClose: () => void;
  onInjectAnomaly: (assetId: string) => Promise<void>;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  onClose,
  onInjectAnomaly,
}) => {
  const [injecting, setInjecting] = useState(false);

  if (!asset) return null;

  const riskLevel = getRiskLevel(asset.risk_score);
  const purdueColor = PURDUE_ZONE_COLORS[asset.purdue_level] || '#94A3B8';

  const handleInject = async () => {
    setInjecting(true);
    try {
      await onInjectAnomaly(asset.asset_id);
    } finally {
      setInjecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#111827] border border-[#23324A] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100 flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#23324A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="px-2.5 py-1 rounded font-mono text-xs font-bold"
              style={{
                backgroundColor: `${purdueColor}20`,
                borderColor: `${purdueColor}60`,
                color: purdueColor,
                borderWidth: '1px',
              }}
            >
              {asset.purdue_level}
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {asset.name}
              </h2>
              <p className="text-xs text-slate-400">
                {asset.vendor} • {asset.product} ({asset.version})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 flex-1">
          {/* Risk Score Summary Banner */}
          <div
            className="p-4 rounded-lg border flex items-center justify-between"
            style={{
              backgroundColor: riskLevel.bgColor,
              borderColor: riskLevel.borderColor,
            }}
          >
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8" style={{ color: riskLevel.color }} />
              <div>
                <div className="text-xs uppercase tracking-wider font-bold" style={{ color: riskLevel.color }}>
                  {riskLevel.label} Cyber-Physical Risk
                </div>
                <div className="text-2xl font-black font-mono text-white">
                  {asset.risk_score} <span className="text-xs text-slate-300 font-sans">/ 100</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 text-right">
              <div>
                <div className="text-[11px] text-slate-300">Likelihood Score</div>
                <div className="text-sm font-mono font-bold text-white">
                  {asset.likelihood_score.toFixed(3)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-300">Consequence Score</div>
                <div className="text-sm font-mono font-bold text-white">
                  {asset.consequence_score.toFixed(3)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-300">ML Anomaly</div>
                <div className="text-sm font-mono font-bold text-amber-400">
                  {asset.anomaly_score.toFixed(3)}
                </div>
              </div>
            </div>
          </div>

          {/* Vulnerability & Threat Intelligence */}
          <div className="bg-[#162032] border border-[#23324A] rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Vulnerabilities & Intelligence Grounding
            </h3>

            {asset.cves.length > 0 ? (
              <div className="space-y-2">
                {asset.cves.map((cve) => (
                  <div
                    key={cve}
                    className="p-2.5 rounded bg-[#111827] border border-[#23324A] flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-400">{cve}</span>
                      {asset.cisa_kev && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-950 border border-red-500/50 text-red-300 font-sans font-semibold">
                          CISA KEV Listed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      {asset.cvss && <span>CVSS: <strong className="text-white">{asset.cvss}</strong></span>}
                      <span>EPSS: <strong className="text-white">{(asset.epss * 100).toFixed(1)}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : asset.default_credentials ? (
              <div className="p-2.5 rounded bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs">
                ⚠️ Default administrative credentials detected. Unauthenticated bypass possible (Prob: 0.90).
              </div>
            ) : (
              <div className="text-xs text-slate-400">
                No active CVE or credential weaknesses registered. Protected by host isolation.
              </div>
            )}

            {/* Operational Attributes */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="flex items-center justify-between p-2 rounded bg-[#111827] border border-[#23324A]">
                <span className="text-slate-400">Patchable Immediately:</span>
                <span className={asset.patchable_now ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                  {asset.patchable_now ? 'Yes (IT System)' : 'No (OT Maintenance Window)'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#111827] border border-[#23324A]">
                <span className="text-slate-400">Next Maint. Window:</span>
                <span className="text-white font-mono">{asset.next_maintenance_window_days} days</span>
              </div>
            </div>
          </div>

          {/* Physical Consequence Cascade */}
          <div className="bg-[#162032] border border-[#23324A] rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-red-400" />
              Physical Consequence Cascade (INL CCE)
            </h3>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded bg-[#111827] border border-[#23324A] text-center">
                <div className="text-[10px] text-slate-400">People Impacted</div>
                <div className="text-lg font-bold font-mono text-white">
                  {asset.max_people_affected.toLocaleString()}
                </div>
              </div>
              <div className="p-2.5 rounded bg-[#111827] border border-[#23324A] text-center">
                <div className="text-[10px] text-slate-400">Safety Severity</div>
                <div className="text-lg font-bold font-mono text-amber-400">
                  {asset.max_safety_severity} / 4
                </div>
              </div>
              <div className="p-2.5 rounded bg-[#111827] border border-[#23324A] text-center">
                <div className="text-[10px] text-slate-400">Max Outage Duration</div>
                <div className="text-lg font-bold font-mono text-red-400">
                  {asset.max_outage_hours} h
                </div>
              </div>
            </div>

            {asset.services_impacted.length > 0 && (
              <div>
                <div className="text-xs text-slate-400 mb-1.5">Impacted Municipal Services:</div>
                <div className="flex flex-wrap gap-1.5">
                  {asset.services_impacted.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-1 rounded text-xs bg-slate-800 border border-slate-700 text-slate-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Attack Path Traversal */}
          {asset.path_from_entry.length > 0 && (
            <div className="bg-[#162032] border border-[#23324A] rounded-lg p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-400" />
                Most Likely Attack Path ({asset.path_from_entry.length - 1} Hops)
              </h3>
              <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
                {asset.path_from_entry.map((step, idx) => (
                  <React.Fragment key={step}>
                    <span className="px-2 py-1 rounded bg-[#111827] border border-[#23324A] text-slate-300">
                      {step}
                    </span>
                    {idx < asset.path_from_entry.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-4 border-t border-[#23324A] bg-[#0E1524] flex items-center justify-between">
          <button
            onClick={handleInject}
            disabled={injecting}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-medium transition"
          >
            <Activity className={`w-4 h-4 ${injecting ? 'animate-spin' : ''}`} />
            {injecting ? 'Injecting Anomaly...' : 'Simulate Live ML Anomaly Burst (0.88+)'}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
