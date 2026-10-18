// @ts-check
// ═══════════════════════════════════════════════════════════════════
// TOWN-ECON TE2 (2026-10-18, Mac: "Everything"; bible/06-Systems/Town-Economy-Arc.md section 4) - THE PLAYERS' SHARE
// OF A TOWN'S ECONOMY, as this service counts it.
//
// WITNESSED ACTS ONLY (TE0 decision 3): a town is raised by what this service saw happen there, never by gold -
//   - its FOOTSTEPS: the relay's signed Watch ticks (src/net/watchReceipt.js), claimed by the account they name, at the
//     town the registry holds for the tick's pixel (POST /v1/towns/watch);
//   - TRADE at its players' traders: a market sale at a trader's stall (market.js marketBuy, at the listing's
//     `vendor_map`, the buyer's act) and LW15's patron sale (market.js reckonPatrons, the seller's);
//   - a RAID DRIVEN OFF at its gates: the relay's cleanse receipt claimed (raids.js claimRaid), at the town the registry
//     holds for the raid's `region:location`.
// Each act is one account's, capped a town a day by source (townEconLaw.js TOWN_ECON_CAPS) in the write itself, and
// counted again into the town's day (town_econ_days), which the share is read from (POST /v1/towns/econ).
//
// THE TOWN REGISTRY (POST /v1/towns/witness): which town stands at a pixel and which a raid names is the clients' word,
// agreed - three accounts a week registered give the same report (nodeLaw.js witnessedFact), and the town is confirmed
// into town_econ_towns, after which its key takes no more reports (so a town's rows stay a handful). An act at a pixel
// or a raid the registry has not confirmed counts nothing.
//
// Footsteps and raids are counted for an account a week registered alone (witnessOf), as its reports are; a sale
// counts for its buyer so, and a patron's for its seller (who keeps a home and a trader in the town).
// ═══════════════════════════════════════════════════════════════════
import { accountKind, overRate } from './accounts.js';
import { witnessOf } from './townSeats.js';
import { witnessedFact, factConfirmed } from '../../src/net/nodeLaw.js';
import { verifyWatchReceipt } from '../../src/net/watchReceipt.js';
import { RAID_KEY_RE } from '../../src/net/raid/raidLaw.js';
import { utcDay } from '../../src/net/marksLaw.js';
import {
  TOWN_ECON_CAPS, TOWN_ECON_DAYS, TOWN_ECON_KEPT_S, TOWN_ECON_SHARE_LEAST, TOWN_WATCH_CLAIM_MAX, TOWN_WITNESS_KIND,
  TOWN_WITNESS_HOUR, townReportOf, townReportText, parseTownReport, townActivity, townPlayersShare, townShareShown,
} from '../../src/net/townEconLaw.js';

/** The reports a town's key is read back at - a confirmed key takes no more, so an unconfirmed one holds a handful. */
const TOWN_WITNESS_ROWS = 64;

/**
 * ONE ACT AT A TOWN, as statements of a batch: the account's mark under its cap, and the town's day behind it - the
 * second only where the first moved (`changes()`), so a capped act counts nothing. `guard` is SQL whose own binds start
 * at ?6 (`binds`): the act counts only where it holds (a sale's row written, a tick unseen).
 * @param {any} db
 * @param {{ account: string, map: number, day: number, src: 'watch'|'trade'|'raid', guard?: string, binds?: unknown[] }} act
 */
export function townActStatements(db, { account, map, day, src, guard = 'true', binds = [] }) {
  return [
    db.prepare(`INSERT INTO town_econ_acts (account, map, day, src, n) SELECT ?1, ?2, ?3, ?4, 1 WHERE ${guard}
      ON CONFLICT (account, map, day, src) DO UPDATE SET n = town_econ_acts.n + 1 WHERE town_econ_acts.n < ?5`)
      .bind(account, map, day, src, TOWN_ECON_CAPS[src], ...binds),
    db.prepare(`INSERT INTO town_econ_days (map, day, src, n) SELECT ?1, ?2, ?3, 1 WHERE changes() > 0
      ON CONFLICT (map, day, src) DO UPDATE SET n = town_econ_days.n + 1`).bind(map, day, src),
  ];
}

/** A TRADER'S SALE counted at its town for its buyer (market.js marketBuy, both currencies): `map` the listing's
 *  `vendor_map`, `sold` the sale's own row's guard over ?6-?8 (`[buyer, rid, nonce]`). None for a listing at no trader,
 *  or a buyer under a week registered. @param {any} db @param {any} player @param {number} nowS
 *  @param {number|null} map @param {string} sold @param {unknown[]} binds */
export function tradeActStatements(db, player, nowS, map, sold, binds) {
  if (!Number.isSafeInteger(map) || /** @type {number} */ (map) <= 0 || !witnessOf(player, nowS)) return [];
  return townActStatements(db, { account: player.id, map: /** @type {number} */ (map), day: utcDay(nowS), src: 'trade', guard: sold, binds });
}

/** A PATRON'S SALE counted at its town for its seller (market.js reckonPatrons, behind the sale's mustChange) - on the
 *  hour's own day. @param {any} db @param {string} seller @param {number} map @param {number} day */
export const patronActStatements = (db, seller, map, day) => townActStatements(db, { account: seller, map, day, src: 'trade' });

/** A RAID DRIVEN OFF counted at the town the registry holds for its `region:location` (raids.js claimRaid's `econ`
 *  hook) - by THIS claim's row alone (`raid_cleanses` with its nonce). None for an account under a week registered, a
 *  key that is no raid's, or a town not confirmed. @param {any} db @param {any} player @param {number} nowS
 *  @param {string} key @param {string} nonce */
export function raidActStatements(db, player, nowS, key, nonce) {
  if (typeof key !== 'string' || !RAID_KEY_RE.test(key) || !witnessOf(player, nowS)) return [];
  const [region, location] = key.split(':').map(Number);
  const day = utcDay(nowS);
  return [
    db.prepare(`INSERT INTO town_econ_acts (account, map, day, src, n) SELECT ?1, t.map, ?2, 'raid', 1
      FROM town_econ_towns t WHERE t.region = ?3 AND t.location = ?4
        AND EXISTS (SELECT 1 FROM raid_cleanses WHERE raid = ?5 AND account = ?1 AND nonce = ?6)
      ON CONFLICT (account, map, day, src) DO UPDATE SET n = town_econ_acts.n + 1 WHERE town_econ_acts.n < ?7`)
      .bind(player.id, day, region, location, key, nonce, TOWN_ECON_CAPS.raid),
    db.prepare(`INSERT INTO town_econ_days (map, day, src, n) SELECT t.map, ?1, 'raid', 1
      FROM town_econ_towns t WHERE t.region = ?2 AND t.location = ?3 AND changes() > 0
      ON CONFLICT (map, day, src) DO UPDATE SET n = town_econ_days.n + 1`).bind(day, region, location),
  ];
}

/**
 * A TOWN WITNESSED: `{ town: { map, px, py, region, location } }` - the town the caller's client stands in. Answers
 * `{ ok, counted, confirmed }` (`why` when not counted: 'young', an account under a week registered; 'known', a town
 * already confirmed) or `{ error }`: 'towns-need-account' (a guest), 'bad-town', 'towns-rate'.
 * @param {{ db: any, nowS: number }} ctx @param {any} player @param {any} _env @param {any} body
 */
export async function witnessTown({ db, nowS }, player, _env, { town } = {}) {
  if (accountKind(player) !== 'linked') return { error: 'towns-need-account' };
  const t = townReportOf(town);
  if (!t) return { error: 'bad-town' };
  if (await overRate({ db, nowS }, `town-witness:${player.id}`, TOWN_WITNESS_HOUR, 3600)) return { error: 'towns-rate' };
  if (!witnessOf(player, nowS)) return { ok: true, counted: false, why: 'young' };
  if (await db.prepare('SELECT 1 AS y FROM town_econ_towns WHERE map = ?1').bind(t.map).first()) return { ok: true, counted: false, why: 'known' };
  const key = String(t.map);
  await db.prepare('INSERT OR IGNORE INTO world_witness (kind, key, account, report, region, at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)')
    .bind(TOWN_WITNESS_KIND, key, player.id, townReportText(t), t.region, nowS).run();
  const { results: rows = [] } = await db.prepare('SELECT account, report, at FROM world_witness WHERE kind = ?1 AND key = ?2 ORDER BY at, account LIMIT ?3')
    .bind(TOWN_WITNESS_KIND, key, TOWN_WITNESS_ROWS).all();
  const fact = /** @type {any} */ (witnessedFact(rows, parseTownReport));
  if (!factConfirmed(fact)) return { ok: true, counted: true, confirmed: false };
  // the first town confirmed at a map id, a pixel or a place stands (the table's three keys)
  await db.prepare('INSERT OR IGNORE INTO town_econ_towns (map, px, py, region, location, at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)')
    .bind(fact.map, fact.px, fact.py, fact.region, fact.location, nowS).run();
  return { ok: true, counted: true, confirmed: true };
}

/**
 * THE WATCH'S TICKS CLAIMED at the towns they were walked in: `{ receipts: [r, ...] }` (TOWN_WATCH_CLAIM_MAX at most),
 * each the relay's signed receipt for this account. Each counts once (town_econ_seen), at the town the registry holds
 * for its pixel, on its own UTC day while that day is kept, under the account's cap. Answers `{ ok, counted, why }` (a
 * tally of the receipts not counted, by reason) or `{ error }`: 'towns-need-account', 'bad-watch', 'no-gate-key'.
 * @param {{ db: any, nowS: number, subtle?: any }} ctx @param {any} player @param {any} _env @param {any} body
 * @param {any} publicKey the gate's public key (signing.js gatePublicKey)
 */
export async function claimTownWatch({ db, nowS, subtle }, player, _env, { receipts } = {}, publicKey) {
  if (accountKind(player) !== 'linked') return { error: 'towns-need-account' };
  if (!Array.isArray(receipts) || receipts.length < 1 || receipts.length > TOWN_WATCH_CLAIM_MAX) return { error: 'bad-watch' };
  if (!publicKey) return { error: 'no-gate-key' };
  /** @type {Record<string, number>} */
  const why = {};
  const tally = (/** @type {string} */ w) => { why[w] = (why[w] ?? 0) + 1; };
  if (!witnessOf(player, nowS)) return { ok: true, counted: 0, why: { young: receipts.length } };
  const today = utcDay(nowS);
  /** @type {Map<string, number|null>} */
  const towns = new Map();
  const steps = [];
  for (const r of receipts) {
    const v = /** @type {any} */ (await verifyWatchReceipt(r, publicKey, { subtle, nowS }));
    if (!v.ok) { tally(v.why ?? 'bad'); continue; }
    const c = v.claims;
    if (c.s !== player.id) { tally('not-yours'); continue; }
    const day = utcDay(c.i);
    if (day > today || today - day >= TOWN_ECON_DAYS) { tally('old'); continue; }
    const px = `${c.x},${c.y}`;
    if (!towns.has(px)) towns.set(px, (await db.prepare('SELECT map FROM town_econ_towns WHERE px = ?1 AND py = ?2').bind(c.x, c.y).first())?.map ?? null);
    const map = towns.get(px);
    if (map == null) { tally('no-town'); continue; }
    steps.push(
      db.prepare('INSERT OR IGNORE INTO town_econ_seen (ref, day) VALUES (?1, ?2)').bind(`${c.s}:${c.c}:${c.i}`, day),
      ...townActStatements(db, { account: player.id, map: Number(map), day, src: 'watch', guard: 'changes() > 0' }),
    );
  }
  let counted = 0;
  if (steps.length) {
    const res = await db.batch(steps);
    for (let i = 1; i < res.length; i += 3) counted += Number(res[i]?.meta?.changes ?? 0) > 0 ? 1 : 0;
    const unmoved = steps.length / 3 - counted;
    if (unmoved > 0) why.capped = unmoved;   // seen before, or past the day's cap
  }
  return { ok: true, counted, why };
}

/** @type {{ at: number, towns: Array<[number, number]> } | null} */
let _kept = null;
/** Tests stand a fresh service; the isolate's kept answer goes with the old one. */
export const _resetTownEconForTests = () => { _kept = null; };

/**
 * THE TOWNS' SHARES (POST /v1/towns/econ): `{ towns: [[map, share], ...] }` - every town whose players' share is
 * TOWN_ECON_SHARE_LEAST or more today, one decimal (townEconLaw.js townActivity, townPlayersShare). Kept by the isolate
 * TOWN_ECON_KEPT_S - every client reads the same answer, and a busy hour asks the database once a few minutes.
 * @param {{ db: any, nowS: number }} ctx
 */
export async function townsEcon({ db, nowS }) {
  if (_kept && nowS - _kept.at < TOWN_ECON_KEPT_S) return { ok: true, towns: _kept.towns };
  const today = utcDay(nowS);
  const { results: rows = [] } = await db.prepare('SELECT map, day, src, n FROM town_econ_days WHERE day > ?1 AND day <= ?2')
    .bind(today - TOWN_ECON_DAYS, today).all();
  /** @type {Map<number, any[]>} */
  const byTown = new Map();
  for (const r of rows) {
    const m = Number(r.map);
    if (!byTown.has(m)) byTown.set(m, []);
    byTown.get(m)?.push(r);
  }
  /** @type {Array<[number, number]>} */
  const towns = [];
  for (const [m, rs] of byTown) {
    const share = townShareShown(townPlayersShare(townActivity(rs, today)));
    if (share >= TOWN_ECON_SHARE_LEAST) towns.push([m, share]);
  }
  towns.sort((a, b) => a[0] - b[0]);
  _kept = { at: nowS, towns };
  return { ok: true, towns };
}

/** The hourly sweep's SQL: a town's acts, days and seen ticks past the days kept (cron.js HOUR_JOBS). */
export const TOWN_ECON_SWEEPS = Object.freeze([
  'DELETE FROM town_econ_days WHERE rowid IN (SELECT rowid FROM town_econ_days WHERE day < ?1 LIMIT ?2)',
  'DELETE FROM town_econ_acts WHERE rowid IN (SELECT rowid FROM town_econ_acts WHERE day < ?1 LIMIT ?2)',
  'DELETE FROM town_econ_seen WHERE rowid IN (SELECT rowid FROM town_econ_seen WHERE day < ?1 LIMIT ?2)',
]);
/** The first day the sweep keeps. @param {number} nowS */
export const townEconKeptFrom = (nowS) => utcDay(nowS) - TOWN_ECON_DAYS + 1;
