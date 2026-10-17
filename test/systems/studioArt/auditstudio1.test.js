// AUDIT STUDIO1 (2026-10-17, the owner: "Audit this and ensure perfection"; the record is
// bible/01-Overview/audits/Audit-Studio1.md): five cold lanes over the studio's frozen tree, every finding reproduced
// before it was fixed. What the fixes hold:
//
//   S1  the stand-in the studio covers: its picture stands in for a studio picture that will not load (A1), and gives
//       the studio's its size, its scale and its box - a billboard stands as big, a doll piece fits (A2)
//   S2  the boot waits for the registration alone; the port's own pictures decode after it, a few at a time (A3)
//   S3  an archive's first load waits for the studio's listing - a bounded while (A5) - so the first area is drawn in it
//   S4  a late picture lands only on the wear still current - a room repainted keeps its new paint (A4); a picture that
//       answers and is not decoded is decoded and worn late (A6)
//   S5  what the studio inherits: `lazy` (A7); a studio picture of one dye makes no dyed set of a stand-in (A8); a dye
//       the game never asks by is refused by name (A9)
//   S6  a listing that would not read is asked again; one not served is an answer (A11); the icons' cache keys on the
//       studio, and the wagon's icon asks for the install itself (U2, U3)
//   S7  the ground: a ground archive's set lays the studio's records in, the gate shut or open, at the largest
//       picture's size (D1)
//   S8  a ship's night twin is lit by its own emission picture where it has one (B4, D5)
//   S9  the check's notes: clear texels on a slot drawn solid, a name no painted model's slot; and the slots counted -
//       248, 29 of them cut-outs (D2, D6, D12)
//
// The pictures are the test's own (tools/pngIO.mjs): no game data (Port-Doctrine).
import '../../modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writePng, readPng } from '../../../tools/pngIO.mjs';
import { setValue } from '../../../src/systems/settings/settings.js';
import {
  addVendorTextures, clearVendorTextures, clearTextureReplacements, setTextureReplacements, hasTextureReplacement,
  decodedTexture, preloadTextureArchive, preloadTextureRecord, isVendorArchive, vendorTextureStandIn, setTextureDeriveContext,
  holdTextureTiers, textureTiersSettled, studioRecordsOf, PRELOAD_CONCURRENCY,
} from '../../../src/systems/textureReplacement.js';
import {
  installStudioArt, studioLanded, studioUrl, studioFile, wearPainted, studioGeneration, _resetStudioArt, STUDIO_INDEX, STUDIO_HOLD_MS,
} from '../../../src/systems/studioArt/studioArt.js';
import { STUDIO_SETS, studioSlots } from '../../../src/systems/studioArt/studioSlots.js';
import { studioListing, STUDIO_TREE } from '../../../scripts/studioArtIndex.mjs';
import { checkStudio } from '../../../tools/studioArt.mjs';
import { createDataPipeline } from '../../../src/scenes/dataPipeline.js';
import { dfmodGroundLayers } from '../../../src/systems/dfmodTextures.js';
import { registerGalleonArt, galleonArt, _resetGalleonArt, GALLEON_ARCHIVE, GALLEON_NIGHT, TEX as GALLEON_TEX } from '../../../src/world/ships/galleonArt.js';
import { createComeSailAwayPool } from '../../../src/scenes/comeSailAway/comeSailAwayPool.js';
import { Boat } from '../../../src/systems/comeSailAway/comeSailAwayBoat.js';
import { HULL } from '../../../src/systems/naval/navalShips.js';
import { paintCaravanRoom, caravanRoomPictures } from '../../../src/scenes/caravanRoom.js';
import { WAGON_ARCHIVE, TEX as WAGON_TEX, lookRecord } from '../../../src/world/wagonArt.js';
import { toColor32 } from '../../../src/formats/color32Order.js';

const decode = async (bytes) => readPng(bytes);
/** A picture of the test's own, `w` x `h`, every texel `rgb` (alpha `a`). */
const picture = (w, h, rgb, a = 255) => writePng({ width: w, height: h, data: new Uint8Array(w * h * 4).map((_, i) => (i % 4 === 3 ? a : rgb[i % 4])) });
const red = (c32) => [c32.colors[0], c32.colors[1], c32.colors[2]];
/** A served studio (studio1_door's): `files` path -> PNG bytes; `gate` holds every answer until it opens; `asked` and
 *  the fetches in flight are counted. */
function served(files, { gate = null, index = true, fail = false } = {}) {
  const asked = [];
  let inFlight = 0, most = 0;
  const fetch = async (url) => {
    asked.push(url);
    if (fail) throw new Error('offline');
    inFlight++; most = Math.max(most, inFlight);
    try {
      if (gate) await gate;
      if (url === studioUrl(STUDIO_INDEX)) return index ? { ok: true, json: async () => ({ studio: 1, files: Object.keys(files) }) } : { ok: false, status: 404 };
      for (const [path, bytes] of Object.entries(files)) if (url === studioUrl(path)) return { ok: true, arrayBuffer: async () => Uint8Array.from(bytes).buffer };
      return { ok: false, status: 404 };
    } finally { inFlight--; }
  };
  return { fetch, asked, most: () => most };
}
function reset() {
  _resetStudioArt(); clearVendorTextures(); clearTextureReplacements(); _resetGalleonArt();
  setValue('Enhancements', 'AssetInjection', 'True');
  setTextureDeriveContext({ classicRgba: async () => null });
}
const turns = async (n = 5) => { for (let i = 0; i < n; i++) await new Promise((r) => setImmediate(r)); };
/** The browser's decode door (textureReplacement.js decodePng) given node's PNG reader, so the pipeline's own preload -
 *  which takes no decode of a test's - decodes as the game does. Restored by the caller. */
function browserDecode() {
  const had = { createImageBitmap: globalThis.createImageBitmap, OffscreenCanvas: globalThis.OffscreenCanvas };
  globalThis.createImageBitmap = async (blob) => readPng(new Uint8Array(await blob.arrayBuffer()));
  globalThis.OffscreenCanvas = class { constructor() { this.img = null; } getContext() { return { drawImage: (img) => { this.img = img; }, getImageData: () => this.img }; } };
  return () => Object.assign(globalThis, had);
}

test('AUDIT STUDIO1 S1: the stand-in the studio covers stands in for a studio picture that will not load (her painted deck, never a hole), and gives the studio\'s picture its size, its scale and its box', async () => {
  reset();
  try {
    // A1: through her real registration - the studio's deck will not load (404), its trim is no PNG
    const s = served({ [`a/${GALLEON_ARCHIVE}_${GALLEON_TEX.trim}-0.png`]: new Uint8Array([1, 2, 3]) });
    await installStudioArt({ fetch: (u) => (u.includes(`_${GALLEON_TEX.deck}-0`) ? Promise.resolve({ ok: false, status: 404 }) : s.fetch(u)), decode: async (b) => readPng(b) });
    addVendorTextures([{ archive: GALLEON_ARCHIVE, record: GALLEON_TEX.deck, studio: true, fileName: 'studio:a/deck.png', load: async () => null }]);
    registerGalleonArt(addVendorTextures);
    await preloadTextureArchive(GALLEON_ARCHIVE, { decode });
    const painted = new Map(galleonArt());
    for (const rec of [GALLEON_TEX.deck, GALLEON_TEX.trim]) {
      const got = decodedTexture(GALLEON_ARCHIVE, rec);
      assert.ok(got, `${rec}: a picture, not a hole`);
      assert.ok(Buffer.from(got.colors).equals(Buffer.from(toColor32(painted.get(rec)).colors)), `${rec}: her own painted picture stands in`);
    }
    // a studio picture decoded before the art it covers registered (the boot's install, then her pool) is decoded again
    // with it: its box is hers
    reset();
    await installStudioArt({ fetch: served({ [`a/${GALLEON_ARCHIVE}_${GALLEON_TEX.deck}-0.png`]: picture(4, 4, [33, 0, 0]) }).fetch, decode });
    await studioLanded();
    assert.equal(vendorTextureStandIn(GALLEON_ARCHIVE).getBox(GALLEON_TEX.deck), null, 'decoded alone: no box yet');
    registerGalleonArt(addVendorTextures);
    await preloadTextureArchive(GALLEON_ARCHIVE, { decode });
    assert.deepEqual(vendorTextureStandIn(GALLEON_ARCHIVE).getBox(GALLEON_TEX.deck), { width: 64, height: 64 }, 'covered: her deck\'s box');
    assert.deepEqual(red(decodedTexture(GALLEON_ARCHIVE, GALLEON_TEX.deck)), [33, 0, 0], 'still the studio\'s picture');
    // A2: a stand-in built at a classic record's scale (a town's clutter, a DET flat) - the studio's at twice its size
    reset();
    const built = { width: 16, height: 24, data: new Uint8Array(16 * 24 * 4).fill(90), scale: { width: 64, height: 64 } };
    addVendorTextures([{ archive: 39100, record: 0, standIn: true, offset: { x: 2, y: 3 }, build: async () => built }]);
    addVendorTextures([{ archive: 39100, record: 0, studio: true, fileName: 'studio:a/39100_0-0.png', load: async () => picture(32, 48, [200, 10, 10]) }]);
    await preloadTextureArchive(39100, { decode });
    const t = vendorTextureStandIn(39100);
    assert.deepEqual(t.getSize(0), { width: 16, height: 24 }, 'it stands as big as the stand-in');
    assert.deepEqual(t.getScale(0), { width: 64, height: 64 }, 'at the stand-in\'s scale');
    assert.deepEqual(t.getBox(0), { width: 16, height: 24 }, 'the doll fits it to the stand-in\'s box');
    assert.deepEqual([t.getDFBitmap(0).width, t.getDFBitmap(0).height], [32, 48], 'drawn in the studio\'s own texels');
    assert.deepEqual(t.getOffset(0), { x: 2, y: 3 });
    assert.match(readFileSync(new URL('../../../src/ui/paperDoll.js', import.meta.url), 'utf8'), /const classic = tex\.vendor \? \(tex\.getBox\?\.\(record\) \?\? null\) : tex\.getSize\(record\);/, 'the doll\'s box for a stand-in is the studio\'s');
    // a stand-in with no studio picture keeps its own answers
    addVendorTextures([{ archive: 39101, record: 0, standIn: true, build: async () => built }]);
    await preloadTextureArchive(39101, { decode });
    assert.equal(vendorTextureStandIn(39101).getBox(0), null);
  } finally { reset(); }
});

test('AUDIT STUDIO1 S2: the boot waits for the registration alone - the port\'s own pictures decode after it, never more than PRELOAD_CONCURRENCY at once', async () => {
  reset();
  try {
    let open;
    const pictures = new Promise((r) => { open = r; });
    const files = {};
    for (let r = 0; r < 20; r++) files[`a/${WAGON_ARCHIVE}_${200 + r}-0.png`] = picture(2, 2, [r, 0, 0]);
    const index = served(files);
    const s = served(files, { gate: pictures });
    const fetch = (u) => (u === studioUrl(STUDIO_INDEX) ? index.fetch(u) : s.fetch(u));
    assert.equal(await installStudioArt({ fetch, decode }), 20, 'registered while every picture is still on its way');
    assert.equal(decodedTexture(WAGON_ARCHIVE, 200), null);
    await turns();
    assert.ok(s.most() > 0 && s.most() <= PRELOAD_CONCURRENCY, `at most ${PRELOAD_CONCURRENCY} fetched at once (${s.most()})`);
    open();
    await studioLanded();
    assert.deepEqual(red(decodedTexture(WAGON_ARCHIVE, 219)), [19, 0, 0], 'every one decoded when it lands');
    assert.match(readFileSync(new URL('../../../src/scenes/shared.js', import.meta.url), 'utf8'), /const studio = installStudioArt\(\)\.catch\(\(\) => 0\);/, 'the boot\'s Promise.all carries the registration');
  } finally { reset(); }
});

test('AUDIT STUDIO1 S3: an archive\'s first load waits for the studio\'s listing - the pipeline\'s own getTexture - and a hold never waits past its bound', async () => {
  reset();
  const restore = browserDecode();
  try {
    let open;
    const gate = new Promise((r) => { open = r; });
    addVendorTextures([{ archive: 39200, record: 0, standIn: true, build: async () => ({ width: 2, height: 2, data: new Uint8Array(16).fill(50) }) }]);
    installStudioArt({ fetch: served({ 'a/39200_0-0.png': picture(2, 2, [210, 0, 0]) }, { gate }).fetch, decode });
    assert.ok(textureTiersSettled(), 'the listing is held');
    const pipe = createDataPipeline({ renderer: { uploadTexture() {}, uploadEmissionTexture() {} }, arch: null, palette: null, fetch: async (n) => { throw new Error(`no ${n} here`); } });
    let got = false;
    const asked = pipe.getTexture(39200).then(() => { got = true; });
    await turns();
    assert.equal(got, false, 'the archive waits while the listing is on its way');
    open();
    await asked;
    assert.deepEqual(red(decodedTexture(39200, 0)), [210, 0, 0], 'and is decided with the studio\'s picture in it - the first area drawn in it');
    assert.equal(textureTiersSettled(), null, 'nothing held once it landed: the next load takes no extra turn');
    // bounded: a listing that never answers is waited for `atMost` and no longer
    const t0 = Date.now();
    await holdTextureTiers(new Promise(() => {}), 30);
    assert.ok(Date.now() - t0 < 1000, 'the hold let go at its bound');
    assert.equal(textureTiersSettled(), null);
    assert.ok(STUDIO_HOLD_MS > 0 && STUDIO_HOLD_MS <= 5000, 'the studio\'s bound is a few seconds');
  } finally { restore(); reset(); }
});

test('AUDIT STUDIO1 S4: a late picture lands only on the wear still current - a room repainted while one was on its way keeps its new paint; a picture that answers and is not decoded is decoded and worn late', async () => {
  reset();
  try {
    // A4: the real paintCaravanRoom - floor paint 2 has a studio picture; the room is repainted to paint 3 before it lands
    const floor2 = lookRecord(WAGON_TEX.roomFloor, 2);
    let open;
    const gate = new Promise((r) => { open = r; });
    const install = installStudioArt({ fetch: served({ [`a/${WAGON_ARCHIVE}_${floor2}-0.png`]: picture(2, 2, [77, 1, 1]) }, { gate }).fetch, decode });
    const ups = [];
    const renderer = { uploadTexture: (a, r, c) => ups.push([r, c]), evictTexture() {} };
    paintCaravanRoom(renderer, { f: 2 });
    paintCaravanRoom(renderer, { f: 3 });
    const live = caravanRoomPictures({ f: 3 }).find(([, , from]) => from === lookRecord(WAGON_TEX.roomFloor, 3))[0];
    const before = ups.filter(([r]) => r === live).at(-1)[1];
    open();
    await install; await studioLanded(); await turns();
    const last = ups.filter(([r]) => r === live).at(-1)[1];
    assert.equal(last, before, 'the floor keeps paint 3: paint 2\'s studio picture landed on no wear');
    assert.ok(!ups.some(([r, c]) => r === live && c.colors[0] === 77), 'paint 2\'s picture never went up');
    // A6: a player's loose picture of a wagon record registered after the install, never decoded: worn late
    reset();
    await installStudioArt({ fetch: served({}).fetch, decode });
    setTextureReplacements([`${WAGON_ARCHIVE}_2-0.png`], async () => picture(2, 2, [5, 6, 7]));
    const puts = [];
    wearPainted(WAGON_ARCHIVE, 2, () => 'painted', (p, how) => puts.push([p, how]), {});
    // the loose pick's decode needs the browser's decode in the game; the test's here
    await preloadTextureRecord(WAGON_ARCHIVE, 2, 0, 'Albedo', null, { decode });
    await turns();
    assert.equal(puts[0][0], 'painted');
    assert.deepEqual([red(puts[1][0]), puts[1][1]], [[5, 6, 7], { replaced: true, late: true }], 'the loose picture worn when it decoded');
  } finally { reset(); }
});

test('AUDIT STUDIO1 S5: the studio inherits `lazy`; a studio picture of one dye makes no dyed set of a stand-in; a dye the game never asks by is refused by name', async () => {
  reset();
  try {
    // A7: over a lazy entry (Diverse Weapons' icons): the archive's preload fetches neither
    let loads = 0;
    addVendorTextures([{ archive: 39300, record: 0, lazy: true, load: async () => { loads++; return picture(2, 2, [1, 1, 1]); } }]);
    addVendorTextures([{ archive: 39300, record: 0, studio: true, load: async () => { loads++; return picture(2, 2, [2, 2, 2]); } }]);
    addVendorTextures([{ archive: 39300, record: 1, studio: true, load: async () => { loads++; return picture(2, 2, [3, 3, 3]); } }]);
    addVendorTextures([{ archive: 39300, record: 1, lazy: true, load: async () => { loads++; return picture(2, 2, [4, 4, 4]); } }]);
    await preloadTextureArchive(39300, { decode });
    assert.equal(loads, 0, 'lazy either way round: decoded when asked, never by the archive\'s preload');
    // A8: the Thunderlock's way - ONE undyed stand-in picture, asked by the item's dye
    addVendorTextures([{ archive: 39301, record: 0, standIn: true, load: async () => picture(2, 2, [9, 9, 9]) }]);
    assert.equal(hasTextureReplacement(39301, 0, 0, 'Albedo', 'Iron'), true);
    addVendorTextures([{ archive: 39301, record: 0, dye: 'Dwarven', studio: true, load: async () => picture(2, 2, [8, 8, 8]) }]);
    assert.equal(hasTextureReplacement(39301, 0, 0, 'Albedo', 'Iron'), true, 'an Iron ask still finds the stand-in');
    assert.equal(hasTextureReplacement(39301, 0, 0, 'Albedo', 'Dwarven'), true, 'a Dwarven ask the studio\'s');
    // A9: only the dyes GetName prints
    for (const ok of ['Iron', 'Elven', 'Daedric', 'Blue']) assert.ok(studioFile(`a/233_5-0_${ok}.png`), ok);
    for (const no of ['Silver', 'iron', 'Unchanged', 'Chain', 'SilverOrElven', 'Iorn', 'Albedo']) assert.equal(studioFile(`a/233_5-0_${no}.png`), null, no);
    const dir = mkdtempSync(join(tmpdir(), 'auditstudio1-'));
    try {
      mkdirSync(join(dir, STUDIO_TREE, 'a'), { recursive: true });
      writeFileSync(join(dir, STUDIO_TREE, 'artists.json'), JSON.stringify({ artists: [{ folder: 'a', name: 'a', approved: 'the test' }] }));
      writeFileSync(join(dir, STUDIO_TREE, 'a', '233_5-0_Silver.png'), picture(2, 2, [1, 1, 1]));
      assert.match(studioListing(dir).problems[0], /a dye after it as the game asks it: _Iron, never _iron or _Silver/);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  } finally { reset(); }
});

test('AUDIT STUDIO1 S6: a listing that would not read is asked again, one not served is an answer; the icons\' cache keys on the studio; the wagon\'s icon asks for the install itself', async () => {
  reset();
  try {
    const failing = served({}, { fail: true });
    assert.equal(await installStudioArt({ fetch: failing.fetch, decode }), 0);
    const files = { 'a/38181_1-0.png': picture(2, 2, [1, 2, 3]) };
    const ok = served(files);
    const gen = studioGeneration();
    assert.equal(await installStudioArt({ fetch: ok.fetch, decode }), 1, 'the next boot asks again');
    assert.equal(studioGeneration(), gen + 1, 'a registration moves the generation');
    const none = served(files, { index: false });
    _resetStudioArt();
    assert.equal(await installStudioArt({ fetch: none.fetch, decode }), 0);
    assert.equal(await installStudioArt({ fetch: ok.fetch, decode }), 0, 'not served is an answer: kept');
    assert.equal(ok.asked.filter((u) => u === studioUrl(STUDIO_INDEX)).length, 1);
    const canvas = readFileSync(new URL('../../../src/ui/textureCanvas.js', import.meta.url), 'utf8');
    assert.match(canvas, /const iconsGeneration = \(\) => `\$\{dfmodGeneration\(\)\}:\$\{studioGeneration\(\)\}`;/);
    assert.match(canvas, /if \(_fittedGen !== iconsGeneration\(\)\)/, 'the fitted pictures too');
    assert.match(readFileSync(new URL('../../../src/systems/studioArt/studioArt.js', import.meta.url), 'utf8'), /export async function studioLanded\(\) \{\n {2}const n = await installStudioArt\(\);/, 'landed asks the install');
  } finally { reset(); }
});

test('AUDIT STUDIO1 S7: the ground - a ground archive\'s set lays the studio\'s records in, the gate shut or open, every layer at the largest picture\'s size', async () => {
  reset();
  try {
    // a classic TEXTURE file of the test's own: four 4 x 4 records, each its own grey
    const tex = { recordCount: 4, getDFBitmap: (r) => r, getColor32: (r) => ({ width: 4, height: 4, colors: new Uint8ClampedArray(64).fill(40 + r) }) };
    addVendorTextures([{ archive: 302, record: 2, studio: true, fileName: 'studio:a/302_2-0.png', load: async () => picture(8, 8, [220, 30, 30]) }]);
    assert.deepEqual(studioRecordsOf(302), [2]);
    for (const gate of ['False', 'True']) {
      setValue('Enhancements', 'AssetInjection', gate);
      const layers = await dfmodGroundLayers(302, tex, { decode });
      assert.equal(layers?.length, 4, `Replace Game Artwork ${gate}: a set`);
      assert.ok(layers.every((l) => l.width === 8 && l.height === 8), 'every layer at the studio\'s 8 x 8');
      assert.deepEqual(red(layers[2]), [220, 30, 30], 'its record the studio\'s');
      assert.deepEqual([layers[0].colors[0], layers[3].colors[0]], [40, 43], 'the rest Daggerfall\'s own, each texel a block');
    }
    assert.equal(await dfmodGroundLayers(303, tex, { decode }), null, 'an archive the studio has no record of: the classic set stands (the gate open, nothing dressing it)');
  } finally { reset(); }
});

test('AUDIT STUDIO1 S8: a ship\'s night twin is lit by its own emission picture where it has one (the studio\'s), else by her painted glass', async () => {
  reset();
  try {
    const twin = GALLEON_NIGHT[GALLEON_TEX.sternWindows0];
    await installStudioArt({ fetch: served({ [`a/${GALLEON_ARCHIVE}_${twin}-0_Emission.png`]: picture(8, 8, [250, 200, 90]) }).fetch, decode });
    await studioLanded();
    const fileFetch = async (url) => {
      const bytes = readFileSync(fileURLToPath(url));
      return { ok: true, json: async () => JSON.parse(bytes.toString('utf8')), arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length) };
    };
    const glow = [];
    const renderer = {
      createMesh: (model) => ({ model, buffers: [{}, {}], bounds: [0, 0, 0, 0], subMeshes: model.subMeshes.map((x) => ({ ...x, _bounds: [0, 0, 0, 0] })) }),
      drawMesh() {}, updateMeshVertices() {}, createBillboardBatch: () => ({}), destroyBillboardBatch() {}, destroyMesh() {},
      uploadEmissionTexture: (archive, record, c32) => glow.push({ archive, record, c32 }),
    };
    const texture = () => ({ recordCount: 200, getSize: () => ({ width: 40, height: 64 }), getScale: () => ({ width: 0, height: 0 }) });
    const pipeline = { getTexture: async (a) => { if (isVendorArchive(a)) await preloadTextureArchive(a, { decode }); return texture(); }, uploadRecord() {}, getGpuMesh: async (id) => ({ classic: id }) };
    const pool = createComeSailAwayPool({ renderer, pipeline, fetchFn: fileFetch, log: { warn() {} } });
    assert.equal(await pool.preload(), true);
    pool.spawnNow(new Boat(HULL.SmallShip, 0), { position: [0, 0, 0], rotation: [0, 0, 0, 1] });
    for (let i = 0; i < 100 && glow.length < Object.keys(GALLEON_NIGHT).length; i++) { pool.draw(); await new Promise((r) => setTimeout(r, 10)); }
    const lit = glow.find((g) => g.archive === GALLEON_ARCHIVE && g.record === twin);
    assert.ok(lit, 'her twin lit');
    assert.deepEqual([lit.c32.width, red(lit.c32)], [8, [250, 200, 90]], 'by the studio\'s emission picture');
    const other = glow.find((g) => g.archive === GALLEON_ARCHIVE && g.record === GALLEON_NIGHT[GALLEON_TEX.sternWindows1]);
    assert.equal(other?.c32.width, 64, 'a twin with none: her painted glass\'s glow');
  } finally { reset(); }
});

test('AUDIT STUDIO1 S9: the check\'s notes - clear texels on a slot drawn solid, a name no painted model\'s slot; and the slots counted, 248 of them, 29 cut-outs', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'auditstudio1-'));
  try {
    mkdirSync(join(dir, STUDIO_TREE, 'a'), { recursive: true });
    writeFileSync(join(dir, STUDIO_TREE, 'artists.json'), JSON.stringify({ artists: [{ folder: 'a', name: 'a', approved: 'the test' }] }));
    const put = (name, bytes) => writeFileSync(join(dir, STUDIO_TREE, 'a', name), bytes);
    put('38181_1-0--holes.png', picture(64, 64, [9, 9, 9], 0));   // the cart's side boards, drawn solid
    put('38181_11-0--glass.png', picture(64, 64, [9, 9, 9], 0));   // the caravan's side, its glass cut
    put('3818_1-0--typo.png', picture(64, 64, [9, 9, 9]));   // a digit dropped
    put('38181_1-1--frame.png', picture(64, 64, [9, 9, 9]));   // the frame mistyped
    const { problems, notes } = await checkStudio(dir);
    assert.deepEqual(problems, []);
    const said = (f) => notes.filter((n) => n.startsWith(`a/${f}:`));
    assert.match(said('38181_1-0--holes.png')[0], /clear texels, and cart side boards - Weathered oak is drawn solid - they come out black/);
    assert.deepEqual(said('38181_11-0--glass.png'), [], 'a cut-out slot\'s clear texels are its holes');
    assert.match(said('3818_1-0--typo.png')[0], /archive 3818 is none of the painted models'/);
    assert.match(said('38181_1-1--frame.png')[0], /Wagons, carts and the caravan has no picture 38181_1-1/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
  const counts = Object.fromEntries(STUDIO_SETS.map((s) => [s.id, studioSlots(s).length]));
  assert.deepEqual(counts, { wagons: 86, galleon: 25, carrack: 27, largeboat: 17, hangings: 48, yards: 14, port: 26, lefay: 5 });
  const cut = STUDIO_SETS.flatMap((s) => studioSlots(s)).filter((s) => s.cutout).map((s) => s.key);
  assert.equal(cut.length, 29);
  assert.ok(['38181_11-0', '38131_6-0', '38131_21-0', '38141_6-0', '38141_21-0', '38231_28-0'].every((k) => cut.includes(k)), 'the caravan\'s glass, the ships\' stern windows by day, the beacon\'s flame');
  assert.ok(!cut.includes(`38131_${GALLEON_NIGHT[GALLEON_TEX.sternWindows0]}-0`), 'a night twin is whole');
});
