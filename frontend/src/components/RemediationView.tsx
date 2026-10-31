import React, { useState } from 'react';
import {
  Wrench,
  TrendingDown,
  Flame,
  FileDown,
  CheckCircle2,
  Sliders,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  RemediationPlanResponse,
  SimulationResponse,
  ThreatDropResponse,
} from '../types/api';

interface RemediationViewProps {
  plan: RemediationPlanResponse | null;
  simulation: SimulationResponse | null;
  threatDropInfo: ThreatDropResponse | null;
  threatDropActive: boolean;
  engineerBudget: number;
  onBudgetChange: (budget: number) => void;
  onToggleAction: (actionId: string) => void;
  onToggleThreatDrop: () => void;
  onExportPdf: () => void;
  loading?: boolean;
}

export const RemediationView: React.FC<RemediationViewProps> = ({
  plan,
  simulation,
  threatDropInfo,
  threatDropActive,
  engineerBudget,
  onBudgetChange,
  onToggleAction,
  onToggleThreatDrop,
  onExportPdf,
  loading = false,
}) => {
  const [zeroDowntimeOnly, setZeroDowntimeOnly] = useState(false);

  if (loading && !plan) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-[#162032] rounded-xl border border-[#23324A]"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-[#162032] rounded-xl border border-[#23324A]"></div>
          <div className="h-96 bg-[#162032] rounded-xl border border-[#23324A]"></div>
        </div>
      </div>
    );
  }

  const actions = plan?.actions || [];
  const initialRisk = plan?.initial_aggregate_risk ?? 8.9;
  const projectedRisk = plan?.projected_aggregate_risk ?? 4.2;
  const reductionPct = plan?.risk_reduction_pct ?? 52.8;

  // Chart data comparing top assets before and after
  const chartData = (simulation?.asset_deltas || []).slice(0, 6).map((item) => ({
    name: item.name.length > 20 ? item.name.substring(0, 18) + '...' : item.name,
    Baseline: item.baseline_risk,
    Projected: item.new_risk,
    delta: item.delta_risk,
  }));

  const filteredActions = actions.filter((act) => {
    if (zeroDowntimeOnly && act.downtime_hours > 0) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Budget & Impact Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Budget Controller */}
        <div className="md:col-span-2 p-4 rounded-xl bg-[#162032] border border-[#23324A] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              Engineering Hours Budget
            </span>
            <span className="text-base font-black font-mono text-blue-400">
              {engineerBudget} <span className="text-xs text-slate-400 font-sans">Hours</span>
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="40"
            step="1"
            value={engineerBudget}
            onChange={(e) => onBudgetChange(Number(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={zeroDowntimeOnly}
                onChange={(e) => setZeroDowntimeOnly(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-0 cursor-pointer"
              />
              <span>Enforce Zero Process Downtime in OT</span>
            </label>
            <span>
              Used: <strong className="text-white font-mono">{plan?.used_engineer_hours ?? 0}h</strong> / {engineerBudget}h
            </span>
          </div>
        </div>

        {/* Aggregate Risk Delta Card */}
        <div className="p-4 rounded-xl bg-[#162032] border border-[#23324A] flex flex-col justify-between">
          <div className="text-xs text-slate-400 uppercase font-semibold">City-Wide Risk Reduction</div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black font-mono text-emerald-400">
              -{reductionPct}%
            </span>
            <span className="text-xs text-slate-300">
              ({initialRisk} → {projectedRisk})
            </span>
          </div>
          <div className="text-[11px] text-emerald-400/80 flex items-center gap-1 mt-1">
            <TrendingDown className="w-3.5 h-3.5" />
            Compensating controls protect OT availability
          </div>
        </div>

        {/* Downtime Impact Card */}
        <div className="p-4 rounded-xl bg-[#162032] border border-[#23324A] flex flex-col justify-between">
          <div className="text-xs text-slate-400 uppercase font-semibold">Scheduled Downtime</div>
          <div className="text-3xl font-black font-mono text-amber-400 mt-2">
            {plan?.total_downtime_hours ?? 0} <span className="text-xs text-slate-400 font-sans">Hours</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            IT reboots only; 0h disruption to water/power
          </div>
        </div>
      </div>

      {/* Main Grid: Action Matrix + What-If Delta Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Action Priority Matrix (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-400" />
              Prioritised Mitigation Plan ({filteredActions.filter((a) => a.selected).length} Selected)
            </h3>
            <span className="text-xs text-slate-400">Greedy knapsack ranked by ΔRisk / Cost</span>
          </div>

          <div className="space-y-2.5">
            {filteredActions.map((action, idx) => (
              <div
                key={action.id}
                onClick={() => onToggleAction(action.id)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                  action.selected
                    ? 'bg-[#111827] border-blue-500/60 shadow-lg'
                    : 'bg-[#111827]/40 border-[#23324A] opacity-60 hover:opacity-90'
                }`}
              >
                <div className="pt-0.5">
                  {action.selected ? (
                    <CheckCircle2 className="w-5 h-5 text-blue-400" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-600" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-xs flex items-center gap-2">
                      <span className="font-mono text-slate-500 text-[11px]">#{idx + 1}</span>
                      {action.asset_name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-950 border border-blue-500/30 text-blue-300">
                      {action.action_type.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    {action.description}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
                    <span>Labor: <strong className="text-white">{action.engineer_hours}h</strong></span>
                    <span>Downtime: <strong className={action.downtime_hours > 0 ? 'text-amber-400' : 'text-emerald-400'}>{action.downtime_hours}h</strong></span>
                    <span className="text-emerald-400 font-bold">ΔRisk: -{(action.risk_reduction * 100).toFixed(0)}%</span>
                    {!action.patchable_now && (
                      <span className="text-amber-300 text-[10px] font-sans">Compensating Control</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Chart + Live Demos (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Recharts What-If Comparison */}
          <div className="p-4 rounded-xl bg-[#162032] border border-[#23324A] space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              What-If Risk Score Comparison (Pre vs Post Mitigation)
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#64748B"
                    fontSize={10}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      fontSize: '11px',
                      color: '#F8FAFC',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="Baseline" fill="#EF4444" radius={[4, 4, 0, 0]} name="Baseline Risk" />
                  <Bar dataKey="Projected" fill="#10B981" radius={[4, 4, 0, 0]} name="Projected Risk" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Interactive Threat Drop Card */}
          <div
            className={`p-4 rounded-xl border transition ${
              threatDropActive
                ? 'bg-red-950/40 border-red-500'
                : 'bg-[#162032] border-[#23324A]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-300">
                <Flame className="w-4 h-4 text-red-400" />
                Live Demo: Zero-Day / KEV Threat Drop
              </div>
              <button
                onClick={onToggleThreatDrop}
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
                  threatDropActive
                    ? 'bg-red-600 text-white'
                    : 'bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-500/40'
                }`}
              >
                {threatDropActive ? 'Active (Revert)' : 'Trigger Drop'}
              </button>
            </div>

            <p className="text-xs text-slate-300 mt-2">
              Injects <strong>CVE-2023-6448</strong> (Unitronics Vision PLC default password vulnerability, CISA KEV BOD 22-01) into water infrastructure.
            </p>

            {threatDropInfo && (
              <div className="mt-3 p-2.5 rounded bg-[#0A0E17] border border-[#23324A] text-[11px] font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Asset:</span>
                  <span className="text-white font-bold">{threatDropInfo.affected_asset_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Risk Delta:</span>
                  <span className="text-red-400 font-bold">
                    {threatDropInfo.pre_drop_risk} → {threatDropInfo.post_drop_risk} (+{threatDropInfo.delta_risk})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* PDF Report Export Card */}
          <div className="p-4 rounded-xl bg-[#162032] border border-[#23324A] flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <FileDown className="w-4 h-4 text-emerald-400" />
                CERT-In Aligned Briefing PDF
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                1-page executive summary mapped to Smart City guidelines
              </p>
            </div>
            <button
              onClick={onExportPdf}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
