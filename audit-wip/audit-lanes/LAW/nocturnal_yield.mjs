// 40C00Y00 (Nocturnal's summoning): its success task _S.06_ (`when _S.04_ and _S.05_`) unsets _S.04_ as it pays, so it
// stops holding a tick later - an hour before `_bonk_` ends the quest. At the end NO outcome but the catch-all `failed`
// holds; only observe's catch-all yield (qlLaw.js: `if (o?.failure && quest.questSuccess && isCatchAll(o))`) turns it to
// `done`. That line is untested (probe mutant: delete it - every QL test passes), and `both` (bound to _S.17_ AND _S.06_)
// can never be settled at all.
const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';
const { readFileSync } = await import('node:fs');
const { join } = await import('node:path');
const { createQuestBridge } = await import(`${SNAP}/src/scenes/quest/questBridge.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { questSource, loadTables } = await import(`${SNAP}/test/qlSources.mjs`);
const { sheetFor } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { holds } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
loadTables(); setPref('questlines', true);
const VENDOR = join(SNAP, 'vendor', 'dfu-quests');
const warn = console.warn; console.warn = () => {};
let now = 1000;
const b = createQuestBridge({
  data: { readListTable: (n) => { try { return readFileSync(join(VENDOR, 'Tables', `QuestList-${n}.txt`), 'utf8'); } catch { return null; } }, getQuestSourceLines: (n) => questSource(n, true) },
  classicSeconds: () => now, nowSeconds: () => now, worldSeconds: () => now, playerEntity: { name: 'P', level: 10, skills: new Array(35).fill(30), career: {} }, carriesQuestItem: () => false,
});
const q = b.machine.startQuestByName('40C00Y00', 0);
for (const t of q.tasks.values()) for (const a of t.actions) if (!a.isTriggerCondition) { const up = a.update.bind(a); a.update = (c) => { try { up(c); } catch { a.setComplete(); } }; }
const sheet = sheetFor('40C00Y00');
const heldAtEnd = [];
const ending = b.questlines.ending.bind(b.questlines);
b.questlines.ending = (qq) => { heldAtEnd.push(sheet.outcomes.filter((o) => holds(qq, o.on, { ending: true })).map((o) => o.id)); return ending(qq); };
const tick = (n = 1) => { for (let i = 0; i < n; i++) { now += 60; b.machine.tick(); b.questlines.look(); } };
tick(2);
q.resources.get('monster').killCount = 1; tick(2);                 // the mage dead: _S.05_
const click = q.getTask({ name: 'S.04' }).actions.find((a) => a.typeName === 'ClickedNpc'); click.checkTrigger = () => true;
tick(1); click.checkTrigger = () => false;                          // Nocturnal's slave: _S.06_ pays the Key, unsets _S.04_
console.log(`after the pay: success ${q.questSuccess}, _S.06_ holds ${q.getTask({ name: 'S.06' }).getTriggerValue()}`);
tick(3);
console.log(`a few ticks on: _S.06_ holds ${q.getTask({ name: 'S.06' }).getTriggerValue()}`);
q.resources.get('bonk').remainingTimeInSeconds = 0; tick(4);       // `_bonk_`: end quest
console.warn = warn;
console.log(`at the end, outcomes holding: ${JSON.stringify(heldAtEnd[0])} - settled: ${q.ql.outcome}`);
