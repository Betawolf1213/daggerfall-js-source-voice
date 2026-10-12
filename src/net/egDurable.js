// @ts-check
// EG-H2 (2026-10-12, Mac: "I said I want everything"; bible/11-Multiplayer/Elite-Gates.md section 22, slice EG8e):
// DURABILITY - an Elite Breach is a three-hour instance on infrastructure that restarts. A relay deploy drops every
// socket and restarts every Durable Object; the runtime may evict one at any time. The breach's room (server/src/index.js
// `_egOf`, `_egTick`) keeps its record in storage (every CHECKPOINT_MS, and at once at every word that moves it) and this
// law is what it does when it wakes:
//
//   TIME ACROSS A RESTART - a beat gap over EG_GAP_MS is GIVEN BACK (`egGiveBack`): every instant the record holds after
//     its first wake moves forward by the gap, so the count, the hall's timers, the lords' clocks and each member's
//     absence do not run across it. The sealed hour and the open window run on the wall clock, as the call says them,
//     and the last word never moves (the stake's live window at the service is the wall clock's too).
//   THE HOLD - a room that wakes between trials (a closing, the swap to the next hall, a rest) HOLDS: the count frozen,
//     the director still, until every living member is back in the room or EG_REJOIN_MS (180 s) has passed; then the
//     whole gap since its last beat is given back and the count runs on (`egResume`, `egHoldDone`, `egRelease`). A
//     member who returns finds the hall where they left it. A room that wakes mid-trial gives the gap back at once, and
//     the dropped socket's rule (section 6.1) carries the rest.
//   THE LAW PIN - a breach records `egv`, the spec law it was opened under (net/egBrain.js egBreachNew). EG_LAWS are the
//     laws this build draws, each with the day it became the law; a law is kept EG_LAW_KEEP_DAYS (seven days) before it
//     may leave the table. A woken room whose law is not here ends its breach with `why: 'void'` (the stake returned,
//     the Redoubts taken kept); a client whose law is not the breach's asks `{k:'spec'}` and builds from the relay's own
//     bytes (net/egLaw.js egSpecGive).
//   SECRET, DETERMINISTIC RECEIPTS - a receipt's seed is HMAC-SHA-256(rs, sub|R|kind)'s first 32 bits (`egReceiptSeed`):
//     `rs` is 32 bytes the room draws at the open and never sends, so a re-woken room mints the same roll again, never a
//     second one, and no client can compute one ahead (the leak AUDIT SD III R4 moved the Hour's honours off).
//   THE COST - at most EG_LIVE_MAX breaches live at once (the hub's list, `eglive`).
//
// Pure (the receipt seed asks the platform's SubtleCrypto, handed in). In the relay bundle. Not a DFU member. Ledger A
// (ELITE-GATES).
import { EG_LAST_WORD_MS, egCountHold, egCountRun } from './egLaw.js';

/** A beat gap past this is given back (ms - the gate's CHECKPOINT_MS: the beat runs every quarter or whole second). */
export const EG_GAP_MS = 2000;
/** The longest a woken room holds between trials for its living members to come back (ms). */
export const EG_REJOIN_MS = 180_000;
/** An instant the record holds is never earlier than its open less this (ms) - the give-back's lower bound. */
export const EG_INSTANT_SLACK_MS = 60_000;
/** How long a spec law is kept after it stops being the newest (days) - a client or a relay deployed a week apart from
 *  the other still draws a breach's own halls. */
export const EG_LAW_KEEP_DAYS = 7;
/** THE LAWS THIS BUILD DRAWS: spec law -> the day it became the law (net/egLaw.js EG_SPEC is always one). One line, read
 *  by the relay deploy's drain step (.github/workflows/relay-deploy.yml). EG-ZC: law 5 (the last fragments - the Cooling
 *  Slag, the shafts) beside law 4, kept EG_LAW_KEEP_DAYS with its generator (net/egLaw.js egHallOf's `law`). */
export const EG_LAWS = Object.freeze({ 4: '2026-10-11', 5: '2026-10-12' });
/** Does this build draw spec law `v`? */
export const egLawKnown = (/** @type {any} */ v) => Number.isSafeInteger(v) && Object.hasOwn(EG_LAWS, String(v));
/** The most breaches live at once (section 22, THE COST - the Rehearsals among them). */
export const EG_LIVE_MAX = 64;
/** Where the hub keeps its live list (breach -> `{ egv, until }`), the relay's public door that says it (the deploy's
 *  hold and drain read it), and the internal doors the Worker asks the hub through and the hub asks each room through. */
export const EG_LIVE_KEY = 'eglive';
export const EG_LIVE_PATH = '/v1/eg/live';
export const EG_INTERNAL_LIVE = '/internal/eg/live';
export const EG_INTERNAL_STAGE = '/internal/eg/stage';

/** Is breach `B` between trials - past its first wake, not ended, in a closing, the swap (an arrival) or a rest? */
export const egBetween = (/** @type {any} */ B) => !!B && !B.end && B.wk > 0 && (B.sg === 'closing' || B.sg === 'rest' || B.sg === 'arrive');
/** The living, entered members (`[sub, m]`). */
const living = (B) => Object.entries(B.mem ?? {}).filter(([, m]) => m.in && m.alive && !m.home);
/** The record's top-level fields that are never moved: the open (the last word's), the end, this law's own clocks, and
 *  the signed and spent things (receipts, orders, the company, the owed claims, the secret). */
const KEPT = new Set(['op', 'endAt', 'tk', 'gv', 'hold', 'rc', 'zs', 'co', 'owe', 'rs', 'egv', 'seed']);

/**
 * GIVE THE GAP BACK: every instant breach `B` holds after its first wake - a number between its open (less
 * EG_INSTANT_SLACK_MS) and the last word from `now` - moved forward `gap` ms, the fight's clocks and the members' with the
 * stage's and the count's. A frozen piece (a hall's spec) holds no instant and is left; nothing before the first wake
 * moves. Answers the ms given back (`B.gv` keeps the sum).
 * @param {any} B @param {number} gap @param {number} now
 */
export function egGiveBack(B, gap, now) {
  if (!B || !(gap > 0) || !(B.wk > 0) || B.end) return 0;
  const lo = B.op - EG_INSTANT_SLACK_MS, hi = now + EG_LAST_WORD_MS, seen = new Set();
  const walk = (o, top) => {
    if (seen.has(o) || Object.isFrozen(o)) return;
    seen.add(o);
    for (const k of Object.keys(o)) {
      if (top && KEPT.has(k)) continue;
      const v = o[k];
      if (typeof v === 'number') { if (v >= lo && v <= hi) o[k] = v + gap; }
      else if (v && typeof v === 'object') walk(v, false);
    }
  };
  walk(B, true);
  B.gv = (B.gv ?? 0) + gap;
  return gap;
}

/**
 * A ROOM WOKE (its record read from storage at `now`): the law pin first (`'void'` - the caller ends the breach), then a
 * breach between trials HOLDS from its last beat (`'hold'`), one mid-trial has the gap given back (`'gave'`), or nothing
 * (null - before the first wake, or within EG_GAP_MS). `B.tk` is the last beat's instant (the room stamps it).
 * @param {any} B @param {number} now
 * @returns {'void'|'hold'|'gave'|null}
 */
export function egResume(B, now) {
  if (!B || B.end) return null;
  if (!egLawKnown(B.egv)) return 'void';
  if (!(B.wk > 0)) { B.tk = now; return null; }
  const last = Number.isFinite(B.tk) && B.tk <= now ? B.tk : now;
  if (B.hold) return 'hold';   // woken again inside a hold: its release gives the whole gap back
  if (egBetween(B)) { egHoldBegin(B, last, now); return 'hold'; }
  B.tk = now;
  return now - last > EG_GAP_MS && egGiveBack(B, now - last, now) > 0 ? 'gave' : null;
}
/**
 * THE HOLD begun at `at` (the last beat): the count frozen there (whether it ran is kept), released by `until`.
 * @param {any} B @param {number} at @param {number} now
 */
export function egHoldBegin(B, at, now) {
  B.hold = { at, until: now + EG_REJOIN_MS, ran: B.cnt?.at > 0 ? 1 : 0 };
  if (B.cnt) B.cnt = egCountHold(B.cnt, at);
}
/**
 * May a held breach go on at `now`: every living member back in the room (`present` - the accounts with a fresh body
 * there), or the hold spent. A breach with nobody living goes on (the director ends it).
 * @param {any} B @param {number} now @param {Set<string>} present
 */
export function egHoldDone(B, now, present) {
  if (!B?.hold) return true;
  if (now >= B.hold.until) return true;
  const L = living(B);
  return !L.length || L.every(([sub]) => present.has(sub));
}
/**
 * THE HOLD RELEASED at `now`: the whole gap since its beat given back, the count running again if it ran. Answers the
 * ms given back.
 * @param {any} B @param {number} now
 */
export function egRelease(B, now) {
  const h = B?.hold;
  if (!h) return 0;
  B.hold = null;
  const gap = egGiveBack(B, Math.max(0, now - h.at), now);
  if (h.ran && B.cnt) B.cnt = egCountRun(B.cnt, now);
  B.tk = now;
  return gap;
}
/**
 * A BEAT at `now` of a breach whose room never slept: a gap past EG_GAP_MS since its last beat (an alarm the runtime
 * held) given back; the beat stamped. Answers the ms given back.
 * @param {any} B @param {number} now
 */
export function egBeatGap(B, now) {
  const last = B?.tk;
  if (B) B.tk = now;
  return Number.isFinite(last) && now - last > EG_GAP_MS ? egGiveBack(B, now - last, now) : 0;
}

/**
 * A RECEIPT'S OWN SEED: the first 32 bits of HMAC-SHA-256 keyed by the room's secret `rs` (64 hex) over
 * `sub|R|kind` (R the Redoubt for a `w`, 0 for an end) - the same receipt minted again draws the same roll.
 * @param {string} rs @param {string} sub @param {number} R @param {string} kind @param {SubtleCrypto} subtle
 */
export async function egReceiptSeed(rs, sub, R, kind, subtle) {
  const raw = new Uint8Array((String(rs).match(/[0-9a-f]{2}/g) ?? []).map((h) => parseInt(h, 16)));
  if (raw.length !== 32) throw new TypeError('egReceiptSeed needs the room\'s 32-byte secret');
  const key = await subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await subtle.sign('HMAC', key, new TextEncoder().encode(`${sub}|${R}|${kind}`)));
  return ((mac[0] << 24) | (mac[1] << 16) | (mac[2] << 8) | mac[3]) >>> 0;
}
