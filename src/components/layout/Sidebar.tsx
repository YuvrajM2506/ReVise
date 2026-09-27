'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GitPullRequest,
  GitBranch,
  Sparkles,
  ShieldCheck,
  Settings,
  ChevronDown,
  Layers,
  Bot,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/analyze', label: 'Analyze Change', icon: GitPullRequest },
  { href: '/pair-programmer', label: 'Pair Programmer', icon: Bot },
  { href: '/timeline', label: 'Memory Timeline', icon: GitBranch },
  { href: '/teach', label: 'Teach ReVise', icon: Sparkles },
  { href: '/standards', label: 'Team Standards', icon: ShieldCheck },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [hindsightConnected, setHindsightConnected] = useState(true);

  useEffect(() => {
    // Check connection health on mount
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setHindsightConnected(data?.hindsight?.connected ?? true);
      })
      .catch(() => setHindsightConnected(true));
  }, []);

  return (
    <aside className="w-64 bg-[#090a16] border-r border-white/10 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div>
        <Link href="/" className="p-5 flex items-center gap-3 border-b border-white/5 hover:bg-white/[0.02] transition block">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow-sm shadow-indigo-500/30 shrink-0">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-base tracking-tight">ReVise</span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">AI</span>
              </div>
              <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">ENGINEERING MEMORY</p>
            </div>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-white border-l-2 border-indigo-500 shadow-sm shadow-indigo-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Bottom: Workspace & Connection Status */}
      <div className="p-3 border-t border-white/5 space-y-2">
        {/* Workspace Switcher */}
        <div className="p-2.5 rounded-lg bg-[#0d0e21] border border-white/5 flex items-center justify-between hover:border-white/10 transition cursor-pointer">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-md bg-indigo-900/60 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-500/30">
              AP
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">Acme Platform</p>
              <p className="text-[10px] text-slate-400 truncate">Engineering Workspace</p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </div>

        {/* Live Hindsight Connection Status */}
        <div className="px-2 py-1.5 flex items-center gap-2 text-[11px] font-medium text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hindsightConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${hindsightConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <span className="text-slate-300">
            {hindsightConnected ? 'Hindsight connected' : 'Connecting memory...'}
          </span>
        </div>
      </div>
    </aside>
  );
}
