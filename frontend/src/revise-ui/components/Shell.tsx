import { useEffect, useState, type ReactNode } from "react";
import { Badge, Heading, IconButton, StatusBadge, Text } from "./ui";
import AmbientBackground from "./AmbientBackground";

/**
 * Sidebar entries. Reports is resolved at render time to the newest stored run:
 * it previously linked to a hardcoded `/report/42`, which no run ever matched, so
 * the link led to a report that did not exist.
 */
const navItems: Array<[string, string]> = [
  ["Home", "/dashboard"], ["Analyze", "/analyze"], ["Pull Request Review", "/github-review"],
  ["Pair Programmer", "/pair-programmer"], ["CLI Docs", "/cli-docs"], ["Memory", "/memory"], ["Timeline", "/timeline"],
  ["Reports", "/dashboard"], ["Standards", "/standards"], ["Teach ReVise", "/teach"],
  ["Pricing", "/pricing"], ["Settings", "/settings"],
];
const marks = ["H", "A", "GH", "PP", "CLI", "M", "TL", "R", "ST", "T", "P", "S"];

export function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/**
 * Live memory-bank status for the sidebar. These counts used to be hardcoded
 * constants, which meant the shell advertised a fixed number of memories on
 * every page regardless of what the bank actually held.
 */
interface PulseSummary {
  total_memories: number;
  hindsight_connected: boolean;
}

export default function Shell({ path, children }: { path: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState<PulseSummary | null>(null);
  const [pulseFailed, setPulseFailed] = useState(false);
  const [latestRunId, setLatestRunId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/pulse", { headers: { "Content-Type": "application/json" } })
      .then(response => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then(data => { if (!cancelled) setPulse(data.pulse as PulseSummary); })
      .catch(() => { if (!cancelled) setPulseFailed(true); });

    // Point the Reports link at a run that actually exists, falling back to the
    // dashboard only when the store genuinely holds no runs yet.
    fetch("/api/runs?limit=1", { headers: { "Content-Type": "application/json" } })
      .then(response => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then(data => {
        const newest = Array.isArray(data?.runs) ? data.runs[0]?.id : null;
        if (!cancelled && typeof newest === "string" && newest !== "") setLatestRunId(newest);
      })
      .catch(() => { /* the Reports item keeps its dashboard fallback */ });

    return () => { cancelled = true; };
  }, []);

  const nav = navItems.map(([label, href]): [string, string] =>
    label === "Reports" && latestRunId ? [label, `/report/${latestRunId}`] : [label, href]
  );

  // Distinguish "still loading", "could not ask" and each real connection state,
  // so the shell never claims a status it has not verified.
  const memoryCountLabel = pulse ? `${pulse.total_memories} memories` : null;
  const statusLabel = pulse
    ? (pulse.hindsight_connected ? "Connected" : "Local only")
    : (pulseFailed ? "Unknown" : "Checking");
  const headlineStatus = pulse
    ? (pulse.hindsight_connected ? "Memory online" : "Memory local only")
    : (pulseFailed ? "Memory unknown" : "Checking memory…");

  const current = nav.find(([, href]) => href === path || (href.startsWith("/report") && path.startsWith("/report")))?.[0] ?? "ReVise";
  const reducedBackground = ["/analyze", "/github-review", "/pair-programmer", "/memory", "/timeline"].includes(path);
  return <div className="app-shell min-h-screen bg-transparent text-ink">
    <AmbientBackground reduced={reducedBackground}/>
    {open && <div className="fixed inset-0 z-30 bg-canvas/80 lg:hidden" onClick={() => setOpen(false)}/>}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface-low transition-transform duration-200 ease-out lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <a className="group flex h-16 items-center gap-3.5 border-b border-line px-5 transition-colors hover:bg-surface-raised/40" href="/" aria-label="Return to ReVise landing page">
        <div className="brand-mark grid size-8 shrink-0 place-items-center rounded-md bg-brand font-display font-bold text-canvas shadow-sm shadow-brand/25 transition-transform group-hover:scale-105">
          R
        </div>
        <div className="min-w-0 flex-1 text-left">
          <Heading level={1} className="truncate text-sm font-semibold tracking-tight text-ink">ReVise</Heading>
          <Text className="truncate font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Engineering memory</Text>
        </div>
      </a>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3" aria-label="Primary">
        {nav.map(([label, href], i) => {
          const active = path === href || (href.startsWith("/report") && path.startsWith("/report"));
          return (
            <button
              key={href}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => {
                navigate(href);
                setOpen(false);
              }}
              className={`group relative flex w-full min-h-[38px] items-center gap-3.5 rounded-md px-3 py-2 text-left text-xs font-medium transition-all duration-150 ${
                active
                  ? "bg-brand-soft/80 font-semibold text-ink shadow-[inset_0_0_0_1px_rgba(2,160,160,0.25)]"
                  : "text-muted hover:bg-surface-raised/70 hover:text-ink"
              }`}
            >
              {active && (
                <span className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-brand" aria-hidden="true" />
              )}
              <span
                className={`grid size-6 shrink-0 place-items-center rounded font-mono text-[10px] font-semibold transition-colors ${
                  active
                    ? "border border-brand/40 bg-brand/20 font-bold text-brand"
                    : "border border-line/60 bg-surface-raised/60 text-muted/90 group-hover:border-line group-hover:bg-surface-strong/60 group-hover:text-ink"
                }`}
              >
                {marks[i]}
              </span>
              <span className="truncate text-[13px] tracking-[-0.01em]">{label}</span>
            </button>
          );
        })}
      </nav>
      <div className="border-t border-line bg-surface-low/60 p-4">
        <div className="rounded-lg border border-line/60 bg-surface/60 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="size-1.5 shrink-0 rounded-full bg-brand animate-pulse" />
              <Text className="truncate text-xs font-semibold text-ink">Hindsight Memory</Text>
            </div>
            <StatusBadge status={statusLabel}/>
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-line/40 pt-2 font-mono text-[10px] text-muted">
            <span className="truncate">{memoryCountLabel ?? (pulseFailed ? "Bank offline" : "Loading…")}</span>
            <span className="shrink-0 text-muted/70">v2.4</span>
          </div>
        </div>
      </div>
    </aside>
    <div className="relative z-10 lg:pl-64">
      <header className="palette-header sticky top-0 z-20 flex h-16 items-center justify-between gap-3 bg-surface-low px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3"><IconButton label="Open navigation" onClick={() => setOpen(true)} className="lg:hidden">≡</IconButton><div className="min-w-0"><Text className="font-mono text-[10px] uppercase text-attention">ReVise /</Text><Heading level={2} className="truncate text-sm text-brand">{current}</Heading></div></div>
        <div className="flex items-center gap-2"><div className="hidden sm:block"><Badge tone="brand">{memoryCountLabel ? `${memoryCountLabel} indexed` : (pulseFailed ? "Memory bank offline" : "Loading memory…")}</Badge></div><div className="hidden md:block"><span className="palette-status inline-flex rounded border bg-attention/5 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider">{headlineStatus}</span></div><div className="grid size-8 place-items-center rounded-full border border-line bg-surface font-mono text-[10px]" title="Signed in as workspace owner">YM</div></div>
      </header>
      <main className="responsive-content mx-auto max-w-[1500px] p-4 md:p-6 lg:p-8">{children}</main>
    </div>
  </div>;
}
