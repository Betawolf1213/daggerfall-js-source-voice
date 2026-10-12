// @ts-check
// EG-ZR (2026-10-12, the Elite Gates arc; bible/11-Multiplayer/Elite-Gates.md section 15, EG-ZP's "Not built"): THE
// VESTIGES ON THEIR HOLDER - every Vestige section 15 gives its holder's own client, applied on the holder's screen while it
// stands alive in an Elite Breach holding it, each through the door the port already has for its kind, and let go at every
// way out:
//   STONESKIN       +10 / 18 / 25% maximum health - the live maximum's online term (systems/renownLayer.js setSpireHp,
//                   read by systems/chargen.js defineLiveMaxHealth), the fraction kept as it goes on and off; the room's
//                   shares of a body stay shares of the body without it (spireBodyMax), so the points are a cushion;
//   SECOND WIND     once a hall, a hurt that takes me under 30% heals 15 / 25 / 35% - a hurt listener on the one damage
//                   door (characters/playerEntity.js registerPlayerHurtListener), never a killing blow a save turned aside;
//   SPELLBANE       every resistance +10 / 18 / 25 - the resist channel's fold (systems/entityMods.js) on each element the
//                   saving throw names (systems/lootRarity.js RESIST_ELEMENTS), as the Battlemage's Bearing rides it;
//   BATTLEMAGE'S FOCUS  spell cost -10 / 18 / 25% - the cost modifiers (systems/spellcost.js registerSpellCostMod);
//   SHIELDWEAVER    my own Shield spell soaks +20 / 35 / 50% - the Shield pool's soak (characters/playerEntity.js
//                   registerShieldSoakMod), a party mate's Shield on me as it was;
//   FLEETFOOT       run speed +4 / 7 / 10% - the run's modifiers (player/motor.js registerRunSpeedMod);
//   FEATHERSTEP     my crumbles wait +0.2 / 0.35 / 0.5 s (scenes/egSpan.js reads spireCrumbleWait); its cast-back cost is
//                   the census's own law (net/egBrain.js egCastBackCost, scenes/egClient.js castBack);
//   and ON A BLOW of mine on a Spire body - SEARING EDGE, MOMENTUM, BLOODIED FURY, OVERCHARGE (egHolderBlow) and ARCANE
//   ECHO's repeat - at the one door every such blow leaves by (scenes/egFight.js hostHit), where the relay's bucket, grown
//   by the declared factor (net/egVestige.js egDeclaredX), meets the claim.
// The holder - `{ entity, vs, mast, b, h }`, its Vestiges as the room says its run - is handed in every frame by the
// breach's client (scenes/egClient.js, spireHolderStep): null outside the Spire, as a witness, or once the room counts me
// out, and every door here then answers as if nothing were held. Every number is net/egVestige.js's, never declared again.
//
// Not a DFU member. Ledger A (ELITE-GATES).
import { egVOf, EG_SECOND_WIND_UNDER, EG_MOMENTUM_STEP } from '../net/egVestige.js';
import { HIT_KINDS } from '../net/gateBrain.js';
import { registerEntityFold, computeEntityMods, newMods, EMPTY_MODS } from './entityMods.js';
import { RESIST_ELEMENTS } from './lootRarity.js';   // the five elements the resistance channel names (EG15's Bearing reads them too)
import { registerSpellCostMod } from './spellcost.js';
import { registerPlayerHurtListener, registerShieldSoakMod } from '../characters/playerEntity.js';
import { registerRunSpeedMod } from '../player/motor.js';
import { setSpireHp, spireBodyMax } from './renownLayer.js';
import { healMine } from './playerHeal.js';

/** The registries' one name. */
export const SPIRE_VESTIGES = 'spire-vestiges';

/** @type {{ entity: any, vs: number[][], mast: number, b: string, h: number } | null} the holder this frame */
let _held = null;
/** Spellbane's value the fold last answered (a change folds the entity again); the breach's hall Second Wind was spent in */
let _bane = 0, _wind = '';

/** The holder's value of a Vestige (0 none, or nothing held, or another entity). */
const heldV = (key, entity = _held?.entity) => (_held && entity === _held.entity ? egVOf(_held.vs, key) : 0);

/**
 * THE HOLDER, THIS FRAME (scenes/egClient.js, every frame and at `away`): `holder` - `{ vs, mast, b, h }` while I stand
 * alive in the breach the room counts me in, null otherwise. Stoneskin's points put on the entity (or taken off - the
 * fraction kept), and Spellbane's fold folded again when its value moved; every other door reads the holder live.
 * @param {any} entity @param {{ vs: number[][], mast: number, b: string, h: number } | null} holder
 */
export function spireHolderStep(entity, holder) {
  _held = holder && entity ? { entity, vs: holder.vs ?? [], mast: holder.mast ?? -1, b: holder.b ?? '', h: holder.h | 0 } : null;
  if (!entity) return;
  const skin = heldV('stoneskin', entity);
  setSpireHp(entity, skin ? Math.round(spireBodyMax(entity) * skin) : 0);
  const bane = heldV('spellbane', entity);
  if (bane !== _bane) { _bane = bane; computeEntityMods(entity); }
}
/** The holder as this frame has it (tests). */
export const spireHeld = () => _held;

/** FEATHERSTEP: how much longer my crumbles wait (s) - 0 with none held. */
export const spireCrumbleWait = () => heldV('featherstep');

/**
 * A BLOW OF THE HOLDER'S ON A SPIRE BODY (section 15's client Vestiges on a blow): `d` what the game's own law dealt, `r` its
 * kind (net/gateBrain.js HIT_KINDS). Searing Edge's fire on a melee blow (whole: every body of the Spire is the relay's,
 * which keeps no element, and its stand-in takes fire whole), then Momentum's `stacks` on that body (its rank's cap at
 * most), Bloodied Fury while `low` (under half my health), Overcharge on a spell. Pure.
 * @param {number[][]} vs @param {number} d @param {number} r @param {{ stacks?: number, low?: boolean }} [o]
 */
export function egHolderBlow(vs, d, r, { stacks = 0, low = false } = {}) {
  let x = d;
  if (r === HIT_KINDS.Melee) x += egVOf(vs, 'searing');
  x *= 1 + EG_MOMENTUM_STEP * Math.min(stacks, egVOf(vs, 'momentum'));
  if (low) x *= 1 + egVOf(vs, 'bloodied');
  if (r === HIT_KINDS.Spell) x *= 1 + egVOf(vs, 'overcharge');
  return x;
}

// ── the doors ───────────────────────────────────────────────────────────────────────────────────────────────────────
/** SPELLBANE: every element the resistance channel names, +its value (the saving throw - systems/spellcast.js). */
function baneFold(entity) {
  const v = heldV('spellbane', entity);
  if (!v) return EMPTY_MODS;
  const m = newMods();
  for (const el of RESIST_ELEMENTS) m.resist[el] = v;
  return m;
}
/** BATTLEMAGE'S FOCUS: my cast's spell points less its share (the cost door rounds, and never under 1). */
const focusCost = (entity, sp) => { const v = heldV('focus', entity); return v ? sp * (1 - v) : sp; };
/** SHIELDWEAVER: a point of my own Shield's pool soaks 1 + its share - a Shield I cast on myself (a mate's gift, ALLY-CAST's,
 *  lands with no caster and is no self-cast). */
const weaverSoak = (entity, a) => (a?.bundleSelfCast ? 1 + heldV('shieldweaver', entity) : 1);
/** FLEETFOOT: the run on foot +its share. */
const fleetRun = () => 1 + heldV('fleetfoot');
/** SECOND WIND: a hurt that takes me under EG_SECOND_WIND_UNDER of my maximum heals its share of it - once a hall of the
 *  breach, never on a killing blow a death save turned aside (`saved`). */
function secondWind(entity, { before, after, saved = false }) {
  const v = heldV('secondwind', entity), max = entity?.maxHealth;
  if (!v || saved || !(after > 0) || !(max > 0)) return;
  const line = max * EG_SECOND_WIND_UNDER, hall = `${_held?.b}:${_held?.h}`;
  if (!(before >= line && after < line) || _wind === hall) return;
  _wind = hall;
  healMine(entity, max * v);
}

registerEntityFold(SPIRE_VESTIGES, baneFold);
registerSpellCostMod(SPIRE_VESTIGES, focusCost);
registerShieldSoakMod(SPIRE_VESTIGES, weaverSoak);
registerRunSpeedMod(SPIRE_VESTIGES, fleetRun);
registerPlayerHurtListener(SPIRE_VESTIGES, secondWind);

/** Tests only: nothing held, nothing spent. */
export function _resetSpireVestigesForTests() { _held = null; _bane = 0; _wind = ''; }
