// @ts-check
// ═══════════════════════════════════════════════════════════════════
// QL12 (2026-10-19, the owner: "New questlines tying into and introduced the oblivion gates, abyss dungeons, elite
// dungeons and elite breaches"; bible/06-Systems/Questlines-Arc.md sections 1 (decision 8) and 5.3): THE QUESTLINES'
// CLAIM - what the account service pays a questline, and only against what it witnessed.
//
// `POST /v1/ql/claim { line, step, choice? }`, behind a session, for a registered account (FOUNDER's law, as lamp.js: a
// guest's claim is answered `guest` and nothing is written). The law both ends share is src/net/questlineClaims.js -
// QL_SERVICE_LINES names the steps the service pays, each step's witness, the title a line pays and on which step, and
// the Covens' Hoard's Weir Key. A step the service pays nothing is answered `unpaid` (qlStepClaimed).
//
// A STEP IS CLAIMED TWICE (the client's line runner, systems/questlines/qlLineRunner.js):
//   - its FIRST claim opens it: one `ql_steps` row (migration 0133), `opened_at` the service's clock - `{ opened: true }`.
//     INSERT OR IGNORE, so a claim asked twice opens once.
//   - a LATER claim reads the step's witness - the endgame place's own receipt row, the account's, written AT OR AFTER
//     `opened_at` (QL_WITNESS_SQL): a receipt from before the line asked for it opens nothing. Unwitnessed -
//     `{ witnessed: false }`, nothing written; witnessed - `done_at` laid (and the outcome's `choice`, the first one a
//     claim carries) - `{ witnessed: true }`. A step with no witness (the Covens' Hoard's last) is witnessed once its
//     line's `after` is: that step of the Cycle's first line done on this row.
//   `at` is the claim's own time on each receipt row (accounts.js claimGate, eg.js claimEg, sds.js claimSd, serpents.js
//   claimSerpent all write `nowS`), so a receipt held unclaimed across a step's opening - the client claims its
//   receipts as they come, and each lives a week (RECEIPT_TTL_S) - is read as the claim's, not the kill's.
//
// WHAT IT PAYS, in the one batch that lays `done_at` (a failure takes nothing half-written):
//   THE TITLE - a line's bit on `players.ql_titles` (qlTitleBit), held for good, once its `titleAt` step and every
//     witnessed step before it are done. Asked on every claim of those steps, so a line whose steps were witnessed out
//     of order (an earlier step's receipt claimed late) still pays it when the last of them lands; the UPDATE's own
//     WHERE holds it to once, and `title` is answered only by the claim whose write changed the row.
//   THE KEY - the Covens' Hoard's Weir Key, once an account: its `key.at` step done with the choice that keeps it
//     (`keep`), behind the Cycle's first line witnessed through its breach (`after`). ONE statement, `eg_keys` + 1 and
//     `ql_key` = 1 together, only while `ql_key` is 0 - the balance every Weir Key is (eg.js: the item in the pack is
//     its face, restacked to every answer that carries the count), so `key: true` comes with `keys`, the balance after.
//     No ledger rides it: every key grant of the service's (eg.js rollWeirKey, egGateWeir, findEg; egEconomy.js a
//     Valkynaz's) is that one UPDATE, and the item law reads the key's row (KEY-LAW), not the grant.
//
// Opened by QUESTLINES_OPEN (`off` | `dev` | `on`, wrangler.toml), read as FIRMAMENT_OPEN is: `dev` the developers
// alone; shut, `ql-closed` (403).
//
// Not a DFU member - Daggerfall Unity has no account service. Ledger A (QUESTLINES).
// ═══════════════════════════════════════════════════════════════════

import { QL_SERVICE_LINES, QL_WITNESS_KINDS, qlTitleBit, qlClaimOf, qlStepClaimed } from '../../src/net/questlineClaims.js';
import { isDeveloper } from './titles.js';

/** The switch the service's config holds (QUESTLINES_OPEN): off, dev (the developers alone), on. */
export const QL_SWITCH = Object.freeze(['off', 'dev', 'on']);
export const qlSwitchOf = (/** @type {any} */ v) => (QL_SWITCH.includes(v) ? v : 'off');
/** Whether the questlines' claim is open to this account: the switch, and at `dev` the developers alone. */
export function questlinesOpenFor(/** @type {any} */ player, /** @type {any} */ env) {
  const s = qlSwitchOf(env?.QUESTLINES_OPEN);
  return s === 'on' || (s === 'dev' && isDeveloper(player, env));
}

/** The claim's refusals and their statuses. */
export const QL_STATUS = Object.freeze({ 'ql-closed': 403, 'ql-body': 400 });

/** The step's opening, as a witness reads it - the UPDATE's own row (`ql_steps`, the one statement that lays `done_at`). */
const SINCE = 'ql_steps.opened_at';
/** AN ELITE BREACH'S REDOUBT THAT IS NO REHEARSAL'S - a Rehearsal's Redoubt writes its `eg_redoubts` row (paid 0; eg.js
 *  claimEg), and the house's honours never read one (egHonours.js: `c.rh === 1`). The row carries no `rh` of its own: its
 *  breach's stake does (`eg_stakes.rh`, written at the open, before any Redoubt - whoever opened it), and the account's
 *  end does (`eg_runs.rh`, should the opener's stake be gone with its account). */
const NOT_REHEARSAL = 'NOT EXISTS (SELECT 1 FROM eg_stakes k WHERE k.b = r.b AND k.rh = 1) AND NOT EXISTS (SELECT 1 FROM eg_runs x WHERE x.b = r.b AND x.account = r.account AND x.rh = 1)';

/**
 * WHAT EACH WITNESS READS - a SQL test over the account (`?1`) and the step's opening (`ql_steps.opened_at`), one
 * receipt table each (questlineClaims.js QL_WITNESS_KINDS):
 *   rite      a Dagon's Breach's rite broken - the rite's own receipt (`earned` 'rite'), or a fighter's that broke it
 *             (accounts.js claimGate: `c.r === 1`, the row's two embers - `stones` 2 is written for nothing else)
 *   breach    a Dagon's Breach closed - a kill's row, never the rite alone
 *   redoubt   an Elite Breach's Redoubt taken, no Rehearsal's
 *   redoubts3 three of them - one row a (breach, account, Redoubt) by eg_redoubts' key, so each row is a distinct (b, w)
 *   valkynaz  a Valkynaz's Redoubt - every fifth (src/net/eliteGates/egPay.js egValkRedoubt: w >= 5, w % 5 = 0)
 *   hour      an Hour broken - a Brass Remnant's row
 *   serpent   the Sea Serpent slain - a serpent's row
 */
export const QL_WITNESS_SQL = Object.freeze({
  rite: `EXISTS (SELECT 1 FROM gate_kills g WHERE g.account = ?1 AND g.at >= ${SINCE} AND (g.earned = 'rite' OR g.stones >= 2))`,
  breach: `EXISTS (SELECT 1 FROM gate_kills g WHERE g.account = ?1 AND g.at >= ${SINCE} AND g.earned != 'rite')`,
  redoubt: `EXISTS (SELECT 1 FROM eg_redoubts r WHERE r.account = ?1 AND r.at >= ${SINCE} AND ${NOT_REHEARSAL})`,
  redoubts3: `(SELECT COUNT(*) FROM eg_redoubts r WHERE r.account = ?1 AND r.at >= ${SINCE} AND ${NOT_REHEARSAL}) >= 3`,
  valkynaz: `EXISTS (SELECT 1 FROM eg_redoubts r WHERE r.account = ?1 AND r.at >= ${SINCE} AND r.w >= 5 AND r.w % 5 = 0 AND ${NOT_REHEARSAL})`,
  hour: `EXISTS (SELECT 1 FROM sd_kills d WHERE d.account = ?1 AND d.at >= ${SINCE})`,
  serpent: `EXISTS (SELECT 1 FROM serpent_kills z WHERE z.account = ?1 AND z.at >= ${SINCE})`,
});
for (const k of QL_WITNESS_KINDS) if (!QL_WITNESS_SQL[/** @type {keyof typeof QL_WITNESS_SQL} */ (k)]) throw new Error(`questlines.js: no witness for ${k}`);

/** A line's step done on this account's row (`?1`), the line and the step bound at `?l` and `?s`. */
const doneSql = (l, s) => `EXISTS (SELECT 1 FROM ql_steps a WHERE a.account = ?1 AND a.line = ?${l} AND a.step = ?${s} AND a.done_at IS NOT NULL)`;

/** The steps a line's title waits on: every witnessed step before its `titleAt`, and `titleAt` itself. Pure. */
export function qlTitleSteps(lineId) {
  const l = QL_SERVICE_LINES[/** @type {keyof typeof QL_SERVICE_LINES} */ (lineId)];
  if (!l) return [];
  return [...Object.keys(l.witness).map(Number).filter((s) => s < l.titleAt), l.titleAt].sort((a, b) => a - b);
}

/**
 * THE CLAIM. `{ opened: true }` the first time a step is claimed; after, `{ witnessed: false }` or `{ witnessed: true,
 * title?, key?, keys? }`; `{ why: 'unpaid' }` for a step the service pays nothing, `{ why: 'guest' }` for a row with no
 * handle; `{ error }` - 'ql-closed' (the switch), 'ql-body' (a body questlineClaims.js qlClaimOf refuses).
 * @param {{ db: any, env?: any }} ctx
 * @param {{ id: string, handle?: string|null }} player
 * @param {any} body @param {number} nowS
 */
export async function claimQl({ db, env = null }, player, body, nowS) {
  if (!questlinesOpenFor(player, env)) return { error: 'ql-closed' };
  const claim = qlClaimOf(body);
  if (!claim) return { error: 'ql-body' };
  const { line, step, choice } = claim;
  if (!qlStepClaimed(line, step)) return { why: 'unpaid' };
  if (!player?.handle) return { why: 'guest' };
  /** @type {any} */ const law = QL_SERVICE_LINES[/** @type {keyof typeof QL_SERVICE_LINES} */ (line)];

  // THE OPENING - the first claim of (account, line, step), and the whole of it
  const open = await db.prepare('INSERT OR IGNORE INTO ql_steps (account, line, step, opened_at) VALUES (?1, ?2, ?3, ?4)').bind(player.id, line, step, nowS).run();
  if (Number(open?.meta?.changes ?? 0) > 0) return { opened: true };

  // THE WITNESS - the step's receipt since its opening, or its line's `after` done; a step with neither is never
  // witnessed (nothing is paid on the client's word)
  const kind = /** @type {keyof typeof QL_WITNESS_SQL | undefined} */ (law.witness[step]);
  const after = law.after ?? null;
  const witness = kind ? QL_WITNESS_SQL[kind] : after ? doneSql(5, 6) : '0';
  const statements = [
    db.prepare(`UPDATE ql_steps SET done_at = ?4 WHERE account = ?1 AND line = ?2 AND step = ?3 AND done_at IS NULL AND (${witness})`)
      .bind(player.id, line, step, nowS, ...(!kind && after ? [after[0], after[1]] : [])),
  ];
  // THE CHOICE - the outcome's word, the first a claim of the done step carries (a step done by a claim without one -
  // an opening asked again - takes the next claim's)
  if (choice !== null) {
    statements.push(db.prepare('UPDATE ql_steps SET choice = ?4 WHERE account = ?1 AND line = ?2 AND step = ?3 AND done_at IS NOT NULL AND choice IS NULL').bind(player.id, line, step, choice));
  }
  // THE TITLE - its bit, once, while its steps are all done
  const titleSteps = qlTitleSteps(line);
  const titleAt = titleSteps.includes(step) ? statements.length : -1;
  if (titleAt >= 0) {
    statements.push(db.prepare(`UPDATE players SET ql_titles = ql_titles | ?2 WHERE id = ?1 AND (ql_titles & ?2) = 0
      AND (SELECT COUNT(*) FROM ql_steps WHERE account = ?1 AND line = ?3 AND step IN (SELECT value FROM json_each(?4)) AND done_at IS NOT NULL) = ?5`)
      .bind(player.id, qlTitleBit(law.title), line, JSON.stringify(titleSteps), titleSteps.length));
  }
  // THE KEY - once an account, kept, behind the Cycle's first line
  const key = law.key ?? null;
  const keyAt = key && key.at === step ? statements.length : -1;
  if (keyAt >= 0) {
    statements.push(db.prepare(`UPDATE players SET eg_keys = eg_keys + 1, ql_key = 1 WHERE id = ?1 AND ql_key = 0
      AND EXISTS (SELECT 1 FROM ql_steps WHERE account = ?1 AND line = ?2 AND step = ?3 AND done_at IS NOT NULL AND choice = ?4)${after ? ` AND ${doneSql(5, 6)}` : ''}
      RETURNING eg_keys`).bind(player.id, line, step, key.choice, ...(after ? [after[0], after[1]] : [])));
  }
  statements.push(db.prepare('SELECT done_at FROM ql_steps WHERE account = ?1 AND line = ?2 AND step = ?3').bind(player.id, line, step));
  const results = await db.batch(statements);
  const row = results.at(-1)?.results?.[0];
  if (row?.done_at == null) return { witnessed: false };
  const titled = titleAt >= 0 && Number(results[titleAt]?.meta?.changes ?? 0) > 0;
  const keyed = keyAt >= 0 ? results[keyAt]?.results?.[0] : null;
  return {
    witnessed: true,
    ...(titled ? { title: law.title } : {}),
    ...(keyed ? { key: true, keys: Number(keyed.eg_keys) || 0 } : {}),
  };
}
