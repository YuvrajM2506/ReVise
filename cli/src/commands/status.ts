import { c, colors, banner, badge } from '../ui/colors';
import { getMemoryPulse } from '../../../frontend/src/lib/storage';
import { checkHindsightHealth } from '../../../frontend/src/lib/hindsight';

export async function statusCommand(options: { json?: boolean } = {}): Promise<void> {
  const pulse = getMemoryPulse();
  const health = await checkHindsightHealth();

  if (options.json) {
    console.log(JSON.stringify({
      ...pulse,
      hindsight_connected: health.connected,
      hindsight_mode: health.mode,
    }, null, 2));
    return;
  }

  console.log(banner());
  console.log(`${c.bold}ReVise Memory Pulse & Status${c.reset}\n`);

  const modeBadge = health.mode === 'live_cloud' ? badge('LIVE CLOUD', 'green') : badge('LOCAL RESILIENT', 'amber');
  console.log(`  ${c.bold}Memory Bank Mode:${c.reset}            ${modeBadge}`);
  console.log(`  ${c.bold}Total Engineering Memories:${c.reset}  ${colors.lightTeal}${pulse.total_memories}${c.reset}`);
  console.log(`  ${c.bold}Active Guardrail Patterns:${c.reset}   ${colors.amber}${pulse.remediation_patterns_count}${c.reset}`);
  console.log(`  ${c.bold}Recurring Risk Themes:${c.reset}       ${colors.rose}${pulse.repeated_risks_count}${c.reset}`);
  console.log(`  ${c.bold}Last Activity Timestamp:${c.reset}     ${pulse.last_sync_timestamp ? new Date(pulse.last_sync_timestamp).toLocaleString() : 'Baseline seed'}`);
  console.log(`  ${c.bold}Growth Sparkline:${c.reset}            [${pulse.growth_sparkline.join(' → ')}]`);
  console.log('');
}
