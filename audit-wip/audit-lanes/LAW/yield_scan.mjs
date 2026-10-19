// walks whose settled outcome came from the fallback: at the end, success, and no outcome but the catch-all held
const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';
const { sheetFor } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const fs = await import('node:fs');
const prefix = process.argv[2] ?? 'drive_out_';
const agg = {};
for (const f of fs.readdirSync('.').filter((f) => f.startsWith(prefix) && f.endsWith('.jsonl'))) {
  for (const line of fs.readFileSync(f, 'utf8').split('\n').filter(Boolean)) {
    const { name, res } = JSON.parse(line);
    const sheet = sheetFor(name);
    const catchAll = new Set(sheet.outcomes.filter((o) => o.on && Object.keys(o.on).length === 1 && o.on.ended === true).map((o) => o.id));
    for (const w of res) {
      const m = w.endingMoments?.[0];
      if (!m) continue;
      const held = m.heldNow.filter((x) => !catchAll.has(x));
      if (!held.length && m.success) { const k = `${name} -> ${m.outcome}`; (agg[k] ??= []).push(w.events.join(' ')); }
    }
  }
}
for (const [k, v] of Object.entries(agg)) console.log(v.length, k, '| e.g.', v[0].slice(0, 300));
