// @ts-check
// ═══════════════════════════════════════════════════════════════════
// POI-2 (2026-10-14) - A POI AS THE RENDERER DRAWS IT: PURE.
//
// The POI editor's document (poi/poiLaw.js) and meshes (poi/poiMesh.js) as the game stands them (bible/06-Systems/
// POI-Editor-Arc.md). Everything here is arithmetic over arrays - no GL, no DOM - so the host (scenes/poiHost.js) and
// the tests read a POI the same way:
//
//   - THE LOOK OF A MATERIAL (`materialLook`): what the texture it is drawn with depends on - its picture, its tint, its
//     alpha (opaque, a cutout at its cutoff, or blended), its sampler, its emission. Two materials that look alike share
//     one texture; the book (`createTextureBook`) gives each look its record in POI_TEXTURE_ARCHIVE.
//   - THE PICTURES BAKED (`bakeAlbedo`, `bakeEmission`): the renderer's mesh shader has no tint and cuts at a half
//     (render/realWindows.js RW_MAIN_CUTOUT), so the tint is multiplied in and a cutout's alpha thresholded at ITS cutoff
//     to all or nothing - exactly the cut the material asks for; a blend keeps its alpha times the tint's. The emission
//     map is the emissive picture times its colour (a colour alone, a plain map), clamped to one - the game draws in
//     low dynamic range. Both turned to the port's color32 order (row 0 the bottom: formats/color32Order.js).
//   - THE MODELS (`poiPartModels`): a part's mesh as `createMesh` takes it - UVs through the material's transform
//     (KHR_texture_transform's order) and turned to the renderer's convention (glTF's v down from the top; the uploaded
//     picture's row 0 its bottom: v' = 1 - v), a two-sided material's faces doubled back with their normals turned, and
//     the blended submeshes apart in a model of their own (drawn translucent, after the opaque world, back to front).
//   - THE MATRICES (`placeMatrix`, `partMatrix`): in the pixel's own frame - metres east (x) and north (z) of its
//     south-west corner, up (y) from the frame's zero - so a floating-origin recentre moves only the pixel's
//     translation, never a POI's matrix.
// ═══════════════════════════════════════════════════════════════════

import { applyTextureTransform } from './gltfImport.js';
import { multiply } from '../world/mat4.js';   // the port's one column-major product (a fresh matrix each call here)
import { mat4FromQuatPosScale } from '../world/quat.js';   // Unity's T * R(q) * S - outside the relay's bundle (test/relayversion.test.js)

/** The texture archive every POI picture is uploaded under - one record a look (render/meshAlpha.js keys the sampler
 *  apart). Numeric, so world art's mip chain is its own; clear of every archive the port draws (the classic 0-511 and
 *  its own 38001-38990, 56790, 112358-112395, 900000 - test/sd26_render.test.js ONE ARCHIVE, ONE OWNER). */
export const POI_TEXTURE_ARCHIVE = 600000;

const r255 = (v) => Math.round(Math.min(Math.max(Number(v) || 0, 0), 1) * 255);

/** A material's sampler as the renderer reads it (render/meshAlpha.js samplerParams). @param {any} m */
export const samplerOf = (m) => ({ wrapS: m.wrap?.[0] ?? 'repeat', wrapT: m.wrap?.[1] ?? 'repeat', filter: m.filter ?? 'linear' });

/**
 * The look of a material - a stable string of everything its drawn texture depends on, and nothing else (its UV
 * transform and two-sidedness are the mesh's, not the picture's). @param {any} m
 */
export function materialLook(m) {
  return JSON.stringify([
    m.texture ?? null, (m.color ?? [1, 1, 1, 1]).map(r255), m.alpha ?? 'opaque',
    m.alpha === 'cutout' ? r255(m.cutoff ?? 0.5) : null, samplerOf(m), m.emissive ?? null,
    (m.emissiveColor ?? [0, 0, 0]).map((c) => r255(Math.min(c, 1))),
  ]);
}

/** Does this material draw anything of its own light? @param {any} m */
export const emits = (m) => !!m.emissive || (m.emissiveColor ?? [0, 0, 0]).some((c) => c > 0);

/** A book of looks: the record each look's texture is uploaded under, the same record for the same look for the
 *  session's life. `recordOf(look)` and `size()`. */
export function createTextureBook() {
  const records = new Map();
  return {
    recordOf(/** @type {string} */ look) { if (!records.has(look)) records.set(look, records.size); return records.get(look); },
    size: () => records.size,
  };
}

/**
 * The albedo a material draws with, in color32 order - `{ width, height, colors }`. `image` the decoded picture (an RGBA
 * raster TOP row first, as a browser decodes one), or null for a material with no picture (a plain colour, one texel).
 * @param {{ width: number, height: number, data: Uint8Array | Uint8ClampedArray } | null} image @param {any} m
 */
export function bakeAlbedo(image, m) {
  const [cr, cg, cb, ca] = (m.color ?? [1, 1, 1, 1]).map((c) => Math.min(Math.max(c, 0), 1));
  const w = image?.width ?? 1, h = image?.height ?? 1;
  const src = image?.data ?? new Uint8Array([255, 255, 255, 255]);
  if (src.length !== w * h * 4) throw new Error(`poi albedo: ${w}x${h} carries ${src.length} bytes`);
  const out = new Uint8Array(w * h * 4);
  const cut = m.alpha === 'cutout' ? Math.min(Math.max(m.cutoff ?? 0.5, 0), 1) : null;
  for (let y = 0; y < h; y++) {
    const from = y * w * 4, to = (h - 1 - y) * w * 4;   // color32: row 0 the picture's bottom
    for (let x = 0; x < w * 4; x += 4) {
      const i = from + x, o = to + x;
      out[o] = Math.round(src[i] * cr);
      out[o + 1] = Math.round(src[i + 1] * cg);
      out[o + 2] = Math.round(src[i + 2] * cb);
      const a = (src[i + 3] / 255) * ca;
      // a cutout's own cut, made all or nothing so the renderer's cut at a half is the same cut; an opaque picture opaque
      out[o + 3] = m.alpha === 'blend' ? Math.round(a * 255) : cut !== null ? (a >= cut ? 255 : 0) : 255;
    }
  }
  return { width: w, height: h, colors: out };
}

/**
 * The emission map a material draws with, in color32 order - its emissive picture times its emissive colour, or that
 * colour alone; each channel clamped to one (the game's light is low dynamic range). Null for a material that emits
 * nothing. Sized as `size` (its albedo's), so both are sampled alike.
 * @param {{ width: number, height: number, data: Uint8Array | Uint8ClampedArray } | null} image @param {any} m
 * @param {{ width: number, height: number }} size
 */
export function bakeEmission(image, m, size) {
  if (!emits(m)) return null;
  const [er, eg, eb] = (m.emissiveColor ?? [0, 0, 0]).map((c) => Math.min(Math.max(c, 0), 1));
  const w = image?.width ?? size.width, h = image?.height ?? size.height;
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const from = y * w * 4, to = (h - 1 - y) * w * 4;
    for (let x = 0; x < w * 4; x += 4) {
      const i = from + x, o = to + x;
      out[o] = Math.round((image ? image.data[i] : 255) * er);
      out[o + 1] = Math.round((image ? image.data[i + 1] : 255) * eg);
      out[o + 2] = Math.round((image ? image.data[i + 2] : 255) * eb);
      out[o + 3] = 255;
    }
  }
  return { width: w, height: h, colors: out };
}

/**
 * A part's mesh as the renderer takes it: `{ opaque, translucent }`, each a createMesh model (or null) - the opaque and
 * cutout submeshes in one, the blended in the other - every submesh's texture the record its material's look was given.
 * `mirrored`: the part's matrix turns the mesh inside out (a negative determinant - a negative scale on one axis or
 * three), so every face is wound back to face the eye as drawn (the static batch's WOD5 law; drawMesh winds nothing).
 * @param {import('./poiMesh.js').PoiMesh} mesh @param {any[]} materials one a submesh @param {(m: any) => number} recordOf
 * @param {{ mirrored?: boolean }} [opts]
 */
export function poiPartModels(mesh, materials, recordOf, { mirrored = false } = {}) {
  const groups = { opaque: [], translucent: [] };
  mesh.submeshes.forEach((sm, i) => {
    const m = materials[i];
    (m?.alpha === 'blend' ? groups.translucent : groups.opaque).push(i);
  });
  const build = (list) => {
    if (!list.length) return null;
    const positions = [], normals = [], uvs = [], indices = [], subMeshes = [];
    for (const i of list) {
      const sm = mesh.submeshes[i];
      const m = materials[i];
      const tt = m.uv && (m.uv.rotation || m.uv.offset[0] || m.uv.offset[1] || m.uv.scale[0] !== 1 || m.uv.scale[1] !== 1) ? m.uv : null;
      // the submesh's own vertices, renumbered from nought - a vertex two submeshes share is copied to each
      const remap = new Map();
      const start = indices.length;
      const vert = (v, flip) => {
        const key = flip ? -1 - v : v;
        if (remap.has(key)) return remap.get(key);
        const at = positions.length / 3;
        positions.push(mesh.positions[v * 3], mesh.positions[v * 3 + 1], mesh.positions[v * 3 + 2]);
        const s = flip ? -1 : 1;
        normals.push(s * mesh.normals[v * 3] + 0, s * mesh.normals[v * 3 + 1] + 0, s * mesh.normals[v * 3 + 2] + 0);
        let u = mesh.uvs[v * 2], w = mesh.uvs[v * 2 + 1];
        if (tt) [u, w] = applyTextureTransform(tt, u, w);
        uvs.push(u, 1 - w);   // glTF's v (down from the top) to the renderer's (up from row 0, the picture's bottom)
        remap.set(key, at);
        return at;
      };
      // the front faces as stored (wound back where the part mirrors them), then - two-sided - every face again the other
      // way, on its own vertices with their normals turned (world/shipyardModel.js's way)
      const face = (k, back) => {
        const [a, b, c] = [mesh.indices[k], mesh.indices[k + 1], mesh.indices[k + 2]];
        if (back !== mirrored) indices.push(vert(a, back), vert(c, back), vert(b, back));
        else indices.push(vert(a, back), vert(b, back), vert(c, back));
      };
      for (let k = sm.start; k < sm.start + sm.count; k += 3) face(k, false);
      if (m.twoSided) for (let k = sm.start; k < sm.start + sm.count; k += 3) face(k, true);
      subMeshes.push({ textureArchive: POI_TEXTURE_ARCHIVE, textureRecord: recordOf(m), startIndex: start, primitiveCount: (indices.length - start) / 3 });
    }
    return { positions: Float32Array.from(positions), normals: Float32Array.from(normals), uvs: Float32Array.from(uvs), indices: Uint32Array.from(indices), subMeshes };
  };
  return { opaque: build(groups.opaque), translucent: build(groups.translucent) };
}

// ── MATRICES (column-major Float32Array(16), the renderer's) ─────────

/** The determinant of a column-major matrix's upper 3x3 - negative where it mirrors. */
export const det3 = (m) => m[0] * (m[5] * m[10] - m[9] * m[6]) - m[4] * (m[1] * m[10] - m[9] * m[2]) + m[8] * (m[1] * m[6] - m[5] * m[2]);
/** A point through a matrix. */
export const xform = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];

/**
 * The place's matrix in its pixel's frame - its spot (`x` east, `z` north from the pixel's south-west corner) at height
 * `y` (the ground's under it plus the document's `y` for 'snap', the document's own for 'absolute'), its turn and size.
 * @param {any} place the document's `place` @param {number} y the height it stands at, resolved by the host
 */
export const placeMatrix = (place, y) => mat4FromQuatPosScale(place.r, [place.x, y, place.z], [place.s, place.s, place.s]);

/** A part's matrix in its pixel's frame: the place's, then the part's own. @param {Float32Array} place @param {any} part */
export const partMatrix = (place, part) => multiply(place, mat4FromQuatPosScale(part.r, part.t, part.s));

/** The box a mesh's bounds make through a matrix - `{ min, max }`, its eight corners' bounds. */
export function boxThrough(m, min, max) {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < 8; i++) {
    const p = xform(m, [i & 1 ? max[0] : min[0], i & 2 ? max[1] : min[1], i & 4 ? max[2] : min[2]]);
    for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], p[k]); hi[k] = Math.max(hi[k], p[k]); }
  }
  return { min: lo, max: hi };
}

/** The document's lights in the pixel's frame: `{ at, range, color, intensity, flicker }` each - a light's spot through
 *  the place's matrix, its range scaled with the place. @param {any} doc @param {Float32Array} place */
export const lightsOf = (doc, place) => (doc.lights ?? []).map((l) => ({
  at: xform(place, l.t), range: l.radius * doc.place.s, color: l.color.map((c) => c * l.intensity), intensity: l.intensity, flicker: l.flicker,
}));
