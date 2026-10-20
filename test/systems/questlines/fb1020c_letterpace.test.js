// FB1020c LETTER-PACE (FIELD BUGS 2026-10-20c, the Discord: "assaulted w notes/quests" - "With the recent update ive
// received 4 different notes from townsfolk asking me to do things while in a town for 5 minutes"). Every questline
// opens with a courier's letter (`give pc <letter> notify`), and GivePc holds a letter until the player stands in a
// town, outdoors, by day (GivePc.cs:78-97) - then hands each over 40 to 500 ticks after the town is reached, so they
// "don't all arrive at once". The runner paced the lines' STARTS an hour apart (AUDIT QUESTLINES LINES-17), but every
// line it began at night (online the sky's night is half of every real hour), indoors or in the wild held its letter,
// and they all landed within a minute at the next town by day. Now a line begins only when no begun line's first letter
// is still on its way, and an hour after the last letter arrived (qlLineRunner.js mayBegin, letterOnItsWay, lettered;
// the layer's letter arm, qlLayer.js reward). The bridge below is the real one - the machine, the layer, the runner,
// GivePc - on the online clocks; the runner's own cases run over a fake machine holding the real scripts' quests.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createQuestBridge } from '../../../src/scenes/quest/questBridge.js';
import { createLineRunner, letterOnItsWay, STEP_GAP_S } from '../../../src/systems/questlines/qlLineRunner.js';
import { QL_LINES, lineStepOf } from '../../../src/systems/questlines/qlLines.js';
import { QUESTLINES_PREF, questlinesOn } from '../../../src/systems/questlines/qlLaw.js';
import { LOOT_RARITY_KEY } from '../../../src/systems/loot/lootRarity.js';
import { KINGS_GAMBIT_KEY } from '../../../src/systems/features.js';
import { setPref } from '../../../src/systems/uiPrefs.js';
import { questSource, loadTables, packMachine, parsedQuest } from '../../qlSources.mjs';

loadTables();
for (const k of [QUESTLINES_PREF, LOOT_RARITY_KEY, KINGS_GAMBIT_KEY, 'naval']) setPref(k, true);

/** The letter a step's quest hands over: its `give pc <letter> notify` actions. */
const letterGives = (quest) => [...quest.tasks.values()].flatMap((t) => t.actions)
  .filter((a) => a.typeName === 'GivePc' && a.textId && quest.getItem(a.itemSymbol)?.itemName === 'letter');

test('FB1020c LETTER-PACE: every line\'s first step hands its giver\'s word over as a letter - `give pc <Item ... letter> notify` - so the runner\'s wait reads every line; held, it is on its way, given or set aside it is not (mutants: textId, isComplete, the item\'s kind, the shelf)', () => {
  const machine = packMachine();
  assert.equal(QL_LINES.length, 13);
  for (const l of QL_LINES) {
    const { quest } = parsedQuest(l.steps[0].quest, machine);
    const gives = letterGives(quest);
    assert.equal(gives.length, 1, `${l.steps[0].quest}: one letter`);
    assert.equal(letterOnItsWay(quest), true, `${l.steps[0].quest}: on its way until given`);
    quest.shelvedAt = 5;
    assert.equal(letterOnItsWay(quest), false, `${l.steps[0].quest}: set aside (QUEST-SHELF), it waits on no one`);
    quest.shelvedAt = null;
    gives[0].setComplete();
    assert.equal(letterOnItsWay(quest), false, `${l.steps[0].quest}: given`);
  }
  // a step whose only GivePc is pay (`give pc _gold_`) holds no letter back
  const { quest } = parsedQuest('QLBD01', machine);
  for (const g of letterGives(quest)) g.setComplete();
  assert.ok([...quest.tasks.values()].flatMap((t) => t.actions).some((a) => a.typeName === 'GivePc' && !a.isComplete), 'its purse still to pay');
  assert.equal(letterOnItsWay(quest), false, 'the purse is no letter');
  assert.equal(letterOnItsWay(null), false);
});

/** The runner over a fake machine whose quests are the real scripts' (parsed headless): level 30 offline - the four
 *  introductions that open offline (Loot rarity, the sea, The King's Gambit on). */
function runnerOf() {
  const pack = packMachine();
  let uid = 1;
  const machine = {
    quests: new Map(), questsToInvoke: [],
    scheduleQuestByName(name) { const q = parsedQuest(name, pack).quest; q.uid = uid++; machine.questsToInvoke.push(q); return q; },
    tick() { for (const q of machine.questsToInvoke.splice(0)) machine.quests.set(q.uid, q); },
  };
  const clock = { s: 400 * 86400 };
  const runner = createLineRunner({ machine, ctx: { level: () => 30, online: () => false, nowSeconds: () => clock.s } });
  const step = () => { runner.look(); machine.tick(); };
  const begun = () => QL_LINES.filter((l) => runner.lineState(l.id)).map((l) => l.id);
  return { runner, machine, clock, step, begun };
}
const firstOf = (machine, id) => [...machine.quests.values()].find((q) => q.questName === QL_LINES.find((l) => l.id === id).steps[0].quest);

test('FB1020c LETTER-PACE, the runner: a begun line\'s letter still on its way holds every other line however long it waits; given, the next line begins an hour after it - never an hour after the start (mutants: the wait unread; the hour from the letter; the arm\'s step guard; the first step\'s index)', () => {
  const { runner, machine, clock, step, begun } = runnerOf();
  step();
  assert.equal(begun().length, 1, 'one line on the first tick');
  const [first] = begun();
  clock.s += 3 * STEP_GAP_S;   // three hours with its letter held (night, a dungeon, a shop)
  step();
  assert.deepEqual(begun(), [first], 'no second line while the first one\'s letter waits');
  const q = firstOf(machine, first);
  for (const g of letterGives(q)) g.setComplete();   // GivePc hands it over...
  runner.lettered(q);   // ...and the layer's letter arm tells the runner (qlLayer.js reward)
  assert.equal(runner.lineState(first).lettered, clock.s);
  step();
  assert.deepEqual(begun(), [first], 'not in the same breath as the letter');
  clock.s += STEP_GAP_S - 1;
  step();
  assert.deepEqual(begun(), [first], 'nor within its hour');
  clock.s += 1;
  step();
  assert.equal(begun().length, 2, 'an hour after the letter: the next line');
});

test('FB1020c LETTER-PACE, the runner: a first step set aside in the journal (QUEST-SHELF) holds no other line back (mutant: the shelf read as held)', () => {
  const { machine, clock, step, begun } = runnerOf();
  step();
  firstOf(machine, begun()[0]).shelvedAt = clock.s;
  clock.s += STEP_GAP_S;
  step();
  assert.equal(begun().length, 2);
});

test('FB1020c LETTER-PACE, the runner: the save keeps when the last letter came - a load inside its hour begins nothing, an hour on the next line begins; an older save without it loads as no letter yet (mutants: restore drops `lettered`)', () => {
  const { runner, clock, step, begun } = runnerOf();
  runner.restore({ introTables: { step: 1, outcomes: {}, done: false, wait: 0, claims: {}, begun: 1, lettered: clock.s - 60 } });
  assert.equal(runner.lineState('introTables').lettered, clock.s - 60, 'restored');
  assert.equal(runner.snapshot().introTables.lettered, clock.s - 60, 'and saved again');
  step();
  assert.deepEqual(begun(), ['introTables'], 'inside the letter\'s hour: nothing new');
  clock.s += STEP_GAP_S;
  step();
  assert.equal(begun().length, 2, 'an hour on');
  runner.restore({ introTables: { step: 1, outcomes: {}, done: false, wait: 0, claims: {}, begun: 1 } });
  assert.equal(runner.lineState('introTables').lettered, 0, 'a save from before LETTER-PACE');
});

/** The real bridge as the game ticks it, online: a registered account (every line's gate), the short wait
 *  (ONLINE_DELAY_SECONDS), level 20. One tick a real second - the character's clock 12 s (TimeScale 12), the sky's 24 s
 *  (SKY_SEGMENTS, TimeScale 24) - from the sky's 01:00, the player in a town throughout. Answers each line's letter,
 *  in order: { quest, s } on the character's clock. */
function play(ticks) {
  const st = { s: 400 * 86400, sky: 400 * 86400 + 3600, letters: [] };
  const service = { account: () => 'acct', guest: () => false, claim: async () => ({ ok: true, data: { opened: true } }) };
  const warn = console.warn;
  console.warn = () => {};
  try {
    const bridge = createQuestBridge({
      data: { readListTable: () => null, getQuestSourceLines: (n) => questSource(n, questlinesOn()) },
      classicSeconds: () => st.s, skySeconds: () => st.sky, worldSeconds: () => st.s, sharedClock: () => true,
      isPlayerInTown: () => true, questlineService: service,
      playerEntity: { name: 'Hero', level: 20, gender: 'female', career: { weaponArmorShieldsBitfield: 0, forbiddenMaterialsFlags: 0 }, skills: new Array(35).fill(30), items: [] },
      giveItemToPlayer: () => {}, offerReward: () => {},
      // the courier's word (GivePc's notify box), once a step's quest
      showPopup: (q) => { if (lineStepOf(q?.questName) && !st.letters.some((l) => l.quest === q.questName)) st.letters.push({ quest: q.questName, s: st.s }); },
      // the world's own part of `place npc` (no building to stand them in here), as ql12_lines' bridge does it
      onQuestStarted: (q) => { for (const task of q.tasks.values()) for (const a of task.actions) if (a.typeName === 'PlaceNpc') a.isComplete = true; },
    });
    for (let i = 0; i < ticks; i++) { st.s += 12; st.sky += 24; bridge.tick(0.1); }
  } finally { console.warn = warn; }
  return st.letters;
}

test('FB1020c LETTER-PACE, the real bridge online: the lines that begin while the town\'s letters wait (the sky\'s night) never land in one breath at dawn - an hour of the character\'s clock and more between any two questline letters - and the lines still begin, one after another (mutants: the wait unread; the hour from the letter; the layer\'s arm; textId; isComplete)', () => {
  const letters = play(900 + 2400);   // six sky hours to dawn, then 2,400 real seconds of day (eight hours of the character's)
  const gaps = letters.slice(1).map((l, i) => l.s - letters[i].s);
  assert.ok(letters.length >= 4, `the lines still begin: ${letters.map((l) => l.quest).join(', ')}`);
  assert.ok(gaps.every((g) => g >= STEP_GAP_S), `an hour apart on the character's clock: ${gaps.join(', ')}`);
});
