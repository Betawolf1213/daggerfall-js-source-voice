// @ts-check
// BODY-MOTION (2026-10-18, Mac: "I want to build improved animations for the morrowind rig (3rd person)" - "Improved
// running/walking for all races", "Weapon specific walking/running animations", "Improved melee 3rd person attack
// animations", "I want to be as detailed as possible. No band aids"; bible/04-Characters/Body-Motion.md) - THE BODY'S
// MOTION, ONE PER RIG. The Morrowind body in third person walks, runs, creeps, stands, carries what is in its hands and
// strikes with its whole body - the gait (gait.js), the carry (carry.js) and the blows (melee.js) joined into one request
// and solved on the skeleton over the clip's pose (bodySolve.js), through poseAssembly's `motion` slot
// (formats/morrowind/mwFirstPerson.js) - under the climb, the seat and the long gun's hold, which still win the bones
// they ask for.
//
// THE CLIP IS NOT THROWN AWAY. The clip machine (combat/fpArm.js) still runs every group and still decides everything a
// group decides - the draw and the sheathe, a cast, a bow's draw and loose, the hit recoil, the death, the jump, the
// swim - and the body's motion steps aside for each (the arms for the first four, the whole body for the rest), easing
// out and back in. What it takes over is what the clips did worst in third person: the legs (a walk played at twice its
// cadence slid every foot), the trunk, the arms' carry, and a blow's body (the attack clip took every bone, so the legs
// froze mid-stride - the recorded gap of Morrowind-Rules.md's rule 26, closed here: the legs keep the gait under a blow).
//
// A rig's motion is its own instance (the player's, each peer's, each person's - net/peer/peerBodies.js builds their
// rigs through the same createFpArm), stepped by the rig's own update every frame (`step`, its clocks - a frame that does
// not pose still walks) and laid on the pose on the frames that pose (`apply`). The switch is the viewer's (`on`):
// systems/features.js 'mw-body-motion' - off, the body moves as Morrowind's clips move it.

import { MW_WEAPON_TYPE, MW_UNITS_PER_METER } from '../../formats/morrowind/mwFirstPerson.js';
import { getPref } from '../../systems/uiPrefs.js';
import { algebra, ease, RAD, bodyOf, bodyKindOf } from './bodyKit.js';
import { createGaitState, stepGait, gaitPose } from './gait.js';
import { carryClassOf, carryHands, CARRY, TWO_HAND_GRIP, armByAngles, mirrorRequest, hafHand } from './carry.js';
import { meleeFamilyOf, blowName, blowU, blowPose, windFor } from './melee.js';
import { solveBody, gripRequest } from './bodySolve.js';

const { add, scale, sub, norm, len, lerp, lerp3 } = algebra;

/** THE EASES (seconds): the layer on and off (off quicker - a recoil or a death takes the body at once), the arms on and
 *  off (a draw, a cast, a torch lit), and a change of carry class (a weapon drawn, a pair raised). */
export const MOTION_EASE = Object.freeze({ in: 0.14, out: 0.1, outFast: 0.05, armIn: 0.12, armOut: 0.07, cls: 0.14 });

/** The blade's length (MW units) each class draws on the contact sheets - the sheet's alone; the rig draws the mesh. */
const SHEET_BLADE = Object.freeze({ one: 58, two: 88, wide: 112, spear: 120, dual: 54 });

/**
 * The frame's word, in full (the rig builds it - combat/fpArm.js - and the contact sheets and pins through
 * `sceneInput`):
 *   on (the switch, third person, a biped the layer knows), kind (bodyKit.js bodyKindOf), busy (a reason the whole
 *   body is the clip's: 'climb', 'seat', 'dead', 'hit', or null);
 *   speed (m/s), forward, strafe, running, sneaking, grounded, swimming, levitating, yaw (radians);
 *   height, weight (the race's scale);
 *   mwType, shown (the weapon in the hand), hands ('single' | 'dual' | 'fists'), torch (the left hand's light), spell
 *   (a readied spell or a cast), equip (a draw or a sheathe in the hands), rifle (the long gun's hold has the hands);
 *   blow - { type, reversed, hand, section, progress, strength } while a melee blow is in the machine, else null.
 */
export function sceneInput({
  forward = 0, strafe = 0, speed = 0, running = false, sneaking = false, yaw = 0, grounded = true,
  weapon = MW_WEAPON_TYPE.None, hands = 'single', shown = undefined, blow = null, kind = 'male',
  height = 1, weight = 1, torch = false, spell = false, equip = false, rifle = false, on = true, busy = null,
} = {}) {
  return {
    on, kind, busy, speed, forward, strafe, running, sneaking, grounded, swimming: false, levitating: false, yaw,
    height, weight, mwType: weapon, shown: shown ?? weapon !== MW_WEAPON_TYPE.None, hands, torch, spell, equip, rifle, blow,
  };
}

/** The machine's upper-body state (combat/fpArm.js UPPER_BODY_NAME) as the blow's section. */
const SECTION_OF = Object.freeze({ AttackWindUp: 'windup', AttackRelease: 'release', AttackEnd: 'follow' });

/**
 * THE RIG'S WORD, made from its own state each frame (combat/fpArm.js update - the one place it is read, so a peer's
 * body and a person's take it exactly as the player's): `cam` the frame's camera bag (its `move`, `yaw`, `sneaking`,
 * `climb`, `seat`, `saddle`), `third` the body drawn in third person, `rig` the third-person build (its skeleton's
 * path, its weapon type), `built` the rig's (its race's scale, a werewolf's or a creature's body), `dead`, `hit` (a
 * recoil in the clip), `climb` the climb's weight, `upper` the upper body's state by name, the blow's `attackType`,
 * `reversed` and `hand` and its section's `progress` and `strength`, `shown` the weapon in the hand, `hands` how the
 * hands are held (TWO-HANDS), `torch` the left hand's light, `spell` a spell readied or cast, `rifle` the long gun's
 * hold weight. The switch is systems/features.js 'mw-body-motion' (the viewer's - how this machine draws a body).
 */
export function motionWord({
  cam = null, third = false, rig = null, built = null, dead = false, hit = false, climb = 0, upper = 'None',
  attackType = null, reversed = false, hand = null, progress = 0, strength = 1, shown = false, hands = 'single',
  torch = false, spell = false, rifle = 0,
} = {}) {
  const mv = (cam && cam.move) || {};
  const kind = bodyKindOf(rig?.settingsSkeleton);
  const on = !!third && !!kind && !!rig?.ok && !built?.creature && !built?.werewolf && getPref('mwBodyMotion') !== false;
  const busy = dead ? 'dead' : hit ? 'hit' : climb > 0.02 || cam?.climb ? 'climb' : cam?.seat || cam?.saddle ? 'seat' : null;
  const section = SECTION_OF[upper] ?? null;
  return {
    on, kind, busy,
    speed: Number(mv.speed) || 0, forward: Number(mv.forward) || 0, strafe: Number(mv.strafe) || 0, running: !!mv.running,
    sneaking: !!cam?.sneaking, grounded: mv.grounded !== false, swimming: !!mv.swimming, levitating: !!mv.levitating,
    yaw: Number(cam?.yaw) || 0, height: built?.raceScale?.height ?? 1, weight: built?.raceScale?.weight ?? 1,
    mwType: rig?.mwType ?? MW_WEAPON_TYPE.None, shown: !!shown, hands, torch: !!torch, spell: !!spell,
    equip: upper === 'Equipping' || upper === 'Unequipping', rifle: rifle > 0.01,
    blow: section && attackType ? { type: attackType, reversed: !!reversed, hand, section, progress, strength } : null,
  };
}

/** Blend two climb hand requests by `t` (positions on the line, ways on the arc - squared after). */
function blendHand(a, b, t) {
  if (!a) return b && t > 0 ? { ...b, w: (b.w ?? 1) * t } : null;
  if (!b || !(t > 0)) return a;
  if (t >= 1) return b;
  const way = (p, q) => (p && q ? norm(lerp3(p, q, t)) : (q ?? p));
  return {
    ...a, at: lerp3(a.at, b.at, t), fingers: way(a.fingers, b.fingers), palm: way(a.palm, b.palm), pole: way(a.pole, b.pole),
    w: lerp(a.w ?? 1, b.w ?? 1, t),
  };
}

export function createBodyMotion() {
  const gait = createGaitState();
  let input = sceneInput({ on: false });
  let w = 0;
  const armW = { L: 0, R: 0 };
  let cls = 'free', clsFrom = null, clsMix = 1;
  let body = null;
  let last = null;
  let wasOn = false;
  const gaitInput = () => ({
    speed: input.speed, forward: input.forward, strafe: input.strafe, running: input.running, sneaking: input.sneaking,
    yaw: input.yaw, grounded: input.grounded, kind: input.kind,
    legM: body ? (body.leg * (input.height || 1)) / MW_UNITS_PER_METER : 1,
    unitsPerM: MW_UNITS_PER_METER / (input.weight || 1),
  });
  /** The blow the machine is in, as the choreography reads it - or null. */
  const blowNow = () => {
    const b = input.blow;
    if (!b || !b.section) return null;
    const family = meleeFamilyOf(cls);
    if (!family || (b.type !== 'chop' && b.type !== 'slash' && b.type !== 'thrust')) return null;
    const side = b.hand === 'L' ? 'L' : 'R';
    const bp = blowPose(family, blowName(b.type, b.reversed), blowU(b.section, b.progress), side);
    if (!bp) return null;
    return { ...bp, family, wind: windFor(b.strength) };
  };

  /** THE HANDS on the trunk that now stands: the carry's (the class it is changing to eased over the one it leaves),
   *  a blow's over them. Exposed for the pins. */
  function handsFor(ctx, gp, bp) {
    let hands = carryHands(cls, gp, ctx, { armW });
    if (clsFrom && clsMix < 1) {
      const from = carryHands(clsFrom, gp, ctx, { armW });
      hands = { L: blendHand(from.L, hands.L, clsMix), R: blendHand(from.R, hands.R, clsMix) };
    }
    if (!bp || !(bp.w > 0)) return hands;
    const strike = blowHands(bp, cls, ctx, armW);
    return { L: blendHand(hands.L, strike.L, bp.w * (strike.L ? 1 : 0)), R: blendHand(hands.R, strike.R, bp.w * (strike.R ? 1 : 0)) };
  }

  const motion = {
    /** THE CLOCKS, every frame (posed or not): the gait, the layer's weight, the arms', the carry class. */
    step(dt, frame) {
      input = frame ?? sceneInput({ on: false });
      // switched on (third person again, the switch thrown): the heading re-anchored - the last one it saw may be a
      // minute old, and read as one frame's turn it would bank the body and twist the feet
      if (input.on && !wasOn) { gait.yaw = null; gait.yawRate = 0; }
      wasOn = !!input.on;
      const free = !!input.on && !input.busy && input.grounded !== false && !input.swimming && !input.levitating;
      w = ease(w, free ? 1 : 0, free ? MOTION_EASE.in : (input.busy === 'dead' || input.busy === 'hit' ? MOTION_EASE.outFast : MOTION_EASE.out), dt);
      if (!free && w < 1e-3) w = 0;
      const next = carryClassOf(input);
      if (next !== cls) { clsFrom = cls; cls = next; clsMix = 0; }
      clsMix = ease(clsMix, 1, MOTION_EASE.cls, dt);
      if (clsMix > 0.999) { clsMix = 1; clsFrom = null; }
      const hands = !input.equip && !input.rifle && cls !== 'clip';
      for (const side of ['L', 'R']) {
        const want = hands && !(side === 'L' && input.torch) ? 1 : 0;
        armW[side] = ease(armW[side], want, want ? MOTION_EASE.armIn : MOTION_EASE.armOut, dt);
        if (!want && armW[side] < 1e-3) armW[side] = 0;
      }
      if (input.on && body) stepGait(gait, gaitInput(), body, dt);
      return w;
    },
    /** THE POSE: the request solved on the skeleton over the clip's (poseAssembly's `motion` slot). */
    apply(skeleton, pose, rootRef, skelMats) {
      if (!(w > 1e-3)) { last = null; return null; }
      const measured = bodyOf(skeleton, rootRef, skelMats);
      if (!measured) { last = null; return null; }
      if (body !== measured) { body = measured; stepGait(gait, gaitInput(), body, 0); }
      const gi = gaitInput();
      const bp = blowNow();
      const k = bp ? bp.w : 0;
      const wind = bp ? bp.wind * k : 0;
      // the stance's split feet, and a blow's step with the lead foot (the left for a right-hand blow), standing only
      const st = CARRY[cls]?.stand ?? null;
      const stepSide = bp && bp.side === 'L' ? 'R' : 'L';
      const feetOff = { L: st?.feet?.L ?? [0, 0], R: st?.feet?.R ?? [0, 0] };
      if (bp) feetOff[stepSide] = [feetOff[stepSide][0], feetOff[stepSide][1] + bp.step * wind];
      const stance = { feet: feetOff, hipYaw: st?.hipYaw ?? 0, lean: st?.lean ?? 0 };
      const gp = gaitPose(gait, gi, body, stance);
      const L = body.leg;
      const runLean = (CARRY[cls]?.runLean ?? 0) * gp.run * gp.move * RAD;
      const plan = {
        w,
        hip: {
          at: add(gp.hip.at, [0, bp ? bp.shift * L * wind : 0, bp ? -bp.drop * L * wind : 0]),
          yaw: gp.hip.yaw + (bp ? bp.hip * RAD * wind : 0), roll: gp.hip.roll, pitch: gp.hip.pitch,
        },
        chest: {
          yaw: gp.chest.yaw * (1 - k) + (bp ? bp.chest[0] * RAD * wind : 0),
          roll: gp.chest.roll + (bp ? bp.chest[1] * RAD * wind : 0),
          pitch: gp.chest.pitch + runLean + (bp ? bp.chest[2] * RAD * wind : 0),
        },
        head: { yaw: 0, roll: 0, pitch: 0 },
        feet: gp.feet,
        arms: (ctx) => handsFor(ctx, gp, bp),
      };
      const report = solveBody(skeleton, pose, rootRef, skelMats, plan);
      last = { gp, bp, report };
      return report;
    },
    hands: handsFor,
    /** poseAssembly's `motion` slot (formats/morrowind/mwFirstPerson.js): the request laid on this frame's skeleton. */
    slot: (skeleton, pose, rootRef, skelMats) => motion.apply(skeleton, pose, rootRef, skelMats),
    /** The layer's weight now (0 the clip's body, 1 the motion's). */
    weight: () => w,
    /** The gait's stride phase (0..1) and its weight - what a swinging hip lantern follows. */
    stride: () => ({ phase: gait.phase, move: gait.move * w }),
    /** The debug card's line and the sheets' blades. */
    status() {
      const gp = last?.gp;
      const mode = !gp ? 'off' : gp.sneak > 0.5 ? 'sneak' : gp.move < 0.5 ? 'stand' : gp.run > 0.5 ? 'run' : 'walk';
      return {
        w, cls, mode, phase: gait.phase, speed: gait.speed, psi: gait.psi, back: gait.back, bank: gait.bank, stepping: gait.step ? gait.step.side : null,
        blow: last?.bp ? `${last.bp.family} u=${last.bp.u.toFixed(2)}` : null,
        label: `${cls} ${mode}${last?.bp ? ` u${last.bp.u.toFixed(2)}` : ` psi${(gait.psi / RAD).toFixed(0)}`}`,
        blade: SHEET_BLADE[cls] ? { R: SHEET_BLADE[cls], L: cls === 'dual' ? SHEET_BLADE[cls] : null } : {},
      };
    },
    reset() { Object.assign(gait, createGaitState()); w = 0; armW.L = 0; armW.R = 0; cls = 'free'; clsFrom = null; clsMix = 1; last = null; },
  };
  return motion;
}

/**
 * A BLOW'S HANDS: the striking hand where the choreography puts its grip (or its fist), the weapon turned so its blade
 * and edge stand as the key says; a two-hander's left closing on the haft; a one-hander's free arm thrown back as the
 * counterweight; a pair's other blade and a guard's other fist kept where the carry holds them (null - the carry's).
 * A left-hand blow is solved as the right hand's mirror and reflected across the body's middle (the left hand and its
 * Weapon Bone Left are the right's mirror - combat/twoHands/mirrorRig.js).
 */
function blowHands(bp, cls, ctx, armW) {
  const { body, mats, frames } = ctx;
  const C = scale(add(frames.shoulder.L, frames.shoulder.R), 0.5);
  const A = body.arm;
  const X = [1, 0, 0];
  const right = (v) => (v ? [v[0] * (bp.side === 'L' ? -1 : 1), v[1], v[2]] : null);   // the key back on the right hand
  const gripR = add(C, scale(right(bp.grip), A));
  const out = { L: null, R: null };
  const poleR = norm([0.55, -0.25, -0.65]);
  let req = null;
  if (bp.family === 'fists') {
    req = { at: gripR, fingers: right(bp.fingers), palm: right(bp.palm), pole: poleR, w: 1 };
  } else {
    req = gripRequest(mats, body, 'R', body.wb, { grip: gripR, blade: right(bp.blade), edge: right(bp.edge), pole: poleR, w: 1 });
  }
  if (!req) return out;
  const strike = bp.side === 'L' ? mirrorRequest(req, C, X) : req;
  out[bp.side] = { ...strike, w: armW[bp.side] };
  const other = bp.side === 'L' ? 'R' : 'L';
  if (bp.family === 'two' && TWO_HAND_GRIP[cls] != null && req.frame) {
    const haf = hafHand(req, req.grip, req.frame, TWO_HAND_GRIP[cls], A);
    if (haf) out.L = { ...haf, w: armW.L, pole: norm([-0.55, -0.2, -0.75]) };
  } else if (bp.family === 'one' && cls === 'one' && bp.off) {
    const F = { right: frames.right, fwd: frames.fwd, up: frames.up };
    const limb = body.bones[other];
    const a = len(sub(mats.get(limb.fore).t, mats.get(limb.upper).t)), b = len(sub(mats.get(limb.hand).t, mats.get(limb.fore).t));
    const arm = armByAngles(other, frames.shoulder[other], F, a, b, { flex: bp.off[0], abduct: bp.off[1], elbow: bp.off[2], twist: 6 });
    const inward = scale(F.right, other === 'R' ? -1 : 1);
    out[other] = { at: arm.wrist, fingers: norm(arm.fore), palm: norm(inward), pole: arm.pole, w: armW[other] };
  }
  return out;
}
