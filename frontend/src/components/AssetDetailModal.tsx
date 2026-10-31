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
      className="panel-slide-in fixed top-12 right-0 bottom-0 z-30 w-[480px] bg-white border-l border-[--border-default] flex flex-col"
      style={{ boxShadow: '-4px 0 24px rgba(0,0,0,0.08)' }}
    >
      {/* Sticky header */}
      <div className="px-5 pt-4 pb-3 border-b border-[--border-default] bg-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-[--text-primary] leading-snug">{asset.name}</h2>
              <span className="text-xs px-1.5 py-0.5 rounded border border-[--border-default] bg-[--bg-secondary] text-[--text-secondary]">
                {purdueLabel(asset.purdue_level)}
              </span>
            </div>
            <div className="mt-0.5 text-xs text-[--text-secondary] truncate">
              {asset.vendor} · {asset.product} ({asset.version})
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="text-2xl leading-none text-[--text-secondary] hover:text-[--text-primary] transition-colors duration-150"
          >
            ×
          </button>
        </div>

        <div className="mt-3 flex items-center gap-4">
          <span className="font-mono font-bold" style={{ fontSize: 32, lineHeight: 1, color: band.color }}>
            {asset.risk_score.toFixed(1)}
          </span>
          <div>
            <div className="w-[120px] h-1.5 rounded-full bg-[--bg-secondary] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(100, asset.risk_score)}%`, backgroundColor: band.color }}
              />
            </div>
            <div className="mt-1 text-xs text-[--text-secondary]">
              {band.label} risk · L {asset.likelihood_score.toFixed(2)} × C {asset.consequence_score.toFixed(2)}
            </div>
          </div>
        </div>

        {confidence && (
          <div className="mt-2.5">
            <div className="flex items-center gap-1.5 text-xs text-[--text-primary]">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CONFIDENCE_DOT[confidence.rating] }} />
              <span className="font-medium">{confidence.rating} confidence</span>
            </div>
            {confidence.rating !== 'High' && confidence.reasons[0] && (
              <p className="mt-0.5 text-xs text-[--text-secondary]">{confidence.reasons[0]}</p>
            )}
          </div>
        )}

        <nav className="mt-3.5 -mb-3 flex gap-5 text-sm">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-2 border-b-2 transition-colors duration-150 ${
                tab === t.key
                  ? 'border-[--accent-primary] text-[--text-primary] font-medium'
                  : 'border-transparent text-[--text-secondary] hover:text-[--text-primary]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 text-sm bg-white">
        {tab === 'breakdown' && (
          <div className="space-y-5">
            <section>
              <h3 className="text-xs font-medium text-[--text-secondary] uppercase tracking-wide mb-2">
                Why this score
              </h3>
              {activeFactors.length === 0 ? (
                <p className="text-[--text-tertiary] text-sm">No active risk-drop factors on the current path.</p>
              ) : (
                <div className="space-y-2">
                  {activeFactors.map((f) => (
                    <div key={f.factor_id}>
                      <div className="flex items-baseline justify-between gap-3 text-xs">
                        <span className="text-[--text-primary] truncate" title={f.description}>
                          {f.description}
                        </span>
                        <span className="font-mono text-[--text-secondary] whitespace-nowrap">
                          −{f.risk_drop.toFixed(1)}
                        </span>
                      </div>
                      <div
                        className="mt-1 h-2 rounded-sm"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          backgroundImage:
                            'repeating-linear-gradient(to right, var(--border-default) 0, var(--border-default) 1px, transparent 1px, transparent 25%)',
                        }}
                      >
                        <div
                          className="h-full rounded-sm"
                          style={{
                            width: `${(f.risk_drop / maxDrop) * 100}%`,
                            backgroundColor: 'var(--accent-primary)',
                            opacity: 0.8,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-2.5 text-xs text-[--text-tertiary] italic" title={asset.risk_drop_if_removed?.note}>
                Factors overlap — drops don&apos;t sum to total risk.
              </p>
            </section>

            <section>
              <h3 className="text-xs font-medium text-[--text-secondary] uppercase tracking-wide mb-2">
                Top Attack Paths
              </h3>
              {topPaths.length === 0 ? (
                <p className="text-[--text-tertiary] text-sm">
                  No attack path reaches this asset for the selected persona.
                </p>
              ) : (
                <ol className="space-y-2.5">
                  {topPaths.map((p, idx) => (
                    <li
                      key={idx}
                      className={idx === 0 ? 'text-[--text-primary] font-semibold' : 'text-[--text-secondary]'}
                    >
                      <div className="flex flex-wrap items-center gap-1">
                        {p.path.map((step, sIdx) => (
                          <React.Fragment key={`${step}-${sIdx}`}>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full border ${
                                idx === 0
                                  ? 'border-blue-300 bg-blue-50 text-[--text-primary]'
                                  : 'border-[--border-default] bg-[--bg-secondary] text-[--text-secondary]'
                              }`}
                            >
                              {nameOf(step)}
                            </span>
                            {sIdx < p.path.length - 1 && (
                              <span className="text-[--text-tertiary] text-xs">→</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                      <div className="mt-0.5 text-xs font-normal text-[--text-tertiary] font-mono">
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
            <section>
              <h3 className="text-xs font-medium text-[--text-secondary] uppercase tracking-wide mb-2">CVEs</h3>
              {asset.cves.length === 0 ? (
                <p className="text-[--text-tertiary] text-sm">
                  {asset.default_credentials
                    ? 'No CVEs. Default administrative credentials are present.'
                    : 'No known CVEs for this product version.'}
                </p>
              ) : (
                <ul className="divide-y divide-[--border-subtle] border-y border-[--border-subtle]">
                  {asset.cves.map((cve) => {
                    const isBest = cve === asset.best_cve || asset.cves.length === 1;
                    const factor = allFactors.find((f) => f.factor_id === `cve_${cve}`);
                    return (
                      <li key={cve} className="py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[--text-primary]">{cve}</span>
                          {isBest && asset.cvss != null && (
                            <span
                              className="text-[11px] font-mono font-semibold text-white rounded px-1"
                              style={{ backgroundColor: cvssColor(asset.cvss) }}
                            >
                              {asset.cvss.toFixed(1)}
                            </span>
                          )}
                          {isBest && asset.cisa_kev && (
                            <span className="text-xs bg-red-50 text-red-700 rounded px-1">KEV</span>
                          )}
                          {isBest && (
                            <span className="ml-auto text-xs text-[--text-secondary]">
                              EPSS {(asset.epss * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-[--text-secondary] truncate">
                          {factor && factor.risk_drop > 0
                            ? `Removing it lowers risk by ${factor.risk_drop.toFixed(1)}`
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
              <section>
                <h3 className="text-xs font-medium text-[--text-secondary] uppercase tracking-wide mb-2">
                  ATT&amp;CK for ICS Techniques
                </h3>
                <ul className="space-y-1">
                  {techniques.map((t) => (
                    <li key={t} className="text-xs flex gap-2">
                      <a
                        href={`https://attack.mitre.org/techniques/${t.replace('.', '/')}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[--accent-primary] hover:text-[--accent-hover] hover:underline"
                      >
                        {t}
                      </a>
                      <span className="text-[--text-secondary]">{techniqueNames.get(t) ?? ''}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {tab === 'cascade' && (
          <div>
            {cascade.length <= 1 ? (
              <p className="text-[--text-tertiary] text-sm">
                This asset does not directly operate a municipal service node.
              </p>
            ) : (
              <ol className="relative">
                {cascade.map((c, idx) => {
                  const isService = c.node.type === 'service';
                  const last = idx === cascade.length - 1;
                  return (
                    <li key={c.id} className="relative pl-6 pb-4">
                      {!last && (
                        <span
                          className="absolute left-[3px] top-3 bottom-0 w-0.5"
                          style={{ backgroundColor: 'var(--border-default)' }}
                        />
                      )}
                      <span
                        className="absolute left-0 top-1.5 w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            idx === 0 ? band.color : isService ? 'var(--accent-primary)' : 'var(--node-stroke)',
                        }}
                      />
                      <div className="text-sm text-[--text-primary]">
                        {idx === 0 ? `${truncate(asset.name, 42)} compromised` : `${c.node.label} lost`}
                        <span className="ml-1 font-mono text-xs text-[--text-secondary]">
                          (t={c.t === 0 && idx === 0 ? '0' : `${c.t}h`})
                        </span>
                      </div>
                      {c.via && (
                        <div className="text-xs text-[--text-tertiary] font-mono">
                          failure_delay: {c.via.delay}h ({c.via.type} edge)
                        </div>
                      )}
                      {isService && (
                        <div className="text-xs text-[--text-secondary]">
                          {c.node.people_served.toLocaleString()} people affected · safety {c.node.safety_severity}/4
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
            <div className="flex items-center gap-2">
              <span className="text-xs px-1.5 py-0.5 rounded border border-[--border-default] bg-[--bg-secondary] text-[--text-secondary]">
                Synthetic data
              </span>
              <span className="text-xs text-[--text-tertiary]">IsolationForest network flow telemetry</span>
            </div>
            <dl className="grid grid-cols-3 gap-3">
              <div>
                <dt className="text-xs text-[--text-secondary]">Anomaly Score</dt>
                <dd className="font-mono text-lg font-semibold text-[--text-primary]">
                  {asset.anomaly_score.toFixed(2)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[--text-secondary]">Threshold</dt>
                <dd className="font-mono text-lg text-[--text-primary]">0.50</dd>
              </div>
              <div>
                <dt className="text-xs text-[--text-secondary]">Alarm Status</dt>
                <dd className="text-sm font-medium mt-1">
                  {asset.anomaly_score >= 0.5 ? (
                    <span className="text-[--risk-critical]">Alarm active</span>
                  ) : (
                    <span className="text-[--risk-low]">Normal</span>
                  )}
                </dd>
              </div>
            </dl>
            {anomaly?.top_contributing_features && anomaly.top_contributing_features.length > 0 && (
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="text-[--text-secondary] border-b border-[--border-default]">
                    <th className="text-left font-medium py-1">Feature</th>
                    <th className="text-right font-medium py-1">Value</th>
                    <th className="text-right font-medium py-1">Baseline</th>
                  </tr>
                </thead>
                <tbody>
                  {anomaly.top_contributing_features.map((f) => (
                    <tr key={f.feature} className="border-b border-[--border-subtle]">
                      <td className="py-1 font-mono">{f.feature}</td>
                      <td className="py-1 text-right font-mono">{f.value.toLocaleString()}</td>
                      <td className="py-1 text-right font-mono text-[--text-secondary]">
                        {f.baseline_mean.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <div className="px-5 py-2.5 border-t border-[--border-default] bg-white flex items-center justify-between text-xs">
        <button
          onClick={handleInject}
          disabled={injecting}
          className="text-[--accent-primary] hover:text-[--accent-hover] disabled:text-[--text-tertiary] transition-colors duration-150"
        >
          {injecting ? 'Injecting anomaly…' : 'Simulate anomaly burst'}
        </button>
        <span className="text-[--text-tertiary]">Esc to close</span>
      </div>
    </aside>
  );
};
