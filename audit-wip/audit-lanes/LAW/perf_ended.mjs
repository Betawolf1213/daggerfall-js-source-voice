// Q5: questLog() - read by the lens at EVERY machine tick (10 a second) while the herald or the tracker listens - builds a
// `ql` row (rowOf: readObjectives + quietText on every objective, choice and outcome) for every ENDED quest the machine
// still holds (a tombstone stays a week), though the lens never reads the archive (questLens.js look: "the archive is the
// journal windows'"). The cost grows with the quests finished in the last game week.
const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';
const { readFileSync } = await import('node:fs');
const { join } = await import('node:path');
const { createQuestBridge } = await import(`${SNAP}/src/scenes/quest/questBridge.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { questSource, loadTables } = await import(`${SNAP}/test/qlSources.mjs`);
const { SHEETS } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
loadTables();
const VENDOR = join(SNAP, 'vendor', 'dfu-quests');
function bench(on, ended) {
  setPref('questlines', on);
  const warn = console.warn; console.warn = () => {};
  const b = createQuestBridge({ data: { readListTable: (n) => { try { return readFileSync(join(VENDOR, 'Tables', `QuestList-${n}.txt`), 'utf8'); } catch { return null; } }, getQuestSourceLines: (n) => questSource(n, on) },
    classicSeconds: () => 1000, nowSeconds: () => 1000, worldSeconds: () => 1000, playerEntity: { level: 8, skills: new Array(35).fill(10), career: {} }, carriesQuestItem: () => false });
  const names = [...SHEETS.keys()].filter((n) => /^[A-R]0[BC]/.test(n)).slice(0, ended);
  let made = 0;
  for (const n of names) { try { const q = b.machine.startQuestByName(n, 0); if (q) { if (q.ql) q.ql.outcome = SHEETS.get(n).outcomes[0].id; b.machine.tombstoneQuest(q); made++; } } catch { /* a quest that needs a world */ } }
  console.warn = warn;
  b.questLog();
  const N = 500; const t0 = performance.now();
  for (let i = 0; i < N; i++) b.questLog();
  return { on, ended: made, questLogMs: ((performance.now() - t0) / N).toFixed(3) };
}
for (const k of [0, 10, 30]) { console.log(JSON.stringify(bench(false, k))); console.log(JSON.stringify(bench(true, k))); }
