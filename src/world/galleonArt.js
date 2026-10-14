// @ts-check
// GALLEON (2026-10-01, Mac: "we will need to give this a proper texture"): THE NEW GALLEON'S PICTURES.
//
// DF-ART (2026-10-14, Mac: "For all textures you implemented that are AI (Ships, wagons, caravans, etc) I want to
// instead use daggerfall textures instead of AI generated"): she wears DAGGERFALL'S OWN TEXTURES now, Come Sail Away's
// choices for its own galleon (world/classicArt.js DF) - each record of her pseudo-archive (GALLEON_ARCHIVE) read from
// the player's ARENA2 when the boats' preload asks for it (scenes/comeSailAwayPool.js), where it was painted here from
// noise. Her records, her liveries' bands and her tiles are unchanged, so no face of her moves: a band (BANDS) is a whole
// Daggerfall picture now, where it was a 64-row slice of one painted livery - the oxblood strake, the gilt pin-stripes
// and the painted panels are gone, as Mac chose. Her stern gallery is a Daggerfall window, and its panes alone glow at
// night (classicArt.js paneGlow). Not a DFU member. Ledger A (GALLEON).
import { DF, classicStandIns } from './classicArt.js';

/** The galleon's pseudo-archive: past the gate's 38101, the court's 38111 and the spoils' 38121. */
export const GALLEON_ARCHIVE = 38131;
/** The records, by what wears them. A livery's slices top down (`BANDS`): hullSide0 her rail's, hullSide3 her keel's. */
export const TEX = Object.freeze({
  hullSide0: 0, hullBottom: 1, hullInner: 2, deck: 3, trim: 4, castle0: 5, sternWindows0: 6, spar: 7, iron: 8,
  canvas: 9, rope: 10, gilt: 11, grate: 12, lid: 13, door: 14, beams: 15, dark: 16,
  // GALLEON-2: the liveries' lower slices, and her main deck's underside between Mac's beams
  hullSide1: 17, hullSide2: 18, hullSide3: 19, castle1: 20, sternWindows1: 21, underDeck: 22,
});
/** The heights (the boat's frame, metres over the waterline) the hull's side livery spans, keel to rail - GALLEON-2:
 *  down to -4.2, her forefoot's new reach (-4.11) inside it. */
export const HULL_SIDE_Y0 = -4.2;
export const HULL_SIDE_Y1 = 7.4;
/** The heights the castle's and the stern's liveries span, the main deck's foot to the castle rail's cap. */
export const CASTLE_Y0 = 5.7;
export const CASTLE_Y1 = 12.3;
/** The liveries as their slices: `y0..y1` cut into `recs.length` bands of 64 rows each, `recs` top down. */
export const BANDS = Object.freeze({
  hullSide: Object.freeze({ y0: HULL_SIDE_Y0, y1: HULL_SIDE_Y1, recs: Object.freeze([TEX.hullSide0, TEX.hullSide1, TEX.hullSide2, TEX.hullSide3]) }),
  castle: Object.freeze({ y0: CASTLE_Y0, y1: CASTLE_Y1, recs: Object.freeze([TEX.castle0, TEX.castle1]) }),
  sternWindows: Object.freeze({ y0: CASTLE_Y0, y1: CASTLE_Y1, recs: Object.freeze([TEX.sternWindows0, TEX.sternWindows1]) }),
});
/** How far each tiling picture repeats (metres a tile, u then v) - world/galleonModel.js projects by these; a
 *  livery's (by its BANDS name) its u alone. GALLEON-2: the spar's, the iron's and the gilt's doubled with their
 *  pictures, so a texel is the size it was over a face and along a spar (AUDIT GN-R12: a prism takes no tile round it -
 *  its u wraps once round - so round a yard, a boom or a gun's barrel the texel halved; and a gun's barrel takes the
 *  iron a metre along, galleonModel.js gunGeometry). AUDIT GN-R8: the throats' planks two metres, as the strake's. */
export const GALLEON_TILE = Object.freeze({
  hullSide: [2.8, 0], hullBottom: [2, 2], hullInner: [2, 2], deck: [2, 2], trim: [2, 2], castle: [2.6, 0], sternWindows: [2.6, 0],
  spar: [2, 2], iron: [2, 2], canvas: [0, 0], rope: [0, 0.5], gilt: [1, 1], grate: [1, 1], lid: [0, 0], door: [0, 0],
  beams: [2, 2], dark: [2, 2], underDeck: [2, 2],
});

/** DF-ART: the Daggerfall record each of her records wears (world/classicArt.js DF), by record. */
export const GALLEON_SOURCES = Object.freeze({
  [TEX.hullSide0]: DF.hullPlanks, [TEX.hullSide1]: DF.hullPlanks, [TEX.hullSide2]: DF.hullPlanks, [TEX.hullSide3]: DF.tarred,
  [TEX.hullBottom]: DF.tarred, [TEX.hullInner]: DF.oakPale, [TEX.deck]: DF.deck, [TEX.trim]: DF.oakDark,
  [TEX.castle0]: DF.panel, [TEX.castle1]: DF.panel, [TEX.sternWindows0]: DF.window, [TEX.sternWindows1]: DF.window,
  [TEX.spar]: DF.spar, [TEX.iron]: DF.iron, [TEX.canvas]: DF.sailcloth, [TEX.rope]: DF.rope, [TEX.gilt]: DF.gold,
  [TEX.grate]: DF.grating, [TEX.lid]: DF.hatch, [TEX.door]: DF.door, [TEX.beams]: DF.beam, [TEX.dark]: DF.tarred,
  [TEX.underDeck]: DF.underDeck,
});

const _art = classicStandIns({ archive: GALLEON_ARCHIVE, name: 'galleon', sources: GALLEON_SOURCES, glowRecs: BANDS.sternWindows.recs });
/** A record's night glow (its emission mask, top-down like its picture), or null: the stern gallery's panes alone, cut
 *  from the Daggerfall window when her pictures are built (the pool's preload builds them - AUDIT GN2-PF3). */
export const galleonGlow = (/** @type {number} */ record) => _art.glow(record);

let _registered = false;
/**
 * Once: every record on the texture door as a STAND-IN of GALLEON_ARCHIVE, built from its Daggerfall record when the
 * archive is first asked for - so the boats' own upload path (scenes/comeSailAwayPool.js meshFor: getTexture, then
 * uploadRecord) draws her as it draws every hull, and a loose pack's `38131_<record>-0.png` still overrides a record.
 * `addVendorTextures` is handed in (systems/textureReplacement.js's). Returns how many were registered (0 the second time).
 * @param {(entries: any[]) => number} addVendorTextures
 */
export function registerGalleonArt(addVendorTextures) {
  if (_registered) return 0;
  _registered = true;
  return addVendorTextures(_art.entries);
}
/** Test seam: unregistered, her glow forgotten (AUDIT GN2-PF3). */
export function _resetGalleonArt() { _registered = false; _art.reset(); }
/** Test seam (AUDIT GN2-PF3): whether her glow is cut. */
export const _galleonGlowMade = () => BANDS.sternWindows.recs.some((r) => _art.glow(r) != null);
