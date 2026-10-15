// @ts-check
// PARTY-LOOT (2026-10-14, the field - "Loot | Data Sync Bug?": "In a dungeon with multiple people OR party, each of us
// DO NOT see the same loot on Mobs/Containers/Floor etc." - and Mac, asked: "I want a delicate balance... the best of
// both worlds", then "Shared base + personal bonus"): A ROOM'S CONTAINER IS ONE LIST FOR EVERYONE IN IT, AND EACH
// PLAYER'S OWN LUCK AND RENOWN ADD A LAYER ONLY THEY SEE.
//
// WHY IT WAS BROKEN. WORLD4 let every client roll a dungeon's containers on its own dice and its own player
// (Math.random, the player's level, Luck and Renown) and made a container the room's at its first OPEN, the first
// opener's roll adopted by the rest. The plaque (PX21c) and Quick Loot (QUICK-LOOT B4) then showed and took from a
// container nobody had opened: every player saw their own roll, and the first take sent the taker's leftover list to the
// room, which replaced everyone else's whole.
//
// THE LAW NOW (bible/06-Systems/Online-Arc.md PARTY-LOOT, and WORLD4's LAW rewritten):
// - THE BASE. A room's container - a layout pile (`loot:<i>`), a layout body (`corpse:<i>`), a rest encounter's body
//   (`enc:<n>`) - has ONE base list, which every client COMPUTES: the container's chain run on dice seeded by its NAME
//   (the room, the container's key and its generation - roomContainerName) and on the room's TERMS, never a player's:
//   the party's level fixed at the container's birth (`lv`), a gender drawn off the name, Luck 50, RENOWN-LOOT's first
//   stage, no finder's multiplier, and every mod read as the room's whole (onlineLane.js asTheRoom). Nothing of the base
//   crosses the wire but its terms: they ride the room's own words (WORLD4's act frame and the memory), minted ONCE - by
//   the room's host at the container's birth (a pile at the room's, a body at its death), and by another client only
//   when no host word has come (ROOM_TERMS_WAIT_MS); two mints for one generation agree by roomTermsBeat, the earlier.
// - THE TAKES. The room's word about a container is no longer its list: it is the takes against the shared one - the
//   base pieces gone (`x`, a set that only grows), the base stacks drawn down (`c`, a count that only falls), and what
//   players have stored in it (`s`, full records, WORLD4's own last-writer word). Two words merge the same in any order,
//   so two players taking different pieces in the same breath both see both gone; nothing a peer says overwrites a list.
//   A word carries its base's signature (`h`): a client whose own computation differs (another build) reads it as
//   AUDIT SETS M2's unreadable word, never as a list to land.
// - THE BONUS. Each player's own Renown and Luck - "the roller's own" (RENOWN-LOOT) - roll a layer over the base on dice
//   seeded by the container's name and the CHARACTER: the pieces PLAIN-LOOT's keep let go that the player's Renown
//   keeps, and the supplies their Renown's share adds over the first stage's, laddered at their Luck and their finders.
//   It is never said to the room and never touches another list, and what a character has taken of it is kept in the
//   character's save (the record below), so a reload or a walk back in rolls nothing again.
//
// Pure but for the spent record's state and the personal mark. Not a DFU member: Daggerfall has one player. Ledger A
// (PARTY-LOOT).
import { groupReferenceLevel } from './mentorMode.js';
import { RENOWN_LOOT_QUARTERS } from './renownLoot.js';
import { validLootList, LOOT_LIST_MAX, LOOT_STACK_MAX } from './loot.js';
import { registerModSaveData } from './modSaveData.js';
import { healingSupplyChances, mintHealingPotion, mintMagickaPotion } from './healingSupply.js';
import { restLootChances, restItemsAvailable, createRestItem, REST_PILE_CHANCES, REST_FOE_CHANCES } from './restItems.js';

// ---- the dice -------------------------------------------------------------------------------------------------------

/** xmur3: a 32-bit hash stream of a string (each call the next word). */
function hashStream(/** @type {string} */ str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

/** THE ROOM'S DICE: a stream in [0, 1) that is the same on every machine for the same name - sfc32 seeded by the name's
 *  hash, warmed a dozen draws. Every client that asks for `name` gets the same draws in the same order. */
export function seededRolls(/** @type {string} */ name) {
  const h = hashStream(String(name));
  let a = h(), b = h(), c = h(), d = h();
  const next = () => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
  for (let i = 0; i < 12; i++) next();
  return next;
}

/** A short signature of a string (base 36), for a base list's `h`. */
export const signatureOf = (/** @type {string} */ s) => { const h = hashStream(String(s)); return h().toString(36) + h().toString(36); };

// ---- the container and its terms ------------------------------------------------------------------------------------

/** The kinds of key whose container has a shared base (takeLoot's vocabulary): a layout pile, a layout body, a rest
 *  encounter's body. A searched object's find (`srch:`) is rolled once at its search and said at once - WORLD4's word. */
export const ROOM_BASE_KINDS = Object.freeze(['loot', 'corpse', 'enc']);
export const isRoomBaseKind = (/** @type {string} */ canon) => typeof canon === 'string' && ROOM_BASE_KINDS.includes(canon.split(':')[0]);

/** THE CONTAINER'S NAME, which its dice are seeded by: the room (its key - every client in it the same), the container's
 *  canonical key, and its generation (`g`: a pile's 0 until the hour's respawn rolls it again, a body's its death). */
export const roomContainerName = (/** @type {string} */ room, /** @type {string} */ canon, /** @type {number} */ g) => `${room}|${canon}#${g}`;

/** The base's terms, every client the same: Luck 50 (DFU's tables read no Luck; the port's ladder's floor) and
 *  RENOWN-LOOT's first stage (online before the page knows its Renown - "no roll is ever richer than the Renown behind
 *  it"). A player's own Luck and Renown above these are their bonus. */
export const ROOM_BASE_LUCK = 50;
export const ROOM_BASE_QUARTERS = RENOWN_LOOT_QUARTERS[0];
/** The base's finders' multiplier: none (the drought and a worn find are a player's own). */
export const ROOM_BASE_FIND = 1;
/** The highest level a term names (net/wire.js FOE_LEVEL_MAX's bound, read here without the relay's bundle). */
export const ROOM_LEVEL_MAX = 100;
/** The most pieces a base may hold for its takes to name them by place. */
export const ROOM_BASE_MAX = 255;

/** THE PARTY'S LEVEL, as the minter computes it at the container's birth: SOFTCAP1's group reference (mentorMode.js
 *  groupReferenceLevel - the harmonic mean, leaning to the lowest member) of the minter's own level and its party's
 *  online members' (their poses' `cl`), rounded, at least 1. It is fixed in the container's terms and carried in the
 *  room's word, so no client computes it from a list that could differ from another's. */
export function roomBaseLevel(/** @type {number} */ own, /** @type {number[]} */ partners = []) {
  const ref = groupReferenceLevel([own, ...(Array.isArray(partners) ? partners : [])]);
  const lv = Math.round(Number.isFinite(ref) ? /** @type {number} */ (ref) : Number(own) || 1);
  return Math.max(1, Math.min(ROOM_LEVEL_MAX, lv));
}

/** The base's gender (clothing and a magic item's cut read one): a draw off the container's own name, so the room's
 *  piles and bodies hold both and every client agrees which. */
export const roomBaseGender = (/** @type {string} */ name) => (seededRolls(`${name}|gender`)() < 0.5 ? 'male' : 'female');

/** The ROLLER the base's chain is handed where it reads a player: the terms' level, the name's gender, Luck 50, no
 *  effect, no mentor - a stand-in no client's own character can colour. */
export const roomRoller = (/** @type {number} */ lv, /** @type {string} */ gender) => ({
  level: lv, gender, stats: { luck: ROOM_BASE_LUCK }, activeEffects: [], items: [],
});

/** Terms off a word, or null: `g` the generation, `lv` the level, `n` the fight's count (a body's sigils), `tm` when it
 *  was minted (the relay's clock). */
export function validRoomTerms(/** @type {any} */ t) {
  if (!t || typeof t !== 'object') return null;
  if (!Number.isSafeInteger(t.g) || t.g < 0) return null;
  if (!Number.isInteger(t.lv) || t.lv < 1 || t.lv > ROOM_LEVEL_MAX) return null;
  if (t.n !== undefined && (!Number.isInteger(t.n) || t.n < 1 || t.n > 8)) return null;
  if (t.tm !== undefined && !Number.isFinite(t.tm)) return null;
  return { g: t.g, lv: t.lv, n: t.n ?? 1, tm: t.tm ?? 0 };
}
export const sameRoomTerms = (/** @type {any} */ a, /** @type {any} */ b) => !!a && !!b && a.g === b.g && a.lv === b.lv && (a.n ?? 1) === (b.n ?? 1);
/** Whether terms `a` replace terms `b` for one container: a newer generation always; in one generation the earlier mint,
 *  then the lower level, then the lower count - a total order, so every client that hears both keeps the same. */
export function roomTermsBeat(/** @type {any} */ a, /** @type {any} */ b) {
  if (!b) return true;
  if (a.g !== b.g) return a.g > b.g;
  if (a.tm !== b.tm) return a.tm < b.tm;
  if (a.lv !== b.lv) return a.lv < b.lv;
  return (a.n ?? 1) < (b.n ?? 1);
}

// ---- the base's signature -------------------------------------------------------------------------------------------

/** A base list's signature - what each piece IS (its template, material, count, tier and enchantment count), in order. */
export function baseSignature(/** @type {any[]} */ items) {
  return signatureOf((items ?? []).map((it) => `${it?.group ?? ''}.${it?.templateIndex ?? ''}.${it?.material ?? ''}.${it?.stackCount ?? 1}.${it?.rarity ?? ''}.${Array.isArray(it?.enchantments) ? it.enchantments.length : 0}`).join(','));
}

// ---- the word -------------------------------------------------------------------------------------------------------

/** Whether a room's loot record is a PARTY-LOOT word (terms and takes) rather than WORLD4's list. */
export const isRoomWord = (/** @type {any} */ rec) => !!rec && typeof rec === 'object' && Number.isSafeInteger(rec.g) && Number.isInteger(rec.lv);

/**
 * A word off the wire, projected (AUDIT WORLD3 A2's law, WORLD4's projection for its stored pieces) - or null. The
 * terms; `h` the base's signature; `x` the base places gone (whole numbers under ROOM_BASE_MAX, each once); `c` a base
 * stack's count where it was drawn down (`[place, count]`, a count of at least one); `s` the stored pieces through
 * validLootList, at most LOOT_LIST_MAX with the rest. A word with no `s` says nothing of the stored pieces (a birth).
 */
export function validRoomWord(/** @type {any} */ rec) {
  if (!isRoomWord(rec)) return null;
  const terms = validRoomTerms(rec);
  if (!terms) return null;
  if (rec.h !== undefined && (typeof rec.h !== 'string' || !/^[0-9a-z]{1,16}$/.test(rec.h))) return null;
  const x = [];
  if (rec.x !== undefined) {
    if (!Array.isArray(rec.x) || rec.x.length > ROOM_BASE_MAX) return null;
    const seen = new Set();
    for (const i of rec.x) { if (!Number.isInteger(i) || i < 0 || i >= ROOM_BASE_MAX || seen.has(i)) return null; seen.add(i); x.push(i); }
  }
  /** @type {[number, number][]} */
  const c = [];
  if (rec.c !== undefined) {
    if (!Array.isArray(rec.c) || rec.c.length > ROOM_BASE_MAX) return null;
    for (const p of rec.c) {
      if (!Array.isArray(p) || p.length !== 2) return null;
      const [i, n] = p;
      if (!Number.isInteger(i) || i < 0 || i >= ROOM_BASE_MAX || !Number.isInteger(n) || n < 1 || n > LOOT_STACK_MAX) return null;
      c.push([i, n]);
    }
  }
  let s = null;
  if (rec.s !== undefined) { s = validLootList(rec.s); if (!s) return null; }
  return { ...terms, ...(rec.h !== undefined ? { h: rec.h } : {}), x, c, s };
}

// ---- the room's state of one container ------------------------------------------------------------------------------

/** A container's state as this client knows the room's word: its terms, the base places gone, the drawn-down counts
 *  and the stored pieces. */
export const roomState = (/** @type {any} */ terms) => ({ terms, taken: new Set(), counts: new Map(), stored: /** @type {any[]} */ ([]) });

/**
 * THE MERGE: a projected word into a state - or a fresh state, when the word names another base whose terms beat the
 * state's (a newer generation, an earlier mint). Answers `{ state, changed }`; a word for a base that loses is dropped
 * (`changed` false), and a word for the SAME base (its generation, level and count) merges whichever was minted first. The
 * places gone are a union and the counts a minimum, so two words land the same in either order and a take is never
 * undone by an older word; the stored pieces are the word's, when it says them (WORLD4's last writer).
 */
export function mergeRoomWord(/** @type {any} */ state, /** @type {any} */ w) {
  let st = state;
  let changed = false;
  if (st && sameRoomTerms(w, st.terms)) {
    // one base (one name, one level, one count): its takes are takes against the same pieces, whoever minted first
    if ((w.tm ?? 0) < st.terms.tm) st.terms = { ...st.terms, tm: w.tm ?? 0 };
  } else if (!st || roomTermsBeat(w, st.terms)) {
    st = roomState({ g: w.g, lv: w.lv, n: w.n ?? 1, tm: w.tm ?? 0 });
    changed = true;
  } else return { state: st, changed: false };
  for (const i of w.x ?? []) if (!st.taken.has(i)) { st.taken.add(i); changed = true; }
  for (const [i, n] of w.c ?? []) { const was = st.counts.get(i); if (was === undefined || n < was) { st.counts.set(i, n); changed = true; } }
  if (Array.isArray(w.s)) { st.stored = w.s; changed = true; }
  return { state: st, changed };
}

/**
 * THE LIST a client holds for a container: the base pieces still in it (in the base's order, a drawn-down stack at its
 * count), then the stored pieces, then this player's own (their bonus, never the room's). `base` the base's pieces
 * (the same objects every compose, so a take holds the piece it took); `full` their counts as minted.
 */
export function composeRoomList(/** @type {any[]} */ base, /** @type {(number|null)[]} */ full, /** @type {any} */ state, /** @type {any[]} */ personal = []) {
  const out = [];
  base.forEach((it, i) => {
    if (state.taken.has(i)) return;
    const n = state.counts.get(i);
    if (n !== undefined && Number.isInteger(full[i])) it.stackCount = Math.min(n, /** @type {number} */ (full[i]));
    out.push(it);
  });
  out.push(...state.stored, ...personal);
  return out;
}

/**
 * WHAT A LIST SAYS against its base: the state brought up to the live list (a base piece no longer in it is gone, a
 * stack fewer is drawn down - the union and the minimum, never back), and the stored pieces as the list holds them
 * (a piece not of the base and not the player's own). Answers the word's takes `{ x, c, s }`.
 */
export function roomTakesOf(/** @type {any} */ state, /** @type {any[]} */ base, /** @type {(number|null)[]} */ full, /** @type {any[]} */ list, /** @type {(it: any) => boolean} */ isPersonal) {
  const at = new Map(base.map((it, i) => [it, i]));
  const present = new Set();
  const stored = [];
  for (const it of list ?? []) {
    const i = at.get(it);
    if (i !== undefined) {
      present.add(i);
      const n = it.stackCount;
      if (Number.isInteger(full[i]) && Number.isInteger(n) && n < /** @type {number} */ (full[i])) { const was = state.counts.get(i); if (was === undefined || n < was) state.counts.set(i, n); }
      continue;
    }
    if (isPersonal(it)) continue;
    stored.push(it);
  }
  base.forEach((_, i) => { if (!present.has(i)) state.taken.add(i); });
  state.stored = stored;
  return {
    x: [...state.taken].sort((a, b) => a - b),
    c: [...state.counts].filter(([i]) => !state.taken.has(i)).sort((a, b) => a[0] - b[0]),
    s: stored,
  };
}

/** The room's word for a container: its terms, its base's signature and its takes (`x`, `c`, `s`). */
export const roomWord = (/** @type {string} */ k, /** @type {any} */ state, /** @type {string} */ h, /** @type {{x: number[], c: [number, number][], s: any[]}} */ takes, /** @type {number|null} */ t = null) => ({
  k, g: state.terms.g, lv: state.terms.lv, ...(state.terms.n > 1 ? { n: state.terms.n } : {}), tm: state.terms.tm, h,
  ...(takes.x.length ? { x: takes.x } : {}), ...(takes.c.length ? { c: takes.c } : {}), s: takes.s.map((it) => ({ ...it })),
  ...(Number.isFinite(t) ? { t } : {}),
});

/** Whether a container holds nothing of the room's: every base piece gone and nothing stored (WORLD8's "emptied"). */
export const roomEmptied = (/** @type {any} */ state, /** @type {number} */ baseLength) => state.stored.length === 0 && state.taken.size >= baseLength;

// ---- the personal bonus ---------------------------------------------------------------------------------------------

/** The share of what the base's step let go that a player's own step keeps: from `baseP` to `ownP` of one chance, as a
 *  chance over what the base did NOT keep - so the base's keep and the bonus together are the player's own keep. */
export const bonusShare = (/** @type {number} */ baseP, /** @type {number} */ ownP) => (ownP > baseP && baseP < 1 ? Math.min(1, (ownP - baseP) / (1 - baseP)) : 0);

/**
 * THE SUPPLIES' SHARE OF A BONUS: each of RENOWN-LOOT's supply chances (the healing and Restore Power potions, the rest
 * supplies - systems/healingSupply.js, systems/restItems.js) from the base's share to the player's own, as one more draw
 * at the step between them (bonusShare) - so the base's draw and the bonus's together hold a supply at the player's own
 * chance. `side` 'enemy' (a looting foe) or 'pile' (a deep pile, J-O - the caller's gate, as the subscribers' own). A
 * draw is taken for every chance whatever it lands, so the dice a later draw reads never move. Answers the items.
 */
export function rollBonusSupplies(/** @type {any[]} */ items, /** @type {'enemy'|'pile'} */ side, /** @type {number} */ baseQ, /** @type {number} */ ownQ, /** @type {() => number} */ rolls) {
  const b = healingSupplyChances(baseQ)[side], o = healingSupplyChances(ownQ)[side];
  if (rolls() < bonusShare(b.healing / 100, o.healing / 100)) items.push(mintHealingPotion());
  if (rolls() < bonusShare(b.magicka / 100, o.magicka / 100)) items.push(mintMagickaPotion());
  const table = side === 'pile' ? REST_PILE_CHANCES : REST_FOE_CHANCES;
  const was = new Map(restLootChances(table, baseQ));
  const open = restItemsAvailable();
  for (const [t, pct] of restLootChances(table, ownQ)) {
    const hit = rolls() < bonusShare((was.get(t) ?? 0) / 100, pct / 100);
    if (hit && open) { const it = createRestItem(t); if (it) items.push(it); }
  }
  return items;
}

/** The tag a row of this player's own bonus wears on the plaque and the classic loot panel (the room's rows wear none). */
export const PLAQUE_MINE_TAG = 'yours';

/** THE PERSONAL MARK: a piece of this player's bonus (and any other piece that is theirs alone in a room's container).
 *  The plaque reads it to say whose a row is; the word leaves it out. Weakly held - a piece gone is a mark gone. */
let _personal = new WeakSet();
export const markPersonal = (/** @type {any} */ it) => { if (it && typeof it === 'object') _personal.add(it); return it; };
export const isPersonalLoot = (/** @type {any} */ it) => !!it && typeof it === 'object' && _personal.has(it);

/** THE SPENT RECORD, in the character's save: for each container's bonus (`name|character`), the places of it the
 *  character holds no longer. Bounded (the oldest let go past ROOM_BONUS_KEPT - a container that old has respawned). */
export const ROOM_BONUS_KEPT = 2048;
export const ROOM_BONUS_SAVE_VENDOR = 'RoomLootBonus';
/** @type {Map<string, Set<number>>} */
let _spent = new Map();
export const bonusSpent = (/** @type {string} */ key) => _spent.get(key) ?? new Set();
/** The places of `key`'s bonus no longer in the list; a place back in it (stored back) is unspent. */
export function settleBonusSpent(/** @type {string} */ key, /** @type {number[]} */ gone, /** @type {number[]} */ held = []) {
  let s = _spent.get(key);
  if (!s) { if (!gone.length) return; s = new Set(); }
  for (const i of gone) s.add(i);
  for (const i of held) s.delete(i);
  _spent.delete(key);
  if (s.size) _spent.set(key, s);
  while (_spent.size > ROOM_BONUS_KEPT) _spent.delete(/** @type {string} */ (_spent.keys().next().value));
}
/** A record off a save: `{ spent: [[key, [place, ...]], ...] }`, each bounded, the rest refused. */
export function validBonusRecord(/** @type {any} */ r) {
  /** @type {Map<string, Set<number>>} */
  const out = new Map();
  for (const row of Array.isArray(r?.spent) ? r.spent.slice(-ROOM_BONUS_KEPT) : []) {
    if (!Array.isArray(row) || typeof row[0] !== 'string' || row[0].length > 256 || !Array.isArray(row[1])) continue;
    const s = new Set(row[1].filter((i) => Number.isInteger(i) && i >= 0 && i < LOOT_LIST_MAX));
    if (s.size) out.set(row[0], s);
  }
  return out;
}
registerModSaveData(ROOM_BONUS_SAVE_VENDOR, {
  newSaveData: () => ({ spent: [] }),
  getSaveData: () => ({ spent: [..._spent].map(([k, s]) => [k, [...s]]) }),
  restoreSaveData: (r) => { _spent = validBonusRecord(r); },
});
/** Tests only. */
export function _resetRoomLootForTests() { _spent = new Map(); _personal = new WeakSet(); }
