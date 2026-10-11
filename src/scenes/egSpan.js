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
// Not a DFU member. Ledger A (ELITE-GATES).
import { realmToDungeon, dungeonToRealm } from '../net/sdBrain.js';
import { egCircleSpecs, EG_VOID_Y } from '../net/egLaw.js';
import { buildStepModel, stepTris } from '../world/sdStepsModel.js';
import { SD_CRUMBLE_DELAY, SD_CRUMBLE_BACK, SD_CRUMBLE_FALL_G, SD_STEP_THICK, gustAt } from '../world/sdSteps.js';
import { ensureSdStepsArt } from './sdSteps.js';
import { faces } from '../world/gateModel.js';
import { packRealmFaces, SD_REALM_FLOOR_RECORD, SD_REALM_BRASS_RECORD, SD_REALM_EDGE_RECORD } from '../world/sdRealm.js';
import { identity } from '../world/mat4.js';
import { egPieceAt, egPendAt, egPendHits, EG_PEND_HALF, EG_DROP_WALL_H } from '../net/egSpanLaw.js';
import { spireFooting } from '../systems/spireKit.js';

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
 *  a body that carries too far meets the wall and drops onto the landing. Its model and its collider triangles. */
const DROP_WALL_T = 0.3;
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
  box(-x - t, x + t, z, z + t, -SD_STEP_THICK, H);   // the far wall
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
  box(-x - t, x + t, z, z + t, -SD_STEP_THICK, H); box(-x - t, -x, -z, z, -SD_STEP_THICK, H); box(x, x + t, -z, z, -SD_STEP_THICK, H);
  const pos = new Float32Array(out), indices = new Uint16Array(pos.length / 3);
  for (let i = 0; i < indices.length; i++) indices[i] = i;
  return { positions: pos, indices };
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
const STEP_MESH_KIND = Object.freeze({ drift: 'drift', beat: 'beat', riser: 'riser', crumble: 'crumble' });
const _at = { dx: 0, dz: 0, solid: true };
const _gust = { push: 0, warn: false };
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
  const make = (model) => { if (!model || !renderer?.createMesh) return null; try { return renderer.createMesh(model); } catch (e) { console.warn('[eg] a span would not build', e?.message ?? e); return null; } };
  const play = (rec, vol, pitch = 1) => { try { audio?.playOneShot?.(rec, vol, pitch); } catch { /* no sound */ } };
  const meshKey = (s) => STEP_MESH_KIND[s.kind] ?? `${s.kind === 'drop' ? 'drop' : 'slab'}:${s.w}x${s.d}`;
  const modelOf = (s) => (STEP_MESH_KIND[s.kind] ? buildStepModel(s.kind) : s.kind === 'drop' ? egDropModel(s.w, s.d) : egSlabModel(s.w, s.d));
  const trisOf = (s) => (STEP_MESH_KIND[s.kind] ? stepTris(s.kind) : s.kind === 'drop' ? egDropTris(s.w, s.d) : egSlabTris(s.w, s.d));
  /** each hall's Gust sections: the stretch of the course its Gust pieces stand in, an island's reach either side */
  const gusts = [];
  for (const spec of specs) {
    const gs = spec.steps.filter((q) => q.kind === 'gust');
    if (gs.length) gusts.push({ spec, z0: Math.min(...gs.map((q) => q.z - q.d / 2)) - 4, z1: Math.max(...gs.map((q) => q.z + q.d / 2)) + 4 });
  }
  let pendMesh = null;
  const translate = (m, x, y, z) => { m.fill(0); m[0] = m[5] = m[10] = m[15] = 1; m[12] = x; m[13] = y; m[14] = z; return m; };

  /** A step stood where the law has it at `t`: its bucket's place (sunk while it is gone) and its draw's. */
  function pose(st, t) {
    const s = st.s;
    st.was[0] = st.T[0]; st.was[1] = st.T[1]; st.was[2] = st.T[2];
    st.wasSolid = st.solid;
    const at = egPieceAt(s, t, _at);   // a Drift across, a Rail along, a Beat on its beat (net/egSpanLaw.js - the one law)
    const [x, y, z] = realmToDungeon(st.spec.x0 + s.x + at.dx, s.y, s.z + at.dz);
    let solid = at.solid, drop = 0;
    if (s.kind === 'crumble' && st.touched != null) {
      const since = t - st.touched;
      if (since < 0 || since >= SD_CRUMBLE_DELAY + SD_CRUMBLE_BACK) st.touched = null;
      else if (since >= SD_CRUMBLE_DELAY) { const f = since - SD_CRUMBLE_DELAY; drop = 0.5 * SD_CRUMBLE_FALL_G * f * f; solid = false; }
    }
    st.solid = solid;
    st.T[0] = x; st.T[2] = z; st.T[1] = solid ? y : EG_STEP_GONE_Y;
    if (st.draw) {
      const seen = s.kind === 'beat' ? solid : drop < 30;
      if (seen) translate(st.draw.object.matrix, x, y - drop, z); else st.draw.object.matrix.fill(0);
      st.draw.hidden = !seen;
    }
    if (st.pend) { const w = egPendAt(s, t); const [px, py, pz] = realmToDungeon(st.spec.x0 + w.x, s.y, w.z); translate(st.pend.object.matrix, px, py, pz); }
  }

  return {
    /** Stand every step into the dungeon's draws and collider - once. */
    stand({ dynamicDraws, collider = null }) {
      if (draws) return false;
      draws = dynamicDraws;
      ensureSdStepsArt(renderer);
      for (const st of steps) {
        const mk = meshKey(st.s);
        if (!meshes.has(mk)) meshes.set(mk, make(modelOf(st.s)));
        const gpu = meshes.get(mk);
        if (gpu) { st.draw = { gpu, object: { matrix: new Float32Array(16) }, noShadow: true, texRemap: null }; draws.push(st.draw); }
        if (st.s.kind === 'pend') {
          pendMesh ??= make(egPendModel());
          if (pendMesh) { st.pend = { gpu: pendMesh, object: { matrix: new Float32Array(16) }, noShadow: true, texRemap: null }; draws.push(st.pend); }
        }
        const { positions, indices } = trisOf(st.s);
        try { collider?.addMesh?.(st.key, positions, indices, identity(), () => st.T); } catch (e) { console.warn('[eg] a step\'s collider', e?.message ?? e); }
      }
      return true;
    },
    /**
     * One frame, BEFORE the motor: `t` the realm's anchored seconds, `body` the motor, `live` whether it runs this frame.
     * Answers the landing of a cast-back (the dungeon's frame) - the last floor or solid step my feet stood on - or null.
     * @returns {number[] | null}
     */
    ride(t, dt, body = null, live = true) {
      if (!draws) return null;
      const key = body?.grounded && typeof body.groundKey === 'string' ? body.groundKey : null;
      const on = key ? byKey.get(key) ?? null : null;
      if (on && live && on.s.kind === 'crumble' && on.touched == null) on.touched = t;
      for (const st of steps) pose(st, t);
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
      // THE PENDULUM (section 10.3): a touch of its weight is a cast-back - Iron Footing III stands it
      if (footing < 1) {
        for (const st of steps) {
          if (st.s.kind !== 'pend' || Math.abs(rx - st.spec.x0 - st.s.x) > 6) continue;
          if (egPendHits(st.s, t, rx - st.spec.x0, ry, rz) && safe) { play(107, 0.7, 0.8); return [safe[0], safe[1] + 0.2, safe[2]]; }
        }
      }
      // the cast-back's place: the last floor I stood on (a plate, an island, a court, a bridge), or a still step
      if (key === EG_FLOOR_KEY || (on && on.solid && (on.s.kind === 'still' || on.s.kind === 'ledge' || on.s.kind === 'drop' || on.s.kind === 'vent' || on.s.kind === 'gust'))) { safe = [body.pos[0], body.pos[1], body.pos[2]]; safeY = body.pos[1]; }
      if (safe && body.pos[1] < safeY + EG_VOID_Y) { play(107, 0.6, 0.6); return [safe[0], safe[1] + 0.2, safe[2]]; }
      return null;
    },
    /** Where the void would cast me back to now (the dungeon's frame), or null - and set it (a pull's landing). */
    safe: () => safe,
    setSafe(p) { safe = p ? [p[0], p[1], p[2]] : null; safeY = p ? p[1] : 0; },
    /** Every step as it stands (tests). */
    get steps() { return steps.map((st) => ({ h: st.spec.h, i: st.s.i, kind: st.s.kind, key: st.key, T: [...st.T], solid: st.solid })); },
    /** Gone with the level: every mesh freed. */
    clear() {
      for (const m of meshes.values()) if (m) { try { renderer?.destroyMesh?.(m); } catch { /* gone */ } }
      meshes.clear();
      if (pendMesh) { try { renderer?.destroyMesh?.(pendMesh); } catch { /* gone */ } }
      pendMesh = null;
      for (const st of steps) { st.draw = null; st.pend = null; }
      draws = null; safe = null;
    },
  };
}
