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
      <div className="bg-white border border-[--border-default] rounded-lg p-8 text-sm text-ink-secondary">
        Loading methodology, data provenance, and computed validation suite…
      </div>
    );
  }

  const { formula_summary, data_sources, assumptions_table, limitations } = meta;
  const { invariants, sensitivity_analysis, cvss_comparison, anomaly_evaluations, kev_floor_evidence } = validation;
  const synEval = anomaly_evaluations.synthetic_evaluation;
  const haiEval = anomaly_evaluations.hai_testbed_evaluation;

  return (
    <div className="space-y-6 pb-8 text-ink">
      {/* 1. Dual-Graph Architecture & Core Formula */}
      <section className="bg-white border border-[--border-default] rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[--border-default] pb-3">
          <h2 className="text-base font-semibold text-ink">
            How Vidura Works: Dual-Graph Cyber-Physical Risk Model
          </h2>
          <span className="text-xs font-mono text-ink-secondary">
            100% Computed · Zero Asserted Numbers
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-canvas-secondary/60 border border-[--border-subtle] rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink">
                Graph 1: Attack Graph — How They Get In
              </span>
              <span className="text-xs font-mono text-ink-secondary">Yen&apos;s Top-k (−log₁₀ p)</span>
            </div>
            <div className="text-xs font-mono text-ink-secondary">
              Entry (Internet / VPN) → IT / DMZ (L4–L3.5) → SCADA / HMI (L3–L2) → PLC / RTU (L1–L0)
            </div>
            <div className="prose text-sm text-ink-secondary">
              <p>{formula_summary.likelihood_sentence}</p>
            </div>
          </div>

          <div className="bg-canvas-secondary/60 border border-[--border-subtle] rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink">
                Graph 2: Dependency Graph — What Breaks
              </span>
              <span className="text-xs font-mono text-ink-secondary">INL CCE Cascade DAG</span>
            </div>
            <div className="text-xs font-mono text-ink-secondary">
              OT Controller (L1) → Substation / Dosing → Delay Buffer (3h–24h) → Piped Water &amp; Hospital
            </div>
            <div className="prose text-sm text-ink-secondary">
              <p>{formula_summary.consequence_sentence}</p>
            </div>
          </div>
        </div>

        <div className="bg-canvas-secondary/60 border border-[--border-subtle] rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-ink-secondary font-medium">
              Core Prioritisation Equation
            </div>
            <div className="text-sm font-mono font-semibold text-ink mt-0.5">
              {formula_summary.risk_formula}
            </div>
          </div>
          <div className="text-xs font-mono text-ink-secondary space-y-0.5">
            <div>L_n = (log₁₀(max(L, 10⁻⁶)) + 6) ÷ 6 ∈ [0, 1]</div>
            <div>C = 0.5 × (Severity ÷ 4) + 0.3 × (People ÷ 500,000) + 0.2 × (Outage ÷ 72h) ∈ [0, 1]</div>
          </div>
        </div>
      </section>

      {/* 2. Methodological Scope & Limitations */}
      <section className="bg-white border border-[--border-default] rounded-lg p-5 space-y-3">
        <h2 className="text-base font-semibold text-ink border-b border-[--border-default] pb-2.5">
          Methodological Scope &amp; Known Limitations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {limitations.map((lim, idx) => (
            <div key={idx} className="prose text-sm space-y-1">
              <div className="font-semibold text-ink">{lim.title}</div>
              <p className="text-ink-secondary">{lim.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Empirical Evidence for KEV_FLOOR Table */}
      <section className="bg-white border border-[--border-default] rounded-lg p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[--border-default] pb-2.5">
          <div>
            <h2 className="text-base font-semibold text-ink">
              Empirical Evidence for KEV_FLOOR = 0.50 (CISA KEV × FIRST EPSS Cross-Analysis)
            </h2>
            <div className="prose text-sm text-ink-secondary">
              <p>{kev_floor_evidence.definition}</p>
            </div>
          </div>
          <span className="text-xs font-mono text-ink-tertiary">
            data/research/kev_epss_ics_evidence.json
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[--border-default] text-ink-secondary text-xs">
                <th className="py-2 px-3 font-medium">Catalog / Sector Group</th>
                <th className="py-2 px-3 text-right font-medium">KEV CVEs (with EPSS)</th>
                <th className="py-2 px-3 text-right font-medium">Median EPSS</th>
                <th className="py-2 px-3 text-right font-medium">Share with EPSS &lt; 0.10</th>
                <th className="py-2 px-3 text-right font-medium">Ransomware-Linked</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {kev_floor_evidence.rows.map((row, idx) => {
                const isWater = row.group.toLowerCase().includes('water');
                return (
                  <tr
                    key={idx}
                    className={`border-b border-[--border-subtle] ${
                      idx % 2 === 1 ? 'bg-[--bg-secondary]' : ''
                    } ${isWater ? 'font-semibold' : ''}`}
                  >
                    <td className="py-2 px-3 font-sans text-ink">
                      {row.group}
                      {isWater && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                          Small sample (n=16)
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {row.kev_cves.toLocaleString()} ({row.with_epss.toLocaleString()})
                    </td>
                    <td className="py-2 px-3 text-right">{row.median_epss.toFixed(4)}</td>
                    <td className="py-2 px-3 text-right">{(row.share_below_0_1 * 100).toFixed(1)}%</td>
                    <td className="py-2 px-3 text-right">{row.ransomware_known.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="prose text-xs text-ink-secondary space-y-1">
          <p>{kev_floor_evidence.small_sample_note}</p>
          <p className="text-ink-tertiary">
            Sources: KEV: {kev_floor_evidence.sources.kev} · EPSS: {kev_floor_evidence.sources.epss} · CSAF:{' '}
            {kev_floor_evidence.sources.csaf}
          </p>
        </div>
      </section>

      {/* 4. Validation Results */}
      <section className="bg-white border border-[--border-default] rounded-lg p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-[--border-default] pb-2.5">
          <h2 className="text-base font-semibold text-ink">
            Computed Validation &amp; Verification Results
          </h2>
          <span className="text-xs font-mono text-risk-low">
            {invariants.summary}
          </span>
        </div>

        {/* 4A. Invariant Test Suite */}
        <div className="space-y-2.5">
          <h3 className="text-base font-semibold text-ink">
            1. Mathematical &amp; Data-Integrity Invariant Suite (pytest)
          </h3>
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[--border-default] text-ink-secondary text-xs">
                <th className="py-2 px-3 font-medium w-20">Status</th>
                <th className="py-2 px-3 font-medium w-64">Invariant</th>
                <th className="py-2 px-3 font-medium">Verification Details</th>
              </tr>
            </thead>
            <tbody>
              {invariants.checks.map((chk, idx) => (
                <tr
                  key={chk.id}
                  className={`border-b border-[--border-subtle] ${idx % 2 === 1 ? 'bg-[--bg-secondary]' : ''}`}
                >
                  <td className="py-2 px-3 font-mono text-xs font-semibold">
                    <span className={chk.passed ? 'text-risk-low' : 'text-risk-critical'}>
                      {chk.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-medium text-ink">{chk.name}</td>
                  <td className="py-2 px-3 text-ink-secondary">{chk.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4B. Sensitivity Analysis */}
        <div className="space-y-2.5 pt-3 border-t border-[--border-subtle]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-ink">
              2. One-at-a-Time ±50% Parameter Sensitivity Analysis
            </h3>
            <span className="text-xs font-mono text-ink-secondary">
              Mean Min Kendall&apos;s τ = {sensitivity_analysis.mean_min_kendall_tau.toFixed(4)}
            </span>
          </div>
          <div className="prose text-sm text-ink-secondary">
            <p>{sensitivity_analysis.methodology}</p>
            <p>
              <strong>Fragility assessment:</strong> {sensitivity_analysis.honest_assessment}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[--border-default] text-ink-secondary text-xs">
                  <th className="py-2 px-3 font-medium">Model Parameter</th>
                  <th className="py-2 px-3 font-medium">Persona</th>
                  <th className="py-2 px-3 text-right font-medium">Baseline</th>
                  <th className="py-2 px-3 text-right font-medium">-50% / +50%</th>
                  <th className="py-2 px-3 text-right font-medium">τ (-50%)</th>
                  <th className="py-2 px-3 text-right font-medium">τ (+50%)</th>
                  <th className="py-2 px-3 text-right font-medium">Max Top-10 Shifts</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {sensitivity_analysis.parameters.map((p, idx) => (
                  <tr
                    key={p.parameter}
                    className={`border-b border-[--border-subtle] ${idx % 2 === 1 ? 'bg-[--bg-secondary]' : ''}`}
                  >
                    <td className="py-2 px-3 font-sans text-ink">{p.label}</td>
                    <td className="py-2 px-3 text-ink-secondary">{p.persona_evaluated}</td>
                    <td className="py-2 px-3 text-right">{p.baseline_value}</td>
                    <td className="py-2 px-3 text-right text-ink-secondary">
                      {p.minus_50_pct_value} / {p.plus_50_pct_value}
                    </td>
                    <td className="py-2 px-3 text-right">{p.kendall_tau_minus_50.toFixed(3)}</td>
                    <td className="py-2 px-3 text-right">{p.kendall_tau_plus_50.toFixed(3)}</td>
                    <td className="py-2 px-3 text-right">{p.max_top_10_rank_shifts} / 10</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4C. CVSS-Only Comparison */}
        <div className="space-y-2.5 pt-3 border-t border-[--border-subtle]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-ink">
              3. Vidura Ranking vs CVSS-Only Ranking Disagreements
            </h3>
            <span className="text-xs font-mono text-ink-secondary">
              Kendall&apos;s τ vs CVSS-Only = {cvss_comparison.kendall_tau_vs_cvss.toFixed(4)}
            </span>
          </div>
          <div className="prose text-sm text-ink-secondary">
            <p>{cvss_comparison.summary}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[--border-default] text-ink-secondary text-xs">
                  <th className="py-2 px-3 font-medium">Asset</th>
                  <th className="py-2 px-3 text-center font-medium">CVSS</th>
                  <th className="py-2 px-3 text-center font-medium">Vidura Rank</th>
                  <th className="py-2 px-3 text-center font-medium">CVSS Rank</th>
                  <th className="py-2 px-3 font-medium">Computed Reason for Disagreement</th>
                </tr>
              </thead>
              <tbody>
                {cvss_comparison.biggest_disagreements.map((item, idx) => (
                  <tr
                    key={item.asset_id}
                    className={`border-b border-[--border-subtle] ${idx % 2 === 1 ? 'bg-[--bg-secondary]' : ''}`}
                  >
                    <td className="py-2 px-3 font-medium text-ink">
                      <div>{item.name}</div>
                      <div className="text-xs font-mono text-ink-tertiary">
                        {item.purdue_level} · {item.site.toUpperCase()} · Risk {item.vidura_risk_score.toFixed(1)}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center font-mono">{item.cvss.toFixed(1)}</td>
                    <td className="py-2 px-3 text-center font-mono font-semibold text-accent">
                      #{item.vidura_rank}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-ink-secondary">#{item.cvss_rank}</td>
                    <td className="py-2 px-3 text-ink-secondary">{item.computed_reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4D. Anomaly Detection Evaluations */}
        <div className="space-y-2.5 pt-3 border-t border-[--border-subtle]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-ink">
              4. Anomaly Detection Evaluations (Reported Separately)
            </h3>
            <span className="text-xs text-ink-tertiary">{anomaly_evaluations.separation_note}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-canvas-secondary/60 border border-[--border-subtle] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-[--border-subtle] pb-2">
                <span className="text-xs font-mono font-semibold text-ink">{synEval.label}</span>
                <span className="text-xs font-mono text-ink-secondary">{synEval.model}</span>
              </div>
              <div className="flex gap-6 text-xs font-mono">
                <span>Recall: {(synEval.recall * 100).toFixed(1)}% (5/6)</span>
                <span>Precision: {(synEval.precision * 100).toFixed(1)}%</span>
                <span>
                  TP:{synEval.confusion_matrix.true_positive} FP:{synEval.confusion_matrix.false_positive} TN:
                  {synEval.confusion_matrix.true_negative} FN:{synEval.confusion_matrix.false_negative}
                </span>
              </div>
              <div className="prose text-xs text-ink-secondary">
                <p>
                  {synEval.notes} ({synEval.train_windows.toLocaleString()} train windows;{' '}
                  {synEval.test_windows.toLocaleString()} test windows).
                </p>
              </div>
            </div>

            {haiEval && (
              <div className="bg-canvas-secondary/60 border border-[--border-subtle] rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-[--border-subtle] pb-2">
                  <span className="text-xs font-mono font-semibold text-ink">{haiEval.label}</span>
                  <span className="text-xs font-mono text-ink-secondary">Water Process P3 (7 tags)</span>
                </div>
                <div className="flex gap-6 text-xs font-mono">
                  <span>
                    Event Recall: {(haiEval.event_recall * 100).toFixed(1)}% ({haiEval.attack_events_detected}/
                    {haiEval.attack_events_total})
                  </span>
                  <span>
                    Point P/R: {(haiEval.pointwise_precision * 100).toFixed(1)}% /{' '}
                    {(haiEval.pointwise_recall * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="prose text-xs text-ink-secondary">
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
      <section className="bg-white border border-[--border-default] rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-[--border-default] pb-2.5">
          <h2 className="text-base font-semibold text-ink">
            Full Model Assumptions &amp; Justifications
          </h2>
          <span className="text-xs font-mono text-ink-secondary">
            Tagged &quot;Scenario assumption&quot;
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[--border-default] text-ink-secondary text-xs">
                <th className="py-2 px-3 w-48 font-medium">Parameter</th>
                <th className="py-2 px-3 w-56 font-medium">Value</th>
                <th className="py-2 px-3 font-medium">Justification</th>
                <th className="py-2 px-3 w-64 font-medium">Source / Grounding</th>
              </tr>
            </thead>
            <tbody>
              {assumptions_table.map((row, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-[--border-subtle] align-top ${
                    idx % 2 === 1 ? 'bg-[--bg-secondary]' : ''
                  }`}
                >
                  <td className="py-2 px-3 font-medium text-ink">{row.parameter}</td>
                  <td className="py-2 px-3 font-mono text-xs text-ink">{row.value}</td>
                  <td className="py-2 px-3 text-ink-secondary">{row.justification}</td>
                  <td className="py-2 px-3 text-ink-tertiary text-xs">{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Data Sources */}
      <section className="bg-white border border-[--border-default] rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-[--border-default] pb-2.5">
          <h2 className="text-base font-semibold text-ink">
            Cached Threat Intelligence &amp; Research Data Sources ({data_sources.length} files)
          </h2>
          <span className="text-xs font-mono text-ink-tertiary">data/cache/manifest.json</span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-[--border-default] text-ink-secondary text-xs">
                <th className="py-2 px-3 font-medium">Dataset File</th>
                <th className="py-2 px-3 font-medium">Description</th>
                <th className="py-2 px-3 text-right font-medium">Records</th>
                <th className="py-2 px-3 font-medium">Fetched At (UTC)</th>
                <th className="py-2 px-3 font-medium">Source Provenance</th>
              </tr>
            </thead>
            <tbody>
              {data_sources.map((src, idx) => (
                <tr
                  key={src.key}
                  className={`border-b border-[--border-subtle] ${idx % 2 === 1 ? 'bg-[--bg-secondary]' : ''}`}
                >
                  <td className="py-2 px-3 font-mono text-xs text-ink">{src.file}</td>
                  <td className="py-2 px-3 text-ink-secondary">{src.description}</td>
                  <td className="py-2 px-3 text-right font-mono text-xs text-ink">
                    {src.record_count.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 font-mono text-xs text-ink-tertiary">
                    {src.fetched_at ? src.fetched_at.slice(0, 19).replace('T', ' ') : '—'}
                  </td>
                  <td className="py-2 px-3 text-xs text-ink-tertiary max-w-xs truncate" title={src.source}>
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
