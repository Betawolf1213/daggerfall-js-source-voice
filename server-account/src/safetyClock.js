// @ts-check
// ═══════════════════════════════════════════════════════════════════
// SAFE5 + SAFE8 (2026-10-17, the chat safety plan, bible/11-Multiplayer/Chat-Safety-Arc.md sections 6 and 9): THE
// CHAT SAFETY'S CLOCK - what no request waits on. Every minute (cron.js MINUTE_JOBS 'safety'):
//   1. the reviewer reads the relay's waiting feed batches (FEED_READS_MAX) and opens a case for each speaker it finds
//      breaking the code at FLAG_SEVERITY or worse - their flagged lines and the CONTEXT_BEFORE lines before each;
//   2. the reviewer reads the cases reports opened or grew (TRIAGE_MAX) and gives each its verdict on the reported
//      account's lines;
//   3. every case whose verdict is in (or that has waited REVIEW_WAIT_S on a reviewer that does not answer) is posted to
//      the moderators' channel, or its card redrawn (POSTS_MAX).
// With MOD_AI "on", a verdict that acts (modAi.js flagActs) mutes for the ladder's first rung, once a case, and the
// order is pushed to the relay's door. A reviewer out of its day's calls, or unreachable, leaves its work due for the
// next minute; one that refuses a batch or answers out of shape is not asked that batch again.
//
// Every hour (HOUR_JOBS 'safety-sweep'): the feed's batches past FEED_KEEP_S; the lines of cases resolved past
// RESOLVED_LINES_KEEP_S (the case and the record of what was done stay); a case left open past CASE_OPEN_MAX_S closed
// as expired; the reviewer's daily counts past AI_DAYS_KEEP.
// ═══════════════════════════════════════════════════════════════════

import { reviewLines, modAiOn, modAiModeOf, flagActs, FLAG_SEVERITY, AI_ERRORS } from './modAi.js';
import { discordOn, sendCard, cardOf } from './discord.js';
import { openCaseFor, keepCaseLines } from './safety.js';
import { autoMute, lawOrder, pushLaw } from './sanctions.js';

/** The feed batches the reviewer reads a minute. */
export const FEED_READS_MAX = 3;
/** The cases the reviewer reads a minute. */
export const TRIAGE_MAX = 3;
/** The cards posted or redrawn a minute (Discord's own rate is five a channel in five seconds). */
export const POSTS_MAX = 5;
/** The feed's lines kept before each flagged line, for context. */
export const CONTEXT_BEFORE = 3;
/** How long a case waits on a reviewer that does not answer before it is posted without a verdict, seconds. */
export const REVIEW_WAIT_S = 600;
/** How long the feed's batches are kept (a batch seen twice inside it is read once), seconds. */
export const FEED_KEEP_S = 24 * 3600;
/** How long a resolved case keeps its lines, seconds. */
export const RESOLVED_LINES_KEEP_S = 90 * 24 * 3600;
/** How long a case may stand open before the clock closes it as expired, seconds. */
export const CASE_OPEN_MAX_S = 90 * 24 * 3600;
/** How many days of the reviewer's counts are kept. */
export const AI_DAYS_KEEP = 31;
/** The rows one sweep deletes a table. */
export const SAFETY_SWEEP_ROWS = 500;

/** The worst of a set of flags: severity first, then confidence. @param {any[]} flags */
const worstOf = (flags) => flags.reduce((w, f) => (!w || f.severity > w.severity || (f.severity === w.severity && f.confidence > w.confidence) ? f : w), null);

/** A verdict that acts, acted on: the ladder's first rung, once a case, the order pushed. */
async function actOn(ctx, env, fetchFn, caseId, targetId, flag) {
  if (modAiModeOf(env) !== 'on' || !flagActs(flag)) return 0;
  const c = await ctx.db.prepare('SELECT auto FROM mod_cases WHERE id = ?1').bind(caseId).first();
  if (c?.auto) return 0;
  const row = await ctx.db.prepare('SELECT * FROM players WHERE id = ?1').bind(targetId).first();
  const until = await autoMute(ctx.db, env, row, { actor: 'auto:review', reason: `reviewer: ${flag.category}, severity ${flag.severity}`, caseId, nowS: ctx.nowS });
  if (!until) return 0;
  await ctx.db.prepare("UPDATE mod_cases SET auto = 'review' WHERE id = ?1").bind(caseId).run();
  await pushLaw(env, fetchFn, await lawOrder(env, crypto.subtle, ctx.nowS, { s: targetId, mu: until }));
  return 1;
}

/** A verdict kept on its case - only ever raised, never lowered by a later, milder read - and the card due again. */
async function keepVerdict(db, caseId, flag, mode, nowS) {
  await db.prepare("UPDATE mod_cases SET updated_at = ?2, discord_state = CASE WHEN discord_state = 'off' THEN 'off' ELSE 'due' END WHERE id = ?1").bind(caseId, nowS).run();
  await db.prepare(`UPDATE mod_cases SET ai_state = 'done', ai_category = ?2, ai_severity = ?3, ai_confidence = ?4, ai_reason = ?5, ai_mode = ?6, ai_at = ?7
    WHERE id = ?1 AND (ai_severity IS NULL OR ai_severity <= ?3)`).bind(caseId, flag?.category ?? null, flag?.severity ?? 0, flag?.confidence ?? null, flag?.reason ?? null, mode, nowS).run();
  await db.prepare("UPDATE mod_cases SET ai_state = 'done' WHERE id = ?1 AND ai_state = 'due'").bind(caseId).run();
}

/** 1. THE FEED READ: its waiting batches, and a case for each speaker the reviewer finds breaking the code. */
async function readFeed(ctx, env, fetchFn) {
  const due = (await ctx.db.prepare("SELECT id, lines FROM mod_feed WHERE state = 'due' ORDER BY at LIMIT ?1").bind(FEED_READS_MAX).all())?.results ?? [];
  let n = 0;
  for (const b of due) {
    let lines = [];
    try { lines = JSON.parse(String(b.lines ?? '[]')); } catch { lines = []; }
    if (!Array.isArray(lines)) lines = [];
    const r = lines.length ? await reviewLines(ctx.db, env, fetchFn, { lines, nowS: ctx.nowS }) : { ok: true, flags: [] };
    if ('error' in r && (r.error === AI_ERRORS.budget || r.error === AI_ERRORS.down || r.error === AI_ERRORS.off)) break;   // the next minute's
    await ctx.db.prepare("UPDATE mod_feed SET state = 'done', lines = NULL WHERE id = ?1").bind(b.id).run();
    n++;
    if (!('flags' in r)) continue;
    /** @type {Map<string, any[]>} */
    const bySpeaker = new Map();
    for (const f of r.flags) if (f.severity >= FLAG_SEVERITY) bySpeaker.set(lines[f.line].sub, [...(bySpeaker.get(lines[f.line].sub) ?? []), f]);
    for (const [sub, flags] of bySpeaker) {
      if (!(await ctx.db.prepare('SELECT 1 AS y FROM players WHERE id = ?1').bind(sub).first())) continue;
      const keep = new Set();
      for (const f of flags) for (let i = Math.max(0, f.line - CONTEXT_BEFORE); i <= f.line; i++) keep.add(i);
      const caseId = await openCaseFor(ctx, env, sub, 'review');
      await keepCaseLines(ctx.db, caseId, [...keep].sort((x, y) => x - y).map((i) => ({ ...lines[i], sg: null })));
      const worst = worstOf(flags);
      await keepVerdict(ctx.db, caseId, worst, modAiModeOf(env), ctx.nowS);
      await actOn(ctx, env, fetchFn, caseId, sub, worst);
    }
  }
  return n;
}

/** 2. THE CASES READ: each the reports opened or grew, its verdict on the reported account's own lines. */
async function triageCases(ctx, env, fetchFn) {
  const due = (await ctx.db.prepare("SELECT id, target FROM mod_cases WHERE ai_state = 'due' ORDER BY updated_at LIMIT ?1").bind(TRIAGE_MAX).all())?.results ?? [];
  let n = 0;
  for (const c of due) {
    const lines = (await ctx.db.prepare('SELECT sub, tab, text FROM mod_case_lines WHERE case_id = ?1 ORDER BY at, sub').bind(c.id).all())?.results ?? [];
    const r = await reviewLines(ctx.db, env, fetchFn, { lines, focus: c.target, nowS: ctx.nowS });
    if ('error' in r && (r.error === AI_ERRORS.budget || r.error === AI_ERRORS.down || r.error === AI_ERRORS.off)) break;
    n++;
    if (!('flags' in r)) {
      await ctx.db.prepare("UPDATE mod_cases SET ai_state = 'failed', ai_at = ?2, discord_state = CASE WHEN discord_state = 'off' THEN 'off' ELSE 'due' END WHERE id = ?1").bind(c.id, ctx.nowS).run();
      continue;
    }
    const worst = worstOf(r.flags.filter((f) => lines[f.line]?.sub === c.target));
    await keepVerdict(ctx.db, c.id, worst, modAiModeOf(env), ctx.nowS);
    await actOn(ctx, env, fetchFn, c.id, c.target, worst);
  }
  return n;
}

/** 3. THE CARDS: each case due, posted or redrawn once its verdict is in (or the reviewer has kept it waiting too long). */
async function postCards(ctx, env, fetchFn) {
  const due = (await ctx.db.prepare("SELECT id, discord_msg FROM mod_cases WHERE discord_state = 'due' AND (ai_state != 'due' OR updated_at < ?1) ORDER BY updated_at LIMIT ?2")
    .bind(ctx.nowS - REVIEW_WAIT_S, POSTS_MAX).all())?.results ?? [];
  let n = 0;
  for (const c of due) {
    const card = await cardOf(ctx.db, c.id, ctx.nowS);
    const msg = card ? await sendCard(env, fetchFn, card, c.discord_msg ?? null) : null;
    if (!msg) break;   // Discord unreachable: the rest wait for the next minute
    await ctx.db.prepare("UPDATE mod_cases SET discord_state = 'posted', discord_msg = ?2 WHERE id = ?1").bind(c.id, msg).run();
    n++;
  }
  return n;
}

/**
 * THE MINUTE'S WORK. Answers how much it moved.
 * @param {{ db: any, nowS: number, rand: (b: Uint8Array) => void }} ctx @param {any} env
 * @param {{ fetchFn?: (url: string, init: any) => Promise<Response> }} [io]
 */
export async function safetyMinute(ctx, env, { fetchFn = (u, i) => globalThis.fetch(u, i) } = {}) {
  let n = 0;
  if (modAiOn(env)) n += (await readFeed(ctx, env, fetchFn)) + (await triageCases(ctx, env, fetchFn));
  if (discordOn(env)) n += await postCards(ctx, env, fetchFn);
  return n;
}

/** THE HOUR'S SWEEP. Answers the rows it changed. @param {{ db: any, nowS: number }} ctx */
export async function safetySweep({ db, nowS }) {
  const ran = async (sql, ...args) => Number((await db.prepare(sql).bind(...args).run())?.meta?.changes ?? 0);
  let n = 0;
  n += await ran('DELETE FROM mod_feed WHERE id IN (SELECT id FROM mod_feed WHERE at < ?1 LIMIT ?2)', nowS - FEED_KEEP_S, SAFETY_SWEEP_ROWS);
  n += await ran(`UPDATE mod_cases SET status = 'dismissed', resolved_by = 'the clock', resolved_at = ?1, resolution = 'expired'
    WHERE id IN (SELECT id FROM mod_cases WHERE status = 'open' AND opened_at < ?2 LIMIT ?3)`, nowS, nowS - CASE_OPEN_MAX_S, SAFETY_SWEEP_ROWS);
  n += await ran(`DELETE FROM mod_case_lines WHERE rowid IN (SELECT l.rowid FROM mod_case_lines l JOIN mod_cases c ON c.id = l.case_id
    WHERE c.resolved_at IS NOT NULL AND c.resolved_at < ?1 LIMIT ?2)`, nowS - RESOLVED_LINES_KEEP_S, SAFETY_SWEEP_ROWS);
  n += await ran('DELETE FROM mod_ai_days WHERE day < ?1', new Date((nowS - AI_DAYS_KEEP * 86400) * 1000).toISOString().slice(0, 10));
  return n;
}
