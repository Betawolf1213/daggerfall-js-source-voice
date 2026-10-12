// BAL6 - THE CURSES (2026-10-12; bible/05-Combat/Balance-Arc.md section 12; the owner, asked: "Beast-only bonuses",
// "Hood only shields", "Beast claws count as silver"). Measured first: a lycanthrope with a sword in hand struck at
// x1.8-2.9 a plain character's damage a second without ever changing, every change healed it whole (twice a day, and
// without end under Hircine's Ring), and the beast's +30 Hand-to-Hand fist met a Lich's Mithril hide ungated; a hooded
// vampire stood +20 at every hour.
//
// Pinned by execution through the curse's own round and change (systems/lycanthropy.js), the stat and skill channels
// (liveStat, skillValue), both combat cores (the overhaul's pcaaoAttackDamage and DFU's calculateAttackDamage) and the
// vampire's stat law (systems/vampirism.js vampireStatMod) on the sun's own seam.

import './modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createLycanthropyCurse, lycanthropyMagicRound, morphSelf, liveLycanthropy, morphHeals, lycanthropeAdvantages,
  LYCANTHROPE_STATS, LYCANTHROPE_SKILLS, LYCANTHROPE_STAT_MOD, LYCANTHROPE_SKILL_MOD,
} from '../src/systems/lycanthropy.js';
import { LYCANTHROPY_TYPES } from '../src/systems/infection.js';
import { isFullMoonFromMinutes, MINUTES_PER_DAY, CLASSIC_GAME_START_TIME } from '../src/systems/gameDate.js';
import { liveStat } from '../src/systems/statMods.js';
import { skillValue, SKILLS } from '../src/systems/skills.js';
import { clampMarkersAheadOf } from '../src/systems/save.js';
import { WEAPON_MATERIALS, BEAST_CLAW_MATERIAL, strikeMaterialOf } from '../src/characters/weapons.js';
import { pcaaoModules, pcaaoAttackDamage } from '../src/combat/pcaao.js';
import { calculateAttackDamage } from '../src/combat/formulas.js';
import { makeEnemyEntity } from '../src/characters/enemyEntity.js';
import { ENEMY_BASICS } from '../src/characters/enemyBasics.js';
import { vampireStatMod, VAMPIRE_STAT_MOD } from '../src/systems/vampirism.js';
import { setPassiveSpecialsHost } from '../src/systems/passiveSpecials.js';

const QUIET = (() => {
  let m = CLASSIC_GAME_START_TIME;
  while (isFullMoonFromMinutes(m) || isFullMoonFromMinutes(m + MINUTES_PER_DAY * 4)) m += MINUTES_PER_DAY;
  return m;
})();
const P = () => ({
  isPlayer: true, level: 12, raceId: 1, activeEffects: [], items: [], spells: [],
  stats: { strength: 50, agility: 50, endurance: 50, speed: 50, willpower: 50, intelligence: 50, personality: 50, luck: 50 },
  skills: Object.fromEntries(Array.from({ length: 35 }, (_, i) => [i, 40])), health: 60, maxHealth: 60,
  career: { weaponArmorShieldsBitfield: 0, abilityFlagsAndSpellPointsBitfield: 0 }, armorValues: new Array(7).fill(100), reflexes: 2, biographyAvoidHitMod: 0,
});
const bare = (p) => ({ ...p, activeEffects: [] });

test('BAL6: the lycanthrope\'s +40/+30 are the BEAST\'S - none in human form, every one from the instant of the change in, gone at the instant of the change back (mutants: the advantages in both forms, DFU\'s; the change not writing them)', () => {
  const p = P();
  const entry = createLycanthropyCurse(p, LYCANTHROPY_TYPES.Werewolf, { now: QUIET });
  lycanthropyMagicRound(p, { nowMinutes: QUIET + 1 });
  for (const stat of LYCANTHROPE_STATS) assert.equal(liveStat(p, stat), 50, `${stat}: human form is the character's own`);
  for (const skill of LYCANTHROPE_SKILLS) assert.equal(skillValue(p, skill), skillValue(bare(p), skill), 'and its skills');
  assert.equal(p.minMetalToHit, WEAPON_MATERIALS.Iron, 'iron still finds the man (DFU)');
  // the change: the advantages from the change's own instant, before any round reads them
  morphSelf(p, { force: true, nowMinutes: QUIET + 2 });
  assert.equal(entry.isTransformed, true);
  for (const stat of LYCANTHROPE_STATS) assert.equal(liveStat(p, stat), 50 + LYCANTHROPE_STAT_MOD, `${stat}: the beast's +40`);
  for (const skill of LYCANTHROPE_SKILLS) assert.equal(skillValue(p, skill), skillValue(bare(p), skill) + LYCANTHROPE_SKILL_MOD, 'the beast\'s +30');
  lycanthropyMagicRound(p, { nowMinutes: QUIET + 3 });
  assert.equal(liveStat(p, 'strength'), 90, 'the round keeps the beast\'s');
  assert.equal(skillValue(p, SKILLS.HandToHand), skillValue(bare(p), SKILLS.HandToHand) + 30);
  // and back
  morphSelf(p, { nowMinutes: QUIET + 4 });
  assert.equal(entry.isTransformed, false);
  assert.equal(liveStat(p, 'strength'), 50, 'the change back takes them at once');
  lycanthropyMagicRound(p, { nowMinutes: QUIET + 5 });
  assert.deepEqual([entry.statMods, entry.skillMods], [{}, {}], 'and the round leaves the man his own');
  // a curse saved before BAL6 carries DFU's +40/+30 on the man: the first round takes them
  entry.statMods = { strength: LYCANTHROPE_STAT_MOD }; entry.skillMods = { [SKILLS.HandToHand]: LYCANTHROPE_SKILL_MOD };
  assert.equal(liveStat(p, 'strength'), 90, 'the old save\'s word');
  lycanthropyMagicRound(p, { nowMinutes: QUIET + 6 });
  assert.equal(liveStat(p, 'strength'), 50, 'the round rewrites the form\'s own');
  assert.equal(skillValue(p, SKILLS.HandToHand), skillValue(bare(p), SKILLS.HandToHand));
  // the helper alone: a transformed entry carries exactly DFU's four and seven
  const e = { isTransformed: true };
  lycanthropeAdvantages(e);
  assert.deepEqual(Object.keys(e.statMods), [...LYCANTHROPE_STATS]);
  assert.deepEqual(Object.keys(e.skillMods).map(Number).sort((a, b) => a - b), [...LYCANTHROPE_SKILLS].sort((a, b) => a - b));
  e.isTransformed = false;
  lycanthropeAdvantages(e);
  assert.deepEqual([e.statMods, e.skillMods], [{}, {}]);
});

test('BAL6: one change a day heals - the change in heals, the change back inside the day does not, Hircine\'s Ring frees the change but never the heal, a day and a minute later the change heals again (mutants: every change heals, DFU\'s; the heal on the cast\'s stamp, which the Ring never reads)', () => {
  const p = P();
  const entry = createLycanthropyCurse(p, LYCANTHROPY_TYPES.Wereboar, { now: QUIET });
  const t0 = QUIET + MINUTES_PER_DAY + 1;
  p.health = 10;
  assert.equal(morphSelf(p, { nowMinutes: t0 }).ok, true);
  assert.equal(p.health, 60, 'the change in heals (none has yet)');
  assert.equal(entry.lastMorphHeal, t0);
  p.health = 10;
  assert.equal(morphSelf(p, { nowMinutes: t0 + 1 }).ok, true, 'the change back is ungated (DFU)');
  assert.equal(p.health, 10, 'but it does not heal: the day\'s heal is spent');
  // the Ring: the change is free, the heal is not
  entry.wearingHircineRing = true;
  assert.equal(morphSelf(p, { nowMinutes: t0 + 2 }).ok, true, 'the Ring lifts the once-a-day gate');
  assert.equal(p.health, 10, 'and no heal rides it');
  morphSelf(p, { nowMinutes: t0 + 3 });
  assert.equal(p.health, 10);
  // a whole day after the last heal, STRICTLY more than 1440 minutes, as the gate's own day
  morphSelf(p, { nowMinutes: t0 + MINUTES_PER_DAY });
  assert.equal(p.health, 10, 'exactly a day: not yet');
  morphSelf(p, { nowMinutes: t0 + MINUTES_PER_DAY + 1 });
  assert.equal(p.health, 60, 'a day and a minute: the heal is back');
  assert.equal(morphHeals({ lastMorphHeal: 100 }, 100 + MINUTES_PER_DAY), false);
  assert.equal(morphHeals({ lastMorphHeal: 100 }, 101 + MINUTES_PER_DAY), true);
  assert.equal(morphHeals({}, 0), true, 'a curse from before BAL6 carries no stamp: its next change heals');
  // the stamp is a curse clock's marker: a save written ahead of its own clock brings it back (save.js)
  const ahead = { activeEffects: [{ kind: 'racialOverride', lastMorphHeal: 5000 }] };
  assert.equal(clampMarkersAheadOf(ahead, 4000), 1);
  assert.equal(ahead.activeEffects[0].lastMorphHeal, 4000);
});

const OVERHAUL = { Enabled: true, equipmentDamageEnhanced: false, fadingEnchantedItems: false, fixedStrengthDamageModifier: true, armorHitFormulaRedone: true, criticalStrikesIncreaseDamage: true, conditionBasedEffectiveness: true, softMaterialRequirements: true };
const modsOf = (over = {}) => pcaaoModules((k) => ({ ...OVERHAUL, ...over })[k], () => undefined);
const career = { strength: 50, intelligence: 50, willpower: 50, agility: 50, endurance: 50, personality: 50, speed: 50, luck: 50, attackModifierFlags: 0 };
const lich = (metal) => { const e = makeEnemyEntity(32, ENEMY_BASICS[32], career, 12, () => 0.5); e.minMetalToHit = metal; return e; };
const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const swings = (attacker, target, modules, n = 2000) => {
  const rolls = mulberry(7);
  let sum = 0;
  for (let i = 0; i < n; i++) sum += pcaaoAttackDamage(attacker, target, { weapon: null, rolls, dfRand: () => Math.floor(rolls() * 32768), modules });
  return sum;
};

test('BAL6: the beast\'s claws meet a foe\'s metal as SILVER - the overhaul\'s soft rule cuts them at a Lich\'s Mithril (x0.4), DFU\'s gate refuses them; an ordinary fist stays ungated, DFU\'s (mutants: the claws ungated; the claws as iron; every fist gated)', () => {
  assert.equal(BEAST_CLAW_MATERIAL, WEAPON_MATERIALS.Silver);
  assert.equal(strikeMaterialOf({ isInBeastForm: true }, null), WEAPON_MATERIALS.Silver, 'the beast\'s bare hand');
  assert.equal(strikeMaterialOf({ isInBeastForm: false }, null), null, 'a man\'s bare hand: no gate');
  assert.equal(strikeMaterialOf({ isInBeastForm: true }, { material: WEAPON_MATERIALS.Ebony }), WEAPON_MATERIALS.Ebony, 'a weapon\'s own metal, whoever holds it');
  const M = modsOf();
  const strong = () => { const q = P(); q.stats.strength = 90; q.skills[SKILLS.HandToHand] = 70; q.skills[SKILLS.CriticalStrike] = 70; return q; };   // the level-12 beast's own numbers
  const beast = { ...strong(), isInBeastForm: true };
  const man = strong();
  assert.equal(lich(-1).minMetalToHit, -1);
  assert.equal(ENEMY_BASICS[32].minMetalToHit, WEAPON_MATERIALS.Mithril, 'the fixture is the real Lich\'s Mithril');
  const open = swings(beast, lich(-1), M);
  const gated = swings(beast, lich(WEAPON_MATERIALS.Mithril), M);
  assert.ok(open > 2000, `the claws land (${open})`);
  assert.ok(gated / open > 0.34 && gated / open < 0.46, `Mithril over silver, three tiers: x0.4 (${gated} / ${open})`);
  assert.equal(swings(beast, lich(WEAPON_MATERIALS.Silver), M), open, 'a silver-hide foe takes the claws whole');
  assert.equal(swings(man, lich(WEAPON_MATERIALS.Mithril), M), swings(man, lich(-1), M), 'a man\'s fist: DFU\'s, no gate');
  // without the soft rule: DFU's refusal, said
  const said = [];
  const notes = {};
  assert.equal(pcaaoAttackDamage(beast, lich(WEAPON_MATERIALS.Mithril), { weapon: null, rolls: () => 0.01, dfRand: () => 0, modules: modsOf({ softMaterialRequirements: false }), say: (t) => said.push(t), notes }), 0);
  assert.equal(notes.ineffective, true);
  assert.equal(said.length, 1, 'the HUD says so');
  // and DFU's own core (every mod off): the beast's claws refused at Mithril, landed at silver; a man's fist ungated
  const rolls = mulberry(3);
  let dfuMan = 0, dfuBeast = 0, dfuBeastSilver = 0;
  for (let i = 0; i < 300; i++) {
    dfuMan += calculateAttackDamage(man, lich(WEAPON_MATERIALS.Mithril), { rolls, dfRand: () => Math.floor(rolls() * 32768) });
    dfuBeast += calculateAttackDamage(beast, lich(WEAPON_MATERIALS.Mithril), { rolls, dfRand: () => Math.floor(rolls() * 32768) });
    dfuBeastSilver += calculateAttackDamage(beast, lich(WEAPON_MATERIALS.Silver), { rolls, dfRand: () => Math.floor(rolls() * 32768) });
  }
  assert.equal(dfuBeast, 0, 'DFU\'s core: the claws ineffective at Mithril');
  assert.ok(dfuMan > 0 && dfuBeastSilver > 0, `a man's fist and the claws at silver land (${dfuMan}, ${dfuBeastSilver})`);
});

test('BAL6: the hood shields, it does not make it night - bare in the street\'s sun -20, hooded there 0, out of the sun +20 hooded or not (mutants: the hood the night\'s +20, HOOD-SUN\'s; the hood shielding nothing)', () => {
  const day = Math.floor(CLASSIC_GAME_START_TIME / MINUTES_PER_DAY) * MINUTES_PER_DAY;
  const noon = day + 12 * 60, midnight = day + 23 * 60;
  let inside = false;
  const prev = setPassiveSpecialsHost({ isInside: () => inside, inPrison: () => false });
  try {
    assert.equal(vampireStatMod(noon, true), -VAMPIRE_STAT_MOD, 'bare-headed at noon in the street: the sun\'s -20');
    assert.equal(vampireStatMod(noon, false), 0, 'hooded at noon in the street: shielded, no bonus');
    assert.equal(vampireStatMod(midnight, true), VAMPIRE_STAT_MOD, 'by night: DFU\'s +20');
    assert.equal(vampireStatMod(midnight, false), VAMPIRE_STAT_MOD, 'hooded by night: the same');
    inside = true;
    assert.equal(vampireStatMod(noon, true), VAMPIRE_STAT_MOD, 'under a roof at noon: DFU\'s +20 (VAMP-SUN, Mac\'s)');
    assert.equal(vampireStatMod(noon, false), VAMPIRE_STAT_MOD, 'and hooded under it');
  } finally { setPassiveSpecialsHost(prev); }
});
