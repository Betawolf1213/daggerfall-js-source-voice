// PRIVATE-REPORT (2026-10-17, Mac: "Can we add a private disclosure method for exploits/bugs with the client"): THE
// CLIENT'S SIDE - net/privateReport.js ReportDesk over the real service (a send, its rid, my list, a reader's inbox), the
// PostBox's reader count and its notice, ui/enhanced/enhancedReport.js's panes in the mailbox's window, and `/report`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { standService } from '../accountDb.mjs';
import { PostBox, postNoticeText } from '../../src/net/serverPost.js';
import { ReportDesk, reportContext, mintReportRid } from '../../src/net/privateReport.js';
import { reportWordsOf, reportContextOf, REPORT_RID_RE } from '../../src/net/reportLaw.js';
import { postWindow } from '../../src/ui/enhanced/enhancedPost.js';
import { myReportStateText, reportBuildText } from '../../src/ui/enhanced/enhancedReport.js';
import { HELP_LINES, HOST_COMMANDS, mailboxCommandOf, parseChatLine } from '../../src/net/chatCommands.js';
import { ENHANCED_CSS } from '../../src/ui/enhanced/enhancedStyle.js';

const src = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const ioFor = (svc, who, fetch = (u, i) => svc.fetch(u, i)) => () => (who ? { fetch, base: 'https://accounts.invalid', secret: who.secret, storage: null } : null);
const words = { kind: 'exploit', subject: 'Gold doubles at the bank', body: 'Deposit, then cancel the window twice.' };

test('PRIVATE-REPORT the desk: words the law refuses are never asked; a lost answer asked again is the same report (its rid kept), a changed draft a new one; sent, the draft cleared and my list looked at; the context what the form says and nothing else (mutants: the rid minted each send; the rid kept past a changed draft; the draft kept after a send)', async () => {
  const svc = await standService();
  const ann = await svc.registered('Ann');
  let asked = 0;
  let lose = 0;
  const fetch = async (u, i) => { asked++; const res = await svc.fetch(u, i); if (lose > 0) { lose--; throw new Error('the answer was lost'); } return res; };
  const desk = new ReportDesk({ ioOf: ioFor(svc, ann, fetch) });

  desk.setDraft({ kind: 'exploit', subject: 'ab', body: words.body });
  assert.deepEqual(await desk.send(), { ok: false, error: 'report-subject' });
  assert.equal(asked, 0, 'refused by the law, never asked');

  desk.setDraft(words);
  lose = 1;
  const lost = await desk.send();
  assert.equal(lost.ok, false, 'the answer never came');
  assert.equal(svc.env.DB._raw.prepare('SELECT COUNT(*) AS n FROM private_reports').get().n, 1, 'but the report landed');
  const again = await desk.send();
  assert.deepEqual([again.ok, again.repeat], [true, true], 'asked again under its rid: the report it made');
  assert.equal(svc.env.DB._raw.prepare('SELECT COUNT(*) AS n FROM private_reports').get().n, 1, 'once');
  assert.deepEqual(desk.draft, { kind: null, subject: '', body: '' }, 'sent, the form is empty');
  await desk.loadMine();
  assert.deepEqual(desk.mine.map((p) => [p.subject, p.state, p.read]), [[words.subject, 'open', false]]);
  assert.equal(myReportStateText(desk.mine[0]), 'Sent');

  // a draft changed after a lost answer is a new send - never answered with the old one's report
  desk.setDraft(words);
  lose = 1;
  assert.equal((await desk.send()).ok, false);
  desk.setDraft({ subject: 'Gold doubles at the bank, and the guild vault too' });
  const changed = await desk.send();
  assert.deepEqual([changed.ok, changed.repeat], [true, false], 'a new report for new words');
  assert.equal(svc.env.DB._raw.prepare('SELECT COUNT(*) AS n FROM private_reports').get().n, 3);

  assert.match(mintReportRid(), REPORT_RID_RE);
  assert.notEqual(mintReportRid(), mintReportRid());
  assert.deepEqual(reportContext({ update: '0.0.412', build: 'd9187c3049cb', desktop: true }), { update: '0.0.412', build: 'd9187c3049cb', app: 'desktop' });
  assert.deepEqual(reportContext({ update: null, build: 'dev', desktop: false }), { app: 'browser' }, 'a dev build sends what it knows');
  assert.equal(reportBuildText({ update: '0.0.412', build: 'd9187c3049cb', app: 'desktop' }), 'DFO Online 0.0.412 (d9187c3049cb) desktop app');
  assert.equal(reportBuildText(null), 'an unknown build');
  assert.deepEqual(reportContextOf({ app: 'phone', build: 'XYZ', update: 'a b' }), null);
  assert.deepEqual(reportWordsOf({ kind: 'bug', subject: ' A\n title ', body: ' Ten chars!\r\n ' }), { kind: 'bug', subject: 'A title', body: 'Ten chars!' });
});

test('PRIVATE-REPORT A READER\'S BOX: the service\'s count rides the box and the envelope counts the unopened; a rise said on the world tab, never what the reports say; nobody else\'s box carries a count (mutants: the envelope blind to reports; the rise never said)', async () => {
  const svc = await standService({ REPORT_READER_HANDLES: 'Mac' });
  const ann = await svc.registered('Ann'), mac = await svc.registered('Mac');
  const said = [];
  const box = new PostBox({ ioOf: ioFor(svc, mac), onPost: (e) => said.push(e) });
  await box.refresh();
  assert.deepEqual([box.reports, box.waiting, said.length], [{ unread: 0, open: 0 }, 0, 0], 'a reader, nothing waiting');
  const annDesk = new ReportDesk({ ioOf: ioFor(svc, ann) });
  annDesk.setDraft({ ...words, subject: 'The secret dupe' });
  assert.equal((await annDesk.send()).ok, true);
  await box.refresh();
  assert.deepEqual([box.reports, box.waiting], [{ unread: 1, open: 1 }, 1], 'the envelope counts it');
  assert.deepEqual(said, [{ kind: 'reports', unread: 1 }]);
  const line = postNoticeText(said[0]);
  assert.equal(line, '1 private report is waiting to be read. Type /report, or open the mailbox beside the hourglass.');
  assert.ok(!line.includes('secret dupe'), 'never its words');
  await box.refresh();
  assert.equal(said.length, 1, 'a count that did not rise says nothing');
  const v = box.version;
  await box.desk.loadInbox('open');
  await box.desk.open(box.desk.inbox.open[0].id);
  await box.refresh();
  assert.deepEqual([box.reports.unread, box.waiting], [0, 0]);
  assert.ok(box.version > v, 'the window repaints on it');

  const annBox = new PostBox({ ioOf: ioFor(svc, ann), onPost: (e) => said.push(e) });
  await annBox.refresh();
  assert.equal(annBox.reports, null, 'a reporter is no reader');
  assert.equal(postNoticeText({ kind: 'reports', unread: 3 }), '3 private reports are waiting to be read. Type /report, or open the mailbox beside the hourglass.');
});

// ── the window ───────────────────────────────────────────────────────

/** A document whose nodes know focus, attributes and containment (serverpost_client.test.js's own). */
function focusDoc() {
  const doc = { activeElement: null };
  const node = (tag) => {
    const n = { tag, children: [], className: '', attrs: {}, style: {}, listeners: {}, title: '', type: '', disabled: false, isConnected: true, parent: null, value: '', checked: false,
      append(...cs) { for (const c of cs) { c.parent = n; n.children.push(c); } }, setAttribute(k, v) { n.attrs[k] = v; }, getAttribute(k) { return n.attrs[k] ?? null; },
      addEventListener(t, f) { (n.listeners[t] ??= []).push(f); }, focus() { doc.activeElement = n; },
      contains(o) { for (let c = o; c; c = c.parent) if (c === n) return true; return false; },
      querySelector(sel) {
        const k = /^\[data-key="(.*)"\]$/.exec(sel)?.[1];
        let hit = null;
        walk(n, (c) => { if (hit || c === n) return; if (k != null ? c.attrs['data-key'] === k : String(c.className).split(' ').includes(sel.slice(1))) hit = c; });
        return hit;
      },
      classList: { toggle(c, on) { const cs = new Set(String(n.className).split(' ').filter(Boolean)); if (on) cs.add(c); else cs.delete(c); n.className = [...cs].join(' '); } } };
    Object.defineProperty(n, 'textContent', { get() { return n._t ?? ''; }, set(v) { n._t = v; if (v === '') n.children = []; } });
    return n;
  };
  doc.createElement = node;
  return doc;
}
const walk = (n, f) => { f(n); for (const c of n.children ?? []) walk(c, f); };
const all = (root, cls) => { const out = []; walk(root, (n) => { if (String(n.className).split(' ').includes(cls)) out.push(n); }); return out; };
const byKey = (root, key) => { let hit = null; walk(root, (n) => { if (!hit && n.attrs?.['data-key'] === key) hit = n; }); return hit; };
const text = (n) => { let t = n._t ?? ''; for (const c of n.children ?? []) t += text(c); return t; };
const settle = () => new Promise((r) => setTimeout(r, 0));
const click = async (n) => { n.listeners.click[0](); await settle(); };
/** Wait for what the service's answer moves - a fake service answers over many turns of the loop. */
const until = async (f) => { for (let i = 0; i < 500 && !f(); i++) await settle(); assert.ok(f(), 'it came'); };

test('PRIVATE-REPORT THE FORM IN THE MAILBOX: a door under the post; the form - three kinds, a title, the words and what is sent with them; typed into, the desk holds it; a box that moves while the player types never rebuilds the form; sent, a thank-you, the form empty and the report in my list as Sent; a refusal said and the field it names given the focus; Back to the post (mutants: the form rebuilt on every draw; the doors gone)', async () => {
  const svc = await standService();
  const ann = await svc.registered('Ann');
  const box = new PostBox({ ioOf: ioFor(svc, ann) });
  await box.refresh();
  const doc = focusDoc();
  const keep = {};
  const w = postWindow(/** @type {any} */ (doc), { box: () => box, onClose() {}, every: 1e9, keep });
  w.stop();
  const door = byKey(w.root, 'report');
  assert.ok(door, 'the door under the post');
  assert.equal(byKey(w.root, 'inbox'), null, 'no inbox for a reporter');
  await click(door);
  assert.equal(keep.view, 'report');
  assert.equal(all(w.root, 'pm-title')[0].textContent, 'Report privately');
  assert.equal(doc.activeElement, byKey(w.root, 'kind-exploit'), 'the focus on the first choice');
  assert.deepEqual(all(w.root, 'pr-kindname').map((n) => n.textContent), ['An exploit', 'A bug', 'Account or server security']);
  assert.match(text(all(w.root, 'pr-sends')[0]), /^Sent with it: your username, and this game's build - DFO Online/);

  const subject = byKey(w.root, 'subject'), body = byKey(w.root, 'body');
  subject.value = 'ab'; subject.listeners.input[0]();
  body.value = words.body; body.listeners.input[0]();
  assert.equal(all(w.root, 'pr-count')[0].textContent, `${words.body.length} / 3000`);
  // a heartbeat's look while the player types: the same form, the same fields
  box.version++;
  w.draw();
  assert.equal(byKey(w.root, 'subject'), subject, 'never rebuilt under the hands typing in it');
  await click(byKey(w.root, 'send'));
  assert.equal(all(w.root, 'pm-say')[0].textContent, 'Choose what kind of problem this is.');
  assert.equal(doc.activeElement, byKey(w.root, 'kind-exploit'), 'the focus where the fault is');
  const exploit = byKey(w.root, 'kind-exploit');
  exploit.checked = true; exploit.listeners.change[0]();
  await click(byKey(w.root, 'send'));
  assert.equal(all(w.root, 'pm-say')[0].textContent, 'Give the report a short title, 3 to 80 characters.');
  assert.equal(doc.activeElement, subject);
  subject.value = words.subject; subject.listeners.input[0]();
  await click(byKey(w.root, 'send'));
  await until(() => box.desk.mine?.length === 1 && !box.desk.sending);
  w.draw();
  assert.equal(all(w.root, 'pm-say')[0].textContent, 'Sent. Thank you - only the developers can read it.');
  assert.deepEqual([subject.value, body.value, exploit.checked], ['', '', false], 'the form empty for the next');
  assert.deepEqual(all(w.root, 'pr-mrow').map((n) => text(n)), [`${words.subject}Exploit - ${new Date(box.desk.mine[0].sentAt * 1000).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}Sent`]);
  await click(byKey(w.root, 'back'));
  assert.deepEqual([keep.view, all(w.root, 'pm-title')[0].textContent], [null, 'Mailbox']);
  assert.equal(doc.activeElement, byKey(w.root, 'report'), 'Back: the focus on the door it came from');

  // a guest is told why, and shown no form
  const g = await svc.guest();
  const guestBox = new PostBox({ ioOf: ioFor(svc, { secret: g.secret }) });
  await guestBox.refresh();
  const gw = postWindow(/** @type {any} */ (focusDoc()), { box: () => guestBox, onClose() {}, every: 1e9, keep: { view: 'report' } });
  gw.stop();
  assert.equal(byKey(gw.root, 'subject'), null);
  assert.match(text(gw.root), /Private reports need a username and a password/);
});

test('PRIVATE-REPORT THE READER\'S INBOX IN THE MAILBOX: a door that counts the unopened; the open list, unopened first, with who sent each; one opened - its words, the build it came from - and closed as fixed; the reporter\'s list says Fixed (mutants: the inbox door for everyone; the close never asked)', async () => {
  const svc = await standService({ REPORT_READER_HANDLES: 'Mac' });
  const ann = await svc.registered('Ann'), mac = await svc.registered('Mac');
  const annDesk = new ReportDesk({ ioOf: ioFor(svc, ann), context: () => ({ update: '0.0.412', build: 'd9187c3049cb', app: 'browser' }) });
  annDesk.setDraft({ ...words, kind: 'security', subject: 'Tokens never expire' });
  assert.equal((await annDesk.send()).ok, true);
  const box = new PostBox({ ioOf: ioFor(svc, mac) });
  await box.refresh();
  const doc = focusDoc();
  const keep = {};
  const w = postWindow(/** @type {any} */ (doc), { box: () => box, onClose() {}, every: 1e9, keep });
  w.stop();
  const door = byKey(w.root, 'inbox');
  assert.equal(door.textContent, 'Private reports (1 new)');
  await click(door);
  await until(() => box.desk.inbox.open !== null);
  w.draw();
  assert.equal(all(w.root, 'pm-title')[0].textContent, 'Private reports');
  const rows = all(w.root, 'pm-row');
  assert.equal(rows.length, 1);
  assert.equal(text(rows[0]).startsWith('Tokens never expireSecurity - from Ann - '), true);
  assert.ok(rows[0].className.includes('unread'));
  await click(rows[0]);
  await until(() => box.desk.opened.size === 1);
  w.draw();
  assert.equal(all(w.root, 'pm-body')[0].textContent, words.body);
  assert.equal(all(w.root, 'pr-context')[0].textContent, 'Sent from DFO Online 0.0.412 (d9187c3049cb) in a browser');
  await click(byKey(w.root, 'close-fixed'));
  await until(() => box.desk.opened.get(rows[0].attrs['data-key'])?.state === 'fixed' && box.desk.inbox.open?.length === 0);
  await until(() => all(w.root, 'pm-say')[0].textContent !== '');
  w.draw();
  assert.equal(all(w.root, 'pm-say')[0].textContent, 'Closed: Fixed.');
  assert.ok(byKey(w.root, 'close-open'), 'and it may be opened again');
  await annDesk.loadMine();
  assert.equal(myReportStateText(annDesk.mine[0]), 'Fixed', 'the reporter sees it fixed');
});

test('PRIVATE-REPORT the doors: `/report` the form and `/mail` the mailbox, on either skin and wherever the player stands - the host asks chatCommands.js, the pause door opens the enhanced face at `report`, the menu lands on the form; /help says it; the sheet styles the form (mutants: /report read as the mailbox; the classic skin without a way in)', () => {
  assert.equal(mailboxCommandOf('/report'), 'report');
  assert.equal(mailboxCommandOf(' /REPORT '), 'report');
  assert.equal(mailboxCommandOf('/mail'), 'mailbox');
  assert.equal(mailboxCommandOf('/mailbox'), 'mailbox');
  assert.equal(mailboxCommandOf('/report x'), null);
  assert.equal(mailboxCommandOf('/reports'), null);
  assert.ok(HOST_COMMANDS.includes('report'));
  assert.deepEqual(parseChatLine('/report'), { kind: 'host', name: 'report' }, 'never said to the room');
  assert.ok(HELP_LINES.some((l) => l.startsWith('/report - ')), '/help says it');
  const world = src('src/scenes/world.js');
  assert.match(world, /import \{ breachCommandOf, helpLines, mailboxCommandOf \} from '\.\.\/net\/chatCommands\.js';/);
  assert.match(world, /\{ const at = mailboxCommandOf\(text\); if \(at\) \{/);
  const door = src('src/ui/pauseDoor.js');
  assert.match(door, /if \(\(hooks\.at === 'mailbox' \|\| hooks\.at === 'report'\) && typeof document !== 'undefined'\) return enhancedPauseOverlay\(show, hooks\);/);
  const menu = src('src/ui/enhanced/enhancedMenu.js');
  assert.match(menu, /else if \(at === 'report'\) \{ postOpen = true; postKeep = \{ view: 'report' \}; \}/);
  for (const rule of ['.px-postwin .pr-field textarea', '.px-postwin .pr-kind input:focus-visible', '.px-postwin .pm-doors']) assert.ok(ENHANCED_CSS.includes(rule), rule);
});
