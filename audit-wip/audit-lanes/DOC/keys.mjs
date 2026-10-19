const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { SHEETS } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const k = {}, ok = {}, bk = {}, ck = {}, outk = {}, bindk = {};
const walk = (b) => { if (!b || typeof b !== 'object') return; for (const key of Object.keys(b)) bindk[key] = (bindk[key] ?? 0) + 1; for (const x of b.all ?? []) walk(x); for (const x of b.any ?? []) walk(x); if (b.not) walk(b.not); };
for (const s of SHEETS.values()) {
  for (const key of Object.keys(s)) k[key] = (k[key] ?? 0) + 1;
  for (const o of s.objectives ?? []) { for (const key of Object.keys(o)) ok[key] = (ok[key] ?? 0) + 1; walk(o.open); walk(o.done); walk(o.fail); }
  for (const b of s.branches ?? []) { for (const key of Object.keys(b)) bk[key] = (bk[key] ?? 0) + 1; for (const c of b.choices ?? []) for (const key of Object.keys(c)) ck[key] = (ck[key] ?? 0) + 1; }
  for (const o of s.outcomes ?? []) { for (const key of Object.keys(o)) outk[key] = (outk[key] ?? 0) + 1; walk(o.on); }
}
console.log('sheet', k); console.log('objective', ok); console.log('branch', bk); console.log('choice', ck); console.log('outcome', outk); console.log('binding', bindk);
const notes = [...SHEETS.values()].filter((s) => s.note || s.pattern || s.ledger).map((s) => `${s.quest}: ${JSON.stringify(s.pattern ?? '')} ${String(s.note ?? s.ledger ?? '').slice(0, 100)}`);
console.log(notes.length); console.log(notes.slice(0, 10).join('\n'));
