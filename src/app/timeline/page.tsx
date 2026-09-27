'use client';

import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Search,
  Filter,
  Shield,
  ArrowRight,
  FileCode,
  X,
  Layers,
  Activity,
} from 'lucide-react';
import { CausalTimelineNode, ActiveGuardrail } from '@/lib/types';

export default function TimelinePage() {
  const [timeline, setTimeline] = useState<CausalTimelineNode[]>([]);
  const [guardrails, setGuardrails] = useState<ActiveGuardrail[]>([]);
  const [selectedService, setSelectedService] = useState('orders-service');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRange, setSelectedRange] = useState('Last 90 days');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePolicyModal, setActivePolicyModal] = useState<ActiveGuardrail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTimeline = () => {
    const params = new URLSearchParams();
    if (selectedService) params.set('service', selectedService);
    if (selectedType !== 'all') params.set('eventType', selectedType);
    if (searchQuery) params.set('search', searchQuery);

    fetch(`/api/timeline?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.timeline) setTimeline(data.timeline);
        if (data.guardrails) setGuardrails(data.guardrails);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTimeline();
  }, [selectedService, selectedType, searchQuery]);

  const activeGuardrail = guardrails.find(g => g.service === selectedService) || guardrails[0];

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'CODE REVIEW':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
            CODE REVIEW
          </span>
        );
      case 'PIPELINE FAILURE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-red-500/20 text-red-400 border border-red-500/30">
            PIPELINE FAILURE
          </span>
        );
      case 'SEV-2 INCIDENT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-pink-500/20 text-pink-400 border border-pink-500/30">
            SEV-2 INCIDENT
          </span>
        );
      case 'PROVEN RESOLUTION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            PROVEN RESOLUTION
          </span>
        );
      case 'PREVENTED RISK':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            PREVENTED RISK
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-slate-500/20 text-slate-300">
            {type}
          </span>
        );
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'CODE REVIEW':
        return 'bg-purple-500 ring-purple-500/30';
      case 'PIPELINE FAILURE':
        return 'bg-red-500 ring-red-500/30';
      case 'SEV-2 INCIDENT':
        return 'bg-pink-500 ring-pink-500/30';
      case 'PROVEN RESOLUTION':
        return 'bg-emerald-500 ring-emerald-500/30';
      case 'PREVENTED RISK':
        return 'bg-cyan-400 ring-cyan-400/30';
      default:
        return 'bg-indigo-500 ring-indigo-500/30';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-indigo-400">
          CAUSAL GRAPH
        </span>
        <h2 className="text-3xl font-bold text-white tracking-tight mt-1">Memory timeline</h2>
        <p className="text-sm text-slate-400 mt-1">
          A causal record of how team decisions became production knowledge.
        </p>
      </div>

      {/* Filters Row matching Screenshot 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 glow-card p-4 rounded-xl border border-white/10">
        {/* Service */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
            SERVICE
          </label>
          <select
            value={selectedService}
            onChange={e => setSelectedService(e.target.value)}
            className="w-full px-3 py-2 bg-[#090a16] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="orders-service">orders-service</option>
            <option value="checkout-api">checkout-api</option>
            <option value="payments-service">payments-service</option>
            <option value="inventory-service">inventory-service</option>
            <option value="auth-service">auth-service</option>
            <option value="all">All services</option>
          </select>
        </div>

        {/* Event Type */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
            EVENT TYPE
          </label>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 bg-[#090a16] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All events</option>
            <option value="CODE REVIEW">Code Review</option>
            <option value="PIPELINE FAILURE">Pipeline Failure</option>
            <option value="INCIDENT">Incident</option>
            <option value="PROVEN RESOLUTION">Proven Resolution</option>
            <option value="PREVENTED RISK">Prevented Risk</option>
          </select>
        </div>

        {/* Date Range */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
            DATE RANGE
          </label>
          <select
            value={selectedRange}
            onChange={e => setSelectedRange(e.target.value)}
            className="w-full px-3 py-2 bg-[#090a16] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="Last 90 days">Last 90 days</option>
            <option value="Last 30 days">Last 30 days</option>
            <option value="All time">All time</option>
          </select>
        </div>

        {/* Search */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
            SEARCH
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search team memory..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-[#090a16] border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Main 2-Column Causal Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Vertical Connected Causal Graph */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section Sub-header with Active Causal Pattern Badge */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white capitalize">
              {selectedService}: migration risk pattern
            </h3>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
              ACTIVE CAUSAL PATTERN
            </span>
          </div>

          {/* Timeline Nodes Chain */}
          <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-purple-500 before:via-pink-500 before:to-cyan-400">
            {timeline.map(node => (
              <div key={node.id} className="relative group">
                {/* Node Dot */}
                <div
                  className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full ring-4 ${getNodeColor(
                    node.type
                  )}`}
                ></div>

                {/* Node Content Card */}
                <div className="glow-card p-4 rounded-xl space-y-1.5 group-hover:border-white/20 transition">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-400 text-[11px]">{node.date}</span>
                    <div>{getTypeBadge(node.type)}</div>
                  </div>

                  <h4 className="text-sm font-semibold text-white tracking-tight">{node.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{node.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (1 Col): Active Guardrail Card matching Screenshot 4 */}
        <div className="space-y-4">
          <div className="glow-card p-6 rounded-2xl border border-white/10 space-y-5 sticky top-24">
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase font-semibold text-slate-400">
                ACTIVE GUARDRAIL
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight mt-1">Pattern detected</h3>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-indigo-400 font-mono">
                {activeGuardrail?.related_events_count || 3}
              </span>
              <span className="text-xs text-slate-400">Related events detected</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {activeGuardrail?.description ||
                'Schema changes on high-traffic tables repeatedly caused lock-duration risk. Hindsight protects future deployments against this specific signature.'}
            </p>

            <button
              type="button"
              onClick={() => setActivePolicyModal(activeGuardrail)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-xs font-semibold text-indigo-200 transition shadow-glow-sm shadow-indigo-500/10"
            >
              <span>View prevention policy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Prevention Policy Modal */}
      {activePolicyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glow-card max-w-xl w-full p-6 rounded-2xl border border-white/20 space-y-5 relative">
            <button
              onClick={() => setActivePolicyModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase font-semibold text-indigo-400">
                COMPILED REVISE POLICY
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                {activePolicyModal.policy_title}
              </h3>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-300">Mandatory Rules:</h4>
              <ul className="space-y-1.5 text-xs text-slate-400">
                {activePolicyModal.policy_rules.map((rule, idx) => (
                  <li key={idx} className="p-2 rounded bg-white/5 border border-white/5 font-mono">
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-300">Recommended DDL Fix Snippet:</h4>
              <pre className="p-3 rounded-lg bg-[#070811] text-[11px] font-mono text-indigo-200 overflow-x-auto border border-white/5">
                <code>{activePolicyModal.example_fix_snippet}</code>
              </pre>
            </div>

            <button
              onClick={() => setActivePolicyModal(null)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
            >
              Close Policy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
