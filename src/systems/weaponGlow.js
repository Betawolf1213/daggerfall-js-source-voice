// @ts-check
// WEAPON-GLOW1 (2026-10-16, Mac: "What if we designed our own sort of animated outline for each element? And even
// introduced the same, more detailed design for the morrowind weapons?" ... "this is your baby. I want you to make the
// decisions"): WHAT A WEAPON'S GLOW SAYS. bible/05-Combat/Weapon-Glow.md is the page.
//
// Daggerfall says one thing about a weapon in the hand: enchanted or not. ItemHelper.ConvertItemToAPIWeaponType
// promotes an enchanted item to its *_Magic type and the rig swings the WEAPO1xx sheet, the same frames painted with a
// glow (combat/fpsWeapon.js weaponTypeForItem). The loot ladder's weapons carry more than that - a blow of fire, frost
// or shock (LOOT4's `elemental` line, a Ruby's or a Sapphire's gem) - and the hand said none of it: a Magic blade with
// "+3 Fire damage" swung the plain sheet (it carries no DFU enchantment), and every Morrowind weapon swung bare.
//
// THE LAW, decided here once for every drawer (the classic sprite's outline, combat/weaponGlowSprite.js; the Morrowind
// mesh's shell, render/weaponGlowShell.js):
//   1. THE ELEMENT IS THE BLOW'S. A weapon's element is what its blow carries - its `elemental` lines, rolled or
//      socketed, read as the blow reads them (lootRarity.js readLines: a gem's line within its piece's cap). Nothing
//      else names one: a Legendary's power (Venom, Dragonfire, Chain Lightning) is its record's own, and a
//      cast-when-strikes enchantment is a spell.
//   2. ONE ELEMENT SHOWS - the most of it; a tie goes in PROC_ELEMENTS' order (fire, frost, shock).
//   3. ITS STRENGTH IS THE BAND IT READS IN: 1 for a Magic line's 1-3, 2 for a Rare's 3-6 (4-6), 3 past it - the
//      Legendary band, or a line and its gems together.
//   4. THE OUTLINE SAYS NO MORE THAN THE CARD. An unidentified piece's "Unidentified" hides every line (lootRarity.js
//      rarityKnown), and the hand hides its element with it: the classic rig swings what DFU swings (the WEAPO1xx
//      sheet, it is enchanted), the Morrowind hand the arcane glow.
//   5. ARCANE IS THE MORROWIND HAND'S OWN: an enchanted weapon with no element showing takes the enchanted look the
//      classic hand takes off its WEAPO1xx sheet - the Morrowind models have no second sheet, so it is drawn.
//   6. THE SWITCH: `weaponGlow` (the Features row, systems/features.js), on by default; `?weaponglow=off` the kill door.
//      The loot ladder's own switch answers first - off, no line is read (lootPowers.js linesOf), so no element shows.

import { readLines, validAffix, PROC_ELEMENTS, lootRarityOn, rarityKnown } from './lootRarity.js';
import { isEnchanted } from './inventory.js';
import { getPref } from './uiPrefs.js';
import { pageParam } from './pageQuery.js';
import { GLOW_SPRITE_WINDOW } from '../render/weaponGlowGlsl.js';   // the sprite's search window - a leaf with no imports
import { LOOK_GLOW_RE } from '../net/wire.js';   // the wire's word for a glow - the relay's bound, so one home

/** The pref the Features row stores. */
export const WEAPON_GLOW_PREF = 'weaponGlow';

/** The switch: the pref, and no kill door on the URL. Injectable for tests. */
export function weaponGlowOn(search = globalThis.location?.search ?? '', pref = getPref(WEAPON_GLOW_PREF)) {
  if (pageParam('weaponglow', search) === 'off') return false;
  return pref !== false;
}

/** The looks, by the code the shaders read (`uGlowLook`): 0 is none. */
export const GLOW_LOOKS = Object.freeze(['none', 'fire', 'frost', 'shock', 'arcane']);
export const GLOW_CODE = Object.freeze(Object.fromEntries(GLOW_LOOKS.map((k, i) => [k, i])));

/** Law 3: the strength a total reads at - the elemental bands' own edges (lootRarity.js AFFIX_RANGES.elemental). */
export const GLOW_LEVEL_EDGES = Object.freeze([3, 6]);
export const glowLevel = (total) => (total <= GLOW_LEVEL_EDGES[0] ? 1 : total <= GLOW_LEVEL_EDGES[1] ? 2 : 3);

/**
 * Law 1 and 2: the element a weapon's blow carries, and how much - `{ element, total }`, or null. Law 4: null for a
 * piece whose lines are not yet known, and with the ladder off.
 * @param {any} item
 * @param {{ ladder?: boolean }} [opts]
 */
export function weaponElement(item, { ladder = lootRarityOn() } = {}) {
  if (!ladder || !item || !Array.isArray(item.affixes) || !rarityKnown(item)) return null;
  /** @type {Record<string, number>} */
  const sum = {};
  for (const a of readLines(item)) {
    if (a?.id !== 'elemental' || !validAffix(a)) continue;
    sum[a.param] = (sum[a.param] ?? 0) + a.value;
  }
  let best = null;
  for (const el of PROC_ELEMENTS) if ((sum[el] ?? 0) > 0 && (!best || sum[el] > best.total)) best = { element: el, total: sum[el] };
  return best;
}

/**
 * THE ONE ANSWER every drawer asks: the look a weapon in the hand wears, `{ look, level }`, or null for none. `arcane`
 * (law 5) asks for the enchanted look where no element shows - the Morrowind hand's; the classic hand's is its sheet.
 * @param {any} item
 * @param {{ arcane?: boolean, on?: boolean, ladder?: boolean }} [opts]
 */
export function weaponGlow(item, { arcane = false, on = weaponGlowOn(), ladder = lootRarityOn() } = {}) {
  if (!on || !item) return null;
  const el = weaponElement(item, { ladder });
  if (el) return { look: el.element, level: glowLevel(el.total) };
  if (arcane && isEnchanted(item)) return { look: 'arcane', level: 2 };
  return null;
}

/**
 * THE LOOKS' COLOURS, the one table both drawers read: four stops each, dark to hot, linear 0..1 RGB. The sprite's
 * outline steps through them in Daggerfall's own way (a ramp of a few palette shades, never a smooth blend); the
 * Morrowind shell mixes them. Fire is an ember's red to a flame's white heart; frost a deep glacier blue to rime;
 * shock an indigo to a spark's violet-white; arcane the Thunderlock's enchanted blue-violet (thunderlockArt.js
 * MAGIC_TINT) - the one enchanted look the port already drew.
 */
export const GLOW_RAMPS = Object.freeze({
  fire: Object.freeze([[0.45, 0.06, 0.02], [0.88, 0.27, 0.04], [1.0, 0.62, 0.12], [1.0, 0.93, 0.62]]),
  frost: Object.freeze([[0.08, 0.2, 0.52], [0.25, 0.55, 0.92], [0.6, 0.85, 1.0], [0.92, 0.98, 1.0]]),
  shock: Object.freeze([[0.22, 0.1, 0.55], [0.48, 0.32, 1.0], [0.75, 0.7, 1.0], [0.97, 0.95, 1.0]]),
  arcane: Object.freeze([[0.3, 0.26, 0.78], [0.38, 0.5, 1.0], [0.6, 0.76, 1.0], [0.88, 0.94, 1.0]]),
});

/** The ramp of a look, flat - twelve floats, the `uRamp[4]` a shader takes. Null for none. */
export function glowRampFlat(look) {
  const r = Object.hasOwn(GLOW_RAMPS, look) ? GLOW_RAMPS[/** @type {keyof typeof GLOW_RAMPS} */ (look)] : null;
  return r ? new Float32Array(r.flat()) : null;
}

/** A look at a level as a drawer takes it - `{ look, code, level, ramp, win }` (`win` the sprite's search window,
 *  render/weaponGlowGlsl.js GLOW_SPRITE_WINDOW) - built once a pair and frozen, so a frame asks and allocates nothing. */
const _specs = new Map();
export function glowSpec(look, level) {
  const key = `${look}:${level}`;
  let s = _specs.get(key);
  if (!s && GLOW_CODE[/** @type {keyof typeof GLOW_CODE} */ (look)] > 0) {
    s = Object.freeze({ look, code: GLOW_CODE[/** @type {keyof typeof GLOW_CODE} */ (look)], level, ramp: glowRampFlat(look), win: GLOW_SPRITE_WINDOW[/** @type {keyof typeof GLOW_SPRITE_WINDOW} */ (look)] });
    _specs.set(key, s);
  }
  return s ?? null;
}

/** THE CLASSIC HAND'S ASK: the outline its sprite wears (an element alone - its enchanted look is its WEAPO1xx sheet),
 *  or null. When this answers, the rig swings the PLAIN sheet (combat/fpsWeapon.js plainWeaponType): the element is
 *  the more that is known, and a fire outline round a sheet painted with the blue glow says two things at once. */
export function spriteGlow(item, opts = {}) {
  const g = weaponGlow(item, { ...opts, arcane: false });
  return g ? glowSpec(g.look, g.level) : null;
}

/** THE MORROWIND HAND'S ASK: its element, or the arcane look for an enchanted weapon with none showing (law 5). */
export function meshGlow(item, opts = {}) {
  const g = weaponGlow(item, { ...opts, arcane: true });
  return g ? glowSpec(g.look, g.level) : null;
}

/** THE WIRE'S WORD for a held weapon's glow - `fire2`, `arcane2` - and back (net/wire.js LOOK_ITEM_FIELDS `glow`): a
 *  peer's body is drawn from it, since its affixes never travel. Anything else reads as none. */
export const glowWord = (spec) => (spec ? `${spec.look}${spec.level}` : null);
export function glowFromWord(word) {
  const m = typeof word === 'string' ? LOOK_GLOW_RE.exec(word) : null;
  return m ? glowSpec(m[1], Number(m[2])) : null;
}
