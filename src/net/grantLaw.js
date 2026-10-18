// @ts-check
// GRANT1 (2026-10-18, Mac: "Lets build the plan"; bible/11-Multiplayer/Spawn-Grants.md sections 4 and 7): THE SPAWN
// GRANT'S LAW, PURE - what the relay signs when a foe that rides to another player is made, and what every reader checks.
// GRANT2 (section 12) wires the asks: the client's (net/online.js sendGrant, scenes/grantHost.js) and the relay's
// (server/src/index.js _grantFrame), measured (net/grantMeasure.js). The reader's check is GRANT3's.
//
//   THE FRAME (GRANT2):  client -> cell  {t:'grant', k:'mint', id, kind, n}   validGrantAsk; on grantGate's bucket
//                        cell -> client  {t:'grant', k:'ok', id, gr}          the grant, signed (validGrantOut)
//                                        {t:'grant', k:'no', id, r}           a refusal: the gate's, while enforcing; `cell`
//                                                                             to a pose not in the cell
//                                        {t:'grant', k:'off', id}             the law is off: ask no more
//                        welcome `gm`    the law's mode in a cell (GRANT_MODES), from world218 (GRANT_RELAY_MIN)
//
//   A GRANT (section 4.2) - the room's own number `g`, the owner's socket id `o`, the room it was minted for `q`, the
//     owner's account `a` (its token's `s` - a guest's token has its own; '' for a socket with none), its kind `k`, the map
//     pixel the relay read off the owner's pose `p`, the world minute `m`, the owner's signed level `l` and Renown `r` (0
//     where its token says none - a guest's Renown), how many foes it stands
//     `n`, the seed `s`, which members are elite `e` (a bitmask) and each member's champion trait `c` (-1 none), when it
//     expires `x`, and the relay's signature `sg`.
//   THE SIGNATURE - Ed25519 with the relay's receipt key (GATE_SIGNING_KEY), verified with its public half (`rk`, the
//     account service's /v1/eg/keys), as the Elite Gates arch call is (net/eliteGates/egCallSig.js). ONE KEY, NEVER
//     CONFUSED: the signed bytes begin `spawn-grant1\n`, so no receipt (its version and a '.') and no call (`ec1|`)
//     verifies as a grant, nor a grant as either.
//   THE MARKS (section 4.2, `e` and `c`) - rolled by the relay from the seed alone, so a mint asked again rolls the same.
//     Three draws a member, always: the elite's, the champion's chance, its trait. RENOWN-GATE as the street has it
//     (systems/eliteFoes.js rollOverworldElite): the elite's draw is made first, then the Renown's word. An elite is
//     never a champion (scenes/exteriorFoes.js: `!entity.eliteFoe` before applyChampion).
//   THE DICE (section 4.4) - one seeded stream per die (GRANT_DICE), never one stream in an order: chooseRandomEnemy
//     draws a variable count (its short-list guard), and a stream shared with the next die would shift it.
//   THE GATE (section 4.6) - each account's bucket per kind, one ask spending one token (net/wire.js tokenGate, the
//     relay's one bucket), so a fisher's asks are an honest player's; and the cell's ceiling on live hostile members.
//     Guests have the same budget (Mac, 2026-10-18, Spawn-Grants section 10 question 1).
//   THE READER'S CHECK (section 4.7) - the sender, the cell, the expiry and the member index (grantRefusal); a record's
//     elite and champion only as the grant's or less (grantMarksAllow) - a mark worn below its grant costs only the
//     liar. The dice's match, the verdict cache and the tally are GRANT3's.
//
// Not a DFU member: online, an encounter's dice come from the relay's seed. The slice that ships that (GRANT2) adds
// its bracket to Port-Ledger section A, row ONLINE (Spawn-Grants section 6).
import { _b64url, SIG_BYTES, ID_RE, characterLevelIssuable, renownIssuable } from './identityToken.js';
import { EG_CALL_SG_RE, roomOf, tokenGate } from './wire.js';   // a signature's shape on the wire (64 bytes, base64url) - the wire's own; a room's name; the relay's one bucket

/** The version leading the signed bytes, and the line that ends it. */
export const GRANT_SIG_V = 'spawn-grant1';

/** A grant's life, ms - "about ten minutes on" (Spawn-Grants section 4.2; OPEN: GRANT5's measure sets it). A live
 *  grant is renewed before it (`renew`). */
export const GRANT_TTL_MS = 10 * 60 * 1000;
/** A reader's clock against the relay's, ms: a grant is believed this long past its `x`. */
export const GRANT_SKEW_MS = 60 * 1000;

/** THE PINNED RATES (section 4.2): the relay cannot import the modules that hold them (they reach the loot tables), so
 *  each is a copy here, held equal to its home by test/net/grant1_law.test.js. */
/** systems/eliteFoes.js ELITE_FOE_OVERWORLD_CHANCE. */
export const GRANT_ELITE_CHANCE = 0.05;
/** systems/eliteFoes.js ELITE_FOE_MIN_RENOWN - an elite stands for an owner of this Renown or more. */
export const GRANT_ELITE_MIN_RENOWN = 5;
/** systems/champions.js CHAMPION_PER_MILLE. */
export const GRANT_CHAMPION_PER_MILLE = 70;
/** systems/champions.js CHAMPION_TRAITS.length - `c` holds an index into them. */
export const GRANT_CHAMPION_TRAITS = 5;

/** THE KINDS (section 4.9), the two of GRANT2's first stream: `max` the most members one grant stands, `rate` and `cap`
 *  the account's bucket - asks a second, and the burst (PROVISIONAL: GRANT5's measure sets both; Spawn-Grants section
 *  10 question 3, seven days), `hostile` whether its members count against the cell's ceiling. The other sources' kinds
 *  come with their own slices (GRANT4).
 *    enc  - a random encounter (systems/encounters.js): systems/roadEncounters.js ROAD_PARTY_MAX, its party's extra
 *           foes inside it (wandererCount).
 *    camp - a camp or a pack (systems/campEncounters.js): CAMP_SIZE's top and the party's extra (systems/party/
 *           partyScale.js PARTY_SCALE_EXTRA_MAX, partyGroupMembers).
 *  Each `max` is held equal to its home by the test. */
export const GRANT_KINDS = Object.freeze({
  enc: Object.freeze({ max: 4, rate: 1 / 60, cap: 6, hostile: true }),
  camp: Object.freeze({ max: 8, rate: 1 / 20, cap: 9, hostile: true }),
});
/** The cell's ceiling on live granted hostile members, every sender together (section 4.6; Mac, 2026-10-18, question
 *  5: on, at the number the measure gives - PROVISIONAL until GRANT5). */
export const GRANT_CELL_CEILING = 192;

/** What a refusal says - the relay's mint (kind, size, bucket, ceiling) and a reader's (the rest); a reader's tally
 *  counts by it (GRANT3). */
export const GRANT_REFUSALS = Object.freeze(['kind', 'size', 'bucket', 'ceiling', 'unsigned', 'sender', 'cell', 'expired', 'member', 'marks']);

/** The dice a granted member's identity is drawn with (section 4.4), each its own stream: its species
 *  (chooseRandomEnemy, or the kind's own table), its level in its band, its weapon (equipEnemy), its health. */
export const GRANT_DICE = Object.freeze(['species', 'level', 'weapon', 'health']);

/** FNV-1a over the parts' text, then mulberry32 - systems/eliteFoes.js eliteHash and eliteRng, the same law (the test
 *  holds them equal); a copy because this module is the relay's too. */
function grantHash(...parts) {
  let h = 0x811c9dc5;
  for (const p of parts) {
    const t = String(p);
    for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    h ^= 0x2c; h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}
/** A grant's seeded [0,1) stream for one purpose: `eliteRng(eliteHash('grant', s, salt))`. Pure.
 *  @param {number} s @param {string} salt @returns {() => number} */
export function grantRng(s, salt) {
  let a = grantHash('grant', s >>> 0, salt);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Member `i`'s dice: one stream per GRANT_DICE word, the same on the owner's machine and every reader's. Pure.
 *  @param {number} s @param {number} i @returns {Readonly<Record<string, () => number>>} */
export function grantDice(s, i) {
  return Object.freeze(Object.fromEntries(GRANT_DICE.map((d) => [d, grantRng(s, `${d}:${i}`)])));
}

/** THE MARKS - the relay's roll of `e` and `c` for `n` members of seed `s`, its owner of Renown `r`. Pure.
 *  @param {number} s @param {number} n @param {number} r @returns {{ e: number, c: number[] }} */
export function grantMarks(s, n, r) {
  const rng = grantRng(s, 'marks');
  let e = 0;
  const c = [];
  for (let i = 0; i < n; i++) {
    const elite = rng() < GRANT_ELITE_CHANCE, chance = rng(), trait = rng();   // three draws a member, always
    if (elite && r >= GRANT_ELITE_MIN_RENOWN) { e |= 1 << i; c.push(-1); continue; }
    c.push(chance * 1000 < GRANT_CHAMPION_PER_MILLE ? Math.floor(trait * GRANT_CHAMPION_TRAITS) : -1);
  }
  return { e, c };
}

/** @typedef {{ g: number, o: string, q: string, a: string, k: string, p: [number, number], m: number, l: number, r: number, n: number, s: number, e: number, c: number[], x: number, sg?: string }} SpawnGrant */

const intIn = (v, lo, hi) => Number.isSafeInteger(v) && v >= lo && v <= hi;
/**
 * A grant as the wire carries it, read whole or not at all: a fresh grant, or null. `sg`, when present, must be a
 * signature's shape; a grant with none is still read (the relay's own, before it signs). Pure.
 * @param {any} v @returns {SpawnGrant|null}
 */
export function validGrant(v) {
  if (!v || typeof v !== 'object') return null;
  const law = typeof v.k === 'string' && Object.hasOwn(GRANT_KINDS, v.k) ? GRANT_KINDS[/** @type {keyof typeof GRANT_KINDS} */ (v.k)] : null;
  if (!law) return null;
  if (!intIn(v.g, 0, 0x7fffffff) || typeof v.o !== 'string' || !ID_RE.test(v.o)) return null;
  if (typeof v.q !== 'string' || roomOf(`/room/${v.q}`) !== v.q) return null;
  if (typeof v.a !== 'string' || (v.a !== '' && !ID_RE.test(v.a))) return null;
  if (!Array.isArray(v.p) || v.p.length !== 2 || !intIn(v.p[0], 0, 999) || !intIn(v.p[1], 0, 499)) return null;
  if (!intIn(v.m, 0, Number.MAX_SAFE_INTEGER) || !intIn(v.x, 1, Number.MAX_SAFE_INTEGER)) return null;
  if (!(v.l === 0 || characterLevelIssuable(v.l)) || !(v.r === 0 || renownIssuable(v.r))) return null;
  if (!intIn(v.n, 1, law.max) || !intIn(v.s, 0, 0xffffffff) || !intIn(v.e, 0, (1 << v.n) - 1)) return null;
  if (!Array.isArray(v.c) || v.c.length !== v.n) return null;
  for (let i = 0; i < v.n; i++) {
    if (!intIn(v.c[i], -1, GRANT_CHAMPION_TRAITS - 1)) return null;
    if (((v.e >>> i) & 1) && v.c[i] !== -1) return null;   // an elite is never a champion
  }
  if (v.sg !== undefined && (typeof v.sg !== 'string' || !EG_CALL_SG_RE.test(v.sg))) return null;
  /** @type {SpawnGrant} */
  const g = { g: v.g, o: v.o, q: v.q, a: v.a, k: v.k, p: [v.p[0], v.p[1]], m: v.m, l: v.l, r: v.r, n: v.n, s: v.s, e: v.e, c: v.c.slice(), x: v.x };
  if (v.sg !== undefined) g.sg = v.sg;
  return g;
}

/** THE SIGNED BYTES: every field but `sg`, in one fixed order. Pure. @param {SpawnGrant} g */
export function grantBytes(g) {
  return `${GRANT_SIG_V}\n${g.g}|${g.o}|${g.q}|${g.a}|${g.k}|${g.p[0]},${g.p[1]}|${g.m}|${g.l}|${g.r}|${g.n}|${g.s}|${g.e}|${g.c.join(',')}|${g.x}`;
}

const enc = new TextEncoder();
/**
 * SIGN - the relay's half: `sg`, or '' with no key (a relay built without GATE_SIGNING_KEY signs nothing).
 * @param {SpawnGrant} g @param {CryptoKey|null} privateKey @param {{ subtle: SubtleCrypto }} env
 */
export async function signGrant(g, privateKey, { subtle }) {
  if (!privateKey) return '';
  const sig = new Uint8Array(await subtle.sign({ name: 'Ed25519' }, privateKey, enc.encode(grantBytes(g))));
  return _b64url.encode(sig);
}

/**
 * VERIFY - a reader's half: whether `g.sg` is the relay's signature over the grant read whole. Never throws.
 * @param {any} g @param {CryptoKey|null} publicKey @param {{ subtle: SubtleCrypto }} env
 */
export async function verifyGrant(g, publicKey, { subtle }) {
  const v = validGrant(g);
  if (!publicKey || !v || typeof v.sg !== 'string') return false;
  const sig = _b64url.decode(v.sg);
  if (!sig || sig.length !== SIG_BYTES) return false;
  try { return await subtle.verify({ name: 'Ed25519' }, publicKey, sig, enc.encode(grantBytes(v))); } catch { return false; }
}

/**
 * THE MINT'S GATE - the relay's word on an account's ask for `n` members of kind `k`, the cell holding `live` granted
 * hostile members now: `refusal` null to mint, else the first that stands of 'kind', 'size', 'ceiling', 'bucket'. The
 * ceiling is asked before the bucket, so an ask the cell refuses spends nothing of the asker's. `bucket` is the
 * account's own for the kind (tokenGate's shape; undefined for a first ask), and the answer's is the one to keep. Pure.
 * @param {string} k @param {number} n @param {{ tokens: number, at: number }|undefined} bucket @param {number} live @param {number} nowMs
 * @returns {{ bucket: { tokens: number, at: number }|undefined, refusal: string|null }}
 */
export function grantMintGate(k, n, bucket, live, nowMs) {
  const law = Object.hasOwn(GRANT_KINDS, k) ? GRANT_KINDS[/** @type {keyof typeof GRANT_KINDS} */ (k)] : null;
  if (!law) return { bucket, refusal: 'kind' };
  if (!intIn(n, 1, law.max)) return { bucket, refusal: 'size' };
  if (law.hostile && live + n > GRANT_CELL_CEILING) return { bucket, refusal: 'ceiling' };
  const gate = tokenGate(bucket, nowMs, law.rate, law.cap);
  return { bucket: gate.bucket, refusal: gate.pass ? null : 'bucket' };
}

/**
 * THE READER'S CHECK, past the signature: why member `i` of grant `g` may not stand from sender `from` in cell `cell`
 * at `nowMs` - 'sender', 'cell', 'expired', 'member' - or null. Pure.
 * @param {SpawnGrant} g @param {{ from: string, cell: string, nowMs: number, i: number }} at
 */
export function grantRefusal(g, { from, cell, nowMs, i }) {
  if (g.o !== from) return 'sender';
  if (g.q !== cell) return 'cell';
  if (!(nowMs <= g.x + GRANT_SKEW_MS)) return 'expired';
  if (!Number.isInteger(i) || i < 0 || i >= g.n) return 'member';
  return null;
}

/** Whether a record's elite (`z`) and champion (`cp`) are within member `i`'s grant: an elite only where `e` says, a
 *  trait only `c`'s own - and either left off is always believed (a mark worn below its grant costs only the liar). Pure.
 *  @param {SpawnGrant} g @param {number} i @param {{ z?: any, cp?: any }} rec */
export const grantMarksAllow = (g, i, { z, cp }) => (!z || ((g.e >>> i) & 1) === 1) && (cp == null || cp === g.c[i]);

// ── GRANT2: THE ASK, THE ANSWER, THE MODE (Spawn-Grants section 12) ─────────────────────────────────────────────────
/** The first relay that takes the `grant` frame (RELAY_VERSION's number). An older relay refuses a frame it does not
 *  know by closing the socket, so a client asks only of a relay at this or later (relayCfgSupported's way). */
export const GRANT_RELAY_MIN = 218;
/** Does the relay at version `v` take a grant's ask? */
export const relaySupportsGrant = (v) => Number(/^world(\d+)$/.exec(String(v ?? ''))?.[1]) >= GRANT_RELAY_MIN;

/** The law's modes (relayCfg `grantMode`, the welcome's `gm`): `off` - no ask is made or answered; `measure` - every ask
 *  is granted and what the gate would refuse is counted (GRANT2 to GRANT5); `enforce` - the gate refuses (GRANT6). */
export const GRANT_MODES = Object.freeze(['off', 'measure', 'enforce']);
/** The mode a setting names: `off` and `enforce` exactly, anything else `measure` - the law measures from its deploy
 *  (Mac, 2026-10-18: "Measure on deploy"), and a setting nobody wrote is that. Pure. @param {unknown} v */
export const grantModeOf = (v) => (v === 'off' || v === 'enforce' ? v : 'measure');

/** The most a client's ask number may be - it names the answer that comes back, nothing more. */
export const GRANT_ASK_ID_MAX = 0x7fffffff;
/**
 * An ask as the relay reads it: `{ k: 'mint', id, kind, n }` - `kind` one of GRANT_KINDS, `n` within its most. Null for
 * anything else. Pure.
 * @param {any} m @returns {{ k: 'mint', id: number, kind: string, n: number }|null}
 */
export function validGrantAsk(m) {
  if (!m || typeof m !== 'object' || m.k !== 'mint' || !intIn(m.id, 0, GRANT_ASK_ID_MAX)) return null;
  if (typeof m.kind !== 'string' || !Object.hasOwn(GRANT_KINDS, m.kind)) return null;
  if (!intIn(m.n, 1, GRANT_KINDS[/** @type {keyof typeof GRANT_KINDS} */ (m.kind)].max)) return null;
  return { k: 'mint', id: m.id, kind: m.kind, n: m.n };
}

/**
 * The relay's answer as a client reads it: `{ k: 'ok', id, gr }` (the grant, read whole), `{ k: 'no', id, r }` (the
 * gate's refusal), `{ k: 'off', id }` (the law is off: ask no more this session). Null for anything else. Pure.
 * @param {any} m
 * @returns {{ k: 'ok', id: number, gr: SpawnGrant }|{ k: 'no', id: number, r: string }|{ k: 'off', id: number }|null}
 */
export function validGrantOut(m) {
  if (!m || typeof m !== 'object' || !intIn(m.id, 0, GRANT_ASK_ID_MAX)) return null;
  if (m.k === 'off') return { k: 'off', id: m.id };
  if (m.k === 'no') return typeof m.r === 'string' && GRANT_REFUSALS.includes(m.r) ? { k: 'no', id: m.id, r: m.r } : null;
  if (m.k !== 'ok') return null;
  const gr = validGrant(m.gr);
  return gr ? { k: 'ok', id: m.id, gr } : null;
}

/** Is an account's bucket for kind `k` full again at `nowMs` - one the relay may forget, since a first ask's bucket is
 *  full? Pure. @param {string} k @param {{ tokens: number, at: number }|undefined} b @param {number} nowMs */
export function grantBucketIdle(k, b, nowMs) {
  const law = Object.hasOwn(GRANT_KINDS, k) ? GRANT_KINDS[/** @type {keyof typeof GRANT_KINDS} */ (k)] : null;
  if (!law || !b) return true;
  return b.tokens + ((nowMs - b.at) / 1000) * law.rate >= law.cap;
}

/** A socket's asks a second at the relay, and its burst - a chunk entered rolls up to three camps at once
 *  (systems/campEncounters.js CAMP_GROUPS_ON_CHUNK_LOAD), two chunks at a corner. The law's own buckets are the
 *  account's (grantMintGate); this one guards the room from a flood of frames. */
export const GRANT_HZ_MAX = 2;
export const GRANT_BURST_MAX = 8;
/** The per-socket gate the relay spends an ask on. */
export const grantGate = (bucket, nowMs) => tokenGate(bucket, nowMs, GRANT_HZ_MAX, GRANT_BURST_MAX);
/** How often a cell asks the hub for the law's mode again, at an ask, ms: a staff change is in force everywhere inside
 *  it (relayCfg's RELAY_CFG_TTL_MS is a boss room's minute; every cell a player roams asks this one). */
export const GRANT_CFG_TTL_MS = 5 * 60 * 1000;
