// @ts-check
// GRANT2 (2026-10-18, Mac: "Lets build the plan"; bible/11-Multiplayer/Spawn-Grants.md section 12): THE SPAWN GRANTS'
// MEASURE, KEPT AND READ. The relay's cells post their windows of grant asks (src/net/grantMeasure.js), signed with the
// relay's receipt key, to POST /v1/mod/grant-feed - a door proven by that signature, never a session (the chat feed's,
// safety.js takeFeed). A developer reads them with /v1/mod/realm-grants (review.js; tools/realmReview.mjs grants):
// per kind, an account's asks an hour - its quantiles and most - what the buckets standing would have refused, and the
// cells' most live granted members. GRANT5 sets the buckets and the ceiling from it after seven days (the owner, question 3).
import { openGrantMeasure } from '../../src/net/grantMeasure.js';
import { GRANT_KINDS, GRANT_CELL_CEILING } from '../../src/net/grantLaw.js';
import { gatePublicKey } from './signing.js';

/** The door's path - the relay's GRANT_FEED_URL names it (server/wrangler.toml). */
export const GRANT_FEED_PATH = '/v1/mod/grant-feed';
/** The shortest window an account's rate is read over, s - a cell that slept a minute after one ask is not sixty an hour. */
export const GRANT_RATE_SPAN_MIN_S = 600;

/**
 * A POSTED WINDOW: kept when the relay's signature holds over a batch young enough, once - `{ ok, read }` (`read` false
 * for a batch already kept), or `{ error }` (grant-closed: the service holds no relay key; grant-shape; grant-signature;
 * grant-stale).
 * @param {{ db: any, nowS: number, subtle: SubtleCrypto }} ctx @param {any} env @param {Uint8Array} bytes @param {unknown} sig
 */
export async function takeGrantMeasure({ db, nowS, subtle }, env, bytes, sig) {
  const opened = await openGrantMeasure(bytes, sig, await gatePublicKey(env, subtle), { subtle, nowMs: nowS * 1000 });
  if ('error' in opened) return opened;
  const b = opened.batch;
  const span = Math.max(1, Math.round((b.at - b.from) / 1000));
  const kept = await db.prepare('INSERT OR IGNORE INTO grant_batches (id, at, q, span_s, live) VALUES (?1, ?2, ?3, ?4, ?5)').bind(b.id, nowS, b.q, span, b.live).run();
  if (!kept?.meta?.changes) return { ok: true, read: false };
  await db.batch(b.rows.map((/** @type {any} */ r) => db.prepare('INSERT INTO grant_rows (batch, at, sub, kind, asks, members, bucket, ceiling, span_s) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)')
    .bind(b.id, nowS, r.a, r.k, r.asks, r.members, r.bucket, r.ceiling, span)));
  return { ok: true, read: true };
}

/**
 * THE MEASURE over the last `days`: per kind, every account-window's asks an hour (its window at least
 * GRANT_RATE_SPAN_MIN_S long) - their count, quantiles and most, by `ranked` - with the asks, members and what the
 * bucket and the ceiling would have refused in all; and the cells' most live granted members, ranked the same, beside
 * the ceiling standing. `ranked` is review.js's (the database asked a rank at a time).
 * @param {any} db @param {number} nowS @param {number} days
 * @param {(n: number, at: (rank: number) => Promise<any>) => Promise<{ quantiles: any[], most: any }>} ranked
 */
export async function grantsMeasure(db, nowS, days, ranked) {
  const since = nowS - days * 24 * 3600;
  const rate = `CAST(ROUND(asks * 3600.0 / MAX(span_s, ${GRANT_RATE_SPAN_MIN_S})) AS INTEGER)`;
  const kinds = [];
  for (const kind of Object.keys(GRANT_KINDS)) {
    const sums = await db.prepare('SELECT COUNT(*) AS n, COALESCE(SUM(asks), 0) AS asks, COALESCE(SUM(members), 0) AS members, COALESCE(SUM(bucket), 0) AS bucket, COALESCE(SUM(ceiling), 0) AS ceiling FROM grant_rows WHERE at >= ?1 AND kind = ?2')
      .bind(since, kind).first();
    const n = Number(sums?.n ?? 0);
    const at = async (/** @type {number} */ rank) => (await db.prepare(`SELECT ${rate} AS r FROM grant_rows WHERE at >= ?1 AND kind = ?2 ORDER BY r LIMIT 1 OFFSET ?3`).bind(since, kind, rank).first())?.r ?? null;
    const { quantiles, most } = await ranked(n, at);
    kinds.push({ kind, windows: n, asks: Number(sums?.asks ?? 0), members: Number(sums?.members ?? 0), bucket: Number(sums?.bucket ?? 0), ceiling: Number(sums?.ceiling ?? 0), perHour: { quantiles, most } });
  }
  const cellsN = Number((await db.prepare('SELECT COUNT(*) AS n FROM grant_batches WHERE at >= ?1').bind(since).first())?.n ?? 0);
  const live = await ranked(cellsN, async (rank) => (await db.prepare('SELECT live AS r FROM grant_batches WHERE at >= ?1 ORDER BY live LIMIT 1 OFFSET ?2').bind(since, rank).first())?.r ?? null);
  return { days, kinds, cells: { windows: cellsN, live, ceiling: GRANT_CELL_CEILING } };
}
