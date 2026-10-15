// WD3 (2026-10-01): THE PICTURES THE STAND-INS' HANGINGS AND RUGS WEAR.
//
// Daggerfall Expanded Textures hangs tapestries and banners - a region's, a god's, a pattern's - and Rosy's
// Resources lays rugs; Beautiful Villages and Beautiful Cities place them by the hundred, and Detailed Ships flies
// four from its masts and beams. None of it is the port's to carry (its paintings the painting stand-ins wear
// Daggerfall's own for - world/townStandIns.js).
//
// DF-ART (2026-10-14, Mac: "For all textures you implemented that are AI (Ships, wagons, caravans, etc) I want to
// instead use daggerfall textures instead of AI generated"): DAGGERFALL'S OWN CLOTH. They were the port's own drawings
// (a woven field, a border, a region's charge or a god's sign); each record now names the Daggerfall record it wears
// (world/classicArt.js DF), read from the player's own ARENA2 as any classic texture is: a region's or a god's hanging
// one of Daggerfall's eight heraldic tapestries (TEXTURE.057 - the dragon for Akatosh, the raven for Kynareth, the lamps
// for Julianos, the moon for Lainlyn's crescent), a decorative one or a small hanging one of its woven patterns
// (TEXTURE.049), a rug its woven rug (TEXTURE.371) or a pattern, the leaves its green growth.
//
// One archive, `TOWN_PICTURE_ARCHIVE`, past every classic and mod archive the port knows; each record a picture
// (`TOWN_PICTURES`, by record). The models that wear them name (archive, record) as any model names a classic
// texture, so they upload through the same door (systems/textureReplacement.js, `standIn` entries built here).

import { DF, classicPicture } from './classicArt.js';

export const TOWN_PICTURE_ARCHIVE = 38202;

// Each region's hanging, and each of the Eight's, by the heraldry nearest its own (Daggerfall paints no region a
// banner, and the faiths' colours as the temples wear them nowhere in data).
const REGION = Object.freeze({
  Glenpoint: DF.tapestryLion,
  Totambu: DF.tapestryFire,
  Lainlyn: DF.tapestryMoon,
  Santaki: DF.tapestryDragon,
  'Abibon-Gora': DF.tapestryOrbs,
});
const DIVINE = Object.freeze({
  Akatosh: DF.tapestryDragon,
  Arkay: DF.tapestryOrbs,
  Dibella: DF.tapestryFlowers,
  Julianos: DF.tapestryLamps,
  Kynareth: DF.tapestryRaven,
  Zenithar: DF.tapestryLion,
  Mara: DF.tapestryMoon,
  Stendarr: DF.tapestryFire,
});
const DIVINE_ORDER = Object.freeze(['Akatosh', 'Arkay', 'Dibella', 'Julianos', 'Kynareth', 'Zenithar', 'Mara', 'Stendarr']);
/** The decorative hangings: Daggerfall's woven patterns, in the order of the fields the drawn ones wore. */
const DECOR = Object.freeze([
  DF.wovenRed, DF.wovenBlue, DF.wovenForest, DF.wovenBrown, DF.wovenChequer, DF.wovenMoss, DF.wovenRed, DF.wovenChequer,
  DF.wovenBlue, DF.wovenTan, DF.wovenMoss, DF.wovenGreen, DF.wovenGold, DF.wovenTan,
]);
const RUGS = Object.freeze([DF.rug, DF.wovenBlue, DF.wovenBrown, DF.wovenForest]);

/** A banner's picture: the middle half of its hanging's tapestry (TEXTURE.057's are 128 square), so a banner's tall
 *  cloth wears its charge whole rather than squeezed to a third of its width. */
const bannerOf = (tapestry) => Object.freeze({ from: tapestry, crop: Object.freeze([32, 0, 95, 127]) });

/** Every picture of the archive, by record: `{ name, from }` - its Daggerfall record (world/classicArt.js DF), or a
 *  banner's cut of one; the record numbers are the models' (a fixed table). */
export const TOWN_PICTURES = Object.freeze([
  ...Object.entries(REGION).map(([name, from]) => ({ name: `tapestry of ${name}`, from })),        // 0-4
  ...Object.entries(REGION).map(([name, from]) => ({ name: `banner of ${name}`, from: bannerOf(from) })),   // 5-9
  ...DIVINE_ORDER.map((god) => ({ name: `tapestry of ${god}`, from: DIVINE[god] })),               // 10-17
  ...DIVINE_ORDER.map((god) => ({ name: `banner of ${god}`, from: bannerOf(DIVINE[god]) })),       // 18-25
  ...DECOR.map((from, k) => ({ name: `decorative tapestry ${k + 1}`, from })),                     // 26-39
  ...RUGS.map((from, k) => ({ name: `rug ${k + 1}`, from })),                                      // 40-43
  { name: 'leaves', from: DF.grass },                                                             // 44
  ...DECOR.slice(0, 3).map((from, k) => ({ name: `small hanging ${k + 1}`, from })),               // 45-47
]);
/** Record numbers by what they are - the models' side of the table above. */
export const PICTURE = Object.freeze({
  regionTapestry: (name) => Object.keys(REGION).indexOf(name),
  regionBanner: (name) => 5 + Object.keys(REGION).indexOf(name),
  divineTapestry: (god) => 10 + DIVINE_ORDER.indexOf(god),
  divineBanner: (god) => 18 + DIVINE_ORDER.indexOf(god),
  decorative: (k) => 26 + (k % DECOR.length),
  rug: (k) => 40 + (k % RUGS.length),
  leaves: 44,
  smallHanging: (k) => 45 + (k % 3),
});

/** The texture door's entries for the whole archive, each read from the player's own ARENA2 and behind `gate`. */
export function townPictureEntries(gate) {
  return TOWN_PICTURES.map((p, record) => ({
    archive: TOWN_PICTURE_ARCHIVE, record, fileName: `town-picture-${record}`, standIn: true, gate,
    build: async (/** @type {any} */ ctx) => classicPicture(p.from, ctx.classicRgba),
  }));
}
