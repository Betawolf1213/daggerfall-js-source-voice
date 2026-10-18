// GRANT2 (2026-10-18, Mac: "Lets build the plan"; bible/11-Multiplayer/Spawn-Grants.md section 12): THE CLIENT'S ASKS -
// net/online.js reads its cell's law off the welcome (`gm`, from world218), asks down its own cell's socket alone on the
// relay's own bucket, and hears the answer; scenes/grantHost.js asks for the encounters and camps scenes/world.js stands,
// never awaited; world.js wires it at both stands.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { OnlineSession } from '../../src/net/online.js';
import { cellRoomOfWire, PIXEL_UNITS } from '../../src/net/wire.js';
import { fakeSocketClass } from '../fakeSocket.mjs';
import { GRANT_BURST_MAX } from '../../src/net/grantLaw.js';
import { createGrantHost } from '../../src/scenes/grantHost.js';

const ON = { x: 402 * PIXEL_UNITS + 100, y: 60, z: (499 - 151) * PIXEL_UNITS + 100, yaw: 0 };
const CELL = cellRoomOfWire(ON.x, ON.z);
const quiet = (fn) => { const l = console.log, w = console.warn; console.log = console.warn = () => {}; try { return fn(); } finally { console.log = l; console.warn = w; } };

function rig(room, welcome = {}) {
  const { FakeWS, sockets } = fakeSocketClass();
  let t = 1000;
  const s = new OnlineSession({ url: 'wss://relay.test', name: 'a', id: 'aaaa-0001', secret: 'secret-of-aaaa-0001', WebSocketImpl: FakeWS, now: () => t });
  const heard = [];
  s.onGrant = (g) => heard.push(g);
  quiet(() => s.join(room, { ...ON }));
  const ws = sockets[0];
  ws.open();
  quiet(() => ws.receive({ t: 'welcome', id: 'aaaa-0001', peers: [], host: 'aaaa-0001', world: null, v: 'world218', gm: 'measure', ...welcome }));
  const out = () => ws.sent.map((x) => JSON.parse(x)).filter((x) => x.t === 'grant');
  return { s, ws, heard, out, sockets, tick: (ms) => { t += ms; } };
}

test('GRANT2 THE SESSION: a cell\'s welcome from world218 says its law; an older relay\'s, a place\'s or `off` asks nothing (an older relay closes the socket on one); an ask goes down my cell\'s socket whole, on the relay\'s own bucket; my cell\'s answer is heard, and its `off` stops the asks (mutants: the version unchecked; the bucket not kept)', () => {
  const old = rig(CELL, { v: 'world217' });
  assert.equal(old.s.grantMode, 'off');
  assert.equal(old.s.sendGrant({ k: 'mint', id: 1, kind: 'enc', n: 1 }), false);
  assert.equal(old.out().length, 0, 'nothing on the wire of a relay that would close the socket for it');
  assert.equal(rig('dungeon:m123456').s.grantMode, 'off', 'a cell\'s law alone');
  assert.equal(rig(CELL, { gm: 'off' }).s.grantMode, 'off');
  assert.equal(rig(CELL, { gm: undefined }).s.grantMode, 'off', 'a welcome that says no law');
  const { s, ws, heard, out, tick } = rig(CELL);
  assert.equal(s.grantMode, 'measure');
  assert.equal(s.sendGrant({ k: 'mint', id: 1, kind: 'enc', n: 5 }), false, 'past its kind: never sent');
  assert.equal(s.sendGrant({ k: 'mint', id: 1, kind: 'enc', n: 3 }), true);
  assert.deepEqual(out(), [{ t: 'grant', k: 'mint', id: 1, kind: 'enc', n: 3 }]);
  for (let i = 1; i < GRANT_BURST_MAX; i++) assert.equal(s.sendGrant({ k: 'mint', id: 1 + i, kind: 'camp', n: 4 }), true);
  assert.equal(s.sendGrant({ k: 'mint', id: 99, kind: 'enc', n: 1 }), false, 'the relay\'s bucket, kept at home');
  tick(500);
  assert.equal(s.sendGrant({ k: 'mint', id: 99, kind: 'enc', n: 1 }), true, 'two a second');
  ws.receive({ t: 'grant', k: 'no', id: 99, r: 'bucket' });
  ws.receive({ t: 'grant', k: 'no', id: 99, r: 'because' });
  assert.deepEqual(heard, [{ k: 'no', id: 99, r: 'bucket' }], 'an answer read whole');
  ws.receive({ t: 'grant', k: 'off', id: 100 });
  assert.equal(s.grantMode, 'off', 'the law turned off: no more asks');
  tick(5000);
  assert.equal(s.sendGrant({ k: 'mint', id: 101, kind: 'enc', n: 1 }), false);
});

test('GRANT2 THE HOST: an ask names its own id and goes when the session takes it, never awaited; the answers counted; world.js asks for each wanderer group and each camp as they stand, and hears its cell (mutants: the camp\'s ask dropped; the encounter\'s count not the stood one)', () => {
  const sent = [];
  let session = null;
  const g = createGrantHost({ online: () => session });
  assert.equal(g.ask('enc', 2), false, 'offline: nothing');
  session = { sendGrant: (a) => { sent.push(a); return a.n < 5; } };
  assert.equal(g.ask('enc', 2), true);
  assert.equal(g.ask('camp', 6), false);
  assert.deepEqual(sent.map((a) => [a.id, a.kind, a.n]), [[1, 'enc', 2], [2, 'camp', 6]], 'each ask its own id');
  g.answer({ k: 'ok' }); g.answer({ k: 'no' }); g.answer({ k: 'off' }); g.answer({ k: 'asked' }); g.answer(null);
  assert.deepEqual(g.stats(), { asked: 1, ok: 1, no: 1, off: 1 });
  const W = readFileSync(new URL('../../src/scenes/world.js', import.meta.url), 'utf8');
  assert.match(W, /const _n = wandererCount\(hit\.mobileType, partyExtraFoes\(partySize\(\)\), _company\);[^\n]*\n\s*grants\.ask\('enc', _n\);[^\n]*\n\s*for \(let k = 0; k < _n; k\+\+\) _standEncounterFoe\(hit, playerFeet\);/, 'the wanderers\' count asked, then stood');
  assert.match(W, /room -= size;\n\s*_standCampEncounter\(h, player\.feetAt\(\)\);\n\s*grants\.ask\('camp', size\);/, 'the group as it stands');
  assert.match(W, /const grants = createGrantHost\(\{ online: \(\) => online \}\);/);
  assert.match(W, /online\.onGrant = \(g\) => grants\.answer\(g\);/);
});
