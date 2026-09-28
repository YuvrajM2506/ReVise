import { NextResponse } from 'next/server';

const AIDER_SERVICE_URL = process.env.AIDER_SERVICE_URL || 'http://localhost:8001';

export async function GET() {
  return checkHealth();
}

export async function POST() {
  return checkHealth();
}

async function checkHealth() {
  try {
    const res = await fetch(`${AIDER_SERVICE_URL}/health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        connected: true,
        service_url: AIDER_SERVICE_URL,
        ...data,
      });
    } else {
      const text = await res.text();
      return NextResponse.json(
        {
          connected: false,
          service_url: AIDER_SERVICE_URL,
          status: 'error',
          valid: false,
          error: `Aider service returned HTTP ${res.status}: ${text}`,
        },
        { status: res.status }
      );
    }
  } catch (err: any) {
    return NextResponse.json({
      connected: false,
      service_url: AIDER_SERVICE_URL,
      status: 'unreachable',
      valid: false,
      error: `Aider backend service is unreachable at ${AIDER_SERVICE_URL}. Start it with: "cd aider-service && uvicorn main:app --port 8001"`,
    });
  }
}
