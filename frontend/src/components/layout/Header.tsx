'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Search, Bell, Database } from 'lucide-react';

interface HeaderProps {
  customTitle?: string;
}

export default function Header({ customTitle }: HeaderProps) {
  const pathname = usePathname();

  const getTitle = () => {
    if (customTitle) return customTitle;
    if (pathname === '/') return 'Overview';
    if (pathname.startsWith('/analyze')) return 'Analyze Change';
    if (pathname.startsWith('/pair-programmer')) return 'AI Pair Programmer';
    if (pathname.startsWith('/report')) return 'Risk Report';
    if (pathname.startsWith('/timeline')) return 'Memory Timeline';
    if (pathname.startsWith('/teach')) return 'Teach ReVise';
    if (pathname.startsWith('/standards')) return 'Team Standards';
    if (pathname.startsWith('/settings')) return 'Settings';
    return 'ReVise';
  };

  return (
    <header className="h-16 px-8 border-b border-[#163842]/50 bg-[#071317]/85 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
      {/* Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-[#F0F6F6] tracking-tight">{getTitle()}</h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Search Icon */}
        <button
          title="Search memories and runs"
          className="p-2 rounded-lg text-[#8CA0A8] hover:text-[#F0F6F6] hover:bg-white/[0.04] transition"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <button
          title="Notifications"
          className="p-2 rounded-lg text-[#8CA0A8] hover:text-[#F0F6F6] hover:bg-white/[0.04] transition relative"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 bg-[#FFBD65] rounded-full absolute top-2 right-2"></span>
        </button>

        {/* Persistent Hindsight Memory Active Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0B1B20] border border-[#02A0A0]/30 text-[#02A0A0] text-xs font-mono font-medium">
          <Database className="w-3.5 h-3.5 text-[#02A0A0]" />
          <span>Hindsight Memory Active</span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#02A0A0] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#02A0A0]"></span>
          </span>
        </div>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#0E2229] text-[#02A0A0] font-semibold text-xs flex items-center justify-center border border-[#163842] shadow-sm cursor-pointer hover:border-[#02A0A0]/40 transition">
          KM
        </div>
      </div>
    </header>
  );
}
