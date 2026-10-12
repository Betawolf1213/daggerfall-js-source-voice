// EG6a (2026-10-12, the Elite Gates arc; bible/11-Multiplayer/Elite-Gates.md sections 10.1 and 10.3): THE STEPS' READERS ON
// THE SPIRE'S COURSES - scenes/egSpan.js feeds every course the span generator lays (net/egSpanLaw.js egCourseOf, a road at
// a time) to the Hour's own readers: the Steps' waystone on each island (world/sdStepsModel.js sdWaystonesOf), lit gold while
// it is my cast-back point; the Steps' gold ghost (render/sdStepsPass.js, sdGhostStepsOf) where a gone Beat plate or my
// fallen Crumble pin will return, drawn in the hall's telegraph pass through the dungeon host's door; and a Gust's breath
// over its own run of pieces on its own road's line (egGustSections, EG_GUST_REACH_M).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createEgSpan, egStepKey, EG_FLOOR_KEY, EG_GUST_REACH_M } from '../src/scenes/egSpan.js';
import { egGustSections } from '../src/world/egLook.js';
import { WAYSTONE_DARK } from '../src/scenes/sdSteps.js';
import { egCircleSpecs, egHallOf } from '../src/net/egLaw.js';
import { egCourseOf, egBeatAt } from '../src/net/egSpanLaw.js';
import { sdWaystonesOf } from '../src/world/sdStepsModel.js';
import { sdGhostStepsOf, SD_GHOSTS_MAX } from '../src/render/sdStepsPass.js';
import { realmToDungeon } from '../src/net/sdBrain.js';
import { SD_BEAT_CYCLE, SD_BEAT_SOLID, SD_CRUMBLE_DELAY, SD_CRUMBLE_BACK, gustAt } from '../src/world/sdSteps.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
/** The span over a fake renderer (a mesh a model, every free heard). */
function rig(seed, c, geo) {
  const draws = [], dropped = [];
  const renderer = { createMesh: (m) => ({ m }), destroyMesh: (x) => dropped.push(x), uploadTexture: () => {}, uploadEmissionTexture: () => {} };
  const span = createEgSpan({ renderer, seed, c, geo });
  span.stand({ dynamicDraws: draws, collider: { addMesh: () => {} } });
  return { span, draws, dropped };
}
const body = (p, groundKey = EG_FLOOR_KEY, grounded = true) => ({ pos: [...p], grounded, groundKey, height: 1.8, jumping: false, carryBy: () => {}, collider: { move: (feet, dx) => { feet[0] += dx; } } });

test('EG6a THE WAYSTONES (section 10.3): every island of the circle\'s courses carries the Steps\' waystone - sdWaystonesOf over each road\'s course, the arrival plate none, the Low Road\'s island its own - dark, and lit gold the one on the island my cast-back would stand me on; its mesh the Steps\' own, made once and freed with the level (mutants: the arrival plate given a stone; every stone lit; the lit one never moved; the mesh leaked)', () => {
  const { span, draws, dropped } = rig(1, 2, 1);
  const want = [];
  for (const spec of egCircleSpecs(1, 2, 1)) for (const road of [0, 1]) {
    const c = egCourseOf(spec, road);
    if (!c?.steps.length) continue;
    sdWaystonesOf(c).forEach((w, k) => { if (road === 1 || k > 0) want.push({ h: spec.h, x: c.checkpoints[k].x, z: c.checkpoints[k].z, at: realmToDungeon(spec.x0 + w[0], w[1], w[2]) }); });
  }
  assert.ok(want.length >= 4 && want.some((q) => q.x === 15), 'the islands, the Low Road\'s among them');
  assert.deepEqual(span.stones.map(({ h, x, z, at }) => ({ h, x, z, at })), want);
  const stoneDraws = draws.filter((d) => d.texRemap === WAYSTONE_DARK);
  assert.equal(stoneDraws.length, want.length, 'each drawn, dark');
  assert.equal(new Set(stoneDraws.map((d) => d.gpu)).size, 1, 'one mesh for every stone');
  // standing on the second island: its stone lit, the rest dark
  const spec = egHallOf(1, 7, 1), isle = spec.islands.filter((q) => q.road === 0)[1];
  span.ride(10, 1 / 60, body(realmToDungeon(spec.x0 + isle.x, isle.y, isle.z)), true);
  const lit = span.stones.filter((q) => q.lit);
  assert.deepEqual(lit.map((q) => [q.h, q.z]), [[7, isle.z]], 'the island I would be cast back to');
  assert.equal(stoneDraws.filter((d) => d.texRemap === null).length, 1);
  const low = spec.islands.find((q) => q.road === 1);
  span.ride(11, 1 / 60, body(realmToDungeon(spec.x0 + low.x, low.y, low.z)), true);
  assert.deepEqual(span.stones.filter((q) => q.lit).map((q) => [q.x, q.z]), [[15, low.z]], 'the Low Road\'s island now');
  span.ride(12, 1 / 60, body(realmToDungeon(spec.x0, 0, 0)), true);
  assert.equal(span.stones.filter((q) => q.lit).length, 0, 'on the arrival plate, none');
  const gpu = stoneDraws[0].gpu;
  span.clear();
  assert.ok(dropped.includes(gpu), 'the stones\' mesh freed with the level');
});

test('EG6a THE GHOSTS (section 10.3): the course I am on - the hall about my x, the Low Road on its line - its Beat plates and Crumble pins nearest ahead (sdGhostStepsOf, SD_GHOSTS_MAX); a gone Beat outlined where it returns, its hand running back to XII; my fallen Crumble pin counting its return; none drawn without a GPU (mutants: a standing Beat ghosted; the hand run the wrong way; a Crumble ghosted before it fell; the window never moved on)', () => {
  const { span } = rig(1, 2, 1);
  const spec = egHallOf(1, 7, 1), course = egCourseOf(spec, 0), beats = sdGhostStepsOf(course);
  const b = beats[0], at = realmToDungeon(spec.x0, 0, b.z - 6);
  // a moment its first Beat is gone
  let tGone = 0;
  for (let k = 0; k < 400; k++) { const t = 100 + k * 0.01; if (egBeatAt(b, t) >= SD_BEAT_SOLID + 0.3) { tGone = t; break; } }
  span.ride(tGone, 1 / 60, body(at), true);
  const G = span.ghosts;
  assert.deepEqual(G.steps, beats.filter((s) => s.z + s.d / 2 >= b.z - 6 - 3).slice(0, SD_GHOSTS_MAX).map((s) => s.i), 'the course\'s ghosts ahead of me');
  const k = G.steps.indexOf(b.i);
  assert.deepEqual([...G.step.slice(4 * k, 4 * k + 3)], realmToDungeon(spec.x0 + b.x, b.y, b.z).map(Math.fround), 'where it will return');
  const left = SD_BEAT_CYCLE - egBeatAt(b, tGone);
  assert.equal(G.state[4 * k], 1, 'gone: outlined');
  assert.ok(Math.abs(G.state[4 * k + 1] - left / (SD_BEAT_CYCLE - SD_BEAT_SOLID)) < 1e-6, 'its hand the time left to its return');
  // the same Beat standing: no ghost
  let tUp = 0;
  for (let j = 0; j < 400; j++) { const t = 200 + j * 0.01; if (egBeatAt(b, t) < SD_BEAT_SOLID - 0.3) { tUp = t; break; } }
  span.ride(tUp, 1 / 60, body(at), true);
  assert.equal(span.ghosts.state[4 * span.ghosts.steps.indexOf(b.i)], 0, 'standing: none');
  // past the hall's every ghostable step: the window moved on to none
  span.ride(tUp, 1 / 60, body(realmToDungeon(spec.x0, 0, spec.end.z)), true);
  assert.deepEqual(span.ghosts.steps, [], 'none left ahead');
  // on the Low Road's line beside the High Road's Beats: the Low Road's own course (it lays no Beat or Crumble), never theirs
  assert.ok(spec.fork && egCourseOf(spec, 1).steps.every((s) => s.kind !== 'beat' && s.kind !== 'crumble'));
  span.ride(tGone, 1 / 60, body(realmToDungeon(spec.x0 + spec.fork.lowX, spec.fork.yLow, b.z - 6)), true);
  assert.deepEqual(span.ghosts.steps, [], 'the Low Road\'s course, not the High Road\'s Beats over it');
  assert.equal(span.drawPass(null, null), false, 'no GPU, no pass');
  span.clear();
  // a Crumble of mine: no ghost while it stands under me, its ghost while it is down, counting its return
  let found = null;
  for (let seed = 1; seed < 40 && !found; seed++) for (let c = 2; c <= 4 && !found; c++) for (const q of egCircleSpecs(seed, c, 0)) { const cr = q.steps.find((s) => s.kind === 'crumble' && (s.road ?? 0) === 0); if (cr) { found = { seed, c, q, cr }; break; } }
  assert.ok(found, 'a Crumble');
  const R = rig(found.seed, found.c, 0), q = found.q, cr = found.cr, on = realmToDungeon(q.x0 + cr.x, cr.y, cr.z);
  R.span.ride(300, 1 / 60, body(on, egStepKey(q.h, cr.i)), true);   // my foot on it
  const slot = () => R.span.ghosts.steps.indexOf(cr.i);
  assert.ok(slot() >= 0);
  assert.equal(R.span.ghosts.state[4 * slot()], 0, 'standing under me: none');
  const f = 1.5;
  R.span.ride(300 + SD_CRUMBLE_DELAY + f, 1 / 60, body(realmToDungeon(q.x0 + cr.x, cr.y, cr.z - 4)), true);
  assert.equal(R.span.ghosts.state[4 * slot()], 1, 'fallen: outlined');
  assert.ok(Math.abs(R.span.ghosts.state[4 * slot() + 1] - (SD_CRUMBLE_BACK - f) / SD_CRUMBLE_BACK) < 1e-3, 'counting its return');
  R.span.clear();
});

test('EG6a A GUST\'S BREATH (section 10.3): over each run of a hall\'s Gust pieces, an island\'s reach either side, on its own road\'s line - the Crumbles between two runs and THE FORK\'s other road stand in no breath (the course sweep found both blowing) (mutants: the runs one section; the breath across the hall)', () => {
  const spec = egHallOf(25, 27, 7);
  const G = egGustSections([spec]);
  assert.deepEqual(G.map((g) => [g.spec.h, g.road, g.x, g.y, +g.z0.toFixed(2), +g.z1.toFixed(2)]), [[27, 0, 0, 0, 48.58, 69.47], [27, 0, 0, 0, 95.47, 111.69]], 'two runs, two sections');
  assert.equal(EG_GUST_REACH_M, 6);
  const { span } = rig(25, 6, 7);
  let t = 0;
  for (let k = 0; k < 1200; k++) if (gustAt(k * 0.01).push) { t = k * 0.01; break; }
  const pushed = (x, z) => { const B = body(realmToDungeon(spec.x0 + x, 0, z)); const x0 = B.pos[0]; span.ride(t, 0.05, B, true); return B.pos[0] !== x0; };
  assert.equal(pushed(0, 60), true, 'on a run\'s line, blown');
  assert.equal(pushed(0, 80), false, 'the Crumbles between the runs: still');
  assert.equal(pushed(spec.fork.lowX, 60), false, 'the Low Road under it: still');
  assert.equal(pushed(EG_GUST_REACH_M - 0.5, 100), true, 'an island\'s reach across');
  span.clear();
});

test('EG6a THE HOSTS: the ghosts are the dungeon host\'s door (egSpanDraw - the spans\' drawPass) and the world host\'s Spire pass draws them beside the telegraphs, marking the foreign pass; the mode machine calls that pass for every Elite hall as before', () => {
  const D = read('src/scenes/dungeonContext.js'), W = read('src/scenes/world.js'), M = read('src/scenes/worldModes.js');
  assert.match(D, /\n {4}egSpanDraw\(proj, view, fog\) \{ return !!egSpan\?\.drawPass\(proj, view, fog\); \},/);
  assert.match(W, /drawEgFight: \(\{ proj, view, eye \}\) => \{[^\n]*g = !!modes\?\.dungeonCtx\?\.egSpanDraw\?\.\(proj, view, fog\); if \(a \|\| b \|\| g\) renderer\.markForeignPass\(\); \}/);
  assert.match(M, /if \(isEgHall\(dungeonLoc\)\) host\.drawEgFight\?\.\(\{ proj, view, eye: mwv\.eye \}\);/);
});
