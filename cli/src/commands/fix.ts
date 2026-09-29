import fs from 'fs';
import path from 'path';
import { c, colors, banner, badge } from '../ui/colors';
import { createSpinner } from '../ui/spinner';
import { getStore } from '../../../frontend/src/lib/storage';
import { recallMemories } from '../../../frontend/src/lib/hindsight';

export interface FixOptions {
  task?: string;
  apply?: boolean;
  diffOnly?: boolean;
  json?: boolean;
}

export async function fixCommand(targetFile?: string, options: FixOptions = {}): Promise<void> {
  const store = getStore();
  const latestRun = store.runs[0];
  const aiderUrl = process.env.AIDER_SERVICE_URL || 'http://localhost:8001';

  const task = options.task || latestRun?.output.safer_rollout?.[0] || 'Apply recommended safety checks and fix flagged issues';
  const file = targetFile || latestRun?.file_name || 'src/auth/session.ts';

  const spinner = createSpinner(`Connecting to Aider Autonomous Remediation Daemon (${aiderUrl})...`);
  if (!options.json) spinner.start();

  try {
    // 1. Check Aider Daemon Health
    let daemonOnline = false;
    try {
      const healthRes = await fetch(`${aiderUrl}/health`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000),
      });
      daemonOnline = healthRes.ok;
    } catch {
      daemonOnline = false;
    }

    if (daemonOnline) {
      spinner.update('Retrieving relevant memory context for Aider prompt...');
      const recallRes = await recallMemories(`${task} ${file}`, { top_k: 3 });
      const memoryContext = recallRes.memories.map(m => `[${m.type.toUpperCase()}] ${m.title}: ${m.content}`);

      spinner.update(`Executing Aider pairing session on ${file}...`);
      const runRes = await fetch(`${aiderUrl}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_url: process.cwd(),
          task,
          target_files: [file],
          memory_context: memoryContext,
        }),
        signal: AbortSignal.timeout(120000),
      });

      const result = await runRes.json();
      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      console.log(banner());
      console.log(`${c.bold}Aider Autonomous Fix Summary${c.reset}`);
      console.log(`Target: ${colors.lightTeal}${file}${c.reset} · Status: ${result.success ? `${c.brightGreen}SUCCESS${c.reset}` : `${c.brightYellow}PARTIAL${c.reset}`}\n`);

      if (result.diff) {
        console.log(`${c.bold}GENERATED PATCH:${c.reset}`);
        result.diff.split('\n').forEach((line: string) => {
          if (line.startsWith('+')) console.log(`${c.brightGreen}${line}${c.reset}`);
          else if (line.startsWith('-')) console.log(`${c.brightRed}${line}${c.reset}`);
          else console.log(`${c.dim}${line}${c.reset}`);
        });
        console.log('');
      } else {
        console.log(result.log || 'Aider completed pairing session.');
      }
    } else {
      // Fallback: Preview recommendation from latest review
      spinner.stop();
      if (!latestRun || !latestRun.output.safer_rollout?.length) {
        console.log(`${c.brightYellow}⚠ Aider daemon offline and no previous recommendations available.${c.reset}`);
        console.log(`${c.dim}Start Aider with: cd aider-service && uvicorn main:app --port 8001${c.reset}\n`);
        return;
      }

      console.log(banner());
      console.log(`${c.bold}Recommended Remediation Preview${c.reset} ${badge('SIMULATED', 'amber')}`);
      console.log(`${c.dim}Aider daemon is offline. Displaying ReVise structured recommendation for ${file}:${c.reset}\n`);

      console.log(`${c.bold}SAFER ROLLOUT STEPS:${c.reset}`);
      latestRun.output.safer_rollout.forEach((step, i) => {
        console.log(`  ${colors.teal}${i + 1}.${c.reset} ${step}`);
      });
      console.log('');

      if (latestRun.output.why_recommendation) {
        console.log(`${c.bold}RATIONALE:${c.reset}\n  ${colors.slate}${latestRun.output.why_recommendation}${c.reset}\n`);
      }

      console.log(`${c.dim}To execute live automated code edits, start the Aider service:${c.reset}`);
      console.log(`  ${colors.lightTeal}cd aider-service && uvicorn main:app --port 8001${c.reset}\n`);
    }
  } catch (err: any) {
    spinner.stop();
    console.error(`${c.brightRed}✖ Fix failed:${c.reset} ${err.message}`);
  }
}
