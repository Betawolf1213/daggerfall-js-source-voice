// @ts-check
// THE REALM'S HOLDS, SAID TO THE PLAYER (INT3; AUTO-HOLD, 2026-10-16 - Mac: "We need to figure out a better system for
// trade banning. I dont want to have to manually review"; bible/06-Systems/Integrity-Arc.md AUTO-HOLD). The realm session
// (systems/realmSaves.js) hears two things from a landed checkpoint: the hold on the character's trade as it moves
// (onTradeHeld - the law's piece named, or a timed hold's end) and the pieces the ledger locked (onPiecesLocked - copies
// found, locked piece by piece; the character trades on). bootWorld wires both here, one line (HOST-SPLIT).
import { tradeHeldNotice, piecesByKey } from '../systems/itemIds.js';
import { itemLongName } from '../systems/itemInfo.js';
import { t } from '../systems/textManager.js';   // L10N4: the notice in the player's language

/** How many locked pieces one notice names; the rest are counted. */
const NAMED_MAX = 3;

/** AUTO-HOLD: the notice for locked pieces, in the player's language - `names` the pieces found in the character's own
 *  lists, `count` how many were locked in all (a piece set out in a room, a boat's hold, is locked as well, and named by
 *  none). Null for none. */
export function piecesLockedNotice(/** @type {string[]} */ names, /** @type {number} */ count) {
  if (!(count > 0)) return null;
  if (count === 1) {
    return names[0]
      ? t('realm.locked.named', 'A copy of your {name} was found in the realm, so that piece is locked: it cannot be traded, sold to other players or stored for others. Your other pieces and your trading are not affected.', { name: names[0] })
      : t('realm.locked.one', 'A copy of one of your pieces was found in the realm, so that piece is locked: it cannot be traded, sold to other players or stored for others. Your other pieces and your trading are not affected.');
  }
  const shown = names.slice(0, NAMED_MAX);
  if (!shown.length) return t('realm.locked.many', 'Copies of {n, number} of your pieces were found in the realm, so those pieces are locked: they cannot be traded, sold to other players or stored for others. Your other pieces and your trading are not affected.', { n: count });
  const more = count - shown.length;
  const list = more > 0 ? t('realm.locked.listMore', '{names}, and {n, number} more', { names: shown.join(', '), n: more }) : shown.join(', ');
  return t('realm.locked.manyNamed', 'Copies of {n, number} of your pieces ({list}) were found in the realm, so those pieces are locked: they cannot be traded, sold to other players or stored for others. Your other pieces and your trading are not affected.', { n: count, list });
}

/**
 * Wire `session`'s two notices to `say`, naming pieces from `entity`'s own lists.
 * @param {any} session @param {{ say: (text: string) => void, entity: any }} deps
 */
export function wireRealmHolds(session, { say, entity }) {
  if (!session) return;
  session.onTradeHeld = (/** @type {string | null} */ prev, /** @type {string | null} */ now, /** @type {any} */ why) => { const text = tradeHeldNotice(prev, now, why); if (text) say(text); };
  session.onPiecesLocked = (/** @type {string[]} */ keys) => {
    const text = piecesLockedNotice(piecesByKey(entity, keys).map((it) => itemLongName(it)), keys.length);
    if (text) say(text);
  };
}
