import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/storage';
import { EvaluationRun, PairProgrammerContext } from '@/lib/types';

function parseRepoMeta(run: EvaluationRun) {
  let owner = run.owner;
  let repo = run.repo;
  let pullNumber = run.pull_number;

  if (!pullNumber && run.title) {
    const numMatch = run.title.match(/#(\d+)/);
    if (numMatch) pullNumber = parseInt(numMatch[1], 10);
  }
  if (!owner || !repo) {
    if (run.id && run.id.startsWith('run-gh-')) {
      const parts = run.id.split('-');
      if (parts.length >= 5) {
        owner = owner || parts[2];
        repo = repo || parts[3];
        if (!pullNumber && parts[4]) pullNumber = parseInt(parts[4], 10);
      }
    }
    if (!owner && run.service && run.service.includes('/')) {
      const parts = run.service.split('/');
      owner = parts[0];
      repo = repo || parts[1];
    } else if (!repo && run.service) {
      repo = run.service;
    }
  }

  return { owner, repo, pullNumber };
}

function mapRunToContext(run: EvaluationRun): PairProgrammerContext {
  const { owner, repo, pullNumber } = parseRepoMeta(run);
  const output = run.output || ({} as any);
  const relevantMemories = output.memory_citations || [];

  return {
    run_id: run.id,
    owner,
    repo,
    pull_number: pullNumber,
    service: run.service || 'service',
    title: run.title || `${run.service} review`,
    risk_score: output.risk_score ?? 0,
    risk_level: output.risk_level ?? 'Low',
    summary: output.summary ?? 'PR evaluation complete.',
    findings: output.findings ?? [],
    changed_files: run.changed_files || (run.file_name ? [{ filename: run.file_name, additions: 0, deletions: 0 }] : []),
    files_changed: run.files_changed ?? (run.changed_files ? run.changed_files.length : (run.file_name ? 1 : 0)),
    lines_changed: run.lines_changed ?? 0,
    relevant_memories: relevantMemories,
    retrieved_memories_count: run.retrieved_memories_count ?? relevantMemories.length,
    relevant_memories_count: run.relevant_memories_count ?? relevantMemories.length,
    excluded_memories_count: run.excluded_memories_count ?? 0,
    safer_rollout: output.safer_rollout ?? [],
    why_recommendation: output.why_recommendation ?? '',
    focus_areas: run.focus_areas ?? [],
    code_snippet: run.code_snippet ?? '',
    file_name: run.file_name ?? 'changeset.diff',
    language: run.language ?? 'text',
    created_at: run.created_at ?? new Date().toISOString(),
    memory_enabled: run.memory_enabled ?? true,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const runId = searchParams.get('runId');
    const store = getStore();

    let targetRun: EvaluationRun | undefined;
    if (runId) {
      targetRun = store.runs.find(r => r.id === runId);
    } else {
      targetRun = store.runs[0];
    }

    if (!targetRun) {
      return NextResponse.json(
        { success: false, error: runId ? `Evaluation run '${runId}' not found.` : 'No evaluation runs available.' },
        { status: 404 }
      );
    }

    const context = mapRunToContext(targetRun);

    return NextResponse.json({
      success: true,
      context,
    });
  } catch (error: any) {
    console.error('API /api/pair-programmer/context GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve pair programmer context' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const runId = body.runId;
    const store = getStore();

    let targetRun: EvaluationRun | undefined;
    if (runId) {
      targetRun = store.runs.find(r => r.id === runId);
    } else {
      targetRun = store.runs[0];
    }

    if (!targetRun) {
      return NextResponse.json(
        { success: false, error: runId ? `Evaluation run '${runId}' not found.` : 'No evaluation runs available.' },
        { status: 404 }
      );
    }

    const context = mapRunToContext(targetRun);

    return NextResponse.json({
      success: true,
      context,
    });
  } catch (error: any) {
    console.error('API /api/pair-programmer/context POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve pair programmer context' },
      { status: 500 }
    );
  }
}
