"use client";

import { useState } from "react";
import {
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
  Copy,
  ArrowRight,
  BrainCircuit,
  ExternalLink,
} from "lucide-react";

export type MessageRole = "user" | "assistant" | "status" | "memory" | "recommendation";

export interface MemoryItem {
  id: string;
  title: string;
  sourceId?: string; // e.g. "PR #142" or "RUN-889"
  confidence?: number;
  category?: string;
  relevanceNote?: string;
}

export interface RecommendationItem {
  id: string;
  title: string;
  summary: string;
  affectedLines?: number[];
  replacementCode?: string;
  sourceMemoryId?: string;
}

export interface ChatMessageItemProps {
  id: string;
  role: MessageRole;
  content: string;
  timestamp?: string;
  statusType?: "info" | "success" | "warning" | "loading";
  memories?: MemoryItem[];
  recommendation?: RecommendationItem;
  onApplyRecommendation?: (rec: RecommendationItem) => void;
  onSelectMemory?: (mem: MemoryItem) => void;
}

export function UserMessage({ content, timestamp }: { content: string; timestamp?: string }) {
  return (
    <div className="flex justify-end animate-enter">
      <div className="max-w-[85%] rounded-2xl rounded-br-sm border border-brand/25 bg-brand/12 p-3.5 shadow-sm text-ink">
        <div className="whitespace-pre-wrap text-sm leading-6 font-normal selection:bg-brand selection:text-canvas">
          {content}
        </div>
        {timestamp && (
          <div className="mt-1 text-right font-mono text-[9px] uppercase tracking-wider text-muted/70">
            {timestamp}
          </div>
        )}
      </div>
    </div>
  );
}

export function AssistantMessage({
  content,
  timestamp,
}: {
  content: string;
  timestamp?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-start gap-2.5 animate-enter">
      {/* ReVise Avatar */}
      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-brand/30 bg-surface-strong shadow-sm text-brand">
        <BrainCircuit size={15} />
      </div>

      <div className="group relative max-w-[90%] rounded-2xl rounded-bl-sm border border-line bg-surface-raised p-3.5 shadow-sm text-secondary">
        <div className="mb-1 flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-brand">
            ReVise AI
          </span>
          <button
            type="button"
            onClick={handleCopy}
            title="Copy message"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-ink p-0.5 rounded"
          >
            {copied ? <Check size={12} className="text-brand" /> : <Copy size={12} />}
          </button>
        </div>
        <div className="whitespace-pre-wrap text-sm leading-6">
          {content}
        </div>
        {timestamp && (
          <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-muted/60">
            {timestamp}
          </div>
        )}
      </div>
    </div>
  );
}

export function StatusMessage({
  text,
  status = "info",
}: {
  text: string;
  status?: "info" | "success" | "warning" | "loading";
}) {
  return (
    <div className="flex items-center justify-center py-1 text-xs text-muted animate-enter">
      <div className="inline-flex items-center gap-2 rounded-full border border-line/60 bg-surface-low/80 px-3 py-1 font-mono text-[11px]">
        {status === "loading" ? (
          <span className="size-1.5 animate-ping rounded-full bg-brand" />
        ) : status === "success" ? (
          <span className="size-1.5 rounded-full bg-success" />
        ) : (
          <span className="size-1.5 rounded-full bg-attention" />
        )}
        <span>{text}</span>
      </div>
    </div>
  );
}

export function MemoryCardMessage({
  title = "Using stored engineering memories",
  memories = [],
  onSelectMemory,
}: {
  title?: string;
  memories?: MemoryItem[];
  onSelectMemory?: (mem: MemoryItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const total = memories.length;
  const visible = expanded ? memories : memories.slice(0, 3);

  if (total === 0) return null;

  return (
    <div className="rounded-xl border border-brand/25 bg-brand-soft/40 p-3 text-sm animate-enter">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit size={14} className="text-brand" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-brand">
            {title} ({total})
          </span>
        </div>
        {total > 3 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 font-mono text-[10px] uppercase text-muted hover:text-ink transition-colors"
          >
            <span>{expanded ? "Show less" : `Show all ${total}`}</span>
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>

      <div className="mt-2.5 space-y-1.5">
        {visible.map((mem) => (
          <div
            key={mem.id}
            onClick={() => onSelectMemory?.(mem)}
            className="group flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-brand/15 bg-surface/80 px-2.5 py-1.5 transition-all duration-150 hover:border-brand/40 hover:bg-surface-raised"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 rounded bg-brand/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-brand">
                {mem.sourceId || "MEM"}
              </span>
              <span className="truncate font-sans text-xs text-ink group-hover:text-brand-light transition-colors">
                {mem.title}
              </span>
            </div>
            {mem.confidence !== undefined && (
              <span className="shrink-0 rounded-full bg-surface-strong px-2 py-0.5 font-mono text-[10px] font-semibold text-brand">
                {Math.round(mem.confidence)}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecommendationCardMessage({
  recommendation,
  onApply,
}: {
  recommendation: RecommendationItem;
  onApply?: (rec: RecommendationItem) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(
      recommendation.replacementCode || `${recommendation.title}\n${recommendation.summary}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    setApplied(true);
    onApply?.(recommendation);
  };

  return (
    <div className="rounded-xl border border-attention/30 bg-surface-raised/90 p-4 shadow-sm animate-enter">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded border border-attention/40 bg-attention/15 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-attention">
          <Sparkles size={10} /> RECOMMENDED
        </span>
        {recommendation.sourceMemoryId && (
          <span className="font-mono text-[10px] text-muted">
            Origin: {recommendation.sourceMemoryId}
          </span>
        )}
      </div>

      <h4 className="mt-2 text-sm font-semibold text-ink">
        {recommendation.title}
      </h4>

      <p className="mt-1 text-xs leading-5 text-secondary">
        {recommendation.summary}
      </p>

      {recommendation.replacementCode && (
        <div className="mt-2.5 overflow-hidden rounded-md border border-line bg-[#08151a] p-2.5 font-mono text-[11px] leading-5 text-brand-light">
          <pre className="overflow-x-auto">
            <code>{recommendation.replacementCode}</code>
          </pre>
        </div>
      )}

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-low px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:border-brand/40 hover:text-ink"
        >
          {copied ? <Check size={12} className="text-brand" /> : <Copy size={12} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
        <button
          type="button"
          onClick={handleApply}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all duration-150 ${
            applied
              ? "bg-success/20 text-success border border-success/30"
              : "bg-brand text-[#08151a] hover:bg-brand-light hover:shadow-[0_0_10px_rgba(2,160,160,0.3)]"
          }`}
        >
          {applied ? <Check size={12} /> : <ArrowRight size={12} />}
          <span>{applied ? "Applied to file" : "Apply to file"}</span>
        </button>
      </div>
    </div>
  );
}

export function ChatMessageItem(props: ChatMessageItemProps) {
  switch (props.role) {
    case "user":
      return <UserMessage content={props.content} timestamp={props.timestamp} />;
    case "assistant":
      return <AssistantMessage content={props.content} timestamp={props.timestamp} />;
    case "status":
      return <StatusMessage text={props.content} status={props.statusType} />;
    case "memory":
      return (
        <MemoryCardMessage
          title={props.content || "Using stored engineering memories"}
          memories={props.memories}
          onSelectMemory={props.onSelectMemory}
        />
      );
    case "recommendation":
      return props.recommendation ? (
        <RecommendationCardMessage
          recommendation={props.recommendation}
          onApply={props.onApplyRecommendation}
        />
      ) : null;
    default:
      return <AssistantMessage content={props.content} timestamp={props.timestamp} />;
  }
}
