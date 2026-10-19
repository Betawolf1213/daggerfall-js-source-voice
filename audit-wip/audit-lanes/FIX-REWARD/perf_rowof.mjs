// LAW-11: rowOf's cost per journal walk (questLog), the cache's - 8 running and 30 ended stamped quests, quietText the read.
const SNAP = process.env.SNAP_DIR ?? '/home/user/daggerfall-js-source';
const { readFileSync } = await import('node:fs');
const { join } = await import('node:path');
const { createQuestBridge } = await import(`${SNAP}/src/scenes/quest/questBridge.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { quietText } = await import(`${SNAP}/src/ui/quest/questLens.js`);
const { questSource, loadTables } = await import(`${SNAP}/test/qlSources.mjs`);
const { SHEETS } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
loadTables(); setPref('questlines', true);
const VENDOR = join(SNAP, 'vendor', 'dfu-quests');
const warn = console.warn; console.warn = () => {};
const b = createQuestBridge({ data: { readListTable: (n) => { try { return readFileSync(join(VENDOR, 'Tables', `QuestList-${n}.txt`), 'utf8'); } catch { return null; } }, getQuestSourceLines: (n) => questSource(n, true) },
  classicSeconds: () => 1000, playerEntity: { level: 8, skills: new Array(35).fill(10), career: {} }, carriesQuestItem: () => false });
const names = [...SHEETS.keys()].filter((n) => /^[A-R]0[BC]/.test(n));
const quests = [];
for (const n of names.slice(0, 38)) { try { const q = b.machine.startQuestByName(n, 0); if (q) quests.push(q); } catch { /* */ } }
for (const q of quests.slice(8)) { if (q.ql) q.ql.outcome = SHEETS.get(q.questName).outcomes[0].id; b.machine.tombstoneQuest(q); }
b.machine.tick(); b.questlines.look();
console.warn = warn;
const N = 1000;
const walk = () => { for (const q of quests) b.questlines.rowOf(q, quietText); };
walk();
let t0 = performance.now(); for (let i = 0; i < N; i++) walk(); const kept = (performance.now() - t0) / N;
t0 = performance.now(); for (let i = 0; i < N; i++) for (const q of quests) b.questlines.rowOf(q, (qq, text, key) => quietText(qq, text, key)); const fresh = (performance.now() - t0) / N;
console.log(JSON.stringify({ quests: quests.length, ended: quests.filter((q) => q.questComplete).length, rowOfWalkMs: kept.toFixed(4), rowOfWalkUncachedMs: fresh.toFixed(4) }));
