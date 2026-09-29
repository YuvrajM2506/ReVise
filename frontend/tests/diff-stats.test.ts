import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  countChangeStats,
  countDiffStats,
  extractDiffFileNames,
  looksLikeDiff,
} from '../src/lib/diff-stats';

const SAMPLE_DIFF = [
  'diff --git a/src/app.ts b/src/app.ts',
  'index 1111111..2222222 100644',
  '--- a/src/app.ts',
  '+++ b/src/app.ts',
  '@@ -1,3 +1,4 @@',
  ' const a = 1;',
  '-const b = 2;',
  '+const b = 3;',
  '+const c = 4;',
  'diff --git a/src/db.sql b/src/db.sql',
  '--- a/src/db.sql',
  '+++ b/src/db.sql',
  '@@ -1 +1 @@',
  '-CREATE INDEX idx ON t(x);',
  '+CREATE INDEX CONCURRENTLY idx ON t(x);',
].join('\n');

test('extractDiffFileNames reads the b-side path of each diff header', () => {
  assert.deepEqual(extractDiffFileNames(SAMPLE_DIFF), ['src/app.ts', 'src/db.sql']);
});

test('extractDiffFileNames returns nothing when there are no diff headers', () => {
  assert.deepEqual(extractDiffFileNames('@@ -1 +1 @@\n-a\n+b'), []);
});

test('countDiffStats counts added and removed lines but not the file headers', () => {
  const stats = countDiffStats(SAMPLE_DIFF);
  assert.equal(stats.files_changed, 2);
  // Two removals and three additions; the four ---/+++ header lines must not count.
  assert.equal(stats.lines_changed, 5);
  assert.equal(stats.is_diff, true);
});

test('countDiffStats counts a headerless patch as one changed artefact', () => {
  const stats = countDiffStats('@@ -1 +1 @@\n-old\n+new');
  assert.equal(stats.files_changed, 1);
  assert.equal(stats.lines_changed, 2);
});

test('countSnippetStats reports one artefact and ignores blank lines', () => {
  const stats = countChangeStats('const a = 1;\n\nconst b = 2;\n');
  assert.equal(stats.files_changed, 1);
  assert.equal(stats.lines_changed, 2);
  assert.equal(stats.is_diff, false);
});

test('countChangeStats reports nothing for empty input', () => {
  assert.deepEqual(countChangeStats(''), { files_changed: 0, lines_changed: 0, is_diff: false });
  assert.deepEqual(countChangeStats('   \n  \n'), { files_changed: 0, lines_changed: 0, is_diff: false });
});

test('looksLikeDiff distinguishes patches from source', () => {
  assert.equal(looksLikeDiff(SAMPLE_DIFF), true);
  assert.equal(looksLikeDiff('@@ -1 +1 @@\n-a\n+b'), true);
  assert.equal(looksLikeDiff('--- a/old\n+++ b/new'), true);
  assert.equal(looksLikeDiff('const a = 1;\nlet b = 2;'), false);
});
