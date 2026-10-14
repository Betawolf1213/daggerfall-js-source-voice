// PARTY-LOOT OVER THE WIRE - the functional pin. test/partyloot.test.js drives the two clients of a dungeon room over a
// relay of its own; here nothing between them stands in. Each player is the dungeon's own copy (test/partyLootRig.mjs,
// mounted from src/scenes/dungeonContext.js) inside the world host's own doors and the mode's own dungeon arms, sliced
// from the files that hold them:
//   - scenes/world.js: actSend with its pending set and actFlush's heal (AUDIT WORLD3 A3), foesStream (the host's
//     frame of its foes), and the session's onAct and onFoes handlers;
//   - scenes/worldModes.js: placeActionRecords, applyPlaceActions, applyDungeonFoes and dungeonFoesFrame;
// each over a REAL net/online.js OnlineSession - its join, its hello with a token it mints, its act gate (ACT_HZ_MAX)
// and its foes gate - into ONE REAL relay Room (server/src/index.js, over test/fakeRoom.mjs's Durable Object state,
// every hello's token really signed and really verified), which meters each socket and fans each frame to the other.
// The wire is in order and nothing on it is lost, as one socket's frames are; the two sessions, the Room and the
// mounted doors share one clock (Date.now is that clock here - the Room reads it for its meters).
//
// What is not here: a browser (WebGL, the inventory window - the rig's stand-ins), and buildDungeonContext itself,
// which nothing in the tree can stand up outside one. Recorded in bible/06-Systems/Online-Arc.md (PARTY-LOOT);
// mutants: tools/mutants/partyloot.json's PARTY-LOOT-WIRE records, which name this file alone.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { OnlineSession, FOES_MS, FOES_FULL_MS } from '../src/net/online.js';
import { isWorldRoom, isCellRoom, actFrameFits, ACT_HZ_MAX } from '../src/net/wire.js';
import { quietFoesGate } from '../src/net/foesQuiet.js';
import { goldStack } from '../src/systems/inventory.js';
import { createWeapon } from '../src/combat/enemyEquipment.js';
import { fakeRoom } from './fakeRoom.mjs';
import { copy, mount, names, sourceOf } from './partyLootRig.mjs';

const W = sourceOf('src/scenes/world.js'), WM = sourceOf('src/scenes/worldModes.js');
const ROOM = 'dungeon:m7';
const POSE = { x: 1, y: 2, z: 3, yaw: 0, pitch: 0, mv: 0 };
const HOST = 'host-0001', JOINER = 'join-0002';   // a peer id the relay takes (parseClient's bound)

// ONE CLOCK for the sessions, the Room and the doors - the Room's meters read Date.now()
const clock = { t: Date.UTC(2026, 9, 14, 12, 0, 0) };
const realNow = Date.now;
Date.now = () => clock.t;
after(() => { Date.now = realNow; });
// the session's token race (TOKEN_WAIT_MS) leaves an eight-second timer behind every hello it sends, long after the
// token it raced landed - no clock here is that timer's, so a long one is unref'd: the file ends when its tests do
const realSetTimeout = globalThis.setTimeout;
globalThis.setTimeout = (fn, ms, ...args) => { const h = realSetTimeout(fn, ms, ...args); if (ms >= 1000) h.unref?.(); return h; };
after(() => { globalThis.setTimeout = realSetTimeout; });

/** The relay and the wire to it: ONE real Room, and each session's socket joined to a socket of the Room's - a frame
 *  either way delivered in order through one queue, the Room's async handler awaited before the next. */
function wire() {
  const r = fakeRoom(ROOM, { now: () => Date.now() });
  const q = [];
  const post = (fn) => { q.push(fn); };
  /** Every frame delivered and every promise the doors started given time to land (a token's signature): a quiet wire. */
  const settle = async () => {
    for (let quiet = 0; quiet < 10;) {
      if (q.length) { quiet = 0; await q.shift()(); continue; }
      quiet++;
      await new Promise((res) => setTimeout(res, 2));
    }
  };
  class WireWS {
    constructor(url) {
      assert.ok(url.endsWith(`/room/${ROOM}`), `the session opens this room's socket (${url})`);
      this.url = url;
      this.readyState = 0;
      const s = r.connect();
      this.server = s;
      const said = s.send.bind(s), shut = s.close.bind(s);
      s.send = (frame) => { said(frame); post(() => this.onmessage?.({ data: frame })); };
      s.close = (code, reason) => { shut(code, reason); post(() => { this.readyState = 3; this.onclose?.({ code, reason }); }); };
      post(() => { this.readyState = 1; this.onopen?.(); });
    }
    send(frame) { post(() => r.room.webSocketMessage(this.server, frame)); }
    close() { this.readyState = 3; post(() => r.drop(this.server)); }
  }
  return { r, WireWS, settle };
}

/** One player: the dungeon's copy, the mode's dungeon arms around it, a real session, and the world host's own act and
 *  foes doors on that session. `frame()` is one host frame's share of it - world.js's foesStream and actFlush, in the
 *  frame's order, then the dungeon's heldLootTick (drawFoes'). */
function player(id, { authority, net, layout }) {
  let doors = null;
  const c = copy(id, { authority, layout, relay: { send: (_, data) => doors.actSend(data), get clock() { return clock.t; }, wall: false } });
  const dungeonCtx = { applyActions: c.applyActions, actionRecords: c.actionRecords, applyFoes: c.applyFoes, foesFrame: c.foesFrame };
  const modes = mount(`
    const mode = 'dungeon';
    return { mode, applyPlaceActions: ${WM.member('applyPlaceActions')}, placeActionRecords: ${WM.member('placeActionRecords')},
      applyDungeonFoes: ${WM.member('applyDungeonFoes')}, dungeonFoesFrame: ${WM.member('dungeonFoesFrame')} };
  `, { dungeonCtx, interiorCtx: null, _intShared: null });
  const online = new OnlineSession({ url: 'wss://relay.test', name: id, id, secret: `secret-of-${id}`, look: net.r.look,
    mintToken: () => net.r.token(id, { n: id }), WebSocketImpl: net.WireWS, now: () => clock.t });
  doors = mount(`
    ${['_actPend', '_actLive', '_actRoom', '_actTooBig', 'actTooBig', 'actSend', 'actFlush', '_foesSentAt', '_foesQuiet', 'foesStream'].map(W.decl).join('\n')}
    online.onAct = ${W.assigned('online.onAct')};
    online.onFoes = ${W.assigned('online.onFoes')};
    return { actSend, actFlush, foesStream, pending: () => [..._actPend] };
  `, { online, _onlineKey: ROOM, modes, isWorldRoom, isCellRoom, actFrameFits, quietFoesGate, FOES_MS, FOES_FULL_MS, console,
    performance: { now: () => clock.t }, exteriorFoes: null, csaPeers: null, csaAboard: null, campToScene: null });
  const frame = () => { doors.foesStream(clock.t); doors.actFlush(); c.heldLootTick(); };
  return { id, c, online, doors, frame };
}

async function party(hostLayout, joinerLayout) {
  const net = wire();
  const H = player(HOST, { authority: true, net, layout: hostLayout });
  const J = player(JOINER, { authority: false, net, layout: joinerLayout });
  H.online.join(ROOM, POSE);
  await net.settle();
  J.online.join(ROOM, POSE);
  await net.settle();
  assert.equal(H.online.status, 'open', 'the host\'s hello was taken (its token verified by the Room)');
  assert.equal(J.online.status, 'open');
  assert.equal(H.online.isHost(), true, 'the first in the room holds the seat');
  assert.equal(J.online.host, HOST, 'and the joiner was told so in its welcome');
  return { net, H, J };
}

test('PARTY-LOOT OVER THE WIRE: the report - the killer\'s list reaches the party member through the real session and the real relay ahead of the body, lands the frame the host\'s stream lays it, and opens with no claim; the party member\'s close leaves the killer\'s loot where it lay', async () => {
  const { net, H, J } = await party([[createWeapon(113, 2), goldStack(250)]], [[]]);
  H.c.damageFoe(H.c.foes[0], 99);
  assert.equal(H.online.stats.acts, 1, 'the runner said the body at its death, through world.js\'s actSend and the session\'s gate');
  await net.settle();
  assert.equal(J.c.foes[0].dead, false, 'no frame has said the foe fell');
  assert.equal(J.c.early().has('corpse:0'), true, 'the word crossed the Room first, and waits for the body');
  clock.t += FOES_MS;
  H.frame();
  await net.settle();
  assert.equal(J.c.foes[0].dead && J.c.foes[0].corpse, true, 'the host\'s foes frame laid the body, through the Room and onFoes');
  assert.deepEqual(names(J.c.body()), ['Dagger', 'Gold Pieces', 'the handler\'s find'], 'the killer\'s list - not the joiner\'s "Empty"');
  assert.deepEqual(J.c.body(), H.c.body());
  const said = J.online.stats.acts;
  J.c.api.takeLoot('corpse:0');
  assert.deepEqual(J.c.windows[0].items, H.c.body(), 'the window opens on it');
  assert.equal(J.online.stats.acts, said, 'and claims nothing on the wire');
  J.c.windows[0].close();
  await net.settle();
  assert.deepEqual(names(H.c.body()), ['Dagger', 'Gold Pieces', 'the handler\'s find'], 'the killer\'s loot is where it lay');
});

test('PARTY-LOOT OVER THE WIRE: a blast that kills more than the act bucket says in a second - the session refuses the last body\'s word, world.js keeps its key, the party member\'s press on that body waits, and actFlush\'s heal re-reads the host\'s list through placeActionRecords and opens it there', async () => {
  const layout = Array.from({ length: ACT_HZ_MAX + 1 }, (_, n) => [goldStack(10 + n)]);
  const { net, H, J } = await party(layout, layout.map(() => []));
  const last = `corpse:${ACT_HZ_MAX}`;
  for (const f of H.c.foes) H.c.damageFoe(f, 99);   // one blast, one frame
  assert.equal(H.online.stats.acts, ACT_HZ_MAX, `ACT_HZ_MAX words went (${ACT_HZ_MAX} a second)`);
  assert.deepEqual(H.doors.pending(), [last], 'the refused one is held by its key');
  H.frame();   // the blast's own frame: its foes stream lays every body, and its actFlush finds no token yet
  await net.settle();
  assert.deepEqual(H.doors.pending(), [last], 'still held: the bucket has not refilled');
  assert.deepEqual(J.c.foes.map((f) => f.dead && f.corpse), layout.map(() => true), 'every body laid');
  assert.deepEqual(J.c.foes.slice(0, ACT_HZ_MAX).map((f) => f.entity.items.map((it) => it.stackCount ?? 1)), layout.slice(0, ACT_HZ_MAX).map(([g]) => [g.stackCount, 1]), 'the words that went landed on their bodies');
  assert.deepEqual(J.c.body(ACT_HZ_MAX), [], 'the last stands the joiner\'s own roll');
  const said = J.online.stats.acts;
  assert.equal(J.c.api.takeLoot(last), 0, 'its press waits');
  assert.equal(J.c.windows.length, 0);
  assert.equal(J.online.stats.acts, said, 'and claims nothing on the wire');
  clock.t += FOES_MS;   // one token's refill at ACT_HZ_MAX
  H.frame();   // the next stream frame, and the heal behind it
  await net.settle();
  assert.deepEqual(H.doors.pending(), [], 'the heal went');
  assert.deepEqual(J.c.body(ACT_HZ_MAX), H.c.body(ACT_HZ_MAX), 'and landed');
  J.frame();
  assert.equal(J.c.windows.length, 1, 'the held press opened');
  assert.deepEqual(J.c.windows[0].items, H.c.body(ACT_HZ_MAX), 'on the host\'s list');
  assert.equal(J.online.stats.acts, said, 'with no claim');
});
