// @ts-check
// WAGONS1 (2026-10-09, Mac, sending his three wagons: "Here are 3 new models that will need to be textured"): THE
// WAGONS' PICTURES.
//
// DF-ART (2026-10-14, Mac: "For all textures you implemented that are AI (Ships, wagons, caravans, etc) I want to
// instead use daggerfall textures instead of AI generated"): Mac's Wagon Cart, Open Wagon and Caravan wear DAGGERFALL'S
// OWN TEXTURES now (world/classicArt.js DF), each record of their pseudo-archive (WAGON_ARCHIVE) read from the player's
// ARENA2 where it was painted here from noise: plank boards for the bed and the sides, Daggerfall's woods for the running
// gear, its spoked wheel, iron, the sails' cloth for the tilt. The records, the liveries' bands and the tiles are
// unchanged, so no face moves. The caravan's walls are one of Daggerfall's flat colour swatches with ITS OWN leaded
// window laid in where the painted one stood - the glass between the leads cut out, so the room is still seen through
// it and the world from the room (WAGONS2, Mac: "allowing players to see inside/outside of house windows + the new
// wagon") - and its door on the rear, inside and out (classicArt.js composedPicture). Gone, as Mac chose: the painted
// livery (its oxblood skirt and gilt lines, its shutters, curtains and sunburst). A LOOK (WAGONS2, systems/wagonLooks.js)
// is a Daggerfall picture too: a paint one of its flat colour swatches (TEXTURE.000/.001), a dyed tilt one of its woven
// fabrics (TEXTURE.049), a floor its woods, rugs or chequered tiles, a ceiling its boards, plaster or night.
// Not a DFU member. Ledger A (WAGONS1).
import { DF } from './classicArt.js';

/** The wagons' pseudo-archive: past the large boat's 38171 (38151 collided once - largeBoatArt.js). */
export const WAGON_ARCHIVE = 38181;
/** The records, each a picture. */
export const TEX = Object.freeze({
  floor: 0, side: 1, inner: 2, beam: 3, bench: 4, tyre: 5, wheel: 6, iron: 7,
  openSide: 8, tilt: 9, tiltInner: 10,
  caravanSide: 11, caravanFront: 12, caravanRear: 13, caravanRoof: 14,
  roomSide: 15, roomFront: 16, roomRear: 17, roomCeiling: 18, roomFloor: 19,   // WAGONS2: the caravan's room (world/caravanRoomModel.js)
  harness: 20,   // WAGONS3: the traces and the reins (systems/wagonRopes.js)
});
/** How far each tiling picture repeats (metres a tile, u then v - world/galleonMesh.js planarUv's); a livery's u alone
 *  (its v is its height, `BANDS`); 0 where the picture is laid whole on its face (a wheel's, an end's). */
export const WAGON_TILE = Object.freeze({
  floor: [1.6, 1.6], side: [1.6, 1.6], inner: [1.6, 1.6], beam: [1.2, 1.2], bench: [1.2, 1.2], tyre: [1.2, 1.2], wheel: [0, 0],
  iron: [1, 1], openSide: [1.3, 0], tilt: [1.3, 1.3], tiltInner: [1.3, 1.3], caravanSide: [2.9, 0], caravanFront: [0, 0],
  caravanRear: [0, 0], caravanRoof: [1.6, 1.6],
  roomSide: [2.9, 0], roomFront: [0, 0], roomRear: [0, 0], roomCeiling: [1.6, 1.6], roomFloor: [1.6, 1.6],
  harness: [0, 0.5],   // WAGONS3: round the strap once, half a metre of it a tile along it
});
/** The two sides' liveries: one slice each over the wagons' side walls' height (both bodies stand 0.94 to 3.06 m - the
 *  bake's, test/wagons1.test.js pins it), `recs` top down. */
export const SIDE_Y0 = 0.94, SIDE_Y1 = 3.06;
export const BANDS = Object.freeze({
  openSide: Object.freeze({ y0: SIDE_Y0, y1: SIDE_Y1, recs: Object.freeze([TEX.openSide]) }),
  caravanSide: Object.freeze({ y0: SIDE_Y0, y1: SIDE_Y1, recs: Object.freeze([TEX.caravanSide]) }),
  roomSide: Object.freeze({ y0: SIDE_Y0, y1: SIDE_Y1, recs: Object.freeze([TEX.roomSide]) }),   // WAGONS2: on the caravan's side's own heights, so the windows meet
});
/** A livery's row for a height over the wagon's side, in its 64-texel layout (`SIDE_Y0` its foot, row 63; `SIDE_Y1`
 *  its head, row 0). */
export const sideRow = (y) => Math.max(0, Math.min(63, Math.round(((SIDE_Y1 - y) / (SIDE_Y1 - SIDE_Y0)) * 63)));
/** An end's row for a height (the end runs 0.94 - row 63 - to 3.52 - row 0; world/wagonModels.js endUv lays it so). */
export const endRow = (y) => Math.max(0, Math.min(63, Math.round(((3.52 - y) / (3.52 - 0.94)) * 63)));
/** The caravan side's skirt and cornice heights (m over the ground) - its window stands centred between them. */
export const CARAVAN_SKIRT_Y = 1.32, CARAVAN_CORNICE_Y = 2.86;
/** The caravan's side window, in its side's picture's layout (and its room's - the two meet): rows top to bottom,
 *  columns. WAGON-UV (2026-10-10, from play: "the windows on the wagon arent centered properly"): its 0.84 m centred
 *  between the skirt and the cornice. */
export const CARAVAN_SIDE_WINDOW = Object.freeze({
  y0: sideRow((CARAVAN_SKIRT_Y + CARAVAN_CORNICE_Y + 0.84) / 2), y1: sideRow((CARAVAN_SKIRT_Y + CARAVAN_CORNICE_Y - 0.84) / 2), x0: 22, x1: 42,
});
/** The side window's middle across its picture (u: texel x spans x/64 to (x+1)/64) - where world/wagonModels.js
 *  caravanSideU stands each window's middle on the side. */
export const CARAVAN_SIDE_WINDOW_U = (CARAVAN_SIDE_WINDOW.x0 + CARAVAN_SIDE_WINDOW.x1 + 1) / 2 / 64;
/** The front's window, high in the end over the driver's head, in the front end's layout (and its room's): 0.77 m by
 *  0.57 m about where the painted round window's middle stood (2.55 m). */
export const CARAVAN_FRONT_WINDOW = Object.freeze({ y0: endRow(2.55) - 7, y1: endRow(2.55) + 6, x0: 23, x1: 40 });
/** The rear's door, in the rear end's layout (and its room's): 0.86 m wide by 1.95 m, from its sill on the floor. */
export const CARAVAN_DOOR = Object.freeze({ y0: endRow(2.9), y1: endRow(0.98), x0: 22, x1: 42 });
/** Daggerfall's leaded window (DF.window - a timber-framed window over plaster) as a caravan's: its frame and its left
 *  half to the mullion (columns 0-37, rows 0-57: the plaster under it left off), made whole by its mirror, its glass a
 *  hole. */
export const LEADED_WINDOW = Object.freeze({ from: DF.window, crop: Object.freeze([0, 0, 37, 57]), mirror: true, glass: true });
/** A caravan wall's picture (classicArt.js composedPicture): `body` laid whole, the window or the door `rec` holds laid
 *  in where the caravan's stands. */
export function caravanWall(rec, body) {
  const base = rec % LOOK_RECORD_STRIDE;
  if (base === TEX.caravanSide || base === TEX.roomSide) return Object.freeze({ body, insets: Object.freeze([{ ...LEADED_WINDOW, at: CARAVAN_SIDE_WINDOW }]) });
  if (base === TEX.caravanFront || base === TEX.roomFront) return Object.freeze({ body, insets: Object.freeze([{ ...LEADED_WINDOW, at: CARAVAN_FRONT_WINDOW }]) });
  return Object.freeze({ body, insets: Object.freeze([{ from: DF.door, at: CARAVAN_DOOR }]) });
}
/** Which of the wagons' pictures have glass in them - uploaded as cut-outs, so the eye sees through their windows
 *  (a built record, or any choice's - LOOK_RECORD_STRIDE apart). */
export const isGlassRecord = (rec) => /** @type {number[]} */ ([TEX.caravanSide, TEX.caravanFront, TEX.roomSide, TEX.roomFront]).includes(rec % LOOK_RECORD_STRIDE);

/** How far a look's records stand from the built ones' (a record `r` painted with a list's `i`th choice is
 *  `r + LOOK_RECORD_STRIDE * i`; the built choice, 0, is `r` itself). */
export const LOOK_RECORD_STRIDE = 100;
/** Which built records each paint repaints: a kind's outside, and the caravan's inside parts. */
export const LOOK_RECORDS = Object.freeze({
  cart: Object.freeze([TEX.side]),
  openWagon: Object.freeze([TEX.openSide, TEX.tilt, TEX.tiltInner]),
  caravan: Object.freeze([TEX.caravanSide, TEX.caravanFront, TEX.caravanRear, TEX.caravanRoof]),
  walls: Object.freeze([TEX.roomSide, TEX.roomFront, TEX.roomRear]),
  floor: Object.freeze([TEX.roomFloor]),
  ceiling: Object.freeze([TEX.roomCeiling]),
});
/** The record `rec` wears under choice `i`. */
export const lookRecord = (rec, i) => rec + LOOK_RECORD_STRIDE * (Number.isInteger(i) && i > 0 ? i : 0);

/** DF-ART: the Daggerfall record each built record wears (world/classicArt.js DF) - or, a caravan wall, its composed
 *  picture (`caravanWall`). */
export const WAGON_SOURCES = Object.freeze({
  [TEX.floor]: DF.deck, [TEX.side]: DF.hullPlanks, [TEX.inner]: DF.oakPale, [TEX.beam]: DF.oakDark, [TEX.bench]: DF.board,
  [TEX.tyre]: DF.ironGrey, [TEX.wheel]: DF.wheel, [TEX.iron]: DF.iron, [TEX.openSide]: DF.sailcloth, [TEX.tilt]: DF.sailcloth,
  [TEX.tiltInner]: DF.sailcloth, [TEX.caravanSide]: caravanWall(TEX.caravanSide, DF.paintGreen),
  [TEX.caravanFront]: caravanWall(TEX.caravanFront, DF.paintGreen), [TEX.caravanRear]: caravanWall(TEX.caravanRear, DF.paintGreen),
  [TEX.caravanRoof]: DF.paintGreen, [TEX.roomSide]: caravanWall(TEX.roomSide, DF.paintGreen),
  [TEX.roomFront]: caravanWall(TEX.roomFront, DF.paintGreen), [TEX.roomRear]: caravanWall(TEX.roomRear, DF.paintGreen),
  [TEX.roomCeiling]: DF.hullPlanks, [TEX.roomFloor]: DF.deck, [TEX.harness]: DF.leather,
});

/** DF-ART: each look's Daggerfall record, by its name (systems/wagonLooks.js WAGON_OUTSIDE_LOOKS / CARAVAN_INSIDE_LOOKS):
 *  a paint, a dyed cloth, a floor, a ceiling. */
export const LOOK_PICTURES = Object.freeze({
  paint: Object.freeze({ oak: DF.oak, red: DF.paintRed, blue: DF.paintBlue, green: DF.paintGreen, black: DF.paintBlack, white: DF.paintWhite, ochre: DF.paintOchre, oxblood: DF.paintOxblood, whitewash: DF.whitewash }),
  cloth: Object.freeze({ cream: DF.sailcloth, red: DF.clothRed, blue: DF.clothBlue, green: DF.clothGreen, ochre: DF.clothOchre, black: DF.paintBlack }),
  floor: Object.freeze({ pine: DF.deck, oak: DF.oak, dark: DF.tarred, redRug: DF.clothRed, blueRug: DF.clothBlue, checker: DF.checker }),
  ceiling: Object.freeze({ boards: DF.hullPlanks, whitewash: DF.whitewash, night: DF.nightSky, green: DF.paintGreen, oak: DF.oak, ochre: DF.paintOchre }),
});

/**
 * WAGONS2: THE RECORDS A LOOK WEARS - `{ [record]: Daggerfall source }` for a list's `i`th choice (systems/wagonLooks.js):
 * `list` a kind (its outside) or one of the caravan's inside parts ('walls', 'floor', 'ceiling'), `name` the choice's
 * name. The built choice (0) wears the built records (WAGON_SOURCES) and names none here. A caravan's walls keep their
 * window and their door whatever the paint (`caravanWall`).
 */
export function wagonLookSources(list, i, name) {
  if (!(Number.isInteger(i) && i > 0) || !LOOK_RECORDS[list]) return {};
  const r = (rec) => lookRecord(rec, i);
  const paint = LOOK_PICTURES.paint[name] ?? DF.paintGreen;
  if (list === 'cart') return { [r(TEX.side)]: paint };
  if (list === 'openWagon') { const c = LOOK_PICTURES.cloth[name] ?? DF.sailcloth; return { [r(TEX.openSide)]: c, [r(TEX.tilt)]: c, [r(TEX.tiltInner)]: c }; }
  if (list === 'caravan') return { [r(TEX.caravanSide)]: caravanWall(TEX.caravanSide, paint), [r(TEX.caravanFront)]: caravanWall(TEX.caravanFront, paint), [r(TEX.caravanRear)]: caravanWall(TEX.caravanRear, paint), [r(TEX.caravanRoof)]: paint };
  if (list === 'walls') return { [r(TEX.roomSide)]: caravanWall(TEX.roomSide, paint), [r(TEX.roomFront)]: caravanWall(TEX.roomFront, paint), [r(TEX.roomRear)]: caravanWall(TEX.roomRear, paint) };
  if (list === 'floor') return { [r(TEX.roomFloor)]: LOOK_PICTURES.floor[name] ?? DF.deck };
  return { [r(TEX.roomCeiling)]: LOOK_PICTURES.ceiling[name] ?? DF.hullPlanks };
}
