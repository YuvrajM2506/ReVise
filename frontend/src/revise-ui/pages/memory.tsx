import { useEffect, useMemo, useState } from "react";
import { Badge, Card, Drawer, EmptyState, Heading, Input, LoadingState, MemoryCard, SectionHeader, Select, Tabs, Text, TimelineItem } from "../components/ui";
import { getMemories, getTimeline } from "../services/revise";
import type { Memory, TimelineEvent } from "../types";

const graphNodes = [
  { id: "repo", label: "ReVise", x: 50, y: 50, type: "Repository", attention: false },
  { id: "auth", label: "Auth standard", x: 25, y: 24, type: "Standard", attention: true },
  { id: "pr42", label: "PR #42", x: 74, y: 22, type: "Pull request", attention: false },
  { id: "session", label: "session.ts", x: 19, y: 72, type: "File", attention: false },
  { id: "dev", label: "Yuvraj", x: 76, y: 74, type: "Developer", attention: false },
  { id: "outcome", label: "Review accepted", x: 50, y: 86, type: "Outcome", attention: false },
];
const edges = [["repo", "auth"], ["repo", "pr42"], ["repo", "session"], ["repo", "dev"], ["auth", "session"], ["pr42", "dev"], ["pr42", "outcome"]];

function MemoryGraph() {
  const [selected, setSelected] = useState(graphNodes[1]);
  const byId = Object.fromEntries(graphNodes.map(node => [node.id, node]));
  return <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
    <Card className="min-h-[32rem] overflow-hidden p-0">
      <svg viewBox="0 0 100 100" className="h-[32rem] w-full" role="img" aria-label="Engineering memory graph">
        {edges.map(([a, b]) => <line key={`${a}-${b}`} className="graph-edge" x1={byId[a].x} y1={byId[a].y} x2={byId[b].x} y2={byId[b].y} stroke="var(--color-line)" strokeWidth=".4"/>)}
        {graphNodes.map(node => <g key={node.id} className={`graph-node cursor-pointer ${node.attention ? "graph-attention" : ""}`} onClick={() => setSelected(node)} role="button" tabIndex={0} onKeyDown={event => event.key === "Enter" && setSelected(node)}>
          <circle cx={node.x} cy={node.y} r={selected.id === node.id ? 5 : 3.5} fill={node.attention ? "var(--color-attention)" : "var(--color-brand)"} opacity={selected.id === node.id ? 1 : .72}/>
          <circle cx={node.x} cy={node.y} r="7" fill="transparent"/>
          <text x={node.x} y={node.y + 7} textAnchor="middle" fill="var(--color-muted)" fontSize="2.5" fontFamily="var(--font-mono)">{node.label}</text>
        </g>)}
      </svg>
    </Card>
    <Card key={selected.id} className="graph-detail"><Badge tone={selected.attention ? "warning" : "brand"}>{selected.type}</Badge><Heading level={3} className="mt-4 text-base">{selected.label}</Heading><Text className="mt-3 text-sm leading-6 text-muted">{selected.id === "auth" ? "Authentication Standard: used in PR #42, #51, #73; confidence 94%; last reinforced 2 days ago." : "Connected to repository reviews, decisions, and engineering outcomes."}</Text><div className="mt-5 border-t border-line pt-4"><Text className="font-mono text-xs text-brand">6 connections</Text><Text className="mt-1 text-xs text-muted">Last reinforced 2 days ago</Text></div></Card>
  </div>;
}

export function MemoryPage() {
  const [items, setItems] = useState<Memory[] | null>(null);
  const [selected, setSelected] = useState<Memory | null>(null);
  const [tab, setTab] = useState("Memory Library");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [sort, setSort] = useState("Confidence");
  useEffect(() => { getMemories().then(setItems); }, []);
  const filtered = useMemo(() => {
    const result = (items ?? []).filter(item => (category === "All categories" || item.category === category) && `${item.title} ${item.content}`.toLowerCase().includes(query.toLowerCase()));
    return [...result].sort((a, b) => sort === "Confidence" ? b.confidence - a.confidence : sort === "Most used" ? b.usageCount - a.usageCount : a.title.localeCompare(b.title));
  }, [items, query, category, sort]);
  return <div className="animate-enter"><SectionHeader eyebrow="Institutional knowledge" title="Engineering Memory" action={<Badge tone="brand">{items?.length ?? 0} memories</Badge>}/><Text className="-mt-2 mb-6 max-w-2xl text-sm leading-6 text-muted">ReVise remembers decisions, standards, feedback, and outcomes—then retrieves the right context during every review.</Text><Tabs tabs={["Memory Library", "Memory Graph"]} active={tab} onChange={setTab}/><div className="mt-6">{tab === "Memory Graph" ? <MemoryGraph/> : <><div className="mb-5 grid gap-3 md:grid-cols-[1fr_14rem_11rem]"><Input aria-label="Search memories" placeholder="Search engineering memory…" value={query} onChange={event => setQuery(event.target.value)}/><Select aria-label="Filter by category" value={category} onChange={event => setCategory(event.target.value)}><option>All categories</option>{["Coding Standard", "Architecture Decision", "Review Preference", "Security Rule", "Performance Rule", "Team Convention", "Historical Outcome"].map(item => <option key={item}>{item}</option>)}</Select><Select aria-label="Sort memories" value={sort} onChange={event => setSort(event.target.value)}><option>Confidence</option><option>Most used</option><option>Title</option></Select></div>{!items ? <LoadingState label="Retrieving engineering memory…"/> : filtered.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filtered.map(item => <MemoryCard key={item.id} memory={item} onClick={() => setSelected(item)}/>)}</div> : <EmptyState title="No engineering memories found yet." detail="Teach ReVise something to begin building institutional memory."/>}</>}</div><Drawer open={Boolean(selected)} title="Memory details" onClose={() => setSelected(null)}>{selected && <div><Badge tone="brand">{selected.category}</Badge><Heading level={3} className="mt-4 text-xl">{selected.title}</Heading><Text className="mt-3 text-sm leading-7 text-muted">{selected.content}</Text><div className="mt-6 grid grid-cols-2 gap-3"><Card><Text className="text-xs text-muted">Confidence</Text><Text className="mt-2 font-mono text-lg text-brand">{selected.confidence}%</Text></Card><Card><Text className="text-xs text-muted">Used</Text><Text className="mt-2 font-mono text-lg">{selected.usageCount}×</Text></Card></div><div className="mt-6"><Heading level={4} className="text-sm">Reinforcement history</Heading><div className="mt-3 space-y-2">{selected.reinforcements.map(item => <Card key={item} className="flex items-center justify-between py-3"><span className="font-mono text-xs">{item}</span><Badge tone="brand">Reinforced</Badge></Card>)}</div></div><Text className="mt-6 font-mono text-xs text-muted">{selected.repository} · {selected.source} · {selected.date}</Text></div>}</Drawer></div>;
}

export function TimelinePage() {
  const [items, setItems] = useState<TimelineEvent[] | null>(null);
  useEffect(() => { getTimeline().then(setItems); }, []);
  return <div className="mx-auto max-w-4xl animate-enter"><SectionHeader eyebrow="Engineering history" title="Memory Timeline" action={<Badge tone="brand">Live</Badge>}/><Text className="-mt-2 mb-6 text-sm text-muted">A chronological record of how ReVise learns, recalls, and reinforces your team’s engineering knowledge.</Text>{!items ? <LoadingState label="Loading engineering timeline…"/> : items.length ? <Card className="p-6">{items.map(item => <TimelineItem key={item.id} event={item}/>)}</Card> : <EmptyState title="No timeline events yet" detail="Review a pull request or teach ReVise to begin building history."/>}</div>;
}
