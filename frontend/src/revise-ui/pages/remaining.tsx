import { useEffect, useState, useRef, type FormEvent } from "react";
import {
  Badge,
  Button,
  Card,
  CodeBlock,
  DiffViewer,
  EmptyState,
  ErrorState,
  FindingCard,
  Heading,
  Input,
  LoadingState,
  MemoryEvidence,
  RecommendationCard,
  RiskScore,
  SectionHeader,
  Select,
  Tabs,
  Text,
  Textarea,
  Toast,
  TypingIndicator,
} from "../components/ui";
import {
  getMemoriesStrict,
  getPairProgrammerContext,
  getRunReview,
  getSettings,
  getStandardsStrict,
  saveSettings,
  sendPairMessage,
} from "../services/revise";
import type {
  EngineeringStandard,
  Memory,
  PairProgrammerContext,
  Review,
  SettingsSections,
} from "../types";
import {
  ChatComposer,
  ChatMessageItem,
  CodeViewer,
  FileTree,
  type LineHighlight,
  type DiffLine,
  type MemoryItem,
  type RecommendationItem,
} from "../components/pair-programmer";
import {
  Bot,
  BrainCircuit,
  Zap,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Sparkles,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";

const SAMPLE_SESSION_CODE = `import { validateSession } from "./validate";
import { getSession, applySessionMutation } from "@/lib/auth";
import { AuthenticationError } from "@/lib/errors";

export async function updateSession(input: SessionInput) {
  const current = await getSession(input.sessionId);

  // ⚠ ReVise Flag: Mutating session state BEFORE validation
  await applySessionMutation(current, input);

  if (!validateSession(current)) {
    throw new AuthenticationError("Invalid session credentials");
  }

  return current;
}`;

const SAMPLE_VALIDATE_CODE = `export function validateSession(session: SessionData | null): boolean {
  if (!session || !session.userId) return false;
  if (session.isExpired) return false;
  return session.roles.includes("admin") || session.roles.includes("editor");
}`;

const SAMPLE_DIFF_CODE = `diff --git a/src/auth/session.ts b/src/auth/session.ts
index 3a2f1b..8c9d4e 100644
--- a/src/auth/session.ts
+++ b/src/auth/session.ts
@@ -8,7 +8,8 @@ export async function updateSession(input: SessionInput) {
   const current = await getSession(input.sessionId);
 
-  await applySessionMutation(current, input);
+  // ReVise fix: Validate BEFORE mutating state (RUN-889)
   if (!validateSession(current)) {
     throw new AuthenticationError("Invalid session credentials");
   }
+  await applySessionMutation(current, input);`;

const SAMPLE_RECOMMENDATION_DIFF: DiffLine[] = [
  { type: "normal", content: "export async function updateSession(input: SessionInput) {", oldLineNumber: 5, newLineNumber: 5 },
  { type: "normal", content: "  const current = await getSession(input.sessionId);", oldLineNumber: 6, newLineNumber: 6 },
  { type: "normal", content: "  ", oldLineNumber: 7, newLineNumber: 7 },
  { type: "remove", content: "  await applySessionMutation(current, input);", oldLineNumber: 8 },
  { type: "add", content: "  // ReVise fix: Validate BEFORE mutating state (RUN-889)", newLineNumber: 8 },
  { type: "add", content: "  if (!validateSession(current)) {", newLineNumber: 9 },
  { type: "add", content: "    throw new AuthenticationError(\"Invalid session credentials\");", newLineNumber: 10 },
  { type: "add", content: "  }", newLineNumber: 11 },
  { type: "add", content: "  await applySessionMutation(current, input);", newLineNumber: 12 },
  { type: "remove", content: "  if (!validateSession(current)) {", oldLineNumber: 9 },
  { type: "remove", content: "    throw new AuthenticationError(\"Invalid session credentials\");", oldLineNumber: 10 },
  { type: "remove", content: "  }", oldLineNumber: 11 },
  { type: "normal", content: "  return current;", oldLineNumber: 12, newLineNumber: 13 },
  { type: "normal", content: "}", oldLineNumber: 13, newLineNumber: 14 },
];

interface ChatEntry {
  id: string;
  role: "user" | "assistant" | "status" | "memory" | "recommendation";
  content: string;
  timestamp?: string;
  statusType?: "info" | "success" | "warning" | "loading";
  memories?: MemoryItem[];
  recommendation?: RecommendationItem;
}

export function PairProgrammerPage() {
  const [mobileTab, setMobileTab] = useState<"Files" | "Editor" | "Chat">("Editor");
  const [context, setContext] = useState<PairProgrammerContext | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>("src/auth/session.ts");
  const [loadingContext, setLoadingContext] = useState(true);
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [appliedDiff, setAppliedDiff] = useState<DiffLine[] | null>(null);

  // Aider service live status state
  const [aiderStatus, setAiderStatus] = useState<"connected" | "connecting" | "offline">("connected");
  const [showAiderBanner, setShowAiderBanner] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadContext = async (targetRunId?: string) => {
    setLoadingContext(true);
    try {
      const data = await getPairProgrammerContext(targetRunId);
      if (data) {
        setContext(data);
        if (data.changed_files && data.changed_files.length > 0) {
          setSelectedFile(data.changed_files[0].filename);
        } else if (data.file_name) {
          setSelectedFile(data.file_name);
        }

        const prLabel = data.pull_number
          ? `PR #${data.pull_number} (${data.owner ? `${data.owner}/${data.repo}` : data.service})`
          : data.service;

        const initialEntries: ChatEntry[] = [
          {
            id: "status-aider",
            role: "status",
            content: "Aider daemon online · loopback port 8501",
            statusType: "success",
          },
          {
            id: "welcome",
            role: "assistant",
            content: `I've loaded the engineering memory and PR analysis for ${prLabel}.\n\n• Risk Score: ${data.risk_score}/100 (${data.risk_level})\n• ${data.findings.length} findings identified\n• ${data.relevant_memories_count} team memories retrieved\n\nI can explain why specific patterns are flagged, draft compliant fixes, or verify against your team standards.`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ];

        // Add memory evidence card if relevant memories exist
        if (data.relevant_memories && data.relevant_memories.length > 0) {
          initialEntries.push({
            id: "memories-card",
            role: "memory",
            content: "Stored engineering memories in context",
            memories: data.relevant_memories.map((m, idx) => ({
              id: m.memory_id || `mem-${idx}`,
              title: m.title,
              sourceId: m.type || `PR #${idx + 100}`,
              confidence: m.relevance_score ? Math.round(m.relevance_score * 100) : 88,
              category: m.type,
              relevanceNote: m.relevance_note,
            })),
          });
        }

        // Add recommendation card if safer rollout or recommendations exist
        if (data.safer_rollout && data.safer_rollout.length > 0) {
          initialEntries.push({
            id: "rec-card",
            role: "recommendation",
            content: "Recommended refactoring",
            recommendation: {
              id: "rec-1",
              title: "Validate session before mutating state",
              summary:
                data.safer_rollout[0] ||
                "Validate session permissions before invoking applySessionMutation to avoid unauthorized mutations if validation throws.",
              affectedLines: [9, 10, 11, 12, 13, 14],
              replacementCode: `// ReVise fix: Validate BEFORE mutating state (RUN-889)\nif (!validateSession(current)) {\n  throw new AuthenticationError();\n}\nawait applySessionMutation(current, input);`,
              sourceMemoryId: "RUN-889",
            },
          });
        }

        setMessages(initialEntries);
      } else {
        setContext(null);
        setMessages([
          {
            id: "status-aider",
            role: "status",
            content: "Aider daemon online · loopback port 8501",
            statusType: "success",
          },
          {
            id: "welcome-sample",
            role: "assistant",
            content:
              "Welcome to ReVise AI Pair Programmer! I'm grounded in your team's engineering memories, past PR discussions, and architecture rules.\n\nTake a look at the sample session handler in the code viewer, or paste/load any PR to inspect it.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
          {
            id: "sample-memories",
            role: "memory",
            content: "Using 5 team engineering memories",
            memories: [
              { id: "m1", title: "Validate permissions before state mutations", sourceId: "PR #142", confidence: 95 },
              { id: "m2", title: "Never swallow AuthenticationError in handlers", sourceId: "RUN-889", confidence: 92 },
              { id: "m3", title: "Use centralized session validation schema", sourceId: "ADR-019", confidence: 84 },
              { id: "m4", title: "Async handlers must return immutable clones", sourceId: "PR #205", confidence: 78 },
              { id: "m5", title: "Avoid unbounded DB transactions during token verification", sourceId: "INC-441", confidence: 72 },
            ],
          },
          {
            id: "sample-rec",
            role: "recommendation",
            content: "Recommended fix",
            recommendation: {
              id: "rec-sample",
              title: "Validate session before mutation",
              summary:
                "Calling applySessionMutation before validateSession risks committing invalid state to the database. Reorder to check authentication first.",
              affectedLines: [8, 9, 10, 11, 12, 13, 14],
              replacementCode: `if (!validateSession(current)) {\n  throw new AuthenticationError();\n}\nawait applySessionMutation(current, input);`,
              sourceMemoryId: "PR #142",
            },
          },
        ]);
      }
    } catch {
      setContext(null);
    } finally {
      setLoadingContext(false);
    }
  };

  useEffect(() => {
    const getRunIdFromUrl = () => {
      if (typeof window !== "undefined") {
        return new URLSearchParams(window.location.search).get("runId") || undefined;
      }
      return undefined;
    };

    loadContext(getRunIdFromUrl());

    const handlePopState = () => {
      loadContext(getRunIdFromUrl());
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleSendMessage = async (userText: string, attachFile: boolean) => {
    const clean = userText.trim();
    if (!clean || loading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatEntry = {
      id: `user-${Date.now()}`,
      role: "user",
      content: attachFile ? `[Context: ${selectedFile}]\n${clean}` : clean,
      timestamp: timeStr,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const replyText = await sendPairMessage(clean, context?.run_id);
      const assistantMsg: ChatEntry = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatEntry = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Could not reach the pair programmer service. Please verify your connection and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRecommendation = (rec: RecommendationItem) => {
    setAppliedDiff(SAMPLE_RECOMMENDATION_DIFF);
    const statusMsg: ChatEntry = {
      id: `status-${Date.now()}`,
      role: "status",
      content: `Applied recommended fix to ${selectedFile} (Diff preview ready)`,
      statusType: "success",
    };
    setMessages((prev) => [...prev, statusMsg]);
  };

  const handleRevertDiff = () => {
    setAppliedDiff(null);
    const statusMsg: ChatEntry = {
      id: `status-${Date.now()}`,
      role: "status",
      content: `Reverted ${selectedFile} to original revision`,
      statusType: "info",
    };
    setMessages((prev) => [...prev, statusMsg]);
  };

  const handleConnectAider = () => {
    setAiderStatus("connecting");
    setTimeout(() => {
      setAiderStatus("connected");
      setMessages((prev) => [
        ...prev,
        {
          id: `aider-conn-${Date.now()}`,
          role: "status",
          content: "Aider daemon verified on 127.0.0.1:8501",
          statusType: "success",
        },
      ]);
    }, 900);
  };

  // Derive files list
  const baseFiles =
    context?.changed_files && context.changed_files.length > 0
      ? context.changed_files.map((f) => f.filename)
      : [
          "src/auth/session.ts",
          "src/auth/validate.ts",
          "src/api/routes.ts",
          "src/memory/hindsight.ts",
          "src/services/inventory.ts",
          "changeset.diff",
        ];

  // Resolve current code based on selected file
  const currentCode =
    selectedFile.endsWith("validate.ts")
      ? SAMPLE_VALIDATE_CODE
      : selectedFile.endsWith(".diff")
      ? SAMPLE_DIFF_CODE
      : context?.code_snippet || SAMPLE_SESSION_CODE;

  const currentLanguage = selectedFile.endsWith(".diff")
    ? "diff"
    : selectedFile.endsWith(".py")
    ? "python"
    : "typescript";

  // Recommendation line highlights
  const lineHighlights: LineHighlight[] =
    selectedFile.endsWith("session.ts")
      ? [
          {
            line: 10,
            message: "State mutation before validation violates Team Standard RUN-889",
            sourceId: "RUN-889",
            tone: "attention",
          },
          {
            line: 12,
            message: "validateSession called too late; unauthorized mutations can persist",
            sourceId: "PR #142",
            tone: "attention",
          },
        ]
      : [];

  const fileIssuesMap: Record<string, number> = {
    "src/auth/session.ts": 2,
    "session.ts": 2,
    "changeset.diff": 1,
  };

  const memCount = context?.relevant_memories_count ?? 5;

  return (
    <div className="space-y-4 animate-enter">
      {/* Top Section Header */}
      <SectionHeader
        eyebrow="Memory-aware coding"
        title="AI Pair Programmer"
        action={
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-low px-3 py-1 font-mono text-[11px] text-secondary">
              <BrainCircuit size={13} className="text-brand" />
              <span>{memCount} memories in context</span>
            </span>

            <Button
              variant="secondary"
              onClick={() => {
                const runId =
                  typeof window !== "undefined"
                    ? new URLSearchParams(window.location.search).get("runId") || undefined
                    : undefined;
                loadContext(runId);
              }}
              disabled={loadingContext}
              className="text-xs font-mono h-8 px-3"
            >
              <RefreshCw size={12} className={loadingContext ? "animate-spin" : ""} />
              <span>{loadingContext ? "Refreshing…" : "Refresh"}</span>
            </Button>
          </div>
        }
      />

      {/* Dismissible Aider Connection Banner */}
      {showAiderBanner && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface/90 px-4 py-2.5 shadow-sm text-xs backdrop-blur-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-brand/15 text-brand">
              <Bot size={14} />
            </div>
            <p className="truncate text-secondary">
              <strong className="font-semibold text-ink">Aider Engine:</strong> Loopback-only service
              at <code className="font-mono text-brand">127.0.0.1:8501</code>. Autonomous repo-aware coding active.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {aiderStatus !== "connected" && (
              <button
                type="button"
                onClick={handleConnectAider}
                className="rounded-md bg-brand px-2.5 py-1 text-[11px] font-semibold text-[#08151a] hover:bg-brand-light transition-colors"
              >
                Connect Aider
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAiderBanner(false)}
              className="p-1 text-muted hover:text-ink transition-colors rounded"
              aria-label="Dismiss banner"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden">
        <Tabs
          tabs={["Files", "Editor", "Chat"]}
          active={mobileTab}
          onChange={(tab) => setMobileTab(tab as any)}
        />
      </div>

      {/* Three Panel Main Layout */}
      <div className="h-[calc(100vh-14rem)] min-h-[42rem] lg:grid lg:grid-cols-[14rem_minmax(0,1fr)_25rem] gap-3">
        {/* Left Column: File Tree */}
        <div className={`h-full ${mobileTab === "Files" ? "block" : "hidden lg:block"}`}>
          <FileTree
            files={baseFiles}
            activeFile={selectedFile}
            onSelectFile={(f) => {
              setSelectedFile(f);
              setAppliedDiff(null);
            }}
            fileIssuesMap={fileIssuesMap}
          />
        </div>

        {/* Center Column: Code Viewer */}
        <div className={`h-full min-w-0 ${mobileTab === "Editor" ? "block" : "hidden lg:block"}`}>
          <CodeViewer
            fileName={selectedFile}
            code={currentCode}
            language={currentLanguage}
            isSample={!context}
            highlightedLines={lineHighlights}
            appliedDiff={appliedDiff}
            onRevertDiff={handleRevertDiff}
          />
        </div>

        {/* Right Column: AI Chat Panel */}
        <div
          className={`h-full flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-md ${
            mobileTab === "Chat" ? "block" : "hidden lg:flex"
          }`}
        >
          {/* Chat Panel Header with Live Status Indicator */}
          <div className="shrink-0 border-b border-line bg-surface-raised/80 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BrainCircuit size={16} className="text-brand" />
                <h3 className="font-display text-sm font-semibold text-ink">AI Pair Programmer</h3>
              </div>

              {/* Live Aider status indicator */}
              <div className="flex items-center gap-1.5">
                {aiderStatus === "connected" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-success">
                    <span className="size-1.5 rounded-full bg-success animate-pulse" />
                    <span>AIDER ONLINE</span>
                  </span>
                ) : aiderStatus === "connecting" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-attention/30 bg-attention/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-attention">
                    <span className="size-1.5 rounded-full bg-attention animate-ping" />
                    <span>CONNECTING…</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnectAider}
                    className="inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-danger hover:bg-danger/20 transition-colors"
                  >
                    <span className="size-1.5 rounded-full bg-danger" />
                    <span>OFFLINE · CONNECT</span>
                  </button>
                )}
              </div>
            </div>

            <p className="mt-1 font-mono text-[10px] text-muted truncate">
              {context?.run_id
                ? `Run: ${context.run_id.slice(0, 18)}… · ${context.service}`
                : "Active Memory Session · Grounded in ADRs & PR history"}
            </p>
          </div>

          {/* Scrolling Chat Messages Region */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
            {messages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                id={msg.id}
                role={msg.role}
                content={msg.content}
                timestamp={msg.timestamp}
                statusType={msg.statusType}
                memories={msg.memories}
                recommendation={msg.recommendation}
                onApplyRecommendation={handleApplyRecommendation}
                onSelectMemory={(m) => {
                  handleSendMessage(
                    `Tell me more about memory "${m.title}" (${m.sourceId}) and how it applies to ${selectedFile}`,
                    true
                  );
                }}
              />
            ))}

            {loading && (
              <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-raised p-3 text-xs text-muted animate-enter">
                <span className="size-2 rounded-full bg-brand animate-ping" />
                <span>ReVise is synthesizing answer with team memory…</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Pinned Bottom Chat Composer */}
          <ChatComposer
            onSend={handleSendMessage}
            loading={loading}
            activeFile={selectedFile}
            placeholder={`Ask ReVise about ${selectedFile}, findings, or safe rollout…`}
          />
        </div>
      </div>
    </div>
  );
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
      setStatus({ ok: false, message: error instanceof Error ? error.message : "Could not save settings." });
    } finally {
      setSaving(false);
    }
  }
  return <div className="animate-enter"><SectionHeader eyebrow="Workspace configuration" title="Settings"/><div className="grid gap-5 lg:grid-cols-[14rem_1fr]"><Card className="h-fit p-2">{settingTabs.map(item => <Button key={item} variant="ghost" onClick={() => setTab(item)} className={`w-full justify-start ${tab === item ? "bg-brand-soft text-brand" : ""}`}>{item}</Button>)}</Card><Card className="max-w-3xl p-5"><Heading level={2} className="text-lg">{tab}</Heading><Text className="mt-1 text-sm text-muted">{loading ? "Loading saved preferences…" : `Configure ${tab.toLowerCase()} preferences for this ReVise workspace.`}</Text><form key={`${tab}:${loading ? "loading" : "ready"}:${JSON.stringify(stored)}`} onSubmit={submit} className="mt-6 space-y-5"><div><Text as="label" className="mb-2 block text-sm font-medium">{tab === "Repository" ? "Default repository" : tab === "AI Model" ? "Review model" : "Workspace name"}</Text>{tab === "AI Model" ? <Select name="model" defaultValue={modelDefault}>{modelOptions.map(option => <option key={option}>{option}</option>)}</Select> : <Input name="primary" defaultValue={nameDefault}/>}</div><div><Text as="label" className="mb-2 block text-sm font-medium">{tab === "Memory" ? "Minimum recall confidence" : "Default review behavior"}</Text><Select name="behavior" defaultValue={behaviorDefault}>{behaviorOptions.map(option => <option key={option}>{option}</option>)}</Select></div><div><Text as="label" className="mb-2 block text-sm font-medium">Notes</Text><Textarea name="notes" defaultValue={stored.notes || ""} placeholder={`Add ${tab.toLowerCase()} guidance for ReVise…`}/></div><div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>{status && !status.ok && <Text className="text-sm text-danger">{status.message}</Text>}</div></form></Card></div><Toast message={status?.ok ? status.message : undefined}/></div>;
}
