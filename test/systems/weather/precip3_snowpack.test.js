// PRECIP3 (2026-10-19): THE SNOW THE GROUND KEEPS - systems/weather/snowpack.js. The pack's step (what falls lying, the
// degree-hours and the rain melting it), its cover and its snowline (the heights its cover crosses 10, 50 and 90 % - one
// reading for the shader and the host), the snow year from midsummer on the event clock's step grid, and the lattice
// that integrates a place's history over the weather map: pure in the place and the minute, whoever asks and in whatever
// company, its skipped steps exact. bible/07-Rendering/Biome-Precipitation.md is the record.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SNOWPACK, coverOf, sweOfCover, snowlineOf, coverAtHeight, stepPack, fallRateOf, seaAirAt, yearOriginOf, levelAltitude, levelAbove,
  SnowpackLattice, MIDSUMMER_MINUTE, WET_TYPES, pixelCentreField,
} from '../../../src/systems/weather/snowpack.js';
import { setAirGround, airParamsAt, airTemperature, LAPSE_C_PER_M, COLDEST_DAY } from '../../../src/systems/weather/airTemperature.js';
import { systemsNear, PRIORITY } from '../../../src/systems/weather/weatherMap.js';
import { skyMinuteOfEvent } from '../../../src/systems/skyCalendar.js';
import { CLIMATES } from '../../../src/formats/mapsFile.js';

const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} vs ${b}`);
const N = SNOWPACK.levels.count;
const woods = () => CLIMATES.Woodlands;

test('PRECIP3 THE COVER: nought bare, whole at SNOWPACK.fullMm, smooth between; sweOfCover its inverse (mutants: the cover a ramp; the inverse off)', () => {
  assert.equal(coverOf(0), 0); assert.equal(coverOf(-3), 0); assert.equal(coverOf(SNOWPACK.fullMm), 1); assert.equal(coverOf(99), 1);
  near(coverOf(SNOWPACK.fullMm / 2), 0.5, 1e-12, 'half');
  for (const c of [0.05, 0.1, 0.33, 0.5, 0.77, 0.9, 0.97]) near(coverOf(sweOfCover(c)), c, 1e-9, `inverse at ${c}`);
});

test('PRECIP3 THE SNOWLINE: a pack monotone in height crosses 10, 50 and 90 % where coverAtHeight reads them back, between the levels about each; white below the lowest a level under it, never this white above the highest a level over it, and never over its ground\'s ceil (mutants: the crossing off its levels; the ceil unread; the read-back\'s pieces)', () => {
  const swe = new Float32Array(N);
  for (let k = 0; k < N; k++) swe[k] = Math.max(0, (k - 6) * 3.1);   // bare to level 6, then deeper by 3.1 mm a level
  const line = snowlineOf(swe);
  for (const [q, c] of [[0, 0.1], [1, 0.5], [2, 0.9]]) {
    const h = line[q], k = (h - SNOWPACK.levels.from) / SNOWPACK.levels.step;
    const swAt = swe[Math.floor(k)] + (swe[Math.floor(k) + 1] - swe[Math.floor(k)]) * (k - Math.floor(k));
    near(coverOf(swAt), c, 1e-6, `the pack there is the cover ${c}`);
    near(coverAtHeight(line, h), c, 1e-9, `read back at ${c}`);
  }
  assert.ok(line[0] < line[1] && line[1] < line[2], 'in order up the slope');
  assert.equal(coverAtHeight(line, line[0] - 0.25 * (line[1] - line[0]) - 1), 0, 'bare a quarter span under');
  assert.equal(coverAtHeight(line, line[2] + 0.25 * (line[2] - line[1]) + 1), 1, 'whole a quarter span over');
  const white = new Float32Array(N).fill(50), bare = new Float32Array(N);
  assert.deepEqual(snowlineOf(white), [levelAltitude(-1), levelAltitude(-1), levelAltitude(-1)], 'white to the lowest level');
  assert.deepEqual(snowlineOf(bare), [levelAltitude(N), levelAltitude(N), levelAltitude(N)], 'never');
  assert.deepEqual(snowlineOf(bare, [0, 0, 0], 900), [900, 900, 900], 'never on this ground: its ceil');
  assert.equal(levelAbove(levelAltitude(4) - 1), levelAltitude(5), 'the level over the first at or above');
  assert.equal(levelAbove(levelAltitude(4)), levelAltitude(5));
});

test('PRECIP3 THE STEP: snow lies at the levels its air is cold enough at, the degree-hours melt it, rain on it melts more; never under nought, and monotone in height whatever the air (mutants: the melt\'s sign; the rain\'s heat dropped; the share unread)', () => {
  const swe = new Float32Array(N);
  stepPack(swe, -10, 2, 3);   // a cold snow: everything below about 2,000 m warmer than -10 - all of it cold enough
  for (let k = 0; k < N; k++) near(swe[k], 6, 1e-6, `lies at level ${k}`);
  const warm = Float32Array.from(swe);
  stepPack(warm, 5, 0, 3);   // a dry thaw at 5 C at the sea
  for (let k = 0; k < N; k++) {
    const t = 5 - LAPSE_C_PER_M * levelAltitude(k);
    near(warm[k], Math.max(0, 6 - SNOWPACK.melt * Math.max(0, t) * 3), 1e-5, `melts at level ${k}`);
  }
  const wet = Float32Array.from(swe);
  stepPack(wet, 5, 4, 3);   // the same thaw under rain
  const k0 = 0, t0 = 5 - LAPSE_C_PER_M * levelAltitude(k0);
  assert.ok(wet[k0] < warm[k0], 'rain melts more where it is rain');
  near(wet[k0], Math.max(0, 6 - SNOWPACK.melt * t0 * 3 - SNOWPACK.rainMelt * 4 * 3 * t0), 1e-5, 'its heat over the ice\'s latent');
  // monotone in height under any history
  let seed = 7; const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const p = new Float32Array(N);
  for (let i = 0; i < 2000; i++) {
    stepPack(p, rnd() * 24 - 12, rnd() < 0.4 ? rnd() * 8 : 0, 3);
    for (let k = 0; k < N; k++) assert.ok(p[k] >= 0, 'never under nought');
    for (let k = 1; k < N; k++) assert.ok(p[k] >= p[k - 1] - 1e-4, `monotone at step ${i} level ${k}`);
  }
  assert.equal(fallRateOf('rain', 0.5), SNOWPACK.rate.rain * 0.5);
  assert.equal(fallRateOf('thunder', 2), SNOWPACK.rate.thunder);
  assert.equal(fallRateOf('cloudy', 1), 0);
});

test('PRECIP3 THE AIR A STEP is the air\'s own at the sea: airTemperature\'s terms term for term (mutants: a term dropped)', () => {
  setAirGround({ climateAt: woods, heightAt: () => 30 });
  try {
    const [x, z] = pixelCentreField(150, 40), p = airParamsAt(x, z);
    for (const t of [(405 * 360 + 3) * 1440 + 333, (405 * 360 + 200) * 1440 + 900]) {
      const sky = skyMinuteOfEvent(t), day = (sky % 518400) / 1440, hour = (sky % 1440) / 60;
      near(seaAirAt(p, x, z, t, day, hour, 0, false), airTemperature(x, z, 0, t, sky), 1e-9, 'dry');
      near(seaAirAt(p, x, z, t, day, hour, 0.7, true), airTemperature(x, z, 0, t, sky, { intensity: 0.7, snow: true }), 1e-9, 'under a snow front');
    }
  } finally { setAirGround(null); }
});

test('PRECIP3 THE SNOW YEAR: its origin a step on the event clock\'s grid, at or just after the sky\'s last midsummer - the same for every minute of the year (mutants: the origin off the grid; the year\'s turn a day early)', () => {
  const S = SNOWPACK.stepMinutes, Y = 360 * 1440;
  for (const t of [MIDSUMMER_MINUTE + 1, 405 * Y + 10, 405 * Y + MIDSUMMER_MINUTE - 1, 405 * Y + MIDSUMMER_MINUTE + 7, 406 * Y + 359 * 1440]) {
    const o = yearOriginOf(t);
    assert.equal(o % S, 0, 'on the grid');
    assert.ok(o <= t + S && t - o < Y, 'its year');
    assert.equal(((o - MIDSUMMER_MINUTE) % Y + Y) % Y < S, true, 'at midsummer');
  }
  assert.equal(yearOriginOf(405 * Y + 10), yearOriginOf(405 * Y + MIDSUMMER_MINUTE - 1), 'one year, one origin');
  assert.notEqual(yearOriginOf(405 * Y + MIDSUMMER_MINUTE - 1), yearOriginOf(405 * Y + MIDSUMMER_MINUTE + S), 'midsummer turns it');
  assert.equal(MIDSUMMER_MINUTE, (COLDEST_DAY + 180) * 1440);
});

test('PRECIP3 THE LATTICE: a place\'s pack is the same whoever integrates it and in whatever company (two windows sharing a point), in one go or in slices, its quiet steps skipped exactly; the pack now is the next step\'s at that step; the wet types alone asked of the map (mutants: the skip loosened; a point\'s history leaning on its neighbours; the partial step at the step\'s start)', () => {
  setAirGround({ climateAt: woods, heightAt: (px) => (px % 7) * 9 });
  try {
    const t = (406 * 360 + 360 - 20) * 1440 + 600;   // late Evening Star: a High Rock winter well begun
    const a = new SnowpackLattice({ climateAt: woods }), b = new SnowpackLattice({ climateAt: woods }), c = new SnowpackLattice({ climateAt: woods });
    const pa = [], pb = [];
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) pa.push(a.point(100 + i, 120 + j, t));
    for (let j = 2; j < 5; j++) for (let i = 2; i < 5; i++) pb.push(b.point(100 + i, 120 + j, t));
    a.advance(pa, t); b.advance(pb, t);
    const shared = a.point(102, 122, t), shared2 = b.point(102, 122, t);
    assert.deepEqual([...shared.swe], [...shared2.swe], 'one place, one pack');
    assert.ok(shared.swe.some((v) => v > 0), 'a winter has laid snow');
    // in slices: a budget of nothing steps once a call
    const pc = [c.point(102, 122, t)];
    let calls = 0;
    while (!c.advance(pc, t, 0)) calls++;
    assert.ok(calls > 100, 'sliced');
    assert.deepEqual([...pc[0].swe], [...shared.swe], 'sliced, the same pack');
    assert.ok(a.stepsSkipped > 0, 'the warm early autumn skipped');
    // the quiet steps are exact: no skip at all, the same packs
    const d = new SnowpackLattice({ climateAt: woods });
    const pd = pa.map((p) => { const q = d.point(p.i, p.j, t); q.top = 1e9; return q; });
    d.advance(pd, t);
    assert.equal(d.stepsSkipped, 0);
    for (let k = 0; k < pd.length; k++) {
      const ceil = pa[k].ceil;
      assert.deepEqual(snowlineOf(pd[k].swe, [0, 0, 0], ceil), snowlineOf(pa[k].swe, [0, 0, 0], ceil), 'the skipped steps changed no line');
    }
    // the pack now at the next step's minute is that step's pack
    const pt = a.point(101, 121, t), next = pt.step + SNOWPACK.stepMinutes;
    const now = a.packNow(pt, next);
    a.advance([pt], next);
    for (let k = 0; k < N; k++) near(now[k], pt.swe[k], 1e-4, `the partial step meets the step at level ${k}`);
    assert.deepEqual(WET_TYPES, ['rain', 'snow']);
    for (const s of systemsNear(pt.x, pt.z, t, woods, 20000, WET_TYPES)) assert.ok(['rain', 'snow', 'thunder'].includes(s.type), 'wet alone');
    assert.ok(PRIORITY.length > WET_TYPES.length);
  } finally { setAirGround(null); }
});
