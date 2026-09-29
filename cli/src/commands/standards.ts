import { c, colors, banner, badge } from '../ui/colors';
import { renderTable } from '../ui/tables';
import { getStore } from '../../../frontend/src/lib/storage';

export function standardsCommand(options: { json?: boolean } = {}): void {
  const store = getStore();
  const standards = store.standards;

  if (options.json) {
    console.log(JSON.stringify(standards, null, 2));
    return;
  }

  console.log(banner());
  console.log(`${c.bold}Living Team Standards & Inferred Guardrails (${standards.length})${c.reset}`);
  console.log(`${c.dim}Dynamically synthesized from historical incidents and post-mortems.${c.reset}\n`);

  standards.forEach((s, idx) => {
    const levelColor = s.enforcement_level.includes('Strict') || s.enforcement_level.includes('Mandatory') ? 'red' : 'amber';
    console.log(`${c.bold}[${idx + 1}] ${s.title}${c.reset} ${badge(s.enforcement_level, levelColor)}`);
    console.log(`    ${c.bold}Category:${c.reset} ${s.category} | ${c.bold}Service:${c.reset} ${s.service} | ${c.bold}Confidence:${c.reset} ${s.confidence_score}%`);
    console.log(`    ${colors.slate}${s.description}${c.reset}`);
    if (s.inferred_from?.incident_names?.length) {
      console.log(`    ${c.dim}↳ Inferred from: ${s.inferred_from.incident_names.join(', ')}${c.reset}`);
    }
    if (s.rule_snippet) {
      console.log(`    ${colors.lightTeal}Rule snippet:${c.reset}\n      ${c.dim}${s.rule_snippet.replace(/\n/g, '\n      ')}${c.reset}`);
    }
    console.log('');
  });
}
