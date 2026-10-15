// @ts-check
// ═══════════════════════════════════════════════════════════════════
// POI-6 (2026-10-14) - POIS AND MODELS OUT OF THE EDITOR AND BACK IN: A .glb, AND A PACK.
//
// Mac: "a tool my developers can use without having to access the codebase" (bible/06-Systems/POI-Editor-Arc.md POI-6).
// The editor's panel (ui/poiEditorPanel.js) and the library (ui/poiLibraryPanel.js) hand this module what they hold;
// it fetches what they name, writes the file, or reads one back into the store:
//
//   - `exportModel(model, fetchAsset)`: a POI's or a library entry's parts and lights as one .glb (poi/gltfExport.js) -
//     every mesh fetched and read, every picture fetched and known by its header.
//   - `exportPack({ pois, shelf }, fetchAsset)`: documents and entries with every asset they name, as a pack
//     (poi/poiPack.js writePack).
//   - `importPack(pack, io)`: a pack read and checked (poiPack.js readPack) into the store - every asset uploaded by its
//     name (one the store has comes back `existed`), every library entry put (under its own id, or a new one where the
//     store will not let this builder change the one it has), and every POI handed back to be OPENED: as a change to the
//     store's live revision where the store knows the POI (the before and after the approver will read), else as new.
//
// A fetch that fails stops the export and says which; nothing half-written leaves the editor. Not a DFU member. Ledger A
// (POI).
// ═══════════════════════════════════════════════════════════════════

import { writeGlb } from './gltfExport.js';
import { writePack } from './poiPack.js';
import { poiAssetsOf, mintShelfId } from './poiLaw.js';
import { decodePoiMesh } from './poiMesh.js';
import { poiImageMetaOf } from './poiImage.js';

/** A name a file may carry: letters, digits, spaces, dashes and underscores, never empty. @param {string} name */
export const fileNameOf = (name, ext, fallback = 'poi') => `${String(name ?? '').replace(/[^\p{L}\p{N} _-]+/gu, '').trim().replace(/\s+/g, '-').slice(0, 64) || fallback}.${ext}`;

/**
 * A model as a .glb: `{ ok: true, bytes }` or `{ ok: false, code: 'export-fetch', sha }`.
 * @param {{ name: string, parts: any[], lights?: any[] }} model @param {(sha: string) => Promise<Uint8Array>} fetchAsset
 */
export async function exportModel({ name, parts, lights = [] }, fetchAsset) {
  const pieces = [], pictures = new Map();
  for (const p of parts) {
    let bytes;
    try { bytes = await fetchAsset(p.mesh); } catch { return { ok: false, code: 'export-fetch', sha: p.mesh }; }
    const d = decodePoiMesh(bytes);
    if ('error' in d) return { ok: false, code: 'export-fetch', sha: p.mesh };
    pieces.push({ ...p, mesh: d.mesh });
    for (const m of p.materials) {
      for (const sha of [m.texture, m.emissive]) {
        if (!sha || pictures.has(sha)) continue;
        let pic;
        try { pic = await fetchAsset(sha); } catch { return { ok: false, code: 'export-fetch', sha }; }
        const im = poiImageMetaOf(pic);
        if ('error' in im) return { ok: false, code: 'export-fetch', sha };
        pictures.set(sha, { bytes: pic, format: im.format });
      }
    }
  }
  return { ok: true, bytes: writeGlb({ name, parts: pieces, lights, pictures }) };
}

/**
 * Documents and entries as a pack, every asset they name fetched: `{ ok: true, bytes }` or `{ ok: false, code, sha }`.
 * @param {{ pois?: any[], shelf?: any[] }} what @param {(sha: string) => Promise<Uint8Array>} fetchAsset
 */
export async function exportPack({ pois = [], shelf = [] }, fetchAsset) {
  const assets = new Map();
  for (const d of [...pois, ...shelf]) {
    const { meshes, textures } = poiAssetsOf(d);
    for (const sha of [...meshes, ...textures]) {
      if (assets.has(sha)) continue;
      try { assets.set(sha, await fetchAsset(sha)); } catch { return { ok: false, code: 'export-fetch', sha }; }
    }
  }
  return writePack({ pois, shelf, assets });
}

/**
 * A checked pack into the store. `io`: `putAsset(bytes, kind)`, `history(id)` (poiHistory's answer), `shelve(item)` -
 * each answered as poi/poiService.js answers - `rand` for a new entry id, and `progress(done, of)`.
 * Answers `{ ok: true, open: [{ id, doc, saved, base, state }], shelved, uploaded, existed }` or the store's refusal
 * `{ ok: false, error, at }`.
 * @param {{ pois: any[], shelf: any[], assets: Map<string, { kind: string, bytes: Uint8Array }> }} pack
 * @param {{ putAsset: (bytes: Uint8Array, kind: any) => Promise<any>, history: (id: string) => Promise<any>,
 *   shelve: (item: any) => Promise<any>, rand: (b: Uint8Array) => Uint8Array, progress?: (done: number, of: number) => void }} io
 */
export async function importPack(pack, { putAsset, history, shelve, rand, progress = () => {} }) {
  const total = pack.assets.size + pack.shelf.length + pack.pois.length;
  let done = 0, uploaded = 0, existed = 0, shelved = 0;
  for (const [sha, a] of pack.assets) {
    const r = await putAsset(a.bytes, a.kind);
    if (!r.ok) return { ok: false, error: r.error, at: sha };
    if (r.data.existed) existed++; else uploaded++;
    progress(++done, total);
  }
  for (const entry of pack.shelf) {
    let r = await shelve(entry);
    // the store keeps another builder's entry under that id (or took it off the shelf): this one is the importer's own
    if (!r.ok && (r.error === 'poi-not-author' || r.error === 'not-found')) r = await shelve({ ...entry, id: mintShelfId(rand) });
    if (!r.ok) return { ok: false, error: r.error, at: entry.name };
    shelved++;
    progress(++done, total);
  }
  const open = [];
  for (const doc of pack.pois) {
    const h = await history(doc.id);
    if (h.ok) {
      const live = h.data.revs?.find((x) => x.rev === h.data.liveRev)?.doc ?? null;
      open.push({ id: doc.id, doc, saved: live, base: h.data.liveRev ?? null, state: h.data.liveRev ? 'live' : 'draft' });
    } else if (h.error === 'not-found') {
      open.push({ id: doc.id, doc, saved: null, base: null, state: 'new' });
    } else return { ok: false, error: h.error, at: doc.name };
    progress(++done, total);
  }
  return { ok: true, open, shelved, uploaded, existed };
}
