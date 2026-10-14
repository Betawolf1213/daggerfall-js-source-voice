// @ts-check
// SHIPYARDS (2026-10-11): THE PORT'S PICTURES - every picture the shipyard and the lighthouse wear
// (world/shipyardModel.js, world/lighthouseModel.js), under the pseudo-archive PORT_ARCHIVE.
//
// DF-ART (2026-10-14, Mac: "For all textures you implemented that are AI (Ships, wagons, caravans, etc) I want to
// instead use daggerfall textures instead of AI generated"): DAGGERFALL'S OWN. They were painted here from noise and
// drawn shapes; each record now names the Daggerfall record it wears (world/classicArt.js DF), read from the player's
// own ARENA2 when a host stands a port (scenes/portHost.js). Records 0-7 are the yards' materials, the same Daggerfall
// records the Stable and the Wagon Yard wear (world/merchantYardArt.js YARD_SOURCES), so the face kit the port's models
// share with the yards (world/merchantYardModels.js) dresses a post or a sign's edge alike under either archive. Then
// the port's own:
//
//   stone     - the lighthouse's tower, its parapet and its lantern, and the yards' walls: coursed grey stone (324).
//   whitewash - the keeper's cottage: pale lime (041).
//   slate     - the cottage's roof: slates (054).
//   glass     - the shipyard office lantern's panes: a pale warm yellow (000).
//   window    - a window: Daggerfall's leaded window in its timber frame (054), made whole by its mirror.
//   rope      - hemp: Come Sail Away's rope (085).
//   canvas    - sailcloth: Come Sail Away's sails' (050).
//   tar       - tarred timber and the pitch barrels: the darkest of the 067 woods.
//   sawdust   - the shipyard's floor: sandy earth (302).
//   hull      - the hull on the stocks: Come Sail Away's hull planking (050).
//   cobble    - the lighthouse's yard: a street's cobbles (085).
//   door      - Come Sail Away's door (074).
//   notices   - the crew hall's board: a parchment notice (086).
//   brass     - the ship's bell: plain gold (000).
//   flame     - BEACON-TOWER: the beacon's fire - Daggerfall's brazier fire (210), its flames cut from over its bowl, on
//               nothing: a cutout (`PORT_HOW`), and its own light.
//   embers    - BEACON-TOWER: the brazier's coals - banked fire (356), their own light.
//   the SIGNBOARDS - the yards' boards (merchantYardArt.js signSource): Daggerfall's planks, SHIPS and CREW lettered
//   on them (Mac: "Bring back the sign text").
//
// Not a DFU member. Ledger A (SHIPYARDS).
import { YARD_REC, YARD_SOURCES, signSource } from './merchantYardArt.js';
import { PORT_PLACES } from '../systems/portPlaces.js';
import { DF } from './classicArt.js';

/** The pseudo-archive the port's pictures stand under (the yards' neighbour, world/merchantYardArt.js YARD_ARCHIVE). */
export const PORT_ARCHIVE = 38231;
/** Its records: the yards' materials at the yards' own records, then the port's. */
export const PORT_REC = Object.freeze({
  wood: YARD_REC.wood, plank: YARD_REC.plank, shingle: YARD_REC.shingle, hay: YARD_REC.hay, dirt: YARD_REC.dirt,
  gravel: YARD_REC.gravel, water: YARD_REC.water, iron: YARD_REC.iron,
  stone: 10, whitewash: 11, slate: 13, glass: 14, window: 15, rope: 16, canvas: 17, tar: 18,
  sawdust: 20, hull: 21, cobble: 22, door: 23, notices: 24, brass: 25, signShips: 26, signCrew: 27,
  flame: 28, embers: 29,   // BEACON-TOWER: the beacon's fire - the tower's red bands (12) and its dome's copper (19) went with the age of steam
});
/** DF-ART: the Daggerfall record each of the port's records wears (world/classicArt.js DF) - what a host reads and
 *  uploads under PORT_ARCHIVE before it draws (world/classicArt.js classicPictures). */
export const PORT_SOURCES = Object.freeze({
  [PORT_REC.wood]: YARD_SOURCES[YARD_REC.wood],
  [PORT_REC.plank]: YARD_SOURCES[YARD_REC.plank],
  [PORT_REC.shingle]: YARD_SOURCES[YARD_REC.shingle],
  [PORT_REC.hay]: YARD_SOURCES[YARD_REC.hay],
  [PORT_REC.dirt]: YARD_SOURCES[YARD_REC.dirt],
  [PORT_REC.gravel]: YARD_SOURCES[YARD_REC.gravel],
  [PORT_REC.water]: YARD_SOURCES[YARD_REC.water],
  [PORT_REC.iron]: YARD_SOURCES[YARD_REC.iron],
  [PORT_REC.stone]: DF.stoneBlocks,
  [PORT_REC.whitewash]: DF.whitewash,
  [PORT_REC.slate]: DF.slate,
  [PORT_REC.glass]: DF.lampGlass,
  [PORT_REC.window]: Object.freeze({ from: DF.window, crop: Object.freeze([0, 0, 37, 57]), mirror: true }),
  [PORT_REC.rope]: DF.rope,
  [PORT_REC.canvas]: DF.sailcloth,
  [PORT_REC.tar]: DF.tarred,
  [PORT_REC.sawdust]: DF.sand,
  [PORT_REC.hull]: DF.hullPlanks,
  [PORT_REC.cobble]: DF.cobbles,
  [PORT_REC.door]: DF.door,
  [PORT_REC.notices]: DF.notices,
  [PORT_REC.brass]: DF.giltPlain,
  [PORT_REC.signShips]: signSource(PORT_PLACES.shipyard.sign),
  [PORT_REC.signCrew]: signSource(PORT_PLACES.crewhall.sign),
  [PORT_REC.flame]: Object.freeze({ from: DF.fireFlat, crop: Object.freeze([0, 0, 39, 26]), clear: true }),   // the flames over the brazier's bowl (rows 27 on)
  [PORT_REC.embers]: DF.embers,
});
/** BEACON-TOWER: HOW A PICTURE IS UPLOADED where it is not as the rest - the flame a CUTOUT (renderer.uploadTexture's
 *  `cutout`: a texel under half alpha is a hole), and the fire's two their OWN LIGHT (renderer.uploadEmissionTexture,
 *  `white`: the picture is its own emission, as the gate's fires and the realm's lights are - lit at any hour, by
 *  nothing else's light). By record. */
export const PORT_HOW = Object.freeze({
  [PORT_REC.flame]: Object.freeze({ cutout: true, glows: true }),
  [PORT_REC.embers]: Object.freeze({ cutout: false, glows: true }),
});
