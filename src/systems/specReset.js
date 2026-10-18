// @ts-check
// SPEC-RESET (2026-10-18, the owner: "Lets allow players to reset their ingame builds for a high cost"; asked, the owner
// chose the specialisations and 200k; bible/10-UI/Growth.md section 10) - A SPECIALISATION GIVEN UP, FOR GOLD. An arcane
// path (systems/arcanePaths.js) or a martial one (systems/martialPaths.js) had been chosen once and for good; this is
// the one way back: the family's path is cleared, so the guide (ui/growth/specGuide.js) offers every path the
// character's masteries open again. The masteries stay - a mastery is still permanent (masterSkills.js) - and so does
// the spellbook: a signature spell whose path is not held is the plain bundle the spell maker could make (arcanePaths.js
// pathCastSchool, arcanePowers.js), and the judge reads no signature spell (pathFindings).
//
// THE PRICE is one flat SPEC_RESET_GOLD a family (arcanePaths.js), whatever the level - twenty times the Firmament's
// whole-sky respec (net/firmament/firmamentLaw.js FIRM_RESPEC_GOLD). It is paid as every purchase is paid (court.js deductGold - DFU's
// PlayerEntity.DeductGoldAmount: the coins, else the letters of credit and then the coins), and refused when coins and
// letters together fall short (totalGoldAmount - GetGoldAmount, what a shop or a trainer asks). The path is the save's
// alone (no service holds it), so the purse and the path move in one save, together.
//
// A leaf of its own, not the paths' laws: arcanePaths.js is bundled into the account Worker (judge.js), and court.js -
// whose imports the Worker does not bundle - must never reach it.

import { pathOf, SPEC_RESET_GOLD } from './arcanePaths.js';   // the price's one home, where the choice boxes name it
import { martialPathOf } from './martialPaths.js';
import { totalGoldAmount, deductGold } from './court.js';
import { t } from './textManager.js';

/** Each family's held path and the field that keeps it. */
const LAW = Object.freeze({
  arcane: { held: pathOf, field: 'arcanePath' },
  martial: { held: martialPathOf, field: 'martialPath' },
});

/** The path `family` holds on this entity, or null. */
export const resetHeld = (entity, family) => (Object.hasOwn(LAW, family) ? LAW[family].held(entity) : null);

/** Why `family`'s path cannot be reset now, or null when it can: no such family, nothing held, or too little gold. */
export function specResetRefusal(entity, family) {
  if (!Object.hasOwn(LAW, family)) return t('growth.spec.reset.refuse.none', 'No such specialisation.');
  const held = resetHeld(entity, family);
  if (!held) return t('growth.spec.reset.refuse.nothing', 'You have no specialisation of this kind to reset.');
  const have = totalGoldAmount(entity);
  if (have < SPEC_RESET_GOLD) return t('growth.spec.reset.refuse.gold', 'Resetting costs {gold, number} gold. You have {have, number}.', { gold: SPEC_RESET_GOLD, have });
  return null;
}

/** Reset it: pay SPEC_RESET_GOLD and clear the family's path. Returns { ok, text }. */
export function resetSpec(entity, family) {
  const why = specResetRefusal(entity, family);
  if (why) return { ok: false, text: why };
  const held = resetHeld(entity, family);
  deductGold(entity, SPEC_RESET_GOLD);
  entity[LAW[family].field] = null;
  return { ok: true, text: t('growth.spec.reset.done', '{name} reset. You can choose a new specialisation.', { name: held.name }) };
}
