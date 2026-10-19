// M0B40Y05: the spriggan killed, the player never goes back - `_2dung_` runs out and DFU ends the quest a FAILURE (the
// journal files it "ended", offline the Guild -2). The sheet's `slain` is bound to the kill (_S.01_), not to the pay, so the
// layer settles it as a success: "The spriggan is dead and the woodsmen are back at work.", and the guild's ladder strikes
// it as finished well (qlLayer.js ending: history for an outcome that is no failure).
const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';
const { readFileSync } = await import('node:fs');
const { join } = await import('node:path');
const { createQuestBridge } = await import(`${SNAP}/src/scenes/quest/questBridge.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { questSource, loadTables } = await import(`${SNAP}/test/qlSources.mjs`);
loadTables(); setPref('questlines', true);
const VENDOR = join(SNAP, 'vendor', 'dfu-quests');
const warn = console.warn; console.warn = () => {};
let now = 1000;
const b = createQuestBridge({
  data: { readListTable: (n) => { try { return readFileSync(join(VENDOR, 'Tables', `QuestList-${n}.txt`), 'utf8'); } catch { return null; } }, getQuestSourceLines: (n) => questSource(n, true) },
  classicSeconds: () => now, nowSeconds: () => now, worldSeconds: () => now, playerEntity: { name: 'P', level: 8, skills: new Array(35).fill(30), career: {} }, carriesQuestItem: () => false,
});
const q = b.machine.startQuestByName('M0B40Y05', 0);
for (const t of q.tasks.values()) for (const a of t.actions) if (!a.isTriggerCondition) { const up = a.update.bind(a); a.update = (c) => { try { up(c); } catch { a.setComplete(); } }; }
const tick = (n = 1) => { for (let i = 0; i < n; i++) { now += 60; b.machine.tick(); b.questlines.look(); } };
tick(2);
q.resources.get('monster').killCount = 1; tick(2);                               // the spriggan dead (_S.01_)
const c = q.resources.get('2dung'); c.clockEnabled = false; c.clockFinished = true; q.getTask({ name: '2dung' }).start(); tick(4);   // the time to report runs out
console.warn = warn;
const filed = b.notebook.getFinishedQuests().at(-1).map((x) => x.text).join(' ');
console.log(`DFU: success ${q.questSuccess}; filed: "${filed.slice(0, 60)}... ${filed.slice(-80)}"`);
console.log(`layer: outcome ${q.ql.outcome}; history ${JSON.stringify(b.questlines.history())}`);
