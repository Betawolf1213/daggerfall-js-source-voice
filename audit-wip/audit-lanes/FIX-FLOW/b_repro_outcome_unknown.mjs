// BRANCH Q4: `outcome _x_` with a name the quest's sheet does not have. QlOutcome writes it unchecked ("first one
// stands"), so the sheet's own binding can never settle the outcome at `end quest` (observe's settle runs only while
// ql.outcome is empty) and outcomeOf() finds no row: the quest ends a success with NO outcome - no standing, no choice of
// gear, nothing filed, nothing in the ladder's history. Shown on M0B50Y09's waived path, in memory (the snapshot is untouched).
const SNAP = '/home/user/daggerfall-js-source';
const { readFileSync } = await import('node:fs');
const { join } = await import('node:path');
const { createQuestBridge } = await import(`${SNAP}/src/scenes/quest/questBridge.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { QUESTLINES_PREF } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
const { questSource, loadTables, ROOT } = await import(`${SNAP}/test/qlSources.mjs`);
const { askTasks, forceTask, stubWorld } = await import('./b_harness.mjs');
loadTables();
console.warn = () => {};

function run(extraLine) {
  setPref(QUESTLINES_PREF, true);
  const rec = { asked: [], rep: [], offers: [], rewards: [] };
  const bridge = createQuestBridge({
    data: {
      readListTable: (name) => { try { return readFileSync(join(ROOT, 'vendor/dfu-quests/Tables', `QuestList-${name}.txt`), 'utf8'); } catch { return null; } },
      getQuestSourceLines: (n) => {
        const l = questSource(n, true);
        if (!extraLine) return l;
        const i = l.findIndex((x) => /^_qlaltpath_ task:/.test(x));
        return [...l.slice(0, i + 2), extraLine, ...l.slice(i + 2)];   // after `when _qlalt_`
      },
    },
    classicSeconds: () => 0,
    playerEntity: { name: 'Hero', level: 12, gender: 'female', career: { weaponArmorShieldsBitfield: 0, forbiddenMaterialsFlags: 0 }, skills: new Array(35).fill(30) },
    showChoice: (q, m, c, respond) => rec.asked.push(respond),
    changeReputation: (fid, amount) => rec.rep.push([fid, amount]),
    onQuestlineOffer: (o) => rec.offers.push(o),
    offerReward: (_q, item) => rec.rewards.push(item),
  });
  const quest = bridge.machine.startQuestByName('M0B50Y09', 41);
  stubWorld(quest);
  for (let i = 0; i < 2; i++) bridge.tick(1);
  for (const t of askTasks(quest)) forceTask(t);
  bridge.tick(1);
  rec.asked[0](1);   // waive the fee
  for (let i = 0; i < 6; i++) bridge.tick(1);
  quest.getClock({ name: 'end' }).remainingTimeInSeconds = 0; quest.getClock({ name: 'end' })._triggerTask(quest);
  for (let i = 0; i < 6; i++) bridge.tick(1);
  const row = bridge.questlog?.() ?? null;
  return { ended: quest.questComplete, success: quest.questSuccess, outcome: quest.ql.outcome, rep: rec.rep, offers: rec.offers.length, history: bridge.questlines.history() };
}
console.log('as shipped           :', JSON.stringify(run(null)));
console.log('`outcome _waivd_` added:', JSON.stringify(run('\toutcome _waivd_')));
