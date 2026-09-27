import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'ReVise — AI Code Review Agent with Hindsight Memory',
  description: 'AI code review agent that gets measurably smarter over time by remembering past PRs, pipeline failures, incidents, and post-mortems via Hindsight.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#080911] text-slate-100 min-h-screen flex antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
          <Header />
          <main className="flex-1 pb-16">{children}</main>
        </div>
      </body>
    </html>
  );
}
