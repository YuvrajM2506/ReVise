import readline from 'readline';
import { c, colors, banner, badge } from '../ui/colors';
import { createSpinner } from '../ui/spinner';
import { getStore } from '../../../frontend/src/lib/storage';
import { pairProgrammerChat } from '../../../frontend/src/lib/groq';
import { EvaluationRun } from '../../../frontend/src/lib/types';

export interface ChatOptions {
  message?: string;
  json?: boolean;
}

export async function chatCommand(runId?: string, options: ChatOptions = {}): Promise<void> {
  const store = getStore();
  let targetRun: EvaluationRun | undefined;

  if (runId) {
    targetRun = store.runs.find(r => r.id === runId || r.id.includes(runId));
  } else {
    targetRun = store.runs[0];
  }

  if (!targetRun) {
    console.error(`${c.brightYellow}⚠ No evaluation runs found.${c.reset} Run \`revise review\` first to create an evaluation context.`);
    return;
  }

  // 1. One-off query mode
  if (options.message) {
    const spinner = createSpinner('Thinking with ReVise Pair Assistant...');
    if (!options.json) spinner.start();

    try {
      const res = await pairProgrammerChat({
        run: targetRun,
        message: options.message,
      });
      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify({ success: true, run_id: targetRun.id, message: res.message, model: res.model_used }));
      } else {
        console.log(`\n${colors.lightTeal}${c.bold}ReVise:${c.reset}\n${res.message}\n`);
      }
    } catch (err: any) {
      spinner.stop();
      console.error(`${c.brightRed}✖ Chat error:${c.reset} ${err.message}`);
      process.exit(1);
    }
    return;
  }

  // 2. Interactive REPL Mode
  console.log(banner());
  console.log(`${c.bold}AI Pair Programmer Session${c.reset} · Grounded in ${colors.lightTeal}${targetRun.title}${c.reset}`);
  console.log(`${c.dim}Run ID: ${targetRun.id} | Risk: ${targetRun.output.risk_score}/100 | Service: ${targetRun.service}${c.reset}`);
  console.log(`${c.dim}Type your question, or 'exit' / 'quit' to end the session.${c.reset}\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${colors.teal}revise> ${c.reset}`,
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }

    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit' || input.toLowerCase() === ':q') {
      rl.close();
      return;
    }

    if (input === '/help') {
      console.log(`
${c.bold}ReVise Pair Programmer Commands:${c.reset}
  /findings   - Show all findings for this PR
  /rollout    - Show safer rollout steps
  /memories   - Show cited historical memories
  /risk       - Show risk score and provenance
  exit / quit - Exit session
`);
      rl.prompt();
      return;
    }

    let query = input;
    if (input === '/findings') query = 'What are the key findings for this PR?';
    if (input === '/rollout') query = 'What is the recommended safer rollout plan?';
    if (input === '/memories') query = 'What historical memories or incidents apply here?';
    if (input === '/risk') query = 'Explain the risk score and provenance for this change.';

    const spinner = createSpinner('Thinking...');
    spinner.start();

    try {
      const res = await pairProgrammerChat({
        run: targetRun!,
        message: query,
      });
      spinner.stop();
      console.log(`\n${res.message}\n`);
    } catch (err: any) {
      spinner.stop();
      console.error(`\n${c.brightRed}✖ Error:${c.reset} ${err.message}\n`);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log(`\n${colors.slate}Session ended. ReVise memory saved.${c.reset}\n`);
    process.exit(0);
  });
}
