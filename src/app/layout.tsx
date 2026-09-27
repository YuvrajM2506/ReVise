import type { Metadata } from 'next';
import './globals.css';
import AppLayout from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: 'ReVise — AI Code Review Agent with Hindsight Memory',
  description:
    'AI code review agent that gets measurably smarter over time by remembering past PRs, pipeline failures, incidents, and post-mortems via Hindsight.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-[#080911] text-slate-100 min-h-screen antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
