"use client";
import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import {
  Clipboard,
  Upload,
  X,
  ChevronDown,
  BrainCircuit,
  Loader2,
  Zap,
} from "lucide-react";

// ─── types ────────────────────────────────────────────────────────────────────
type Language = "Auto-detect" | "Python" | "JavaScript/TypeScript" | "Go" | "Java" | "Rust" | "C/C++" | "Ruby" | "SQL";
type InputMode = "Code" | "Diff";

interface MemorySource {
  id: string;
  label: string;
  active: boolean;
}

interface CodeEditorCardProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  /** Submit button label. The parent supplies this because it knows whether the
      current input will be routed to the pull-request analyzer or the snippet one. */
  submitLabel?: string;
}

// ─── constants ────────────────────────────────────────────────────────────────
const LANGUAGES: Language[] = [
  "Auto-detect", "Python", "JavaScript/TypeScript", "Go",
  "Java", "Rust", "C/C++", "Ruby", "SQL",
];

const SAMPLE_CODE = `// Example: async session handler with a subtle ordering bug
export async function updateSession(input: SessionInput) {
  // ⚠ ReVise will flag this ordering against your team's memory
  await mutate(input);          // mutates BEFORE validation
  return validateSession();     // should run first
}`;

const SAMPLE_DIFF = `diff --git a/src/auth/session.ts b/src/auth/session.ts
index 3a2f1b..8c9d4e 100644
--- a/src/auth/session.ts
+++ b/src/auth/session.ts
@@ -14,7 +14,7 @@ export async function updateSession(input) {
-  await mutate(input);
-  return validateSession();
+  await validateSession(input);
+  return mutate(input);
 }`;

const INITIAL_MEMORY_SOURCES: MemorySource[] = [
  { id: "standards",  label: "Team standards",    active: true  },
  { id: "pr",         label: "Past PR feedback",  active: true  },
  { id: "bugs",       label: "Known bugs",        active: true  },
  { id: "arch",       label: "Architecture ADRs", active: false },
  { id: "perf",       label: "Performance rules", active: false },
];

// ─── helpers ─────────────────────────────────────────────────────────────────
function countLinesAndChars(text: string) {
  const lines = text === "" ? 0 : text.split("\n").length;
  return { lines, chars: text.length };
}

// ─── sub-components ──────────────────────────────────────────────────────────
function LineGutter({ value }: { value: string }) {
  const lines = value === "" ? [""] : value.split("\n");
  return (
    <div
      aria-hidden="true"
      className="select-none text-right font-mono text-[12px] leading-[1.6] text-subtle pointer-events-none"
    >
      {lines.map((_, i) => (
        <div key={i} className="px-3 py-0">{i + 1}</div>
      ))}
    </div>
  );
}

function LanguageDropdown({
  value, onChange,
}: { value: Language; onChange: (v: Language) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-muted transition-colors duration-150 hover:border-brand/40 hover:text-ink"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {value}
        <ChevronDown size={11} className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          className="absolute left-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-md border border-brand/20 bg-surface-raised shadow-xl"
        >
          {LANGUAGES.map(lang => (
            <button
              key={lang}
              role="option"
              aria-selected={lang === value}
              type="button"
              onClick={() => { onChange(lang); setOpen(false); }}
              className={`w-full px-3 py-1.5 text-left font-mono text-[11px] uppercase tracking-[0.1em] transition-colors duration-100
                ${lang === value ? "bg-brand/15 text-brand" : "text-muted hover:bg-surface-strong hover:text-ink"}`}
            >
              {lang}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ModeToggle({
  mode, onChange,
}: { mode: InputMode; onChange: (m: InputMode) => void }) {
  return (
    <div className="flex rounded-md border border-line overflow-hidden">
      {(["Code", "Diff"] as InputMode[]).map(m => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors duration-150
            ${mode === m
              ? "bg-brand/20 text-brand"
              : "text-muted hover:text-ink hover:bg-surface-strong"}`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

function MemoryChips({
  sources, onToggle,
}: { sources: MemorySource[]; onToggle: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Memory sources to search">
      {sources.map(src => (
        <button
          key={src.id}
          type="button"
          onClick={() => onToggle(src.id)}
          aria-pressed={src.active}
          className={`memory-chip inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-all duration-150
            ${src.active
              ? "border-brand/35 bg-brand/10 text-brand hover:bg-brand/18"
              : "border-line bg-surface-low text-subtle hover:border-brand/20 hover:text-muted"}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full transition-colors duration-150 ${src.active ? "bg-brand" : "bg-subtle"}`}
            aria-hidden="true"
          />
          {src.label}
        </button>
      ))}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export function CodeEditorCard({ value, onChange, onSubmit, loading, submitLabel = "Analyze Code" }: CodeEditorCardProps) {
  const [language, setLanguage]           = useState<Language>("Auto-detect");
  const [mode, setMode]                   = useState<InputMode>("Code");
  const [memorySources, setMemorySources] = useState(INITIAL_MEMORY_SOURCES);
  const [focused, setFocused]             = useState(false);
  const textareaRef                       = useRef<HTMLTextAreaElement>(null);
  const fileInputRef                      = useRef<HTMLInputElement>(null);
  const gutterRef                         = useRef<HTMLDivElement>(null);

  const { lines, chars } = countLinesAndChars(value);
  const isEmpty = value.trim() === "";

  // keep gutter scroll in sync with textarea
  function syncScroll() {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }

  // ⌘/Ctrl+Enter
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !isEmpty && !loading) {
      e.preventDefault();
      onSubmit();
    }
  }

  // Clipboard paste
  const handlePasteBtn = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) onChange(text);
    } catch { /* permission denied — silently ignore */ }
    textareaRef.current?.focus();
  }, [onChange]);

  // File upload
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target?.result as string ?? "");
    reader.readAsText(file);
    e.target.value = "";
  }

  function toggleMemory(id: string) {
    setMemorySources(prev =>
      prev.map(s => (s.id === id ? { ...s, active: !s.active } : s))
    );
  }

  function loadSample() {
    onChange(mode === "Diff" ? SAMPLE_DIFF : SAMPLE_CODE);
    textareaRef.current?.focus();
  }

  return (
    <div className="space-y-4">

      {/* ── Editor surface ──────────────────────────────────────── */}
      <div
        className="rounded-xl border transition-all duration-150"
        style={{
          background: "#08151a",
          borderColor: focused ? "rgba(2,160,160,0.50)" : "rgba(2,160,160,0.15)",
          boxShadow: focused ? "0 0 0 3px rgba(2,160,160,0.10)" : "none",
        }}
      >
        {/* ── Header bar ────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between gap-3 border-b px-4 py-2.5"
          style={{ borderColor: "rgba(2,160,160,0.10)" }}
        >
          {/* Left */}
          <div className="flex items-center gap-3">
            <LanguageDropdown value={language} onChange={setLanguage} />
            <div className="h-3.5 w-px bg-line" aria-hidden="true" />
            <ModeToggle mode={mode} onChange={setMode} />
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* live counter */}
            <span
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-subtle"
              aria-live="polite"
              aria-atomic="true"
            >
              {lines} {lines === 1 ? "line" : "lines"} · {chars} chars
            </span>
            <div className="h-3.5 w-px bg-line" aria-hidden="true" />
            {/* action buttons */}
            <div className="flex items-center gap-0.5">
              {/* Paste */}
              <button
                type="button"
                onClick={handlePasteBtn}
                title="Paste from clipboard"
                aria-label="Paste from clipboard"
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[11px] text-muted transition-colors duration-150 hover:bg-surface-strong hover:text-ink"
              >
                <Clipboard size={12} />
                <span className="hidden sm:inline">Paste</span>
              </button>
              {/* Upload */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload file"
                aria-label="Upload file"
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[11px] text-muted transition-colors duration-150 hover:bg-surface-strong hover:text-ink"
              >
                <Upload size={12} />
                <span className="hidden sm:inline">Upload</span>
              </button>
              {/* Clear */}
              {!isEmpty && (
                <button
                  type="button"
                  onClick={() => onChange("")}
                  title="Clear editor"
                  aria-label="Clear editor"
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[11px] text-danger/60 transition-colors duration-150 hover:bg-danger/10 hover:text-danger"
                >
                  <X size={12} />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Editor body ─────────────────────────────────────────── */}
        <div className="relative flex" style={{ minHeight: "360px" }}>

          {/* Gutter */}
          <div
            ref={gutterRef}
            aria-hidden="true"
            className="flex-shrink-0 overflow-hidden py-4"
            style={{
              width: "3.25rem",
              borderRight: "1px solid rgba(2,160,160,0.10)",
            }}
          >
            <LineGutter value={value} />
          </div>

          {/* Textarea */}
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              id="code-input"
              aria-label="Code or diff to analyze"
              value={value}
              onChange={e => onChange(e.target.value)}
              onScroll={syncScroll}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              placeholder={mode === "Diff" ? "Paste a git diff here…" : "Paste a function, file, or git diff here…"}
              className="w-full resize-y bg-transparent font-mono text-[13px] leading-[1.6] text-ink caret-brand placeholder:text-subtle/50 focus:outline-none"
              style={{
                minHeight: "360px",
                padding: "1rem",
                /* Thin dark scrollbar */
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(2,160,160,0.25) transparent",
              }}
            />

            {/* Empty-state Load sample */}
            {isEmpty && (
              <div className="pointer-events-none absolute inset-0 flex items-end justify-start px-5 pb-5">
                <button
                  type="button"
                  onClick={loadSample}
                  className="pointer-events-auto memory-chip inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/8 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-brand/70 transition-all duration-150 hover:border-brand/50 hover:bg-brand/15 hover:text-brand"
                >
                  <Zap size={11} aria-hidden="true" />
                  Load sample {mode === "Diff" ? "diff" : "code"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Diff legend */}
        {mode === "Diff" && !isEmpty && (
          <div
            className="flex items-center gap-4 px-4 py-2 border-t"
            style={{ borderColor: "rgba(2,160,160,0.10)" }}
          >
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-success/80">
              <span className="inline-block h-2 w-2 rounded-sm bg-success/30 ring-1 ring-success/40" />
              + added
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-danger/80">
              <span className="inline-block h-2 w-2 rounded-sm bg-danger/30 ring-1 ring-danger/40" />
              − removed
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-brand/70">
              <span className="inline-block h-2 w-2 rounded-sm bg-brand/20 ring-1 ring-brand/30" />
              @@ hunk
            </span>
          </div>
        )}
      </div>

      {/* ── Memory sources ──────────────────────────────────────── */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <BrainCircuit size={13} className="text-brand/70" aria-hidden="true" />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Memory sources
          </span>
        </div>
        <MemoryChips sources={memorySources} onToggle={toggleMemory} />
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Helper text */}
        <div className="flex items-center gap-2 text-xs text-muted/70">
          <BrainCircuit size={13} className="shrink-0 text-brand/50" aria-hidden="true" />
          <span>ReVise will retrieve relevant engineering memory before review.</span>
        </div>

        {/* Analyze button */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={isEmpty || loading}
          aria-disabled={isEmpty || loading}
          aria-live="polite"
          style={{
            background: "linear-gradient(135deg, #02a0a0 0%, #0d7a7a 100%)",
            boxShadow: (!isEmpty && !loading) ? "0 0 20px rgba(2,160,160,0.20)" : "none",
          }}
          className={`inline-flex min-h-[40px] w-full items-center justify-center gap-2.5 rounded-lg px-5 py-2 font-display text-sm font-semibold tracking-[-0.01em] text-canvas transition-all duration-150 sm:w-auto
            ${(isEmpty || loading) ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:opacity-90"}`}
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
              Retrieving memory…
            </>
          ) : (
            <>
              <Zap size={15} aria-hidden="true" />
              {submitLabel}
              <kbd
                className="hidden rounded border border-canvas/20 bg-canvas/15 px-1.5 py-0.5 font-mono text-[10px] tracking-normal sm:inline-flex"
                title="Keyboard shortcut: Ctrl+Enter or Cmd+Enter"
              >
                ⌘↵
              </kbd>
            </>
          )}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".ts,.tsx,.js,.jsx,.py,.go,.java,.rs,.rb,.sql,.txt,.diff,.patch"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleFileChange}
      />
    </div>
  );
}
