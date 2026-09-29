import fs from 'fs';
import path from 'path';
import { MemoryItem, EvaluationRun, CausalTimelineNode, ActiveGuardrail, TeamStandard, MemoryPulseData } from './types';

import { SEED_MEMORIES, INITIAL_EVALUATION_RUNS, TIMELINE_NODES, ACTIVE_GUARDRAILS, TEAM_STANDARDS } from './seed-data';

/** Workspace preferences, keyed by settings tab and then by field name. */
export type SettingsSections = Record<string, Record<string, string>>;

interface AppStore {
  memories: MemoryItem[];
  runs: EvaluationRun[];
  timeline: CausalTimelineNode[];
  guardrails: ActiveGuardrail[];
  standards: TeamStandard[];
  diagnostics: Array<{
    timestamp: string;
    action: 'RECALL' | 'RETAIN' | 'GROQ_EVAL' | 'HEALTH_PING' | 'AIDER_RUN';
    service: string;
    details: string;
    latency_ms: number;
    success: boolean;
  }>;
  settings: SettingsSections;
}

function getStorageFile(): string {
  if (process.env.REVISE_DATA_PATH) {
    return process.env.REVISE_DATA_PATH;
  }
  const candidates = [
    path.join(process.cwd(), 'data', 'app_state.json'),
    path.join(process.cwd(), 'frontend', 'data', 'app_state.json'),
    path.join(process.cwd(), '..', 'frontend', 'data', 'app_state.json'),
    path.join(process.cwd(), '..', 'data', 'app_state.json'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
}

// In-memory cache singleton
let memoryCache: AppStore | null = null;

function ensureStorageDir() {
  const file = getStorageFile();
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      console.warn('Could not create data directory:', e);
    }
  }
}

/**
 * Coerce whatever was on disk into a complete store. A file written by an older
 * build can be missing whole collections, and reading such a store would throw
 * deep inside a request handler; filling the gaps here keeps startup reliable.
 */
function normalizeStore(raw: any): AppStore {
  const list = <T,>(value: unknown, fallback: T[]): T[] => (Array.isArray(value) ? (value as T[]) : [...fallback]);
  const settings: SettingsSections =
    raw?.settings && typeof raw.settings === 'object' && !Array.isArray(raw.settings) ? raw.settings : {};
  return {
    memories: list(raw?.memories, SEED_MEMORIES),
    runs: list(raw?.runs, INITIAL_EVALUATION_RUNS),
    timeline: list(raw?.timeline, TIMELINE_NODES),
    guardrails: list(raw?.guardrails, ACTIVE_GUARDRAILS),
    standards: list(raw?.standards, TEAM_STANDARDS),
    diagnostics: list(raw?.diagnostics, []),
    settings,
  };
}

/**
 * Read the stored workspace preferences. Returns a copy so callers cannot mutate
 * the cached store without going through a save.
 */
export function getSettings(): SettingsSections {
  return { ...getStore().settings };
}

/**
 * Persist one settings tab, leaving every other tab untouched. Merging here (and
 * not in the caller) means a save from one tab can never erase another's values.
 */
export function saveSettingsSection(tab: string, values: Record<string, string>): SettingsSections {
  const store = getStore();
  const cleanTab = tab.trim() || 'General';
  const previous = store.settings[cleanTab] || {};
  const merged: Record<string, string> = { ...previous };

  for (const [field, value] of Object.entries(values)) {
    const key = String(field).trim();
    if (key === '') continue;
    merged[key] = String(value ?? '');
  }

  store.settings = { ...store.settings, [cleanTab]: merged };
  saveStore(store);
  return store.settings;
}

export function getStore(): AppStore {
  if (memoryCache) {
    return memoryCache;
  }

  ensureStorageDir();

  const file = getStorageFile();
  if (fs.existsSync(file)) {
    try {
      const data = fs.readFileSync(file, 'utf-8');
      memoryCache = normalizeStore(JSON.parse(data));
      return memoryCache;
    } catch (e) {
      // Do not destroy the evidence: keep the unreadable file for inspection
      // instead of silently overwriting it with seed data on the way out.
      console.error('Error reading storage file, initializing with seed data:', e);
      try {
        const quarantine = `${file}.corrupt-${Date.now()}`;
        fs.renameSync(file, quarantine);
        console.warn(`Preserved unreadable store as ${quarantine}`);
      } catch {
        // Best effort only; seeding below still recovers the application.
      }
    }
  }

  // Initialize with seed data
  memoryCache = {
    memories: [...SEED_MEMORIES],
    runs: [...INITIAL_EVALUATION_RUNS],
    timeline: [...TIMELINE_NODES],
    guardrails: [...ACTIVE_GUARDRAILS],
    standards: [...TEAM_STANDARDS],
    diagnostics: [
      {
        timestamp: new Date().toISOString(),
        action: 'HEALTH_PING',
        service: 'system',
        details: 'Initial storage state initialized with Acme Platform seed dataset',
        latency_ms: 12,
        success: true,
      },
    ],
    settings: {},
  };

  saveStore(memoryCache);
  return memoryCache;
}

/**
 * Persist the store atomically. Writing straight to storage file means a crash,
 * full disk or killed process mid-write leaves truncated JSON behind, and the
 * next boot would discard the whole bank; writing to a sibling then renaming
 * means readers only ever see a complete file.
 */
export function saveStore(store: AppStore) {
  memoryCache = store;
  try {
    ensureStorageDir();
    const file = getStorageFile();
    const tempFile = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(store, null, 2), 'utf-8');
    fs.renameSync(tempFile, file);
  } catch (e) {
    console.warn('Could not persist storage to disk:', e);
  }
}

export function resetToSeedData() {
  const freshStore: AppStore = {
    memories: [...SEED_MEMORIES],
    runs: [...INITIAL_EVALUATION_RUNS],
    timeline: [...TIMELINE_NODES],
    guardrails: [...ACTIVE_GUARDRAILS],
    standards: [...TEAM_STANDARDS],
    diagnostics: [
      {
        timestamp: new Date().toISOString(),
        action: 'HEALTH_PING',
        service: 'system',
        details: 'Memory bank reset to Acme Platform seed baseline',
        latency_ms: 8,
        success: true,
      },
    ],
    // A seed reset deliberately restores the demo bank and clears preferences,
    // so a stale settings value cannot survive a reset the user asked for.
    settings: {},
  };
  saveStore(freshStore);
  return freshStore;
}

export function addDiagnosticLog(action: 'RECALL' | 'RETAIN' | 'GROQ_EVAL' | 'HEALTH_PING' | 'AIDER_RUN', service: string, details: string, latency_ms: number, success: boolean) {
  const store = getStore();
  store.diagnostics.unshift({
    timestamp: new Date().toISOString(),
    action,
    service,
    details,
    latency_ms,
    success,
  });
  if (store.diagnostics.length > 100) {
    store.diagnostics = store.diagnostics.slice(0, 100);
  }
  saveStore(store);
}

/**
 * Cumulative memory count sampled across the span of recorded memories. Built
 * from real timestamps so the sparkline reflects this bank; entries whose
 * timestamp is a display string rather than a date are skipped, which can make
 * the series shorter than the memory count.
 */
function buildGrowthSparkline(memories: MemoryItem[], points = 7): number[] {
  const times = memories
    .map(memory => Date.parse(memory.timestamp))
    .filter(time => Number.isFinite(time))
    .sort((a, b) => a - b);

  if (times.length === 0) return [];

  const first = times[0];
  const span = times[times.length - 1] - first;
  const series: number[] = [];
  for (let step = 1; step <= points; step += 1) {
    const cutoff = first + (span * step) / points;
    series.push(times.filter(time => time <= cutoff).length);
  }
  return series;
}

/**
 * Memory bank statistics derived from the store itself. Every value here is a
 * real count — the endpoint must not embellish, because these numbers are shown
 * to users as evidence of what the product knows.
 */
export function getMemoryPulse(): MemoryPulseData {
  const store = getStore();

  // A focus area carried by more than one memory is a recurring risk theme.
  const focusAreaCounts = new Map<string, number>();
  for (const memory of store.memories) {
    for (const area of memory.metadata?.focus_areas || []) {
      focusAreaCounts.set(area, (focusAreaCounts.get(area) || 0) + 1);
    }
  }
  const repeatedRisks = Array.from(focusAreaCounts.values()).filter(count => count > 1).length;

  return {
    total_memories: store.memories.length,
    remediation_patterns_count: store.guardrails.length,
    repeated_risks_count: repeatedRisks,
    growth_sparkline: buildGrowthSparkline(store.memories),
    // Storage performs no network I/O; the pulse route overlays the live
    // Hindsight connection state on top of this.
    hindsight_connected: false,
    last_sync_timestamp: store.diagnostics[0]?.timestamp ?? null,
  };
}
