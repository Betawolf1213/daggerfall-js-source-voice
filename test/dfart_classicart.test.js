// DF-ART (2026-10-14, Mac: "For all textures you implemented that are AI (Ships, wagons, caravans, etc) I want to instead
// use daggerfall textures instead of AI generated"): world/classicArt.js - the port's models' pictures read from the
// player's own ARENA2: a record whole and opaque, a composed wall (a record with another laid in where the model's
// window or door stands, the window's glass cut out between its leads), a cut record (cropped, mirrored, its clear
// texels kept, or its window's glass cut - Mac: "windows should always be see through"), a lettered board (Mac: "Bring
// back the sign text"), the stand-ins on the texture door and which of them are cut-outs, and a record the data lacks
// left out. No game data here: test/classicArtFake.mjs answers every record with a picture that names it.
import './modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DF, opaque, isPane, isGlass, cutGlass, LEAD_LIGHT, resample, crop, mirrored, tiled, composedPicture, cutPicture, hasGlass,
  classicPicture, classicPictures, classicStandIns, asPortRows, COMPOSE, SEE_THROUGH_WINDOW,
} from '../src/world/classicArt.js';
import { fakeClassicRgba, texelOf, texel, PANE, LEAD, TIMBER } from './classicArtFake.mjs';

const pic = (w, h, rgba) => { const data = new Uint8Array(w * h * 4); for (let i = 0; i < data.length; i += 4) data.set(rgba(i / 4 % w, Math.floor(i / 4 / w)), i); return { width: w, height: h, data }; };

test('DF-ART A RECORD WHOLE AND OPAQUE: a source `[archive, record]` is that record of the player\'s own data, every texel whole - the index-0 texels a classic wall carries never holes in a model\'s face (mutants: the record read wrong, the alpha kept)', async () => {
  const holed = async () => pic(4, 4, (x) => [9, 9, 9, x === 0 ? 0 : 255]);
  const p = await classicPicture(DF.hullPlanks, async (a, r) => (a === 50 && r === 6 ? holed() : null));
  assert.ok(p.data.every((v, i) => i % 4 !== 3 || v === 255), 'opaque');
  assert.deepEqual(texel(await classicPicture([67, 5], fakeClassicRgba()), 1, 1), [...texelOf(67, 5), 255]);
  assert.deepEqual(opaque(pic(1, 1, () => [1, 2, 3, 0])).data, Uint8Array.from([1, 2, 3, 255]));
});

test('DF-ART A RECORD THE PLAYER\'S DATA LACKS IS LEFT OUT: classicPictures answers every record it can read and skips the rest - its faces draw untextured, as a classic model\'s would - never a thrown scene (mutants: the throw let through)', async () => {
  const read = fakeClassicRgba({ missing: [[67, 5]] });
  const out = await classicPictures({ 1: [50, 6], 2: [67, 5], 3: [0, 111] }, read);
  assert.deepEqual(out.map(([r]) => r), [1, 3]);
});

test('DF-ART THE GLASS OF DAGGERFALL\'S WINDOW: a pane is a texel no redder than it is blue and not black (isPane: its glass and its leading); glass to see through a pane darker than its leading (isGlass, under LEAD_LIGHT) - so a window cut keeps its leads and its timber whole and opens its panes (mutants: the leads cut too, the timber cut, the panes kept)', () => {
  assert.equal(isPane(...PANE), true); assert.equal(isPane(...LEAD), true); assert.equal(isPane(...TIMBER), false); assert.equal(isPane(0, 0, 0), false);
  assert.equal(isGlass(...PANE), true); assert.equal(isGlass(...LEAD), false, 'the leading stays'); assert.equal(isGlass(...TIMBER), false);
  assert.ok(PANE.reduce((a, b) => a + b) < LEAD_LIGHT && LEAD.reduce((a, b) => a + b) >= LEAD_LIGHT);
  const w = cutGlass(pic(3, 1, (x) => [...[PANE, LEAD, TIMBER][x], 255]));
  assert.deepEqual([3, 7, 11].map((i) => w.data[i]), [0, 255, 255], 'the pane a hole, the lead and the timber whole');
});

test('DF-ART A WINDOW SEEN THROUGH (Mac: "windows should always be see through"): SEE_THROUGH_WINDOW is Daggerfall\'s leaded window framed whole - cropped above its plaster, mirrored - its glass cut out and the rest whole; hasGlass names it, and a wall with it laid in, and nothing else (mutants: the glass left whole, a plain record taken for glass)', async () => {
  const w = await cutPicture(SEE_THROUGH_WINDOW, fakeClassicRgba());
  assert.deepEqual([w.width, w.height], [76, 58], 'its frame and its panes, the plaster under it left off');
  let holes = 0;
  for (let i = 0; i < w.data.length; i += 4) {
    const pane = PANE.every((c, k) => c === w.data[i + k]);
    assert.equal(w.data[i + 3], pane ? 0 : 255);
    if (pane) holes++;
  }
  assert.ok(holes > 0, 'its glass open');
  assert.deepEqual([texel(w, 0, 30), texel(w, 75, 30)], [[...TIMBER, 255], [...TIMBER, 255]], 'a post either side');
  assert.equal(hasGlass(SEE_THROUGH_WINDOW), true);
  assert.equal(hasGlass({ body: DF.paintGreen, insets: [{ ...SEE_THROUGH_WINDOW, at: { x0: 0, y0: 0, x1: 9, y1: 9 } }] }), true);
  assert.equal(hasGlass(DF.window), false); assert.equal(hasGlass({ body: DF.paintGreen, insets: [{ from: DF.door, at: { x0: 0, y0: 0, x1: 9, y1: 9 } }] }), false); assert.equal(hasGlass(null), false);
});

test('DF-ART A LETTERED BOARD (Mac: "Bring back the sign text"): a body repeated at its own texel size over the size it is given (`tile`), a `clear` inset laid over it skipping its clear texels, and `paint` handed the picture last (mutants: the body stretched, the clear inset\'s holes laid too, the paint unasked)', async () => {
  const read = async (a, r) => (a === 1 ? pic(2, 2, (x, y) => [x * 100, y * 100, 7, 255]) : pic(4, 4, (x) => [200, 0, 0, x < 2 ? 0 : 255]));
  const painted = [];
  const p = await composedPicture({ body: [1, 1], size: [6, 4], tile: true, insets: [{ from: [2, 2], px: { x0: 2, y0: 0, x1: 5, y1: 3 }, clear: true }], paint: (q) => painted.push(q.width) }, read);
  assert.deepEqual([p.width, p.height], [6, 4]);
  assert.deepEqual([texel(p, 0, 0), texel(p, 1, 1), texel(p, 2, 3), texel(p, 3, 0)].map((t) => t.slice(0, 2)), [[0, 0], [100, 100], [0, 100], [100, 0]], 'the body repeated, never stretched (and the inset\'s clear half shows it)');
  assert.deepEqual(texel(p, 4, 1).slice(0, 3), [200, 0, 0], 'the inset\'s whole half laid over it');
  assert.deepEqual(painted, [6], 'the paint handed the finished picture');
  assert.deepEqual(tiled(pic(2, 1, (x) => [x, 0, 0, 255]), 5, 1).data.filter((_, i) => i % 4 === 0), Uint8Array.from([0, 1, 0, 1, 0]));
});

test('DF-ART A COMPOSED WALL: its body a record laid whole over COMPOSE x COMPOSE, each inset a record cropped, mirrored whole and its glass cut, laid over exactly the layout\'s columns and rows it names (a 64-texel layout, four texels to each) and nowhere else (mutants: the inset off its place, the mirror dropped, the glass kept)', async () => {
  const at = { x0: 22, y0: 16, x1: 42, y1: 41 };
  const p = await composedPicture({ body: DF.paintGreen, insets: [{ from: DF.window, crop: [0, 0, 37, 57], mirror: true, glass: true, at }] }, fakeClassicRgba());
  const k = COMPOSE / 64;
  assert.deepEqual([p.width, p.height], [COMPOSE, COMPOSE]);
  assert.deepEqual(texel(p, 0, 0), [...texelOf(...DF.paintGreen), 255], 'the body outside the window');
  assert.deepEqual(texel(p, at.x0 * k - 1, at.y0 * k), [...texelOf(...DF.paintGreen), 255], 'the body just left of it');
  assert.deepEqual(texel(p, at.x0 * k, at.y0 * k), [...TIMBER, 255], 'its frame at its top-left corner');
  assert.deepEqual(texel(p, (at.x1 + 1) * k - 1, at.y0 * k), [...TIMBER, 255], 'its frame at its top-right corner too');
  const mid = at.y0 * k + 50;   // a row through its panes
  assert.deepEqual([texel(p, at.x0 * k, mid), texel(p, (at.x1 + 1) * k - 1, mid)], [[...TIMBER, 255], [...TIMBER, 255]], 'a post either side of its panes: its mirror');
  let holes = 0, outside = 0;
  for (let y = 0; y < COMPOSE; y++) for (let x = 0; x < COMPOSE; x++) if (texel(p, x, y)[3] === 0) { holes++; if (x < at.x0 * k || x >= (at.x1 + 1) * k || y < at.y0 * k || y >= (at.y1 + 1) * k) outside++; }
  assert.ok(holes > 0 && outside === 0, `its glass a hole inside the window alone (${holes})`);
  assert.deepEqual(mirrored(pic(2, 1, (x) => [x, 0, 0, 255])).data.filter((_, i) => i % 4 === 0), Uint8Array.from([0, 1, 1, 0]));
  assert.deepEqual(crop(pic(4, 4, (x, y) => [x, y, 0, 255]), [1, 2, 2, 3]).data.filter((_, i) => i % 4 < 2), Uint8Array.from([1, 2, 2, 2, 1, 3, 2, 3]));
  assert.deepEqual(resample(pic(2, 1, (x) => [x, 0, 0, 255]), 4, 1).data.filter((_, i) => i % 4 === 0), Uint8Array.from([0, 0, 1, 1]));
});

test('DF-ART A CUT RECORD: cropped to its rows and columns, its clear texels kept clear where it is a cut-out (`clear` - the beacon\'s flames over the brazier\'s bowl) and made whole where it is not (mutants: the clear made whole, the crop dropped)', async () => {
  const flame = await cutPicture({ from: DF.fireFlat, crop: [0, 0, 39, 26], clear: true }, fakeClassicRgba());
  assert.deepEqual([flame.width, flame.height], [40, 27]);
  assert.equal(texel(flame, 0, 0)[3], 0, 'nothing round the flames');
  assert.equal(texel(flame, 20, 20)[3], 255, 'the flames');
  const solid = await cutPicture({ from: DF.fireFlat, crop: [0, 0, 39, 26] }, fakeClassicRgba());
  assert.equal(texel(solid, 0, 0)[3], 255);
});

test('DF-ART THE STAND-INS ON THE TEXTURE DOOR: each record of the model\'s archive an entry built from its source with the pipeline\'s reader; `cut` names the records that hold glass to see through - its host uploads them cut-outs - and no other (mutants: every record a cut-out)', async () => {
  const art = classicStandIns({ archive: 38131, name: 't', sources: { 0: DF.hullPlanks, 6: SEE_THROUGH_WINDOW } });
  assert.deepEqual(art.entries.map((e) => [e.archive, e.record, e.frame, e.standIn, e.fileName]), [[38131, 0, 0, true, 't-38131_0'], [38131, 6, 0, true, 't-38131_6']]);
  assert.deepEqual([art.cut(0), art.cut(6), art.cut(7)], [false, true, false]);
  const ctx = { classicRgba: fakeClassicRgba() };
  const [plank, window] = await Promise.all(art.entries.map((e) => e.build(ctx)));
  assert.ok(plank.data.every((v, i) => i % 4 !== 3 || v === 255), 'the planking whole');
  assert.ok(window.data.some((v, i) => i % 4 === 3 && v === 0), 'the window\'s glass open');
});

test('DF-ART THE PORT\'S OWN ROWS: a picture for the yards\', the port\'s and the monument\'s faces handed over as they read it, row 0 its top (their models\' uvs lay it so), in the upload\'s shape (mutants: the rows flipped)', () => {
  const p = pic(1, 2, (x, y) => [y, 0, 0, 255]);
  const r = asPortRows(p);
  assert.deepEqual([r.width, r.height, r.colors[0], r.colors[4]], [1, 2, 0, 1]);
});
