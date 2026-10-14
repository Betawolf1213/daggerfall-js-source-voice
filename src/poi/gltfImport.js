// @ts-check
// ═══════════════════════════════════════════════════════════════════
// POI-4 (2026-10-14) - A glTF 2.0 MODEL, READ BY THE PORT ITSELF.
//
// Mac, asked which formats the POI editor imports: "glTF / GLB" (bible/06-Systems/POI-Editor-Arc.md). The port draws
// with no engine (Port-Doctrine: hand-rolled WebGL2), so the reader is its own, written to the Khronos specification
// (glTF 2.0, https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html) and pure - no DOM, no fetch - so the editor,
// the tests and a Node tool read a file the same way.
//
// WHAT IT READS: a .glb (the binary container: its JSON chunk and its BIN chunk) or a .gltf (JSON) with the files its
// URIs name (`files`: name -> bytes; data: URIs read in place). Buffers, buffer views (strided too), every accessor
// component type, normalized or not, and SPARSE accessors; the node tree (TRS or a matrix) from the scene's roots; mesh
// primitives in TRIANGLES, TRIANGLE_STRIP and TRIANGLE_FAN; morph targets at the mesh's default weights; materials
// (pbrMetallicRoughness's base colour, emissive with KHR_materials_emissive_strength, alpha mode and cutoff,
// double-sidedness), textures and samplers (wrap, filter), images embedded, in a buffer view or beside the file
// (PNG, JPEG, and WebP through EXT_texture_webp), and KHR_texture_transform.
//
// WHAT IT TURNS: everything into the game's model frame (poi/poiMesh.js) - glTF is right-handed with +Y up and its
// asset facing +Z; the game is Unity's left-handed frame, +Y up, +Z forward, so X is mirrored (glTFast's conversion:
// the model keeps facing forward) and every triangle's winding reversed to stay front-facing. Node transforms are baked
// into the vertices (a mirroring node reverses winding again); a primitive with no normals gets FLAT normals, as the
// specification requires of a client.
//
// WHAT IT REFUSES, SAYING WHY: a file that is not glTF 2.0, an extension it requires that this reader does not
// implement (Draco and meshopt compression - export without compression), a URI to a file not given, an accessor that
// reads past its buffer. And what it sets aside, saying so in `warnings`: points and lines, vertex colours (the game's
// renderer has no vertex colour - bake them into a texture), a second UV set where a material needs two, skins and
// animation (imported in the pose they were saved in), cameras and lights.
// ═══════════════════════════════════════════════════════════════════

const GLB_MAGIC = 0x46546c67;     // 'glTF'
const CHUNK_JSON = 0x4e4f534a;    // 'JSON'
const CHUNK_BIN = 0x004e4942;     // 'BIN\0'

/** The extensions this reader implements - a file that REQUIRES any other is refused by name. */
export const GLTF_SUPPORTED_EXTENSIONS = Object.freeze([
  'KHR_texture_transform', 'KHR_materials_emissive_strength', 'KHR_materials_unlit', 'EXT_texture_webp', 'KHR_mesh_quantization',
]);

const COMPONENT = {
  5120: { array: Int8Array, size: 1, norm: (v) => Math.max(v / 127, -1) },
  5121: { array: Uint8Array, size: 1, norm: (v) => v / 255 },
  5122: { array: Int16Array, size: 2, norm: (v) => Math.max(v / 32767, -1) },
  5123: { array: Uint16Array, size: 2, norm: (v) => v / 65535 },
  5125: { array: Uint32Array, size: 4, norm: (v) => v / 4294967295 },
  5126: { array: Float32Array, size: 4, norm: (v) => v },
};
const TYPE_SIZE = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };
const WRAP = { 33071: 'clamp', 33648: 'mirror', 10497: 'repeat' };

/** A file the importer refuses: `code` a stable word, `args` what it turns on - the editor says it in the builder's
 *  language (poi/poiText.js); the message is the code, for a log. */
class GltfError extends Error {
  /** @param {string} code @param {Record<string, any>} [args] */
  constructor(code, args = {}) { super(code); this.code = code; this.args = args; }
}
/** @param {string} code @param {Record<string, any>} [args] @returns {never} */
const fail = (code, args = {}) => { throw new GltfError(code, args); };

const B64 = new Int16Array(128).fill(-1);
for (let i = 0; i < 64; i++) B64['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.charCodeAt(i)] = i;
B64['-'.charCodeAt(0)] = 62; B64['_'.charCodeAt(0)] = 63;   // the URL-safe alphabet read too
/** Base64 (RFC 4648, standard or URL-safe; padding and whitespace ignored) as bytes - the reader's own, so it is the
 *  same in a browser, a Worker and Node. @param {string} text */
function base64Bytes(text) {
  const out = new Uint8Array(Math.floor(text.length * 3 / 4) + 3);
  let n = 0, acc = 0, bits = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    const v = c < 128 ? B64[c] : -1;
    if (v < 0) { if (text[i] === '=' || /\s/.test(text[i])) continue; fail('data-uri'); }
    acc = (acc << 6) | v; bits += 6;
    if (bits >= 8) { bits -= 8; out[n++] = (acc >> bits) & 255; }
  }
  return out.slice(0, n);
}

/** A data: URI's bytes. @param {string} uri */
function dataUriBytes(uri) {
  const m = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(uri);
  if (!m) fail('data-uri');
  if (m[2]) return { bytes: base64Bytes(m[3]), mime: m[1] || null };
  return { bytes: new TextEncoder().encode(decodeURIComponent(m[3])), mime: m[1] || null };
}

/** A file named by a URI, from the files given beside the .gltf - by its path, its decoded path, or its bare name. */
function fileOf(uri, files) {
  const tries = [uri, (() => { try { return decodeURIComponent(uri); } catch { return uri; } })()];
  for (const t of [...tries]) tries.push(t.split('/').pop());
  for (const t of tries) if (files.has(t)) return files.get(t);
  return fail('file-missing', { uri });
}

/** The JSON and the binary chunk of a .glb, or the JSON of a .gltf. @param {Uint8Array} bytes */
function containerOf(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.byteLength >= 12 && dv.getUint32(0, true) === GLB_MAGIC) {
    if (dv.getUint32(4, true) !== 2) fail('not-gltf2');
    const total = Math.min(dv.getUint32(8, true), bytes.byteLength);
    let at = 12, json = null, bin = null;
    while (at + 8 <= total) {
      const len = dv.getUint32(at, true), type = dv.getUint32(at + 4, true);
      const body = bytes.subarray(at + 8, at + 8 + len);
      if (body.byteLength !== len) fail('glb-chunk');
      if (type === CHUNK_JSON && !json) json = JSON.parse(new TextDecoder().decode(body));
      else if (type === CHUNK_BIN && !bin) bin = body;
      at += 8 + len + ((4 - (len % 4)) % 4);
    }
    if (!json) fail('glb-no-json');
    return { json, bin };
  }
  let json;
  try { json = JSON.parse(new TextDecoder().decode(bytes)); } catch { fail('not-gltf'); }
  return { json, bin: null };
}

/**
 * Read a glTF 2.0 model. `input` is the .glb or .gltf's bytes; `files` the files beside it (a .gltf's .bin and images),
 * by name. Answers the model in glTF's own terms - its scene's mesh instances with their world matrices, its materials,
 * its images - and the warnings; `bakeGltf` turns it into POI parts.
 * @param {Uint8Array} input @param {{ files?: Map<string, Uint8Array> }} [opts]
 */
export function readGltf(input, { files = new Map() } = {}) {
  /** @type {{ code: string, [arg: string]: any }[]} */
  const warnings = [];
  // each said once - a code and its arguments together
  const warn = (code, args = {}) => { const w = { code, ...args }; if (!warnings.some((x) => JSON.stringify(x) === JSON.stringify(w))) warnings.push(w); };
  const { json: g, bin } = containerOf(input);
  if (!g || typeof g !== 'object' || !g.asset || !String(g.asset.version ?? '').startsWith('2.')) fail('not-gltf2');
  for (const ext of g.extensionsRequired ?? []) {
    if (!GLTF_SUPPORTED_EXTENSIONS.includes(ext)) {
      if (ext === 'KHR_draco_mesh_compression' || ext === 'EXT_meshopt_compression') fail('compressed', { ext });
      fail('extension', { ext });
    }
  }

  // ── BUFFERS AND ACCESSORS ──
  const buffers = (g.buffers ?? []).map((b, i) => {
    if (b.uri === undefined) {
      if (!bin) fail('glb-no-bin', { buffer: i });
      return bin;
    }
    return b.uri.startsWith('data:') ? dataUriBytes(b.uri).bytes : fileOf(b.uri, files);
  });
  const viewBytes = (vi) => {
    const v = g.bufferViews?.[vi] ?? fail('missing', { what: 'bufferView', index: vi });
    const buf = buffers[v.buffer] ?? fail('missing', { what: 'buffer', index: v.buffer });
    const off = v.byteOffset ?? 0;
    if (off + v.byteLength > buf.byteLength) fail('past-end', { what: 'bufferView', index: vi });
    return { bytes: buf.subarray(off, off + v.byteLength), stride: v.byteStride ?? 0 };
  };
  const accCache = new Map();
  /** An accessor read out as plain numbers - `{ data: Float64Array | number[], n, size }`, normalized when it says so. */
  const accessor = (ai, { asFloat = true } = {}) => {
    const key = `${ai}:${asFloat}`;
    if (accCache.has(key)) return accCache.get(key);
    const a = g.accessors?.[ai] ?? fail('missing', { what: 'accessor', index: ai });
    const comp = COMPONENT[a.componentType] ?? fail('accessor-type', { index: ai });
    const size = TYPE_SIZE[a.type] ?? fail('accessor-type', { index: ai });
    const n = a.count;
    const out = new Float64Array(n * size);
    const conv = a.normalized && asFloat ? comp.norm : (v) => v;
    if (a.bufferView !== undefined) {
      const { bytes, stride } = viewBytes(a.bufferView);
      const elem = comp.size * size;
      // a matrix of bytes or shorts pads its columns to four bytes (the specification's data alignment) - no attribute a
      // mesh is drawn from is one, and skins are not read, so such an accessor is refused rather than read askew
      if ((a.type === 'MAT2' || a.type === 'MAT3') && comp.size < 4) fail('accessor-type', { index: ai });
      const step = stride || elem;
      const base = a.byteOffset ?? 0;
      const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const read = { 1: (o) => (comp.array === Int8Array ? dv.getInt8(o) : dv.getUint8(o)), 2: (o) => (comp.array === Int16Array ? dv.getInt16(o, true) : dv.getUint16(o, true)), 4: (o) => (comp.array === Float32Array ? dv.getFloat32(o, true) : dv.getUint32(o, true)) }[comp.size];
      if (n > 0 && base + (n - 1) * step + elem > bytes.byteLength) fail('past-end', { what: 'accessor', index: ai });
      for (let i = 0; i < n; i++) {
        const o = base + i * step;
        for (let k = 0; k < size; k++) out[i * size + k] = conv(read(o + k * comp.size));
      }
    }
    if (a.sparse) {
      const sp = a.sparse;
      const idx = sp.indices, val = sp.values;
      const iComp = COMPONENT[idx.componentType] ?? fail('accessor-type', { index: ai });
      const iv = viewBytes(idx.bufferView), vv = viewBytes(val.bufferView);
      const idv = new DataView(iv.bytes.buffer, iv.bytes.byteOffset, iv.bytes.byteLength);
      const vdv = new DataView(vv.bytes.buffer, vv.bytes.byteOffset, vv.bytes.byteLength);
      const readI = (o) => (iComp.size === 1 ? idv.getUint8(o) : iComp.size === 2 ? idv.getUint16(o, true) : idv.getUint32(o, true));
      const readV = (o) => ({ 1: () => (comp.array === Int8Array ? vdv.getInt8(o) : vdv.getUint8(o)), 2: () => (comp.array === Int16Array ? vdv.getInt16(o, true) : vdv.getUint16(o, true)), 4: () => (comp.array === Float32Array ? vdv.getFloat32(o, true) : vdv.getUint32(o, true)) }[comp.size]());
      for (let s = 0; s < sp.count; s++) {
        const target = readI((idx.byteOffset ?? 0) + s * iComp.size);
        if (target >= n) fail('past-end', { what: 'accessor', index: ai });
        for (let k = 0; k < size; k++) out[target * size + k] = conv(readV((val.byteOffset ?? 0) + (s * size + k) * comp.size));
      }
    }
    const r = { data: out, n, size };
    accCache.set(key, r);
    return r;
  };

  // ── IMAGES, TEXTURES, MATERIALS ──
  const images = (g.images ?? []).map((im, i) => {
    let bytes, mime = im.mimeType ?? null;
    if (im.bufferView !== undefined) bytes = viewBytes(im.bufferView).bytes.slice();
    else if (typeof im.uri === 'string' && im.uri.startsWith('data:')) { const d = dataUriBytes(im.uri); bytes = d.bytes; mime = mime ?? d.mime; }
    else if (typeof im.uri === 'string') bytes = fileOf(im.uri, files).slice();
    else fail('missing', { what: 'image', index: i });
    return { name: im.name ?? `image${i}`, bytes, mime };
  });
  /** A texture reference as the POI material keeps it: the image, its sampler, its UV set and its transform. */
  const texRef = (ref, what) => {
    if (!ref) return null;
    const tex = g.textures?.[ref.index] ?? fail('missing', { what: 'texture', index: ref.index });
    const source = tex.extensions?.EXT_texture_webp?.source ?? tex.source;
    if (source === undefined) { warn('image-format', { material: what }); return null; }
    const sampler = tex.sampler !== undefined ? g.samplers?.[tex.sampler] ?? {} : {};
    const tt = ref.extensions?.KHR_texture_transform;
    return {
      image: source,
      texCoord: tt?.texCoord ?? ref.texCoord ?? 0,
      wrap: [WRAP[sampler.wrapS] ?? 'repeat', WRAP[sampler.wrapT] ?? 'repeat'],
      filter: sampler.magFilter === 9728 ? 'nearest' : 'linear',
      transform: tt ? { offset: tt.offset ?? [0, 0], rotation: tt.rotation ?? 0, scale: tt.scale ?? [1, 1] } : null,
    };
  };
  const materials = (g.materials ?? []).map((m, i) => {
    const pbr = m.pbrMetallicRoughness ?? {};
    const strength = m.extensions?.KHR_materials_emissive_strength?.emissiveStrength ?? 1;
    if (m.normalTexture || m.occlusionTexture || pbr.metallicRoughnessTexture) warn('maps');
    return {
      name: m.name ?? `material${i}`,
      color: [...(pbr.baseColorFactor ?? [1, 1, 1, 1])],
      base: texRef(pbr.baseColorTexture, m.name ?? String(i)),
      emissive: texRef(m.emissiveTexture, m.name ?? String(i)),
      emissiveColor: (m.emissiveFactor ?? [0, 0, 0]).map((c) => c * strength),
      alpha: m.alphaMode === 'MASK' ? 'cutout' : m.alphaMode === 'BLEND' ? 'blend' : 'opaque',
      cutoff: m.alphaCutoff ?? 0.5,
      twoSided: m.doubleSided === true,
    };
  });

  // ── THE SCENE: every mesh instance with its world matrix ──
  const sceneIndex = g.scene ?? 0;
  const roots = g.scenes?.[sceneIndex]?.nodes ?? (g.nodes ?? []).map((_, i) => i).filter((i) => !(g.nodes ?? []).some((n) => (n.children ?? []).includes(i)));
  const instances = [];
  const seen = new Set();
  const walk = (ni, parent) => {
    if (seen.has(ni)) fail('node-cycle', { index: ni });
    seen.add(ni);
    const node = g.nodes?.[ni] ?? fail('missing', { what: 'node', index: ni });
    const local = node.matrix ? Float64Array.from(node.matrix) : trs(node.translation ?? [0, 0, 0], node.rotation ?? [0, 0, 0, 1], node.scale ?? [1, 1, 1]);
    const world = mul(parent, local);
    if (node.skin !== undefined) warn('skin');
    if (node.camera !== undefined || node.extensions?.KHR_lights_punctual) warn('camera-light');
    if (node.mesh !== undefined) instances.push({ name: node.name ?? g.meshes?.[node.mesh]?.name ?? `node${ni}`, mesh: node.mesh, matrix: node.skin !== undefined ? identity() : world, weights: node.weights ?? null });
    for (const c of node.children ?? []) walk(c, world);
    seen.delete(ni);
  };
  for (const r of roots) walk(r, identity());
  if ((g.animations ?? []).length) warn('animation');

  // ── PRIMITIVES, read once per mesh ──
  const meshes = (g.meshes ?? []).map((mesh, mi) => ({
    name: mesh.name ?? `mesh${mi}`,
    weights: mesh.weights ?? null,
    primitives: (mesh.primitives ?? []).map((p) => {
      const mode = p.mode ?? 4;
      if (mode < 4) { warn('points-lines'); return null; }
      if (p.attributes?.POSITION === undefined) { warn('no-positions'); return null; }
      if (p.attributes.COLOR_0 !== undefined) warn('vertex-colours');
      const pos = accessor(p.attributes.POSITION);
      const nrm = p.attributes.NORMAL !== undefined ? accessor(p.attributes.NORMAL) : null;
      const mat = p.material !== undefined ? materials[p.material] : null;
      const set = mat?.base?.texCoord ?? 0;
      if (mat?.emissive && mat.base && mat.emissive.texCoord !== mat.base.texCoord) warn('emission-uv-set', { material: mat.name });
      const uvAttr = p.attributes[`TEXCOORD_${set}`];
      const uv = uvAttr !== undefined ? accessor(uvAttr) : null;
      if (mat?.base && !uv) warn('no-uvs', { material: mat.name });
      let idx = p.indices !== undefined ? Array.from(accessor(p.indices, { asFloat: false }).data) : Array.from({ length: pos.n }, (_, i) => i);
      if (mode === 5) idx = stripToList(idx);
      else if (mode === 6) idx = fanToList(idx);
      if (idx.length % 3) idx = idx.slice(0, idx.length - (idx.length % 3));
      const targets = (p.targets ?? []).map((t) => ({ pos: t.POSITION !== undefined ? accessor(t.POSITION) : null, nrm: t.NORMAL !== undefined ? accessor(t.NORMAL) : null }));
      return { pos, nrm, uv, idx, material: p.material ?? -1, targets };
    }).filter(Boolean),
  }));

  return { name: g.asset?.extras?.title ?? g.scenes?.[sceneIndex]?.name ?? 'model', instances, meshes, materials, images, warnings, generator: g.asset.generator ?? null };
}

/**
 * The model as POI parts: `whole` - every instance baked into ONE mesh (a submesh per material used, in first-use order) -
 * or `nodes` - a part per mesh instance, each in its own node's frame. Every part's mesh in the game's frame (poiMesh.js),
 * its UVs with the base texture's KHR_texture_transform baked in, and the glTF material behind each submesh.
 * @param {ReturnType<typeof readGltf>} model @param {{ split?: 'whole' | 'nodes' }} [opts]
 */
export function bakeGltf(model, { split = 'whole' } = {}) {
  const groups = split === 'nodes' ? model.instances.map((inst) => [inst]) : [model.instances];
  const parts = [];
  for (const insts of groups) {
    const byMaterial = new Map();   // material index -> { positions, normals, uvs, indices }
    const order = [];
    for (const inst of insts) {
      const mesh = model.meshes[inst.mesh];
      if (!mesh) continue;
      // `nodes`: the node's turn, scale (and any shear its tree makes) baked in, its translation the part's position -
      // exact whatever the tree, the part's pivot the node's origin; `whole`: the whole world matrix baked
      const M = split === 'nodes' ? linearOf(inst.matrix) : inst.matrix;
      const mirrored = det3(M) < 0;
      const N = normalMatrix(M);
      const weights = inst.weights ?? mesh.weights ?? null;
      for (const prim of mesh.primitives) {
        if (!byMaterial.has(prim.material)) { byMaterial.set(prim.material, { positions: [], normals: [], uvs: [], indices: [] }); order.push(prim.material); }
        const out = byMaterial.get(prim.material);
        const mat = prim.material >= 0 ? model.materials[prim.material] : null;
        const tt = mat?.base?.transform ?? null;
        // flat normals when the file gives none: every triangle its own three vertices
        const flat = !prim.nrm;
        const verts = flat ? prim.idx : Array.from({ length: prim.pos.n }, (_, i) => i);
        const base = out.positions.length / 3;
        for (const vi of verts) {
          let p = [prim.pos.data[vi * 3], prim.pos.data[vi * 3 + 1], prim.pos.data[vi * 3 + 2]];
          let n = prim.nrm ? [prim.nrm.data[vi * 3], prim.nrm.data[vi * 3 + 1], prim.nrm.data[vi * 3 + 2]] : [0, 0, 0];
          if (weights) prim.targets.forEach((t, k) => {
            const w = weights[k] ?? 0;
            if (!w) return;
            if (t.pos) p = p.map((c, j) => c + w * t.pos.data[vi * 3 + j]);
            if (t.nrm) n = n.map((c, j) => c + w * t.nrm.data[vi * 3 + j]);
          });
          p = xform(M, p);
          // the game's frame: X mirrored (a mirrored zero written as zero, never -0)
          out.positions.push(-p[0] + 0, p[1], p[2]);
          if (!flat) {
            n = norm3(xformDir(N, n));
            out.normals.push(-n[0] + 0, n[1], n[2]);
          }
          let u = prim.uv ? prim.uv.data[vi * 2] : 0, v = prim.uv ? prim.uv.data[vi * 2 + 1] : 0;
          if (tt) [u, v] = applyTextureTransform(tt, u, v);
          out.uvs.push(u, v);
        }
        // winding: reversed for the mirrored X, and again for a mirroring node
        const flip = !mirrored;
        for (let t = 0; t + 2 < prim.idx.length; t += 3) {
          const [a, b, c] = flat ? [t, t + 1, t + 2] : [prim.idx[t], prim.idx[t + 1], prim.idx[t + 2]];
          if (flip) out.indices.push(base + a, base + c, base + b);
          else out.indices.push(base + a, base + b, base + c);
        }
        if (flat) {
          // the face normal of each triangle from its corners in the order they are EMITTED (the game's front order:
          // clockwise on screen, the renderer's gl.frontFace(CW)) - (E1 - E0) x (E2 - E0) points out of the front, in
          // glTF's frame for its own order and in the game's for the mirrored, re-wound one alike
          for (let t = 0; t + 2 < prim.idx.length; t += 3) {
            const at = (k) => [out.positions[(base + k) * 3], out.positions[(base + k) * 3 + 1], out.positions[(base + k) * 3 + 2]];
            const e0 = at(t), e1 = at(flip ? t + 2 : t + 1), e2 = at(flip ? t + 1 : t + 2);
            const n = norm3(cross(sub(e1, e0), sub(e2, e0)));
            out.normals.push(...n, ...n, ...n);
          }
        }
      }
    }
    if (!order.length) continue;
    const positions = [], normals = [], uvs = [], indices = [], submeshes = [], materials = [];
    for (const mi of order) {
      const g = byMaterial.get(mi);
      const off = positions.length / 3;
      positions.push(...g.positions); normals.push(...g.normals); uvs.push(...g.uvs);
      submeshes.push({ start: indices.length, count: g.indices.length });
      for (const i of g.indices) indices.push(i + off);
      materials.push(mi);
    }
    const V = positions.length / 3;
    parts.push({
      name: split === 'nodes' ? insts[0].name : model.name,
      // where the part stands from the model's origin, in the game's frame (X mirrored)
      position: split === 'nodes' ? [-insts[0].matrix[12] + 0, insts[0].matrix[13], insts[0].matrix[14]] : [0, 0, 0],
      mesh: {
        positions: Float32Array.from(positions), normals: Float32Array.from(normals), uvs: Float32Array.from(uvs),
        indices: V > 65535 ? Uint32Array.from(indices) : Uint16Array.from(indices), submeshes,
      },
      materials,
    });
  }
  return parts;
}

/** A glTF material as a POI material (poiLaw.js) - its texture fields the images' indices until they are uploaded. */
export function poiMaterialOf(m) {
  return {
    texture: m?.base ? m.base.image : null,
    color: (m?.color ?? [1, 1, 1, 1]).map((c) => clamp01(c)),
    emissive: m?.emissive ? m.emissive.image : null,
    emissiveColor: (m?.emissiveColor ?? [0, 0, 0]).map((c) => Math.min(Math.max(c, 0), 16)),
    alpha: m?.alpha ?? 'opaque',
    cutoff: clamp01(m?.cutoff ?? 0.5),
    twoSided: !!m?.twoSided,
    wrap: m?.base?.wrap ?? ['repeat', 'repeat'],
    filter: m?.base?.filter ?? 'linear',
    uv: { offset: [0, 0], scale: [1, 1], rotation: 0 },
  };
}

export { GltfError };

// ── MATHS (column-major 4x4, as glTF writes matrices) ──────────────

function identity() { const m = new Float64Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; }
function trs(t, r, s) {
  const [x, y, z, w] = r;
  const m = new Float64Array(16);
  m[0] = (1 - 2 * (y * y + z * z)) * s[0]; m[1] = 2 * (x * y + z * w) * s[0]; m[2] = 2 * (x * z - y * w) * s[0];
  m[4] = 2 * (x * y - z * w) * s[1]; m[5] = (1 - 2 * (x * x + z * z)) * s[1]; m[6] = 2 * (y * z + x * w) * s[1];
  m[8] = 2 * (x * z + y * w) * s[2]; m[9] = 2 * (y * z - x * w) * s[2]; m[10] = (1 - 2 * (x * x + y * y)) * s[2];
  m[12] = t[0]; m[13] = t[1]; m[14] = t[2]; m[15] = 1;
  return m;
}
function mul(a, b) {
  const o = new Float64Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let v = 0;
    for (let k = 0; k < 4; k++) v += a[k * 4 + r] * b[c * 4 + k];
    o[c * 4 + r] = v;
  }
  return o;
}
function xform(m, p) {
  return [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
}
function xformDir(m3, d) { return [m3[0] * d[0] + m3[3] * d[1] + m3[6] * d[2], m3[1] * d[0] + m3[4] * d[1] + m3[7] * d[2], m3[2] * d[0] + m3[5] * d[1] + m3[8] * d[2]]; }
function det3(m) {
  return m[0] * (m[5] * m[10] - m[9] * m[6]) - m[4] * (m[1] * m[10] - m[9] * m[2]) + m[8] * (m[1] * m[6] - m[5] * m[2]);
}
/** The inverse-transpose of the matrix's 3x3 (column-major 3x3) - how a normal is carried through a scale. */
function normalMatrix(m) {
  const a = m[0], b = m[4], c = m[8], d = m[1], e = m[5], f = m[9], g = m[2], h = m[6], i = m[10];
  // the cofactors C[row][col] of M = [[a, b, c], [d, e, f], [g, h, i]] (row-major)
  const c00 = e * i - f * h, c01 = -(d * i - f * g), c02 = d * h - e * g;
  const c10 = -(b * i - c * h), c11 = a * i - c * g, c12 = -(a * h - b * g);
  const c20 = b * f - c * e, c21 = -(a * f - c * d), c22 = a * e - b * d;
  const det = a * c00 + b * c01 + c * c02 || 1;
  // the inverse-transpose is the cofactor matrix over the determinant - written column-major, as xformDir reads it
  return [c00 / det, c10 / det, c20 / det, c01 / det, c11 / det, c21 / det, c02 / det, c12 / det, c22 / det];
}
/** A matrix without its translation. */
function linearOf(m) { const o = Float64Array.from(m); o[12] = o[13] = o[14] = 0; return o; }
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function norm3(v) { const l = Math.hypot(v[0], v[1], v[2]); return l > 0 ? [v[0] / l, v[1] / l, v[2] / l] : [0, 1, 0]; }
const clamp01 = (v) => Math.min(Math.max(Number(v) || 0, 0), 1);

/** KHR_texture_transform: uv' = T * R * S * uv (the extension's own order). */
export function applyTextureTransform(tt, u, v) {
  const [sx, sy] = tt.scale ?? [1, 1], r = tt.rotation ?? 0, [ox, oy] = tt.offset ?? [0, 0];
  const c = Math.cos(r), s = Math.sin(r);
  const x = u * sx, y = v * sy;
  return [c * x + s * y + ox, -s * x + c * y + oy];
}

/** TRIANGLE_STRIP as a list, every second triangle wound back. */
function stripToList(idx) {
  const out = [];
  for (let i = 0; i + 2 < idx.length; i++) {
    if (i % 2 === 0) out.push(idx[i], idx[i + 1], idx[i + 2]);
    else out.push(idx[i + 1], idx[i], idx[i + 2]);
  }
  return out;
}
/** TRIANGLE_FAN as a list, every triangle round the first vertex. */
function fanToList(idx) {
  const out = [];
  for (let i = 1; i + 1 < idx.length; i++) out.push(idx[0], idx[i], idx[i + 1]);
  return out;
}
