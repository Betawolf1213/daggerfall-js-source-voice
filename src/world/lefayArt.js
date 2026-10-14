// @ts-check
// LEFAY1 (2026-10-08): THE MONUMENT'S PICTURES - the stone of the monument to Julian LeFay (world/lefayMonument.js),
// under the pseudo-archive LEFAY_ARCHIVE.
//
// DF-ART (2026-10-14, Mac: "For all textures you implemented that are AI (Ships, wagons, caravans, etc) I want to
// instead use daggerfall textures instead of AI generated"): its stone is DAGGERFALL'S OWN - each record named here
// (world/classicArt.js DF) is read from the player's own ARENA2 when the host stands the monument
// (scenes/lefayMonumentHost.js):
//
//   granite - the steps: dark speckled stone (341).
//   marble  - the pedestal and the obelisk: pale veined marble (341).
//   gilt    - the obelisk's point: plain gold (000).
//
// THE PLAQUE IS ITS OWN, AS IT WAS (Mac: "Bring back the old plaque texture"): bronze, its border bevelled, the
// inscription (LEFAY_TEXT.plaque) cut into it in square capitals - the name and the years twice the size of the two
// lines under them - and its edges the plate's own bronze, made here from noise the moment the host asks (no renderer,
// no GL: pixels and numbers). Deterministic (its own mulberry32 on fixed seeds): every client's plaque is the same.
//
// Not a DFU member. Ledger A (LEFAY).
import { LEFAY_GRANITE, LEFAY_MARBLE, LEFAY_GILT, LEFAY_PLAQUE, LEFAY_BRONZE, LEFAY_TEXT } from './lefayMonument.js';
import { DF, classicPictures } from './classicArt.js';

/** The plaque's picture, texels (its shape is the plaque's, world/lefayMonument.js PLAQUE: 1.0 m by 0.8). */
export const LEFAY_PLAQUE_W = 160;
export const LEFAY_PLAQUE_H = 128;
/** A painted picture's side, texels (the plaque's edges). */
export const LEFAY_ART_SIZE = 64;

/** mulberry32, the port's seeded rng (world/gateArt.js's own), kept here so the art is the monument's alone. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Tileable value noise over an n x n lattice, sampled at (x, y) in texels of an S-texel tile. */
function noiseField(seed, n, S = LEFAY_ART_SIZE) {
  const r = rng(seed);
  const lat = Float32Array.from({ length: n * n }, () => r());
  const at = (i, j) => lat[((j % n + n) % n) * n + ((i % n + n) % n)];
  const smooth = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const fx = (x / S) * n, fy = (y / S) * n;
    const i = Math.floor(fx), j = Math.floor(fy);
    const tx = smooth(fx - i), ty = smooth(fy - j);
    const a = at(i, j), b = at(i + 1, j), c = at(i, j + 1), d = at(i + 1, j + 1);
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  };
}
const image = (w, h = w) => ({ width: w, height: h, colors: new Uint8Array(w * h * 4) });
/** @param {{width:number, height:number, colors:Uint8Array}} img @param {number} x @param {number} y @param {ArrayLike<number>} rgb */
const put = (img, x, y, rgb) => {
  const i = (y * img.width + x) * 4;
  img.colors[i] = rgb[0]; img.colors[i + 1] = rgb[1]; img.colors[i + 2] = rgb[2]; img.colors[i + 3] = 255;
};
/** @param {ArrayLike<number>} a @param {ArrayLike<number>} b @param {number} t @returns {number[]} */
const mix = (a, b, t) => { const k = Math.min(1, Math.max(0, t)); return [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * k)); };

/** The plaque's metal: a dark bronze, faintly mottled (the plate, and its plain edges). */
const BRONZE_DARK = [70, 50, 26];
const BRONZE_LIGHT = [128, 94, 48];
export function lefayBronzeArt(seed = 0xb802) {
  const S = 32, img = image(S);
  const n = noiseField(seed, 4, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) put(img, x, y, mix(BRONZE_DARK, BRONZE_LIGHT, 0.35 + 0.5 * n(x, y)));
  return img;
}

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

/**
 * THE PLAQUE: bronze, a bevelled border (light along its top and left, dark along its bottom and right), and the
 * inscription cut into it, each line centred - a cut letter dark at its floor, its lower right lip catching the light.
 * Row 0 is the plaque's top (world/lefayMonument.js maps its face so).
 */
export function lefayPlaqueArt(lines = LEFAY_TEXT.plaque, seed = 0x91a0) {
  const W = LEFAY_PLAQUE_W, H = LEFAY_PLAQUE_H, img = image(W, H);
  const n = noiseField(seed, 8, W);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) put(img, x, y, mix(BRONZE_DARK, BRONZE_LIGHT, 0.45 + 0.35 * n(x, y)));
  const BEVEL = 4, LIT = [176, 138, 76], SHADOW = [44, 30, 14];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.min(x, y, W - 1 - x, H - 1 - y);
    if (d >= BEVEL) continue;
    const lit = x < BEVEL && x <= y && x <= H - 1 - y ? true : y < BEVEL && y <= x && y <= W - 1 - x;
    put(img, x, y, lit ? LIT : SHADOW);
  }
  // the lines, stacked down the plaque's middle with a gap of their height's half between them
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
  const FLOOR = [34, 22, 10], LIP = [196, 160, 92];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (cut[y * W + x]) put(img, x, y, FLOOR);
    else if ((x > 0 && cut[y * W + x - 1]) || (y > 0 && cut[(y - 1) * W + x])) put(img, x, y, LIP);   // the lip below and right of a cut
  }
  return img;
}

/** DF-ART: the Daggerfall record each of the monument's stone records wears (world/classicArt.js DF). */
export const LEFAY_SOURCES = Object.freeze({
  [LEFAY_GRANITE]: DF.granite,
  [LEFAY_MARBLE]: DF.marble,
  [LEFAY_GILT]: DF.giltPlain,
});
/** A painted picture (`colors`, row 0 its top) as the top-down `data` picture the readers answer. */
const asData = (/** @type {{width:number,height:number,colors:Uint8Array}} */ img) => ({ width: img.width, height: img.height, data: img.colors });

/** Every picture the monument wears, by record - `[record, picture]` (top-down, `data`): its stone read from the
 *  player's own ARENA2 through `classicRgba` (world/classicArt.js classicPictures), its plaque and the plaque's edges
 *  its own bronze. What the host uploads under LEFAY_ARCHIVE. */
export async function lefayPictures(/** @type {(archive: number, record: number, frame?: number) => Promise<any>} */ classicRgba) {
  const out = await classicPictures(LEFAY_SOURCES, classicRgba);
  out.push([LEFAY_PLAQUE, asData(lefayPlaqueArt())], [LEFAY_BRONZE, asData(lefayBronzeArt())]);
  return out.sort((a, b) => a[0] - b[0]);
}
