// WITCH1 (2026-10-20, the owner: "We should decorate each town with its own lore appropriate decorations"; bible/06-Systems/
// Witches-Festival.md): THE TOWNS DRESSED (src/world/witchesDecor.js) - each people's kit, the pieces at a tavern's door
// and a temple's, the Wyrd Sister beside the tavern, a house's step, every home's offering spot kept clear - and the build
// that logs them with the block's own flats (src/scenes/pixelBuild.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  WITCH_KITS, WITCH_SPOTS, WYRD_SISTER_FLAT, witchCulture, witchesDressing, doorFront, offeringSpot, witchStepSide, colliderBlocked,
} from '../../src/world/witchesDecor.js';
import { FESTIVAL_ARCHIVE, FESTIVAL_ART } from '../../src/world/festivalArt.js';
import { CLIMATES } from '../../src/formats/mapsTables.js';
import { BUILDING_TYPES } from '../../src/world/buildingNames.js';

const IN = Date.UTC(2026, 9, 25), OUT = Date.UTC(2026, 10, 9);
/** A building facing +z, its door's middle at (x, z) - the door 1.2 m wide and 2.4 high, its box behind it. */
const frame = (x, z, type) => ({ at: [x, 0, z - 5], box: [x - 5, 0, z - 10, x + 5, 6, z], rects: [], type, faction: 0, door: { a: [x - 0.6, 0, z], b: [x + 0.6, 2.4, z] } });
const TAVERN = 101, TEMPLE = 102;
const town = (extra = {}) => new Map([[TAVERN, frame(0, 0, BUILDING_TYPES.Tavern)], [TEMPLE, frame(40, 0, BUILDING_TYPES.Temple)], ...Object.entries(extra).map(([k, v]) => [Number(k), v])]);
const pic = (f) => `${f.archive}.${f.record}`;

test('WITCH1 THE KITS: each people\'s pieces, by the town\'s climate, else its region\'s people', () => {
  assert.equal(witchCulture(CLIMATES.HauntedWoodlands, 0), 'haunted');
  assert.equal(witchCulture(CLIMATES.Mountain, 0), 'highland');
  assert.equal(witchCulture(CLIMATES.MountainWoods, 1), 'highland');
  assert.equal(witchCulture(CLIMATES.Swamp, 0), 'fen');
  assert.equal(witchCulture(CLIMATES.Rainforest, 0), 'fen');
  assert.equal(witchCulture(CLIMATES.Subtropical, 1), 'fen');
  assert.equal(witchCulture(CLIMATES.Desert, 0), 'redguard');
  assert.equal(witchCulture(CLIMATES.Desert2, 0), 'redguard');
  assert.equal(witchCulture(CLIMATES.Woodlands, 17), 'breton', 'a Breton region\'s woods (Daggerfall\'s own)');
  assert.equal(witchCulture(CLIMATES.Woodlands, 0), 'redguard', 'a Redguard region\'s (the Alik\'r)');
  assert.equal(witchCulture(null, null), 'breton');
  const T = `${FESTIVAL_ARCHIVE}.${FESTIVAL_ART.turnip}`, E = `${FESTIVAL_ARCHIVE}.${FESTIVAL_ART.effigy}`, W = `${FESTIVAL_ARCHIVE}.${FESTIVAL_ART.wardStaff}`;
  const kit = (k) => ({ door: pic(k.door), temple: pic(k.temple), show: k.show.map(pic), step: k.step.map(([p, n]) => `${pic(p)}@${n}`) });
  assert.deepEqual(kit(WITCH_KITS.breton), { door: T, temple: '210.21', show: [E, T, T], step: [`${T}@0.32`, '210.2@0.08'] });
  assert.deepEqual(kit(WITCH_KITS.redguard), { door: '210.21', temple: '210.20', show: ['210.0', '210.2', '210.2'], step: ['210.21@0.3'] });
  assert.deepEqual(kit(WITCH_KITS.highland), { door: '210.20', temple: '210.20', show: ['210.1', E, '100.9'], step: ['100.24@0.28', `${T}@0.1`] });
  assert.deepEqual(kit(WITCH_KITS.fen), { door: W, temple: '210.21', show: ['210.0', W, W], step: [`${W}@0.3`, '210.2@0.08'] });
  assert.deepEqual(kit(WITCH_KITS.haunted), { door: '210.2', temple: '210.21', show: [E, '100.17', '100.24'], step: [`${T}@0.3`, '100.23@0.15', '100.18@0.08'] });
  assert.deepEqual(WYRD_SISTER_FLAT, { archive: 179, record: 2 });
});

test('WITCH1 A DOOR\'S FRONT: its middle, its face out of the building, the wall\'s way, its half width', () => {
  const f = doorFront(frame(0, 0, BUILDING_TYPES.Tavern));
  assert.deepEqual(f.c, [0, 0]);
  assert.deepEqual(f.out, [0, 1]);
  assert.equal(f.half, 0.6);
  assert.equal(f.foot, 0);
  assert.deepEqual(f.spot(0, 2), [0, 2]);
  assert.equal(Math.abs(f.spot(1, 0)[0]), 1, 'along the wall');
  assert.equal(doorFront({ box: [0, 0, 0, 1, 1, 1] }), null, 'no door, no front');
});

test('WITCH1 THE TOWN DRESSED: closed outside the festival\'s days; open, a pair at each door, the Sister on one side of the tavern and the show on the other', () => {
  assert.equal(witchesDressing({ frames: town(), taverns: [TAVERN], nowMs: OUT }), null);
  assert.equal(witchesDressing({ frames: new Map(), taverns: [TAVERN], nowMs: IN }), null);
  const d = witchesDressing({ frames: town(), taverns: [TAVERN], temples: [TEMPLE], mapId: 7, floorY: 3, nowMs: IN });
  assert.equal(d.sisters.length, 1);
  const [s] = d.sisters;
  assert.deepEqual([s.archive, s.record, s.factionID, s.witch.key, s.y], [179, 2, 0, TAVERN, 3]);
  assert.equal(Math.abs(s.x), 0.6 + WITCH_SPOTS.sisterAlong);
  assert.equal(s.z, WITCH_SPOTS.sisterOut);
  const near = d.flats.filter((f) => Math.abs(f.c[0]) < 20);
  const turnip = `${FESTIVAL_ARCHIVE}.${FESTIVAL_ART.turnip}`;
  assert.equal(near.filter((f) => pic(f) === turnip && f.c[2] === WITCH_SPOTS.pairOut).length, 2, 'a turnip each side of the door');
  const show = near.filter((f) => f.c[2] !== WITCH_SPOTS.pairOut);
  assert.deepEqual(show.map(pic).sort(), [`${FESTIVAL_ARCHIVE}.${FESTIVAL_ART.effigy}`, turnip, turnip].sort());
  assert.ok(show.every((f) => Math.sign(f.c[0]) === -Math.sign(s.x)), 'the show stands on the side the Sister does not');
  assert.ok(d.flats.every((f) => f.c[1] === 3), 'on the street');
  const temple = d.flats.filter((f) => f.c[0] > 20);
  assert.deepEqual(temple.map(pic), ['210.21', '210.21']);
  // the same town dressed the same way on every machine
  assert.deepEqual(witchesDressing({ frames: town(), taverns: [TAVERN], temples: [TEMPLE], mapId: 7, floorY: 3, nowMs: IN }), d);
});

test('WITCH1 A SPOT IS TAKEN ONLY WHERE IT IS CLEAR: a wall between it and the door, or a flat a pace from it, and it is not', () => {
  const walled = witchesDressing({ frames: town(), taverns: [TAVERN], temples: [TEMPLE], nowMs: IN, blocked: () => true });
  assert.deepEqual([walled.flats.length, walled.sisters.length], [0, 0]);
  const open = witchesDressing({ frames: town(), taverns: [TAVERN], mapId: 7, nowMs: IN });
  const side = Math.sign(open.sisters[0].x);
  // a flat where she would stand: she stands on the other side, the show where she stood
  const moved = witchesDressing({ frames: town(), taverns: [TAVERN], mapId: 7, nowMs: IN, taken: [[open.sisters[0].x, 0, open.sisters[0].z]] });
  assert.equal(Math.sign(moved.sisters[0].x), -side);
  // the rays asked run from before the door at its foot to the spot's far edge, at a body's heights
  const asked = [];
  witchesDressing({ frames: town(), taverns: [TAVERN], nowMs: IN, floorY: 1, blocked: (a, b) => { asked.push([a, b]); return false; } });
  assert.ok(asked.length > 0);
  assert.ok(asked.every(([a]) => a[2] === WITCH_SPOTS.rayFrom && a[0] === 0), 'from the door\'s front');
  assert.deepEqual([...new Set(asked.map(([a]) => Math.round((a[1] - 1) * 1000) / 1000))].sort(), [...WITCH_SPOTS.rayHeights].sort());
});

test('WITCH1 A HOME\'S OFFERING SPOT kept clear before a step is stood; the step\'s piece on the other side, chosen by its town and its key', () => {
  const houses = {};
  for (let k = 1; k <= 40; k++) houses[1000 + k] = frame(100 + k * 20, 0, BUILDING_TYPES.House1);
  const d = witchesDressing({ frames: town(houses), taverns: [TAVERN], mapId: 9, floorY: 0, nowMs: IN });
  assert.equal(d.homes.size, 40, 'every house a spot');
  assert.equal(d.homes.has(TAVERN), false, 'a tavern is no home');
  for (const [k, c] of d.homes) {
    const f = houses[k];
    assert.deepEqual([c[0], c[2]], offeringSpot(f, 9, k));
    // facing +z the wall runs along -x, so the far side of the step's (-stepSide along it) lies at +stepSide in x
    assert.equal(Math.sign(c[0] - (f.door.a[0] + 0.6)), witchStepSide(9, k));
  }
  const steps = d.flats.filter((f) => f.c[0] > 100);
  assert.ok(steps.length > 5 && steps.length < 25, `some houses stand a step piece (${steps.length} of 40)`);
  for (const f of steps) {
    const k = [...d.homes.keys()].find((key) => Math.abs(houses[key].door.a[0] + 0.6 - f.c[0]) < 2);
    const spot = d.homes.get(k);
    assert.notEqual(Math.sign(spot[0] - (houses[k].door.a[0] + 0.6)), Math.sign(f.c[0] - (houses[k].door.a[0] + 0.6)), 'the offering and the step on either side');
  }
  // a house whose near side is walled keeps its spot out before the door
  const far = witchesDressing({ frames: new Map([[5, frame(0, 0, BUILDING_TYPES.House2)]]), mapId: 9, nowMs: IN, blocked: (a, b) => b[2] < WITCH_SPOTS.offeringFarOut - 0.2 });
  assert.deepEqual([far.homes.get(5)[0], far.homes.get(5)[2]], offeringSpot(frame(0, 0, BUILDING_TYPES.House2), 9, 5, true));
});

test('WITCH1 the build\'s ray: one translation array of its own, the pixel placed in the scene, a hit short of the spot is a wall', () => {
  const calls = [];
  const state = { pixelTranslation: (x, y, out) => { calls.push(out); out[0] = 100; out[1] = 0; out[2] = 200; return out; } };
  const collider = { raycast: (o, d, l) => { calls.push(['ray', o, d, l]); return o[0] === 100 ? l / 2 : Infinity; } };
  const blocked = colliderBlocked(collider, state, 3, 4);
  assert.equal(blocked([0, 1, 0], [0, 1, 2]), true);
  assert.equal(blocked([0, 1, 0], [0, 1, 0]), false, 'no length, no wall');
  assert.equal(calls[0], calls[2], 'the one array, read again');
  assert.deepEqual(calls[1].slice(1), [[100, 1, 200], [0, 0, 1], 2]);
});

test('WITCH1 THE BUILD LOGS THEM WITH THE BLOCK\'S OWN: after the collider holds the pixel\'s walls, before the flats are grouped; a Wyrd Sister marked; the homes\' spots on the entry', () => {
  const src = readFileSync(new URL('../../src/scenes/pixelBuild.js', import.meta.url), 'utf8');
  const settle = src.indexOf('    collider.settle(key);'), dress = src.indexOf('const witchDress = '), group = src.indexOf('const { groups, wild: wildFlats, places } = groupFlats(flatLog');
  assert.ok(settle > 0 && dress > settle && group > dress, 'settled, dressed, grouped');
  assert.match(src, /for \(const f of witchDress\?\.flats \?\? \[\]\) \{\n\s+addFlat\(f\.archive, f\.record, \.\.\.f\.c\);/);
  assert.match(src, /if \(isHearthFlat\(LIGHTS_ARCHIVE, f\.record\)\) pixelHearths\.push/);
  assert.match(src, /pixelNpcFlats\.push\(\.\.\.\(witchDress\?\.sisters \?\? \[\]\)\);/);
  assert.match(src, /host: null, witch: flat\.witch \?\? null \}\);/);
  assert.match(src, /witchHomes: witchDress\?\.homes \?\? null, witchFloor,/);
  assert.match(src, /blocked: colliderBlocked\(collider, host\.state, px, py\)/);
});
