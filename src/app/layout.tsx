import type { Metadata } from 'next';
import { Inter, Montserrat, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import AppLayout from '@/components/layout/AppLayout';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-mont',
  weight: ['600', '700', '800'],
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

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
    <html
      lang="en"
      className={`dark scroll-smooth ${inter.variable} ${montserrat.variable} ${jetbrains.variable}`}
    >
      <body className="bg-[#071317] text-[#F2F5F4] min-h-screen antialiased selection:bg-[#02A0A0]/25 selection:text-[#F2F5F4]">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
