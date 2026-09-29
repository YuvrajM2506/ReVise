import { NextRequest, NextResponse } from 'next/server';
import { getPullDiff, getPullFiles, postPullReview, GitHubFile } from '@/lib/github';
import { recallMemories, filterRelevantMemories } from '@/lib/hindsight';
import { evaluateCodeChange } from '@/lib/groq';
import { getStore, saveStore, addDiagnosticLog } from '@/lib/storage';
import { countDiffStats, extractDiffFileNames } from '@/lib/diff-stats';
import { EvaluationRun, FocusArea } from '@/lib/types';
import { readCappedJson } from '@/lib/rate-limit';

const MAX_DIFF_CHARS = 25000;

function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'sql':
      return 'PostgreSQL';
    case 'ts':
    case 'tsx':
      return 'TypeScript';
    case 'js':
    case 'jsx':
      return 'JavaScript';
    case 'py':
      return 'Python';
    case 'go':
      return 'Go';
    case 'rs':
      return 'Rust';
    case 'json':
      return 'JSON';
    case 'yml':
    case 'yaml':
      return 'YAML';
    case 'md':
      return 'Markdown';
    default:
      return 'Text';
  }
}

function detectFocusAreas(files: GitHubFile[], diffText: string): FocusArea[] {
  const areas: FocusArea[] = [];
  const textLower = (diffText + ' ' + files.map(f => f.filename).join(' ')).toLowerCase();

  if (textLower.includes('.sql') || textLower.includes('alter table') || textLower.includes('create index') || (textLower.includes('migration') && !textLower.includes('pre-commit'))) {
    areas.push('Unsafe DB migration');
  }
  if (textLower.includes('secret') || textLower.includes('password') || textLower.includes('api_key') || textLower.includes('private_key')) {
    areas.push('Missing secret');
  }
  if (textLower.includes('package.json') || textLower.includes('requirements.txt') || textLower.includes('cargo.toml') || textLower.includes('go.mod') || textLower.includes('pom.xml')) {
    areas.push('Dependency upgrade');
  }
  if (textLower.includes('api/') || textLower.includes('routes/') || textLower.includes('controller') || textLower.includes('graphql')) {
    areas.push('API contract change');
  }
  if (files.some(f => f.filename.includes('.git') || f.filename.includes('.docker') || f.filename.includes('flake8') || f.filename.includes('pre-commit') || f.filename.endsWith('.md') || f.filename.endsWith('.yml') || f.filename.endsWith('.yaml') || f.filename.endsWith('.json') || f.filename.endsWith('.toml'))) {
    if (areas.length === 0) {
      areas.push('Configuration & Tooling');
    }
  }

  return areas.length > 0 ? areas : ['General Review'];
}

export async function POST(req: NextRequest) {
  try {
    // GitHub reads and Groq tokens are both metered; this endpoint triggers both.
    const guard = await readCappedJson(req, {
      bucket: 'github-analyze',
      limit: 20,
      windowMs: 60_000,
      maxBodyBytes: 16_000,
    });
    if (!guard.ok) return guard.response;
    const body = guard.body ?? {};
    const {
      owner,
      repo,
      pullNumber,
      bankId,
      memoryEnabled = true,
      postToGitHub = false,
    } = body;

    // 1. Validate inputs
    if (!owner || typeof owner !== 'string' || owner.trim() === '') {
      return NextResponse.json({ success: false, error: 'Repository owner is required.' }, { status: 400 });
    }
    if (!repo || typeof repo !== 'string' || repo.trim() === '') {
      return NextResponse.json({ success: false, error: 'Repository name is required.' }, { status: 400 });
    }
    if (!pullNumber || typeof pullNumber !== 'number' || !Number.isInteger(pullNumber) || pullNumber <= 0) {
      return NextResponse.json({ success: false, error: 'Valid pull request number is required.' }, { status: 400 });
    }

    const cleanOwner = owner.trim();
    const cleanRepo = repo.trim();
    // Anonymous GitHub requests interpolate owner/repo into URLs; reject values
    // with URL syntax before they get there.
    if (/[/?#\s]/.test(cleanOwner) || /[/?#\s]/.test(cleanRepo)) {
      return NextResponse.json({ success: false, error: 'Owner and repository must be plain names.' }, { status: 400 });
    }
    const configuredBankId = process.env.HINDSIGHT_BANK_ID?.trim();
    const targetBankId = (typeof bankId === 'string' && bankId.trim() !== '')
      ? bankId.trim()
      : (configuredBankId || `${cleanOwner}/${cleanRepo}`);
    const startTime = Date.now();
    const warnings: string[] = [];

    // 2. Fetch changed files (non-fatal on its own: the diff is what we review)
    let files: GitHubFile[] = [];
    let filesError: string | null = null;
    try {
      files = await getPullFiles(cleanOwner, cleanRepo, pullNumber);
    } catch (err: any) {
      filesError = err.message;
      warnings.push(`Changed file metadata unavailable: ${err.message}`);
      console.warn(`Failed to fetch files for PR #${pullNumber}:`, err.message);
    }

    // 3. Fetch the PR diff. Reading the change is mandatory: a review of an
    //    unread diff would invent findings, so failure here aborts the request.
    let diffContent = '';
    let diffTruncated = false;
    let diffError: string | null = null;

    try {
      const rawDiff = await getPullDiff(cleanOwner, cleanRepo, pullNumber);
      if (rawDiff.length > MAX_DIFF_CHARS) {
        diffContent = rawDiff.slice(0, MAX_DIFF_CHARS) + '\n\n... [Diff truncated to avoid token limit] ...';
        diffTruncated = true;
      } else {
        diffContent = rawDiff;
      }
    } catch (err: any) {
      // Large diff or GitHub 406 refusals still carry per-file patches.
      diffError = err.message;
      console.warn(`Direct getPullDiff failed for PR #${pullNumber} (${err.message}), falling back to file patches.`);
    }

    if (!diffContent.trim()) {
      const patchFiles = files.filter(f => f.patch);
      if (patchFiles.length > 0) {
        const fileSummary = files.map(f => `- ${f.filename} (${f.status}, +${f.additions}/-${f.deletions})`).join('\n');
        const patchesSummary = patchFiles
          .slice(0, 10)
          .map(f => `--- ${f.filename} (${f.status}) ---\n${f.patch}`)
          .join('\n\n');

        diffContent = `Summary of Changed Files (${files.length} files total):\n${fileSummary}\n\nAvailable File Patches:\n${patchesSummary}`;
        if (diffContent.length > MAX_DIFF_CHARS) {
          diffContent = diffContent.slice(0, MAX_DIFF_CHARS) + '\n\n... [Patches summary truncated] ...';
        }
        diffTruncated = true;
        warnings.push(`Full diff unavailable (${diffError}), reviewed individual file patches instead.`);
      } else {
        const reason = diffError || filesError || 'GitHub returned an empty diff for this pull request.';
        console.warn(`Aborting review of PR #${pullNumber}: ${reason}`);
        return NextResponse.json({ success: false, error: reason }, { status: 502 });
      }
    }

    // 4. Determine file metadata, size of the change, and focus areas
    const diffFileNames = extractDiffFileNames(diffContent);
    const diffStats = countDiffStats(diffContent);
    // Prefer GitHub's file list when it answered; otherwise trust the diff headers.
    const filesChanged = files.length || diffFileNames.length || diffStats.files_changed;
    // GitHub's file list carries exact additions/deletions; the diff headers are
    // the fallback for when that list is unavailable or the diff was truncated.
    const linesChanged = files.length
      ? files.reduce((acc, f) => acc + (f.additions || 0) + (f.deletions || 0), 0)
      : diffStats.lines_changed;
    const primaryFile = files[0]?.filename || diffFileNames[0] || 'changeset.diff';
    const primaryLang = detectLanguage(primaryFile);
    const focusAreas = detectFocusAreas(files, diffContent);
    const prTitle = `PR #${pullNumber}: Changes in ${cleanRepo}`;
    const serviceName = cleanRepo;

    // 5. Memory Retrieval (if memory is enabled)
    let retrievedMemories: any[] = [];
    let relevantMemories: any[] = [];
    let excludedMemories: any[] = [];
    let retrievalLatency = 0;

    if (memoryEnabled) {
      const recallQuery = `${cleanRepo} PR #${pullNumber} ${files.map(f => f.filename).slice(0, 5).join(' ')} ${diffContent.slice(0, 150)}`;
      const focusFilter = (focusAreas[0] === 'General Review' || focusAreas[0] === 'Configuration & Tooling') ? undefined : focusAreas[0];
      const recallResult = await recallMemories(
        recallQuery,
        {
          service: serviceName,
          focus_area: focusFilter,
          top_k: 4,
        },
        targetBankId
      );
      retrievedMemories = recallResult.memories;
      retrievalLatency = recallResult.retrieval_latency_ms;

      // Filter and rank for strict relevance against the current PR files and diff
      const filterResult = filterRelevantMemories(retrievedMemories, {
        service: serviceName,
        files,
        diff_content: diffContent,
        focus_areas: focusAreas,
        language: primaryLang,
        pr_title: prTitle,
      });

      relevantMemories = filterResult.relevant;
      excludedMemories = filterResult.excluded;
    }

    // 6. Call Groq with structured output schema & relevant memory injection
    const evalResult = await evaluateCodeChange({
      pr_title: prTitle,
      service: serviceName,
      environment: 'Production',
      policy: 'Strict production policy',
      focus_areas: focusAreas,
      code_snippet: diffContent,
      file_name: primaryFile,
      language: primaryLang,
      memories: relevantMemories,
      memory_enabled: memoryEnabled,
    });

    const output = evalResult.output;
    const totalLatency = Date.now() - startTime;
    const runId = `run-gh-${cleanOwner}-${cleanRepo}-${pullNumber}-${Date.now().toString(36)}`;
    const filesCount = files.length;
    const changedFilesList = files.map(f => ({
      filename: f.filename,
      additions: f.additions || 0,
      deletions: f.deletions || 0,
      status: f.status,
    }));

    // 7. Determine status
    let status: EvaluationRun['status'] = 'SAFE';
    if (output.risk_score >= 70) {
      status = 'HIGH RISK';
    } else if (output.risk_score >= 40) {
      status = 'MEDIUM RISK';
    } else {
      status = 'RESOLVED';
    }

    // 8. Persist evaluation run
    const newRun: EvaluationRun = {
      id: runId,
      owner: cleanOwner,
      repo: cleanRepo,
      pull_number: pullNumber,
      created_at: new Date().toISOString(),
      relative_time: 'Just now',
      status,
      title: `${cleanRepo} #${pullNumber} review`,
      service: serviceName,
      environment: 'Production',
      policy: 'Strict production policy',
      focus_areas: focusAreas,
      code_snippet: diffContent,
      file_name: primaryFile,
      language: primaryLang,
      memory_enabled: memoryEnabled,
      files_changed: filesChanged,
      lines_changed: linesChanged,
      retrieved_memories_count: retrievedMemories.length,
      retrieved_memory_ids: retrievedMemories.map(m => m.id),
      relevant_memories_count: relevantMemories.length,
      excluded_memories_count: excludedMemories.length,
      output,
      execution_latency_ms: totalLatency,
      changed_files: changedFilesList,
    };

    const store = getStore();
    store.runs.unshift(newRun);
    if (store.runs.length > 50) {
      store.runs = store.runs.slice(0, 50);
    }
    saveStore(store);

    addDiagnosticLog(
      'GROQ_EVAL',
      serviceName,
      `Evaluated GitHub PR #${pullNumber} for ${cleanOwner}/${cleanRepo} (Risk: ${output.risk_score}/100, Memory: ${memoryEnabled ? 'ON' : 'OFF'}, ${relevantMemories.length}/${retrievedMemories.length} relevant)`,
      totalLatency,
      true
    );

    // 9. Optional: Post review comment to GitHub
    let gitHubReviewPosted = false;
    let gitHubReviewId: number | null = null;

    if (postToGitHub) {
      try {
        const citationsText = output.memory_citations.length > 0
          ? `\n\n### 🧠 Historical Memory Evidence:\n` + output.memory_citations.map(m => `- **${m.title}** (${m.type}, ${m.date}): ${m.relevance_note}`).join('\n')
          : '';

        const reviewMarkdown = `## 🛡️ ReVise Risk Assessment: ${output.risk_score}/100 (${output.risk_level} Risk)
> **Provenance**: ${output.provenance_note}

### 🔍 Key Findings:
${output.findings.map(f => `- **[${f.severity}]** ${f.title}\n  ${f.description}`).join('\n\n')}

### 🚀 Recommended Safer Rollout:
${output.safer_rollout.map(s => `- ${s}`).join('\n')}${citationsText}

---
*Evaluated with **ReVise** AI Review Agent powered by **Hindsight Memory** and **Groq LPU**.*`;

        const reviewRes = await postPullReview(cleanOwner, cleanRepo, pullNumber, reviewMarkdown);
        gitHubReviewPosted = true;
        gitHubReviewId = reviewRes.id;
      } catch (err: any) {
        console.error(`Failed to post GitHub review comment on PR #${pullNumber}:`, err.message);
      }
    }

    return NextResponse.json({
      success: true,
      run_id: runId,
      run: newRun,
      review: output,
diff_truncated: diffTruncated,
      files_analyzed_count: filesCount || files.length || diffFileNames.length,
      lines_changed: linesChanged,
      files: changedFilesList,
      retrieved_memories_count: retrievedMemories.length,
      relevant_memories_count: relevantMemories.length,
      excluded_memories_count: excludedMemories.length,
      excluded_memories: excludedMemories,
      warnings,
      github_comment_posted: gitHubReviewPosted,
      github_review_id: gitHubReviewId,
      retrieval_latency_ms: retrievalLatency,
      total_latency_ms: totalLatency,
    });
  } catch (error: any) {
    console.error('API /api/github/analyze error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'GitHub PR analysis failed' },
      { status: 500 }
    );
  }
}
