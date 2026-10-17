// @ts-check
// PRIVATE-REPORT (2026-10-17, Mac: "Can we add a private disclosure method for exploits/bugs with the client"): A
// PLAYER'S PRIVATE REPORT, AS THIS CLIENT SEES IT - the desk the mailbox window's report form and the readers' inbox draw
// (ui/enhanced/enhancedReport.js), kept on the host's PostBox (net/serverPost.js) for the sitting, so a report half
// written survives the pause face being rebuilt, closed or opened again.
//
// A SEND IS ONE REPORT, however often it is asked. Its `rid` is minted once a draft and kept until the service answers it
// - a lost answer (`offline`, `server`) asked again is answered the report it made (server-account/src/reports.js
// sendReport's `repeat`) - and a draft changed after a failure is a new send, never the old one's answer.
import { call, forgetSession } from './accountClient.js';
import { t } from '../systems/textManager.js';
import { BUILD_TAG, UPDATE } from '../buildTag.js';
import { reportWordsOf, reportContextOf, reportHead, reportInboxHead, reportWhole } from './reportLaw.js';

/** A send: `{ ok, id, sentAt }` or `{ ok, repeat, id, sentAt }`. */
export const reportSendCall = (io, o) => call(io, '/v1/report/send', o);
/** My own: `{ reports: [head...], max }`. */
export const reportMineCall = (io) => call(io, '/v1/report/mine', {});
/** A reader's inbox: `{ which, reports: [head + from...], unread, open, max }`. */
export const reportInboxCall = (io, which) => call(io, '/v1/report/inbox', { which });
/** A reader's one report, opened: `{ report: { ...head, from, body, context, closedAt } }`. */
export const reportReadCall = (io, id) => call(io, '/v1/report/read', { id });
/** A reader's close (or open again): `{ ok, id, state }`. */
export const reportCloseCall = (io, id, state) => call(io, '/v1/report/close', { id, state });

/** A send's own id - the notice board's shape (net/noticeBook.js mintNoticeRid). */
export function mintReportRid(rand = (b) => globalThis.crypto.getRandomValues(b)) {
  const b = new Uint8Array(15);
  rand(b);
  return `r${[...b].map((x) => (x % 36).toString(36)).join('')}`;
}

/** WHAT RIDES WITH A REPORT, and all of it: the update and the build the pause window prints (REL8, buildTag.js), and
 *  whether this is the desktop app (app/preload.cjs's bridge) or a browser. The form says so before it is sent. */
export function reportContext({ update = UPDATE, build = BUILD_TAG, desktop = !!(/** @type {any} */ (globalThis).daggerShell) } = {}) {
  return reportContextOf({ update, build, app: desktop ? 'desktop' : 'browser' });
}

/** The word a report's state says to its reporter and to a reader, in the player's language, read when it is said. */
const STATE_WORDS = Object.freeze({
  open: () => t('report.state.open', 'Open'),
  fixed: () => t('report.state.fixed', 'Fixed'),
  wontfix: () => t('report.state.wontfix', 'Won\'t fix'),
  duplicate: () => t('report.state.duplicate', 'Duplicate'),
});
export const reportStateText = (/** @type {string} */ state) => STATE_WORDS[state]?.() ?? String(state);
/** The word a report's kind says in a list. */
const KIND_WORDS = Object.freeze({
  exploit: () => t('report.kindWord.exploit', 'Exploit'),
  bug: () => t('report.kindWord.bug', 'Bug'),
  security: () => t('report.kindWord.security', 'Security'),
});
export const reportKindText = (/** @type {string} */ kind) => KIND_WORDS[kind]?.() ?? String(kind);

/**
 * THE DESK. `version` moves on every change, so a window repaints on a number. `mine` and `inbox` are null until looked at,
 * then the last good answer (a failed look keeps it and says `error`).
 */
export class ReportDesk {
  /**
   * @param {object} o
   * @param {() => ({ fetch: any, base?: string, secret: string, storage?: any } | null)} o.ioOf  the service, now
   * @param {() => string} [o.rid]
   * @param {() => any} [o.context]
   */
  constructor({ ioOf, rid = () => mintReportRid(), context = () => reportContext() }) {
    this.ioOf = ioOf;
    this.rid = rid;
    this.context = context;
    /** What the form holds. */
    this.draft = { kind: /** @type {string|null} */ (null), subject: '', body: '' };
    this.sending = false;
    /** @type {any[]|null} */ this.mine = null;
    /** @type {string|null} */ this.mineError = null;
    /** @type {{ open: any[]|null, closed: any[]|null }} */ this.inbox = { open: null, closed: null };
    /** @type {string|null} */ this.inboxError = null;
    this.counts = { unread: 0, open: 0 };
    /** @type {Map<string, any>} */ this.opened = new Map();
    this.version = 0;
    /** @type {string|null} the draft's send id, kept across a failed send */ this._rid = null;
    /** @type {Promise<any>|null} */ this._mineLook = null;
  }

  _changed() { this.version++; }

  /** The service, or null - and a session the service no longer knows is forgotten (the post box's own rule). */
  _io() {
    const io = this.ioOf?.() ?? null;
    return io?.secret ? io : null;
  }
  _refused(io, error) { if (error === 'auth') forgetSession(io?.storage); }

  /** THE FORM CHANGED: what it holds, and - where its words moved - a new send (the last one's id is for its own words). */
  setDraft(/** @type {{ kind?: string|null, subject?: string, body?: string }} */ patch) {
    const next = { ...this.draft, ...patch };
    if (next.kind !== this.draft.kind || next.subject !== this.draft.subject || next.body !== this.draft.body) this._rid = null;
    this.draft = next;
  }

  /**
   * SEND THE DRAFT. Answers `{ ok, id, repeat? }` - and the draft is cleared and my list looked at again - or
   * `{ ok: false, error }`: the law's word for words the service would refuse, never asked; `signed-out`; `busy`; or
   * the service's.
   */
  async send() {
    const words = reportWordsOf(this.draft);
    if ('error' in words) return { ok: false, error: words.error };
    const io = this._io();
    if (!io) return { ok: false, error: 'signed-out' };
    if (this.sending) return { ok: false, error: 'busy' };
    this._rid ??= this.rid();
    this.sending = true; this._changed();
    try {
      const r = await reportSendCall(io, { ...words, context: this.context(), rid: this._rid });
      if (!r.ok) { this._refused(io, r.error); return { ok: false, error: r.error ?? 'server' }; }
      this._rid = null;
      this.draft = { kind: null, subject: '', body: '' };
      this.loadMine().catch(() => {});
      return { ok: true, id: r.data?.id, repeat: r.data?.repeat === true };
    } finally {
      this.sending = false; this._changed();
    }
  }

  /** LOOK AT MY OWN - one look at a time. */
  loadMine() {
    if (this._mineLook) return this._mineLook;
    this._mineLook = this._loadMine().finally(() => { this._mineLook = null; });
    return this._mineLook;
  }
  async _loadMine() {
    const io = this._io();
    if (!io) { this.mine = null; this.mineError = 'signed-out'; this._changed(); return { ok: false, error: 'signed-out' }; }
    const r = await reportMineCall(io);
    if (!r.ok) { this._refused(io, r.error); this.mineError = r.error ?? 'server'; this._changed(); return { ok: false, error: this.mineError }; }
    this.mine = (Array.isArray(r.data?.reports) ? r.data.reports : []).map(reportHead).filter((h) => h !== null);
    this.mineError = null;
    this._changed();
    return { ok: true };
  }

  /** A READER'S INBOX, `which` 'open' or 'closed'. */
  async loadInbox(which = 'open') {
    const io = this._io();
    if (!io) { this.inboxError = 'signed-out'; this._changed(); return { ok: false, error: 'signed-out' }; }
    const r = await reportInboxCall(io, which);
    if (!r.ok) { this._refused(io, r.error); this.inboxError = r.error ?? 'server'; this._changed(); return { ok: false, error: this.inboxError }; }
    const list = (Array.isArray(r.data?.reports) ? r.data.reports : []).map(reportInboxHead).filter((h) => h !== null);
    this.inbox[which === 'closed' ? 'closed' : 'open'] = list;
    if (Number.isSafeInteger(r.data?.unread) && Number.isSafeInteger(r.data?.open)) this.counts = { unread: r.data.unread, open: r.data.open };
    this.inboxError = null;
    this._changed();
    return { ok: true };
  }

  /** OPEN ONE, a reader's: from this sitting's copy, or the service - which marks it read. */
  async open(/** @type {string} */ id) {
    const kept = this.opened.get(id);
    if (kept) return { ok: true, report: kept };
    const io = this._io();
    if (!io) return { ok: false, error: 'signed-out' };
    const r = await reportReadCall(io, id);
    if (!r.ok) { this._refused(io, r.error); return { ok: false, error: r.error ?? 'server' }; }
    const whole = reportWhole(r.data?.report);
    if (!whole || whole.id !== id) return { ok: false, error: 'server' };
    this.opened.set(id, whole);
    const head = this.inbox.open?.find((p) => p.id === id);
    if (head && !head.read) { head.read = true; this.counts = { ...this.counts, unread: Math.max(0, this.counts.unread - 1) }; }
    this._changed();
    return { ok: true, report: whole };
  }

  /** CLOSE ONE as `state` (or open it again, 'open'): the copy kept and both lists looked at again. */
  async close(/** @type {string} */ id, /** @type {string} */ state) {
    const io = this._io();
    if (!io) return { ok: false, error: 'signed-out' };
    const r = await reportCloseCall(io, id, state);
    if (!r.ok) { this._refused(io, r.error); return { ok: false, error: r.error ?? 'server' }; }
    const kept = this.opened.get(id);
    if (kept) this.opened.set(id, { ...kept, state });
    this._changed();
    await Promise.all([this.loadInbox('open'), this.inbox.closed ? this.loadInbox('closed') : null]);
    return { ok: true, state };
  }
}
