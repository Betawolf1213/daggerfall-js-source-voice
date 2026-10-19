// PRECIP1 / PRECIP2 (2026-10-19, the owner: "I also want to begin giving each biome their own precipitation. It shouldnt
// snow everywhere or rain everywhere when the season is winter ... If its snowing in one area and raining in the next,
// the transition should be seamless"): THE AIR (systems/weather/airTemperature.js) and WHAT FALLS IN IT - the phase law in
// the sim (weatherSim.js precipLawOn, snowShareAt, phaseWord, phaseRound), the front's snow share (weatherFront.js), the
// mixed fall (render/precipitation.js drawFall) and the sky's curtains at their own place's share (volumetricClouds.js
// cellOfField, rainCurtains.js). bible/07-Rendering/Biome-Precipitation.md is the record.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  airTemperature, airParamsAt, snowShareOf, seasonAir, dayAir, spellAt, setAirGround, setAirBiome, airGround, macroHeightM,
  altitudeOfWorldY, dayAndHourOf, CLIMATE_AIR, LAPSE_C_PER_M, COLDEST_DAY, WARMEST_HOUR, FALL, SNOW_ALL_C, RAIN_ALL_C,
  SEA_LEVEL_M, LATITUDE_C_PER_ROW,
} from '../../../src/systems/weather/airTemperature.js';
import {
  setPrecipLaw, precipLawOn, snowShareAt, phaseWord, phaseRound, mapGround, currentSnowShare, setWeather, resetWeatherSim,
  setSnowGroundLaw, PHASE_HYSTERESIS, PHASE_INTENSITY,
} from '../../../src/systems/weather/weatherSim.js';
import { createWeatherFront } from '../../../src/systems/weather/weatherFront.js';
import { PrecipitationRenderer, MIX_SHIFT } from '../../../src/render/precipitation.js';
import { mixColor, CURTAIN_RAIN_COLOR, CURTAIN_SNOW_COLOR, curtainsOf } from '../../../src/render/rainCurtains.js';
import { cellOfField, CURTAIN_FALL } from '../../../src/render/volumetricClouds.js';
import { CLIMATES } from '../../../src/formats/mapsFile.js';
import { TERRAIN_SIZE } from '../../../src/world/terrain/terrainSampler.js';

const S = TERRAIN_SIZE;
const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} vs ${b}`);
/** A map: Desert west of pixel column 100, Woodlands east of it; the ground's byte `byte` everywhere. */
const splitGround = (byte = 0) => ({ climateAt: (px) => (px < 100 ? CLIMATES.Desert : CLIMATES.Woodlands), heightAt: () => byte });
/** Field metres of pixel (px, py)'s centre. */
const centre = (px, py) => [(px + 0.5) * S, (499 - py + 0.5) * S];

test('PRECIP1 THE PHASE: all snow at and under SNOW_ALL_C, all rain at and over RAIN_ALL_C, a smooth sleet between - monotone, half at the middle (mutants: the band\'s ends swapped; a step for the smoothstep)', () => {
  assert.equal(snowShareOf(SNOW_ALL_C), 1); assert.equal(snowShareOf(-12), 1); assert.equal(snowShareOf(NaN), 1);
  assert.equal(snowShareOf(RAIN_ALL_C), 0); assert.equal(snowShareOf(30), 0);
  near(snowShareOf((SNOW_ALL_C + RAIN_ALL_C) / 2), 0.5, 1e-12, 'half at the middle');
  let last = 1;
  for (let t = SNOW_ALL_C; t <= RAIN_ALL_C; t += 0.05) { const s = snowShareOf(t); assert.ok(s <= last + 1e-12, `monotone at ${t}`); last = s; }
  near(snowShareOf(SNOW_ALL_C + 0.25), 1 - 3 * 0.01 + 2 * 0.001, 1e-12, 'a smoothstep, not a ramp');
});

test('PRECIP1 THE YEAR AND THE DAY: a climate is coldest on COLDEST_DAY and warmest half a year on, its day warmest at WARMEST_HOUR and coldest twelve hours round, the swing damped under cloud; the sky\'s minute read as its year\'s day and its hour (mutants: the season\'s sign; the cloud undamped)', () => {
  const p = CLIMATE_AIR[CLIMATES.Woodlands];
  near(seasonAir(p, COLDEST_DAY), p.mean - p.amp, 1e-12, 'coldest');
  near(seasonAir(p, COLDEST_DAY + 180), p.mean + p.amp, 1e-12, 'warmest');
  near(dayAir(p, WARMEST_HOUR), p.day, 1e-12, 'the afternoon'); near(dayAir(p, WARMEST_HOUR + 12), -p.day, 1e-12, 'before dawn');
  near(dayAir(p, WARMEST_HOUR, 1), p.day * FALL.dayUnderCloud, 1e-12, 'under cloud');
  assert.deepEqual(dayAndHourOf((3 * 360 + 45) * 1440 + 6 * 60 + 30), [45 + 390 / 1440, 6.5]);
  assert.equal(altitudeOfWorldY(SEA_LEVEL_M + 120), 120);
  assert.equal(macroHeightM(0), 0, 'the sea floor reads the sea');
  near(macroHeightM(100), 100 * 8 * 1.25 - SEA_LEVEL_M, 1e-9, 'a byte the kernel\'s base');
});

test('PRECIP1 THE SPELL: pure in place and minute, within [-1, 1], continuous (a cold snap has no edge), drifting with the air - and spread over its range, not stuck at its middle (mutants: the spread unwidened; the drift dropped)', () => {
  const vals = [];
  for (let k = 0; k < 4000; k++) {
    const x = (k * 7919) % 900000, z = (k * 104729) % 400000, t = k * 997;
    const v = spellAt(x, z, t);
    assert.ok(v >= -1 && v <= 1);
    assert.equal(v, spellAt(x, z, t), 'pure');
    assert.ok(Math.abs(spellAt(x + 50, z + 50, t + 1) - v) < 0.02, 'continuous');
    vals.push(v);
  }
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length, sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
  assert.ok(Math.abs(mean) < 0.12 && sd > 0.4 && sd < 0.75, `centred and spread: mean ${mean.toFixed(3)} sd ${sd.toFixed(3)}`);
  // the air mass rides the drift: the spell a day on, a day's drift downwind, is the same mass (its time octave aside)
  const a = spellAt(300000, 200000, 10 * 1440), b = spellAt(300000 + 18 * 1, 200000 + 6 * 1, 10 * 1440 + 1);
  assert.ok(Math.abs(a - b) < 0.005, 'a minute on, a minute\'s drift downwind');
});

test('PRECIP1 THE CLIMATES BLEND between pixel centres - a climate\'s own numbers at its centre, the border warmed over the pixel either side and never at its edge; the latitude from each climate\'s own middle row; the ground\'s height blended as the air; a biome leans the air by its share (mutants: the blend nearest-pixel; the latitude dropped; the biome unleaned)', () => {
  setAirGround(splitGround(40));
  try {
    const woods = CLIMATE_AIR[CLIMATES.Woodlands], desert = CLIMATE_AIR[CLIMATES.Desert];
    const pw = airParamsAt(...centre(150, woods.row)), pd = airParamsAt(...centre(50, desert.row));
    near(pw.mean, woods.mean, 1e-9, 'woods at its centre, its own row'); near(pd.mean, desert.mean, 1e-9, 'desert');
    near(pw.ground, macroHeightM(40), 1e-9, 'the ground');
    // across the border (pixel 99 desert, 100 woods), at a row that is neither's middle
    const row = 300, z = centre(0, row)[1];
    const at = (x) => airParamsAt(x, z).mean;
    const edge = 100 * S;
    near(at(edge - 1e-6), at(edge + 1e-6), 1e-6, 'no step at the pixel edge');
    near(at(edge), (at(99.5 * S) + at(100.5 * S)) / 2, 1e-9, 'half way between the centres');
    assert.ok(at(99.5 * S) > at(100.5 * S) + 5, 'the desert warmer');
    // the latitude: the woods' far south warmer than its middle by LATITUDE_C_PER_ROW a row
    near(airParamsAt(...centre(150, woods.row + 100)).mean - woods.mean, LATITUDE_C_PER_ROW * 100, 1e-9, 'a hundred rows south');
    // a biome over the woods: its share leans the air to its own numbers
    const rain = CLIMATE_AIR[CLIMATES.Rainforest];
    setAirBiome('test', (x) => (x > 150 * S ? 1 : x > 140 * S ? 0.5 : 0), rain);
    near(airParamsAt(...centre(160, woods.row)).mean, rain.mean, 1e-9, 'whole');
    near(airParamsAt(...centre(145, woods.row)).mean, (woods.mean + rain.mean) / 2, 1e-9, 'half');
    near(airParamsAt(...centre(130, woods.row)).mean, woods.mean, 1e-9, 'outside it');
  } finally { setAirBiome('test', null); setAirGround(null); }
});

test('PRECIP1 THE AIR: the lapse with height (null reads the ground), a fall\'s chill and a snow front\'s own cold, the day damped under it - pure (mutants: the lapse\'s sign; the snow front\'s cold dropped; the ground unread)', () => {
  setAirGround(splitGround(60));
  try {
    const [x, z] = centre(150, 29), t = (405 * 360 + 20) * 1440 + 15 * 60;
    const a0 = airTemperature(x, z, 0, t), a1 = airTemperature(x, z, 1000, t);
    near(a0 - a1, LAPSE_C_PER_M * 1000, 1e-9, 'a kilometre up');
    near(airTemperature(x, z, null, t), airTemperature(x, z, macroHeightM(60), t), 1e-9, 'null: the ground');
    const p = airParamsAt(x, z), [, hour] = dayAndHourOf(t);
    const dry = airTemperature(x, z, 0, t), wet = airTemperature(x, z, 0, t, t, { intensity: 1, snow: false }), snow = airTemperature(x, z, 0, t, t, { intensity: 1, snow: true });
    near(dry - wet, FALL.chill + dayAir(p, hour) - dayAir(p, hour, 1), 1e-9, 'the fall\'s chill and its cloud');
    near(wet - snow, FALL.snowCold, 1e-9, 'a snow front\'s own cold');
    assert.equal(airTemperature(x, z, 0, t), dry, 'pure');
  } finally { setAirGround(null); }
});

test('PRECIP1 THE LAW\'S LANE: on with the ground law\'s lane and a host\'s map for the air, off without either or with ?biomeprecip=off; a test may force it (mutants: the map unasked; the lane unasked)', () => {
  setPrecipLaw(null);
  try {
    setSnowGroundLaw(true); setAirGround(null);
    assert.equal(precipLawOn(), false, 'no map: off');
    setAirGround(splitGround());
    assert.equal(precipLawOn(), true, 'the lane and a map: on');
    setSnowGroundLaw(false);
    assert.equal(precipLawOn(), false, 'the classic lane: off');
    setPrecipLaw(true); assert.equal(precipLawOn(), true, 'forced');
  } finally { setPrecipLaw(null); setSnowGroundLaw(null); setAirGround(null); }
  assert.match(readFileSync('src/systems/weather/weatherSim.js', 'utf8'), /get\('biomeprecip'\) !== 'off'/, 'the door back');
});

test('PRECIP1 WHAT FALLS: a wet system\'s word at a place is the air\'s - rain in cold air falls as snow, snow in warm air as rain, a storm in cold air is a snow; a dry word itself; the map\'s ground law routes through it on the lane; the player\'s word rounds the share with PHASE_HYSTERESIS (mutants: the rounding\'s band dropped; a snow system kept snow in warm air)', () => {
  setPrecipLaw(true); setAirGround(splitGround());
  try {
    const cold = (406 * 360 + COLDEST_DAY) * 1440 + 5 * 60, warm = (406 * 360 + COLDEST_DAY + 180) * 1440 + 15 * 60;
    const [x, z] = centre(150, 29);
    assert.equal(phaseWord('rain', x, z, cold, 2000), 'snow', 'rain on a winter night two kilometres up');
    assert.equal(phaseWord('thunder', x, z, cold, 2000), 'snow', 'a storm');
    assert.equal(phaseWord('snow', x, z, warm, 0), 'rain', 'snow on a summer afternoon at the sea');
    assert.equal(phaseWord('rain', x, z, warm, 0), 'rain');
    assert.equal(phaseWord('fog', x, z, cold, 2000), 'fog');
    assert.equal(snowShareAt(x, z, cold, 2000, PHASE_INTENSITY, 'rain'), 1);
    const g = mapGround(splitGround().climateAt);
    assert.equal(g('rain', x, z, cold, 2000, 0.6), phaseWord('rain', x, z, cold, 2000, 0.6), 'the map\'s ground law is the phase');
    // the rounding's band
    assert.equal(phaseRound('rain', 0.5 + PHASE_HYSTERESIS - 1e-9, false), 'rain', 'not yet snow');
    assert.equal(phaseRound('rain', 0.5 + PHASE_HYSTERESIS, false), 'snow');
    assert.equal(phaseRound('rain', 0.5 - PHASE_HYSTERESIS, true), 'snow', 'snow held');
    assert.equal(phaseRound('rain', 0.5 - PHASE_HYSTERESIS - 1e-9, true), 'rain');
    assert.equal(phaseRound('snow', 0.2, true), 'rain', 'a snow system in warm air rains');
    assert.equal(phaseRound('thunder', 0.2, false), 'thunder', 'a storm keeps its violence');
  } finally { setPrecipLaw(null); setAirGround(null); }
});

test('PRECIP2 THE FRONT\'S SNOW SHARE: under the law the player\'s share (the sim\'s), off it the mode\'s own; rain, a storm and snow one fall under the law, so a phase change keeps the fall up (mutants: the share off the law\'s; the fall split by look)', () => {
  resetWeatherSim();
  try {
    setPrecipLaw(false); setWeather('snow');
    let fr = createWeatherFront({ seed: 3 });
    let fx = fr.tick({ weather: 'snow', nowMinutes: 1000, jump: true, tsec: 0, peak: 1 });
    assert.equal(fx.snow, 1, 'snow off the law: all snow');
    setWeather('rain'); fr = createWeatherFront({ seed: 3 });
    fx = fr.tick({ weather: 'rain', nowMinutes: 1000, jump: true, tsec: 0, peak: 1 });
    assert.equal(fx.snow, 0, 'rain off the law: none');
    setPrecipLaw(true); setWeather('snow');
    assert.equal(currentSnowShare(), 1, 'a word taken whole is its own phase');
    fr = createWeatherFront({ seed: 3 });
    fx = fr.tick({ weather: 'snow', nowMinutes: 1000, jump: true, tsec: 0, peak: 1 });
    assert.equal(fx.snow, currentSnowShare());
  } finally { setPrecipLaw(null); resetWeatherSim(); }
  const src = readFileSync('src/systems/weather/weatherFront.js', 'utf8');
  assert.match(src, /const fallOf = \(mode\) => \(mode && mode !== 'sand' && precipLawOn\(\) \? 'wet' : precipKind\(mode\)\);/);
  assert.match(src, /if \(inMode && outMode && fallOf\(inMode\) === fallOf\(outMode\)\) \{/);
  assert.match(src, /if \(shown && mode && fallOf\(shown\) !== fallOf\(mode\)\) intensity = 0;/);
});

test('PRECIP2 THE MIXED FALL: on the enhanced lane a wet mode at a snow share draws its drops at the rest of the intensity and the flakes at the share, the flakes\' volume carried aside on the wind\'s offset, all put back after; with no share, off the lane, or dry, the draw as it is (mutants: the shares swapped; the shift dropped; the intensity not restored)', () => {
  const p = Object.create(PrecipitationRenderer.prototype);
  const calls = [];
  p.draw = function (mode) { calls.push({ mode, intensity: this.intensity, wind: [...this.windOff] }); };
  p.enhanced = true; p.intensity = 0.8; p.windOff = Float32Array.of(3, 4);
  const wind = p.windOff;
  p.snowShare = 0.25;
  p.drawFall('storm', null, null, null, null, 0);
  assert.deepEqual(calls.map((c) => c.mode), ['storm', 'snow']);
  near(calls[0].intensity, 0.6, 1e-9, 'the drops'); near(calls[1].intensity, 0.2, 1e-9, 'the flakes');
  assert.deepEqual(calls[0].wind, [3, 4], 'the drops on the wind');
  near(calls[1].wind[0], 3 + MIX_SHIFT[0], 1e-6, 'the flakes aside'); near(calls[1].wind[1], 4 + MIX_SHIFT[1], 1e-6, 'aside');
  assert.equal(p.intensity, 0.8); assert.equal(p.windOff, wind, 'put back');
  calls.length = 0; p.snowShare = 1; p.drawFall('rain', null, null, null, null, 0);
  assert.deepEqual(calls.map((c) => [c.mode, c.intensity]), [['snow', 0.8]], 'all snow: the flakes alone, where they stand');
  assert.deepEqual(calls[0].wind, [3, 4]);
  calls.length = 0; p.snowShare = 0; p.drawFall('snow', null, null, null, null, 0);
  assert.deepEqual(calls.map((c) => [c.mode, c.intensity]), [['rain', 0.8]], 'a snow mode in warm air: rain');
  for (const [share, enhanced, mode] of [[null, true, 'rain'], [0.5, false, 'rain'], [0.5, true, 'sand']]) {
    calls.length = 0; p.snowShare = share; p.enhanced = enhanced; p.drawFall(mode, null, null, null, null, 0);
    assert.deepEqual(calls.map((c) => [c.mode, c.intensity]), [[mode, 0.8]], `as it is: ${share} ${enhanced} ${mode}`);
  }
  const src = readFileSync('src/render/precipitation.js', 'utf8');
  assert.match(src, /if \(this\.enhanced\) return this\.drawLab\(mode, proj, view, camPos, camRight, timeSeconds\);/, 'the draw itself untouched');
  for (const host of ['src/scenes/world.js', 'src/scenes/exterior.js']) {
    const h = readFileSync(host, 'utf8');
    assert.match(h, /precip\.drawFall\(precipShown, proj, view, /, `${host}: draws the fall`);
    assert.match(h, /precip\.intensity = fx\.intensity; precip\.snowShare = fx\.snow \?\? null;/, `${host}: hands its share`);
  }
});

test('PRECIP2 THE SKY\'S CURTAINS at their own place\'s share: a map cell\'s `snow` walks its fall\'s weight and its tint from the rain\'s (a storm\'s) to the snow\'s; the curtain greys toward white across the snow line (mutants: the share unread; the tint a switch)', () => {
  const at = (x, z) => [x, z];
  const rain = cellOfField({ x: 10, z: 20, r: 40000, word: 'rain', raw: 'rain', snow: 0.5, imp: 1, rank: 1, id: 'a', d: 0, env: 1 }, at);
  assert.ok(rain, 'a cell');
  near(rain.fallKind, 0.5, 1e-12, 'its share');
  near(rain.fall, (CURTAIN_FALL.rain[0] + CURTAIN_FALL.snow[0]) / 2, 1e-12, 'its weight between');
  const storm = cellOfField({ x: 10, z: 20, r: 40000, word: 'thunder', raw: 'thunder', snow: 0, imp: 1, rank: 0, id: 'b', d: 0, env: 1 }, at);
  near(storm.fall, CURTAIN_FALL.thunder[0], 1e-12, 'a storm\'s own');
  const plain = cellOfField({ x: 10, z: 20, r: 40000, word: 'rain', raw: 'rain', imp: 1, rank: 1, id: 'c', d: 0, env: 1 }, at);
  near(plain.fall, CURTAIN_FALL.rain[0], 1e-12, 'no share: the word\'s own');
  assert.deepEqual([...mixColor(CURTAIN_RAIN_COLOR, CURTAIN_SNOW_COLOR, 0)], [...CURTAIN_RAIN_COLOR].map(Math.fround));
  assert.deepEqual([...mixColor(CURTAIN_RAIN_COLOR, CURTAIN_SNOW_COLOR, 1)], [...CURTAIN_SNOW_COLOR].map(Math.fround));
  const half = mixColor(CURTAIN_RAIN_COLOR, CURTAIN_SNOW_COLOR, 0.5);
  for (let i = 0; i < 3; i++) near(half[i], (CURTAIN_RAIN_COLOR[i] + CURTAIN_SNOW_COLOR[i]) / 2, 1e-6, 'between');
  const src = readFileSync('src/render/rainCurtains.js', 'utf8');
  assert.match(src, /kind: c\.fallKind \?\? 0,/);
  assert.match(src, /gl\.uniform3fv\(U\.uColor, mixColor\(CURTAIN_RAIN_COLOR, CURTAIN_SNOW_COLOR, c\.kind\)\);/);
  assert.equal(typeof curtainsOf, 'function');
});

test('PRECIP1 THE HOSTS: the world hands the air the map\'s climates and heights and the player\'s height above the sea; the fixed city hands it none (its ground wears DFU\'s season); the jungle leans its own air in by its haze\'s share (mutants: a host unwired; the height dropped)', () => {
  const w = readFileSync('src/scenes/world.js', 'utf8');
  assert.match(w, /const climateAt = \(px, py\) => maps\.getClimateIndex\(px, py\); setAirGround\(\{ climateAt, heightAt: \(px, py\) => woods\.getHeightMapValue\(px, py\) \}\);/);
  assert.match(w, /return \[\.\.\.fieldFromNative\(wc\.x, wc\.z\), altitudeOfWorldY\(p\[1\] - state\.compensation\[1\]\)\];/);
  assert.match(readFileSync('src/scenes/exterior.js', 'utf8'), /setAirGround\(null\);/);
  const j = readFileSync('src/scenes/jungleHost.js', 'utf8');
  assert.match(j, /setAirBiome\('jungle', \(fx, fz\) => \{[\s\S]{0,400}?hazeShare\(jungleDepthAt\([\s\S]{0,200}?\}, CLIMATE_AIR\[CLIMATES\.Rainforest\]\);/);
  assert.equal(airGround(), null, 'no test left a map behind');
});

// The calibration on the freeware's own map (CLAUDE.md: ARENA2 is fetched - `sh tools/fetch-data.sh`). Off it, skipped.
const A = process.env.ARENA2_PATH;
const HAVE = !!A && existsSync(join(A, 'CLIMATE.PAK'));
test('PRECIP1 THE CALIBRATION on the freeware\'s map: a winter at each climate\'s own heights falls as DFU\'s table says - the woodlands and the ranges mostly white, the desert, the rainforest and the subtropics never; a summer nowhere (mutants: a climate\'s mean moved)', { skip: HAVE ? false : 'no ARENA2 (sh tools/fetch-data.sh)' }, async () => {
  const { MapsFile } = await import('../../../src/formats/mapsFile.js');
  const { WoodsFile } = await import('../../../src/formats/woodsFile.js');
  const rd = (f) => new Uint8Array(readFileSync(join(A, f)));
  const maps = new MapsFile(); maps.load(rd('MAPS.BSA'), rd('CLIMATE.PAK'), rd('POLITIC.PAK'));
  const woods = new WoodsFile(); woods.load(rd('WOODS.WLD'));
  setAirGround({ climateAt: (x, y) => maps.getClimateIndex(x, y), heightAt: (x, y) => woods.getHeightMapValue(x, y) });
  try {
    let seed = 99; const rnd = () => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296);
    const pts = new Map();
    for (let k = 0; k < 300000; k++) {
      const px = Math.floor(rnd() * 1000), py = Math.floor(rnd() * 500), c = maps.getClimateIndex(px, py);
      if (!pts.has(c)) pts.set(c, []);
      if (pts.get(c).length < 300) pts.get(c).push([px, py]);
    }
    const share = (c, months) => {
      let snow = 0;
      const list = pts.get(c);
      for (let i = 0; i < 1200; i++) {
        const [px, py] = list[Math.floor(rnd() * list.length)];
        const x = px * S + rnd() * S, z = (499 - py) * S + rnd() * S;
        const t = ((405 + Math.floor(rnd() * 8)) * 360 + months[Math.floor(rnd() * months.length)] * 30 + Math.floor(rnd() * 30)) * 1440 + Math.floor(rnd() * 1440);
        if (snowShareOf(airTemperature(x, z, null, t, t, { intensity: 0.7, snow: false })) >= 0.5) snow++;
      }
      return snow / 1200;
    };
    const winter = [11, 0, 1], summer = [5, 6, 7];
    for (const c of [CLIMATES.Woodlands, CLIMATES.Mountain, CLIMATES.MountainWoods]) assert.ok(share(c, winter) > 0.55, `climate ${c} mostly white in winter`);
    for (const c of [CLIMATES.Desert, CLIMATES.Rainforest, CLIMATES.Subtropical]) assert.ok(share(c, winter) < 0.02, `climate ${c} never`);
    for (const c of [CLIMATES.Woodlands, CLIMATES.Mountain]) assert.ok(share(c, summer) < 0.01, `climate ${c} no summer snow`);
  } finally { setAirGround(null); }
});
