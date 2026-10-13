// @ts-check
// KG3 (2026-10-13, bible/11-Multiplayer/Kings-Gambit.md sections 5.3, 10.1, 14.8 and 16): THE KING'S GAMBIT ON THE CLOTH -
// the board a flat mat on the table's felt and every piece its card lying on its cell, drawn through the renderer's own
// path (createMesh, uploadTexture, drawMesh) in the room's pass after the decor, made when the game opens and freed when
// it closes (EVERY ALLOCATION HAS AN OWNER - the game's close). KG4 builds the walls, the pillars and the water, stands
// the cards up in their stands and moves them; KG3's board is the flat one the game is played on.
//
// THE ART IS OURS (section 6): the mat is painted on a canvas from the law's own board - the layout's two floor tones in
// a checker, a wall a stone block with its lit edge, a pillar a column's top, water its ripples, a hazard its own mark,
// a warning its ring and its "!" - and every mark laid over it is the house's coat (14.8): a side's mark under each
// piece (the host's a bone ring, the guest's a dark stone ring notched at its corners - a side by its shape, never by
// colour alone), the chosen piece's brass ring, its reach a filled wash, its range an outline alone, a target the blood
// ring with a sword, the keyboard's cursor a dashed brass square; every one edged in the kit's outline. The pieces are the
// cards' own pictures (render/iliacCardFaces.js PICTURE) and the Bay deck's Kings (render/cardFaces.js paintFace), on one
// atlas. No ARENA2 pixel.
//
// Not a DFU member: Daggerfall Unity has no such game - the mod does. Ledger A row (THE KING'S GAMBIT).
import { KG_COLS, KG_ROWS, KG_ROSTER, KG_TILE, KG_LAYOUTS, KG_OPEN_FIELD } from '../net/kingsGambit.js';
import { plateModel } from './cardTableDraw.js';
import { paintIliacCard, paintIliacBack } from './iliacCardFaces.js';
import { paintFace, RANK_KING } from './cardFaces.js';
import { cardById } from '../net/iliacCards.js';
import { FOE_CARDS } from '../systems/cardSources.js';
import { CARD_W } from '../world/cardMotion.js';
import { trs } from '../world/mat4.js';
import { toColor32 } from '../formats/color32Order.js';
import { gambitCardYaw, GAMBIT_CARD_LIFT } from '../world/gambitCloth.js';

/** The game's textures: one archive, the atlas of its pieces and the board's mat. */
export const GAMBIT_ARCHIVE = 'kings-gambit';
export const GAMBIT_ATLAS = 'atlas';
export const GAMBIT_MAT = 'mat';
/** The atlas: the roster's pictures in its order, the four Kings in the Bay deck's suit order, then the back - each a
 *  cell of the card's own shape. */
export const GAMBIT_CELL_W = 64;
export const GAMBIT_CELL_H = 90;
export const GAMBIT_ATLAS_COLS = 10;
export const GAMBIT_ATLAS_KEYS = Object.freeze([...KG_ROSTER.map((u) => `u${u.id}`), 'k0', 'k1', 'k2', 'k3', 'back']);
export const GAMBIT_ATLAS_W = GAMBIT_CELL_W * GAMBIT_ATLAS_COLS;
export const GAMBIT_ATLAS_H = GAMBIT_CELL_H * Math.ceil(GAMBIT_ATLAS_KEYS.length / GAMBIT_ATLAS_COLS);
/** The mat's canvas: this many texels a cell. */
export const GAMBIT_MAT_CELL_PX = 32;
/** A piece's card on its cell: this share of the cell wide (10.1's plate, 4.5 cm on a 7.08 cm cell). */
export const GAMBIT_CARD_SHARE = 0.64;
/** THE HOUSE'S COAT on the mat (14.8): the kit's outline, bone, dark stone, brass and blood. */
export const GAMBIT_INKS = Object.freeze({ outline: '#050608', bone: '#e9e4d9', stone: '#2b2a2e', brass: '#f3cf86', brassLo: '#c9a24a', blood: '#b83a2e' });

/** A key's place on the atlas: [col, row]. */
export const gambitAtlasCell = (/** @type {string} */ key) => { const i = Math.max(0, GAMBIT_ATLAS_KEYS.indexOf(key)); return [i % GAMBIT_ATLAS_COLS, Math.floor(i / GAMBIT_ATLAS_COLS)]; };
/** A cell's UV rectangle `[u0, v0, u1, v1]`, inset half a texel, v up. */
export function gambitCellUv(/** @type {number[]} */ [col, row]) {
  const u0 = (col * GAMBIT_CELL_W + 0.5) / GAMBIT_ATLAS_W, u1 = ((col + 1) * GAMBIT_CELL_W - 0.5) / GAMBIT_ATLAS_W;
  const v1 = 1 - (row * GAMBIT_CELL_H + 0.5) / GAMBIT_ATLAS_H, v0 = 1 - ((row + 1) * GAMBIT_CELL_H - 0.5) / GAMBIT_ATLAS_H;
  return [u0, v0, u1, v1];
}
/** The atlas key a piece is drawn with: a king's crown, a unit's kind. @param {{king: boolean, side: number, unit: number}} p @param {number[]} crowns the two sides' crown indices */
export const pieceKey = (p, crowns) => (p.king ? `k${crowns[p.side]}` : `u${p.unit}`);

/** Paint the atlas: every unit's picture (its card's, picture-only), the four Kings, the back. */
export function paintGambitAtlas(/** @type {any} */ ctx) {
  ctx.clearRect(0, 0, GAMBIT_ATLAS_W, GAMBIT_ATLAS_H);
  const cell = (/** @type {string} */ key, /** @type {() => void} */ paint) => {
    const [c, r] = gambitAtlasCell(key);
    ctx.save(); ctx.translate(c * GAMBIT_CELL_W, r * GAMBIT_CELL_H); paint(); ctx.restore();
  };
  for (const u of KG_ROSTER) cell(`u${u.id}`, () => paintIliacCard(ctx, cardById(FOE_CARDS[u.id]), GAMBIT_CELL_W, GAMBIT_CELL_H, undefined, { picture: true }));
  for (let k = 0; k < 4; k++) cell(`k${k}`, () => paintFace(ctx, k * 13 + RANK_KING, GAMBIT_CELL_W, GAMBIT_CELL_H));
  cell('back', () => paintIliacBack(ctx, GAMBIT_CELL_W, GAMBIT_CELL_H));
}

const rgb = (/** @type {readonly number[]} */ c) => `rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)})`;

/**
 * Paint the mat for `look`: `{layout, tiles, hazards, pieces, selected, lit, range, targets, cursor, staged}` - the law's
 * board and the table's marks (cells as [col, row]; `targets` piece numbers). Row 0 - the board's head - at the canvas's
 * top, column 0 at its left.
 * @param {any} ctx @param {any} look
 */
export function paintGambitMat(ctx, look) {
  const S = GAMBIT_MAT_CELL_PX, I = GAMBIT_INKS;
  const L = KG_LAYOUTS.find((x) => x.key === look.layout) ?? KG_OPEN_FIELD;
  const box = (/** @type {number} */ c, /** @type {number} */ r) => [c * S, r * S];
  // the floor: the layout's two tones in a checker
  for (let r = 0; r < KG_ROWS; r++) for (let c = 0; c < KG_COLS; c++) {
    const [x, y] = box(c, r);
    ctx.fillStyle = rgb(L.floor[(c + r) % 2]); ctx.fillRect(x, y, S, S);
  }
  // the ground no piece walks on
  for (let r = 0; r < KG_ROWS; r++) for (let c = 0; c < KG_COLS; c++) {
    const t = look.tiles[r * KG_COLS + c], [x, y] = box(c, r);
    if (t === KG_TILE.wall) {
      ctx.fillStyle = '#4a4640'; ctx.fillRect(x, y, S, S);
      ctx.fillStyle = '#6e6960'; ctx.fillRect(x, y, S, 3);   // the lit top edge
      ctx.strokeStyle = '#2e2b27'; ctx.lineWidth = 1;
      for (const yy of [S / 3, (2 * S) / 3]) { ctx.beginPath(); ctx.moveTo(x, y + yy); ctx.lineTo(x + S, y + yy); ctx.stroke(); }   // the courses
    } else if (t === KG_TILE.pillar) {
      ctx.fillStyle = '#3a3733'; ctx.beginPath(); ctx.arc(x + S / 2, y + S / 2, S * 0.42, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5c5850'; ctx.beginPath(); ctx.arc(x + S / 2, y + S / 2, S * 0.32, 0, Math.PI * 2); ctx.fill();
    } else if (t === KG_TILE.water) {
      ctx.fillStyle = '#1f3d5c'; ctx.fillRect(x, y, S, S);
      ctx.strokeStyle = '#4f7aa5'; ctx.lineWidth = 1.5;
      for (const yy of [S * 0.35, S * 0.68]) { ctx.beginPath(); ctx.moveTo(x + 3, y + yy); ctx.quadraticCurveTo(x + S / 2, y + yy - 4, x + S - 3, y + yy); ctx.stroke(); }
    }
  }
  // the hazards: an active one its mark, a warning its ring and its "!"
  for (const h of look.hazards ?? []) {
    const [x, y] = box(h.col, h.row), cx = x + S / 2, cy = y + S / 2;
    const tone = h.kind === 'fire' ? '#e2702a' : h.kind === 'spikes' ? '#b9b4a8' : '#5fae4a';
    if (h.active) {
      ctx.fillStyle = tone;
      if (h.kind === 'fire') {
        for (const [dx, hh] of [[-7, 13], [0, 18], [7, 12]]) { ctx.beginPath(); ctx.moveTo(cx + dx - 5, cy + 10); ctx.quadraticCurveTo(cx + dx - 6, cy + 10 - hh * 0.6, cx + dx, cy + 10 - hh); ctx.quadraticCurveTo(cx + dx + 6, cy + 10 - hh * 0.6, cx + dx + 5, cy + 10); ctx.closePath(); ctx.fill(); }
      } else if (h.kind === 'spikes') {
        for (let k = 0; k < 6; k++) { const sx = x + 4 + (k % 3) * 9, sy = y + 6 + Math.floor(k / 3) * 12; ctx.beginPath(); ctx.moveTo(sx, sy + 10); ctx.lineTo(sx + 4, sy); ctx.lineTo(sx + 8, sy + 10); ctx.closePath(); ctx.fill(); }
      } else {
        for (const [dx, dy, rr] of [[-6, 4, 5], [5, 2, 4], [0, -6, 3.5]]) { ctx.beginPath(); ctx.arc(cx + dx, cy + dy, rr, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.strokeStyle = I.outline; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, S - 2, S - 2);
    } else {
      ctx.setLineDash?.([4, 3]); ctx.strokeStyle = I.outline; ctx.lineWidth = 3; ctx.strokeRect(x + 3, y + 3, S - 6, S - 6);
      ctx.strokeStyle = tone; ctx.lineWidth = 1.5; ctx.strokeRect(x + 3, y + 3, S - 6, S - 6); ctx.setLineDash?.([]);
      ctx.fillStyle = I.outline; ctx.fillRect(cx - 3, cy - 10, 6, 13); ctx.fillRect(cx - 3, cy + 6, 6, 5);   // the "!"'s outline
      ctx.fillStyle = tone; ctx.fillRect(cx - 1.5, cy - 9, 3, 11); ctx.fillRect(cx - 1.5, cy + 7, 3, 3);
    }
  }
  /** A ring round a cell, edged in the kit's outline and drawn in `ink`, `inset` in and `w` wide - `notch` its corners cut. */
  const ring = (/** @type {number} */ c, /** @type {number} */ r, /** @type {string} */ ink, /** @type {number} */ inset, /** @type {number} */ w, notch = false, dash = false) => {
    const [x, y] = box(c, r), a = x + inset, b = y + inset, s = S - 2 * inset;
    const path = () => {
      ctx.beginPath();
      if (notch) { const n = s * 0.22; ctx.moveTo(a + n, b); ctx.lineTo(a + s - n, b); ctx.moveTo(a + s, b + n); ctx.lineTo(a + s, b + s - n); ctx.moveTo(a + s - n, b + s); ctx.lineTo(a + n, b + s); ctx.moveTo(a, b + s - n); ctx.lineTo(a, b + n); }
      else ctx.rect(a, b, s, s);
    };
    if (dash) ctx.setLineDash?.([5, 3]);
    ctx.strokeStyle = I.outline; ctx.lineWidth = w + 2; path(); ctx.stroke();
    ctx.strokeStyle = ink; ctx.lineWidth = w; path(); ctx.stroke();
    if (dash) ctx.setLineDash?.([]);
  };
  const wash = (/** @type {number} */ c, /** @type {number} */ r, /** @type {string} */ ink, /** @type {number} */ alpha) => {
    const [x, y] = box(c, r);
    ctx.globalAlpha = alpha; ctx.fillStyle = ink; ctx.fillRect(x + 2, y + 2, S - 4, S - 4); ctx.globalAlpha = 1;
  };
  // the chosen piece's reach (a filled wash) and its range (an outline alone)
  for (const [c, r] of look.range ?? []) ring(c, r, I.bone, 5, 1.5);
  for (const [c, r] of look.lit ?? []) { wash(c, r, I.bone, 0.32); ring(c, r, I.bone, 2, 1); }
  // every piece's side mark: the host's a bone ring, the guest's a dark stone ring notched at its corners
  for (const p of look.pieces ?? []) ring(p.col, p.row, p.side === 0 ? I.bone : I.stone, 1.5, 2, p.side === 1);
  // the targets: the blood ring and a sword beside the card
  for (const p of look.pieces ?? []) {
    if (!(look.targets ?? []).includes(p.id)) continue;
    ring(p.col, p.row, I.blood, 1, 3);
    const [x, y] = box(p.col, p.row);
    ctx.fillStyle = I.outline; ctx.fillRect(x + S - 9, y + 3, 6, 14);
    ctx.fillStyle = I.blood; ctx.fillRect(x + S - 7.5, y + 4, 3, 10); ctx.fillRect(x + S - 9.5, y + 12, 7, 2);   // the blade and its guard
  }
  const sel = (look.pieces ?? []).find((p) => p.id === look.selected);
  if (sel) ring(sel.col, sel.row, I.brass, 0.5, 3);
  if (look.staged) { wash(look.staged.col, look.staged.row, I.brass, 0.4); ring(look.staged.col, look.staged.row, I.brass, 1, 3); }
  if (look.cursor) ring(look.cursor[0], look.cursor[1], I.brassLo, 3, 2, false, true);
}

/** The mat's quad over the board's corners (world/gambitCloth.js gambitPlaces), UVs the canvas's (row 0 the head at its
 *  top), wound as every model of the renderer's is: cross(b - a, c - a) along the normal (cardTableDraw.js's plate's). */
export function matModel(/** @type {{corners: number[][]}} */ places) {
  const P = places.corners;   // the host's left foot, the right foot, the right head, the left head
  const uv = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const positions = P.flat(), normals = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], uvs = uv.flat();
  const crossY = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ c) => {
    const ux = P[b][0] - P[a][0], uz = P[b][2] - P[a][2], vx = P[c][0] - P[a][0], vz = P[c][2] - P[a][2];
    return uz * vx - ux * vz;   // y of (b - a) x (c - a)
  };
  const tri = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ c) => (crossY(a, b, c) > 0 ? [a, b, c] : [a, c, b]);
  const indices = [...tri(0, 1, 2), ...tri(0, 2, 3)];
  return { positions: new Float32Array(positions), normals: new Float32Array(normals), uvs: new Float32Array(uvs), indices: new Uint32Array(indices),
    subMeshes: [{ textureArchive: GAMBIT_ARCHIVE, textureRecord: GAMBIT_MAT, startIndex: 0, primitiveCount: 2 }] };
}

const onAtlas = (/** @type {number[]} */ indices) => [{ textureArchive: GAMBIT_ARCHIVE, textureRecord: GAMBIT_ATLAS, startIndex: 0, primitiveCount: indices.length / 3 }];
/** A piece's plate on the atlas: its picture's cell, the back's, the back's again for its edges. */
export const gambitPlateModel = (/** @type {string} */ key) => plateModel(gambitCellUv(gambitAtlasCell(key)), gambitCellUv(gambitAtlasCell('back')), gambitCellUv(gambitAtlasCell('back')), onAtlas);

/**
 * The game on this renderer. `draw(scene)` draws `{places, look, crowns}` - the board's lay, the mat's look (paintGambitMat's
 * `look`, its pieces the law's) and the two sides' crown indices; the mat is painted again only when its look changed.
 * `destroy()` frees every mesh and both textures, once. A renderer without the path (a test's) draws nothing and throws
 * nothing.
 * @param {any} renderer @param {{doc?: any}} [opts]
 */
export function createGambitTableDraw(renderer, { doc = globalThis.document } = {}) {
  let alive = true, atlasReady = false, mat = null, matKey = null, matPlaces = null;
  const plates = new Map();
  const canvasOf = (/** @type {number} */ w, /** @type {number} */ h) => {
    const cv = doc?.createElement?.('canvas');
    if (!cv) return null;
    cv.width = w; cv.height = h;
    const ctx = cv.getContext?.('2d');
    return ctx ? { cv, ctx } : null;
  };
  const upload = (/** @type {string} */ record, /** @type {any} */ ctx, /** @type {number} */ w, /** @type {number} */ h) => {
    const img = ctx.getImageData(0, 0, w, h);
    renderer.uploadTexture(GAMBIT_ARCHIVE, record, toColor32({ width: w, height: h, data: new Uint8Array(img.data.buffer) }));
  };
  const buildAtlas = () => {
    if (atlasReady || !renderer?.createMesh) return;
    const c = canvasOf(GAMBIT_ATLAS_W, GAMBIT_ATLAS_H);
    if (!c) return;
    paintGambitAtlas(c.ctx);
    upload(GAMBIT_ATLAS, c.ctx, GAMBIT_ATLAS_W, GAMBIT_ATLAS_H);
    atlasReady = true;
  };
  const paintMat = (/** @type {any} */ places, /** @type {any} */ look) => {
    const key = JSON.stringify(look);
    if (mat && key === matKey && places === matPlaces) return;
    const W = KG_COLS * GAMBIT_MAT_CELL_PX, H = KG_ROWS * GAMBIT_MAT_CELL_PX;
    const c = canvasOf(W, H);
    if (!c) return;
    paintGambitMat(c.ctx, look);
    if (matKey !== null) renderer.releaseTexture?.(GAMBIT_ARCHIVE, GAMBIT_MAT);   // the cache keeps a key's first picture: a new look is a new upload
    upload(GAMBIT_MAT, c.ctx, W, H);
    if (!mat || places !== matPlaces) { if (mat) renderer.destroyMesh?.(mat); mat = renderer.createMesh(matModel(places)); matPlaces = places; }
    matKey = key;
  };
  const plateOf = (/** @type {string} */ key) => {
    let m = plates.get(key);
    if (!m) { m = renderer.createMesh(gambitPlateModel(key)); plates.set(key, m); }
    return m;
  };
  return {
    /** @param {{places: any, look: any, crowns: number[]}} scene */
    draw(scene) {
      if (!alive || !renderer?.createMesh || !scene?.places || !scene.look) return;
      buildAtlas();
      if (!atlasReady) return;
      paintMat(scene.places, scene.look);
      if (mat) renderer.drawMesh(mat, trs(0, 0, 0, 0, 0, 0), null, { noShadow: true });
      const s = (GAMBIT_CARD_SHARE * scene.places.cell) / CARD_W;
      for (const p of scene.look.pieces ?? []) {
        const at = scene.places.at(p.col, p.row), yaw = gambitCardYaw(scene.places, p.side);
        renderer.drawMesh(plateOf(pieceKey(p, scene.crowns)), trs(at[0], at[1] + GAMBIT_CARD_LIFT, at[2], 0, (yaw * 180) / Math.PI, 0, s, 1, s), null, { noShadow: true });
      }
    },
    /** How many meshes it holds - a test's look at its allocations. */
    meshCount: () => plates.size + (mat ? 1 : 0),
    destroy() {
      if (!alive) return;
      alive = false;
      for (const m of [...plates.values(), mat]) if (m) renderer.destroyMesh?.(m);
      if (atlasReady) renderer.releaseTexture?.(GAMBIT_ARCHIVE, GAMBIT_ATLAS);
      if (matKey !== null) renderer.releaseTexture?.(GAMBIT_ARCHIVE, GAMBIT_MAT);
      plates.clear(); mat = null; matKey = null; atlasReady = false;
    },
  };
}
