// NODE-GLINT (2026-10-20, the owner: "Lets just bring the glint back but better", of NODE-OUTLINE's ring - which players
// found unimmersive).
//
// EVERY GATHERING NODE CATCHING THE LIGHT ON ITS OWN PICTURE. NODE-MARKS lit a node with a card before it - a halo, a
// shimmer and motes - which the eye read as a faint sparkle near the node, not as the node; NODE-OUTLINE (2026-10-19)
// ringed the picture in its profession's colour, which read as a line painted on the world. Now (render/nodeGlint.js):
//   - the gathering host's marks carry each node's PICTURES (scenes/gatherHost.js, NODE-OUTLINE's): the flats it stood
//     for the node (a herb patch's, a vein's, a boulder's, a school's - which flats of which batch, and their centres), a
//     dungeon vein's own batches, and a tree's forest flat with its centre (treeHost.js picturesOf - the 3D tree that
//     stands for it near the eye is found by that centre in its pixel's tree set);
//   - each frame the pass draws those pictures, unmoved, into a tile of a depth-only atlas (the silhouette, NODE-OUTLINE's
//     mask), then adds light over the node on screen: glints - a white-hot core in a soft bloom with four thin rays, each
//     life at a spot of the picture the silhouette holds, born and gone dark - and a sheen crossing the silhouette, faded
//     out near; at the picture's depth pulled toward the eye (a wall before the node hides it), in a warm light with a
//     hint of the profession's colour;
//   - a node with no picture (a body drawn as a 3D character) keeps the glow.
// tools/nodeGlintProbe.mjs draws it in a real WebGL2. bible/06-Systems/Professions-Arc.md, NODE-GLINT.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { createProfBook } from '../../src/net/profBook.js';
import { veins, utcDayOfMs } from '../../src/net/nodeLaw.js';
import { SKINNING_KNIFE } from '../../src/net/professionLaw.js';
import { mineKind } from '../../src/scenes/mineHost.js';
import { herbKind } from '../../src/scenes/herbHost.js';
import { huntKind } from '../../src/scenes/huntHost.js';
import { treeKind } from '../../src/scenes/treeHost.js';
import { createGatherHost } from '../../src/scenes/gatherHost.js';
import { nodeMarkRgb } from '../../src/ui/nodeMarks.js';
import { NODE_GLOW_MAX } from '../../src/render/nodeGlow.js';
import {
  GLINT_MAX, GLINT_TILE, GLINT_GRID, GLINT_QUAD_INDEX_BYTES, GLINT_COUNT, GLINT_TRIES, GLINT_RATE, GLINT_RATE_STEP, GLINT_FLASH, GLINT_STILL,
  GLINT_PX, GLINT_PX_MIN, GLINT_PX_FLOOR, GLINT_REF_ROWS, GLINT_SHARE, GLINT_GAIN, GLINT_LIGHT, GLINT_TINT, GLINT_CORE_WHITE, GLINT_PULL,
  GLINT_SHEEN_HZ, GLINT_SHEEN_SHARE, GLINT_SHEEN_NEAR_M, GLINT_SHEEN_FULL_M,
  glintPx, glintPxMax, glintTint, glintSheen, glintRatesWhole, screenRect, widenRect, snapRect, innerShare, treeInstanceOf,
  NODE_MASK_VS, NODE_MASK_FS, NODE_GLINT_FS, NodeGlintRenderer, createNodeGlintPass,
} from '../../src/render/nodeGlint.js';
import { HEIGHTMAP_DIMENSION, TERRAIN_SIZE } from '../../src/world/terrain/terrainSampler.js';

const src = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const noWait = () => Promise.resolve();
const tick = () => new Promise((r) => setImmediate(r));
const WOODS = 231, GLENUMBRA = 59;
const NOON = 20500 * 86_400 + 43_200;
const DAY = utcDayOfMs(NOON * 1000);
const TR = Object.freeze([-1000, 2, 500]);
const memStorage = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }; };
const f4 = (x) => x.toFixed(4);

/** The gathering host over one grass pixel (400, 150) with its veins on rock and a body, every batch it makes kept with
 *  the arguments it was made of (`made`). */
async function rig() {
  const samples = new Float32Array(HEIGHTMAP_DIMENSION * HEIGHTMAP_DIMENSION).fill(0.25);
  const law = veins({ x: 400, y: 150, day: DAY, climate: WOODS, region: GLENUMBRA });
  const rocks = law.map((v) => [v.u * TERRAIN_SIZE - 2, 0, v.v * TERRAIN_SIZE + 4, v.u * TERRAIN_SIZE + 2, 6, v.v * TERRAIN_SIZE + 8]);
  const entry = { px: 400, py: 150, samples, tilemap: new Uint8Array(128 * 128).fill(2), locationRect: null, batches: [], rocks };
  const door = {
    account: () => 'acct-1',
    state: async () => ({ ok: true, data: { day: DAY, character: 'c1', tracks: [], today: {}, taken: [], stores: [], caps: { stores: 5000 } } }),
    pixels: async (c, px) => ({ ok: true, data: { pixels: px.map(([x, y]) => ({ x, y, state: 'none' })), dungeons: [] } }),
    harvest: async () => ({ ok: false, error: 'offline' }),
  };
  const book = createProfBook({ door, storage: memStorage(), character: () => 'c1', now: () => NOON * 1000, sleep: noWait });
  const hud = { setPrompt: () => {}, setMeter: () => {}, toast: () => {}, banner: () => {}, setChip: () => {}, frame: () => {}, dispose: () => {} };
  const entity = { items: [{ templateIndex: SKINNING_KNIFE.templateIndex, currentCondition: 50, maxCondition: 50 }], stats: {} };   // a body is a node while the knife is carried
  const made = [];
  const kinds = [herbKind({ book }), mineKind({ book }), huntKind({ book, bodies: () => [{ key: 'body:20500:abcdefabcdef', foe: 1, tier: 1, hide: 'hide:wolf', at: () => [TR[0] + 10, TR[1], TR[2] + 10], lift: 0.2, reach: 3, lootKey: () => null }] })];
  const host = createGatherHost({
    book, hud, kinds,
    renderer: { createBillboardBatch: (archive, record, size, centers) => { const b = { archive, record, size, centers: centers.map((c) => [...c]) }; made.push(b); return b; }, destroyBatch: () => {} },
    getTexture: async () => ({ recordCount: 999 }), uploadRecord: () => {},
    billboardSize: () => ({ w: 0.3, h: 0.3 }), flatBatchAabb: () => [0, 0, 0, 0, 0, 0],
    built: () => new Map([['400,150', entry]]), pixelTranslation: (x, y, out) => { out[0] = TR[0]; out[1] = TR[1]; out[2] = TR[2]; return out; },
    pixelInfo: () => ({ climate: WOODS, region: GLENUMBRA }), nowMs: () => NOON * 1000,
    eye: () => ({ pos: [0, 1.6, 0], dir: [0, 0, 1] }), view: () => ({ yaw: 0, pitch: 0 }), feet: () => [0, 0, 0],
    entity: () => entity, keyLabel: () => 'E', input: () => ({ held: false, attack: false, choice: false }),
    active: () => true, activeDungeon: () => true,
  });
  await book.refresh();
  host.onBuilt(entry);
  for (let i = 0; i < 4; i++) await tick();
  return { host, made, kinds, nodes: () => host.nodesOf(400, 150), entry };
}

// ─── THE PICTURES (NODE-OUTLINE's, which the glint lights) ───────────

test('NODE-GLINT the host\'s pictures: every herb patch\'s and vein\'s mark carries the flats the host stood for it - which batch, which of its flats (from `first`, `count` of them) and their centres - its own and never a neighbour\'s, though nodes share a batch; a body\'s none (the glow) (mutants: the owners unrecorded; the range off by one; the pictures never handed)', async () => {
  const t = await rig();
  const all = t.nodes();
  assert.ok(all.length > 4, 'the pixel stands its herbs and veins');
  let shared = 0;
  for (const n of all) {
    const at = [n.local[0] + TR[0], n.local[1] + TR[1], n.local[2] + TR[2]];
    const m = t.host.marks(at).find((x) => x.key === n.key);
    if (!m) continue;
    const kind = t.kinds.find((k) => k.id === n.kind);
    const want = kind.flatsOf(n).flatMap((f) => f.centers);
    assert.ok(m.pictures?.length > 0, `${n.key}: its pictures`);
    const got = m.pictures.flatMap((p) => {
      assert.ok(t.made.includes(p.batch), 'a batch the host made');
      assert.equal(p.count, p.centers.length);
      assert.deepEqual(p.batch.centers.slice(p.first, p.first + p.count), p.centers.map((c) => [...c]), `${n.key}: its flats in the batch, from first`);
      if (p.first > 0 || p.batch.centers.length > p.count) shared++;
      return p.centers;
    });
    assert.deepEqual(got.map((c) => [...c]), want.map((c) => [...c]), `${n.key}: exactly its own flats`);
  }
  assert.ok(shared > 0, 'some node shares its batch - its range is its own');
  const body = t.host.marks([TR[0] + 10, TR[1], TR[2] + 10]).find((x) => x.key.startsWith('body:'));
  assert.ok(body, 'the body is marked');
  assert.equal(body.pictures, null, 'a loose body hands no picture: the glow lights it');
});

test('NODE-GLINT a tree\'s pictures (treeKind picturesOf): its forest\'s own flat - the group\'s batch, the flat\'s index, its centre (the very array its pixel\'s tree set holds) and its pixel - one list a node, made again only when its batch or its centre changes (none made a frame); none where the flat is gone (mutants: a flat\'s index not its own; made every call)', () => {
  const kind = treeKind({ book: { taken: () => false, counting: () => false, state: {} } });
  const c = [10, 0, 20], batch = { archive: 504, record: 3 };
  const entry = { forest: { groups: new Map([['g', { batch, centers: [[0, 0, 0], c], size: { w: 3, h: 6 } }]]) } };
  const n = { key: 'tree:1:2:3:0', flat: { group: 'g', i: 1 } };
  const p = kind.picturesOf(n, entry);
  assert.deepEqual(p, [{ batch, first: 1, count: 1, centers: [c], center: c, entry }]);
  assert.equal(p[0].center, c, 'the centre itself, not a copy: the 3D tree is found by it');
  assert.equal(kind.picturesOf(n, entry), p, 'the same list next frame');
  const again = { archive: 504, record: 3 };
  entry.forest.groups.get('g').batch = again;
  assert.notEqual(kind.picturesOf(n, entry), p, 'a new batch (the pixel stood again): a new list');
  assert.equal(kind.picturesOf(n, entry)[0].batch, again);
  assert.equal(kind.picturesOf({ key: 'x', flat: { group: 'h', i: 0 } }, entry), null, 'no such group');
  assert.equal(kind.picturesOf({ key: 'y', flat: { group: 'g', i: 9 } }, entry), null, 'no such flat');
});

test('NODE-GLINT treeInstanceOf: a tree\'s 3D instance this frame by its centre - its row in its pixel\'s set (Low Poly Trees\' or the jungle\'s) at the set\'s translation, its run in the frame that drew its handle; none when no frame drew it, or the centre is no tree of the sets (mutants: the translation forgotten; a stale frame trusted)', () => {
  const h0 = { id: 'oak' }, h1 = { id: 'kapok' };
  const c0 = [1, 2, 3], c1 = [4, 5, 6];
  const set = { trees: new Float32Array([0, 1, 2, 3, 1.1, 0.5, 1, 4, 5, 6, 0.9, 2.5]), centers: [c0, c1], handles: [h0, h1], ox: 100, oy: 10, oz: -50 };
  const run = { run: { handle: h1 }, scale: [1, 1, 1], size: [8, 20], subs: [] };
  const frame = { cut: new Set([h1]), runs: [{ run: { handle: h0 } }, run] };
  const rows = new WeakMap(), out = new Float32Array(5);
  const got = treeInstanceOf({ batch: null, first: 0, count: 1, center: c1, entry: { jungleTrees: set } }, [null, frame], rows, out);
  assert.equal(got.frame, frame); assert.equal(got.run, run);
  assert.deepEqual([...out], [104, 15, -44, 2.5, 0.9].map((v) => Math.fround(v)), 'x, y, z at the set\'s translation, yaw, scale');
  assert.equal(treeInstanceOf({ batch: null, first: 0, count: 1, center: c0, entry: { lowPolyTrees: set } }, [frame], rows, out), null, 'its handle not drawn this frame');
  assert.equal(treeInstanceOf({ batch: null, first: 0, count: 1, center: c1, entry: { lowPolyTrees: set } }, [], rows, out), null, 'no frame drew a tree');
  assert.equal(treeInstanceOf({ batch: null, first: 0, count: 1, center: [4, 5, 6], entry: { lowPolyTrees: set } }, [frame], rows, out), null, 'an equal array is not its centre');
  assert.equal(treeInstanceOf({ batch: null, first: 0, count: 1, center: c1, entry: {} }, [frame], rows, out), null, 'a pixel with no set');
});

// ─── THE LAWS ────────────────────────────────────────────────────────

test('NODE-GLINT a glint\'s reach: GLINT_SHARE of the picture\'s longer side, between GLINT_PX_MIN and GLINT_PX at GLINT_REF_ROWS rows, both with the image, never under GLINT_PX_FLOOR; the most it reaches the rectangle\'s room (mutants: the cap unscaled; the share unread; the least unscaled; the floor gone)', () => {
  assert.equal(glintPx(GLINT_REF_ROWS, 1000), GLINT_PX, 'a big picture: the most');
  assert.ok(Math.abs(glintPx(GLINT_REF_ROWS, 20) - GLINT_SHARE * 20) < 1e-12, 'a small one: its share');
  assert.equal(glintPx(GLINT_REF_ROWS, 2), GLINT_PX_MIN, 'a speck: the least, so a far node still glints');
  assert.equal(glintPx(2160, 1000), GLINT_PX * 2, 'with the image');
  assert.equal(glintPx(2160, 2), GLINT_PX_MIN * 2);
  assert.equal(glintPx(100, 1000), GLINT_PX_FLOOR, 'a retro image: a pixel and a half of its own');
  assert.equal(glintPxMax(GLINT_REF_ROWS), GLINT_PX);
  assert.equal(glintPxMax(540), GLINT_PX / 2);
  assert.equal(glintPxMax(100), GLINT_PX_FLOOR);
  for (const rows of [100, 480, 1080, 2160]) for (const side of [1, 10, 40, 400]) assert.ok(glintPx(rows, side) <= glintPxMax(rows), 'never past the room the rectangle keeps');
  assert.ok(GLINT_PX >= 10 && GLINT_PX <= 20 && GLINT_PX_MIN < GLINT_PX, 'a glint, not a flare');
});

test('NODE-GLINT the light: a warm daylight carrying GLINT_TINT of the profession\'s colour - each profession told apart, none its compass colour whole; the core whiter still (mutants: the tint whole; the light white)', () => {
  assert.deepEqual([...GLINT_LIGHT], [1, 0.95, 0.84]);
  assert.ok(GLINT_LIGHT[0] >= GLINT_LIGHT[1] && GLINT_LIGHT[1] >= GLINT_LIGHT[2], 'warm');
  const out = [0, 0, 0];
  for (const p of ['herbalism', 'mining', 'logging', 'hunting', 'fishing']) {
    const rgb = nodeMarkRgb(p), got = [...glintTint(rgb, out)];
    assert.deepEqual(got.map((v) => +v.toFixed(9)), rgb.map((c, i) => +(GLINT_LIGHT[i] * (1 - GLINT_TINT) + c * GLINT_TINT).toFixed(9)), p);
  }
  assert.equal(glintTint([0, 0, 0], out), out, 'written into out');
  assert.ok(GLINT_TINT > 0.2 && GLINT_TINT < 0.5, 'a hint of the colour, never the colour');
  const a = [...glintTint(nodeMarkRgb('herbalism'), [0, 0, 0])], b = [...glintTint(nodeMarkRgb('mining'), [0, 0, 0])];
  assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) > 0.05, 'the professions still told apart');
  assert.ok(GLINT_CORE_WHITE > 0.3 && GLINT_CORE_WHITE < 1, 'the core whiter than the light, never a hole of white alone');
});

test('NODE-GLINT the sheen: none within GLINT_SHEEN_NEAR_M (the tree under the axe never flashes), rising smoothly to GLINT_GAIN.sheen at GLINT_SHEEN_FULL_M and held beyond; every rate whole over the glow\'s 60 s clock (mutants: the near fade gone; the far gain short)', () => {
  assert.equal(glintSheen(0), 0);
  assert.equal(glintSheen(GLINT_SHEEN_NEAR_M), 0);
  assert.equal(glintSheen(GLINT_SHEEN_FULL_M), GLINT_GAIN.sheen);
  assert.equal(glintSheen(120), GLINT_GAIN.sheen);
  assert.ok(Math.abs(glintSheen((GLINT_SHEEN_NEAR_M + GLINT_SHEEN_FULL_M) / 2) - GLINT_GAIN.sheen / 2) < 1e-12, 'half way, half');
  assert.ok(GLINT_SHEEN_NEAR_M >= 3 && GLINT_SHEEN_FULL_M > GLINT_SHEEN_NEAR_M);
  assert.ok(GLINT_GAIN.sheen > 0.05 && GLINT_GAIN.sheen < 0.25, 'a breath of light, never a flash');
  assert.ok(GLINT_SHEEN_SHARE > 0.2 && GLINT_SHEEN_SHARE < 1, 'dark between its crossings');
  assert.equal(glintRatesWhole(), true);
  assert.deepEqual([GLINT_SHEEN_HZ, GLINT_RATE, GLINT_RATE_STEP].map((r) => Math.round(r * 60)), [9, 21, 3]);
});

test('NODE-GLINT screenRect, widenRect, snapRect and innerShare: a node\'s boxes through the camera to its picture on screen, held to the screen; off it, none; a box behind the eye the whole screen; widened by the room its rays take and held again; snapped out to whole pixels; the picture\'s box as its shares of that rectangle (mutants: a corner skipped; the clamp gone; the widening unapplied; the snap rounding in; the share off its corner)', () => {
  // an identity projection: NDC is x, y
  const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  const out = [0, 0, 0, 0];
  screenRect([[-0.2, -0.1, 0, 0.4, 0.3, 0]], 1, I, out);
  assert.deepEqual(out.map((v) => +v.toFixed(9)), [0.1, 0.1, 0.3, 0.2]);
  screenRect([[-0.2, -0.1, 0, 0, 0, 0], [0.1, 0.1, 0, 0.4, 0.3, 0]], 2, I, out);
  assert.deepEqual(out.map((v) => +v.toFixed(9)), [0.1, 0.1, 0.3, 0.2], 'every box, every corner');
  screenRect([[-0.2, -0.1, 0, 0, 0, 0], [5, 5, 0, 6, 6, 0]], 1, I, out);
  assert.deepEqual(out.map((v) => +v.toFixed(9)), [-0.1, -0.05, 0.1, 0.05], 'the first `count` alone');
  screenRect([[0.8, 0.8, 0, 1.5, 1.5, 0]], 1, I, out);
  assert.deepEqual(out.map((v) => +v.toFixed(9)), [0.9, 0.9, 0.1, 0.1], 'held to the screen');
  assert.equal(screenRect([[2, 2, 0, 3, 3, 0]], 1, I, out), null, 'off the screen');
  const behind = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1, 0, 0, 0, 0];   // w = -z: z >= 0 is behind
  assert.deepEqual(screenRect([[0, 0, -1, 0.1, 0.1, 0.5]], 1, behind, out), [0, 0, 1, 1], 'reaching behind the eye: the whole screen');
  const wide = [0, 0, 0, 0];
  assert.deepEqual(widenRect([0.1, 0.1, 0.3, 0.2], [0.05, 0.1], wide).map((v) => +v.toFixed(9)), [0.1, 0.1, 0.35, 0.3], 'widened each way');
  assert.deepEqual(widenRect([0.85, -0.85, 0.1, 0.1], [0.1, 0.1], wide).map((v) => +v.toFixed(9)), [0.825, -0.825, 0.175, 0.175], 'held to the screen (0.65..1.05 to 0.65..1)');
  const r = [0.1, -0.2, 0.0731, 0.0517];
  const was = [r[0] - r[2], r[0] + r[2], r[1] - r[3], r[1] + r[3]];
  snapRect(r, 640, 480);
  const px = [(r[0] - r[2] + 1) * 320, (r[0] + r[2] + 1) * 320, (r[1] - r[3] + 1) * 240, (r[1] + r[3] + 1) * 240];
  for (const v of px) assert.ok(Math.abs(v - Math.round(v)) < 1e-9, `whole pixels (${v})`);
  assert.ok(r[0] - r[2] <= was[0] + 1e-12 && r[0] + r[2] >= was[1] - 1e-12 && r[1] - r[3] <= was[2] + 1e-12 && r[1] + r[3] >= was[3] - 1e-12, 'snapped out, never in');
  const share = innerShare([0.1, 0.1, 0.3, 0.2], [0.1, 0.1, 0.4, 0.4], [0, 0, 0, 0]);
  assert.deepEqual(share.map((v) => +v.toFixed(9)), [0.125, 0.25, 0.875, 0.75], 'the picture\'s box within its rectangle');
  assert.deepEqual(innerShare([0.2, 0.3, 0.5, 0.5], [0.2, 0.3, 0.5, 0.5], [0, 0, 0, 0]), [0, 0, 1, 1], 'the whole of it');
});

test('NODE-GLINT the programs: the mask\'s vertex stage is the billboard program\'s own with the rectangle stretched over the tile after it, never moving a vertex given way; its fragment stage the picture\'s cut (a flat\'s 0.5 and margin, a tree\'s material and handover); the light\'s sheen lit only inside the silhouette and never still, every glint a life at the first of its tries the silhouette holds within the picture\'s box (none, dark), held under reduced motion, its core, rays and bloom about its spot; nothing lit nothing drawn; stood toward the eye, never past half its way, and faded in the fog and the haze (mutants: the remap moving a gone vertex; the sheen outside the picture; the sheen under reduced motion; a glint off the picture; a dark life lit; the still glints moving; the light behind its node; the pull past the eye)', () => {
  const bb = src('src/render/renderer.js');
  assert.ok(NODE_MASK_VS.startsWith('#version 300 es'));
  assert.ok(NODE_MASK_VS.includes('if (uMesh > 0.5) {') && NODE_MASK_VS.includes('if (gone) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);'), 'BB_VS whole');
  assert.ok(bb.includes('if (gone) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);'));
  assert.match(NODE_MASK_VS, /if \(gone\) gl_Position = vec4\(2\.0, 2\.0, 2\.0, 1\.0\);[^\n]*\n\s*if \(!gone\) gl_Position\.xy = \(gl_Position\.xy - uMaskRect\.xy \* gl_Position\.w\) \* uMaskRect\.zw;/, 'the remap after the vertex is placed, a gone one left off the clip volume');
  assert.match(NODE_MASK_FS, /if \(a < 0\.5\) discard;/);
  assert.match(NODE_MASK_FS, /a = vAlpha > 0\.0 \? a \* vAlpha : 1\.0;/, 'a tree\'s material cut, an opaque card never');
  assert.match(NODE_MASK_FS, /bayer4\(gl_FragCoord\.xy\) \+ 0\.03125 >= vFade/, 'the handover\'s screen-door');
  const fs = NODE_GLINT_FS;
  assert.ok(fs.startsWith('#version 300 es'));
  assert.ok(fs.includes('  if (here < 1.0 && uStill < 0.5) {'), 'the sheen inside the silhouette alone, and never still');
  assert.ok(fs.includes(`fract(tm * ${f4(GLINT_SHEEN_HZ)} + uSeed) / ${f4(GLINT_SHEEN_SHARE)}`), 'crossing at its rate, dark the rest of its period');
  assert.ok(fs.includes('    sheen = exp(-k * k) * uSheen;'), 'at its gain (none near)');
  assert.ok(fs.includes(`  for (int i = 0; i < ${GLINT_COUNT}; i++) {`), 'every glint');
  assert.ok(fs.includes(`tm * (${f4(GLINT_RATE)} + float(i) * ${f4(GLINT_RATE_STEP)})`), 'each its own pace');
  assert.ok(fs.includes('  float tm = uTime * (1.0 - uStill);'), 'still: every life held at its first');
  assert.ok(fs.includes(`    float env = uStill > 0.5 ? ${f4(GLINT_STILL)} : pow(sin(PI * (cyc - c)), ${f4(GLINT_FLASH)});`), 'born and gone dark; still, steady');
  assert.ok(fs.includes(`    for (int j = 0; j < ${GLINT_TRIES}; j++) {`), 'its tries');
  assert.ok(fs.includes('      vec2 spot = mix(uInner.xy, uInner.zw, '), 'within the picture\'s box');
  assert.ok(fs.includes('      if (d < 1.0) { p = spot; pd = d; break; }'), 'the first the silhouette holds');
  assert.ok(fs.includes('    if (pd >= 1.0) continue;'), 'none: that life dark');
  assert.ok(fs.includes('    vec2 off = (q - p) * rectPx;'), 'measured in the screen\'s pixels');
  assert.ok(fs.includes('    core += co; rays += ry; bloom += bl;'));
  assert.ok(fs.includes(`  float lit = sheen + ${f4(GLINT_GAIN.ray)} * rays + ${f4(GLINT_GAIN.bloom)} * bloom + ${f4(GLINT_GAIN.core)} * core;`));
  assert.ok(fs.includes('  if (lit * uAlpha < 0.002) discard;'), 'nothing lit, nothing drawn');
  assert.ok(fs.includes(`at3 - away * (min(${f4(GLINT_PULL)}, 0.5 * far) / max(far, 1e-4))`), 'stood toward the eye, never past half its way');
  assert.ok(GLINT_PULL > 0.05 && GLINT_PULL < 0.6);
  assert.ok(fs.includes(`mix(uColor, vec3(1.0), ${f4(GLINT_CORE_WHITE)}) * ${f4(GLINT_GAIN.core)} * core`), 'the core whiter');
  assert.ok(fs.includes('  o = vec4(light * uAlpha * fogFactorAt(at3), 1.0);'), 'kindled, faded and fogged');
  assert.equal(GLINT_MAX, NODE_GLOW_MAX, 'a tile for every node the glow could light');
  assert.equal(GLINT_MAX, GLINT_GRID * GLINT_GRID);
  assert.equal(GLINT_QUAD_INDEX_BYTES, 6 * 4, 'six u32 indices a flat');
  assert.match(bb, /BB_QUAD_INDEX_BYTES = 6 \* 4;/);
  assert.ok(GLINT_COUNT >= 3 && GLINT_COUNT <= 10 && GLINT_TRIES >= 2, 'a few glints, each likely to find the picture');
});

// ─── THE DRAW ────────────────────────────────────────────────────────

/** A WebGL2 that records every call; the viewport 640 x 480 at (8, 4), the frame's target a token. */
function fakeGl() {
  const calls = [];
  const C = { VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3, LINK_STATUS: 4, ARRAY_BUFFER: 5, STATIC_DRAW: 6, FLOAT: 7, TRIANGLES: 8, BLEND: 9, CULL_FACE: 11,
    DEPTH_TEST: 12, LESS: 13, VIEWPORT: 14, FRAMEBUFFER_BINDING: 15, FRAMEBUFFER: 16, TEXTURE_2D: 17, DEPTH_COMPONENT24: 18, DEPTH_ATTACHMENT: 19, NONE: 20,
    ELEMENT_ARRAY_BUFFER: 21, UNSIGNED_INT: 22, DYNAMIC_DRAW: 23, SCISSOR_TEST: 24, TEXTURE0: 25, DEPTH_BUFFER_BIT: 26, ONE: 27,
    TEXTURE_MIN_FILTER: 29, TEXTURE_MAG_FILTER: 30, NEAREST: 31, TEXTURE_WRAP_S: 32, TEXTURE_WRAP_T: 33, CLAMP_TO_EDGE: 34 };
  let n = 0;
  const gl = new Proxy(C, {
    get(t, k) {
      if (k in t) return t[k];
      return (...a) => {
        calls.push([k, ...a]);
        if (k === 'getShaderParameter' || k === 'getProgramParameter') return true;
        if (k === 'getUniformLocation') return a[1];
        if (k === 'getParameter') return a[0] === C.VIEWPORT ? new Int32Array([8, 4, 640, 480]) : a[0] === C.FRAMEBUFFER_BINDING ? 'frame-target' : null;
        if (k === 'isEnabled') return false;
        return { id: ++n, kind: k };
      };
    },
  });
  return { gl, calls };
}

test('NODE-GLINT the draw over a fake GL: nothing to light touches nothing; each node\'s pictures drawn into its own tile of the atlas - a flat\'s own six indices (its batch\'s range, from its first), a 3D tree its run\'s every submesh as one instance - then the frame\'s target and viewport back and one quad a node, added (ONE, ONE), in its light, kindling, seed, reach, picture\'s box and sheen by its distance; the clock and reduced motion handed; the baseline handed back (mutants: the tile shared; the offset its batch\'s first flat; the target not given back; the viewport not given back; the light not added; the colour whole; the sheen by no distance; the reach by the room; the seed lost; the clock unhanded)', () => {
  const { gl, calls } = fakeGl();
  const r = new NodeGlintRenderer(/** @type {any} */ (gl));
  const proj = new Float32Array([1.5, 0, 0, 0, 0, 2, 0, 0, 0, 0, -1.001, -1, 0, 0, -0.1, 0]);
  const view = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -1.6, 0, 1]);
  const herbTex = { tex: 'herb' }, subTex = { tex: 'leaf' };
  const handle = { h: 1 }, c = [0, 0, -12];
  const frame = { eye: [0, 1.6, 0], radius: 140, band: 20, gpu: { vb: 'vb', ib: 'ib' }, cut: new Set([handle]), runs: [{ run: { handle }, scale: [1, 1, 1], size: [6, 10], sway: 0, subs: [{ offset: 96, count: 30, tex: subTex, alpha: 2, cull: 0 }, { offset: 216, count: 12, tex: subTex, alpha: 0, cull: 2 }] }] };
  const renderer = { gl, _proj: proj, _view: view, _camPos: new Float32Array([0, 1.6, 0]), _bbRight: new Float32Array([1, 0, 0]), _bbUp: new Float32Array([0, 1, 0]),
    _fogMode: 0, _fogRange: [0, 1], textures: new Map([['500_9', herbTex], ['504_3', { tex: 'far' }]]), lptDrawnFrames: () => [frame, null] };
  calls.length = 0;
  assert.equal(r.draw([], renderer, 0), 0);
  assert.equal(calls.length, 0, 'nothing to light, nothing touched');
  const batch = { archive: 500, record: 9, frame: null, vao: 'herb-vao', _ibOff: 4800, size: { w: 1, h: 1 }, origin: [0, 0, 0] };
  const forest = { archive: 504, record: 3, frame: null, vao: 'forest-vao', _ibOff: 0, size: { w: 6, h: 10 }, origin: [0, 0, 0], lptProto: handle };
  const set = { trees: new Float32Array([0, ...c, 1, 0.3]), centers: [c], handles: [handle], ox: 0, oy: 0, oz: 0 };
  const herbAt = [1, 0, -6];
  const list = [
    { alpha: 1, seed: 0.25, at: herbAt, rgb: nodeMarkRgb('herbalism'), mark: { pictures: [{ batch, first: 2, count: 3, centers: [[1, 0, -6], [1.3, 0, -6.2], [0.8, 0, -5.8]] }] } },
    { alpha: 0.5, seed: 0.75, at: c, rgb: nodeMarkRgb('logging'), mark: { pictures: [{ batch: forest, first: 0, count: 1, centers: [c], center: c, entry: { lowPolyTrees: set } }] } },
    { alpha: 0, seed: 0.5, at: [0, 0, -3], rgb: nodeMarkRgb('mining'), mark: { pictures: [{ batch, first: 0, count: 1, centers: [[0, 0, -3]] }] } },
  ];
  calls.length = 0;
  assert.equal(r.draw(list, renderer, 2.5, true), 2, 'the unkindled one none');
  assert.equal(r.trees, 1);
  const at = (k, ...a) => calls.findIndex((x) => x[0] === k && a.every((v, i) => x[i + 1] === v));
  // the masks: into the atlas, a tile a node
  const toAtlas = at('bindFramebuffer', gl.FRAMEBUFFER, r.fb), back = at('bindFramebuffer', gl.FRAMEBUFFER, 'frame-target');
  assert.ok(toAtlas >= 0 && back > toAtlas, 'into the atlas, then the frame\'s own target back');
  const tiles = calls.slice(toAtlas, back).filter((x) => x[0] === 'viewport').slice(1).map((x) => x.slice(1, 3));
  assert.deepEqual(tiles, [[0, 0], [GLINT_TILE, 0]], 'its own tile each');
  const flats = calls.slice(toAtlas, back).filter((x) => x[0] === 'drawElements');
  assert.deepEqual(flats.map((x) => x.slice(2)), [[18, gl.UNSIGNED_INT, 4800 + 2 * 24], [6, gl.UNSIGNED_INT, 0]], 'the herb\'s three flats from its first; the tree\'s far picture');
  const trees = calls.slice(toAtlas, back).filter((x) => x[0] === 'drawElementsInstanced');
  assert.deepEqual(trees.map((x) => x.slice(2)), [[30, gl.UNSIGNED_INT, 96, 1], [12, gl.UNSIGNED_INT, 216, 1]], 'every submesh of its run, one instance');
  assert.ok(calls.some((x) => x[0] === 'bufferSubData' && x[3] instanceof Float32Array && x[3][0] === c[0] && x[3][2] === c[2]), 'its instance row written');
  assert.ok(calls.some((x) => x[0] === 'vertexAttribDivisor' && x[1] === 3 && x[2] === 1), 'the door\'s buffers under the pass\'s own instance');
  // the light: on the frame's target, its viewport back, added
  const light = calls.slice(back);
  assert.deepEqual(light[1], ['viewport', 8, 4, 640, 480], 'its viewport back');
  assert.ok(light.some((x) => x[0] === 'blendFunc' && x[1] === gl.ONE && x[2] === gl.ONE), 'added onto the frame: it only brightens');
  assert.equal(light.filter((x) => x[0] === 'drawArrays').length, 2, 'one quad a node');
  const u = (name) => light.filter((x) => x[0].startsWith('uniform') && x[1] === name).map((x) => x.slice(2));
  assert.deepEqual(u('uTime'), [[2.5]], 'the clock handed');
  assert.deepEqual(u('uStill'), [[1]], 'reduced motion handed');
  assert.deepEqual(u('uColor').map((v) => v.map((x) => +x.toFixed(6))), [glintTint(nodeMarkRgb('herbalism'), [0, 0, 0]), glintTint(nodeMarkRgb('logging'), [0, 0, 0])].map((v) => v.map((x) => +x.toFixed(6))), 'each its light, never its compass colour whole');
  assert.deepEqual(u('uAlpha'), [[1], [0.5]], 'its kindling');
  assert.deepEqual(u('uSeed'), [[0.25], [0.75]], 'its own seed');
  const eye = renderer._camPos;
  const want = [herbAt, c].map((p) => glintSheen(Math.hypot(p[0] - eye[0], p[1] - eye[1], p[2] - eye[2])));
  assert.deepEqual(u('uSheen').map((v) => +v[0].toFixed(9)), want.map((v) => +v.toFixed(9)), 'the sheen by its distance');
  assert.ok(want[0] < want[1], 'nearer, fainter');
  const reach = u('uGlint').map((v) => v[0]), shares = u('uInner');
  for (let i = 0; i < 2; i++) {
    const s = r._nodes[i];
    assert.equal(reach[i], glintPx(480, Math.max(s.inner[2] * 640, s.inner[3] * 480)), 'its reach by its picture on screen');
    assert.deepEqual(shares[i], innerShare(s.inner, s.rect, [0, 0, 0, 0]), 'its picture\'s box in its rectangle');
    assert.ok(shares[i][0] > 0 && shares[i][1] >= 0 && shares[i][2] < 1 && shares[i][3] <= 1, 'the room its rays take round it');
    assert.ok(s.rect[2] * 640 >= s.inner[2] * 640 + glintPxMax(480) - 1e-9, 'widened by the most a glint reaches');
  }
  // the baseline handed back
  const last = calls.length - 1 - [...calls].reverse().findIndex((x) => x[0] === 'drawArrays');
  const after = calls.slice(last).map((x) => x.slice(0, 2).join(':'));
  for (const want2 of [`disable:${gl.BLEND}`, `depthMask:true`, `enable:${gl.CULL_FACE}`]) assert.ok(after.includes(want2), want2);
  assert.ok(!calls.some((x) => x[0] === 'enable' && x[1] === gl.SCISSOR_TEST), 'no scissor where none stood');
  // a far herb, a speck on screen: its reach its picture's share - under the most, never the room round it
  calls.length = 0;
  assert.equal(r.draw([{ alpha: 1, seed: 0.5, at: [0, 0, -60], rgb: nodeMarkRgb('herbalism'), mark: { pictures: [{ batch, first: 0, count: 1, centers: [[0, 0, -60]] }] } }], renderer, 0), 1);
  const speck = r._nodes[0], side = Math.max(speck.inner[2] * 640, speck.inner[3] * 480);
  const far = calls.filter((x) => x[0] === 'uniform1f' && x[1] === 'uGlint').map((x) => x[2]);
  assert.deepEqual(far, [glintPx(480, side)]);
  assert.ok(far[0] < glintPxMax(480) - 0.5 && Math.abs(far[0] - GLINT_SHARE * side) < 1e-9, `its share of its picture (${far[0]} px of a ${side} px picture)`);
  r.dispose();
  assert.ok(calls.some((x) => x[0] === 'deleteFramebuffer') && calls.some((x) => x[0] === 'deleteTexture') && calls.filter((x) => x[0] === 'deleteProgram').length === 2, 'EVERY ALLOCATION HAS AN OWNER');
});

test('NODE-GLINT the world host\'s pass (createNodeGlintPass): a mark with pictures is lit by its glints, one with none goes to the glow; the programs built at IDLE once a node is first lit, nothing lit until they stand; a glint that will not build hands every mark to the glow; the clock wrapped at 60 s and reduced motion handed; a pass that drew is a foreign pass; null forgets (mutants: every mark to the glow; the build on the frame; the clock unwrapped; reduced motion unread)', () => {
  const { gl } = fakeGl();
  let foreign = 0;
  const renderer = { gl, _proj: new Float32Array(16), _view: new Float32Array(16), _camPos: new Float32Array([0, 1.6, 0]), markForeignPass: () => { foreign++; } };
  const glowed = [], lit = [], idled = [];
  const glow = { draw: (m) => { glowed.push(m ? m.map((x) => x.key) : null); return 0; } };
  const fake = { draw: (list, r, seconds, still) => { lit.push({ keys: list.map((g) => g.mark.key), seconds, still }); return list.length; }, dispose() {} };
  let t = 70, builds = 0, reduced = false;
  const pass = createNodeGlintPass(renderer, { glow, now: () => t, build: () => { builds++; return /** @type {any} */ (fake); }, idle: (fn) => idled.push(fn), reduced: () => reduced });
  const herb = { key: 'herb:1', profession: 'herbalism', at: [0, 0, -5], w: 2, h: 1, pictures: [{ batch: {}, first: 0, count: 1 }] };
  const body = { key: 'body:1', profession: 'hunting', at: [1, 0, -5], w: 1, h: 1, pictures: null };
  assert.equal(pass.draw([herb, body]), 0, 'not built: nothing lit');
  assert.deepEqual(glowed.at(-1), ['body:1'], 'the body to the glow at once');
  assert.equal(builds, 0, 'never built on a frame');
  assert.equal(idled.length, 1);
  idled[0]();
  assert.equal(builds, 1);
  t += 0.5;
  assert.equal(pass.draw([herb, body]), 1);
  assert.deepEqual(lit.at(-1), { keys: ['herb:1'], seconds: 10.5, still: false }, 'the clock wrapped');
  reduced = true; t += 0.25;
  pass.draw([herb]);
  assert.equal(lit.at(-1).still, true, 'reduced motion: still');
  assert.equal(foreign, 2, 'a foreign pass');
  pass.draw(null);
  assert.deepEqual(glowed.at(-1), null, 'null forgets, the glow\'s too');
  const broken = createNodeGlintPass(renderer, { glow, now: () => t, build: () => { throw new Error('no GL'); }, idle: (fn) => fn(), reduced: () => false });
  broken.draw([herb]);
  broken.draw([herb, body]);
  assert.deepEqual(glowed.at(-1), ['herb:1', 'body:1'], 'a glint that will not build: every mark to the glow');
});

// ─── THE WIRING ──────────────────────────────────────────────────────

test('NODE-GLINT the wiring: the world host lights the marks through the glint, the glow its fallback, in the hook after each mode\'s opaque world (the street\'s, a dungeon\'s), none under the travel view; the renderer keeps the flats\' basis and the 3D trees its frame drew, forgotten each frame; no ring remains (mutants: the glint unwired; the drawn trees never forgotten; the drawn trees never kept; no glow of its own)', () => {
  const w = src('src/scenes/world.js'), r = src('src/render/renderer.js');
  assert.match(w, /const nodeGlintPass = createNodeGlintPass\(renderer\);/);   // PIN MOVED (NODE-GLINT): the outline's pass, renamed - HOST-SPLIT's no entry in bootWorld stands
  assert.match(src('src/render/nodeGlint.js'), /export function createNodeGlintPass\(renderer, \{ glow = createNodeGlowPass\(renderer\), /, 'the fallback glow its own when the host hands none');
  assert.match(w, /const drawVeiledPeerBodies = \(\) => \{ peerBodies\?\.drawVeiled\(\); drawAuras\(\); nodeGlintPass\.draw\(travelView\?\.active \? null : nodeMarksAt\(enchantFeet\(\)\)\); \};/);
  assert.doesNotMatch(w, /nodeGlowPass|nodeOutline/, 'the glow is the glint\'s fallback alone, and the ring is gone');
  // PIN MOVED (the seams review's matrix-for-a-basis test): the three components the vec3 uniforms read, never a copy whole
  assert.match(r, /const bbR = \(this\._bbRight \?\?= new Float32Array\(3\)\), bbU = \(this\._bbUp \?\?= new Float32Array\(3\)\);\n\s*bbR\[0\] = camRight\[0\]; bbR\[1\] = camRight\[1\]; bbR\[2\] = camRight\[2\];\n\s*bbU\[0\] = camUp\[0\]; bbU\[1\] = camUp\[1\]; bbU\[2\] = camUp\[2\];/);
  assert.match(r, /for \(let i = 0; i < slots\.length; i\+\+\) drawn\[i\] = slots\[i\]\?\.runs\.length \? slots\[i\] : null;/);
  assert.match(r, /this\._lptDrawn\?\.fill\(null\);   \/\/ NODE-OUTLINE: and the 3D trees a frame drew/);
  assert.match(r, /lptDrawnFrames\(\) \{ return this\._lptDrawn \?\? \[\]; \}/);
  assert.match(src('src/scenes/gatherHost.js'), /for \(const r of out\) r\.pictures = r\.kind\.picturesOf\?\.\(r\.node, r\.src\?\.entry \?\? null\) \?\? r\.src\?\.pictures\?\.get\(r\.key\) \?\? null;/);
});
