import { resetToSeedData } from '../src/lib/storage';
import { SEED_MEMORIES } from '../src/lib/seed-data';

async function main() {
  console.log('🌱 Seeding Acme Platform memory bank and initial runs...');
  const store = resetToSeedData();
  console.log(`✅ Loaded ${store.memories.length} historical memories.`);
  console.log(`✅ Loaded ${store.runs.length} evaluation runs.`);
  console.log(`✅ Loaded ${store.timeline.length} causal timeline nodes.`);
  console.log(`✅ Loaded ${store.standards.length} team standards.`);
  console.log('🎉 Seed complete! All memories are ready for ReVise evaluation.');
}

main().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
