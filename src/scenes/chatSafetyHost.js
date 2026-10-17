// @ts-check
// ═══════════════════════════════════════════════════════════════════
// SAFE1-SAFE7 (2026-10-17, Mac: "Lets do every single thing here. I want a full fledged future proof system"; the chat
// safety plan, bible/11-Multiplayer/Chat-Safety-Arc.md): THE CHAT'S SAFETY, AS THE PLAYER MEETS IT - a module the
// streaming host wires (scenes/world.js bootWorld; fishHost.js is the shape - HOST-SPLIT: the host does not grow).
//
//   - SAFE1 BLOCK: the account's block list, read from the service at the chat's start and kept there; a blocked
//     account's lines never reach the log (ChatLog.hears - so no tab, peek, bubble or search shows them), its lines
//     already heard are taken back (ChatLog.forgetSpeaker), and its friend requests, party invites and notes never land
//     (SocialState.hears). /block <name>, /unblock <name>, /blocked, and Block on a line's own menu.
//   - SAFE3 REPORT: a line's own menu (the speaker's name pressed - ui/chatPanel.js lineActions) reports that line and
//     the lines before it; /report <name> [reason] reports everything that player said that this page heard. Only lines
//     the relay stamped can be carried (ChatLog.reportLines), and the service checks every stamp. A report that mutes
//     (three credible reporters) hands back the order, carried to every room this page holds (MOD1's carrier).
//   - SAFE4 THE RELAY'S WORD: a mute or ban the service pushed to the hub (`law`) is carried on to every room; a ban
//     (`banned`) is said, and the page leaves every room - the service will mint it no token to come back on. A
//     moderator's /ban, /unban and /strikes ask the service, which decides; a ban's order is carried as a mute's is.
//   - SAFE6: a new voice's line refused for its pace (`slowed`) is said, once in a while, never on every press.
//   - SAFE7 THE CODE OF CONDUCT: before the first line this account sends (and again when the code changes - the
//     mint's `conduct`), the card (ui/conductCard.js); the line stays in the field until the player agrees and sends it.
//
// Not a DFU member: Daggerfall Unity has no chat. Ledger A row (CHAT SAFETY).
import { parseSafetyCommand, reportReasonLabel, orderKindOf, REPORT_REASONS, REPORT_LINES_MAX, BAN_FOREVER } from '../net/safety/safetyLaw.js';
import { CONDUCT_VERSION } from '../net/safety/conduct.js';
import { resolveTarget } from '../net/moderation.js';
import { parseChatLine, expandShortcodes } from '../net/chatCommands.js';
import { safetyBlocks, safetyBlock, safetyUnblock, safetyReport, safetyConduct, modBan, modUnban, modStrikes, accountRefusalText, storedSession, serviceBase } from '../net/accountClient.js';
import { appStorage } from '../systems/appStorage.js';
import { createConductCard } from '../ui/conductCard.js';
import { t } from '../systems/textManager.js';
import { isTouchDevice } from '../ui/touch/touch.js';

/** The kinds of chat line that reach other players - what the code of conduct gates (net/chatCommands.js parseChatLine). */
const SAID_KINDS = Object.freeze(['say', 'me', 'rp', 'channel', 'emote']);
/** How often a new voice is told it is being slowed, ms - one line, not one a press. */
const SLOWED_SAY_MS = 15_000;

/** A time a player reads: the date, or "for good". @param {number} s */
const untilWords = (s) => (s >= BAN_FOREVER ? t('net.safety.forGood', 'for good') : t('net.safety.until', 'until {when}', { when: new Date(s * 1000).toLocaleString() }));

/**
 * @param {object} o
 * @param {() => any} o.log  the chat log (net/chat.js ChatLog), or null before the chat starts
 * @param {() => any[]} o.links  every room this page holds - the chat's links and the presence session
 * @param {() => any} [o.social]  the hub's social picture (net/social.js SocialState), or null
 * @param {boolean} [o.touch]
 * @param {Document} [o.doc]
 * @param {(u: string, i: any) => Promise<Response>} [o.fetch]
 * @param {any} [o.storage]  the device's storage (systems/appStorage.js)
 */
export function createChatSafetyHost({ log, links, social = () => null, touch = isTouchDevice(), doc = globalThis.document, fetch = (u, i) => globalThis.fetch(u, i), storage = null }) {
  /** @type {Map<string, string>} sub -> the name it was blocked under */
  const blocked = new Map();
  /** Whether this account has agreed to the code as it stands - null until the mint says (an older service never does: heard as yes). */
  let agreed = null;
  let card = null;
  let slowedSaid = 0;
  const store = () => storage ?? appStorage();
  const io = () => { const s = storedSession(store()); return s ? { fetch, base: serviceBase(store()), secret: s.secret } : null; };
  const say = (tabId, text) => log()?.push(tabId ?? log()?.active, { text, system: true });
  const sayActive = (text) => say(log()?.active, text);
  const hears = (sub) => !blocked.has(sub);
  /** Carry a signed order to every room this page holds - its kind's door (MOD1's carrier). */
  const carry = (order) => {
    const kind = orderKindOf(order);
    if (!kind) return 0;
    let n = 0;
    for (const l of links()) if (kind === 'ban' ? l?.sendBanOrder?.(order) : l?.sendMuteOrder?.(order)) n++;
    return n;
  };
  const adoptList = (list) => {
    const was = new Set(blocked.keys());
    blocked.clear();
    for (const b of Array.isArray(list) ? list : []) if (typeof b?.sub === 'string') blocked.set(b.sub, String(b.name ?? ''));
    for (const sub of blocked.keys()) if (!was.has(sub)) log()?.forgetSpeaker?.(sub);
  };
  /** A name to the ONE account it names: the players this page holds (MOD1's resolveTarget), else the lines it heard. */
  const accountOf = (name) => {
    const peers = new Map();
    for (const l of links()) for (const [id, p] of l?.peers ?? []) if (!peers.has(id) || (!peers.get(id).sub && p.sub)) peers.set(id, p);
    const who = resolveTarget({ peers }, name);
    if (!('error' in who)) return who;
    const want = String(name).trim().toLowerCase();
    const heard = new Map();
    for (const tab of log()?.tabs ?? []) for (const l of tab.messages) if (l.sub && !l.mine && String(l.name).toLowerCase() === want) heard.set(l.sub, l.name);
    if (heard.size === 1) { const [[sub, shown]] = [...heard]; return { sub, name: shown }; }
    return who;
  };

  const block = async (sub, name) => {
    const a = io();
    if (!a) { sayActive(accountRefusalText('auth')); return; }
    const r = await safetyBlock(a, sub);
    if (!r.ok) { sayActive(accountRefusalText(r.error)); return; }
    adoptList(r.data?.blocks);
    sayActive(t('net.safety.blocked', 'You blocked {name}. You will not see their lines, invites or requests. /unblock {name} undoes it.', { name }));
  };
  const unblock = async (sub, name) => {
    const a = io();
    if (!a) { sayActive(accountRefusalText('auth')); return; }
    const r = await safetyUnblock(a, sub);
    if (!r.ok) { sayActive(accountRefusalText(r.error)); return; }
    adoptList(r.data?.blocks);
    sayActive(t('net.safety.unblocked', 'You unblocked {name}.', { name }));
  };
  const report = async (sub, name, reason, lines) => {
    if (!lines.length) { sayActive(accountRefusalText('report-no-line')); return; }
    const a = io();
    if (!a) { sayActive(accountRefusalText('auth')); return; }
    const r = await safetyReport(a, { target: sub, reason, lines });
    if (!r.ok) { sayActive(accountRefusalText(r.error)); return; }
    if (r.data?.order) carry(r.data.order);
    sayActive(r.data?.repeat
      ? t('net.safety.reportedAgain', 'You already reported {name}; their newest lines were added for the moderators.', { name })
      : t('net.safety.reported', 'Reported {name}. The moderators will see it. /block {name} hides them from you now.', { name }));
  };

  /** Each link's word on my own chat (SAFE4, SAFE6). */
  const wire = (link) => {
    if (!link) return;
    link.onLaw = ({ order }) => carry(order);
    link.onBanned = ({ until }) => {
      if (!until) { sayActive(t('net.safety.unbannedSelf', 'Your ban was lifted.')); return; }
      sayActive(t('net.safety.bannedSelf', 'This account is banned {until}. You have left the online world.', { until: untilWords(until) }));
      for (const l of links()) l?.leave?.();
    };
    link.onSlowed = ({ ms }) => {
      const now = Date.now();
      if (now - slowedSaid < SLOWED_SAY_MS) return;
      slowedSaid = now;
      sayActive(t('net.safety.slowed', 'New players can send one line every few seconds in public channels. Try again in {s} s.', { s: Math.ceil(ms / 1000) }));
    };
  };

  const host = {
    hears,
    /** The chat started: the log hears through the block list, every room's word is wired, and the list is read. */
    async start() {
      const l = log();
      if (l) l.hears = hears;
      for (const link of links()) wire(link);
      const a = io();
      if (!a) return;
      const r = await safetyBlocks(a);
      if (r.ok) adoptList(r.data?.blocks);
    },
    /** The social picture started: it hears through the block list too. */
    adoptSocial() { const s = social(); if (s) s.hears = hears; },
    /** The mint's word: whether the code as it stands is agreed (`conduct`; absent from an older service - heard as yes). */
    adopt(issued) { if (issued && typeof issued.conduct === 'boolean') agreed = issued.conduct; },
    /** A spoken line's menu: Report it (a reason each) and Block or Unblock its speaker. */
    lineActions(line) {
      if (!line?.sub || line.mine || line.system) return [];
      const name = String(line.name ?? '');
      const rows = REPORT_REASONS.map((reason) => ({
        label: t('net.safety.reportAs', 'Report: {reason}', { reason: reportReasonLabel(reason) }),
        run: () => { void report(line.sub, name, reason, log()?.reportLines?.(line.sub, { seq: line.seq }) ?? []); },
      }));
      rows.push(blocked.has(line.sub)
        ? { label: t('net.safety.unblockLabel', 'Unblock'), run: () => { void unblock(line.sub, name); } }
        : { label: t('net.safety.blockLabel', 'Block'), run: () => { void block(line.sub, name); } });
      return rows;
    },
    /**
     * A line the player sent - answered as the chat panel's onSend is: true, a safety command done (the field clears);
     * false, the line held for the code of conduct (it stays in the field); null, not this module's.
     * @param {string} tabId @param {string} text
     */
    onSend(tabId, text) {
      const cmd = parseSafetyCommand(text);
      if (cmd) { void host.command(tabId, cmd); return true; }
      if (agreed !== false) return null;
      const said = parseChatLine(expandShortcodes(text));
      if (!SAID_KINDS.includes(said.kind)) return null;
      if (!card) card = createConductCard({ agree: () => { void host.agree(tabId); }, later: () => {}, touch, doc });
      card.show();
      return false;
    },
    /** The code agreed: kept on the account, and the player told the line can go. */
    async agree(tabId) {
      const a = io();
      if (!a) { say(tabId, accountRefusalText('auth')); return; }
      const r = await safetyConduct(a, CONDUCT_VERSION);
      if (!r.ok) { say(tabId, accountRefusalText(r.error)); return; }
      agreed = true;
      say(tabId, t('net.safety.agreed', 'Thank you. Press Enter to send your line.'));
    },
    /** One parsed safety command, run. @param {string} tabId @param {any} cmd */
    async command(tabId, cmd) {
      if ('error' in cmd) { say(tabId, cmd.error); return; }
      if (cmd.op === 'conduct') {
        if (!card) card = createConductCard({ agree: () => { void host.agree(tabId); }, touch, doc });
        card.show();
        return;
      }
      if (cmd.op === 'blocked') {
        const names = [...blocked.values()].filter(Boolean);
        say(tabId, names.length ? t('net.safety.blockedList', 'Blocked: {names}', { names: names.join(', ') }) : t('net.safety.blockedNone', 'You have blocked nobody.'));
        return;
      }
      if (cmd.op === 'unblock') {
        const want = cmd.name.trim().toLowerCase();
        const held = [...blocked].find(([, n]) => n.toLowerCase() === want);
        const who = held ? { sub: held[0], name: held[1] } : accountOf(cmd.name);
        if ('error' in who) { say(tabId, who.error); return; }
        await unblock(who.sub, who.name);
        return;
      }
      if (cmd.op === 'block' || cmd.op === 'report') {
        const who = accountOf(cmd.name);
        if ('error' in who) { say(tabId, who.error); return; }
        if (cmd.op === 'block') await block(who.sub, who.name);
        else await report(who.sub, who.name, cmd.reason, log()?.reportLines?.(who.sub, { max: REPORT_LINES_MAX }) ?? []);
        return;
      }
      // a moderator's: the service decides, by the account this page can name or else by the name itself
      const a = io();
      if (!a) { say(tabId, accountRefusalText('auth')); return; }
      const named = accountOf(cmd.name);
      const target = 'error' in named ? { name: cmd.name } : { target: named.sub };
      const r = cmd.op === 'ban' ? await modBan(a, target, cmd.days) : cmd.op === 'unban' ? await modUnban(a, target) : await modStrikes(a, target);
      if (!r.ok) { say(tabId, accountRefusalText(r.error)); return; }
      const d = r.data ?? {};
      if (d.order) carry(d.order);
      if (cmd.op === 'ban') say(tabId, t('net.safety.didBan', '{name} is banned {until}.', { name: d.name, until: untilWords(d.until) }));
      else if (cmd.op === 'unban') say(tabId, t('net.safety.didUnban', '{name} is unbanned.', { name: d.name }));
      else {
        say(tabId, t('net.safety.strikes', '{name}: {strikes, plural, one {# strike} other {# strikes}} in 90 days. Next: {next}.', {
          name: d.name, strikes: d.strikes, next: d.next === 'ban' ? t('net.safety.nextBan', 'a ban') : t('net.safety.nextMute', 'a {minutes}-minute mute', { minutes: d.next }),
        }));
        for (const h of (d.history ?? []).slice(0, 5)) say(tabId, `- ${new Date(h.at * 1000).toLocaleDateString()} ${h.kind}${h.by ? ` (${h.by})` : ''}${h.reason ? `: ${h.reason}` : ''}`);
      }
    },
  };
  return host;
}
