// QL2 (bible/06-Systems/Questlines-Arc.md section 6): THE QUESTS TAB'S QUESTLINE PARTS - one module the pause window's
// Quests tab and the chronicle both draw from (ui/questlines/qlJournal.js): a stamped quest's objectives as the
// machine's state opened them (never a hidden one), its choices, how it ended, what it pays; a reward waiting, its three
// pieces and their Take. And the bridge hands both faces their doors through `journalClean`, the one door every host
// already hands its pause window.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakePage } from '../../hudPage.mjs';
import { qlObjectivesBlock, qlOfferDetail, offerRowWords, rewardWords, floorWords, qlLineDetail, lineStateWords } from '../../../src/ui/questlines/qlJournal.js';
import { questRail, unloggedRail } from '../../../src/ui/quest/questRail.js';
import { TIER_FLOORS, REWARD_CHOICES } from '../../../src/systems/questlines/qlRewards.js';

const text = (n) => n.textContent;

test('QL2 the block: what to do as the state opened it - done, failed, optional, alternatives joined by "or" - the choices, and what finishing pays', () => {
  const doc = fakePage();
  const ql = {
    tier: 3,
    objectives: [
      { id: 'a', text: 'Find the ring', state: 'done' },
      { id: 'b', text: 'Return it to the Guild', state: 'open', any: 'end' },
      { id: 'c', text: 'Sell it to the fence', state: 'open', any: 'end' },
      { id: 'd', text: 'Read the letter', state: 'open', optional: true },
      { id: 'e', text: 'Never shown', state: 'hidden' },
      { id: 'f', text: 'Keep the client alive', state: 'failed' },
    ],
    choices: [{ branch: 'fate', text: 'The thief begs for mercy.', choice: 'Let the thief go' }],
    outcome: null,
  };
  const block = qlObjectivesBlock(doc, ql);
  const rows = block.querySelectorAll('.px-qobj-row');
  assert.deepEqual(rows.map(text).map((s) => s.replace(/^\W+/, '')), ['Find the ringdone', 'Return it to the Guild', 'Sell it to the fence', 'Read the letteroptional', 'Keep the client alivefailed']);
  assert.deepEqual(rows.map((r) => r.className.split(' ')[1]), ['done', 'open', 'open', 'open', 'failed']);
  assert.equal(block.querySelectorAll('.px-qobj-or').length, 1, 'two alternatives, one "or" between them');
  assert.ok(!text(block).includes('Never shown'), 'a hidden objective is never drawn');
  assert.match(text(block), /What to do/);
  assert.match(text(block), /Your choices.*The thief begs for mercy\.Let the thief go/);
  assert.equal(text(block.querySelector('.px-qobj-reward')), rewardWords(3));
  assert.match(rewardWords(3), new RegExp(`choose one of ${REWARD_CHOICES} pieces`));
  assert.equal(floorWords(3), TIER_FLOORS[3].floor === 'rare' ? 'Rare or better' : 'Magic or better', 'read off the constant');
  assert.equal(floorWords(1), 'Magic or better');
});

test('QL2 the block: an ended quest says how it ended (a failure in its own colour) and no reward line; DFU\'s quest draws nothing', () => {
  const doc = fakePage();
  const won = qlObjectivesBlock(doc, { tier: 2, objectives: [{ id: 'a', text: 'x', state: 'done' }], choices: [], outcome: { id: 'done', text: 'The beast is dead.', failure: false } });
  assert.match(text(won), /How it ended.*The beast is dead\./);
  assert.equal(won.querySelector('.px-qobj-reward'), null);
  const lost = qlObjectivesBlock(doc, { tier: 2, objectives: [], choices: [], outcome: { id: 'failed', text: 'Too late.', failure: true } });
  assert.ok(lost.querySelector('.px-qobj-outcome').className.includes('failed'));
  assert.equal(qlObjectivesBlock(doc, null), null);
  assert.equal(qlObjectivesBlock(doc, { tier: 1, objectives: [{ id: 'a', text: 'x', state: 'hidden' }], choices: [], outcome: null }), null, 'nothing opened, nothing to say');
});

test('QL3 a reward waiting: its pieces as cards - name, tier and kind, their magic - each with its Take', () => {
  const doc = fakePage();
  const taken = [];
  const offer = { id: 7, title: 'Wild Animal', pieces: [
    { kind: 'weapon', tier: 'rare', item: { name: 'Keen Longsword', affixes: [] } },
    { kind: 'armor', tier: 'magic', item: { name: 'Sturdy Cuirass', affixes: [] } },
    { kind: 'jewel', tier: 'magic', item: { name: 'Ring', affixes: [] } },
  ] };
  const box = qlOfferDetail(doc, offer, (i) => taken.push(i));
  const cards = box.querySelectorAll('.px-qpiece');
  assert.equal(cards.length, 3);
  assert.deepEqual(cards.map((c) => c.dataset.rarity), ['rare', 'magic', 'magic'], 'the ladder\'s colour by the sheet');
  assert.deepEqual(cards.map((c) => text(c.querySelector('.px-qpiece-tier'))), ['Rare · Weapon', 'Magic · Armour', 'Magic · Jewellery']);
  const take = cards[1].querySelector('.act');
  assert.equal(text(take), 'Take this');
  assert.match(take.title, /Sturdy Cuirass/, 'a press explains what a hover would (plain words, law 5)');
  take.onclick();
  assert.deepEqual(taken, [1]);
  assert.equal(offerRowWords(offer), 'Reward: Wild Animal');
});

test('QL2 the rail carries `ql` to both faces, and a stamped quest with no journal entry yet is a row of the pause tab\'s by its objectives', () => {
  const ql = { tier: 1, objectives: [{ id: 'a', text: 'x', state: 'open' }], choices: [], outcome: null };
  const message = { getTextTokens: () => [{ text: 'An entry.', formatting: 'text' }], parentQuest: null };
  const rail = questRail({ active: [{ id: '4', name: 'Q', questName: 'M0B00Y06', messages: [message], steps: [{ stepID: 0, time: 0 }], ql }] });
  assert.equal(rail.active[0].ql, ql);
  const un = unloggedRail({ unlogged: [{ id: '9', name: 'Silent', questName: 'S0000988', ql }] });
  assert.deepEqual(un.map((r) => [r.key, r.entries.length, r.main, r.ql === ql]), [['a:9', 0, true, true]]);
  assert.deepEqual(unloggedRail({}), []);
});

test('QL12 a questline\'s page: what a questline is, its story and giver, its steps as the path walked, what it waits on and the title it earns', () => {
  const doc = fakePage();
  const line = {
    id: 'burningDoors', title: 'The Burning Doors', lead: 'Someone is opening the breaches.', giver: 'Ysolde Marnhel', state: 'waiting',
    opens: 'Opens online.', outcome: null, honour: 'doorwarden',
    steps: [
      { quest: 'QLBD01', title: 'A Letter from Wayrest', state: 'done', witnessed: false, outcome: 'Ysolde told you how.' },
      { quest: 'QLBD02', title: 'The Faithful', state: 'current', witnessed: false, outcome: null },
      { quest: 'QLBD03', title: 'Breaking the Rite', state: 'next', witnessed: true, outcome: null },
    ],
  };
  const box = qlLineDetail(doc, line, { titleText: (k) => (k === 'doorwarden' ? 'Doorwarden' : k) });
  assert.match(text(box), /A questline is a story told in several quests/, 'the page says what a questline is');
  assert.match(text(box), /Someone is opening the breaches\./);
  assert.match(text(box), /Given by Ysolde Marnhel/);
  assert.match(text(box), /Waiting for its next step/);
  assert.match(text(box), /Opens online\./);
  const rows = box.querySelectorAll('.px-qobj-row');
  assert.deepEqual(rows.map((r) => r.className.split(' ')[1]), ['done', 'open', 'next']);
  assert.ok(text(rows[0]).includes('done') && text(rows[1]).includes('now'));
  assert.ok(rows[2].querySelector('.px-qobj-tag').title.includes('account service'), 'a press explains what "witnessed" means');
  assert.equal(text(box.querySelector('.px-qline-said')), 'Ysolde told you how.', 'a done step says how it ended');
  assert.match(text(box), /Finish it to earn the title Doorwarden/);
  const done = qlLineDetail(doc, { ...line, state: 'done', opens: null, outcome: 'The embers went to the Guild.' }, { titleText: () => 'Doorwarden' });
  assert.match(text(done), /How it ended.*The embers went to the Guild\./);
  assert.match(text(done), /earns the title Doorwarden/);
  assert.equal(lineStateWords('locked'), 'Not begun');
});

test('QL2 the Quest Guide reads objectives: the tracker\'s card says the one asked now, and the herald says one done', async () => {
  const { QuestLens, currentObjective } = await import('../../../src/ui/quest/questLens.js');
  const { QuestHerald, HERALD_WORDS } = await import('../../../src/ui/quest/questHerald.js');
  const { QuestTracker } = await import('../../../src/ui/quest/questTracker.js');
  const message = { id: 1010, getTextTokens: () => [{ text: 'A beast is loose in the house.', formatting: 'text' }], parentQuest: null };
  let ql = { tier: 1, objectives: [{ id: 'slay', text: 'Kill the beast', state: 'open' }, { id: 'tell', text: 'Return for your pay', state: 'hidden' }], choices: [], outcome: null };
  const row = () => ({ id: '7', name: 'Wild Animal', questName: 'M0B00Y06', messages: [message], steps: [{ stepID: 0, messageID: 1010, time: 1 }], clocks: [], ql });
  const lens = new QuestLens({ questLog: () => ({ active: [row()], ended: [] }) });
  assert.equal(currentObjective(ql), 'Kill the beast');
  assert.deepEqual(lens.look().events, [], 'a baseline');
  const tracker = new QuestTracker();
  tracker.pinned = '7';
  tracker.hear(lens.look());
  assert.equal(tracker.frame().opening, 'Kill the beast', 'the card: the objective, not the entry');
  ql = { ...ql, objectives: [{ id: 'slay', text: 'Kill the beast', state: 'done' }, { id: 'tell', text: 'Return for your pay', state: 'open' }] };
  const seen = lens.look();
  assert.deepEqual(seen.events, [{ type: 'objective', id: '7', title: 'Wild Animal', main: false, text: 'Kill the beast' }]);
  tracker.hear(seen);
  assert.equal(tracker.frame().opening, 'Return for your pay');
  const herald = new QuestHerald();
  herald.hear(seen);
  assert.deepEqual([herald.rows[0].type, herald.rows[0].line], ['objective', 'Kill the beast']);
  assert.equal(HERALD_WORDS.objective, 'Objective done');
  assert.deepEqual(lens.look().events, [], 'said once');
});
