// @ts-check
// ═══════════════════════════════════════════════════════════════════
// POI-3 (2026-10-14) - THE EDITOR IN THE WORLD: THE EYE, THE CURSOR, THE HANDLES.
//
// Mac: "POI Tool (General Map Editor) - Realtime editor ... even placement onto our actual map ... a tool my developers
// can use without having to access the codebase" (bible/06-Systems/POI-Editor-Arc.md POI-3). The editor stands in the
// real streamed world (scenes/world.js, `?editor`), over the game's own frame, and this is its host - DOM-free: the
// world hands it the events it captured and the frame it drew, and asks it for the camera and the lines.
//
//   - THE EYE (`cameraFrame`): the editor flies a camera of its own - the world's `cam` itself, so the streamer and the
//     floating origin follow it as they follow the dev fly-cam - while the body stands where the builder left it (held:
//     the world steps no motor while the editor is open). The right mouse button held: the mouse looks, the builder's
//     own movement keys fly along the look (the registry's actions, as the decorator's flight reads them - a rebind
//     reaches it), Jump or Float Up up, Crouch or Float Down down, Run faster, the wheel the speed - an engine's scene view.
//     The middle button pans; Alt with the left orbits the selection; F frames it.
//   - THE CURSOR (`pointerDown` ...): the pointer is free. A click is a pick: a gizmo handle first (a drag begins), then
//     the part under the ray (poiHost.pick - its triangles, exactly), then nothing (the selection let go). The first
//     click on a POI selects the POI; a click on a part of the POI already selected selects that part.
//   - THE HANDLES: move (W), turn (E), size (R), select (Q) - the world's axes or the thing's own (X); snapped when snap
//     is on, or while Ctrl is held. Every drag is ONE step of the editor's undo (poiEdit.js begin / preview / commit);
//     Escape lets it go. A POI sizes uniformly (the law's one size); a part along its own axes.
//   - PLACING (`placeNew`, `placeAsset`): a new POI, or a part from the library, follows the cursor on the ground and
//     stands where the click is.
//   - THE DRAFTS ON SCREEN: the working set laid over the live POIs (poiFeed.js setOverlay) whenever it moves - the drag
//     is drawn as it is made; a draft's colliders wait for the drag to end (poiHost.js collideDrafts).
//
// THE FOUR HOSTS (bible/Home.md): scenes/world.js - WIRED (`?editor`, a builder's alone - mountPoiEditor: the motor held
// and the eye the frame's while it is open, its drafts laid over the feed before the POI host's frame, its lines after the
// translucent pass, leaving back to the body or onto what is under the eye; refused online with the other powers,
// systems/onlineLane.js). scenes/worldModes.js - its interiors stand no POI: the editor opens outdoors alone.
// scenes/exterior.js - stands no POI (scenes/poiHost.js's flag): nothing here reaches it.
// scenes/dungeonContext.js - stands no street: nothing here reaches it.
//
// Not a DFU member. Ledger A (POI).
// ═══════════════════════════════════════════════════════════════════

import {
  movePlace, rotatePlace, scalePlace, movePart, rotatePart, scalePart, partWorldQuat, worldToPlace, newPart,
} from '../poi/poiEdit.js';
import { gizmoSize, gizmoShape, pickHandle, beginGizmoDrag, dragResult, POI_SNAP_DEFAULT, POI_GIZMO_PX } from '../poi/poiGizmo.js';
import { quatRotate } from '../world/quat.js';
import { lookDir } from './decorTool.js';
import { rayDirFromScreen } from '../player/tapRay.js';
import { canvasPoint } from '../player/travelPick.js';

/** The eye's speed (m/s): where it starts, its bounds, the wheel's step (a factor), Shift's and Ctrl's. */
export const POI_EYE = Object.freeze({ speed: 12, min: 0.5, max: 600, wheel: 1.25, fast: 4, look: 0.0035, pitch: 1.55 });
/** The registry's actions the eye flies by (systems/inputActions.js): never a raw key - a rebind reaches the editor. */
export const POI_EYE_ACTIONS = Object.freeze(['MoveForwards', 'MoveBackwards', 'MoveLeft', 'MoveRight', 'Jump', 'FloatUp', 'Crouch', 'FloatDown', 'Run']);
/** How far a pick reaches (m) - the streamed world's far edge. */
export const POI_PICK_REACH = 6000;
/** A drag begins once the pointer has moved this far (CSS px) - a click that wobbled is still a click. */
export const POI_CLICK_SLOP = 4;
/** The handles' colours: x red, y green, z blue, the view's and all-axes white, a hovered one yellow. */
export const POI_HANDLE_COLOR = Object.freeze({
  x: [0.93, 0.27, 0.27, 1], y: [0.45, 0.85, 0.3, 1], z: [0.3, 0.55, 0.98, 1],
  xy: [0.3, 0.55, 0.98, 0.9], yz: [0.93, 0.27, 0.27, 0.9], xz: [0.45, 0.85, 0.3, 0.9],
  view: [0.95, 0.95, 0.95, 1], all: [0.95, 0.95, 0.95, 1], hover: [1, 0.86, 0.2, 1],
});
/** A selected POI's boxes, a selected part's, and the placing mark. */
export const POI_BOX_COLOR = Object.freeze({ poi: [1, 0.7, 0.25, 0.9], part: [1, 0.86, 0.2, 1], ghost: [0.6, 0.9, 1, 1] });

const AXES_WORLD = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** A box's twelve edges as lines. @param {number[]} b [minX, minY, minZ, maxX, maxY, maxZ] */
export function boxLines(b, color) {
  const p = (i, j, k) => [i ? b[3] : b[0], j ? b[4] : b[1], k ? b[5] : b[2]];
  const out = [];
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    out.push({ a: p(0, i, j), b: p(1, i, j), color }, { a: p(i, 0, j), b: p(i, 1, j), color }, { a: p(i, j, 0), b: p(i, j, 1), color });
  }
  return out;
}

/**
 * @param {{
 *   edit: any, feed: any, host: any,
 *   view: () => ({ proj: Float32Array, view: Float32Array, eye: number[], fovY: number, w: number, h: number, rect?: any, canvasRect?: any } | null),
 *   translation: (px: number, py: number, out?: number[]) => number[],
 *   sceneToPixel: (p: number[]) => ({ px: number, py: number, x: number, z: number } | null),
 *   groundHit: (o: number[], d: number[]) => ({ point: number[] | null, dist: number }),
 *   surfaceAt: (x: number, z: number) => number,
 *   onChange?: () => void, pass?: any, actionOf?: (e: any) => (string | null),
 * }} deps `view` the frame the world last drew (its matrices, eye and canvas); `groundHit` the ground (and the world's
 *   meshes) under a ray; `sceneToPixel` a scene point as a map pixel and the spot in its frame; `pass` the lines' pass
 *   (render/poiGizmoPass.js) the frame's `drawLines` draws through
 */
export function createPoiEditorHost({ edit, feed, host, view, translation, sceneToPixel, groundHit, surfaceAt, onChange = () => {}, pass = null, actionOf = () => null }) {
  let on = false;
  /** @type {'select' | 'move' | 'turn' | 'size'} */
  let mode = 'move';
  /** @type {'world' | 'local'} */
  let space = 'world';
  let snapOn = false;
  const snap = { ...POI_SNAP_DEFAULT };
  const eye = { speed: /** @type {number} */ (POI_EYE.speed), look: false, pan: false, orbit: false, keys: new Set(), lastX: 0, lastY: 0 };
  let ctrlHeld = false;
  /** @type {string | null} */
  let hover = null;
  /** @type {null | { handle: string, state: any, id: string, part: string | null, light: number | null, start: any }} */
  let drag = null;
  /** @type {null | { x: number, y: number, moved: boolean, button: number }} */
  let press = null;
  /** @type {null | { kind: 'poi', name: string } | { kind: 'part', asset: any, fallbackName?: string }} */
  let placing = null;
  /** @type {number[] | null} */
  let placeAt = null;   // where the placing mark stands (scene frame)
  let overlayGen = -1;
  const told = () => { try { onChange(); } catch (e) { console.warn('[poi] editor listener', e); } };

  /** The cursor's ray through the frame the world drew: `{ o, d }` or null (off the world strip). */
  function rayAt(clientX, clientY) {
    const v = view();
    if (!v) return null;
    const [sx, sy] = canvasPoint(clientX, clientY, v.canvasRect);
    const d = rayDirFromScreen(sx, sy, v.w, v.h, v.proj, v.view, v.eye, v.rect ?? null);
    return d ? { o: [...v.eye], d } : null;
  }

  /** The selected thing's pivot and axes in the scene frame - `{ c, axes, q, doc }` - or null. */
  function target() {
    const sel = edit.selection();
    if (!sel) return null;
    const doc = edit.docOf(sel.id);
    if (!doc) return null;
    const t = translation(doc.place.px, doc.place.py, [0, 0, 0]);
    let ground = 0;
    if (doc.place.ground === 'snap') {
      const g = surfaceAt(t[0] + doc.place.x, t[2] + doc.place.z);
      if (!Number.isFinite(g)) return null;   // its ground not built yet: nothing to hold
      ground = g - t[1];
    }
    const origin = [t[0] + doc.place.x, t[1] + ground + doc.place.y, t[2] + doc.place.z];
    if (sel.light != null) {
      // a light: where it shines from, moved alone (it has no turn and no size of its own)
      const l = doc.lights?.[sel.light];
      if (!l) return null;
      return { c: add(origin, mul(quatRotate(doc.place.r, l.t), doc.place.s)), axes: AXES_WORLD, doc, sel, light: l };
    }
    if (sel.part == null) {
      const axes = space === 'local' || mode === 'size' ? AXES_WORLD.map((a) => quatRotate(doc.place.r, a)) : AXES_WORLD;
      return { c: origin, axes, doc, sel };
    }
    const part = doc.parts.find((p) => p.key === sel.part);
    if (!part) return null;
    const c = add(origin, mul(quatRotate(doc.place.r, part.t), doc.place.s));
    const q = partWorldQuat(doc.place, part);
    const axes = space === 'local' || mode === 'size' ? AXES_WORLD.map((a) => quatRotate(q, a)) : AXES_WORLD;
    return { c, axes, doc, sel, part };
  }

  /** The gizmo as poiGizmo.js reads it, at the selection, this frame - or null (none selected, or the select tool). */
  function gizmo() {
    if (mode === 'select') return null;
    const tg = target();
    const v = view();
    if (!tg || !v || (tg.light && mode !== 'move')) return null;
    const vd = sub(tg.c, v.eye);
    const l = Math.hypot(vd[0], vd[1], vd[2]) || 1;
    const viewDir = mul(vd, 1 / l);
    const L = gizmoSize(v.eye, viewDir, tg.c, v.fovY, v.h);
    return { mode, c: tg.c, axes: tg.axes, L, viewDir, pxWorld: L / POI_GIZMO_PX, tg };
  }

  /** Apply a drag's answer to a document - absolute from the drag's start (edit.preview hands the start's copy). */
  function apply(doc, r, sel) {
    if (sel.light != null) { const l = doc.lights?.[sel.light]; if (l && r.move) movePart(doc.place, l, r.move); return; }   // a light moves in its POI's frame, as a part does
    const part = sel.part == null ? null : doc.parts.find((p) => p.key === sel.part);
    if (r.move) { if (part) movePart(doc.place, part, r.move); else movePlace(doc.place, r.move); }
    if (r.turn && r.turn.deg) { if (part) rotatePart(doc.place, part, r.turn.axis, r.turn.deg); else rotatePlace(doc.place, r.turn.axis, r.turn.deg); }
    if (r.size) {
      if (part) scalePart(part, r.size);
      else scalePlace(doc.place, r.size.find((f) => f !== 1) ?? 1);   // the POI's one size: the dragged side's factor
    }
  }

  const snapNow = () => (snapOn !== ctrlHeld ? snap : null);

  function pickAt(clientX, clientY, additive = false) {
    const ray = rayAt(clientX, clientY);
    if (!ray) return;
    const hit = host.pick(ray.o, ray.d, POI_PICK_REACH);
    if (!hit) { if (!additive) edit.select(null); told(); return; }
    // only a POI being edited can be selected: a live one is opened for editing by the outliner's word (the UI asks)
    if (!edit.has(hit.id)) { told(); api.wantsOpen?.(hit.id); return; }
    // the first click on a POI takes the POI; once it is held, a click takes the part under the cursor
    const sel = edit.selection();
    edit.select(sel?.id === hit.id ? { id: hit.id, part: hit.key } : { id: hit.id, part: null });
    told();
  }

  /** Where the placing mark stands for a cursor - the ground (or a model) under it. */
  function groundUnder(clientX, clientY) {
    const ray = rayAt(clientX, clientY);
    if (!ray) return null;
    const g = groundHit(ray.o, ray.d);
    return g?.point ?? null;
  }

  function place(at) {
    const px = sceneToPixel(at);
    if (!px || !placing) return;
    // a model's spot is on the ground (or on what it was dropped on): a snap POI's height its lift above the ground
    const ground = surfaceAt(at[0], at[2]);
    const lift = Number.isFinite(ground) ? Math.max(0, at[1] - ground) : 0;
    if (placing.kind === 'poi') {
      edit.create({ px: px.px, py: px.py, x: px.x, z: px.z, y: lift, name: placing.name });
    } else {
      const asset = placing.asset;
      // no POI held: a new one stands round the model, named for it (or as the UI names a new one)
      if (!edit.selection()) edit.create({ px: px.px, py: px.py, x: px.x, z: px.z, y: lift, name: asset.name || placing.fallbackName || '' });
      const tg = target();
      if (!tg) return;
      const local = worldToPlace(tg.doc.place, sub(at, tg.sel.part == null ? tg.c : originOf(tg)));
      // every part of the model at once - one step - each where it stands from the model's origin, in the POI's own frame
      // (the model turns and sizes with its POI, as one thing)
      const pieces = asset.parts ?? [asset];
      let key = null;
      edit.edit(tg.sel.id, pieces.length > 1 ? 'add parts' : 'add part', (doc) => {
        for (const piece of pieces) {
          const off = piece.t ?? [0, 0, 0];
          const part = newPart(doc, { mesh: piece.mesh, submeshes: piece.submeshes, name: piece.name, materials: piece.materials ?? null, t: [local[0] + off[0], local[1] + off[1], local[2] + off[2]] });
          key ??= part.key;
          doc.parts.push(part);
        }
      });
      if (key) edit.select({ id: tg.sel.id, part: pieces.length > 1 ? null : key });
    }
    placing = null; placeAt = null;
    told();
  }
  /** The POI's own origin for a target that holds a part. */
  function originOf(tg) {
    if (!tg) return [0, 0, 0];
    return sub(tg.c, mul(quatRotate(tg.doc.place.r, tg.part.t), tg.doc.place.s));
  }

  const api = {
    active: () => on,
    /** Open the editor: the eye where the builder stands. */
    enter() { on = true; eye.keys.clear(); told(); },
    /** Close it: any drag let go, the overlay kept (the drafts are still the builder's), the eye given back. */
    exit() {
      if (drag) { edit.cancel(); drag = null; }
      placing = null; placeAt = null; press = null; hover = null;
      eye.look = eye.pan = eye.orbit = false; eye.keys.clear();
      on = false; told();
    },
    /** @type {((id: string) => void) | null} the UI's word when a live POI is clicked (open it for editing?) */
    wantsOpen: null,

    mode: () => mode,
    setMode(/** @type {'select' | 'move' | 'turn' | 'size'} */ m) { mode = m; hover = null; told(); },
    space: () => space,
    setSpace(/** @type {'world' | 'local'} */ s) { space = s; told(); },
    snapOn: () => snapOn,
    setSnap(/** @type {boolean} */ v, /** @type {{ move?: number, turn?: number, size?: number }} */ steps = {}) {
      snapOn = !!v;
      for (const k of ['move', 'turn', 'size']) if (Number.isFinite(steps[k]) && steps[k] > 0) snap[k] = steps[k];
      told();
    },
    snapSteps: () => ({ ...snap }),
    eyeSpeed: () => eye.speed,
    setEyeSpeed(/** @type {number} */ v) { eye.speed = clamp(v, POI_EYE.min, POI_EYE.max); told(); },
    hovered: () => hover,
    dragging: () => !!drag,
    placing: () => placing,
    /** Stand a new POI where the next click is (its name the UI's, in the builder's language). */
    placeNew(/** @type {string} */ name) { placing = { kind: 'poi', name }; told(); },
    /** Stand a library asset - a model's parts (`{ name, parts }`) or one part - in the selected POI where the next click
     *  is (none selected: a new POI round it, `fallbackName` its name when the model has none). */
    placeAsset(asset, fallbackName = '') { placing = { kind: 'part', asset, fallbackName }; told(); },
    cancelPlacing() { placing = null; placeAt = null; told(); },

    /**
     * The eye this frame (the world's `cam`): flown while the right button is held.
     * @param {number} dt seconds @param {{ pos: number[], yaw: number, pitch: number }} cam
     */
    cameraFrame(dt, cam) {
      if (!on || !eye.look) return;
      const k = eye.keys;   // the actions held (POI_EYE_ACTIONS)
      const f = lookDir(cam.yaw, cam.pitch), r = [Math.cos(cam.yaw), 0, -Math.sin(cam.yaw)];
      let mv = [0, 0, 0];
      if (k.has('MoveForwards')) mv = add(mv, f);
      if (k.has('MoveBackwards')) mv = sub(mv, f);
      if (k.has('MoveRight')) mv = add(mv, r);
      if (k.has('MoveLeft')) mv = sub(mv, r);
      if (k.has('Jump') || k.has('FloatUp')) mv = add(mv, [0, 1, 0]);
      if (k.has('Crouch') || k.has('FloatDown')) mv = sub(mv, [0, 1, 0]);
      const l = Math.hypot(mv[0], mv[1], mv[2]);
      if (!(l > 0)) return;
      const sp = eye.speed * (k.has('Run') ? POI_EYE.fast : 1);
      const step = mul(mv, (sp * dt) / l);
      for (let a = 0; a < 3; a++) cam.pos[a] += step[a];
    },
    /** Look, pan or orbit by a pointer's move (CSS px). @param {{ pos: number[], yaw: number, pitch: number }} cam */
    lookBy(dx, dy, cam) {
      if (eye.look) {
        cam.yaw += dx * POI_EYE.look;
        cam.pitch = clamp(cam.pitch - dy * POI_EYE.look, -POI_EYE.pitch, POI_EYE.pitch);
      } else if (eye.pan) {
        const r = [Math.cos(cam.yaw), 0, -Math.sin(cam.yaw)], f = lookDir(cam.yaw, cam.pitch);
        const u = [f[1] * r[2] - f[2] * r[1], f[2] * r[0] - f[0] * r[2], f[0] * r[1] - f[1] * r[0]];
        const k = eye.speed * 0.004;
        for (let a = 0; a < 3; a++) cam.pos[a] += -r[a] * dx * k + u[a] * dy * k;
      } else if (eye.orbit) {
        const tg = target();
        const pivot = tg ? tg.c : null;
        if (!pivot) return;
        const off = sub(cam.pos, pivot), dist = Math.hypot(off[0], off[1], off[2]);
        cam.yaw += dx * POI_EYE.look;
        cam.pitch = clamp(cam.pitch - dy * POI_EYE.look, -POI_EYE.pitch, POI_EYE.pitch);
        const f = lookDir(cam.yaw, cam.pitch);
        const p = sub(pivot, mul(f, dist));
        cam.pos[0] = p[0]; cam.pos[1] = p[1]; cam.pos[2] = p[2];
      }
    },
    /** Frame the selection: the eye backed off along its look until the selection's box fills a third of the view. */
    frameSelection(cam) {
      const tg = target();
      if (!tg) return false;
      let r = 4;
      const sel = edit.selection();
      if (sel.part != null) { const p = host.partOf(sel.id, sel.part); if (p?.box) r = Math.hypot(p.box[3] - p.box[0], p.box[4] - p.box[1], p.box[5] - p.box[2]) / 2; }
      else {
        let any = false; const b = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
        for (const part of tg.doc.parts) { const p = host.partOf(sel.id, part.key); if (p?.box) { any = true; for (let i = 0; i < 3; i++) { b[i] = Math.min(b[i], p.box[i]); b[i + 3] = Math.max(b[i + 3], p.box[i + 3]); } } }
        if (any) r = Math.hypot(b[3] - b[0], b[4] - b[1], b[5] - b[2]) / 2;
      }
      const f = lookDir(cam.yaw, cam.pitch), d = Math.max(2, r * 3);
      const p = sub(tg.c, mul(f, d));
      cam.pos[0] = p[0]; cam.pos[1] = p[1]; cam.pos[2] = p[2];
      return true;
    },

    /** A pointer pressed on the world (CSS client point, its button: 0 left, 1 middle, 2 right). Answers whether the
     *  editor took it. */
    pointerDown(/** @type {{ clientX: number, clientY: number, button: number, altKey?: boolean, shiftKey?: boolean }} */ e) {
      if (!on) return false;
      eye.lastX = e.clientX; eye.lastY = e.clientY;
      if (e.button === 2) { eye.look = true; return true; }
      if (e.button === 1) { eye.pan = true; return true; }
      if (e.button !== 0) return false;
      if (e.altKey) { eye.orbit = true; return true; }
      if (placing) { const at = groundUnder(e.clientX, e.clientY); if (at) place(at); return true; }
      const g = gizmo();
      if (g && hover) {
        const ray = rayAt(e.clientX, e.clientY);
        const state = ray ? beginGizmoDrag(g, hover, ray.o, ray.d) : null;
        if (state) {
          const sel = edit.selection();
          edit.begin(sel.id, mode === 'move' ? 'move' : mode === 'turn' ? 'turn' : 'size');
          drag = { handle: hover, state, id: sel.id, part: sel.part ?? null, light: sel.light ?? null, start: null };
          told();
          return true;
        }
      }
      press = { x: e.clientX, y: e.clientY, moved: false, button: 0 };
      return true;
    },
    /** The pointer moved. @param {{ clientX: number, clientY: number, ctrlKey?: boolean }} e @param {any} cam */
    pointerMove(e, cam) {
      if (!on) return false;
      const dx = e.clientX - eye.lastX, dy = e.clientY - eye.lastY;
      eye.lastX = e.clientX; eye.lastY = e.clientY;
      ctrlHeld = !!e.ctrlKey;
      if (eye.look || eye.pan || eye.orbit) { api.lookBy(dx, dy, cam); return true; }
      if (drag) {
        const ray = rayAt(e.clientX, e.clientY);
        const r = ray ? dragResult(drag.state, ray.o, ray.d, snapNow()) : null;
        if (r) { const sel = { id: drag.id, part: drag.part, light: drag.light }; edit.preview((doc) => apply(doc, r, sel)); }
        return true;
      }
      if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > POI_CLICK_SLOP) press.moved = true;
      if (placing) { placeAt = groundUnder(e.clientX, e.clientY); return true; }
      // the handle under the cursor, lit
      const g = gizmo();
      const ray = g ? rayAt(e.clientX, e.clientY) : null;
      const h = g && ray ? pickHandle(g, ray.o, ray.d) : null;
      if (h !== hover) { hover = h; told(); }
      return true;
    },
    pointerUp(/** @type {{ clientX: number, clientY: number, button: number, shiftKey?: boolean }} */ e) {
      if (!on) return false;
      if (e.button === 2) { eye.look = false; eye.keys.clear(); return true; }
      if (e.button === 1) { eye.pan = false; return true; }
      if (eye.orbit) { eye.orbit = false; return true; }
      if (drag) { edit.commit(); drag = null; told(); return true; }
      if (press && !press.moved) pickAt(e.clientX, e.clientY, !!e.shiftKey);
      press = null;
      return true;
    },
    /** The wheel: while flying, the eye's speed; else a step along the look. */
    wheel(/** @type {{ deltaY: number }} */ e, cam) {
      if (!on) return false;
      if (eye.look) { api.setEyeSpeed(eye.speed * (e.deltaY < 0 ? POI_EYE.wheel : 1 / POI_EYE.wheel)); return true; }
      const f = lookDir(cam.yaw, cam.pitch), step = (e.deltaY < 0 ? 1 : -1) * Math.max(0.5, eye.speed * 0.25);
      for (let a = 0; a < 3; a++) cam.pos[a] += f[a] * step;
      return true;
    },
    /**
     * A key pressed. Answers whether the editor took it (the world then lets nothing else hear it).
     * @param {{ code: string, key?: string, ctrlKey?: boolean, metaKey?: boolean, shiftKey?: boolean, repeat?: boolean }} e
     * @param {any} cam
     * @param {{ save?: () => void, del?: () => void, duplicate?: () => void }} [acts] the UI's own acts
     */
    keyDown(e, cam, acts = {}) {
      if (!on) return false;
      const mod = e.ctrlKey || e.metaKey;
      if (e.code === 'ControlLeft' || e.code === 'ControlRight') ctrlHeld = true;
      if (eye.look) { const a = actionOf(e); if (a && POI_EYE_ACTIONS.includes(a)) eye.keys.add(a); return true; }   // flying: the builder's own bindings
      if (mod && e.code === 'KeyZ') { if (e.shiftKey) edit.redo(); else edit.undo(); told(); return true; }
      if (mod && e.code === 'KeyY') { edit.redo(); told(); return true; }
      if (mod && e.code === 'KeyS') { acts.save?.(); return true; }
      if (mod && e.code === 'KeyD') { acts.duplicate?.(); return true; }
      if (mod) return true;
      switch (e.code) {
        case 'KeyQ': api.setMode('select'); return true;
        case 'KeyW': api.setMode('move'); return true;
        case 'KeyE': api.setMode('turn'); return true;
        case 'KeyR': api.setMode('size'); return true;
        case 'KeyX': api.setSpace(space === 'world' ? 'local' : 'world'); return true;
        case 'KeyF': api.frameSelection(cam); return true;
        case 'Delete': case 'Backspace': acts.del?.(); return true;
        case 'Escape':
          if (drag) { edit.cancel(); drag = null; }
          else if (placing) { placing = null; placeAt = null; }
          else edit.select(null);
          told();
          return true;
        default: return true;   // nothing the editor is open over hears a key
      }
    },
    keyUp(/** @type {{ code: string }} */ e) {
      if (!on) return false;
      if (e.code === 'ControlLeft' || e.code === 'ControlRight') ctrlHeld = false;
      const a = actionOf(e);
      if (a) eye.keys.delete(a);
      return true;
    },

    /** Once a frame: the working set laid over the live POIs when it moved. */
    frame() {
      const g = edit.generation();
      if (g !== overlayGen) { overlayGen = g; feed.setOverlay(edit.overlay()); }
    },
    /** Whether a draft's colliders may stand now (poiHost.js collideDrafts): not while it is dragged. */
    collideDrafts: () => !drag,

    /** The lines to draw this frame: `{ inWorld, onTop }` - the selection's boxes where the models stand, the gizmo and
     *  the placing mark over everything. */
    lineSets() {
      const inWorld = [], onTop = [];
      if (!on) return { inWorld, onTop };
      const sel = edit.selection();
      if (sel) {
        const doc = edit.docOf(sel.id);
        for (const part of doc?.parts ?? []) {
          const p = host.partOf(sel.id, part.key);
          if (!p?.box) continue;
          const color = sel.part === part.key ? POI_BOX_COLOR.part : POI_BOX_COLOR.poi;
          if (sel.part == null || sel.part === part.key) { inWorld.push(...boxLines(p.box, color)); onTop.push(...boxLines(p.box, [color[0], color[1], color[2], 0.22])); }
        }
      }
      // the selected POI's lights, each a small star where it shines from - the one selected lit
      if (sel) {
        const doc = edit.docOf(sel.id);
        const t0 = doc ? translation(doc.place.px, doc.place.py, [0, 0, 0]) : null;
        const g0 = doc?.place.ground === 'snap' ? surfaceAt(t0[0] + doc.place.x, t0[2] + doc.place.z) - t0[1] : 0;
        if (doc && Number.isFinite(g0)) {
          const origin = [t0[0] + doc.place.x, t0[1] + g0 + doc.place.y, t0[2] + doc.place.z];
          (doc.lights ?? []).forEach((l, i) => {
            const c = add(origin, mul(quatRotate(doc.place.r, l.t), doc.place.s)), k = 0.35;
            const color = sel.light === i ? POI_HANDLE_COLOR.hover : [l.color[0], l.color[1], l.color[2], 0.9];
            for (const a of AXES_WORLD) onTop.push({ a: sub(c, mul(a, k)), b: add(c, mul(a, k)), color });
          });
        }
      }
      const g = gizmo();
      if (g) {
        for (const s of gizmoShape(g.mode, g.c, g.axes, g.L, g.viewDir)) {
          if (s.hidden) continue;
          const color = (drag ? drag.handle === s.handle : hover === s.handle) ? POI_HANDLE_COLOR.hover : POI_HANDLE_COLOR[s.handle];
          for (const [a, b] of s.segs) onTop.push({ a, b, color });
        }
      }
      if (placing && placeAt) {
        const k = 0.6, c = POI_BOX_COLOR.ghost;
        onTop.push({ a: add(placeAt, [-k, 0, 0]), b: add(placeAt, [k, 0, 0]), color: c }, { a: add(placeAt, [0, 0, -k]), b: add(placeAt, [0, 0, k]), color: c }, { a: placeAt, b: add(placeAt, [0, 2, 0]), color: c });
      }
      return { inWorld, onTop };
    },
    /** Draw this frame's lines through the pass: the boxes where the models stand, then the handles over everything.
     *  Answers whether anything drew (the host marks its foreign pass then). One call from the frame (PERF-V8: the
     *  world's frame stays under V8's ceiling). */
    drawLines(proj, viewM) {
      if (!on || !pass) return false;
      const { inWorld, onTop } = api.lineSets();
      const a = pass.draw(proj, viewM, inWorld, { onTop: false }), b = pass.draw(proj, viewM, onTop, { onTop: true });
      return a || b;
    },
    /** The selection's pivot (the gizmo's centre) - the UI's readout and a test's. */
    pivot: () => target()?.c ?? null,
  };
  return api;
}
