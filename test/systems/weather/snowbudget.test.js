// SNOW-BUDGET (2026-10-20, a player via the owner: "something about our weather system affecting fps"; bible/07-Rendering/
// Performance-Priority.md SNOW-BUDGET) - THE SNOW KEEPS ITS FRAME BUDGET. The snowpack's window (121 points) was
// integrated a whole step at a time whatever the budget (snowpack.js advance read its deadline between steps), every one
// of a frame's readers - the tick, the feet, the Snowfall mod's winter - ran a budget of its own, and the ground's slope
// was read for every grass blade whether snow lay there or not. Held here: a call keeps its deadline between a step's
// points and the packs are the ones one call makes; a frame's asks share one budget; the slope is read only under snow.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SnowpackLattice, SNOWPACK } from '../../../src/systems/weather/snowpack.js';
import { setAirGround } from '../../../src/systems/weather/airTemperature.js';
import { createSnowCoverHost, SNOW_COVER } from '../../../src/scenes/snowCoverHost.js';
import { CLIMATES } from '../../../src/formats/mapsFile.js';

const woods = () => CLIMATES.Woodlands;
/** late in the year (snow to lay), a point a step past its year's origin, and a 3 x 3 window of the lattice */
const T = (406 * 360 + 360 - 20) * 1440 + 600;
const windowOf = (lat) => { const pts = []; for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) pts.push(lat.point(50 + i, 60 + j, T)); return pts; };

test('SNOW-BUDGET the lattice keeps its deadline between a step\'s points: a call that runs out leaves the step part-way, the rest carry on in the next, and the packs are the ones one call makes - a step\'s rest that can lay no snow is skipped as any quiet step is (mutants: the deadline read only between steps)', () => {
  setAirGround({ climateAt: woods, groundAt: () => 0, topAt: (px) => 200 + (px % 7) * 90 });
  try {
    const whole = new SnowpackLattice({ climateAt: woods }), sliced = new SnowpackLattice({ climateAt: woods });
    const a = windowOf(whole), b = windowOf(sliced);
    assert.equal(whole.advance(a, T), true);
    let tick = 0, calls = 0, partway = 0;
    const clock = () => tick++;   // a clock a tick an ask: a budget of 2 is a point or two
    while (!sliced.advance(b, T, 2, clock)) { calls++; if (sliced._partial !== null) partway++; assert.ok(calls < 1e6, 'it goes on'); }
    assert.ok(calls > 9, `in ${calls} calls`);
    assert.ok(partway > 0, 'steps left part-way at the deadline');
    for (let k = 0; k < a.length; k++) {
      assert.deepEqual([...b[k].swe], [...a[k].swe], `point ${k}: its pack the one call's`);
      assert.deepEqual([...b[k].prev], [...a[k].prev], `point ${k}: its step before too`);
      assert.equal(b[k].step, a[k].step);
    }
    assert.ok(a.some((p) => p.swe.some((v) => v > 0)), 'a winter laid snow to compare');
  } finally { setAirGround(null); }
});

test('SNOW-BUDGET a spent budget costs a point, never a step: calls with no budget still go on to the end (a build\'s wait with no slice left), and one that lays a step moves two of its points at the most (mutants: a whole step a call whatever the budget)', () => {
  setAirGround({ climateAt: woods, groundAt: () => 0, topAt: () => 900 });
  try {
    const lat = new SnowpackLattice({ climateAt: woods });
    const pts = windowOf(lat);
    const marks = () => pts.map((p) => `${p.step}/${p.spin?.step}`);
    let laid = 0, done = false;
    for (let i = 0; i < 1e5 && !done; i++) {
      const before = marks(), skipped = lat.stepsSkipped;
      done = lat.advance(pts, T, 0);
      const moved = marks().filter((m, k) => m !== before[k]).length;
      if (lat.stepsSkipped === skipped && moved > 0) { laid++; assert.ok(moved <= 2, `a laying step with no budget moved ${moved} points`); }
    }
    assert.ok(done, 'the window stands at the end');
    assert.ok(laid > 0, 'laying steps met with no budget');
  } finally { setAirGround(null); }
});

/** A snow cover host over Woodlands at event minute `t`: its frame clock (performance.now's stand-in) runs `step` ms an
 *  ask and counts them; the stream's height asks counted too. */
function coverHost(t, { ground = 0, step = 0 } = {}) {
  const clock = { ms: 0, asks: 0 };
  let heights = 0;
  const state = { compensation: [0, 0, 0], mapOrigin: { x: 200, y: 100 }, current: { x: 200, y: 100 }, pixelTranslation: (px, py, out = [0, 0, 0]) => { out[0] = (px - 200) * 819.2; out[1] = 0; out[2] = -(py - 100) * 819.2; return out; } };
  const host = createSnowCoverHost({ renderer: { tileArrays: new Map() }, climateAt: woods, mapHeight: 500, stateOf: () => state, builtOf: () => new Map(),
    heightAt: () => { heights++; return ground; }, owns: () => true, markReskin: () => {}, now: () => t, place: () => ({ px: 200, py: 100 }),
    clock: () => { clock.asks++; return (clock.ms += step); } });
  return { host, clock, heights: () => heights };
}

test('SNOW-BUDGET a frame\'s asks share one budget: the tick spends the frame\'s, and the feet and the mod\'s winter after it in the same frame\'s time integrate a point each at the most, not a budget each; the next frame has its own (mutants: a budget a reader)', () => {
  setAirGround({ climateAt: woods, groundAt: () => 0, topAt: () => 900 });
  try {
    const { host, clock } = coverHost((406 * 360 + 330) * 1440, { step: 0.01 });
    host.tick({ px: 200, py: 100, dt: 0.016 });
    assert.equal(host.ready, false, 'a year to catch up: not in one frame');
    const tickAsks = clock.asks;
    assert.ok(tickAsks > 100, `the tick spent the frame's 3 ms (${tickAsks} asks of 0.01)`);
    assert.ok(clock.ms < SNOW_COVER.frameMs, 'still the tick\'s frame');
    const before = clock.asks;
    for (let k = 0; k < 3; k++) host.winterAt([10, 0, -10], false);
    host.winterNear(false);
    const readers = clock.asks - before;
    assert.ok(readers < 60, `four readers after a spent frame: ${readers} asks - a point each, never a budget each`);
    clock.ms += SNOW_COVER.frameMs;   // the next frame
    const next = clock.asks;
    host.tick({ px: 200, py: 100, dt: 0.016 });
    assert.ok(clock.asks - next > 100, 'the next frame\'s tick spends a budget of its own');
  } finally { setAirGround(null); }
});

test('SNOW-BUDGET the ground\'s slope is read only where the snowline lays snow: a summer\'s grass and feet ask the stream no heights, a winter\'s do - and the answers are the ones the slope gave (mutants: the slope read first)', async () => {
  setAirGround({ climateAt: woods, groundAt: () => 0, topAt: () => 900 });
  try {
    const { host, heights } = coverHost((406 * 360 + 215) * 1440);
    await host.settle({ left: () => Infinity, breathe: async () => {} });
    const p = { px: 200, py: 100 };
    const h0 = heights();
    for (let k = 0; k < 50; k++) assert.equal(host.buries(p, 100 + k, 200, 100 + k, -200, 10), false);
    assert.equal(host.winterAt([5, 10, -5], false), false);
    assert.equal(heights(), h0, 'no snow: no slope asked');
    // the lines laid down to the valley: the slope read, and a flat ground's cover full
    for (const l of host._lines.values()) { l.shown = Float32Array.of(-500, -400, -300); l.target = Float32Array.from(l.shown); }
    const h1 = heights();
    assert.equal(host.winterAt([5, 10, -5], false), true, 'white under the feet');
    assert.ok(heights() > h1, 'its slope read');
    let buried = 0;
    for (let k = 0; k < 50; k++) buried += host.buries(p, 100 + k, 200, 100 + k, -200, 10) ? 1 : 0;
    assert.equal(buried, 50, 'every blade under a full cover');
  } finally { setAirGround(null); }
});

test('SNOW-BUDGET the numbers: a frame\'s time is SNOW_COVER.frameMs, and the snow\'s step is the snowpack\'s three hours', () => {
  assert.equal(SNOW_COVER.budgetMs, 3);
  assert.ok(SNOW_COVER.frameMs > 0 && SNOW_COVER.frameMs < 17, 'under a 60 Hz frame');
  assert.equal(SNOWPACK.stepMinutes, 180);
});
