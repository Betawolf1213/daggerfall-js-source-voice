// @ts-check
// SHIPYARDS (2026-10-11; asked what the lighthouse is, Mac chose "Climbable, with keeper - stone tower and keeper's
// cottage; the lamp lit from dusk with a sweeping beam seen far out at sea; the keeper lets you climb to the gallery for
// the view"): WHAT A PORT TOWN'S LIGHTHOUSE IS MADE OF - the port's own geometry in its own frame (y up from its ground,
// its FRONT - its gate and its doors, the town's side - along +z, the SEA behind it along -z, x across), worn in the
// port's own art (world/portArt.js) through the yards' face kit (world/merchantYardModels.js). Every face is wound
// outward and the collider is the same triangles - with one more: a GUARD round the gallery (`guardBand`), a closed
// corridor the eye never sees - a band from the floor just inside the railing and a lid over it to the lantern room -
// so neither a step back, nor a jump, nor a climb takes anyone off the gallery (AUDIT SHIPYARDS L4-1), stood by the pool
// while someone is on the gallery under it (its lid kept nobody coming down from landing). The lantern
// room's glass and its lens are a mesh of their own (`buildLighthouseGlass`), drawn casting no shadow: the lamp stands
// inside them (AUDIT SHIPYARDS L5-2).
//
// THE COMPOUND (world/portSites.js PORT_FOOT.lighthouse, 13 m square): a low stone wall round cobbles, its gate in the
// front. THE TOWER stands toward the sea: a stone PLINTH, then the tower whitewashed and tapering, two red bands round
// it, slit windows up its faces, a studded door at its foot to the town; at its head a corbelled GALLERY, ringed by an
// iron railing, and on the gallery the LANTERN ROOM - its glass in iron mullions, the lamp lit within, a cornice, a
// copper dome, a vent ball and a weathervane. A hatch in the gallery's floor on its town side is the way down. THE
// KEEPER'S COTTAGE stands beside it: whitewashed walls, a slate gable, a chimney, its door and windows to the yard; a
// bench, a water butt and the lamp's oil casks by the tower's door.
//
// The keeper is the host's (scenes/portHost.js), as are the light and its beams (`LIGHTHOUSE.lamp`), and the climb -
// the door at the tower's foot and the hatch at its head (`LIGHTHOUSE.points`).
//
// Pure: no renderer, no GL, no clock. Not a DFU member. Ledger A (SHIPYARDS).
import { YARD_MESH_KIT, YARD_SINK, YARD_TILE_M } from './merchantYardModels.js';
import { PORT_ARCHIVE, PORT_REC } from './portArt.js';
import { PORT_FOOT } from './portSites.js';
import { beam } from './shipyardModel.js';

const { faces, hexa, box, floor, drum, assemble, uvOf } = YARD_MESH_KIT;   // the yards' face kit

const R = PORT_REC;
const F = PORT_FOOT.lighthouse;
/** The tower's sides (a sixteen-sided prism, a face square to each axis), its middle, its plinth, its taper, its bands,
 *  its gallery and its lantern room - metres in the lighthouse's frame. */
export const TOWER_SIDES = 16;
export const LIGHTHOUSE = Object.freeze({
  wall: Object.freeze({ x0: -F.hx + 0.3, x1: F.hx - 0.3, z0: -F.hz + 0.3, z1: F.hz - 0.3, h: 1.0, t: 0.4, gate: 1.1 }),
  tower: Object.freeze({ x: 0, z: -1.7, plinthR: 3.35, plinthH: 1.0, r0: 2.85, r1: 2.1, top: 17.6, bands: Object.freeze([Object.freeze([5.6, 7.6]), Object.freeze([11.6, 13.6])]) }),
  gallery: Object.freeze({ r: 3.15, t: 0.3, railR: 3.0, railH: 1.12, guardH: 2.2 }),
  lantern: Object.freeze({ r: 1.72, wallH: 0.75, glassH: 2.05, cornice: 0.16, domeH: 1.35, mullions: 12 }),
  cottage: Object.freeze({ x0: 2.6, x1: 6.0, z0: 0.7, z1: 5.6, wallH: 2.6, ridge: 4.0 }),
  door: Object.freeze({ w: 1.1, h: 2.15 }),
});
const T = LIGHTHOUSE.tower, G = LIGHTHOUSE.gallery, L = LIGHTHOUSE.lantern;
/** The tower's radius at height y (its taper from the plinth to the gallery). */
export const towerR = (y) => T.r0 + ((T.r1 - T.r0) * Math.max(0, Math.min(T.top, y) - T.plinthH)) / (T.top - T.plinthH);
/** The gallery's floor (y). */
export const GALLERY_Y = T.top + 0.0;
/** How far before the door's step a climb down stands the player (m): past a body's capsule (player/motor.js
 *  CAPSULE_RADIUS) by a hand, so the way down lands on the ground and not in the step. */
export const STEP_CLEAR = 0.5;
/** The door's step before the tower, in the lighthouse's frame - [x0, y0, z0, x1, y1, z1]. */
export const STEP_BOX = Object.freeze([T.x - 0.9, 0, T.z + T.plinthR - 0.05, T.x + 0.9, T.plinthH * 0.5, T.z + T.plinthR + 0.55]);
/** The lamp's middle, and where the people and the climb stand - [x, y, z] in the lighthouse's frame: the keeper by the
 *  tower's door; the door's foot (where a climb starts and a climb down ends, facing the town); the gallery's sea side
 *  (where the climb comes out, facing the sea); the hatch on its town side (the way down). */
export const LIGHTHOUSE_POINTS = Object.freeze({
  lamp: Object.freeze([T.x, GALLERY_Y + L.wallH + L.glassH * 0.55, T.z]),
  keeper: Object.freeze([T.x - 1.6, 0, T.z + T.r0 + 1.25]),
  foot: Object.freeze([T.x, 0, T.z + T.plinthR + 0.55 + STEP_CLEAR]),   // AUDIT SHIPYARDS L4-4: before the door's step, never in it
  gallery: Object.freeze([T.x, GALLERY_Y, T.z - (L.r + G.railR) / 2]),
  hatch: Object.freeze([T.x, GALLERY_Y, T.z + (L.r + G.railR) / 2]),
});

/** A section of a prism about (cx, cz) of `sides` faces, a face square to each axis (its corners half a step round),
 *  from radius r0 at y0 to r1 at y1 - its sides alone, dressed in `rec`; `cap` lays its top too. */
function section(f, rec, cx, cz, sides, r0, r1, y0, y1, { cap = null, under = null } = {}) {
  const step = (Math.PI * 2) / sides, phase = step / 2;
  const p = (r, k, y) => [cx + Math.cos(phase + k * step) * r, y, cz + Math.sin(phase + k * step) * r];
  const around = (r0 + r1) * Math.PI / sides / YARD_TILE_M;
  for (let k = 0; k < sides; k++) {
    const mid = phase + (k + 0.5) * step, out = [Math.cos(mid), 0, Math.sin(mid)];
    const u0 = (k * around) % 8, u1 = u0 + around;
    f.quad(rec, p(r0, k, y0), p(r0, k + 1, y0), p(r1, k + 1, y1), p(r1, k, y1), [u0, y1 / YARD_TILE_M], [u1, y1 / YARD_TILE_M], [u1, y0 / YARD_TILE_M], [u0, y0 / YARD_TILE_M], out);
  }
  if (cap != null) for (let k = 0; k < sides; k++) {
    const a = phase + k * step, b = phase + (k + 1) * step;
    f.tri(cap, [cx, y1, cz], p(r1, k + 1, y1), p(r1, k, y1), [0.5, 0.5], [0.5 + Math.cos(b) * 0.45, 0.5 + Math.sin(b) * 0.45], [0.5 + Math.cos(a) * 0.45, 0.5 + Math.sin(a) * 0.45]);
  }
  if (under != null) for (let k = 0; k < sides; k++) {
    const a = phase + k * step, b = phase + (k + 1) * step;
    f.tri(under, [cx, y0, cz], p(r0, k, y0), p(r0, k + 1, y0), [0.5, 0.5], [0.5 + Math.cos(a) * 0.45, 0.5 + Math.sin(a) * 0.45], [0.5 + Math.cos(b) * 0.45, 0.5 + Math.sin(b) * 0.45]);
  }
}

/** The tower's flat face square to +z or -z at height y, `out` proud of it (its z). */
const faceZ = (zSide, y, out) => T.z + zSide * (towerR(y) * Math.cos(Math.PI / TOWER_SIDES) + out);
/** A flat panel on the tower's face square to +z or -z (its door, its windows), standing proud of it by `out` - leaning
 *  with the tower's taper, each edge on the face at its own height (AUDIT SHIPYARDS L5-3: laid flat, a door's foot sank
 *  into the wall and its head stood off it). */
function onFace(f, rec, zSide, x0, x1, y0, y1, out = 0.03) {
  const za = faceZ(zSide, y0, out), zb = faceZ(zSide, y1, out);
  if (zSide > 0) f.quad(rec, [T.x + x1, y0, za], [T.x + x0, y0, za], [T.x + x0, y1, zb], [T.x + x1, y1, zb], [0, 1], [1, 1], [1, 0], [0, 0], [0, 0, 1]);
  else f.quad(rec, [T.x + x0, y0, za], [T.x + x1, y0, za], [T.x + x1, y1, zb], [T.x + x0, y1, zb], [0, 1], [1, 1], [1, 0], [0, 0], [0, 0, -1]);
}

function tower(f) {
  // the plinth, its footing sunk; then the tower's courses - white, a red band, white, a red band, white
  section(f, R.stone, T.x, T.z, TOWER_SIDES, T.plinthR, T.plinthR, -YARD_SINK, T.plinthH, { cap: R.stone });
  /** @type {number} */
  let y = T.plinthH;
  for (const [b0, b1] of T.bands) {
    section(f, R.whitewash, T.x, T.z, TOWER_SIDES, towerR(y), towerR(b0), y, b0);
    section(f, R.redband, T.x, T.z, TOWER_SIDES, towerR(b0), towerR(b1), b0, b1);
    y = b1;
  }
  section(f, R.whitewash, T.x, T.z, TOWER_SIDES, towerR(y), towerR(T.top), y, T.top - G.t, { cap: R.stone });
  // its door to the town, a lintel over it, a step before it; its slit windows up the town's face and the sea's
  const D = LIGHTHOUSE.door;
  onFace(f, R.door, 1, -D.w / 2, D.w / 2, T.plinthH, T.plinthH + D.h, 0.04);
  const lz = faceZ(1, T.plinthH + D.h, 0);   // the lintel set into the wall at its own height
  box(f, R.stone, T.x - D.w / 2 - 0.2, T.plinthH + D.h, lz - 0.1, T.x + D.w / 2 + 0.2, T.plinthH + D.h + 0.25, lz + 0.25);
  box(f, R.stone, ...STEP_BOX, { top: R.stone });
  for (const wy of [4.2, 9.4, 14.8]) onFace(f, R.window, 1, -0.22, 0.22, wy, wy + 1.0);
  for (const wy of [3.4, 8.6, 15.2]) onFace(f, R.window, -1, -0.22, 0.22, wy, wy + 1.0);
}

function gallery(f) {
  const y0 = T.top - G.t, y1 = GALLERY_Y;
  // the floor slab, its corbels under its overhang
  section(f, R.stone, T.x, T.z, TOWER_SIDES, G.r, G.r, y0, y1, { cap: R.stone, under: R.stone });
  const step = (Math.PI * 2) / TOWER_SIDES;
  for (let k = 0; k < TOWER_SIDES; k++) {
    const a = (k + 0.5) * step, c = Math.cos(a), s = Math.sin(a);
    const r0 = towerR(y0) - 0.1, r1 = G.r - 0.05;
    beam(f, R.stone, [T.x + c * r0, y0 - 0.85, T.z + s * r0], [T.x + c * r1, y0 - 0.02, T.z + s * r1], 0.26, 0.3);
  }
  // the railing: a post at each corner, a top rail and a middle one from post to post
  const at = (k, r, yy) => [T.x + Math.cos(k * step + step / 2) * r, yy, T.z + Math.sin(k * step + step / 2) * r];
  for (let k = 0; k < TOWER_SIDES; k++) {
    const [px, , pz] = at(k, G.railR, 0);
    box(f, R.iron, px - 0.03, y1, pz - 0.03, px + 0.03, y1 + G.railH, pz + 0.03);   // from the gallery's floor (the kit's post is sunk in the ground)
    for (const h of [0.55, G.railH - 0.03]) beam(f, R.iron, at(k, G.railR, y1 + h), at(k + 1, G.railR, y1 + h), 0.05, 0.05);
  }
  // the hatch in the floor on the town's side: its frame and its lid, a centimetre proud of it (as the yards' posts stand
  // off their walls: nearer is one plane to the depth buffer at a distance)
  const [hx, , hz] = LIGHTHOUSE_POINTS.hatch;
  box(f, R.wood, hx - 0.45, y1, hz - 0.4, hx + 0.45, y1 + 0.06, hz + 0.4);
  f.quad(R.door, [hx - 0.38, y1 + 0.07, hz + 0.33], [hx + 0.38, y1 + 0.07, hz + 0.33], [hx + 0.38, y1 + 0.07, hz - 0.33], [hx - 0.38, y1 + 0.07, hz - 0.33], [0, 0], [1, 0], [1, 1], [0, 1], [0, 1, 0]);
  box(f, R.iron, hx - 0.04, y1 + 0.07, hz + 0.05, hx + 0.04, y1 + 0.125, hz + 0.22);   // its ring
}

function lanternRoom(f) {
  const y0 = GALLERY_Y, yg = y0 + L.wallH, yc = yg + L.glassH;
  // its low iron wall, then the glass between its mullions, its cornice, its dome, the vent ball and the vane
  section(f, R.iron, T.x, T.z, L.mullions, L.r, L.r, y0, yg, { cap: R.iron });
  const step = (Math.PI * 2) / L.mullions;
  for (let k = 0; k < L.mullions; k++) {
    const a = k * step + step / 2;
    const mx = T.x + Math.cos(a) * (L.r - 0.03), mz = T.z + Math.sin(a) * (L.r - 0.03);
    box(f, R.iron, mx - 0.035, yg, mz - 0.035, mx + 0.035, yc, mz + 0.035);
  }
  for (const yy of [yg + L.glassH * 0.5]) section(f, R.iron, T.x, T.z, L.mullions, L.r, L.r, yy - 0.03, yy + 0.03);
  section(f, R.iron, T.x, T.z, L.mullions, L.r + 0.22, L.r + 0.22, yc, yc + L.cornice, { cap: R.iron, under: R.iron });
  const yd = yc + L.cornice;
  const rings = [[L.r + 0.15, 0], [L.r * 0.92, 0.35], [L.r * 0.62, 0.75], [L.r * 0.28, 1.1], [0.12, L.domeH]];
  for (let i = 0; i < rings.length - 1; i++) section(f, R.copper, T.x, T.z, L.mullions, rings[i][0], rings[i + 1][0], yd + rings[i][1], yd + rings[i + 1][1], { cap: i === rings.length - 2 ? R.copper : null });
  drum(f, R.brass, T.x, T.z, 8, 0.22, 0.22, yd + L.domeH, yd + L.domeH + 0.3, R.brass);
  drum(f, R.iron, T.x, T.z, 4, 0.03, 0.03, yd + L.domeH + 0.3, yd + L.domeH + 1.1, R.iron);
  beam(f, R.iron, [T.x - 0.35, yd + L.domeH + 0.95, T.z], [T.x + 0.45, yd + L.domeH + 0.95, T.z], 0.04, 0.12);   // the vane
  box(f, R.iron, T.x + 0.3, yd + L.domeH + 0.86, T.z - 0.12, T.x + 0.38, yd + L.domeH + 1.04, T.z + 0.12);
  // the lamp within: its brass stand (its lit lens is the glass's - lanternGlass)
  drum(f, R.brass, T.x, T.z, 8, 0.32, 0.22, y0, yg + 0.25, R.brass);
}
/** The lantern room's GLASS between its mullions and the lamp's LIT LENS - the faces round the lamp's own light. */
function lanternGlass(f) {
  const yg = GALLERY_Y + L.wallH, yc = yg + L.glassH;
  section(f, R.glass, T.x, T.z, L.mullions, L.r - 0.05, L.r - 0.05, yg, yc);
  const lamp = LIGHTHOUSE_POINTS.lamp;
  box(f, R.glass, T.x - 0.42, yg + 0.25, T.z - 0.42, T.x + 0.42, lamp[1] + 0.55, T.z + 0.42, { under: true });
}

function cottage(f) {
  const C = LIGHTHOUSE.cottage, W = 0.3, zm = (C.z0 + C.z1) / 2;
  box(f, R.whitewash, C.x0, -YARD_SINK, C.z0, C.x1, C.wallH, C.z0 + W);
  box(f, R.whitewash, C.x0, -YARD_SINK, C.z1 - W, C.x1, C.wallH, C.z1);
  box(f, R.whitewash, C.x0, -YARD_SINK, C.z0, C.x0 + W, C.wallH, C.z1);
  box(f, R.whitewash, C.x1 - W, -YARD_SINK, C.z0, C.x1, C.wallH, C.z1);
  // the gables over its front and its back (the ridge along z), and the slate roof
  const xm = (C.x0 + C.x1) / 2;
  // AUDIT SHIPYARDS L5-1: the gable's apex at the roof's UNDERSIDE (its slab `t` under the ridge) - at the ridge its slopes
  // lay in the slate's own plane and the two pictures fought for every pixel
  const t = 0.14;
  for (const [a, b] of [[C.z0, C.z0 + W], [C.z1 - W, C.z1]]) {
    hexa(f, R.whitewash, [[C.x0, C.wallH, a], [C.x1, C.wallH, a], [C.x1, C.wallH, b], [C.x0, C.wallH, b], [xm - 0.01, C.ridge - t, a], [xm + 0.01, C.ridge - t, a], [xm + 0.01, C.ridge - t, b], [xm - 0.01, C.ridge - t, b]]);
  }
  const o = 0.3, slope = (C.ridge - C.wallH) / (xm - C.x0);
  for (const s of [-1, 1]) {
    const xe = s < 0 ? C.x0 - o : C.x1 + o, ye = C.wallH - o * slope;
    hexa(f, R.stone, [
      [xm, C.ridge - t, C.z0 - o], [xm, C.ridge - t, C.z1 + o], [xe, ye - t, C.z1 + o], [xe, ye - t, C.z0 - o],
      [xm, C.ridge, C.z0 - o], [xm, C.ridge, C.z1 + o], [xe, ye, C.z1 + o], [xe, ye, C.z0 - o],
    ], { top: R.slate, under: true, uv: (p, n) => (n[1] > 0.3 ? [p[2] / YARD_TILE_M, Math.abs(p[0] - xm) / YARD_TILE_M] : uvOf(p, n)) });
  }
  // its chimney on the back gable, its door and a window to the yard, a window to the front
  box(f, R.stone, xm - 0.4, C.wallH, C.z0 + 0.05, xm + 0.4, C.ridge + 0.9, C.z0 + 0.7, { top: R.tar });
  const door = [3.4, 4.4];
  f.quad(R.door, [C.x0 - 0.02, 0, door[1]], [C.x0 - 0.02, 0, door[0]], [C.x0 - 0.02, 2.0, door[0]], [C.x0 - 0.02, 2.0, door[1]], [0, 1], [1, 1], [1, 0], [0, 0], [-1, 0, 0]);
  f.quad(R.window, [C.x0 - 0.02, 1.0, 2.2], [C.x0 - 0.02, 1.0, 1.4], [C.x0 - 0.02, 1.8, 1.4], [C.x0 - 0.02, 1.8, 2.2], [0, 1], [1, 1], [1, 0], [0, 0], [-1, 0, 0]);
  f.quad(R.window, [3.9, 1.0, C.z1 + 0.02], [4.7, 1.0, C.z1 + 0.02], [4.7, 1.8, C.z1 + 0.02], [3.9, 1.8, C.z1 + 0.02], [1, 1], [0, 1], [0, 0], [1, 0], [0, 0, 1]);
  // a bench by its door, a water butt at its corner
  box(f, R.plank, C.x0 - 0.75, 0.42, 4.6, C.x0 - 0.4, 0.5, 5.45, { under: true });
  for (const z of [4.7, 5.35]) box(f, R.wood, C.x0 - 0.68, 0, z - 0.04, C.x0 - 0.47, 0.42, z + 0.04);
  drum(f, R.plank, WATER_BUTT[0], WATER_BUTT[1], 10, WATER_BUTT[2], WATER_BUTT[2], 0, 1.0, R.water);   // clear of the plinth and the casks (AUDIT SHIPYARDS L5-3)
}

function compound(f) {
  const Wl = LIGHTHOUSE.wall;
  floor(f, R.cobble, Wl.x0 + Wl.t, Wl.z0 + Wl.t, Wl.x1 - Wl.t, Wl.z1 - Wl.t);
  const cap = { top: R.stone };
  box(f, R.stone, Wl.x0, -YARD_SINK, Wl.z0, Wl.x1, Wl.h, Wl.z0 + Wl.t, cap);   // its back, to the sea
  box(f, R.stone, Wl.x0, -YARD_SINK, Wl.z0, Wl.x0 + Wl.t, Wl.h, Wl.z1, cap);
  box(f, R.stone, Wl.x1 - Wl.t, -YARD_SINK, Wl.z0, Wl.x1, Wl.h, Wl.z1, cap);
  box(f, R.stone, Wl.x0, -YARD_SINK, Wl.z1 - Wl.t, -Wl.gate, Wl.h, Wl.z1, cap);   // its front, either side of the gate
  box(f, R.stone, Wl.gate, -YARD_SINK, Wl.z1 - Wl.t, Wl.x1, Wl.h, Wl.z1, cap);
  for (const x of [-Wl.gate, Wl.gate]) box(f, R.stone, x - 0.25, -YARD_SINK, Wl.z1 - Wl.t - 0.05, x + 0.25, Wl.h + 0.45, Wl.z1 + 0.05, { top: R.stone });
  // the lamp's oil casks by the tower's door
  for (const [x, z] of OIL_CASKS) drum(f, R.plank, x, z, 10, 0.32, 0.32, 0, 0.82, R.wood);
}

/** The lamp's oil casks by the tower's door, [x, z] in its frame - off the plinth, the step and the water butt. */
export const OIL_CASKS = Object.freeze([Object.freeze([T.x + 1.45, T.z + T.plinthR + 0.3]), Object.freeze([T.x + 1.55, T.z + T.plinthR + 0.97])]);
/** The water butt at the cottage's corner, [x, z, r]. */
export const WATER_BUTT = Object.freeze([LIGHTHOUSE.cottage.x0 - 0.4, LIGHTHOUSE.cottage.z0 + 0.75, 0.4]);

/** THE LIGHTHOUSE, in its own frame: renderer.createMesh's model shape (and the collider's but the guard), under
 *  PORT_ARCHIVE - all but the lantern's glass (buildLighthouseGlass). Pure. */
export function buildLighthouseModel() {
  const f = faces();
  compound(f);
  tower(f);
  gallery(f);
  lanternRoom(f);
  cottage(f);
  return assemble(f, PORT_ARCHIVE);
}
/** THE LANTERN'S GLASS AND THE LAMP'S LENS, a mesh of their own (the collider's too): drawn casting no shadow, since the
 *  lamp's light stands inside them - a caster round it shadowed its own light on every side (AUDIT SHIPYARDS L5-2). Pure. */
export function buildLighthouseGlass() {
  const f = faces();
  lanternGlass(f);
  return assemble(f, PORT_ARCHIVE);
}

/** THE GUARD round the gallery - collider alone, never drawn: a CORRIDOR, a band of the railing's ring just inside it
 *  (so no rail is a step) from the gallery's floor to `guardH` over it, and a LID over the walk at that height from the
 *  lantern room's glass out to the band, faces both ways. AUDIT SHIPYARDS L4-1: an open band over the rail let a climb, a
 *  boosted jump or a vault go over it - a twenty-metre fall - and walking into the rail stepped the body onto its edge.
 *  The pool stands it only while the feet are on the gallery under its lid (scenes/portHost.js guardFor): standing
 *  always, the lid was a floor to a body coming down onto the gallery from over it. `{ positions, indices }` in the
 *  lighthouse's frame. Pure. */
export function guardBand() {
  const positions = [], indices = [];
  const step = (Math.PI * 2) / TOWER_SIDES, y0 = GALLERY_Y, y1 = GALLERY_Y + G.guardH, rIn = G.railR - 0.08, rLid = L.r - 0.05;
  const p = (k, r, y) => [T.x + Math.cos(k * step + step / 2) * r, y, T.z + Math.sin(k * step + step / 2) * r];
  const quad = (a, b, c, d) => {
    const v = positions.length / 3;
    for (const q of [a, b, c, d]) positions.push(...q);
    indices.push(v, v + 1, v + 2, v, v + 2, v + 3, v, v + 2, v + 1, v, v + 3, v + 2);
  };
  for (let k = 0; k < TOWER_SIDES; k++) {
    quad(p(k, rIn, y0), p(k + 1, rIn, y0), p(k + 1, rIn, y1), p(k, rIn, y1));   // the band, from the floor
    quad(p(k, rLid, y1), p(k + 1, rLid, y1), p(k + 1, rIn, y1), p(k, rIn, y1));   // the lid
  }
  return { positions: new Float32Array(positions), indices: new Uint32Array(indices) };
}
/** The tower's door's box in the lighthouse's frame (the eye's: a press on it asks to climb), and the hatch's. */
export function doorBox() {
  const D = LIGHTHOUSE.door, z = T.z + towerR(T.plinthH);
  return [T.x - D.w / 2 - 0.1, T.plinthH - 0.1, z - 0.2, T.x + D.w / 2 + 0.1, T.plinthH + D.h + 0.1, z + 0.35];
}
export function hatchBox() {
  const [hx, hy, hz] = LIGHTHOUSE_POINTS.hatch;
  return [hx - 0.5, hy - 0.1, hz - 0.45, hx + 0.5, hy + 0.35, hz + 0.45];
}
/** The lantern room's box (its glass and its lamp - a press on it from the gallery asks the keeper's word of it). */
export function lanternBox() {
  return [T.x - L.r, GALLERY_Y, T.z - L.r, T.x + L.r, GALLERY_Y + L.wallH + L.glassH, T.z + L.r];
}
