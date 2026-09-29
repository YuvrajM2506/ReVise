import { c, colors, banner, badge } from '../ui/colors';
import { getStore } from '../../../frontend/src/lib/storage';

export interface TimelineOptions {
  service?: string;
  search?: string;
  json?: boolean;
}

export function timelineCommand(options: TimelineOptions = {}): void {
  const store = getStore();
  let timeline = [...store.timeline];

  if (options.service && options.service !== 'all') {
    timeline = timeline.filter(n => n.service.toLowerCase() === options.service!.toLowerCase());
  }

  if (options.search) {
    const q = options.search.toLowerCase();
    timeline = timeline.filter(n => n.title.toLowerCase().includes(q) || n.subtitle.toLowerCase().includes(q));
  }

  if (options.json) {
    console.log(JSON.stringify({ timeline, guardrails: store.guardrails }, null, 2));
    return;
  }

  console.log(banner());
  console.log(`${c.bold}Causal Engineering Timeline (${timeline.length} events)${c.reset}`);
  console.log(`${c.dim}Traceability chain connecting incidents, resolutions, and active guardrails.${c.reset}\n`);

  timeline.forEach((node, idx) => {
    const isLast = idx === timeline.length - 1;
    const branch = isLast ? '└──' : '├──';
    const pipe = isLast ? '   ' : '│  ';
    const badgeType = node.type === 'SEV-2 INCIDENT' || node.type === 'PIPELINE FAILURE' ? 'red' : 'green';

    console.log(`${colors.teal}${branch}${c.reset} ${badge(node.type, badgeType)} ${c.bold}${node.title}${c.reset} ${c.dim}(${node.service} · ${node.date})${c.reset}`);
    console.log(`${colors.teal}${pipe}${c.reset}   ${colors.slate}${node.subtitle}${c.reset}`);
    if (node.details) {
      console.log(`${colors.teal}${pipe}${c.reset}   ${c.dim}Details: ${node.details}${c.reset}`);
    }
    console.log(`${colors.teal}${pipe}${c.reset}`);
  });
}
