// GUILD-UX (2026-10-19, Discord #suggestions "Guild Hall Storage Improvements", Alkfay, through Mac): "the inability to
// preview items (e.g. for legendary items that can have different bases you can't tell what base it is, and for rare
// items you can't see what their mods are... nor is there any way to filter items) ... With the guild stores ... you have
// to scroll past all of the stored materials to get to the input section, and then you have to manually enter the amount
// to store ... having an 'transfer all' button that empties your personal store into the guild's store would be
// wonderful". The vault's rows carry the pack's own card and the stores' own filter; the guild Stores' form comes first,
// an empty Units is all of it, and Put in all empties the character's Stores into the guild's.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GUILD_RANK_NAMES } from '../../../src/net/guild/guildLaw.js';
import { GuildBook } from '../../../src/net/guild/guildBook.js';
import { createSocialPanel, vaultRowAccepts, guildPutAll } from '../../../src/ui/socialPanel.js';
import { SocialState } from '../../../src/net/social.js';
import { materialCountLabel } from '../../../src/systems/professions/profItems.js';
import { GUILD_STORES_MAX } from '../../../src/net/writLaw.js';
import { STORES_MAX } from '../../../src/net/professionLaw.js';
import { pageOf } from '../../../src/ui/packPages.js';

function fakeNode(tag, doc) {
  const n = {
    tagName: tag.toUpperCase(), children: [], parent: null, className: '', textContent: '', id: '', value: '', disabled: false,
    style: {}, dataset: {}, attrs: {}, listeners: new Map(), focused: false,
    append(...cs) { for (const c of cs) { if (typeof c === 'object') { c.parent = n; n.children.push(c); } } },
    replaceChildren(...cs) { n.children = []; n.append(...cs); },
    setAttribute(k, v) { n.attrs[k] = v; },
    getAttribute(k) { return n.attrs[k]; },
    addEventListener(t, fn) { if (!n.listeners.has(t)) n.listeners.set(t, []); n.listeners.get(t).push(fn); },
    removeEventListener() {},
    fire(t, e = {}) { const ev = { type: t, target: n, preventDefault() {}, stopPropagation() {}, ...e }; for (const fn of n.listeners.get(t) ?? []) fn(ev); return ev; },
    focus() { n.focused = true; doc.activeElement = n; },
    remove() { n.removed = true; },
  };
  return n;
}
function fakeDocument() {
  const doc = { activeElement: null };
  doc.createElement = (tag) => fakeNode(tag, doc);
  doc.head = fakeNode('head', doc); doc.body = fakeNode('body', doc);
  doc.getElementById = () => null;
  return doc;
}
const find = (n, cls, out = []) => { if (String(n.className).split(/\s+/).includes(cls)) out.push(n); for (const c of n.children) find(c, cls, out); return out; };
const order = (n, out = []) => { if (n.textContent) out.push(n.textContent); for (const c of n.children) order(c, out); return out; };
const button = (root, label) => find(root, 'dfsocial-btn').find((b) => b.textContent === label || b.children[0]?.textContent === label || String(b.textContent).startsWith(label));
const settle = () => new Promise((r) => setImmediate(r));
const view = (over = {}) => ({
  id: 'g0123456789', name: 'The Hand', tag: 'HND', ranks: [...GUILD_RANK_NAMES], treasury: 0, hallGold: 0, foundedAt: 1, rank: 0,
  members: [{ member: 'm1', name: 'Aldric', rank: 0, joinedAt: 1, you: true, vault: { level: 'withdraw', limit: 0, granted: false } }],
  invites: [], ledger: [], hall: null, heraldry: null, renamedAt: null, renameAt: null,
  vault: { used: 3, max: 50, me: { level: 'withdraw', limit: 0, granted: false, taken: 0 } }, ...over,
});
const OAK = 'log:oak', IRON = 'ore:iron', ASH = 'log:ash';

async function rig({ vaultItems = [], mine = new Map(), rows = [], refuse = null } = {}) {
  const calls = [];
  const guild = view();
  const writs = {
    busy: false, state: { guildStores: null, writBudget: null },
    guildStores: async () => { writs.state.guildStores = { rows, moves: [], mayWithdraw: true }; return { ok: true }; },
    deposit: async (k, n) => { calls.push(['deposit', k, n]); return refuse === k ? { ok: false, error: 'rate' } : { ok: true }; },
    withdrawStores: async (k, n) => { calls.push(['withdraw', k, n]); return { ok: true }; },
    budget: async () => ({ ok: true }),
  };
  const door = {
    mine: async () => ({ ok: true, data: { guild } }), invites: async () => ({ ok: true, data: { invites: [] } }),
    vault: async () => ({ ok: true, data: { vault: { max: 50, items: vaultItems, log: [], me: guild.vault.me } } }),
  };
  const book = new GuildBook({ door, character: () => 'rabc', wallet: () => ({ gold: () => 0, pay() {}, credit() {} }),
    pack: { items: () => [], add() {}, changed() {}, reach: () => true },
    profStores: { writs, open: () => true, mine: () => mine, name: (k, n) => materialCountLabel(k, n) } });
  const cards = [];
  const itemCard = { show: (rec, row) => cards.push(['show', rec.name, row]), hide: () => cards.push(['hide']) };
  const panel = createSocialPanel({ social: new SocialState({ acct: 'a' }), guild: book, doc: fakeDocument(), win: { addEventListener() {}, removeEventListener() {} }, overlay: () => false, touch: false, itemCard });
  const go = async (p) => { panel.openGuild(p); for (let i = 0; i < 6; i++) { await settle(); panel.render(); } };
  return { calls, panel, go, cards };
}

test('GUILD-UX the guild Stores: the form and its acts come first and the stored rows after them; Units left empty puts in all you hold the guild has room for, and takes out all you may that your Stores have room for (mutants: the rows back above the form, empty read as nothing, the guild\'s room ignored)', async () => {
  const mine = new Map([[OAK, { material: OAK, own: 30, bought: 5 }]]);
  const r = await rig({ mine, rows: [{ material: OAK, qty: GUILD_STORES_MAX - 20, mine: 0 }] });
  await r.go('stores');
  const seen = order(r.panel.root);
  const putAt = seen.indexOf('Put in'), rowAt = seen.findIndex((x) => /Oak Logs$/.test(x) && /^\d/.test(x));
  assert.ok(putAt >= 0 && rowAt > putAt, `the form first (${putAt}) and the rows after (${rowAt})`);
  const units = find(r.panel.root, 'dfsocial-field').find((f) => f.attrs['aria-label'] === 'Units (all of it when empty)');
  assert.ok(units, 'the field says what empty means');
  button(r.panel.root, 'Put in').fire('click');
  await settle(); await settle();
  assert.deepEqual(r.calls.at(-1), ['deposit', OAK, 20], 'all 35 held, but the guild has room for 20');
  r.panel.render();
  button(r.panel.root, 'Take out').fire('click');
  await settle(); await settle();
  assert.deepEqual(r.calls.at(-1), ['withdraw', OAK, STORES_MAX - 35], 'all an officer may, to the room the character\'s own Stores have');
});

test('GUILD-UX Put in all: every material of the character\'s Stores, each to the guild\'s room for it, one deposit after another; a refusal stops the run and says how far it went; nothing to put in, no press (mutants: the room ignored, a refusal run past)', async () => {
  const mine = new Map([[OAK, { material: OAK, own: 30, bought: 5 }], [IRON, { material: IRON, own: 12, bought: 0 }], [ASH, { material: ASH, own: 0, bought: 0 }]]);
  const r = await rig({ mine, rows: [{ material: IRON, qty: GUILD_STORES_MAX - 4, mine: 0 }] });
  await r.go('stores');
  button(r.panel.root, 'Put in all').fire('click');
  for (let i = 0; i < 6; i++) await settle();
  assert.deepEqual(r.calls.filter((c) => c[0] === 'deposit'), [['deposit', OAK, 35], ['deposit', IRON, 4]], 'Iron to the guild\'s room; Ash held at none');
  const deposits = [];
  const W = { deposit: async (k, n) => { deposits.push(k); return k === IRON ? { ok: false, error: 'rate' } : { ok: true }; } };
  assert.deepEqual(await guildPutAll(W, [[OAK, 1], [IRON, 1], [ASH, 1]]), { ok: false, error: 'rate', moved: 1 });
  assert.deepEqual(deposits, [OAK, IRON], 'stopped at the refusal');
  assert.deepEqual(await guildPutAll(W, [[OAK, 1]]), { ok: true, moved: 1 });
  const full = await rig({ mine: new Map([[OAK, { material: OAK, own: 3, bought: 0 }]]), rows: [{ material: OAK, qty: GUILD_STORES_MAX, mine: 0 }] });
  await full.go('stores');
  assert.equal(button(full.panel.root, 'Put in all').disabled, true, 'no room for any of it');
});

const BLADE = { group: 'Weapons', templateIndex: 120, material: 9, name: 'Daedric Longsword', identified: true };
const PLATE = { group: 'Armor', templateIndex: 102, material: 521, name: 'Daedric Cuirass', identified: true };
const HERB = { group: 'Ingredients', templateIndex: 0, name: 'Elf Cup', stackCount: 6 };

test('GUILD-UX the vault: each row\'s card is the pack\'s own, on a hover and on a press of its name, and goes with the pointer and at every repaint; the filter hides rows in place by page, rarity and search, kept across a repaint and let go with another vault (mutants: no card, the card left up, the search unread, the page unread)', async () => {
  const items = [
    { slot: 0, rec: BLADE, name: BLADE.name, count: 1, by: 'Aldric' },
    { slot: 1, rec: PLATE, name: PLATE.name, count: 1, by: 'Aldric' },
    { slot: 2, rec: HERB, name: HERB.name, count: 6, by: 'Bran' },
  ];
  const r = await rig({ vaultItems: items });
  await r.go('vault');
  const rows = () => find(r.panel.root, 'dfsocial-row').filter((n) => /put in by/.test(order(n).join('|')));
  assert.equal(rows().length, 3);
  rows()[0].fire('mouseenter');
  assert.deepEqual(r.cards.at(-1).slice(0, 2), ['show', 'Daedric Longsword'], 'the piece\'s own record on the card');
  rows()[0].fire('mouseleave');
  assert.deepEqual(r.cards.at(-1), ['hide']);
  find(rows()[1], 'dfsocial-name')[0].fire('click');
  assert.deepEqual(r.cards.at(-1).slice(0, 2), ['show', 'Daedric Cuirass'], 'a finger\'s press of the name');
  const shownNames = () => rows().filter((n) => n.style.display !== 'none').map((n) => find(n, 'dfsocial-name')[0].textContent);
  const q = find(r.panel.root, 'dfsocial-field').find((f) => f.attrs['aria-label'] === 'Find a piece');
  q.value = 'cuir'; q.fire('input');
  assert.deepEqual(shownNames(), ['Daedric Cuirass']);
  q.value = ''; q.fire('input');
  const page = find(r.panel.root, 'dfsocial-field').find((f) => f.attrs['aria-label'] === 'A page of the pack');
  const weaponsId = page.children.map((o) => o.value).find((v) => v !== 'all' && /Weapon/i.test(page.children.find((o) => o.value === v).textContent));
  page.value = weaponsId; page.fire('change');
  assert.deepEqual(shownNames(), ['Daedric Longsword']);
  r.cards.length = 0;
  r.panel.openGuild('vault'); r.panel.render();
  assert.ok(r.cards.some((c) => c[0] === 'hide'), 'a repaint takes the card down');
  assert.deepEqual(shownNames(), ['Daedric Longsword'], 'the filter stands across a repaint');
});

test('GUILD-UX vaultRowAccepts: the record\'s page and rarity and the shown name\'s search; an empty filter answers every row', () => {
  const row = { rec: BLADE, name: BLADE.name };
  assert.equal(vaultRowAccepts(row, { cat: 'all', rarity: 'all', query: '' }), true);
  assert.equal(vaultRowAccepts(row, { query: 'LONG' }), true, 'case blind');
  assert.equal(vaultRowAccepts(row, { query: 'axe' }), false);
  assert.equal(vaultRowAccepts(row, { cat: pageOf(BLADE) }), true, 'the blade\'s own page');
  assert.equal(vaultRowAccepts({ rec: HERB, name: HERB.name }, { cat: pageOf(BLADE) }), false, 'a herb is not on it');
});
