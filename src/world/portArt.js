// @ts-check
// SHIPYARDS (2026-10-11): THE PORT'S OWN ART, MADE AT BOOT - every picture the shipyard and the lighthouse wear
// (world/shipyardModel.js, world/lighthouseModel.js) is the port's, made here from noise and drawn shapes the moment a
// host asks, under the pseudo-archive PORT_ARCHIVE (world/merchantYardArt.js's law and its own tools: pixels and numbers,
// no renderer, no GL). Nothing of Daggerfall's is read.
//
// THE YARDS' MATERIALS AT THE YARDS' RECORDS: records 0-7 are the Stable's and the Wagon Yard's timber, boards,
// shingles, straw, earth, gravel, water and iron, painted by the same painters on the same seeds - so the face kit the
// port's models share with the yards (world/merchantYardModels.js) dresses a post or a sign's edge alike under either
// archive. Then the port's own:
//
//   stone     - the lighthouse's footing and the yards' walls: grey ashlar, its courses staggered, mortar between.
//   whitewash - the lighthouse's tower and the keeper's cottage: lime over stone, mottled, the courses faint under it.
//   redband   - the tower's bands: red ochre paint, weathered.
//   slate     - the cottage's roof: blue-grey slates in staggered rows.
//   glass     - the lantern room's panes: warm lamp-lit glass, brighter at its middle.
//   window    - a window's dark glass, a pale reflection across it.
//   rope      - hemp: the strands laid at a slant.
//   canvas    - sailcloth: a plain weave, off-white.
//   tar       - tarred timber and the pitch barrels: black, brown streaks, a dull sheen.
//   copper    - the lantern's dome: verdigris over copper.
//   sawdust   - the shipyard's floor: sandy earth, chips and shavings over it.
//   hull      - the hull on the stocks: fresh oak strakes, their seams caulked dark, treenails in rows.
//   cobble    - the lighthouse's yard: rounded setts, dark joints.
//   door      - a plank door, iron-strapped and studded.
//   notices   - the crew hall's board: bills pinned on a cork board, each lined with a hand's writing.
//   brass     - the lamp's fittings and the ship's bell: worn brass.
//   the SIGNBOARD - the yards' board (merchantYardArt.js board) with an iron anchor and SHIPS; the crew hall's with a
//   coil of rope and CREW.
//
// Deterministic (its own rng on fixed seeds): every client's port is the same timber and stone. Not a DFU member.
// Ledger A (SHIPYARDS).
import {
  YARD_ART_KIT, SIGN_EMBLEM, SIGN_ART_H,
  yardWoodArt, yardPlankArt, yardShingleArt, yardHayArt, yardDirtArt, yardGravelArt, yardWaterArt, yardIronArt, YARD_REC, YARD_ART_SIZE,
} from './merchantYardArt.js';
import { PORT_PLACES } from '../systems/portPlaces.js';

const { rng, noiseField, image, put, get, mix, IRON_DARK, IRON_LIGHT, board, paintWord } = YARD_ART_KIT;   // the yards' painting tools

/** The pseudo-archive the port's pictures stand under (the yards' neighbour, world/merchantYardArt.js YARD_ARCHIVE). */
export const PORT_ARCHIVE = 38231;
/** Its records: the yards' materials at the yards' own records, then the port's. */
export const PORT_REC = Object.freeze({
  wood: YARD_REC.wood, plank: YARD_REC.plank, shingle: YARD_REC.shingle, hay: YARD_REC.hay, dirt: YARD_REC.dirt,
  gravel: YARD_REC.gravel, water: YARD_REC.water, iron: YARD_REC.iron,
  stone: 10, whitewash: 11, redband: 12, slate: 13, glass: 14, window: 15, rope: 16, canvas: 17, tar: 18, copper: 19,
  sawdust: 20, hull: 21, cobble: 22, door: 23, notices: 24, brass: 25, signShips: 26, signCrew: 27,
});
const S = YARD_ART_SIZE;

/** Grey ashlar: courses sixteen texels high, blocks of 20 to 36 across, staggered, mortar between, each block its own
 *  shade and a little pitting. Tileable. */
export function portStoneArt(seed = 0x5701, { light = [158, 154, 146], dark = [92, 90, 86], mortar = [70, 68, 64] } = {}) {
  const img = image(S), r = rng(seed), n = noiseField(seed + 1, 8);
  for (let row = 0; row < S / 16; row++) {
    const cuts = [0];
    while (cuts[cuts.length - 1] < S - 20) cuts.push(cuts[cuts.length - 1] + 20 + Math.floor(r() * 17));
    const shift = Math.floor(r() * S), shade = cuts.map(() => 0.35 + 0.5 * r());
    for (let y = row * 16; y < row * 16 + 16; y++) for (let x0 = 0; x0 < S; x0++) {
      const x = (x0 + shift) % S;
      let k = 0;
      while (k + 1 < cuts.length && cuts[k + 1] <= x0) k++;
      let c = mix(dark, light, shade[k] + 0.3 * (n(x, y) - 0.5));
      if (y === row * 16 + 15 || x0 === cuts[k]) c = mortar;
      else if (y === row * 16 || x0 === cuts[k] + 1) c = mix(c, [196, 192, 184], 0.25);   // the block's lit edge
      if (r() < 0.025) c = mix(c, mortar, 0.6);
      put(img, x, y, c);
    }
  }
  return img;
}
/** Lime over stone: off-white, mottled, the courses faintly through it, a little grime toward the foot (row 63). */
export function portWhitewashArt(seed = 0x3417) {
  const img = image(S), n = noiseField(seed, 6), fine = noiseField(seed + 1, 24), under = portStoneArt(seed + 2);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const base = mix([206, 204, 196], [238, 236, 228], 0.4 + 0.5 * n(x, y) + 0.2 * (fine(x, y) - 0.5));
    put(img, x, y, mix(base, get(under, x, y), 0.08 + 0.05 * (y / S)));
  }
  return img;
}
/** Red ochre paint over the same lime, weathered. */
export function portRedbandArt(seed = 0x7ed1) {
  const img = image(S), n = noiseField(seed, 6), fine = noiseField(seed + 1, 24), r = rng(seed + 2);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let c = mix([128, 34, 28], [176, 52, 40], 0.35 + 0.5 * n(x, y) + 0.2 * (fine(x, y) - 0.5));
    if (r() < 0.02) c = mix(c, [214, 206, 196], 0.5);   // where it has flaked
    put(img, x, y, c);
  }
  return img;
}
/** Slates in staggered rows eight texels high, each its own width and shade, the row's foot shadowed. Tileable. */
export function portSlateArt(seed = 0x51a7) {
  const img = image(S), r = rng(seed), n = noiseField(seed + 1, 16);
  for (let row = 0; row < S / 8; row++) {
    const cuts = [0];
    while (cuts[cuts.length - 1] < S - 12) cuts.push(cuts[cuts.length - 1] + 8 + Math.floor(r() * 5));
    const shift = Math.floor(r() * S), shade = cuts.map(() => 0.4 + 0.5 * r());
    for (let y = row * 8; y < row * 8 + 8; y++) for (let x0 = 0; x0 < S; x0++) {
      const x = (x0 + shift) % S;
      let k = 0;
      while (k + 1 < cuts.length && cuts[k + 1] <= x0) k++;
      let c = mix([46, 52, 62], [96, 104, 116], shade[k] + 0.2 * (n(x, y) - 0.5));
      if (y === row * 8 + 7) c = [24, 26, 32];
      else if (x0 === cuts[k]) c = mix(c, [30, 32, 40], 0.7);
      put(img, x, y, c);
    }
  }
  return img;
}
/** The lantern's glass, lit: warm white at its middle to amber at its edges. */
export function portGlassArt() {
  const W = 32, img = image(W);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const d = Math.sqrt(((x - W / 2 + 0.5) / (W / 2)) ** 2 + ((y - W / 2 + 0.5) / (W / 2)) ** 2);
    put(img, x, y, mix([255, 250, 214], [240, 170, 70], Math.min(1, d * 0.9)));
  }
  return img;
}
/** A window's dark glass, a pale streak of sky across it. */
export function portWindowArt() {
  const W = 32, img = image(W);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const streak = Math.abs(x - y - 4) < 3 || Math.abs(x - y + 14) < 2;
    put(img, x, y, streak ? [86, 104, 122] : mix([20, 26, 36], [40, 50, 64], y / W));
  }
  return img;
}
/** Hemp rope: strands laid at a slant, each lit along one edge. Tileable. */
export function portRopeArt() {
  const W = 32, img = image(W);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const t = ((x + y) % 8) / 8;
    put(img, x, y, mix([118, 92, 54], [196, 162, 104], t < 0.15 ? 0.1 : 0.4 + 0.6 * Math.sin(t * Math.PI)));
  }
  return img;
}
/** Sailcloth: a plain weave, off-white, a faint stain. Tileable. */
export function portCanvasArt(seed = 0xca57) {
  const W = 32, img = image(W), n = noiseField(seed, 4, W);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const weave = (x + y) % 2 ? 0.08 : 0;
    put(img, x, y, mix([200, 190, 164], [232, 224, 202], 0.4 + 0.4 * n(x, y) - weave));
  }
  return img;
}
/** Tarred timber: black, brown streaks along u, a dull sheen. Tileable. */
export function portTarArt(seed = 0x7a12) {
  const img = image(S), streak = noiseField(seed, 2, S, S, 16), n = noiseField(seed + 1, 8);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) put(img, x, y, mix([18, 16, 14], [64, 48, 34], 0.15 + 0.5 * streak(x, y) * n(x, y)));
  return img;
}
/** Verdigris: green-grey patina over copper, the metal through it in fine drips. Tileable. */
export function portCopperArt(seed = 0xc0ff) {
  const img = image(S), n = noiseField(seed, 6), drip = noiseField(seed + 1, 16, S, S, 2);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let c = mix([62, 120, 104], [108, 164, 142], 0.3 + 0.6 * n(x, y));
    const d = drip(x, y);
    if (d > 0.7) c = mix(c, [146, 96, 60], Math.min(0.45, (d - 0.7) * 2.5));   // the metal through it, in drips down the dome
    put(img, x, y, c);
  }
  return img;
}
/** The shipyard's floor: sandy earth, chips of oak and curled shavings strewn over it. Tileable. */
export function portSawdustArt(seed = 0x5a0d) {
  const img = image(S), n = noiseField(seed, 8), r = rng(seed + 1);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) put(img, x, y, mix([118, 98, 70], [166, 142, 104], 0.3 + 0.55 * n(x, y)));
  for (let k = 0; k < 60; k++) {   // chips: short pale strokes; shavings: little curls
    let x = r() * S, y = r() * S;
    const a = r() * Math.PI * 2, len = 2 + Math.floor(r() * 4), curl = r() < 0.4 ? 0.6 : 0;
    const c = r() < 0.5 ? [214, 186, 132] : [188, 154, 100];
    for (let i = 0; i < len; i++) { put(img, (Math.floor(x) + S) % S, (Math.floor(y) + S) % S, c); x += Math.cos(a + i * curl); y += Math.sin(a + i * curl); }
  }
  return img;
}
/** Fresh oak strakes along u, eight texels high: their seams caulked dark, a treenail every sixteen texels. Row 0 is a
 *  seam. Tileable. */
export function portHullArt(seed = 0x0a4c) {
  const img = image(S), grain = noiseField(seed, 4, S, S, 16), r = rng(seed + 1);
  const shades = Array.from({ length: S / 8 }, () => 0.7 + 0.3 * r());
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const strake = Math.floor(y / 8);
    let c = mix([142, 104, 62], [196, 156, 102], (0.25 + 0.6 * grain(x, y)) * shades[strake]);
    if (y % 8 === 0) c = [44, 30, 18];
    else if ((x + strake * 7) % 16 === 3 && y % 8 === 4) c = [92, 64, 36];
    put(img, x, y, c);
  }
  return img;
}
/** Setts: rounded stones in staggered rows, dark joints between. Tileable. */
export function portCobbleArt(seed = 0xc0bb) {
  const img = image(S), r = rng(seed), n = noiseField(seed + 1, 16);
  for (let row = 0; row < S / 8; row++) {
    const shift = (row % 2) * 5, shades = Array.from({ length: S / 10 + 1 }, () => 0.3 + 0.6 * r());
    for (let y = row * 8; y < row * 8 + 8; y++) for (let x = 0; x < S; x++) {
      const k = Math.floor(((x + shift) % S) / 10), u = ((x + shift) % S) % 10, v = y - row * 8;
      const edge = u === 0 || v === 7 || (u === 9 && v === 0);
      let c = mix([84, 82, 78], [150, 146, 136], shades[k % shades.length] + 0.25 * (n(x, y) - 0.5));
      if (edge) c = [44, 42, 40];
      else if (u === 1 || v === 0) c = mix(c, [184, 180, 170], 0.3);
      put(img, x, y, c);
    }
  }
  return img;
}
/** A door: upright boards, two iron straps across with studs along them. Row 0 is its top. */
export function portDoorArt(seed = 0xd007) {
  const img = yardPlankArt(seed);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) put(img, x, y, mix(get(img, x, y), [40, 26, 16], 0.35));
  for (const sy of [12, 48]) for (let x = 0; x < S; x++) for (let y = sy; y < sy + 4; y++) {
    put(img, x, y, mix(IRON_DARK, IRON_LIGHT, y === sy ? 0.6 : 0.2));
    if (x % 8 === 4 && y === sy + 1) { put(img, x, y, [150, 146, 142]); put(img, x + 1, y + 1, [20, 18, 18]); }
  }
  return img;
}
/** The crew hall's board: cork, and six bills pinned on it - paper, a dark line of writing on each, a pin at its top. */
export function portNoticesArt(seed = 0x0b11) {
  const W = 64, img = image(W), n = noiseField(seed, 16, W), r = rng(seed + 1);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) put(img, x, y, mix([122, 86, 52], [158, 118, 74], 0.3 + 0.6 * n(x, y)));
  const bills = [[4, 5, 16, 20], [24, 3, 18, 22], [45, 6, 15, 18], [6, 32, 18, 26], [28, 30, 16, 24], [47, 34, 13, 22]];
  for (const [bx, by, bw, bh] of bills) {
    const paper = mix([214, 204, 176], [236, 230, 210], r());
    for (let y = by; y < by + bh; y++) for (let x = bx; x < bx + bw; x++) put(img, x, y, paper);
    for (let ly = by + 4; ly < by + bh - 2; ly += 3) for (let x = bx + 2; x < bx + bw - 2 - Math.floor(r() * 5); x++) put(img, x, ly, [58, 50, 44]);
    put(img, bx + Math.floor(bw / 2), by + 1, [170, 30, 26]);
  }
  return img;
}
/** Worn brass. Tileable. */
export function portBrassArt(seed = 0xb2a5) {
  const W = 32, img = image(W), n = noiseField(seed, 4, W);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) put(img, x, y, mix([132, 98, 34], [226, 186, 92], 0.25 + 0.7 * n(x, y)));
  return img;
}

// ── THE SIGNBOARDS ───────────────────────────────────────────────────────────────────────────────────────────────
const PAINT = [232, 214, 166];
/** The SHIPS board's anchor: a ring at its head, its shank, a stock across under the ring, and two flukes curving up
 *  from its crown - iron lit along its upper left, a painted cream edge so it reads on the dark board. */
function paintAnchor(img) {
  const cx = SIGN_EMBLEM / 2 + 4, top = 10, bottom = SIGN_ART_H - 14;
  const iron = (x, y) => {
    const dx = x - cx;
    if (Math.abs(Math.hypot(dx, y - (top + 5)) - 5) < 1.7) return true;                       // the ring
    if (Math.abs(dx) <= 2 && y >= top + 9 && y <= bottom) return true;                         // the shank
    if (Math.abs(y - (top + 15)) <= 1.6 && Math.abs(dx) <= 15) return true;                    // the stock
    const ay = bottom - y, arm = Math.hypot(dx, (y - (bottom - 22)) * 1.05);
    if (ay >= -2 && ay <= 16 && Math.abs(arm - 22) < 2.2) return true;                          // the crown's arms
    for (const s of [-1, 1]) if (Math.abs(dx - s * 20) <= 3 - Math.abs(y - (bottom - 13)) / 3 && y >= bottom - 19 && y <= bottom - 8) return true;   // the flukes' palms
    return false;
  };
  for (let y = 0; y < SIGN_ART_H; y++) for (let x = 0; x < SIGN_EMBLEM + 8; x++) {
    if (iron(x, y)) continue;
    if (iron(x - 1, y) || iron(x + 1, y) || iron(x, y - 1) || iron(x, y + 1)) put(img, x, y, PAINT);
  }
  for (let y = 0; y < SIGN_ART_H; y++) for (let x = 0; x < SIGN_EMBLEM + 8; x++) {
    if (iron(x, y)) put(img, x, y, mix(IRON_LIGHT, IRON_DARK, 0.3 + 0.5 * ((x - cx + y - top) / (2 * SIGN_ART_H) + 0.5)));
  }
}
/** The CREW board's coil of rope: rings of hemp round a dark middle, a tail hanging from it. */
function paintCoil(img) {
  const cx = SIGN_EMBLEM / 2 + 4, cy = SIGN_ART_H / 2;
  for (let y = 0; y < SIGN_ART_H; y++) for (let x = 0; x < SIGN_EMBLEM + 8; x++) {
    const d = Math.hypot(x - cx, y - cy);
    if (d > 31 || d < 7) continue;
    const ring = Math.floor(d / 6), t = (d % 6) / 6;
    put(img, x, y, mix([110, 82, 44], [214, 176, 112], (ring % 2 ? 0.3 : 0.6) * Math.sin(t * Math.PI) + 0.25));
  }
  for (let y = cy + 28; y < SIGN_ART_H - 6; y++) for (let x = cx + 20; x < cx + 25; x++) put(img, x, y, mix([110, 82, 44], [214, 176, 112], ((x + y) % 5) / 5));
}
/** A port signboard: the yards' board (merchantYardArt.js board), its emblem and its word (systems/portPlaces.js
 *  PORT_PLACES `sign`): the shipyard's anchor and SHIPS, the crew hall's coil and CREW. Row 0 is the board's top. */
export function portSignArt(place) {
  const crew = place === 'crewhall';
  const img = board(crew ? 0x51b3 : 0x51b1);
  if (crew) paintCoil(img); else paintAnchor(img);
  paintWord(img, PORT_PLACES[crew ? 'crewhall' : 'shipyard'].sign);
  return img;
}

/** Each picture of the port's own and its painter, in record order - painted one at a time (scenes/portHost.js paints a
 *  few a frame: the twenty-six at once were a frame's ~60 ms at the first port stood, AUDIT SHIPYARDS L5-5).
 *  @type {ReadonlyArray<readonly [number, () => any]>} */
export const PORT_PAINTERS = Object.freeze([
  [PORT_REC.wood, () => yardWoodArt()],
  [PORT_REC.plank, () => yardPlankArt()],
  [PORT_REC.shingle, () => yardShingleArt()],
  [PORT_REC.hay, () => yardHayArt()],
  [PORT_REC.dirt, () => yardDirtArt()],
  [PORT_REC.gravel, () => yardGravelArt()],
  [PORT_REC.water, () => yardWaterArt()],
  [PORT_REC.iron, () => yardIronArt()],
  [PORT_REC.stone, () => portStoneArt()],
  [PORT_REC.whitewash, () => portWhitewashArt()],
  [PORT_REC.redband, () => portRedbandArt()],
  [PORT_REC.slate, () => portSlateArt()],
  [PORT_REC.glass, () => portGlassArt()],
  [PORT_REC.window, () => portWindowArt()],
  [PORT_REC.rope, () => portRopeArt()],
  [PORT_REC.canvas, () => portCanvasArt()],
  [PORT_REC.tar, () => portTarArt()],
  [PORT_REC.copper, () => portCopperArt()],
  [PORT_REC.sawdust, () => portSawdustArt()],
  [PORT_REC.hull, () => portHullArt()],
  [PORT_REC.cobble, () => portCobbleArt()],
  [PORT_REC.door, () => portDoorArt()],
  [PORT_REC.notices, () => portNoticesArt()],
  [PORT_REC.brass, () => portBrassArt()],
  [PORT_REC.signShips, () => portSignArt('shipyard')],
  [PORT_REC.signCrew, () => portSignArt('crewhall')],
]);
/** Every picture the port's two wear, by record - what a host uploads under PORT_ARCHIVE before it draws. */
export const portArt = () => PORT_PAINTERS.map(([rec, paint]) => [rec, paint()]);
