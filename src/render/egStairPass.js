// @ts-check
// EG-ZE (2026-10-12, Mac: "I said I want everything"; bible/11-Multiplayer/Elite-Gates.md section 7 - THE STAIR, "what
// the swap shows"): THE SPIRE'S STAIR ON THE VEIL - chosen by theme in ui/gateVeil.js beside Dagon's fire and the Hour's
// blades (render/gateVeil.js keeps the clock's law: `veilAt` times this one too, run at the stair's own pace -
// world/egLights.js EG_STAIR_VEIL). One triangle over the veil's own canvas, as theirs:
//   THE FALL (a band's first hall - world/egLook.js egStairOf): the band's void opening under the faller, THE SPIRE'S
//     UNDERSIDE - the torn academy the halls fell from, black, its ragged rim lit from below by the band's deep (the sky's
//     own, render/egSkyPass.js) - climbing away overhead as the fall goes on, embers and ash streaking up past the eye,
//     and the deep rising to meet it;
//   THE VEIL (every other step): the band's void, dim, its motes drifting up;
//   THE CUT (reduced motion - the port's row or the system's, ui/egAccess.js): the same void standing still.
// Each takes the screen in THE DITHER - the ordered Bayer pattern (render/orderedDither.js bayer4) against how much the
// veil has covered, a pixel all or nothing, so the world goes and comes back in the Spire's pixel art and never slides.
// Every pixel posterized through the same dither (the pixel law, SD_PIXEL_GLSL) in the band's own sky (world/egLook.js
// EG_SKIES - the sky the hall stands in); the canvas a third of the device's pixels, drawn pixelated. Output
// premultiplied. The hall it steps to is held centred over it by the veil's own label (ui/gateVeil.js).
//
// Not a DFU member. Ledger A (ELITE-GATES).
import { buildProgram } from './glProgram.js';
import { BAYER_GLSL, SD_PIXEL_GLSL } from './orderedDither.js';
import { EG_SKIES } from '../world/egLook.js';

/** The stair's modes (ui/gateVeil.js VEIL_EG_MODE): the full fall, the veil, the plain cut. */
export const EG_STAIR_MODE = Object.freeze({ fall: 0, veil: 1, cut: 2 });
/** THE FALL'S LOOK: how fast the underside climbs away (1/s - its share fallen is 1 - e^(-rate t)), where its lower edge
 *  starts and ends (screen half-heights over the middle - past 1 it is gone off the top), the embers' speed up the screen
 *  (half-heights a second), how dim the veil's void is, and the posterize's steps. */
export const EG_STAIR_LOOK = Object.freeze({ rate: 0.9, edge0: 0.15, edge1: 1.2, streak: 1.5, veilDim: 0.55, steps: 8 });

const v3 = (c) => `vec3(${c.map((v) => v.toFixed(4)).join(', ')})`;
const f4 = (v) => v.toFixed(4);

/** The underside's share fallen away after `t` seconds of the fall (0 at its first frame, toward 1). Pure - the
 *  shader's own law, pinned equal. */
export const egStairFallen = (t) => 1 - Math.exp(-Math.max(0, t) * EG_STAIR_LOOK.rate);

export const EG_STAIR_VS = `#version 300 es
layout(location = 0) in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;
export const EG_STAIR_FS = `#version 300 es
precision highp float;
uniform vec2 uRes;       // the canvas, pixels
uniform float uTime;     // seconds since the veil began
uniform float uCover;    // how much of the screen the veil has taken (render/gateVeil.js veilAt, at the stair's pace)
uniform float uMode;     // EG_STAIR_MODE
uniform int uBand;       // the band the step falls into
out vec4 o;
${BAYER_GLSL}${SD_PIXEL_GLSL}
const vec3 ZEN[4] = vec3[4](${EG_SKIES.map((s) => v3(s.zenith)).join(', ')});
const vec3 HOR[4] = vec3[4](${EG_SKIES.map((s) => v3(s.horizon)).join(', ')});
const vec3 DEEP[4] = vec3[4](${EG_SKIES.map((s) => v3(s.deep)).join(', ')});
const float EMBERS[4] = float[4](${EG_SKIES.map((s) => s.embers.toFixed(4)).join(', ')});
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
// the underside's share fallen away after t seconds (egStairFallen)
float fallen(float t) { return 1.0 - exp(-max(0.0, t) * ${f4(EG_STAIR_LOOK.rate)}); }
// the underside's ragged lower edge at x after t seconds of the fall (screen half-heights over the middle)
float undersideEdge(float x, float t) {
  return mix(${f4(EG_STAIR_LOOK.edge0)}, ${f4(EG_STAIR_LOOK.edge1)}, fallen(t)) + 0.12 * (vn(vec2(x * 3.0, 0.0)) - 0.5) + 0.05 * (vn(vec2(x * 11.0, 3.0)) - 0.5);
}
// what the stair shows at p (screen half-heights, the middle at 0) after t seconds, in band b
vec3 stairScene(vec2 p, float t, int b, float mode) {
  float e = p.y;
  vec3 c = e < 0.0 ? mix(HOR[b], DEEP[b], smoothstep(0.0, 1.0, -e)) : mix(HOR[b], ZEN[b], smoothstep(0.0, 0.8, e));
  if (mode < 0.5) {
    // THE FALL: the deep rising to meet the faller, embers streaking up past the eye, the underside climbing away
    float k = fallen(t);
    c += DEEP[b] * 0.35 * k * smoothstep(0.0, -1.0, e);
    vec2 g = vec2(p.x * 26.0, e * 6.0 - t * ${f4(EG_STAIR_LOOK.streak * 6)});
    float r = h21(floor(g));
    if (r > 0.9 && abs(fract(g.x) - 0.5) < 0.08) c += DEEP[b] * 0.7 * fract(g.y);
    float edge = undersideEdge(p.x, t);
    if (e > edge) c = vec3(0.012, 0.010, 0.012) + DEEP[b] * 0.25 * smoothstep(edge + 0.03, edge, e);
    return c;
  }
  // THE VEIL and THE CUT: the band's void, dim; the veil's motes drifting up, the cut's standing still
  c *= ${f4(EG_STAIR_LOOK.veilDim)};
  if (EMBERS[b] > 0.0) {
    vec2 g = vec2(p.x * 30.0, e * 30.0 - (mode < 1.5 ? t * 0.8 : 0.0));
    if (h21(floor(g)) > 1.0 - 0.03 * EMBERS[b] && length(fract(g) - 0.5) < 0.2) c += DEEP[b] * 0.5;
  }
  return c;
}
void main() {
  vec2 px = floor(gl_FragCoord.xy);
  // THE DITHER: a pixel the veil has not yet taken shows the world under it
  if (bayer4(px) >= uCover) { o = vec4(0.0); return; }
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / (0.5 * uRes.y);
  vec3 c = stairScene(p, uTime, clamp(uBand, 0, 3), uMode);
  o = vec4(sdPixel(c, px, ${f4(EG_STAIR_LOOK.steps)}), 1.0);
}`;

/** The stair's pass, one triangle over the veil's canvas. `draw(w, h, t, v, look)` - `v` a veilAt answer (its `cover`),
 *  `look` `{ mode, band }`. */
export class EgStairRenderer {
  /** @param {WebGL2RenderingContext} gl */
  constructor(gl) {
    this.gl = gl;
    this.prog = buildProgram(gl, EG_STAIR_VS, EG_STAIR_FS, 'eg stair');
    this.u = {};
    for (const n of ['uRes', 'uTime', 'uCover', 'uMode', 'uBand']) this.u[n] = gl.getUniformLocation(this.prog, n);
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
    gl.bindVertexArray(null);
  }
  draw(w, h, t, v, look) {
    const gl = this.gl, U = this.u;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.prog);
    gl.uniform2f(U.uRes, w, h);
    gl.uniform1f(U.uTime, t);
    gl.uniform1f(U.uCover, v.cover);
    gl.uniform1f(U.uMode, look?.mode ?? EG_STAIR_MODE.veil);
    gl.uniform1i(U.uBand, (look?.band ?? 0) | 0);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }
  destroy() {
    const gl = this.gl;
    gl.deleteBuffer(this.vbo); gl.deleteVertexArray(this.vao); gl.deleteProgram(this.prog);
  }
}
