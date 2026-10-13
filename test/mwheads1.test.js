// MW-HEADS1 (2026-10-13, the owner: "Everything we are doing is for the morrowwind model. This batch is for breton";
// asked, every Breton man wears them): THE PORT'S OWN HEADS - THE BRETON MEN'S THREE HEADS AND THREE HAIRS.
//
// One export of three objects, each a face and a hair in two paintings; baked into six rigid parts in the head's own
// frame (the source head's, which all three share), each painting held to the name the export gives its material; every
// hair over every head's scalp; the Breton men's pools wherever a face is chosen - the NPC walk, the curated table (the
// ten portraits, the sixth the eyepatch), the measured match - and every other race and sex the data's.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parseNif } from '../src/formats/mwNifFile.js';
import { flattenNif } from '../src/formats/mwNifMesh.js';
import { decodeTextureImage } from '../src/formats/mwTexture.js';
import { assembleFirstPersonArm, facePools, playerBodyRows } from '../src/formats/mwFirstPerson.js';
import { OWN_HEADS, ownFacePools, ownHeadModelPaths } from '../src/characters/ownHeadModels.js';
import { npcFaceOf, npcHint } from '../src/characters/wardrobe.js';
import FACE_TABLE from '../src/formats/mwFaceTable.json' with { type: 'json' };
import { readPng } from '../tools/pngIO.mjs';
import { readFbx } from '../tools/fbxRead.mjs';
import { meshModelNames } from '../tools/fbxStrip.mjs';
import { bakeMesh, objectMaterials } from '../tools/fbxMesh.mjs';
import { objectTree, BOX_SLACK, SCENE_BODY } from '../tools/bakeSteelPlate.mjs';
import { SOURCES, PAINTINGS, HEAD_PARTS, bakeHeads, meshFile, partFrame, partMesh, textureFile, textureName } from '../tools/bakeHeads.mjs';
import { retailSkeleton } from './fixtures/mw/retailRig.mjs';

const raw = (p) => readFileSync(new URL(`../${p}`, import.meta.url));
const onDisk = (p) => new Uint8Array(raw(p));
const sha = (p) => createHash('sha256').update(raw(p)).digest('hex');
const tree = readFbx(raw(SOURCES.breton));
const nifOf = (id) => flattenNif(parseNif(onDisk(meshFile(id))));
const HEADS = ['breton_m_head_h04', 'breton_m_head_h0411', 'breton_m_head_h0423'];
const HAIRS = ['breton_m_hair_01', 'breton_m_hair_0111', 'breton_m_hair_widow'];
/** Each part's polygons, as the export carries them on its material (the object's other picture's never baked in). */
const POLYGONS = { breton_m_head_h04: 1060, breton_m_hair_widow: 298, breton_m_head_h0411: 532, breton_m_hair_01: 302, breton_m_head_h0423: 502, breton_m_hair_0111: 390 };
const rd = (p) => raw(p).toString('utf8');

test('MW-HEADS1: every head and hair re-made from the committed export and its six paintings byte for byte, each DDS its painting; the export the owner\'s as it came, each painting under the name the export gives its material', () => {
  const baked = bakeHeads({ sources: { breton: raw(SOURCES.breton) }, pngs: Object.fromEntries(Object.entries(PAINTINGS).map(([id, p]) => [id, raw(p)])) });
  assert.deepEqual(baked.parts.map((p) => p.id), ['breton_m_head_h04', 'breton_m_hair_widow', 'breton_m_head_h0411', 'breton_m_hair_01', 'breton_m_head_h0423', 'breton_m_hair_0111']);
  for (const p of baked.parts) {
    assert.equal(Buffer.compare(Buffer.from(p.nif), raw(meshFile(p.id))), 0, `${meshFile(p.id)} is not what tools/bakeHeads.mjs makes - re-run it`);
    assert.deepEqual(nifOf(p.id).map((b) => b.material.textureFile), [textureName(p.id)]);
  }
  for (const t of baked.textures) {
    assert.equal(Buffer.compare(Buffer.from(t.dds), raw(textureFile(t.id))), 0, `${textureFile(t.id)} is not what the bake makes`);
    assert.deepEqual(Array.from(decodeTextureImage(textureFile(t.id), onDisk(textureFile(t.id))).mips[0].rgba), Array.from(readPng(raw(PAINTINGS[t.id])).data), `the ${t.id} DDS is its painting`);
  }
  assert.deepEqual(baked.textures.map((t) => [t.id, t.png.width, t.png.height]), [['breton_m_head_h04', 256, 128], ['breton_m_hair_widow', 128, 128],
    ['breton_m_head_h0411', 256, 128], ['breton_m_hair_01', 128, 128], ['breton_m_head_h0423', 256, 128], ['breton_m_hair_0111', 128, 128]]);
  assert.equal(sha(SOURCES.breton), '657dfa95cb607b00f9fb786fad389e0aae7390e8ccf6934ecbc7a47ada009b18', 'daggerwind.fbx as it came');
  assert.deepEqual(meshModelNames(raw(SOURCES.breton)), ['b_n_breton_m_hair_widow', 'b_n_breton_m_head_05.002', 'b_n_breton_m_head_05.003']);
  // each painting as sent, under the part its export names it for (matched by what it is drawn for - Own-Heads.md)
  assert.deepEqual(Object.fromEntries(Object.entries(PAINTINGS).map(([id, p]) => [id, sha(p).slice(0, 16)])), {
    breton_m_head_h04: '0dce24bce8854284', breton_m_head_h0411: '2761ddc06d78ec16', breton_m_head_h0423: '942fc18546e33b15',
    breton_m_hair_widow: 'e81078936d780b3d', breton_m_hair_01: '0bb984ce708a59e4', breton_m_hair_0111: 'feafc235bc1cb8e6',
  });
  assert.deepEqual(['b_n_breton_m_hair_widow', 'b_n_breton_m_head_05.002', 'b_n_breton_m_head_05.003'].map((o) => objectMaterials(tree, o)), [
    ['tx_b_n_breton_m_hair_widow.png', 'tx_b_n_breton_m_h04.png'], ['tx_b_n_breton_m_h0411.png', 'tx_b_n_breton_m_hair01.png'], ['tx_b_n_breton_m_h0423.png', 'tx_b_n_breton_m_hair0111.png'],
  ]);
  for (const p of HEAD_PARTS) assert.equal(objectMaterials(tree, p.object)[p.material], p.texture, `${p.id}: the material the export paints ${p.texture}`);
  assert.throws(() => partMesh(tree, { ...HEAD_PARTS[0], material: 0 }), /wears "tx_b_n_breton_m_hair_widow\.png" in material 0, not tx_b_n_breton_m_h04\.png/, 'a material read as another picture is refused');
  assert.throws(() => partMesh(tree, { ...HEAD_PARTS[0], box: [[-4.78, -6.95, -7.89], [4.78, 8.28, 7.66]] }), /not where it was read/, 'a part off its box is refused');
  for (const path of ownHeadModelPaths()) assert.ok(existsSync(new URL(`../src/assets/mw/${path}`, import.meta.url)), `${path} ships`);
});

test('MW-HEADS1: each part one rigid shape of its own material, in the head\'s own frame - the object\'s scene placement taken back off, nothing re-centred; the three faces share the source head\'s crown, sides and back; the owner\'s scene stood them where MW-STEEL5 read the game\'s head', () => {
  for (const p of HEAD_PARTS) {
    const [b, ...more] = nifOf(p.id);
    assert.equal(more.length, 0, `${p.id}: one shape`);
    assert.equal(b.skinned, false, `${p.id}: a rigid part, hung under the Head node as a retail head is`);
    const scene = bakeMesh(objectTree(tree, p.object), { name: p.id, placement: 'scene', forward: '+y', up: '+z', material: p.material });
    const t = scene.bake.sceneTranslation;
    let worst = 0;
    for (let k = 0; k < b.positions.length; k++) worst = Math.max(worst, Math.abs(b.positions[k] - (scene.positions[k] - t[k % 3])));
    assert.ok(worst < 1e-4, `${p.id}: the scene's placement, its translation taken off (worst ${worst})`);
    assert.equal(scene.bake.material, p.material);
    assert.equal(scene.bake.polygons, POLYGONS[p.id], `${p.id}: its material's polygons, and none of the other's`);
    const { min, max } = partFrame(scene).bounds;
    for (let k = 0; k < 3; k++) assert.ok(Math.abs(min[k] - p.box[0][k]) <= BOX_SLACK && Math.abs(max[k] - p.box[1][k]) <= BOX_SLACK, `${p.id}: read where its box says`);
  }
  // one frame between the three faces - the same crown, sides and back, though h04's is another mesh
  const faces = HEAD_PARTS.filter((p) => p.slot === 'head');
  for (const p of faces) {
    assert.equal(p.box[1][2], 7.66, `${p.id}: the crown`); assert.deepEqual([p.box[0][0], p.box[1][0]], [-4.78, 4.78], `${p.id}: the sides`);
    assert.equal(p.box[0][1], -6.95, `${p.id}: the back`);
  }
  assert.deepEqual(faces.map((p) => nifOf(p.id)[0].positions.length / 3), [616, 296, 290], 'three meshes');
  // where the owner's scene stood them: 125 over its floor - 3.45 over the T-posed scene's own head (SCENE_BODY), inside
  // the 3.24 to 4.25 MW-STEEL5 read the game drawing a retail head over it (tools/helmLiftProbe.mjs readLift)
  const placed = ['b_n_breton_m_hair_widow', 'b_n_breton_m_head_05.002', 'b_n_breton_m_head_05.003']
    .map((o) => bakeMesh(objectTree(tree, o), { placement: 'scene', forward: '+y', up: '+z' }).bake.sceneTranslation[2]);
  assert.deepEqual(placed, [125, 125, 125]);
  const over = [125 + faces[1].box[0][2] - SCENE_BODY.head.min[2], 125 + faces[1].box[1][2] - SCENE_BODY.head.max[2]];
  for (const d of over) assert.ok(d > 3.24 && d < 4.25, `the source head stands ${d.toFixed(2)} over the scene's`);
});

test('MW-HEADS1: one eyepatch - the one painting whose eyes differ side to side is worn by a layout that reads each side of the face from its own half; h04\'s mirrored layout, which reads both sides from one half, wears a face whose eyes match', () => {
  // the eye band of each face's painting, as the bake maps it (PAINTINGS - its DDS that painting, the first test): how
  // far its left half differs from its mirror image
  const eyeBand = (id) => {
    const { width: W, height: H, data: rgba } = readPng(raw(PAINTINGS[id]));
    let d = 0, m = 0;
    for (let y = Math.floor(0.3 * H); y < Math.floor(0.55 * H); y++) {
      for (let x = Math.floor(0.3 * W); x < W / 2; x++) {
        for (let k = 0; k < 3; k++) { d += Math.abs(rgba[(y * W + x) * 4 + k] - rgba[(y * W + W - 1 - x) * 4 + k]); m++; }
      }
    }
    return d / m;
  };
  // which half of the painting each side of the face reads: the share of the +x side's vertices left of the middle,
  // and of the -x side's right of it (a mirrored layout reads both sides from one half)
  const halves = (id) => {
    const { positions: P, uvs: UV } = nifOf(id)[0];
    const side = (sgn, left) => { let n = 0, k = 0; for (let v = 0; v < P.length / 3; v++) if (sgn * P[v * 3] > 1) { n++; if ((UV[v * 2] < 0.5) === left) k++; } return k / n; };
    return [side(1, true), side(-1, false)];
  };
  const band = Object.fromEntries(HEADS.map((id) => [id, eyeBand(id)]));
  assert.ok(band.breton_m_head_h0423 > 30, `the eyepatch's eyes differ side to side (${band.breton_m_head_h0423.toFixed(1)})`);
  assert.ok(band.breton_m_head_h04 < 12 && band.breton_m_head_h0411 < 12, `the plain faces' eyes match (${band.breton_m_head_h04.toFixed(1)}, ${band.breton_m_head_h0411.toFixed(1)})`);
  for (const id of ['breton_m_head_h0411', 'breton_m_head_h0423']) {
    const [r, l] = halves(id);
    assert.ok(r > 0.85 && l > 0.95, `${id}: each side of the face reads its own half (${r.toFixed(2)}, ${l.toFixed(2)})`);
  }
  const [r04, l04] = halves('breton_m_head_h04');
  assert.ok(r04 > 0.85 && l04 < 0.15, `h04's layout is mirrored - both sides read one half (${r04.toFixed(2)}, ${l04.toFixed(2)})`);
  // so no face whose eyes differ is worn where both sides read one half: one patch, never two
  for (const id of HEADS) {
    const [r, l] = halves(id);
    if (band[id] > 20) assert.ok(r > 0.85 && l > 0.95, `${id}: a one-sided face on a layout that shows it once`);
  }
});

test('MW-HEADS1: every hair sits on every head - no vertex of a scalp stands outside any of the three hairs', () => {
  const tris = (b) => { const out = []; for (let i = 0; i < b.indices.length; i += 3) out.push([0, 1, 2].map((k) => Array.from(b.positions.slice(b.indices[i + k] * 3, b.indices[i + k] * 3 + 3)))); return out; };
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  /** the farthest the ray from the frame's origin along `d` meets a triangle of `T` (0 if none) */
  const reach = (d, T) => {
    let far = 0;
    for (const [a, b, c] of T) {
      const e1 = sub(b, a), e2 = sub(c, a), p = cross(d, e2), det = dot(e1, p);
      if (Math.abs(det) < 1e-12) continue;
      const s = sub([0, 0, 0], a), u = dot(s, p) / det; if (u < 0 || u > 1) continue;
      const q = cross(s, e1), v = dot(d, q) / det; if (v < 0 || u + v > 1) continue;
      const t = dot(e2, q) / det; if (t > far) far = t;
    }
    return far;
  };
  for (const h of HEADS) {
    const P = nifOf(h)[0].positions;
    // the scalp: above the brow (z 2) and behind the face (y 4) - the hair's to cover
    const scalp = []; for (let i = 0; i < P.length; i += 3) if (P[i + 2] > 2 && P[i + 1] < 4) scalp.push([P[i], P[i + 1], P[i + 2]]);
    assert.ok(scalp.length > 60, `${h}: ${scalp.length} scalp vertices`);
    for (const r of HAIRS) {
      const T = tris(nifOf(r)[0]);
      const out = scalp.filter((p) => { const L = Math.hypot(...p); return reach(p.map((x) => x / L), T) < L - 0.05; });
      assert.equal(out.length, 0, `${h} under ${r}: ${out.length} scalp vertices stand outside the hair`);
    }
  }
});

test('MW-HEADS1: the Breton men\'s pools are the port\'s own wherever a face is chosen - the walk, the curated ten (the sixth the eyepatch), the vampire\'s head over them - and every other race and sex the data\'s', () => {
  const own = ownFacePools('Breton', false);
  assert.deepEqual([own.heads.map((r) => r.id), own.hairs.map((r) => r.id)], [HEADS, HAIRS], 'id order - the walk\'s');
  for (const r of [...own.heads, ...own.hairs]) {
    assert.deepEqual({ race: r.race, female: r.female, skin: r.skin, playable: r.playable, firstPerson: r.firstPerson, vampire: r.vampire, model: r.model },
      { race: 'breton', female: false, skin: true, playable: true, firstPerson: false, vampire: false, model: `${r.id}.nif` });
    assert.equal(r.part, r.slot === 'head' ? 0 : 1, `${r.id}: MW_BODY_PARTS' ${r.slot}`);
  }
  for (const [race, female] of [['Breton', true], ['Nord', false], ['Redguard', false], ['Dark Elf', false]]) assert.equal(ownFacePools(race, female), null, `${race} ${female ? 'women' : 'men'}: none`);
  assert.deepEqual(Object.keys(OWN_HEADS), ['breton']);
  // the data's own Breton heads and hairs - a man's never reached, a woman's still hers, a Nord's his
  const data = [];
  for (const [race, sex] of [['breton', false], ['breton', true], ['nord', false]]) {
    for (let i = 0; i < 4; i++) {
      data.push({ id: `b_n_${race}_${sex ? 'f' : 'm'}_head_0${i}`, race, slot: 'head', skin: true, playable: true, firstPerson: false, female: sex });
      data.push({ id: `b_n_${race}_${sex ? 'f' : 'm'}_hair_0${i}`, race, slot: 'hair', skin: true, playable: true, firstPerson: false, female: sex });
    }
  }
  data.push({ id: 'b_v_breton_m_head_01', race: 'breton', slot: 'head', skin: true, playable: false, firstPerson: false, female: false, vampire: true });
  assert.deepEqual(facePools(data, 'breton', false), { heads: own.heads, hairs: own.hairs }, 'a Breton man: the port\'s own, the data\'s ignored');
  assert.deepEqual(facePools(data, 'breton', true).heads.map((r) => r.id), ['b_n_breton_f_head_00', 'b_n_breton_f_head_01', 'b_n_breton_f_head_02', 'b_n_breton_f_head_03']);
  assert.deepEqual(facePools(data, 'nord', false).hairs.map((r) => r.id), ['b_n_nord_m_hair_00', 'b_n_nord_m_hair_01', 'b_n_nord_m_hair_02', 'b_n_nord_m_hair_03']);
  const face = (opts) => { const rows = playerBodyRows(data, 'breton', false, opts); return ['head', 'hair'].map((s) => rows.find((r) => r.slot === s)); };
  // the player's ten portraits, curated by eye (bible/04-Characters/Own-Heads.md): each its table's pair, the sixth the eyepatch
  const want = { 0: ['h0411', '0111'], 1: ['h0411', 'widow'], 2: ['h04', '01'], 3: ['h04', 'widow'], 4: ['h0411', '0111'],
    5: ['h04', '0111'], 6: ['h0423', '0111'], 7: ['h0411', '01'], 8: ['h0411', 'widow'], 9: ['h04', 'widow'] };
  for (let f = 0; f < 10; f++) {
    const [head, hair] = face({ faceIndex: f });
    assert.deepEqual([head.record.id, hair.record.id], [`breton_m_head_${want[f][0]}`, `breton_m_hair_${want[f][1]}`], `portrait ${f}`);
    assert.match(head.verdict, /curated$/); assert.match(hair.verdict, /curated$/);
  }
  assert.deepEqual(Object.keys(FACE_TABLE), ['breton']);
  assert.deepEqual(Object.keys(FACE_TABLE.breton.male), ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
  // an NPC's face walked off its seed - every one of the nine pairs reached
  const pairs = new Set(Array.from({ length: 300 }, (_, s) => face({ faceIndex: s % 10, walk: npcFaceOf(npcHint(s * 2654435761 >>> 0, 0)) }).map((r) => r.record.id).join()));
  assert.equal(pairs.size, 9, 'three heads times three hairs');
  // a Breton vampire's head is the race's vampire head, over his own; his hair his own
  const [vHead, vHair] = face({ faceIndex: 6, vampire: true });
  assert.equal(vHead.record.id, 'b_v_breton_m_head_01'); assert.equal(vHair.record.id, 'breton_m_hair_0111');
  // a Breton woman: the data's, by her face index (no table for her)
  const her = playerBodyRows(data, 'breton', true, { faceIndex: 5 });
  assert.equal(her.find((r) => r.slot === 'head').record.id, 'b_n_breton_f_head_01');
  // the viewer's face sheet - the page the table is authored against - sheets no race and sex the port's own stand for
  assert.match(rd('src/tools/mwViewer.js'), /\n {6}if \(ownFacePools\(race\.id, female\)\) \{ own\.push\(`\$\{race\.id\} \$\{female \? 'female' : 'male'\}`\); continue; \}\n/);
});

test('MW-HEADS1: through the binder a retail head takes - every head and hair a rigid part under the Head node, unmirrored, its own geometry, no note', async () => {
  const parts = [...HEADS, ...HAIRS].map((id) => ({ slot: id.includes('_hair_') ? 'hair' : 'head', bones: ['head'], bytes: onDisk(meshFile(id)) }));
  const asm = await assembleFirstPersonArm({ skeletonBytes: retailSkeleton(), parts });
  assert.ok(asm.ok, asm.error);
  assert.deepEqual(asm.notes, []);
  assert.equal(asm.pieces.length, 6);
  for (const [i, id] of [...HEADS, ...HAIRS].entries()) {
    const piece = asm.pieces[i];
    assert.deepEqual([piece.kind, piece.bone, piece.mirrored], ['rigid', 'head', false], id);
    assert.deepEqual(Array.from(piece.source), Array.from(nifOf(id)[0].positions), `${id}: its own geometry, in the frame the Head node hangs it in`);
  }
});
