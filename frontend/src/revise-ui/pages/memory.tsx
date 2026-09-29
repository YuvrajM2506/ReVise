import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Drawer, EmptyState, ErrorState, Heading, Input, LoadingState, MemoryCard, SectionHeader, Select, Tabs, Text, TimelineItem } from "../components/ui";
import { getMemoriesStrict, getTimelineStrict } from "../services/revise";
import type { Memory, TimelineEvent } from "../types";

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  type: string;
  attention: boolean;
}

/** Deterministic pseudo-layout on a 100x100 canvas, seeded by the node id. */
function layoutNode(index: number, total: number, seed: string): { x: number; y: number } {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  const jitter = (hash % 13) - 6;
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 + hash * 0.01;
  const radius = 30 + (hash % 9);
  return {
    x: Math.min(92, Math.max(8, 50 + Math.cos(angle) * radius + jitter * 0.4)),
    y: Math.min(92, Math.max(8, 50 + Math.sin(angle) * radius + jitter * 0.4)),
  };
}

/**
 * The memory graph is derived from whatever the bank actually holds: the
 * repository node sits at the centre, one node per real memory, and edges
 * connect memories to the repository they are filed under. With fewer than two
 * memories the graph is not drawn at all — a six-node fiction with fake
 * connection counts is worse than an honest empty state.
 */
function MemoryGraph({ items }: { items: Memory[] }) {
  const nodes = useMemo<GraphNode[]>(() => {
    const repoLabel = items[0]?.repository || "workspace";
    const repoNode: GraphNode = { id: "repo", label: repoLabel, x: 50, y: 50, type: "Repository", attention: false };
    const memoryNodes = items.slice(0, 8).map((item, index) => ({
      id: item.id,
      label: item.title.length > 18 ? `${item.title.slice(0, 17)}…` : item.title,
      ...layoutNode(index, Math.min(items.length, 8), item.id),
      type: item.category,
      attention: index === 0,
    }));
    return [repoNode, ...memoryNodes];
  }, [items]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (items.length < 2) {
    return (
      <EmptyState
        title="The graph needs more memory"
        detail="A knowledge graph becomes meaningful once several memories exist. Teach ReVise a few outcomes and this view will map how they connect."
      />
    );
  }

  const selected = nodes.find(node => node.id === selectedId) ?? nodes[1];
  const memoryFor = (id: string) => items.find(item => item.id === id);
  const selectedMemory = selected ? memoryFor(selected.id) : undefined;
  const connections = selected?.id === "repo" ? nodes.length - 1 : 1;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
      <Card className="min-h-[32rem] overflow-hidden p-0">
        <svg viewBox="0 0 100 100" className="h-[32rem] w-full" role="img" aria-label="Graph of stored engineering memories around the repository">
          {nodes.slice(1).map(node => (
            <line
              key={`edge-${node.id}`}
              className="graph-edge"
              x1={nodes[0].x} y1={nodes[0].y} x2={node.x} y2={node.y}
              stroke="var(--color-line)" strokeWidth=".4"
            />
          ))}
          {nodes.map(node => (
            <g
              key={node.id}
              className={`graph-node cursor-pointer ${node.attention ? "graph-attention" : ""}`}
              onClick={() => setSelectedId(node.id)}
              role="button"
              tabIndex={0}
              aria-label={`${node.type}: ${node.label}`}
              onKeyDown={event => (event.key === "Enter" || event.key === " ") && setSelectedId(node.id)}
            >
              <circle
                cx={node.x} cy={node.y}
                r={selected?.id === node.id ? 5 : 3.5}
                fill={node.id === "repo" ? "var(--color-brand)" : node.attention ? "var(--color-attention)" : "var(--color-brand)"}
                opacity={selected?.id === node.id ? 1 : 0.72}
              />
              <circle cx={node.x} cy={node.y} r="7" fill="transparent"/>
              <text x={node.x} y={node.y + 7} textAnchor="middle" fill="var(--color-muted)" fontSize="2.5" fontFamily="var(--font-mono)">{node.label}</text>
            </g>
          ))}
        </svg>
      </Card>
      <Card key={selected?.id} className="graph-detail">
        <Badge tone={selected?.attention ? "warning" : "brand"}>{selected?.type}</Badge>
        <Heading level={3} className="mt-4 text-base">{selected?.label}</Heading>
        {selectedMemory ? (
          <>
            <Text className="mt-3 text-sm leading-6 text-muted">{selectedMemory.content}</Text>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Card><Text className="text-xs text-muted">Confidence</Text><Text className="mt-1 font-mono text-sm text-brand">{selectedMemory.confidence}%</Text></Card>
              <Card><Text className="text-xs text-muted">Used</Text><Text className="mt-1 font-mono text-sm">{selectedMemory.usageCount}×</Text></Card>
            </div>
          </>
        ) : (
          <Text className="mt-3 text-sm leading-6 text-muted">Every stored memory connects back to this repository. Select a node to see the lesson it holds.</Text>
        )}
        <div className="mt-5 border-t border-line pt-4">
          <Text className="font-mono text-xs text-brand">{connections} connection{connections === 1 ? "" : "s"}</Text>
          {selectedMemory && <Text className="mt-1 text-xs text-muted">{selectedMemory.repository} · {selectedMemory.source}</Text>}
        </div>
      </Card>
    </div>
  );
}

export function MemoryPage() {
  const [items, setItems] = useState<Memory[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Memory | null>(null);
  const [tab, setTab] = useState("Memory Library");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [sort, setSort] = useState("Confidence");

  function load() {
    setItems(null);
    setLoadError(null);
    // Strict read: when the endpoint is down the page must say so instead of
    // quietly rendering the bundled demo bank as though it were real data.
    getMemoriesStrict()
      .then(setItems)
      .catch(err => setLoadError(err instanceof Error ? err.message : "Could not load engineering memory."));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  const filtered = useMemo(() => {
    const result = (items ?? []).filter(item => (category === "All categories" || item.category === category) && `${item.title} ${item.content}`.toLowerCase().includes(query.toLowerCase()));
    return [...result].sort((a, b) => sort === "Confidence" ? b.confidence - a.confidence : sort === "Most used" ? b.usageCount - a.usageCount : a.title.localeCompare(b.title));
  }, [items, query, category, sort]);

  return (
    <div className="animate-enter">
      <SectionHeader eyebrow="Institutional knowledge" title="Engineering Memory" action={<Badge tone="brand">{items?.length ?? 0} memories</Badge>}/>
      <Text className="-mt-2 mb-6 max-w-2xl text-sm leading-6 text-muted">ReVise remembers decisions, standards, feedback, and outcomes—then retrieves the right context during every review.</Text>
      <Tabs tabs={["Memory Library", "Memory Graph"]} active={tab} onChange={setTab}/>
      <div className="mt-6">
        {tab === "Memory Graph"
          ? (items === null
            ? <LoadingState label="Retrieving engineering memory…"/>
            : <MemoryGraph items={items}/>)
          : (
            <>
              <div className="mb-5 grid gap-3 md:grid-cols-[1fr_14rem_11rem]">
                <Input aria-label="Search memories" placeholder="Search engineering memory…" value={query} onChange={event => setQuery(event.target.value)}/>
                <Select aria-label="Filter by category" value={category} onChange={event => setCategory(event.target.value)}>
                  <option>All categories</option>
                  {["Coding Standard", "Architecture Decision", "Review Preference", "Security Rule", "Performance Rule", "Team Convention", "Historical Outcome"].map(item => <option key={item}>{item}</option>)}
                </Select>
                <Select aria-label="Sort memories" value={sort} onChange={event => setSort(event.target.value)}>
                  <option>Confidence</option><option>Most used</option><option>Title</option>
                </Select>
              </div>
              {loadError ? (
                <ErrorState title="Could not load engineering memory." detail={loadError} onRetry={load}/>
              ) : !items ? (
                <LoadingState label="Retrieving engineering memory…"/>
              ) : filtered.length ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filtered.map(item => <MemoryCard key={item.id} memory={item} onClick={() => setSelected(item)}/>)}</div>
              ) : (
                <EmptyState title="No engineering memories found yet." detail="Teach ReVise something to begin building institutional memory."/>
              )}
            </>
          )}
      </div>
      <Drawer open={Boolean(selected)} title="Memory details" onClose={() => setSelected(null)}>
        {selected && (
          <div>
            <Badge tone="brand">{selected.category}</Badge>
            <Heading level={3} className="mt-4 text-xl">{selected.title}</Heading>
            <Text className="mt-3 text-sm leading-7 text-muted">{selected.content}</Text>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Card><Text className="text-xs text-muted">Confidence</Text><Text className="mt-2 font-mono text-lg text-brand">{selected.confidence}%</Text></Card>
              <Card><Text className="text-xs text-muted">Used</Text><Text className="mt-2 font-mono text-lg">{selected.usageCount}×</Text></Card>
            </div>
            <div className="mt-6">
              <Heading level={4} className="text-sm">Reinforcement history</Heading>
              {selected.reinforcements.length === 0
                ? <Text className="mt-3 text-sm text-muted">No reinforcements have been recorded for this memory yet.</Text>
                : <div className="mt-3 space-y-2">{selected.reinforcements.map((item, index) => <Card key={index} className="flex items-center justify-between py-3"><span className="font-mono text-xs">{item}</span><Badge tone="brand">Reinforced</Badge></Card>)}</div>}
            </div>
            <Text className="mt-6 font-mono text-xs text-muted">{selected.repository} · {selected.source} · {selected.date}</Text>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export function TimelinePage() {
  const [items, setItems] = useState<TimelineEvent[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  function load() {
    setItems(null);
    setLoadError(null);
    getTimelineStrict()
      .then(setItems)
      .catch(err => setLoadError(err instanceof Error ? err.message : "Could not load engineering timeline."));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  return (
    <div className="mx-auto max-w-4xl animate-enter">
      <SectionHeader eyebrow="Engineering history" title="Memory Timeline" action={<Badge tone="brand">Live</Badge>}/>
      <Text className="-mt-2 mb-6 text-sm text-muted">A chronological record of how ReVise learns, recalls, and reinforces your team’s engineering knowledge.</Text>
      {loadError ? (
        <ErrorState title="Could not load the engineering timeline." detail={loadError} onRetry={load}/>
      ) : !items ? (
        <LoadingState label="Loading engineering timeline…"/>
      ) : items.length ? (
        <Card className="p-6">{items.map(item => <TimelineItem key={item.id} event={item}/>)}</Card>
      ) : (
        <EmptyState title="No timeline events yet" detail="Review a pull request or teach ReVise to begin building history."/>
      )}
    </div>
  );
}
