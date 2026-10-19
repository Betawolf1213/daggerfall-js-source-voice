// @ts-check
// ═══════════════════════════════════════════════════════════════════
// BANTHA1 (bible/03-World/Bantha-Jungle.md): WHERE THE JUNGLE IS - how far a point stands inside Bantha, as one
// continuous field the layout (on the terrain worker) and the haze (on the main thread) both read, so the trees thin and
// the air clears at the same border.
//
// DFU's political map (POLITIC.PAK, MapsFile.GetPoliticIndex - read here through the port's getRegionIndexAt) names a
// region per map pixel, 819.2 m square: a region's edge is a staircase of pixel edges. Here:
//   - THE FIELD. Each pixel near the region carries its SIGNED DISTANCE from the region's edge - from its centre to the
//     nearest pixel of the other side's square, in pixels, positive inside and negative outside, held at
//     JUNGLE_FIELD_REACH past it - read the first time a pixel is asked and kept (jungleField: no sweep of the map). Read between pixel centres (bilinearly,
//     jungleSignedAt) the field crosses zero along the pixels' shared edges and rounds the staircase's corners.
//   - THE BORDER WANDERS. Two octaves of the ecotone's own value noise (world/ecotone.js ecoNoise - integer-hashed on
//     world tile lattices, the same on every engine and in the worker) move the line by up to JUNGLE_WANDER's
//     amplitudes, so the jungle's edge bends through the land and never runs along a pixel's edge.
//   - TWO SHARES OF IT. The layout's (jungleShare: none JUNGLE_EDGE.out outside the line, whole JUNGLE_EDGE.in inside)
//     and the haze's (world/jungle/jungleHaze.js JUNGLE_HAZE.edge: the haze drifts out past the trees and thickens further
//     in) - each a smoothstep of the one depth.
// A job to the terrain worker carries the pixel's 3x3 of distances (jungleNine) - nine numbers, nothing else crosses.
// ═══════════════════════════════════════════════════════════════════
import { ecoNoise, ecoOrigin } from '../ecotone.js';

/** The regions that are jungle - Glenpoint (MapsFile region 18, POLITIC 146), due north of Daggerfall city, the first of
 *  the continent's biomes. The owner's call (2026-10-18): Bantha, the region the owner first named (10), holds no pixel of
 *  Daggerfall's map and no place - a name it lists and never paints (AUDIT BANTHA1 RISK, tools/jungleExtent.mjs). */
export const JUNGLE_REGIONS = Object.freeze([18]);
/** How far (pixels) from the edge the field is exact; past it a pixel reads this much and a half, its side's sign. */
export const JUNGLE_FIELD_REACH = 6;
/** A map pixel (m) - terrainSampler.js TERRAIN_SIZE, held here as ecotone.js holds its own. */
const PIXEL_M = 819.2;
const TILE_M = 6.4;
/** The border's wander: two octaves of the ecotone's value noise - a lattice cell (tiles) and an amplitude (m) each -
 *  and their salt (the ecotone's own seams take 101 and 211 - the jungle's line bends its own way). */
export const JUNGLE_WANDER = Object.freeze({
  octaves: Object.freeze([Object.freeze({ cell: 64, amp: 150 }), Object.freeze({ cell: 8, amp: 40 })]),
  salt: 467,
});
/** The layout's share across the line (m of depth): none this far outside it, whole this far inside. */
export const JUNGLE_EDGE = Object.freeze({ out: 60, in: 480 });

const smoothstep = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * THE FIELD over a `width` x `height` map, ASKED, NEVER SWEPT: `at(x, y)` a pixel's signed distance (pixels; the file's
 * head), `-(reach + 0.5)` off the map and wherever nothing of the other side is within the reach. A pixel's distance is
 * read the first time it is asked - its neighbours' regions out to the reach, ring by ring, stopping once no nearer ring
 * can beat what it found - and kept, as each pixel's region is kept once read: a pixel the stream never builds is never
 * read, and no frame or boot pays for the map's other 499,000 pixels. `regionAt(x, y)` a pixel's region
 * (MapsFile.getRegionIndexAt); a pixel off the map is outside.
 * @param {{ width: number, height: number, regionAt: (x: number, y: number) => number, regions?: readonly number[], reach?: number }} o
 */
export function jungleField({ width, height, regionAt, regions = JUNGLE_REGIONS, reach = JUNGLE_FIELD_REACH }) {
  const isJungle = regions.length === 1 ? ((r) => r === regions[0]) : ((r) => regions.includes(r));
  const side = new Uint8Array(width * height).fill(2);   // 2 not yet read, 1 the jungle's, 0 not
  const dist = new Float32Array(width * height).fill(NaN);
  const far = reach + 0.5;
  const sideAt = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return 0;
    const i = y * width + x;
    let v = side[i];
    if (v === 2) side[i] = v = isJungle(regionAt(x, y)) ? 1 : 0;
    return v;
  };
  const toOther = (me, x, y, dx, dy, best) => {
    if (sideAt(x + dx, y + dy) === me) return best;
    return Math.min(best, Math.hypot(Math.max(Math.abs(dx) - 0.5, 0), Math.max(Math.abs(dy) - 0.5, 0)));
  };
  return {
    width, height, reach,
    /** A pixel's region read as the jungle's (1) or not (0) - off the map, not. */
    inside: sideAt,
    /** A pixel's signed distance from the jungle's edge (pixels). */
    at(x, y) {
      if (x < 0 || y < 0 || x >= width || y >= height) return -far;
      const i = y * width + x;
      const known = dist[i];
      if (known === known) return known;   // read before
      const me = sideAt(x, y);
      let best = far;
      // ring r's nearest square is r - 0.5 off: past the best found, no ring can beat it
      for (let r = 1; r <= reach && r - 0.5 < best; r++) {
        for (let k = -r; k <= r; k++) { best = toOther(me, x, y, k, -r, best); best = toOther(me, x, y, k, r, best); }
        for (let k = -r + 1; k <= r - 1; k++) { best = toOther(me, x, y, -r, k, best); best = toOther(me, x, y, r, k, best); }
      }
      dist[i] = me ? best : -best;
      return dist[i];   // AUDIT BANTHA1 LAY-8: the first read the float32 every later read is - never the float64 it came from
    },
  };
}

/** The field's cache, one a maps object (the world's; a new install of the map is a new object). */
const _fields = new WeakMap();
/**
 * The world's field, made the first time it is asked (nothing read until a pixel is) and kept with the map.
 * @param {{ getRegionIndexAt: (x: number, y: number) => number }} maps @param {number} width @param {number} height
 */
export function jungleFieldOf(maps, width, height) {
  let f = _fields.get(maps);
  if (!f) { f = jungleField({ width, height, regionAt: (x, y) => maps.getRegionIndexAt(x, y) }); _fields.set(maps, f); }
  return f;
}

/**
 * A PIXEL'S 3x3 OF DISTANCES - indexed (dz + 1) * 3 + (dx + 1), dx east and dz north (the map row py - dz), as the
 * ecotone's 3x3 of climates is - or null when the jungle is nowhere near (every one of the nine at the field's far
 * outside: no share can reach this pixel).
 * `out` the nine's array (AUDIT BANTHA1 HOST-8: a frame's own scratch; a terrain job's a new one).
 * @param {ReturnType<typeof jungleField>} field @param {number} px @param {number} py @param {any[]} [out]
 */
export function jungleNine(field, px, py, out = new Array(9)) {
  if (!field) return null;
  const far = -(field.reach + 0.5);
  let any = false;
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      const v = field.at(px + dx, py - dz);
      out[(dz + 1) * 3 + dx + 1] = v;
      if (v > far) any = true;
    }
  }
  return any ? out : null;
}

/**
 * THE SIGNED DISTANCE (m) at a pixel-local point (x east, z north, metres - natureStandsAt's frame): the 3x3's values
 * read bilinearly between the pixel centres about the point - positive inside the jungle.
 * @param {ArrayLike<number>} nine jungleNine's @param {number} x @param {number} z
 */
export function jungleSignedAt(nine, x, z) {
  const u = x / PIXEL_M, v = z / PIXEL_M;
  const i = u < 0.5 ? -1 : 0, j = v < 0.5 ? -1 : 0;
  const fx = u - 0.5 - i, fz = v - 0.5 - j;
  const a = nine[(j + 1) * 3 + i + 1], b = nine[(j + 1) * 3 + i + 2], c = nine[(j + 2) * 3 + i + 1], e = nine[(j + 2) * 3 + i + 2];
  return ((a * (1 - fx) + b * fx) * (1 - fz) + (c * (1 - fx) + e * fx) * fz) * PIXEL_M;
}

/**
 * HOW DEEP IN THE JUNGLE a pixel-local point stands (m, negative outside): the signed distance moved by the border's
 * wander (JUNGLE_WANDER) - continuous across every pixel edge, the same on the worker and the main thread.
 * @param {number} px @param {number} py @param {ArrayLike<number>} nine @param {number} x @param {number} z
 */
export function jungleDepthAt(px, py, nine, x, z) {
  const origin = ecoOrigin(px, py), tx = x / TILE_M, tz = z / TILE_M;
  let w = 0;
  JUNGLE_WANDER.octaves.forEach((o, k) => { w += o.amp * (2 * ecoNoise(origin, tx, tz, o.cell, JUNGLE_WANDER.salt + k) - 1); });
  return jungleSignedAt(nine, x, z) + w;
}

/** The layout's share at a depth (m): 0 past JUNGLE_EDGE.out outside the line, 1 past JUNGLE_EDGE.in inside it. */
export const jungleShare = (depth) => smoothstep(-JUNGLE_EDGE.out, JUNGLE_EDGE.in, depth);

/** AUDIT PRECIP AIR-12: THE JUNGLE'S AIR leans in over a band of its own (m of depth: none this far outside the line,
 *  whole this far inside) - kilometres, where the haze's is a few hundred metres (it held the tropics' air and the
 *  mountain woods' a 19 C step apart across 1.5 km, and the sleet between them to 75 m). Over this band a Glenpoint winter
 *  walks from snow through a few hundred metres of sleet into the jungle's rain. Inside the field's exact reach
 *  (JUNGLE_FIELD_REACH, 4.9 km) both ways; the jungle stands 24 km deep at its heart. */
export const JUNGLE_AIR_EDGE = Object.freeze({ out: 2000, in: 4000 });
/** The jungle's air's share at a depth (m): 0 past JUNGLE_AIR_EDGE.out outside the line, 1 past JUNGLE_AIR_EDGE.in in. */
export const jungleAirShare = (depth) => smoothstep(-JUNGLE_AIR_EDGE.out, JUNGLE_AIR_EDGE.in, depth);

/** The most the wander moves the line (m) - a pixel whose 3x3 is all farther outside than this and the layout's own
 *  reach stands no jungle at all. */
export const JUNGLE_WANDER_MAX = JUNGLE_WANDER.octaves.reduce((s, o) => s + o.amp, 0);
