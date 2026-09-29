import { NextResponse } from 'next/server';
import { checkHindsightHealth } from '@/lib/hindsight';
import { getGitHubAuthStatus } from '@/lib/github';
import { getStore } from '@/lib/storage';

export async function GET() {
  const hindsightHealth = await checkHindsightHealth();
  const githubAuth = getGitHubAuthStatus();
  const store = getStore();

  const groqConfigured = !!(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_'));

  return NextResponse.json({
    status: 'healthy',
    github: {
      configured: githubAuth.configured,
      token_length: githubAuth.tokenLength,
      authorization_attached: githubAuth.authorizationAttached,
    },
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
