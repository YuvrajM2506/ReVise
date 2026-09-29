import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/storage';
import { pairProgrammerChat } from '@/lib/groq';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { runId, message } = body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'A message is required.' },
        { status: 400 }
      );
    }

    const store = getStore();
    let targetRun = runId ? store.runs.find(r => r.id === runId) : undefined;

    if (!targetRun) {
      targetRun = store.runs[0];
    }

    if (!targetRun) {
      return NextResponse.json({
        success: true,
        message: 'No PR analysis has been performed yet. Please analyze a pull request in PR Review or Analyze Code first to provide context for the AI Pair Programmer.',
        run_id: null,
      });
    }

    const chatResult = await pairProgrammerChat({
      run: targetRun,
      message: message.trim(),
    });

    return NextResponse.json({
      success: true,
      message: chatResult.message,
      run_id: targetRun.id,
      model_used: chatResult.model_used,
    });
  } catch (error: any) {
    console.error('API /api/pair-programmer/chat error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Pair Programmer chat failed',
        message: 'ReVise could not process your request at this time. Please try again.',
      },
      { status: 500 }
    );
  }
}
