// DF-ART (2026-10-14, Mac: "For all textures you implemented that are AI (Ships, wagons, caravans, etc) I want to instead
// use daggerfall textures instead of AI generated"): world/classicArt.js - the port's models' pictures read from the
// player's own ARENA2: a record whole and opaque, a composed wall (a record with another laid in where the model's
// window or door stands, the window's glass cut out between its leads), a cut record (cropped, mirrored, its clear
// texels kept), the night glow of a window's panes, the stand-ins on the texture door, and a record the data lacks left
// out. No game data here: test/classicArtFake.mjs answers every record with a picture that names it.
import './modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DF, opaque, isPane, isGlass, cutGlass, paneGlow, PANE_GLOW, LEAD_LIGHT, resample, crop, mirrored, composedPicture, cutPicture,
  classicPicture, classicPictures, classicStandIns, asPortRows, COMPOSE,
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

test('DF-ART THE GLASS OF DAGGERFALL\'S WINDOW: a pane is a texel no redder than it is blue and not black (isPane: the glow\'s glass); glass to see through a pane darker than its leading (isGlass, under LEAD_LIGHT) - so a window cut keeps its leads and its timber whole and opens its panes (mutants: the leads cut too, the timber cut, the panes kept)', () => {
  assert.equal(isPane(...PANE), true); assert.equal(isPane(...LEAD), true); assert.equal(isPane(...TIMBER), false); assert.equal(isPane(0, 0, 0), false);
  assert.equal(isGlass(...PANE), true); assert.equal(isGlass(...LEAD), false, 'the leading stays'); assert.equal(isGlass(...TIMBER), false);
  assert.ok(PANE.reduce((a, b) => a + b) < LEAD_LIGHT && LEAD.reduce((a, b) => a + b) >= LEAD_LIGHT);
  const w = cutGlass(pic(3, 1, (x) => [...[PANE, LEAD, TIMBER][x], 255]));
  assert.deepEqual([3, 7, 11].map((i) => w.data[i]), [0, 255, 255], 'the pane a hole, the lead and the timber whole');
});

test('DF-ART A WINDOW\'S NIGHT GLOW: its panes and their leads PANE_GLOW, everything else black, every texel whole (renderer.uploadEmissionTexture) (mutants: the whole window glowing, the panes dark)', () => {
  const g = paneGlow(pic(3, 1, (x) => [...[PANE, LEAD, TIMBER][x], 255]));
  assert.deepEqual([...g.data], [...PANE_GLOW, 255, ...PANE_GLOW, 255, 0, 0, 0, 255]);
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

test('DF-ART THE STAND-INS ON THE TEXTURE DOOR: each record of the model\'s archive an entry built from its source with the pipeline\'s reader; a record in `glowRecs` keeps its window\'s night glow once built, and no other record does (mutants: every record glowing)', async () => {
  const art = classicStandIns({ archive: 38131, name: 't', sources: { 0: DF.hullPlanks, 6: DF.window }, glowRecs: [6] });
  assert.deepEqual(art.entries.map((e) => [e.archive, e.record, e.frame, e.standIn, e.fileName]), [[38131, 0, 0, true, 't-38131_0'], [38131, 6, 0, true, 't-38131_6']]);
  assert.equal(art.glow(6), null, 'no glow before its window is built');
  const ctx = { classicRgba: fakeClassicRgba() };
  for (const e of art.entries) await e.build(ctx);
  assert.ok(art.glow(6), 'the window glows');
  assert.equal(art.glow(0), null, 'the planking does not');
  art.reset();
  assert.equal(art.glow(6), null);
});

test('DF-ART THE PORT\'S OWN ROWS: a picture for the yards\', the port\'s and the monument\'s faces handed over as they read it, row 0 its top (their models\' uvs lay it so), in the upload\'s shape (mutants: the rows flipped)', () => {
  const p = pic(1, 2, (x, y) => [y, 0, 0, 255]);
  const r = asPortRows(p);
  assert.deepEqual([r.width, r.height, r.colors[0], r.colors[4]], [1, 2, 0, 1]);
});
