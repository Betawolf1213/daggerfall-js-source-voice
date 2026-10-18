// @ts-check
// ═══════════════════════════════════════════════════════════════════
// TOWN-ECON TE2 (2026-10-18, Mac: "Everything"; bible/06-Systems/Town-Economy-Arc.md section 4) - THIS DEVICE'S HALF
// OF THE PLAYERS' SHARE:
//   - THE SHARES: every town's players' share as the account service answers it (/v1/towns/econ), read once a
//     TOWN_ECON_KEPT_S and held, synchronous to its readers (systems/town/townEcon.js) - the chapter sheet's shape
//     (net/chapterSheet.js), stopped by an account's refusal;
//   - THE FOOTSTEPS: the relay's signed Watch ticks (net/online.js onWatch) kept on the device where they stand in a
//     town with an economy - EVERY town's pixel, not a seat's alone (the seats keep theirs in net/townSeatBook.js) - and
//     claimed (/v1/towns/watch) TOWN_WATCH_CLAIM_MAX at a time, or the oldest after TOWN_ECON_CLAIM_EVERY_MS;
//   - THE REGISTRY: the town this client walks into reported once a UTC day (/v1/towns/witness) - its map id, pixel,
//     region and location index - until the service has counted it or knows it.
// Online only: the world host builds none offline.
// ═══════════════════════════════════════════════════════════════════
import { readWatchReceipt } from './watchReceipt.js';
import { jittered } from './backoff.js';   // a failed claim's wait, jittered as every book's is
import { TOWN_WATCH_CLAIM_MAX, TOWN_ECON_KEPT_S, townReportOf } from './townEconLaw.js';

/** Where the device keeps the ticks it holds: [{ r, s, i, e }]. */
export const TOWN_ECON_WATCH_KEY = 'townecon.watch';
/** The most it holds - a day offline walking keeps the newest. */
export const TOWN_ECON_WATCH_HELD_MAX = 60;
/** A claim waits for a claim's worth, or this long for the oldest. */
export const TOWN_ECON_CLAIM_EVERY_MS = 10 * 60_000;
/** A failed claim's first wait, doubling to TOWN_ECON_CLAIM_EVERY_MS. */
export const TOWN_ECON_RETRY_MS = 30_000;
/** Where the device keeps the day it last reported each town: { [mapId]: UTC day } (TOWN_ECON_DONE past it, never again). */
export const TOWN_ECON_REPORTED_KEY = 'townecon.towns';
export const TOWN_ECON_REPORTED_MAX = 200;
export const TOWN_ECON_DONE = 1_000_000;
/** The answers that say the towns are not this account's to read or report - asked no more this page. */
export const TOWN_ECON_STOPS = Object.freeze(['towns-need-account', 'no-session', 'auth']);
/** A claim answered with these lets its ticks go - their fate is the service's. */
const WATCH_SETTLED = Object.freeze(['bad-watch', 'towns-need-account']);

/**
 * THE TOWN BOOK.
 * @param {{ door: { econ: () => Promise<any>, witness: (town: any) => Promise<any>, watch: (receipts: string[]) => Promise<any> },
 *   storage?: any, nowMs?: () => number, me?: () => (string|null), isTownPixel?: (x: number, y: number) => boolean,
 *   relayNowS?: () => (number|null), rand?: () => number }} o
 *   `me` the signed-in account, `isTownPixel` whether a town with an economy stands at a map pixel, `relayNowS` the
 *   relay's clock (a tick's life is the relay's)
 */
export function createTownEconBook({ door, storage = null, nowMs = () => Date.now(), me = () => null, isTownPixel = () => false, relayNowS = () => null, rand = Math.random }) {
  // ── the shares ──
  /** @type {Map<number, number>} */
  let shares = new Map();
  let readAt = -Infinity, busy = false, stopped = false;
  const refresh = () => {
    if (stopped || busy || nowMs() - readAt < TOWN_ECON_KEPT_S * 1000) return false;
    busy = true;
    readAt = nowMs();
    Promise.resolve().then(() => door.econ()).then((r) => {
      if (r?.ok && Array.isArray(r.data?.towns)) {
        /** @type {Map<number, number>} */
        const next = new Map();
        for (const t of r.data.towns) if (Array.isArray(t) && Number.isSafeInteger(t[0]) && Number.isFinite(t[1]) && t[1] > 0) next.set(t[0] >>> 0, t[1]);
        shares = next;
      } else if (TOWN_ECON_STOPS.includes(r?.error)) { stopped = true; shares = new Map(); }
    }, () => { /* a read that failed is asked again at the next keeping */ }).finally(() => { busy = false; });
    return true;
  };

  // ── the footsteps ──
  /** @type {Array<{ r: string, s: string, i: number, e: number }> | null} */
  let watchList = null;
  let watchBusy = false, watchFails = 0, watchRetryAt = -Infinity, watchStopped = false;
  const watchHeld = () => {
    if (watchList) return watchList;
    watchList = [];
    try {
      const v = JSON.parse(storage?.getItem?.(TOWN_ECON_WATCH_KEY) ?? 'null');
      if (Array.isArray(v)) watchList = v.filter((w) => w && typeof w.r === 'string' && typeof w.s === 'string' && Number.isSafeInteger(w.i) && Number.isSafeInteger(w.e)).slice(-TOWN_ECON_WATCH_HELD_MAX);
    } catch { /* a bad key reads as none */ }
    return watchList;
  };
  const writeWatch = (/** @type {Array<{ r: string, s: string, i: number, e: number }>} */ list) => {
    watchList = list.slice(-TOWN_ECON_WATCH_HELD_MAX);
    try { storage?.setItem?.(TOWN_ECON_WATCH_KEY, JSON.stringify(watchList)); } catch { /* this page keeps them */ }
  };
  const alive = (/** @type {{ e: number }} */ w, /** @type {number|null} */ t) => t == null || w.e > t;
  const mine = () => { const who = me(), t = relayNowS(); return watchHeld().filter((w) => w.s === who && alive(w, t)); };
  const due = () => {
    if (watchBusy || watchStopped || nowMs() < watchRetryAt) return false;
    const held = mine();
    if (!held.length) return false;
    const t = relayNowS();
    const oldest = Math.min(...held.map((w) => w.i)) * 1000;
    return held.length >= TOWN_WATCH_CLAIM_MAX || (t == null ? nowMs() : t * 1000) - oldest >= TOWN_ECON_CLAIM_EVERY_MS;
  };

  // ── the registry ──
  /** @type {Record<string, number> | null} */
  let reported = null;
  let witnessStopped = false;
  const table = () => {
    if (reported) return reported;
    reported = {};
    try {
      const v = JSON.parse(storage?.getItem?.(TOWN_ECON_REPORTED_KEY) ?? 'null');
      if (v && typeof v === 'object' && !Array.isArray(v)) reported = v;
    } catch { /* a bad key reads as none */ }
    return /** @type {Record<string, number>} */ (reported);
  };
  const writeTable = (/** @type {Record<string, number>} */ t) => {
    reported = Object.fromEntries(Object.entries(t).sort((a, b) => b[1] - a[1]).slice(0, TOWN_ECON_REPORTED_MAX));
    try { storage?.setItem?.(TOWN_ECON_REPORTED_KEY, JSON.stringify(reported)); } catch { /* this page keeps it */ }
  };
  const dayNow = () => Math.floor(nowMs() / 86_400_000);

  const book = {
    refresh,
    /** A TOWN'S PLAYERS' SHARE as last read (0 for none, and until the first read answers) - and the next read asked
     *  when the keeping has passed. @param {unknown} mapId */
    shareOf(mapId) {
      refresh();
      return mapId == null || !Number.isFinite(Number(mapId)) ? 0 : shares.get(Number(mapId) >>> 0) ?? 0;
    },
    get stopped() { return stopped; },
    /** THE WATCH'S TICK KEPT (net/online.js onWatch): a signed receipt for the signed-in account, in a town's pixel,
     *  still alive by the relay's clock - and a claim's worth claimed. Answers whether it was kept. @param {unknown} r */
    keepWatch(r) {
      const c = readWatchReceipt(r);
      const t = relayNowS();
      if (watchStopped || !c || !c.signed || c.s !== me() || !isTownPixel(c.x, c.y) || (t != null && c.e <= t)) return false;
      const list = watchHeld().filter((w) => alive(w, t));
      if (list.some((w) => w.r === r)) return false;
      list.push({ r: /** @type {string} */ (r), s: c.s, i: c.i, e: c.e });
      writeWatch(list);
      if (due()) book.claim();
      return true;
    },
    /** How many ticks this device holds for the signed-in account. */
    watchHeldCount: () => mine().length,
    /** THE KEPT TICKS CLAIMED - the signed-in account's, TOWN_WATCH_CLAIM_MAX at a time, once a claim's worth is held or
     *  the oldest has waited (`force` now). An answer lets the claimed ones go; no answer keeps them, and the next claim
     *  waits the longer the more failures in a row. Answers the service's `{ counted, why }`, or null. */
    async claim({ force = false } = {}) {
      if (watchBusy || watchStopped || (!force && !due())) return null;
      const batch = mine().slice(0, TOWN_WATCH_CLAIM_MAX);
      if (!batch.length) return null;
      watchBusy = true;
      let r;
      try { r = await door.watch(batch.map((w) => w.r)); } catch { r = { ok: false, error: 'offline' }; } finally { watchBusy = false; }
      if (r?.ok || WATCH_SETTLED.includes(r?.error)) {
        const gone = new Set(batch.map((w) => w.r));
        writeWatch(watchHeld().filter((w) => !gone.has(w.r)));
        watchFails = 0; watchRetryAt = -Infinity;
        // a young account's ticks count nothing yet, and a guest's never: asked no more this page
        if ((r?.ok && r.data?.why?.young) || r?.error === 'towns-need-account') watchStopped = true;
      } else if (TOWN_ECON_STOPS.includes(r?.error)) watchStopped = true;
      else {
        watchFails += 1;
        watchRetryAt = nowMs() + jittered(Math.min(TOWN_ECON_CLAIM_EVERY_MS, TOWN_ECON_RETRY_MS * 2 ** (watchFails - 1)), rand);
      }
      return r?.ok ? r.data : null;
    },
    /** A TOWN WITNESSED - `{ map, px, py, region, location }`, reported once a UTC day until the service counted it or
     *  knows it; a refusal in TOWN_ECON_STOPS, or a young account, stops it for the page. Answers whether a report was
     *  sent. @param {any} town */
    async witness(town) {
      const t = townReportOf(town);
      if (!t || witnessStopped) return false;
      const tab = table();
      const at = tab[String(t.map)];
      if (at === dayNow() || at >= TOWN_ECON_DONE) return false;
      tab[String(t.map)] = dayNow();
      writeTable(tab);
      let r = null;
      try { r = await door.witness(t); } catch { /* the next day asks again */ }
      if (TOWN_ECON_STOPS.includes(r?.error) || (r?.ok && r.data?.why === 'young')) witnessStopped = true;
      if (r?.ok && (r.data?.counted === true || r.data?.why === 'known')) { tab[String(t.map)] = TOWN_ECON_DONE + dayNow(); writeTable(tab); }
      return true;
    },
  };
  return book;
}
