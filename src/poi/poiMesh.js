// @ts-check
// ═══════════════════════════════════════════════════════════════════
// POI-1 (2026-10-14) - A POI'S MESH, AS THE REALM STORES IT AND THE GAME DRAWS IT.
//
// Mac: "POI Tool (General Map Editor) - Realtime editor ... Allowing not just the creation of POI's using models, but also
// the ability to import models, texture, UV map, and even placement onto our actual map ... No short cuts or band aids"
// (bible/06-Systems/POI-Editor-Arc.md).
//
// A model the editor imports (glTF 2.0, poi/gltfImport.js) is written ONCE into this binary - the shape the renderer's
// createMesh takes, already in the game's own frame - and stored by its sha256 (server-account/src/poi.js). Every reader
// (the account service that refuses a bad one, the game that draws it, the editor that edits its UVs) reads it through
// `decodePoiMesh`, and every writer through `encodePoiMesh`: one layout, one door each way.
//
// THE LAYOUT (little-endian):
//   0  'POIM'                  magic
//   4  u16 version (1)         u16 flags (bit 0: indices are u32, else u16)
//   8  u32 vertexCount         u32 indexCount
//   16 u16 submeshCount        u16 reserved (0)
//   20 f32[3] boundsMin        f32[3] boundsMax              (metres, the model's own frame)
//   44 submeshes: { u32 start, u32 count } each - indices, a run per material, in order, whole triangles
//      positions f32[3] each vertex, normals f32[3], uvs f32[2], then the indices (u16 or u32), padded to 4 bytes
//
// THE FRAME: metres; the game's model frame (meshReader.js dfMeshToModel's - Unity's left-handed, +Y up, +Z forward);
// triangles wound as that frame's front faces. UVs as glTF writes them: (0,0) the image's TOP-left, v growing down -
// the runtime turns them to the renderer's own convention (poi/poiRuntime.js), so an edited UV means one thing everywhere.
// ═══════════════════════════════════════════════════════════════════

export const POI_MESH_MAGIC = 0x4d494f50;   // 'POIM' read as a little-endian u32
export const POI_MESH_VERSION = 1;
const HEADER_BYTES = 44;
const FLAG_U32 = 1;

/** The bounds a POI's mesh is held to - a mesh past any is refused at the door (the editor before the upload, the service
 *  at it), never cut. 262,144 vertices and a million triangles is a whole fortress; 64 materials more than any one model. */
export const POI_MESH_LIMITS = Object.freeze({
  vertices: 262_144,
  indices: 3 * 1_048_576,
  submeshes: 64,
  extent: 2048,          // metres from the model's origin, every axis - a pixel is 819.2 m across
  bytes: 24 * 1024 * 1024,
});

/**
 * @typedef {{ start: number, count: number }} PoiSubmesh
 * @typedef {{ positions: Float32Array, normals: Float32Array, uvs: Float32Array, indices: Uint16Array | Uint32Array,
 *   submeshes: PoiSubmesh[], boundsMin?: number[], boundsMax?: number[] }} PoiMesh
 */

/** The bounds of a position list - `[min, max]`, each `[x, y, z]`; a list of none answers zeros. @param {Float32Array} p */
export function meshBoxOf(p) {
  if (!p.length) return [[0, 0, 0], [0, 0, 0]];
  const min = [p[0], p[1], p[2]], max = [p[0], p[1], p[2]];
  for (let i = 3; i < p.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      const v = p[i + k];
      if (v < min[k]) min[k] = v;
      if (v > max[k]) max[k] = v;
    }
  }
  return [min, max];
}

/**
 * Why a mesh is not one the realm takes - the first reason, or null. The ONE check, the encoder's and the decoder's alike:
 * lengths that agree, finite numbers, every index a vertex, every run whole triangles inside the list and in order, the
 * limits above. @param {PoiMesh} m @returns {string | null}
 */
export function poiMeshError(m) {
  if (!m || !(m.positions instanceof Float32Array) || !(m.normals instanceof Float32Array) || !(m.uvs instanceof Float32Array)) return 'arrays';
  if (!(m.indices instanceof Uint16Array || m.indices instanceof Uint32Array)) return 'arrays';
  const V = m.positions.length / 3;
  if (!Number.isInteger(V) || V < 3) return 'vertices';
  if (V > POI_MESH_LIMITS.vertices) return 'too-many-vertices';
  if (m.normals.length !== V * 3 || m.uvs.length !== V * 2) return 'attribute-length';
  const I = m.indices.length;
  if (I < 3 || I % 3) return 'indices';
  if (I > POI_MESH_LIMITS.indices) return 'too-many-indices';
  if (!Array.isArray(m.submeshes) || !m.submeshes.length) return 'submeshes';
  if (m.submeshes.length > POI_MESH_LIMITS.submeshes) return 'too-many-submeshes';
  let at = 0;
  for (const s of m.submeshes) {
    if (!s || !Number.isInteger(s.start) || !Number.isInteger(s.count) || s.start !== at || s.count <= 0 || s.count % 3) return 'submesh-run';
    at += s.count;
  }
  if (at !== I) return 'submesh-run';
  for (const arr of [m.positions, m.normals, m.uvs]) {
    for (let i = 0; i < arr.length; i++) if (!Number.isFinite(arr[i])) return 'not-finite';
  }
  for (let i = 0; i < m.positions.length; i++) if (Math.abs(m.positions[i]) > POI_MESH_LIMITS.extent) return 'too-large';
  for (let i = 0; i < I; i++) if (m.indices[i] >= V) return 'index-range';
  return null;
}

/** The mesh as bytes - or throws, with poiMeshError's reason, for a mesh the realm would refuse. @param {PoiMesh} m */
export function encodePoiMesh(m) {
  const why = poiMeshError(m);
  if (why) throw new Error(`poi mesh: ${why}`);
  const V = m.positions.length / 3, I = m.indices.length, S = m.submeshes.length;
  const wide = V > 65535 || m.indices instanceof Uint32Array;
  const indexBytes = I * (wide ? 4 : 2);
  const size = HEADER_BYTES + S * 8 + V * (3 + 3 + 2) * 4 + indexBytes + ((4 - (indexBytes % 4)) % 4);
  if (size > POI_MESH_LIMITS.bytes) throw new Error('poi mesh: too-many-bytes');
  const buf = new ArrayBuffer(size);
  const dv = new DataView(buf);
  const [min, max] = meshBoxOf(m.positions);
  dv.setUint32(0, POI_MESH_MAGIC, true);
  dv.setUint16(4, POI_MESH_VERSION, true);
  dv.setUint16(6, wide ? FLAG_U32 : 0, true);
  dv.setUint32(8, V, true);
  dv.setUint32(12, I, true);
  dv.setUint16(16, S, true);
  dv.setUint16(18, 0, true);
  for (let k = 0; k < 3; k++) { dv.setFloat32(20 + k * 4, min[k], true); dv.setFloat32(32 + k * 4, max[k], true); }
  let at = HEADER_BYTES;
  for (const s of m.submeshes) { dv.setUint32(at, s.start, true); dv.setUint32(at + 4, s.count, true); at += 8; }
  const bytes = new Uint8Array(buf);
  const put = (/** @type {ArrayBufferView} */ a) => { bytes.set(new Uint8Array(a.buffer, a.byteOffset, a.byteLength), at); at += a.byteLength; };
  // copies, so a view over a bigger buffer writes only its own floats, little-endian as every platform the game runs on
  put(Float32Array.from(m.positions));
  put(Float32Array.from(m.normals));
  put(Float32Array.from(m.uvs));
  put(wide ? Uint32Array.from(m.indices) : Uint16Array.from(m.indices));
  return bytes;
}

/**
 * The mesh these bytes hold - `{ mesh }` - or `{ error }`: a short file, a wrong magic or version, lengths the header
 * does not account for, or anything poiMeshError refuses. Never throws.
 * @param {ArrayBuffer | Uint8Array} input @returns {{ mesh: PoiMesh & { boundsMin: number[], boundsMax: number[] } } | { error: string }}
 */
export function decodePoiMesh(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes.byteLength < HEADER_BYTES) return { error: 'short' };
  if (bytes.byteLength > POI_MESH_LIMITS.bytes) return { error: 'too-many-bytes' };
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (dv.getUint32(0, true) !== POI_MESH_MAGIC) return { error: 'magic' };
  if (dv.getUint16(4, true) !== POI_MESH_VERSION) return { error: 'version' };
  const flags = dv.getUint16(6, true);
  if (flags & ~FLAG_U32) return { error: 'flags' };
  const V = dv.getUint32(8, true), I = dv.getUint32(12, true), S = dv.getUint16(16, true);
  if (V > POI_MESH_LIMITS.vertices) return { error: 'too-many-vertices' };
  if (I > POI_MESH_LIMITS.indices) return { error: 'too-many-indices' };
  if (S > POI_MESH_LIMITS.submeshes) return { error: 'too-many-submeshes' };
  const wide = (flags & FLAG_U32) !== 0;
  const indexBytes = I * (wide ? 4 : 2);
  const want = HEADER_BYTES + S * 8 + V * 32 + indexBytes + ((4 - (indexBytes % 4)) % 4);
  if (bytes.byteLength !== want) return { error: 'length' };
  const boundsMin = [0, 1, 2].map((k) => dv.getFloat32(20 + k * 4, true));
  const boundsMax = [0, 1, 2].map((k) => dv.getFloat32(32 + k * 4, true));
  let at = HEADER_BYTES;
  const submeshes = [];
  for (let s = 0; s < S; s++) { submeshes.push({ start: dv.getUint32(at, true), count: dv.getUint32(at + 4, true) }); at += 8; }
  // copied out, so the mesh owns aligned arrays whatever the input's offset
  const take = (/** @type {number} */ n) => { const out = bytes.slice(at, at + n); at += n; return out.buffer; };
  const positions = new Float32Array(take(V * 12));
  const normals = new Float32Array(take(V * 12));
  const uvs = new Float32Array(take(V * 8));
  const indices = wide ? new Uint32Array(take(I * 4)) : new Uint16Array(take(I * 2));
  const mesh = { positions, normals, uvs, indices, submeshes, boundsMin, boundsMax };
  const why = poiMeshError(mesh);
  if (why) return { error: why };
  const [min, max] = meshBoxOf(positions);
  for (let k = 0; k < 3; k++) if (Math.abs(min[k] - boundsMin[k]) > 1e-3 || Math.abs(max[k] - boundsMax[k]) > 1e-3) return { error: 'bounds' };
  return { mesh };
}
