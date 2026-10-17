// SAFE1-SAFE7 (2026-10-17, bible/11-Multiplayer/Chat-Safety-Arc.md): THE CLIENT'S HALF - the session carrying the
// relay's stamp and its word on my own chat (`law`, `banned`, `slowed`), the log that keeps a line's account and stamp,
// hears through the block list, takes a blocked account's lines back and picks what a report carries, the social picture
// that drops a blocked account's requests, a line's own menu in the chat panel, the host module's commands and the code
// of conduct's gate, and the card itself - each driven headless.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OnlineSession } from '../../../src/net/online.js';
import { ChatLog } from '../../../src/net/chat.js';
import { SocialState } from '../../../src/net/social.js';
import { createChatPanel } from '../../../src/ui/chatPanel.js';
import { createConductCard } from '../../../src/ui/conductCard.js';
import { createChatSafetyHost } from '../../../src/scenes/chatSafetyHost.js';
import { CHAT_WORLD_ROOM } from '../../../src/net/wire.js';
import { SESSION_KEY, SERVICE_KEY } from '../../../src/net/accountClient.js';
import { CONDUCT_VERSION, conductRules } from '../../../src/net/safety/conduct.js';
import { orderKindOf, REPORT_REASONS } from '../../../src/net/safety/safetyLaw.js';
import { _b64url } from '../../../src/net/identityToken.js';
import { fakeSocketClass } from '../../fakeSocket.mjs';

const SG = 'S'.repeat(86);
const enc = (o) => _b64url.encode(new TextEncoder().encode(JSON.stringify(o)));
const orderOf = (claims) => `v1.${enc(claims)}.${'x'.repeat(86)}`;

test('SAFE2 + SAFE4 + SAFE6 THE SESSION: a line\'s stamp is carried as the relay said it (a malformed one dropped); `law`, `banned` and `slowed` reach their hooks, malformed ones never; a ban order goes out on the mute order\'s own meter (mutants: the stamp dropped; a ban order unmetered)', () => {
  const { FakeWS, sockets } = fakeSocketClass();
  const clock = 1_000_000;
  const s = new OnlineSession({ url: 'wss://relay.test', name: 'Mac', id: 'mac-0001', secret: 'secret-of-mac-0001', presence: false, WebSocketImpl: FakeWS, now: () => clock });
  const heard = [], law = [], banned = [], slowed = [];
  s.onChat = (l) => heard.push(l);
  s.onLaw = (m) => law.push(m); s.onBanned = (m) => banned.push(m); s.onSlowed = (m) => slowed.push(m);
  s.join(CHAT_WORLD_ROOM);
  const ws = sockets[0];
  ws.open();
  ws.receive({ t: 'welcome', id: 'mac-0001', peers: [], n: 1 });
  ws.receive({ t: 'chat', id: 'bob-0002', name: 'Bob', text: 'hi', at: 1, sub: 'acct-bob', sg: SG });
  ws.receive({ t: 'chat', id: 'bob-0002', name: 'Bob', text: 'yo', at: 2, sub: 'acct-bob', sg: 'short' });
  assert.equal(heard[0].sg, SG);
  assert.equal('sg' in heard[1], false, 'a stamp of the wrong shape is no stamp');
  ws.receive({ t: 'law', order: 'v1.a.b' });
  ws.receive({ t: 'law' });
  ws.receive({ t: 'banned', until: 99 });
  ws.receive({ t: 'banned', until: -1 });
  ws.receive({ t: 'slowed', ms: 3000 });
  ws.receive({ t: 'slowed', ms: 0 });
  assert.deepEqual([law, banned, slowed], [[{ order: 'v1.a.b' }], [{ until: 99 }], [{ ms: 3000 }]]);
  assert.equal(s.sendBanOrder('v1.c.d'), true);
  assert.deepEqual(JSON.parse(ws.sent.at(-1)), { t: 'ban', order: 'v1.c.d' });
  assert.equal(s.sendMuteOrder('v1.e.f'), false, 'one bucket for both kinds, as the relay spends one');
  assert.equal(s.sendBanOrder(''), false);
});

test('SAFE1 + SAFE2 + SAFE3 THE LOG: a spoken line keeps its account and stamp (a game\'s line never does); an account it does not hear is never kept; a block takes back what was said; a report carries the account\'s stamped lines and the stamped lines before each, one line\'s own when asked, the account\'s newest first past the bound (mutants: a blocked line kept; context lines past the bound kept over the account\'s own)', () => {
  const log = new ChatLog({ now: () => 10_000 });
  const a = log.push('world', { id: 'p1', name: 'Sylvia', text: 'hi', at: 1, sub: 'acct-syl', sg: SG });
  assert.equal(a.sub, 'acct-syl'); assert.equal(a.sg, SG);
  assert.equal('sub' in log.push('world', { text: 'Server restarting', system: true, sub: 'x' }), false);
  log.push('world', { id: 'p2', name: 'Troll', text: 'gross', at: 2, sub: 'acct-tro', sg: SG });
  log.push('world', { id: 'p3', name: 'Quiet', text: 'unstamped', at: 3, sub: 'acct-qui' });
  log.push('world', { id: 'p2', name: 'Troll', text: 'freaks', at: 4, sub: 'acct-tro', sg: SG });
  const all = log.reportLines('acct-tro');
  assert.deepEqual(all.map((l) => l.text), ['hi', 'gross', 'freaks'], 'the account\'s lines and the stamped lines before them - the unstamped never');
  const seqOfFirst = log.tab('world').messages.find((l) => l.text === 'gross').seq;
  assert.deepEqual(log.reportLines('acct-tro', { seq: seqOfFirst }).map((l) => l.text), ['hi', 'gross'], 'one line\'s own report');
  assert.deepEqual(Object.keys(all[0]), ['tab', 'sub', 'name', 'at', 'text', 'sg']);
  assert.deepEqual(log.reportLines('acct-tro', { max: 1 }).map((l) => l.text), ['freaks'], 'past the bound, the account\'s newest first');
  log.hears = (sub) => sub !== 'acct-tro';
  assert.equal(log.push('world', { id: 'p2', name: 'Troll', text: 'again', at: 5, sub: 'acct-tro', sg: SG }), null);
  assert.equal(log.forgetSpeaker('acct-tro'), 2);
  assert.deepEqual(log.tab('world').messages.map((l) => l.text), ['hi', 'Server restarting', 'unstamped']);
  assert.ok(log.push('world', { id: 'me', name: 'Me', text: 'mine', mine: true, sub: 'acct-tro' }), 'my own line is always mine');
});

test('SAFE1 THE SOCIAL PICTURE drops a blocked account\'s friend request, party invite and notes - its sender never told (mutant: an invite from a blocked account landing)', () => {
  const s = new SocialState({ acct: 'acct-me' });
  s.hears = (acct) => acct !== 'acct-tro';
  const notes = [], invites = [];
  s.onNote = (n) => notes.push(n.acct); s.onInvite = (i) => invites.push(i.from.acct);
  s.apply({ t: 'social', k: 'state', acct: 'acct-me', name: 'Me', friends: [], in: [{ acct: 'acct-tro', name: 'Troll' }, { acct: 'acct-ok', name: 'Ok' }], out: [], party: null, invites: [{ party: 'p1', from: { acct: 'acct-tro', name: 'Troll' }, members: [], at: 1, expires: 9e12 }] });
  assert.deepEqual(s.in.map((r) => r.acct), ['acct-ok']);
  assert.equal(s.invites.size, 0);
  s.apply({ t: 'social', k: 'invite', party: 'p2', from: { acct: 'acct-tro', name: 'Troll' }, members: [], at: 1, expires: 9e12 });
  s.apply({ t: 'social', k: 'invite', party: 'p3', from: { acct: 'acct-ok', name: 'Ok' }, members: [], at: 1, expires: 9e12 });
  assert.deepEqual(invites, ['acct-ok']);
  s.apply({ t: 'social', k: 'note', code: 'friend.requested', acct: 'acct-tro', name: 'Troll' });
  s.apply({ t: 'social', k: 'note', code: 'friend.requested', acct: 'acct-ok', name: 'Ok' });
  assert.deepEqual(notes, ['acct-ok']);
});

/** chat1.test.js's fake DOM - the shape every chat pin copies. */
function fakeNode(tag, doc) {
  const n = {
    tagName: tag.toUpperCase(), children: [], parent: null, className: '', textContent: '', id: '', value: '', disabled: false,
    style: {}, dataset: {}, attrs: {}, listeners: new Map(), scrollTop: 0, scrollHeight: 100, clientHeight: 100,
    append(...cs) { for (const c of cs) { c.parent = n; n.children.push(c); } },
    replaceChildren(...cs) { n.children = []; n.append(...cs); },
    setAttribute(k, v) { n.attrs[k] = v; },
    addEventListener(t, fn) { if (!n.listeners.has(t)) n.listeners.set(t, []); n.listeners.get(t).push(fn); },
    removeEventListener(t, fn) { const l = n.listeners.get(t) ?? []; const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); },
    fire(t, e = {}) { const ev = { type: t, target: n, preventDefault() {}, stopPropagation() {}, ...e }; for (const fn of n.listeners.get(t) ?? []) fn(ev); return ev; },
    focus() { doc.activeElement = n; }, blur() {},
    remove() { if (n.parent) { n.parent.children.splice(n.parent.children.indexOf(n), 1); n.parent = null; } },
  };
  return n;
}
function fakeDocument() {
  const doc = { activeElement: null };
  doc.createElement = (tag) => fakeNode(tag, doc);
  doc.head = fakeNode('head', doc); doc.body = fakeNode('body', doc);
  const byId = (n, id) => { if (n.id === id) return n; for (const c of n.children) { const f = byId(c, id); if (f) return f; } return null; };
  doc.getElementById = (id) => byId(doc.head, id) ?? byId(doc.body, id);
  return doc;
}
const fakeWindow = () => ({ addEventListener() {}, removeEventListener() {} });
const all = (n, cls, out = []) => { if (String(n.className).split(' ').includes(cls)) out.push(n); for (const c of n.children) all(c, cls, out); return out; };

test('SAFE1 + SAFE3 A LINE\'S OWN MENU: the speaker\'s name pressed opens the host\'s rows under the line, a row run closes it, the name pressed again closes it; my own lines and the game\'s have none (mutants: a menu on my own line; a row that does not close)', () => {
  const log = new ChatLog({ now: () => 10_000 });
  const doc = fakeDocument();
  const ran = [];
  const panel = createChatPanel({ log, onSend: () => true, doc, win: fakeWindow(), touch: false, lineActions: (line) => [{ label: `Report ${line.name}`, run: () => ran.push(line.text) }] });
  log.push('world', { id: 'p2', name: 'Troll', text: 'gross', at: 1, sub: 'acct-tro', sg: SG });
  log.push('world', { id: 'me', name: 'Me', text: 'mine', at: 2, mine: true, sub: 'acct-me' });
  log.push('world', { text: 'Server restarting', system: true });
  panel.open();
  panel.render?.();
  const root = doc.body.children.find((c) => String(c.className).startsWith('dfchat'));
  const names = all(root, 'dfchat-name');
  const troll = names.find((n) => n.textContent === 'Troll');
  const mine = names.find((n) => n.textContent === 'Me');
  assert.ok(troll && String(troll.className).includes('dfchat-act'));
  assert.equal(String(mine.className).includes('dfchat-act'), false, 'no menu on my own line');
  troll.fire('click');
  let menus = all(root, 'dfchat-linemenu');
  assert.equal(menus.length, 1);
  troll.fire('click');
  assert.equal(all(root, 'dfchat-linemenu').length, 0, 'pressed again, it closes');
  troll.fire('click');
  menus = all(root, 'dfchat-linemenu');
  menus[0].children[0].fire('click');
  assert.deepEqual(ran, ['gross']);
  assert.equal(all(root, 'dfchat-linemenu').length, 0, 'a row run closes the menu');
});

/** A host over a real log, fake links and a fake account service - every request recorded. */
function hostRig({ conduct = true, blocks = [] } = {}) {
  const log = new ChatLog({ now: () => 10_000 });
  const sent = [];
  const link = (name) => ({ name, peers: new Map([['p2', { id: 'p2', name: 'Troll', sub: 'acct-tro' }]]), mute: [], ban: [], left: 0,
    sendMuteOrder(o) { this.mute.push(o); return true; }, sendBanOrder(o) { this.ban.push(o); return true; }, leave() { this.left++; } });
  const links = [link('world'), link('online')];
  const asked = [];
  const answers = { '/v1/safety/blocks': { ok: true, blocks }, '/v1/safety/block': { ok: true, blocks: [{ sub: 'acct-tro', name: 'Troll', at: 1 }] }, '/v1/safety/unblock': { ok: true, blocks: [] },
    '/v1/safety/report': { ok: true, case: '00aa', muted: 1, order: orderOf({ o: 'mute', s: 'acct-tro', mu: 1 }) }, '/v1/safety/conduct': { ok: true, conduct: CONDUCT_VERSION },
    '/v1/mod/strikes': { ok: true, name: 'Troll', strikes: 2, next: 10080, history: [] } };
  const fetch = async (url, init) => {
    const path = new URL(url).pathname;
    asked.push({ path, body: init?.body ? JSON.parse(init.body) : null });
    return new Response(JSON.stringify(answers[path] ?? { error: 'server' }), { status: answers[path] ? 200 : 500, headers: { 'content-type': 'application/json' } });
  };
  const storage = { getItem: (k) => (k === SESSION_KEY ? JSON.stringify({ secret: 's3cret', id: 'acct-me' }) : k === SERVICE_KEY ? 'https://accounts.test' : null) };
  const doc = fakeDocument();
  const host = createChatSafetyHost({ log: () => log, links: () => links, fetch, storage, doc, touch: false });
  host.adopt({ conduct });
  return { log, links, asked, host, doc, sent };
}
const settle = () => new Promise((r) => setTimeout(r, 0));

test('SAFE1 THE HOST\'S BLOCK: the list is read at the start and the log hears through it; Block on a line asks the service and takes the account\'s lines back; /blocked lists, /unblock undoes - and the commands are the host\'s, never sent as chat (mutants: the list never read; the log never told)', async () => {
  const r = hostRig({ blocks: [{ sub: 'acct-old', name: 'Old', at: 1 }] });
  r.log.push('world', { id: 'p9', name: 'Old', text: 'before', at: 1, sub: 'acct-old', sg: SG });
  await r.host.start();
  assert.equal(r.log.hears('acct-old'), false);
  assert.deepEqual(r.log.tab('world').messages.filter((l) => l.sub === 'acct-old'), [], 'the start takes a blocked account\'s lines back');
  const line = r.log.push('world', { id: 'p2', name: 'Troll', text: 'gross', at: 2, sub: 'acct-tro', sg: SG });
  const rows = r.host.lineActions(line);
  assert.deepEqual(rows.map((x) => x.label).slice(-1), ['Block']);
  assert.equal(rows.length, REPORT_REASONS.length + 1);
  rows.at(-1).run();
  await settle(); await settle();
  assert.deepEqual(r.asked.map((a) => a.path), ['/v1/safety/blocks', '/v1/safety/block']);
  assert.deepEqual(r.asked[1].body, { target: 'acct-tro' });
  assert.equal(r.log.tab('world').messages.some((l) => l.sub === 'acct-tro' && !l.system), false);
  assert.equal(r.host.onSend('world', '/blocked'), true);
  await settle();
  assert.match(r.log.tab('world').messages.at(-1).text, /Blocked: Troll/);
  assert.equal(r.host.onSend('world', '/unblock Troll'), true);
  await settle(); await settle();
  assert.deepEqual(r.asked.at(-1), { path: '/v1/safety/unblock', body: { target: 'acct-tro' } });
  assert.deepEqual(r.host.lineActions({ text: 'x', system: true }), []);
});

test('SAFE3 THE HOST\'S REPORT: a line\'s own Report carries that line and the stamped lines before it with the reason chosen; /report <name> carries everything the account said here; a report that mutes hands back an order, carried to every room by its kind (mutants: the order dropped; carried to the wrong door)', async () => {
  const r = hostRig();
  r.log.push('world', { id: 'p1', name: 'Sylvia', text: 'happy pride', at: 1, sub: 'acct-syl', sg: SG });
  const line = r.log.push('world', { id: 'p2', name: 'Troll', text: 'nobody wants your flag', at: 2, sub: 'acct-tro', sg: SG });
  r.host.lineActions(line).find((x) => /Hate or slurs/.test(x.label)).run();
  await settle(); await settle();
  const [rep] = r.asked;
  assert.equal(rep.path, '/v1/safety/report');
  assert.deepEqual({ target: rep.body.target, reason: rep.body.reason, texts: rep.body.lines.map((l) => l.text) }, { target: 'acct-tro', reason: 'hate', texts: ['happy pride', 'nobody wants your flag'] });
  assert.equal(r.links[0].mute.length, 1, 'the mute the report reached, carried');
  assert.equal(r.links[0].ban.length, 0);
  assert.equal(r.host.onSend('world', '/report Troll harassment'), true);
  await settle(); await settle();
  assert.equal(r.asked.at(-1).body.reason, 'harassment');
  assert.equal(orderKindOf(orderOf({ o: 'ban', s: 'x', bn: 1 })), 'ban');
  assert.equal(orderKindOf('junk'), null);
});

test('SAFE4 + SAFE6 THE RELAY\'S WORD: a pushed order is carried to every room by its kind; a ban is said and every room left; a lifted ban is said; the pace is said once in a while, not on every press (mutants: a ban that leaves nothing; the pace said each time)', async () => {
  const r = hostRig();
  await r.host.start();
  const link = r.links[0];
  link.onLaw({ order: orderOf({ o: 'ban', s: 'acct-me', bn: 2e9 }) });
  assert.deepEqual([r.links[0].ban.length, r.links[1].ban.length, r.links[0].mute.length], [1, 1, 0]);
  link.onBanned({ until: 2e9 });
  assert.deepEqual(r.links.map((l) => l.left), [1, 1]);
  assert.match(r.log.tab(r.log.active).messages.at(-1).text, /This account is banned/);
  link.onSlowed({ ms: 2500 });
  link.onSlowed({ ms: 2000 });
  assert.equal(r.log.tab(r.log.active).messages.filter((l) => /New players can send/.test(l.text)).length, 1);
});

test('SAFE7 THE CODE OF CONDUCT\'S GATE: before a first line the card stands and the line stays in the field (onSend false); a command or a host line is never held; agreeing asks the service with the version shown, and the next line goes (mutants: a line sent before agreeing; a command held)', async () => {
  const r = hostRig({ conduct: false });
  assert.equal(r.host.onSend('world', 'hello everyone'), false, 'held');
  const card = r.doc.body.children.find((c) => String(c.className).startsWith('dfconduct'));
  assert.equal(card.dataset.up, '1');
  assert.deepEqual(all(card, 'dfconduct-rule').map((n) => n.textContent), conductRules());
  assert.equal(r.host.onSend('world', '/help'), null, 'a command is not held');
  assert.equal(r.host.onSend('world', '/blocked'), true);
  assert.equal(r.host.onSend('world', '/me waves'), false, 'an action is a line');
  all(card, 'yes')[0].fire('click');
  await settle(); await settle();
  assert.deepEqual(r.asked.at(-1), { path: '/v1/safety/conduct', body: { v: CONDUCT_VERSION } });
  assert.equal(r.host.onSend('world', 'hello everyone'), null, 'agreed: the line goes');
  const old = hostRig();
  old.host.adopt({});
  assert.equal(old.host.onSend('world', 'hi'), null, 'an older service that says nothing is heard as yes');
});

test('SAFE7 THE CARD: its rules in the player\'s language, "I agree" and "Not now" each answered once, nothing while it is down (mutant: agree answered with the card down)', () => {
  const doc = fakeDocument();
  let yes = 0, no = 0;
  const c = createConductCard({ agree: () => yes++, later: () => no++, doc });
  const [yesBtn] = all(c.root, 'yes');
  yesBtn.fire('click');
  assert.equal(yes, 0, 'down: nothing');
  c.show();
  assert.equal(c.isUp(), true);
  yesBtn.fire('click');
  yesBtn.fire('click');
  assert.equal(yes, 1);
  c.show();
  c.root.children.at(-1).children[0].fire('click');
  assert.equal(no, 1);
  assert.equal(c.isUp(), false);
});
