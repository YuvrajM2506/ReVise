import { NextRequest, NextResponse } from 'next/server';
import { retainMemory } from '@/lib/hindsight';
import { MemoryType } from '@/lib/types';

const ALLOWED_EVENTS = ['pr_merged', 'pr_closed', 'ci_failed'] as const;
type GitHubOutcomeEvent = (typeof ALLOWED_EVENTS)[number];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      owner,
      repo,
      pullNumber,
      event,
      bankId,
      metadata = {},
    } = body;

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

    if (!pullNumber || typeof pullNumber !== 'number' || !Number.isInteger(pullNumber) || pullNumber <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid pull request number is required (must be a positive integer).' },
        { status: 400 }
      );
    }

    if (!bankId || typeof bankId !== 'string' || bankId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Memory bank ID is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    if (!event || !ALLOWED_EVENTS.includes(event as GitHubOutcomeEvent)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid event type. Must be one of: ${ALLOWED_EVENTS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const cleanOwner = owner.trim();
    const cleanRepo = repo.trim();
    const cleanBankId = bankId.trim();
    const safeMetadata = typeof metadata === 'object' && metadata !== null ? metadata : {};

    // 2. Formulate memory title, content, type, and relevance note
    let memoryTitle = '';
    let memoryContent = '';
    let memoryType: MemoryType = 'outcome_feedback';
    let relevanceNote = '';

    switch (event as GitHubOutcomeEvent) {
      case 'pr_merged':
        memoryTitle = `PR #${pullNumber} Merged: ${cleanOwner}/${cleanRepo}`;
        memoryContent = `GitHub Pull Request #${pullNumber} in repository ${cleanOwner}/${cleanRepo} was successfully merged.\n` +
          `Outcome: Change was reviewed, verified, and safely incorporated into the main codebase.\n` +
          `Event Details: ${JSON.stringify(safeMetadata)}`;
        memoryType = 'outcome_feedback';
        relevanceNote = `Verified merged PR outcome for ${cleanOwner}/${cleanRepo} #${pullNumber}`;
        break;

      case 'pr_closed':
        memoryTitle = `PR #${pullNumber} Closed Unmerged: ${cleanOwner}/${cleanRepo}`;
        memoryContent = `GitHub Pull Request #${pullNumber} in repository ${cleanOwner}/${cleanRepo} was closed without merge.\n` +
          `Outcome: Change was abandoned, rejected in review, or superseded.\n` +
          `Event Details: ${JSON.stringify(safeMetadata)}`;
        memoryType = 'outcome_feedback';
        relevanceNote = `Closed/unmerged PR outcome for ${cleanOwner}/${cleanRepo} #${pullNumber}`;
        break;

      case 'ci_failed':
        memoryTitle = `CI Pipeline Failure on PR #${pullNumber}: ${cleanOwner}/${cleanRepo}`;
        memoryContent = `Automated Continuous Integration (CI) checks failed on GitHub Pull Request #${pullNumber} in ${cleanOwner}/${cleanRepo}.\n` +
          `Failure Context: ${safeMetadata.failure_reason || safeMetadata.error || 'CI test suite or build step returned a non-zero exit code.'}\n` +
          `Event Details: ${JSON.stringify(safeMetadata)}`;
        memoryType = 'pipeline_failure';
        relevanceNote = `Observed CI pipeline failure on ${cleanOwner}/${cleanRepo} #${pullNumber}`;
        break;
    }

    // 3. Write memory to Hindsight using existing retainMemory helper
    const retainResult = await retainMemory({
      bank_id: cleanBankId,
      title: memoryTitle,
      type: memoryType,
      service: cleanRepo,
      content: memoryContent,
      relevance_note: relevanceNote,
      metadata: {
        source: 'github',
        owner: cleanOwner,
        repo: cleanRepo,
        pullNumber,
        event,
        ...safeMetadata,
        tags: ['github', 'outcome', event, cleanRepo],
      },
    });

    if (!retainResult || !retainResult.success) {
      throw new Error('Hindsight memory retention failed.');
    }

    // 4. Return structured outcome response
    return NextResponse.json({
      success: true,
      event,
      owner: cleanOwner,
      repo: cleanRepo,
      pullNumber,
      memory_id: retainResult.memory_id,
      is_reinforced: retainResult.is_reinforced,
      confidence_score: retainResult.confidence_score,
      message: 'GitHub PR outcome stored in Hindsight',
    });
  } catch (error: any) {
    console.error('API /api/github/outcome error:', error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to record GitHub outcome to Hindsight memory bank.',
      },
      { status: 500 }
    );
  }
}
