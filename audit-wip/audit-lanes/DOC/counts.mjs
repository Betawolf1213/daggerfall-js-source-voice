// DOC lane: count what the record and the PR body claim.
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { SHEET_FAMILIES, SHEETS } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { QL_PATCHES } = await import(`${SNAP}/src/systems/questlines/qlPatches.js`);
const { QL_LINES } = await import(`${SNAP}/src/systems/questlines/qlLines.js`);
const { ACT_IDS } = await import(`${SNAP}/src/systems/questlines/qlActs.js`);
let total = 0;
for (const f of SHEET_FAMILIES) { console.log(f.family, f.sheets.length); total += f.sheets.length; }
console.log('families', SHEET_FAMILIES.length, 'sheets', total, 'map', SHEETS.size);
const branched = [...SHEETS.values()].filter((s) => s.branches?.length);
console.log('branched sheets', branched.length, 'non-questlines', branched.filter((s) => s.family !== 'Questlines').length, 'questlines', branched.filter((s) => s.family === 'Questlines').map((s) => s.quest).join(' '));
console.log('patched quests', QL_PATCHES.size);
const named = [...SHEETS.values()].flatMap((s) => (s.outcomes ?? []).filter((o) => o.named).map((o) => `${s.quest}:${o.id}:${o.named.name}`));
console.log('named outcomes', named.length); console.log(named.join('\n'));
const lastSteps = QL_LINES.map((l) => l.steps.at(-1).quest);
console.log('lines', QL_LINES.length, 'steps', QL_LINES.reduce((n, l) => n + l.steps.length, 0));
for (const q of lastSteps) { const s = SHEETS.get(q); console.log(q, (s.outcomes ?? []).map((o) => `${o.id}${o.named ? '[' + o.named.name + ']' : ''}${o.failure ? '(F)' : ''}/${o.pay}`).join(' ')); }
console.log('acts', ACT_IDS.length);
// pay profile counts among flagship
const pays = {};
for (const s of SHEETS.values()) for (const o of s.outcomes ?? []) pays[o.pay] = (pays[o.pay] ?? 0) + 1;
console.log('pays', JSON.stringify(pays));
// standing range
const stand = [...SHEETS.values()].flatMap((s) => (s.outcomes ?? []).flatMap((o) => Object.entries(o.standing ?? {}).map(([k, v]) => [s.quest, o.id, k, v])));
console.log('standing entries', stand.length, 'out of [-10,10]:', stand.filter(([, , , v]) => v < -10 || v > 10).map((x) => x.join(':')).join(' ') || 'none');
console.log('legal', [...SHEETS.values()].flatMap((s) => (s.outcomes ?? []).filter((o) => o.legal != null).map((o) => `${s.quest}:${o.id}:${o.legal}`)).join(' '));
