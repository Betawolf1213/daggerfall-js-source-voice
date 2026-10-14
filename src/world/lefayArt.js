// @ts-check
// LEFAY1 (2026-10-08): THE MONUMENT'S PICTURES - the stone of the monument to Julian LeFay (world/lefayMonument.js),
// under the pseudo-archive LEFAY_ARCHIVE.
//
// DF-ART (2026-10-14, Mac: "For all textures you implemented that are AI (Ships, wagons, caravans, etc) I want to
// instead use daggerfall textures instead of AI generated"): DAGGERFALL'S OWN. They were painted here from noise; each
// record now names the Daggerfall record it wears (world/classicArt.js DF), read from the player's own ARENA2 when the
// host stands the monument (scenes/lefayMonumentHost.js):
//
//   granite - the steps: dark speckled stone (341).
//   marble  - the pedestal and the obelisk: pale veined marble (341).
//   gilt    - the obelisk's point: plain gold (000).
//   plaque  - a riveted metal plate in its frame (371), resampled to the plaque's shape, the inscription
//             (LEFAY_TEXT.plaque) cut into it in square capitals - the name and the years twice the size of the two
//             lines under them. The letters are the memorial's words, not a picture of anything: they are cut into
//             Daggerfall's own metal (each cut texel its plate's own, darkened; its lip lightened), nothing painted.
//   bronze  - the plaque's edges: dull bronze (000).
//
// Not a DFU member. Ledger A (LEFAY).
import { LEFAY_GRANITE, LEFAY_MARBLE, LEFAY_GILT, LEFAY_PLAQUE, LEFAY_BRONZE, LEFAY_TEXT } from './lefayMonument.js';
import { DF, classicPictures, resample } from './classicArt.js';

/** DF-ART: the Daggerfall record each of the monument's records wears (world/classicArt.js DF) - what a host reads and
 *  uploads under LEFAY_ARCHIVE before it draws (world/classicArt.js classicPictures). */
export const LEFAY_SOURCES = Object.freeze({
  [LEFAY_GRANITE]: DF.granite,
  [LEFAY_MARBLE]: DF.marble,
  [LEFAY_GILT]: DF.giltPlain,
  [LEFAY_PLAQUE]: DF.plate,
  [LEFAY_BRONZE]: DF.bronze,
});

/** The plaque's picture, texels (its shape is the plaque's, world/lefayMonument.js PLAQUE: 1.0 m by 0.8). */
export const LEFAY_PLAQUE_W = 160;
export const LEFAY_PLAQUE_H = 128;

/** THE PLAQUE'S LETTERS: square capitals five texels wide and seven high, one row a string, `#` cut. Only the glyphs
 *  an inscription here needs are drawn; lefayGlyph answers null for any other (the test holds the plaque to them). */
export const LEFAY_GLYPHS = Object.freeze({
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
  9: ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
});
export const GLYPH_W = 5;
export const GLYPH_H = 7;
/** A character's glyph, or null. */
export const lefayGlyph = (ch) => LEFAY_GLYPHS[ch] ?? null;
/** A line's width in texels at `scale`: GLYPH_W + one texel between letters, each. */
export const lineWidth = (text, scale) => (text.length * (GLYPH_W + 1) - 1) * scale;
/** The plaque's lines: the first two at twice the size, the last two at the glyphs' own. */
export const PLAQUE_SCALES = Object.freeze([2, 2, 1, 1]);
/** How deep a cut reads: its floor its plate's own texel at this share of its light; its lip lifted this far toward white. */
export const CUT_FLOOR = 0.3;
export const CUT_LIP = 0.4;

/** Which texels of a W x H plaque the inscription cuts: 1 a cut, each line centred, stacked down the middle with a gap
 *  of their height's half between them. */
export function plaqueCuts(lines = LEFAY_TEXT.plaque, W = LEFAY_PLAQUE_W, H = LEFAY_PLAQUE_H) {
  const heights = lines.map((_, i) => GLYPH_H * (PLAQUE_SCALES[i] ?? 1));
  const gaps = heights.slice(1).map((h, i) => Math.round(Math.max(h, heights[i]) / 2) + 2);
  const total = heights.reduce((a, b) => a + b, 0) + gaps.reduce((a, b) => a + b, 0);
  let top = Math.round((H - total) / 2);
  const cut = new Uint8Array(W * H);
  lines.forEach((text, i) => {
    const s = PLAQUE_SCALES[i] ?? 1, left = Math.round((W - lineWidth(text, s)) / 2);
    [...text].forEach((ch, k) => {
      const g = lefayGlyph(ch);
      if (!g) return;
      for (let gy = 0; gy < GLYPH_H; gy++) for (let gx = 0; gx < GLYPH_W; gx++) {
        if (g[gy][gx] !== '#') continue;
        for (let sy = 0; sy < s; sy++) for (let sx = 0; sx < s; sx++) {
          const x = left + (k * (GLYPH_W + 1) + gx) * s + sx, y = top + gy * s + sy;
          if (x >= 0 && y >= 0 && x < W && y < H) cut[y * W + x] = 1;
        }
      }
    });
    top += heights[i] + (gaps[i] ?? 0);
  });
  return cut;
}

/** THE PLAQUE: Daggerfall's plate (`plate`, a top-down RGBA picture) laid whole over the plaque's shape and the
 *  inscription cut into it - a cut texel the plate's own darkened to its floor, the lip below and right of a cut lifted
 *  toward the light. Row 0 is the plaque's top (world/lefayMonument.js maps its face so). Returns a new picture. */
export function engravePlaque(/** @type {{width:number,height:number,data:Uint8Array}} */ plate, lines = LEFAY_TEXT.plaque) {
  const W = LEFAY_PLAQUE_W, H = LEFAY_PLAQUE_H, pic = resample(plate, W, H), cut = plaqueCuts(lines, W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, lip = !cut[y * W + x] && ((x > 0 && cut[y * W + x - 1]) || (y > 0 && cut[(y - 1) * W + x]));
    for (let c = 0; c < 3; c++) {
      if (cut[y * W + x]) pic.data[i + c] = Math.round(pic.data[i + c] * CUT_FLOOR);
      else if (lip) pic.data[i + c] = Math.round(pic.data[i + c] + (255 - pic.data[i + c]) * CUT_LIP);
    }
  }
  return pic;
}

/** Every picture the monument wears, by record - `[record, picture]`, read from the player's own ARENA2 through
 *  `classicRgba` (world/classicArt.js classicPictures), the plaque engraved. What the host uploads under LEFAY_ARCHIVE. */
export async function lefayPictures(/** @type {(archive: number, record: number, frame?: number) => Promise<any>} */ classicRgba) {
  return (await classicPictures(LEFAY_SOURCES, classicRgba)).map(([rec, pic]) => /** @type {[number, any]} */ ([rec, rec === LEFAY_PLAQUE ? engravePlaque(pic) : pic]));
}
