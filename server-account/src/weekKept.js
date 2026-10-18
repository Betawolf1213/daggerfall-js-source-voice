// @ts-check
// PRIMARY-FOLD (2026-10-18; bible/11-Multiplayer/Scale-Arc.md THE PLAN PAST 1,000, PRIMARY-FOLD): A WEEK SEEN SETTLED STAYS
// SETTLED. The seats' Turnings (seatTurning.js settleDueOnce) and the chapters' (npcChapters.js settleChaptersDue) are
// settled by the first reader past a week's boundary, and every reader asked whether one was due - `SELECT MAX(week)`, a
// round trip to the account database's one primary on every seat list, chapter sheet, Focus and hall writ, to learn the
// same answer all week. A settled week is never unsettled (no route deletes or rewrites one), so an isolate that has read
// it settled keeps that word until the week it was read for has passed; the first read past the boundary asks again.
// Kept by the binding a request's counted Proxy wraps (service.js DB_ROOT), as every word an isolate keeps beside its
// database is (progress.js's config, townSeats.js's rows).
import { DB_ROOT } from './service.js';

/** @type {WeakMap<object, Map<string, number>>} */
let kept = new WeakMap();
const keyOf = (/** @type {any} */ db) => (db && typeof db === 'object' ? db[DB_ROOT] ?? db : null);

/** Whether this isolate has read `name`'s Turnings settled for `week` (the week it is now, as its settler reckons it). */
export function weekSettled(/** @type {any} */ db, /** @type {string} */ name, /** @type {number} */ week) {
  const k = keyOf(db);
  return !!k && kept.get(k)?.get(name) === week;
}
/** A read that found `name`'s Turnings settled for `week`: kept until the week moves on. */
export function keepWeekSettled(/** @type {any} */ db, /** @type {string} */ name, /** @type {number} */ week) {
  const k = keyOf(db);
  if (!k) return;
  let m = kept.get(k);
  if (!m) kept.set(k, (m = new Map()));
  m.set(name, week);
}
/** A stood service is a fresh isolate, and a pin that rewrites a week's rows by hand asks as one: nothing kept. */
export function _resetWeeksKept() { kept = new WeakMap(); }
