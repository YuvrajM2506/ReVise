import { demoReview, memories, standards, timeline } from "../mocks/data";
import type { EngineeringStandard, Memory, Review, TimelineEvent } from "../types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { headers: { "Content-Type": "application/json" }, ...init });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return response.json() as Promise<T>;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (body && typeof body.error === "string" && body.error.trim() !== "") return body.error;
  } catch {
    // Non-JSON error body; fall through to the status text.
  }
  return `Request failed with status ${response.status}`;
}

const GITHUB_OWNER_PATTERN = "[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?";
const GITHUB_REPO_PATTERN = "[A-Za-z0-9._-]+";

const REFERENCE_PATTERNS: RegExp[] = [
  // https://github.com/owner/repo/pull/123 (scheme optional; tolerates /files, ?query and #fragment suffixes)
  new RegExp(`^(?:https?://)?(?:www\\.)?github\\.com/(${GITHUB_OWNER_PATTERN})/(${GITHUB_REPO_PATTERN})/pull/(\\d+)(?:[/?#].*)?$`, "i"),
  // owner/repo PR #123 | owner/repo · PR 123 | owner/repo#123
  new RegExp(`^(${GITHUB_OWNER_PATTERN})/(${GITHUB_REPO_PATTERN})\\s*(?:[·,-]\\s*)?(?:PR\\s*#?\\s*|#)(\\d+)\\b`, "i"),
];

export interface GitHubReference {
  owner: string;
  repo: string;
  pullNumber: number;
}

export function parseGitHubReference(reference: string): GitHubReference {
  const candidate = (reference || "").trim();
  for (const pattern of REFERENCE_PATTERNS) {
    const match = candidate.match(pattern);
    if (!match) continue;
    const pullNumber = Number(match[3]);
    if (Number.isInteger(pullNumber) && pullNumber > 0) {
      return { owner: match[1], repo: match[2], pullNumber };
    }
  }
  throw new Error("Use a GitHub pull request URL such as https://github.com/owner/repository/pull/12, or owner/repository · PR 12.");
}

function mapMemoryCitation(m: any) {
  const type = String(m.type || "");
  const source = type === "standard" ? "Team Standard" : type === "pr_review" ? "Previous Review" : type === "outcome_feedback" ? "Historical Outcome" : "Previous Decision";
  return {
    id: m.memory_id || m.id,
    quote: m.relevance_note || m.content || m.title,
    source,
    pr: m.metadata?.pull_request,
    confidence: Math.round((m.relevance_score || 0.9) * 100),
    relevance: m.relevance_note || "Relevant engineering memory retrieved by ReVise.",
  };
}

function mapRunToReview(run: any, reference = "ReVise", meta?: { filesChanged?: number; linesChanged?: number; changedFiles?: any[]; totalRetrievedMemories?: number; relevantMemoriesCount?: number; excludedMemoriesCount?: number }) : Review {
  const output = run.output || {};
  const riskLevel = output.risk_level || (run.status === "HIGH RISK" ? "High" : run.status === "MEDIUM RISK" ? "Medium" : "Low");
  const findings = (output.findings || []).map((f: any, i: number) => ({
    id: f.id || `finding-${i}`,
    severity: ({ HIGH: "High", MEDIUM: "Medium", LOW: "Low" } as any)[String(f.severity || "MEDIUM")] || "Medium",
    file: f.file || run.file_name || "changed file",
    line: f.line || 0,
    problem: f.title || f.description || "Review finding",
    impact: f.impact || "Potential engineering risk identified by the review.",
    fix: f.description || "Review the finding and apply the recommended remediation.",
  }));
  const memoriesMapped = (output.memory_citations || []).map(mapMemoryCitation);
  const filesChanged = meta?.filesChanged ?? run.files_changed ?? (run.changed_files ? run.changed_files.length : (run.file_name ? 1 : 0));
  const linesChanged = meta?.linesChanged ?? run.lines_changed ?? 0;
  const changedFiles = meta?.changedFiles ?? run.changed_files ?? (run.file_name ? [{ filename: run.file_name, additions: 0, deletions: 0 }] : []);
  const totalRetrievedMemories = meta?.totalRetrievedMemories ?? run.retrieved_memories_count ?? (run.retrieved_memory_ids?.length || 0);
  const relevantMemoriesCount = meta?.relevantMemoriesCount ?? run.relevant_memories_count ?? memoriesMapped.length;
  const excludedMemoriesCount = meta?.excludedMemoriesCount ?? run.excluded_memories_count ?? 0;

  return {
    id: run.id,
    pullRequest: {
      id: run.id,
      number: Number((run.title || "").match(/#(\d+)/)?.[1] || 0),
      title: run.title || reference,
      author: { id: "revise", name: "ReVise", handle: "ReVise" },
      repository: { id: "repo", owner: reference.split("/")[0] || "local", name: reference.split("/")[1]?.split(" ")[0] || "repository", branch: "main", visibility: "Public" },
      status: "Open",
      filesChanged,
      linesChanged,
    },
    risk: { score: Number(output.risk_score || 0), level: riskLevel as any },
    status: run.status === "HIGH RISK" || run.status === "MEDIUM RISK" ? "Complete" : "Complete",
    summary: output.summary || "ReVise completed a memory-informed code review.",
    findings,
    memories: memoriesMapped,
    totalRetrievedMemories,
    relevantMemoriesCount,
    excludedMemoriesCount,
    saferRollout: output.safer_rollout || [],
    whyRecommendation: output.why_recommendation || "",
    changedFiles,
    createdAt: run.created_at || new Date().toISOString(),
  };
}

export async function analyzePullRequest(reference: string): Promise<Review> {
  const { owner, repo, pullNumber } = parseGitHubReference(reference);
  const result = await request<any>("/api/github/analyze", {
    method: "POST",
    body: JSON.stringify({ owner, repo, pullNumber, memoryEnabled: true, postToGitHub: false }),
  });
  if (!result.success) throw new Error(result.error || "GitHub review failed");
  return mapRunToReview(result.run, `${owner}/${repo}`, {
    filesChanged: result.files_analyzed_count,
    linesChanged: result.lines_changed,
    changedFiles: result.files,
    totalRetrievedMemories: result.retrieved_memories_count,
    relevantMemoriesCount: result.relevant_memories_count,
    excludedMemoriesCount: result.excluded_memories_count,
  });
}

export async function analyzeCode(code: string): Promise<Review> {
  const result = await request<any>("/api/analyze", {
    method: "POST",
    body: JSON.stringify({
      pr_title: "Code analysis",
      service: "local-code",
      environment: "Production",
      policy: "Strict production policy",
      focus_areas: ["General Review"],
      code_snippet: code,
      file_name: "snippet.ts",
      language: "TypeScript",
      memory_enabled: true,
    }),
  });
  if (!result.success) throw new Error(result.error || "Code analysis failed");
  return mapRunToReview(result.run, "local-code");
}

export async function teachMemory(input: Partial<Memory>): Promise<Memory> {
  const result = await request<any>("/api/teach", {
    method: "POST",
    body: JSON.stringify({
      related_run_id: `manual-${Date.now()}`,
      related_change_title: input.title || "Developer-taught memory",
      service: input.repository || "general",
      outcome: "Caught in review",
      root_cause: input.content || "",
      what_fixed_it: input.content || "",
      was_recommendation_helpful: "Yes, it caught the risk early",
    }),
  });
  if (!result.success) throw new Error(result.error || "Could not teach ReVise");
  return {
    id: result.memory_id,
    title: input.title || "New engineering memory",
    content: input.content || "",
    category: input.category || "Team Convention",
    source: "Developer taught",
    confidence: result.confidence_score || input.confidence || 90,
    date: "Just now",
    repository: input.repository || "ReVise",
    usageCount: 0,
    reinforcements: [],
  };
}

export const getMemories = async (): Promise<Memory[]> => {
  try { return await request("/api/memory"); } catch { return memories; }
};

export const getTimeline = async (): Promise<TimelineEvent[]> => {
  try {
    const result = await request<any>("/api/timeline");
    return (result.timeline || []).map((n: any) => ({
      id: n.id, type: "Memory Reinforced", time: n.date, title: n.title, detail: n.subtitle, source: n.service, confidence: 90,
    }));
  } catch { return timeline; }
};

export const getStandards = async (): Promise<EngineeringStandard[]> => {
  try {
    const result = await request<any>("/api/standards");
    return (result.standards || []).map((s: any) => ({
      id: s.id, title: s.title, description: s.description,
      category: s.category === "Database" || s.category === "Secrets" ? "Security" : s.category === "API Design" ? "Architecture" : s.category === "Deployment" ? "Performance" : "Engineering",
      source: s.inferred_from?.incident_names?.[0] || "ReVise memory",
      confidence: s.confidence_score || 85,
      lastReinforced: s.updated_at || "Recently",
      usageCount: s.inferred_from?.source_ids?.length || 0,
    }));
  } catch { return standards; }
};

export async function sendPairMessage(message: string): Promise<string> {
  try {
    const result = await request<{ message: string }>("/api/aider/chat", { method: "POST", body: JSON.stringify({ message }) });
    return result.message;
  } catch { return "ReVise could not reach the memory-aware pair assistant. Check the Next.js server and try again."; }
}

export async function saveSettings(settings: Record<string, unknown>): Promise<void> {
  await request("/api/settings", { method: "PUT", body: JSON.stringify(settings) });
}
