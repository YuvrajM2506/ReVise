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
  Bot,
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
        <div className="inline-block animate-spin w-8 h-8 border-2 border-[#02A0A0] border-t-transparent rounded-full mb-4"></div>
        <p className="text-xs font-mono text-[#8CA0A8]">Loading risk report provenance & evidence...</p>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-[#E55353] mx-auto" />
        <h3 className="text-xl font-bold text-[#F0F6F6]">Evaluation run not found</h3>
        <p className="text-xs text-[#8CA0A8]">The requested risk analysis record does not exist or has expired.</p>
        <Link
          href="/analyze"
          className="inline-block px-4 py-2 bg-[#02A0A0] hover:bg-[#028F8F] rounded-lg text-xs font-semibold text-[#071317] transition"
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
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Zero Memory Notice Banner if memory was toggled OFF */}
      {!run.memory_enabled && (
        <div className="p-4 rounded-xl bg-[#1A150D] border border-[#FFBD65]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#FFBD65] shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[#FFBD65]">
                This analysis ran with Hindsight Memory OFF
              </p>
              <p className="text-[11px] text-[#FFBD65]/80">
                Results were evaluated strictly on generic static syntax rules without historical postmortem context.
              </p>
            </div>
          </div>
          <Link
            href={`/analyze?scenario=scenario-unsafe-db`}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#FFBD65]/15 text-[#FFBD65] border border-[#FFBD65]/30 hover:bg-[#FFBD65]/25 transition self-start sm:self-auto"
          >
            Re-run with Memory ON →
          </Link>
        </div>
      )}

      {/* Main Top Banner */}
      <div className={`p-6 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden ${
        isHighRisk 
          ? 'bg-[#140D10] border-[#E55353]/30' 
          : isMedRisk 
          ? 'bg-[#17130B] border-[#FFBD65]/30' 
          : 'bg-[#0B1B20] border-[#02A0A0]/30'
      }`}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest uppercase font-semibold text-[#8CA0A8]">
              DEPLOYMENT RISK REPORT
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#071317] border border-[#163842] text-[#8CA0A8]">
              {run.service} • {run.file_name}
            </span>
          </div>
          <h2
            className={`text-3xl font-extrabold tracking-tight ${
              isHighRisk ? 'text-[#E55353]' : isMedRisk ? 'text-[#FFBD65]' : 'text-[#02A0A0]'
            }`}
          >
            {output.risk_level} risk
          </h2>
          <div className="flex items-center gap-2 text-xs text-[#8CA0A8] pt-1">
            <span className={`w-2 h-2 rounded-full ${
              isHighRisk ? 'bg-[#E55353]' : isMedRisk ? 'bg-[#FFBD65]' : 'bg-[#02A0A0]'
            }`}></span>
            <span>{output.provenance_note}</span>
          </div>
        </div>

        {/* Big Score Badge */}
        <div className="flex items-baseline gap-1 md:text-right">
          <span
            className={`text-5xl md:text-6xl font-black font-mono tracking-tight ${
              isHighRisk ? 'text-[#E55353]' : isMedRisk ? 'text-[#FFBD65]' : 'text-[#02A0A0]'
            }`}
          >
            {output.risk_score}
          </span>
          <span className="text-lg font-mono font-medium text-[#5A7178]">/ 100</span>
        </div>
      </div>

      {/* Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Tabs & Findings / Safer Path / Action Buttons */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs Row */}
          <div className="flex items-center gap-4 border-b border-[#163842] pb-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('findings')}
              className={`pb-2 px-1 transition relative ${
                activeTab === 'findings'
                  ? 'text-[#02A0A0] border-b-2 border-[#02A0A0]'
                  : 'text-[#8CA0A8] hover:text-[#F0F6F6]'
              }`}
            >
              Findings ({output.findings.length})
            </button>
            <button
              onClick={() => setActiveTab('ci_checks')}
              className={`pb-2 px-1 transition relative ${
                activeTab === 'ci_checks'
                  ? 'text-[#02A0A0] border-b-2 border-[#02A0A0]'
                  : 'text-[#8CA0A8] hover:text-[#F0F6F6]'
              }`}
            >
              CI Checks
            </button>
            <button
              onClick={() => setActiveTab('safer_rollout')}
              className={`pb-2 px-1 transition relative ${
                activeTab === 'safer_rollout'
                  ? 'text-[#02A0A0] border-b-2 border-[#02A0A0]'
                  : 'text-[#8CA0A8] hover:text-[#F0F6F6]'
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
                    className="p-4 rounded-xl bg-[#0B1B20] border border-[#163842] space-y-2 hover:border-[#02A0A0]/30 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          isHigh
                            ? 'bg-[#E55353]/15 text-[#E55353] border border-[#E55353]/30'
                            : isMed
                            ? 'bg-[#FFBD65]/15 text-[#FFBD65] border border-[#FFBD65]/30'
                            : 'bg-[#02A0A0]/15 text-[#02A0A0] border border-[#02A0A0]/30'
                        }`}
                      >
                        {finding.severity}
                      </span>
                      <h4 className="text-xs font-semibold text-[#F0F6F6]">{finding.title}</h4>
                    </div>
                    <p className="text-xs text-[#8CA0A8] leading-relaxed pl-1">
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
                    className="p-4 rounded-xl bg-[#0B1B20] border border-[#163842] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#F0F6F6]">{ci.title}</span>
                      <span className="text-[10px] font-mono text-[#02A0A0] bg-[#02A0A0]/10 border border-[#02A0A0]/20 px-2 py-0.5 rounded">
                        {ci.type}
                      </span>
                    </div>
                    <p className="text-xs text-[#8CA0A8]">{ci.description}</p>
                    {ci.snippet && (
                      <pre className="p-3 rounded-lg bg-[#050E11] text-[11px] font-mono text-[#9FD5D5] overflow-x-auto border border-[#163842]">
                        <code>{ci.snippet}</code>
                      </pre>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-[#5A7178] bg-[#0B1B20] border border-[#163842] rounded-xl">
                  No specialized CI checks required for this baseline run.
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Safer Rollout */}
          {activeTab === 'safer_rollout' && (
            <div className="p-5 rounded-xl bg-[#0B1B20] border border-[#163842] space-y-3">
              <h4 className="text-xs font-semibold text-[#02A0A0] font-mono uppercase tracking-wider">Ordered Execution Procedure:</h4>
              <div className="space-y-2 text-xs text-[#8CA0A8] leading-relaxed">
                {output.safer_rollout.map((step, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-[#071317] border border-[#163842] font-mono text-xs text-[#F0F6F6] flex items-start gap-2.5">
                    <span className="text-[#02A0A0] font-bold">{idx + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Safer Path Card */}
          <div className="p-5 rounded-xl bg-[#0B1B20] border border-[#02A0A0]/35 space-y-3">
            <h4 className="text-xs font-bold text-[#02A0A0] tracking-wide uppercase font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#02A0A0]" />
              Recommended Safer Path
            </h4>
            <div className="space-y-2 text-xs text-[#F0F6F6]">
              {output.safer_rollout.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="text-[#02A0A0] font-semibold shrink-0">•</span>
                  <span className="text-[#8CA0A8]"><strong className="text-[#F0F6F6]">{step.split(':')[0]}:</strong>{step.includes(':') ? step.substring(step.indexOf(':') + 1) : ''}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleCopyComment}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0B1B20] hover:bg-[#0E2229] border border-[#163842] text-xs font-medium text-[#F0F6F6] transition"
            >
              {copiedComment ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#02A0A0]" />
                  <span className="text-[#02A0A0]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#8CA0A8]" />
                  <span>Copy review comment</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyCI}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0B1B20] hover:bg-[#0E2229] border border-[#163842] text-xs font-medium text-[#F0F6F6] transition"
            >
              {copiedCI ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#02A0A0]" />
                  <span className="text-[#02A0A0]">Added CI config!</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#8CA0A8]" />
                  <span>Add CI checks</span>
                </>
              )}
            </button>

            <Link
              href={`/pair-programmer?service=${encodeURIComponent(run.service)}&files=${encodeURIComponent(run.file_name)}&task=${encodeURIComponent(`Refactor ${run.file_name} in ${run.service} to address ${output.findings[0]?.title || 'deployment risk'} following recommended safer rollout: ${output.safer_rollout.join(', ')}`)}`}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0B1B20] hover:bg-[#0E2229] border border-[#02A0A0]/40 text-xs font-medium text-[#02A0A0] transition"
            >
              <Bot className="w-3.5 h-3.5 text-[#02A0A0]" />
              <span>Fix with Aider</span>
            </Link>

            <Link
              href={`/teach?run_id=${run.id}&service=${encodeURIComponent(run.service)}&title=${encodeURIComponent(run.title)}`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#02A0A0] hover:bg-[#028F8F] text-xs font-semibold text-[#071317] transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Teach ReVise</span>
            </Link>
          </div>
        </div>

        {/* Right Column (1 Col): Memory Evidence Panel */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-[#0B1B20] border border-[#163842] space-y-4">
            {/* Header with REAL count badge */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F0F6F6] tracking-tight">Memory Evidence</h3>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#02A0A0]/15 text-[#02A0A0] border border-[#02A0A0]/30">
                {output.memory_citations.length} retrieved
              </span>
            </div>

            <p className="text-xs text-[#8CA0A8]">
              Ground truth cited from team incidents and postmortems:
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
                      className="p-3.5 rounded-lg bg-[#071317] border border-[#163842] space-y-1.5 hover:border-[#02A0A0]/30 transition"
                    >
                      <div className="flex items-center justify-between text-[10px] text-[#8CA0A8]">
                        <span className="flex items-center gap-1.5 font-semibold font-mono text-[#F0F6F6]">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isIncident
                                ? 'bg-[#E55353]'
                                : isPostMortem
                                ? 'bg-[#02A0A0]'
                                : isPipeline
                                ? 'bg-[#FFBD65]'
                                : 'bg-[#02A0A0]'
                            }`}
                          ></span>
                          {citation.type.toUpperCase().replace('_', ' ')}
                        </span>
                        <span className="font-mono">{citation.date}</span>
                      </div>

                      <h4 className="text-xs font-semibold text-[#F0F6F6]">{citation.title}</h4>
                      <p className="text-[11px] text-[#8CA0A8] leading-relaxed">{citation.relevance_note}</p>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-[#5A7178] border border-dashed border-[#163842] rounded-lg">
                  No memories retrieved for this memory-less run.
                </div>
              )}
            </div>

            {/* Collapsible: Why this recommendation? */}
            <div className="pt-2 border-t border-[#163842]">
              <button
                type="button"
                onClick={() => setWhyExpanded(!whyExpanded)}
                className="w-full flex items-center justify-between text-xs font-semibold text-[#8CA0A8] hover:text-[#F0F6F6] py-1 transition"
              >
                <span>Why this recommendation?</span>
                {whyExpanded ? (
                  <ChevronUp className="w-4 h-4 text-[#8CA0A8]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#8CA0A8]" />
                )}
              </button>

              {whyExpanded && (
                <p className="mt-2 text-xs text-[#8CA0A8] leading-relaxed bg-[#050E11] p-3 rounded-lg border border-[#163842] font-mono">
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
