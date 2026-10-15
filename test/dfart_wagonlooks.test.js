// DF-ART (2026-10-14, Mac: "Ensure texture swapping still works for wagons"): every paint of every wagon (WAGONS2,
// systems/wagonLooks.js - the Stable's outside paints and the caravan's inside ones) still swaps its pictures now that
// they are Daggerfall's own (world/wagonArt.js wagonLookSources): driven through the real pool (scenes/horseCartPool.js)
// over the tests' stand-in ARENA2 (test/classicArtFake.mjs), each choice past the first draws its wagon through a
// remap from the built records to its own, every one of those uploaded and each its own picture; the caravan's room
// takes each inside paint onto its live records (scenes/caravanRoom.js paintCaravanRoom), its windows still glass.
import './modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { WAGON_OUTSIDE_LOOKS, CARAVAN_INSIDE_LOOKS, CARAVAN_INSIDE_PARTS } from '../src/systems/wagonLooks.js';
import { WAGON_KIND_ORDER } from '../src/systems/wagonKinds.js';
import { WAGON_ARCHIVE, TEX, LOOK_RECORDS, lookRecord, isGlassRecord } from '../src/world/wagonArt.js';
import { createHorseCartPool } from '../src/scenes/horseCartPool.js';
import { paintCaravanRoom, CARAVAN_LIVE_CHOICE } from '../src/scenes/caravanRoom.js';
import { setTextureDeriveContext } from '../src/systems/textureReplacement.js';
import { fakeClassicRgba } from './classicArtFake.mjs';

setTextureDeriveContext({ classicRgba: fakeClassicRgba() });
const bakeOf = (kind) => JSON.parse(readFileSync(new URL(`../src/assets/wagons/${kind}.json`, import.meta.url), 'utf8'));
const tick = () => new Promise((r) => setTimeout(r, 0));
const flush = async (n = 8) => { for (let i = 0; i < n; i++) await tick(); };
function fakeRenderer() {
  const r = { textures: new Map(), draws: [], evicted: [] };
  r.uploadTexture = (a, rec, px, o) => { const k = `${a}_${rec}`; if (!r.textures.has(k)) r.textures.set(k, { px, o }); };
  r.evictTexture = (k) => { r.evicted.push(k); r.textures.delete(k); };
  r.createMesh = (model) => ({ model });
  r.drawMesh = (gpu, m, remap, o) => r.draws.push({ gpu, remap, o });
  r.createBillboardBatch = () => ({ origin: [0, 0, 0] });
  r.destroyBillboardBatch = () => {};
  return r;
}
const parked = { isGrounded: true, position: [10, 1, 10], rotation: [0, 0, 0, 1], cargoTier: 0 };
const runtime = { view: () => ({ state: { HorseName: '', HorseMode: 0, Mode: 2, WorldX: 10, WorldZ: 10 }, moving: null, deployed: parked, horse: null, teamFollowing: false, horseFollowing: false, persistence: true }), lateUpdate() {}, actionRows: () => [] };
const bytes = (t) => Buffer.from(t.px.colors);

test('DF-ART WAGON PAINTS STILL SWAP (Mac: "Ensure texture swapping still works for wagons"): for every kind and every outside paint, the pool draws the wagon as built for the first choice and through its paint\'s remap for each other - every built record the paint repaints sent to its own record, that record uploaded (opaque, a cut-out where it holds the caravan\'s glass) and its own picture, unlike the built one and every other choice\'s (mutants: the look unread, a paint\'s picture its built one)', async () => {
  for (const kind of WAGON_KIND_ORDER) {
    const names = WAGON_OUTSIDE_LOOKS[kind];
    const seen = new Map();   // record -> its picture's bytes, across this kind's choices
    for (let i = 0; i < names.length; i++) {
      const r = fakeRenderer();
      const pool = createHorseCartPool({ renderer: r, meshes: null, collider: () => null, now: () => 0, wagonKind: () => kind, wagonLook: () => ({ o: i, w: 0, f: 0, c: 0 }), bakedWagon: async (k) => bakeOf(k) });
      pool.attach(runtime);
      pool.partsOf(kind);
      await flush();
      r.draws.length = 0;
      assert.equal(pool.draw(r), 1, `${kind} ${names[i]}: drawn`);
      await flush();
      const body = r.draws[0];
      for (const rec of LOOK_RECORDS[kind]) {
        const built = r.textures.get(`${WAGON_ARCHIVE}_${rec}`);
        assert.ok(built, `${kind}: the built record ${rec} uploaded`);
        if (i === 0) { assert.ok(!body.remap?.size, `${kind} ${names[0]}: as built, no remap`); continue; }
        const to = lookRecord(rec, i), key = `${WAGON_ARCHIVE}_${to}`;
        assert.equal(body.remap.get(`${WAGON_ARCHIVE}_${rec}`), key, `${kind} ${names[i]}: record ${rec} drawn as ${to}`);
        const t = r.textures.get(key);
        assert.ok(t, `${kind} ${names[i]}: its record ${to} uploaded`);
        assert.deepEqual({ ...t.o }, isGlassRecord(to) ? { cutout: true } : { opaque: true }, `${kind} ${names[i]}: record ${to} uploaded as a model's face`);
        assert.ok(!bytes(t).equals(bytes(built)), `${kind} ${names[i]}: record ${to} its own picture, not the built one`);
        seen.set(`${i}:${rec}`, bytes(t));
      }
      if (i > 0) assert.equal(body.remap.size, LOOK_RECORDS[kind].length, `${kind} ${names[i]}: only what the paint repaints`);
    }
    // each choice's picture its own (a door stays a door whatever the paint - the caravan's rear is the one record
    // its paints share in part, and its painted body still differs)
    for (const rec of LOOK_RECORDS[kind]) {
      const pics = [...seen.entries()].filter(([k]) => k.endsWith(`:${rec}`)).map(([, b]) => b.toString('base64'));
      assert.equal(new Set(pics).size, pics.length, `${kind}: record ${rec} a picture of its own for every paint`);
    }
  }
});

test('DF-ART THE CARAVAN\'S INSIDE PAINTS STILL SWAP: every walls, floor and ceiling choice is drawn on the room through its remap and painted into the room\'s live records - each let go and uploaded again with that choice\'s picture, the walls\' and the front\'s glass still cut out (mutants: the live records not let go, the glass left opaque)', async () => {
  for (const part of CARAVAN_INSIDE_PARTS) {
    const names = CARAVAN_INSIDE_LOOKS[part], field = part[0];
    const pictures = new Set();
    for (let i = 1; i < names.length; i++) {
      const look = { o: 0, w: 0, f: 0, c: 0, [field]: i };
      // drawn from outside, through the caravan's window
      const r = fakeRenderer();
      const pool = createHorseCartPool({ renderer: r, meshes: null, collider: () => null, now: () => 0, wagonKind: () => 'caravan', wagonLook: () => look, bakedWagon: async (k) => bakeOf(k) });
      pool.attach(runtime);
      pool.partsOf('caravan');
      await flush();
      r.draws.length = 0;
      pool.draw(r);
      await flush();
      const room = r.draws.at(-1);
      for (const rec of LOOK_RECORDS[part]) {
        assert.equal(room.remap.get(`${WAGON_ARCHIVE}_${rec}`), `${WAGON_ARCHIVE}_${lookRecord(rec, i)}`, `${part} ${names[i]}: the room drawn in it`);
        assert.ok(r.textures.has(`${WAGON_ARCHIVE}_${lookRecord(rec, i)}`), `${part} ${names[i]}: its record uploaded`);
      }
      // stood in: painted into the live records
      const live = fakeRenderer();
      await paintCaravanRoom(live, look);
      for (const rec of LOOK_RECORDS[part]) {
        const key = `${WAGON_ARCHIVE}_${lookRecord(rec, CARAVAN_LIVE_CHOICE)}`, t = live.textures.get(key);
        assert.ok(live.evicted.includes(key) && t, `${part} ${names[i]}: live record ${rec} let go and painted`);
        assert.deepEqual({ ...t.o }, isGlassRecord(rec) ? { cutout: true } : { opaque: true });
        if (rec === LOOK_RECORDS[part][0]) pictures.add(bytes(t).toString('base64'));
      }
    }
    assert.equal(pictures.size, names.length - 1, `${part}: every choice a picture of its own`);
  }
  assert.ok([TEX.roomSide, TEX.roomFront].every(isGlassRecord) && !isGlassRecord(TEX.roomRear), 'the room\'s windows glass, its door none');
});
