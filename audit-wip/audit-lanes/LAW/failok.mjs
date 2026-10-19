const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';   // = git archive of the snapshot's HEAD (fe033c256): other lanes' probe mutants edit the shared worktree
const { sheetFor } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const fs = await import('node:fs');
const prefix = process.argv[2] ?? 'drive_out_';
const agg = {};
for (const f of fs.readdirSync('.').filter((f) => f.startsWith(prefix) && f.endsWith('.jsonl'))) {
  for (const line of fs.readFileSync(f, 'utf8').split('\n').filter(Boolean)) {
    const { name, res } = JSON.parse(line);
    const sheet = sheetFor(name);
    for (const w of res) {
      if (!w.complete || w.success || w.failure !== false) continue;
      const o = sheet.outcomes.find((x) => x.id === w.outcome);
      const k = `${name}.${o.id} pay=${o.pay} standing=${JSON.stringify(o.standing ?? {})} legal=${o.legal ?? 0}`;
      agg[k] = (agg[k] ?? 0) + 1;
    }
  }
}
for (const [k, v] of Object.entries(agg).sort()) console.log(v, k);
