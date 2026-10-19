// QL12-QL16 (bible/06-Systems/Questlines-Arc.md section 4): THE QUESTLINES. Each line's steps are the port's own scripts
// (systems/questlines/quests/<QUEST>.txt) on DFU's machine, so the pins hold each as the sheets' pins hold DFU's: it is
// in the pack, it parses with every line claimed by a template, its title is its step's, every message it names is
// written, every act it waits on is one the features say (qlActs.js). A step the service witnesses waits on the act its
// receipt is (net/questlineClaims.js); the Covens' Hoard's key is kept by the outcome the service reads. And the
// runner (qlLineRunner.js): a line opens at its gate, its steps start one after another, a failed step comes again, the
// service is asked at a witnessed step's start and end, and a load asks again what it never answered.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { QL_LINES, lineById, lineStepOf, lineOpens, opensWords } from '../../../src/systems/questlines/qlLines.js';
import { createLineRunner, STEP_GAP_S, RETRY_GAP_S, CLAIM_RETRY_MS } from '../../../src/systems/questlines/qlLineRunner.js';
import { QL_SERVICE_LINES, QL_WITNESS_KINDS, qlClaimOf, qlStepClaimed, QL_TITLES } from '../../../src/net/questlineClaims.js';
import { ACT_KINDS } from '../../../src/systems/questlines/qlActs.js';
import { sheetFor } from '../../../src/systems/questlines/qlSheets.js';
import { setPref } from '../../../src/systems/uiPrefs.js';
import { QUESTLINES_PREF } from '../../../src/systems/questlines/qlLaw.js';
import { QUEST_FILES, packMachine, parsedQuest } from '../../qlSources.mjs';

/** The act a witness's receipt is, and how many of it the step asks (the script's `ql act <kind> <n>`). */
const WITNESS_ACT = Object.freeze({
  rite: ['rite-broken', 1], breach: ['breach-closed', 1], redoubt: ['redoubt-taken', 1], redoubts3: ['redoubt-taken', 3],
  valkynaz: ['valkynaz-felled', 1], hour: ['hour-broken', 1], serpent: ['serpent-slain', 1],
});

const scriptText = (name) => readFileSync(QUEST_FILES.get(name.toUpperCase()).path, 'utf8');
const qbnOf = (text) => text.slice(Math.max(0, text.search(/^\s*QBN:/im)));

test('QL12 the lines: ids unique, every step its own quest, the service\'s lines the registry\'s with as many steps', () => {
  assert.equal(new Set(QL_LINES.map((l) => l.id)).size, QL_LINES.length);
  const quests = QL_LINES.flatMap((l) => l.steps.map((s) => s.quest));
  assert.equal(new Set(quests).size, quests.length, 'no quest is two steps');
  for (const q of quests) assert.match(q, /^QL[A-Z]{2}\d{2}$/, `${q}: the questlines' own names`);
  for (const [id, svc] of Object.entries(QL_SERVICE_LINES)) {
    const l = lineById(id);
    assert.ok(l, `${id}: the service pays a line the registry holds`);
    assert.equal(l.steps.length, svc.steps, `${id}: as many steps on both ends`);
    for (const k of Object.values(svc.witness)) assert.ok(QL_WITNESS_KINDS.includes(k), `${id}: ${k}`);
    assert.ok(l.opens.online, `${id}: a line the service pays opens only where it answers`);
  }
  assert.equal(new Set(QL_TITLES).size, QL_TITLES.length, 'a title a line');
  for (const l of QL_LINES) {
    assert.ok(l.title() && l.lead() && l.giver(), `${l.id}: its words`);
    for (let i = 0; i < l.steps.length; i++) assert.deepEqual(lineStepOf(l.steps[i].quest), { line: l, index: i });
  }
});

test('QL12 each step\'s script: in the pack, parsed with every line claimed, its title its step\'s, every message it names written', () => {
  const machine = packMachine();
  const problems = [];
  for (const l of QL_LINES) {
    for (const s of l.steps) {
      const f = QUEST_FILES.get(s.quest);
      if (!f || f.dir !== 'questlines') { problems.push(`${s.quest}: no script in systems/questlines/quests`); continue; }
      const p = parsedQuest(s.quest, machine);
      if (!p) { problems.push(`${s.quest}: does not parse`); continue; }
      if (p.quest.displayName !== s.title()) problems.push(`${s.quest}: DisplayName "${p.quest.displayName}" is not its step's "${s.title()}"`);
      for (const t of p.quest.tasks.values()) for (const line of t.pendingActionLines ?? []) problems.push(`${s.quest}: no template claims "${String(line).trim()}"`);
      const text = scriptText(s.quest);
      const written = new Set([...text.matchAll(/^\s*(?:Message:\s*(\d+)|[A-Za-z]+:\s*\[(\d+)\])\s*$/gm)].map((m) => Number(m[1] ?? m[2])));
      const qbn = qbnOf(text);
      const named = [
        ...[...qbn.matchAll(/\b(?:say|log|notify|used|anyInfo|rumors|ask|choices)\s+(\d{4})\b/g)].map((m) => Number(m[1])),
        ...[...qbn.matchAll(/\bchoices((?:\s+\d{4}\s+_[A-Za-z0-9.]+_)+)/g)].flatMap((m) => [...m[1].matchAll(/(\d{4})/g)].map((x) => Number(x[1]))),
      ];
      for (const id of new Set(named)) if (!written.has(id)) problems.push(`${s.quest}: names message ${id}, which it does not write`);
      if (!sheetFor(s.quest)) problems.push(`${s.quest}: no sheet`);
    }
  }
  assert.deepEqual(problems, []);
});

test('QL11/QL12 every act a line\'s script waits on is one the features say; a witnessed step waits on its receipt\'s act', () => {
  const problems = [];
  for (const l of QL_LINES) {
    l.steps.forEach((s, i) => {
      if (!QUEST_FILES.has(s.quest)) return;   // the script pin names it
      const qbn = qbnOf(scriptText(s.quest));
      const acts = [...qbn.matchAll(/^\s*ql act ([a-z0-9-]+) (\d+)\s*$/gm)].map((m) => [m[1], Number(m[2])]);
      for (const [kind] of acts) if (!Object.hasOwn(ACT_KINDS, kind)) problems.push(`${s.quest}: waits on "${kind}", which no feature says`);
      const w = QL_SERVICE_LINES[l.id]?.witness?.[i];
      if (w) {
        const [kind, n] = WITNESS_ACT[w];
        if (!acts.some(([k, c]) => k === kind && c >= n)) problems.push(`${s.quest}: witnessed by ${w}, so it waits on "ql act ${kind} ${n}"`);
      }
    });
  }
  assert.deepEqual(problems, []);
});

test('QL13 the Covens\' Hoard\'s key: kept by the outcome the service reads, and only behind the Burning Doors witnessed whole', () => {
  const svc = QL_SERVICE_LINES.covensHoard;
  const step = lineById('covensHoard').steps[svc.key.at];
  const sheet = sheetFor(step.quest);
  assert.ok(sheet, `${step.quest}: its sheet`);
  const ids = (sheet?.outcomes ?? []).filter((o) => !o.failure).map((o) => o.id);
  assert.ok(ids.includes(svc.key.choice), `the outcome "${svc.key.choice}" keeps the key`);
  assert.ok(ids.some((id) => id !== svc.key.choice), 'and another gives it up');
  assert.deepEqual(svc.after, ['burningDoors', 3], 'the breach closed, witnessed');
  assert.equal(QL_SERVICE_LINES.burningDoors.witness[3], 'breach');
});

test('QL12 the claim\'s shape: a line the service pays, a step inside it, a plain choice - refused, never repaired', () => {
  assert.deepEqual(qlClaimOf({ line: 'burningDoors', step: 3 }), { line: 'burningDoors', step: 3, choice: null });
  assert.deepEqual(qlClaimOf({ line: 'covensHoard', step: 2, choice: 'keep' }), { line: 'covensHoard', step: 2, choice: 'keep' });
  for (const bad of [null, [], {}, { line: 'introSea', step: 0 }, { line: 'burningDoors', step: 5 }, { line: 'burningDoors', step: -1 },
    { line: 'burningDoors', step: 1.5 }, { line: 'burningDoors', step: '1' }, { line: 'covensHoard', step: 2, choice: 'KEEP' }, { line: '__proto__', step: 0 }]) {
    assert.equal(qlClaimOf(bad), null, JSON.stringify(bad));
  }
  assert.equal(qlStepClaimed('burningDoors', 0), false, 'a letter is the client\'s');
  assert.equal(qlStepClaimed('burningDoors', 2), true);
  assert.equal(qlStepClaimed('covensHoard', 2), true, 'the key\'s and the title\'s');
  assert.equal(qlStepClaimed('introSea', 0), false, 'an introduction pays nothing of the service\'s');
});

test('QL12 a line opens at its gate, and says what it waits on', () => {
  const l = lineById('covensHoard');
  const probe = (o) => ({ level: () => 20, online: () => true, lineDone: () => false, ...o });
  assert.equal(lineOpens(l, probe()), false, 'the Burning Doors first');
  assert.equal(lineOpens(l, probe({ lineDone: (id) => id === 'burningDoors' })), true);
  assert.equal(lineOpens(l, probe({ lineDone: () => true, online: () => false })), false, 'online alone');
  assert.equal(opensWords(l, probe()), 'Opens after The Burning Doors.');
  assert.equal(opensWords(lineById('burningDoors'), probe({ level: () => 3, online: () => false })), 'Opens at level 10, online.');
  assert.equal(opensWords(lineById('introCrafts'), probe({ level: () => 9 })), null);
});

/** A machine the runner can drive: quests by name, scheduled for the next tick as the real one does. */
function fakeMachine() {
  let uid = 1;
  const m = {
    quests: new Map(), questsToInvoke: [], scheduled: [],
    scheduleQuestByName(name) { const q = { uid: uid++, questName: name, questComplete: false, questTombstoned: false }; m.questsToInvoke.push(q); m.scheduled.push(name); return q; },
    tick() { for (const q of m.questsToInvoke.splice(0)) m.quests.set(q.uid, q); },
    end(name, success = true) { for (const q of m.quests.values()) if (q.questName === name && !q.questComplete) { q.questComplete = true; q.questSuccess = success; return q; } return null; },
  };
  return m;
}

function runnerWith({ level = 30, online = true, service = null } = {}) {
  setPref(QUESTLINES_PREF, true);
  const clock = { s: 1000, ms: 0 };
  const machine = fakeMachine();
  const honours = [];
  const runner = createLineRunner({
    machine, service, nowMs: () => clock.ms,
    ctx: { level: () => level, online: () => online, nowSeconds: () => clock.s, onHonour: (h) => honours.push(h), outcomeText: (q) => `${q.questName} ended` },
  });
  const step = () => { runner.look(); machine.tick(); };
  return { runner, machine, clock, honours, step };
}

test('QL12 the runner: a line opens, its first step starts once, the next an hour after it ends, the line done at its last', () => {
  const { runner, machine, clock, step } = runnerWith({ level: 2, online: false });
  step(); step();
  assert.deepEqual(machine.scheduled.filter((n) => n.startsWith('QLIT')), ['QLIT01'], 'started once, not every tick');
  assert.ok(!machine.scheduled.includes('QLBD01'), 'the Burning Doors: level 10, online');
  assert.ok(!machine.scheduled.includes('QLIP01'), 'the crafts: online - the Professions answer there');
  assert.ok(!machine.scheduled.includes('QLIS01'), 'the sea: level 5');
  const q = machine.end('QLIT01');
  assert.deepEqual(runner.ended(q, { id: 'done', failure: false }), { line: 'introTables', step: 0, moved: true, done: false });
  step();
  assert.ok(!machine.scheduled.includes('QLIT02'), 'not in the same breath');
  clock.s += STEP_GAP_S;
  step();
  assert.ok(machine.scheduled.includes('QLIT02'));
  const last = runner.ended(machine.end('QLIT02'), { id: 'done', failure: false });
  assert.equal(last.done, true);
  const row = runner.rows().find((r) => r.id === 'introTables');
  assert.equal(row.state, 'done');
  assert.deepEqual(row.steps.map((s) => s.state), ['done', 'done']);
  assert.equal(row.outcome, 'QLIT02 ended', 'the last step\'s outcome is the line\'s');
});

test('QL12 the runner: a step that ends badly is offered again a day later; a quest no line holds moves nothing', () => {
  const { runner, machine, clock, step } = runnerWith({ level: 2, online: false });
  step();
  const r = runner.ended(machine.end('QLIT01', false), { id: 'failed', failure: true });
  assert.equal(r.moved, false);
  clock.s += RETRY_GAP_S - 1; step();
  assert.equal(machine.scheduled.filter((n) => n === 'QLIT01').length, 1);
  clock.s += 1; step();
  assert.equal(machine.scheduled.filter((n) => n === 'QLIT01').length, 2, 'again');
  assert.equal(runner.ended({ questName: 'M0B00Y06', questSuccess: true }, null), null);
  assert.equal(runner.lineState('introTables').step, 0);
});

test('QL12 the runner, the switch off: no line opens (its quests would not be stamped)', () => {
  const { machine, step } = runnerWith({ level: 30 });
  setPref(QUESTLINES_PREF, false);
  step();
  assert.deepEqual(machine.scheduled, []);
  setPref(QUESTLINES_PREF, true);
});

test('QL12 the service: a witnessed step claimed at its start and its end; a title told once; an unanswered claim asked again, and again after a load', async () => {
  // the service as server-account/src/questlines.js answers: the first claim of a step opens it, a later one looks for
  // its receipt, and the title is paid once
  let witnessNow = false;
  const serviceFor = (calls) => {
    const opened = new Set();
    let titled = false;
    return {
      account: () => 'acct',
      claim: async (body) => {
        calls.push(body);
        if (!opened.has(body.step)) { opened.add(body.step); return { ok: true, data: { opened: true } }; }
        if (!witnessNow) return { ok: true, data: { witnessed: false } };
        const title = body.step === 3 && !titled ? 'doorwarden' : undefined;
        if (title) titled = true;
        return { ok: true, data: { witnessed: true, ...(title ? { title } : {}) } };
      },
    };
  };
  const calls = [];
  const { runner, machine, clock, honours, step } = runnerWith({ level: 30, service: serviceFor(calls) });
  const settle = () => new Promise((r) => setImmediate(r));
  const walk = async (to) => {
    for (let i = 0; i < to; i++) {
      step(); await settle();
      runner.ended(machine.end(`QLBD0${i + 1}`), { id: 'done', failure: false });
      clock.s += STEP_GAP_S;
    }
    step(); await settle();
  };
  await walk(2);   // the letter and the coven are the client's own; the rite's step opens
  assert.deepEqual(calls.filter((c) => c.line === 'burningDoors'), [{ line: 'burningDoors', step: 2 }], 'opened at its start, alone');
  runner.ended(machine.end('QLBD03'), { id: 'done', failure: false });
  step(); await settle();
  assert.equal(calls.filter((c) => c.line === 'burningDoors' && c.step === 2).length, 2, 'claimed at its end');
  assert.equal(runner.lineState('burningDoors').claims[2], 'opened', 'not witnessed yet: asked again later');
  witnessNow = true;
  step(); await settle();
  assert.equal(calls.filter((c) => c.line === 'burningDoors' && c.step === 2).length, 2, 'not before its minute');
  const save = runner.snapshot();
  // a load: the unanswered end asked again at once (another page - the service has it opened already)
  const calls2 = [];
  const svc2 = serviceFor(calls2);
  await svc2.claim({ line: 'burningDoors', step: 2 });
  const again = runnerWith({ level: 30, service: svc2 });
  again.runner.restore(save);
  again.step(); await settle();
  assert.equal(calls2.filter((c) => c.line === 'burningDoors' && c.step === 2).length, 2, 'asked at the load');
  assert.equal(again.runner.lineState('burningDoors').claims[2], 'witnessed');
  // and the first page's own retry, its minute come
  clock.ms += CLAIM_RETRY_MS;
  step(); await settle();
  assert.equal(runner.lineState('burningDoors').claims[2], 'witnessed');
  // the breach: its end pays the title, told once
  clock.s += STEP_GAP_S; step(); await settle();
  runner.ended(machine.end('QLBD04'), { id: 'done', failure: false });
  step(); await settle();
  assert.deepEqual(honours, [{ line: 'burningDoors', title: 'doorwarden', key: false }]);
});

test('QL12 the runner offline: an endgame line begun waits where it stood, and says why', () => {
  let online = true;
  setPref(QUESTLINES_PREF, true);
  const machine = fakeMachine();
  const clock = { s: 0 };
  const runner = createLineRunner({ machine, service: { account: () => 'a', claim: async () => ({ ok: true, data: { opened: true } }) }, ctx: { level: () => 30, online: () => online, nowSeconds: () => clock.s } });
  runner.look(); machine.tick();
  runner.ended(machine.end('QLBD01'), { id: 'met', failure: false });
  clock.s += STEP_GAP_S;
  online = false;
  runner.look(); machine.tick();
  assert.ok(!machine.scheduled.includes('QLBD02'));
  const row = runner.rows().find((r) => r.id === 'burningDoors');
  assert.equal(row.state, 'waiting');
  assert.equal(row.opens, 'Opens online.');
  assert.equal(row.honour, 'doorwarden');
  online = true;
  runner.look(); machine.tick();
  assert.ok(machine.scheduled.includes('QLBD02'));
});

test('QL1/QL12 an outcome settles at the end its script names: a failure clock\'s end is the sheet\'s `failed`, an act\'s is its own, and the step moves - or comes again', async () => {
  const { createQuestBridge } = await import('../../../src/scenes/quest/questBridge.js');
  const { questSource } = await import('../../qlSources.mjs');
  const { questlinesOn } = await import('../../../src/systems/questlines/qlLaw.js');
  setPref(QUESTLINES_PREF, true);
  const run = (finish) => {
    const offers = [];
    const bridge = createQuestBridge({
      data: { readListTable: () => null, getQuestSourceLines: (n) => questSource(n, questlinesOn()) },
      classicSeconds: () => 0, questlineService: null,
      playerEntity: { name: 'Hero', level: 8, gender: 'male', career: { weaponArmorShieldsBitfield: 0, forbiddenMaterialsFlags: 0 }, skills: new Array(35).fill(30) },
      onQuestlineOffer: (o) => offers.push(o), offerReward: () => {},
    });
    const q = bridge.machine.startQuestByName('QLIA01');
    for (let i = 0; i < 3; i++) bridge.machine.tick();
    finish(bridge, q);
    for (let i = 0; i < 6; i++) bridge.machine.tick();
    return { q, offers };
  };
  const lost = run((b, q) => q.getTask({ name: 'wait' }).start());
  assert.ok(lost.q.questComplete);
  assert.equal(lost.q.ql.outcome, 'failed', 'the catch-all failure row, at the end its clock named');
  assert.equal(lost.offers.length, 0, 'a failure pays no gear');
  const won = run((b) => b.questlines.act('arena-won', 1));
  assert.equal(won.q.ql.outcome, 'won');
  assert.equal(won.offers.length, 1, 'the choice of three');
});
