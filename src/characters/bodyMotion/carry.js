// @ts-check
// BODY-MOTION (2026-10-18; bible/04-Characters/Body-Motion.md) - THE CARRY. How the arms hold what is in them while the
// body stands, walks, runs and creeps - one row per weapon class, per gait, per arm - in place of Morrowind's single
// pose per weapon group, whose arms the walk only bobbed.
//
// AN ARM ROW is anatomical, not a point in space: the shoulder's FLEXION (forward, degrees; negative reaches back), its
// ABDUCTION (out from the side), the ELBOW's bend, the upper arm's inward TWIST (the forearm toward the middle), and
// how much of the gait's own arm swing it takes. The arm is built from those by forward kinematics off the shoulder,
// on the chest's own frame, with the arm's own bone lengths - so a long arm and a short one, a male body and a beast,
// hold the same pose. A WEAPON HAND adds where its blade points and which way its true edge faces, in the chest's
// frame [right, forward, up] - the hand is turned so the Weapon Bone stands that way (bodySolve.js gripRequest). A free
// hand faces its palm in toward the body. THE FINGERS ARE THE CLIP'S: the stance's own group already shapes the hand -
// closed on its grip (walkforward1h, the two-handers' groups, hand-to-hand's fists; a pair's left hand the TWO-HANDS
// mirror of the right), loose in a free walk - and a curl laid on it would be added to the clip's (climbRig.js poseArm's
// curl is relative), driving a closed hand's fingers into its palm. So the layer turns the hand and leaves its fingers.
//
// THE CLASSES (carryClassOf): 'free' (nothing in hand - the gait's own swing), 'one' (a one-hander, held down and away
// from the side, Mac's stance; run "in the same format" - the arm low and out, the blade trailing), 'two' (a two-hander
// in a low guard with both hands; run with it at the hip, the blade trailing behind, the left hand pumping), 'wide' (a
// staff, both hands across the body), 'spear' (a spear, both hands, the point forward), 'dual' (a pair, held down and
// away from both sides; run with both swept behind), 'fists' (bare-handed with the fists up: a guard), and 'clip' (a
// bow, a crossbow, a thrown weapon, a readied spell - the clip's own arms, which already carry them).
// Every row is the RIGHT arm's; the left is its mirror. Pure.

import { MW_WEAPON_TYPE } from '../../formats/morrowind/mwFirstPerson.js';
import { rotAxisAngle } from '../../combat/climbRig.js';
import {
  sub, add, scale, dot, norm, len, lerp, clamp01, apply, RAD, reflect, inFrame,
} from './bodyKit.js';
import { gripRequest } from './bodySolve.js';

/** The class a hand's weapon is carried as (the module's head). `torch` takes the left arm to the clip.
 *  @param {{ mwType?: number, shown?: boolean, hands?: string, spell?: boolean }} [hand] */
export function carryClassOf({ mwType = MW_WEAPON_TYPE.None, shown = false, hands = 'single', spell = false } = {}) {
  if (spell) return 'clip';
  if (hands === 'fists' && shown) return 'fists';
  if (!shown) return 'free';
  if (hands === 'dual') return 'dual';
  switch (mwType) {
    case MW_WEAPON_TYPE.HandToHand: return 'fists';
    case MW_WEAPON_TYPE.ShortBladeOneHand: case MW_WEAPON_TYPE.LongBladeOneHand:
    case MW_WEAPON_TYPE.BluntOneHand: case MW_WEAPON_TYPE.AxeOneHand: return 'one';
    case MW_WEAPON_TYPE.LongBladeTwoHand: case MW_WEAPON_TYPE.BluntTwoClose: case MW_WEAPON_TYPE.AxeTwoHand: return 'two';
    case MW_WEAPON_TYPE.BluntTwoWide: return 'wide';
    case MW_WEAPON_TYPE.SpearTwoWide: return 'spear';
    case MW_WEAPON_TYPE.MarksmanBow: case MW_WEAPON_TYPE.MarksmanCrossbow: case MW_WEAPON_TYPE.MarksmanThrown: return 'clip';
    default: return 'free';
  }
}

/** Does the class hold its weapon in BOTH hands (the left on the haft)? Where on the haft (arm lengths along the blade
 *  from the right hand's grip: - toward the pommel, + toward the point) the left hand closes. */
export const TWO_HAND_GRIP = Object.freeze({ two: -0.2, wide: 0.5, spear: 0.55 });

// A row: [flex, abduct, elbow, twist] degrees, `swing` the share of the gait's arm swing, `blade`/`edge` the weapon's
// ways in the chest frame (right arm), `gaitElbow` how much of the gait's own elbow it rides. `grip: true` - the LEFT
// arm closes on the right's haft; `mirror` - the left arm holds a pair's left blade as the right holds its own.
const row = (flex, abduct, elbow, twist, swing, extra = {}) => Object.freeze({ flex, abduct, elbow, twist, swing, ...extra });
const dir = (...v) => Object.freeze(norm(v));

/**
 * THE ROWS: CARRY[class][gait] = { R, L } (gaits: idle, walk, run, sneak - blended by the gait's own shares), plus a
 * class's STANDING FEET (`feet`, legs: [right, forward] added to each foot; `hipYaw`, degrees; `lean`) - a fighting
 * stance's split feet, laid only while the body stands. Tuned on the retail biped through tools/bodyMotionSheet.mjs;
 * one frozen table, for Mac to move on his own data.
 */
export const CARRY = Object.freeze({
  free: Object.freeze({
    idle: { R: row(3, 7, 10, 4, 0), L: row(3, 7, 10, 4, 0) },
    walk: { R: row(2, 8, 12, 6, 1, { gaitElbow: 1 }), L: row(2, 8, 12, 6, 1, { gaitElbow: 1 }) },
    run: { R: row(8, 10, 0, 22, 1, { gaitElbow: 1 }), L: row(8, 10, 0, 22, 1, { gaitElbow: 1 }) },
    sneak: { R: row(14, 16, 40, 10, 0.6), L: row(14, 16, 40, 10, 0.6) },
  }),
  one: Object.freeze({
    idle: { R: row(8, 21, 16, -8, 0, { blade: dir(0.3, 0.72, -0.62), edge: dir(0, 0.2, -1) }), L: row(3, 8, 12, 4, 0) },
    walk: { R: row(8, 22, 18, -8, 0.3, { blade: dir(0.3, 0.74, -0.6), edge: dir(0, 0.2, -1) }), L: row(2, 8, 12, 6, 1, { gaitElbow: 1 }) },
    run: { R: row(2, 25, 24, -12, 0.35, { blade: dir(0.32, -0.42, -0.85), edge: dir(0, 0.6, -1) }), L: row(8, 10, 0, 22, 1, { gaitElbow: 1 }) },
    sneak: { R: row(24, 18, 46, 4, 0.2, { blade: dir(0.15, 0.95, -0.25), edge: dir(0, 0, -1) }), L: row(14, 16, 40, 10, 0.6) },
    stand: { feet: { L: [0, 0.05], R: [0.02, -0.03] }, hipYaw: -6 },
  }),
  two: Object.freeze({
    idle: { R: row(30, 6, 44, 30, 0, { blade: dir(-0.3, 0.82, -0.48), edge: dir(0, 0.35, -1) }), L: row(0, 0, 0, 0, 0, { grip: true }) },
    walk: { R: row(30, 6, 44, 30, 0.12, { blade: dir(-0.3, 0.82, -0.48), edge: dir(0, 0.35, -1) }), L: row(0, 0, 0, 0, 0, { grip: true }) },
    run: { R: row(-14, 18, 20, -6, 0.12, { blade: dir(0.18, -0.84, -0.52), edge: dir(0, 0.5, -1) }), L: row(8, 10, 0, 22, 1, { gaitElbow: 1 }) },
    sneak: { R: row(34, 8, 50, 30, 0.1, { blade: dir(-0.25, 0.88, -0.4), edge: dir(0, 0.35, -1) }), L: row(0, 0, 0, 0, 0, { grip: true }) },
    stand: { feet: { L: [-0.02, 0.15], R: [0.04, -0.09] }, hipYaw: -16, lean: 3 },
  }),
  wide: Object.freeze({
    idle: { R: row(18, 10, 50, 34, 0, { blade: dir(-0.55, 0.42, 0.72), edge: dir(0, 1, 0) }), L: row(0, 0, 0, 0, 0, { grip: true }) },
    walk: { R: row(18, 10, 50, 34, 0.12, { blade: dir(-0.55, 0.42, 0.72), edge: dir(0, 1, 0) }), L: row(0, 0, 0, 0, 0, { grip: true }) },
    run: { R: row(-8, 16, 26, -4, 0.2, { blade: dir(0.18, -0.86, -0.48), edge: dir(0, 0.5, -1) }), L: row(8, 10, 0, 22, 1, { gaitElbow: 1 }) },
    sneak: { R: row(22, 10, 56, 34, 0.1, { blade: dir(-0.5, 0.55, 0.65), edge: dir(0, 1, 0) }), L: row(0, 0, 0, 0, 0, { grip: true }) },
    stand: { feet: { L: [-0.02, 0.12], R: [0.04, -0.07] }, hipYaw: -12, lean: 2 },
  }),
  spear: Object.freeze({
    idle: { R: row(10, 12, 40, 14, 0, { blade: dir(-0.12, 0.9, 0.4), edge: dir(0, 0, -1) }), L: row(0, 0, 0, 0, 0, { grip: true }) },
    walk: { R: row(10, 12, 40, 14, 0.12, { blade: dir(-0.12, 0.9, 0.4), edge: dir(0, 0, -1) }), L: row(0, 0, 0, 0, 0, { grip: true }) },
    run: { R: row(-4, 16, 34, 0, 0.2, { blade: dir(0.06, 0.94, -0.32), edge: dir(0, 0, -1) }), L: row(8, 10, 0, 22, 1, { gaitElbow: 1 }) },
    sneak: { R: row(14, 12, 46, 14, 0.1, { blade: dir(-0.1, 0.96, 0.25), edge: dir(0, 0, -1) }), L: row(0, 0, 0, 0, 0, { grip: true }) },
    stand: { feet: { L: [-0.02, 0.14], R: [0.04, -0.08] }, hipYaw: -14, lean: 2 },
  }),
  dual: Object.freeze({
    idle: { R: row(8, 23, 16, -8, 0, { blade: dir(0.34, 0.7, -0.62), edge: dir(0, 0.2, -1) }), L: row(8, 23, 16, -8, 0, { blade: dir(0.34, 0.7, -0.62), edge: dir(0, 0.2, -1), mirror: true }) },
    walk: { R: row(8, 24, 18, -8, 0.28, { blade: dir(0.34, 0.72, -0.6), edge: dir(0, 0.2, -1) }), L: row(8, 24, 18, -8, 0.28, { blade: dir(0.34, 0.72, -0.6), edge: dir(0, 0.2, -1), mirror: true }) },
    run: { R: row(-46, 16, 12, -10, 0.1, { blade: dir(0.3, -0.92, 0.25), edge: dir(0, 0, -1) }), L: row(-46, 16, 12, -10, 0.1, { blade: dir(0.3, -0.92, 0.25), edge: dir(0, 0, -1), mirror: true }) },
    sneak: { R: row(22, 18, 44, 4, 0.15, { blade: dir(0.2, 0.94, -0.25), edge: dir(0, 0, -1) }), L: row(22, 18, 44, 4, 0.15, { blade: dir(0.2, 0.94, -0.25), edge: dir(0, 0, -1), mirror: true }) },
    stand: { feet: { L: [-0.03, 0.06], R: [0.03, -0.04] }, hipYaw: -4 },
    runLean: 7,
  }),
  fists: Object.freeze({
    idle: { R: row(34, 20, 118, 12, 0, { fist: true }), L: row(48, 18, 104, 10, 0, { fist: true }) },
    walk: { R: row(34, 20, 116, 12, 0.1, { fist: true }), L: row(48, 18, 102, 10, 0.1, { fist: true }) },
    run: { R: row(14, 12, 20, 24, 1, { fist: true, gaitElbow: 1 }), L: row(14, 12, 20, 24, 1, { fist: true, gaitElbow: 1 }) },
    sneak: { R: row(36, 20, 112, 12, 0.1, { fist: true }), L: row(46, 18, 100, 10, 0.1, { fist: true }) },
    stand: { feet: { L: [0, 0.16], R: [0.03, -0.08] }, hipYaw: -18, lean: 4 },
  }),
});

/** The gait's four shares (idle, walk, run, sneak) - summing to one. */
export function gaitShares(gp) {
  const m = clamp01(gp.move), sn = clamp01(gp.sneak), rn = clamp01(gp.run);
  const sneak = sn;
  const moving = (1 - sn) * m;
  return { idle: (1 - sn) * (1 - m), walk: moving * (1 - rn), run: moving * rn, sneak };
}

/** A class's arm row for one side at the gait's shares: angles blended, ways blended and squared. */
export function blendRow(cls, side, shares) {
  const table = CARRY[cls] ?? CARRY.free;
  const out = { flex: 0, abduct: 0, elbow: 0, twist: 0, swing: 0, gaitElbow: 0, blade: null, edge: null, grip: false, fist: false, mirror: false };
  let bw = 0;
  const blade = [0, 0, 0], edge = [0, 0, 0];
  for (const g of ['idle', 'walk', 'run', 'sneak']) {
    const k = shares[g];
    if (!(k > 0)) continue;
    const r = table[g][side];
    out.flex += r.flex * k; out.abduct += r.abduct * k; out.elbow += r.elbow * k; out.twist += r.twist * k;
    out.swing += r.swing * k; out.gaitElbow += (r.gaitElbow ?? 0) * k;
    if (r.blade) { bw += k; for (let i = 0; i < 3; i++) { blade[i] += r.blade[i] * k; edge[i] += r.edge[i] * k; } }
    if (r.grip && k >= 0.5) out.grip = true;
    if (r.fist) out.fist = true;
    if (r.mirror) out.mirror = true;
  }
  if (bw > 0) { out.blade = norm(blade); out.edge = norm(edge); }
  return out;
}

/**
 * THE ARM BY ITS ANGLES: the wrist, elbow and the free hand's ways for `side`, off the shoulder `S` on the chest frame
 * `F` ({ right, fwd, up }), the upper arm `a` and the forearm `b` long. Flexion turns the hanging arm forward about the
 * chest's right, abduction out about its forward, the twist turns the forearm toward the middle about the upper arm,
 * and the elbow bends the forearm forward about the hinge the shoulder carried. Pure - pinned against the joints'
 * own geometry.
 */
export function armByAngles(side, S, F, a, b, { flex = 0, abduct = 0, elbow = 0, twist = 0 }) {
  const sgn = side === 'R' ? 1 : -1;
  const down = scale(F.up, -1);
  const Rf = rotAxisAngle(F.right, flex * RAD);
  const Ra = rotAxisAngle(F.fwd, -sgn * abduct * RAD);
  const upper = apply(Ra, apply(Rf, down));
  let hinge = apply(Ra, apply(Rf, F.right));
  hinge = apply(rotAxisAngle(scale(upper, -1), sgn * twist * RAD), hinge);
  const fore = apply(rotAxisAngle(hinge, Math.max(0, elbow) * RAD), upper);
  const E = add(S, scale(upper, a)), W = add(E, scale(fore, b));
  const sw = sub(W, S);
  const ls = len(sw);
  const along = ls > 1e-9 ? scale(sw, dot(sub(E, S), sw) / (ls * ls)) : [0, 0, 0];
  const pole = norm(sub(sub(E, S), along));
  return { wrist: W, elbow: E, upper, fore, hinge, pole: len(pole) > 0.5 ? pole : norm(scale(F.fwd, -1)) };
}

/** The free hand's ways: the fingers on along the forearm (a fist's knuckles up its own way), the palm in toward the
 *  body's middle - squared against the fingers. */
function freeHand(side, arm, F, fist) {
  const sgn = side === 'R' ? 1 : -1;
  const fingers = fist ? norm(add(arm.fore, scale(F.fwd, 0.15))) : norm(add(arm.fore, scale(F.fwd, 0.08)));
  const inward = scale(F.right, -sgn);
  const palm = norm(sub(inward, scale(fingers, dot(inward, fingers))));
  return { fingers, palm };
}

/** The gait's own swing on a row: the flexion's swing (+ forward for the right arm at the left foot's strike), the
 *  elbow's wave (more bent swinging forward) where the row rides the gait's elbow. */
function withSwing(side, r, gp) {
  const sgn = side === 'R' ? 1 : -1;
  const swing = (gp.arm.swing ?? 0) * sgn * r.swing;   // radians
  const fwdShare = (Math.cos(2 * Math.PI * gp.arm.phase) * sgn + 1) / 2;   // 1 swung forward, 0 back
  const gaitElbow = lerp(gp.arm.elbow[0], gp.arm.elbow[1], fwdShare);
  const k = clamp01(r.gaitElbow);
  return {
    ...r,
    flex: r.flex + swing / RAD + (gp.arm.bias / RAD) * r.swing,
    elbow: lerp(r.elbow, gaitElbow, k),
    abduct: lerp(r.abduct, gp.arm.abduct / RAD, k),
    twist: r.twist + (gp.arm.cross ?? 0) * 60 * k * fwdShare,
  };
}

/** Mirror a hand request across the plane through `C` with normal `n`: the point and every way. */
export function mirrorRequest(h, C, n) {
  if (!h) return null;
  const pt = (p) => add(C, reflect(sub(p, C), n));
  return { ...h, at: pt(h.at), fingers: h.fingers && reflect(h.fingers, n), palm: h.palm && reflect(h.palm, n), pole: h.pole && reflect(h.pole, n) };
}

/** The left hand on the right's haft: the right hand's request reflected across the blade's own plane (the left hand
 *  closes from the other side of it), moved `along` arm lengths up the blade. */
export function hafHand(rightReq, rightGrip, Rblade, along, arm) {
  if (!rightReq) return null;
  const b = norm(Rblade.blade), n = norm(Rblade.flat);
  const grip = add(rightGrip, scale(b, along * arm));
  const req = mirrorRequest(rightReq, rightGrip, n);
  return { ...req, at: add(req.at, sub(grip, rightGrip)) };
}

/**
 * THE CARRY'S HANDS this frame: { L, R } climb hand requests (or null where the clip keeps the arm), for the class
 * `cls` at the gait `gp`, on the frame the trunk now stands in (`ctx` - bodySolve.js's: body, mats, frames). `wb`,
 * `wbL` the Weapon Bones. A weapon row turns the hand so the blade stands as the row says; the left of a pair is its
 * right's mirror across the chest's middle; a two-handed class's left closes on the haft. Pure.
 */
export function carryHands(cls, gp, ctx, { armW = { L: 1, R: 1 } } = {}) {
  if (cls === 'clip') return { L: null, R: null };
  const { body, mats, frames } = ctx;
  const F = { right: frames.right, fwd: frames.fwd, up: frames.up };
  const shares = gaitShares(gp);
  const out = { L: null, R: null, grip: { L: null, R: null } };
  const C = scale(add(frames.shoulder.L, frames.shoulder.R), 0.5);
  for (const side of ['R', 'L']) {
    if (!(armW[side] > 0)) continue;
    const r = withSwing(side, blendRow(cls, side, shares), gp);
    if (r.grip) continue;   // the haft's hand, after the right
    const S = frames.shoulder[side];
    const limb = body.bones[side];
    const a = len(sub(at(mats, limb.fore), at(mats, limb.upper))), b = len(sub(at(mats, limb.hand), at(mats, limb.fore)));
    if (r.blade && r.mirror && side === 'L') {
      // the pair's left: the right's own request for the mirrored arm, reflected back across the chest's middle
      const arm = armByAngles('R', add(C, reflect(sub(S, C), F.right)), F, a, b, r);
      const req = gripRequest(mats, body, 'R', body.wb, { wrist: arm.wrist, blade: inFrame(frames.chest, r.blade), edge: inFrame(frames.chest, r.edge), pole: arm.pole, w: armW.L });
      out.L = req && mirrorRequest(req, C, F.right);
      continue;
    }
    const arm = armByAngles(side, S, F, a, b, r);
    if (r.blade && side === 'R') {
      const req = gripRequest(mats, body, 'R', body.wb, { wrist: arm.wrist, blade: inFrame(frames.chest, r.blade), edge: inFrame(frames.chest, r.edge), pole: arm.pole, w: armW.R });
      out.R = req;
      if (req) out.grip.R = req.grip;
      continue;
    }
    const hand = freeHand(side, arm, F, r.fist);
    out[side] = { at: arm.wrist, fingers: hand.fingers, palm: hand.palm, pole: arm.pole, w: armW[side] };
  }
  const lRow = blendRow(cls, 'L', shares);
  if (lRow.grip && out.R && out.grip.R && TWO_HAND_GRIP[cls] != null && armW.L > 0) {
    out.L = hafHand(out.R, out.grip.R, out.R.frame, TWO_HAND_GRIP[cls], body.arm);
    if (out.L) {
      out.L.w = armW.L;
      out.L.pole = norm(add(scale(F.right, -0.55), add(scale(F.up, -0.75), scale(F.fwd, -0.2))));
    }
  }
  return out;
}

const at = (mats, ref) => mats.get(ref)?.t ?? [0, 0, 0];
