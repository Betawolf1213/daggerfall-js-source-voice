// @ts-check
// ═══════════════════════════════════════════════════════════════════
// PRECIP3 (2026-10-19, the owner: "If its snowing in one area and raining in the next, the transition should be seamless
// both in ground texture and everything else. This needs to be accurate and as detailed as possible") - THE SNOW THE
// GROUND KEEPS: the snowpack's water (SWE, millimetres of water) at every place and height, integrated over the world
// weather map's own history (weatherMap.js) in the air of airTemperature.js. Pure in (place, height, minute): the same
// white on every client, offline and online, as the systems that dropped it are. bible/07-Rendering/Biome-Precipitation.md
// is the record.
//
// DFU's ground wears its climate's winter archive for the whole of Winter and never otherwise (TerrainMaterialProvider,
// climateSwaps.js getTerrainGroundArchive): the snow is the calendar's, every lowland white on the 1st of Evening Star and
// green on the 1st of First Seed, whatever fell. Here the ground's snow is what fell and has not melted:
//
//   every SNOWPACK.stepMinutes of the event clock, at each altitude level of a place,
//     the fall    = the worn wet system's rate there (weatherMap.js wornAmong - its word and its band's intensity)
//     its snow    = the fall x the snow share of the air at that height (airTemperature.js snowShareOf), lying
//     the melt    = the degree-hours over freezing x SNOWPACK.meltPerDegreeHour, and the rain's own heat through it
//     SWE         = max(0, SWE + snow - melt)
//
// from the last MIDSUMMER (the year's warmest day - no snow in the Iliac Bay outlives it; airTemperature.js COLDEST_DAY +
// 180), when every pack is nought. The steps stand on one grid of the event clock (multiples of stepMinutes from minute
// 0), so a place's history is the same whoever integrates it, from wherever, whenever.
//
// MONOTONE IN HEIGHT: at one place and minute the air only cools with height (LAPSE_C_PER_M), the fall is the same, the
// snow share only rises and the melt only falls - so a step keeps SWE(h) non-decreasing in h, and so does the history.
// A place's whole pack is therefore its SNOWLINE: the heights at which its cover crosses 10, 50 and 90 % (`snowlineOf`),
// and a fragment of ground anywhere reads its cover off its own height against them (render/snowCoverGlsl.js) - snow
// down to the valley after a cold front, a white peak over a green valley in a thaw, the line wandering with the weather.
import { airParamsAt, airGround, macroHeightM, seasonAir, dayAir, spellAt, snowShareOf, dayAndHourOf, LAPSE_C_PER_M, FALL, COLDEST_DAY, RAIN_ALL_C } from './airTemperature.js';
import { systemsNear, wornAmong } from './weatherMap.js';
import { skyMinuteOfEvent, eventMinuteOfSky } from '../skyCalendar.js';
import { TERRAIN_SIZE } from '../../world/terrain/terrainSampler.js';
import { MAX_MAP_PIXEL_Y } from '../../formats/mapsFile.js';

/**
 * THE LAW'S NUMBERS. `stepMinutes` the event clock's step (three hours: a front lives twelve to thirty, a storm cell two
 * and a half to seven); `levels` the altitudes a place's pack is kept at (metres above the sea - the lowest are below it,
 * the air there read on down the lapse, so a pack white to the shore still has a snowline to blend across); `rate` the
 * fall at a band's full intensity (mm of water an hour: a heavy rain front, a cloudburst, a heavy snowfall); `melt` the
 * degree-hour factor (4 mm a degree-day: the textbook's open ground) and `rainMelt` the rain's own heat (a millimetre of
 * rain at T degrees melts T x 4.19 / 334 mm - its heat over the ice's latent); `fullMm` the SWE that hides the ground
 * entirely (about ten centimetres of new snow).
 */
export const SNOWPACK = Object.freeze({
  stepMinutes: 180,
  levels: Object.freeze({ from: -600, step: 200, count: 20 }),
  rate: Object.freeze({ rain: 4, thunder: 10, snow: 2.5 }),
  melt: 4 / 24,
  rainMelt: 4.19 / 334,
  fullMm: 10,
});
const MINUTES_PER_YEAR = 360 * 1440;
/** The sky's minute in its year the packs begin: midsummer, the warmest day (COLDEST_DAY + half a year). */
export const MIDSUMMER_MINUTE = ((COLDEST_DAY + 180) % 360) * 1440;
/** The altitude of level `k` (m above the sea). */
export const levelAltitude = (k) => SNOWPACK.levels.from + k * SNOWPACK.levels.step;
/** The altitude of the level over the first level at or above `h` (the highest a crossing under `h` is read off). */
export const levelAbove = (h) => levelAltitude(Math.min(SNOWPACK.levels.count - 1, Math.max(0, Math.ceil((h - SNOWPACK.levels.from) / SNOWPACK.levels.step)) + 1));

/** The cover a pack of `swe` mm gives the ground: 0 bare, 1 hidden - smooth between (thin snow lies in patches; the
 *  shader's own noise breaks it up, render/snowCoverGlsl.js). Pure. */
export function coverOf(swe) {
  const t = Math.max(0, Math.min(1, swe / SNOWPACK.fullMm));
  return t * t * (3 - 2 * t);
}
/** The SWE whose cover is `c` (0 < c < 1): coverOf's inverse. Pure. */
export function sweOfCover(c) {
  // smoothstep's inverse: t = 0.5 - sin(asin(1 - 2c) / 3)
  const t = 0.5 - Math.sin(Math.asin(1 - 2 * c) / 3);
  return t * SNOWPACK.fullMm;
}
const SWE_10 = sweOfCover(0.1), SWE_50 = sweOfCover(0.5), SWE_90 = sweOfCover(0.9);
/** The heights (m above the sea) where a place's cover crosses 10, 50 and 90 % - its SNOWLINE - off its pack at every
 *  level (`swe`, SNOWPACK.levels), each between the two levels about it; below the lowest level a crossing the pack
 *  already passed reads a level under it, and none is higher than `ceil` (the place's highest ground - a line over it
 *  says only "not on this ground", and reads so whatever the levels above it hold: SnowpackLattice skips them when it
 *  can). The field stays finite, and a blend between two places walks the line through the land between. `out`
 *  [h10, h50, h90]. Pure. */
export function snowlineOf(swe, out = [0, 0, 0], ceil = Infinity) {
  const { from, step, count } = SNOWPACK.levels;
  const cross = (target) => {
    if (swe[0] >= target) return from - step;   // white below the lowest level
    for (let k = 1; k < count; k++) {
      if (swe[k] >= target) {
        const a = swe[k - 1], b = swe[k];
        return from + step * (k - 1 + (target - a) / (b - a));
      }
    }
    return from + step * count;   // never this white, up to the highest level
  };
  out[0] = Math.min(ceil, cross(SWE_10)); out[1] = Math.min(ceil, cross(SWE_50)); out[2] = Math.min(ceil, cross(SWE_90));
  return out;
}
/** A place's cover at altitude `h` off its snowline `[h10, h50, h90]` - piecewise linear through (h10, 0.1), (h50, 0.5),
 *  (h90, 0.9), on out to 0 and 1 at a quarter of the neighbouring span past the ends. The shader's own reading
 *  (render/snowCoverGlsl.js snowAtHeight), term for term. Pure. */
export function coverAtHeight(line, h) {
  const [h10, h50, h90] = line;
  const lo = Math.max(1, h50 - h10), hi = Math.max(1, h90 - h50);
  if (h <= h10) return Math.max(0, 0.1 + 0.1 * (h - h10) / (0.25 * lo));
  if (h <= h50) return 0.1 + 0.4 * (h - h10) / lo;
  if (h <= h90) return 0.5 + 0.4 * (h - h50) / hi;
  return Math.min(1, 0.9 + 0.1 * (h - h90) / (0.25 * hi));
}

/** The fall at a place a step: `raw` the worn wet word (weatherMap.js wornAmong's - a system's own, before any ground
 *  law) at `intensity`, mm of water an hour; 0 for a dry word. Pure. */
export const fallRateOf = (raw, intensity) => (SNOWPACK.rate[raw] ?? 0) * Math.max(0, Math.min(1, intensity || 0));

/**
 * ONE STEP of a place's pack at every level: `swe` (SNOWPACK.levels.count, mm) moved on in place by `hours` of air at
 * `seaAir` degrees at the sea (the levels read on down the lapse) under a fall of `rate` mm an hour. Monotone in height
 * (above). Answers whether any level holds snow after it. Pure.
 */
export function stepPack(swe, seaAir, rate, hours) {
  const { from, step, count } = SNOWPACK.levels;
  let any = false;
  for (let k = 0; k < count; k++) {
    const t = seaAir - LAPSE_C_PER_M * (from + k * step);
    const share = rate > 0 ? snowShareOf(t) : 0;
    const warm = t > 0 ? t : 0;
    const rain = rate * (1 - share) * hours;
    const next = swe[k] + rate * share * hours - (SNOWPACK.melt * warm * hours + SNOWPACK.rainMelt * rain * warm);
    swe[k] = next > 0 ? next : 0;
    if (swe[k] > 0) any = true;
  }
  return any;
}

/** The air at the sea at field (x, z) for one step: its climate's numbers `p` (airParamsAt - fixed for a place), the
 *  sky's year-day and hour, the spell there at event minute `t`, and the fall's chill (`wet` its intensity, `snow` a snow
 *  system's). airTemperature.js airTemperature's own terms at altitude 0. Pure. */
export function seaAirAt(p, x, z, t, day, hour, wet, snow) {
  return seasonAir(p, day) + dayAir(p, hour, wet > 0 ? 1 : 0) + p.spell * spellAt(x, z, t)
    - wet * (FALL.chill + (snow ? FALL.snowCold : 0));
}

/** The first step (an event minute on the step grid) of the snow year holding event minute `t`: the first grid minute at
 *  or after the sky's last midsummer at or before `t`. Pure in `t` and the sky's law. */
export function yearOriginOf(t) {
  const sky = skyMinuteOfEvent(t);
  const since = (((sky - MIDSUMMER_MINUTE) % MINUTES_PER_YEAR) + MINUTES_PER_YEAR) % MINUTES_PER_YEAR;
  const midsummer = eventMinuteOfSky(sky - since);
  return Math.ceil(midsummer / SNOWPACK.stepMinutes) * SNOWPACK.stepMinutes;
}

/** A lattice point's place: field metres of map pixel (px, py)'s centre (x east, z north). */
export const pixelCentreField = (px, py) => [(px + 0.5) * TERRAIN_SIZE, (MAX_MAP_PIXEL_Y - 1 - py + 0.5) * TERRAIN_SIZE];

/**
 * THE PACK ON A LATTICE OF PLACES - map pixel centres every `spacing` pixels - each point's history integrated from its
 * snow year's origin, on the step grid, as far as asked. Points are kept by their lattice index, so a point integrated
 * once is never integrated again however the window about the player moves; a step's systems are found ONCE for every
 * point that needs that step (weatherMap.js systemsNear over their box, the wet types alone) and kept for the points
 * that come later (`_systems`), so a window's new edge integrates for the cost of its own air alone.
 *
 * `climateAt(px, py)` the map's climate index (the weather map's births read it).
 */
export class SnowpackLattice {
  /** @param {{ climateAt: (px: number, py: number) => number, spacing?: number }} o */
  constructor({ climateAt, spacing = 2 }) {
    this.climateAt = climateAt;
    this.spacing = spacing;
    /** @type {Map<string, { i: number, j: number, x: number, z: number, p: any, ceil: number, top: number, swe: Float32Array, step: number, origin: number, empty: boolean }>} */
    this.points = new Map();
    /** @type {Map<number, { x: number, z: number, range: number, systems: any[] }>} the wet systems found at a step, and the disc they cover */
    this._systems = new Map();
    this.stepsRun = 0;
    this.stepsSkipped = 0;
    /** the wet systems at the last minute between steps asked (`packNow`), held apart from the step grid's */
    this._now = null;
  }
  /** The lattice index of the point nearest map pixel (px, py). */
  indexOf(px, py) { return [Math.round(px / this.spacing), Math.round(py / this.spacing)]; }
  /** The point at lattice index (i, j), made (nought, at its year's origin) when first asked. */
  point(i, j, t) {
    const key = `${i},${j}`;
    let pt = this.points.get(key);
    const origin = yearOriginOf(t);
    if (!pt || pt.origin !== origin || pt.step > t) {
      const [x, z] = pixelCentreField(i * this.spacing, j * this.spacing);
      const ceil = pt?.ceil ?? this.topOf(i, j);
      pt = { i, j, x, z, p: pt?.p ?? { ...airParamsAt(x, z) }, ceil, top: levelAbove(ceil), swe: new Float32Array(SNOWPACK.levels.count), step: origin, origin, empty: true };
      this.points.set(key, pt);
    }
    return pt;
  }
  /** THE HIGHEST GROUND a point's snowline reaches (m above the sea, its `ceil`): the macro ground's highest over the
   *  pixels its blend covers (a spacing either side), and the terrain kernel's relief over it (TOP_MARGIN_M). No fragment
   *  ever reads the point's pack over it (snowlineOf's `ceil`) - and a step that cannot snow even a level over it
   *  (`top`, so every level a crossing under `ceil` is read between is exact), on a point holding none, moves nothing. */
  topOf(i, j) {
    const g = airGround(), s = this.spacing;
    if (!g?.heightAt) return levelAltitude(SNOWPACK.levels.count - 1);
    let top = 0;
    for (let dy = -s; dy <= s; dy++) for (let dx = -s; dx <= s; dx++) top = Math.max(top, macroHeightM(g.heightAt(i * s + dx, j * s + dy)));
    return top + TOP_MARGIN_M;
  }
  /** The wet systems standing at event minute `t` over every point of `pts`: found once for a disc about their box,
   *  widened by REACH_PAD so a window that moves on finds its new edge inside it, and kept for the points after. */
  systemsFor(t, pts) {
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    for (const pt of pts) { x0 = Math.min(x0, pt.x); x1 = Math.max(x1, pt.x); z0 = Math.min(z0, pt.z); z1 = Math.max(z1, pt.z); }
    const held = this._systems.get(t);
    if (held && pts.every((pt) => Math.hypot(pt.x - held.x, pt.z - held.z) <= held.range)) return held.systems;
    const x = (x0 + x1) / 2, z = (z0 + z1) / 2, range = Math.hypot(x1 - x0, z1 - z0) / 2 + REACH_PAD;
    const systems = systemsNear(x, z, t, this.climateAt, range, WET_TYPES);
    this._systems.set(t, { x, z, range, systems });
    return systems;
  }
  /**
   * Integrate every point of `pts` to the last step at or before event minute `t`, earliest step first, for at most
   * `budgetMs` of the clock (`now` the clock: performance.now's). Answers true when every point stands there.
   */
  advance(pts, t, budgetMs = Infinity, now = () => performance.now()) {
    const S = SNOWPACK.stepMinutes, target = Math.floor(t / S) * S;
    const start = now();
    for (;;) {
      let lo = Infinity;
      for (const pt of pts) if (pt.step < target && pt.step < lo) lo = pt.step;
      if (lo === Infinity) return true;
      const tStep = lo + S, due = pts.filter((pt) => pt.step === lo);
      this._step(due, tStep, S / 60);
      if (now() - start > budgetMs) return false;
    }
  }
  /** One step at event minute `tStep` for `due` (every one standing a step before it). A step that cannot lay snow on
   *  any of them - each holding none, and its air at its highest ground warmer than RAIN_ALL_C however cold the fall's
   *  chill and the cloud make it - moves nothing, and asks the weather nothing (`stepsSkipped`): the same packs exactly. */
  _step(due, tStep, hours) {
    const [day, hour] = dayAndHourOf(skyMinuteOfEvent(tStep));
    let quiet = true;
    for (const pt of due) {
      if (!pt.empty) { quiet = false; break; }
      const p = pt.p, coldest = seasonAir(p, day) + Math.min(dayAir(p, hour, 0), dayAir(p, hour, 1)) + p.spell * spellAt(pt.x, pt.z, tStep)
        - (FALL.chill + FALL.snowCold) - LAPSE_C_PER_M * pt.top;
      if (coldest < RAIN_ALL_C) { quiet = false; break; }
    }
    if (quiet) {
      for (const pt of due) pt.step = tStep;
      this.stepsSkipped++;
      return;
    }
    const systems = this.systemsFor(tStep, due);
    for (const pt of due) {
      const w = systems.length ? wornAmong(systems, pt.x, pt.z) : NO_FALL;
      const rate = fallRateOf(w.raw, w.intensity);
      const wet = rate > 0 ? w.intensity : 0;
      pt.empty = !stepPack(pt.swe, seaAirAt(pt.p, pt.x, pt.z, tStep, day, hour, wet, w.raw === 'snow'), rate, hours);
      pt.step = tStep;
    }
    this.stepsRun++;
    if (this._systems.size > HELD_STEPS) for (const k of this._systems.keys()) { if (k < tStep - HELD_STEPS * SNOWPACK.stepMinutes) this._systems.delete(k); else break; }
  }
  /**
   * THE PACK NOW at a point that stands on its last step before `t`: that step's pack carried the rest of the way under
   * the air and the fall at `t` itself (a partial step: continuous in time, and equal to the next step's at it). `out`
   * a Float32Array of the levels. Pure in the point and `t`.
   */
  packNow(pt, t, out = new Float32Array(SNOWPACK.levels.count)) {
    out.set(pt.swe);
    const hours = (t - pt.step) / 60;
    if (!(hours > 0)) return out;
    const [day, hour] = dayAndHourOf(skyMinuteOfEvent(t));
    const systems = this.systemsNow(t, [pt]);
    const w = systems.length ? wornAmong(systems, pt.x, pt.z) : NO_FALL;
    const rate = fallRateOf(w.raw, w.intensity);
    stepPack(out, seaAirAt(pt.p, pt.x, pt.z, t, day, hour, rate > 0 ? w.intensity : 0, w.raw === 'snow'), rate, hours);
    return out;
  }
  /** The wet systems at a minute between steps over `pts` - one minute held at a time (a window asks every point's
   *  pack now in one go: asked first for all of them, the rest is held). */
  systemsNow(t, pts) {
    const h = this._now;
    if (h && h.t === t && pts.every((pt) => Math.hypot(pt.x - h.x, pt.z - h.z) <= h.range)) return h.systems;
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    for (const pt of pts) { x0 = Math.min(x0, pt.x); x1 = Math.max(x1, pt.x); z0 = Math.min(z0, pt.z); z1 = Math.max(z1, pt.z); }
    const x = (x0 + x1) / 2, z = (z0 + z1) / 2, range = Math.hypot(x1 - x0, z1 - z0) / 2 + REACH_PAD;
    this._now = { t, x, z, range, systems: systemsNear(x, z, t, this.climateAt, range, WET_TYPES) };
    return this._now.systems;
  }
  /** Forget the held systems of minutes past `t` (a clock run backwards) and every point (the next ask starts over). */
  reset() { this.points.clear(); this._systems.clear(); this._now = null; }
}
/** The weather map's types that fall (a storm cell is found through its rain front). */
export const WET_TYPES = Object.freeze(['rain', 'snow']);
const NO_FALL = Object.freeze({ word: 'sunny', raw: 'sunny', intensity: 0, system: null });
/** How many steps of systems the lattice keeps (a window's new edge integrates against them): a whole snow year. */
const HELD_STEPS = 2880;
/** How far past a box of points a step's systems are found for (m): a window moving this far finds them held. */
const REACH_PAD = 12000;
/** The terrain kernel's relief over the macro ground (m): its noise and its hills stand this far over a pixel's byte. */
const TOP_MARGIN_M = 600;
