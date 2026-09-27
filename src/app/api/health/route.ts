import { NextResponse } from 'next/server';
import { checkHindsightHealth } from '@/lib/hindsight';
import { getStore } from '@/lib/storage';

export async function GET() {
  const hindsightHealth = await checkHindsightHealth();
  const store = getStore();

  const groqConfigured = !!(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_'));

  return NextResponse.json({
    status: 'healthy',
    hindsight: hindsightHealth,
    groq: {
      configured: groqConfigured,
      primary_model: process.env.GROQ_PRIMARY_MODEL || 'openai/gpt-oss-120b',
      status: groqConfigured ? 'Live Groq LPU' : 'Active (Simulator Fallback Ready)',
    },
    diagnostics: store.diagnostics.slice(0, 25),
    timestamp: new Date().toISOString(),
  });
}
