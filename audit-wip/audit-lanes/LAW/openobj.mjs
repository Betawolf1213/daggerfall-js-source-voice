const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';
const { sheetFor } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const fs = await import('node:fs');
const prefix = process.argv[2] ?? 'drive_out_';
const agg = {};
for (const f of fs.readdirSync('.').filter((f) => f.startsWith(prefix) && f.endsWith('.jsonl'))) {
  for (const line of fs.readFileSync(f, 'utf8').split('\n').filter(Boolean)) {
    const { name, res } = JSON.parse(line);
    const sheet = sheetFor(name);
    for (const w of res) {
      if (!w.complete || !w.success || w.failure !== false) continue;
      for (const o of sheet.objectives) if (!o.optional && w.opened.includes(o.id) && !w.doneObj.includes(o.id) && !(w.failedObj ?? []).includes(o.id)) {
        const k = `${name}.${o.id} (outcome ${w.outcome}) done:${JSON.stringify(o.done)}`;
        agg[k] = (agg[k] ?? 0) + 1;
      }
    }
  }
}
for (const [k, v] of Object.entries(agg).sort()) console.log(v, k);
