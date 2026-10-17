// @ts-check
// ═══════════════════════════════════════════════════════════════════
// SAFE1, SAFE3, SAFE5, SAFE7 (2026-10-17, Mac: "Lets do every single thing here. I want a full fledged future proof
// system"; the chat safety plan, bible/11-Multiplayer/Chat-Safety-Arc.md): A PLAYER'S BLOCK LIST, A REPORT AND ITS CASE,
// THE REVIEWER'S FEED IN, AND THE CODE OF CONDUCT AGREED.
//
// SAFE1 - THE BLOCK LIST. An account's own list of accounts it no longer hears (`blocks`), kept here so it follows the
// player to every device and applied by the client (net/safety/chatGuard.js). Never told to the blocked account.
// Community-Arc's "No block list: a moderator's mute and the per-reader rate are the walls" was the right call for the
// pages (SOC-PAGE); a chat that grew past what three moderators can watch needs the player's own wall too.
//
// SAFE3 - A REPORT IS EVIDENCE OR IT IS NOTHING. A report carries the lines as the reporter heard them, each with the
// relay's stamp (net/safety/chatStamp.js), and every stamp is checked with the relay's public half (GATE_PUBLIC_KEY)
// before a word is kept: a line the relay did not relay, or relayed as something else, refuses the whole report. Reports
// about one account gather into one open CASE (`mod_cases`), its lines kept once (`mod_case_lines`), its reporters once
// each (`mod_reports`). A case is what a moderator acts on - in Discord (discord.js), sorted by the reviewer (modAi.js).
//
// THE AUTOMATIC MUTE, and why it is hard to reach: REPORT_AUTO_MUTE reporters who COUNT (credible: a registered account,
// not muted, no sprout - the Notice Board's law, AUDIT 28 N3 - within REPORT_AUTO_WINDOW_S) mute the account for the
// ladder's first rung (sanctions.js autoMute), once a case, and never a moderator. Five guests made a minute ago cannot
// mute anybody; three regulars who saw the same line can, for half an hour, and a moderator reads why.
//
// SAFE5 - THE REVIEWER'S FEED IN. The relay posts its public channels' lines, a signed batch (net/safety/chatFeed.js);
// the batch is checked and kept (`mod_feed`) for the minute's clock (safetyClock.js), which has the reviewer read it.
// While the reviewer is off nothing is kept and nothing is checked.
//
// SAFE7 - THE CODE OF CONDUCT AGREED: the version a player agreed to (`players.conduct_v`), which the token's mint says
// back (`conduct`), so the client asks before a first line and again when the code changes.
// ═══════════════════════════════════════════════════════════════════

import { accountKind, displayName, isMuted, overRate } from './accounts.js';
import { SPROUT_S } from './titles.js';
import { gatePublicKey } from './signing.js';
import { autoMute, lawOrder, pushLaw, bannedUntil } from './sanctions.js';
import { modAiOn } from './modAi.js';
import { discordOn } from './discord.js';
import { ID_RE } from '../../src/net/identityToken.js';
import { verifyStamp } from '../../src/net/safety/chatStamp.js';
import { openFeed } from '../../src/net/safety/chatFeed.js';
import { BLOCKS_MAX, reportShape } from '../../src/net/safety/safetyLaw.js';
import { CONDUCT_VERSION } from '../../src/net/safety/conduct.js';

/** Reports one account may file in REPORT_WINDOW_S. */
export const REPORT_RATE_MAX = 12;
export const REPORT_WINDOW_S = 3600;
/** Blocks and unblocks one account may ask in BLOCK_WINDOW_S. */
export const BLOCK_RATE_MAX = 60;
export const BLOCK_WINDOW_S = 3600;
/** Credible reporters within REPORT_AUTO_WINDOW_S that mute the account they report (the ladder's first rung). */
export const REPORT_AUTO_MUTE = 3;
export const REPORT_AUTO_WINDOW_S = 3600;
/** The most bytes a report's body may be - REPORT_LINES_MAX stamped lines of the longest chat line, and room. */
export const REPORT_BODY_MAX = 24 * 1024;
/** The most lines one case keeps - a case reported over and over keeps its first. */
export const CASE_LINES_MAX = 60;

/** A case's id: 16 hex off the service's random source. @param {(b: Uint8Array) => void} rand */
export const caseIdOf = (rand) => { const b = new Uint8Array(8); rand(b); return [...b].map((x) => x.toString(16).padStart(2, '0')).join(''); };

/* ═══ SAFE1 - THE BLOCK LIST ═══ */

/** The accounts `player` has blocked, newest first, each with the name a player reads. */
export async function blocksOf({ db }, player) {
  const rows = (await db.prepare('SELECT b.blocked, b.at, p.handle, p.guest_name FROM blocks b JOIN players p ON p.id = b.blocked WHERE b.player = ?1 ORDER BY b.at DESC LIMIT ?2').bind(player.id, BLOCKS_MAX).all())?.results ?? [];
  return { ok: true, blocks: rows.map((r) => ({ sub: r.blocked, name: displayName(r), at: r.at })) };
}

/** BLOCK an account - never oneself, never past BLOCKS_MAX; blocking one already blocked is the list as it was. */
export async function blockAccount(ctx, player, { target }) {
  const { db, nowS } = ctx;
  if (typeof target !== 'string' || !ID_RE.test(target)) return { error: 'no-player' };
  if (target === player.id) return { error: 'block-self' };
  if (await overRate(ctx, `safety-block:${player.id}`, BLOCK_RATE_MAX, BLOCK_WINDOW_S)) return { error: 'rate' };
  const row = await db.prepare('SELECT id FROM players WHERE id = ?1').bind(target).first();
  if (!row) return { error: 'no-player' };
  // ONE STATEMENT DECIDES the bound: the row is written only while fewer than BLOCKS_MAX stand
  const r = await db.prepare('INSERT OR IGNORE INTO blocks (player, blocked, at) SELECT ?1, ?2, ?3 WHERE (SELECT COUNT(*) FROM blocks WHERE player = ?1) < ?4')
    .bind(player.id, target, nowS, BLOCKS_MAX).run();
  if (!r?.meta?.changes) {
    const had = await db.prepare('SELECT 1 AS y FROM blocks WHERE player = ?1 AND blocked = ?2').bind(player.id, target).first();
    if (!had) return { error: 'blocks-full' };
  }
  return blocksOf(ctx, player);
}

/** UNBLOCK an account - one not blocked is the list as it was. */
export async function unblockAccount(ctx, player, { target }) {
  if (typeof target !== 'string' || !ID_RE.test(target)) return { error: 'no-player' };
  if (await overRate(ctx, `safety-block:${player.id}`, BLOCK_RATE_MAX, BLOCK_WINDOW_S)) return { error: 'rate' };
  await ctx.db.prepare('DELETE FROM blocks WHERE player = ?1 AND blocked = ?2').bind(player.id, target).run();
  return blocksOf(ctx, player);
}

/* ═══ SAFE7 - THE CODE OF CONDUCT ═══ */

/** Whether the player has agreed to the code as it stands. @param {any} player */
export const conductAgreed = (player) => player?.conduct_v === CONDUCT_VERSION;

/** AGREE to the code - the version the client showed must be the one this service holds, or the player read old words. */
export async function agreeConduct({ db }, player, { v }) {
  if (v !== CONDUCT_VERSION) return { error: 'conduct-stale' };
  await db.prepare('UPDATE players SET conduct_v = ?1 WHERE id = ?2').bind(CONDUCT_VERSION, player.id).run();
  return { ok: true, conduct: CONDUCT_VERSION };
}

/* ═══ SAFE3 - A REPORT AND ITS CASE ═══ */

/** Whether a reporter COUNTS toward the automatic mute (the Notice Board's law): registered, not muted, no sprout. */
export const credibleReporter = (player, nowS) => accountKind(player) === 'linked' && !isMuted(player, nowS) && Number(player?.created_at) <= nowS - SPROUT_S;

/**
 * The account's open case, or a new one. A case opened by a report is the reports'; one the reviewer opened is the
 * reviewer's (`source`). The reviewer and the Discord post start `due` when each is on, `off` otherwise.
 * @param {{ db: any, nowS: number, rand: (b: Uint8Array) => void }} ctx @param {any} env @param {string} target @param {'report'|'review'} source
 */
export async function openCaseFor({ db, nowS, rand }, env, target, source) {
  // ONE OPEN CASE AN ACCOUNT, by the index (mod_cases_open): two reports at once open one case, the second's insert
  // ignored and the first's case read back
  await db.prepare('INSERT OR IGNORE INTO mod_cases (id, target, source, status, opened_at, updated_at, ai_state, discord_state) VALUES (?1, ?2, ?3, \'open\', ?4, ?4, ?5, ?6)')
    .bind(caseIdOf(rand), target, source, nowS, modAiOn(env) ? 'due' : 'off', discordOn(env) ? 'due' : 'off').run();
  const open = await db.prepare("SELECT id FROM mod_cases WHERE target = ?1 AND status = 'open'").bind(target).first();
  return String(open.id);
}

/** A case's lines kept - each once, never past CASE_LINES_MAX. @param {any} db @param {string} caseId
 *  @param {{tab: string, sub: string, name: string, at: number, text: string, sg?: string|null}[]} lines */
export async function keepCaseLines(db, caseId, lines) {
  const held = await db.prepare('SELECT COUNT(*) AS n FROM mod_case_lines WHERE case_id = ?1').bind(caseId).first();
  const room = CASE_LINES_MAX - Number(held?.n ?? 0);
  if (room <= 0 || !lines.length) return 0;
  const add = lines.slice(-room);
  await db.batch(add.map((l) => db.prepare('INSERT OR IGNORE INTO mod_case_lines (case_id, at, sub, name, tab, text, sg) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)')
    .bind(caseId, l.at, l.sub, l.name, l.tab, l.text, l.sg ?? null)));
  return add.length;
}

/** A case touched: its counts again, and the reviewer and the post due again where each is on (`off` stays off). */
export const touchCase = (db, caseId, nowS) => db.prepare(`UPDATE mod_cases SET updated_at = ?2,
    reports = (SELECT COUNT(*) FROM mod_reports WHERE case_id = ?1),
    credible = (SELECT COUNT(*) FROM mod_reports WHERE case_id = ?1 AND counted = 1 AND at > ?3),
    ai_state = CASE WHEN ai_state = 'off' THEN 'off' ELSE 'due' END,
    discord_state = CASE WHEN discord_state = 'off' THEN 'off' ELSE 'due' END
  WHERE id = ?1`).bind(caseId, nowS, nowS - REPORT_AUTO_WINDOW_S).run();

/**
 * FILE A REPORT. `body` is net/safety/safetyLaw.js reportShape's: the account, a reason, a note, and the lines as heard,
 * each stamped. Answers `{ ok, case, repeat?, muted?, order? }` - `order` a mute order the reporter's client carries to
 * its rooms when this report was the one that muted the account (MOD1's carrier), which the relay's door also hears.
 * @param {{ db: any, nowS: number, subtle: SubtleCrypto, rand: (b: Uint8Array) => void }} ctx @param {any} reporter @param {any} env @param {any} body
 * @param {{ fetchFn?: (url: string, init: any) => Promise<Response> }} [io]
 */
export async function fileReport(ctx, reporter, env, body, { fetchFn = (u, i) => globalThis.fetch(u, i) } = {}) {
  const { db, nowS, subtle } = ctx;
  const shape = reportShape(body, nowS * 1000);
  if ('error' in shape) return shape;
  if (shape.target === reporter.id) return { error: 'report-self' };
  if (await overRate(ctx, `safety-report:${reporter.id}`, REPORT_RATE_MAX, REPORT_WINDOW_S)) return { error: 'rate' };
  const key = await gatePublicKey(env, subtle);
  if (!key) return { error: 'report-closed' };
  for (const l of shape.lines) if (!(await verifyStamp(l, l.sg, key, { subtle }))) return { error: 'report-unwitnessed' };
  const target = await db.prepare('SELECT * FROM players WHERE id = ?1').bind(shape.target).first();
  if (!target) return { error: 'no-player' };
  const caseId = await openCaseFor(ctx, env, target.id, 'report');
  const counted = credibleReporter(reporter, nowS) ? 1 : 0;
  const filed = await db.prepare('INSERT OR IGNORE INTO mod_reports (case_id, reporter, reason, note, at, counted) VALUES (?1, ?2, ?3, ?4, ?5, ?6)')
    .bind(caseId, reporter.id, shape.reason, shape.note || null, nowS, counted).run();
  await keepCaseLines(db, caseId, shape.lines);
  await touchCase(db, caseId, nowS);
  const repeat = !filed?.meta?.changes;
  const row = await db.prepare('SELECT credible, auto FROM mod_cases WHERE id = ?1').bind(caseId).first();
  let order = null, until = 0;
  if (!row?.auto && Number(row?.credible) >= REPORT_AUTO_MUTE) {
    until = await autoMute(db, env, target, { actor: 'auto:reports', reason: `${row.credible} reports: ${shape.reason}`, caseId, nowS });
    if (until) {
      await db.prepare("UPDATE mod_cases SET auto = 'reports' WHERE id = ?1").bind(caseId).run();
      order = await lawOrder(env, subtle, nowS, { s: target.id, mu: until });
      await pushLaw(env, fetchFn, order);
    }
  }
  return { ok: true, case: caseId, ...(repeat ? { repeat: true } : {}), ...(until ? { muted: until } : {}), ...(order ? { order } : {}) };
}

/* ═══ SAFE5 - THE REVIEWER'S FEED IN ═══ */

/**
 * A BATCH OF PUBLIC LINES, from the relay: kept for the minute's clock while the reviewer is on - checked with the
 * relay's public half first, a batch seen before kept once. While the reviewer is off it is answered and dropped
 * unread. @param {{ db: any, nowS: number, subtle: SubtleCrypto }} ctx @param {any} env @param {Uint8Array} bytes @param {unknown} sig
 */
export async function takeFeed({ db, nowS, subtle }, env, bytes, sig) {
  if (!modAiOn(env)) return { ok: true, read: false };
  const opened = await openFeed(bytes, sig, await gatePublicKey(env, subtle), { subtle, nowMs: nowS * 1000 });
  if ('error' in opened) return opened;
  await db.prepare("INSERT OR IGNORE INTO mod_feed (id, at, lines, state) VALUES (?1, ?2, ?3, 'due')").bind(opened.batch.id, nowS, JSON.stringify(opened.batch.lines)).run();
  return { ok: true, read: true };
}

/** What a banned account is told on every door it knocks at. @param {any} player */
export const bannedAnswer = (player) => ({ error: 'banned', until: bannedUntil(player), reason: player?.ban_reason ?? null });
