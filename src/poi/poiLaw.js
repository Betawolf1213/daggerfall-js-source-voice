// @ts-check
// ═══════════════════════════════════════════════════════════════════
// POI-1 (2026-10-14) - WHAT A POI IS: THE DOCUMENT THE EDITOR WRITES, THE REALM APPROVES AND THE GAME STANDS.
//
// Mac: "POI Tool (General Map Editor) ... the creation of POI's using models, ... import models, texture, UV map, and
// even placement onto our actual map ... a tool my developers can use without having to access the codebase"; asked who
// publishes, "I need to be able to approve changes" (bible/06-Systems/POI-Editor-Arc.md).
//
// ONE LAW, THREE READERS. The editor checks a draft against it before it is saved, the account service refuses anything
// it does not answer (server-account/src/poi.js), and the game stands only what it answers (poi/poiRuntime.js) - so a
// POI the editor shows is the POI the realm stores is the POI every player sees.
//
// A POI is a place on the world map (`place`: a map pixel, a spot in it, how it meets the ground, a turn and a size) and
// what stands there: PARTS - each a mesh (by the sha256 its bytes are stored under, poi/poiMesh.js) with a transform
// relative to the place and a MATERIAL per submesh - and lights, and a marker on the map. Every asset is named by its
// hash, so a document is small, two POIs share a model for free, and an approved POI can never change under its approval.
//
// THE FRAME: a map pixel is TERRAIN_SIZE (819.2 m) square; `place.x` runs east and `place.z` north from its south-west
// corner (world/streamingWorld.js pixelTranslation: a pixel's origin, +x east, +z north). Heights in metres - `ground:
// 'snap'` stands the place `y` above the ground beneath it, `ground: 'absolute'` at `y` itself. Rotations are unit
// quaternions [x, y, z, w] in the game's frame (Unity's left-handed, +Y up).
// ═══════════════════════════════════════════════════════════════════

export const POI_DOC_VERSION = 1;
/** A pixel's side in metres (world/terrainSampler.js TERRAIN_SIZE, held here so the law stands alone in the service). */
export const POI_PIXEL_M = 819.2;
export const POI_ID_RE = /^poi-[0-9a-f]{12}$/;
export const POI_SHA_RE = /^[0-9a-f]{64}$/;
export const POI_PART_KEY_RE = /^[a-z0-9][a-z0-9_-]{0,31}$/;

export const POI_LIMITS = Object.freeze({
  name: 64,
  about: 2000,
  tags: 8,
  tag: 24,
  parts: 128,
  lights: 32,
  materials: 64,          // a part's - its mesh's submeshes, poiMesh.js POI_MESH_LIMITS.submeshes
  label: 48,
  docBytes: 96 * 1024,    // the document as JSON
  note: 500,              // a review's word
});

/** The world map's pixels a POI may stand on - MAPS.BSA's 1000 x 500 (formats/woodsFile.js MAP_WIDTH/HEIGHT). */
export const POI_MAP = Object.freeze({ w: 1000, h: 500 });

export const POI_ALPHA = Object.freeze(['opaque', 'cutout', 'blend']);
export const POI_WRAP = Object.freeze(['repeat', 'clamp', 'mirror']);
export const POI_FILTER = Object.freeze(['linear', 'nearest']);
export const POI_COLLIDE = Object.freeze(['mesh', 'none']);
export const POI_GROUND = Object.freeze(['snap', 'absolute']);

/** A fresh POI id - `rand` fills a Uint8Array (crypto.getRandomValues). @param {(b: Uint8Array) => Uint8Array} rand */
export const mintPoiId = (rand) => `poi-${[...rand(new Uint8Array(6))].map((b) => b.toString(16).padStart(2, '0')).join('')}`;

const finite = (v) => typeof v === 'number' && Number.isFinite(v);
const vec = (v, n) => Array.isArray(v) && v.length === n && v.every(finite);
// printable text: no control characters, trimmed, bounded
const textOk = (s, max, min = 0) => typeof s === 'string' && s.length >= min && s.length <= max && s === s.trim() && !/[\u0000-\u001f\u007f]/.test(s);
const enumOk = (v, list) => typeof v === 'string' && list.includes(v);

/** A quaternion as the law keeps it: four finite numbers whose length is 1 within a thousandth - renormalised - or null. */
export function unitQuat(q) {
  if (!vec(q, 4)) return null;
  const n = Math.hypot(q[0], q[1], q[2], q[3]);
  if (!(Math.abs(n - 1) <= 1e-3)) return null;
  return q.map((c) => c / n);
}

/** The material a submesh wears when its document names none of its own - white, opaque, one-sided, its UVs as made. */
export const DEFAULT_MATERIAL = Object.freeze({
  texture: null, color: Object.freeze([1, 1, 1, 1]), emissive: null, emissiveColor: Object.freeze([0, 0, 0]),
  alpha: 'opaque', cutoff: 0.5, twoSided: false, wrap: Object.freeze(['repeat', 'repeat']), filter: 'linear',
  uv: Object.freeze({ offset: Object.freeze([0, 0]), scale: Object.freeze([1, 1]), rotation: 0 }),
});

/**
 * @typedef {{ path: string, code: string, [arg: string]: any }} PoiProblem
 * A way a document falls short: WHERE (`path`, as the document spells it - `parts[2].materials[0].alpha`) and WHAT (`code`,
 * a stable word - `alpha`, `quat`, `unknown`), with any number it turns on. Never a sentence: the editor says it, in the
 * builder's language (poi/poiText.js), and the service returns the same objects verbatim - one law, every reader.
 */

/** A problem as one line - `path: code` - for a log or a test. @param {PoiProblem} p */
export const problemLine = (p) => `${p.path}: ${p.code}`;

/**
 * Every way `raw` falls short of a POI document - empty for a good one. The editor shows them all; the service refuses
 * on any. Only the document's own shape: whether its assets exist is poiAssetProblems'.
 * @param {any} raw @returns {PoiProblem[]}
 */
export function poiDocProblems(raw) {
  /** @type {PoiProblem[]} */
  const out = [];
  const say = (path, code, args = {}) => { if (out.length < 200) out.push({ path, code, ...args }); };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [{ path: 'doc', code: 'not-object' }];
  let bytes = 0;
  try { bytes = new TextEncoder().encode(JSON.stringify(raw)).byteLength; } catch { return [{ path: 'doc', code: 'not-json' }]; }
  if (bytes > POI_LIMITS.docBytes) say('doc', 'too-large', { bytes, max: POI_LIMITS.docBytes });
  if (raw.v !== POI_DOC_VERSION) say('v', 'version', { want: POI_DOC_VERSION });
  if (typeof raw.id !== 'string' || !POI_ID_RE.test(raw.id)) say('id', 'id');
  if (!textOk(raw.name, POI_LIMITS.name, 1)) say('name', 'name', { max: POI_LIMITS.name });
  // the one field written as prose: lines allowed, nothing else below a space
  if (raw.about !== undefined && !(typeof raw.about === 'string' && raw.about.length <= POI_LIMITS.about && !/[\u0000-\u0009\u000b-\u001f\u007f]/.test(raw.about))) say('about', 'about', { max: POI_LIMITS.about });
  if (raw.tags !== undefined) {
    if (!Array.isArray(raw.tags) || raw.tags.length > POI_LIMITS.tags) say('tags', 'tags', { max: POI_LIMITS.tags });
    else raw.tags.forEach((t, i) => { if (!textOk(t, POI_LIMITS.tag, 1)) say(`tags[${i}]`, 'tag', { max: POI_LIMITS.tag }); });
  }

  const p = raw.place;
  if (!p || typeof p !== 'object') say('place', 'missing');
  else {
    if (!Number.isInteger(p.px) || p.px < 0 || p.px >= POI_MAP.w) say('place.px', 'px', { max: POI_MAP.w - 1 });
    if (!Number.isInteger(p.py) || p.py < 0 || p.py >= POI_MAP.h) say('place.py', 'py', { max: POI_MAP.h - 1 });
    if (!finite(p.x) || p.x < 0 || p.x >= POI_PIXEL_M) say('place.x', 'in-pixel', { max: POI_PIXEL_M });
    if (!finite(p.z) || p.z < 0 || p.z >= POI_PIXEL_M) say('place.z', 'in-pixel', { max: POI_PIXEL_M });
    if (!finite(p.y) || Math.abs(p.y) > 4000) say('place.y', 'height', { max: 4000 });
    if (!enumOk(p.ground, POI_GROUND)) say('place.ground', 'ground');
    if (!unitQuat(p.r)) say('place.r', 'quat');
    if (!finite(p.s) || p.s < 0.01 || p.s > 100) say('place.s', 'size', { min: 0.01, max: 100 });
  }

  if (!Array.isArray(raw.parts) || !raw.parts.length) say('parts', 'parts-none');
  else if (raw.parts.length > POI_LIMITS.parts) say('parts', 'parts-many', { max: POI_LIMITS.parts });
  else {
    const keys = new Set();
    raw.parts.forEach((part, i) => {
      const at = `parts[${i}]`;
      if (!part || typeof part !== 'object') { say(at, 'not-object'); return; }
      if (typeof part.key !== 'string' || !POI_PART_KEY_RE.test(part.key)) say(`${at}.key`, 'key');
      else if (keys.has(part.key)) say(`${at}.key`, 'key-twice', { key: part.key });
      else keys.add(part.key);
      if (part.name !== undefined && !textOk(part.name, POI_LIMITS.name)) say(`${at}.name`, 'part-name', { max: POI_LIMITS.name });
      if (typeof part.mesh !== 'string' || !POI_SHA_RE.test(part.mesh)) say(`${at}.mesh`, 'mesh-ref');
      if (!vec(part.t, 3) || part.t.some((c) => Math.abs(c) > 2000)) say(`${at}.t`, 'offset', { max: 2000 });
      if (!unitQuat(part.r)) say(`${at}.r`, 'quat');
      if (!vec(part.s, 3) || part.s.some((c) => Math.abs(c) < 0.001 || Math.abs(c) > 1000)) say(`${at}.s`, 'scale', { min: 0.001, max: 1000 });
      if (!enumOk(part.collide, POI_COLLIDE)) say(`${at}.collide`, 'collide');
      if (typeof part.shadow !== 'boolean') say(`${at}.shadow`, 'bool');
      if (!Array.isArray(part.materials) || !part.materials.length || part.materials.length > POI_LIMITS.materials) say(`${at}.materials`, 'materials', { max: POI_LIMITS.materials });
      else part.materials.forEach((m, k) => materialProblems(m, `${at}.materials[${k}]`, say));
    });
  }

  if (raw.lights !== undefined) {
    if (!Array.isArray(raw.lights) || raw.lights.length > POI_LIMITS.lights) say('lights', 'lights', { max: POI_LIMITS.lights });
    else raw.lights.forEach((l, i) => {
      const at = `lights[${i}]`;
      if (!l || typeof l !== 'object') { say(at, 'not-object'); return; }
      if (!vec(l.t, 3) || l.t.some((c) => Math.abs(c) > 2000)) say(`${at}.t`, 'offset', { max: 2000 });
      if (!vec(l.color, 3) || l.color.some((c) => c < 0 || c > 1)) say(`${at}.color`, 'color3');
      if (!finite(l.radius) || l.radius < 0.5 || l.radius > 100) say(`${at}.radius`, 'radius', { min: 0.5, max: 100 });
      if (!finite(l.intensity) || l.intensity < 0 || l.intensity > 10) say(`${at}.intensity`, 'intensity', { max: 10 });
      if (typeof l.flicker !== 'boolean') say(`${at}.flicker`, 'bool');
    });
  }

  if (raw.marker !== undefined) {
    const m = raw.marker;
    if (!m || typeof m !== 'object') say('marker', 'not-object');
    else {
      if (typeof m.show !== 'boolean') say('marker.show', 'bool');
      if (m.label !== undefined && !textOk(m.label, POI_LIMITS.label)) say('marker.label', 'label', { max: POI_LIMITS.label });
    }
  }

  const known = new Set(['v', 'id', 'name', 'about', 'tags', 'place', 'parts', 'lights', 'marker']);
  for (const k of Object.keys(raw)) if (!known.has(k)) say(k, 'unknown');
  return out;
}

function materialProblems(m, at, say) {
  if (!m || typeof m !== 'object') { say(at, 'not-object'); return; }
  if (m.texture !== null && !(typeof m.texture === 'string' && POI_SHA_RE.test(m.texture))) say(`${at}.texture`, 'texture-ref');
  if (m.emissive !== null && !(typeof m.emissive === 'string' && POI_SHA_RE.test(m.emissive))) say(`${at}.emissive`, 'texture-ref');
  if (!vec(m.color, 4) || m.color.some((c) => c < 0 || c > 1)) say(`${at}.color`, 'color4');
  if (!vec(m.emissiveColor, 3) || m.emissiveColor.some((c) => c < 0 || c > 16)) say(`${at}.emissiveColor`, 'emissive-color', { max: 16 });
  if (!enumOk(m.alpha, POI_ALPHA)) say(`${at}.alpha`, 'alpha');
  if (!finite(m.cutoff) || m.cutoff < 0 || m.cutoff > 1) say(`${at}.cutoff`, 'cutoff');
  if (typeof m.twoSided !== 'boolean') say(`${at}.twoSided`, 'bool');
  if (!Array.isArray(m.wrap) || m.wrap.length !== 2 || !m.wrap.every((w) => enumOk(w, POI_WRAP))) say(`${at}.wrap`, 'wrap');
  if (!enumOk(m.filter, POI_FILTER)) say(`${at}.filter`, 'filter');
  const uv = m.uv;
  if (!uv || typeof uv !== 'object' || !vec(uv.offset, 2) || !vec(uv.scale, 2) || !finite(uv.rotation)
    || uv.scale.some((c) => Math.abs(c) < 1e-4 || Math.abs(c) > 1e4) || uv.offset.some((c) => Math.abs(c) > 1e4)) say(`${at}.uv`, 'uv');
  const known = new Set(['texture', 'color', 'emissive', 'emissiveColor', 'alpha', 'cutoff', 'twoSided', 'wrap', 'filter', 'uv']);
  for (const k of Object.keys(m)) if (!known.has(k)) say(`${at}.${k}`, 'unknown');
}

/** The assets a document names: `{ meshes, textures }`, each a Set of sha256. @param {any} doc */
export function poiAssetsOf(doc) {
  const meshes = new Set(), textures = new Set();
  for (const part of doc?.parts ?? []) {
    if (typeof part?.mesh === 'string') meshes.add(part.mesh);
    for (const m of part?.materials ?? []) {
      if (typeof m?.texture === 'string') textures.add(m.texture);
      if (typeof m?.emissive === 'string') textures.add(m.emissive);
    }
  }
  return { meshes, textures };
}

/**
 * Every way a document's assets fall short - `metaOf(sha)` answers an asset's stored facts (`{ kind: 'mesh', submeshes }`
 * or `{ kind: 'texture', w, h }`) or null for one never stored. A part's materials are its mesh's submeshes, one each.
 * @param {any} doc @param {(sha: string) => any} metaOf @returns {PoiProblem[]}
 */
export function poiAssetProblems(doc, metaOf) {
  /** @type {PoiProblem[]} */
  const out = [];
  (doc?.parts ?? []).forEach((part, i) => {
    const mesh = metaOf(part.mesh);
    if (!mesh) out.push({ path: `parts[${i}].mesh`, code: 'not-uploaded' });
    else if (mesh.kind !== 'mesh') out.push({ path: `parts[${i}].mesh`, code: 'not-a-mesh' });
    else if (mesh.submeshes !== part.materials?.length) out.push({ path: `parts[${i}].materials`, code: 'material-count', have: part.materials?.length ?? 0, want: mesh.submeshes });
    (part.materials ?? []).forEach((m, k) => {
      for (const field of ['texture', 'emissive']) {
        if (m[field] == null) continue;
        const t = metaOf(m[field]);
        if (!t) out.push({ path: `parts[${i}].materials[${k}].${field}`, code: 'not-uploaded' });
        else if (t.kind !== 'texture') out.push({ path: `parts[${i}].materials[${k}].${field}`, code: 'not-a-texture' });
      }
    });
  });
  return out;
}

/** Where a POI stands, as the world map knows it - its pixel's id (formats/woodsFile.js getMapPixelID). @param {any} doc */
export const poiPixelId = (doc) => doc.place.py * POI_MAP.w + doc.place.px;
