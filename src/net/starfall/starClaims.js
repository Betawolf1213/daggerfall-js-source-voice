// @ts-check
// STAR7 (2026-10-20): THE STAR RECEIPTS THIS DEVICE CARRIES TO THE ACCOUNT SERVICE, and the stars held as the cards say them.
// The sea serpent's carrier (net/serpent/serpentClaims.js), rung for rung, on its own key and its own route. Design:
// bible/11-Multiplayer/Starfall.md section 6.
//
// THE RELAY SIGNS, THE ACCOUNT SERVICE COUNTS AND PAYS, THIS FILE CARRIES. A receipt a star's cell hands this socket at the
// master's fall (or the hub again at the next hello) is kept on the device (STAR_CLAIMS_KEY) WITH THE CHARACTER THAT HELD
// IT, its level and this device's claim id (`cid` - the spoils' key), and offered to the account service (`/v1/star/claim`
// - server-account/src/stars.js claimStar) at once, and again while it is kept, at most every STAR_CLAIM_RETRY_MS. An answer
// that SETTLES it lets it go: counted, counted before, the day's stars already counted, not a receipt the relay signed, no
// character to pay. One that does not keeps it: no session yet, the service without its public half, a guest who may
// still register, the network, a refusal the service can mend. An expired receipt (by the relay's clock) is let go
// unasked; an UNSIGNED one is never kept. Only the signed-in account's receipts are offered (AUDIT WB A9's law).
//
// THE SPOILS ARE THE SERVICE'S WORD (the raids' AUDIT RAID R4): the service writes the (star, account)'s spoils row for the
// first claim that asks, a guest's too, and answers `spoils: true` to that claim alone - `onSpoils` hears it, awaited (the
// serpent's AUDIT SERPENT D6: a grant that fails leaves the receipt unsettled), and the page rolls the spoils
// (systems/starfall/starSpoils.js). A receipt this device SETTLED is remembered (STAR_SETTLED_KEY).
//
// THE QUESTLINE HEARS IT: a counted receipt notes the act `star-held` once (systems/questlines/qlActs.js) - The Thirteenth of
// Frostfall's stars (section 7), witnessed by the service over `stars_held`.
//
// Pure - the call, the store and the clocks are handed in. Not a DFU member. Ledger A (STARFALL).
import { readStarReceipt } from './starReceipt.js';
import { t } from '../../systems/textManager.js';
import { noteAct } from '../../systems/questlines/qlActs.js';

/** The device's star receipts not yet settled with the account service: `[{ r, ch, nm, lv, cid }]` - the receipt, the
 *  character that held it, its name, its level (the spoils roll at it), and this device's claim id. */
export const STAR_CLAIMS_KEY = 'star7.claims';
/** The receipts this device has settled with the service - `night.star|account` - never claimed again. */
export const STAR_SETTLED_KEY = 'star7.settled';
export const STAR_SETTLED_MAX = 64;
/** A claim id - sixteen hex digits, the service's STAR_CID_RE. */
export const STAR_CID_RE = /^[0-9a-f]{16}$/;
const mintCid = () => { const b = new Uint8Array(8); globalThis.crypto.getRandomValues(b); return [...b].map((x) => x.toString(16).padStart(2, '0')).join(''); };
/** A receipt's settled key - its star and account. */
const settledKeyOf = (c) => `${c.night}.${c.star}|${c.s}`;
/** The most it keeps - a night's stars and more; the oldest go first past this. Under the spoils pool's memory of what it
 *  gave (scenes/spoilsPool.js SPOILS_SPENT_MAX, 32 - the serpent's AUDIT SERPENT D3), so a guest's receipts, offered again and
 *  again, never outlive it. */
export const STAR_CLAIMS_MAX = 24;
/** The least time between two offers of what is kept, ms. */
export const STAR_CLAIM_RETRY_MS = 10 * 60 * 1000;
/** How often a frame asks who is signed in (AUDIT WBX W4's law). */
export const STAR_ME_POLL_MS = 1000;

/** The words. */
export const STAR_CLAIM_TEXT = Object.freeze({
  recorded: (n, xp) => (xp > 0
    ? t('starfall.claim.recordedXp', 'The star is on your record. Stars held: {n}. +{xp} toward your Renown.', { n, xp })
    : t('starfall.claim.recorded', 'The star is on your record. Stars held: {n}.', { n })),
  guest: () => t('starfall.claim.guest', 'This star is not on your record yet. Only registered accounts keep one. Add a username this week and it counts.'),
  dayFull: () => t('starfall.claim.dayFull', 'You have been counted for every star one day allows.'),
});

/** The refusals of a receipt the service can mend (the gate's GATE_CLAIM_MENDABLE): kept for the week it carries. */
export const STAR_CLAIM_MENDABLE = Object.freeze(['signature', 'verify-threw', 'future', 'clock']);

/** What the account service's answer does to a kept receipt: 'done' (let it go) or 'keep'. */
export function starClaimVerdict(answer) {
  if (answer?.ok) return answer.data?.why === 'guest' ? 'keep' : 'done';   // counted, counted before, the day full
  if (answer?.error === 'renown-character') return 'done';   // no character to pay - it never will be
  return answer?.error === 'receipt' && !STAR_CLAIM_MENDABLE.includes(answer.why) ? 'done' : 'keep';
}

/** The stars held as the account card says them - "3", "None yet" - or null for no record. */
export function starRecordText(rec) {
  if (!rec || typeof rec !== 'object' || !Number.isSafeInteger(rec.held) || rec.held < 0) return null;
  return rec.held > 0 ? String(rec.held) : t('starfall.claim.noneYet', 'None yet');
}

/**
 * @param {{
 *   claim: (receipt: string, character: string, name: string|null, cid: string) => Promise<any>,
 *   store?: { get: (k: string) => any, set: (k: string, v: any) => void }|null,
 *   nowS?: () => (number|null), nowMs?: () => number, say?: (text: string) => void,
 *   onRecorded?: (data: any, entry: { r: string, ch: string, nm: string|null, lv: number, cid: string }) => void,
 *   onSpoils?: (entry: { r: string, ch: string, nm: string|null, lv: number, cid: string }, data: any) => (void|Promise<any>),
 *   onMarks?: (data: any) => (string|string[]|null),
 *   me?: () => (string|null), cid?: () => string,
 * }} deps `claim` is net/accountClient.js accountStars' - `{ ok, data }` or `{ ok: false, error, why? }`, never a throw;
 *   `me` the signed-in account's id; `onRecorded` hears each counted receipt's answer (its Renown and order); `onSpoils`
 *   each receipt whose spoils the service gave THIS claim - awaited, its receipt settled only once they are given;
 *   `onMarks` each counted receipt's silver, the lines it answers said as the raids' are
 */
export function createStarClaims({ claim, store = null, nowS = () => Math.floor(Date.now() / 1000), nowMs = () => Date.now(), say = () => {}, onRecorded = () => {}, onSpoils = () => {}, onMarks = () => null, me = () => null, cid = mintCid }) {
  let busy = false, again = false, lastAt = -Infinity;
  let lastMe, meAt = -Infinity;
  const settled = new Set(), guestSaid = new Set();
  let dayFullSaid = false;
  const live = (r) => { const c = typeof r === 'string' ? readStarReceipt(r) : null; const now = nowS(); return c && c.signed && (now == null || c.e > now) ? c : null; };   // AUDIT ONLINE2 F2: `nowS` the relay's clock, null unheard
  const entry = (e) => (e && typeof e === 'object' && live(e.r) && typeof e.ch === 'string' && e.ch && typeof e.cid === 'string' && STAR_CID_RE.test(e.cid) ? e : null);
  /** The device's settled receipts, and one more */
  const settledHere = () => { let v; try { v = store ? store.get(STAR_SETTLED_KEY) : undefined; } catch { v = undefined; } return Array.isArray(v) ? v.filter((k) => typeof k === 'string') : []; };
  const markSettled = (c) => { if (!c) return; const list = settledHere().filter((k) => k !== settledKeyOf(c)); try { store?.set(STAR_SETTLED_KEY, [...list, settledKeyOf(c)].slice(-STAR_SETTLED_MAX)); } catch { /* the session's own set holds it */ } };
  /** R8e: a page's hook that throws is the page's - never the carrier's */
  const hear = (fn, ...args) => { try { fn(...args); } catch (e) { console.warn('[star] claim hook', e?.message ?? e); } };
  /** AUDIT SERPENT D6's law: the spoils' grant AWAITED - one that fails (thrown or rejected) leaves its receipt unsettled,
   *  so the next offer asks again and the service gives this claim its spoils again (the pool's spent mark keeps it once). */
  const granted = async (fn, ...args) => { try { await fn(...args); return true; } catch (e) { console.warn('[star] claim hook', e?.message ?? e); return false; } };
  let memory = [];
  function kept() {
    let v;
    try { v = store ? store.get(STAR_CLAIMS_KEY) : undefined; } catch { v = undefined; }
    return (Array.isArray(v) ? v : v === undefined ? memory : []).filter((e) => entry(e));
  }
  const keep = (list) => { memory = list; try { store?.set(STAR_CLAIMS_KEY, list); } catch { /* memory holds it */ } };

  async function flush() {
    if (busy) { again = true; return 0; }
    busy = true;
    lastAt = nowMs();
    let recorded = 0;
    try {
      const list = kept();
      keep(list);   // the expired go unasked
      const mine = me();
      for (const e of list) {
        if (!mine || live(e.r)?.s !== mine) continue;   // another account's waits for its own sign-in
        let answer;
        try { answer = await claim(e.r, e.ch, e.nm ?? null, e.cid); } catch { answer = { ok: false, error: 'offline' }; }
        const given = answer?.ok && answer.data?.spoils === true ? await granted(onSpoils, e, answer.data) : true;   // the spoils, this claim's
        if (answer?.ok && answer.data?.recorded === true) {
          recorded++;
          noteAct('star-held');   // STAR8: The Thirteenth of Frostfall's stars - a counted receipt, once (`recorded`)
          const n = Number.isSafeInteger(answer.data.held) ? answer.data.held : null;
          const xp = Number.isSafeInteger(answer.data.renown?.credited) ? answer.data.renown.credited : 0;
          if (n != null) say(STAR_CLAIM_TEXT.recorded(n, xp));
          let lines = null;
          try { lines = onMarks(answer.data); } catch (err) { console.warn('[star] silver lines', err?.message ?? err); }
          for (const line of Array.isArray(lines) ? lines : [lines]) if (typeof line === 'string' && line) say(line);
          hear(onRecorded, answer.data, e);
        } else if (answer?.ok && answer.data?.why === 'guest' && !guestSaid.has(e.r)) {
          guestSaid.add(e.r);
          say(STAR_CLAIM_TEXT.guest());
        } else if (answer?.ok && answer.data?.why === 'day-full' && !dayFullSaid) {
          dayFullSaid = true;
          say(STAR_CLAIM_TEXT.dayFull());
        }
        if (given && starClaimVerdict(answer) === 'done') { settled.add(e.r); markSettled(live(e.r)); keep(kept().filter((k) => k.r !== e.r)); }
      }
    } finally { busy = false; }
    if (again) { again = false; void flush(); }
    return recorded;
  }

  return {
    /** A receipt the relay handed this socket, with the character that held it and its level: kept (one a star AND account
     *  - the hub re-sends the same one; never one this device settled) and offered at once. Answers whether it is kept. */
    add(r, character, name = null, level = 1) {
      const c = live(r);
      if (!c || settled.has(r) || settledHere().includes(settledKeyOf(c)) || typeof character !== 'string' || !character) return false;
      const list = kept();
      if (!list.some((k) => { const o = readStarReceipt(k.r); return k.r === r || (o?.night === c.night && o?.star === c.star && o?.s === c.s); })) {
        const lv = Math.max(1, Math.floor(Number(level) || 1));
        keep([...list, { r, ch: character, nm: typeof name === 'string' ? name : null, lv, cid: cid() }].slice(-STAR_CLAIMS_MAX));
      }
      void flush();
      return true;
    },
    /** A frame: what is kept is offered again once STAR_CLAIM_RETRY_MS has passed since the last offer - the first frame
     *  of a session at once, and the first after another account signs in. */
    tick() {
      if (busy) return false;
      const now = nowMs(), due = now - lastAt >= STAR_CLAIM_RETRY_MS;
      if (!due && now - meAt < STAR_ME_POLL_MS) return false;
      meAt = now;
      const mine = me(), signedIn = mine !== lastMe;
      lastMe = mine;
      if (!signedIn && !due) return false;
      if (!kept().some((e) => mine && live(e.r)?.s === mine)) { lastAt = nowMs(); return false; }
      void flush();
      return true;
    },
    flush,
    /** What is kept, for the tests and the stats. */
    kept,
  };
}
