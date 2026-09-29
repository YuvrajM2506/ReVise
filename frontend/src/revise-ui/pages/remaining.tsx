import { useEffect, useState, type FormEvent } from "react";
import { Badge, Button, Card, CodeBlock, DiffViewer, EmptyState, ErrorState, FindingCard, Heading, Input, LoadingState, MemoryEvidence, RecommendationCard, RiskScore, SectionHeader, Select, Tabs, Text, Textarea, Toast, TypingIndicator } from "../components/ui";
import { getMemoriesStrict, getRunReview, getSettings, getStandardsStrict, saveSettings, sendPairMessage } from "../services/revise";
import type { EngineeringStandard, Memory, Review, SettingsSections } from "../types";

const editorCode = `import { validateSession } from "./validate"

export async function updateSession(input: SessionInput) {
  const current = await getSession(input.sessionId)
  await applySessionMutation(current, input)

  if (!validateSession(current)) {
    throw new AuthenticationError()
  }

  return current
}`;

export function PairProgrammerPage() {
  const [mobileTab, setMobileTab] = useState("Editor");
  const [message, setMessage] = useState("");
  // The greeting is real service state, not a scripted conversation: it reports
  // whether the Aider backend actually answered and what this page can do.
  const [reply, setReply] = useState("Checking the Aider service…");
  const [aiderState, setAiderState] = useState<"checking" | "connected" | "offline">("checking");
  const [memories, setMemories] = useState<Memory[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // The old "Aider connected" badge was a hardcoded constant. Ask the health
    // endpoint so the badge reflects whether the backend actually answered.
    fetch("/api/aider/health")
      .then(response => (response.ok ? response.json() : Promise.reject(new Error(`Aider service responded with HTTP ${response.status}`))))
      .then(data => { if (!cancelled) setAiderState(data.connected ? "connected" : "offline"); })
      .catch(() => { if (!cancelled) setAiderState("offline"); });
    getMemoriesStrict()
      .then(items => { if (!cancelled) setMemories(items); })
      .catch(() => { if (!cancelled) setMemories([]); });
    return () => { cancelled = true; };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setReply(await sendPairMessage(message));
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The pair assistant could not answer. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const memoryCount = memories?.length ?? 0;
  const topMemories = (memories ?? []).slice(0, 3);
  const files = <Card className="h-full p-3"><Text className="mb-3 px-2 font-mono text-[10px] uppercase tracking-wider text-muted">Files</Text>{["src/auth/session.ts", "src/api/review.ts", "src/memory/recall.ts", "src/services/github.ts", "README.md"].map((file, index) => <Button key={file} variant="ghost" className={`w-full justify-start px-2 font-mono text-xs ${index === 0 ? "bg-brand-soft text-brand" : ""}`}>{file}</Button>)}</Card>;
  const editor = <Card className="h-full min-w-0 p-0"><div className="flex items-center justify-between border-b border-line px-4 py-2"><span className="font-mono text-xs text-ink">session.ts</span><Badge>Sample</Badge></div><div className="max-h-[37rem] overflow-auto"><CodeBlock code={editorCode}/></div><Text className="border-t border-line px-4 py-3 text-xs text-muted">Sample file shown for demonstration. Connect the Aider service and run it against a real checkout to edit live code.</Text></Card>;
  const assistant = <Card className="flex h-full min-h-[36rem] flex-col p-0"><div className="border-b border-line p-4"><div className="flex items-center justify-between"><Heading level={3} className="text-sm">AI Pair Programmer</Heading>{aiderState === "checking" ? <Badge>Checking…</Badge> : aiderState === "connected" ? <Badge tone="success">Aider connected</Badge> : <Badge tone="warning">Aider offline</Badge>}</div><Text className="mt-1 text-xs text-muted">ReVise memory active · answers recall stored engineering memory</Text></div><div className="flex-1 space-y-4 overflow-y-auto p-4">{loading ? <TypingIndicator/> : <div key={reply} className="message-motion rounded-md bg-surface-raised p-3 text-sm leading-6 text-muted">{reply}</div>}{error && <Text className="text-sm text-danger">{error}</Text>}<div className="rounded-md border border-brand/25 bg-brand-soft p-3"><Text className="text-xs font-semibold text-brand">{memories === null ? "Loading engineering memories…" : `Using ${memoryCount} stored engineering memor${memoryCount === 1 ? "y" : "ies"}`}</Text>{topMemories.length > 0 && <div className="mt-2 space-y-2 font-mono text-[10px] text-muted">{topMemories.map(item => <Text key={item.id} className="memory-chip">{item.title} · {item.confidence}%</Text>)}</div>}</div><RecommendationCard title="Validate before mutation" detail="Move validateSession above applySessionMutation to match the team’s fail-closed authentication standard."/></div><form onSubmit={submit} className="border-t border-line p-3"><Textarea aria-label="Ask pair programmer" className="min-h-20" placeholder="Ask ReVise about this code…" value={message} onChange={event => setMessage(event.target.value)}/><Button className="mt-2 w-full" type="submit" disabled={loading || !message.trim()}>{loading ? "Thinking with memory…" : "Send message"}</Button></form></Card>;
  return <div className="animate-enter"><SectionHeader eyebrow="Memory-aware coding" title="AI Pair Programmer" action={memories === null ? <Badge>Checking memory…</Badge> : <Badge tone="brand">{memoryCount} memories in context</Badge>}/><div className="mb-4 lg:hidden"><Tabs tabs={["Files", "Editor", "Assistant"]} active={mobileTab} onChange={setMobileTab}/></div><div className="hidden h-[calc(100vh-10rem)] min-h-[38rem] grid-cols-[13rem_minmax(0,1fr)_22rem] gap-3 lg:grid">{files}{editor}{assistant}</div><div className="lg:hidden">{mobileTab === "Files" ? files : mobileTab === "Editor" ? editor : assistant}</div></div>;
}

export function ReportPage() {
  const [reviewId, setReviewId] = useState("");
  const [review, setReview] = useState<Review | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = decodeURIComponent((window.location.pathname.split("/report/")[1] || "").split("?")[0]);
    setReviewId(id);
    if (!id) { setError("No review id was given in the URL."); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    getRunReview(id)
      .then(result => { if (!cancelled) setReview(result); })
      .catch(err => { if (!cancelled) setError(err?.message || "Could not load this review."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <LoadingState label="Loading the stored review…"/>;
  // An unknown id used to render a plausible-looking report that never existed.
  if (!review) return <EmptyState title="Review not found" detail={`${error || "This review is not in the store."} Requested id: ${reviewId || "(none)"}. Open a report from the runs list rather than typing an id.`}/>;

  const repository = [review.pullRequest.repository.owner, review.pullRequest.repository.name].filter(Boolean).join("/");
  const generated = new Date(review.createdAt);
  const { filesChanged, linesChanged } = review.pullRequest;

  return <div className="animate-enter space-y-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><Badge tone="brand">Review report</Badge><Heading level={1} className="mt-3 text-3xl">{review.pullRequest.title}</Heading><Text className="mt-2 text-sm text-muted">{repository || "local"} · {Number.isNaN(generated.getTime()) ? review.createdAt : generated.toLocaleString()} · run {review.id}</Text></div><RiskScore risk={review.risk}/></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Card><Text className="text-xs text-muted">Overall risk</Text><Text className="mt-2 font-mono text-xl">{review.risk.score} / 100</Text></Card><Card><Text className="text-xs text-muted">Findings</Text><Text className="mt-2 font-mono text-xl">{review.findings.length}</Text></Card><Card><Text className="text-xs text-muted">Memory matches</Text><Text className="mt-2 font-mono text-xl text-brand">{review.memories.length}</Text></Card><Card><Text className="text-xs text-muted">Reviewed</Text><Text className="mt-2 font-mono text-xl">{filesChanged} {filesChanged === 1 ? "file" : "files"} · {linesChanged} {linesChanged === 1 ? "line" : "lines"}</Text></Card></div>
    {review.memoryEnabled === false && <Card className="border-attention/30"><Text className="text-sm text-muted">This review ran with memory <strong className="text-attention">off</strong>, so its findings carry no historical evidence.</Text></Card>}
    <Card><SectionHeader eyebrow="Review summary" title="Assessment"/><Text className="max-w-4xl text-sm leading-7 text-muted">{review.summary}</Text>{review.provenanceNote && <Text className="mt-3 font-mono text-xs text-attention">{review.provenanceNote}</Text>}</Card>
    <section><SectionHeader title="Findings"/>{review.findings.length === 0 ? <Text className="text-sm text-muted">The model reported no findings for this change.</Text> : <div className="grid gap-3">{review.findings.map(item => <FindingCard key={item.id} finding={item}/>)}</div>}</section>
    <section><SectionHeader title="Memory Evidence"/>{review.memories.length === 0 ? <Text className="text-sm text-muted">No memory was cited for this review.</Text> : <div className="grid gap-3 md:grid-cols-2">{review.memories.map(item => <MemoryEvidence key={item.id} evidence={item}/>)}</div>}</section>
    {(review.saferRollout?.length || review.ciChecks?.length) ? <div className="grid gap-6 lg:grid-cols-2"><div><SectionHeader title="Safer rollout"/>{(review.saferRollout?.length ?? 0) > 0 ? <div className="space-y-2">{review.saferRollout!.map((step, index) => <div key={index} className="flex gap-3 text-sm leading-6 text-muted"><span className="font-mono text-brand">{index + 1}.</span><span>{step.replace(/^\d+\.\s*/, "")}</span></div>)}</div> : <Text className="text-sm text-muted">No rollout steps were proposed.</Text>}</div><div><SectionHeader title="CI guardrails"/>{(review.ciChecks?.length ?? 0) > 0 ? <div className="space-y-3">{review.ciChecks!.map(check => <Card key={check.id}><Badge>{check.type}</Badge><Heading level={3} className="mt-3 text-sm">{check.title}</Heading><Text className="mt-2 text-sm leading-6 text-muted">{check.description}</Text>{check.snippet && <div className="mt-3"><CodeBlock code={check.snippet}/></div>}</Card>)}</div> : <Text className="text-sm text-muted">No automated guardrail was proposed.</Text>}</div></div> : null}
    {review.whyRecommendation && <Card><SectionHeader eyebrow="Reasoning" title="Why this recommendation"/><Text className="max-w-4xl text-sm leading-7 text-muted">{review.whyRecommendation}</Text></Card>}
  </div>;
}

export function StandardsPage() {
  const [standards, setStandards] = useState<EngineeringStandard[] | null>(null);
  const [group, setGroup] = useState("All");
  const [error, setError] = useState<string | null>(null);

  function load() {
    setStandards(null);
    setError(null);
    // Strict read with a real error state: a dead endpoint must not quietly
    // swap in the demo standard cards as though they were active policy.
    getStandardsStrict()
      .then(setStandards)
      .catch(err => setError(err instanceof Error ? err.message : "Could not load engineering standards."));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  const groups = ["All", "Engineering", "Security", "Performance", "Architecture", "Team Preferences"];
  const shown = (standards ?? []).filter(item => group === "All" || item.category === group);
  return <div className="animate-enter"><SectionHeader eyebrow="Review policy" title="Engineering Standards" action={<Badge tone="brand">{standards?.length ?? 0} active</Badge>}/><Text className="-mt-2 mb-6 max-w-2xl text-sm leading-6 text-muted">Durable rules ReVise recalls during code review. Confidence grows when feedback and outcomes reinforce a standard.</Text><Tabs tabs={groups} active={group} onChange={setGroup}/><div className="mt-6">{error ? <ErrorState title="Could not load engineering standards." detail={error} onRetry={load}/> : !standards ? <LoadingState label="Retrieving standards…"/> : shown.length === 0 ? <EmptyState title="No standards in this group yet" detail="Standards are inferred from stored review outcomes. Run reviews or teach ReVise to grow this policy set."/> : <div className="grid gap-3 lg:grid-cols-2">{shown.map(item => <Card key={item.id}><div className="flex items-start justify-between gap-3"><div><Badge>{item.category}</Badge><Heading level={3} className="mt-3 text-base">{item.title}</Heading></div><span className="font-mono text-sm text-brand">{item.confidence}%</span></div><Text className="mt-2 text-sm leading-6 text-muted">{item.description}</Text><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-3 font-mono text-[10px] uppercase text-muted"><span>Used {item.usageCount} times</span><span>{item.source}</span><span>Reinforced {item.lastReinforced}</span></div></Card>)}</div>}</div></div>;
}

const settingTabs = ["General", "Repository", "AI Model", "Memory", "Integrations", "Review Preferences", "Notifications", "Appearance"];
export function SettingsPage() {
  const [tab, setTab] = useState("General");
  const [settings, setSettings] = useState<SettingsSections>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSettings()
      .then(stored => { if (!cancelled) setSettings(stored); })
      .catch(() => { if (!cancelled) setStatus({ ok: false, message: "Could not load saved settings." }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Whatever is genuinely stored for this tab, so the form shows real values
  // instead of defaults that look saved but were never sent anywhere.
  const stored = settings[tab] || {};
  const modelOptions = ["ReVise Review Large", "ReVise Review Fast"];
  const behaviorOptions = tab === "Memory"
    ? ["80% confidence", "90% confidence"]
    : ["Memory-informed review", "Strict standards review"];
  const nameDefault = stored.primary || (tab === "Repository" ? "YuvrajM2506/ReVise" : "ReVise Engineering");
  const modelDefault = modelOptions.includes(stored.model || "") ? stored.model! : modelOptions[0];
  const behaviorDefault = behaviorOptions.includes(stored.behavior || "") ? stored.behavior! : behaviorOptions[0];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values: Record<string, string> = {};
    new FormData(event.currentTarget).forEach((value, key) => { values[String(key)] = String(value); });
    setSaving(true);
    setStatus(null);
    try {
      await saveSettings(tab, values);
      setSettings(previous => ({ ...previous, [tab]: { ...(previous[tab] || {}), ...values } }));
      setStatus({ ok: true, message: `${tab} settings saved.` });
    } catch (error: unknown) {
      // Report the server's reason rather than claiming the save worked.
      setStatus({ ok: false, message: error instanceof Error ? error.message : "Could not save settings." });
    } finally {
      setSaving(false);
    }
  }
  return <div className="animate-enter"><SectionHeader eyebrow="Workspace configuration" title="Settings"/><div className="grid gap-5 lg:grid-cols-[14rem_1fr]"><Card className="h-fit p-2">{settingTabs.map(item => <Button key={item} variant="ghost" onClick={() => setTab(item)} className={`w-full justify-start ${tab === item ? "bg-brand-soft text-brand" : ""}`}>{item}</Button>)}</Card><Card className="max-w-3xl p-5"><Heading level={2} className="text-lg">{tab}</Heading><Text className="mt-1 text-sm text-muted">{loading ? "Loading saved preferences…" : `Configure ${tab.toLowerCase()} preferences for this ReVise workspace.`}</Text><form key={`${tab}:${loading ? "loading" : "ready"}:${JSON.stringify(stored)}`} onSubmit={submit} className="mt-6 space-y-5"><div><Text as="label" className="mb-2 block text-sm font-medium">{tab === "Repository" ? "Default repository" : tab === "AI Model" ? "Review model" : "Workspace name"}</Text>{tab === "AI Model" ? <Select name="model" defaultValue={modelDefault}>{modelOptions.map(option => <option key={option}>{option}</option>)}</Select> : <Input name="primary" defaultValue={nameDefault}/>}</div><div><Text as="label" className="mb-2 block text-sm font-medium">{tab === "Memory" ? "Minimum recall confidence" : "Default review behavior"}</Text><Select name="behavior" defaultValue={behaviorDefault}>{behaviorOptions.map(option => <option key={option}>{option}</option>)}</Select></div><div><Text as="label" className="mb-2 block text-sm font-medium">Notes</Text><Textarea name="notes" defaultValue={stored.notes || ""} placeholder={`Add ${tab.toLowerCase()} guidance for ReVise…`}/></div><div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>{status && !status.ok && <Text className="text-sm text-danger">{status.message}</Text>}</div></form></Card></div><Toast message={status?.ok ? status.message : undefined}/></div>;
}
