// @ts-check
// EG-PLAY (2026-10-11, the Elite Gates arc; bible/11-Multiplayer/Elite-Gates.md section 23): THE ELITE BREACH'S RECEIPT -
// the relay's signature on what a breach gave a member, the Hour's and the gate's twin (net/sdReceipt.js,
// net/gateReceipt.js).
//
//     e1.<base64url({ q, b, s, c, ... i, e })>.<base64url(64-byte Ed25519 signature)>
//         q its kind: 'w' a Redoubt taken, 'x' the member's end, 'v' a void (the stake given back)
//         b the breach (16 hex)   s the account (the identity sub)   z the open order's id (the stake it settles)
//         c the receipt's own seed (32 bits, the relay's CSPRNG - never the breach's)
//         w the Redoubt ('w')   h the hall ('w': its Court; 'x': the deepest cleared)   t seconds since the first wake
//         n the earning entrants   ew the start Redoubt   l the level the breach froze   rh 1 for a Rehearsal
//         why how the member's breach ended ('x' alone)   i issued, epoch seconds   e expires (i + EG_RECEIPT_TTL_S)
//         lk the Redoubt's lord, ft its feats ('w'; EG-E - net/egFeats.js: three bits)
//         an the Annals' pages the member was given ('x'; EG-E2 - a bit a page, net/egAnnals.js)
//
// ONE KEY, NEVER CONFUSED: GATE_SIGNING_KEY signs it as it signs every relay receipt, and the version is inside the
// signed bytes, so `e1` is refused by every other verifier and theirs by this one. The kind rides `q` - never `k`, an
// identity's field (the page's table said `k`; EG-PLAY keeps the shapes disjoint).
//
// PURE, and all three ends import it. Not a DFU member. Ledger A (ELITE-GATES).
import { _b64url, SIG_BYTES, SKEW_S, ID_RE } from './identityToken.js';

/** The only version this file reads or writes. */
export const EG_RECEIPT_V = 'e1';
/** How long a receipt may be carried to the account service: a week, the gate's own. */
export const EG_RECEIPT_TTL_S = 7 * 24 * 3600;
/** The bound on a receipt's length on the wire. */
export const EG_RECEIPT_MAX = 640;
/** The kinds, and how a member's breach may end. */
export const EG_RECEIPT_KINDS = Object.freeze(['w', 'x', 'v']);
export const EG_END_WHYS = Object.freeze(['fall', 'home', 'tear', 'wipe', 'last', 'empty', 'void', 'gone', 'rehearsal']);
/** EG-E2: the bound on an end's `an` - one bit a page, thirty pages (net/egAnnals.js EG_ANNALS). */
export const EG_ANNALS_BITS_MAX = 2 ** 30 - 1;
const enc = new TextEncoder();
const dec = new TextDecoder();
const BREACH_RE = /^[0-9a-f]{16}$/;
const ZID_RE = /^[a-z0-9]{16,32}$/;
const int = (v, lo, hi) => Number.isSafeInteger(v) && v >= lo && v <= hi;

/**
 * Everything a well-formed breach receipt's claims must be, before any signature is considered. Another signed shape's
 * fields are refused outright.
 * @param {any} c
 */
export function egReceiptValid(c) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) return false;
  if (c.n0 !== undefined || c.k !== undefined || c.o !== undefined || c.d !== undefined || c.x !== undefined || c.r !== undefined || c.y !== undefined) return false;
  if (!EG_RECEIPT_KINDS.includes(c.q)) return false;
  if (typeof c.b !== 'string' || !BREACH_RE.test(c.b)) return false;
  if (typeof c.s !== 'string' || !ID_RE.test(c.s)) return false;
  if (typeof c.z !== 'string' || !ZID_RE.test(c.z)) return false;
  if (!Number.isSafeInteger(c.i) || !Number.isSafeInteger(c.e) || c.e <= c.i || c.e - c.i > EG_RECEIPT_TTL_S) return false;
  if (c.q === 'v') return Object.keys(c).every((f) => ['q', 'b', 's', 'z', 'i', 'e'].includes(f));
  if (!int(c.c, 0, 0xffffffff) || !int(c.h, 0, 99_999) || !int(c.t, 0, 7 * 24 * 3600) || !int(c.n, 0, 8) || !int(c.ew, 0, 999) || !int(c.l, 1, 999)) return false;
  if (c.rh !== undefined && c.rh !== 1) return false;
  // EG-E: a Redoubt's lord (`lk`) and its feats (`ft`, three bits - net/egFeats.js), where it says them
  if (c.lk !== undefined && (typeof c.lk !== 'string' || !/^[a-z]{1,16}$/.test(c.lk))) return false;
  if (c.ft !== undefined && !int(c.ft, 0, 7)) return false;
  // EG-E2: the pages of the Annals the member was given (`an`, bit p page p of net/egAnnals.js's thirty), an end's alone -
  // the account keeps them (server-account/src/egHonours.js, `players.eg_annals`)
  if (c.an !== undefined && (c.q !== 'x' || !int(c.an, 0, EG_ANNALS_BITS_MAX))) return false;
  if (c.q === 'w') return int(c.w, 1, 19_999) && c.why === undefined;
  return EG_END_WHYS.includes(c.why) && c.w === undefined;
}

/**
 * MINT - the relay's half. With no key the receipt goes out unsigned (`e1.<body>.`), and the service declines it.
 * @param {Record<string, any>} what the claims less `i` and `e`
 * @param {CryptoKey|null} privateKey an Ed25519 private key (net/gateReceipt.js importReceiptKey), or null for none
 * @param {{subtle: SubtleCrypto, nowS: number}} env
 * @returns {Promise<string>}
 */
export async function mintEgReceipt(what, privateKey, { subtle, nowS }) {
  if (!Number.isSafeInteger(nowS)) throw new TypeError('mintEgReceipt needs an integer epoch-seconds clock');
  const claims = { ...what, i: nowS, e: nowS + EG_RECEIPT_TTL_S };
  if (!egReceiptValid(claims)) throw new TypeError('mintEgReceipt refused a claim set it could not verify');
  const body = _b64url.encode(enc.encode(JSON.stringify(claims)));
  if (!privateKey) return `${EG_RECEIPT_V}.${body}.`;
  const sig = new Uint8Array(await subtle.sign({ name: 'Ed25519' }, privateKey, enc.encode(`${EG_RECEIPT_V}.${body}`)));
  return `${EG_RECEIPT_V}.${body}.${_b64url.encode(sig)}`;
}

/**
 * READ - the client's half: the claims of a receipt the relay handed this socket, signed or not, never a verdict on it.
 * Null for anything that is not a well-formed breach receipt.
 * @param {unknown} r
 */
export function readEgReceipt(r) {
  if (typeof r !== 'string' || r.length > EG_RECEIPT_MAX) return null;
  const parts = r.split('.');
  if (parts.length !== 3 || parts[0] !== EG_RECEIPT_V) return null;
  const raw = _b64url.decode(parts[1]);
  if (!raw) return null;
  let c;
  try { c = JSON.parse(dec.decode(raw)); } catch { return null; }
  return egReceiptValid(c) ? { ...c, signed: parts[2].length > 0 } : null;
}

/**
 * VERIFY - the account service's half. `{ ok: true, claims }` or `{ ok: false, why }`, never a throw: the gate's
 * verifier rung for rung (the version first, the signature before the content).
 * @param {unknown} r
 * @param {CryptoKey} publicKey the relay's Ed25519 public half
 * @param {{subtle: SubtleCrypto, nowS: number, skewS?: number}} env
 * @returns {Promise<{ok: true, claims: any} | {ok: false, why: string}>}
 */
export async function verifyEgReceipt(r, publicKey, { subtle, nowS, skewS = SKEW_S }) {
  if (typeof r !== 'string' || r.length > EG_RECEIPT_MAX) return { ok: false, why: 'shape' };
  const parts = r.split('.');
  if (parts.length !== 3) return { ok: false, why: 'shape' };
  const [v, body, sig64] = parts;
  if (v !== EG_RECEIPT_V) return { ok: false, why: 'version' };
  if (!sig64) return { ok: false, why: 'unsigned' };
  const sig = _b64url.decode(sig64);
  if (!sig || sig.length !== SIG_BYTES) return { ok: false, why: 'sig-shape' };
  const raw = _b64url.decode(body);
  if (!raw) return { ok: false, why: 'body-shape' };
  let good = false;
  try { good = await subtle.verify({ name: 'Ed25519' }, publicKey, sig, enc.encode(`${v}.${body}`)); } catch { return { ok: false, why: 'verify-threw' }; }
  if (!good) return { ok: false, why: 'signature' };
  let claims;
  try { claims = JSON.parse(dec.decode(raw)); } catch { return { ok: false, why: 'json' }; }
  if (!egReceiptValid(claims)) return { ok: false, why: 'claims' };
  if (!Number.isSafeInteger(nowS)) return { ok: false, why: 'clock' };
  if (nowS >= claims.e) return { ok: false, why: 'expired' };
  if (claims.i > nowS + skewS) return { ok: false, why: 'future' };
  return { ok: true, claims };
}
