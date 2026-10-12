// @ts-check
// EG-G2 (2026-10-12, Mac: "I said I want everything"; bible/11-Multiplayer/Elite-Gates.md section 11.9 - "The moving
// pieces are instanced", "The cull"): THE PIECES BATCHED, AND CULLED - every moving piece of a circle's spans drawn as
// ONE DRAW A KIND, its copies culled against this frame's frustum.
//
// Before: every step, weight, wall segment and tube segment was a draw of its own (scenes/egSpan.js - a dynamic draw
// each, its matrix written as the law moved it), so a circle of 46 pieces and a Falling Wall's 50 segments stood ~100
// dynamic draws and, a piece's sub-meshes each a GL draw, 150-250 GL draws - past the Hour's whole frame (82). Now each
// mesh kind (a Drift's, a Beat's, a 3 x 2.4 slab's, a wall segment's...) is one mesh holding a copy for every piece of
// its kind, and each frame the copies that are seen and inside the frustum are written where the law stands them; a
// hidden or culled copy is written as one point (no triangle it holds covers a pixel), and a kind with no copy seen is
// not drawn at all. The draw count is the kinds', whatever the pieces'.
//
// HOW, AND WHY NOT GPU INSTANCES. The page asks for "per-instance matrices from stepAt". The world's mesh program (the
// renderer's own - its lane, its point lights, its fog and its grade) has no instance attribute, and giving it one is the
// renderer's change, not this slice's: a pass of our own beside it would light the pieces differently from the floors
// they stand between. So the copies are written on the CPU (every piece moves by a translation alone - the law's
// egPieceAt, the walls' fall, the tubes' - so a copy is its kind's vertices plus one offset) and drawn by the renderer's
// own program through renderer.updateMeshVertices, in the pieces' own light. Measured in test/eglook_pieces.test.js.
//
// THE SLOT IS THE DRAW IT REPLACED. egSpan's pose code writes each piece's `object.matrix` (a translation, or zeros when
// it is gone) and its `hidden`, as it always did - the batch hands it a slot of that shape and reads the slots at the
// cull (`cull(planes)`), so not one line of the law's posing changed. Every piece is `noShadow` (section 11.9), so a culled
// copy leaves no shadow record behind.
//
// EG-ZL (2026-10-12, Elite-Gates.md sections 10.3 and 10.8 - the pieces' tells): A KIND THAT TURNS, AND A KIND'S OWN
// PICTURES. A Drift's chains lean with its swing, a Crumble's chunks tumble as they fall and fly back, a Gust island's
// banner swings to the coming push - each turns as well as moves, so a kind added `turns` writes its copies through the
// slot's whole matrix (its turn and its move - normals turned with it), its cull sphere's centre turned too, and a copy
// re-laid when any of the twelve numbers moved; a kind that only moves keeps the translation's own law above, untouched. And
// a kind's draw takes a picture map (`remap` - the Beat's dial frames by its beat, a Crumble's crack stage), one map a
// kind, so the pieces a frame of law shows alike share one draw.
//
// Not a DFU member. Ledger A (ELITE-GATES).
import { sphereInPlanes } from '../render/bounds.js';
import { meshKitBounds } from '../world/meshKit.js';

/** Where a hidden or culled copy's vertices are put: one point, far under every floor (no triangle covers a pixel). */
export const EG_BATCH_HIDE_Y = -4000;
/** The cull's margin over a copy's own sphere (m) - a copy is drawn while any of it may be. */
export const EG_BATCH_CULL_PAD = 0.5;
/** EG-ZL: a turning copy's matrix entries the batch keeps (its turn's three columns and its move) - column-major. */
const TURN_AT = Object.freeze([0, 1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14]);

/**
 * A circle's pieces, batched.
 * @param {{ renderer?: any }} deps
 */
export function createEgPieceBatch({ renderer = null } = {}) {
  /** @type {Map<string, { model: any, slots: any[], gpu: any, draw: any, pos: Float32Array|null, nrm: Float32Array|null, at: Float32Array, seen: Uint8Array, centre: number[], r: number, verts: number, turns: boolean, remap: any }>} */
  const kinds = new Map();
  let built = false, lastDrawn = 0, lastCulled = 0, lastHidden = 0;
  return {
    /**
     * A piece of kind `key` (one model for the kind - its first add's), its slot `slot` - the `{ object: { matrix },
     * hidden }` its pose code writes. Before `build`. EG-ZL: `turns` (the kind's first add says) - its copies written
     * through the slot's whole matrix, not its move alone.
     */
    add(key, model, slot, { turns = false } = {}) {
      if (built || !model || !slot) return false;
      let k = kinds.get(key);
      if (!k) { const b = meshKitBounds(model.positions); kinds.set(key, k = { model, slots: [], gpu: null, draw: null, pos: null, nrm: null, at: new Float32Array(0), seen: new Uint8Array(0), centre: b.centre, r: b.r, verts: model.positions.length / 3, turns: !!turns, remap: null }); }
      k.slots.push(slot);
      return true;
    },
    /** EG-ZL: kind `key`'s picture map (a draw's texRemap - null its model's own), before or after `build`. Answers whether
     *  the kind is held. */
    remap(key, map) {
      const k = kinds.get(key);
      if (!k) return false;
      k.remap = map ?? null;
      if (k.draw) k.draw.texRemap = k.remap;
      return true;
    },
    /** Every kind made one mesh of its copies (all hidden until the first cull) and its one draw pushed onto `draws`. */
    build(draws) {
      if (built) return 0;
      built = true;
      let n = 0;
      for (const k of kinds.values()) {
        const m = k.model, c = k.slots.length, V = k.verts, I = m.indices.length;
        const positions = new Float32Array(V * 3 * c), normals = new Float32Array(V * 3 * c), uvs = new Float32Array(V * 2 * c), indices = new Uint32Array(I * c);
        // the sub-meshes keep their records, each holding its triangles of every copy: copy i's at its own run
        let acc = 0;
        const subMeshes = m.subMeshes.map((sm) => { const o = { textureArchive: sm.textureArchive, textureRecord: sm.textureRecord, startIndex: acc, primitiveCount: sm.primitiveCount * c }; acc += sm.primitiveCount * 3 * c; return o; });
        for (let i = 0; i < c; i++) {
          normals.set(m.normals, i * V * 3); uvs.set(m.uvs, i * V * 2);
          for (let p = 0; p < V; p++) { positions[(i * V + p) * 3] = 0; positions[(i * V + p) * 3 + 1] = EG_BATCH_HIDE_Y; positions[(i * V + p) * 3 + 2] = 0; }
        }
        m.subMeshes.forEach((sm, s) => {
          const tris = sm.primitiveCount * 3, start = sm.startIndex;
          for (let i = 0; i < c; i++) for (let q = 0; q < tris; q++) indices[subMeshes[s].startIndex + i * tris + q] = m.indices[start + q] + i * V;
        });
        k.pos = positions; k.nrm = normals;
        k.at = new Float32Array(c * (k.turns ? TURN_AT.length : 3)).fill(NaN); k.seen = new Uint8Array(c);
        try { k.gpu = renderer?.createMesh ? renderer.createMesh({ positions, normals, uvs, indices, subMeshes }) : null; } catch (e) { console.warn('[eg] a batch would not build', e?.message ?? e); k.gpu = null; }
        if (k.gpu) { k.draw = { gpu: k.gpu, object: { matrix: IDENTITY }, noShadow: true, texRemap: null, hidden: true }; k.draw.texRemap = k.remap; draws?.push?.(k.draw); n++; }
      }
      return n;
    },
    /**
     * THE CULL, this frame (`planes` - render/bounds.js spherePlanes of the view-projection; null culls nothing): each copy
     * that is seen and inside written where its slot stands it, each other one put away; a kind with none seen not drawn.
     * The vertices are sent only when a copy moved, came or went. Answers how many kinds draw.
     */
    cull(planes = null) {
      let drawn = 0, culled = 0, hidden = 0;
      for (const k of kinds.values()) {
        if (!k.pos) continue;
        const m = k.model, V = k.verts;
        let any = false, dirty = false;
        if (k.turns) { const q = cullTurning(k, planes); culled += q.culled; hidden += q.hidden; any = q.any; dirty = q.dirty; }   // EG-ZL: a kind that turns
        else for (let i = 0; i < k.slots.length; i++) {
          const s = k.slots[i], M = s.object?.matrix;
          let show = !s.hidden && !!M && M[15] !== 0;   // a pose's zeros (a gone piece) are no place
          if (!show) hidden++;
          const x = show ? M[12] : 0, y = show ? M[13] : 0, z = show ? M[14] : 0;
          if (show && planes && !sphereInPlanes(planes, k.centre[0] + x, k.centre[1] + y, k.centre[2] + z, k.r + EG_BATCH_CULL_PAD)) { show = false; culled++; }
          if (show) any = true;
          const was = k.seen[i] === 1;
          if (show === was && (!show || (k.at[i * 3] === x && k.at[i * 3 + 1] === y && k.at[i * 3 + 2] === z))) continue;
          dirty = true;
          k.seen[i] = show ? 1 : 0;
          k.at[i * 3] = x; k.at[i * 3 + 1] = y; k.at[i * 3 + 2] = z;
          const o = i * V * 3, src = m.positions;
          if (show) for (let p = 0; p < V; p++) { k.pos[o + p * 3] = src[p * 3] + x; k.pos[o + p * 3 + 1] = src[p * 3 + 1] + y; k.pos[o + p * 3 + 2] = src[p * 3 + 2] + z; }
          else for (let p = 0; p < V; p++) { k.pos[o + p * 3] = 0; k.pos[o + p * 3 + 1] = EG_BATCH_HIDE_Y; k.pos[o + p * 3 + 2] = 0; }
        }
        if (dirty && k.gpu) { try { renderer?.updateMeshVertices?.(k.gpu, k.pos, k.nrm); } catch (e) { console.warn('[eg] a batch would not move', e?.message ?? e); } }
        if (k.draw) k.draw.hidden = !any;
        if (any) drawn++;
      }
      lastDrawn = drawn; lastCulled = culled; lastHidden = hidden;
      return drawn;
    },
    /** What the batch holds and what its last cull drew (tests, the budget's measure). */
    stats() {
      let copies = 0, glDraws = 0;
      for (const k of kinds.values()) { copies += k.slots.length; if (k.draw && !k.draw.hidden) glDraws += k.model.subMeshes.length; }
      return { kinds: kinds.size, copies, drawn: lastDrawn, culled: lastCulled, hidden: lastHidden, glDraws };
    },
    /** EG-ZL: copy `i`'s vertex `p` where the cull wrote it (tests), or null. */
    copyVertex(key, i, p = 0) {
      const k = kinds.get(key);
      if (!k?.pos || i >= k.slots.length || p >= k.verts) return null;
      const o = (i * k.verts + p) * 3;
      return [k.pos[o], k.pos[o + 1], k.pos[o + 2]];
    },
    /** A copy's written place (tests): its kind's first vertex where the cull put it, or null. */
    copyAt(key, i) {
      const k = kinds.get(key);
      if (!k?.pos || i >= k.slots.length) return null;
      const o = i * k.verts * 3;
      return [k.pos[o] - k.model.positions[0], k.pos[o + 1] - k.model.positions[1], k.pos[o + 2] - k.model.positions[2]];
    },
    /** Gone with the level: every batch's mesh freed. */
    clear() {
      for (const k of kinds.values()) { if (k.gpu) { try { renderer?.destroyMesh?.(k.gpu); } catch { /* gone */ } } k.gpu = null; k.draw = null; k.pos = null; }
      kinds.clear();
      built = false;
    },
  };
}
const IDENTITY = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
/** EG-ZL - A TURNING KIND'S CULL: each copy shown and inside written through its slot's whole matrix (its normals turned
 *  with it), each other put away; a copy re-laid only when it came, went or any of its twelve numbers moved. Answers what
 *  the frame found (its own scratch - a frame makes nothing). */
const _turnCounts = { culled: 0, hidden: 0, any: false, dirty: false };
function cullTurning(k, planes) {
  const T = _turnCounts, m = k.model, V = k.verts, src = m.positions, sn = m.normals, A = TURN_AT.length, c = k.centre;
  T.culled = 0; T.hidden = 0; T.any = false; T.dirty = false;
  for (let i = 0; i < k.slots.length; i++) {
    const s = k.slots[i], M = s.object?.matrix;
    let show = !s.hidden && M != null && M[15] !== 0;   // a pose's zeros: no place
    if (!show) T.hidden++;
    if (show && planes && !sphereInPlanes(planes, M[0] * c[0] + M[4] * c[1] + M[8] * c[2] + M[12], M[1] * c[0] + M[5] * c[1] + M[9] * c[2] + M[13], M[2] * c[0] + M[6] * c[1] + M[10] * c[2] + M[14], k.r + EG_BATCH_CULL_PAD)) { show = false; T.culled++; }
    if (show) T.any = true;
    const was = k.seen[i] === 1, o12 = i * A;
    if (show === was) {
      if (!show) continue;
      let same = true;
      for (let j = 0; j < A; j++) if (k.at[o12 + j] !== M[TURN_AT[j]]) { same = false; break; }
      if (same) continue;
    }
    T.dirty = true;
    k.seen[i] = show ? 1 : 0;
    const o = i * V * 3;
    if (!show) {
      k.at.fill(NaN, o12, o12 + A);
      for (let p = 0; p < V; p++) { k.pos[o + p * 3] = 0; k.pos[o + p * 3 + 1] = EG_BATCH_HIDE_Y; k.pos[o + p * 3 + 2] = 0; }
      continue;
    }
    for (let j = 0; j < A; j++) k.at[o12 + j] = M[TURN_AT[j]];
    const a0 = M[0], a1 = M[1], a2 = M[2], b0 = M[4], b1 = M[5], b2 = M[6], c0 = M[8], c1 = M[9], c2 = M[10], tx = M[12], ty = M[13], tz = M[14];
    for (let p = 0; p < V; p++) {
      const q = p * 3, x = src[q], y = src[q + 1], z = src[q + 2], nx = sn[q], ny = sn[q + 1], nz = sn[q + 2];
      k.pos[o + q] = a0 * x + b0 * y + c0 * z + tx; k.pos[o + q + 1] = a1 * x + b1 * y + c1 * z + ty; k.pos[o + q + 2] = a2 * x + b2 * y + c2 * z + tz;
      k.nrm[o + q] = a0 * nx + b0 * ny + c0 * nz; k.nrm[o + q + 1] = a1 * nx + b1 * ny + c1 * nz; k.nrm[o + q + 2] = a2 * nx + b2 * ny + c2 * nz;
    }
  }
  return T;
}
