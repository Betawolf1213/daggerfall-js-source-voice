// BANTHA1 (2026-10-18, the owner: "Bantha, north of daggerfall is going to be the first region in the continent to
// recieve a biome expansion. Using the attached file, populate the area in a dense jungle like format. When traveling
// inside the area there should be a fog-like haze that reduces visability. This needs to be insanely detailed and not
// hurt performance. No band aids"): THE JUNGLE OF BANTHA - bible/03-World/Bantha-Jungle.md is the design and the record.
// The owner's trees read and measured off their own files, the field the layout and the haze share, the layout's laws, the
// haze's law and its shader twin, the bound the cull reads, the hosts, the renderer's second tree slot and the door.
// Mutants: tools/mutants/bantha1.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import {
  JUNGLE_ARCHIVE, JUNGLE_SPECIES, JUNGLE_MEASURES, jungleFiles, jungleRecord, parseObj, parseMtl, measureTree,
  readJungleTrees, jungleCover, JUNGLE_ROOT_BAND,
} from '../../src/world/jungle/jungleModels.js';
import {
  JUNGLE_REGIONS, JUNGLE_FIELD_REACH, JUNGLE_EDGE, JUNGLE_WANDER_MAX, jungleField, jungleNine, jungleSignedAt,
  jungleDepthAt, jungleShare,
} from '../../src/world/jungle/jungleRegion.js';
import { JUNGLE, JUNGLE_PALMS, JUNGLE_COVER, withJungle, canopySpecies } from '../../src/world/terrain/jungleNature.js';
import { layoutNature, TREE_RECORDS, isTreeRecord, tileDraw } from '../../src/world/terrain/terrainNature.js';
import { HEIGHTMAP_DIMENSION, MAX_TERRAIN_HEIGHT, STREAMING_TERRAIN_SCALE, SCALED_BEACH_ELEVATION, TERRAIN_SIZE as PIXEL_M } from '../../src/world/terrain/terrainSampler.js';
import {
  JUNGLE_HAZE, hazeShare, hazeDayFactor, hazeWeatherFactor, hazeDrift, hazeMean, hazeTransmittance, createHazeState, stepHaze,
  hazeUniforms, hazeDensityAt, hazeColumn, hazeColorOf, fogColorWith, hazeSkyUniform, hazeHides,
} from '../../src/world/jungle/jungleHaze.js';
import { HAZE_LAW_GLSL, HAZE_SKY_GLSL } from '../../src/render/hazeGlsl.js';
import { FOG_GLSL } from '../../src/render/fogGlsl.js';
import { renderImpostor, buildTreeSet, LPT_IMPOSTOR_PER_M } from '../../src/world/lowPolyTrees.js';
import { createJungleTrees, JUNGLE_SCALE_MAX, JUNGLE_URLS } from '../../src/systems/jungleTreesAssets.js';
import { createJungleHost } from '../../src/scenes/jungleHost.js';
import { Renderer, WORLD_FRAME } from '../../src/render/renderer.js';
import { perspective, lookAt, mirrorProjectionX } from '../../src/world/mat4.js';
import { ecoOrigin } from '../../src/world/ecotone.js';
import { fogFactor } from '../../src/world/weather.js';
import { jungleOn, jungleHazeOn } from '../../src/scenes/shared.js';
import { FEATURES, checkFeature } from '../../src/systems/features.js';
import { setPref, PREF_DEFAULTS } from '../../src/systems/uiPrefs.js';
import { setUiSkin, uiSkin } from '../../src/systems/uiSkin.js';
import { onlineForcedPref } from '../../src/systems/online/onlineLane.js';
import { glslFunctions } from '../glsl.mjs';
import { hostText } from '../hostText.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { PNG } = createRequire(import.meta.url)('pngjs');
const SRC = 'src/assets/jungle/source';
const text = (p) => readFileSync(join(ROOT, p), 'utf8');
const sources = () => JUNGLE_SPECIES.map((s) => { const f = jungleFiles(s); return { obj: text(`${SRC}/${f.obj}`), mtl: text(`${SRC}/${f.mtl}`) }; });
const picture = (name) => { const p = PNG.sync.read(readFileSync(join(ROOT, SRC, name))); return { width: p.width, height: p.height, data: new Uint8Array(p.data) }; };
const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e;
const TREES = readJungleTrees(sources());

test('BANTHA1 the owner\'s trees, read: five prototypes of the rainforest\'s archive, each its OBJ\'s every polygon fanned, mirrored in x as Unity reads an OBJ, its root at the origin and its ground kept, cut at a half on both faces (mutants: the mirror lost; the root left where it stood; a fan turned)', () => {
  assert.equal(JUNGLE_ARCHIVE, 500);
  assert.deepEqual(JUNGLE_SPECIES.map((s) => [s.key, s.file, s.record]), [['banyan', 'jungle_tree', 12], ['kapok', 'jungle_tree2', 13], ['fig', 'jungle_tree3', 14], ['flame', 'jungle_tree4', 15], ['mahogany', 'jungle_tree5', 16]]);
  for (const s of JUNGLE_SPECIES) assert.ok(isTreeRecord(500, s.record), `${s.key} is a Tree of the rainforest - Logging fells it`);
  assert.deepEqual([...TREES.protos.keys()], JUNGLE_SPECIES.map((s) => `500_${jungleRecord(s)}`));
  assert.deepEqual(TREES.pictures, ['jungle_tree_252w.png', 'jungle_tree2_252w.png', 'jungle_tree3_252w.png', 'jungle_tree4_252w.png', 'jungle_tree5_252w.png'], 'each MTL\'s own picture');
  const tris = [], verts = [];
  JUNGLE_SPECIES.forEach((s, k) => {
    const obj = parseObj(sources()[k].obj);
    const m = TREES.models[k], p = TREES.protos.get(`500_${jungleRecord(s)}`);
    // the fan: every polygon of n corners is n - 2 triangles
    assert.equal(m.indices.length / 3, obj.faces.reduce((n, f) => n + f.corners.length - 2, 0), `${s.key}: every polygon fanned`);
    tris.push(m.indices.length / 3); verts.push(m.vertices.length / 8);
    // the root: the middle of its lowest JUNGLE_ROOT_BAND metres stands at the origin
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (let i = 0; i < m.vertices.length; i += 8) {
      if (m.vertices[i + 1] > m.min[1] + JUNGLE_ROOT_BAND) continue;
      x0 = Math.min(x0, m.vertices[i]); x1 = Math.max(x1, m.vertices[i]); z0 = Math.min(z0, m.vertices[i + 2]); z1 = Math.max(z1, m.vertices[i + 2]);
    }
    assert.ok(near((x0 + x1) / 2, 0, 1e-5) && near((z0 + z1) / 2, 0, 1e-5), `${s.key}: its root at the origin`);
    // mirrored: the file's first corner of its first face lands at -(x - root.x), y, z - root.z, its normal's x turned
    const c = obj.faces[0].corners[0], v0 = m.vertices.subarray(0, 8);
    assert.ok(near(v0[0], Math.fround(-(obj.positions[c[0] * 3] - m.root[0])), 1e-5) && near(v0[1], Math.fround(obj.positions[c[0] * 3 + 1]), 1e-6) && near(v0[2], Math.fround(obj.positions[c[0] * 3 + 2] - m.root[1]), 1e-5), `${s.key}: mirrored in x`);
    assert.ok(near(v0[3], Math.fround(-obj.normals[c[2] * 3]), 1e-6), `${s.key}: and its normal`);
    // every triangle wound as Unity's front is - a left-handed clockwise face, its right-handed cross along its corners'
    // normals (the renderer's frontFace CW): the mirror's reversal, and the owner's kapok, whose faces and normals the
    // export turned apart, wound as its normals say
    let agree = 0;
    const V = m.vertices;
    for (let t = 0; t < m.indices.length; t += 3) {
      const a = m.indices[t] * 8, b = m.indices[t + 1] * 8, d = m.indices[t + 2] * 8;
      const e1 = [V[b] - V[a], V[b + 1] - V[a + 1], V[b + 2] - V[a + 2]], e2 = [V[d] - V[a], V[d + 1] - V[a + 1], V[d + 2] - V[a + 2]];
      const fn = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
      let dot = 0;
      for (let c = 0; c < 3; c++) dot += fn[c] * (V[a + 3 + c] + V[b + 3 + c] + V[d + 3 + c]);
      if (dot > 0) agree++;
    }
    assert.equal(agree, m.indices.length / 3, `${s.key}: every face wound with its normals`);
    assert.deepEqual({ ...p.subs[0] }, { atlas: s.key, opaque: false, cutoff: 0.5, cull: 0, color: [1, 1, 1] });
    assert.ok(near(p.size.h, m.max[1]) && near(p.size.w, 2 * Math.max(-m.min[0], m.max[0], -m.min[2], m.max[2])));
  });
  assert.deepEqual(tris, [132, 103, 156, 156, 261], 'the owner\'s triangles, every one');
  assert.equal(TREES.json.vertexBytes, verts.reduce((a, b) => a + b, 0) * 32);
  assert.equal(TREES.treesBin.byteLength, TREES.json.vertexBytes + tris.reduce((a, b) => a + b, 0) * 6, 'every vertex, then every index');
  assert.deepEqual(parseMtl('newmtl A\nmap_Kd a.png\nmap_d b.png\nnewmtl B\n').get('A'), { mapKd: 'a.png', mapD: 'b.png' });
  assert.throws(() => readJungleTrees(sources().slice(1)), /5 trees expected/);
});

test('BANTHA1 each tree as it stands, MEASURED off what it draws - its foot, its crown, where its crown begins, its trunk and its height - and the table the stream reads is the measure, to the centimetre; a jungle tree\'s cover its own trunk and crown at its scale (mutants: a row drifted; the foot read at the crown\'s height)', () => {
  JUNGLE_SPECIES.forEach((s, k) => {
    const m = measureTree(TREES.models[k], picture(TREES.pictures[k]));
    const r2 = (v) => Math.round(v * 100) / 100;
    assert.deepEqual(Object.fromEntries(Object.entries(m).map(([key, v]) => [key, r2(v)])), { ...JUNGLE_MEASURES[k] }, s.key);
  });
  assert.ok(JUNGLE_MEASURES.every((m) => m.foot < m.crown + 0.01 && m.crownFrom < m.height && m.trunk >= 0.35 && m.trunk <= 1.6));
  const base = [1, 2, 3], [trunk, crown] = jungleCover(base, 2, 1.2), m = JUNGLE_MEASURES[2];
  assert.equal(trunk.c, base, 'by reference - a felled tree is no cover (FELLED keys on it)');
  assert.deepEqual([trunk.r, trunk.h, trunk.lift], [m.trunk * 1.2, m.crownFrom * 1.2, 0]);
  assert.deepEqual([crown.r, crown.h, crown.lift], [m.crown * 1.2, (m.height - m.crownFrom) * 1.2, m.crownFrom * 1.2]);
});

test('BANTHA1 a jungle tree\'s far picture is LPT1\'s own (renderImpostor): the owner\'s tree drawn from the side at LPT_IMPOSTOR_PER_M texels a metre, its trunk standing on the middle of its bottom row - the root moved to the origin - and its picture cut as the owner\'s picture is', () => {
  for (const [key, p] of TREES.protos) {
    const pic = renderImpostor(TREES, p, (n) => picture(TREES.atlases[n].picture));
    assert.equal(Math.round(pic.height / pic.shareH), Math.round(Math.min(256, p.size.h * LPT_IMPOSTOR_PER_M)), key);
    let drawn = 0;
    for (let i = 3; i < pic.data.length; i += 4) { if (pic.data[i]) drawn++; assert.ok(pic.data[i] === 0 || pic.data[i] === 255); }
    assert.ok(drawn > pic.width * pic.height * 0.25, `${key}: a tree's worth (${drawn})`);
    const bottom = pic.height - 2, mid = pic.width >> 1;
    let trunk = false;
    for (let x = mid - 3; x <= mid + 3; x++) if (pic.data[(bottom * pic.width + x) * 4 + 3]) trunk = true;
    assert.ok(trunk, `${key}: its trunk on its root, the middle of its bottom row`);
  }
});

test('BANTHA1 the field: each pixel near Bantha its signed distance from the region\'s edge (its centre to the other side\'s nearest square, pixels), held at the reach, read only when asked; read between pixel centres it crosses zero on the shared edge and agrees across every pixel edge, the wander and all (mutants: the sign lost; an axis neighbour read as its diagonal; a ring stopped short; the wander off the world lattice)', () => {
  assert.deepEqual(JUNGLE_REGIONS, [10]);
  const W = 24, H = 16, inside = (x, y) => x >= 6 && x < 14 && y >= 4 && y < 11;
  let reads = 0;
  const field = jungleField({ width: W, height: H, regionAt: (x, y) => { reads++; return inside(x, y) ? 10 : 3; } });
  const d = (x, y) => field.at(x, y);
  assert.equal(reads, 0, 'nothing read until asked');
  // against the brute force: every pixel of the map, the nearest square of the other side
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let best = JUNGLE_FIELD_REACH + 0.5;
      for (let v = 0; v < H; v++) for (let u = 0; u < W; u++) if (inside(u, v) !== inside(x, y)) best = Math.min(best, Math.hypot(Math.max(Math.abs(u - x) - 0.5, 0), Math.max(Math.abs(v - y) - 0.5, 0)));
      assert.ok(near(d(x, y), inside(x, y) ? best : -best, 1e-6), `${x},${y}`);
    }
  }
  assert.ok(reads <= W * H, 'each pixel\'s region read once');
  assert.equal(d(-1, 3), -(JUNGLE_FIELD_REACH + 0.5), 'off the map: outside');
  assert.equal(d(6, 7), 0.5, 'a border pixel inside: half a pixel to the edge');
  assert.equal(d(5, 7), -0.5, 'its neighbour outside');
  assert.equal(d(8, 7), 2.5);
  assert.equal(d(3, 7), -2.5);
  assert.ok(near(d(4, 2), -Math.hypot(1.5, 1.5), 1e-6), 'off the corner: to the corner of the nearest inside square');
  assert.equal(d(23, 15), -(JUNGLE_FIELD_REACH + 0.5), 'held at the reach');
  // a ring's nearest square is r - 0.5 off and its corner farther: a diagonal found in ring 3 (2.5 by 2.5, 3.54) loses
  // to an axis neighbour in ring 4 (3.5) - the search runs every ring that could still beat what it holds
  const holes = new Set(['13,13', '14,10']);
  const pocked = jungleField({ width: 24, height: 24, regionAt: (x, y) => (holes.has(`${x},${y}`) ? 3 : 10) });
  assert.equal(pocked.at(10, 10), 3.5, 'the axis neighbour a ring out, not the diagonal a ring in');
  assert.equal(jungleNine(field, 23, 15), null, 'nowhere near: no job');
  // the edge between (5,7) and (6,7): x = 819.2 in pixel 5, 0 in pixel 6 - zero there, and the same either side
  const n5 = jungleNine(field, 5, 7), n6 = jungleNine(field, 6, 7);
  assert.ok(near(jungleSignedAt(n5, PIXEL_M, PIXEL_M / 2), 0, 1e-6) && near(jungleSignedAt(n6, 0, PIXEL_M / 2), 0, 1e-6));
  assert.ok(jungleSignedAt(n6, PIXEL_M / 2, PIXEL_M / 2) > 0 && jungleSignedAt(n5, PIXEL_M / 2, PIXEL_M / 2) < 0);
  for (let t = 0; t <= 1; t += 0.0625) {
    // across x (pixel 7 to 8, row 6) and across z (row 7 is south of row 6: its north edge is z = 819.2 in it, z = 0 in row 6)
    const ax = jungleDepthAt(7, 6, jungleNine(field, 7, 6), PIXEL_M, t * PIXEL_M), bx = jungleDepthAt(8, 6, jungleNine(field, 8, 6), 0, t * PIXEL_M);
    const az = jungleDepthAt(9, 7, jungleNine(field, 9, 7), t * PIXEL_M, PIXEL_M), bz = jungleDepthAt(9, 6, jungleNine(field, 9, 6), t * PIXEL_M, 0);
    assert.ok(near(ax, bx, 1e-6) && near(az, bz, 1e-6), `continuous at ${t}`);
  }
  let most = 0;
  for (let i = 0; i < 400; i++) {
    const x = (i * 37.3) % PIXEL_M, z = (i * 91.7) % PIXEL_M;
    most = Math.max(most, Math.abs(jungleDepthAt(9, 7, n6, x, z) - jungleSignedAt(n6, x, z)));
  }
  assert.ok(most > 30 && most <= JUNGLE_WANDER_MAX + 1e-9, `the line wanders, within its bound (${most.toFixed(1)} of ${JUNGLE_WANDER_MAX})`);
  assert.equal(jungleShare(-JUNGLE_EDGE.out), 0);
  assert.equal(jungleShare(JUNGLE_EDGE.in), 1);
});

/** A synthetic pixel: a gentle slope of grass (a dirt tile every seventh), a cliff along x 100-104, a sea below the beach
 *  line at y < 6, and a track down column 64. */
function pixelGround() {
  const H = HEIGHTMAP_DIMENSION, T = 128;
  const hm = new Float32Array(H * H);
  const beach = SCALED_BEACH_ELEVATION / MAX_TERRAIN_HEIGHT;
  for (let a = 0; a < H; a++) {
    for (let b = 0; b < H; b++) {
      // sample(x, y) = data[x * hDim + y]: a is x (east), b is y (the tile rows)
      let h = beach * 1.6 + 0.004 * Math.sin(a / 9) + 0.0002 * b;
      if (a >= 100 && a <= 104) h += (a - 99) * 0.03;   // a cliff
      if (a > 104) h += 0.15;
      if (b < 6) h = beach * 0.5;   // the sea
      hm[a * H + b] = h;
    }
  }
  const tm = new Uint8Array(T * T).fill(2);
  for (let i = 0; i < tm.length; i += 7) tm[i] = 1;
  const paths = new Uint8Array(T * T);
  for (let y = 0; y < T; y++) paths[y * T + 64] = 1;
  return { hm, tm, paths };
}
const PX = 400, PY = 100;
const WHOLE = Object.freeze([3, 3, 3, 3, 3, 3, 3, 3, 3]);
const layoutOf = (g, nine, extra = {}) => {
  const opts = { mapPixelX: PX, mapPixelY: PY, rawWorldHeight: 80, climateType: 400, locationRect: null, forests: { archive: 500, pois: [], paths: g.paths } };
  const own = layoutNature(g.hm, g.tm, opts);
  return { own, out: withJungle(own, g.hm, g.tm, { ...opts, jungle: nine ? { nine, pois: extra.pois ?? [], paths: g.paths } : null }) };
};

test('BANTHA1 the layout, four storeys: a canopy tree a cell where the jungle is whole (the emergents the kapok\'s and the mahogany\'s alone), young trees in the light gaps and under the crowns, the rainforest\'s palms and its floor - each a flat of archive 500 with a Tree record of the species it is (mutants: the canopy\'s chance whole; an emergent of any species; the young trees\' scale the canopy\'s)', () => {
  const g = pixelGround();
  const { own, out } = layoutOf(g, WHOLE);
  const trees = out.filter((f) => f.jungle != null), rest = out.filter((f) => f.jungle == null);
  const canopy = trees.filter((f) => f.js >= JUNGLE.canopyScale[0]), young = trees.filter((f) => f.js <= JUNGLE.underScale[1]);
  assert.equal(canopy.length + young.length, trees.length, 'every tree a storey');
  const cells = (128 / JUNGLE.cell) ** 2;
  assert.ok(canopy.length > cells * 0.45 && canopy.length < cells * JUNGLE.canopy, `a closed canopy (${canopy.length} of ${cells} cells)`);
  // ...and the gaps are the canopy's own chance: no cell stands its tree on a draw past JUNGLE.canopy, whatever its ground
  const C = JUNGLE.cell, gap = canopy.filter((f) => tileDraw(PX * 128 + Math.floor(f.x / 6.4 / C) * C, -PY * 128 + Math.floor(f.z / 6.4 / C) * C, 22) >= JUNGLE.canopy);
  assert.deepEqual(gap, [], 'a cell\'s gap is kept at JUNGLE.canopy');
  assert.ok(young.length > 600, `an understorey (${young.length})`);
  for (const f of trees) {
    assert.equal(f.archive, 500); assert.equal(f.wood, 1);
    assert.equal(f.record, JUNGLE_SPECIES[f.jungle].record);
    if (f.js > JUNGLE.canopyScale[1]) assert.ok([1, 4].includes(f.jungle) && f.js <= JUNGLE.emergentScale[1], 'an emergent is a kapok or a mahogany');
  }
  assert.ok(canopy.some((f) => f.js > JUNGLE.canopyScale[1]), 'emergents stand');
  assert.deepEqual([...new Set(canopy.map((f) => f.jungle))].sort(), [0, 1, 2, 3, 4], 'every species');
  const palms = rest.filter((f) => JUNGLE_PALMS.includes(f.record)), floor = rest.filter((f) => JUNGLE_COVER.includes(f.record));
  assert.equal(palms.length + floor.length, rest.length, 'the rest is the rainforest\'s own: its palms and its floor');
  assert.ok(rest.every((f) => f.archive === 500));
  assert.ok(floor.length > 16384 * 0.3 * 0.6, `a covered floor (${floor.length})`);
  assert.deepEqual(JUNGLE_PALMS, TREE_RECORDS[500]);
  assert.ok(own.length > 0 && !out.some((f) => own.includes(f)), 'where the jungle is whole the pixel\'s own layout gives way on every tile');
});

test('BANTHA1 where a jungle tree may not stand: on a track, in a place\'s clearing, up a cliff, under the beach line - and the storeys under the canopy keep their distance from its trunks (mutants: the track ignored; the slope test off; the trunk\'s clearance its own cell\'s alone)', () => {
  const g = pixelGround();
  const town = { xMin: 20, xMax: 30, yMin: 40, yMax: 50, hide: false };
  const { out } = layoutOf(g, WHOLE, { pois: [town] });
  const j = out.filter((f) => f.archive === 500 && (f.jungle != null || JUNGLE_PALMS.includes(f.record) || JUNGLE_COVER.includes(f.record)));
  const tile = (f) => [Math.floor(f.x / 6.4), Math.floor(f.z / 6.4)];
  for (const f of j) {
    const [x, y] = tile(f);
    assert.notEqual(x, 64, 'never on the track');
    assert.ok(!(x >= town.xMin - 4 && x < town.xMax + 4 && y >= town.yMin - 4 && y < town.yMax + 4), 'never in the clearing');
    assert.ok(y >= 6, 'never under the beach line');
    assert.ok(!(x >= 99 && x <= 104), `never up the cliff (${x})`);
  }
  const canopy = j.filter((f) => f.jungle != null && f.js >= JUNGLE.canopyScale[0]);
  const under = j.filter((f) => f.jungle != null && f.js <= JUNGLE.underScale[1]);
  const palms = j.filter((f) => f.jungle == null && JUNGLE_PALMS.includes(f.record)), floor = j.filter((f) => f.jungle == null && JUNGLE_COVER.includes(f.record));
  const clearOf = (list, clear) => list.every((f) => canopy.every((c) => Math.hypot(f.x - c.x, f.z - c.z) >= clear * c.js - 1e-9));
  assert.ok(clearOf(under, JUNGLE.underClear) && clearOf(palms, JUNGLE.underClear), 'a young tree and a palm keep JUNGLE.underClear of every canopy trunk, at its scale');
  assert.ok(clearOf(floor, JUNGLE.coverClear), 'a plant JUNGLE.coverClear');
  // the light: near the town the woods draw back, so its ring is open ground - few canopy trees, the flame tree's light
  const ring = canopy.filter((f) => { const [x, y] = tile(f); return Math.max(town.xMin - x, 0, x - town.xMax) + Math.max(town.yMin - y, 0, y - town.yMax) < 8; });
  assert.ok(ring.length < 8, `the town's fields stand few canopy trees (${ring.length})`);
});

test('BANTHA1 every tree its own dice, and the border\'s stands: the jungle\'s flats are a hash of their world tile, the same whatever the pixel\'s own layout was; past the line\'s reach the pixel\'s own layout is the answer itself; across the border the jungle comes in by tiles, thicker inward (mutants: a stream walked across the pixel; the reach test off)', () => {
  const g = pixelGround();
  const a = layoutOf(g, WHOLE).out.filter((f) => f.jungle != null);
  const opts = { mapPixelX: PX, mapPixelY: PY, locationRect: null };
  const b = withJungle([{ record: 1, x: 3, y: 0, z: 3 }], g.hm, g.tm, { ...opts, jungle: { nine: WHOLE, pois: [], paths: g.paths } }).filter((f) => f.jungle != null);
  assert.deepEqual(b, a, 'the same jungle over another layout');
  const own = [{ record: 1, x: 1, y: 0, z: 1 }];
  assert.equal(withJungle(own, g.hm, g.tm, { ...opts, jungle: { nine: [-3, -3, -3, -3, -3, -3, -3, -3, -3], pois: [], paths: null } }), own, 'out of reach: the pixel\'s own, untouched');
  assert.equal(withJungle(own, g.hm, g.tm, { ...opts, jungle: null }), own);
  // the border: the jungle's side to the east (the pixel's own centre on the line's west, -0.5 from it)
  const border = [-1.5, -0.5, 0.5, -1.5, -0.5, 0.5, -1.5, -0.5, 0.5].map((v) => v + 0.5);   // the line through the pixel's middle
  const { out } = layoutOf(g, border);
  const west = out.filter((f) => f.jungle != null && f.x < 300).length, east = out.filter((f) => f.jungle != null && f.x > 520 && f.x < 640).length;
  assert.ok(west === 0 && east > 60, `none past the line, thickening in (${west} west, ${east} east)`);
  const over = withJungle([{ record: 1, x: 3, y: 0, z: 3 }], g.hm, g.tm, { ...opts, jungle: { nine: border, pois: [], paths: g.paths } }).filter((f) => f.jungle != null);
  assert.deepEqual(over, out.filter((f) => f.jungle != null), 'the border\'s tiles the same over another layout - each tile its own dice');
  const mixed = out.filter((f) => f.x > 400 && f.x < 520);
  assert.ok(mixed.some((f) => f.jungle != null) && mixed.some((f) => f.jungle == null && !JUNGLE_COVER.includes(f.record) && f.archive !== 500), 'at the line both stand, tile by tile');
});

test('BANTHA1 the species: banyans and figs crowd the low wet ground, kapoks and mahoganies the uplands, the flame tree the light - drawn from weights that are each species\' grove times its ground times its light (mutants: the ground ignored; the light ignored)', () => {
  const origin = ecoOrigin(PX, PY);
  const share = (above, light) => {
    const n = [0, 0, 0, 0, 0];
    for (let i = 0; i < 4000; i++) n[canopySpecies(origin, (i * 7.31) % 128, (i * 3.17) % 128, above, light, (i + 0.5) / 4000)]++;
    return n.map((v) => v / 4000);
  };
  const low = share(0, 0), high = share(400, 0), lit = share(60, 1), shade = share(60, 0);
  assert.ok(low[0] + low[2] > high[0] + high[2] + 0.15, `low ground: banyan and fig (${(low[0] + low[2]).toFixed(2)} vs ${(high[0] + high[2]).toFixed(2)})`);
  assert.ok(high[1] + high[4] > low[1] + low[4] + 0.15, `high ground: kapok and mahogany (${(high[1] + high[4]).toFixed(2)} vs ${(low[1] + low[4]).toFixed(2)})`);
  assert.ok(lit[3] > shade[3] * 2, `the flame tree takes the light (${lit[3].toFixed(2)} vs ${shade[3].toFixed(2)})`);
});

test('BANTHA1 the haze\'s law: the mean density along a ray through a layer whole under its floor and falling off above it is exact (against a fine sum), the transmittance its exponential, and the shader\'s twin (render/hazeGlsl.js) is this function term for term, as the fog block carries it (mutants: the floor\'s share dropped; the clear start ignored; the sky\'s depth not over the ray\'s rise)', () => {
  for (const [a, b] of [[0, 0], [-2, -1], [-1, 2], [0.5, 3], [3, 0.2], [-3, 4], [1, 1.00001]]) {
    let sum = 0;
    const N = 20000;
    for (let i = 0; i < N; i++) { const h = a + (b - a) * ((i + 0.5) / N); sum += h <= 0 ? 1 : Math.exp(-h); }
    assert.ok(near(hazeMean(a, b), sum / N, 2e-4), `${a} to ${b}`);
  }
  const u = Float32Array.from([0.006, 40, 1 / 90, 8, 1, 0, 0, 0]);
  const eye = [0, 41.7, 0];
  assert.equal(hazeTransmittance(u, eye, [0, 41.7, 7.9]), 1, 'inside the clear start');
  assert.ok(near(hazeTransmittance(u, eye, [0, 30, 300]), Math.exp(-u[0] * (Math.hypot(11.7, 300) - 8) * hazeMean((41.7 - 40) * u[2], (30 - 40) * u[2])), 1e-12));
  assert.equal(hazeTransmittance(Float32Array.from([0.006, 40, 1 / 90, 8, 0, 0, 0, 0]), eye, [0, 0, 5000]), 1, 'off');
  const fns = glslFunctions(HAZE_LAW_GLSL, { uHaze: [[u[0], u[1], u[2], u[3]], [1, 0, 0, 0]] });
  for (let i = 0; i < 60; i++) {
    const p = [Math.sin(i) * 900, 20 + (i * 37) % 400, Math.cos(i * 1.7) * 900];
    assert.ok(near(fns.hazeAt(p, eye), hazeTransmittance(u, eye, p), 1e-9), `the GPU's hazeAt is the CPU's at ${p.map((v) => v.toFixed(0))}`);
  }
  assert.ok(FOG_GLSL.includes(HAZE_LAW_GLSL), 'every world program takes it in the fog block');
  assert.match(FOG_GLSL, /float fogFactorAt\(vec3 worldPos\) \{ return weatherFogAt\(worldPos\) \* hazeAt\(worldPos, focusOrigin\(\)\); \}/, '...and fogs by both, multiplied');
  const sky = glslFunctions(HAZE_SKY_GLSL, { uHazeSky: [0.5, 0.6, 0.55, 0.7] });
  for (const y of [-0.2, 0, 0.003, 0.1, 0.5, 1]) assert.ok(near(sky.hazeSkyMix(y), 1 - Math.exp(-0.7 / Math.max(y, 0.004)), 1e-12), `the sky at ${y}`);
  assert.ok(near(sky.hazeSkyMix(0), 1, 1e-12), 'the horizon is the haze');
  assert.equal(glslFunctions(HAZE_SKY_GLSL, { uHazeSky: [0.5, 0.6, 0.55, 0] }).hazeSkyMix(0.2), 0, 'no depth, no haze');
  assert.ok(near(hazeColumn(u, 41.7), u[0] * (Math.exp(-(41.7 - 40) * u[2]) / u[2]), 1e-9), 'the column over an eye above the floor');
  assert.ok(near(hazeColumn(u, 30), u[0] * (10 + 1 / u[2]), 1e-9), '...and under it');
});

/** A template literal's text from just after its opening backtick - its `${...}` expressions kept whole, a template
 *  inside one skipped - and the index past its closing backtick. */
function templateText(s, i) {
  let out = '';
  while (i < s.length) {
    const c = s[i];
    if (c === '\\') { out += s.slice(i, i + 2); i += 2; continue; }
    if (c === '`') return [out, i + 1];
    if (c === '$' && s[i + 1] === '{') {
      let depth = 1, j = i + 2;
      while (j < s.length && depth > 0) {
        if (s[j] === '`') { j = templateText(s, j + 1)[1]; continue; }
        if (s[j] === '{') depth++; else if (s[j] === '}') depth--;
        j++;
      }
      out += s.slice(i, j); i = j; continue;
    }
    out += c; i++;
  }
  return [out, i];
}

test('BANTHA1 every shader that calls the haze takes its block - the skies the sky\'s half, the far rings the ring\'s, the rest the fog block - read on every template in src/ (a call with no block compiles nowhere, and no other reader in the suite asks) (mutants: the dome\'s block left out; the mod\'s skybox\'s left out)', () => {
  const NEEDS = [
    [/\bhazeSky(?:Mix)?\(/, ['HAZE_SKY_GLSL']],
    [/\bringHaze\(/, ['RING_HAZE_GLSL']],
    [/\bhazeAt\(v/, ['FOG_GLSL', 'EL_FOG_GLSL', 'HAZE_LAW_GLSL', 'RING_HAZE_GLSL']],
  ];
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith('.js') ? [join(d, e.name)] : []));
  const callers = [];
  for (const f of walk(join(ROOT, 'src'))) {
    const s = readFileSync(f, 'utf8');
    for (let at = s.indexOf('`#version 300 es'); at >= 0; at = s.indexOf('`#version 300 es', at + 1)) {
      const body = templateText(s, at + 1)[0];
      for (const [call, blocks] of NEEDS) {
        if (!call.test(body)) continue;
        callers.push(f);
        assert.ok(blocks.some((k) => body.includes(`\${${k}}`)), `${f}: a template calls ${call} with none of ${blocks.join(', ')} in it`);
      }
    }
  }
  for (const p of ['skyRenderer.js', 'enhancedSky.js', 'dynamicSkiesRenderer.js', 'volumetricClouds.js', 'farRing.js', 'enhancedLighting.js', 'waterSurface.js']) {
    assert.ok(callers.some((f) => f.endsWith(join('render', p))), `the sweep reads ${p}`);
  }
});

test('BANTHA1 what the haze hides: a box is hidden only where every point of it sends less than JUNGLE_HAZE.cull of its light through the haze and the weather\'s fog - a bound read at its nearest point and its top, never a guess; near, high or with the haze off, it stands (mutants: the box\'s bottom read for its top; the weather\'s fog ignored; the bound turned)', () => {
  const u = Float32Array.from([0.0055, 30, 1 / 90, 8, 1, 0, 0, 0]);
  const eye = [0, 3.7, 0];
  const fog = { mode: 'linear', density: 0, start: 0, end: 4000 };
  const weather = (d) => fogFactor(fog, d);
  let hidden = 0, standing = 0;
  for (let i = 0; i < 400; i++) {
    const cx = Math.sin(i * 2.3) * 4000, cz = Math.cos(i * 1.1) * 4000, w = 50 + (i % 7) * 120, top = (i % 5) * 300;
    const box = [cx - w, -20, cz - w, cx + w, top, cz + w], t = [0, 0, 0];
    if (!hazeHides(u, eye, box, t, weather)) { standing++; continue; }
    hidden++;
    for (let k = 0; k < 40; k++) {
      const p = [box[0] + (box[3] - box[0]) * ((k * 0.37) % 1), box[1] + (box[4] - box[1]) * ((k * 0.61) % 1), box[2] + (box[5] - box[2]) * ((k * 0.83) % 1)];
      assert.ok(hazeTransmittance(u, eye, p) * weather(Math.hypot(p[0], p[1] - eye[1], p[2])) < JUNGLE_HAZE.cull, 'every point of a hidden box is past the cull');
    }
  }
  assert.ok(hidden > 50 && standing > 50, `both kinds (${hidden} hidden, ${standing} standing)`);
  assert.equal(hazeHides(u, eye, [-50, -10, -50, 50, 20, 50]), false, 'the box the eye stands in');
  assert.equal(hazeHides(u, eye, [1500, 0, -50, 1600, 4000, 50]), false, 'a peak over the haze: its top sends its light');
  assert.equal(hazeHides(u, eye, [1500, 0, -50, 1600, 20, 50]), true, 'the low ground there does not');
  assert.equal(hazeHides(Float32Array.from([0.0055, 30, 1 / 90, 8, 0, 0, 0, 0]), eye, [5000, 0, 0, 5100, 1, 100]), false, 'no haze, nothing hidden');
  assert.equal(hazeHides(u, eye, [900, 0, -10, 950, 1, 10], [0, 0, 0], () => 1), false, 'by itself the haze leaves 950 m');
  assert.equal(hazeHides(u, eye, [900, 0, -10, 950, 1, 10], [0, 0, 0], () => 0.1), true, '...the weather\'s fog with it does not');
});

test('BANTHA1 the haze, eased and coloured: share, density and floor each follow their target by their own lag and snap on the first frame and a jump; by the hour (the dawn\'s mist the thickest), the weather and the drifting banks; its colour the weather\'s fog made humid, the frame\'s one colour the two weighed by their depths, the sky\'s uniform that colour and the column (mutants: no easing; the weight inverted; the dawn thinned)', () => {
  const s = createHazeState();
  stepHaze(s, { dt: 0.016, eye: [0, 0, 0], share: 1, density: 0.005, floor: 40 });
  assert.deepEqual([s.share, s.density, s.floor], [1, 0.005, 40], 'the first frame snaps');
  stepHaze(s, { dt: 1, eye: [3, 0, 0], share: 0, density: 0.01, floor: 0 });
  assert.ok(near(s.share, Math.exp(-1 / JUNGLE_HAZE.lag.share)) && near(s.density, 0.01 - 0.005 * Math.exp(-1 / JUNGLE_HAZE.lag.density)) && near(s.floor, 40 * Math.exp(-1 / JUNGLE_HAZE.lag.floor)), 'then eases, each by its own lag');
  stepHaze(s, { dt: 0.016, eye: [JUNGLE_HAZE.jump + 10, 0, 0], share: 0.25, density: 0.002, floor: 7 });
  assert.deepEqual([s.share, s.density, s.floor], [0.25, 0.002, 7], 'a jump snaps');
  const u = hazeUniforms(s);
  assert.ok(near(u[0], 0.25 * 0.002) && u[1] === 7 && near(u[2], 1 / JUNGLE_HAZE.falloff) && u[3] === JUNGLE_HAZE.start && u[4] === 1);
  assert.equal(hazeUniforms({ ...s, share: 0 })[4], 0, 'no share: off');
  assert.ok(near(hazeDensityAt(u, 7 + JUNGLE_HAZE.falloff), 0.25 * 0.002 * Math.exp(-1), 1e-9), 'a falloff over the floor: e less');
  // the clock: thickest at dawn, thinnest in the afternoon, round the clock
  const day = [0, 3, 6.5, 9, 13, 16, 20, 24].map(hazeDayFactor);
  assert.equal(Math.max(...day), hazeDayFactor(6.5));
  assert.equal(Math.min(...day), hazeDayFactor(13));
  assert.equal(hazeDayFactor(24), hazeDayFactor(0));
  assert.ok(near(hazeDayFactor(25.5), hazeDayFactor(1.5)));
  assert.ok(hazeWeatherFactor('rain') > hazeWeatherFactor('cloudy') && hazeWeatherFactor('cloudy') > hazeWeatherFactor('sunny') && hazeWeatherFactor('nonsense') === 1);
  // the banks drift: a factor within its amplitude, moving with time along the wind
  const at = [0, 1, 2, 3].map((k) => hazeDrift(1000, 2000, k * 120, [1, 0]));
  assert.ok(at.every((v) => v >= 1 - JUNGLE_HAZE.drift.amp - 1e-9 && v <= 1 + JUNGLE_HAZE.drift.amp + 1e-9) && new Set(at.map((v) => v.toFixed(6))).size > 2);
  assert.ok(near(hazeDrift(1000, 2000, 100, [5, 0]), hazeDrift(1000 - JUNGLE_HAZE.drift.speed * 100, 2000, 0, null)), 'blown along the wind\'s way, at its own pace (not the wind\'s)');
  // the colour
  const fog = Float32Array.from([0.62, 0.7, 0.8]);
  const hc = hazeColorOf(fog);
  const lum = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  assert.ok(near(lum(hc), lum(fog), 0.02) && hc[1] > hc[0] && hc[1] > hc[2], 'humid: its brightness kept, leaned to green');
  const row = { mode: 'linear', density: 0, start: 0, end: 4000 };
  assert.deepEqual(Array.from(fogColorWith(fog, row, Float32Array.from([0, 0, 1, 8, 0, 0, 0, 0]), 1.7)), Array.from(fog), 'no haze: the weather\'s exactly');
  const thick = fogColorWith(fog, row, Float32Array.from([0.006, 40, 1 / 90, 8, 1, 0, 0, 0]), 1.7), thin = fogColorWith(fog, row, Float32Array.from([0.0003, 40, 1 / 90, 8, 1, 0, 0, 0]), 1.7);
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  assert.ok(dist(thick, hc) < dist(thin, hc) && dist(thin, fog) < dist(thick, fog), 'the thicker the haze, the more its colour');
  const sky = hazeSkyUniform(thick, Float32Array.from([0.006, 40, 1 / 90, 8, 1, 0, 0, 0]), 1.7);
  assert.ok(near(sky[3], hazeColumn(Float32Array.from([0.006, 40, 1 / 90, 8, 1, 0, 0, 0]), 1.7), 1e-6) && sky[0] === thick[0]);
  assert.ok(hazeShare(-JUNGLE_HAZE.edge.out) === 0 && hazeShare(JUNGLE_HAZE.edge.in) === 1 && JUNGLE_HAZE.edge.out > JUNGLE_EDGE.out, 'the haze drifts out past the last trees');
});

/** A stream's state over a map of 24 x 16 with Bantha a block - for the host. */
function hostWorld() {
  const W = 24, H = 16, inside = (x, y) => x >= 6 && x < 14 && y >= 4 && y < 11;
  const maps = { getRegionIndexAt: (x, y) => (inside(x, y) ? 10 : 3) };
  const state = { mapOrigin: { x: 9, y: 5 }, compensation: [0, 0, 0], pixelTranslation: (px, py, out = [0, 0, 0]) => { out[0] = (px - 9) * PIXEL_M; out[1] = 0; out[2] = -(py - 5) * PIXEL_M; return out; } };
  const built = new Map();
  const sent = [], skies = [];
  const renderer = { _focus: new Float32Array(4), setJungleHaze: (u) => sent.push(u ? Array.from(u) : null) };
  const sky = { setHazeSky: (v) => skies.push(v ? Array.from(v) : null) };
  const host = createJungleHost({ renderer, maps, mapWidth: W, mapHeight: H, stateOf: () => state, builtOf: () => built, heightAt: () => 10, trees: { door: true } });
  return { host, sent, skies, sky, built, state };
}

test('BANTHA1 the jungle\'s host: the terrain job a pixel\'s 3x3 of distances where the jungle can reach and none past it; the frame\'s haze set inside Bantha - the renderer\'s uniforms, the sky\'s, the frame\'s fog colour weighed with it - and taken off outside it; the cull asks the haze sent (mutants: the haze measured from the wrong pixel; the colour left the weather\'s)', () => {
  const { host, sent, skies, sky } = hostWorld();
  assert.deepEqual(host.job(9, 7, true).nine.length, 9);
  assert.equal(host.job(9, 7, true).hidden, true);
  assert.equal(host.job(23, 0), null, 'nowhere near');
  // a scene point's pixel: x east, z north (the map's rows count south) - the eye's pixel (9, 5) is inside, two north (9, 3)
  // outside, two south (9, 7) inside, five east (14, 5) outside
  assert.ok(host.depthAt(400, 400) > 0 && host.depthAt(400, 400 - 2 * PIXEL_M) > 0);
  assert.ok(host.depthAt(400, 400 + 2 * PIXEL_M) < 0 && host.depthAt(400 + 5 * PIXEL_M, 400) < 0);
  // ...and the depth is the field's read IN that pixel, at the point's place in it - the block's middle row (9, 7) the
  // deepest and (9, 8) under it shallower again, which no read off another pixel's 3x3 reaches
  const ref = jungleField({ width: 24, height: 16, regionAt: (x, y) => (x >= 6 && x < 14 && y >= 4 && y < 11 ? 10 : 3) });
  for (const [x, z] of [[400, 400 - 3 * PIXEL_M], [400 + 2 * PIXEL_M, 400 - 4 * PIXEL_M], [-300, 100], [700, 400 - 2 * PIXEL_M]]) {
    const px = 9 + Math.floor(x / PIXEL_M), py = 5 - Math.floor(z / PIXEL_M);
    const lx = x - (px - 9) * PIXEL_M, lz = z + (py - 5) * PIXEL_M;
    assert.ok(lx >= 0 && lx < PIXEL_M && lz >= 0 && lz < PIXEL_M);
    assert.ok(near(host.depthAt(x, z), jungleDepthAt(px, py, jungleNine(ref, px, py), lx, lz), 1e-6), `(${x}, ${z}) read in pixel (${px}, ${py})`);
  }
  const fogColor = Float32Array.from([0.62, 0.7, 0.8]), fogRow = { mode: 'linear', density: 0, start: 0, end: 4000 };
  const frame = (eye) => host.haze({ fogColor, fogRow, eye, dt: 0.016, minute: 13 * 60, weather: 'sunny', wind: null, sky });
  const inside = frame([400, 11.7, 400]);   // the middle of pixel (9, 5) - deep in the block
  assert.equal(sent.at(-1)[4], 1, 'on');
  assert.ok(near(sent.at(-1)[1], 10 + JUNGLE_HAZE.layer, 1e-4), 'its floor the canopy over the ground');
  assert.ok(sent.at(-1)[0] > JUNGLE_HAZE.density * 0.5, 'its density the jungle\'s');
  assert.notDeepEqual(Array.from(inside), Array.from(fogColor), 'the frame\'s colour the haze\'s');
  assert.ok(skies.at(-1)[3] > 0 && near(skies.at(-1)[0], inside[0]), 'the sky\'s the same colour');
  assert.ok(host.hides([4000, 0, -10, 4100, 15, 10], [0, 0, 0]), 'the low ground 4 km off is hidden');
  assert.ok(!host.hides([0, 0, 0, 50, 15, 50], [400, 0, 400]), 'the ground under the eye is not');
  for (let i = 0; i < 3; i++) frame([-6 * PIXEL_M, 11.7, 400]);   // pixel (3, 5): far west of the block - a jump, then out
  assert.equal(sent.at(-1), null, 'outside: off');
  assert.equal(skies.at(-1), null);
  assert.ok(!host.hides([4000, 0, -10, 4100, 15, 10], [0, 0, 0]), 'no haze, nothing hidden');
  const clear = createJungleHost({ renderer: { _focus: new Float32Array(4), setJungleHaze: (u) => sent.push(u) }, maps: { getRegionIndexAt: () => 10 }, mapWidth: 4, mapHeight: 4, stateOf: () => ({ mapOrigin: { x: 0, y: 0 }, compensation: [0, 0, 0], pixelTranslation: (px, py, o = [0, 0, 0]) => o }), builtOf: () => new Map(), heightAt: () => 0, haze: false, trees: { door: true } });
  assert.equal(clear.haze({ fogColor, fogRow, eye: [1, 1, 1], dt: 0.016, minute: 0, weather: 'rain', sky }), fogColor, '?junglehaze=off: the jungle under clear air');
  assert.equal(sent.at(-1), null);
});

/** A recording fake GL (lpt1_lowpolytrees's shape). */
function recordingGl() {
  const calls = [];
  let ids = 0;
  const consts = { TEXTURE0: 33984, TEXTURE1: 33985, TEXTURE_2D: 3553, TEXTURE_2D_ARRAY: 35866 };
  const gl = new Proxy({}, {
    get(_, k) {
      if (k in consts) return consts[k];
      if (k === 'getProgramParameter' || k === 'getShaderParameter') return () => true;
      if (k === 'getUniformLocation') return (_p, n) => n;
      if (k === 'getAttribLocation') return () => 0;
      if (typeof k === 'string' && k.startsWith('create')) return () => ({ id: ++ids });
      if (k === 'getParameter') return () => new Float32Array(4);
      if (typeof k === 'string' && k.toUpperCase() === k) return k;
      return (...args) => { calls.push([k, ...args.map((a) => (ArrayBuffer.isView(a) ? Array.from(a) : a))]); };
    },
  });
  return { gl, calls, canvas: { getContext: () => gl, clientWidth: 320, clientHeight: 200, width: 320, height: 200 } };
}
const R3 = new Float32Array([1, 0, 0]), UP = new Float32Array([0, 1, 0]);
const PROJ = mirrorProjectionX(perspective(Math.PI / 3, 1.6, 0.1, 4000));
const VIEW = lookAt([0, 1.7, 9], [0, 1.2, -4], [0, 1, 0]);
const run = (n) => ({ run: null, scale: [1, 1, 1], size: [3, 9], sway: 0, drawStart: 0, drawCount: n, subs: [{ offset: 0, count: 6, tex: { id: 'leaf' }, alpha: 1, color: [1, 1, 1], cull: 0 }] });

test('BANTHA1 the renderer\'s two tree slots: Low Poly Trees\' frame and the jungle\'s each drawn, each with its own buffers; a far picture gives way to its OWN slot\'s trees at that slot\'s radius, and one no slot draws stands whole; both spent in the call (mutants: one slot drawn; the first slot\'s radius for every picture; the slots never spent)', () => {
  const { calls, canvas } = recordingGl();
  const r = new Renderer(canvas);
  r.textures.set('504_12#lpt', { id: 'lptFar' }); r.textures.set('500_jungle-fig#lpt', { id: 'jungleFar' }); r.textures.set('500_13', { id: 'flat' });
  const a = { key: 'lpt' }, b = { key: 'jungle' };
  const lptFar = r.createBillboardBatch(504, '12#lpt', { w: 4, h: 8 }, [[0, 0, -3]], { scales: [0.7] }); lptFar.lptProto = a;
  const jFar = r.createBillboardBatch(500, 'jungle-fig#lpt', { w: 20, h: 30 }, [[2, 0, -6]], { scales: [0.6] }); jFar.lptProto = b;
  const plain = r.createBillboardBatch(500, 13, { w: 1, h: 2 }, [[1, 0, -4]]);
  const gpu = (id) => ({ vao: { id }, pointInstances: (at) => calls.push(['pointInstances', id, at]) });
  const fa = { eye: [1, 2, 3], radius: 140, band: 20, gpu: gpu('lptVao'), cut: new Set([a]), runs: [run(2)] };
  const fb = { eye: [1, 2, 3], radius: 155, band: 25, gpu: gpu('jungleVao'), cut: new Set([b]), runs: [run(3)] };
  r.beginFrame(PROJ, VIEW, new Float32Array([0.3, 0.8, 0.2]), WORLD_FRAME);
  r.setLowPolyTrees(fa); r.setLowPolyTrees(fb, 1);
  calls.length = 0;
  r.drawBillboards([plain, lptFar, jFar], R3, UP);
  const vaos = calls.filter((c) => c[0] === 'bindVertexArray' && typeof c[1]?.id === 'string' && c[1].id.endsWith('Vao')).map((c) => c[1].id);
  assert.deepEqual(vaos, ['lptVao', 'jungleVao'], 'each slot\'s own buffers, Low Poly Trees\' first');
  assert.deepEqual(calls.filter((c) => c[0] === 'drawElementsInstanced').map((c) => c[5]), [2, 3]);
  const cuts = calls.filter((c) => c[0] === 'uniform4f' && c[1] === 'uLptCut').map((c) => c[5]);
  assert.ok(cuts.includes(140) && cuts.includes(155), 'each picture its own slot\'s radius');
  // ...read at each picture's own draw: the texture it binds and the cut standing when it draws
  const atDraw = {};
  let tex = null, cut = 0;
  for (const c of calls) {
    if (c[0] === 'bindTexture' && ['lptFar', 'jungleFar', 'flat'].includes(c[2]?.id)) tex = c[2].id;
    else if (c[0] === 'uniform4f' && c[1] === 'uLptCut') cut = c[5];
    else if (c[0] === 'drawElements') atDraw[tex] = cut;
  }
  assert.deepEqual(atDraw, { flat: 0, lptFar: 140, jungleFar: 155 }, 'the plain flat whole, Low Poly Trees\' picture at its slot\'s 140, the jungle\'s at its own 155');
  const bands = calls.filter((c) => c[0] === 'uniform1f' && c[1] === 'uLptBand').map((c) => c[2]);
  assert.ok(bands.includes(20) && bands.includes(25), '...and band');
  calls.length = 0;
  r.drawBillboards([jFar], R3, UP);
  assert.equal(calls.filter((c) => c[0] === 'drawElementsInstanced').length, 0, 'spent');
  assert.ok(!calls.some((c) => c[0] === 'uniform4f' && c[1] === 'uLptCut' && c[5] > 0), 'a picture no slot draws stands whole');
});

test('BANTHA1 the haze reaches every program: the frame\'s, armed by setJungleHaze - uploaded with the fog, to the mesh program at once - and cleared by the next beginFrame no setJungleHaze armed; a sprite drawn off the world borrows it off and gives it back (mutants: the arming ignored; the upload left out of the fog\'s; never sent off; sent every frame)', () => {
  const { calls, canvas } = recordingGl();
  const r = new Renderer(canvas);
  const u = Float32Array.from([0.005, 30, 1 / 90, 8, 1, 0, 0, 0]);
  r.setJungleHaze(u);
  assert.ok(calls.some((c) => c[0] === 'uniform4fv' && c[1] === 'uHaze' && c[2][4] === 1), 'the mesh program at once');
  calls.length = 0;
  r.beginFrame(PROJ, VIEW, new Float32Array([0.3, 0.8, 0.2]), WORLD_FRAME);
  assert.ok(calls.some((c) => c[0] === 'uniform4fv' && c[1] === 'uHaze' && c[2][4] === 1), 'armed: kept by the frame it was set for, sent with its fog');
  calls.length = 0;
  r.beginFrame(PROJ, VIEW, new Float32Array([0.3, 0.8, 0.2]), WORLD_FRAME);
  assert.equal(r._haze[4], 0, 'the next frame no host armed: gone (an interior, a dungeon, a panel)');
  assert.ok(calls.some((c) => c[0] === 'uniform4fv' && c[1] === 'uHaze' && c[2][4] === 0), 'and sent off, once, to a program that held it on');
  calls.length = 0;
  r.beginFrame(PROJ, VIEW, new Float32Array([0.3, 0.8, 0.2]), WORLD_FRAME);
  assert.ok(!calls.some((c) => c[1] === 'uHaze'), 'then never again while it stays off - a frame outside the jungle pays no call');
  r.setJungleHaze(u);
  const stamp = r._frameStamp;
  r.setJungleHaze(null); r.setJungleHaze(null);
  assert.equal(r._frameStamp, stamp + 1, 'off once, then nothing moves');
  const src = text('src/render/renderer.js');
  for (const borrow of src.split('this._fogMode = 0; this._dwFog[0] = 0;').slice(1)) assert.match(borrow.slice(0, 20), /^ this\._haze\[4\] = 0;/, 'every sprite\'s borrow takes the haze off with the fogs');
});

test('BANTHA1 the jungle\'s door: Low Poly Trees\' own over the owner\'s files - read once, each species a prototype, its far picture uploaded under the rainforest\'s archive and sized for the tallest emergent, its frame on the renderer\'s slot 1 (mutants: the slot 0; the scale ceiling Low Poly Trees\')', async () => {
  const uploads = [], frames = [], { gl } = recordingGl();
  const renderer = {
    gl, uploadTexture: (a, rec, c) => uploads.push([a, rec, c.width, c.height]), releaseTexture: () => {}, setLowPolyTrees: (f, slot) => frames.push([f, slot]),
    createAtlasTexture: (w, h, levels) => ({ w, h, levels }), uploadAtlasRows: () => {}, releaseAtlasTexture: () => {},
  };
  const byUrl = new Map(Object.entries(JUNGLE_URLS).map(([name, url]) => [url, name]));
  let fetched = 0;
  const door = createJungleTrees({
    renderer, breathe: async () => {}, warn: (m) => assert.fail(m), now: () => 0,
    fetchBytes: async (url) => { fetched++; return new Uint8Array(readFileSync(join(ROOT, SRC, byUrl.get(url)))); },
    decode: async (bytes) => { const p = PNG.sync.read(Buffer.from(bytes)); return { width: p.width, height: p.height, data: new Uint8Array(p.data) }; },
  });
  await Promise.all([door.load(), door.load()]);
  assert.equal(fetched, 15, 'every file once');
  assert.equal(door.loaded, true);
  const p = door.proto(2);
  assert.equal(p.key, '500_jungle-fig');
  const h = await door.farPicture(p);
  assert.deepEqual([h.archive, h.record], [500, 'jungle-fig#lpt']);
  const pic = renderImpostor(door._lpt, p, (n) => picture(door._lpt.atlases[n].picture));
  assert.ok(near(h.size.h, p.size.h * pic.shareH * JUNGLE_SCALE_MAX, 1e-9) && JUNGLE_SCALE_MAX === JUNGLE.emergentScale[1], 'sized for the tallest emergent');
  assert.deepEqual(uploads.at(-1).slice(0, 2), [500, 'jungle-fig#lpt']);
  const set = { ox: 0, oy: 0, oz: 0, handles: [h], ...buildTreeSet(PX, PY, [{ h: 0, centers: [[0, 0, 5]], wild: null, own: Float32Array.of(1.3) }]) };
  assert.equal(set.trees[4], Math.fround(1.3), 'the layout\'s own scale, not DFU\'s variety');
  door.frame([set], 0, 0, 0, { stamp: 1 });
  const [f, slot] = frames.at(-1);
  assert.equal(slot, 1);
  assert.ok(f.cut.has(h) && f.runs[0].drawCount === 1);
});

test('BANTHA1 the hosts: world.js builds the jungle\'s host behind its switch and the trees\' host with it, hands the pixel build the jungle, sets the haze before the fog and takes its colour, culls a pixel the haze hides whole, and hands the far ring the haze; the pixel build asks the kernel for the jungle and stands its trees as far pictures held by the pixel, Logging\'s and cover\'s; the kernel lays the jungle over the pixel\'s own layout (THE FOUR HOSTS: exterior.js, worldModes.js and dungeonContext.js stand no wilderness - FLAGGED in scenes/jungleHost.js)', () => {
  const w = hostText('src/scenes/world.js'), pb = text('src/scenes/pixelBuild.js'), tg = text('src/world/terrain/terrainGen.js'), jh = text('src/scenes/jungleHost.js');
  assert.match(w, /const jungle = jungleOn\(\) \? createJungleHost\(\{[^\n]*haze: jungleHazeOn\(\) \}\) : null;/);
  assert.match(w, /const trees = createTreesHost\(\{[^\n]*jungle, breathe: \(\) => breather\.breathe\(\), yards: \(\) => yards \}\);/);
  assert.match(w, /jungle, lowPolyTrees, maps, modelFeetOf/, 'the pixel build has the jungle');
  const fogAt = w.indexOf('const fogColor = jungle ? jungle.haze({ fogColor: sky.fogColorFor(fogNow), fogRow: fogNow, eye: cam.pos, dt, minute, weather, wind: wd.on ? wd.windV : null, sky }) : sky.fogColorFor(fogNow);');
  assert.ok(fogAt > 0 && w.indexOf('renderer.setFog(fogNow.mode,', fogAt) - fogAt < 600, 'the haze, then the fog with its colour');
  assert.match(w, /const pixelVisible = !cullOn \|\| !\(aabbOutside\(_planes, p\._box, t\[0\], t\[1\], t\[2\]\) \|\| jungle\?\.hides\(p\._box, t\)\);/);
  assert.match(w, /haze: renderer\._haze, hazeEye: jungle\?\.eye/, 'the far ring');
  assert.match(pb, /jungle: jungle \? jungle\.job\(px, py, FOREST_HIDDEN_LOCATION_TYPES\.has\(dfLocation\?\.mapTableData\?\.locationType\)\) : null,/);
  assert.match(pb, /jungle\.door\.acquire\(far\); jungleHandles\.push\(far\);/);
  assert.match(pb, /made\.jungleHandles = jungleHandles;/, 'BUILD-FAIL1\'s ledger');
  assert.match(pb, /forestGroups\.set\(gk, \{ batch, centers: g\.centers, size: far\.size, scales \}\);/, 'Logging fells it');
  assert.match(pb, /coverItems\.push\(\.\.\.jungleCover\(c, species, own\[i\]\)\)/, 'cover');
  assert.match(pb, /jungleTree \? JUNGLE_MEASURES\[f\.jungle\]\.foot \* f\.js : natureReach/, 'the road keeps clear of its foot');
  assert.match(pb, /jungleTrees: jungleSet\.length \? \{ px, py, ox: 0, oy: 0, oz: 0, handles: jungleHandles, groups: jungleSet, trees: null, centers: null \} : null,/);
  assert.match(tg, /const nature = withJungle\(layoutNature\(samples, tilemap, natureOpts\), samples, tilemap,\n\s+\{ \.\.\.natureOpts, jungle: jungle \? \{ nine: jungle\.nine, pois: placesFor\(jungle\.hidden\), paths \} : null \}\);/);
  assert.match(jh, /scenes\/dungeonContext\.js \(dungeons\) - FLAGGED: none stands the wilderness the jungle grows in/);
});

test('BANTHA1 the switch: the Jungle of Bantha row on the enhanced skin, on by default; `?jungle=off` the kill door offline; online the room\'s - its trees are where Logging\'s stand; `?junglehaze=off` the haze\'s door', () => {
  const skin = uiSkin(); const pref = PREF_DEFAULTS.banthaJungle;
  assert.equal(pref, true, 'on by default');
  try {
    setUiSkin('enhanced'); setPref('banthaJungle', true);
    assert.equal(jungleOn(''), true);
    assert.equal(jungleOn('?jungle=off'), false, 'the kill door');
    setPref('banthaJungle', false);
    assert.equal(jungleOn(''), false, 'the row is the switch');
    assert.equal(jungleOn('?online=1'), true, 'online: the room\'s jungle');
    setPref('banthaJungle', true); setUiSkin('classic');
    assert.equal(jungleOn(''), false, 'offline, the classic skin keeps DFU\'s rainforest');
    assert.equal(jungleOn('?online=1&jungle=off'), true);
  } finally { setUiSkin(skin); setPref('banthaJungle', pref); }
  assert.equal(onlineForcedPref('banthaJungle', '?online=1'), true);
  assert.equal(jungleHazeOn(''), true);
  assert.equal(jungleHazeOn('?junglehaze=off'), false);
  const row = FEATURES.find((f) => f.id === 'bantha-jungle');
  assert.deepEqual(checkFeature(row), []);
  assert.deepEqual({ ...row.control }, { store: 'prefs', key: 'banthaJungle', initial: true, online: true });
  assert.equal(STREAMING_TERRAIN_SCALE, 1.25, '(the beach line in metres the species read is the kernel\'s own scale)');
});
