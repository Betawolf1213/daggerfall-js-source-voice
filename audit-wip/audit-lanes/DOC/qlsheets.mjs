const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { SHEETS } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { standingMovesOf } = await import(`${SNAP}/src/systems/questlines/qlRewards.js`);
const { loadTables } = await import(`${SNAP}/test/qlSources.mjs`);
loadTables();
for (const s of SHEETS.values()) {
  if (s.family !== 'Questlines') continue;
  for (const o of s.outcomes) {
    const moves = standingMovesOf(o);
    const unknown = Object.keys(o.standing ?? {}).filter((n) => !moves.some((m) => m.name === n));
    console.log(s.quest, o.id.padEnd(11), o.pay.padEnd(8), JSON.stringify(o.standing ?? {}), o.legal ?? '', o.named ? o.named.kind + ':' + o.named.name : '', unknown.length ? `<<< unknown faction ${unknown}` : '');
  }
}
// every standing name across all sheets resolves?
const bad = [];
for (const s of SHEETS.values()) for (const o of s.outcomes ?? []) { const m = standingMovesOf(o); for (const n of Object.keys(o.standing ?? {})) if (!m.some((x) => x.name === n)) bad.push(`${s.quest}:${o.id}:${n}`); }
console.log('standing names the table does not know:', bad.join(' ') || 'none');
