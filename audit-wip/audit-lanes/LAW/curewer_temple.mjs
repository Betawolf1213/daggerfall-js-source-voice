// The temple's Heal Curse (healCurse.js -> lycanthropy.js cureLycanthropy -> endLycanthropyQuests -> world.js
// tombstoneQuestsByName -> machine.tombstoneQuest(q, { ended: true })) cures the player while $CUREWER is under way. The
// layer settles $CUREWER at that tombstone: nothing but the catch-all holds, so its outcome is `failed` - "you are a
// lycanthrope still" - on the quest row the player reads, for a player just cured.
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
  classicSeconds: () => now, nowSeconds: () => now, worldSeconds: () => now, playerEntity: { name: 'P', level: 10, skills: new Array(35).fill(30), career: {} }, carriesQuestItem: () => false,
});
const q = b.machine.startQuestByName('$CUREWER', 0);
for (const t of q.tasks.values()) for (const a of t.actions) if (!a.isTriggerCondition) { const up = a.update.bind(a); a.update = (c) => { try { up(c); } catch { a.setComplete(); } }; }
const tick = (n = 1) => { for (let i = 0; i < n; i++) { now += 60; b.machine.tick(); b.questlines.look(); } };
tick(2);
q.getTask({ name: 'readletter' }).start(); tick(2);            // the hunter's letter read: the hunt for a cure begins
// the temple's Heal Curse cures the player: world.js tombstoneQuestsByName('$CUREWER') - the call it makes
for (const x of [...b.machine.quests.values()]) if (x.questName === '$CUREWER' && !x.questTombstoned) b.machine.tombstoneQuest(x, { ended: true });
console.warn = warn;
const row = b.questLog().ended.find((r) => r.questName === '$CUREWER');
console.log(`settled: ${q.ql.outcome} - the Quests tab's ended row says: "${row?.ql?.outcome?.text}" (failure ${row?.ql?.outcome?.failure})`);
