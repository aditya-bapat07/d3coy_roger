import React, { useState, useMemo } from 'react';
import {
  Search,
  Flame,
  Activity,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';
import { AssetRiskResponse, RiskOverviewResponse } from '../types/api';
import { PURDUE_ZONE_COLORS, SITE_COLORS, getRiskLevel } from '../tokens';

interface RiskTableViewProps {
  overview: RiskOverviewResponse | null;
  loading: boolean;
  onSelectAsset: (asset: AssetRiskResponse) => void;
  onInjectAnomaly?: (assetId: string) => Promise<void>;
}

export const RiskTableView: React.FC<RiskTableViewProps> = ({
  overview,
  loading,
  onSelectAsset,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedPurdue, setSelectedPurdue] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'risk' | 'likelihood' | 'consequence' | 'anomaly'>('risk');
  const [sortAsc, setSortAsc] = useState(false);

  const assets = overview?.assets || [];

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchSearch =
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.cves.some((c) => c.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchSite = selectedSite === 'all' || asset.site === selectedSite;
      const matchPurdue = selectedPurdue === 'all' || asset.purdue_level === selectedPurdue;

      return matchSearch && matchSite && matchPurdue;
    }).sort((a, b) => {
      let valA = a.risk_score;
      let valB = b.risk_score;

      if (sortBy === 'likelihood') {
        valA = a.likelihood_score;
        valB = b.likelihood_score;
      } else if (sortBy === 'consequence') {
        valA = a.consequence_score;
        valB = b.consequence_score;
      } else if (sortBy === 'anomaly') {
        valA = a.anomaly_score;
        valB = b.anomaly_score;
      }

      return sortAsc ? valA - valB : valB - valA;
    });
  }, [assets, searchTerm, selectedSite, selectedPurdue, sortBy, sortAsc]);

  const toggleSort = (field: 'risk' | 'likelihood' | 'consequence' | 'anomaly') => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        <div className="p-3.5 rounded-xl bg-[#162032] border border-[#23324A]">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Assets
          </div>
          <div className="text-2xl font-black font-mono text-white mt-1">
            {overview?.total_assets ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Navanagar CII Topology</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#450A0A]/40 border border-[#7F1D1D]">
          <div className="text-[11px] font-semibold text-red-400 uppercase tracking-wider flex items-center justify-between">
            Critical Risk <span>&gt;75</span>
          </div>
          <div className="text-2xl font-black font-mono text-red-300 mt-1">
            {overview?.critical_count ?? 0}
          </div>
          <div className="text-[11px] text-red-400/80 mt-0.5">Immediate intervention</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#7F1D1D]/30 border border-[#B91C1C]">
          <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider flex items-center justify-between">
            High Risk <span>51-75</span>
          </div>
          <div className="text-2xl font-black font-mono text-rose-300 mt-1">
            {overview?.high_count ?? 0}
          </div>
          <div className="text-[11px] text-rose-400/80 mt-0.5">Choke-point exposure</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#78350F]/30 border border-[#B45309]">
          <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center justify-between">
            Medium Risk <span>26-50</span>
          </div>
          <div className="text-2xl font-black font-mono text-amber-300 mt-1">
            {overview?.medium_count ?? 0}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-0.5">Scheduled patching</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#064E3B]/30 border border-[#047857]">
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            Low Risk <span>0-25</span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-300 mt-1">
            {overview?.low_count ?? 0}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-0.5">Isolated field devices</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#162032] border border-[#23324A]">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Average Risk
          </div>
          <div className="text-2xl font-black font-mono text-blue-300 mt-1">
            {overview?.average_risk ?? 0}{' '}
            <span className="text-xs text-slate-400 font-sans">
              (Max: {overview?.max_risk ?? 0})
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">City Aggregate Index</div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-3 rounded-xl bg-[#162032] border border-[#23324A] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search assets, vendors, products, or CVE IDs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111827] border border-[#23324A] rounded-lg pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Site Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Site:</span>
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="bg-[#111827] border border-[#23324A] text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Sites</option>
              <option value="power">Power</option>
              <option value="water">Water</option>
              <option value="hospital">Hospital</option>
              <option value="city">City Services</option>
              <option value="corporate">Corporate IT</option>
              <option value="vendor">Vendor Access</option>
            </select>
          </div>

          {/* Purdue Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Purdue Zone:</span>
            <select
              value={selectedPurdue}
              onChange={(e) => setSelectedPurdue(e.target.value)}
              className="bg-[#111827] border border-[#23324A] text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Zones</option>
              <option value="L4">L4 - Enterprise</option>
              <option value="L3.5">L3.5 - DMZ</option>
              <option value="L3">L3 - Operations</option>
              <option value="L2">L2 - Supervisory</option>
              <option value="L1">L1 - Basic Control</option>
              <option value="L0">L0 - Field / Physical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ranked Asset Risk Table */}
      <div className="rounded-xl border border-[#23324A] bg-[#111827] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#23324A] bg-[#162032] text-slate-400 uppercase font-semibold text-[11px]">
                <th className="py-3 px-3.5 w-12 text-center">#</th>
                <th className="py-3 px-3.5">Asset & Specification</th>
                <th className="py-3 px-3.5">Zone</th>
                <th className="py-3 px-3.5">Site</th>
                <th className="py-3 px-3.5">Threat Intel & Weaknesses</th>
                <th className="py-3 px-3.5 text-center">Confidence</th>
                <th
                  onClick={() => toggleSort('anomaly')}
                  className="py-3 px-3.5 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    ML Anomaly <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('likelihood')}
                  className="py-3 px-3.5 cursor-pointer hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    Likelihood (L) <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('consequence')}
                  className="py-3 px-3.5 cursor-pointer hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    Consequence (C) <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('risk')}
                  className="py-3 px-3.5 cursor-pointer hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    Risk (L×C×100) <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2C42]">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <Activity className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
                    Calculating risk matrices across Navanagar attack paths...
                  </td>
                </tr>
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400">
                    No assets matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset, index) => {
                  const riskLevel = getRiskLevel(asset.risk_score);
                  const purdueColor = PURDUE_ZONE_COLORS[asset.purdue_level] || '#94A3B8';
                  const siteCfg = SITE_COLORS[asset.site] || SITE_COLORS.corporate;

                  return (
                    <tr
                      key={asset.asset_id}
                      className="hover:bg-[#162032]/60 transition cursor-pointer group"
                      onClick={() => onSelectAsset(asset)}
                    >
                      {/* Rank Index */}
                      <td className="py-3 px-3.5 text-center font-mono text-slate-400 text-xs">
                        {index + 1}
                      </td>

                      {/* Name & Hardware Info */}
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-white group-hover:text-blue-300 transition flex items-center gap-1.5">
                          {asset.name}
                          {asset.is_choke_point && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-950 border border-purple-500/50 text-purple-300 font-normal">
                              Choke Point
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {asset.vendor} • {asset.product}
                        </div>
                      </td>

                      {/* Purdue Zone Badge */}
                      <td className="py-3 px-3.5">
                        <span
                          className="px-2 py-0.5 rounded font-mono text-[11px] font-bold"
                          style={{
                            backgroundColor: `${purdueColor}15`,
                            borderColor: `${purdueColor}50`,
                            color: purdueColor,
                            borderWidth: '1px',
                          }}
                        >
                          {asset.purdue_level}
                        </span>
                      </td>

                      {/* Site Badge */}
                      <td className="py-3 px-3.5">
                        <span
                          className="px-2 py-0.5 rounded text-[11px] capitalize font-medium"
                          style={{
                            backgroundColor: siteCfg.bg,
                            borderColor: siteCfg.border,
                            color: siteCfg.color,
                            borderWidth: '1px',
                          }}
                        >
                          {asset.site}
                        </span>
                      </td>

                      {/* Threat Intel Chips */}
                      <td className="py-3 px-3.5">
                        <div className="flex flex-wrap items-center gap-1">
                          {asset.cves.length > 0 ? (
                            <>
                              <span className="font-mono text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-500/30 text-[11px]">
                                {asset.best_cve || asset.cves[0]}
                              </span>
                              {asset.cisa_kev && (
                                <span className="bg-red-950 px-1.5 py-0.5 rounded border border-red-500/50 text-red-300 text-[10px] font-semibold flex items-center gap-0.5">
                                  <Flame className="w-2.5 h-2.5 text-red-400" /> KEV
                                </span>
                              )}
                              {asset.cves.length > 1 && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  +{asset.cves.length - 1} more
                                </span>
                              )}
                            </>
                          ) : asset.default_credentials ? (
                            <span className="text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-600/40 text-[10px]">
                              Default Credentials
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">No known CVE</span>
                          )}
                        </div>
                      </td>

                      {/* Confidence Rating Badge */}
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                            asset.confidence?.rating === 'High'
                              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                              : asset.confidence?.rating === 'Medium'
                              ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                              : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                          }`}
                          title={asset.confidence?.reasons?.join('\n')}
                        >
                          {asset.confidence?.rating ?? 'High'}
                        </span>
                      </td>

                      {/* Anomaly Bar */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                asset.anomaly_score > 0.7
                                  ? 'bg-amber-400'
                                  : asset.anomaly_score > 0.4
                                  ? 'bg-blue-400'
                                  : 'bg-slate-600'
                              }`}
                              style={{ width: `${Math.min(100, asset.anomaly_score * 100)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-slate-300">
                            {asset.anomaly_score.toFixed(2)}
                          </span>
                        </div>
                      </td>

                      {/* Likelihood */}
                      <td className="py-3 px-3.5 text-right font-mono font-medium text-slate-200">
                        {asset.likelihood_score.toFixed(2)}
                      </td>

                      {/* Consequence */}
                      <td className="py-3 px-3.5 text-right font-mono font-medium text-slate-200">
                        {asset.consequence_score.toFixed(2)}
                      </td>

                      {/* Risk Score */}
                      <td className="py-3 px-3.5 text-right">
                        <span
                          className="px-2.5 py-1 rounded-md font-mono text-xs font-bold"
                          style={{
                            backgroundColor: riskLevel.bgColor,
                            borderColor: riskLevel.borderColor,
                            color: riskLevel.color,
                            borderWidth: '1px',
                          }}
                        >
                          {asset.risk_score.toFixed(1)}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3.5 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAsset(asset);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Inspect deep-dive details"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
