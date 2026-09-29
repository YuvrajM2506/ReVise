import { NextRequest, NextResponse } from 'next/server';
import { getStore, resetToSeedData } from '@/lib/storage';
import { SEED_MEMORIES } from '@/lib/seed-data';
import { retainMemory } from '@/lib/hindsight';
import { checkRateLimit, rateLimitedResponse } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // Seeding is destructive (it wipes real runs, memories and preferences), so it
  // must not be repeatable by a stray refresh or an outside loop.
  const gate = checkRateLimit(req, 'seed', 3, 60_000);
  if (!gate.allowed) return rateLimitedResponse(gate.retryAfterSeconds);
  try {
    // 1. Reset local cache and store to pristine Acme Platform baseline
    resetToSeedData();

    // 2. If Hindsight Cloud API key is provided, mirror the baseline memories into
    //    Hindsight. `sync_only` keeps this from inserting duplicate local copies.
    if (process.env.HINDSIGHT_API_KEY && process.env.HINDSIGHT_API_KEY.startsWith('hsk_')) {
      for (const mem of SEED_MEMORIES.slice(0, 5)) {
        try {
          await retainMemory({
            title: mem.title,
            type: mem.type,
            service: mem.service,
            content: mem.content,
            relevance_note: mem.relevance_note,
            metadata: mem.metadata,
            sync_only: true,
          });
        } catch (e) {
          // ignore single item fail during mass seed
        }
      }
    }

    // Re-read after the Hindsight sync so the counts reflect the final state.
    const seeded = getStore();

    return NextResponse.json({
      success: true,
      message: 'Successfully seeded Acme Platform memory bank and baseline runs',
      memories_count: seeded.memories.length,
      runs_count: seeded.runs.length,
    });
  } catch (error: any) {
    console.error('API /api/seed error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed memories' },
      { status: 500 }
    );
  }
}
