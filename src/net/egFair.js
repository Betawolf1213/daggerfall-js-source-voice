// @ts-check
// EG-H1 (EG8d, 2026-10-12, Mac: "I said I want everything"; bible/11-Multiplayer/Elite-Gates.md sections 21 and 10.8):
// THE FAIR TRAIL AND ITS TIME LAW - what the relay knows of where a member's body was, and when.
//
//   THE TIME LAW (section 21, "Time, before enforcement"). The relay kept its boss fights' trails timed by ARRIVAL, while
//     a client draws and resolves a landing on a clock that runs late by the welcome's one-way latency - so both poses
//     the judge read could predate the client's landing, and a dodge in its last round trip was counted as a hit. In an
//     `eg:` room each pose is placed at its SHARED time: its own `ts` (the sender's wall clock mod POSE_TS_MOD,
//     net/wire.js - unwrapped here by poseTsDiff) plus the socket's offset to relay time, the least `arrival - ts` over
//     its last EG_TS_KEEP poses (egPoseShared) - which is the send time plus the quickest way here - less the one-way
//     delay the member's own corrected clock measured (net/egClock.js: half its round trip, said with its `clk` ping), so
//     a pose stands at the instant it was sent. Never later than it arrived, never before the socket's last pose, never
//     more than EG_TS_LAG_MAX_MS before it arrived: a forged stamp or a forged delay buys at most the 300 ms the judge's
//     own window already allows, and a member that says no delay is placed at the quickest way's end, never before it.
//     The judge's readers (egTrailAt, egTrailAfter, egTrailNear - bossRef.js judgeShapes): where a body stood at a
//     landing is its last pose SENT at or before it; where it stood after, the first SENT after it, waited for up to
//     EG_POSE_WAIT_MS; a body with no pose within EG_POSE_NEAR_MS of the landing is not counted.
//   THE FAIR TRAIL (`spanFair`, on every `eg:` pose - egFairPose). The body trails are seconds long and a crossing takes
//     tens of seconds, so the room keeps an ONLINE accumulator per member, in the sender's own time:
//     - SUPPORT: a pose lies on a floor, a ramp or a platform's top (its footprint at that time by net/egSpanLaw.js
//       egPieceAt - the Steps' stepAt and beatStands - inflated by the capsule EG_BODY_R and by the platform's travel
//       over EG_SUPPORT_LAG_S), or a climb's hold beside one (the pose's `cl`), or is in the air;
//     - SPEED: no stretch faster than THE FAST BUILD's run times EG_FAIR_RUN_X, plus a push and a ride
//       (EG_FAIR_CARRY_MPS), plus EG_FAIR_SNAP_M for the snaps the game makes itself (a ring kept, a segment's cast);
//       a step back to where the member last stood (a cast-back) is no step;
//     - AIR: no airborne stretch past EG_AIR_MAX_S that is not a fall (a body dropping past EG_FALL_M under its last
//       support is cast back, not flying);
//     - BLINDNESS: a `ts` gap over EG_BLIND_MS is BLIND and judges nothing either way; a crossing more than
//       EG_FAIR_BLIND_MAX blind opens no door, and its measure says so;
//     - THE LAST ISLAND: a member's trail is fair while no stretch broke the law since it last stood on still ground (an
//       island, a plate, a passage's floor - never the end plate it is crossing to). Every pose-gated credit asks it.
//     - REPEATS: a second break within a hall refuses the member's hits for EG_FAIR_REPEAT_MS.
//     - THE CROSSING: from the hall's first judged pose to the end plate, its time against egCrossMinMs and its blind
//       share - the measure (egFairMeasure), which gates nothing until EG21.
//   RIDDEN POSES (section 10.8). A pose on a moving piece (a Drift, a Rail, a Drum) carries `pl`: the piece's index and
//     its offset from that piece's top at the sender's time (egRideOf); a receiver draws it at the piece's place on its
//     own clock plus the offset, and the relay judges it on the piece's clock position at the pose's shared time
//     (egRideAt), its offset held to the piece's top (egRideHolds) - a rider never floats beside a swinging platform,
//     and a pose cannot claim a piece it is not on.
//
// Pure: a pose, a spec and a clock in; the accumulator moved in place. In the relay bundle (net/egBrain.js); the client
// reads the ridden poses' half. Not a DFU member. Ledger A (ELITE-GATES).
import { poseTsDiff } from './wire.js';
import { egPieceAt, EG_BODY_R, EG_SINK_GONE_M } from './egSpanLaw.js';
import { segDist } from './egShape.js';

// ── THE TIME LAW ─────────────────────────────────────────────────────────────────────────────────────────────
/** A socket's offset to relay time is the least `arrival - ts` over this many of its last poses. */
export const EG_TS_KEEP = 32;
/** A pose is never placed more than this before it arrived (ms) - and the judge counts no body silent this long either
 *  side of a landing (EG_POSE_NEAR_MS, the same 300 ms). */
export const EG_TS_LAG_MAX_MS = 300;
/** Where a body stood after a landing is the first pose sent after it, waited for up to this long (ms). */
export const EG_POSE_WAIT_MS = 800;
/** A body with no pose within this of a landing is not counted (ms). */
export const EG_POSE_NEAR_MS = 300;
/** The shared-time trail: this long, this many poses at most (the judge reads EG_POSE_WAIT_MS past a landing). */
export const EG_TRAIL_MS = 3000;
export const EG_TRAIL_MAX = 40;

/** A socket's pose clock, new: its `ts` unwrapped (`u`), its offsets, its last shared time, and `h` - the one-way delay its
 *  corrected clock measured (half its round trip, said with its `clk` ping - net/egClock.js), 0 until said. */
export const egPoseClock = () => ({ u: 0, ts: /** @type {number|null} */ (null), offs: /** @type {number[]} */ ([]), t: -Infinity, h: 0 });
/**
 * A POSE'S SHARED TIME (relay ms) at its `arrival`: its `ts` unwrapped plus the socket's offset to relay time - the least
 * `arrival - ts` over its last EG_TS_KEEP poses (a pose never arrives before it was sent, so this is the send time plus
 * the quickest way here), less the one-way delay the socket's own corrected clock measured (`C.h`, at most
 * EG_TS_LAG_MAX_MS - a member that never said one is placed at the quickest way's end, never before) - held within [its
 * arrival - EG_TS_LAG_MAX_MS, its arrival] and never before the socket's last pose. A pose with no `ts` (a client before
 * SCALE2b) stands at its arrival; one whose `ts` runs backwards is out of order - null, it judges nothing. Moves the clock.
 * @param {{u: number, ts: number|null, offs: number[], t: number, h?: number}} C @param {unknown} ts @param {number} arrival
 * @returns {number|null}
 */
export function egPoseShared(C, ts, arrival) {
  if (!Number.isInteger(ts)) { C.t = Math.max(C.t, arrival); return C.t; }
  const T = /** @type {number} */ (ts);
  if (C.ts != null) { const d = poseTsDiff(T, C.ts); if (d < 0) return null; C.u += d; }
  C.ts = T;
  C.offs.push(arrival - C.u);
  if (C.offs.length > EG_TS_KEEP) C.offs.shift();
  let off = Infinity;
  for (const o of C.offs) if (o < off) off = o;
  const h = Math.max(0, Math.min(EG_TS_LAG_MAX_MS, Number.isFinite(C.h) ? /** @type {number} */ (C.h) : 0));
  C.t = Math.min(arrival, Math.max(C.u + off - h, C.t, arrival - EG_TS_LAG_MAX_MS));
  return C.t;
}
/** A shared-time trail grown by one entry `[t, x, y, z, h]` (the hall's own frame, its hall's number), kept to
 *  EG_TRAIL_MS and EG_TRAIL_MAX. */
export function egTrailPush(tr, e) {
  tr.push(e);
  while (tr.length > EG_TRAIL_MAX || (tr.length && e[0] - tr[0][0] > EG_TRAIL_MS)) tr.shift();
  return tr;
}
/** Where the trail stood at `t`: its last entry sent at or before it, or null (not known). */
export function egTrailAt(tr, t) { let q = null; for (const e of tr ?? []) { if (e[0] <= t) q = e; else break; } return q; }
/** Where the trail stood next after `t`: its first entry sent after it, or null (none yet). */
export function egTrailAfter(tr, t) { for (const e of tr ?? []) if (e[0] > t) return e; return null; }
/** Is there an entry within EG_POSE_NEAR_MS of `t`? */
export const egTrailNear = (tr, t) => (tr ?? []).some((e) => Math.abs(e[0] - t) <= EG_POSE_NEAR_MS);
/** May a landing at `at` be judged at `now`: a pose sent after it has come, or EG_POSE_WAIT_MS has passed. */
export const egTrailReady = (tr, at, now) => now >= at + EG_POSE_WAIT_MS || !!egTrailAfter(tr, at);

// ── THE FIGHT FLOOR A BODY STANDS ON (section 11.7: "The relay's judge is 2D, per floor") ─────────────────────
/** A body is on a fight floor while its polygon holds it and its feet lie this far under it at most, and this far over. */
export const EG_FLOOR_UNDER_M = 0.5;
export const EG_FLOOR_OVER_M = 3.0;
/**
 * The fight floor (`spec.fl`) a body's feet at (x, y, z) stand on - the highest whose polygon holds it at or below its
 * height plus EG_FLOOR_UNDER_M, its feet no more than EG_FLOOR_OVER_M over it (a jumper at the fast build's 2.68 m apex is
 * still on its floor) - or null: traversal ground, where no lord or add aims a blow. Pure.
 * @param {any} spec @param {number} x @param {number} y @param {number} z
 */
export function egFightFloorAt(spec, x, y, z) {
  let best = null;
  for (const f of spec?.fl ?? []) {
    const fy = f.y ?? 0;
    if (!(fy <= y + EG_FLOOR_UNDER_M && y - fy <= EG_FLOOR_OVER_M)) continue;
    if (!(f.t === 'd' ? Math.hypot(x - f.x, z - f.z) <= f.r : segDist(x, z, f.ax, f.az, f.bx, f.bz) <= f.hw)) continue;
    if (!best || fy > (best.y ?? 0)) best = f;
  }
  return best;
}

// ── RIDDEN POSES (section 10.8) ──────────────────────────────────────────────────────────────────────────────
/** The pieces a body rides (they carry it across or along: a Drift, a Rail, a Drum). */
export const EG_RIDE_KINDS = Object.freeze(['drift', 'rail', 'drum']);
/** A rider's offset over its piece's top: at most this under it and this over it (m - standing, a hop's start). */
export const EG_RIDE_DOWN_M = 0.3;
export const EG_RIDE_UP_M = 0.6;
const r2 = (v) => Math.round(v * 100) / 100;
/** The ridden piece at `i`, or null (a piece that rides nothing - a still slab, a Beat - is no ride). */
const ridden = (spec, i) => { const s = spec?.steps?.[i]; return s && s.i === i && EG_RIDE_KINDS.includes(s.kind) ? s : null; };
/**
 * The ride a body at (x, y, z) (the hall's frame, its feet) is on at shared second `tS`: `[i, dx, dy, dz]` - the piece's
 * index and the body's offset from the piece's top centre (cm) - or null. Pure.
 * @param {any} spec @param {number} x @param {number} y @param {number} z @param {number} tS
 */
export function egRideOf(spec, x, y, z, tS) {
  for (const s of spec?.steps ?? []) {
    if (!EG_RIDE_KINDS.includes(s.kind)) continue;
    const q = egPieceAt(s, tS);
    if (!q.solid) continue;
    const dx = x - (s.x + q.dx), dz = z - (s.z + q.dz), dy = y - s.y;
    if (Math.abs(dx) <= s.w / 2 + EG_BODY_R && Math.abs(dz) <= s.d / 2 + EG_BODY_R && dy >= -EG_RIDE_DOWN_M && dy <= EG_RIDE_UP_M) return [s.i, r2(dx), r2(dy), r2(dz)];
  }
  return null;
}
/** Does a ride's offset lie on its piece's top (the capsule about it)? A pose cannot claim a piece it stands beside. */
export function egRideHolds(spec, pl) {
  const s = Array.isArray(pl) ? ridden(spec, pl[0]) : null;
  return !!s && Math.abs(pl[1]) <= s.w / 2 + EG_BODY_R && Math.abs(pl[3]) <= s.d / 2 + EG_BODY_R && pl[2] >= -EG_RIDE_DOWN_M && pl[2] <= EG_RIDE_UP_M;
}
/** Where a ridden pose stands at shared second `tS`: the piece's place on the clock plus the offset `[x, y, z]` (the hall's
 *  frame), or null when the ride is none of this hall's. */
export function egRideAt(spec, pl, tS) {
  const s = Array.isArray(pl) ? ridden(spec, pl[0]) : null;
  if (!s) return null;
  const q = egPieceAt(s, tS);
  return [s.x + q.dx + pl[1], s.y + pl[2], s.z + q.dz + pl[3]];
}

// ── SUPPORT ──────────────────────────────────────────────────────────────────────────────────────────────────
/** A support's pad (the capsule) and the platform's travel over this long (s) beside it. */
export const EG_SUPPORT_PAD = EG_BODY_R;
export const EG_SUPPORT_LAG_S = 0.15;
/** A body stands on a floor while its feet are at most this over it and this under it (m - a hop's first frame, a slope's
 *  facet, a sinking slab's first metres). */
export const EG_SUPPORT_UP_M = 0.6;
export const EG_SUPPORT_DOWN_M = 1.0;
/** A climb's hold (`cl`) is support within this of a floor's plan (m - a Riser's 2.3 m face, a ledge's lip). */
export const EG_CLIMB_NEAR_M = 3;
/** What holds a body: none, an island (still ground - a plate, an island, a passage's floor, a bridge, a ramp), still
 *  ground that is no island (the end plate, an alcove), a piece. */
export const EG_HOLD = Object.freeze({ none: 0, island: 1, still: 2, piece: 3 });
const yOn = (y, fy) => y <= fy + EG_SUPPORT_UP_M && y >= fy - EG_SUPPORT_DOWN_M;
/**
 * WHAT HOLDS a body's feet at (x, y, z) (the hall's frame) at shared second `tS` (EG_HOLD). `plan` - the floor's plan
 * alone, every height (a climb's hold). Pure.
 * @param {any} spec @param {number} x @param {number} y @param {number} z @param {number} tS @param {boolean} [plan]
 */
export function egSupportAt(spec, x, y, z, tS, plan = false) {
  const P = EG_SUPPORT_PAD + (plan ? EG_CLIMB_NEAR_M : 0), on = (fy) => plan || yOn(y, fy ?? 0);
  for (const d of spec?.discs ?? []) if (Math.hypot(x - d.x, z - d.z) <= d.r + P && on(d.y)) return d.role === 'end' ? EG_HOLD.still : EG_HOLD.island;
  for (const b of spec?.bands ?? []) if (z >= b.z0 - P && z <= b.z1 + P && Math.abs(x - b.x) <= b.halfW + P && on(b.y)) return EG_HOLD.island;
  for (const l of spec?.lanes ?? []) if (segDist(x, z, l.ax, l.az, l.bx, l.bz) <= l.hw + P && on(l.y)) return EG_HOLD.island;
  for (const r of spec?.ramps ?? []) {
    const dx = r.bx - r.ax, dz = r.bz - r.az, L2 = dx * dx + dz * dz, u = L2 > 0 ? Math.max(0, Math.min(1, ((x - r.ax) * dx + (z - r.az) * dz) / L2)) : 0;
    if (segDist(x, z, r.ax, r.az, r.bx, r.bz) <= r.hw + P && on(r.y0 + (r.y1 - r.y0) * u)) return EG_HOLD.island;
  }
  for (const s of spec?.steps ?? []) {
    const fy = s.y ?? 0;
    if (!plan && !(y <= fy + EG_SUPPORT_UP_M && y >= fy - (s.kind === 'sink' ? EG_SINK_GONE_M : EG_SUPPORT_DOWN_M))) continue;
    for (const t of [tS - EG_SUPPORT_LAG_S, tS, tS + EG_SUPPORT_LAG_S]) {
      const q = egPieceAt(s, t);
      if (!q.solid && !plan) continue;
      if (Math.abs(x - (s.x + q.dx)) <= s.w / 2 + P && Math.abs(z - (s.z + q.dz)) <= s.d / 2 + P) return EG_HOLD.piece;
    }
  }
  for (const a of spec?.alcoves ?? []) if (Math.hypot(x - a.x, z - a.z) <= 1.8 + P && on(a.y)) return EG_HOLD.still;
  return EG_HOLD.none;
}

// ── THE FAIR TRAIL ───────────────────────────────────────────────────────────────────────────────────────────
/** THE FAST BUILD's run (section 10.2 - Speed 100, Running 100, Fleetfoot III's +10%): player/motor.js runSpeed(100, 100) x
 *  1.1, pinned equal by test/egint_relay.test.js (the relay's bundle does not carry the motor). */
export const EG_FAST_RUN_MPS = ((100 + 150) / 39.5) * (1.35 + 100 / 200) * 1.1;
/** The law's speed: the fast build's run times this, plus a push and a ride (a blow's, a gust's, a Rail's, a belt's). */
export const EG_FAIR_RUN_X = 1.1;
export const EG_FAIR_CARRY_MPS = 4;
/** The game's own snaps beside a stretch (m): a challenge's ring kept, a falling segment's cast forward. */
export const EG_FAIR_SNAP_M = 2.5;
/** Speed is measured over stretches at least this long (ms - a pose's jitter is no speed). */
export const EG_FAIR_WIN_MS = 500;
/** A cast-back lands within this of where the member last stood (m). */
export const EG_CAST_NEAR_M = 3;
/** The air's law: no airborne stretch past this that is not a fall (s), and a fall is this far under the last support (m). */
export const EG_AIR_MAX_S = 2.5;
export const EG_FALL_M = 3;
/** A `ts` gap over this is BLIND (ms); a crossing more than this share blind opens no door. */
export const EG_BLIND_MS = 400;
export const EG_FAIR_BLIND_MAX = 0.3;
/** A crossing's blind share is read once it has run this long (ms). */
export const EG_FAIR_SPAN_MIN_MS = 2000;
/** A second break within a hall refuses the member's hits this long (ms). */
export const EG_FAIR_REPEAT_MS = 5000;

/**
 * A member's FAIR TRAIL in hall `h`, fresh (its arrival, a recall, a new hall): no break, nothing judged. `from` the
 * crossing's start (its first judged pose), `cross` its time at the end plate, `blind`/`span` the ms blind and judged,
 * `brk` breaks since the last island, `brks` the hall's, `fast` its fastest stretch (cm/s), `refuse` hits refused until.
 * @param {number} h
 */
export const egFairNew = (h) => ({ h, last: /** @type {number[]|null} */ (null), sup: /** @type {number[]|null} */ (null), isl: /** @type {number[]|null} */ (null), airAt: 0, airBrk: 0,
  win: /** @type {number[]|null} */ (null), brk: 0, brks: 0, why: '', refuse: 0, fast: 0, blind: 0, span: 0, from: 0, cross: 0, cblind: 0, road: 0, wake: 0 });

/** A break of the law: counted since the last island and in the hall; a second in the hall refuses the hits a while. */
function broke(A, why, t) {
  A.brk++; A.brks++; A.why = why;
  if (A.brks >= 2) A.refuse = t + EG_FAIR_REPEAT_MS;
}
/**
 * ONE POSE of a member's fair trail: `p` its feet in the hall's own frame (`{x, y, z}` - a ridden pose already at its
 * piece's clock position) with `ride` (it claimed a piece and the piece holds it) and `cl` (a climb's hold), `t` its
 * shared time (ms). The stretch from the last pose is judged - its speed, its air - unless it was blind; the hold under
 * it is read; still ground ends the window from the last island. Moves `A` in place. Pure.
 * @param {ReturnType<typeof egFairNew>} A @param {any} spec @param {{x: number, y: number, z: number, ride?: boolean, cl?: boolean}} p @param {number} t
 */
export function egFairPose(A, spec, p, t) {
  if (![p.x, p.y, p.z, t].every(Number.isFinite)) return;
  const L = A.last;
  const hold = p.ride ? EG_HOLD.piece : egSupportAt(spec, p.x, p.y, p.z, t / 1000) || (p.cl && egSupportAt(spec, p.x, p.y, p.z, t / 1000, true) ? EG_HOLD.piece : EG_HOLD.none);
  A.last = [t, p.x, p.y, p.z];
  if (!A.from) A.from = t;
  if (!L) { if (hold) { A.sup = [t, p.x, p.y, p.z]; if (hold === EG_HOLD.island) A.isl = [p.x, p.z]; } return; }
  const dt = t - L[0];
  if (!(dt > 0)) return;
  A.span += dt;
  let fair = true;
  if (dt > EG_BLIND_MS) {
    // BLIND: the stretch judges nothing either way - its speed unknown, its air begun again here
    A.blind += dt; A.win = null; A.airAt = hold ? 0 : t; A.airBrk = 0;
  } else {
    // THE SPEED: over stretches of at least EG_FAIR_WIN_MS, the law's run plus a carry and the game's own snaps; a step back
    // to where the member last stood or last held an island (a cast-back), or out of a fall, is no step
    const d = Math.hypot(p.x - L[1], p.z - L[3]);
    const fell = !!A.sup && L[2] < A.sup[2] - EG_FALL_M;
    const home = (q) => !!q && Math.hypot(p.x - q[0], p.z - q[1]) <= EG_CAST_NEAR_M;
    const back = hold === EG_HOLD.island && p.z < L[3] - EG_FAIR_SNAP_M;   // a cast back onto still ground behind - a Pendulum's, a waystone's: it gains nothing
    if (fell || (d > EG_FAIR_SNAP_M && hold && (back || home(A.isl) || (A.sup && home([A.sup[1], A.sup[3]]))))) A.win = null;
    else {
      const w = (A.win ??= [0, 0]);
      w[0] += d; w[1] += dt;
      // judged at once when the stretch already outruns what its whole window allows (a teleport, then a credit asked at
      // once, is never a window late), and closed at EG_FAIR_WIN_MS
      if (w[0] > (EG_FAST_RUN_MPS * EG_FAIR_RUN_X + EG_FAIR_CARRY_MPS) * (Math.max(w[1], EG_FAIR_WIN_MS) / 1000) + EG_FAIR_SNAP_M) { broke(A, 'speed', t); fair = false; A.win = null; }
      else if (w[1] >= EG_FAIR_WIN_MS) { A.fast = Math.max(A.fast, Math.round((w[0] / (w[1] / 1000)) * 100)); A.win = null; }
    }
    // THE AIR: an airborne stretch past EG_AIR_MAX_S that is no fall breaks the law once
    if (hold) { A.airAt = 0; A.airBrk = 0; }
    else {
      if (!A.airAt) A.airAt = A.sup ? Math.max(A.sup[0], L[0]) : L[0];
      const falling = !!A.sup && p.y < A.sup[2] - EG_FALL_M;
      if (!falling && !A.airBrk && (t - A.airAt) / 1000 > EG_AIR_MAX_S) { A.airBrk = 1; broke(A, 'air', t); fair = false; }
    }
  }
  if (hold) A.sup = [t, p.x, p.y, p.z];
  // THE LAST ISLAND: a fair pose on still ground (never the end plate) ends the window
  if (hold === EG_HOLD.island && fair) { A.brk = 0; A.isl = [p.x, p.z]; }
}
/** Is the member's crossing more than EG_FAIR_BLIND_MAX blind (once it has run EG_FAIR_SPAN_MIN_MS)? */
export const egFairBlind = (A) => !!A && A.span >= EG_FAIR_SPAN_MIN_MS && A.blind / A.span > EG_FAIR_BLIND_MAX;
/** IS THE TRAIL FAIR for a pose-gated credit: no break since the last island, and the crossing not too blind. A member the
 *  relay has no trail of yet (a reload before its first pose) is fair - the law judges poses, never their absence. */
export const egFairOk = (A) => !A || (A.brk === 0 && !egFairBlind(A));
/** Are the member's hits refused at `now` (a second break in the hall, EG_FAIR_REPEAT_MS)? */
export const egFairRefuses = (A, now) => !!A && now < A.refuse;
/** The crossing reached the end plate at shared ms `t` (once a hall): its time, its blind share, its road. */
export function egFairCross(A, t, road = 0) {
  if (!A || A.cross || !A.from) return;
  A.cross = Math.max(1, t - A.from); A.cblind = A.span > 0 ? A.blind / A.span : 0; A.road = road;
}
/** THE CROSSING'S LOWER BOUND (section 10.5's EG_CROSS_MIN): the road's length from the arrival plate to the end plate at
 *  THE FAST BUILD's run, less 15% (ms) - the Low Road's bridges across and back added. A measure; it gates nothing. */
export function egCrossMinMs(spec, road = 0) {
  if (!spec?.arrive || !spec?.end) return 0;
  const len = Math.max(0, spec.end.z - spec.arrive.z) + (road === 1 && spec.fork ? 2 * Math.abs(spec.fork.lowX - spec.fork.x) : 0);
  return Math.round((len / EG_FAST_RUN_MPS) * 0.85 * 1000);
}
/**
 * A MEMBER'S MEASURES as a receipt's `m` would carry them (whole numbers): the crossing (ds), its lower bound (ds), its
 * blind share (%), the hall's breaks, the fastest stretch (cm/s), whether the door was the room's wake's (`m.wake`). Null
 * when the hall measured nothing.
 * @param {ReturnType<typeof egFairNew>|null} A @param {any} spec
 */
export function egFairMeasure(A, spec) {
  if (!A || !A.span) return null;
  return [Math.round(A.cross / 100), Math.round(egCrossMinMs(spec, A.road) / 100), Math.round(100 * (A.cross ? A.cblind : A.blind / A.span)), A.brks, A.fast, A.wake ? 1 : 0];
}
