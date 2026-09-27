'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Database,
  GitPullRequest,
  Check,
  Loader2,
  Share2,
} from 'lucide-react';
import { EvaluationRun } from '@/lib/types';

function TeachContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [runs, setRuns] = useState<EvaluationRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>('');
  const [changeTitle, setChangeTitle] = useState('PR #167 — Add customer-region analytics');
  const [service, setService] = useState('orders-service');
  const [outcome, setOutcome] = useState<'Failed in staging' | 'Shipped clean' | 'Rolled back' | 'Caught in review'>('Failed in staging');
  const [rootCause, setRootCause] = useState(
    'Migration exceeded the allowed lock-duration threshold on the orders table.'
  );
  const [whatFixedIt, setWhatFixedIt] = useState(
    'Split the migration into a nullable column, batch backfill, and concurrent index creation.'
  );
  const [helpfulness, setHelpfulness] = useState<
    'Yes, it caught the risk early' | 'Partially helpful' | 'Not helpful'
  >('Yes, it caught the risk early');

  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patternResult, setPatternResult] = useState<string | null>(null);

  useEffect(() => {
    // Load runs for dropdown
    fetch('/api/runs')
      .then(res => res.json())
      .then(data => {
        if (data.runs && data.runs.length > 0) {
          setRuns(data.runs);
          const initialId = searchParams.get('run_id') || data.runs[0].id;
          setSelectedRunId(initialId);

          const matched = data.runs.find((r: EvaluationRun) => r.id === initialId);
          if (matched) {
            setChangeTitle(matched.title);
            setService(matched.service);
          }
        }
      })
      .catch(console.error);
  }, [searchParams]);

  const handleRunChange = (runId: string) => {
    setSelectedRunId(runId);
    const matched = runs.find(r => r.id === runId);
    if (matched) {
      setChangeTitle(matched.title);
      setService(matched.service);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/teach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          related_run_id: selectedRunId,
          related_change_title: changeTitle,
          service,
          outcome,
          root_cause: rootCause,
          what_fixed_it: whatFixedIt,
          was_recommendation_helpful: helpfulness,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsSaved(true);
        setPatternResult(data.pattern_action || 'Reinforced existing pattern');
      } else {
        alert(data.error || 'Failed to record outcome');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
      {/* Top Header */}
      <div>
        <span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-indigo-400">
          ORGANIZATIONAL MEMORY
        </span>
        <h2 className="text-3xl font-bold text-white tracking-tight mt-1">Teach ReVise</h2>
        <p className="text-sm text-slate-400 mt-1">
          Turn today&apos;s deployment outcome into safer decisions tomorrow.
        </p>
      </div>

      {/* Success Alert Banner matching Screenshot 5 */}
      {isSaved && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-300">
                Outcome added to organizational memory
              </p>
              <p className="text-[11px] text-emerald-400/80">
                ReVise can now use this resolved staging failure to protect future changes. (
                {patternResult})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/timeline"
              className="text-xs font-medium px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition"
            >
              View memory timeline
            </Link>
            <Link
              href="/analyze"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-glow-sm shadow-indigo-500/20"
            >
              Analyze another
            </Link>
          </div>
        </div>
      )}

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Form to Record Outcome */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="glow-card p-6 rounded-2xl border border-white/10 space-y-5">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Record deployment outcome
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Store what happened and what worked. ReVise will use this context for future reviews.
              </p>
            </div>

            {/* Related Change Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
                RELATED CHANGE
              </label>
              <select
                value={selectedRunId}
                onChange={e => handleRunChange(e.target.value)}
                className="w-full px-3 py-2 bg-[#090a16] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {runs.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.service})
                  </option>
                ))}
              </select>
            </div>

            {/* Outcome Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
                OUTCOME
              </label>
              <select
                value={outcome}
                onChange={e => setOutcome(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#090a16] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Failed in staging">Failed in staging</option>
                <option value="Shipped clean">Shipped clean</option>
                <option value="Rolled back">Rolled back</option>
                <option value="Caught in review">Caught in review</option>
              </select>
            </div>

            {/* Root Cause */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
                ROOT CAUSE
              </label>
              <textarea
                rows={2}
                value={rootCause}
                onChange={e => setRootCause(e.target.value)}
                placeholder="Explain the technical failure mechanism..."
                className="w-full px-3 py-2 bg-[#090a16] border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />
            </div>

            {/* What Fixed It */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
                WHAT FIXED IT
              </label>
              <textarea
                rows={2}
                value={whatFixedIt}
                onChange={e => setWhatFixedIt(e.target.value)}
                placeholder="Describe the solution or remediation steps..."
                className="w-full px-3 py-2 bg-[#090a16] border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />
            </div>

            {/* Helpful Recommendation? 3-Choice Button Group */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
                HELPFUL RECOMMENDATION?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  'Yes, it caught the risk early',
                  'Partially helpful',
                  'Not helpful',
                ].map(opt => {
                  const isSelected = helpfulness === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setHelpfulness(opt as any)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white border border-indigo-400/50 shadow-glow-sm shadow-indigo-500/20'
                          : 'bg-[#090a16] text-slate-400 border border-white/10 hover:border-white/20 hover:text-slate-200'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide shadow-glow-md shadow-indigo-500/30 transition"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Writing to Hindsight Memory Bank...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Save outcome to Hindsight</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column (1 Col): What ReVise Will Learn matching Screenshot 5 */}
        <div className="space-y-5">
          <div className="glow-card p-6 rounded-2xl border border-white/10 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                What ReVise will learn
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                This outcome is compiled into organizational memories instantly.
              </p>
            </div>

            {/* Highlight Card */}
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 leading-relaxed font-medium">
              Unsafe direct schema changes on {service} create database-lock risk.
            </div>

            {/* Memory Pipeline Flow Diagram */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
                MEMORY PIPELINE
              </span>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#090a16] border border-white/5 text-[11px] font-mono text-slate-300">
                <span className="text-indigo-400">Current PR</span>
                <span className="text-slate-600">→</span>
                <span className="text-pink-400">Outcome</span>
                <span className="text-slate-600">→</span>
                <span className="text-emerald-400">Memory</span>
                <span className="text-slate-600">→</span>
                <span className="text-cyan-400">Future PR</span>
              </div>
            </div>

            {/* Future Impact List */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
                FUTURE IMPACT
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <span className="text-indigo-400 font-bold">•</span>
                    Improves similar code reviews
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Automated Review</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <span className="text-indigo-400 font-bold">•</span>
                    Adds deployment guardrail
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Guardrail</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <span className="text-indigo-400 font-bold">•</span>
                    Updates migration risk pattern
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Causal Model</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <span className="text-indigo-400 font-bold">•</span>
                    Cites this outcome as evidence
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Context Node</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeachPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 text-xs">Loading teach module...</div>}>
      <TeachContent />
    </Suspense>
  );
}
