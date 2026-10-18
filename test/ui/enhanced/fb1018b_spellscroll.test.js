// SPELL-SCROLL (FIELD BUGS 2026-10-18b; the Discord's #bug-reports, cmagoun, "Minor: Spellbook -- Clicking a spell returns
// you to the top of a spell list": "Once you get a number of created/purchased spells in your book, this makes navigation
// awkward. Save the scroll position when you click a spell."). The enhanced book drew itself from nothing on every press
// (`host.innerHTML = ''`), and a list drawn from nothing stands at its top: measured in Chromium, 40 spells, the list at
// 600 px - a pick of Spell 15 put it at 0, Spell 01 lit under the pointer. And the one scroll was the window's body, the
// list and the chosen spell's page together, so a spell picked down the list had its page scrolled away above it. The
// Chronicle (the same journal bones) lost its page the same way on every fold, remove, share or abandon.
//
// The book is drawn through the house's one repaint (ui/domRepaint.js), the list scrolls in its own column as DFU's ListBox
// does, a pane that names what it shows (`data-scroll-key`) starts at its top when it shows another thing, and the
// Chronicle is drawn the same way. The classic book never had the fault: ListBox.MouseClick (ListBox.cs:465-504) only
// selects, and the port keeps it - pinned here against it being lost.
//
// The suite's minimal DOM (test/chargenDom.mjs) has no layout: a node's scrollTop is a number it keeps, and a node built new
// starts at 0, as a browser's does. So a pane's offset after a press can only be the one the repaint carried across.
import { byClass } from '../../chargenDom.mjs';   // the suite's minimal DOM (its side effect: the globals)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mountEnhancedSpellbook } from '../../../src/ui/enhanced/enhancedSpellbook.js';
import { mountEnhancedChronicle } from '../../../src/ui/enhanced/enhancedChronicle.js';
import { repaintKeepingScroll } from '../../../src/ui/domRepaint.js';
import { ENHANCED_CSS } from '../../../src/ui/enhanced/enhancedStyle.js';
import { SpellbookWindow, SPELLBOOK_RECTS } from '../../../src/ui/spellbookWindow.js';
import { buildCustomSpell, blankEffectSettings } from '../../../src/systems/spell/spellMaker.js';
import { PlayerNotebook } from '../../../src/systems/notebook.js';

globalThis.window ??= globalThis;   // the two windows listen on the window's keys (audit_guide.test.js's own line)

/** The book a player who has made forty spells holds - the Spell Maker's own records (systems/spell/spellMaker.js). */
const bookOf = (n) => Array.from({ length: n }, (_, i) => buildCustomSpell({
  slots: [{ type: 0, subType: 0, settings: blankEffectSettings() }], name: `Spell ${String(i).padStart(2, '0')}`,
}));
const one = (root, cls) => { const all = byClass(root, cls); assert.equal(all.length, 1, `one .${cls}`); return all[0]; };
/** A CSS rule's body by its exact selector, a rule that opens its own line, or null. */
const ruleOf = (css, selector) => new RegExp(`^${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`, 'm').exec(css)?.[1] ?? null;

test('SPELL-SCROLL the enhanced book: a spell picked down the list leaves the list where it was - drawn again, never moved - and the pick is the one shown; a press on the same spell\'s page keeps the page, another spell\'s page starts at its top (mutants: the book drawn past the repaint; the page\'s key dropped; the helper recording nothing)', () => {
  const spells = bookOf(40);
  const host = document.createElement('div');
  document.body.append(host);
  const view = mountEnhancedSpellbook(host, { spells: () => spells, castCost: () => 5, entity: { magicka: 50 }, onExit: () => {}, onReady: () => {} });
  try {
    const rail0 = one(host, 'px-qrail');
    rail0.scrollTop = 600;   // the player scrolled down to the spells past the first dozen
    const row = byClass(host, 'px-qrow')[20];
    assert.ok(row.textContent.includes('Spell 20'));
    row.onclick();
    const rail1 = one(host, 'px-qrail');
    assert.notEqual(rail1, rail0, 'the book was drawn again from nothing (the one-way render law) - its list a new node');
    assert.equal(rail1.scrollTop, 600, 'and the list stands where the player left it');
    assert.deepEqual(byClass(host, 'px-qrow').filter((r) => r.className.split(/\s+/).includes('on')).map((r) => r.textContent.replace('◆', '').replace(/5$/, '')), ['Spell 20'], 'the row picked is the row lit');
    assert.equal(one(host, 'px-qname').textContent, 'Spell 20', 'and the page beside the list is its spell');
    // the page: kept for a press on the same spell, its top for another spell
    one(host, 'px-qdetail').scrollTop = 120;
    byClass(host, 'act').find((b) => b.textContent === 'Rename').onclick();
    assert.equal(one(host, 'px-qdetail').scrollTop, 120, 'the same spell\'s page keeps its place under a press');
    assert.equal(one(host, 'px-qdetail').getAttribute('data-scroll-key'), '20', 'the page names the spell it shows');
    byClass(host, 'px-qrow')[21].onclick();
    assert.equal(one(host, 'px-qdetail').scrollTop, 0, 'another spell\'s page starts at its top');
    assert.equal(one(host, 'px-qrail').scrollTop, 600, 'while the list keeps its place');
    // the delete's two presses, answered No and then Yes: the list stays put under both
    byClass(host, 'act').find((b) => b.textContent === 'Delete').onclick();
    assert.equal(one(host, 'px-qrail').scrollTop, 600, 'the question asked over the list');
    byClass(host, 'act').find((b) => b.textContent === 'Yes').onclick();
    assert.equal(spells.length, 39, 'the spell is gone');
    assert.equal(one(host, 'px-qrail').scrollTop, 600, 'and the list where it was');
  } finally { view.destroy(); host.remove(); }
});

test('SPELL-SCROLL the book\'s layout: the list scrolls in its own column, the page beside it in its own - the body holds them and scrolls neither; the journal is held to the body, not grown with its rows (mutants: each of the three rules)', () => {
  assert.equal(ruleOf(ENHANCED_CSS, '.sb-shell .px-body'), ' display: flex; flex-direction: column; overflow: hidden; ');
  assert.equal(ruleOf(ENHANCED_CSS, '.sb-shell .px-journal'), ' flex: 1 1 auto; min-height: 0; ');
  assert.equal(ruleOf(ENHANCED_CSS, '.sb-shell .px-qrail, .sb-shell .px-qdetail'), ' min-height: 0; overflow-y: auto; ');
  // ...over the journal's own sheet, which grows with its content and scrolls the body - the pause window's pages keep it
  assert.match(ENHANCED_CSS, /^\.px-journal \{ display: flex; gap: 0; min-height: 100%; \}$/m);
  assert.match(ENHANCED_CSS, /^\.px-body \{ flex: 1; overflow-y: auto; padding: 18px 26px; \}$/m);
  // the book's rules stand after the journal's (one class to two, and later): the cascade is theirs
  assert.ok(ENHANCED_CSS.indexOf('.sb-shell .px-body {') > ENHANCED_CSS.indexOf('.px-body { flex: 1;'));
});

test('SPELL-SCROLL the Chronicle: a card folded or a note removed down the page leaves the page where it was; another section starts at its top (mutants: the Chronicle drawn past the repaint; the section\'s key dropped)', () => {
  const nb = new PlayerNotebook({ dateTimeString: () => 'Morndas', cityName: () => 'Daggerfall' });
  for (let i = 0; i < 30; i++) nb.addNote(`Note ${i}: the miller at the old bridge owes me ${i} gold.`);
  for (let i = 0; i < 30; i++) nb.addMessage(`Message ${i}: the Baron wants a word.`);
  const host = document.createElement('div');
  document.body.append(host);
  const view = mountEnhancedChronicle(host, { notebook: () => nb, entity: { name: 'Janome' }, section: 'notes', onExit: () => {} });
  try {
    const body0 = one(host, 'px-body');
    body0.scrollTop = 900;
    byClass(host, 'cr-fold')[12].onclick();
    assert.notEqual(one(host, 'px-body'), body0, 'drawn again from nothing');
    assert.equal(one(host, 'px-body').scrollTop, 900, 'a card folded: the page where it was');
    assert.equal(one(host, 'px-body').getAttribute('data-scroll-key'), 'notes', 'the page names its section');
    byClass(host, 'cr-rm').find((b) => b.getAttribute('aria-label') === 'Remove this note').onclick();
    assert.equal(nb.getNotes().length, 29, 'the note is gone');
    assert.equal(one(host, 'px-body').scrollTop, 900, 'a note removed: the page where it was');
    byClass(host, 'cr-row').find((b) => b.textContent.startsWith('◆Messages')).onclick();
    assert.equal(one(host, 'px-body').getAttribute('data-scroll-key'), 'messages');
    assert.equal(one(host, 'px-body').scrollTop, 0, 'another section starts at its top');
  } finally { view.destroy(); host.remove(); }
});

test('SPELL-SCROLL the house\'s one repaint (ui/domRepaint.js): a scrolled pane is found again by its place and given its offset back; a pane that names what it shows keeps it for the same name and starts at the top for another; a pane at its top is left alone (mutants: the key out of the path; nothing recorded)', () => {
  const host = document.createElement('div');
  const draw = (key) => {
    host.innerHTML = '';
    const pane = document.createElement('div'); pane.className = 'pane';
    const keyed = document.createElement('div'); keyed.className = 'page';
    if (key != null) keyed.setAttribute('data-scroll-key', key);
    host.append(pane, keyed);
    return { pane, keyed };
  };
  let at = draw('a');
  at.pane.scrollTop = 300; at.keyed.scrollTop = 40;
  repaintKeepingScroll(host, () => { at = draw('a'); });
  assert.deepEqual([at.pane.scrollTop, at.keyed.scrollTop], [300, 40], 'the same tree, the same names: both kept');
  repaintKeepingScroll(host, () => { at = draw('b'); });
  assert.deepEqual([at.pane.scrollTop, at.keyed.scrollTop], [300, 0], 'another name: that pane starts at its top, the other keeps its place');
  at.keyed.scrollTop = 25;
  repaintKeepingScroll(host, () => { at = draw(null); });
  assert.equal(at.keyed.scrollTop, 0, 'a name dropped is another name');
  at.pane.scrollTop = 0;
  repaintKeepingScroll(host, () => { at = draw(null); at.pane.scrollTop = 50; });   // a screen that places its own pane
  assert.equal(at.pane.scrollTop, 50, 'a pane that stood at its top is not put back over the screen\'s own placing');
});

test('SPELL-SCROLL the classic book kept DFU\'s law all along - ListBox.MouseClick selects and never scrolls (ListBox.cs:465-504), and UpdateSelection reads the list\'s own ScrollIndex (DaggerfallSpellBookWindow.cs:507-512): a row clicked after the wheel moved the list leaves the list where the wheel put it (mutant: the click scrolling)', () => {
  const spells = bookOf(40);
  const win = new SpellbookWindow({ spells: () => spells, entity: { magicka: 100 }, castCost: () => 5, rows: () => [] });
  for (let i = 0; i < 9; i++) win.wheel(1);
  assert.equal(win.scrollIndex, 9, 'the wheel moved the list (SpellsListBox_OnMouseScroll) and not the selection');
  assert.equal(win.selectedIndex, 0);
  const [, ly] = SPELLBOOK_RECTS.list;
  const PANEL_X = (320 - SPELLBOOK_RECTS.main[2]) / 2, PANEL_Y = (200 - SPELLBOOK_RECTS.main[3]) / 2;
  win.click(PANEL_X + 20, PANEL_Y + ly + win._rowHeight() * 4 + 1);   // the fifth row showing
  assert.equal(win.selectedIndex, 13, 'the row under the pointer is picked');
  assert.equal(win.scrollIndex, 9, 'and the list stays where the wheel left it');
  assert.equal(win.selected, spells[13]);
});
