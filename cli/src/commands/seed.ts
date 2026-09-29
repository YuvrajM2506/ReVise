import { c, colors, banner } from '../ui/colors';
import { createSpinner } from '../ui/spinner';
import { resetToSeedData, getStore } from '../../../frontend/src/lib/storage';
import { SEED_MEMORIES } from '../../../frontend/src/lib/seed-data';
import { retainMemory } from '../../../frontend/src/lib/hindsight';

export async function seedCommand(options: { cloud?: boolean; json?: boolean } = {}): Promise<void> {
  const spinner = createSpinner('Resetting memory bank to Acme Platform demo baseline...');
  if (!options.json) spinner.start();

  try {
    resetToSeedData();

    if (options.cloud && process.env.HINDSIGHT_API_KEY && process.env.HINDSIGHT_API_KEY.startsWith('hsk_')) {
      spinner.update('Syncing baseline memories to Hindsight Cloud API...');
      for (const mem of SEED_MEMORIES.slice(0, 5)) {
        try {
          await retainMemory({
            title: mem.title,
            type: mem.type,
            service: mem.service,
            content: mem.content,
            relevance_note: mem.relevance_note,
            metadata: mem.metadata,
            sync_only: true,
          });
        } catch {
          // ignore individual sync fails
        }
      }
    }

    const store = getStore();
    spinner.stop();

    if (options.json) {
      console.log(JSON.stringify({
        success: true,
        memories_count: store.memories.length,
        runs_count: store.runs.length,
        standards_count: store.standards.length,
      }, null, 2));
      return;
    }

    console.log(banner());
    console.log(`${c.brightGreen}✔ Successfully reset ReVise to Acme Platform baseline dataset.${c.reset}`);
    console.log(`  • Loaded ${store.memories.length} historical engineering memories`);
    console.log(`  • Loaded ${store.runs.length} baseline evaluation runs`);
    console.log(`  • Loaded ${store.standards.length} team standards`);
    console.log(`  • Loaded ${store.timeline.length} causal timeline events\n`);
  } catch (err: any) {
    spinner.stop();
    console.error(`${c.brightRed}✖ Seed failed:${c.reset} ${err.message}`);
    process.exit(1);
  }
}
