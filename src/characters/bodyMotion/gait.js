// @ts-check
// BODY-MOTION (2026-10-18; bible/04-Characters/Body-Motion.md) - THE GAIT. The Morrowind body's walk, run and sneak in
// third person, made from the body's own measurements and the motor's own pace instead of a clip played faster than it
// was drawn: Morrowind's walk is authored for 2.2 m/s and Daggerfall walks at 3.7 to 6.3, so the clip ran at twice and
// more its own cadence and every foot slid.
//
// THE LAW, in the order the frame asks it:
//  1. THE STRIDE is Alexander's (R. McN. Alexander, "Estimates of speeds of dinosaurs", Nature 261, 1976): a legged
//     animal's stride, in hip heights, follows its Froude number - lambda = 2.3 h (v^2 / g h)^0.3 - capped at the longest
//     stride the style can take. The cadence is what is left: the phase advances by the distance travelled over the
//     stride, so a planted foot moves back under the body at exactly the ground's speed - it never slides.
//  2. THE DUTY FACTOR (the share of a stride a foot stands) falls with the Froude number: a slow walk stands 0.62 of it,
//     a sprint 0.28 (both feet in the air between steps).
//  3. A FOOT ON THE GROUND rolls over the heel, stands flat, then rolls over the ball (the three rockers): its ankle is
//     placed by turning the flat foot about whichever point touches. In the air it leaves at the ground's speed, rises
//     early (the heel kicks up behind at a run), reaches, and comes down matching the ground again.
//  4. THE HIPS are held up by the legs that stand: never higher than a standing leg reaches (the inverted pendulum - so
//     the walk dips where both feet are down, the run sinks at mid-stance), swaying over the standing foot, turning with
//     the stride (the swinging leg's hip forward), dropping on the swinging side. The chest turns against them.
//  5. THE STEER: the body always faces the camera, so a strafe or a backpedal turns the HIPS toward the travel and the
//     chest back - up to 60 degrees - and the legs run along it, each kept on its own side.
//  6. STANDING, the feet stay where they stand while the body turns, and step back under it - the foot on the turn's
//     side first - once they are twisted past TURN.step; the body breathes and shifts its weight.
//
// Every length is a share of the body's leg (bodyKit.js bodyOf), every pace in metres per second of the world - the
// race's own height decides how long its leg is in metres, and so how it strides. Pure: one state object, stepped.

import {
  add, scale, dot, len, norm, lerp, clamp01, clamp, smooth, RAD, wrapAngle, frac, ease, FOOT,
} from './bodyKit.js';

const G = 9.81;

/**
 * THE STYLES - each a row of the gait's terms, blended by the frame's own shares (walk, run, sneak). Lengths are in the
 * body's legs, angles in degrees, `duty` and `frFull` as the law above. Tuned on the retail biped's measured skeleton
 * (test/fixtures/mw/retailRig.mjs) through the contact sheets tools/bodyMotionSheet.mjs draws; one frozen row each,
 * for Mac to move on his own data.
 *  - strideMax: the longest stride the style takes (legs); duty: [slow, fast] stance share; frFull: the Froude number at
 *    which the fast end is reached;
 *  - height: the hips over the ankle (legs; 1 a straight leg); bob: their rise and fall; sway: over the standing foot;
 *  - lift / liftFast: the ankle's rise in the swing, slow and fast; retract: how much of the ground's speed the swing
 *    leaves and lands with (0 none, 1 all);
 *  - heel, toeOff, swingToe: the foot's pitch at the strike (toes up), at the push (toes down), and in the swing;
 *    flat: the stance's shares [flat from, heel rises from];
 *  - width: the feet's track in hip widths; hipYaw, hipList, hipTilt, hipTiltWave: the pelvis's turn, drop, forward
 *    tilt and its wave; chestYaw, chestRoll, lean: the chest's counter-turn, its counter-drop and its forward lean;
 *  - arm: the free arm's swing (forward at the opposite foot's strike), its forward bias, the elbow [back, front], how
 *    far it is held out, and how far a running fist crosses toward the middle (the hand's shape is the clip's - carry.js).
 */
export const GAIT_STYLES = Object.freeze({
  walk: Object.freeze({
    strideMax: 2.15, duty: Object.freeze([0.62, 0.53]), frFull: 2.2,
    height: 0.975, bob: 0.024, sway: 0.028,
    lift: 0.085, liftFast: 0.12, retract: 0.35,
    heel: 16, toeOff: 34, swingToe: 10, flat: Object.freeze([0.16, 0.56]),
    width: 0.82, hipYaw: 8, hipList: 5, hipTilt: 4, hipTiltWave: 1.5,
    chestYaw: 9, chestRoll: 2.5, lean: 5,
    arm: Object.freeze({ swing: 27, bias: 4, elbow: Object.freeze([12, 36]), abduct: 8, cross: 0 }),
  }),
  run: Object.freeze({
    strideMax: 4.1, duty: Object.freeze([0.42, 0.3]), frFull: 7,
    height: 0.94, bob: 0.042, sway: 0.012,
    lift: 0.24, liftFast: 0.4, retract: 0.5,
    heel: 4, toeOff: 50, swingToe: 14, flat: Object.freeze([0.1, 0.32]),
    width: 0.42, hipYaw: 11, hipList: 6, hipTilt: 10, hipTiltWave: 3,
    chestYaw: 14, chestRoll: 3, lean: 11,
    arm: Object.freeze({ swing: 44, bias: 7, elbow: Object.freeze([74, 98]), abduct: 10, cross: 0.12 }),
  }),
  sneak: Object.freeze({
    strideMax: 1.3, duty: Object.freeze([0.72, 0.64]), frFull: 0.6,
    height: 0.8, bob: 0.012, sway: 0.04,
    lift: 0.09, liftFast: 0.1, retract: 0.2,
    heel: 8, toeOff: 20, swingToe: 6, flat: Object.freeze([0.22, 0.6]),
    width: 1.05, hipYaw: 5, hipList: 3, hipTilt: 12, hipTiltWave: 1,
    chestYaw: 5, chestRoll: 1.5, lean: 26,
    arm: Object.freeze({ swing: 12, bias: 14, elbow: Object.freeze([40, 58]), abduct: 16, cross: 0 }),
  }),
});

/**
 * THE STANDING BODY: the hips over the ankle (legs), the feet's track (hip widths, the left foot `lead` legs ahead),
 * the trunk's lean and the pelvis's tilt (degrees); the breath (`breath` s a cycle, `breathPitch` degrees of the chest)
 * and the weight's slow shift (`shift` s a cycle, `shiftSway` legs, `shiftList` degrees).
 */
export const STAND = Object.freeze({
  height: 0.982, width: 1.0, lead: 0.03, lean: 2, hipTilt: 4,
  breath: 4.2, breathPitch: 0.9, shift: 7.5, shiftSway: 0.012, shiftList: 1.4,
});

/**
 * THE SKELETON FAMILIES (bodyKit.js bodyKindOf) - each style's terms scaled for its body: the female skeleton's narrower
 * track, more turn and drop in the pelvis and arms held nearer; the beast's springier step, lighter on the ball of its
 * foot (`footBias`, degrees added to the foot's pitch: heel up), and lower carriage. Multipliers, 1 where unnamed.
 */
export const BODY_STYLES = Object.freeze({
  male: Object.freeze({}),
  female: Object.freeze({ width: 0.72, hipYaw: 1.3, hipList: 1.35, sway: 1.2, abduct: 0.8, swing: 0.92, chestYaw: 0.85, lean: 0.9 }),
  beast: Object.freeze({ bob: 1.25, lift: 1.15, lean: 1.2, height: 0.985, hipTilt: 1.25, footBias: -6 }),
  werewolf: Object.freeze({}),
});

/** THE STEER (degrees): a sideways travel turns the hips `forward` of its angle (at most `max`); past `back` degrees off
 *  the facing (with `hyst` of hysteresis) the body backpedals, the hips turned `backShare` of the way, at most `backMax`. */
export const STEER = Object.freeze({ forward: 0.68, max: 60, back: 105, hyst: 12, backShare: 0.55, backMax: 40 });

/** THE EASES (seconds): the gait coming on and going off, the style's shares, the speed, the steer, the lean. */
export const GAIT_EASE = Object.freeze({ moveIn: 0.09, moveOut: 0.16, style: 0.22, speed: 0.08, steer: 0.14, lean: 0.25, dir: 0.06 });

/** TURNING IN PLACE: a standing foot twisted `step` degrees off the body steps back under it, over `time` seconds,
 *  lifted `lift` legs; a turn of more than `snap` degrees in one frame (a teleport, a cut) re-plants both at once. */
export const TURN = Object.freeze({ step: 26, time: 0.26, lift: 0.07, snap: 90 });

/** THE STRIDE (metres) at `v` metres per second for a leg `h` metres long, in `style` - Alexander's relation, capped at
 *  the style's longest. Zero standing. */
export function strideLength(v, h, style) {
  if (!(v > 0) || !(h > 0)) return 0;
  return Math.min(2.3 * h * Math.pow((v * v) / (G * h), 0.3), style.strideMax * h);
}

/** THE DUTY FACTOR at `v` for a leg `h` metres long, in `style`. */
export function dutyFactor(v, h, style) {
  const fr = h > 0 ? (v * v) / (G * h) : 0;
  return lerp(style.duty[0], style.duty[1], clamp01(fr / style.frFull));
}

/** The swing's lift profile: 0 at both ends, 1 at its top (a third of the way in - the heel rises early). */
const LIFT_A = 1, LIFT_B = 1.7;
const LIFT_MAX = Math.pow(LIFT_A / (LIFT_A + LIFT_B), LIFT_A) * Math.pow(LIFT_B / (LIFT_A + LIFT_B), LIFT_B);
export const liftProfile = (s) => (s <= 0 || s >= 1 ? 0 : (Math.pow(s, LIFT_A) * Math.pow(1 - s, LIFT_B)) / LIFT_MAX);

/** A fresh gait state. */
export function createGaitState() {
  return {
    phase: 0, move: 0, run: 0, sneak: 0, speed: 0, dir: [0, 1], psi: 0, back: false,
    lean: 0, bank: 0, lastSpeed: 0, yaw: null, yawRate: 0, t: 0,
    feet: { L: null, R: null }, step: null,
  };
}

/** The style row blended by the frame's shares, the family's multipliers laid on. */
export function blendStyle(run, sneak, kind) {
  const w = GAIT_STYLES.walk, r = GAIT_STYLES.run, k = GAIT_STYLES.sneak;
  const ws = clamp01(sneak), wr = clamp01(run) * (1 - ws), ww = 1 - wr - ws;
  const mix = (f) => f(w) * ww + f(r) * wr + f(k) * ws;
  const fam = BODY_STYLES[kind] ?? BODY_STYLES.male;
  const m = (key) => fam[key] ?? 1;
  return {
    strideMax: mix((s) => s.strideMax), duty: [mix((s) => s.duty[0]), mix((s) => s.duty[1])], frFull: mix((s) => s.frFull),
    height: mix((s) => s.height) * m('height'), bob: mix((s) => s.bob) * m('bob'), sway: mix((s) => s.sway) * m('sway'),
    lift: mix((s) => s.lift) * m('lift'), liftFast: mix((s) => s.liftFast) * m('lift'), retract: mix((s) => s.retract),
    heel: mix((s) => s.heel), toeOff: mix((s) => s.toeOff), swingToe: mix((s) => s.swingToe),
    flat: [mix((s) => s.flat[0]), mix((s) => s.flat[1])],
    width: mix((s) => s.width) * m('width'),
    hipYaw: mix((s) => s.hipYaw) * m('hipYaw'), hipList: mix((s) => s.hipList) * m('hipList'),
    hipTilt: mix((s) => s.hipTilt) * m('hipTilt'), hipTiltWave: mix((s) => s.hipTiltWave),
    chestYaw: mix((s) => s.chestYaw) * m('chestYaw'), chestRoll: mix((s) => s.chestRoll), lean: mix((s) => s.lean) * m('lean'),
    arm: {
      swing: mix((s) => s.arm.swing) * m('swing'), bias: mix((s) => s.arm.bias),
      elbow: [mix((s) => s.arm.elbow[0]), mix((s) => s.arm.elbow[1])],
      abduct: mix((s) => s.arm.abduct) * m('abduct'), cross: mix((s) => s.arm.cross),
    },
    footBias: fam.footBias ?? 0,
    run: wr, sneak: ws,
  };
}

/** The foot's pitch (degrees, toes up) through a stance, `q` its share (0 the strike, 1 the push). */
export function stancePitch(q, P) {
  if (q < P.flat[0]) return P.heel * (1 - smooth(q / P.flat[0]));
  if (q < P.flat[1]) return 0;
  return -P.toeOff * smooth((q - P.flat[1]) / (1 - P.flat[1]));
}
/** ... and through a swing, `s` its share (0 the push, 1 the next strike). */
export function swingPitch(s, P) {
  if (s < 0.45) return lerp(-P.toeOff, P.swingToe, smooth(s / 0.45));
  return lerp(P.swingToe, P.heel, smooth((s - 0.45) / 0.55));
}

/**
 * THE FOOT'S PLACE for a flat footprint at `flat` ([x, y], the ankle's place over the ground) pitched `pitch` radians
 * (toes up) along `fwd` ([x, y], unit) - turned about the heel when the toes are up, about the ball when the heel is up,
 * so whichever touches stays where it touches. Answers { at, toe, up } in the rig.
 */
export function footPlace(flat, pitch, fwd, body) {
  const ankle = [flat[0], flat[1], body.ankle];
  const c = Math.cos(pitch), s = Math.sin(pitch);
  const toe = [fwd[0] * c, fwd[1] * c, s];
  const up = [-fwd[0] * s, -fwd[1] * s, c];
  if (pitch === 0) return { at: ankle, toe, up };
  const pivotLen = pitch > 0 ? -FOOT.heel * body.leg : FOOT.ball * body.leg;
  const pivot = [flat[0] + fwd[0] * pivotLen, flat[1] + fwd[1] * pivotLen, 0];
  // the ankle about the pivot: its offset (along the foot, and up) turned with the foot
  const along = -pivotLen, upAmt = body.ankle;
  return { at: add(pivot, add(scale(toe, along), scale(up, upAmt))), toe, up };
}

/**
 * ONE FRAME OF THE GAIT'S CLOCKS. `input`: the frame's own -
 *   speed (m/s, the applied ground speed), forward, strafe (the input axes), running, sneaking, yaw (radians, the body's
 *   heading in the world), grounded; `legM` the body's leg in metres (its race's height on it); `kind` the skeleton
 *   family. Steps `state` in place; answers it.
 */
export function stepGait(state, input, body, dt) {
  const s = state;
  const fwd = Number(input.forward) || 0, side = Number(input.strafe) || 0;
  const wants = Math.hypot(fwd, side) > 1e-3 && (input.speed ?? 0) > 0.05 && input.grounded !== false;
  // the way of travel in the body frame, eased so a key's flip turns rather than snaps
  if (wants) {
    const d = norm([side, fwd, 0]);
    const k = 1 - Math.exp(-dt / GAIT_EASE.dir);
    const nd = norm([lerp(s.dir[0], d[0], k), lerp(s.dir[1], d[1], k), 0]);
    s.dir = len(nd) > 0.5 ? [nd[0], nd[1]] : [d[0], d[1]];
  }
  s.speed = ease(s.speed, wants ? Math.max(0, input.speed) : 0, GAIT_EASE.speed, dt);
  s.move = ease(s.move, wants ? 1 : 0, wants ? GAIT_EASE.moveIn : GAIT_EASE.moveOut, dt);
  if (!wants && s.move < 1e-3) s.move = 0;
  s.run = ease(s.run, wants && input.running && !input.sneaking ? 1 : 0, GAIT_EASE.style, dt);
  s.sneak = ease(s.sneak, input.sneaking ? 1 : 0, GAIT_EASE.style, dt);
  // the stride and its clock
  const h = input.legM;
  const P = blendStyle(s.run, s.sneak, input.kind);
  const stride = strideLength(s.speed, h, P);
  if (stride > 1e-6) s.phase = frac(s.phase + (s.speed / stride) * dt);
  // the steer: the hips toward the travel, the backpedal past its angle. `cw` is the travel's angle off the facing,
  // clockwise from above (a strafe to the right is +90 degrees); the hips' turn `psi` is the rig's own, counter-clockwise
  // - so a travel to the right turns them by a negative psi
  const theta = Math.atan2(s.dir[0], s.dir[1]);
  const off = Math.abs(theta) / RAD;
  if (s.back) { if (off < STEER.back - STEER.hyst) s.back = false; } else if (off > STEER.back + STEER.hyst) s.back = true;
  const psiWant = !wants ? 0 : s.back
    ? -clamp(wrapAngle(theta - Math.PI) * STEER.backShare, -STEER.backMax * RAD, STEER.backMax * RAD)
    : -clamp(theta * STEER.forward, -STEER.max * RAD, STEER.max * RAD);
  s.psi = ease(s.psi, psiWant, GAIT_EASE.steer, dt);
  // the lean into a quickening, and the bank into a turn (both eased)
  const accel = dt > 0 ? (s.speed - s.lastSpeed) / dt : 0;
  s.lastSpeed = s.speed;
  const yaw = Number(input.yaw) || 0;
  if (s.yaw != null && dt > 0) s.yawRate = ease(s.yawRate, wrapAngle(yaw - s.yaw) / dt, 0.1, dt);
  s.lean = ease(s.lean, clamp(accel * 0.012, -0.12, 0.16) * s.move, GAIT_EASE.lean, dt);
  s.bank = ease(s.bank, clamp(-s.yawRate * s.speed * 0.022, -0.2, 0.2) * s.move, GAIT_EASE.lean, dt);
  s.t += dt;
  stepFeet(s, body, yaw, dt);
  s.yaw = yaw;
  return s;
}

/** The standing foot's place under the body (rig, [x, y]) - the track a little wider than the hips, the left a
 *  little ahead (the weight's ease). */
function standingFoot(side, body) {
  const sign = side === 'R' ? 1 : -1;
  const w = body.hipWidth * 0.5 * STAND.width;
  return [body.restHip[0] + sign * w, body.restHip[1] + (side === 'L' ? STAND.lead * body.leg : 0)];
}
const rotXY = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; };

/** THE STANDING FEET: anchored where they stand while the body turns, re-planted under it while it walks, stepping back
 *  under it one at a time when twisted too far. The anchor turns with the world: a heading the body gains (yaw grows to
 *  the right) turns a fixed point the other way in the rig - counter-clockwise from above. */
function stepFeet(s, body, yaw, dt) {
  const jump = s.yaw == null || Math.abs(wrapAngle(yaw - s.yaw)) > TURN.snap * RAD;
  for (const side of ['L', 'R']) {
    if (!s.feet[side] || jump || s.move > 0.5) s.feet[side] = { yaw0: yaw, p: standingFoot(side, body) };
  }
  if (jump || s.move > 0.5) { s.step = null; return; }
  if (s.step) {
    s.step.t += dt;
    if (s.step.t >= TURN.time) {
      s.feet[s.step.side] = { yaw0: yaw, p: standingFoot(s.step.side, body) };
      s.step = null;
    }
    return;
  }
  const twist = (side) => wrapAngle(yaw - s.feet[side].yaw0);
  const tl = twist('L'), tr = twist('R');
  const most = Math.max(Math.abs(tl), Math.abs(tr));
  if (most > TURN.step * RAD) {
    // the foot on the turn's side opens first: a heading gained to the right steps the right foot
    const first = tr > 0 ? 'R' : 'L';
    const side = Math.abs(twist(first)) >= Math.abs(twist(first === 'R' ? 'L' : 'R')) * 0.6 ? first : (first === 'R' ? 'L' : 'R');
    s.step = { side, t: 0, from: anchoredFoot(s, side, yaw), fromYaw: twist(side) };
  } else if (Math.abs(tl) > TURN.step * 0.5 * RAD && Math.abs(tr) < 2 * RAD) {
    s.step = { side: 'L', t: 0, from: anchoredFoot(s, 'L', yaw), fromYaw: tl };
  } else if (Math.abs(tr) > TURN.step * 0.5 * RAD && Math.abs(tl) < 2 * RAD) {
    s.step = { side: 'R', t: 0, from: anchoredFoot(s, 'R', yaw), fromYaw: tr };
  }
}
/** An anchored foot's place in the rig at heading `yaw`. */
function anchoredFoot(s, side, yaw) {
  const a = s.feet[side];
  return rotXY(a.p, wrapAngle(yaw - a.yaw0));
}

/**
 * THE GAIT'S POSE this frame, in the rig: the hips' middle, their turn, drop and tilt; the chest's turn, drop and lean;
 * each foot's ankle, toe and up (and the knee's way); and the free arms' swing - for the solver
 * (bodySolve.js) and the carry (carry.js). `stance` (carry.js) may move the standing feet and turn the standing hips (a
 * fighting stance), `extra` lays a strike's weight shift on the hips (melee.js). Pure.
 */
export function gaitPose(state, input, body, stance = null) {
  const s = state;
  const P = blendStyle(s.run, s.sneak, input.kind);
  const L = body.leg, U = input.unitsPerM;
  const h = input.legM;
  const stride = strideLength(s.speed, h, P) * U;   // rig units
  const beta = dutyFactor(s.speed, h, P);
  const fr = h > 0 ? (s.speed * s.speed) / (G * h) : 0;
  const frShare = clamp01(fr / P.frFull);
  const A = (stride * beta) / 2;
  const move = s.move;
  const phi = s.phase;
  const psi = s.psi;
  const hf = [-Math.sin(psi), Math.cos(psi), 0];   // the hips' forward and right: the rig's turned psi (counter-clockwise)
  const hr = [Math.cos(psi), Math.sin(psi), 0];
  const d = [s.dir[0], s.dir[1], 0];
  const c = clamp(dot(d, hf), -1, 1);   // how much of the travel is along the hips' forward (- a backpedal)
  // ---- the feet ----
  const stand = standingTargets(s, input, body, stance);
  const feet = {};
  const lanes = { L: -1, R: 1 };
  const neutralOf = (side) => {
    const w = body.hipWidth * 0.5 * P.width;
    return [body.restHip[0] + hr[0] * lanes[side] * w, body.restHip[1] + hr[1] * lanes[side] * w];
  };
  const bias = P.footBias * RAD;
  for (const side of ['L', 'R']) {
    const u = frac(phi - (side === 'L' ? 0 : 0.5));
    const n = neutralOf(side);
    const place = (x, pitchDeg) => footPlace([n[0] + d[0] * x, n[1] + d[1] * x], pitchDeg * RAD * c + bias, [hf[0], hf[1]], body);
    let g;
    let lift = 0;
    if (u < beta) {
      const q = u / beta;
      g = place(A * (1 - 2 * q), stancePitch(q, P));
    } else {
      const sw = (u - beta) / (1 - beta);
      const from = place(-A, -P.toeOff), to = place(A, P.heel);
      const x0 = dot(sub2(from.at, n), d), x1 = dot(sub2(to.at, n), d);
      const m = (-2 * A * (1 - beta) / Math.max(0.05, beta)) * P.retract;
      const s2 = sw * sw, s3 = s2 * sw;
      const x = (2 * s3 - 3 * s2 + 1) * x0 + (s3 - 2 * s2 + sw) * m + (-2 * s3 + 3 * s2) * x1 + (s3 - s2) * m;
      const pitch = swingPitch(sw, P) * RAD * c + bias;
      const pl = footPlace([n[0] + d[0] * x, n[1] + d[1] * x], pitch, [hf[0], hf[1]], body);
      // the lift grows with the pace (a sprint's heel kicks high) and with the stride (a shuffle barely clears)
      lift = lerp(P.lift, P.liftFast, frShare) * L * Math.min(1, stride / (L * 0.6)) * liftProfile(sw);
      g = { at: [pl.at[0], pl.at[1], lerp(from.at[2], to.at[2], smooth(sw)) + lift], toe: pl.toe, up: pl.up };
    }
    // keep each foot on its own side of the hips' middle (a strafe's lateral share is a side-step, never a crossing)
    const lat = (g.at[0] - body.restHip[0]) * hr[0] + (g.at[1] - body.restHip[1]) * hr[1];
    const minLat = body.hipWidth * 0.12;
    if (lanes[side] * lat < minLat) {
      const push = minLat - lanes[side] * lat;
      g.at = [g.at[0] + hr[0] * lanes[side] * push, g.at[1] + hr[1] * lanes[side] * push, g.at[2]];
    }
    const sf = stand[side];
    feet[side] = {
      at: lerpV(sf.at, g.at, move),
      toe: norm(lerpV(sf.toe, g.toe, move)),
      up: norm(lerpV(sf.up, g.up, move)),
      stance: u < beta,
      lift,
    };
  }
  // ---- the hips ----
  const sway = P.sway * L * move;
  const midL = beta / 2;
  const swayWave = -Math.cos(2 * Math.PI * (phi - midL));
  const listWave = Math.cos(2 * Math.PI * (phi - midL));
  const walkBob = (1 - Math.cos(4 * Math.PI * (phi - midL))) / 2;   // 0 at mid-stance, 1 between
  const runBob = (1 + Math.cos(4 * Math.PI * (phi - midL))) / 2;    // 1 at mid-stance: the leg's spring
  const runShare = P.run;
  const bob = P.bob * L * move * Math.min(1, frShare * 2 + 0.3) * lerp(walkBob, runBob, runShare);
  const standH = body.ankle + lerp(STAND.height, P.height, move) * L - bob;
  const idle = 1 - move;
  const breathT = (2 * Math.PI * s.t) / STAND.breath, shiftT = (2 * Math.PI * s.t) / STAND.shift;
  const hipXY = [
    body.restHip[0] + hr[0] * sway * swayWave + idle * STAND.shiftSway * L * Math.sin(shiftT) + (stand.hipShift?.[0] ?? 0) * idle,
    body.restHip[1] + hr[1] * sway * swayWave + (stand.hipShift?.[1] ?? 0) * idle,
  ];
  const hipYaw = psi * move + stand.hipYaw * idle - P.hipYaw * RAD * Math.cos(2 * Math.PI * phi) * move * c;
  const hipRoll = P.hipList * RAD * listWave * move + idle * STAND.shiftList * RAD * Math.sin(shiftT);
  const hipPitch = lerp(STAND.hipTilt, P.hipTilt, move) * RAD + P.hipTiltWave * RAD * Math.cos(4 * Math.PI * (phi - midL)) * move;
  // the standing legs hold the hips up: never higher than either reaches (a soft min, so the dip is round)
  let hipZ = standH;
  for (const side of ['L', 'R']) {
    const f = feet[side];
    if (!(f.stance || move < 0.5)) continue;
    const sign = lanes[side];
    const jx = hipXY[0] + Math.cos(hipYaw) * sign * body.hipWidth * 0.5, jy = hipXY[1] + Math.sin(hipYaw) * sign * body.hipWidth * 0.5;
    const dz = -sign * Math.sin(hipRoll) * body.hipWidth * 0.5;   // the joint's height over the middle (the right drops with a + roll)
    const reach = (body.legs?.[side] ?? L) * 0.992;
    const dxy = Math.hypot(f.at[0] - jx, f.at[1] - jy);
    const top = f.at[2] + Math.sqrt(Math.max(0, reach * reach - dxy * dxy)) - dz;
    hipZ = smin(hipZ, top, L * 0.04);
  }
  // ---- the chest ----
  const breath = Math.sin(breathT) * STAND.breathPitch * RAD * idle;
  const chestYaw = P.chestYaw * RAD * Math.cos(2 * Math.PI * phi) * move * c;
  const chestRoll = -P.chestRoll * RAD * listWave * move + s.bank;
  const chestPitch = lerp(STAND.lean, P.lean, move) * RAD + s.lean - breath + (stand.lean ?? 0) * idle;
  // ---- the free arms ----
  const swing = (P.arm.swing * RAD * Math.cos(2 * Math.PI * phi)) * move * (s.back ? -1 : 1);
  return {
    move, phase: phi, duty: beta, stride, frShare, run: P.run, sneak: P.sneak, back: s.back, speed: s.speed,
    hip: { at: [hipXY[0], hipXY[1], hipZ], yaw: hipYaw, roll: hipRoll, pitch: hipPitch },
    chest: { yaw: chestYaw, roll: chestRoll, pitch: chestPitch, breath: Math.sin(breathT) * idle },
    feet,
    arm: { swing, bias: P.arm.bias * RAD * move, elbow: P.arm.elbow, abduct: P.arm.abduct * RAD, cross: P.arm.cross, phase: phi },
  };
}

const sub2 = (a, b) => [a[0] - b[0], a[1] - b[1], 0];
const lerpV = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/** A smooth minimum: min(a, b), rounded over `k` where the two meet. */
export function smin(a, b, k) {
  const hh = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - hh * hh * k * 0.25;
}

/**
 * THE STANDING FEET in the rig this frame: each foot at its anchor turned by the heading gained since it was planted,
 * its toes the way it was planted; a foot stepping back under the body lifted along its arc. A carry `stance` moves the
 * standing feet (`feet.L`/`feet.R` - [x, y] in legs, added) and turns the standing hips (`hipYaw`, radians) - a fighting
 * stance's split feet. Answers { L, R, hipYaw }.
 */
function standingTargets(s, input, body, stance) {
  const yaw = Number(input.yaw) || 0;
  const out = { hipYaw: 0, hipShift: null, lean: 0 };
  let twistSum = 0;
  for (const side of ['L', 'R']) {
    const a = s.feet[side] ?? { yaw0: yaw, p: standingFoot(side, body) };
    const twist = wrapAngle(yaw - a.yaw0);
    let p = rotXY(a.p, twist);
    let footYaw = twist;
    let z = 0;
    const off = stance?.feet?.[side];
    if (off) p = [p[0] + off[0] * body.leg, p[1] + off[1] * body.leg];
    if (s.step && s.step.side === side) {
      const k = clamp01(s.step.t / TURN.time);
      let to = standingFoot(side, body);
      if (off) to = [to[0] + off[0] * body.leg, to[1] + off[1] * body.leg];
      const from = off ? [s.step.from[0] + off[0] * body.leg, s.step.from[1] + off[1] * body.leg] : s.step.from;
      p = [lerp(from[0], to[0], smooth(k)), lerp(from[1], to[1], smooth(k))];
      footYaw = lerp(s.step.fromYaw, 0, smooth(k));
      z = TURN.lift * body.leg * Math.sin(Math.PI * k);
    }
    const toeYaw = footYaw + (off && stance?.toe ? (stance.toe[side] ?? 0) * RAD : 0);
    const pl = footPlace(p, 0, [-Math.sin(toeYaw), Math.cos(toeYaw)], body);
    out[side] = { at: [pl.at[0], pl.at[1], pl.at[2] + z], toe: pl.toe, up: pl.up };
    twistSum += footYaw;
  }
  // the hips follow the feet half way (the chest stays with the camera); a stance turns them its own way
  out.hipYaw = twistSum * 0.25 + (stance?.hipYaw ?? 0) * RAD;
  out.hipShift = stance?.hipShift ? [stance.hipShift[0] * body.leg, stance.hipShift[1] * body.leg] : null;
  out.lean = (stance?.lean ?? 0) * RAD;
  return out;
}
