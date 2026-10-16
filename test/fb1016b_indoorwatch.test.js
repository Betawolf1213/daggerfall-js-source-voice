// INDOOR-WATCH (FIELD BUGS 2026-10-16, bible/01-Overview/Field-Bugs-2026-10-16b.md; the Discord: "If you just sit near
// the wall between the shelves, when you fail to steal something, the guard will come running, but they simply can't
// reach you because they run into the wall instead of going through the door. And you can sit like that for as long as
// you like"). The watch called into a building (cityGuards.js, PlayerEntity.SpawnCityGuards' indoor arm) walked the
// classic motor, which steers straight at the player and slides along the first wall it meets; a navmesh existed and
// only the dungeon baked one (ENHANCED AI 3b-4; "ENHANCED AI 5 - exteriors and interiors ... RMB interiors" stood open).
// scenes/interiorNav.js is the interior's: mounted with the room by the mode machine, handed to both of its pools, its
// frame before they step - the bake, the routes, and NO ROUTE (a watchman cut off is stood on the player's island).
// Pinned BY EXECUTION on the real watch pool and the real module over a real Collider - a shop with a partition and a
// doorway, shelves against the partition's far face, the player tucked between two of them - and the real NavClient
// (no worker in node: its own fallback bakes here). The host's wiring is pinned in its source.
import './modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Collider } from '../src/player/collider.js';
import { ActionSystem } from '../src/world/actionSystem.js';
import { createCityGuards, indoorWatchSpot, GUARD_INDOOR_DOOR_OFFSET } from '../src/scenes/cityGuards.js';
import { createExteriorFoes } from '../src/scenes/exteriorFoes.js';
import {
  createInteriorNav, doorsOutOfSoup, polyUnder, sameIsland, islandOf, noRouteSpot, feetAnchors, huntsThePlayer, CUT_OFF_S, CHECK_S, STAND_CLEAR_M, STAND_CROWD_M,
} from '../src/scenes/interiorNav.js';
import { NavClient } from '../src/ai/navClient.js';
import { EnhancedEnemyAI } from '../src/ai/enhancedMotor.js';
import { EnemyAI, MELEE_DISTANCE } from '../src/characters/enemyMotor.js';
import { bodyFits } from '../src/characters/foeSpacing.js';
import { tickTactics } from '../src/ai/tacticsClock.js';
import { setPref } from '../src/systems/uiPrefs.js';

const rd = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const tick = () => new Promise((r) => setImmediate(r));
const Id = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

/** A solid's six faces, each looking out - the game's own winding (a floor looks up; foeSpacing.js and the stand's floor
 *  read a face by it). */
function boxSoup(x0, y0, z0, x1, y1, z1) {
  const P = [], I = [];
  const q = (...v) => { const o = P.length / 3; for (const p of v) P.push(...p); I.push(o, o + 1, o + 2, o, o + 2, o + 3); };
  q([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]); q([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
  q([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]); q([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
  q([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]); q([x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]);
  return { positions: new Float32Array(P), indices: new Uint32Array(I) };
}
/** THE REPORTER'S SHOP: 12 x 12 m, the street door in the south wall (z = 0), a partition at z 6-6.2 with a 1.2 m doorway
 *  at x 1-2.2, shelves 1.5 m wide against the partition's far face with 0.9 m between them, and the player tucked in the
 *  third gap, against the partition - the straight line from the door to them runs into the partition. `locked` hangs a
 *  locked swing door in the doorway (an action door, ActionSystem.addDoor - its own collider bucket). */
const PARTITION_Z = 6;
function shop({ locked = 0 } = {}) {
  const c = new Collider(() => -Infinity);
  const solid = (...b) => { const s = boxSoup(...b); c.addMesh('interior', s.positions, s.indices, Id); };
  solid(-0.2, -0.2, -0.2, 12.2, 0, 12.2);
  solid(-0.2, 0, -0.2, 12.2, 3, 0); solid(-0.2, 0, 12, 12.2, 3, 12.2); solid(-0.2, 0, 0, 0, 3, 12); solid(12, 0, 0, 12.2, 3, 12);
  solid(0, 0, PARTITION_Z, 1, 3, 6.2); solid(2.2, 0, PARTITION_Z, 12, 3, 6.2);
  const shelves = [];
  for (let x = 3; x + 1.5 < 12; x += 2.4) { solid(x, 0, 6.2, x + 1.5, 1.8, 6.8); shelves.push(x); }
  const actions = new ActionSystem(c);
  const inner = locked ? actions.addDoor(boxSoup(1, 0, 6.05, 2.2, 2.4, 6.15), Id, { startingLockValue: locked }) : null;
  const player = [shelves[2] + 1.95, 0, 6.56];
  const door = { centre: { x: 8, y: 1.2, z: 0 }, normal: { x: 0, y: 0, z: 1 }, size: { x: 1.2, y: 2.4, z: 0.2 }, matrix: Id };
  return { collider: c, actions, inner, player, door, ctx: { collider: c, actions, doors: [door], waysIn: [] } };
}

// the watch1 rig's synthetic CLASS18.CFG (disc19.test.js, fb1012e_watchleaves.test.js) - the real spawn, no ARENA2
function stubClassCfg() {
  const b = new Uint8Array(80); const v = new DataView(b.buffer);
  v.setUint16(52, 10, true);
  for (let i = 0; i < 8; i++) v.setUint16(58 + i * 2, 50, true);
  return b;
}
function craftCfg() {
  const b = new Uint8Array(74); const v = new DataView(b.buffer);
  b[10] = 0x08; v.setUint16(52, 4, true);
  [40, 50, 50, 85, 50, 50, 90, 55].forEach((a, i) => v.setUint16(58 + i * 2, a, true));
  return b;
}
function craftMonsterBsa(records) {
  const dataLen = records.reduce((a, [, b]) => a + b.length, 0);
  const out = new Uint8Array(4 + dataLen + 18 * records.length); const v = new DataView(out.buffer);
  v.setInt16(0, records.length, true); v.setUint16(2, 0x0100, true);
  let pos = 4;
  for (const [, bytes] of records) { out.set(bytes, pos); pos += bytes.length; }
  for (const [name, bytes] of records) { for (let i = 0; i < name.length; i++) out[pos + i] = name.charCodeAt(i); v.setInt32(pos + 14, bytes.length, true); pos += 18; }
  return out;
}
const bsa = craftMonsterBsa([['ENEMY000.CFG', craftCfg()]]);
const stubTex = { getSize: () => ({ width: 64, height: 100 }), getScale: () => ({ width: 0, height: 0 }), recordCount: 8, getFrameCount: () => 4 };
const fetchBytes = async (n) => { if (n === 'CLASS18.CFG') return stubClassCfg(); if (n === 'MONSTER.BSA') return bsa; throw new Error(`no ${n} in this pin`); };
const thief = () => ({ level: 1, reflexes: 2, skills: new Array(40).fill(20), skillUses: new Array(40).fill(0), items: [], activeEffects: [],
  stats: { strength: 50, agility: 50, luck: 50, speed: 50, endurance: 50, willpower: 50, intelligence: 50, personality: 50 },
  health: 100000, maxHealth: 100000, crimeCommitted: 5 });   // a failed theft's crime stands: the watch hunts, and never despawns
const poolDeps = (playerEntity, collider, over = {}) => ({
  renderer: { createBillboardBatch: () => ({}), destroyBillboardBatch: () => {}, textures: new Map() },
  collider, fetchBytes, getTexture: async () => stubTex, uploadRecordFrame: () => {},
  currentMinute: () => 523530, playerEntity, audio: null, onPlayerHurt: () => {}, rand: () => 0.9, say: () => {},
  playerInside: true, ...over,
});
/** The real NavClient, as the module makes it (no cache) - no Worker in node, so its own fallback bakes on this thread. */
const realClient = () => new NavClient({ store: null, WorkerCtor: undefined });
/** Math.random seeded for one run (makeEnemyEntity's level roll, the brain's ring slot) - every run the same run. */
async function seeded(fn, seed = 20261016) {
  const real = Math.random;
  let a = seed >>> 0;
  Math.random = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  try { return await fn(); } finally { Math.random = real; }
}
const flat = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

/** The crime: the watch called into the shop (the host's spawnCityGuardsInside - the room's own doors, its origin, an
 *  open shop), then `seconds` of the host's frame - the module's frame before the pool steps, as worldModes runs them,
 *  the brain's clock ticked as every host ticks it. Answers what the run saw. */
async function crime(S, { nav = null, seconds = 30 } = {}) {
  const p = thief();
  const guards = createCityGuards(poolDeps(p, S.collider, { nav }));
  await guards.spawnCityGuards(true, { playerFeet: S.player, playerFwd: [0, 0, 1], pool: [], interior: { doors: S.ctx.doors, origin: [6, 0, 6], eligible: true } });
  const spawned = guards.guards.map((g) => [...g.ai.feet]);
  const eye = [S.player[0], 1.6, S.player[2]];
  const seen = { reach: null, sight: false, swing: false, stood: [], landed: null, firstStand: null, crossed: false };
  const dt = 1 / 30;
  for (let f = 0; f < seconds / dt; f++) {
    const n = nav ? nav.frame(dt, S.player, guards.guards, true) : 0;
    if (n) { seen.stood.push(...guards.guards.map((g) => [...g.ai.feet])); seen.firstStand ??= f * dt; }
    if (nav?.chf() && seen.landed == null) seen.landed = f * dt;
    tickTactics(dt);
    guards.update(dt, S.player, eye, {});
    if (f % 15 === 0) await tick();   // the bake's promise lands between frames
    for (const g of guards.guards) {
      if (g.ai.inSight) seen.sight = true;
      if (g.ai.feet[2] > PARTITION_Z) seen.crossed = true;
      if (g.attack.swingSeq > 0) seen.swing = true;
      if (seen.reach == null && g.ai.inSight && flat(g.ai.feet, S.player) <= MELEE_DISTANCE) seen.reach = f * dt;
    }
  }
  return { guards, spawned, seen, p };
}

test('INDOOR-WATCH THE REPORT: the watch called into the shop comes through the doorway - with the room\'s mesh a watchman spawned at the street door reaches melee of the player tucked between the shelves behind the partition, sees them and swings; the old wiring (no mesh, the classic motor) runs into the partition for thirty seconds and never sees them (mutants: the pool\'s motor; the mesh unread; the frame\'s budget)', async () => {
  await seeded(async () => {
    const S = shop();
    // the watch stands where the indoor arm stands it: the street door's spot, its lanes - the player's side of the
    // partition is not where it starts, and the straight line from there runs into the partition
    const before = await crime(S, { seconds: 30 });
    assert.ok(before.spawned.length >= 2 && before.spawned.every((f) => f[2] < 3), `2-5 at the street door (${before.spawned.map((f) => f[2].toFixed(1))})`);
    assert.ok(before.guards.guards.every((g) => g.ai.constructor === EnemyAI), 'no mesh handed: the classic motor');
    assert.deepEqual([before.seen.sight, before.seen.swing, before.seen.crossed, before.seen.reach], [false, false, false, null],
      'THE REPORT: thirty seconds against the partition - never through the doorway, never a sight of the player, never a swing');

    const nav = createInteriorNav({ makeClient: realClient });
    nav.mount(S.ctx, [8, 0, 1.5]);
    const after = await crime(S, { nav, seconds: 30 });
    assert.ok(after.guards.guards.every((g) => g.ai instanceof EnhancedEnemyAI), 'the room\'s mesh handed and the switch on: the routes');
    assert.ok(after.seen.landed != null && after.seen.landed < 2, `the room baked when the watch first read it (${after.seen.landed})`);
    assert.ok(after.seen.crossed, 'through the doorway');
    assert.ok(after.seen.reach != null && after.seen.reach < 20, `a watchman in melee reach, the player in his sight (${after.seen.reach} s)`);
    assert.ok(after.seen.swing, 'and he swings');
    assert.deepEqual(after.seen.stood, [], 'a route there: nobody is stood (NO ROUTE is for a room the routes cannot reach)');
    assert.ok(after.guards.guards.some((g) => g.ai.navStats.repaths > 0), 'the routes were solved');
    nav.release();
  });
});

test('INDOOR-WATCH NO ROUTE: a locked door in the doorway - the routes cannot reach the player\'s room, so after CUT_OFF_S each watchman is stood on the player\'s island, at the spot nearest where he stood: past the partition, never on the player, never in another, in nothing, on its floor; then he reaches melee and swings (mutants: the cut-off; the island test; the knee\'s line; the clearance; the crowd; standAt\'s route)', async () => {
  await seeded(async () => {
    const S = shop({ locked: 20 });
    assert.ok(!doorsOutOfSoup(S.actions).has(S.inner.key), 'a locked door stays in the soup - a wall the routes go round');
    const nav = createInteriorNav({ makeClient: realClient });
    nav.mount(S.ctx, [8, 0, 1.5]);
    const r = await crime(S, { nav, seconds: 30 });
    const chf = nav.chf();
    assert.ok(chf, 'baked');
    assert.equal(sameIsland(chf, [8, 0, 3], S.player, { collider: S.collider }), false, 'the door\'s room and the player\'s: two islands');
    assert.equal(polyUnder(chf, S.player, { collider: S.collider }) >= 0, true, 'the player between the shelves stands on the far room\'s island (the knee\'s line to the aisle)');
    const rings = feetAnchors(S.collider, S.player);
    assert.ok(rings.length > 1 && rings.every((a) => a[2] > 6.2 && !(a[2] < 6.8 && Math.abs(a[0] - S.player[0]) > 0.45)), 'the feet\'s anchors are the player\'s own room - never through the partition, never in a shelf');
    assert.ok(r.seen.firstStand != null, 'stood');
    assert.ok(r.seen.firstStand - r.seen.landed >= CUT_OFF_S - 1e-9, `not before CUT_OFF_S cut off (${(r.seen.firstStand - r.seen.landed).toFixed(2)} s after the bake)`);
    assert.ok(r.seen.firstStand - r.seen.landed <= CUT_OFF_S + 2 * CHECK_S + 1 / 30, 'and not long after');
    assert.equal(r.seen.stood.length, r.guards.guards.length, 'every watchman, once');
    for (const f of r.seen.stood) {
      assert.ok(f[2] > 6.2, `past the partition (${f.map((v) => v.toFixed(2))})`);
      assert.ok(flat(f, S.player) >= STAND_CLEAR_M - 1e-9, 'never on the player');
      assert.ok(bodyFits(S.collider, f), 'a body\'s room, in nothing');
      assert.ok(Math.abs(f[1]) < 0.05, 'on the floor');
    }
    for (let i = 0; i < r.seen.stood.length; i++) for (let j = i + 1; j < r.seen.stood.length; j++) {
      assert.ok(flat(r.seen.stood[i], r.seen.stood[j]) >= STAND_CROWD_M - 1e-9, 'never in another watchman');
    }
    assert.ok(r.seen.reach != null, 'then melee reach, the player in sight');
    assert.ok(r.seen.swing, 'and a swing');
    nav.release();
  });
});

test('INDOOR-WATCH THE BAKE: asked the first frame after a motor read the mesh (never for a room nobody walks, never with the switch off), anchored on the arrival, the ways in, every door\'s watch spot and the player\'s feet, the unlocked action doors out of the soup; asked again for a changed lock and for the hunted player off every island, one at a time, the latest kept; released, the worker goes and a late bake publishes nothing; the budget refilled every frame (mutants: the read gate; the switch; each anchor; the soup\'s lock test; the re-asks; the coalesce; dispose; the epoch)', async () => {
  const S = shop({ locked: 20 });
  const P0 = [5, 0, 3];   // the player in the front room, clear of the door's watch spot
  const calls = [], disposed = [];
  let hold = null;   // a bake held in flight, for the coalesce
  const makeClient = () => {
    const c = realClient();
    return { bake: (o) => { calls.push(o); const b = c.bake(o); return hold ? hold.then(() => b) : b; }, dispose: () => disposed.push(1) };
  };
  // the switch off: nothing bakes, whatever reads
  const off = createInteriorNav({ makeClient, enabled: () => false });
  off.mount(S.ctx, [8, 0, 1.5]); off.chf();
  for (let i = 0; i < 10; i++) off.frame(0.1, S.player, [], true);
  assert.equal(calls.length, 0, 'the classic lane bakes nothing');
  const nav = createInteriorNav({ makeClient });
  nav.mount(S.ctx, [8, 0, 1.5]);
  nav.world.pathBudget = 0;
  for (let i = 0; i < 10; i++) nav.frame(0.1, P0, [], true);
  assert.equal(nav.world.pathBudget, nav.world.budgetPerFrame, 'the routes\' budget refilled each frame (his enemy.js:404)');
  assert.equal(calls.length, 0, 'a room nobody walks bakes nothing');
  assert.equal(nav.chf(), null, 'a read: nothing yet');
  nav.frame(0.1, P0, [], true);
  assert.equal(calls.length, 1, 'the frame after a read asks once');
  const ask = calls[0];
  assert.deepEqual(ask.anchor, [8, 0, 1.5], 'anchored on the player\'s arrival');
  const spot = indoorWatchSpot([8, 1.2, GUARD_INDOOR_DOOR_OFFSET], [0, 0, 1], 0, S.collider);
  assert.ok(ask.anchors.some((a) => flat(a, spot) < 1e-9 && Math.abs(a[1] - spot[1]) < 1e-9), 'on the street door\'s watch spot - where the watch stands');
  assert.ok(ask.anchors.some((a) => a[0] === P0[0] && a[1] === P0[1] && a[2] === P0[2]), 'on the player\'s feet as it was asked');
  assert.ok(ask.anchors.filter((a) => flat(a, P0) > 0.4 && flat(a, P0) < 1.1).length >= 8, 'and the rings round them the knee reaches');
  assert.ok(!ask.exclude.has(S.inner.key), 'the locked door in the soup');
  for (let i = 0; i < 3; i++) { await tick(); nav.frame(0.1, P0, [], true); }
  const first = nav.chf();
  assert.ok(first?.mesh?.polys?.length, 'landed');
  assert.equal(nav.world.navEpoch, 1, 'every held route re-solved on it');
  // the lock picked: another soup - asked again, the door out of it
  S.inner.currentLockValue = 0;
  for (let i = 0; i < 3; i++) nav.frame(0.1, P0, [], true);
  assert.equal(calls.length, 2, 'a changed lock asks again');
  assert.ok(calls[1].exclude.has(S.inner.key), 'the unlocked door out of the soup - a foe opens it');
  for (let i = 0; i < 3; i++) { await tick(); nav.frame(0.1, P0, [], true); }
  assert.notEqual(nav.chf(), first, 'the new mesh stands');
  assert.equal(nav.world.navEpoch, 2);
  assert.equal(sameIsland(nav.chf(), [8, 0, 3], S.player, { collider: S.collider, skip: doorsOutOfSoup(S.actions) }), true, 'through the open door, one island');
  // ASYNC NEVER DROPS: locked again while a bake is in flight, then a second change - one more bake, the latest soup
  let release; hold = new Promise((res) => { release = res; });
  S.inner.currentLockValue = 20;
  for (let i = 0; i < 3; i++) nav.frame(0.1, P0, [], true);
  assert.equal(calls.length, 3); assert.equal(nav.baking, true);
  S.inner.currentLockValue = 0;
  for (let i = 0; i < 6; i++) nav.frame(0.1, P0, [], true);
  assert.equal(calls.length, 3, 'one at a time');
  hold = null; release();
  for (let i = 0; i < 3; i++) await tick();
  assert.equal(calls.length, 4, 'the change made in flight is asked the moment the one in flight lands - not dropped, not left for a later read');
  assert.ok(calls[3].exclude.has(S.inner.key), 'the latest soup');
  // released mid-bake, a change owed behind it: the slot first, then the worker - and the bake that lands late, in the
  // next building, publishes nothing there and asks nothing for it
  let late; hold = new Promise((res) => { late = res; });
  S.inner.currentLockValue = 20;
  for (let i = 0; i < 3; i++) nav.frame(0.1, P0, [], true);
  assert.equal(nav.baking, true);
  S.inner.currentLockValue = 0;
  for (let i = 0; i < 3; i++) nav.frame(0.1, P0, [], true);
  const epoch = nav.world.navEpoch, asked = calls.length;
  nav.release();
  assert.equal(disposed.length, 1, 'the room\'s worker let go with the room');
  assert.equal(nav.chf(), null, 'nothing of the room\'s stands');
  nav.mount(S.ctx, [8, 0, 1.5]);   // the next building
  hold = null; late();
  for (let i = 0; i < 6; i++) { await tick(); nav.frame(0.1, P0, [], true); }
  assert.equal(nav.world.navEpoch, epoch, 'the old room\'s bake re-solves no route of the new');
  assert.equal(calls.length, asked, 'and asks no bake for it');
  assert.equal(nav.chf(), null, 'the new room has no mesh until a motor reads it');
  nav.release();
  assert.equal(disposed.length, 1, 'a room nobody walked made no worker');
  nav.world.pathBudget = 0; nav.frame(0.1, P0, [], true);
  assert.equal(nav.world.pathBudget, nav.world.budgetPerFrame, 'refilled with no room too');
});

test('INDOOR-WATCH THE PLAYER OFF THE MESH: the room baked while the player stood at the door, the locked door a wall - the far room not kept; the player found there with the watch hunting them, the room is baked again with their feet among the anchors, and the watch is stood on their island (mutants: the off-mesh re-ask; the feet anchors; the cap)', async () => {
  await seeded(async () => {
    const S = shop({ locked: 20 });
    const calls = [];
    const nav = createInteriorNav({ makeClient: () => { const c = realClient(); return { bake: (o) => { calls.push(o); return c.bake(o); }, dispose() {} }; } });
    nav.mount(S.ctx, [8, 0, 1.5]);
    const p = thief();
    const guards = createCityGuards(poolDeps(p, S.collider, { nav }));
    await guards.spawnCityGuards(true, { playerFeet: [8, 0, 2], playerFwd: [0, 0, 1], pool: [], interior: { doors: S.ctx.doors, origin: [6, 0, 6], eligible: true } });
    const run = async (feet, seconds) => {
      for (let f = 0; f < seconds * 30; f++) {
        nav.frame(1 / 30, feet, guards.guards, true);
        tickTactics(1 / 30);
        guards.update(1 / 30, feet, [feet[0], 1.6, feet[2]], {});
        if (f % 15 === 0) await tick();
      }
    };
    await run([8, 0, 2], 1);   // asked at the door: the far room is behind a locked door nobody stands beyond
    assert.equal(calls.length, 1);
    assert.equal(polyUnder(nav.chf(), S.player, { collider: S.collider }), -1, 'the far room is not on the mesh');
    // the player is found beyond the door (a load, a teleport) - the watch still hunting them
    for (const g of guards.guards) g.ai.makeHostileToPlayer(600, S.player);
    await run(S.player, 1);
    assert.equal(calls.length, 2, 'baked again');
    assert.ok(calls[1].anchors.some((a) => flat(a, S.player) < 1e-9), 'with the player\'s feet');
    assert.ok(polyUnder(nav.chf(), S.player, { collider: S.collider }) >= 0, 'the far room kept');
    await run(S.player, CUT_OFF_S + 1);
    assert.ok(guards.guards.every((g) => g.ai.feet[2] > 6.2), 'every watchman stood on the player\'s island');
    // in the air (a jump, a levitation): on no island, and no bake for feet that stand on nothing
    const n0 = calls.length;
    for (const g of guards.guards) g.ai.makeHostileToPlayer(600, [5, 3, 9]);
    assert.equal(polyUnder(nav.chf(), [5, 3, 9], { collider: S.collider }), -1, 'three metres over the floor is on no island');
    for (let f = 0; f < 30; f++) nav.frame(1 / 30, [5, 3, 9], guards.guards, false);
    await tick();
    assert.equal(calls.length, n0, 'not grounded: not baked again');
    // a spot no bake keeps (a tabletop, under the bake's floor): asked again a few times at most, never every frame
    const n = calls.length;
    for (const x of [0.5, 2.5, 4.5, 6.5, 8.5, 10.5]) {
      for (const g of guards.guards) g.ai.makeHostileToPlayer(600, [x, 5, 3]);
      await run([x, 5, 3], 1.5);
    }
    assert.ok(calls.length - n <= 4, `the off-mesh re-asks are capped (${calls.length - n})`);
    nav.release();
  });
});

test('INDOOR-WATCH THE STAND: the spot nearest where he stood on the player\'s island - behind the locked door that stopped him, drawn into the floor a body\'s width; never within STAND_CLEAR_M of the player, never within STAND_CROWD_M of another, never in a crate set down after the bake; and standAt keeps the pursuit and drops the rest - the old route, the old floor\'s fall anchor, the detour (mutants: the inset; the clearance; the crowd; the body\'s room; standAt\'s route; its fall anchor)', async () => {
  const S = shop({ locked: 20 });
  const { chf } = await realClient().bake({ collider: S.collider, anchor: [8, 0, 1.5], anchors: feetAnchors(S.collider, S.player), exclude: doorsOutOfSoup(S.actions), key: 'stand' });   // the module's own anchors for the player
  const near = { collider: S.collider };
  assert.equal(sameIsland(chf, [2.5, 0, 5.65], S.player, near), false, 'the door\'s side and the player\'s: two islands');
  const theirs = islandOf(chf, polyUnder(chf, S.player, near));
  const stand = (from, others = []) => noRouteSpot(chf, S.collider, theirs, from, S.player, others);
  // behind the locked door: he stood at the partition beside the doorway - the far side of what stopped him
  const door = [2.5, 0, 5.65];
  const a = stand(door);
  assert.ok(a && a[2] > 6.2 && flat(a, door) <= 1.1, `the far side of the door, a stride from where he stood (${a?.map((v) => v.toFixed(2))})`);
  assert.ok(bodyFits(S.collider, a), 'a body\'s room');
  // in front of the player through the partition: the nearest spot is beside them - never within STAND_CLEAR_M
  const b = stand([S.player[0], 0, 5.65]);
  assert.ok(b && flat(b, S.player) >= STAND_CLEAR_M, `not on the player (${flat(b, S.player).toFixed(2)} m)`);
  // another already stands there: never within STAND_CROWD_M of him
  const c = stand(door, [a]);
  assert.ok(c && flat(c, a) >= STAND_CROWD_M, `not in another (${flat(c, a).toFixed(2)} m)`);
  // a crate set down there after the bake (the mesh does not know it): never in it
  const crate = boxSoup(a[0] - 0.4, 0, a[2] - 0.4, a[0] + 0.4, 0.4, a[2] + 0.4);   // a low one: a body would stand on it
  S.collider.addMesh('crate', crate.positions, crate.indices, Id);
  const d = stand(door);
  assert.ok(d && bodyFits(S.collider, d) && flat(d, a) > 0.4 && Math.abs(d[1]) < 0.05, `beside the crate on the floor, in nothing - never on its top (${d?.map((v) => v.toFixed(2))})`);
  // standAt: the pursuit stays, what the motor held of where it stood goes
  const ai = new EnhancedEnemyAI(S.collider, [2.5, 4, 5.65], 0, { nav: () => chf });
  ai.makeHostileToPlayer(600, S.player);
  ai.path = [[1, 4, 1], [2, 4, 2]]; ai.pathI = 1; ai.repathT = 0.3; ai.stuckT = 0.5;
  ai.lastGroundedY = 4; ai._airborne = true; ai.velY = -3; ai.obstacleDetected = true; ai.avoidObstaclesTimer = 0.7;
  const goal = ai.predictedTargetPos;
  ai.standAt(a);
  assert.deepEqual(ai.feet, a, 'stood');
  assert.deepEqual([ai.path, ai.repathT, ai.stuckT], [null, 0, 0], 'the old route and its clocks gone - the next step paths from here');
  assert.deepEqual([ai.lastGroundedY, ai._airborne, ai.velY], [a[1], false, 0], 'its fall anchored on the floor it stands on - four metres down is no fall');
  assert.deepEqual([ai.obstacleDetected, ai.avoidObstaclesTimer], [false, 0], 'no detour held from the other side of the wall');
  assert.notEqual(ai.destination, ai.feet, 'its destination a point, not its own feet');
  assert.deepEqual([ai.giveUpTimer, ai.predictedTargetPos], [600, goal], 'still hunting the player');
});

test('INDOOR-WATCH WHOM NO ROUTE STANDS: a watchman of the crime\'s pursuit on the enhanced motor - never one walking off, running, defending, talked down, given up, after another foe, or on the classic motor (mutants: each clause)', async () => {
  await seeded(async () => {
    const S = shop();
    const nav = createInteriorNav({ makeClient: realClient });
    nav.mount(S.ctx, [8, 0, 1.5]);
    const guards = createCityGuards(poolDeps(thief(), S.collider, { nav }));
    await guards.spawnCityGuards(true, { playerFeet: S.player, playerFwd: [0, 0, 1], pool: [], interior: { doors: S.ctx.doors, origin: [6, 0, 6], eligible: true } });
    const g = guards.guards[0];
    assert.equal(huntsThePlayer(g), true, 'the crime\'s watchman, the player his quarry');
    const not = (why, set, undo) => { set(); assert.equal(huntsThePlayer(g), false, why); undo(); assert.equal(huntsThePlayer(g), true); };
    not('walking off', () => { g.leaving = true; }, () => { g.leaving = false; });
    not('running', () => { g.fleeing = true; }, () => { g.fleeing = false; });
    not('a defender', () => { g.defender = true; }, () => { g.defender = false; });
    not('dead', () => { g.dead = true; }, () => { g.dead = false; });
    not('talked down', () => { g.ai.isHostile = false; }, () => { g.ai.isHostile = true; });
    not('unable to act', () => { g.ai.canAct = false; }, () => { g.ai.canAct = true; });
    const t = g.ai.giveUpTimer;
    not('given up', () => { g.ai.giveUpTimer = 0; }, () => { g.ai.giveUpTimer = t; });
    const k = g.ai.predictedTargetPos;
    not('no quarry', () => { g.ai.predictedTargetPos = null; }, () => { g.ai.predictedTargetPos = k; });
    not('after a rat', () => { g.ai.target = guards.guards[1]; }, () => { g.ai.target = null; });
    const classic = createCityGuards(poolDeps(thief(), S.collider));
    await classic.spawnCityGuards(true, { playerFeet: S.player, playerFwd: [0, 0, 1], pool: [], interior: { doors: S.ctx.doors, origin: [6, 0, 6], eligible: true } });
    assert.equal(huntsThePlayer(classic.guards[0]), false, 'the classic motor: DFU\'s wall, never stood');
    nav.release();
  });
});

test('INDOOR-WATCH THE POOLS: the watch and the building\'s foes take the room\'s mesh (`nav`) and build the enhanced motor with the switch on, reading the room\'s bake and its world - the classic one with the switch off or no mesh (the street\'s pools hand none) (mutants: each pool\'s motor; its thunk; its world)', async () => {
  await seeded(async () => {
    const S = shop();
    const nav = createInteriorNav({ makeClient: realClient });
    nav.mount(S.ctx, [8, 0, 1.5]);
    const spawnWatch = async (n) => { const g = createCityGuards(poolDeps(thief(), S.collider, { nav: n })); await g.spawnCityGuards(true, { playerFeet: S.player, playerFwd: [0, 0, 1], pool: [], interior: { doors: S.ctx.doors, origin: [6, 0, 6], eligible: true } }); return g.guards[0].ai; };
    const spawnFoe = async (n) => (await createExteriorFoes(poolDeps(thief(), S.collider, { nav: n })).spawnFoe(0, [8, 0, 3], { feetGiven: true })).ai;
    for (const [pool, spawn] of [['the watch', spawnWatch], ['the building\'s foes', spawnFoe]]) {
      const ai = await spawn(nav);
      assert.ok(ai instanceof EnhancedEnemyAI, `${pool}: the routes`);
      assert.equal(ai.navWorld, nav.world, `${pool}: the room's one world - its budget, its epoch`);
      assert.equal(ai.nav, nav.chf, `${pool}: the room's bake, read per step`);
      assert.equal((await spawn(null)).constructor, EnemyAI, `${pool}: no mesh, the classic motor`);
      setPref('enhancedAI', false);
      try { assert.equal((await spawn(nav)).constructor, EnemyAI, `${pool}: the switch off, the classic motor`); } finally { setPref('enhancedAI', true); }
    }
    nav.release();
  });
});

test('INDOOR-WATCH THE HOST: the mode machine holds one module, hands it to both pools, mounts it with each building at the player\'s arrival, runs its frame before either pool steps, and releases it at both teardowns; the street\'s hosts hand their pools no mesh (mutants: each wiring line)', () => {
  const wm = rd('src/scenes/worldModes.js');
  assert.match(wm, /import \{ createInteriorNav \} from '\.\/interiorNav\.js';/);
  assert.equal((wm.match(/const interiorNav = createInteriorNav\(\);/g) ?? []).length, 1, 'one, for the mode machine');
  for (const fn of ['function makeInteriorFoes(ctx) {', 'function makeInteriorGuards(ctx) {']) {
    const body = wm.slice(wm.indexOf(fn), wm.indexOf(fn) + 400);
    assert.match(body, /collider: ctx\.collider, nav: interiorNav,/, `${fn} hands the room's mesh beside its collider`);
  }
  const spawn = wm.indexOf('player.spawn(spot[0], spot[1], spot[2]);'), mount = wm.indexOf('interiorNav.mount(ctx, spot);', spawn);
  assert.ok(spawn > 0 && mount > spawn && mount - spawn < 200, 'mounted at the player\'s arrival, with the room');
  const frame = wm.indexOf('interiorNav.frame(foeDt, player.pos, interiorGuards?.guards, !!player.grounded);');
  assert.ok(frame > 0, 'its frame, on the foes\' clock');
  assert.ok(frame < wm.indexOf('interiorFoes.update(foeDt, player.pos, cam.pos, _interiorSenses());') && frame < wm.indexOf('const _guardBatches = interiorGuards.update(foeDt'), 'before either pool steps');
  assert.equal((wm.match(/interiorGuards = null;\n\s*interiorNav\.release\(\);/g) ?? []).length, 2, 'released at both teardowns, beside the watch');
  for (const host of ['src/scenes/world.js', 'src/scenes/exterior.js']) assert.ok(!/nav: interiorNav|createInteriorNav/.test(rd(host)), `${host}: its street pools walk the classic motor (the streamed world's half of ENHANCED AI 5)`);
});
