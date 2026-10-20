// @ts-check
// STAR7 (2026-10-20): STARGLASS - pale glass from a fallen star that still holds some of its light, one to three pieces in
// every held star's spoils (the Heart-Star's twice that; systems/starfall/starSpoils.js). Template 576 (starglassRow.js -
// the leaf the item law reads headless), miscellany, stacked, traded freely, and a good price at any counter: the star's
// glass is a thing the Mages Guild buys and the covens want back. Design: bible/11-Multiplayer/Starfall.md section 6.
//
// ITS PICTURE is its own (world/starfall/starglassArt.js), put on the texture door at this file's import as its archive's
// stand-in, so every door that draws an item's picture draws it (the Weir Key's law, systems/eliteGates/weirKey.js).
//
// Not a DFU member. Ledger A (STARFALL).
import { registerCustomTemplates, setItemFields, mintCondition } from '../item/itemTemplates.js';
import { addVendorTextures } from '../textureReplacement.js';
import { STARGLASS_ART, registerStarglassArt } from '../../world/starfall/starglassArt.js';
import { STARGLASS_TEMPLATE, STARGLASS_LAW_ROW } from './starglassRow.js';
export { STARGLASS_TEMPLATE };

/** Its row: the leaf's with its name and its picture. */
export const STARGLASS_ROW = Object.freeze({
  ...STARGLASS_LAW_ROW, name: 'Starglass', worldTextureArchive: STARGLASS_ART.archive, worldTextureRecord: STARGLASS_ART.record,
});
registerCustomTemplates([STARGLASS_ROW]);
registerStarglassArt(addVendorTextures);   // the import IS the registration
/** Whether a record is Starglass - its template and its group, the one spelling every rule reads. */
export const isStarglass = (/** @type {any} */ item) => item?.templateIndex === STARGLASS_TEMPLATE && item?.group === 'UselessItems2';
/** `n` pieces of Starglass (at least one), one stack, minted on their own row. */
export function starglass(n = 1) {
  return Object.assign(mintCondition(setItemFields({ group: 'UselessItems2', templateIndex: STARGLASS_TEMPLATE })), { stackCount: Math.max(1, Math.trunc(Number(n) || 1)) });
}
