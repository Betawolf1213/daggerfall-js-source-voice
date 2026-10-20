// WD-OWNED (2026-10-20, the owner: "do your own performance pass ... go deep"; bible/07-Rendering/Performance-Priority.md
// WD-OWNED) - A TOWN FILE'S EDITS LAID ON ITS OWN BASE. The boot reads every location of the world (its index), and each
// town a pack edits is rebuilt then: its classic location read afresh, made DFU's JSON (locationToDfuJson) and the
// author's edits laid on it (worldDataPack.js rebuild) - over a deep copy of that JSON, which nothing else held: the
// copy was 7,727 JSON round trips of 40 MB at the boot. A location's base is laid on in place now; a block's base (the
// classic JSON kept for the next file) and a file's (a kept base file) are still copied. Held here: patchJson's `owned`
// itself, a town file rebuilt the author's file without a copy made and every rebuild its own object, and the kept
// bases untouched by the files laid on them. Over the real data: every file of both town packs still rebuilds the
// author's file sha256 for sha256 (test/formats/worldData/wd3_pack.test.js, with ARENA2_PATH).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openWorldDataPack, PACK_FORMAT } from '../../../src/formats/worldData/worldDataPack.js';
import { patchJson, canonicalJson, locationToDfuJson, diffJson } from '../../../src/formats/worldData/worldDataJson.js';
import { tinyRmb, fakeBlocks } from '../../wd3Fakes.mjs';

/** A classic town as MapsFile reads it - every field locationToDfuJson reads. */
const tinyTown = () => ({
  loaded: true, name: 'Tinyford', regionName: 'Daggerfall', hasDungeon: false, regionIndex: 17, locationIndex: 4, politic: 0,
  mapTableData: { mapId: 1234, latitude: 100, longitude: 200, locationType: 2, dungeonType: 0, discovered: false, key: 0 },
  exterior: {
    recordElement: { header: { x: 1, y: 2, isExterior: 1, unknown2: 0, locationId: 5, isInterior: 0, exteriorLocationId: 0, locationName: 'Tinyford' } },
    buildingCount: 2,
    buildings: [{ nameSeed: 1, factionId: 0, sector: 1, locationId: 0, buildingType: 18, quality: 7 }, { nameSeed: 2, factionId: 41, sector: 2, locationId: 0, buildingType: 3, quality: 12 }],
    exteriorData: { anotherName: 'Tinyford', mapId: 1234, locationId: 5, width: 2, height: 1, portTownAndUnknown: 0, blockNames: ['TINYAA00.RMB', 'TINYAA00.RMB'] },
  },
  dungeon: { recordElement: { header: null }, header: { blockCount: 0 }, blocks: null },
  climate: { worldClimate: 230, climateType: 0, natureArchive: 504, groundArchive: 302, skyBase: 0, people: 0 },
});

/** A pack with a town file - the town renamed, a block of its grid swapped, a building moved and one removed - and a
 *  block file, both as the builder writes them (ops diffJson's). */
function townPack() {
  const classic = locationToDfuJson(tinyTown());
  const want = JSON.parse(JSON.stringify(classic));
  want.Name = 'Tinyford Hollow';
  want.Exterior.ExteriorData.BlockNames[1] = 'TINYBB00.RMB';
  want.Exterior.Buildings[0].Sector = 9;
  want.Exterior.Buildings.splice(1, 1);
  want.Exterior.BuildingCount = 1;
  const pack = {
    format: PACK_FORMAT, vendor: 'tiny-towns', mod: { title: 'Tiny Towns', author: 'nobody', version: '0.0.1' }, nodes: [],
    files: { 'location-17-4.json': ['sha', ['l', 17, 4, 'Tinyford'], diffJson(classic, want)] },
  };
  return { pack, want };
}
const mapsOf = () => { const m = { reads: 0, readClassicLocation: (r, l) => { m.reads++; return r === 17 && l === 4 ? tinyTown() : null; } }; return m; };

test('WD-OWNED patchJson lays the edits on a copy unless the base is the caller\'s own - then on the base itself, the same tree either way (mutant: `owned` ignored)', () => {
  const { pack, want } = townPack();
  const ops = pack.files['location-17-4.json'][2];
  const base = locationToDfuJson(tinyTown()), before = canonicalJson(base);
  const copied = patchJson(base, ops);
  assert.equal(canonicalJson(base), before, 'a base not owned is left as it was');
  assert.notEqual(copied, base);
  const owned = locationToDfuJson(tinyTown());
  const laid = patchJson(owned, ops, null, { owned: true });
  assert.equal(laid, owned, 'an owned base is the tree the edits are laid on');
  assert.equal(canonicalJson(laid), canonicalJson(copied));
  assert.equal(canonicalJson(laid), canonicalJson(want));
});

test('WD-OWNED a town file rebuilds the author\'s file with no copy of its base made, each rebuild its own object off its own read of the town (mutants: the town\'s base copied; laid on a kept base)', () => {
  const { pack, want } = townPack();
  const maps = mapsOf();
  const p = openWorldDataPack(pack, { blocks: fakeBlocks(tinyRmb()) });
  const parse = JSON.parse;
  let roundTrips = 0;
  JSON.parse = function (...a) { roundTrips++; return parse.apply(this, a); };
  let a;
  try { a = p.rebuild('location-17-4.json', maps); } finally { JSON.parse = parse; }
  assert.equal(canonicalJson(a), canonicalJson(want), 'the author\'s file');
  assert.equal(roundTrips, 0, 'no JSON round trip: the town\'s base is laid on, and every value laid is a plain one');
  const b = p.rebuild('location-17-4.json', maps);
  assert.notEqual(a, b, 'each rebuild its own object');
  assert.equal(maps.reads, 2, 'each off its own read of the town');
  a.Exterior.ExteriorData.BlockNames[0] = 'CHANGED.RMB';
  assert.equal(canonicalJson(b), canonicalJson(want), 'one rebuild\'s tree shares nothing with another\'s');
});
