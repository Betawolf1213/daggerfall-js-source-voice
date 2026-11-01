// rw-materials sidecar (docs/rw-materials-sidecar.md v1) — pure node tests: parsing/validation, the rw-poi matching
// rule, door safety (74/56/95/331>0, climate-reduced), all vs replace remaps, NEW-Map identity, climate composition.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseMaterialsFile, buildMaterialsIndex, matchOverride, buildMaterialRemap, materialTakes, materialsRemap,
  resolveBlockOverrides, createMaterialsRuntime, isDoorTexture, MATERIALS_FORMAT, MATERIALS_VERSION, paintEntry,
} from '../src/scenes/materialsSidecar.js';
import { blockRecords, recordKey } from '../src/scenes/poiSidecar.js';
import { applyClimate, SEASON } from '../src/world/climateSwaps.js';
import { DOOR_TYPE, subMeshDoorType } from '../src/world/meshReader.js';

const matJson = (o = {}) => ({ format: MATERIALS_FORMAT, version: MATERIALS_VERSION, block: 'TEMPASH0.RMB', overrides: [], ...o });
const ov = (o = {}) => ({ id: 'm1', kind: 'misc3d', sub: null, modelId: 43734, pos: [2810, -68, -1870], mode: 'all', from: null, to: { archive: 17, record: 0 }, ...o });

test('a materials file with the wrong format or version is ignored with a warning; a good override is kept', () => {
  assert.equal(parseMaterialsFile({ format: 'x', version: 1, block: 'A.RMB' }, 'f').overrides.length, 0);
  assert.equal(parseMaterialsFile({ format: 'rw-materials', version: 2, block: 'A.RMB' }, 'f').warnings.length, 1);
  assert.equal(parseMaterialsFile(null, 'f').warnings.length, 1);
  const r = parseMaterialsFile(matJson({ overrides: [ov(), { ...ov(), id: 'bad', kind: 'wall' }, { ...ov(), id: 'bad2', pos: [1, 2] }] }), 'b.mat.json');
  assert.deepEqual(r.overrides.map((o) => o.id), ['m1']);
  assert.equal(r.warnings.length, 2);
});

test('mode, to and from obey the contract: bad mode, door textures, replace without from, malformed uv, duplicate id - skipped with a warning', () => {
  const r = parseMaterialsFile(matJson({ overrides: [
    { ...ov(), id: 'a', mode: 'sometimes' },
    { ...ov(), id: 'b', to: { archive: 74, record: 0 } },            // a building door texture
    { ...ov(), id: 'c', to: { archive: 174, record: 3 } },           // its climate variant (174 reduces to 74)
    { ...ov(), id: 'd', mode: 'replace', from: null },               // replace needs a from
    { ...ov(), id: 'e', mode: 'replace', from: { archive: 95, record: 0 }, to: { archive: 16, record: 2 } },   // from is a door
    { ...ov(), id: 'f', uv: { scale: [0, 1], offset: [0, 0], rot: 45 } },
    { ...ov(), id: 'g', to: { archive: 11, record: 0 }, uv: { scale: [1, 1], offset: [0, 0], rot: 0 } },
    ov({ id: 'g' }),                                                  // a duplicate id: the later one drops
  ] }), 'b.mat.json');
  assert.deepEqual(r.overrides.map((o) => o.id), ['g']);
  assert.deepEqual(r.overrides[0].uv, { scale: [1, 1], offset: [0, 0], rot: 0 });
  assert.ok(r.warnings.some((w) => /mode must be all or replace/.test(w)));
  assert.ok(r.warnings.some((w) => /to 74\.0 is a door texture/.test(w)));
  assert.ok(r.warnings.some((w) => /to 174\.3 is a door texture/.test(w)));
  assert.ok(r.warnings.some((w) => /replace needs a from/.test(w)));
  assert.ok(r.warnings.some((w) => /from 95\.0 is a door texture/.test(w)));
  assert.ok(r.warnings.some((w) => /unusable uv/.test(w)));
  assert.ok(r.warnings.some((w) => /not unique/.test(w)));
  assert.equal(r.warnings.length, 7);
});

test('the index builds per block with its vendor, a switched-off vendor contributes nothing, a throwing file is a warning not a crash', () => {
  const files = { blocks: {
    '../../vendor/off/materials/blocks/A.mat.json': matJson({ overrides: [ov()] }),
    '../../vendor/on/materials/blocks/B.mat.json': matJson({ block: 'B.RMB', overrides: [ov({ id: 'x' })] }),
  } };
  assert.equal(buildMaterialsIndex(files, { isOn: () => false }).blocks.size, 0);
  const idx = buildMaterialsIndex(files, { isOn: (v) => v === 'on' });
  assert.equal(idx.blocks.size, 1);
  assert.equal(idx.blocks.get('B.RMB').length, 1);
  assert.equal(idx.blocks.get('B.RMB')[0].vendor, 'on');
  assert.equal(buildMaterialsIndex({ blocks: { 'v.mat.json': matJson({ overrides: [] }) } }).blocks.size, 0);   // an empty file claims no block
  const trap = { get json() { throw new Error('boom'); } };
  assert.doesNotThrow(() => buildMaterialsIndex({ blocks: { 'v.mat.json': trap } }));
  assert.equal(buildMaterialsIndex({ blocks: { 'v.mat.json': trap } }).warnings.length, 1);
});

const records = {
  rmbBlock: {
    subRecords: [
      { exterior: { block3dObjectRecords: [{ modelIdNum: 77, xPos: 100, yPos: 0, zPos: 200 }] } },
      { exterior: { block3dObjectRecords: [{ modelIdNum: 456, xPos: 5, yPos: 5, zPos: 5 }] } },
    ],
    misc3dObjectRecords: [
      { modelIdNum: 43734, xPos: 2810, yPos: -68, zPos: -1870 },
      { modelIdNum: 43734, xPos: 2832, yPos: -68, zPos: -1870 },
    ],
  },
};
const recs = blockRecords(records);

test('an override matches the rw-poi rule: kind/sub/model equal, each axis within 16 RMB units, nearest wins; beyond 16 it dangles', () => {
  assert.equal(recs.length, 4);
  assert.equal(matchOverride(ov(), recs).pos[0], 2810);
  assert.equal(matchOverride(ov({ pos: [2811, -68, -1870] }), recs).pos[0], 2810);          // both in range - nearest
  assert.equal(matchOverride(ov({ pos: [2820, -68, -1870] }), recs).pos[0], 2810);          // 10 vs 12 - nearest wins
  assert.equal(matchOverride(ov({ pos: [2827, -68, -1870] }), recs).pos[0], 2832);          // 17 from 2810 is out; 5 from 2832
  assert.equal(matchOverride(ov({ pos: [2793, -68, -1870] }), blockRecords({ rmbBlock: { misc3dObjectRecords: [{ modelIdNum: 43734, xPos: 2810, yPos: -68, zPos: -1870 }] } })), null);   // 17 units: no match
  assert.equal(matchOverride({ ...ov(), kind: 'subModel', sub: 1, modelId: 456, pos: [5, 5, 5] }, recs).sub, 1);
  assert.equal(matchOverride({ ...ov(), kind: 'subModel', sub: 0, modelId: 456, pos: [5, 5, 5] }, recs), null);   // the wrong sub
});

test('door submeshes are never repainted in any mode - 74, 56, 95, 331 with record > 0, and their climate variants after reduction', () => {
  assert.equal(subMeshDoorType(74, 0), DOOR_TYPE.BUILDING);
  assert.equal(isDoorTexture(74, 0), true);
  assert.equal(isDoorTexture(174, 3), true);     // 174 reduces to 74
  assert.equal(isDoorTexture(474, 0), true);     // 74 + 400: a door after the reduction
  assert.equal(isDoorTexture(56, 0), true);
  assert.equal(isDoorTexture(95, 0), true);
  assert.equal(isDoorTexture(331, 1), true);
  assert.equal(isDoorTexture(331, 0), false);    // the ruins' record 0 is plain stone
  assert.equal(isDoorTexture(156, 0), false);    // Scourg's exterior is exempted and never a door itself
  assert.equal(isDoorTexture(17, 0), false);
  const sms = [
    { textureArchive: 174, textureRecord: 0 },
    { textureArchive: 56, textureRecord: 4 },
    { textureArchive: 95, textureRecord: 1 },
    { textureArchive: 331, textureRecord: 1 },
    { textureArchive: 331, textureRecord: 0 },   // stone, NOT a door: paintable
    { textureArchive: 474, textureRecord: 0 },
    { textureArchive: 17, textureRecord: 0 },
    { textureArchive: 32, textureRecord: 1 },
  ];
  const all = buildMaterialRemap(ov({ mode: 'all' }), sms);
  assert.deepEqual([...all.keys()].sort(), ['17_0', '32_1', '331_0']);
  assert.ok(![...all.keys()].some((k) => /^(174|56|95|474)_/.test(k)));
  assert.equal(sms.filter((sm) => materialTakes(ov({ mode: 'all' }), sm)).length, 3);
});

test('all vs replace: all paints every non-door submesh, replace only the from-texture ones', () => {
  const sms = [
    { textureArchive: 17, textureRecord: 0 },
    { textureArchive: 32, textureRecord: 1 },
    { textureArchive: 32, textureRecord: 2 },
    { textureArchive: 74, textureRecord: 0 },
  ];
  const all = buildMaterialRemap(ov({ mode: 'all' }), sms);
  assert.deepEqual([...all.keys()], ['17_0', '32_1', '32_2']);
  assert.ok([...all.values()].every((v) => v === '17_0'));
  const rep = buildMaterialRemap(ov({ mode: 'replace', from: { archive: 32, record: 1 } }), sms);
  assert.deepEqual([...rep.keys()], ['32_1']);
  assert.equal(rep.get('32_1'), '17_0');
  assert.deepEqual([...buildMaterialRemap(ov({ mode: 'replace', from: { archive: 99, record: 0 } }), sms).keys()], []);
  assert.deepEqual([...buildMaterialRemap(null, sms).keys()], []);
  assert.deepEqual([...buildMaterialRemap(ov(), undefined).keys()], []);
});

test('every table is a NEW Map (the renderer EV2 cache keys by remap identity)', async () => {
  const a = buildMaterialRemap(ov(), [{ textureArchive: 17, textureRecord: 0 }]);
  const b = buildMaterialRemap(ov(), [{ textureArchive: 17, textureRecord: 0 }]);
  assert.notEqual(a, b);
  assert.deepEqual([...a], [...b]);
  const deps = { getTexture: async () => ({ recordCount: 256 }), uploadRecord: () => {} };
  const m1 = await materialsRemap([{ textureArchive: 17, textureRecord: 0 }], null, ov(), (x) => x, deps);
  const m2 = await materialsRemap([{ textureArchive: 17, textureRecord: 0 }], null, ov(), (x) => x, deps);
  assert.notEqual(m1, m2);
  assert.equal(m1.get('17_0'), '17_0');
});

test('materialsRemap composes the climate swap over the OVERRIDE archive (rule 2), uploads it opaque, prunes a record the archive lacks, and carries the pixel table over', async () => {
  // 9 (a temperate building wall family) goes to 109 in a desert - applyClimate's own law, as the town's pass uses it
  assert.equal(applyClimate(9, 1, 100, SEASON.Summer), 109);
  const climateDesert = (a, r) => applyClimate(a, r, 100, SEASON.Summer);
  const base = new Map([['99_0', '199_0'], ['17_0', '117_0']]);   // the pixel's own swap table
  const uploads = [];
  const deps = { getTexture: async (a) => ({ recordCount: a === 109 ? 4 : 256 }), uploadRecord: (a, r, o) => uploads.push([a, r, o]) };
  const sms = [
    { textureArchive: 17, textureRecord: 0 },      // taken by the override (replace mode: only this one)
    { textureArchive: 99, textureRecord: 0 },      // not taken: keeps the pixel's swapped texture
    { textureArchive: 74, textureRecord: 0 },      // a door: takes nothing
  ];
  const map = await materialsRemap(sms, base, ov({ mode: 'replace', from: { archive: 17, record: 0 }, to: { archive: 9, record: 1 } }), climateDesert, deps);
  assert.equal(map.get('17_0'), '109_1', 'the override archive went through the climate law');
  assert.equal(map.get('99_0'), '199_0');
  assert.ok(!map.has('74_0'), 'a door takes nothing');
  assert.deepEqual(uploads, [[109, 1, { opaque: true }]], 'uploaded as a mesh material exactly like texRemap.js');
  assert.notEqual(map, base);
  // mode 'all' paints every non-door submesh with the same climate-swapped target
  const allMap = await materialsRemap(sms, base, ov({ to: { archive: 9, record: 1 } }), climateDesert, deps);
  assert.equal(allMap.get('17_0'), '109_1');
  assert.equal(allMap.get('99_0'), '109_1');
  // the prune: 109's recordCount is 4, so record 9 does not exist there - the submesh falls back to the town's texture
  const pruned = await materialsRemap(sms, base, ov({ mode: 'replace', from: { archive: 17, record: 0 }, to: { archive: 9, record: 9 } }), climateDesert, deps);
  assert.equal(pruned.get('17_0'), '117_0', 'a record the swapped archive lacks is left to the town (the texRemap.js prune)');
  assert.equal(pruned.get('99_0'), '199_0');
  // and a getTexture that throws is a fallback to the town, not a crash
  const thrown = await materialsRemap(sms, base, ov({ mode: 'replace', from: { archive: 17, record: 0 }, to: { archive: 9, record: 1 } }), climateDesert, { ...deps, getTexture: async () => { throw new Error('no archive'); } });
  assert.equal(thrown.get('17_0'), '117_0', 'the failed upload leaves the submesh on the town texture');
});

test('resolveBlockOverrides: one override per record (the first wins), dangling ones warned not thrown; the runtime resolves per block', () => {
  const warns = [];
  const warn = (m) => warns.push(m);
  const resolved = resolveBlockOverrides('TEMPASH0.RMB', [
    { ...ov(), id: 'first', pos: [2810, -68, -1870] },
    { ...ov(), id: 'second', pos: [2811, -68, -1870] },   // matches the SAME record
    { ...ov(), id: 'orphan', pos: [1, 1, 1] },
  ], records, warn);
  assert.equal(resolved.size, 1);
  assert.equal(resolved.values().next().value.id, 'first');
  assert.ok(warns.some((w) => /matches no placed/.test(w)));
  assert.ok(warns.some((w) => /the first wins/.test(w)));
  const rt = createMaterialsRuntime({ blocks: new Map([['TEMPASH0.RMB', [
    { ...ov(), id: 'm9', file: 'v.mat.json' },
    { ...ov(), id: 'uv', pos: [2832, -68, -1870], uv: { scale: [2, 2], offset: [0, 0], rot: 0 }, file: 'v.mat.json' },
  ]]]) }, { warn });
  assert.equal(rt.active, true);
  assert.equal(rt.hasBlock('tempash0.rmb'), true);           // block names are case-free
  const one = rt.forBlock('TEMPASH0.RMB', records);
  assert.equal(one.size, 2);                                  // m9 on the 2810 record, uv on the 2832 one
  assert.ok(warns.some((w) => /no uv path/.test(w)), 'a non-identity uv warns once');
  rt.forBlock('TEMPASH0.RMB', records);
  assert.equal(warns.filter((w) => /no uv path/.test(w)).length, 1, 'the uv warning is one-time');
  const empty = createMaterialsRuntime({ blocks: new Map() });
  assert.equal(empty.active, false);
  assert.equal(empty.forBlock('TEMPASH0.RMB', records).size, 0);
});

test('paintEntry (the hosts\' one-line hook) paints only the matched record and leaves others and unknown sources untouched', async () => {
  const src = { kind: 'misc3d', sub: null, modelId: 43734, pos: [2810, -68, -1870] };
  const matBlock = new Map([[recordKey(src), ov()]]);
  const deps = { getTexture: async () => ({ recordCount: 256 }), uploadRecord: () => {} };
  const subs = [{ textureArchive: 67, textureRecord: 14 }, { textureArchive: 74, textureRecord: 1 }];
  const hit = {}, miss = { texRemap: 'base' }, none = {};
  assert.ok(await paintEntry(hit, matBlock, src, subs, null, (x) => x, deps));
  assert.equal(hit._rwMat.id, 'm1');
  assert.equal(hit.texRemap.get('67_14'), '17_0');
  assert.ok(!hit.texRemap.has('74_1'), 'the door sub-mesh keeps its own texture');
  assert.equal(await paintEntry(miss, matBlock, { ...src, pos: [0, 0, 0] }, subs, null, (x) => x, deps), null);
  assert.deepEqual(miss, { texRemap: 'base' });
  assert.equal(await paintEntry(none, matBlock, undefined, subs, null, (x) => x, deps), null);
  assert.equal(await paintEntry(none, null, src, subs, null, (x) => x, deps), null);
  assert.deepEqual(none, {});
});
