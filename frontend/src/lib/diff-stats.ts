/**
 * Counters derived from the text that was actually sent to the model.
 *
 * A review report is only honest if it can say how much it looked at, so these
 * numbers come from the diff or snippet itself rather than from GitHub's
 * metadata, which is unavailable whenever the file-listing endpoint fails.
 */

const DIFF_HEADER = /^diff --git a\/(.+?) b\/(.+)$/;

export interface ChangeStats {
  files_changed: number;
  lines_changed: number;
  /** True when the text was treated as a unified diff rather than raw source. */
  is_diff: boolean;
}

/**
 * Recover changed file names from unified diff headers. Used when GitHub's
 * file-listing endpoint is unavailable but the diff itself came through.
 */
export function extractDiffFileNames(diffText: string): string[] {
  const names = new Set<string>();
  for (const line of diffText.split('\n')) {
    const match = line.match(DIFF_HEADER);
    if (match) names.add(match[2]);
  }
  return Array.from(names);
}

/** Distinguish a unified diff from raw source without guessing at file types. */
export function looksLikeDiff(text: string): boolean {
  return /^diff --git /m.test(text) || /^@@ /m.test(text) || /^(\+\+\+|---) /m.test(text);
}

/**
 * Count changed files and added/removed lines in a unified diff. The `+++`/`---`
 * file headers are skipped so they are not mistaken for content changes.
 */
export function countDiffStats(diffText: string): ChangeStats {
  const files = extractDiffFileNames(diffText);
  let linesChanged = 0;

  for (const line of diffText.split('\n')) {
    if (line.startsWith('+++') || line.startsWith('---')) continue;
    if (line.startsWith('+') || line.startsWith('-')) linesChanged += 1;
  }

  // A patch summary that carries only hunks has no `diff --git` header, so fall
  // back to counting it as one changed artefact rather than zero.
  const fileCount = files.length > 0 ? files.length : (linesChanged > 0 ? 1 : 0);
  return { files_changed: fileCount, lines_changed: linesChanged, is_diff: true };
}

/**
 * Stats for raw source rather than a diff: a single artefact was reviewed, and
 * the non-blank lines are what the model actually read.
 */
export function countSnippetStats(snippet: string): ChangeStats {
  const lines = snippet.split('\n').filter(line => line.trim() !== '').length;
  return { files_changed: lines > 0 ? 1 : 0, lines_changed: lines, is_diff: false };
}

/** Pick the right counter for whatever text was sent to the model. */
export function countChangeStats(text: string): ChangeStats {
  return looksLikeDiff(text) ? countDiffStats(text) : countSnippetStats(text);
}
