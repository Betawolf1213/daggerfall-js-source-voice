// @ts-check
// ═══════════════════════════════════════════════════════════════════
// PRECIP1 (2026-10-19, the owner: "I also want to begin giving each biome their own precipitation. It shouldnt snow
// everywhere or rain everywhere when the season is winter, etc. It should truly be dynamic just like how we have a dynamic
// cloud and weather system. If its snowing in one area and raining in the next, the transition should be seamless both in
// ground texture and everything else. This needs to be accurate and as detailed as possible") - THE AIR: a temperature
// (degrees Celsius) at every place, height and minute, pure in the three - the same on every client, offline and online,
// as the weather map is (weatherMap.js). bible/07-Rendering/Biome-Precipitation.md is the record.
//
// DFU has no temperature. Its weather table rolls Snow for a climate in Winter and never otherwise; its ground swaps
// to the winter archive for every climate but a Desert base on the calendar; the port's WEATHER2a funnelled rain over
// that ground into snow. So a winter's rain in the Rainforest fell as snow, a summer storm on a 1,900 m peak fell as
// rain, and the line between the two was a map pixel's straight edge. Here the PHASE of what falls (snowShareOf) and
// the snow the ground keeps (snowpack.js) are read off one physical quantity:
//
//   T = the climate's season (CLIMATE_AIR, a cosine through the year, coldest late Morning Star)
//     + its day (warmest mid-afternoon, coldest before dawn - damped under cloud)
//     + the synoptic spell (a drifting value noise in space and time: a cold snap, a thaw, never rolled)
//     - LAPSE_C_PER_M x the height above the sea (DFU's terrain heights: kernel units x 1.25 m, the sea at 34 m)
//     - a falling system's own chill (the air under rain or snow is cooler; a snow front brings its cold with it)
//
// THE CLIMATE BLENDS. A climate's numbers stand at its map pixel's CENTRE and are read bilinearly between centres - so
// the air warms across a Mountain-to-Desert border over the pixel either side of it, never at the edge. A BIOME OVERLAY
// (the Glenpoint jungle - world/jungle/jungleRegion.js's field) leans the numbers toward its own by its share, so the
// jungle's rain stops at its wandering edge in a band of sleet, and the snow begins.
import { CLIMATES, MAX_MAP_PIXEL_X, MAX_MAP_PIXEL_Y } from '../../formats/mapsFile.js';
import { TERRAIN_SIZE, BASE_HEIGHT_SCALE, STREAMING_TERRAIN_SCALE, SCALED_OCEAN_ELEVATION } from '../../world/terrain/terrainSampler.js';
import { seededFirst } from '../wind/wind.js';

/** The sea's surface in world metres (the kernel's ocean elevation, at the streamed scale) - heights are above it. */
export const SEA_LEVEL_M = SCALED_OCEAN_ELEVATION * STREAMING_TERRAIN_SCALE;
/** The air cools this much a metre up (the standard atmosphere's 6.5 degrees a kilometre). */
export const LAPSE_C_PER_M = 0.0065;
/** The year's day the climate is coldest (0 the 1st of Morning Star; the year is 360 days). The warmest stands 180 on. */
export const COLDEST_DAY = 20;
/** The hour the day is warmest; the coldest is twelve hours round. */
export const WARMEST_HOUR = 15;

/**
 * EACH CLIMATE'S AIR AT THE SEA (degrees C): its year's `mean`, the half-range of its seasons `amp`, the half-range of its
 * day `day`, and how hard its weather swings `spell` (the synoptic anomaly's amplitude). Ocean is the Bay's mild maritime
 * air; Desert and Desert2 the Alik'r and the Dak'fron, hot, dry and wide-ranging by day; Mountain and MountainWoods the
 * continental air of High Rock's ranges and the Dragontail (their height above the sea does the rest - LAPSE_C_PER_M);
 * Rainforest the steady tropics; Swamp and Subtropical the Bay's warm south. Chosen so a winter at the height each climate
 * actually stands at (measured on the freeware's data, the record's table) falls as DFU's table says it should - the
 * woodlands and the ranges white, the desert, the jungle and the subtropics never - and so the cases between (a coast in
 * a cold snap, a valley in a thaw, a summer peak at night) fall as the air there decides.
 */
export const CLIMATE_AIR = Object.freeze({
  [CLIMATES.Ocean]: Object.freeze({ mean: 11, amp: 6, day: 2, spell: 3.5, row: 202 }),
  [CLIMATES.Desert]: Object.freeze({ mean: 22, amp: 9, day: 8, spell: 3.5, row: 402 }),
  [CLIMATES.Desert2]: Object.freeze({ mean: 21, amp: 10, day: 9, spell: 3.5, row: 460 }),
  [CLIMATES.Mountain]: Object.freeze({ mean: 9, amp: 11, day: 5, spell: 5, row: 11 }),
  [CLIMATES.Rainforest]: Object.freeze({ mean: 26, amp: 2, day: 4, spell: 1.5, row: 290 }),
  [CLIMATES.Swamp]: Object.freeze({ mean: 16, amp: 7, day: 3, spell: 3, row: 325 }),
  [CLIMATES.Subtropical]: Object.freeze({ mean: 20, amp: 6, day: 5, spell: 2.5, row: 353 }),
  [CLIMATES.MountainWoods]: Object.freeze({ mean: 9.5, amp: 11, day: 5, spell: 5, row: 95 }),
  [CLIMATES.Woodlands]: Object.freeze({ mean: 10, amp: 11, day: 4.5, spell: 5, row: 29 }),
  [CLIMATES.HauntedWoodlands]: Object.freeze({ mean: 9, amp: 11, day: 4.5, spell: 5, row: 11 }),
});
/** THE LATITUDE: the air warms this much a map row south (the map's rows run south - 819.2 m each; about one degree a
 *  hundred kilometres). Each climate's numbers above stand at its own median row (`row`, measured on the freeware's
 *  CLIMATE.PAK), so the term moves a climate's far ends and never its middle: the Wrothgarian's winter and the
 *  Dragontail's - both "Mountain", 420 rows apart - are not one winter. */
export const LATITUDE_C_PER_ROW = 0.008;
/** A climate the table does not know (a world-data mod's) reads the woodlands' air. */
const DEFAULT_AIR = CLIMATE_AIR[CLIMATES.Woodlands];

/** THE SYNOPTIC SPELL: two octaves of value noise over space and time, drifting east-north-east as the Bay's air does -
 *  a cold snap a few hundred kilometres across lasting days, a shorter shiver inside it. Weighted to sum to one. */
export const SPELL = Object.freeze({
  octaves: Object.freeze([
    Object.freeze({ cell: 240000, minutes: 5760, weight: 0.7 }),
    Object.freeze({ cell: 60000, minutes: 1440, weight: 0.3 }),
  ]),
  drift: Object.freeze([18, 6]),   // metres a game minute the air mass moves (east, north)
  salt: 0x41495254,   // 'AIRT'
});

/** UNDER A FALLING SYSTEM: the day's swing damped to this share under full cloud, and the air cooled this much by what
 *  falls through it at full intensity; a SNOW system brings this much more cold with it (the air mass that bore it). */
export const FALL = Object.freeze({ dayUnderCloud: 0.4, chill: 1.5, snowCold: 1.5 });

/** THE PHASE: snow below SNOW_ALL_C, rain above RAIN_ALL_C, and between them both at once - sleet, wet snow - its snow
 *  share falling smoothly (the band real snow lines show, where the wet-bulb sits near freezing). */
export const SNOW_ALL_C = 0;
export const RAIN_ALL_C = 2.5;

const smooth = (t) => t * t * (3 - 2 * t);
/** The snow share of what falls in air at `celsius`: 1 all snow, 0 all rain, between them both. Pure. */
export function snowShareOf(celsius) {
  if (!(celsius > SNOW_ALL_C)) return 1;
  if (celsius >= RAIN_ALL_C) return 0;
  return 1 - smooth((celsius - SNOW_ALL_C) / (RAIN_ALL_C - SNOW_ALL_C));
}

/** The climate's air at the sea through the year: its mean less the season's swing, coldest on COLDEST_DAY. `day` the
 *  year's day as a real (0..360, the minute's fraction in it). Pure. */
export const seasonAir = (p, day) => p.mean - p.amp * Math.cos(2 * Math.PI * (day - COLDEST_DAY) / 360);
/** The day's swing at `hour` (a real, 0..24): warmest at WARMEST_HOUR. `cloud` 0..1 damps it (FALL.dayUnderCloud). */
export const dayAir = (p, hour, cloud = 0) => p.day * Math.cos(2 * Math.PI * (hour - WARMEST_HOUR) / 24) * (1 - (1 - FALL.dayUnderCloud) * Math.min(1, Math.max(0, cloud)));

const hash3 = (i, j, k, salt) => seededFirst((Math.imul(i, 0x27d4eb2d) ^ Math.imul(j, 0x165667b1) ^ Math.imul(k, 0x9e3779b1) ^ salt) >>> 0);
/** Value noise in [0, 1] over (x, z, t) - trilinear between lattice values, smoothstepped. No closure and no array: the
 *  snowpack (snowpack.js) reads it for every place of its lattice at every step of a year. */
function noise3(x, z, t, cell, minutes, salt) {
  const qx = x / cell, qz = z / cell, qt = t / minutes;
  const i = Math.floor(qx), j = Math.floor(qz), k = Math.floor(qt);
  const u = smooth(qx - i), v = smooth(qz - j), w = smooth(qt - k);
  const a0 = hash3(i, j, k, salt), b0 = hash3(i + 1, j, k, salt), c0 = hash3(i, j + 1, k, salt), d0 = hash3(i + 1, j + 1, k, salt);
  const a1 = hash3(i, j, k + 1, salt), b1 = hash3(i + 1, j, k + 1, salt), c1 = hash3(i, j + 1, k + 1, salt), d1 = hash3(i + 1, j + 1, k + 1, salt);
  const e0 = a0 + (b0 - a0) * u, f0 = c0 + (d0 - c0) * u, e1 = a1 + (b1 - a1) * u, f1 = c1 + (d1 - c1) * u;
  const z0 = e0 + (f0 - e0) * v, z1 = e1 + (f1 - e1) * v;
  return z0 + (z1 - z0) * w;
}
/** THE SPELL in the air mass's own frame (the drift taken out): at its point (x, z) and event minute `t`, in [-1, 1]. Pure. */
export function spellOf(x, z, t) {
  const oct = SPELL.octaves;
  let n = 0;
  for (let k = 0; k < oct.length; k++) n += oct[k].weight * noise3(x, z, t, oct[k].cell, oct[k].minutes, SPELL.salt + k);
  return Math.max(-1, Math.min(1, (n - 0.5) * 4));   // the sum's spread widened to the climate's swing (value noise sits near its middle: sd 0.55)
}
/** THE SPELL at field (x, z) and event minute `t`, in [-1, 1] (times a climate's `spell` it is degrees): the air mass's
 *  own field, carried on its drift. Pure. */
export const spellAt = (x, z, t) => spellOf(x - SPELL.drift[0] * t, z - SPELL.drift[1] * t, t);

// ---- where the air is read: the climates, the ground's height, the biomes -----------------

let _ground = null;   // { climateAt(px, py), heightAt(px, py) - the macro height byte (WOODS.WLD) }
/** THE HOST'S MAP: `climateAt(px, py)` the pixel's CLIMATE.PAK index and `heightAt(px, py)` its macro height byte (the
 *  WOODS height map - DFU's terrain kernel's base; world metres are byte x BASE_HEIGHT_SCALE x the streamed scale). Set
 *  once by a host as the world loads; null forgets it (a place then reads the woodlands' air at the sea). */
export function setAirGround(g) { _ground = g && typeof g.climateAt === 'function' ? g : null; }
export const airGround = () => _ground;

const _biomes = new Map();
/** A BIOME OVERLAY: `fn(x, z)` answers how much of field (x, z) is the biome's (0..1) - the air there leans to `air` (a
 *  CLIMATE_AIR row) by that share. One per name; null clears it. The jungle registers its field (scenes/jungleHost.js). */
export function setAirBiome(name, fn, air) {
  if (typeof fn === 'function' && air) _biomes.set(name, { fn, air });
  else _biomes.delete(name);
}

const MAX_PX = MAX_MAP_PIXEL_X - 1, MAX_PY = MAX_MAP_PIXEL_Y - 1;
const clampPx = (v, hi) => Math.max(0, Math.min(hi, v));
const airOf = (c) => CLIMATE_AIR[c] ?? DEFAULT_AIR;
/** Field metres -> continuous pixel coordinates whose integers are pixel CENTRES (x east, y the map's rows, south). */
const pixelCoords = (x, z) => [x / TERRAIN_SIZE - 0.5, (MAX_MAP_PIXEL_Y - 1) - z / TERRAIN_SIZE + 0.5];

/**
 * THE AIR'S NUMBERS AND THE GROUND'S HEIGHT AT FIELD (x, z): each climate's row and each pixel's macro height read at
 * their pixel's centre and blended bilinearly between the four centres about the point, the latitude added from each
 * climate's middle row, then leaned toward every biome overlay by its share. Answers `{ mean, amp, day, spell, ground,
 * row }` - `ground` the macro ground's height above the sea (m), `row` the climates' blended middle row. `out` reused when
 * handed.
 */
export function airParamsAt(x, z, out = { mean: 0, amp: 0, day: 0, spell: 0, ground: 0, row: 0 }) {
  const [fx, fy] = pixelCoords(x, z);
  const x0 = Math.floor(fx), y0 = Math.floor(fy), u = fx - x0, v = fy - y0;
  out.mean = 0; out.amp = 0; out.day = 0; out.spell = 0; out.ground = 0; out.row = 0;
  for (let k = 0; k < 4; k++) {
    const px = clampPx(x0 + (k & 1), MAX_PX), py = clampPx(y0 + (k >> 1), MAX_PY);
    const w = ((k & 1) ? u : 1 - u) * ((k >> 1) ? v : 1 - v);
    if (w === 0) continue;
    const p = airOf(_ground ? _ground.climateAt(px, py) : null);
    out.mean += w * p.mean; out.amp += w * p.amp; out.day += w * p.day; out.spell += w * p.spell; out.row += w * (p.row ?? fy);
    out.ground += w * (_ground?.heightAt ? macroHeightM(_ground.heightAt(px, py)) : 0);
  }
  out.mean += LATITUDE_C_PER_ROW * (fy - out.row);   // the latitude, from each climate's own middle (the biomes' air is their own)
  for (const { fn, air } of _biomes.values()) {
    const s = Math.max(0, Math.min(1, fn(x, z) || 0));
    if (s <= 0) continue;
    out.mean += (air.mean - out.mean) * s; out.amp += (air.amp - out.amp) * s;
    out.day += (air.day - out.day) * s; out.spell += (air.spell - out.spell) * s;
  }
  return out;
}
/** A macro height byte (WOODS.WLD) as metres above the sea: the kernel's base term at the streamed scale. */
export const macroHeightM = (byte) => Math.max(0, (Number(byte) || 0) * BASE_HEIGHT_SCALE * STREAMING_TERRAIN_SCALE - SEA_LEVEL_M);
/** A world height (scene y less the stream's vertical compensation - the terrain's own metres) as metres above the sea. */
export const altitudeOfWorldY = (y) => y - SEA_LEVEL_M;

/** The year's day (0..360, a real) and the hour (0..24, a real) of the SKY's minute `skyMinutes` (skyCalendar.js -
 *  the season and the hour the sky shows; offline the classic clock itself). Pure. */
export function dayAndHourOf(skyMinutes) {
  const m = ((skyMinutes % 518400) + 518400) % 518400;   // 360 days a year
  return [m / 1440, (m % 1440) / 60];
}

const _p = { mean: 0, amp: 0, day: 0, spell: 0, ground: 0, row: 0 };
/**
 * THE AIR AT FIELD (x, z), `altitude` metres above the sea (null: the macro ground there), at event minute `t` whose sky
 * minute is `skyMinutes` (the season and the hour - TIME1's sky clock; offline the same minute). `fall` (optional) the
 * system falling there: `{ intensity, snow }` - 0..1, and whether it is a snow system - chills and clouds the air.
 * Degrees C. Pure in its arguments and the map (setAirGround, the biomes).
 */
export function airTemperature(x, z, altitude, t, skyMinutes = t, fall = null) {
  const p = airParamsAt(x, z, _p);
  const [day, hour] = dayAndHourOf(skyMinutes);
  const h = altitude == null || !Number.isFinite(altitude) ? p.ground : altitude;
  const wet = fall ? Math.max(0, Math.min(1, fall.intensity || 0)) : 0;
  return seasonAir(p, day) + dayAir(p, hour, wet > 0 ? 1 : 0) + p.spell * spellAt(x, z, t)
    - LAPSE_C_PER_M * Math.max(0, h) - wet * (FALL.chill + (fall?.snow ? FALL.snowCold : 0));
}
