export type RiskLevel = "Low" | "Medium" | "High";
export interface Repository { id: string; owner: string; name: string; branch: string; visibility: "Public" | "Private" }
export interface Developer { id: string; name: string; handle: string; avatar?: string }
export interface PullRequest { id: string; number: number; title: string; author: Developer; repository: Repository; status: "Open" | "Merged" | "Closed"; filesChanged: number; linesChanged: number }
export interface RiskScore { score: number; level: RiskLevel }
export interface MemoryEvidence { id: string; quote: string; source: "Previous Review" | "Team Standard" | "Previous Decision" | "Historical Outcome"; pr?: number; confidence: number; relevance: string }
export interface Finding { id: string; severity: "Critical" | "High" | "Medium" | "Low"; file: string; line: number; problem: string; impact: string; fix: string; memory?: MemoryEvidence }
export interface Review { id: string; pullRequest: PullRequest; risk: RiskScore; status: "Complete" | "Running" | "Failed"; summary: string; findings: Finding[]; memories: MemoryEvidence[]; createdAt: string }
export interface Memory { id: string; title: string; content: string; category: "Coding Standard" | "Architecture Decision" | "Review Preference" | "Security Rule" | "Performance Rule" | "Team Convention" | "Historical Outcome"; source: string; confidence: number; date: string; repository: string; usageCount: number; reinforcements: string[] }
export interface EngineeringStandard { id: string; title: string; description: string; category: "Engineering" | "Security" | "Performance" | "Architecture" | "Team Preferences"; source: string; confidence: number; lastReinforced: string; usageCount: number }
export interface TimelineEvent { id: string; type: "PR Reviewed" | "Memory Learned" | "Memory Reinforced" | "CI Failed" | "Review Accepted" | "PR Merged" | "Developer Taught ReVise"; time: string; title: string; detail: string; source?: string; confidence?: number }
