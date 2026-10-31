import React, { useState } from 'react';
import {
  RemediationPlanResponse,
  SimulationResponse,
  ThreatDropResponse,
  AssetRiskResponse,
} from '../types/api';
import { ArrowDownRight, ChevronRight, ChevronDown } from 'lucide-react';

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
  assets?: AssetRiskResponse[];
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
  assets = [],
}) => {
  const [zeroDowntimeOnly, setZeroDowntimeOnly] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const actions = plan?.actions ?? [];
  const initialRisk = plan?.initial_aggregate_risk ?? simulation?.baseline_aggregate_risk ?? 8.9;
  const projectedRisk = plan?.projected_aggregate_risk ?? simulation?.new_aggregate_risk ?? 4.2;

  const assetMap = new Map(assets.map((a) => [a.asset_id, a]));
  const deltaMap = new Map((simulation?.asset_deltas ?? []).map((d) => [d.asset_id, d]));

  const filteredActions = actions.filter((act) => {
    if (zeroDowntimeOnly && act.downtime_hours > 0) return false;
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Top summary & budget strip */}
      <div className="glass-card p-5 flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-8">
          <div>
            <div className="text-xs text-[#6F6863] font-medium tracking-wide">Aggregate Risk (Before → After)</div>
            <div className="mt-1 flex items-baseline gap-2.5 font-mono">
              <span className="text-xl font-bold text-white">{initialRisk.toFixed(1)}</span>
              <span className="text-[#6F6863]">→</span>
              <span className="text-xl font-bold text-[#3DDC97] drop-shadow-[0_0_8px_rgba(61,220,151,0.4)]">
                {projectedRisk.toFixed(1)}
              </span>
              <span className="text-xs text-[#3DDC97] font-semibold flex items-center">
                <ArrowDownRight className="w-3.5 h-3.5" />
                {Math.max(0, initialRisk - projectedRisk).toFixed(1)} pts
              </span>
            </div>
          </div>

          <div className="hidden sm:block h-8 w-px bg-white/[0.08]" />

          <div>
            <div className="text-xs text-[#6F6863] font-medium tracking-wide">Scheduled Downtime</div>
            <div className="mt-1 font-mono text-base font-semibold text-white">
              {plan?.total_downtime_hours ?? 0}h{' '}
              <span className="font-sans font-normal text-xs text-[#6F6863]">(0h OT process loss)</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <label htmlFor="budget-slider" className="text-xs text-[#A09A96] whitespace-nowrap">
              Budget:{' '}
              <span className="font-mono font-bold text-white">
                {plan?.used_engineer_hours ?? 0}h / {engineerBudget}h
              </span>
            </label>
            <input
              id="budget-slider"
              type="range"
              min="0"
              max="40"
              step="1"
              value={engineerBudget}
              onChange={(e) => onBudgetChange(Number(e.target.value))}
              className="w-32 sm:w-40 accent-[#F26A1B] cursor-pointer"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-[#A09A96] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={zeroDowntimeOnly}
              onChange={(e) => setZeroDowntimeOnly(e.target.checked)}
              className="rounded border-white/20 bg-[#120D0B] text-[#F26A1B] focus:ring-[#F26A1B] focus:ring-offset-0 cursor-pointer"
            />
            <span>Zero OT downtime only</span>
          </label>
        </div>
      </div>

      {/* Ordered list of fixes */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-3 flex items-center justify-between text-xs text-[#6F6863] border-b border-white/[0.08] bg-white/[0.01]">
          <span className="font-semibold uppercase tracking-wider text-white">
            Prioritised Remediation Actions ({filteredActions.filter((a) => a.selected).length} active)
          </span>
          <span className="hidden sm:inline">Ranked by risk reduction per engineer-hour</span>
        </div>

        {filteredActions.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[#6F6863]">
            No remediation actions match the current constraints.
          </div>
        ) : (
          <ol className="divide-y divide-white/[0.04]">
            {filteredActions.map((action, idx) => {
              const isExpanded = expandedIds.has(action.id);
              const assetObj = assetMap.get(action.asset_id);
              const assetDelta = deltaMap.get(action.asset_id);
              const baseScore = assetObj?.risk_score ?? assetDelta?.baseline_risk ?? 60;
              const pointDrop = Math.max(
                0,
                Math.round(
                  assetDelta && action.selected
                    ? Math.abs(assetDelta.delta_risk)
                    : baseScore * action.risk_reduction
                )
              );
              const cves = assetObj?.cves ?? [];

              return (
                <li key={action.id} className="px-5 py-3.5 transition-colors duration-150 hover:bg-white/[0.02]">
                  <div className="flex items-center justify-between gap-4">
                    <div
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer select-none"
                      onClick={() => toggleExpand(action.id)}
                    >
                      <span className="font-mono text-xs text-[#6F6863] w-5">{idx + 1}.</span>
                      <span className="text-sm font-medium text-white truncate">{action.description}</span>
                      <span className="text-xs text-[#6F6863] whitespace-nowrap">({action.asset_name})</span>
                      <span className="text-xs text-[#6F6863]">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 inline" /> : <ChevronRight className="w-3.5 h-3.5 inline" />}
                      </span>
                    </div>

                    <div className="flex items-center gap-5 shrink-0">
                      <span className="text-sm font-mono text-[#3DDC97] font-semibold whitespace-nowrap">
                        ↓{pointDrop} pts
                      </span>

                      <label
                        className="inline-flex items-center gap-2.5 cursor-pointer select-none"
                        title="Apply fix in simulation"
                      >
                        <span className="text-xs text-[#6F6863] hidden sm:inline">Apply</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={action.selected}
                          onClick={() => onToggleAction(action.id)}
                          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border border-transparent transition-all duration-200 ${
                            action.selected
                              ? 'bg-gradient-to-r from-[#F26A1B] to-[#FF7A2B] shadow-[0_0_12px_rgba(242,106,27,0.5)]'
                              : 'bg-white/10 hover:bg-white/15'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 mt-0.5 ${
                              action.selected ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </label>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pl-8 pr-3 py-3 bg-[#120D0B]/80 rounded-xl border border-white/[0.06] text-xs text-[#A09A96] grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <div className="text-[#6F6863] text-[11px]">Mitigation ID</div>
                        <div className="font-mono text-white mt-0.5 font-medium">
                          {action.id} · {action.action_type.toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#6F6863] text-[11px]">CVE / Advisory</div>
                        <div className="font-mono text-white mt-0.5">
                          {cves.length > 0 ? cves.join(', ') : 'Config / Architecture'}
                          {assetObj?.cisa_kev ? ' (CISA KEV)' : ''}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#6F6863] text-[11px]">Cost Estimate</div>
                        <div className="font-mono text-white mt-0.5">
                          {action.engineer_hours}h labor · {action.downtime_hours}h downtime
                        </div>
                      </div>
                      <div>
                        <div className="text-[#6F6863] text-[11px]">OT Window</div>
                        <div className="text-white mt-0.5">
                          {action.patchable_now
                            ? 'Immediate online change'
                            : `Compensating control (next window ${assetObj?.next_maintenance_window_days ?? 30}d)`}
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Compact Threat-Drop Simulation Row */}
      <div className="glass-card p-5 flex flex-wrap items-center justify-between gap-4 text-sm">
        <div className="space-y-1">
          <div className="font-semibold text-white flex items-center gap-2">
            <span>Incoming Threat Drop Simulation</span>
            {threatDropInfo && (
              <span className="font-mono text-xs text-[#6F6863]">
                ({threatDropInfo.cve_id} · {threatDropInfo.vendor} {threatDropInfo.product})
              </span>
            )}
          </div>
          {threatDropInfo && (
            <div className="text-xs text-[#A09A96]">
              Target: <span className="text-white font-medium">{threatDropInfo.affected_asset_name}</span> · Risk before/after drop:{' '}
              <span className="font-mono text-white">{threatDropInfo.pre_drop_risk}</span>
              {' → '}
              <span className="font-mono font-bold text-[#FF4D4F] drop-shadow-[0_0_8px_rgba(255,77,79,0.3)]">
                {threatDropInfo.post_drop_risk}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleThreatDrop}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
            threatDropActive
              ? 'bg-[#FF4D4F]/20 text-[#FF4D4F] border border-[#FF4D4F]/40 shadow-[0_0_15px_rgba(255,77,79,0.25)] hover:bg-[#FF4D4F]/30'
              : 'glass-pill text-white hover:border-[#F26A1B]/50 hover:bg-[#F26A1B]/10'
          }`}
        >
          {threatDropActive ? 'Revert Threat Drop' : 'Trigger Threat Drop'}
        </button>
      </div>
    </div>
  );
};
