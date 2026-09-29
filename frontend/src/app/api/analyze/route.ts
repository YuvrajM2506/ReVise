import { NextRequest, NextResponse } from 'next/server';
import { recallMemories, filterRelevantMemories } from '@/lib/hindsight';
import { evaluateCodeChange } from '@/lib/groq';
import { getStore, saveStore } from '@/lib/storage';
import { EvaluationRun } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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

    // 3. Persist this evaluation run
    const totalLatency = Date.now() - startTime;
    const runId = `run-${Date.now().toString(36)}`;
    
    let status: EvaluationRun['status'] = 'SAFE';
    if (evalResult.output.risk_score >= 70) {
      status = 'HIGH RISK';
    } else if (evalResult.output.risk_score >= 40) {
      status = 'MEDIUM RISK';
    } else {
      status = 'RESOLVED';
    }

    const newRun: EvaluationRun = {
      id: runId,
      created_at: new Date().toISOString(),
      relative_time: 'Just now',
      status,
      title: pr_title,
      service,
      environment,
      policy,
      focus_areas,
      code_snippet,
      file_name,
      language,
      memory_enabled,
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
