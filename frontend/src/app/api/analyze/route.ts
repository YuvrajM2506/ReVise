import { NextRequest, NextResponse } from 'next/server';
import { recallMemories } from '@/lib/hindsight';
import { evaluateCodeChange } from '@/lib/groq';
import { getStore, saveStore } from '@/lib/storage';
import { EvaluationRun } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      pr_title = 'PR #167: Add customer-region analytics to orders',
      service = 'orders-service',
      environment = 'Production',
      policy = 'Strict production policy',
      focus_areas = ['Unsafe DB migration'],
      code_snippet = '',
      file_name = 'migration_v167.sql',
      language = 'PostgreSQL',
      memory_enabled = true,
    } = body;

    const startTime = Date.now();

    // 1. Query Hindsight for top-k memories if memory is enabled
    let retrievedMemories: any[] = [];
    let retrievalLatency = 0;

    if (memory_enabled) {
      const recallResult = await recallMemories(
        `${pr_title} ${code_snippet.substring(0, 100)}`,
        {
          service,
          focus_area: focus_areas[0],
          top_k: 4,
        }
      );
      retrievedMemories = recallResult.memories;
      retrievalLatency = recallResult.retrieval_latency_ms;
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
      memories: retrievedMemories,
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
