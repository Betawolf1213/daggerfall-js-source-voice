// @ts-check
// ═══════════════════════════════════════════════════════════════════
// POI-5 (2026-10-14) - A SPARSE SYMMETRIC POSITIVE-DEFINITE SYSTEM, SOLVED DIRECTLY.
//
// The UV editor's unwrap (poi/uvMesh.js unwrapLscm) is a least-squares system over every vertex of an island; an
// iterative solve crawls on a large one (two pins far apart: the low frequencies take thousands of steps - an
// 80,000-triangle sheet ran out of 6,000 and was still stretched a hundredfold). This is the direct solve the standard
// unwrappers make (OpenNL's in Blender, libigl's): a Cholesky factorization of the normal matrix, in the order a
// NESTED DISSECTION of the mesh's own geometry gives - the island split at the median of its longest side, the
// vertices along the cut eliminated last, both halves likewise - which keeps the factor's fill near-linear on a surface.
//
//   - `orderByDissection(points, neighbours)`: the elimination order (vertices).
//   - `cholesky(n, colPtr, rowIdx, vals)`: the factor L of a matrix given by its upper triangle in compressed columns
//     (CSparse's up-looking cs_chol: the elimination tree, each row of L's pattern by its reach in the tree, a symbolic
//     pass that counts the columns before the numeric one fills them) - or null where the matrix is not positive
//     definite (a degenerate island: the caller falls back).
//   - `solveCholesky(L, b)`: L L^T x = b.
//
// Pure - typed arrays in, typed arrays out. Not a DFU member. Ledger A (POI).
// ═══════════════════════════════════════════════════════════════════

/**
 * An elimination order for a mesh's vertices by geometric nested dissection: split at the median of the longest axis of
 * the set's bounding box, the separator (the vertices of one side with a neighbour on the other) ordered after both
 * halves, recursively; a set of `leaf` or fewer in any order.
 * @param {ArrayLike<number>[]} points each vertex's position @param {number[][]} neighbours each vertex's neighbours
 * @param {number} [leaf] @returns {Int32Array} order[k] = the vertex eliminated k-th
 */
export function orderByDissection(points, neighbours, leaf = 48) {
  const N = points.length;
  const side = new Int8Array(N);   // a scratch mark: 1 the low half, 2 the high, 0 neither
  // depth-first: the low half ordered, then the high, then the separator between them
  const out = [];
  const recurse = (set) => {
    if (set.length <= leaf) { for (const v of set) out.push(v); return; }
    let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (const v of set) for (let a = 0; a < 3; a++) { const c = points[v][a]; if (c < lo[a]) lo[a] = c; if (c > hi[a]) hi[a] = c; }
    const ax = [0, 1, 2].reduce((b, a) => (hi[a] - lo[a] > hi[b] - lo[b] ? a : b), 0);
    const sorted = [...set].sort((p, q) => points[p][ax] - points[q][ax]);
    const half = sorted.length >> 1;
    for (let i = 0; i < sorted.length; i++) side[sorted[i]] = i < half ? 1 : 2;
    const low = [], high = [], sep = [];
    for (let i = 0; i < half; i++) {
      const v = sorted[i];
      if (neighbours[v].some((u) => side[u] === 2)) sep.push(v); else low.push(v);
    }
    for (let i = half; i < sorted.length; i++) high.push(sorted[i]);
    for (const v of set) side[v] = 0;
    // a split that separates nothing (every low vertex touches the high side) is a leaf after all
    if (!low.length || !high.length) { for (const v of set) out.push(v); return; }
    recurse(low); recurse(high);
    for (const v of sep) out.push(v);
  };
  recurse(Int32Array.from({ length: N }, (_, i) => i));
  return Int32Array.from(out);
}

/**
 * The Cholesky factor of a symmetric positive-definite matrix given by its UPPER triangle (row <= column) in compressed
 * columns: `{ n, colPtr, rowIdx, vals }` of L (lower, compressed columns, each column's diagonal first) - or null.
 * @param {number} n @param {Int32Array} Ap @param {Int32Array} Ai @param {Float64Array} Ax
 */
export function cholesky(n, Ap, Ai, Ax) {
  // the elimination tree (cs_etree over the upper triangle)
  const parent = new Int32Array(n).fill(-1), ancestor = new Int32Array(n).fill(-1);
  for (let k = 0; k < n; k++) {
    for (let p = Ap[k]; p < Ap[k + 1]; p++) {
      let i = Ai[p];
      while (i !== -1 && i < k) {
        const next = ancestor[i];
        ancestor[i] = k;
        if (next === -1) parent[i] = k;
        i = next;
      }
    }
  }
  const mark = new Int32Array(n).fill(-1), s = new Int32Array(n);
  /** Row k of L's pattern: the reach of A(0:k-1, k) in the tree, topologically ordered into s[top..n-1]. */
  const ereach = (k) => {
    let top = n;
    mark[k] = k;
    for (let p = Ap[k]; p < Ap[k + 1]; p++) {
      let i = Ai[p];
      if (i > k) continue;
      let len = 0;
      for (; mark[i] !== k; i = parent[i]) { s[len++] = i; mark[i] = k; }
      while (len > 0) s[--top] = s[--len];
    }
    return top;
  };
  // the symbolic pass: each column's count (its diagonal, and every row whose pattern holds it)
  const counts = new Int32Array(n).fill(1);
  for (let k = 0; k < n; k++) { const top = ereach(k); for (let q = top; q < n; q++) counts[s[q]]++; }
  mark.fill(-1);
  const Lp = new Int32Array(n + 1);
  for (let k = 0; k < n; k++) Lp[k + 1] = Lp[k] + counts[k];
  const nnz = Lp[n];
  const Li = new Int32Array(nnz), Lx = new Float64Array(nnz);
  const c = Int32Array.from(Lp.subarray(0, n));   // each column's next free entry
  const x = new Float64Array(n);
  for (let k = 0; k < n; k++) {
    const top = ereach(k);
    x[k] = 0;
    for (let p = Ap[k]; p < Ap[k + 1]; p++) if (Ai[p] <= k) x[Ai[p]] += Ax[p];
    let d = x[k];
    x[k] = 0;
    for (let q = top; q < n; q++) {
      const i = s[q];
      const lki = x[i] / Lx[Lp[i]];
      x[i] = 0;
      for (let p = Lp[i] + 1; p < c[i]; p++) x[Li[p]] -= Lx[p] * lki;
      d -= lki * lki;
      const p = c[i]++;
      Li[p] = k; Lx[p] = lki;
    }
    if (!(d > 0)) return null;
    const p = c[k]++;
    Li[p] = k; Lx[p] = Math.sqrt(d);
  }
  return { n, colPtr: Lp, rowIdx: Li, vals: Lx };
}

/** L L^T x = b, by a forward and a backward substitution. @param {{ n: number, colPtr: Int32Array, rowIdx: Int32Array, vals: Float64Array }} L @param {Float64Array} b */
export function solveCholesky(L, b) {
  const { n, colPtr: Lp, rowIdx: Li, vals: Lx } = L;
  const x = Float64Array.from(b);
  for (let j = 0; j < n; j++) {          // L y = b
    x[j] /= Lx[Lp[j]];
    for (let p = Lp[j] + 1; p < Lp[j + 1]; p++) x[Li[p]] -= Lx[p] * x[j];
  }
  for (let j = n - 1; j >= 0; j--) {     // L^T x = y
    for (let p = Lp[j] + 1; p < Lp[j + 1]; p++) x[j] -= Lx[p] * x[Li[p]];
    x[j] /= Lx[Lp[j]];
  }
  return x;
}

/**
 * A symmetric matrix's upper triangle in compressed columns from (row, column, value) triples - duplicates summed,
 * each column's rows sorted. Triples below the diagonal are mirrored above it.
 * @param {number} n @param {Int32Array} I @param {Int32Array} J @param {Float64Array} V @param {number} count
 */
export function upperCsc(n, I, J, V, count) {
  const colCount = new Int32Array(n + 1);
  for (let t = 0; t < count; t++) { const c = Math.max(I[t], J[t]); colCount[c + 1]++; }
  for (let c = 0; c < n; c++) colCount[c + 1] += colCount[c];
  const next = Int32Array.from(colCount.subarray(0, n));
  const ri = new Int32Array(count), rv = new Float64Array(count);
  for (let t = 0; t < count; t++) {
    const r = Math.min(I[t], J[t]), c = Math.max(I[t], J[t]);
    const p = next[c]++;
    ri[p] = r; rv[p] = V[t];
  }
  // each column: its rows sorted, duplicates summed
  const Ap = new Int32Array(n + 1), Ai = [], Ax = [];
  const order = [];
  for (let c = 0; c < n; c++) {
    order.length = 0;
    for (let p = colCount[c]; p < colCount[c + 1]; p++) order.push(p);
    order.sort((a, b) => ri[a] - ri[b]);
    let last = -1;
    for (const p of order) {
      if (ri[p] === last) Ax[Ax.length - 1] += rv[p];
      else { Ai.push(ri[p]); Ax.push(rv[p]); last = ri[p]; }
    }
    Ap[c + 1] = Ai.length;
  }
  return { Ap, Ai: Int32Array.from(Ai), Ax: Float64Array.from(Ax) };
}
