// @ts-check
// THE REALM'S HOLDS, SAID TO THE PLAYER (INT3; AUTO-HOLD, 2026-10-16 - Mac: "We need to figure out a better system for
// trade banning. I dont want to have to manually review"; bible/06-Systems/Integrity-Arc.md AUTO-HOLD). The realm session
// (systems/realmSaves.js) hears two things from a landed checkpoint: the hold on the character's trade as it moves
// (onTradeHeld - the law's piece named, or a timed hold's end) and the pieces the ledger locked (onPiecesLocked - copies
// found, locked piece by piece; the character trades on). bootWorld wires both here, one line (HOST-SPLIT).
import { tradeHeldNotice, piecesByKey } from '../systems/itemIds.js';
import { itemLongName } from '../systems/itemInfo.js';

/** How many locked pieces one notice names; the rest are counted. */
const NAMED_MAX = 3;
const LOCKED_TAIL = 'it cannot be traded, sold to other players or stored for others. Your other pieces and your trading are not affected.';

/** AUTO-HOLD: the notice for locked pieces - `names` the pieces found in the character's own lists, `count` how many
 *  were locked in all (a piece set out in a room, a boat's hold, is locked as well, and named by none). */
export function piecesLockedNotice(/** @type {string[]} */ names, /** @type {number} */ count) {
  if (!(count > 0)) return null;
  if (count === 1) return `A copy of ${names[0] ? `your ${names[0]}` : 'one of your pieces'} was found in the realm, so that piece is locked: ${LOCKED_TAIL}`;
  const shown = names.slice(0, NAMED_MAX);
  const more = count - shown.length;
  const list = shown.length ? ` (${shown.join(', ')}${more > 0 ? `, and ${more} more` : ''})` : '';
  return `Copies of ${count} of your pieces${list} were found in the realm, so those pieces are locked: ${LOCKED_TAIL.replace('it cannot', 'they cannot')}`;
}

/**
 * Wire `session`'s two notices to `say`, naming pieces from `entity`'s own lists.
 * @param {any} session @param {{ say: (text: string) => void, entity: any }} deps
 */
export function wireRealmHolds(session, { say, entity }) {
  if (!session) return;
  session.onTradeHeld = (/** @type {string | null} */ prev, /** @type {string | null} */ now, /** @type {any} */ why) => { const t = tradeHeldNotice(prev, now, why); if (t) say(t); };
  session.onPiecesLocked = (/** @type {string[]} */ keys) => {
    const t = piecesLockedNotice(piecesByKey(entity, keys).map((it) => itemLongName(it)), keys.length);
    if (t) say(t);
  };
}
