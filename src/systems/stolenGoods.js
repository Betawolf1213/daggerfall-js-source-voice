// @ts-check
// STOLEN-GOODS (FIELD BUGS 2026-10-16, the Discord's "A bug related to infinite...": "you steal something from the shelf
// and can sell it back to an NPC, and he'll put the item back on the shelf again, and it just goes in a circle ...
// completely disrupts the economy ... Also, when you're sent to prison, all the stolen items stay with you and aren't
// taken away"): A STOLEN PIECE CARRIES ITS THEFT.
//
// One flag on the item (`stolen: true`, declared in systems/itemFields.js, so it rides the save, the wire and a realm
// trade as `counterBought` does - a piece handed to another player is no less stolen). It is written at the moment a
// piece is taken from someone else's keeping, at every theft arm:
//   - the open shop's Steal, on either skin (ui/nativeTrade.js _doSteal, ui/enhancedTrade.js runSteal) - its success;
//   - the shut shop's shelf and a stranger's cupboard (scenes/worldModes.js openShelf, the `container:` arm), the
//     inventory window over a loot target the host marks `stolen` (systems/inventorySession.js theftTarget): each take
//     marks the piece BEFORE it lands (systems/itemTransfer.js applyTransfer), and a piece put back there is its
//     owner's again, its mark cleared before it lands.
// Marked before it lands, because a stack merges on the way in (inventory.js addItem): a diff at the window's close (the
// theft basket, systems/theft.js) found the shelf's three arrows gone and the record that held them merged into the
// pack's twenty - the mark had nothing to write on. A stolen piece stacks only with stolen kin and a split keeps the
// mark (inventory.js stacksWith, splitStack). Pickpocketing pinches coin, never a piece; coin carries no mark.
//
// The mark answers two doors:
//   - THE COUNTER (`landSold`): a merchant pays for a stolen piece and is rid of it - it never reaches a shelf, so the
//     thief cannot buy back what they sold and steal it again. An honest sale still lands on the open shelf (Port-Ledger
//     T2: a mistaken sale can be bought back).
//   - THE COURT (systems/court.js confiscateStolen): a guilty verdict takes every stolen piece the character carries.
//
// Not a DFU member: DFU's items carry no theft and its court takes nothing; DaggerfallTradeWindow's Sell discards every
// sold piece (ConfirmTrade's `remoteItems.Clear()`, :1051). This module imports the text core alone (a leaf of the
// item modules' graph: systems/textManager.js imports nothing).
import { t } from './textManager.js';   // L10N4: its two lines are the port's own words

/** The field. */
export const STOLEN_MARK = 'stolen';

/** Whether a piece carries the mark. */
export const isStolen = (/** @type {any} */ item) => !!item && typeof item === 'object' && item[STOLEN_MARK] === true;

/** Mark every piece of a list stolen; answers the list. */
export function markStolen(/** @type {any[]} */ items) {
  for (const it of items ?? []) if (it && typeof it === 'object' && !Array.isArray(it)) it[STOLEN_MARK] = true;
  return items;
}

/** Clear a piece's mark - the field ABSENT, as every other mark's cleared is; answers the piece. */
export function clearStolen(/** @type {any} */ item) {
  if (item && typeof item === 'object') delete item[STOLEN_MARK];
  return item;
}

/** A SOLD PIECE'S LAST STOP. An honest piece lands on the shelf the counter sells from (Port-Ledger T2); a stolen one is
 *  the merchant's to be rid of, and goes nowhere. Answers whether it was shelved. */
export function landSold(/** @type {any[]} */ shelfItems, /** @type {any} */ item) {
  if (isStolen(item)) return false;
  shelfItems.push(item);
  return true;
}

/** How many pieces a list holds - a stack counts its own. */
export const piecesOf = (/** @type {any[]} */ items) => (items ?? []).reduce((n, it) => n + (Number.isInteger(it?.stackCount) && it.stackCount > 0 ? it.stackCount : 1), 0);

/** The court's word for what it took. */
export const confiscatedText = (/** @type {number} */ n) => t('stolen.taken', 'The guards take the stolen goods you carried ({n, plural, one {# item} other {# items}}).', { n });

/** The piece's card line (the enhanced pack's, beside the lock's and the junk's). */
export const stolenLine = () => t('stolen.card', 'Stolen - a merchant buys it only to be rid of it, and the court takes it if you are convicted.');
