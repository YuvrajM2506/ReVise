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
    if (pathname.startsWith('/report')) return 'Risk Report';
    if (pathname.startsWith('/timeline')) return 'Memory Timeline';
    if (pathname.startsWith('/teach')) return 'Teach ReVise';
    if (pathname.startsWith('/standards')) return 'Team Standards';
    if (pathname.startsWith('/settings')) return 'Settings';
    return 'ReVise';
  };

  return (
    <header className="h-16 px-8 border-b border-white/10 bg-[#080911]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
      {/* Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-white tracking-tight">{getTitle()}</h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Search Icon */}
        <button
          title="Search memories and runs"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <button
          title="Notifications"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition relative"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full absolute top-2 right-2"></span>
        </button>

        {/* Persistent Hindsight Memory Active Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#12142e] border border-indigo-500/30 text-indigo-300 text-xs font-medium shadow-sm shadow-indigo-500/10">
          <Database className="w-3.5 h-3.5 text-indigo-400" />
          <span>Hindsight Memory Active</span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
        </div>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-500 text-white font-semibold text-xs flex items-center justify-center border border-white/20 shadow-sm cursor-pointer">
          KM
        </div>
      </div>
    </header>
  );
}
