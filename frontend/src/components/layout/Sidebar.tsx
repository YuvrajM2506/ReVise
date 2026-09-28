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
    <aside className="w-64 bg-[#0B1B20] border-r border-[#163842]/50 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div>
        <Link href="/" className="p-5 flex items-center gap-3 border-b border-[#163842]/40 hover:bg-white/[0.02] transition block">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#02A0A0]/15 border border-[#02A0A0]/30 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-[#02A0A0]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#F0F6F6] text-base tracking-tight">ReVise</span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#02A0A0]/15 text-[#02A0A0] border border-[#02A0A0]/30 font-mono">AI</span>
              </div>
              <p className="text-[10px] font-mono tracking-wider text-[#8CA0A8] uppercase">ENGINEERING MEMORY</p>
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
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#02A0A0]/10 text-[#F0F6F6] border-l-2 border-[#02A0A0] font-semibold'
                    : 'text-[#8CA0A8] hover:text-[#F0F6F6] hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#02A0A0]' : 'text-[#8CA0A8]'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Bottom: Workspace & Connection Status */}
      <div className="p-3 border-t border-[#163842]/40 space-y-2">
        {/* Workspace Switcher */}
        <div className="p-2.5 rounded-lg bg-[#071317] border border-[#163842]/50 flex items-center justify-between hover:border-[#02A0A0]/30 transition cursor-pointer">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-md bg-[#02A0A0]/15 text-[#02A0A0] font-bold text-xs flex items-center justify-center shrink-0 border border-[#02A0A0]/30">
              AP
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#F0F6F6] truncate">Acme Platform</p>
              <p className="text-[10px] text-[#8CA0A8] truncate">Engineering Workspace</p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-[#8CA0A8] shrink-0" />
        </div>

        {/* Live Hindsight Connection Status */}
        <div className="px-2 py-1.5 flex items-center gap-2 text-[11px] font-medium text-[#8CA0A8]">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hindsightConnected ? 'bg-[#02A0A0]' : 'bg-[#FFBD65]'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${hindsightConnected ? 'bg-[#02A0A0]' : 'bg-[#FFBD65]'}`}></span>
          </span>
          <span className="text-[#8CA0A8] font-mono text-[10px]">
            {hindsightConnected ? 'Hindsight memory active' : 'Connecting memory...'}
          </span>
        </div>
      </div>
    </aside>
  );
}
