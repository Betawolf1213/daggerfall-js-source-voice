// @ts-check
// GRAVE-PARTY (FIELD BUGS 2026-10-16, bible/01-Overview/Field-Bugs-2026-10-16b.md; the Discord's "objects in tombs are un
// lootable"; Mac's SEARCH1-PARTY: "When one player in the party interacted with it no one else can again for 5 hours ...
// visible for everyone in the party the same the looter sees"): A DUNGEON'S SEARCHED OBJECT IS ITS SEARCHER'S PARTY'S.
//
// SEARCH1-PARTY said every search to the WHOLE ROOM as its container (`srch:<i>`, WORLD4's word - scenes/dungeonContext.js
// publishLoot), whatever it rolled, and every client that heard it started its five hours and took the find as its own -
// a stranger who happened to stand in the same crypt too. In a Graveyard's Cemetery (dungeonType 18) every coffin and
// sarcophagus a stranger had touched answered "You have already searched here." for five game hours, to a player who had
// never seen it. Now the word names its SEARCHER (`by`, the account - net/social.js's, the token's subject), and a
// client lands it - its five hours, its find - only when the searcher is itself (another tab, an earlier visit) or of its
// party (systems/searchables.js searchKinOf, the streaming host's party lens). A stranger's word is KEPT, unlanded, and
// carried on in the room's memory when this client is the one that publishes it, so the stranger's own partymates who
// come in later still hear it; and it is read again at the object, so a search made before the party was formed - or
// before the hub's picture came - locks it for the party then. A word with no `by` (an older build's) is its speaker's
// (the peer id's account, a partymate's tab - net/social.js accountOfPeer); one with neither, a stranger's.
//
// THE ONE HOME for whose a `srch:` word is: the dungeon host constructs it once and asks it at applyLoot, at the search,
// at its memory's composition and at its records.
import { searchKinOf, searchAcctOfPeer, searchSelfAcct, searchWhoOf, SEARCH_ACCT_MAX, SEARCH_LOOT_MAX } from '../systems/searchables.js';
import { validLootList } from '../systems/loot.js';
import { peerHanded } from '../systems/peerWord.js';

/** The most strangers' words one client keeps (each about one object, by one searcher), the oldest out first - and the
 *  most about any one object. They ride the room's memory this client publishes (WORLD_FRAME_MAX, 512 KB a dungeon), so
 *  they are bounded hard: */
export const SEARCH_FOREIGN_MAX = 24;
export const SEARCH_FOREIGN_PER_OBJECT = 4;
/** ...and one is kept only as an honest find can be: SEARCH_LOOT_MAX pieces at most, each through the wire's own
 *  projection, its record under this many bytes - a word past either is no search's, and is kept by nobody. */
export const SEARCH_FOREIGN_BYTES = 4096;

/** @param {{ respawnDue: (t: unknown, now: number|null) => boolean, wallNow: () => number|null }} host */
export function createSearchRoom(host) {
  /** `${canon}|${searcher}` -> { rec, from } - the words this client heard and did not land (a stranger's search) */
  const foreign = new Map();
  /** The searcher a word names: its own `by`, else its live speaker's account (an older build's word), else null. */
  const searcherOf = (rec, from) => (typeof rec?.by === 'string' && rec.by.length > 0 && rec.by.length <= SEARCH_ACCT_MAX ? rec.by : searchAcctOfPeer(from));
  /** Whose search a room word about a searched object is to me: `{ acct, kin, who }` - 'me' (who null) or 'party' (who
   *  their name) - or null: a stranger's, or nobody's I can tell. */
  function whose(rec, from = null) {
    const acct = searcherOf(rec, from);
    const kin = searchKinOf(acct);
    return kin ? { acct, kin, who: kin === 'party' ? searchWhoOf(acct) : null } : null;
  }
  /** A stranger's words past the room's hour let go (WORLD8's respawnDue on their stamp), then the oldest past the cap. */
  function prune() {
    const now = host.wallNow();
    for (const [k, e] of [...foreign]) if (host.respawnDue(e.rec.t, now)) foreign.delete(k);
    while (foreign.size > SEARCH_FOREIGN_MAX) foreign.delete(foreign.keys().next().value);
  }
  /** applyLoot's question about a `srch:` word: whose it is - `{ acct, kin, who }` when it is to be landed here, else null,
   *  and then it is KEPT unlanded (the room's memory carries it on; the object reads it again). */
  function ours(canon, rec, from = null) {
    const w = whose(rec, from);
    if (w) return w;
    const acct = searcherOf(rec, from);
    const items = peerHanded(validLootList(rec?.r));
    if (!items || items.length > SEARCH_LOOT_MAX) return null;   // no search's find: kept by nobody
    const kept = { k: canon, r: items, ...(Number.isFinite(rec.t) ? { t: rec.t } : {}), ...(acct ? { by: acct } : {}) };
    if (JSON.stringify(kept).length > SEARCH_FOREIGN_BYTES) return null;
    const k = `${canon}|${acct ?? (typeof from === 'string' ? `peer:${from}` : '?')}`;
    foreign.delete(k);
    foreign.set(k, { rec: kept, from });
    const about = [...foreign.keys()].filter((x) => x.startsWith(`${canon}|`));
    for (const x of about.slice(0, Math.max(0, about.length - SEARCH_FOREIGN_PER_OBJECT))) foreign.delete(x);
    prune();
    return null;
  }
  /** At the object: the words kept about `srch:<i>`, read again against my party as it stands now - each that is mine or
   *  my party's now is let go and handed to `land` (applyLoot's own door). */
  function adopt(i, land) {
    const head = `srch:${i}|`;
    for (const [k, e] of [...foreign]) {
      if (!k.startsWith(head) || !whose(e.rec, e.from)) continue;
      foreign.delete(k);
      land(e.rec, e.from);
    }
  }
  /** The searcher a search of MINE names - my account, or nobody where the lens has none. */
  const mine = () => searchSelfAcct();
  /** The fields a `srch:` record carries for the searchable holding it: its searcher's account. */
  const fields = (sb) => (typeof sb?.by === 'string' && sb.by ? { by: sb.by } : {});
  /** The strangers' words, for the room's memory this client publishes (every one still inside the room's hour). */
  function records() { prune(); return [...foreign.values()].map((e) => ({ ...e.rec })); }
  return { whose, ours, adopt, mine, fields, records };
}
