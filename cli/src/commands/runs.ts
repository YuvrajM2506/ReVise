import { c, colors, banner, riskMeter, formatSeverity, badge } from '../ui/colors';
import { renderTable, renderCard } from '../ui/tables';
import { getStore } from '../../../frontend/src/lib/storage';

export function runsListCommand(options: { limit?: number; json?: boolean } = {}): void {
  const store = getStore();
  const limit = options.limit || 10;
  const runs = store.runs.slice(0, limit);

  if (options.json) {
    console.log(JSON.stringify(runs, null, 2));
    return;
  }

  console.log(banner());
  console.log(`${c.bold}Recent Evaluation Runs (${runs.length})${c.reset}\n`);

  const rows = runs.map(r => ({
    id: `${colors.teal}${r.id.slice(0, 18)}${c.reset}`,
    status: badge(r.status, r.status === 'HIGH RISK' ? 'red' : r.status === 'MEDIUM RISK' ? 'amber' : 'green'),
    service: r.service,
    score: `${r.output.risk_score}/100`,
    title: r.title.length > 32 ? r.title.slice(0, 29) + '...' : r.title,
    date: r.relative_time || 'Recent',
  }));

  const table = renderTable(
    [
      { header: 'RUN ID', key: 'id', width: 18 },
      { header: 'STATUS', key: 'status', width: 14 },
      { header: 'SCORE', key: 'score', width: 8, align: 'right' },
      { header: 'SERVICE', key: 'service', width: 14 },
      { header: 'TITLE', key: 'title', width: 32 },
      { header: 'DATE', key: 'date', width: 10 },
    ],
    rows
  );

  console.log(table);
  console.log(`\n${c.dim}To view a full report: \`revise runs show <run-id>\` | To chat: \`revise chat <run-id>\`${c.reset}\n`);
}

export function runsShowCommand(runId: string, options: { json?: boolean } = {}): void {
  const store = getStore();
  const run = store.runs.find(r => r.id === runId || r.id.includes(runId));

  if (!run) {
    console.error(`${c.brightRed}✖ Evaluation run not found with ID: ${runId}${c.reset}`);
    process.exit(1);
  }

  const output = run.output;

  if (options.json) {
    console.log(JSON.stringify(run, null, 2));
    return;
  }

  console.log(banner());
  console.log(`${c.bold}EVALUATION REPORT:${c.reset} ${colors.lightTeal}${run.title}${c.reset}`);
  console.log(`${c.dim}ID: ${run.id} · Service: ${run.service} · Date: ${run.created_at}${c.reset}\n`);

  console.log(`${c.bold}RISK ASSESSMENT${c.reset}`);
  console.log(riskMeter(output.risk_score, output.risk_level));
  console.log(`${c.dim}Provenance: ${output.provenance_note}${c.reset}\n`);

  console.log(renderCard('EXECUTIVE SUMMARY', output.summary, colors.teal));
  console.log('');

  if (output.findings && output.findings.length > 0) {
    console.log(`${c.bold}🔍 FINDINGS (${output.findings.length})${c.reset}`);
    output.findings.forEach(f => {
      console.log(`  ${formatSeverity(f.severity)} ${c.bold}${f.title}${c.reset}`);
      console.log(`    ${colors.slate}${f.description}${c.reset}`);
      if (f.source_memory_ids?.length) {
        console.log(`    ${c.dim}↳ Cites memories: ${f.source_memory_ids.join(', ')}${c.reset}`);
      }
      console.log('');
    });
  }

  if (output.memory_citations && output.memory_citations.length > 0) {
    console.log(`${c.bold}🧠 CITED MEMORIES (${output.memory_citations.length})${c.reset}`);
    output.memory_citations.forEach(m => {
      console.log(`  ${badge(m.type, 'amber')} ${c.bold}${m.title}${c.reset} ${c.dim}(${m.date})${c.reset}`);
      console.log(`    ${colors.slate}${m.relevance_note}${c.reset}`);
    });
    console.log('');
  }

  if (output.safer_rollout && output.safer_rollout.length > 0) {
    console.log(`${c.bold}🚀 SAFER ROLLOUT PLAN${c.reset}`);
    output.safer_rollout.forEach((s, i) => {
      console.log(`  ${colors.teal}${i + 1}.${c.reset} ${s}`);
    });
    console.log('');
  }
}
