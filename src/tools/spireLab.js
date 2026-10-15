// THE SPIRE LAB (EG-G2, 2026-10-12, Mac: "I said I want everything"; bible/11-Multiplayer/Elite-Gates.md section 25 - EG16's
// "the lab checks, frame-synced probes"). An Elite Breach's circle drawn by the game's own renderer and the Spire's own
// parts, with no game data - every piece of it is made in code: the halls (world/egHall.js) in their band's dress
// (world/egBandArt.js), the pieces batched and culled (scenes/egSpan.js, scenes/egPieceBatch.js), the waystones (world/
// egLook.js), the sky, the mist and THE EDGE LINE (scenes/egLookDraw.js), and a telegraph through the Spire's own stage
// in the shelf's danger palette (render/gateTelegraph.js TELEGRAPH_FS_SPIRE, scenes/egFight.js egLookShapes). The frame is
// the dungeon arm's for a circle (scenes/worldModes.js: the Spire's trilight and key, its haze and the Hour's grade, its
// lamps, the circle and the dynamic draws, the cull before them, the sky after the solid geometry, the fight's pass last)
// in the same calls, so what this page shows is what a member in the Spire sees.
//
//   ?band=0-3        a circle of that band (its first: 1, 6, 11, 16)    ?c=<circle> instead      ?seed=<n> (7 by default)
//   ?h=<slot 0-4>    the hall of the circle the views stand in
//   ?view=plate|course|court|sky|over|edge|under|wide   a camera (the panel's list) - EG-LOOK: `under` a court's foundations
//                    from below its rim, `wide` the wreck and the Spire overhead from far out
//   ?t=<seconds>     the shared clock, pinned           ?still the clock stopped     ?lane=off the classic set
//   ?palette=standard|contrast|deutan|tritan  ?fill=50-100   a danger disc on the court in that look (?shape=off: none)
//   ?mist            a circle with a Mist Stair or the Sinking Stair, the camera over its sheet, the clock at its surge
//   ?grey            the frame in grey (the lab check's)  ?nopanel the panel hidden (probes)
//   ?frames=<n>      draw n frames and rest (a probe reads the last - tools/spireLabProbe.mjs)
// `window.__frame` counts drawn frames (the probes frame-sync on it - bible/Home.md's Process); `window.__lab` answers a
// probe's questions (the batch's stats, the look's state).
import { Renderer, WORLD_FRAME, INTERIOR_CLEAR } from '../render/renderer.js';
import { EL_LANE, dungeonFog, dungeonTrilight, exposureFor } from '../render/enhancedLighting.js';
import { applyFog } from '../render/underwaterFog.js';
import { skyGain } from '../render/deadlands.js';
import { GateTelegraphRenderer, TELEGRAPH_KIND, TELEGRAPH_STYLE, TELEGRAPH_EDGE_DAGON, TELEGRAPH_EDGE_SAFE, TELEGRAPH_POOL } from '../render/gateTelegraph.js';
import { realmArt } from '../world/sdRealmArt.js';
import { SD_REALM_ARCHIVE } from '../world/sdRealm.js';
import { buildEgCircleModel, egCircleLights, egLightsWith, egHallLighting, egHallFog, egHallGrade, egToDungeon, egHallCentre } from '../world/egHall.js';
import { createEgGroundLook } from '../scenes/egGroundLook.js';   // EG-LOOK: the ruin and the wreck, as the circle's host stands them
import { egBandArt, egBandArchive } from '../world/egBandArt.js';
import { buildEgLookModel, egMistSheets } from '../world/egLook.js';
import { egPaletteOf, egFillOf } from '../ui/egAccess.js';   // the shelf's palette and fill, their one home
import { createEgSpan } from '../scenes/egSpan.js';
import { createEgLookDraw } from '../scenes/egLookDraw.js';
import { egLookShapes } from '../scenes/egFight.js';
import { egCircleSpecs, egFirstHallOf, egBandOfCircle } from '../net/egLaw.js';
import { egMistAt } from '../net/egFragLaw.js';
import { INTERIOR_LIGHT_DIR } from '../world/interiorLights.js';
import { perspective, lookAt, identity, mirrorProjectionX } from '../world/mat4.js';

const params = new URLSearchParams(location.search);
const canvas = document.getElementById('c');
const $ = (id) => document.getElementById(id);
if (params.has('nopanel')) $('panel').style.display = 'none';
if (params.has('grey')) canvas.style.filter = 'grayscale(1)';
canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });
const renderer = new Renderer(canvas);
const gl = renderer.gl;

// ── the circle ─────────────────────────────────────────────────────────────────────────────────────────────────
const SEED = Number(params.get('seed') ?? 7) >>> 0;
/** The circle: ?c, or the first of ?band's, or (?mist) the first circle with a mist sheet. */
function pickCircle() {
  if (params.has('c')) return Number(params.get('c'));
  if (params.has('mist')) for (let c = 6; c <= 20; c++) if (egMistSheets(egCircleSpecs(SEED, c, 0)).length) return c;
  return [1, 6, 11, 16][Math.max(0, Math.min(3, Number(params.get('band') ?? 0)))];
}
const C = pickCircle(), BAND = egBandOfCircle(C), SPECS = egCircleSpecs(SEED, C, 0);
const MIST = params.has('mist') ? egMistSheets(SPECS)[0] ?? null : null;
const SLOT = MIST ? SPECS.indexOf(MIST.spec) : Math.max(0, Math.min(4, Number(params.get('h') ?? 0)));
const SPEC = SPECS[SLOT];
for (const [rec, art] of realmArt()) { renderer.uploadTexture(SD_REALM_ARCHIVE, rec, art.albedo); renderer.uploadEmissionTexture?.(SD_REALM_ARCHIVE, rec, art.emission, { white: true }); }
for (const [rec, art] of egBandArt(BAND)) { renderer.uploadTexture(egBandArchive(BAND), rec, art.albedo); renderer.uploadEmissionTexture?.(egBandArchive(BAND), rec, art.emission, { white: true }); }
const circleMesh = renderer.createMesh(buildEgCircleModel(SEED, C, 0));
const lookModel = buildEgLookModel(SEED, C, 0), lookMesh = lookModel ? renderer.createMesh(lookModel) : null;
const lamps = egCircleLights(SEED, C, 0);
const dynamicDraws = [];
const span = createEgSpan({ renderer, seed: SEED, c: C, geo: 0 });
span.stand({ dynamicDraws, collider: null });
const ground = createEgGroundLook({ renderer, lite: params.has('lite') });   // EG-LOOK (?lite: the phones' tier)
for (const d of ground.stand(SEED, C, 0)) dynamicDraws.push(d);
const look = createEgLookDraw({ gl });
look.setCircle(SEED, C, 0);
const telegraph = new GateTelegraphRenderer(gl, { spire: true });

/** The cameras, in hall SPEC's frame (x across, y up, z along the course; yaw 0 down the course, degrees). */
const court = SPEC.fight ?? SPEC.discs.find((d) => d.role === 'court') ?? SPEC.end ?? SPEC.arrive;
const VIEWS = {
  plate: { at: [0, 1.7, SPEC.arrive?.z ?? 0], yaw: 0, pitch: -6 },
  course: { at: [6, 7, (SPEC.len ?? 80) * 0.3], yaw: -12, pitch: -16 },
  court: { at: [court.x - 4, (court.y ?? 0) + 9, court.z - (court.r ?? 12) - 6], yaw: 8, pitch: -28 },
  sky: { at: [0, 1.7, SPEC.arrive?.z ?? 0], yaw: 0, pitch: 52 },
  over: { at: [40, 45, (SPEC.len ?? 80) * 0.2], yaw: -40, pitch: -30 },
  edge: { at: [(SPEC.arrive?.r ?? 5) - 1.5, 1.2, (SPEC.arrive?.z ?? 0) + 1], yaw: 70, pitch: -24 },
  mist: MIST ? { at: [(MIST.x0 + MIST.x1) / 2, MIST.hz.y + 6.5, MIST.z0 - 3], yaw: 0, pitch: -38 } : null,
  under: { at: [court.x + (court.r ?? 12) + 14, (court.y ?? 0) - 9, court.z - 6], yaw: -110, pitch: 18 },   // EG-LOOK: the court's foundations, from a span below its rim
  wide: { at: [-70, 26, (SPEC.len ?? 80) * 0.15], yaw: 55, pitch: 4 },   // EG-LOOK: the wreck drifting, the Spire overhead
};
const viewSel = $('view');
for (const k of Object.keys(VIEWS)) if (VIEWS[k]) { const o = document.createElement('option'); o.value = o.textContent = k; viewSel.append(o); }
viewSel.value = VIEWS[params.get('view')] ? params.get('view') : MIST ? 'mist' : 'plate';
if (params.get('lane') === 'off') $('lane').checked = false;
if (params.has('still') || params.has('t')) $('still').checked = true;
const cam = { pos: [0, 0, 0], yaw: 0, pitch: 0 };
function setView(name) {
  const v = VIEWS[name] ?? VIEWS.plate;
  cam.pos = egToDungeon(SPEC, v.at[0], v.at[1], v.at[2]);
  cam.yaw = (v.yaw * Math.PI) / 180; cam.pitch = (v.pitch * Math.PI) / 180;
}
setView(viewSel.value);
viewSel.addEventListener('change', () => setView(viewSel.value));
/** The shared clock: ?t, or (?mist) the moment its surge stands highest, or running. */
let clock = Number(params.get('t') ?? 40);
if (MIST && !params.has('t')) { for (let k = 0; k < 4000; k++) if (egMistAt(MIST.hz, k / 100) >= 3) { clock = k / 100 + 1; break; } }
$('t').value = String(clock);
$('t').addEventListener('input', () => { clock = Number($('t').value); });

let laneOn = null;
function syncLane() {
  const on = $('lane').checked;
  if (on === laneOn) return;
  laneOn = on;
  renderer.setLightingLane(on ? EL_LANE : null);
  if (on) { renderer.setExposure?.(exposureFor('')); renderer.setAir?.(true); }
}

// ── a danger disc on the court in the shelf's look (and a haven beside it) ─────────────────────────────────────
const LOOK = { palette: egPaletteOf(params.get('palette') ?? 'standard'), fill: egFillOf(Number(params.get('fill') ?? 100) / 100) };   // `?fill=` in percent, as the shelf's row says it
const centre = egHallCentre(SPEC);
function shapesNow(t) {
  if (params.get('shape') === 'off') return [];
  const base = { yaw: 0, halfArc: 0, body: 0, end: [0, 0], halfW: 0, r0: 0, r1: 0, points: [], n: 0, flash: 0, alpha: 1, court: 0, since: 0.8, span: 1.5, after: -1, runS: 0, look: 0, fillK: 1, fogFloor: null };
  const danger = { ...base, kind: TELEGRAPH_KIND.disc, origin: [court.x, court.z - 2], r: 5, t: ((t % 1.5) / 1.5), color: [1, 0.4, 0.1], edge: TELEGRAPH_EDGE_DAGON, style: TELEGRAPH_STYLE.fire, pool: TELEGRAPH_POOL.blow, mine: false };
  const haven = { ...base, kind: TELEGRAPH_KIND.disc, origin: [court.x + 8, court.z + 3], r: 3, t: 1, color: [1.0, 0.82, 0.38], edge: TELEGRAPH_EDGE_SAFE, style: TELEGRAPH_STYLE.weight, pool: TELEGRAPH_POOL.ground, mine: false };
  return egLookShapes([danger, haven], LOOK, 'trial');
}

// ── the frame ──────────────────────────────────────────────────────────────────────────────────────────────────
const NO_SHADOW = Object.freeze({ noShadow: true }), WITH_SHADOW = Object.freeze({ noShadow: false });
const EMPTY_LIT = { data: new Float32Array(0), colors: new Float32Array(0), carried: new Uint8Array(0) };
const fogNow = { mode: 'exp', density: 0, range: 0, color: [0, 0, 0], camPos: [0, 0, 0] };
const courtFogNow = () => { fogNow.mode = renderer._fogMode; fogNow.density = renderer._fogDensity; fogNow.range = renderer._fogRange; fogNow.color = renderer._fogColor; fogNow.camPos = renderer._camPos; return fogNow; };
const equator = (t) => { const e = t.equator; return new Float32Array([e[0], e[1], e[2]]); };
const floor = SPEC.fight ? { r: SPEC.fight.r + 6, courts: [[SPEC.fight.x, SPEC.fight.z]] } : { r: 40, courts: [[0, (SPEC.len ?? 80) / 2]] };
const keys = new Set();
addEventListener('keydown', (e) => keys.add(e.code));
addEventListener('keyup', (e) => keys.delete(e.code));
let drag = null;
canvas.addEventListener('pointerdown', (e) => { drag = [e.clientX, e.clientY]; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => { if (!drag) return; cam.yaw -= (e.clientX - drag[0]) * 0.005; cam.pitch = Math.max(-1.5, Math.min(1.5, cam.pitch - (e.clientY - drag[1]) * 0.005)); drag = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', () => { drag = null; });
let last = performance.now();
window.__frame = 0;
window.__lab = { circle: C, band: BAND, hall: egFirstHallOf(C) + SLOT, batch: () => span.batchStats(), look: () => look.state(), stats: () => ({ ground: ground.stats(), draws: dynamicDraws.filter((d) => !d.hidden && !d.culled).length }), eye: (x, y, z, yawDeg, pitchDeg) => { cam.pos = [x, y, z]; cam.yaw = (yawDeg * Math.PI) / 180; cam.pitch = (pitchDeg * Math.PI) / 180; }, view: (n) => { viewSel.value = n; setView(n); } };

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (!$('still').checked) { clock += dt; $('t').value = String(clock); }
  $('tV').textContent = clock.toFixed(1);
  syncLane();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.floor(canvas.clientWidth * dpr), h = Math.floor(canvas.clientHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const fwd = [Math.sin(cam.yaw) * Math.cos(cam.pitch), Math.sin(cam.pitch), Math.cos(cam.yaw) * Math.cos(cam.pitch)];
  const right = [Math.cos(cam.yaw), 0, -Math.sin(cam.yaw)];
  const sp = (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 24 : 6) * dt;
  const mv = (v, s) => { cam.pos[0] += v[0] * s; cam.pos[1] += v[1] * s; cam.pos[2] += v[2] * s; };
  if (keys.has('KeyW')) mv(fwd, sp); if (keys.has('KeyS')) mv(fwd, -sp);
  if (keys.has('KeyD')) mv(right, -sp); if (keys.has('KeyA')) mv(right, sp);
  if (keys.has('KeyE')) cam.pos[1] += sp; if (keys.has('KeyQ')) cam.pos[1] -= sp;
  const view = lookAt(cam.pos, [cam.pos[0] + fwd[0], cam.pos[1] + fwd[1], cam.pos[2] + fwd[2]], [0, 1, 0]);
  const proj = mirrorProjectionX(perspective((65 * Math.PI) / 180, w / h, 0.1, 2000));
  const lane = !!renderer.lightingLane;
  // the circle, as the dungeon arm draws it (scenes/worldModes.js - the Spire's light, its haze, the Hour's grade, its lamps)
  const L = egHallLighting(C), T = dungeonTrilight(lane, L.tri);
  renderer.setLighting(equator(T), 0, undefined, T);
  renderer.setMoonlight(L.key);
  applyFog(renderer, dungeonFog(lane, egHallFog(C)));
  renderer.setSceneGrade?.(egHallGrade(C));
  ground.frame(cam.pos, clock);   // EG-LOOK: the eye's hall's ruin drawn, the wreck placed about it (scenes/egCircleHost.js egCircleFrame)
  const lit = egLightsWith(EMPTY_LIT, [], lamps, cam.pos);
  renderer.setPointLights(lit.data, null, lit.colors);
  renderer.setClearColor(INTERIOR_CLEAR);
  span.ride(clock, dt, null, false);
  renderer.beginFrame(proj, view, INTERIOR_LIGHT_DIR, WORLD_FRAME);
  renderer.drawMesh(circleMesh, identity(), null);
  span.cull(proj, view);   // the dungeon arm's own line, before its draws
  if (lookMesh) renderer.drawMesh(lookMesh, identity(), null, NO_SHADOW);
  for (const d of dynamicDraws) if (!d.hidden && !d.culled) renderer.drawMesh(d.gpu, d.object.matrix, d.texRemap ?? null, d.noShadow ? NO_SHADOW : WITH_SHADOW);
  if (look.drawSky(proj, view, clock, courtFogNow(), skyGain(renderer._fogColor, egHallFog(C).color))) renderer.markForeignPass();
  // the fight's pass: the mist, the telegraphs, the lines last (scenes/egClient.js drawPass)
  if (look.drawUnder(proj, view, cam.pos, clock, courtFogNow())) renderer.markForeignPass();
  for (const sh of shapesNow(clock)) { telegraph.draw(sh, proj, view, cam.pos, clock, courtFogNow(), centre, null, floor); if (telegraph.drawn > 0) renderer.markForeignPass(); }
  if (params.get('lines') !== 'off' && look.drawOver(proj, view, cam.pos, clock, courtFogNow())) renderer.markForeignPass();   // ?lines=off: the probe's frame without them, to tell the line pass's own pixels
  renderer.resolveFrame();
  window.__frame++;
  if (params.has('frames') && window.__frame >= Number(params.get('frames'))) return;   // a probe's still: the frames it reads, then the page rests (SwiftShader draws a circle in seconds)
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
