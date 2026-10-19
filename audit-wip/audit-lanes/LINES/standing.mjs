// Every questline outcome's standing, read to faction ids as the layer reads them (qlRewards.js standingMovesOf).
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { loadTables } = await import(SNAP + '/test/qlSources.mjs');
loadTables();
const { standingMovesOf, PAY_PROFILES } = await import(SNAP + '/src/systems/questlines/qlRewards.js');
const { sheetFor } = await import(SNAP + '/src/systems/questlines/qlSheets.js');
const { QL_LINES } = await import(SNAP + '/src/systems/questlines/qlLines.js');
const { factionsTable } = await import(SNAP + '/src/systems/quest/tables.js').catch(() => ({}));
for (const l of QL_LINES) for (const s of l.steps) {
  const sh = sheetFor(s.quest);
  for (const o of sh.outcomes) {
    if (!o.standing) continue;
    console.log(s.quest, o.id, JSON.stringify(o.standing), '->', JSON.stringify(standingMovesOf(o)));
  }
}
