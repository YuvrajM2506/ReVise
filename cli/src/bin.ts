#!/usr/bin/env node

/**
 * ReVise CLI — Engineering-Memory Code Review Agent
 */

import { loadEnvironment } from './config';
import { c, colors, banner } from './ui/colors';
import { reviewCommand } from './commands/review';
import { chatCommand } from './commands/chat';
import { teachCommand } from './commands/teach';
import { fixCommand } from './commands/fix';
import { memoryListCommand, memorySearchCommand, memoryShowCommand } from './commands/memory';
import { standardsCommand } from './commands/standards';
import { timelineCommand } from './commands/timeline';
import { runsListCommand, runsShowCommand } from './commands/runs';
import { backfillCommand } from './commands/backfill';
import { doctorCommand } from './commands/doctor';
import { statusCommand } from './commands/status';
import { seedCommand } from './commands/seed';
import { configListCommand, configGetCommand, configSetCommand } from './commands/config';

// Load environment variables (.env.local, config.json)
loadEnvironment();

const VERSION = '0.1.0';

function printHelp(): void {
  console.log(banner());
  console.log(`
${c.bold}USAGE${c.reset}
  $ ${colors.teal}revise${c.reset} <command> [arguments] [flags]

${c.bold}CORE COMMANDS${c.reset}
  ${colors.lightTeal}review${c.reset} [target]              Review a GitHub PR URL, local file, or staged diff
                            ${c.dim}Flags: --staged, --branch <name>, --no-memory, --post, --fail-on <HIGH|MEDIUM>, --json, --quiet${c.reset}
  ${colors.lightTeal}chat${c.reset} [run-id]                Launch interactive REPL pair programmer grounded in review findings
                            ${c.dim}Flags: --message <query>, --json${c.reset}
  ${colors.lightTeal}teach${c.reset}                        Record real-world deployment outcome to reinforce organizational memory
                            ${c.dim}Flags: --title <str>, --service <str>, --outcome <str>, --root-cause <str>, --fix <str>${c.reset}
  ${colors.lightTeal}fix${c.reset} [target-file]             Run autonomous remediation or preview safer rollout steps
                            ${c.dim}Flags: --task <str>, --apply, --diff-only, --json${c.reset}

${c.bold}EXPLORATION & GOVERNANCE${c.reset}
  ${colors.lightTeal}memory list${c.reset}                  List stored engineering memories with category and confidence
  ${colors.lightTeal}memory search <query>${c.reset}        Search memory bank with semantic and keyword ranking
  ${colors.lightTeal}memory show <id>${c.reset}             Display full details of a specific memory
  ${colors.lightTeal}standards${c.reset}                    Inspect living team standards and active guardrails
  ${colors.lightTeal}timeline${c.reset}                     Display causal incident-resolution timeline
  ${colors.lightTeal}runs list${c.reset}                     List historical review runs and risk scores
  ${colors.lightTeal}runs show <run-id>${c.reset}            Display detailed review report for a specific run

${c.bold}OPERATIONS & CONFIGURATION${c.reset}
  ${colors.lightTeal}status${c.reset} (or ${colors.lightTeal}pulse${c.reset})             Display memory pulse, connection mode, and growth metrics
  ${colors.lightTeal}doctor${c.reset} (or ${colors.lightTeal}health${c.reset})            Test live connectivity to Hindsight, Groq LPU, and GitHub
  ${colors.lightTeal}backfill <owner/repo>${c.reset}        Ingest merged pull requests into Hindsight memory
  ${colors.lightTeal}seed${c.reset}                        Reset local store to Acme Platform baseline dataset
  ${colors.lightTeal}config list | get | set${c.reset}      Manage CLI settings and API keys

${c.bold}EXAMPLES${c.reset}
  $ ${colors.teal}revise review${c.reset}                                 # Review current git working tree
  $ ${colors.teal}revise review --staged${c.reset}                        # Review staged git changes
  $ ${colors.teal}revise review src/auth/session.ts${c.reset}             # Review a specific file
  $ ${colors.teal}revise review https://github.com/org/repo/pull/42${c.reset} # Review a GitHub PR
  $ ${colors.teal}git diff | revise review -${c.reset}                    # Pipe git diff directly
  $ ${colors.teal}revise review --fail-on HIGH${c.reset}                  # Exit 1 on HIGH risk (for CI)
  $ ${colors.teal}revise chat${c.reset}                                   # Start AI pair programmer session
  $ ${colors.teal}revise teach${c.reset}                                  # Launch write-back outcome wizard
  $ ${colors.teal}revise doctor${c.reset}                                 # Verify all API keys & connections
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'help' || args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  if (args[0] === 'version' || args.includes('--version') || args.includes('-v')) {
    console.log(`revise v${VERSION}`);
    return;
  }

  const command = args[0];
  const rest = args.slice(1);

  // Parse generic flags
  const flags: Record<string, any> = {};
  const positional: string[] = [];

  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === '--staged') flags.staged = true;
    else if (arg === '--no-memory') flags.memory = false;
    else if (arg === '--json') flags.json = true;
    else if (arg === '--quiet' || arg === '-q') flags.quiet = true;
    else if (arg === '--post') flags.post = true;
    else if (arg === '--cloud') flags.cloud = true;
    else if (arg === '--apply') flags.apply = true;
    else if (arg === '--diff-only') flags.diffOnly = true;
    else if (arg === '--branch' && rest[i + 1]) flags.branch = rest[++i];
    else if (arg === '--fail-on' && rest[i + 1]) flags.failOn = rest[++i].toUpperCase();
    else if (arg === '--service' && rest[i + 1]) flags.service = rest[++i];
    else if (arg === '--bank' && rest[i + 1]) flags.bank = rest[++i];
    else if (arg === '--limit' && rest[i + 1]) flags.limit = parseInt(rest[++i], 10);
    else if (arg === '--message' && rest[i + 1]) flags.message = rest[++i];
    else if (arg === '--task' && rest[i + 1]) flags.task = rest[++i];
    else if (arg === '--title' && rest[i + 1]) flags.title = rest[++i];
    else if (arg === '--outcome' && rest[i + 1]) flags.outcome = rest[++i];
    else if (arg === '--root-cause' && rest[i + 1]) flags.rootCause = rest[++i];
    else if (arg === '--fix' && rest[i + 1]) flags.fix = rest[++i];
    else if (!arg.startsWith('-')) positional.push(arg);
  }

  switch (command) {
    case 'review':
    case 'analyze':
      await reviewCommand(positional[0], flags);
      break;

    case 'chat':
    case 'pair':
      await chatCommand(positional[0], flags);
      break;

    case 'teach':
      await teachCommand(flags);
      break;

    case 'fix':
    case 'remediate':
      await fixCommand(positional[0], flags);
      break;

    case 'memory': {
      const sub = positional[0] || 'list';
      if (sub === 'list') await memoryListCommand(flags);
      else if (sub === 'search') await memorySearchCommand(positional.slice(1).join(' '), flags);
      else if (sub === 'show' || sub === 'get') memoryShowCommand(positional[1], flags);
      else await memorySearchCommand(positional.join(' '), flags);
      break;
    }

    case 'standards':
      standardsCommand(flags);
      break;

    case 'timeline':
      timelineCommand(flags);
      break;

    case 'runs': {
      const sub = positional[0] || 'list';
      if (sub === 'list') runsListCommand(flags);
      else if (sub === 'show' || sub === 'get') runsShowCommand(positional[1], flags);
      else runsShowCommand(sub, flags);
      break;
    }

    case 'doctor':
    case 'health':
      await doctorCommand(flags);
      break;

    case 'status':
    case 'pulse':
      await statusCommand(flags);
      break;

    case 'seed':
      await seedCommand(flags);
      break;

    case 'backfill':
      if (!positional[0]) {
        console.error(`${c.brightRed}✖ Specify repository to backfill: \`revise backfill owner/repo\`${c.reset}`);
        process.exit(1);
      }
      await backfillCommand(positional[0], flags);
      break;

    case 'config': {
      const sub = positional[0] || 'list';
      if (sub === 'list') configListCommand(flags);
      else if (sub === 'get') configGetCommand(positional[1]);
      else if (sub === 'set') configSetCommand(positional[1], positional[2]);
      else configListCommand(flags);
      break;
    }

    default:
      console.error(`${c.brightRed}✖ Unknown command:${c.reset} ${command}`);
      console.log(`Run \`${colors.teal}revise help${c.reset}\` to view available commands.`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(`${c.brightRed}Fatal error:${c.reset}`, err);
  process.exit(1);
});
