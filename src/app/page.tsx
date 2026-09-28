'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  BarChart2,
  LineChart,
  Settings,
  HelpCircle,
  Search,
  Bell,
  LogOut,
  Sparkles,
  ArrowUp,
} from 'lucide-react';

const COLORS = {
  bg: '#071317',
  surface: '#0E2229',
  surface2: '#112830',
  border: '#163842',
  text: '#F2F5F4',
  muted: '#8CA0A8',
  teal: '#02A0A0',
  orange: '#FFBD65',
};

// Animated network background
function NetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 1.5 + 0.5;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) {
          this.vx *= -1;
        }

        if (this.y < 0 || this.y > canvas.height) {
          this.vy *= -1;
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.teal;
        ctx.fill();
      }
    }

    const resizeCanvas = () => {
      const parent = canvas.parentElement;

      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }

      particles = [];

      const count = Math.min(
        80,
        Math.max(20, Math.floor((canvas.width * canvas.height) / 8000))
      );

      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => particle.update());

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(2, 160, 160, ${
              1 - distance / 100
            })`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach((particle) => particle.draw());

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full opacity-60 pointer-events-none"
    />
  );
}

// Memory graph
function MemoryGraphSnippet() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <g
        stroke={COLORS.teal}
        strokeWidth="1.5"
        opacity="0.6"
      >
        <line x1="40" y1="100" x2="90" y2="100" />
        <line x1="90" y1="100" x2="140" y2="40" />
        <line x1="90" y1="100" x2="150" y2="80" />
        <line x1="90" y1="100" x2="150" y2="120" />
        <line x1="90" y1="100" x2="140" y2="160" />
        <line x1="140" y1="40" x2="170" y2="40" />
        <line x1="150" y1="120" x2="170" y2="130" />
      </g>

      <circle cx="40" cy="100" r="5" fill={COLORS.orange} />
      <circle cx="90" cy="100" r="6" fill={COLORS.teal} />
      <circle cx="140" cy="40" r="4" fill={COLORS.teal} />
      <circle cx="170" cy="40" r="4" fill={COLORS.orange} />
      <circle cx="150" cy="80" r="4" fill={COLORS.teal} />
      <circle cx="150" cy="120" r="4" fill={COLORS.teal} />
      <circle cx="140" cy="160" r="4" fill={COLORS.teal} />
      <circle cx="170" cy="130" r="4" fill={COLORS.teal} />
    </svg>
  );
}

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'overview',
    label: 'Overview',
    icon: BarChart2,
  },
  {
    id: 'memory',
    label: 'Memory',
    icon: LineChart,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
  },
  {
    id: 'help',
    label: 'Help',
    icon: HelpCircle,
  },
];

const pillTags = [
  'JetBrains Mono',
  'Memory Extraction',
  'JetBrains Regulation',
  'GitHub Integration',
];

const analysisRows = [
  {
    name: 'Active Analysis',
    sub: 'AI code review',
    metric: '234',
    change: '35%',
    arrow: true,
  },
  {
    name: 'Active Analysis',
    sub: 'Memory retrieval',
    metric: '43',
    change: '65%',
    arrow: false,
  },
  {
    name: 'Active Analysis',
    sub: 'Repository scan',
    metric: '45',
    change: '0%',
    arrow: true,
  },
];

export default function Home() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [search, setSearch] = useState('');

  return (
    <div
      className="flex min-h-screen overflow-hidden"
      style={{
        background: COLORS.bg,
        color: COLORS.text,
      }}
    >
      {/* SIDEBAR */}
      <aside
        className="hidden md:flex w-64 shrink-0 flex-col border-r"
        style={{
          background: COLORS.bg,
          borderColor: COLORS.border,
        }}
      >
        {/* Logo */}
        <div
          className="flex h-16 items-center border-b px-6"
          style={{ borderColor: COLORS.border }}
        >
          <div className="flex items-center gap-3 text-xl font-bold tracking-tight">
            <Sparkles
              className="h-6 w-6"
              style={{ color: COLORS.teal }}
            />
            <span>ReVise</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all"
                style={{
                  background: isActive
                    ? 'rgba(2,160,160,0.10)'
                    : 'transparent',
                  color: isActive
                    ? COLORS.teal
                    : COLORS.muted,
                }}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3">
          <button
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
            style={{ color: COLORS.muted }}
          >
            <LogOut className="h-5 w-5" />
            Log out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* TOP BAR */}
        <header
          className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-8"
          style={{
            background: COLORS.bg,
            borderColor: COLORS.border,
          }}
        >
          <div className="relative w-full max-w-md">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: COLORS.muted }}
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Search..."
              className="w-full rounded-md border py-2 pl-9 pr-4 text-sm outline-none"
              style={{
                background: '#0B1B20',
                borderColor: COLORS.border,
                color: COLORS.text,
              }}
            />
          </div>

          <div className="ml-4 flex items-center gap-4">
            <button
              className="relative"
              style={{ color: COLORS.muted }}
            >
              <Bell className="h-5 w-5" />

              <span
                className="absolute right-0 top-0 h-2 w-2 rounded-full border"
                style={{
                  background: COLORS.orange,
                  borderColor: COLORS.bg,
                }}
              />
            </button>

            <div
              className="h-8 w-8 overflow-hidden rounded-full border"
              style={{
                background: COLORS.surface,
                borderColor: COLORS.border,
              }}
            >
              <img
                src="https://i.pravatar.cc/100?img=33"
                alt="User Avatar"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* HEADER */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Dashboard
              </h1>

              <p
                className="mt-1 text-sm"
                style={{ color: COLORS.muted }}
              >
                AI-powered code intelligence and memory
              </p>
            </div>

            <button
              className="rounded-md px-4 py-2 text-sm font-medium shadow-lg transition hover:opacity-90"
              style={{
                background: COLORS.teal,
                color: COLORS.bg,
                boxShadow:
                  '0 0 15px rgba(2,160,160,0.20)',
              }}
            >
              New dashboard
            </button>
          </div>

          {/* DASHBOARD GRID */}
          <div className="grid min-h-[700px] grid-cols-1 gap-6 xl:grid-cols-4">
            {/* LEFT NETWORK PANEL */}
            <div
              className="relative min-h-[350px] overflow-hidden rounded-xl border xl:col-span-1"
              style={{
                background: COLORS.surface,
                borderColor: COLORS.border,
              }}
            >
              <NetworkCanvas />

              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, #0E2229, transparent 65%)',
                }}
              />

              <div className="absolute bottom-6 left-6 right-6 z-10">
                <div
                  className="mb-2 font-mono text-xs uppercase tracking-widest"
                  style={{ color: COLORS.teal }}
                >
                  ReVise Intelligence
                </div>

                <h3 className="text-xl font-bold">
                  Your codebase
                  <br />
                  remembers.
                </h3>

                <p
                  className="mt-2 text-xs leading-relaxed"
                  style={{ color: COLORS.muted }}
                >
                  Connect your repositories and let
                  ReVise build persistent engineering
                  memory.
                </p>
              </div>
            </div>

            {/* MIDDLE */}
            <div className="flex flex-col gap-6 xl:col-span-2">
              {/* HERO */}
              <div
                className="rounded-xl border p-6 md:p-8"
                style={{
                  background: COLORS.surface,
                  borderColor: COLORS.border,
                  boxShadow:
                    '0 10px 40px rgba(0,0,0,0.18)',
                }}
              >
                <span
                  className="mb-4 block text-sm font-medium"
                  style={{ color: COLORS.muted }}
                >
                  AI code review
                </span>

                <h2 className="mb-8 text-3xl font-bold leading-tight md:text-4xl">
                  Memory is not a feature
                  <br />
                  bolted onto an LLM wrapper
                  <br />
                  <span style={{ color: COLORS.teal }}>
                    — it is the product.
                  </span>
                </h2>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    className="rounded-md px-5 py-2.5 text-sm font-medium transition hover:opacity-90"
                    style={{
                      background: COLORS.teal,
                      color: COLORS.bg,
                    }}
                  >
                    Done now
                  </button>

                  <button
                    className="rounded-md border px-5 py-2.5 font-mono text-sm"
                    style={{
                      borderColor: COLORS.border,
                      color: COLORS.text,
                      background: 'transparent',
                    }}
                  >
                    #071317
                  </button>
                </div>
              </div>

              {/* LOWER CARDS */}
              <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-2">
                {/* ANALYTICS */}
                <div
                  className="flex min-h-[350px] flex-col rounded-xl border p-6"
                  style={{
                    background: COLORS.surface,
                    borderColor: COLORS.border,
                  }}
                >
                  <div className="mb-6 flex flex-wrap gap-2">
                    {pillTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded border px-2.5 py-1 font-mono text-[10px]"
                        style={{
                          background: COLORS.surface2,
                          borderColor: COLORS.border,
                          color: COLORS.muted,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      Active Analysis
                    </h3>

                    <button
                      className="rounded border px-2 py-1 text-xs"
                      style={{
                        background: COLORS.surface2,
                        borderColor: COLORS.border,
                        color: COLORS.muted,
                      }}
                    >
                      Baseless ▼
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead
                        className="border-b text-xs"
                        style={{
                          borderColor: COLORS.border,
                          color: COLORS.muted,
                        }}
                      >
                        <tr>
                          <th className="pb-3 font-normal">
                            Name
                          </th>

                          <th className="pb-3 font-normal">
                            Metrics
                          </th>

                          <th className="pb-3 font-normal">
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {analysisRows.map((row, index) => (
                          <tr
                            key={index}
                            className="border-b"
                            style={{
                              borderColor: COLORS.border,
                            }}
                          >
                            <td className="py-4">
                              <div className="font-medium">
                                {row.name}
                              </div>

                              <div
                                className="mt-1 text-xs"
                                style={{
                                  color: COLORS.muted,
                                }}
                              >
                                {row.sub}
                              </div>
                            </td>

                            <td
                              className="py-4 font-mono text-xs"
                              style={{
                                color: COLORS.text,
                              }}
                            >
                              {row.metric}
                            </td>

                            <td className="py-4">
                              <div className="flex flex-col gap-1">
                                <span
                                  className="flex items-center text-xs"
                                  style={{
                                    color: COLORS.orange,
                                  }}
                                >
                                  {row.arrow && (
                                    <ArrowUp className="mr-1 h-3 w-3" />
                                  )}
                                  {row.change}
                                </span>

                                <span
                                  className="flex items-center gap-1.5 text-xs"
                                  style={{
                                    color: COLORS.teal,
                                  }}
                                >
                                  <span
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{
                                      background:
                                        COLORS.teal,
                                    }}
                                  />
                                  Active
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* MEMORY GRAPH */}
                <div
                  className="relative flex min-h-[350px] flex-col overflow-hidden rounded-xl border p-6"
                  style={{
                    background: COLORS.surface,
                    borderColor: COLORS.border,
                  }}
                >
                  <h3 className="relative z-10 text-sm font-medium">
                    Memory Graph
                  </h3>

                  <div className="flex flex-1 items-center justify-center py-4">
                    <div className="h-56 w-full max-w-[280px]">
                      <MemoryGraphSnippet />
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium">
                      Connected memory
                    </div>

                    <div
                      className="mt-1 font-mono text-xs"
                      style={{ color: COLORS.muted }}
                    >
                      2,481 memories indexed
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT NETWORK PANEL */}
            <div
              className="relative min-h-[350px] overflow-hidden rounded-xl border xl:col-span-1"
              style={{
                background: COLORS.surface,
                borderColor: COLORS.border,
              }}
            >
              <NetworkCanvas />

              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, #0E2229, transparent 65%)',
                }}
              />

              <div className="absolute bottom-6 left-6 right-6 z-10">
                <div
                  className="mb-3 flex items-center gap-2 text-xs font-medium"
                  style={{ color: COLORS.teal }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      background: COLORS.teal,
                      boxShadow:
                        '0 0 10px rgba(2,160,160,0.8)',
                    }}
                  />
                  SYSTEM ACTIVE
                </div>

                <h3 className="text-xl font-bold">
                  Intelligence
                  <br />
                  online.
                </h3>

                <div
                  className="mt-4 rounded-lg border p-3"
                  style={{
                    background: 'rgba(7,19,23,0.65)',
                    borderColor: COLORS.border,
                  }}
                >
                  <div
                    className="text-xs"
                    style={{ color: COLORS.muted }}
                  >
                    Memory nodes
                  </div>

                  <div className="mt-1 font-mono text-lg">
                    2,481
                  </div>
                </div>
              </div>

              <div className="absolute right-6 top-6 opacity-20">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 40 40"
                >
                  <path
                    d="M20 0C20 11.0457 28.9543 20 40 20C28.9543 20 20 28.9543 20 40C20 28.9543 11.0457 20 0 20C11.0457 20 20 11.0457 20 0Z"
                    fill={COLORS.muted}
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* BOTTOM STATUS */}
          <div className="mt-6 flex justify-center">
            <div
              className="flex h-8 w-full max-w-4xl items-center gap-2 rounded-lg border px-4 opacity-60"
              style={{
                background: COLORS.surface,
                borderColor: COLORS.border,
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: COLORS.border }}
              />
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: COLORS.border }}
              />
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: COLORS.border }}
              />

              <span
                className="ml-2 font-mono text-[10px]"
                style={{ color: COLORS.muted }}
              >
                REVise / MEMORY ENGINE / ONLINE
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}