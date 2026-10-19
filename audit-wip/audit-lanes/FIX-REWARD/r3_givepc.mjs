// Every `give pc` of every stamped (sheeted) quest: which item kind, how many per quest - to find quests where a
// non-pay item is given before the gold (the layer's `paid` latch would then skip scaling the gold).
import { SNAP, questLines } from './_env.mjs';
const { SHEETS } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { PAY_PROFILES } = await import(`${SNAP}/src/systems/questlines/qlRewards.js`);
const rows = [];
for (const [name, sheet] of SHEETS) {
  const lines = questLines(name);
  if (!lines) { rows.push({ name, missing: true }); continue; }
  const kinds = new Map();
  for (const l of lines) { const m = /^\s*Item\s+(_[A-Za-z0-9_.]+_)\s+(\S+)/.exec(l); if (m) kinds.set(m[1], m[2]); }
  const gives = [];
  for (const [i, l] of lines.entries()) {
    const m = /^\s*give pc\s+(\S+)/.exec(l);
    if (m) gives.push({ line: i + 1, sym: m[1], kind: m[1] === 'nothing' ? 'nothing' : (kinds.get(m[1]) ?? '?') });
  }
  const scaled = (sheet.outcomes ?? []).some((o) => PAY_PROFILES[o.pay]?.gold !== 1);
  rows.push({ name, gives, scaled });
}
const nonPayFirst = rows.filter((r) => r.gives?.length >= 2 && r.gives.some((g) => g.kind === 'gold') && r.gives[0].kind !== 'gold');
const multi = rows.filter((r) => r.gives?.filter((g) => g.kind !== 'letter').length >= 2);
console.log('sheets:', rows.length, 'missing scripts:', rows.filter((r) => r.missing).map((r) => r.name));
console.log('kinds given:', Object.entries(rows.flatMap((r) => r.gives ?? []).reduce((a, g) => (a[g.kind] = (a[g.kind] ?? 0) + 1, a), {})).sort((a, b) => b[1] - a[1]));
console.log('\nquests with 2+ non-letter gives:', multi.length);
for (const r of multi) console.log(' ', r.name, r.scaled ? '(an outcome scales gold)' : '', r.gives.map((g) => `${g.sym}:${g.kind}@${g.line}`).join(' '));
console.log('\nquests whose first give (in file order) is not gold while a later one is:', nonPayFirst.map((r) => r.name));
console.log('\nno give pc at all:', rows.filter((r) => r.gives && !r.gives.length).length);
