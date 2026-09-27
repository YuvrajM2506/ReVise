'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Database,
  ArrowRight,
  GitPullRequest,
  CheckCircle2,
  FileCode,
  Info,
} from 'lucide-react';
import { EvaluationRun, Finding, CICheckRecommendation } from '@/lib/types';

export default function RiskReportPage() {
  const params = useParams();
  const router = useRouter();
  const [run, setRun] = useState<EvaluationRun | null>(null);
  const [activeTab, setActiveTab] = useState<'findings' | 'ci_checks' | 'safer_rollout'>('findings');
  const [whyExpanded, setWhyExpanded] = useState(true);
  const [copiedComment, setCopiedComment] = useState(false);
  const [copiedCI, setCopiedCI] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/runs/${params.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.run) setRun(data.run);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-20 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
        <p className="text-sm text-slate-400">Loading risk report...</p>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-pink-500 mx-auto" />
        <h3 className="text-xl font-bold text-white">Evaluation run not found</h3>
        <p className="text-xs text-slate-400">The requested risk analysis does not exist.</p>
        <Link
          href="/analyze"
          className="inline-block px-4 py-2 bg-indigo-600 rounded-lg text-xs font-semibold text-white"
        >
          Run New Analysis
        </Link>
      </div>
    );
  }

  const { output } = run;
  const isHighRisk = output.risk_score >= 70;
  const isMedRisk = output.risk_score >= 40 && output.risk_score < 70;

  const handleCopyComment = () => {
    const commentMarkdown = `### 🛡️ ReVise Risk Assessment (${output.risk_score}/100 - ${output.risk_level} Risk)
**Provenance**: ${output.provenance_note}

#### Key Findings:
${output.findings.map(f => `- **[${f.severity}]** ${f.title}\n  ${f.description}`).join('\n')}

#### Recommended Safer Rollout:
${output.safer_rollout.map(s => s).join('\n')}

${output.memory_citations.length > 0 ? `\n#### Historical Evidence Cited:\n` + output.memory_citations.map(m => `- **${m.title}** (${m.type}, ${m.date}): ${m.relevance_note}`).join('\n') : ''}
`;
    navigator.clipboard.writeText(commentMarkdown);
    setCopiedComment(true);
    setTimeout(() => setCopiedComment(false), 2000);
  };

  const handleCopyCI = () => {
    const ciYaml = `# ReVise Generated Guardrails for ${run.service}
name: revise-deployment-guardrail
on: [pull_request]
jobs:
  validate-schema:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate Zero-Downtime PostgreSQL Rules
        run: |
          echo "Verifying CONCURRENTLY index flags and nullable migration rules..."
`;
    navigator.clipboard.writeText(ciYaml);
    setCopiedCI(true);
    setTimeout(() => setCopiedCI(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
      {/* Zero Memory Notice Banner if memory was toggled OFF */}
      {!run.memory_enabled && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-300">
                This analysis used no historical memory
              </p>
              <p className="text-[11px] text-amber-400/80">
                Results were evaluated strictly on generic static syntax rules. Contrast this with the memory-grounded evaluation.
              </p>
            </div>
          </div>
          <Link
            href={`/analyze?scenario=scenario-unsafe-db`}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition"
          >
            Re-run with Memory ON →
          </Link>
        </div>
      )}

      {/* Main Top Banner matching Screenshot 3 */}
      <div className="glow-card rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2">
          <span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-slate-400">
            DEPLOYMENT RISK
          </span>
          <h2
            className={`text-3xl font-extrabold tracking-tight ${
              isHighRisk ? 'text-pink-500' : isMedRisk ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {output.risk_level} risk
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-300 pt-1">
            <span className="w-2 h-2 rounded-full bg-pink-500"></span>
            <span>{output.provenance_note}</span>
          </div>
        </div>

        {/* Big Score Badge */}
        <div className="flex items-baseline gap-1 md:text-right">
          <span
            className={`text-5xl md:text-6xl font-black font-mono tracking-tight ${
              isHighRisk ? 'text-pink-500' : isMedRisk ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {output.risk_score}
          </span>
          <span className="text-lg font-mono font-medium text-slate-500">/ 100</span>
        </div>
      </div>

      {/* Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Tabs & Findings / Safer Path / Action Buttons */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs Row */}
          <div className="flex items-center gap-4 border-b border-white/10 pb-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('findings')}
              className={`pb-2 px-1 transition ${
                activeTab === 'findings'
                  ? 'text-indigo-400 border-b-2 border-indigo-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Findings ({output.findings.length})
            </button>
            <button
              onClick={() => setActiveTab('ci_checks')}
              className={`pb-2 px-1 transition ${
                activeTab === 'ci_checks'
                  ? 'text-indigo-400 border-b-2 border-indigo-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              CI Checks
            </button>
            <button
              onClick={() => setActiveTab('safer_rollout')}
              className={`pb-2 px-1 transition ${
                activeTab === 'safer_rollout'
                  ? 'text-indigo-400 border-b-2 border-indigo-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Safer Rollout
            </button>
          </div>

          {/* Tab 1: Findings */}
          {activeTab === 'findings' && (
            <div className="space-y-3">
              {output.findings.map(finding => {
                const isHigh = finding.severity === 'HIGH';
                const isMed = finding.severity === 'MEDIUM';

                return (
                  <div
                    key={finding.id}
                    className="p-4 rounded-xl bg-[#0c0d1b] border border-white/5 space-y-1.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          isHigh
                            ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                            : isMed
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {finding.severity}
                      </span>
                      <h4 className="text-xs font-semibold text-white">{finding.title}</h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed pl-1">
                      {finding.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: CI Checks */}
          {activeTab === 'ci_checks' && (
            <div className="space-y-3">
              {output.ci_checks.length > 0 ? (
                output.ci_checks.map(ci => (
                  <div
                    key={ci.id}
                    className="p-4 rounded-xl bg-[#0c0d1b] border border-white/5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{ci.title}</span>
                      <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                        {ci.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{ci.description}</p>
                    {ci.snippet && (
                      <pre className="p-3 rounded-lg bg-[#070811] text-[11px] font-mono text-indigo-200 overflow-x-auto border border-white/5">
                        <code>{ci.snippet}</code>
                      </pre>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  No specialized CI checks required for this baseline run.
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Safer Rollout */}
          {activeTab === 'safer_rollout' && (
            <div className="p-4 rounded-xl bg-[#0c0d1b] border border-white/5 space-y-2">
              <h4 className="text-xs font-semibold text-indigo-300">Ordered Execution Procedure:</h4>
              <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                {output.safer_rollout.map((step, idx) => (
                  <div key={idx} className="p-2 rounded bg-white/5 font-mono text-xs">
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Safer Path Card (Matching Screenshot 3) */}
          <div className="p-4 rounded-xl bg-[#0c181f] border border-teal-500/30 space-y-2.5">
            <h4 className="text-xs font-bold text-teal-400 tracking-wide uppercase">
              Recommended Safer Path
            </h4>
            <div className="space-y-1.5 text-xs text-slate-200">
              {output.safer_rollout.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-teal-400 font-semibold shrink-0">•</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleCopyComment}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#14162e] hover:bg-[#1a1d3d] border border-white/10 text-xs font-medium text-slate-200 transition"
            >
              {copiedComment ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy review comment</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyCI}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#14162e] hover:bg-[#1a1d3d] border border-white/10 text-xs font-medium text-slate-200 transition"
            >
              {copiedCI ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Added CI config!</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Add CI checks</span>
                </>
              )}
            </button>

            <Link
              href={`/teach?run_id=${run.id}&service=${encodeURIComponent(run.service)}&title=${encodeURIComponent(run.title)}`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow-glow-sm shadow-indigo-500/20 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Teach ReVise</span>
            </Link>
          </div>
        </div>

        {/* Right Column (1 Col): Memory Evidence Panel */}
        <div className="space-y-4">
          <div className="glow-card p-5 rounded-2xl border border-white/10 space-y-4">
            {/* Header with REAL count badge */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-tight">Memory Evidence</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {output.memory_citations.length} memories retrieved
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Why ReVise made this recommendation:
            </p>

            {/* List of Retrieved Memories */}
            <div className="space-y-3">
              {output.memory_citations.length > 0 ? (
                output.memory_citations.map(citation => {
                  const isIncident = citation.type === 'incident';
                  const isPostMortem = citation.type === 'post_mortem';
                  const isPipeline = citation.type === 'pipeline_failure';

                  return (
                    <div
                      key={citation.memory_id}
                      className="p-3 rounded-xl bg-[#090a16] border border-white/5 space-y-1 hover:border-white/15 transition"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isIncident
                                ? 'bg-pink-400'
                                : isPostMortem
                                ? 'bg-emerald-400'
                                : isPipeline
                                ? 'bg-amber-400'
                                : 'bg-indigo-400'
                            }`}
                          ></span>
                          {citation.type.toUpperCase().replace('_', ' ')}
                        </span>
                        <span>{citation.date}</span>
                      </div>

                      <h4 className="text-xs font-semibold text-white">{citation.title}</h4>
                      <p className="text-[11px] text-slate-400">{citation.relevance_note}</p>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-white/10 rounded-xl">
                  No memories retrieved for this memory-less run.
                </div>
              )}
            </div>

            {/* Collapsible: Why this recommendation? */}
            <div className="pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setWhyExpanded(!whyExpanded)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white py-1 transition"
              >
                <span>Why this recommendation?</span>
                {whyExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {whyExpanded && (
                <p className="mt-2 text-xs text-slate-400 leading-relaxed bg-[#070811] p-3 rounded-lg border border-white/5">
                  {output.why_recommendation}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
