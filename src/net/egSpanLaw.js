// @ts-check
// EG-FULL, LAYER TWO (2026-10-11, Mac: "I said I want everything"; bible/11-Multiplayer/Elite-Gates.md sections 10.3-10.5):
// THE SPANS' LAW - where every piece of a span stands at a moment of the shared clock, and THE TIMED SOLVER that lets the
// generator lay only courses a player can cross. One law for the relay's hall spec (net/egLaw.js asks the solver while it
// lays a hall) and every screen (scenes/egSpan.js moves the pieces by it, scenes/egFight.js draws their tells by it).
//
// THE PIECES (metres and seconds, a hall's own frame; every number at every depth - NOTHING GETS FASTER):
//   Drift     swings across the course, `amp` either side, over `period` (the Steps' stepAt).
//   Beat      stands SD_BEAT_SOLID of every SD_BEAT_CYCLE, alternate steps half a cycle apart (the Steps' beatStands).
//   Crumble   falls SD_CRUMBLE_DELAY after a foot and comes back (each member's own - no shared motion).
//   Rail      travels along the course, `amp` either way, over `period` - ridden.
//   Pendulum  a chained weight swinging across the GAP before its step, EG_PEND_REACH either side, over `period`; a touch
//             is a cast-back (Iron Footing III shrugs it).
//   Vent      a disc EG_VENT_R across under a platform at least EG_VENT_MIN_W wide, erupting EG_VENT_FIRE_S of every
//             `period` (the Rampart's 20% fire), told by a ring closing over its last EG_VENT_TELL_S.
//   Drop      a walled landing at most 4.5 m down, at least 6 m deep.
//   Gust      the Steps' breath (world/sdSteps.js gustAt), span-wide, on the islands about its pieces.
//
// THE TIMED SOLVER (section 10.5): THE SPAN BUILD's running jump (Speed 10, Running 0, Jumping 0 - the motor's closed
// form, held under the real motor's measured reach) from each piece's far edge to the next, over the pieces' positions at the launch and the
// landing: every pair a launch window of at least EG_WINDOW_MIN in every 12 s, the next window never more than EG_WAIT_MAX
// away, a Pendulum's gap a clear EG_PEND_CLEAR_MIN to cross in, a Crumble left before it falls, a Vent's platform wide
// enough to stand clear of its disc, a Drop's landing deep enough to take a running body. A course the solver refuses is
// laid again (net/egLaw.js).
//
// The motor's numbers are pinned here, not imported (this module is in the relay's bundle; test/egfull_span.test.js
// holds them equal to player/motor.js). Pure. Not a DFU member. Ledger A (ELITE-GATES).

/** THE SPAN BUILD's run (Speed 10, Running 0): player/motor.js runSpeed(10, 0). */
export const EG_SPAN_RUN_MPS = ((10 + 150) / 39.5) * 1.35;
/** The motor's jump (player/motor.js JUMP_SPEED, GRAVITY, JUMP_FWD_BOOST, CAPSULE_RADIUS), and how much a drop below
 *  the takeoff adds to the widest gap (m a metre down - under the real motor's gain at every height measured). */
export const EG_JUMP_MPS = 4.5;
export const EG_JUMP_G = 20;
export const EG_JUMP_FWD = 0.05;
export const EG_BODY_R = 0.35;
export const EG_DROP_GAIN = 0.45;
/** The Steps' Beat (world/sdSteps.js SD_BEAT_CYCLE, SD_BEAT_SOLID) and Crumble (SD_CRUMBLE_DELAY) - pinned equal. */
export const EG_BEAT_CYCLE_S = 3.6;
export const EG_BEAT_SOLID_S = 2.4;
export const EG_CRUMBLE_DELAY_S = 0.7;
/** THE TIMED SOLVER's bounds (section 10.5). */
export const EG_WINDOW_MIN = 0.5;
export const EG_WAIT_MAX = 4;
export const EG_SOLVE_HORIZON_S = 36;
export const EG_SOLVE_STEP_S = 0.05;
export const EG_CRUMBLE_SLACK_S = 0.15;
/** The Pendulum: its swing's reach either side of the course, its weight's half-width, the clear time its gap leaves. */
export const EG_PEND_REACH = 2.6;
export const EG_PEND_HALF = 0.5;
export const EG_PEND_CLEAR_MIN = 0.8;
/** The Vent: its disc's radius, its platform's least width, its eruption and its tell (s); its bite is the Rampart's
 *  (net/egLaw.js EG_VENT_PCT - one number for one fire). */
export const EG_VENT_R = 1.5;
export const EG_VENT_MIN_W = 4;
export const EG_VENT_FIRE_S = 0.5;
export const EG_VENT_TELL_S = 1.0;
/** The Rail: the least gap its travel leaves before it and after it (m) - it never closes on what it travels between. */
export const EG_RAIL_CLEAR = 0.3;
/** The Drop: its landing's least depth and its walls' least height over it (m). */
export const EG_DROP_LAND_MIN = 6;
export const EG_DROP_WALL_H = 7.5;

const TAU = 2 * Math.PI;
const wrapT = (t, p) => ((t % p) + p) % p;

/**
 * Where a piece stands at `t` (shared seconds): `{ dx, dz, solid }` - its offset from its spec place (a Drift across, a
 * Rail along) and whether it is there (a Beat off its beat is not). A Crumble's fall is its toucher's own (not here).
 */
export function egPieceAt(s, t, out = { dx: 0, dz: 0, solid: true }) {
  out.dx = 0; out.dz = 0; out.solid = true;
  if (s.kind === 'drift' && s.period > 0) out.dx = s.amp * Math.sin((TAU * t) / s.period + s.phase);
  else if (s.kind === 'rail' && s.period > 0) out.dz = s.amp * Math.sin((TAU * t) / s.period + s.phase);
  else if (s.kind === 'beat') out.solid = wrapT(t - s.beat, EG_BEAT_CYCLE_S) < EG_BEAT_SOLID_S;
  return out;
}
/** A Pendulum's weight at `t`: across the course (x, the hall's frame) over the middle of the gap before its step (z). */
export function egPendAt(s, t) {
  const swing = s.period > 0 ? Math.sin((TAU * t) / s.period + s.phase) : 0;
  return { x: s.x + EG_PEND_REACH * swing, z: s.z - s.d / 2 - (s.gap ?? 0) / 2 };
}
/** Is a body at (x, z), its feet at `y`, inside a Pendulum's weight at `t`? */
export function egPendHits(s, t, x, y, z) {
  const w = egPendAt(s, t);
  return Math.abs(x - w.x) < EG_PEND_HALF + EG_BODY_R && Math.abs(z - w.z) < EG_PEND_HALF + EG_BODY_R && y > s.y - 0.6 && y < s.y + 2.2;
}
/** A Vent's cycle at `t`: `{ tell, fire }` - its ring's progress over its last EG_VENT_TELL_S (0 to 1, 0 when not told) and
 *  whether it erupts. */
export function egVentState(s, t) {
  if (!(s.period > 0)) return { tell: 0, fire: false };
  const u = wrapT(t + s.phase, s.period), fireAt = s.period - EG_VENT_FIRE_S;
  if (u >= fireAt) return { tell: 1, fire: true };
  if (u >= fireAt - EG_VENT_TELL_S) return { tell: (u - (fireAt - EG_VENT_TELL_S)) / EG_VENT_TELL_S, fire: false };
  return { tell: 0, fire: false };
}
/** Is a body at (x, z) inside a Vent's disc (its platform's centre)? */
export const egInVentDisc = (s, x, z) => Math.hypot(x - s.x, z - s.z) <= EG_VENT_R;

/** THE SPAN BUILD's running jump: the widest gap (m, edge to edge) it crosses landing `h` higher (negative lower), 0 when
 *  it cannot rise so far, and how long it is in the air (s) - the closed form's flight plus the capsule over both edges,
 *  a drop's gain held to EG_DROP_GAIN a metre. Under the real motor at every height measured (test/egfull_span.test.js
 *  crosses each with player/motor.js PlayerMotor - 3.26 m flat where the motor clears 3.44): never generous. */
export function egJumpReach(h) {
  const disc = EG_JUMP_MPS * EG_JUMP_MPS - 2 * EG_JUMP_G * h;
  if (disc < 0) return { reach: 0, air: 0 };
  const run = EG_SPAN_RUN_MPS + EG_JUMP_MPS * EG_JUMP_FWD, air = (EG_JUMP_MPS + Math.sqrt(disc)) / EG_JUMP_G;
  const flat = run * ((2 * EG_JUMP_MPS) / EG_JUMP_G) + 2 * EG_BODY_R, reach = run * air + 2 * EG_BODY_R;
  return { reach: h < 0 ? Math.min(reach, flat - EG_DROP_GAIN * h) : reach, air };
}

/**
 * A course's chain: each step with what stands before it (the step it follows, or the still ground of a plate, an island
 * or a passage) - `{ a, b }` pairs in course order, `a` or `b` null for still ground, the last step's ground after it.
 */
export function egSpanPairs(spec) {
  const steps = spec.steps ?? [], out = [];
  const meets = (a, b) => !!a && !!b && Math.abs(a.z + a.d / 2 - (b.z - b.d / 2 - (b.gap ?? 0))) < 1e-6;
  for (let k = 0; k < steps.length; k++) {
    const s = steps[k], prev = steps[k - 1], next = steps[k + 1];
    if (s.kind !== 'riser') out.push({ a: meets(prev, s) ? prev : null, b: s, edge: s.z - s.d / 2 - (s.gap ?? 0) });   // a riser is climbed, never jumped onto
    if (!meets(s, next)) out.push({ a: s, b: null, edge: s.z + s.d / 2 });
  }
  return out;
}

const PA = { dx: 0, dz: 0, solid: true }, PB = { dx: 0, dz: 0, solid: true };
/** Does THE SPAN BUILD's jump from `a` (null: still ground) to `b` (null: still ground) launched at `t` land? */
function jumpLands(pair, t) {
  const { a, b } = pair;
  if (a) { egPieceAt(a, t, PA); if (!PA.solid) return false; }
  const ay = a ? a.y : (b ? b.y : 0), by = b ? b.y : (a ? a.y : 0);
  const { reach, air } = egJumpReach(by - ay);
  if (!(reach > 0)) return false;
  if (b) { egPieceAt(b, t + air, PB); if (!PB.solid) return false; }
  // the launch: the far edge of what I stand on (a step's own, or the ground's edge), anywhere across its width
  const lz = a ? a.z + PA.dz + a.d / 2 : pair.edge;
  const lx0 = a ? a.x + PA.dx - a.w / 2 : -Infinity, lx1 = a ? a.x + PA.dx + a.w / 2 : Infinity;
  // the landing: what I land on, edge to edge (the reach counts the capsule over both edges), anywhere across its width
  const nz0 = b ? b.z + PB.dz - b.d / 2 : pair.edge, nz1 = b ? b.z + PB.dz + b.d / 2 : Infinity;
  const nx0 = b ? b.x + PB.dx - b.w / 2 : -Infinity, nx1 = b ? b.x + PB.dx + b.w / 2 : Infinity;
  if (nz1 < lz + 0.5) return false;   // it has travelled behind me (or offers no half a metre to land on)
  const dz = Math.max(0, nz0 - lz);
  const dx = Math.max(0, Math.max(nx0, lx0) - Math.min(nx1, lx1));   // the least sideways reach between the two widths
  if (Math.hypot(dx, dz) > reach) return false;
  // a Pendulum over this gap: the body crosses its middle half-way through the flight - clear of the weight then
  if (b?.kind === 'pend') {
    const xs = Math.max(nx0, Math.min(lx1, b.x)), mid = t + air / 2;
    if (egPendHits(b, mid, xs, b.y, egPendAt(b, mid).z)) return false;
  }
  return true;
}

/**
 * THE TIMED SOLVER on one pair: its windows over EG_SOLVE_HORIZON_S - `{ open, worst12, wait, clearRun }`: the share of
 * time a launch lands, the least open time in any 12 s, the longest closed stretch, the longest open stretch.
 */
export function egPairWindows(pair) {
  const n = Math.round(EG_SOLVE_HORIZON_S / EG_SOLVE_STEP_S), ok = new Uint8Array(n);
  let open = 0;
  for (let k = 0; k < n; k++) if (jumpLands(pair, k * EG_SOLVE_STEP_S)) { ok[k] = 1; open++; }
  const w12 = Math.round(12 / EG_SOLVE_STEP_S);
  let sum = 0, worst = Infinity;
  for (let k = 0; k < n; k++) { sum += ok[k]; if (k >= w12) sum -= ok[k - w12]; if (k >= w12 - 1) worst = Math.min(worst, sum); }
  let wait = 0, clear = 0, run0 = 0, run1 = 0;
  for (let k = 0; k < 2 * n; k++) { if (ok[k % n]) { run1++; run0 = 0; clear = Math.max(clear, Math.min(run1, n)); } else { run0++; run1 = 0; wait = Math.max(wait, Math.min(run0, n)); } }
  return { open: open * EG_SOLVE_STEP_S, worst12: worst * EG_SOLVE_STEP_S, wait: wait * EG_SOLVE_STEP_S, clearRun: clear * EG_SOLVE_STEP_S };
}

/**
 * THE TIMED SOLVER on a hall's course: `{ ok, why }` - every pair's windows, every Crumble left in time, every Vent's
 * platform wide enough, every Drop's landing deep enough. `why` names each failure (the step's number and what failed).
 */
export function egSpanProof(spec) {
  const why = [];
  for (const s of spec.steps ?? []) {
    if (s.kind === 'vent' && Math.min(s.w, s.d) < EG_VENT_MIN_W) why.push(`${s.i}: a Vent's platform under ${EG_VENT_MIN_W} m`);
    if (s.kind === 'drop' && s.d < EG_DROP_LAND_MIN) why.push(`${s.i}: a Drop's landing under ${EG_DROP_LAND_MIN} m`);
    if (s.kind === 'crumble' && s.d / EG_SPAN_RUN_MPS + EG_CRUMBLE_SLACK_S > EG_CRUMBLE_DELAY_S) why.push(`${s.i}: a Crumble too deep to cross before it falls`);
    if (s.kind === 'rail') {
      const next = (spec.steps ?? [])[s.i + 1];
      const after = next && Math.abs(next.z - next.d / 2 - (next.gap ?? 0) - (s.z + s.d / 2)) < 1e-6 ? next.gap ?? 0 : Infinity;
      if (s.amp > Math.min(s.gap ?? 0, after) - EG_RAIL_CLEAR) why.push(`${s.i}: a Rail's travel closes on what stands beside it`);
    }
  }
  for (const pair of egSpanPairs(spec)) {
    const w = egPairWindows(pair), at = pair.b ? pair.b.i : `${pair.a?.i}>ground`;
    if (w.worst12 < EG_WINDOW_MIN) why.push(`${at}: a window of ${w.worst12.toFixed(2)} s in some 12 s`);
    else if (w.wait > EG_WAIT_MAX) why.push(`${at}: a wait of ${w.wait.toFixed(2)} s`);
    if (pair.b?.kind === 'pend' && w.clearRun < EG_PEND_CLEAR_MIN) why.push(`${at}: a Pendulum's gap clear only ${w.clearRun.toFixed(2)} s`);
    if (pair.a?.kind === 'crumble' && w.wait > EG_CRUMBLE_DELAY_S - EG_CRUMBLE_SLACK_S) why.push(`${at}: a wait on a Crumble`);
  }
  return { ok: why.length === 0, why };
}
