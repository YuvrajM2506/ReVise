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
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-[#02A0A0]/15 text-[#02A0A0] border border-[#02A0A0]/30">
            CODE REVIEW
          </span>
        );
      case 'PIPELINE FAILURE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-[#FFBD65]/15 text-[#FFBD65] border border-[#FFBD65]/30">
            PIPELINE FAILURE
          </span>
        );
      case 'SEV-2 INCIDENT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-[#E55353]/15 text-[#E55353] border border-[#E55353]/30">
            SEV-2 INCIDENT
          </span>
        );
      case 'PROVEN RESOLUTION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-[#02A0A0]/15 text-[#02A0A0] border border-[#02A0A0]/30">
            PROVEN RESOLUTION
          </span>
        );
      case 'PREVENTED RISK':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-[#02A0A0]/15 text-[#02A0A0] border border-[#02A0A0]/30">
            PREVENTED RISK
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-[#163842] text-[#8CA0A8]">
            {type}
          </span>
        );
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'CODE REVIEW':
        return 'bg-[#02A0A0] ring-[#02A0A0]/20';
      case 'PIPELINE FAILURE':
        return 'bg-[#FFBD65] ring-[#FFBD65]/20';
      case 'SEV-2 INCIDENT':
        return 'bg-[#E55353] ring-[#E55353]/20';
      case 'PROVEN RESOLUTION':
        return 'bg-[#02A0A0] ring-[#02A0A0]/20';
      case 'PREVENTED RISK':
        return 'bg-[#02A0A0] ring-[#02A0A0]/20';
      default:
        return 'bg-[#02A0A0] ring-[#02A0A0]/20';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <span className="text-[10px] font-mono tracking-widest uppercase font-semibold text-[#02A0A0]">
          CAUSAL GRAPH
        </span>
        <h2 className="text-3xl font-bold text-[#F0F6F6] tracking-tight mt-1">Memory timeline</h2>
        <p className="text-xs text-[#8CA0A8] mt-1">
          A causal record of how team decisions became production knowledge.
        </p>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-[#0B1B20] border border-[#163842]">
        {/* Service */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8CA0A8]">
            SERVICE
          </label>
          <select
            value={selectedService}
            onChange={e => setSelectedService(e.target.value)}
            className="w-full px-3 py-2 bg-[#071317] border border-[#163842] rounded-lg text-xs text-[#F0F6F6] focus:outline-none focus:border-[#02A0A0]"
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
          <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8CA0A8]">
            EVENT TYPE
          </label>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 bg-[#071317] border border-[#163842] rounded-lg text-xs text-[#F0F6F6] focus:outline-none focus:border-[#02A0A0]"
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
          <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8CA0A8]">
            DATE RANGE
          </label>
          <select
            value={selectedRange}
            onChange={e => setSelectedRange(e.target.value)}
            className="w-full px-3 py-2 bg-[#071317] border border-[#163842] rounded-lg text-xs text-[#F0F6F6] focus:outline-none focus:border-[#02A0A0]"
          >
            <option value="Last 90 days">Last 90 days</option>
            <option value="Last 30 days">Last 30 days</option>
            <option value="All time">All time</option>
          </select>
        </div>

        {/* Search */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8CA0A8]">
            SEARCH
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#5A7178] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search team memory..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-[#071317] border border-[#163842] rounded-lg text-xs text-[#F0F6F6] placeholder-[#5A7178] focus:outline-none focus:border-[#02A0A0]"
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
            <h3 className="text-base font-bold text-[#F0F6F6] capitalize">
              {selectedService}: migration risk pattern
            </h3>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono font-semibold bg-[#02A0A0]/15 text-[#02A0A0] border border-[#02A0A0]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#02A0A0] animate-pulse"></span>
              ACTIVE CAUSAL PATTERN
            </span>
          </div>

          {/* Timeline Nodes Chain */}
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-[1px] before:bg-gradient-to-b before:from-[#02A0A0] before:via-[#FFBD65] before:to-[#02A0A0]/30">
            {timeline.map(node => (
              <div key={node.id} className="relative group">
                {/* Node Dot */}
                <div
                  className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full ring-4 ${getNodeColor(
                    node.type
                  )}`}
                ></div>

                {/* Node Content Card */}
                <div className="p-4 rounded-xl bg-[#0B1B20] border border-[#163842] space-y-1.5 group-hover:border-[#02A0A0]/40 transition">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[#8CA0A8] text-[11px]">{node.date}</span>
                    <div>{getTypeBadge(node.type)}</div>
                  </div>

                  <h4 className="text-sm font-semibold text-[#F0F6F6] tracking-tight">{node.title}</h4>
                  <p className="text-xs text-[#8CA0A8] leading-relaxed">{node.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (1 Col): Active Guardrail Card */}
        <div className="space-y-4">
          <div className="p-6 rounded-xl bg-[#0B1B20] border border-[#163842] space-y-5 sticky top-24">
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase font-semibold text-[#8CA0A8]">
                ACTIVE GUARDRAIL
              </span>
              <h3 className="text-lg font-bold text-[#F0F6F6] tracking-tight mt-1">Pattern detected</h3>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-[#02A0A0] font-mono">
                {activeGuardrail?.related_events_count || 3}
              </span>
              <span className="text-xs text-[#8CA0A8]">Related events detected</span>
            </div>

            <p className="text-xs text-[#8CA0A8] leading-relaxed">
              {activeGuardrail?.description ||
                'Schema changes on high-traffic tables repeatedly caused lock-duration risk. Hindsight protects future deployments against this specific signature.'}
            </p>

            <button
              type="button"
              onClick={() => setActivePolicyModal(activeGuardrail)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#071317] hover:bg-[#0E2229] border border-[#02A0A0]/40 text-xs font-semibold text-[#02A0A0] transition"
            >
              <span>View prevention policy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Prevention Policy Modal */}
      {activePolicyModal && (
        <div className="fixed inset-0 bg-[#071317]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="max-w-xl w-full p-6 rounded-xl bg-[#0B1B20] border border-[#163842] space-y-5 relative">
            <button
              onClick={() => setActivePolicyModal(null)}
              className="absolute top-4 right-4 text-[#8CA0A8] hover:text-[#F0F6F6]"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase font-semibold text-[#02A0A0]">
                COMPILED REVISE POLICY
              </span>
              <h3 className="text-lg font-bold text-[#F0F6F6] mt-1">
                {activePolicyModal.policy_title}
              </h3>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#8CA0A8]">Mandatory Rules:</h4>
              <ul className="space-y-1.5 text-xs text-[#8CA0A8]">
                {activePolicyModal.policy_rules.map((rule, idx) => (
                  <li key={idx} className="p-2.5 rounded bg-[#071317] border border-[#163842] font-mono text-[#F0F6F6]">
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#8CA0A8]">Recommended DDL Fix Snippet:</h4>
              <pre className="p-3 rounded-lg bg-[#050E11] text-[11px] font-mono text-[#9FD5D5] overflow-x-auto border border-[#163842]">
                <code>{activePolicyModal.example_fix_snippet}</code>
              </pre>
            </div>

            <button
              onClick={() => setActivePolicyModal(null)}
              className="w-full py-2 bg-[#02A0A0] hover:bg-[#028F8F] text-[#071317] text-xs font-semibold rounded-lg transition"
            >
              Close Policy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
