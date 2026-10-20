// @ts-check
// STAR6 (2026-10-20): THE FALLEN STAR'S TRACKER - a plate over the world for a player within STAR_HUD_M of a star: its
// name (a Heart-Star its own), the town it fell near, the coven come for it, how it stands (the gathering, a wave of
// four, the master by name, held, lost), its light as a bar and the time to its deadline. Design:
// bible/11-Multiplayer/Starfall.md section 8. Its reading is the law's (systems/starfall/starfallClient.js
// starTrackerModel); this is the node.
//
// MADE ONCE AND UPDATED, never rebuilt: each part written only when what it says changes (the Elite Breach's tracker's
// law, ui/eliteGates/egHud.js). DRESSED IN EVERY SKIN, as the gate's bar is - a fight is read whatever skin is worn: under
// Enhanced Plus the kit's panel (ui/enhanced/enhancedFrame.js FRAME_ROLES, `body .star-hud`), on the classic skin the
// kit's own rules cut to it (scopeRules).
//
// Not a DFU member. Ledger A (STARFALL).
import { FRAME_TONES, frameCss, scopeRules } from '../enhanced/enhancedFrame.js';
import { injectEnhancedFonts } from '../enhanced/enhancedStyle.js';
import { isEnhancedPlus } from '../../systems/uiSkin.js';
import { PIXEL_FONT_CSS } from '../pixelifyFive.js';
import { STAR_VIOLET_CSS, STAR_GOLD_CSS } from './starMapMark.js';

export const STAR_TRACKER_STYLE_ID = 'dagger-star-tracker-style';
export const STAR_TRACKER_KIT_ID = 'dagger-star-tracker-kit';
/** The parts, in their order down the plate. */
export const STAR_TRACKER_KEYS = Object.freeze(['title', 'near', 'coven', 'phase', 'left']);

export const STAR_TRACKER_CSS = `
.star-hud { position: fixed; right: 16px; top: 24%; width: min(300px, 72vw); box-sizing: border-box; pointer-events: none; z-index: 30;
  padding: 9px 12px 10px; border-width: 2px; border-style: solid; ${PIXEL_FONT_CSS} font-size: calc(14px * var(--hud-scale, 1)); line-height: 1.35;
  color: #efe8f8; text-shadow: 2px 2px 0 rgba(0,0,0,0.85); }
.star-hud-title { font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: ${STAR_VIOLET_CSS}; }
.star-hud.heart .star-hud-title { color: ${FRAME_TONES.brassHi}; }
.star-hud-near { font-size: 16px; line-height: 1.25; margin-top: 3px; color: #ffffff; }
.star-hud-coven { font-size: 13px; margin-top: 2px; color: #c9bde0; }
.star-hud-phase { font-size: 15px; margin-top: 6px; }
.star-hud-light { position: relative; height: 8px; margin-top: 6px; background: rgba(20,14,34,0.85); border: 1px solid rgba(185,162,255,0.45); }
.star-hud-fill { position: absolute; left: 0; top: 0; bottom: 0; background: ${STAR_VIOLET_CSS}; box-shadow: 0 0 6px ${STAR_VIOLET_CSS}; }
.star-hud.low .star-hud-fill { background: #ff6a4a; box-shadow: 0 0 6px #ff6a4a; animation: star-low 1s steps(2, jump-none) infinite; }
.star-hud.held .star-hud-fill { background: ${STAR_GOLD_CSS}; box-shadow: 0 0 6px ${STAR_GOLD_CSS}; }
.star-hud.held .star-hud-phase { color: ${STAR_GOLD_CSS}; }
@keyframes star-low { 50% { opacity: 0.55; } }
@media (prefers-reduced-motion: reduce) { .star-hud.low .star-hud-fill { animation: none; } }
.star-hud-left { font-size: 13px; margin-top: 4px; color: #c9bde0; font-variant-numeric: tabular-nums; }
.star-hud-left:empty, .star-hud-coven:empty { display: none; }
@media (max-width: 640px) { .star-hud { top: 16%; right: 8px; padding: 7px 10px 8px; } .star-hud-near { font-size: 15px; } }
`;
/** The kit's selector of this plate (its classic copy is the kit's rules cut to it). */
export const isStarTrackerSelector = (/** @type {string} */ sel) => /\.star-hud(?![\w-])/.test(sel);

let root = null, parts = null, fill = null;
const shown = { vis: '', cls: '', light: -1 };

function ensureStyle(doc) {
  const lay = (id, text) => {
    if (doc.getElementById?.(id)) return;
    const st = doc.createElement('style');
    st.id = id;
    st.textContent = text;
    (doc.head ?? doc.body)?.append(st);
  };
  lay(STAR_TRACKER_STYLE_ID, STAR_TRACKER_CSS);
  if (doc.head) injectEnhancedFonts(doc);
  if (!isEnhancedPlus()) lay(STAR_TRACKER_KIT_ID, scopeRules(frameCss(), isStarTrackerSelector));
}
function build(doc) {
  ensureStyle(doc);
  const part = (cls) => { const n = doc.createElement('div'); n.className = cls; return n; };
  root = part('star-hud');
  root.setAttribute?.('aria-live', 'polite');
  parts = Object.fromEntries(STAR_TRACKER_KEYS.map((k) => [k, part(`star-hud-${k}`)]));
  const light = part('star-hud-light');
  fill = part('star-hud-fill');
  light.append(fill);
  root.append(parts.title, parts.near, parts.coven, parts.phase, light, parts.left);
  (doc.body ?? doc.documentElement)?.append(root);
}

/**
 * Draw the tracker for a reading (null hides it): `{ title, near, coven, phase, light, low, left, heart, held }`
 * (systems/starfall/starfallClient.js starTrackerModel); `hidden` the HUD's own hide.
 * @param {any} model @param {{ hidden?: boolean, doc?: any }} [o]
 */
export function drawStarTracker(model, { hidden = false, doc = globalThis.document } = {}) {
  const want = !hidden && !!model;
  if (!root) {
    if (!want || !doc?.createElement) return;
    build(doc);
  }
  const vis = want ? 'on' : 'off';
  if (vis !== shown.vis) { shown.vis = vis; root.style.display = want ? '' : 'none'; }
  if (!want) return;
  for (const k of STAR_TRACKER_KEYS) { const v = model[k] ?? ''; if (v !== shown[k]) { shown[k] = v; parts[k].textContent = v; } }
  const cls = `star-hud${model.heart ? ' heart' : ''}${model.low ? ' low' : ''}${model.held ? ' held' : ''}`;
  if (cls !== shown.cls) { shown.cls = cls; root.className = cls; }
  const pct = Math.round(Math.max(0, Math.min(1, Number(model.light) || 0)) * 100);
  if (pct !== shown.light) { shown.light = pct; fill.style.width = `${pct}%`; }
}
/** The tracker taken down (a load, a reset). */
export function destroyStarTracker() {
  root?.remove?.();
  root = null; parts = null; fill = null;
  shown.vis = ''; shown.cls = ''; shown.light = -1;
  for (const k of STAR_TRACKER_KEYS) delete shown[k];
}
