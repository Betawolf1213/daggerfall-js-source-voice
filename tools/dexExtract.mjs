#!/usr/bin/env node
// DEX0 (2026-10-19, Mac: "I want to implement this as our next mod 1:1") - DAGGERFALL ENEMY EXPANSION 1.3.4 (Kamer &
// Kab), EVERY VENDORED FILE, OUT OF THE SHIPPED BUNDLE AND THE PLAYER'S OWN ARENA2.
//
//   node tools/dexExtract.mjs <arena2> "<path to>/daggerfall enemy expansion.dfmod" [--write]
//
// Without --write it checks: everything below is computed and compared, byte for byte, with what the tree carries,
// and a difference is an error. With --write it writes. What it writes, and why each is what it is:
//
// - vendor/daggerfall-enemy-expansion/: the bundle's own text, verbatim - the manifest, modsettings.json, the five
//   tables, SpellRecords.json, the troll corpse prefab's imported components, the 1,130 xml files (as one
//   `Textures/xml.json`, name -> text) - and the compiled assembly, byte for byte (the C# beside it is the authors'
//   repository at the commit the README names; test/systems/dex0_record.test.js proves the two agree).
// - The pictures. Every texture of every archive the mod's own tables draw (MaleTexture, FemaleTexture, a corpse
//   archive, ClassicClassBase's and ClassicMonsterReplacement's swaps, the troll corpse prefab's two records) is
//   measured against every record of every TEXTURE file (DS1's search, tools/detailedShipsAssets.mjs) and goes to
//   exactly one of three places:
//     DERIVED - a picture a classic record covers (DERIVED_SHARE of its visible pixels or more): rebuilt from the
//       player's own record when the archive loads, never shipped (formats/derivedTexture.js), as a spec in
//       vendor/daggerfall-enemy-expansion/derived.json. The five horse-rider sets (1500-1503, 1506 - Daggerfall's
//       unused riders, TEXTURE.491-495) and the Will-o'-wisp's albedo and emission (TEXTURE.379) are these.
//     REPAINTED - an archive in REPAINTED_ARCHIVES: Daggerfall's own sprites under the authors' paint, carried byte
//       for byte under public/art/daggerfall-enemy-expansion-repainted/ on Port-Doctrine's third exception (Mac,
//       2026-10-19). A picture there a classic record covers exactly is still DERIVED - an exception for repaints
//       is no licence to ship the record itself.
//     OWN - everything else: the authors' own renders, re-encoded as indexed PNG where the picture fits one (RGBA
//       where not) under public/art/daggerfall-enemy-expansion/, each read back against its texel.
//   Each directory answers to its own listing (`*.files.json`: every name and its sha256 - the authority
//   test/tooling/doctrine.test.js reads for what may stand there), and src/systems/enemyExpansion/dexArt.js is
//   generated beside them: per archive, where its pictures come from, how many frames each record has, which carry an
//   emission map, and the xml scale of each record.
// - src/systems/enemyExpansion/dexTableText.js: the bundle's tables, spell records and corpse prefab as TEXT, verbatim,
//   in the manifest's order (BestiaryMod.GetDBAssets walks its Files) - what the game runs the mod's own parser over
//   (systems/enemyExpansion/dexTables.js), each string the vendored file's bytes exactly (the DEX0 suite holds them so).
// - The archives no table draws (1633 Gryphon, 1641 Frost Giant, 1642-1644 the Centaurs, 1645 Shark, 1706 Clannfear -
//   pictures for add-ons; three of them are Daggerfall's centaur repainted) are not carried, and the tool says so.
// - NOR ARE A CLASSIC ARCHIVE'S PICTURES THAT DFU NEVER DRAWS. A mobile wears a mod's pictures only when its archive's
//   record 0, frame 0 has one (TextureReplacement.GetMobileBillboardMaterial: `LoadFromCacheOrImport(archive, 0, 0)`
//   decides HasImportedTextures), and an archive with a TEXTURE file then imports only that file's records. The bundle
//   carries the city guard's 399 at records 20-24 alone - TEXTURE.399 has twenty records, 0-19, and no 399_0-0 - so DFU
//   draws none of the twenty; they are not carried either (`drawnClassic`).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { readUnityBundle } from '../src/formats/unity/unityBundle.js';
import { DFPalette } from '../src/formats/dfPalette.js';
import { composeDerivedPicture, deriveSpec } from '../src/formats/derivedTexture.js';
import { readCsvTable, parseCsInt } from '../src/systems/enemyExpansion/dexCsv.js';
import { readPng } from './pngIO.mjs';
import { encodeSprite, sameOnScreen } from './diverseWeaponsExtract.mjs';
import { classicRecords, findClassicSource } from './detailedShipsAssets.mjs';
import { isMain } from './lib/isMain.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const DEX_GUID = '76557441-7025-402e-a145-e3e1a28a093d';
export const VENDOR_DIR = 'vendor/daggerfall-enemy-expansion';
export const OWN_DIR = 'public/art/daggerfall-enemy-expansion';
export const REPAINT_DIR = 'public/art/daggerfall-enemy-expansion-repainted';
export const ART_INDEX = 'src/systems/enemyExpansion/dexArt.js';
export const TABLE_TEXT = 'src/systems/enemyExpansion/dexTableText.js';
/** The archives Port-Doctrine's third exception carries (Mac, 2026-10-19): the Bounty Hunter (1504, from TEXTURE.482), the Druid and the Necromancer Acolyte (1509, 1511, from 486), the Rogue Druid
 *  (1512, from 490), the four new riders (1530-1533, from 491 and 495) and King Lysandus (1609, from 473) - measured
 *  silhouette for silhouette against the player's own sprites before the exception was asked for. */
export const REPAINTED_ARCHIVES = Object.freeze([1504, 1509, 1511, 1512, 1530, 1531, 1532, 1533, 1609]);

/** An archive whose pictures a mobile wears in DFU: a mod's own archive (no TEXTURE file - its records import from 0 up),
 *  or a classic one whose record 0, frame 0 the bundle replaces (GetMobileBillboardMaterial's gate). */
export function drawnClassic(archive, names, arena2) {
  const classic = existsSync(join(arena2, `TEXTURE.${String(archive).padStart(3, '0')}`));
  return !classic || names.has(`${archive}_0-0`);
}

/** The bundle's text assets the vendor directory carries verbatim, by the name the manifest gives each. */
export const VERBATIM_TEXT = Object.freeze({
  'DaggerfallBestiaryProject.dfmod': 'daggerfall-enemy-expansion.dfmod.json',
  modsettings: 'modsettings.json',
  'MonsterBase.mdb': 'MonsterBase.mdb.csv',
  'ClassBase.mdb': 'ClassBase.mdb.csv',
  'CareerBase.cdb': 'CareerBase.cdb.csv',
  'ClassicMonsterReplacement.mdb': 'ClassicMonsterReplacement.mdb.csv',
  'ClassicClassBase.mdb': 'ClassicClassBase.mdb.csv',
  'DefaultTableReplacement.tdb': 'DefaultTableReplacement.tdb.csv',
  SpellRecords: 'SpellRecords.json',
  '1618_20.imported': 'Prefabs/1618_20.imported.json',
  'Daggerfall Enemy Expansion.dll': 'Daggerfall Enemy Expansion.dll',
});

const sha = (b) => createHash('sha256').update(b).digest('hex');
const NAME = /^(\d+)_(\d+)-(\d+)(?:_([A-Za-z]+))?$/;

/** Every archive the mod's own data draws a picture from: the tables' texture and corpse columns and the troll
 *  corpse prefab's Archive / AshArchive (BestiaryTrollCorpseBillboard). */
export function archivesDrawn(text) {
  const out = new Set();
  for (const name of ['MonsterBase.mdb', 'ClassBase.mdb', 'ClassicMonsterReplacement.mdb', 'ClassicClassBase.mdb']) {
    const t = readCsvTable(text(name));
    for (const col of ['MaleTexture', 'FemaleTexture', 'CorpseTextureArchive', 'FemaleCorpseTextureArchive']) {
      const c = t.column(col);
      if (c == null) continue;
      for (const r of t.rows) if (r.tokens[c]) out.add(parseCsInt(r.tokens[c]));
    }
  }
  const prefab = JSON.parse(text('1618_20.imported'));
  for (const c of prefab.Components) for (const k of ['Archive', 'AshArchive']) if (Number.isInteger(c[k])) out.add(c[k]);
  return out;
}

/** The archive-level and per-record xml the bundle carries: `<scaleX>`/`<scaleY>` per record (frame 0's file is the
 *  record's, TextureReplacement.TryGetXml) and `<emission>` per archive (the `1610.xml`, `1614.xml`). */
export function readXml(xmlByName) {
  const scale = {}, emission = {};
  for (const [name, text] of Object.entries(xmlByName)) {
    const sx = /<scaleX>\s*([-\d.]+)\s*<\/scaleX>/.exec(text), sy = /<scaleY>\s*([-\d.]+)\s*<\/scaleY>/.exec(text);
    const em = /<emission>\s*(\w+)\s*<\/emission>/i.exec(text);
    const m = /^(\d+)_(\d+)-(\d+)$/.exec(name), a = /^(\d+)$/.exec(name);
    if (m && (sx || sy)) ((scale[m[1]] ??= {})[m[2]] = [sx ? Number(sx[1]) : 1, sy ? Number(sy[1]) : 1]);
    if (a && em) emission[a[1]] = em[1].toLowerCase() === 'true';
  }
  return { scale, emission };
}

const listing = (title, version, author, bundleSha, note, files) => `${JSON.stringify({
  ModTitle: title, ModVersion: version, ModAuthor: author,
  Source: 'https://www.nexusmods.com/daggerfallunity/mods/372',
  Bundle: 'Mods/daggerfall enemy expansion.dfmod', BundleSha256: bundleSha, Note: note,
  Files: Object.keys(files).sort(), Sha256: Object.fromEntries(Object.entries(files).sort(([a], [b]) => (a < b ? -1 : 1))),
}, null, 2)}\n`;

/** The vendored text files the game parses, in the manifest's order - GetDBAssets(extension) yields them so. */
export function tableFilesInManifestOrder(manifest) {
  const wanted = new Set(['.cdb.csv', '.mdb.csv', '.tdb.csv']);
  const tables = manifest.Files.map((f) => f.slice(f.lastIndexOf('/') + 1)).filter((n) => [...wanted].some((x) => n.endsWith(x)));
  return [...tables, 'SpellRecords.json', 'Prefabs/1618_20.imported.json'];
}

export function renderTableText(entries, version) {
  const rows = entries.map(([name, text]) => `  ${JSON.stringify(name)}: ${JSON.stringify(text)},`);
  return `// GENERATED by tools/dexExtract.mjs from the shipped bundle (Daggerfall Enemy Expansion ${version}) - do not edit.
// The mod's tables, its spell records and its troll corpse prefab as TEXT, each the bytes of the vendored file of the
// same name under vendor/daggerfall-enemy-expansion/ exactly, in the manifest's order (BestiaryMod.GetDBAssets walks
// its Files): what systems/enemyExpansion/dexTables.js reads with the mod's own CSV helpers, as the mod reads them.
export const DEX_TABLE_TEXT = Object.freeze({
${rows.join('\n')}
});
`;
}

export function renderArtIndex(index, version) {
  const rows = Object.keys(index).map(Number).sort((a, b) => a - b).map((a) => `  ${a}: ${JSON.stringify(index[a])},`);
  return `// GENERATED by tools/dexExtract.mjs from the shipped bundle (Daggerfall Enemy Expansion ${version}) and the player's
// own ARENA2 - do not edit. Per archive the mod's tables draw: where its pictures come from (\`own\` - the authors'
// renders under ${OWN_DIR}/; \`repainted\` - Port-Doctrine's third exception, under ${REPAINT_DIR}/;
// \`derived\` - rebuilt from the player's own records, vendor/daggerfall-enemy-expansion/derived.json), each record's
// frame count (\`frames\`, by record), the records carrying an emission map (\`emissive\`), the archive's own xml
// emission flag (\`emission\`) and each record's xml scale (\`scale\`: record -> [x, y]). A picture derived.json names
// is rebuilt whatever its archive's \`from\` says (a set of the authors' with one record's picture in it).
export const DEX_ART = Object.freeze({
${rows.join('\n')}
});
`;
}

/** Everything the tool would write, as { relative path: bytes | string }, and a report. */
export function dexAssets(arena2, bundleBytes) {
  const bundle = readUnityBundle(bundleBytes);
  const textByName = new Map(bundle.textAssets.map((t) => [t.name, t]));
  const text = (name) => { const t = textByName.get(name); if (!t) throw new Error(`the bundle carries no ${name}`); return t.text; };
  const manifest = JSON.parse(text('DaggerfallBestiaryProject.dfmod'));
  if (manifest.GUID !== DEX_GUID) throw new Error(`the bundle is ${manifest.ModTitle} (${manifest.GUID}), not Daggerfall Enemy Expansion`);
  const out = {};
  for (const [name, path] of Object.entries(VERBATIM_TEXT)) out[`${VENDOR_DIR}/${path}`] = textByName.get(name).bytes;
  const xmlByName = {};
  for (const t of bundle.textAssets) if (/^\d+(_\d+-\d+)?$/.test(t.name) && /<info>/.test(t.text)) xmlByName[t.name] = t.text;
  out[`${VENDOR_DIR}/Textures/xml.json`] = `${JSON.stringify(Object.fromEntries(Object.entries(xmlByName).sort(([a], [b]) => (a < b ? -1 : 1))), null, 1)}\n`;
  const { scale, emission } = readXml(xmlByName);

  const drawn = archivesDrawn(text);
  const textures = bundle.textures.filter((t) => NAME.test(t.name));
  const names = new Set(textures.map((t) => t.name));
  const wears = (a) => drawn.has(a) && drawnClassic(a, names, arena2);
  const carried = textures.filter((t) => wears(Number(NAME.exec(t.name)[1])));
  const notCarried = [...new Set(textures.filter((t) => !wears(Number(NAME.exec(t.name)[1]))).map((t) => Number(NAME.exec(t.name)[1])))].sort((a, b) => a - b);

  const palette = new DFPalette();
  palette.load(new Uint8Array(readFileSync(join(arena2, 'ART_PAL.COL'))), 'ART_PAL.COL');
  const records = [...classicRecords(arena2, palette)];
  // exact copies first, by a key of the visible pixels (a clear pixel is clear whatever colour Unity bled under it)
  const keyOf = (p) => { const d = Buffer.alloc(p.data.length); for (let i = 0; i < p.data.length; i += 4) if (p.data[i + 3] !== 0) { d[i] = p.data[i]; d[i + 1] = p.data[i + 1]; d[i + 2] = p.data[i + 2]; d[i + 3] = 255; } return `${p.width}x${p.height}:${sha(d)}`; };
  const exact = new Map();
  for (const r of records) { const k = keyOf(r.rgba); if (!exact.has(k)) exact.set(k, r); }
  const bySize = new Map();
  for (const r of records) for (const dw of [-1, 0, 1]) for (const dh of [-1, 0, 1]) { const k = `${r.rgba.width + dw}x${r.rgba.height + dh}`; (bySize.get(k) ?? bySize.set(k, []).get(k)).push(r); }

  const derived = {}, own = {}, repainted = {}, index = {};
  const shipped = { own: 0, repainted: 0, indexed: 0, bytes: 0 };
  for (const t of carried) {
    const [, a, r, f, map] = NAME.exec(t.name);
    const archive = Number(a), record = Number(r), frame = Number(f);
    const pic = t.rgba();
    // a repaint ships as the authors painted it (the exception's word: byte for byte) unless it IS a record, exactly
    const repaint = REPAINTED_ARCHIVES.includes(archive);
    const hit = exact.get(keyOf(pic)) ?? (repaint ? null : findClassicSource(pic, bySize.get(`${pic.width}x${pic.height}`) ?? []));
    const entry = (index[archive] ??= { from: null, frames: [], emissive: [], ...(scale[archive] ? { scale: scale[archive] } : {}), ...(emission[archive] ? { emission: true } : {}) });
    if (!map) entry.frames[record] = Math.max(entry.frames[record] ?? 0, frame + 1);
    else if (map === 'Emission' && !entry.emissive.includes(record)) entry.emissive.push(record);
    if (hit) {
      const spec = deriveSpec([hit.archive, hit.record, hit.frame], pic, hit.rgba, hit.at ?? [0, 0]);
      if (!sameOnScreen(composeDerivedPicture(spec, hit.rgba), pic)) throw new Error(`${t.name}: the rebuild from ${hit.archive}_${hit.record}-${hit.frame} differs from the texel`);
      derived[t.name] = spec;
      entry.derived = (entry.derived ?? 0) + 1;
      continue;
    }
    const { png, indexed } = encodeSprite(pic);
    if (!sameOnScreen(pic, readPng(png))) throw new Error(`${t.name}: the PNG read back differs from the texel`);
    (repaint ? repainted : own)[`${t.name}.png`] = sha(png);
    out[`${repaint ? REPAINT_DIR : OWN_DIR}/${t.name}.png`] = png;
    shipped[repaint ? 'repainted' : 'own']++; shipped.indexed += indexed ? 1 : 0; shipped.bytes += png.length;
  }
  for (const [a, e] of Object.entries(index)) {
    const total = textures.filter((t) => Number(NAME.exec(t.name)[1]) === Number(a)).length;
    e.from = e.derived === total ? 'derived' : REPAINTED_ARCHIVES.includes(Number(a)) ? 'repainted' : 'own';
    delete e.derived;
    for (let i = 0; i < e.frames.length; i++) e.frames[i] ??= 0;
    e.emissive.sort((x, y) => x - y);
    if (!e.emissive.length) delete e.emissive;
  }
  const bundleSha = sha(bundleBytes);
  const v = manifest.ModVersion, who = manifest.ModAuthor;
  out[`${VENDOR_DIR}/derived.json`] = `{\n${Object.entries(derived).sort(([x], [y]) => (x < y ? -1 : 1)).map(([k, s]) => `${JSON.stringify(k)}: ${JSON.stringify(s)}`).join(',\n')}\n}\n`;   // one picture a line
  out[`${VENDOR_DIR}/daggerfall-enemy-expansion.files.json`] = listing(manifest.ModTitle, v, who, bundleSha,
    `Generated by tools/dexExtract.mjs from the shipped bundle - not written by hand. Every file under ${OWN_DIR}/: the authors' own enemy sprites (and their emission maps) for every archive the mod's tables draw, re-encoded as indexed PNG where the picture fits one, each read back against its texel. A picture any classic record covers is not here (derived.json rebuilds it from the player's own ARENA2) and neither is a repaint (repainted.files.json). The authority test/tooling/doctrine.test.js reads for what may stand in that directory.`, own);
  out[`${VENDOR_DIR}/repainted.files.json`] = listing(manifest.ModTitle, v, who, bundleSha,
    `Generated by tools/dexExtract.mjs from the shipped bundle - not written by hand. Every file under ${REPAINT_DIR}/: the archives Port-Doctrine's third exception carries (Mac, 2026-10-19) - ${REPAINTED_ARCHIVES.join(', ')} - Daggerfall's own sprites under the authors' paint, re-encoded losslessly. The authority test/tooling/doctrine.test.js reads for what may stand in that directory.`, repainted);
  out[ART_INDEX] = renderArtIndex(index, v);
  const decode = (b) => new TextDecoder('utf-8').decode(b);
  out[TABLE_TEXT] = renderTableText(tableFilesInManifestOrder(manifest).map((f) => [f, decode(out[`${VENDOR_DIR}/${f}`])]), v);
  return { out, report: { carried: carried.length, derived: Object.keys(derived).length, ...shipped, notCarried, archives: Object.keys(index).length } };
}

if (isMain(import.meta.url)) {
  const [arena2, src] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const write = process.argv.includes('--write');
  if (!arena2 || !src) { console.error('usage: node tools/dexExtract.mjs <arena2> "<daggerfall enemy expansion.dfmod>" [--write]'); process.exit(2); }
  const t0 = Date.now();
  const { out, report } = dexAssets(arena2, new Uint8Array(readFileSync(src)));
  console.log(`${report.carried} pictures of ${report.archives} archives: ${report.derived} derived from the player's records, ${report.own} own and ${report.repainted} repainted shipped (${report.indexed} indexed), ${(report.bytes / 1e6).toFixed(1)} MB; not carried (no table draws them, or DFU never wears them): ${report.notCarried.join(', ')}; ${Date.now() - t0} ms`);
  const wanted = new Set(Object.keys(out));
  if (write) {
    for (const dir of [OWN_DIR, REPAINT_DIR]) {
      mkdirSync(join(ROOT, dir), { recursive: true });
      for (const f of readdirSync(join(ROOT, dir))) if (!wanted.has(`${dir}/${f}`)) unlinkSync(join(ROOT, dir, f));   // a clean set
    }
    for (const [p, b] of Object.entries(out)) { mkdirSync(dirname(join(ROOT, p)), { recursive: true }); writeFileSync(join(ROOT, p), b); }
    console.log(`wrote ${wanted.size} files`);
  } else {
    const bad = Object.entries(out).filter(([p, b]) => !existsSync(join(ROOT, p)) || Buffer.compare(readFileSync(join(ROOT, p)), Buffer.from(b)) !== 0).map(([p]) => p);
    for (const dir of [OWN_DIR, REPAINT_DIR]) if (existsSync(join(ROOT, dir))) for (const f of readdirSync(join(ROOT, dir))) if (!wanted.has(`${dir}/${f}`)) bad.push(`${dir}/${f} (a stranger)`);
    if (bad.length) { console.error(`${bad.length} files differ from what the bundle makes:\n${bad.slice(0, 20).join('\n')}`); process.exit(1); }
    console.log('the tree is what the bundle makes');
  }
}
