// @ts-check
// EG-PLAY (2026-10-11, the Elite Gates arc; bible/11-Multiplayer/Elite-Gates.md sections 8 and 10): THE SPIRE'S SPANS ON
// THIS SCREEN - every step of a circle's courses where the hall law puts it (net/egLaw.js egHallOf's steps, the Unmoored
// Steps' own record), moving on the realm's anchored clock as the Steps move: a Drift swinging across, a Beat there on
// the beat alone, a Riser to run up, a Crumble that falls under my own foot and comes back, and the plain slabs (a
// Proving Walk's, a Court's approach, an Oblivion Caverns passage's ledges). Each step one mesh of its kind (the Steps'
// own - world/sdStepsModel.js buildStepModel; a plain slab for the still ones), drawn and stood in the collider as a
// moving bucket (the Steps' translation getter - the triangles never change, only where they stand). The step I stand on
// carries me.
//
// THE VOID (section 8): a body below EG_VOID_Y of the floor it last stood on is cast back to the last plate, island or
// floor it stood on - never a death: the host takes its cost (10% of the body's health, never below a quarter).
//
// What EG-PLAY leaves: the Steps' look parts (the pendulums, the dissolve, the chunks, the ghosts' pass, the waystones);
// a Beat shows its glyph frames, a Crumble falls whole.
//
// EG-FULL, LAYER TWO (section 10.3): THE NEW PIECES MOVE, by the one law (net/egSpanLaw.js): a Rail travels along the
// course and carries its rider; a Pendulum's weight swings across the gap before its step and a touch is a cast-back
// (Iron Footing III shrugs it - systems/spireKit.js spireFooting); a Gust section pushes as the Steps' breath does
// (world/sdSteps.js gustAt, Iron Footing taking its share); a Drop's landing stands walled on its far side and flanks to
// EG_DROP_WALL_H. A Vent's tell and bite are the fight's (scenes/egFight.js - the telegraph pass).
//
// THE RAMPART'S GROUND (section 8.3): a FALLING WALL's walkway stands here as segments EG_WALL_SEG_M long (world/egHall.js
// leaves it out of the circle's mesh and collider), each falling once the fallen edge (net/egLaw.js egWallFallenZ - 20 s
// after the hall's wake, 1.5 m/s, systems/spireKit.js spireWake) passes it; a member caught is cast to the nearest standing
// segment ahead. A FORGE BRIDGE's walkway is a conveyor: whoever stands on it is carried toward the arrival plate at
// EG_BELT_MPS.
//
// EG-FULL, LAYER THREE (section 11 - THE FRAGMENTS): the fragments' own pieces move by the same law - a Bone bridge
// crumbles as a Crumble, a Moon branch stands only while a moonbeam lies on it, a Drum rolls along the course and carries
// its rider, a flight of the Sinking Stair sinks under my own foot at EG_SINK_MPS. THE COLLAPSING TUBE's floor and vault
// stand here as segments and fall behind the company at its fixed pace from its start after the hall's wake; a member
// caught is cast forward to the nearest standing segment ahead (section 11.3 - "cast forward to its last standing node").
// GRATH'S ISLANDS (section 13.3) stand here, each its own bucket, and crack (shaking 3.7 s) and fall for 15 s as the relay
// says (net/egLords.js - its `eob` state, read through systems/spireKit.js spireObjs); a cast-back from a fallen island
// lands on a standing one. A seam alcove's FALSE WALL stands in its doorway until the relay says it broken. And the hands
// this hall offers the activation ray: an Athenaeum's Orrery stones (a turn forward and back - `pz`), a chamber's engine
// (`use`), pressed through systems/spireKit.js spireAct.
//
// Not a DFU member. Ledger A (ELITE-GATES).
import { realmToDungeon, dungeonToRealm } from '../net/sdBrain.js';
import { egCircleSpecs, egWallFallenZ, egBandOfCircle, EG_VOID_Y, EG_BELT_MPS } from '../net/egLaw.js';
import { buildStepModel, stepTris } from '../world/sdStepsModel.js';
import { SD_CRUMBLE_DELAY, SD_CRUMBLE_BACK, SD_CRUMBLE_FALL_G, SD_STEP_THICK, gustAt } from '../world/sdSteps.js';
import { ensureSdStepsArt } from './sdSteps.js';
import { faces } from '../world/gateModel.js';
import { packRealmFaces, realmIsland, SD_REALM_FLOOR_RECORD, SD_REALM_BRASS_RECORD, SD_REALM_EDGE_RECORD, SD_REALM_PILLAR_RECORD, SD_REALM_ROOT_RECORD, SD_REALM_ARENA_RECORD, SD_ISLAND_SIDES } from '../world/sdRealm.js';
import { identity } from '../world/mat4.js';
import { egPieceAt, egPendAt, egPendHits, EG_PEND_HALF, EG_DROP_WALL_H, EG_CRUMBLE_KINDS, EG_SINK_MPS, EG_SINK_GONE_M } from '../net/egSpanLaw.js';
import { egTubeEdge, EG_ENGINES } from '../net/egFragLaw.js';
import { egNicheBoxes, egIsleDisc } from '../world/egHall.js';
import { RAY_DISTANCE, DEFAULT_ACTIVATION_DISTANCE } from '../player/activate.js';
import { spireFooting, spireWake, spireObjs, spireAct } from '../systems/spireKit.js';
import { egBandDress } from '../world/egBandArt.js';   // EG-G2: the band's dress on every piece
import { createEgPieceBatch, EG_BATCH_CULL_PAD } from './egPieceBatch.js';   // EG-G2: one draw a kind, culled
import { meshKitBounds } from '../world/meshKit.js';
import { spherePlanes, sphereInPlanes } from '../render/bounds.js';

/** EG-G2: the cull's view-projection and planes, kept (a frame makes nothing). */
const _vp = new Float32Array(16), _planes = new Float32Array(24);
/** `out` = a x b, column-major 4x4. */
function mul4(out, a, b) {
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  return out;
}
/** Where a gone step's bucket waits (far under every floor). */
export const EG_STEP_GONE_Y = -400;
/** The bucket every step of a circle stands as. */
export const egStepKey = (h, i) => `eg:step:${h}:${i}`;
/** The floor's bucket (scenes/worldModes.js standEgHall): standing on it marks the cast-back's place. */
export const EG_FLOOR_KEY = 'eg:hall';

/** A plain slab (a still step, a ledge): its top's centre the origin, `w` across, `d` along, SD_STEP_THICK deep - the
 *  Hour's floor stone, a brass rim, the gold edge line round its top. */
export function egSlabModel(w, d) {
  const f = faces();
  slabFaces(f, w, d);
  return packRealmFaces(f);
}
/** A slab's faces into `f` (its top, its brass sides with their gold edge line, its underside). */
function slabFaces(f, w, d) {
  const x = w / 2, z = d / 2, h = SD_STEP_THICK;
  const P = (a, b, c) => [a, b, c];
  f.quad(SD_REALM_FLOOR_RECORD, P(-x, 0, -z), P(-x, 0, z), P(x, 0, z), P(x, 0, -z), [0, 0], [0, d / 2], [w / 2, d / 2], [w / 2, 0]);
  for (const [a, b, n] of [[P(-x, 0, -z), P(x, 0, -z), [0, 0, -1]], [P(x, 0, -z), P(x, 0, z), [1, 0, 0]], [P(x, 0, z), P(-x, 0, z), [0, 0, 1]], [P(-x, 0, z), P(-x, 0, -z), [-1, 0, 0]]]) {
    f.quad(SD_REALM_BRASS_RECORD, a, P(a[0], -h, a[2]), P(b[0], -h, b[2]), b, [0, 0], [0, 0.3], [1, 0.3], [1, 0]);
    const o = 0.02;
    f.quad(SD_REALM_EDGE_RECORD, P(a[0] + n[0] * o, 0.004, a[2] + n[2] * o), P(a[0] + n[0] * o, -0.05, a[2] + n[2] * o), P(b[0] + n[0] * o, -0.05, b[2] + n[2] * o), P(b[0] + n[0] * o, 0.004, b[2] + n[2] * o), [0, 0], [0, 1], [1, 1], [1, 0]);
  }
  f.quad(SD_REALM_FLOOR_RECORD, P(-x, -h, -z), P(x, -h, -z), P(x, -h, z), P(-x, -h, z), [0, 0], [1, 0], [1, 1], [0, 1]);
}
/** A slab's collider triangles (its own frame): its top and sides. */
export function egSlabTris(w, d) {
  const x = w / 2, z = d / 2, h = SD_STEP_THICK, out = [];
  const q = (a, b, c, e) => out.push(...a, ...b, ...c, ...a, ...c, ...e);
  q([-x, 0, -z], [x, 0, -z], [x, 0, z], [-x, 0, z]);
  q([-x, -h, -z], [x, -h, -z], [x, 0, -z], [-x, 0, -z]); q([-x, -h, z], [x, -h, z], [x, 0, z], [-x, 0, z]);
  q([-x, -h, -z], [-x, -h, z], [-x, 0, z], [-x, 0, -z]); q([x, -h, -z], [x, -h, z], [x, 0, z], [x, 0, -z]);
  const positions = new Float32Array(out), indices = new Uint16Array(positions.length / 3);
  for (let i = 0; i < indices.length; i++) indices[i] = i;
  return { positions, indices };
}
/** A DROP's landing (section 10.4): a slab `w` by `d` walled on its far side (+z) and both flanks to `H` over its top -
 *  a body that carries too far meets the wall and drops onto the landing. Its model and its collider triangles. LAYER
 *  THREE: the far wall keeps a doorway DROP_DOOR wide and high on the course's line (the course goes on through it - a
 *  wall whole across would end the road; the solver jumps on from the landing). */
const DROP_WALL_T = 0.3;
export const DROP_DOOR = Object.freeze({ w: 2.4, h: 3.0 });
export function egDropModel(w, d, H = EG_DROP_WALL_H) {
  const f = faces(), x = w / 2, z = d / 2, t = DROP_WALL_T;
  const P = (a, b, c) => [a, b, c];
  const box = (x0, x1, z0, z1, y0, y1) => {
    f.quad(SD_REALM_BRASS_RECORD, P(x0, y0, z0), P(x0, y1, z0), P(x1, y1, z0), P(x1, y0, z0), [0, 0], [0, y1 - y0], [x1 - x0, y1 - y0], [x1 - x0, 0]);
    f.quad(SD_REALM_BRASS_RECORD, P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1), P(x0, y0, z1), [0, 0], [0, y1 - y0], [x1 - x0, y1 - y0], [x1 - x0, 0]);
    f.quad(SD_REALM_BRASS_RECORD, P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0), P(x0, y0, z0), [0, 0], [0, y1 - y0], [z1 - z0, y1 - y0], [z1 - z0, 0]);
    f.quad(SD_REALM_BRASS_RECORD, P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1), [0, 0], [0, y1 - y0], [z1 - z0, y1 - y0], [z1 - z0, 0]);
    f.quad(SD_REALM_EDGE_RECORD, P(x0, y1, z0), P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0), [0, 0], [0, 1], [1, 1], [1, 0]);
  };
  for (const [x0, x1, y0] of farWall(x, t)) box(x0, x1, z, z + t, y0, H);   // the far wall, its doorway open
  box(-x - t, -x, -z, z, -SD_STEP_THICK, H);   // the flanks
  box(x, x + t, -z, z, -SD_STEP_THICK, H);
  slabFaces(f, w, d);
  return packRealmFaces(f);
}
export function egDropTris(w, d, H = EG_DROP_WALL_H) {
  const { positions } = egSlabTris(w, d), x = w / 2, z = d / 2, t = DROP_WALL_T, out = [...positions];
  const q = (a, b, c, e) => out.push(...a, ...b, ...c, ...a, ...c, ...e);
  const box = (x0, x1, z0, z1, y0, y1) => {
    q([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]); q([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
    q([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]); q([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]);
    q([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]);
  };
  for (const [x0, x1, y0] of farWall(x, t)) box(x0, x1, z, z + t, y0, H);
  box(-x - t, -x, -z, z, -SD_STEP_THICK, H); box(x, x + t, -z, z, -SD_STEP_THICK, H);
  const pos = new Float32Array(out), indices = new Uint16Array(pos.length / 3);
  for (let i = 0; i < indices.length; i++) indices[i] = i;
  return { positions: pos, indices };
}
/** The far wall's pieces `[x0, x1, y0]` (to the wall's top): either side of the doorway, and its lintel. */
function farWall(x, t) {
  const h = DROP_DOOR.w / 2;
  return [[-x - t, -h, -SD_STEP_THICK], [h, x + t, -SD_STEP_THICK], [-h, h, DROP_DOOR.h]];
}
/** A PENDULUM's weight (section 10.3): a brass block EG_PEND_HALF either way on a chain to its anchor 6 m up. */
const PEND_CHAIN_H = 6;
export function egPendModel() {
  const f = faces(), h = EG_PEND_HALF, c = 0.06;
  const P = (a, b, cc) => [a, b, cc];
  const box = (rec, x0, x1, y0, y1, z0, z1) => {
    f.quad(rec, P(x0, y0, z0), P(x0, y1, z0), P(x1, y1, z0), P(x1, y0, z0), [0, 0], [0, 1], [1, 1], [1, 0]);
    f.quad(rec, P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1), P(x0, y0, z1), [0, 0], [0, 1], [1, 1], [1, 0]);
    f.quad(rec, P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0), P(x0, y0, z0), [0, 0], [0, 1], [1, 1], [1, 0]);
    f.quad(rec, P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1), [0, 0], [0, 1], [1, 1], [1, 0]);
    f.quad(rec, P(x0, y1, z0), P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0), [0, 0], [0, 1], [1, 1], [1, 0]);
    f.quad(rec, P(x0, y0, z1), P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), [0, 0], [0, 1], [1, 1], [1, 0]);
  };
  box(SD_REALM_BRASS_RECORD, -h, h, 0, 2 * h, -h, h);
  box(SD_REALM_EDGE_RECORD, -c, c, 2 * h, 2 * h + PEND_CHAIN_H, -c, c);
  return packRealmFaces(f);
}
/** A COLLAPSING TUBE's vault over one segment (its own frame: the floor's top centre the origin): a slab of the vault's
 *  rock `height` up, the walls' width across - it falls with its floor. */
export function tubeLidModel(w, d, height) {
  const f = faces(), x = w / 2 + 0.6, z = d / 2, y0 = height, y1 = height + 1;
  const P = (a, b, c) => [a, b, c];
  f.quad(SD_REALM_ROOT_RECORD, P(-x, y0, -z), P(x, y0, -z), P(x, y0, z), P(-x, y0, z), [0, 0], [w / 2, 0], [w / 2, d / 2], [0, d / 2]);
  f.quad(SD_REALM_ROOT_RECORD, P(-x, y1, -z), P(-x, y1, z), P(x, y1, z), P(x, y1, -z), [0, 0], [0, d / 2], [w / 2, d / 2], [w / 2, 0]);
  for (const zz of [-z, z]) f.quad(SD_REALM_ROOT_RECORD, P(-x, y0, zz), P(-x, y1, zz), P(x, y1, zz), P(x, y0, zz), [0, 0], [0, 0.5], [w / 2, 0.5], [w / 2, 0]);
  return packRealmFaces(f);
}
/** A FALSE WALL in an alcove's doorway (section 11.10): a stone slab across the doorway (`door` its foot's middle, the
 *  dungeon's frame; `side` which way the niche runs along x), a faint gold seam down its face - its model and its collider
 *  triangles, both in the dungeon's frame. */
export function sealParts(door, side, y = door[1]) {
  const f = faces(), t = 0.2, hw = 1.0, h = 2.6, x0 = door[0] - t, x1 = door[0] + t, z0 = door[2] - hw, z1 = door[2] + hw, y0 = y, y1 = y + h;
  const P = (a, b, c) => [a, b, c];
  const quads = [
    [P(x0, y0, z0), P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0)], [P(x1, y0, z1), P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1)],
    [P(x0, y0, z0), P(x0, y1, z0), P(x1, y1, z0), P(x1, y0, z0)], [P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1), P(x0, y0, z1)],
    [P(x0, y1, z0), P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0)],
  ];
  for (const q of quads) f.quad(SD_REALM_PILLAR_RECORD, q[0], q[1], q[2], q[3], [0, 0], [1, 0], [1, 1], [0, 1]);
  // the seam: a thin gold line down the face the passage sees (the face away from the niche)
  const xs = side > 0 ? x0 - 0.004 : x1 + 0.004;
  f.quad(SD_REALM_EDGE_RECORD, P(xs, y0 + 0.1, door[2] - 0.03), P(xs, y0 + 0.1, door[2] + 0.03), P(xs, y1 - 0.2, door[2] + 0.03), P(xs, y1 - 0.2, door[2] - 0.03), [0, 0], [1, 0], [1, 1], [0, 1]);
  const tris = [];
  for (const q of quads) tris.push(...q[0], ...q[1], ...q[2], ...q[0], ...q[2], ...q[3]);
  return { model: packRealmFaces(f), tris: new Float32Array(tris) };
}
const STEP_MESH_KIND = Object.freeze({ drift: 'drift', beat: 'beat', riser: 'riser', crumble: 'crumble', bone: 'crumble' });   // LAYER THREE: a Bone bridge wears the Crumble's cracks
const _at = { dx: 0, dz: 0, solid: true };
const _gust = { push: 0, warn: false };
/** A Falling Wall's segment (m along the walkway), and how fast a fallen one drops out of sight (m/s/s). */
export const EG_WALL_SEG_M = 2;
const WALL_FALL_G = 9.8;
/** The longest frame a Gust pushes for (s) - a hitch is not a gale (scenes/sdSteps.js's BREATH_DT_MAX). */
const EG_GUST_DT_MAX = 0.1;

/**
 * A circle's spans.
 * @param {{ renderer?: any, audio?: any, seed: number, c: number, geo?: number }} deps
 */
export function createEgSpan({ renderer = null, audio = null, seed, c, geo = 0 }) {
  const specs = egCircleSpecs(seed, c, geo);
  /** every step of the circle: its spec record (the hall's frame) and its hall, its bucket and place, its draw */
  const steps = [];
  for (const spec of specs) for (const s of spec.steps) steps.push({ s, spec, key: egStepKey(spec.h, s.i), T: [0, EG_STEP_GONE_Y, 0], was: [0, EG_STEP_GONE_Y, 0], solid: false, wasSolid: false, draw: null, pend: null, touched: null });
  const byKey = new Map(steps.map((st) => [st.key, st]));
  /** @type {Map<string, any>} */
  const meshes = new Map();
  let draws = null;
  /** where my feet last stood on a floor or a solid step, and how high that floor was (the void's measure) */
  let safe = null, safeY = 0;
  const band = egBandOfCircle(c);   // EG-G2: every piece in its band's dress (the Steps' own faces keep the Hour's - world/egBandArt.js)
  const make = (model) => { if (!model || !renderer?.createMesh) return null; try { return renderer.createMesh(egBandDress(model, band)); } catch (e) { console.warn('[eg] a span would not build', e?.message ?? e); return null; } };
  const play = (rec, vol, pitch = 1) => { try { audio?.playOneShot?.(rec, vol, pitch); } catch { /* no sound */ } };
  const meshKey = (s) => STEP_MESH_KIND[s.kind] ?? `${s.kind === 'drop' ? 'drop' : 'slab'}:${s.w}x${s.d}`;
  const modelOf = (s) => (STEP_MESH_KIND[s.kind] ? buildStepModel(STEP_MESH_KIND[s.kind]) : s.kind === 'drop' ? egDropModel(s.w, s.d) : egSlabModel(s.w, s.d));
  const trisOf = (s) => (STEP_MESH_KIND[s.kind] ? stepTris(STEP_MESH_KIND[s.kind]) : s.kind === 'drop' ? egDropTris(s.w, s.d) : egSlabTris(s.w, s.d));
  /** each hall's Gust sections: the stretch of the course its Gust pieces stand in, an island's reach either side */
  const gusts = [];
  for (const spec of specs) {
    const gs = spec.steps.filter((q) => q.kind === 'gust');
    if (gs.length) gusts.push({ spec, z0: Math.min(...gs.map((q) => q.z - q.d / 2)) - 4, z1: Math.max(...gs.map((q) => q.z + q.d / 2)) + 4 });
  }
  /** EG-G2: the circle's pieces batched (scenes/egPieceBatch.js), or null (no renderer that moves vertices - a draw a piece) */
  let batch = null;
  /** @type {Map<string, any>} the batched kinds' models */
  const models = new Map();
  /** A piece of mesh kind `mk` stood: in the batch (its slot, the draw it replaces), or as its own draw - its model once a
   *  kind either way. Answers the slot or draw its pose writes, or null. */
  const place = (mk, modelFn) => {
    if (batch) {
      if (!models.has(mk)) models.set(mk, egBandDress(modelFn(), band));
      const slot = { object: { matrix: new Float32Array(16) }, hidden: false };
      return batch.add(mk, models.get(mk), slot) ? slot : null;
    }
    if (!meshes.has(mk)) meshes.set(mk, make(modelFn()));
    const gpu = meshes.get(mk);
    if (!gpu) return null;
    const d = { gpu, object: { matrix: new Float32Array(16) }, noShadow: true, texRemap: null };
    draws.push(d);
    return d;
  };
  /** @type {any[]} */
  let targetList = [];
  /** THE FALLING WALLS: each hall's walkway as segments, each its bucket, its draw and the moment it fell */
  const walls = [];
  for (const spec of specs) {
    if (spec.variant !== 'fallingwall' || !spec.walk) continue;
    const w = spec.walk, n = Math.max(1, Math.ceil((w.z1 - w.z0) / EG_WALL_SEG_M)), d = (w.z1 - w.z0) / n;
    for (let k = 0; k < n; k++) walls.push({ spec, k, z0: w.z0 + k * d, z1: w.z0 + (k + 1) * d, w: 2 * w.halfW, d, key: `eg:wall:${spec.h}:${k}`, T: [0, EG_STEP_GONE_Y, 0], draw: null, goneAt: null });
  }
  /** each hall's conveyor (a Forge Bridge's walkway) */
  const belts = specs.filter((q) => q.variant === 'forgebridge' && q.walk).map((q) => ({ spec: q, w: q.walk }));
  /** THE COLLAPSING TUBES (section 11.3): each tube's floor and vault as segments, each falling once the tube's fallen
   *  edge passes it */
  const tubes = [];
  for (const spec of specs) {
    const q = spec.tube;
    if (!q) continue;
    const n = Math.max(1, Math.ceil((q.z1 - q.z0) / EG_WALL_SEG_M)), d = (q.z1 - q.z0) / n;
    for (let k = 0; k < n; k++) tubes.push({ spec, k, z0: q.z0 + k * d, z1: q.z0 + (k + 1) * d, w: 2 * q.halfW, d, key: `eg:tube:${spec.h}:${k}`, T: [0, EG_STEP_GONE_Y, 0], draw: null, lid: null, goneAt: null });
  }
  /** A Collapsing Tube's fallen edge in hall `spec` at `t` (s): -Infinity before it begins, Infinity once its hall is past. */
  const tubeEdgeOf = (spec, t) => { const wk = spireWake(); return wk.h === spec.h && wk.hw > 0 ? egTubeEdge(spec.tube, t * 1000 - wk.hw) : wk.h > spec.h ? Infinity : -Infinity; };
  /** GRATH'S ISLANDS (section 13.3): each its bucket and draw, its fall the relay's word */
  const isles = [];
  for (const spec of specs) for (const d of spec.discs) if (egIsleDisc(spec, d)) isles.push({ spec, d, key: `eg:isle:${spec.h}:${isles.length}`, T: [0, 0, 0], draw: null, st: 0, stAt: 0, drop: 0 });
  /** THE FALSE WALLS (section 11.10): one in each seam alcove's doorway, standing until the relay says it broken */
  const seals = [];
  for (const spec of specs) for (const nb of egNicheBoxes(spec)) if (nb.a.seal === 'seam') seals.push({ spec, a: nb.a, door: nb.door, side: nb.side, key: `eg:seal:${spec.h}:${nb.a.i}`, T: [0, 0, 0], draw: null, up: true });
  /** A Falling Wall's fallen edge in hall `spec` at `t` (s): -Infinity until its hall wakes. */
  const fallenOf = (spec, t) => { const wk = spireWake(); return wk.h === spec.h && wk.hw > 0 ? egWallFallenZ(spec, wk.hw, t * 1000) : wk.h > spec.h ? Infinity : -Infinity; };
  function poseWalls(t) {
    for (const g of walls) {
      const edge = fallenOf(g.spec, t), gone = g.z1 <= edge;
      if (gone && g.goneAt == null) g.goneAt = t;
      if (!gone) g.goneAt = null;
      const [x, y, z] = realmToDungeon(g.spec.x0 + g.spec.walk.x, 0, (g.z0 + g.z1) / 2);
      g.T[0] = x; g.T[2] = z; g.T[1] = gone ? EG_STEP_GONE_Y : y;
      if (g.draw) {
        const drop = gone ? 0.5 * WALL_FALL_G * (t - g.goneAt) ** 2 : 0, seen = drop < 30;
        if (seen) translate(g.draw.object.matrix, x, y - drop, z); else g.draw.object.matrix.fill(0);
        g.draw.hidden = !seen;
      }
    }
  }
  const translate = (m, x, y, z) => { m.fill(0); m[0] = m[5] = m[10] = m[15] = 1; m[12] = x; m[13] = y; m[14] = z; return m; };
  function poseTubes(t) {
    for (const g of tubes) {
      const edge = tubeEdgeOf(g.spec, t), gone = g.z1 <= edge;
      if (gone && g.goneAt == null) g.goneAt = t;
      if (!gone) g.goneAt = null;
      const [x, y, z] = realmToDungeon(g.spec.x0 + g.spec.tube.x, g.spec.tube.y, (g.z0 + g.z1) / 2);
      g.T[0] = x; g.T[2] = z; g.T[1] = gone ? EG_STEP_GONE_Y : y;
      const drop = gone ? 0.5 * WALL_FALL_G * (t - g.goneAt) ** 2 : 0, seen = drop < 30;
      for (const dr of [g.draw, g.lid]) { if (!dr) continue; if (seen) translate(dr.object.matrix, x, y - drop, z); else dr.object.matrix.fill(0); dr.hidden = !seen; }
    }
  }
  /** The islands where the relay has them: whole, shaking while cracked (told 3.7 s), sunk while fallen, risen again. */
  function poseIsles(t) {
    if (!isles.length) return;
    const O = spireObjs(), objs = O.objs.filter((o) => o.t === 'isle');
    for (const g of isles) {
      const o = O.h === g.spec.h ? objs.find((q) => Math.hypot(q.x - g.d.x, q.z - g.d.z) < 1.5) : null;
      g.st = o?.st ?? 0; g.stAt = o?.stAt ?? 0;
      const since = Math.max(0, t * 1000 - g.stAt) / 1000;
      g.drop = g.st === 2 ? Math.min(40, 0.5 * WALL_FALL_G * since * since) : 0;
      const shake = g.st === 1 ? 0.06 * Math.sin(t * 60) : 0;
      g.T[0] = 0; g.T[1] = g.st === 2 ? EG_STEP_GONE_Y : 0; g.T[2] = 0;   // the shake is the eye's alone - the ground holds still under a crack
      if (g.draw) { const seen = g.drop < 39; if (seen) translate(g.draw.object.matrix, shake, -g.drop, 0); else g.draw.object.matrix.fill(0); g.draw.hidden = !seen; }
    }
  }
  /** The false walls: standing while the relay keeps a false wall at their alcove, sunk once it falls. */
  function poseSeals() {
    if (!seals.length) return;
    const O = spireObjs();
    for (const g of seals) {
      const up = O.h !== g.spec.h ? O.h < g.spec.h : O.objs.some((o) => o.t === 'fwall' && o.pt === g.a.i);
      g.up = up;
      g.T[1] = up ? 0 : EG_STEP_GONE_Y;
      if (g.draw) { if (up) translate(g.draw.object.matrix, 0, 0, 0); else g.draw.object.matrix.fill(0); g.draw.hidden = !up; }
    }
  }

  /** A step stood where the law has it at `t`: its bucket's place (sunk while it is gone) and its draw's. */
  function pose(st, t) {
    const s = st.s;
    st.was[0] = st.T[0]; st.was[1] = st.T[1]; st.was[2] = st.T[2];
    st.wasSolid = st.solid;
    const at = egPieceAt(s, t, _at);   // a Drift across, a Rail along, a Beat on its beat (net/egSpanLaw.js - the one law)
    const [x, y, z] = realmToDungeon(st.spec.x0 + s.x + at.dx, s.y, s.z + at.dz);
    let solid = at.solid, drop = 0;
    if (EG_CRUMBLE_KINDS.includes(s.kind) && st.touched != null) {
      const since = t - st.touched;
      if (since < 0 || since >= SD_CRUMBLE_DELAY + SD_CRUMBLE_BACK) st.touched = null;
      else if (since >= SD_CRUMBLE_DELAY) { const f = since - SD_CRUMBLE_DELAY; drop = 0.5 * SD_CRUMBLE_FALL_G * f * f; solid = false; }
    }
    // a flight of the Sinking Stair: under my foot it sinks at EG_SINK_MPS (it carries me down), gone EG_SINK_GONE_M down,
    // and back after the Crumble's return
    let sunk = 0;
    if (s.kind === 'sink' && st.touched != null) {
      const since = t - st.touched, goneAt = EG_SINK_GONE_M / EG_SINK_MPS;
      if (since < 0 || since >= goneAt + SD_CRUMBLE_BACK) st.touched = null;
      else if (since >= goneAt) { solid = false; drop = 40; }
      else sunk = EG_SINK_MPS * since;
    }
    st.solid = solid;
    st.T[0] = x; st.T[2] = z; st.T[1] = solid ? y - sunk : EG_STEP_GONE_Y;
    if (st.draw) {
      const seen = s.kind === 'beat' || s.kind === 'moon' ? solid : drop < 30;
      if (seen) translate(st.draw.object.matrix, x, y - drop - sunk, z); else st.draw.object.matrix.fill(0);
      st.draw.hidden = !seen;
    }
    if (st.pend) { const w = egPendAt(s, t); const [px, py, pz] = realmToDungeon(st.spec.x0 + w.x, s.y, w.z); translate(st.pend.object.matrix, px, py, pz); }
  }

  /** A cast-back's landing kept off a fallen walkway: on a Falling Wall, the nearest standing segment ahead of its fallen
   *  edge (section 8.3 - "cast to the nearest standing segment ahead"). */
  function wallSafe(p, t) {
    const [rx, , rz] = dungeonToRealm(p[0], p[1], p[2]);
    // a Collapsing Tube: a landing behind its fallen edge is cast forward to the nearest standing segment ahead
    const ts = specs.find((q) => q.tube && Math.abs(rx - q.x0 - q.tube.x) <= 40 && rz <= q.tube.z1 + 1 && rz >= -10);
    if (ts) {
      const edge = tubeEdgeOf(ts, t);
      if (Number.isFinite(edge) && rz <= edge + 0.5) { const ahead = tubes.find((g) => g.spec === ts && g.z0 >= edge); if (ahead) return realmToDungeon(ts.x0 + ts.tube.x, ts.tube.y, (ahead.z0 + ahead.z1) / 2); }
    }
    // Grath's islands: a landing on a cracked or fallen one is cast onto the nearest standing one
    const lost = isles.find((g) => g.st !== 0 && Math.hypot(rx - g.spec.x0 - g.d.x, rz - g.d.z) <= g.d.r + 0.5);
    if (lost) {
      let best = null, bd = Infinity;
      for (const g of isles) if (g.spec === lost.spec && g.st === 0) { const dd = Math.hypot(rx - g.spec.x0 - g.d.x, rz - g.d.z); if (dd < bd) { bd = dd; best = g; } }
      if (best) return realmToDungeon(best.spec.x0 + best.d.x, best.d.y, best.d.z);
    }
    const spec = specs.find((q) => q.variant === 'fallingwall' && q.walk && Math.abs(rx - q.x0 - q.walk.x) <= q.walk.halfW + 1 && rz >= q.walk.z0 - 1 && rz <= q.walk.z1 + 1);
    if (!spec) return p;
    const edge = fallenOf(spec, t);
    if (rz > edge + 0.5) return p;
    const ahead = walls.find((g) => g.spec === spec && g.z1 > edge && g.z0 >= edge);
    return ahead ? realmToDungeon(spec.x0 + spec.walk.x, 0, (ahead.z0 + ahead.z1) / 2) : p;
  }
  return {
    /** Stand every step into the dungeon's draws and collider - once. */
    stand({ dynamicDraws, collider = null }) {
      if (draws) return false;
      draws = dynamicDraws;
      ensureSdStepsArt(renderer);
      // EG-G2 (section 11.9): with a renderer that moves a mesh's vertices, every piece of a kind is one batched draw
      // (scenes/egPieceBatch.js - the slot each pose writes is the draw it replaced); without one, a draw a piece as before
      batch = renderer?.createMesh && renderer?.updateMeshVertices ? createEgPieceBatch({ renderer }) : null;
      for (const st of steps) {
        const mk = meshKey(st.s);
        st.draw = place(mk, () => modelOf(st.s));
        if (st.s.kind === 'pend') st.pend = place('pend', () => egPendModel());
        const { positions, indices } = trisOf(st.s);
        try { collider?.addMesh?.(st.key, positions, indices, identity(), () => st.T); } catch (e) { console.warn('[eg] a step\'s collider', e?.message ?? e); }
      }
      for (const g of tubes) {
        g.draw = place(`wall:${g.w}x${g.d}`, () => egSlabModel(g.w, g.d));
        g.lid = place(`lid:${g.w}x${g.d}:${g.spec.h}`, () => tubeLidModel(g.w, g.d, (g.spec.caves.find((q) => q.z0 <= g.z0 && q.z1 >= g.z1)?.height ?? 5.2)));
        const { positions, indices } = egSlabTris(g.w, g.d);
        try { collider?.addMesh?.(g.key, positions, indices, identity(), () => g.T); } catch (e) { console.warn('[eg] a tube segment\'s collider', e?.message ?? e); }
      }
      for (const g of isles) {
        const f = faces();
        realmIsland(f, g.spec.x0 + g.d.x, g.d.z, g.d.r, SD_REALM_ARENA_RECORD, { y: g.d.y, bands: Math.max(2, Math.round(g.d.r / 4)) });
        const model = packRealmFaces(f), gpu = make(model);
        if (gpu) { meshes.set(g.key, gpu); g.draw = { gpu, object: { matrix: identity() }, noShadow: true, texRemap: null, sphere: meshKitBounds(model.positions) }; draws.push(g.draw); }
        const tris = [];
        for (let k = 0; k < SD_ISLAND_SIDES; k++) {
          const a0 = (k / SD_ISLAND_SIDES) * Math.PI * 2, a1 = ((k + 1) / SD_ISLAND_SIDES) * Math.PI * 2;
          tris.push(...realmToDungeon(g.spec.x0 + g.d.x, g.d.y, g.d.z), ...realmToDungeon(g.spec.x0 + g.d.x + Math.cos(a1) * g.d.r, g.d.y, g.d.z + Math.sin(a1) * g.d.r), ...realmToDungeon(g.spec.x0 + g.d.x + Math.cos(a0) * g.d.r, g.d.y, g.d.z + Math.sin(a0) * g.d.r));
        }
        const positions = new Float32Array(tris), indices = new Uint16Array(positions.length / 3);
        for (let k = 0; k < indices.length; k++) indices[k] = k;
        try { collider?.addMesh?.(g.key, positions, indices, identity(), () => g.T); } catch (e) { console.warn('[eg] an island\'s collider', e?.message ?? e); }
      }
      for (const g of seals) {
        const { model, tris } = sealParts(g.door, g.side, g.a.y + 0);
        const gpu = make(model);
        if (gpu) { meshes.set(g.key, gpu); g.draw = { gpu, object: { matrix: identity() }, noShadow: true, texRemap: null, sphere: meshKitBounds(model.positions) }; draws.push(g.draw); }
        const indices = new Uint16Array(tris.length / 3);
        for (let k = 0; k < indices.length; k++) indices[k] = k;
        try { collider?.addMesh?.(g.key, tris, indices, identity(), () => g.T); } catch (e) { console.warn('[eg] a false wall\'s collider', e?.message ?? e); }
      }
      // the hands this circle offers the activation ray: each Athenaeum's Orrery stones (a handle each way), each engine
      const list = [];
      for (const spec of specs) {
        for (const [j, q] of (spec.spots.stone ?? []).entries()) for (const a of [1, -1]) { const c = realmToDungeon(spec.x0 + q.x + a * 0.9, 1.0, q.z); list.push({ key: `egstone:${spec.h}:${j}:${a > 0 ? 'f' : 'b'}`, aabb: { min: [c[0] - 0.35, c[1] - 0.35, c[2] - 0.35], max: [c[0] + 0.35, c[1] + 0.35, c[2] + 0.35] }, distance: RAY_DISTANCE, reach: DEFAULT_ACTIVATION_DISTANCE }); }
        for (const e of spec.engines ?? []) { const c = realmToDungeon(spec.x0 + e.x, e.y + 1.0, e.z); list.push({ key: `egengine:${spec.h}:${e.i}`, aabb: { min: [c[0] - 0.6, c[1] - 1.0, c[2] - 0.6], max: [c[0] + 0.6, c[1] + 1.0, c[2] + 0.6] }, distance: RAY_DISTANCE, reach: DEFAULT_ACTIVATION_DISTANCE }); }
      }
      targetList = list;
      for (const g of walls) {
        g.draw = place(`wall:${g.w}x${g.d}`, () => egSlabModel(g.w, g.d));
        const { positions, indices } = egSlabTris(g.w, g.d);
        try { collider?.addMesh?.(g.key, positions, indices, identity(), () => g.T); } catch (e) { console.warn('[eg] a wall segment\'s collider', e?.message ?? e); }
      }
      batch?.build(draws);
      return true;
    },
    /**
     * EG-G2 - THE CULL (section 11.9), this frame, before the dungeon's draws (scenes/worldModes.js): the batched pieces'
     * copies against the frustum (`proj` x `view`), and each island's and false wall's own draw `culled` outside it. Every
     * one is `noShadow`, so no shadow record moves with it. Answers how many batched kinds draw.
     */
    cull(proj, view) {
      if (!draws) return 0;
      let planes = null;
      if (proj && view) { mul4(_vp, proj, view); planes = spherePlanes(_vp, _planes); }
      for (const g of [...isles, ...seals]) {
        const d = g.draw;
        if (!d?.sphere) continue;
        const M = d.object.matrix, c = d.sphere.centre;
        d.culled = !!planes && !sphereInPlanes(planes, c[0] + M[12], c[1] + M[13], c[2] + M[14], d.sphere.r + EG_BATCH_CULL_PAD);
      }
      return batch ? batch.cull(planes) : 0;
    },
    /** The batch's measure (tests, the budget): kinds, copies, what the last cull drew; null with no batch. */
    batchStats: () => batch?.stats() ?? null,
    /**
     * One frame, BEFORE the motor: `t` the realm's anchored seconds, `body` the motor, `live` whether it runs this frame.
     * Answers the landing of a cast-back (the dungeon's frame) - the last floor or solid step my feet stood on - or null.
     * @returns {number[] | null}
     */
    ride(t, dt, body = null, live = true) {
      if (!draws) return null;
      const key = body?.grounded && typeof body.groundKey === 'string' ? body.groundKey : null;
      const on = key ? byKey.get(key) ?? null : null;
      if (on && live && (EG_CRUMBLE_KINDS.includes(on.s.kind) || on.s.kind === 'sink') && on.touched == null) on.touched = t;
      for (const st of steps) pose(st, t);
      poseWalls(t);
      poseTubes(t);
      poseIsles(t);
      poseSeals();
      if (on && on.solid && on.wasSolid) {
        const dx = on.T[0] - on.was[0], dy = on.T[1] - on.was[1], dz = on.T[2] - on.was[2];
        if (dx || dy || dz) body.carryBy?.(dx, dy, dz);
      }
      if (!live || !body?.pos) return null;
      const [rx, ry, rz] = dungeonToRealm(body.pos[0], body.pos[1], body.pos[2]);
      const footing = spireFooting();
      // THE GUST (section 10.3): the Steps' breath over a Gust section of the hall I stand in, Iron Footing taking its share
      if (dt > 0 && footing < 1) {
        const g = gusts.find((q) => rx >= q.spec.x0 - 40 && rx <= q.spec.x0 + 40 && rz >= q.z0 && rz <= q.z1);
        if (g) { gustAt(t, _gust); if (_gust.push) body.collider?.move?.(body.pos, _gust.push * (1 - footing) * Math.min(dt, EG_GUST_DT_MAX), 0, 0, body.height, !!body.grounded && !body.jumping); }
      }
      // THE FORGE BRIDGE (section 8.3): its walkway runs toward the arrival plate, carrying whoever stands on it
      if (dt > 0 && key === EG_FLOOR_KEY && body.grounded) {
        const bt = belts.find((q) => Math.abs(rx - q.spec.x0 - q.w.x) <= q.w.halfW && rz >= q.w.z0 && rz <= q.w.z1);
        if (bt) body.collider?.move?.(body.pos, 0, 0, -EG_BELT_MPS * Math.min(dt, EG_GUST_DT_MAX), body.height, true);
      }
      // THE PENDULUM (section 10.3): a touch of its weight is a cast-back - Iron Footing III stands it
      if (footing < 1) {
        for (const st of steps) {
          if (st.s.kind !== 'pend' || Math.abs(rx - st.spec.x0 - st.s.x) > 6) continue;
          if (egPendHits(st.s, t, rx - st.spec.x0, ry, rz) && safe) { play(107, 0.7, 0.8); return [safe[0], safe[1] + 0.2, safe[2]]; }
        }
      }
      // the cast-back's place: the last floor I stood on (a plate, an island, a court, a bridge), or a still step
      const onWall = key ? walls.find((g) => g.key === key) ?? tubes.find((g) => g.key === key) ?? isles.find((g) => g.key === key && g.st === 0) : null;
      if (key === EG_FLOOR_KEY || onWall || (on && on.solid && (on.s.kind === 'still' || on.s.kind === 'ledge' || on.s.kind === 'drop' || on.s.kind === 'vent' || on.s.kind === 'gust'))) { safe = [body.pos[0], body.pos[1], body.pos[2]]; safeY = body.pos[1]; }
      if (safe && body.pos[1] < safeY + EG_VOID_Y) { play(107, 0.6, 0.6); const p = wallSafe(safe, t); return [p[0], p[1] + 0.2, p[2]]; }
      return null;
    },
    /** Where the void would cast me back to now (the dungeon's frame), or null - and set it (a pull's landing). */
    safe: () => safe,
    setSafe(p) { safe = p ? [p[0], p[1], p[2]] : null; safeY = p ? p[1] : 0; },
    /** The hands this circle offers the activation ray (an Orrery stone's handles, an engine) - after the stand. */
    targets: () => (draws ? targetList : []),
    /** A press on one of them: the breach client's (systems/spireKit.js spireAct - it sends the turn or the work). */
    press(key) { return typeof key === 'string' && (key.startsWith('egstone:') || key.startsWith('egengine:')) ? (spireAct(key), true) : false; },
    /** A target's words. */
    hoverName(key) {
      if (typeof key !== 'string') return null;
      const st = /^egstone:\d+:(\d):([fb])$/.exec(key);
      if (st) return { title: `Orrery stone ${Number(st[1]) + 1}`, subs: [st[2] === 'f' ? 'Turn it forward an hour' : 'Turn it back an hour'] };
      const en = /^egengine:(\d+):(\d+)$/.exec(key);
      if (en) { const spec = specs.find((q) => q.h === Number(en[1])), e = spec?.engines?.[Number(en[2])], E = e ? EG_ENGINES[e.kind] : null; if (E) return { title: E.name.charAt(0).toUpperCase() + E.name.slice(1), subs: [E.what, 'Work it - once in 30 seconds'] }; }
      return null;
    },
    /** Every Collapsing Tube segment and every island as they stand (tests). */
    get tubes() { return tubes.map((g) => ({ h: g.spec.h, k: g.k, z0: g.z0, z1: g.z1, key: g.key, gone: g.T[1] === EG_STEP_GONE_Y })); },
    get isles() { return isles.map((g) => ({ h: g.spec.h, x: g.d.x, z: g.d.z, key: g.key, st: g.st, gone: g.T[1] === EG_STEP_GONE_Y })); },
    get seals() { return seals.map((g) => ({ h: g.spec.h, i: g.a.i, key: g.key, up: g.up })); },
    /** Every step as it stands (tests). */
    get steps() { return steps.map((st) => ({ h: st.spec.h, i: st.s.i, kind: st.s.kind, key: st.key, T: [...st.T], solid: st.solid })); },
    /** Every Falling Wall segment as it stands (tests). */
    get walls() { return walls.map((g) => ({ h: g.spec.h, k: g.k, z0: g.z0, z1: g.z1, key: g.key, T: [...g.T], gone: g.T[1] === EG_STEP_GONE_Y })); },
    /** Gone with the level: every mesh freed. */
    clear() {
      for (const m of meshes.values()) if (m) { try { renderer?.destroyMesh?.(m); } catch { /* gone */ } }
      meshes.clear();
      batch?.clear(); batch = null;   // EG-G2: the batched kinds' meshes
      models.clear();
      for (const st of steps) { st.draw = null; st.pend = null; }
      for (const g of walls) g.draw = null;
      for (const g of tubes) { g.draw = null; g.lid = null; }
      for (const g of isles) g.draw = null;
      for (const g of seals) g.draw = null;
      targetList = [];
      draws = null; safe = null;
    },
  };
}
