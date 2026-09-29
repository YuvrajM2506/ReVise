export type MemoryType =
  | 'pr_review'
  | 'pipeline_failure'
  | 'incident'
  | 'post_mortem'
  | 'outcome_feedback'
  | 'standard';

export type FocusArea =
  | 'Unsafe DB migration'
  | 'Missing secret'
  | 'Dependency upgrade'
  | 'API contract change'
  | 'Configuration & Tooling'
  | 'General Review';

export interface MemoryMetadata {
  service: string;
  type: MemoryType;
  focus_areas?: string[];
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'SEV-1' | 'SEV-2' | 'SEV-3';
  author?: string;
  source_id?: string;
  commit_sha?: string;
  pull_request?: number;
  environment?: 'production' | 'staging' | 'dev';
  tags?: string[];
  confidence_score?: number;
  causal_parent_id?: string;
  causal_child_id?: string;
  [key: string]: any;
}

export interface MemoryItem {
  id: string;
  bank_id: string;
  title: string;
  type: MemoryType;
  service: string;
  timestamp: string; // ISO date string or formatted date
  relative_time?: string;
  content: string;
  relevance_note?: string;
  relevance_score?: number;
  metadata: MemoryMetadata;
  causal_links?: {
    preceded_by?: string[];
    caused_by?: string[];
    resolved_by?: string[];
    prevented_by?: string[];
  };
}

export interface MemoryRecallResult {
  memories: MemoryItem[];
  total_count: number;
  retrieval_latency_ms: number;
  query: string;
  bank_id: string;
  used_filters: {
    service?: string;
    focus_area?: string;
    tags?: string[];
  };
}

export interface MemoryRelevanceContext {
  service: string;
  files: Array<{ filename: string }>;
  diff_content: string;
  focus_areas: FocusArea[];
  language?: string;
  pr_title?: string;
}

export interface ExcludedMemoryItem {
  memory_id: string;
  title: string;
  reason: string;
}

export interface FilteredMemoriesResult {
  relevant: MemoryItem[];
  excluded: ExcludedMemoryItem[];
  total_retrieved: number;
  relevant_count: number;
  excluded_count: number;
}

export interface Finding {
  id: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  impact?: string;
  source_memory_ids?: string[];
}

export interface CICheckRecommendation {
  id: string;
  title: string;
  description: string;
  type: 'linter' | 'migration-guard' | 'secret-scan' | 'smoke-test';
  snippet?: string;
  enforcement_policy?: string;
}

export interface MemoryCitation {
  memory_id: string;
  title: string;
  type: MemoryType;
  date: string;
  relevance_note: string;
  relevance_score?: number;
  service: string;
}

export interface StructuredAnalysisOutput {
  risk_score: number; // 0 - 100
  risk_level: 'Low' | 'Medium' | 'High';
  provenance_note: string;
  findings: Finding[];
  ci_checks: CICheckRecommendation[];
  safer_rollout: string[];
  memory_citations: MemoryCitation[];
  why_recommendation: string;
  summary: string;
  memory_enabled: boolean;
}

export interface EvaluationRun {
  id: string;
  created_at: string;
  relative_time: string;
  status: 'HIGH RISK' | 'LEARNED' | 'RESOLVED' | 'SAFE' | 'MEDIUM RISK';
  title: string;
  service: string;
  environment: 'Production' | 'Staging' | 'Dev';
  policy: string;
  focus_areas: string[];
  code_snippet: string;
  file_name: string;
  language: string;
  memory_enabled: boolean;
  /**
   * How much was actually reviewed. Optional because runs persisted before
   * these counters existed are still readable — readers must tolerate absent
   * values rather than reporting a fabricated zero.
   */
  files_changed?: number;
  lines_changed?: number;
  retrieved_memories_count: number;
  retrieved_memory_ids: string[];
  relevant_memories_count?: number;
  excluded_memories_count?: number;
  output: StructuredAnalysisOutput;
  execution_latency_ms: number;
  changed_files?: Array<{ filename: string; additions: number; deletions: number; status?: string }>;
}

export interface CausalTimelineNode {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  type: 'CODE REVIEW' | 'PIPELINE FAILURE' | 'SEV-2 INCIDENT' | 'PROVEN RESOLUTION' | 'PREVENTED RISK';
  type_badge_color: 'purple' | 'red' | 'pink' | 'green' | 'cyan' | 'blue';
  service: string;
  is_active_pattern_member?: boolean;
  related_run_id?: string;
  details?: string;
}

export interface ActiveGuardrail {
  id: string;
  pattern_name: string;
  service: string;
  related_events_count: number;
  description: string;
  policy_title: string;
  policy_rules: string[];
  example_fix_snippet: string;
}

export interface TeachReViseInput {
  related_run_id: string;
  related_change_title: string;
  service: string;
  outcome: 'Failed in staging' | 'Shipped clean' | 'Rolled back' | 'Caught in review';
  root_cause: string;
  what_fixed_it: string;
  was_recommendation_helpful: 'Yes, it caught the risk early' | 'Partially helpful' | 'Not helpful';
}

export interface TeamStandard {
  id: string;
  title: string;
  description: string;
  service: string; // or 'all-services'
  category: 'Database' | 'Secrets' | 'Dependencies' | 'API Design' | 'Deployment';
  enforcement_level: 'Mandatory CI Check' | 'Recommended Review' | 'Strict Production Blocker';
  inferred_from: {
    source_ids: string[];
    incident_names: string[];
  };
  confidence_score: number; // 0-100
  rule_snippet?: string;
  updated_at: string;
}

export interface MemoryPulseData {
  total_memories: number;
  remediation_patterns_count: number;
  repeated_risks_count: number;
  growth_sparkline: number[];
  hindsight_connected: boolean;
  /** Timestamp of the most recent real memory activity, or null when none exists. */
  last_sync_timestamp: string | null;
  /** Which backend answered, filled in by /api/pulse from a live health check. */
  hindsight_mode?: 'live_cloud' | 'local_resilient';
}
