// @ts-check
// ═══════════════════════════════════════════════════════════════════
// FIRM1 (2026-10-13; bible/06-Systems/Firmament.md) - THIS DEVICE'S FIRMAMENT: the character's tree and purses as the
// account service last said them (server-account/src/firmament.js), and the one change on its way. The law both ends
// read is net/firmamentLaw.js.
//
// A CHANGE IS THE WHOLE TREE, under its own request id. ASYNC NEVER DROPS: a change asked while another is on its way is
// COALESCED - the newest tree the player confirmed waits behind the one in flight and is asked when it answers, never
// thrown away and never asked beside it. A change whose answer did not come is KEPT (FIRM_KEPT_KEY, by account and
// character) with its id, and asked again with the same id at the next read - the service answers one that landed as its
// `repeat`, never a second charge. A refusal the service gave after it looked (the law's, the purses', a stale tree) lets
// it go and the state is read again.
//
// Pure - the door, the storage, the clock and the ids are handed in - so the pins drive it without a network.
// ═══════════════════════════════════════════════════════════════════

import { unpackTree, packTree, pointsLeft, EMPTY_TREE, FIRM_RESPEC_GOLD } from './firmamentLaw.js';
import { walletReserve } from './realmGoldLaw.js';   // a refused respec gives back exactly what it took

/** Where this device keeps a change whose answer did not come: { [account|character]: { rid, tree } }. */
export const FIRM_KEPT_KEY = 'firm1.kept';
/** The refusals that are no word on the change - kept and asked again. */
const UNHEARD = new Set(['offline', 'server', 'no-session', 'firm-rate']);

/** A change's id (FIRM_RID_RE's shape). */
export function mintFirmRid(rand = (b) => globalThis.crypto.getRandomValues(b)) {
  const b = new Uint8Array(15);
  rand(b);
  return `f${[...b].map((x) => (x % 36).toString(36)).join('')}`;
}

/**
 * THE RESPEC (`respec`): the whole sky back for FIRM_RESPEC_GOLD gold. A realm character's record pays on the service in
 * the respec's own batch (`realm.act`, systems/realmSaves.js realmGoldAct - the purse checkpointed and reserved first, a
 * refusal giving back exactly what it took); a character that is not the realm's pays from its purse once the service
 * has said yes. `wallet()` is the host's: `{ gold, pay, credit?, region? }`.
 * @param {{ door: { account?: () => string|null, state: (character: string) => Promise<any>, set: (character: string, tree: string, rid: string) => Promise<any>,
 *   respec?: (character: string, rid: string, realm?: any, region?: number|null) => Promise<any> },
 *   storage?: any, character?: () => string|null, rid?: () => string, realm?: { act: (o: any) => Promise<any> } | null, wallet?: (() => any) | null }} o
 */
export function createFirmamentBook({ door, storage = null, character = () => null, rid = () => mintFirmRid(), realm = null, wallet = null }) {
  const state = {
    /** whether the Firmament is this account's: true, false (shut, a guest, offline) or null not yet asked */
    open: /** @type {boolean|null} */ (null),
    /** the last refusal's word, or null */
    error: /** @type {string|null} */ (null),
    tree: /** @type {{ start: string|null, keys: string[] }} */ ({ start: null, keys: [] }),
    renown: 1, stars: 0, craft: 0,
    /** @type {Record<string, number>} */
    ranks: {},
    refund: { freeBelow: 10, perStar: 10 },
    /** the HTTP status of the last refused read, or null */
    status: /** @type {number|null} */ (null),
    /** a change on its way (its tree), or null */
    sending: /** @type {{ start: string|null, keys: string[] }|null} */ (null),
    character: /** @type {string|null} */ (null),
  };
  const listeners = new Set();
  const tell = () => { for (const fn of listeners) { try { fn(state); } catch { /* a listener is not the book's problem */ } } };
  const slot = () => `${(() => { try { return door.account?.() ?? ''; } catch { return ''; } })()}|${character() ?? ''}`;
  const kept = () => { try { return JSON.parse(storage?.getItem?.(FIRM_KEPT_KEY) ?? '{}') ?? {}; } catch { return {}; } };
  const keep = (entry) => {
    const all = kept();
    if (entry) all[slot()] = entry; else delete all[slot()];
    try { storage?.setItem?.(FIRM_KEPT_KEY, JSON.stringify(all)); } catch { /* storage is a convenience */ }
  };
  const apply = (data) => {
    state.tree = unpackTree(data?.tree ?? '');
    state.renown = Number.isSafeInteger(data?.renown) ? data.renown : state.renown;
    state.stars = Number.isSafeInteger(data?.stars) ? data.stars : state.stars;
    state.craft = Number.isSafeInteger(data?.craft) ? data.craft : state.craft;
    if (data?.ranks && typeof data.ranks === 'object') state.ranks = { ...data.ranks };
    if (data?.refund) state.refund = { freeBelow: Number(data.refund.freeBelow) || 10, perStar: Number(data.refund.perStar) || 10 };
    state.open = true;
    state.error = null;
    state.status = null;
  };
  /** @type {{ start: string|null, keys: string[] }|null} */
  let queued = null;

  async function send(tree) {
    const id = kept()[slot()]?.rid ?? rid();
    const who = character();
    if (!who) return { ok: false, error: 'firm-character' };
    keep({ rid: id, tree: packTree(tree) });
    state.sending = tree;
    tell();
    const r = await door.set(who, packTree(tree), id);
    state.sending = null;
    if (r?.ok) { keep(null); apply(r.data); tell(); return { ok: true, silver: Number(r.data?.silver) || 0 }; }
    const error = r?.error ?? 'server';
    state.error = error;
    if (!UNHEARD.has(error)) { keep(null); await book.read(); state.error = error; tell(); }
    else tell();
    return { ok: false, error };
  }

  const book = {
    state,
    /** Told whenever the state moves. */
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    /** The character's tree and purses, from the service - a change kept from before asked first, with its own id. */
    async read() {
      const who = character();
      if (!who) return false;
      if (state.character !== who) { state.character = who; state.tree = { start: null, keys: [] }; }
      const left = kept()[slot()];
      if (left?.rid && !state.sending) {
        const r = await door.set(who, left.tree, left.rid);
        if (r?.ok || !UNHEARD.has(r?.error)) keep(null);
      }
      const r = await door.state(who);
      if (r?.ok) { apply(r.data); tell(); return true; }
      state.error = r?.error ?? 'server';
      state.status = Number.isSafeInteger(r?.status) ? r.status : null;   // UI-CALM: the window says WHY no stars came (a 404 is a service without the Firmament)
      if (state.error === 'firm-closed' || state.error === 'no-session') state.open = false;
      tell();
      return false;
    },
    /** THE PLAYER CONFIRMED `tree` - asked now, or after the change in flight (coalesced: the newest wins). */
    async commit(tree) {
      const t = { start: tree?.start ?? null, keys: [...(tree?.keys ?? [])] };
      if (state.sending) { queued = t; return { ok: true, queued: true }; }
      let r = await send(t);
      while (queued) { const next = queued; queued = null; r = await send(next); }
      return r;
    },
    /** Whether a respec can be paid now: a sky with something in it, the gold in the wallet, nothing on its way. */
    canRespec() {
      const w = wallet?.();
      return !!state.tree?.start && !state.sending && !!w && w.gold() >= FIRM_RESPEC_GOLD && typeof door.respec === 'function';
    },
    /** THE RESPEC: every star and the birthsign back, for FIRM_RESPEC_GOLD gold. */
    async respec() {
      const who = character();
      if (!who) return { ok: false, error: 'firm-character' };
      if (state.sending) return { ok: false, error: 'firm-busy' };
      if (!state.tree?.start) return { ok: false, error: 'firm-respec-empty' };
      const w = wallet?.();
      if (!w || w.gold() < FIRM_RESPEC_GOLD) return { ok: false, error: 'firm-gold' };
      if (typeof door.respec !== 'function') return { ok: false, error: 'server' };
      const id = rid();
      const region = Number.isSafeInteger(w.region?.()) ? w.region() : null;
      state.sending = { start: null, keys: [] };
      tell();
      let r;
      try {
        if (realm) {
          r = await realm.act({ reserve: walletReserve(w, FIRM_RESPEC_GOLD).reserve, call: (/** @type {any} */ at) => door.respec(who, id, at, region) });
        } else {
          r = await door.respec(who, id, null, null);
          if (r?.ok && !r.data?.repeat) w.pay(FIRM_RESPEC_GOLD);
        }
      } finally { state.sending = null; }
      if (r?.ok) {
        keep(null);   // a change kept from before is over a sky that is gone
        if (r.data?.tree !== undefined) apply(r.data); else await book.read();
        tell();
        return { ok: true };
      }
      state.error = r?.error ?? 'server';
      tell();
      return { ok: false, error: state.error };
    },
    /** What is left in each purse under `tree` (the state's own by default). */
    left(tree = state.tree) { return pointsLeft(tree.keys, state.stars, state.craft); },
    /** The tree the window draws from: the one on its way, else the service's. */
    current() { return state.sending ?? state.tree ?? EMPTY_TREE; },
  };
  return book;
}

// ── the page's book ─────────────────────────────────────────────────
let _book = /** @type {ReturnType<typeof createFirmamentBook>|null} */ (null);
/** The host's word: this page's book (online), or null. The window reads it here, so no door has to carry it. */
export function setFirmamentBook(book) { _book = book ?? null; }
export const firmamentBook = () => _book;
