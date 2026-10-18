// HOST-SPLIT: moved verbatim out of src/scenes/worldModes.js's createWorldModes (bible/01-Overview/Host-Split.md) by tools/hostMove.mjs.
// The host constructs it where the code stood. What it reads of the host's scope comes through `h`: the
// settled names by value at construction, every live one (a `let` someone writes, a `const` made below) read at its
// use as `h.<name>` - as the code read them where it was.
import { interiorLootKeyOf, interiorLootRecords } from '../world/interior/interiorShared.js';
import { LOOT_NEWER_TEXT } from '../systems/loot/loot.js';
import { setMidScreenText } from '../ui/midScreenText.js';

/** @param {any} h */
export function createInteriorLootHost(h) {
  const {
    host
  } = h;
  /** WORLD4's law for a building: the container is the room's - said on the OPEN, which CLAIMS it (a claim speaks
   *  only for a container the room has not spoken about, AUDIT WORLD4 C2/D5), on a RESTOCK (the new day's stock is
   *  the room's, whoever browsed first), and on the CLOSE (what is left). */
  function interiorPublishLoot(key, { claim = false } = {}) {
    const s = h._intShared;
    const canon = interiorLootKeyOf(key);
    if (!s?.locationKey || !canon || !h.interiorCtx || s.home) return false;   // HOME1: a home's cupboards are never the room's
    if (s.unreadable?.has(canon)) return false;   // AUDIT SETS M2: never over a word this build cannot read
    if (claim && s.seen.has(canon)) return false;
    const l = interiorLootRecords(h.interiorCtx, [canon], s.tooBig);
    if (!l.length) return false;   // never opened, or too large to say - it stays this player's own
    const first = !s.seen.has(canon);
    s.seen.add(canon);
    if (first) host.onLootClaimed?.();   // AUDIT WORLD4 D5: the memory goes out now, not up to fifteen seconds from now
    return !!host.onActions?.({ k: s.locationKey, l });
  }
  /** A window opened on a container: the claim, and the window remembered so its close - through WHICHEVER of the
   *  slot's drains frees it (a trade window has no close hook of its own, X6) - says what is left.
   *  AUDIT WORLD6a A5 (WORLD4 C6 again): a RESTOCK is said HERE, at the window's mount, not where the roll was made -
   *  the container arm rolled a stranger's cupboard before the private-property prompt, so a player who answered No
   *  (DFU: "No claims nothing") had already told the room the cupboard's whole contents; `fresh` is the arm's word
   *  that this open rolled the new day's stock, and then the word is not a claim but the room's new stock. */
  function interiorLootOpened(key, win, { fresh = false } = {}) {
    const s = h._intShared;
    const canon = interiorLootKeyOf(key);
    if (!s?.locationKey || !canon || !win) return;
    if (s.unreadable?.has(canon)) setMidScreenText(LOOT_NEWER_TEXT);   // AUDIT SETS M2: what is shown is this build's own roll, and it is never said to the room
    s.openKey = canon; s.openWin = win;
    interiorPublishLoot(canon, { claim: !fresh });
  }
  /** Every interior frame: the open container's window is GONE - the close's word.
   *  AUDIT WORLD6a A3 (CRITICAL): gone means gone from the STACK, not from the slot. `interiorOverlay` mirrors the TOP
   *  of interiorWindows and mountInterior PUSHES (ROAD-B B1), so a quest popup, an inventory or a text box laid over
   *  an open shelf made the slot another window while the shelf's stood beneath, still bound to its rows: the close
   *  went out mid-transaction, `openKey` was cleared, a peer's word then landed under the live window (AUDIT WORLD4
   *  C1's orphaned rows: an item taken twice), and the two theft comparisons read a shelf the room had moved - a
   *  peer's purchase made this player a thief. The stack is asked whether the window still exists. */
  function interiorLootSettle() {
    const s = h._intShared;
    if (!s?.openWin) return;
    if (h.interiorWindows.containsWindow(s.openWin) && !s.openWin.done) return;
    const k = s.openKey;
    s.openKey = null; s.openWin = null;
    interiorPublishLoot(k);
  }
  return { interiorLootOpened, interiorLootSettle };
}
