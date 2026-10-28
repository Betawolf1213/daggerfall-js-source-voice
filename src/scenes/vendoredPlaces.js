// VENDORED PLACES (Raven-Wright): a whole transplanted place - its
// MODELS (a packed place BSA the port decodes with its own Arch3dFile,
// whose vanilla byte-patch table the loader's fingerprint gate leaves
// off), its TEXTURES (M-TEX-named PNGs, archives past the classic 511,
// on the VENDOR tier - the port's own art, like the town mods', which
// dfmod's bundle install never replaces; a bundle registration died to
// the first setBundleTextures) and its WORLD DATA (WorldData/*.json,
// the door's own glob in scenes/modWorldData.js) - installed from one
// vendor/<vendor>/place/PLACE.json.
//
// The colosseum's door generalized (world/arenaCity.js: a binary the
// build emits beside the bundle, fetched once, models registered for
// the ids no classic ARCH3D carries). NEVER TRAPS: a place whose BSA
// will not load stands nowhere and is said once - the classic world
// around it stands regardless.
//
// Node-testable as arenaCity is: installVendoredPlaces({ readBin,
// makeImage, log }).

import { registerCustomModel, _resetCustomModels } from '../world/customModels.js';
import { Arch3dFile } from '../formats/arch3dFile.js';
import { dfMeshToModel } from '../world/meshReader.js';
import { addVendorTextures, decodePng } from '../systems/textureReplacement.js';
import { modSetting, modSettingIfDeclared } from '../systems/modSettings.js';

const IN_BROWSER = typeof window !== 'undefined';
const MANIFESTS = IN_BROWSER ? import.meta.glob('../../vendor/*/place/PLACE.json', { eager: true, import: 'default' }) : {};
// `eager: true` so the map values are the URL STRINGS (a lazy `?url` glob hands back loader functions, which would be
// handed to fetch() and fetched as the string "() => import(...)"). Eager resolves each to its URL at import time.
const BINS = IN_BROWSER ? import.meta.glob('../../vendor/*/Models/*.bin', { query: '?url', import: 'default', eager: true }) : {};
const TEXTURES = IN_BROWSER ? import.meta.glob('../../vendor/*/Textures/*.png', { query: '?url', import: 'default', eager: true }) : {};

const vendorOf = (p) => /vendor[\\/]([^\\/]+)[\\/]/.exec(p)?.[1] ?? '';

/** Test seam: the manifests the browser build saw. */
export const vendoredPlaceManifests = () => MANIFESTS;
/** Test seam: the texture URLs the browser build saw, keyed by vendor (the
 *  glob is a build-time fact - this is how a probe sees what vite emitted). */
export const vendoredTextureNames = () => {
  const byVendor = {};
  for (const p of Object.keys(TEXTURES)) {
    const v = vendorOf(p);
    (byVendor[v] ??= []).push(p.split('/').pop());
  }
  return byVendor;
};

/** A place record's model, built lazily the first time it is drawn
 *  (customModels caches). Every record is the classic 32x32, so the
 *  UV size answer is constant. The submeshes' texture archives are
 *  lifted from the packed 0..N into the place's mod range (512+). */
function placeModelBuilder(arch, record, textureBase) {
  return () => {
    const model = dfMeshToModel(arch.getMesh(record), () => ({ width: 32, height: 32 }));
    if (model?.subMeshes) for (const sm of model.subMeshes) sm.textureArchive += textureBase;
    return model;
  };
}

/** Install every vendored place. Returns { places, models, textures }. */
export async function installVendoredPlaces({ readBin = null, makeImage = null, log = console } = {}) {
  let places = 0, models = 0, textures = 0;
  for (const [path, manifest] of Object.entries(MANIFESTS)) {
    const vendor = vendorOf(path);
    // A vendored place stands by default. Declared vendors read their
    // switch; an UNdeclared one (a fresh Raven-Wright World Builder place)
    // stands on - MO1: every mod's `Enabled` defaults true. Never throws,
    // so one odd vendor can never knock out the others.
    const isOn = () => {
      const v = modSettingIfDeclared(vendor, 'Enabled');
      return v === undefined ? true : v === true;
    };
    const bin = Object.entries(BINS).find(([p]) => p.includes('/vendor/' + vendor + '/Models/'))?.[1];
    if (!bin) {
      if (log?.error) log.error(`[place] ${vendor}: its manifest names no Models/*.bin - stands nowhere`);
      continue;
    }
    const read = readBin ?? (async () => {
      const r = await globalThis.fetch(bin);
      if (!r?.ok) throw new Error(`${bin}: ${r?.status ?? 'no answer'}`);
      return new Uint8Array(await r.arrayBuffer());
    });
    let arch;
    try {
      arch = new Arch3dFile();
      const bytes = await read();
      if (!arch.load(bytes)) throw new Error('the ARCH3D loader refused it');
    } catch (e) {
      if (log?.error) log.error(`[place] ${vendor}: its BSA stands nowhere - ${e?.message ?? e}`);
      continue;
    }
    const base = Number(manifest.textureBase ?? 0);
    const offset = Number(manifest.modelOffset ?? 0);
    for (let i = 0; i < arch.count; i++) {
      registerCustomModel(offset + arch.getRecordId(i), placeModelBuilder(arch, i, base), isOn);
    }
    const texUrls = new Map();
    for (const [p, url] of Object.entries(TEXTURES)) {
      if (p.includes('/vendor/' + vendor + '/Textures/')) texUrls.set(p.split('/').pop(), url);
    }
    // VENDOR TIER, standIn kind: these archives exist ONLY as this place's
    // art (no TEXTURE.512+ file in ARENA2), so the pipeline stands a sized
    // shell in for the file and draws the decoded records through the same
    // swap arm a replacement uses. The vendor tier is the port's own art -
    // ungated, and untouched by dfmod's setBundleTextures (the bundle tier
    // this used lost every record to the first dfmod install).
    // entryColor32's file arm is `load` -> bytes -> toColor32(decodePng).
    const loadBytes = makeImage ?? (async (url) => {
      const r = await globalThis.fetch(url);
      if (!r?.ok) throw new Error(`${url}: ${r?.status}`);
      return new Uint8Array(await r.arrayBuffer());
    });
    for (const [fileName, url] of texUrls) {
      const m = /^(\d+)_(\d+)-(\d+)(?:_(\w+))?\.png$/.exec(fileName);
      if (!m) continue;
      addVendorTextures([{
        archive: Number(m[1]), record: Number(m[2]), frame: Number(m[3]),
        map: m[4] ?? 'Albedo', fileName, src: `vendored-place:${vendor}`,
        gate: isOn, standIn: true,
        load: async () => loadBytes(url),
      }]);
    }
    places++; models += arch.count; textures += texUrls.size;
  }
  return { places, models, textures };
}

/** Test seam. */
export function _resetVendoredPlaces() { _resetCustomModels(); }
