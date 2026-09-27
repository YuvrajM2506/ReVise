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
        return <Database className="w-4 h-4 text-indigo-400" />;
      case 'Secrets':
        return <Key className="w-4 h-4 text-pink-400" />;
      case 'Dependencies':
        return <Package className="w-4 h-4 text-sky-400" />;
      default:
        return <Code2 className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getEnforcementBadge = (level: string) => {
    if (level.includes('Blocker')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-pink-500/20 text-pink-400 border border-pink-500/30">
          {level}
        </span>
      );
    }
    if (level.includes('Mandatory')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          {level}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-slate-500/20 text-slate-300 border border-slate-500/30">
        {level}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-indigo-400">
            LIVING REVISE POLICY
          </span>
          <h2 className="text-3xl font-bold text-white tracking-tight mt-1">Team Standards</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Autonomous engineering standards continuously inferred and refined from past PRs, outages, and post-mortems.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/analyze?scenario=scenario-unsafe-db"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-glow-sm shadow-indigo-500/20 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Test Compliance in Review</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glow-card p-4 rounded-xl border border-white/10">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#090a16] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search standards or incidents..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#090a16] border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Standards List */}
      <div className="space-y-4">
        {filtered.map(standard => (
          <div
            key={standard.id}
            className="glow-card p-6 rounded-2xl border border-white/10 space-y-4 hover:border-indigo-500/30 transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#14162e] flex items-center justify-center border border-white/10">
                  {getCategoryIcon(standard.category)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">{standard.title}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-indigo-300">{standard.service}</span>
                    <span>•</span>
                    <span>Updated {standard.updated_at}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {getEnforcementBadge(standard.enforcement_level)}
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {standard.confidence_score}%
                  </span>
                  <p className="text-[9px] text-slate-500 uppercase font-mono">Confidence</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{standard.description}</p>

            {/* Rule Snippet */}
            {standard.rule_snippet && (
              <pre className="p-3 rounded-lg bg-[#070811] text-[11px] font-mono text-indigo-200 overflow-x-auto border border-white/5">
                <code>{standard.rule_snippet}</code>
              </pre>
            )}

            {/* Inferred Source Citations */}
            <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-[10px] font-mono uppercase font-semibold text-slate-500">
                  Inferred from incidents:
                </span>
                {standard.inferred_from.source_ids.map(src => (
                  <span
                    key={src}
                    className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-[10px] font-mono"
                  >
                    {src}
                  </span>
                ))}
              </div>

              <Link
                href={`/timeline?service=${standard.service}`}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
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
