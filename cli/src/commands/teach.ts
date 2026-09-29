import readline from 'readline';
import { c, colors, banner, badge } from '../ui/colors';
import { createSpinner } from '../ui/spinner';
import { retainMemory } from '../../../frontend/src/lib/hindsight';
import { getStore, saveStore } from '../../../frontend/src/lib/storage';
import { CausalTimelineNode } from '../../../frontend/src/lib/types';

export interface TeachOptions {
  runId?: string;
  title?: string;
  service?: string;
  outcome?: 'Failed in staging' | 'Shipped clean' | 'Rolled back' | 'Caught in review';
  rootCause?: string;
  fix?: string;
  helpful?: 'Yes, it caught the risk early' | 'Partially helpful' | 'Not helpful';
  json?: boolean;
}

const OUTCOME_OPTIONS = ['Shipped clean', 'Caught in review', 'Failed in staging', 'Rolled back'] as const;

function promptQuestion(rl: readline.Interface, query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(`${colors.teal}?${c.reset} ${c.bold}${query}${c.reset} `, (answer) => {
      resolve(answer.trim());
    });
  });
}

export async function teachCommand(options: TeachOptions = {}): Promise<void> {
  const store = getStore();

  let relatedChangeTitle = options.title;
  let service = options.service;
  let outcome = options.outcome;
  let rootCause = options.rootCause || '';
  let whatFixedIt = options.fix || '';
  let relatedRunId = options.runId;
  const wasHelpful = options.helpful || 'Yes, it caught the risk early';

  // If non-interactive flags are missing, launch wizard
  if (!relatedChangeTitle || !service || !outcome) {
    if (!process.stdin.isTTY) {
      console.error(`${c.brightRed}✖ Non-interactive mode requires --title, --service, and --outcome.${c.reset}`);
      process.exit(1);
    }

    console.log(banner());
    console.log(`${c.bold}Teach ReVise: Write-Back Organizational Memory${c.reset}`);
    console.log(`${c.dim}Record production outcomes and resolutions to reinforce team memory.${c.reset}\n`);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      // 1. Title or previous run
      if (!relatedChangeTitle) {
        const defaultTitle = store.runs[0]?.title || 'Order Session Migration';
        const ans = await promptQuestion(rl, `Change or PR title [default: "${defaultTitle}"]:`);
        relatedChangeTitle = ans || defaultTitle;
        if (!relatedRunId && store.runs[0]) {
          relatedRunId = store.runs[0].id;
        }
      }

      // 2. Service
      if (!service) {
        const defaultService = store.runs[0]?.service || 'orders-service';
        const ans = await promptQuestion(rl, `Affected Service / Repository [default: "${defaultService}"]:`);
        service = ans || defaultService;
      }

      // 3. Outcome selection
      if (!outcome) {
        console.log(`\nSelect Deployment Outcome:`);
        OUTCOME_OPTIONS.forEach((opt, i) => {
          console.log(`  ${c.bold}[${i + 1}]${c.reset} ${opt}`);
        });
        const choice = await promptQuestion(rl, `Enter choice (1-4) [default: 2]:`);
        const idx = parseInt(choice, 10) - 1;
        outcome = (OUTCOME_OPTIONS[idx] || 'Caught in review') as any;
      }

      // 4. Root cause
      if (!rootCause) {
        rootCause = await promptQuestion(rl, `Root cause description (optional):`);
      }

      // 5. Fix / Resolution
      if (!whatFixedIt) {
        whatFixedIt = await promptQuestion(rl, `Resolution / What fixed it (optional):`);
      }

      rl.close();
    } catch (e) {
      rl.close();
      throw e;
    }
  }

  const spinner = createSpinner('Retaining outcome into Hindsight organizational memory...');
  if (!options.json) spinner.start();

  try {
    const retainResult = await retainMemory({
      title: `Outcome: ${relatedChangeTitle} (${outcome})`,
      type: 'outcome_feedback',
      service: service!,
      content: `Deployment Outcome: ${outcome}\nRoot Cause: ${rootCause}\nResolution / What Fixed It: ${whatFixedIt}\nReview Feedback: ${wasHelpful}`,
      relevance_note: `Taught outcome for: ${relatedChangeTitle}`,
      metadata: {
        related_run_id: relatedRunId,
        related_change_title: relatedChangeTitle,
        outcome,
        was_recommendation_helpful: wasHelpful,
        tags: ['outcome', 'resolution', outcome.toLowerCase().replace(/\s+/g, '-')],
      },
    });

    // Append to Causal Timeline
    const newNodeId = `TL-${Date.now().toString(36)}`;
    const newTimelineNode: CausalTimelineNode = {
      id: newNodeId,
      date: 'Just now',
      title: `${relatedChangeTitle} — ${outcome}`,
      subtitle: whatFixedIt || rootCause || 'Outcome documented into team memory.',
      type: outcome === 'Shipped clean' || outcome === 'Caught in review' ? 'PREVENTED RISK' : 'PIPELINE FAILURE',
      type_badge_color: outcome === 'Shipped clean' ? 'green' : outcome === 'Caught in review' ? 'cyan' : 'red',
      service: service!,
      is_active_pattern_member: true,
      related_run_id: relatedRunId,
      details: `Root cause: ${rootCause}. Fix: ${whatFixedIt}`,
    };

    const currentStore = getStore();
    currentStore.timeline.push(newTimelineNode);
    saveStore(currentStore);

    spinner.stop();

    if (options.json) {
      console.log(JSON.stringify({
        success: true,
        memory_id: retainResult.memory_id,
        is_reinforced: retainResult.is_reinforced,
        pattern_action: retainResult.pattern_action,
        confidence_score: retainResult.confidence_score,
        timeline_node_id: newNodeId,
      }, null, 2));
      return;
    }

    console.log(`\n${c.brightGreen}✔ Success! Outcome recorded in ReVise Engineering Memory.${c.reset}`);
    console.log(`  ${c.bold}Memory ID:${c.reset}    ${colors.lightTeal}${retainResult.memory_id}${c.reset}`);
    console.log(`  ${c.bold}Action:${c.reset}       ${retainResult.pattern_action}`);
    console.log(`  ${c.bold}Confidence:${c.reset}   ${retainResult.confidence_score}%`);
    console.log(`  ${c.bold}Timeline Node:${c.reset} ${newNodeId}`);
    console.log(`\n${c.dim}Next time a developer changes ${service}, ReVise will cite this outcome.${c.reset}\n`);
  } catch (err: any) {
    spinner.stop();
    console.error(`\n${c.brightRed}✖ Teach failed:${c.reset} ${err.message}\n`);
    process.exit(1);
  }
}
