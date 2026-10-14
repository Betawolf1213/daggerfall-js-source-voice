// HUD-SADDLE (FIELD BUGS 2026-10-14, Discord: "Riding Window is not able to be edited in the HUD Editor (Alt+U)" - and
// "the horse care toggle in the settings menu doesn't seem to work"; bible/01-Overview/Field-Bugs-2026-10-14-riding-panel.md).
//
// THE RIDING PANEL IS A HUD PIECE. The saddle panel (ui/enhancedSaddle.js, STEED-UI) shipped ten days after HUD-MOVE
// (ui/hudLayout.js) and never joined its registry, so Alt+U framed the compass, the boss bar, the target bar and the
// temperature plate and left the panel under them with no frame: nothing could move it, size it or turn it off. Driven
// over a page that answers the selectors HUD-MOVE asks (descendants among them - the panel's bar stands inside its
// whole-screen layer) with the real sweep, the real panel and the real editor's key and handles.
//
// THE SWITCH, END TO END. Horse care's tile was traced to every reader and found sound: the key it writes is the key the
// switch reads, read live, and every door of the law and the panel asks it. Off the line it does what its words say at
// once; online it is the room's (forced on, the tile locked and saying so) - the design, recorded on the row and in
// 06-Systems/Horse-Care.md. Pinned here so the trace is the suite's claim and not the record's.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  HUD_PIECES, HUD_LAYOUT_CSS, HUD_LAYOUT_PREF, HUD_LOCK_PREF, sweepHudLayout, tickHudLayout, setHudLocked, resetHudLayout,
  _resetHudLayoutForTests,
} from '../src/ui/hudLayout.js';
import { drawEnhancedSaddle, hideEnhancedSaddle, buildSaddlePreview, ENHANCED_SADDLE_ID } from '../src/ui/enhancedSaddle.js';
import { getPref, setPref, _resetForTests as resetPrefs } from '../src/systems/uiPrefs.js';

const SRC = fileURLToPath(new URL('../src/', import.meta.url));
const rd = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

// ── a page HUD-MOVE can read ─────────────────────────────────────
/** A compound selector - `.a`, `#b`, `[c]`, `[c="v"]`, `.a[c="v"]` - against one node. */
function matchesCompound(n, sel) {
  const re = /([.#])([\w-]+)|\[([\w-]+)(?:="([^"]*)")?\]/g;
  let m, any = false, at = 0;
  while ((m = re.exec(sel))) {
    if (m.index !== at) return false;   // anything this page does not speak matches nothing
    at = re.lastIndex; any = true;
    if (m[1] === '.' && !String(n.className).split(/\s+/).includes(m[2])) return false;
    if (m[1] === '#' && n.id !== m[2]) return false;
    if (m[3] && !(m[3] in n.attrs)) return false;
    if (m[3] && m[4] != null && n.attrs[m[3]] !== m[4]) return false;
  }
  return any && at === sel.length;
}
/** A selector with descendants (`.a .b`): the last compound on the node, the others on its ancestors, in order. */
function matchesSelector(n, sel) {
  const parts = sel.trim().split(/\s+/);
  if (!matchesCompound(n, parts.pop())) return false;
  let up = n.parentElement;
  while (parts.length) {
    const want = parts.pop();
    while (up && !matchesCompound(up, want)) up = up.parentElement;
    if (!up) return false;
    up = up.parentElement;
  }
  return true;
}
const kebab = (k) => `data-${String(k).replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
function fakePage() {
  const doc = {};
  const walk = (n, out = []) => { for (const c of n.children) { out.push(c); walk(c, out); } return out; };
  const node = (tag) => {
    const n = {
      tagName: String(tag).toUpperCase(), children: [], parentElement: null, className: '', id: '', attrs: {}, listeners: {}, disabled: false, type: '', title: '',
      _text: '',
      get textContent() { return n._text + n.children.map((c) => c.textContent).join(''); },
      set textContent(v) { for (const c of n.children) c.parentElement = null; n.children = []; n._text = String(v ?? ''); },
      style: { props: {}, display: '', setProperty(k, v) { this.props[k] = String(v); }, removeProperty(k) { delete this.props[k]; }, getPropertyValue(k) { return this.props[k] ?? ''; } },
      append(...cs) { for (const c of cs) { if (!c) continue; c.remove?.(); c.parentElement = n; n.children.push(c); } },
      replaceChildren(...cs) { for (const c of n.children) c.parentElement = null; n.children = []; n.append(...cs); },
      setAttribute(k, v) { n.attrs[k] = String(v); },
      getAttribute(k) { return k in n.attrs ? n.attrs[k] : null; },
      hasAttribute(k) { return k in n.attrs; },
      removeAttribute(k) { delete n.attrs[k]; },
      addEventListener(t, fn) { (n.listeners[t] ??= []).push(fn); },
      matches(sel) { return sel.split(',').some((s) => matchesSelector(n, s)); },
      closest(sel) { for (let c = n; c; c = c.parentElement) if (c.matches(sel)) return c; return null; },
      querySelector(sel) { return walk(n).find((c) => c.matches(sel)) ?? null; },
      querySelectorAll(sel) { return walk(n).filter((c) => c.matches(sel)); },
      remove() { const p = n.parentElement; if (p) { p.children.splice(p.children.indexOf(n), 1); n.parentElement = null; } },
      blur() {},
      getBoundingClientRect() { return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }; },
    };
    // the browser's dataset: the data- attributes, by their camelled names
    n.dataset = new Proxy({}, {
      get: (_, k) => (typeof k === 'string' && kebab(k) in n.attrs ? n.attrs[kebab(k)] : undefined),
      set: (_, k, v) => { n.attrs[kebab(k)] = String(v); return true; },
      deleteProperty: (_, k) => { delete n.attrs[kebab(k)]; return true; },
    });
    return n;
  };
  doc.createElement = node;
  doc.head = node('head'); doc.body = node('body');
  const everything = () => [...walk(doc.head), ...walk(doc.body)];
  doc.querySelectorAll = (sel) => everything().filter((c) => c.matches(sel));
  doc.querySelector = (sel) => everything().find((c) => c.matches(sel)) ?? null;
  doc.getElementById = (id) => everything().find((c) => c.id === id) ?? null;
  // a window whose listeners the test fires: the editor's key and its presses
  const on = {};
  doc.defaultView = { addEventListener(t, fn) { (on[t] ??= []).push(fn); }, removeEventListener() {} };
  doc.fire = (t, ev) => { const e = { type: t, preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {}, ...ev }; for (const fn of on[t] ?? []) fn(e); return e; };
  return doc;
}

/** The enhanced skin (the movable HUD and the panel are Enhanced Plus's), a layout, a fresh HUD-MOVE; torn down after. */
async function withPage(layout, fn) {
  const had = { loc: Object.hasOwn(globalThis, 'location') ? globalThis.location : undefined, doc: Object.hasOwn(globalThis, 'document') ? globalThis.document : undefined };
  globalThis.location = { search: '?skin=enhanced' };
  const doc = fakePage();
  globalThis.document = doc;
  resetPrefs(); _resetHudLayoutForTests();
  if (layout) setPref(HUD_LAYOUT_PREF, layout);
  try { return await fn(doc); } finally {
    hideEnhancedSaddle();
    _resetHudLayoutForTests(); resetPrefs();
    if (had.loc === undefined) delete globalThis.location; else globalThis.location = had.loc;
    if (had.doc === undefined) delete globalThis.document; else globalThis.document = had.doc;
  }
}

/** A saddle's read as the host hands it the panel (scenes/saddleHost.js read). */
const S = (o = {}) => ({
  mode: 'Horse', name: 'Shadow', wagonName: '', speed: 0, galloping: false,
  horse: { breath: 1, winded: false, hunger: 'Fed', hungerKey: 'fed', fedHours: 8, full: false, tier: 'Familiar', bond: 45, tierAt: 35, next: { name: 'Trusting', at: 55 } },
  wagon: null, oats: 16, apples: 0, kits: 0, load: null, near: true, wagonNear: true, cargo: null, view: true, hcc: true, ...o,
});
const barOf = (root) => root.children.find((c) => c.className === 'saddlepanel-bar');
const ride = (doc, o) => drawEnhancedSaddle({ saddle: S(o) }, {}, { doc });

test('HUD-SADDLE THE PIECE: the riding panel\'s bar is a HUD-MOVE piece, and a panel built when its rider mounts stands where the player put it - moved, sized or turned off - from its first frame, with no sweep between; a reset puts it back (mutants: no piece; the build\'s placing dropped)', async () => {
  const piece = HUD_PIECES.find((p) => p.id === 'saddle');
  assert.deepEqual({ ...piece }, { id: 'saddle', sel: '.saddlepanel .saddlepanel-bar', name: 'Riding panel', ghost: 'saddle' });
  assert.ok(HUD_LAYOUT_CSS.includes('.saddlepanel .saddlepanel-bar[data-hm],'), 'the editor\'s sheet moves and scales it');
  await withPage({ saddle: { x: 120, y: 340, s: 0.8 } }, (doc) => {
    const root = ride(doc);
    assert.equal(root.id, ENHANCED_SADDLE_ID);
    const bar = barOf(root);
    assert.equal(bar.attrs['data-hm'], 'saddle', 'marked as its piece');
    assert.deepEqual([bar.style.props['--hmx'], bar.style.props['--hmy'], bar.style.props['--hms']], ['120px', '340px', '0.8'], 'at the saved place and size the moment it is built');
    assert.ok(bar.hasAttribute('data-hm-moved'));
    // the frames after keep it there: the panel's own painting never writes the piece's place
    ride(doc, { speed: 10, galloping: true }); ride(doc, { horse: null });
    assert.deepEqual([bar.style.props['--hmx'], bar.style.props['--hmy']], ['120px', '340px']);
    resetHudLayout();
    assert.deepEqual([bar.style.props['--hmx'], bar.style.props['--hms'], bar.hasAttribute('data-hm-moved')], [undefined, undefined, false], 'Reset: the sheet\'s own place');
  });
  await withPage({ saddle: { off: true } }, (doc) => {
    const bar = barOf(ride(doc));
    assert.ok(bar.hasAttribute('data-hm-off'), 'turned off in the editor: off the screen in play from its first frame');
    assert.ok(HUD_LAYOUT_CSS.includes('[data-hm-off]:not([data-hm-edit]) { visibility: hidden !important; }'));
    // dismounted and mounted again: a new panel, placed again
    hideEnhancedSaddle();
    assert.ok(barOf(ride(doc)).hasAttribute('data-hm-off'));
  });
});

test('HUD-SADDLE THE EDITOR: Alt+U frames the riding panel with its name, its X turns it off (saved, hidden once locked) and on again, the lock takes the frame away (mutants: no piece; the X saving nothing)', async () => {
  await withPage(null, async (doc) => {
    tickHudLayout(doc, 0);   // the HUD's first frame starts HUD-MOVE
    const bar = barOf(ride(doc));
    assert.equal(bar.hasAttribute('data-hm-edit'), false, 'locked (the default): no frame');
    doc.fire('keydown', { code: 'KeyU', altKey: true, target: doc.body });
    assert.equal(getPref(HUD_LOCK_PREF), false, 'Alt+U: the editor opens');
    assert.ok(bar.hasAttribute('data-hm-edit'), 'framed');
    assert.equal(bar.attrs['data-hm-name'], 'Riding panel');
    const handles = doc.getElementById('hud-layout-handles');
    const tag = handles.children.find((h) => h.tagName === 'B' && h.textContent === 'Riding panel');
    assert.ok(tag, 'its name over its corner');
    const x = handles.children.find((h) => h.attrs['data-hm-handle'] === 'off' && h._hmNode === bar);
    assert.ok(x, 'its X');
    doc.fire('pointerdown', { target: x, button: 0, clientX: 0, clientY: 0 });
    assert.deepEqual(getPref(HUD_LAYOUT_PREF), { saddle: { off: true } }, 'saved');
    assert.ok(bar.hasAttribute('data-hm-off'));
    doc.fire('keydown', { code: 'KeyU', altKey: true, target: doc.body });
    assert.equal(getPref(HUD_LOCK_PREF), true, 'Alt+U again: locked');
    assert.deepEqual([bar.hasAttribute('data-hm-edit'), bar.hasAttribute('data-hm-off')], [false, true], 'in play: off, and no frame');
    setHudLocked(false);
    const x2 = doc.getElementById('hud-layout-handles').children.find((h) => h.attrs['data-hm-handle'] === 'off' && h._hmNode === bar);
    doc.fire('pointerdown', { target: x2, button: 0, clientX: 0, clientY: 0 });
    assert.equal(getPref(HUD_LAYOUT_PREF), null, 'on again: nothing left to save');
    assert.equal(bar.hasAttribute('data-hm-off'), false);
  });
});

test('HUD-SADDLE THE PREVIEW: with the editor open and nobody riding, the riding panel stands as a preview - the panel\'s own face, named a preview, its bar the piece - and the real one takes its place on a mount; locked, no preview stands; built apart from the live panel, at a finger\'s place on a touch device (mutants: no ghost; the stand-in read as a real panel; the preview mounted as the live panel; the preview never a finger\'s)', async () => {
  await withPage(null, async (doc) => {
    setPref(HUD_LOCK_PREF, false);
    tickHudLayout(doc, 0);   // the HUD's first frame starts HUD-MOVE on this page
    const ghosts = () => doc.querySelectorAll('.saddlepanel[data-hm-ghost="saddle"]');
    for (let i = 0; i < 200 && !ghosts().length; i++) { sweepHudLayout(doc); await new Promise((r) => setTimeout(r, 5)); }   // the previews' hosts load on first need
    assert.equal(ghosts().length, 1, 'one preview');
    const g = ghosts()[0];
    const bar = barOf(g);
    assert.ok(bar.hasAttribute('data-hm-edit') && bar.attrs['data-hm'] === 'saddle', 'its bar is the piece the drags move');
    assert.equal(bar.querySelector('.saddlepanel-name').textContent, 'Riding panel (preview)');
    assert.deepEqual(bar.querySelectorAll('.saddlepanel-meter').map((m) => m.attrs['data-key']), ['breath', 'hunger', 'bond'], 'the panel\'s own meters');
    assert.deepEqual(bar.querySelectorAll('.saddlepanel-btn').map((b) => b.attrs['data-act']), ['feed', 'stable', 'dismount']);
    assert.equal(doc.getElementById(ENHANCED_SADDLE_ID), null, 'the live panel\'s slot stays empty');
    sweepHudLayout(doc);
    assert.equal(ghosts().length, 1, 'the next sweep keeps the one preview - not a second');
    // a rider mounts: the real panel, framed, and the preview gone
    const real = barOf(ride(doc));
    assert.equal(ghosts().length, 0, 'the real panel takes its place');
    assert.equal(g.parentElement, null, 'the whole stand-in leaves, not its bar alone');
    assert.ok(real.hasAttribute('data-hm-edit'));
    // dismounted, the preview again; locked, none
    hideEnhancedSaddle();
    sweepHudLayout(doc);
    assert.equal(ghosts().length, 1);
    setHudLocked(true);
    assert.equal(ghosts().length, 0, 'locked: no preview');
  });
  // the preview alone: built, not put on the page (HUD-MOVE puts it there); at a finger's place where the hosts' touch
  // layer stands (ui/touch.js attachTouch asks isTouchDevice, and the panel's `touch` is that layer)
  const doc = fakePage();
  const p = buildSaddlePreview(doc);
  assert.deepEqual([p.className, p.parentElement, p.id], ['saddlepanel', null, '']);
  const phone = fakePage();
  phone.defaultView.location = { search: '?touch=on' };
  assert.equal(buildSaddlePreview(phone).className, 'saddlepanel touch');
});

test('HUD-SADDLE THE FOUR HOSTS: the panel has one builder, and it places itself - world.js and exterior.js, the hosts that ride, draw it only through the one glue; worldModes.js (interiors) and dungeonContext.js (dungeons) stand no transport and draw none; the sweep that frames it is the HUD\'s, which every host draws (mutant: the build\'s placing dropped)', () => {
  const files = [];
  const walk = (dir) => { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p); else if (f.endsWith('.js')) files.push(p); } };
  walk(SRC);
  const rel = (p) => p.slice(SRC.length);
  assert.deepEqual(files.filter((p) => /className = 'saddlepanel(-bar)?'/.test(readFileSync(p, 'utf8'))).map(rel), ['ui/enhancedSaddle.js'], 'one builder');
  assert.deepEqual(files.filter((p) => readFileSync(p, 'utf8').includes('drawEnhancedSaddle(')).map(rel).sort(), ['scenes/saddleHost.js', 'ui/enhancedSaddle.js'], 'one glue draws it');
  for (const host of ['world.js', 'exterior.js']) assert.match(rd(`src/scenes/${host}`), /import \{ createSaddleHost \} from '\.\/saddleHost\.js';/, `${host}: rides, through the glue`);
  for (const host of ['worldModes.js', 'dungeonContext.js']) assert.ok(!/saddleHost|enhancedSaddle/.test(rd(`src/scenes/${host}`)), `${host}: no transport - named, not wired`);
  const saddle = rd('src/ui/enhancedSaddle.js');
  assert.match(saddle, /import \{ placeHudPieces \} from '\.\/hudPlacer\.js';/);
  assert.ok(!saddle.includes("from './hudLayout.js'"), 'through the leaf, not the editor and its previews\' hosts');
  assert.match(saddle, /doc\.body\.append\(host\);\n {4}placeHudPieces\(doc\);/, 'placed the moment it is put on the page');
  assert.match(rd('src/ui/enhancedHud.js'), /import \{ tickHudLayout \} from '\.\/hudLayout\.js';/, 'the HUD every host draws seats the sweep');
});

test('HUD-SADDLE THE SWITCH, END TO END: Horse care\'s tile writes the key the switch reads, and every reader asks it live - off the line its Off takes the walk, the gallop, the HUD\'s breath, the panel\'s meters and Feed and the oats\' feeding away at once, and its On gives them back; online the room\'s, the tile locked on and saying so (mutants: the row\'s key; the switch read once; the switch left to the player online)', async () => {
  const { FEATURES } = await import('../src/systems/features.js');
  const { tileStates } = await import('../src/ui/enhancedMenu.js');
  const { horseCareOn, HORSE_CARE_PREF } = await import('../src/systems/upkeepSwitch.js');
  const { createUpkeep } = await import('../src/systems/upkeepRuntime.js');
  const { createSaddleHost } = await import('../src/scenes/saddleHost.js');
  const { canRunUnlessRiding, rideWalks, setGallopGate, setRideWalk } = await import('../src/systems/transport.js');
  const { OATS_TEMPLATE } = await import('../src/systems/steedCare.js');
  const { saddleMeters, saddleButtons } = await import('../src/ui/enhancedSaddle.js');
  const row = FEATURES.find((f) => f.id === 'horse-care');
  assert.equal(row.control.key, HORSE_CARE_PREF, 'the tile\'s key is the switch\'s');
  const T0 = 2_000_000;
  const law = (online) => withPage(null, async () => {
    if (online) globalThis.location = { search: '?skin=enhanced&online' };
    const items = [{ group: 'Transportation', templateIndex: 94, horseSeed: 77, horseFed: T0 + 8 * 60 }, { group: 'UselessItems2', templateIndex: OATS_TEMPLATE, stackCount: 16 }];
    const up = createUpkeep({ items: () => items, now: () => T0, horseCare: horseCareOn, wagonUpkeep: () => false });   // as world.js and exterior.js build it
    setRideWalk((m) => up.rideWalks(m)); setGallopGate((m, mods) => up.gallopGate(m, mods));
    const host = createSaddleHost({ upkeep: up, runtime: () => null, items: () => items, wagonKg: () => 0, wagonLimit: () => 0, say() {}, pass() {}, openStable() {}, canView: () => false, toggleView() {}, foot() {} });
    const reads = () => { const s = host.read('Horse'); return { walks: rideWalks('Horse'), gallops: canRunUnlessRiding('Horse'), bar: !!up.bar('Horse'), meters: saddleMeters(s).map((m) => m.key), buttons: saddleButtons(s).map((b) => b.act), gait: s.walks }; };
    const out = [];
    try {
      const st = tileStates(row);
      out.push({ at: st.labels[st.at], locked: !!st.locked, ...reads() });
      if (!st.locked) {
        st.set(st.labels.indexOf('Off'));
        out.push({ at: 'Off', ...reads(), fed: up.act('feed', 0).ok });
        tileStates(row).set(tileStates(row).labels.indexOf('On'));
        out.push({ at: 'On', ...reads() });
      }
    } finally { setRideWalk(null); setGallopGate(null); }
    return out;
  });
  const cared = { walks: true, gallops: true, bar: true, meters: ['breath', 'hunger', 'bond'], buttons: ['feed', 'stable', 'dismount'], gait: true };
  const dfu = { walks: false, gallops: false, bar: false, meters: [], buttons: ['stable', 'dismount'], gait: false };
  assert.deepEqual(await law(false), [
    { at: 'On', locked: false, ...cared },
    { at: 'Off', ...dfu, fed: false },
    { at: 'On', ...cared },
  ], 'off the line: DFU\'s horse the moment it is pressed Off - one pace, no gallop in the saddle, nothing to read or feed - and the cared horse again on On');
  assert.deepEqual(await law(true), [{ at: 'On', locked: true, ...cared }], 'online: the room\'s horse care, the tile locked on (its note: "online it is always on")');
  assert.match(row.note, /online it is always on\.$/);
});
