import { NextRequest, NextResponse } from 'next/server';
import { recallMemories } from '@/lib/hindsight';
import { addDiagnosticLog } from '@/lib/storage';

const AIDER_SERVICE_URL = process.env.AIDER_SERVICE_URL || 'http://localhost:8001';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const {
      repo_url = '',
      task = '',
      target_files = [],
      use_memory = true,
      service = 'orders-service',
      focus_area = 'Unsafe DB migration',
    } = body;

    if (!repo_url || !repo_url.trim()) {
      return NextResponse.json(
        { success: false, error: 'Repository URL or local path is required.' },
        { status: 400 }
      );
    }

    if (!task || !task.trim()) {
      return NextResponse.json(
        { success: false, error: 'Task instruction is required.' },
        { status: 400 }
      );
    }

    // 1. Recall Hindsight memories if memory is enabled
    let memoryContext: string[] = [];
    let retrievedMemories: any[] = [];
    let retrievalLatency = 0;

    if (use_memory) {
      const recallResult = await recallMemories(
        `${task} ${target_files.join(' ')}`,
        {
          service,
          focus_area,
          top_k: 4,
        }
      );
      retrievedMemories = recallResult.memories;
      retrievalLatency = recallResult.retrieval_latency_ms;

      memoryContext = retrievedMemories.map(
        m =>
          `[${m.type.toUpperCase()}] ${m.title} (${m.service || 'general'}): ${m.content} (Note: ${m.relevance_note || 'Historical standard'})`
      );
    }

    // 2. Forward payload to FastAPI Aider Service
    let fastapiResponse: Response;
    try {
      fastapiResponse = await fetch(`${AIDER_SERVICE_URL}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_url,
          task,
          target_files,
          memory_context: memoryContext,
        }),
        signal: AbortSignal.timeout(250000), // 250s timeout matching backend
      });
    } catch (fetchError: any) {
      const totalLatency = Date.now() - startTime;
      addDiagnosticLog(
        'AIDER_RUN',
        service,
        `Connection failed to Aider backend at ${AIDER_SERVICE_URL}: ${fetchError.message}`,
        totalLatency,
        false
      );

      return NextResponse.json(
        {
          success: false,
          error: `Aider backend service is unreachable at ${AIDER_SERVICE_URL}. Please ensure the FastAPI server is running with: "cd aider-service && uvicorn main:app --port 8001" (Error: ${fetchError.message})`,
          diff: '',
          files_changed: [],
          log: '',
          memory_context: memoryContext,
          memories: retrievedMemories,
        },
        { status: 503 }
      );
    }

    const data = await fastapiResponse.json();
    const totalLatency = Date.now() - startTime;

    addDiagnosticLog(
      'AIDER_RUN',
      service,
      `Aider run finished with success=${data.success}, files_changed=${data.files_changed?.length || 0}`,
      totalLatency,
      data.success
    );

    return NextResponse.json({
      success: data.success,
      diff: data.diff || '',
      files_changed: data.files_changed || [],
      log: data.log || '',
      error: data.error || null,
      memory_context: memoryContext,
      memories: retrievedMemories,
      memories_recalled_count: retrievedMemories.length,
      retrieval_latency_ms: retrievalLatency,
      total_latency_ms: totalLatency,
    });
  } catch (error: any) {
    console.error('API /api/aider/run error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Pair programmer pipeline failed',
        diff: '',
        files_changed: [],
        log: '',
      },
      { status: 500 }
    );
  }
}
