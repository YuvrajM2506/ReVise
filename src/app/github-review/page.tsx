'use client';

import React, { useState, Suspense } from 'react';
import {
  Github,
  Sparkles,
  Search,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  Clock,
  Database,
  ArrowRight,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { StructuredAnalysisOutput, EvaluationRun } from '@/lib/types';

interface GitHubAnalyzeResponse {
  success: boolean;
  run_id: string;
  run: EvaluationRun;
  review: StructuredAnalysisOutput;
  diff_truncated: boolean;
  files_analyzed_count: number;
  github_comment_posted: boolean;
  github_review_id: number | null;
  retrieval_latency_ms: number;
  total_latency_ms: number;
  error?: string;
}

interface AnalyzedPrDetails {
  owner: string;
  repo: string;
  pullNumber: number;
}

interface TeachOutcomeResponse {
  success: boolean;
  event: string;
  owner: string;
  repo: string;
  pullNumber: number;
  memory_id: string;
  is_reinforced?: boolean;
  confidence_score?: number;
  message: string;
  error?: string;
}

const SAMPLE_PRS = [
  { label: 'octocat/Hello-World #11288', url: 'https://github.com/octocat/Hello-World/pull/11288' },
  { label: 'actions/checkout #2588', url: 'https://github.com/actions/checkout/pull/2588' },
  { label: 'YuvrajM2506/ReVise #1', url: 'https://github.com/YuvrajM2506/ReVise/pull/1' },
];

function parseGitHubPrUrl(rawUrl: string): AnalyzedPrDetails | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Match full URL: https://github.com/owner/repo/pull/123
  const urlPattern = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)\/pull\/(\d+)/i;
  const match = trimmed.match(urlPattern);

  if (match) {
    const owner = match[1];
    const repo = match[2];
    const pullNumber = parseInt(match[3], 10);
    if (owner && repo && !isNaN(pullNumber) && pullNumber > 0) {
      return { owner, repo, pullNumber };
    }
  }

  // Match short format: owner/repo#123 or owner/repo/pull/123
  const shortPattern = /^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:#|\/pull\/)(\d+)$/i;
  const shortMatch = trimmed.match(shortPattern);
  if (shortMatch) {
    const owner = shortMatch[1];
    const repo = shortMatch[2];
    const pullNumber = parseInt(shortMatch[3], 10);
    if (owner && repo && !isNaN(pullNumber) && pullNumber > 0) {
      return { owner, repo, pullNumber };
    }
  }

  return null;
}

function GitHubReviewContent() {
  const [prUrl, setPrUrl] = useState('https://github.com/octocat/Hello-World/pull/11288');
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<GitHubAnalyzeResponse | null>(null);
  const [analyzedPr, setAnalyzedPr] = useState<AnalyzedPrDetails | null>(null);
  const [copiedComment, setCopiedComment] = useState(false);
  const [whyExpanded, setWhyExpanded] = useState(true);

  // Teach ReVise State
  const [isTeaching, setIsTeaching] = useState(false);
  const [teachSuccess, setTeachSuccess] = useState<{
    message: string;
    memory_id?: string;
    confidence_score?: number;
    is_reinforced?: boolean;
  } | null>(null);
  const [teachError, setTeachError] = useState<string | null>(null);

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setTeachSuccess(null);
    setTeachError(null);

    const parsed = parseGitHubPrUrl(prUrl);
    if (!parsed) {
      setErrorMessage('Please enter a valid GitHub Pull Request URL (e.g. https://github.com/owner/repo/pull/123)');
      return;
    }

    setIsAnalyzing(true);
    setLoadingStep('Fetching PR metadata and diff from GitHub API...');

    try {
      if (memoryEnabled) {
        setLoadingStep('Querying Hindsight memory bank for related incidents...');
      }

      const response = await fetch('/api/github/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: parsed.owner,
          repo: parsed.repo,
          pullNumber: parsed.pullNumber,
          bankId: 'revise',
          memoryEnabled: memoryEnabled,
          postToGitHub: false,
        }),
      });

      const data: GitHubAnalyzeResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Analysis failed with status ${response.status}`);
      }

      setResult(data);
      setAnalyzedPr(parsed);
    } catch (err: any) {
      console.error('GitHub review error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred during PR evaluation.');
    } finally {
      setIsAnalyzing(false);
      setLoadingStep('');
    }
  };

  const handleCopyReviewComment = () => {
    if (!result) return;
    const { review, run } = result;

    const markdown = `## 🛡️ ReVise Code Review: ${run.service} #${prUrl.split('/').pop()}
**Risk Score**: ${review.risk_score}/100 (${review.risk_level} Risk)
**Provenance**: ${review.provenance_note}

### 🔍 Key Findings:
${review.findings.map(f => `- **[${f.severity}]** ${f.title}\n  ${f.description}`).join('\n\n')}

${review.safer_rollout.length > 0 ? `### 🚀 Recommended Safer Rollout:\n${review.safer_rollout.map(s => `- ${s}`).join('\n')}\n` : ''}
${review.memory_citations.length > 0 ? `### 🧠 Historical Memory Evidence:\n${review.memory_citations.map(m => `- **${m.title}** (${m.type}, ${m.date}): ${m.relevance_note}`).join('\n')}\n` : ''}
---
*Generated with ReVise AI Code Review Agent (Hindsight Memory & Groq LPU).*`;

    navigator.clipboard.writeText(markdown);
    setCopiedComment(true);
    setTimeout(() => setCopiedComment(false), 2000);
  };

  const handleTeachReVise = async () => {
    if (!result || isTeaching) return;

    const prInfo = analyzedPr || parseGitHubPrUrl(prUrl);
    if (!prInfo) {
      setTeachError('Could not identify target PR details for outcome recording.');
      return;
    }

    setIsTeaching(true);
    setTeachError(null);
    setTeachSuccess(null);

    try {
      const response = await fetch('/api/github/outcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: prInfo.owner,
          repo: prInfo.repo,
          pullNumber: prInfo.pullNumber,
          event: 'pr_merged',
          bankId: 'revise',
          metadata: {
            risk_score: result.review.risk_score,
            risk_level: result.review.risk_level,
            run_id: result.run_id,
            source: 'github-review-ui',
          },
        }),
      });

      const data: TeachOutcomeResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to record outcome in Hindsight.');
      }

      setTeachSuccess({
        message: 'ReVise learned from this PR outcome.',
        memory_id: data.memory_id,
        confidence_score: data.confidence_score,
        is_reinforced: data.is_reinforced,
      });
    } catch (err: any) {
      console.error('Teach ReVise error:', err);
      setTeachError(err.message || 'Failed to record PR outcome.');
    } finally {
      setIsTeaching(false);
    }
  };

  const parsedCurrent = parseGitHubPrUrl(prUrl);

  return (
    <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-indigo-400">
            GITHUB REPOSITORY INTELLIGENCE
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            LIVE PR REVIEW
          </span>
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight mt-1">GitHub PR Review</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Analyze public GitHub pull requests in real time using Hindsight memory to detect production risks before merge.
        </p>
      </div>

      {/* Input Card */}
      <form onSubmit={handleAnalyze} className="glow-card p-6 rounded-2xl border border-white/10 space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Github className="w-4 h-4 text-white" />
              GitHub Pull Request URL
            </span>
            {parsedCurrent && (
              <span className="text-[11px] font-normal text-indigo-400 font-mono">
                {parsedCurrent.owner}/{parsedCurrent.repo} #{parsedCurrent.pullNumber}
              </span>
            )}
          </label>

          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={prUrl}
                onChange={e => setPrUrl(e.target.value)}
                placeholder="https://github.com/owner/repository/pull/123"
                className="w-full pl-10 pr-4 py-2.5 bg-[#090a16] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isAnalyzing}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide shadow-glow-sm shadow-indigo-500/30 transition disabled:opacity-50 shrink-0"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze with Memory</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Sample PRs & Memory Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-500">Quick Samples:</span>
            {SAMPLE_PRS.map(sample => (
              <button
                key={sample.url}
                type="button"
                onClick={() => {
                  setPrUrl(sample.url);
                  setErrorMessage(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-mono text-slate-300 hover:text-white transition"
              >
                {sample.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Hindsight Memory</span>
            <button
              type="button"
              onClick={() => setMemoryEnabled(!memoryEnabled)}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition ${
                memoryEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-700/50 text-slate-400 border border-white/10'
              }`}
            >
              {memoryEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      </form>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-start gap-3 animate-in fade-in duration-200">
          <AlertTriangle className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-pink-300">Analysis Error</p>
            <p className="text-pink-400/90 mt-0.5 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Loading State Card */}
      {isAnalyzing && (
        <div className="glow-card p-12 rounded-2xl border border-white/10 text-center space-y-4 animate-in fade-in duration-300">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Evaluating GitHub Pull Request</h3>
            <p className="text-xs text-indigo-300 font-mono">{loadingStep}</p>
          </div>
          <p className="text-[11px] text-slate-500 max-w-md mx-auto">
            Extracting PR diff, recalling scoped historical memories via Hindsight, and synthesizing structured risk findings.
          </p>
        </div>
      )}

      {/* Results Section */}
      {result && !isAnalyzing && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top Risk Banner */}
          <div className="glow-card rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-slate-400">
                  DEPLOYMENT RISK REPORT
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-slate-300 border border-white/10">
                  {result.run.service}
                </span>
              </div>

              <h3
                className={`text-3xl font-extrabold tracking-tight ${
                  result.review.risk_score >= 70
                    ? 'text-pink-500'
                    : result.review.risk_score >= 40
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {result.review.risk_level} risk ({result.review.risk_score}/100)
              </h3>

              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                {result.review.summary}
              </p>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                <span>{result.review.provenance_note}</span>
              </div>
            </div>

            {/* Metrics Telemetry */}
            <div className="flex flex-col gap-2 md:text-right shrink-0 font-mono text-xs">
              <div className="flex md:justify-end items-center gap-2">
                <span className="text-slate-500">Latency:</span>
                <span className="text-indigo-300 font-bold">{result.total_latency_ms}ms</span>
              </div>
              <div className="flex md:justify-end items-center gap-2">
                <span className="text-slate-500">Memory Retrieval:</span>
                <span className="text-emerald-400 font-bold">{result.retrieval_latency_ms}ms</span>
              </div>
              <div className="flex md:justify-end items-center gap-2">
                <span className="text-slate-500">Files Analyzed:</span>
                <span className="text-slate-200">{result.files_analyzed_count} files</span>
              </div>
              {result.diff_truncated && (
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Large Diff Truncated
                </span>
              )}
            </div>
          </div>

          {/* Teach ReVise Success Notification Banner */}
          {teachSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold">{teachSuccess.message}</span>
                  {teachSuccess.memory_id && (
                    <span className="ml-2 font-mono text-[11px] text-emerald-400/80">
                      ID: {teachSuccess.memory_id} (Confidence: {teachSuccess.confidence_score || 85}%)
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTeachSuccess(null)}
                className="text-slate-400 hover:text-white text-[11px] ml-3"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Teach ReVise Error Banner */}
          {teachError && (
            <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-between text-xs text-pink-300 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-pink-400 shrink-0" />
                <span>{teachError}</span>
              </div>
              <button
                type="button"
                onClick={() => setTeachError(null)}
                className="text-slate-400 hover:text-white text-[11px]"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Two-Column Grid: AI Findings vs. Hindsight Memory Evidence */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2 Cols): AI Findings & Remediation */}
            <div className="lg:col-span-2 space-y-6">
              {/* Findings Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-indigo-400" />
                    AI Findings ({result.review.findings.length})
                  </h4>
                  <span className="text-[11px] text-slate-500">Synthesized via Groq LPU</span>
                </div>

                <div className="space-y-3">
                  {result.review.findings.map(finding => {
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
                          <h5 className="text-xs font-semibold text-white">{finding.title}</h5>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed pl-1">
                          {finding.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recommended Safer Path */}
              {result.review.safer_rollout.length > 0 && (
                <div className="p-4 rounded-xl bg-[#0c181f] border border-teal-500/30 space-y-2.5">
                  <h4 className="text-xs font-bold text-teal-400 tracking-wide uppercase flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-400" />
                    Recommended Safer Path
                  </h4>
                  <div className="space-y-1.5 text-xs text-slate-200">
                    {result.review.safer_rollout.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-teal-400 font-semibold shrink-0">•</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyReviewComment}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#14162e] hover:bg-[#1a1d3d] border border-white/10 text-xs font-medium text-slate-200 transition"
                >
                  {copiedComment ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Review Markdown</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isTeaching}
                  onClick={handleTeachReVise}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-xs font-medium text-indigo-200 transition disabled:opacity-50"
                >
                  {isTeaching ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      <span>Teaching ReVise...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Teach ReVise</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column (1 Col): Hindsight Memory Evidence */}
            <div className="space-y-4">
              <div className="glow-card p-5 rounded-2xl border border-white/10 space-y-4">
                {/* Header with REAL count badge */}
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300 flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-400" />
                    Memory Evidence
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {result.review.memory_citations.length} retrieved
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Causal organizational memories queried from Hindsight to ground this review:
                </p>

                {/* List of Retrieved Memories */}
                <div className="space-y-3">
                  {result.review.memory_citations.length > 0 ? (
                    result.review.memory_citations.map(citation => {
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

                          <h5 className="text-xs font-semibold text-white">{citation.title}</h5>
                          <p className="text-[11px] text-slate-400">{citation.relevance_note}</p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-white/10 rounded-xl">
                      No matching historical memories found for this change signature.
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
                      {result.review.why_recommendation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State when no evaluation has run yet */}
      {!result && !isAnalyzing && !errorMessage && (
        <div className="glow-card p-12 rounded-2xl border border-white/10 text-center space-y-3">
          <Github className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Ready to Review Pull Request</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Enter any public GitHub pull request URL above and click <strong>Analyze with Memory</strong>. ReVise will pull the PR diff, query Hindsight for past outages on similar code, and generate structured risk findings.
          </p>
        </div>
      )}
    </div>
  );
}

export default function GitHubReviewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 text-xs">Loading GitHub reviewer...</div>}>
      <GitHubReviewContent />
    </Suspense>
  );
}
