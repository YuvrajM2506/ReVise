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
          <h2 className="text-2xl font-bold text-[#F0F6F6] tracking-tight">Analyze change</h2>
          <p className="text-xs text-[#8CA0A8] mt-0.5">
            Evaluate deployment risk against persistent engineering history and standards.
          </p>
        </div>

        {/* The Hero ON/OFF Toggle */}
        <div className="flex items-center gap-3 bg-[#0B1B20] border border-[#163842] p-2.5 rounded-xl">
          <div className="text-right">
            <p className="text-xs font-semibold text-[#F0F6F6]">
              {memoryEnabled ? 'Hindsight Memory ON' : 'Hindsight Memory OFF'}
            </p>
            <p className="text-[10px] text-[#8CA0A8] font-mono">
              {memoryEnabled ? 'Grounded with 42+ memories' : 'Zero memory baseline'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMemoryEnabled(!memoryEnabled)}
            className="focus:outline-none transition"
            title="Toggle Hindsight Memory ON/OFF to compare memory vs memory-less review"
          >
            {memoryEnabled ? (
              <ToggleRight className="w-9 h-9 text-[#02A0A0] fill-[#02A0A0]/20" />
            ) : (
              <ToggleLeft className="w-9 h-9 text-[#5A7178]" />
            )}
          </button>
        </div>
      </div>

      {/* Main Form Fields Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 glow-card p-4 rounded-xl border border-[#163842] bg-[#0B1B20]">
        {/* PR Title */}
        <div className="md:col-span-1 space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8CA0A8]">
            PR TITLE
          </label>
          <input
            type="text"
            value={prTitle}
            onChange={e => setPrTitle(e.target.value)}
            className="w-full px-3 py-2 bg-[#071317] border border-[#163842]/60 rounded-lg text-xs text-[#F0F6F6] placeholder-[#5A7178] focus:outline-none focus:border-[#02A0A0]"
          />
        </div>

        {/* Service */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8CA0A8]">
            SERVICE
          </label>
          <select
            value={service}
            onChange={e => setService(e.target.value)}
            className="w-full px-3 py-2 bg-[#071317] border border-[#163842]/60 rounded-lg text-xs text-[#F0F6F6] focus:outline-none focus:border-[#02A0A0]"
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
          <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8CA0A8]">
            ENVIRONMENT
          </label>
          <select
            value={environment}
            onChange={e => setEnvironment(e.target.value as any)}
            className="w-full px-3 py-2 bg-[#071317] border border-[#163842]/60 rounded-lg text-xs text-[#F0F6F6] focus:outline-none focus:border-[#02A0A0]"
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
          <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8CA0A8]">
            POLICY
          </label>
          <select
            value={policy}
            onChange={e => setPolicy(e.target.value)}
            className="w-full px-3 py-2 bg-[#071317] border border-[#163842]/60 rounded-lg text-xs text-[#F0F6F6] focus:outline-none focus:border-[#02A0A0]"
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
      <div className="glow-card rounded-xl border border-[#163842] bg-[#0B1B20] overflow-hidden">
        {/* Technical Window Header */}
        <div className="px-4 py-2.5 bg-[#071317] border-b border-[#163842]/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 3 Technical Status Dots */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E55353]/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD65]/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#02A0A0]/80"></span>
            </div>

            {/* Tab */}
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#0B1B20] text-xs font-mono text-[#F0F6F6] border border-[#163842]/40">
              <FileCode className="w-3.5 h-3.5 text-[#02A0A0]" />
              <span>{fileName}</span>
            </div>
          </div>

          <span className="text-[11px] font-mono text-[#8CA0A8] font-semibold px-2 py-0.5 rounded bg-[#0B1B20] border border-[#163842]/40">
            {language}
          </span>
        </div>

        {/* Code Input with Line Numbers */}
        <div className="bg-[#050E11] p-4 flex gap-4 min-h-[160px] font-mono text-xs">
          {/* Line Numbers */}
          <div className="text-[#5A7178] select-none text-right pr-2 border-r border-[#163842]/30 space-y-1">
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
            className="flex-1 bg-transparent text-[#02A0A0] focus:outline-none resize-none leading-relaxed font-mono selection:bg-[#02A0A0]/25"
          />
        </div>
      </div>

      {/* Focus Areas Row */}
      <div className="space-y-2">
        <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8CA0A8]">
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
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  isSelected
                    ? 'bg-[#02A0A0] text-[#071317] font-bold shadow-sm'
                    : 'bg-[#0B1B20] text-[#8CA0A8] border border-[#163842]/60 hover:border-[#02A0A0]/40 hover:text-[#F0F6F6]'
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
        <div className="text-xs text-[#5A7178] flex items-center gap-2">
          <kbd className="px-2 py-1 bg-[#0B1B20] border border-[#163842]/50 rounded font-mono text-[10px] text-[#8CA0A8]">
            ⌘ + ↵
          </kbd>
          <span>to start evaluation</span>
        </div>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleAnalyze}
          className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-xs tracking-wide transition shadow-sm ${
            memoryEnabled
              ? 'bg-[#02A0A0] hover:bg-[#028787] text-[#071317]'
              : 'bg-[#0B1B20] hover:bg-[#0E2229] border border-[#163842] text-[#8CA0A8] hover:text-[#F0F6F6]'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#071317]" />
              <span>{submitStep || 'Evaluating with ReVise...'}</span>
            </>
          ) : (
            <>
              <Sparkles className={`w-4 h-4 ${memoryEnabled ? 'text-[#071317]' : 'text-[#02A0A0]'}`} />
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
