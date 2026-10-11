// @ts-check
// ETHER-CHART (2026-10-11, the owner: "A brand new open sea map that allows you to traverse to the etheric sea";
// bible/03-World/Etheric-Sea.md ETHER-CHART) - THE CHART OF THE ETHERIC SEA: the map a captain keeps past the Veil, the
// travel map's door's answer there (scenes/world.js toggleTravelMap) - the Bay's travel map has no sea past the Veil to
// show, and no road to travel by. Drawn on a canvas in the naval windows' sheet (ui/navalPlunderWindow.js's style, the
// door's slot - ui/navalPlunderDoor.js), off the world's word (scenes/etherHost.js chart): the ISLES CHARTED - a port's
// gold, a ruin's red, a wild isle's green, a rock's grey, each named as the zoom allows - the SHIP and her heading, THE
// VEIL down the chart's east edge and the way home through it, the BANDS' bounds and names (each on its own deeper side,
// the Shallows by the Veil), and the HAUNTS of the legends heard of, the square each is (dim while she lies sunk). Pan by
// dragging (a finger, the mouse's first button) or the arrows; zoom by the wheel (about the pointer, a notch a step),
// a pinch (about the fingers), + and - or the window's own buttons (about the chart's middle); C or Ship back to the
// ship; a pointer on an isle - or a tap - says what it is and how far, and which way, from the ship. The key that opened
// it (the travel map's or the map's, by binding) closes it. Nothing on it is pressed: the Etheric Sea is sailed. AUDIT
// CAPTAIN'S SEA X6/X7/X8/X12/X13/X14/X17/X18.
//
// deps = { word() -> etherHost.js chart's, onExit(reason) }. Pure beside the mount: the view's sums (`toScreen`,
// `toChart`, `chartZoomAt`) and the chart's model (`chartModel`), the pins' reading.
import { closeOnOutsideTap } from './enhancedOverlays.js';
import { overlayAction, bindings } from './input.js';
import { actionsForCode } from '../systems/inputActions.js';
import { injectEnhancedStyle, injectEnhancedFonts } from './enhancedStyle.js';
import { injectNavalKit } from './navalHud.js';
import { injectNavalWindowStyle } from './navalPlunderWindow.js';
import { isleByKey, BANDS, VEIL_X, LEAGUE_PX, KIND_WORDS, ETHER_BOX, compassPoint } from '../world/ethericSea.js';
import { hauntOf, legendById, HAUNT_PX } from '../systems/naval/etherShips.js';

/** The zooms: screen pixels a map pixel (819.2 m). */
export const CHART_ZOOMS = Object.freeze([1, 2, 4, 8, 16]);
export const CHART_ZOOM_DEFAULT = 2;
/** A name is lettered at this zoom and over (a port's at any). */
export const LABEL_ZOOM = 8;
/** An arrow's pan, in screen pixels. */
export const PAN_STEP = 80;
/** The kinds' colours on the chart. */
export const KIND_COLOURS = Object.freeze({ port: '#e2b064', ruin: '#c8553d', wild: '#5fae7d', rock: '#8a8f99' });
/** AUDIT CAPTAIN'S SEA X14: a name's box on the chart, as the model reckons it (12 px serif) - no two names lettered over
 *  each other, ports first. */
export const LABEL_CHAR_PX = 6.5;
export const LABEL_H = 14;
/** AUDIT CAPTAIN'S SEA X18: the wheel's travel a zoom step takes (a trackpad's light brush was a step an event). */
export const CHART_WHEEL_STEP = 100;
/** AUDIT CAPTAIN'S SEA X6: a press that moves less than this (px) is a tap; two fingers' spread by this share a step. */
export const CHART_TAP_PX = 8;
export const CHART_PINCH_STEP = 1.6;
/** A name opening a line, its first letter raised ("the Sepulchre of Aelorrel" leads a sentence as "The Sepulchre..."). */
export const capFirst = (t) => String(t ?? '').replace(/^./, (c) => c.toUpperCase());

/** @typedef {{ cx: number, cy: number, zoom: number }} ChartView */
/** A chart point (map pixels) on the canvas (`w` x `h`): the view's centre the canvas's. */
export const toScreen = (v, px, py, w, h) => [w / 2 + (px - v.cx) * CHART_ZOOMS[v.zoom], h / 2 + (py - v.cy) * CHART_ZOOMS[v.zoom]];
/** ...and back. */
export const toChart = (v, sx, sy, w, h) => [v.cx + (sx - w / 2) / CHART_ZOOMS[v.zoom], v.cy + (sy - h / 2) / CHART_ZOOMS[v.zoom]];
/** The view zoomed `dir` steps (+ in) about a canvas point, which stays over the same chart point. */
export function chartZoomAt(v, dir, sx, sy, w, h) {
  const zoom = Math.max(0, Math.min(CHART_ZOOMS.length - 1, v.zoom + Math.sign(dir)));
  if (zoom === v.zoom) return v;
  const [px, py] = toChart(v, sx, sy, w, h);
  const k = CHART_ZOOMS[zoom];
  return clampChartView({ cx: px - (sx - w / 2) / k, cy: py - (sy - h / 2) / k, zoom });
}
/** The view kept over the sea's box - its centre (the chart's edges may show past the box at its corners). */
export const clampChartView = (v) => ({ zoom: v.zoom, cx: Math.max(ETHER_BOX.x0, Math.min(ETHER_BOX.x1, v.cx)), cy: Math.max(ETHER_BOX.y0, Math.min(ETHER_BOX.y1, v.cy)) });

/** Which way, and how far, a point lies from another: "12 leagues west-north-west" (map y runs south). */
export function wayWords(from, to) {
  const dx = to.px - from.px, dy = to.py - from.py;
  const leagues = Math.hypot(dx, dy) / LEAGUE_PX;
  if (leagues < 0.5) return 'here';
  const n = Math.max(1, Math.round(leagues));
  return `${n} ${n === 1 ? 'league' : 'leagues'} ${compassPoint(dx, dy)}`;
}
/** An isle in a line: "Port Pelleveth - a port - 12 leagues west-north-west" - its name's first letter raised (X17). */
export const isleWords = (isle, ship) => `${capFirst(isle.name)} - ${KIND_WORDS[isle.kind] ?? 'an isle'} - ${wayWords(ship, isle)}`;

/**
 * THE CHART'S MODEL for a canvas of `w` x `h` over the view: the charted isles on it (`{ key, name, kind, x, y, r, label
 * }` - lettered by the zoom, ports first, never over a name already lettered), the bands' bounds on it (`{ x, name, line }`
 * - each name lettered on its own deeper side, the Shallows' by the Veil with no line of its own), the Veil's x (null off
 * it), the ship (`{ x, y, yaw }`), the haunts heard of on it (`{ x, y, r, name, sails }` - `r` a haunt's half side: a
 * haunt is the square legendAt reads), and the header's two lines.
 * @param {any} word - etherHost.js chart's @param {ChartView} v @param {number} w @param {number} h
 */
export function chartModel(word, v, w, h) {
  const k = CHART_ZOOMS[v.zoom];
  const on = (x, y, pad = 0) => x >= -pad && y >= -pad && x <= w + pad && y <= h + pad;
  const isles = [];
  for (const key of word.charted ?? []) {
    const i = isleByKey(key);
    if (!i) continue;
    const [x, y] = toScreen(v, i.px + 0.5, i.py + 0.5, w, h);
    const r = Math.max(2.5, i.r * k);
    if (!on(x, y, r + 80)) continue;
    isles.push({ key, name: i.name, kind: i.kind, x, y, r, label: i.kind === 'port' || v.zoom >= CHART_ZOOMS.indexOf(LABEL_ZOOM) });
  }
  // AUDIT CAPTAIN'S SEA X14: the names placed greedily - ports first, then by the chart's own order - and one that would
  // stand over a name already lettered left unlettered (a pointer or a tap still names it)
  const placed = [];
  for (const i of [...isles].sort((a, b) => (b.kind === 'port' ? 1 : 0) - (a.kind === 'port' ? 1 : 0))) {
    if (!i.label) continue;
    const box = [i.x + i.r + 4, i.y - LABEL_H / 2 - 2, i.x + i.r + 4 + capFirst(i.name).length * LABEL_CHAR_PX, i.y + LABEL_H / 2 - 2];
    if (placed.some((p) => box[0] < p[2] && p[0] < box[2] && box[1] < p[3] && p[1] < box[3])) { i.label = false; continue; }
    placed.push(box);
  }
  const bands = [];
  for (const b of BANDS) {
    const [x] = toScreen(v, VEIL_X - b.from * LEAGUE_PX, 0, w, h);
    if (x >= 0 && x <= w + 80) bands.push({ x, name: b.name, line: b.from > 0 });   // AUDIT CAPTAIN'S SEA X12: the Shallows named by the Veil
  }
  const [veil] = toScreen(v, VEIL_X, 0, w, h);
  const [sx, sy] = toScreen(v, word.px + 0.5, word.py + 0.5, w, h);
  const haunts = [];
  for (const l of word.legends ?? []) {
    const legend = legendById(l.id);
    if (!legend) continue;
    const at = hauntOf(legend);
    const [x, y] = toScreen(v, at.px + 0.5, at.py + 0.5, w, h);
    const r = HAUNT_PX * k;
    if (on(x, y, r)) haunts.push({ x, y, r, name: l.name, sails: !!l.sails });
  }
  const st = word.stats ?? {};
  return {
    isles, bands, veil: veil <= w ? veil : null, ship: { x: sx, y: sy, yaw: word.yaw ?? 0 }, haunts,
    title: 'A chart of the Etheric Sea',   // the haunts' `r` the square's half side (X13)
    sub: `${st.charted ?? 0} ${st.charted === 1 ? 'isle' : 'isles'} charted - deepest ${st.deepest ?? 0} leagues past the Veil - ${st.crossings ?? 0} ${st.crossings === 1 ? 'crossing' : 'crossings'}${st.legends ? ` - ${st.legends} ${st.legends === 1 ? 'legend' : 'legends'} ended` : ''}`,
  };
}

/** @param {string} tag @param {string|null} [cls] @param {string|null} [text] */
const el = (tag, cls = null, text = null) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

/**
 * THE WINDOW: `{ repaint, unmount }`.
 * @param {HTMLElement} host @param {{ word: () => any, onExit?: (reason?: string) => void }} deps
 */
export function mountEtherChartWindow(host, deps) {
  injectEnhancedStyle();
  injectEnhancedFonts();
  injectNavalWindowStyle();
  injectNavalKit(document);
  const exit = (reason = 'close') => deps.onExit?.(reason);
  const shell = el('div', 'dfnaval-shell');
  shell.setAttribute('role', 'dialog');
  shell.setAttribute('aria-label', 'A chart of the Etheric Sea');
  const win = el('div', 'dfnaval-win');
  win.style.width = 'min(96vw, 1100px)';
  win.style.maxWidth = '96vw';
  shell.append(win);
  const head = el('header', 'dfnaval-winhead');
  const title = el('div', 'dfnaval-wintitle');
  const h2 = el('h2');
  const sub = el('p', 'dfnaval-winsub');
  const noteLine = el('p', 'dfnaval-note');
  noteLine.setAttribute('aria-live', 'polite');
  title.append(h2, sub, noteLine);
  const close = /** @type {HTMLButtonElement} */ (el('button', 'dfnaval-btn dfnaval-close', 'Close'));
  close.type = 'button';
  close.style.minWidth = '0';
  close.addEventListener('click', () => exit('close'));
  head.append(title, close);
  const canvas = /** @type {HTMLCanvasElement} */ (el('canvas'));
  canvas.style.cssText = 'display:block;width:100%;height:min(70vh,640px);border-radius:3px;cursor:grab;touch-action:none;background:#0b1622';
  const hint = el('p', 'dfnaval-lede', 'Drag or the arrows to pan - pinch, the wheel or + and - to zoom - C to find your ship - tap an isle to name it.');
  // AUDIT CAPTAIN'S SEA X6: the window's own presses - a finger and a pad's cursor zoom and find the ship by them
  const tools = el('div', 'dfnaval-chart-tools');
  tools.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;margin-top:6px';
  const tool = (label, fn) => { const b = /** @type {HTMLButtonElement} */ (el('button', 'dfnaval-btn', label)); b.type = 'button'; b.style.minWidth = '0'; b.addEventListener('click', () => { fn(); draw(); }); tools.append(b); return b; };
  const body = el('div', 'dfnaval-winbody');
  body.append(canvas, tools, hint);
  win.append(head, body);
  host.append(shell);

  let alive = true;
  let word = deps.word();
  /** @type {ChartView} */
  let view = clampChartView({ cx: word.px + 0.5, cy: word.py + 0.5, zoom: CHART_ZOOM_DEFAULT });
  let model = null;
  const size = () => { const r = canvas.getBoundingClientRect(); return [Math.max(1, r.width), Math.max(1, r.height)]; };
  const zoomMid = (dir) => { const [w, h] = size(); view = chartZoomAt(view, dir, w / 2, h / 2, w, h); };
  const toShip = () => { view = clampChartView({ ...view, cx: word.px + 0.5, cy: word.py + 0.5 }); };
  tool('-', () => zoomMid(-1)); tool('+', () => zoomMid(1)); tool('Ship', toShip);

  function draw() {
    if (!alive) return;
    const [w, h] = size();
    const dpr = Math.max(1, Math.min(3, globalThis.devicePixelRatio || 1));
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    const g = canvas.getContext('2d');
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    model = chartModel(word, view, w, h);
    h2.textContent = model.title;
    sub.textContent = model.sub;
    // the sea: the deep's blue, darker to the west, and a few fixed stars in it
    const sea = g.createLinearGradient(0, 0, w, 0);
    sea.addColorStop(0, '#07101a'); sea.addColorStop(1, '#10273a');
    g.fillStyle = sea; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(220,230,255,0.35)';
    for (let i = 0; i < 90; i++) { const x = ((i * 7919) % 997) / 997 * w, y = ((i * 104729) % 991) / 991 * h; g.fillRect(x, y, 1, 1); }
    // the bands' bounds
    g.font = '12px "Cormorant Garamond", Georgia, serif';
    for (const b of model.bands) {
      if (b.line) { g.strokeStyle = 'rgba(180,200,230,0.25)'; g.setLineDash([4, 6]); g.beginPath(); g.moveTo(b.x, 0); g.lineTo(b.x, h); g.stroke(); g.setLineDash([]); }
      // AUDIT CAPTAIN'S SEA X12: on its own side of its line - west of it, the deeper - right-aligned to it
      g.fillStyle = 'rgba(200,215,240,0.7)'; g.textAlign = 'right'; g.fillText(capFirst(b.name), Math.min(w - 4, b.x - 6), 16);
    }
    g.textAlign = 'left';
    // the Veil
    if (model.veil != null) {
      const veil = g.createLinearGradient(model.veil, 0, w, 0);
      veil.addColorStop(0, 'rgba(170,140,255,0.08)'); veil.addColorStop(1, 'rgba(200,180,255,0.35)');
      g.fillStyle = veil; g.fillRect(model.veil, 0, w - model.veil, h);
      g.save(); g.translate(Math.min(w - 10, model.veil + 18), h / 2); g.rotate(-Math.PI / 2);
      g.fillStyle = 'rgba(230,220,255,0.85)'; g.textAlign = 'center'; g.fillText('THE VEIL - to the Iliac Bay', 0, 0); g.restore();
    }
    // the haunts heard of
    for (const t of model.haunts) {
      g.strokeStyle = t.sails ? 'rgba(220,70,60,0.6)' : 'rgba(150,150,150,0.35)';
      g.lineWidth = 1.5; g.strokeRect(t.x - t.r, t.y - t.r, 2 * t.r, 2 * t.r); g.lineWidth = 1;   // AUDIT CAPTAIN'S SEA X13: a haunt is a square
      g.fillStyle = t.sails ? 'rgba(240,120,100,0.9)' : 'rgba(170,170,170,0.7)'; g.textAlign = 'center';
      g.fillText(`${t.name}${t.sails ? '' : ' (sunk)'}`, t.x, t.y - t.r - 6);
    }
    // the isles
    g.textAlign = 'left';
    for (const i of model.isles) {
      g.fillStyle = KIND_COLOURS[i.kind] ?? '#999';
      g.beginPath(); g.arc(i.x, i.y, i.r, 0, Math.PI * 2); g.fill();
      if (i.label) { g.fillStyle = 'rgba(240,230,210,0.9)'; g.fillText(capFirst(i.name), i.x + i.r + 4, i.y + 4); }
    }
    // the ship: an arrow on her heading
    const s = model.ship;
    g.save(); g.translate(s.x, s.y); g.rotate(s.yaw);
    g.fillStyle = '#f3cf86'; g.strokeStyle = '#2a1a08';
    g.beginPath(); g.moveTo(0, -9); g.lineTo(6, 7); g.lineTo(0, 3); g.lineTo(-6, 7); g.closePath(); g.fill(); g.stroke();
    g.restore();
  }
  /** What lies under a canvas point: the nearest isle drawn within its reach and a little. */
  function isleUnder(sx, sy) {
    let best = null, bd = Infinity;
    for (const i of model?.isles ?? []) { const d = Math.hypot(i.x - sx, i.y - sy); if (d <= i.r + 6 && d < bd) { bd = d; best = i; } }
    return best ? isleByKey(best.key) : null;
  }
  const local = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const note = (x, y) => { const isle = isleUnder(x, y); noteLine.textContent = isle ? isleWords(isle, { px: word.px + 0.5, py: word.py + 0.5 }) : ''; };
  // AUDIT CAPTAIN'S SEA X6/X7: THE PRESSES BY POINTER - one pans (a finger, a pen, the mouse's first button alone), two
  // pinch the zoom about their middle, a press that never moved is a tap (an isle named); a drag ends however its press
  // ends - let go anywhere, the capture lost, the button no longer held (a right-click's menu ate its release, a pad's
  // cursor let go over another element, and the chart panned on with no button held)
  const downs = new Map();   // pointerId -> [x, y] now
  let drag = null, pinch = null;
  const endDrag = (e) => {
    if (e?.pointerId != null) downs.delete(e.pointerId);
    if (downs.size < 2) pinch = null;
    if (!downs.size) { drag = null; canvas.style.cursor = 'grab'; }
  };
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    downs.set(e.pointerId, local(e));
    canvas.setPointerCapture?.(e.pointerId);
    canvas.style.cursor = 'grabbing';
    if (downs.size === 1) drag = { at: local(e), view, moved: false };
    else if (downs.size === 2) { const [a, b] = [...downs.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1 }; drag = null; }
  });
  canvas.addEventListener('pointermove', (e) => {
    const [x, y] = local(e);
    if (drag && e.pointerType === 'mouse' && !(e.buttons & 1)) endDrag(e);
    if (downs.has(e.pointerId)) downs.set(e.pointerId, [x, y]);
    if (pinch && downs.size >= 2) {
      const [a, b] = [...downs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1;
      const step = d / pinch.d >= CHART_PINCH_STEP ? 1 : pinch.d / d >= CHART_PINCH_STEP ? -1 : 0;
      if (step) { const [w, h] = size(); view = chartZoomAt(view, step, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, w, h); pinch.d = d; draw(); }
      return;
    }
    if (drag) {
      if (Math.hypot(x - drag.at[0], y - drag.at[1]) > CHART_TAP_PX) drag.moved = true;
      if (!drag.moved) return;
      const k = CHART_ZOOMS[view.zoom];
      view = clampChartView({ zoom: drag.view.zoom, cx: drag.view.cx - (x - drag.at[0]) / k, cy: drag.view.cy - (y - drag.at[1]) / k });
      draw();
      return;
    }
    if (e.pointerType === 'mouse') note(x, y);
  });
  canvas.addEventListener('pointerup', (e) => { if (drag && !drag.moved && downs.size === 1) note(...local(e)); endDrag(e); });
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('lostpointercapture', endDrag);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  // AUDIT CAPTAIN'S SEA X18: the wheel's travel gathered, a step each CHART_WHEEL_STEP of it (a notch is one; a trackpad's brush
  // is many small events)
  let wheelAcc = 0;
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    wheelAcc += e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY;
    if (Math.abs(wheelAcc) < CHART_WHEEL_STEP) return;
    const dir = -Math.sign(wheelAcc);
    wheelAcc = 0;
    const [x, y] = local(e); const [w, h] = size();
    view = chartZoomAt(view, dir, x, y, w, h); draw();
  }, { passive: false });
  const onKey = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    // AUDIT CAPTAIN'S SEA X8: the key that opened it shuts it - the travel map's or the map's, by binding (heldMap.js
    // EM-BUG2's law); V opened it and did nothing, a rebound map key was ignored
    const acts = actionsForCode(bindings(), e.code);
    if (overlayAction(e) === 'back' || acts.includes('TravelMap') || acts.includes('AutoMap')) { e.preventDefault(); e.stopPropagation(); exit('close'); return; }
    const [w, h] = size();
    const k = CHART_ZOOMS[view.zoom];
    const pan = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.code];
    if (pan) { view = clampChartView({ ...view, cx: view.cx + (pan[0] * PAN_STEP) / k, cy: view.cy + (pan[1] * PAN_STEP) / k }); }
    else if (e.code === 'Equal' || e.code === 'NumpadAdd') view = chartZoomAt(view, 1, w / 2, h / 2, w, h);
    else if (e.code === 'Minus' || e.code === 'NumpadSubtract') view = chartZoomAt(view, -1, w / 2, h / 2, w, h);
    else if (e.code === 'KeyC') toShip();
    else return;
    e.preventDefault(); e.stopPropagation();
    draw();
  };
  globalThis.addEventListener('keydown', onKey, { capture: true });
  const offOutside = closeOnOutsideTap(shell, '.dfnaval-win', () => exit('close'));
  const onResize = () => draw();
  globalThis.addEventListener('resize', onResize);
  draw();
  close.focus?.({ preventScroll: true });
  return {
    repaint: () => { word = deps.word(); draw(); },
    unmount() {
      if (!alive) return;
      alive = false;
      globalThis.removeEventListener('keydown', onKey, { capture: true });
      globalThis.removeEventListener('resize', onResize);
      offOutside();
      shell.remove();
    },
  };
}
