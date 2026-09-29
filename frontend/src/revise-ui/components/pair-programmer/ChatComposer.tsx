"use client";

import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  Send,
  Loader2,
  Paperclip,
  Check,
  Sparkles,
  HelpCircle,
  ShieldAlert,
  Wrench,
  BookOpen,
} from "lucide-react";

interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon: typeof Sparkles;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "explain",
    label: "Explain this",
    prompt: "Can you explain how this code works and what risks ReVise detected?",
    icon: HelpCircle,
  },
  {
    id: "incidents",
    label: "Find related incidents",
    prompt: "What past incidents, PRs, or team memories relate to this pattern?",
    icon: ShieldAlert,
  },
  {
    id: "fix",
    label: "Suggest a fix",
    prompt: "How should I refactor this code to address the findings safely?",
    icon: Wrench,
  },
  {
    id: "standards",
    label: "Check against standards",
    prompt: "Does this implementation comply with our team's engineering standards and ADRs?",
    icon: BookOpen,
  },
];

export interface ChatComposerProps {
  onSend: (message: string, attachFile: boolean) => void;
  loading?: boolean;
  disabled?: boolean;
  activeFile?: string;
  placeholder?: string;
}

export function ChatComposer({
  onSend,
  loading = false,
  disabled = false,
  activeFile = "session.ts",
  placeholder = "Ask ReVise about this code…",
}: ChatComposerProps) {
  const [text, setText] = useState("");
  const [attachFile, setAttachFile] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height between min 48px and max 160px
  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const newHeight = Math.min(Math.max(el.scrollHeight, 48), 160);
    el.style.height = `${newHeight}px`;
  };

  useEffect(() => {
    adjustHeight();
  }, [text]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const clean = text.trim();
    if (!clean || loading || disabled) return;
    onSend(clean, attachFile);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "48px";
    }
  };

  const handleQuickAction = (actionPrompt: string) => {
    if (loading || disabled) return;
    onSend(actionPrompt, attachFile);
  };

  const isSendDisabled = !text.trim() || loading || disabled;

  return (
    <div className="relative border-t border-line bg-surface/95 backdrop-blur-md p-3.5 sm:p-4">
      {/* Soft gradient fade so messages scroll cleanly underneath */}
      <div
        className="pointer-events-none absolute -top-5 left-0 right-0 h-5 bg-gradient-to-t from-surface via-surface/60 to-transparent"
        aria-hidden="true"
      />

      {/* Quick Action Chips & File Attachment */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="Quick prompts">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => handleQuickAction(action.prompt)}
                disabled={loading || disabled}
                className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-low/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted transition-all duration-150 hover:border-brand/40 hover:bg-brand-soft hover:text-ink disabled:opacity-40"
              >
                <Icon size={11} className="text-brand group-hover:scale-110 transition-transform" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active file attach toggle */}
        {activeFile && (
          <button
            type="button"
            onClick={() => setAttachFile((prev) => !prev)}
            aria-pressed={attachFile}
            title={attachFile ? `Including ${activeFile} as context` : `Click to include ${activeFile}`}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] transition-all duration-150 ${
              attachFile
                ? "border-brand/40 bg-brand/10 text-brand"
                : "border-line bg-surface-low text-subtle hover:text-muted"
            }`}
          >
            <Paperclip size={10} className={attachFile ? "text-brand" : "text-muted"} />
            <span className="truncate max-w-[120px]">{activeFile}</span>
            {attachFile && <Check size={10} className="text-brand" />}
          </button>
        )}
      </div>

      {/* Main Composer Box */}
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`relative rounded-xl border bg-[#08151a] p-2 transition-all duration-150 shadow-inner ${
            isSendDisabled ? "border-line" : "border-brand/30 hover:border-brand/50 focus-within:border-brand/70 focus-within:ring-1 focus-within:ring-brand/40"
          }`}
        >
          <label htmlFor="pair-programmer-input" className="sr-only">
            Ask ReVise about this code
          </label>
          <textarea
            id="pair-programmer-input"
            ref={textareaRef}
            rows={2}
            value={text}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            className="w-full resize-none bg-transparent px-2 pt-1 pb-9 text-sm leading-6 text-ink placeholder:text-muted/60 focus:outline-none"
          />

          {/* Bottom Bar inside Composer */}
          <div className="absolute bottom-2 left-3 right-2 flex items-center justify-between pointer-events-none">
            {/* Keyboard shortcut hint */}
            <span className="font-mono text-[10px] text-subtle select-none">
              ↵ send · ⇧↵ newline
            </span>

            {/* Send Button */}
            <button
              type="submit"
              disabled={isSendDisabled}
              aria-label="Send message"
              className="pointer-events-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-[#08151a] transition-all duration-150 hover:bg-brand-light hover:shadow-[0_0_12px_rgba(2,160,160,0.35)] active:scale-95 disabled:cursor-not-allowed disabled:bg-surface-strong disabled:text-subtle disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Thinking…</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <Send size={12} />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
