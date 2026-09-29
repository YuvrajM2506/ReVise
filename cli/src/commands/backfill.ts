import { c, colors, banner, badge } from '../ui/colors';
import { createSpinner } from '../ui/spinner';
import { listPulls, getPullFiles, getPullDiff, GitHubFile } from '../../../frontend/src/lib/github';
import { retainMemory } from '../../../frontend/src/lib/hindsight';
import { getStore } from '../../../frontend/src/lib/storage';

export interface BackfillOptions {
  limit?: number;
  bank?: string;
  json?: boolean;
}

export async function backfillCommand(repoTarget: string, options: BackfillOptions = {}): Promise<void> {
  const clean = repoTarget.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '');
  const parts = clean.split('/');
  if (parts.length < 2) {
    console.error(`${c.brightRed}✖ Invalid repository format. Use "owner/repo" or "https://github.com/owner/repo".${c.reset}`);
    process.exit(1);
  }

  const [owner, repo] = parts;
  const limit = options.limit || 5;
  const bankId = options.bank || process.env.HINDSIGHT_BANK_ID || `${owner}/${repo}`;

  const spinner = createSpinner(`Fetching merged PRs for ${owner}/${repo} from GitHub...`);
  if (!options.json) spinner.start();

  try {
    const pulls = await listPulls(owner, repo, {
      state: 'closed',
      sort: 'updated',
      direction: 'desc',
      per_page: Math.min(limit * 3, 30),
    });

    const mergedPulls = pulls.filter(pr => pr.merged_at !== null).slice(0, limit);

    if (mergedPulls.length === 0) {
      spinner.stop();
      console.log(`${c.brightYellow}No merged pull requests found for ${owner}/${repo}.${c.reset}`);
      return;
    }

    spinner.update(`Found ${mergedPulls.length} merged PRs. Ingesting into Hindsight memory...`);

    let ingestedCount = 0;
    const results: Array<{ pull: number; title: string; memoryId?: string; status: string }> = [];

    for (const pr of mergedPulls) {
      spinner.update(`Processing PR #${pr.number}: ${pr.title.slice(0, 30)}...`);

      // Check if already in memory
      const store = getStore();
      const existing = store.memories.find(
        m => m.metadata?.owner?.toLowerCase() === owner.toLowerCase() &&
             m.metadata?.repo?.toLowerCase() === repo.toLowerCase() &&
             m.metadata?.pullNumber === pr.number
      );

      if (existing) {
        results.push({ pull: pr.number, title: pr.title, memoryId: existing.id, status: 'already_exists' });
        continue;
      }

      let files: GitHubFile[] = [];
      try {
        files = await getPullFiles(owner, repo, pr.number);
      } catch {}

      let rawDiff = '';
      try {
        rawDiff = await getPullDiff(owner, repo, pr.number);
      } catch {}

      const totalAdditions = files.reduce((acc, f) => acc + (f.additions || 0), 0);
      const totalDeletions = files.reduce((acc, f) => acc + (f.deletions || 0), 0);
      const topFiles = files.slice(0, 6).map(f => `- ${f.filename} (+${f.additions}/-${f.deletions})`).join('\n');

      const memoryTitle = `PR #${pr.number}: ${pr.title.slice(0, 80)}`;
      const memoryContent = [
        `GitHub Pull Request #${pr.number} in ${owner}/${repo} was merged into "${pr.base?.ref || 'main'}".`,
        `Author: ${pr.user?.login || 'unknown'} · Merged: ${pr.merged_at || 'recently'}`,
        `Description: ${pr.body ? pr.body.slice(0, 300) : 'None provided'}`,
        `Changes: ${files.length} files (+${totalAdditions}/-${totalDeletions})`,
        topFiles ? `Key files:\n${topFiles}` : '',
      ].filter(Boolean).join('\n\n');

      const retainRes = await retainMemory({
        bank_id: bankId,
        title: memoryTitle,
        type: 'pr_review',
        service: repo,
        content: memoryContent,
        relevance_note: `Historical merged PR #${pr.number} in ${owner}/${repo}`,
        metadata: {
          source: 'github-backfill',
          owner,
          repo,
          pullNumber: pr.number,
          merged_at: pr.merged_at,
          tags: ['github', 'backfill', repo],
        },
      });

      if (retainRes && retainRes.success) {
        ingestedCount++;
        results.push({ pull: pr.number, title: pr.title, memoryId: retainRes.memory_id, status: 'created' });
      }
    }

    spinner.stop();

    if (options.json) {
      console.log(JSON.stringify({ success: true, owner, repo, ingested_count: ingestedCount, results }, null, 2));
      return;
    }

    console.log(banner());
    console.log(`${c.brightGreen}✔ Successfully backfilled ${ingestedCount} pull requests from ${owner}/${repo} into memory.${c.reset}\n`);
    results.forEach(r => {
      console.log(`  ${r.status === 'created' ? `${c.brightGreen}✔${c.reset}` : `${c.dim}•${c.reset}`} PR #${r.pull}: ${r.title} ${r.memoryId ? `(${colors.teal}${r.memoryId}${c.reset})` : ''}`);
    });
    console.log('');
  } catch (err: any) {
    spinner.stop();
    console.error(`${c.brightRed}✖ Backfill failed:${c.reset} ${err.message}`);
    process.exit(1);
  }
}
