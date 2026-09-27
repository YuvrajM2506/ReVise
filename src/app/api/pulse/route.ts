import { NextResponse } from 'next/server';
import { getMemoryPulse } from '@/lib/storage';

export async function GET() {
  const pulse = getMemoryPulse();
  return NextResponse.json({
    success: true,
    pulse,
  });
}
