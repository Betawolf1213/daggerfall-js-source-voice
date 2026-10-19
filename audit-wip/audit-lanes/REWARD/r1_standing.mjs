// Q5: every faction a sheet's `standing` names, read through the layer's own factionIdOf (qlRewards.js) - ALL sheets.
import { SNAP } from './_env.mjs';
const { SHEET_FAMILIES } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { factionIdOf, standingMovesOf } = await import(`${SNAP}/src/systems/questlines/qlRewards.js`);
const { factionsTable } = await import(`${SNAP}/src/systems/quest/tables.js`);
const table = factionsTable();
let n = 0, bad = [], kinds = new Map(), amounts = [], legal = [];
for (const fam of SHEET_FAMILIES) for (const s of fam.sheets) for (const o of s.outcomes ?? []) {
  if (o.legal) legal.push(`${s.quest}.${o.id} legal ${o.legal}`);
  for (const [name, amt] of Object.entries(o.standing ?? {})) {
    n++;
    amounts.push(amt);
    const id = factionIdOf(name);
    const p2 = table.hasValue(name) ? table.getValue('p2', name) : '(no row)';
    kinds.set(name, `${id} (p2 ${p2})`);
    if (id == null || String(p2).trim() !== '-1') bad.push(`${fam.family} ${s.quest}.${o.id}: "${name}" -> ${id} (p2 ${p2})`);
    const moves = standingMovesOf(o);
    if (!moves.some((m) => m.name === name)) bad.push(`${s.quest}.${o.id}: "${name}" DROPPED by standingMovesOf`);
  }
}
console.log('standing entries:', n, ' distinct factions:', kinds.size);
for (const [k, v] of [...kinds].sort()) console.log('  ', k.padEnd(32), v);
console.log('amount histogram:', Object.fromEntries([...new Set(amounts)].sort((a, b) => a - b).map((a) => [a, amounts.filter((x) => x === a).length])));
console.log('legal moves:', legal.length, legal.slice(0, 40));
console.log('UNRESOLVED / not an individual faction:', bad.length ? bad : 'none');
