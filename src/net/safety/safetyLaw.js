// @ts-check
// SAFE1-SAFE4 (2026-10-17, the chat safety plan, bible/11-Multiplayer/Chat-Safety-Arc.md): THE LAW BOTH ENDS AGREE ON
// - the client that asks, and the account service that decides. A player's block list (SAFE1), a report's shape
// (SAFE3), the ladder a strike climbs and a ban's bounds (SAFE4), and the chat commands that ask for them.
//
// THIS SIDE DECIDES NOTHING ABOUT AUTHORITY, as MOD1's (net/moderation.js): a moderator's /ban here is a request the
// service checks against MODERATOR_HANDLES, and a modified client that skipped every line of this file could do
// nothing a player's could not. Pure, and every side effect is the caller's.
//
// Not a DFU member: Daggerfall Unity has no chat. Ledger A row (ONLINE).
import { t } from '../../systems/textManager.js';
import { ID_RE, _b64url } from '../identityToken.js';
import { STAMP_RE, stampableLine } from './chatStamp.js';

/* ═══ SAFE1 - THE BLOCK LIST ═══════════════════════════════════════════
 * An account's own list of the accounts it no longer hears: their chat lines, their invites, their requests. Kept by
 * the service (so it follows the player to every device) and applied by the client (the relay fans a line to everyone;
 * what one hearer hides is that hearer's business). The blocked account is never told. */

/** The most accounts one account may block. */
export const BLOCKS_MAX = 200;

/* ═══ SAFE3 - A REPORT ═════════════════════════════════════════════════ */

/** Why a line is reported - the reporter's word, which the moderator and the reviewer read beside the lines. */
export const REPORT_REASONS = Object.freeze(['harassment', 'hate', 'sexual', 'threat', 'spam', 'other']);
const REASON_LABELS = Object.freeze({
  harassment: () => t('net.safety.reasonHarassment', 'Harassment or bullying'),
  hate: () => t('net.safety.reasonHate', 'Hate or slurs'),
  sexual: () => t('net.safety.reasonSexual', 'Sexual remarks'),
  threat: () => t('net.safety.reasonThreat', 'Threats'),
  spam: () => t('net.safety.reasonSpam', 'Spam or scams'),
  other: () => t('net.safety.reasonOther', 'Something else'),
});
/** A reason in the player's language. @param {string} r */
export const reportReasonLabel = (r) => (Object.hasOwn(REASON_LABELS, r) ? REASON_LABELS[/** @type {keyof typeof REASON_LABELS} */ (r)]() : r);
/** The most lines one report carries: the reported player's and the lines around them. */
export const REPORT_LINES_MAX = 16;
/** How old a line may be when it is reported, ms - a session's chat, not last week's. */
export const REPORT_LINE_AGE_MS = 24 * 3600 * 1000;
/** The longest note a reporter may add. */
export const REPORT_NOTE_MAX = 200;

/**
 * A REPORT'S SHAPE, before any stamp is believed: the account reported, a reason, an optional note, and 1 to
 * REPORT_LINES_MAX stamped lines no older than a day, at least one of them the reported account's own. The same line
 * twice is one line; the lines come back in the order they were said. `{ error }` names what is wrong in the service's
 * refusal words. The stamps are the service's to verify (chatStamp.js verifyStamp) - this is the shape alone.
 * @param {any} body @param {number} nowMs
 */
export function reportShape(body, nowMs) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'report-shape' };
  const { target, reason, lines } = body;
  if (typeof target !== 'string' || !ID_RE.test(target)) return { error: 'no-player' };
  if (!REPORT_REASONS.includes(reason)) return { error: 'report-reason' };
  const note = body.note ?? '';
  if (typeof note !== 'string' || note.length > REPORT_NOTE_MAX) return { error: 'report-shape' };
  if (!Array.isArray(lines) || !lines.length || lines.length > REPORT_LINES_MAX) return { error: 'report-shape' };
  /** @type {{tab: string, sub: string, name: string, at: number, text: string, sg: string}[]} */
  const out = [];
  const seen = new Set();
  for (const l of lines) {
    if (!stampableLine(l) || typeof l.sg !== 'string' || !STAMP_RE.test(l.sg)) return { error: 'report-shape' };
    if (nowMs - l.at > REPORT_LINE_AGE_MS || l.at - nowMs > 60_000) return { error: 'report-stale' };
    const k = `${l.at}|${l.sub}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ tab: l.tab, sub: l.sub, name: l.name, at: l.at, text: l.text, sg: l.sg });
  }
  if (!out.some((l) => l.sub === target)) return { error: 'report-no-line' };
  out.sort((a, b) => a.at - b.at);
  return { target, reason, note: note.trim(), lines: out };
}

/* ═══ SAFE4 - STRIKES, THE LADDER AND BANS ═════════════════════════════
 * Every mute and ban is a row in the service's record (mod_actions), and the record is never cleared - MOD1's
 * `muted_by` said who muted a player now; the record says who did what, and when, for good. A strike is a mute or a ban
 * within STRIKE_WINDOW_S; the ladder is the mute the next one earns. A moderator may always choose otherwise; the
 * automatic mutes (SAFE3's reports, SAFE5's reviewer) only ever take the first rung. */

/** The mute each strike earns, minutes: half an hour, then a day, then a week (MOD1's MUTE_MAX_MIN). */
export const LADDER_MIN = Object.freeze([30, 24 * 60, 7 * 24 * 60]);
/** The strikes past which the next answer is a ban, not a mute - a moderator's to give. */
export const LADDER_BAN_AT = LADDER_MIN.length;
/** How long a strike counts, seconds: ninety days. */
export const STRIKE_WINDOW_S = 90 * 24 * 3600;
/** The mute the next strike earns, given the strikes standing. @param {number} strikes */
export const ladderMinutes = (strikes) => LADDER_MIN[Math.max(0, Math.min(LADDER_MIN.length - 1, Math.trunc(Number(strikes) || 0)))];
/** The longest timed ban, days. Past it a ban is for good. */
export const BAN_DAYS_MAX = 365;
/** A ban with no length given, days. */
export const BAN_DAYS_DEFAULT = 30;
/** A ban for good: the last second of 9999, a date no clock reaches. */
export const BAN_FOREVER = 253402300799;
/** When a ban of `days` (0 for good) ends. @param {number} days @param {number} nowS */
export const banUntil = (days, nowS) => (days === 0 ? BAN_FOREVER : nowS + days * 86400);
/** The command's refusal and the service's (accountClient REFUSALS 'bad-days') in one sentence. */
export const banRangeText = () => t('net.safety.banRange', 'A ban is 1 to {max} days, or perm.', { max: BAN_DAYS_MAX });

/** SAFE4: WHICH DOOR AN ORDER GOES TO - 'mute' or 'ban', read off its body, or null. The client never verifies an order
 *  (the room does, with the key); it only needs to carry a pushed one (the hub's `law`) to the arm that reads its kind. */
export function orderKindOf(order) {
  const body = typeof order === 'string' ? order.split('.')[1] : null;
  const raw = body ? _b64url.decode(body) : null;
  if (!raw) return null;
  try { const o = JSON.parse(new TextDecoder().decode(raw))?.o; return o === 'mute' || o === 'ban' ? o : null; } catch { return null; }
}

/* ═══ THE COMMANDS ═════════════════════════════════════════════════════ */

/** The commands this file reads - the host asks before the chat parser (net/chatCommands.js HOST_COMMANDS). */
export const SAFETY_COMMANDS = Object.freeze(['block', 'unblock', 'blocked', 'report', 'conduct', 'rules', 'ban', 'unban', 'strikes']);
const USAGE = Object.freeze({
  block: () => t('net.safety.usageBlock', 'Usage: /block <name> - you stop hearing them. /unblock <name> undoes it; /blocked lists them.'),
  unblock: () => t('net.safety.usageUnblock', 'Usage: /unblock <name>.'),
  report: () => t('net.safety.usageReport', 'Usage: /report <name> [harassment|hate|sexual|threat|spam] - sends their recent lines to the moderators.'),
  ban: () => t('net.safety.usageBan', 'Usage: /ban <name> [days|perm], or /unban <name>.'),
  unban: () => t('net.safety.usageUnban', 'Usage: /unban <name>.'),
  strikes: () => t('net.safety.usageStrikes', 'Usage: /strikes <name>.'),
});
const COMMAND_RE = new RegExp(`^/(${SAFETY_COMMANDS.join('|')})(?:\\s+([\\s\\S]*))?$`, 'i');

/**
 * Read a line as a safety command, or null if it is not one. `{ op, name?, reason?, days? }`, or `{ error }` for a
 * command typed wrong - said, never sent as chat. A NAME MAY HAVE A SPACE IN IT (a guest's always does), so a report's
 * reason and a ban's length are the LAST word, and only when that word is one; everything before it is the name.
 * @param {string} text
 */
export function parseSafetyCommand(text) {
  const m = COMMAND_RE.exec(String(text ?? '').trim());
  if (!m) return null;
  const op = m[1].toLowerCase();
  const rest = (m[2] ?? '').trim();
  if (op === 'blocked' || op === 'conduct' || op === 'rules') return { op: op === 'rules' ? 'conduct' : op };
  if (!rest) return { error: USAGE[/** @type {keyof typeof USAGE} */ (op)]() };
  if (op === 'report') {
    const tail = /^(.*\S)\s+(\S+)$/.exec(rest);
    const said = tail?.[2].toLowerCase();
    return tail && said && REPORT_REASONS.includes(said) ? { op, name: tail[1], reason: said } : { op, name: rest, reason: 'other' };
  }
  if (op === 'ban') {
    const tail = /^(.*\S)\s+(\d+|perm|forever)$/i.exec(rest);
    const counted = !!tail && /^\d+$/.test(tail[2]);
    const days = !tail ? BAN_DAYS_DEFAULT : counted ? Number(tail[2]) : 0;
    if (counted && (!Number.isSafeInteger(days) || days < 1 || days > BAN_DAYS_MAX)) return { error: banRangeText() };
    return { op, name: tail ? tail[1] : rest, days };
  }
  return { op, name: rest };
}
