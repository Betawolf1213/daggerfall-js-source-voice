// @ts-check
// GRANT2 (2026-10-18, Mac: "Lets build the plan"; bible/11-Multiplayer/Spawn-Grants.md sections 7 and 12): THE GRANTS'
// MEASURE - what each cell's asks were, carried from the relay to the account service, which `node tools/realmReview.mjs
// grants` reads (GRANT5: seven days, then the buckets and the ceiling are set from it).
//
// A cell room folds every ask it answers (foldGrantAsk): per account and kind, the asks, the members asked for, and what
// the gate would have refused - the account's bucket, the cell's ceiling - and the most granted hostile members the cell
// held live at once. Every GRANT_MEASURE_MS, or once GRANT_MEASURE_ROWS accounts and kinds wait, it posts the batch.
// THE DOOR IS THE CHAT FEED'S (net/safety/chatFeed.js), kept as narrow:
//   - ONE WAY. The relay posts; nothing the relay does waits on the answer. A post that fails is dropped: a measure is a
//     sample, and a cell that sleeps before its post loses its window.
//   - OFF UNTIL ASKED. The relay posts only while its GRANT_FEED_URL is set (server/wrangler.toml).
//   - SIGNED with the relay's receipt key over "grant-measure1\n" + the body's bytes, in GRANT_MEASURE_SIG_HEADER; the
//     service checks it with the public half, and a batch it has seen (`id`) is not read twice.
//
// THE BATCH: {"v":"grant-measure1","id":<16 hex>,"at":<ms>,"q":<room>,"from":<ms>,"live":<n>,
//             "rows":[{"a":<account>,"k":<kind>,"asks","members","bucket","ceiling"}...]}
//
// PURE; the relay (server/src/index.js) and the service (server-account/src/grants.js) import it. Not a DFU member.
import { _b64url, SIG_BYTES, ID_RE } from './identityToken.js';
import { GRANT_KINDS } from './grantLaw.js';

/** The only version this file writes or reads - a word of its own, never a receipt's or the chat feed's. */
export const GRANT_MEASURE_V = 'grant-measure1';
/** The header the batch's signature rides. */
export const GRANT_MEASURE_SIG_HEADER = 'x-relay-grant-sig';
/** A cell posts its window this often, ms... */
export const GRANT_MEASURE_MS = 10 * 60 * 1000;
/** ...or once this many accounts and kinds wait (the batch's whole bound: the relay posts at it). */
export const GRANT_MEASURE_ROWS = 128;
/** The most bytes a batch's body may be: GRANT_MEASURE_ROWS rows of about 120 bytes, and room. */
export const GRANT_MEASURE_MAX_BYTES = 24 * 1024;
/** How old a batch may be when it arrives, ms - a replayed old one is refused. */
export const GRANT_MEASURE_AGE_MAX_MS = 10 * 60_000;
/** The most any count says. */
export const GRANT_MEASURE_COUNT_MAX = 1_000_000;
/** How long the relay waits on the service's answer, ms. */
export const GRANT_MEASURE_POST_MS = 8_000;
const ID_HEX_RE = /^[0-9a-f]{16}$/;
const ROOM_RE = /^[A-Za-z0-9_.,:+-]{1,80}$/;   // net/wire.js roomOf's own

/** @typedef {{ a: string, k: string, asks: number, members: number, bucket: number, ceiling: number }} GrantMeasureRow */
/** @typedef {{ from: number, live: number, rows: Map<string, GrantMeasureRow> }} GrantMeasure */

/** A cell's window, begun at `nowMs`. Pure. @param {number} nowMs @returns {GrantMeasure} */
export const newGrantMeasure = (nowMs) => ({ from: nowMs, live: 0, rows: new Map() });

const capped = (n) => Math.min(GRANT_MEASURE_COUNT_MAX, n);
/**
 * ONE ASK FOLDED IN: account `a`'s ask for `n` members of kind `k`, the gate's `refusal` (null, or what it would have
 * refused), the cell then holding `live` granted hostile members (the grant's own counted when it was minted). Answers
 * whether the window is full (GRANT_MEASURE_ROWS rows wait). In place.
 * @param {GrantMeasure} w @param {string} a @param {string} k @param {number} n @param {string|null} refusal @param {number} live
 */
export function foldGrantAsk(w, a, k, n, refusal, live) {
  const key = `${a}|${k}`;
  let row = w.rows.get(key);
  if (!row) { row = { a, k, asks: 0, members: 0, bucket: 0, ceiling: 0 }; w.rows.set(key, row); }
  row.asks = capped(row.asks + 1);
  row.members = capped(row.members + n);
  if (refusal === 'bucket') row.bucket = capped(row.bucket + 1);
  if (refusal === 'ceiling') row.ceiling = capped(row.ceiling + 1);
  w.live = Math.max(w.live, capped(live));
  return w.rows.size >= GRANT_MEASURE_ROWS;
}

const count = (n) => Number.isSafeInteger(n) && n >= 0 && n <= GRANT_MEASURE_COUNT_MAX;
/** Whether a parsed batch is one: its version, a 16-hex id, its clocks, its room, and 1 to GRANT_MEASURE_ROWS rows, each
 *  an account, a kind, and counts in their law (the members within the asks' most). Pure. @param {any} b */
export function grantMeasureValid(b) {
  if (!b || typeof b !== 'object' || Array.isArray(b) || b.v !== GRANT_MEASURE_V) return false;
  if (typeof b.id !== 'string' || !ID_HEX_RE.test(b.id) || !Number.isSafeInteger(b.at) || b.at <= 0) return false;
  if (!Number.isSafeInteger(b.from) || b.from <= 0 || b.from > b.at || typeof b.q !== 'string' || !ROOM_RE.test(b.q) || !count(b.live)) return false;
  if (!Array.isArray(b.rows) || !b.rows.length || b.rows.length > GRANT_MEASURE_ROWS) return false;
  return b.rows.every((r) => r && typeof r === 'object' && typeof r.a === 'string' && ID_RE.test(r.a)
    && typeof r.k === 'string' && Object.hasOwn(GRANT_KINDS, r.k)
    && count(r.asks) && r.asks >= 1 && count(r.members) && r.members <= r.asks * GRANT_KINDS[/** @type {keyof typeof GRANT_KINDS} */ (r.k)].max
    && count(r.bucket) && count(r.ceiling) && r.bucket + r.ceiling <= r.asks);
}

/** A window's batch for room `q`, posted at `nowMs`: null when nothing was asked. Pure.
 *  @param {GrantMeasure} w @param {string} id @param {string} q @param {number} nowMs */
export function grantMeasureBatch(w, id, q, nowMs) {
  if (!w.rows.size) return null;
  return { v: GRANT_MEASURE_V, id, at: nowMs, q, from: w.from, live: w.live, rows: [...w.rows.values()].map((r) => ({ ...r })) };
}

const enc = new TextEncoder();
/** The bytes a batch's signature signs. @param {Uint8Array} body */
const signedBytes = (body) => {
  const head = enc.encode(`${GRANT_MEASURE_V}\n`);
  const out = new Uint8Array(head.length + body.length);
  out.set(head, 0);
  out.set(body, head.length);
  return out;
};

/**
 * THE RELAY'S HALF: a batch's body and its signature, or null with no key or no batch.
 * @param {any} batch @param {CryptoKey|null} privateKey @param {{ subtle: SubtleCrypto }} env
 */
export async function sealGrantMeasure(batch, privateKey, { subtle }) {
  if (!privateKey || !grantMeasureValid(batch)) return null;
  const body = enc.encode(JSON.stringify(batch));
  if (body.length > GRANT_MEASURE_MAX_BYTES) return null;
  const sig = new Uint8Array(await subtle.sign({ name: 'Ed25519' }, privateKey, signedBytes(body)));
  return { body, sig: _b64url.encode(sig) };
}

/**
 * THE SERVICE'S HALF: the batch, when its signature holds and it is a batch, young enough - or `{ error }`. Never throws.
 * @param {Uint8Array} body @param {unknown} sig64 @param {CryptoKey|null} publicKey @param {{ subtle: SubtleCrypto, nowMs: number }} env
 */
export async function openGrantMeasure(body, sig64, publicKey, { subtle, nowMs }) {
  if (!publicKey) return { error: 'grant-closed' };
  if (!(body instanceof Uint8Array) || !body.length || body.length > GRANT_MEASURE_MAX_BYTES) return { error: 'grant-shape' };
  const sig = typeof sig64 === 'string' ? _b64url.decode(sig64) : null;
  if (!sig || sig.length !== SIG_BYTES) return { error: 'grant-signature' };
  let good = false;
  try { good = await subtle.verify({ name: 'Ed25519' }, publicKey, sig, signedBytes(body)); } catch { good = false; }
  if (!good) return { error: 'grant-signature' };
  let batch;
  try { batch = JSON.parse(new TextDecoder().decode(body)); } catch { return { error: 'grant-shape' }; }
  if (!grantMeasureValid(batch)) return { error: 'grant-shape' };
  if (Math.abs(nowMs - batch.at) > GRANT_MEASURE_AGE_MAX_MS) return { error: 'grant-stale' };
  return { ok: true, batch };
}
