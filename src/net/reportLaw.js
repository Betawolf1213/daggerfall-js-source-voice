// @ts-check
// PRIVATE-REPORT (2026-10-17, Mac: "Can we add a private disclosure method for exploits/bugs with the client"): A
// PLAYER'S PRIVATE REPORT TO THE DEVELOPERS - ITS LAW, the one file the service (server-account/src/reports.js) and the
// client (net/privateReport.js, ui/enhanced/enhancedReport.js) both read.
//
// A report is a registered player's words to the people REPORT_READER_HANDLES names (server-account/wrangler.toml) and
// nobody else: an exploit, a bug, or a hole in the accounts or the servers. Never chat, never the Notice Board, never a
// letter - a dupe said where players can read it spreads before it is fixed. The words are bounded and cleaned the
// same way on both ends, so the form refuses what the service would, and the service never trusts the form.

/** What a report is about. `exploit` first: the reason this door exists. */
export const REPORT_KINDS = Object.freeze(['exploit', 'bug', 'security']);
/** A report's state. `open` until a reader closes it as one of the other three (and a reader may open it again). */
export const REPORT_STATES = Object.freeze(['open', 'fixed', 'wontfix', 'duplicate']);

/** A title's and the words' bounds, in characters, after cleaning. */
export const REPORT_SUBJECT_MIN = 3;
export const REPORT_SUBJECT_MAX = 80;
export const REPORT_BODY_MIN = 10;
export const REPORT_BODY_MAX = 3000;
/** The send's request bound in bytes - past the service's 4 KiB (service.js MAX_BODY_BYTES), since 3,000 characters of
 *  words are up to 9 KB of UTF-8 and more where JSON escapes them. Read before the JSON is parsed, as every bound is. */
export const REPORT_BODY_BYTES = 24 * 1024;

/** Reports one account may send in a window, and the window (s). A report is rare; this bounds a slip and a spammer. */
export const REPORT_SEND_MAX = 5;
export const REPORT_WINDOW_S = 3600;
/** Reports one account may hold OPEN - unread or read but not yet closed. The reader's queue is never one account's. */
export const REPORT_OPEN_MAX = 20;
/** How many of their own a reporter's list shows, newest first; and a reader's inbox, a page. */
export const REPORT_MINE_MAX = 20;
export const REPORT_INBOX_MAX = 100;

/** A report's id: the service's mintId shape. A send's own id (`rid`): the notice board's shape. */
export const REPORT_ID_RE = /^[A-Za-z0-9_-]{16,40}$/;
export const REPORT_RID_RE = /^[A-Za-z0-9_-]{8,40}$/;

/** Control characters out (a newline and a tab kept in the words), Windows' line ends made one. */
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const cleanBody = (/** @type {string} */ s) => s.replace(/\r\n?/g, '\n').replace(CONTROL_RE, '').trim();
const cleanSubject = (/** @type {string} */ s) => cleanBody(s).replace(/\s+/g, ' ');

/**
 * A REPORT'S WORDS, cleaned and bounded - `{ kind, subject, body }`, or `{ error }` with the word for what is wrong:
 * `report-kind`, `report-subject`, `report-body`.
 * @param {{ kind?: unknown, subject?: unknown, body?: unknown }} o
 * @returns {{ kind: string, subject: string, body: string } | { error: string }}
 */
export function reportWordsOf({ kind, subject, body } = {}) {
  if (typeof kind !== 'string' || !REPORT_KINDS.includes(kind)) return { error: 'report-kind' };
  const s = typeof subject === 'string' ? cleanSubject(subject) : '';
  if (s.length < REPORT_SUBJECT_MIN || s.length > REPORT_SUBJECT_MAX) return { error: 'report-subject' };
  const b = typeof body === 'string' ? cleanBody(body) : '';
  if (b.length < REPORT_BODY_MIN || b.length > REPORT_BODY_MAX) return { error: 'report-body' };
  return { kind, subject: s, body: b };
}

/**
 * WHAT RIDES WITH A REPORT besides its words - the build it was sent from, and where it ran: `{ update?, build?, app? }`,
 * each kept only in its own shape (anything else dropped, never refused - a report is never lost to its context), or
 * null when nothing is left. The form says what it sends (ui/enhanced/enhancedReport.js).
 * @param {any} raw
 * @returns {{ update?: string, build?: string, app?: string } | null}
 */
export function reportContextOf(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  /** @type {{ update?: string, build?: string, app?: string }} */
  const out = {};
  if (typeof raw.update === 'string' && /^[0-9A-Za-z.+-]{1,24}$/.test(raw.update)) out.update = raw.update;   // REL8's number
  if (typeof raw.build === 'string' && /^[0-9a-f]{7,40}$/.test(raw.build)) out.build = raw.build;   // buildTag.js BUILD_TAG
  if (raw.app === 'desktop' || raw.app === 'browser') out.app = raw.app;
  return Object.keys(out).length ? out : null;
}

/** A reporter's own report as their list carries it, checked on the way in, or null:
 *  `{ id, kind, subject, sentAt, read, state }`. */
export function reportHead(p) {
  if (!p || typeof p !== 'object') return null;
  if (typeof p.id !== 'string' || !REPORT_ID_RE.test(p.id)) return null;
  if (!REPORT_KINDS.includes(p.kind) || !REPORT_STATES.includes(p.state)) return null;
  if (typeof p.subject !== 'string' || !p.subject || p.subject.length > REPORT_SUBJECT_MAX || !Number.isSafeInteger(p.sentAt)) return null;
  return { id: p.id, kind: p.kind, subject: p.subject, sentAt: p.sentAt, read: p.read === true, state: p.state };
}

/** A report as a reader's inbox carries it: a reporter's head and who sent it (`from`, their name - null for an account
 *  that is gone, which the window says in words), or null. */
export function reportInboxHead(p) {
  const head = reportHead(p);
  if (!head) return null;
  return { ...head, from: typeof p.from === 'string' && p.from ? p.from.slice(0, 40) : null };
}

/** A WHOLE REPORT (`/v1/report/read`'s answer): its inbox head, its words and its context, or null. */
export function reportWhole(p) {
  const head = reportInboxHead(p);
  if (!head || typeof p.body !== 'string' || !p.body || p.body.length > REPORT_BODY_MAX) return null;
  return { ...head, body: p.body, context: reportContextOf(p.context), read: true };
}
