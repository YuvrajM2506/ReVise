export type RiskLevel = "Low" | "Medium" | "High";
export interface Repository { id: string; owner: string; name: string; branch: string; visibility: "Public" | "Private" }
export interface Developer { id: string; name: string; handle: string; avatar?: string }
export interface PullRequest { id: string; number: number; title: string; author: Developer; repository: Repository; status: "Open" | "Merged" | "Closed"; filesChanged: number; linesChanged: number }
export interface RiskScore { score: number; level: RiskLevel }
export interface MemoryEvidence { id: string; quote: string; source: "Previous Review" | "Team Standard" | "Previous Decision" | "Historical Outcome"; pr?: number; confidence: number; relevance: string }
export interface Finding { id: string; severity: "Critical" | "High" | "Medium" | "Low"; file: string; line: number; problem: string; impact: string; fix: string; memory?: MemoryEvidence }
export interface CICheck { id: string; title: string; description: string; type: string; snippet?: string }
export type SettingsSections = Record<string, Record<string, string>>;
/**
 * A rendered review. The optional fields below are returned by the analyze
 * routes but were previously dropped by the mapper, which left the report page
 * to invent its own values. They stay optional because runs stored before the
 * routes recorded them carry none of this data.
 */
export interface Review {
  id: string;
  pullRequest: PullRequest;
  risk: RiskScore;
  status: "Complete" | "Running" | "Failed";
  summary: string;
  findings: Finding[];
  memories: MemoryEvidence[];
  createdAt: string;
  service?: string;
  language?: string;
  provenanceNote?: string;
  whyRecommendation?: string;
  saferRollout?: string[];
  ciChecks?: CICheck[];
  memoryEnabled?: boolean;
  /** Per-file detail and memory counters as persisted by the analyze routes. */
  changedFiles?: Array<{ filename: string; additions: number; deletions: number; status?: string }>;
  totalRetrievedMemories?: number;
  relevantMemoriesCount?: number;
  excludedMemoriesCount?: number;
}
export interface Memory { id: string; title: string; content: string; category: "Coding Standard" | "Architecture Decision" | "Review Preference" | "Security Rule" | "Performance Rule" | "Team Convention" | "Historical Outcome"; source: string; confidence: number; date: string; repository: string; usageCount: number; reinforcements: string[] }
export interface EngineeringStandard { id: string; title: string; description: string; category: "Engineering" | "Security" | "Performance" | "Architecture" | "Team Preferences"; source: string; confidence: number; lastReinforced: string; usageCount: number }
export interface TimelineEvent { id: string; type: "PR Reviewed" | "Memory Learned" | "Memory Reinforced" | "CI Failed" | "Review Accepted" | "PR Merged" | "Developer Taught ReVise"; time: string; title: string; detail: string; source?: string; confidence?: number }
