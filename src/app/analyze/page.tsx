'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Code2,
  FileCode,
  Shield,
  Loader2,
  Database,
  Terminal,
} from 'lucide-react';
import { DEMO_SCENARIOS } from '@/lib/seed-data';
import { FocusArea } from '@/lib/types';

const SERVICES = [
  'orders-service',
  'checkout-api',
  'payments-service',
  'inventory-service',
  'auth-service',
];

const ENVIRONMENTS = ['Production', 'Staging', 'Dev'] as const;

const POLICIES = [
  'Strict production policy',
  'Standard review',
  'Relaxed preview',
];

const ALL_FOCUS_AREAS: FocusArea[] = [
  'Unsafe DB migration',
  'Missing secret',
  'Dependency upgrade',
  'API contract change',
];

function AnalyzeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form State
  const [prTitle, setPrTitle] = useState('PR #167: Add customer-region analytics to orders');
  const [service, setService] = useState('orders-service');
  const [environment, setEnvironment] = useState<'Production' | 'Staging' | 'Dev'>('Production');
  const [policy, setPolicy] = useState('Strict production policy');
  const [fileName, setFileName] = useState('migration_v167.sql');
  const [language, setLanguage] = useState('PostgreSQL');
  const [codeSnippet, setCodeSnippet] = useState(
    `ALTER TABLE orders ADD COLUMN customer_region VARCHAR(50) NOT NULL;\nCREATE INDEX idx_orders_region ON orders(customer_region);`
  );
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>(['Unsafe DB migration']);
  
  // The Critical ON/OFF Toggle
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState<string>('');

  // Handle pre-fill from query params or scenario selector
  useEffect(() => {
    const scenarioId = searchParams.get('scenario');
    const customCode = searchParams.get('custom_code');
    const customTitle = searchParams.get('custom_title');

    if (scenarioId) {
      const found = DEMO_SCENARIOS.find(s => s.id === scenarioId);
      if (found) {
        setPrTitle(found.prTitle);
        setService(found.service);
        setEnvironment(found.environment);
        setPolicy(found.policy);
        setFileName(found.fileName);
        setLanguage(found.language);
        setCodeSnippet(found.code);
        setFocusAreas([found.focusArea]);
      }
    } else if (customCode) {
      setCodeSnippet(customCode);
      if (customTitle) setPrTitle(customTitle);
    }
  }, [searchParams]);

  const toggleFocusArea = (area: FocusArea) => {
    if (focusAreas.includes(area)) {
      setFocusAreas(focusAreas.filter(a => a !== area));
    } else {
      setFocusAreas([...focusAreas, area]);
    }
  };

  const handleAnalyze = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (memoryEnabled) {
        setSubmitStep('Querying Hindsight memory bank for causal incidents...');
      } else {
        setSubmitStep('Evaluating standard syntax rules (Memory OFF)...');
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pr_title: prTitle,
          service,
          environment,
          policy,
          focus_areas: focusAreas,
          code_snippet: codeSnippet,
          file_name: fileName,
          language,
          memory_enabled: memoryEnabled,
        }),
      });

      const data = await res.json();
      if (data.success && data.run_id) {
        setSubmitStep('Synthesizing structured risk report...');
        setTimeout(() => {
          router.push(`/report/${data.run_id}`);
        }, 300);
      } else {
        alert(data.error || 'Evaluation failed');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      alert('Error during evaluation: ' + err.message);
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcut ⌘+Enter or Ctrl+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleAnalyze();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prTitle, service, environment, policy, codeSnippet, memoryEnabled, focusAreas, isSubmitting]);

  return (
    <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
      {/* Header with Title & Memory ON/OFF Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Analyze change</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate deployment risk against persistent engineering history and standards.
          </p>
        </div>

        {/* The Hero ON/OFF Toggle */}
        <div className="flex items-center gap-3 bg-[#0d0e21] border border-white/10 p-2 rounded-xl">
          <div className="text-right">
            <p className="text-xs font-semibold text-white">
              {memoryEnabled ? 'Hindsight Memory ON' : 'Hindsight Memory OFF'}
            </p>
            <p className="text-[10px] text-slate-400">
              {memoryEnabled ? 'Grounds analysis with 42+ memories' : 'Zero memory baseline'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMemoryEnabled(!memoryEnabled)}
            className="focus:outline-none text-indigo-400 hover:text-indigo-300 transition"
            title="Toggle Hindsight Memory ON/OFF to compare memory vs memory-less review"
          >
            {memoryEnabled ? (
              <ToggleRight className="w-9 h-9 text-indigo-500 fill-indigo-500/20" />
            ) : (
              <ToggleLeft className="w-9 h-9 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* Main Form Fields Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 glow-card p-4 rounded-xl border border-white/10">
        {/* PR Title */}
        <div className="md:col-span-1 space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
            PR TITLE
          </label>
          <input
            type="text"
            value={prTitle}
            onChange={e => setPrTitle(e.target.value)}
            className="w-full px-3 py-2 bg-[#090a16] border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Service */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
            SERVICE
          </label>
          <select
            value={service}
            onChange={e => setService(e.target.value)}
            className="w-full px-3 py-2 bg-[#090a16] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            {SERVICES.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Environment */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
            ENVIRONMENT
          </label>
          <select
            value={environment}
            onChange={e => setEnvironment(e.target.value as any)}
            className="w-full px-3 py-2 bg-[#090a16] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            {ENVIRONMENTS.map(env => (
              <option key={env} value={env}>
                {env}
              </option>
            ))}
          </select>
        </div>

        {/* Policy */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
            POLICY
          </label>
          <select
            value={policy}
            onChange={e => setPolicy(e.target.value)}
            className="w-full px-3 py-2 bg-[#090a16] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            {POLICIES.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Code / Changeset Editor Card */}
      <div className="glow-card rounded-xl border border-white/10 overflow-hidden">
        {/* Card Header matching Screenshot 2 */}
        <div className="px-4 py-3 bg-[#0a0b17] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 3 Color Dots */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
            </div>

            {/* Tab */}
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#13152a] text-xs font-mono text-slate-200 border border-white/5">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>{fileName}</span>
            </div>
          </div>

          <span className="text-[11px] font-mono text-slate-400 font-semibold px-2 py-0.5 rounded bg-white/5">
            {language}
          </span>
        </div>

        {/* Code Input with Line Numbers */}
        <div className="bg-[#070811] p-4 flex gap-4 min-h-[160px] font-mono text-xs">
          {/* Line Numbers */}
          <div className="text-slate-600 select-none text-right pr-2 border-r border-white/5 space-y-1">
            {codeSnippet.split('\n').map((_, idx) => (
              <div key={idx}>{idx + 1}</div>
            ))}
          </div>

          {/* Editable Code */}
          <textarea
            value={codeSnippet}
            onChange={e => setCodeSnippet(e.target.value)}
            rows={Math.max(5, codeSnippet.split('\n').length)}
            spellCheck={false}
            className="flex-1 bg-transparent text-indigo-200 focus:outline-none resize-none leading-relaxed font-mono selection:bg-indigo-500/30"
          />
        </div>
      </div>

      {/* Focus Areas Row */}
      <div className="space-y-2">
        <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
          FOCUS AREAS
        </label>
        <div className="flex flex-wrap gap-2">
          {ALL_FOCUS_AREAS.map(area => {
            const isSelected = focusAreas.includes(area);
            return (
              <button
                key={area}
                type="button"
                onClick={() => toggleFocusArea(area)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                  isSelected
                    ? 'bg-indigo-600 text-white border border-indigo-400/50 shadow-glow-sm shadow-indigo-500/30'
                    : 'bg-[#0d0e21] text-slate-400 border border-white/10 hover:border-white/20 hover:text-slate-200'
                }`}
              >
                {area}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Row / CTA Footer */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded font-mono text-[10px] text-slate-400">
            ⌘ + ↵
          </kbd>
          <span>to start evaluation</span>
        </div>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleAnalyze}
          className={`flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg font-semibold text-xs tracking-wide transition shadow-lg ${
            memoryEnabled
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-glow-md shadow-indigo-500/30'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-200 shadow-slate-900'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>{submitStep || 'Evaluating with ReVise...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-indigo-300" />
              <span>
                {memoryEnabled
                  ? 'Analyze with Hindsight memory'
                  : 'Analyze without memory (Generic)'}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 text-xs">Loading analyzer...</div>}>
      <AnalyzeContent />
    </Suspense>
  );
}
