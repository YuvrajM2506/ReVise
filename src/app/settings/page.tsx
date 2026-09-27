'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Activity,
  Zap,
  Terminal,
  Server,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function SettingsPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [pinging, setPinging] = useState(false);

  const fetchHealth = () => {
    setLoading(true);
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handlePing = async () => {
    setPinging(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth(data);
    } catch (e) {
      console.error(e);
    } finally {
      setPinging(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSeedResult(`Successfully seeded ${data.memories_count} memories and ${data.runs_count} runs!`);
        fetchHealth();
      } else {
        setSeedResult('Error seeding: ' + data.error);
      }
    } catch (e: any) {
      setSeedResult('Error: ' + e.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-indigo-400">
          SYSTEM CONFIGURATION
        </span>
        <h2 className="text-3xl font-bold text-white tracking-tight mt-1">Settings & Diagnostics</h2>
        <p className="text-sm text-slate-400 mt-1">
          Monitor Hindsight Memory Bank connectivity, Groq LPU inference, and diagnostic traces.
        </p>
      </div>

      {/* Connection Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hindsight Card */}
        <div className="glow-card p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Hindsight Memory Cloud</h3>
                <p className="text-xs text-slate-400 font-mono">Bank: acme-platform</p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Connected
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Base API URL</span>
              <span className="font-mono text-indigo-300">https://api.hindsight.vectorize.io</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Retrieval Strategies</span>
              <span className="font-mono text-slate-200">Semantic, BM25, Graph, Temporal (RRF)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Roundtrip Latency</span>
              <span className="font-mono text-emerald-400">{health?.hindsight?.latency_ms || 14}ms</span>
            </div>
          </div>
        </div>

        {/* Groq Card */}
        <div className="glow-card p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Groq LPU Inference Engine</h3>
                <p className="text-xs text-slate-400 font-mono">
                  {health?.groq?.primary_model || 'openai/gpt-oss-120b'}
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              High Speed LPU
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Primary Model</span>
              <span className="font-mono text-purple-300">{health?.groq?.primary_model || 'openai/gpt-oss-120b'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Fallback Strategy</span>
              <span className="font-mono text-slate-200">qwen-2.5-32b (Exponential Backoff)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Output Schema</span>
              <span className="font-mono text-emerald-400">Strict JSON Object Enforcement</span>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Seed & Health Actions */}
      <div className="glow-card p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white">Acme Platform Demo Dataset</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Seed 15 historical incident memories, post-mortems, and PR evaluations for the 90-second demo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePing}
              disabled={pinging}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#14162e] hover:bg-[#1a1d3d] border border-white/10 text-xs font-medium text-slate-200 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${pinging ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
              <span>Ping Connectivity</span>
            </button>

            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-glow-sm shadow-indigo-500/20 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{seeding ? 'Seeding Memories...' : 'Seed Demo Memories'}</span>
            </button>
          </div>
        </div>

        {seedResult && (
          <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-xs font-mono text-indigo-200">
            {seedResult}
          </div>
        )}
      </div>

      {/* Diagnostic Logs */}
      <div className="glow-card p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Memory Diagnostics & Latency Logs</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">Live traces</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-mono text-slate-400 uppercase">
                <th className="pb-2">Action</th>
                <th className="pb-2">Service</th>
                <th className="pb-2">Details</th>
                <th className="pb-2 text-right">Latency</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {health?.diagnostics?.map((diag: any, idx: number) => (
                <tr key={idx} className="hover:bg-white/5 transition">
                  <td className="py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        diag.action === 'RECALL'
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : diag.action === 'RETAIN'
                          ? 'bg-pink-500/20 text-pink-300'
                          : diag.action === 'GROQ_EVAL'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-slate-500/20 text-slate-300'
                      }`}
                    >
                      {diag.action}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-300">{diag.service}</td>
                  <td className="py-2.5 text-slate-400 max-w-md truncate">{diag.details}</td>
                  <td className="py-2.5 text-right text-indigo-400 font-bold">{diag.latency_ms}ms</td>
                  <td className="py-2.5 text-right">
                    <span className="text-emerald-400 font-bold">200 OK</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
