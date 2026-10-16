// VIRT (2026-10-16) - THE LONG PACK: a long list draws the rows on screen, a landed picture goes into its own tile, an
// ask keeps a fitted picture, and an item's line is read once a pass.
//
// The windowing is DRIVEN over a document that lays its rows out (a wrapping grid of fixed rows and a gap, the dock's
// shape, or one column, the loot window's): every drawn row must stand exactly where the whole list stands it, the list
// must be exactly as tall, and the rows a scroll keeps must be the same nodes. The picture is driven too - a real
// replacement record through requestIcon and the fitted door into a mounted pack - and the browser half is
// tools/packVirtProbe.mjs (700 pieces, a container, the player's storage and the pack, a desktop and a phone).
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { virtualRows, VIRTUAL_MIN, VIRTUAL_FIRST } from '../src/ui/virtualRows.js';
import { requestFittedPicture, _fittedKeys, FIT_CACHE_MAX } from '../src/ui/textureCanvas.js';
import { mountEnhancedInventory } from '../src/ui/enhancedInventory.js';
import { fakeDom, withDom } from './invdrag.mjs';
import { createWeapon } from '../src/combat/enemyEquipment.js';
import { inventoryItemImage } from '../src/systems/itemTemplates.js';
import { textureKey, setTextureReplacements, clearTextureReplacements, preloadTextureRecord } from '../src/systems/textureReplacement.js';
import { setValue, _resetForTests as _resetSettings } from '../src/systems/settings.js';
import { _resetForTests } from '../src/systems/uiPrefs.js';

// ── A DOCUMENT THAT LAYS OUT ─────────────────────────────────────

/** One list in a box that scrolls: its children flow `cols` to a line of `rowH`, `gap` between lines, `pad` above the
 *  first; a spacer (`.vrows-gap`) is a whole line of its own height. Every rect is computed from the flow as it stands. */
function laidList({ cols = 4, rowH = 50, gap = 6, pad = 8, top = 100, view = 300, measurable = true } = {}) {
  const heard = new Map();
  const doc = { createElement: (t) => mk(t) };
  /** @returns {any} */
  function mk(tag) {
    const n = {
      tagName: tag.toUpperCase(), nodeType: 1, children: [], parentElement: null, style: {}, className: '', attrs: {}, ownerDocument: doc,
      get isConnected() { let a = n; while (a.parentElement) a = a.parentElement; return a === list; },
      get firstChild() { return n.children[0] ?? null; },
      append(...cs) { for (const c of cs) { c.remove(); c.parentElement = n; n.children.push(c); } },
      insertBefore(c, ref) { c.remove(); c.parentElement = n; const i = ref ? n.children.indexOf(ref) : -1; if (i < 0) n.children.push(c); else n.children.splice(i, 0, c); return c; },
      remove() { const p = n.parentElement; if (!p) return; p.children.splice(p.children.indexOf(n), 1); n.parentElement = null; },
      setAttribute(k, v) { n.attrs[k] = String(v); },
      addEventListener(t, f) { heard.set(t, [...(heard.get(t) ?? []), f]); },
      removeEventListener(t, f) { heard.set(t, (heard.get(t) ?? []).filter((x) => x !== f)); },
      getBoundingClientRect() { return rectOf(n); },
    };
    return n;
  }
  const list = mk('div');
  list.scrollTop = 0;
  /** Each child's top in the content, and the content's height. */
  const flow = () => {
    const at = new Map();
    let y = pad, inLine = 0;
    for (const c of list.children) {
      if (c.className === 'vrows-gap') {
        if (inLine) { y += rowH + gap; inLine = 0; }
        at.set(c, y);
        y += parseFloat(c.style.height) + gap;
        continue;
      }
      at.set(c, y);
      if (++inLine === cols) { y += rowH + gap; inLine = 0; }
    }
    if (inLine) y += rowH + gap;
    return { at, height: y - gap + pad };
  };
  const rectOf = (n) => {
    if (n === list) return { top, bottom: top + view, height: view };
    if (!measurable) return { top: 0, bottom: 0, height: 0 };
    const y = top + flow().at.get(n) - list.scrollTop;
    const h = n.className === 'vrows-gap' ? parseFloat(n.style.height) : rowH;
    return { top: y, bottom: y + h, height: h };
  };
  return {
    list, mk, heard,
    height: () => flow().height,
    /** The whole list's content height for `n` rows. */
    whole: (n) => pad + Math.ceil(n / cols) * (rowH + gap) - gap + pad,
    /** Where the whole list stands row `i`. */
    placeOf: (i) => pad + Math.floor(i / cols) * (rowH + gap),
    topOf: (n) => flow().at.get(n),
    set cols(c) { cols = c; },
  };
}
const withLayout = (fn) => {
  const saved = { cs: globalThis.getComputedStyle, ih: globalThis.innerHeight, raf: globalThis.requestAnimationFrame };
  return (dom) => {
    globalThis.getComputedStyle = (n) => ({ overflowY: n === dom.list ? 'auto' : 'visible', position: 'static' });
    globalThis.innerHeight = 1000;
    globalThis.requestAnimationFrame = () => 0;
    try { return fn(dom); } finally { globalThis.getComputedStyle = saved.cs; globalThis.innerHeight = saved.ih; globalThis.requestAnimationFrame = saved.raf; }
  };
};
const items = (n) => Array.from({ length: n }, (_, i) => ({ i }));
/** Draw `its` into the laid list; every row it builds is counted, and carries its item's index. */
const drawInto = (dom, its) => {
  let built = 0;
  const v = virtualRows(dom.list, its, (it) => { built++; const r = dom.mk('button'); r.className = 'itemrow'; r.i = it.i; return r; });
  return { v, built: () => built };
};
const drawn = (dom) => dom.list.children.filter((c) => c.className === 'itemrow');
/** Every drawn row stands where the whole list stands it, and the list is the whole list's height. */
const placedRight = (dom, n) => {
  for (const r of drawn(dom)) assert.equal(dom.topOf(r), dom.placeOf(r.i), `row ${r.i} at its place`);
  assert.equal(dom.height(), dom.whole(n), 'the list as tall as the whole list');
};
/** The rows whose box meets the view, by index. */
const seen = (dom) => drawn(dom).filter((r) => { const b = r.getBoundingClientRect(); return b.bottom > 100 && b.top < 400; }).map((r) => r.i);

test('VIRT rows: a list under VIRTUAL_MIN is drawn whole, every row in order, with no spacer - what every list was', () => {
  withLayout((dom) => {
    const { v, built } = drawInto(dom, items(VIRTUAL_MIN - 1));
    v.sync();
    assert.equal(built(), VIRTUAL_MIN - 1);
    assert.deepEqual(drawn(dom).map((r) => r.i), items(VIRTUAL_MIN - 1).map((x) => x.i));
    assert.equal(dom.list.children.length, VIRTUAL_MIN - 1, 'no spacer');
    assert.equal(dom.heard.get('scroll'), undefined, 'and nothing listened to');
  })(laidList());
});

test('VIRT rows: a long list draws the rows in view and a margin, every drawn row at the whole list\'s place, the list the whole list\'s height - at its top, its middle and its foot (mutants: the spacer\'s gap not taken off; the window never moved)', () => {
  withLayout((dom) => {
    const N = 700;
    const { v, built } = drawInto(dom, items(N));
    assert.equal(built(), VIRTUAL_FIRST, 'before it is measured: the first rows');
    v.sync({ draw: false });
    placedRight(dom, N);   // measured, and the spacer stood for the rest - a scroll given back has its room
    v.sync();
    placedRight(dom, N);
    assert.ok(drawn(dom).length < 100, `${drawn(dom).length} drawn of ${N}`);
    assert.deepEqual(seen(dom), Array.from({ length: seen(dom).length }, (_, i) => i), 'the top of the list in view');
    for (const at of [9000, 4550, 1, 0, dom.whole(N) - 300]) {
      dom.list.scrollTop = at;
      v.sync();
      placedRight(dom, N);
      const s = seen(dom);
      assert.ok(s.length >= 20, `${s.length} rows seen at ${at}`);
      const first = Math.floor(Math.max(0, at - 8) / 56) * 4;
      assert.equal(s[0], first, `the first row in view at ${at} is the whole list's`);
      assert.deepEqual(s, Array.from({ length: s.length }, (_, i) => first + i), `every row in view at ${at}, none missing`);
    }
    assert.equal(drawn(dom).at(-1).i, N - 1, 'at the foot the last piece is drawn');
    assert.equal(dom.list.children.at(-1).className, 'itemrow', '...and nothing stands below it');
  })(laidList());
});

test('VIRT rows: a scroll keeps the rows it keeps - the same nodes, never rebuilt - and a scroll inside the margin rebuilds nothing at all; one column (the loot window) is laid the same way (mutants: the window rebuilt whole on every move)', () => {
  withLayout((dom) => {
    const { v, built } = drawInto(dom, items(400));
    v.sync();
    const before = new Map(drawn(dom).map((r) => [r.i, r]));
    const n0 = built();
    dom.list.scrollTop = 56;   // one line: still inside the margin
    v.sync();
    assert.equal(built(), n0, 'a line\'s scroll builds nothing');
    dom.list.scrollTop = 600;   // ten lines: past the margin, the window overlapping the one before
    v.sync();
    const after = drawn(dom);
    const kept = after.filter((r) => before.has(r.i));
    assert.ok(built() > n0, 'the window moved');
    assert.ok(kept.length > 0 && kept.length < before.size, 'and overlaps the one before');
    for (const r of kept) assert.equal(r, before.get(r.i), `row ${r.i} is the node it was`);
    assert.equal(built() - n0, after.length - kept.length, 'only the rows that entered were built');
    placedRight(dom, 400);
  })(laidList());
  withLayout((dom) => {
    const { v } = drawInto(dom, items(300));
    v.sync();
    dom.list.scrollTop = 7000;
    v.sync();
    placedRight(dom, 300);
  })(laidList({ cols: 1, rowH: 52, gap: 0, pad: 0 }));
});

test('VIRT rows: measured again when the columns change (a resize), the window is laid on the new ones; a list that cannot be measured is drawn whole; a disposed list lets go of its scroll', () => {
  const lay = laidList();
  withLayout((dom) => {
    const { v } = drawInto(dom, items(500));
    v.sync();
    dom.list.scrollTop = 3000;
    v.sync();
    dom.cols = 3;
    v.sync({ remeasure: true });
    dom.list.scrollTop = 3001;
    v.sync();
    for (const r of drawn(dom)) assert.equal(dom.topOf(r), 8 + Math.floor(r.i / 3) * 56, `row ${r.i} on three columns`);
    assert.equal(dom.height(), 8 + Math.ceil(500 / 3) * 56 - 6 + 8);
    assert.equal(dom.heard.get('scroll').length, 1, 'its scroller listened to');
    v.dispose();
    assert.equal(dom.heard.get('scroll').length, 0, 'and let go');
  })(lay);
  withLayout((dom) => {
    const { v, built } = drawInto(dom, items(300));
    v.sync();
    assert.equal(built(), 300, 'no layout to measure: every row');
    assert.equal(v.whole, true);
    assert.deepEqual(drawn(dom).map((r) => r.i), items(300).map((x) => x.i));
  })(laidList({ measurable: false }));
});

// ── THE FITTED PICTURES ──────────────────────────────────────────

test('VIRT cache: a fitted picture asked for again goes to the back of the line - the bound lets go of the one asked LEAST recently, never one a list keeps asking for (mutant: the bound by the order made)', () => {
  const key = (s) => `${s}@10x1c4`;
  requestFittedPicture('virtLRU_keep', () => null, { box: 10 });
  for (let i = 0; i < FIT_CACHE_MAX - 1; i++) requestFittedPicture(`virtLRU_${i}`, () => null, { box: 10 });
  requestFittedPicture('virtLRU_keep', () => null, { box: 10 });   // asked again: used
  requestFittedPicture('virtLRU_new', () => null, { box: 10 });
  const keys = _fittedKeys();
  assert.ok(keys.length <= FIT_CACHE_MAX);
  assert.ok(keys.includes(key('virtLRU_keep')), 'the picture asked again stays');
  assert.ok(!keys.includes(key('virtLRU_0')), 'the one asked longest ago went');
  assert.ok(keys.includes(key('virtLRU_new')));
  assert.ok(FIT_CACHE_MAX >= 2000, 'a long store\'s pictures, at two boxes, fit');
});

// ── A PICTURE LANDS INTO ITS TILE ────────────────────────────────

/** Canvases that carry a picture's opacity and say their size in their data URL; an Image that reads it back. */
function canvases(dom) {
  const mk0 = dom.doc.createElement;
  dom.doc.createElement = (t) => {
    if (t !== 'canvas') return mk0(t);
    const c = { width: 0, height: 0, alpha: null };
    const ctx = {
      imageSmoothingEnabled: true, imageSmoothingQuality: 'low',
      createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
      putImageData(img) { c.alpha = (x, y) => img.data[(y * img.width + x) * 4 + 3]; },
      getImageData(x0, y0, w, h) {
        const data = new Uint8ClampedArray(w * h * 4);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) data[(y * w + x) * 4 + 3] = c.alpha?.(x0 + x, y0 + y) ?? 0;
        return { data };
      },
      drawImage(from) { if (from.alpha) c.alpha = from.alpha; },
    };
    c.getContext = () => ctx;
    c.toDataURL = () => `data:image/png;src-${c.width}x${c.height}`;
    return c;
  };
  return class {
    set src(u) { this.u = u; const m = /src-(\d+)x(\d+)/.exec(u); this.naturalWidth = Number(m?.[1] ?? 0); this.naturalHeight = Number(m?.[2] ?? 0); this.alpha = () => 255; }
    get src() { return this.u; }
    decode() { return Promise.resolve(); }
  };
}
const settle = async () => { for (let i = 0; i < 30; i++) await new Promise((r) => setTimeout(r, 0)); };

test('VIRT tiles: a cold picture landing goes into the tile that waited on it - the same row, its wear bar kept, the picture the door made - and the pack is not repainted; the pictures that land together are one pass (mutants: a landing repaints the pack; the tile left on its initials; the wear bar lost)', async () => {
  _resetForTests();
  globalThis.location = { search: '?skin=enhanced' };
  setValue('Enhancements', 'AssetInjection', 'True');
  const dom = fakeDom();
  const Image = canvases(dom);
  const frames = [];
  const saved = { doc: globalThis.document, add: globalThis.addEventListener, rem: globalThis.removeEventListener, raf: globalThis.requestAnimationFrame, img: globalThis.Image };
  Object.assign(globalThis, { document: dom.doc, addEventListener: dom.win.addEventListener, removeEventListener: dom.win.removeEventListener, requestAnimationFrame: (f) => { frames.push(f); return frames.length; }, Image });
  const flush = () => { const fs = frames.splice(0); for (const f of fs) f(); return fs.length; };
  let view = null;
  try {
    const e = { isPlayer: true, name: 'Aelwyn', career: { name: 'Spellsword' }, level: 5, stats: { strength: 50, endurance: 48 }, activeEffects: [], spells: [], items: [], goldPieces: 0 };
    const dagger = createWeapon(113, 3);
    dagger.currentCondition = Math.round(dagger.maxCondition / 2);   // worn: its tile carries a bar
    e.items = [dagger];
    const img = inventoryItemImage(dagger, e);
    // the record's bytes are held back until the pack has mounted and settled (the doll's own repaint is a repaint):
    // the door's read joins this one in flight, so the picture lands when the gate opens and not before
    let open = () => {};
    const gate = new Promise((res) => { open = res; });
    clearTextureReplacements();
    setTextureReplacements([`${textureKey(img.archive, img.record, 0, 'Albedo', img.dye)}.png`], async () => { await gate; return new Uint8Array([1]); });
    const read = preloadTextureRecord(img.archive, img.record, 0, 'Albedo', img.dye, { decode: async () => ({ width: 2, height: 2, data: new Uint8Array(16).fill(255) }) });
    const host = dom.mk('div');
    dom.body.append(host);
    view = mountEnhancedInventory(host, { entity: e, items: () => e.items, onExit: () => {} });
    await settle();
    flush();
    const row = host.querySelectorAll('.itemrow')[0];
    const tile = row.querySelector('.tile');
    assert.ok(!tile.classList.contains('has-icon'), 'cold: the initials');
    assert.ok(tile.querySelector('.wear'), 'and its wear bar');
    const repaints = JSON.parse(globalThis.__pack()).repaints;
    open();
    await read;
    await settle();
    assert.ok(frames.length >= 1, 'the landing asked for a frame');
    flush();
    const now = row.querySelector('.tile');
    assert.equal(host.querySelectorAll('.itemrow')[0], row, 'the same row - nothing rebuilt it');
    assert.notEqual(now, tile, 'its tile swapped');
    assert.ok(now.classList.contains('has-icon'), 'for the picture');
    assert.match(now.querySelector('img')?.src ?? '', /^data:image\/png;src-\d+x\d+$/, 'the fitted door\'s picture');
    assert.ok(now.querySelector('.wear'), 'the wear bar carried into it');
    assert.equal(JSON.parse(globalThis.__pack()).repaints, repaints, 'the pack was not repainted');
    await settle();
    assert.equal(flush(), 0, 'nothing more to do: the pass ran once');
  } finally {
    view?.unmount();
    clearTextureReplacements();
    Object.assign(globalThis, { document: saved.doc, addEventListener: saved.add, removeEventListener: saved.rem, requestAnimationFrame: saved.raf, Image: saved.img });
    if (saved.doc === undefined) delete globalThis.document;
    if (saved.img === undefined) delete globalThis.Image;
    _resetSettings();
  }
});

// ── AN ITEM'S LINE, ONCE A PASS ──────────────────────────────────

test('VIRT lines: a pass reads each item once and a repaint reads it again - a stack that changed under the open pack says its new count on the next repaint, in the pack and in the store beside it (mutant: the lines kept across passes)', () => {
  _resetForTests();
  globalThis.location = { search: '?skin=enhanced' };
  withDom((dom) => {
    const arrows = createWeapon(131, 3);
    arrows.stackCount = 40;
    const stored = createWeapon(131, 3);
    stored.stackCount = 12;
    const e = { isPlayer: true, name: 'Aelwyn', career: { name: 'Spellsword' }, level: 5, stats: { strength: 50, endurance: 48 }, activeEffects: [], spells: [], items: [arrows], goldPieces: 0 };
    const store = [stored];
    const host = dom.mk('div');
    dom.body.append(host);
    const view = mountEnhancedInventory(host, { entity: e, items: () => e.items, loot: { items: () => store, storage: true }, onExit: () => {} });
    const names = () => host.querySelectorAll('.itemrow').map((r) => r.querySelectorAll('.itemname')[0].children[0].textContent);
    assert.deepEqual(names(), ['Arrow ×40', 'Arrow ×12']);
    arrows.stackCount = 7;
    stored.stackCount = 3;
    view.repaint();
    assert.deepEqual(names(), ['Arrow ×7', 'Arrow ×3'], 'the repaint read them again');
    view.unmount();
  });
});
