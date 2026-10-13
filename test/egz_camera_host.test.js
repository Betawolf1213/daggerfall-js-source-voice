// EG-ZN (2026-10-12, Mac: "I said I want everything"; bible/11-Multiplayer/Elite-Gates.md sections 11.8 and 29): THE
// CAMERA IN THE SPIRE ON THE MODE MACHINE, AND THE BAND TEXTURES' OWNER. The mode machine's own source (scenes/worldModes.js
// - the circle's stand, THE SWAP, egOccludeFrame and egBandsDown) run over the REAL renderer (render/renderer.js, its
// meshView and setDissolve, on a recording GL): the bookcase between the camera and me drawn under uDissolveCut 1 - k and
// the rest of the circle once, its shadow recorded whole; first person, a witness and the free camera nothing; a failed
// build holding nothing; the swap in place at its baseline. The band dress a breach put up freed at its end - albedo and
// emission, from GL - and never within it.
import './modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildEgCircleModel, egToDungeon, egCircleColliderTris, egCircleLights, egGateParts } from '../src/world/egHall.js';
import { egCircleParts } from '../src/world/egCircleParts.js';
import { egHallOf, egCircleSpecs, egCircleOfHall, egBandOfCircle, EG_TEXT } from '../src/net/egLaw.js';
import { createEgOccluders, EG_OCCLUDE_CHEST_M } from '../src/scenes/egOcclude.js';
import { createEgSwap } from '../src/scenes/egSwap.js';
import { Renderer, WORLD_FRAME } from '../src/render/renderer.js';
import { egBandArt, egBandArchive, EG_DRESS_RECORDS } from '../src/world/egBandArt.js';
import { realmArt } from '../src/world/sdRealmArt.js';
import { SD_REALM_ARCHIVE } from '../src/world/sdRealm.js';
import { identity } from '../src/world/mat4.js';
import { buildEgLookModel } from '../src/world/egLook.js';
import { Collider } from '../src/player/collider.js';
import { egBeatTellDown } from '../src/scenes/egSpan.js';   // AUDIT EG III (lane4 #4): the band dress's owner frees the Beats' pictures too

const rd = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const WM = rd('src/scenes/worldModes.js');
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); assert.ok(i > 0 && j > i, `${a} .. ${b}`); return src.slice(i, j); };
const I4 = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
/** Every index a list of sub-mesh ranges covers, as one sorted list. */
const covered = (ranges) => ranges.flatMap((r) => Array.from({ length: r.primitiveCount * 3 }, (_, k) => r.startIndex + k)).sort((a, b) => a - b);
/** The Fallen Stacks (seed 77, hall 2 - a passage of bookcases), and its circle's model. */
const STACKS = { seed: 77, h: 2 };

// ── THE PASS, ON THE REAL RENDERER AND THE MODE MACHINE'S OWN SOURCE ───────────────────────────────────────────────────
/** A recording WebGL2 deep enough for the renderer (test/audit68_render_a.test.js's). */
function recordingGl() {
  const calls = [];
  let ids = 0;
  const consts = { TEXTURE0: 1000, DEPTH_BUFFER_BIT: 256, COLOR_BUFFER_BIT: 16384, READ_FRAMEBUFFER: 36008, DRAW_FRAMEBUFFER: 36009, FRAMEBUFFER: 36160, TRIANGLE_STRIP: 5, ONE: 1 };
  const gl = new Proxy({}, {
    get(_, k) {
      if (k in consts) return consts[k];
      if (k === 'getProgramParameter' || k === 'getShaderParameter') return () => true;
      if (k === 'getUniformLocation') return (_p, n) => n;
      if (k === 'getAttribLocation') return () => 0;
      if (k === 'createShader' || k === 'createProgram' || k === 'createBuffer' || k === 'createVertexArray'
        || k === 'createTexture' || k === 'createFramebuffer' || k === 'createRenderbuffer') return () => ({ id: ++ids });
      if (k === 'getParameter') return () => new Float32Array(4);
      if (typeof k === 'string' && k.toUpperCase() === k) return 1;
      return (...args) => { calls.push([k, ...args]); };
    },
  });
  const canvas = { getContext: () => gl, clientWidth: 320, clientHeight: 200, width: 320, height: 200 };
  return { gl, calls, canvas };
}
const syncWorker = () => {
  const w = { onmessage: null, onerror: null, postMessage(msg) { w.onmessage?.({ data: { t: 'built', id: msg.id, parts: egCircleParts(msg.seed, msg.c, msg.geo) } }); }, terminate() {} };
  return w;
};
/** The mode machine's circle (its stand, THE SWAP, the band dress and its owner) and the frame's dither pass - its own source -
 *  over the REAL renderer on a recording GL. */
function hostRig() {
  const { calls, canvas } = recordingGl();
  const r = new Renderer(canvas);
  let live = 0;
  const fail = { next: false };
  const createMesh = r.createMesh.bind(r), destroyMesh = r.destroyMesh.bind(r);
  r.createMesh = (m) => { if (fail.next && m.occluders) { fail.next = false; throw new Error('no room'); } live++; return createMesh(m); };
  r.destroyMesh = (g) => { live--; return destroyMesh(g); };
  const shadows = [];
  if (r._shadows) { const rec = r._shadows.recordMesh.bind(r._shadows); r._shadows.recordMesh = (mesh, ...a) => { shadows.push(mesh); return rec(mesh, ...a); }; }
  const region = between(WM, "  const EG_BUCKET = 'eg:hall';", '  // ── EG-H3 end');
  const pass = between(WM, '  function egOccludeFrame(mwv, dt) {', '  /** EG-PLAY: A BODY STOOD ELSEWHERE IN THE CIRCLE');
  const loc = { egBreach: '0123456789abcdef', egSeed: STACKS.seed, egCircle: egCircleOfHall(STACKS.h), egGeo: 0, dungeon: { recordElement: { header: { locationId: 0x7ffff300 } } } };
  const ctx = { dynamicDraws: [], collider: new Collider(() => -Infinity), addActivationNamer() {}, texRemap: null };
  const st = { mode: 'dungeon', witness: false, feet: [0, 0, 0] };
  const host = { egGateOpen: () => false, egWitness: () => st.witness };
  const player = { bodyFeetAt: () => st.feet, feetAt: () => st.feet };
  const wm = new Function('host', 'renderer', 'isEgHall', 'createEgSwap', 'identity', 'realmArt', 'SD_REALM_ARCHIVE', 'buildEgCircleModel', 'egCircleColliderTris', 'egCircleLights', 'egCircleSpecs', 'egGateParts', 'EG_TEXT', 'egBandOfCircle', 'egBandArt', 'egBandArchive', 'buildEgLookModel', 'createEgOccluders', 'EG_DRESS_RECORDS', 'EG_OCCLUDE_CHEST_M', 'player', 'decorTool', 'egBeatTellDown', 'st',
    `let dungeonLoc = st.loc, dungeonCtx = st.ctx;\nObject.defineProperty(st, 'm', { get: () => mode });\nlet mode = 'dungeon';\nst.setMode = (m) => { mode = m; };\n${region.replace('const egSwap = createEgSwap();', 'const egSwap = createEgSwap({ workerFactory: st.worker });')}\n${pass}\nreturn { standEgHall, egPrebuild, egSwapCircle, egBandsDown, egOccludeFrame, egOcc, get draw() { return _egDraw; }, get mesh() { return _egMesh; } };`)(
    host, r, (l) => !!l?.egBreach && l.dungeon?.recordElement?.header?.locationId === 0x7ffff300, createEgSwap, identity, realmArt, SD_REALM_ARCHIVE, buildEgCircleModel, egCircleColliderTris, egCircleLights, egCircleSpecs, egGateParts, EG_TEXT, egBandOfCircle, egBandArt, egBandArchive, buildEgLookModel, createEgOccluders, EG_DRESS_RECORDS, EG_OCCLUDE_CHEST_M, player, { flying: () => !!st.flying }, egBeatTellDown,   // PIN MOVED (AUDIT EG III lane4 #4): egBandsDown frees the Beats' pictures with the dress (scenes/egSpan.js)
    Object.assign(st, { loc, ctx, worker: syncWorker }));
  return { r, calls, wm, ctx, loc, st, shadows, fail, get live() { return live; } };
}
test('EG-ZN THE PASS ON THE REAL RENDERER (scenes/worldModes.js egOccludeFrame and the circle\'s stand and swap, their own source, over render/renderer.js on a recording GL): the stand hands the circle\'s mesh and its occluders to the pass and pushes one draw; with the third-person eye behind a bookcase the frame draws every index of the circle\'s mesh exactly once - the rest in its sub-meshes, the bookcase\'s runs under uDissolveCut 1 - k, the cut back to nought after - and records the circle\'s shadow once, whole; first person, a witness and a clear ray draw nothing here; the swap in place lets the old circle go first and six swaps and back leave the live meshes at their baseline (mutants: the stand unhanded; the swap\'s new circle unhanded; the old circle kept by the pass; the witness dithering)', () => {
  const R = hostRig(), { r, calls, wm, ctx, st } = R;
  const eh = { b: R.loc.egBreach, seed: STACKS.seed, c: egCircleOfHall(STACKS.h), geo: 0 };
  wm.standEgHall(ctx, eh);
  const base = R.live;
  const d = wm.draw;
  assert.ok(d && ctx.dynamicDraws.includes(d) && d.gpu === wm.mesh, 'one draw of the circle\'s mesh');
  assert.equal(wm.egOcc.stats().pieces, buildEgCircleModel(eh.seed, eh.c, 0).occluders.length, 'the stand handed the pass the circle and its occluders');
  const m = buildEgCircleModel(eh.seed, eh.c, 0), spec = egHallOf(STACKS.seed, STACKS.h, 0), q = spec.caves[0], left = egToDungeon(spec, q.x - q.halfW, 0, 0)[0];
  const bk = m.occluders.find((o) => Math.abs(o.b[0] - left) < 1e-3 && o.b[3] - o.b[0] < 0.5);
  const cx = (bk.b[0] + bk.b[3]) / 2;
  st.feet = [cx, 1.2 - EG_OCCLUDE_CHEST_M, bk.b[5] + 0.35];
  const mwv = { eye: [cx, 1.2, bk.b[2] - 0.2], focal: [cx, 1.2, bk.b[5] + 0.35], thirdPerson: true };
  const frame = (v, dt = 0.1) => { r.beginFrame(I4, I4, new Float32Array([0, 1, 0]), WORLD_FRAME); calls.length = 0; R.shadows.length = 0; wm.egOccludeFrame(v, dt); return calls.slice(); };
  // first person, a witness: nothing
  assert.equal(frame({ ...mwv, thirdPerson: false }).filter((c) => c[0] === 'drawElements').length, 0, 'first person tries nothing');
  st.flying = true;
  assert.equal(frame(mwv).filter((c) => c[0] === 'drawElements').length, 0, 'the decorator\'s free camera tries nothing');
  st.flying = false;
  st.witness = true;
  assert.equal(frame(mwv).filter((c) => c[0] === 'drawElements').length, 0, 'a witness\'s eye tries nothing');
  st.witness = false;
  const got = frame(mwv);
  const draws = got.filter((c) => c[0] === 'drawElements'), cut = got.filter((c) => c[0] === 'uniform1f' && c[1] === 'uDissolveCut');
  assert.equal(d.hidden, true);
  const idx = draws.flatMap((c) => Array.from({ length: c[2] }, (_, k) => c[4] / 4 + k)).sort((a, b) => a - b);
  assert.deepEqual(idx, covered(m.subMeshes), 'every index of the circle once');
  assert.deepEqual(cut.map((c) => c[2]), [1 - 0.625, 0], 'the bookcase under the dither, then the cut back to nought');
  const at = got.indexOf(cut[0]), after = got.indexOf(cut[1]);
  const under = got.slice(at, after).filter((c) => c[0] === 'drawElements').map((c) => [c[4] / 4, c[2] / 3]);
  assert.deepEqual(under, bk.r.map(([, s, n]) => [s, n]), 'only the bookcase dithered');
  if (r._shadows) assert.deepEqual(R.shadows, [wm.mesh], 'the circle\'s shadow recorded once, whole');
  // clear again: the loop's own draw
  st.feet = [cx + 2, 0.3, bk.b[5] + 0.35];
  frame({ ...mwv, eye: [cx + 2, 1.2, bk.b[2] - 0.2], focal: [cx + 2, 1.2, bk.b[5] + 0.35] }, 1);
  assert.equal(frame({ ...mwv, eye: [cx + 2, 1.2, bk.b[2] - 0.2], focal: [cx + 2, 1.2, bk.b[5] + 0.35] }, 1).filter((c) => c[0] === 'drawElements').length, 0);
  assert.equal(d.hidden, false);
  // the chest's ray alone: the eye and the pivot over the bookcase's top, my chest behind it
  st.feet = [cx, 1.2 - EG_OCCLUDE_CHEST_M, bk.b[5] + 0.35];
  const high = { ...mwv, eye: [cx, 2.9, bk.b[2] - 0.2], focal: [cx, 2.9, bk.b[5] + 0.35] };
  assert.ok(frame(high, 1).filter((c) => c[0] === 'uniform1f' && c[1] === 'uDissolveCut').length > 0, 'the chest\'s ray dithers it');
  for (let i = 0; i < 3; i++) frame({ ...mwv, eye: [cx + 2, 1.2, bk.b[2] - 0.2], focal: [cx + 2, 1.2, bk.b[5] + 0.35] }, 1);
  st.feet = [cx + 2, 0.3, bk.b[5] + 0.35];
  frame({ ...mwv, eye: [cx + 2, 1.2, bk.b[2] - 0.2], focal: [cx + 2, 1.2, bk.b[5] + 0.35] }, 1);
  assert.equal(d.hidden, false);
  // the renderer's view: none of a dead mesh or of a view; its sub-meshes its own
  const small = { positions: new Float32Array(9), normals: new Float32Array(9), uvs: new Float32Array(6), indices: new Uint32Array([0, 1, 2]), subMeshes: [{ textureArchive: 1, textureRecord: 0, startIndex: 0, primitiveCount: 1 }] };
  const g = r.createMesh(small), own = [{ textureArchive: 1, textureRecord: 0, startIndex: 0, primitiveCount: 1 }], v = r.meshView(g, own);
  assert.ok(v && v.vao === g.vao && v.viewOf === g && v.buffers.length === 0, 'its mesh\'s VAO, no buffer of its own');
  assert.notEqual(v.subMeshes[0], own[0]); assert.deepEqual(v.subMeshes, own);
  assert.equal(r.meshView(v, own), null, 'no view of a view');
  r.destroyMesh(g);
  assert.equal(r.meshView(g, own), null, 'none of a dead mesh');
  // a circle that will not build: the pass holds nothing of the one let go - at a stand and at a swap
  R.fail.next = true;
  wm.standEgHall(ctx, { ...eh, c: eh.c + 30 });
  assert.equal(wm.egOcc.stats().pieces, 0, 'the stand: the old circle let go, no new one');
  wm.standEgHall(ctx, eh);
  assert.equal(wm.egOcc.stats().pieces, m.occluders.length);
  assert.equal(wm.egPrebuild({ ...eh, c: eh.c + 1 }), 'ready');
  R.fail.next = true;
  assert.equal(wm.egSwapCircle({ ...eh, c: eh.c + 1 }), true);
  assert.equal(wm.egOcc.stats().pieces, 0, 'the swap: the old circle let go, no new one');
  assert.equal(wm.egPrebuild(eh), 'ready');
  assert.equal(wm.egSwapCircle(eh), true);
  // the swap in place: the old circle let go first, the new one handed over; six swaps and back (EG-H3's own pin runs twenty), the meshes at their baseline
  const base2 = R.live, d2 = wm.draw;
  st.feet = [cx, 1.2 - EG_OCCLUDE_CHEST_M, bk.b[5] + 0.35];
  frame(mwv);
  assert.equal(d2.hidden, true);
  for (let c = eh.c + 1; c <= eh.c + 6; c++) {
    assert.equal(wm.egPrebuild({ ...eh, c }), 'ready');
    assert.equal(wm.egSwapCircle({ ...eh, c }), true);
    assert.ok(!ctx.dynamicDraws.includes(d2), 'the old circle\'s draw gone, hidden or not');
    assert.ok(ctx.dynamicDraws.includes(wm.draw) && wm.draw.gpu === wm.mesh);
    assert.equal(wm.egOcc.stats().pieces, buildEgCircleModel(eh.seed, c, 0).occluders.length, `circle ${c}: the swap handed the pass its occluders`);
    assert.equal(wm.egOcc.stats().dithering, 0, 'nothing of the old circle dithers on');
  }
  assert.equal(wm.egPrebuild(eh), 'ready');
  assert.equal(wm.egSwapCircle(eh), true);
  assert.equal(R.live, base2, 'six swaps and back: the live meshes at their baseline (the views own none)');
  assert.equal(base2, base, 'the failed builds left nothing behind');
  // the host's frame: the pass after the cull and the frame's beginFrame, before the dynamic draws
  const W = WM, cullAt = W.indexOf('if (isEgHall(dungeonLoc)) dungeonCtx.egSpanCull?.(proj, view);'), passAt = W.indexOf('if (isEgHall(dungeonLoc)) egOccludeFrame(mwv, dt);'), loopAt = W.indexOf('for (const d of dungeonCtx.dynamicDraws) if (!d.hidden && !d.culled) renderer.drawMesh(');
  assert.ok(W.lastIndexOf('renderer.beginFrame(proj, view, INTERIOR_LIGHT_DIR, WORLD_FRAME);', passAt) > W.lastIndexOf('\n    if (mode === \'dungeon\') {', passAt), 'after the dungeon arm\'s beginFrame');
  assert.ok(cullAt > 0 && passAt > cullAt && loopAt > passAt, 'the cull, the pass, then the dynamic draws');
});

// ── THE BAND TEXTURES' OWNER ───────────────────────────────────────────────────────────────────────────────────────
test('EG-ZN THE BAND TEXTURES\' OWNER (scenes/worldModes.js egBandsDown, its own source over the real renderer, section 29): a breach\'s stand and its prebuilds upload each band\'s dress once, its swaps in place none; at the breach\'s end every one of them - each record\'s albedo and its emission - is freed from the renderer and GL, and the Hour\'s own art kept; refused while a circle stands; a second breach uploads again and frees again (mutants: the emission kept; a band kept; the set never emptied; freed while a circle stands)', () => {
  const R = hostRig(), { r, wm, ctx, st, calls } = R;
  const bandKeys = () => [...r.textures.keys()].filter((k) => /^382[4-7]\d_/.test(k)).length + [...r.emissionTextures.keys()].filter((k) => /^382[4-7]\d_/.test(k)).length;
  const hourKeys = () => [...r.textures.keys()].filter((k) => k.startsWith(`${SD_REALM_ARCHIVE}_`)).length;
  const eh = { b: R.loc.egBreach, seed: STACKS.seed, c: 5, geo: 0 };
  R.loc.egCircle = 5;
  wm.standEgHall(ctx, eh);
  const per = EG_DRESS_RECORDS.length * 2, hour = hourKeys();
  assert.equal(bandKeys(), per, 'the circle\'s band: its eight records, albedo and emission');
  assert.ok(hour > 0);
  assert.equal(wm.egPrebuild({ ...eh, c: 6 }), 'ready');
  assert.equal(bandKeys(), per * 2, 'the next band up while the Court rests');
  const ups = calls.filter((c) => c[0] === 'texImage2D').length;
  for (let c = 6; c <= 12; c++) { if (c > 6) assert.equal(wm.egPrebuild({ ...eh, c }), 'ready'); assert.equal(wm.egSwapCircle({ ...eh, c }), true); }
  assert.equal(calls.filter((c) => c[0] === 'texImage2D').length, ups + per * 1, 'the swaps in place upload nothing but the third band\'s prebuild');
  assert.equal(bandKeys(), per * 3);
  assert.equal(wm.egBandsDown(), 0, 'refused while a circle stands');
  assert.equal(bandKeys(), per * 3);
  st.setMode('exterior');
  calls.length = 0;
  assert.equal(wm.egBandsDown(), per * 3, 'the breach\'s end: every band freed');
  assert.equal(bandKeys(), 0);
  assert.equal(calls.filter((c) => c[0] === 'deleteTexture').length, per * 3, 'from GL too');
  assert.equal(hourKeys(), hour, 'the Hour\'s own art kept (the Hour wears it)');
  assert.equal(wm.egBandsDown(), 0, 'again: nothing');
  // a second breach: up again, down again
  st.setMode('dungeon');
  wm.standEgHall(ctx, { ...eh, c: 1 });
  assert.equal(bandKeys(), per, 'a new breach uploads its band');
  st.setMode('exterior');
  assert.equal(wm.egBandsDown(), per);
  assert.equal(bandKeys(), 0);
});
