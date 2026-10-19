// PRECIP4 (2026-10-19, the owner: "the transition should be seamless both in ground texture and everything else"): THE
// SNOW ON THE GROUND - the terrain programs' chunk (render/snowCoverGlsl.js) run through test/glsl.mjs against the law
// (systems/weather/snowpack.js), the renderer's draw and its twin sets, the host about the player (scenes/snowCoverHost.js)
// and its wiring: the builds' seasons (scenes/pixelBuild.js), the world's draws, its re-skin, its grass and its feet.
// bible/07-Rendering/Biome-Precipitation.md is the record.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { glslFunctions } from '../glsl.mjs';
import { snowCoverGlsl, SNOW_GROUND, TWIN_LAYERS } from '../../src/render/snowCoverGlsl.js';
import { ecotoneGlsl } from '../../src/render/ecotoneGlsl.js';
import { coverAtHeight, SNOWPACK, levelAltitude } from '../../src/systems/weather/snowpack.js';
import { createSnowCoverHost, SNOW_COVER, twinKey, flatDraw } from '../../src/scenes/snowCoverHost.js';
import { SEASON } from '../../src/world/climateSwaps.js';
import { ecoOrigin } from '../../src/world/ecotone.js';
import { SEA_LEVEL_M } from '../../src/systems/weather/airTemperature.js';
import * as RENDER from '../../src/render/renderer.js';
import { EL_TERRAIN_FS } from '../../src/render/enhancedLighting.js';

const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} vs ${b}`);
const read = (p) => readFileSync(p, 'utf8');
const PIX = 819.2;
/** The chunk with the ecotone's before it (it reads its weights), bound for one pixel. */
const chunk = (u) => glslFunctions('uniform highp sampler2DArray uTileArr;\n' + ecotoneGlsl('') + snowCoverGlsl(''), {
  uEcoSide: [0, 0, 0, 0], uEcoCorner: [0, 0, 0, 0], uEcoOrigin: [0, 0, 0], uSnowEco: [0, 0, 0], uSnowTile: [1280, 2048],
  uSnowH10: [0, 0, 0, 0], uSnowH50: [0, 0, 0, 0], uSnowH90: [0, 0, 0, 0], uSnowSet: [0, 1, TWIN_LAYERS, 0],
  textureGrad: (smp, tl) => (tl[2] >= TWIN_LAYERS ? [1, 1, 1, 1] : [0.2, 0.4, 0.1, 1]),
  ...u,
});

test('PRECIP4 THE CHUNK READS THE LAW: snowAtHeight is snowpack.js coverAtHeight term for term (mutants: a piece\'s slope; the ends\' quarter span)', () => {
  const f = chunk({});
  let seed = 3; const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 400; i++) {
    const h50 = rnd() * 3000 - 500, line = [h50 - rnd() * 400, h50, h50 + rnd() * 400];
    for (const h of [line[0] - 300, line[0] - 20, line[0], (line[0] + line[1]) / 2, line[1], line[2] - 1, line[2] + 30, line[2] + 900]) {
      near(f.snowAtHeight(line, h), coverAtHeight(line, h), 1e-9, `line ${line.map((v) => v.toFixed(0))} at ${h.toFixed(0)}`);
    }
  }
});

test('PRECIP4 THE FRAGMENT\'S COVER: its snowline read between the pixel\'s corners (each corner its own at its own corner), its height against it; a steep face shed; a thin cover broken into patches while a bare one stays bare and a whole one whole (mutants: the corners swapped; the slope unread; the patches over a whole cover)', () => {
  const up = [0, 1, 0];
  const f = chunk({ uSnowH10: [100, 200, 300, 400], uSnowH50: [150, 250, 350, 450], uSnowH90: [180, 280, 380, 480] });
  // at each corner, the corner's own line: its 50 % height reads (before the patches) half
  for (const [k, lx, lz] of [[0, 0, 0], [1, PIX, 0], [2, 0, PIX], [3, PIX, PIX]]) {
    near(f.snowAtHeight([[100, 200, 300, 400][k], [150, 250, 350, 450][k], [180, 280, 380, 480][k]], [150, 250, 350, 450][k]), 0.5, 1e-9, `corner ${k}`);
    assert.equal(f.snowCover([lx, lz], [180, 280, 380, 480][k] + 200, up), 1, `whole over corner ${k}`);
    assert.equal(f.snowCover([lx, lz], [100, 200, 300, 400][k] - 200, up), 0, `bare under corner ${k}`);
  }
  // each corner reads its own line and no other: a height whole over one corner's and under the next's
  const k = chunk({ uSnowH10: [100, 600, 1100, 1600], uSnowH50: [150, 650, 1150, 1650], uSnowH90: [180, 680, 1180, 1680] });
  for (const [c, lx, lz] of [[0, 0, 0], [1, PIX, 0], [2, 0, PIX], [3, PIX, PIX]]) {
    assert.equal(k.snowCover([lx, lz], 180 + 500 * c + 20, up), 1, `whole over corner ${c}'s own`);
    assert.equal(k.snowCover([lx, lz], 100 + 500 * c - 40, up), 0, `bare under corner ${c}'s own`);
  }
  // the middle reads the corners' mean
  assert.equal(f.snowCover([PIX / 2, PIX / 2], 380, up), 1);
  assert.equal(f.snowCover([PIX / 2, PIX / 2], 200, up), 0);
  // a steep face sheds it
  assert.equal(f.snowCover([0, 0], 2000, [0.6, 0.5, 0]), 0, 'a cliff bare');
  near(f.snowCover([0, 0], 2000, [0, SNOW_GROUND.slope[1], 0]), 1, 1e-9, 'a gentle slope whole');
  // half a cover is about half the ground, in patches - one line over the whole pixel
  const g = chunk({ uSnowH10: [100, 100, 100, 100], uSnowH50: [150, 150, 150, 150], uSnowH90: [180, 180, 180, 180] });
  let white = 0, n = 0;
  for (let i = 0; i < 40; i++) for (let j = 0; j < 40; j++) { white += g.snowCover([i * 20.3 + 1, j * 20.3 + 1], 150, up); n++; }
  assert.ok(white / n > 0.3 && white / n < 0.7, `half the ground: ${(white / n).toFixed(2)}`);
  let mixed = 0;
  for (let i = 0; i < 400; i++) { const c = g.snowCover([i * 2.1, 3], 150, up); if (c > 0.05 && c < 0.95) mixed++; }
  assert.ok(mixed < 140, `patches, not a grey wash: ${mixed} of 400 between`);
});

test('PRECIP4 THE PATCHES ARE THE WORLD\'S: a pixel\'s east edge and its east neighbour\'s west edge read the same noise (the lattice is the world tile\'s) (mutants: the origin unread)', () => {
  const [ox, oz] = ecoOrigin(200, 100), [ex] = ecoOrigin(201, 100);
  const a = chunk({ uSnowTile: [ox, oz] }), b = chunk({ uSnowTile: [ex, oz] });
  for (let z = 1; z < 800; z += 37) {
    for (const k of [0, 1, 2]) near(a.snowNoise([128, z / 6.4], SNOW_GROUND.patch[k].cell, SNOW_GROUND.salt + k), b.snowNoise([0, z / 6.4], SNOW_GROUND.patch[k].cell, SNOW_GROUND.salt + k), 1e-12, `cell ${k} at ${z}`);
  }
});

test('PRECIP4 THE GROUND\'S TEXEL: off, the bare texel; on, the pixel\'s own winter record of the same tile (its twin\'s layers on) in the cover\'s share; a set with no winter of its own bare under any cover; at a border each neighbour\'s winter by the ecotone\'s own weights (mutants: the twin offset dropped; the neighbours\' winter unshifted; the switch unread)', () => {
  const up = [0, 1, 0], tl = [0.3, 0.6, 7];
  const all = { uSnowH10: [-900, -900, -900, -900], uSnowH50: [-800, -800, -800, -800], uSnowH90: [-700, -700, -700, -700] };
  const seen = [];
  const on = chunk({ ...all, textureGrad: (smp, t) => { seen.push([smp, t[2]]); return t[2] >= TWIN_LAYERS ? [1, 1, 1, 1] : [0, 0, 0, 1]; } });
  assert.deepEqual(on.snowGround([0.1, 0.2, 0.3], [400, 400], 0, up, tl, [0, 0], [0, 0]), [1, 1, 1], 'whole: the winter record');
  assert.deepEqual(seen, [['uTileArr', 7 + TWIN_LAYERS]], 'its own twin, the same record');
  const off = chunk({ ...all, uSnowSet: [0, 0, TWIN_LAYERS, 0] });
  assert.deepEqual(off.snowGround([0.1, 0.2, 0.3], [400, 400], 0, up, tl, [0, 0], [0, 0]), [0.1, 0.2, 0.3], 'off');
  const desert = chunk({ ...all, uSnowSet: [0, 1, 0, 0], textureGrad: () => [0.9, 0.7, 0.4, 1] });
  assert.deepEqual(desert.snowGround([0.9, 0.7, 0.4], [400, 400], 0, up, tl, [0, 0], [0, 0]), [0.9, 0.7, 0.4], 'a set with no winter: its own texel');
  // a border: the west neighbour's set on uEcoArr1, its twin shifted; at the seam the winter texel is half each
  const border = chunk({
    ...all, uEcoSide: [1, 0, 0, 0], uEcoCorner: [1, 0, 1, 0], uEcoOrigin: [...ecoOrigin(200, 100), 1], uSnowEco: [TWIN_LAYERS, 0, 0],
    textureGrad: (smp, t) => (smp === 'uEcoArr1' ? (t[2] >= TWIN_LAYERS ? [0, 0, 1, 1] : [0, 0, 0.5, 1]) : t[2] >= TWIN_LAYERS ? [1, 0, 0, 1] : [0.5, 0, 0, 1]),
  });
  let checked = 0;
  for (let x = 0; x < 200; x += 1.7) {
    const w = border.ecoWeights([x, 400]);
    const g = border.snowGround([0, 0, 0], [x, 400], 0, up, tl, [0, 0], [0, 0]);
    near(g[0], w[0], 1e-9, `its own winter by its weight at ${x}`); near(g[2], w[1], 1e-9, `the neighbour's winter by its at ${x}`);
    if (w[1] > 0.1 && w[0] > 0.1) checked++;
  }
  assert.ok(checked > 0, 'a seam in the band');
});

test('PRECIP4 BOTH TERRAIN PROGRAMS: the chunk once each, decoding as its program decodes, the snow drawn right after the border and before the water bed; the ecotone\'s weights one function both read (mutants: the call dropped from either; the lane\'s winter undecoded)', () => {
  const r = read('src/render/renderer.js');
  const classic = r.slice(r.indexOf('const TERRAIN_FS = `'), r.indexOf('}`;', r.indexOf('const TERRAIN_FS = `')));
  for (const [name, fs, decode] of [['classic', classic, ''], ['lane', EL_TERRAIN_FS, 'elDecode']]) {
    assert.equal(fs.split('vec3 snowGround(').length - 1, name === 'lane' ? 1 : 0, `${name}: the chunk built in`);
    assert.match(fs, /tex = ecotone\(tex, vLocalXZ, vec3\(tuv, float\(layer\)\), gx, gy\);[^\n]*\n {2}tex = snowGround\(tex, vLocalXZ, vWorldPos\.y, normalize\(vNormal\), vec3\(tuv, float\(layer\)\), gx, gy\);/, `${name}: after the border`);
    assert.ok(fs.indexOf('tex = snowGround(') < fs.indexOf('waterBed') || !fs.includes('waterBed'), `${name}: before the bed`);
    if (decode) assert.match(fs, /vec3 white = elDecode\(textureGrad\(uTileArr, vec3\(tl\.xy, tl\.z \+ uSnowSet\.z\), gx, gy\)\.rgb\);/, 'the lane decodes its winter');
  }
  assert.match(classic, /\$\{snowCoverGlsl\(\)\}/);
  assert.match(read('src/render/enhancedLighting.js'), /\$\{snowCoverGlsl\('elDecode'\)\}/);
  assert.match(ecotoneGlsl(''), /vec4 ecoWeights\(vec2 local\) \{/);
  assert.match(ecotoneGlsl(''), /vec4 w = ecoWeights\(local\);\n {2}if \(w\.x >= 1\.0\) return own;/);
});

/** A recording GL: every call by name, uniforms by their location's name, binds by unit, framebuffer binds by target. */
function recordingGl() {
  const log = [];
  let unit = 0, ids = 0;
  const enums = new Map();
  const bound = new Map();
  let scissor = true;
  const gl = new Proxy({}, {
    get(_, k) {
      if (typeof k !== 'string') return undefined;
      if (k === 'drawingBufferWidth') return 320;
      if (k === 'drawingBufferHeight') return 200;
      if (k.toUpperCase() === k) { if (!enums.has(k)) enums.set(k, 0x9000 + enums.size); return enums.get(k); }
      switch (k) {
        case 'getProgramParameter': case 'getShaderParameter': return () => true;
        case 'getAttribLocation': return () => 0;
        case 'getParameter': return (p) => (p === enums.get('READ_FRAMEBUFFER_BINDING') || p === enums.get('DRAW_FRAMEBUFFER_BINDING') ? bound.get(p) ?? { id: 'screen' } : new Float32Array(4));
        case 'getExtension': return () => null;
        case 'getUniformLocation': return (p, name) => ({ name });
        case 'isEnabled': return (cap) => (cap === enums.get('SCISSOR_TEST') ? scissor : false);
        case 'enable': return (cap) => { if (cap === enums.get('SCISSOR_TEST')) scissor = true; log.push({ k, cap }); };
        case 'disable': return (cap) => { if (cap === enums.get('SCISSOR_TEST')) scissor = false; log.push({ k, cap }); };
        case 'activeTexture': return (u) => { unit = u - enums.get('TEXTURE0'); };
        case 'bindTexture': return (target, tex) => { log.push({ k, unit, target, tex }); };
        case 'bindFramebuffer': return (target, fb) => { log.push({ k, target, fb }); bound.set(target === enums.get('READ_FRAMEBUFFER') ? enums.get('READ_FRAMEBUFFER_BINDING') : enums.get('DRAW_FRAMEBUFFER_BINDING'), fb); };
        default:
          if (k.startsWith('create')) return () => ({ id: ++ids });
          if (k.startsWith('uniform')) return (loc, ...args) => { log.push({ k, name: loc?.name, args: args.map((a) => (ArrayBuffer.isView(a) ? Array.from(a) : a)) }); };
          return (...args) => { log.push({ k, args }); };
      }
    },
  });
  return { gl, log, enums, canvas: { getContext: () => gl, clientWidth: 320, clientHeight: 200, width: 320, height: 200 } };
}
const I = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

test('PRECIP4 THE DRAW: a pixel\'s snow sets its six uniforms; a pixel with none turns the switch off, once while it stays off; a forgotten frame forgets the switch (mutants: the switch left on; a uniform unsent; the shadow never forgotten)', () => {
  const rig = recordingGl();
  const r = new RENDER.Renderer(rig.canvas);
  r.beginFrame(I, I, new Float32Array([0, 1, 0]));
  const surface = { vao: {}, indexCount: 6 };
  const snow = { h10: Float32Array.of(1, 2, 3, 4), h50: Float32Array.of(5, 6, 7, 8), h90: Float32Array.of(9, 10, 11, 12), set: Float32Array.of(-34, 1, TWIN_LAYERS, 0), eco: Int32Array.of(TWIN_LAYERS, 0, 0), tile: Int32Array.of(1280, 2048) };
  const u = (log, name) => log.filter((e) => e.name === name).map((e) => e.args);
  let at = rig.log.length;
  r.drawTerrain(surface, I, { id: 'own' }, { id: 'tilemap' }, 6.4, false, null, snow);
  const d = rig.log.slice(at);
  assert.deepEqual(u(d, 'uSnowH10'), [[[1, 2, 3, 4]]]); assert.deepEqual(u(d, 'uSnowH50'), [[[5, 6, 7, 8]]]); assert.deepEqual(u(d, 'uSnowH90'), [[[9, 10, 11, 12]]]);
  assert.deepEqual(u(d, 'uSnowSet'), [[[-34, 1, TWIN_LAYERS, 0]]]); assert.deepEqual(u(d, 'uSnowEco'), [[[TWIN_LAYERS, 0, 0]]]); assert.deepEqual(u(d, 'uSnowTile'), [[[1280, 2048]]]);
  at = rig.log.length;
  r.drawTerrain(surface, I, { id: 'own' }, { id: 'tilemap' }, 6.4, false, null, null);
  r.drawTerrain(surface, I, { id: 'own' }, { id: 'tilemap' }, 6.4, false, null, null);
  assert.deepEqual(u(rig.log.slice(at), 'uSnowSet'), [[0, 0, 0, 0]], 'off once');
  r.beginFrame(I, I, new Float32Array([0, 1, 0]));
  at = rig.log.length;
  r.drawTerrain(surface, I, { id: 'own' }, { id: 'tilemap' }, 6.4, false, null, null);
  assert.deepEqual(u(rig.log.slice(at), 'uSnowSet'), [[0, 0, 0, 0]], 'a new frame says it again');
});

test('PRECIP4 THE TWIN SET: a set\'s summer records then its winter ones, blitted layer by layer at the larger size into one array - the framebuffers and the scissor put back, mipmapped, cached under its key and let go with it; none while a set is missing or not a set\'s length (mutants: a half uncopied; the framebuffers left bound; the scissor left off)', () => {
  const rig = recordingGl();
  const r = new RENDER.Renderer(rig.canvas);
  const layer = (w) => ({ width: w, height: w, colors: new Uint8Array(w * w * 4) });
  r.uploadTileArray(302, Array.from({ length: TWIN_LAYERS }, () => layer(64)));
  assert.equal(r.makeTwinArray(twinKey(302), 302, 303), null, 'its winter not uploaded');
  r.uploadTileArray(303, Array.from({ length: TWIN_LAYERS }, () => layer(128)));
  r.uploadTileArray(999, Array.from({ length: 3 }, () => layer(64)));
  assert.equal(r.makeTwinArray('bad', 302, 999), null, 'not a set');
  const at = rig.log.length;
  const tex = r.makeTwinArray(twinKey(302), 302, 303);
  assert.ok(tex);
  const d = rig.log.slice(at);
  const blits = d.filter((e) => e.k === 'blitFramebuffer');
  assert.equal(blits.length, 2 * TWIN_LAYERS, 'every layer');
  assert.deepEqual(blits[0].args.slice(0, 8), [0, 0, 64, 64, 0, 0, 128, 128], 'the summer scaled up to the winter\'s size');
  assert.deepEqual(blits[TWIN_LAYERS].args.slice(0, 8), [0, 0, 128, 128, 0, 0, 128, 128]);
  const layers = d.filter((e) => e.k === 'framebufferTextureLayer');
  assert.equal(layers[2 * TWIN_LAYERS - 1].args[4], TWIN_LAYERS - 1, 'the last read is the winter\'s last');
  assert.equal(layers[2 * TWIN_LAYERS * 2 - 1].args[4], 2 * TWIN_LAYERS - 1, 'into the twin\'s last');
  const fbs = d.filter((e) => e.k === 'bindFramebuffer');
  assert.deepEqual(fbs.slice(-2).map((e) => e.fb.id), ['screen', 'screen'], 'put back');
  assert.ok(d.some((e) => e.k === 'disable' && e.cap === rig.enums.get('SCISSOR_TEST')) && d.some((e) => e.k === 'enable' && e.cap === rig.enums.get('SCISSOR_TEST')), 'the scissor off and on');
  assert.ok(d.some((e) => e.k === 'generateMipmap'));
  assert.equal(r.makeTwinArray(twinKey(302), 302, 303), tex, 'cached');
  assert.equal(r.tileArrays.get(twinKey(302)), tex);
  assert.ok(r.releaseTileArray(twinKey(302)));
  assert.equal(r.tileArrays.has(twinKey(302)), false);
});

/** A stream about pixel (200, 100) with its pixels `built`, and a host over it whose lines a test sets by hand. */
function hostRig({ built = new Map(), owns = true, comp = [0, 0, 0] } = {}) {
  const lane = { on: owns };
  const marked = [];
  const state = {
    compensation: comp, mapOrigin: { x: 200, y: 100 }, current: { x: 200, y: 100 },
    pixelTranslation: (px, py, out = [0, 0, 0]) => { out[0] = (px - 200) * PIX + comp[0]; out[1] = comp[1]; out[2] = -(py - 100) * PIX + comp[2]; return out; },
  };
  const tileArrays = new Map([[302, { id: 'summer' }], [twinKey(302), { id: 'twin' }], [2, { id: 'desert' }]]);
  const renderer = { tileArrays, makeTwinArray: (key) => { tileArrays.set(key, { id: key }); return tileArrays.get(key); } };
  const host = createSnowCoverHost({ renderer, climateAt: () => 0, mapHeight: 500, stateOf: () => state, builtOf: () => built, heightAt: () => SEA_LEVEL_M + 100, owns: () => lane.on, markReskin: (k) => marked.push(k) });
  /** every lattice point's shown line, one line */
  const setAll = (line) => {
    for (let j = 40; j <= 60; j++) for (let i = 90; i <= 110; i++) host._lines.set(`${i},${j}`, { target: Float32Array.from(line), shown: Float32Array.from(line) });
  };
  return { host, marked, state, setAll, tileArrays, lane };
}

test('PRECIP4 THE HOST: the lane asked each frame (a turn re-skins every standing pixel); the snowline bilinear between lattice points; a pixel\'s draw its corners\' lines, its set\'s twin and its neighbours\' - the world\'s height offset; the twin array on the lane, the set off it (mutants: the corners swapped; the offset\'s sign; the twin off the lane)', async () => {
  const built = new Map([['200,100', { px: 200, py: 100, groundArchive: 302, eco: { archives: [302, 2, null] } }], ['201,100', { px: 201, py: 100 }]]);
  const { host, marked, setAll, state, lane } = hostRig({ built, comp: [0, 50, 0] });
  assert.equal(host.on, true, 'the lane known before the first frame - a boot\'s builds ask it');
  host.tick({ px: 200, py: 100, t: NaN });
  assert.deepEqual(marked, [], 'the first frame turns nothing: the boot built on the lane');
  lane.on = false; host.tick({ px: 200, py: 100, t: NaN }); lane.on = true; host.tick({ px: 200, py: 100, t: NaN });
  assert.deepEqual(marked.sort(), ['200,100', '200,100', '201,100', '201,100'], 'a turn of the lane in play re-skins every standing pixel, each way');
  setAll([100, 200, 300]);
  // a line that varies east-west across one lattice cell: points i=100 (pixel 200) and i=101 (pixel 202)
  for (let j = 40; j <= 60; j++) host._lines.set(`101,${j}`, { target: Float32Array.of(300, 400, 500), shown: Float32Array.of(300, 400, 500) });
  const x0 = (200 + 0.5) * PIX, z = (499 - 100 + 0.5) * PIX;
  assert.deepEqual(host.lineAt(x0, z), [100, 200, 300], 'at a point');
  assert.deepEqual(host.lineAt(x0 + PIX, z), [200, 300, 400], 'half way to the next');
  // the climate's twin: loaded through the host's own set loader, held under its key
  const holds = [];
  await host.loadTwin({ climateType: 1, groundArchive: 302 }, { tileArray: (k) => holds.push(k) }, async () => {});
  assert.deepEqual(holds, [twinKey(302)]);
  await host.loadTwin({ climateType: 0, groundArchive: 2 }, { tileArray: (k) => holds.push(k) }, async () => {});
  assert.deepEqual(holds, [twinKey(302)], 'a desert\'s ground wears no winter');
  assert.equal(host.arrayOf(302).id, twinKey(302)); assert.equal(host.arrayOf(2).id, 'desert');
  const d = host.drawOf(built.get('200,100'));
  assert.deepEqual([...d.h50], [lineAtCorner(host, 200, 100, 0), lineAtCorner(host, 200, 100, 1), lineAtCorner(host, 200, 100, 2), lineAtCorner(host, 200, 100, 3)], 'the corners SW, SE, NW, NE');
  assert.deepEqual([...d.set], [Math.fround(-(50 + SEA_LEVEL_M)), 1, TWIN_LAYERS, 0], 'the world\'s height above the sea; on; its twin');
  assert.deepEqual([...d.eco], [TWIN_LAYERS, 0, 0], 'a neighbour\'s twin and a desert\'s none');
  assert.deepEqual([...d.tile], ecoOrigin(200, 100));
  state.compensation[1] = 80;
  assert.equal(host.drawOf(built.get('200,100')).set[0], Math.fround(-(80 + SEA_LEVEL_M)), 'the offset this frame\'s');
  // the lane turned off under a standing twin: the set as it is again
  const turned = hostRig({ built });
  turned.host.tick({ px: 200, py: 100, t: NaN });
  await turned.host.loadTwin({ climateType: 1, groundArchive: 302 }, { tileArray: () => {} }, async () => {});
  assert.equal(turned.host.arrayOf(302).id, twinKey(302));
  turned.lane.on = false; turned.host.tick({ px: 200, py: 100, t: NaN });
  assert.equal(turned.host.arrayOf(302).id, 'summer', 'off: the summer set, the twin standing unused');
  // off the lane: nothing drawn, the set as it is, every standing pixel re-skinned
  const off = hostRig({ built, owns: false });
  off.host.tick({ px: 200, py: 100, t: NaN });
  assert.equal(off.host.drawOf(built.get('200,100')), null);
  assert.equal(off.host.arrayOf(302).id, 'summer');
  assert.equal(off.host.groundArchive({ climateType: 1, groundArchive: 302 }, SEASON.Winter), 303, 'DFU\'s season off the lane');
  assert.equal(host.groundArchive({ climateType: 1, groundArchive: 302 }, SEASON.Winter), 302, 'the summer set on it');
});
/** The 50 % height at a pixel's corner `k` (SW, SE, NW, NE), read as the host reads it. */
function lineAtCorner(host, px, py, k) {
  const x = px * PIX + (k & 1) * PIX, z = (499 - py) * PIX + (k >> 1) * PIX;
  return Math.fround(host.lineAt(x, z)[1]);
}

test('PRECIP4 THE BUILD\'S SEASONS: a pixel\'s buildings winter from the band\'s top and kept to its foot; a flat winter where the cover at its foot reaches its own draw (a scatter, the same on every client); a buried blade; the feet; off the lane the host\'s season (mutants: the band\'s ends swapped; the draw unread; a blade through the snow)', () => {
  const { host, setAll } = hostRig();
  host.tick({ px: 200, py: 100, t: NaN });
  const [lo, hi] = SNOW_COVER.winter;
  // a line whose 50 % sits at 500 m: covers by height read straight off coverAtHeight
  setAll([400, 500, 600]);
  const hAt = (c) => { for (let h = 300; h < 700; h += 0.25) if (coverAtHeight([400, 500, 600], h) >= c) return h; return 700; };
  assert.equal(host.seasonOfPixel(200, 100, hAt(hi) - 1, SEASON.Summer), SEASON.Summer, 'under the top: summer');
  assert.equal(host.seasonOfPixel(200, 100, hAt(hi) + 1, SEASON.Summer), SEASON.Winter, 'over it: winter');
  assert.equal(host.seasonOfPixel(200, 100, hAt((lo + hi) / 2), SEASON.Summer), SEASON.Winter, 'in the band: held');
  assert.equal(host.seasonOfPixel(200, 100, hAt(lo) - 1, SEASON.Summer), SEASON.Summer, 'under its foot: summer');
  assert.equal(host.seasonOfPixel(200, 100, hAt((lo + hi) / 2), SEASON.Summer), SEASON.Summer, 'in the band: held');
  // the flats: a scatter by their own draws, whole and none at the ends
  let winter = 0;
  for (let i = 0; i < 400; i++) {
    const lx = (i * 37) % 800, lz = (i * 91) % 800;
    const s = host.flatSeason(200, 100, lx, lz, 500, SEASON.Summer);
    assert.equal(s, host.flatSeason(200, 100, lx, lz, 500, SEASON.Summer), 'pure');
    assert.equal(s === SEASON.Winter, 0.5 >= flatDraw(200, 100, lx, lz));
    if (s === SEASON.Winter) winter++;
    assert.equal(host.flatSeason(200, 100, lx, lz, 900, SEASON.Summer), SEASON.Winter, 'a whole cover whitens every one');
    assert.equal(host.flatSeason(200, 100, lx, lz, 100, SEASON.Winter), SEASON.Summer, 'none whitens none');
  }
  assert.ok(winter > 100 && winter < 300, `a scatter: ${winter} of 400`);
  // a blade at 100 m (the rig's ground) under a line far below it: buried; far above: grows
  setAll([-800, -700, -600]);
  assert.equal(host.buries({ px: 200, py: 100 }, 10, 10, 0, 0), true);
  assert.equal(host.winterAt([PIX / 2, SEA_LEVEL_M + 100, -PIX / 2 + 10], false), true, 'snow under the feet');
  setAll([3000, 3100, 3200]);
  assert.equal(host.buries({ px: 200, py: 100 }, 10, 10, 0, 0), false);
  assert.equal(host.winterAt([PIX / 2, SEA_LEVEL_M + 100, -PIX / 2 + 10], true), false, 'none, whatever the calendar');
  const off = hostRig({ owns: false });
  off.host.tick({ px: 200, py: 100, t: NaN });
  assert.equal(off.host.seasonOfPixel(200, 100, 5000, SEASON.Summer), SEASON.Summer);
  assert.equal(off.host.flatSeason(200, 100, 1, 1, 5000, SEASON.Winter), SEASON.Winter);
  assert.equal(off.host.winterAt([0, 0, 0], true), true, 'DFU\'s word');
  assert.equal(off.host.buries({ px: 200, py: 100 }, 1, 1, 0, 0), false);
});

test('PRECIP4 THE BUILD WAITS FOR THE SNOW: on the lane a build settles the window about the player first - integrated in slices with a breath between, its lines read once and shown as read; then it answers at once; off the lane it waits for nothing (mutants: no breath; the lines unread; a settle every build)', async () => {
  const { host } = hostRig();
  const t = (406 * 360 + 250) * 1440;   // early autumn: a short history
  const rig = createSnowCoverHost({ renderer: { tileArrays: new Map() }, climateAt: () => 0, mapHeight: 500, stateOf: () => ({ compensation: [0, 0, 0] }), builtOf: () => new Map(), heightAt: () => 0, owns: () => true, markReskin: () => {}, place: () => ({ px: 200, py: 100, t }) });
  let breaths = 0;
  await rig.settle(async () => { breaths++; });
  assert.equal(rig.ready, true);
  assert.equal(rig._lines.size, (2 * SNOW_COVER.radius + 1) ** 2, 'every point of the window read');
  for (const l of rig._lines.values()) assert.deepEqual([...l.shown], [...l.target], 'shown as read');
  assert.ok(breaths >= 0);
  const before = rig._lattice.stepsRun + rig._lattice.stepsSkipped;
  const lines = new Map([...rig._lines].map(([k, l]) => [k, l.target]));
  await rig.settle(async () => { throw new Error('no breath needed'); });
  assert.equal(rig._lattice.stepsRun + rig._lattice.stepsSkipped, before, 'settled: nothing integrated again');
  for (const [k, l] of rig._lines) assert.equal(l.target, lines.get(k), 'nor read again');
  // sliced: a long history breathes between slices
  const deep = createSnowCoverHost({ renderer: { tileArrays: new Map() }, climateAt: () => 0, mapHeight: 500, stateOf: () => ({ compensation: [0, 0, 0] }), builtOf: () => new Map(), heightAt: () => 0, owns: () => true, markReskin: () => {}, place: () => ({ px: 200, py: 100, t: (407 * 360 + 30) * 1440 }) });
  let n = 0;
  await deep.settle(async () => { n++; });
  assert.ok(n > 0 && deep.ready, `a winter's history breathes: ${n} breaths`);
  // off the lane: nothing
  const off = createSnowCoverHost({ renderer: { tileArrays: new Map() }, climateAt: () => 0, mapHeight: 500, stateOf: () => ({ compensation: [0, 0, 0] }), builtOf: () => new Map(), heightAt: () => 0, owns: () => false, markReskin: () => {}, place: () => ({ px: 200, py: 100, t }) });
  await off.settle(async () => { throw new Error('no breath off the lane'); });
  assert.equal(off._lines.size, 0);
  assert.equal(host.on, true);
});

test('PRECIP4 THE SWEEP: a standing pixel built under other snow - its buildings\' season turned, or its flats\' cover a step on - built again through the re-skin, the nearest SNOW_COVER.sweepMax first; one built under the snow now left standing (mutants: the step unread; the order reversed; no cap)', () => {
  const built = new Map();
  for (let k = 0; k < 8; k++) built.set(`${200 + k},100`, { px: 200 + k, py: 100 });
  const { host, marked, setAll } = hostRig({ built });
  host.tick({ px: 200, py: 100, t: NaN });
  marked.length = 0;
  setAll([400, 500, 600]);
  for (const p of built.values()) p._snow = host.signatureOf(p.px, p.py, 100, 200, 300);
  assert.deepEqual(host.sweep(), [], 'built under the snow now');
  setAll([-800, -700, -600]);   // a cold front: every pixel white now
  const keys = host.sweep();
  assert.equal(keys.length, SNOW_COVER.sweepMax);
  assert.deepEqual(keys, ['200,100', '201,100', '202,100', '203,100'], 'nearest first');
  assert.deepEqual(marked, keys);
  const p = built.get('205,100');
  p._snow = host.signatureOf(p.px, p.py, 100, 200, 300);
  assert.ok(!host.sweep().includes('205,100'), 'rebuilt: standing');
  // the buildings' season unturned (the middle's cover a half before and after) and the flats' cover a step on at the low
  // and the high ground: built again
  const one = new Map([['200,100', { px: 200, py: 100 }]]);
  const r2 = hostRig({ built: one });
  r2.host.tick({ px: 200, py: 100, t: NaN });
  r2.setAll([0, 200, 400]);
  const q = one.get('200,100');
  q._snow = r2.host.signatureOf(200, 100, 100, 200, 300);
  near(q._snow.covers[0], 0.3, 1e-9, 'low'); near(q._snow.covers[2], 0.7, 1e-9, 'high');
  r2.setAll([190, 200, 210]);
  assert.deepEqual(r2.host.sweep(), ['200,100'], 'the flats\' cover moved a step');
  r2.setAll([100, 200, 300]);
  assert.deepEqual(r2.host.sweep(), [], 'under a step: standing');
});

test('PRECIP4 THE WIRING: the builds read the pixel\'s season off the host (its buildings, its town\'s swaps, its windmills, its homes), the summer set and its twin for the ground, each flat its own season, and keep the snow they were built under; the world draws each pixel with its twin and its snow, its border\'s twins, re-skins by the snow on the lane, grows no grass through it, and hears the snow under the feet (mutants: each line reverted)', () => {
  const b = read('src/scenes/pixelBuild.js');
  assert.match(b, /const season = snowCover \? snowCover\.seasonOfPixel\(px, py, groundMid - SEA_LEVEL_M, host\.season\) : host\.season;/);
  assert.doesNotMatch(b.slice(b.indexOf('\n', b.indexOf('const season = snowCover'))), /host\.season\b(?!sReady|sActive)/, 'no build line reads the host\'s season past it');
  assert.match(b, /const groundArchive = snowCover \? snowCover\.groundArchive\(climate, season\) : getTerrainGroundArchive\(climate, season\);/);
  assert.match(b, /await loadGroundSet\(groundArchive, pipeline\);\n {4}await snowCover\?\.loadTwin\(climate, pipeline, loadGroundSet\);/);
  assert.match(b, /if \(archives\.includes\(snowCover\?\.groundArchive\(c, season\)\)\) await snowCover\.loadTwin\(c, pipeline, loadGroundSet\);/);
  assert.match(b, /const fSeason = snowCover\?\.on \? snowCover\.flatSeason\(px, py, f\.x, f\.z, f\.y - SEA_LEVEL_M, season\) : season;/);
  assert.match(b, /archive = f\.archive == null && fSeason === season \? natureArchive : getNatureArchive\(base, fSeason\);/);
  assert.match(b, /_snow: snowCover\?\.signatureOf\(px, py, groundLo - SEA_LEVEL_M, groundMid - SEA_LEVEL_M, groundHi - SEA_LEVEL_M\) \?\? null,/);
  const w = read('src/scenes/world.js');
  assert.match(w, /const snowCover = createSnowCoverHost\(\{ renderer, climateAt, mapHeight: MAP_H, stateOf: \(\) => state, builtOf: \(\) => built, heightAt: \(x, z\) => heightAt\(x, z\), owns: precipLawOn, markReskin: \(key\) => _reskin\.mark\(key\), place: \(\) => \(\{ px: state\.current\.x, py: state\.current\.y, t: worldMinutes\(\) \}\) \}\);/);
  assert.match(b, /if \(snowCover\?\.on\) await snowCover\.settle\(\(\) => breather\.breathe\(\)\);[^\n]*\n {4}const season = snowCover/, 'a build waits for the snow before its season');
  assert.match(w, /snowCover\.tick\(\{ px: _sp\.x, py: _sp\.y, t: playerTicker\.classicMinutes, dt, arriving: !playerSpawned \}\);/);
  assert.match(w, /if \(refreshSeason\(\) && !snowCover\.on\) _reskin\.markAll\(\);/);
  assert.match(w, /e\.tex\[k\] = snowCover\.arrayOf\(a\);/);
  assert.equal(w.split('snowCover.drawOf(').length - 1, 2, 'both ground draws');
  assert.match(w, /if \(snowCover\.on && snowCover\.buries\(p, lx, lz, x, z\)\) return null;/);
  assert.match(w, /p\._stride === 1 && p\.tilemapBytes && \(snowCover\.on \|\| p\.season !== SEASON\.Winter\)/);
  assert.equal(w.split('winter: snowCover.winterAt(').length - 1, 4, 'the three footsteps and the Snowfall mod');
  assert.match(w, /seasons, siegeFieldsByTown, snowCover, snowfall, standPixelNpcs,/);
  assert.match(b, /seasons, siegeFieldsByTown, snowCover, snowfall, standPixelNpcs,/);
  assert.equal(levelAltitude(SNOWPACK.levels.count) > 3000, true);
});
