// @ts-check
// SHIPS-2 (2026-10-07, Mac: "implement both of these new ship placement models, UV Map/Texture, and ensure it matches the
// love we gave the other new ship model we implemented"): THE NEW LARGE BOAT'S PICTURES.
//
// DF-ART (2026-10-14, Mac: "I want to instead use daggerfall textures instead of AI generated"): Mac's Tiny Ship (Come
// Sail Away's hull 1) wears DAGGERFALL'S OWN TEXTURES now (world/classicArt.js DF), each record of her pseudo-archive
// (LARGE_BOAT_ARCHIVE) read from the player's ARENA2 at the boats' preload, where it was painted from noise - the
// galleon's records for every picture the fleet shares, and her side and transom Come Sail Away's own hulls' planking
// (the clinker strakes, the sea-green sheer strake and the carved name board gone, as Mac chose). Her records, bands
// and tiles are unchanged, so no face of her moves. Not a DFU member. Ledger A (SHIPS-2).
import { TEX as GALLEON_TEX, GALLEON_TILE, GALLEON_SOURCES } from './galleonArt.js';
import { DF, classicStandIns } from './classicArt.js';

/** Her pseudo-archive: past the carrack's 38141. */
export const LARGE_BOAT_ARCHIVE = 38171;   // AUDIT SD IV (R6): it was 38151, the Shattered Hour's own (world/sdRealm.js SD_REALM_ARCHIVE) - a picture is kept by archive and record, so whichever went up first stood for both
/** The records: the galleon's numbers for every picture the fleet shares, and hers - her side's livery and her
 *  transom's. */
export const TEX = Object.freeze({
  hullBottom: GALLEON_TEX.hullBottom, hullInner: GALLEON_TEX.hullInner, deck: GALLEON_TEX.deck, trim: GALLEON_TEX.trim,
  spar: GALLEON_TEX.spar, iron: GALLEON_TEX.iron, canvas: GALLEON_TEX.canvas, rope: GALLEON_TEX.rope, gilt: GALLEON_TEX.gilt,
  grate: GALLEON_TEX.grate, lid: GALLEON_TEX.lid, door: GALLEON_TEX.door, beams: GALLEON_TEX.beams, dark: GALLEON_TEX.dark,
  underDeck: GALLEON_TEX.underDeck,
  hullSide0: 0, transom0: 6,
});
/** The pictures she shares with the galleon, under its numbers and its Daggerfall records. */
const SHARED = Object.freeze(['hullBottom', 'hullInner', 'deck', 'trim', 'spar', 'iron', 'canvas', 'rope', 'gilt', 'grate', 'lid', 'door', 'beams', 'dark', 'underDeck']);

/** Her side's livery spans these heights (her frame): her keel (-0.615) to her gunwale's cap (2.249), one slice. */
const HULL_SIDE_Y0 = -0.66;
const HULL_SIDE_Y1 = 2.26;
/** The liveries as their slices (world/carrackArt.js BANDS's shape): her side's and her transom's, keel to gunwale. */
export const BANDS = Object.freeze({
  hullSide: Object.freeze({ y0: HULL_SIDE_Y0, y1: HULL_SIDE_Y1, recs: Object.freeze([TEX.hullSide0]) }),
  transom: Object.freeze({ y0: HULL_SIDE_Y0, y1: HULL_SIDE_Y1, recs: Object.freeze([TEX.transom0]) }),
});
/** How far each tiling picture repeats (metres a tile): the galleon's, a livery's its u alone (along her). */
export const LARGE_BOAT_TILE = Object.freeze({ ...GALLEON_TILE, hullSide: [2.4, 0], transom: [2.4, 0] });

/** DF-ART: the Daggerfall record each of her records wears. */
export const LARGE_BOAT_SOURCES = Object.freeze({
  ...Object.fromEntries(SHARED.map((k) => [TEX[k], GALLEON_SOURCES[GALLEON_TEX[k]]])),
  [TEX.hullSide0]: DF.hullPlanks, [TEX.transom0]: DF.hullPlanks,
});

const _art = classicStandIns({ archive: LARGE_BOAT_ARCHIVE, name: 'large-boat', sources: LARGE_BOAT_SOURCES });

let _registered = false;
/** Once: every record on the texture door as a stand-in of LARGE_BOAT_ARCHIVE (world/galleonArt.js registerGalleonArt).
 *  @param {(entries: any[]) => number} addVendorTextures */
export function registerLargeBoatArt(addVendorTextures) {
  if (_registered) return 0;
  _registered = true;
  return addVendorTextures(_art.entries);
}
/** Test seam. */
export function _resetLargeBoatArt() { _registered = false; }
