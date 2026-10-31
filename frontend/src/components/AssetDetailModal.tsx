import React, { useState } from 'react';
import {
  X,
  Shield,
  AlertTriangle,
  ArrowRight,
  Zap,
  Activity,
  Radio,
  HelpCircle,
  TrendingDown,
  CheckCircle,
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
  const [showTooltip, setShowTooltip] = useState(false);

  if (!asset) return null;

  const riskLevel = getRiskLevel(asset.risk_score);
  const purdueColor = PURDUE_ZONE_COLORS[asset.purdue_level] || '#94A3B8';
  const confidence = asset.confidence;
  const whyBreakdown = asset.risk_drop_if_removed;
  const topPaths = asset.top_3_paths || [];

  const handleInject = async () => {
    setInjecting(true);
    try {
      await onInjectAnomaly(asset.asset_id);
    } finally {
      setInjecting(false);
    }
  };

  const getConfidenceBadgeColor = (rating?: string) => {
    if (rating === 'High') return 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300';
    if (rating === 'Medium') return 'bg-amber-950/80 border-amber-500/50 text-amber-300';
    return 'bg-rose-950/80 border-rose-500/50 text-rose-300';
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
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  {asset.name}
                </h2>
                {confidence && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${getConfidenceBadgeColor(
                      confidence.rating
                    )}`}
                    title={confidence.reasons.join('\n')}
                  >
                    {confidence.rating} Confidence
                  </span>
                )}
              </div>
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

          {/* Confidence Evaluation Box */}
          {confidence && (
            <div className="bg-[#162032] border border-[#23324A] rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                  Model Confidence: <span className="text-white">{confidence.rating}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Reliability Score: {(confidence.score * 100).toFixed(0)}%
                </span>
              </div>
              {confidence.reasons.length > 0 ? (
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  {confidence.reasons.map((r, i) => (
                    <li key={i} className="text-slate-300 text-[11px]">
                      {r}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-[11px] text-emerald-400">
                  ✓ High grounding confidence: live CISA KEV verified, exact CPE match, and active telemetry.
                </div>
              )}
            </div>
          )}

          {/* 'Why' Breakdown: Single-Factor Risk Drops (Sensitivity) */}
          {whyBreakdown && whyBreakdown.factors.length > 0 && (
            <div className="bg-[#162032] border border-[#23324A] rounded-lg p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-emerald-400" />
                  Why is this asset at risk? (Single-Factor Sensitivity)
                </h3>
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400 hover:text-blue-400" />
                  </button>
                  {showTooltip && (
                    <div className="absolute right-0 bottom-6 w-64 p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-[10px] text-slate-200 shadow-2xl z-30 pointer-events-none">
                      {whyBreakdown.note}
                    </div>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Risk drop if each individual factor on the best path or consequence cascade is eliminated:
              </p>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {whyBreakdown.factors.map((f) => (
                  <div
                    key={f.factor_id}
                    className="p-2 rounded bg-[#111827] border border-[#23324A] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300 text-[11px] font-medium">{f.description}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-emerald-400 font-bold">-{f.risk_drop.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-400">({f.risk_without_factor.toFixed(1)})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* Attack Path Traversal & Yen's Top-3 Paths */}
          {topPaths.length > 0 ? (
            <div className="bg-[#162032] border border-[#23324A] rounded-lg p-4 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-400" />
                Attack Traversal Chains (Yen's Top-{topPaths.length} Paths)
              </h3>
              <div className="space-y-2">
                {topPaths.map((pDetail, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded bg-[#111827] border border-[#23324A] text-xs font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-bold text-blue-300">
                        {idx === 0 ? 'Primary Attack Path (Most Likely)' : `Alternative Path #${idx + 1}`}
                      </span>
                      <span>
                        Probability: <strong className="text-white">{(pDetail.probability * 100).toFixed(2)}%</strong> ({pDetail.hop_count} hops)
                      </span>
                    </div>
                    <div className="flex items-center flex-wrap gap-1.5 pt-1">
                      {pDetail.path.map((step, sIdx) => (
                        <React.Fragment key={step}>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 text-[10px]">
                            {step}
                          </span>
                          {sIdx < pDetail.path.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-slate-500" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : asset.path_from_entry.length > 0 && (
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
