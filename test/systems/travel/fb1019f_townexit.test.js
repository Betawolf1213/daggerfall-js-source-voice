// TOWN-EXIT (FIELD BUGS 2026-10-19f, a player's private report: leaving a town by the Overworld's journey, the way out
// failed wherever the traveller stood far from a gate, and left them caught in a corner of the wall).
// bible/06-Systems/Travel-View.md TOWN-EXIT; systems/travel/townExit.js.
//
// THE TOWN IS A REAL ONE: Kaloguja, one of the 65 walled cities whose grid Beautiful Cities' pack names whole (6 x 6),
// its wall blocks read out of the vendored pack the way the CITY-WALLS rig reads them (test/world/fb1004d_citywalls.test.js)
// and laid out by the producers the hosts run (blockFromJson, layoutRmbBlock); its gates minted as the pixel's build
// mints them (pixelBuild.js: `makeCityGate`, the block's origin matrix times the placement's - `cityGates`); its location
// frame and its rects by the producers (getLocationTerrainTileOrigin, setLocationTiles, locationRectsOf); its navgrid a
// CityNavigation carved by setBlockData from automaps that cover its wall pieces as the game's automap covers a model -
// the town's interior blocks are Daggerfall's own, whose automaps no ARENA2 here can read, so its streets are open
// ground inside the walls. Kaloguja's west wall steps in a block at its north end (WALLAA15, an inner corner): a NOTCH of
// fields inside the box its four gates stand on, outside its walls.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import zlib from 'node:zlib';

import { ROW_CODECS } from '../../../src/formats/worldData/worldDataPack.js';
import { blockFromJson } from '../../../src/formats/worldData/worldDataReplacement.js';
import { layoutRmbBlock, isCityGate, CITY_GATE_CLOSED_MODEL_ID } from '../../../src/world/rmbLayout.js';
import { makeCityGate, updateCityGate } from '../../../src/world/city/cityGate.js';
import { CityNavigation } from '../../../src/world/city/cityNavigation.js';
import { RMB_SIDE } from '../../../src/world/locationLayout.js';
import { CITY_WALL_PIECE, CITY_WALL_MODEL, CITY_WALL_FILL } from '../../../src/world/townStandIns.js';
import { GLOBAL_SCALE } from '../../../src/world/meshReader.js';
import { trs, multiply } from '../../../src/world/mat4.js';
import { TERRAIN_SIZE } from '../../../src/world/terrain/terrainSampler.js';
import { getLocationTerrainTileOrigin, setLocationTiles } from '../../../src/world/terrain/terrainTiles.js';
import { locationRectsOf, createTravelOptions, readTravelOptionsSettings } from '../../../src/systems/travel/travelOptions.js';
import { mapPixelWorldOrigin, P_SIZE } from '../../../src/systems/travel/travelPaths.js';
import { rectOf } from '../../../src/systems/travel/travelAutopilot.js';
import { gatesOf, townExit, journeyLegs, streetsFrom } from '../../../src/systems/travel/townExit.js';
import { TravelControlUI } from '../../../src/ui/travel/travelControlUI.js';
import { modSetting } from '../../../src/systems/modSettings.js';
import { TRAVEL_VIEW_TEXT } from '../../../src/scenes/travelView.js';
import { createTravelSteer, travelFrameReach } from '../../../src/systems/travel/travelSteer.js';
import { calculateYaw } from '../../../src/systems/travel/travelAutopilot.js';
import { FIXED_DT, MAX_FRAME_DT, CAPSULE_RADIUS } from '../../../src/player/motor.js';

// ── the pack, read as the CITY-WALLS rig reads it (its counting left out) ──────────────────────────────────────────────
const pack = JSON.parse(zlib.gunzipSync(readFileSync(new URL('../../../vendor/beautiful-cities/WorldDataPack/beautiful-cities.pack.json.gz', import.meta.url))).toString('utf8'));
const P = (v) => (typeof v === 'string' ? JSON.parse(v) : v);
const nodes = pack.nodes.map(P);
const WALLAA04 = Object.keys(pack.classicNames).find((i) => pack.classicNames[i] === 'WALLAA04.RMB');
const EMPTY = () => ({ Header: {}, Block3dObjectRecords: [], BlockFlatObjectRecords: [], BlockSection3Records: [], BlockPeopleRecords: [], BlockDoorRecords: [] });
/** WALLAA04's first subrecord's exterior, read by reference: the segment as the author's own copies stand it. */
const BY_REFERENCE = { ModelId: String(CITY_WALL_MODEL), ModelIdNum: CITY_WALL_MODEL, ObjectType: 4, XPos: 0, YPos: 0, ZPos: -64, XRotation: 0, YRotation: 0, ZRotation: 0 };
function expand(v) {
  if (Array.isArray(v)) return v.map(expand);
  if (!v || typeof v !== 'object') return v;
  if (v.$c) return String(v.$c[0]) === WALLAA04 && JSON.stringify(v.$c[1]) === '["RmbBlock","SubRecords",0,"Exterior"]' ? { ...EMPTY(), Block3dObjectRecords: [BY_REFERENCE] } : EMPTY();
  if (v.$n !== undefined) return expand(nodes[v.$n]);
  const k = Object.keys(v).find((key) => ROW_CODECS[key]);
  if (k) return v[k].map((row) => (Array.isArray(row) || typeof row === 'number' ? ROW_CODECS[k](row) : expand(row)));
  return Object.fromEntries(Object.keys(v).map((key) => [key, expand(v[key])]));
}
function listOf(name, key, read = expand, readOne = expand) {
  const [, base, ops] = P(pack.files[`${name}.json`]);
  let list = null;
  const at = ops.findLastIndex((o) => o[0] === 's' && o[1].join('.') === key);
  if (at >= 0) list = read(ops[at][2]);
  else if (base[0] === 'f') list = listOf(base[1].replace('.json', ''), key, read, readOne);
  if (!list) return null;
  const k = key.split('.').length;
  for (const op of ops.slice(at + 1)) {
    const p = op[1];
    if (p.slice(0, k).join('.') !== key || p.length === k) continue;
    if (op[0] === 'i' && p.length === k + 1) list.splice(p[k], 0, readOne(op[2]));
    else if (op[0] === 'r' && p.length === k + 1) list.splice(p[k], 1);
    else if (op[0] === 's' && p.length === k + 1) list[p[k]] = readOne(op[2]);
    else if (op[0] === 's' && p.length > k + 1 && read === expand) { let o = list; for (const q of p.slice(k, -1)) o = o[q]; o[p[p.length - 1]] = expand(op[2]); }
  }
  return list;
}
const subrecords = (list) => list.map((ref) => {
  const sr = ref.$n !== undefined ? nodes[ref.$n] : ref;
  return { XPos: sr.XPos, ZPos: sr.ZPos, YRotation: sr.YRotation, Exterior: expand(sr.Exterior), Interior: EMPTY() };
});
/** A wall block of the pack laid out (blockFromJson, layoutRmbBlock); null for a block the pack does not carry. */
function layoutOf(name) {
  if (!/^WALLAA/.test(name) || !pack.files[`${name}.json`]) return null;
  const subs = listOf(name, 'RmbBlock.SubRecords', subrecords, (v) => subrecords([v])[0]);
  return layoutRmbBlock(blockFromJson({ Name: name, RmbBlock: { FldHeader: {}, SubRecords: subs ?? [], Misc3dObjectRecords: listOf(name, 'RmbBlock.Misc3dObjectRecords') ?? [], MiscFlatObjectRecords: [] } }, 9300));
}
/** A city's grid as the pack's location file names it. */
function cityGrid(name) {
  for (const [file, entry] of Object.entries(pack.files)) {
    if (!file.startsWith('location-')) continue;
    const [, base, ops] = P(entry);
    if (base[3] !== name) continue;
    const names = ops.find((o) => o[0] === 's' && o[1].join('.') === 'Exterior.ExteriorData.BlockNames')[2];
    const width = ops.find((o) => o[0] === 's' && o[1].join('.') === 'Exterior.ExteriorData.Width')[2];
    return { names, width, height: names.length / width };
  }
  return null;
}

// ── the wall's pieces, covered as the automap covers a model ───────────────────────────────────────────────────────────
const TOWER = 444, HALF = 512, TOWER_REACH = 448, ACROSS = 192;   // CITY-WALLS' laws: a piece 1024 long, the tower's arms, the faces
const u = (v) => v / GLOBAL_SCALE;
/** A wall block's pieces as spans on axis lines, block-local classic units (the CITY-WALLS rig's reading). */
function spansOf(lay) {
  const out = [];
  const span = (m, x0, x1, z) => {
    const at = (x) => [u(m[0] * x * GLOBAL_SCALE + m[8] * z * GLOBAL_SCALE + m[12]), u(m[2] * x * GLOBAL_SCALE + m[10] * z * GLOBAL_SCALE + m[14])];
    const [p, q] = [at(x0), at(x1)];
    return Math.abs(p[1] - q[1]) < 1e-3 ? { axis: 'x', c: p[1], a: Math.min(p[0], q[0]), b: Math.max(p[0], q[0]) } : { axis: 'z', c: p[0], a: Math.min(p[1], q[1]), b: Math.max(p[1], q[1]) };
  };
  for (const placed of lay.models) {
    const m = placed.matrix, id = placed.modelIdNum;
    if (id === CITY_WALL_MODEL || isCityGate(id)) out.push({ ...span(m, -HALF, HALF, 0), gate: isCityGate(id) });
    else if (id === CITY_WALL_PIECE) out.push(span(m, CITY_WALL_FILL.x - CITY_WALL_FILL.length / 2, CITY_WALL_FILL.x + CITY_WALL_FILL.length / 2, CITY_WALL_FILL.z));
    else if (id === TOWER) {
      const [tx, tz] = [u(placed.recordAt[0]), u(placed.recordAt[2])];
      const cx = Math.abs(tx - 448) < Math.abs(tx - 3648) ? 448 : 3648, cz = Math.abs(tz - 448) < Math.abs(tz - 3648) ? 448 : 3648;
      const dx = Math.sign(tx - cx), dz = Math.sign(tz - cz);
      out.push({ axis: 'x', c: cz, a: Math.min(cx, cx + TOWER_REACH * dx), b: Math.max(cx, cx + TOWER_REACH * dx) });
      out.push({ axis: 'z', c: cx, a: Math.min(cz, cz + TOWER_REACH * dz), b: Math.max(cz, cz + TOWER_REACH * dz) });
    }
  }
  return out;
}
/** The passage left in a gate's piece for the flights, metres: its arch is no ARENA2 reading here - a narrow guess. */
const GATE_GAP = 4;
/** A span's boxes, metres in the location frame (`ox`, `oz` its block's corner, classic units): its run, ACROSS either side
 *  of its line - a gate's with its passage open (the day's model). */
function boxesOf(s, ox, oz) {
  const mid = (s.a + s.b) / 2, half = GATE_GAP / 2 / GLOBAL_SCALE, M = GLOBAL_SCALE;
  return (s.gate ? [[s.a, mid - half], [mid + half, s.b]] : [[s.a, s.b]]).map(([a, b]) => (s.axis === 'x'
    ? { xMin: (ox + a) * M, xMax: (ox + b) * M, zMin: (oz + s.c - ACROSS) * M, zMax: (oz + s.c + ACROSS) * M }
    : { xMin: (ox + s.c - ACROSS) * M, xMax: (ox + s.c + ACROSS) * M, zMin: (oz + a) * M, zMax: (oz + b) * M }));
}
/** A block's 64 x 64 automap (RMB rows: row 0 the block's far edge in z) with its wall's cells covered. */
function automapOf(spans) {
  const map = new Uint8Array(64 * 64);
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const cx = (x + 0.5) * 64, cz = (63.5 - y) * 64;
      if (spans.some((s) => (s.axis === 'x' ? Math.abs(cz - s.c) <= ACROSS && cx >= s.a && cx <= s.b : Math.abs(cx - s.c) <= ACROSS && cz >= s.a && cz <= s.b))) map[y * 64 + x] = 1;
    }
  }
  return map;
}

// ── the town, built as the streaming host builds a pixel ──────────────────────────────────────────────────────────────
const PX = 300, PY = 200;
const O = mapPixelWorldOrigin(PX, PY);
const GROUND = Array.from({ length: 16 }, () => Array.from({ length: 16 }, () => ({ textureRecord: 2, tileBitfield: 2 })));   // grass, every tile stamped
/**
 * A city's pixel as pixelBuild keeps it - `px`, `py`, `cityGates` (each `{ gate: makeCityGate(model), local }`, the
 * block's origin matrix times the placement's), `population.nav`, `locOrigin` - and its rects (setLocationTiles' rect
 * over its stamped ground, locationRectsOf). `gateModel(i)` the model a gate's block laid, where a pin wants another;
 * `yard` an interior block whose automap walls a yard in (cells 16-47 of it, its ring three cells thick); `breach` a wall
 * block whose automap covers nothing - its wall a hole in the navgrid's ring.
 */
function town(name, { gateModel = () => null, yard = null, breach = null } = {}) {
  const grid = cityGrid(name);
  const dfLocation = { exterior: { exteriorData: { width: grid.width, height: grid.height, blockNames: grid.names } }, mapTableData: { locationType: 0 } };
  const tilePos = getLocationTerrainTileOrigin(dfLocation);
  const tileSide = TERRAIN_SIZE / 128;
  const locLocal = [tilePos.x * tileSide, 0, tilePos.y * tileSide];
  const nav = new CityNavigation(grid.width, grid.height);
  const cityGates = [], walls = [];
  grid.names.forEach((block, i) => {
    const bx = i % grid.width, by = Math.floor(i / grid.width);
    const lay = layoutOf(block);
    const spans = lay ? spansOf(lay) : [];
    for (const s of spans) walls.push(...boxesOf(s, bx * 4096, by * 4096));
    const map = lay && !(breach && breach[0] === bx && breach[1] === by) ? automapOf(spans) : new Uint8Array(64 * 64);
    if (yard && yard[0] === bx && yard[1] === by) for (let y = 16; y < 48; y++) for (let x = 16; x < 48; x++) if (x < 19 || x > 44 || y < 19 || y > 44) map[y * 64 + x] = 1;
    nav.setBlockData(bx, by, map, (tx, ty) => GROUND[tx][ty].textureRecord);
    if (!lay) return;
    const originMatrix = trs(locLocal[0] + bx * RMB_SIDE, locLocal[1], locLocal[2] + by * RMB_SIDE, 0, 0, 0);
    for (const placed of lay.models) {
      if (!isCityGate(placed.modelIdNum)) continue;
      cityGates.push({ gate: makeCityGate(gateModel(cityGates.length) ?? placed.modelIdNum), local: multiply(originMatrix, placed.matrix), bucketKey: `${PX},${PY}:gate:${cityGates.length}` });
    }
  });
  const r = setLocationTiles(dfLocation, { getRmbBlockName: (loc, x, y) => grid.names[y * grid.width + x] }, { checkName: (n) => n, getBlockIndex: () => 0, getBlock: () => ({ rmbBlock: { fldHeader: { groundData: { groundTiles: GROUND } } } }) }, new Uint8Array(128 * 128));
  const rects = locationRectsOf(O.x, O.z, { x: r.xMin, y: r.yMin, width: r.xMax - r.xMin, height: r.yMax - r.yMin }, true, false);
  const loc = { x: tilePos.x * 256, z: tilePos.y * 256 };
  return {
    pixel: { px: PX, py: PY, cityGates, population: { nav }, locOrigin: locLocal }, rects, nav,
    /** A point of the location frame (classic units from the town's south-west corner), native. */
    at: (x, z) => ({ x: O.x + loc.x + x, z: O.z + loc.z + z }),
    /** A navgrid cell's index under a point of the location frame. */
    cell: (x, z) => Math.floor(z / 64) * nav.width + Math.floor(x / 64),
    /** The walls as boxes, metres in the location frame (the flights'), and a native point there. */
    walls, metres: (p) => ({ x: (p.x - O.x - loc.x) * GLOBAL_SCALE, z: (p.z - O.z - loc.z) * GLOBAL_SCALE }),
  };
}
/** A native point from the pixel's south-west corner - the numbers the pins read. */
const rel = (p) => ({ x: p.x - O.x, z: p.z - O.z });
/** A leg as the pins read it: its point, if it has one, from the pixel's corner. */
const relLeg = (l) => (l.at ? { ...l, at: rel(l.at) } : l);
const exitOf = (t, me, to) => { const e = townExit(t.pixel, t.rects, me, to); return e && 'points' in e ? e.points.map(rel) : e; };
/** Each gate shut as DaggerfallCityGate's Update shuts it at dusk - offline, and online (OL5). */
const nightfall = (t, online) => { for (const g of t.pixel.cityGates) updateCityGate(g.gate, true, { online }); };

// Kaloguja, as the pins read it (from the pixel's south-west corner; the town's six blocks stand 16 tiles in, 4096):
// gates S (9728, 7744), W (7744, 9728), E (25024, 14848), N (17920, 25024) - the walls on x 7744 and 25024, z 7744 and
// 25024, but the west wall north of z 16384 stands a block in, on x 11840 (the notch: x 7744-11840, z 16384-25024);
// the town's rects L (3968..28800) and B (3584..29184) both ways, so its ring's bands run on 3776 and 28992, and the
// road's line through the pixel's middle on 16384.

test('TOWN-EXIT THE GATES: a real walled town\'s four gates, as the pixel\'s build keeps them, read where each stands (whole native units), on the side its model faces - out, away from its town - and open as its model stands; offline the dusk shuts every one of them (DaggerfallCityGate.Update, its model a wall), online none (OL5); a gate whose block laid it shut is shut (mutants: TOWN-EXIT-gate-faces-in, TOWN-EXIT-gate-flag-not-model, TOWN-EXIT-gate-unrounded)', () => {
  const t = town('Kaloguja');
  assert.deepEqual(gatesOf(t.pixel.cityGates, O).map((g) => ({ ...rel(g), side: g.side, open: g.open })), [
    { x: 9728, z: 7744, side: 's', open: true }, { x: 7744, z: 9728, side: 'w', open: true },
    { x: 25024, z: 14848, side: 'e', open: true }, { x: 17920, z: 25024, side: 'n', open: true },
  ], 'WALLAA10 south, WALLAA11 west, WALLAA09 east, WALLAA08 north - each 3648 in from the grid\'s edge it faces');
  const off = town('Kaloguja');
  nightfall(off, false);
  assert.deepEqual(gatesOf(off.pixel.cityGates, O).map((g) => g.open), [false, false, false, false], 'offline, by night: every gate shut');
  const on = town('Kaloguja');
  nightfall(on, true);
  assert.deepEqual(gatesOf(on.pixel.cityGates, O).map((g) => g.open), [true, true, true, true], 'online: never');
  const laid = town('Kaloguja', { gateModel: (i) => (i === 2 ? CITY_GATE_CLOSED_MODEL_ID : null) });
  assert.deepEqual(gatesOf(laid.pixel.cityGates, O).map((g) => g.open), [true, true, false, true], 'a block that laid its gate shut keeps it shut by day (its flag is born open)');
});

test('TOWN-EXIT THE STREETS: the walled town\'s streets are a piece of its navgrid that never reaches the grid\'s edge - the fields outside the walls do, the notch among them inside the gates\' box; steps counted four neighbours to a step (mutants: TOWN-EXIT-streets-never-open)', () => {
  const t = town('Kaloguja');
  const middle = streetsFrom(t.nav, t.cell(12288, 12288));
  assert.equal(middle.open, false, 'the middle of the town: its streets, walled in');
  assert.equal(middle.steps[t.cell(12288 + 64 * 5, 12288 - 64 * 3)], 8, 'five east and three south: eight steps');
  assert.equal(middle.steps[t.cell(12288, 1500)], -1, 'the fields are no street of it');
  assert.equal(streetsFrom(t.nav, t.cell(5800, 17000)).open, true, 'the notch: fields, out to the edge');
  assert.equal(streetsFrom(t.nav, t.cell(12288, 1500)).open, true, 'the fields south of the walls');
});

test('TOWN-EXIT THE WAY OUT: from the streets, through the gate whose walk is shortest - the streets to its inner point (one path\'s width inside its wall), straight out through it to the ring, round the ring the shorter way, to where the route\'s own line leaves the ring; the fields, the notch and a yard no gate opens onto walk out as before; an open town, a pixel not built, no navgrid, no rects: none (mutants: TOWN-EXIT-gate-in-at-the-wall, TOWN-EXIT-out-on-the-road-line, TOWN-EXIT-ring-always-clockwise, TOWN-EXIT-gate-by-the-ring-alone, TOWN-EXIT-no-street-test, TOWN-EXIT-no-yard-test, TOWN-EXIT-no-street-reach)', () => {
  const t = town('Kaloguja');
  // the middle, leaving east: the east gate - in, out to the ring's east band, along it to the road's line
  assert.deepEqual(exitOf(t, t.at(12288, 12288), [1, 0]), [{ x: 24512, z: 14848 }, { x: 25536, z: 14848 }, { x: 28992, z: 14848 }, { x: 28992, z: 16384 }]);
  // leaving north: the north gate
  assert.deepEqual(exitOf(t, t.at(12288, 12288), [0, -1]), [{ x: 17920, z: 24512 }, { x: 17920, z: 25536 }, { x: 17920, z: 28992 }, { x: 16384, z: 28992 }]);
  // by the west gate, leaving east: across the town to the east gate (its walk 26,176) - never out of the west gate and
  // half round the ring (49,472 the shorter way)
  assert.deepEqual(exitOf(t, t.at(5000, 6000), [1, 0]), [{ x: 24512, z: 14848 }, { x: 25536, z: 14848 }, { x: 28992, z: 14848 }, { x: 28992, z: 16384 }]);
  // by the west gate, leaving north-west: out of the west gate and up the ring to its north-west corner (23,744 and the
  // few steps to it) - the north gate is nearer the corner by the ring alone (18,624) and farther by the streets (+24,448)
  assert.deepEqual(exitOf(t, t.at(5000, 6000), [-1, -1]), [{ x: 8256, z: 9728 }, { x: 7232, z: 9728 }, { x: 3776, z: 9728 }, { x: 3776, z: 28992 }]);
  // by the north gate, leaving west: out of it, and the shorter way round is ANTICLOCKWISE - the north-west corner, then
  // the west band's road point
  assert.deepEqual(exitOf(t, t.at(13824, 20000), [-1, 0]), [{ x: 17920, z: 24512 }, { x: 17920, z: 25536 }, { x: 17920, z: 28992 }, { x: 3776, z: 28992 }, { x: 3776, z: 16384 }]);
  // by the north gate, leaving north-east: the north gate and its corner, not the east gate
  assert.deepEqual(exitOf(t, t.at(13824, 20000), [1, -1]), [{ x: 17920, z: 24512 }, { x: 17920, z: 25536 }, { x: 17920, z: 28992 }, { x: 28992, z: 28992 }]);
  // not on the streets: none - the journey leaves as it always has
  assert.equal(exitOf(t, t.at(12288, 1500), [0, 1]), null, 'the fields south of the walls');
  assert.equal(exitOf(t, t.at(5800, 17000), [-1, 0]), null, 'the notch: inside the box the four gates stand on, outside the walls');
  const yard = town('Kaloguja', { yard: [3, 3] });
  assert.equal(exitOf(yard, yard.at(3 * 4096 + 2048, 3 * 4096 + 2048), [1, 0]), null, 'a yard walled in inside the town, no gate opening onto it');
  assert.deepEqual(exitOf(yard, yard.at(12288, 12288 - 4096), [1, 0]), exitOf(t, t.at(12288, 12288 - 4096), [1, 0]), 'its streets about it: the town\'s');
  const breached = town('Kaloguja', { breach: [0, 2] });
  assert.equal(exitOf(breached, breached.at(12288, 12288), [1, 0]), null, 'a wall the navgrid does not close (WALLAA07\'s automap left out): the streets run out to the edge - no walled town to leave');
  // against the wall's inner face, in a cell its automap covers: the street beside it is the traveller's
  assert.deepEqual(exitOf(t, t.at(12288, 20928 - 150), [0, -1]), [{ x: 17920, z: 24512 }, { x: 17920, z: 25536 }, { x: 17920, z: 28992 }, { x: 16384, z: 28992 }]);
  const open = town('Kaloguja');
  open.pixel.cityGates = [];
  assert.equal(townExit(open.pixel, open.rects, open.at(12288, 12288), [1, 0]), null, 'an open town - no gates: its connector as before');
  assert.equal(townExit(undefined, t.rects, t.at(12288, 12288), [1, 0]), null, 'a pixel not built: no gates, no navgrid');
  assert.equal(townExit({ ...t.pixel, population: null }, t.rects, t.at(12288, 12288), [1, 0]), null, 'no navgrid');
  assert.equal(townExit(t.pixel, null, t.at(12288, 12288), [1, 0]), null, 'no rects');
});

test('TOWN-EXIT THE GATES SHUT: offline, by night, every gate the streets reach is shut - the way out is refused, never routed through a wall; online they stand open; a gate laid shut is passed over for the next (mutants: TOWN-EXIT-shut-not-said, TOWN-EXIT-through-a-shut-gate)', () => {
  const off = town('Kaloguja');
  nightfall(off, false);
  assert.deepEqual(townExit(off.pixel, off.rects, off.at(12288, 12288), [1, 0]), { shut: true });
  assert.equal(townExit(off.pixel, off.rects, off.at(12288, 1500), [0, 1]), null, 'the fields: nothing to be shut in');
  const on = town('Kaloguja');
  nightfall(on, true);
  assert.deepEqual(exitOf(on, on.at(12288, 12288), [1, 0]), [{ x: 24512, z: 14848 }, { x: 25536, z: 14848 }, { x: 28992, z: 14848 }, { x: 28992, z: 16384 }], 'online: the east gate, as by day');
  const laid = town('Kaloguja', { gateModel: (i) => (i === 2 ? CITY_GATE_CLOSED_MODEL_ID : null) });
  assert.deepEqual(exitOf(laid, laid.at(12288, 12288), [1, 0]), [{ x: 17920, z: 24512 }, { x: 17920, z: 25536 }, { x: 17920, z: 28992 }, { x: 28992, z: 28992 }, { x: 28992, z: 16384 }], 'the east gate shut: the north one, and round the north-east corner');
});

test('TOWN-EXIT THE LEGS: the journey\'s legs begin with the way out - each point a leg in its own pixel (the ring past a town eight blocks tall lies in the next), the way in and through on foot, the ring on the ground the route leaves by, every one walked point to point (`ring`) - and the route\'s own legs after, no join; shut, no legs; a route that never leaves the pixel is not asked; off the streets, OW-ROADSIDE\'s join as before (mutants: TOWN-EXIT-legs-not-in-their-pixel, TOWN-EXIT-legs-all-the-roads-kind, TOWN-EXIT-legs-unmarked, TOWN-EXIT-shut-walked-anyway)', () => {
  const t = town('Kaloguja');
  const exitAt = (town_) => (x, y, to, me) => townExit(x === PX && y === PY ? town_.pixel : undefined, x === PX && y === PY ? town_.rects : null, me, to);
  const east = { pixels: [{ x: PX, y: PY }, { x: PX + 1, y: PY }, { x: PX + 2, y: PY }], kinds: ['road', 'road'] };
  const legs = journeyLegs({ x: PX, y: PY }, east, { me: t.at(12288, 12288), exitAt: exitAt(t) });
  assert.deepEqual(legs.map(relLeg), [
    { x: PX, y: PY, kind: 'open', at: { x: 24512, z: 14848 }, ring: true },
    { x: PX, y: PY, kind: 'open', at: { x: 25536, z: 14848 }, ring: true },
    { x: PX, y: PY, kind: 'open', at: { x: 28992, z: 14848 }, ring: true },
    { x: PX, y: PY, kind: 'road', at: { x: 28992, z: 16384 }, ring: true },
    { x: PX + 2, y: PY, kind: 'road' },
  ], 'in to the gate and through it on foot, the ring on the road\'s ground, then the road - and no join');
  const across = journeyLegs({ x: PX, y: PY }, { ...east, kinds: ['open', 'open'] }, { me: t.at(12288, 12288), exitAt: exitAt(t) });
  assert.deepEqual(across.map((l) => l.kind), ['open', 'open', 'open', 'open', 'open'], 'across country: the ring\'s point on the open ground');
  // Mesajer stands eight blocks tall: its ring runs past the pixel's north and south edges, so the way out of its north
  // gate is aimed in the pixel north of it - the autopilot asks a leg's arrival only in the leg's own pixel
  const m = town('Mesajer');
  const north = { pixels: [{ x: PX, y: PY }, { x: PX, y: PY - 1 }], kinds: ['road'] };
  assert.deepEqual(journeyLegs({ x: PX, y: PY }, north, { me: m.at(9728, 26000), exitAt: exitAt(m) }).map((l) => [l.x, l.y, l.kind, l.at && rel(l.at)]), [
    [PX, PY, 'open', { x: 15872, z: 28608 }], [PX, PY, 'open', { x: 15872, z: 29632 }], [PX, PY - 1, 'open', { x: 15872, z: 33088 }], [PX, PY - 1, 'road', { x: 16384, z: 33088 }], [PX, PY - 1, 'road', undefined],
  ]);
  // the town's gates shut: no legs
  const off = town('Kaloguja');
  nightfall(off, false);
  assert.equal(journeyLegs({ x: PX, y: PY }, east, { me: off.at(12288, 12288), exitAt: exitAt(off) }), null);
  // a route that never leaves the pixel: the way out is not asked
  let asked = 0;
  journeyLegs({ x: PX, y: PY }, { pixels: [{ x: PX, y: PY }], kinds: [] }, { me: t.at(12288, 12288), exitAt: () => { asked++; return null; } });
  assert.equal(asked, 0);
  // from the fields: the road joined as OW-ROADSIDE joins it
  const fields = journeyLegs({ x: PX, y: PY }, east, { me: t.at(12288, 1500), exitAt: exitAt(t) });
  assert.deepEqual(fields.map(relLeg), [{ x: PX, y: PY, kind: 'open', at: { x: 16384, z: 16384 } }, { x: PX + 2, y: PY, kind: 'road' }]);
});

test('TOWN-EXIT THE JOURNEY: Travel Options walks the way out point to point - the legs kept whole (each point, each mark), the autopilot aimed at the gate\'s inner point in its own pixel, and a resume in the town\'s pixel skips none of them and joins no road between them (OW-TOWN-RING\'s `ring`, read four ways)', () => {
  const t = town('Kaloguja');
  const legs = journeyLegs({ x: PX, y: PY }, { pixels: [{ x: PX, y: PY }, { x: PX + 1, y: PY }, { x: PX + 2, y: PY }], kinds: ['road', 'road'] },
    { me: t.at(12288, 12288), exitAt: (x, y, to, me) => townExit(t.pixel, t.rects, me, to) });
  const st = { pos: t.at(12288, 12288), pixel: { x: PX, y: PY } };
  const ui = new TravelControlUI({ defaultStartingAccel: 10, accelerationLimit: 60 });
  const to = createTravelOptions({
    settings: readTravelOptionsSettings((vendor, key) => (vendor === 'roads-hazelnut' ? key === 'Enabled' : modSetting(vendor, key))), ui,
    roads: () => ({ roads: new Uint8Array(1000 * 500), tracks: new Uint8Array(1000 * 500), source: 'basic-roads' }),
    worldPos: () => st.pos, mapPixel: () => st.pixel, yaw: () => 0, setFacing: () => {},
    currentLocation: () => null, hasCurrentLocation: () => false, localizedCurrentLocationName: () => '', localizedLocationName: (s) => s?.name ?? '',
    climateIndex: () => 231, entity: () => ({ health: 50, maxHealth: 50, fatigue: 64 * 50, luck: 50, stealth: 50 }),
    enemiesNearby: () => false, diseaseCount: () => 0, say: () => {}, messageBox: () => {},
    setTimeScale: () => {}, now: () => 0, worldTimeNow: () => 0, roll100: () => 100,
    locationWorldRect: (s) => { const o = mapPixelWorldOrigin(s.pixel.x, s.pixel.y); return rectOf(o.x + 16000, o.z + 16000, 768, 768); },
    locationTileRect: () => null, pushWindow: (w) => { w.show(); },
  });
  assert.equal(to.beginTravelAlongRoute({ legs, summary: { pixel: { x: PX + 2, y: PY }, name: 'Ripwych', mapId: 42 } }, false, { quiet: true }), true);
  assert.deepEqual(to.route.legs.slice(0, 4).map((l) => [l.ring, rel(l.at)]), [[true, { x: 24512, z: 14848 }], [true, { x: 25536, z: 14848 }], [true, { x: 28992, z: 14848 }], [true, { x: 28992, z: 16384 }]], 'kept whole: each point and its mark');
  const inner = legs[0].at;
  assert.deepEqual([to.state.autopilot.destinationMapPixel, to.state.autopilot.destinationWorldRect], [{ x: PX, y: PY }, rectOf(inner.x - P_SIZE / 2, inner.z - P_SIZE / 2, P_SIZE, P_SIZE)], 'aimed at the gate\'s inner point, in its own pixel');
  // stopped in the town and resumed where it stood: the leg it was on, no join
  to.interruptTravel();
  to.resumeTravel();
  assert.deepEqual([to.route.i, to.route.join], [0, null], 'standing in the town\'s pixel: the gate still ahead');
  // through the gate (its inner point reached), stopped on the ring's band, resumed: still the ring's point it was walking to
  st.pos = inner;
  to.update({ topWindowIsTravelUI: true, isPlayerOnHUD: false });
  to.update({ topWindowIsTravelUI: true, isPlayerOnHUD: false });
  assert.equal(to.route.i, 1, 'arrived at the inner point: out through the gate next');
  to.interruptTravel();
  to.resumeTravel();
  assert.deepEqual([to.route.i, to.route.join], [1, null], 'resumed in the town\'s pixel: no ring point skipped, none taken for a join');
});

/** world.js's own tvJoinedLegs, lifted (test/systems/travel/fb0929d_toroads.test.js's way). */
const WORLD = readFileSync(new URL('../../../src/scenes/world.js', import.meta.url), 'utf8');
function fnSource(name) {
  const a = WORLD.indexOf(`  function ${name}(`);
  assert.ok(a >= 0, `world.js declares ${name}`);
  return WORLD.slice(a, WORLD.indexOf('\n  }\n', a) + 4);
}

test('TOWN-EXIT THE HOST: world.js\'s tvJoinedLegs, lifted and run - the built pixel\'s gates and navgrid handed to the way out, and the shut town SAID once, no legs; both journeys begin none then (mutants: TOWN-EXIT-host-no-exit, TOWN-EXIT-host-shut-unsaid, TOWN-EXIT-route-begun-shut, TOWN-EXIT-walk-begun-shut)', () => {
  const run = (t) => {
    const said = [];
    const env = {
      journeyLegs, townExit, tvFreePull: (plan) => plan, tvRingAt: () => null, tvTownRects: (x, y) => (x === PX && y === PY ? t.rects : null),
      built: new Map([[`${PX},${PY}`, t.pixel]]), state: { worldCoords: (p) => ({ x: p[0], z: p[2] }) }, player: { pos: [t.me.x, 0, t.me.z] },
      tvSay: (l) => said.push(l), TRAVEL_VIEW_TEXT,
    };
    const tvJoinedLegs = new Function(...Object.keys(env), `${fnSource('tvJoinedLegs')}\nreturn tvJoinedLegs;`)(...Object.values(env));
    return { legs: tvJoinedLegs({ x: PX, y: PY }, { pixels: [{ x: PX, y: PY }, { x: PX + 1, y: PY }], kinds: ['road'] }), said };
  };
  const day = town('Kaloguja');
  const d = run({ ...day, me: day.at(12288, 12288) });
  assert.deepEqual([d.legs.map((l) => l.at && rel(l.at)), d.said], [[{ x: 24512, z: 14848 }, { x: 25536, z: 14848 }, { x: 28992, z: 14848 }, { x: 28992, z: 16384 }, undefined], []]);
  const night = town('Kaloguja');
  nightfall(night, false);
  const n = run({ ...night, me: night.at(12288, 12288) });
  assert.deepEqual([n.legs, n.said], [null, [TRAVEL_VIEW_TEXT.gatesShut]], 'no legs, and said once');
  assert.equal(TRAVEL_VIEW_TEXT.gatesShut, 'The town gates are shut for the night. Wait until morning to leave.');
  // both journeys begin none (a place's and a spot's)
  assert.match(fnSource('travelViewRouteTo'), /const legs = tvJoinedLegs\(from, plan, roads\);\n\s*if \(!legs\) return false;[^\n]*\n\s*const ok = travelOptions\.beginTravelAlongRoute\(/);
  assert.match(fnSource('travelViewWalkTo'), /let legs = tvJoinedLegs\(from, plan, roads\);\n\s*if \(!legs\) return false;/);
});

// ── the flight: the steering (TRAVEL-NAV1, travelSteer.js) over the town's own walls ─────────────────────────────────────
/** A 2-D ray against a box: the distance to its face, 0 from inside (test/systems/travel/travelnav.test.js's table). */
function rayHit(ox, oz, dx, dz, o) {
  if (ox >= o.xMin && ox <= o.xMax && oz >= o.zMin && oz <= o.zMax) return 0;
  let t0 = 0, t1 = Infinity;
  for (const [p, d, lo, hi] of [[ox, dx, o.xMin, o.xMax], [oz, dz, o.zMin, o.zMax]]) {
    if (Math.abs(d) < 1e-12) { if (p < lo || p > hi) return Infinity; continue; }
    let a = (lo - p) / d, b = (hi - p) / d;
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a); t1 = Math.min(t1, b);
    if (t0 > t1) return Infinity;
  }
  return t0;
}
const clear = (x, z, obs) => Math.min(...obs.map((o) => Math.hypot(Math.max(o.xMin - x, 0, x - o.xMax), Math.max(o.zMin - z, 0, z - o.zMax)))) - CAPSULE_RADIUS;
/** Walk the steering from `start` through each of `aims` in turn (metres), as the autopilot walks a journey's legs: one
 *  journey (one `key`), each leg its target, its bearing latched where it begins; arrived inside the leg's own square
 *  (P_SIZE about its point - the autopilot's for a leg with a point of its own). The motor is motor.js's shape (travelnav's
 *  table): a fixed step scaled by the clock, the frame clamped first, a step into a wall stopped at contact. */
function fly(walls, start, aims, { speed = 4.4, scale = 60, dt = 1 / 60 } = {}) {
  const steer = createTravelSteer(), key = {}, body = { ...start }, arrive = (P_SIZE / 2) * GLOBAL_SCALE;
  const probe = (dx, dz, lateral) => { const ox = body.x + dz * lateral, oz = body.z - dx * lateral; let t = Infinity; for (const o of walls) t = Math.min(t, rayHit(ox, oz, dx, dz, o)); return t; };
  const r = { reached: 0, stop: null, touched: false, body };
  let acc = 0, asked = 0;
  const stepLen = FIXED_DT * scale;
  for (const aim of aims) {
    const yaw = calculateYaw(body.x, body.z, aim.x, aim.z) * Math.PI / 180;
    const inside = () => Math.abs(body.x - aim.x) <= arrive && Math.abs(body.z - aim.z) <= arrive;
    for (let fr = 0; !inside(); fr++) {
      if (fr > 20000) { r.stop = 'frames'; return r; }
      Object.assign(steer.input, {
        key, x: body.x, z: body.z, tx: aim.x, tz: aim.z, yaw, goal: Math.hypot(Math.max(Math.abs(body.x - aim.x) - arrive, 0), Math.max(Math.abs(body.z - aim.z) - arrive, 0)),
        reach: travelFrameReach(speed, dt, scale), quantum: speed * FIXED_DT * scale, asked, manual: false,
      });
      const out = steer.step(steer.input, probe, steer.output);
      if (out.stop) { r.stop = out.stop; return r; }
      asked = out.forward * speed * scale * Math.min(dt, MAX_FRAME_DT);
      acc += Math.min(dt, MAX_FRAME_DT) * scale;
      while (acc >= stepLen && !inside()) {
        acc -= stepLen;
        for (let d = speed * stepLen * out.forward; d > 1e-9 && !inside(); d -= 0.05) {
          const q = Math.min(0.05, d), nx = body.x + Math.sin(out.yaw) * q, nz = body.z + Math.cos(out.yaw) * q;
          if (clear(nx, nz, walls) < 0) { r.touched = true; break; }
          body.x = nx; body.z = nz;
        }
      }
    }
    r.reached++;
  }
  return r;
}

test('TOWN-EXIT REPRODUCED, then fixed - the steering flown over the town\'s own walls, its gates\' passages open: the walk the journey began with (straight at the next pixel north, from the west of the town) meets the notch\'s wall, is turned along the walls - past the north gate\'s passage at the journey\'s pace - and stopped inside them, the way ahead blocked; the way out walks in to the north gate, through it, out to the ring and along it, and on to the same pixel - at the open ground\'s pace and at the road\'s with a hitching frame', () => {
  const t = town('Kaloguja');
  const me = t.at(5000, 6000), next = mapPixelWorldOrigin(PX, PY - 1);
  const target = t.metres({ x: next.x + 16384, z: next.z + 16384 });
  for (const [scale, dt] of [[60, 1 / 60], [100, 0.1]]) {
    const before = fly(t.walls, t.metres(me), [target], { scale, dt });
    assert.deepEqual([before.reached, before.stop, before.touched], [0, 'blocked', false], `x${scale}: REPRODUCED - stopped, the way ahead blocked, short of the wall`);
    assert.ok(before.body.z < (20928 - ACROSS) * GLOBAL_SCALE && before.body.x > 3648 * GLOBAL_SCALE, `x${scale}: still inside the walls (${before.body.x.toFixed(0)}, ${before.body.z.toFixed(0)})`);
    const exit = townExit(t.pixel, t.rects, me, [0, -1]);
    assert.deepEqual(exit.points.map(rel), [{ x: 17920, z: 24512 }, { x: 17920, z: 25536 }, { x: 17920, z: 28992 }, { x: 16384, z: 28992 }], 'by the north gate');
    const after = fly(t.walls, t.metres(me), [...exit.points.map(t.metres), target], { scale, dt });
    assert.deepEqual([after.reached, after.stop, after.touched], [5, null, false], `x${scale}: out by the gate and on - every point reached, nothing touched`);
  }
});
