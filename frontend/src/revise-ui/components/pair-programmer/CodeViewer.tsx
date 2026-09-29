"use client";

import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  Split,
  FileCode,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import Prism from "prismjs";

export interface LineHighlight {
  line: number;
  message: string;
  sourceId?: string;
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
  const [viewMode, setViewMode] = useState<"code" | "diff">(
    appliedDiff ? "diff" : "code"
  );
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);

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

  const highlightMap = useMemo(() => {
    const map = new Map<number, LineHighlight>();
    highlightedLines.forEach((hl) => map.set(hl.line, hl));
    return map;
  }, [highlightedLines]);

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
    <div
      className="flex h-full flex-col overflow-hidden rounded-xl shadow-lg"
      style={{
        background: "#08151a",
        border: "1px solid rgba(2,160,160,0.14)",
      }}
    >
      {/* File Header Bar */}
      <div
        className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-2.5 backdrop-blur-sm"
        style={{
          background: "rgba(14,34,41,0.92)",
          borderBottom: "1px solid rgba(2,160,160,0.12)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <FileCode size={14} className="text-[#02a0a0]" />
          <span className="font-mono text-xs font-semibold text-[#f2f5f4]">
            {fileName}
          </span>
          <span
            className="rounded px-2 py-0.5 font-mono text-[10px] uppercase text-[#8ca0a8]"
            style={{ background: "#163842" }}
          >
            {language}
          </span>
          {isSample && (
            <span
              className="rounded px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#ffbd65]"
              style={{
                background: "rgba(255,189,101,0.1)",
                border: "1px solid rgba(255,189,101,0.28)",
              }}
            >
              SAMPLE
            </span>
          )}
          {appliedDiff && (
            <span
              className="rounded px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#02a0a0]"
              style={{
                background: "rgba(2,160,160,0.15)",
                border: "1px solid rgba(2,160,160,0.35)",
              }}
            >
              FIX APPLIED
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {appliedDiff && (
            <>
              <button
                type="button"
                onClick={() => setViewMode((m) => (m === "code" ? "diff" : "code"))}
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-xs transition-colors"
                style={
                  viewMode === "diff"
                    ? {
                        background: "rgba(2,160,160,0.18)",
                        color: "#02a0a0",
                        border: "1px solid rgba(2,160,160,0.3)",
                      }
                    : {
                        color: "#8ca0a8",
                      }
                }
                title="Toggle between Code and Inline Diff"
              >
                <Split size={12} />
                <span>{viewMode === "diff" ? "Diff View" : "Code View"}</span>
              </button>
              {onRevertDiff && (
                <button
                  type="button"
                  onClick={onRevertDiff}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-xs text-[#8ca0a8] hover:text-[#f28b82] transition-colors"
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
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-xs text-[#8ca0a8] transition-colors hover:text-[#f2f5f4]"
            style={{
              background: "rgba(11,27,32,0.8)",
              border: "1px solid rgba(2,160,160,0.14)",
            }}
            title="Copy code to clipboard"
          >
            {copied ? (
              <Check size={12} className="text-[#02a0a0]" />
            ) : (
              <Copy size={12} />
            )}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Code Editor Viewport */}
      <div className="relative flex-1 overflow-auto font-mono text-xs leading-6 scrollbar-thin">
        {viewMode === "diff" && appliedDiff ? (
          <div className="min-w-max py-2 select-text">
            {appliedDiff.map((dLine, idx) => {
              const isAdd = dLine.type === "add";
              const isRemove = dLine.type === "remove";

              return (
                <div
                  key={idx}
                  className="flex items-start px-3 py-0.5 transition-colors"
                  style={{
                    background: isAdd
                      ? "rgba(2,160,160,0.1)"
                      : isRemove
                      ? "rgba(242,139,130,0.1)"
                      : "transparent",
                    borderLeft: isAdd
                      ? "2px solid #02a0a0"
                      : isRemove
                      ? "2px solid #f28b82"
                      : "2px solid transparent",
                    color: isAdd
                      ? "#62baba"
                      : isRemove
                      ? "rgba(242,139,130,0.8)"
                      : "#8ca0a8",
                    textDecoration: isRemove ? "line-through" : "none",
                  }}
                >
                  <span className="mr-3 w-8 shrink-0 select-none text-right font-mono text-[10px] text-[#63777d]">
                    {dLine.oldLineNumber || ""}
                  </span>
                  <span className="mr-3 w-8 shrink-0 select-none text-right font-mono text-[10px] text-[#63777d]">
                    {dLine.newLineNumber || ""}
                  </span>
                  <span className="mr-3 w-4 shrink-0 select-none font-bold">
                    {isAdd ? "+" : isRemove ? "-" : " "}
                  </span>
                  <span className="whitespace-pre">{dLine.content}</span>
                </div>
              );
            })}
          </div>
        ) : (
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
                  className="group relative flex items-start px-3 py-0.5 transition-colors"
                  style={{
                    background: isHighlighted
                      ? "rgba(255,189,101,0.07)"
                      : undefined,
                    borderLeft: isHighlighted
                      ? "2px solid #ffbd65"
                      : "2px solid transparent",
                  }}
                  onMouseOver={(e) => {
                    if (!isHighlighted)
                      (e.currentTarget as HTMLDivElement).style.background =
                        "rgba(17,40,48,0.5)";
                  }}
                  onMouseOut={(e) => {
                    if (!isHighlighted)
                      (e.currentTarget as HTMLDivElement).style.background =
                        "transparent";
                  }}
                >
                  {/* Gutter line number */}
                  <span
                    className="mr-4 w-9 shrink-0 select-none text-right font-mono text-[11px]"
                    style={{
                      color: isHighlighted ? "#ffbd65" : "#63777d",
                      fontWeight: isHighlighted ? 700 : 400,
                    }}
                  >
                    {lineNum}
                  </span>

                  {/* Sparkle marker for recommendations */}
                  {isHighlighted && (
                    <span
                      className="mr-2 inline-flex size-4 shrink-0 items-center justify-center rounded-full text-[9px]"
                      style={{
                        background: "rgba(255,189,101,0.18)",
                        color: "#ffbd65",
                      }}
                      title={highlight.message}
                    >
                      <Sparkles size={9} />
                    </span>
                  )}

                  {/* Code Line Content */}
                  <span
                    className="whitespace-pre"
                    style={{ color: "#c1cdcf" }}
                    dangerouslySetInnerHTML={{ __html: lineHtml || "&nbsp;" }}
                  />

                  {/* Floating Tooltip */}
                  {isHighlighted && isHovered && (
                    <div
                      className="absolute left-16 top-full z-30 mt-1 max-w-sm rounded-lg p-2.5 shadow-xl text-xs backdrop-blur-md"
                      style={{
                        background: "#112830",
                        border: "1px solid rgba(255,189,101,0.35)",
                      }}
                    >
                      <div
                        className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: "#ffbd65" }}
                      >
                        <Sparkles size={11} />
                        <span>ReVise Memory Recommendation</span>
                        {highlight.sourceId && (
                          <span
                            className="rounded px-1"
                            style={{
                              background: "rgba(255,189,101,0.18)",
                              color: "#ffbd65",
                            }}
                          >
                            {highlight.sourceId}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-5" style={{ color: "#f2f5f4" }}>
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

      {/* Footer */}
      <div
        className="flex shrink-0 items-center justify-between px-4 py-2 text-[11px]"
        style={{
          background: "rgba(14,34,41,0.85)",
          borderTop: "1px solid rgba(2,160,160,0.1)",
          color: "#8ca0a8",
        }}
      >
        <div className="flex items-center gap-3">
          <span>{code.split("\n").length} lines</span>
          <span>·</span>
          <span>UTF-8</span>
          <span>·</span>
          <span style={{ color: "#02a0a0" }}>Memory Grounding Active</span>
        </div>
        {highlightedLines.length > 0 && (
          <div
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase"
            style={{ color: "#ffbd65" }}
          >
            <Sparkles size={11} />
            <span>{highlightedLines.length} lines flagged by memory</span>
          </div>
        )}
      </div>
    </div>
  );
}
