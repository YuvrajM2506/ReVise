import { NextRequest, NextResponse } from 'next/server';
import { listPulls, getPullFiles, getPullDiff, GitHubFile } from '@/lib/github';
import { retainMemory } from '@/lib/hindsight';
import { getStore } from '@/lib/storage';
import { FocusArea } from '@/lib/types';

const MAX_DIFF_SUMMARY_CHARS = 1500;
const MAX_PR_LIMIT = 20;
const DEFAULT_PR_LIMIT = 5;

function detectFocusAreas(files: GitHubFile[], textSample: string): FocusArea[] {
  const areas: FocusArea[] = [];
  const textLower = (textSample + ' ' + files.map(f => f.filename).join(' ')).toLowerCase();

  if (
    textLower.includes('.sql') ||
    textLower.includes('alter table') ||
    textLower.includes('create index') ||
    textLower.includes('migration')
  ) {
    areas.push('Unsafe DB migration');
  }
  if (
    textLower.includes('secret') ||
    textLower.includes('env') ||
    textLower.includes('password') ||
    textLower.includes('api_key') ||
    textLower.includes('token')
  ) {
    areas.push('Missing secret');
  }
  if (
    textLower.includes('package.json') ||
    textLower.includes('requirements.txt') ||
    textLower.includes('cargo.toml') ||
    textLower.includes('go.mod')
  ) {
    areas.push('Dependency upgrade');
  }
  if (
    textLower.includes('api/') ||
    textLower.includes('route') ||
    textLower.includes('schema') ||
    textLower.includes('endpoint')
  ) {
    areas.push('API contract change');
  }

  return areas;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { owner, repo, bankId, maxPRs } = body;

    // 1. Validate inputs
    if (!owner || typeof owner !== 'string' || owner.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Repository owner is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    if (!repo || typeof repo !== 'string' || repo.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Repository name is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    if (!bankId || typeof bankId !== 'string' || bankId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Memory bank ID is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    let limit = DEFAULT_PR_LIMIT;
    if (maxPRs !== undefined) {
      if (typeof maxPRs !== 'number' || !Number.isInteger(maxPRs) || maxPRs <= 0) {
        return NextResponse.json(
          { success: false, error: 'maxPRs must be a positive integer.' },
          { status: 400 }
        );
      }
      limit = Math.min(maxPRs, MAX_PR_LIMIT);
    }

    const cleanOwner = owner.trim();
    const cleanRepo = repo.trim();
    const cleanBankId = bankId.trim();

    // 2. Fetch recently closed/merged PRs via GitHub API
    const pulls = await listPulls(cleanOwner, cleanRepo, {
      state: 'closed',
      sort: 'updated',
      direction: 'desc',
      per_page: Math.min(limit * 3, 30),
    });

    // Filter to only merged pull requests
    const mergedPulls = pulls.filter((pr) => pr.merged_at !== null).slice(0, limit);

    // 3. Process each merged PR and create Hindsight memories
    const results: Array<{
      pullNumber: number;
      title: string;
      memory_id?: string;
      status?: string;
      error?: string;
    }> = [];

    let memoriesCreatedCount = 0;

    for (const pr of mergedPulls) {
      try {
        // Avoid duplicate memories if already backfilled
        const store = getStore();
        const existing = store.memories.find(
          (m) =>
            m.metadata?.source === 'github-backfill' &&
            m.metadata?.owner?.toLowerCase() === cleanOwner.toLowerCase() &&
            m.metadata?.repo?.toLowerCase() === cleanRepo.toLowerCase() &&
            m.metadata?.pullNumber === pr.number
        );

        if (existing) {
          results.push({
            pullNumber: pr.number,
            title: pr.title,
            memory_id: existing.id,
            status: 'already_exists',
          });
          continue;
        }

        // Fetch changed files
        let files: GitHubFile[] = [];
        try {
          files = await getPullFiles(cleanOwner, cleanRepo, pr.number);
        } catch (fErr: any) {
          console.warn(`Backfill: could not fetch files for PR #${pr.number}:`, fErr.message);
        }

        // Fetch diff gracefully
        let rawDiff = '';
        try {
          rawDiff = await getPullDiff(cleanOwner, cleanRepo, pr.number);
        } catch (dErr: any) {
          console.warn(`Backfill: diff unavailable for PR #${pr.number}, using files metadata:`, dErr.message);
        }

        // Compute metrics and top files
        const totalAdditions = files.reduce((acc, f) => acc + (f.additions || 0), 0);
        const totalDeletions = files.reduce((acc, f) => acc + (f.deletions || 0), 0);
        const topFiles = files
          .slice(0, 8)
          .map((f) => `- ${f.filename} (${f.status}, +${f.additions}/-${f.deletions})`)
          .join('\n');

        // Truncate and sanitize diff/patch summary to avoid storing oversized memories
        let diffSummary = '';
        if (rawDiff && rawDiff.trim().length > 0) {
          diffSummary =
            rawDiff.length > MAX_DIFF_SUMMARY_CHARS
              ? rawDiff.slice(0, MAX_DIFF_SUMMARY_CHARS) + '\n... [Diff truncated for storage size]'
              : rawDiff;
        } else if (files.length > 0) {
          const patches = files
            .filter((f) => f.patch)
            .slice(0, 3)
            .map((f) => `--- ${f.filename} ---\n${f.patch}`)
            .join('\n\n');
          diffSummary =
            patches.length > MAX_DIFF_SUMMARY_CHARS
              ? patches.slice(0, MAX_DIFF_SUMMARY_CHARS) + '\n... [Patches truncated for storage size]'
              : patches;
        }

        const focusAreas = detectFocusAreas(files, rawDiff || pr.body || '');
        const safeBody = pr.body ? pr.body.slice(0, 400).replace(/[\r\n]+/g, ' ') : 'No description provided.';

        const memoryTitle = `PR #${pr.number}: ${pr.title.slice(0, 100)}`;
        const memoryContent = [
          `GitHub Pull Request #${pr.number} in repository ${cleanOwner}/${cleanRepo} was merged into branch "${pr.base?.ref || 'main'}" from "${pr.head?.ref || 'branch'}".`,
          `Merged At: ${pr.merged_at || 'Recently'}`,
          `Author: ${pr.user?.login || 'unknown'}`,
          `Description: ${safeBody}`,
          `Changes Summary: ${files.length} changed file(s) (+${totalAdditions}/-${totalDeletions})`,
          topFiles ? `Key Changed Files:\n${topFiles}` : '',
          diffSummary ? `Diff Summary:\n${diffSummary}` : '',
        ]
          .filter(Boolean)
          .join('\n\n');

        const relevanceNote = `Historical merged PR #${pr.number} in ${cleanOwner}/${cleanRepo}: ${pr.title.slice(0, 80)}`;

        const retainResult = await retainMemory({
          bank_id: cleanBankId,
          title: memoryTitle,
          type: 'pr_review',
          service: cleanRepo,
          content: memoryContent,
          relevance_note: relevanceNote,
          metadata: {
            source: 'github-backfill',
            owner: cleanOwner,
            repo: cleanRepo,
            pullNumber: pr.number,
            event: 'pr_merged',
            merged_at: pr.merged_at,
            author: pr.user?.login || 'unknown',
            base_branch: pr.base?.ref || 'main',
            head_branch: pr.head?.ref || 'unknown',
            html_url: pr.html_url,
            total_files: files.length,
            additions: totalAdditions,
            deletions: totalDeletions,
            focus_areas: focusAreas,
            tags: [
              'github',
              'backfill',
              'pr_merged',
              cleanRepo,
              ...focusAreas.map((f) => f.toLowerCase().replace(/\s+/g, '-')),
            ],
          },
        });

        if (retainResult && retainResult.success) {
          memoriesCreatedCount++;
          results.push({
            pullNumber: pr.number,
            title: pr.title,
            memory_id: retainResult.memory_id,
            status: 'created',
          });
        } else {
          results.push({
            pullNumber: pr.number,
            title: pr.title,
            error: 'Failed to retain memory in Hindsight bank.',
          });
        }
      } catch (prErr: any) {
        console.error(`Backfill failed for PR #${pr.number}:`, prErr.message);
        results.push({
          pullNumber: pr.number,
          title: pr.title,
          error: prErr.message || 'Unknown error processing PR.',
        });
      }
    }

    return NextResponse.json({
      success: true,
      owner: cleanOwner,
      repo: cleanRepo,
      requested: limit,
      processed: mergedPulls.length,
      memories_created: memoriesCreatedCount,
      results,
    });
  } catch (error: any) {
    console.error('API /api/github/backfill error:', error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to backfill historical GitHub pull requests into Hindsight.',
      },
      { status: 500 }
    );
  }
}
