import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { checkHindsightHealth } from '../src/lib/hindsight';
import { getGitHubAuthStatus } from '../src/lib/github';
import { getStore, resetToSeedData } from '../src/lib/storage';
import { evaluateCodeChange } from '../src/lib/groq';
import { countChangeStats } from '../src/lib/diff-stats';

test('ReVise CLI: Health probe returns active local resilient bank when no Hindsight key configured', async () => {
  const health = await checkHindsightHealth();
  assert.equal(health.connected, true);
  assert.equal(typeof health.latency_ms, 'number');
  assert.equal(typeof health.bank_id, 'string');
});

test('ReVise CLI: GitHub auth probe accurately reports configuration status', () => {
  const auth = getGitHubAuthStatus();
  assert.equal(typeof auth.configured, 'boolean');
  assert.equal(typeof auth.tokenLength, 'number');
});

test('ReVise CLI: Seed reset reloads baseline memories and evaluation runs', () => {
  const store = resetToSeedData();
  assert.ok(store.memories.length >= 10, 'Expected at least 10 baseline memories');
  assert.ok(store.runs.length >= 2, 'Expected baseline evaluation runs');
  assert.ok(store.standards.length >= 4, 'Expected baseline team standards');
});

test('ReVise CLI: Diff and code snippet stats accurately calculate changes', () => {
  const diff = `diff --git a/src/auth/session.ts b/src/auth/session.ts
--- a/src/auth/session.ts
+++ b/src/auth/session.ts
@@ -10,2 +10,2 @@
-  await applySessionMutation(current, input);
+  if (!validateSession(current)) throw new AuthenticationError();
+  await applySessionMutation(current, input);`;

  const stats = countChangeStats(diff);
  assert.equal(stats.is_diff, true);
  assert.equal(stats.files_changed, 1);
  assert.equal(stats.lines_changed, 3);
});

test('ReVise CLI: Evaluation simulator provides structured review output with memory citations', async () => {
  const store = getStore();
  const res = await evaluateCodeChange({
    pr_title: 'Unsafe DB migration test',
    service: 'orders-service',
    environment: 'Production',
    policy: 'Strict production policy',
    focus_areas: ['Unsafe DB migration'],
    code_snippet: 'ALTER TABLE orders ADD COLUMN status VARCHAR(50) NOT NULL;',
    file_name: 'orders.sql',
    language: 'sql',
    memories: store.memories.slice(0, 3),
    memory_enabled: true,
  });

  assert.ok(res.output.risk_score >= 70, 'Expected high risk score for synchronous NOT NULL migration');
  assert.ok(res.output.findings.length > 0, 'Expected findings to be generated');
  assert.ok(res.output.safer_rollout.length > 0, 'Expected safer rollout steps');
});
