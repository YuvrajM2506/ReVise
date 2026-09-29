import { c, colors, banner, badge } from '../ui/colors';
import { renderTable } from '../ui/tables';
import { createSpinner } from '../ui/spinner';
import { getStore } from '../../../frontend/src/lib/storage';
import { recallMemories } from '../../../frontend/src/lib/hindsight';

export interface MemoryListOptions {
  service?: string;
  type?: string;
  json?: boolean;
}

export interface MemorySearchOptions {
  service?: string;
  limit?: number;
  json?: boolean;
}

export async function memoryListCommand(options: MemoryListOptions = {}): Promise<void> {
  const store = getStore();
  let memories = store.memories;

  if (options.service && options.service !== 'all') {
    memories = memories.filter(m => m.service.toLowerCase() === options.service!.toLowerCase());
  }
  if (options.type && options.type !== 'all') {
    memories = memories.filter(m => m.type.toLowerCase() === options.type!.toLowerCase());
  }

  if (options.json) {
    console.log(JSON.stringify(memories, null, 2));
    return;
  }

  console.log(banner());
  console.log(`${c.bold}Organizational Engineering Memories (${memories.length})${c.reset}\n`);

  const rows = memories.map(m => ({
    id: `${colors.teal}${m.id}${c.reset}`,
    type: badge(m.type, m.type === 'incident' ? 'red' : m.type === 'standard' ? 'amber' : 'teal'),
    service: m.service,
    title: m.title.length > 38 ? m.title.slice(0, 35) + '...' : m.title,
    confidence: `${m.metadata?.confidence_score || 85}%`,
  }));

  const table = renderTable(
    [
      { header: 'ID', key: 'id', width: 14 },
      { header: 'TYPE', key: 'type', width: 12 },
      { header: 'SERVICE', key: 'service', width: 15 },
      { header: 'TITLE', key: 'title', width: 38 },
      { header: 'CONFIDENCE', key: 'confidence', width: 10, align: 'right' },
    ],
    rows
  );

  console.log(table);
  console.log(`\n${c.dim}To inspect a memory: \`revise memory show <id>\` | To search: \`revise memory search <query>\`${c.reset}\n`);
}

export async function memorySearchCommand(query: string, options: MemorySearchOptions = {}): Promise<void> {
  const spinner = createSpinner(`Searching memory bank for "${query}"...`);
  if (!options.json) spinner.start();

  try {
    const result = await recallMemories(query, {
      service: options.service,
      top_k: options.limit || 5,
    });

    spinner.stop();

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(`\n${c.bold}Memory Search Results for "${query}" (${result.memories.length})${c.reset}`);
    console.log(`${c.dim}Retrieval Latency: ${result.retrieval_latency_ms}ms · Bank: ${result.bank_id}${c.reset}\n`);

    if (result.memories.length === 0) {
      console.log(`${c.brightYellow}No matching memories found.${c.reset}\n`);
      return;
    }

    result.memories.forEach((m, idx) => {
      console.log(`${c.bold}[${idx + 1}] ${m.title}${c.reset} ${badge(m.type, 'amber')}`);
      console.log(`    ${c.bold}ID:${c.reset} ${colors.teal}${m.id}${c.reset} | ${c.bold}Service:${c.reset} ${m.service} | ${c.bold}Date:${c.reset} ${m.relative_time || m.timestamp}`);
      console.log(`    ${colors.slate}${m.content.slice(0, 200)}${m.content.length > 200 ? '...' : ''}${c.reset}`);
      if (m.relevance_note) {
        console.log(`    ${c.dim}↳ Relevance: ${m.relevance_note}${c.reset}`);
      }
      console.log('');
    });
  } catch (err: any) {
    spinner.stop();
    console.error(`${c.brightRed}✖ Search failed:${c.reset} ${err.message}`);
  }
}

export function memoryShowCommand(memoryId: string, options: { json?: boolean } = {}): void {
  const store = getStore();
  const memory = store.memories.find(m => m.id.toLowerCase() === memoryId.toLowerCase());

  if (!memory) {
    console.error(`${c.brightRed}✖ Memory not found with ID: ${memoryId}${c.reset}`);
    process.exit(1);
  }

  if (options.json) {
    console.log(JSON.stringify(memory, null, 2));
    return;
  }

  console.log(`\n${c.bold}${memory.title}${c.reset} ${badge(memory.type, 'amber')}`);
  console.log(`${c.dim}ID: ${memory.id} · Service: ${memory.service} · Date: ${memory.timestamp}${c.reset}\n`);
  console.log(`${c.bold}CONTENT:${c.reset}`);
  console.log(`${colors.slate}${memory.content}${c.reset}\n`);
  if (memory.relevance_note) {
    console.log(`${c.bold}RELEVANCE NOTE:${c.reset} ${memory.relevance_note}\n`);
  }
  if (memory.metadata) {
    console.log(`${c.bold}METADATA:${c.reset} ${JSON.stringify(memory.metadata, null, 2)}\n`);
  }
}
