#!/usr/bin/env node
// TIDY1 (2026-10-16): MOVE A MODULE AND EVERY ADDRESS OF IT (bible/01-Overview/Code-Map.md). A file in this tree is
// named in more places than its importers: the source pins read it by path (`rd('src/systems/arenaBout.js')`), the
// bible cites it by path, a mutant record names its `file`, a workflow lists it in `paths:`.
// A move by hand misses some of them, and the ones it misses fail late or, worse, not at all. This moves the files
// with `git mv` and rewrites each address in one pass:
//
//   SPECIFIER  a relative module specifier - `from '…'`, `import '…'`, `import('…')`, `new URL('…', import.meta.url)`
//              - that resolves to a moved file is rewritten from its own file; every specifier INSIDE a moved file is
//              re-based to where the file now stands - a template's static folder too (`new URL(`../../vendor/x/${n}`,
//              import.meta.url)`: its file is chosen at run time, its folder is not). Only those four forms: a runtime
//              URL (`fetch('./sfx/…')`) is the page's, not the module's, and is left alone.
//   ROOT PATH  `src/systems/arenaBout.js` anywhere in a tracked text file, with an optional `/`, `./` or `../..`
//              before it - pins, docs, mutant records, workflows, comments.
//   SRC PATH   `systems/arenaBout.js` - the spelling the bible (a cite's path form among them), the comments and the
//              tests' `src()` helpers use for a file under src/; and `01-Overview/X.md`, the bible's own spelling of
//              a page. With `./` or `../..` before it, it is a specifier quoted by a pin, rewritten the same.
//   ESCAPED    either path escaped for a pattern (`/06-Systems\/X\.md/`, `src\/systems\/x\.js`).
//   QUOTED     a test's pin on an import as its file spells it (`from '\.\/y\.js'`), where the move re-based it.
//
// A move changes the directory, never the name: the bible's cites by file name alone resolve by name
// (tools/citeAnchor.mjs makeResolver), so a kept name keeps them. An address is an address - a path in an old record
// is rewritten too, so it still leads to the file; the record's other words stay as written. Not rewritten: the
// relay's and the account service's migrations (applied, so frozen), the lockfile, and this tool and its pins (their
// examples are fixtures).
//
// What it cannot rewrite it names: a directory sweep that does not recurse (`readdirSync('src/systems')` - it stops
// seeing a moved file and passes on what is left, silently), an import or a URL built from a template into the folder
// a file left, and a sibling's quoted `./x.js`. And it refuses a move that changes a byte of the relay's bundle (RELAY
// lines) unless told `--relay`: that is a new RELAY_VERSION and a deploy that drops every connected player.
//
// THE LEDGER (TIDY2). Every move is appended to tools/moveLedger.json. A branch written before a move still names the
// old paths; after it merges main, `--fixup` rewrites every address the ledger knows is gone to where the file went,
// and test/tidy1_codemap.test.js fails while any is left.
//
//   node tools/moveModule.mjs src/systems/arena src/systems/arena*.js        move them, rewrite every address
//   node tools/moveModule.mjs --plan moves.json                              many moves, one pass: [[from, to], ...]
//   node tools/moveModule.mjs --fixup                                        a merged branch's old addresses, rewritten
//   --dry-run with any of them says what it would change and changes nothing
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { isMain } from './lib/isMain.mjs';
import { graph } from '../test/importGraph.mjs';   // the relay's bundle, walked as relayversion.test.js walks it

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Tracked files that can hold an address - the parity scripts' (`.sh`, `.py`) among them. */
export const TEXT_EXT = /\.(js|mjs|cjs|ts|json|md|html|yml|yaml|toml|css|txt|sh|py)$/;
/** Files whose text is a record that is never rewritten. */
export const FROZEN = [/^server(-account)?\/migrations\//, /^package-lock\.json$/, /(^|\/)node_modules\//, /^tools\/moveModule\.mjs$/, /^test\/(?:[\w-]+\/)*tidy1_codemap\.test\.js$/, /^tools\/moveLedger\.json$/];
/** Every move made, in order: [[from, to], ...]. */
export const LEDGER = 'tools/moveLedger.json';
/** The roots a path is also spelled from: `systems/x.js` is src's, `01-Overview/X.md` the bible's. */
const ROOTS = ['src/', 'bible/'];
/** Files a specifier can sit in. */
const CODE_EXT = /\.(js|mjs|cjs|ts|html)$/;

/** The four specifier forms: group 1 is everything before the specifier's quote, 2 the quote, 3 the specifier. */
const SPECIFIER_RES = [
  /(\bfrom\s*)(['"])(\.{1,2}\/[^'"\n]*)\2/g,
  /(^\s*import\s*)(['"])(\.{1,2}\/[^'"\n]*)\2/gm,
  // (a template's `${…}` may quote: `${key.split('_')[0]}`)
  /(\bimport\s*\(\s*)(['"`])(\.{1,2}\/(?:\$\{[^}\n]*\}|[^'"`\n])*)\2/g,
  // a URL off the module's own: a path, a folder (`'.'`, `'../'`), or a bare name beside it (`'fixtures/x.json'`)
  /(\bnew URL\(\s*)(['"`])(\.{1,2}(?:\/(?:\$\{[^}\n]*\}|[^'"`\n])*)?|[\w-](?:\$\{[^}\n]*\}|[^'"`\n:])*)\2(?=\s*,\s*import\.meta\.url)/g,
  // a createRequire's require, relative to its module as an import is - named, or called where it is made
  /(\brequire\s*\(\s*)(['"])(\.{1,2}\/[^'"\n]*)\2/g,
  /(\bcreateRequire\(\s*import\.meta\.url\s*\)\s*\(\s*)(['"])(\.{1,2}\/[^'"\n]*)\2/g,
];

/** The leads of the two forms a template can be a specifier in. */
const TEMPLATED = /^(?:\bimport\s*\(|\bnew URL\()/;

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A specifier written from `fromFile` to `target`, both repository paths: always `./` or `../`-led. */
export function specifierTo(fromFile, target) {
  const r = posix.relative(posix.dirname(fromFile), target);
  return r.startsWith('.') ? r : `./${r}`;
}

/** Split a specifier into its path and its tail (`?raw`, `#x`) - a template's `${…}` before either is no path. */
function splitSpec(spec) {
  const q = spec.search(/[?#]/);
  const path = q < 0 ? spec : spec.slice(0, q);
  return path.includes('${') ? null : { path, tail: q < 0 ? '' : spec.slice(q) };
}

/** A template's static folder - `../../vendor/x/` of `../../vendor/x/${name}.ogg` - and the rest, or null. */
function splitTemplate(spec) {
  const at = spec.indexOf('${');
  if (at < 0) return null;
  const dir = spec.slice(0, spec.lastIndexOf('/', at) + 1);
  return dir.startsWith('.') ? { dir, rest: spec.slice(dir.length) } : null;
}

/** `dir` (a folder spelled from `fromFile`) spelled from `home` instead, with its slash. */
function folderFrom(fromFile, dir, home) {
  const r = posix.relative(posix.dirname(home), posix.normalize(posix.join(posix.dirname(fromFile), dir)));
  return r === '' ? './' : `${r.startsWith('.') ? r : `./${r}`}/`;
}

/**
 * Rewrite the specifiers of one file. `file` is where the text stands now, `home` where it will stand (the same for a
 * file that does not move), `moved` maps an old repository path to its new one.
 */
export function rewriteSpecifiers(text, file, home, moved, exists = null) {
  let n = 0;
  for (const re of SPECIFIER_RES) {
    text = text.replace(re, (all, lead, quote, spec) => {
      const s = splitSpec(spec);
      if (!s) {
        // a template's file is chosen at run time, but its folder is not: a moved file's is re-based - where a
        // template can stand, `import(...)` and `new URL(...)`; a static `from` never takes one, so a `from '../${x}'`
        // is text a pin quotes (`hosts.includes(`from '../ui/${door}.js'`)`), another file's import
        const t = TEMPLATED.test(lead) && splitTemplate(spec);
        if (!t || home === file) return all;
        const out = folderFrom(file, t.dir, home) + t.rest;
        if (out === spec) return all;
        n++;
        return `${lead}${quote}${out}${quote}`;
      }
      const target = posix.normalize(posix.join(posix.dirname(file), s.path)).replace(/\/$/, '') || '.';
      const next = moved.get(target) ?? target;
      if (next === target && home === file) return all;
      // one that names nothing from where its file stood is not its file's - a `node -e` child's root-relative import,
      // a fixture's source - and is left as it is written
      if (exists && !moved.has(target) && target !== '.' && !exists(target)) return all;
      // a folder keeps its spelling's slash: `'../'` stays a folder, `'..'` stays without
      let out = (next === posix.dirname(home) ? (s.path.startsWith('..') ? '.' : './') : specifierTo(home, next));
      if (/\/$/.test(s.path) && !out.endsWith('/')) out += '/';
      if (!/\/$/.test(s.path) && out !== './' && out.endsWith('/')) out = out.slice(0, -1);
      out += s.tail;
      if (out === spec) return all;
      n++;
      return `${lead}${quote}${out}${quote}`;
    });
  }
  // CONCATENATED: `new URL('../' + p, import.meta.url)` - the literal is a folder of the module's own, its file chosen by
  // what is added to it; a moved file's folder is re-based as a template's is
  if (home !== file) {
    text = text.replace(/(\bnew URL\(\s*)(['"])(\.{1,2}(?:\/(?:[\w.-]+\/)*)?)\2(\s*\+)(?=[^;\n]*?,\s*import\.meta\.url)/g, (all, lead, quote, dir, plus) => {
      const out = folderFrom(file, dir.endsWith('/') ? dir : `${dir}/`, home);
      const keep = dir.endsWith('/') ? out : out.replace(/\/$/, '');
      if (keep === dir) return all;
      n++;
      return `${lead}${quote}${keep}${quote}${plus}`;
    });
  }
  return { text, n };
}

/** The file names a text mentions, plainly or escaped for a pattern (`x\\.js`) - a move whose name is not among them
 *  has nothing to rewrite there, and is not tried. */
export function namesIn(text) {
  const out = new Set();
  // a name's own dots may be escaped too: `online\.test\.js` is online.test.js, not test.js
  for (const m of text.matchAll(/([\w-]+(?:\\?\.[\w-]+)*)\\?\.(m?js|cjs|json|md|html)(?![\w-])/g)) out.add(`${m[1].replace(/\\/g, '')}.${m[2]}`);
  return out;
}

/** `moves` by their file's name. */
export function byName(moves) {
  const out = new Map();
  for (const [from, to] of moves) { const b = posix.basename(from); (out.get(b) ?? out.set(b, []).get(b)).push([from, to]); }
  return out;
}

/** A path escaped for a pattern: `src\/systems\/x\.js`. */
const escaped = (p) => p.replace(/[/.]/g, (c) => `\\${c}`);

/** Rewrite the root paths and src paths of the moved files in any text. `names` is byName(moved), for speed: only the
 *  moves whose file the text names are tried, all of them in one pass - a page that names three thousand tests is read
 *  once, not three thousand times. */
export function rewritePaths(text, moved, names = byName(moved)) {
  const plain = new Map(), esc2 = new Map();   // a spelling -> [what it becomes, whether it is a root's own spelling]
  for (const name of namesIn(text)) for (const [from, to] of names.get(name) ?? []) {
    plain.set(from, [to, false]);
    esc2.set(escaped(from), [escaped(to), false]);
    const root = ROOTS.find((r) => from.startsWith(r) && to.startsWith(r));
    if (!root) continue;
    // with a `./` or `../..` before it, a src path is a specifier QUOTED - a pin reading another file's import
    // (`from.includes('../systems/x.js')`): the specifier pass cannot know what it is relative to, and the src path
    // names the same file from any depth it is written at
    const [f, t] = [from.slice(root.length), to.slice(root.length)];
    if (!plain.has(f)) plain.set(f, [t, true]);
    if (!esc2.has(escaped(f))) esc2.set(escaped(f), [escaped(t), true]);
  }
  if (!plain.size) return { text, n: 0 };
  let n = 0;
  const alt = (m) => [...m.keys()].sort((a, b) => b.length - a.length).map(esc).join('|');
  // a root path may stand after `/`; a root's own spelling may not (`foo/systems/x.js` is no src path)
  text = text.replace(new RegExp(`(?<![\\w\\-./])(\\/|\\.\\/|(?:\\.\\.\\/)+)?(${alt(plain)})(?![\\w\\-])`, 'g'), (all, lead = '', key) => {
    const [to, own] = plain.get(key);
    if (own && lead === '/') return all;
    n++;
    return lead + to;
  });
  text = text.replace(new RegExp(`(?<![\\w\\-.])(?<!\\\\/)(\\\\/|\\\\.\\\\/|(?:\\\\.\\\\.\\\\/)+)?(${alt(esc2)})(?![\\w\\-])`, 'g'), (all, lead = '', key) => {
    const [to, own] = esc2.get(key);
    if (own && lead === '\\/') return all;
    n++;
    return lead + to;
  });
  return { text, n };
}

/**
 * A mutation list's records quote their file's source (`old`, `new`), specifiers and all: each is rewritten as if it
 * stood in its record's file - its imports of a moved file, and every import of a moved one. A JSON string is found by
 * its own spelling; one that cannot be found, or that two records need rewritten two ways, is named, not guessed.
 */
export function rewriteRecords(text, moved, file) {
  let recs;
  try { recs = JSON.parse(text); } catch { return { text, n: 0, blind: [] }; }
  if (!Array.isArray(recs)) return { text, n: 0, blind: [] };
  const plans = new Map(), keep = new Set();
  for (const r of recs) {
    if (typeof r?.file !== 'string' || !CODE_EXT.test(r.file)) continue;
    for (const k of ['old', 'new']) {
      if (typeof r[k] !== 'string') continue;
      const a = JSON.stringify(r[k]), out = rewriteSpecifiers(r[k], r.file, moved.get(r.file) ?? r.file, moved).text;
      if (out === r[k]) { keep.add(a); continue; }
      const b = JSON.stringify(out);
      plans.set(a, plans.has(a) && plans.get(a) !== b ? null : b);
    }
  }
  let n = 0;
  const blind = [];
  for (const [a, b] of plans) {
    if (b === null || keep.has(a) || !text.includes(a)) { blind.push(`${file}: a record's source names a moved file and could not be rewritten: ${a.slice(0, 80)}`); continue; }
    n += text.split(a).length - 1;
    text = text.split(a).join(b);
  }
  return { text, n, blind };
}

/** Lines that sweep a directory a file left without recursing, or import from it by template: `file:line: text`. */
export function blindSpots(text, file, fromDirs, moved = new Map(), names = byName(moved)) {
  const out = [];
  const lines = text.split('\n');
  // a moved file named in a way no rewrite can place: its sibling's quoted `./x.js` - relative to which file? Beside it
  // in its new folder, `./x.js` is right: the two moved together
  const unplaced = [...namesIn(text)].flatMap((name) => names.get(name) ?? []).filter(([f, t]) => f !== file && posix.dirname(t) !== posix.dirname(file))
    .map(([f]) => [new RegExp(`(?<!\\bfrom\\s*|\\bimport\\s*\\(?\\s*|\\bnew URL\\(\\s*)(['"\`])\\./${esc(posix.basename(f))}\\1`), `quotes ./${posix.basename(f)} - relative to which file?`]);   // an import's own `./x.js` is the specifier pass's, and names its own folder's x.js
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    for (const [re, why] of unplaced) if (re.test(l)) out.push(`${file}:${i + 1}: ${why}`);
    if (!/readdirSync\(|(?:import\(|new URL\()\s*`/.test(l)) continue;
    for (const d of fromDirs) {
      const named = new RegExp(`['"\`/]${esc(d)}/?['"\`]`).test(l) || new RegExp(`['"\`]${esc(d.replace(/^[a-z]+\//, ''))}/?['"\`]`).test(l);
      if (/readdirSync\(/.test(l) && named && !/recursive:\s*true/.test(l)) out.push(`${file}:${i + 1}: sweeps ${d}/ without recursing`);
      for (const m of l.matchAll(/(?:import\(|new URL\()\s*`([^`]*)`/g)) {
        const head = m[1].split('${')[0];
        if (m[1].includes('${') && !/[?#]/.test(head) && head.endsWith(`${d.replace(/^[a-z]+\//, '')}/`)) out.push(`${file}:${i + 1}: names a file in ${d}/ by template`);
      }
    }
  }
  return out;
}

/** A module's own folder, as the tests spell it. */
/** A module's own folder: `dirname(fileURLToPath(import.meta.url))` - `path.`'s too, or off the URL's `.pathname` -
 *  and `import.meta.dirname`. */
const OWN = String.raw`(?:path\.)?dirname\((?:fileURLToPath\(import\.meta\.url\)|new URL\(import\.meta\.url\)\.pathname)\)|import\.meta\.dirname`;
const OWN_DIR = new RegExp(OWN, 'g');

/**
 * ROOTED. A file that finds the tree from its own folder - `join(dirname(fileURLToPath(import.meta.url)), '..')` -
 * finds it `deeper` folders short once it moves down. Its own folder is made to mean what it meant where the file was
 * written: an argument of `'..'` a level where it heads a join or resolve, a `dirname()` a level elsewhere
 * (`import.meta.dirname` there is joined with `'..'`, and the file must import `join`). Returns the text and what it
 * could not do.
 */
export function rebaseOwnDir(text, deeper, file = '') {
  if (deeper <= 0 || !OWN_DIR.test(text)) return { text, n: 0, blind: [] };
  OWN_DIR.lastIndex = 0;
  const ups = Array(deeper).fill("'..'").join(', ');
  let n = 0;
  const blind = [];
  text = text.replace(new RegExp(String.raw`\b(join|resolve)\(\s*(${OWN})\s*([,)])`, 'g'), (all, fn, own, after) => {
    n++;
    return `${fn}(${own}, ${ups}${after === ',' ? ',' : ')'}`;
  });
  // what is left stands alone: its own folder, raised
  text = text.replace(new RegExp(String.raw`(?<!\b(?:join|resolve)\(\s*)(${OWN})(?!,\s*'\.\.')`, 'g'), (all, own) => {
    n++;
    const up = own.startsWith('path.') ? 'path.dirname(' : 'dirname(';
    if (!own.startsWith('import.meta')) return `${up.repeat(deeper)}${own}${')'.repeat(deeper)}`;
    if (!/\bjoin\b[^;\n]*from 'node:path'/.test(text)) blind.push(`${file}: import.meta.dirname, and no join imported to raise it`);
    return `join(${own}, ${ups})`;
  });
  return { text, n, blind };
}

/**
 * Plan a move over the texts of the tree. `moves` is [[from, to], ...] of repository paths; `texts` a Map of every
 * tracked text file. Returns the new texts by their NEW path, the count of addresses rewritten in each, and the blind
 * spots.
 */
export function planMove(moves, texts, exists = null) {
  const moved = new Map(moves), names = byName(moves);
  const fromDirs = [...new Set(moves.map(([f]) => posix.dirname(f)))];
  const writes = new Map(), counts = new Map(), blind = [];
  // QUOTED IMPORTS first: what each code file's own specifiers become - read off the text as it stands, before any path
  // in a pin is rewritten, so the pin's old spelling is still there to find
  const changes = new Map();
  for (const [file, text] of texts) {
    // the subjects pins read - a test's own imports are its own, rewritten once by the specifier pass
    if (!CODE_EXT.test(file) || FROZEN.some((re) => re.test(file)) || /^test\//.test(file)) continue;
    const c = specifierChanges(text, rewriteSpecifiers(text, file, moved.get(file) ?? file, moved).text);
    if (c.size) changes.set(file, c);   // by the path a pin names it by now
  }
  const depth = (f) => f.split('/').length;
  for (const [file, text] of texts) {
    const home = moved.get(file) ?? file;
    if (FROZEN.some((re) => re.test(file))) {
      // a frozen file's text is a fixture - but a frozen file that moves still has to reach what it imports
      if (home !== file && CODE_EXT.test(file)) {
        const r = rewriteSpecifiers(text, file, home, moved, exists), o = rebaseOwnDir(r.text, depth(home) - depth(file), home);
        writes.set(home, o.text); blind.push(...o.blind);
      }
      continue;
    }
    let t = text, n = 0;
    if (changes.size && /^test\//.test(file)) {
      const q = rewriteQuotedImports(t, changes, home);
      t = q.text; n += q.n; blind.push(...q.blind);
    }
    if (CODE_EXT.test(file)) { const r = rewriteSpecifiers(t, file, home, moved, exists); t = r.text; n += r.n; }
    // what the existence check left that names a folder that stands: a gone file a negative pin names
    // (`!existsSync(new URL('../src/ui/gone.js', ...))`, re-base it) or a fixture's text (leave it) - named, not guessed
    if (home !== file && exists && CODE_EXT.test(file)) {
      for (const spec of specifierList(text)) {
        const s = splitSpec(spec);
        if (!s) continue;
        const target = posix.normalize(posix.join(posix.dirname(file), s.path)).replace(/\/$/, '');
        if (!moved.has(target) && !exists(target) && !target.startsWith('..') && exists(posix.dirname(target))) {
          blind.push(`${home}: names ${spec}, nothing where it stood, in a folder that stands - a gone file a negative pin names (re-base it) or a fixture's text (leave it)?`);
        }
      }
    }
    if (home !== file && /\.(m?js|cjs)$/.test(file)) {
      const o = rebaseOwnDir(t, depth(home) - depth(file), home);
      t = o.text; n += o.n; blind.push(...o.blind);
      if (depth(home) < depth(file) && OWN_DIR.test(t)) blind.push(`${home}: finds the tree from its own folder, and moved up`);
      OWN_DIR.lastIndex = 0;
      // a URL off its own folder whose path is a variable: the literals its callers hand it are not re-based
      if (home !== file && depth(home) !== depth(file) && /\bnew URL\(\s*[A-Za-z_$][\w$.]*\s*,\s*import\.meta\.url\s*\)/.test(t)) {
        blind.push(`${home}: builds a URL off its own folder from a variable - the paths handed to it are spelled from where it stood`);
      }
    }
    if (/^tools\/mutants\/.*\.json$/.test(file)) {
      const r = rewriteRecords(t, moved, file);
      t = r.text; n += r.n; blind.push(...r.blind);
    }
    const p = rewritePaths(t, moved, names);
    if (p.n) { t = p.text; n += p.n; }
    if (t !== text || home !== file) writes.set(home, t);
    if (n) counts.set(home, n);
    if (/\.(js|mjs|cjs)$/.test(home)) blind.push(...blindSpots(t, home, fromDirs, moved, names));
  }
  return { writes, counts, blind };
}

/** The specifiers a rewrite changed in one file, old spelling to new - null where one spelling became two - and, as
 *  `x -> x`, those it left as they were: a pin naming this file and another may quote either. */
export function specifierChanges(oldText, newText) {
  const a = specifierList(oldText), b = specifierList(newText), out = new Map();
  if (a.length !== b.length) return out;
  a.forEach((x, i) => out.set(x, out.has(x) && out.get(x) !== b[i] ? null : b[i]));
  return [...out].some(([x, y]) => x !== y) ? out : new Map();
}

/**
 * QUOTED IMPORTS. A pin quotes an import as its file spells it - `assert.match(rd('src/ui/x.js'), /from '\.\/y\.js'/)` -
 * and a move that re-based the import leaves the quote naming nothing. Where a text names a file (`changes` maps each
 * file's path to the specifiers the move changed in it), each quoted old spelling, plain or escaped for a pattern,
 * becomes the new one - in one pass, so a spelling that became another's is not rewritten twice. One the files a text
 * names disagree on is named, not guessed.
 */
export function rewriteQuotedImports(text, changes, file = '') {
  const plan = new Map();
  for (const [path, specs] of changes) {
    if (!(text.includes(path) || (path.startsWith('src/') && text.includes(path.slice(4))))) continue;
    for (const [a, b] of specs) {
      for (const [x, y] of [[a, b], [escaped(a), b === null ? null : escaped(b)]]) plan.set(x, plan.has(x) && plan.get(x) !== y ? null : y);
    }
  }
  const quoted = [...plan.keys()].filter((x) => plan.get(x) !== x && (text.includes(`'${x}'`) || text.includes(`"${x}"`)));
  if (!quoted.length) return { text, n: 0, blind: [] };
  const blind = quoted.filter((x) => plan.get(x) === null).map((x) => `${file}: quotes ${x}, an import the files it names re-based two ways`);
  const sure = quoted.filter((x) => plan.get(x) !== null);
  let n = 0;
  if (sure.length) text = text.replace(new RegExp(`(['"])(${sure.map(esc).join('|')})\\1`, 'g'), (all, q, x) => { n++; return q + plan.get(x) + q; });
  return { text, n, blind };
}

/** The ledger's moves composed - a file moved twice is one move from where it first stood to where it stands now. */
export function composeLedger(entries) {
  const out = new Map();
  for (const [from, to] of entries) {
    for (const [k, v] of out) if (v === from) out.set(k, to);
    if (!out.has(from)) out.set(from, to);
  }
  for (const [k, v] of out) if (k === v) out.delete(k);
  return [...out];
}

/** A text's specifiers, in the order the four forms find them - a rewrite keeps the order and the count. */
const specifierList = (text) => SPECIFIER_RES.flatMap((re) => [...text.matchAll(re)].map((m) => m[3]));

/**
 * The specifiers the move broke, as `file: spec`: each one that named a file before (`was` in the tree as it stood)
 * and names none after (`now` in the tree the move leaves). One that named nothing before is not the move's - a test
 * runs `import('./src/...')` from the repository's root through `node -e`, which reads as test/src/ from where it is
 * written, before and after alike.
 */
export function brokenBy(oldText, oldFile, newText, newFile, was, now) {
  const at = (file, p) => posix.normalize(posix.join(posix.dirname(file), p)).replace(/\/$/, '');
  const resolves = (file, spec, exists) => {
    const s = splitSpec(spec), t = s ? null : splitTemplate(spec);
    const p = t ? at(file, t.dir) : s && at(file, s.path);   // a template's folder; a file, or a folder named with its slash
    return !p || p === '.' || exists(p);
  };
  const a = specifierList(oldText), b = specifierList(newText);
  return b.filter((spec, i) => (a.length !== b.length || resolves(oldFile, a[i], was)) && !resolves(newFile, spec, now)).map((spec) => `${newFile}: ${spec}`);
}

/** A file, or a folder that holds one, among `files`. */
export function within(files) {
  const dirs = new Set([...files].flatMap((f) => f.split('/').slice(0, -1).map((_, i, a) => a.slice(0, i + 1).join('/'))));
  return (p) => files.has(p) || dirs.has(p);
}

/** Every specifier among `entries` ([[file, text], ...]) that names nothing among `files`, as `file: spec`. */
export function unresolvedIn(entries, files) {
  const there = within(new Set(files));
  return entries.flatMap(([f, t]) => brokenBy(t, f, t, f, () => true, there));
}

/** A ledger as written: one move a line, so two branches' moves merge as lines. */
export const ledgerText = (entries) => `[\n${entries.map((e) => `  ${JSON.stringify(e)}`).join(',\n')}\n]\n`;

/** The files of the relay's bundle (`relay`, by their paths before the move) whose bytes the move changes, by their new
 *  paths. `back` maps a moved file's new path to its old one. The hash reads bytes, not paths: a moved file whose bytes
 *  stand is no change of its own - the importer that reaches it is, and is named. */
export function relayHits(writes, texts, back, relay) {
  return [...writes].filter(([f, t]) => relay.has(back.get(f) ?? f) && t !== texts.get(back.get(f) ?? f)).map(([f]) => f);
}

function main(argv) {
  const flag = (f) => argv.includes(f);
  const dry = flag('--dry-run'), relayOk = flag('--relay'), fixup = flag('--fixup');
  const planAt = argv.indexOf('--plan');
  const args = argv.filter((a, i) => !a.startsWith('--') && !(planAt >= 0 && i === planAt + 1)).map((a) => a.replace(/^\.\//, '').replace(/\/$/, ''));
  const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 });
  const tracked = git('ls-files').split('\n').filter(Boolean).filter((f) => existsSync(join(ROOT, f)));
  const trackedSet = new Set(tracked);
  const ledger = existsSync(join(ROOT, LEDGER)) ? JSON.parse(readFileSync(join(ROOT, LEDGER), 'utf8')) : [];
  let moves;
  if (fixup) moves = composeLedger(ledger).filter(([f, t]) => !trackedSet.has(f) && trackedSet.has(t));
  else if (planAt >= 0) moves = JSON.parse(readFileSync(argv[planAt + 1], 'utf8'));
  else {
    const [dest, ...sources] = args;
    if (!dest || !sources.length) {
      console.error('usage: node tools/moveModule.mjs [--dry-run] [--relay] <destination directory> <file>... | --plan <moves.json> | --fixup');
      return 2;
    }
    moves = sources.map((f) => [f, posix.join(dest, posix.basename(f))]);
  }
  if (!fixup) for (const [f, t] of moves) {
    if (!trackedSet.has(f)) { console.error(`not a tracked file: ${f}`); return 1; }
    if (existsSync(join(ROOT, t))) { console.error(`already there: ${t}`); return 1; }
    if (posix.basename(f) !== posix.basename(t)) { console.error(`a move keeps the name: ${f} -> ${t}`); return 1; }
  }
  const texts = new Map();
  for (const f of tracked) if (TEXT_EXT.test(f)) texts.set(f, readFileSync(join(ROOT, f), 'utf8'));

  const { writes, counts, blind } = planMove(moves, texts, within(trackedSet));
  const moved = new Map(fixup ? [] : moves), back = new Map([...moved].map(([f, t]) => [t, f]));
  const after = new Set(tracked.map((f) => moved.get(f) ?? f));
  const was = within(trackedSet), now = within(after);
  const broken = [...writes].filter(([f]) => CODE_EXT.test(f))
    .flatMap(([f, t]) => brokenBy(texts.get(back.get(f) ?? f), back.get(f) ?? f, t, f, was, now));
  // THE RELAY'S BYTES ARE ITS VERSION (test/relayversion.test.js): a move that changes one byte of the relay's bundle -
  // a moved file in it, a re-based import, a path in one of its comments - is a new RELAY_VERSION, and the relay
  // redeploys on its merge and drops every connected player. A tidy is not worth that alone; it goes with a relay slice.
  // a fixup mends a merge whose imports still name the old paths - the relay's walk cannot follow them yet, and the
  // merged branch's own relay pins answer for its version
  const relayHit = fixup ? [] : relayHits(writes, texts, back, new Set(graph('server/src/index.js')));

  for (const [f, t] of moves) console.log(`${fixup ? 'gone ' : 'move '} ${f} -> ${t}`);
  for (const [f, n] of [...counts].sort()) console.log(`edit  ${f} (${n})`);
  for (const b of blind) console.log(`BLIND ${b}`);
  for (const b of broken) console.log(`BROKEN ${b}`);
  for (const f of relayHit) console.log(`RELAY ${f}: the relay's bundle changes`);
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  console.log(`${moves.length} file(s) ${fixup ? 'gone' : 'moved'}, ${total} address(es) in ${counts.size} file(s), ${blind.length} blind spot(s), ${broken.length} broken`);
  if (broken.length) { console.error('a rewritten specifier resolves to nothing - nothing written'); return 1; }
  if (relayHit.length && !relayOk) {
    console.error('the relay\'s bundle changes: a new RELAY_VERSION, and a deploy that drops every player - nothing written.'
      + ' Pass --relay to move it anyway, with the version bump, in a relay slice (bible/01-Overview/Code-Map.md)');
    return 1;
  }
  if (dry) return 0;

  for (const [f, t] of moved) { mkdirSync(join(ROOT, posix.dirname(t)), { recursive: true }); git('mv', f, t); }
  for (const [f, t] of writes) if (t !== readFileSync(join(ROOT, f), 'utf8')) writeFileSync(join(ROOT, f), t);
  if (!fixup) writeFileSync(join(ROOT, LEDGER), ledgerText([...ledger, ...moves]));
  return 0;
}

if (isMain(import.meta.url)) process.exitCode = main(process.argv.slice(2));
