// @ts-check
// ═══════════════════════════════════════════════════════════════════
// MARTIAL3/4 (2026-10-17) — WHAT THE MARTIAL PATHS DO. bible/05-Combat/Martial-Specialisations.md sections 5-6.
//
// The law (systems/martialPaths.js) says which path a fighter chose and when it is AWAKE; the signature technique is the
// runner's (combat/techniques.js - the key's answer with no line on the weapon); this file does what each path's passive
// and its signature's RIDER say, through the seams the Sigil Sets, the loot and the Arcane paths opened - registered here at
// import, each a no-op for anyone but MY entity with its path awake, no refereed fight (sigil.js sigilDueling, the word
// every loot and set power sleeps on) and not the beast (BAL6: the curse's claws are balanced on their own - "the beast
// knows no technique"):
//
//   Flowing Steel, Hunter's       the WEAPON BLOW modifier (entityMods.js - MY blow or arrow at a foe): a percent onto
//   Instinct, Cheap Shot,         it, the fraction carried, every path's at most MARTIAL_BLOW_MOST together - and the
//   Opening Strike, Frenzy,       Warblade's window and the Ranger's mark, a rider's
//   Purge
//   Flowing Steel's stacks,       the STRIKE listener (formulas.js - a blow of mine that LANDED, its final damage)
//   Opening Strike's foes, the
//   Berserker's leech
//   War Rhythm, Frenzy, the       the SWING PACE (characters/weaponStates.js registerSwingPaceMod - MARTIAL2's door)
//   Bladedancer's quickening
//   Iron Discipline, the          the DAMAGE modifier (playerEntity.js - a foe's BLOW alone, the door's own mark:
//   Juggernaut's guard, the       sigilSetPowers.js pendingPlayerBlow; whole points, the fraction carried)
//   Brawler's dazed foe
//   Dancer's Step, the            the BLOW EVASION (asked before any modifier, so no set's charge is spent on it)
//   Shadowdancer's window
//   Stand Firm                    the HURT listener (a hurt that crosses its line, with a recovery)
//   War Rhythm, Bloodlust,        the KILL listener (playerKills.js)
//   Tireless
//   Grit                          the MAGIC ROUND
//   Light Step, Windborne         the entity FOLD (entityMods.js): attributes and skills
//   every signature RIDER         the TECHNIQUE LANDED listener (combat/technique/techniqueBlow.js - told by the swing's
//                                 and the shaft's one resolution, every host's), acting through the host's door
//                                 (playerDoor.js): a blow on a foe through its own pool's door, a bundle on me as a
//                                 potion lands, the heal through playerHeal.js
//
// NEVER AT A PLAYER: a technique never meets a player's body (TECH law 3 - neither resolution tells one), every blow
// modifier here refuses a player target, and a duel's blow at me passes my damage door without asking the port. THE CLOCK
// is real seconds, as the set powers' and the arcane paths'; a reload starts every power ready.
// ═══════════════════════════════════════════════════════════════════

import { SKILLS } from './skills.js';
import { martialAwake, MARTIAL_NUMBERS, MARTIAL_BY_ID, signatureById } from './martialPaths.js';
import './weaponMastery.js';   // MARTIAL2: the weapons past 100 - registered at import beside the paths, so every host that has one has the other
import { sigilDueling } from './sigil/sigil.js';
import { registerEntityFold, registerWeaponBlowMod, newMods, EMPTY_MODS } from './entityMods.js';
import { registerPlayerDamageMod, registerPlayerHurtListener, registerPlayerBlowEvasion, playerEntity } from '../characters/playerEntity.js';
import { registerPlayerStrikeListener } from '../combat/formulas.js';
import { registerPlayerKillListener } from './playerKills.js';
import { registerMagicRoundHook } from './worldTick.js';
import { registerSwingPaceMod } from '../characters/weaponStates.js';
import { registerTechniqueLandedListener } from '../combat/technique/techniqueBlow.js';
import { foeUnaware } from '../combat/playerWeapon.js';   // the host's one word that a foe had not noticed me
import { pendingPlayerBlow } from './sigil/sigilSetPowers.js';   // the door's one law of what a foe's blow is
import { healMine } from './playerHeal.js';
import { playerDoor, oweFoe } from './playerDoor.js';
import { foeGroup } from './loot/lootPowers.js';   // the loot's one foe group (a class foe is a man - AUDIT SCHOOLS L1 H2)
import { maxFatigue } from './statMods.js';
import { showFollowUp } from '../ui/hitNumbers.js';   // a follow-up's own number (ROSE-SEEN)
import { KNIGHT_CITY_WATCH } from '../characters/mobile/mobileTypes.js';
import { hudText } from './notify.js';
import { t } from './textManager.js';

const N = MARTIAL_NUMBERS;
/** All a path's percents onto one blow, at most - the Ranger's beast and mark together (20 + 20) are the most any path
 *  reaches; this keeps a later number from passing it unseen. */
export const MARTIAL_BLOW_MOST = 40;

// ── the session's memory, its clock, its dice and its voice ─────────
let _now = () => performance.now() / 1000;
let _rand = Math.random;
const fresh = () => ({
  flow: 0, flowUntil: 0,                 // Blademaster: Flowing Steel's stacks
  rhythmUntil: 0,                        // Warblade: War Rhythm's quickening after a kill
  rallyUntil: 0,                         // Warblade: Rallying Cleave's window
  quickUntil: 0,                         // Bladedancer: Cyclone's quickening
  evadeUntil: 0,                         // Shadowdancer: Phantom Strike's window
  guardUntil: 0, guardOwed: 0,           // Juggernaut: Earthsplitter's guard (and Iron Discipline's carry beside it)
  leechUntil: 0,                         // Berserker: Savage Whirl's leech
  standReady: 0,                         // Juggernaut: Stand Firm's recovery
  marks: new WeakMap(),                  // Ranger: foe entity -> marked until
  dazed: new WeakMap(),                  // Brawler: foe entity -> its blows lighter until
  struck: new WeakSet(),                 // Assassin: the foes a blow of mine has landed on (Opening Strike)
  uses: new WeakMap(),                   // a press's token -> the foes its rider has answered (Judgement, Windstrike)
});
let _s = fresh();
let _carry = new WeakMap();              // a weapon's (or my fists') per-cent fraction, carried to its next blow
let _say = (line) => { hudText(line); };
/** The host's voice for the passives' lines; the HUD's own door by default. */
export function setMartialPowersVoice({ say = null } = {}) { if (typeof say === 'function') _say = say; }
const say = (line) => { try { _say(line); } catch { /* a line is not the power's problem */ } };

/** MY entity's awake martial path's id, or null - none in a refereed fight, none for the beast. */
export function awakeMartialId(entity) {
  if (sigilDueling() || entity?.isInBeastForm) return null;
  return martialAwake(entity)?.id ?? null;
}
const me = () => playerDoor()?.player?.() ?? playerEntity;
const share = (e) => (Number.isFinite(e?.health) && e.maxHealth > 0 ? e.health / e.maxHealth : 1);
const undeadOrDaedra = (e) => { const g = foeGroup(e); return g === 'undead' || g === 'daedra'; };
const neverCounts = (e) => e?.mobileType === KNIGHT_CITY_WATCH || e?.team === 'PlayerAlly' || e?.mobileTeam === 'PlayerAlly';
/** A foe of mine the port may answer: a body that is no player's, no ward's. */
const foeOf = (target) => !!target && !target.isPlayer && !target.warded;
const flowStacks = (now = _now()) => (now < _s.flowUntil ? _s.flow : 0);

/** Fatigue back to MY entity: `pct` of its most, never past it. */
function fatigueMine(entity, pct) {
  if (!entity || !Number.isFinite(entity.fatigue) || !(pct > 0)) return;
  const most = maxFatigue(entity);
  if (most > 0) entity.fatigue = Math.min(most, entity.fatigue + Math.round((most * pct) / 100));
}
/** The struck foe takes `amount` again, through its own pool's door - and its number rises, tagged with the signature's
 *  name; a body the relay runs (the gate's court) is OWED it, the claim its blow sends carrying it (lootPowers.js `again`'s
 *  law). */
function again(entity, amount, word) {
  const n = Math.max(1, Math.round(amount));
  const door = playerDoor();
  const f = door?.foes?.().find((x) => x.entity === entity) ?? null;
  if (f) { if (!f.dead) { showFollowUp(n, word); door.hurtFoe(f, n); } return; }
  oweFoe(entity, n);
}
/** A rider's bundle on me - a power's (the door's castOnPlayer with `power`: a merge with my own like-kind effect keeps
 *  the larger), cast as a potion lands; one round more than it says, so it lasts what it says however the round falls. */
function castOnMe(name, type, subType, rounds) {
  const bundle = { name, rangeType: 0, element: 4, effects: [{
    type, subType, durationBase: Math.max(1, rounds | 0) + 1, durationMod: 0, durationPerLevel: 1,
    chanceBase: 1, chanceMod: 0, chancePerLevel: 1,
    magnitudeBaseLow: 0, magnitudeBaseHigh: 0, magnitudeLevelBase: 0, magnitudeLevelHigh: 0, magnitudePerLevel: 1,
  }] };
  try { playerDoor()?.castOnPlayer?.(bundle, { power: true }); } catch { /* the door is the host's */ }
}

// ── the blow ────────────────────────────────────────────────────────

/** The percent MY blow (or arrow) at a foe lands harder for my awake path: the passive's, and a rider's window or mark. */
export function martialBlowPct(attacker, target, info = null) {
  const id = awakeMartialId(attacker);
  if (!id) return 0;
  const now = _now();
  let pct = 0;
  switch (id) {
    case 'blademaster': pct += N.flowingSteel.pct * flowStacks(now); break;
    case 'warblade': if (now < _s.rallyUntil) pct += N.rallyingCleave.pct; break;
    case 'ranger':
      if (foeGroup(target) === 'animal') pct += N.huntersInstinct.pct;
      if (now < (_s.marks.get(target) ?? 0)) pct += N.huntersMark.pct;
      break;
    case 'cutthroat': if (info?.unaware) pct += N.cheapShot.pct; break;
    case 'assassin': if (!_s.struck.has(target)) pct += N.openingStrike.pct; break;
    case 'berserker': if (share(attacker) < N.frenzy.below) pct += N.frenzy.pct; break;
    case 'crusader': if (undeadOrDaedra(target)) pct += N.purge.pct; break;
    default: break;
  }
  return Math.min(MARTIAL_BLOW_MOST, pct);
}
/** THE BLOW (entityMods.js registerWeaponBlowMod): my blow at a foe, the fraction carried. */
export function martialBlow(weapon, damage, attacker, target, info) {
  if (!(damage > 0) || !attacker?.isPlayer || attacker.peer || !foeOf(target)) return damage;
  const pct = martialBlowPct(attacker, target, info);
  if (!(pct > 0)) return damage;
  const key = weapon ?? attacker;
  const exact = (damage * pct) / 100 + (_carry.get(key) ?? 0);
  const more = Math.floor(exact + 1e-9);
  _carry.set(key, Math.max(0, exact - more));
  return damage + more;
}
/** THE STRIKE (formulas.js registerPlayerStrikeListener): a blow of mine that LANDED - Flowing Steel's stack, the first
 *  blow at a foe counted (Opening Strike), the Berserker's leech. */
export function martialStrike(attacker, target, damage) {
  if (!(damage > 0) || !attacker?.isPlayer || attacker.peer || !foeOf(target)) return;
  const id = awakeMartialId(attacker);
  const now = _now();
  if (id === 'blademaster') { _s.flow = Math.min(N.flowingSteel.stacks, flowStacks(now) + 1); _s.flowUntil = now + N.flowingSteel.seconds; }
  if (id === 'berserker' && now < _s.leechUntil) healMine(attacker, (damage * N.savageWhirl.leech) / 100);
  _s.struck.add(target);   // Opening Strike: the foe's first landed blow was this one
}

// ── the swing's pace ────────────────────────────────────────────────

/** THE PACE (weaponStates.js registerSwingPaceMod): War Rhythm after a kill, the Bladedancer's quickening, Frenzy. */
export function martialPace(ctx) {
  const e = ctx?.entity;
  const id = awakeMartialId(e);
  if (!id) return 0;
  const now = _now();
  switch (id) {
    case 'warblade': return now < _s.rhythmUntil ? N.warRhythm.pct : 0;
    case 'bladedancer': return now < _s.quickUntil ? N.cyclone.pace : 0;
    case 'berserker': return share(e) < N.frenzy.below ? N.frenzy.pace : 0;
    default: return 0;
  }
}

// ── what lands on me ───────────────────────────────────────────────

/** The percent lighter a foe's blow lands on me now: Iron Discipline, the Juggernaut's guard, the Brawler's dazed foe. */
export function martialGuardPct(entity) {
  const id = awakeMartialId(entity);
  const blow = id ? pendingPlayerBlow() : null;
  if (!blow) return 0;
  const now = _now();
  switch (id) {
    case 'vanguard': return N.ironDiscipline.lighter;
    case 'juggernaut': return now < _s.guardUntil ? N.earthsplitter.lighter : 0;
    case 'brawler': return blow.attacker && now < (_s.dazed.get(blow.attacker) ?? 0) ? N.knockout.lighter : 0;
    default: return 0;
  }
}
/** THE DAMAGE DOOR: a foe's blow lighter, in whole points with the fraction carried (AUDIT SCHOOLS L1 M2's law). */
export function martialDamageMod(entity, dmg) {
  const pct = martialGuardPct(entity);
  if (!(pct > 0) || !(dmg > 0)) return dmg;
  const owed = (dmg * pct) / 100 + _s.guardOwed;
  const cut = Math.floor(owed + 1e-9);
  _s.guardOwed = owed - cut;
  return Math.max(0, dmg - cut);
}
/** THE BLOW EVASION: Dancer's Step, one blow in ten; Phantom Strike's window, one in three - asked before any modifier. */
export function martialEvade(entity) {
  const id = awakeMartialId(entity);
  if (!id || !pendingPlayerBlow()) return false;
  const oneIn = id === 'bladedancer' ? N.dancersStep.oneIn : id === 'shadowdancer' && _now() < _s.evadeUntil ? N.phantomStrike.oneIn : 0;
  if (!(oneIn > 0) || !(_rand() < 1 / oneIn)) return false;
  say(t('martial.say.evade', 'You slip the blow.'));
  return true;
}
/** THE HURT: Stand Firm - a hurt that takes me across its line, while ready; never one a death save turned aside.
 *  @param {any} entity @param {{ before?: number, after?: number, saved?: boolean }} [hurt] */
export function martialHurt(entity, { before = 0, after = 0, saved = false } = {}) {
  if (awakeMartialId(entity) !== 'juggernaut' || saved || !(after > 0) || !(entity.maxHealth > 0)) return;
  const line = entity.maxHealth * N.standFirm.below;
  const now = _now();
  if (!(after < line && before >= line) || now < _s.standReady) return;
  _s.standReady = now + N.standFirm.recover;
  healMine(entity, (entity.maxHealth * N.standFirm.heal) / 100);
  say(t('martial.say.standFirm', 'Stand Firm: you hold your ground.'));
}
/** THE ROUND: Grit - a little health and fatigue back, each round. */
export function martialRound(entity) {
  if (awakeMartialId(entity) !== 'brawler') return;
  if (entity.health > 0 && entity.health < entity.maxHealth) healMine(entity, (entity.maxHealth * N.grit.health) / 100);
  fatigueMine(entity, N.grit.fatigue);
}
/** MY KILL: War Rhythm, Bloodlust, Tireless. */
export function martialKill(foe) {
  if (!foe || neverCounts(foe)) return;
  const m = me();
  const id = awakeMartialId(m);
  if (id === 'warblade') _s.rhythmUntil = _now() + N.warRhythm.seconds;
  else if (id === 'bloodletter') healMine(m, (m.maxHealth * N.bloodlust.health) / 100);
  else if (id === 'woodsman') fatigueMine(m, N.tireless.fatigue);
}
/** THE FOLD: Light Step and Windborne. */
export function martialFold(entity) {
  const id = awakeMartialId(entity);
  if (id !== 'shadowdancer' && id !== 'windrunner') return EMPTY_MODS;
  const mods = newMods();
  if (id === 'shadowdancer') {
    mods.stats.agility = N.lightStep.agility;
    mods.skills[SKILLS.Dodging] = N.lightStep.dodging;
  } else {
    mods.stats.speed = N.windborne.speed;
    mods.skills[SKILLS.Running] = N.windborne.running;
    mods.skills[SKILLS.Jumping] = N.windborne.jumping;
  }
  return mods;
}

// ── the riders ──────────────────────────────────────────────────────

/** How many foes this press's rider has answered so far (one token a press - combat/techniques.js `use`), counted on. */
function nthOfUse(use) {
  if (!use || typeof use !== 'object') return 1;
  const n = (_s.uses.get(use) ?? 0) + 1;
  _s.uses.set(use, n);
  return n;
}
/** THE TECHNIQUE LANDED (techniqueBlow.js tellTechniqueLanded): MY awake path's signature reached `foe` for `damage` -
 *  its rider. A form of another path's signature (a character who changed nothing but a save) answers nothing.
 *  @param {{ blow?: any, foe?: any, damage?: number }} [landing] */
export function martialLanded({ blow = null, foe = null, damage = 0 } = {}) {
  const form = signatureById(blow?.id);
  const m = me();
  const id = awakeMartialId(m);
  if (!form || !id || form.path !== id) return;
  const target = foe?.entity;
  if (!foeOf(target)) return;
  const landed = Number.isFinite(damage) && damage > 0 ? damage : 0;
  const now = _now();
  const name = MARTIAL_BY_ID[id].technique.name;
  const left = Number.isFinite(target.health) ? target.health - landed : Infinity;   // the pool's door lands it after
  switch (id) {
    case 'blademaster': if (landed && left > 0) again(target, landed * N.thousandCuts.share, name); break;
    case 'warblade': if (landed) _s.rallyUntil = now + N.rallyingCleave.seconds; break;
    case 'vanguard': if (landed && nthOfUse(blow.use) <= N.judgement.foes) healMine(m, (m.maxHealth * N.judgement.heal) / 100); break;
    case 'ranger': if (landed) _s.marks.set(target, now + N.huntersMark.seconds); break;
    case 'bladedancer': if (landed) _s.quickUntil = now + N.cyclone.seconds; break;
    case 'bloodletter': if (landed && left > 0 && left < target.maxHealth * N.guttingLunge.below) again(target, landed, name); break;
    case 'cutthroat': if (landed && left > 0 && foeUnaware(foe)) again(target, landed * (N.blackjack.times - 1), name); break;
    case 'assassin': if (landed && nthOfUse(blow.use) === 1) castOnMe(name, 23, 0, N.vanishingStrike.rounds); break;
    case 'shadowdancer': if (landed) _s.evadeUntil = now + N.phantomStrike.seconds; break;
    case 'juggernaut': if (landed) _s.guardUntil = now + N.earthsplitter.seconds; break;
    case 'woodsman': if (landed && !(left > 0)) healMine(m, (m.maxHealth * N.fellingStrike.heal) / 100); break;
    case 'berserker': if (landed) _s.leechUntil = now + N.savageWhirl.seconds; break;
    case 'crusader': if (landed && left > 0 && undeadOrDaedra(target)) again(target, landed * N.hallowedStrike.share, name); break;
    case 'brawler': if (landed) _s.dazed.set(target, now + N.knockout.seconds); break;
    case 'windrunner': if (landed && nthOfUse(blow.use) <= N.windstrike.foes) fatigueMine(m, N.windstrike.fatigue); break;
    default: break;
  }
}

// ── registered at import ───────────────────────────────────────────
export const MARTIAL_POWERS = 'martialPowers';
registerWeaponBlowMod(MARTIAL_POWERS, martialBlow);
registerPlayerStrikeListener(MARTIAL_POWERS, martialStrike);
registerSwingPaceMod(MARTIAL_POWERS, martialPace);
registerPlayerDamageMod(MARTIAL_POWERS, martialDamageMod);
registerPlayerBlowEvasion(MARTIAL_POWERS, martialEvade);
registerPlayerHurtListener(MARTIAL_POWERS, martialHurt);
registerMagicRoundHook(MARTIAL_POWERS, martialRound);
registerPlayerKillListener(MARTIAL_POWERS, martialKill);
registerEntityFold(MARTIAL_POWERS, martialFold);
registerTechniqueLandedListener(MARTIAL_POWERS, martialLanded);

/** Tests only: every window and recovery fresh, a clock and dice of their own (seconds; [0, 1)). */
export function _resetMartialPowersForTests() { _s = fresh(); _carry = new WeakMap(); _say = (line) => { hudText(line); }; }
export function _setMartialPowersClockForTests(fn) { _now = typeof fn === 'function' ? fn : () => performance.now() / 1000; }
export function _setMartialPowersRandForTests(fn) { _rand = typeof fn === 'function' ? fn : Math.random; }
