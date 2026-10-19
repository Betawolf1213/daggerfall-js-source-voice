// Q5: what the layer costs per machine tick (10 a second, questBridge.js tick) - look() and the walk the lens reads
// every tick while the herald or the tracker listens (questLog: rowOf with quietText per objective, lineRows, ladderRows).
const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';   // = git archive of the snapshot's HEAD (fe033c256): other lanes' probe mutants edit the shared worktree
const { readFileSync } = await import('node:fs');
const { join } = await import('node:path');
const { createQuestBridge } = await import(`${SNAP}/src/scenes/quest/questBridge.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { questSource, loadTables } = await import(`${SNAP}/test/qlSources.mjs`);
loadTables();
const VENDOR = join(SNAP, 'vendor', 'dfu-quests');
const QUESTS = ['M0B00Y06', 'M0B00Y16', 'N0B00Y09', 'M0B50Y09', 'B0B40Y08', 'K0C00Y03', 'A0C00Y14', 'R0C10Y00'];
function run(on) {
  setPref('questlines', on);
  let now = 1000;
  const warn = console.warn; console.warn = () => {};
  const b = createQuestBridge({ data: { readListTable: (n) => { try { return readFileSync(join(VENDOR, 'Tables', `QuestList-${n}.txt`), 'utf8'); } catch { return null; } }, getQuestSourceLines: (n) => questSource(n, on) },
    classicSeconds: () => now, worldSeconds: () => now, nowSeconds: () => now, playerEntity: { level: 8, skills: new Array(35).fill(10), career: {} }, carriesQuestItem: () => false });
  const started = QUESTS.map((n) => b.machine.startQuestByName(n, 0)).filter(Boolean);
  for (const q of started) for (const t of q.tasks.values()) for (const a of t.actions) { const up = a.update.bind(a); a.update = (c) => { try { up(c); } catch { a.setComplete(); } }; }
  for (let i = 0; i < 3; i++) b.machine.tick();
  console.warn = warn;
  const live = started.filter((q) => !q.questComplete).length;
  const N = 2000;
  let t0 = performance.now();
  for (let i = 0; i < N; i++) b.questlines.look();
  const look = (performance.now() - t0) / N;
  t0 = performance.now();
  for (let i = 0; i < N; i++) b.questLog();
  const log = (performance.now() - t0) / N;
  const sample = b.questLog();
  t0 = performance.now();
  for (let i = 0; i < N; i++) b.lens.look({});
  const lens = (performance.now() - t0) / N;
  let calls = 0; const orig = b.questlines.rowOf; b.questlines.rowOf = (...a) => { calls++; return orig(...a); };
  b.questLog(); b.questlines.rowOf = orig;
  return { on, live, lookMs: look.toFixed(4), questLogMs: log.toFixed(4), lensLookMs: lens.toFixed(4), rowOfPerWalk: calls, rows: sample.active.filter((r) => r.ql).length + sample.unlogged.length };
}
console.log(JSON.stringify(run(false)));
console.log(JSON.stringify(run(true)));
console.log(JSON.stringify(run(false)));
console.log(JSON.stringify(run(true)));
{
  setPref('questlines', true);
  const b = createQuestBridge({ data: { readListTable: () => null, getQuestSourceLines: (n) => questSource(n, true) }, classicSeconds: () => 1000, playerEntity: { level: 20, skills: new Array(35).fill(10), career: {} } });
  const N = 2000; let t0 = performance.now();
  for (let i = 0; i < N; i++) b.questlines.lineRows();
  console.log('lineRows ms', ((performance.now() - t0) / N).toFixed(4), 'rows', b.questlines.lineRows().length);
  t0 = performance.now();
  for (let i = 0; i < N; i++) b.questLog();
  console.log('questLog (no quests) ms', ((performance.now() - t0) / N).toFixed(4));
}
