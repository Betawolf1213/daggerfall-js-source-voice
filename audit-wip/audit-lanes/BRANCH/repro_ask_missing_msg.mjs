// BRANCH (with the probe mutant above): a patch whose `ask` names a choice message the script lacks - here M0B60Y10's
// `1902` misspelt `1909`, in memory - passes every pin (ql1_sheets' patch law checks new message NUMBERS, never that
// the ids an `ask` or `say` names exist; the sheet law's `settable` counts the ask line as setting _qlalt_). In play
// QlAsk warns to the console, marks itself done and asks nothing: the reward task waits on `_qlkeep_` for ever. The
// atronach is dead, the questor clicked, and the quest neither pays nor ends.
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { readFileSync } = await import('node:fs');
const { join } = await import('node:path');
const { createQuestBridge } = await import(`${SNAP}/src/scenes/quest/questBridge.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { QUESTLINES_PREF } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
const { questSource, loadTables, ROOT } = await import(`${SNAP}/test/qlSources.mjs`);
const { stubWorld } = await import('./harness.mjs');
loadTables();
const warns = []; console.warn = (...a) => warns.push(a.join(' '));
setPref(QUESTLINES_PREF, true);
for (const mutate of [false, true]) {
warns.length = 0;
let asked = 0; const rewards = [];
const bridge = createQuestBridge({
  data: {
    readListTable: (name) => { try { return readFileSync(join(ROOT, 'vendor/dfu-quests/Tables', `QuestList-${name}.txt`), 'utf8'); } catch { return null; } },
    getQuestSourceLines: (n) => questSource(n, true).map((l) => (mutate ? l.replace('ask 1900 choices 1901 _qlkeep_ 1902 _qlalt_', 'ask 1900 choices 1901 _qlkeep_ 1909 _qlalt_') : l)),
  },
  classicSeconds: () => 0,
  showChoice: () => { asked++; },
  offerReward: (_q, item) => rewards.push(item),
});
const q = bridge.machine.startQuestByName('M0B60Y10', 41);
stubWorld(q);
bridge.machine.tick();
q.getTask({ name: 'map' }).clear(); q.getTask({ name: 'nomap' }).start();   // the draw: no map
q.getTask({ name: 'S.01' }).start();          // the atronach banished
const c = q.getTask({ name: 'S.02' }); c.actions.forEach((a) => { if (a.isTriggerCondition) a.isComplete = true; }); c.start();   // the questor clicked
for (let i = 0; i < 30; i++) bridge.machine.tick();
console.log(`${mutate ? 'misspelt 1909' : 'as shipped   '}: asked=${asked} gold=${rewards.length} ended=${q.questComplete || q.ticksToEnd > 0} ask complete=${[...q.tasks.values()].flatMap((t) => t.actions).find((a) => a.typeName === 'QlAsk').isComplete}`);
console.log('   console:', JSON.stringify(warns.filter((w) => /names a message/.test(w))));
}
