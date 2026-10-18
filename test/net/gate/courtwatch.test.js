// COURT-WATCH (2026-10-18; bible/11-Multiplayer/World-Bosses.md section 24, Scale-Arc.md THE PLAN PAST 1,000 decision 5 -
// the owner: "Make the best call for future proofing"): A FULL COURT KEEPS ITS WATCHERS. A court's fight seats
// GATE_FIGHTERS_MAX accounts (net/gate/gateBrain.js), and the next one asking was told `the court is full` and cast out
// before the gate. It stays now, as the court's watcher - the fight heard and drawn (every beat is the room's), no blow of
// its own sent and none of his landed on it - and asks for a seat again every COURT_WATCH_ASK_MS; the relay's answer to an
// `in` that seats it says so (`me`), and it fights from then on.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fakeRoom } from '../../fakeRoom.mjs';
import { GATE_BRAIN_V, validGateOut } from '../../../src/net/wire.js';
import { gateTimes, gateRoomKey } from '../../../src/net/gate/gateLaw.js';
import { COURT_CENTRE, GATE_FIGHTERS_MAX, HIT_KINDS, ATTACKS, HOST } from '../../../src/net/gate/gateBrain.js';
import { createGateLink, GATE_STATE_EMPTY, courtWatchText, COURT_WATCH_ASK_MS, GATE_NO_TEXT } from '../../../src/net/gate/gateLink.js';
import { createGateCourt } from '../../../src/scenes/gate/gateCourt.js';
import { courtToDungeon, ARRIVE_Z } from '../../../src/world/gate/gateArena.js';

const src = (p) => readFileSync(new URL(`../../../${p}`, import.meta.url), 'utf8');
const quiet = async (fn) => { const keep = { info: console.info, warn: console.warn, log: console.log }; console.info = console.warn = console.log = () => {}; try { return await fn(); } finally { Object.assign(console, keep); } };
const DAY = 200;

test('COURT-WATCH the relay: the fight seats GATE_FIGHTERS_MAX and the next `in` is told the court is full - its socket kept, the beats its room\'s; the answer to an `in` that seats a fighter says so (`me`), and the wire carries it through (mutants: the seat unsaid; the wire dropping it)', async () => {
  const realNow = Date.now;
  let clock = gateTimes(DAY).openAt + 1000;
  Date.now = () => clock;
  try {
    await quiet(async () => {
      const R = fakeRoom(gateRoomKey(DAY), { now: () => clock });
      const at = (i) => ({ x: COURT_CENTRE[0] + (i % 16), y: 0, z: COURT_CENTRE[2] + Math.floor(i / 16), yaw: 0, pitch: 0, mv: 0 });
      const socks = [];
      for (let i = 0; i <= GATE_FIGHTERS_MAX; i++) {
        const ws = R.connect(); clock += 101;
        await R.hello(ws, `peer-${String(i).padStart(4, '0')}`, at(i));
        assert.equal(ws.closed, null, `hello ${i}`);
        socks.push(ws);
      }
      const answers = [];
      for (const ws of socks) { ws.sent.length = 0; await R.raw(ws, JSON.stringify({ t: 'gate', k: 'in', lv: 20, bv: GATE_BRAIN_V })); answers.push(ws.sent.filter((f) => f.t === 'gate' && (f.k === 'st' || f.k === 'no'))); }
      const first = answers[0].find((f) => f.k === 'st');
      assert.equal(first?.me, 1, 'a seated fighter\'s answer says the seat is its');
      assert.deepEqual(validGateOut(first)?.me, 1, 'and the wire carries it through');
      const last = answers[GATE_FIGHTERS_MAX];
      assert.deepEqual(last.map((f) => [f.k, f.m]), [['no', 'the court is full']], 'the one past the seats: the court is full');
      assert.equal(socks[GATE_FIGHTERS_MAX].closed, null, 'its socket kept - it watches');
      const beat = socks[GATE_FIGHTERS_MAX];
      beat.sent.length = 0;
      clock += 1000;
      if (R.alarm.at != null && clock >= R.alarm.at) await R.fire();
      assert.ok(beat.sent.some((f) => f.t === 'gate' || f.t === 'fb'), 'the watcher hears the beat');
    });
  } finally { Date.now = realNow; }
  const st = { k: 'st', d: 1, b: 'ruhn', ph: 1, h: 5, m: 10, x: 0, z: 0, yw: 0, sh: 0, wr: 9e12, n: 1, md: null };
  assert.equal(validGateOut({ ...st, me: 2 })?.me, undefined, 'only `1` says it');
  assert.equal(validGateOut(st)?.me, undefined);
});

test('COURT-WATCH the link: the court full keeps me watching - said once in its own words, never a refusal (the host would cast me out); an `in` answered with `me` seats me; out of the court forgotten; any other refusal still refuses (mutants: full a refusal again; the seat never taken; watching kept past the court)', () => {
  const refused = [], said = [];
  const link = createGateLink({ now: () => 0, say: (s) => said.push(s), onRefused: (m) => refused.push(m) });
  link.word({ k: 'no', m: 'the court is full' });
  link.word({ k: 'no', m: 'the court is full' });
  assert.equal(link.watching(), true);
  assert.deepEqual(refused, [], 'no refusal');
  assert.deepEqual(said, [courtWatchText()], 'said once');
  assert.notEqual(courtWatchText(), GATE_NO_TEXT['the court is full']);
  link.word({ k: 'st', d: 1, b: 'ruhn', ph: 1, h: 5, m: 10, x: 0, z: 0, yw: 0, mv: null, atk: null, sh: 0, wr: 9e12, n: 1, fell: null, wrath: null, md: null, ct: 0, xa: [], cx: null, su: 0, rk: 0, op: 0 });
  assert.equal(link.watching(), true, 'a beat seats nobody');
  link.word({ k: 'st', d: 1, b: 'ruhn', ph: 1, h: 5, m: 10, x: 0, z: 0, yw: 0, mv: null, atk: null, sh: 0, wr: 9e12, n: 1, fell: null, wrath: null, md: null, ct: 0, xa: [], cx: null, su: 0, rk: 0, op: 0, me: 1 });
  assert.equal(link.watching(), false, 'my `in` answered: the seat mine');
  link.word({ k: 'no', m: 'the court is full' });
  link.leave();
  assert.equal(link.watching(), false, 'out of the court, forgotten');
  link.word({ k: 'no', m: 'the gate is closing' });
  assert.deepEqual(refused, ['the gate is closing']);
});

/** The court on a clock of the test's, its link a real one, every word it sends counted. */
function court() {
  const link = createGateLink({ now: () => clock.t });
  const clock = { t: 0 }, sent = [], struck = [], me = { at: courtToDungeon(0, 0, ARRIVE_Z) };
  const c = createGateCourt({
    renderer: null, gl: null, link, now: () => clock.t, veiled: () => false, feet: () => me.at,
    player: () => ({ health: 100, maxHealth: 100, level: 12 }), strike: (d) => struck.push(d),
    send: (x) => { sent.push(['hit', x]); return true; }, sendCrystal: (x) => { sent.push(['xhit', x]); return true; },
    sendHeal: (x) => { sent.push(['heal', x]); return true; }, sendBody: (v) => { sent.push(['vt', v]); return true; },
  });
  return { c, link, clock, sent, struck };
}

test('COURT-WATCH the court: a watcher strikes nothing (a blow refused, nothing sent) and asks for a seat every COURT_WATCH_ASK_MS, never at once and never while it fights; seated, it strikes; the host\'s `in` door asks again for a watcher (mutants: a watcher\'s blow sent; the ask never made; the ask every frame; the host unwired)', () => {
  const h = court();
  const st = { k: 'st', d: 1, b: 'ruhn', ph: 1, h: 900, m: 1000, x: 0, z: 0, yw: 0, mv: null, atk: null, sh: 0, wr: 9e15, n: 1, fell: null, wrath: null, md: null, ct: 0, xa: [], cx: null, su: 0, rk: 0, op: 0 };
  h.link.word(st);
  h.link.word({ k: 'no', m: 'the court is full' });
  h.clock.t = 1_000; h.c.frame();
  assert.equal(h.c.askAgain(), false, 'not at once');
  h.clock.t = 1_000 + COURT_WATCH_ASK_MS - 1;
  assert.equal(h.c.askAgain(), false);
  h.clock.t = 1_000 + COURT_WATCH_ASK_MS;
  assert.equal(h.c.askAgain(), true, 'a watcher asks again');
  assert.equal(h.c.askAgain(), false, 'once an interval');
  assert.equal(h.c.hit({ d: 50, r: HIT_KINDS.Melee }), false, 'a watcher strikes nothing');
  assert.deepEqual(h.sent.filter(([k]) => k === 'hit'), [], 'nothing sent');
  h.link.word({ ...st, me: 1 });
  assert.equal(h.c.askAgain(), false, 'seated: never asks');
  assert.equal(h.c.hit({ d: 50, r: HIT_KINDS.Melee }), true, 'seated, the same blow lands');
  assert.equal(h.sent.filter(([k]) => k === 'hit').length, 1, 'and is sent');
  assert.match(src('src/scenes/world.js'), /\(online\.welcomes !== _gateInFor \|\| gateCourt\?\.askAgain\(\)\) && online\.sendGate\(\{ k: 'in',/, 'the host\'s `in` door asks again for a watcher');
});

test('COURT-WATCH his blows land on his fighters, never on the court\'s watchers: the slam that lands on a fighter standing there lands on nobody watching from the same stone (mutant: a watcher struck)', () => {
  const run = (watching) => {
    const link = { st: GATE_STATE_EMPTY, state() { return this.st; }, watching: () => watching };
    const clock = { t: 0 }, struck = [];
    const me = { health: 200, maxHealth: 200 };
    const c = createGateCourt({
      renderer: null, gl: null, link, now: () => clock.t, cam: () => courtToDungeon(0, 1.7, 20), feet: () => courtToDungeon(1, 0, 1),
      player: () => me, save: () => 0, strike: (d) => struck.push(d), rng: () => 0.5, send: () => true,
    });
    const slam = { i: 5, a: ATTACKS.slam.id, at: 10_000, x: 0, z: 0, yw: 0, tg: [] };
    link.st = { ...GATE_STATE_EMPTY, day: 700, boss: 'ruhn', hp: 900, max: 1000, fighters: 3, wrathAt: 10_000_000, atk: slam };
    clock.t = 9000; c.frame();
    clock.t = 10_005; c.frame();
    return struck.length;
  };
  assert.equal(run(false), 1, 'a fighter there is struck');
  assert.equal(run(true), 0, 'a watcher there is not');
});

test('COURT-WATCH a watcher holds no fighter\'s part: a mate\'s heal owed it is never said, its body never said, a blow on his host never sent - each said once it is seated (mutants: a watcher\'s heals, body and host blow sent)', () => {
  const run = (watching) => {
    const link = { st: GATE_STATE_EMPTY, state() { return this.st; }, watching: () => watching };
    const clock = { t: 0 }, sent = [];
    const me = { health: 60, maxHealth: 100 };
    const c = createGateCourt({
      renderer: null, gl: null, link, now: () => clock.t, cam: () => courtToDungeon(0, 1.7, 20), feet: () => courtToDungeon(0, 0, 4), player: () => me,
      sendHeal: (x) => { sent.push('heal'); return true; }, sendBody: () => { sent.push('vt'); return true; }, sendHost: () => { sent.push('ahit'); return true; },
    });
    link.st = { ...GATE_STATE_EMPTY, day: 700, boss: 'ruhn', phase: 1, hp: 800, max: 1000, fighters: 3, wrathAt: 10_000_000, md: ['burning', 'legion', 'echoing'],
      lg: { ads: [{ i: 1, k: HOST.harrier, h: 45, m: 45, x: 0, z: 6, mv: null, atk: null, rose: -Infinity, yaw: 0 }], gone: [] } };
    clock.t = 1; c.frame();
    c.healedBy('peer-a', 25);
    c.hostHit({ i: 1, d: 12.6, r: HIT_KINDS.Melee });
    for (let t = 2; t <= 3_000; t += 250) { clock.t = t; c.frame(); }
    return [...new Set(sent)].sort();
  };
  assert.deepEqual(run(false), ['ahit', 'heal', 'vt'], 'a fighter says all three');
  assert.deepEqual(run(true), [], 'a watcher none');
});
