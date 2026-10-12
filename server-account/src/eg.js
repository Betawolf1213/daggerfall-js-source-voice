// @ts-check
// ═══════════════════════════════════════════════════════════════════
// EG-PLAY (2026-10-11, the Elite Gates arc) — THE ELITE BREACH, AS THE SERVICE KEEPS IT.
//
// Mac: "an endless procedural breach for a party of 8 ... keys ... checkpoints". Design:
// bible/11-Multiplayer/Elite-Gates.md sections 5, 16 and 23.
//
// ═══ THE BALANCE IS THE ACCOUNT'S ══════════════════════════════════
//
// A Weir Key opens a real relay instance, so it is a count on the account's row (`players.eg_keys`, migration 0111) -
// the item in the pack is its face, restacked by the client to every answer here that carries the count (`keys`). The
// service rolls every key with its own die (`rand`), at a claim it already verifies: a recorded Dagon's Breach kill
// (one in six, one in four for a fighter who broke the rite, the account's first kill certain, and the sixth kill after
// five in a row with none - the pity), and a recorded Hour (one in three).
//
// ═══ THE OPEN AND THE STAKE ════════════════════════════════════════
//
// `/v1/eg/open` takes one key (or the day's Rehearsal, no key) into a STAKE and signs the open order the hub opens the
// breach on (identityToken.js mintEgOrder - `egopen`). One conditional UPDATE takes the key and sets the account's live
// breach together (the insignia spend's way): two opens at once take one key and one breach. It is idempotent on the
// client's request id `rq` - a client that lost the answer asks again and gets the same breach back. A member's
// `/v1/eg/admit` sets the same live breach (one breach at a time, every account) and signs its admission. A lapsed live
// breach counts as clear: no lost receipt locks an account out.
//
// ═══ THE CLAIM ═════════════════════════════════════════════════════
//
// The relay's `e1` receipts (src/net/egReceipt.js), carried here by the account they name: a Redoubt taken (`w`) -
// one row a (breach, account, Redoubt), the signed win's spoils, and the stake spent; the member's end (`x`) - one row a
// (breach, account), the live breach cleared, and the stake settled (spent, or returned once ever by the first breach's
// mercy when the breach took no Redoubt); a void (`v`) - the stake given back. Guests are answered `guest` and counted
// nothing, as every claim's are.
//
// EG-E1 (2026-10-12, Mac: "I said I want everything"; Elite-Gates.md section 19): WHAT A REDOUBT PAYS - the week's pay,
// its Marks and guild's deed, its embers, a Valkynaz's Weir Key and the Panoply's pity - is egEconomy.js's, written in the
// `w` claim's own batch; the end's Reliquaries answered by the week's pay; the Broker's Panoply sink (`/v1/eg/sink`).
// ═══ THE DUNGEON'S FIND (EG-E3) ════════════════════════════════════
//
// No relay witnesses an ordinary dungeon, so an elite foe's killer's client asks (`/v1/eg/find`, section 5) with the
// dungeon's tier, and the service rolls the key with its own die - bounded, never believed: a handle and a proven account,
// EG_FIND_PER_DAY asks a tier a real day, EG_FIND_KEYS_PER_WEEK keys a week from finds (`eg_finds`, migration 0111).
//
// EVERY CLOCK IS AN ARGUMENT, as in accounts.js.
// ═══════════════════════════════════════════════════════════════════

import { verifyEgReceipt } from '../../src/net/egReceipt.js';
import { mintEgOrder } from '../../src/net/identityToken.js';
import { utcDay } from '../../src/net/marksLaw.js';
import { egHonourStatements, egHonoursAnswer, egRecordOf } from './egHonours.js';   // EG-E2: the feats, the Annals, the honours
import { egRedoubtPay, egReliquariesOf, egSinkOf } from './egEconomy.js';   // EG-E1: what a Redoubt pays, the sink
import { arenaWeekOf } from '../../src/net/arenaLaw.js';   // EG-E3: the week a find's keys are capped by, the arena's

/** The odds a recorded gate kill rolls a key, a fighter who broke the rite, an Hour; the kills in a row the pity waits. */
export const EG_KEY_ODDS = 1 / 6;
export const EG_KEY_ODDS_RITE = 1 / 4;
export const EG_KEY_ODDS_SD = 1 / 3;
export const EG_KEY_PITY = 5;
/** A live breach's bound past its open: the last word (36 game hours, three real ones - src/net/egLaw.js
 *  EG_LAST_WORD_MS, pinned equal), the open window before it, and ten minutes' slack. */
export const EG_LAST_WORD_S = 10_800;
export const EG_OPEN_WINDOW_S = 600;
export const EG_LIVE_SLACK_S = 600;
export const EG_LIVE_S = EG_LAST_WORD_S + EG_OPEN_WINDOW_S + EG_LIVE_SLACK_S;
/** EG-E3 (2026-10-12, Mac: "I said I want everything"; section 5, "The dungeon's find"): a dungeon elite's odds of a key,
 *  by the dungeon's tier as the port names it (src/systems/dungeonTier.js DUNGEON_TIERS - `super` the player's Abyss
 *  Dungeon); the asks a tier an account a real UTC day; the keys finds may pay an account an arena week. At the caps a
 *  forger's ceiling is 6/400 + 6/150 + 6/60 = 0.155 keys a day, under an honest gatebreaker's. */
export const EG_FIND_ODDS = Object.freeze({ super: 1 / 60, elite: 1 / 150, regular: 1 / 400 });
export const EG_FIND_PER_DAY = 6;
export const EG_FIND_KEYS_PER_WEEK = 2;
/** A request id an open is idempotent on, a breach id, an order id. */
export const EG_RQ_RE = /^[a-z0-9]{16,32}$/;
const BREACH_RE = /^[0-9a-f]{16}$/;

const int = (v) => (Number.isSafeInteger(Number(v)) ? Number(v) : 0);
const hex = (b) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
/** The account's live breach, if it still holds at `nowS`. */
const liveOf = (row, nowS) => (row?.eg_live_b && int(row.eg_live_until) > nowS ? { b: row.eg_live_b, until: int(row.eg_live_until) } : null);
/** May the account stake a key at all: a Dagon's Breach closed (a recorded kill, never the rite alone) or a Redoubt
 *  taken (section 5 - a fresh account cannot farm or open). The Rehearsal asks neither. */
async function proven(db, id) {
  const r = await db.prepare("SELECT (EXISTS (SELECT 1 FROM gate_kills WHERE account = ?1 AND earned != 'rite') OR EXISTS (SELECT 1 FROM eg_redoubts WHERE account = ?1)) AS ok").bind(id).first();
  return int(r?.ok) === 1;
}
async function playerRow(db, id) {
  return db.prepare('SELECT eg_keys, eg_key_miss, eg_live_b, eg_live_until, eg_rh_day, eg_mercy FROM players WHERE id = ?1').bind(id).first();
}

/**
 * THE BALANCE AND THE LIVE BREACH - `{ keys, live, rehearsal, proven, redoubts, sink, annals, feats }`: the Weir Keys held,
 * the breach the account is in (`{b, until}`, or null), whether the day's Rehearsal is still free, whether it may stake a
 * key, the Redoubts it has taken, (EG-E1) the week's Panoply sink - `{ week, piece }`, the piece null until one is bought -
 * and (EG-E2) the Annals' pages it keeps and each lord's feats (egHonours.js egRecordOf).
 * @param {{ db: any, nowS: number }} ctx @param {{ id: string }} player
 */
export async function egKeysOf({ db, nowS }, player) {
  const row = await playerRow(db, player.id);
  const rd = await db.prepare('SELECT COUNT(*) AS n FROM eg_redoubts WHERE account = ?1').bind(player.id).first();
  return { keys: int(row?.eg_keys), live: liveOf(row, nowS), rehearsal: int(row?.eg_rh_day) !== utcDay(nowS), proven: await proven(db, player.id), redoubts: int(rd?.n), sink: await egSinkOf({ db, nowS }, player), ...(await egRecordOf(db, player.id)) };
}

/**
 * THE OPEN: one key staked (`rh` 1: the day's Rehearsal, no key) and the open order signed. Answers `{ order, b, ez,
 * keys, until, rh }`, or `{ error }`: `no-signing-key` (503), `guest`, `rq` (a bad request id), `unproven` (no gate
 * closed, no Redoubt taken), `live` (a breach held - `b` which), `short` (no key), `rehearsed` (today's Rehearsal
 * spent).
 * @param {{ db: any, nowS: number, subtle: SubtleCrypto, rand: (b: Uint8Array) => Uint8Array }} ctx
 * @param {{ id: string, handle?: string|null }} player @param {any} body @param {CryptoKey|null} key
 */
export async function openEg({ db, nowS, subtle, rand }, player, body, key) {
  if (!key) return { error: 'no-signing-key' };
  if (!player.handle) return { error: 'guest' };
  const rq = body?.rq, rh = body?.rh === 1 ? 1 : 0;
  if (typeof rq !== 'string' || !EG_RQ_RE.test(rq)) return { error: 'rq' };
  // ASKED AGAIN: the same breach back, while its stake still holds
  const had = await db.prepare('SELECT ez, b, rh, until, state FROM eg_stakes WHERE account = ?1 AND rq = ?2').bind(player.id, rq).first();
  if (had) {
    if (had.state !== 'held' || int(had.until) <= nowS) return { error: 'spent' };
    const row = await playerRow(db, player.id);
    const order = await mintEgOrder({ o: 'egopen', s: player.id, eb: had.b, ez: had.ez, ew: 0, rh: int(had.rh) === 1 ? 1 : undefined }, key, { subtle, nowS });
    return { order, b: had.b, ez: had.ez, keys: int(row?.eg_keys), until: int(had.until), rh: int(had.rh) };
  }
  if (!rh && !(await proven(db, player.id))) return { error: 'unproven' };
  const b = hex(rand(new Uint8Array(8))), ez = hex(rand(new Uint8Array(12))), until = nowS + EG_LIVE_S, day = utcDay(nowS);
  // ONE TRANSACTION: the key (or the day's Rehearsal) and the live breach taken together, and the stake written by that
  // write alone (the row carries this breach only when the UPDATE took it)
  const [took] = await db.batch([
    db.prepare(`UPDATE players SET eg_keys = eg_keys - ?3, eg_rh_day = CASE WHEN ?6 = 1 THEN ?5 ELSE eg_rh_day END, eg_live_b = ?2, eg_live_until = ?4
      WHERE id = ?1 AND (eg_live_b IS NULL OR eg_live_until <= ?7) AND (CASE WHEN ?6 = 1 THEN eg_rh_day != ?5 ELSE eg_keys >= 1 END) RETURNING eg_keys`)
      .bind(player.id, b, rh ? 0 : 1, until, day, rh, nowS),
    db.prepare("INSERT INTO eg_stakes (ez, account, b, rq, rh, at, until, state) SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, 'held' WHERE EXISTS (SELECT 1 FROM players WHERE id = ?2 AND eg_live_b = ?3)")
      .bind(ez, player.id, b, rq, rh, nowS, until),
  ]);
  const left = took?.results?.[0];
  if (!left) {
    const row = await playerRow(db, player.id);
    const live = liveOf(row, nowS);
    if (live) return { error: 'live', b: live.b };
    return rh ? { error: 'rehearsed' } : { error: 'short', keys: int(row?.eg_keys) };
  }
  const order = await mintEgOrder({ o: 'egopen', s: player.id, eb: b, ez, ew: 0, rh: rh ? 1 : undefined }, key, { subtle, nowS });
  return { order, b, ez, keys: int(left.eg_keys), until, rh };
}

/**
 * A MEMBER'S ADMISSION: the account's live breach set to `b` (one breach at a time - a lapsed one is clear) and its
 * admit order signed (`egadmit`). The room checks the company and spends the order once. Answers `{ order, b }`, or
 * `{ error }`: `no-signing-key`, `guest`, `breach` (a bad id), `live` (another breach held - `b` which).
 * @param {{ db: any, nowS: number, subtle: SubtleCrypto, rand: (b: Uint8Array) => Uint8Array }} ctx
 * @param {{ id: string, handle?: string|null }} player @param {any} body @param {CryptoKey|null} key
 */
export async function admitEg({ db, nowS, subtle, rand }, player, body, key) {
  if (!key) return { error: 'no-signing-key' };
  if (!player.handle) return { error: 'guest' };
  const b = body?.b;
  if (typeof b !== 'string' || !BREACH_RE.test(b)) return { error: 'breach' };
  const took = await db.prepare(`UPDATE players SET eg_live_b = ?2, eg_live_until = CASE WHEN eg_live_b = ?2 AND eg_live_until > ?3 THEN eg_live_until ELSE ?4 END
    WHERE id = ?1 AND (eg_live_b IS NULL OR eg_live_b = ?2 OR eg_live_until <= ?3) RETURNING eg_live_b`).bind(player.id, b, nowS, nowS + EG_LIVE_S).first();
  if (!took) { const live = liveOf(await playerRow(db, player.id), nowS); return { error: 'live', ...(live ? { b: live.b } : {}) }; }
  const order = await mintEgOrder({ o: 'egadmit', s: player.id, eb: b, ez: hex(rand(new Uint8Array(12))), ew: 0 }, key, { subtle, nowS });
  return { order, b };
}

/** A stake given back, once: the key to its opener (a Rehearsal's held none) and the stake marked returned - one
 *  transaction, the key moved only while the stake still held. */
const returnStake = (db, ez, mercy = false) => [
  db.prepare(`UPDATE players SET eg_keys = eg_keys + 1${mercy ? ', eg_mercy = 1' : ''} WHERE id = (SELECT account FROM eg_stakes WHERE ez = ?1 AND state = 'held' AND rh = 0)`).bind(ez),
  db.prepare("UPDATE eg_stakes SET state = 'returned' WHERE ez = ?1 AND state = 'held'").bind(ez),
];
/** A stake spent, once. */
const spendStake = (db, ez) => db.prepare("UPDATE eg_stakes SET state = 'spent' WHERE ez = ?1 AND state = 'held'").bind(ez);

/**
 * THE CLAIM: an `e1` receipt verified with the relay's public half and naming `player`. Answers `{ recorded, q, ...,
 * keys }` (`recorded` false with `why: 'claimed'` for one already counted, `why: 'guest'` for a guest), or `{ error }` -
 * `no-gate-key`, `receipt` (`why` the rung), `not-yours`. EG-E1: a Redoubt's says what it paid (egEconomy.js egRedoubtPay
 * - `paid`, `marks`, `deed`, `embers`, `purse`, `weir`, `pity`; `again` for one already counted), an end's the Reliquaries
 * it opens (`rl`); `env` the service's (the Marks' switch), `character` the claiming character (its guild's deed).
 * EG-E2: a `w` that grants an honour the account did not hold says it - `honours`, the titles (egHonours.js
 * egHonoursAnswer).
 * @param {{ db: any, nowS: number, subtle: SubtleCrypto, rand: (b: Uint8Array) => Uint8Array }} ctx
 * @param {{ id: string, handle?: string|null }} player @param {unknown} receipt @param {CryptoKey|null} publicKey
 * @param {{ env?: any, character?: string|null }} [pay]
 */
export async function claimEg({ db, nowS, subtle, rand }, player, receipt, publicKey, { env = null, character = null } = {}) {
  if (!publicKey) return { error: 'no-gate-key' };
  const v = await verifyEgReceipt(receipt, publicKey, { subtle, nowS });
  if (!v.ok) return { error: 'receipt', why: v.why };
  const c = v.claims;
  if (c.s !== player.id) return { error: 'not-yours' };
  if (!player.handle) return { recorded: false, why: 'guest', q: c.q };
  let recorded = false, said = {}, honours = {};
  if (c.q === 'w') {
    // EG-E1: the row written with the week's pay, and the pay's statements in this batch (egEconomy.js)
    const pay = await egRedoubtPay({ db, nowS, rand }, player, c, { env, character, draw: (p) => drawUnder(rand, p) });
    const [row, , ...paid] = await db.batch([
      pay.row,
      spendStake(db, c.z),   // the stake is spent by the breach's first Redoubt
      ...pay.statements,
      ...egHonourStatements(db, player, c, nowS),   // EG-E2: the lord's feats kept (egHonours.js)
    ]);
    recorded = Number(row?.meta?.changes ?? 0) > 0;
    said = await pay.answer(recorded, paid.slice(0, pay.statements.length));   // the pay's own results (the honours' follow them)
    honours = await egHonoursAnswer(db, player, c);   // EG-E2: the honours it grants, written on the row; the new ones answered
  } else if (c.q === 'x') {
    // the stake: a void gives it back; the first breach's mercy gives it back once ever when the breach took no
    // Redoubt; any other end spends it
    // the opener's end alone settles it (a member who fell in Hall 2 has not ended the opener's breach)
    const stake = await db.prepare('SELECT account, state, rh FROM eg_stakes WHERE ez = ?1').bind(c.z).first();
    let settle = [];
    if (stake?.state === 'held' && (stake.account === player.id || c.why === 'void')) {
      if (c.why === 'void') settle = returnStake(db, c.z);
      else {
        const took = await db.prepare('SELECT EXISTS (SELECT 1 FROM eg_redoubts WHERE b = ?1) AS w, (SELECT eg_mercy FROM players WHERE id = ?2) AS m').bind(c.b, stake.account).first();
        settle = int(took?.w) === 0 && c.h < 5 && int(took?.m) === 0 && int(stake.rh) === 0 ? returnStake(db, c.z, true) : [spendStake(db, c.z)];
      }
    }
    const [row] = await db.batch([
      db.prepare('INSERT OR IGNORE INTO eg_runs (b, account, h, why, t, at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)').bind(c.b, player.id, c.h, c.why, c.t, nowS),
      db.prepare('UPDATE players SET eg_live_b = NULL, eg_live_until = 0 WHERE id = ?1 AND eg_live_b = ?2').bind(player.id, c.b),
      ...settle,
      ...egHonourStatements(db, player, c, nowS),   // EG-E2: the end as the boards rank it, the Annals' pages kept (egHonours.js)
    ]);
    recorded = Number(row?.meta?.changes ?? 0) > 0;
    said = await egReliquariesOf({ db, nowS }, player, c);   // EG-E1: the Reliquaries it opens, by the week's pay
  } else {
    // a void: the stake back (once - the stake's own state guards it) and the live breach cleared; answered as recorded
    // however often it is carried
    await db.batch([...returnStake(db, c.z), db.prepare('UPDATE players SET eg_live_b = NULL, eg_live_until = 0 WHERE id = ?1 AND eg_live_b = ?2').bind(player.id, c.b)]);
    recorded = true;
  }
  const keys = int((await playerRow(db, player.id))?.eg_keys);
  return recorded ? { recorded: true, q: c.q, b: c.b, ...(c.q === 'w' ? { w: c.w } : {}), keys, ...said, ...honours } : { recorded: false, why: 'claimed', q: c.q, keys, ...said, ...honours };
}

/**
 * THE KEY ROLLED AT A CLAIM THE SERVICE ALREADY VERIFIED (section 5) - after a recorded Dagon's Breach kill (`kind`
 * 'gate': one in six, one in four with the rite broken, the first kill certain, the pity after EG_KEY_PITY misses) or a
 * recorded Hour ('sd': one in three). The draw is this service's own (`rand` - nothing the page can read). Answers `{
 * found, keys }`.
 * @param {{ db: any, rand?: (b: Uint8Array) => Uint8Array }} ctx @param {{ id: string }} player
 * @param {{ kind: 'gate'|'sd', rite?: boolean }} what
 */
export async function rollWeirKey({ db, rand }, player, { kind, rite = false }) {
  const row = await playerRow(db, player.id);
  let found;
  if (kind === 'gate') {
    const k = await db.prepare("SELECT COUNT(*) AS n FROM gate_kills WHERE account = ?1 AND earned != 'rite'").bind(player.id).first();
    found = int(k?.n) === 1 || int(row?.eg_key_miss) >= EG_KEY_PITY || drawUnder(rand, rite ? EG_KEY_ODDS_RITE : EG_KEY_ODDS);
  } else found = drawUnder(rand, EG_KEY_ODDS_SD);
  const after = await db.prepare(`UPDATE players SET eg_keys = eg_keys + ?2, eg_key_miss = CASE WHEN ?3 = 1 THEN eg_key_miss ELSE (CASE WHEN ?2 = 1 THEN 0 ELSE eg_key_miss + 1 END) END WHERE id = ?1 RETURNING eg_keys`)
    .bind(player.id, found ? 1 : 0, kind === 'gate' ? 0 : 1).first();
  return { found, keys: int(after?.eg_keys) };
}
/**
 * EG-E3: THE DUNGEON'S FIND (section 5) - an elite foe fallen in a dungeon online, asked by its killer's client with the
 * dungeon's tier (`{ tier }`, a key of EG_FIND_ODDS). The ask is counted before the die (a lost roll spends it too), at
 * most EG_FIND_PER_DAY a tier a real day; the die is this service's own at the tier's odds; a yes adds one to `eg_keys`
 * while the account's finds this arena week have paid fewer than EG_FIND_KEYS_PER_WEEK. Answers `{ found, keys, asks }`
 * (`asks` the tier's asks left today), or `{ error }`: `guest`, `tier` (not a tier), `unproven` (no gate closed, no
 * Redoubt taken - a fresh account cannot farm), `capped` (the tier's asks spent today - `keys` with it).
 * @param {{ db: any, nowS: number, rand?: (b: Uint8Array) => Uint8Array }} ctx
 * @param {{ id: string, handle?: string|null }} player @param {any} body
 */
export async function findEg({ db, nowS, rand }, player, body) {
  if (!player.handle) return { error: 'guest' };
  const tier = body?.tier;
  if (typeof tier !== 'string' || !Object.hasOwn(EG_FIND_ODDS, tier)) return { error: 'tier' };
  if (!(await proven(db, player.id))) return { error: 'unproven' };
  const day = utcDay(nowS), wk = arenaWeekOf(nowS);
  const ask = await db.prepare(`INSERT INTO eg_finds (account, day, tier, wk, asks, found) VALUES (?1, ?2, ?3, ?4, 1, 0)
    ON CONFLICT (account, day, tier) DO UPDATE SET asks = asks + 1 WHERE asks < ?5 RETURNING asks`).bind(player.id, day, tier, wk, EG_FIND_PER_DAY).first();
  if (!ask) return { error: 'capped', keys: int((await playerRow(db, player.id))?.eg_keys) };
  let found = false;
  if (drawUnder(rand, EG_FIND_ODDS[tier])) {
    // ONE TRANSACTION: the key and the find's mark together, each only while the week's finds are under the cap
    const [took] = await db.batch([
      db.prepare('UPDATE players SET eg_keys = eg_keys + 1 WHERE id = ?1 AND (SELECT COALESCE(SUM(found), 0) FROM eg_finds WHERE account = ?1 AND wk = ?2) < ?3 RETURNING eg_keys')
        .bind(player.id, wk, EG_FIND_KEYS_PER_WEEK),
      db.prepare('UPDATE eg_finds SET found = found + 1 WHERE account = ?1 AND day = ?2 AND tier = ?3 AND (SELECT COALESCE(SUM(found), 0) FROM eg_finds WHERE account = ?1 AND wk = ?4) < ?5')
        .bind(player.id, day, tier, wk, EG_FIND_KEYS_PER_WEEK),
    ]);
    found = !!took?.results?.[0];
  }
  return { found, keys: int((await playerRow(db, player.id))?.eg_keys), asks: EG_FIND_PER_DAY - int(ask.asks) };
}
/** One draw of this service's die under `p` - none without a die (a harness's ctx). */
function drawUnder(rand, p) {
  if (typeof rand !== 'function') return false;
  const d = rand(new Uint8Array(4));
  return (((d[0] << 24) | (d[1] << 16) | (d[2] << 8) | d[3]) >>> 0) / 4294967296 < p;
}
