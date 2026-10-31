import React, { useState } from 'react';
import {
  RemediationPlanResponse,
  SimulationResponse,
  ThreatDropResponse,
  AssetRiskResponse,
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
      <div className="bg-white border border-[--border-default] rounded-lg p-4 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-xs text-ink-secondary">Aggregate Risk (Before → After)</div>
            <div className="mt-0.5 flex items-baseline gap-2 font-mono">
              <span className="text-lg font-semibold text-ink">{initialRisk.toFixed(1)}</span>
              <span className="text-ink-tertiary">→</span>
              <span className="text-lg font-semibold text-risk-low">{projectedRisk.toFixed(1)}</span>
              <span className="text-xs text-risk-low">
                (↓{Math.max(0, initialRisk - projectedRisk).toFixed(1)} pts)
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-[--border-default]" />

          <div>
            <div className="text-xs text-ink-secondary">Scheduled Downtime</div>
            <div className="mt-0.5 font-mono text-sm font-semibold text-ink">
              {plan?.total_downtime_hours ?? 0}h{' '}
              <span className="font-sans font-normal text-xs text-ink-tertiary">(0h OT process loss)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <label htmlFor="budget-slider" className="text-xs text-ink-secondary whitespace-nowrap">
              Budget:{' '}
              <span className="font-mono font-semibold text-ink">
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
              className="w-36 accent-[--accent-primary] cursor-pointer"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-ink-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={zeroDowntimeOnly}
              onChange={(e) => setZeroDowntimeOnly(e.target.checked)}
              className="rounded border-[--border-default] text-[--accent-primary] focus:ring-0"
            />
            <span>Zero OT downtime only</span>
          </label>
        </div>
      </div>

      {/* Ordered list of fixes */}
      <div className="bg-white border border-[--border-default] rounded-lg divide-y divide-[--border-subtle]">
        <div className="px-4 py-2.5 flex items-center justify-between text-xs text-ink-secondary bg-canvas-secondary/60">
          <span className="font-medium uppercase tracking-wide">
            Prioritised Remediation Actions ({filteredActions.filter((a) => a.selected).length} active)
          </span>
          <span>Ranked by risk reduction per engineer-hour</span>
        </div>

        {filteredActions.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-ink-tertiary">
            No remediation actions match the current constraints.
          </div>
        ) : (
          <ol className="divide-y divide-[--border-subtle]">
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
                <li key={action.id} className="px-4 py-3 transition-colors duration-150 hover:bg-canvas-secondary/40">
                  <div className="flex items-center justify-between gap-4">
                    <div
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      onClick={() => toggleExpand(action.id)}
                    >
                      <span className="font-mono text-xs text-ink-tertiary w-5">{idx + 1}.</span>
                      <span className="text-sm font-medium text-ink truncate">{action.description}</span>
                      <span className="text-xs text-ink-secondary whitespace-nowrap">({action.asset_name})</span>
                      <span className="text-xs text-ink-tertiary">{isExpanded ? '▾' : '▸'}</span>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-sm font-mono text-risk-low whitespace-nowrap">
                        ↓{pointDrop} points
                      </span>

                      <label
                        className="inline-flex items-center gap-2 cursor-pointer select-none"
                        title="Apply fix in simulation"
                      >
                        <span className="text-xs text-ink-secondary">Apply fix</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={action.selected}
                          onClick={() => onToggleAction(action.id)}
                          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border border-transparent transition-colors duration-150 ${
                            action.selected ? 'bg-[--accent-primary]' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-150 ${
                              action.selected ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </label>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-2.5 pl-8 pr-2 py-2 bg-canvas-secondary/60 rounded border border-[--border-subtle] text-xs text-ink-secondary grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <div className="text-ink-tertiary">Mitigation ID</div>
                        <div className="font-mono text-ink mt-0.5">
                          {action.id} · {action.action_type.toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div className="text-ink-tertiary">CVE / Advisory</div>
                        <div className="font-mono text-ink mt-0.5">
                          {cves.length > 0 ? cves.join(', ') : 'Config / Architecture'}
                          {assetObj?.cisa_kev ? ' (CISA KEV)' : ''}
                        </div>
                      </div>
                      <div>
                        <div className="text-ink-tertiary">Cost Estimate</div>
                        <div className="font-mono text-ink mt-0.5">
                          {action.engineer_hours}h labor · {action.downtime_hours}h downtime
                        </div>
                      </div>
                      <div>
                        <div className="text-ink-tertiary">OT Window</div>
                        <div className="text-ink mt-0.5">
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
      <div className="bg-white border border-[--border-default] rounded-lg p-4 flex flex-wrap items-center justify-between gap-4 text-sm">
        <div className="space-y-0.5">
          <div className="font-medium text-ink flex items-center gap-2">
            <span>Incoming Threat Drop Simulation</span>
            {threatDropInfo && (
              <span className="font-mono text-xs text-ink-secondary">
                ({threatDropInfo.cve_id} · {threatDropInfo.vendor} {threatDropInfo.product})
              </span>
            )}
          </div>
          {threatDropInfo && (
            <div className="text-xs text-ink-secondary">
              Target: <span className="text-ink">{threatDropInfo.affected_asset_name}</span> · Risk before/after drop:{' '}
              <span className="font-mono text-ink">{threatDropInfo.pre_drop_risk}</span>
              {' → '}
              <span className="font-mono font-semibold text-risk-critical">{threatDropInfo.post_drop_risk}</span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleThreatDrop}
          className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors duration-150 ${
            threatDropActive
              ? 'border-risk-critical text-risk-critical bg-red-50'
              : 'border-[--border-default] text-ink hover:bg-canvas-secondary'
          }`}
        >
          {threatDropActive ? 'Revert Threat Drop' : 'Trigger Threat Drop'}
        </button>
      </div>
    </div>
  );
};
