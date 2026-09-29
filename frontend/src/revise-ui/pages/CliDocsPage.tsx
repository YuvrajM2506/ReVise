"use client";

import { useState } from "react";
import {
  Terminal,
  Play,
  Copy,
  Check,
  Search,
  BrainCircuit,
  ShieldAlert,
  GitPullRequest,
  Sparkles,
  Layers,
  Cpu,
  ArrowRight,
  ExternalLink,
  Code2,
  Workflow,
  CheckCircle2,
  HelpCircle,
  Zap,
  Activity,
  ChevronRight,
  FileCode,
  Sliders,
} from "lucide-react";
import { Badge, Button, Heading, Text } from "../components/ui";

interface CommandDoc {
  name: string;
  syntax: string;
  category: "review" | "reasoning" | "memory" | "ops";
  summary: string;
  description: string;
  flags: Array<{ flag: string; type: string; desc: string; default?: string }>;
  examples: Array<{ cmd: string; desc: string }>;
}

const COMMAND_DOCS: CommandDoc[] = [
  {
    name: "review",
    syntax: "revise review [target] [options]",
    category: "review",
    summary: "Review a PR URL, local branch, staged changes, file, or piped diff",
    description:
      "Performs a full memory-informed code review against historical outages, incidents, and standards stored in Hindsight. Scores risk from 0 to 100, produces structured findings, and cites relevant historical incidents.",
    flags: [
      { flag: "--fail-on <SEVERITY>", type: "string", desc: "CI gate: Exit with code 1 if risk meets/exceeds CRITICAL | HIGH | MEDIUM | LOW" },
      { flag: "--service <name>", type: "string", desc: "Scope memory retrieval to a specific microservice", default: "orders-service" },
      { flag: "--focus <area>", type: "string", desc: "Primary focus area (e.g. 'Unsafe DB migration', 'Auth regression')" },
      { flag: "--staged", type: "boolean", desc: "Review only git staged changes (`git diff --cached`)" },
      { flag: "--no-memory", type: "boolean", desc: "Run review without memory injection for baseline risk comparison" },
      { flag: "--json", type: "boolean", desc: "Output raw JSON machine-readable evaluation report" },
    ],
    examples: [
      { cmd: "revise review https://github.com/owner/repo/pull/1842", desc: "Review a public GitHub pull request" },
      { cmd: "git diff | revise review - --fail-on HIGH", desc: "Pipe git diff into ReVise in CI/CD pipeline" },
      { cmd: "revise review src/auth/session.ts --focus 'Session fixation'", desc: "Review single file against targeted focus" },
      { cmd: "revise review --staged", desc: "Pre-commit review of staged files" },
    ],
  },
  {
    name: "chat",
    syntax: "revise chat [run-id] [options]",
    category: "reasoning",
    summary: "Interactive AI Pair Programmer REPL grounded in engineering memory",
    description:
      "Starts a terminal chat session grounded in the context of a previous review run and relevant Hindsight memories. Ask follow-up questions, discuss refactor strategies, or clarify potential outage risks.",
    flags: [
      { flag: "-m, --message <text>", type: "string", desc: "Send a single one-off question without entering interactive REPL" },
      { flag: "--service <name>", type: "string", desc: "Scope memory search to a specific service" },
    ],
    examples: [
      { cmd: "revise chat RUN-889", desc: "Chat grounded in run #889 context and findings" },
      { cmd: "revise chat -m 'Why does lock contention happen here?'", desc: "Quick one-off grounded question" },
    ],
  },
  {
    name: "teach",
    syntax: "revise teach [options]",
    category: "memory",
    summary: "Record real-world outcomes, post-mortems, and incident resolutions",
    description:
      "Feeds human review outcomes and post-mortem learnings back into Hindsight memory and the Causal Timeline. The next time similar code is reviewed, ReVise will cite this incident.",
    flags: [
      { flag: "--title <title>", type: "string", desc: "Short descriptive title of the incident/learning" },
      { flag: "--outcome <text>", type: "string", desc: "What actually happened (e.g. 'Rolled back due to locks')" },
      { flag: "--service <name>", type: "string", desc: "Associated service name" },
      { flag: "--category <cat>", type: "string", desc: "Category: INCIDENT | POST_MORTEM | PR_LEARNING | REFACTOR" },
      { flag: "--impact <SEV>", type: "string", desc: "Impact level: HIGH | MEDIUM | LOW | SEV-2" },
    ],
    examples: [
      { cmd: "revise teach", desc: "Launch interactive CLI wizard" },
      { cmd: "revise teach --title 'Migration timeout' --service orders-service --impact HIGH", desc: "Scriptable flag write-back" },
    ],
  },
  {
    name: "fix",
    syntax: "revise fix [run-id] [options]",
    category: "review",
    summary: "Trigger autonomous Aider remediation in sandbox based on run findings",
    description:
      "Invokes the paired Aider Python service in an isolated sandbox repository clone to implement the recommended fix directly in code.",
    flags: [
      { flag: "--dry-run", type: "boolean", desc: "Preview suggested changes without writing diffs" },
      { flag: "--target-file <path>", type: "string", desc: "Pin specific file for remediation" },
    ],
    examples: [
      { cmd: "revise fix RUN-889", desc: "Generate fix for findings in RUN-889" },
    ],
  },
  {
    name: "memory",
    syntax: "revise memory [list|show|search] [args] [options]",
    category: "memory",
    summary: "Inspect, query, and search Hindsight engineering memories",
    description:
      "Browse the live memory bank, search semantically or by keyword, and inspect specific memory metadata including incident links, tags, and citations.",
    flags: [
      { flag: "--service <name>", type: "string", desc: "Filter memories by service" },
      { flag: "--category <cat>", type: "string", desc: "Filter by category" },
      { flag: "--json", type: "boolean", desc: "Output memories as JSON" },
    ],
    examples: [
      { cmd: "revise memory list", desc: "List all memories in the active bank" },
      { cmd: "revise memory search 'PostgreSQL lock'", desc: "Semantic/keyword search across memories" },
      { cmd: "revise memory show MEM-001", desc: "Show deep inspection of a specific memory" },
    ],
  },
  {
    name: "timeline",
    syntax: "revise timeline [options]",
    category: "memory",
    summary: "Render the causal incident-resolution timeline chain",
    description:
      "Displays the unbroken causal chain connecting historical pull requests, production rollbacks, SEV-2 incidents, post-mortem playbooks, and prevented outages.",
    flags: [
      { flag: "--service <name>", type: "string", desc: "Filter timeline events by service" },
      { flag: "--search <query>", type: "string", desc: "Search event titles or details" },
      { flag: "--json", type: "boolean", desc: "Output timeline graph as JSON" },
    ],
    examples: [
      { cmd: "revise timeline", desc: "Print full causal event chain in terminal" },
      { cmd: "revise timeline --service orders-service", desc: "Filter timeline to specific service" },
    ],
  },
  {
    name: "standards",
    syntax: "revise standards [options]",
    category: "memory",
    summary: "View active team engineering standards and guardrails",
    description:
      "Lists the living guardrails synthesized from past incidents and team consensus, complete with violation examples and recommended patterns.",
    flags: [
      { flag: "--service <name>", type: "string", desc: "Filter standards by service" },
      { flag: "--json", type: "boolean", desc: "Output standards list as JSON" },
    ],
    examples: [
      { cmd: "revise standards", desc: "List all team standards and rules" },
    ],
  },
  {
    name: "runs",
    syntax: "revise runs [list|show] [args] [options]",
    category: "review",
    summary: "View evaluation history and inspect detailed run reports",
    description:
      "Browse past evaluation runs, check their risk scores and memory citations, or inspect the full findings and code diff of any historical run.",
    flags: [
      { flag: "--limit <number>", type: "number", desc: "Limit number of recent runs shown", default: "10" },
      { flag: "--json", type: "boolean", desc: "Output runs as JSON" },
    ],
    examples: [
      { cmd: "revise runs list", desc: "Show recent review evaluation runs" },
      { cmd: "revise runs show RUN-889", desc: "Display full review report for run #889" },
    ],
  },
  {
    name: "doctor",
    syntax: "revise doctor [options]",
    category: "ops",
    summary: "Probe reachability and credentials for Hindsight, Groq, and GitHub",
    description:
      "Performs real-time diagnostics of external dependencies, validating API keys, measuring endpoint latencies, and verifying fallback simulator readiness.",
    flags: [
      { flag: "--json", type: "boolean", desc: "Output doctor diagnostic report as JSON" },
    ],
    examples: [
      { cmd: "revise doctor", desc: "Run full system diagnostic probe" },
    ],
  },
  {
    name: "status",
    syntax: "revise status [options]",
    category: "ops",
    summary: "Real-time memory bank pulse and health metrics",
    description:
      "Outputs bank health, memory count, indexed services, active guardrails, and connection state.",
    flags: [
      { flag: "--json", type: "boolean", desc: "Output status as JSON" },
    ],
    examples: [
      { cmd: "revise status", desc: "Print memory pulse card" },
    ],
  },
  {
    name: "config",
    syntax: "revise config [list|get|set] [key] [val]",
    category: "ops",
    summary: "Manage local CLI preferences and environment keys",
    description:
      "Reads and writes configuration values in `~/.config/revise/config.json` or `.env.local`.",
    flags: [],
    examples: [
      { cmd: "revise config list", desc: "List current resolved configuration" },
      { cmd: "revise config set groq_api_key gsk_...", desc: "Save Groq API key" },
    ],
  },
];

const TERMINAL_TABS = [
  {
    id: "review",
    label: "PR Review",
    cmd: "revise review https://github.com/acme/platform/pull/1842 --fail-on HIGH",
    output: `
   ██████╗ ███████╗██╗   ██╗██╗███████╗███████╗
   ██╔══██╗██╔════╝██║   ██║██║██╔════╝██╔════╝
   ██████╔╝█████╗  ██║   ██║██║███████╗█████╗  
   ██╔══██╗██╔══╝  ╚██╗ ██╔╝██║╚════██║██╔══╝  
   ██║  ██║███████╗ ╚████╔╝ ██║███████║███████╗
   ╚═╝  ╚═╝╚══════╝  ╚═══╝  ╚═╝╚══════╝╚══════╝
   Engineering Memory Code Review Agent (v2.4)

[+] Pull Request : https://github.com/acme/platform/pull/1842
[+] Service Scope: orders-service
[+] Memory Recall: 4 relevant memories retrieved from Hindsight (182ms)
[+] Model Engine : Groq Cloud LPU (openai/gpt-oss-120b)

────────────────────────────────────────────────────────────────────────────────
RISK EVALUATION
────────────────────────────────────────────────────────────────────────────────
Risk Score: [████████████████████░░░░░░░░░░] 78 / 100  [HIGH RISK]
Confidence: 94% · Grounded in 4 engineering memories

────────────────────────────────────────────────────────────────────────────────
FINDINGS (2 issues detected)
────────────────────────────────────────────────────────────────────────────────

● [HIGH] Session mutated prior to validation assertion
  File: src/auth/session.ts:48
  Risk: Mutating state before schema assert allows corrupted sessions to persist.
  
  Historical Context:
  Cites [INC-208] Authentication regression · March 14 (orders-service)
  "Validate before writing session state. A partial mutation caused privilege escalation."

  Diff Suggestion:
    - await updateSession(session, input)
    + assertValid(session)
    + await updateSession(session, input)

● [MEDIUM] Missing transaction isolation level on balance transfer
  File: src/billing/transfers.ts:112
  Risk: Potential race condition under concurrent debit spikes.
  
  Historical Context:
  Cites [STD-002] Concurrent ledger mutation safety

────────────────────────────────────────────────────────────────────────────────
CI/CD GATE RESULT
────────────────────────────────────────────────────────────────────────────────
[X] FAILED: Risk score 78 exceeds threshold HIGH.
    Exit code: 1 (Build blocked by ReVise)
`,
  },
  {
    id: "chat",
    label: "Pair REPL",
    cmd: "revise chat RUN-889",
    output: `
────────────────────────────────────────────────────────────────────────────────
ReVise AI Pair Programmer · REPL Session
Grounded in context from RUN-889 (orders-service)
────────────────────────────────────────────────────────────────────────────────

[ReVise]: Hello! I'm grounded in RUN-889 and 12 memories from the Acme Platform bank.
          I see you're working on the customer-region analytics migration. How can I assist?

> user: Why did this migration cause a lock timeout in INC-024?

[ReVise]: In INC-024 (SEV-2, orders-service), adding a non-null column with a default
          value to the \`orders\` table acquired an \`ACCESS EXCLUSIVE\` lock on Postgres 14.
          Under active checkout traffic (4,200 req/min), lock contention queued all
          incoming writes, exhausting the pool in 42 seconds.

          Recommended Safe Pattern (Standard STD-001):
          1. Add column as NULLABLE without default.
          2. Backfill existing rows in batches of 5,000.
          3. Set DEFAULT and NOT NULL with VALIDATE CONSTRAINT separately.

> user: _
`,
  },
  {
    id: "doctor",
    label: "Doctor Check",
    cmd: "revise doctor",
    output: `
────────────────────────────────────────────────────────────────────────────────
ReVise System & Integration Doctor
────────────────────────────────────────────────────────────────────────────────

[+] Configuration File: ~/.config/revise/config.json (valid)
[+] Local Memory Store: frontend/data/app_state.json (12 memories, 3 runs)

Checking external services:
  [*] Hindsight Cloud REST API ... [OK] 200 (142ms)
      Bank ID: acme-platform · Mode: Live Vector + Keyword
  [*] Groq Cloud LPU API ........ [OK] 200 (88ms)
      Primary Model: openai/gpt-oss-120b
      Fallback Chain: openai/gpt-oss-20b -> qwen/qwen3.8-27b
  [*] GitHub API (Anonymous) .... [OK] 200 (210ms)
      Rate Limit: 58/60 remaining
  [*] Aider Python Service ...... [OK] 200 (12ms)
      Endpoint: http://localhost:8001 (Sandbox ready)

Summary: All 4 systems operational. ReVise is running in FULL LIVE mode.
`,
  },
  {
    id: "pipe",
    label: "Piped CI/CD",
    cmd: "git diff origin/main...HEAD | revise review - --fail-on HIGH --json",
    output: `
{
  "run_id": "RUN-902",
  "target": "stdin",
  "risk_score": 34,
  "risk_tier": "LOW",
  "gate_passed": true,
  "metrics": {
    "files_analyzed": 3,
    "lines_added": 45,
    "lines_removed": 12,
    "memories_recalled": 3
  },
  "findings": [
    {
      "severity": "LOW",
      "file": "src/utils/logger.ts",
      "title": "Redundant debug log in tight loop",
      "memory_citations": ["MEM-011"]
    }
  ],
  "exit_code": 0
}
`,
  },
];

export default function CliDocsPage() {
  const [activeTab, setActiveTab] = useState("review");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const filteredCommands = COMMAND_DOCS.filter(cmd => {
    const matchesCat = selectedCategory === "all" || cmd.category === selectedCategory;
    const matchesSearch =
      cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const activeTerminal = TERMINAL_TABS.find(t => t.id === activeTab) || TERMINAL_TABS[0];

  return (
    <div className="mx-auto max-w-6xl space-y-12 pb-24 text-ink">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-surface-low via-surface to-surface-low p-8 shadow-2xl md:p-12">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-brand/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 size-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand-soft px-3 py-1 font-mono text-xs font-semibold text-brand">
              <Terminal className="size-3.5" />
              ReVise CLI v2.4
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-low px-3 py-1 font-mono text-xs text-muted">
              <CheckCircle2 className="size-3.5 text-emerald-400" />
              Zero-Network Simulation Fallback
            </span>
          </div>

          <Heading level={1} className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            Engineering Memory <br />
            <span className="bg-gradient-to-r from-brand via-cyan-300 to-teal-200 bg-clip-text text-transparent">
              Directly in Your Terminal
            </span>
          </Heading>

          <Text className="text-base text-soft md:text-lg leading-relaxed">
            Run instant AI code reviews against your team&apos;s past outages, post-mortems, and engineering standards.
            Use it locally on staged changes, inspect memories, chat in an interactive REPL, or gate CI/CD pull requests.
          </Text>

          {/* Quick Install Bar */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex items-center rounded-lg border border-brand/30 bg-black/60 px-4 py-2.5 font-mono text-sm shadow-inner">
              <span className="text-brand mr-3">$</span>
              <span className="text-white selection:bg-brand/40">npm run revise -- review</span>
              <button
                type="button"
                onClick={() => copyToClipboard("npm run revise -- review", "hero-install")}
                className="ml-4 text-muted hover:text-white transition"
                title="Copy command"
              >
                {copiedText === "hero-install" ? (
                  <Check className="size-4 text-emerald-400" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>
            </div>

            <a
              href="#quickstart"
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-canvas transition hover:bg-brand/90 shadow-lg shadow-brand/20"
            >
              Get Started
              <ArrowRight className="size-4" />
            </a>
            <a
              href="#command-reference"
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface-low px-5 py-2.5 text-sm font-semibold text-soft transition hover:border-brand/40 hover:text-white"
            >
              Command Reference
            </a>
          </div>
        </div>
      </section>

      {/* Interactive Terminal Demo */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-brand">
              <Play className="size-3" /> Live Terminal Simulator
            </div>
            <Heading level={2} className="text-xl font-bold text-white md:text-2xl">
              See the CLI in Action
            </Heading>
          </div>

          {/* Terminal Tabs */}
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface-low p-1">
            {TERMINAL_TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded px-3 py-1.5 font-mono text-xs font-medium transition ${
                  activeTab === tab.id
                    ? "bg-brand text-canvas font-bold shadow"
                    : "text-muted hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Terminal Window */}
        <div className="overflow-hidden rounded-xl border border-line bg-[#090b10] shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-red-500/80" />
              <span className="size-3 rounded-full bg-yellow-500/80" />
              <span className="size-3 rounded-full bg-emerald-500/80" />
              <span className="ml-3 font-mono text-xs text-muted">revise-terminal ~ zsh</span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(activeTerminal.cmd, `term-${activeTab}`)}
              className="flex items-center gap-1.5 font-mono text-xs text-muted hover:text-white transition"
            >
              {copiedText === `term-${activeTab}` ? (
                <>
                  <Check className="size-3.5 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="size-3.5" /> Copy Command
                </>
              )}
            </button>
          </div>

          <div className="p-4 md:p-6 overflow-x-auto font-mono text-xs leading-relaxed text-slate-300">
            <div className="flex items-center gap-2 text-brand font-semibold mb-3">
              <span>$</span>
              <span className="text-white">{activeTerminal.cmd}</span>
            </div>
            <pre className="whitespace-pre text-slate-300 font-mono selection:bg-brand/40">
              {activeTerminal.output.trim()}
            </pre>
          </div>
        </div>
      </section>

      {/* Key Architectural Pillars */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="font-mono text-xs uppercase tracking-widest text-brand">Why ReVise CLI</span>
          <Heading level={2} className="text-2xl font-bold text-white md:text-3xl">
            Not a Stateless Wrapper. A Memory Agent.
          </Heading>
          <Text className="text-muted text-sm">
            Stateless AI code reviewers give generic advice. ReVise checks whether your change looks like the PR that caused a SEV-2 last quarter.
          </Text>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-line bg-surface-low p-6 space-y-3 hover:border-brand/40 transition">
            <div className="flex size-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <BrainCircuit className="size-5" />
            </div>
            <h3 className="font-semibold text-white">Hindsight Vector Memory</h3>
            <p className="text-xs text-muted leading-relaxed">
              Retrieves past post-mortems, incidents, and standards scoped to the service being modified in under 200ms.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface-low p-6 space-y-3 hover:border-brand/40 transition">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldAlert className="size-5" />
            </div>
            <h3 className="font-semibold text-white">CI/CD Risk Gating</h3>
            <p className="text-xs text-muted leading-relaxed">
              Block high-risk changes before merge using <code className="text-brand">--fail-on HIGH</code> in GitHub Actions or GitLab pipelines.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface-low p-6 space-y-3 hover:border-brand/40 transition">
            <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
              <Workflow className="size-5" />
            </div>
            <h3 className="font-semibold text-white">Causal Incident Timeline</h3>
            <p className="text-xs text-muted leading-relaxed">
              Every finding traces back to a real historical event node: PR warning → Rollback → Incident → Playbook.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface-low p-6 space-y-3 hover:border-brand/40 transition">
            <div className="flex size-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <Zap className="size-5" />
            </div>
            <h3 className="font-semibold text-white">Continuous Write-Back</h3>
            <p className="text-xs text-muted leading-relaxed">
              Record incident resolutions with <code className="text-brand">revise teach</code> to continuously train future review reasoning.
            </p>
          </div>
        </div>
      </section>

      {/* Quickstart / Implementation Guide */}
      <section id="quickstart" className="space-y-6 pt-6">
        <div className="space-y-2">
          <span className="font-mono text-xs uppercase tracking-widest text-brand">Getting Started</span>
          <Heading level={2} className="text-2xl font-bold text-white md:text-3xl">
            How to Implement & Run the CLI
          </Heading>
          <Text className="text-muted text-sm">
            Follow this 4-step setup to integrate ReVise into your local development environment or repository.
          </Text>
        </div>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="rounded-xl border border-line bg-surface p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-full bg-brand text-canvas font-bold text-xs">
                1
              </span>
              <h3 className="text-base font-semibold text-white">Run via NPM or Link Globally</h3>
            </div>
            <Text className="text-sm text-soft">
              ReVise CLI is bundled directly within the repository with a cross-platform executable launcher in <code className="text-brand">bin/revise.js</code>.
            </Text>
            <div className="rounded-lg bg-black/70 p-4 font-mono text-xs text-slate-300 space-y-2 border border-white/10">
              <div className="text-muted"># Option A: Execute directly via repository script</div>
              <div className="text-brand font-semibold">$ npm run revise -- --help</div>
              <div className="text-muted pt-2"># Option B: Link globally to your system PATH</div>
              <div className="text-white">$ npm link</div>
              <div className="text-brand font-semibold">$ revise --help</div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="rounded-xl border border-line bg-surface p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-full bg-brand text-canvas font-bold text-xs">
                2
              </span>
              <h3 className="text-base font-semibold text-white">Configure Environment Credentials (Optional)</h3>
            </div>
            <Text className="text-sm text-soft">
              ReVise automatically falls back to an offline deterministic simulator and local memory store when keys are omitted. Add keys to unlock full cloud capability:
            </Text>
            <div className="rounded-lg bg-black/70 p-4 font-mono text-xs text-slate-300 space-y-1 border border-white/10">
              <div className="text-muted"># frontend/.env.local or ~/.config/revise/config.json</div>
              <div><span className="text-teal-300">GROQ_API_KEY</span>=gsk_your_groq_lpu_key</div>
              <div><span className="text-teal-300">HINDSIGHT_API_KEY</span>=hsk_your_hindsight_vector_key</div>
              <div><span className="text-teal-300">HINDSIGHT_BANK_ID</span>=acme-platform</div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="rounded-xl border border-line bg-surface p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-full bg-brand text-canvas font-bold text-xs">
                3
              </span>
              <h3 className="text-base font-semibold text-white">Verify Integration Health</h3>
            </div>
            <Text className="text-sm text-soft">
              Run the doctor probe to verify credentials and connectivity to Hindsight, Groq, and GitHub:
            </Text>
            <div className="rounded-lg bg-black/70 p-4 font-mono text-xs text-slate-300 border border-white/10">
              <span className="text-brand font-semibold">$ revise doctor</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="rounded-xl border border-line bg-surface p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-full bg-brand text-canvas font-bold text-xs">
                4
              </span>
              <h3 className="text-base font-semibold text-white">Review Your First Code Change</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Text className="text-xs font-semibold uppercase text-muted">Review a live GitHub PR:</Text>
                <div className="rounded-lg bg-black/70 p-3 font-mono text-xs text-slate-300 border border-white/10">
                  revise review https://github.com/owner/repo/pull/12
                </div>
              </div>
              <div className="space-y-2">
                <Text className="text-xs font-semibold uppercase text-muted">Review local uncommitted changes:</Text>
                <div className="rounded-lg bg-black/70 p-3 font-mono text-xs text-slate-300 border border-white/10">
                  revise review --staged
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CI/CD Integration Recipes */}
      <section className="space-y-6">
        <div className="space-y-2">
          <span className="font-mono text-xs uppercase tracking-widest text-brand">Automation</span>
          <Heading level={2} className="text-2xl font-bold text-white md:text-3xl">
            CI/CD Pipeline Recipes
          </Heading>
          <Text className="text-muted text-sm">
            Automatically block risky pull requests in GitHub Actions or pre-commit hooks before they reach production.
          </Text>
        </div>

        <div className="overflow-hidden rounded-xl border border-line bg-surface-low">
          <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3">
            <div className="flex items-center gap-2 font-mono text-xs text-white">
              <FileCode className="size-4 text-brand" />
              .github/workflows/revise-review.yml
            </div>
            <button
              type="button"
              onClick={() =>
                copyToClipboard(
                  `name: ReVise Memory Code Review
on: [pull_request]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install ReVise
        run: npm ci

      - name: Memory Code Review Gate
        env:
          GROQ_API_KEY: \${{ secrets.GROQ_API_KEY }}
          HINDSIGHT_API_KEY: \${{ secrets.HINDSIGHT_API_KEY }}
        run: |
          git diff origin/\${{ github.base_ref }}...HEAD | \\
          npm run revise -- review - --fail-on HIGH --service orders-service`,
                  "ci-action"
                )
              }
              className="flex items-center gap-1 font-mono text-xs text-muted hover:text-white transition"
            >
              {copiedText === "ci-action" ? (
                <>
                  <Check className="size-3.5 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="size-3.5" /> Copy Workflow
                </>
              )}
            </button>
          </div>
          <pre className="p-4 md:p-6 overflow-x-auto font-mono text-xs leading-relaxed text-slate-300 bg-[#080a0f]">
{`name: ReVise Memory Code Review
on: [pull_request]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install ReVise
        run: npm ci

      - name: Memory Code Review Gate
        env:
          GROQ_API_KEY: \${{ secrets.GROQ_API_KEY }}
          HINDSIGHT_API_KEY: \${{ secrets.HINDSIGHT_API_KEY }}
        run: |
          git diff origin/\${{ github.base_ref }}...HEAD | \\
          npm run revise -- review - --fail-on HIGH --service orders-service`}
          </pre>
        </div>
      </section>

      {/* Comprehensive Command Reference */}
      <section id="command-reference" className="space-y-6 pt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <span className="font-mono text-xs uppercase tracking-widest text-brand">Command Reference</span>
            <Heading level={2} className="text-2xl font-bold text-white md:text-3xl">
              Complete CLI Command Suite
            </Heading>
            <Text className="text-muted text-sm">
              Detailed syntax, options, and usage examples for all 11 core commands.
            </Text>
          </div>

          {/* Category Filter & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter commands..."
                className="rounded-lg border border-line bg-surface-low py-1.5 pl-8 pr-3 font-mono text-xs text-white placeholder:text-muted focus:border-brand focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-line bg-surface-low p-1">
              {[
                { id: "all", label: "All" },
                { id: "review", label: "Review" },
                { id: "reasoning", label: "Reasoning" },
                { id: "memory", label: "Memory" },
                { id: "ops", label: "Ops" },
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                    selectedCategory === cat.id
                      ? "bg-brand text-canvas font-semibold"
                      : "text-muted hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Command Cards Grid */}
        <div className="space-y-4">
          {filteredCommands.map(cmd => (
            <div
              key={cmd.name}
              className="rounded-xl border border-line bg-surface-low p-6 space-y-4 hover:border-brand/30 transition shadow-lg"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-brand">revise {cmd.name}</span>
                    <Badge tone="brand">{cmd.category}</Badge>
                  </div>
                  <Text className="text-sm text-slate-300">{cmd.summary}</Text>
                </div>
                <div className="rounded bg-black/60 px-3 py-1.5 font-mono text-xs text-cyan-300 border border-white/5">
                  {cmd.syntax}
                </div>
              </div>

              <Text className="text-xs text-muted leading-relaxed">{cmd.description}</Text>

              {/* Flags Table */}
              {cmd.flags.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted">Options & Flags:</span>
                  <div className="overflow-x-auto rounded-lg border border-line bg-surface">
                    <table className="w-full text-left font-mono text-xs">
                      <thead className="border-b border-line bg-surface-low text-[10px] text-muted uppercase">
                        <tr>
                          <th className="px-3 py-2">Flag</th>
                          <th className="px-3 py-2">Type</th>
                          <th className="px-3 py-2">Description</th>
                          <th className="px-3 py-2">Default</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line text-slate-300">
                        {cmd.flags.map(f => (
                          <tr key={f.flag} className="hover:bg-white/[0.02]">
                            <td className="px-3 py-2 text-brand font-semibold whitespace-nowrap">{f.flag}</td>
                            <td className="px-3 py-2 text-muted">{f.type}</td>
                            <td className="px-3 py-2 text-xs font-sans text-soft">{f.desc}</td>
                            <td className="px-3 py-2 text-muted">{f.default || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Examples */}
              <div className="space-y-2 pt-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted">Usage Examples:</span>
                <div className="space-y-1.5">
                  {cmd.examples.map((ex, i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded bg-black/50 px-3 py-2 font-mono text-xs border border-white/5"
                    >
                      <div className="flex items-center gap-2 overflow-x-auto">
                        <span className="text-brand">$</span>
                        <span className="text-slate-200">{ex.cmd}</span>
                      </div>
                      <span className="text-[11px] font-sans text-muted shrink-0">{ex.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div className="rounded-xl border border-line bg-surface p-12 text-center text-muted">
              No CLI commands matched your search query.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
