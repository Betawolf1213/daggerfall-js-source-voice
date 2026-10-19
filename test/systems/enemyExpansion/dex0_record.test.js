// DEX0 (2026-10-19, Mac: "I want to implement this as our next mod 1:1. We also need to ensure these get proper
// morrowind model replacements if applicable") - DAGGERFALL ENEMY EXPANSION 1.3.4 (Kamer & Kab): THE RECORD.
//
// What vendor/daggerfall-enemy-expansion/ claims, each claim held: the manifest is the bundle's; the C# beside the
// compiled assembly is what the assembly was built from (every literal in its user-string heap, every member in its
// metadata - so the authors' repository at c187c97 is the shipped 1.3.4, not a later or an earlier one); the tables are
// verbatim; and the art is where tools/dexExtract.mjs put it - every shipped picture in its directory's listing by
// sha256 and every listing name on disk, the pictures that ARE Daggerfall's records specs naming the record and nothing
// else, and the generated index counting exactly the frames the three places hold.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { userStrings, metadataStreams } from '../../../tools/lib/clrUserStrings.mjs';
import { DEX_ART } from '../../../src/systems/enemyExpansion/dexArt.js';
import { DEX_TABLE_TEXT } from '../../../src/systems/enemyExpansion/dexTableText.js';
import { MOD_SETTINGS } from '../../../src/systems/modSettings.js';
import { splitCsvLine, parseArrayArg, parseBool, readCsvTable } from '../../../src/systems/enemyExpansion/dexCsv.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const V = join(ROOT, 'vendor/daggerfall-enemy-expansion');
const read = (p) => readFileSync(join(V, p));
const sha = (b) => createHash('sha256').update(b).digest('hex');
const SCRIPTS = ['BestiaryEnemySpells', 'BestiaryMod', 'BestiarySaveInterface', 'BestiaryTextProvider', 'BestiaryTrollCorpseBillboard',
  'BestiaryTrollCorpseEntity', 'BestiaryTrollCorpseSerializer', 'Compatibility/DEX_RRICompat'];

test('DEX0 the manifest is the bundle\'s: Kamer & Kab\'s 1.3.4, its GUID, its 8,067 files and the eight scripts it names', () => {
  const m = JSON.parse(read('daggerfall-enemy-expansion.dfmod.json'));
  assert.equal(m.ModTitle, 'Daggerfall Enemy Expansion');
  assert.equal(m.ModVersion, '1.3.4');
  assert.equal(m.ModAuthor, 'Kamer & Kab');
  assert.equal(m.GUID, '76557441-7025-402e-a145-e3e1a28a093d');
  assert.equal(m.Files.length, 8067);
  assert.deepEqual(m.Dependencies, [{ Name: 'roleplayrealism-items', IsOptional: true, IsPeer: false }]);
  assert.deepEqual(m.Files.filter((f) => f.endsWith('.cs')).map((f) => f.replace(/^.*\/Scripts\//, '').replace(/\.cs$/, '')).sort(), [...SCRIPTS].sort());
  for (const s of SCRIPTS) assert.ok(existsSync(join(V, 'Scripts', `${s}.cs`)), `${s}.cs is carried`);
});

/** The string literals of the carried C#, as the compiler stores them: an interpolation's holes renumbered {0}, {1}...
 *  (string.Format's form) - a one-hole interpolation is compiled to a concatenation instead, so each literal piece
 *  between holes is what the heap must hold. Comments and the attribute version strings ("v1", in the custom
 *  attribute blob, not the heap) are not code literals. */
function scriptLiterals() {
  const out = [];
  for (const s of SCRIPTS) {
    for (const line of readFileSync(join(V, 'Scripts', `${s}.cs`), 'utf8').split('\n')) {
      if (/^\s*\/\//.test(line) || /fsObject\("v1"\)/.test(line)) continue;
      for (const m of line.matchAll(/(\$?)"((?:[^"\\]|\\.)*)"/g)) {
        const text = m[2].replace(/\\(["\\])/g, '$1').replace(/\\n/g, '\n');
        if (text.length < 2) continue;
        out.push({ script: s, pieces: m[1] ? text.split(/\{[^}]*\}/).filter((p) => p.length) : [text] });
      }
    }
  }
  return out;
}
const heldBy = (heap, pieces) => pieces.every((p) => heap.some((u) => u.includes(p)));

test('DEX0 the C# is what the DLL was built from: every literal is in its user-string heap and every declared member in its metadata', () => {
  const dll = read('Daggerfall Enemy Expansion.dll');
  assert.equal(sha(dll), '666ae571d62164abcc0b3d0ba3669ff46e88addf6a6bd23b01f3d2e48366da80', 'the assembly, byte for byte');
  const heap = userStrings(dll);
  const lits = scriptLiterals();
  assert.ok(lits.length > 200, `${lits.length} literals - the read is reading the scripts`);
  const missing = lits.filter((l) => !heldBy(heap, l.pieces)).map((l) => `${l.script}: ${l.pieces.join(' | ')}`);
  assert.deepEqual(missing, []);
  // the #Strings heap holds every type, field and method name - every method the scripts declare is one. Roslyn shares
  // suffixes there (`Start` is the tail of `OnStart\0`, `Spellbook` of `GetSpellbook\0`), so a name is held when it
  // ends a string of the heap
  const str = metadataStreams(dll).get('#Strings');
  const heapText = Buffer.from(dll.subarray(str.offset, str.offset + str.size)).toString('latin1');
  const names = { has: (n) => heapText.includes(`${n}\0`) };
  const declared = new Set();
  for (const s of SCRIPTS) {
    for (const m of readFileSync(join(V, 'Scripts', `${s}.cs`), 'utf8').matchAll(/^\s+(?:public |private |internal |protected )?(?:static |override |async )*[\w<>[\],.? ]+?\s+([A-Z]\w*)\s*\([^;]*$/gm)) declared.add(m[1]);
  }
  for (const local of ['CreateDefaultTable', 'GetIndex', 'SetSpellReady', 'GetIndexOpt']) declared.delete(local);   // local functions: compiled as <Outer>g__Name|n_m
  assert.ok(declared.size > 50, `${declared.size} declared members`);
  assert.deepEqual([...declared].filter((n) => !names.has(n)), []);
  assert.ok(declared.has('Start') && declared.has('SelectDungeonTable'), 'the read finds the members');
  // A PIN MUST FAIL: a literal one character off, or a member the authors never wrote, is not held
  assert.equal(heldBy(heap, ['[DEX] Unknown enemy spell table \'X']), false);
  assert.equal(heldBy(heap, ['The ', ' has recovered from its injuries.']), true);
  assert.equal(heldBy(heap, ['The ', ' has recovered from its injuries!']), false);
  assert.equal(names.has('SelectDungeonTable'), true);
  assert.equal(names.has('SelectDungeonTables'), false);
});

/** The bundle's text, byte for byte (tools/dexExtract.mjs writes each from its TextAsset and checks the tree
 *  against the bundle; these pin the bytes it wrote). */
const VERBATIM = {
  'CareerBase.cdb.csv': '02df73790037e80d5f79ef915b5ae7d97b747397e4ccd3bf1904a6a657d378b3',
  'ClassBase.mdb.csv': '6029a3d741ba0a46b17c5822e0bac744c7b200c52f3f89a243f8a7ba6e92aff9',
  'ClassicClassBase.mdb.csv': '6ca7c7a002ce19676cb553541605993a86767d79f43128e0d913f9b847be69a9',
  'ClassicMonsterReplacement.mdb.csv': '6ff710623d856d5ee54b0efe2b9580939cc2513ad3e651797991e56f96ffdb26',
  'DefaultTableReplacement.tdb.csv': '1fcd7e48540b6684064370cecf989009cefe51c676133614ec78c32e723617d7',
  'MonsterBase.mdb.csv': 'a481c2f0aa7016df0c0f606200aefdb3d1b27eab982684fd3ea7102feb3e6f7c',
  'SpellRecords.json': '8bdcf34029f72b8d07a8400849ab141a0dc5b9365d859ffd8ed125a605351274',
  'modsettings.json': '5c7001011eb41d2c0ab8d2f43ac80061beda4d8db5dbeaf1af4ba5fc3dcbe063',
  'Prefabs/1618_20.imported.json': '77a1af20e262041926bbedeeffe8567f09c009e1870ae70901bdd5f0d3cf3777',
};

test('DEX0 the tables are the bundle\'s, verbatim: their bytes, the rows and the columns the mod reads', () => {
  for (const [f, h] of Object.entries(VERBATIM)) assert.equal(sha(read(f)), h, `${f}: the bundle's bytes`);
  const rows = { 'MonsterBase.mdb.csv': 35, 'ClassBase.mdb.csv': 15, 'CareerBase.cdb.csv': 43, 'ClassicMonsterReplacement.mdb.csv': 16, 'ClassicClassBase.mdb.csv': 2, 'DefaultTableReplacement.tdb.csv': 39 };
  for (const [f, n] of Object.entries(rows)) assert.equal(readCsvTable(read(f).toString('utf8')).rows.length, n, f);
  const monsters = readCsvTable(read('MonsterBase.mdb.csv').toString('utf8'));
  assert.deepEqual(monsters.rows.map((r) => Number(r.tokens[0])), Array.from({ length: 35 }, (_, i) => 256 + i));
  const classes = readCsvTable(read('ClassBase.mdb.csv').toString('utf8'));
  assert.deepEqual(classes.rows.map((r) => Number(r.tokens[0])), Array.from({ length: 15 }, (_, i) => 384 + i));
  // the bundle's encounter tables, not the repository's at c187c97: the Rainforest's day row as the build shipped it
  const tables = readCsvTable(read('DefaultTableReplacement.tdb.csv').toString('utf8'));
  assert.deepEqual(tables.rows.find((r) => r.tokens[0] === 'DefaultRainforestDay').tokens.slice(1),
    ['27', '0', '4', '5', '6', '138', '13', '136', '283', '142', '16', '144', '145', '138', '143', '142', '141', '137', '134', '128', '129']);
  assert.equal(JSON.parse(read('SpellRecords.json')).map((s) => s.index).join(), '500,501,502,503');
  assert.deepEqual(JSON.parse(read('Prefabs/1618_20.imported.json')).Components[0], { ...JSON.parse(read('Prefabs/1618_20.imported.json')).Components[0], Archive: 1618, Record: 20, AshArchive: 1618, AshRecord: 21, RespawnTime: 10 });
});

test('DEX0 the text the game parses is the vendored files, byte for byte, in the manifest\'s order', () => {
  const manifest = JSON.parse(read('daggerfall-enemy-expansion.dfmod.json'));
  const tables = manifest.Files.map((f) => f.slice(f.lastIndexOf('/') + 1)).filter((n) => /\.(cdb|mdb|tdb)\.csv$/.test(n));
  assert.deepEqual(Object.keys(DEX_TABLE_TEXT), [...tables, 'SpellRecords.json', 'Prefabs/1618_20.imported.json']);
  for (const [f, text] of Object.entries(DEX_TABLE_TEXT)) assert.equal(Buffer.from(text, 'utf8').equals(read(f)), true, `${f}: the game's text is the vendored bytes`);
});

test('DEX1 the mod\'s own CSV reading, quirks and all (BestiaryMod.SplitCsvLine / ParseArrayArg / ParseBool)', () => {
  assert.deepEqual(splitCsvLine('256,Goblin,"{0,1,2,3,-1,3,4}",,TRUE'), ['256', 'Goblin', '{0,1,2,3,-1,3,4}', '', 'TRUE']);
  assert.deepEqual(splitCsvLine('a,'), ['a', '']);
  // the one quirk: an empty first cell is a zero-length match, added twice, and the scan resumes past the next comma
  assert.deepEqual(splitCsvLine(',a,b'), ['', '', 'b']);
  assert.deepEqual(splitCsvLine(',a'), ['', '']);
  assert.deepEqual(splitCsvLine('a,,b'), ['a', '', 'b']);
  assert.deepEqual(splitCsvLine('"x\\"y",z'), ['x"y', 'z']);
  assert.deepEqual(parseArrayArg('{ 0, 1, -1, 3 }'), [0, 1, -1, 3]);
  assert.deepEqual(parseArrayArg('7,10,29,44'), [7, 10, 29, 44]);
  assert.deepEqual(parseArrayArg('{0,,1}'), [0, -1, 1]);
  assert.throws(() => parseArrayArg('{0,1]'), /mismatched brackets/);
  assert.equal(parseBool('TRUE'), true);
  assert.equal(parseBool(''), false);
  assert.throws(() => parseBool('yes'), /invalid boolean/);
});

/** The listing a directory answers to, and the PNGs it holds. */
const listingOf = (file) => JSON.parse(read(file));
const pngsIn = (dir) => (existsSync(join(ROOT, dir)) ? readdirSync(join(ROOT, dir)).filter((f) => f.endsWith('.png')).sort() : []);

test('DEX0 the art: every shipped picture is in its listing by sha256 and every listing name is shipped, in the right directory', () => {
  for (const [file, dir] of [['daggerfall-enemy-expansion.files.json', 'public/art/daggerfall-enemy-expansion'], ['repainted.files.json', 'public/art/daggerfall-enemy-expansion-repainted']]) {
    const l = listingOf(file);
    assert.equal(l.BundleSha256, '6824c32daca8e9c5e9702b49b261aeaee01f7d66569ec7a86559ca4afe443959');
    assert.deepEqual(pngsIn(dir), l.Files, `${dir} holds exactly what ${file} names`);
    for (const f of l.Files) assert.equal(sha(readFileSync(join(ROOT, dir, f))), l.Sha256[f], `${dir}/${f}`);
  }
  const repainted = listingOf('repainted.files.json').Files.map((f) => Number(f.split('_')[0]));
  assert.deepEqual([...new Set(repainted)].sort((a, b) => a - b), [1504, 1509, 1511, 1512, 1530, 1531, 1532, 1533, 1609], 'the third exception\'s archives, no more');
  assert.equal(listingOf('daggerfall-enemy-expansion.files.json').Files.length + listingOf('repainted.files.json').Files.length, 5500);
  assert.equal(DEX_ART[399], undefined, 'the guard\'s 399: DFU never wears it (no 399_0-0, and TEXTURE.399 ends at record 19)');
});

test('DEX0 the pictures that ARE Daggerfall\'s records are specs naming the record and nothing else - no pixel of them is carried', () => {
  const derived = JSON.parse(read('derived.json'));
  assert.equal(Object.keys(derived).length, 858);
  const shipped = new Set([...listingOf('daggerfall-enemy-expansion.files.json').Files, ...listingOf('repainted.files.json').Files].map((f) => f.replace(/\.png$/, '')));
  for (const [name, spec] of Object.entries(derived)) {
    assert.deepEqual(Object.keys(spec), ['from'], `${name}: a record, whole - no edits, no size, no offset`);
    assert.ok(!shipped.has(name), `${name} is derived and shipped both`);
    const archive = Number(name.split('_')[0]);
    const want = { 1500: 492, 1501: 493, 1502: 494, 1503: 495, 1506: 491, 1610: 379 }[archive];
    assert.equal(spec.from[0], want, `${name} rebuilds from TEXTURE.${want}`);
  }
  // the wisp is TEXTURE.379's record 0 in each of its twenty records, albedo and emission alike
  assert.deepEqual(derived['1610_13-7'], { from: [379, 0, 7] });
  assert.deepEqual(derived['1610_13-7_Emission'], { from: [379, 0, 7] });
});

test('DEX0 the generated index counts exactly the frames the three places hold, and says where each archive\'s come from', () => {
  const derived = Object.keys(JSON.parse(read('derived.json')));
  const names = [...derived, ...[...listingOf('daggerfall-enemy-expansion.files.json').Files, ...listingOf('repainted.files.json').Files].map((f) => f.replace(/\.png$/, ''))];
  const frames = {}, emissive = {};
  for (const n of names) {
    const [, a, r, f, map] = /^(\d+)_(\d+)-(\d+)(?:_(\w+))?$/.exec(n);
    if (map === 'Emission') ((emissive[a] ??= new Set()).add(Number(r)));
    else (frames[a] ??= [])[Number(r)] = Math.max(frames[a][Number(r)] ?? 0, Number(f) + 1);
  }
  assert.deepEqual(Object.keys(DEX_ART).map(Number).sort((a, b) => a - b), Object.keys(frames).map(Number).sort((a, b) => a - b));
  for (const [a, e] of Object.entries(DEX_ART)) {
    assert.deepEqual(e.frames, Array.from(frames[a], (n) => n ?? 0), `${a}'s frames`);
    assert.deepEqual(e.emissive ?? [], [...(emissive[a] ?? [])].sort((x, y) => x - y), `${a}'s emission maps`);
  }
  assert.equal(DEX_ART[1610].from, 'derived');
  assert.equal(DEX_ART[1500].from, 'own', 'the riders\' corpse (1500_20-0) is the authors\' own; the rest of the set is derived');
  assert.equal(DEX_ART[1609].from, 'repainted');
  assert.equal(DEX_ART[1618].from, 'own');
  assert.deepEqual(DEX_ART[1611].scale[1], [0.8, 0.8], 'the Medusa\'s scale, out of 1611_1-0.xml');
  assert.equal(DEX_ART[1610].emission, true, '1610.xml: <emission>True</emission>');
  assert.equal(DEX_ART[1614].emission, true, '1614.xml');
});

test('DEX0 the mod\'s switch and its one key, as modsettings.json ships it', () => {
  const shipped = JSON.parse(read('modsettings.json'));
  const key = shipped.Sections[0].Keys[0];
  const ours = MOD_SETTINGS['daggerfall-enemy-expansion'];
  assert.equal(ours.author, JSON.parse(read('daggerfall-enemy-expansion.dfmod.json')).ModAuthor);
  assert.deepEqual(Object.keys(ours.keys), ['Enabled', `${shipped.Sections[0].Name}.${key.Name}`]);
  assert.equal(ours.keys.Enabled.default, true);
  assert.equal(ours.keys['Cheat.DisableTrollRespawn'].default, key.Value);
  assert.equal(ours.keys['Cheat.DisableTrollRespawn'].description, key.Description);
});
