'use client';

import React, { useState } from 'react';
import {
  Github,
  Database,
  History,
  GitMerge,
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  Info,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface BackfillPrResult {
  pullNumber: number;
  title: string;
  memory_id?: string;
  status?: 'created' | 'already_exists' | string;
  error?: string;
}

interface BackfillApiResponse {
  success: boolean;
  owner: string;
  repo: string;
  requested: number;
  processed: number;
  memories_created: number;
  results: BackfillPrResult[];
  error?: string;
}

const SAMPLE_REPOS = [
  { owner: 'YuvrajM2506', repo: 'ReVise', label: 'YuvrajM2506/ReVise' },
  { owner: 'octocat', repo: 'Hello-World', label: 'octocat/Hello-World' },
  { owner: 'facebook', repo: 'react', label: 'facebook/react' },
  { owner: 'vercel', repo: 'next.js', label: 'vercel/next.js' },
];

export default function GitHubBackfillPage() {
  const [owner, setOwner] = useState('YuvrajM2506');
  const [repo, setRepo] = useState('ReVise');
  const [maxPRs, setMaxPRs] = useState<number>(5);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<BackfillApiResponse | null>(null);
  const [copiedMemoryId, setCopiedMemoryId] = useState<string | null>(null);

  const handleCopyMemoryId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedMemoryId(id);
    setTimeout(() => setCopiedMemoryId(null), 2000);
  };

  const handleBackfill = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const cleanOwner = owner.trim();
    const cleanRepo = repo.trim();

    if (!cleanOwner) {
      setErrorMessage('Please enter a repository owner.');
      return;
    }
    if (!cleanRepo) {
      setErrorMessage('Please enter a repository name.');
      return;
    }
    if (!maxPRs || maxPRs <= 0) {
      setErrorMessage('Please specify a positive maximum PR count.');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/github/backfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: cleanOwner,
          repo: cleanRepo,
          bankId: 'revise',
          maxPRs: Number(maxPRs),
        }),
      });

      const data: BackfillApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Backfill failed with status ${response.status}`);
      }

      setResult(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during backfill.');
    } finally {
      setIsLoading(false);
    }
  };

  // Computed summary metrics
  const alreadyExistsCount =
    result?.results.filter((r) => r.status === 'already_exists').length || 0;
  const errorCount = result?.results.filter((r) => !!r.error).length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600/30 to-purple-600/20 border border-indigo-500/30 text-indigo-400">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                GitHub History Backfill
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                  Memory Seeder
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                ReVise learns from recent merged GitHub PR history and stores useful organizational patterns in Hindsight.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Configuration Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0e111d] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Github className="w-4 h-4 text-indigo-400" />
              Repository Configuration
            </h2>
            <span className="text-xs text-slate-400">Target Bank: <code className="text-indigo-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-800">revise</code></span>
          </div>

          <form onSubmit={handleBackfill} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Repository Owner / Organization
                </label>
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="e.g. YuvrajM2506"
                  className="w-full bg-[#141829] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Repository Name
                </label>
                <input
                  type="text"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="e.g. ReVise"
                  className="w-full bg-[#141829] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Maximum Merged PRs to Process (1 - 20)
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={maxPRs}
                  onChange={(e) => setMaxPRs(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-[#141829] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 sm:pt-4">
                <p className="text-xs text-slate-400">
                  Scans closed PRs, extracts merged changes &amp; files, and indexes lessons scoped to <code className="text-indigo-300">{repo.trim() || 'repo'}</code>.
                </p>
              </div>
            </div>

            {/* Quick Sample Selector */}
            <div className="space-y-2 pt-1 border-t border-slate-800/60">
              <span className="text-xs font-medium text-slate-400">Quick Samples:</span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_REPOS.map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => {
                      setOwner(sample.owner);
                      setRepo(sample.repo);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      owner === sample.owner && repo === sample.repo
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-medium'
                        : 'bg-[#141829] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium text-sm shadow-lg shadow-indigo-900/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Backfilling GitHub History...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 text-indigo-200" />
                    <span>Backfill GitHub History</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="bg-[#0e111d] border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              How Backfill Works
            </h3>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <GitMerge className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Merged PRs Only:</strong> Filters closed PRs to safely index verified, incorporated code changes.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Database className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Hindsight Retention:</strong> Generates structured organizational memories with diff summaries and focus areas.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Duplicate Protection:</strong> Prevents duplicate memories if the PR was previously backfilled.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-indigo-400 font-medium mb-1">
              <Info className="w-3.5 h-3.5" />
              Safety Guarantee
            </div>
            Backfill operates strictly read-only on GitHub and never posts comments or reviews.
          </div>
        </div>
      </div>

      {/* 3. Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-100">Backfill Request Failed</div>
            <div className="text-xs text-red-300/90 mt-0.5">{errorMessage}</div>
          </div>
        </div>
      )}

      {/* 4. Results Section */}
      {result && (
        <div className="bg-[#0e111d] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6 animate-fadeIn">
          {/* Metrics Overview Cards */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Backfill Execution Summary
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Repository: <span className="text-white font-medium">{result.owner}/{result.repo}</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
                <span className="text-slate-400">Requested: </span>
                <span className="text-white font-semibold">{result.requested}</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
                <span className="text-slate-400">Processed: </span>
                <span className="text-white font-semibold">{result.processed}</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-800/50 text-xs">
                <span className="text-emerald-300">Created: </span>
                <span className="text-emerald-200 font-semibold">{result.memories_created}</span>
              </div>
              {alreadyExistsCount > 0 && (
                <div className="px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-xs">
                  <span className="text-amber-300">Existing/Skipped: </span>
                  <span className="text-amber-200 font-semibold">{alreadyExistsCount}</span>
                </div>
              )}
              {errorCount > 0 && (
                <div className="px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-800/40 text-xs">
                  <span className="text-red-300">Failed: </span>
                  <span className="text-red-200 font-semibold">{errorCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Per-PR Detailed Results */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Processed Pull Requests ({result.results.length})
            </h4>

            {result.results.length === 0 ? (
              <div className="p-8 rounded-xl bg-[#141829]/60 border border-slate-800/80 text-center space-y-2">
                <GitPullRequest className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-sm text-slate-300 font-medium">No Merged Pull Requests Found</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  GitHub returned 0 merged PRs in the recent closed PR history for{' '}
                  <code className="text-indigo-300">{result.owner}/{result.repo}</code>. Unmerged closed PRs were safely filtered out.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {result.results.map((pr) => (
                  <div
                    key={pr.pullNumber}
                    className="p-4 rounded-xl bg-[#141829]/80 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400 shrink-0 mt-0.5">
                        <GitMerge className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-indigo-400">
                            PR #{pr.pullNumber}
                          </span>
                          <h5 className="text-sm font-medium text-white truncate max-w-xl">
                            {pr.title}
                          </h5>
                          <a
                            href={`https://github.com/${result.owner}/${result.repo}/pull/${pr.pullNumber}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-500 hover:text-slate-300 transition-colors"
                            title="Open on GitHub"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        {pr.error && (
                          <div className="mt-1.5 text-xs text-red-300 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <span>{pr.error}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status & Memory ID Badge */}
                    <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                      {pr.status === 'created' && pr.memory_id && (
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Created
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyMemoryId(pr.memory_id!)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-all font-mono"
                            title="Click to copy Memory ID"
                          >
                            <span>{pr.memory_id}</span>
                            {copiedMemoryId === pr.memory_id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-500" />
                            )}
                          </button>
                        </div>
                      )}

                      {pr.status === 'already_exists' && pr.memory_id && (
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" />
                            Already Indexed
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyMemoryId(pr.memory_id!)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all font-mono"
                            title="Click to copy Memory ID"
                          >
                            <span>{pr.memory_id}</span>
                            {copiedMemoryId === pr.memory_id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-500" />
                            )}
                          </button>
                        </div>
                      )}

                      {pr.error && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-300 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Failed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Empty State / Getting Started */}
      {!result && !isLoading && !errorMessage && (
        <div className="p-8 rounded-2xl bg-[#0e111d]/50 border border-slate-800/60 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">Ready to Seed ReVise Memory Bank</h3>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              Configure your GitHub repository above and click <span className="text-indigo-300 font-medium">"Backfill GitHub History"</span>. ReVise will parse recent merged PRs and seed Hindsight with historical context.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
