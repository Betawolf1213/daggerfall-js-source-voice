// @ts-check
// ═══════════════════════════════════════════════════════════════════
// SAFE8 (2026-10-17, Mac: "We need to find ways to combat this without the need of ingame moderation"; the chat safety
// plan, bible/11-Multiplayer/Chat-Safety-Arc.md section 9): THE MODERATORS' QUEUE IN DISCORD. A moderator need not be in
// the game to see what was reported, nor to act on it: every case (safety.js) is a card in a private channel - the
// lines, the reports, the reviewer's verdict, the account's strikes - with buttons that mute, ban or dismiss it, and a
// /mod command that looks an account up and mutes, unmutes, bans or unbans it by name.
//
// TWO HALVES, as Discord has them:
//   - OUT: the bot posts a case's card to DISCORD_MOD_CHANNEL with DISCORD_BOT_TOKEN (a secret the deploy puts, never
//     in wrangler.toml) - by the service's minute clock (safetyClock.js), and edits it when a moderator acts. Pings
//     nobody (`allowed_mentions` empty), and a player's words are drawn in a code block, so no line is markdown.
//   - IN: Discord posts each press and each /mod to the service's DISCORD_INTERACTIONS_PATH, signed with the
//     application's Ed25519 key; the signature (DISCORD_PUBLIC_KEY, the application's public key - not a secret) is
//     checked over the exact bytes before anything is read, as the Patreon webhook's is.
//
// WHO MAY ACT IS THE GAME'S QUESTION, NOT DISCORD'S. DISCORD_MODERATORS pairs a Discord user's id with a game handle
// ("<discord id>:<handle>,..."), and an act is that account's act: it must hold MODERATOR_HANDLES or DEVELOPER_HANDLES
// now (titles.js canModerate) - so taking a handle off the list takes the buttons with it, a Discord role never grants
// anything, and the record names the moderator's own account (sanctions.js). MOD1's law, through another door.
// ═══════════════════════════════════════════════════════════════════

import { muteAccount, displayName } from './accounts.js';
import { canModerate } from './titles.js';
import { importPublicKey } from '../../src/net/identityToken.js';
import { actionStatement, banAccount, unbanAccount, findAccount, strikesLook, lawOrder, pushLaw, reasonOf, muteMinutesOk, strikesOf } from './sanctions.js';
import { LADDER_BAN_AT, ladderMinutes, BAN_FOREVER, reportReasonLabel } from '../../src/net/safety/safetyLaw.js';

/** The door Discord posts its interactions to (the application's Interactions Endpoint URL). */
export const DISCORD_INTERACTIONS_PATH = '/v1/discord/interactions';
/** Discord's API. */
export const DISCORD_API = 'https://discord.com/api/v10';
/** The most bytes an interaction's body may be. */
export const DISCORD_BODY_MAX = 32 * 1024;
/** How old an interaction's timestamp may be, seconds - an old one replayed is refused. */
export const DISCORD_SKEW_S = 300;
/** How long the service waits on Discord's API, ms. */
export const DISCORD_POST_MS = 8000;
/** The most of a case's lines a card draws - the newest. */
export const CARD_LINES_MAX = 24;
/** The most characters a card's lines may fill (an embed's description holds 4,096). */
export const CARD_TEXT_MAX = 3400;
/** A card's buttons: what each does, by its custom id's middle word. */
export const CARD_ACTS = Object.freeze({
  m30: Object.freeze({ label: 'Mute 30 min', minutes: 30 }),
  m1d: Object.freeze({ label: 'Mute 1 day', minutes: 24 * 60 }),
  m7d: Object.freeze({ label: 'Mute 7 days', minutes: 7 * 24 * 60 }),
  b30: Object.freeze({ label: 'Ban 30 days', days: 30 }),
  dis: Object.freeze({ label: 'Dismiss' }),
});
const SNOWFLAKE_RE = /^\d{5,25}$/;
const HEX_KEY_RE = /^[0-9a-f]{64}$/i;

/** Whether the bot may post cards: a channel and its token. @param {any} env */
export const discordOn = (env) => SNOWFLAKE_RE.test(String(env?.DISCORD_MOD_CHANNEL ?? '')) && typeof env?.DISCORD_BOT_TOKEN === 'string' && env.DISCORD_BOT_TOKEN.length > 0;
/** Whether Discord's presses and commands are taken: the application's public key. @param {any} env */
export const interactionsOn = (env) => HEX_KEY_RE.test(String(env?.DISCORD_PUBLIC_KEY ?? ''));

/** DISCORD_MODERATORS read: each Discord id's game handle, lowercased. @param {any} env @returns {Map<string, string>} */
export function discordModerators(env) {
  const out = new Map();
  for (const pair of String(env?.DISCORD_MODERATORS ?? '').split(',')) {
    const [id, handle] = pair.split(':').map((s) => s?.trim() ?? '');
    if (SNOWFLAKE_RE.test(id) && handle) out.set(id, handle.toLowerCase());
  }
  return out;
}

const hexBytes = (h) => new Uint8Array(String(h).match(/../g)?.map((b) => parseInt(b, 16)) ?? []);
/** @type {{ raw: string, key: CryptoKey|null }} */
let heldKey = { raw: '', key: null };

/**
 * THE SIGNATURE, over the exact bytes Discord sent: Ed25519 over the timestamp and the body, with the application's
 * public key, the timestamp no older than DISCORD_SKEW_S. Never throws.
 * @param {any} env @param {Uint8Array} bytes @param {unknown} sigHex @param {unknown} stamp @param {{ subtle: SubtleCrypto, nowS: number }} io
 */
export async function discordSigned(env, bytes, sigHex, stamp, { subtle, nowS }) {
  if (!interactionsOn(env) || typeof sigHex !== 'string' || !/^[0-9a-f]{128}$/i.test(sigHex) || typeof stamp !== 'string' || !/^\d{1,12}$/.test(stamp)) return false;
  if (Math.abs(nowS - Number(stamp)) > DISCORD_SKEW_S) return false;
  if (heldKey.raw !== env.DISCORD_PUBLIC_KEY) heldKey = { raw: env.DISCORD_PUBLIC_KEY, key: await importPublicKey(hexBytes(env.DISCORD_PUBLIC_KEY), { subtle }) };
  if (!heldKey.key) return false;
  const head = new TextEncoder().encode(stamp);
  const signed = new Uint8Array(head.length + bytes.length);
  signed.set(head, 0);
  signed.set(bytes, head.length);
  try { return await subtle.verify({ name: 'Ed25519' }, heldKey.key, hexBytes(sigHex), signed); } catch { return false; }
}

/** A player's words as a card draws them: one line, no code fence to break out of. @param {unknown} s */
const plain = (s) => String(s ?? '').replace(/```/g, "'''").replace(/\s+/g, ' ').trim();
/** A time on the card: Discord's own, in each reader's zone. @param {number} s */
const when = (s) => `<t:${Math.floor(s)}:f>`;
/** A length of mute in words. @param {number} m */
export const minutesWord = (m) => (m % 1440 === 0 ? `${m / 1440} day${m === 1440 ? '' : 's'}` : m % 60 === 0 ? `${m / 60} hour${m === 60 ? '' : 's'}` : `${m} min`);
/** A ban's end in words. @param {number} until */
const banWord = (until) => (until >= BAN_FOREVER ? 'for good' : `until ${when(until)}`);

/**
 * A CASE'S CARD - pure, from what the clock read: the case's row, its target's name, its lines (oldest first), its
 * reports' reasons, the target's strikes, and the reviewer's mode. Buttons while it is open; the resolution once not.
 * @param {{ c: any, name: string, lines: any[], reasons: string[], strikes: number }} o
 */
export function caseCard({ c, name, lines, reasons, strikes }) {
  const shown = [];
  let size = 0;
  for (const l of [...lines].reverse().slice(0, CARD_LINES_MAX)) {
    const row = `${l.sub === c.target ? '>' : ' '} [${l.tab}] ${plain(l.name)}: ${plain(l.text)}`;
    if (size + row.length + 1 > CARD_TEXT_MAX) break;
    shown.unshift(row);
    size += row.length + 1;
  }
  const fields = [
    { name: 'Player', value: `${plain(name) || '?'} (\`${c.target}\`)`, inline: true },
    { name: 'Reports', value: c.reports ? `${c.reports} (${c.credible} counted)` : 'none - the reviewer opened it', inline: true },
    { name: 'Strikes (90 days)', value: `${strikes} - next: ${strikes >= LADDER_BAN_AT ? 'a ban' : minutesWord(ladderMinutes(strikes))}`, inline: true },
  ];
  if (reasons.length) fields.push({ name: 'Reported for', value: [...new Set(reasons)].map(reportReasonLabel).join(', '), inline: false });
  if (c.ai_state === 'done' && c.ai_category) {
    const shadow = c.ai_mode === 'shadow' ? 'SHADOW - nothing was done on it. ' : '';
    fields.push({ name: 'Reviewer', value: `${shadow}${c.ai_category}, severity ${c.ai_severity}, ${Math.round(Number(c.ai_confidence) * 100)}% sure: ${plain(c.ai_reason)}`.slice(0, 1024), inline: false });
  } else if (c.ai_state === 'done') fields.push({ name: 'Reviewer', value: `${c.ai_mode === 'shadow' ? 'SHADOW - ' : ''}found nothing against the code.`, inline: false });
  else if (c.ai_state === 'failed') fields.push({ name: 'Reviewer', value: 'could not read this case.', inline: false });
  if (c.auto) fields.push({ name: 'Done automatically', value: c.auto === 'reports' ? `Muted 30 min - ${c.credible} reports counted.` : 'Muted 30 min - the reviewer\'s verdict.', inline: false });
  const color = c.status !== 'open' ? 0x808080 : (c.ai_severity ?? 0) >= 3 ? 0xd03030 : (c.ai_severity ?? 0) === 2 ? 0xe08020 : 0x3070d0;
  const embed = {
    title: `Case ${c.id}${c.source === 'review' ? ' (opened by the reviewer)' : ''}`,
    description: shown.length ? `\`\`\`\n${shown.join('\n')}\n\`\`\`` : 'No lines kept.',
    color,
    fields,
    ...(c.status !== 'open' ? { footer: { text: `${c.status === 'dismissed' ? 'Dismissed' : 'Actioned'} by ${plain(c.resolved_by) || '?'}: ${plain(c.resolution)}` } } : {}),
  };
  const components = c.status === 'open'
    ? [{ type: 1, components: Object.entries(CARD_ACTS).map(([k, a]) => ({ type: 2, style: k === 'dis' ? 2 : k === 'b30' ? 4 : 1, label: a.label, custom_id: `safe:${k}:${c.id}` })) }]
    : [];
  return { embeds: [embed], components, allowed_mentions: { parse: [] } };
}

/**
 * POST OR EDIT a card in the moderators' channel - answers the message's id, or null. Never throws.
 * @param {any} env @param {(url: string, init: any) => Promise<Response>} fetchFn @param {any} card @param {string|null} [messageId]
 */
export async function sendCard(env, fetchFn, card, messageId = null) {
  if (!discordOn(env)) return null;
  const base = `${DISCORD_API}/channels/${env.DISCORD_MOD_CHANNEL}/messages`;
  try {
    const res = await fetchFn(messageId ? `${base}/${messageId}` : base, {
      method: messageId ? 'PATCH' : 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bot ${env.DISCORD_BOT_TOKEN}` },
      body: JSON.stringify(card),
      signal: AbortSignal.timeout(DISCORD_POST_MS),
    });
    if (!res.ok) { console.warn('[discord] the API said', res.status); return null; }
    const msg = await res.json();
    return typeof msg?.id === 'string' ? msg.id : messageId;
  } catch (e) { console.warn('[discord] the API', /** @type {any} */ (e)?.message ?? e); return null; }
}

/** Everything a card is drawn from, read for case `id`. @param {any} db @param {string} id @param {number} nowS */
export async function cardOf(db, id, nowS) {
  const c = await db.prepare('SELECT * FROM mod_cases WHERE id = ?1').bind(id).first();
  if (!c) return null;
  const target = await db.prepare('SELECT handle, guest_name FROM players WHERE id = ?1').bind(c.target).first();
  const lines = (await db.prepare('SELECT at, sub, name, tab, text FROM mod_case_lines WHERE case_id = ?1 ORDER BY at, sub').bind(id).all())?.results ?? [];
  const reasons = ((await db.prepare('SELECT reason FROM mod_reports WHERE case_id = ?1 ORDER BY at').bind(id).all())?.results ?? []).map((r) => String(r.reason));
  return caseCard({ c, name: target ? displayName(target) : '?', lines, reasons, strikes: await strikesOf(db, c.target, nowS) });
}

/** An ephemeral answer - the moderator who asked reads it, nobody else. @param {string} text */
const say = (text) => ({ type: 4, data: { content: text.slice(0, 1900), flags: 64, allowed_mentions: { parse: [] } } });

/** The moderator's account for a Discord user, or null. @param {any} db @param {any} env @param {unknown} discordId */
async function actorOf(db, env, discordId) {
  const handle = discordModerators(env).get(String(discordId ?? ''));
  if (!handle) return null;
  const row = await db.prepare('SELECT * FROM players WHERE handle_lc = ?1').bind(handle).first();
  return row && canModerate(row, env) ? row : null;
}

/**
 * A MUTE, a moderator's from Discord: MOD1's muteAccount (the authority and the bounds), its act in the record, and the
 * order pushed to the relay's door. Answers the mute's end or `{ error }`.
 */
async function muteFrom(ctx, env, actor, row, minutes, reason, caseId, fetchFn) {
  if (!muteMinutesOk(minutes)) return { error: 'bad-minutes' };
  const r = await muteAccount(ctx, actor, env, { target: row.id, minutes });
  if (r.error) return r;
  await actionStatement(ctx.db, { target: row.id, kind: minutes ? 'mute' : 'unmute', until: r.until || null, reason: reasonOf(reason), actor: actor.id, actorName: `${displayName(actor)} (Discord)`, caseId, at: ctx.nowS }).run();
  await pushLaw(env, fetchFn, await lawOrder(env, ctx.subtle, ctx.nowS, { s: row.id, mu: r.until }));
  return r;
}

/** A BAN (or an unban), a moderator's from Discord - sanctions.js, then the order pushed. */
async function banFrom(ctx, env, actor, row, days, reason, caseId, fetchFn) {
  const r = days === null
    ? await unbanAccount(ctx, actor, env, { target: row.id, actorName: `${displayName(actor)} (Discord)` })
    : await banAccount(ctx, actor, env, { target: row.id, days, reason, caseId, actorName: `${displayName(actor)} (Discord)` });
  if (r.error) return r;
  await pushLaw(env, fetchFn, await lawOrder(env, ctx.subtle, ctx.nowS, { s: row.id, bn: r.until }));
  return r;
}

/** The words a refusal says to a moderator in Discord. */
const REFUSED = Object.freeze({
  'not-moderator': 'You are not a moderator in the game.', protected: 'Moderators cannot be muted or banned.', 'no-player': 'Nobody has that name.',
  ambiguous: 'More than one guest has that name - use the account id.', 'bad-minutes': 'A mute is 1 to 10080 minutes.', 'bad-days': 'A ban is 0 (for good) to 365 days.',
});
const refusedText = (e) => REFUSED[/** @type {keyof typeof REFUSED} */ (e)] ?? `Refused: ${e}.`;

/** A press of a card's button: the act, the case resolved, the card redrawn in place. */
async function onPress(ctx, env, body, actor, fetchFn) {
  const m = /^safe:(m30|m1d|m7d|b30|dis):([0-9a-f]{16})$/.exec(String(body?.data?.custom_id ?? ''));
  if (!m) return say('That button is not one of the safety cards\'.');
  const [, act, caseId] = m;
  const c = await ctx.db.prepare('SELECT * FROM mod_cases WHERE id = ?1').bind(caseId).first();
  if (!c) return say('That case is gone.');
  if (c.status !== 'open') return { type: 7, data: await cardOf(ctx.db, caseId, ctx.nowS) };
  const row = await ctx.db.prepare('SELECT * FROM players WHERE id = ?1').bind(c.target).first();
  if (!row) return say('That account is gone.');
  const a = CARD_ACTS[/** @type {keyof typeof CARD_ACTS} */ (act)];
  let resolution, status = 'actioned';
  if ('minutes' in a) {
    const r = await muteFrom(ctx, env, actor, row, a.minutes, `case ${caseId}`, caseId, fetchFn);
    if ('error' in r) return say(refusedText(r.error));
    resolution = `muted ${minutesWord(a.minutes)}`;
  } else if ('days' in a) {
    const r = await banFrom(ctx, env, actor, row, a.days, `case ${caseId}`, caseId, fetchFn);
    if ('error' in r) return say(refusedText(r.error));
    resolution = `banned ${a.days} days`;
  } else {
    await actionStatement(ctx.db, { target: row.id, kind: 'dismiss', actor: actor.id, actorName: `${displayName(actor)} (Discord)`, caseId, at: ctx.nowS }).run();
    resolution = 'no action';
    status = 'dismissed';
  }
  await ctx.db.prepare("UPDATE mod_cases SET status = ?2, resolved_by = ?3, resolved_at = ?4, resolution = ?5, updated_at = ?4, discord_state = CASE WHEN discord_state = 'off' THEN 'off' ELSE 'posted' END WHERE id = ?1")
    .bind(caseId, status, displayName(actor), ctx.nowS, resolution).run();
  return { type: 7, data: await cardOf(ctx.db, caseId, ctx.nowS) };
}

/** An option of a /mod subcommand, by name. */
const optionOf = (sub, name) => (Array.isArray(sub?.options) ? sub.options.find((o) => o?.name === name)?.value : undefined);

/** A /mod command: lookup, mute, unmute, ban, unban - by a player's name or account id. */
async function onCommand(ctx, env, body, actor, fetchFn) {
  const sub = Array.isArray(body?.data?.options) ? body.data.options[0] : null;
  const who = String(optionOf(sub, 'player') ?? '').trim();
  // a name first (a handle, a guest's name), then an account id - a moderator pastes either from a card
  let row = await findAccount(ctx.db, { name: who });
  if ('error' in row && row.error === 'no-player') row = await findAccount(ctx.db, { target: who });
  if ('error' in row) return say(refusedText(row.error));
  const name = displayName(row);
  const reason = optionOf(sub, 'reason');
  switch (sub?.name) {
    case 'lookup': {
      const r = await strikesLook(ctx, actor, env, { target: row.id });
      if ('error' in r) return say(refusedText(r.error));
      const now = [r.bannedUntil ? `banned ${banWord(r.bannedUntil)}${r.banReason ? ` (${plain(r.banReason)})` : ''}` : '', r.mutedUntil ? `muted until ${when(r.mutedUntil)}` : ''].filter(Boolean).join('; ') || 'in good standing';
      const acts = r.history.slice(0, 10).map((h) => `${when(h.at)} ${h.kind}${h.until ? ` until ${h.until >= BAN_FOREVER ? 'forever' : when(h.until)}` : ''} by ${plain(h.by) || '?'}${h.reason ? ` - ${plain(h.reason)}` : ''}`);
      return say([`**${plain(name)}** (\`${row.id}\`): ${now}. ${r.strikes} strike${r.strikes === 1 ? '' : 's'} in 90 days; next: ${r.next === 'ban' ? 'a ban' : minutesWord(Number(r.next))}.`, ...acts].join('\n'));
    }
    case 'mute': case 'unmute': {
      const minutes = sub.name === 'unmute' ? 0 : Number(optionOf(sub, 'minutes') ?? ladderMinutes(await strikesOf(ctx.db, row.id, ctx.nowS)));
      const r = await muteFrom(ctx, env, actor, row, minutes, reason, null, fetchFn);
      if ('error' in r) return say(refusedText(r.error));
      return say(minutes ? `${plain(name)} is muted for ${minutesWord(minutes)}.` : `${plain(name)} can chat again.`);
    }
    case 'ban': case 'unban': {
      const days = sub.name === 'unban' ? null : Number(optionOf(sub, 'days') ?? 30);
      const r = await banFrom(ctx, env, actor, row, days, reason, null, fetchFn);
      if ('error' in r) return say(refusedText(r.error));
      return say(days === null ? `${plain(name)} is unbanned.` : `${plain(name)} is banned ${banWord(r.until)}.`);
    }
    default: return say('Use /mod lookup, mute, unmute, ban or unban.');
  }
}

/**
 * AN INTERACTION, signature already checked: a ping answered, a press or a command done by the moderator Discord says
 * pressed it - who must be a moderator in the game.
 * @param {{ db: any, nowS: number, subtle: SubtleCrypto, rand: (b: Uint8Array) => void }} ctx @param {any} env @param {any} body
 * @param {{ fetchFn?: (url: string, init: any) => Promise<Response> }} [io]
 */
export async function discordInteraction(ctx, env, body, { fetchFn = (u, i) => globalThis.fetch(u, i) } = {}) {
  if (body?.type === 1) return { type: 1 };
  const actor = await actorOf(ctx.db, env, body?.member?.user?.id ?? body?.user?.id);
  if (!actor) return say('Only the game\'s moderators can do that - ask a developer to add your Discord id to DISCORD_MODERATORS.');
  if (body?.type === 3) return onPress(ctx, env, body, actor, fetchFn);
  if (body?.type === 2 && body?.data?.name === 'mod') return onCommand(ctx, env, body, actor, fetchFn);
  return say('Nothing to do.');
}
