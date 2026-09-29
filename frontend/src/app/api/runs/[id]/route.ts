import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const store = getStore();
  // Ids are generated server-side (`run-…`); matching exact full strings also
  // keeps encoded tricks like "run%0Aevil" from ever resolving.
  const id = String(params.id || '');
  const run = store.runs.find(r => r.id === id);

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
