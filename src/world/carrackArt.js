// @ts-check
// SHIPS-2 (2026-10-07, Mac: "implement both of these new ship placement models, UV Map/Texture, and ensure it matches the
// love we gave the other new ship model we implemented"): THE NEW CARRACK'S PICTURES.
//
// DF-ART (2026-10-14, Mac: "I want to instead use daggerfall textures instead of AI generated"): she wears DAGGERFALL'S
// OWN TEXTURES now, Come Sail Away's choices for its own carrack (world/classicArt.js DF), each record of her
// pseudo-archive (CARRACK_ARCHIVE) read from the player's ARENA2 at the boats' preload, where it was painted from noise.
// Her records, the galleon's numbers for every picture the fleet shares (world/galleonArt.js TEX), her liveries' bands
// and her tiles are unchanged, so no face of her moves - a band is a whole Daggerfall picture where it was a slice of a
// painted livery (the Bay blue strake, the ochre pin-stripes and the name board gone, as Mac chose). Her transom's
// gallery is a Daggerfall window, its panes alone lit at night (classicArt.js paneGlow). Not a DFU member. Ledger A
// (SHIPS-2).
import { TEX as GALLEON_TEX, GALLEON_TILE, GALLEON_SOURCES } from './galleonArt.js';
import { DF, classicStandIns } from './classicArt.js';

/** Her pseudo-archive: past the galleon's 38131. */
export const CARRACK_ARCHIVE = 38141;
/** The records, by what wears them: the galleon's numbers for every picture the fleet shares (world/galleonArt.js
 *  TEX), and hers - her side's livery top down (hullSide0 her rail's, hullSide4 her keel's), her transom's, her
 *  houses', her quarter rail's and her roofs'. */
export const TEX = Object.freeze({
  hullBottom: GALLEON_TEX.hullBottom, hullInner: GALLEON_TEX.hullInner, deck: GALLEON_TEX.deck, trim: GALLEON_TEX.trim,
  spar: GALLEON_TEX.spar, iron: GALLEON_TEX.iron, canvas: GALLEON_TEX.canvas, rope: GALLEON_TEX.rope, gilt: GALLEON_TEX.gilt,
  grate: GALLEON_TEX.grate, lid: GALLEON_TEX.lid, door: GALLEON_TEX.door, beams: GALLEON_TEX.beams, dark: GALLEON_TEX.dark,
  underDeck: GALLEON_TEX.underDeck,
  hullSide0: 0, hullSide1: 17, hullSide2: 18, hullSide3: 19, hullSide4: 23,
  transom0: 6, transom1: 21, house0: 5, quarterRail0: 20, roof: 24,
});
/** Her side's livery spans these heights (her frame), keel to her bow's rail: five slices of 2.9 m, the galleon's
 *  density (her keel 4.588 under the sea, her bow's rail 9.748 over it). */
const HULL_SIDE_Y0 = -4.7;
const HULL_SIDE_Y1 = 9.8;
/** The liveries as their slices: `y0..y1` cut into `recs.length` bands of 64 rows each, `recs` top down. The transom's
 *  over her upper stern (its faces 3.56 to 8.63); a house's from under its sill to over its eaves (7.735 to 10.9); the
 *  quarter rail's over the rail (7.957 to 9.557). */
export const BANDS = Object.freeze({
  hullSide: Object.freeze({ y0: HULL_SIDE_Y0, y1: HULL_SIDE_Y1, recs: Object.freeze([TEX.hullSide0, TEX.hullSide1, TEX.hullSide2, TEX.hullSide3, TEX.hullSide4]) }),
  transom: Object.freeze({ y0: 3.4, y1: 9.2, recs: Object.freeze([TEX.transom0, TEX.transom1]) }),
  house: Object.freeze({ y0: 7.6, y1: 11.0, recs: Object.freeze([TEX.house0]) }),
  quarterRail: Object.freeze({ y0: 7.9, y1: 9.6, recs: Object.freeze([TEX.quarterRail0]) }),
});
/** How far each tiling picture repeats (metres a tile, u then v): the galleon's for the pictures she shares, a livery's
 *  its u alone (along her), her roof's planks two metres. */
export const CARRACK_TILE = Object.freeze({
  ...GALLEON_TILE, hullSide: [2.8, 0], transom: [2.6, 0], house: [2.6, 0], quarterRail: [2.6, 0], roof: [2, 2],
});

/** DF-ART: the Daggerfall record each of her records wears - the galleon's for every picture the fleet shares. */
export const CARRACK_SOURCES = Object.freeze({
  ...Object.fromEntries(['hullBottom', 'hullInner', 'deck', 'trim', 'spar', 'iron', 'canvas', 'rope', 'gilt', 'grate', 'lid', 'door', 'beams', 'dark', 'underDeck']
    .map((k) => [TEX[k], GALLEON_SOURCES[GALLEON_TEX[k]]])),
  [TEX.hullSide0]: DF.hullPlanks, [TEX.hullSide1]: DF.hullPlanks, [TEX.hullSide2]: DF.hullPlanks, [TEX.hullSide3]: DF.hullPlanks,
  [TEX.hullSide4]: DF.tarred, [TEX.transom0]: DF.window, [TEX.transom1]: DF.hullPlanks, [TEX.house0]: DF.panel,
  [TEX.quarterRail0]: DF.oakDark, [TEX.roof]: DF.deck,
});

const _art = classicStandIns({ archive: CARRACK_ARCHIVE, name: 'carrack', sources: CARRACK_SOURCES, glowRecs: BANDS.transom.recs });
/** A record's night glow, or null: her transom gallery's panes alone (`galleonGlow`'s law). */
export const carrackGlow = (/** @type {number} */ record) => _art.glow(record);

let _registered = false;
/** Once: every record on the texture door as a stand-in of CARRACK_ARCHIVE (world/galleonArt.js registerGalleonArt).
 *  @param {(entries: any[]) => number} addVendorTextures */
export function registerCarrackArt(addVendorTextures) {
  if (_registered) return 0;
  _registered = true;
  return addVendorTextures(_art.entries);
}
/** Test seam. */
export function _resetCarrackArt() { _registered = false; _art.reset(); }
