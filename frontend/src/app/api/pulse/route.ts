import { NextResponse } from 'next/server';
import { getMemoryPulse } from '@/lib/storage';
import { checkHindsightHealth } from '@/lib/hindsight';

export async function GET() {
  const pulse = getMemoryPulse();

  // The store only knows local counts; whether the memory bank is actually
  // reachable is a live question, so ask rather than assuming it is up.
  const health = await checkHindsightHealth();

  return NextResponse.json({
    success: true,
    pulse: {
      ...pulse,
      hindsight_connected: health.connected,
      hindsight_mode: health.mode,
    },
  });
}
