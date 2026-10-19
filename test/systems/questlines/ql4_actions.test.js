// QL4 (bible/06-Systems/Questlines-Arc.md section 2.3): THE QUESTLINES' ACTIONS - `ask` (a choice in the player's own
// words), `outcome` (where a script decides how it ended) and `ql act` (a trigger on what the player did, QL11). They
// are registered by the quest bridge after DFU's 82: a first-match scan, so the pins here are that no DFU template
// claims a questlines line, that the questlines' templates claim no line of the shipped corpus, and that each acts as
// it says through a real machine - saved and restored mid-flight.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadQuestTables } from '../../../src/systems/quest/tables.js';
import { QuestMachine } from '../../../src/systems/quest/machine.js';
import { createQuestBridge } from '../../../src/scenes/quest/questBridge.js';
import { questlineActionTemplates, QlAsk, QlOutcome, QlAct, QlPaid, QlName } from '../../../src/systems/questlines/qlActions.js';
import { freshState } from '../../../src/systems/questlines/qlState.js';
import { setPref } from '../../../src/systems/uiPrefs.js';
import { QUESTLINES_PREF } from '../../../src/systems/questlines/qlLaw.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const VENDOR = join(ROOT, 'vendor', 'dfu-quests');
const read = (p) => readFileSync(p, 'utf8').replace(/^﻿/, '');
{
  const sources = {};
  for (const f of readdirSync(join(VENDOR, 'Tables'))) if (f.endsWith('.txt')) sources[f.replace('.txt', '')] = read(join(VENDOR, 'Tables', f));
  loadQuestTables(sources);
}

const LINES = {
  ask: '\task 1050 choices 1051 _guild_ 1052 _fence_',
  ask4: 'ask 1050 choices 1051 _a_ 1052 _b_ 1053 _c_ 1054 _d_',
  outcome: '\toutcome _loyal_',
  act: '\tql act fish-caught 2',
  paid: '\tql paid',
  name: '\tql name _giver_ Ysolde_Marnhel',
};

test('QL4 the scan: each questlines line is claimed by its own template, and no DFU template claims one', () => {
  const dfuOnly = new QuestMachine({ nowSeconds: () => 0 });
  for (const [k, line] of Object.entries(LINES)) assert.equal(dfuOnly.getActionTemplate(line), null, `${k}: no DFU template claims "${line.trim()}"`);
  const m = new QuestMachine({ nowSeconds: () => 0 });
  for (const t of questlineActionTemplates()) m.registerAction(t);
  assert.ok(m.getActionTemplate(LINES.ask) instanceof QlAsk);
  assert.ok(m.getActionTemplate(LINES.ask4) instanceof QlAsk);
  assert.ok(m.getActionTemplate(LINES.outcome) instanceof QlOutcome);
  assert.ok(m.getActionTemplate(LINES.act) instanceof QlAct);
  assert.ok(m.getActionTemplate(LINES.paid) instanceof QlPaid);
  assert.ok(m.getActionTemplate(LINES.name) instanceof QlName);
  // the forms that are not a line of theirs
  assert.equal(m.getActionTemplate('ask 1050 choices 1051 _a_'), null, 'one choice is no choice');
  assert.equal(m.getActionTemplate('ask 1050 choices 1051 _a_ 1052 _b_ 1053 _c_ 1054 _d_ 1055 _e_'), null, 'five is too many');
  assert.equal(m.getActionTemplate('ql act Fish 1'), null, 'a kind is lower-case');
});

test('QL4 the corpus: registered after DFU\'s 82, the questlines\' templates claim no line of any shipped quest', () => {
  const m = new QuestMachine({ nowSeconds: () => 0 });
  const ours = questlineActionTemplates();
  for (const t of ours) m.registerAction(t);
  const claimed = [];
  for (const f of readdirSync(join(VENDOR, 'Quests'))) {
    let inQbn = false;
    for (const line of read(join(VENDOR, 'Quests', f)).split(/\r?\n/)) {
      if (/^\s*QBN:/i.test(line)) { inQbn = true; continue; }
      if (!inQbn || !line.trim() || /^\s*-/.test(line)) continue;
      const t = m.getActionTemplate(line);
      if (t && ours.includes(t)) claimed.push(`${f}: ${line.trim()}`);
    }
  }
  assert.deepEqual(claimed, []);
});

const ASK_QUEST = [
  'Quest: __QLASK',
  'DisplayName: A Choice',
  'QRC:',
  'QuestorOffer:  [1000]',
  '<ce> Will you?',
  '',
  'RefuseQuest:  [1001]',
  '<ce> No.',
  '',
  'AcceptQuest:  [1002]',
  '<ce> Yes.',
  '',
  'Message:  1050',
  '<ce> Who gets the ring?',
  '',
  'Message:  1051',
  'The Guild',
  '',
  'Message:  1052',
  'The fence',
  '',
  'QBN:',
  '',
  '\task 1050 choices 1051 _guild_ 1052 _fence_',
  '',
  'variable _guild_',
  'variable _fence_',
  '',
  '_g_ task:',
  '\twhen _guild_',
  '\toutcome _loyal_',
  '',
  '_f_ task:',
  '\twhen _fence_',
  '\toutcome _sold_',
  '',
  '_hunt_ task:',
  '\tql act fish-caught 2',
];

function machineWith(showChoice) {
  const m = new QuestMachine({ nowSeconds: () => 0, getQuestSourceLines: (n) => (n === '__QLASK' ? ASK_QUEST : null), questlinesStamp: () => freshState(), showChoice });
  for (const t of questlineActionTemplates()) m.registerAction(t);
  return m;
}

test('QL4 ask and outcome, run: the question and its choices\' own words go to the host, the choice taken sets its task, and the script\'s outcome is written - once', () => {
  let asked = null;
  const m = machineWith((q, message, choices, respond) => { asked = { q, message, choices, respond }; });
  const quest = m.startQuestByName('__QLASK');
  assert.equal(quest.tasks.get('g').actions.length, 2, 'every line claimed');
  m.tick();
  assert.ok(asked, 'asked');
  assert.equal(asked.message.id, 1050);
  assert.deepEqual(asked.choices.map((c) => c.id), [1051, 1052]);
  asked.respond(1);   // the fence
  m.tick(); m.tick();
  assert.equal(quest.getTask({ name: 'fence' }).getTriggerValue(), true);
  assert.equal(quest.getTask({ name: 'guild' }).getTriggerValue(), false);
  assert.equal(quest.ql.outcome, 'sold');
  quest.getTask({ name: 'guild' }).start();
  m.tick(); m.tick();
  assert.equal(quest.ql.outcome, 'sold', 'the first outcome stands');
  // asked once: the startup task does not ask again
  asked = null;
  m.tick();
  assert.equal(asked, null);
});

test('QL4 an unstamped quest: ask still asks (it is the script\'s question), outcome writes nothing, ql act never fires', () => {
  let asked = null;
  const m = new QuestMachine({ nowSeconds: () => 0, getQuestSourceLines: () => ASK_QUEST, questlinesStamp: () => null, showChoice: (q, msg, ch, respond) => { asked = respond; } });
  for (const t of questlineActionTemplates()) m.registerAction(t);
  const quest = m.startQuestByName('__QLASK');
  m.tick();
  asked(0);
  m.tick(); m.tick();
  assert.equal(quest.ql, null);
  assert.equal(quest.getTask({ name: 'guild' }).getTriggerValue(), true);
  assert.equal(quest.getTask({ name: 'hunt' }).getTriggerValue(), false);
});

test('QL4 a missing message asks nothing and says so; no host asks nothing', () => {
  const bad = ASK_QUEST.map((l) => (l === '\task 1050 choices 1051 _guild_ 1052 _fence_' ? '\task 1050 choices 1051 _guild_ 1099 _fence_' : l));
  let asked = 0;
  const warn = console.warn; const warned = [];
  console.warn = (s) => warned.push(String(s));
  try {
    const m = new QuestMachine({ nowSeconds: () => 0, getQuestSourceLines: () => bad, questlinesStamp: () => freshState(), showChoice: () => { asked++; } });
    for (const t of questlineActionTemplates()) m.registerAction(t);
    m.startQuestByName('__QLASK');
    m.tick();
  } finally { console.warn = warn; }
  assert.equal(asked, 0);
  assert.ok(warned.some((s) => s.includes('ask 1050 names a message')), warned.join('\n'));
  const m2 = new QuestMachine({ nowSeconds: () => 0, getQuestSourceLines: () => ASK_QUEST, questlinesStamp: () => freshState() });
  for (const t of questlineActionTemplates()) m2.registerAction(t);
  m2.startQuestByName('__QLASK');
  assert.doesNotThrow(() => m2.tick(), 'no host: the question idles, as a prompt does');
});

test('QL4 ql act: counts from the moment its task first asks, fires at its count, and its start survives a save', () => {
  const m = machineWith(() => {});
  const quest = m.startQuestByName('__QLASK');
  quest.ql.acts['fish-caught'] = 5;   // heard before the task asked: not counted
  m.tick();
  assert.equal(quest.getTask({ name: 'hunt' }).getTriggerValue(), false);
  quest.ql.acts['fish-caught'] = 6;
  m.tick();
  assert.equal(quest.getTask({ name: 'hunt' }).getTriggerValue(), false, 'one of two');
  // saved and restored mid-count
  const data = m.getSaveData();
  const m2 = machineWith(() => {});
  m2.restoreSaveData(data);
  const q2 = m2.quests.get(quest.uid);
  q2.ql.acts['fish-caught'] = 7;
  m2.tick();
  assert.equal(q2.getTask({ name: 'hunt' }).getTriggerValue(), true, 'two of two - counted from 5, not from the load');
});

test('QL4 the bridge registers them, every host\'s machine; and the layer\'s act reaches every running stamped quest', () => {
  setPref(QUESTLINES_PREF, true);
  const bridge = createQuestBridge({ data: { readListTable: () => null, getQuestSourceLines: (n) => (n === '__QLASK' ? ASK_QUEST : null) }, classicSeconds: () => 0, showChoice: () => {} });
  for (const k of Object.keys(LINES)) assert.ok(bridge.machine.getActionTemplate(LINES[k]), k);
  const q = bridge.machine.startQuestByName('__QLASK');
  assert.equal(bridge.questlines.act('fish-caught', 2), 1, 'one quest heard it');
  assert.equal(q.ql.acts['fish-caught'], 2);
  assert.equal(bridge.questlines.act('', 1), 0);
  assert.equal(bridge.questlines.act('fish-caught', 0), 0);
  q.shelvedAt = 5;
  assert.equal(bridge.questlines.act('fish-caught', 1), 0, 'a quest set aside hears nothing');
});

test('QL4 ask is complete only on its answer: a box closed unanswered asks again, and a save taken under the question asks again on its load', () => {
  const asks = [];
  const m = machineWith((q, message, choices, respond) => asks.push(respond));
  const quest = m.startQuestByName('__QLASK');
  m.tick();
  assert.equal(asks.length, 1);
  m.tick(); m.tick();
  assert.equal(asks.length, 1, 'not asked again while the question is up');
  asks[0](null);   // closed unanswered
  m.tick();
  assert.equal(asks.length, 2, 'asked again');
  const data = m.getSaveData();   // saved under the second question
  const m2 = machineWith((q, message, choices, respond) => asks.push(respond));
  m2.restoreSaveData(data);
  m2.tick();
  assert.equal(asks.length, 3, 'the load asks afresh');
  asks[2](0);
  m2.tick(); m2.tick();
  assert.equal(m2.quests.get(quest.uid).ql.outcome, 'loyal');
  m2.tick();
  assert.equal(asks.length, 3, 'answered: never asked again');
});
