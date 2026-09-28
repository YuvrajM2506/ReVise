import { NextResponse } from 'next/server';
import { getStore } from '@/lib/storage';

export async function GET() {
  const store = getStore();
  return NextResponse.json({
    success: true,
    standards: store.standards,
  });
}
