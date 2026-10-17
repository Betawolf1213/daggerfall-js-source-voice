// @ts-check
// STUDIO1 (2026-10-17, Mac, of trashBattery on the dev chat - "what Latty is working to build right now, and what I'm
// waiting for, is a centralized location for you and I to put 2d art assets": "We need to build what trash is talking
// about"): THE STUDIO - ONE FOLDER WHERE THE GAME'S ARTISTS PUT THEIR PICTURES, AND THE GAME WEARS THEM.
//
// Until now every picture the game drew was a mod's it was handed, a record of the player's own ARENA2, or one the port
// painted from numbers and recoloured for each paint (the wagons, the ships, the yards - bible/01-Overview/DF-Art.md).
// The studio is the fourth: `public/art/studio/<artist>/`, each artist's own drawings, named the way every Daggerfall
// texture pack names its pictures (systems/textureReplacement.js textureName - `38181_1-0.png`), with a label for the
// eye after `--` if the artist likes (`38181_1-0--cart-side.png`). An artist drops a PNG in their folder and it is
// worn: the dev server and the build list the folder themselves (scripts/studioArtIndex.mjs), so there is no list to
// keep and no tool to run.
//
// WHERE IT STANDS. On the texture door's vendor tier - the port's own art - and above every other picture there
// (addVendorTextures, STUDIO1): over Vanilla Enhanced and every shipped pack, over the port's painted ships and
// hangings, worn with Replace Game Artwork off and on Classic, because it is the game's own art, not a pack. A
// player's own loose pack still answers first, as it does over every picture of the port's (liveEntry). The port's
// own models that upload their pictures themselves (the wagons and the caravan, the yards, the port, the monument) ask
// `paintedReplacement` before they paint. A studio picture is worn as drawn: DF-LOOK's grain and palette are for
// pictures painted from numbers, and an artist's picture is already the look they meant.
//
// Not a DFU member: DFU's loose folder (TextureReplacement.TryImportTexture) is the player's; this is the game's own.
// Ledger A (STUDIO1).
import { textureEntry, textureKey, addVendorTextures, hasTextureReplacement, decodedTexture, decodedTextureTopDown, preloadTextureRecord, decodePng } from '../textureReplacement.js';
import { APP_ROOT } from '../appRoot.js';

/** Where the studio is served, under the site's root (`public/art/studio/` in the tree). */
export const STUDIO_DIR = 'art/studio';
/** The folder's listing, written by the dev server and the build (scripts/studioArtIndex.mjs) - never a file in the
 *  tree: `{ studio: 1, files: ["<artist>/<name>.png", ...] }`. */
export const STUDIO_INDEX = 'index.json';
/** What parts a picture's name from its label (`38181_1-0--cart-side.png`): a DFU name never holds it - its record and
 *  frame are digits on either side of ONE dash. */
export const STUDIO_LABEL = '--';
/** The last TEXTURE file Daggerfall has (TEXTURE.511). A picture of an archive past it is of the port's own - no archive
 *  load ever preloads it, so the install does. */
export const CLASSIC_TEXTURE_LAST = 511;

/**
 * One picture of the studio's, read off its path under the studio (`trashBattery/wagons/38181_1-0--cart-side.png`), or
 * null when the path names no picture the game can wear: its artist (the path's first folder), what it replaces (the
 * DFU name before any label - textureEntry's), and its label.
 * @param {string} path
 */
export function studioFile(path) {
  const parts = String(path ?? '').split('/');
  if (parts.length < 2 || parts.some((p) => !p || p === '.' || p === '..')) return null;
  const m = /^(.+?)(?:--(.+))?\.png$/i.exec(parts[parts.length - 1]);
  const e = m && textureEntry(`${m[1]}.png`);
  if (!e) return null;
  return {
    path, artist: parts[0], label: m[2] ?? null,
    archive: e.archive, record: e.record, frame: e.frame, map: e.map, dye: e.dye,
    key: textureKey(e.archive, e.record, e.frame, e.map, e.dye),
  };
}

/** The pictures a listing names, one a key: the first path in order keeps a key two pictures name (the folder's check -
 *  tools/studioArt.mjs - refuses that before it ships). */
export function studioEntries(files) {
  const byKey = new Map();
  for (const path of [...(Array.isArray(files) ? files : [])].filter((f) => typeof f === 'string').sort()) {
    const e = studioFile(path);
    if (e && !byKey.has(e.key)) byKey.set(e.key, e);
  }
  return [...byKey.values()];
}

/** A studio path's served URL. */
export const studioUrl = (path, root = APP_ROOT ?? globalThis.document?.baseURI ?? 'http://localhost/') =>
  new URL(`${STUDIO_DIR}/${String(path).split('/').map(encodeURIComponent).join('/')}`, root).href;

/** @type {Promise<number> | null} */
let _install = null;
let _landed = false;
/** @type {ReturnType<typeof studioEntries>} */
let _worn = [];

/**
 * Once: the studio's listing read and every picture in it on the texture door - and the pictures of the port's own
 * archives decoded, so a host that paints its own (paintedReplacement) finds them waiting. Answers how many registered;
 * 0 with no listing (a page served without the studio's plugin - a probe's static server), which leaves the game as it
 * was. Never throws: art is never what stops a boot.
 * @param {{ fetch?: (url: string) => Promise<any>, root?: string, decode?: (bytes: Uint8Array) => Promise<any> }} [io]
 */
export function installStudioArt({ fetch = (u) => globalThis.fetch(u), root = undefined, decode = decodePng } = {}) {
  return (_install ??= (async () => {
    let files;
    try {
      const r = await fetch(studioUrl(STUDIO_INDEX, root));
      if (!r?.ok) return 0;
      files = (await r.json())?.files;
    } catch { return 0; }
    _worn = studioEntries(files);
    const bytes = async (path) => { const r = await fetch(studioUrl(path, root)); return r?.ok ? new Uint8Array(await r.arrayBuffer()) : null; };
    const n = addVendorTextures(_worn.map((e) => ({
      archive: e.archive, record: e.record, frame: e.frame, map: e.map, dye: e.dye,
      studio: true, fileName: `studio:${e.path}`, load: () => bytes(e.path),
    })));
    await Promise.all(_worn.filter((e) => e.archive > CLASSIC_TEXTURE_LAST)
      .map((e) => preloadTextureRecord(e.archive, e.record, e.frame, e.map, e.dye, { decode })));
    return n;
  })().finally(() => { _landed = true; }));
}
/** The install as it stands: resolved once the studio's pictures are on the door (at once when none was asked for). */
export const studioLanded = () => _install ?? Promise.resolve(0);
/** The pictures the studio wears, as its listing named them (studioFile's). */
export const studioWorn = () => _worn;
/** Test seam: not installed. */
export function _resetStudioArt() { _install = null; _landed = false; _worn = []; }

/**
 * THE DOOR OF A PICTURE THE PORT PAINTS ITSELF (STUDIO1): what replaces it - the studio's picture, or a player's own
 * pack's - ready for renderer.uploadTexture, or null to wear the painted one. Synchronous: the install decoded the
 * port's own archives before any host draws. `topDown` for a host whose pictures go up with row 0 their top (the
 * yards', the port's, the monument's: their faces are laid that way); otherwise the port's color32 order (row 0 the
 * bottom - formats/color32Order.js), which the wagons' go up in.
 * @param {number} archive @param {number} record
 * @param {{ topDown?: boolean }} [how]
 * @returns {{ width: number, height: number, colors: Uint8ClampedArray } | null}
 */
export function paintedReplacement(archive, record, { topDown = false } = {}) {
  if (!hasTextureReplacement(archive, record)) return null;
  if (!topDown) return decodedTexture(archive, record);
  const d = decodedTextureTopDown(archive, record);
  return d ? { width: d.width, height: d.height, colors: d.rgba } : null;
}

/**
 * A painted record WORN: `put(picture, { replaced, late })` is handed the picture it wears now - its replacement
 * (paintedReplacement) or `paint()` - and, when the studio's install was still on its way (a host that streams before
 * the boot's install lands - the world's does), handed the studio's picture again when it lands (`late`: the painted
 * one is up under the key, and the renderer keeps the first picture a key is given, so the host lets it go first).
 * @template P
 * @param {number} archive @param {number} record - the record whose replacement is worn
 * @param {() => P} paint
 * @param {(picture: P | NonNullable<ReturnType<typeof paintedReplacement>>, how: { replaced: boolean, late: boolean }) => void} put
 * @param {{ topDown?: boolean }} [how]
 */
export function wearPainted(archive, record, paint, put, how = {}) {
  const own = paintedReplacement(archive, record, how);
  if (own) { put(own, { replaced: true, late: false }); return; }
  put(paint(), { replaced: false, late: false });
  if (_install && !_landed) _install.then(() => { const late = paintedReplacement(archive, record, how); if (late) put(late, { replaced: true, late: true }); });
}
