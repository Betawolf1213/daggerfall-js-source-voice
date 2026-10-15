// @ts-check
// ═══════════════════════════════════════════════════════════════════
// POI-5 (2026-10-14) - THE UV EDITOR'S GEOMETRY: A MESH AS ITS FACES' CORNERS, ITS SEAMS AND ITS ISLANDS.
//
// Mac: "the ability to import models, texture, UV map"; asked what "UV map" covers: "Full UV editor" - select vertices,
// edges, faces and islands; move, rotate, scale; seams; unwrap; pack (bible/06-Systems/POI-Editor-Arc.md POI-5).
// Pure - no DOM, no GL - so the editor's UV panel (ui/poiUvPanel.js) and the tests read a mesh the same way:
//
//   - THE SESSION (`uvSessionOf`): a POI mesh (poi/poiMesh.js) as its triangles, each CORNER with a UV of its own, and
//     its vertices WELDED by position (a model's vertices are split wherever its UVs or normals part; the weld is the
//     surface's own topology under them). An edge is a pair of welded vertices; it is a SEAM where the faces on its two
//     sides do not agree on its UVs - the model's own seams found, never invented - and the builder may mark or clear
//     one. An ISLAND is the faces reached from a face across edges that are not seams.
//   - THE UVS IN glTF's ORDER: u right, v DOWN from the picture's top, as the mesh keeps them (the game turns them at the
//     draw - poi/poiRuntime.js), so the editor lays them over the picture as the picture is seen.
//   - THE TOOLS: a selection's corners moved, turned and sized about a point (`transformCorners`), flipped; a projection
//     onto the faces chosen - planar along an axis, box (each face by its own dominant axis), cylindrical, spherical - in
//     metres (a unit of UV a metre: texel density means something from the first press); an UNWRAP by least-squares
//     conformal maps (Levy et al. 2002, `unwrapLscm` - the faces' angles kept as nearly as the plane allows, two
//     vertices pinned far apart, the system solved DIRECTLY - poi/sparseCholesky.js, a Cholesky factor in a nested
//     dissection's order - and by preconditioned conjugate gradients only where that fails); the islands PACKED into
//     the unit square (`packIslands` - each turned to its smallest bounding box, shelved tallest first, the whole
//     scaled to fit with a margin); the TEXEL DENSITY read and set (`texelDensity`, `setTexelDensity` - picture pixels a metre).
//   - BACK TO A MESH (`meshFromSession`): a vertex for each distinct (vertex, UV) a corner holds - split exactly where the
//     UVs now part, shared everywhere else - in the submeshes' own order, so the part's materials still match.
//
// Not a DFU member. Ledger A (POI).
// ═══════════════════════════════════════════════════════════════════

import { orderByDissection, cholesky, solveCholesky, upperCsc } from './sparseCholesky.js';

const EPS_UV = 1e-6;

/** A welded edge's key, the smaller vertex first. */
export const edgeKey = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`);

/**
 * A mesh as the UV editor holds it. The corners' UVs are the mesh's own, per corner; the seams the edges whose two faces
 * disagree on its UVs (or hold different submeshes).
 * @param {{ positions: Float32Array, normals: Float32Array, uvs: Float32Array, indices: Uint16Array | Uint32Array, submeshes: { start: number, count: number }[] }} mesh
 * @param {{ weldEps?: number }} [opts]
 */
export function uvSessionOf(mesh, { weldEps = 1e-5 } = {}) {
  const V = mesh.positions.length / 3;
  const T = mesh.indices.length / 3;
  const tris = new Uint32Array(mesh.indices.length);
  const triSub = new Uint16Array(T);
  let t = 0;
  mesh.submeshes.forEach((sm, si) => {
    for (let k = sm.start; k < sm.start + sm.count; k += 3) {
      tris[t * 3] = mesh.indices[k]; tris[t * 3 + 1] = mesh.indices[k + 1]; tris[t * 3 + 2] = mesh.indices[k + 2];
      triSub[t] = si; t++;
    }
  });
  const cornerUv = new Float64Array(T * 6);
  for (let c = 0; c < T * 3; c++) { const v = tris[c]; cornerUv[c * 2] = mesh.uvs[v * 2]; cornerUv[c * 2 + 1] = mesh.uvs[v * 2 + 1]; }
  // the weld: vertices standing at one point are one vertex of the surface
  const weld = new Int32Array(V);
  const at = new Map();
  const q = 1 / weldEps;
  let welded = 0;
  for (let v = 0; v < V; v++) {
    const k = `${Math.round(mesh.positions[v * 3] * q)},${Math.round(mesh.positions[v * 3 + 1] * q)},${Math.round(mesh.positions[v * 3 + 2] * q)}`;
    let id = at.get(k);
    if (id === undefined) { id = welded++; at.set(k, id); }
    weld[v] = id;
  }
  const s = { positions: mesh.positions, normals: mesh.normals, tris, triSub, cornerUv, weld, welded, faces: T, submeshes: mesh.submeshes.length, seams: new Set(), edgeFaces: new Map() };
  // every welded edge and the faces on it (a face's edge i runs corner i to corner i+1)
  for (let f = 0; f < T; f++) {
    for (let i = 0; i < 3; i++) {
      const a = weld[tris[f * 3 + i]], b = weld[tris[f * 3 + (i + 1) % 3]];
      if (a === b) continue;
      const k = edgeKey(a, b);
      if (!s.edgeFaces.has(k)) s.edgeFaces.set(k, []);
      s.edgeFaces.get(k).push(f);
    }
  }
  // the model's own seams: an edge whose faces disagree on its ends' UVs, or hold different materials
  for (const [k, fs] of s.edgeFaces) {
    if (fs.length < 2) continue;
    const [a, b] = k.split('_').map(Number);
    for (let i = 1; i < fs.length; i++) {
      if (triSub[fs[0]] !== triSub[fs[i]] || !sameUvAt(s, fs[0], fs[i], a) || !sameUvAt(s, fs[0], fs[i], b)) { s.seams.add(k); break; }
    }
  }
  return s;
}

/** The corner of face `f` at welded vertex `w` (-1 if none). */
export function cornerAt(s, f, w) {
  for (let i = 0; i < 3; i++) if (s.weld[s.tris[f * 3 + i]] === w) return f * 3 + i;
  return -1;
}
function sameUvAt(s, f, g, w) {
  const a = cornerAt(s, f, w), b = cornerAt(s, g, w);
  return a >= 0 && b >= 0 && Math.abs(s.cornerUv[a * 2] - s.cornerUv[b * 2]) < EPS_UV && Math.abs(s.cornerUv[a * 2 + 1] - s.cornerUv[b * 2 + 1]) < EPS_UV;
}

/** Mark an edge a seam, or clear it. */
export function setSeam(s, a, b, on) {
  const k = edgeKey(a, b);
  if (!s.edgeFaces.has(k)) return false;
  if (on) s.seams.add(k); else s.seams.delete(k);
  return true;
}

/** The islands: the faces reached from a face across edges that are not seams (and within `within`, when given) -
 *  each a sorted array of face indices, in the order their first face stands. */
export function islandsOf(s, within = null) {
  const inSet = within ? new Set(within) : null;
  const parent = new Int32Array(s.faces).map((_, i) => i);
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  for (const [k, fs] of s.edgeFaces) {
    if (s.seams.has(k)) continue;
    for (let i = 1; i < fs.length; i++) {
      if (inSet && (!inSet.has(fs[0]) || !inSet.has(fs[i]))) continue;
      const ra = find(fs[0]), rb = find(fs[i]);
      if (ra !== rb) parent[rb] = ra;
    }
  }
  const groups = new Map();
  for (let f = 0; f < s.faces; f++) {
    if (inSet && !inSet.has(f)) continue;
    const r = find(f);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(f);
  }
  return [...groups.values()];
}

/** The corners of a set of faces. */
export const cornersOf = (faces) => faces.flatMap((f) => [f * 3, f * 3 + 1, f * 3 + 2]);

/** Every corner sharing a UV vertex with corner `c`: the same welded vertex, in the same island, at the same UV. */
export function uvVertexCorners(s, c, island = null) {
  const w = s.weld[s.tris[c]];
  const faces = island ?? islandsOf(s).find((g) => g.includes(Math.floor(c / 3)));
  const out = [];
  for (const f of faces) {
    const k = cornerAt(s, f, w);
    if (k >= 0 && Math.abs(s.cornerUv[k * 2] - s.cornerUv[c * 2]) < EPS_UV && Math.abs(s.cornerUv[k * 2 + 1] - s.cornerUv[c * 2 + 1]) < EPS_UV) out.push(k);
  }
  return out;
}

/** The centre of a set of corners' UVs (the mean of the distinct UV points). */
export function uvCentre(s, corners) {
  if (!corners.length) return [0, 0];
  let u = 0, v = 0;
  for (const c of corners) { u += s.cornerUv[c * 2]; v += s.cornerUv[c * 2 + 1]; }
  return [u / corners.length, v / corners.length];
}
/** The bounds of a set of corners' UVs: [u0, v0, u1, v1]. */
export function uvBounds(s, corners) {
  let u0 = Infinity, v0 = Infinity, u1 = -Infinity, v1 = -Infinity;
  for (const c of corners) {
    const u = s.cornerUv[c * 2], v = s.cornerUv[c * 2 + 1];
    if (u < u0) u0 = u; if (u > u1) u1 = u; if (v < v0) v0 = v; if (v > v1) v1 = v;
  }
  return [u0, v0, u1, v1];
}

/**
 * Move, turn and size a set of corners' UVs about a pivot: `move` [du, dv], `turn` degrees (counter-clockwise as the
 * picture is seen - v down, so a positive turn takes +u toward -v), `scale` [su, sv]. Each corner once.
 */
export function transformCorners(s, corners, { move = [0, 0], turn = 0, scale = [1, 1], pivot = null } = {}) {
  const p = pivot ?? uvCentre(s, corners);
  const a = (turn * Math.PI) / 180, cs = Math.cos(a), sn = Math.sin(a);
  for (const c of new Set(corners)) {
    let u = (s.cornerUv[c * 2] - p[0]) * scale[0], v = (s.cornerUv[c * 2 + 1] - p[1]) * scale[1];
    const ru = u * cs + v * sn, rv = -u * sn + v * cs;
    s.cornerUv[c * 2] = p[0] + ru + move[0];
    s.cornerUv[c * 2 + 1] = p[1] + rv + move[1];
  }
}

// ── PROJECTIONS ────────────────────────────────────────────────────
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
const norm3 = (a) => { const l = len3(a); return l > 0 ? [a[0] / l, a[1] / l, a[2] / l] : [0, 0, 0]; };
const posOf = (s, v) => [s.positions[v * 3], s.positions[v * 3 + 1], s.positions[v * 3 + 2]];
const faceNormal = (s, f) => { const a = posOf(s, s.tris[f * 3]), b = posOf(s, s.tris[f * 3 + 1]), c = posOf(s, s.tris[f * 3 + 2]); return cross3(sub3(b, a), sub3(c, a)); };

/** The picture's u and v on the plane square to `n`, as the plane is seen from its front (the eye looking along -n):
 *  u to the eye's right, v down. In the game's frame (Unity's, left-handed) the right of an eye looking along f is
 *  up x f - player/motor.js's (cos yaw, 0, -sin yaw) - so u = n x up and v = n x u. */
export function pictureAxes(n) {
  const up = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [0, 0, 1];
  const u = norm3(cross3(n, up));
  const v = norm3(cross3(n, u));
  return [u, v];
}
/** A face's UV triangle's signed area (u right, v down: positive as the picture is read). */
const uvSigned = (s, f) => {
  const a = f * 6, U = s.cornerUv;
  return (U[a + 2] - U[a]) * (U[a + 5] - U[a + 1]) - (U[a + 3] - U[a + 1]) * (U[a + 4] - U[a]);
};
/** The same face's signed area as its planar projection along its own normal lays it - the face seen from its front. */
function frontSigned(s, f) {
  const n = norm3(faceNormal(s, f));
  const [ua, va] = pictureAxes(n);
  const P = [0, 1, 2].map((k) => { const p = posOf(s, s.tris[f * 3 + k]); return [dot3(p, ua), dot3(p, va)]; });
  return (P[1][0] - P[0][0]) * (P[2][1] - P[0][1]) - (P[1][1] - P[0][1]) * (P[2][0] - P[0][0]);
}
/** A mapping keeps the picture unmirrored: where most of the faces' area reads mirrored against each face seen from its
 *  own front, u is turned over for them all (the curved projections' rule - their sense round the axis is the axis's). */
function keepHandedness(s, faces) {
  let agree = 0;
  for (const f of faces) agree += Math.sign(uvSigned(s, f)) * Math.abs(frontSigned(s, f)) * Math.sign(frontSigned(s, f));
  if (agree < 0) for (const c of cornersOf(faces)) s.cornerUv[c * 2] = -s.cornerUv[c * 2];
}

/** Planar projection along `normal` (a unit vector in the mesh's frame): a metre a unit of UV. */
export function projectPlanar(s, faces, normal) {
  const [ua, va] = pictureAxes(norm3(normal));
  for (const c of cornersOf(faces)) { const p = posOf(s, s.tris[c]); s.cornerUv[c * 2] = dot3(p, ua); s.cornerUv[c * 2 + 1] = dot3(p, va); }
}
/** Box projection: each face planar along the axis its normal is nearest. */
export function projectBox(s, faces) {
  for (const f of faces) {
    const n = faceNormal(s, f), ax = [Math.abs(n[0]), Math.abs(n[1]), Math.abs(n[2])];
    const i = ax[0] >= ax[1] && ax[0] >= ax[2] ? 0 : ax[1] >= ax[2] ? 1 : 2;
    const dir = [0, 0, 0]; dir[i] = Math.sign(n[i]) || 1;
    const [ua, va] = pictureAxes(dir);
    for (let k = 0; k < 3; k++) { const c = f * 3 + k, p = posOf(s, s.tris[c]); s.cornerUv[c * 2] = dot3(p, ua); s.cornerUv[c * 2 + 1] = dot3(p, va); }
  }
}
/** Cylindrical projection about an axis through `centre`: u round it (a metre of arc at the faces' mean radius), v along
 *  it downward. A face across the wrap is kept whole (its corners brought within half a turn of each other). */
export function projectCylinder(s, faces, axis = [0, 1, 0], centre = [0, 0, 0]) {
  const a = norm3(axis), [x, z] = pictureAxes(a);
  let rSum = 0, n = 0;
  for (const c of cornersOf(faces)) { const d = sub3(posOf(s, s.tris[c]), centre); rSum += Math.hypot(dot3(d, x), dot3(d, z)); n++; }
  const r = n ? rSum / n : 1;
  for (const f of faces) {
    const ang = [0, 1, 2].map((k) => { const d = sub3(posOf(s, s.tris[f * 3 + k]), centre); return Math.atan2(dot3(d, z), dot3(d, x)); });
    for (let k = 1; k < 3; k++) { while (ang[k] - ang[0] > Math.PI) ang[k] -= 2 * Math.PI; while (ang[k] - ang[0] < -Math.PI) ang[k] += 2 * Math.PI; }
    for (let k = 0; k < 3; k++) { const c = f * 3 + k, d = sub3(posOf(s, s.tris[c]), centre); s.cornerUv[c * 2] = ang[k] * r; s.cornerUv[c * 2 + 1] = -dot3(d, a); }
  }
  keepHandedness(s, faces);
}
/** Spherical projection about `centre`: longitude and latitude, a metre of arc at the faces' mean radius. */
export function projectSphere(s, faces, centre = [0, 0, 0]) {
  let rSum = 0, n = 0;
  for (const c of cornersOf(faces)) { rSum += len3(sub3(posOf(s, s.tris[c]), centre)); n++; }
  const r = n ? rSum / n : 1;
  for (const f of faces) {
    const lon = [0, 1, 2].map((k) => { const d = sub3(posOf(s, s.tris[f * 3 + k]), centre); return Math.atan2(d[2], d[0]); });
    for (let k = 1; k < 3; k++) { while (lon[k] - lon[0] > Math.PI) lon[k] -= 2 * Math.PI; while (lon[k] - lon[0] < -Math.PI) lon[k] += 2 * Math.PI; }
    for (let k = 0; k < 3; k++) {
      const c = f * 3 + k, d = norm3(sub3(posOf(s, s.tris[c]), centre));
      s.cornerUv[c * 2] = lon[k] * r; s.cornerUv[c * 2 + 1] = -Math.asin(Math.max(-1, Math.min(1, d[1]))) * r;
    }
  }
  keepHandedness(s, faces);
}

// ── THE UNWRAP: LEAST-SQUARES CONFORMAL MAPS ───────────────────────
/**
 * Unwrap the islands of `faces` (seams cut them) by LSCM: per island, the welded vertices' UVs that keep every triangle's
 * angles as nearly as the plane allows, two vertices pinned - the pair farthest apart, at their own distance (a metre a
 * unit) - the normal equations of the least-squares system factored directly (poi/sparseCholesky.js, the island's
 * nested-dissection order) and solved; where the factor is refused (a degenerate island), by conjugate gradients
 * preconditioned by their diagonal, to a relative residual of `tolerance` in at most `iterations`. Answers the
 * islands it laid.
 */
export function unwrapLscm(s, faces, { iterations = 6000, tolerance = 1e-7 } = {}) {
  const islands = islandsOf(s, faces);
  for (const isl of islands) unwrapIsland(s, isl, iterations, tolerance);
  return islands;
}
function unwrapIsland(s, faces, iterations, tolerance) {
  // THE UNKNOWNS ARE UV VERTICES, NOT WELDED ONES: the corners at a welded vertex joined across edges that are not seams.
  // An island that borders itself along a seam (a cylinder cut once) has two sides at that seam's vertices - one UV each
  const inIsland = new Set(faces);
  const parent = new Map();
  const find = (c) => { let r = c; while (parent.get(r) !== r) r = parent.get(r); let x = c; while (parent.get(x) !== r) { const n = parent.get(x); parent.set(x, r); x = n; } return r; };
  for (const f of faces) for (let k = 0; k < 3; k++) parent.set(f * 3 + k, f * 3 + k);
  for (const [key, fs] of s.edgeFaces) {
    if (s.seams.has(key)) continue;
    const [a, b] = key.split('_').map(Number);
    const here = fs.filter((f) => inIsland.has(f));
    for (let i = 1; i < here.length; i++) {
      for (const w of [a, b]) {
        const ca = find(cornerAt(s, here[0], w)), cb = find(cornerAt(s, here[i], w));
        if (ca !== cb) parent.set(cb, ca);
      }
    }
  }
  const local = new Map();   // corner -> its UV vertex's number
  const roots = new Map();
  for (const f of faces) for (let k = 0; k < 3; k++) {
    const c = f * 3 + k, r = find(c);
    if (!roots.has(r)) roots.set(r, roots.size);
    local.set(c, roots.get(r));
  }
  const N = roots.size;
  const posW = new Array(N);
  for (const f of faces) for (let k = 0; k < 3; k++) { const c = f * 3 + k; posW[local.get(c)] = posOf(s, s.tris[c]); }
  if (N < 3) return;
  // the pins: the two vertices farthest apart (two sweeps: the farthest from any, then the farthest from that)
  const far = (from) => { let best = 0, bd = -1; for (let i = 0; i < N; i++) { const d = len3(sub3(posW[i], posW[from])); if (d > bd) { bd = d; best = i; } } return [best, bd]; };
  const [p0] = far(0), [p1, dist] = far(p0);
  const pinned = new Map([[p0, [0, 0]], [p1, [dist || 1, 0]]]);
  // the free unknowns: (u, v) of every unpinned vertex
  const freeIdx = new Int32Array(N).fill(-1);
  let F = 0;
  for (let i = 0; i < N; i++) if (!pinned.has(i)) freeIdx[i] = F++;
  // A's rows, two a triangle, as typed sparse rows (CSR, at most six entries a row) over 2F unknowns; the pinned
  // vertices' part goes to the right-hand side
  const T = faces.length;
  const rowStart = new Int32Array(T * 2 + 1), cols = new Int32Array(T * 12), vals = new Float64Array(T * 12), rhs = new Float64Array(T * 2);
  let nnz = 0, R = 0;
  for (const f of faces) {
    const ids = [0, 1, 2].map((k) => local.get(f * 3 + k));
    const P = ids.map((i) => posW[i]);
    const e1 = sub3(P[1], P[0]), e2 = sub3(P[2], P[0]);
    const n = cross3(e1, e2), area2 = len3(n);
    if (!(area2 > 1e-14)) continue;
    // the triangle in its own plane: P0 at the origin, P1 along x
    const x1 = len3(e1), xa = norm3(e1), ya = norm3(cross3(norm3(n), xa));
    const q = [[0, 0], [x1, 0], [dot3(e2, xa), dot3(e2, ya)]];
    const d = Math.sqrt(area2);
    // W_j = (x_{j+2} - x_{j+1}) + i (y_{j+2} - y_{j+1}); Re: wr u - wi v = 0, Im: wi u + wr v = 0
    let bRe = 0, bIm = 0;
    rowStart[R] = nnz;
    const imAt = [];
    for (let j = 0; j < 3; j++) {
      const i = ids[j], wr = (q[(j + 2) % 3][0] - q[(j + 1) % 3][0]) / d, wi = (q[(j + 2) % 3][1] - q[(j + 1) % 3][1]) / d;
      if (pinned.has(i)) { const [u, v] = pinned.get(i); bRe -= wr * u - wi * v; bIm -= wi * u + wr * v; }
      else { const c = freeIdx[i] * 2; cols[nnz] = c; vals[nnz++] = wr; cols[nnz] = c + 1; vals[nnz++] = -wi; imAt.push([c, wi], [c + 1, wr]); }
    }
    rhs[R++] = bRe;
    rowStart[R] = nnz;
    for (const [c, v] of imAt) { cols[nnz] = c; vals[nnz++] = v; }
    rhs[R++] = bIm;
  }
  rowStart[R] = nnz;
  const n2 = F * 2;
  const Atb = new Float64Array(n2);
  for (let r = 0; r < R; r++) for (let k = rowStart[r]; k < rowStart[r + 1]; k++) Atb[cols[k]] += vals[k] * rhs[r];
  // a start from a planar projection along the island's mean normal (the iterative fallback's first guess)
  let mn = [0, 0, 0];
  for (const f of faces) { const fn = faceNormal(s, f); mn = [mn[0] + fn[0], mn[1] + fn[1], mn[2] + fn[2]]; }
  const [ua, va] = pictureAxes(norm3(len3(mn) > 0 ? mn : [0, 1, 0]));
  // THE DIRECT SOLVE: the normal matrix A^T A factored in a nested dissection of the island's free vertices (their u
  // and v side by side), its fill near-linear on a surface; the iterative one only if the factor fails
  let x = direct(N, F, freeIdx, posW, faces, local, R, rowStart, cols, vals, Atb);
  if (!x) {
    x = new Float64Array(n2);
    for (let i = 0; i < N; i++) if (freeIdx[i] >= 0) { x[freeIdx[i] * 2] = dot3(sub3(posW[i], posW[p0]), ua); x[freeIdx[i] * 2 + 1] = dot3(sub3(posW[i], posW[p0]), va); }
    pcg(n2, R, rowStart, cols, vals, Atb, x, iterations, tolerance);
  }
  // laid: every corner of the island takes its UV vertex's UV. Never mirrored, and no flip needed: the conformal map keeps
  // each triangle's own orientation, and its plane's frame (x along an edge, y = n x x) turns the same way as the
  // picture's front frame (pictureAxes: u x v = n as well)
  for (const f of faces) for (let k = 0; k < 3; k++) {
    const c = f * 3 + k, i = local.get(c);
    const uv = pinned.get(i) ?? [x[freeIdx[i] * 2], x[freeIdx[i] * 2 + 1]];
    s.cornerUv[c * 2] = uv[0]; s.cornerUv[c * 2 + 1] = uv[1];
  }
}

/** A^T A x = A^T b factored directly: the unknowns renumbered in a nested dissection of the free vertices (a vertex's
 *  u and v adjacent), the upper triangle gathered, factored, solved, numbered back. Null where the factor fails. */
function direct(N, F, freeIdx, posW, faces, local, R, rowStart, cols, vals, Atb) {
  if (F === 0) return new Float64Array(0);
  const freeVerts = [], pts = [];
  for (let i = 0; i < N; i++) if (freeIdx[i] >= 0) { freeVerts[freeIdx[i]] = i; }
  for (let f = 0; f < F; f++) pts.push(posW[freeVerts[f]]);
  const nb = Array.from({ length: F }, () => []);
  for (const fc of faces) {
    const ids = [0, 1, 2].map((k) => freeIdx[local.get(fc * 3 + k)]);
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (a !== b && ids[a] >= 0 && ids[b] >= 0) nb[ids[a]].push(ids[b]);
  }
  const order = orderByDissection(pts, nb);
  const rank = new Int32Array(F);
  order.forEach((v, r) => { rank[v] = r; });
  const perm = (c) => rank[c >> 1] * 2 + (c & 1);
  // A^T A's upper triangle as triples: a row's every unordered pair of entries once (its columns are distinct), which is
  // M(a, b) = sum of A(r, a) A(r, b) - the (b, a) twin below the diagonal is the same number and is not stored
  let count = 0;
  for (let r = 0; r < R; r++) { const m = rowStart[r + 1] - rowStart[r]; count += (m * (m + 1)) / 2; }
  const I = new Int32Array(count), J = new Int32Array(count), V = new Float64Array(count);
  let t = 0;
  for (let r = 0; r < R; r++) {
    const k0 = rowStart[r], k1 = rowStart[r + 1];
    for (let a = k0; a < k1; a++) for (let b = a; b < k1; b++) { I[t] = perm(cols[a]); J[t] = perm(cols[b]); V[t] = vals[a] * vals[b]; t++; }
  }
  const n2 = F * 2;
  const { Ap, Ai, Ax } = upperCsc(n2, I, J, V, t);
  const L = cholesky(n2, Ap, Ai, Ax);
  if (!L) return null;
  const b = new Float64Array(n2);
  for (let c = 0; c < n2; c++) b[perm(c)] = Atb[c];
  const y = solveCholesky(L, b);
  const x = new Float64Array(n2);
  for (let c = 0; c < n2; c++) x[c] = y[perm(c)];
  return x;
}
/** A^T A x = A^T b by conjugate gradients from `x`, preconditioned by A^T A's diagonal - the fallback. */
function pcg(n2, R, rowStart, cols, vals, Atb, x, iterations, tolerance) {
  const diag = new Float64Array(n2);
  for (let r = 0; r < R; r++) for (let k = rowStart[r]; k < rowStart[r + 1]; k++) diag[cols[k]] += vals[k] * vals[k];
  for (let i = 0; i < n2; i++) diag[i] = diag[i] > 0 ? 1 / diag[i] : 1;
  const mulAtA = (v, out) => {
    out.fill(0);
    for (let r = 0; r < R; r++) {
      let ax = 0;
      const k0 = rowStart[r], k1 = rowStart[r + 1];
      for (let k = k0; k < k1; k++) ax += vals[k] * v[cols[k]];
      for (let k = k0; k < k1; k++) out[cols[k]] += vals[k] * ax;
    }
  };
  const r = new Float64Array(n2), z = new Float64Array(n2), p = new Float64Array(n2), Ap = new Float64Array(n2);
  mulAtA(x, Ap);
  let bb = 0, rz = 0;
  for (let i = 0; i < n2; i++) { r[i] = Atb[i] - Ap[i]; z[i] = r[i] * diag[i]; p[i] = z[i]; bb += Atb[i] * Atb[i]; rz += r[i] * z[i]; }
  const stop = tolerance * tolerance * Math.max(bb, 1e-30);
  for (let it = 0; it < iterations; it++) {
    let rr = 0;
    for (let i = 0; i < n2; i++) rr += r[i] * r[i];
    if (rr <= stop) break;
    mulAtA(p, Ap);
    let pAp = 0;
    for (let i = 0; i < n2; i++) pAp += p[i] * Ap[i];
    if (!(pAp > 0)) break;
    const alpha = rz / pAp;
    let rz2 = 0;
    for (let i = 0; i < n2; i++) { x[i] += alpha * p[i]; r[i] -= alpha * Ap[i]; z[i] = r[i] * diag[i]; rz2 += r[i] * z[i]; }
    const beta = rz2 / rz;
    rz = rz2;
    for (let i = 0; i < n2; i++) p[i] = z[i] + beta * p[i];
  }
}

// ── PACKING AND DENSITY ────────────────────────────────────────────
/** The convex hull of 2D points (Andrew's monotone chain), counter-clockwise. */
export function hull2(pts) {
  const P = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (P.length < 3) return P;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (const p of P.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
/** The turn (degrees, transformCorners' sense) that lays a point set in its smallest axis-aligned box - the hull's
 *  edges tried (rotating calipers' candidates), the box lying down (wider than tall) preferred on a tie. */
export function minAreaTurn(pts) {
  const h = hull2(pts);
  let best = 0, bestArea = Infinity;
  const tryAngle = (a) => {
    const cs = Math.cos(a), sn = Math.sin(a);
    let u0 = Infinity, v0 = Infinity, u1 = -Infinity, v1 = -Infinity;
    for (const [u, v] of h) { const ru = u * cs + v * sn, rv = -u * sn + v * cs; u0 = Math.min(u0, ru); u1 = Math.max(u1, ru); v0 = Math.min(v0, rv); v1 = Math.max(v1, rv); }
    let area = (u1 - u0) * (v1 - v0);
    if (v1 - v0 > u1 - u0) area *= 1 + 1e-9;   // the same box lying down beats it standing (shelves are rows)
    if (area < bestArea - 1e-12) { bestArea = area; best = a; }
  };
  tryAngle(0);
  for (let i = 0; i < h.length; i++) { const a = h[i], b = h[(i + 1) % h.length]; tryAngle(Math.atan2(b[1] - a[1], b[0] - a[0])); }
  return (best * 180) / Math.PI;
}

/**
 * Pack islands into the unit square: each turned to its smallest box (when `rotate`), all scaled alike, shelved tallest
 * first left to right, row on row, with `margin` (a share of the square) round each - the largest scale that fits, found
 * by halving. Answers the scale used.
 * @param {any} s @param {number[][]} islands face lists @param {{ margin?: number, rotate?: boolean }} [opts]
 */
export function packIslands(s, islands, { margin = 0.01, rotate = true } = {}) {
  const items = islands.map((faces) => {
    const corners = cornersOf(faces);
    if (rotate) {
      const pts = corners.map((c) => [s.cornerUv[c * 2], s.cornerUv[c * 2 + 1]]);
      const turn = minAreaTurn(pts);
      if (Math.abs(turn) > 1e-9) transformCorners(s, corners, { turn, pivot: [0, 0] });
    }
    const b = uvBounds(s, corners);
    return { corners, b, w: b[2] - b[0], h: b[3] - b[1] };
  });
  const fits = (k) => {
    const order = [...items.keys()].sort((a, b) => items[b].h - items[a].h);
    let x = margin, y = margin, rowH = 0;
    const at = new Map();
    for (const i of order) {
      const w = items[i].w * k + margin, h = items[i].h * k + margin;
      if (x + w > 1 + 1e-12) { x = margin; y += rowH; rowH = 0; }
      if (x + w > 1 + 1e-12 || y + h > 1 + 1e-12) return null;
      at.set(i, [x, y]);
      x += w; rowH = Math.max(rowH, h);
    }
    return at;
  };
  // the largest scale that fits: no packing holds more area than the square, so 1 / sqrt(area) is the ceiling; between
  // a scale that fits and one that does not, halved forty times
  const total = items.reduce((a, it) => a + Math.max(it.w * it.h, 1e-12), 0);
  let hi = 1 / Math.sqrt(total), lo = 0, place = fits(hi);
  if (place) lo = hi;
  else {
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2, at = fits(mid);
      if (at) { lo = mid; place = at; } else hi = mid;
    }
  }
  if (!place) return 0;
  items.forEach((it, i) => {
    const [x, y] = place.get(i);
    for (const c of new Set(it.corners)) {
      s.cornerUv[c * 2] = x + (s.cornerUv[c * 2] - it.b[0]) * lo;
      s.cornerUv[c * 2 + 1] = y + (s.cornerUv[c * 2 + 1] - it.b[1]) * lo;
    }
  });
  return lo;
}

/** A set of faces' texel density: the picture's pixels a metre over them (`w` x `h` the picture), area-weighted. */
export function texelDensity(s, faces, w, h) {
  let uvA = 0, area = 0;
  for (const f of faces) {
    const n = faceNormal(s, f);
    area += len3(n) / 2;
    const [a, b, c] = [f * 3, f * 3 + 1, f * 3 + 2].map((k) => [s.cornerUv[k * 2] * w, s.cornerUv[k * 2 + 1] * h]);
    uvA += Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;
  }
  return area > 0 ? Math.sqrt(uvA / area) : 0;
}
/** Size each island about its own centre so its texel density is `target`. */
export function setTexelDensity(s, islands, target, w, h) {
  for (const faces of islands) {
    const d = texelDensity(s, faces, w, h);
    if (!(d > 0)) continue;
    const k = target / d;
    transformCorners(s, cornersOf(faces), { scale: [k, k] });
  }
}

/** The session as a POI mesh again: a vertex for each distinct (vertex, UV) a corner holds, the faces in their
 *  submeshes' order. */
export function meshFromSession(s) {
  const keyOf = new Map();
  const pos = [], nor = [], uv = [];
  const bySub = Array.from({ length: s.submeshes }, () => []);
  for (let f = 0; f < s.faces; f++) bySub[s.triSub[f]].push(f);
  const indices = [], submeshes = [];
  for (const faces of bySub) {
    const start = indices.length;
    for (const f of faces) for (let k = 0; k < 3; k++) {
      const c = f * 3 + k, v = s.tris[c];
      const u = s.cornerUv[c * 2], w = s.cornerUv[c * 2 + 1];
      const key = `${v}|${Math.round(u * 1e6)}|${Math.round(w * 1e6)}`;
      let id = keyOf.get(key);
      if (id === undefined) {
        id = pos.length / 3; keyOf.set(key, id);
        pos.push(s.positions[v * 3], s.positions[v * 3 + 1], s.positions[v * 3 + 2]);
        nor.push(s.normals[v * 3], s.normals[v * 3 + 1], s.normals[v * 3 + 2]);
        uv.push(u, w);
      }
      indices.push(id);
    }
    submeshes.push({ start, count: indices.length - start });
  }
  const V = pos.length / 3;
  return {
    positions: Float32Array.from(pos), normals: Float32Array.from(nor), uvs: Float32Array.from(uv),
    indices: V > 65535 ? Uint32Array.from(indices) : Uint16Array.from(indices), submeshes,
  };
}
