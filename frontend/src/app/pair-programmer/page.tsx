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
      let bgClass = 'bg-transparent text-[#8CA0A8]';

      if (line.startsWith('+') && !line.startsWith('+++')) {
        bgClass = 'bg-[#02A0A0]/10 text-[#5EEAD4] border-l-2 border-[#02A0A0] pl-2 font-medium';
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        bgClass = 'bg-[#E55353]/10 text-[#FCA5A5] border-l-2 border-[#E55353] pl-2 font-medium';
      } else if (line.startsWith('@@')) {
        bgClass = 'bg-[#0E2229] text-[#02A0A0] font-bold py-0.5 border-l-2 border-[#02A0A0]/50 pl-2';
      } else if (line.startsWith('diff --git') || line.startsWith('index ') || line.startsWith('--- ') || line.startsWith('+++ ')) {
        bgClass = 'text-[#5A7178] font-bold bg-[#071317]';
      }

      return (
        <div key={idx} className={`font-mono text-xs leading-relaxed flex items-start ${bgClass}`}>
          <span className="w-8 select-none text-right pr-3 text-[11px] text-[#5A7178] shrink-0 font-mono">
            {idx + 1}
          </span>
          <span className="flex-1 whitespace-pre-wrap break-all">{line}</span>
        </div>
      );
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Top Header & Health + Memory Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#02A0A0]/15 text-[#02A0A0] flex items-center justify-center border border-[#02A0A0]/30 shadow-[0_0_12px_rgba(2,160,160,0.15)]">
              <Bot className="w-4 h-4 text-[#02A0A0]" />
            </div>
            <h2 className="text-2xl font-bold text-[#F0F6F6] tracking-tight">AI Pair Programmer</h2>
            <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-[#02A0A0]/15 text-[#02A0A0] border border-[#02A0A0]/30">
              Aider Engine
            </span>
          </div>
          <p className="text-xs text-[#8CA0A8] mt-1">
            Dispatch tasks to Aider grounded with persistent organizational memory from Hindsight to generate safe, verified code diffs.
          </p>
        </div>

        {/* Top Right Controls: Service Status & Memory Toggle */}
        <div className="flex items-center gap-3">
          {/* Aider Service Health Pill */}
          <div className="bg-[#0B1B20] border border-[#163842] px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  health?.valid ? 'bg-[#02A0A0]' : 'bg-[#FFBD65]'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  health?.valid ? 'bg-[#02A0A0]' : 'bg-[#FFBD65]'
                }`}
              ></span>
            </span>
            <div className="text-left">
              <p className="text-[11px] font-semibold text-[#F0F6F6]">
                {health?.valid
                  ? `${health.provider || 'LLM'} Connected`
                  : health?.connected
                  ? 'Key Needed'
                  : 'Service Offline'}
              </p>
              <p className="text-[9px] text-[#5A7178] font-mono">Port: 8001</p>
            </div>
            <button
              type="button"
              onClick={checkServiceHealth}
              disabled={checkingHealth}
              title="Refresh Aider backend service status"
              className="ml-1 text-[#8CA0A8] hover:text-[#02A0A0] transition"
            >
              <RefreshCw className={`w-3 h-3 ${checkingHealth ? 'animate-spin text-[#02A0A0]' : ''}`} />
            </button>
          </div>

          {/* Hindsight Memory Toggle */}
          <div className="flex items-center gap-2.5 bg-[#0B1B20] border border-[#163842] p-2 rounded-xl">
            <div className="text-right">
              <p className="text-xs font-semibold text-[#F0F6F6]">
                {useMemory ? 'Memory ON' : 'Memory OFF'}
              </p>
              <p className="text-[9px] text-[#8CA0A8]">
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
                  useMemory ? 'bg-[#02A0A0]' : 'bg-[#163842]'
                }`}
              >
                <span
                  className={`inline-block w-3.5 h-3.5 rounded-full bg-[#071317] transition-transform transform absolute top-0.25 ${
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
        <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8CA0A8]">
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
                className={`p-3.5 rounded-xl text-left border transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#0E2229] border-[#02A0A0] shadow-[0_0_15px_rgba(2,160,160,0.12)]'
                    : 'bg-[#0B1B20] border-[#163842] hover:border-[#02A0A0]/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#F0F6F6]">{scenario.label}</span>
                  <span className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded ${
                    scenario.badge === 'High Impact'
                      ? 'bg-[#FFBD65]/15 text-[#FFBD65] border border-[#FFBD65]/30'
                      : 'bg-[#02A0A0]/15 text-[#02A0A0] border border-[#02A0A0]/30'
                  }`}>
                    {scenario.badge}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-2 text-[10px] text-[#8CA0A8] font-mono">
                  <FileCode className="w-3 h-3 text-[#02A0A0]" />
                  <span>{scenario.targetFiles.join(', ')}</span>
                  <span className="text-[#5A7178]">•</span>
                  <span>{scenario.service}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Input Form Card */}
      <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-[#0B1B20] border border-[#163842] space-y-5">
        {/* Service & Focus Area Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8CA0A8]">
              TARGET SERVICE
            </label>
            <select
              value={service}
              onChange={e => setService(e.target.value)}
              className="w-full px-3 py-2 bg-[#071317] border border-[#163842] rounded-lg text-xs text-[#F0F6F6] focus:outline-none focus:border-[#02A0A0]"
            >
              {SERVICES.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8CA0A8]">
              FOCUS AREA
            </label>
            <select
              value={focusArea}
              onChange={e => setFocusArea(e.target.value as FocusArea)}
              className="w-full px-3 py-2 bg-[#071317] border border-[#163842] rounded-lg text-xs text-[#F0F6F6] focus:outline-none focus:border-[#02A0A0]"
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
            <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8CA0A8]">
              REPOSITORY URL / PATH
            </label>
            <div className="relative">
              <input
                type="text"
                value={repoUrl}
                onChange={e => setRepoUrl(e.target.value)}
                placeholder="e.g. . or https://github.com/..."
                className="w-full pl-8 pr-3 py-2 bg-[#071317] border border-[#163842] rounded-lg text-xs font-mono text-[#F0F6F6] placeholder-[#5A7178] focus:outline-none focus:border-[#02A0A0]"
              />
              <GitBranch className="w-3.5 h-3.5 text-[#5A7178] absolute left-2.5 top-2.5" />
            </div>
            <p className="text-[10px] text-[#5A7178]">
              Supports GitHub clone URLs or local repository paths.
            </p>
          </div>

          {/* Target Files Multi-Select Chips */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8CA0A8]">
              TARGET FILES FOR AIDER
            </label>
            <div className="min-h-[38px] p-1.5 bg-[#071317] border border-[#163842] rounded-lg flex flex-wrap items-center gap-2">
              {targetFiles.map(file => (
                <span
                  key={file}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0E2229] border border-[#02A0A0]/30 text-[#02A0A0] font-mono text-xs"
                >
                  <FileCode className="w-3 h-3 text-[#02A0A0]" />
                  <span>{file}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFileTag(file)}
                    className="text-[#8CA0A8] hover:text-[#F0F6F6]"
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
                  className="bg-transparent px-2 py-0.5 text-xs font-mono text-[#F0F6F6] placeholder-[#5A7178] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddFileTag}
                  className="p-1 text-[#02A0A0] hover:text-[#028F8F]"
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
          <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8CA0A8]">
            AIDER TASK & INSTRUCTIONS
          </label>
          <textarea
            value={task}
            onChange={e => setTask(e.target.value)}
            rows={4}
            placeholder="Describe the code modification or bugfix you want Aider to implement..."
            className="w-full p-3 bg-[#071317] border border-[#163842] rounded-lg text-xs text-[#F0F6F6] placeholder-[#5A7178] focus:outline-none focus:border-[#02A0A0] font-mono leading-relaxed resize-y"
          />
        </div>

        {/* Bottom CTA Row */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#163842]">
          <div className="flex items-center gap-2 text-xs text-[#8CA0A8]">
            <Sparkles className="w-4 h-4 text-[#02A0A0]" />
            <span>
              {useMemory
                ? 'Hindsight will inject relevant post-mortems and incident memories into Aider.'
                : 'Running in raw baseline mode without memory context.'}
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-xs tracking-wide transition ${
              isSubmitting
                ? 'bg-[#02A0A0]/60 text-[#071317] cursor-not-allowed'
                : 'bg-[#02A0A0] hover:bg-[#028F8F] text-[#071317]'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#071317]" />
                <span>{submitStep || 'Pairing with Aider...'}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-[#071317]" />
                <span>Run Aider Pair Session</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Real Error Card */}
      {errorDetails && (
        <div className="p-5 rounded-xl bg-[#140D10] border border-[#E55353]/30 space-y-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#E55353] shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-[#E55353]">Aider Execution Error</h3>
              <p className="text-xs text-[#F0F6F6] leading-relaxed mt-0.5">{errorDetails}</p>
            </div>
          </div>

          {/* Actionable hints */}
          <div className="p-3 bg-[#071317] rounded-lg border border-[#163842] text-[11px] text-[#8CA0A8] space-y-1.5 font-mono">
            <p className="text-[#F0F6F6] font-semibold">Troubleshooting Steps:</p>
            <p>1. Ensure FastAPI backend is running: <span className="text-[#02A0A0]">cd aider-service && uvicorn main:app --port 8001</span></p>
            <p>2. Verify your LLM API key in <span className="text-[#02A0A0]">.env.local</span> (e.g. <span className="text-[#02A0A0]">OPENAI_API_KEY</span>, <span className="text-[#02A0A0]">GROQ_API_KEY</span>, or <span className="text-[#02A0A0]">ANTHROPIC_API_KEY</span>).</p>
          </div>
        </div>
      )}

      {/* Result Section: Diff Viewer, Log Panel, Memory Evidence */}
      {result && (
        <div className="space-y-6">
          {/* Result Banner */}
          <div className="p-6 rounded-xl bg-[#0B1B20] border border-[#163842] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest uppercase font-semibold text-[#8CA0A8]">
                  AIDER SESSION RESULT
                </span>
                {result.success ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#02A0A0]/15 text-[#02A0A0] border border-[#02A0A0]/30">
                    SUCCESS
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FFBD65]/15 text-[#FFBD65] border border-[#FFBD65]/30">
                    COMPLETED WITH NOTES
                  </span>
                )}
              </div>

              <h3 className="text-xl font-bold text-[#F0F6F6] tracking-tight">
                {result.files_changed.length > 0
                  ? `Generated changes in ${result.files_changed.length} file(s)`
                  : 'Aider completed execution'}
              </h3>

              <div className="flex flex-wrap items-center gap-2 text-xs text-[#8CA0A8] pt-1">
                {result.files_changed.map(f => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#071317] border border-[#163842] text-[#02A0A0] font-mono text-[11px]"
                  >
                    <FileCode className="w-3 h-3 text-[#02A0A0]" />
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
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#071317] hover:bg-[#0E2229] border border-[#163842] text-xs font-medium text-[#F0F6F6] transition"
              >
                {copiedDiff ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#02A0A0]" />
                    <span className="text-[#02A0A0]">Diff Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#8CA0A8]" />
                    <span>Copy Diff</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReAnalyze}
                disabled={isReanalyzing || !result.diff}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#02A0A0] hover:bg-[#028F8F] text-xs font-semibold text-[#071317] transition"
              >
                {isReanalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#071317]" />
                    <span>Re-analyzing in ReVise...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-[#071317]" />
                    <span>Re-analyze this diff</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Unified Diff Viewer Card */}
          <div className="rounded-xl border border-[#163842] overflow-hidden bg-[#0B1B20]">
            <div className="px-5 py-3 bg-[#0B1B20] border-b border-[#163842] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E55353]/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD65]/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#02A0A0]/80"></span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#F0F6F6]">
                  <GitBranch className="w-3.5 h-3.5 text-[#02A0A0]" />
                  <span className="font-semibold">Unified Git Diff</span>
                </div>
              </div>

              <span className="text-[11px] font-mono text-[#8CA0A8]">
                {result.diff.split('\n').length} lines
              </span>
            </div>

            {/* Diff Lines Container */}
            <div className="p-4 bg-[#050E11] overflow-x-auto max-h-[500px] overflow-y-auto">
              {result.diff ? (
                renderDiffLines(result.diff)
              ) : (
                <div className="py-8 text-center text-xs text-[#5A7178]">
                  No working tree diff detected. Check the raw logs below for execution details.
                </div>
              )}
            </div>
          </div>

          {/* Injected Memory Citations Panel */}
          {result.memories && result.memories.length > 0 && (
            <div className="p-5 rounded-xl bg-[#0B1B20] border border-[#163842] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#02A0A0]" />
                  <h4 className="text-xs font-bold text-[#F0F6F6] tracking-wide uppercase font-mono">
                    Hindsight Memories Injected into Aider ({result.memories.length})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setMemoriesExpanded(!memoriesExpanded)}
                  className="text-xs text-[#8CA0A8] hover:text-[#F0F6F6] flex items-center gap-1"
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
                      className="p-3.5 rounded-lg bg-[#071317] border border-[#163842] space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[10px] text-[#8CA0A8]">
                        <span className="font-semibold uppercase font-mono tracking-wider text-[#02A0A0]">
                          {m.type.replace('_', ' ')}
                        </span>
                        <span className="font-mono">{m.service}</span>
                      </div>
                      <h5 className="text-xs font-semibold text-[#F0F6F6]">{m.title}</h5>
                      <p className="text-[11px] text-[#8CA0A8] line-clamp-3 leading-relaxed">
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
            <div className="rounded-xl border border-[#163842] overflow-hidden bg-[#0B1B20]">
              <button
                type="button"
                onClick={() => setLogExpanded(!logExpanded)}
                className="w-full px-5 py-3 bg-[#0B1B20] flex items-center justify-between hover:bg-[#0E2229] transition text-left"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-[#8CA0A8]">
                  <Terminal className="w-3.5 h-3.5 text-[#02A0A0]" />
                  <span>Aider Execution Raw Log</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[#5A7178] font-mono">
                    {result.log.split('\n').length} lines
                  </span>
                  {logExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#8CA0A8]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#8CA0A8]" />
                  )}
                </div>
              </button>

              {logExpanded && (
                <div className="p-4 bg-[#050E11] border-t border-[#163842] relative">
                  <button
                    type="button"
                    onClick={handleCopyLog}
                    className="absolute top-3 right-3 px-2.5 py-1 rounded bg-[#0B1B20] hover:bg-[#0E2229] border border-[#163842] text-[10px] text-[#F0F6F6] flex items-center gap-1 transition"
                  >
                    {copiedLog ? <Check className="w-3 h-3 text-[#02A0A0]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLog ? 'Copied' : 'Copy log'}</span>
                  </button>
                  <pre className="text-[11px] font-mono text-[#8CA0A8] overflow-x-auto leading-relaxed max-h-[400px] overflow-y-auto whitespace-pre-wrap">
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
          <div className="inline-block animate-spin w-8 h-8 border-2 border-[#02A0A0] border-t-transparent rounded-full mb-4"></div>
          <p className="text-xs font-mono text-[#8CA0A8]">Loading AI Pair Programmer...</p>
        </div>
      }
    >
      <PairProgrammerContent />
    </Suspense>
  );
}
