import React, { useState } from 'react';
import {
  RemediationPlanResponse,
  SimulationResponse,
  ThreatDropResponse,
  AssetRiskResponse,
} from '../types/api';
import { ArrowDownRight, ChevronRight, ChevronDown, Terminal, Copy, Check, ShieldCheck, Zap, Droplets } from 'lucide-react';

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
  const [activeSnippetTab, setActiveSnippetTab] = useState<Record<string, 'cisco_acl' | 'fortigate_cli' | 'iptables' | 'suricata_rule'>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const handleCopySnippet = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top summary & budget strip */}
      <div className="glass-card p-5 flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-7">
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
            <div className="text-xs text-[#6F6863] font-medium tracking-wide">Adversary Work Factor</div>
            <div className="mt-1 flex items-baseline gap-2 font-mono">
              <span className="text-xl font-bold text-[#F26A1B] drop-shadow-[0_0_8px_rgba(242,106,27,0.4)]">
                42x
              </span>
              <span className="text-xs text-[#A09A96] font-sans">Multiplier vs 14h Def.</span>
            </div>
          </div>

          <div className="hidden sm:block h-8 w-px bg-white/[0.08]" />

          <div>
            <div className="text-xs text-[#6F6863] font-medium tracking-wide">Physical Consequence Shielded</div>
            <div className="mt-1 flex items-center gap-2 font-mono text-xs">
              <span className="text-[#3DDC97] font-bold flex items-center gap-1">
                <Droplets className="w-3 h-3" />
                {plan?.total_mld_protected ?? 140} MLD
              </span>
              <span className="text-[#6F6863]">·</span>
              <span className="text-[#3DDC97] font-bold flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {plan?.total_mw_protected ?? 68} MW
              </span>
              <span className="text-[#6F6863]">·</span>
              <span className="text-[#A09A96] font-sans">0h Plant Loss</span>
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
                    <div className="mt-3 pl-8 pr-3 py-3 bg-[#120D0B]/90 rounded-xl border border-white/[0.08] text-xs space-y-4">
                      {/* Metric cards grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[#A09A96]">
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
                          <div className="text-[#6F6863] text-[11px]">OT Safety Window</div>
                          <div className="text-white mt-0.5 flex items-center gap-1.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3DDC97]" />
                            {action.downtime_hours === 0 ? 'Zero-Downtime Safe (No PLC reboot)' : `Scheduled (${action.downtime_hours}h window)`}
                          </div>
                        </div>
                      </div>

                      {/* Asymmetry & Consequence Impact Strip */}
                      {(action.asymmetry_multiplier || action.physical_impact_saved) && (
                        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/[0.06]">
                          {action.asymmetry_multiplier && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F26A1B]/10 border border-[#F26A1B]/30 text-[11px] font-mono text-[#F26A1B]">
                              <Zap className="w-3 h-3 text-[#F26A1B]" />
                              <span>{action.asymmetry_multiplier}</span>
                            </div>
                          )}
                          {action.physical_impact_saved && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#3DDC97]/10 border border-[#3DDC97]/30 text-[11px] text-[#3DDC97]">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>{action.physical_impact_saved}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Compensating Controls & Virtual Patch CLI Snippet Terminal */}
                      {action.compensating_controls && (() => {
                        const currentTab = activeSnippetTab[action.id] || 'cisco_acl';
                        const controls = action.compensating_controls;
                        const snippetText = controls[currentTab] || controls.cisco_acl;
                        const isCopied = copiedId === `${action.id}_${currentTab}`;

                        return (
                          <div className="mt-3 rounded-lg border border-white/[0.1] bg-[#0A0706] overflow-hidden">
                            <div className="px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 bg-white/[0.03] border-b border-white/[0.06]">
                              <div className="flex items-center gap-2 text-white font-mono text-[11px]">
                                <Terminal className="w-3.5 h-3.5 text-[#F26A1B]" />
                                <span className="font-semibold text-white/90">Compensating Control CLI</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#3DDC97]/15 text-[#3DDC97] border border-[#3DDC97]/30">
                                  Zero-Downtime Safe
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {/* Tab selector buttons */}
                                <div className="inline-flex rounded-md p-0.5 bg-black/40 border border-white/10 text-[10px] font-mono">
                                  <button
                                    type="button"
                                    onClick={() => setActiveSnippetTab((prev) => ({ ...prev, [action.id]: 'cisco_acl' }))}
                                    className={`px-2 py-0.5 rounded transition-colors ${
                                      currentTab === 'cisco_acl' ? 'bg-[#F26A1B] text-white font-semibold' : 'text-white/60 hover:text-white'
                                    }`}
                                  >
                                    Cisco ACL
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setActiveSnippetTab((prev) => ({ ...prev, [action.id]: 'fortigate_cli' }))}
                                    className={`px-2 py-0.5 rounded transition-colors ${
                                      currentTab === 'fortigate_cli' ? 'bg-[#F26A1B] text-white font-semibold' : 'text-white/60 hover:text-white'
                                    }`}
                                  >
                                    FortiOS
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setActiveSnippetTab((prev) => ({ ...prev, [action.id]: 'iptables' }))}
                                    className={`px-2 py-0.5 rounded transition-colors ${
                                      currentTab === 'iptables' ? 'bg-[#F26A1B] text-white font-semibold' : 'text-white/60 hover:text-white'
                                    }`}
                                  >
                                    iptables
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setActiveSnippetTab((prev) => ({ ...prev, [action.id]: 'suricata_rule' }))}
                                    className={`px-2 py-0.5 rounded transition-colors ${
                                      currentTab === 'suricata_rule' ? 'bg-[#F26A1B] text-white font-semibold' : 'text-white/60 hover:text-white'
                                    }`}
                                  >
                                    Suricata DPI
                                  </button>
                                </div>

                                {/* Copy Button */}
                                <button
                                  type="button"
                                  onClick={() => handleCopySnippet(`${action.id}_${currentTab}`, snippetText)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white border border-white/15 text-[10px] font-mono transition-all"
                                >
                                  {isCopied ? (
                                    <>
                                      <Check className="w-3 h-3 text-[#3DDC97]" />
                                      <span className="text-[#3DDC97]">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 text-white/70" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* CLI Code Body */}
                            <pre className="p-3 text-[11px] font-mono text-[#D4CDC7] overflow-x-auto leading-relaxed select-all">
                              <code>{snippetText}</code>
                            </pre>

                            {/* Virtual patch guidance footer */}
                            {controls.virtual_patch_guidance && (
                              <div className="px-3 py-1.5 bg-black/60 border-t border-white/[0.04] text-[10px] text-white/50 flex items-center justify-between">
                                <span>Guidance: {controls.virtual_patch_guidance}</span>
                                {action.barrier_shift && (
                                  <span className="text-[#F26A1B]/80 font-mono hidden md:inline">
                                    Adversary Barrier: {action.barrier_shift}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
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
