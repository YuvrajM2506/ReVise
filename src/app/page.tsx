'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Zap,
  GitBranch,
  GitPullRequest,
  CheckCircle2,
  Database,
  RefreshCw,
  Layers,
  Bot,
  AlertTriangle,
  Lock,
  ChevronRight,
  Code2,
  Check,
  Search,
  Play,
  Terminal,
} from 'lucide-react';
import Hyperspeed, { REVISE_HYPERSPEED_PRESET } from '@/components/ui/Hyperspeed';

export default function LandingPage() {
  // Memoize hyperspeed options to avoid WebGL scene recreations
  const hyperspeedOptions = useMemo(() => REVISE_HYPERSPEED_PRESET, []);

  // Hero Interactive Demo State: Memory ON vs Memory OFF
  const [heroMode, setHeroMode] = useState<'on' | 'off'>('on');

  // Interactive Evidence Card Selector State
  const [selectedEvidenceIndex, setSelectedEvidenceIndex] = useState(2); // Default to INC-024

  // Interactive Timeline Step Selector
  const [activeTimelineStep, setActiveTimelineStep] = useState(4); // Default to PR #167 Prevented

  // Sample data from ReVise real baseline
  const EVIDENCE_ITEMS = [
    {
      id: 'PR #142',
      type: 'PR Warning',
      time: '3 weeks ago',
      service: 'orders-service',
      title: 'Unbatched Column Addition Warning',
      badgeColor: 'amber',
      summary: 'Initial review warning on unbatched table modification flagged during orders-service release.',
      detail:
        'Engineer added column with DEFAULT value on high-throughput orders table. Flagged by reviewer but merged due to lack of enforced policy.',
      citation: 'Precursor event indicating recurring database schema deployment risk.',
    },
    {
      id: 'RUN-889',
      type: 'Pipeline Rollback',
      time: '2 weeks ago',
      service: 'orders-service',
      title: 'CI/CD Migration Timeout Rollback',
      badgeColor: 'pink',
      summary: 'Automated deployment rollback triggered after table lock exceeded the 15-minute deployment threshold.',
      detail:
        'Migration v160 failed to acquire AccessExclusiveLock within 900s timeout during staging validation. Caused deployment queue stall.',
      citation: 'Demonstrates strict necessity of statement_timeout and concurrent index patterns.',
    },
    {
      id: 'INC-024',
      type: 'SEV-2 Incident',
      time: '12 days ago',
      service: 'orders-service',
      title: 'Production Table Lock & Pool Exhaustion',
      badgeColor: 'pink',
      summary: 'AccessExclusiveLock on orders table blocked all read/write queries during peak checkout traffic.',
      detail:
        'Root cause: ALTER TABLE orders ADD COLUMN without concurrent indexing locked the 40M-row table for 14 minutes, exhausting checkout-api connection pools.',
      citation: 'Primary incident precedent. Direct matching failure mode to current change.',
    },
    {
      id: 'PM-024',
      type: 'Post-Mortem Playbook',
      time: '8 days ago',
      service: 'orders-service',
      title: 'Zero-Downtime Database Migration Standard',
      badgeColor: 'emerald',
      summary: 'Established mandatory policy: all new columns must be nullable or use CREATE INDEX CONCURRENTLY.',
      detail:
        'Standard STD-001 codified: 1. Add column as nullable. 2. Create index concurrently outside transaction. 3. Backfill asynchronously in batches.',
      citation: 'Active team standard providing exact remediation steps for zero-downtime execution.',
    },
  ];

  const TIMELINE_STEPS = [
    {
      step: 1,
      badge: 'Warning',
      color: 'amber',
      id: 'PR #142',
      time: '3 weeks ago',
      title: 'Initial Schema Warning',
      description: 'Reviewer leaves comment on unbatched column migration. Team lacks automated memory to enforce standard.',
    },
    {
      step: 2,
      badge: 'Failure',
      color: 'pink',
      id: 'RUN-889',
      time: '2 weeks ago',
      title: 'Pipeline Timeout Rollback',
      description: 'Staging deployment stalls due to table lock timeout exceeding 15 minutes. Recorded in Hindsight.',
    },
    {
      step: 3,
      badge: 'SEV-2',
      color: 'pink',
      id: 'INC-024',
      time: '12 days ago',
      title: 'Production Outage',
      description: 'Exclusive lock on 40M-row orders table exhausts checkout-api pool during peak traffic.',
    },
    {
      step: 4,
      badge: 'Playbook',
      color: 'emerald',
      id: 'PM-024',
      time: '8 days ago',
      title: 'Standard Codified',
      description: 'Engineering team writes zero-downtime playbook into Hindsight memory bank as STD-001.',
    },
    {
      step: 5,
      badge: 'Prevented',
      color: 'indigo',
      id: 'PR #167',
      time: 'Today',
      title: 'Zero-Downtime Validation',
      description: 'ReVise detects identical anti-pattern, cites INC-024 & PM-024, and outputs safe concurrent migration.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#080911] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200 relative">
      {/* Background Hyperspeed WebGL Canvas & Glow Ambient Gradients */}
      <div className="fixed inset-0 overflow-hidden z-0">
        {/* Hyperspeed 3D Warp Tunnel Canvas */}
        <div className="absolute inset-0 opacity-45 mix-blend-screen pointer-events-auto">
          <Hyperspeed effectOptions={hyperspeedOptions} />
        </div>

        {/* Ambient Dark Gradient Overlays for perfect legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080911]/60 via-[#080911]/85 to-[#080911] pointer-events-none" />
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-[40%] right-[-5%] w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-indigo-500/15 rounded-full blur-[160px] pointer-events-none" />
      </div>

      {/* ========================================================================= */}
      {/* STANDALONE LANDING NAVBAR */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#080911]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 h-18 py-3.5 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow-sm shadow-indigo-500/30 group-hover:scale-105 transition-transform shrink-0">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-base tracking-tight group-hover:text-indigo-200 transition">
                  ReVise
                </span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  AI
                </span>
              </div>
              <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                ENGINEERING MEMORY
              </p>
            </div>
          </Link>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <a href="#capabilities" className="hover:text-white transition">Capabilities</a>
            <a href="#evidence" className="hover:text-white transition">Memory Evidence</a>
            <a href="#causal-chain" className="hover:text-white transition">Causal Graph</a>
            <a href="#pair-programmer" className="hover:text-white transition flex items-center gap-1">
              <span>Pair Programmer</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">NEW</span>
            </a>
            <a href="#architecture" className="hover:text-white transition">Architecture</a>
          </nav>

          {/* Navbar Right Actions */}
          <div className="flex items-center gap-3">
            {/* Live Hindsight Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#12142e] border border-indigo-500/30 text-indigo-300 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Hindsight Live</span>
            </div>

            {/* AI Pair Programmer Button */}
            <Link
              href="/pair-programmer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#141638] hover:bg-[#1d2050] border border-indigo-500/40 text-indigo-200 text-xs font-semibold tracking-wide transition shadow-glow-sm shadow-indigo-500/20 hover:scale-[1.02]"
            >
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pair Programmer</span>
            </Link>

            {/* Enter App / Analyze Primary Button */}
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold tracking-wide shadow-glow-sm shadow-indigo-500/30 transition hover:scale-[1.02]"
            >
              <span>Enter App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN LANDING CONTENT */}
      {/* ========================================================================= */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8 py-12 space-y-28">
        
        {/* ========================================================================= */}
        {/* 1. HERO SECTION */}
        {/* ========================================================================= */}
        <section className="text-center space-y-8 pt-4">
          {/* Glowing Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-medium shadow-glow-sm shadow-indigo-500/20 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="font-semibold">ReVise 1.0</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">Continuous Engineering Memory</span>
          </div>

          {/* Core Thesis Headline */}
          <div className="max-w-4xl mx-auto space-y-5">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
              Memory is not a feature bolted onto an LLM wrapper —{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200">
                it is the product.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
              An AI code review agent that gets measurably smarter over time by remembering every past PR review, pipeline failure, production incident, and post-mortem playbook.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/pair-programmer"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm tracking-wide shadow-glow-md shadow-indigo-500/30 transition-all hover:scale-[1.03] active:scale-[0.98]"
            >
              <Bot className="w-4 h-4 text-indigo-200" />
              <span>Launch AI Pair Programmer</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/analyze"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#11132b] hover:bg-[#181a3a] border border-indigo-500/30 text-indigo-200 font-semibold text-sm tracking-wide transition-all hover:border-indigo-500/50 hover:scale-[1.02]"
            >
              <GitPullRequest className="w-4 h-4 text-indigo-400" />
              <span>Analyze Pull Request</span>
            </Link>

            <Link
              href="/timeline"
              className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-slate-400 hover:text-white text-sm font-medium transition"
            >
              <GitBranch className="w-4 h-4 text-slate-500" />
              <span>Explore Memory Graph</span>
            </Link>
          </div>

          {/* Proof Badge Row */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>100% CITED EVIDENCE</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>ZERO HALLUCINATED POLICIES</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>SUB-SECOND GROQ LPU SYNTHESIS</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* HERO VISUAL: MEMORY ON VS MEMORY OFF COMPARISON STUDIO */}
          {/* ========================================================================= */}
          <div className="pt-8">
            <div className="glow-card rounded-2xl p-1 sm:p-2 border border-white/10 bg-[#0a0c1b]/90 backdrop-blur-xl shadow-2xl relative overflow-hidden text-left">
              {/* Card Top Header & Interactive Toggle */}
              <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d0f24]">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
                      LIVE COMPARISON BENCHMARK
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white/5 text-slate-400 border border-white/10">
                      orders-service / migration_v167.sql
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    PR #167: Add customer-region analytics column to orders table
                  </h3>
                </div>

                {/* The Interactive Switch */}
                <div className="flex items-center p-1 rounded-xl bg-[#080911] border border-white/10 shrink-0 self-start sm:self-auto">
                  <button
                    onClick={() => setHeroMode('off')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      heroMode === 'off'
                        ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-pink-400" />
                    <span>Memory OFF (Generic AI)</span>
                  </button>

                  <button
                    onClick={() => setHeroMode('on')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      heroMode === 'on'
                        ? 'bg-indigo-600 text-white shadow-glow-sm shadow-indigo-500/40 border border-indigo-400/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Memory ON (ReVise)</span>
                  </button>
                </div>
              </div>

              {/* Card Body: Split Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
                
                {/* Left Side: Code Under Review (5 cols) */}
                <div className="lg:col-span-5 p-5 space-y-4 bg-[#070815]/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-indigo-400" />
                      Incoming Code Diff
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">PostgreSQL</span>
                  </div>

                  <div className="rounded-lg bg-[#04050b] p-4 border border-white/5 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto">
                    <div className="text-slate-400 italic mb-2">-- migration_v167.sql</div>
                    <div className="text-pink-400">
                      <span className="text-slate-400 mr-2">1</span>ALTER TABLE orders
                    </div>
                    <div className="text-pink-400">
                      <span className="text-slate-400 mr-2">2</span>&nbsp;&nbsp;ADD COLUMN customer_region VARCHAR(50) NOT NULL;
                    </div>
                    <div className="text-slate-400">
                      <span className="text-slate-400 mr-2">3</span>
                    </div>
                    <div className="text-pink-400">
                      <span className="text-slate-400 mr-2">4</span>CREATE INDEX idx_orders_region
                    </div>
                    <div className="text-pink-400">
                      <span className="text-slate-400 mr-2">5</span>&nbsp;&nbsp;ON orders(customer_region);
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1.5">
                    <p className="text-[11px] font-semibold text-slate-300">Review Context:</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Target repository: <span className="text-slate-300 font-mono">orders-service</span> (Production database: 40,000,000 active customer rows).
                    </p>
                  </div>
                </div>

                {/* Right Side: Evaluation Output (7 cols) */}
                <div className="lg:col-span-7 p-5 space-y-4 bg-[#090b1e]/50">
                  {heroMode === 'off' ? (
                    /* MEMORY OFF VIEW */
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
                            CALCULATED RISK SCORE
                          </span>
                          <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-3xl font-extrabold text-slate-200 font-mono">35</span>
                            <span className="text-xs text-slate-400">/ 100 (Low Risk - Generic AI)</span>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                          VERDICT: LGTM
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Standard Syntactic Review:</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          &quot;The SQL migration syntax is valid. It correctly creates the <code className="text-slate-300 font-mono">customer_region</code> column and indexes it. Ready to merge.&quot;
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-pink-950/20 border border-pink-500/20 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-pink-400">
                          <AlertTriangle className="w-4 h-4" />
                          <span>The Stateless AI Blind Spot:</span>
                        </div>
                        <p className="text-xs text-pink-200/80 leading-relaxed">
                          Generic AI has no memory of incident <strong className="text-pink-300 font-mono">INC-024</strong>. It does not know that running non-concurrent indexing on the 40M-row orders table triggers an <strong className="text-pink-300 font-mono">AccessExclusiveLock</strong>, locking checkout traffic for 14 minutes.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* MEMORY ON VIEW (REVISE GROUNDED) */
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-pink-950/40 border border-pink-500/40 shadow-glow-sm shadow-pink-500/10">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-pink-400 font-bold tracking-wider">
                            CALCULATED RISK SCORE (GROUNDED)
                          </span>
                          <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-3xl font-extrabold text-pink-400 font-mono">82</span>
                            <span className="text-xs text-pink-300/80 font-medium">/ 100 (CRITICAL RISK PRECEDENT)</span>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/40 animate-pulse">
                          CRITICAL REGRESSION
                        </span>
                      </div>

                      {/* Cited Memory Badges */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-mono uppercase text-indigo-300 font-semibold tracking-wider flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-indigo-400" />
                          Retrieved Incidents &amp; Standards from Hindsight:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="p-2.5 rounded-lg bg-[#12142e] border border-indigo-500/30 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-pink-400">INC-024 (SEV-2)</span>
                              <span className="text-[10px] text-slate-400">12d ago</span>
                            </div>
                            <p className="text-[11px] text-slate-300 line-clamp-2">
                              Unbatched migration caused 14-min AccessExclusiveLock outage.
                            </p>
                          </div>

                          <div className="p-2.5 rounded-lg bg-[#12142e] border border-indigo-500/30 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-emerald-400">PM-024 (STD-001)</span>
                              <span className="text-[10px] text-slate-400">8d ago</span>
                            </div>
                            <p className="text-[11px] text-slate-300 line-clamp-2">
                              Mandatory zero-downtime rule: CREATE INDEX CONCURRENTLY.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* ReVise Grounded Recommendation */}
                      <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                          <ShieldCheck className="w-4 h-4 text-indigo-400" />
                          <span>Grounded Remediation Plan:</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-mono text-[11px] bg-[#070815] p-2.5 rounded border border-white/5">
                          1. ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_region TEXT;
                          <br />
                          2. CREATE INDEX CONCURRENTLY idx_orders_region ON orders(customer_region);
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SPECIAL HIGHLIGHT: MEMORY-GROUNDED AI PAIR PROGRAMMER */}
        {/* ========================================================================= */}
        <section id="pair-programmer" className="space-y-6 scroll-mt-24">
          <div className="glow-card rounded-3xl p-8 sm:p-10 border border-indigo-500/40 bg-gradient-to-br from-[#0e102f] via-[#090a1f] to-[#070814] relative overflow-hidden shadow-2xl space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-semibold uppercase">
                  <Bot className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AUTONOMOUS CODE REMEDIATION</span>
                </div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">
                  Don&apos;t just diagnose regressions. Fix them with AI Pair Programmer.
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Give Aider a coding task or target repository. ReVise injects the relevant historical incidents, post-mortems, and team standards into the agent&apos;s context, producing a verified zero-downtime code diff.
                </p>
              </div>

              <Link
                href="/pair-programmer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm tracking-wide shadow-glow-md shadow-indigo-500/40 shrink-0 transition-all hover:scale-105"
              >
                <Bot className="w-4 h-4" />
                <span>Open Pair Programmer Studio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Direct Preset Launcher Grid */}
            <div className="pt-2 border-t border-white/10 space-y-3">
              <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
                Try a Preset Pairing Scenario:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Link
                  href="/pair-programmer?scenario=db-migration"
                  className="p-4 rounded-xl bg-[#060714] border border-white/10 hover:border-indigo-500/50 hover:bg-[#0c0e29] transition group block"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition">
                      PostgreSQL Migration Fix
                    </span>
                    <Play className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Refactor table lock into concurrent indexing matching incident INC-024 post-mortem.
                  </p>
                </Link>

                <Link
                  href="/pair-programmer?scenario=auth-secret"
                  className="p-4 rounded-xl bg-[#060714] border border-white/10 hover:border-indigo-500/50 hover:bg-[#0c0e29] transition group block"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition">
                      JWT Secret Guard
                    </span>
                    <Play className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Prevent silent fallback to hardcoded default dev secrets in production authentication.
                  </p>
                </Link>

                <Link
                  href="/pair-programmer?scenario=api-timeout"
                  className="p-4 rounded-xl bg-[#060714] border border-white/10 hover:border-indigo-500/50 hover:bg-[#0c0e29] transition group block"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition">
                      HTTP Client Retries
                    </span>
                    <Play className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Configure strict 5000ms timeouts and exponential backoff on outbound payment services.
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. FEATURE STRIP (6 REAL CAPABILITIES GRID) */}
        {/* ========================================================================= */}
        <section id="capabilities" className="space-y-6 scroll-mt-24">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-widest font-semibold text-indigo-400">
              CORE CAPABILITIES
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Engineered for production safety. Grounded in memory.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Feature 1 */}
            <div className="glow-card p-6 rounded-2xl border border-white/10 bg-[#0b0d21]/60 hover:border-indigo-500/40 transition-all group space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-indigo-200 transition">
                Memory-Grounded Risk Scoring
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Evaluates code changes against a 0–100 risk index calibrated on your team&apos;s real historical failures, rather than generic syntax checks.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glow-card p-6 rounded-2xl border border-white/10 bg-[#0b0d21]/60 hover:border-indigo-500/40 transition-all group space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-indigo-200 transition">
                Multi-Strategy Retrieval
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fuses semantic vector similarity, BM25 exact matching, causal graph traversal, and temporal recency decay via Reciprocal Rank Fusion (RRF).
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glow-card p-6 rounded-2xl border border-white/10 bg-[#0b0d21]/60 hover:border-indigo-500/40 transition-all group space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
                <GitBranch className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-indigo-200 transition">
                Causal Story Chains
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Reconstructs the full lifecycle of an incident: from initial PR warning to pipeline failure, SEV outage, and validated post-mortem playbook.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glow-card p-6 rounded-2xl border border-white/10 bg-[#0b0d21]/60 hover:border-indigo-500/40 transition-all group space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-indigo-200 transition">
                Continuous Teach-Back Loop
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every approved review, resolved incident, and engineer correction writes back into Hindsight to permanently strengthen organizational standards.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="glow-card p-6 rounded-2xl border border-white/10 bg-[#0b0d21]/60 hover:border-indigo-500/40 transition-all group space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-indigo-200 transition">
                Evidence Traceability
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every review finding cites exact historical memory identifiers (<code className="text-indigo-300 font-mono">INC-024</code>, <code className="text-indigo-300 font-mono">PM-024</code>), eliminating synthetic hallucinations.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="glow-card p-6 rounded-2xl border border-white/10 bg-[#0b0d21]/60 hover:border-indigo-500/40 transition-all group space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-indigo-200 transition">
                Groq LPU Inference Speed
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Powered by Groq LPUs running <code className="text-indigo-300 font-mono">openai/gpt-oss-120b</code> for deterministic, sub-second structured evaluation output.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. "MEMORY EVIDENCE" SHOWCASE (Reflect's AI Demo Section) */}
        {/* ========================================================================= */}
        <section id="evidence" className="space-y-6 scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-widest font-semibold text-indigo-400">
                PROVENANCE &amp; CITATIONS
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Inspect the actual evidence behind every review.
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                ReVise does not provide vague advice. It retrieves and displays dated evidence cards directly from your team&apos;s past repository history.
              </p>
            </div>

            <Link
              href="/standards"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 shrink-0 transition"
            >
              <span>Explore active team standards</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="glow-card rounded-2xl p-6 border border-white/10 bg-[#0a0c1e]/80 backdrop-blur-md space-y-6">
            {/* Interactive Memory Card Selector Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {EVIDENCE_ITEMS.map((item, idx) => {
                const isSelected = selectedEvidenceIndex === idx;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedEvidenceIndex(idx)}
                    className={`p-3.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 shadow-glow-sm shadow-indigo-500/20'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-white">{item.id}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          item.badgeColor === 'pink'
                            ? 'bg-pink-500/20 text-pink-300'
                            : item.badgeColor === 'amber'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">{item.title}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.time}</p>
                  </button>
                );
              })}
            </div>

            {/* Selected Evidence Detail Box */}
            {selectedEvidenceIndex !== null && (
              <div className="p-5 rounded-xl bg-[#060714] border border-white/10 space-y-4 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-bold text-indigo-300">
                      {EVIDENCE_ITEMS[selectedEvidenceIndex].id}: {EVIDENCE_ITEMS[selectedEvidenceIndex].title}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400">
                      Service: {EVIDENCE_ITEMS[selectedEvidenceIndex].service}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Recorded {EVIDENCE_ITEMS[selectedEvidenceIndex].time}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                      Historical Event Summary:
                    </span>
                    <p className="text-slate-300 leading-relaxed bg-white/[0.02] p-3 rounded-lg border border-white/5">
                      {EVIDENCE_ITEMS[selectedEvidenceIndex].detail}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-semibold text-indigo-400 uppercase tracking-wider text-[10px]">
                      Why ReVise Cites This For Current Review:
                    </span>
                    <p className="text-indigo-200/90 leading-relaxed bg-indigo-950/30 p-3 rounded-lg border border-indigo-500/20">
                      {EVIDENCE_ITEMS[selectedEvidenceIndex].citation}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. CAUSAL STORY CHAIN / MEMORY TIMELINE (Reflect's Graph View) */}
        {/* ========================================================================= */}
        <section id="causal-chain" className="space-y-6 scroll-mt-24">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-widest font-semibold text-indigo-400">
              CAUSAL STORY CHAIN
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              A second brain that connects past failures to today&apos;s code.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Stateless linters see isolated code files. ReVise builds an unbroken causal graph across weeks of engineering history.
            </p>
          </div>

          {/* Interactive Step-by-Step Chain */}
          <div className="glow-card rounded-2xl p-6 border border-white/10 bg-[#090a1f]/70 space-y-6">
            {/* Horizontal Step Connectors */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative">
              {TIMELINE_STEPS.map((s, idx) => {
                const isActive = activeTimelineStep === idx;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveTimelineStep(idx)}
                    className={`p-3.5 rounded-xl text-left border transition-all relative ${
                      isActive
                        ? 'bg-indigo-600/20 border-indigo-500 shadow-glow-sm shadow-indigo-500/20 scale-[1.02]'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">STAGE 0{s.step}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          s.color === 'pink'
                            ? 'bg-pink-500/20 text-pink-400'
                            : s.color === 'amber'
                            ? 'bg-amber-500/20 text-amber-400'
                            : s.color === 'emerald'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-indigo-500/20 text-indigo-300'
                        }`}
                      >
                        {s.badge}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white font-mono">{s.id}</p>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{s.title}</p>
                  </button>
                );
              })}
            </div>

            {/* Active Stage Highlight Box */}
            <div className="p-5 rounded-xl bg-[#060714] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-400">
                    STAGE {TIMELINE_STEPS[activeTimelineStep].step} OF 5:
                  </span>
                  <span className="text-sm font-bold text-white">
                    {TIMELINE_STEPS[activeTimelineStep].title} ({TIMELINE_STEPS[activeTimelineStep].id})
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  {TIMELINE_STEPS[activeTimelineStep].description}
                </p>
              </div>

              <Link
                href="/timeline"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shrink-0 transition"
              >
                <span>View Full Timeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. 3-STAGE PIPELINE ARCHITECTURE (Reflect's "Never lose info" analog) */}
        {/* ========================================================================= */}
        <section id="architecture" className="space-y-6 scroll-mt-24">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-widest font-semibold text-indigo-400">
              PIPELINE ARCHITECTURE
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Three stages. Zero guesswork.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              How ReVise turns raw organizational memory into deterministic pull request reviews in under 1.2 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stage 1: Retrieval */}
            <div className="glow-card p-6 rounded-2xl border border-white/10 bg-[#090b1e]/70 space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
                  STAGE 1 / RETRIEVAL
                </span>
                <Database className="w-4 h-4 text-indigo-400" />
              </div>

              <h3 className="text-lg font-bold text-white">Hindsight Recall Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Queries the repository&apos;s isolated <code className="text-indigo-300 font-mono">bank_id</code> using multi-strategy RRF fusion (semantic embedding, BM25 keywords, and graph connections).
              </p>

              <div className="pt-2 border-t border-white/5 space-y-1.5 text-[11px] font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>Scope:</span>
                  <span className="text-slate-300">orders-service bank</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Latency:</span>
                  <span className="text-emerald-400">~280ms</span>
                </div>
              </div>
            </div>

            {/* Stage 2: Reasoning */}
            <div className="glow-card p-6 rounded-2xl border border-indigo-500/30 bg-[#0c0e29]/70 space-y-4 relative shadow-glow-sm shadow-indigo-500/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
                  STAGE 2 / REASONING
                </span>
                <Zap className="w-4 h-4 text-purple-400" />
              </div>

              <h3 className="text-lg font-bold text-white">Groq LPU Synthesis</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Passes the incoming code diff and retrieved historical memories into <code className="text-indigo-300 font-mono">openai/gpt-oss-120b</code> to synthesize verified, structured JSON risk assessments.
              </p>

              <div className="pt-2 border-t border-white/5 space-y-1.5 text-[11px] font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>Inference:</span>
                  <span className="text-slate-300">Groq LPUs</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Latency:</span>
                  <span className="text-emerald-400">~620ms</span>
                </div>
              </div>
            </div>

            {/* Stage 3: Write-Back */}
            <div className="glow-card p-6 rounded-2xl border border-white/10 bg-[#090b1e]/70 space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  STAGE 3 / WRITE-BACK
                </span>
                <RefreshCw className="w-4 h-4 text-emerald-400" />
              </div>

              <h3 className="text-lg font-bold text-white">Teach &amp; Retain Loop</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                As pull requests are approved, deployed, or post-mortems filed, the feedback loop writes structured knowledge back into Hindsight for future reviews.
              </p>

              <div className="pt-2 border-t border-white/5 space-y-1.5 text-[11px] font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>Storage:</span>
                  <span className="text-slate-300">Continuous Vector Bank</span>
                </div>
                <div className="flex justify-between">
                  <span>Reinforcement:</span>
                  <span className="text-emerald-400">Automatic</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. ISOLATED NAMESPACING & SECURITY */}
        {/* ========================================================================= */}
        <section className="glow-card rounded-2xl p-8 border border-white/10 bg-[#090b1f]/60 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Lock className="w-4 h-4" />
                <span>Namespaced Multi-Tenant Isolation</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Your memory banks stay strictly scoped to your services.
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every service (<code className="text-slate-300 font-mono">orders-service</code>, <code className="text-slate-300 font-mono">auth-service</code>, <code className="text-slate-300 font-mono">checkout-api</code>) operates within dedicated <code className="text-indigo-300 font-mono">bank_id</code> namespaces. Zero cross-contamination across team boundaries.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#060714] border border-white/10 font-mono text-xs text-slate-300 space-y-2 shrink-0">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>bank_id: acme-orders-service</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>bank_id: acme-auth-service</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>bank_id: acme-checkout-api</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. REAL INTEGRATIONS ROW (Reflect's honest row) */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-widest font-semibold text-indigo-400">
              REAL ECOSYSTEM
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Built on battle-tested infrastructure.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Integration 1 */}
            <div className="glow-card p-5 rounded-xl border border-white/10 bg-[#080918] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono">Hindsight Cloud API</span>
                <Database className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Persistent vector &amp; causal graph memory bank storing PR reviews, incidents, and standards.
              </p>
            </div>

            {/* Integration 2 */}
            <div className="glow-card p-5 rounded-xl border border-white/10 bg-[#080918] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono">Groq Cloud LPUs</span>
                <Zap className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Ultra-low latency inference engine running <code className="text-indigo-300 font-mono">openai/gpt-oss-120b</code>.
              </p>
            </div>

            {/* Integration 3 */}
            <div className="glow-card p-5 rounded-xl border border-white/10 bg-[#080918] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono">Aider Coding Agent</span>
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Automated pair programming agent that generates verified zero-downtime code diffs.
              </p>
            </div>

            {/* Integration 4 */}
            <div className="glow-card p-5 rounded-xl border border-white/10 bg-[#080918] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono">GitHub &amp; CI/CD</span>
                <GitPullRequest className="w-4 h-4 text-pink-400" />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Seamless ingestion of pull request diffs, branch metadata, and automated pipeline run logs.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 11. "WHY REVISE" THESIS */}
        {/* ========================================================================= */}
        <section className="text-center max-w-3xl mx-auto space-y-4 py-6 border-t border-white/5">
          <span className="text-xs font-mono uppercase tracking-widest font-semibold text-indigo-400">
            WHY REVISE
          </span>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Stateless AI code review tools start from zero on every single pull request. They repeat the exact same mistakes, miss architectural context, and offer generic advice. ReVise creates a compounding organizational memory so your engineering team never experiences the same SEV incident twice.
          </p>
        </section>

        {/* ========================================================================= */}
        {/* 12. FINAL CTA BANNER */}
        {/* ========================================================================= */}
        <section className="glow-card rounded-3xl p-8 sm:p-12 border border-indigo-500/30 bg-gradient-to-b from-[#101233] to-[#090a1a] text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient from-indigo-500/10 to-transparent pointer-events-none" />
          
          <div className="max-w-2xl mx-auto space-y-3 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Stop repeating yesterday&apos;s production incidents.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Evaluate a pull request or launch a memory-grounded pairing session in under 30 seconds.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 relative z-10 pt-2">
            <Link
              href="/pair-programmer"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm tracking-wide shadow-glow-md shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
            >
              <Bot className="w-4 h-4" />
              <span>Launch AI Pair Programmer</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/analyze"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#181a3a] hover:bg-[#20234f] border border-indigo-500/40 text-indigo-200 font-semibold text-sm tracking-wide transition-all hover:scale-105"
            >
              <GitPullRequest className="w-4 h-4 text-indigo-400" />
              <span>Analyze Pull Request</span>
            </Link>
          </div>
        </section>

        {/* Minimal Footer */}
        <footer className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-slate-300">ReVise</span>
            <span>— AI Code Review with Continuous Memory</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/pair-programmer" className="hover:text-slate-200 transition">Pair Programmer</Link>
            <Link href="/analyze" className="hover:text-slate-200 transition">Analyze</Link>
            <Link href="/timeline" className="hover:text-slate-200 transition">Timeline</Link>
            <Link href="/teach" className="hover:text-slate-200 transition">Teach</Link>
            <Link href="/standards" className="hover:text-slate-200 transition">Standards</Link>
          </div>
        </footer>

      </div>
    </div>
  );
}
