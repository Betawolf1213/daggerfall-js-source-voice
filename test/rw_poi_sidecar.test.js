import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseDungeonsFile, parseBlockFile, buildPoiIndex, matchEntrance, blockRecords, resolveBlockEntrances, recordKey,
  mobilePool, rollSpawn, spawnerReady, tickSpawners, resolveDungeonLocation, createPoiRuntime, poiDoorFor,
  SPAWN_POOLS, POI_MATCH_UNITS, restorePoiSaveData, poiSaveData, _resetPoiCooldowns,
} from '../src/scenes/poiSidecar.js';
import { MOBILE_TYPES } from '../src/characters/mobileTypes.js';

const dungeonsJson = (list) => ({ format: 'rw-poi-dungeons', version: 1, dungeons: list });
const hold = { key: 'grimfang-hold', name: 'Grimfang Hold', type: 'OrcStronghold', theme: 'orc', source: { kind: 'location', region: 17, name: "Privateer's Hold" } };
const blockJson = (o = {}) => ({ format: 'rw-poi-block', version: 1, block: 'RWGA000.RMB', entrances: [], spawners: [], ...o });
const ent = { id: 'e1', kind: 'misc3d', sub: null, modelId: 456, pos: [1664, 0, -2176], dungeon: 'grimfang-hold' };
const spw = { id: 's1', pos: [1500, 0, -2000], tier: 'easy', theme: 'orc', mobiles: [], count: [1, 3], radius_m: 6, trigger_m: 40, respawn_h: 24 };

test('a dungeons file with the wrong format or version is ignored with a warning and a good entry is kept', () => {
  assert.equal(parseDungeonsFile({ format: 'x', version: 1, dungeons: [] }, 'f').dungeons.length, 0);
  assert.equal(parseDungeonsFile({ format: 'rw-poi-dungeons', version: 2, dungeons: [] }, 'f').warnings.length, 1);
  const r = parseDungeonsFile(dungeonsJson([hold, { key: 'Bad Key', name: 'x', source: hold.source }, { key: 'nosrc', name: 'n', source: { kind: 'location' } }]), 'f');
  assert.deepEqual(r.dungeons.map((d) => d.key), ['grimfang-hold']);
  assert.equal(r.warnings.length, 2);
});

test('an rdb source needs a non-empty list of block names and a location source needs a mapId or region plus name', () => {
  const r = parseDungeonsFile(dungeonsJson([
    { key: 'a', name: 'A', source: { kind: 'rdb', blocks: ['RWGA000.RDB'], start: 0 } },
    { key: 'b', name: 'B', source: { kind: 'rdb', blocks: [] } },
    { key: 'c', name: 'C', source: { kind: 'location', mapId: 123456 } },
  ]), 'f');
  assert.deepEqual(r.dungeons.map((d) => d.key), ['a', 'c']);
});

test('a block file skips a malformed entrance or spawner with a warning and keeps the rest', () => {
  const r = parseBlockFile(blockJson({
    entrances: [ent, { ...ent, id: 'bad', kind: 'wall' }, { ...ent, id: 'bad2', pos: [1, 2] }, { ...ent, id: 'sub', kind: 'subModel' }],
    spawners: [spw, { ...spw, id: 'bad3', tier: 'epic' }, { ...spw, id: 'bad4', count: [3, 1] }, { ...spw, id: 'once', respawn_h: null }],
  }), 'b.poi.json');
  assert.deepEqual(r.entrances.map((e) => e.id), ['e1']);
  assert.deepEqual(r.spawners.map((s) => s.id), ['s1', 'once']);
  assert.equal(r.warnings.length, 5);
});

test('a dungeon key clash warns and the first file in path order wins; entrances to unknown dungeons are dropped', () => {
  const idx = buildPoiIndex({
    dungeons: {
      '../../vendor/b-mod/poi/dungeons.json': dungeonsJson([{ ...hold, name: 'Second' }]),
      '../../vendor/a-mod/poi/dungeons.json': dungeonsJson([hold]),
    },
    blocks: { '../../vendor/a-mod/poi/blocks/RWGA000.poi.json': blockJson({ entrances: [ent, { ...ent, id: 'e2', dungeon: 'nowhere' }] }) },
  });
  assert.equal(idx.dungeons.get('grimfang-hold').name, 'Grimfang Hold');
  assert.equal(idx.dungeons.get('grimfang-hold').vendor, 'a-mod');
  assert.ok(idx.warnings.some((w) => /already taken/.test(w)));
  assert.ok(idx.warnings.some((w) => /unknown dungeon 'nowhere'/.test(w)));
  assert.deepEqual(idx.blocks.get('RWGA000.RMB').entrances.map((e) => e.id), ['e1']);
});

test('a vendor switched off contributes nothing, and a file that throws on read is a warning not a crash', () => {
  const files = { dungeons: { '../../vendor/off/poi/dungeons.json': dungeonsJson([hold]) }, blocks: {} };
  assert.equal(buildPoiIndex(files, { isOn: () => false }).dungeons.size, 0);
  const trap = { get dungeons() { throw new Error('boom'); } };
  assert.doesNotThrow(() => buildPoiIndex({ dungeons: { 'vendor/x/poi/dungeons.json': trap }, blocks: {} }));
});

const records = {
  rmbBlock: {
    subRecords: [{ exterior: { block3dObjectRecords: [{ modelIdNum: 77, xPos: 100, yPos: 0, zPos: 200 }] } }, { exterior: { block3dObjectRecords: [{ modelIdNum: 456, xPos: 5, yPos: 5, zPos: 5 }] } }],
    misc3dObjectRecords: [{ modelIdNum: 456, xPos: 1664, yPos: 0, zPos: -2176 }, { modelIdNum: 456, xPos: 1664 + 17, yPos: 0, zPos: -2176 }],
  },
};

test('an entrance matches a record of the same kind and model within 16 units on each axis and not at 17', () => {
  const recs = blockRecords(records);
  assert.equal(recs.length, 4);
  assert.ok(matchEntrance(ent, recs));
  assert.ok(matchEntrance({ ...ent, pos: [1664 + POI_MATCH_UNITS, 16, -2176 - 16] }, recs));
  assert.equal(matchEntrance({ ...ent, pos: [1664 + POI_MATCH_UNITS + 1, 0, -2176] }, [recs[3]].filter((r) => r.pos[0] === 1664)), null);
  assert.equal(matchEntrance({ ...ent, modelId: 999 }, recs), null);
  assert.equal(matchEntrance({ ...ent, kind: 'subModel', sub: 0 }, recs), null);
  assert.ok(matchEntrance({ ...ent, kind: 'subModel', sub: 1, pos: [0, 0, 0] }, recs));
  assert.equal(matchEntrance({ ...ent, kind: 'subModel', sub: 0, pos: [0, 0, 0] }, recs), null);
});

test('the nearest of two candidates inside the tolerance wins', () => {
  const recs = blockRecords(records);
  const m = matchEntrance({ ...ent, pos: [1664 + 14, 0, -2176] }, recs);
  assert.equal(m.pos[0], 1664 + 17);
});

test('resolving a block warns once per unresolved entrance and never throws', () => {
  const warns = [];
  const out = resolveBlockEntrances('RWGA000.RMB', [{ ...ent, file: 'f' }, { ...ent, id: 'lost', modelId: 1, file: 'f' }], records, (m) => warns.push(m));
  assert.equal(out.size, 1);
  assert.equal(warns.length, 1);
  assert.match(warns[0], /entrance lost matches no placed misc3d/);
  assert.ok(out.has(recordKey(blockRecords(records)[2])));
});

test('theme and tier pick DFU mobile ids: orc easy is the Orc, hard the Sergeant and Shaman, miniboss the Warlord', () => {
  const M = MOBILE_TYPES;
  assert.deepEqual(mobilePool({ theme: 'orc', tier: 'easy', mobiles: [] }), [M.Orc]);
  assert.deepEqual(mobilePool({ theme: 'orc', tier: 'hard', mobiles: [] }), [M.OrcSergeant, M.OrcShaman]);
  assert.deepEqual(mobilePool({ theme: 'orc', tier: 'miniboss', mobiles: [] }), [M.OrcWarlord]);
  assert.ok(mobilePool({ theme: 'undead', tier: 'miniboss', mobiles: [] }).includes(M.AncientLich));
  assert.ok(mobilePool({ theme: 'any', tier: 'easy', mobiles: [] }).includes(M.Rat));
  assert.deepEqual(mobilePool({ theme: 'orc', tier: 'easy', mobiles: [20, 9999] }), [20]);
  for (const t of Object.values(SPAWN_POOLS)) for (const ids of Object.values(t)) for (const id of ids) assert.ok(Object.values(M).includes(id));
});

test('a roll draws count within the inclusive range and scatters inside radius_m from the pool only', () => {
  let seed = 7; const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const seen = new Set();
  for (let i = 0; i < 200; i++) {
    const r = rollSpawn(spw, rng);
    seen.add(r.length);
    for (const x of r) { assert.equal(x.mobileType, MOBILE_TYPES.Orc); assert.ok(Math.hypot(x.dx, x.dz) <= spw.radius_m + 1e-9); }
  }
  assert.deepEqual([...seen].sort(), [1, 2, 3]);
});

test('a spawner is ready when never fired, never again when respawn_h is null, and after exactly respawn_h hours otherwise', () => {
  assert.equal(spawnerReady(undefined, 5, 24), true);
  assert.equal(spawnerReady(10, 9999, null), false);
  assert.equal(spawnerReady(10, 33.99, 24), false);
  assert.equal(spawnerReady(10, 34, 24), true);
});

test('a spawner fires once inside trigger_m, not outside it and not again within respawn_h, and fires again after', () => {
  _resetPoiCooldowns();
  const cd = new Map();
  const spawned = [];
  const sites = [{ key: 'RWGA000.RMB|s1|0,0', spawner: spw, pos: [0, 0, 0] }];
  const tick = (player, hours) => tickSpawners(sites, { player, hours, spawn: (t, p, o) => spawned.push([t, p, o]), rng: () => 0.5, cooldowns: cd });
  assert.equal(tick([41, 0, 0], 100).length, 0);
  assert.equal(tick([39, 0, 0], 100).length, 1);
  const n = spawned.length;
  assert.ok(n >= 1 && n <= 3);
  assert.equal(tick([1, 0, 0], 110).length, 0);
  assert.equal(spawned.length, n);
  assert.equal(tick([1, 0, 0], 124).length, 1);
});

test('the cooldown record round-trips through the mod save slot and ignores junk', () => {
  _resetPoiCooldowns();
  restorePoiSaveData({ cooldowns: { a: 5, b: 'x', c: 7.5 } });
  assert.deepEqual(poiSaveData(), { cooldowns: { a: 5, c: 7.5 } });
  restorePoiSaveData(null);
  assert.deepEqual(poiSaveData(), { cooldowns: {} });
});

const fakeMaps = (loc) => ({
  regionCount: 2, getRegionIndex: (n) => (n === 'Daggerfall' ? 1 : -1),
  getRegion: () => ({ mapNameLookup: new Map([["Privateer's Hold", 5]]), mapNames: ['a', 'b', 'c', 'd', 'e', "Privateer's Hold"], mapIdLookup: new Map([[123, 5]]) }),
  getLocation: (r, i) => (i === 5 ? loc : null),
});

test('a location source resolves by region index or name, by map id, and an rdb source or a dungeonless target is a warning and null', () => {
  const loc = { name: "Privateer's Hold", hasDungeon: true };
  const maps = fakeMaps(loc), warns = [];
  const w = (m) => warns.push(m);
  assert.equal(resolveDungeonLocation({ key: 'k', source: { kind: 'location', region: 1, name: "Privateer's Hold" } }, maps, w), loc);
  assert.equal(resolveDungeonLocation({ key: 'k', source: { kind: 'location', region: 'Daggerfall', name: "privateer's hold" } }, maps, w), loc);
  assert.equal(resolveDungeonLocation({ key: 'k', source: { kind: 'location', mapId: 123 } }, maps, w), loc);
  assert.equal(resolveDungeonLocation({ key: 'k', source: { kind: 'rdb', blocks: ['A.RDB'] } }, maps, w), null);
  assert.equal(resolveDungeonLocation({ key: 'k', source: { kind: 'location', region: 1, name: 'Nowhere' } }, maps, w), null);
  assert.equal(warns.length, 2);
});

test('the runtime answers entrances for a listed block, nothing online, and warns once for a source that will not resolve', () => {
  const warns = [];
  const idx = buildPoiIndex({
    dungeons: { 'vendor/m/poi/dungeons.json': dungeonsJson([hold, { ...hold, key: 'lost', source: { kind: 'location', region: 1, name: 'Nowhere' } }]) },
    blocks: { 'vendor/m/poi/blocks/RWGA000.poi.json': blockJson({ entrances: [ent, { ...ent, id: 'e2', dungeon: 'lost', pos: [1681, 0, -2176] }], spawners: [spw] }) },
  });
  const rt = createPoiRuntime(idx, fakeMaps({ name: 'X', hasDungeon: true }), { warn: (m) => warns.push(m) });
  assert.equal(rt.hasBlock('rwga000.rmb'), true);
  assert.equal(rt.hasBlock('OTHER.RMB'), false);
  const got = rt.forBlock('RWGA000.RMB', records);
  assert.equal(got.size, 1);
  rt.forBlock('RWGA000.RMB', records);
  assert.equal(warns.filter((m) => /Nowhere|no dungeon/.test(m)).length, 1);
  assert.equal(rt.spawnersOf('RWGA000.RMB').length, 1);
  const off = createPoiRuntime(idx, fakeMaps({ hasDungeon: true }), { online: true });
  assert.equal(off.active, false);
  assert.equal(off.forBlock('RWGA000.RMB', records).size, 0);
  assert.deepEqual(off.spawnersOf('RWGA000.RMB'), []);
});

test('an entrance door is a dungeon-entrance door (type 2) whose trigger box covers the model it stands on', () => {
  const d = poiDoorFor([-2, 0, -3, 2, 4, 3], new Float32Array(16), 7, -1);
  assert.equal(d.doorType, 2);
  assert.equal(d.centre.z, 3);
  assert.equal(d.centre.y, 0.9);
  assert.ok(d.size.x >= 4);
});
