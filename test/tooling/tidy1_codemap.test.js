import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { planMove, rewriteSpecifiers, rewritePaths, rewriteRecords, rewriteQuotedImports, specifierChanges, blindSpots, brokenBy, relayHits, composeLedger, unresolvedIn, LEDGER, TEXT_EXT } from '../../tools/moveModule.mjs';

// TIDY1 (2026-10-16, bible/01-Overview/Code-Map.md): THE MAP OF WHERE THINGS LIVE, AND THE TOOL THAT MOVES THEM.
// The map is held to the tree both ways - a directory of code nobody wrote a row for fails, and so does a row for a
// directory that is gone. The tool's rewrites are pinned form by form, because a form it misses is an address left
// pointing at nothing.

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const rd = (p) => readFileSync(join(root, p), 'utf8');

/** Every directory under src/ that holds a .js file - src/assets/ is art, and is mapped as one row. */
function codeDirs(dir = 'src', out = []) {
  const ents = readdirSync(join(root, dir), { withFileTypes: true });
  if (ents.some((e) => e.isFile() && e.name.endsWith('.js'))) out.push(dir);
  for (const e of ents) if (e.isDirectory() && `${dir}/${e.name}` !== 'src/assets') codeDirs(`${dir}/${e.name}`, out);
  return out;
}

test('TIDY1: every directory of code is on the map, and the map names none that is gone', () => {
  const doc = rd('bible/01-Overview/Code-Map.md');
  const rows = [...doc.matchAll(/^\| `(src\/[^`]*?)\/?` \|/gm)].map((m) => m[1]);
  const mapped = new Set(rows.map((r) => r.replace(/\/$/, '')));
  const missing = codeDirs().filter((d) => !mapped.has(d));
  assert.deepEqual(missing, [], 'a directory of code with no row on the Code Map - add its row (Code-Map.md, "Where a new file goes" 4)');
  const gone = [...mapped].filter((d) => !existsSync(join(root, d)));
  assert.deepEqual(gone, [], 'the Code Map has a row for a directory that is gone');
  assert.ok(mapped.has('src/systems/comeSailAway'), 'the pilot\'s folder has its row');
  assert.match(rd('bible/Home.md'), /01-Overview\/Code-Map\.md/, 'Home.md\'s Repo layout points at the map');
});

test('TIDY1: the move tool rewrites every address of a moved file', () => {
  const moved = new Map([['src/systems/arenaBout.js', 'src/systems/arena/arenaBout.js'], ['src/systems/arenaText.js', 'src/systems/arena/arenaText.js']]);
  // an importer that stays: the four specifier forms, a query's tail, and a neighbour that did not move
  const importer = [
    "import { a } from '../systems/arenaBout.js';",
    "export * from '../systems/arenaBout.js';",
    "import '../systems/arenaBout.js';",
    "const m = await import('../systems/arenaBout.js');",
    "const u = new URL('../systems/arenaBout.js', import.meta.url);",
    "import raw from '../systems/arenaBout.js?raw';",
    "import { b } from '../systems/arenaBook.js';",
  ].join('\n');
  assert.equal(rewriteSpecifiers(importer, 'src/net/arenaLink.js', 'src/net/arenaLink.js', moved).text, [
    "import { a } from '../systems/arena/arenaBout.js';",
    "export * from '../systems/arena/arenaBout.js';",
    "import '../systems/arena/arenaBout.js';",
    "const m = await import('../systems/arena/arenaBout.js');",
    "const u = new URL('../systems/arena/arenaBout.js', import.meta.url);",
    "import raw from '../systems/arena/arenaBout.js?raw';",
    "import { b } from '../systems/arenaBook.js';",
  ].join('\n'));
  // the moved file itself: its specifiers re-based, a moved sibling kept beside it, a page's URL left alone
  const self = [
    "import { audio } from './audio.js';",
    "import { T } from './arenaText.js';",
    "const p = fetch('./sfx/crowd.ogg');",
    "const i = new URL('./art/x.png', document.baseURI);",
    "const s = (name) => new URL(`../../vendor/csa/Sounds/${name}.ogg`, import.meta.url).href;",
  ].join('\n');
  assert.equal(rewriteSpecifiers(self, 'src/systems/arenaBout.js', 'src/systems/arena/arenaBout.js', moved).text, [
    "import { audio } from '../audio.js';",
    "import { T } from './arenaText.js';",
    "const p = fetch('./sfx/crowd.ogg');",
    "const i = new URL('./art/x.png', document.baseURI);",
    "const s = (name) => new URL(`../../../vendor/csa/Sounds/${name}.ogg`, import.meta.url).href;",   // a template's file is chosen at run time, its folder is not
  ].join('\n'));
  // the paths: a pin's, a test's URL, a page's root path, the bible's src path and cite - and what only looks like them
  const prose = [
    "rd('src/systems/arenaBout.js')",
    "new URL('../src/systems/arenaBout.js', import.meta.url)",
    '<script type="module" src="/src/systems/arenaBout.js">',
    '`systems/arenaBout.js:' + '"export function newBout"`',   // a cite's path form, split so the cite scanner reads no anchor here
    '"file": "src/systems/arenaText.js"',
    "assert.ok(!from.includes('../systems/arenaBout.js'))",
    'server/src/systems/arenaBout.js',
    'src/systems/arenaBout.json',
    'xsystems/arenaBout.js',
  ].join('\n');
  const out = rewritePaths(prose, moved);
  assert.equal(out.text, [
    "rd('src/systems/arena/arenaBout.js')",
    "new URL('../src/systems/arena/arenaBout.js', import.meta.url)",
    '<script type="module" src="/src/systems/arena/arenaBout.js">',
    '`systems/arena/arenaBout.js:' + '"export function newBout"`',
    '"file": "src/systems/arena/arenaText.js"',
    "assert.ok(!from.includes('../systems/arena/arenaBout.js'))",
    'server/src/systems/arenaBout.js',
    'src/systems/arenaBout.json',
    'xsystems/arenaBout.js',
  ].join('\n'));
  assert.equal(out.n, 6, 'a pin quoting another file\'s import is rewritten too - or its negative pin would pass on nothing');
  assert.equal(rewritePaths(out.text, moved).n, 0, 'a second pass finds nothing: the rewrite is its own fixed point');
  // escaped for a pattern: the root path, the src path, and a specifier a pin quotes
  const pat = String.raw`/src\/systems\/arenaBout\.js/ /systems\/arenaBout\.js/ /from '\.\.\/systems\/arenaBout\.js'/ /xsystems\/arenaBout\.js/`;
  assert.equal(rewritePaths(pat, moved).text,
    String.raw`/src\/systems\/arena\/arenaBout\.js/ /systems\/arena\/arenaBout\.js/ /from '\.\.\/systems\/arena\/arenaBout\.js'/ /xsystems\/arenaBout\.js/`);
  // the bible's own spelling of a page, plain and escaped
  const page = new Map([['bible/01-Overview/Field-Bugs-2026-10-14.md', 'bible/01-Overview/records/Field-Bugs-2026-10-14.md']]);
  assert.equal(rewritePaths(String.raw`\`01-Overview/Field-Bugs-2026-10-14.md\` rd('bible/01-Overview/Field-Bugs-2026-10-14.md') /01-Overview\/Field-Bugs-2026-10-14\.md/`, page).text,
    String.raw`\`01-Overview/records/Field-Bugs-2026-10-14.md\` rd('bible/01-Overview/records/Field-Bugs-2026-10-14.md') /01-Overview\/records\/Field-Bugs-2026-10-14\.md/`);
  // the whole plan: the moved file is written at its new path, a migration is a record and is left as it stands
  const texts = new Map([
    ['src/systems/arenaBout.js', "import { audio } from './audio.js';\n"],
    ['src/net/arenaLink.js', "import { a } from '../systems/arenaBout.js';\n"],
    ['server-account/migrations/0074_arena.sql', '-- src/systems/arenaBout.js\n'],
  ]);
  const plan = planMove([...moved].slice(0, 1), texts);
  assert.deepEqual([...plan.writes.keys()].sort(), ['src/net/arenaLink.js', 'src/systems/arena/arenaBout.js']);
  assert.equal(plan.writes.get('src/systems/arena/arenaBout.js'), "import { audio } from '../audio.js';\n");
  // what the move broke is what named a file before and names none after - not what never named one
  const was = (p) => ['src/systems/arenaBout.js', 'src/systems/audio.js'].includes(p), now = (p) => ['src/systems/arena/arenaBout.js', 'src/systems/audio.js'].includes(p);
  assert.deepEqual(brokenBy("import { audio } from './audio.js';", 'src/systems/arenaBout.js', "import { audio } from './audio.js';", 'src/systems/arena/arenaBout.js', was, now),
    ['src/systems/arena/arenaBout.js: ./audio.js'], 'a moved file\'s import left un-based is broken');
  assert.deepEqual(brokenBy("await import('./src/systems/arenaBout.js');", 'test/x.test.js', "await import('./src/systems/arena/arenaBout.js');", 'test/x.test.js', was, now),
    [], 'a root-relative import run through node -e named nothing from test/ before either');
  const dirs = (p) => ['vendor/csa', 'src/systems/arena'].includes(p);
  const tpl = (at) => `new URL(\`${at}/csa/\${name}.ogg\`, import.meta.url)`;
  assert.deepEqual(brokenBy(tpl('../../vendor'), 'src/systems/arenaBout.js', tpl('../../vendor'), 'src/systems/arena/arenaBout.js', dirs, dirs),
    ['src/systems/arena/arenaBout.js: ../../vendor/csa/${name}.ogg'], 'a template whose folder is gone after the move is broken');
});

test('TIDY1: the move tool rewrites a mutant record\'s source as if it stood in the record\'s file', () => {
  const moved = new Map([['src/systems/arenaBout.js', 'src/systems/arena/arenaBout.js']]);
  const list = JSON.stringify([
    { name: 'a', file: 'src/ui/arenaHud.js', old: "import { b } from '../systems/arenaBout.js';", new: "import { b } from '../systems/arenaBout.js'; b();", tests: [] },
    { name: 'b', file: 'src/systems/arenaBout.js', old: "import { audio } from './audio.js';", new: '', tests: [] },
  ], null, 2);
  const r = rewriteRecords(list, moved, 'tools/mutants/x.json');
  assert.deepEqual(JSON.parse(r.text).map((x) => x.old), ["import { b } from '../systems/arena/arenaBout.js';", "import { audio } from '../audio.js';"]);
  assert.equal(JSON.parse(r.text)[0].new, "import { b } from '../systems/arena/arenaBout.js'; b();");
  assert.deepEqual(r.blind, []);
  // one quoted source two records need two ways is named, never guessed
  const twice = JSON.stringify([
    { name: 'a', file: 'src/ui/arenaHud.js', old: "from '../systems/arenaBout.js'", new: '', tests: [] },
    { name: 'b', file: 'src/ui/sub/deeper.js', old: "from '../systems/arenaBout.js'", new: '', tests: [] },
  ]);
  const t = rewriteRecords(twice, moved, 'tools/mutants/y.json');
  assert.equal(t.text, twice);
  assert.equal(t.blind.length, 1);
});

test('TIDY2: a pin quoting an import follows it where the move re-based it - read before the path pass, never against a file that kept it', () => {
  // the importer and its target both move: the pin's quote is found in its OLD spelling, before any path in it is rewritten
  const moves = [['src/ui/a.js', 'src/ui/q/a.js'], ['src/systems/x.js', 'src/systems/k/x.js']];
  const texts = new Map([
    ['src/ui/a.js', "import { x } from '../systems/x.js';\n"],
    ['src/systems/x.js', 'export const x = 1;\n'],
    ['test/a.test.js', String.raw`assert.match(rd('src/ui/a.js'), /from '\.\.\/systems\/x\.js'/); assert.ok(rd('src/ui/a.js').includes("from '../systems/x.js'"));`],
  ]);
  assert.equal(planMove(moves, texts).writes.get('test/a.test.js'),
    String.raw`assert.match(rd('src/ui/q/a.js'), /from '\.\.\/\.\.\/systems\/k\/x\.js'/); assert.ok(rd('src/ui/q/a.js').includes("from '../../systems/k/x.js'"));`);
  // a file the pin also names still spells it the old way: which file the pin reads is not known - named, not guessed
  const changes = new Map([
    ['src/ui/a.js', specifierChanges("from '../systems/x.js'", "from '../../systems/x.js'")],
    ['src/ui/b.js', new Map([['../systems/x.js', '../systems/x.js']])],
  ]);
  const both = "for (const f of ['src/ui/a.js', 'src/ui/b.js']) assert.match(rd(f), /from '\\.\\.\\/systems\\/x\\.js'/);";
  const r = rewriteQuotedImports(both, changes, 'test/b.test.js');
  assert.equal(r.text, both);
  assert.equal(r.blind.length, 1);
});

test('TIDY5: a file moved a folder deeper keeps every root it had - a folder, a require, a concatenated root, its own folder', () => {
  const moves = [['test/x.test.js', 'test/net/x.test.js'], ['test/y.test.js', 'test/net/y.test.js']];
  const x = [
    "import { join, dirname } from 'node:path';",
    "import { a } from '../src/net/wire.js';",
    "const root = join(dirname(fileURLToPath(import.meta.url)), '..');",
    'const here = dirname(fileURLToPath(import.meta.url));',
    "const top = path.join(path.dirname(new URL(import.meta.url).pathname), '..');",
    'const at = path.dirname(fileURLToPath(import.meta.url));',
    'const d = import.meta.dirname;',
    "const r = new URL('../', import.meta.url);",
    "const s = new URL('..', import.meta.url);",
    "const f = new URL('fixtures/a.json', import.meta.url);",
    "const req = require('../tools/lib/x.cjs');",
    "const L = createRequire(import.meta.url)('../app/lib/x.cjs');",
    "const rd = (p) => readFileSync(new URL('../' + p, import.meta.url));",
    "const read = (p) => readFileSync(new URL(p, import.meta.url));",
    "const png = (key) => new URL(`../vendor/skins/${key.split('_')[0]}/${key}.png`, import.meta.url);",
    "assert.ok(hosts.includes(`from '../ui/${door}.js'`));",
    `spawnSync('node', ['-e', "import('./src/net/wire.js')"]);   // test/y.test.js`,
  ].join('\n');
  const there = new Set(['src/net/wire.js', 'tools/lib/x.cjs', 'app/lib/x.cjs', 'test/fixtures/a.json']);
  const texts = new Map([['test/x.test.js', x], ['test/y.test.js', "import { a } from '../src/net/wire.js';\n"]]);
  const plan = planMove(moves, texts, (p) => there.has(p));
  assert.equal(plan.writes.get('test/net/x.test.js'), [
    "import { join, dirname } from 'node:path';",
    "import { a } from '../../src/net/wire.js';",   // once: a test's own import is no subject a pin of another test quotes
    "const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');",
    'const here = dirname(dirname(fileURLToPath(import.meta.url)));',
    "const top = path.join(path.dirname(new URL(import.meta.url).pathname), '..', '..');",   // off the URL's pathname, path's own
    'const at = path.dirname(path.dirname(fileURLToPath(import.meta.url)));',
    "const d = join(import.meta.dirname, '..');",
    "const r = new URL('../../', import.meta.url);",   // a folder keeps its slash
    "const s = new URL('../..', import.meta.url);",
    "const f = new URL('../fixtures/a.json', import.meta.url);",
    "const req = require('../../tools/lib/x.cjs');",
    "const L = createRequire(import.meta.url)('../../app/lib/x.cjs');",
    "const rd = (p) => readFileSync(new URL('../../' + p, import.meta.url));",
    "const read = (p) => readFileSync(new URL(p, import.meta.url));",
    "const png = (key) => new URL(`../../vendor/skins/${key.split('_')[0]}/${key}.png`, import.meta.url);",   // a template that quotes inside its ${}
    "assert.ok(hosts.includes(`from '../ui/${door}.js'`));",   // a static from takes no template: a host's import, quoted - left
    `spawnSync('node', ['-e', "import('./src/net/wire.js')"]);   // test/net/y.test.js`,   // a child's root-relative import named nothing from test/: left
  ].join('\n'));
  // a URL whose path its caller hands it - `read('../src/x.js')` - is no specifier the tool can see: named, not guessed
  assert.deepEqual(plan.blind.filter((b) => /from a variable/.test(b)).map((b) => b.split(':')[0]), ['test/net/x.test.js']);
  // a test's name escaped for a pattern escapes its own dots too: `online\.test\.js` is no test.js
  assert.equal(rewritePaths('/`test\\/online\\.test\\.js` \\(9\\)/', new Map([moves[0], ['test/online.test.js', 'test/net/online.test.js']])).text,
    '/`test\\/net\\/online\\.test\\.js` \\(9\\)/');
  // the parity scripts name tests and modules too (tools/parity/prepare.sh, tools/roadsOracle.py)
  assert.ok(TEXT_EXT.test('tools/parity/prepare.sh') && TEXT_EXT.test('tools/roadsOracle.py'), 'a .sh or .py is read for addresses');
  // and without the existence check: a test that names another is not re-based twice through it
  const pair = new Map([['test/x.test.js', "import { a } from '../src/a.js';   // test/y.test.js"], ['test/y.test.js', "import { a } from '../src/a.js';\n"]]);
  assert.equal(planMove(moves, pair).writes.get('test/net/x.test.js'), "import { a } from '../../src/a.js';   // test/net/y.test.js");
  // a file that stays has no root to re-base, however its URL is built
  const stay = "const rd = (p) => readFileSync(new URL('../' + p, import.meta.url));";
  assert.equal(rewriteSpecifiers(stay, 'test/z.test.js', 'test/z.test.js', new Map(moves)).text, stay);
});

test('TIDY2: the ledger leads every path a file ever stood at to where it stands, and forgets one moved home', () => {
  assert.deepEqual(composeLedger([['src/a/x.js', 'src/a/b/x.js'], ['src/c/y.js', 'src/c/d/y.js'], ['src/a/b/x.js', 'src/a/e/x.js'], ['src/c/d/y.js', 'src/c/y.js']]),
    [['src/a/x.js', 'src/a/e/x.js'], ['src/a/b/x.js', 'src/a/e/x.js'], ['src/c/d/y.js', 'src/c/y.js']]);
});

test('TIDY1: the move tool names the sweeps it cannot follow', () => {
  const dirs = ['src/systems'];
  const at = (line) => blindSpots(line, 'test/x.test.js', dirs);
  assert.equal(at("readdirSync(join(root, 'src/systems')).filter((f) => f.endsWith('.js'))").length, 1, 'a sweep that does not recurse');
  assert.equal(at("readdirSync(new URL('../src/systems/', import.meta.url))").length, 1, 'by its URL too');
  assert.equal(at("readdirSync(join(root, 'src/systems'), { recursive: true })").length, 0, 'a recursing sweep still sees a moved file');
  assert.equal(at('const m = await import(`../systems/${name}.js`);').length, 1, 'an import built from a template');
  assert.equal(at('const u = new URL(`../systems/${name}.js`, import.meta.url);').length, 1, 'a URL built from a template');
  assert.equal(at('const m = await import(`../src/systems/livingWorld/x.js?t=${Date.now()}`);').length, 0, 'a template whose path is whole');
  // what no rewrite can place: a sibling's quoted ./x.js outside the folder it moved to, and a path escaped for a pattern
  const moved = new Map([['src/systems/arenaBout.js', 'src/systems/arena/arenaBout.js'], ['src/systems/arenaText.js', 'src/systems/arena/arenaText.js']]);
  assert.equal(blindSpots("assert.match(src, /from '\\.\\/arenaBout\\.js'/); x.includes('./arenaBout.js')", 'test/x.test.js', dirs, moved).length, 1, 'a quoted ./arenaBout.js');
  assert.equal(blindSpots("import { T } from './arenaText.js';", 'src/systems/arena/arenaBout.js', dirs, moved).length, 0, 'an import\'s own ./ is the specifier pass\'s');
  assert.equal(blindSpots("const own = src.includes('./arenaText.js');", 'src/systems/arena/arenaBout.js', dirs, moved).length, 0, 'beside it in the new folder, a quoted ./ is right');
});

test('TIDY1: the move tool names every file of the relay\'s bundle it would change', () => {
  // a byte of the relay's bundle is its version (test/relayversion.test.js), and a new version is a deploy that drops
  // every connected player - the tool refuses those moves unless told --relay (bible/01-Overview/Code-Map.md)
  const relay = new Set(['server/src/index.js', 'src/net/wire.js', 'src/systems/arenaBout.js']);
  const texts = new Map([['src/net/wire.js', "import { a } from '../systems/arenaBout.js';"], ['src/net/homeLaw.js', '// x'], ['server/src/index.js', '// y'],
    ['src/systems/arenaBout.js', "import { m } from '../world/mat4.js';"]]);
  const back = new Map([['src/systems/arena/arenaBout.js', 'src/systems/arenaBout.js']]);
  const hits = (moved) => relayHits(new Map([['src/net/wire.js', "import { a } from '../systems/arena/arenaBout.js';"], ['src/systems/arena/arenaBout.js', moved],
    ['src/net/homeLaw.js', '// z'], ['server/src/index.js', '// y']]), texts, back, relay);
  assert.deepEqual(hits("import { m } from '../../world/mat4.js';"), ['src/net/wire.js', 'src/systems/arena/arenaBout.js'],
    'the importer\'s specifier and the moved file\'s re-based one both change the relay\'s bytes; a file outside the bundle is not the relay\'s; one written back as it was is no change');
  assert.deepEqual(hits("import { m } from '../world/mat4.js';"), ['src/net/wire.js'], 'a moved file whose bytes stand changes no hash of its own');
});

test('TIDY1: Come Sail Away lives in its folder', () => {
  const loose = readdirSync(join(root, 'src/systems')).filter((f) => /^(comeSailAway\w*|csa[A-Z]\w*)\.js$/.test(f));
  assert.deepEqual(loose, [], 'a Come Sail Away module back loose in src/systems/ - it goes in src/systems/comeSailAway/ (Code-Map.md, "Where a new file goes" 2)');
  assert.deepEqual(readdirSync(join(root, 'src/systems/comeSailAway')).sort(), [
    'comeSailAway.js', 'comeSailAwayActions.js', 'comeSailAwayBoat.js', 'comeSailAwayHulls.js', 'comeSailAwayItems.js',
    'comeSailAwayMap.js', 'comeSailAwayModels.js', 'comeSailAwayWaves.js', 'comeSailAwayWire.js', 'csaBoatMenu.js',
  ]);
});

/** The tracked files, as git has them. */
const tracked = () => execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 }).split('\n').filter((f) => f && existsSync(join(root, f)));

test('TIDY2: no address of a moved file is left where the ledger says it went - a merged branch runs --fixup', () => {
  const files = tracked();
  const here = new Set(files);
  const gone = composeLedger(JSON.parse(rd(LEDGER))).filter(([f, t]) => !here.has(f) && here.has(t));
  assert.ok(gone.length >= 10, 'the ledger holds the moves');
  const texts = new Map(files.filter((f) => TEXT_EXT.test(f)).map((f) => [f, rd(f)]));
  const { counts } = planMove(gone, texts);
  assert.deepEqual([...counts.keys()], [], 'these files name a moved file where it no longer stands - run `node tools/moveModule.mjs --fixup` (bible/01-Overview/Code-Map.md)');
});

test('TIDY2: every relative import in the code resolves - the game, the two Workers, the tools, the scripts, the desktop shell', () => {
  const files = tracked();
  const KNOWN = new Map([
    ['app/launcher/pad.js: ./menuPad.js', 'the launcher\'s pad is copied beside it at packaging (app/ build), not tracked'],
    ['src/systems/racialLive.js: ./formulas.js', 'quoted in a comment: `node -e "import(\'./formulas.js\')"`'],
    ['tools/titleProbe.mjs: ../public/logo.png', 'the probe shoots the missing-asset arm when there is no logo'],
  ]);
  const code = files.filter((f) => /^(src|server\/src|server-account\/src|tools|scripts|app)\//.test(f) && /\.(m?js|cjs)$/.test(f) && f !== 'tools/moveModule.mjs');
  const bad = unresolvedIn(code.map((f) => [f, rd(f)]), files).filter((l) => !KNOWN.has(l));
  assert.deepEqual(bad, [], 'a relative import names nothing - a move left it behind, or a merged branch wrote it for a path that moved');
});

