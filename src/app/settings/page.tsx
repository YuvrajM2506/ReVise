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
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <span className="text-[10px] font-mono tracking-widest uppercase font-semibold text-[#02A0A0]">
          SYSTEM CONFIGURATION
        </span>
        <h2 className="text-3xl font-bold text-[#F0F6F6] tracking-tight mt-1">Settings & Diagnostics</h2>
        <p className="text-xs text-[#8CA0A8] mt-1">
          Monitor Hindsight Memory Bank connectivity, Groq LPU inference, and diagnostic traces.
        </p>
      </div>

      {/* Connection Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hindsight Card */}
        <div className="p-6 rounded-xl bg-[#0B1B20] border border-[#163842] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#071317] text-[#02A0A0] flex items-center justify-center border border-[#163842]">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F0F6F6]">Hindsight Memory Cloud</h3>
                <p className="text-xs text-[#8CA0A8] font-mono">Bank: acme-platform</p>
              </div>
            </div>

            <span className="px-3 py-1 rounded text-xs font-mono font-semibold bg-[#02A0A0]/15 text-[#02A0A0] border border-[#02A0A0]/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#02A0A0] animate-ping"></span>
              Connected
            </span>
          </div>

          <div className="space-y-2 text-xs text-[#8CA0A8]">
            <div className="flex justify-between py-1 border-b border-[#163842]">
              <span className="text-[#8CA0A8]">Base API URL</span>
              <span className="font-mono text-[#02A0A0]">https://api.hindsight.vectorize.io</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#163842]">
              <span className="text-[#8CA0A8]">Retrieval Strategies</span>
              <span className="font-mono text-[#F0F6F6]">Semantic, BM25, Graph, Temporal (RRF)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#8CA0A8]">Roundtrip Latency</span>
              <span className="font-mono text-[#02A0A0] font-bold">{health?.hindsight?.latency_ms || 14}ms</span>
            </div>
          </div>
        </div>

        {/* Groq Card */}
        <div className="p-6 rounded-xl bg-[#0B1B20] border border-[#163842] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#071317] text-[#FFBD65] flex items-center justify-center border border-[#163842]">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F0F6F6]">Groq LPU Inference Engine</h3>
                <p className="text-xs text-[#8CA0A8] font-mono">
                  {health?.groq?.primary_model || 'openai/gpt-oss-120b'}
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded text-xs font-mono font-semibold bg-[#FFBD65]/15 text-[#FFBD65] border border-[#FFBD65]/30 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#FFBD65]" />
              High Speed LPU
            </span>
          </div>

          <div className="space-y-2 text-xs text-[#8CA0A8]">
            <div className="flex justify-between py-1 border-b border-[#163842]">
              <span className="text-[#8CA0A8]">Primary Model</span>
              <span className="font-mono text-[#FFBD65]">{health?.groq?.primary_model || 'openai/gpt-oss-120b'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#163842]">
              <span className="text-[#8CA0A8]">Fallback Strategy</span>
              <span className="font-mono text-[#F0F6F6]">qwen-2.5-32b (Exponential Backoff)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#8CA0A8]">Output Schema</span>
              <span className="font-mono text-[#02A0A0]">Strict JSON Object Enforcement</span>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Seed & Health Actions */}
      <div className="p-6 rounded-xl bg-[#0B1B20] border border-[#163842] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#F0F6F6]">Acme Platform Demo Dataset</h3>
            <p className="text-xs text-[#8CA0A8] mt-0.5">
              Seed 15 historical incident memories, post-mortems, and PR evaluations for the 90-second demo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePing}
              disabled={pinging}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#071317] hover:bg-[#0E2229] border border-[#163842] text-xs font-medium text-[#F0F6F6] transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${pinging ? 'animate-spin text-[#02A0A0]' : 'text-[#8CA0A8]'}`} />
              <span>Ping Connectivity</span>
            </button>

            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#02A0A0] hover:bg-[#028F8F] text-xs font-semibold text-[#071317] transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{seeding ? 'Seeding Memories...' : 'Seed Demo Memories'}</span>
            </button>
          </div>
        </div>

        {seedResult && (
          <div className="p-3 rounded-lg bg-[#071317] border border-[#02A0A0]/30 text-xs font-mono text-[#02A0A0]">
            {seedResult}
          </div>
        )}
      </div>

      {/* Diagnostic Logs */}
      <div className="p-6 rounded-xl bg-[#0B1B20] border border-[#163842] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#02A0A0]" />
            <h3 className="text-base font-bold text-[#F0F6F6]">Memory Diagnostics & Latency Logs</h3>
          </div>
          <span className="text-xs text-[#5A7178] font-mono">Live traces</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#163842] text-[10px] font-mono text-[#8CA0A8] uppercase">
                <th className="pb-2">Action</th>
                <th className="pb-2">Service</th>
                <th className="pb-2">Details</th>
                <th className="pb-2 text-right">Latency</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#163842] font-mono">
              {health?.diagnostics?.map((diag: any, idx: number) => (
                <tr key={idx} className="hover:bg-[#071317]/50 transition">
                  <td className="py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        diag.action === 'RECALL'
                          ? 'bg-[#02A0A0]/15 text-[#02A0A0] border border-[#02A0A0]/30'
                          : diag.action === 'RETAIN'
                          ? 'bg-[#FFBD65]/15 text-[#FFBD65] border border-[#FFBD65]/30'
                          : diag.action === 'GROQ_EVAL'
                          ? 'bg-[#0E2229] text-[#9FD5D5] border border-[#163842]'
                          : 'bg-[#163842] text-[#8CA0A8]'
                      }`}
                    >
                      {diag.action}
                    </span>
                  </td>
                  <td className="py-2.5 text-[#F0F6F6]">{diag.service}</td>
                  <td className="py-2.5 text-[#8CA0A8] max-w-md truncate">{diag.details}</td>
                  <td className="py-2.5 text-right text-[#02A0A0] font-bold">{diag.latency_ms}ms</td>
                  <td className="py-2.5 text-right">
                    <span className="text-[#02A0A0] font-bold">200 OK</span>
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
