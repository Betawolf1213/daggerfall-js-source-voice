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
// EG-FULL, LAYER THREE (section 11): the fragments' own pieces (a Moon branch under its beams, a rolling Drum, a Bone
// bridge, a Sinking flight), proofs road by road (THE FORK), the real gap after each run, and THE MEDIAN (egRoadCross).
//
// EG-ZC (2026-10-12, Mac: "I said I want everything"; sections 10.5 and 11.2): THE COOLING SLAG - a crossing whose crusts
// stand only after a spill, two spouts pouring in turn (egSlagState, egSlagLane), each landing on a crust held through its
// crossing and each crust left onto still ground; and THE SHAFTS' bound, a shaft crossed inside EG_SHAFT_MAX_S.
//
// EG-H3 (2026-10-12; sections 10.1 and 29, EG4): THE PLATFORM CLOCK, ONE HOME - the Unmoored Steps' stepAt, beatStands,
// beatBlinks and beatWarned moved here whole on the two laws the Spire's pieces move by (egDriftDx, egBeatAt), with the
// Beat's and the Crumble's numbers; world/sdSteps.js re-exports them, so the Hour and the Spire keep one clock. And THE
// COURSE AS DATA: courseOf lays a course record (`{ steps, checkpoints, end }`, the Steps' uniform step) from a spec -
// the Hour's is world/sdSteps.js courseOf(SD_COURSE_SPEC), byte for byte the course it froze at import.
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
/** The Steps' Beat (its cycle, its solid share, the warning blink before it goes) and Crumble (the delay under a foot) -
 *  THEIR ONE HOME since EG-H3: world/sdSteps.js says them as SD_BEAT_CYCLE, SD_BEAT_SOLID, SD_BEAT_BLINK and
 *  SD_CRUMBLE_DELAY. */
export const EG_BEAT_CYCLE_S = 3.6;
export const EG_BEAT_SOLID_S = 2.4;
export const EG_BEAT_BLINK_S = 0.4;
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
/** EG-FULL LAYER THREE (sections 11.2-11.3) - THE FRAGMENTS' OWN PIECES:
 *   Moon   a black-glass branch of the Gloam Thicket (and the Moon Path), solid only while a moonbeam lies on it: the
 *          beams walk the course at EG_MOON_MPS, one every `period` (EG_MOON_MPS x `period` apart), each lit EG_MOON_HALF
 *          either side of its centre - the Beat's law, driven by the beams (`beat` where a beam stood at nought).
 *   Drum   a column drum of the Broken Colonnade rolling along the course at a fixed EG_DRUM_MPS, out and back - ridden as
 *          a Rail is (`amp` half its roll).
 *   Bone   a bone bridge of the Ossuary: the Crumble's law in its dress.
 *   Sink   a flight of the Sinking Stair: from a foot it sinks into the mist at EG_SINK_MPS (each member's own, as a
 *          Crumble is), gone EG_SINK_GONE_M down, and back after the Crumble's return. A wait on it is never longer than
 *          EG_SINK_WAIT_MAX, and the jump off it is taken EG_SINK_ON_S of sinking low. */
export const EG_MOON_MPS = 2.5;
export const EG_MOON_HALF = 3.5;
export const EG_MOON_EVERY_S = 4;
export const EG_DRUM_MPS = 2.0;
export const EG_SINK_MPS = 0.5;
export const EG_SINK_GONE_M = 3;
export const EG_SINK_WAIT_MAX = 2;
export const EG_SINK_ON_S = 1;
/** The pieces that fall under a foot (the Crumble's law): their depth crossed before the delay, no wait upon them. */
export const EG_CRUMBLE_KINDS = Object.freeze(['crumble', 'bone']);
/** EG-ZC (2026-10-12, Mac: "I said I want everything"; bible/11-Multiplayer/Elite-Gates.md section 11.2) - THE COOLING SLAG,
 *  the Forge Gut's signature and its ONE HOME (net/egFragLaw.js EG_HAZARDS.slag says these numbers): a spill is a lane of
 *  magma 4 m wide, told EG_SLAG_TELL_S, molten EG_SLAG_MOLTEN_S, then a crust that stands EG_SLAG_CRUST_S, every
 *  EG_SLAG_CYCLE_S - the way across exists only after a spill. A `slag` step is a crossing poured by EG_SLAG_SPOUTS spouts
 *  side by side, `amp` either side of its `x`, each `w` wide, the second half a cycle behind the first: a lone crust would
 *  hold the company 10 s at its lip, past THE TIMED SOLVER's EG_WAIT_MAX (section 10.5's "no queues"), so the spouts pour in
 *  turn and one crust stands while the other is told and molten. A landing on a crust is believed only while it holds
 *  through the crossing (its depth at THE SPAN BUILD's run, and the Crumble's slack), and a crust is left onto still ground
 *  (EG_SLAG_AFTER) - nobody waits on a crust for a timed piece. EG_SLAG_WARN_S before it breaks its lane is told in white. */
export const EG_SLAG_TELL_S = 1.2;
export const EG_SLAG_MOLTEN_S = 6;
export const EG_SLAG_CRUST_S = 10;
export const EG_SLAG_CYCLE_S = 20;
export const EG_SLAG_SPOUTS = 2;
export const EG_SLAG_WARN_S = 1;
/** What a crust is left onto: the ground itself, or a step that keeps no time. */
export const EG_SLAG_AFTER = Object.freeze(['still', 'ledge', 'drop']);
/** THE SHAFTS (section 10.5): a shaft takes at most this long at THE SPAN BUILD (s - its median crossing). */
export const EG_SHAFT_MAX_S = 15;

const TAU = 2 * Math.PI;
const wrapT = (t, p) => ((t % p) + p) % p;

// ── EG-H3 (EG4): THE PLATFORM CLOCK ──────────────────────────────────────────────────────────────────────────────
/** A Drift's swing across the course at `t` (shared seconds): `amp` either side over `period`, from `phase` - the Steps'
 *  and the Spire's one swing. */
export const egDriftDx = (s, t) => s.amp * Math.sin((TAU * t) / s.period + s.phase);
/** Where `t` falls in a Beat's cycle, from its own half beat (`beat`): 0 to EG_BEAT_CYCLE_S. */
export const egBeatAt = (s, t) => wrapT(t - s.beat, EG_BEAT_CYCLE_S);
/** A step's top-centre at `t` (the realm's anchored seconds), the realm's frame: the Drift's swing across x. AUDIT SD: into
 *  `out` when one is given - the page's frame makes nothing. */
export function stepAt(s, t, out = [0, 0, 0]) {
  // AUDIT SD II (L2 F9): two stores - a choice between a made number and a whole one was a number made a step a frame
  if (s.kind === 'drift') out[0] = s.x + egDriftDx(s, t);
  else out[0] = s.x;
  out[1] = s.y;
  out[2] = s.z;
  return out;
}
/** Whether a Beat step stands at `t` (the others always do): solid EG_BEAT_SOLID_S of every EG_BEAT_CYCLE_S, from its own
 *  half beat. */
export function beatStands(s, t) {
  if (s.kind !== 'beat') return true;
  return egBeatAt(s, t) < EG_BEAT_SOLID_S;
}
/** Whether a Beat step is blinking at `t` - the last EG_BEAT_BLINK_S of its stand, its warning. */
export function beatBlinks(s, t) {
  if (s.kind !== 'beat') return false;
  const u = egBeatAt(s, t);
  return u >= EG_BEAT_SOLID_S - EG_BEAT_BLINK_S && u < EG_BEAT_SOLID_S;
}
/** SD-FLASH: how long a Beat step has been warning at `t` (s; meaningful while `beatBlinks`) - its falter's own clock. */
export function beatWarned(s, t) {
  return egBeatAt(s, t) - (EG_BEAT_SOLID_S - EG_BEAT_BLINK_S);
}

// ── EG-H3 (EG4): THE COURSE AS DATA ──────────────────────────────────────────────────────────────────────────────
/**
 * A COURSE LAID FROM ITS SPEC - the record the Hour's Unmoored Steps and every reader of a course take: `steps` (each one
 * shape, `{ i, kind, span, x, y, z, w, d, amp, period, phase, beat }` - x, z its top's centre at rest, y its top, its
 * unused fields nought), `checkpoints` (`{ x, y, z, r }`, the first the spec's `start`) and `end` (where the course
 * meets its goal). Laid along +z from the start's far edge, section by section (a section's index is its steps' `span`):
 * each piece `gap` past the last edge, `size` (`{ w, d }`) its top; a piece's `rise` lifts the course before it stands
 * (a riser); a section that `descend`s steps evenly down to nought over its pieces (the Crumble); a section's `check`
 * is the gap to the checkpoint after it. Each spec number is used as the Steps' own arithmetic used it, so the Hour's
 * spec lays the Hour's course byte for byte. Pure.
 * @param {{ start: { x: number, y?: number, z: number, r: number }, x?: number, checkR: number, toEnd: number,
 *   sections: ReadonlyArray<{ pieces: ReadonlyArray<{ kind: string, gap: number, size: { w: number, d: number }, rise?: number,
 *   amp?: number, period?: number, phase?: number, beat?: number }>, check?: number | null, descend?: boolean }> }} spec
 */
export function courseOf(spec) {
  const steps = [], checkpoints = [{ x: spec.start.x, y: spec.start.y ?? 0, z: spec.start.z, r: spec.start.r }];
  const x0 = spec.x ?? 0;
  let edge = spec.start.z + spec.start.r, y = spec.start.y ?? 0;
  const put = (kind, span, size, gap, { amp = 0, period = 0, phase = 0, beat = 0 } = {}) => {
    const z = edge + gap + size.d / 2;
    steps.push({ i: steps.length, kind, span, x: x0, y, z, w: size.w, d: size.d, amp, period, phase, beat });
    edge = z + size.d / 2;
  };
  spec.sections.forEach((sec, span) => {
    const drop = sec.descend ? y / sec.pieces.length : 0;
    for (const p of sec.pieces) {
      if (p.rise) y += p.rise;
      if (sec.descend) y = Math.max(0, y - drop);
      put(p.kind, span, p.size, p.gap, p);
    }
    if (sec.check != null) { const z = edge + sec.check + spec.checkR; checkpoints.push({ x: x0, y, z, r: spec.checkR }); edge = z + spec.checkR; }
  });
  return { steps, checkpoints, end: edge + spec.toEnd };
}
/** Out and back at one speed: -amp to amp and home over `period` (s) - a drum's roll, a moonbeam's walk. */
export function egTriAt(amp, period, phase, t) {
  if (!(period > 0)) return 0;
  const u = wrapT(t + phase, period) / period;
  return u < 0.5 ? -amp + 4 * amp * u : 3 * amp - 4 * amp * u;
}
/**
 * EG-ZC - A SLAG CROSSING'S SPOUT `k` at `t` (shared seconds): `{ st, k }` - told (`tell`, the spill coming), `molten` (a
 * lane of magma), `crust` (a platform) or `gone` (the crust broken, the chasm open), and how far through that state (0 to
 * 1). Spout k pours `k` halves of a cycle behind the first.
 * @param {any} s @param {number} k @param {number} t
 * @returns {{ st: 'tell'|'molten'|'crust'|'gone', k: number }}
 */
export function egSlagState(s, k, t) {
  const P = s.period > 0 ? s.period : EG_SLAG_CYCLE_S, u = wrapT(t + (s.phase ?? 0) + (k * P) / EG_SLAG_SPOUTS, P);
  if (u < EG_SLAG_TELL_S) return { st: 'tell', k: u / EG_SLAG_TELL_S };
  if (u < EG_SLAG_TELL_S + EG_SLAG_MOLTEN_S) return { st: 'molten', k: (u - EG_SLAG_TELL_S) / EG_SLAG_MOLTEN_S };
  if (u < EG_SLAG_TELL_S + EG_SLAG_MOLTEN_S + EG_SLAG_CRUST_S) return { st: 'crust', k: (u - EG_SLAG_TELL_S - EG_SLAG_MOLTEN_S) / EG_SLAG_CRUST_S };
  return { st: 'gone', k: (u - EG_SLAG_TELL_S - EG_SLAG_MOLTEN_S - EG_SLAG_CRUST_S) / Math.max(1e-9, P - EG_SLAG_TELL_S - EG_SLAG_MOLTEN_S - EG_SLAG_CRUST_S) };
}
/** The spout whose crust stands at `t` (the first first), or -1 - none. */
export function egSlagLane(s, t) {
  for (let k = 0; k < EG_SLAG_SPOUTS; k++) if (egSlagState(s, k, t).st === 'crust') return k;
  return -1;
}
/** Spout `k`'s lane across the course (its centre's x, the hall's frame): `amp` either side of the step's `x`. */
export const egSlagX = (s, k) => s.x + (k === 0 ? -s.amp : s.amp);

/** The centre of the moonbeam nearest a Moon step at `t` (the beams walk +z at EG_MOON_MPS, `period` apart). */
export function egMoonBeamZ(s, t) {
  const every = EG_MOON_MPS * (s.period > 0 ? s.period : EG_MOON_EVERY_S), c0 = s.beat + EG_MOON_MPS * (t + s.phase);
  return c0 + Math.round((s.z - c0) / every) * every;
}

/**
 * Where a piece stands at `t` (shared seconds): `{ dx, dz, solid }` - its offset from its spec place (a Drift across, a
 * Rail along) and whether it is there (a Beat off its beat is not). A Crumble's fall is its toucher's own (not here).
 */
export function egPieceAt(s, t, out = { dx: 0, dz: 0, solid: true }) {
  out.dx = 0; out.dz = 0; out.solid = true;
  if (s.kind === 'drift' && s.period > 0) out.dx = egDriftDx(s, t);
  else if (s.kind === 'rail' && s.period > 0) out.dz = s.amp * Math.sin((TAU * t) / s.period + s.phase);
  else if (s.kind === 'beat') out.solid = egBeatAt(s, t) < EG_BEAT_SOLID_S;
  else if (s.kind === 'drum') out.dz = egTriAt(s.amp, s.period, s.phase, t);
  else if (s.kind === 'moon') out.solid = Math.abs(s.z - egMoonBeamZ(s, t)) <= EG_MOON_HALF;
  else if (s.kind === 'slag') { const k = egSlagLane(s, t); out.solid = k >= 0; out.dx = k >= 0 ? egSlagX(s, k) - s.x : 0; }   // EG-ZC: the standing crust's lane
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
  // one road's steps follow one another (THE FORK: each road its own course - section 11.4)
  const meets = (a, b) => !!a && !!b && (a.road ?? 0) === (b.road ?? 0) && Math.abs(a.z + a.d / 2 - (b.z - b.d / 2 - (b.gap ?? 0))) < 1e-6;
  for (let k = 0; k < steps.length; k++) {
    const s = steps[k], prev = steps[k - 1], next = steps[k + 1];
    if (s.road === 2) continue;   // an alcove's side way is optional - never proven, never asked of anyone
    if (s.kind !== 'riser') out.push({ a: meets(prev, s) ? prev : null, b: s, edge: s.z - s.d / 2 - (s.gap ?? 0) });   // a riser is climbed, never jumped onto
    if (!meets(s, next)) out.push({ a: s, b: null, edge: s.z + s.d / 2 + (s.after ?? 0) });   // the still ground's own edge, the real gap on
  }
  return out;
}

const PA = { dx: 0, dz: 0, solid: true }, PB = { dx: 0, dz: 0, solid: true };
/** Does THE SPAN BUILD's jump from `a` (null: still ground) to `b` (null: still ground) launched at `t` land? */
function jumpLands(pair, t) {
  const { a, b } = pair;
  if (a) { egPieceAt(a, t, PA); if (!PA.solid) return false; }
  const ay = (a ? a.y : (b ? b.y : 0)) - (a?.kind === 'sink' ? EG_SINK_MPS * EG_SINK_ON_S : 0), by = b ? b.y : (a ? a.y : 0);
  const { reach, air } = egJumpReach(by - ay);
  if (!(reach > 0)) return false;
  if (b) { egPieceAt(b, t + air, PB); if (!PB.solid) return false; }
  // EG-ZC: a crust landed on holds through its crossing - the lane it lands on still a crust at the far edge
  if (b?.kind === 'slag' && egSlagState(b, egSlagLane(b, t + air), t + air + b.d / EG_SPAN_RUN_MPS + EG_CRUMBLE_SLACK_S).st !== 'crust') return false;
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

/** THE MEDIAN (section 10.5): a road's median crossing, swept over start phases, is at most this many times its fastest. */
export const EG_MEDIAN_X = 1.6;
const CROSS_SAMPLES = 72;
/**
 * A ROAD'S CROSSING (section 10.5): THE SPAN BUILD running the road from its first launch to its last landing, from start
 * phases every EG_SOLVE_HORIZON_S / 72 - each pair waited for in turn (the next window that lands), the still ground run
 * between - `{ fast, median, n }` (s; `n` its pairs). A road with no pairs crosses in nought. `from` its stretch from that
 * far along the hall (THE FORK's roads, from the fork).
 * @param {any} spec @param {number} [road] @param {number} [from]
 */
export function egRoadCross(spec, road = 0, from = -Infinity) {
  const launch = (p) => (p.a ? p.a.z + p.a.d / 2 : p.edge);
  const pairs = egSpanPairs(spec).filter((p) => ((p.b ?? p.a)?.road ?? 0) === road && launch(p) >= from);
  if (!pairs.length) return { fast: 0, median: 0, n: 0 };
  const z0 = launch(pairs[0]), times = [];
  for (let k = 0; k < CROSS_SAMPLES; k++) {
    const t0 = (k * EG_SOLVE_HORIZON_S) / CROSS_SAMPLES;
    let waited = 0;
    for (const p of pairs) {
      const at = t0 + (launch(p) - z0) / EG_SPAN_RUN_MPS + waited;
      let w = 0;
      while (w < EG_SOLVE_HORIZON_S && !jumpLands(p, at + w)) w += EG_SOLVE_STEP_S;
      waited += w;
    }
    const last = pairs[pairs.length - 1];
    times.push((launch(last) - z0) / EG_SPAN_RUN_MPS + waited);
  }
  times.sort((a, b) => a - b);
  return { fast: times[0], median: times[CROSS_SAMPLES >> 1], n: pairs.length };
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
    if (EG_CRUMBLE_KINDS.includes(s.kind) && s.d / EG_SPAN_RUN_MPS + EG_CRUMBLE_SLACK_S > EG_CRUMBLE_DELAY_S) why.push(`${s.i}: a Crumble too deep to cross before it falls`);
    if (s.kind === 'rail' || s.kind === 'drum') {
      const next = (spec.steps ?? [])[s.i + 1];
      const after = next && (next.road ?? 0) === (s.road ?? 0) && Math.abs(next.z - next.d / 2 - (next.gap ?? 0) - (s.z + s.d / 2)) < 1e-6 ? next.gap ?? 0 : Infinity;
      if (s.amp > Math.min(s.gap ?? 0, after) - EG_RAIL_CLEAR) why.push(`${s.i}: a Rail's travel closes on what stands beside it`);
    }
    // EG-ZC: a slag crust is left onto still ground - the ground itself, or a step of its road that keeps no time
    if (s.kind === 'slag') {
      const next = (spec.steps ?? [])[s.i + 1];
      const meets = !!next && (next.road ?? 0) === (s.road ?? 0) && Math.abs(next.z - next.d / 2 - (next.gap ?? 0) - (s.z + s.d / 2)) < 1e-6;
      if (meets && !EG_SLAG_AFTER.includes(next.kind)) why.push(`${s.i}: a slag crust left onto a ${next.kind}`);
    }
  }
  for (const pair of egSpanPairs(spec)) {
    const w = egPairWindows(pair), at = pair.b ? pair.b.i : `${pair.a?.i}>ground`;
    if (w.worst12 < EG_WINDOW_MIN) why.push(`${at}: a window of ${w.worst12.toFixed(2)} s in some 12 s`);
    else if (w.wait > EG_WAIT_MAX) why.push(`${at}: a wait of ${w.wait.toFixed(2)} s`);
    if (pair.b?.kind === 'pend' && w.clearRun < EG_PEND_CLEAR_MIN) why.push(`${at}: a Pendulum's gap clear only ${w.clearRun.toFixed(2)} s`);
    if (EG_CRUMBLE_KINDS.includes(pair.a?.kind) && w.wait > EG_CRUMBLE_DELAY_S - EG_CRUMBLE_SLACK_S) why.push(`${at}: a wait on a Crumble`);
    if (pair.a?.kind === 'sink' && w.wait > EG_SINK_WAIT_MAX) why.push(`${at}: a wait of ${w.wait.toFixed(2)} s on a sinking flight`);
  }
  // THE MEDIAN, road by road: no road whose ordinary crossing runs far past its best
  if (!why.length) for (const road of [0, 1]) {
    const c = egRoadCross(spec, road);
    if (c.n && c.fast > 0 && c.median > EG_MEDIAN_X * c.fast) why.push(`road ${road}: a median crossing of ${c.median.toFixed(1)} s past ${EG_MEDIAN_X} x its fastest ${c.fast.toFixed(1)} s`);
  }
  // EG-ZC - THE SHAFTS (section 10.5): each shaft's own steps crossed, at their median, inside EG_SHAFT_MAX_S
  if (!why.length) for (const f of spec.frags ?? []) {
    if (f.cls !== 'shaft') continue;
    const c = egRoadCross({ steps: (spec.steps ?? []).filter((s) => (s.road ?? 0) === (f.road ?? 0) && s.z > f.z0 && s.z < f.z1) }, f.road ?? 0);
    if (c.n && c.median > EG_SHAFT_MAX_S) why.push(`a shaft crossed in ${c.median.toFixed(1)} s, past ${EG_SHAFT_MAX_S} s`);
  }
  return { ok: why.length === 0, why };
}
