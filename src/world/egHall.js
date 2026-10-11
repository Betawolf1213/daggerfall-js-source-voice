// @ts-check
// EG-PLAY (2026-10-11, the Elite Gates arc; bible/11-Multiplayer/Elite-Gates.md sections 7, 8, 11 and 24): THE SPIRE'S
// HALLS, MADE - a circle of an Elite Breach as one made level, the Hour's way (world/sdRealm.js): a made location and a
// blocks file answering one made block (its start marker on the first hall's arrival plate), the halls' floors as one
// mesh and one collider bucket, their lamps, their light. Built off the hall law (net/egLaw.js egCircleSpecs) - one seed
// and one circle give one level on every screen, and the relay judges the same floors.
//
// A CIRCLE IS ONE LEVEL (EG-PLAY's form of THE SWAP, section 7): its five halls stand side by side EG_HALL_PITCH apart
// (each in its own frame about its origin - net/egLaw.js), far past the fog, and the pull between them is a step
// through the veil to the next hall's plate in the same level; a new circle is a new level, built as the Hour's is
// entered. What each hall is made of:
//   its PLATES - the arrival plate (a gold ring inset) and the end plate (its door's two posts and lintel), the Hour's
//     islands (realmIsland);
//   its COURT DISCS - a Rift-Yard's, a proving court's and the Court's floors, bronze plates in rings, and a Rampart's
//     bastions;
//   its BANDS - bridges and the Rampart's walkway, kerbed in brass, an edge line on each side;
//   its OBLIVION CAVERNS PASSAGE (section 11's first fragment) - a tunnel of basalt over the course, its floor broken by a
//     chasm crossed on ledges, the fire running down its walls in channels, a fire-fall curtain at the chasm's lip;
//   its SPAN'S STEPS - not here: they move, so the span's set stands them (scenes/egSpan.js).
// The Hour's art dresses them (world/sdRealmArt.js: its stone, its brass, its bronze plates, its basalt, its gold edge
// line) - EG16's white marble and gold is the Spire's own look, to come; said so in the arc's record.
//
// Not a DFU member. Ledger A (ELITE-GATES).
import { realmToDungeon } from '../net/sdBrain.js';
import { faces } from './gateModel.js';
import { realmIsland, packRealmFaces, SD_REALM_FLOOR_RECORD, SD_REALM_BRASS_RECORD, SD_REALM_ROOT_RECORD, SD_REALM_ARENA_RECORD, SD_REALM_EDGE_RECORD, SD_REALM_PILLAR_RECORD, SD_REALM_COBBLE_RECORD, SD_ISLAND_SIDES } from './sdRealm.js';
import { egCircleSpecs, EG_TEXT } from '../net/egLaw.js';

/** The made location's id (the Hour's is 0x7ffff200, the court's 0x7ffff000), its one block's name and index. */
export const EG_HALL_LOCATION_ID = 0x7ffff300;
export const EG_HALL_BLOCK = 'SPIRE.RDB';
export const EG_HALL_BLOCK_INDEX = 900300;
const UNITS_PER_M = 40;
/** The door's posts and lintel (m), a lamp's head and reach, the walkway's lamp pitch. */
export const EG_DOOR = Object.freeze({ halfW: 1.6, post: 0.5, h: 4.2, lintel: 0.6 });
export const EG_LAMP = Object.freeze({ h: 2.6, range: 14, color: Object.freeze([1.0, 0.78, 0.42]), lava: Object.freeze([1.0, 0.45, 0.12]), pitch: 24 });
/** The made level's fog and light: the Hour's brass haze, a little deeper - the Spire hangs in a darker void. */
export const EG_HALL_FOG = Object.freeze({ mode: 'exp', density: 0.006, color: Object.freeze([0.12, 0.08, 0.07]) });

/**
 * THE MADE LOCATION - a name, a region, a climate, the map table's row (map id 0: no world room keys off it; the breach's
 * room is the relay's own `eg:<b>`), the dungeon's record and its one block; `egBreach` the breach, `egSeed` its seed,
 * `egCircle` the circle this level is.
 * @param {{ b: string, seed: number, c: number, geo?: number, regionIndex?: number, regionName?: string, climate?: { worldClimate: number, climateType: number } }} o
 */
export function egHallLocation({ b, seed, c, geo = 0, regionIndex = -1, regionName = '', climate = { worldClimate: 231, climateType: 2 } }) {
  return {
    name: 'The Battlespire', regionIndex, regionName, locationIndex: -1, hasDungeon: true,
    climate: { worldClimate: climate.worldClimate, climateType: climate.climateType },
    mapTableData: { mapId: 0, locationType: -1, dungeonType: 0, longitude: 0, latitude: 0 },
    exterior: { exteriorData: { locationId: EG_HALL_LOCATION_ID } },
    dungeon: {
      recordElement: { header: { locationId: EG_HALL_LOCATION_ID, unknown: 0 } },
      blocks: [{ x: 0, z: 0, blockName: EG_HALL_BLOCK, isStartingBlock: true, blockIndex: 0, blockNumber: 0, blockNumberStartIndexBitfield: 0 }],
    },
    egBreach: b, egSeed: seed >>> 0, egCircle: c, egGeo: geo | 0,
  };
}
/** Is this location a circle of an Elite Breach? */
export const isEgHall = (loc) => typeof loc?.egBreach === 'string' && Number.isSafeInteger(loc?.egCircle) && loc?.dungeon?.recordElement?.header?.locationId === EG_HALL_LOCATION_ID;
/** THE EMPTY BLOCK: its start marker on the first hall's arrival plate (slot 1's origin), nothing else. */
export function egHallBlock() {
  const [x, , z] = realmToDungeon(0, 0, 1.5);
  const marker = {
    type: 0x03, position: 1, index: 0, xPos: Math.round(x * UNITS_PER_M), yPos: 0, zPos: Math.round(z * UNITS_PER_M),
    resources: { flatResource: { textureArchive: 199, textureRecord: 10, flags: 0, magnitude: 0, soundIndex: 0, factionOrMobileId: 0, nextObjectOffset: -1, action: 0, position: 0 } },
  };
  return { name: EG_HALL_BLOCK, position: 0, rdbBlock: { modelReferenceList: [], objectRootList: [{ rdbObjects: [marker] }] } };
}
/** THE BLOCKS FILE THE LEVEL IS LAID FROM: the real one, answering one name more. */
export function egHallBlocks(real) {
  const block = egHallBlock();
  return {
    getBlockIndex: (name) => (name === EG_HALL_BLOCK ? EG_HALL_BLOCK_INDEX : real ? real.getBlockIndex(name) : -1),
    getBlock: (i) => (i === EG_HALL_BLOCK_INDEX ? block : real ? real.getBlock(i) : null),
  };
}

/** A hall-frame point (net/egLaw.js) in the dungeon's frame. */
export const egToDungeon = (spec, x, y, z) => realmToDungeon(spec.x0 + x, y, z);
/** A hall's centre in the dungeon's frame - the origin its fight's frames are said about (the gate's driver's `centre`). */
export const egHallCentre = (spec) => realmToDungeon(spec.x0, 0, 0);
/** A dungeon-frame point in hall `spec`'s own frame. */
export const egFromDungeon = (spec, p) => [p[0] - realmToDungeon(spec.x0, 0, 0)[0], p[1], p[2] - realmToDungeon(0, 0, 0)[2]];

// ── the builders ───────────────────────────────────────────────────────────────────────────────────────────
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/** A quad wound to face `want` (faces' normal is (b - a) x (c - a)). */
function quadTo(f, rec, a, b, c, d, want, uv = [[0, 0], [1, 0], [1, 1], [0, 1]]) {
  if (dot(cross(sub(b, a), sub(c, a)), want) >= 0) f.quad(rec, a, b, c, d, uv[0], uv[1], uv[2], uv[3]);
  else f.quad(rec, a, d, c, b, uv[0], uv[3], uv[2], uv[1]);
}
/** A box from (x0, y0, z0) to (x1, y1, z1) in the dungeon's frame, every face out (`under` false: no underside). */
function boxD(f, rec, x0, y0, z0, x1, y1, z1, under = true, s = 1) {
  const P = (x, y, z) => [x, y, z];
  const u = (a, b) => [[0, 0], [a * s, 0], [a * s, b * s], [0, b * s]];
  quadTo(f, rec, P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1), [0, 1, 0], u(x1 - x0, z1 - z0));
  if (under) quadTo(f, rec, P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1), [0, -1, 0], u(x1 - x0, z1 - z0));
  quadTo(f, rec, P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0), [0, 0, -1], u(x1 - x0, y1 - y0));
  quadTo(f, rec, P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1), [0, 0, 1], u(x1 - x0, y1 - y0));
  quadTo(f, rec, P(x0, y0, z0), P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0), [-1, 0, 0], u(z1 - z0, y1 - y0));
  quadTo(f, rec, P(x1, y0, z0), P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0), [1, 0, 0], u(z1 - z0, y1 - y0));
}
/** A band (a bridge, the walkway, a passage's floor): its floor, its brass kerbs, its torn lip, its edge lines. */
function bandModel(f, spec, b) {
  const D = (x, y, z) => egToDungeon(spec, x, y, z);
  const xl = b.x - b.halfW, xr = b.x + b.halfW, y = b.y;
  const rec = b.role === 'walk' ? SD_REALM_COBBLE_RECORD : SD_REALM_FLOOR_RECORD;
  quadTo(f, rec, D(xl, y, b.z0), D(xr, y, b.z0), D(xr, y, b.z1), D(xl, y, b.z1), [0, 1, 0], [[xl / 2, b.z0 / 2], [xr / 2, b.z0 / 2], [xr / 2, b.z1 / 2], [xl / 2, b.z1 / 2]]);
  if (b.role === 'cave') return;   // the passage's walls are its kerbs
  for (const [x0, x1] of [[xl, xl + 0.18], [xr - 0.18, xr]]) { const a = D(x0, y, b.z0), c = D(x1, y + 0.12, b.z1); boxD(f, SD_REALM_BRASS_RECORD, a[0], a[1], a[2], c[0], c[1], c[2], false); }
  for (const x of [xl, xr]) { const a = D(x, y - 0.9, b.z0), c = D(x, y, b.z1); quadTo(f, SD_REALM_ROOT_RECORD, [a[0], a[1], a[2]], [a[0], a[1], c[2]], [a[0], c[1], c[2]], [a[0], c[1], a[2]], [x < b.x ? -1 : 1, 0, 0]); }
  for (const x of [xl - 0.004, xr + 0.004]) { const a = D(x, y + 0.124, b.z0), c = D(x, y + 0.124, b.z1); const s2 = x < b.x ? 0.05 : -0.05; quadTo(f, SD_REALM_EDGE_RECORD, [a[0], a[1], a[2]], [a[0] + s2, a[1], a[2]], [c[0] + s2, c[1], c[2]], [c[0], c[1], c[2]], [0, 1, 0]); }
}
/** The Oblivion Caverns passage: its walls and ceiling of basalt, its fire channels at the walls' feet, its curtain. */
function caveModel(f, spec, q) {
  const D = (x, y, z) => egToDungeon(spec, x, y, z), y0 = q.y, y1 = q.y + q.height, w = q.halfW;
  for (const s of [-1, 1]) {
    const a = D(s * (w + 0.6), y0 - 1.2, q.z0), c = D(s * w, y1, q.z1);
    boxD(f, SD_REALM_PILLAR_RECORD, Math.min(a[0], c[0]), a[1], a[2], Math.max(a[0], c[0]), c[1], c[2], true, 0.5);
    // the fire running down the wall's foot - a glowing channel the length of the passage, broken over the chasm
    for (const [z0, z1] of [[q.z0, q.zA], [q.zB, q.z1]]) { const g0 = D(s * (w - 0.35), y0 + 0.01, z0), g1 = D(s * (w - 0.05), y0 + 0.01, z1); quadTo(f, SD_REALM_EDGE_RECORD, [Math.min(g0[0], g1[0]), g0[1], g0[2]], [Math.max(g0[0], g1[0]), g0[1], g0[2]], [Math.max(g0[0], g1[0]), g1[1], g1[2]], [Math.min(g0[0], g1[0]), g1[1], g1[2]], [0, 1, 0]); }
  }
  const a = D(-w - 0.6, y1, q.z0), c = D(w + 0.6, y1 + 1.0, q.z1);
  boxD(f, SD_REALM_ROOT_RECORD, a[0], a[1], a[2], c[0], c[1], c[2], true, 0.5);
  // the fire-fall curtain at the chasm's lip: a sheet down each wall, a gap of open air between (the way through)
  for (const s of [-1, 1]) { const p0 = D(s * w, y0 + 0.4, q.curtain), p1 = D(s * (w - 1.1), y1, q.curtain); quadTo(f, SD_REALM_EDGE_RECORD, [p0[0], p0[1], p0[2]], [p1[0], p0[1], p0[2]], [p1[0], p1[1], p1[2]], [p0[0], p1[1], p1[2]], [0, 0, -1]); }
}
/** A plate: the Hour's island, and its mark - the arrival plate's gold ring inset; the end plate's door (two posts and a
 *  lintel of basalt across its far side). */
function plateModel(f, spec, d) {
  const [sx, , sz] = [spec.x0 + d.x, 0, d.z];
  realmIsland(f, sx, sz, d.r, SD_REALM_FLOOR_RECORD, { y: d.y });
  if (d.role === 'arrive') {
    for (let k = 0; k < SD_ISLAND_SIDES; k++) {
      const a0 = (k / SD_ISLAND_SIDES) * Math.PI * 2, a1 = ((k + 1) / SD_ISLAND_SIDES) * Math.PI * 2, r0 = d.r - 1.4, r1 = d.r - 1.2;
      const P = (r, a) => realmToDungeon(sx + Math.cos(a) * r, d.y + 0.01, sz + Math.sin(a) * r);
      quadTo(f, SD_REALM_EDGE_RECORD, P(r0, a0), P(r0, a1), P(r1, a1), P(r1, a0), [0, 1, 0]);
    }
  }
  if (d.role === 'end') {
    const D = (x, y, z) => realmToDungeon(sx + x, d.y + y, sz + z), zz = 0;
    for (const s of [-1, 1]) { const a = D(s * EG_DOOR.halfW - EG_DOOR.post / 2, 0, zz - EG_DOOR.post / 2), c = D(s * EG_DOOR.halfW + EG_DOOR.post / 2, EG_DOOR.h, zz + EG_DOOR.post / 2); boxD(f, SD_REALM_PILLAR_RECORD, a[0], a[1], a[2], c[0], c[1], c[2], false, 0.5); }
    const a = D(-EG_DOOR.halfW - EG_DOOR.post, EG_DOOR.h, zz - EG_DOOR.post / 2), c = D(EG_DOOR.halfW + EG_DOOR.post, EG_DOOR.h + EG_DOOR.lintel, zz + EG_DOOR.post / 2);
    boxD(f, SD_REALM_BRASS_RECORD, a[0], a[1], a[2], c[0], c[1], c[2], true, 0.5);
  }
}

/** EG-FULL: A LANE (a bridge at any bearing - Grath's between his islands, a perch's side span, a caster's): its floor,
 *  its brass kerbs, its edge lines. */
function laneModel(f, spec, l) {
  const dx = l.bx - l.ax, dz = l.bz - l.az, len = Math.hypot(dx, dz) || 1, nx = -dz / len, nz = dx / len, y = l.y ?? 0;
  const P = (x, yy, z) => egToDungeon(spec, x, yy, z);
  const a0 = [l.ax + nx * l.hw, l.az + nz * l.hw], a1 = [l.ax - nx * l.hw, l.az - nz * l.hw], b0 = [l.bx + nx * l.hw, l.bz + nz * l.hw], b1 = [l.bx - nx * l.hw, l.bz - nz * l.hw];
  quadTo(f, SD_REALM_FLOOR_RECORD, P(a0[0], y, a0[1]), P(a1[0], y, a1[1]), P(b1[0], y, b1[1]), P(b0[0], y, b0[1]), [0, 1, 0], [[0, 0], [l.hw, 0], [l.hw, len / 2], [0, len / 2]]);
  for (const [p0, p1, side] of /** @type {[number[], number[], number][]} */ ([[a0, b0, 1], [a1, b1, -1]])) {
    quadTo(f, SD_REALM_ROOT_RECORD, P(p0[0], y - 0.9, p0[1]), P(p1[0], y - 0.9, p1[1]), P(p1[0], y, p1[1]), P(p0[0], y, p0[1]), [nx * side, 0, nz * side]);
    const o = 0.05 * side;
    quadTo(f, SD_REALM_EDGE_RECORD, P(p0[0], y + 0.02, p0[1]), P(p1[0], y + 0.02, p1[1]), P(p1[0] - nx * o, y + 0.02, p1[1] - nz * o), P(p0[0] - nx * o, y + 0.02, p0[1] - nz * o), [0, 1, 0]);
  }
}
/** EG-FULL: THE GROUNDS' DRESS (section 13.3, 11.4) - a chamber's ring wall (open where the course enters and leaves), a
 *  magma chamber's molten floor far below, a pit's tiers, the forge's long walls. */
function decoModel(f, spec, d) {
  const P = (x, yy, z) => egToDungeon(spec, x, yy, z);
  if (d.t === 'wall' || d.t === 'tiers') {
    const n = 32, y0 = (d.y ?? 0) - 0.5, y1 = (d.y ?? 0) + (d.t === 'tiers' ? d.h * 0.5 : d.h);
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2, mid = (a0 + a1) / 2;
      if (Math.abs(Math.sin(mid)) < 0.2) continue;   // the gaps where the course comes in (-z) and goes on (+z)
      const p0 = [d.x + Math.sin(a0) * d.r, d.z + Math.cos(a0) * d.r], p1 = [d.x + Math.sin(a1) * d.r, d.z + Math.cos(a1) * d.r];
      quadTo(f, SD_REALM_PILLAR_RECORD, P(p0[0], y0, p0[1]), P(p1[0], y0, p1[1]), P(p1[0], y1, p1[1]), P(p0[0], y1, p0[1]), [-(Math.sin(mid)), 0, -(Math.cos(mid))], [[0, 0], [1, 0], [1, (y1 - y0) / 2], [0, (y1 - y0) / 2]]);
      if (d.t === 'tiers') for (let s = 1; s <= 3; s++) { const r = d.r + s * 1.2, yy = y0 + s * (d.h / 6); const q0 = [d.x + Math.sin(a0) * r, d.z + Math.cos(a0) * r], q1 = [d.x + Math.sin(a1) * r, d.z + Math.cos(a1) * r]; quadTo(f, SD_REALM_ROOT_RECORD, P(p0[0] + (q0[0] - p0[0]) * 0.1, yy, p0[1] + (q0[1] - p0[1]) * 0.1), P(p1[0] + (q1[0] - p1[0]) * 0.1, yy, p1[1] + (q1[1] - p1[1]) * 0.1), P(q1[0], yy, q1[1]), P(q0[0], yy, q0[1]), [0, 1, 0]); }
    }
  } else if (d.t === 'magma') {
    const y = d.y ?? -1.5, r = d.r;
    quadTo(f, SD_REALM_EDGE_RECORD, P(d.x - r, y, d.z - r), P(d.x + r, y, d.z - r), P(d.x + r, y, d.z + r), P(d.x - r, y, d.z + r), [0, 1, 0], [[0, 0], [r / 4, 0], [r / 4, r / 4], [0, r / 4]]);
  } else if (d.t === 'hall') {
    for (const sgn of [-1, 1]) { const x = d.x + sgn * d.hw; quadTo(f, SD_REALM_PILLAR_RECORD, P(x, (d.y ?? 0) - 0.5, d.z0), P(x, (d.y ?? 0) - 0.5, d.z1), P(x, (d.y ?? 0) + d.h, d.z1), P(x, (d.y ?? 0) + d.h, d.z0), [-sgn, 0, 0], [[0, 0], [(d.z1 - d.z0) / 2, 0], [(d.z1 - d.z0) / 2, d.h / 2], [0, d.h / 2]]); }
  }
}
/** THE CIRCLE'S HALLS, as one mesh (renderer.createMesh's model - the Hour's archive's records). `geo` the circle's span
 *  decrees (net/egLaw.js egGeoOf) - the same specs the relay judges. */
export function buildEgCircleModel(seed, c, geo = 0) {
  const f = faces();
  for (const spec of egCircleSpecs(seed, c, geo)) {
    for (const d of spec.discs) {
      if (d.role === 'arrive' || d.role === 'end') plateModel(f, spec, d);
      else realmIsland(f, spec.x0 + d.x, d.z, d.r, d.role === 'court' || d.role === 'isle' || d.role === 'balcony' ? SD_REALM_ARENA_RECORD : SD_REALM_FLOOR_RECORD, { y: d.y, bands: d.role === 'court' || d.role === 'isle' ? Math.max(2, Math.round(d.r / 4)) : 0 });
    }
    for (const b of spec.bands) bandModel(f, spec, b);
    for (const l of spec.lanes ?? []) laneModel(f, spec, l);
    for (const q of spec.caves) caveModel(f, spec, q);
    for (const d of spec.deco ?? []) decoModel(f, spec, d);
  }
  return packRealmFaces(f);
}

/** THE CIRCLE'S FLOORS AND WALLS, FOR THE COLLIDER (the dungeon's frame; both faces are one to the collider): its discs,
 *  its bands, its passages' walls and ceilings, its doors' posts. One bucket. */
export function egCircleColliderTris(seed, c, geo = 0) {
  const out = [];
  const tri = (a, b, d) => out.push(a[0], a[1], a[2], b[0], b[1], b[2], d[0], d[1], d[2]);
  const quad = (a, b, d, e) => { tri(a, b, d); tri(a, d, e); };
  const box = (x0, y0, z0, x1, y1, z1) => {
    const P = (x, y, z) => [x, y, z];
    quad(P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)); quad(P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1));
    quad(P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)); quad(P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1));
    quad(P(x0, y0, z0), P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0)); quad(P(x1, y0, z0), P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0));
  };
  for (const spec of egCircleSpecs(seed, c, geo)) {
    for (const l of spec.lanes ?? []) {
      const dx = l.bx - l.ax, dz = l.bz - l.az, len = Math.hypot(dx, dz) || 1, nx = -dz / len, nz = dx / len, y = l.y ?? 0;
      quad(egToDungeon(spec, l.ax + nx * l.hw, y, l.az + nz * l.hw), egToDungeon(spec, l.ax - nx * l.hw, y, l.az - nz * l.hw), egToDungeon(spec, l.bx - nx * l.hw, y, l.bz - nz * l.hw), egToDungeon(spec, l.bx + nx * l.hw, y, l.bz + nz * l.hw));
    }
    for (const d of spec.deco ?? []) {
      if (d.t === 'wall') {
        const n = 32, y0 = (d.y ?? 0) - 0.5, y1 = (d.y ?? 0) + d.h;
        for (let k = 0; k < n; k++) {
          const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2, mid = (a0 + a1) / 2;
          if (Math.abs(Math.sin(mid)) < 0.2) continue;
          const p0 = egToDungeon(spec, d.x + Math.sin(a0) * d.r, y0, d.z + Math.cos(a0) * d.r), p1 = egToDungeon(spec, d.x + Math.sin(a1) * d.r, y0, d.z + Math.cos(a1) * d.r);
          quad(p0, p1, [p1[0], p1[1] + (y1 - y0), p1[2]], [p0[0], p0[1] + (y1 - y0), p0[2]]);
        }
      } else if (d.t === 'hall') {
        for (const sgn of [-1, 1]) { const a = egToDungeon(spec, d.x + sgn * d.hw, (d.y ?? 0) - 0.5, d.z0), b = egToDungeon(spec, d.x + sgn * d.hw, (d.y ?? 0) - 0.5, d.z1); quad(a, b, [b[0], b[1] + d.h + 0.5, b[2]], [a[0], a[1] + d.h + 0.5, a[2]]); }
      }
    }
    for (const d of spec.discs) {
      for (let k = 0; k < SD_ISLAND_SIDES; k++) {
        const a0 = (k / SD_ISLAND_SIDES) * Math.PI * 2, a1 = ((k + 1) / SD_ISLAND_SIDES) * Math.PI * 2;
        tri(realmToDungeon(spec.x0 + d.x, d.y, d.z), realmToDungeon(spec.x0 + d.x + Math.cos(a1) * d.r, d.y, d.z + Math.sin(a1) * d.r), realmToDungeon(spec.x0 + d.x + Math.cos(a0) * d.r, d.y, d.z + Math.sin(a0) * d.r));
      }
      if (d.role === 'end') {
        for (const s of [-1, 1]) { const a = realmToDungeon(spec.x0 + d.x + s * EG_DOOR.halfW - EG_DOOR.post / 2, d.y, d.z - EG_DOOR.post / 2), e = realmToDungeon(spec.x0 + d.x + s * EG_DOOR.halfW + EG_DOOR.post / 2, d.y + EG_DOOR.h, d.z + EG_DOOR.post / 2); box(a[0], a[1], a[2], e[0], e[1], e[2]); }
      }
    }
    for (const b of spec.bands) quad(egToDungeon(spec, b.x - b.halfW, b.y, b.z0), egToDungeon(spec, b.x + b.halfW, b.y, b.z0), egToDungeon(spec, b.x + b.halfW, b.y, b.z1), egToDungeon(spec, b.x - b.halfW, b.y, b.z1));
    for (const q of spec.caves) {
      for (const s of [-1, 1]) { const a = egToDungeon(spec, s * (q.halfW + 0.6), q.y - 1.2, q.z0), e = egToDungeon(spec, s * q.halfW, q.y + q.height, q.z1); box(Math.min(a[0], e[0]), a[1], a[2], Math.max(a[0], e[0]), e[1], e[2]); }
      const a = egToDungeon(spec, -q.halfW - 0.6, q.y + q.height, q.z0), e = egToDungeon(spec, q.halfW + 0.6, q.y + q.height + 1, q.z1);
      box(a[0], a[1], a[2], e[0], e[1], e[2]);
    }
  }
  return new Float32Array(out);
}

/** THE RAMPART'S PORTCULLIS (section 8.3): bars across its walkway's end, held by its Ward-Bearers - its own mesh and its
 *  own collider triangles (the scene sinks both once its door opens). `null` for a hall with no gate. */
export function egGateParts(spec) {
  if (!spec.gate) return null;
  const g = spec.gate, f = faces(), tris = [];
  const n = Math.max(4, Math.round((g.halfW * 2) / 0.55));
  for (let k = 0; k <= n; k++) {
    const x = -g.halfW + (k / n) * g.halfW * 2;
    const a = egToDungeon(spec, x - 0.07, 0, g.z - 0.07), c = egToDungeon(spec, x + 0.07, 4.2, g.z + 0.07);
    boxD(f, SD_REALM_BRASS_RECORD, a[0], a[1], a[2], c[0], c[1], c[2], false, 0.5);
  }
  for (const yb of [1.2, 2.6, 4.0]) { const a = egToDungeon(spec, -g.halfW, yb, g.z - 0.09), c = egToDungeon(spec, g.halfW, yb + 0.16, g.z + 0.09); boxD(f, SD_REALM_PILLAR_RECORD, a[0], a[1], a[2], c[0], c[1], c[2], true, 0.5); }
  const a = egToDungeon(spec, -g.halfW, 0, g.z - 0.15), c = egToDungeon(spec, g.halfW, 4.2, g.z + 0.15);
  const P = (x, y, z) => [x, y, z];
  for (const z of [a[2], c[2]]) tris.push(...P(a[0], 0, z), ...P(c[0], 0, z), ...P(c[0], 4.2, z), ...P(a[0], 0, z), ...P(c[0], 4.2, z), ...P(a[0], 4.2, z));
  return { model: packRealmFaces(f), tris: new Float32Array(tris) };
}

/** THE CIRCLE'S LAMPS (the light list's shape, the dungeon's frame): two by each plate, round each court's rim, along the
 *  walkway, the fire in each passage's channels. */
export function egCircleLights(seed, c, geo = 0) {
  const out = [];
  const lamp = (p, color = EG_LAMP.color, range = Number(EG_LAMP.range)) => out.push({ x: p[0], y: p[1], z: p[2], range, color: [...color] });
  for (const spec of egCircleSpecs(seed, c, geo)) {
    for (const d of spec.discs) {
      const n = d.role === 'court' || d.role === 'isle' ? 6 : d.role === 'arrive' || d.role === 'end' ? 2 : d.role === 'bastion' || d.role === 'balcony' || d.role === 'perch' ? 1 : 0;
      for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + Math.PI / 4; lamp(egToDungeon(spec, d.x + Math.cos(a) * (d.r - 1), d.y + EG_LAMP.h, d.z + Math.sin(a) * (d.r - 1))); }
    }
    if (spec.walk) for (let z = spec.walk.z0 + 8; z < spec.walk.z1; z += EG_LAMP.pitch) for (const s of [-1, 1]) lamp(egToDungeon(spec, s * (spec.walk.halfW + 0.3), EG_LAMP.h, z));
    for (const q of spec.caves) for (const z of [q.z0 + 3, q.curtain, (q.zB + q.z1) / 2]) lamp(egToDungeon(spec, 0, q.y + 1.6, z), EG_LAMP.lava, 10);
  }
  return out;
}
/** The lamps nearest `eye` first, the arm's own lights before them, in kept arrays (world/sdRealm.js realmLightsWith's
 *  composition, over the circle's own lamps). */
const _egLit = { cap: 0, data: new Float32Array(0), colors: new Float32Array(0), carried: new Uint8Array(0), views: new Map() };
export function egLightsWith(lit, extra, lamps, eye) {
  const n = lit.data.length / 4, H = _egLit;
  if (eye && lamps.length > 1) {
    const ex = eye[0], ez = eye[2];
    for (let i = 1; i < lamps.length; i++) {
      const l = lamps[i], dl = (l.x - ex) ** 2 + (l.z - ez) ** 2;
      let j = i - 1;
      while (j >= 0 && (lamps[j].x - ex) ** 2 + (lamps[j].z - ez) ** 2 > dl) { lamps[j + 1] = lamps[j]; j--; }
      lamps[j + 1] = l;
    }
  }
  const m = n + extra.length + Math.min(lamps.length, 24);
  if (m > H.cap) { H.cap = Math.max(m, H.cap * 2, 32); H.data = new Float32Array(H.cap * 4); H.colors = new Float32Array(H.cap * 3); H.carried = new Uint8Array(H.cap); H.views.clear(); }
  for (let j = 0; j < n * 4; j++) H.data[j] = lit.data[j];
  for (let j = 0; j < n * 3; j++) H.colors[j] = lit.colors[j];
  const lc = lit.data.carried;
  for (let j = 0; j < m; j++) H.carried[j] = j < n && lc ? lc[j] : 0;
  for (let i = n; i < m; i++) {
    const q = i - n, l = q < extra.length ? extra[q] : lamps[q - extra.length];
    H.data[i * 4] = l.x; H.data[i * 4 + 1] = l.y; H.data[i * 4 + 2] = l.z; H.data[i * 4 + 3] = l.range;
    H.colors[i * 3] = l.color[0]; H.colors[i * 3 + 1] = l.color[1]; H.colors[i * 3 + 2] = l.color[2];
  }
  let v = H.views.get(m);
  if (!v) {
    /** @type {Float32Array & { carried?: Uint8Array }} */
    const data = H.data.subarray(0, m * 4), carried = H.carried.subarray(0, m);
    data.carried = carried;
    v = { data, colors: H.colors.subarray(0, m * 3), carried };
    H.views.set(m, v);
  }
  return v;
}
/** The level's light (a dungeon trilight and its key): the Hour's warmth under a deeper void, the key from above and
 *  behind the halls (+z). One object, its arrays set again each call. */
const _egLight = { tri: { sky: [0.14, 0.13, 0.16], equator: [0.13, 0.1, 0.08], ground: [0.36, 0.16, 0.06] }, key: { scale: 0.7, dir: [0, 0.62 / Math.hypot(0.62, 1), 1 / Math.hypot(0.62, 1)], color: [0.92, 0.88, 0.82] } };
export const egHallLighting = () => _egLight;
/** The words the level's refusals say (the dungeon host's save, map and rest arms). */
export const EG_HALL_TEXT = Object.freeze({ noSave: EG_TEXT.noSave, noMap: EG_TEXT.noMap, noRest: EG_TEXT.noRest });
