import { NextResponse } from 'next/server';
import { resetToSeedData } from '@/lib/storage';
import { SEED_MEMORIES } from '@/lib/seed-data';
import { retainMemory } from '@/lib/hindsight';

export async function POST() {
  try {
    // 1. Reset local cache and store to pristine Acme Platform baseline
    const store = resetToSeedData();

    // 2. If Hindsight Cloud API key is provided, sync memories into Hindsight
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
          });
        } catch (e) {
          // ignore single item fail during mass seed
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully seeded Acme Platform memory bank and baseline runs',
      memories_count: store.memories.length,
      runs_count: store.runs.length,
    });
  } catch (error: any) {
    console.error('API /api/seed error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed memories' },
      { status: 500 }
    );
  }
}
