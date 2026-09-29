"use client";

import { useState } from "react";
import {
  Bot,
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
  sourceId?: string;
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
      <div
        className="max-w-[85%] rounded-2xl rounded-br-sm p-3.5 shadow-sm"
        style={{
          background: "rgba(2,160,160,0.13)",
          border: "1px solid rgba(2,160,160,0.28)",
        }}
      >
        <div className="whitespace-pre-wrap text-sm leading-6 text-[#f2f5f4]">
          {content}
        </div>
        {timestamp && (
          <div className="mt-1 text-right font-mono text-[9px] uppercase tracking-wider text-[#63777d]">
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
      <div
        className="flex size-7 shrink-0 items-center justify-center rounded-lg shadow-sm"
        style={{
          background: "rgba(2,160,160,0.12)",
          border: "1px solid rgba(2,160,160,0.3)",
          color: "#02a0a0",
        }}
      >
        <BrainCircuit size={14} />
      </div>

      <div
        className="group relative max-w-[90%] rounded-2xl rounded-bl-sm p-3.5 shadow-sm"
        style={{
          background: "#112830",
          border: "1px solid rgba(2,160,160,0.12)",
        }}
      >
        <div className="mb-1 flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#02a0a0]">
            ReVise AI
          </span>
          <button
            type="button"
            onClick={handleCopy}
            title="Copy message"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-[#8ca0a8] hover:text-[#f2f5f4] p-0.5 rounded"
          >
            {copied ? (
              <Check size={12} className="text-[#02a0a0]" />
            ) : (
              <Copy size={12} />
            )}
          </button>
        </div>
        <div className="whitespace-pre-wrap text-sm leading-6 text-[#c1cdcf]">
          {content}
        </div>
        {timestamp && (
          <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-[#63777d]">
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
  const dotColor =
    status === "loading"
      ? "#02a0a0"
      : status === "success"
      ? "#8fd3a8"
      : status === "warning"
      ? "#ffbd65"
      : "#8ca0a8";

  return (
    <div className="flex items-center justify-center py-1 animate-enter">
      <div
        className="inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px]"
        style={{
          background: "rgba(11,27,32,0.8)",
          border: "1px solid rgba(2,160,160,0.15)",
          color: "#8ca0a8",
        }}
      >
        <span
          className={status === "loading" ? "animate-ping" : ""}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            display: "inline-block",
            background: dotColor,
            flexShrink: 0,
          }}
        />
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
    <div
      className="rounded-xl p-3 text-sm animate-enter"
      style={{
        background: "rgba(2,160,160,0.08)",
        border: "1px solid rgba(2,160,160,0.22)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit size={14} className="text-[#02a0a0]" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#02a0a0]">
            {title} ({total})
          </span>
        </div>
        {total > 3 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 font-mono text-[10px] uppercase text-[#8ca0a8] hover:text-[#f2f5f4] transition-colors"
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
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onSelectMemory?.(mem)}
            className="group flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 transition-all duration-150"
            style={{
              background: "rgba(14,34,41,0.8)",
              border: "1px solid rgba(2,160,160,0.12)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(2,160,160,0.35)";
              (e.currentTarget as HTMLDivElement).style.background = "#112830";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(2,160,160,0.12)";
              (e.currentTarget as HTMLDivElement).style.background = "rgba(14,34,41,0.8)";
            }}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-[#02a0a0]"
                style={{ background: "rgba(2,160,160,0.15)" }}
              >
                {mem.sourceId || "MEM"}
              </span>
              <span className="truncate font-sans text-xs text-[#f2f5f4] group-hover:text-[#62baba] transition-colors">
                {mem.title}
              </span>
            </div>
            {mem.confidence !== undefined && (
              <span
                className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold text-[#02a0a0]"
                style={{ background: "#163842" }}
              >
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
      recommendation.replacementCode ||
        `${recommendation.title}\n${recommendation.summary}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    setApplied(true);
    onApply?.(recommendation);
  };

  return (
    <div
      className="rounded-xl p-4 shadow-sm animate-enter"
      style={{
        background: "#112830",
        border: "1px solid rgba(255,189,101,0.28)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#ffbd65]"
          style={{
            background: "rgba(255,189,101,0.12)",
            border: "1px solid rgba(255,189,101,0.3)",
          }}
        >
          <Sparkles size={10} />
          RECOMMENDED
        </span>
        {recommendation.sourceMemoryId && (
          <span className="font-mono text-[10px] text-[#8ca0a8]">
            Origin: {recommendation.sourceMemoryId}
          </span>
        )}
      </div>

      <h4 className="mt-2.5 text-sm font-semibold text-[#f2f5f4]">
        {recommendation.title}
      </h4>

      <p className="mt-1 text-xs leading-5 text-[#c1cdcf]">
        {recommendation.summary}
      </p>

      {recommendation.replacementCode && (
        <div
          className="mt-2.5 overflow-hidden rounded-md p-2.5 font-mono text-[11px] leading-5 text-[#62baba]"
          style={{ background: "#08151a", border: "1px solid rgba(2,160,160,0.15)" }}
        >
          <pre className="overflow-x-auto">
            <code>{recommendation.replacementCode}</code>
          </pre>
        </div>
      )}

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-[#8ca0a8] transition-colors hover:text-[#f2f5f4]"
          style={{
            background: "#0b1b20",
            border: "1px solid rgba(2,160,160,0.15)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(2,160,160,0.35)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(2,160,160,0.15)";
          }}
        >
          {copied ? <Check size={12} className="text-[#02a0a0]" /> : <Copy size={12} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
        <button
          type="button"
          onClick={handleApply}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all duration-150 ${
            applied
              ? "text-[#8fd3a8]"
              : "text-[#08151a] hover:shadow-[0_0_10px_rgba(2,160,160,0.3)]"
          }`}
          style={
            applied
              ? {
                  background: "rgba(143,211,168,0.15)",
                  border: "1px solid rgba(143,211,168,0.3)",
                }
              : {
                  background: "#02a0a0",
                }
          }
          onMouseEnter={(e) => {
            if (!applied)
              (e.currentTarget as HTMLButtonElement).style.background = "#62baba";
          }}
          onMouseLeave={(e) => {
            if (!applied)
              (e.currentTarget as HTMLButtonElement).style.background = "#02a0a0";
          }}
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
