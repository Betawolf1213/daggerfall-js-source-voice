// @ts-check
// TWO-HANDS (2026-10-16, Mac: "Duel wielding and bare hand improvements" - "When bare handed, the fist should be
// mirrored on the other side of the screen (like 2 hands). Attacking should utilize both hands in a detailed way",
// "When bare handed, or with nothing equipped, sprinting should show the hands in a running motion", "Weapons should
// now be able to be duel wielded instead of using a hand swap. With 2 weapons equipped, both weapons can be seen and
// animated in view", "With duel wielding, we need to balance this to not be overpowered and make sense"). THE LAW OF THE
// TWO HANDS. Design and record: bible/05-Combat/Two-Hands.md.
//
// DFU is the reference and has none of this: WeaponManager fights with ONE hand at a time - `usingRightHand`, flipped by
// ToggleHand (WeaponManager.cs:702-729) - and FPSWeapon draws one sprite, mirrored only for a left-handed player
// (FlipHorizontal, FPSWeapon.cs:378). What this module departs from, and why, is Port-Ledger section A (TWO-HANDS).
//
// Pure: no renderer, no clock but the `dt` and the times it is handed, no read of the settings or the equip table - the
// callers hand it each hand's item already described (`{ item, type, hands, shield }`: the item, DFU's WeaponTypes for
// it, its ItemHands, whether it is a shield). Both lanes read it - the sprite's (combat/twoHands.js) and the Morrowind
// arms' (combat/fpArm.js) - and the swing's (combat/playerWeapon.js), so one law says which hand strikes and what it
// costs, whichever picture is on the screen.

import { swingHeft } from '../characters/weaponStates.js';   // SWING-LAW's heft, the one home for a weapon's weight against a Strength

/** How the two hands are held. `single` is DFU's: one hand fights (the used hand, H switches it) and the other holds a
 *  shield, a bow's other end, nothing, or a weapon waiting for H. `fists` is both hands empty - both fists up. `dual` is
 *  two one-handed weapons, one in each hand - both up, both swinging. */
export const HANDS_MODE = Object.freeze({ Single: 'single', Fists: 'fists', Dual: 'dual' });

/** DFU's WeaponTypes (combat/fpsWeapon.js WEAPON_TYPES - pinned equal; this module is a leaf) a dual pair may hold: the
 *  one-handed melee kinds. Blades, daggers, maces, flails, hammers and axes, plain and magic - whatever of them takes one
 *  hand (`hands`, below, decides that: a flail or a warhammer is two-handed in DFU's table, a custom class may not be).
 *  Never a staff's (two-handed always), a bow's, the bare hand's, a beast's claws or the port's own gun. */
export const DUAL_TYPES = Object.freeze([0, 1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
/** ItemHands.Both (characters/equipTable.js ITEM_HANDS - pinned equal). */
const HANDS_BOTH = 4;

/**
 * @typedef {{ item?: any, type?: number, hands?: number, shield?: boolean } | null | undefined} HandDesc
 *   One hand's item as the law reads it: the item (null for an empty hand), its WeaponTypes, its ItemHands, a shield.
 */

/** Can this hand's item be one of a dual pair: a weapon, not a shield, one-handed, of a dual kind. */
export function dualEligible(/** @type {HandDesc} */ h) {
  return !!h?.item && !h.shield && h.hands !== HANDS_BOTH && DUAL_TYPES.includes(/** @type {number} */ (h.type));
}

/**
 * The way the hands are held. A transformed lycanthrope (`claws`) is the beast's - DFU's racial override, one claw
 * sprite (ApplyWeapon's first arm) - and stays single. A light carried in a hand (`leftBusy`: a lit torch or lantern
 * not hung at the waist - Handheld Torches' hand, the Morrowind arm's Shield Bone) takes that hand: one fist beside it,
 * DFU's and the mod's (and a pair never meets one - the mod stows a light when no hand is free). Both hands empty is the
 * fists; a shield is not an empty hand (a fist and a shield, DFU's). Two one-handed weapons are the pair; anything else
 * is DFU's one used hand.
 * @param {{ right?: HandDesc, left?: HandDesc, claws?: boolean, leftBusy?: boolean }} hands
 */
export function handsModeOf({ right = null, left = null, claws = false, leftBusy = false } = {}) {
  if (claws || leftBusy) return HANDS_MODE.Single;
  if (!right?.item && !left?.item) return HANDS_MODE.Fists;
  if (dualEligible(right) && dualEligible(left)) return HANDS_MODE.Dual;
  return HANDS_MODE.Single;
}

/** Both hands up and both swinging - the two modes the second hand is drawn and struck in. */
export const twoHanded = (mode) => mode === HANDS_MODE.Fists || mode === HANDS_MODE.Dual;

/** 'R' or 'L'. */
export const otherHand = (hand) => (hand === 'L' ? 'R' : 'L');

// ---- WHICH HAND STRIKES ---------------------------------------------------------------------------------------------

/** THE FLURRY: a strike begun within this many seconds of the last one ending is the next blow of the same exchange -
 *  the other hand throws it. Past it the hands have settled, and the lead hand opens again. A beat at any Speed: the
 *  swing law's longest frame (SWING_FRAME_MAX, 0.4 s) is half again as long, so a slow fighter's held button still
 *  alternates - a strike begins the moment the last one ends while it is held (WeaponSwingMode 2, the default). */
export const FLURRY_WINDOW = 0.75;

/**
 * The strike about to begin: which hand throws it, whether it is a flurry's (the other hand, straight after a blow), and
 * whether it is the OFF hand's - the hand that is not the lead, in a dual pair (the fists keep DFU's numbers: hand-to-hand
 * was always both fists, CalculateHandToHandAttackDamage reads the skill and not a hand).
 *
 * `lead` is the hand H leads with (`usingRightHand` - DFU's used hand, which ToggleHand still flips: in a pair it is the
 * hand that opens an exchange and carries no off-hand cost). `last` and `sinceLast` are the last strike's hand and the
 * seconds since it ended (Infinity before any).
 * @param {{ mode?: string, lead?: string, last?: string | null, sinceLast?: number }} [s]
 * @returns {{ hand: 'R'|'L', flurry: boolean, off: boolean }}
 */
export function strikeHandOf({ mode = HANDS_MODE.Single, lead = 'R', last = null, sinceLast = Infinity } = {}) {
  const lh = lead === 'L' ? 'L' : 'R';
  if (!twoHanded(mode)) return { hand: lh, flurry: false, off: false };
  const flurry = (last === 'R' || last === 'L') && sinceLast <= FLURRY_WINDOW;
  const hand = flurry ? otherHand(last) : lh;
  const dual = mode === HANDS_MODE.Dual;
  return { hand, flurry: dual && flurry, off: dual && hand !== lh };
}

// ---- THE MIRROR -----------------------------------------------------------------------------------------------------

/** A left hand is a right hand in the mirror. The strike a player asks for keeps its way across the screen: the left
 *  hand's sweep to the RIGHT is the right hand's sweep to the left, mirrored (its forehand), and its sweep to the left the
 *  right hand's backhand mirrored. The straight strikes (down, up) are their own mirror. */
const MIRROR_STRIKE = Object.freeze({
  StrikeLeft: 'StrikeRight', StrikeRight: 'StrikeLeft', StrikeDownLeft: 'StrikeDownRight', StrikeDownRight: 'StrikeDownLeft',
});
export const mirrorStrike = (state) => MIRROR_STRIKE[state] ?? state;

/** The source rect read right to left (FPSWeapon's own mirror, FPSWeapon.cs:381-390). */
export const MIRROR_UV = Object.freeze({ u0: 1, v0: 0, u1: 0, v1: 1 });

/** A screen rect `{ x, y, w, h }` mirrored about the middle of a screen `width` wide starting at `x0`. */
export function mirrorRect(r, width, x0 = 0) {
  return { ...r, x: x0 + (x0 + width) - (r.x + r.w) };
}

/** Is a hand drawn on the LEFT of the screen - and so as a right hand in the mirror: the left hand, unless the player is
 *  left-handed. Controls/Handedness mirrors the WHOLE picture (FPSWeapon.FlipHorizontal): a left-handed player's right
 *  hand is on the left of the screen and their left on the right. A hand of a pair is mirrored whole, every state - DFU's
 *  own flip of its one sprite mirrors three (FPSWeapon.cs:378) because a side strike's art crosses the screen, and a
 *  second hand would cross the first. */
export const handOnLeft = (hand, leftHanded) => (hand === 'L') !== !!leftHanded;

/**
 * THE PAINTED ARM. Which arm Daggerfall painted in each record of the bare hand's art, WEAPON10.CIF, as the screen shows
 * it unflipped: 'R' the arm that comes in from the right of the view, 'L' from the left. Classic Daggerfall threw its
 * hand-to-hand with BOTH fists, by direction - its idle (record 0) and its StrikeDownLeft, StrikeRight and StrikeDownRight
 * records paint the right arm (the light glove, the grey sleeve); its StrikeDown, StrikeLeft and StrikeUp records the left
 * (the dark glove, the brown sleeve with the stitched cuff). Read off the shipped file's frames, record by record (bible/
 * 05-Combat/Two-Hands.md, "The painted arm"); WeaponBasics carries nothing of it (every melee strike aligns Center).
 * Every weapon file paints the right arm alone. Indexed by record.
 */
export const MELEE_PAINTED_ARM = Object.freeze(['R', 'L', 'R', 'L', 'R', 'R', 'L']);

/**
 * THE STRIKE'S PICTURE for one hand of the two: which state's record to draw, and whether in the mirror, so the arm on
 * the screen is the hand that throws the blow, on that hand's own side - and goes the way across the screen the strike
 * asked, wherever the art has it. `painted(state)` answers the side the art paints that state's record from ('R'|'L').
 *   1. the state's own record as painted, when it paints this hand's side - DFU's own picture;
 *   2. else the mirror state's record in the mirror, when that paints the other side: its mirror is this hand, this way;
 *   3. else the art has this hand only the other way across: the mirror state's record as painted (it paints this side).
 * A weapon paints the right arm in every record, so a right hand is always 1 and a left hand always 2 (the mirror of the
 * mirrored strike); the bare hand's two arms take all three.
 * @param {'R'|'L'} hand
 * @param {string} state
 * @param {{ leftHanded?: boolean, painted?: (state: string) => string }} [o]
 * @returns {{ state: string, mirror: boolean }}
 */
export function strikePicture(hand, state, { leftHanded = false, painted = () => 'R' } = {}) {
  const side = handOnLeft(hand, leftHanded) ? 'L' : 'R';
  if (painted(state) === side) return { state, mirror: false };
  const ms = mirrorStrike(state);
  return painted(ms) === side ? { state: ms, mirror: false } : { state: ms, mirror: true };
}

// ---- THE BALANCE (dual wielding) ------------------------------------------------------------------------------------

/**
 * TWO WEAPONS ARE TEMPO, NOT TWICE THE DAMAGE. A pair gives up the shield (its armour - GetShieldArmorValue on the parts
 * it covers) and gets the exchange: the other hand is cocked while one strikes, so a flurry's blows come quicker - and the
 * off hand is the weaker and the less sure one. Every number here is a multiplier or a term on DFU's own: the lead hand's
 * blow is DFU's exactly (CalculateAttackDamage, the swing modifiers, the skill tallied by the weapon in that hand), the
 * off hand's blow is DFU's with the off-hand terms, and a swing never comes quicker than SWING-LAW's floor
 * (SWING_FRAME_MIN), so a fast fighter's pair is held to the cap one weapon is held to.
 *
 * Measured against one weapon (the same weapon, the same skill): at a 65% chance to hit the pair's exchange lands 0.53 of
 * a blow's damage a swing where one weapon lands 0.65, and swings 1.33 times as often - about 9% more damage a second,
 * and 33% more fatigue a second (DFU's per-swing cost, the same each swing). Bought with the shield. A heavy weapon in the
 * off hand gives the quickness back (OFF_WEIGHT below): a dagger is the off hand's natural blade.
 */
export const DUAL = Object.freeze({
  /** A flurry's swing takes this share of its frames' time (either hand, once the exchange has begun). */
  FLURRY_TEMPO: 0.75,
  /** The off hand's blow lands this share of the damage DFU rolls (a landed blow is never less than 1). */
  OFF_DAMAGE: 0.75,
  /** The off hand's to-hit term at Agility 50 - a StrikeDown's own -10 (CalculateSwingModifiers) - eased by the
   *  hand's sureness: a point of it each 10 of Agility past 50, a point worse each 10 under, held in [-15, -5]. */
  OFF_TO_HIT: -10,
  OFF_TO_HIT_PER_AGILITY: 0.1,
  OFF_TO_HIT_MIN: -15,
  OFF_TO_HIT_MAX: -5,
  /** The off arm feels its weapon this much heavier - SWING-LAW's heft read at OFF_WEIGHT times the weight, over the
   *  heft at the weight itself: a dagger (0.5 kg) costs nothing, a longsword (4.5 kg) a tenth of the swing at Strength 50. */
  OFF_WEIGHT: 1.5,
});

/** The off hand's to-hit term at an Agility. */
export function offHandToHit(agility) {
  const a = Number.isFinite(agility) ? agility : 50;
  const t = DUAL.OFF_TO_HIT + Math.round((a - 50) * DUAL.OFF_TO_HIT_PER_AGILITY);
  return Math.max(DUAL.OFF_TO_HIT_MIN, Math.min(DUAL.OFF_TO_HIT_MAX, t));
}

/** The off hand's burden on the swing: SWING-LAW's heft at OFF_WEIGHT times the weapon's weight over its heft at the
 *  weight - 1 for anything light enough that neither arm feels it. */
export function offHandBurden(weightKg, strength) {
  return swingHeft((weightKg || 0) * DUAL.OFF_WEIGHT, strength) / swingHeft(weightKg || 0, strength);
}

/** The factor on a strike's frame time (SWING-LAW's `ctx.tempo`): the flurry's quickness and the off hand's burden. 1 for
 *  every strike that is neither - every single-weapon and every fist strike. */
export function strikeTempo({ flurry = false, off = false, weight = 0, strength = 50 } = {}) {
  return (flurry ? DUAL.FLURRY_TEMPO : 1) * (off ? offHandBurden(weight, strength) : 1);
}

/** The off hand's damage: the rolled damage at OFF_DAMAGE, a miss (0) staying a miss and a landed blow at least 1. */
export function offHandDamage(damage) {
  if (!(damage > 0)) return damage;
  return Math.max(1, Math.round(damage * DUAL.OFF_DAMAGE));
}

// ---- THE GUARD (the hand that is not striking) ----------------------------------------------------------------------

/** While one hand strikes, the other draws in: toward the middle of the view and a little down, the shoulder turned
 *  behind the blow - eased in fast, back out slower (ClimbPose's limb law: no pop between states). Design pixels on DFU's
 *  320x200 surface. The fists' guard is alive at rest: a slow bounce, the two hands out of step. */
export const GUARD = Object.freeze({
  IN: 10,
  DOWN: 9,
  IN_TAU: 0.05,
  OUT_TAU: 0.14,
  BOUNCE_PX: 1.6,
  BOUNCE_HZ: 1.15,
});

/** An exponential follower: `v` toward `target` with time constant `tau` over `dt` (ClimbPose's `ease`). */
export function easeTo(v, target, tau, dt) {
  if (!(tau > 0)) return target;
  return v + (target - v) * (1 - Math.exp(-Math.max(0, dt) / tau));
}

/** The guard's weight this frame, from the last: toward 1 while the OTHER hand strikes. */
export function guardStep(g, otherStriking, dt) {
  return easeTo(g, otherStriking ? 1 : 0, otherStriking ? GUARD.IN_TAU : GUARD.OUT_TAU, dt);
}

/** The guard's offset in design pixels for a hand at weight `g` drawn on `side` ('right'|'left'): x toward the middle,
 *  y down. And the fists' bounce at `time` seconds, out of step between the hands, faded by `bounce` (0..1). */
export function guardOffset(g, side, { time = 0, bounce = 0, hand = 'R' } = {}) {
  const toMid = side === 'left' ? 1 : -1;
  const phase = hand === 'L' ? Math.PI : 0;
  const b = bounce > 0 ? Math.sin(time * 2 * Math.PI * GUARD.BOUNCE_HZ + phase) * GUARD.BOUNCE_PX * bounce : 0;
  return [toMid * GUARD.IN * g, GUARD.DOWN * g + b];
}

// ---- THE RUNNING HANDS ----------------------------------------------------------------------------------------------

/** One footfall every this many metres - PlayerFootsteps.WalkStepInterval (systems/footsteps.js WALK_STEP_INTERVAL,
 *  pinned equal), which DFU's HeadBobber walks its timer by (bobSpeed = WalkStepInterval / 2: PI of its timer a step).
 *  The arms swing one stroke a step, so the hands pump with the feet the camera bobs to. */
export const RUN_STEP_M = 2.5;

/**
 * The pump, in shares of the fist's own drawn size and of the screen (so it reads the same on any canvas):
 *   RISE/DROP - the fist's top of stroke above its guard and bottom below it, of its height (the bottom takes it out of the
 *               view: a running arm's hand passes behind the hip);
 *   IN/OUT    - toward the middle at the top (the arm swings across the chest) and outward at the bottom, of the width;
 *   GROW      - nearer the eye at the top, bigger;
 *   SHAPE     - the stroke's snap: the hand drives up and falls, not a sine's even glide (|sin|^SHAPE);
 *   IN_TAU/OUT_TAU - the hands up as the run begins and away as it ends (CLIMB-HANDS' presence, ClimbPose IN/OUT);
 *   PUNCH_TAU - away at once for a punch thrown on the run (the punch is the fist's own strike);
 *   MIN_SPEED - metres a second over the ground before a run is a run (a run key held standing is not).
 */
export const RUN_PUMP = Object.freeze({
  RISE: 0.42,
  DROP: 1.05,
  IN: 0.085,
  OUT: 0.03,
  GROW: 0.09,
  SHAPE: 0.7,
  IN_TAU: 0.12,
  OUT_TAU: 0.16,
  PUNCH_TAU: 0.04,
  MIN_SPEED: 1.0,
});

/** The stride's phase after running `speed` m/s for `dt`: PI a step, as HeadBobber's timer. */
export function runPhaseStep(phase, speed, dt) {
  const p = phase + Math.max(0, speed || 0) * Math.max(0, dt) * Math.PI / RUN_STEP_M;
  return p % (2 * Math.PI);
}

/** The hands want to run: the body runs on its feet (DFU's run - PlayerMotor's isRunning; not standing, not crouched,
 *  not mounted, not swimming or in the air or on a wall) fast enough over the ground, and the hands hold nothing at all
 *  (`emptyHands`: no weapon and no shield in either hand, no light, no spell, no sheet, no tool) and throw nothing. */
export function runHandsWanted({ running = false, standing = false, grounded = true, crouching = false, riding = false,
  swimming = false, climbing = false, speed = 0, emptyHands = false, attacking = false } = {}) {
  return !!running && !standing && !!grounded && !crouching && !riding && !swimming && !climbing && !attacking
    && !!emptyHands && speed >= RUN_PUMP.MIN_SPEED;
}

/**
 * One hand's place in the pump at stride phase `phase`: `{ dx, dy, scale, s }` - dx a share of the screen's width toward
 * the middle (+), dy a share of the fist's height down (+), scale on the drawn size, `s` the stroke (-1 back .. 1 forward).
 * The right arm swings forward as the left foot falls - the hands out of step by half a stride.
 */
export function pumpOf(phase, hand) {
  const raw = Math.sin(phase + (hand === 'L' ? Math.PI : 0));
  const s = Math.sign(raw) * Math.pow(Math.abs(raw), RUN_PUMP.SHAPE);
  const fwd = Math.max(0, s), back = Math.max(0, -s);
  return { dx: RUN_PUMP.IN * fwd - RUN_PUMP.OUT * back, dy: -RUN_PUMP.RISE * fwd + RUN_PUMP.DROP * back, scale: 1 + RUN_PUMP.GROW * s, s };
}

/**
 * THE MORROWIND ARMS' PUMP - the same stroke on the 3D body (combat/fpArm.js): each hand's place as a point on the
 * picture of the arms' own lens - `x` across from its middle (+ toward the hand's own side), `y` up from it, in shares of
 * the half-frame - and `d` metres out from the eye along that line; the arm reaches it through the climb's solver
 * (combat/climbRig.js), its fist clenched (`CURL` radians, each finger's share), its palm turned in, its elbow out and
 * back. The top of the stroke is the bottom of the picture, toward the middle; the bottom is under the frame - the hand
 * passing the hip. The same stride, the same snap, the same weight as the sprite lane's (pumpOf, runWeightStep).
 */
export const RUN_3D = Object.freeze({
  TOP: Object.freeze({ x: 0.36, y: -0.62, d: 0.42 }),
  BOTTOM: Object.freeze({ x: 0.6, y: -1.7, d: 0.38 }),
  CURL: 1.5,
});
/** One hand's place in the 3D pump at stride phase `phase`: { x, y, d, s } (see RUN_3D; x toward the hand's own side). */
export function pumpTarget3D(phase, hand) {
  const { s } = pumpOf(phase, hand);
  const f = (s + 1) / 2;
  const lerp = (a, b) => a * (1 - f) + b * f;   // exact at both ends of the stroke
  return { x: lerp(RUN_3D.BOTTOM.x, RUN_3D.TOP.x), y: lerp(RUN_3D.BOTTOM.y, RUN_3D.TOP.y), d: lerp(RUN_3D.BOTTOM.d, RUN_3D.TOP.d), s };
}

/** The running weight this frame, from the last: up as a run starts, away as it ends, at once for a punch. */
export function runWeightStep(w, wanted, punching, dt) {
  if (punching) return easeTo(w, 0, RUN_PUMP.PUNCH_TAU, dt);
  return easeTo(w, wanted ? 1 : 0, wanted ? RUN_PUMP.IN_TAU : RUN_PUMP.OUT_TAU, dt);
}
