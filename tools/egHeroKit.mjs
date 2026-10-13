// THE HERO FRAGMENTS' AUTHORING KIT - the shapes the port's own hero scenes are written with (tools/egHero*Scene.mjs), on
// the reference's mesh and writer (tools/egRefFragScene.mjs refFragMesh, writeRefFragFbx).
//
// EG-HERO (2026-10-13, bible/11-Multiplayer/Elite-Gates.md section 11.6, "Authored hero fragments"). A scene is written from
// numbers alone and its .fbx is held to its bytes by a test that writes it again, so every number here is a function of
// IEEE arithmetic alone: + - * / and Math.sqrt (exactly rounded), Math.floor, Math.round, Math.imul - never Math.sin, cos,
// pow, exp, hypot or random, whose last bit an engine may change. A circle is a fixed table (RINGS, its corners written to
// 1e-9), noise an integer hash. Not a DFU member; tooling, never shipped.

/** Each ring's corners about (0, 0), radius 1, from +X counter-clockwise (seen from +Z): 8, 12, 16, 24 and 32 sides. */
export const RINGS = Object.freeze({
  8: Object.freeze([[1, 0], [0.707106781, 0.707106781], [0, 1], [-0.707106781, 0.707106781], [-1, 0], [-0.707106781, -0.707106781], [0, -1], [0.707106781, -0.707106781]]),
  12: Object.freeze([[1, 0], [0.866025404, 0.5], [0.5, 0.866025404], [0, 1], [-0.5, 0.866025404], [-0.866025404, 0.5], [-1, 0], [-0.866025404, -0.5], [-0.5, -0.866025404], [0, -1], [0.5, -0.866025404], [0.866025404, -0.5]]),
  16: Object.freeze([[1, 0], [0.923879533, 0.382683432], [0.707106781, 0.707106781], [0.382683432, 0.923879533], [0, 1], [-0.382683432, 0.923879533], [-0.707106781, 0.707106781], [-0.923879533, 0.382683432], [-1, 0], [-0.923879533, -0.382683432], [-0.707106781, -0.707106781], [-0.382683432, -0.923879533], [0, -1], [0.382683432, -0.923879533], [0.707106781, -0.707106781], [0.923879533, -0.382683432]]),
  24: Object.freeze([[1, 0], [0.965925826, 0.258819045], [0.866025404, 0.5], [0.707106781, 0.707106781], [0.5, 0.866025404], [0.258819045, 0.965925826], [0, 1], [-0.258819045, 0.965925826], [-0.5, 0.866025404], [-0.707106781, 0.707106781], [-0.866025404, 0.5], [-0.965925826, 0.258819045], [-1, 0], [-0.965925826, -0.258819045], [-0.866025404, -0.5], [-0.707106781, -0.707106781], [-0.5, -0.866025404], [-0.258819045, -0.965925826], [0, -1], [0.258819045, -0.965925826], [0.5, -0.866025404], [0.707106781, -0.707106781], [0.866025404, -0.5], [0.965925826, -0.258819045]]),
  32: Object.freeze([[1, 0], [0.98078528, 0.195090322], [0.923879533, 0.382683432], [0.831469612, 0.555570233], [0.707106781, 0.707106781], [0.555570233, 0.831469612], [0.382683432, 0.923879533], [0.195090322, 0.98078528], [0, 1], [-0.195090322, 0.98078528], [-0.382683432, 0.923879533], [-0.555570233, 0.831469612], [-0.707106781, 0.707106781], [-0.831469612, 0.555570233], [-0.923879533, 0.382683432], [-0.98078528, 0.195090322], [-1, 0], [-0.98078528, -0.195090322], [-0.923879533, -0.382683432], [-0.831469612, -0.555570233], [-0.707106781, -0.707106781], [-0.555570233, -0.831469612], [-0.382683432, -0.923879533], [-0.195090322, -0.98078528], [0, -1], [0.195090322, -0.98078528], [0.382683432, -0.923879533], [0.555570233, -0.831469612], [0.707106781, -0.707106781], [0.831469612, -0.555570233], [0.923879533, -0.382683432], [0.98078528, -0.195090322]]),
});

/** A number to 0.1 mm (the bake's own grain), never -0. */
export const r4 = (v) => Math.round(v * 1e4) / 1e4 + 0;

/** A unit vector (Math.sqrt alone); a zero vector stays zero. */
export function unit(v) {
  const l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  return l > 0 ? [v[0] / l + 0, v[1] / l + 0, v[2] / l + 0] : [0, 0, 0];
}
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** An integer hash of a seed and up to three integers, as a number in [0, 1). */
export function hash01(seed, a, b = 0, c = 0) {
  let h = Math.imul(seed | 0, 0x9e3779b1) ^ Math.imul(a | 0, 0x85ebca6b) ^ Math.imul(b | 0, 0xc2b2ae35) ^ Math.imul(c | 0, 0x27d4eb2f);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}
/** VALUE NOISE at (x, y), in [0, 1): the lattice's hashes, eased (3t^2 - 2t^3) between them. */
export function noise2(seed, x, y) {
  const x0 = Math.floor(x), y0 = Math.floor(y), tx = x - x0, ty = y - y0;
  const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
  const a = hash01(seed, x0, y0), b = hash01(seed, x0 + 1, y0), c = hash01(seed, x0, y0 + 1), d = hash01(seed, x0 + 1, y0 + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
/** Octaves of noise2, each twice the frequency and half the weight of the last, in [0, 1). */
export function fbm2(seed, x, y, octaves = 3) {
  let s = 0, w = 0.5, f = 1, total = 0;
  for (let o = 0; o < octaves; o++) { s += w * noise2(seed + o * 101, x * f, y * f); total += w; w /= 2; f *= 2; }
  return s / total;
}

/**
 * A SMOOTH GRID on mesh `m` (refFragMesh's): `at(i, j)` gives the point [x, y, z] (Blender's metres, Z up) of corner (i, j)
 * for i in 0..cols and j in 0..rows; each quad a face of material slot `mat`, counter-clockwise seen from the side the
 * grid's normals face (`flip` turns it). Each corner's normal is the grid's own (its neighbours' differences, crossed),
 * and its UV `uv(i, j, p)` ([u, v], a metre's tile by default - u along i, v along j). The art of a rock wall pushed out by
 * noise, a vault, a dome, a ribbon of a stair.
 */
export function grid(m, cols, rows, at, mat = 0, { flip = false, uv = null, uvScale = 0.5 } = {}) {
  const P = [];
  for (let j = 0; j <= rows; j++) { const row = []; for (let i = 0; i <= cols; i++) row.push(at(i, j).map(r4)); P.push(row); }
  const len = (a, b) => Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
  // the default UVs: distance walked along each line, so a stretched grid keeps its tile
  const U = P.map((row) => { let s = 0; return row.map((p, i) => (i ? (s += len(p, row[i - 1])) : 0)); });
  const V = P[0].map((_, i) => { let s = 0; return P.map((row, j) => (j ? (s += len(row[i], P[j - 1][i])) : 0)); });
  const N = P.map((row, j) => row.map((_, i) => {
    const du = sub(P[j][Math.min(cols, i + 1)], P[j][Math.max(0, i - 1)]), dv = sub(P[Math.min(rows, j + 1)][i], P[Math.max(0, j - 1)][i]);
    const n = unit(cross(du, dv));
    return flip ? n.map((c) => -c + 0) : n;
  }));
  const UVof = (i, j) => (uv ? uv(i, j, P[j][i]) : [U[j][i] * uvScale, V[i][j] * uvScale]).map(r4);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const q = flip ? [[i, j], [i, j + 1], [i + 1, j + 1], [i + 1, j]] : [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
      m.face(q.map(([a, b]) => P[b][a]), mat, q.map(([a, b]) => [N[b][a], UVof(a, b)]));
    }
  }
  return m;
}

/**
 * A LATHE on mesh `m`: profile `prof` ([[r, z], ...] from its foot up) turned about the upright through (x, y) on ring
 * `n` (RINGS' sides), its sides smooth (u round it - a seam where it closes; v up its profile), capped flat at the top if
 * the profile's last radius is not 0 (and at the foot with `foot`). A column drum, a skull pillar's shaft, a bell, a post.
 */
export function lathe(m, x, y, prof, n = 16, mat = 0, { foot = false, top = true } = {}) {
  const ring = RINGS[n];
  let s = 0;
  const vAt = prof.map((p, k) => (k ? (s += Math.sqrt((p[0] - prof[k - 1][0]) ** 2 + (p[1] - prof[k - 1][1]) ** 2)) : 0));
  const slope = prof.map((_, k) => { const a = prof[Math.max(0, k - 1)], b = prof[Math.min(prof.length - 1, k + 1)]; return unit([b[1] - a[1], 0, -(b[0] - a[0])]); });
  for (let k = 0; k + 1 < prof.length; k++) {
    for (let i = 0; i < n; i++) {
      const [c0, s0] = ring[i], [c1, s1] = ring[(i + 1) % n];
      const P = (c, sn, kk) => [x + prof[kk][0] * c, y + prof[kk][0] * sn, prof[kk][1]].map(r4);
      const Nn = (c, sn, kk) => unit([slope[kk][0] * c, slope[kk][0] * sn, slope[kk][2]]);
      const u0 = i / n, u1 = (i + 1) / n;
      m.face([P(c0, s0, k), P(c1, s1, k), P(c1, s1, k + 1), P(c0, s0, k + 1)], mat,
        [[Nn(c0, s0, k), [u0, r4(vAt[k] / 2)]], [Nn(c1, s1, k), [u1, r4(vAt[k] / 2)]], [Nn(c1, s1, k + 1), [u1, r4(vAt[k + 1] / 2)]], [Nn(c0, s0, k + 1), [u0, r4(vAt[k + 1] / 2)]]]);
    }
  }
  const last = prof[prof.length - 1], first = prof[0];
  if (top && last[0] > 0) m.face(ring.map(([c, sn]) => [x + last[0] * c, y + last[0] * sn, last[1]].map(r4)), mat);
  if (foot && first[0] > 0) m.face(ring.map(([c, sn]) => [x + first[0] * c, y + first[0] * sn, first[1]].map(r4)).reverse(), mat);
  return m;
}

/**
 * A SWEEP on mesh `m`: closed cross-section `sec` ([[a, b], ...], counter-clockwise, a across the path's right and b up)
 * carried along polyline `path` ([[x, y, z], ...]), its sides smooth along the path (u round the section, v along the
 * path), its ends capped. A chain's links, a ribcage's ribs, a conveyor's rail, a branch.
 */
export function sweep(m, path, sec, mat = 0, { caps = true } = {}) {
  const frames = path.map((p, k) => {
    const a = path[Math.max(0, k - 1)], b = path[Math.min(path.length - 1, k + 1)];
    const t = unit(sub(b, a)), up0 = Math.abs(t[2]) > 0.95 ? [1, 0, 0] : [0, 0, 1];
    const right = unit(cross(t, up0)), up = unit(cross(right, t));
    return { p, right, up };
  });
  let s = 0;
  const vAt = path.map((p, k) => (k ? (s += Math.sqrt((p[0] - path[k - 1][0]) ** 2 + (p[1] - path[k - 1][1]) ** 2 + (p[2] - path[k - 1][2]) ** 2)) : 0));
  const at = (k, q) => { const F = frames[k]; return [0, 1, 2].map((c) => F.p[c] + F.right[c] * q[0] + F.up[c] * q[1]).map(r4); };
  const nAt = (k, q) => { const F = frames[k]; return unit([0, 1, 2].map((c) => F.right[c] * q[0] + F.up[c] * q[1])); };
  const n = sec.length;
  for (let k = 0; k + 1 < path.length; k++) {
    for (let i = 0; i < n; i++) {
      const q0 = sec[i], q1 = sec[(i + 1) % n], u0 = i / n, u1 = (i + 1) / n;
      m.face([at(k, q1), at(k, q0), at(k + 1, q0), at(k + 1, q1)], mat,
        [[nAt(k, q1), [u1, r4(vAt[k] / 2)]], [nAt(k, q0), [u0, r4(vAt[k] / 2)]], [nAt(k + 1, q0), [u0, r4(vAt[k + 1] / 2)]], [nAt(k + 1, q1), [u1, r4(vAt[k + 1] / 2)]]]);
    }
  }
  if (caps) {
    m.face(sec.map((q) => at(0, q)), mat);
    m.face(sec.map((q) => at(path.length - 1, q)).reverse(), mat);
  }
  return m;
}

// ── EG-HERO (the Soul Cairn): the pieces both of its scenes are written with (tools/egHeroOssuaryScene.mjs,
// tools/egHeroMistStairScene.mjs) - a mesh's mirror, a box and a wound face on either, a gem, the rows a surface is cut at,
// a walk-graph edge's strip.
/** A mesh seen in the mirror X -> -X: each face's corners (and its corners' own normals) mirrored and wound back, so the
 *  west twin of an east piece faces where its twin faces, mirrored. Its `face` is the only method grid, lathe and sweep
 *  call. */
export function mirrorX(m) {
  const o = { face(pts, mat = 0, smooth = null) { m.face(pts.map((p) => [0 - p[0], p[1], p[2]]).reverse(), mat, smooth && smooth.map(([n, uv]) => [[0 - n[0], n[1], n[2]], uv]).reverse()); return o; } };
  return o;
}
/** The east piece of mesh `m` (s 1), or its west mirror (s -1). */
export const onSide = (m, s) => (s > 0 ? m : mirrorX(m));
/** A box on a mesh or its mirror, every face out (the reference's box, on either). */
export function boxOn(M, x0, y0, z0, x1, y1, z1, mat = 0) {
  const p = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
  for (const f of [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [0, 4, 7, 3], [1, 2, 6, 5]]) M.face(f.map((i) => p[i].map(r4)), mat);
  return M;
}
/** A flat face over `pts` wound to face `want` - its corners' own order or reversed, as Newell's normal decides. */
export function faceTo(M, pts, want, mat = 0) {
  let nx = 0, ny = 0, nz = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]); }
  const q = pts.map((p) => p.map(r4));
  M.face(nx * want[0] + ny * want[1] + nz * want[2] >= 0 ? q : q.reverse(), mat);
  return M;
}
/** An octahedron about (x, y, z), `r` its reach across and `h` up and down, every face out - a gem, a crystal. */
export function octahedron(M, x, y, z, r, h, mat = 0) {
  const t = [x, y, z + h].map(r4), b = [x, y, z - h].map(r4), ring = [[x + r, y, z], [x, y + r, z], [x - r, y, z], [x, y - r, z]].map((p) => p.map(r4));
  for (let k = 0; k < 4; k++) { const a = ring[k], c = ring[(k + 1) % 4]; M.face([a, c, t], mat); M.face([c, a, b], mat); }
  return M;
}
/** A row of values through each of `knots` (ascending or descending), each span cut evenly into pieces no longer than `max`
 *  - the rows and columns surfaces that meet are cut at, so their edges meet vertex to vertex. */
export function cuts(knots, max) {
  const out = [knots[0]];
  for (let k = 1; k < knots.length; k++) {
    const a = knots[k - 1], b = knots[k], n = Math.max(1, Math.ceil(Math.abs(b - a) / max - 1e-9));
    for (let i = 1; i <= n; i++) out.push(a + ((b - a) * i) / n);
  }
  return out;
}
/** A walk-graph edge's strip on mesh `m`, `w` wide, from node `a` to node `b` ([x, y, z]) along X or along Y - square to
 *  the course, so no edge asks a length of anything but subtraction. */
export function walkStrip(m, a, b, w = 0.2) {
  if (a[0] === b[0]) return m.level(a[0] - w / 2, Math.min(a[1], b[1]), a[0] + w / 2, Math.max(a[1], b[1]), a[2]);
  if (a[1] === b[1]) return m.level(Math.min(a[0], b[0]), a[1] - w / 2, Math.max(a[0], b[0]), a[1] + w / 2, a[2]);
  throw new Error(`walkStrip: [${a}] to [${b}] runs neither along X nor along Y`);
}

// ── EG-HERO (the Broken Galleries, 2026-10-13): the shapes two or more of the band's scenes share ───────────────────────
// A cut face's own normal, a two-layer shell broken open (the Caverns' sky over its chasm, the Stacks' broken dome) and a
// level floor of cells (every floor, ceiling and drawn ground of all three). Numbers IEEE-only, as above.

/** A face's own unit normal (Newell's - Math.sqrt alone), its corners counter-clockwise seen from where it faces. */
export function newell(pts) {
  const n = [0, 0, 0];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    n[0] += (a[1] - b[1]) * (a[2] + b[2]); n[1] += (a[2] - b[2]) * (a[0] + b[0]); n[2] += (a[0] - b[0]) * (a[1] + b[1]);
  }
  return unit(n);
}
/** The plan's UV of point `p` on a face whose normal is `n` (a tile every two metres, from the axis it faces most) - the
 *  reference writer's own mapping. */
export const planUv = (p, n) => {
  const ax = Math.abs(n[0]), ay = Math.abs(n[1]), az = Math.abs(n[2]);
  return az >= ax && az >= ay ? [p[0] / 2, p[1] / 2] : ax >= ay ? [p[1] / 2, p[2] / 2] : [p[0] / 2, p[2] / 2];
};
/** A FLAT FACE on mesh `m` (refFragMesh's) over `pts` (counter-clockwise seen from where it faces), material slot `mat`:
 *  HARD - every corner its own face's normal - and each corner's UV `uvOf(p, n, c)` (planUv by default; `c` the corner's
 *  index). A cut face. */
export function flat(m, pts, mat = 0, uvOf = planUv) {
  const P = pts.map((p) => p.map(r4)), n = newell(P);
  return m.face(P, mat, P.map((p, c) => [n, uvOf(p, n, c).map(r4)]));
}
/** A flat face over `pts` wound to face `want` (a direction - its corners taken in either order). */
export function facing(m, pts, want, mat = 0, uvOf = planUv) {
  const n = newell(pts.map((p) => p.map(r4)));
  return flat(m, n[0] * want[0] + n[1] * want[1] + n[2] * want[2] < 0 ? pts.slice().reverse() : pts, mat, uvOf);
}
/** A BOX on mesh `m` from (x0, y0, z0) to (x1, y1, z1), every face out and flat, its UVs `uvOf` (planUv by default); the
 *  faces `skip` names ('-x', '+x', '-y', '+y', '-z', '+z') left off. */
export function block(m, x0, y0, z0, x1, y1, z1, mat = 0, uvOf = planUv, skip = []) {
  const p = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
  const F = { '-z': [0, 3, 2, 1], '+z': [4, 5, 6, 7], '-y': [0, 1, 5, 4], '+y': [2, 3, 7, 6], '-x': [0, 4, 7, 3], '+x': [1, 2, 6, 5] };
  for (const [k, f] of Object.entries(F)) if (!skip.includes(k)) flat(m, f.map((i) => p[i]), mat, uvOf);
  return m;
}
/**
 * A LEVEL FLOOR OF CELLS on mesh `m`: the rectangles between consecutive `xs` and `ys` that `keep(x0, y0, x1, y1)` keeps,
 * at height `z`, facing up (down with `down`) - every edge two cells share one edge, so the outline is one loop with no
 * T-junction (a marker's - floor.*, ceil.* - or a drawn floor's). UVs the plan's unless `uvOf`.
 */
export function cells(m, xs, ys, z, keep = () => true, mat = 0, { down = false, uvOf = planUv } = {}) {
  for (let j = 0; j + 1 < ys.length; j++) {
    for (let i = 0; i + 1 < xs.length; i++) {
      const x0 = xs[i], x1 = xs[i + 1], y0 = ys[j], y1 = ys[j + 1];
      if (!keep(x0, y0, x1, y1)) continue;
      const q = [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]];
      flat(m, down ? q.reverse() : q, mat, uvOf);
    }
  }
  return m;
}
/**
 * A SHELL on mesh `m`: two grids on one lattice (i in 0..cols, j in 0..rows) - the INNER face at `inner(i, j)`, its
 * normals toward the cavity (cross(d/di, d/dj); `flipIn` turns it), and the OUTER face at `outer(i, j)`, its normals away -
 * with the cells `hole(i, j)` names taken out of both, and every edge between a kept cell and a taken one closed by a RIM
 * from the inner edge to the outer (flat, facing into the hole): the rock round an opening onto the sky, a dome's broken
 * edge. The cells `cut(i, j)` names leave the inner face alone and close no rim: a doorway its caller frames. Both faces are SMOOTH (each corner's normal its lattice neighbours', as `grid`'s); `ring` closes i round (corner
 * `cols` is corner 0). Each cell's material slot `matIn(i, j)`, `matOut(i, j)`, each corner's UV `uvIn(i, j, p)`,
 * `uvOut(i, j, p)`; the rims' `matRim` and `uvRim(p, n)`.
 */
export function shell(m, { cols, rows, inner, outer, hole = () => false, cut = () => false, ring = false, flipIn = false, matIn = () => 0, matOut = () => 0, matRim = 0, uvIn, uvOut, uvRim = planUv }) {
  const lattice = (at) => { const P = []; for (let j = 0; j <= rows; j++) { const row = []; for (let i = 0; i <= cols; i++) row.push((ring && i === cols ? at(0, j) : at(i, j)).map(r4)); P.push(row); } return P; };
  const PI = lattice(inner), PO = lattice(outer);
  const at = (P, i, j) => P[Math.max(0, Math.min(rows, j))][ring ? ((i % cols) + cols) % cols : Math.max(0, Math.min(cols, i))];
  const normal = (P, i, j, s) => {
    const du = sub(at(P, i + 1, j), at(P, i - 1, j)), dv = sub(at(P, i, j + 1), at(P, i, j - 1)), n = unit(cross(du, dv));
    return s < 0 ? n.map((c) => -c + 0) : n;
  };
  const sIn = flipIn ? -1 : 1;
  const gone = (i, j) => j < 0 || j >= rows || (!ring && (i < 0 || i >= cols)) ? null : hole(ring ? ((i % cols) + cols) % cols : i, j);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      if (hole(i, j)) continue;
      const q = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
      const qi = sIn > 0 ? q : q.slice().reverse(), qo = sIn > 0 ? q.slice().reverse() : q;
      if (!cut(i, j)) m.face(qi.map(([a, b]) => PI[b][a]), matIn(i, j), qi.map(([a, b]) => [normal(PI, a, b, sIn), uvIn(a, b, PI[b][a]).map(r4)]));
      m.face(qo.map(([a, b]) => PO[b][a]), matOut(i, j), qo.map(([a, b]) => [normal(PO, a, b, -sIn), uvOut(a, b, PO[b][a]).map(r4)]));
      // the rims: each side of this kept cell that meets a taken one
      for (const [di, dj, e0, e1] of [[1, 0, [i + 1, j], [i + 1, j + 1]], [-1, 0, [i, j + 1], [i, j]], [0, 1, [i + 1, j + 1], [i, j + 1]], [0, -1, [i, j], [i + 1, j]]]) {
        if (gone(i + di, j + dj) !== true) continue;
        const A = PI[e0[1]][e0[0]], B = PI[e1[1]][e1[0]], Ao = PO[e0[1]][e0[0]], Bo = PO[e1[1]][e1[0]];
        const ci = [0, 1, 2].map((k) => (PI[j][i][k] + PI[j + 1][i + 1][k]) / 2), toward = sub([0, 1, 2].map((k) => (A[k] + B[k]) / 2), ci);
        let pts = [A, B, Bo, Ao];
        const n = newell(pts);
        if (n[0] * toward[0] + n[1] * toward[1] + n[2] * toward[2] < 0) pts = pts.reverse();
        flat(m, pts, matRim, uvRim);
      }
    }
  }
  return { inner: PI, outer: PO };
}
