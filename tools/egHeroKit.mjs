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
