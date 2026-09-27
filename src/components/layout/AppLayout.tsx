'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  if (isLandingPage) {
    return (
      <div className="min-h-screen w-full bg-[#080911] text-slate-100 overflow-x-hidden">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#080911] text-slate-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header />
        <main className="flex-1 pb-16">{children}</main>
      </div>
    </div>
  );
}
