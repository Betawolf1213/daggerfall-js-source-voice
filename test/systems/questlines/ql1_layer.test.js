// QL1 (bible/06-Systems/Questlines-Arc.md): THE LAYER - the switch and the stamp a quest keeps for life, the bindings an
// objective reads off the machine's own state, the latch, a shared copy's state, and the layer made by the quest bridge
// over a real DFU quest (M0B00Y06, the Fighters Guild's wild beast) from its start to its reward.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadQuestTables } from '../../../src/systems/quest/tables.js';
import { createQuestBridge } from '../../../src/scenes/quest/questBridge.js';
import { QuestMachine } from '../../../src/systems/quest/machine.js';
import { setPref } from '../../../src/systems/uiPrefs.js';
import {
  QUESTLINES_PREF, QL_STAMP, questlinesOn, startStamp, isStamped, freshState, readState, writeState, holds, readObjectives,
  observe, outcomeNow, fallbackOutcome, tierOf, rankTier, reputationTier, levelTier, symName,
} from '../../../src/systems/questlines/qlLaw.js';
import { receivedState, mergeSharedState } from '../../../src/systems/questlines/qlState.js';
import { sheetFor } from '../../../src/systems/questlines/qlSheets.js';
import { FEATURES } from '../../../src/systems/features.js';
import { FEATURE_PREF_ONLINE } from '../../../src/systems/features.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const VENDOR = join(ROOT, 'vendor', 'dfu-quests');
const read = (p) => readFileSync(p, 'utf8').replace(/^﻿/, '');
const questFile = new Map(readdirSync(join(VENDOR, 'Quests')).map((f) => [f.replace(/\.txt$/i, '').toUpperCase(), f]));
const questLines = (name) => { const f = questFile.get(String(name).toUpperCase()); return f ? read(join(VENDOR, 'Quests', f)).split(/\r?\n/) : null; };
{
  const sources = {};
  for (const f of readdirSync(join(VENDOR, 'Tables'))) if (f.endsWith('.txt')) sources[f.replace('.txt', '')] = read(join(VENDOR, 'Tables', f));
  loadQuestTables(sources);
}

/** A bridge over the real pack, a player who fights with a long blade. */
function makeBridge(over = {}) {
  const skills = new Array(35).fill(10);
  skills[29] = 60;   // LongBlade
  skills[31] = 40;   // Axe
  return createQuestBridge({
    data: {
      readListTable: (name) => { try { return read(join(VENDOR, 'Tables', `QuestList-${name}.txt`)); } catch { return null; } },
      getQuestSourceLines: (name) => questLines(name),
    },
    classicSeconds: () => 1000,
    playerEntity: { name: 'Hero', level: 8, gender: 'male', career: { weaponArmorShieldsBitfield: 0, forbiddenMaterialsFlags: 0 }, skills },
    getReputation: () => 0,
    carriesQuestItem: () => false,
    ...over,
  });
}

// ---- the switch ----

test('QL1 the switch: a Features row, on by default, forced on online (the owner: locked), read when a quest starts', () => {
  const row = FEATURES.find((f) => f.id === 'questlines');
  assert.ok(row, 'the row stands');
  assert.equal(row.control.key, QUESTLINES_PREF);
  assert.equal(row.control.initial, true, 'on by default offline (the owner\'s answer)');
  assert.equal(row.control.online, true, 'forced on online - never "player"');
  assert.equal(FEATURE_PREF_ONLINE[QUESTLINES_PREF], true, 'the lane learns it from the row');
  setPref(QUESTLINES_PREF, false);
  assert.equal(questlinesOn(), false);
  assert.equal(startStamp(), null, 'off: DFU\'s quest');
  setPref(QUESTLINES_PREF, true);
  assert.equal(questlinesOn(), true);
  assert.deepEqual(startStamp(), freshState(), 'on: a fresh state');
  assert.equal(startStamp(false), null);
});

// ---- the saved state ----

test('QL1 the state: written whole, read back field by field, and anything else read as DFU\'s quest', () => {
  const st = { ...freshState(), tier: 3, done: ['a', 'b'], failed: ['c'], choices: { fate: 'spare' }, outcome: 'mercy', paid: true, moved: false, acts: { 'fish-caught': 2 } };
  assert.deepEqual(readState(writeState(st)), st);
  assert.notEqual(writeState(st), st, 'a copy, never the live state');
  assert.equal(readState(null), null);
  assert.equal(readState({ ...st, stamp: QL_STAMP + 1 }), null, 'a later law\'s stamp is not misread');
  assert.equal(readState({ stamp: QL_STAMP, tier: 9 }).tier, 4, 'tier clamped');
  assert.deepEqual(readState({ stamp: QL_STAMP, done: ['x', 3, 'x', ''], choices: { a: 1, b: 'y' }, acts: { k: -1, j: 2 } }),
    { ...freshState(), done: ['x'], choices: { b: 'y' }, acts: { j: 2 } }, 'each field of its own kind - nothing throws');
});

test('QL1 a shared copy (decision 7): the party\'s progress travels, the holder\'s reward never does; a resync is monotonic', () => {
  const sender = { ...freshState(), done: ['a'], choices: { fate: 'spare' }, outcome: null, paid: true, moved: true, offer: { pieces: [{}] }, acts: { k: 1 } };
  const got = receivedState(writeState(sender));
  assert.deepEqual(got.done, ['a']);
  assert.deepEqual(got.choices, { fate: 'spare' });
  assert.equal(got.paid, false, 'a copy arrives unpaid');
  assert.equal(got.moved, false);
  assert.equal(got.offer, null);
  assert.deepEqual(got.acts, {}, 'an act is this world\'s');
  assert.equal(receivedState(null), null, 'DFU\'s quest arrives as DFU\'s');
  const local = { ...freshState(), done: ['b'], failed: ['a'], choices: { fate: 'kill' }, paid: true, acts: { j: 3 } };
  const merged = mergeSharedState(local, writeState({ ...sender, outcome: 'mercy' }));
  assert.deepEqual(merged.done.sort(), ['a', 'b']);
  assert.deepEqual(merged.failed, [], 'done beats failed');
  assert.deepEqual(merged.choices, { fate: 'kill' }, 'this copy\'s choice stands');
  assert.equal(merged.outcome, 'mercy', 'an outcome either copy reached stands');
  assert.equal(merged.paid, true, 'the holder\'s own pay');
  assert.deepEqual(merged.acts, { j: 3 });
  assert.equal(mergeSharedState(null, writeState(sender)), null, 'a copy that was DFU\'s stays DFU\'s');
});

// ---- the bindings, over a quest-shaped fixture ----

function fixture() {
  const task = (on) => ({ getTriggerValue: () => on });
  const quest = {
    questComplete: false, questSuccess: false,
    tasks: new Map([['S.02', task(true)], ['mondead', task(false)]]),
    resources: new Map([
      ['letter', { isItem: true }], ['ticks', { isClock: true, clockEnabled: true, clockFinished: false }],
      ['done', { isClock: true, clockEnabled: false, clockFinished: true }], ['bear', { isFoe: true, killCount: 2, spawnCount: 2 }],
      ['rat', { isFoe: true, killCount: 1, spawnCount: 3 }],
    ]),
    activeLogMessages: new Map([[0, { stepID: 0, messageID: 1010 }], [5, { stepID: 1, messageID: 1011 }]]),
    hooks: { globalVars: new Map([[7, true]]) },
    ql: { ...freshState(), acts: { 'fish-caught': 2 }, choices: { fate: 'spare' } },
  };
  return quest;
}

test('QL1 the bindings: each reads the machine\'s own state - tasks, items, clocks, steps, globals, foes - and nothing else', () => {
  const q = fixture();
  const p = { carries: (r) => r === q.resources.get('letter') };
  const y = (b) => holds(q, b, p);
  assert.equal(y({ started: true }), true);
  assert.equal(y({ ended: true }), false);
  assert.equal(y({ task: '_S.02_' }), true, 'the script\'s spelling');
  assert.equal(y({ task: 'S.02' }), true, 'the inner name');
  assert.equal(y({ task: '_mondead_' }), false);
  assert.equal(y({ task: '_nosuch_' }), false);
  assert.equal(y({ item: '_letter_' }), true);
  assert.equal(holds(q, { item: '_letter_' }), false, 'no probe: never carried');
  assert.equal(y({ item: '_ticks_' }), false, 'a clock is no item');
  assert.equal(y({ clock: '_ticks_' }), true);
  assert.equal(y({ clock: '_done_' }), false);
  assert.equal(y({ clockDone: '_done_' }), true);
  assert.equal(y({ step: 1 }), true, 'a step by its id, not its key');
  assert.equal(y({ step: 5 }), false);
  assert.equal(y({ global: 7 }), true);
  assert.equal(y({ global: 8 }), false);
  assert.equal(y({ foeDead: '_bear_' }), true);
  assert.equal(y({ foeDead: '_rat_' }), false, 'every spawn');
  assert.equal(y({ act: 'fish-caught', n: 2 }), true);
  assert.equal(y({ act: 'fish-caught', n: 3 }), false);
  assert.equal(y({ choice: { branch: 'fate', is: 'spare' } }), true);
  assert.equal(y({ choice: { branch: 'fate', is: 'kill' } }), false);
  assert.equal(y({ all: [{ task: 'S.02' }, { global: 7 }] }), true);
  assert.equal(y({ all: [{ task: 'S.02' }, { global: 8 }] }), false);
  assert.equal(y({ all: [] }), false, 'an empty all holds nothing');
  assert.equal(y({ any: [{ global: 8 }, { step: 0 }] }), true);
  assert.equal(y({ not: { ended: true } }), true);
  assert.equal(y({ nosuch: true }), false, 'an unknown kind never opens an objective');
  assert.equal(y(null), false);
  assert.equal(symName('_S.02_'), 'S.02');
});

test('QL1 the latch: done stays done when the script clears its task, a branch\'s first choice stands, the outcome settles once', () => {
  const on = new Map([['kill', false], ['report', false], ['spare', false], ['slay', false]]);
  const task = (k) => ({ getTriggerValue: () => on.get(k) });
  const q = { questComplete: false, questSuccess: false, tasks: new Map([...on.keys()].map((k) => [k, task(k)])), resources: new Map(), activeLogMessages: new Map(), ql: freshState() };
  const sheet = {
    objectives: [
      { id: 'kill', text: 'k', done: { task: 'kill' } },
      { id: 'report', text: 'r', open: { task: 'kill' }, done: { task: 'report' } },
    ],
    branches: [{ id: 'fate', text: 'f', choices: [{ id: 'spare', text: 's', sets: 'spare' }, { id: 'slay', text: 'x', sets: 'slay' }] }],
    outcomes: [{ id: 'mercy', text: 'm', on: { choice: { branch: 'fate', is: 'spare' } }, pay: 'lesser' }, { id: 'done', text: 'd', on: { task: 'report' }, pay: 'standard' }, { id: 'failed', text: 'f', on: { ended: true }, pay: 'none', failure: true }],
  };
  assert.deepEqual(readObjectives(q, sheet).map((o) => o.state), ['open', 'hidden']);
  on.set('kill', true);
  assert.deepEqual(observe(q, sheet).done, ['kill']);
  assert.deepEqual(readObjectives(q, sheet).map((o) => o.state), ['done', 'open']);
  on.set('kill', false);   // the script clears it again
  assert.deepEqual(readObjectives(q, sheet).map((o) => o.state), ['done', 'open'], 'latched');
  on.set('slay', true); on.set('spare', true);
  assert.deepEqual(observe(q, sheet).chose, [{ branch: 'fate', choice: 'spare' }], 'the first choice in the branch\'s order');
  on.set('spare', false);
  observe(q, sheet);
  assert.equal(q.ql.choices.fate, 'spare', 'a choice is never taken back');
  assert.equal(observe(q, sheet).outcome, null, 'no outcome until it is settled');
  assert.equal(observe(q, sheet, {}, { settle: true }).outcome, 'mercy');
  on.set('report', true);
  assert.equal(observe(q, sheet, {}, { settle: true }).outcome, null, 'settled once');
  assert.equal(q.ql.outcome, 'mercy');
  // an unstamped quest is read, never written
  const plain = { ...q, ql: null };
  assert.deepEqual(observe(plain, sheet, {}, { settle: true }), { done: [], failed: [], chose: [], outcome: null });
  // the fallback: a quest that ended with no outcome holding
  const ended = { questComplete: true, questSuccess: false, tasks: new Map(), resources: new Map(), activeLogMessages: new Map(), ql: freshState() };
  assert.equal(outcomeNow(ended, { outcomes: [{ id: 'x', on: { task: 'none' } }] }), null);
  assert.equal(fallbackOutcome(ended, sheet).id, 'failed');
  assert.equal(fallbackOutcome({ ...ended, questSuccess: true }, sheet).id, 'done', 'success: the outcome named done first');
  const unnamed = { outcomes: sheet.outcomes.filter((o) => o.id !== 'done' && o.id !== 'failed').concat([{ id: 'lost', on: { ended: true }, failure: true }]) };
  assert.equal(fallbackOutcome({ ...ended, questSuccess: true }, unnamed).id, 'mercy', '...else the first that is no failure');
  assert.equal(fallbackOutcome(ended, unnamed).id, 'lost', '...and a failure the first failure');
});

test('QL1 the tier (section 5.1): a guild\'s rank, a reputation\'s band, a social quest\'s level, a sheet\'s own word first', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 9].map(rankTier), [1, 1, 2, 2, 3, 3, 4, 4]);
  assert.deepEqual([10, 19, 20, 39, 40, 59, 60].map(reputationTier), [1, 1, 2, 2, 3, 3, 4]);
  assert.deepEqual([1, 6, 7, 13, 14, 20, 21].map(levelTier), [1, 1, 2, 2, 3, 3, 4]);
  assert.equal(tierOf({ minReq: 5, level: 30 }), 3, 'a guild quest: its rank, whatever the level');
  assert.equal(tierOf({ minReq: 1, level: 30, social: true }), 4, 'a social quest: the level');
  assert.equal(tierOf({ minReq: 45, level: 1 }), 3, 'a reputation');
  assert.equal(tierOf({ minReq: null, level: 15 }), 3, 'no row: the level');
  assert.equal(tierOf({ minReq: 0, sheetTier: 4 }), 4, 'a sheet\'s own');
});

// ---- the machine: the stamp at the one start door ----

test('QL1 the stamp: the machine asks at its one start door and keeps the answer for life, through a save and a restore', () => {
  let answer = null;
  const m = new QuestMachine({ nowSeconds: () => 0, getQuestSourceLines: questLines, questlinesStamp: () => answer });
  const plain = m.startQuestByName('M0B00Y06');
  assert.equal(plain.ql, null, 'off: DFU\'s quest');
  answer = { ...freshState(), tier: 2 };
  const stamped = m.startQuestByName('M0C00Y11');
  assert.deepEqual(stamped.ql, { ...freshState(), tier: 2 });
  answer = null;
  const data = m.getSaveData();
  const m2 = new QuestMachine({ nowSeconds: () => 0, getQuestSourceLines: questLines, questlinesStamp: () => freshState() });
  m2.restoreSaveData(data);
  assert.equal(m2.quests.get(plain.uid).ql, null, 'a load never stamps a quest that began without one');
  assert.deepEqual(m2.quests.get(stamped.uid).ql, { ...freshState(), tier: 2 }, 'and keeps the one it began with');
});

// ---- the bridge: M0B00Y06 from its start to its reward ----

test('QL1/QL3 the bridge makes the layer: M0B00Y06 stamped at its start, its objectives read off its own tasks, its gold scaled and its choice of gear set waiting at GivePc', () => {
  setPref(QUESTLINES_PREF, true);
  const offers = [], rewards = [];
  const bridge = makeBridge({ onQuestlineOffer: (o) => offers.push(o), offerReward: (_q, item) => rewards.push(item) });
  const quest = bridge.machine.startQuestByName('M0B00Y06', 0);
  assert.ok(isStamped(quest), 'stamped at its start');
  assert.equal(quest.ql.tier, 1, 'the Fighters Guild\'s rank-0 quest: tier 1');
  const sheet = sheetFor('M0B00Y06');
  assert.ok(sheet);
  const row = () => bridge.questlines.rowOf(quest);
  assert.deepEqual(row().objectives.map((o) => [o.id, o.state]), [['slay', 'open']], 'the report is hidden until the beast is dead');
  quest.getTask({ name: 'mondead' }).start();
  bridge.questlines.look();
  assert.deepEqual(row().objectives.map((o) => [o.id, o.state]), [['slay', 'done'], ['report', 'open']]);
  // the questor clicked: the script's own reward task runs GivePc
  const gold = quest.getItem({ name: 'gold' }).daggerfallUnityItem;
  const before = gold.stackCount;
  quest.getTask({ name: 'qgclicked' }).start();
  bridge.machine.tick();   // the reward task: GivePc, then `end quest`
  assert.equal(quest.ql.paid, true, 'GivePc marks it paid');
  assert.equal(gold.stackCount, before, 'a standard outcome pays the script\'s own gold');
  assert.equal(rewards.length, 1, 'the script\'s gold reward, through RW1\'s door');
  assert.equal(quest.ql.outcome, 'done', 'settled at its own `end quest` - not at the reward: a quest may pay before it ends (M0B00Y16)');
  assert.equal(offers.length, 1, 'one choice of gear, at the end');
  // filed with the notebook's entry: how it ended
  const filed = bridge.notebook.getFinishedQuests().at(-1).map((tok) => tok.text).join(' ');
  assert.match(filed, /Outcome: The beast is dead and the citizen's house is safe\./);
  for (let i = 0; i < 5; i++) bridge.machine.tick();
  assert.equal(quest.questTombstoned, true);
  assert.equal(offers.length, 1, 'once');
  const offer = offers[0];
  assert.equal(offer.questName, 'M0B00Y06');
  assert.equal(offer.pieces.length, 3);
  assert.deepEqual(offer.pieces.map((p) => p.kind), ['weapon', 'armor', 'jewel']);
  for (const p of offer.pieces) {
    assert.equal(p.item.isIdentified, true);
    assert.ok(['magic', 'rare'].includes(p.tier), `tier 1 pays Magic: ${p.tier}`);
  }
  assert.equal(bridge.questlines.offers().length, 1, 'waiting to be chosen');
  // the snapshot carries it; a restore brings it back
  const snap = bridge.snapshot();
  assert.equal(snap.questlines.offers.length, 1);
  const b2 = makeBridge();
  b2.restore(snap);
  assert.equal(b2.questlines.offers().length, 1, 'the choice outlives the session');
  const taken = b2.questlines.take(b2.questlines.offers()[0].id, 1);
  assert.equal(taken?.group, 'Armor');
  assert.equal(b2.questlines.offers().length, 0, 'taken once');
  assert.equal(b2.questlines.take(offer.id, 0), null);
});

test('QL1 the bridge leaves a quest begun with the switch off as DFU\'s: no objectives, no reward added', () => {
  setPref(QUESTLINES_PREF, false);
  const offers = [];
  const bridge = makeBridge({ onQuestlineOffer: (o) => offers.push(o) });
  const quest = bridge.machine.startQuestByName('M0B00Y06', 0);
  assert.equal(quest.ql, null);
  assert.equal(bridge.questlines.rowOf(quest), null);
  setPref(QUESTLINES_PREF, true);   // turned on mid-quest: the quest keeps the rules it began with
  quest.getTask({ name: 'mondead' }).start();
  quest.getTask({ name: 'qgclicked' }).start();
  for (let i = 0; i < 6; i++) bridge.machine.tick();
  assert.equal(offers.length, 0);
  assert.equal(quest.ql, null);
  const log = bridge.questLog();
  assert.ok(log.ended.every((r) => r.ql === null) && log.active.every((r) => r.ql === null));
});
