// M4's regression: M0B00Y06 says `end quest` in its reward task (_S.02_) and in its clock's (_2dung_); when both run inside
// EndQuest's two-tick grace the layer's `ending` is called twice. With the `moved` guard: one offer. Without: two.
const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';
const { readFileSync } = await import('node:fs');
const { join } = await import('node:path');
const { createQuestBridge } = await import(`${SNAP}/src/scenes/quest/questBridge.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { questSource, loadTables } = await import(`${SNAP}/test/qlSources.mjs`);
loadTables(); setPref('questlines', true);
const VENDOR = join(SNAP, 'vendor', 'dfu-quests');
const warn = console.warn; console.warn = () => {};
let now = 1000; const offers = [], rep = [];
const b = createQuestBridge({
  data: { readListTable: (n) => { try { return readFileSync(join(VENDOR, 'Tables', `QuestList-${n}.txt`), 'utf8'); } catch { return null; } }, getQuestSourceLines: (n) => questSource(n, true) },
  classicSeconds: () => now, nowSeconds: () => now, worldSeconds: () => now, playerEntity: { name: 'P', level: 8, skills: new Array(35).fill(30), career: {} },
  carriesQuestItem: () => false, onQuestlineOffer: (o) => offers.push(o), changeReputation: (f, a, p) => rep.push([f, a, p]),
});
const q = b.machine.startQuestByName('M0B00Y06', 0);
for (const t of q.tasks.values()) for (const a of t.actions) if (!a.isTriggerCondition) { const up = a.update.bind(a); a.update = (c) => { try { up(c); } catch { a.setComplete(); } }; }
let ends = 0; const e = q.endQuest.bind(q); q.endQuest = () => { ends++; return e(); };
b.machine.tick();
q.getTask({ name: 'mondead' }).start(); q.getTask({ name: 'qgclicked' }).start();
now += 60; b.machine.tick(); b.questlines.look();                                                        // the hand-in: gold, `end quest`
q.resources.get('2dung').remainingTimeInSeconds = 0; q.resources.get('2dung').clockEnabled = true;   // the time limit runs out inside the grace
for (let i = 0; i < 5; i++) { now += 60; b.machine.tick(); b.questlines.look(); }
console.warn = warn;
console.log(`end quest ran ${ends} times; gear offers ${offers.length}; outcome ${q.ql.outcome}`);
