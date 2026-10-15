// WAGON-UV (2026-10-10, from play: "For the wagon and especially the cart model we need to adjust the texture mapping.
// The small cart is really off angle. Also, the windows on the wagon arent centered properly"): the cart's pictures laid
// on its level frame (world/wagonModels.js cartLevel), the caravan's sides laid from the body's middle (caravanSideU)
// and its side window centred between the skirt and the cornice (world/wagonArt.js CARAVAN_SIDE_WINDOW). Read off the
// built geometry - the faces the pool draws - never off the laws' own numbers.
import './modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { WAGON_SOURCES, TEX, WAGON_TILE, CARAVAN_SIDE_WINDOW, CARAVAN_SKIRT_Y, CARAVAN_CORNICE_Y, SIDE_Y0, SIDE_Y1, sideRow } from '../src/world/wagonArt.js';
import { wagonGeometry, buildBakedWagonParts, pitchedPoint, MEASURED, LIFT } from '../src/world/wagonModels.js';
import { planarUv } from '../src/world/galleonMesh.js';
import { classicPictures, COMPOSE } from '../src/world/classicArt.js';
import { fakeClassicRgba } from './classicArtFake.mjs';

const bakeOf = (kind) => JSON.parse(readFileSync(new URL(`../src/assets/wagons/${kind}.json`, import.meta.url), 'utf8'));
const keyOf = (rec) => Object.keys(TEX).find((k) => TEX[k] === rec);
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };

/** Every triangle of a built geometry: its record, its three corners (through `at`) and their picture points. */
function triangles(g, at = (p) => p) {
  const out = [];
  g.subMeshes.forEach((sm, k) => {
    for (let t = sm.startIndex; t < sm.startIndex + sm.primitiveCount * 3; t += 3) {
      const ids = [0, 1, 2].map((j) => g.indices[t + j]);
      out.push({ rec: g.slots[k].record, p: ids.map((i) => at([g.positions[i * 3], g.positions[i * 3 + 1], g.positions[i * 3 + 2]])), uv: ids.map((i) => [g.uvs[i * 2], g.uvs[i * 2 + 1]]) });
    }
  });
  return out;
}

test('WAGON-UV THE CART LAID LEVEL: a horse in its shafts bearing it level, every square face of the cart\'s box, shafts and axle wears its picture as planarUv lays it on a level face - the sideboards along the rail, the stakes upright, the floorboards fore and aft; its wheels as they were, each picture upright on its hub (from play: "The small cart is really off angle"; mutants: the cart laid as drawn, its wheels laid level too)', () => {
  const geo = wagonGeometry(bakeOf('cart'));
  const parts = buildBakedWagonParts(geo, (g) => g);
  const borne = (p) => pitchedPoint(parts, p, parts.hitchPitch);
  let square = 0, sides = 0;
  for (const tri of triangles(geo.statics, borne)) {
    const n = unit(cross(sub(tri.p[1], tri.p[0]), sub(tri.p[2], tri.p[0])));
    if (!n.some((c) => Math.abs(c) > 0.999)) continue;   // the faces that stand square to the level box
    square++;
    if (tri.rec === TEX.side && Math.abs(n[0]) > 0.999) sides++;
    const tile = WAGON_TILE[keyOf(tri.rec)];
    const want = tri.p.map((p) => planarUv(p, n, tile));
    for (const i of [1, 2]) for (const k of [0, 1]) {
      assert.ok(Math.abs((tri.uv[i][k] - tri.uv[0][k]) - (want[i][k] - want[0][k])) < 1e-4,
        `record ${tri.rec} (${keyOf(tri.rec)}), normal ${n.map((c) => c.toFixed(3))}: its picture runs ${k ? 'up' : 'along'} the level face`);
    }
  }
  assert.ok(square >= 30, `the box's walls, its floor, its rail and its ends (${square} triangles)`);
  assert.ok(sides >= 4, `both outside walls among them (${sides} triangles)`);
  // the wheels roll, so none is turned level: each face's picture stands upright on its own hub (wheelUv's law)
  for (const w of geo.wheels) {
    for (const tri of triangles(w.geometry)) {
      if (tri.rec !== TEX.wheel) continue;
      tri.p.forEach((p, i) => assert.deepEqual(tri.uv[i].map((v) => +v.toFixed(4)), [0.5 + p[2] / (2 * w.radius), 0.5 + p[1] / (2 * w.radius)].map((v) => +v.toFixed(4)), `${w.role}: upright on its hub`));
    }
  }
});

/** A point's picture coordinate on the faces of `g` wearing record `rec` that hold the point (test/wagons2.test.js's
 *  uvAt, on a built geometry's slots). */
function uvAt(g, rec, p) {
  for (const tri of triangles(g)) {
    if (tri.rec !== rec) continue;
    const [a, b, c] = tri.p, n = cross(sub(b, a), sub(c, a)), nl = Math.hypot(...n);
    if (nl < 1e-9 || Math.abs(n[0]) / nl < 0.9 || Math.sign(n[0]) !== Math.sign(p[0])) continue;
    const q = (v) => [v[1], v[2]], A = q(a), B = q(b), Cq = q(c), X = q(p);
    const d = (B[0] - A[0]) * (Cq[1] - A[1]) - (Cq[0] - A[0]) * (B[1] - A[1]);
    if (Math.abs(d) < 1e-12) continue;
    const u = ((X[0] - A[0]) * (Cq[1] - A[1]) - (Cq[0] - A[0]) * (X[1] - A[1])) / d, v = ((B[0] - A[0]) * (X[1] - A[1]) - (X[0] - A[0]) * (B[1] - A[1])) / d;
    if (u < -1e-9 || v < -1e-9 || u + v > 1 + 1e-9) continue;
    const [ua, ub, uc] = tri.uv;
    return [ua[0] + u * (ub[0] - ua[0]) + v * (uc[0] - ua[0]), ua[1] + u * (ub[1] - ua[1]) + v * (uc[1] - ua[1])];
  }
  return null;
}
/** A livery row's height over the ground (sideRow undone: SIDE_Y1 row 0, SIDE_Y0 row 63). */
const rowY = (row) => SIDE_Y1 - (row / 63) * (SIDE_Y1 - SIDE_Y0);
/** A picture coordinate's texel in an `n`-texel picture (64: the layout's - world/wagonArt.js). */
const texelAt = (uv, n = 64) => [((Math.floor(uv[0] * n) % n) + n) % n, Math.min(n - 1, Math.max(0, Math.floor((1 - uv[1]) * n)))];

test('WAGON-UV THE CARAVAN\'S WINDOWS CENTRED: along each side the two windows\' glass stands the same each way from the body\'s middle, each in the middle of its half; and up the side the window stands as far under the cornice\'s height as over the skirt\'s, its glass inside it (DF-ART: Daggerfall\'s window laid in its layout) (from play: "the windows on the wagon arent centered properly"; mutants: the side laid from the axle again, the half texel of the window\'s middle dropped, the window back up under the cornice)', async () => {
  const body = wagonGeometry(bakeOf('caravan')).statics;
  const side = new Map(await classicPictures({ [TEX.caravanSide]: WAGON_SOURCES[TEX.caravanSide] }, fakeClassicRgba())).get(TEX.caravanSide);
  assert.equal(side.width, COMPOSE);
  const M = MEASURED.caravan, rear = M.rearZ, front = M.bedZ[1], mid = (rear + front) / 2, half = (front - rear) / 2;
  const { y0, y1 } = CARAVAN_SIDE_WINDOW;
  const paneY = rowY((y0 + y1) / 2 - 3) - LIFT;   // a pane's height, clear of the lead across the window's middle
  for (const s of [1, -1]) {
    const runs = [];
    for (let z = rear + 0.0125; z < front - 0.01; z += 0.005) {
      const uv = uvAt(body, TEX.caravanSide, [s * M.sideX, paneY, z]);
      assert.ok(uv, `the side at ${s} ${z.toFixed(3)}`);
      const [x, y] = texelAt(uv, COMPOSE);
      if (side.data[(y * COMPOSE + x) * 4 + 3] !== 0) continue;
      const last = runs.at(-1);
      if (last && z - last[1] < 0.1) last[1] = z; else runs.push([z, z]);   // the lead down a window's middle splits none
    }
    assert.equal(runs.length, 2, `side ${s}: two windows (${JSON.stringify(runs)})`);
    const [a, b] = runs.map(([lo, hi]) => (lo + hi) / 2);
    assert.ok(Math.abs(a + b - 2 * mid) < 0.015, `side ${s}: the same each way from the middle (${(a - mid).toFixed(3)}, ${(b - mid).toFixed(3)})`);
    for (const [c, want] of [[a, rear + half / 2], [b, mid + half / 2]]) assert.ok(Math.abs(c - want) < 0.02, `side ${s}: a window in the middle of its half (${c.toFixed(3)}, ${want.toFixed(3)})`);
  }
  // up the side: the window's rows in the layout as many under the cornice's row as over the skirt's (or one more: 45
  // rows, 26 of window), and its glass in the picture inside those rows
  const cornice = sideRow(CARAVAN_CORNICE_Y), skirt = sideRow(CARAVAN_SKIRT_Y), k = COMPOSE / 64;
  const over = y0 - cornice - 1, under = skirt - y1 - 1;
  assert.ok(Math.abs(over - under) <= 1, `centred between them: ${over} rows over the window, ${under} under`);
  const glassRows = [];
  for (let y = 0; y < COMPOSE; y++) for (let x = 0; x < COMPOSE; x++) if (side.data[(y * COMPOSE + x) * 4 + 3] === 0) { glassRows.push(y); break; }
  assert.ok(glassRows.length && glassRows[0] >= y0 * k && glassRows.at(-1) < (y1 + 1) * k, `its glass inside the window's rows (${glassRows[0]}-${glassRows.at(-1)})`);
});

