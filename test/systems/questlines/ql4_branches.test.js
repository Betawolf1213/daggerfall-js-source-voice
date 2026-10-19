// QL4 (bible/06-Systems/Questlines-Arc.md sections 2.3 and 3): A FLAGSHIP QUEST'S BRANCH, RUN. M0B50Y09 (the Fighters
// Guild's gargoyle) carries the hand-in branch (tools/qlPatchKit.mjs): with the switch on, the questor asks how the
// player takes their pay, and the two answers end it differently - the fee as agreed, or the fee waived for the Guild's
// name (its standing, its outcome, no gold, the choice of gear still). With the switch off the script is DFU's: no
// question, the fee paid. Driven through the real bridge over the pack as the game reads it (test/qlSources.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createQuestBridge } from '../../../src/scenes/quest/questBridge.js';
import { setPref } from '../../../src/systems/uiPrefs.js';
import { QUESTLINES_PREF, questlinesOn } from '../../../src/systems/questlines/qlLaw.js';
import { questSource, loadTables, ROOT } from '../../qlSources.mjs';

loadTables();
const FIGHTERS_GUILD = 41;   // Quests-Factions.txt The_Fighters_Guild

function run({ on, answer }) {
  setPref(QUESTLINES_PREF, on);
  const asked = [], rep = [], rewards = [], offers = [], popups = [];
  const skills = new Array(35).fill(30);
  const bridge = createQuestBridge({
    data: {
      readListTable: (name) => { try { return readFileSync(join(ROOT, 'vendor/dfu-quests/Tables', `QuestList-${name}.txt`), 'utf8'); } catch { return null; } },
      getQuestSourceLines: (n) => questSource(n, questlinesOn()),   // the pack's read: the branch while the switch is on
    },
    classicSeconds: () => 0,
    playerEntity: { name: 'Hero', level: 12, gender: 'female', career: { weaponArmorShieldsBitfield: 0, forbiddenMaterialsFlags: 0 }, skills },
    showChoice: (q, message, choices, respond) => asked.push({ message, choices, respond }),
    changeReputation: (fid, amount) => rep.push([fid, amount]),
    offerReward: (_q, item) => rewards.push(item),
    onQuestlineOffer: (o) => offers.push(o),
    showPopup: (_q, tokens) => popups.push(tokens.map((t) => t.text).join(' ')),
  });
  const quest = bridge.machine.startQuestByName('M0B50Y09', FIGHTERS_GUILD);   // the Guild's own quest, as its questor gives it
  // the world's part of the script - the gargoyle stood in its dungeon's markers - is no part of this pin: with no world
  // there is no dungeon to stand it in, so its placing is done by hand and every other line runs as written
  for (const task of quest.tasks.values()) for (const a of task.actions) if (a.typeName === 'PlaceFoe') a.isComplete = true;
  quest.getTask({ name: 'S.01' }).start();      // the gargoyle is dead
  quest.getTask({ name: 'qgclicked' }).start(); // the questor clicked
  bridge.machine.tick();
  if (answer != null) { assert.equal(asked.length, 1, 'asked once'); asked[0].respond(answer); }
  for (let i = 0; i < 4; i++) bridge.machine.tick();
  // the reward's timer (`start timer _end_`) ends it: run it out
  quest.getClock({ name: 'end' })?.endTimer?.();
  quest.getTask({ name: 'end' })?.start();
  for (let i = 0; i < 6; i++) bridge.machine.tick();
  return { quest, asked, rep, rewards, offers, popups };
}

test('QL4 the branch, switch off: DFU\'s gargoyle - no question, the fee paid, no outcome, no standing added', () => {
  const r = run({ on: false, answer: null });
  assert.equal(r.asked.length, 0, 'never asked');
  assert.equal(r.quest.ql, null, 'DFU\'s quest');
  assert.equal(r.rewards.length, 1, 'the fee');
  assert.equal(r.quest.tasks.has('qlask'), false, 'the script as shipped');
  assert.deepEqual(r.rep, [[FIGHTERS_GUILD, 5]], 'DFU\'s +5 for a quest done, and nothing else');
});

test('QL4 the branch, the fee: asked in the quest\'s own words, the fee paid, the outcome its own, the choice of gear made', () => {
  const r = run({ on: true, answer: 0 });
  assert.equal(r.asked[0].message.id, 1900);
  assert.deepEqual(r.asked[0].choices.map((c) => c.id), [1901, 1902]);
  assert.equal(r.rewards.length, 1, 'the fee, through RW1\'s door');
  assert.ok(r.popups.some((p) => /fee of/.test(p)), 'the script\'s own QuestComplete box over its fee');
  assert.equal(r.quest.ql.choices.payment, 'keep');
  assert.equal(r.quest.ql.outcome, 'fee');
  assert.deepEqual(r.rep, [[FIGHTERS_GUILD, 5]], 'DFU\'s +5 alone - the fee moves no standing');
  assert.equal(r.offers.length, 1);
});

test('QL4 the branch, waived: no gold, the Guild\'s standing raised by the outcome, and the choice of gear still made', () => {
  const r = run({ on: true, answer: 1 });
  assert.equal(r.rewards.length, 0, 'no fee');
  assert.equal(r.quest.ql.choices.payment, 'alt');
  assert.equal(r.quest.ql.outcome, 'waived');
  assert.ok(r.quest.questComplete && r.quest.questSuccess, 'ended a success - `ql paid`');
  assert.ok(!r.popups.some((p) => /fee of/.test(p)), 'and quietly: no QuestComplete box paying a fee the player waived');
  assert.deepEqual(r.rep.sort(), [[FIGHTERS_GUILD, 5], [FIGHTERS_GUILD, 5]].sort(), 'DFU\'s +5 and the outcome\'s +5');
  assert.equal(r.offers.length, 1, 'the questlines pay their choice of gear either way');
  assert.equal(r.offers[0].outcome, 'waived');
});
