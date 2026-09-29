import { NextRequest, NextResponse } from 'next/server';
import { recallMemories, filterRelevantMemories } from '@/lib/hindsight';
import { evaluateCodeChange } from '@/lib/groq';
import { getStore, saveStore } from '@/lib/storage';
import { countChangeStats } from '@/lib/diff-stats';
import { EvaluationRun } from '@/lib/types';
import { readCappedJson } from '@/lib/rate-limit';

/** The review prompt is bounded by the same ceiling GitHub route applies to diffs. */
const MAX_SNIPPET_CHARS = 25000;

export async function POST(req: NextRequest) {
  try {
    const guard = await readCappedJson(req, {
      bucket: 'analyze',
      limit: 20,
      windowMs: 60_000,
      maxBodyBytes: 400_000,
    });
    if (!guard.ok) return guard.response;
    const body = guard.body ?? {};
    const {
      pr_title = 'Code analysis',
      service = 'local-code',
      environment = 'Production',
      policy = 'Strict production policy',
focus_areas = ['General Review'],
      code_snippet = '',
      file_name = 'snippet.ts',
      language = 'TypeScript',
      memory_enabled = true,
    } = body;

    // Reading the change is mandatory, exactly as on the GitHub route: scoring an
    // empty snippet would hand back a confident risk assessment for a review that
    // never saw any code. Reject it instead of inventing a result.
    if (typeof code_snippet !== 'string' || code_snippet.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'code_snippet is required: send the code or diff to review.' },
        { status: 400 }
      );
    }

    // Oversized paste: refuse rather than silently reviewing a fragment, so the
    // caller knows the request was not actually evaluated.
    if (code_snippet.length > MAX_SNIPPET_CHARS) {
      return NextResponse.json(
        { success: false, error: `code_snippet is too large (${code_snippet.length} characters). Send at most ${MAX_SNIPPET_CHARS}.` },
        { status: 413 }
      );
    }

    const changeStats = countChangeStats(code_snippet);
    const startTime = Date.now();

    // 1. Query Hindsight for top-k memories if memory is enabled
    let retrievedMemories: any[] = [];
    let relevantMemories: any[] = [];
    let excludedMemories: any[] = [];
    let retrievalLatency = 0;

    if (memory_enabled) {
      const focusFilter = (focus_areas[0] === 'General Review' || focus_areas[0] === 'Configuration & Tooling') ? undefined : focus_areas[0];
      const recallResult = await recallMemories(
        `${pr_title} ${code_snippet.substring(0, 100)}`,
        {
          service,
          focus_area: focusFilter,
          top_k: 4,
        }
      );
      retrievedMemories = recallResult.memories;
      retrievalLatency = recallResult.retrieval_latency_ms;

      const filterResult = filterRelevantMemories(retrievedMemories, {
        service,
        files: [{ filename: file_name }],
        diff_content: code_snippet,
        focus_areas,
        language,
        pr_title,
      });

      relevantMemories = filterResult.relevant;
      excludedMemories = filterResult.excluded;
    }

    // 2. Call Groq with structured output schema & memory injection
    const evalResult = await evaluateCodeChange({
      pr_title,
      service,
      environment,
      policy,
      focus_areas,
      code_snippet,
      file_name,
      language,
      memories: relevantMemories,
      memory_enabled,
    });

    // 3. Persist this evaluation run. Title and service are clamped because run
    //    ids and titles end up in report URLs and headers; unbounded client
    //    strings there would overflow the report layout.
    const totalLatency = Date.now() - startTime;
    const runId = `run-${Date.now().toString(36)}`;

    // Status vocabulary matches EvaluationRun['status']. "SAFE" was unreachable:
    // every review that comes back from a completed evaluation is by definition
    // reviewed, so low risk is reported as RESOLVED.
    let status: EvaluationRun['status'] = 'RESOLVED';
    if (evalResult.output.risk_score >= 70) {
      status = 'HIGH RISK';
    } else if (evalResult.output.risk_score >= 40) {
      status = 'MEDIUM RISK';
    }

    const newRun: EvaluationRun = {
      id: runId,
      created_at: new Date().toISOString(),
      relative_time: 'Just now',
      status,
      title: String(pr_title || 'Code analysis').slice(0, 140),
      service: String(service || 'local-code').slice(0, 80),
      environment,
      policy,
      focus_areas,
      code_snippet,
      file_name,
      language,
      memory_enabled,
      files_changed: changeStats.files_changed,
      lines_changed: changeStats.lines_changed,
      retrieved_memories_count: retrievedMemories.length,
      retrieved_memory_ids: retrievedMemories.map(m => m.id),
      relevant_memories_count: relevantMemories.length,
      excluded_memories_count: excludedMemories.length,
      output: evalResult.output,
      execution_latency_ms: totalLatency,
    };

    const store = getStore();
    store.runs.unshift(newRun);
    if (store.runs.length > 50) {
      store.runs = store.runs.slice(0, 50);
    }
    saveStore(store);

    return NextResponse.json({
      success: true,
      run_id: runId,
      run: newRun,
retrieved_memories_count: retrievedMemories.length,
      relevant_memories_count: relevantMemories.length,
      excluded_memories_count: excludedMemories.length,
      excluded_memories: excludedMemories,
      files_changed: changeStats.files_changed,
      lines_changed: changeStats.lines_changed,
      retrieval_latency_ms: retrievalLatency,
      total_latency_ms: totalLatency,
    });
  } catch (error: any) {
    console.error('API /api/analyze error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Analysis pipeline failed' },
      { status: 500 }
    );
  }
}
