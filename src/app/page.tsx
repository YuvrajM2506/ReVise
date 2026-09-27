'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Database,
  Activity,
  ShieldAlert,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { DEMO_SCENARIOS } from '@/lib/seed-data';
import { EvaluationRun, MemoryPulseData } from '@/lib/types';

export default function OverviewPage() {
  const router = useRouter();
  const [quickInput, setQuickInput] = useState('');
  const [runs, setRuns] = useState<EvaluationRun[]>([]);
  const [pulse, setPulse] = useState<MemoryPulseData>({
    total_memories: 42,
    remediation_patterns_count: 8,
    repeated_risks_count: 3,
    growth_sparkline: [22, 26, 31, 35, 38, 41, 42],
    hindsight_connected: true,
    last_sync_timestamp: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load recent runs
    fetch('/api/runs')
      .then(res => res.json())
      .then(data => {
        if (data.runs) setRuns(data.runs);
      })
      .catch(console.error);

    // Load memory pulse
    fetch('/api/pulse')
      .then(res => res.json())
      .then(data => {
        if (data.pulse) setPulse(data.pulse);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) {
      router.push('/analyze');
      return;
    }
    // Encode input into analyze query params
    const query = new URLSearchParams({
      custom_code: quickInput,
      custom_title: 'Custom Evaluation Query',
    });
    router.push(`/analyze?${query.toString()}`);
  };

  const selectScenario = (scenarioId: string) => {
    router.push(`/analyze?scenario=${scenarioId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HIGH RISK':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-pink-500/20 text-pink-400 border border-pink-500/30">
            HIGH RISK
          </span>
        );
      case 'LEARNED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            LEARNED
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            RESOLVED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-slate-500/20 text-slate-300 border border-slate-500/30">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-8 space-y-10">
      {/* Hero Section */}
      <section className="space-y-4">
        <div>
          <span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-indigo-400">
            REVISE INTELLIGENCE
          </span>
          <h2 className="text-3xl font-bold text-white tracking-tight mt-1">
            What would you like to evaluate?
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Analyze a pull request, pipeline failure, or infrastructure change using your team&apos;s production memory.
          </p>
        </div>

        {/* Big Input Card */}
        <form onSubmit={handleHeroSubmit} className="glow-card rounded-xl p-5 border border-white/10 relative">
          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-1" />
            <textarea
              rows={3}
              value={quickInput}
              onChange={e => setQuickInput(e.target.value)}
              placeholder="Paste a pull request diff, pipeline log, or describe a planned change..."
              className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none resize-none"
            />
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              ReVise will search relevant reviews, failures, incidents, and runbooks.
            </span>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs tracking-wide shadow-glow-sm shadow-indigo-500/30 transition-all"
            >
              <span>Analyze with memory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </section>

      {/* Start with a scenario section */}
      <section className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-400">
          START WITH A SCENARIO
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DEMO_SCENARIOS.map(scenario => {
            const isRed = scenario.categoryColor === 'red';
            const isPurple = scenario.categoryColor === 'purple';
            const isBlue = scenario.categoryColor === 'blue';

            return (
              <div
                key={scenario.id}
                onClick={() => selectScenario(scenario.id)}
                className="glow-card p-4 rounded-xl cursor-pointer group flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        isRed
                          ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                          : isPurple
                          ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                          : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      }`}
                    >
                      {scenario.category}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-300 transition-colors" />
                  </div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-indigo-200 transition-colors">
                    {scenario.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {scenario.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Two-Column Bottom Split */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Intelligence (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-400">
              RECENT INTELLIGENCE
            </h3>
            <Link href="/timeline" className="text-xs text-indigo-400 hover:text-indigo-300">
              View all
            </Link>
          </div>

          <div className="space-y-2.5">
            {runs.slice(0, 4).map(run => (
              <Link
                key={run.id}
                href={`/report/${run.id}`}
                className="glow-card p-3.5 rounded-xl flex items-center justify-between group hover:border-indigo-500/30 transition block"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="shrink-0">{getStatusBadge(run.status)}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white group-hover:text-indigo-200 transition truncate">
                      {run.title}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{run.service}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {run.relative_time}
                      </span>
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white shrink-0 ml-3 transition" />
              </Link>
            ))}
          </div>
        </div>

        {/* Right Column: Memory Pulse (1 col) */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-400">
            MEMORY PULSE
          </h3>

          <div className="glow-card p-5 rounded-xl space-y-5">
            <div>
              <span className="text-xs text-slate-400">Memory status</span>
              <div className="flex items-baseline justify-between mt-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-white font-mono">
                    {pulse.total_memories}
                  </span>
                  <span className="text-xs text-slate-400">Events remembered</span>
                </div>
              </div>

              {/* Handcrafted SVG Sparkline */}
              <div className="mt-3 h-10 w-full">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 200 40">
                  <defs>
                    <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6C5CE7" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#6C5CE7" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 35 Q 30 32, 60 25 T 120 18 T 160 12 T 200 6 L 200 40 L 0 40 Z"
                    fill="url(#sparkGradient)"
                  />
                  <path
                    d="M 0 35 Q 30 32, 60 25 T 120 18 T 160 12 T 200 6"
                    fill="none"
                    stroke="#8172f3"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="200" cy="6" r="3" fill="#6C5CE7" className="animate-ping" />
                  <circle cx="200" cy="6" r="3" fill="#ffffff" />
                </svg>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                  {pulse.remediation_patterns_count} Remediation Patterns
                </span>
                <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-pink-400" />
                  {pulse.repeated_risks_count} Repeated Risks
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  This week
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/timeline"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition"
              >
                <span>Explore team memory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
