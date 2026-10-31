import React, { useMemo, useState } from 'react';
import {
  AssetRiskResponse,
  RiskOverviewResponse,
  SimulationResponse,
  ThreatDropResponse,
} from '../types/api';
import { getRiskBand, purdueLabel } from '../tokens';
import { ScenarioMeta, whyFragment } from '../display';
import { Search } from 'lucide-react';

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
      {/* Threat Drop Alert Banner */}
      {threatDropActive && threatDropInfo && (
        <div className="glass-card bg-[#FF4D4F]/10 border-[#FF4D4F]/40 p-4 text-sm flex items-center gap-3.5 shadow-[0_0_25px_rgba(255,77,79,0.15)]">
          <span className="text-xs font-semibold text-[#FF4D4F] bg-[#FF4D4F]/20 border border-[#FF4D4F]/30 uppercase tracking-wider px-2.5 py-0.5 rounded-full shrink-0">
            What Changed
          </span>
          <span className="text-[#A09A96]">
            New KEV entry <span className="font-mono text-white font-medium">{threatDropInfo.cve_id}</span> (
            {threatDropInfo.vendor} {threatDropInfo.product}) —{' '}
            <span className="text-white font-medium">{threatDropInfo.affected_asset_name}</span>{' '}
            <span className="font-mono">
              {threatDropInfo.pre_drop_risk} →{' '}
              <span className="text-[#FF4D4F] font-bold">{threatDropInfo.post_drop_risk}</span>
            </span>
          </span>
        </div>
      )}

      {/* Metrics Summary Strip & Filter Input */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-[#A09A96]">
          <span className="text-white font-semibold">{summary.n}</span> assets scored
          <span className="mx-2 text-[#6F6863]">·</span>
          <span className="text-[#FF4D4F] font-semibold">{summary.critical}</span> critical
          <span className="mx-2 text-[#6F6863]">·</span>
          <span className="text-[#FF7A2B] font-semibold">{summary.high}</span> high
          <span className="mx-2 text-[#6F6863]">·</span>
          median risk:{' '}
          <span className="font-mono font-bold text-white">{summary.median.toFixed(1)}</span>
        </p>

        <div className="relative">
          <Search className="w-4 h-4 text-[#6F6863] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by asset or zone…"
            className="w-full sm:w-72 text-xs text-white bg-[#120D0B]/80 border border-white/10 rounded-full pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#F26A1B] focus:border-[#F26A1B] placeholder:text-[#6F6863] transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Glass Asset Risk Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/[0.08] text-xs font-semibold uppercase tracking-wider text-[#6F6863] bg-white/[0.01]">
                <th
                  className="px-5 py-3 cursor-pointer select-none hover:text-white transition-colors"
                  onClick={() => toggleSort('name')}
                >
                  Asset{sortMark('name')}
                </th>
                <th
                  className="px-5 py-3 w-40 cursor-pointer select-none hover:text-white transition-colors"
                  onClick={() => toggleSort('zone')}
                >
                  Zone{sortMark('zone')}
                </th>
                <th
                  className="px-5 py-3 w-28 cursor-pointer select-none hover:text-white transition-colors"
                  onClick={() => toggleSort('risk')}
                >
                  Risk{sortMark('risk')}
                </th>
                <th
                  className="px-5 py-3 w-20 text-center"
                  title="Change if the selected remediation plan is applied"
                >
                  Trend
                </th>
                <th className="px-5 py-3 w-[36%]">Why</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-[#6F6863]">
                    {assets.length === 0 ? 'No asset data available.' : 'No assets match this filter.'}
                  </td>
                </tr>
              )}
              {rows.map((a) => {
                const band = getRiskBand(a.risk_score);
                const delta = deltaMap.get(a.asset_id);
                const selected = selectedAssetId === a.asset_id;
                return (
                  <tr
                    key={a.asset_id}
                    onClick={() => onSelectAsset(a)}
                    className={`cursor-pointer transition-all duration-150 ${
                      selected
                        ? 'bg-[#F26A1B]/15 border-l-2 border-l-[#F26A1B] shadow-[inset_0_0_20px_rgba(242,106,27,0.1)]'
                        : 'hover:bg-white/[0.03] border-l-2 border-l-transparent'
                    }`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{a.name}</span>
                        {eolSet.has(a.asset_id) && (
                          <span
                            className="text-[11px] text-[#FFC24B] bg-[#FFC24B]/15 border border-[#FFC24B]/30 rounded-full px-2 py-0.5 font-medium"
                            title="Vendor end-of-life"
                          >
                            ⚠ EOL
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-[#A09A96] whitespace-nowrap font-mono">
                      {purdueLabel(a.purdue_level)}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap" title={`${band.label} risk`}>
                      <span className="inline-flex items-center gap-2.5">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]"
                          style={{ backgroundColor: band.color, color: band.color }}
                        />
                        <span className="font-mono text-sm font-bold text-white">
                          {a.risk_score.toFixed(1)}
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-sm text-center">
                      {delta === undefined || Math.abs(delta) < 0.05 ? (
                        <span className="text-[#6F6863]">—</span>
                      ) : delta < 0 ? (
                        <span className="text-[#3DDC97] font-semibold" title={`${delta.toFixed(1)} after plan`}>
                          ↓
                        </span>
                      ) : (
                        <span className="text-[#FF4D4F] font-semibold" title={`+${delta.toFixed(1)} after plan`}>
                          ↑
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm text-[#A09A96]">
                      <span className="block truncate max-w-[42ch]">{whyFragment(a)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
