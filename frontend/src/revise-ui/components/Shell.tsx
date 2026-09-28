import { useState, type ReactNode } from "react";
import { Badge, Button, Heading, IconButton, StatusBadge, Text } from "./ui";
import AmbientBackground from "./AmbientBackground";

const nav = [
  ["Home", "/dashboard"], ["Analyze", "/analyze"], ["Pull Request Review", "/github-review"],
  ["Pair Programmer", "/pair-programmer"], ["Memory", "/memory"], ["Timeline", "/timeline"],
  ["Reports", "/report/42"], ["Standards", "/standards"], ["Teach ReVise", "/teach"], ["Settings", "/settings"],
];
const marks = ["H", "A", "GH", "PP", "M", "TL", "R", "ST", "T", "S"];

export function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function Shell({ path, children }: { path: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const current = nav.find(([, href]) => href === path || (href.startsWith("/report") && path.startsWith("/report")))?.[0] ?? "ReVise";
  const reducedBackground = ["/analyze", "/github-review", "/pair-programmer", "/memory", "/timeline"].includes(path);
  return <div className="app-shell min-h-screen bg-transparent text-ink">
    <AmbientBackground reduced={reducedBackground}/>
    {open && <div className="fixed inset-0 z-30 bg-canvas/80 lg:hidden" onClick={() => setOpen(false)}/>}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface-low transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <a className="flex h-16 items-center gap-3 border-b border-line px-4" href="/" aria-label="Return to ReVise landing page"><div className="brand-mark grid size-8 place-items-center rounded bg-brand font-display font-bold text-canvas">R</div><div><Heading level={1} className="text-base text-attention">ReVise</Heading><Text className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">Engineering memory</Text></div></a>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Primary">{nav.map(([label, href], i) => { const active = path === href || (href.startsWith("/report") && path.startsWith("/report")); return <Button key={href} variant="ghost" aria-current={active ? "page" : undefined} onClick={() => { navigate(href); setOpen(false); }} className={`nav-item w-full justify-start ${active ? "nav-active bg-brand-soft text-brand" : ""}`}><span className="inline-grid w-6 place-items-center font-mono text-[10px]">{marks[i]}</span>{label}</Button>; })}</nav>
      <div className="border-t border-line p-4"><div className="flex items-center justify-between"><Text className="text-xs text-muted">Memory status</Text><StatusBadge status="Connected"/></div><Text className="mt-3 font-mono text-[10px] text-muted">v2.4 · 847 memories</Text></div>
    </aside>
    <div className="relative z-10 lg:pl-64">
      <header className="palette-header sticky top-0 z-20 flex h-16 items-center justify-between gap-3 bg-surface-low px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3"><IconButton label="Open navigation" onClick={() => setOpen(true)} className="lg:hidden">≡</IconButton><div className="min-w-0"><Text className="font-mono text-[10px] uppercase text-attention">ReVise /</Text><Heading level={2} className="truncate text-sm text-brand">{current}</Heading></div></div>
        <div className="flex items-center gap-2"><div className="hidden sm:block"><Badge tone="brand">847 memories indexed</Badge></div><div className="hidden md:block"><span className="palette-status inline-flex rounded border bg-attention/5 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider">Memory online</span></div><IconButton label="Notifications">N</IconButton><div className="grid size-8 place-items-center rounded-full border border-line bg-surface font-mono text-[10px]">YM</div></div>
      </header>
      <main className="responsive-content mx-auto max-w-[1500px] p-4 md:p-6 lg:p-8">{children}</main>
    </div>
  </div>;
}
