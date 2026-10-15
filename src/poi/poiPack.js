// @ts-check
// ═══════════════════════════════════════════════════════════════════
// POI-6 (2026-10-14) - A POI PACK: POIS, LIBRARY ENTRIES AND EVERY ASSET THEY NAME, IN ONE FILE.
//
// Mac: "a tool my developers can use without having to access the codebase" (bible/06-Systems/POI-Editor-Arc.md
// POI-6). A builder takes work from one realm to another, hands it to another builder, or keeps it safe, as one .zip:
//
//   pack.json            { v: 1, kind: 'poi-pack', pois: [document, ...], shelf: [entry, ...] }
//   assets/<sha>.mesh    a mesh (poi/poiMesh.js), named by the sha256 of its bytes
//   assets/<sha>.png     a picture (.png, .jpg or .webp by its own header), the same
//
// Written STORED (systems/saveTransfer.js zipStore - the meshes and pictures are already packed); read by the port's
// own zip reader (scenes/dataSource.js readZipEntries: stored and deflated, so a pack a builder zipped again still
// opens). READ, NOTHING IS TRUSTED: each asset hashed against its name and read as its kind (a mesh decoded, a picture
// by its header), each document and entry held to the law, and each name an asset is used under present - a pack that
// falls short is refused by CODE (`{ code, ...args }`, said by poi/poiText.js packErrorText), never half-read.
//
// Pure but for the hash (crypto.subtle). Not a DFU member. Ledger A (POI).
// ═══════════════════════════════════════════════════════════════════

import { zipStore } from '../systems/saveTransfer.js';
import { poiDocProblems, poiShelfProblems, poiAssetsOf } from './poiLaw.js';
import { decodePoiMesh } from './poiMesh.js';
import { poiImageMetaOf } from './poiImage.js';
import { poiSha256 } from './poiService.js';

export const POI_PACK_VERSION = 1;
export const POI_PACK_KIND = 'poi-pack';
/** A pack's bounds: its documents and entries, and its files. */
export const POI_PACK_LIMITS = Object.freeze({ pois: 500, shelf: 2000, files: 20000 });
const EXT = { png: 'png', jpeg: 'jpg', webp: 'webp' };

/** An asset's file name in a pack, from its bytes: a mesh `.mesh`, a picture by its header. */
export function packAssetName(sha, bytes) {
  const im = poiImageMetaOf(bytes);
  return `assets/${sha}.${'error' in im ? 'mesh' : EXT[im.format]}`;
}

/**
 * A pack's bytes (a .zip): the documents, the entries and every asset they name (`assets`: sha -> bytes; one missing
 * is refused - a pack never names what it does not carry).
 * @param {{ pois?: any[], shelf?: any[], assets: Map<string, Uint8Array> }} p
 * @returns {{ ok: true, bytes: Uint8Array } | { ok: false, code: string, sha?: string }}
 */
export function writePack({ pois = [], shelf = [], assets }) {
  const named = new Set();
  for (const d of [...pois, ...shelf]) { const { meshes, textures } = poiAssetsOf(d); for (const s of [...meshes, ...textures]) named.add(s); }
  /** @type {{ name: string, data: Uint8Array }[]} */
  const files = [{ name: 'pack.json', data: new TextEncoder().encode(JSON.stringify({ v: POI_PACK_VERSION, kind: POI_PACK_KIND, pois, shelf })) }];
  for (const sha of [...named].sort()) {
    const bytes = assets.get(sha);
    if (!bytes) return { ok: false, code: 'pack-missing-asset', sha };
    files.push({ name: packAssetName(sha, bytes), data: bytes });
  }
  return { ok: true, bytes: zipStore(files) };
}

/**
 * A pack read and checked: `{ ok: true, pois, shelf, assets: Map<sha, { kind, bytes }> }` or `{ ok: false, code, ... }`.
 * @param {{ name: string, data: ArrayBuffer | Uint8Array }[]} entries the zip's files (readZipEntries')
 */
export async function readPack(entries, subtle = globalThis.crypto.subtle) {
  if (entries.length > POI_PACK_LIMITS.files) return { ok: false, code: 'pack-too-large' };
  const bytesOf = (d) => /** @type {Uint8Array} */ (d instanceof Uint8Array ? d : new Uint8Array(d));
  const head = entries.find((e) => e.name === 'pack.json');
  if (!head) return { ok: false, code: 'pack-not-a-pack' };
  let pack;
  try { pack = JSON.parse(new TextDecoder().decode(bytesOf(head.data))); } catch { return { ok: false, code: 'pack-not-a-pack' }; }
  if (pack?.kind !== POI_PACK_KIND) return { ok: false, code: 'pack-not-a-pack' };
  if (pack.v !== POI_PACK_VERSION) return { ok: false, code: 'pack-version', v: pack.v };
  const pois = Array.isArray(pack.pois) ? pack.pois : [], shelf = Array.isArray(pack.shelf) ? pack.shelf : [];
  if (pois.length > POI_PACK_LIMITS.pois || shelf.length > POI_PACK_LIMITS.shelf) return { ok: false, code: 'pack-too-large' };
  for (const [i, d] of pois.entries()) { const ps = poiDocProblems(d); if (ps.length) return { ok: false, code: 'pack-bad-poi', index: i, name: String(d?.name ?? ''), problem: ps[0] }; }
  for (const [i, d] of shelf.entries()) { const ps = poiShelfProblems(d); if (ps.length) return { ok: false, code: 'pack-bad-entry', index: i, name: String(d?.name ?? ''), problem: ps[0] }; }
  // every asset by its name: hashed, read as its kind
  const assets = new Map();
  for (const e of entries) {
    const m = /^assets\/([0-9a-f]{64})\.(mesh|png|jpg|webp)$/.exec(e.name);
    if (!m) continue;
    const bytes = bytesOf(e.data);
    if ((await poiSha256(bytes, subtle)) !== m[1]) return { ok: false, code: 'pack-asset-hash', sha: m[1] };
    if (m[2] === 'mesh') {
      const d = decodePoiMesh(bytes);
      if ('error' in d) return { ok: false, code: 'pack-asset-bad', sha: m[1] };
      assets.set(m[1], { kind: 'mesh', bytes, submeshes: d.mesh.submeshes.length });
    } else {
      const im = poiImageMetaOf(bytes);
      if ('error' in im) return { ok: false, code: 'pack-asset-bad', sha: m[1] };
      assets.set(m[1], { kind: 'texture', bytes, w: im.w, h: im.h });
    }
  }
  // what they wear is all there, and of its kind
  for (const d of [...pois, ...shelf]) {
    const { meshes, textures } = poiAssetsOf(d);
    for (const s of meshes) if (assets.get(s)?.kind !== 'mesh') return { ok: false, code: 'pack-missing-asset', sha: s, name: String(d.name) };
    for (const s of textures) if (assets.get(s)?.kind !== 'texture') return { ok: false, code: 'pack-missing-asset', sha: s, name: String(d.name) };
  }
  return { ok: true, pois, shelf, assets };
}
