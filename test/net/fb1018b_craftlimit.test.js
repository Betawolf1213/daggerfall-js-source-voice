// FIELD BUGS 2026-10-18b CRAFT-LIMIT-SAID (the Discord's #bug-reports, CC/Astro, "Smithing stuck at 50": "I am unsure if
// its meant to stop here or if I am missing something but I have been stuck at level 50 smithing for about 3 days now.
// it is literally 1xp off of levelling up but everything I craft gives me 0xp") - THE CRAFTER'S LIMIT, SAID WHERE IT
// ACTS. PROF0 3.2 (DECIDED; Mac kept it at CAP-OFF, Professions-Arc 40): a character raises two crafts past Journeyman,
// and every other craft stops one XP short of rank 51 - the account service credits MAX(0, MIN(earned, cap - held))
// (server-account/src/professions.js craftAtAnvil and its four kin, cap professionLaw craftXpCap). The anvil read the
// craft's own law alone and promised "60 Smithing XP, and 500 more"; the Worker paid none; nothing in the game said why.
// Driven through the real Worker (test/accountDb.mjs), the real book (net/profBook.js), the real pages
// (ui/professions/profPages.js) and the words (ui/craftXpWords.js), against the law both ends read (net/professionLaw.js
// craftLimit, craftLimitOf, creditedXp). The new law is read through its namespaces, so on the code before the fix
// every test here runs and fails on what it says, not on an import.
// bible/01-Overview/bugs/Field-Bugs-2026-10-18b.md CRAFT-LIMIT-SAID; bible/06-Systems/Professions-Arc.md 41.10.
import '../chargenDom.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { standService, T0, sessionStorageOf } from '../accountDb.mjs';
import { accountProf, SESSION_KEY } from '../../src/net/accountClient.js';
import { createProfBook } from '../../src/net/profBook.js';
import * as law from '../../src/net/professionLaw.js';
import { recipeById, craftXp, cookXp, FIRST_CRAFT_XP } from '../../src/net/recipeLaw.js';
import * as words from '../../src/ui/craftXpWords.js';
import * as pages from '../../src/ui/professions/profPages.js';
import { setPref } from '../../src/systems/uiPrefs.js';
import { utcDay } from '../../src/net/marksLaw.js';
import { mintPieces } from '../../src/systems/smithItems.js';
import { FIRM_NODES } from '../../src/net/firmament/firmamentTree.js';
import { packTree, pathTo, treeStats, xpPct, scaleXp } from '../../src/net/firmament/firmamentLaw.js';
import { setFirmamentTree, setFirmamentOnline, _resetFirmamentLiveForTests } from '../../src/systems/firmamentLive.js';
import { hostText } from '../hostText.mjs';

const { xpForRank, PROF_XP_MAX } = law;
const NOON = utcDay(T0) * 86_400 + 12 * 3600;
/** The crafter's limit's ceiling: one XP short of rank 51 - the report's "1xp off of levelling up". */
const HELD = xpForRank(51) - 1;
const noWait = () => Promise.resolve();
const memStorage = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }; };
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const kit = { el, divider: (w) => el('h3', null, w), meter: () => el('div') };
const LIMIT = (room, prof, crafts) => `${room === 0 ? `No ${prof} XP` : `At most ${room} ${prof} XP`}: ${crafts} stand above Journeyman, and the crafter's limit holds ${prof} at rank 50.`;
const FIRST = (xp, prof) => `${xp} ${prof} XP, and 500 more the first time you make this piece at this tier.`;

/** A character on the real Worker, its tracks and Stores written as the service keeps them, and a book reading it. */
async function standBook(env = {}) {
  const s = await standService({ PROFESSIONS_OPEN: 'on', MARKS_OPEN: 'on', BOARD_OPEN: 'on', ...env });
  const raw = s.env.DB._raw;
  const mac = await s.seated('Mac');
  const give = (m, qty) => raw.prepare(`INSERT INTO prof_stores (player, char_id, material, origin, qty) VALUES (?, ?, ?, 'own', ?)
    ON CONFLICT (player, char_id, material, origin) DO UPDATE SET qty = excluded.qty`).run(mac.id, mac.character, m, qty);
  const track = (prof, xp) => raw.prepare(`INSERT INTO prof_tracks (player, char_id, profession, xp, updated_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (player, char_id, profession) DO UPDATE SET xp = excluded.xp`).run(mac.id, mac.character, prof, xp, NOON);
  const xpOf = (prof) => Number(raw.prepare('SELECT xp FROM prof_tracks WHERE player = ? AND char_id = ? AND profession = ?').get(mac.id, mac.character, prof)?.xp ?? 0);
  const door = accountProf({ fetch: s.fetch, storage: sessionStorageOf(SESSION_KEY, mac) });
  const book = createProfBook({ door, storage: memStorage(), character: () => mac.character, now: () => NOON * 1000, sleep: noWait });
  return { s, raw, mac, give, track, xpOf, book };
}

/** The Stores page over a book, at the stations `here` names, and its readers. */
function standPage(book, here = {}) {
  resetPages();
  const home = () => ({ kind: 'home', fee: 0 });
  const stub = async () => ({ ok: true, text: '' });
  const at = Object.fromEntries(Object.entries(here).map(([k, v]) => [k, typeof v === 'function' ? v : home]));
  pages.setProfessionsPages({ book, name: (k) => k, withdraw: stub, smelt: stub, craft: stub, brew: stub, stock: stub, temper: stub, disenchant: stub, clothing: () => 'MensClothing', heatBand: () => 1, stitchBand: () => 1, ...at });
  let root = null;
  const draw = () => { root?.remove?.(); root = el('div'); document.body.append(root); pages.drawStoresPage(root, draw, kit); };
  draw();
  const station = (title) => {
    const s = [...root.querySelectorAll('.prof-station')].find((x) => x.querySelector('h3')?.textContent === title);
    assert.ok(s, `the station ${title}`);
    return s;
  };
  const press = (title, label, exact = false) => {
    const b = [...station(title).querySelectorAll('button')].find((x) => (exact ? x.textContent === label : x.textContent.startsWith(label)));
    assert.ok(b, `${title}: ${label}`);
    b.onclick();
  };
  const notes = (title) => [...station(title).querySelectorAll('p')].map((p) => p.textContent);
  /** the picked pattern's box at a station: its head and its notes */
  const box = (title) => {
    const b = station(title).querySelector('.prof-craft');
    assert.ok(b, `${title}: a box`);
    return [b.children[0].textContent, [...b.querySelectorAll('p')].map((p) => p.textContent)];
  };
  return { draw, station, press, notes, box, text: (title) => station(title).textContent, done: () => { pages.setProfessionsPages(null); root?.remove?.(); } };
}
const resetPages = () => { pages.resetProfPages(); setPref('gentleActs', false); };

/** The Professions tab over a book, `sel` chosen: its XP line, its limit's two lines. */
function tabOf(book, sel) {
  resetPages();
  pages.setProfessionsPages({ book, name: (k) => k });
  let root = el('div');
  document.body.append(root);
  pages.drawProfessionsPage(root, () => {}, kit);
  [...root.querySelectorAll('button')].find((b) => b.className.includes('prof-row') && b.textContent.startsWith(law.professionName(sel))).onclick();
  root.remove();
  root = el('div');
  document.body.append(root);
  pages.drawProfessionsPage(root, () => {}, kit);
  const lim = root.querySelector('.prof-limit');
  const sib = lim?.parentNode?.children ?? [];
  const out = { xp: root.querySelector('.prof-xp')?.textContent, limit: lim?.textContent, rule: sib[sib.indexOf(lim) + 1]?.textContent };
  root.remove();
  pages.setProfessionsPages(null);
  return out;
}

// ─── THE REPORT ──────────────────────────────────────────────────────

test('CRAFT-LIMIT-SAID THE REPORT, end to end: Smithing 50 one XP short of 51 behind Building and Provisioning past Journeyman - the anvil\'s Silver Dagger box as the screenshot read it, but its XP line the limit\'s ("No Smithing XP") where it promised 60 and 500; the Worker credits none, the first\'s 500 too; the craft\'s word says the limit, never "with the first-time bonus"; the tab says the ceiling and the two; the limit is the cause - one of the two at 50 and the same box says 60 and the Worker pays it (mutants: the box\'s pay unread; the word\'s limit dropped; the tab\'s ceiling and rule)', async (t) => {
  t.mock.method(Date, 'now', () => NOON * 1000);
  const { track, give, xpOf, book } = await standBook();
  track('smithing', HELD);
  track('building', xpForRank(60));
  track('provisioning', xpForRank(55));
  give('ingot:silver', 40);
  give('metal:tin', 233);
  assert.equal((await book.refresh()).ok, true);
  const page = standPage(book, { forge: true });
  try {
    page.press('The Anvil', 'Dagger');
    page.press('The Anvil', 'Silver', true);
    const [head, lines] = page.box('The Anvil');
    assert.equal(head, 'Silver Dagger - rank 25');
    assert.equal(lines[0], 'Your rank 50, margin 25: Standard 20 | Fine 50 | Superior 28 | Masterwork 2. A clean heat is a step better.', 'the screenshot\'s odds line');
    assert.equal(lines[1], LIMIT(0, 'Smithing', 'Building and Provisioning'), 'where the screenshot read "60 Smithing XP, and 500 more the first time you make this piece at this tier."');
    // the Worker: the craft made, its XP none - the first's 500 eaten by the cap as well
    const r = await book.craft('dagger:silver', { clean: false, name: 'Mac' }, (data) => mintPieces(data));
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.deepEqual([r.data.xp, r.data.first, r.data.track.xp, r.data.track.rank, xpOf('smithing')], [0, true, HELD, 50, HELD]);
    // the craft's word, as world.js says it (one call, the book's limit handed in)
    const word = words.craftXpText(recipeById('dagger:silver'), r.data, 'Smithing', book.limit?.('smithing') ?? null);
    assert.equal(word, '(+0 Smithing XP - Building and Provisioning stand above Journeyman, and the crafter\'s limit holds Smithing at rank 50)');
    assert.doesNotMatch(word, /first-time bonus/, 'a bonus the limit ate is never said as paid');
  } finally { page.done(); }
  // the Professions tab: the ceiling, not "26,009 / 26,010 XP"; the two named, and that it is for good
  assert.deepEqual(tabOf(book, 'smithing'), {
    xp: '26,009 / 26,009 XP - the crafter\'s limit holds it at rank 50',
    limit: 'Crafts above Journeyman: 2 of 2',
    rule: 'A character raises only 2 crafts past Journeyman: yours are Building and Provisioning, so your other crafts stop at rank 50. No craft\'s rank is ever lowered.',
  });
  // THE CAUSE: one of the two at 50 (not past it), and the same craft's box says 60 - and a new pattern pays its 60 and 500
  track('provisioning', xpForRank(50));
  assert.equal((await book.refresh({ force: true })).ok, true);
  const again = standPage(book, { forge: true });
  try {
    again.press('The Anvil', 'Tanto');
    again.press('The Anvil', 'Silver', true);
    assert.equal(again.box('The Anvil')[1].at(-1), FIRST(60, 'Smithing'));
    const r = await book.craft('tanto:silver', { clean: false, name: 'Mac' }, (data) => mintPieces(data));
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.deepEqual([r.data.xp, r.data.first, xpOf('smithing')], [60 + FIRST_CRAFT_XP, true, HELD + 60 + FIRST_CRAFT_XP]);
    assert.equal(words.craftXpText(recipeById('tanto:silver'), r.data, 'Smithing', book.limit?.('smithing') ?? null), '(+560 Smithing XP, with the first-time bonus)');
  } finally { again.done(); }
  assert.equal(tabOf(book, 'smithing').xp, '26,569 / 27,040 XP', 'past 51 now: the next rank\'s line');
});

// ─── ONE LAW ─────────────────────────────────────────────────────────

test('CRAFT-LIMIT-SAID one law: at every room the limit leaves - none, one, short of the plain craft, the plain craft exactly, short of the first, the first exactly, ample - the anvil\'s line is what the Worker credits (the service\'s MAX(0, MIN(...)) and professionLaw creditedXp), each a new pattern\'s first (mutants: the room unread; "At most" for "No"; creditedXp unclamped either way)', async (t) => {
  t.mock.method(Date, 'now', () => NOON * 1000);
  const { track, give, xpOf, book } = await standBook();
  track('building', xpForRank(60));
  track('provisioning', xpForRank(55));
  for (const [m, n] of [['ingot:silver', 400], ['metal:tin', 100], ['metal:copper', 100], ['leather:cured', 100]]) give(m, n);
  const earned = craftXp(3, 50, false) + FIRST_CRAFT_XP;   // 560: a Silver piece's 60 at Smithing 50, and its first
  const rooms = [0, 1, 59, 60, 559, 560, 5000];
  const patterns = ['dagger', 'tanto', 'shortsword', 'wakizashi', 'broadsword', 'saber', 'longsword'];
  const seen = [];
  for (const [i, room] of rooms.entries()) {
    track('smithing', HELD - room);
    assert.equal((await book.refresh({ force: true })).ok, true);
    const pay = pages.payOf?.(book, 'smithing') ?? {};
    const r0 = recipeById(`${patterns[i]}:silver`);
    const line = words.craftXpLine(r0, 50, 'Smithing', pay);
    const r = await book.craft(r0.id, { clean: false, name: 'Mac' }, (data) => mintPieces(data));
    assert.equal(r.ok, true, JSON.stringify(r));
    // and the craft's word after it: the limit's where the craft left the track no room, the first's where it did
    seen.push([room, line, r.data.xp, r.data.first, xpOf('smithing'), words.craftXpText(r0, r.data, 'Smithing', book.limit?.('smithing') ?? null)]);
  }
  assert.deepEqual(seen, rooms.map((room) => {
    const paid = Math.min(earned, room);
    const word = room - paid === 0 ? `(+${paid} Smithing XP - Building and Provisioning stand above Journeyman, and the crafter's limit holds Smithing at rank 50)` : `(+${paid} Smithing XP, with the first-time bonus)`;
    return [room, room >= earned ? FIRST(60, 'Smithing') : LIMIT(room, 'Smithing', 'Building and Provisioning'), paid, true, HELD - room + paid, word];
  }));
  // the law the line and the Worker share
  assert.deepEqual([0, 1, 559, 560, 561].map((room) => law.creditedXp?.(earned, room)), [0, 1, 559, 560, 560]);
  assert.deepEqual([law.creditedXp?.(-5, 10), law.creditedXp?.(60, Infinity), law.creditedXp?.(Number.NaN, 10)], [0, 60, 0], 'never below none, no bound unread');
});

test('CRAFT-LIMIT-SAID the Firmament\'s hand: a tree to Anvil\'s Song in force, the anvil\'s line says the 60 with its Smithing percent on it (scaleXp) and the 500 whole, as the Worker pays it - the line said 60; the jeweller\'s Ring its craft\'s percent; the anvil\'s temper its percent, as the Worker pays it (mutants: the percent unread; the 500 scaled; a discipline\'s percent its own; a temper\'s figure unscaled)', async (t) => {
  t.mock.method(Date, 'now', () => NOON * 1000);
  _resetFirmamentLiveForTests();
  const { raw, mac, track, give, book } = await standBook({ FIRMAMENT_OPEN: 'on' });
  // the law's own shortest walk from the Warrior's start to Anvil's Song (+8% Smithing experience)
  const song = [...FIRM_NODES.values()].find((n) => n.name === 'Anvil\'s Song');
  const tree = { start: 'wr.start', keys: [] };
  tree.keys.push(...pathTo(tree, song.key));
  const pct = xpPct(treeStats(tree), 'smithing');
  assert.ok(pct >= 8, `the stars' Smithing experience (${pct}%)`);
  raw.prepare('INSERT INTO firmament (player, char_id, tree, updated_at) VALUES (?, ?, ?, ?)').run(mac.id, mac.character, packTree(tree), NOON);
  setFirmamentOnline(true);
  setFirmamentTree(tree);
  track('smithing', xpForRank(30));
  for (const [m, n] of [['ingot:silver', 10], ['metal:tin', 10], ['metal:silver', 5], ['ingot:steel', 10]]) give(m, n);
  assert.equal((await book.refresh()).ok, true);
  const page = standPage(book, {
    forge: true, jeweller: true,
    temperable: (where) => (where === 'anvil' ? [{ item: {}, name: 'Steel Longsword', recipe: 'longsword:steel', quality: 1, provenance: null }] : []),
  });
  const xp = scaleXp(craftXp(3, 30, false), pct), temper = scaleXp(craftXp(2, 30, false), pct);
  try {
    page.press('The Anvil', 'Dagger');
    page.press('The Anvil', 'Silver', true);
    assert.ok(xp > 60, `the percent moves it (${pct}%)`);
    assert.equal(page.box('The Anvil')[1].at(-1), FIRST(xp, 'Smithing'));
    page.press('The Jeweller\'s Bench', 'Silver Ring');
    assert.equal(page.box('The Jeweller\'s Bench')[1].at(-1), FIRST(scaleXp(craftXp(1, 30, false), pct), 'Smithing'), 'a Ring is Smithing\'s, its percent the craft\'s');
    assert.match(page.text('Temper at the Anvil'), new RegExp(`Steel Longsword.*Standard to Fine - 2 ingot:steel, \\+${temper} Smithing XP`));
    const r = await book.craft('dagger:silver', { clean: false, name: 'Mac' }, (data) => mintPieces(data));
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.deepEqual([r.data.xp, r.data.first], [xp + FIRST_CRAFT_XP, true], 'the Worker\'s: the percent on the 60, the 500 whole');
    const tr = await book.temper('longsword:steel', 1, null);
    assert.equal(tr.ok, true, JSON.stringify(tr));
    assert.equal(tr.data.xp, temper, 'the Worker\'s temper: the row\'s figure');
  } finally { page.done(); _resetFirmamentLiveForTests(); }
});

// ─── EVERY STATION ───────────────────────────────────────────────────

test('CRAFT-LIMIT-SAID every station says it, read off the real book - Building and Provisioning past: the jeweller\'s Silver Ring on Smithing, the loom\'s Boots on Outfitting, the loom\'s temper and the enchanting station each piece +0 and the limit once; Smithing and Outfitting past: the workbench\'s Staff and the mason\'s works on Building, the fire (no pans\' XP) and the alchemy station on Provisioning; a little room "At most"; and the Worker pays the fire none (mutants: each station\'s pay unread; the fire\'s pans\' XP said at none; the temper\'s and the disenchant\'s figure and line)', async (t) => {
  t.mock.method(Date, 'now', () => NOON * 1000);
  const A = await standBook();
  A.track('building', xpForRank(60));
  A.track('provisioning', xpForRank(55));
  for (const p of ['smithing', 'outfitting', 'enchanting']) A.track(p, HELD);
  for (const [m, n] of [['metal:silver', 5], ['cloth:linen', 5], ['leather:cured', 5]]) A.give(m, n);
  assert.equal((await A.book.refresh()).ok, true);
  const BP = 'Building and Provisioning';
  let page = standPage(A.book, {
    jeweller: true, loom: true, enchanter: true,
    disenchantable: () => [{ provenance: 'aaaaaaaaaaaaaaaa', name: 'Gold Ruby Ring', points: 2160, essence: 21, recipe: 'ring:gold:ruby' }],
    temperable: (where) => (where === 'loom' ? [{ item: {}, name: 'Leather Cuirass', recipe: 'leather-cuirass:cured', quality: 1, provenance: null }] : []),
  });
  try {
    page.press('The Jeweller\'s Bench', 'Silver Ring');
    assert.equal(page.box('The Jeweller\'s Bench')[1].at(-1), LIMIT(0, 'Smithing', BP), 'a jewel raises Smithing');
    page.press('The Loom', 'Clothing', true);
    page.press('The Loom', 'Boots');
    assert.equal(page.box('The Loom')[1].at(-1), LIMIT(0, 'Outfitting', BP));
    assert.ok(page.notes('Temper at the Loom').includes(LIMIT(0, 'Outfitting', BP)), page.notes('Temper at the Loom').join('|'));
    assert.match(page.text('Temper at the Loom'), /Leather Cuirass.*Standard to Fine - .*, \+0 Outfitting XP/);
    assert.ok(page.notes('The Enchanting Station').includes(LIMIT(0, 'Enchanting', BP)), page.notes('The Enchanting Station').join('|'));
    assert.match(page.text('The Enchanting Station'), /Gold Ruby Ring2,160 points - 21 Arcane Essence, \+0 Enchanting XP/);
  } finally { page.done(); }
  const B = await standBook();
  B.track('smithing', xpForRank(60));
  B.track('outfitting', xpForRank(60));
  for (const p of ['building', 'provisioning']) B.track(p, HELD);
  for (const [m, n] of [['plank:pine', 9], ['stone:rough', 9], ['food:meat', 9], ['food:mushroom', 9], ['p1:13', 9]]) B.give(m, n);
  assert.equal((await B.book.refresh()).ok, true);
  const SO = 'Smithing and Outfitting';
  page = standPage(B.book, { workbench: true, mason: true, fire: true, alchemy: true });
  try {
    page.press('The Workbench', 'Staff');
    assert.equal(page.box('The Workbench')[1].at(-1), LIMIT(0, 'Building', SO));
    assert.ok(page.notes('The Mason\'s Bench').includes(LIMIT(0, 'Building', SO)), 'the works\' first: none');
    page.press('The Fire', 'Hunter\'s Stew');
    const fire = page.box('The Fire')[1];
    assert.deepEqual(fire.slice(-2), ['One serving, into your pack. 3 pans.', LIMIT(0, 'Provisioning', SO)], 'no pans\' XP said where none is paid');
    page.press('The Alchemy Station', 'Water Breathing');
    assert.match(page.box('The Alchemy Station')[1].join('|'), new RegExp(`\\.( |\\|)${LIMIT(0, 'Provisioning', SO).replace(/[.()]/g, '\\$&')}`));
  } finally { page.done(); }
  // a little room: the alchemy station says what is left of it, and the Worker pays the fire what the line said - none
  B.track('provisioning', HELD - 10);
  assert.equal((await B.book.refresh({ force: true })).ok, true);
  page = standPage(B.book, { fire: true, alchemy: true });
  try {
    page.press('The Alchemy Station', 'Water Breathing');
    assert.match(page.box('The Alchemy Station')[1].join('|'), /At most 10 Provisioning XP: Smithing and Outfitting stand above Journeyman/);
    page.press('The Fire', 'Hunter\'s Stew');
    assert.equal(page.box('The Fire')[1].at(-1), LIMIT(10, 'Provisioning', SO));
    assert.match(page.box('The Fire')[1].at(-2), /half again its 80 Provisioning XP\.$/, 'room left: the pans\' XP said, the limit after it');
  } finally { page.done(); }
  B.track('provisioning', HELD);
  assert.equal((await B.book.refresh({ force: true })).ok, true);
  const dish = await B.book.craft('stew:north', { clean: true, name: 'Mac' }, (data) => mintPieces(data));
  assert.equal(dish.ok, true, JSON.stringify(dish));
  assert.deepEqual([dish.data.xp, dish.data.first, B.xpOf('provisioning')], [0, true, HELD], 'the fire\'s none: a clean pan\'s and a first\'s, the cap took them');
  assert.equal(cookXp(50, { clean: true }), 120, 'what the clean pan earned');
});

// ─── THE TAB, MASTER, THE LAW ────────────────────────────────────────

test('CRAFT-LIMIT-SAID the tab before the choice and the top: none past - the rule says what a second past 50 does, for good; a gathering track is never held, however many crafts stand past; a Master\'s station line says none (the service credits none at PROF_XP_MAX) and one short of it "At most" (mutants: the rule\'s two arms; the gathering guard; Master\'s arm)', async (t) => {
  t.mock.method(Date, 'now', () => NOON * 1000);
  const { track, book } = await standBook();
  track('smithing', xpForRank(40));
  assert.equal((await book.refresh()).ok, true);
  assert.deepEqual(tabOf(book, 'smithing'), {
    xp: '16,000 / 16,810 XP',
    limit: 'Crafts above Journeyman: 0 of 2',
    rule: 'A character raises only 2 crafts past Journeyman; once 2 of yours pass rank 50, the others stop there. No craft\'s rank is ever lowered.',
  });
  track('building', xpForRank(70));
  track('enchanting', xpForRank(51));
  track('mining', xpForRank(51) - 1);
  assert.equal((await book.refresh({ force: true })).ok, true);
  assert.equal(tabOf(book, 'mining').xp, '26,009 / 26,010 XP', 'Gathering is unlimited (3.2): never the ceiling\'s line');
  assert.deepEqual(book.limit?.('mining'), { cap: PROF_XP_MAX, room: PROF_XP_MAX - HELD, by: [] });
  assert.deepEqual(book.limit?.('jewelcrafting'), { cap: HELD, room: HELD - xpForRank(40), by: ['building', 'enchanting'] }, 'a discipline its craft\'s');
  // a Master: the service's MIN(earned, PROF_XP_MAX - held) is none
  const dagger = recipeById('dagger:iron');
  assert.equal(words.craftXpLine(dagger, 100, 'Smithing', { limit: law.craftLimit?.('smithing', { smithing: 100 }, PROF_XP_MAX) }), 'No Smithing XP: Smithing is at Master.');
  assert.equal(words.craftXpLine(dagger, 99, 'Smithing', { limit: law.craftLimit?.('smithing', { smithing: 99 }, PROF_XP_MAX - 3) }), 'At most 3 Smithing XP: Smithing stops at Master.');
  assert.equal(words.craftXpLine(dagger, 99, 'Smithing', { limit: law.craftLimit?.('smithing', { smithing: 99 }, PROF_XP_MAX - 505) }), FIRST(5, 'Smithing'), 'room for it all: the line as ever');
});

test('CRAFT-LIMIT-SAID the law: craftLimit is craftXpCap\'s ceiling with its room and the crafts that hold it, in the tab\'s order - two others past 50 hold a craft, one does not, its own rank never, a discipline its craft\'s, a gathering track never; craftLimitOf reads it off the service\'s track views by their XP; the host hands the craft\'s word the book\'s limit in its one call (mutants: the order; the room\'s floor; the views\' ranks off their XP)', () => {
  const L = (p, ranks, xp) => law.craftLimit?.(p, ranks, xp);
  assert.deepEqual(L('smithing', { provisioning: 55, building: 60 }, HELD), { cap: HELD, room: 0, by: ['building', 'provisioning'] }, 'the tab\'s order, not the ranks\'');
  assert.deepEqual(L('smithing', { provisioning: 55, building: 60 }, HELD + 40), { cap: HELD, room: 0, by: ['building', 'provisioning'] }, 'never a room below none');
  assert.deepEqual(L('smithing', { provisioning: 55, building: 50 }, HELD), { cap: PROF_XP_MAX, room: PROF_XP_MAX - HELD, by: [] }, '50 is not past');
  assert.deepEqual(L('smithing', { smithing: 90, building: 60 }, xpForRank(90)), { cap: PROF_XP_MAX, room: PROF_XP_MAX - xpForRank(90), by: [] }, 'its own rank never counted');
  assert.deepEqual(L('cooking', { smithing: 60, building: 51, outfitting: 70 }, 100), { cap: HELD, room: HELD - 100, by: ['smithing', 'building', 'outfitting'] }, 'a discipline its craft\'s; three past, all named');
  assert.deepEqual(L('smithing', { smithing: 60, building: 60, provisioning: 60 }, xpForRank(60)), { cap: HELD, room: 0, by: ['building', 'provisioning'] }, 'three past (two crafts that crossed at once): the others hold it, never itself');
  assert.deepEqual(L('herbalism', { smithing: 60, building: 60 }, 5), { cap: PROF_XP_MAX, room: PROF_XP_MAX - 5, by: [] }, 'a gathering track never held');
  for (const [p, ranks] of [['smithing', { provisioning: 55, building: 60 }], ['enchanting', { smithing: 51, building: 50 }], ['masonry', { smithing: 60, provisioning: 70 }]]) {
    assert.equal(L(p, ranks, 0)?.cap, law.craftXpCap(p, ranks), `${p}: craftXpCap's ceiling, the one the service binds`);
  }
  const views = [{ profession: 'building', xp: xpForRank(60), rank: 0 }, { profession: 'provisioning', xp: xpForRank(51), rank: 0 }, { profession: 'smithing', xp: HELD - 7, rank: 0 }, null];
  assert.deepEqual(law.craftLimitOf?.(views, 'jewelcrafting'), { cap: HELD, room: 7, by: ['building', 'provisioning'] }, 'ranks the service\'s own, off the XP');
  assert.deepEqual(law.craftLimitOf?.([], 'smithing'), { cap: PROF_XP_MAX, room: PROF_XP_MAX, by: [] }, 'no tracks read: no limit');
  // THE HOSTS DO NOT GROW: world.js's craft word hands the book's limit in, in its one call
  assert.match(hostText('src/scenes/world.js'), /\$\{made\} \$\{craftXpText\(rec, r\.data, st\.xp, profBook\.limit\(rec\?\.profession\)\)\}\$\{paid \?/);
});
