// GATE-DOOR (2026-10-18, from play at a thousand online: "Server is kinda breaking down near oblivion gate cause so many ppl
// lol"; bible/11-Multiplayer/Scale-Arc.md THE PLAN PAST 1,000, GATE-DOOR): A GATE'S COURT ADMITS ITS OPENING'S CROWD. Its
// door admitted HELLO_HZ_MAX (10) hellos a second, and a player standing in a court that had said nothing for
// COURT_SILENT_MS was cast out of it - so at the opening a share of the crowd was thrown out of the court it was waiting to
// enter. Now a court and its copies admit GATE_HELLO_HZ_MAX a second (still before the token is read, a busy refusal leaving
// it unspent), and a court that refuses me busy is an answer, not a silence, while I am new to it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fakeRoom } from '../../fakeRoom.mjs';
import { fakeSocketClass } from '../../fakeSocket.mjs';
import { HELLO_HZ_MAX, GATE_HELLO_HZ_MAX, CLOSE_BUSY, BUSY_TOKEN_UNREAD } from '../../../src/net/wire.js';
import { gateTimes, gateRoomKey } from '../../../src/net/gate/gateLaw.js';
import { COURT_CENTRE } from '../../../src/net/gate/gateBrain.js';
import { OnlineSession } from '../../../src/net/online.js';
import { createGateCourt } from '../../../src/scenes/gate/gateCourt.js';
import { courtToDungeon, ARRIVE_Z, COURT_SILENT_MS, COURT_DOOR_WAIT_MS } from '../../../src/world/gate/gateArena.js';
import { GATE_STATE_EMPTY } from '../../../src/net/gate/gateLink.js';

const src = (p) => readFileSync(new URL(`../../../${p}`, import.meta.url), 'utf8');
const quiet = async (fn) => { const keep = { info: console.info, warn: console.warn, log: console.log }; console.info = console.warn = console.log = () => {}; try { return await fn(); } finally { Object.assign(console, keep); } };
async function onClock(start, fn) {
  const realNow = Date.now;
  let clock = start;
  Date.now = () => clock;
  try { return await quiet(() => fn({ now: () => clock, tick: (ms) => { clock += ms; } })); } finally { Date.now = realNow; }
}
const DAY = 200;

test('GATE-DOOR the court\'s door: a court admits GATE_HELLO_HZ_MAX hellos in one instant where a cell admits HELLO_HZ_MAX; the next is refused busy with its token unread, and that same token opens the court once the door refills; the rate a measured one - deep enough for the opening\'s crowd, a hello some 1.4 ms of the court at 256 (mutants: the court at the cell\'s rate; the court\'s rate given every room)', async () => {
  assert.equal(GATE_HELLO_HZ_MAX, 48);
  assert.ok(GATE_HELLO_HZ_MAX > HELLO_HZ_MAX);
  await onClock(gateTimes(DAY).openAt + 1000, async ({ tick }) => {
    const R = fakeRoom(gateRoomKey(DAY));
    const at = (i) => ({ x: COURT_CENTRE[0] + (i % 8), y: 0, z: COURT_CENTRE[2] + Math.floor(i / 8), yaw: 0, pitch: 0, mv: 0 });
    for (let i = 0; i < GATE_HELLO_HZ_MAX; i++) { const ws = R.connect(); await R.hello(ws, `peer-${String(i).padStart(4, '0')}`, at(i)); assert.equal(ws.closed, null, `the opening's ${i}`); }
    const tok = await R.token('peer-9999', { n: 'peer-9999' });
    const refused = R.connect();
    await R.hello(refused, 'peer-9999', at(99), { tok });
    assert.deepEqual(refused.closed, { code: CLOSE_BUSY, reason: BUSY_TOKEN_UNREAD }, 'past the door: busy, its token unread');
    tick(Math.ceil(1000 / GATE_HELLO_HZ_MAX) + 1);
    const back = R.connect();
    await R.hello(back, 'peer-9999', at(99), { tok });
    assert.equal(back.closed, null, 'the same token, once the door refills: it was never spent');
    assert.ok(back.sent.some((f) => f.t === 'welcome'));
  });
  await onClock(1_800_000_000_000, async () => {
    const R = fakeRoom('world:13,13');
    for (let i = 0; i < HELLO_HZ_MAX; i++) { const ws = R.connect(); await R.hello(ws, `peer-${String(i).padStart(4, '0')}`, null); assert.equal(ws.closed, null, `the cell's ${i}`); }
    const over = R.connect();
    await R.hello(over, 'peer-9999', null);
    assert.deepEqual(over.closed, { code: CLOSE_BUSY, reason: BUSY_TOKEN_UNREAD }, 'a cell keeps its own door');
  });
  assert.match(src('server/src/index.js'), /gate = tokenGate\(this\._hellos, now, chat \? CHAT_HELLO_HZ_MAX : isGateRoom\(a\.key\) \? GATE_HELLO_HZ_MAX : HELLO_HZ_MAX\);/, 'one door, before the token');
});

test('GATE-DOOR the session stamps a busy refusal of its room on its own clock (`busyAt`) - a door that answered, which the court reads; any other close stamps nothing (mutants: never stamped; a drop stamped)', async () => {
  const run = async (code, reason) => {
    const { FakeWS, sockets } = fakeSocketClass();
    let t = 5_000;
    const s = new OnlineSession({ url: 'wss://relay.test', name: 'Mac', id: 'mac-0001', secret: 'secret-of-mac-0001', WebSocketImpl: FakeWS, now: () => t, presence: false });
    assert.equal(s.busyAt, null, 'nothing heard yet');
    await quiet(async () => {
      s.join(gateRoomKey(DAY), null);
      sockets[0].open();
      for (let i = 0; i < 10; i++) await Promise.resolve();
      t = 7_250;
      sockets[0].drop(code, reason);
    });
    return s.busyAt;
  };
  assert.equal(await run(CLOSE_BUSY, BUSY_TOKEN_UNREAD), 7_250, 'busy: the door answered, then');
  assert.equal(await run(1006, ''), null, 'a dropped socket is no answer');
});

/** The court on a clock of the test's, its door the test's to answer. */
function court() {
  const link = { st: GATE_STATE_EMPTY, state() { return this.st; } };
  const clock = { t: 0 }, door = { at: null }, me = { at: courtToDungeon(0, 0, ARRIVE_Z) };
  const c = createGateCourt({
    renderer: null, gl: null, link, now: () => clock.t, veiled: () => false, door: () => door.at,
    feet: () => me.at, player: () => ({ health: 100, maxHealth: 100, level: 12 }),
  });
  return { c, clock, door, me };
}
const at = (h, t) => { h.clock.t = t; h.c.frame(); };

test('GATE-DOOR a court that refuses me busy is an answer, not a silence: while I am new to it (COURT_DOOR_WAIT_MS from my arrival) each refusal counts as a word of it, so I wait at its door instead of being cast out of it; a refusal heard before I stepped in buys nothing past my arrival; past the wait, a court that still only refuses is silent as a silent one is (mutants: the door never read; read past the wait; the host unwired)', () => {
  assert.ok(COURT_DOOR_WAIT_MS > COURT_SILENT_MS);
  const h = court();
  h.door.at = 500;   // a refusal before I stepped in (the cell's, say)
  for (let t = 1_000; t <= 1_000 + COURT_SILENT_MS + 1_000; t += 1_000) at(h, t);
  assert.equal(h.c.silent(), true, 'a refusal from before my arrival buys nothing past it');
  const w = court();
  for (let t = 1_000; t <= 1_000 + COURT_DOOR_WAIT_MS; t += 1_000) { if (t % 5_000 === 0) w.door.at = t; at(w, t); }
  assert.equal(w.c.silent(), false, 'refused busy every five seconds of the wait: still at the door');
  for (let t = 2_000 + COURT_DOOR_WAIT_MS; t <= 1_000 + COURT_DOOR_WAIT_MS + COURT_SILENT_MS + 2_000; t += 1_000) { if (t % 5_000 === 0) w.door.at = t; at(w, t); }
  assert.equal(w.c.silent(), true, 'past the wait, a court that only refuses is silent');
  w.me.at = null;
  at(w, 200_000);
  assert.equal(w.c.silent(), false, 'out of the court, forgotten');
  assert.match(src('src/scenes/world.js'), /\n {4}now: \(\) => Date\.now\(\) \+ _sharedOffsetMs, door: \(\) => online\?\.busyAt \?\? null,/, 'the host hands the court its session\'s door');
});
