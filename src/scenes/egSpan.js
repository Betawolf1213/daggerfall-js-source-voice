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
// Not a DFU member. Ledger A (ELITE-GATES).
import { realmToDungeon } from '../net/sdBrain.js';
import { egCircleSpecs, EG_VOID_Y } from '../net/egLaw.js';
import { buildStepModel, stepTris } from '../world/sdStepsModel.js';
import { SD_BEAT_CYCLE, SD_BEAT_SOLID, SD_CRUMBLE_DELAY, SD_CRUMBLE_BACK, SD_CRUMBLE_FALL_G, SD_STEP_THICK } from '../world/sdSteps.js';
import { ensureSdStepsArt } from './sdSteps.js';
import { faces } from '../world/gateModel.js';
import { packRealmFaces, SD_REALM_FLOOR_RECORD, SD_REALM_BRASS_RECORD, SD_REALM_EDGE_RECORD } from '../world/sdRealm.js';
import { identity } from '../world/mat4.js';

/** Where a gone step's bucket waits (far under every floor). */
export const EG_STEP_GONE_Y = -400;
/** The bucket every step of a circle stands as. */
export const egStepKey = (h, i) => `eg:step:${h}:${i}`;
/** The floor's bucket (scenes/worldModes.js standEgHall): standing on it marks the cast-back's place. */
export const EG_FLOOR_KEY = 'eg:hall';

/** A plain slab (a still step, a ledge): its top's centre the origin, `w` across, `d` along, SD_STEP_THICK deep - the
 *  Hour's floor stone, a brass rim, the gold edge line round its top. */
export function egSlabModel(w, d) {
  const f = faces(), x = w / 2, z = d / 2, h = SD_STEP_THICK;
  const P = (a, b, c) => [a, b, c];
  f.quad(SD_REALM_FLOOR_RECORD, P(-x, 0, -z), P(-x, 0, z), P(x, 0, z), P(x, 0, -z), [0, 0], [0, d / 2], [w / 2, d / 2], [w / 2, 0]);
  for (const [a, b, n] of [[P(-x, 0, -z), P(x, 0, -z), [0, 0, -1]], [P(x, 0, -z), P(x, 0, z), [1, 0, 0]], [P(x, 0, z), P(-x, 0, z), [0, 0, 1]], [P(-x, 0, z), P(-x, 0, -z), [-1, 0, 0]]]) {
    f.quad(SD_REALM_BRASS_RECORD, a, P(a[0], -h, a[2]), P(b[0], -h, b[2]), b, [0, 0], [0, 0.3], [1, 0.3], [1, 0]);
    const o = 0.02;
    f.quad(SD_REALM_EDGE_RECORD, P(a[0] + n[0] * o, 0.004, a[2] + n[2] * o), P(a[0] + n[0] * o, -0.05, a[2] + n[2] * o), P(b[0] + n[0] * o, -0.05, b[2] + n[2] * o), P(b[0] + n[0] * o, 0.004, b[2] + n[2] * o), [0, 0], [0, 1], [1, 1], [1, 0]);
  }
  f.quad(SD_REALM_FLOOR_RECORD, P(-x, -h, -z), P(x, -h, -z), P(x, -h, z), P(-x, -h, z), [0, 0], [1, 0], [1, 1], [0, 1]);
  return packRealmFaces(f);
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
/** Whether a Beat step stands at `t` (the Steps' own cycle), and how far a Crumble step has fallen `since` my foot. */
const beatUp = (s, t) => ((((t - s.beat) % SD_BEAT_CYCLE) + SD_BEAT_CYCLE) % SD_BEAT_CYCLE) < SD_BEAT_SOLID;
const STEP_MESH_KIND = Object.freeze({ drift: 'drift', beat: 'beat', riser: 'riser', crumble: 'crumble' });

/**
 * A circle's spans.
 * @param {{ renderer?: any, audio?: any, seed: number, c: number, geo?: number }} deps
 */
export function createEgSpan({ renderer = null, audio = null, seed, c, geo = 0 }) {
  const specs = egCircleSpecs(seed, c, geo);
  /** every step of the circle: its spec record (the hall's frame) and its hall, its bucket and place, its draw */
  const steps = [];
  for (const spec of specs) for (const s of spec.steps) steps.push({ s, spec, key: egStepKey(spec.h, s.i), T: [0, EG_STEP_GONE_Y, 0], was: [0, EG_STEP_GONE_Y, 0], solid: false, wasSolid: false, draw: null, touched: null });
  const byKey = new Map(steps.map((st) => [st.key, st]));
  /** @type {Map<string, any>} */
  const meshes = new Map();
  let draws = null;
  /** where my feet last stood on a floor or a solid step, and how high that floor was (the void's measure) */
  let safe = null, safeY = 0;
  const make = (model) => { if (!model || !renderer?.createMesh) return null; try { return renderer.createMesh(model); } catch (e) { console.warn('[eg] a span would not build', e?.message ?? e); return null; } };
  const play = (rec, vol, pitch = 1) => { try { audio?.playOneShot?.(rec, vol, pitch); } catch { /* no sound */ } };
  const meshKey = (s) => STEP_MESH_KIND[s.kind] ?? `slab:${s.w}x${s.d}`;
  const translate = (m, x, y, z) => { m.fill(0); m[0] = m[5] = m[10] = m[15] = 1; m[12] = x; m[13] = y; m[14] = z; return m; };

  /** A step stood where the law has it at `t`: its bucket's place (sunk while it is gone) and its draw's. */
  function pose(st, t) {
    const s = st.s;
    st.was[0] = st.T[0]; st.was[1] = st.T[1]; st.was[2] = st.T[2];
    st.wasSolid = st.solid;
    const sx = st.spec.x0 + s.x + (s.kind === 'drift' ? s.amp * Math.sin((2 * Math.PI * t) / s.period + s.phase) : 0);
    const [x, y, z] = realmToDungeon(sx, s.y, s.z);
    let solid = true, drop = 0;
    if (s.kind === 'beat') solid = beatUp(s, t);
    else if (s.kind === 'crumble' && st.touched != null) {
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
  }

  return {
    /** Stand every step into the dungeon's draws and collider - once. */
    stand({ dynamicDraws, collider = null }) {
      if (draws) return false;
      draws = dynamicDraws;
      ensureSdStepsArt(renderer);
      for (const st of steps) {
        const mk = meshKey(st.s);
        if (!meshes.has(mk)) meshes.set(mk, make(STEP_MESH_KIND[st.s.kind] ? buildStepModel(st.s.kind) : egSlabModel(st.s.w, st.s.d)));
        const gpu = meshes.get(mk);
        if (gpu) { st.draw = { gpu, object: { matrix: new Float32Array(16) }, noShadow: true, texRemap: null }; draws.push(st.draw); }
        const { positions, indices } = STEP_MESH_KIND[st.s.kind] ? stepTris(st.s.kind) : egSlabTris(st.s.w, st.s.d);
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
      // the cast-back's place: the last floor I stood on (a plate, an island, a court, a bridge), or a still step
      if (key === EG_FLOOR_KEY || (on && on.solid && (on.s.kind === 'still' || on.s.kind === 'ledge'))) { safe = [body.pos[0], body.pos[1], body.pos[2]]; safeY = body.pos[1]; }
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
      for (const st of steps) st.draw = null;
      draws = null; safe = null;
    },
  };
}
