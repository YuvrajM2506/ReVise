"use client";

import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  Split,
  FileCode,
  Sparkles,
  Info,
  RotateCcw,
  Maximize2,
  ExternalLink,
} from "lucide-react";
import Prism from "prismjs";

export interface LineHighlight {
  line: number;
  message: string;
  sourceId?: string; // e.g. "RUN-889"
  tone?: "attention" | "brand" | "danger";
}

export interface DiffLine {
  type: "add" | "remove" | "normal";
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface CodeViewerProps {
  fileName: string;
  code: string;
  language?: string;
  isSample?: boolean;
  highlightedLines?: LineHighlight[];
  appliedDiff?: DiffLine[] | null;
  onRevertDiff?: () => void;
}

export function CodeViewer({
  fileName,
  code,
  language = "typescript",
  isSample = true,
  highlightedLines = [],
  appliedDiff = null,
  onRevertDiff,
}: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"code" | "diff">(appliedDiff ? "diff" : "code");
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);

  // If appliedDiff changes, automatically set viewMode to "diff"
  useMemo(() => {
    if (appliedDiff && appliedDiff.length > 0) {
      setViewMode("diff");
    }
  }, [appliedDiff]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Build highlighted line lookup map
  const highlightMap = useMemo(() => {
    const map = new Map<number, LineHighlight>();
    highlightedLines.forEach((hl) => map.set(hl.line, hl));
    return map;
  }, [highlightedLines]);

  // Syntax highlight the code using Prism
  const highlightedCodeLines = useMemo(() => {
    const grammar = Prism.languages.javascript || Prism.languages.clike;
    const lines = code.split("\n");
    return lines.map((line) => {
      if (!line) return "";
      try {
        return Prism.highlight(line, grammar, "javascript");
      } catch {
        return line;
      }
    });
  }, [code]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-[#08151a] shadow-lg">
      {/* File Header Bar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line bg-surface/90 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <FileCode size={15} className="text-brand" />
          <span className="font-mono text-xs font-semibold text-ink">{fileName}</span>
          <span className="rounded bg-surface-strong px-2 py-0.5 font-mono text-[10px] uppercase text-muted">
            {language}
          </span>
          {isSample && (
            <span className="rounded border border-attention/30 bg-attention/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-attention">
              SAMPLE
            </span>
          )}
          {appliedDiff && (
            <span className="rounded border border-brand/40 bg-brand/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-brand">
              FIX APPLIED
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {appliedDiff && (
            <>
              <button
                type="button"
                onClick={() => setViewMode((m) => (m === "code" ? "diff" : "code"))}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-xs transition-colors ${
                  viewMode === "diff"
                    ? "bg-brand/20 text-brand border border-brand/30"
                    : "text-muted hover:text-ink hover:bg-surface-raised"
                }`}
                title="Toggle between Code and Inline Diff"
              >
                <Split size={12} />
                <span>{viewMode === "diff" ? "Diff View" : "Code View"}</span>
              </button>
              {onRevertDiff && (
                <button
                  type="button"
                  onClick={onRevertDiff}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-xs text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                  title="Revert to original code"
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-low/80 px-2.5 py-1 font-mono text-xs text-muted transition-colors hover:border-brand/40 hover:text-ink"
            title="Copy code to clipboard"
          >
            {copied ? <Check size={12} className="text-brand" /> : <Copy size={12} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Code Editor Viewport */}
      <div className="relative flex-1 overflow-auto font-mono text-xs leading-6">
        {viewMode === "diff" && appliedDiff ? (
          /* Inline Diff Preview */
          <div className="min-w-max py-2 select-text">
            {appliedDiff.map((dLine, idx) => {
              const isAdd = dLine.type === "add";
              const isRemove = dLine.type === "remove";

              return (
                <div
                  key={idx}
                  className={`flex items-start px-3 py-0.5 transition-colors ${
                    isAdd
                      ? "bg-brand/12 text-brand border-l-2 border-brand"
                      : isRemove
                      ? "bg-danger/12 text-danger border-l-2 border-danger line-through opacity-85"
                      : "text-secondary hover:bg-surface-raised/40 border-l-2 border-transparent"
                  }`}
                >
                  {/* Gutter */}
                  <span className="mr-3 w-8 shrink-0 select-none text-right font-mono text-[10px] text-muted/50">
                    {dLine.oldLineNumber || ""}
                  </span>
                  <span className="mr-3 w-8 shrink-0 select-none text-right font-mono text-[10px] text-muted/50">
                    {dLine.newLineNumber || ""}
                  </span>
                  <span className="mr-3 w-4 shrink-0 select-none font-bold">
                    {isAdd ? "+" : isRemove ? "-" : " "}
                  </span>
                  {/* Content */}
                  <span className="whitespace-pre">{dLine.content}</span>
                </div>
              );
            })}
          </div>
        ) : (
          /* Normal Code View with Highlighted Recommendations & Gutter */
          <div className="min-w-max py-2 select-text">
            {highlightedCodeLines.map((lineHtml, idx) => {
              const lineNum = idx + 1;
              const highlight = highlightMap.get(lineNum);
              const isHighlighted = !!highlight;
              const isHovered = hoveredLine === lineNum;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => isHighlighted && setHoveredLine(lineNum)}
                  onMouseLeave={() => isHighlighted && setHoveredLine(null)}
                  className={`group relative flex items-start px-3 py-0.5 transition-colors ${
                    isHighlighted
                      ? "bg-attention/10 border-l-2 border-attention"
                      : "hover:bg-surface-raised/40 border-l-2 border-transparent"
                  }`}
                >
                  {/* Gutter line number */}
                  <span
                    className={`mr-4 w-9 shrink-0 select-none text-right font-mono text-[11px] ${
                      isHighlighted ? "text-attention font-bold" : "text-muted/40 group-hover:text-muted"
                    }`}
                  >
                    {lineNum}
                  </span>

                  {/* Marker indicator for recommendations */}
                  {isHighlighted && (
                    <span
                      className="mr-2 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-attention/20 text-attention text-[9px]"
                      title={highlight.message}
                    >
                      <Sparkles size={10} />
                    </span>
                  )}

                  {/* Code Line Content */}
                  <span
                    className="whitespace-pre text-ink/90"
                    dangerouslySetInnerHTML={{ __html: lineHtml || "&nbsp;" }}
                  />

                  {/* Interactive Floating Tooltip for Highlighted Line */}
                  {isHighlighted && isHovered && (
                    <div className="absolute left-16 top-full z-30 mt-1 max-w-sm rounded-lg border border-attention/40 bg-surface-strong p-2.5 shadow-xl text-xs backdrop-blur-md">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-attention">
                        <Sparkles size={11} />
                        <span>ReVise Memory Recommendation</span>
                        {highlight.sourceId && (
                          <span className="rounded bg-attention/20 px-1 text-attention">
                            {highlight.sourceId}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-ink">
                        {highlight.message}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Code Viewer Footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-line bg-surface/80 px-4 py-2 text-[11px] text-muted">
        <div className="flex items-center gap-3">
          <span>{code.split("\n").length} lines</span>
          <span>·</span>
          <span>UTF-8</span>
          <span>·</span>
          <span className="text-brand">Memory Grounding Active</span>
        </div>
        {highlightedLines.length > 0 && (
          <div className="flex items-center gap-1.5 text-attention font-mono text-[10px] uppercase">
            <Sparkles size={11} />
            <span>{highlightedLines.length} lines flagged by memory</span>
          </div>
        )}
      </div>
    </div>
  );
}
