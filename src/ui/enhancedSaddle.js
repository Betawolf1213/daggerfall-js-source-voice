// @ts-check
// STEED-UI - THE SADDLE PANEL (2026-10-11, the owner: "Proper UI elements for the horse + wagon/cart (Enhanced plus)").
// Horse care (STEED1) gave the horse a breath, a hunger and a bond; wagon upkeep (WAGONS4) gave the wagon a condition
// that wears to breaking - and the only places to read them were the Stable page, a pause away, and the grip bar's
// one meter. This is the saddle on screen, in Enhanced Plus, the helm panel's kind (ui/enhancedHelm.js, CSA-L - the
// player's ask there: "instead of an overuse of keybinds, is there a way we can instead develop enhanced plus UI
// elements?"):
//
// - WHAT IT READS, NEVER WRITES: the horse ridden (or the lead of the team driven) and the wagon, off the upkeep
//   (systems/upkeepRuntime.js saddle): its breath while ridden, winded or not; its hunger with the hours its food has
//   left; its bond's word and how far to the next; the wagon's state and share of whole; its load against its limit.
//   The title is the rider's - "Riding <name>" or "Driving the <wagon>" - with the gait and the pace beside it.
// - EVERY BUTTON IS A DOOR THAT ALREADY EXISTS: Feed oats and the apple are the Stable page's (upkeep.act), the kit is
//   the kit's Use, Cargo is a press on the wagon (horseCart.js openWagonCargo), Stable opens the Holdings page, View is
//   the view key's toggle (mwView.js), Dismount is Horse Cart and Cargo's mount key (handleQuickMountOrDismount) or the
//   classic transport's foot. The host answers each (`hooks`), so the panel is never a second law. The keys still work,
//   and a button whose door has a key bound shows it.
// - THE HUD'S KIND OF THING, NOT A WINDOW (the helm's law): it pauses nothing - the horse runs on under it - and
//   registers with no overlay stack; only its buttons take the pointer. A window over the HUD hides it. It stands under
//   the compass, where the helm stands - a boat's helm and a saddle are never up together.
// - THE MOUSE: its buttons take a click whenever the pointer is free (the free-mouse key, a surface, a finger); while
//   the look holds the pointer, the line under the title says how to free it.
// - A FINGER: every button a finger's size (44 px), the bar clear of the stick and the corner (the helm's own place).
// - A PAD: the d-pad stays the quick slots' (a rider's potions are on it); the pad's cursor presses the buttons as the
//   mouse does (ui/gamepadInput.js PADPLUS1).
//
// Enhanced Plus only: the classic skin keeps the grip bar's meter (ui/hud.js drawGripBar) and the keys.
// UPDATED, NOT REBUILT (the HUD's third law): the buttons and the meters are made again only when their set changes.
import { PIXEL_STACK } from './pixelifyFive.js';
import { injectEnhancedStyle } from './enhancedStyle.js';

export const ENHANCED_SADDLE_ID = 'enhanced-saddle';
const SADDLE_STYLE_ID = 'enhanced-saddle-style';

/** The registry actions whose keys the buttons name (KB1): Horse Cart and Cargo's mount (horseCart.js
 *  HCC_MOUNT_ACTION), the view's toggle, and the run - the gallop on a horse. */
export const SADDLE_ACTIONS = Object.freeze({ mount: 'HorseMount', view: 'TogglePerspective', run: 'Run' });

/** Below this pace (m/s) a horse or a wagon stands. */
export const STANDING_MPS = 0.3;
/** A breath under this share reads short (upkeepRuntime.js BREATH_LOW's twin, kept here so the panel imports no law). */
export const SADDLE_BREATH_LOW = 0.25;
/** The wagon's states' tones (wagonUpkeep.js WAGON_STATES): sound and worn read well, rickety warns, failing reads
 *  short. */
const WAGON_TONE = Object.freeze({ sound: 'ok', worn: 'ok', rickety: 'warn', failing: 'low' });
const HUNGER_TONE = Object.freeze({ fed: 'ok', hungry: 'warn', starving: 'low' });

/**
 * The gait's word: standing, galloping, else the ride's own pace - a horse trots, a wagon rolls.
 * @param {string} mode - 'Horse' | 'Cart' @param {number|null|undefined} speed - m/s @param {boolean} [galloping]
 */
export function saddleGait(mode, speed, galloping = false) {
  if (!Number.isFinite(speed) || /** @type {number} */ (speed) < STANDING_MPS) return 'Standing';
  if (mode === 'Horse' && galloping) return 'Galloping';
  return mode === 'Cart' ? 'Rolling' : 'Trotting';
}
/** The pace in kilometres an hour, whole; '' with none known. @param {number|null|undefined} speed - m/s */
export const saddleSpeedText = (speed) => (Number.isFinite(speed) ? `${Math.round(Math.max(0, /** @type {number} */ (speed)) * 3.6)} km/h` : '');

/** The bar's title: whose saddle - a horse's name, else the kind of the wagon driven. @param {any} s */
export function saddleTitle(s) {
  if (s.mode === 'Cart') return `Driving the ${s.wagonName || 'wagon'}`;
  return s.name ? `Riding ${s.name}` : 'Riding';
}

const pct = (share) => `${Math.round(Math.max(0, Math.min(1, share)) * 100)}%`;
/** Hours, as a rider reads them: whole hours past two, else minutes. */
export const fedText = (hours) => (hours >= 2 ? `${Math.floor(hours)}h` : `${Math.max(1, Math.round(hours * 60))}m`);

/**
 * The meters the bar shows, in order: the horse's breath (ridden only), its hunger (a team's, its hungriest horse's -
 * labelled Team), its bond; the wagon's state; its load. Each `{ key, label, text, tone, share? }` - `share` (0..1)
 * draws a bar, without one it is a chip. Pure.
 * @param {any} s
 */
export function saddleMeters(s) {
  if (!s) return [];
  const out = [];
  const h = s.horse;
  if (h) {
    if (h.breath != null) {
      const low = h.winded || h.breath < SADDLE_BREATH_LOW || h.hungerKey === 'starving';
      out.push({ key: 'breath', label: 'Breath', share: h.breath, text: h.winded ? 'Winded' : pct(h.breath), tone: low ? 'low' : 'ok' });
    }
    out.push({ key: 'hunger', label: h.team > 1 ? 'Team' : 'Hunger', text: h.hungerKey === 'fed' && h.fedHours > 0 ? `Fed ${fedText(h.fedHours)}` : h.hunger, tone: HUNGER_TONE[h.hungerKey] ?? 'ok' });
    // the bond: its word, and the way to the next (whole at Kindred)
    const span = h.next ? h.next.at - (h.tierAt ?? 0) : 0;
    const share = h.next ? (span > 0 ? (h.bond - (h.tierAt ?? 0)) / span : 0) : 1;
    out.push({ key: 'bond', label: 'Bond', share: Math.max(0, Math.min(1, share)), text: h.tier, tone: 'bond', title: h.next ? `${Math.floor(h.bond)} of ${h.next.at} to ${h.next.name}` : `${h.tier} - the bond is whole` });
  }
  const w = s.wagon;
  if (w) out.push({ key: 'wagon', label: w.name, share: w.share, text: `${w.state} ${pct(w.share)}`, tone: WAGON_TONE[w.stateKey] ?? 'ok' });
  const ld = s.load;
  if (ld && ld.limit > 0) {
    const share = ld.kg / ld.limit;
    out.push({ key: 'load', label: 'Load', share: Math.min(1, share), text: `${Math.round(ld.kg)}/${Math.round(ld.limit)} kg`, tone: share > 1 ? 'low' : share > 0.85 ? 'warn' : 'ok' });
  }
  return out;
}

/**
 * The buttons the bar shows for the saddle's state: each `{ act, label, action?, disabled?, why? }` - `act` the host's
 * hook that answers it, `action` the registry action whose bound key the button names, `why` what a dark one lacks (its
 * tooltip). A button that cannot act now is shown dark where its absence would hide what it needs (the oats, the kit,
 * the wagon's reach); one that can never act is not shown (no apple, a wagon a kit would not mend).
 * Pure: the pins read it.
 * @param {any} s
 */
export function saddleButtons(s) {
  if (!s) return [];
  const out = [];
  const h = s.horse;
  if (h) {
    const why = !s.near ? 'Your horse is not here' : h.full ? 'Full - it will not eat yet' : '';
    out.push({ act: 'feed', label: `Feed oats (${s.oats | 0})`, disabled: !(s.oats > 0) || !!why, why: why || (s.oats > 0 ? '' : 'No oats - a Stable sells them') });
    if (s.apples > 0) out.push({ act: 'treat', label: `Apple (${s.apples | 0})`, disabled: !!why, why });
  }
  if (s.wagon && s.wagon.kitWorks) {
    const why = !(s.kits > 0) ? 'No repair kit - a Wagon Yard sells them' : !s.wagonNear ? 'The wagon is out of reach' : '';
    out.push({ act: 'kit', label: `Repair kit (${s.kits | 0})`, disabled: !!why, why });
  }
  if (s.cargo != null) out.push({ act: 'cargo', label: 'Cargo', disabled: !s.cargo, why: s.cargo ? '' : 'The wagon is out of reach' });
  out.push({ act: 'stable', label: 'Stable' });
  if (s.view) out.push({ act: 'view', label: 'View', action: SADDLE_ACTIONS.view });
  out.push({ act: 'dismount', label: s.mode === 'Cart' ? 'Climb down' : 'Dismount', action: s.hcc ? SADDLE_ACTIONS.mount : null });
  return out;
}

/**
 * The line under the title: what the horse needs now (winded, starving, a wagon failing), else on a keyboard the gallop's
 * key while ridden, and while the look holds the mouse, how to free it for the buttons. A finger reads the meters.
 * @param {any} s @param {{ touch?: boolean, mouseFree?: boolean, freeKey?: string, keyOf?: (a: string) => string }} state
 */
export function saddleHint(s, state = {}) {
  const h = s.horse, w = s.wagon;
  if (h?.winded) return 'Winded - ease off and let it breathe';
  if (h?.hungerKey === 'starving') return s.mode === 'Horse' ? 'Starving - it will not gallop until it eats' : 'Starving - feed your horse';
  if (w?.stateKey === 'failing') return `The ${w.name.toLowerCase()} is failing - mend it to get its pace back`;
  if (state.touch) return '';
  const parts = [];
  const run = state.keyOf?.(SADDLE_ACTIONS.run) ?? '';
  if (s.mode === 'Horse' && h && run) parts.push(`Gallop: hold ${run}`);
  if (!state.mouseFree) parts.push(`Free the mouse (${state.freeKey || 'Y'}) to use these`);
  return parts.join(' · ');
}

/** The layout and the letters; the Plus kit paints the bar and the buttons (enhancedFrame.js FRAME_ROLES). */
export const SADDLE_CSS = `
/* STEED-UI: THE SADDLE PANEL (ui/enhancedSaddle.js) - under the compass, above the HUD and below every window */
.saddlepanel { position: fixed; inset: 0; z-index: 5; pointer-events: none; font-family: ${PIXEL_STACK}; -webkit-font-smoothing: none;
  font-variant-ligatures: none; color: #d8cfae; --sp-top: calc(18px + 28px * var(--hud-scale, 1) + 20px); }
body:has(.hud-foe.on) .saddlepanel { --sp-top: calc(18px + 28px * var(--hud-scale, 1) + 20px + 46px * var(--hud-scale, 1)); }
.saddlepanel-bar { position: absolute; left: 50%; top: var(--sp-top); transform: translateX(-50%); display: flex; flex-direction: column;
  align-items: center; gap: 6px; padding: 8px 12px; width: max-content; max-width: calc(100vw - 24px); box-sizing: border-box; border: 2px solid; border-radius: 0; }
.saddlepanel-title { display: flex; flex-wrap: wrap; justify-content: center; align-items: baseline; gap: 4px 12px; }
.saddlepanel-name { font-size: 15px; letter-spacing: 0.06em; color: #efe8d6; text-shadow: 1px 1px 0 #050608; }
.saddlepanel-gait { font-size: 13px; letter-spacing: 0.06em; color: #d9c48a; text-shadow: 1px 1px 0 #050608; font-variant-numeric: tabular-nums; }
.saddlepanel-gait:empty { display: none; }
.saddlepanel-hint { font-size: 11px; letter-spacing: 0.08em; color: #a89f88; text-shadow: 1px 1px 0 #050608; }
.saddlepanel-hint:empty { display: none; }
.saddlepanel-hint.warn { color: #e8b04a; }
.saddlepanel-meters { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 6px 14px; }
.saddlepanel-meters:empty { display: none; }
.saddlepanel-meter { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; letter-spacing: 0.06em; text-shadow: 1px 1px 0 #050608; }
.saddlepanel-mlabel { color: #a89f88; }
.saddlepanel-mtext { color: #e6dec6; font-variant-numeric: tabular-nums; }
.saddlepanel-track { position: relative; width: 64px; height: 8px; background: rgba(5,6,8,0.75); border: 1px solid #5a5446; box-sizing: border-box; }
.saddlepanel-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: #7fae5a; }
.saddlepanel-meter.ok .saddlepanel-fill { background: #7fae5a; }
.saddlepanel-meter.warn .saddlepanel-fill { background: #d9a441; }
.saddlepanel-meter.warn .saddlepanel-mtext { color: #e8b04a; }
.saddlepanel-meter.low .saddlepanel-fill { background: #c4523e; }
.saddlepanel-meter.low .saddlepanel-mtext { color: #e2735e; }
.saddlepanel-meter.bond .saddlepanel-fill { background: #c08a3e; }
.saddlepanel-meter.bond .saddlepanel-mtext { color: #f3cf86; }
.saddlepanel-btns { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 6px; }
.saddlepanel-btns:empty { display: none; }
.saddlepanel-btn { pointer-events: auto; display: inline-flex; align-items: center; gap: 6px; min-height: 32px; padding: 4px 10px;
  border: 2px solid; border-radius: 0; font: inherit; font-size: 13px; letter-spacing: 0.06em; color: #e6dec6; cursor: pointer;
  text-shadow: 1px 1px 0 #050608; touch-action: none; user-select: none; -webkit-user-select: none; }
.saddlepanel-btn[disabled] { opacity: 0.45; cursor: default; }
.saddlepanel-key { font-size: 11px; letter-spacing: 0.04em; color: #a89f88; }
.saddlepanel-key:empty { display: none; }
/* the helm's finger place (ui/enhancedHelm.js AUDIT NAV1): centred in the room right of the corner's two presses */
.saddlepanel.touch .saddlepanel-bar { top: calc(8px + env(safe-area-inset-top, 0px)); left: calc(50% + 56px + (env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)) / 2);
  max-width: calc(100vw - 144px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)); }
.saddlepanel.touch .saddlepanel-btn { min-height: 44px; min-width: 44px; }
.saddlepanel.touch .saddlepanel-key { display: none; }
@media (max-width: 560px) { .saddlepanel-btn { padding: 4px 7px; font-size: 12px; } .saddlepanel-track { width: 44px; } }
`;

let host = null;
/** @type {any} */
let parts = null;
/** @type {any} */
let last = null;

function injectSaddleStyle(doc) {
  if (doc.getElementById?.(SADDLE_STYLE_ID)) return;
  const st = doc.createElement('style');
  st.id = SADDLE_STYLE_ID;
  st.textContent = SADDLE_CSS;
  (doc.head ?? doc.body)?.append?.(st);
}
/** A press on the panel is the panel's - never a swing, a look or an activation in the world (the helm's law). */
const swallowPresses = (node) => {
  const swallow = (e) => e.stopPropagation();
  for (const t of ['pointerdown', 'mousedown', 'mouseup', 'click', 'touchstart', 'wheel', 'contextmenu']) node.addEventListener(t, swallow);
};
const span = (doc, cls) => { const n = doc.createElement('span'); n.className = cls; return n; };
const clear = (node) => { if (typeof node.replaceChildren === 'function') node.replaceChildren(); else node.textContent = ''; };

function build(doc) {
  try { injectEnhancedStyle(doc); } catch { /* the kit's sheet is the HUD's; a document without it still takes the panel */ }
  injectSaddleStyle(doc);
  const root = doc.createElement('div');
  root.id = ENHANCED_SADDLE_ID;
  root.className = 'saddlepanel';
  const bar = doc.createElement('div');
  bar.className = 'saddlepanel-bar';
  const title = doc.createElement('div');
  title.className = 'saddlepanel-title';
  const name = span(doc, 'saddlepanel-name'), gait = span(doc, 'saddlepanel-gait'), hint = span(doc, 'saddlepanel-hint');
  title.append(name, gait, hint);
  const meters = doc.createElement('div');
  meters.className = 'saddlepanel-meters';
  const btns = doc.createElement('div');
  btns.className = 'saddlepanel-btns';
  bar.append(title, meters, btns);
  root.append(bar);
  swallowPresses(root);
  doc.body.append(root);
  return { root, bar, name, gait, hint, meters, btns, buttons: new Map(), meterParts: new Map() };
}

function makeMeters(doc, list) {
  clear(parts.meters);
  parts.meterParts.clear();
  for (const m of list) {
    const n = doc.createElement('span');
    n.className = `saddlepanel-meter saddlepanel-m-${m.key}`;
    n.dataset.key = m.key;
    const label = span(doc, 'saddlepanel-mlabel');
    n.append(label);
    let fill = null;
    if (m.share != null) {
      const track = span(doc, 'saddlepanel-track');
      fill = span(doc, 'saddlepanel-fill');
      track.append(fill);
      n.append(track);
    }
    const text = span(doc, 'saddlepanel-mtext');
    n.append(text);
    parts.meters.append(n);
    parts.meterParts.set(m.key, { node: n, label, fill, text });
  }
}

function makeButtons(doc, list, hooks) {
  clear(parts.btns);
  parts.buttons.clear();
  for (const b of list) {
    const n = doc.createElement('button');
    n.type = 'button';
    n.className = `saddlepanel-btn saddlepanel-${b.act}`;
    n.dataset.act = b.act;
    const label = span(doc, 'saddlepanel-label'), key = span(doc, 'saddlepanel-key');
    n.append(label, key);
    // AUDIT STEED-UI: a button never keeps the keyboard's focus - a focused one is clicked again by the next Space or
    // Enter the look's keys send through (a Jump's keyup spent a second kit, an hour with it), so a press never takes it
    n.addEventListener('mousedown', (e) => e.preventDefault?.());
    n.addEventListener('click', (e) => {
      e.preventDefault?.();
      n.blur?.();
      if (n.disabled) return;
      hooks[b.act]?.();
    });
    parts.btns.append(n);
    parts.buttons.set(b.act, { node: n, label, key });
  }
}

/**
 * The panel's frame. `state`: { saddle: the host's read (or null - nothing to show), covered, touch, mouseFree,
 * freeKey (the free-mouse key's label), keyOf(action) -> its key's label }. The saddle's read: { mode 'Horse'|'Cart',
 * name, wagonName, speed (m/s), galloping, horse, wagon, oats, apples, kits (upkeepRuntime.js saddle), load { kg, limit }
 * | null, near, wagonNear, cargo (null: no wagon to open; else whether it can be reached), view, hcc }. `hooks`: feed,
 * treat, kit, cargo, stable, view, dismount. Returns the root, or null when nothing stands.
 */
export function drawEnhancedSaddle(state = {}, hooks = {}, { doc = globalThis.document } = {}) {
  if (!doc?.body) return null;
  const s = state.saddle ?? null;
  if (!s) { hideEnhancedSaddle(); return null; }
  if (!host) { last = {}; parts = build(doc); host = parts.root; }
  if (state.covered) {
    if (last.covered !== true) { last.covered = true; parts.root.style.display = 'none'; }
    return parts.root;
  }
  if (last.covered === true) { last.covered = false; parts.root.style.display = ''; }
  const hud = /** @type {any} */ (doc.querySelector?.('.hud'));
  const scale = hud?.style?.getPropertyValue?.('--hud-scale') || '1';   // the HUD's scale, read off the HUD (the helm's own read)
  if (last.scale !== scale) { last.scale = scale; parts.root.style.setProperty?.('--hud-scale', scale); }
  const rootClass = `saddlepanel${state.touch ? ' touch' : ''}`;
  if (last.rootClass !== rootClass) { last.rootClass = rootClass; parts.root.className = rootClass; }
  const title = saddleTitle(s);
  if (last.title !== title) { last.title = title; parts.name.textContent = title; }
  const gait = [saddleGait(s.mode, s.speed, s.galloping), saddleSpeedText(s.speed)].filter(Boolean).join(' · ');
  if (last.gait !== gait) { last.gait = gait; parts.gait.textContent = gait; }
  const hint = saddleHint(s, state);
  const hintWarn = !!(s.horse?.winded || s.horse?.hungerKey === 'starving' || s.wagon?.stateKey === 'failing');
  if (last.hint !== hint || last.hintWarn !== hintWarn) { last.hint = hint; last.hintWarn = hintWarn; parts.hint.textContent = hint; parts.hint.className = `saddlepanel-hint${hintWarn ? ' warn' : ''}`; }
  // the meters: made again only when their set changes (a bar becoming a chip is a new set)
  const meters = saddleMeters(s);
  const msig = meters.map((m) => `${m.key}${m.share != null ? '#' : ''}`).join(',');
  if (last.msig !== msig) { last.msig = msig; last.meters = {}; makeMeters(doc, meters); }
  for (const m of meters) {
    const p = parts.meterParts.get(m.key);
    if (!p) continue;
    const width = m.share != null ? `${(Math.max(0, Math.min(1, m.share)) * 100).toFixed(1)}%` : null;
    const was = last.meters[m.key];
    if (!was || was.label !== m.label || was.text !== m.text || was.tone !== m.tone || was.width !== width || was.title !== m.title) {
      last.meters[m.key] = { label: m.label, text: m.text, tone: m.tone, width, title: m.title };
      p.label.textContent = m.label;
      p.text.textContent = m.text;
      p.node.className = `saddlepanel-meter saddlepanel-m-${m.key} ${m.tone}`;
      if (p.fill && width != null) p.fill.style.width = width;
      if (m.title) p.node.setAttribute?.('title', m.title); else p.node.removeAttribute?.('title');
    }
  }
  const list = saddleButtons(s);
  const sig = list.map((b) => b.act).join(',');
  if (last.sig !== sig) { last.sig = sig; last.labels = {}; makeButtons(doc, list, hooks); }
  for (const b of list) {
    const p = parts.buttons.get(b.act);
    if (!p) continue;
    const key = b.action && !state.touch ? (state.keyOf?.(b.action) ?? '') : '';
    const was = last.labels[b.act];
    const why = b.disabled ? (b.why ?? '') : '';
    if (!was || was.label !== b.label || was.key !== key || was.disabled !== !!b.disabled || was.why !== why) {
      last.labels[b.act] = { label: b.label, key, disabled: !!b.disabled, why };
      p.label.textContent = b.label;
      p.key.textContent = key;
      p.node.disabled = !!b.disabled;
      p.node.setAttribute?.('aria-label', why ? `${b.label} - ${why}` : b.label);
      if (why) p.node.setAttribute?.('title', why); else p.node.removeAttribute?.('title');
    }
  }
  return parts.root;
}

/** Taken down: out of the saddle, the skin or the switch off, a door. */
export function hideEnhancedSaddle() {
  if (!host) return;
  try { host.remove(); } catch { /* already gone */ }
  host = null; parts = null; last = null;
}

export const enhancedSaddleMounted = () => !!host;
/** The bar standing now - mounted and not covered - or null (the helm's enhancedHelmBar's twin). */
export const enhancedSaddleBar = () => (host && last?.covered !== true ? parts.bar : null);
