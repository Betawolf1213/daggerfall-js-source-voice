// PORTRAIT3D (2026-10-15, the owner: "can we do the other races with 3d portraits also?", then "#2 is exactly I wanted.
// Which also affects the talk window for npcs"): THE FACE AS A PICTURE OF THE MORROWIND HEAD. With Morrowind's data
// attached, a face Daggerfall paints is drawn as the head and hair the body wears (combat/fpArm.js headPortrait): the
// player's by its portrait - the curated table, the measured match, the walk (faceMatchOf, the build's own door) - an
// NPC's walked off its seed, rendered face-on and read back. Pinned on the port's own Breton heads (src/assets/mw, read
// off the disk as the page serves them) under a counting renderer - no game data, no GL; the real renderer's picture
// is tools/headPortraitProbe.mjs's. And the doors: the talk window, the faces' one home (ui/facePortrait.js), the
// large HUD's head, the classic chargen's ten.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { headPortrait, headFrame, NIF_TO_PASS } from '../src/combat/fpArm.js';
import { facePools, MW_UNITS_PER_METER } from '../src/formats/mwFirstPerson.js';
import { makeVendoredArchive } from '../src/systems/urlArchive.js';
import { playerHeadImage, npcHeadImage } from '../src/characters/headPortraits.js';
import { setPortraitRenderer, portraitRenderer } from '../src/render/portraitRenderer.js';
import { preloadTalkArt, setNpcPortrait, clearNpcPortrait, npcPortraitKey, npcPortraitPixels } from '../src/ui/nativeTalk.js';
import { multiply, transformPoint, trs } from '../src/world/mat4.js';
import { meshesToNif } from '../tools/nifWrite.mjs';

const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
/** The port's own Data Files tree, served from the disk as the page serves it. */
function ownArchive() {
  const urls = {};
  for (const dir of ['meshes', 'textures']) for (const f of readdirSync(new URL(`../src/assets/mw/${dir}`, import.meta.url))) urls[`${dir}/${f.toLowerCase()}`] = `src/assets/mw/${dir}/${f}`;
  return makeVendoredArchive(urls, async (p) => new Uint8Array(readFileSync(new URL(`../${p}`, import.meta.url))));
}
/** A renderer that counts: meshes made and let go, textures held and let go, and each picture asked. */
function countingRenderer({ answer = true } = {}) {
  const c = { meshes: 0, vaosFreed: 0, textures: 0, texturesFreed: 0, shots: [] };
  return {
    c,
    gl: { deleteVertexArray: () => { c.vaosFreed++; }, deleteBuffer: () => {}, deleteTexture: () => { c.texturesFreed++; } },
    createCharacterMesh: () => { c.meshes++; return { vao: {}, buffers: [{}] }; },
    createCharacterTexture: () => { c.textures++; return {}; },
    renderCharacterSpriteImage(mesh, model, proj, view, w, h) {
      c.shots.push({ slots: [...new Set(mesh.ranges.map((r) => r.piece.slot))].sort(), ranges: mesh.ranges.map((r) => r.piece.slot), textured: mesh.ranges.filter((r) => r.textureFile).every((r) => !!r.tex), model, proj, view, w, h });
      return answer ? { width: w, height: h, data: new Uint8Array(w * h * 4) } : null;
    },
  };
}
let gen = 100;
const depsOf = (archive, g = gen) => ({
  morrowindDataGeneration: () => g,
  loadMorrowindArchives: async () => (archive ? [archive] : []),
  storedMorrowindNames: async () => ['Morrowind.esm'],
  loadMorrowindArmRecords: async () => ({ parts: [] }),
});

test('PORTRAIT3D: headFrame looks the face full on - the eye on -Z, where NIF_TO_PASS turns the head part\'s +Y face - upright, the window the head\'s projected box with air, as wide as the asked shape', () => {
  // the face forward: the head part's frame is +Y the face, +Z the crown (mwFaceMatch headFeatures)
  const face = transformPoint(NIF_TO_PASS, 0, 1, 0), crown = transformPoint(NIF_TO_PASS, 0, 0, 1);
  assert.ok(face[2] < -0.99 && crown[1] > 0.99, `the face turns to -Z (${face}), the crown up (${crown})`);
  const b = { minX: -0.1, maxX: 0.1, minY: 1.5, maxY: 1.8, minZ: -0.12, maxZ: 0.1 };
  const { view, proj, eye } = headFrame(b);
  assert.ok(eye[2] < b.minZ && Math.abs(eye[0]) < 1e-9 && Math.abs(eye[1] - 1.65) < 1e-9, `the eye before the face (${eye})`);
  const [hx, hy] = [1 / proj[0], 1 / proj[5]];   // an ortho's half-extents (a Float32 matrix: to a millionth)
  assert.ok(Math.abs(hx - hy) < 1e-6, 'square by default');
  for (const x of [b.minX, b.maxX]) for (const y of [b.minY, b.maxY]) for (const z of [b.minZ, b.maxZ]) {
    const p = transformPoint(view, x, y, z);
    assert.ok(Math.abs(p[0]) <= hx && Math.abs(p[1]) <= hy, 'every corner in the window');
  }
  assert.ok(Math.abs(hy - 0.15 * 1.08) < 1e-6, 'the window the box\'s height and a little air');
  const wide = headFrame(b, { aspect: 33 / 30 });
  assert.ok(Math.abs((1 / wide.proj[0]) / (1 / wide.proj[5]) - 33 / 30) < 1e-6, 'the HUD\'s 33 x 30');
});

test('PORTRAIT3D: headPortrait draws the head and hair the body wears - a Breton man\'s portrait 6 the eyepatch the curated table names, each part\'s shapes textured, face-on, as many pixels as asked; every mesh and texture let go', async () => {
  const archive = ownArchive();
  const r = countingRenderer();
  const img = await headPortrait({ renderer: r, race: 'breton', female: false, faceIndex: 6, px: 132, ph: 120, deps: depsOf(archive) });
  assert.deepEqual([img.width, img.height], [132, 120]);
  assert.equal(r.c.shots.length, 1);
  const shot = r.c.shots[0];
  assert.deepEqual(shot.slots, ['hair', 'head'], 'the head and its hair, nothing else');
  assert.ok(shot.textured, 'every textured range held its texture for the picture');
  assert.deepEqual([shot.w, shot.h], [132, 120]);
  const u = 1 / MW_UNITS_PER_METER;
  assert.deepEqual(Array.from(shot.model), Array.from(multiply(trs(0, 0, 0, 0, 0, 0, u, u, u), NIF_TO_PASS)), 'in metres, in the pass frame');
  assert.ok(Math.abs((1 / shot.proj[0]) / (1 / shot.proj[5]) - 132 / 120) < 1e-6, 'the window as wide as the picture');
  assert.equal(r.c.vaosFreed, r.c.meshes, 'the mesh let go');
  assert.equal(r.c.texturesFreed, r.c.textures, 'and every texture it held');
  // the rows it drew are the rows the body wears: the curated pair for portrait 6
  const pools = facePools([], 'breton', false, { has: archive.has });
  assert.ok(pools.heads.some((h) => h.id === 'breton_m_head_h0423'));
});

test('PORTRAIT3D: a hair part\'s shapes are those the binder keeps - the ones named for hair (npcanimation.cpp:801, rule 15\'s exception), the nameless; a shape named for anything else is left out', async () => {
  const base = ownArchive();
  const tri = { positions: [0, 0, 120, 4, 0, 120, 0, 4, 124], indices: [0, 1, 2] };
  const over = 'meshes/breton_m_hair_0111.nif';   // portrait 6's hair (the curated table)
  const bytes = new Uint8Array(meshesToNif([{ mesh: tri, name: 'Tri Hair 0' }, { mesh: tri, name: 'Tri Shirt 0' }]));
  const archive = { ...base, has: base.has, loaded: (p) => p === over || base.loaded(p), get: (p) => (p === over ? bytes : base.get(p)), load: (p) => (p === over ? bytes : base.load(p)) };
  const r = countingRenderer();
  await headPortrait({ renderer: r, race: 'breton', faceIndex: 6, deps: depsOf(archive, ++gen) });
  assert.equal(r.c.shots.length, 1);
  assert.deepEqual(r.c.shots[0].ranges.filter((s) => s === 'hair').length, 1, 'the hair, and not the shirt');
});

test('PORTRAIT3D: one picture per head and hair - asked again it is the same picture, unrendered; another size is another picture; a new data generation draws anew; a miss is not kept', async () => {
  const archive = ownArchive();
  const r = countingRenderer();
  const deps = depsOf(archive, ++gen);
  const a = await headPortrait({ renderer: r, race: 'breton', faceIndex: 0, deps });
  const b = await headPortrait({ renderer: r, race: 'breton', faceIndex: 0, deps });
  assert.equal(a, b);
  assert.equal(r.c.shots.length, 1, 'asked twice, drawn once');
  await headPortrait({ renderer: r, race: 'breton', faceIndex: 0, px: 64, deps });
  assert.equal(r.c.shots.length, 2, 'another size, another picture');
  await headPortrait({ renderer: r, race: 'breton', faceIndex: 0, deps: depsOf(archive, ++gen) });
  assert.equal(r.c.shots.length, 3, 'another generation, drawn anew');
  const miss = countingRenderer({ answer: false });
  const d2 = depsOf(archive, ++gen);
  assert.equal(await headPortrait({ renderer: miss, race: 'breton', faceIndex: 2, deps: d2 }), null);
  await headPortrait({ renderer: miss, race: 'breton', faceIndex: 2, deps: d2 });
  assert.equal(miss.c.shots.length, 2, 'a miss is asked again (AUDIT 32 F3)');
});

test('PORTRAIT3D: an NPC\'s face is walked off its seed over the same pools in the same order; no renderer, no race, no data, no race\'s head - no picture', async () => {
  const archive = ownArchive();
  const r = countingRenderer();
  const deps = depsOf(archive, ++gen);
  const pools = facePools([], 'breton', false, { has: archive.has });
  await headPortrait({ renderer: r, race: 'breton', npcFace: { head: 4, hair: 2 }, deps });
  assert.equal(r.c.shots.length, 1);
  const heads = await Promise.all([0, 1, 2].map((i) => headPortrait({ renderer: r, race: 'breton', npcFace: { head: 4 + 3 * i, hair: 2 }, deps })));
  assert.ok(heads.every((h) => h === heads[0]), `head ${4 % pools.heads.length} of ${pools.heads.length} however far the seed walks round`);
  const walked = await Promise.all(pools.heads.map((_, i) => headPortrait({ renderer: r, race: 'breton', npcFace: { head: i, hair: 0 }, deps })));
  assert.equal(new Set(walked).size, pools.heads.length, 'each step of the walk its own head');
  assert.equal(await headPortrait({ renderer: null, race: 'breton', deps }), null);
  assert.equal(await headPortrait({ renderer: r, race: null, deps }), null);
  assert.equal(await headPortrait({ renderer: r, race: 'breton', deps: depsOf(null, ++gen) }), null, 'no archive attached');
  assert.equal(await headPortrait({ renderer: r, race: 'argonian', deps }), null, 'no head in hand for the race');
});

test('PORTRAIT3D: the gates - the player\'s face needs Morrowind\'s data attached (the body\'s switch), an NPC\'s the people standing in Morrowind bodies (npcBodiesOn); a creature has none; the menu\'s renderer is the one the entry hands in', async () => {
  const r = countingRenderer();
  setPortraitRenderer(r);
  assert.equal(portraitRenderer(), r);
  assert.equal(await playerHeadImage({ race: 'Breton', gender: 'male', faceIndex: 0 }), null, 'no data attached in this process');
  assert.equal(await npcHeadImage({ race: 'Breton', gender: 'male', faceIndex: 0 }), null, 'no Morrowind people without the data and the enhanced skin');
  assert.equal(await npcHeadImage({ creature: 'rat' }), null);
  assert.equal(r.c.shots.length, 0);
  setPortraitRenderer(null);
  const heads = src('src/characters/headPortraits.js');
  assert.match(heads, /return morrowindDataCount\(\) > 0;/);
  assert.match(heads, /if \(!npcBodiesOn\(\)\) return null;/);
  assert.match(heads, /const o = \/\*\* @type \{any\} \*\/ \(peerBuildOpts\(look\)\);/, 'the look read through the door every body\'s build takes');
  assert.match(src('src/main.js'), /import\('\.\/render\/portraitRenderer\.js'\)\.then\(\(\{ setPortraitRenderer \}\) => setPortraitRenderer\(renderer\)\)/);
});

test('PORTRAIT3D: the talk window - the NPC\'s head takes the record\'s place under a key of its own once it lands (the enhanced panel repaints on the key), one texture a picture; a picture for an earlier NPC lands on no one', async () => {
  const uploads = [];
  await preloadTalkArt({ renderer: { uploadTexture: (kind, key) => { uploads.push(key); return { key }; } }, fetchBytes: async () => { throw new Error('no data'); }, palette: null });
  const pic = { width: 8, height: 8, data: new Uint8Array(8 * 8 * 4).fill(200) };
  let release;
  const late = new Promise((res) => { release = res; });
  setNpcPortrait('CommonFaces', 7, { picture: () => late });
  setNpcPortrait('CommonFaces', 9, { picture: async () => pic });
  await new Promise((res) => setTimeout(res, 5));
  assert.match(npcPortraitKey(), /^TFAC00I0\.RCI#9#mwhead\d+$/, 'the second NPC\'s head');
  assert.deepEqual([npcPortraitPixels().w, npcPortraitPixels().h], [8, 8]);
  const key = npcPortraitKey();
  release({ width: 4, height: 4, data: new Uint8Array(64) });
  await new Promise((res) => setTimeout(res, 5));
  assert.equal(npcPortraitKey(), key, 'the first NPC\'s late head lands on no one');
  setNpcPortrait('CommonFaces', 11, { picture: async () => pic });
  await new Promise((res) => setTimeout(res, 5));
  assert.equal(uploads.filter((k) => k.startsWith('mwhead#')).length, 1, 'one texture for one picture, whoever wears it');
  clearNpcPortrait();
  assert.equal(npcPortraitKey(), null);
  // the doors that hand the look in
  const town = src('src/scenes/townTalk.js');
  assert.match(town, /if \(portrait\) setNpcPortrait\(portrait\.archive, portrait\.record, \{ picture: portrait\.head \? \(renderer\) => npcHeadImage\(portrait\.head, \{ renderer \}\) : null \}\);/);
  const modes = src('src/scenes/worldModes.js');
  assert.match(modes, /const npcData = questBridge\?\.clickNpc\(pn, npcSceneCtx\) \?\? staticNpcData\(pn, npcSceneCtx\);\n\s*talkedTo\.set\(npcData, pn\);/);
  assert.match(modes, /return pn && portrait \? \{ \.\.\.portrait, head: standingLook\(pn\) \} : portrait;/);
});

test('PORTRAIT3D: the player\'s faces - the one home (ui/facePortrait.js) draws each face as its head, the record\'s own shape, the record where none is drawn; the large HUD\'s head after the curse\'s, reloaded as the data comes and goes; the classic chargen\'s ten, upgraded in place', () => {
  const face = src('src/ui/facePortrait.js');
  assert.match(face, /if \(!\(morrowindDataCount\(\) > 0\) \|\| !portraitRenderer\(\) \|\| !globalThis\.document\) return classic;/);
  assert.match(face, /const img = await playerHeadImage\(\{ race: raceKey, gender, faceIndex: i \}, \{ px: w \* 2, ph: h \* 2 \}\);/);
  assert.match(face, /if \(canvas\) heads\.set\(key, \{ canvas \}\); else heads\.delete\(key\);/, 'a face with no head is not kept');
  assert.match(face, /const face = await headFace\(raceKey, gender, scale, set\[i\] \? i : 0, art\);/);
  const hud = src('src/ui/hudLarge.js');
  const head = hud.slice(hud.indexOf('export async function loadHudLargeHead('));
  assert.ok(head.indexOf('racialOverrideHeadArt(entity)') < head.indexOf('playerHeadImage(entity'), 'the curse\'s heads first, as DFU\'s order has them');
  assert.match(hud, /\|mw\$\{morrowindDataCount\(\) > 0 \? morrowindDataGeneration\(\) : 0\}`;/);
  const art = src('src/ui/chargenArt.js');
  assert.match(art, /_faces = set;\n\s*headFaces\(set, wantRace, wantGender\);/);
  assert.match(art, /if \(img && _faces === set\) set\.tex\[i\] = _deps\.renderer\.uploadTexture\('img', `face:mw:\$\{set\.key\}:\$\{i\}`, toScreenOrder\(img\)\);/);
});
