// @ts-check
// WEAPON-GLOW1 (2026-10-16; bible/05-Combat/Weapon-Glow.md): THE GLOW'S DRAWING - one design, two drawers. A leaf: the
// shaders' source and the numbers they are drawn by, no import (render/renderer.js builds the programs and issues the
// draws; systems/weaponGlow.js decides what a weapon shows).
//
// THE DESIGN. An element's glow is an OUTLINE that lives: a band round the weapon's silhouette, hottest at the edge and
// cooling outward in four steps of the element's ramp (systems/weaponGlow.js GLOW_RAMPS - Daggerfall's own way with
// light, a few palette shades and never a smooth blend), its REACH - how far the band stands off the edge - moving:
//   - FIRE: tongues that climb. The reach is two octaves of value noise scrolled up the screen, stretched upward and
//     cut short below (a flame rises), and an ember now and then drifts up off the top.
//   - FROST: a rime that breathes. A square reach (the Chebyshev metric - ice is angular), still spikes where a cell's
//     hash says so, a slow pulse, and a glint that flashes white on a crystal for a fifth of a second.
//   - SHOCK: an edge that crackles. A diamond reach (Manhattan - jagged), a band that flickers in 2x2 blocks at
//     twelve steps a second, arcs thrown out where a stepped noise peaks, and a surge a few times a second.
//   - ARCANE (the Morrowind hand's enchanted look - systems/weaponGlow.js law 5): an even halo that turns slowly.
// Inside the silhouette the weapon's own edge takes the element's light (the RIM), so the outline reads as the
// weapon's and not a sticker behind it.
//
// THE TWO DRAWERS.
//   - THE CLASSIC SPRITE (Renderer.drawScreenQuadGlow): one quad over the frame's own rect, grown by the search window,
//     that reads the frame's texels (texelFetch) and measures each texel's distance to the nearest opaque one in the
//     look's metric. Evaluated per TEXEL, so the outline is drawn in the sprite's own pixels.
//   - THE MORROWIND MESH (Renderer._drawWeaponGlow, inside drawCharacter's sprite pass): the weapon's ranges drawn
//     again, SHIFTED in screen space round GLOW_DIRS directions at each of GLOW_RINGS distances - the union of a ring's
//     copies is the silhouette dilated by its distance, so the ring's fragment knows its band without searching - at
//     the BACK of the pass and before the body, so the real weapon and everything else the pass draws cover them, an
//     inner ring nearer than an outer so it paints over it. Opaque, because the arm's composite cuts at half alpha
//     (drawScreenOverlayQuad). Then, after the body, the CHARGE: the weapon's own surface again, additive, lit at its
//     rim and patterned by its element - the detail a model can carry that a 2D frame cannot. The ring's `c` is the fragment's place in glow UNITS (a Daggerfall pixel at
//     the pass's height, GLOW_UNIT_ROWS), so a flame on a model is a flame the size of one on a sprite.
//
// THE CLOCK. Every rate is whole over GLOW_CLOCK_PERIOD (the renderer wraps its seconds there): the scrolls' noise is
// periodic in y over exactly the cells a period scrolls (gwNoise's `py`), the pulses' periods divide it, and the stepped
// hashes start their count again - so the wrap is a frame like any other, never a jump in a flame.

/** The seconds the glow's clock wraps at - every rate below is whole over it. */
export const GLOW_CLOCK_PERIOD = 240;
/** A glow unit is a Daggerfall pixel: the pass's height over Daggerfall's 200 rows. */
export const GLOW_UNIT_ROWS = 200;
/** The Morrowind outline's bands, in glow units from the edge - drawn outermost first. */
export const GLOW_RINGS = Object.freeze([4.75, 3.25, 2, 1]);
/** The directions a ring's copies are shifted round. */
export const GLOW_DIRS = 12;
/** Fire's reach is stretched upward and cut short below: the up and down factors on a shift's y (the sprite's metric
 *  is the same pair, inverted - gwMetric). */
export const GLOW_FIRE_UP = 1.8;
export const GLOW_FIRE_DOWN = 0.6;
/** A third-person body's window grows by this share of its height a side while its weapon glows (combat/fpArm.js
 *  drawThird): the outline stands up to GLOW_RINGS[0] units off the weapon - fire's GLOW_FIRE_UP times that up, its
 *  embers GLOW_EMBER_RISE's last - and a unit is 1/GLOW_UNIT_ROWS of the picture, so the ember's 9 units are 4.5% of
 *  it; a tenth more height is a twentieth a side. */
export const GLOW_BOX_GROW = 0.1;
/** The embers' shifts over a fire weapon (glow units, straight up and a hair to either side). */
export const GLOW_EMBER_RISE = Object.freeze([6, 7.5, 9]);
/** WHERE A RING STANDS IN DEPTH: at the back of the pass, NDC z `GLOW_RING_FAR + ring x GLOW_RING_STEP` - an outer ring
 *  farther than an inner one, so the inner paints over it, and every ring behind anything the pass draws after it. The
 *  rings are drawn BEFORE the body: a shifted copy of a tilted blade can stand nearer than the blade's own surface at
 *  a pixel, and drawn after it the rings painted over the weapon they outline (the probe saw it, tools/
 *  weaponGlowProbe.mjs). An ember stands at the front of the rings. The charge's pull is toward the eye, a hair - its
 *  vertex shader is another program's arithmetic, and LEQUAL alone would lose a texel where the two round apart. */
export const GLOW_RING_FAR = 0.99985;
export const GLOW_RING_STEP = 2e-5;
export const GLOW_CHARGE_PULL = -1e-5;
/** The sprite's search window per look, in texels: [half-width, rows above the texel, rows below it]. Fire looks
 *  farther DOWN for a solid texel (a flame stands over its weapon) and less far up. */
export const GLOW_SPRITE_WINDOW = Object.freeze({
  fire: Object.freeze([6, 4, 13]),
  frost: Object.freeze([5, 5, 5]),
  shock: Object.freeze([6, 6, 6]),
  arcane: Object.freeze([4, 4, 4]),
});

/** The shared half: hash, periodic value noise, and the four looks' reach, shade, rim and charge. `c` is a place in
 *  glow cells with y UP; `uRamp` the look's four stops, dark to hot. */
export const GLOW_LOOK_GLSL = `
uniform vec3 uRamp[4];
float gwHash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
// value noise, periodic in y over py lattice rows - a scroll of exactly py rows a clock period wraps seamlessly
float gwNoise(vec2 x, float py) {
  vec2 i = floor(x);
  vec2 f = x - i;
  vec2 u = f * f * (3.0 - 2.0 * f);
  float y0 = mod(i.y, py);
  float y1 = mod(i.y + 1.0, py);
  float a = gwHash(vec2(i.x, y0));
  float b = gwHash(vec2(i.x + 1.0, y0));
  float c = gwHash(vec2(i.x, y1));
  float d = gwHash(vec2(i.x + 1.0, y1));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
// the distance a texel is from a solid one, in the look's own metric (o: from the texel to the solid, y up)
float gwMetric(int look, vec2 o) {
  if (look == 1) return length(vec2(o.x, o.y * (o.y < 0.0 ? ${(1 / GLOW_FIRE_UP).toFixed(6)} : ${(1 / GLOW_FIRE_DOWN).toFixed(6)})));
  if (look == 2) return max(abs(o.x), abs(o.y));
  if (look == 3) return abs(o.x) + abs(o.y);
  return length(o);
}
// how far the band stands off the edge here, now
float gwReach(int look, vec2 c, float t, float lv) {
  if (look == 1) {
    float n1 = gwNoise(vec2(c.x * 0.45, c.y * 0.3 - t * 2.0), 480.0);
    float n2 = gwNoise(vec2(c.x * 0.9 + 17.0, c.y * 0.6 - t * 4.0), 960.0);
    return (1.2 + 1.0 * lv) * (0.5 + n1 * (0.75 + 0.5 * n2));
  }
  if (look == 2) {
    float spike = step(0.86, gwHash(floor(c) + 31.0));
    float breath = 0.5 + 0.5 * sin(t * 2.0943951);
    return 0.8 + 0.8 * lv + spike * (0.6 + 0.6 * lv) + 0.5 * breath;
  }
  if (look == 3) {
    float s = floor(t * 12.0);
    float arc = gwNoise(floor(c * 0.5) * 0.9 + vec2(s * 3.7, s * 1.3), 4096.0);
    float surge = step(0.8, gwHash(vec2(floor(t * 3.0), 7.0)));
    return 1.6 + 0.3 * lv + smoothstep(0.55, 0.85, arc) * (2.0 + 1.5 * lv) + surge;
  }
  float w = 0.5 + 0.5 * sin(t * 1.5707963 + c.x * 0.15 + c.y * 0.1);
  return 1.6 + 0.6 * lv * (0.7 + 0.3 * w);
}
// the band's colour at h (1 at the edge, 0 at the reach) - four steps of the ramp; alpha 0 is a gap
vec4 gwShade(int look, float h, vec2 c, float t, float lv) {
  int q = int(clamp(floor(h * 4.0 - 0.5), 0.0, 3.0));
  vec3 col = uRamp[q];
  float a = 0.55 + 0.45 * h;
  if (look == 2 && gwHash(floor(c) + floor(t * 5.0) * 7.31) > 0.972) { col = uRamp[3]; a = 1.0; }
  if (look == 3 && gwHash(floor(c * 0.5) + floor(t * 12.0) * 13.0) < 0.18) return vec4(0.0);
  return vec4(col, a * (0.75 + 0.083 * lv));
}
// an ember over a flame: rising a cell a step, six steps a second
bool gwEmber(vec2 c, float t, float lv) {
  return gwHash(vec2(floor(c.x), mod(floor(c.y) - floor(t * 6.0), 1440.0))) > 0.993 - 0.002 * lv;
}
// the weapon's own edge, lit by its element: x the colour's share
vec4 gwRim(int look, vec2 c, float t, float lv) {
  float k = 0.3;
  if (look == 1) k = 0.25 + 0.35 * gwNoise(vec2(c.x * 0.6, c.y * 0.6 - t * 3.0), 720.0);
  else if (look == 2) k = 0.3 + 0.2 * (0.5 + 0.5 * sin(t * 2.0943951));
  else if (look == 3) k = gwHash(floor(c * 0.5) + floor(t * 12.0) * 5.0) > 0.5 ? 0.65 : 0.15;
  return vec4(uRamp[2], k * (0.7 + 0.1 * lv));
}
// the Morrowind charge's pattern on the surface, 0..1: fire boils up the screen, frost is facets that glint in turn,
// shock is veins that jump twelve times a second, arcane a slow swirl
float gwSurface(int look, vec2 uv, vec2 c, float t) {
  if (look == 1) return smoothstep(0.4, 0.95, gwNoise(vec2(c.x * 0.5, c.y * 0.35 - t * 2.5), 600.0));
  if (look == 2) {
    float f = gwHash(floor(uv * 24.0));
    return pow(0.5 + 0.5 * sin(t * 2.0943951 + f * 6.2831853), 6.0);
  }
  if (look == 3) {
    float s = floor(t * 12.0);
    return 1.0 - smoothstep(0.0, 0.07, abs(gwNoise(c * 0.6 + vec2(s * 5.1, s * 2.3), 4096.0) - 0.5));
  }
  float a = t * 0.2617994;
  return gwNoise(uv * 8.0 + vec2(sin(a), cos(a)) * 2.0, 4096.0);
}
`;

/** THE CLASSIC SPRITE'S QUAD: the frame's rect grown by `uPad` texels a side (left, top, right, bottom), its
 *  parameter `vQ` running past 0..1 into the pad - the frame's own texel size off the texture itself. */
export const GLOW_SPRITE_VS = `#version 300 es
layout(location=0) in vec2 aPos;
uniform vec4 uDst;
uniform vec2 uCanvas;
uniform vec4 uPad;
uniform sampler2D uTex;
out vec2 vQ;
void main() {
  vec2 p = aPos * 0.5 + 0.5;
  vec2 ts = vec2(textureSize(uTex, 0));
  vec2 q = mix(-uPad.xy / ts, 1.0 + uPad.zw / ts, p);
  vQ = q;
  vec2 px = uDst.xy + q * uDst.zw;
  gl_Position = vec4(px.x / uCanvas.x * 2.0 - 1.0, 1.0 - px.y / uCanvas.y * 2.0, 0.0, 1.0);
}`;

/** THE CLASSIC SPRITE'S OUTLINE: per texel - an opaque edge texel takes the rim, an open one its distance to the
 *  nearest opaque one in the window (`uWin`: half-width, rows above, rows below) and the band that distance falls in.
 *  Premultiplied out (the renderer blends ONE, ONE_MINUS_SRC_ALPHA). The frame's alpha law is drawScreenQuad's: a texel
 *  is opaque at half alpha. */
export const GLOW_SPRITE_FS = `#version 300 es
precision highp float;
precision highp int;
in vec2 vQ;
uniform sampler2D uTex;
uniform vec4 uSrc;
uniform int uLook;
uniform float uLevel;
uniform float uTime;
uniform ivec3 uWin;
out vec4 outColor;
${GLOW_LOOK_GLSL}
bool gwSolid(ivec2 p, ivec2 ts) {
  if (p.x < 0 || p.y < 0 || p.x >= ts.x || p.y >= ts.y) return false;
  return texelFetch(uTex, p, 0).a >= 0.5;
}
void main() {
  ivec2 ts = textureSize(uTex, 0);
  vec2 uv = mix(uSrc.xy, uSrc.zw, vQ);
  ivec2 tc = ivec2(floor(uv * vec2(ts)));
  vec2 c = vec2(float(tc.x), -float(tc.y));
  float t = uTime;
  float lv = uLevel;
  if (gwSolid(tc, ts)) {
    if (gwSolid(tc + ivec2(1, 0), ts) && gwSolid(tc - ivec2(1, 0), ts) && gwSolid(tc + ivec2(0, 1), ts) && gwSolid(tc - ivec2(0, 1), ts)) discard;
    vec4 r = gwRim(uLook, c, t, lv);
    outColor = vec4(r.rgb * r.a, r.a * 0.5);
    return;
  }
  float d = 1e3;
  bool below = false;
  for (int y = -uWin.y; y <= uWin.z; y++) {
    for (int x = -uWin.x; x <= uWin.x; x++) {
      if (!gwSolid(tc + ivec2(x, y), ts)) continue;
      float m = gwMetric(uLook, vec2(float(x), -float(y)));
      if (m < d) { d = m; below = y > 0; }
    }
  }
  if (d > 1e2) discard;
  float reach = gwReach(uLook, c, t, lv);
  float h = 1.0 - d / max(reach, 0.25);
  if (h <= 0.0) {
    if (uLook == 1 && below && d < reach + 3.0 && gwEmber(c, t, lv)) { outColor = vec4(uRamp[2], 1.0); return; }
    discard;
  }
  vec4 s = gwShade(uLook, h, c, t, lv);
  if (s.a <= 0.0) discard;
  outColor = vec4(s.rgb * s.a, s.a);
}`;

/** THE MORROWIND PASS'S VERTEX SHADER: the character program's skinned vertex shader (renderer.js CHAR_SKIN_VS) with
 *  the shift and the depth after its own gl_Position - the SAME expression first, so a zero shift is the body's own
 *  position - and the view-space position the charge lights by. `uGlowFar` > 0 sets a ring's depth outright (NDC z,
 *  times w); otherwise `uGlowPull` moves the body's own. Throws on a source without exactly one of each needle:
 *  a silent no-op here is a glow drawn nowhere (skinFaceFs' rule). */
export function glowMeshVs(charSkinVs) {
  const decl = 'out vec3 vEmissive;';
  const pos = 'gl_Position = uProj * uView * world;';
  const n = (needle) => charSkinVs.split(needle).length - 1;
  if (n(decl) !== 1 || n(pos) !== 1) {
    throw new Error(`WEAPON-GLOW1: the character vertex shader needs one "${decl}" and one "${pos}" (has ${n(decl)} and ${n(pos)})`);
  }
  return charSkinVs
    .replace(decl, `${decl}\nout vec3 vViewPos;\nuniform vec2 uGlowShift;\nuniform float uGlowFar;\nuniform float uGlowPull;`)
    .replace(pos, `${pos}\n  vViewPos = (uView * world).xyz;\n  gl_Position.xy += uGlowShift * gl_Position.w;\n  gl_Position.z = uGlowFar > 0.0 ? uGlowFar * gl_Position.w : gl_Position.z + uGlowPull * gl_Position.w;`);
}

/** THE MORROWIND PASS'S FRAGMENT SHADER: `uMode` 0 a ring (opaque, its band off `uRingD`), 1 the charge (additive -
 *  the renderer masks alpha), 2 an ember. The range's own cutout holds in all three. */
export const GLOW_MESH_FS = `#version 300 es
precision highp float;
precision highp int;
in vec2 vUV;
in vec3 vViewPos;
uniform sampler2D uTex;
uniform float uUseTex;
uniform float uAlphaCut;
uniform int uLook;
uniform float uLevel;
uniform float uTime;
uniform float uMode;
uniform float uRingD;
uniform float uUnit;
out vec4 outColor;
${GLOW_LOOK_GLSL}
void main() {
  if (uUseTex > 0.5 && uAlphaCut > 0.0 && texture(uTex, vUV).a < uAlphaCut) discard;
  vec2 c = gl_FragCoord.xy / uUnit;
  float t = uTime;
  float lv = uLevel;
  if (uMode < 0.5) {
    float h = 1.0 - uRingD / max(gwReach(uLook, c, t, lv), 0.25);
    if (h <= 0.0) discard;
    vec4 s = gwShade(uLook, h, c, t, lv);
    if (s.a <= 0.0) discard;
    outColor = vec4(s.rgb, 1.0);
    return;
  }
  if (uMode < 1.5) {
    vec3 n = normalize(cross(dFdx(vViewPos), dFdy(vViewPos)));
    vec3 v = normalize(-vViewPos);
    float rim = pow(1.0 - abs(dot(n, v)), 2.0);
    float pat = gwSurface(uLook, vUV, c, t);
    float k = (0.06 + 0.4 * rim + 0.3 * pat) * (0.45 + 0.12 * lv);
    outColor = vec4(mix(uRamp[1], uRamp[3], pat) * k, 0.0);
    return;
  }
  if (!gwEmber(c, t, lv)) discard;
  outColor = vec4(uRamp[2], 1.0);
}`;

/**
 * The Morrowind outline's draws for a look: each `{ shift: [dx, dy], ring, far }` in glow units (y up), the rings
 * outermost first, each round GLOW_DIRS directions - fire's stretched up and cut short below - then fire's embers
 * (`ring` -1). Pure: the renderer scales the shifts to the pass's pixels.
 * @param {string} look
 */
export function glowRingDraws(look) {
  const out = [];
  for (const ring of GLOW_RINGS) {
    for (let i = 0; i < GLOW_DIRS; i++) {
      const a = (i * 2 * Math.PI) / GLOW_DIRS;
      let x = Math.cos(a), y = Math.sin(a);
      if (look === 'fire') y *= y > 0 ? GLOW_FIRE_UP : GLOW_FIRE_DOWN;
      out.push(Object.freeze({ shift: Object.freeze([x * ring, y * ring]), ring, far: GLOW_RING_FAR + ring * GLOW_RING_STEP }));
    }
  }
  if (look === 'fire') {
    for (const up of GLOW_EMBER_RISE) for (const side of [-0.6, 0, 0.6]) {
      out.push(Object.freeze({ shift: Object.freeze([side, up]), ring: -1, far: GLOW_RING_FAR }));
    }
  }
  return Object.freeze(out);
}
