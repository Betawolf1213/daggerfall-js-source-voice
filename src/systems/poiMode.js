// poiMode.js - opt-in POI mode: ?poi on the URL or Shift+F8 at runtime, window.__poi probe, the fly camera's input and the HUD tag.
// Never active online; with POI off nothing here touches a key, a mouse event or the game's numbers.
import { isOnlinePage } from './onlineLane.js';

export const POI_FLY_SPEED = 40;   // units/s of the free camera, before Shift
export const POI_FLY_BOOST = 4;    // Shift's multiplier
const OWNED_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight']);

let _on = false;
let _blocked = () => false;
let _orbit = false;
let _installed = false;
let _hud = null;
const _held = new Set();
let _panning = false;
let _panX = 0, _panY = 0, _dolly = 0;
let _flyT = 0;   // seconds of flying so far (the probe's clock: distance = speed x this)

/** Pure: the free camera's velocity (units/s) for the held keys - WASD horizontal relative to yaw, Space up, Ctrl down, Shift x boost. */
export function flyVelocity(held, yaw, speed = POI_FLY_SPEED, boost = POI_FLY_BOOST) {
  const f = (held.has('KeyW') ? 1 : 0) - (held.has('KeyS') ? 1 : 0);
  const r = (held.has('KeyD') ? 1 : 0) - (held.has('KeyA') ? 1 : 0);
  const u = (held.has('Space') ? 1 : 0) - ((held.has('ControlLeft') || held.has('ControlRight')) ? 1 : 0);
  const k = speed * ((held.has('ShiftLeft') || held.has('ShiftRight')) ? boost : 1);
  const n = Math.hypot(f, r) || 1;   // diagonals are no faster
  const s = Math.sin(yaw), c = Math.cos(yaw);
  return [((s * f + c * r) / n) * k, u * k, ((c * f - s * r) / n) * k];
}

/** Pure: the position change for one frame - velocity x dt, so it is frame-rate independent. */
export const flyDelta = (held, yaw, dt, speed, boost) => flyVelocity(held, yaw, speed, boost).map((v) => v * dt);

/** Pure: a middle-drag of (dx, dy) pixels as a camera slide along the view's right and world-up (the grabbed world follows the cursor). */
export function panDelta(dx, dy, yaw, scale) {
  return [-dx * Math.cos(yaw) * scale, dy * scale, dx * Math.sin(yaw) * scale];
}

/** Pure: a wheel of `deltaY` as a dolly along the full look direction (wheel up = forward). */
export function dollyDelta(deltaY, yaw, pitch, scale) {
  const cp = Math.cos(pitch);
  const d = -deltaY * scale;
  return [Math.sin(yaw) * cp * d, Math.sin(pitch) * d, Math.cos(yaw) * cp * d];
}

export const poiOn = () => _on;
export const poiOwnsKey = (code) => OWNED_KEYS.has(code);
/** The orbit camera owns the wheel and the middle drag (it zooms and pans its target) - POI then flies the target with the keys alone. */
export const poiYieldToOrbit = (yes = true) => { _orbit = !!yes; };
export const poiOrbitActive = () => _orbit;
export const poiHeld = () => _held;
export const poiFlyTime = () => _flyT;

function paintHud() {
  if (typeof document === 'undefined' || !document.body) return;
  if (!_hud) {
    _hud = document.createElement('div');
    _hud.id = 'poi-mode-tag';
    _hud.textContent = 'POI MODE';
    _hud.style.cssText = 'position:fixed;top:6px;right:10px;z-index:9998;padding:1px 7px;font:11px/1.5 ui-monospace,Consolas,monospace;'
      + 'color:#ffd27a;background:rgba(10,12,24,0.55);border:1px solid rgba(255,210,122,0.4);border-radius:4px;pointer-events:none;opacity:0.85;';
    document.body.appendChild(_hud);
  }
  _hud.style.display = _on ? 'block' : 'none';
}

/** Turns POI mode on or off (refused online); answers the resulting state. */
export function setPoi(on, { online = isOnlinePage() } = {}) {
  _on = !!on && !online;
  _held.clear(); _panning = false; _panX = _panY = _dolly = 0;
  paintHud();
  return _on;
}
export const togglePoi = () => setPoi(!_on);

/** Stands the body at the flown position: no gravity, no landing, no wall. */
export function poiHoldFeet(player, to) {
  player.pinFeet(to[0], to[1], to[2]); player.velY = 0; player.falling = false; player.fallStart = player.pos[1]; player.holdFrame();
}

/** One frame of fly input: the camera's position change (keys + pending middle-drag + wheel), consuming the pending mouse. */
export function poiFlyFrame(dt, yaw, pitch, speed = POI_FLY_SPEED) {
  const d = flyDelta(_held, yaw, dt, speed, POI_FLY_BOOST);
  if (d[0] || d[1] || d[2]) _flyT += dt;
  const k = (speed / POI_FLY_SPEED) * ((_held.has('ShiftLeft') || _held.has('ShiftRight')) ? POI_FLY_BOOST : 1);   // pan and dolly scale with the fly speed, Shift too
  if (_panX || _panY) { const p = panDelta(_panX, _panY, yaw, 0.12 * k); d[0] += p[0]; d[1] += p[1]; d[2] += p[2]; }   // units per dragged pixel
  if (_dolly) { const w = dollyDelta(_dolly, yaw, pitch, 0.06 * k); d[0] += w[0]; d[1] += w[1]; d[2] += w[2]; }   // a 100-unit wheel notch is 6 units
  _panX = _panY = _dolly = 0;
  return d;
}

const typing = (t) => !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
const onCanvas = (e) => e.target?.tagName === 'CANVAS';
const swallow = (e) => { e.stopImmediatePropagation(); e.preventDefault(); };

/** Installs the URL flag, the Shift+F8 toggle, the __poi probe and the capture-phase input that owns the fly keys while POI is on. Idempotent. */
export function installPoiMode({ params = null, blocked = null, target = globalThis.window } = {}) {
  if (blocked) _blocked = blocked;
  if (params?.has?.('poi')) setPoi(true);
  if (_installed || !target?.addEventListener) return;
  _installed = true;
  try { Object.defineProperty(target, '__poi', { get: () => _on, set: (v) => { setPoi(!!v); }, configurable: true }); target.__poiFlyTime = poiFlyTime; } catch { /* a frozen window has no probe */ }
  target.addEventListener('keydown', (e) => {
    if (e.code === 'F8' && e.shiftKey) { if (!isOnlinePage()) { if (!e.repeat) togglePoi(); swallow(e); } return; }
    if (!_on || !OWNED_KEYS.has(e.code) || typing(e.target) || _blocked()) return;
    _held.add(e.code); swallow(e);   // POI owns these while on - the host's bindings never see the press
  }, true);
  target.addEventListener('keyup', (e) => { _held.delete(e.code); }, true);   // the release always passes: a key the host saw go down must see it come up
  target.addEventListener('blur', () => { _held.clear(); _panning = false; });
  target.addEventListener('mousedown', (e) => {
    if (!_on || _orbit || e.button !== 1 || !onCanvas(e) || _blocked()) return;
    _panning = true; swallow(e);
  }, true);
  target.addEventListener('mousemove', (e) => {
    if (!_panning) return;
    _panX += e.movementX || 0; _panY += e.movementY || 0; swallow(e);
  }, true);
  target.addEventListener('mouseup', (e) => { if (_panning && e.button === 1) { _panning = false; swallow(e); } }, true);
  target.addEventListener('wheel', (e) => {
    if (!_on || _orbit || !onCanvas(e) || _blocked()) return;
    _dolly += e.deltaY; swallow(e);
  }, { capture: true, passive: false });
}

/** Pure: a trip as POI mode bills it - no gold, no days (the arrival is the same minute). */
export const poiFreeTrip = (computed) => ({ ...(computed ?? {}), minutes: 0, piecesCost: 0, totalCost: 0 });
