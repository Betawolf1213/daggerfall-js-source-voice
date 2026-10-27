// VENDORED PLACES (Raven-Wright): a whole transplanted place - its
// MODELS (a packed place BSA the port decodes with its own Arch3dFile,
// whose vanilla byte-patch table the loader's fingerprint gate leaves
// off), its TEXTURES (M-TEX-named PNGs, archives past the classic 511,
// on the bundle tier) and its WORLD DATA (WorldData/*.json, the door's
// own glob in scenes/modWorldData.js) - installed from one
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
import { addBundleTextures } from '../systems/textureReplacement.js';
import { modSetting } from '../systems/modSettings.js';

const IN_BROWSER = typeof window !== 'undefined';
const MANIFESTS = IN_BROWSER ? import.meta.glob('../../vendor/*/place/PLACE.json', { eager: true, import: 'default' }) : {};
const BINS = IN_BROWSER ? import.meta.glob('../../vendor/*/Models/*.bin', { query: '?url', import: 'default' }) : {};
const TEXTURES = IN_BROWSER ? import.meta.glob('../../vendor/*/Textures/*.png', { query: '?url', import: 'default' }) : {};

const vendorOf = (p) => /vendor[\\/]([^\\/]+)[\\/]/.exec(p)?.[1] ?? '';

/** Test seam: the manifests the browser build saw. */
export const vendoredPlaceManifests = () => MANIFESTS;

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
    const isOn = () => modSetting(vendor, 'Enabled') === true;
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
    const image = makeImage ?? (async (url) => {
      const r = await globalThis.fetch(url);
      if (!r?.ok) throw new Error(`${url}: ${r?.status}`);
      return await createImageBitmap(await r.blob());
    });
    for (const [fileName, url] of texUrls) {
      const m = /^(\d+)_(\d+)-(\d+)(?:_(\w+))?\.png$/.exec(fileName);
      if (!m) continue;
      addBundleTextures([{
        archive: Number(m[1]), record: Number(m[2]), frame: Number(m[3]),
        map: m[4] ?? 'Albedo', fileName, src: `vendored-place:${vendor}`,
        image: async () => image(url),
      }]);
    }
    places++; models += arch.count; textures += texUrls.size;
  }
  return { places, models, textures };
}

/** Test seam. */
export function _resetVendoredPlaces() { _resetCustomModels(); }
