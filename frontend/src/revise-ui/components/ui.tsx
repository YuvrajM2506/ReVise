import { useState, type ButtonHTMLAttributes, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import type { Finding, Memory, MemoryEvidence as MemoryEvidenceType, RiskScore as RiskScoreType, TimelineEvent } from "../types";

const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

export function Heading({ level = 2, className, children }: { level?: 1 | 2 | 3 | 4; className?: string; children: ReactNode }) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  return <Tag className={cx("font-display tracking-[-0.03em] text-ink", className)}>{children}</Tag>;
}
export function Text({ as = "p", className, children }: { as?: "p" | "span" | "div" | "label"; className?: string; children: ReactNode }) {
  const Tag = as;
  return <Tag className={className}>{children}</Tag>;
}
export function Button({ variant = "primary", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return <button className={cx("button-motion inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40", variant === "primary" && "bg-brand text-canvas hover:bg-brand/85", variant === "secondary" && "border border-line bg-surface-raised text-ink hover:bg-surface-strong", variant === "ghost" && "text-muted hover:bg-brand-soft hover:text-ink", variant === "danger" && "bg-danger text-canvas", className)} {...props} />;
}
export function IconButton({ label, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return <Button variant="ghost" aria-label={label} title={label} className="size-9 px-0" {...props}>{children}</Button>;
}
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("reveal-card rounded-lg border border-line bg-surface p-4", className)} {...props} />;
}
export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "brand" | "warning" | "danger" | "success" }) {
  return <span className={cx("inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider", tone === "neutral" && "border-line bg-surface-low text-muted", tone === "brand" && "border-brand/25 bg-brand-soft text-brand", tone === "warning" && "border-attention/30 bg-attention/10 text-attention", tone === "danger" && "border-danger/30 bg-danger/10 text-danger", tone === "success" && "border-success/30 bg-success/10 text-success")}>{children}</span>;
}
export const StatusBadge = ({ status }: { status: string }) => <Badge tone={status === "Active" || status === "Complete" || status === "Connected" ? "success" : "neutral"}>{status}</Badge>;
export const SeverityBadge = ({ severity }: { severity: Finding["severity"] }) => <Badge tone={severity === "Critical" || severity === "High" ? "danger" : severity === "Medium" ? "warning" : "neutral"}>{severity}</Badge>;
export const RiskBadge = ({ level }: { level: RiskScoreType["level"] }) => <Badge tone={level === "High" ? "danger" : level === "Medium" ? "warning" : "brand"}>{level} risk</Badge>;
export function MetricCard({ label, value, detail }: { label: string; value: ReactNode; detail?: string }) {
  const match = typeof value === "string" ? value.match(/^(\d+)(%)?$/) : null;
  return <Card><Text className="text-xs font-medium uppercase tracking-wider text-muted">{label}</Text><Text as="div" className="metric-value mt-2 font-mono text-xl font-semibold text-brand">{match ? <span className="metric-count" aria-label={String(value)} data-suffix={match[2] ?? ""} style={{ "--metric-target": Number(match[1]) } as CSSProperties}/> : value}</Text>{detail && <Text className="mt-1 text-xs text-muted">{detail}</Text>}</Card>;
}
export function SectionHeader({ title, eyebrow, action }: { title: string; eyebrow?: string; action?: ReactNode }) {
  return <div className="mb-4 flex items-end justify-between gap-4"><div>{eyebrow && <Text className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-brand">{eyebrow}</Text>}<Heading level={2} className="text-lg">{title}</Heading></div>{action}</div>;
}
export function CodeBlock({ code }: { code: string }) { return <pre className="overflow-x-auto rounded-md border border-line bg-canvas p-4 font-mono text-xs leading-6 text-muted"><code>{code}</code></pre>; }
export function DiffViewer({ lines }: { lines: Array<{ kind: "add" | "remove" | "context"; value: string }> }) {
  return <div className="overflow-x-auto rounded-md border border-line bg-canvas py-2 font-mono text-xs">{lines.map((line, index) => <div key={index} className={cx("min-w-max px-4 py-0.5", line.kind === "add" && "bg-brand/10 text-brand", line.kind === "remove" && "bg-danger/10 text-danger", line.kind === "context" && "text-muted")}><span className="mr-4 inline-block w-5 select-none text-right opacity-50">{index + 1}</span>{line.kind === "add" ? "+" : line.kind === "remove" ? "-" : " "}{line.value}</div>)}</div>;
}
export function MemoryEvidence({ evidence }: { evidence: MemoryEvidenceType }) {
  return <div className="memory-match rounded-md border border-brand/25 bg-brand-soft p-3"><div className="mb-2 flex items-center justify-between gap-2"><Badge tone="brand">Memory match</Badge><span className="font-mono text-xs text-brand">{evidence.confidence}% confidence</span></div><div className="mb-3 h-1 overflow-hidden rounded-full bg-surface-strong"><div className="confidence-fill h-full bg-brand" style={{ width: `${evidence.confidence}%` }}/></div><Text className="text-sm font-medium text-ink">“{evidence.quote}”</Text><Text className="mt-2 text-xs leading-5 text-muted"><span className="text-ink">Why relevant:</span> {evidence.relevance}</Text><Text className="mt-2 font-mono text-[10px] uppercase text-muted">{evidence.source}{evidence.pr ? ` · PR #${evidence.pr}` : ""}</Text></div>;
}
export function FindingCard({ finding }: { finding: Finding }) {
  const [expanded, setExpanded] = useState(true);
  return <Card className="finding-motion space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap items-center gap-2"><SeverityBadge severity={finding.severity}/><span className="font-mono text-xs text-muted">{finding.file}:{finding.line}</span></div><Button variant="ghost" aria-expanded={expanded} onClick={() => setExpanded(value => !value)} className="min-h-7 px-2 py-1 text-xs">{expanded ? "Collapse" : "Details"}</Button></div><Heading level={3} className="text-sm">{finding.problem}</Heading><div className={cx("finding-details", !expanded && "is-collapsed")}><div className="space-y-3"><Text className="text-sm leading-6 text-muted"><span className="text-ink">Why it matters:</span> {finding.impact}</Text><Text className="text-sm leading-6 text-muted"><span className="text-ink">Suggested fix:</span> {finding.fix}</Text>{finding.memory && <MemoryEvidence evidence={finding.memory}/>}</div></div></Card>;
}
export function MemoryCard({ memory, onClick }: { memory: Memory; onClick?: () => void }) {
  return <Card className="cursor-pointer transition hover:border-brand/40" onClick={onClick}><div className="flex items-start justify-between gap-3"><Heading level={3} className="text-sm leading-5">{memory.title}</Heading><span className="font-mono text-xs text-brand">{memory.confidence}%</span></div><Text className="mt-2 text-sm leading-6 text-muted">{memory.content}</Text><div className="mt-3 flex flex-wrap gap-2"><Badge>{memory.category}</Badge><Badge tone="brand">used {memory.usageCount}×</Badge></div></Card>;
}
export function TimelineItem({ event }: { event: TimelineEvent }) {
  return <div className="timeline-entry relative grid grid-cols-[4rem_1fr] gap-4 pb-6 before:absolute before:bottom-0 before:left-[4.45rem] before:top-3 before:w-px before:origin-top before:bg-line last:before:hidden"><span className="font-mono text-xs text-muted">{event.time}</span><div className="relative pl-5 before:absolute before:left-0 before:top-1 before:size-2 before:rounded-full before:bg-brand"><Heading level={3} className="text-sm">{event.type}</Heading><Text className="mt-1 text-sm text-muted">{event.title}</Text>{event.source && <Text className="mt-2 font-mono text-[10px] uppercase text-muted">{event.source}{event.confidence ? ` · ${event.confidence}% confidence` : ""}</Text>}</div></div>;
}
export const RepositoryBadge = ({ name }: { name: string }) => <Badge tone="brand">{name}</Badge>;
export const PullRequestBadge = ({ number }: { number: number }) => <Badge>PR #{number}</Badge>;
export function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-canvas/80 p-4" role="dialog" aria-modal="true"><Card className="modal-motion max-h-[85vh] w-full max-w-xl overflow-y-auto bg-surface-raised"><div className="mb-4 flex items-center justify-between"><Heading level={2} className="text-lg">{title}</Heading><IconButton label="Close" onClick={onClose}>×</IconButton></div>{children}</Card></div>;
}
export function Drawer({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex justify-end bg-canvas/70" role="dialog" aria-modal="true"><div className="drawer-motion h-full w-full max-w-md overflow-y-auto border-l border-line bg-surface p-5"><div className="mb-5 flex items-center justify-between"><Heading level={2} className="text-lg">{title}</Heading><IconButton label="Close" onClick={onClose}>×</IconButton></div>{children}</div></div>;
}
export function Tabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (tab: string) => void }) {
  return <div className="flex gap-1 overflow-x-auto border-b border-line" role="tablist">{tabs.map(tab => <Button key={tab} role="tab" aria-selected={active === tab} variant="ghost" onClick={() => onChange(tab)} className={cx("shrink-0 rounded-none border-b-2", active === tab ? "border-brand text-ink" : "border-transparent")}>{tab}</Button>)}</div>;
}
export function Toast({ message }: { message?: string }) { return message ? <div className="toast-motion fixed bottom-5 right-5 z-50 rounded-md border border-brand/30 bg-surface-raised px-4 py-3 text-sm text-ink">{message}</div> : null; }
export function Tooltip({ label, children }: { label: string; children: ReactNode }) { return <span title={label}>{children}</span>; }
export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) { return <Card className="grid min-h-48 place-items-center text-center"><div><Heading level={3} className="text-base">{title}</Heading><Text className="mx-auto mt-2 max-w-md text-sm text-muted">{detail}</Text>{action && <div className="mt-4">{action}</div>}</div></Card>; }
export function LoadingState({ label = "Loading…" }: { label?: string }) { return <Card className="loading-shimmer flex min-h-40 items-center justify-center gap-3 text-sm text-muted"><span className="size-3 animate-pulse rounded-full bg-brand"/>{label}</Card>; }
export function TypingIndicator({ label = "ReVise is thinking with memory" }: { label?: string }) { return <div className="message-motion flex items-center gap-2 rounded-md bg-surface-raised p-3 text-xs text-muted" role="status"><span>{label}</span><span className="flex gap-1" aria-hidden="true"><span className="typing-dot size-1 rounded-full bg-brand"/><span className="typing-dot size-1 rounded-full bg-brand"/><span className="typing-dot size-1 rounded-full bg-brand"/></span></div>; }
export function ErrorState({ title, onRetry }: { title: string; onRetry?: () => void }) { return <Card className="border-danger/30 text-center"><Heading level={3} className="text-base">{title}</Heading>{onRetry && <Button className="mt-4" onClick={onRetry}>Try again</Button>}</Card>; }
export function RiskScore({ risk }: { risk: RiskScoreType }) { return <div className="flex min-w-48 items-center gap-3"><span className="font-mono text-xs font-semibold">RISK {risk.score} / 100</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-strong"><div className={cx("risk-fill h-full bg-brand", risk.level === "High" && "bg-danger", risk.level === "Medium" && "bg-attention")} style={{ width: `${risk.score}%` }}/></div><RiskBadge level={risk.level}/></div>; }
export function EngineeringSignal({ label, value, trend }: { label: string; value: string; trend: string }) { return <div className="flex items-center justify-between border-b border-line py-3 last:border-0"><div><Text className="text-sm text-ink">{label}</Text><Text className="mt-1 text-xs text-muted">{trend}</Text></div><span className="font-mono text-sm text-brand">{value}</span></div>; }
export function RecommendationCard({ title, detail }: { title: string; detail: string }) { return <Card className="border-attention/25"><Badge tone="warning">Recommended</Badge><Heading level={3} className="mt-3 text-sm">{title}</Heading><Text className="mt-2 text-sm leading-6 text-muted">{detail}</Text></Card>; }
export function Input(props: InputHTMLAttributes<HTMLInputElement>) { return <input className="h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm text-ink placeholder:text-muted/60 focus:border-brand" {...props}/>; }
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) { return <select className="h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm text-ink focus:border-brand" {...props}/>; }
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className="min-h-28 w-full resize-y rounded-md border border-line bg-canvas p-3 text-sm text-ink placeholder:text-muted/60 focus:border-brand" {...props}/>; }
