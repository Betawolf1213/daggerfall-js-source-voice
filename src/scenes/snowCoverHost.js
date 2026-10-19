// @ts-check
// ═══════════════════════════════════════════════════════════════════
// PRECIP4 (2026-10-19, the owner: "If its snowing in one area and raining in the next, the transition should be seamless
// both in ground texture and everything else. This needs to be accurate and as detailed as possible") - THE SNOW ON THE
// GROUND, about the player: a module the world host wires (HOST-SPLIT, bible/01-Overview/Host-Split.md: scenes/fishHost.js
// is the shape), never grown into bootWorld. bible/07-Rendering/Biome-Precipitation.md is the record.
//
// DFU dresses the whole world in its winter archive on the calendar (TerrainMaterialProvider's +1, the climate swaps'
// winter textures, the nature sets' winter records - climateSwaps.js) and the streaming host re-skins every pixel at the
// flip (world.js tickSeason). On the SNOW LANE (`owns`: the enhanced lane's precipitation law - weatherSim.js
// precipLawOn) the ground keeps what fell instead (systems/weather/snowpack.js), read here and handed to:
//   - THE GROUND: every terrain draw's snowline at its pixel's corners (`drawOf`, render/snowCoverGlsl.js) and its set's
//     TWIN (`arrayOf` - its summer records and its winter ones, renderer.js makeTwinArray), so each fragment of ground
//     wears its own climate's winter tile in the share of the snow at its own height and slope: a white peak over a green
//     valley, a snowline wandering with the weather, a thaw's patches, the jungle's rain stopping at the snow;
//   - THE BUILD: a pixel's buildings, its town's climate swaps and its windmills wear the season of the snow at its
//     middle (`seasonOfPixel`, held either side of a band so a cover hovering at a half never flips it back and forth),
//     and each of its trees and plants the season of the snow at its own foot against a draw of its own (`flatSeason`) -
//     across a snowline the woods whiten tree by tree, never a pixel's square at once;
//   - THE SWEEP: a standing pixel built under other snow than now (its middle's season turned, or its flats' cover moved
//     a step - `sweep`) is built again through the season's own re-skin (world.js _reskin), nearest first, a few at a time;
//   - THE PLAYER'S FEET: whether snow lies where they stand (`winterAt` - the footsteps and the Snowfall mod's surfaces).
// Off the lane every answer is DFU's: the season the host holds, the set as it is, no snow in the draw.
import { SnowpackLattice, snowlineOf, coverAtHeight, SNOWPACK } from '../systems/weather/snowpack.js';
import { SEA_LEVEL_M } from '../systems/weather/airTemperature.js';
import { TERRAIN_SIZE as PIXEL_M } from '../world/terrain/terrainSampler.js';
import { getTerrainGroundArchive, groundIsSnowy, SEASON } from '../world/climateSwaps.js';
import { ecoOrigin } from '../world/ecotone.js';
import { TWIN_LAYERS } from '../render/snowCoverGlsl.js';

/**
 * THE HOST'S NUMBERS. `spacing` the lattice's (map pixels: 1.6 km - the snowline's field is smooth over that, its fall's
 * systems tens of kilometres across) and `radius` its points either side of the player's (ten pixels: the land view's six
 * and the blend's corners past them); `budgetMs` a frame's integration while the player plays and `arriveMs` while the
 * world stands up about them (no ground under their feet yet); `nowMinutes` how often the pack now is read again (game
 * minutes - the cover moves over hours); `ease` the seconds a point's shown snowline takes to reach a new one (a window
 * integrated on arrival comes in over a breath, never a pop); `sweepMinutes` how often the standing pixels are asked
 * again, `sweepMax` how many one sweep rebuilds; `winter` the cover a pixel's buildings turn to winter at and back to
 * summer under; `flatStep` how far its flats' cover moves before it is built again.
 */
export const SNOW_COVER = Object.freeze({
  spacing: 2,
  radius: 5,
  budgetMs: 3,
  arriveMs: 40,
  nowMinutes: 5,
  ease: 0.6,
  sweepMinutes: 20,
  sweepMax: 4,
  winter: Object.freeze([0.4, 0.6]),
  flatStep: 0.25,
});
/** The PLACE-LRU key of a ground set's twin (renderer.js makeTwinArray). */
export const twinKey = (summer) => `twin:${summer}`;
/** A flat's own draw against the cover at its foot (0..1) - its place's hash, so a tree is snowy or not alike on every
 *  client, and the trees across a snowline go white in a scatter. Pure. */
export function flatDraw(px, py, x, z) {
  let h = (Math.imul(px, 0x27d4eb2d) ^ Math.imul(py, 0x165667b1) ^ Math.imul(Math.round(x * 8), 0x9e3779b1) ^ Math.imul(Math.round(z * 8), 0x85ebca6b)) >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x7feb352d) >>> 0; h ^= h >>> 15; h = Math.imul(h, 0x846ca68b) >>> 0; h ^= h >>> 16;
  return 0.15 + 0.7 * ((h >>> 8) / 16777216);   // never at the ends: a whole cover whitens every tree, none leaves them all
}

/**
 * @param {{ renderer: any, climateAt: (px: number, py: number) => number,
 *   mapHeight: number, stateOf: () => any, builtOf: () => Map<string, any>, heightAt: (x: number, z: number) => number,
 *   owns: () => boolean, markReskin: (key: string) => void }} deps
 *   `climateAt` the map's climate index; `stateOf()` the stream's state, `builtOf()` its pixels and `heightAt` its ground
 *   at a scene point (asked, never held); `owns()` whether the snow lane runs (weatherSim.js
 *   precipLawOn - the enhanced lane's law, with a host that handed the air its map); `markReskin(key)` the season's
 *   re-skin of one pixel (world.js _reskin.mark)
 */
export function createSnowCoverHost({ renderer, climateAt, mapHeight, stateOf, builtOf, heightAt, owns, markReskin }) {
  const lattice = new SnowpackLattice({ climateAt, spacing: SNOW_COVER.spacing });
  /** each point's snowline: `target` the pack now's, `shown` eased toward it; by lattice key */
  const lines = new Map();
  let window = [], centre = null, ready = false, nowRead = -Infinity, gen = 0, lastSweep = -Infinity, lastT = -Infinity;
  let on = false;
  /** the summer ground archives with a winter of their own, and that winter */
  const winterOf = new Map();
  /** each pixel's buildings' season, as last built (the band's memory) */
  const pixelSeason = new Map();
  const _pack = new Float32Array(SNOWPACK.levels.count), _line = [0, 0, 0];

  /** The window about the player's pixel: the lattice points (2 radius + 1)^2 about the nearest. */
  const windowAbout = (px, py, t) => {
    const [ci, cj] = lattice.indexOf(px, py), R = SNOW_COVER.radius;
    if (centre && centre[0] === ci && centre[1] === cj && window.length && window[0].origin === lattice.point(ci, cj, t).origin) return;
    centre = [ci, cj];
    window = [];
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) window.push(lattice.point(ci + i, cj + j, t));
    ready = false;
  };
  /** A point's snowline now (`target`), read off its pack carried to `t`. */
  const readNow = (pt, t) => {
    snowlineOf(lattice.packNow(pt, t, _pack), _line, pt.ceil);
    let l = lines.get(`${pt.i},${pt.j}`);
    if (!l) lines.set(`${pt.i},${pt.j}`, (l = { target: new Float32Array(3), shown: null }));
    l.target[0] = _line[0]; l.target[1] = _line[1]; l.target[2] = _line[2];
    if (!l.shown) l.shown = Float32Array.from(BARE_LINE);   // a point first read comes in from bare ground, eased
  };
  /** The line a lattice point shows, or bare ground for one not yet read. */
  const shownAt = (i, j) => lines.get(`${i},${j}`)?.shown ?? BARE_LINE;

  /** The snowline at field (x, z), bilinear between the four lattice points about it (as shown). `out` [h10, h50, h90]. */
  function lineAt(x, z, out = [0, 0, 0]) {
    const S = SNOW_COVER.spacing;
    const fi = (x / PIXEL_M - 0.5) / S, fj = ((mapHeight - 1) + 0.5 - z / PIXEL_M) / S;
    const i0 = Math.floor(fi), j0 = Math.floor(fj), u = fi - i0, v = fj - j0;
    const a = shownAt(i0, j0), b = shownAt(i0 + 1, j0), c = shownAt(i0, j0 + 1), d = shownAt(i0 + 1, j0 + 1);
    for (let k = 0; k < 3; k++) out[k] = (a[k] * (1 - u) + b[k] * u) * (1 - v) + (c[k] * (1 - u) + d[k] * u) * v;
    return out;
  }
  const _l = [0, 0, 0];
  /** The cover at field (x, z) and `altitude` metres above the sea (0..1, before the ground's slope and patches). */
  const coverAt = (x, z, altitude) => (on ? coverAtHeight(lineAt(x, z, _l), altitude) : 0);
  /** Field metres of a pixel-local point. */
  const fieldOf = (px, py, lx, lz) => [px * PIXEL_M + lx, (mapHeight - 1 - py) * PIXEL_M + lz];

  /** THE DRAW'S SNOW for a standing pixel (renderer.drawTerrain's `snow`), made again when the lines move. */
  const draws = new WeakMap();
  function drawOf(p) {
    if (!on || !p) return null;
    let d = draws.get(p);
    if (!d) {
      const [tx, tz] = ecoOrigin(p.px, p.py);
      d = { h10: new Float32Array(4), h50: new Float32Array(4), h90: new Float32Array(4), set: new Float32Array(4), eco: new Int32Array(3), tile: Int32Array.of(tx, tz), gen: -1 };
      draws.set(p, d);
    }
    if (d.gen !== gen) {
      d.gen = gen;
      // the corners SW, SE, NW, NE - pixel-local (0, 0), (S, 0), (0, S), (S, S); z north
      for (let k = 0; k < 4; k++) {
        const [x, z] = fieldOf(p.px, p.py, (k & 1) * PIXEL_M, (k >> 1) * PIXEL_M);
        lineAt(x, z, _l);
        d.h10[k] = _l[0]; d.h50[k] = _l[1]; d.h90[k] = _l[2];
      }
      d.set[1] = 1;
      d.set[2] = winterOf.has(p.groundArchive) ? TWIN_LAYERS : 0;
      for (let k = 0; k < 3; k++) d.eco[k] = p.eco?.archives?.[k] != null && winterOf.has(p.eco.archives[k]) ? TWIN_LAYERS : 0;
    }
    d.set[0] = -(stateOf().compensation[1] + SEA_LEVEL_M);   // the world's height as metres above the sea, this frame's
    return d;
  }

  return {
    /** Whether the snow lane runs - read once a frame by `tick`. */
    get on() { return on; },
    /** Whether the window about the player is integrated to now. */
    get ready() { return ready; },
    /**
     * THE FRAME: the lane asked again (a turn re-skins every standing pixel - DFU's season or the snow's), the window
     * about the player's pixel (px, py) kept, its points integrated to event minute `t` within the frame's budget
     * (`arriving` - no ground under the player yet - the larger), the pack now read every SNOW_COVER.nowMinutes and the
     * shown lines eased over `dt` seconds; then the standing pixels swept every SNOW_COVER.sweepMinutes.
     */
    tick({ px, py, t, dt = 0, arriving = false }) {
      const was = on;
      on = !!owns();
      if (on !== was) { for (const key of builtOf().keys()) markReskin(key); pixelSeason.clear(); }
      if (!on || !Number.isFinite(t)) return;
      if (t < lastT - SNOWPACK.stepMinutes) { lattice.reset(); lines.clear(); centre = null; nowRead = lastSweep = -Infinity; }   // the clock ran backwards (a save loaded): the packs again from their origin
      lastT = t;
      windowAbout(px, py, t);
      if (!ready) {
        ready = lattice.advance(window, t, arriving ? SNOW_COVER.arriveMs : SNOW_COVER.budgetMs);
        if (ready) nowRead = -Infinity;
      } else if (Math.floor(t / SNOWPACK.stepMinutes) * SNOWPACK.stepMinutes > window[0].step) {
        ready = lattice.advance(window, t, SNOW_COVER.budgetMs);   // a step's turn: one step each, a fraction of a millisecond
      }
      if (ready && (t - nowRead >= SNOW_COVER.nowMinutes || t < nowRead)) {
        nowRead = t;
        lattice.systemsNow(t, window);   // the window's systems now, asked once for all of them
        for (const pt of window) readNow(pt, t);
      }
      // ease the shown lines toward their targets (a whole window read on arrival comes in over a breath)
      const k = Math.min(1, dt / SNOW_COVER.ease);
      let moved = false;
      for (const l of lines.values()) {
        if (!l.shown) continue;
        for (let q = 0; q < 3; q++) {
          const d = l.target[q] - l.shown[q];
          if (Math.abs(d) < 0.5) { if (d) { l.shown[q] = l.target[q]; moved = true; } continue; }
          l.shown[q] += d * k; moved = true;
        }
      }
      if (moved) gen++;
      if (ready && (t - lastSweep >= SNOW_COVER.sweepMinutes || t < lastSweep)) { lastSweep = t; this.sweep(); }
    },
    lineAt,
    coverAt,
    drawOf,
    /** THE TILE ARRAY a pixel's ground draws with for its summer archive `a`: on the lane its twin where it has one. */
    arrayOf(a) {
      if (a == null) return null;
      return (on && winterOf.has(a) ? renderer.tileArrays.get(twinKey(a)) : null) ?? renderer.tileArrays.get(a) ?? null;
    },
    /** THE BUILD'S GROUND for a climate: on the lane its summer archive (the twin dresses its winter), else DFU's for the
     *  host's `season`. */
    groundArchive(climate, season) { return getTerrainGroundArchive(climate, on ? SEASON.Summer : season); },
    /** THE TWIN of a climate's ground, loaded and made for a build (`loadGroundSet(archive, hold)` the host's own set
     *  loader, `hold` the pixel's PLACE-LRU hold) - its winter set, and the two copied into one; nothing off the lane,
     *  or for a climate whose ground wears no winter (a desert's - TerrainMaterialProvider's guard). */
    async loadTwin(climate, hold, loadGroundSet) {
      if (!on || !groundIsSnowy(climate, SEASON.Winter)) return;
      const summer = getTerrainGroundArchive(climate, SEASON.Summer), winter = getTerrainGroundArchive(climate, SEASON.Winter);
      await loadGroundSet(winter, hold);
      hold.tileArray(twinKey(summer));
      if (renderer.makeTwinArray(twinKey(summer), summer, winter)) winterOf.set(summer, winter);
    },
    /** A PIXEL'S BUILDINGS' SEASON: the snow at its middle's ground (`altitude`, m above the sea), Winter from the band's
     *  top and kept down to its foot; the host's own `season` off the lane. */
    seasonOfPixel(px, py, altitude, season) {
      if (!on) return season;
      const [x, z] = fieldOf(px, py, PIXEL_M / 2, PIXEL_M / 2), c = coverAt(x, z, altitude), key = `${px},${py}`;
      const was = pixelSeason.get(key) ?? SEASON.Summer;
      const now = c >= SNOW_COVER.winter[was === SEASON.Winter ? 0 : 1] ? SEASON.Winter : SEASON.Summer;
      pixelSeason.set(key, now);
      return now;
    },
    /** A FLAT'S SEASON: Winter where the snow at its foot (pixel-local `lx`, `lz`, `altitude` m above the sea) reaches
     *  its own draw (flatDraw); the pixel's `season` off the lane. */
    flatSeason(px, py, lx, lz, altitude, season) {
      if (!on) return season;
      const [x, z] = fieldOf(px, py, lx, lz);
      return coverAt(x, z, altitude) >= flatDraw(px, py, lx, lz) ? SEASON.Winter : SEASON.Summer;
    },
    /** WHETHER THE SNOW BURIES a grass blade's root at pixel-local (`lx`, `lz`) of standing pixel `p` (scene `x`, `z`):
     *  the cover at the ground there reaching the blade's own draw (flatDraw) - a meadow thins into the snow as the woods
     *  whiten. False off the lane. */
    buries(p, lx, lz, x, z) {
      if (!on) return false;
      const [fx, fz] = fieldOf(p.px, p.py, lx, lz);
      return coverAt(fx, fz, heightAt(x, z) - stateOf().compensation[1] - SEA_LEVEL_M) >= flatDraw(p.px, p.py, lx, lz);
    },
    /** A STANDING PIXEL'S SNOW AS BUILT (its middle's cover at its low, middle and high ground) - kept on the pixel at
     *  publish (`p._snow`), what the sweep compares. Null off the lane. */
    signatureOf(px, py, lo, mid, hi) {
      if (!on) return null;
      const [x, z] = fieldOf(px, py, PIXEL_M / 2, PIXEL_M / 2);
      return { alts: [lo, mid, hi], covers: [lo, mid, hi].map((h) => coverAt(x, z, h)), season: pixelSeason.get(`${px},${py}`) ?? SEASON.Summer };
    },
    /** THE SWEEP: the standing pixels built under other snow than now - their buildings' season turned, or their flats'
     *  cover moved SNOW_COVER.flatStep - built again through the re-skin, the nearest SNOW_COVER.sweepMax first. */
    sweep() {
      if (!on) return [];
      const state = stateOf(), cx = state.current?.x ?? 0, cy = state.current?.y ?? 0;
      const due = [];
      for (const [key, p] of builtOf()) {
        const s = p._snow;
        if (!s) continue;
        const [x, z] = fieldOf(p.px, p.py, PIXEL_M / 2, PIXEL_M / 2);
        const covers = s.alts.map((h) => coverAt(x, z, h));
        const c = covers[1], band = SNOW_COVER.winter;
        const turned = s.season === SEASON.Winter ? c < band[0] : c >= band[1];
        if (turned || covers.some((v, k) => Math.abs(v - s.covers[k]) >= SNOW_COVER.flatStep)) due.push([Math.hypot(p.px - cx, p.py - cy), key]);
      }
      due.sort((a, b) => a[0] - b[0]);
      const keys = due.slice(0, SNOW_COVER.sweepMax).map(([, key]) => key);
      for (const key of keys) markReskin(key);
      return keys;
    },
    /** WHETHER SNOW LIES under the player at scene point `pos` (its cover past a half): on the lane the snow's, else
     *  `fallback` (the host's season - DFU's word). */
    winterAt(pos, fallback) {
      if (!on || !pos) return fallback;
      const state = stateOf(), c = state.compensation;
      const px = state.mapOrigin.x + Math.floor((pos[0] - c[0]) / PIXEL_M), py = state.mapOrigin.y - Math.floor((pos[2] - c[2]) / PIXEL_M);
      const t = state.pixelTranslation(px, py, [0, 0, 0]);
      const [x, z] = fieldOf(px, py, pos[0] - t[0], pos[2] - t[2]);
      return coverAt(x, z, pos[1] - c[1] - SEA_LEVEL_M) >= 0.5;
    },
    /** For the tests and the probes. */
    get _lattice() { return lattice; },
    get _window() { return window; },
    get _lines() { return lines; },
  };
}
/** Bare ground's snowline: never under the highest level. */
const BARE_LINE = Object.freeze([SNOWPACK.levels.from + SNOWPACK.levels.step * SNOWPACK.levels.count, SNOWPACK.levels.from + SNOWPACK.levels.step * SNOWPACK.levels.count, SNOWPACK.levels.from + SNOWPACK.levels.step * SNOWPACK.levels.count]);
