// @ts-check
// PRIMARY-FOLD (2026-10-18; bible/11-Multiplayer/Scale-Arc.md THE PLAN PAST 1,000, PRIMARY-FOLD): THE DOOR'S READS IN ONE
// TRIP. Every authenticated request that names a `character` asks whether it is one of the account's tombstones
// (legacy.js isTombstone), and every progression claim (progress.js PROGRESS_ROUTES) asks the account's seat
// (progressRefusal) and its stream's bucket (progressRoom, then the claim's spend) - three questions, each its own round
// trip to the account database's one primary, before the route reads a word, and the spend after it asked the bucket a
// fourth time. They are reads of rows no progress route writes between them, so a claim asks them here as ONE statement -
// each question a subquery of its own, worded as it is asked alone - and the door answers them in the order each was
// asked: the tombstone first, then the seat, then the bucket, which the spend takes too (progressSpent's `door`). One
// statement, not a batch: the routes' own batches keep every failure they had (a batch D1 dropped is the route's).
// A request that names a character and claims nothing asks the tombstone alone, as it always did.
import { isTombstone } from './legacy.js';
import { bucketFrom } from './progress.js';

/** The door's three questions for a claim: ?1 the account, ?2 the character named (or null), ?3 the claim's stream. The
 *  seat's id and hold are two subqueries over one WHERE, so they are one row's (the scan the seat's own question makes). */
const DOOR_SQL = `SELECT
  (SELECT 1 FROM realm_characters WHERE id = ?2 AND player = ?1 AND dead_at IS NOT NULL) AS dead,
  (SELECT id FROM realm_characters WHERE player = ?1 AND lease IS NOT NULL AND dead_at IS NULL) AS seat_id,
  (SELECT held FROM realm_characters WHERE player = ?1 AND lease IS NOT NULL AND dead_at IS NULL) AS seat_held,
  (SELECT 1 FROM players WHERE id = ?1) AS player,
  (SELECT played_s FROM players WHERE id = ?1) AS now,
  (SELECT allowance FROM progress_play WHERE player = ?1 AND stream = ?3) AS allowance,
  (SELECT played_at FROM progress_play WHERE player = ?1 AND stream = ?3) AS played_at`;

/**
 * The door's reads for `playerId`: `tomb` - the character to ask the tombstone of (null asks none); `stream` - a
 * progression claim's stream (null asks neither the seat nor the bucket). Answers `{ dead, seat, bucket, stream }`: `dead`
 * whether the character is a tombstone, `seat` the seat's row as progressRefusal reads it (`{ id, held }`, null for none,
 * undefined when not asked), `bucket` the stream's bucket as bucketOf answers it (undefined when not asked).
 * @param {any} db @param {string} playerId @param {{ tomb: string|null, stream: string|null }} ask
 */
export async function doorReads(db, playerId, { tomb, stream }) {
  /** @type {{ dead: boolean, seat: any, bucket: any, stream: string|null }} */
  const out = { dead: false, seat: undefined, bucket: undefined, stream };
  if (stream == null) {
    if (tomb != null) out.dead = await isTombstone(db, playerId, tomb);
    return out;
  }
  const r = await db.prepare(DOOR_SQL).bind(playerId, tomb, stream).first();
  out.dead = tomb != null && !!r?.dead;
  out.seat = r?.seat_id != null ? { id: r.seat_id, held: r.seat_held } : null;
  out.bucket = r?.player ? bucketFrom({ now: r.now, allowance: r.allowance, played_at: r.played_at }) : null;
  return out;
}
