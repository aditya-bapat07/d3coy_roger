import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Database,
  Sliders,
  Scale,
  Activity,
  GitBranch,
  Zap,
  ShieldCheck,
  ArrowRight,
  Info,
} from 'lucide-react';
import { MetaResponse, ValidationResponse } from '../types/api';

interface HowItWorksViewProps {
  meta: MetaResponse | null;
  validation: ValidationResponse | null;
  loading: boolean;
}

export const HowItWorksView: React.FC<HowItWorksViewProps> = ({
  meta,
  validation,
  loading,
}) => {
  if (loading || !meta || !validation) {
    return (
      <div className="bg-[#111827] border border-[#23324A] rounded-xl p-12 text-center text-slate-400">
        <Activity className="w-6 h-6 animate-spin mx-auto mb-3 text-blue-400" />
        Loading methodology, data provenance, and computed validation suite...
      </div>
    );
  }

  const { formula_summary, data_sources, assumptions_table, limitations } = meta;
  const { invariants, sensitivity_analysis, cvss_comparison, anomaly_evaluations, kev_floor_evidence } = validation;
  const synEval = anomaly_evaluations.synthetic_evaluation;
  const haiEval = anomaly_evaluations.hai_testbed_evaluation;

  return (
    <div className="space-y-6 pb-8 text-slate-200">
      {/* 1. Dual-Graph Architecture & Core Formula */}
      <section className="bg-[#111827] border border-[#23324A] rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#1F2C42] pb-3.5">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              How Vidura Works: Dual-Graph Cyber-Physical Risk Model
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-blue-950/70 border border-blue-500/40 text-blue-300">
            100% Computed • Zero Asserted Numbers
          </span>
        </div>

        {/* Simple Diagram of the Two Graphs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Graph 1: Attack Graph */}
          <div className="bg-[#162032] border border-[#23324A] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-blue-400" />
                Graph 1: Attack Graph — How They Get In
              </span>
              <span className="text-[11px] font-mono text-slate-400">Yen&apos;s Top-k (-log₁₀ p)</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono bg-[#0D1422] border border-[#1E2B40] rounded-lg p-3">
              <span className="px-2 py-1 rounded bg-slate-800 text-slate-200 border border-slate-600">
                Entry (Internet / VPN)
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="px-2 py-1 rounded bg-blue-950/80 text-blue-200 border border-blue-500/40">
                IT / DMZ (L4–L3.5)
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="px-2 py-1 rounded bg-indigo-950/80 text-indigo-200 border border-indigo-500/40">
                SCADA / HMI (L3–L2)
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="px-2 py-1 rounded bg-amber-950/80 text-amber-200 border border-amber-500/40">
                PLC / RTU (L1–L0)
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {formula_summary.likelihood_sentence}
            </p>
          </div>

          {/* Graph 2: Dependency Graph */}
          <div className="bg-[#162032] border border-[#23324A] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                Graph 2: Dependency Graph — What Breaks
              </span>
              <span className="text-[11px] font-mono text-slate-400">INL CCE Cascade DAG</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono bg-[#0D1422] border border-[#1E2B40] rounded-lg p-3">
              <span className="px-2 py-1 rounded bg-amber-950/80 text-amber-200 border border-amber-500/40">
                OT Controller (L1)
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="px-2 py-1 rounded bg-orange-950/80 text-orange-200 border border-orange-500/40">
                Substation / Dosing
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="px-2 py-1 rounded bg-rose-950/70 text-rose-200 border border-rose-500/40">
                Delay Buffer (3h–24h)
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="px-2 py-1 rounded bg-red-950 text-red-200 border border-red-500/60">
                Piped Water &amp; Hospital
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {formula_summary.consequence_sentence}
            </p>
          </div>
        </div>

        {/* Formula Banner */}
        <div className="bg-[#0D1422] border border-blue-500/30 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-blue-400 font-semibold mb-1">
              Core Prioritisation Equation
            </div>
            <div className="text-base font-mono font-bold text-white">
              {formula_summary.risk_formula}
            </div>
          </div>
          <div className="text-xs font-mono text-slate-300 space-y-1">
            <div>L_n = (log₁₀(max(L, 10⁻⁶)) + 6) ÷ 6 ∈ [0, 1]</div>
            <div>C = 0.5 × (Severity ÷ 4) + 0.3 × (People ÷ 500,000) + 0.2 × (Outage ÷ 72h) ∈ [0, 1]</div>
          </div>
        </div>
      </section>

      {/* 2. Honest Limitations Box */}
      <section className="bg-amber-950/20 border border-amber-500/40 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          Methodological Scope &amp; Known Limitations
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {limitations.map((lim, idx) => (
            <div
              key={idx}
              className="bg-[#111827]/90 border border-amber-500/20 rounded-lg p-3.5 space-y-1.5"
            >
              <div className="text-xs font-bold text-amber-200">{lim.title}</div>
              <p className="text-xs text-slate-300 leading-relaxed">{lim.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Empirical Evidence for KEV_FLOOR Table */}
      <section className="bg-[#111827] border border-[#23324A] rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#1F2C42] pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400" />
              Empirical Evidence for KEV_FLOOR = 0.50 (CISA KEV × FIRST EPSS Cross-Analysis)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{kev_floor_evidence.definition}</p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            data/research/kev_epss_ics_evidence.json
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#23324A] text-slate-400 uppercase text-[11px]">
                <th className="py-2.5 px-3">Catalog / Sector Group</th>
                <th className="py-2.5 px-3 text-right">KEV CVEs (with EPSS)</th>
                <th className="py-2.5 px-3 text-right">Median EPSS</th>
                <th className="py-2.5 px-3 text-right">Share with EPSS &lt; 0.10</th>
                <th className="py-2.5 px-3 text-right">Ransomware-Linked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2C42] font-mono">
              {kev_floor_evidence.rows.map((row, idx) => {
                const isWater = row.group.toLowerCase().includes('water');
                return (
                  <tr
                    key={idx}
                    className={isWater ? 'bg-blue-950/30 text-blue-200 font-semibold' : 'text-slate-200'}
                  >
                    <td className="py-2.5 px-3 font-sans">
                      {row.group}
                      {isWater && (
                        <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-blue-900/60 border border-blue-400/40 text-blue-200 font-mono">
                          Small sample (n=16)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {row.kev_cves.toLocaleString()} ({row.with_epss.toLocaleString()})
                    </td>
                    <td className="py-2.5 px-3 text-right">{row.median_epss.toFixed(4)}</td>
                    <td className="py-2.5 px-3 text-right">{(row.share_below_0_1 * 100).toFixed(1)}%</td>
                    <td className="py-2.5 px-3 text-right">{row.ransomware_known.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-[#162032] border border-[#23324A] rounded-lg p-3.5 text-xs text-slate-300 space-y-1.5">
          <div className="text-amber-300 font-medium">{kev_floor_evidence.small_sample_note}</div>
          <div className="text-[11px] text-slate-400">
            <strong>Sources:</strong> KEV: {kev_floor_evidence.sources.kev} • EPSS:{' '}
            {kev_floor_evidence.sources.epss} • CSAF: {kev_floor_evidence.sources.csaf}
          </div>
        </div>
      </section>

      {/* 4. Validation Results: Invariants, Sensitivity, CVSS Disagreements, Anomaly Evals */}
      <section className="bg-[#111827] border border-[#23324A] rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-[#1F2C42] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              Computed Validation &amp; Verification Results
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded">
            {invariants.summary}
          </span>
        </div>

        {/* 4A. Invariant Test Suite */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            1. Mathematical &amp; Data-Integrity Invariant Suite (pytest)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {invariants.checks.map((chk) => (
              <div
                key={chk.id}
                className="bg-[#162032] border border-[#23324A] rounded-lg p-3.5 flex items-start gap-3"
              >
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 mt-0.5 ${
                    chk.passed
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                      : 'bg-rose-950 text-rose-300 border border-rose-500/50'
                  }`}
                >
                  {chk.passed ? 'PASS' : 'FAIL'}
                </span>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-white">{chk.name}</div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{chk.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4B. Sensitivity Analysis (±50% Model Parameter Perturbations) */}
        <div className="space-y-3 pt-2 border-t border-[#1F2C42]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              2. One-at-a-Time ±50% Parameter Sensitivity Analysis
            </h4>
            <span className="text-xs font-mono text-blue-300">
              Mean Min Kendall&apos;s τ = {sensitivity_analysis.mean_min_kendall_tau.toFixed(4)}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {sensitivity_analysis.methodology}
          </p>
          <div className="bg-[#162032] border border-blue-500/30 rounded-lg p-3.5 text-xs text-slate-200 space-y-1">
            <div className="font-semibold text-blue-300">Honest Fragility Assessment:</div>
            <p className="text-slate-300 leading-relaxed">{sensitivity_analysis.honest_assessment}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#23324A] text-slate-400 uppercase text-[11px]">
                  <th className="py-2 px-3">Model Parameter</th>
                  <th className="py-2 px-3">Persona</th>
                  <th className="py-2 px-3 text-right">Baseline</th>
                  <th className="py-2 px-3 text-right">-50% / +50%</th>
                  <th className="py-2 px-3 text-right">τ (-50%)</th>
                  <th className="py-2 px-3 text-right">τ (+50%)</th>
                  <th className="py-2 px-3 text-right">Max Top-10 Shifts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2C42] font-mono">
                {sensitivity_analysis.parameters.map((p) => (
                  <tr key={p.parameter} className="hover:bg-[#162032]/60">
                    <td className="py-2 px-3 font-sans text-slate-200">{p.label}</td>
                    <td className="py-2 px-3 text-slate-400">{p.persona_evaluated}</td>
                    <td className="py-2 px-3 text-right">{p.baseline_value}</td>
                    <td className="py-2 px-3 text-right text-slate-400">
                      {p.minus_50_pct_value} / {p.plus_50_pct_value}
                    </td>
                    <td
                      className={`py-2 px-3 text-right ${
                        p.kendall_tau_minus_50 < 0.8 ? 'text-amber-300 font-bold' : 'text-emerald-300'
                      }`}
                    >
                      {p.kendall_tau_minus_50.toFixed(3)}
                    </td>
                    <td
                      className={`py-2 px-3 text-right ${
                        p.kendall_tau_plus_50 < 0.8 ? 'text-amber-300 font-bold' : 'text-emerald-300'
                      }`}
                    >
                      {p.kendall_tau_plus_50.toFixed(3)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {p.max_top_10_rank_shifts} / 10
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4C. CVSS-Only Comparison & Biggest Disagreements */}
        <div className="space-y-3 pt-2 border-t border-[#1F2C42]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Scale className="w-4 h-4 text-purple-400" />
              3. Vidura Ranking vs CVSS-Only Ranking Disagreements
            </h4>
            <span className="text-xs font-mono text-purple-300">
              Kendall&apos;s τ vs CVSS-Only = {cvss_comparison.kendall_tau_vs_cvss.toFixed(4)}
            </span>
          </div>
          <p className="text-xs text-slate-300">{cvss_comparison.summary}</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#23324A] text-slate-400 uppercase text-[11px]">
                  <th className="py-2.5 px-3">Asset</th>
                  <th className="py-2.5 px-3 text-center">CVSS</th>
                  <th className="py-2.5 px-3 text-center">Vidura Rank</th>
                  <th className="py-2.5 px-3 text-center">CVSS Rank</th>
                  <th className="py-2.5 px-3">Computed Reason for Disagreement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2C42]">
                {cvss_comparison.biggest_disagreements.map((item) => (
                  <tr key={item.asset_id} className="hover:bg-[#162032]/60">
                    <td className="py-2.5 px-3 font-medium text-white">
                      <div>{item.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {item.purdue_level} • {item.site.toUpperCase()} • Risk {item.vidura_risk_score.toFixed(1)}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {item.cvss.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-300">
                      #{item.vidura_rank}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                      #{item.cvss_rank}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 leading-relaxed">
                      {item.computed_reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4D. Anomaly Detection Evaluations (Synthetic vs HAI 21.03 Strictly Separated) */}
        <div className="space-y-3 pt-2 border-t border-[#1F2C42]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              4. Anomaly Detection Evaluations (Reported Separately — Never Merged)
            </h4>
            <span className="text-[11px] text-slate-400">{anomaly_evaluations.separation_note}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Card 1: Synthetic data, injected attacks */}
            <div className="bg-[#162032] border border-[#23324A] rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#23324A] pb-2">
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-950 text-blue-300 border border-blue-500/40">
                  {synEval.label}
                </span>
                <span className="text-[11px] font-mono text-slate-400">{synEval.model}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center bg-[#0D1422] rounded-lg p-2.5 border border-[#1E2B40]">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Recall</div>
                  <div className="text-sm font-mono font-bold text-emerald-300">
                    {(synEval.recall * 100).toFixed(1)}% (5/6)
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Precision</div>
                  <div className="text-sm font-mono font-bold text-blue-300">
                    {(synEval.precision * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Confusion Matrix</div>
                  <div className="text-[11px] font-mono text-slate-200">
                    TP:{synEval.confusion_matrix.true_positive} FP:{synEval.confusion_matrix.false_positive} TN:{synEval.confusion_matrix.true_negative} FN:{synEval.confusion_matrix.false_negative}
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {synEval.notes} ({synEval.train_windows.toLocaleString()} train asset-hour windows;{' '}
                {synEval.test_windows.toLocaleString()} test asset-hour windows).
              </p>
            </div>

            {/* Card 2: HAI 21.03 real testbed data */}
            {haiEval && (
              <div className="bg-[#162032] border border-[#23324A] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#23324A] pb-2">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    {haiEval.label}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">Water Process P3 (7 tags)</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center bg-[#0D1422] rounded-lg p-2.5 border border-[#1E2B40]">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Event Recall</div>
                    <div className="text-sm font-mono font-bold text-emerald-300">
                      {(haiEval.event_recall * 100).toFixed(1)}% ({haiEval.attack_events_detected}/{haiEval.attack_events_total})
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Point Precision / Recall</div>
                    <div className="text-sm font-mono font-bold text-blue-300">
                      {(haiEval.pointwise_precision * 100).toFixed(1)}% / {(haiEval.pointwise_recall * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">False Alarms</div>
                    <div className="text-xs font-mono text-slate-200">
                      {haiEval.false_alarm_episodes} in {haiEval.normal_hours}h ({haiEval.false_alarm_episodes_per_24h}/24h)
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {haiEval.process_target}. {haiEval.note}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. Full Model Assumptions Table */}
      <section className="bg-[#111827] border border-[#23324A] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1F2C42] pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">
              Full Model Assumptions &amp; Justifications
            </h3>
          </div>
          <span className="text-[11px] font-mono text-amber-300 bg-amber-950/50 border border-amber-500/40 px-2 py-0.5 rounded">
            Every entry tagged &quot;Scenario assumption&quot;
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#23324A] text-slate-400 uppercase text-[11px]">
                <th className="py-2.5 px-3 w-48">Parameter</th>
                <th className="py-2.5 px-3 w-56">Value</th>
                <th className="py-2.5 px-3">Justification</th>
                <th className="py-2.5 px-3 w-64">Source / Grounding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2C42]">
              {assumptions_table.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#162032]/50 align-top">
                  <td className="py-2.5 px-3 font-medium text-white">
                    <div>{row.parameter}</div>
                    <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 border border-slate-600 text-amber-300">
                      Scenario assumption
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-blue-200">{row.value}</td>
                  <td className="py-2.5 px-3 text-slate-300 leading-relaxed">{row.justification}</td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px] leading-relaxed">{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Data Sources, Fetch Dates, and Record Counts */}
      <section className="bg-[#111827] border border-[#23324A] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1F2C42] pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">
              Cached Threat Intelligence &amp; Research Data Sources ({data_sources.length} files)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">data/cache/manifest.json</span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-[#111827]">
              <tr className="border-b border-[#23324A] text-slate-400 uppercase text-[11px]">
                <th className="py-2 px-3">Dataset File</th>
                <th className="py-2 px-3">Description</th>
                <th className="py-2 px-3 text-right">Records</th>
                <th className="py-2 px-3">Fetched At (UTC)</th>
                <th className="py-2 px-3">Source Provenance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2C42]">
              {data_sources.map((src) => (
                <tr key={src.key} className="hover:bg-[#162032]/50">
                  <td className="py-2 px-3 font-mono text-blue-300">{src.file}</td>
                  <td className="py-2 px-3 text-slate-200">{src.description}</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-200">
                    {src.record_count.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                    {src.fetched_at ? src.fetched_at.slice(0, 19).replace('T', ' ') : '—'}
                  </td>
                  <td className="py-2 px-3 text-[11px] text-slate-400 max-w-xs truncate" title={src.source}>
                    {src.source}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
