// @ts-check
// EG-G2 (2026-10-12, Mac: "I said I want everything"; bible/11-Multiplayer/Elite-Gates.md sections 7 and 25 - EG16's
// "the skies (the Spire's underside in every sky, smaller each band)"): THE SPIRE'S SKIES - each band's own void over its
// halls, where EG-PLAY drew the Hour's (its clock-face and the Bay's cities hanging in it were the Hour's story, not the
// Spire's):
//   THE BROKEN GALLERIES - the Deadlands' red overhead, the fire-sea glowing below the horizon, embers rising;
//   THE SOUL CAIRN - violet-grey, the sea of mist below, a few slow motes;
//   THE SHADE PERILOUS - near-black, its moon and a scatter of cold stars, the dark below;
//   THE HAVOC WELLHEAD - smoke over molten light, sparks thick in it.
// In every one, THE SPIRE'S UNDERSIDE hangs overhead - the torn academy the halls fell from, a black mass with a ragged
// rim lit from below by the band's deep - smaller each band (world/egLook.js EG_SKIES `underside`, an angular radius), so
// a company sees how far down the legions' road it has fallen.
//
// The Hour's law (render/sdSky.js): one triangle at the far plane, drawn only where nothing nearer has (PERF2), every
// pixel posterized through the ordered dither (render/orderedDither.js SD_PIXEL_GLSL - the pixel law), its colours scaled
// by the realm's `gain` against its fog (render/deadlands.js skyGain) and the horizon meeting the fog's own colour. The
// void stays dark and structure does not glow (SD-LOOK's rules): the underside is black but for its rim.
//
// A foreign pass: it owns its program and its state; the host marks it. Not a DFU member. Ledger A (ELITE-GATES).
import { buildProgram } from './glProgram.js';
import { BAYER_GLSL, SD_PIXEL_GLSL } from './orderedDither.js';
import { sdSkyBasisInto } from './sdSky.js';
import { EG_SKIES } from '../world/egLook.js';

const v3 = (c) => `vec3(${c.map((v) => v.toFixed(4)).join(', ')})`;

export const EG_SKY_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
uniform vec3 uRight, uUp, uFwd;
uniform vec4 uProj;
out vec3 vRay;
void main() {
  vRay = uRight * ((aPos.x + uProj.z) / uProj.x) + uUp * ((aPos.y + uProj.w) / uProj.y) + uFwd;
  gl_Position = vec4(aPos, 1.0, 1.0); }`;
export const EG_SKY_FS = `#version 300 es
precision highp float;
in vec3 vRay;
uniform int uBand;       // 0 the Galleries, 1 the Cairn, 2 the Shade, 3 the Wellhead
uniform float uTime;     // s, wrapped
uniform vec3 uHaze;      // the frame's fog colour - the horizon meets it
uniform float uGain;
uniform float uSteps;
out vec4 o;
${BAYER_GLSL}${SD_PIXEL_GLSL}
const vec3 ZEN[4] = vec3[4](${EG_SKIES.map((s) => v3(s.zenith)).join(', ')});
const vec3 HOR[4] = vec3[4](${EG_SKIES.map((s) => v3(s.horizon)).join(', ')});
const vec3 DEEP[4] = vec3[4](${EG_SKIES.map((s) => v3(s.deep)).join(', ')});
const float UNDER[4] = float[4](${EG_SKIES.map((s) => s.underside.toFixed(4)).join(', ')});
const float LEAN[4] = float[4](${EG_SKIES.map((s) => s.lean.toFixed(4)).join(', ')});
const float EMBERS[4] = float[4](${EG_SKIES.map((s) => s.embers.toFixed(4)).join(', ')});
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
void main() {
  vec3 d = normalize(vRay);
  int b = clamp(uBand, 0, 3);
  float e = d.y, az = atan(d.x, d.z);
  // the void: the deep below the horizon (the fire-sea, the mist, the dark, the molten), the band's own overhead
  vec3 c = e < 0.0 ? mix(HOR[b], DEEP[b], 1.0 - smoothstep(-0.4, 0.0, e)) : mix(HOR[b], ZEN[b], smoothstep(0.0, 0.55, e));
  c = mix(c, uHaze, (1.0 - smoothstep(0.0, 0.12, abs(e))) * 0.6);   // the horizon meets the fog
  // the deep's slow churn, below the horizon
  if (e < 0.0) c *= 0.8 + 0.4 * vn(vec2(az * 6.0, e * 30.0 + uTime * 0.05));
  // embers and motes rising (the Galleries' and the Wellhead's sparks, the Cairn's few motes)
  if (EMBERS[b] > 0.0 && e > -0.2 && e < 0.7) {
    vec2 g = vec2(az * 40.0, e * 60.0 - uTime * 0.6);
    vec2 cell = floor(g);
    float r = h21(cell);
    if (r > 1.0 - 0.04 * EMBERS[b] && length(fract(g) - 0.5) < 0.18) c += DEEP[b] * (0.6 + 0.4 * sin(uTime * 3.0 + r * 40.0));
  }
  // the Shade's moon and its cold stars
  if (b == 2) {
    vec3 mdir = normalize(vec3(0.55, 0.42, -0.72));
    float m = dot(d, mdir);
    c += vec3(0.62, 0.66, 0.74) * smoothstep(0.9985, 0.9991, m) + vec3(0.05, 0.055, 0.07) * smoothstep(0.985, 0.9985, m);
    vec2 sg = floor(vec2(az * 90.0, e * 90.0));
    if (e > 0.05 && h21(sg) > 0.996) c += vec3(0.35, 0.37, 0.42);
  }
  // THE SPIRE'S UNDERSIDE: a black mass overhead leaning toward the course, its ragged rim lit from below by the deep
  vec3 axis = normalize(vec3(0.0, cos(LEAN[b]), sin(LEAN[b])));
  float ang = acos(clamp(dot(d, axis), -1.0, 1.0));
  vec3 side = normalize(cross(axis, vec3(1.0, 0.0, 0.0))), up2 = cross(side, axis);
  float around = atan(dot(d, side), dot(d, up2));
  float ragged = UNDER[b] * (1.0 + 0.16 * (vn(vec2(around * 3.0, 0.0)) - 0.5) + 0.08 * (vn(vec2(around * 11.0, 4.0)) - 0.5));
  if (ang < ragged) {
    float rim = smoothstep(ragged - 0.012, ragged, ang);
    vec3 under = vec3(0.012, 0.010, 0.012) * (0.8 + 0.4 * vn(vec2(around * 8.0, ang * 60.0)));
    c = under + DEEP[b] * 0.22 * rim;
  }
  o = vec4(sdPixel(c * uGain, floor(gl_FragCoord.xy), uSteps), 1.0);
}`;

/** The pass. */
export class EgSkyPass {
  /** @param {WebGL2RenderingContext} gl */
  constructor(gl) {
    this.gl = gl;
    this.program = buildProgram(gl, EG_SKY_VS, EG_SKY_FS, 'eg sky');
    this.u = {};
    for (const n of ['uRight', 'uUp', 'uFwd', 'uProj', 'uBand', 'uTime', 'uHaze', 'uGain', 'uSteps']) this.u[n] = gl.getUniformLocation(this.program, n);
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
    gl.bindVertexArray(null);
    this._b = { right: new Float32Array(3), up: new Float32Array(3), fwd: new Float32Array(3), lens: new Float32Array(4) };
    this.drawn = false;
  }
  /** Paint band `band`'s sky where nothing nearer has drawn - `seconds` any clock, `fog` the frame's, `gain` the realm's
   *  light against its own. Answers true. */
  draw(proj, view, band, seconds, fog = null, gain = 1, steps = 10) {
    const gl = this.gl, U = this.u, b = sdSkyBasisInto(view, proj, this._b);
    gl.disable(gl.BLEND); gl.disable(gl.CULL_FACE);
    gl.useProgram(this.program);
    gl.uniform3fv(U.uRight, b.right); gl.uniform3fv(U.uUp, b.up); gl.uniform3fv(U.uFwd, b.fwd); gl.uniform4fv(U.uProj, b.lens);
    gl.uniform1i(U.uBand, band | 0);
    gl.uniform1f(U.uTime, seconds % 3600);
    gl.uniform3fv(U.uHaze, fog?.color ?? NO_HAZE);
    gl.uniform1f(U.uGain, gain);
    gl.uniform1f(U.uSteps, steps);
    gl.depthMask(false);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);   // PERF2: only where nothing nearer has drawn - z is the far plane
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.depthFunc(gl.LESS); gl.depthMask(true);
    gl.bindVertexArray(null);
    gl.enable(gl.CULL_FACE);
    this.drawn = true;
    return true;
  }
  destroy() { const gl = this.gl; gl.deleteBuffer(this.vbo); gl.deleteVertexArray(this.vao); gl.deleteProgram(this.program); }
}
const NO_HAZE = new Float32Array(3);
