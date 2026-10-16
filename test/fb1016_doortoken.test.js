// FIELD BUGS 2026-10-16 (DOOR-TOKEN) - the Discord: "Friend invivible and randomly popping up"; "Partied players popping
// in and out randomly after leaving tombs at graveyard ... also partied players inside tombs are invisible for a time."
//
// Every place change is a new relay room, and the room's socket asked the page's minter for its identity token only as it
// opened (net/online.js `_bind`) - a token held under a minute and not yet spent there opened it at once, anything else
// was a mint on the wire, seconds for a player, the hello waiting on it and the player invisible to the party on both
// sides of the door. A crypt visited past the reuse minute paid it on the way in and again on the way out. Now the host
// says a place change is coming and the mint goes then (accountClient.js `ahead`, scenes/doorTokenHost.js), and a hello
// refused for want of a token asks again the moment one is held rather than out its backoff (online.js `tick`).
//
// Driven over the REAL OnlineSession, the REAL relay Room (test/fakeRoom.mjs) and the REAL accountTokenMinter, one clock
// for all of them (node's mock timers: Date and setTimeout), an account service whose mint takes its seconds.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { fakeRooms, roomSigner } from './fakeRoom.mjs';
import { OnlineSession, roomKeyFor, TOKEN_WAIT_MS } from '../src/net/online.js';
import { accountTokenMinter, SESSION_KEY, TOKEN_REUSE_MS, TOKEN_AHEAD_MS, MINT_COOL_MS } from '../src/net/accountClient.js';
import { reconnectWave } from '../src/net/reconnectWave.js';
import { PIXEL_UNITS, cellHaloFor, isWorldRoom, isCellRoom } from '../src/net/wire.js';
import { createDoorToken, EXIT_NEAR_M, EXIT_ARM_M } from '../src/scenes/doorTokenHost.js';
import { arenaExitDoors } from '../src/world/arenaFloor.js';
import { doorWorldPosition } from '../src/player/enterExit.js';

const T0 = 1_800_000_000_000;
const STEP = 100;
const turn = () => new Promise((r) => setImmediate(r));
const quiet = async (fn) => { const w = console.warn, i = console.info; console.warn = () => {}; console.info = () => {}; try { return await fn(); } finally { console.warn = w; console.info = i; } };
function store(seed) {
  const m = new Map(seed ? [[SESSION_KEY, JSON.stringify(seed)]] : []);
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

/** Two pages (and any more) over the real relay: the account service mints real tokens the rooms verify, each after
 *  `latency` ms on the one clock (signed before the clock runs - a signature is real time, and a frame's is not); a socket
 *  is a bridge to a real Room, every frame it carries awaited; the pages' frames are world.js's online block. */
function world({ latency }) {
  const rooms = fakeRooms({ now: () => Date.now() });
  const service = {};
  const signer = roomSigner(service, () => Date.now());
  const pending = [];
  const svc = { mints: 0 };
  const accounts = new Map();
  const room = (name) => { const r = rooms.room(name); r.env.IDENTITY_PUBLIC_KEY ??= service.IDENTITY_PUBLIC_KEY; return r; };
  async function fetch(url, init) {
    const who = accounts.get(String(init.headers.authorization).slice(7));
    await new Promise((r) => setTimeout(r, latency));
    svc.mints++;
    const token = who.tokens.shift();
    return { ok: true, status: 200, headers: { get: () => null }, json: async () => ({ token, name: who.name, kind: 'linked' }) };
  }
  class BridgeWS {
    constructor(url) {
      this.key = decodeURIComponent(/\/room\/([^?]+)/.exec(url)[1]);
      this.r = room(this.key);
      this.readyState = 0;
      const rws = this.r.connect();
      const send = rws.send.bind(rws), close = rws.close.bind(rws);
      rws.send = (s) => { send(s); pending.push(() => { if (this.readyState === 1) this.onmessage?.({ data: s }); }); };
      rws.close = (code, reason) => { close(code, reason); pending.push(() => { if (this.readyState !== 3) { this.readyState = 3; this.onclose?.({ code, reason }); } }); };
      this.rws = rws;
      pending.push(() => { if (this.readyState === 0) { this.readyState = 1; this.onopen?.(); } });
    }
    send(s) { if (this.readyState !== 1) throw new Error('not open'); const { r, rws } = this; pending.push(() => r.room.webSocketMessage(rws, s)); }
    close(code = 1000, reason = '') {
      if (this.readyState === 3) return;
      this.readyState = 3;
      const { r, rws } = this;
      pending.push(async () => { const i = r.sockets.indexOf(rws); if (i >= 0) { r.sockets.splice(i, 1); await r.room.webSocketClose(rws, code, reason); } });
    }
  }
  async function pump() {
    for (let k = 0; k < 6; k++) { while (pending.length) await pending.shift()(); await turn(); }
  }
  async function page(id, name, acct, { rand = Math.random } = {}) {
    const secret = `secret-of-${acct}-long-enough`;
    const tokens = [];
    for (let i = 0; i < 8; i++) tokens.push(await signer.token(id, { s: acct, n: name }));
    accounts.set(secret, { id, name, acct, tokens });
    const minter = accountTokenMinter({ fetch, storage: store({ id: acct, secret, name }), rand: () => 0.5 });
    const s = new OnlineSession({ url: 'wss://relay.test', name, id, secret: 'secret-of-' + id, WebSocketImpl: BridgeWS, wave: reconnectWave({ online: () => true }), mintToken: minter, rand });
    return { id, s, minter, st: { mode: 'exterior', pose: null, key: null, keySince: 0 } };
  }
  /** world.js's online block, once: the room's key, the hold, the join or the pose, the halo, the tick. */
  function frame(pl) {
    const p = pl.st, s = pl.s, now = Date.now();
    let key, mp = null;
    if (p.mode === 'exterior') { mp = { x: Math.floor(p.pose.x / PIXEL_UNITS), y: 499 - Math.floor(p.pose.z / PIXEL_UNITS) }; key = roomKeyFor({ host: 'world', mode: 'exterior', mapPixel: mp }); }
    else key = roomKeyFor({ host: 'world', mode: 'dungeon', mapId: 11926957, regionIndex: 0, locationName: 'The Tombs of Klerd' });
    if (key !== p.key) { p.key = key; p.keySince = now; }
    if (key !== s.room) { if (!s.room || isWorldRoom(key) || isWorldRoom(s.room) || (isCellRoom(key) && s.inRoom(key)) || now - p.keySince >= 500) s.join(key, { ...p.pose }); }
    else s.sendPose({ ...p.pose });
    const want = mp && isCellRoom(s.room) ? cellHaloFor(mp.x, mp.y, { current: s.haloRooms() }) : [];
    if (mp && isCellRoom(s.room) && isCellRoom(key) && key !== s.room) want.push(key);
    s.setHalo(want); s.tick();
  }
  return { svc, page, frame, pump, init: () => signer.signer() };
}
const sees = (a, b) => a.s.drawable().some((d) => d.id === b.id);
/** A graveyard's place in the open country, a map pixel (and a fraction of one). */
const at = (px, py, fx = 0.5) => ({ x: (px + fx) * PIXEL_UNITS, y: 0, z: (499 - py + 0.5) * PIXEL_UNITS, yaw: 0, pitch: 0, mv: 0 });
async function withClock(fn) {
  mock.timers.enable({ apis: ['setTimeout', 'Date'], now: T0 });
  try { return await quiet(fn); } finally { mock.timers.reset(); }
}

test('DOOR-TOKEN THE CRYPT: over the real OnlineSession, relay Room and accountTokenMinter, with a mint that takes 3 s, a party member walking into the crypt past the reuse minute is seen by the one inside within a second of the room changing, and both are seen within a second of walking back out - the door module mints the next room\'s token at the door (the place\'s build, the walk to the exit) - and the pages mint exactly what they did before: one a room the old token could not open (mutants: no ahead at the door; no ahead on the walk out; ahead never minting; the walk minting at the spawn; an extra mint at a door the held token opens)', () => withClock(async () => {
  const LAT = 3000, BUILD = 2500;
  const w = world({ latency: LAT });
  await w.init();
  const A = await w.page('aaaa-0001', 'Ann', 'acct-ann'), B = await w.page('bbbb-0002', 'Bob', 'acct-bob');
  const exitDoors = arenaExitDoors([0, 0, 0]).slice(0, 1);   // the exit doors' own shape (scenes/dungeonContext.js exitDoors), a producer's
  const door0 = doorWorldPosition(exitDoors[0]);
  const bodies = new Map([[A, { pos: [...door0] }], [B, { pos: [door0[0] + 2, 0, door0[2]] }]]);
  const doors = new Map([A, B].map((pl) => [pl, createDoorToken({ minter: () => pl.minter, session: () => pl.s, modes: () => ({ mode: pl.st.mode, dungeonCtx: { exitDoors } }), player: () => bodies.get(pl) })]));
  A.st.pose = at(101, 204);
  B.st.mode = 'dungeon';
  let watch = null;
  const seen = {};
  async function run(ms, step) {
    for (const end = Date.now() + ms; Date.now() < end;) {
      step?.();
      for (const pl of [A, B]) { if (pl.st.mode === 'dungeon') { const b = bodies.get(pl).pos; pl.st.pose = { x: b[0], y: 0, z: b[2], yaw: 0, pitch: 0, mv: 0 }; } w.frame(pl); doors.get(pl).frame(); }
      await w.pump();
      mock.timers.tick(STEP);
      await w.pump();
      if (watch && sees(A, B) && sees(B, A)) { seen[watch.what] = Date.now() - watch.at; watch = null; }
    }
  }
  await run(70_000);   // A outside, B in the crypt - both tokens past the reuse minute
  assert.equal(w.svc.mints, 2, 'a mint a page');
  assert.equal(doors.get(A).entering(), true, 'the door: the held token is past the minute - the crypt\'s goes now');
  assert.equal(doors.get(A).back, A.s.room, 'the way back out is the cell the door took me from');
  await run(BUILD);   // the crypt builds
  A.st.mode = 'dungeon'; watch = { what: 'in', at: Date.now() };
  await run(10_000);
  assert.ok(seen.in <= 1000, `seen ${seen.in} ms after the room changed - before DOOR-TOKEN, the mint's ${LAT} ms`);
  assert.equal(w.svc.mints, 3, 'the crypt\'s one mint, gone at the door');
  // deeper in, past the reuse minute, and back to the exit at a walk - B too
  let x = 0;
  await run(62_000, () => { x = Math.min(60, x + 0.5); for (const b of bodies.values()) b.pos = [door0[0] + x, 0, door0[2]]; });
  assert.equal(w.svc.mints, 3, 'the spawn at the door and the walk away mint nothing');
  await run(12_000, () => { x = Math.max(1, x - 0.5); for (const b of bodies.values()) b.pos = [door0[0] + x, 0, door0[2]]; });
  assert.equal(w.svc.mints, 5, 'the walk back to the door: a mint a page, the cell outside\'s');
  for (const pl of [A, B]) assert.equal(doors.get(pl).leaving(), false, 'the door out finds it held - nothing more');
  A.st.mode = 'exterior'; A.st.pose = at(101, 204); B.st.mode = 'exterior'; B.st.pose = at(101, 204, 0.6);
  watch = { what: 'out', at: Date.now() };
  await run(10_000);
  assert.ok(seen.out <= 1000, `both seen ${seen.out} ms after the room changed - before DOOR-TOKEN, the mint's ${LAT} ms`);
  assert.equal(w.svc.mints, 5, 'five mints - the count before DOOR-TOKEN on the same walk: one a room the held token could not open');
  // a door the held token opens mints nothing ahead
  assert.equal(doors.get(A).entering(), false, 'a fresh token held: the next room\'s socket is handed it');
  assert.equal(w.svc.mints, 5);
}));

test('DOOR-TOKEN THE LATE TOKEN: a hello that went without a token - the mint slower than TOKEN_WAIT_MS - and was refused asks again the moment the token arrives, the cell\'s and its halo\'s, never out the backoff after; the peer is seen within a second of the token (mutants: the primary waits out its backoff; the halo does; the wait asked of a room the token cannot open)', () => withClock(async () => {
  const LAT = TOKEN_WAIT_MS + 1000;
  const w = world({ latency: LAT });
  await w.init();
  const A = await w.page('aaaa-0001', 'Ann', 'acct-ann', { rand: () => 0.99 });   // the backoff's jitter at its far end
  const B = await w.page('bbbb-0002', 'Bob', 'acct-bob');
  A.st.pose = at(101, 207); B.st.pose = at(101, 207, 0.6);   // the cell's last row: a halo over the edge (world:6,13)
  const t0 = Date.now();
  let tokenAt = null, seenAt = null, cellAt = null, haloAt = null;
  for (let i = 0; i < 300 && (seenAt == null || cellAt == null || haloAt == null); i++) {
    w.frame(A); w.frame(B);
    await w.pump(); mock.timers.tick(STEP); await w.pump();
    const now = Date.now();
    if (tokenAt == null && A.minter.holds(A.s.room)) tokenAt = now;
    if (seenAt == null && sees(A, B) && sees(B, A)) seenAt = now;
    if (cellAt == null && A.s.welcomed) cellAt = now;   // my own cell's socket, its hello answered
    if (haloAt == null && A.s._halo.get('world:6,13')?.status === 'open') haloAt = now;
  }
  assert.ok(tokenAt != null && tokenAt - t0 >= TOKEN_WAIT_MS, 'the token came after the hello went without it');
  assert.ok(cellAt - tokenAt <= 1000, `my cell welcomed me ${cellAt - tokenAt} ms after the token arrived - before DOOR-TOKEN, out the backoff (${Math.round((cellAt - t0) / 100) / 10} s from the join)`);
  assert.ok(haloAt - tokenAt <= 1000, `and the halo over the edge ${haloAt - tokenAt} ms after it`);
  assert.ok(seenAt - tokenAt <= 1000, `the peer seen ${seenAt - tokenAt} ms after the token arrived`);
  assert.equal(w.svc.mints, 2, 'the late token carried, never another mint');
}));

test('DOOR-TOKEN THE LAW: `ahead` mints only when the token held could not open the next room - none held, spent there, or under TOKEN_AHEAD_MS of its reuse left - never while one flies, never in a failure\'s hold, never without a sign-in; asked every frame for ten minutes it mints one a TOKEN_REUSE_MS - TOKEN_AHEAD_MS; `holds` answers the reuse law (mutants: ahead always; ahead never; the spent room unasked; the margin dropped; a second mint in flight; through the hold; holds past the minute)', async () => quiet(async () => {
  let t = T0, n = 0, fail = null, hold = null;
  const fetch = async () => { n++; if (hold) await hold; if (fail) return { ok: false, status: 503, json: async () => ({ error: fail }) }; return { ok: true, status: 200, json: async () => ({ token: `v1.claims${n}.sig${n}`, name: 'Ann', kind: 'linked' }) }; };
  const signed = store({ id: 'acct-ann', secret: 'secret-of-acct-ann-long-enough', name: 'Ann' });
  const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
  assert.equal(accountTokenMinter({ fetch, storage: store(null), now: () => t }).ahead(null), false, 'no sign-in: nothing');
  assert.equal(n, 0);
  const m = accountTokenMinter({ fetch, storage: signed, now: () => t, rand: () => 0.5 });
  assert.equal(m.ahead(null), true, 'none held: minted');
  assert.equal(m.ahead(null), false, 'one in flight: no second');
  await settle();
  assert.equal(n, 1);
  assert.equal(m.holds('world:6,12'), true, 'held, the room unopened');
  const tok = await m('world:6,12');
  m.opened('world:6,12', tok);
  assert.equal(n, 1, 'the socket was handed it');
  assert.equal(m.holds('world:6,12'), false, 'spent there');
  assert.equal(m.holds('dungeon:m11926957'), true);
  assert.equal(m.ahead('dungeon:m11926957'), false, 'it opens the crypt - nothing');
  assert.equal(m.ahead(null), false);
  assert.equal(m.ahead('world:6,12'), true, 'the way back out to a room it opened: minted');
  await settle();
  assert.equal(n, 2);
  t += TOKEN_REUSE_MS - TOKEN_AHEAD_MS - 1;
  assert.equal(m.ahead(null), false, 'under the margin');
  t += 1;
  assert.equal(m.holds('chat:world'), true, 'the minute not out');
  assert.equal(m.ahead(null), true, 'TOKEN_AHEAD_MS of its minute left: minted for the room to come');
  await settle();
  t += TOKEN_REUSE_MS;
  assert.equal(m.holds('chat:world'), false, 'past the minute');
  // a failure's hold
  fail = 'server';
  assert.equal(m.ahead(null), true);
  await settle();
  assert.ok(m.coolMs() > 0);
  const k = n;
  assert.equal(m.ahead(null), false, 'the hold holds');
  assert.equal(n, k);
  t += MINT_COOL_MS * 2; fail = null;
  // the bound: asked every frame (100 ms) for ten minutes
  const m2 = accountTokenMinter({ fetch, storage: signed, now: () => t });
  const before = n;
  for (const end = t + 600_000; t < end; t += 100) { m2.ahead(null); await settle(); }
  assert.equal(n - before, Math.ceil(600_000 / (TOKEN_REUSE_MS - TOKEN_AHEAD_MS)), 'one a TOKEN_REUSE_MS - TOKEN_AHEAD_MS');
  assert.deepEqual([TOKEN_REUSE_MS, TOKEN_AHEAD_MS], [60_000, 20_000]);
  void hold;
}));

test('DOOR-TOKEN THE HOST\'S DOORS: online only (no session, a terminal one, one in no room, a seam not yet standing: nothing, never a throw); entering remembers the cell as the way back out, a jump forgets it; the walk to the exit mints once it has stood EXIT_ARM_M from every exit door and comes within EXIT_NEAR_M, never at the spawn and never twice on one approach (mutants: the spawn mints; armed without the walk away; the way out unremembered; offline minting)', () => {
  const asked = [];
  const minter = { ahead: (room) => { asked.push(room); return true; } };
  let s = null;
  const pos = [0, 0, 0];
  let mode = 'exterior';
  const exitDoors = arenaExitDoors([0, 0, 0]).slice(0, 1);
  const d0 = doorWorldPosition(exitDoors[0]);   // the door's own centre, as closestDoorTo reads it
  const door = createDoorToken({ minter: () => minter, session: () => s, modes: () => ({ mode, dungeonCtx: { exitDoors }, interiorCtx: { doors: exitDoors } }), player: () => ({ pos }) });
  assert.equal(door.entering(), false, 'no session');
  s = { url: 'wss://relay.test', room: null };
  assert.equal(door.entering(), false, 'in no room');
  s = { url: 'wss://relay.test', room: 'world:6,12', terminal: true };
  assert.equal(door.leaving(), false, 'terminal');
  assert.deepEqual(asked, []);
  const tdz = createDoorToken({ minter: () => { throw new ReferenceError('identityMinter is not defined'); }, session: () => { throw new ReferenceError('online'); } });
  assert.equal(tdz.jumping(), false, 'a seam the boot has not stood up yet: none');
  s = { url: 'wss://relay.test', room: 'world:6,12' };
  assert.equal(door.entering(), true);
  assert.deepEqual(asked, [null], 'the next room is one no token has opened');
  assert.equal(door.back, 'world:6,12');
  s.room = 'dungeon:m11926957'; mode = 'dungeon';
  const stand = (dx) => { pos[0] = d0[0] + dx; pos[1] = d0[1]; pos[2] = d0[2]; return door.frame(); };
  assert.equal(stand(1), false, 'the spawn at the door');
  assert.equal(stand(EXIT_ARM_M - 1), false, 'not yet away');
  assert.equal(stand(EXIT_NEAR_M), false, 'back without having stood away');
  assert.equal(stand(EXIT_ARM_M + 1), false, 'away');
  assert.equal(stand(EXIT_NEAR_M + 1), false, 'not yet near');
  assert.equal(stand(EXIT_NEAR_M), true, 'the way out approached');
  assert.equal(asked.at(-1), 'world:6,12', 'for the cell it leads back to');
  assert.equal(stand(2), false, 'once an approach');
  assert.equal(door.leaving(), true);
  assert.equal(asked.at(-1), 'world:6,12');
  mode = 'interior';
  stand(EXIT_ARM_M + 5);
  assert.equal(stand(3), true, 'a building\'s doors alike');
  mode = 'exterior';
  assert.equal(stand(EXIT_ARM_M + 5), false, 'outside there is no way out');
  assert.equal(stand(1), false);
  assert.equal(door.jumping(), true);
  assert.equal(door.back, null, 'a jump forgets the way back');
});

test('DOOR-TOKEN THE WIRING: world.js mints at every door the mode machine names (onPreTransition, onDungeonLeave, onInteriorLeave), at every jump (_teleportToPixel) and on the walk out (the online frame), off the one page minter and presence session - declared beside the recoiler the jump resets (mutants: each call dropped)', () => {
  const src = readFileSync(new URL('../src/scenes/world.js', import.meta.url), 'utf8');
  const line = (needle) => src.split('\n').find((l) => l.includes(needle)) ?? '';
  assert.match(line('const cameraRecoiler = new CameraRecoiler();'), /; const doorToken = createDoorToken\(\{ minter: \(\) => identityMinter, session: \(\) => online, modes: \(\) => modes, player: \(\) => player \}\);/);
  assert.match(line('    onPreTransition: () => {'), /doorToken\.entering\(\);/);
  assert.match(line('    onDungeonLeave: () => {'), /doorToken\.leaving\(\);/);
  assert.match(line('    onInteriorLeave: () => {'), /doorToken\.leaving\(\);/);
  const tp = src.indexOf('async function _teleportToPixel(');
  assert.match(src.slice(tp, tp + 1200), /\n {4}dwTeleported\(performance\.now\(\) \/ 1000\); doorToken\.jumping\(\);/);
  const tick = src.indexOf('\n    online.tick();\n');
  assert.ok(tick > 0 && /\n {4}hccParkTick\(now\); doorToken\.frame\(\);/.test(src.slice(tick, tick + 6000)), 'each online frame, after the room\'s tick');
});
