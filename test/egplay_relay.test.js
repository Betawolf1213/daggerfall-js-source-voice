// EG-PLAY (2026-10-11, the Elite Gates arc; bible/11-Multiplayer/Elite-Gates.md section 23): THE ELITE BREACH ON THE
// RELAY - the hub opening a breach on the service's signed order (the company frozen from the opener's party, the seed
// drawn, the room opened, the call said), the breach's room admitting its company alone with each member's own signed
// admission (spent once), and its director's beat on the room's alarm: the first hall waking once the company stands on
// its plate, the rifts broken by blows the gate's purse judges, the door, the step through it and the pull to the next
// hall, a death's fall and its end receipt, the wipe. The real Room over fake objects (test/fakeRoom.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { Room } from '../server/src/index.js';
import worker from '../server/src/index.js';
import { fakeRooms, fakeRoom } from './fakeRoom.mjs';
import { SOCIAL_ROOM, EG_KEY, egCallKey, validEgOut, validEgIn, EG_KINDS, EG_OUT_KINDS, relaySupportsEg, EG_RELAY_MIN, parseClient } from '../src/net/wire.js';
import { egRoomKey, egHallOf, EG_SEALED_MS, EG_GATHER_MS } from '../src/net/egLaw.js';
import { mintEgOrder } from '../src/net/identityToken.js';
import { readEgReceipt } from '../src/net/egReceipt.js';
import { realmToDungeon } from '../src/net/sdBrain.js';

const { subtle } = globalThis.crypto;
const T0 = 1_800_000_000_000;
const B = '0123456789abcdef';
const SITE = { px: 300, py: 200, x: 1000, y: 0, z: 2000, yaw: 0 };
/** A Spire-frame point as a pose in the dungeon's frame. */
const at = (sx, z, extra = {}) => { const [x, y, dz] = realmToDungeon(sx, 0, z); return { x, y, z: dz, yaw: 0, pitch: 0, ...extra }; };
const egs = (ws) => ws.sent.filter((m) => m.t === 'eg');
const quiet = async (fn) => { const w = console.warn; console.warn = () => {}; try { return await fn(); } finally { console.warn = w; } };

/** A hub and a breach opened by `acct-mac` (alone, or with `acct-ann` in its party). */
async function withBreach(fn, { party = false } = {}) {
  const realNow = Date.now;
  let clock = T0;
  Date.now = () => clock;
  const world = fakeRooms({ now: () => clock });
  const hub = world.room(SOCIAL_ROOM);
  try {
    await quiet(async () => {
      const mac = hub.connect(); await hub.hello(mac, 'peer-mac', null, { name: 'Mac', acct: 'acct-mac', asecret: 'secret-of-acct-mac', kind: 'linked' });
      let ann = null;
      if (party) {
        ann = hub.connect(); await hub.hello(ann, 'peer-ann', null, { name: 'Ann', acct: 'acct-ann', asecret: 'secret-of-acct-ann', kind: 'linked' });
        await hub.raw(mac, JSON.stringify({ t: 'social', act: 'invite', to: 'acct-ann' }));
        const inv = hub.store.get('acct:acct-ann')?.invites?.[0];
        if (inv) await hub.raw(ann, JSON.stringify({ t: 'social', act: 'join', party: inv.party }));
      }
      const order = await mintEgOrder({ o: 'egopen', s: 'acct-mac', eb: B, ez: 'z'.repeat(20) }, (await hub.signer()).privateKey, { subtle, nowS: Math.floor(clock / 1000) });
      await hub.raw(mac, JSON.stringify({ t: 'eg', k: 'open', z: order, site: SITE }));
      const eg = world.room(egRoomKey(B));
      const beat = async (ms) => { const end = clock + ms; while (eg.alarm.at != null && eg.alarm.at <= end) { clock = Math.max(clock, eg.alarm.at); await eg.fire(); } clock = end; };
      const admit = async (sub, ez = 'a'.repeat(20)) => mintEgOrder({ o: 'egadmit', s: sub, eb: B, ez }, (await eg.signer()).privateKey, { subtle, nowS: Math.floor(clock / 1000) });
      await fn({ world, hub, mac, ann, eg, beat, admit, step: (ms) => { clock += ms; }, now: () => clock });
    });
  } finally { Date.now = realNow; }
}

test('EG-PLAY THE WIRE: a breach\'s words each way, projected and bounded - the open (its order and the landing), the admission, the door, the way home and the gate\'s three blows; the call, the state, a stage, the company, a fall, a Redoubt, a receipt, the end, a refusal and the fight in the gate\'s own words; a relay before it is sent nothing (mutants: an open with no landing; a company of nine; a fight word unchecked)', () => {
  assert.deepEqual([...EG_KINDS], ['open', 'in', 'down', 'home', 'hit', 'ahit', 'xhit']);
  assert.ok(EG_OUT_KINDS.includes('call') && EG_OUT_KINDS.includes('fst') && EG_OUT_KINDS.includes('adie'));
  assert.equal(validEgIn({ k: 'open', z: 'v1.abc.def' }), null, 'an open names where its company answers from');
  assert.deepEqual(validEgIn({ k: 'open', z: 'v1.abc.def', site: SITE, junk: 1 }), { k: 'open', z: 'v1.abc.def', site: SITE });
  assert.deepEqual(validEgIn({ k: 'in', z: 'v1.a.b', lv: 20, bv: 1 }), { k: 'in', z: 'v1.a.b', lv: 20, bv: 1 });
  assert.deepEqual(validEgIn({ k: 'xhit', c: 2, q: 1, d: 40, r: 0 }), { k: 'xhit', c: 2, q: 1, d: 40, r: 0 });
  assert.equal(validEgIn({ k: 'hit', q: 1, d: -1, r: 0 }), null);
  const co = (n) => Array.from({ length: n }, (_, i) => [`acct-m${i}`, `M${i}`, (i % 8) + 1]);
  assert.ok(validEgOut({ k: 'call', b: B, o: 'Mac', os: 'acct-mac', seed: 7, op: T0, rh: 0, co: co(8), site: SITE }));
  assert.equal(validEgOut({ k: 'call', b: B, o: 'Mac', os: 'acct-mac', seed: 7, op: T0, rh: 0, co: co(9), site: SITE }), null, 'a company of nine');
  assert.equal(validEgOut({ k: 'ad', w: 0, m: 10, a: [[1, 999, 0]], at: T0 }), null, 'a fight word past the gate\'s bound');
  assert.ok(validEgOut({ k: 'ad', w: 0, m: 10, a: [[1, 10, 0]], at: T0 }));
  assert.equal(validEgOut({ k: 'end', why: 'tear', at: T0 }).why, 'tear');
  assert.deepEqual(parseClient(JSON.stringify({ t: 'eg', k: 'home' }), { hasHello: true }), { t: 'eg', k: 'home' });
  assert.equal(relaySupportsEg(`world${EG_RELAY_MIN - 1}`), false);
  assert.equal(relaySupportsEg(`world${EG_RELAY_MIN}`), true);
});

test('EG-PLAY THE OPEN AND THE CALL: the hub verifies the service\'s order (its own account\'s), freezes the company, opens the breach\'s room and says the call - kept for the account\'s next hello; an order of another account opens nothing (mutants: the order unverified; the call never kept)', async () => {
  await withBreach(async ({ hub, mac, eg }) => {
    const rec = eg.store.get(EG_KEY);
    assert.equal(rec.b, B);
    assert.deepEqual(rec.co, [{ sub: 'acct-mac', name: 'Mac', n: 1 }]);
    const call = egs(mac).find((m) => m.k === 'call');
    assert.ok(call, 'the opener hears the call');
    assert.deepEqual([call.b, call.os, call.seed, call.op], [B, 'acct-mac', rec.seed, rec.op]);
    assert.ok(hub.store.get(egCallKey('acct-mac')), 'kept for its next hello');
    assert.ok(validEgOut(call));
  });
  // another account's order: nothing opened
  const realNow = Date.now;
  try {
    const world = fakeRooms();
    const hub = world.room(SOCIAL_ROOM);
    await quiet(async () => {
      const ws = hub.connect(); await hub.hello(ws, 'peer-x', null, { name: 'X', acct: 'acct-xxxx', asecret: 'secret-of-acct-xxxx', kind: 'linked' });
      const order = await mintEgOrder({ o: 'egopen', s: 'acct-other', eb: B, ez: 'z'.repeat(20) }, (await hub.signer()).privateKey, { subtle, nowS: Math.floor(Date.now() / 1000) });
      await hub.raw(ws, JSON.stringify({ t: 'eg', k: 'open', z: order, site: SITE }));
      assert.equal(world.made.has(egRoomKey(B)), false, 'no room opened for an order that is not its sender\'s');
      assert.equal(egs(ws).at(-1)?.k, 'no');
    });
  } finally { Date.now = realNow; }
});

test('EG-PLAY THE ROOM: it admits its company alone, inside the open window - a stranger refused, the opener\'s admission spent once; the first hall wakes EG_GATHER_MS after the company stands on its plate and the count runs from thirty minutes; the rifts break under blows from the floor, the door opens, a step through it pulls the company to the next hall (mutants: a stranger admitted; an order spent twice; the hall woken before the gather)', async () => {
  await withBreach(async ({ eg, beat, admit, step }) => {
    const spec = egHallOf(eg.store.get(EG_KEY).seed, 1);
    // before the open: closed
    const early = eg.connect(); await eg.hello(early, 'peer-mac', at(spec.x0 + spec.arrive.x, spec.arrive.z), { kind: 'linked', tokenSub: 'acct-mac', charLevel: 20 });
    assert.equal(early.closed?.reason, 'the breach is closed', 'sealed: nobody yet');
    step(EG_SEALED_MS); await beat(1000);
    assert.equal(eg.store.get(EG_KEY).sg, 'arrive');
    const stranger = eg.connect(); await eg.hello(stranger, 'peer-st', at(0, 0), { kind: 'linked', tokenSub: 'acct-strange' });
    assert.equal(stranger.closed?.reason, 'the breach answers only to its company');
    const ws = eg.connect(); await eg.hello(ws, 'peer-mac', at(spec.x0 + spec.arrive.x, spec.arrive.z), { kind: 'linked', tokenSub: 'acct-mac', charLevel: 20 });
    assert.equal(ws.closed, null);
    const z = await admit('acct-mac');
    await eg.raw(ws, JSON.stringify({ t: 'eg', k: 'in', z, lv: 20, bv: 1 }));
    assert.equal(eg.store.get(EG_KEY).mem['acct-mac'].in, 1);
    await eg.raw(ws, JSON.stringify({ t: 'eg', k: 'in', z, lv: 20, bv: 1 }));
    assert.equal(egs(ws).at(-1).m, 'the order is spent');
    // the gather
    await eg.pose(ws, at(spec.x0 + spec.arrive.x, spec.arrive.z));
    await beat(EG_GATHER_MS - 1000);
    assert.equal(eg.store.get(EG_KEY).sg, 'arrive', 'not before the gather is done');
    await eg.pose(ws, at(spec.x0 + spec.arrive.x, spec.arrive.z));
    await beat(2000);
    const rec = eg.store.get(EG_KEY);
    assert.equal(rec.sg, 'trial');
    assert.equal(rec.cnt.left, 1_800_000);
    assert.ok(rec.cnt.at > 0, 'the count runs');
    const fst = egs(ws).find((m) => m.k === 'fst');
    assert.ok(fst && fst.f.cx, 'the rifts said as the gate\'s crystals');
    // break the rifts from beside each one (the legion's bodies struck down as they rise)
    let q = 1;
    for (let guard = 0; guard < 2000 && eg.store.get(EG_KEY).sg === 'trial'; guard++) {
      const cur = eg.store.get(EG_KEY);
      const rifts = cur.F.rifts.c, c = rifts.findIndex((r) => r.h > 0);
      const add = cur.F.lg.ads[0];
      if (add) { await eg.pose(ws, at(spec.x0 + add.x, add.z + 1)); await eg.raw(ws, JSON.stringify({ t: 'eg', k: 'ahit', i: add.i, q: q++, d: 60, r: 0 })); }
      else if (c >= 0) { await eg.pose(ws, at(spec.x0 + rifts[c].x, rifts[c].z + 1.5)); await eg.raw(ws, JSON.stringify({ t: 'eg', k: 'xhit', c, q: q++, d: 60, r: 0 })); }
      await beat(300);
    }
    assert.equal(eg.store.get(EG_KEY).sg, 'closing', 'the last rift closed opens the door');
    assert.ok(egs(ws).some((m) => m.k === 'cxb'));
    await eg.pose(ws, at(spec.x0 + spec.end.x, spec.end.z));
    await eg.raw(ws, JSON.stringify({ t: 'eg', k: 'down', h: 1 }));
    await beat(500);
    const after = eg.store.get(EG_KEY);
    assert.deepEqual([after.h, after.sg], [2, 'arrive'], 'the step through pulls the company to Hall 2');
    assert.equal(after.cnt.at, 0, 'the pull holds the count');
  });
});

test('EG-PLAY ONE LIFE: a death in the breach is the member\'s fall - said to all, its end receipt (`e1`, kind x, why fall) minted to its socket; no member living, the breach ends a wipe and its room beats no more (mutants: a death that costs nothing; the end never said)', async () => {
  await withBreach(async ({ eg, beat, admit, step }) => {
    const spec = egHallOf(eg.store.get(EG_KEY).seed, 1);
    step(EG_SEALED_MS); await beat(1000);
    const ws = eg.connect(); await eg.hello(ws, 'peer-mac', at(spec.x0, 0), { kind: 'linked', tokenSub: 'acct-mac', charLevel: 20 });
    await eg.raw(ws, JSON.stringify({ t: 'eg', k: 'in', z: await admit('acct-mac'), lv: 20, bv: 1 }));
    await eg.pose(ws, at(spec.x0, 0));
    await beat(EG_GATHER_MS + 1000);
    assert.equal(eg.store.get(EG_KEY).sg, 'trial');
    await eg.pose(ws, at(spec.x0, 0, { dd: 1 }));
    await beat(1000);
    const rec = eg.store.get(EG_KEY);
    assert.equal(rec.mem['acct-mac'].alive, 0);
    assert.equal(rec.end, 'wipe');
    assert.ok(egs(ws).some((m) => m.k === 'fall' && m.s === 'acct-mac'));
    assert.ok(egs(ws).some((m) => m.k === 'end' && m.why === 'wipe'));
    const r = egs(ws).find((m) => m.k === 'rcpt');
    assert.ok(r, 'the end receipt minted to its socket');
    const c = readEgReceipt(r.r);
    assert.deepEqual([c.q, c.why, c.b, c.s, c.z], ['x', 'fall', B, 'acct-mac', 'z'.repeat(20)]);
    eg.alarm.at = null;
    assert.equal(await eg.room._egTick(), false, 'an ended breach beats no more');
  });
});

test('EG-PLAY THE WORKER: an `eg:` key that is not a breach\'s mints no object (404); the room\'s internal door opens one breach and answers the same order again with its record, another order 409 (mutants: the prefix gate gone; a second open over the first)', async () => {
  const res = await worker.fetch(new Request('https://relay.invalid/room/eg:nothex', { headers: { Upgrade: 'websocket' } }), { ROOMS: null });
  assert.equal(res.status, 404);
  const r = fakeRoom(egRoomKey(B));
  const tell = { b: B, ez: 'z'.repeat(20), s: 'acct-mac', o: 'Mac', ew: 0, rh: 0, seed: 9, op: T0, co: [['acct-mac', 'Mac', 1]], site: SITE };
  const post = (body) => r.room.fetch(new Request('https://relay.internal/internal/eg/open', { method: 'POST', body: JSON.stringify(body) }));
  const a = await post(tell);
  assert.equal(a.status, 200);
  assert.deepEqual(await (await post(tell)).json(), { ok: true, seed: 9, op: T0 });
  assert.equal((await post({ ...tell, ez: 'y'.repeat(20) })).status, 409);
  assert.equal((await post({ ...tell, co: [] })).status, 400);
  assert.ok(Room);
});
