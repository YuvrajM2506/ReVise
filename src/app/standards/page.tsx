'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Search,
  Filter,
  Layers,
  Database,
  Key,
  Package,
  Code2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { TeamStandard } from '@/lib/types';

export default function StandardsPage() {
  const [standards, setStandards] = useState<TeamStandard[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/standards')
      .then(res => res.json())
      .then(data => {
        if (data.standards) setStandards(data.standards);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = ['All', 'Database', 'Secrets', 'Dependencies', 'API Design'];

  const filtered = standards.filter(std => {
    const matchesCat = selectedCategory === 'All' || std.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      std.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      std.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      std.service.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Database':
        return <Database className="w-4 h-4 text-[#02A0A0]" />;
      case 'Secrets':
        return <Key className="w-4 h-4 text-[#FFBD65]" />;
      case 'Dependencies':
        return <Package className="w-4 h-4 text-[#02A0A0]" />;
      default:
        return <Code2 className="w-4 h-4 text-[#02A0A0]" />;
    }
  };

  const getEnforcementBadge = (level: string) => {
    if (level.includes('Blocker')) {
      return (
        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-[#E55353]/15 text-[#E55353] border border-[#E55353]/30">
          {level}
        </span>
      );
    }
    if (level.includes('Mandatory')) {
      return (
        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-[#FFBD65]/15 text-[#FFBD65] border border-[#FFBD65]/30">
          {level}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-[#02A0A0]/15 text-[#02A0A0] border border-[#02A0A0]/30">
        {level}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase font-semibold text-[#02A0A0]">
            LIVING REVISE POLICY
          </span>
          <h2 className="text-3xl font-bold text-[#F0F6F6] tracking-tight mt-1">Team Standards</h2>
          <p className="text-xs text-[#8CA0A8] mt-1 max-w-2xl">
            Autonomous engineering standards continuously inferred and refined from past PRs, outages, and post-mortems.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/analyze?scenario=scenario-unsafe-db"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#02A0A0] hover:bg-[#028F8F] text-xs font-semibold text-[#071317] transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Test Compliance in Review</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0B1B20] border border-[#163842]">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedCategory === cat
                  ? 'bg-[#0E2229] text-[#02A0A0] border border-[#02A0A0] font-semibold shadow-[0_0_10px_rgba(2,160,160,0.12)]'
                  : 'bg-[#071317] text-[#8CA0A8] hover:text-[#F0F6F6] border border-[#163842]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-[#5A7178] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search standards or incidents..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#071317] border border-[#163842] rounded-lg text-xs text-[#F0F6F6] placeholder-[#5A7178] focus:outline-none focus:border-[#02A0A0]"
          />
        </div>
      </div>

      {/* Standards List */}
      <div className="space-y-4">
        {filtered.map(standard => (
          <div
            key={standard.id}
            className="p-6 rounded-xl bg-[#0B1B20] border border-[#163842] space-y-4 hover:border-[#02A0A0]/40 transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#071317] flex items-center justify-center border border-[#163842]">
                  {getCategoryIcon(standard.category)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F0F6F6] tracking-tight">{standard.title}</h3>
                  <p className="text-xs text-[#8CA0A8] flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[#02A0A0]">{standard.service}</span>
                    <span className="text-[#5A7178]">•</span>
                    <span>Updated {standard.updated_at}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {getEnforcementBadge(standard.enforcement_level)}
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-[#02A0A0]">
                    {standard.confidence_score}%
                  </span>
                  <p className="text-[9px] text-[#5A7178] uppercase font-mono">Confidence</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#8CA0A8] leading-relaxed">{standard.description}</p>

            {/* Rule Snippet */}
            {standard.rule_snippet && (
              <pre className="p-3 rounded-lg bg-[#050E11] text-[11px] font-mono text-[#9FD5D5] overflow-x-auto border border-[#163842]">
                <code>{standard.rule_snippet}</code>
              </pre>
            )}

            {/* Inferred Source Citations */}
            <div className="pt-3 border-t border-[#163842] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#8CA0A8]">
                <span className="text-[10px] font-mono uppercase font-semibold text-[#5A7178]">
                  Inferred from incidents:
                </span>
                {standard.inferred_from.source_ids.map(src => (
                  <span
                    key={src}
                    className="px-2 py-0.5 rounded bg-[#071317] border border-[#02A0A0]/30 text-[#02A0A0] text-[10px] font-mono"
                  >
                    {src}
                  </span>
                ))}
              </div>

              <Link
                href={`/timeline?service=${standard.service}`}
                className="text-xs text-[#02A0A0] hover:text-[#5EEAD4] flex items-center gap-1 font-medium font-mono"
              >
                <span>View causal timeline</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
