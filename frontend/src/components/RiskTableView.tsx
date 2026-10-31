import React, { useMemo, useState } from 'react';
import {
  AssetRiskResponse,
  RiskOverviewResponse,
  SimulationResponse,
  ThreatDropResponse,
} from '../types/api';
import { getRiskBand, purdueLabel } from '../tokens';
import { ScenarioMeta, whyFragment } from '../display';

interface RiskTableViewProps {
  overview: RiskOverviewResponse | null;
  loading: boolean;
  onSelectAsset: (asset: AssetRiskResponse) => void;
  onInjectAnomaly?: (assetId: string) => Promise<void>;
  selectedAssetId?: string | null;
  simulation?: SimulationResponse | null;
  scenarioMeta?: ScenarioMeta | null;
  threatDropActive?: boolean;
  threatDropInfo?: ThreatDropResponse | null;
}

type SortKey = 'name' | 'zone' | 'risk';

const ZONE_ORDER = ['INTERNET', 'L4', 'L3.5', 'L3', 'L2', 'L1', 'L0'];

export const RiskTableView: React.FC<RiskTableViewProps> = ({
  overview,
  loading,
  onSelectAsset,
  selectedAssetId,
  simulation,
  scenarioMeta,
  threatDropActive,
  threatDropInfo,
}) => {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('risk');
  const [sortAsc, setSortAsc] = useState(false);

  const assets = overview?.assets ?? [];

  const eolSet = useMemo(
    () => new Set((scenarioMeta?.assets ?? []).filter((a) => a.end_of_life).map((a) => a.id)),
    [scenarioMeta]
  );

  const deltaMap = useMemo(() => {
    const m = new Map<string, number>();
    if (simulation && simulation.applied_actions_count > 0) {
      simulation.asset_deltas.forEach((d) => m.set(d.asset_id, d.delta_risk));
    }
    return m;
  }, [simulation]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = assets.filter((a) => {
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.purdue_level.toLowerCase().includes(q) ||
        purdueLabel(a.purdue_level).toLowerCase().includes(q)
      );
    });
    const dir = sortAsc ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name) * dir;
      if (sortKey === 'zone')
        return (ZONE_ORDER.indexOf(a.purdue_level) - ZONE_ORDER.indexOf(b.purdue_level)) * dir;
      return (a.risk_score - b.risk_score) * dir;
    });
  }, [assets, query, sortKey, sortAsc]);

  const summary = useMemo(() => {
    const scores = assets.map((a) => a.risk_score).sort((x, y) => x - y);
    const mid = Math.floor(scores.length / 2);
    const median =
      scores.length === 0 ? 0 : scores.length % 2 ? scores[mid] : (scores[mid - 1] + scores[mid]) / 2;
    return {
      n: assets.length,
      critical: assets.filter((a) => getRiskBand(a.risk_score).key === 'critical').length,
      high: assets.filter((a) => getRiskBand(a.risk_score).key === 'high').length,
      median,
    };
  }, [assets]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(key !== 'risk');
    }
  };

  const sortMark = (key: SortKey) => (sortKey === key ? (sortAsc ? ' ↑' : ' ↓') : '');

  return (
    <div className="space-y-4">
      {threatDropActive && threatDropInfo && (
        <div className="bg-white border border-[--border-default] rounded-lg px-4 py-2.5 text-sm flex items-center gap-3">
          <span className="text-xs font-medium text-[--risk-critical] uppercase tracking-wide">What changed</span>
          <span className="text-[--text-secondary]">
            New KEV entry <span className="font-mono text-[--text-primary]">{threatDropInfo.cve_id}</span> (
            {threatDropInfo.vendor} {threatDropInfo.product}) —{' '}
            <span className="text-[--text-primary]">{threatDropInfo.affected_asset_name}</span>{' '}
            <span className="font-mono">
              {threatDropInfo.pre_drop_risk} →{' '}
              <span className="text-[--risk-critical] font-semibold">{threatDropInfo.post_drop_risk}</span>
            </span>
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-[--text-secondary]">
          <span className="text-[--text-primary] font-medium">{summary.n}</span> assets scored
          <span className="mx-2 text-[--text-tertiary]">·</span>
          <span className="text-[--text-primary] font-medium">{summary.critical}</span> critical
          <span className="mx-2 text-[--text-tertiary]">·</span>
          <span className="text-[--text-primary] font-medium">{summary.high}</span> high
          <span className="mx-2 text-[--text-tertiary]">·</span>
          median risk: <span className="font-mono text-[--text-primary]">{summary.median.toFixed(1)}</span>
        </p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by asset or zone"
          className="w-64 text-sm px-2.5 py-1.5 bg-white border border-[--border-default] rounded focus:outline-none focus:border-[--accent-primary] placeholder:text-[--text-tertiary]"
        />
      </div>

      <div className="bg-white border border-[--border-default] rounded-lg overflow-hidden">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[--border-default] text-xs text-[--text-secondary]">
              <th
                className="font-medium px-4 py-2.5 cursor-pointer select-none hover:text-[--text-primary]"
                onClick={() => toggleSort('name')}
              >
                Asset{sortMark('name')}
              </th>
              <th
                className="font-medium px-4 py-2.5 w-36 cursor-pointer select-none hover:text-[--text-primary]"
                onClick={() => toggleSort('zone')}
              >
                Zone{sortMark('zone')}
              </th>
              <th
                className="font-medium px-4 py-2.5 w-24 cursor-pointer select-none hover:text-[--text-primary]"
                onClick={() => toggleSort('risk')}
              >
                Risk{sortMark('risk')}
              </th>
              <th className="font-medium px-4 py-2.5 w-16" title="Change if the selected remediation plan is applied">
                Trend
              </th>
              <th className="font-medium px-4 py-2.5 w-[34%]">Why</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-[--text-tertiary]">
                  {assets.length === 0 ? 'No asset data available.' : 'No assets match this filter.'}
                </td>
              </tr>
            )}
            {rows.map((a, i) => {
              const band = getRiskBand(a.risk_score);
              const delta = deltaMap.get(a.asset_id);
              const selected = selectedAssetId === a.asset_id;
              return (
                <tr
                  key={a.asset_id}
                  onClick={() => onSelectAsset(a)}
                  className={`cursor-pointer border-b border-[--border-subtle] last:border-b-0 transition-colors duration-150 ${
                    selected
                      ? 'bg-blue-50'
                      : i % 2 === 1
                      ? 'bg-[--bg-secondary] hover:bg-gray-200/60'
                      : 'bg-white hover:bg-[--bg-secondary]'
                  }`}
                  style={selected ? { boxShadow: 'inset 2px 0 0 var(--accent-primary)' } : undefined}
                >
                  <td className="px-4 py-2.5">
                    <span className="text-sm font-medium text-[--text-primary]">{a.name}</span>
                    {eolSet.has(a.asset_id) && (
                      <span
                        className="ml-2 text-xs text-amber-700 bg-amber-50 rounded px-1"
                        title="Vendor end-of-life"
                      >
                        ⚠ EOL
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[--text-secondary] whitespace-nowrap">
                    {purdueLabel(a.purdue_level)}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap" title={`${band.label} risk`}>
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: band.color }}
                      />
                      <span className="font-mono text-sm font-semibold text-[--text-primary]">
                        {a.risk_score.toFixed(1)}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-sm">
                    {delta === undefined || Math.abs(delta) < 0.05 ? (
                      <span className="text-[--text-tertiary]">—</span>
                    ) : delta < 0 ? (
                      <span className="text-[--risk-low]" title={`${delta.toFixed(1)} after plan`}>
                        ↓
                      </span>
                    ) : (
                      <span className="text-[--risk-critical]" title={`+${delta.toFixed(1)} after plan`}>
                        ↑
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-[--text-secondary]">
                    <span className="block truncate max-w-[40ch]">{whyFragment(a)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
