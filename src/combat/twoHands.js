// TWO-HANDS (2026-10-16): THE SPRITE LANE'S TWO HANDS - both fists up, a pair of weapons, and the hands that run.
// Design and record: bible/05-Combat/Two-Hands.md; the law (which hand strikes, the mirror, the guard, the pump):
// combat/handsLaw.js. Wired by combat/weaponRig.js, the one surface all four hosts mount (THE FOUR HOSTS RULE: world.js,
// exterior.js, worldModes.js and dungeonContext.js each build a rig and carry no line of this).
//
// DFU draws one hand: FPSWeapon's one sprite, and the Weapon Widget clone (weaponWidget.js) in its place. A second hand is
// the same picture in the mirror - THE LEFT HAND IS A RIGHT HAND IN THE MIRROR, as CLIMB-HANDS drew Mac's fist (its
// painting a left hand, mirrored for the right: combat/climbHands.js). So nothing here paints: each hand is placed by the
// very arithmetic the one hand always was (fpsWeaponQuad - FPSWeapon's - or a widget clone, the rig's own for the right
// hand and this module's for the left), as DFU would draw a RIGHT hand, and the hand on the left of the screen is mirrored
// whole about the screen's middle - every state, its strike mapped to its mirror (handsLaw.js mirrorStrike), so a left
// hand's sweep to the right is the right hand's forehand seen in the glass.
//
// THE MACHINE IS ONE. The rig's PlayerWeapon runs DFU's machine and the law gives each strike a hand; each hand here sees
// a VIEW of the machine (`view(hand)`): the strike while it is that hand's, the idle otherwise. A widget clone shadows a
// machine (it plays a strike the machine starts, LateUpdate 0x1b97); handed its hand's view, each clone plays its own
// hand's blows and holds its idle - bob, slide and all - through the other's.
//
// THE GUARD (handsLaw.js GUARD): while one hand strikes the other draws in toward the middle and down, the way the
// climbing hands carry a held hand from one place to the next (ClimbPose's limb law, eased - no pop); the fists' guard is
// alive at rest, the two out of step.
//
// THE RUNNING HANDS (handsLaw.js RUN_PUMP): running with nothing in either hand, the two fists pump with the stride - the right
// forward as the left foot falls, one stroke a step on the head bob's own clock (DFU's HeadBobber walks its timer by the
// footstep interval) - up from where the fists were, or up from below the view when the hands were down, and back when
// the run ends; a punch thrown on the run takes the fist at once. The climbing hands' wall run pumps the same way.

import { createWeaponWidget } from './weaponWidget.js';
import { fpsWeaponQuad, NATIVE_W, NATIVE_H } from './fpsWeapon.js';
import {
  HANDS_MODE, twoHanded, otherHand, mirrorStrike, mirrorRect, MIRROR_UV, handOnLeft,
  guardStep, guardOffset, easeTo, runPhaseStep, pumpOf, runWeightStep,
} from './handsLaw.js';

/** The fists' guard bounce comes and goes over this (the guard alive at rest, gone in a strike or a walk). */
const BOUNCE_TAU = 0.3;
/** Below the view: a hand that comes up for the run from nothing starts this far under the screen's bottom edge, in
 *  its own heights (CLIMB-HANDS' BOTTOM_SLACK - no sleeve shows as it rises). */
const BELOW = 0.15;

/**
 * The component. `deps` are the left hand's clone's (createWeaponWidget's): the audio its swing voices, its miss
 * effects, its environment cast and the settings both clones read. The right hand's clone is the rig's own.
 */
export function createTwoHands({ audio = null, envHit = null, missEffect = null, settings } = {}) {
  /** The left hand's clone. Never flipped by Handedness: a pair's hand is drawn as a right hand and mirrored whole. */
  const offWidget = createWeaponWidget({ audio, envHit, missEffect, settings, handedness: () => false });
  const st = {
    mode: HANDS_MODE.Single, machine: null, strikeHand: null, leftHanded: false, time: 0,
    guard: { R: 0, L: 0 }, bounce: 0,
    run: { w: 0, phase: 0, wanted: false },
  };

  /** A hand's view of the machine: the strike while it is this hand's in a pair - mapped to its mirror when the hand is
   *  on the left of the screen - and the idle otherwise. */
  function view(hand) {
    const mine = () => !!st.machine && twoHanded(st.mode) && st.strikeHand === hand && st.machine.state !== 'Idle';
    return {
      get state() {
        if (!mine()) return 'Idle';
        return handOnLeft(hand, st.leftHanded) ? mirrorStrike(st.machine.state) : st.machine.state;
      },
      get frame() { return mine() ? st.machine.frame : 0; },
      get isBow() { return !!st.machine?.isBow; },
      get isUnarmed() { return !!st.machine?.isUnarmed; },
      get now() { return st.machine?.now ?? 0; },
    };
  }
  const views = Object.freeze({ R: view('R'), L: view('L') });

  /**
   * The frame (the rig's LateUpdate block, after the machine's step):
   *   mode, machine, strike (the strike in flight - PlayerWeapon.strikeInFlight - or null), leftHanded;
   *   run: { wanted, punching, speed } - runHandsWanted's answer, a strike in flight, metres a second over the ground;
   *   standing - the body still (the fists' guard bounces only standing).
   */
  function step(dt, { mode = HANDS_MODE.Single, machine = null, strike = null, leftHanded = false, run = null, standing = false } = {}) {
    const d = Math.max(0, Math.min(0.1, dt || 0));
    st.mode = mode; st.machine = machine; st.leftHanded = !!leftHanded;
    st.strikeHand = strike?.hand ?? null;
    st.time += d;
    const two = twoHanded(mode);
    for (const h of /** @type {const} */ (['R', 'L'])) st.guard[h] = guardStep(st.guard[h], two && st.strikeHand === otherHand(h), d);
    st.bounce = easeTo(st.bounce, mode === HANDS_MODE.Fists && !st.strikeHand && standing ? 1 : 0, BOUNCE_TAU, d);
    const r = run ?? {};
    st.run.wanted = !!r.wanted;
    if (st.run.wanted || st.run.w > 0) st.run.phase = runPhaseStep(st.run.phase, r.speed ?? 0, d);
    st.run.w = runWeightStep(st.run.w, st.run.wanted, !!r.punching, d);
    if (!st.run.wanted && st.run.w < 1e-3) st.run.w = 0;
  }

  /** The guard's offset for a hand in canvas pixels - toward the middle and down, and the fists' bounce - laid on the
   *  hand's picture BEFORE its mirror: every hand is placed as a right hand (on the right of the screen), so its middle
   *  is to its left, and the mirror carries the offset across with the rest of it. */
  function nudge(hand, canvas) {
    const [gx, gy] = guardOffset(st.guard[hand], 'right', { time: st.time, bounce: st.bounce, hand });
    return [gx * canvas.width / NATIVE_W, gy * canvas.height / NATIVE_H];
  }
  const moved = (r, [dx, dy]) => ({ ...r, x: r.x + dx, y: r.y + dy });

  /** The two hands in the order they are drawn: the one striking last, over the other. */
  const drawOrder = () => (st.strikeHand === 'L' ? ['R', 'L'] : ['L', 'R']);

  /**
   * One hand of a pair through the CLASSIC sprite - FPSWeapon's own placement of its view's frame, as a right hand, the
   * guard on it and the mirror over it. Returns the rect it drew, or null.
   */
  function drawClassicHand(renderer, canvas, hand, art, { tint = null, offsetHeight = 0 } = {}) {
    const v = views[hand];
    const q = fpsWeaponQuad(canvas, art, v.state, v.frame, { flipHorizontal: false, offsetHeight });
    if (!q) return null;
    const left = handOnLeft(hand, st.leftHanded);
    let rect = moved(q.rect, nudge(hand, canvas));
    if (left) rect = mirrorRect(rect, canvas.width);
    renderer.drawScreenQuad(q.tex, rect, left ? MIRROR_UV : q.uv, tint ?? undefined);
    return rect;
  }

  /**
   * THE PAIR, DRAWN - both hands, the striking one over the other, unless the running hands hold them (drawRun). `widget`
   * is the right hand's clone (the rig's), used with the left's own while the Weapon Widget is on; a clone with nothing to
   * draw (its art still loading) falls through to the classic sprite for that hand, as the one hand's seam does (WW4).
   * `artFor(hand)` answers a hand's classic art. True when it owned the seam.
   */
  function drawPair(renderer, canvas, { widget = null, widgetOn = false, artFor, shown = true, tint = null, offsetHeight = 0 } = {}) {
    if (!renderer || !canvas || !twoHanded(st.mode)) return false;
    if (st.run.w > 0) return true;   // the running hands own the fists (drawRun, after this)
    for (const hand of drawOrder()) {
      const clone = hand === 'R' ? widget : offWidget;
      const left = handOnLeft(hand, st.leftHanded);
      if (widgetOn && clone?.draw(renderer, canvas, tint, { transform: (r) => moved(r, nudge(hand, canvas)), mirror: left })) continue;
      if (shown) drawClassicHand(renderer, canvas, hand, artFor(hand), { tint, offsetHeight });
    }
    return true;
  }

  /** Where a hand is at rest on screen this frame (the run's start and end): its clone's rect or its classic one, the
   *  guard and the mirror on it - null when nothing of it shows (the run then rises from below). */
  function restRect(hand, canvas, { widget = null, widgetOn = false, art = null, shown = true, offsetHeight = 0 } = {}) {
    if (!twoHanded(st.mode) || st.mode !== HANDS_MODE.Fists) return null;
    const left = handOnLeft(hand, st.leftHanded);
    const clone = hand === 'R' ? widget : offWidget;
    let rect = null;
    if (widgetOn && clone?.drawing()) rect = clone.rect;
    else if (shown && art) rect = fpsWeaponQuad(canvas, art, 'Idle', 0, { flipHorizontal: false, offsetHeight })?.rect ?? null;
    if (!rect) return null;
    rect = moved(rect, nudge(hand, canvas));
    return left ? mirrorRect(rect, canvas.width) : rect;
  }

  /**
   * THE RUNNING HANDS, DRAWN - the two fists (the bare hand's idle frame, `fistArt`: WEAPON10.CIF's record 0, the art the
   * fists are drawn in) at the run's weight between where they rest (restRect - or below the view when they were down)
   * and their place in the pump. The hand on its back stroke first, the one coming forward over it. True when it drew.
   */
  function drawRun(renderer, canvas, fistArt, { widget = null, widgetOn = false, shown = true, tint = null, offsetHeight = 0 } = {}) {
    const w = st.run.w;
    if (!(w > 0) || !renderer || !canvas || !fistArt) return false;
    const q = fpsWeaponQuad(canvas, fistArt, 'Idle', 0, { flipHorizontal: false, offsetHeight });
    if (!q) return false;
    const hands = ['R', 'L'].map((hand) => {
      const left = handOnLeft(hand, st.leftHanded);
      const base = left ? mirrorRect(q.rect, canvas.width) : q.rect;
      const p = pumpOf(st.run.phase, hand);
      const toMid = left ? 1 : -1;
      const pw = base.w * p.scale, ph = base.h * p.scale;
      const pump = {
        x: base.x + (base.w - pw) / 2 + toMid * p.dx * canvas.width,
        y: base.y + (base.h - ph) + p.dy * base.h,
        w: pw, h: ph,
      };
      const rest = restRect(hand, canvas, { widget, widgetOn, art: fistArt, shown, offsetHeight })
        ?? { ...base, y: canvas.height + BELOW * base.h };
      const rect = {
        x: rest.x + (pump.x - rest.x) * w, y: rest.y + (pump.y - rest.y) * w,
        w: rest.w + (pump.w - rest.w) * w, h: rest.h + (pump.h - rest.h) * w,
      };
      return { hand, left, rect, s: p.s };
    });
    hands.sort((a, b) => a.s - b.s);
    for (const h of hands) renderer.drawScreenQuad(q.tex, h.rect, h.left ? MIRROR_UV : q.uv, tint ?? undefined);
    return true;
  }

  return {
    step, drawPair, drawRun, restRect, view: (hand) => views[hand], offWidget,
    /** The running hands are on the screen (or on their way off it). */
    get running() { return st.run.w > 0; },
    /** The pins' read of the state. */
    get state() { return { mode: st.mode, strikeHand: st.strikeHand, guard: { ...st.guard }, bounce: st.bounce, run: { ...st.run } }; },
  };
}
