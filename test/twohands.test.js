// TWO-HANDS (2026-10-16, bible/05-Combat/Two-Hands.md): both fists up, a pair of weapons, the hands that run - the law
// (combat/handsLaw.js), the swing it times and the blow it lands (combat/playerWeapon.js, characters/weaponStates.js),
// and the sprite lane's two hands drawn through a real weapon rig (combat/twoHands.js, combat/weaponRig.js) on a
// synthetic WEAPON CIF. The Morrowind lane's pins are test/twohands_mw.test.js.
import './modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  HANDS_MODE, DUAL_TYPES, dualEligible, handsModeOf, twoHanded, otherHand, strikeHandOf, FLURRY_WINDOW,
  mirrorStrike, mirrorRect, MIRROR_UV, handOnLeft, DUAL, offHandToHit, offHandBurden, strikeTempo, offHandDamage,
  GUARD, guardStep, guardOffset, RUN_STEP_M, RUN_PUMP, runPhaseStep, runHandsWanted, pumpOf, runWeightStep, easeTo,
  RUN_3D, pumpTarget3D, MELEE_PAINTED_ARM, strikePicture,
} from '../src/combat/handsLaw.js';
import { PlayerWeapon, handDesc } from '../src/combat/playerWeapon.js';
import { createWeaponRig } from '../src/combat/weaponRig.js';
import { WEAPON_TYPES, weaponTypeForItem } from '../src/combat/fpsWeapon.js';
import { ITEM_HANDS } from '../src/characters/equipTable.js';
import { EQUIP_SLOTS } from '../src/systems/equip.js';
import { WALK_STEP_INTERVAL } from '../src/systems/footsteps.js';
import { getMeleeWeaponAnimTime, swingFrameSeconds, SWING_FRAME_MIN, SWING_FRAME_MAX, swingHeft } from '../src/characters/weaponStates.js';
import { resetToDefaults, setValue } from '../src/systems/settings.js';
import { _resetModSettings, setModSetting } from '../src/systems/modSettings.js';
import { registerFormulaOverride } from '../src/combat/formulas.js';

const rd = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const weapon = (templateIndex, name) => ({ name, group: 'Weapons', templateIndex, material: 0 });
const KATANA = weapon(121, 'Katana');
const DAGGER = weapon(113, 'Dagger');
const LONGSWORD = weapon(120, 'Longsword');
const CLAYMORE = weapon(122, 'Claymore');
const LONG_BOW = weapon(130, 'Long Bow');
const BUCKLER = { name: 'Buckler', group: 'Armor', templateIndex: 109, material: 0 };
const desc = (item) => handDesc(item);

// ---- THE LAW ---------------------------------------------------------------------------------------------------------

test('TWO-HANDS law: the hands\' modes - both empty is the fists, two one-handed melee weapons the pair, and everything else DFU\'s one used hand (a shield, a two-hander, a bow, the beast, a light in a hand)', () => {
  assert.equal(handsModeOf({}), HANDS_MODE.Fists, 'nothing in either hand');
  assert.equal(handsModeOf({ right: desc(KATANA), left: desc(DAGGER) }), HANDS_MODE.Dual);
  assert.equal(handsModeOf({ right: desc(DAGGER), left: desc(LONGSWORD) }), HANDS_MODE.Dual, 'either way round');
  assert.equal(handsModeOf({ right: desc(KATANA) }), HANDS_MODE.Single, 'one weapon, one hand');
  assert.equal(handsModeOf({ left: desc(DAGGER) }), HANDS_MODE.Single, 'one weapon in the left');
  assert.equal(handsModeOf({ right: desc(CLAYMORE) }), HANDS_MODE.Single, 'a two-hander');
  assert.equal(handsModeOf({ right: desc(KATANA), left: desc(CLAYMORE) }), HANDS_MODE.Single, 'never a two-hander in a pair');
  assert.equal(handsModeOf({ right: desc(KATANA), left: desc(LONG_BOW) }), HANDS_MODE.Single, 'never a bow in a pair');
  assert.equal(handsModeOf({ left: { item: true, shield: true } }), HANDS_MODE.Single, 'a fist and a shield are DFU\'s');
  assert.equal(handsModeOf({ claws: true }), HANDS_MODE.Single, 'the beast\'s claws are one sprite');
  assert.equal(handsModeOf({ claws: true, right: desc(KATANA), left: desc(DAGGER) }), HANDS_MODE.Single);
  assert.equal(handsModeOf({ leftBusy: true }), HANDS_MODE.Single, 'a light in a hand takes it: one fist beside it');
  assert.equal(handsModeOf({ leftBusy: true, right: desc(KATANA), left: desc(DAGGER) }), HANDS_MODE.Single);
  assert.equal(twoHanded(HANDS_MODE.Fists), true); assert.equal(twoHanded(HANDS_MODE.Dual), true); assert.equal(twoHanded(HANDS_MODE.Single), false);
  // the leaf's two tables, pinned to their homes
  const T = WEAPON_TYPES;
  assert.deepEqual([...DUAL_TYPES].sort((a, b) => a - b), [T.LongBlade, T.LongBlade_Magic, T.Dagger, T.Dagger_Magic, T.Mace, T.Mace_Magic,
    T.Flail, T.Flail_Magic, T.Warhammer, T.Warhammer_Magic, T.Battleaxe, T.Battleaxe_Magic].sort((a, b) => a - b));
  for (const t of [T.Staff, T.Staff_Magic, T.Bow, T.Melee, T.Werecreature, T.Thunderlock, T.Thunderlock_Magic]) {
    assert.equal(dualEligible({ item: true, type: t, hands: ITEM_HANDS.Either }), false, `type ${t}`);
  }
  assert.equal(dualEligible({ item: true, type: T.Mace, hands: ITEM_HANDS.Both }), false, 'ItemHands.Both is the leaf\'s 4');
  assert.equal(dualEligible({ item: true, type: T.Mace, hands: ITEM_HANDS.Either }), true);
  assert.equal(dualEligible({ item: true, type: T.Mace, hands: ITEM_HANDS.Either, shield: true }), false);
});

test('TWO-HANDS law: which hand strikes - the lead opens an exchange, the other hand answers within the flurry\'s window, and a pause hands it back to the lead; one hand in use is always the lead; the fists carry no off-hand cost', () => {
  const S = HANDS_MODE;
  assert.deepEqual(strikeHandOf({ mode: S.Single, lead: 'L', last: 'L', sinceLast: 0 }), { hand: 'L', flurry: false, off: false });
  assert.deepEqual(strikeHandOf({ mode: S.Dual, lead: 'R' }), { hand: 'R', flurry: false, off: false }, 'the opening');
  assert.deepEqual(strikeHandOf({ mode: S.Dual, lead: 'R', last: 'R', sinceLast: 0.1 }), { hand: 'L', flurry: true, off: true }, 'the answer');
  assert.deepEqual(strikeHandOf({ mode: S.Dual, lead: 'R', last: 'L', sinceLast: FLURRY_WINDOW }), { hand: 'R', flurry: true, off: false }, 'the window is inclusive');
  assert.deepEqual(strikeHandOf({ mode: S.Dual, lead: 'R', last: 'L', sinceLast: FLURRY_WINDOW + 0.01 }), { hand: 'R', flurry: false, off: false }, 'a pause: the lead again');
  assert.deepEqual(strikeHandOf({ mode: S.Dual, lead: 'L', last: 'L', sinceLast: 0 }), { hand: 'R', flurry: true, off: true }, 'a left lead\'s off hand is the right');
  assert.deepEqual(strikeHandOf({ mode: S.Fists, lead: 'R', last: 'R', sinceLast: 0 }), { hand: 'L', flurry: false, off: false }, 'the fists alternate at DFU\'s numbers');
  assert.equal(otherHand('R'), 'L'); assert.equal(otherHand('L'), 'R');
  assert.equal(FLURRY_WINDOW, 0.75);
  assert.ok(FLURRY_WINDOW > SWING_FRAME_MAX, 'a beat longer than the slowest frame');
});

test('TWO-HANDS law: the mirror - a left hand is a right hand in the glass: its strike mapped, its rect mirrored about the screen\'s middle, and the side each hand is drawn on (a left-handed player\'s whole picture mirrored)', () => {
  assert.equal(mirrorStrike('StrikeLeft'), 'StrikeRight'); assert.equal(mirrorStrike('StrikeRight'), 'StrikeLeft');
  assert.equal(mirrorStrike('StrikeDownLeft'), 'StrikeDownRight'); assert.equal(mirrorStrike('StrikeDownRight'), 'StrikeDownLeft');
  for (const s of ['Idle', 'StrikeDown', 'StrikeUp']) assert.equal(mirrorStrike(s), s);
  assert.deepEqual(mirrorRect({ x: 232, y: 170, w: 40, h: 30 }, 320), { x: 48, y: 170, w: 40, h: 30 });
  assert.deepEqual(mirrorRect({ x: 110, y: 0, w: 10, h: 1 }, 200, 50), { x: 180, y: 0, w: 10, h: 1 }, 'about a screen that starts at x0 (60 in from either edge)');
  assert.deepEqual(MIRROR_UV, { u0: 1, v0: 0, u1: 0, v1: 1 });
  assert.equal(handOnLeft('L', false), true); assert.equal(handOnLeft('R', false), false);
  assert.equal(handOnLeft('L', true), false); assert.equal(handOnLeft('R', true), true);
});

test('TWO-HANDS law: THE PAINTED ARM - the bare hand\'s art paints both arms (its idle, StrikeDownLeft, StrikeRight and StrikeDownRight the right; StrikeDown, StrikeLeft and StrikeUp the left), a weapon\'s the right alone; a hand\'s picture is its own arm on its own side, the asked way across wherever the art has it, and its mirror is exactly "the painted arm is not this side"', () => {
  assert.deepEqual([...MELEE_PAINTED_ARM], ['R', 'L', 'R', 'L', 'R', 'R', 'L']);
  const STATES = ['Idle', 'StrikeDown', 'StrikeDownLeft', 'StrikeLeft', 'StrikeRight', 'StrikeDownRight', 'StrikeUp'];
  const melee = (st) => MELEE_PAINTED_ARM[STATES.indexOf(st)];
  // a weapon: DFU's own picture for the right hand, the mirror of the mirrored strike for the left - as it always was
  for (const st of STATES) {
    assert.deepEqual(strikePicture('R', st), { state: st, mirror: false });
    assert.deepEqual(strikePicture('L', st), { state: mirrorStrike(st), mirror: true });
    assert.deepEqual(strikePicture('R', st, { leftHanded: true }), { state: mirrorStrike(st), mirror: true }, 'a left-handed player\'s right hand is on the left');
  }
  // the fists, every hand and strike: the expected picture, case by case
  const want = {
    R: { Idle: ['Idle', false], StrikeDown: ['StrikeDown', true], StrikeDownLeft: ['StrikeDownLeft', false], StrikeLeft: ['StrikeRight', false],
      StrikeRight: ['StrikeRight', false], StrikeDownRight: ['StrikeDownRight', false], StrikeUp: ['StrikeUp', true] },
    L: { Idle: ['Idle', true], StrikeDown: ['StrikeDown', false], StrikeDownLeft: ['StrikeDownRight', true], StrikeLeft: ['StrikeLeft', false],
      StrikeRight: ['StrikeLeft', false], StrikeDownRight: ['StrikeDownLeft', true], StrikeUp: ['StrikeUp', false] },
  };
  for (const hand of /** @type {const} */ (['R', 'L'])) {
    for (const st of STATES) {
      const p = strikePicture(hand, st, { painted: melee });
      assert.deepEqual([p.state, p.mirror], want[hand][st], `${hand} ${st}`);
      const shown = p.mirror ? otherHand(melee(p.state)) : melee(p.state);
      assert.equal(shown, hand, `${hand} ${st}: the arm on the screen is the hand's`);
      assert.equal(p.mirror, melee(p.state) !== hand, 'the one rule: mirrored exactly when the painted arm is not this side');
      // the way across the screen: the asked one, or - where the art has this hand only the other way - its mirror
      assert.ok(p.state === st || p.state === mirrorStrike(st));
    }
  }
});

test('TWO-HANDS law: THE BALANCE - the pair is tempo, not twice the damage: the flurry\'s quickness, the off hand\'s surety by Agility and its share of the damage, its burden by weight; the lead\'s blow is DFU\'s; and the measured edge over one weapon is single digits, bought with the shield and a third more fatigue a second', () => {
  assert.deepEqual({ ...DUAL }, { FLURRY_TEMPO: 0.75, OFF_DAMAGE: 0.75, OFF_TO_HIT: -10, OFF_TO_HIT_PER_AGILITY: 0.1, OFF_TO_HIT_MIN: -15, OFF_TO_HIT_MAX: -5, OFF_WEIGHT: 1.5 });
  assert.deepEqual([0, 30, 50, 69, 70, 100, 140].map(offHandToHit), [-15, -12, -10, -8, -8, -5, -5]);
  assert.equal(offHandToHit(NaN), -10, 'no Agility reads as 50');
  assert.deepEqual([0, -3, 1, 2, 4, 8, 13].map(offHandDamage), [0, -3, 1, 2, 3, 6, 10], 'a miss stays a miss, a landed blow at least 1');
  assert.equal(offHandBurden(0.5, 50), 1, 'a dagger costs the off arm nothing');
  assert.ok(Math.abs(offHandBurden(4.5, 50) - swingHeft(6.75, 50) / swingHeft(4.5, 50)) < 1e-12);
  assert.ok(offHandBurden(4.5, 50) > 1.08 && offHandBurden(4.5, 50) < 1.12, 'a longsword a tenth');
  assert.ok(offHandBurden(4.5, 90) < offHandBurden(4.5, 50), 'a strong arm feels it less');
  assert.equal(strikeTempo({}), 1, 'a strike that is neither: untouched');
  assert.equal(strikeTempo({ flurry: true }), 0.75);
  assert.equal(strikeTempo({ off: true, weight: 0.5 }), 1);
  assert.equal(strikeTempo({ flurry: true, off: true, weight: 4.5, strength: 50 }), 0.75 * offHandBurden(4.5, 50));
  // the measurement the record states: one weapon against a pair of the same weapon, same skill, steady exchange
  const p = 0.65, single = p, pairSwing = (p + (p + DUAL.OFF_TO_HIT / 100) * DUAL.OFF_DAMAGE) / 2;
  const edge = (pairSwing / DUAL.FLURRY_TEMPO) / single;
  assert.ok(edge > 1.05 && edge < 1.12, `about 9% more damage a second (${edge.toFixed(3)})`);
  assert.equal(1 / DUAL.FLURRY_TEMPO, 4 / 3, 'and a third more swings - DFU\'s fatigue a swing, a third more a second');
});

test('TWO-HANDS law: the guard, the run - the guard\'s follower eased in fast and out slower, its offset toward the middle and down; one stroke a step on the footstep interval, the pump\'s place, the run\'s gate and its weight', () => {
  assert.equal(RUN_STEP_M, WALK_STEP_INTERVAL, 'PlayerFootsteps.WalkStepInterval, the head bob\'s own clock');
  assert.equal(easeTo(0, 1, 0, 0.1), 1, 'a zero time constant arrives');
  const g1 = guardStep(0, true, GUARD.IN_TAU), g2 = guardStep(1, false, GUARD.OUT_TAU);
  assert.ok(Math.abs(g1 - (1 - Math.exp(-1))) < 1e-9 && Math.abs(g2 - Math.exp(-1)) < 1e-9);
  assert.ok(GUARD.IN_TAU < GUARD.OUT_TAU, 'in fast, out slower');
  assert.deepEqual(guardOffset(1, 'right'), [-GUARD.IN, GUARD.DOWN], 'a right-side hand draws in to its left, and down');
  assert.deepEqual(guardOffset(1, 'left'), [GUARD.IN, GUARD.DOWN]);
  assert.deepEqual(guardOffset(0, 'right'), [-0, 0]);
  const b = guardOffset(0, 'right', { time: 0.25 / GUARD.BOUNCE_HZ, bounce: 1, hand: 'R' })[1];
  const bl = guardOffset(0, 'right', { time: 0.25 / GUARD.BOUNCE_HZ, bounce: 1, hand: 'L' })[1];
  assert.ok(Math.abs(b - GUARD.BOUNCE_PX) < 1e-9 && Math.abs(bl + GUARD.BOUNCE_PX) < 1e-9, 'the fists bounce out of step');
  // one step is PI of the stride, and the arms swing one stroke a step
  assert.ok(Math.abs(runPhaseStep(0, RUN_STEP_M, 1) - Math.PI) < 1e-9);
  assert.equal(runPhaseStep(1, 7, -1), 1, 'no backward time');
  const top = pumpOf(Math.PI / 2, 'R'), back = pumpOf(Math.PI / 2, 'L');
  assert.deepEqual([top.s, back.s], [1, -1], 'out of step by half a stride');
  assert.deepEqual([top.dx, top.dy, top.scale], [RUN_PUMP.IN, -RUN_PUMP.RISE, 1 + RUN_PUMP.GROW], 'the top: in toward the middle, up, nearer');
  assert.deepEqual([back.dx, back.dy, back.scale], [-RUN_PUMP.OUT, RUN_PUMP.DROP, 1 - RUN_PUMP.GROW], 'the bottom: out, down past the frame, farther');
  assert.ok(RUN_PUMP.DROP > 1, 'the bottom of the stroke leaves the view');
  const mid = pumpOf(Math.PI / 6, 'R');   // sin = 0.5, snapped up by SHAPE
  assert.ok(Math.abs(mid.s - Math.pow(0.5, RUN_PUMP.SHAPE)) < 1e-9 && mid.s > 0.5, 'the stroke drives (|sin|^SHAPE)');
  const want = { running: true, grounded: true, speed: RUN_PUMP.MIN_SPEED, emptyHands: true };
  assert.equal(runHandsWanted(want), true);
  for (const [k, v] of [['running', false], ['standing', true], ['grounded', false], ['crouching', true], ['riding', true], ['swimming', true], ['climbing', true], ['emptyHands', false], ['attacking', true], ['speed', RUN_PUMP.MIN_SPEED - 0.01]]) {
    assert.equal(runHandsWanted({ ...want, [k]: v }), false, `not with ${k} = ${v}`);
  }
  const up = runWeightStep(0, true, false, RUN_PUMP.IN_TAU), down = runWeightStep(1, false, false, RUN_PUMP.OUT_TAU), punch = runWeightStep(1, true, true, RUN_PUMP.PUNCH_TAU);
  assert.ok(Math.abs(up - (1 - Math.exp(-1))) < 1e-9 && Math.abs(down - Math.exp(-1)) < 1e-9 && Math.abs(punch - Math.exp(-1)) < 1e-9);
  assert.ok(RUN_PUMP.PUNCH_TAU < RUN_PUMP.IN_TAU, 'a punch takes the fist at once');
  // the 3D stroke, the same stride
  const t3 = pumpTarget3D(Math.PI / 2, 'R'), b3 = pumpTarget3D(Math.PI / 2, 'L');
  assert.deepEqual([t3.x, t3.y, t3.d], [RUN_3D.TOP.x, RUN_3D.TOP.y, RUN_3D.TOP.d]);
  assert.deepEqual([b3.x, b3.y, b3.d], [RUN_3D.BOTTOM.x, RUN_3D.BOTTOM.y, RUN_3D.BOTTOM.d]);
  assert.ok(RUN_3D.TOP.y > -1 && RUN_3D.BOTTOM.y < -1, 'the top on the picture, the bottom under it');
});

// ---- THE SWING AND THE BLOW --------------------------------------------------------------------------------------------

test('TWO-HANDS the swing: a strike\'s own tempo rides SWING-LAW\'s answer under its bounds - a flurry quicker, the floor still the floor, a ctx without one untouched, and DFU\'s line (no wielder) never asked', () => {
  const entity = { stats: { speed: 50, strength: 50 }, equip: { slots: {} } };
  const base = getMeleeWeaponAnimTime(50, { entity, weaponType: WEAPON_TYPES.Melee });
  assert.equal(base, swingFrameSeconds(50, { handling: 0.9 }));
  assert.ok(Math.abs(getMeleeWeaponAnimTime(50, { entity, weaponType: WEAPON_TYPES.Melee, tempo: 0.75 }) - base * 0.75) < 1e-12);
  assert.equal(getMeleeWeaponAnimTime(50, { entity, weaponType: WEAPON_TYPES.Melee, tempo: 1 }), base);
  assert.equal(getMeleeWeaponAnimTime(100, { entity: { ...entity, stats: { speed: 100, strength: 50 } }, weaponType: WEAPON_TYPES.Melee, tempo: 0.1 }), SWING_FRAME_MIN, 'no pair swings quicker than one weapon can');
  assert.equal(getMeleeWeaponAnimTime(0, { entity, weaponType: WEAPON_TYPES.Battleaxe, tempo: 9 }), SWING_FRAME_MAX, 'nor slower');
  assert.equal(getMeleeWeaponAnimTime(50, { tempo: 0.5 }), (3 * (115 - 50)) / 980, 'a foe\'s machine: DFU\'s line, no tempo');
  assert.equal(getMeleeWeaponAnimTime(50, { entity, weaponType: WEAPON_TYPES.Melee, tempo: NaN }), base);
});

test('TWO-HANDS PlayerWeapon: the mode off the caches, the strike\'s hand off the law, the weapon in use the striking hand\'s for the strike and the lead\'s again after it, and the swing\'s ctx carrying its tempo', () => {
  const pw = new PlayerWeapon({});
  pw.updateHands(KATANA, DAGGER); pw.applyWeapon();
  assert.equal(pw.handsMode, HANDS_MODE.Dual);
  assert.equal(pw.weapon, KATANA, 'at rest: the lead\'s');
  const entity = { stats: { speed: 50, strength: 50 }, equip: { slots: { [EQUIP_SLOTS.RightHand]: KATANA, [EQUIP_SLOTS.LeftHand]: DAGGER } } };
  pw.animCtx = () => pw.swingCtx(entity);
  const hands = [], weapons = [], tempos = [];
  for (let n = 0; n < 4; n++) {
    assert.ok(pw.clickAttack(() => 0.5), `strike ${n}`);
    hands.push(pw.strike.hand); weapons.push(pw.weapon.name);
    tempos.push(pw.swingCtx(entity).tempo ?? 1);
    assert.equal(pw.swingCtx(entity).usingRightHand, pw.strike.hand === 'R', 'the ctx names the striking hand (RR reads its weapon)');
    for (let i = 0; i < 600 && pw.machine.state !== 'Idle'; i++) pw.update(1 / 60);
    assert.equal(pw.machine.state, 'Idle');
    pw.applyWeapon();
    assert.equal(pw.weapon, KATANA, 'back to the lead\'s');
  }
  assert.deepEqual(hands, ['R', 'L', 'R', 'L'], 'the exchange alternates');
  assert.deepEqual(weapons, ['Katana', 'Dagger', 'Katana', 'Dagger'], 'the weapon in use is the striking hand\'s');
  assert.equal(tempos[0], 1, 'the opening is no flurry');
  assert.equal(tempos[1], DUAL.FLURRY_TEMPO, 'the dagger answers quick, and feels no burden');
  assert.equal(tempos[2], DUAL.FLURRY_TEMPO, 'the lead\'s next is a flurry\'s too');
  // a pause hands the exchange back to the lead
  for (let i = 0; i < 60; i++) pw.update(1 / 60);
  pw.clickAttack(() => 0.5);
  assert.equal(pw.strike.hand, 'R');
  // the fists: alternate, no tempo, no off
  const f = new PlayerWeapon({});
  f.updateHands(null, null); f.applyWeapon();
  assert.equal(f.handsMode, HANDS_MODE.Fists);
  const fe = { stats: { speed: 50, strength: 50 }, equip: { slots: {} } };
  const seen = [];
  for (let n = 0; n < 3; n++) {
    f.clickAttack(() => 0.5);
    seen.push([f.strike.hand, f.strike.flurry, f.strike.off, f.swingCtx(fe).tempo ?? 1]);
    for (let i = 0; i < 600 && f.machine.state !== 'Idle'; i++) f.update(1 / 60);
  }
  assert.deepEqual(seen, [['R', false, false, 1], ['L', false, false, 1], ['R', false, false, 1]]);
  // a technique is the lead's whatever the exchange
  const t = new PlayerWeapon({});
  t.updateHands(KATANA, DAGGER); t.applyWeapon();
  t.clickAttack(() => 0.5);
  for (let i = 0; i < 600 && t.machine.state !== 'Idle'; i++) t.update(1 / 60);
  assert.ok(t.techniqueStrike('StrikeDown'));
  assert.deepEqual(t.strike, { hand: 'R', flurry: false, off: false });
  // a rig that drives its own weapon (no caches) stays single and its weapon untouched
  const own = new PlayerWeapon({});
  own.weapon = LONG_BOW;
  own.clickAttack(() => 0.5);
  assert.equal(own.weapon, LONG_BOW);
});

test('TWO-HANDS PlayerWeapon: THE OFF HAND\'S BLOW through the real formula - its to-hit term ten points under the lead\'s at Agility 50, five at 100 (read where DFU\'s AdjustWeaponHitChanceMod sees it), and three quarters of the lead\'s damage on every roll both land; the lead\'s blow is DFU\'s', () => {
  const mods = [];
  registerFormulaOverride('adjustWeaponHitChanceMod', (attacker, target, mod) => { mods.push(mod); return undefined; });
  const player = { isPlayer: true, level: 1, skills: 50, armor: 0, stats: { strength: 75, agility: 50, luck: 50, speed: 50 } };
  const foeEntity = () => ({ isPlayer: false, careerIndex: 0, health: 300, maxHealth: 300, armor: 0, skills: 30, minMetalToHit: -1, affinity: 'Human', stats: { strength: 50, agility: 50, luck: 50 } });
  const sweep = (off) => {
    const out = [];
    for (let k = 0; k < 100; k++) {
      const pw = new PlayerWeapon({});
      pw.updateHands(KATANA, DAGGER); pw.applyWeapon();
      pw.machine.state = 'StrikeLeft';
      pw.strike = { hand: off ? 'L' : 'R', flurry: off, off };
      pw.weapon = KATANA;   // the same weapon both ways: only the off hand's terms differ
      const roll = (k + 0.5) / 100;
      const res = pw.resolveHit([{ entity: foeEntity(), ai: { feet: [0, 0, 1] } }], player, () => ({ dist: 1, inView: true, losClear: true }), () => roll);
      out.push(res[0].damage);
    }
    return out;
  };
  try {
    mods.length = 0;
    const lead = sweep(false);
    const leadMods = mods.splice(0);
    const off = sweep(true);
    const offMods = mods.splice(0);
    assert.equal(leadMods.length, 100); assert.equal(offMods.length, 100);
    for (let k = 0; k < 100; k++) assert.equal(offMods[k] - leadMods[k], offHandToHit(50), `roll ${k}: ten points less sure`);
    const hits = (a) => a.filter((d) => d > 0).length;
    assert.ok(hits(off) <= hits(lead), 'never surer');
    // the damage, on rolls both land: the chance raised past the clamp through the same hook, so nearly all do
    registerFormulaOverride('adjustWeaponHitChanceMod', (attacker, target, mod) => mod + 1000);
    const leadSure = sweep(false), offSure = sweep(true);
    let both = 0;
    for (let k = 0; k < 100; k++) if (leadSure[k] > 0 && offSure[k] > 0) { both++; assert.equal(offSure[k], offHandDamage(leadSure[k]), `roll ${k}`); }
    assert.ok(both >= 80, `measured on ${both} rolls`);
    assert.ok(leadSure.some((d, k) => d > 0 && offSure[k] < d), 'and the off hand\'s is the lighter');
    registerFormulaOverride('adjustWeaponHitChanceMod', (attacker, target, mod) => { mods.push(mod); return undefined; });
    assert.ok(lead.length === 100 && off.length === 100);
    // a surer hand at Agility 100
    player.stats.agility = 100;
    sweep(false); const lead100 = mods.splice(0);
    sweep(true); const off100 = mods.splice(0);
    assert.equal(off100[0] - lead100[0], offHandToHit(100));
  } finally {
    registerFormulaOverride('adjustWeaponHitChanceMod', null);
  }
});

// ---- THE SPRITE LANE, THROUGH A REAL RIG -------------------------------------------------------------------------------

/** A WEAPON CIF: the "wielding" image every non-bow file opens with, then the anim records (record 0 the idle). */
function cif(recs) {
  const parts = recs.map(({ w, h, frames }) => {
    const head = 12 + 31 * 2 + 2, runs = Math.ceil((w * h) / 127) + 1;
    const b = new Uint8Array(head + runs * 2); const v = new DataView(b.buffer);
    v.setUint16(0, w, true); v.setUint16(2, h, true);
    for (let f = 0; f < frames; f++) v.setUint16(12 + f * 2, head, true);
    for (let k = 0; k < runs; k++) b[head + k * 2] = 255;
    v.setUint16(12 + 62, b.length, true);
    return b;
  });
  const wield = new Uint8Array(12 + 40 * 30); const wv = new DataView(wield.buffer);
  wv.setUint16(4, 40, true); wv.setUint16(6, 30, true); wv.setUint16(10, 40 * 30, true); wield.fill(1, 12);
  const all = [wield, ...parts];
  const out = new Uint8Array(all.reduce((a, p) => a + p.length, 0)); let o = 0;
  for (const p of all) { out.set(p, o); o += p.length; }
  return out;
}
const MELEE = cif(Array.from({ length: 7 }, () => ({ w: 120, h: 100, frames: 5 })));
const DT = 1 / 60;
const tick = () => new Promise((res) => setTimeout(res, 0));

async function rigWith({ right = null, left = null, widget = false, run = false, sheathed = false, light = null } = {}) {
  resetToDefaults(); _resetModSettings();
  setModSetting('weapon-widget', 'Enabled', widget);
  const quads = [], said = [];
  const renderer = { uploadTexture: (_k, name) => name, drawScreenQuad: (tex, rect, uv) => quads.push({ tex, rect, uv }) };
  const canvas = { width: 320, height: 200, clientWidth: 320, clientHeight: 200 };
  const entity = { items: [], lightSource: light, equip: { slots: { [EQUIP_SLOTS.RightHand]: right, [EQUIP_SLOTS.LeftHand]: left } }, stats: { speed: 50, strength: 50, agility: 50 } };
  const cam = { z: 0 };
  const r = createWeaponRig({ renderer, canvas, entity, audio: { playOneShot() {} }, palette: { get: () => ({ r: 0, g: 0, b: 0 }) }, say: (l) => said.push(l),
    fetchBytes: async () => MELEE,
    camera: () => ({ pos: [0, 1.7, cam.z], yaw: 0, pitch: 0, move: { grounded: true, running: run, standing: !run } }) });
  if (!sheathed) r.toggleSheath();
  for (let i = 0; i < 20; i++) { r.frame(DT); r.draw(); await tick(); }
  const frame = async ({ held = false, move = 0 } = {}) => {
    cam.z += move * DT;
    r.attackInput(0, 0, held);
    quads.length = 0;
    r.frame(DT); r.draw();
    await tick();
    return quads.map((q) => ({ ...q, rec: String(q.tex).split(':').slice(-2, -1)[0], mirrored: q.uv?.u0 === 1 && q.uv?.u1 === 0 }));
  };
  return { r, frame, said, entity };
}

/** The arm a drawn quad shows on the screen: the record's painted arm (handsLaw.js MELEE_PAINTED_ARM), turned about by a
 *  mirror. */
const shownArm = (x) => { const p = MELEE_PAINTED_ARM[Number(x.rec)]; return x.mirrored ? otherHand(p) : p; };
const STATE_REC = { Idle: '0', StrikeDown: '1', StrikeDownLeft: '2', StrikeLeft: '3', StrikeRight: '4', StrikeDownRight: '5', StrikeUp: '6' };
const meleePainted = (state) => MELEE_PAINTED_ARM[Number(STATE_REC[state])];

test('TWO-HANDS rig, classic sprite: both fists up - the right as DFU draws it, the left the same idle mirrored on the left; the hands take turns, and EVERY strike frame shows the striking hand\'s own arm on its own side - the bare hand\'s art paints both arms (StrikeDown, StrikeLeft and StrikeUp the left), so the picture is chosen (strikePicture), never assumed - and the other hand stays up', async () => {
  const { r, frame } = await rigWith({});
  assert.equal(r.playerWeapon.handsMode, HANDS_MODE.Fists);
  for (let i = 0; i < 90; i++) await frame();
  assert.ok(r.twoHands.state.bounce > 0.95, 'standing, the fists\' guard is alive');
  let q = await frame();
  assert.equal(q.length, 2, 'two fists');
  const [left, right] = [...q].sort((a, b) => a.rect.x - b.rect.x);
  assert.equal(left.mirrored, true); assert.equal(right.mirrored, false);
  assert.ok(Math.abs(left.rect.x - (320 - right.rect.x - right.rect.w)) < 1.5, 'the left is the right\'s mirror image (the bounce aside)');
  // a held button: the exchange - many blows, in the directions the machine picks
  const blows = [];
  const painted = new Set();
  for (let i = 0; i < 1400; i++) {
    q = await frame({ held: i < 1360 });
    const s = r.playerWeapon.strikeInFlight;
    if (!s) continue;
    const striking = q.find((x) => x.rec !== '0');
    if (!striking) continue;
    const state = r.playerWeapon.machine.state;
    assert.equal(q.at(-1), striking, 'the striking hand is drawn over the other');
    assert.equal(shownArm(striking), s.hand, `${s.hand} ${state}: the arm on the screen is the hand that throws it (record ${striking.rec}${striking.mirrored ? ', mirrored' : ''})`);
    const pic = strikePicture(s.hand, state, { painted: meleePainted });
    assert.equal(striking.rec, STATE_REC[pic.state], `${s.hand} ${state}: the picture the law chose`);
    const other = q.find((x) => x !== striking);
    assert.ok(other && other.rec === '0' && shownArm(other) === otherHand(s.hand), 'and the other hand stays up, its own arm on its own side');
    painted.add(MELEE_PAINTED_ARM[Number(STATE_REC[state])]);
    if (!blows.length || blows.at(-1).hand !== s.hand) blows.push({ hand: s.hand, state });
  }
  assert.ok(blows.length >= 6, `blows ${blows.length}`);
  assert.deepEqual(blows.slice(0, 3).map((b) => b.hand), ['R', 'L', 'R'], 'the hands take turns');
  assert.deepEqual([...painted].sort(), ['L', 'R'], 'measured over strikes Daggerfall paints with each arm');
});

test('TWO-HANDS rig, the guard: the hand that is not striking draws toward the middle and down while the other strikes - each from its own side - and back after', async () => {
  const { r, frame } = await rigWith({});
  const rest = await frame();
  const restOf = { R: rest.find((x) => shownArm(x) === 'R').rect, L: rest.find((x) => shownArm(x) === 'L').rect };
  for (const [hand, striker] of /** @type {const} */ ([['R', 'L'], ['L', 'R']])) {
    let tucked = null;
    for (let i = 0; i < 400 && !tucked; i++) {
      const q = await frame({ held: true });
      if (r.playerWeapon.strikeInFlight?.hand !== striker) continue;
      // deep in the other's blow - the guard's follower has had its time
      for (let k = 0; k < 6 && r.playerWeapon.strikeInFlight?.hand === striker; k++) tucked = (await frame({ held: true })).find((x) => x.rec === '0' && shownArm(x) === hand)?.rect ?? tucked;
      void q;
    }
    assert.ok(tucked, `the ${hand} fist seen while the ${striker} strikes`);
    const inward = hand === 'R' ? restOf.R.x - tucked.x : tucked.x - restOf.L.x;
    assert.ok(inward > GUARD.IN * 0.6 && tucked.y > restOf[hand].y + GUARD.DOWN * 0.6, `${hand}: in toward the middle and down: ${JSON.stringify(tucked)} from ${JSON.stringify(restOf[hand])}`);
    for (let i = 0; i < 140; i++) await frame();
  }
  const back = await frame();
  for (const hand of ['R', 'L']) {
    const b = back.find((x) => shownArm(x) === hand).rect;
    assert.ok(Math.abs(b.x - restOf[hand].x) < 1 && Math.abs(b.y - restOf[hand].y) < 2.5, `${hand} back to its rest`);
  }
});

test('TWO-HANDS rig, the Weapon Widget: the right hand\'s clone and the left\'s each play their own hand\'s blows - the arm on the screen the striking hand\'s, its picture the law\'s (strikePicture over the painted arm) - and hold their idle through the other\'s; the left\'s coroutines resume at the end of the frame', async () => {
  const { r, frame } = await rigWith({ widget: true });
  let strikes = 0;
  for (let i = 0; i < 900; i++) {
    const q = await frame({ held: i < 860 });
    const s = r.playerWeapon.strikeInFlight;
    if (!s) continue;
    const arms = q.map(shownArm);
    assert.equal(new Set(arms).size, arms.length, `never two of one arm on the screen: ${arms}`);
    for (const x of q) {
      if (x.rec === '0') continue;   // a clone's idle - the other hand's, or the striker's own the frame before its clone takes the blow up
      strikes++;
      assert.equal(shownArm(x), s.hand, `the strike frame is the striking hand's arm (${s.hand}, record ${x.rec}${x.mirrored ? ', mirrored' : ''})`);
    }
  }
  assert.ok(strikes > 40, `strike frames seen: ${strikes}`);
  assert.ok(r.twoHands.offWidget, 'the left hand\'s clone');
});

test('TWO-HANDS rig, the pair: a katana and a dagger - both drawn, the katana leads, the dagger answers mirrored; H picks the lead and says so; the recoil is the striking hand\'s', async () => {
  const { r, frame, said } = await rigWith({ right: KATANA, left: DAGGER });
  assert.equal(r.playerWeapon.handsMode, HANDS_MODE.Dual);
  const q = await frame();
  assert.equal(q.length, 2, 'both weapons in view');
  assert.ok(q.some((x) => x.mirrored) && q.some((x) => !x.mirrored));
  const hands = [];
  for (let i = 0; i < 300; i++) {
    await frame({ held: i < 280 });
    const s = r.playerWeapon.strikeInFlight;
    if (s) assert.equal(r.playerWeapon.weapon?.name, s.hand === 'R' ? 'Katana' : 'Dagger', 'every frame of a blow, the weapon in use is the striking hand\'s (the skill tallied, the swing\'s sound)');
    if (s && (!hands.length || hands.at(-1).hand !== s.hand)) hands.push({ hand: s.hand, weapon: r.playerWeapon.weapon?.name, off: s.off, flurry: s.flurry });
  }
  assert.deepEqual(hands.slice(0, 3), [
    { hand: 'R', weapon: 'Katana', off: false, flurry: false },
    { hand: 'L', weapon: 'Dagger', off: true, flurry: true },
    { hand: 'R', weapon: 'Katana', off: false, flurry: true },
  ]);
  for (let i = 0; i < 60; i++) await frame();
  assert.equal(r.switchHand(), true);
  assert.deepEqual(said.slice(-1), ['Leading with the left hand.']);
  assert.equal(r.playerWeapon.leadHand, 'L');
  assert.equal(r.switchHand(), true);
  assert.deepEqual(said.slice(-1), ['Leading with the right hand.']);
  // one hand in use keeps DFU's line
  const one = await rigWith({ right: KATANA, left: CLAYMORE });
  assert.equal(one.r.playerWeapon.handsMode, HANDS_MODE.Single);
  // the recoil goes to the striking hand's clone (source: the rig routes it)
  assert.match(rd('src/combat/weaponRig.js'), /playerWeapon\.onAttackResult = \(\{ foe, damage \}\) => \(pairUp\(\) && playerWeapon\.activeHand === 'L' \? twoHands\.offWidget : widget\)\.onAttackDamageCalculated\(/);
});

test('TWO-HANDS rig, the running hands: running with nothing in either hand - drawn or sheathed - the two fists pump out of step, from their guard or up from below the view, and go when the run ends; a light in a hand, a weapon, or standing still draws none', async () => {
  for (const sheathed of [false, true]) {
    const { r, frame } = await rigWith({ run: true, sheathed });
    const ys = { L: [], R: [] };
    for (let i = 0; i < 90; i++) {
      const q = await frame({ move: 7 });
      for (const x of q) ys[x.mirrored ? 'L' : 'R'].push(x.rect.y);
      if (i > 30 && q.length === 2 && Math.abs(q[0].rect.y - q[1].rect.y) > 5) assert.ok(q[1].rect.y < q[0].rect.y, 'the hand coming forward is drawn over the one going back');
    }
    assert.ok(r.twoHands.running, `running (${sheathed ? 'sheathed' : 'fists up'})`);
    const span = (a) => Math.max(...a.slice(30)) - Math.min(...a.slice(30));
    assert.ok(span(ys.R) > 20 && span(ys.L) > 20, `both pump: ${span(ys.R).toFixed(1)}, ${span(ys.L).toFixed(1)}`);
    assert.ok(Math.max(...ys.R.slice(30)) > 200, 'the bottom of the stroke leaves the view');
    let opposite = 0, n = 0;
    for (let i = 31; i < ys.R.length && i < ys.L.length; i++) { const dr = ys.R[i] - ys.R[i - 1], dl = ys.L[i] - ys.L[i - 1]; if (Math.abs(dr) > 0.5 && Math.abs(dl) > 0.5) { n++; if (Math.sign(dr) !== Math.sign(dl)) opposite++; } }
    assert.ok(opposite / n > 0.8, `out of step (${opposite}/${n})`);
  }
  // the run ends: the hands go
  const { r, frame } = await rigWith({ run: true, sheathed: true });
  for (let i = 0; i < 40; i++) await frame({ move: 7 });
  assert.ok(r.twoHands.running);
  for (let i = 0; i < 90; i++) await frame({ move: 0 });
  assert.equal(r.twoHands.running, false, 'standing, the hands are put away');
  assert.equal((await frame()).length, 0, 'and a sheathed body draws nothing');
  // a light in a hand takes the left hand: one fist beside it (and so no pair, and no running hands)
  const lit = await rigWith({ light: { templateIndex: 247 } });
  assert.equal(lit.r.playerWeapon.handsMode, HANDS_MODE.Single);
  assert.equal(lit.r.playerWeapon.leftBusy, true);
  // not with a light, a weapon, or a shield
  for (const over of [{ light: { templateIndex: 247, lit: true } }, { right: KATANA, sheathed: true }, { left: BUCKLER, sheathed: true }]) {
    const t = await rigWith({ run: true, ...over });
    for (let i = 0; i < 40; i++) await t.frame({ move: 7 });
    assert.equal(t.r.twoHands.running, false, JSON.stringify(Object.keys(over)));
  }
});

test('TWO-HANDS rig, by source: the two-hands branch is the classic body\'s own (after the climb\'s return, before the arm\'s seam, never behind the held map) and the one-hand ladder below it is untouched; the hosts carry none of it', () => {
  const rig = rd('src/combat/weaponRig.js');
  const branch = rig.indexOf('if (c && !eotbHidesWeapon() && !fpArm.active() && !sheetWindowUp() && (runHands || (pairUp() && shown()))) {');
  assert.ok(branch > 0, 'the branch, under the lanes\' vetoes');
  assert.ok(branch > rig.indexOf('if (!armsClimb && (_climbLower >= CLIMB_LOWER_GONE'), 'below the climb\'s lowering');
  assert.ok(branch < rig.indexOf('_armDrewLast = !eotbHidesWeapon() && fpArm.active();'), 'above the arm\'s seam');
  assert.match(rig, /const runHands = !!c && twoHands\.running && !fpArm\.active\(\) && !eotbHidesWeapon\(\) && !sheetWindowUp\(\);/);
  assert.match(rig, /finally \{ widget\.endOfFrame\(\); twoHands\.offWidget\.endOfFrame\(\); shield\.endOfFrame\(\); \}/);
  assert.match(rig, /playerWeapon\.leftBusy = lightInHand\(\);[^\n]*\n\s*playerWeapon\.applyWeapon\(claws\);/, 'the light\'s hand decided before the mode');
  for (const host of ['src/scenes/world.js', 'src/scenes/exterior.js', 'src/scenes/worldModes.js', 'src/scenes/dungeonContext.js']) {
    assert.doesNotMatch(rd(host), /twoHands|handsLaw/, `${host}: THE FOUR HOSTS - the rig is the one surface`);
  }
  // the classic sprite's placement is FPSWeapon's, shared by the second hand
  const fps = rd('src/combat/fpsWeapon.js');
  assert.match(fps, /const q = fpsWeaponQuad\(canvas, art, state, frame, \{ flipHorizontal, offsetHeight \}\);\n\s*if \(!q\) return;\n\s*const \{ tex, rect: \{ x, y, w, h \}, uv: src \} = q;\n\s*renderer\.drawScreenQuad\(tex, \{ x, y, w, h \}, src, tint \?\? undefined\);/);
  // and the one hand's clone draws the mod's own line; only a hand of a pair takes the guard and the mirror
  assert.match(rd('src/combat/weaponWidget.js'), /if \(!transform && !mirror\) \{\n\s*renderer\.drawScreenQuad\(tex, getWeaponRect\(\), w\.curAnimRect, tint \?\? undefined\);\n\s*return true;\n\s*\}/);
});

test('TWO-HANDS rig: a left-handed player\'s picture is mirrored whole - the right hand on the left, mirrored; the left hand on the right, as DFU draws a right hand', async () => {
  resetToDefaults();
  const { r, frame } = await (async () => { const o = await rigWith({}); setValue('Controls', 'Handedness', 1); return o; })();
  for (let i = 0; i < 4; i++) await frame();
  const q = await frame();
  const [left, right] = [...q].sort((a, b) => a.rect.x - b.rect.x);
  assert.equal(left.mirrored, true); assert.equal(right.mirrored, false);
  let seen = null;
  for (let i = 0; i < 120 && !seen; i++) {
    const qq = await frame({ held: true });
    if (r.playerWeapon.strikeInFlight?.hand === 'R') seen = qq.find((x) => x.rec !== '0') ?? null;
  }
  assert.ok(seen, 'the right hand struck');
  assert.equal(shownArm(seen), 'L', 'the right hand\'s blow is on the left of the screen: its arm the left of the picture, as painted or in the mirror');
  resetToDefaults();
});

test('TWO-HANDS weaponTypeForItem and handDesc: a hand\'s item read as the law reads it', () => {
  assert.deepEqual(handDesc(null), null);
  assert.deepEqual(handDesc(KATANA), { item: KATANA, type: weaponTypeForItem(KATANA), hands: ITEM_HANDS.Either, shield: false });
  assert.equal(handDesc(CLAYMORE).hands, ITEM_HANDS.Both);
});
