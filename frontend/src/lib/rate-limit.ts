import { NextRequest, NextResponse } from 'next/server';

/**
 * Per-client, per-bucket request budget.
 *
 * The write endpoints proxy paid third-party work (Groq tokens, Hindsight
 * writes, GitHub rate budget, Aider subprocesses), so an unauthenticated
 * route loop burns real quota. This is a deliberately simple in-process
 * sliding window: it is enough to stop accidental loops and casual abuse on a
 * single-instance deployment without adding a dependency or shared store.
 */

const WINDOWS = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the oldest tracked request leaves the window. */
  retryAfterSeconds: number;
}

export function checkRateLimit(
  req: NextRequest,
  bucket: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const forwarded = req.headers.get('x-forwarded-for');
  const client = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'local';
  const key = `${bucket}:${client}`;
  const now = Date.now();

  const hits = (WINDOWS.get(key) || []).filter(time => now - time < windowMs);
  if (hits.length >= limit) {
    WINDOWS.set(key, hits);
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000)) };
  }

  hits.push(now);
  WINDOWS.set(key, hits);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function rateLimitedResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Too many requests. Wait a moment before trying again.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  );
}

/** One-stop guard for POST/PUT handlers: rate limit, then read a size-capped JSON body. */
export async function readCappedJson(
  req: NextRequest,
  options: { bucket: string; limit: number; windowMs: number; maxBodyBytes: number }
): Promise<{ ok: true; body: any } | { ok: false; response: NextResponse }> {
  const gate = checkRateLimit(req, options.bucket, options.limit, options.windowMs);
  if (!gate.allowed) return { ok: false, response: rateLimitedResponse(gate.retryAfterSeconds) };

  const declared = Number(req.headers.get('content-length') || '0');
  if (Number.isFinite(declared) && declared > options.maxBodyBytes) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Request body is too large.' },
        { status: 413 }
      ),
    };
  }

  try {
    const text = await req.text();
    if (text.length > options.maxBodyBytes) {
      return {
        ok: false,
        response: NextResponse.json(
          { success: false, error: 'Request body is too large.' },
          { status: 413 }
        ),
      };
    }
    return { ok: true, body: text === '' ? {} : JSON.parse(text) };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Send a valid JSON request body.' },
        { status: 400 }
      ),
    };
  }
}
