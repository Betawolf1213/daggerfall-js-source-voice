// POI mode: the URL flag, the fly maths, the free-trip bill and the one god-mode gate (systems/poiMode.js, systems/godMode.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setPoi, poiOn, flyVelocity, flyDelta, panDelta, dollyDelta, poiFreeTrip, installPoiMode, poiFlyFrame, POI_FLY_SPEED, POI_FLY_BOOST } from '../src/systems/poiMode.js';
import { isGodMode, setSaveGodMode, godSpare } from '../src/systems/godMode.js';
import { hurtPlayer, playerDamageWithheld } from '../src/characters/playerEntity.js';
import { ONLINE_REFUSED_FLAGS, refuseOnlinePowerFlags } from '../src/systems/onlineLane.js';
import { scaleTripCost } from '../src/ui/travelPopUp.js';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
const reset = () => { setPoi(false, { online: false }); setSaveGodMode(false); };

test('POI flag: ?poi turns it on offline, never online, and is an online-refused power flag', () => {
  reset();
  installPoiMode({ params: new URLSearchParams('exterior&poi'), target: {} });
  assert.equal(poiOn(), true);
  assert.equal(setPoi(true, { online: true }), false, 'online refuses it');
  assert.ok(ONLINE_REFUSED_FLAGS.includes('poi'));
  const online = new URLSearchParams('online&poi');
  assert.deepEqual(refuseOnlinePowerFlags(online), ['poi']);
  reset();
  installPoiMode({ params: new URLSearchParams('exterior'), target: {} });
  assert.equal(poiOn(), false, 'no flag, no POI');
});

test('fly velocity: WASD is horizontal and relative to yaw, Space up, Ctrl down, Shift x4', () => {
  const k = (...c) => new Set(c);
  let v = flyVelocity(k('KeyW'), 0);
  near(v[0], 0); near(v[1], 0); near(v[2], POI_FLY_SPEED);   // yaw 0 faces +z
  v = flyVelocity(k('KeyW'), Math.PI / 2);
  near(v[0], POI_FLY_SPEED); near(v[2], 0, 1e-9 + 1e-6);
  v = flyVelocity(k('KeyD'), 0);
  near(v[0], POI_FLY_SPEED); near(v[2], 0);   // screen-right at yaw 0 is +x
  v = flyVelocity(k('KeyS'), 0); near(v[2], -POI_FLY_SPEED);
  v = flyVelocity(k('KeyA'), 0); near(v[0], -POI_FLY_SPEED);
  assert.equal(flyVelocity(k('Space'), 1.234)[1], POI_FLY_SPEED);
  assert.equal(flyVelocity(k('ControlLeft'), 1.234)[1], -POI_FLY_SPEED);
  assert.equal(flyVelocity(k('Space', 'ControlLeft'), 0)[1], 0, 'both cancel');
  near(flyVelocity(k('KeyW', 'ShiftLeft'), 0)[2], POI_FLY_SPEED * POI_FLY_BOOST);
  const d = flyVelocity(k('KeyW', 'KeyD'), 0);
  near(Math.hypot(d[0], d[2]), POI_FLY_SPEED);   // diagonals are no faster
  assert.deepEqual(flyVelocity(k(), 0), [0, 0, 0]);
});

test('fly is frame-rate independent: one 100 ms step equals ten 10 ms steps', () => {
  const held = new Set(['KeyW', 'KeyD', 'Space']);
  const once = flyDelta(held, 0.7, 0.1);
  const sum = [0, 0, 0];
  for (let i = 0; i < 10; i++) flyDelta(held, 0.7, 0.01).forEach((x, a) => { sum[a] += x; });
  once.forEach((x, a) => near(x, sum[a]));
});

test('middle-drag pan slides along the view right and world up; the wheel dollies along the look', () => {
  const p = panDelta(10, 0, 0, 0.1);
  near(p[0], -1); near(p[1], 0); near(p[2], 0);   // dragging right moves the camera left (the world follows the hand)
  near(panDelta(0, 10, 0.5, 0.1)[1], 1);
  const w = dollyDelta(-100, 0, 0, 0.01);   // wheel up = forward
  near(w[2], 1); near(w[0], 0);
  const up = dollyDelta(-100, 0, Math.PI / 2, 0.01);
  near(up[1], 1);
});

test('poiFlyFrame reads the held keys through the module (empty when none are held)', () => {
  reset();
  assert.deepEqual(poiFlyFrame(0.1, 0, 0), [0, 0, 0]);
});

test('free trip: POI bills nothing and takes no days, off it the fare is untouched', () => {
  reset();
  const c = { piecesCost: 120, totalCost: 300 };
  assert.deepEqual(scaleTripCost(c, null, null, { online: false }), c, 'POI off: byte-for-byte the old fare');
  setPoi(true, { online: false });
  assert.deepEqual(scaleTripCost(c, null, null, { online: false }), { piecesCost: 0, totalCost: 0 });
  assert.deepEqual(poiFreeTrip({ minutes: 4000, piecesCost: 9, totalCost: 99, oceanPixels: 3 }), { minutes: 0, piecesCost: 0, totalCost: 0, oceanPixels: 3 });
  reset();
});

test('god mode gate: POI or the save flag, never online; off by default', () => {
  reset();
  assert.equal(isGodMode({ online: false }), false);
  setPoi(true, { online: false });
  assert.equal(isGodMode({ online: false }), true);
  assert.equal(isGodMode({ online: true }), false, 'online never');
  reset();
  setSaveGodMode(true);
  assert.equal(isGodMode({ online: false }), true, "a classic save's GodMode flag");
  setSaveGodMode(false);
  assert.equal(godSpare(40), 40);
  setPoi(true, { online: false });
  assert.equal(godSpare(40), 0);
  reset();
});

test('god mode at the damage chokepoint: hurtPlayer leaves health alone under POI, hurts without it', () => {
  reset();
  const e = { health: 50, maxHealth: 50, isPlayer: true };
  assert.equal(playerDamageWithheld(), false);
  hurtPlayer(e, 10);
  assert.equal(e.health, 40, 'POI off: damage lands');
  setPoi(true, { online: false });
  assert.equal(playerDamageWithheld(), true);
  hurtPlayer(e, 10);
  hurtPlayer(e, 999, { bypassShield: true });
  assert.equal(e.health, 40, 'POI on: nothing lands, not even the SetHealth(0) door');
  reset();
  hurtPlayer(e, 5);
  assert.equal(e.health, 35);
});

test('hooks: every host that moves the camera or bills a trip asks POI / the gate (by source)', () => {
  const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
  assert.match(src('src/scenes/world.js'), /installPoiMode\(\{ params/);
  assert.match(src('src/scenes/world.js'), /if \(poiOn\(\)\) \{ computed = poiFreeTrip\(computed\)/);
  assert.match(src('src/scenes/exterior.js'), /installPoiMode\(\{ params/);
  assert.match(src('src/scenes/exterior.js'), /installOrbitCam\(\{[^}]*fly:/);
  assert.match(src('src/characters/playerEntity.js'), /_staff\.god \|\| isGodMode\(\)/);
  assert.match(src('src/scenes/shared.js'), /applyFallLanding[\s\S]*isGodMode\(\)/);
});
