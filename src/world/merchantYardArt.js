// @ts-check
// MERCHANT-YARDS (2026-10-10): THE YARDS' PICTURES - every picture the Stable, the Wagon Yard and (CARP-YARD) the
// Joinery wear (world/merchantYardModels.js), under the pseudo-archive YARD_ARCHIVE, far above any classic one.
//
// DF-ART (2026-10-14, Mac: "For all textures you implemented that are AI (Ships, wagons, caravans, etc) I want to
// instead use daggerfall textures instead of AI generated"): DAGGERFALL'S OWN. They were painted here from noise and
// drawn shapes; each record now names the Daggerfall record it wears (world/classicArt.js DF), read from the player's
// own ARENA2 when a host stands a yard (scenes/merchantYardsHost.js):
//
//   wood     - fence posts and rails: Daggerfall's weathered wood (067).
//   plank    - the sheds' walls: a building's planking (054).
//   shingle  - the sheds' roofs: wooden shingles (054).
//   hay      - the bales and the pile: thatch's straw (169).
//   dirt     - the paddock's floor: bare earth (302).
//   gravel   - the wagon yard's floor: grey stones (302).
//   water    - the trough: open water (302).
//   iron     - brackets and tyres: iron (000 - Come Sail Away's anchors').
//   the SIGNBOARDS - the Joinery's is Daggerfall's own shop sign of an axe and a sword (333); Daggerfall has no
//   stable's or wagon yard's sign, so those two are plain boards (Mac chose: the painted name boards go).
//   CARP-YARD's: the floor's SHAVINGS straw's pale curls, the logs' BARK and their END GRAIN (a sawn log's rings).
//
// Not a DFU member. Ledger A (MERCHANT-YARDS).
import { DF } from './classicArt.js';

/** The pseudo-archive the yards' pictures stand under (world/lefayMonument.js LEFAY_ARCHIVE's neighbour). */
export const YARD_ARCHIVE = 38221;
/** Its records. */
export const YARD_REC = Object.freeze({
  wood: 0, plank: 1, shingle: 2, hay: 3, dirt: 4, gravel: 5, water: 6, iron: 7, signStable: 8, signTransport: 9,
  signCarpenter: 10, shavings: 11, endgrain: 12, bark: 13,   // CARP-YARD: the joinery's
});

/** DF-ART: the Daggerfall record each of the yards' records wears (world/classicArt.js DF) - what a host reads and
 *  uploads under YARD_ARCHIVE before it draws (world/classicArt.js classicPictures). */
export const YARD_SOURCES = Object.freeze({
  [YARD_REC.wood]: DF.weathered,
  [YARD_REC.plank]: DF.barnPlanks,
  [YARD_REC.shingle]: DF.shingles,
  [YARD_REC.hay]: DF.straw,
  [YARD_REC.dirt]: DF.dirt,
  [YARD_REC.gravel]: DF.gravel,
  [YARD_REC.water]: DF.water,
  [YARD_REC.iron]: DF.iron,
  [YARD_REC.signStable]: DF.board,
  [YARD_REC.signTransport]: DF.board,
  [YARD_REC.signCarpenter]: DF.toolsSign,
  [YARD_REC.shavings]: DF.straw,
  [YARD_REC.endgrain]: DF.endGrain,
  [YARD_REC.bark]: DF.bark,
});
