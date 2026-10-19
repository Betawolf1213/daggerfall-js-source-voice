// @ts-check
// PRECIP4 (2026-10-19, the owner: "If its snowing in one area and raining in the next, the transition should be seamless
// both in ground texture and everything else") - THE GROUND'S SNOW, in both terrain programs (renderer.js TERRAIN_FS and
// the lane's EL_TERRAIN_FS), right after ECOTONE1's border (render/ecotoneGlsl.js). systems/weather/snowpack.js is the
// law: what fell and has not melted, at every place and height; scenes/snowCoverHost.js reads it about the player and
// hands each terrain draw its pixel's SNOWLINE - the heights where the cover crosses 10, 50 and 90 % at the pixel's four
// corners (uSnowH10/H50/H90: x SW, y SE, z NW, w NE). A fragment reads the line between its corners, its cover off its
// own height against it (snowAtHeight - snowpack.js coverAtHeight, term for term), sheds it on a steep face, and breaks
// a thin cover into patches; then its tile is its OWN climate's WINTER record of the same tile (DFU's winter archive,
// TerrainMaterialProvider's +1 - every set is the same 56 records, R9) in that share. The tile array a draw binds on the
// snow lane is the pixel's set's TWIN (renderer.js makeTwinArray): its summer records, then its winter ones
// (uSnowSet.z layers on, 0 for a set with no winter of its own - a desert's); a border's neighbours' twins are on
// ECOTONE1's units, their winter layers uSnowEco on, and the winter texel crosses the border by the ecotone's own weights.
// uSnowSet.y is 0 for every draw off the lane - the classic skin, the interiors, a world whose ground wears DFU's season -
// and the whole chunk is then one uniform test.

/** The ground's snow constants: the face steepness it starts and stops lying at (the normal's y - DFU's terrain is
 *  rarely steeper than 50 degrees; a snow-shedding rock face is past 45), the patches' cells (in world tiles, 6.4 m)
 *  and weights, and their edge. */
export const SNOW_GROUND = Object.freeze({
  slope: Object.freeze([0.62, 0.8]),
  patch: Object.freeze([Object.freeze({ cell: 1, weight: 0.35 }), Object.freeze({ cell: 4, weight: 0.4 }), Object.freeze({ cell: 16, weight: 0.25 })]),
  edge: 0.07,
  salt: 0x534e4f57,   // 'SNOW'
});
/** The layers a twin array holds before its winter half: a ground set's records (R9). */
export const TWIN_LAYERS = 56;

const f = (v) => (Number.isInteger(v) ? `${v}.0` : `${v}`);

/**
 * The chunk, for a program whose texels decode through `decode` (the lane's elDecode; '' for the classic program's
 * display values) and whose own tile array is `own` (uTileArr). After ecotoneGlsl (it reads its weights). Declares the
 * uniforms and `vec3 snowGround(vec3 bare, vec2 local, float y, vec3 n, vec3 tl, vec2 gx, vec2 gy)`: `bare` the ground's
 * texel as the ecotone left it, `local` its pixel-local metres (vLocalXZ), `y` its world height (vWorldPos.y), `n` its
 * normal, `tl` its (tuv, layer), `gx`/`gy` its gradient.
 * @param {string} decode
 */
export function snowCoverGlsl(decode = '') {
  const [s0, s1] = SNOW_GROUND.slope, e = SNOW_GROUND.edge, P = SNOW_GROUND.patch;
  return `// PRECIP4 (render/snowCoverGlsl.js; the law is systems/weather/snowpack.js)
uniform vec4 uSnowH10;           // the snowline's 10 % heights at the pixel's corners: x SW, y SE, z NW, w NE (m above the sea)
uniform vec4 uSnowH50;
uniform vec4 uSnowH90;
uniform vec4 uSnowSet;           // x: world y -> metres above the sea; y: 1 on; z: the pixel's own winter layers' offset (0 none)
uniform highp ivec3 uSnowEco;    // the neighbours' (uEcoArr1-3) winter layers' offsets (0 none)
uniform highp ivec2 uSnowTile;   // the pixel's first world tile (x east, z north) - the patches' lattice
float snowHash(highp ivec2 c, highp uint salt) {
  highp uint h = (uint(c.x) * 0x8da6b343u) ^ (uint(c.y) * 0xd8163841u) ^ (salt * 0xcb1ab31fu);
  h ^= h >> 16u; h *= 0x7feb352du; h ^= h >> 15u; h *= 0x846ca68bu; h ^= h >> 16u;
  return float(h >> 8u) * (1.0 / 16777216.0);
}
float snowNoise(vec2 lt, highp int cell, highp uint salt) {
  vec2 q = lt / float(cell);
  vec2 fl = floor(q);
  highp ivec2 i = uSnowTile / cell + ivec2(fl);
  vec2 fr = q - fl;
  vec2 u = fr * fr * (3.0 - 2.0 * fr);
  float a = snowHash(i, salt), b = snowHash(i + ivec2(1, 0), salt), c = snowHash(i + ivec2(0, 1), salt), d = snowHash(i + ivec2(1, 1), salt);
  float top = a + (b - a) * u.x, bot = c + (d - c) * u.x;
  return top + (bot - top) * u.y;
}
// snowpack.js coverAtHeight: piecewise linear through (h10, 0.1), (h50, 0.5), (h90, 0.9), out to 0 and 1 a quarter span on
float snowAtHeight(vec3 line, float h) {
  float lo = max(1.0, line.y - line.x), hi = max(1.0, line.z - line.y);
  if (h <= line.x) return max(0.0, 0.1 + 0.1 * (h - line.x) / (0.25 * lo));
  if (h <= line.y) return 0.1 + 0.4 * (h - line.x) / lo;
  if (h <= line.z) return 0.5 + 0.4 * (h - line.y) / hi;
  return min(1.0, 0.9 + 0.1 * (h - line.z) / (0.25 * hi));
}
float snowCover(vec2 local, float h, vec3 n) {
  vec2 q = clamp(local / 819.2, 0.0, 1.0);
  vec4 w = vec4((1.0 - q.x) * (1.0 - q.y), q.x * (1.0 - q.y), (1.0 - q.x) * q.y, q.x * q.y);
  float c = snowAtHeight(vec3(dot(uSnowH10, w), dot(uSnowH50, w), dot(uSnowH90, w)), h);
  c *= smoothstep(${f(s0)}, ${f(s1)}, n.y);   // a steep face sheds it
  if (c <= 0.0 || c >= 1.0) return c;
  vec2 lt = local / 6.4;
  float p = ${P.map((o, k) => `${f(o.weight)} * snowNoise(lt, ${o.cell}, ${SNOW_GROUND.salt + k}u)`).join(' + ')};
  p = clamp((p - 0.5) * 2.2 + 0.5, 0.0, 1.0);   // the sum's middle widened, so a half cover is half the ground
  return smoothstep(${f(-e)}, ${f(e)}, ${f(-e)} + ${f(1 + 2 * e)} * c - p);
}
vec3 snowGround(vec3 bare, vec2 local, float y, vec3 n, vec3 tl, vec2 gx, vec2 gy) {
  if (uSnowSet.y < 0.5) return bare;
  float c = snowCover(local, y + uSnowSet.x, n);
  if (c <= 0.0) return bare;
  vec3 white = ${decode}(textureGrad(uTileArr, vec3(tl.xy, tl.z + uSnowSet.z), gx, gy).rgb);
  if (uEcoOrigin.z != 0) {
    vec4 ew = ecoWeights(local);
    if (ew.x < 1.0) {
      vec3 cw = white * ew.x;
      if (ew.y > 0.0) cw += ew.y * ${decode}(textureGrad(uEcoArr1, vec3(tl.xy, tl.z + float(uSnowEco.x)), gx, gy).rgb);
      if (ew.z > 0.0) cw += ew.z * ${decode}(textureGrad(uEcoArr2, vec3(tl.xy, tl.z + float(uSnowEco.y)), gx, gy).rgb);
      if (ew.w > 0.0) cw += ew.w * ${decode}(textureGrad(uEcoArr3, vec3(tl.xy, tl.z + float(uSnowEco.z)), gx, gy).rgb);
      white = cw;
    }
  }
  return mix(bare, white, c);
}
`;
}
