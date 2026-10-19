// UI REPRO: THE CLASSIC SKIN'S LOGBOOK IS NO LONGER DFU'S VERBATIM, AND IT IS TOLD OF A TAB IT DOES NOT HAVE. M0B50Y09
// run to its end through the REAL bridge with the switch on (ql4_branches' own setup): the notebook's filed entry - what
// DFU's classic logbook (ui/quest/questJournal.js, the 'finishedQuests' mode) draws - carries a port line, "Outcome: ...";
// and the HUD line sends the player to "your journal's Quests tab", which the classic logbook does not have.
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const { createQuestBridge } = await import(`${SNAP}/src/scenes/quest/questBridge.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { QUESTLINES_PREF, questlinesOn } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
const { questSource, loadTables, ROOT } = await import(`${SNAP}/test/qlSources.mjs`);
const { QuestJournalWindow } = await import(`${SNAP}/src/ui/quest/questJournal.js`);
loadTables();
for (const on of [false, true]) {
  setPref(QUESTLINES_PREF, on);
  const hud = [];
  const bridge = createQuestBridge({
    data: {
      readListTable: (name) => { try { return readFileSync(join(ROOT, 'vendor/dfu-quests/Tables', `QuestList-${name}.txt`), 'utf8'); } catch { return null; } },
      getQuestSourceLines: (n) => questSource(n, questlinesOn()),
    },
    classicSeconds: () => 0,
    playerEntity: { name: 'Hero', level: 12, gender: 'female', career: { weaponArmorShieldsBitfield: 0, forbiddenMaterialsFlags: 0 }, skills: new Array(35).fill(30) },
    showChoice: (q, message, choices, respond) => respond(0),
    addHUDText: (t) => hud.push(t),
    offerReward: () => {}, showPopup: () => {},
  });
  const quest = bridge.machine.startQuestByName('M0B50Y09', 41);
  for (const task of quest.tasks.values()) for (const a of task.actions) if (a.typeName === 'PlaceFoe') a.isComplete = true;
  quest.getTask({ name: 'S.01' }).start();
  quest.getTask({ name: 'qgclicked' }).start();
  for (let i = 0; i < 5; i++) bridge.machine.tick();
  quest.getClock({ name: 'end' })?.endTimer?.();
  quest.getTask({ name: 'end' })?.start();
  for (let i = 0; i < 6; i++) bridge.machine.tick();
  let classic;
  try {
    const w = new QuestJournalWindow({ questMessages: () => [], notebook: () => bridge.notebook, mode: 'finishedQuests' });
    classic = w.entries();
  } catch (e) { classic = bridge.notebook.getFinishedQuests(); console.log('(window not constructible headless:', e.message, '- the notebook it reads instead)'); }
  console.log(`switch ${on ? 'ON ' : 'OFF'} - the classic logbook's Finished Quests entry:`);
  for (const entry of classic) console.log('   ', JSON.stringify(entry.map((t) => t.text).filter(Boolean)));
  console.log('    HUD lines:', JSON.stringify(hud));
}
