import type { EngineeringStandard, Memory, Review, TimelineEvent } from "../types";

export const memories: Memory[] = [
  { id: "m1", title: "Authentication validation order", content: "Authentication middleware validates session state before mutation.", category: "Security Rule", source: "PR #42", confidence: 94, date: "2 days ago", repository: "YuvrajM2506/ReVise", usageCount: 17, reinforcements: ["PR #51", "PR #73"] },
  { id: "m2", title: "Keep review handlers idempotent", content: "Review retries must not create duplicate findings or timeline events.", category: "Architecture Decision", source: "Team standard", confidence: 89, date: "5 days ago", repository: "YuvrajM2506/ReVise", usageCount: 11, reinforcements: ["PR #39", "PR #68"] },
  { id: "m3", title: "Recall before generation", content: "Retrieve repository-specific engineering context before prompting the review model.", category: "Coding Standard", source: "Previous decision", confidence: 96, date: "1 week ago", repository: "YuvrajM2506/ReVise", usageCount: 24, reinforcements: ["PR #42", "PR #66", "PR #73"] },
];

const repository = { id: "repo-1", owner: "YuvrajM2506", name: "ReVise", branch: "main", visibility: "Public" as const };
const author = { id: "dev-1", name: "Yuvraj Mehta", handle: "YuvrajM2506" };
const evidence = { id: "e1", quote: "Authentication middleware validates session state before mutation.", source: "Previous Review" as const, pr: 42, confidence: 94, relevance: "This change mutates user session state before the authentication guard completes." };

export const demoReview: Review = {
  id: "review-42",
  pullRequest: { id: "pr-42", number: 42, title: "Harden session recall and review pipeline", author, repository, status: "Open", filesChanged: 3, linesChanged: 184 },
  risk: { score: 24, level: "Low" },
  status: "Complete",
  summary: "The change improves memory recall precision and keeps the review path focused. One authentication ordering issue should be resolved before merge.",
  createdAt: "Today, 09:42",
  memories: [
    evidence,
    { id: "e2", quote: "Review retries must remain idempotent.", source: "Team Standard", confidence: 89, relevance: "The updated review handler can retry after a provider timeout." },
    { id: "e3", quote: "Repository memory must be retrieved before generation.", source: "Previous Decision", pr: 31, confidence: 96, relevance: "The new recall sequence directly implements this architectural decision." },
    { id: "e4", quote: "Emit timeline events only after persistence succeeds.", source: "Historical Outcome", pr: 28, confidence: 87, relevance: "A previous incident showed phantom events after failed writes." },
  ],
  findings: [
    { id: "f1", severity: "High", file: "src/auth/session.ts", line: 142, problem: "Session validation occurs after state mutation", impact: "An invalid session can alter request state before the request is rejected.", fix: "Move validateSession before applySessionMutation and return early on failure.", memory: evidence },
    { id: "f2", severity: "Medium", file: "src/api/review.ts", line: 88, problem: "Retry path can persist duplicate findings", impact: "Provider retries may inflate finding and usage counts.", fix: "Use the review request ID as an idempotency key." },
    { id: "f3", severity: "Low", file: "src/memory/recall.ts", line: 64, problem: "Recall threshold is not repository-configurable", impact: "Teams with sparse memory may receive too little historical context.", fix: "Read the threshold from repository review preferences." },
  ],
};

export const timeline: TimelineEvent[] = [
  { id: "t1", type: "Memory Reinforced", time: "09:42", title: "Authentication validation must happen before mutation.", detail: "Matched during review", source: "PR #73", confidence: 94 },
  { id: "t2", type: "PR Reviewed", time: "09:31", title: "Harden session recall and review pipeline", detail: "3 findings created", source: "PR #42" },
  { id: "t3", type: "Memory Learned", time: "Yesterday", title: "Review retries must remain idempotent.", detail: "Learned from accepted feedback", source: "Team standard", confidence: 89 },
];

export const standards: EngineeringStandard[] = [
  { id: "s1", title: "Authentication validation order", description: "Validate session state before any mutation.", category: "Security", source: "PR #42", confidence: 94, lastReinforced: "2 days ago", usageCount: 17 },
  { id: "s2", title: "Idempotent review pipeline", description: "Retries cannot duplicate review artifacts.", category: "Architecture", source: "Team standard", confidence: 89, lastReinforced: "5 days ago", usageCount: 11 },
  { id: "s3", title: "Recall before generation", description: "Retrieve relevant memory before model generation.", category: "Engineering", source: "Previous decision", confidence: 96, lastReinforced: "Today", usageCount: 24 },
];
