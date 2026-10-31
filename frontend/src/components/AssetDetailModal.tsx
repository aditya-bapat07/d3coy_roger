import React, { useEffect, useMemo, useState } from 'react';
import {
  AssetRiskResponse,
  AttackGraphResponse,
  DependencyGraphResponse,
  RiskOverviewResponse,
} from '../types/api';
import { getRiskBand, purdueLabel } from '../tokens';
import { shortName, truncate } from '../display';
import { apiFetchJson, isFallbackMode } from '../apiClient';
import { ArrowUpRight, ShieldCheck, Clock } from 'lucide-react';

interface AssetDetailModalProps {
  asset: AssetRiskResponse | null;
  onClose: () => void;
  onInjectAnomaly: (assetId: string) => Promise<void>;
  overview?: RiskOverviewResponse | null;
  attackGraph?: AttackGraphResponse | null;
  dependencyGraph?: DependencyGraphResponse | null;
}

type PanelTab = 'breakdown' | 'vulns' | 'cascade' | 'anomaly';

interface AnomalyDetail {
  score: number;
  peak_hour_window?: number;
  top_contributing_features?: { feature: string; value: number; baseline_mean: number; z_score: number }[];
}

const FALLBACK_ANOMALY_ASSETS = new Set(['asset_water_scada', 'asset_vendor_vpn', 'asset_water_plc_chlorine']);

const CONFIDENCE_DOT: Record<string, string> = {
  High: 'var(--risk-low)',
  Medium: 'var(--risk-medium)',
  Low: 'var(--risk-minimal)',
};

function cvssColor(cvss: number): string {
  if (cvss >= 9) return 'var(--risk-critical)';
  if (cvss >= 7) return 'var(--risk-high)';
  if (cvss >= 4) return 'var(--risk-medium)';
  return 'var(--risk-low)';
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  onClose,
  onInjectAnomaly,
  overview,
  attackGraph,
  dependencyGraph,
}) => {
  const [tab, setTab] = useState<PanelTab>('breakdown');
  const [injecting, setInjecting] = useState(false);
  const [anomaly, setAnomaly] = useState<AnomalyDetail | null>(null);

  const assetId = asset?.asset_id;
  const hasAnomaly = !!asset && asset.anomaly_score > 0;

  useEffect(() => {
    if (!hasAnomaly && tab === 'anomaly') setTab('breakdown');
  }, [hasAnomaly, tab]);

  useEffect(() => {
    setAnomaly(null);
    if (!assetId || tab !== 'anomaly') return;
    if (isFallbackMode() && !FALLBACK_ANOMALY_ASSETS.has(assetId)) return;
    let cancelled = false;
    apiFetchJson<AnomalyDetail>(`/anomaly/${assetId}`)
      .then((d) => !cancelled && setAnomaly(d))
      .catch(() => !cancelled && setAnomaly(null));
    return () => {
      cancelled = true;
    };
  }, [assetId, tab]);

  const nameOf = useMemo(() => {
    const m = new Map<string, string>();
    (overview?.assets ?? []).forEach((a) => m.set(a.asset_id, a.name));
    return (id: string) => shortName(id, m.get(id));
  }, [overview]);

  const techniqueNames = useMemo(() => {
    const m = new Map<string, string>();
    (attackGraph?.edges ?? []).forEach((e) => {
      if (e.technique_id && e.technique_name) m.set(e.technique_id, e.technique_name);
    });
    return m;
  }, [attackGraph]);

  const cascade = useMemo(() => {
    if (!assetId || !dependencyGraph) return [];
    const nodeMap = new Map(dependencyGraph.nodes.map((n) => [n.id, n]));
    if (!nodeMap.has(assetId)) return [];
    const best = new Map<string, { t: number; via?: { type: string; delay: number; from: string } }>();
    best.set(assetId, { t: 0 });
    const queue = [assetId];
    while (queue.length) {
      const cur = queue.shift()!;
      const tCur = best.get(cur)!.t;
      dependencyGraph.edges
        .filter((e) => e.source === cur)
        .forEach((e) => {
          const t = tCur + e.failure_delay_hours;
          const prev = best.get(e.target);
          if (!prev || t < prev.t) {
            best.set(e.target, { t, via: { type: e.type, delay: e.failure_delay_hours, from: cur } });
            queue.push(e.target);
          }
        });
    }
    return [...best.entries()]
      .map(([id, v]) => ({ id, node: nodeMap.get(id)!, ...v }))
      .sort((a, b) => a.t - b.t || (a.id === assetId ? -1 : 0));
  }, [assetId, dependencyGraph]);

  if (!asset) return null;

  const band = getRiskBand(asset.risk_score);
  const confidence = asset.confidence;
  const allFactors = asset.risk_drop_if_removed?.factors ?? [];
  const activeFactors = allFactors.filter((f) => f.risk_drop > 0);
  const maxDrop = Math.max(1, ...activeFactors.map((f) => f.risk_drop));
  const topPaths =
    asset.top_3_paths && asset.top_3_paths.length > 0
      ? asset.top_3_paths
      : asset.path_from_entry.length > 0
      ? [
          {
            path: asset.path_from_entry,
            probability: NaN,
            likelihood_score: asset.likelihood_score,
            technique_ids: asset.path_technique_ids,
            hop_count: asset.path_from_entry.length - 1,
          },
        ]
      : [];
  const techniques = Array.from(new Set(topPaths.flatMap((p) => p.technique_ids)));

  const handleInject = async () => {
    setInjecting(true);
    try {
      await onInjectAnomaly(asset.asset_id);
    } finally {
      setInjecting(false);
    }
  };

  const tabs: { key: PanelTab; label: string }[] = [
    { key: 'breakdown', label: 'Risk Breakdown' },
    { key: 'vulns', label: 'Vulnerabilities' },
    { key: 'cascade', label: 'Cascade' },
    ...(hasAnomaly ? [{ key: 'anomaly' as PanelTab, label: 'Anomaly' }] : []),
  ];

  return (
    <aside
      role="dialog"
      aria-label={`${asset.name} details`}
      className="panel-slide-in fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[480px] bg-[#120D0B]/95 backdrop-blur-2xl border-l border-white/[0.08] flex flex-col shadow-[-16px_0_50px_rgba(0,0,0,0.85)] text-[#A09A96]"
    >
      {/* Sticky header */}
      <div className="px-6 pt-5 pb-4 border-b border-white/[0.08] bg-[#120D0B]/90">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-semibold text-white leading-snug tracking-tight">{asset.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.03] text-[#A09A96] font-mono">
                {purdueLabel(asset.purdue_level)}
              </span>
            </div>
            <div className="mt-1 text-xs text-[#6F6863] truncate">
              {asset.vendor} · {asset.product} ({asset.version})
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#A09A96] hover:text-white hover:bg-white/10 transition-colors duration-150 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Score & Risk bar */}
        <div className="mt-4 flex items-center gap-5">
          <span
            className="font-mono font-bold tracking-tight drop-shadow-[0_0_12px_rgba(242,106,27,0.3)]"
            style={{ fontSize: 34, lineHeight: 1, color: band.color }}
          >
            {asset.risk_score.toFixed(1)}
          </span>
          <div className="flex-1">
            <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, asset.risk_score)}%`,
                  backgroundColor: band.color,
                  boxShadow: `0 0 10px ${band.color}66`,
                }}
              />
            </div>
            <div className="mt-1.5 text-xs text-[#6F6863] flex justify-between">
              <span className="font-medium text-white">{band.label} Risk</span>
              <span className="font-mono">L {asset.likelihood_score.toFixed(2)} × C {asset.consequence_score.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Confidence metric */}
        {confidence && (
          <div className="mt-3.5 pt-3 border-t border-white/[0.04]">
            <div className="flex items-center gap-2 text-xs text-white">
              <span className="w-2 h-2 rounded-full shadow-[0_0_6px_currentColor]" style={{ backgroundColor: CONFIDENCE_DOT[confidence.rating], color: CONFIDENCE_DOT[confidence.rating] }} />
              <span className="font-medium">{confidence.rating} Confidence</span>
            </div>
            {confidence.rating !== 'High' && confidence.reasons[0] && (
              <p className="mt-1 text-xs text-[#6F6863] leading-relaxed">{confidence.reasons[0]}</p>
            )}
          </div>
        )}

        {/* Physical Operational SLA Impact */}
        {asset.physical_impact_label && (
          <div className="mt-3.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#3DDC97]" />
                Physical Operational SLA Impact
              </span>
              {asset.cascade_time_to_criticality_hours !== undefined && asset.cascade_time_to_criticality_hours > 0 && (
                <span className="font-mono text-[10px] text-[#F26A1B] bg-[#F26A1B]/15 border border-[#F26A1B]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  T+{asset.cascade_time_to_criticality_hours}h to Criticality
                </span>
              )}
            </div>
            <div className="text-white font-medium text-xs leading-relaxed">
              {asset.physical_impact_label}
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px] text-[#A09A96] border-t border-white/[0.04]">
              <div>
                <span className="text-[#6F6863] block text-[10px]">Flow / Load</span>
                <span className="text-white font-semibold">
                  {asset.mld_loss && asset.mld_loss > 0
                    ? `${asset.mld_loss} MLD`
                    : asset.megawatts_affected && asset.megawatts_affected > 0
                    ? `${asset.megawatts_affected} MW`
                    : 'Telemetry'}
                </span>
              </div>
              <div>
                <span className="text-[#6F6863] block text-[10px]">Reserve Buffer</span>
                <span className="text-white font-semibold">
                  {asset.reserve_buffer_hours && asset.reserve_buffer_hours > 0 ? `${asset.reserve_buffer_hours} hrs` : 'Continuous'}
                </span>
              </div>
              <div>
                <span className="text-[#6F6863] block text-[10px]">Purdue Choke</span>
                <span className="text-white font-semibold">{asset.is_choke_point ? 'Critical Pivot' : 'Normal'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Sub-tab navigation */}
        <nav className="mt-4 -mb-4 flex gap-6 text-xs sm:text-sm border-t border-white/[0.06] pt-3">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-2 border-b-2 font-medium transition-all duration-150 ${
                tab === t.key
                  ? 'border-[#F26A1B] text-[#F26A1B] shadow-[0_2px_8px_rgba(242,106,27,0.4)]'
                  : 'border-transparent text-[#6F6863] hover:text-[#A09A96]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Scrollable content body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 text-sm space-y-6">
        {tab === 'breakdown' && (
          <div className="space-y-6">
            <section className="glass-card p-4">
              <h3 className="text-xs font-semibold text-[#6F6863] uppercase tracking-wider mb-3">
                Why this score
              </h3>
              {activeFactors.length === 0 ? (
                <p className="text-[#6F6863] text-sm">No active risk-drop factors on the current path.</p>
              ) : (
                <div className="space-y-3">
                  {activeFactors.map((f) => (
                    <div key={f.factor_id}>
                      <div className="flex items-baseline justify-between gap-3 text-xs">
                        <span className="text-white truncate font-medium" title={f.description}>
                          {f.description}
                        </span>
                        <span className="font-mono text-[#F26A1B] whitespace-nowrap font-semibold">
                          −{f.risk_drop.toFixed(1)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#F26A1B] to-[#FF7A2B]"
                          style={{
                            width: `${(f.risk_drop / maxDrop) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-3 text-[11px] text-[#6F6863] italic">
                Factors overlap — individual drops do not sum directly to total risk.
              </p>
            </section>

            <section className="glass-card p-4">
              <h3 className="text-xs font-semibold text-[#6F6863] uppercase tracking-wider mb-3">
                Top Attack Paths
              </h3>
              {topPaths.length === 0 ? (
                <p className="text-[#6F6863] text-sm">
                  No attack path reaches this asset for the selected persona.
                </p>
              ) : (
                <ol className="space-y-3">
                  {topPaths.map((p, idx) => (
                    <li
                      key={idx}
                      className={`p-3 rounded-xl border transition-all ${
                        idx === 0
                          ? 'bg-[#F26A1B]/10 border-[#F26A1B]/30'
                          : 'bg-white/[0.02] border-white/[0.06]'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        {p.path.map((step, sIdx) => (
                          <React.Fragment key={`${step}-${sIdx}`}>
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full border font-mono ${
                                idx === 0
                                  ? 'border-[#F26A1B]/40 bg-[#F26A1B]/20 text-white font-medium'
                                  : 'border-white/10 bg-white/[0.03] text-[#A09A96]'
                              }`}
                            >
                              {nameOf(step)}
                            </span>
                            {sIdx < p.path.length - 1 && (
                              <span className="text-[#6F6863] text-xs">→</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                      <div className="mt-2 text-xs font-mono text-[#6F6863]">
                        {Number.isFinite(p.probability) ? `p = ${(p.probability * 100).toFixed(2)}% · ` : ''}
                        {p.hop_count} hops
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        )}

        {tab === 'vulns' && (
          <div className="space-y-6">
            <section className="glass-card p-4">
              <h3 className="text-xs font-semibold text-[#6F6863] uppercase tracking-wider mb-3">CVEs</h3>
              {asset.cves.length === 0 ? (
                <p className="text-[#6F6863] text-sm">
                  {asset.default_credentials
                    ? 'No CVEs. Default administrative credentials are present.'
                    : 'No known CVEs for this product version.'}
                </p>
              ) : (
                <ul className="divide-y divide-white/[0.06]">
                  {asset.cves.map((cve) => {
                    const isBest = cve === asset.best_cve || asset.cves.length === 1;
                    const factor = allFactors.find((f) => f.factor_id === `cve_${cve}`);
                    return (
                      <li key={cve} className="py-2.5 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-white font-semibold">{cve}</span>
                          {isBest && asset.cvss != null && (
                            <span
                              className="text-[11px] font-mono font-semibold text-white rounded px-1.5 py-0.2"
                              style={{ backgroundColor: cvssColor(asset.cvss) }}
                            >
                              {asset.cvss.toFixed(1)}
                            </span>
                          )}
                          {isBest && asset.cisa_kev && (
                            <span className="text-xs bg-[#FF4D4F]/20 text-[#FF4D4F] border border-[#FF4D4F]/30 font-medium rounded px-1.5">
                              KEV
                            </span>
                          )}
                          {isBest && (
                            <span className="ml-auto text-xs font-mono text-[#A09A96]">
                              EPSS {(asset.epss * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-[#6F6863] truncate">
                          {factor && factor.risk_drop > 0
                            ? `Mitigation lowers risk by ${factor.risk_drop.toFixed(1)} pts`
                            : isBest
                            ? `${asset.vendor} ${asset.product} vulnerability`
                            : 'Secondary vulnerability on asset'}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {techniques.length > 0 && (
              <section className="glass-card p-4">
                <h3 className="text-xs font-semibold text-[#6F6863] uppercase tracking-wider mb-3">
                  ATT&amp;CK for ICS Techniques
                </h3>
                <ul className="space-y-2">
                  {techniques.map((t) => (
                    <li key={t} className="text-xs flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white/[0.02]">
                      <a
                        href={`https://attack.mitre.org/techniques/${t.replace('.', '/')}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[#F26A1B] hover:text-[#FF7A2B] hover:underline flex items-center gap-1 font-medium"
                      >
                        {t}
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                      <span className="text-[#A09A96] truncate max-w-[24ch]">{techniqueNames.get(t) ?? ''}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {tab === 'cascade' && (
          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold text-[#6F6863] uppercase tracking-wider mb-4">
              Physical Consequence Cascade
            </h3>
            {cascade.length <= 1 ? (
              <p className="text-[#6F6863] text-sm">
                This asset does not directly operate a municipal service node.
              </p>
            ) : (
              <ol className="relative pl-2">
                {cascade.map((c, idx) => {
                  const isService = c.node.type === 'service';
                  const last = idx === cascade.length - 1;
                  return (
                    <li key={c.id} className="relative pl-6 pb-5">
                      {!last && (
                        <span
                          className="absolute left-[3px] top-3 bottom-0 w-0.5 bg-white/[0.1]"
                        />
                      )}
                      <span
                        className="absolute left-0 top-1.5 w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                        style={{
                          backgroundColor:
                            idx === 0 ? band.color : isService ? 'var(--accent-primary)' : 'var(--node-stroke)',
                          color: idx === 0 ? band.color : isService ? 'var(--accent-primary)' : 'var(--node-stroke)',
                        }}
                      />
                      <div className="text-sm text-white font-medium">
                        {idx === 0 ? `${truncate(asset.name, 42)} compromised` : `${c.node.label} lost`}
                        <span className="ml-1.5 font-mono text-xs text-[#F26A1B]">
                          (t={c.t === 0 && idx === 0 ? '0' : `${c.t}h`})
                        </span>
                      </div>
                      {c.via && (
                        <div className="text-xs text-[#6F6863] font-mono mt-0.5">
                          failure_delay: {c.via.delay}h ({c.via.type} edge)
                        </div>
                      )}
                      {isService && (
                        <div className="text-xs text-[#A09A96] mt-0.5">
                          {c.node.people_served.toLocaleString()} people affected · safety severity {c.node.safety_severity}/4
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        )}

        {tab === 'anomaly' && (
          <div className="space-y-4">
            <div className="glass-card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-[#A09A96] font-mono">
                  Synthetic Telemetry
                </span>
                <span className="text-xs text-[#6F6863]">IsolationForest model</span>
              </div>
              <dl className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <dt className="text-xs text-[#6F6863]">Anomaly Score</dt>
                  <dd className="font-mono text-xl font-bold text-white mt-1">
                    {asset.anomaly_score.toFixed(2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#6F6863]">Threshold</dt>
                  <dd className="font-mono text-xl text-[#A09A96] mt-1">0.50</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#6F6863]">Alarm Status</dt>
                  <dd className="text-xs font-semibold mt-2">
                    {asset.anomaly_score >= 0.5 ? (
                      <span className="text-[#FF4D4F] px-2 py-0.5 rounded-full bg-[#FF4D4F]/20 border border-[#FF4D4F]/30">
                        Alarm Active
                      </span>
                    ) : (
                      <span className="text-[#3DDC97] px-2 py-0.5 rounded-full bg-[#3DDC97]/20 border border-[#3DDC97]/30">
                        Normal
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            {anomaly?.top_contributing_features && anomaly.top_contributing_features.length > 0 && (
              <div className="glass-card p-4">
                <h4 className="text-xs font-semibold text-[#6F6863] uppercase tracking-wider mb-2">
                  Top Contributing Features
                </h4>
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="text-[#6F6863] border-b border-white/[0.08]">
                      <th className="text-left font-medium py-1.5">Feature</th>
                      <th className="text-right font-medium py-1.5">Value</th>
                      <th className="text-right font-medium py-1.5">Baseline</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono divide-y divide-white/[0.04]">
                    {anomaly.top_contributing_features.map((f) => (
                      <tr key={f.feature}>
                        <td className="py-1.5 text-white">{f.feature}</td>
                        <td className="py-1.5 text-right text-[#FF7A2B]">{f.value.toLocaleString()}</td>
                        <td className="py-1.5 text-right text-[#6F6863]">
                          {f.baseline_mean.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="px-6 py-3.5 border-t border-white/[0.08] bg-[#120D0B] flex items-center justify-between text-xs">
        <button
          onClick={handleInject}
          disabled={injecting}
          className="px-3.5 py-1.5 rounded-full font-medium bg-gradient-to-r from-[#F26A1B] to-[#FF7A2B] text-white shadow-orange-glow-sm hover:shadow-orange-glow disabled:opacity-50 transition-all flex items-center gap-1.5 group"
        >
          <span>{injecting ? 'Injecting anomaly…' : 'Simulate anomaly burst'}</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
        <span className="text-[#6F6863] font-mono">Esc to close</span>
      </div>
    </aside>
  );
};
