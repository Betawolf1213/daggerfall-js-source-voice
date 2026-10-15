// @ts-check
// ═══════════════════════════════════════════════════════════════════
// POI-5 (2026-10-14) - THE UV EDITOR'S HANDS: WHAT IS SELECTED, WHAT A PRESS DOES, AND EVERY STEP BACK.
//
// Mac: "Full UV editor" (bible/06-Systems/POI-Editor-Arc.md POI-5). Over one part's mesh as poi/uvMesh.js holds it, one
// material's faces at a time (the submesh its picture is drawn on), pure - the panel (ui/poiUvPanel.js) draws it and
// hands it the presses, a test drives it alone:
//
//   - FOUR WAYS TO SELECT: a UV VERTEX (every corner at that point of its island), an EDGE (a face's side, as the picture
//     shows it - a seam's two copies are two edges), a FACE, an ISLAND; a click the nearest within reach (or the face
//     under it), Shift adding to the selection (or taking away what is already in it), a box everything inside it.
//   - THE TOOLS over the selection (the whole material when nothing is selected): move, turn and size about the
//     selection's centre, flip; mark and clear seams along selected edges; unwrap; project (planar along an axis, box,
//     cylindrical, spherical); pack the islands; read and set the texel density against the material's picture.
//   - EVERY TOOL IS ONE STEP of the UV editor's own undo (the corners' UVs and the seams as they were); a drag is one
//     step however long (`begin` / `drag` / `end`).
//   - THE RESULT (`result`): the part's mesh made again (uvMesh.js meshFromSession) - the editor uploads it under its
//     new name and the part wears it, one step of the POI's undo.
//
// Not a DFU member. Ledger A (POI).
// ═══════════════════════════════════════════════════════════════════

import {
  uvSessionOf, islandsOf, cornersOf, uvVertexCorners, uvCentre, transformCorners, edgeKey, setSeam, projectPlanar,
  projectBox, projectCylinder, projectSphere, unwrapLscm, packIslands, texelDensity, setTexelDensity, meshFromSession,
  uvBounds,
} from './uvMesh.js';

/** The steps the UV editor's undo keeps. */
export const UV_UNDO_DEPTH = 100;
export const UV_MODES = Object.freeze(['vertex', 'edge', 'face', 'island']);

/** The distance from a point to a segment, in UV. */
function segDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
  const t = l2 > 0 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)) : 0;
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}
/** Is p inside the triangle (either winding)? */
function inTri(p, a, b, c) {
  const s1 = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  const s2 = (c[0] - b[0]) * (p[1] - b[1]) - (c[1] - b[1]) * (p[0] - b[0]);
  const s3 = (a[0] - c[0]) * (p[1] - c[1]) - (a[1] - c[1]) * (p[0] - c[0]);
  return (s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0);
}

/**
 * @param {any} mesh a POI mesh (poiMesh.js decodePoiMesh's `mesh`) @param {{ sub?: number }} [opts] the material's submesh
 */
export function createUvEdit(mesh, { sub = 0 } = {}) {
  const s = uvSessionOf(mesh);
  /** @type {'vertex' | 'edge' | 'face' | 'island'} */
  let mode = 'face';
  let shownSub = sub;
  /** @type {Set<number>} the selection: corners (vertex), face*3+side (edge), faces (face, island) */
  let sel = new Set();
  let undo = [], redo = [];
  let dragStart = null;
  let gen = 0;
  const shownFaces = () => { const out = []; for (let f = 0; f < s.faces; f++) if (s.triSub[f] === shownSub) out.push(f); return out; };
  const uv = (c) => [s.cornerUv[c * 2], s.cornerUv[c * 2 + 1]];
  const snapshot = () => ({ uv: Float64Array.from(s.cornerUv), seams: new Set(s.seams) });
  const restore = (snap) => { s.cornerUv.set(snap.uv); s.seams = new Set(snap.seams); gen++; };
  const step = (fn) => {
    const before = snapshot();
    fn();
    undo.push(before);
    if (undo.length > UV_UNDO_DEPTH) undo.shift();
    redo = [];
    gen++;
  };
  const islandOf = (f) => islandsOf(s, shownFaces()).find((g) => g.includes(f)) ?? [f];

  /** The faces the selection stands on (the whole material when nothing is selected). */
  function selectedFaces() {
    if (!sel.size) return shownFaces();
    const out = new Set();
    if (mode === 'face' || mode === 'island') for (const f of sel) out.add(f);
    else if (mode === 'edge') for (const e of sel) out.add(Math.floor(e / 3));
    else for (const c of sel) out.add(Math.floor(c / 3));
    return [...out];
  }
  /** The corners a tool moves: every corner sharing a UV point with the selection (or the whole material). */
  function selectedCorners() {
    if (!sel.size) return cornersOf(shownFaces());
    const out = new Set();
    const islands = islandsOf(s, shownFaces());
    const islOf = (f) => islands.find((g) => g.includes(f));
    const addVertex = (c) => { for (const k of uvVertexCorners(s, c, islOf(Math.floor(c / 3)))) out.add(k); };
    if (mode === 'vertex') for (const c of sel) addVertex(c);
    else if (mode === 'edge') for (const e of sel) { const f = Math.floor(e / 3), i = e % 3; addVertex(f * 3 + i); addVertex(f * 3 + (i + 1) % 3); }
    else for (const f of sel) for (let k = 0; k < 3; k++) addVertex(f * 3 + k);
    return [...out];
  }

  const api = {
    session: s,
    generation: () => gen,
    mode: () => mode,
    setMode(/** @type {'vertex' | 'edge' | 'face' | 'island'} */ m) { if (m !== mode) { mode = m; sel = new Set(); gen++; } },
    submesh: () => shownSub,
    setSubmesh(n) { if (n >= 0 && n < s.submeshes && n !== shownSub) { shownSub = n; sel = new Set(); gen++; } },
    faces: shownFaces,
    selection: () => new Set(sel),
    selectedCorners,
    selectedFaces,
    clear() { if (sel.size) { sel = new Set(); gen++; } },
    selectAll() {
      sel = new Set();
      if (mode === 'vertex') for (const c of cornersOf(shownFaces())) sel.add(c);
      else if (mode === 'edge') for (const f of shownFaces()) for (let i = 0; i < 3; i++) sel.add(f * 3 + i);
      else for (const f of shownFaces()) sel.add(f);
      gen++;
    },

    /**
     * A click at (u, v): the nearest thing of the mode within `reach` (UV units - the panel's few pixels), or the face
     * under it. `add` (Shift): added to the selection, or taken from it if it is there already. Answers what was hit.
     */
    pick(u, v, reach, add = false) {
      const p = [u, v];
      let hit = null;
      const faces = shownFaces();
      if (mode === 'vertex') {
        let best = reach;
        for (const c of cornersOf(faces)) { const d = Math.hypot(uv(c)[0] - u, uv(c)[1] - v); if (d <= best) { best = d; hit = c; } }
      } else if (mode === 'edge') {
        let best = reach;
        for (const f of faces) for (let i = 0; i < 3; i++) { const d = segDist(p, uv(f * 3 + i), uv(f * 3 + (i + 1) % 3)); if (d <= best) { best = d; hit = f * 3 + i; } }
      } else {
        for (const f of faces) if (inTri(p, uv(f * 3), uv(f * 3 + 1), uv(f * 3 + 2))) { hit = f; break; }
      }
      const items = hit === null ? [] : mode === 'island' ? islandOf(hit) : [hit];
      if (!add) sel = new Set();
      const all = items.length && items.every((x) => sel.has(x));
      for (const x of items) { if (add && all) sel.delete(x); else sel.add(x); }
      gen++;
      return hit;
    },
    /** A box from (u0, v0) to (u1, v1): every vertex inside it, every edge wholly inside, every face (or island) whose
     *  centre is inside. */
    box(u0, v0, u1, v1, add = false) {
      const [a0, a1] = [Math.min(u0, u1), Math.max(u0, u1)], [b0, b1] = [Math.min(v0, v1), Math.max(v0, v1)];
      const inside = (q) => q[0] >= a0 && q[0] <= a1 && q[1] >= b0 && q[1] <= b1;
      if (!add) sel = new Set();
      const faces = shownFaces();
      if (mode === 'vertex') { for (const c of cornersOf(faces)) if (inside(uv(c))) sel.add(c); }
      else if (mode === 'edge') { for (const f of faces) for (let i = 0; i < 3; i++) if (inside(uv(f * 3 + i)) && inside(uv(f * 3 + (i + 1) % 3))) sel.add(f * 3 + i); }
      else {
        for (const f of faces) {
          const c = [(uv(f * 3)[0] + uv(f * 3 + 1)[0] + uv(f * 3 + 2)[0]) / 3, (uv(f * 3)[1] + uv(f * 3 + 1)[1] + uv(f * 3 + 2)[1]) / 3];
          if (inside(c)) { if (mode === 'island') for (const g of islandOf(f)) sel.add(g); else sel.add(f); }
        }
      }
      gen++;
    },

    /** The selection's centre (the tools' pivot). */
    pivot: () => uvCentre(s, [...new Set(selectedCorners())]),
    /** Move, turn and size the selection about its centre - one step. */
    transform(op) { const cs = selectedCorners(); const pivot = uvCentre(s, cs); step(() => transformCorners(s, cs, { ...op, pivot: op.pivot ?? pivot })); },
    /** A drag: begun (the UVs as they stand kept), moved (each time from the start - no error gathered), ended (one step). */
    begin() { dragStart = { snap: snapshot(), corners: selectedCorners() }; dragStart.pivot = uvCentre(s, dragStart.corners); },
    drag(op) {
      if (!dragStart) return;
      s.cornerUv.set(dragStart.snap.uv);
      transformCorners(s, dragStart.corners, { ...op, pivot: op.pivot ?? dragStart.pivot });
      gen++;
    },
    end() {
      if (!dragStart) return false;
      const before = dragStart.snap;
      dragStart = null;
      if (before.uv.every((x, i) => x === s.cornerUv[i])) return false;
      undo.push(before); if (undo.length > UV_UNDO_DEPTH) undo.shift(); redo = []; gen++;
      return true;
    },
    cancel() { if (dragStart) { restore(dragStart.snap); dragStart = null; } },
    dragging: () => !!dragStart,
    /** Flip the selection over its centre, along u or v. */
    flip(/** @type {'u' | 'v'} */ axis) { api.transform({ scale: axis === 'u' ? [-1, 1] : [1, -1] }); },

    /** Seams along the selected edges (edge mode): marked, or cleared. Answers how many changed. */
    seams(on) {
      if (mode !== 'edge' || !sel.size) return 0;
      let n = 0;
      step(() => {
        for (const e of sel) {
          const f = Math.floor(e / 3), i = e % 3;
          const a = s.weld[s.tris[f * 3 + i]], b = s.weld[s.tris[f * 3 + (i + 1) % 3]];
          const had = s.seams.has(edgeKey(a, b));
          if (had !== on && setSeam(s, a, b, on)) n++;
        }
      });
      return n;
    },
    /** Unwrap the selection's faces (their islands, cut by the seams) - least-squares conformal maps. */
    unwrap() { const fs = selectedFaces(); let islands = []; step(() => { islands = unwrapLscm(s, fs); }); return islands.length; },
    /** Project the selection's faces: 'x' 'y' 'z' planar along that axis, 'box', 'cylinder' (about `axis`), 'sphere'. */
    project(kind, axis = 'y') {
      const fs = selectedFaces();
      const dir = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }[axis] ?? [0, 1, 0];
      // the curved projections about the selection's own centre in the mesh
      let cx = 0, cy = 0, cz = 0, n = 0;
      for (const c of cornersOf(fs)) { const v = s.tris[c]; cx += s.positions[v * 3]; cy += s.positions[v * 3 + 1]; cz += s.positions[v * 3 + 2]; n++; }
      const centre = n ? [cx / n, cy / n, cz / n] : [0, 0, 0];
      step(() => {
        if (kind === 'box') projectBox(s, fs);
        else if (kind === 'cylinder') projectCylinder(s, fs, dir, centre);
        else if (kind === 'sphere') projectSphere(s, fs, centre);
        else projectPlanar(s, fs, { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }[kind] ?? dir);
      });
    },
    /** Pack the selection's islands (the material's, when nothing is selected) into the square. Answers the scale. */
    pack({ margin = 0.01, rotate = true } = {}) {
      const isl = islandsOf(s, selectedFaces());
      let k = 0;
      step(() => { k = packIslands(s, isl, { margin, rotate }); });
      return k;
    },
    /** Fit the selection into the square, its proportions kept. */
    fit() {
      const cs = selectedCorners();
      const [u0, v0, u1, v1] = uvBounds(s, cs);
      const w = u1 - u0, h = v1 - v0, k = 1 / Math.max(w, h, 1e-9);
      step(() => transformCorners(s, cs, { pivot: [u0, v0], scale: [k, k], move: [-u0, -v0] }));
    },
    /** The selection's texel density against a `w` x `h` picture (pixels a metre). */
    density: (w, h) => texelDensity(s, selectedFaces(), w, h),
    /** Set each selected island's texel density. */
    setDensity(target, w, h) { const isl = islandsOf(s, selectedFaces()); step(() => setTexelDensity(s, isl, target, w, h)); },

    canUndo: () => undo.length > 0,
    canRedo: () => redo.length > 0,
    undo() { const b = undo.pop(); if (!b) return false; redo.push(snapshot()); restore(b); return true; },
    redo() { const b = redo.pop(); if (!b) return false; undo.push(snapshot()); restore(b); return true; },
    /** Whether anything was changed since it opened. */
    changed: () => undo.length > 0,
    /** The part's mesh made again from the UVs as they stand. */
    result: () => meshFromSession(s),
    /** Every shown face's three UV points, for the panel to draw. */
    faceUvs(f) { return [uv(f * 3), uv(f * 3 + 1), uv(f * 3 + 2)]; },
    /** Whether a face's side is a seam (the panel draws it red). */
    isSeam(f, i) { return s.seams.has(edgeKey(s.weld[s.tris[f * 3 + i]], s.weld[s.tris[f * 3 + (i + 1) % 3]])); },
  };
  return api;
}
