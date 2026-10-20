// @ts-check
// STAR8 (2026-10-20; bible/11-Multiplayer/Starfall.md section 7): THE HUB'S LIVE EVENT, AS LAST SAID - for a reader that
// holds no socket of its own. The hub socket's one door (net/online.js `_setEvent`, EVENT1) writes it here as it writes
// its own `liveEvent`, so the questlines' runner (systems/questlines/qlLineRunner.js NEED_CHECKS, a seasonal line's
// `opens.event`) asks whether the Witches' Festival is staged without a host handing it a session. Offline it is null,
// and a line that waits on an event waits.
//
// A LEAF: it imports nothing. Not a DFU member - Daggerfall Unity has no live events. Ledger A (STARFALL).

/** @type {{ kind: string, at: number } | null} */
let _event = null;
/** The socket whose word it is: a socket that leaves takes its own word with it, never another's (a hub socket made
 *  anew - a tab's link opened again - says the event before the old one's leave is heard). */
let _by = null;

/** The live event the hub last said - `{ kind, at }` - or null (none staged, or no hub heard). */
export const liveEventNow = () => _event;

/** The hub socket's word (net/online.js `_setEvent`): the event now, or null - `by` the socket saying it. A null from a
 *  socket whose word this is not is no word. */
export function setLiveEventNow(ev, by = null) {
  const next = ev && typeof ev === 'object' && typeof ev.kind === 'string' ? Object.freeze({ kind: ev.kind, at: Number(ev.at) || 0 }) : null;
  if (!next && _by !== null && by !== _by) return;
  _event = next;
  _by = next ? by : null;
}
