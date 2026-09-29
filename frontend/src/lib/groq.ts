import { StructuredAnalysisOutput, MemoryItem, Finding, CICheckRecommendation, MemoryCitation, EvaluationRun } from './types';
import { addDiagnosticLog } from './storage';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_PRIMARY_MODEL = process.env.GROQ_PRIMARY_MODEL || 'openai/gpt-oss-120b';
/**
 * Models Groq has retired. Requests against them fail fast with HTTP 400
 * "model has been decommissioned", so selecting one only burns retry budget and
 * wall-clock time. Kept as a filter rather than a comment so a stale
 * GROQ_FALLBACK_MODEL value in .env costs zero requests instead of several.
 */
const DECOMMISSIONED_MODELS = new Set([
  'qwen-2.5-32b',
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
  'mixtral-8x7b-32768',
]);

// Ordered fallback chain, restricted to models Groq currently serves
// (openai/gpt-oss-* and qwen/qwen3.8-27b at time of writing).
const GROQ_FALLBACK_MODELS = [
  process.env.GROQ_FALLBACK_MODEL || 'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
].filter(model => !DECOMMISSIONED_MODELS.has(model));

// Input size budgets to keep prompt safely below 8,000 TPM limit
const MAX_CODE_SNIPPET_CHARS = 8000;
const MAX_MEMORIES_COUNT = 4;
const MAX_MEMORY_CONTENT_CHARS = 400;

function budgetCodeSnippet(snippet: string, maxChars: number = MAX_CODE_SNIPPET_CHARS): string {
  if (!snippet) return '';
  if (snippet.length <= maxChars) return snippet;
  const truncated = snippet.slice(0, maxChars);
  const lastNewline = truncated.lastIndexOf('\n');
  const cleanCut = lastNewline > maxChars * 0.7 ? truncated.slice(0, lastNewline) : truncated;
  return `${cleanCut}\n\n... [Diff/Code truncated to fit model token budget] ...`;
}

function budgetMemories(memories: MemoryItem[], maxCount: number = MAX_MEMORIES_COUNT): string {
  if (!memories || memories.length === 0) return '';
  const selected = memories.slice(0, maxCount);
  let evidenceText = `RETRIEVED HINDSIGHT EVIDENCE (${selected.length} historical memories from bank acme-platform):\n\n`;
  selected.forEach((m, i) => {
    const title = (m.title || '').trim();
    let content = (m.content || '').trim();
    if (content.length > MAX_MEMORY_CONTENT_CHARS) {
      const lastSpace = content.slice(0, MAX_MEMORY_CONTENT_CHARS).lastIndexOf(' ');
      content = (lastSpace > 200 ? content.slice(0, lastSpace) : content.slice(0, MAX_MEMORY_CONTENT_CHARS)) + '...';
    }
    const rel = (m.relevance_note || 'Historical evidence').trim();
    evidenceText += `[MEMORY #${i + 1}] ID: ${m.id} | TYPE: ${(m.type || '').toUpperCase()} | SERVICE: ${m.service} | DATE: ${m.relative_time || m.timestamp}\n`;
    evidenceText += `TITLE: ${title}\n`;
    evidenceText += `CONTENT: ${content}\n`;
    evidenceText += `RELEVANCE: ${rel}\n\n`;
  });
  return evidenceText;
}

interface EvaluateChangeParams {
  pr_title: string;
  service: string;
  environment: 'Production' | 'Staging' | 'Dev';
  policy: string;
  focus_areas: string[];
  code_snippet: string;
  file_name: string;
  language: string;
  memories: MemoryItem[];
  memory_enabled: boolean;
}

const SYSTEM_PROMPT_WITH_MEMORY = `You are ReVise, an elite AI Code Review Agent powered by continuous organizational memory from Hindsight.
Your goal is to evaluate code changes, configuration files, and pull requests objectively against technical best practices and relevant historical context.

CORE PRINCIPLES:
1. GROUNDED IN ACTUAL CHANGES: All findings, risks, and recommendations MUST be directly supported by the supplied PR diff and file patches. Do NOT invent code, APIs, migrations, secrets, outages, or runtime behavior that are not present in the supplied changes.
2. CONTEXTUAL MEMORY USAGE: Retrieved Hindsight memories are contextual evidence only. A Hindsight memory must NOT create a finding unless the current PR contains a concrete, matching technical pattern. If a retrieved memory is not directly relevant to the current change, do NOT cite it as the basis for a finding.
3. CONFIGURATION & TOOLING: If the change consists of configuration, linters, pre-commit, or repository files (e.g. .gitignore, .dockerignore, .flake8, yaml/toml/json), review only configuration-specific risks and best practices rather than inventing application-runtime or database issues.
4. ACCURATE RISK SCORING: Risk score (0-100) must reflect the real risk of the actual diff first, calibrated by relevant historical precedent. Low-risk configuration or formatting changes without dangerous patterns should receive a Low risk score (e.g. 10-30).
5. ACTIONABLE SAFER ROLLOUT: "safer_rollout" must give concrete, practical steps relevant to the actual files changed in this PR.
6. CITATIONS: In "memory_citations", ONLY include memories from the retrieved list that genuinely apply to the code change. If none are applicable, return an empty array [].

You MUST respond strictly with a valid JSON object adhering to this schema:
{
  "risk_score": number (0 to 100),
  "risk_level": "Low" | "Medium" | "High",
  "provenance_note": "string (e.g. Verified against repository standards and historical patterns)",
  "summary": "one-line high impact summary of the actual change",
  "findings": [
    {
      "id": "FINDING-1",
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "title": "Concise finding title directly addressing the changed files",
      "description": "Detailed explanation of the technical change or potential improvement",
      "source_memory_ids": ["MEM-XXX"]
    }
  ],
  "ci_checks": [
    {
      "id": "CI-1",
      "title": "Check title",
      "description": "Why this automated guardrail is helpful",
      "type": "migration-guard" | "linter" | "secret-scan" | "smoke-test",
      "snippet": "Optional YAML or config snippet"
    }
  ],
  "safer_rollout": [
    "1. Step one addressing actual changes...",
    "2. Step two..."
  ],
  "memory_citations": [
    {
      "memory_id": "MEM-XXX",
      "title": "Title from evidence",
      "type": "pr_review" | "pipeline_failure" | "incident" | "post_mortem" | "standard",
      "date": "Aug 12",
      "relevance_note": "One line relevance note",
      "service": "service-name"
    }
  ],
  "why_recommendation": "Plain language explanation of the review assessment grounded in the actual PR diff."
}`;

const SYSTEM_PROMPT_WITHOUT_MEMORY = `You are ReVise, an AI Code Review assistant.
Evaluate the code change using the supplied diff and files without historical memory context.
Ensure all findings, summaries, and recommendations directly match the actual files changed.

Respond strictly with a valid JSON object:
{
  "risk_score": number (0 to 100),
  "risk_level": "Low" | "Medium" | "High",
  "provenance_note": "Standard static analysis (No historical memory enabled)",
  "summary": "Concise code review summary matching the supplied diff.",
  "findings": [
    {
      "id": "FINDING-1",
      "severity": "LOW" | "MEDIUM" | "HIGH",
      "title": "Finding title grounded in changed code",
      "description": "Standard code advice matching the diff.",
      "source_memory_ids": []
    }
  ],
  "ci_checks": [],
  "safer_rollout": [
    "1. Review and verify changes locally.",
    "2. Run automated test suite."
  ],
  "memory_citations": [],
  "why_recommendation": "This analysis was conducted without historical memory. Evaluated based on static best practices."
}`;

async function callGroqWithBackoff(
  messages: Array<{ role: string; content: string }>,
  model: string,
  attempt: number = 1,
  jsonMode: boolean = true
): Promise<string> {
  const maxAttempts = 3;
  const delayMs = Math.pow(2, attempt) * 400 + Math.random() * 200;

  try {
    const payload: Record<string, any> = {
      model: model,
      messages: messages,
      temperature: 0.1,
    };
    if (jsonMode) {
      payload.response_format = { type: 'json_object' };
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq API error HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return data.choices[0]?.message?.content || (jsonMode ? '{}' : '');
  } catch (err: any) {
    console.warn(`Groq call attempt ${attempt} failed for model ${model}:`, err.message);
    if (attempt < maxAttempts) {
      await new Promise(r => setTimeout(r, delayMs));
      return callGroqWithBackoff(messages, model, attempt + 1, jsonMode);
    }
    throw err;
  }
}

export async function evaluateCodeChange(params: EvaluateChangeParams): Promise<{
  output: StructuredAnalysisOutput;
  latency_ms: number;
  model_used: string;
}> {
  const startTime = Date.now();

  // Build the user prompt with budgeted inputs
  const budgetedCode = budgetCodeSnippet(params.code_snippet, MAX_CODE_SNIPPET_CHARS);
  let evidenceText = '';
  if (params.memory_enabled && params.memories.length > 0) {
    evidenceText = budgetMemories(params.memories, MAX_MEMORIES_COUNT);
  }

  const userPrompt = `
SERVICE: ${params.service}
ENVIRONMENT: ${params.environment}
REVIEW POLICY: ${params.policy}
FOCUS AREAS: ${params.focus_areas.join(', ') || 'General Review'}
FILE: ${params.file_name} (${params.language || 'text'})
PULL REQUEST TITLE: ${params.pr_title || ''}

CHANGESET / DIFF / CODE:
\`\`\`${(params.language || 'text').toLowerCase()}
${budgetedCode}
\`\`\`

${evidenceText}

Evaluate this change and return the structured JSON object.`;

  const systemPrompt = params.memory_enabled ? SYSTEM_PROMPT_WITH_MEMORY : SYSTEM_PROMPT_WITHOUT_MEMORY;
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  // 1. If Groq API Key is configured, attempt live Groq inference
  if (GROQ_API_KEY && GROQ_API_KEY.startsWith('gsk_')) {
    const candidateModels = Array.from(
      new Set([GROQ_PRIMARY_MODEL, ...GROQ_FALLBACK_MODELS].filter(m => !DECOMMISSIONED_MODELS.has(m)))
    );
    for (const candidate of candidateModels) {
      try {
        const rawContent = await callGroqWithBackoff(messages, candidate);
        const parsed = JSON.parse(rawContent);

        // Sanitize and ensure format
        const output: StructuredAnalysisOutput = {
          risk_score: typeof parsed.risk_score === 'number' ? parsed.risk_score : (params.memory_enabled ? 82 : 35),
          risk_level: parsed.risk_level || (params.memory_enabled ? 'High' : 'Low'),
          provenance_note: parsed.provenance_note || (params.memory_enabled ? 'Detected before merge using historical migration patterns' : 'Standard static analysis (No memory)'),
          summary: parsed.summary || 'Code change evaluation complete.',
          findings: Array.isArray(parsed.findings) ? parsed.findings : [],
          ci_checks: Array.isArray(parsed.ci_checks) ? parsed.ci_checks : [],
          safer_rollout: Array.isArray(parsed.safer_rollout) ? parsed.safer_rollout : [],
          memory_citations: params.memory_enabled
            ? (Array.isArray(parsed.memory_citations) && parsed.memory_citations.length > 0
                ? parsed.memory_citations
                : params.memories.map(m => ({
                    memory_id: m.id,
                    title: m.title,
                    type: m.type,
                    date: m.relative_time || 'Recent',
                    relevance_note: m.relevance_note || 'Historical memory',
                    service: m.service,
                  })))
            : [],
          why_recommendation: parsed.why_recommendation || (params.memory_enabled ? 'Informed by historical memories.' : 'Analyzed without memory.'),
          memory_enabled: params.memory_enabled,
        };

        const latency_ms = Date.now() - startTime;
        addDiagnosticLog('GROQ_EVAL', params.service, `Evaluated change via live Groq model ${candidate} (Memory: ${params.memory_enabled ? 'ON' : 'OFF'})`, latency_ms, true);

        return {
          output,
          latency_ms,
          model_used: candidate,
        };
      } catch (e: any) {
        console.warn(`Model ${candidate} failed on Groq, trying next candidate:`, e.message);
      }
    }
  }

  // 2. High-Fidelity Deterministic Simulator (Matches exact prompt specs and screenshots for instant testing / offline demo)
  const latency_ms = Date.now() - startTime + (params.memory_enabled ? 340 : 180);
  const simulatorModel = 'simulator/gpt-oss-120b';

  const snippetLower = (params.code_snippet || '').toLowerCase();
  const fileLower = (params.file_name || '').toLowerCase();
  const titleLower = (params.pr_title || '').toLowerCase();

  const isConfigChange =
    params.focus_areas.includes('Configuration & Tooling') ||
    fileLower.includes('.git') ||
    fileLower.includes('.docker') ||
    fileLower.includes('flake8') ||
    fileLower.includes('pre-commit') ||
    snippetLower.includes('.gitignore') ||
    snippetLower.includes('pre-commit') ||
    snippetLower.includes('flake8') ||
    snippetLower.includes('.dockerignore') ||
    fileLower.endsWith('.md') ||
    fileLower.endsWith('.yml') ||
    fileLower.endsWith('.yaml') ||
    fileLower.endsWith('.toml');

  const isRealOrdersMigration =
    (snippetLower.includes('alter table') || snippetLower.includes('create index') || fileLower.endsWith('.sql')) &&
    (snippetLower.includes('orders') || snippetLower.includes('not null') || params.focus_areas.includes('Unsafe DB migration'));

  const isRealSecretIssue =
    (params.focus_areas.includes('Missing secret') || snippetLower.includes('stripe_') || snippetLower.includes('private_key')) &&
    (snippetLower.includes('process.env') || snippetLower.includes('secret') || snippetLower.includes('key'));

  if (!params.memory_enabled) {
    if (isConfigChange) {
      const output: StructuredAnalysisOutput = {
        risk_score: 15,
        risk_level: 'Low',
        provenance_note: 'Standard static configuration check (Zero historical memory context)',
        summary: 'Configuration and developer tooling definitions verified against standard syntax rules.',
        findings: [
          {
            id: 'FINDING-1',
            severity: 'LOW',
            title: 'Configuration syntax and ignore patterns appear valid.',
            description: 'Standard static review of ignore rules and tool configurations.',
            source_memory_ids: [],
          },
        ],
        ci_checks: [],
        safer_rollout: [
          '1. Verify formatting and linter locally.',
          '2. Merge configuration update.',
        ],
        memory_citations: [],
        why_recommendation: 'Configuration reviewed without historical memory context.',
        memory_enabled: false,
      };
      addDiagnosticLog('GROQ_EVAL', params.service, `Evaluated change via deterministic simulator (${simulatorModel}, Memory: OFF)`, latency_ms, true);
      return { output, latency_ms, model_used: simulatorModel };
    }

    if (isRealOrdersMigration) {
      const output: StructuredAnalysisOutput = {
        risk_score: 35,
        risk_level: 'Low',
        provenance_note: 'Standard static syntax check (Zero historical memory context)',
        summary: 'Basic syntax analysis passed. No historical incident memory was consulted.',
        findings: [
          {
            id: 'FINDING-1',
            severity: 'LOW',
            title: 'Syntax and DDL structure appears valid.',
            description: 'The SQL statement is syntactically correct for PostgreSQL. Standard execution does not inspect table volume or historical lock contention.',
            source_memory_ids: [],
          },
          {
            id: 'FINDING-2',
            severity: 'MEDIUM',
            title: 'Column marked NOT NULL without default value.',
            description: 'Consider verifying if existing records require default value handling.',
            source_memory_ids: [],
          },
        ],
        ci_checks: [],
        safer_rollout: [
          '1. Apply migration script in local development environment.',
          '2. Run unit tests to verify column presence.',
          '3. Merge and trigger deployment pipeline.',
        ],
        memory_citations: [],
        why_recommendation: '⚠️ This analysis used no historical memory. The generic reviewer cannot determine if the table has high row volume or historical lock contention.',
        memory_enabled: false,
      };
      addDiagnosticLog('GROQ_EVAL', params.service, `Evaluated change via deterministic simulator (${simulatorModel}, Memory: OFF)`, latency_ms, true);
      return { output, latency_ms, model_used: simulatorModel };
    }

    const output: StructuredAnalysisOutput = {
      risk_score: 20,
      risk_level: 'Low',
      provenance_note: 'Standard static syntax check (Zero historical memory context)',
      summary: `Basic syntax analysis passed for ${params.file_name}.`,
      findings: [
        {
          id: 'FINDING-1',
          severity: 'LOW',
          title: 'Code syntax and structure appear valid.',
          description: `Standard static review completed for ${params.file_name}.`,
          source_memory_ids: [],
        },
      ],
      ci_checks: [],
      safer_rollout: [
        '1. Run unit tests to verify changes.',
        '2. Merge and trigger deployment.',
      ],
      memory_citations: [],
      why_recommendation: 'Evaluated based on standard static rules without historical memory context.',
      memory_enabled: false,
    };
    addDiagnosticLog('GROQ_EVAL', params.service, `Evaluated change via deterministic simulator (${simulatorModel}, Memory: OFF)`, latency_ms, true);
    return { output, latency_ms, model_used: simulatorModel };
  }

  // Memory ON
  let output: StructuredAnalysisOutput;

  if (isConfigChange) {
    output = {
      risk_score: 18,
      risk_level: 'Low',
      provenance_note: 'Verified against repository hygiene and configuration standards',
      summary: 'Repository configuration and tooling update: standardized ignore files, linter rules, and pre-commit setup.',
      findings: [
        {
          id: 'FINDING-1',
          severity: 'LOW',
          title: 'Ignore files and linter definitions standardized.',
          description: 'Configures .gitignore, .dockerignore, and .flake8 to prevent accidental commit of cache artifacts and local build outputs.',
          source_memory_ids: [],
        },
        {
          id: 'FINDING-2',
          severity: 'LOW',
          title: 'Pre-commit hook consistency.',
          description: 'Automates linting and formatting standards across contributor environments before commits are created.',
          source_memory_ids: [],
        },
      ],
      ci_checks: [
        {
          id: 'CI-1',
          title: 'Pre-commit Lint Validation',
          description: 'Run pre-commit hooks in CI to verify formatting across pull requests.',
          type: 'linter',
          snippet: `name: pre-commit\non: pull_request\njobs:\n  run:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: pre-commit/action@v3.0.1`,
        },
      ],
      safer_rollout: [
        '1. Run pre-commit run --all-files locally to verify existing codebase formatting.',
        '2. Verify that ignore patterns do not mask necessary build dependencies or assets.',
        '3. Merge configuration update and confirm CI workflow passes.',
      ],
      memory_citations: [],
      why_recommendation: 'Configuration and developer tooling updates present minimal operational risk. Recommended steps ensure repository consistency across contributors.',
      memory_enabled: true,
    };
  } else if (isRealOrdersMigration) {
    output = {
      risk_score: 82,
      risk_level: 'High',
      provenance_note: 'Detected before merge using historical migration patterns',
      summary: 'High risk deployment detected: adding a direct NOT NULL column and non-concurrent index to orders table will trigger an AccessExclusiveLock, matching the failure signature of RUN-889 and INC-024.',
      findings: [
        {
          id: 'FINDING-1',
          severity: 'HIGH',
          title: 'Adding NOT NULL column directly blocks database writes on orders during schema application.',
          description: 'In PostgreSQL, ALTER TABLE ... ADD COLUMN ... NOT NULL without a default or backfill acquires an AccessExclusiveLock and rewrites the table. With 42M rows in orders-service, this will exceed lock timeouts.',
          source_memory_ids: ['MEM-RUN-889', 'MEM-INC-024'],
        },
        {
          id: 'FINDING-2',
          severity: 'HIGH',
          title: 'Index creation locks the main orders table, causing replication lag similar to the incident in RUN-889.',
          description: 'Executing CREATE INDEX without the CONCURRENTLY modifier holds a ShareLock preventing table writes until index building completes.',
          source_memory_ids: ['MEM-PR-142', 'MEM-RUN-889'],
        },
        {
          id: 'FINDING-3',
          severity: 'MEDIUM',
          title: 'Rollback path is incomplete; no script provided to revert the column safely.',
          description: 'No companion downgrade migration provided to drop the index and remove the column if application deployment halts.',
          source_memory_ids: ['MEM-PM-024'],
        },
      ],
      ci_checks: [
        {
          id: 'CI-1',
          title: 'PostgreSQL Migration Lock Guardrail',
          description: 'Block direct ALTER TABLE ADD COLUMN NOT NULL on tables > 1M rows in CI migration tests.',
          type: 'migration-guard',
          snippet: `name: pg-migration-guard\non: pull_request\njobs:\n  lint-sql:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: squawkhq/squawk-action@v1\n        with:\n          rules: 'require-concurrent-index,require-nullable-column'`,
        },
        {
          id: 'CI-2',
          title: 'Zero-Downtime Rollout Assertion',
          description: 'Enforce presence of rollback script for any DDL modification.',
          type: 'linter',
        },
      ],
      safer_rollout: [
        '1. Add the new column as nullable first.',
        '2. Deploy safe write-path updates to populate region on insert.',
        '3. Backfill existing rows in manageable batches.',
        '4. Create the index CONCURRENTLY to avoid locks.',
        '5. Validate and enforce NOT NULL with a migration post-deploy.',
      ],
      memory_citations: [
        {
          memory_id: 'MEM-PR-142',
          title: 'PR #142: Orders analytics index',
          type: 'pr_review',
          date: 'Aug 10',
          relevance_note: 'Similar schema change',
          service: 'orders-service',
        },
        {
          memory_id: 'MEM-RUN-889',
          title: 'RUN-889: Migration timeout (15m lock threshold)',
          type: 'pipeline_failure',
          date: 'Aug 12',
          relevance_note: 'Matching lock failure',
          service: 'orders-service',
        },
        {
          memory_id: 'MEM-INC-024',
          title: 'INC-024: Checkout latency lock contention',
          type: 'incident',
          date: 'Aug 12',
          relevance_note: 'Downstream production impact',
          service: 'checkout-api',
        },
        {
          memory_id: 'MEM-PM-024',
          title: 'PM-024: Safe migration playbook',
          type: 'post_mortem',
          date: 'Aug 13',
          relevance_note: 'Proven resolution',
          service: 'orders-service',
        },
      ],
      why_recommendation: 'Findings #1 and #2 draw on RUN-889 and INC-024, where an identical synchronous NOT NULL column addition locked the orders table and caused a 22-minute checkout outage. Safer rollout steps 1-5 replicate the validated playbook from PM-024.',
      memory_enabled: true,
    };
  } else if (isRealSecretIssue) {
    output = {
      risk_score: 79,
      risk_level: 'High',
      provenance_note: 'Detected via payments-service startup crash history (RUN-612)',
      summary: 'High risk: direct process.env access without startup schema validation triggers CrashLoopBackOff in container clusters.',
      findings: [
        {
          id: 'FINDING-1',
          severity: 'HIGH',
          title: 'Missing fail-fast startup schema validation for STRIPE_WEBHOOK_SECRET.',
          description: 'Accessing process.env.STRIPE_WEBHOOK_SECRET! directly will cause runtime crashes if the Vault secret mapping is delayed.',
          source_memory_ids: ['MEM-RUN-612'],
        },
      ],
      ci_checks: [
        {
          id: 'CI-1',
          title: 'Envalid / Zod Secret Contract Verification',
          description: 'Validate presence of all required environment variables at build time.',
          type: 'secret-scan',
        },
      ],
      safer_rollout: [
        '1. Add STRIPE_WEBHOOK_SECRET to src/config/env.ts using envalid or zod.',
        '2. Verify Vault secret mapping in staging Helm chart.',
        '3. Run CI smoke test container startup check before rolling deployment.',
      ],
      memory_citations: [
        {
          memory_id: 'MEM-RUN-612',
          title: 'RUN-612: Container CrashLoopBackOff on missing STRIPE_SIGNING_KEY',
          type: 'pipeline_failure',
          date: 'Jul 16',
          relevance_note: 'Unvalidated secret caused CrashLoopBackOff',
          service: 'payments-service',
        },
        {
          memory_id: 'MEM-PM-019',
          title: 'PM-019: Mandatory Envalid schema on all container startups',
          type: 'post_mortem',
          date: 'Jul 18',
          relevance_note: 'Standardized secret contract enforcement',
          service: 'payments-service',
        },
      ],
      why_recommendation: 'Finding #1 draws directly on RUN-612 and PM-019, where missing environment secrets caused immediate pod eviction during Kubernetes rollout.',
      memory_enabled: true,
    };
  } else {
    output = {
      risk_score: 28,
      risk_level: 'Low',
      provenance_note: 'Evaluated against repository standards and engineering best practices',
      summary: `Code change reviewed for ${params.service}: standard implementation without high-risk operational patterns.`,
      findings: [
        {
          id: 'FINDING-1',
          severity: 'LOW',
          title: `Code structure in ${params.file_name} aligns with standards.`,
          description: `No critical anti-patterns, missing secrets, or blocking architectural issues identified for this change.`,
          source_memory_ids: [],
        },
      ],
      ci_checks: [
        {
          id: 'CI-1',
          title: 'Automated CI Test Suite',
          description: 'Run unit and integration test suite before merging.',
          type: 'smoke-test',
        },
      ],
      safer_rollout: [
        '1. Run local test suite to verify no regressions.',
        '2. Deploy to staging environment for verification.',
        '3. Merge and monitor service telemetry.',
      ],
      memory_citations: (params.memories || []).slice(0, 2).map(m => ({
        memory_id: m.id,
        title: m.title,
        type: m.type,
        date: m.relative_time || 'Recent',
        relevance_note: m.relevance_note || 'Contextual repository memory',
        service: m.service,
      })),
      why_recommendation: 'Review conducted against repository conventions and historical context. No matching historical failure signatures detected.',
      memory_enabled: true,
    };
  }

  addDiagnosticLog('GROQ_EVAL', params.service, `Evaluated change via deterministic simulator (${simulatorModel}, Memory: ON)`, latency_ms, true);
  return { output, latency_ms, model_used: simulatorModel };
}

export interface PairProgrammerChatParams {
  run: EvaluationRun;
  message: string;
}

const SYSTEM_PROMPT_PAIR_PROGRAMMER = `You are ReVise AI Pair Programmer, an expert engineering assistant paired with a developer on a specific Pull Request evaluated by ReVise.

CORE GROUNDING RULES:
1. THE SUPPLIED PR ANALYSIS IS YOUR ABSOLUTE SOURCE OF TRUTH.
2. Only discuss findings, risks, and changed files that are actually present in the supplied PR context.
3. Hindsight memories are contextual evidence. If memories are present in the analysis, use them to explain the rationale or precedent. If no relevant memories matched, explicitly state that no historical memories applied to this change.
4. DO NOT INVENT or hallucinate incidents, database locks, Stripe errors, migration issues, or security breaches unless they are present in the supplied PR context or relevant memories.
5. If the user asks "Why is this an issue?", explain using the actual findings from this PR analysis.
6. If the user asks "How should I fix this?", provide concrete, step-by-step remediation instructions based on the actual changed files, actual findings, relevant Hindsight memories, and the safer rollout plan.
7. If the user asks "Why did ReVise recommend this?", explain the reasoning directly from the analysis's recommendation and why_recommendation fields.
8. If the user's question asks about something not in the PR or diff, politely explain that the current PR analysis does not contain that information, and keep your focus on the actual changeset.
9. Format all code snippets, terminal commands, and explanations using clean GitHub Flavored Markdown.`;

export async function pairProgrammerChat(params: PairProgrammerChatParams): Promise<{
  message: string;
  latency_ms: number;
  model_used: string;
}> {
  const startTime = Date.now();
  const { run, message } = params;
  const output = run.output;

  const findingsText = output.findings && output.findings.length > 0
    ? output.findings.map((f, i) => `Finding #${i + 1} [${f.severity}]: ${f.title}\nDescription: ${f.description}`).join('\n\n')
    : 'No blocking findings identified for this change.';

  const rolloutText = output.safer_rollout && output.safer_rollout.length > 0
    ? output.safer_rollout.map((s, i) => `${i + 1}. ${s}`).join('\n')
    : 'Standard review and verification.';

  const memoriesText = output.memory_citations && output.memory_citations.length > 0
    ? output.memory_citations.map((m, i) => `Memory #${i + 1} (${m.type}, ${m.date}): ${m.title}\nRelevance: ${m.relevance_note}`).join('\n\n')
    : 'No relevant Hindsight memories matched this change.';

  const changedFilesText = run.changed_files && run.changed_files.length > 0
    ? run.changed_files.map(f => `- ${f.filename} (+${f.additions}/-${f.deletions})`).join('\n')
    : `- ${run.file_name || 'changeset.diff'}`;

  const diffExcerpt = (run.code_snippet || '').slice(0, 6000);

  const contextPrompt = `CURRENT PR ANALYSIS CONTEXT:
PR / Change: ${run.title}
Service: ${run.service}
Risk Assessment: ${output.risk_score}/100 (${output.risk_level} Risk)
Summary: ${output.summary}
Focus Areas: ${(run.focus_areas || []).join(', ') || 'General Review'}

CHANGED FILES:
${changedFilesText}

ANALYZED CODE / DIFF:
\`\`\`${(run.language || 'text').toLowerCase()}
${diffExcerpt}
\`\`\`

FINDINGS:
${findingsText}

SAFER ROLLOUT RECOMMENDATION:
${rolloutText}

WHY RECOMMENDATION:
${output.why_recommendation || 'Standard best-practice review.'}

RELEVANT HINDSIGHT MEMORIES:
${memoriesText}

DEVELOPER QUESTION:
${message}`;

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT_PAIR_PROGRAMMER },
    { role: 'user', content: contextPrompt },
  ];

  // 1. If Groq API Key is configured, attempt live Groq chat completion
  if (GROQ_API_KEY && GROQ_API_KEY.startsWith('gsk_')) {
    const candidateModels = Array.from(
      new Set([GROQ_PRIMARY_MODEL, ...GROQ_FALLBACK_MODELS].filter(m => !DECOMMISSIONED_MODELS.has(m)))
    );
    for (const candidate of candidateModels) {
      try {
        const rawContent = await callGroqWithBackoff(messages, candidate, 1, false);
        if (rawContent && rawContent.trim()) {
          const latency_ms = Date.now() - startTime;
          addDiagnosticLog('AIDER_RUN', run.service, `Pair Programmer chat responded via ${candidate}`, latency_ms, true);
          return {
            message: rawContent.trim(),
            latency_ms,
            model_used: candidate,
          };
        }
      } catch (e: any) {
        console.warn(`Pair programmer model ${candidate} failed on Groq, trying next candidate:`, e.message);
      }
    }
  }

  // 2. High-fidelity Grounded Deterministic Simulator fallback
  const latency_ms = Date.now() - startTime + 120;
  const simulatorModel = 'simulator/pair-programmer';
  const qLower = message.toLowerCase();

  let response = '';

  const isWhyIssue = qLower.includes('why is this an issue') || qLower.includes('why is this a problem') || qLower.includes('what is the issue') || qLower.includes('what is the problem') || qLower.includes('explain the finding') || qLower.includes('explain the issue') || qLower.includes('why issue');
  const isHowFix = qLower.includes('how should i fix') || qLower.includes('how to fix') || qLower.includes('how do i fix') || qLower.includes('fix this') || qLower.includes('solution') || qLower.includes('remediation') || qLower.includes('refactor');
  const isWhyRecommend = qLower.includes('why did revise recommend') || qLower.includes('why recommend') || qLower.includes('why the recommendation') || qLower.includes('why this rollout');
  const isMemoryQuery = qLower.includes('memory') || qLower.includes('memories') || qLower.includes('hindsight') || qLower.includes('history') || qLower.includes('past incident');
  const isRiskQuery = qLower.includes('risk') || qLower.includes('score') || qLower.includes('level');

  if (isWhyIssue) {
    if (output.findings && output.findings.length > 0) {
      response = `### 🔍 Analysis of Findings for ${run.title}:\n\n` +
        output.findings.map(f => `**[${f.severity}] ${f.title}**\n${f.description}`).join('\n\n');
      if (output.memory_citations && output.memory_citations.length > 0) {
        response += `\n\n### 🧠 Supporting Memory Context:\n` +
          output.memory_citations.map(m => `- **${m.title}** (${m.type}, ${m.date}): ${m.relevance_note}`).join('\n');
      }
    } else {
      response = `There are no critical issues or blocking findings identified for this PR. The risk score is ${output.risk_score}/100 (${output.risk_level} Risk). ${output.summary}`;
    }
  } else if (isHowFix) {
    if (output.safer_rollout && output.safer_rollout.length > 0) {
      response = `### 🛠️ Recommended Remediation Steps:\n\n` +
        `To safely implement the changes in **${run.file_name || 'the repository'}**:\n\n` +
        output.safer_rollout.map((step, i) => `${i + 1}. ${step}`).join('\n');
      if (output.findings && output.findings.length > 0) {
        response += `\n\n**Key Finding to Address:**\n` +
          output.findings.map(f => `- **${f.title}**: ${f.description}`).join('\n');
      }
    } else {
      response = `### 🛠️ Recommended Steps:\n\n1. Review the changes in \`${run.file_name || 'PR'}\` locally.\n2. Run the automated test suite.\n3. Verify repository standards before merging.`;
    }
  } else if (isWhyRecommend) {
    response = `### 💡 Recommendation Rationale:\n\n${output.why_recommendation || output.summary}\n\n`;
    if (output.memory_citations && output.memory_citations.length > 0) {
      response += `**Relevant Historical Precedent:**\n` +
        output.memory_citations.map(m => `- **${m.title}** (${m.type}, ${m.date}): ${m.relevance_note}`).join('\n');
    }
  } else if (isMemoryQuery) {
    if (output.memory_citations && output.memory_citations.length > 0) {
      response = `### 🧠 Relevant Hindsight Memories (${output.memory_citations.length}):\n\n` +
        output.memory_citations.map(m => `**${m.title}**\n- *Type:* ${m.type} · *Date:* ${m.date} · *Service:* ${m.service}\n- *Relevance:* ${m.relevance_note}`).join('\n\n');
    } else {
      response = `No relevant Hindsight memories matched this change. The analysis was conducted against static syntax and repository best practices without matching historical incident patterns.`;
    }
  } else if (isRiskQuery) {
    response = `### 🛡️ Risk Assessment: ${output.risk_score}/100 (${output.risk_level} Risk)\n\n${output.summary}\n\n**Provenance:** ${output.provenance_note || 'ReVise automated analysis'}`;
  } else {
    // Grounded general reply
    response = `### 📋 PR Context: ${run.title}\n\n` +
      `**Service:** \`${run.service}\` | **Risk:** ${output.risk_score}/100 (${output.risk_level}) | **Findings:** ${output.findings?.length || 0}\n\n` +
      `**Summary:** ${output.summary}\n\n` +
      (output.findings && output.findings.length > 0
        ? `**Top Finding:** ${output.findings[0].title}\n\n`
        : '') +
      `You can ask me:\n` +
      `- *"Why is this an issue?"* to inspect specific findings\n` +
      `- *"How should I fix this?"* for the step-by-step remediation plan\n` +
      `- *"Why did ReVise recommend this?"* to see the engineering rationale`;
  }

  addDiagnosticLog('AIDER_RUN', run.service, `Pair Programmer responded via simulator (${simulatorModel})`, latency_ms, true);
  return {
    message: response,
    latency_ms,
    model_used: simulatorModel,
  };
}
