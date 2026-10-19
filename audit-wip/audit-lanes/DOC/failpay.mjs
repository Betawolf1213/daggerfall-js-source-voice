const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { readFileSync, readdirSync } = await import('node:fs');
const out = [];
for (const f of readdirSync(`${SNAP}/src/systems/questlines/sheets`)) {
  const j = JSON.parse(readFileSync(`${SNAP}/src/systems/questlines/sheets/${f}`, 'utf8'));
  for (const s of j.sheets) for (const o of s.outcomes) if (o.failure && !['none', 'own', 'betrayal'].includes(o.pay)) out.push(`${s.quest}:${o.id}:${o.pay}`);
}
console.log(out.length, out.join(' '));
