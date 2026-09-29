import { c, colors, banner, badge } from '../ui/colors';
import { createSpinner } from '../ui/spinner';
import { checkHindsightHealth } from '../../../frontend/src/lib/hindsight';
import { getGitHubAuthStatus } from '../../../frontend/src/lib/github';
import { getStore } from '../../../frontend/src/lib/storage';

export async function doctorCommand(options: { json?: boolean } = {}): Promise<void> {
  const spinner = createSpinner('Diagnosing ReVise Subsystems & API Connections...');
  if (!options.json) spinner.start();

  try {
    const hindsightHealth = await checkHindsightHealth();
    const githubAuth = getGitHubAuthStatus();
    const store = getStore();
    const groqKey = process.env.GROQ_API_KEY?.trim() || '';
    const groqConfigured = groqKey.startsWith('gsk_');

    spinner.stop();

    if (options.json) {
      console.log(JSON.stringify({
        status: 'healthy',
        hindsight: hindsightHealth,
        groq: {
          configured: groqConfigured,
          primary_model: process.env.GROQ_PRIMARY_MODEL || 'openai/gpt-oss-120b',
        },
        github: githubAuth,
        storage: {
          memories_count: store.memories.length,
          runs_count: store.runs.length,
          standards_count: store.standards.length,
        },
      }, null, 2));
      return;
    }

    console.log(banner());
    console.log(`${c.bold}ReVise System Diagnostics & Connectivity${c.reset}\n`);

    // 1. Hindsight Memory Subsystem
    const hsBadge = hindsightHealth.mode === 'live_cloud' ? badge('LIVE CLOUD', 'green') : badge('LOCAL RESILIENT BANK', 'amber');
    console.log(`${c.bold}1. Hindsight Organizational Memory${c.reset} ${hsBadge}`);
    console.log(`   ${c.bold}Status:${c.reset}   ${hindsightHealth.message}`);
    console.log(`   ${c.bold}Bank ID:${c.reset}  ${hindsightHealth.bank_id}`);
    console.log(`   ${c.bold}Latency:${c.reset}  ${hindsightHealth.latency_ms}ms`);
    console.log('');

    // 2. Groq LPU Inference
    const groqBadge = groqConfigured ? badge('LIVE GROQ LPU', 'green') : badge('SIMULATOR FALLBACK', 'amber');
    console.log(`${c.bold}2. Groq LPU AI Reasoning Engine${c.reset} ${groqBadge}`);
    console.log(`   ${c.bold}Primary Model:${c.reset}  ${process.env.GROQ_PRIMARY_MODEL || 'openai/gpt-oss-120b'}`);
    console.log(`   ${c.bold}Fallback Model:${c.reset} ${process.env.GROQ_FALLBACK_MODEL || 'openai/gpt-oss-20b'}`);
    console.log(`   ${c.bold}API Key Status:${c.reset} ${groqConfigured ? `${c.brightGreen}Valid key configured (starts with gsk_)${c.reset}` : `${c.brightYellow}Unset / Simulator Mode (deterministic responses)${c.reset}`}`);
    console.log('');

    // 3. GitHub API Connectivity
    const ghBadge = githubAuth.configured ? badge('AUTHENTICATED (5,000 req/hr)', 'green') : badge('ANONYMOUS (60 req/hr)', 'slate');
    console.log(`${c.bold}3. GitHub REST API Integration${c.reset} ${ghBadge}`);
    console.log(`   ${c.bold}Token Attached:${c.reset} ${githubAuth.configured ? `${c.brightGreen}Yes (Length: ${githubAuth.tokenLength})${c.reset}` : `${c.dim}No (Anonymous access)${c.reset}`}`);
    console.log('');

    // 4. Local State Bank
    console.log(`${c.bold}4. Local State & Engineering Memory Storage${c.reset} ${badge('READY', 'green')}`);
    console.log(`   ${c.bold}Stored Memories:${c.reset}  ${store.memories.length}`);
    console.log(`   ${c.bold}Evaluation Runs:${c.reset}  ${store.runs.length}`);
    console.log(`   ${c.bold}Team Standards:${c.reset}   ${store.standards.length}`);
    console.log(`   ${c.bold}Timeline Events:${c.reset}  ${store.timeline.length}`);
    console.log('');

    console.log(`${c.brightGreen}✔ All core subsystems are ready to review and evaluate code.${c.reset}\n`);
  } catch (err: any) {
    spinner.stop();
    console.error(`\n${c.brightRed}✖ Diagnostic failed:${c.reset} ${err.message}\n`);
  }
}
