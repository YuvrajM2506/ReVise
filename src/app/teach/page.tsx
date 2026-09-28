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
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Top Header */}
      <div>
        <span className="text-[10px] font-mono tracking-widest uppercase font-semibold text-[#02A0A0]">
          ORGANIZATIONAL MEMORY
        </span>
        <h2 className="text-3xl font-bold text-[#F0F6F6] tracking-tight mt-1">Teach ReVise</h2>
        <p className="text-xs text-[#8CA0A8] mt-1">
          Turn today&apos;s deployment outcome into safer decisions tomorrow.
        </p>
      </div>

      {/* Success Alert Banner */}
      {isSaved && (
        <div className="p-4 rounded-xl bg-[#0B1E22] border border-[#02A0A0]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#02A0A0]/20 text-[#02A0A0] flex items-center justify-center shrink-0 border border-[#02A0A0]/40">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#02A0A0]">
                Outcome added to organizational memory
              </p>
              <p className="text-[11px] text-[#8CA0A8]">
                ReVise can now use this resolved staging failure to protect future changes. (
                {patternResult})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/timeline"
              className="text-xs font-medium px-3 py-1.5 rounded-lg text-[#8CA0A8] hover:text-[#F0F6F6] hover:bg-[#071317] transition"
            >
              View memory timeline
            </Link>
            <Link
              href="/analyze"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-[#02A0A0] hover:bg-[#028F8F] text-[#071317] transition"
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
          <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-[#0B1B20] border border-[#163842] space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#F0F6F6] tracking-tight">
                Record deployment outcome
              </h3>
              <p className="text-xs text-[#8CA0A8] mt-0.5">
                Store what happened and what worked. ReVise will use this context for future reviews.
              </p>
            </div>

            {/* Related Change Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8CA0A8]">
                RELATED CHANGE
              </label>
              <select
                value={selectedRunId}
                onChange={e => handleRunChange(e.target.value)}
                className="w-full px-3 py-2 bg-[#071317] border border-[#163842] rounded-lg text-xs text-[#F0F6F6] focus:outline-none focus:border-[#02A0A0]"
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
              <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8CA0A8]">
                OUTCOME
              </label>
              <select
                value={outcome}
                onChange={e => setOutcome(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#071317] border border-[#163842] rounded-lg text-xs text-[#F0F6F6] focus:outline-none focus:border-[#02A0A0]"
              >
                <option value="Failed in staging">Failed in staging</option>
                <option value="Shipped clean">Shipped clean</option>
                <option value="Rolled back">Rolled back</option>
                <option value="Caught in review">Caught in review</option>
              </select>
            </div>

            {/* Root Cause */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8CA0A8]">
                ROOT CAUSE
              </label>
              <textarea
                rows={2}
                value={rootCause}
                onChange={e => setRootCause(e.target.value)}
                placeholder="Explain the technical failure mechanism..."
                className="w-full px-3 py-2 bg-[#071317] border border-[#163842] rounded-lg text-xs text-[#F0F6F6] placeholder-[#5A7178] focus:outline-none focus:border-[#02A0A0] resize-none leading-relaxed font-mono"
              />
            </div>

            {/* What Fixed It */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8CA0A8]">
                WHAT FIXED IT
              </label>
              <textarea
                rows={2}
                value={whatFixedIt}
                onChange={e => setWhatFixedIt(e.target.value)}
                placeholder="Describe the solution or remediation steps..."
                className="w-full px-3 py-2 bg-[#071317] border border-[#163842] rounded-lg text-xs text-[#F0F6F6] placeholder-[#5A7178] focus:outline-none focus:border-[#02A0A0] resize-none leading-relaxed font-mono"
              />
            </div>

            {/* Helpful Recommendation? 3-Choice Button Group */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8CA0A8]">
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
                          ? 'bg-[#0E2229] text-[#02A0A0] border border-[#02A0A0] shadow-[0_0_12px_rgba(2,160,160,0.15)] font-semibold'
                          : 'bg-[#071317] text-[#8CA0A8] border border-[#163842] hover:border-[#02A0A0]/40 hover:text-[#F0F6F6]'
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
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#02A0A0] hover:bg-[#028F8F] text-[#071317] font-semibold text-xs tracking-wide transition"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#071317]" />
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

        {/* Right Column (1 Col): What ReVise Will Learn */}
        <div className="space-y-5">
          <div className="p-6 rounded-xl bg-[#0B1B20] border border-[#163842] space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#F0F6F6] tracking-tight">
                What ReVise will learn
              </h3>
              <p className="text-xs text-[#8CA0A8] mt-0.5">
                This outcome is compiled into organizational memories instantly.
              </p>
            </div>

            {/* Highlight Card */}
            <div className="p-4 rounded-lg bg-[#071317] border border-[#02A0A0]/30 text-xs text-[#02A0A0] leading-relaxed font-mono">
              Unsafe direct schema changes on {service} create database-lock risk.
            </div>

            {/* Memory Pipeline Flow Diagram */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8CA0A8]">
                MEMORY PIPELINE
              </span>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#071317] border border-[#163842] text-[11px] font-mono text-[#8CA0A8]">
                <span className="text-[#8CA0A8]">Current PR</span>
                <span className="text-[#5A7178]">→</span>
                <span className="text-[#FFBD65]">Outcome</span>
                <span className="text-[#5A7178]">→</span>
                <span className="text-[#02A0A0]">Memory</span>
                <span className="text-[#5A7178]">→</span>
                <span className="text-[#02A0A0]">Future PR</span>
              </div>
            </div>

            {/* Future Impact List */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8CA0A8]">
                FUTURE IMPACT
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#F0F6F6] flex items-center gap-1.5">
                    <span className="text-[#02A0A0] font-bold">•</span>
                    Improves similar code reviews
                  </span>
                  <span className="text-[10px] font-mono text-[#5A7178]">Automated Review</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#F0F6F6] flex items-center gap-1.5">
                    <span className="text-[#02A0A0] font-bold">•</span>
                    Adds deployment guardrail
                  </span>
                  <span className="text-[10px] font-mono text-[#5A7178]">Guardrail</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#F0F6F6] flex items-center gap-1.5">
                    <span className="text-[#02A0A0] font-bold">•</span>
                    Updates migration risk pattern
                  </span>
                  <span className="text-[10px] font-mono text-[#5A7178]">Causal Model</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#F0F6F6] flex items-center gap-1.5">
                    <span className="text-[#02A0A0] font-bold">•</span>
                    Cites this outcome as evidence
                  </span>
                  <span className="text-[10px] font-mono text-[#5A7178]">Context Node</span>
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
    <Suspense fallback={<div className="p-8 text-center text-[#8CA0A8] font-mono text-xs">Loading teach module...</div>}>
      <TeachContent />
    </Suspense>
  );
}
