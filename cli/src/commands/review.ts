import fs from 'fs';
import path from 'path';
import { c, colors, banner, riskMeter, formatSeverity, badge } from '../ui/colors';
import { renderCard } from '../ui/tables';
import { createSpinner } from '../ui/spinner';
import { isGitRepo, getWorkingTreeDiff, getStagedDiff, getBranchDiff, readStdin, getCurrentBranch } from '../git';
import { getPullDiff, getPullFiles, postPullReview, GitHubFile } from '../../../frontend/src/lib/github';
import { recallMemories, filterRelevantMemories } from '../../../frontend/src/lib/hindsight';
import { evaluateCodeChange } from '../../../frontend/src/lib/groq';
import { getStore, saveStore, addDiagnosticLog } from '../../../frontend/src/lib/storage';
import { countDiffStats, extractDiffFileNames, countChangeStats } from '../../../frontend/src/lib/diff-stats';
import { EvaluationRun, FocusArea } from '../../../frontend/src/lib/types';

export interface ReviewOptions {
  staged?: boolean;
  branch?: string;
  memory?: boolean;
  post?: boolean;
  failOn?: 'HIGH' | 'MEDIUM' | 'LOW';
  json?: boolean;
  quiet?: boolean;
  service?: string;
  bank?: string;
}

function parseGitHubUrl(input: string): { owner: string; repo: string; pullNumber: number } | null {
  const clean = input.trim();
  const urlMatch = clean.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/pull\/(\d+)/i);
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2], pullNumber: parseInt(urlMatch[3], 10) };
  }
  const refMatch = clean.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)(?:#|\s+PR\s+#?)(\d+)$/i);
  if (refMatch) {
    return { owner: refMatch[1], repo: refMatch[2], pullNumber: parseInt(refMatch[3], 10) };
  }
  return null;
}

function detectFocusAreas(fileNames: string[], diffText: string): FocusArea[] {
  const areas: FocusArea[] = [];
  const textLower = (diffText + ' ' + fileNames.join(' ')).toLowerCase();

  if (textLower.includes('.sql') || textLower.includes('alter table') || textLower.includes('create index') || (textLower.includes('migration') && !textLower.includes('pre-commit'))) {
    areas.push('Unsafe DB migration');
  }
  if (textLower.includes('secret') || textLower.includes('password') || textLower.includes('api_key') || textLower.includes('private_key') || textLower.includes('stripe_')) {
    areas.push('Missing secret');
  }
  if (textLower.includes('package.json') || textLower.includes('requirements.txt') || textLower.includes('cargo.toml') || textLower.includes('go.mod')) {
    areas.push('Dependency upgrade');
  }
  if (textLower.includes('api/') || textLower.includes('routes/') || textLower.includes('controller') || textLower.includes('graphql')) {
    areas.push('API contract change');
  }
  if (fileNames.some(f => f.includes('.git') || f.includes('.docker') || f.includes('flake8') || f.includes('pre-commit') || f.endsWith('.md') || f.endsWith('.yml') || f.endsWith('.yaml') || f.endsWith('.json') || f.endsWith('.toml'))) {
    if (areas.length === 0) {
      areas.push('Configuration & Tooling');
    }
  }

  return areas.length > 0 ? areas : ['General Review'];
}

export async function reviewCommand(target?: string, options: ReviewOptions = {}): Promise<void> {
  const memoryEnabled = options.memory !== false;
  const spinner = createSpinner('Initializing ReVise Review Engine...');

  try {
    let diffContent = '';
    let prTitle = 'Local Code Review';
    let serviceName = options.service || 'local-service';
    let primaryFile = 'changeset.diff';
    let fileList: string[] = [];
    let githubMeta: { owner: string; repo: string; pullNumber: number } | null = null;
    let githubFiles: GitHubFile[] = [];

    // 1. Check if target is a GitHub PR URL or shorthand
    if (target && parseGitHubUrl(target)) {
      githubMeta = parseGitHubUrl(target)!;
      prTitle = `PR #${githubMeta.pullNumber}: ${githubMeta.owner}/${githubMeta.repo}`;
      serviceName = options.service || githubMeta.repo;

      if (!options.json && !options.quiet) spinner.start(`Fetching GitHub PR #${githubMeta.pullNumber} (${githubMeta.owner}/${githubMeta.repo})...`);

      try {
        githubFiles = await getPullFiles(githubMeta.owner, githubMeta.repo, githubMeta.pullNumber);
        fileList = githubFiles.map(f => f.filename);
      } catch (err: any) {
        // Fall back gracefully to raw diff
      }

      try {
        diffContent = await getPullDiff(githubMeta.owner, githubMeta.repo, githubMeta.pullNumber);
      } catch (err: any) {
        if (githubFiles.length > 0) {
          const patchSummary = githubFiles.filter(f => f.patch).map(f => `--- ${f.filename} ---\n${f.patch}`).join('\n\n');
          diffContent = patchSummary;
        } else {
          throw new Error(`Could not fetch PR diff from GitHub: ${err.message}`);
        }
      }
    } else if (target === '-' || (!target && !process.stdin.isTTY)) {
      // 2. Read from Stdin
      if (!options.json && !options.quiet) spinner.start('Reading diff from stdin...');
      diffContent = await readStdin();
      prTitle = 'Stdin Diff Review';
    } else if (target && fs.existsSync(target)) {
      // 3. Read specific local file
      if (!options.json && !options.quiet) spinner.start(`Reading local file ${target}...`);
      const stat = fs.statSync(target);
      if (stat.isDirectory()) {
        throw new Error(`Target is a directory: ${target}. Specify a file or run in git repository mode.`);
      }
      diffContent = fs.readFileSync(target, 'utf-8');
      primaryFile = target;
      fileList = [target];
      prTitle = `File Review: ${path.basename(target)}`;
      serviceName = options.service || path.basename(path.dirname(path.resolve(target)));
    } else if (options.staged) {
      // 4. Staged git changes
      if (!isGitRepo()) throw new Error('Not inside a Git repository. Cannot use --staged.');
      if (!options.json && !options.quiet) spinner.start('Inspecting staged git changes...');
      diffContent = getStagedDiff();
      prTitle = `Git Staged Changes (${getCurrentBranch()})`;
    } else if (options.branch) {
      // 5. Branch diff
      if (!isGitRepo()) throw new Error(`Not inside a Git repository. Cannot diff against branch ${options.branch}.`);
      if (!options.json && !options.quiet) spinner.start(`Diffing against branch ${options.branch}...`);
      diffContent = getBranchDiff(options.branch);
      prTitle = `Branch Diff (vs ${options.branch})`;
    } else if (isGitRepo()) {
      // 6. Working tree diff
      if (!options.json && !options.quiet) spinner.start('Inspecting working tree changes...');
      diffContent = getWorkingTreeDiff();
      if (!diffContent) {
        diffContent = getStagedDiff();
      }
      prTitle = `Git Working Tree (${getCurrentBranch()})`;
    }

    if (!diffContent || !diffContent.trim()) {
      spinner.stop();
      console.log(`${c.brightYellow}ℹ No changes found to review.${c.reset} Stage changes with \`git add\` or pass a file / PR URL.`);
      return;
    }

    // Determine files and stats
    if (fileList.length === 0) {
      fileList = extractDiffFileNames(diffContent);
    }
    if (fileList.length > 0) {
      primaryFile = fileList[0];
    }
    const diffStats = countChangeStats(diffContent);
    const focusAreas = detectFocusAreas(fileList, diffContent);

    // Memory Retrieval
    let retrievedMemories: any[] = [];
    let relevantMemories: any[] = [];
    let excludedMemories: any[] = [];

    if (memoryEnabled) {
      if (!options.json && !options.quiet) spinner.update('Retrieving relevant engineering memories from Hindsight...');
      const recallQuery = `${serviceName} ${prTitle} ${fileList.slice(0, 5).join(' ')} ${diffContent.slice(0, 150)}`;
      const recallResult = await recallMemories(
        recallQuery,
        { service: serviceName, top_k: 4 },
        options.bank || process.env.HINDSIGHT_BANK_ID || 'acme-platform'
      );
      retrievedMemories = recallResult.memories;

      const filterResult = filterRelevantMemories(retrievedMemories, {
        service: serviceName,
        files: fileList.map(f => ({ filename: f })),
        diff_content: diffContent,
        focus_areas: focusAreas,
        pr_title: prTitle,
      });

      relevantMemories = filterResult.relevant;
      excludedMemories = filterResult.excluded;
    }

    // Groq LPU Evaluation
    if (!options.json && !options.quiet) spinner.update('Reasoning over changeset with Groq LPU models...');
    const evalResult = await evaluateCodeChange({
      pr_title: prTitle,
      service: serviceName,
      environment: 'Production',
      policy: 'Strict production policy',
      focus_areas: focusAreas,
      code_snippet: diffContent,
      file_name: primaryFile,
      language: 'TypeScript',
      memories: relevantMemories,
      memory_enabled: memoryEnabled,
    });

    const output = evalResult.output;
    const runId = `run-cli-${Date.now().toString(36)}`;

    // Persist evaluation run
    const newRun: EvaluationRun = {
      id: runId,
      owner: githubMeta?.owner,
      repo: githubMeta?.repo,
      pull_number: githubMeta?.pullNumber,
      created_at: new Date().toISOString(),
      relative_time: 'Just now',
      status: output.risk_score >= 70 ? 'HIGH RISK' : output.risk_score >= 40 ? 'MEDIUM RISK' : 'RESOLVED',
      title: prTitle,
      service: serviceName,
      environment: 'Production',
      policy: 'Strict production policy',
      focus_areas: focusAreas,
      code_snippet: diffContent,
      file_name: primaryFile,
      language: 'TypeScript',
      memory_enabled: memoryEnabled,
      files_changed: diffStats.files_changed || fileList.length,
      lines_changed: diffStats.lines_changed,
      retrieved_memories_count: retrievedMemories.length,
      retrieved_memory_ids: retrievedMemories.map(m => m.id),
      relevant_memories_count: relevantMemories.length,
      excluded_memories_count: excludedMemories.length,
      output,
      execution_latency_ms: evalResult.latency_ms,
      changed_files: fileList.map(f => ({ filename: f, additions: 0, deletions: 0 })),
    };

    const store = getStore();
    store.runs.unshift(newRun);
    if (store.runs.length > 50) store.runs = store.runs.slice(0, 50);
    saveStore(store);

    addDiagnosticLog('GROQ_EVAL', serviceName, `CLI evaluated ${prTitle} (Risk: ${output.risk_score}/100)`, evalResult.latency_ms, true);

    // Optional: Post back to GitHub PR if requested
    let githubCommentStatus = '';
    if (options.post && githubMeta) {
      if (!options.json && !options.quiet) spinner.update('Posting review assessment to GitHub PR...');
      try {
        const citationsText = output.memory_citations?.length
          ? `\n\n### 🧠 Historical Memory Precedent:\n` + output.memory_citations.map(m => `- **${m.title}** (${m.type}): ${m.relevance_note}`).join('\n')
          : '';
        const md = `## 🛡️ ReVise Risk Assessment: ${output.risk_score}/100 (${output.risk_level} Risk)\n> **Provenance**: ${output.provenance_note}\n\n### 🔍 Key Findings:\n${output.findings.map(f => `- **[${f.severity}]** ${f.title}\n  ${f.description}`).join('\n\n')}\n\n### 🚀 Safer Rollout:\n${output.safer_rollout.map(s => `- ${s}`).join('\n')}${citationsText}\n\n---\n*Evaluated by **ReVise CLI** with **Hindsight Memory** and **Groq LPU**.*`;
        await postPullReview(githubMeta.owner, githubMeta.repo, githubMeta.pullNumber, md);
        githubCommentStatus = 'Posted review comment to GitHub PR';
      } catch (pErr: any) {
        githubCommentStatus = `Failed to post review: ${pErr.message}`;
      }
    }

    spinner.stop();

    // Output formatting
    if (options.json) {
      console.log(JSON.stringify({ success: true, run_id: runId, output, run: newRun }, null, 2));
      return;
    }

    if (options.quiet) {
      console.log(`${riskMeter(output.risk_score, output.risk_level)} | ${output.summary}`);
      for (const f of output.findings) {
        console.log(`  ${formatSeverity(f.severity)} ${f.title}`);
      }
      return;
    }

    // Rich Terminal Report
    console.log(banner());
    console.log(`${c.bold}Target:${c.reset} ${colors.lightTeal}${prTitle}${c.reset}  ${c.dim}(Service: ${serviceName})${c.reset}`);
    console.log(`${c.bold}Scope:${c.reset}  ${diffStats.files_changed} files changed · ${diffStats.lines_changed} lines · Focus: ${focusAreas.join(', ')}`);
    console.log(`${c.bold}Memory:${c.reset} ${memoryEnabled ? `${c.brightGreen}ONLINE${c.reset} (${relevantMemories.length} cited / ${retrievedMemories.length} retrieved)` : `${c.brightYellow}DISABLED${c.reset}`}`);
    console.log('');
    console.log(`${c.bold}RISK ASSESSMENT${c.reset}`);
    console.log(riskMeter(output.risk_score, output.risk_level));
    console.log(`${c.dim}Provenance: ${output.provenance_note}${c.reset}`);
    console.log('');

    // Summary Card
    console.log(renderCard('EXECUTIVE SUMMARY', output.summary, colors.teal));
    console.log('');

    // Key Findings
    if (output.findings && output.findings.length > 0) {
      console.log(`${c.bold}🔍 KEY FINDINGS (${output.findings.length})${c.reset}`);
      output.findings.forEach((f, idx) => {
        console.log(`  ${formatSeverity(f.severity)} ${c.bold}${f.title}${c.reset}`);
        console.log(`    ${colors.slate}${f.description}${c.reset}`);
        if (f.source_memory_ids && f.source_memory_ids.length > 0) {
          console.log(`    ${c.dim}↳ Cites memories: ${f.source_memory_ids.join(', ')}${c.reset}`);
        }
        console.log('');
      });
    } else {
      console.log(`${c.brightGreen}✔ No blocking findings identified for this change.${c.reset}\n`);
    }

    // Historical Memory Citations
    if (output.memory_citations && output.memory_citations.length > 0) {
      console.log(`${c.bold}🧠 CITED ENGINEERING MEMORIES (${output.memory_citations.length})${c.reset}`);
      output.memory_citations.forEach(m => {
        console.log(`  ${badge(m.type, 'amber')} ${c.bold}${m.title}${c.reset} ${c.dim}(${m.service || serviceName} · ${m.date})${c.reset}`);
        console.log(`    ${colors.slate}${m.relevance_note}${c.reset}`);
      });
      console.log('');
    }

    // Recommended Safer Rollout
    if (output.safer_rollout && output.safer_rollout.length > 0) {
      console.log(`${c.bold}🚀 RECOMMENDED SAFER ROLLOUT${c.reset}`);
      output.safer_rollout.forEach((step, i) => {
        console.log(`  ${colors.teal}${i + 1}.${c.reset} ${step}`);
      });
      console.log('');
    }

    if (githubCommentStatus) {
      console.log(`${colors.lightTeal}ℹ GitHub:${c.reset} ${githubCommentStatus}\n`);
    }

    console.log(`${c.dim}Run ID: ${runId} · To ask questions about this review run: \`revise chat ${runId}\`${c.reset}\n`);

    // CI / Pre-commit Failure Threshold Check
    if (options.failOn) {
      const threshold = options.failOn.toUpperCase();
      const score = output.risk_score;
      if (threshold === 'HIGH' && score >= 70) {
        console.error(`${c.brightRed}✖ Review failed: Risk score (${score}) meets HIGH threshold (--fail-on HIGH).${c.reset}`);
        process.exit(1);
      } else if (threshold === 'MEDIUM' && score >= 40) {
        console.error(`${c.brightYellow}✖ Review failed: Risk score (${score}) meets MEDIUM threshold (--fail-on MEDIUM).${c.reset}`);
        process.exit(1);
      }
    }
  } catch (err: any) {
    spinner.stop();
    if (options.json) {
      console.error(JSON.stringify({ success: false, error: err.message }));
    } else {
      console.error(`\n${c.brightRed}✖ Review failed:${c.reset} ${err.message}\n`);
    }
    process.exit(1);
  }
}
