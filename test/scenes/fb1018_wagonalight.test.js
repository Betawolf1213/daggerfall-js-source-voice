// FIELD BUGS 2026-10-18 WAGON-ALIGHT (bible/01-Overview/bugs/Field-Bugs-2026-10-18.md, Nauya: "when they dismount from
// the wagon, they just drop down inside of it, and they get stuck in your wagon unable to help you or move out of it").
// A companion's seat in the wagon's back was read by the motor alone, so a seat that went (the wagon parked) left the
// body where it sat - and the parked wagon's box, kept from closing round the PLAYER's capsule only, stood round it.
// Driven on the real pieces: Mac's Open Wagon bake, the cart runtime, the pool (its box law), the real collider, the
// seats (scenes/wagon/wagonRiders.js companionSeat), the companion layer (scenes/crewAshore.js) and the foe motor.
import '../modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeWorld } from '../hccWorld.mjs';
import { TRANSPORT } from '../../src/systems/horse/horseCartLaw.js';
import { createHorseCartPool, WAGON_BUCKET } from '../../src/scenes/horseCartPool.js';
import { HCC_WIRE_KIND } from '../../src/systems/horse/horseCartWire.js';
import { usableBounds } from '../../src/systems/wagon/wagon41214.js';
import { getDownPoint, GET_DOWN_STEP, GET_DOWN_REACH } from '../../src/systems/wagon/wagonSeats.js';
import { createWagonRiders } from '../../src/scenes/wagon/wagonRiders.js';
import { createCrewAshore, HEEL_M, HEEL_STEP_M } from '../../src/scenes/crewAshore.js';
import { Collider } from '../../src/player/collider.js';
import { EnemyAI } from '../../src/characters/enemy/enemyMotor.js';
import { CAPSULE_RADIUS, CAPSULE_HEIGHT } from '../../src/player/motor.js';
import { mat4FromQuatPos } from '../../src/world/quat.js';

const rd = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const flush = async () => { for (let i = 0; i < 8; i++) await new Promise((r) => setTimeout(r, 0)); };
const QUIET = { warn() {}, error() {}, info() {} };
const ART = { ensureStationary: () => true, ensureWalk() {}, hasWalk: () => true };
const fakeRenderer = () => ({
  createMesh: (model) => ({ model }), updateMeshVertices() {}, destroyMesh() {}, drawMesh() {},
  createBillboardBatch: () => ({}), updateBillboardBatch() {}, destroyBillboardBatch() {}, drawBillboardBatch() {}, uploadTexture: () => ({}), deleteTexture() {},
});

/** The Open Wagon driven along +z with two companions in its back, on the real collider (flat ground at 0). `opts.far`
 *  moves the bodies off their seats (a door, a catch-up) before the wagon parks. */
async function ride({ far = false } = {}) {
  const col = new Collider(() => 0);
  let layer = null;
  const player = () => [w.pos[0], 0, w.pos[2]];
  const pool = createHorseCartPool({
    renderer: fakeRenderer(), meshes: null, collider: () => col, now: () => 0, wagonKind: () => 'openWagon',
    bakedWagon: async (k) => JSON.parse(rd(`src/assets/wagons/${k}.json`)), log: QUIET, horses: () => 2,
    playerCapsule: () => ({ feet: player(), height: CAPSULE_HEIGHT, radius: CAPSULE_RADIUS }),
    bodyCapsules: () => layer?.capsules() ?? [],   // world.js's: both companion layers
  });
  pool.partsOf('openWagon'); await flush();
  const world = makeWorld({ presentation: { ...pool.presentation, horseArt: ART } });
  pool.attach(world.rt);
  const { w, rt, step } = world;
  const riders = createWagonRiders({ selfId: () => 'me', now: () => 0, say() {}, changed() {}, pool, pin() {}, unpin() {} });
  const riding = () => pool.carriesCompanions();   // world.js's, as the streaming host asks it
  const bodies = [];
  const party = { party: [{ boat: 1, name: 'Ansel' }, { boat: 1, name: 'Brann' }], wake() {}, hurt() {}, knock() {}, isAshore: () => true };
  layer = createCrewAshore({
    party: () => party, now: () => 0,
    place: () => ({
      key: 'street', remove() {},
      spawn: (mobile, feet, o) => { const rec = { entity: { health: 10, maxHealth: 10 }, ai: new EnemyAI(col, feet, o.yaw, { isHostile: false }) }; bodies.push(rec); return rec; },
      spot: (from, dx, dz) => { const p = [from[0], from[1], from[2]]; col.move(p, dx, 0, dz, 1.8); return p; },   // world.js spotOf
    }),
    leader: () => ({ feet: player(), yaw: 0, grounded: true }),
    seat: (i) => riders.companionSeat(i, riding()),
  });
  const frame = (n = 1) => { for (let i = 0; i < n; i++) { step(1, 1 / 60); pool.frame(1 / 60, [0, 2, 0], 1 / 60); layer.frame(); for (const r of bodies) r.ai.update(1 / 60, player()); } };
  w.items.cart = true; w.items.horse = true; w.mode = TRANSPORT.Foot; w.pos = [0, 0.9, 0]; w.yaw = 0;
  frame(2); await flush(); frame(2);
  assert.equal(rt.tryUseTransport(TRANSPORT.Cart).succeeded, true, 'driven');
  for (let i = 0; i < 60; i++) { w.pos[2] += 0.1; frame(); }
  assert.equal(pool.shown().wagon.kind, HCC_WIRE_KIND.Trailing, 'trailing behind me');
  assert.equal(bodies.length, 2, 'both companions stand');
  bodies.forEach((r, i) => assert.deepEqual(r.ai.feet, pool.mySeat(i).feet, `companion ${i} rides in seat ${i}`));
  const seats = bodies.map((_, i) => pool.mySeat(i));
  if (far) for (const r of bodies) r.ai.feet[0] += GET_DOWN_REACH + 2;   // stood elsewhere the frame the seat goes (a Recall, a door's re-stand)
  // I get down: the wagon parks where it trailed, and I walk six metres off its side
  w.mode = TRANSPORT.Foot; frame(2);   // the direct set (the transport window's Foot) - the runtime reads it next frame
  assert.equal(pool.shown().wagon.kind, HCC_WIRE_KIND.Deployed, 'parked');
  const wagon = pool.shown().wagon, m = mat4FromQuatPos(wagon.rotation, wagon.position), b = usableBounds(pool.partsOf('openWagon').bounds);
  /** Whether a body of the capsule's radius at `f` stands in the wagon's box (its spine at hip height, in the box's frame). */
  const inBox = (f) => { const d = [f[0] - m[12], f[1] + 0.9 - m[13], f[2] - m[14]]; const l = [m[0] * d[0] + m[1] * d[1] + m[2] * d[2], m[4] * d[0] + m[5] * d[1] + m[6] * d[2], m[8] * d[0] + m[9] * d[1] + m[10] * d[2]]; return l.every((v, k) => v > b.min[k] - CAPSULE_RADIUS && v < b.max[k] + CAPSULE_RADIUS); };
  return { w, pool, col, bodies, seats, frame, inBox, player };
}

test('WAGON-ALIGHT THE COMPANIONS GET DOWN AS A RIDER DOES: the wagon parked, each companion in its back stands where a player rider gets down from that seat - GET_DOWN_STEP over the side behind it, outside the wagon\'s box - and walks to heel; the box stands once they are out, and holds nobody (mutants: the seat let go where it sat; the step swept nowhere; the box law reading my capsule alone)', async () => {
  const { w, pool, col, bodies, seats, frame, inBox, player } = await ride();
  bodies.forEach((r, i) => {
    const to = getDownPoint(seats[i]);
    assert.ok(Math.hypot(r.ai.feet[0] - to[0], r.ai.feet[2] - to[2]) < 0.05, `companion ${i} at its seat's get-down point (${r.ai.feet.map((v) => v.toFixed(2))} vs ${to.map((v) => v.toFixed(2))})`);
    assert.ok(Math.hypot(r.ai.feet[0] - seats[i].feet[0], r.ai.feet[2] - seats[i].feet[2]) > GET_DOWN_STEP - 0.05, `companion ${i} off its seat`);
    assert.equal(inBox(r.ai.feet), false, `companion ${i} outside the wagon's box`);
  });
  w.pos[0] += 6; frame(1);   // I walk off its side
  frame(60 * 8);
  assert.ok(col._buckets.has(WAGON_BUCKET), 'the parked box stands - nobody of mine is in it');
  bodies.forEach((r, i) => {
    assert.equal(inBox(r.ai.feet), false, `companion ${i} never in the box`);
    const d = Math.hypot(r.ai.feet[0] - player()[0], r.ai.feet[2] - player()[2]);
    assert.ok(d < HEEL_M + HEEL_STEP_M * (i + 1) + 1, `companion ${i} came to heel (${d.toFixed(2)} m)`);
    assert.ok(Math.abs(r.ai.feet[1]) < 0.05, `companion ${i} on the ground`);
  });
  assert.equal(pool.shown().wagon.kind, HCC_WIRE_KIND.Deployed);
});

test('WAGON-ALIGHT A BODY MOVED OFF ITS SEAT STAYS WHERE IT LANDED: one further than GET_DOWN_REACH from the seat it last sat in when the seat goes is not stood back beside the wagon - wagonRiders.js getDown\'s own guard, one law for a player and a companion (mutants: the reach unread)', async () => {
  const { bodies, seats } = await ride({ far: true });
  bodies.forEach((r, i) => {
    assert.ok(Math.hypot(r.ai.feet[0] - seats[i].feet[0], r.ai.feet[2] - seats[i].feet[2]) > GET_DOWN_REACH, `companion ${i} left where it was put`);
  });
});

test('WAGON-ALIGHT THE PARKED BOX NEVER STANDS ROUND A BODY OF MINE: a companion\'s capsule in the box keeps it down as mine does, and it stands once the companion steps out; the host hands the pool both companion layers\' capsules (mutants: the bodies unread; one layer unwired)', async () => {
  const buckets = [];
  const col = { addMesh: (k) => buckets.push(['add', k]), removeBucket: (k) => buckets.push(['remove', k]), raycastAll: () => [] };
  let body = null;
  const pool = createHorseCartPool({
    renderer: fakeRenderer(), meshes: null, collider: () => col, now: () => 0, wagonKind: () => 'openWagon',
    bakedWagon: async (k) => JSON.parse(rd(`src/assets/wagons/${k}.json`)), log: QUIET, horses: () => 2,
    playerCapsule: () => ({ feet: [0, 0, 0], height: 1.8, radius: 0.35 }),
    bodyCapsules: () => [null, body],
  });
  pool.partsOf('openWagon'); await flush();
  const world = makeWorld({ presentation: { ...pool.presentation, horseArt: ART } });
  pool.attach(world.rt);
  const { w, rt, step } = world;
  w.items.cart = true; w.items.horse = true; w.mode = TRANSPORT.Foot; w.pos = [0, 0.9, 0]; w.yaw = 0;
  step(2); rt.handleSummonTransport(); step(2);
  pool.frame(1 / 30, [0, 2, 0], 0);
  const s = pool.shown();
  assert.equal(s.wagon.kind, HCC_WIRE_KIND.Deployed, 'summoned');
  const m = mat4FromQuatPos(s.wagon.rotation, s.wagon.position), parts = pool.partsOf('openWagon');
  assert.ok(buckets.some(([op, k]) => op === 'add' && k === WAGON_BUCKET), 'its box stood clear of me');
  body = { feet: [s.wagon.position[0], 0, s.wagon.position[2] + 1], height: 1.8 };   // a companion where the wagon was laid
  assert.equal(pool.capsuleInBox(m, parts), true, 'a companion in the box');
  buckets.length = 0; pool.frame(1 / 30, [0, 2, 0], 0);
  assert.deepEqual(buckets, [['remove', WAGON_BUCKET]], 'not stood round the companion');
  body = { feet: [s.wagon.position[0] + 3, 0, s.wagon.position[2]], height: 1.8 };
  assert.equal(pool.capsuleInBox(m, parts), false);
  buckets.length = 0; pool.frame(1 / 30, [0, 2, 0], 0);
  assert.ok(buckets.some(([op]) => op === 'add'), 'stood once it stepped out');
  // the wiring: the streaming host hands both layers - the crew's hands and the sworn
  const src = rd('src/scenes/world.js');
  assert.match(src, /^ {4}bodyCapsules: \(\) => \[\.\.\.crewAshore\.capsules\(\), \.\.\.revenantAshore\.capsules\(\)\],/m);
});

test('WAGON-ALIGHT ONE GET-DOWN POINT: the law answers it (systems/wagon/wagonSeats.js getDownPoint - GET_DOWN_STEP behind the seat\'s yaw), and nothing else in src/ works it out again - the player\'s getting down and the companion layer\'s both call it (mutants: the step\'s sign; the player\'s own copy back)', () => {
  assert.equal(GET_DOWN_STEP, 1.6);
  assert.deepEqual(getDownPoint({ feet: [10, 1, 20], yaw: Math.PI / 2 }).map((v) => +v.toFixed(6)), [8.4, 1, 20]);
  assert.deepEqual(getDownPoint({ feet: [10, 1, 20], yaw: 0 }).map((v) => +v.toFixed(6)), [10, 1, 18.4]);
  const riders = rd('src/scenes/wagon/wagonRiders.js'), crew = rd('src/scenes/crewAshore.js');
  assert.match(riders, /deps\.unpin\?\.\(near \? getDownPoint\(at\) : null\);/);
  assert.match(crew, /const to = getDownPoint\(sat\);/);
  for (const [name, text] of [['wagonRiders.js', riders], ['crewAshore.js', crew]]) assert.doesNotMatch(text, /GET_DOWN_STEP\]?\s*[,;)]|\* GET_DOWN_STEP/, `${name} works the step out itself`);
});
