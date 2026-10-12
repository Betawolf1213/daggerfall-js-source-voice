// @ts-check
// EG-G2 (2026-10-12, Mac: "I said I want everything"; bible/11-Multiplayer/Elite-Gates.md sections 7 (the band table) and
// 25.1): THE SPIRE'S BAND ART - each band's own dress, painted here in code into its own pseudo-archive
// (world/pseudoArchives.js EG_BAND_ARCHIVES: 38241 the Galleries, 38251 the Cairn, 38261 the Shade, 38271 the Wellhead).
// Nothing ships and nothing is read from the player's data (Port-Doctrine: A RENDER OF GAME DATA IS GAME DATA): the same
// pixels every boot, through the Hour's paint box (world/sdPixelKit.js) - 1-px bevels lit from the top-left, dark joints,
// ordered dither between a ramp's steps, and every texel forced into the band's own ramps at the end.
//
// EG-PLAY's halls wore the Hour's records (world/sdRealmArt.js) - "the Hour's art dresses the Spire" (EG-PLAY departure 3,
// EG-FULL layer three's "the band art is EG-G's"). Each band now paints the same RECORDS the halls are built with, under
// its own archive, and `egBandDress` moves a built model's sub-meshes onto it: the hall's geometry is unchanged, its dress
// is the band's. The records (EG_DRESS_RECORDS):
//   floor  0  the walk, the plates, the islands
//   brass  1  the rims, the kerbs, the posts, the shelves - the band's metal (gold leaf, bone, moon-silver, iron)
//   root   2  the undersides hanging into the void, and the passages' vaults
//   arena  4  the courts' plates - the quietest thing in each band, so the telegraphs own it
//   cobble 31 the walkways
//   edge   32 THE EDGE LINE's gold (section 25.3) - gold in every band, because gold means the way and "it holds"
//   molten 33 NEW: what was the edge line's gold on the magma and the fire channels (world/egHall.js) is the band's own
//             liquid light - molten orange in the Galleries and the Wellhead, soul-light in the Cairn, quicksilver in
//             the Shade - its emission held at or under 0.45 display luminance (section 11.9: where magma meets a fight
//             floor it never outshines a telegraph)
//   pillar 56 the walls, the passages' sides, the arches
// The four looks (section 7's table, section 25.1's ramps):
//   THE BROKEN GALLERIES - white marble flags veined grey, gold leaf on every metal, burnt Battlemage blue in the courts'
//     inlay and the walkways' tesserae; the fire-sea's orange below;
//   THE SOUL CAIRN - slate violet, bone where the Galleries had gold, soul-light pooled in the channels;
//   THE SHADE PERILOUS - near-black glass split by moon-silver hairlines, silver where the gold was;
//   THE HAVOC WELLHEAD - basalt (SD-LOOK's own ramp) bound in riveted iron, molten iron in the channels.
// Stone and metal are structure and do not glow (SD-LOOK's rule): the metal keeps SD_BRASS_EDGE_GLOW on its rubbed rows
// alone, the edge line its SD_EDGE_GLOW, the liquid its capped light; every other record's emission is black.
//
// Not a DFU member. Ledger A (ELITE-GATES).
import { SD_RAMP } from './sdLook.js';
import { rng, noiseField, image, putTexel, blendRgb, scale, ramp, step, bevel, rivet, paletteOf, quantize } from './sdPixelKit.js';
import { SD_ART_SIZE, SD_ROOT_ART_H, SD_BRASS_EDGE_GLOW, SD_EDGE_GLOW } from './sdRealmArt.js';
import { EG_BAND_ARCHIVES } from './pseudoArchives.js';
import { SD_REALM_ARCHIVE } from './sdRealm.js';

/** THE RECORDS each band paints (the Hour's own numbers - world/sdRealm.js - and the liquid's new 33). */
export const EG_DRESS = Object.freeze({ floor: 0, brass: 1, root: 2, arena: 4, cobble: 31, edge: 32, molten: 33, pillar: 56 });
/** @type {ReadonlyArray<number>} */
export const EG_DRESS_RECORDS = Object.freeze(Object.values(EG_DRESS));
/** The liquid's light at its brightest texel: at or under EG_MOLTEN_LUMA_MAX (section 11.9 - where magma meets a fight
 *  floor it never outshines a telegraph), never more than EG_MOLTEN_GLOW of its albedo. */
export const EG_MOLTEN_GLOW = 0.75;
export const EG_MOLTEN_LUMA_MAX = 0.45;

/** THE BANDS' RAMPS (sRGB 0-255, dark to light, five steps or more - section 25.1's), by band index. */
const r5 = (...s) => Object.freeze(s.map((c) => Object.freeze(c)));
export const EG_BAND_RAMPS = Object.freeze([
  Object.freeze({   // the Broken Galleries
    stone: r5([150, 146, 138], [166, 162, 154], [182, 178, 169], [198, 194, 185], [214, 210, 200]),     // marble
    vein: r5([52, 48, 46], [74, 70, 66], [98, 94, 88], [122, 118, 112], [140, 136, 130]),               // its veins, joints and soot
    metal: r5([140, 98, 40], [172, 124, 52], [196, 146, 64], [228, 184, 100], [246, 206, 120]),         // gold leaf (the Hour's brass)
    accent: r5([36, 52, 96], [48, 68, 124], [62, 86, 150], [76, 104, 174], [92, 124, 196]),             // Battlemage blue
    liquid: r5([120, 30, 8], [180, 60, 14], [230, 96, 24], [255, 120, 30], [255, 176, 90]),            // the fire-sea
  }),
  Object.freeze({   // the Soul Cairn
    stone: r5([34, 28, 44], [54, 46, 66], [76, 66, 90], [98, 87, 115], [120, 108, 140]),               // slate violet
    vein: r5([14, 11, 18], [22, 18, 28], [30, 25, 38], [40, 34, 50], [50, 42, 62]),
    metal: r5([92, 86, 74], [120, 112, 96], [150, 142, 122], [178, 170, 148], [204, 196, 174]),         // bone
    accent: r5([40, 70, 86], [64, 112, 136], [90, 152, 180], [120, 200, 230], [176, 228, 244]),         // soul-light
    liquid: r5([40, 70, 86], [64, 112, 136], [90, 152, 180], [120, 200, 230], [176, 228, 244]),
  }),
  Object.freeze({   // the Shade Perilous
    stone: r5([6, 6, 10], [16, 16, 22], [28, 29, 38], [44, 46, 58], [60, 64, 80]),                     // black glass
    vein: r5([3, 3, 5], [6, 6, 10], [10, 10, 15], [14, 14, 20], [18, 18, 26]),
    metal: r5([160, 166, 176], [174, 180, 190], [187, 193, 202], [200, 206, 215], [214, 220, 228]),     // moon-silver
    accent: r5([96, 102, 114], [120, 126, 138], [160, 166, 176], [187, 193, 202], [214, 220, 228]),
    liquid: r5([64, 68, 76], [104, 110, 120], [150, 156, 166], [196, 202, 212], [228, 232, 238]),      // quicksilver
  }),
  Object.freeze({   // the Havoc Wellhead
    stone: SD_RAMP.basalt,                                                                              // SD-LOOK's basalt
    vein: r5([6, 5, 5], [10, 9, 9], [14, 12, 12], [18, 16, 15], [22, 20, 19]),
    metal: r5([26, 26, 28], [44, 44, 48], [66, 66, 70], [92, 90, 92], [120, 116, 114]),               // iron
    accent: r5([120, 30, 8], [180, 60, 14], [230, 96, 24], [255, 120, 30], [255, 176, 90]),            // molten
    liquid: r5([120, 30, 8], [180, 60, 14], [230, 96, 24], [255, 120, 30], [255, 176, 90]),
  }),
]);
/** The edge line's gold, the same in every band (the Galleries' gold leaf). */
const GOLD = EG_BAND_RAMPS[0].metal;

/** Display luminance of an sRGB triple, 0-1 (the value ladder's measure - world/sdLook.js SD_LADDER). */
export const egLuma = (c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
/** Band `band`'s liquid's emission over its albedo: EG_MOLTEN_GLOW, or less where its brightest step would pass
 *  EG_MOLTEN_LUMA_MAX (a texel's rounding held a hair under it). */
export const egMoltenGlow = (band) => Math.min(EG_MOLTEN_GLOW, (EG_MOLTEN_LUMA_MAX - 0.004) / Math.max(...EG_BAND_RAMPS[Math.max(0, Math.min(3, band | 0))].liquid.map((c) => egLuma(c))));
const black = (W = SD_ART_SIZE, H = W) => image(W, H);
const seedOf = (band, rec) => (0xe6b0 + band * 0x101 + rec * 0x1f) >>> 0;

/** FLOOR: flags a metre square (32 texels) in running bond, bevelled, their faces quiet, each band's own figure in them -
 *  the marble's grey veins, the slate's cleavage, the glass's silver hairlines, the basalt's iron cramps. */
function floorArt(band) {
  const R = EG_BAND_RAMPS[band], S = SD_ART_SIZE, albedo = image(), emission = black(), r = rng(seedOf(band, 0));
  const tone = noiseField(seedOf(band, 0) + 1, 4), fine = noiseField(seedOf(band, 0) + 2, 16);
  const F = 32, J = band === 2 ? 1 : 2;
  const shade = Array.from({ length: 8 }, () => 0.3 + 0.35 * r());
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const row = Math.floor(y / F), xs = x + (row % 2) * (F / 2), fx = ((xs % F) + F) % F, fy = y % F, k = row * 4 + Math.floor((((xs % S) + S) % S) / F);
    if (fx < J || fy < J) { putTexel(albedo, x, y, step(R.vein, 1)); continue; }
    putTexel(albedo, x, y, ramp(R.stone, shade[k % 8] + 0.18 * (tone(x, y) - 0.5) + 0.08 * (fine(x, y) - 0.5), x, y));
  }
  for (let row = 0; row < 2; row++) for (let c = 0; c < 3; c++) bevel(albedo, c * F - (row % 2) * (F / 2) + J, row * F + J, F - J, F - J, step(R.stone, 4), step(R.stone, 1));
  // the figure: wandering veins (marble, slate), hairlines (glass), or an iron cramp across each joint (basalt)
  if (band === 3) for (let row = 0; row < 2; row++) for (let c = 0; c < 2; c++) { const x0 = c * F + 12 + (row % 2) * 8, y0 = row * F; for (let i = 0; i < 6; i++) { putTexel(albedo, x0 + i, y0, step(R.metal, 2)); putTexel(albedo, x0 + i, y0 + 1, step(R.metal, 1)); } rivet(albedo, x0 + 1, y0 + 3, step(R.metal, 3), step(R.metal, 0), step(R.metal, 4)); }
  else for (let n = 0; n < (band === 2 ? 4 : 6); n++) {
    let x = r() * S, y = r() * S;
    const dx = r() - 0.5, len = 10 + Math.floor(r() * 14), c = band === 2 ? step(R.metal, 0) : step(R.vein, band === 0 ? 3 : 2);
    for (let i = 0; i < len; i++) { putTexel(albedo, x, y, c); x += dx + (r() - 0.5) * 0.9; y += 1; }
  }
  quantize(albedo, paletteOf(R.stone, R.vein, R.metal));
  return { albedo, emission };
}
/** BRASS: the band's metal, rubbed along its grain (u) in riveted plates 32 texels long, its seams dark; its own light on
 *  its rubbed rows alone (SD_BRASS_EDGE_GLOW) - gold leaf, bone, moon-silver, iron. */
function metalArt(band) {
  const R = EG_BAND_RAMPS[band], S = SD_ART_SIZE, albedo = image(), emission = black();
  const grain = noiseField(seedOf(band, 1), 16, S, S, 2), broad = noiseField(seedOf(band, 1) + 2, 4);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) putTexel(albedo, x, y, ramp(R.metal, 0.2 + 0.55 * (0.55 * grain(x, y) + 0.45 * broad(x, y)), x, y));
  for (let px = 0; px < S; px += 32) {
    for (let y = 0; y < S; y++) { putTexel(albedo, px, y, step(R.vein, 1)); putTexel(albedo, px + 1, y, step(R.metal, 1)); }
    for (const ry of [4, S - 5]) rivet(albedo, px + 6, ry, step(R.metal, 3), step(R.metal, 0), step(R.metal, 4));
  }
  for (let x = 0; x < S; x++) for (const y of [0, 16, 32, 48]) {
    putTexel(albedo, x, y, step(R.metal, 4)); putTexel(emission, x, y, scale(step(R.metal, 4), SD_BRASS_EDGE_GLOW));
    putTexel(albedo, x, y + 15, step(R.metal, 0));
  }
  quantize(albedo, paletteOf(R.metal, R.vein));
  return { albedo, emission };
}
/** ROOT: the undersides top (v 0) to tip (v 1), 64 x SD_ROOT_ART_H - the torn lip of the band's stone, its courses, the
 *  band's metal welded through the rock, the tips thinning to the void's haze. Nothing glows. */
function rootArt(band) {
  const R = EG_BAND_RAMPS[band], W = SD_ART_SIZE, H = SD_ROOT_ART_H, albedo = image(W, H), emission = image(W, H), r = rng(seedOf(band, 2));
  const tone = noiseField(seedOf(band, 2), 8, W, H), wob = noiseField(seedOf(band, 2) + 3, 6, W, H);
  const LIP = 8, BLOCK = 72, WORKS = 100, voidStep = step(SD_RAMP.void, 2);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = tone(x, y), yy = y + (wob(x, y) - 0.5) * 6;
    let c;
    if (yy < LIP) c = ramp(R.stone, 0.55 + 0.3 * n, x, y);
    else if (yy < BLOCK) {
      const course = Math.floor((y - LIP) / 11), bx = ((x + (course % 2) * 8) % 16 + 16) % 16, by = (y - LIP) % 11;
      c = bx < 1 || by < 1 ? step(R.vein, 1) : ramp(R.stone, 0.1 + 0.35 * n, x, y);
    } else if (yy < WORKS) c = ramp(R.vein, 0.3 + 0.5 * n, x, y);
    else c = blendRgb(ramp(R.vein, 0.2 + 0.4 * n, x, y), voidStep, Math.min(1, (y - WORKS) / (H - WORKS)) * 0.6);
    putTexel(albedo, x, y, c); putTexel(emission, x, y, [0, 0, 0]);
  }
  const gx = Math.floor(r() * W);
  for (let i = 0; i < 40; i++) for (let y = BLOCK + 6 + (Math.floor(i / 3) % 2 ? 3 : 0); y < BLOCK + 13; y++) putTexel(albedo, gx + i, y, step(R.metal, 1));
  quantize(albedo, paletteOf(R.stone, R.vein, R.metal, SD_RAMP.void));
  return { albedo, emission };
}
/** ARENA: one court plate a tile, bevelled, riveted at its corners, an inlaid line across it - Battlemage blue in the
 *  marble, bone in the slate, silver in the glass, a seam of iron in the basalt. The quietest record: no light. */
function arenaArt(band) {
  const R = EG_BAND_RAMPS[band], S = SD_ART_SIZE, albedo = image(), emission = black();
  const tone = noiseField(seedOf(band, 4) + 1, 4), fine = noiseField(seedOf(band, 4) + 2, 16);
  const quiet = band === 0 ? 0.15 : 0.25;   // the marble kept low on its ramp - the telegraphs own the courts
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    if (x < 2 || y < 2) { putTexel(albedo, x, y, step(R.vein, 1)); continue; }
    putTexel(albedo, x, y, ramp(R.stone, quiet + 0.3 * tone(x, y) + 0.08 * (fine(x, y) - 0.5), x, y));
  }
  bevel(albedo, 2, 2, S - 2, S - 2, step(R.stone, 3), step(R.vein, 2));
  const inlay = band === 3 ? R.metal : R.accent;
  for (let x = 6; x < S - 4; x++) { putTexel(albedo, x, S / 2, step(inlay, 1)); putTexel(albedo, x, S / 2 + 1, step(inlay, 0)); }
  for (const [x, y] of [[6, 6], [S - 5, 6], [6, S - 5], [S - 5, S - 5]]) rivet(albedo, x, y, step(R.metal, 3), step(R.metal, 0), step(R.metal, 4));
  quantize(albedo, paletteOf(R.stone, R.vein, R.metal, R.accent));
  return { albedo, emission };
}
/** COBBLE: the walkways - tesserae (8 texels) set in dark grout, each lit from the top-left: blue-grey marble, bone chips,
 *  glass shards, slag. */
function walkArt(band) {
  const R = EG_BAND_RAMPS[band], S = SD_ART_SIZE, albedo = image(), emission = black(), r = rng(seedOf(band, 31));
  const N = 8, cell = S / N, seeds = [];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) seeds.push([(i + 0.2 + 0.6 * r()) * cell, (j + 0.2 + 0.6 * r()) * cell, 0.2 + 0.4 * r(), r() < (band === 0 ? 0.3 : 0.12)]);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let d1 = Infinity, d2 = Infinity, best = seeds[0];
    for (const s of seeds) for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      const d = Math.hypot(x + 0.5 - s[0] - ox, y + 0.5 - s[1] - oy);
      if (d < d1) { d2 = d1; d1 = d; best = [s[0] + ox, s[1] + oy, s[2], s[3]]; } else if (d < d2) d2 = d;
    }
    if (d2 - d1 < 1.6) { putTexel(albedo, x, y, step(R.vein, 0)); continue; }
    const lit = best[2] - 0.35 * ((x + 0.5 - best[0]) / cell + (y + 0.5 - best[1]) / cell);
    putTexel(albedo, x, y, ramp(best[3] ? (band === 3 ? R.metal : R.accent) : R.stone, lit, x, y));
  }
  quantize(albedo, paletteOf(R.stone, R.vein, band === 3 ? R.metal : R.accent));
  return { albedo, emission };
}
/** EDGE: THE EDGE LINE's gold (section 25.3), the same in every band - rubbed gold, alight at the ambient rung. */
function edgeArt() {
  const S = 8, albedo = image(S), emission = image(S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const c = step(GOLD, y < 2 ? 4 : 3); putTexel(albedo, x, y, c); putTexel(emission, x, y, scale(c, SD_EDGE_GLOW)); }
  return { albedo, emission };
}
/** MOLTEN: the band's liquid light in slow cells - its emission egMoltenGlow of its albedo, so its brightest texel stays
 *  at or under EG_MOLTEN_LUMA_MAX. */
function moltenArt(band) {
  const R = EG_BAND_RAMPS[band], S = 32, albedo = image(S), emission = image(S);
  const cells = noiseField(seedOf(band, 33), 4, S), crust = noiseField(seedOf(band, 33) + 7, 8, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const v = 0.55 * cells(x, y) + 0.45 * crust(x, y), c = v < 0.32 ? step(R.liquid, 0) : ramp(R.liquid, (v - 0.25) * 1.4, x, y);
    putTexel(albedo, x, y, c);
  }
  quantize(albedo, paletteOf(R.liquid));
  const k = egMoltenGlow(band);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const i = (y * S + x) * 4, c = albedo.colors; putTexel(emission, x, y, scale([c[i], c[i + 1], c[i + 2]], k)); }
  return { albedo, emission };
}
/** PILLAR: the walls' ashlar a metre long in courses half a metre high, each block bevelled and quiet in its face; the
 *  Galleries' marble banded with a course of gold leaf, the Wellhead's basalt strapped in iron. Matte. */
function pillarArt(band) {
  const R = EG_BAND_RAMPS[band], S = SD_ART_SIZE, albedo = image(), emission = black(), r = rng(seedOf(band, 56));
  const tone = noiseField(seedOf(band, 56) + 1, 4), fine = noiseField(seedOf(band, 56) + 2, 16);
  const W = 32, H = 16, J = 2, shade = Array.from({ length: 16 }, () => 0.2 + 0.32 * r());
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const row = Math.floor(y / H), xs = x + (row % 2) * (W / 2), bx = ((xs % W) + W) % W, by = y % H, k = row * 2 + Math.floor((((xs % S) + S) % S) / W);
    if (bx < J || by < J) { putTexel(albedo, x, y, step(R.vein, 1)); continue; }
    putTexel(albedo, x, y, ramp(R.stone, shade[k % 16] + 0.16 * (tone(x, y) - 0.5) + 0.06 * (fine(x, y) - 0.5), x, y));
  }
  for (let row = 0; row < S / H; row++) for (let c = 0; c < 3; c++) bevel(albedo, c * W - (row % 2) * (W / 2) + J, row * H + J, W - J, H - J, step(R.stone, 3), step(R.stone, 1));
  if (band === 0 || band === 3) for (let x = 0; x < S; x++) { putTexel(albedo, x, 32, step(R.metal, 3)); putTexel(albedo, x, 33, step(R.metal, 1)); }
  quantize(albedo, paletteOf(R.stone, R.vein, R.metal));
  return { albedo, emission };
}

/** Every picture band `band` (0-3) wears, by record: `[record, { albedo, emission }]` - what a host uploads under the
 *  band's archive (egBandArchive) before it draws the band's halls. Pure: the same pixels every call. */
/** @returns {Array<[number, { albedo: import('./sdPixelKit.js').Img, emission: import('./sdPixelKit.js').Img }]>} */
export function egBandArt(band) {
  const b = Math.max(0, Math.min(3, band | 0));
  return [
    [EG_DRESS.floor, floorArt(b)], [EG_DRESS.brass, metalArt(b)], [EG_DRESS.root, rootArt(b)], [EG_DRESS.arena, arenaArt(b)],
    [EG_DRESS.cobble, walkArt(b)], [EG_DRESS.edge, edgeArt()], [EG_DRESS.molten, moltenArt(b)], [EG_DRESS.pillar, pillarArt(b)],
  ];
}
/** The palette each band's pictures are forced into (the law's check: nothing off it). */
export function egBandPalette(band) {
  const R = EG_BAND_RAMPS[Math.max(0, Math.min(3, band | 0))];
  return paletteOf(R.stone, R.vein, R.metal, R.accent, R.liquid, GOLD, SD_RAMP.void);
}
/** Band `band`'s archive (world/pseudoArchives.js EG_BAND_ARCHIVES). */
export const egBandArchive = (band) => EG_BAND_ARCHIVES[Math.max(0, Math.min(3, band | 0))];

/**
 * THE DRESS: a built model (renderer.createMesh's shape - world/sdRealm.js packRealmFaces) moved onto band `band`'s
 * archive - every sub-mesh of the Hour's archive whose record the band paints (EG_DRESS_RECORDS) takes the band's archive;
 * the rest (the Steps' own faces - their dials, cracks and runes are the machine's read, the same in every band) keep
 * theirs. The model is changed in place and answered.
 * @template {{ subMeshes: Array<{ textureArchive: number, textureRecord: number }> }} M
 * @param {M} model @param {number} band @returns {M}
 */
export function egBandDress(model, band) {
  const archive = egBandArchive(band);
  for (const sm of model?.subMeshes ?? []) if (sm.textureArchive === SD_REALM_ARCHIVE && EG_DRESS_RECORDS.includes(sm.textureRecord)) sm.textureArchive = archive;
  return model;
}
