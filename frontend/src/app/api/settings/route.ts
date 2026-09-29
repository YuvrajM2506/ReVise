import { NextRequest, NextResponse } from 'next/server';
import { getSettings, saveSettingsSection } from '@/lib/storage';
import { readCappedJson } from '@/lib/rate-limit';

/**
 * Workspace preferences.
 *
 * This endpoint previously echoed the request body back with `success: true`
 * and persisted nothing, so the Settings page reported "Settings saved." for
 * values that were discarded immediately. It now reads and writes the store.
 */

export async function GET() {
  return NextResponse.json({ success: true, settings: getSettings() });
}

export async function PUT(req: NextRequest) {
  try {
    const guard = await readCappedJson(req, {
      bucket: 'settings',
      limit: 30,
      windowMs: 60_000,
      maxBodyBytes: 8_000,
    });
    if (!guard.ok) return guard.response;
    const body = guard.body ?? {};
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: 'Send a JSON object of settings to save.' },
        { status: 400 }
      );
    }

    // Accept { tab, values } so one tab's save leaves the others intact, and
    // also a flat object, which is treated as the General tab.
    const tab = typeof body.tab === 'string' && body.tab.trim() !== '' ? body.tab.trim() : 'General';
    const rawValues =
      body.values && typeof body.values === 'object' && !Array.isArray(body.values)
        ? body.values
        : body;

    const values: Record<string, string> = {};
    for (const [key, value] of Object.entries(rawValues as Record<string, unknown>)) {
      if (key === 'tab' || key === 'values') continue;
      if (value === null || value === undefined) continue;
      // Only flat scalar fields are persisted; nested objects have no meaning here.
      if (typeof value === 'object') continue;
      values[String(key)] = String(value);
    }

    if (Object.keys(values).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No settings fields were provided.' },
        { status: 400 }
      );
    }

    const settings = saveSettingsSection(tab, values);
    return NextResponse.json({ success: true, tab, saved: values, settings });
  } catch (error: any) {
    console.error('API /api/settings error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Could not save settings' },
      { status: 500 }
    );
  }
}
