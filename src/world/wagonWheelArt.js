// @ts-check
// DF-ART IV (2026-10-15, Mac: "Can we bring back the wheels we had before we replaced them"): THE WAGONS' OWN WHEELS -
// the two pictures a wheel wears, painted here again as WAGONS1 painted them (src/world/wagonArt.js before DF-ART, at
// 7c291d36b1), texel for texel: its face (hub, seven spokes - Mac's wheels are heptagons - felloes and the iron tyre's
// edge) and its tread (the tyre's iron, a rivet every so often, the road's dust on it). DF-ART had dressed them in
// Daggerfall's spoked wheel (TEXTURE.087 record 7) and its grey iron; every other surface of the wagons stays
// Daggerfall's (world/wagonArt.js WAGON_SOURCES, which names these two as painted sources - world/classicArt.js
// classicPicture's `painted` arm).
//
// The palette and the tools are the old ones (world/galleonArt.js's C, picture, put, mix, shade and value noise before
// DF-ART took them out with the ships' painted art), kept here so the wheels are their own. Each picture is 64 x 64, its
// `data` RGBA - the shape classicArt.js's readers answer, uploaded in color32 order as every wagon picture is.
// Not a DFU member. Ledger A (WAGONS1).
import { mulberry32 } from '../combat/bloodArt.js';

/** A wheel picture's side, texels (the wagons' 64 - GALLEON_TEX_SIZE before DF-ART). */
export const WHEEL_ART_SIZE = 64;

/** The colours the wheels were painted in: the fleet's iron, oak and tar, and the wagons' own wood for the felloes,
 *  the spokes and the hub. */
export const WHEEL_COLOURS = Object.freeze({
  iron: Object.freeze([44, 44, 48]), ironLit: Object.freeze([74, 74, 80]), rust: Object.freeze([96, 54, 32]),
  oak: Object.freeze([104, 72, 44]), oakDark: Object.freeze([70, 47, 29]), oakLit: Object.freeze([132, 96, 60]),
  tar: Object.freeze([30, 27, 24]), black: Object.freeze([20, 18, 17]),
  hub: Object.freeze([58, 40, 24]), felloe: Object.freeze([96, 68, 42]), spoke: Object.freeze([122, 90, 56]),
});
const C = WHEEL_COLOURS;

/** @param {number} w @param {number} h */
const picture = (w, h) => ({ width: w, height: h, data: new Uint8Array(w * h * 4) });
const clamp8 = (/** @type {number} */ v) => Math.max(0, Math.min(255, Math.round(v)));
/** @param {{width:number,height:number,data:Uint8Array}} img @param {number} x @param {number} y @param {ArrayLike<number>} rgb */
const put = (img, x, y, rgb) => {
  const w = img.width, h = img.height;
  const i = ((((y % h) + h) % h) * w + (((x % w) + w) % w)) * 4;
  img.data[i] = clamp8(rgb[0]); img.data[i + 1] = clamp8(rgb[1]); img.data[i + 2] = clamp8(rgb[2]); img.data[i + 3] = 255;
};
/** @param {{width:number,height:number,data:Uint8Array}} img @param {number} x @param {number} y */
const get = (img, x, y) => {
  const w = img.width, h = img.height;
  const i = ((((y % h) + h) % h) * w + (((x % w) + w) % w)) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
};
/** @param {ArrayLike<number>} a @param {ArrayLike<number>} b @param {number} t */
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/** @param {ArrayLike<number>} c @param {number} k */
const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];

/** Tileable value noise over a w x h picture, `cx` by `cy` lattice cells across it. */
function noise(/** @type {number} */ seed, /** @type {number} */ w, /** @type {number} */ h, /** @type {number} */ cx, /** @type {number} */ cy) {
  const r = mulberry32(seed);
  const lat = Float32Array.from({ length: cx * cy }, () => r());
  const at = (/** @type {number} */ i, /** @type {number} */ j) => lat[(((j % cy) + cy) % cy) * cx + (((i % cx) + cx) % cx)];
  const sm = (/** @type {number} */ t) => t * t * (3 - 2 * t);
  return (/** @type {number} */ x, /** @type {number} */ y) => {
    const fx = (x / w) * cx, fy = (y / h) * cy;
    const i = Math.floor(fx), j = Math.floor(fy);
    const tx = sm(fx - i), ty = sm(fy - j);
    const a = at(i, j), b = at(i + 1, j), c = at(i, j + 1), d = at(i + 1, j + 1);
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  };
}

/** The iron the tyre is made of: blackened, speckled, a little rust (the fleet's gun iron, as the tyre was painted on). */
function ironArt() {
  const S = WHEEL_ART_SIZE, img = picture(S, S);
  const n = noise(0x1e1, S, S, 16, 16);
  const r = mulberry32(0x1e2);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    /** @type {ArrayLike<number>} */
    let c = mix(C.iron, C.ironLit, 0.5 * n(x, y));
    if (r() < 0.04) c = C.rust;
    put(img, x, y, c);
  }
  return img;
}

/** A wheel's iron tyre round its tread: the iron, a rivet every so often, the road's dust on it. */
export function wagonTyreArt() {
  const S = WHEEL_ART_SIZE, img = ironArt();
  const n = noise(0xa51, S, S, 8, 8);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) put(img, x, y, mix(get(img, x, y), [120, 108, 88], 0.25 * n(x, y)));
  for (let x = 4; x < S; x += 16) for (const y of [8, 40]) { put(img, x, y, C.ironLit); put(img, x + 1, y, C.iron); }
  return img;
}

/** A wheel's face, laid whole on it (world/wagonModels.js wheelUv: the picture's centre the hub's): its felloes round a
 *  rim, seven spokes (Mac's wheels have seven sides) from a turned hub with an iron hoop and its linchpin. */
export function wagonWheelArt() {
  const S = WHEEL_ART_SIZE, img = picture(S, S), n = noise(0xa61, S, S, 8, 8);
  const c = (S - 1) / 2;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = x - c, dy = y - c, r = Math.hypot(dx, dy) / c, a = Math.atan2(dy, dx);
    let col;
    if (r > 0.86) col = mix(C.iron, C.ironLit, 0.4 * n(x, y));                       // the tyre's edge
    else if (r > 0.66) col = mix(C.felloe, C.oakDark, ((Math.floor(((a + Math.PI) / (2 * Math.PI)) * 7) % 2) ? 0.25 : 0) + 0.2 * n(x, y));   // the felloes, each its own tone
    else if (r > 0.3) {
      const k = (((a + Math.PI) / (2 * Math.PI)) * 7) % 1;                            // where between two spokes
      const w = 0.09 + 0.05 * (1 - r);                                               // the spoke, thicker at the hub
      col = k < w || k > 1 - w ? mix(C.spoke, C.oakLit, 0.3 * n(x, y)) : shade(mix(C.oakDark, C.tar, 0.5), 0.7);   // between them, the shadow inside the wheel
    } else if (r > 0.22) col = mix(C.iron, C.ironLit, 0.5);                           // the hub's iron hoop
    else if (r > 0.08) col = mix(C.hub, C.oak, 0.5 * n(x, y));                         // the hub
    else col = C.black;                                                                // the axle's end and its pin
    put(img, x, y, col);
  }
  return img;
}
