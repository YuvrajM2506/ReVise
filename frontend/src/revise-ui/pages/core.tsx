import { useEffect, useState, type FormEvent } from "react";
import { navigate } from "../components/Shell";
import { Badge, Button, Card, CodeBlock, EmptyState, EngineeringSignal, ErrorState, FindingCard, Heading, Input, LoadingState, MemoryCard, MemoryEvidence, MetricCard, PullRequestBadge, RecommendationCard, RepositoryBadge, RiskScore, SectionHeader, Select, StatusBadge, Tabs, Text, Textarea, TimelineItem, Toast } from "../components/ui";
import {
  analyzeCode,
  analyzePullRequest,
  getMemoriesStrict,
  getPulse,
  getStoredReviews,
  getTimelineStrict,
  teachMemory,
  type PulseSummary,
} from "../services/revise";
import type { Memory, Review, TimelineEvent } from "../types";

/** Relative age of a stored timestamp, used in run lists. */
function relativeTime(iso: string): string {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return iso;
  const minutes = Math.floor((Date.now() - then) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

export function HomePage() {
  const [pulse, setPulse] = useState<PulseSummary | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [storedMemories, setStoredMemories] = useState<Memory[]>([]);
  const [activity, setActivity] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Every panel reports what the API actually returned. These read strictly, so
    // an unreachable endpoint shows as empty rather than silently rendering the
    // bundled demo dataset as though it were this workspace's data.
    Promise.allSettled([getPulse(), getStoredReviews(), getMemoriesStrict(), getTimelineStrict()])
      .then(([pulseResult, reviewResult, memoryResult, activityResult]) => {
        if (cancelled) return;
        if (pulseResult.status === "fulfilled") setPulse(pulseResult.value);
        if (reviewResult.status === "fulfilled") setReviews(reviewResult.value);
        if (memoryResult.status === "fulfilled") setStoredMemories(memoryResult.value);
        if (activityResult.status === "fulfilled") setActivity(activityResult.value);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const newest = reviews[0];
  const highRiskCount = reviews.filter(item => item.risk.score >= 70).length;
  const averageRisk = reviews.length > 0
    ? Math.round(reviews.reduce((total, item) => total + item.risk.score, 0) / reviews.length)
    : null;
  const findingsRaised = reviews.reduce((total, item) => total + item.findings.length, 0);
  const pullRequestCount = reviews.filter(item => item.pullRequest.number > 0).length;
  const mostReused = [...storedMemories].sort((a, b) => b.usageCount - a.usageCount).slice(0, 3);

  return <div className="space-y-10 animate-enter">
    <section className="grid min-h-[24rem] items-center gap-8 border-b border-line py-8 lg:grid-cols-[1.4fr_0.6fr]">
      <div className="max-w-4xl"><Badge tone="brand">Persistent engineering memory</Badge><Heading level={1} className="hero-neo mt-5 text-4xl leading-[1.08] md:text-6xl"><span className="text-attention">Memory</span> is not a feature bolted onto an LLM wrapper — <span className="text-brand">it is the product.</span></Heading><Text className="subheading-neo mt-6 max-w-2xl text-base leading-7 text-secondary md:text-lg">ReVise reviews code using the engineering knowledge your team has accumulated over time.</Text><div className="mt-7 flex flex-wrap gap-3"><Button onClick={() => navigate("/github-review")}>Analyze Pull Request →</Button><Button variant="secondary" onClick={() => navigate("/pair-programmer")}>Launch AI Pair Programmer</Button><Button variant="ghost" onClick={() => navigate("/memory")}>Explore Engineering Memory</Button></div></div>
      <Card className="grid-texture p-5"><Text className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand">Most reused memory</Text>{loading ? <Text className="mt-4 text-sm text-muted">Loading memory…</Text> : mostReused.length === 0 ? <Text className="mt-4 text-sm text-muted">No memory is stored yet. Teach ReVise an outcome to start the bank.</Text> : <div className="mt-4 space-y-3">{mostReused.map(item => <div key={item.id} className="rounded-md border border-line bg-surface/60 p-3"><div className="flex items-center justify-between gap-2"><Badge>{item.category}</Badge><span className="font-mono text-xs text-brand">{item.confidence}%</span></div><Text className="mt-2 text-sm text-ink">{item.title}</Text><Text className="mt-1 font-mono text-[10px] uppercase text-muted">Used {item.usageCount}× · {item.repository}</Text></div>)}</div>}</Card>
    </section>
    <section><SectionHeader eyebrow="System status" title="ReVise is remembering"/><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Memory status" value={pulse ? (pulse.hindsight_connected ? "Connected" : "Local only") : "Unavailable"} detail={pulse ? `${pulse.total_memories} memories indexed` : "The pulse endpoint did not answer"}/><MetricCard label="Reviews stored" value={String(reviews.length)} detail={newest ? `Last run ${relativeTime(newest.createdAt)}` : "No runs recorded yet"}/><MetricCard label="Recurring risk themes" value={pulse ? String(pulse.repeated_risks_count) : "—"} detail="Focus areas seen in more than one memory"/><MetricCard label="Guardrails in force" value={pulse ? String(pulse.remediation_patterns_count) : "—"} detail="Remediation patterns the team can reuse"/></div></section>
    <div className="grid gap-6 xl:grid-cols-2">
      <section><SectionHeader eyebrow="Review history" title="Recent Reviews" action={<Button variant="ghost" disabled={!newest} onClick={() => { if (newest) navigate(`/report/${newest.id}`); }}>View report</Button>}/>{loading ? <Card><Text className="text-sm text-muted">Loading reviews…</Text></Card> : reviews.length === 0 ? <EmptyState title="No reviews yet" detail="Analyze a pull request or paste a snippet and the stored result will appear here."/> : <div className="space-y-3">{reviews.slice(0, 2).map(review => <Card key={review.id}><div className="flex flex-wrap items-center gap-2"><RepositoryBadge name={[review.pullRequest.repository.owner, review.pullRequest.repository.name].filter(Boolean).join("/") || "local"}/>{review.pullRequest.number > 0 && <PullRequestBadge number={review.pullRequest.number}/>}<StatusBadge status={review.status}/></div><Heading level={3} className="mt-4 text-base">{review.pullRequest.title}</Heading><Text className="mt-2 text-sm text-muted">{review.findings.length} findings · {review.memories.length} memory matches · {relativeTime(review.createdAt)}</Text><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><RiskScore risk={review.risk}/><Button variant="ghost" onClick={() => navigate(`/report/${review.id}`)}>Open report</Button></div></Card>)}</div>}</section>
      <section><SectionHeader eyebrow="Institutional knowledge" title="Memory Activity"/>{loading ? <Card><Text className="text-sm text-muted">Loading activity…</Text></Card> : activity.length === 0 ? <EmptyState title="No timeline activity" detail="Timeline nodes appear as outcomes are recorded against changes."/> : <Card>{activity.slice(0, 2).map(item => <TimelineItem key={item.id} event={item}/>)}</Card>}</section>
      <section><SectionHeader eyebrow="Stored evidence" title="Engineering Signals"/>{reviews.length === 0 ? <EmptyState title="Nothing measured yet" detail="These aggregates are computed from stored reviews, so run a review to populate them."/> : <Card><EngineeringSignal label="High-risk reviews" value={String(highRiskCount)} trend={`${reviews.length} review${reviews.length === 1 ? "" : "s"} stored`}/><EngineeringSignal label="Average risk score" value={averageRisk === null ? "—" : String(averageRisk)} trend="Mean across every stored review"/><EngineeringSignal label="Findings raised" value={String(findingsRaised)} trend="Total findings across stored reviews"/></Card>}</section>
      <section><SectionHeader eyebrow="Current posture" title="Review Risk"/>{newest ? <Card><RiskScore risk={newest.risk}/><Text className="mt-4 text-sm leading-6 text-muted">{newest.summary}</Text></Card> : <EmptyState title="No risk score available" detail="Risk posture is reported from the most recent stored review."/>}</section>
    </div>
    <section><SectionHeader eyebrow="Repository" title="Repository Activity"/><div className="grid gap-3 md:grid-cols-3"><MetricCard label="Pull requests reviewed" value={String(pullRequestCount)} detail="Stored reviews that came from a GitHub PR"/><MetricCard label="Memories stored" value={String(pulse?.total_memories ?? 0)} detail="Entries in the local memory bank"/><MetricCard label="Timeline events" value={String(activity.length)} detail="Causal nodes recorded so far"/></div></section>
  </div>;
}

function ReviewResults({ review }: { review: Review }) {
  const [tab, setTab] = useState("Summary");
  // The workspace timeline is loaded for the Timeline tab. Runs carry no
  // timeline rows of their own, so this shows the bank's real activity with an
  // honest caption instead of inventing events scoped to this review.
  const [timeline, setTimeline] = useState<TimelineEvent[] | null>(null);
  useEffect(() => {
    if (tab !== "Timeline" || timeline !== null) return;
    let cancelled = false;
    getTimelineStrict().then(events => { if (!cancelled) setTimeline(events); }).catch(() => { if (!cancelled) setTimeline([]); });
    return () => { cancelled = true; };
  }, [tab, timeline]);

  const severityCounts = review.findings.reduce<Record<string, number>>((counts, item) => {
    counts[item.severity] = (counts[item.severity] || 0) + 1;
    return counts;
  }, {});
  const severitySummary = Object.entries(severityCounts).map(([severity, count]) => `${count} ${severity.toLowerCase()}`).join(" · ") || "none";
  // Files flagged by findings — derived from the review, not a fixed list.
  const flaggedFiles = Array.from(new Set(review.findings.map(item => item.file)));
  return <div className="mt-8 space-y-8 animate-enter">
    <Card className="p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><div className="flex flex-wrap gap-2"><RepositoryBadge name={`${review.pullRequest.repository.owner}/${review.pullRequest.repository.name}`}/><PullRequestBadge number={review.pullRequest.number}/><StatusBadge status={review.status}/></div><Heading level={2} className="mt-3 text-xl">{review.pullRequest.title}</Heading><Text className="mt-1 text-sm text-muted">by {review.pullRequest.author.handle} · {review.pullRequest.filesChanged} {review.pullRequest.filesChanged === 1 ? "file" : "files"} · {review.pullRequest.linesChanged} {review.pullRequest.linesChanged === 1 ? "line" : "lines"} changed</Text></div><RiskScore risk={review.risk}/></div></Card>
    <Tabs tabs={["Summary", "Findings", "Memory Evidence", "Changed Files", "Timeline"]} active={tab} onChange={setTab}/>
    {tab === "Summary" && <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]"><div className="space-y-6"><Card><SectionHeader eyebrow="Review summary" title="Memory-informed assessment"/><Text className="text-sm leading-7 text-muted">{review.summary}</Text>{review.whyRecommendation && <Text className="mt-3 border-t border-line pt-3 text-sm leading-6 text-muted"><span className="text-ink">Why this recommendation:</span> {review.whyRecommendation}</Text>}</Card><div><SectionHeader title="Critical Findings"/><div className="space-y-3">{review.findings.map(item => <FindingCard key={item.id} finding={item}/>)}</div></div></div><div className="space-y-4"><Card><SectionHeader title="Risk Assessment"/><RiskScore risk={review.risk}/><Text className="mt-4 text-sm leading-6 text-muted">{review.findings.length === 0 ? "No findings were reported for this change." : `${review.findings.length} finding${review.findings.length === 1 ? "" : "s"} raised: ${severitySummary}.`}</Text></Card>{review.saferRollout && review.saferRollout.length > 0 && <Card><SectionHeader title="Safer rollout"/><div className="space-y-2">{review.saferRollout.map((step, index) => <div key={index} className="flex gap-3 text-sm leading-6 text-muted"><span className="font-mono text-brand">{index + 1}.</span><span>{step.replace(/^\d+\.\s*/, "")}</span></div>)}</div></Card>}{review.ciChecks && review.ciChecks.length > 0 && <Card><SectionHeader title="CI guardrails"/><div className="space-y-3">{review.ciChecks.map(check => <div key={check.id}><Badge>{check.type}</Badge><Text className="mt-2 text-sm text-ink">{check.title}</Text></div>)}</div></Card>}<Card><SectionHeader title="Run Details"/><EngineeringSignal label="Memory matches" value={String(review.memories.length)} trend="Retrieved from the engineering memory bank"/><EngineeringSignal label="Findings" value={String(review.findings.length)} trend={severitySummary}/>{review.service && <EngineeringSignal label="Service" value={review.service} trend="Service scope of this run"/>}{review.language && <EngineeringSignal label="Language" value={review.language} trend="Detected language of the change"/>}</Card></div></div>}
    {tab === "Findings" && (review.findings.length === 0 ? <EmptyState title="No findings" detail="The review reported no findings for this change."/> : <div className="space-y-3">{review.findings.map(item => <FindingCard key={item.id} finding={item}/>)}</div>)}
    {tab === "Memory Evidence" && (review.memories.length === 0 ? <EmptyState title="No memory evidence" detail={review.memoryEnabled === false ? "This review ran with memory off, so no historical evidence was retrieved." : "No stored memory was relevant to this change."}/> : <div className="grid gap-3 md:grid-cols-2">{review.memories.map(item => <MemoryEvidence key={item.id} evidence={item}/>)}</div>)}
    {tab === "Changed Files" && (flaggedFiles.length === 0 ? <EmptyState title="No per-file findings" detail="The review did not attribute any finding to a specific file, so there is nothing to list here."/> : <div className="grid gap-3">{flaggedFiles.map(file => { const fileFindings = review.findings.filter(item => item.file === file); return <Card key={file} className="flex items-center justify-between"><span className="font-mono text-sm">{file}</span><span className="font-mono text-xs text-brand">{fileFindings.length} finding{fileFindings.length === 1 ? "" : "s"}</span></Card>; })}</div>)}
    {tab === "Timeline" && (timeline === null ? <LoadingState label="Loading timeline…"/> : timeline.length === 0 ? <EmptyState title="No timeline activity" detail="No events have been recorded in the workspace timeline yet."/> : <Card><Text className="mb-4 text-xs text-muted">Latest events in the workspace timeline. Per-run provenance is recorded on each report.</Text>{timeline.slice(0, 5).map(item => <TimelineItem key={item.id} event={item}/>)}</Card>)}
  </div>;
}

const isGitHubPrUrl = (url: string) => /^(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s/]+\/[^\s/]+\/pull\/\d+/i.test(url.trim());

export function ReviewPage({ mode }: { mode: "github" | "code" }) {
  const [reference, setReference] = useState(mode === "github" ? "YuvrajM2506/ReVise · PR 12" : "export async function updateSession(input) {\n  await mutate(input)\n  return validateSession()\n}");
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPr = mode === "github" || isGitHubPrUrl(reference);

  async function runAnalysis() {
    setLoading(true);
    setReview(null);
    setError(null);
    try {
      const result = isPr ? await analyzePullRequest(reference) : await analyzeCode(reference);
      setReview(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to analyze this request. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await runAnalysis();
  }

  return (
    <div className="animate-enter">
      <SectionHeader eyebrow={mode === "github" ? "Repository integration" : "Code analysis"} title={mode === "github" ? "Analyze Pull Request" : "Analyze code with memory"}/>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Text as="label" className="block text-sm font-medium text-ink">{mode === "github" ? "Repository or pull request reference" : "Code or diff"}</Text>
          {mode === "github" ? <Input aria-label="Pull request reference" value={reference} onChange={event => setReference(event.target.value)}/> : <Textarea aria-label="Code to analyze" className="min-h-44 font-mono" value={reference} onChange={event => setReference(event.target.value)}/>}
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <Text className="text-xs text-muted">ReVise will retrieve relevant engineering memory before review.</Text>
            <Button className="w-full sm:w-auto" type="submit" disabled={loading || !reference}>
              {loading ? "Analyzing…" : isPr ? "Analyze Pull Request" : "Analyze Code"}
            </Button>
          </div>
        </form>
      </Card>
      {loading && <div className="mt-6"><LoadingState label={isPr ? "Analyzing Pull Request… Retrieving engineering memory… Reviewing changed files…" : "Analyzing code… Retrieving engineering memory… Reviewing the snippet…"}/></div>}
      {error && <div className="mt-6"><ErrorState title={isPr ? "Unable to analyze this pull request." : "Unable to analyze this code."} detail={error} onRetry={runAnalysis}/></div>}
      {review && <ReviewResults review={review}/>}
    </div>
  );
}

export function TeachPage() {
  const [learned, setLearned] = useState<Memory | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    try {
      // Surface the server's reason on failure instead of flipping to a success
      // badge regardless of what happened to the request.
      const result = await teachMemory({ title: String(data.get("remember")), content: String(data.get("why")), category: String(data.get("category")) as Memory["category"], confidence: Number(data.get("confidence")) });
      setLearned(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not teach ReVise. Try again.");
    } finally {
      setSaving(false);
    }
  }
  return <div className="mx-auto max-w-3xl animate-enter"><SectionHeader eyebrow="Teach ReVise" title="Turn experience into engineering memory"/><Text className="-mt-2 mb-6 text-sm text-muted">Capture the context behind a decision so future reviews remember why it mattered.</Text><Card className="p-5"><form onSubmit={submit} className="space-y-5">{[["What happened?", "happened", "Describe the change, incident, or review outcome."], ["Why?", "why", "Explain why the outcome mattered."], ["What should ReVise remember?", "remember", "Write a concise rule or durable lesson."]].map(([label, name, placeholder]) => <div key={name}><Text as="label" className="mb-2 block text-sm font-medium">{label}</Text><Textarea name={name} required placeholder={placeholder}/></div>)}<div className="grid gap-4 sm:grid-cols-2"><div><Text as="label" className="mb-2 block text-sm font-medium">Category</Text><Select name="category">{["Coding Standard", "Architecture Decision", "Review Preference", "Security Rule", "Performance Rule", "Team Convention"].map(item => <option key={item}>{item}</option>)}</Select></div><div><Text as="label" className="mb-2 block text-sm font-medium">Confidence</Text><Input name="confidence" type="number" min="1" max="100" defaultValue="90"/></div></div><Button type="submit" disabled={saving}>{saving ? "Teaching…" : "Teach ReVise"}</Button></form></Card>{error && <div className="mt-6"><ErrorState title="Could not teach ReVise." detail={error}/></div>}{learned && <div className="mt-6"><Badge tone="brand">ReVise learned this.</Badge><div className="mt-3"><MemoryCard memory={learned}/></div></div>}<Toast message={learned && !error ? "Memory saved and available to future reviews." : undefined}/></div>;
}
