import { useState, type FormEvent } from "react";
import { navigate } from "../components/Shell";
import { Badge, Button, Card, CodeBlock, EngineeringSignal, ErrorState, FindingCard, Heading, Input, LoadingState, MemoryCard, MemoryEvidence, MetricCard, PullRequestBadge, RecommendationCard, RepositoryBadge, RiskScore, SectionHeader, Select, StatusBadge, Tabs, Text, Textarea, TimelineItem, Toast } from "../components/ui";
import { demoReview, memories, timeline } from "../mocks/data";
import { analyzeCode, analyzePullRequest, teachMemory } from "../services/revise";
import type { Memory, Review } from "../types";

export function HomePage() {
  return <div className="space-y-10 animate-enter">
    <section className="grid min-h-[24rem] items-center gap-8 border-b border-line py-8 lg:grid-cols-[1.4fr_0.6fr]">
      <div className="max-w-4xl"><Badge tone="brand">Persistent engineering memory</Badge><Heading level={1} className="hero-neo mt-5 text-4xl leading-[1.08] md:text-6xl"><span className="text-attention">Memory</span> is not a feature bolted onto an LLM wrapper — <span className="text-brand">it is the product.</span></Heading><Text className="subheading-neo mt-6 max-w-2xl text-base leading-7 text-secondary md:text-lg">ReVise reviews code using the engineering knowledge your team has accumulated over time.</Text><div className="mt-7 flex flex-wrap gap-3"><Button onClick={() => navigate("/github-review")}>Analyze Pull Request →</Button><Button variant="secondary" onClick={() => navigate("/pair-programmer")}>Launch AI Pair Programmer</Button><Button variant="ghost" onClick={() => navigate("/memory")}>Explore Engineering Memory</Button></div></div>
      <Card className="grid-texture p-5"><Text className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand">Live memory retrieval</Text><div className="mt-5 space-y-3">{demoReview.memories.slice(0, 3).map(item => <MemoryEvidence key={item.id} evidence={item}/>)}</div></Card>
    </section>
    <section><SectionHeader eyebrow="System status" title="ReVise is remembering"/><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Memory Status" value="Connected" detail="847 indexed memories"/><MetricCard label="Review Engine" value="Active" detail="Last run 18m ago"/><MetricCard label="Engineering Memory" value="Learning" detail="+12 this week"/><MetricCard label="Repository" value="ReVise" detail="main · synchronized"/></div></section>
    <div className="grid gap-6 xl:grid-cols-2">
      <section><SectionHeader eyebrow="Review history" title="Recent Reviews" action={<Button variant="ghost" onClick={() => navigate("/report/42")}>View report</Button>}/><Card><div className="flex flex-wrap items-center gap-2"><RepositoryBadge name="YuvrajM2506/ReVise"/><PullRequestBadge number={42}/><StatusBadge status="Complete"/></div><Heading level={3} className="mt-4 text-base">{demoReview.pullRequest.title}</Heading><Text className="mt-2 text-sm text-muted">3 findings · 4 memory matches · Today, 09:42</Text><div className="mt-4"><RiskScore risk={demoReview.risk}/></div></Card></section>
      <section><SectionHeader eyebrow="Institutional knowledge" title="Memory Activity"/><Card>{timeline.slice(0, 2).map(item => <TimelineItem key={item.id} event={item}/>)}</Card></section>
      <section><SectionHeader eyebrow="Team trajectory" title="Engineering Signals"/><Card><EngineeringSignal label="Memory reuse" value="+18%" trend="24 memories informed reviews this week"/><EngineeringSignal label="Repeat findings" value="-12%" trend="Previously flagged issues are declining"/><EngineeringSignal label="Standards adoption" value="92%" trend="Accepted recommendations"/></Card></section>
      <section><SectionHeader eyebrow="Current posture" title="Review Risk"/><Card><RiskScore risk={demoReview.risk}/><Text className="mt-4 text-sm leading-6 text-muted">Risk remains low. Authentication ordering is the only merge-blocking concern identified from prior team decisions.</Text></Card></section>
    </div>
    <section><SectionHeader eyebrow="Repository" title="Repository Activity"/><div className="grid gap-3 md:grid-cols-3"><MetricCard label="Pull requests reviewed" value="18" detail="Last 30 days"/><MetricCard label="Findings accepted" value="86%" detail="+4.2% from prior period"/><MetricCard label="Memories reinforced" value="31" detail="Across 7 contributors"/></div></section>
  </div>;
}

function ReviewResults({ review }: { review: Review }) {
  const [tab, setTab] = useState("Summary");
  const rolloutDetail = review.saferRollout && review.saferRollout.length > 0 ? review.saferRollout.join(" ") : "Review findings and verify changes in testing before merging.";
  const riskDetail = review.whyRecommendation || (review.risk.level === "High" ? "High risk assessment grounded in technical findings." : review.risk.level === "Medium" ? "Moderate risk assessment. Review findings before merge." : "Low overall risk. Changes align with repository standards and best practices.");
  const filesToRender = review.changedFiles && review.changedFiles.length > 0 ? review.changedFiles : [{ filename: "src/auth/session.ts", additions: 34, deletions: 8 }, { filename: "src/api/review.ts", additions: 43, deletions: 9 }, { filename: "src/memory/recall.ts", additions: 52, deletions: 10 }];

  return <div className="mt-8 space-y-8 animate-enter">
    <Card className="p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><div className="flex flex-wrap gap-2"><RepositoryBadge name={`${review.pullRequest.repository.owner}/${review.pullRequest.repository.name}`}/><PullRequestBadge number={review.pullRequest.number}/><StatusBadge status={review.status}/></div><Heading level={2} className="mt-3 text-xl">{review.pullRequest.title}</Heading><Text className="mt-1 text-sm text-muted">by {review.pullRequest.author.handle} · {review.pullRequest.filesChanged} files · {review.pullRequest.linesChanged} lines changed</Text></div><RiskScore risk={review.risk}/></div></Card>
    <Tabs tabs={["Summary", "Findings", "Memory Evidence", "Changed Files", "Timeline"]} active={tab} onChange={setTab}/>
    {tab === "Summary" && <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]"><div className="space-y-6"><Card><SectionHeader eyebrow="Review summary" title="Memory-informed assessment"/><Text className="text-sm leading-7 text-muted">{review.summary}</Text></Card><div><SectionHeader title="Critical Findings"/><div className="space-y-3">{review.findings.map(item => <FindingCard key={item.id} finding={item}/>)}</div></div></div><div className="space-y-4"><Card><SectionHeader title="Risk Assessment"/><RiskScore risk={review.risk}/><Text className="mt-4 text-sm leading-6 text-muted">{riskDetail}</Text></Card><RecommendationCard title="Safer rollout" detail={rolloutDetail}/><Card><SectionHeader title="Engineering Metrics"/><EngineeringSignal label="Memory matches" value={String(review.memories.length)} trend={review.totalRetrievedMemories !== undefined ? `${review.memories.length} of ${review.totalRetrievedMemories} recalled memories relevant` : "Across standards and outcomes"}/><EngineeringSignal label="Findings" value={String(review.findings.length)} trend={`${review.findings.filter(f => f.severity === "High" || f.severity === "Critical").length} high · ${review.findings.filter(f => f.severity === "Medium").length} medium · ${review.findings.filter(f => f.severity === "Low").length} low`}/><EngineeringSignal label="Confidence" value={`${Math.max(85, Math.min(98, 100 - Math.round(review.risk.score / 5)))}%`} trend="Review evidence strength"/></Card></div></div>}
    {tab === "Findings" && <div className="space-y-3">{review.findings.length > 0 ? review.findings.map(item => <FindingCard key={item.id} finding={item}/>) : <Card className="p-4"><Text className="text-sm text-muted">No blocking findings identified for this change.</Text></Card>}</div>}
    {tab === "Memory Evidence" && <div className="grid gap-3 md:grid-cols-2">{review.memories.length > 0 ? review.memories.map(item => <MemoryEvidence key={item.id} evidence={item}/>) : <Card className="p-4 md:col-span-2"><Text className="text-sm text-muted">Hindsight was consulted{review.totalRetrievedMemories ? ` (${review.totalRetrievedMemories} memories evaluated)` : ""}, but no past incidents or failure patterns matched the files in this change.</Text></Card>}</div>}
    {tab === "Changed Files" && <div className="grid gap-3">{filesToRender.map(file => <Card key={file.filename} className="flex items-center justify-between"><span className="font-mono text-sm">{file.filename}</span><span className="font-mono text-xs text-brand">+{file.additions} −{file.deletions}</span></Card>)}</div>}
    {tab === "Timeline" && <Card>{timeline.map(item => <TimelineItem key={item.id} event={item}/>)}</Card>}
  </div>;
}

const isGitHubPrUrl = (url: string) => /^(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s/]+\/[^\s/]+\/pull\/\d+/i.test(url.trim());

export function ReviewPage({ mode }: { mode: "github" | "code" }) {
  const [reference, setReference] = useState(mode === "github" ? "YuvrajM2506/ReVise · PR 12" : "export async function updateSession(input) {\n  await mutate(input)\n  return validateSession()\n}");
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const isPr = mode === "github" || isGitHubPrUrl(reference);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setReview(null);
    setError(false);
    try {
      const result = isPr ? await analyzePullRequest(reference) : await analyzeCode(reference);
      setReview(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
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
      {loading && <div className="mt-6"><LoadingState label="Analyzing Pull Request… Retrieving engineering memory… Reviewing changed files…"/></div>}
      {error && <div className="mt-6"><ErrorState title="Unable to analyze this pull request. Try again."/></div>}
      {review && <ReviewResults review={review}/>}
    </div>
  );
}

export function TeachPage() {
  const [learned, setLearned] = useState<Memory | null>(null);
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); setSaving(true); const result = await teachMemory({ title: String(data.get("remember")), content: String(data.get("why")), category: String(data.get("category")) as Memory["category"], confidence: Number(data.get("confidence")) }); setLearned(result); setSaving(false); }
  return <div className="mx-auto max-w-3xl animate-enter"><SectionHeader eyebrow="Teach ReVise" title="Turn experience into engineering memory"/><Text className="-mt-2 mb-6 text-sm text-muted">Capture the context behind a decision so future reviews remember why it mattered.</Text><Card className="p-5"><form onSubmit={submit} className="space-y-5">{[["What happened?", "happened", "Describe the change, incident, or review outcome."], ["Why?", "why", "Explain why the outcome mattered."], ["What should ReVise remember?", "remember", "Write a concise rule or durable lesson."]].map(([label, name, placeholder]) => <div key={name}><Text as="label" className="mb-2 block text-sm font-medium">{label}</Text><Textarea name={name} required placeholder={placeholder}/></div>)}<div className="grid gap-4 sm:grid-cols-2"><div><Text as="label" className="mb-2 block text-sm font-medium">Category</Text><Select name="category">{["Coding Standard", "Architecture Decision", "Review Preference", "Security Rule", "Performance Rule", "Team Convention"].map(item => <option key={item}>{item}</option>)}</Select></div><div><Text as="label" className="mb-2 block text-sm font-medium">Confidence</Text><Input name="confidence" type="number" min="1" max="100" defaultValue="90"/></div></div><Button type="submit" disabled={saving}>{saving ? "Teaching…" : "Teach ReVise"}</Button></form></Card>{learned && <div className="mt-6"><Badge tone="brand">ReVise learned this.</Badge><div className="mt-3"><MemoryCard memory={learned}/></div></div>}<Toast message={learned ? "Memory saved and available to future reviews." : undefined}/></div>;
}
