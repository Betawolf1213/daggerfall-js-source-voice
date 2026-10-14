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
//   the SIGNBOARDS - each a board of Daggerfall's planks with the yard's word lettered on it in the sign-painter's
//   capitals (Mac: "Bring back the sign text" - `signSource`); the Joinery's carries Daggerfall's own shop sign of an
//   axe and a sword (333) beside its word.
//   CARP-YARD's: the floor's SHAVINGS straw's pale curls, the logs' BARK and their END GRAIN (a sawn log's rings).
//
// Not a DFU member. Ledger A (MERCHANT-YARDS).
import { DF } from './classicArt.js';
import { YARD_KINDS } from '../systems/merchantYards.js';

/** The pseudo-archive the yards' pictures stand under (world/lefayMonument.js LEFAY_ARCHIVE's neighbour). */
export const YARD_ARCHIVE = 38221;
/** Its records. */
export const YARD_REC = Object.freeze({
  wood: 0, plank: 1, shingle: 2, hay: 3, dirt: 4, gravel: 5, water: 6, iron: 7, signStable: 8, signTransport: 9,
  signCarpenter: 10, shavings: 11, endgrain: 12, bark: 13,   // CARP-YARD: the joinery's
});

// ── THE SIGNBOARDS ───────────────────────────────────────────────────────────────────────────────────────────────
/** A signboard's picture, texels (world/merchantYardModels.js SIGN_BOARD is its shape: 1.6 m by 0.7). */
export const SIGN_ART_W = 224;
export const SIGN_ART_H = 96;
/** THE SIGN-PAINTER'S LETTERS: rounded capitals five texels wide and seven high, one row a string, `#` painted. Only the
 *  letters a yard's word needs are drawn - SHIPYARDS: and the port's boards' (SHIPS, CREW, world/portArt.js); signGlyph
 *  answers null for any other (the tests hold every word to them). */
export const SIGN_GLYPHS = Object.freeze({
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],   // SHIPYARDS: the port's boards' letters (world/portArt.js)
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  J: ['..###', '....#', '....#', '....#', '#...#', '#...#', '.###.'],   // CARP-YARD: JOINERY's
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],   // CARP-YARD: JOINERY's
});
export const SIGN_GLYPH_W = 5;
export const SIGN_GLYPH_H = 7;
/** A letter's glyph, or null. */
export const signGlyph = (ch) => SIGN_GLYPHS[ch] ?? null;
/** The scale the yard's word is painted at, texels a glyph texel. */
export const SIGN_LETTER_SCALE = 3;
/** The emblem's square on the board's left, texels - where a board that carries one (the Joinery's) stands it. */
export const SIGN_EMBLEM = 80;
/** The sign-painter's cream, and the shadow it throws a texel down and right. */
export const SIGN_PAINT = Object.freeze([232, 214, 166]);
export const SIGN_PAINT_SHADOW = Object.freeze([26, 16, 10]);
/** The texels a word covers on a board `W` x `H`: SIGN_GLYPHS at SIGN_LETTER_SCALE, centred across the board, or across
 *  its right part when an emblem stands at its left (`left` SIGN_EMBLEM). */
export function wordCells(word, W = SIGN_ART_W, H = SIGN_ART_H, left0 = 0) {
  const s = SIGN_LETTER_SCALE, width = (word.length * (SIGN_GLYPH_W + 1) - 1) * s;
  const left = left0 ? left0 + Math.round((W - left0 - 8 - width) / 2) : Math.round((W - width) / 2), top = Math.round((H - SIGN_GLYPH_H * s) / 2);
  const cells = [];
  [...word].forEach((ch, k) => {
    const g = signGlyph(ch);
    if (!g) return;
    for (let gy = 0; gy < SIGN_GLYPH_H; gy++) for (let gx = 0; gx < SIGN_GLYPH_W; gx++) {
      if (g[gy][gx] !== '#') continue;
      for (let sy = 0; sy < s; sy++) for (let sx = 0; sx < s; sx++) cells.push([left + (k * (SIGN_GLYPH_W + 1) + gx) * s + sx, top + gy * s + sy]);
    }
  });
  return cells;
}
/** A word lettered on a board's picture (top-down, `data`): its shadow a texel down and right, then the cream over it. */
export function paintWord(/** @type {{width:number,height:number,data:Uint8Array}} */ pic, word, left0 = 0) {
  const cells = wordCells(word, pic.width, pic.height, left0);
  const put = (x, y, c) => { if (x < 0 || y < 0 || x >= pic.width || y >= pic.height) return; pic.data.set(c, (y * pic.width + x) * 4); };
  for (const [x, y] of cells) put(x + 1, y + 1, SIGN_PAINT_SHADOW);
  for (const [x, y] of cells) put(x, y, SIGN_PAINT);
}
/** A SIGNBOARD's source (world/classicArt.js composedPicture): Daggerfall's planks repeated over the board at their own
 *  texel size, an `emblem` (a Daggerfall record) at its left if it carries one, and `word` lettered on it. Row 0 is the
 *  board's top (world/merchantYardModels.js maps its faces so). */
export function signSource(word, emblem = null) {
  return Object.freeze({
    body: DF.hullPlanks, size: Object.freeze([SIGN_ART_W, SIGN_ART_H]), tile: true,
    insets: Object.freeze(emblem ? [Object.freeze({ from: emblem, px: Object.freeze({ x0: 6, y0: 29, x1: SIGN_EMBLEM + 1, y1: 66 }) })] : []),
    paint: (/** @type {any} */ pic) => paintWord(pic, word, emblem ? SIGN_EMBLEM : 0),
  });
}

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
  [YARD_REC.signStable]: signSource(YARD_KINDS.stable.sign),
  [YARD_REC.signTransport]: signSource(YARD_KINDS.transport.sign),
  [YARD_REC.signCarpenter]: signSource(YARD_KINDS.carpenter.sign, DF.toolsSign),
  [YARD_REC.shavings]: DF.straw,
  [YARD_REC.endgrain]: DF.endGrain,
  [YARD_REC.bark]: DF.bark,
});
