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
  placeholder = "Ask ReVise about this code...",
}: ChatComposerProps) {
  const [text, setText] = useState("");
  const [attachFile, setAttachFile] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const clamped = Math.min(Math.max(el.scrollHeight, 56), 156);
    el.style.height = `${clamped}px`;
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
      textareaRef.current.style.height = "56px";
    }
  };

  const handleQuickAction = (prompt: string) => {
    if (loading || disabled) return;
    onSend(prompt, attachFile);
  };

  const isSendDisabled = !text.trim() || loading || disabled;

  return (
    <div className="relative shrink-0 border-t border-[rgba(2,160,160,0.12)] bg-[#0e2229]">
      {/* Gradient fade so messages scroll cleanly beneath */}
      <div
        className="pointer-events-none absolute -top-8 left-0 right-0 h-8"
        style={{
          background:
            "linear-gradient(to top, #0e2229 0%, rgba(14,34,41,0.7) 50%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      <div className="px-3.5 pt-3 pb-3.5 sm:px-4">
        {/* Quick Action Chips + File Attach Toggle */}
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
                  className="group inline-flex items-center gap-1.5 rounded-full border border-[rgba(2,160,160,0.18)] bg-[#0b1b20] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[#8ca0a8] transition-all duration-150 hover:border-[rgba(2,160,160,0.45)] hover:bg-[rgba(2,160,160,0.1)] hover:text-[#f2f5f4] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon size={10} className="text-[#02a0a0] transition-transform duration-150 group-hover:scale-110" />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>

          {activeFile && (
            <button
              type="button"
              onClick={() => setAttachFile((prev) => !prev)}
              aria-pressed={attachFile}
              title={attachFile ? `Including ${activeFile} as context` : `Click to include ${activeFile}`}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] transition-all duration-150 ${
                attachFile
                  ? "border-[rgba(2,160,160,0.4)] bg-[rgba(2,160,160,0.12)] text-[#02a0a0]"
                  : "border-[rgba(2,160,160,0.12)] bg-[#0b1b20] text-[#63777d] hover:text-[#8ca0a8]"
              }`}
            >
              <Paperclip size={10} className={attachFile ? "text-[#02a0a0]" : "text-[#63777d]"} />
              <span className="truncate max-w-[120px]">{activeFile}</span>
              {attachFile && <Check size={10} className="text-[#02a0a0] shrink-0" />}
            </button>
          )}
        </div>

        {/* Composer Box */}
        <form onSubmit={handleSubmit}>
          <div
            className={`relative rounded-xl border bg-[#08151a] transition-all duration-150 ${
              isSendDisabled
                ? "border-[rgba(2,160,160,0.12)]"
                : "border-[rgba(2,160,160,0.3)] hover:border-[rgba(2,160,160,0.5)] focus-within:border-[rgba(2,160,160,0.7)] focus-within:shadow-[0_0_0_1px_rgba(2,160,160,0.25)]"
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
              aria-label="Chat message input"
              className="w-full resize-none bg-transparent px-3.5 pt-3 pb-11 text-sm leading-6 text-[#f2f5f4] placeholder:text-[#63777d] focus:outline-none"
              style={{ minHeight: "56px", maxHeight: "156px" }}
            />

            {/* Bottom Bar inside Composer */}
            <div className="absolute bottom-2.5 left-3 right-2.5 flex items-center justify-between pointer-events-none">
              <span className="select-none font-mono text-[10px] text-[#63777d]" aria-hidden="true">
                {String.fromCharCode(8629)} send {String.fromCharCode(183)} {String.fromCharCode(8679)}{String.fromCharCode(8629)} newline
              </span>

              <button
                type="submit"
                disabled={isSendDisabled}
                aria-label="Send message"
                className={`pointer-events-auto inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs font-semibold transition-all duration-150 active:scale-95 ${
                  isSendDisabled
                    ? "cursor-not-allowed bg-[#112830] text-[#63777d]"
                    : "bg-[#02a0a0] text-[#08151a] hover:bg-[#62baba] hover:shadow-[0_0_14px_rgba(2,160,160,0.4)]"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Thinking...</span>
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
    </div>
  );
}
