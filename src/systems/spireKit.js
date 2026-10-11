// @ts-check
// EG-FULL (2026-10-11, the Elite Gates arc; bible/11-Multiplayer/Elite-Gates.md section 17.4, THE POTION LAW): "No
// natural regeneration" is what makes one life matter, and the port has no potion cooldown anywhere - with fifty potions
// there is no attrition. So in an Elite Breach a member drinks at most two RESTORING potions a hall (a Healing, a Heal
// True, a Purification - the recipes that heal health), refilled at each wake and at the rest; every other potion, and
// every spell, is untouched. Client-enforced like the Burning Court's no-regeneration rule: systems/useItem.js's potion
// arm asks first (the bottle is kept on a refusal) and tells after. The count is the breach client's (scenes/egClient.js
// potionAllowed / potionUsed), registered by the world host. A departure from DFU: Ledger A (ELITE-GATES).
import { POTION_RECIPES, potionRecipeKey } from './potionRecipes.js';

/** The classic Heal-Health effect key (HealHealth.cs - group 10, subgroup 8). */
export const SPIRE_RESTORING_EFFECT = '10,8';
/** The refusal's words. */
export const SPIRE_POTION_TEXT = 'The Spire allows two restoring potions a hall. The next wake or Redoubt fills them again.';

/** The restoring recipes' keys (the effect or a secondary heals health). */
const RESTORING_KEYS = new Set(/** @type {any[]} */ (POTION_RECIPES).filter((r) => r.effect === SPIRE_RESTORING_EFFECT || (r.secondary ?? []).includes(SPIRE_RESTORING_EFFECT)).map((r) => potionRecipeKey(r.ingredients)));
/** Is this potion a restoring one? Pure. */
export const isRestoringPotion = (item) => RESTORING_KEYS.has(item?.potionRecipeKey ?? 0);

/** @type {{ allowed: () => boolean, used: () => void } | null} */
let _law = null;
/** The breach's count, registered by the world host (null removes it). */
export function registerSpirePotionLaw(law) { _law = law && typeof law.allowed === 'function' ? law : null; }
/** The refusal of this potion now, or null. */
export function spirePotionRefusal(item) {
  if (!_law || !isRestoringPotion(item)) return null;
  try { return _law.allowed() ? null : SPIRE_POTION_TEXT; } catch { return null; }
}
/** A potion drunk: a restoring one counted. */
export function spirePotionDrunk(item) {
  if (!_law || !isRestoringPotion(item)) return;
  try { _law.used(); } catch { /* the count is not the bottle's problem */ }
}

/** EG-FULL LAYER TWO: Iron Footing's share off a push on this screen (net/egVestige.js - by: 'client'), registered by the
 *  world host from the breach's client, read by the spans (scenes/egSpan.js - the Gust's push, the Pendulum's touch). */
let _footing = null;
export function registerSpireFooting(fn) { _footing = typeof fn === 'function' ? fn : null; }
export function spireFooting() {
  try { const v = Number(_footing?.() ?? 0); return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0; } catch { return 0; }
}
