import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const store = getStore();
  const run = store.runs.find(r => r.id === params.id);

  if (!run) {
    return NextResponse.json(
      { success: false, error: 'Evaluation run not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    run,
  });
}
