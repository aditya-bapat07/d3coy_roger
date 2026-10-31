import React from 'react';
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
      <div className="glass-card p-12 text-center text-sm text-[#6F6863]">
        Loading methodology, data provenance, and computed validation suite…
      </div>
    );
  }

  const { formula_summary, data_sources, assumptions_table, limitations } = meta;
  const { invariants, sensitivity_analysis, cvss_comparison, anomaly_evaluations, kev_floor_evidence } = validation;
  const synEval = anomaly_evaluations.synthetic_evaluation;
  const haiEval = anomaly_evaluations.hai_testbed_evaluation;

  return (
    <div className="space-y-6 pb-12 text-[#A09A96]">
      {/* 1. Dual-Graph Architecture & Core Formula */}
      <section className="glass-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-4">
          <h2 className="text-base font-semibold text-white tracking-tight">
            How Vidura Works: Dual-Graph Cyber-Physical Risk Model
          </h2>
          <span className="text-xs font-mono text-[#F26A1B] bg-[#F26A1B]/10 border border-[#F26A1B]/30 px-2.5 py-0.5 rounded-full w-fit">
            100% Computed · Zero Asserted Numbers
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card bg-white/[0.02] border-white/[0.06] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white">
                Graph 1: Attack Graph — How They Get In
              </span>
              <span className="text-xs font-mono text-[#FF7A2B]">Yen&apos;s Top-k (−log₁₀ p)</span>
            </div>
            <div className="text-xs font-mono text-[#6F6863]">
              Entry (Internet / VPN) → IT / DMZ (L4–L3.5) → SCADA / HMI (L3–L2) → PLC / RTU (L1–L0)
            </div>
            <div className="prose text-sm text-[#A09A96]">
              <p>{formula_summary.likelihood_sentence}</p>
            </div>
          </div>

          <div className="glass-card bg-white/[0.02] border-white/[0.06] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white">
                Graph 2: Dependency Graph — What Breaks
              </span>
              <span className="text-xs font-mono text-[#5B9BFF]">INL CCE Cascade DAG</span>
            </div>
            <div className="text-xs font-mono text-[#6F6863]">
              OT Controller (L1) → Substation / Dosing → Delay Buffer (3h–24h) → Piped Water &amp; Hospital
            </div>
            <div className="prose text-sm text-[#A09A96]">
              <p>{formula_summary.consequence_sentence}</p>
            </div>
          </div>
        </div>

        <div className="glass-card bg-[#120D0B]/80 border-white/[0.08] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-[#6F6863] font-semibold">
              Core Prioritisation Equation
            </div>
            <div className="text-sm font-mono font-bold text-[#FF7A2B] mt-1 drop-shadow-[0_0_8px_rgba(242,106,27,0.3)]">
              {formula_summary.risk_formula}
            </div>
          </div>
          <div className="text-xs font-mono text-[#6F6863] space-y-1">
            <div>L_n = (log₁₀(max(L, 10⁻⁶)) + 6) ÷ 6 ∈ [0, 1]</div>
            <div>C = 0.5 × (Severity ÷ 4) + 0.3 × (People ÷ 500,000) + 0.2 × (Outage ÷ 72h) ∈ [0, 1]</div>
          </div>
        </div>
      </section>

      {/* 2. Methodological Scope & Limitations */}
      <section className="glass-card p-6 space-y-4">
        <h2 className="text-base font-semibold text-white tracking-tight border-b border-white/[0.08] pb-3">
          Methodological Scope &amp; Known Limitations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {limitations.map((lim, idx) => (
            <div key={idx} className="glass-card bg-white/[0.02] border-white/[0.06] p-4 space-y-1.5">
              <div className="font-semibold text-white text-sm">{lim.title}</div>
              <p className="text-xs text-[#A09A96] leading-relaxed">{lim.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Empirical Evidence for KEV_FLOOR Table */}
      <section className="glass-card p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              Empirical Evidence for KEV_FLOOR = 0.50 (CISA KEV × FIRST EPSS Cross-Analysis)
            </h2>
            <div className="prose text-xs text-[#A09A96] mt-1">
              <p>{kev_floor_evidence.definition}</p>
            </div>
          </div>
          <span className="text-xs font-mono text-[#6F6863]">
            data/research/kev_epss_ics_evidence.json
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-[#6F6863] text-xs uppercase tracking-wider">
                <th className="py-2.5 px-3 font-semibold">Catalog / Sector Group</th>
                <th className="py-2.5 px-3 text-right font-semibold">KEV CVEs (with EPSS)</th>
                <th className="py-2.5 px-3 text-right font-semibold">Median EPSS</th>
                <th className="py-2.5 px-3 text-right font-semibold">Share with EPSS &lt; 0.10</th>
                <th className="py-2.5 px-3 text-right font-semibold">Ransomware-Linked</th>
              </tr>
            </thead>
            <tbody className="font-mono divide-y divide-white/[0.04]">
              {kev_floor_evidence.rows.map((row, idx) => {
                const isWater = row.group.toLowerCase().includes('water');
                return (
                  <tr
                    key={idx}
                    className={`hover:bg-white/[0.02] transition-colors ${
                      isWater ? 'bg-[#F26A1B]/5' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-sans text-white">
                      {row.group}
                      {isWater && (
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-[#FFC24B]/10 text-[#FFC24B] border border-[#FFC24B]/30 font-mono">
                          Small sample (n=16)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right text-white">
                      {row.kev_cves.toLocaleString()} ({row.with_epss.toLocaleString()})
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#FF7A2B]">{row.median_epss.toFixed(4)}</td>
                    <td className="py-2.5 px-3 text-right text-white">{(row.share_below_0_1 * 100).toFixed(1)}%</td>
                    <td className="py-2.5 px-3 text-right text-white">{row.ransomware_known.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="prose text-xs text-[#6F6863] space-y-1 pt-2">
          <p>{kev_floor_evidence.small_sample_note}</p>
          <p className="text-[#6F6863]">
            Sources: KEV: {kev_floor_evidence.sources.kev} · EPSS: {kev_floor_evidence.sources.epss} · CSAF:{' '}
            {kev_floor_evidence.sources.csaf}
          </p>
        </div>
      </section>

      {/* 4. Validation Results */}
      <section className="glass-card p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <h2 className="text-base font-semibold text-white tracking-tight">
            Computed Validation &amp; Verification Results
          </h2>
          <span className="text-xs font-mono text-[#3DDC97] bg-[#3DDC97]/10 border border-[#3DDC97]/30 px-2.5 py-0.5 rounded-full font-medium">
            {invariants.summary}
          </span>
        </div>

        {/* 4A. Invariant Test Suite */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">
            1. Mathematical &amp; Data-Integrity Invariant Suite (pytest)
          </h3>
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-[#6F6863] text-xs uppercase tracking-wider">
                <th className="py-2 px-3 font-semibold w-24">Status</th>
                <th className="py-2 px-3 font-semibold w-72">Invariant</th>
                <th className="py-2 px-3 font-semibold">Verification Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {invariants.checks.map((chk) => (
                <tr key={chk.id} className="hover:bg-white/[0.02]">
                  <td className="py-2 px-3 font-mono text-xs font-bold">
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        chk.passed
                          ? 'text-[#3DDC97] bg-[#3DDC97]/15 border border-[#3DDC97]/30'
                          : 'text-[#FF4D4F] bg-[#FF4D4F]/15 border border-[#FF4D4F]/30'
                      }`}
                    >
                      {chk.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-medium text-white">{chk.name}</td>
                  <td className="py-2 px-3 text-[#A09A96] text-xs">{chk.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4B. Sensitivity Analysis */}
        <div className="space-y-3 pt-4 border-t border-white/[0.06]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white">
              2. One-at-a-Time ±50% Parameter Sensitivity Analysis
            </h3>
            <span className="text-xs font-mono text-[#F26A1B]">
              Mean Min Kendall&apos;s τ = {sensitivity_analysis.mean_min_kendall_tau.toFixed(4)}
            </span>
          </div>
          <div className="prose text-xs text-[#A09A96]">
            <p>{sensitivity_analysis.methodology}</p>
            <p className="text-white mt-1">
              <strong>Fragility assessment:</strong> {sensitivity_analysis.honest_assessment}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-[#6F6863] text-xs uppercase tracking-wider">
                  <th className="py-2 px-3 font-semibold">Model Parameter</th>
                  <th className="py-2 px-3 font-semibold">Persona</th>
                  <th className="py-2 px-3 text-right font-semibold">Baseline</th>
                  <th className="py-2 px-3 text-right font-semibold">-50% / +50%</th>
                  <th className="py-2 px-3 text-right font-semibold">τ (-50%)</th>
                  <th className="py-2 px-3 text-right font-semibold">τ (+50%)</th>
                  <th className="py-2 px-3 text-right font-semibold">Max Top-10 Shifts</th>
                </tr>
              </thead>
              <tbody className="font-mono divide-y divide-white/[0.04]">
                {sensitivity_analysis.parameters.map((p) => (
                  <tr key={p.parameter} className="hover:bg-white/[0.02]">
                    <td className="py-2 px-3 font-sans text-white font-medium">{p.label}</td>
                    <td className="py-2 px-3 text-[#A09A96]">{p.persona_evaluated}</td>
                    <td className="py-2 px-3 text-right text-white">{p.baseline_value}</td>
                    <td className="py-2 px-3 text-right text-[#6F6863]">
                      {p.minus_50_pct_value} / {p.plus_50_pct_value}
                    </td>
                    <td className="py-2 px-3 text-right text-[#3DDC97]">{p.kendall_tau_minus_50.toFixed(3)}</td>
                    <td className="py-2 px-3 text-right text-[#3DDC97]">{p.kendall_tau_plus_50.toFixed(3)}</td>
                    <td className="py-2 px-3 text-right text-white">{p.max_top_10_rank_shifts} / 10</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4C. CVSS-Only Comparison */}
        <div className="space-y-3 pt-4 border-t border-white/[0.06]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white">
              3. Vidura Ranking vs CVSS-Only Ranking Disagreements
            </h3>
            <span className="text-xs font-mono text-[#F26A1B]">
              Kendall&apos;s τ vs CVSS-Only = {cvss_comparison.kendall_tau_vs_cvss.toFixed(4)}
            </span>
          </div>
          <div className="prose text-xs text-[#A09A96]">
            <p>{cvss_comparison.summary}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-[#6F6863] text-xs uppercase tracking-wider">
                  <th className="py-2 px-3 font-semibold">Asset</th>
                  <th className="py-2 px-3 text-center font-semibold">CVSS</th>
                  <th className="py-2 px-3 text-center font-semibold">Vidura Rank</th>
                  <th className="py-2 px-3 text-center font-semibold">CVSS Rank</th>
                  <th className="py-2 px-3 font-semibold">Computed Reason for Disagreement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {cvss_comparison.biggest_disagreements.map((item) => (
                  <tr key={item.asset_id} className="hover:bg-white/[0.02]">
                    <td className="py-2 px-3">
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="text-xs font-mono text-[#6F6863]">
                        {item.purdue_level} · {item.site.toUpperCase()} · Risk {item.vidura_risk_score.toFixed(1)}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-white">{item.cvss.toFixed(1)}</td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-[#F26A1B] drop-shadow-[0_0_6px_rgba(242,106,27,0.4)]">
                      #{item.vidura_rank}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-[#6F6863]">#{item.cvss_rank}</td>
                    <td className="py-2 px-3 text-[#A09A96] text-xs">{item.computed_reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4D. Anomaly Detection Evaluations */}
        <div className="space-y-3 pt-4 border-t border-white/[0.06]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white">
              4. Anomaly Detection Evaluations (Reported Separately)
            </h3>
            <span className="text-xs text-[#6F6863] font-mono">{anomaly_evaluations.separation_note}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-card bg-white/[0.02] border-white/[0.06] p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <span className="text-xs font-mono font-bold text-white">{synEval.label}</span>
                <span className="text-xs font-mono text-[#FF7A2B]">{synEval.model}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs font-mono text-white">
                <span>Recall: <span className="text-[#3DDC97]">{(synEval.recall * 100).toFixed(1)}%</span></span>
                <span>Precision: <span className="text-[#3DDC97]">{(synEval.precision * 100).toFixed(1)}%</span></span>
                <span className="text-[#6F6863]">
                  TP:{synEval.confusion_matrix.true_positive} FP:{synEval.confusion_matrix.false_positive} TN:
                  {synEval.confusion_matrix.true_negative} FN:{synEval.confusion_matrix.false_negative}
                </span>
              </div>
              <div className="prose text-xs text-[#6F6863]">
                <p>
                  {synEval.notes} ({synEval.train_windows.toLocaleString()} train windows;{' '}
                  {synEval.test_windows.toLocaleString()} test windows).
                </p>
              </div>
            </div>

            {haiEval && (
              <div className="glass-card bg-white/[0.02] border-white/[0.06] p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <span className="text-xs font-mono font-bold text-white">{haiEval.label}</span>
                  <span className="text-xs font-mono text-[#5B9BFF]">Water Process P3 (7 tags)</span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs font-mono text-white">
                  <span>
                    Event Recall: <span className="text-[#3DDC97]">{(haiEval.event_recall * 100).toFixed(1)}%</span>
                  </span>
                  <span>
                    Point P/R: {(haiEval.pointwise_precision * 100).toFixed(1)}% / {(haiEval.pointwise_recall * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="prose text-xs text-[#6F6863]">
                  <p>
                    {haiEval.process_target}. {haiEval.note}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. Full Model Assumptions Table */}
      <section className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <h2 className="text-base font-semibold text-white tracking-tight">
            Full Model Assumptions &amp; Justifications
          </h2>
          <span className="text-xs font-mono text-[#6F6863]">
            Scenario assumptions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-[#6F6863] text-xs uppercase tracking-wider">
                <th className="py-2.5 px-3 w-48 font-semibold">Parameter</th>
                <th className="py-2.5 px-3 w-56 font-semibold">Value</th>
                <th className="py-2.5 px-3 font-semibold">Justification</th>
                <th className="py-2.5 px-3 w-64 font-semibold">Source / Grounding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {assumptions_table.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] align-top">
                  <td className="py-2.5 px-3 font-medium text-white">{row.parameter}</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-[#FF7A2B]">{row.value}</td>
                  <td className="py-2.5 px-3 text-[#A09A96] text-xs leading-relaxed">{row.justification}</td>
                  <td className="py-2.5 px-3 text-[#6F6863] text-xs font-mono">{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Data Sources */}
      <section className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <h2 className="text-base font-semibold text-white tracking-tight">
            Cached Threat Intelligence &amp; Research Data Sources ({data_sources.length} files)
          </h2>
          <span className="text-xs font-mono text-[#6F6863]">data/cache/manifest.json</span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="sticky top-0 bg-[#120D0B] z-10">
              <tr className="border-b border-white/[0.08] text-[#6F6863] text-xs uppercase tracking-wider">
                <th className="py-2 px-3 font-semibold">Dataset File</th>
                <th className="py-2 px-3 font-semibold">Description</th>
                <th className="py-2 px-3 text-right font-semibold">Records</th>
                <th className="py-2 px-3 font-semibold">Fetched At (UTC)</th>
                <th className="py-2 px-3 font-semibold">Source Provenance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {data_sources.map((src) => (
                <tr key={src.key} className="hover:bg-white/[0.02]">
                  <td className="py-2 px-3 font-mono text-xs text-white">{src.file}</td>
                  <td className="py-2 px-3 text-[#A09A96] text-xs">{src.description}</td>
                  <td className="py-2 px-3 text-right font-mono text-xs text-[#FF7A2B]">
                    {src.record_count.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 font-mono text-xs text-[#6F6863]">
                    {src.fetched_at ? src.fetched_at.slice(0, 19).replace('T', ' ') : '—'}
                  </td>
                  <td className="py-2 px-3 text-xs text-[#6F6863] max-w-xs truncate" title={src.source}>
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
