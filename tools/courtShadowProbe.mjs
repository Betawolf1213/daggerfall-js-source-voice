// FIELD BUGS 2026-10-13e AOE-PERF, THE PART ITS PROBE DID NOT TIME - THE COURT'S SHADOW PASS, COUNTED.
//
// HellRay's "massive FPS drops when the boss performs AoE attacks ... especially when more than 10 players are gathered"
// was measured by tools/fb1013ePerfProbe.mjs, which times the telegraph pass and the crowd's draws AFTER beginFrame. The
// shadow maps are drawn INSIDE beginFrame (renderer.js _renderPasses, render/shadowPass.js), from the last frame's records
// under this frame's lights, so what the boss's own lights and the crowd cost there never entered its numbers. This
// counts it: the real Renderer and ShadowPass on a recording GL (counts, not milliseconds - no load moves them), the
// Burning Court's own mesh as its static caster (world/gateArena.js buildCourtModel, through renderer.createMesh), the
// court's own light composition (world/gateArena.js withCourtLights over courtLightsNear - the dungeon arm's, worldModes.js
// `const _court = withCourtLights`), under everyLightCasts as that arm asks, Steady shadows (the default). His glow at his
// chest (world/gateBoss.js GLOW_RANGE), a Hellfire's landing flashes (render/gateFx.js FX_KINDS.hellfire.light, for
// FX_LIGHT_MS), and the crowd's Morrowind bodies recorded as renderer.recordShadowBody records them, a new pose every frame
// (WB9h's budget poses four of eight a frame, so the bodies in a light's reach change every frame either way), of
// BODY_CORNERS corners (the committed horse's, the AOE-PERF crowd's stand-in).
//
// Two arms: `now` - every light the court composes is a lamp (withCourtLights marks none carried), so his glow and each
// landing flash take a 512 caster slot and a lo map like a brazier; and `carried` - the same frame with his glow and the
// landing flashes marked carried, as a spell's impact light, the wings' and a peer's torch are composed
// (render/spellImpactFx.js light(), render/auraRing.js auraWingLights, scenes/navalHost.js's flashes,
// systems/playerTorch.js peerTorchLight): no caster slot, no lo map, no glare. The second arm is a DESIGN OPTION measured,
// not shipped - those lights would still light, unshadowed, and throw no glare.
//
// Usage: node tools/courtShadowProbe.mjs [bodies=8]
import { Renderer, WORLD_FRAME } from '../src/render/renderer.js';
import { EL_LANE } from '../src/render/enhancedLighting.js';
import { courtLightsNear, withCourtLights, courtToDungeon, buildCourtModel } from '../src/world/gateArena.js';
import { GLOW_RANGE, LANDING_LIGHT_Y } from '../src/world/gateBoss.js';
import { FX_KINDS, FX_LIGHT_MS } from '../src/render/gateFx.js';
import { lookAt, perspective, mirrorProjectionX } from '../src/world/mat4.js';

const BODIES = Number(process.argv[2] ?? 8);
const BODY_CORNERS = 5934;
const FPS = 60;

/** A recording GL: every call a no-op, the vertex array bound and the corners each draw sends counted by array. */
function countingGl() {
  let ids = 0, bound = null;
  const corners = new Map();
  const consts = { TEXTURE0: 1000, DEPTH_BUFFER_BIT: 256, COLOR_BUFFER_BIT: 16384, READ_FRAMEBUFFER: 36008, DRAW_FRAMEBUFFER: 36009, FRAMEBUFFER: 36160 };
  const gl = new Proxy({}, {
    get(_, k) {
      if (k in consts) return consts[k];
      if (k === 'getProgramParameter' || k === 'getShaderParameter') return () => true;
      if (k === 'getUniformLocation') return (_p, n) => n;
      if (k === 'getAttribLocation') return () => 0;
      if (k === 'createShader' || k === 'createProgram' || k === 'createBuffer' || k === 'createVertexArray' || k === 'createTexture' || k === 'createFramebuffer' || k === 'createRenderbuffer') return () => ({ id: ++ids });
      if (k === 'getParameter') return () => new Float32Array(4);
      if (k === 'bindVertexArray') return (v) => { bound = v; };
      if (k === 'drawArrays') return (_m, _first, n) => { const id = bound?.id; corners.set(id, (corners.get(id) ?? 0) + n); };
      if (typeof k === 'string' && k.toUpperCase() === k) return 1;
      return () => {};
    },
  });
  return { canvas: { getContext: () => gl, clientWidth: 960, clientHeight: 540, width: 960, height: 540 }, corners };
}

function run(arm, scenario, frames) {
  const { canvas, corners } = countingGl();
  const r = new Renderer(canvas);
  r.setLightingLane(EL_LANE);
  const sp = r.shadows;
  r.setLighting(new Float32Array([0.18, 0.1, 0.08]), 0);
  const court = r.createMesh(buildCourtModel());   // the court's own mesh - its bounds and its sub-meshes' - on the counting GL
  for (const sm of court.subMeshes) r.textures.set(`${sm.textureArchive}_${sm.textureRecord}`, { id: `court-${sm.textureRecord}` });
  // a fighter's eye, eight metres south of him (fb1013ePerfProbe's third-person camera)
  const eye = courtToDungeon(0, 2.6, 11.5);
  const view = lookAt(eye, courtToDungeon(0, 1.6, 0), [0, 1, 0]);
  const proj = mirrorProjectionX(perspective((60 * Math.PI) / 180, 16 / 9, 0.05, 500));
  const bodies = Array.from({ length: BODIES }, (_, i) => ({ vao: { id: `body${i}` }, count: BODY_CORNERS, ranges: [{ first: 0, count: BODY_CORNERS }], _poseGen: 0 }));
  const model = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  const rows = [];
  for (let k = 0; k < 4 + frames; k++) {
    const s = scenario(k - 4);
    const L = [];
    const g = courtToDungeon(s.boss[0], 3.5, s.boss[1]);
    L.push({ x: g[0], y: g[1], z: g[2], range: s.glow, color: [1.2, 0.5, 0.15] });
    for (const b of s.flashes) { const p = courtToDungeon(b[0], LANDING_LIGHT_Y, b[1]); L.push({ x: p[0], y: p[1], z: p[2], range: FX_KINDS.hellfire.light[1], color: [1.2, 0.6, 0.2] }); }
    const lit = withCourtLights({ data: new Float32Array(0), colors: new Float32Array(0) }, [...L, ...courtLightsNear(eye)]);
    if (arm === 'carried') for (let i = 0; i < L.length; i++) lit.data.carried[i] = 1;
    r.setPointLights(lit.data, null, lit.colors);
    r.everyLightCasts();
    corners.clear();
    r.beginFrame(proj, view, new Float32Array([0.2, -0.9, 0.3]), WORLD_FRAME);
    const st = sp.stats;
    let bodyCorners = 0;
    for (const [id, n] of corners) if (typeof id === 'string' && id.startsWith('body')) bodyCorners += n;
    if (k >= 4) rows.push({ faces: st.facesDrawn, stat: st.staticFaces, dyn: st.dynFaces, lo: st.loFaces, blits: st.blits, draws: st.pointDraws, bodyCorners });
    r.drawMesh(court, model, null);
    bodies.forEach((b, i) => {
      if (s.posed) b._poseGen++;
      const a = (i / Math.max(1, BODIES)) * Math.PI * 2, d = 3 + (i % 3);
      const at = courtToDungeon(Math.cos(a) * d, 0, Math.sin(a) * d);
      const m = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, at[0], at[1], at[2], 1]);
      r.recordShadowBody(b, m, [at[0], at[1] + 0.9, at[2], 1.1]);
    });
    r.drawScreenQuad({ id: 'ui' }, { x: 0, y: 0, w: 1, h: 1 });
  }
  const sum = (key) => rows.reduce((a, x) => a + x[key], 0);
  const max = (key) => Math.max(...rows.map((x) => x[key]));
  return { mean: (key) => sum(key) / rows.length, max, rows };
}

const flashes = [[3, 4], [-4, 3], [5, -2], [-2, -5], [1, 6]];
const landing = Math.round((FX_LIGHT_MS / 1000) * FPS);
const FRAMES = landing + 2;
const SCENARIOS = {
  'a still court, the crowd still': () => ({ boss: [0, 0], glow: GLOW_RANGE.ember, flashes: [], posed: false }),
  'the crowd posed, he stands': () => ({ boss: [0, 0], glow: GLOW_RANGE.ember, flashes: [], posed: true }),
  'he walks among them': (k) => ({ boss: [Math.cos(k / 40) * 4, Math.sin(k / 40) * 4], glow: GLOW_RANGE.ember, flashes: [], posed: true }),
  [`a Hellfire lands on five (${landing} frames lit)`]: (k) => ({ boss: [0, 0], glow: GLOW_RANGE.ember, flashes: k >= 0 && k < landing ? flashes : [], posed: true }),
};
console.log(`THE COURT'S SHADOW PASS - ${BODIES} Morrowind bodies about him (${BODY_CORNERS} corners each), a fighter's eye, Steady shadows, ${FRAMES} frames a case - a landing's lit frames and the two after (per frame: mean, worst)\n`);
console.log('case                                     arm       512 faces (static/dyn)    lo faces     blits     depth draws   body corners');
const f = (x) => x.toFixed(1).padStart(6);
for (const [name, sc] of Object.entries(SCENARIOS)) {
  for (const arm of ['now', 'carried']) {
    const o = run(arm, sc, FRAMES);
    console.log(`${name.padEnd(40)} ${arm.padEnd(8)} ${f(o.mean('faces'))} (${f(o.mean('stat'))}/${f(o.mean('dyn'))}) ${String(o.max('faces')).padStart(4)}  ${f(o.mean('lo'))} ${String(o.max('lo')).padStart(4)}  ${f(o.mean('blits'))} ${String(o.max('blits')).padStart(4)}  ${f(o.mean('draws'))} ${String(o.max('draws')).padStart(4)}  ${(o.mean('bodyCorners') / 1e6).toFixed(2).padStart(6)}M ${(o.max('bodyCorners') / 1e6).toFixed(2).padStart(5)}M`);
  }
}
