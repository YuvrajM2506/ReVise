'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Bot,
  Sparkles,
  GitBranch,
  FileCode,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  Terminal,
  Database,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  X,
  Plus,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { FocusArea, MemoryItem } from '@/lib/types';

interface AiderResult {
  success: boolean;
  diff: string;
  files_changed: string[];
  log: string;
  error?: string | null;
  memory_context?: string[];
  memories?: MemoryItem[];
  memories_recalled_count?: number;
}

interface ServiceHealth {
  connected: boolean;
  status?: string;
  valid?: boolean;
  provider?: string;
  model?: string;
  error?: string;
  service_url?: string;
}

const PRESET_SCENARIOS = [
  {
    id: 'db-migration',
    label: 'PostgreSQL Migration Fix',
    badge: 'High Impact',
    service: 'orders-service',
    focusArea: 'Unsafe DB migration' as FocusArea,
    repoUrl: '.',
    targetFiles: ['migration_v167.sql'],
    task: `Refactor migration_v167.sql to prevent table-level exclusive locks during deployment:
1. Make customer_region nullable without locking the table.
2. Create the index on customer_region using CREATE INDEX CONCURRENTLY.
3. Validate schema and follow zero-downtime PostgreSQL migration practices.`,
  },
  {
    id: 'auth-secret',
    label: 'JWT Secret Fallback Guard',
    badge: 'Security',
    service: 'auth-service',
    focusArea: 'Missing secret' as FocusArea,
    repoUrl: '.',
    targetFiles: ['src/lib/auth.ts'],
    task: `Update auth.ts so that missing JWT secrets in production throw an explicit fatal error instead of silently falling back to a default development secret string. Add environment validation.`,
  },
  {
    id: 'api-timeout',
    label: 'HTTP Client Timeout & Retries',
    badge: 'Reliability',
    service: 'checkout-api',
    focusArea: 'API contract change' as FocusArea,
    repoUrl: '.',
    targetFiles: ['src/lib/client.ts'],
    task: `Configure strict 5000ms timeouts, exponential backoff retries (up to 3 attempts), and circuit-breaker handling on all outbound HTTP calls to payments-service.`,
  },
];

const SERVICES = [
  'orders-service',
  'checkout-api',
  'payments-service',
  'inventory-service',
  'auth-service',
];

const FOCUS_AREAS: FocusArea[] = [
  'Unsafe DB migration',
  'Missing secret',
  'Dependency upgrade',
  'API contract change',
];

function PairProgrammerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form State
  const [repoUrl, setRepoUrl] = useState('.');
  const [task, setTask] = useState(
    `Refactor migration_v167.sql to prevent table-level exclusive locks during deployment:
1. Make customer_region nullable without locking the table.
2. Create the index on customer_region using CREATE INDEX CONCURRENTLY.
3. Validate schema and follow zero-downtime PostgreSQL migration practices.`
  );
  const [targetFiles, setTargetFiles] = useState<string[]>(['migration_v167.sql']);
  const [newFileTag, setNewFileTag] = useState('');
  const [service, setService] = useState('orders-service');
  const [focusArea, setFocusArea] = useState<FocusArea>('Unsafe DB migration');
  const [useMemory, setUseMemory] = useState(true);

  // Execution & Result State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState('');
  const [result, setResult] = useState<AiderResult | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Health Status
  const [health, setHealth] = useState<ServiceHealth | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  // UI Panels
  const [logExpanded, setLogExpanded] = useState(false);
  const [memoriesExpanded, setMemoriesExpanded] = useState(true);
  const [copiedDiff, setCopiedDiff] = useState(false);
  const [copiedLog, setCopiedLog] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  // Check health on mount
  const checkServiceHealth = async () => {
    setCheckingHealth(true);
    try {
      const res = await fetch('/api/aider/health');
      const data = await res.json();
      setHealth(data);
    } catch (e: any) {
      setHealth({
        connected: false,
        status: 'unreachable',
        valid: false,
        error: e.message,
      });
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkServiceHealth();
  }, []);

  // Handle URL query parameters for pre-filling
  useEffect(() => {
    const scenarioQuery = searchParams.get('scenario');
    const taskQuery = searchParams.get('task');
    const filesQuery = searchParams.get('files');
    const serviceQuery = searchParams.get('service');

    if (scenarioQuery) {
      const found = PRESET_SCENARIOS.find(s => s.id === scenarioQuery);
      if (found) {
        setTask(found.task);
        setTargetFiles(found.targetFiles);
        setService(found.service);
        setFocusArea(found.focusArea);
        setRepoUrl(found.repoUrl);
      }
    } else {
      if (taskQuery) setTask(taskQuery);
      if (filesQuery) setTargetFiles(filesQuery.split(',').map(s => s.trim()).filter(Boolean));
      if (serviceQuery) setService(serviceQuery);
    }
  }, [searchParams]);

  const handleAddFileTag = () => {
    const trimmed = newFileTag.trim();
    if (trimmed && !targetFiles.includes(trimmed)) {
      setTargetFiles([...targetFiles, trimmed]);
      setNewFileTag('');
    }
  };

  const handleRemoveFileTag = (fileName: string) => {
    setTargetFiles(targetFiles.filter(f => f !== fileName));
  };

  const handleSelectScenario = (scenario: (typeof PRESET_SCENARIOS)[0]) => {
    setTask(scenario.task);
    setTargetFiles(scenario.targetFiles);
    setService(scenario.service);
    setFocusArea(scenario.focusArea);
    setRepoUrl(scenario.repoUrl);
    setResult(null);
    setErrorDetails(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorDetails(null);
    setResult(null);

    try {
      if (useMemory) {
        setSubmitStep('Recalling Hindsight organizational memories...');
      } else {
        setSubmitStep('Initiating Aider session (Memory OFF)...');
      }

      await new Promise(r => setTimeout(r, 400));
      setSubmitStep('Cloning target repository into isolated sandbox...');

      await new Promise(r => setTimeout(r, 400));
      setSubmitStep('Aider agent generating code changes...');

      const res = await fetch('/api/aider/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_url: repoUrl,
          task,
          target_files: targetFiles,
          use_memory: useMemory,
          service,
          focus_area: focusArea,
        }),
      });

      const data: AiderResult = await res.json();

      if (res.ok && data.success) {
        setResult(data);
        if (data.log) setLogExpanded(false);
      } else {
        setErrorDetails(data.error || 'Aider execution failed.');
        setResult(data);
      }
    } catch (err: any) {
      console.error('Pair programmer run error:', err);
      setErrorDetails(err.message || 'Network error communicating with Aider service.');
    } finally {
      setIsSubmitting(false);
      setSubmitStep('');
    }
  };

  const handleCopyDiff = () => {
    if (!result?.diff) return;
    navigator.clipboard.writeText(result.diff);
    setCopiedDiff(true);
    setTimeout(() => setCopiedDiff(false), 2000);
  };

  const handleCopyLog = () => {
    if (!result?.log) return;
    navigator.clipboard.writeText(result.log);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  // Re-analyze flow: Send the fixed code directly into ReVise /api/analyze
  const handleReAnalyze = async () => {
    if (!result?.diff) return;
    setIsReanalyzing(true);

    try {
      // Extract modified content or the diff as snippet
      const modifiedSnippet = result.diff;
      const primaryFile = targetFiles[0] || 'fixed_code.sql';

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pr_title: `Pair Programmer Fix: ${task.slice(0, 50)}...`,
          service,
          environment: 'Production',
          policy: 'Strict production policy',
          focus_areas: [focusArea],
          code_snippet: modifiedSnippet,
          file_name: primaryFile,
          language: primaryFile.endsWith('.sql')
            ? 'PostgreSQL'
            : primaryFile.endsWith('.ts')
            ? 'TypeScript'
            : 'Code',
          memory_enabled: true,
        }),
      });

      const data = await res.json();
      if (data.success && data.run_id) {
        router.push(`/report/${data.run_id}`);
      } else {
        alert(data.error || 'Failed to re-analyze diff');
      }
    } catch (err: any) {
      alert('Error during re-analysis: ' + err.message);
    } finally {
      setIsReanalyzing(false);
    }
  };

  // Render unified diff lines with syntax highlighting
  const renderDiffLines = (diffText: string) => {
    const lines = diffText.split('\n');
    return lines.map((line, idx) => {
      let bgClass = 'bg-transparent text-slate-300';
      let symbolColor = 'text-slate-500';

      if (line.startsWith('+') && !line.startsWith('+++')) {
        bgClass = 'bg-emerald-500/10 text-emerald-300 border-l-2 border-emerald-500 pl-2 font-semibold';
        symbolColor = 'text-emerald-400 font-bold';
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        bgClass = 'bg-pink-500/10 text-pink-300 border-l-2 border-pink-500 pl-2 font-semibold';
        symbolColor = 'text-pink-400 font-bold';
      } else if (line.startsWith('@@')) {
        bgClass = 'bg-indigo-500/15 text-indigo-300 font-bold py-0.5';
        symbolColor = 'text-indigo-400';
      } else if (line.startsWith('diff --git') || line.startsWith('index ') || line.startsWith('--- ') || line.startsWith('+++ ')) {
        bgClass = 'text-slate-400 font-bold bg-white/5';
        symbolColor = 'text-slate-500';
      }

      return (
        <div key={idx} className={`font-mono text-xs leading-relaxed flex items-start ${bgClass}`}>
          <span className="w-8 select-none text-right pr-3 text-[11px] text-slate-600 shrink-0 font-mono">
            {idx + 1}
          </span>
          <span className="flex-1 whitespace-pre-wrap break-all">{line}</span>
        </div>
      );
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
      {/* Top Header & Health + Memory Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shadow-glow-sm shadow-indigo-500/20">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">AI Pair Programmer</h2>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Aider Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch tasks to Aider grounded with persistent organizational memory from Hindsight to generate safe, verified code diffs.
          </p>
        </div>

        {/* Top Right Controls: Service Status & Memory Toggle */}
        <div className="flex items-center gap-3">
          {/* Aider Service Health Pill */}
          <div className="bg-[#0d0e21] border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  health?.valid ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  health?.valid ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              ></span>
            </span>
            <div className="text-left">
              <p className="text-[11px] font-semibold text-white">
                {health?.valid
                  ? `${health.provider || 'LLM'} Connected`
                  : health?.connected
                  ? 'Key Needed'
                  : 'Service Offline'}
              </p>
              <p className="text-[9px] text-slate-400 font-mono">Port: 8001</p>
            </div>
            <button
              type="button"
              onClick={checkServiceHealth}
              disabled={checkingHealth}
              title="Refresh Aider backend service status"
              className="ml-1 text-slate-400 hover:text-white transition"
            >
              <RefreshCw className={`w-3 h-3 ${checkingHealth ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>

          {/* Hindsight Memory Toggle */}
          <div className="flex items-center gap-2.5 bg-[#0d0e21] border border-white/10 p-2 rounded-xl">
            <div className="text-right">
              <p className="text-xs font-semibold text-white">
                {useMemory ? 'Memory ON' : 'Memory OFF'}
              </p>
              <p className="text-[9px] text-slate-400">
                {useMemory ? 'Grounded with Hindsight' : 'Zero memory baseline'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setUseMemory(!useMemory)}
              className="focus:outline-none transition"
              title="Toggle Hindsight Memory to compare memory-informed vs generic Aider fixes"
            >
              <span
                className={`inline-block w-8 h-4 rounded-full transition-colors relative ${
                  useMemory ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block w-3.5 h-3.5 rounded-full bg-white transition-transform transform absolute top-0.25 ${
                    useMemory ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Preset Scenario Quick-Picks */}
      <div className="space-y-2">
        <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
          PRESET SCENARIOS & REMEDIATION TASKS
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESET_SCENARIOS.map(scenario => {
            const isSelected = targetFiles.includes(scenario.targetFiles[0]) && service === scenario.service;
            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => handleSelectScenario(scenario)}
                className={`p-3 rounded-xl text-left border transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#10122e] border-indigo-500/60 shadow-glow-sm shadow-indigo-500/20'
                    : 'bg-[#090a16] border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white">{scenario.label}</span>
                  <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {scenario.badge}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <FileCode className="w-3 h-3 text-indigo-400" />
                  <span>{scenario.targetFiles.join(', ')}</span>
                  <span className="text-slate-600">•</span>
                  <span>{scenario.service}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Input Form Card */}
      <form onSubmit={handleSubmit} className="glow-card p-6 rounded-2xl border border-white/10 space-y-5">
        {/* Service & Focus Area Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
              TARGET SERVICE
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

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
              FOCUS AREA
            </label>
            <select
              value={focusArea}
              onChange={e => setFocusArea(e.target.value as FocusArea)}
              className="w-full px-3 py-2 bg-[#090a16] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {FOCUS_AREAS.map(f => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Repository URL & Target Files Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Repo URL */}
          <div className="md:col-span-1 space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
              REPOSITORY URL / PATH
            </label>
            <div className="relative">
              <input
                type="text"
                value={repoUrl}
                onChange={e => setRepoUrl(e.target.value)}
                placeholder="e.g. . or https://github.com/..."
                className="w-full pl-8 pr-3 py-2 bg-[#090a16] border border-white/10 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <GitBranch className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
            <p className="text-[10px] text-slate-500">
              Supports GitHub clone URLs or local repository paths.
            </p>
          </div>

          {/* Target Files Multi-Select Chips */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
              TARGET FILES FOR AIDER
            </label>
            <div className="min-h-[38px] p-1.5 bg-[#090a16] border border-white/10 rounded-lg flex flex-wrap items-center gap-2">
              {targetFiles.map(file => (
                <span
                  key={file}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#151733] border border-indigo-500/30 text-indigo-300 font-mono text-xs"
                >
                  <FileCode className="w-3 h-3 text-indigo-400" />
                  <span>{file}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFileTag(file)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {/* Add file input */}
              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  value={newFileTag}
                  onChange={e => setNewFileTag(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFileTag();
                    }
                  }}
                  placeholder="Add target file (e.g. schema.sql)..."
                  className="bg-transparent px-2 py-0.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddFileTag}
                  className="p-1 text-indigo-400 hover:text-indigo-300"
                  title="Add target file"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Task & Instructions */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
            AIDER TASK & INSTRUCTIONS
          </label>
          <textarea
            value={task}
            onChange={e => setTask(e.target.value)}
            rows={4}
            placeholder="Describe the code modification or bugfix you want Aider to implement..."
            className="w-full p-3 bg-[#090a16] border border-white/10 rounded-xl text-xs text-indigo-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed resize-y"
          />
        </div>

        {/* Bottom CTA Row */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>
              {useMemory
                ? 'Hindsight will inject relevant post-mortems and incident memories into Aider.'
                : 'Running in raw baseline mode without memory context.'}
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg font-semibold text-xs tracking-wide transition shadow-lg ${
              isSubmitting
                ? 'bg-indigo-600/70 text-white cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-glow-md shadow-indigo-500/30'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{submitStep || 'Pairing with Aider...'}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run Aider Pair Session</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Real Error Card (surface genuine failure details) */}
      {errorDetails && (
        <div className="p-5 rounded-2xl bg-pink-500/10 border border-pink-500/30 space-y-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-pink-400 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-pink-300">Aider Execution Error</h3>
              <p className="text-xs text-pink-200/90 leading-relaxed mt-0.5">{errorDetails}</p>
            </div>
          </div>

          {/* Actionable hints */}
          <div className="p-3 bg-[#080911] rounded-xl border border-white/5 text-[11px] text-slate-400 space-y-1.5 font-mono">
            <p className="text-slate-300 font-semibold">Troubleshooting Steps:</p>
            <p>1. Ensure FastAPI backend is running: <span className="text-indigo-300">cd aider-service && uvicorn main:app --port 8001</span></p>
            <p>2. Verify your LLM API key in <span className="text-indigo-300">.env.local</span> (e.g. <span className="text-indigo-300">OPENAI_API_KEY</span>, <span className="text-indigo-300">GROQ_API_KEY</span>, or <span className="text-indigo-300">ANTHROPIC_API_KEY</span>).</p>
          </div>
        </div>
      )}

      {/* Result Section: Diff Viewer, Log Panel, Memory Evidence */}
      {result && (
        <div className="space-y-6">
          {/* Result Banner */}
          <div className="glow-card rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-slate-400">
                  AIDER SESSION RESULT
                </span>
                {result.success ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    SUCCESS
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    COMPLETED WITH NOTES
                  </span>
                )}
              </div>

              <h3 className="text-xl font-bold text-white tracking-tight">
                {result.files_changed.length > 0
                  ? `Generated changes in ${result.files_changed.length} file(s)`
                  : 'Aider completed execution'}
              </h3>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 pt-1">
                {result.files_changed.map(f => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#12142e] border border-indigo-500/30 text-indigo-300 font-mono text-[11px]"
                  >
                    <FileCode className="w-3 h-3 text-indigo-400" />
                    <span>{f}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Re-Analyze CTA Button */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCopyDiff}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#14162e] hover:bg-[#1a1d3d] border border-white/10 text-xs font-medium text-slate-200 transition"
              >
                {copiedDiff ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Diff Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Diff</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReAnalyze}
                disabled={isReanalyzing || !result.diff}
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-glow-sm shadow-emerald-500/30 transition"
              >
                {isReanalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Re-analyzing in ReVise...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-200" />
                    <span>Re-analyze this diff</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Unified Diff Viewer Card */}
          <div className="glow-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-5 py-3.5 bg-[#0a0b17] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* 3 Color Dots */}
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-200">
                  <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-semibold">Unified Git Diff</span>
                </div>
              </div>

              <span className="text-[11px] font-mono text-slate-400">
                {result.diff.split('\n').length} lines
              </span>
            </div>

            {/* Diff Lines Container */}
            <div className="p-4 bg-[#070811] overflow-x-auto max-h-[500px] overflow-y-auto">
              {result.diff ? (
                renderDiffLines(result.diff)
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  No working tree diff detected. Check the raw logs below for execution details.
                </div>
              )}
            </div>
          </div>

          {/* Injected Memory Citations Panel */}
          {result.memories && result.memories.length > 0 && (
            <div className="glow-card p-5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold text-white tracking-wide uppercase">
                    Hindsight Memories Injected into Aider ({result.memories.length})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setMemoriesExpanded(!memoriesExpanded)}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  <span>{memoriesExpanded ? 'Collapse' : 'Expand'}</span>
                  {memoriesExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {memoriesExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {result.memories.map(m => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-xl bg-[#090a16] border border-white/5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-semibold uppercase tracking-wider text-indigo-300">
                          {m.type.replace('_', ' ')}
                        </span>
                        <span>{m.service}</span>
                      </div>
                      <h5 className="text-xs font-semibold text-white">{m.title}</h5>
                      <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                        {m.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Raw Log Collapsible Panel */}
          {result.log && (
            <div className="glow-card rounded-2xl border border-white/10 overflow-hidden">
              <button
                type="button"
                onClick={() => setLogExpanded(!logExpanded)}
                className="w-full px-5 py-3.5 bg-[#0a0b17] flex items-center justify-between hover:bg-[#0d0e21] transition text-left"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Aider Execution Raw Log</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {result.log.split('\n').length} lines
                  </span>
                  {logExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {logExpanded && (
                <div className="p-4 bg-[#05060c] border-t border-white/5 relative">
                  <button
                    type="button"
                    onClick={handleCopyLog}
                    className="absolute top-3 right-3 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] text-slate-300 flex items-center gap-1 transition"
                  >
                    {copiedLog ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLog ? 'Copied' : 'Copy log'}</span>
                  </button>
                  <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-[400px] overflow-y-auto whitespace-pre-wrap">
                    {result.log}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PairProgrammerPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-8 py-20 text-center">
          <div className="inline-block animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-sm text-slate-400">Loading AI Pair Programmer...</p>
        </div>
      }
    >
      <PairProgrammerContent />
    </Suspense>
  );
}
