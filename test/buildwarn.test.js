// BUILD-LEFTOVERS (2026-10-15): THE BUILD'S WARNINGS STAY WORTH READING. Vite 8's build printed two ineffective
// dynamic imports and a chunk-size warning on every run, so a new one would have been lost among them. mwFirstPerson's
// was a dynamic import of a module it already imported statically (gone); hudLayout -> revenantCard's is the design
// (the dynamic edge keeps the two out of a cycle), and vite.config.js's onLog quiets that one pair - and must quiet
// nothing else, or the next real warning is silent. Held by a build: a scratch tree with that pair and another, built
// by Vite through the config's own onLog.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, createLogger } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** build.rollupOptions.onLog, as vite.config.js actually spells it - not a copy. */
function onLog() {
  const m = /^ {6}onLog\(level, log, handler\) \{\n([\s\S]*?)\n {6}\},$/m.exec(readFileSync(join(root, 'vite.config.js'), 'utf8'));
  assert.ok(m, 'vite.config.js no longer carries build.rollupOptions.onLog');
  // eslint-disable-next-line no-new-func
  return new Function('level', 'log', 'handler', m[1]);
}

/** A module both imported and dynamically imported by its neighbour: the warning's own shape. */
const pair = (dir, dyn, stat) => ({
  [`${dir}/${dyn}.js`]: `import { tag } from './${stat}.js';\nexport const load = () => import('./${stat}.js');\nexport const use = () => tag;\n`,
  [`${dir}/${stat}.js`]: `export const tag = '${stat}';\n`,
});

test('BUILD-LEFTOVERS THE BUILD\'S WARNINGS STAY WORTH READING: built by Vite through vite.config.js\'s own onLog, hudLayout -> revenantCard\'s ineffective dynamic import (the edge that keeps them out of a cycle) is quiet and another pair\'s still warns (mutants: every ineffective dynamic import quiet; the pair quiet by its file name alone)', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'buildwarn-'));
  try {
    const files = {
      'index.html': '<!doctype html><script type="module" src="./src/main.js"></script>\n',
      'src/main.js': "import { use } from './ui/hudLayout.js';\nimport { use as other } from './x/caller.js';\nconsole.log(use(), other());\n",
      ...pair('src/ui', 'hudLayout', 'revenantCard'),
      ...pair('src/x', 'caller', 'callee'),
      // the same file name under another caller is another pair - it warns
      ...pair('src/y', 'notHudLayout', 'revenantCard'),
    };
    files['src/main.js'] += "import { use as third } from './y/notHudLayout.js';\nconsole.log(third());\n";
    for (const [p, text] of Object.entries(files)) { mkdirSync(dirname(join(dir, p)), { recursive: true }); writeFileSync(join(dir, p), text); }
    const warned = [];
    const logger = createLogger('warn', { allowClearScreen: false });
    logger.warn = (msg) => warned.push(msg);
    await build({
      root: dir, configFile: false, logLevel: 'warn', customLogger: logger,
      build: { outDir: join(dir, 'dist'), rollupOptions: { onLog: onLog() } },
    });
    // (the paths are relative to the working directory - this tree is elsewhere, so they carry a prefix)
    const ineffective = [...warned.join('\n').matchAll(/(src\/\w+\/\w+\.js) is dynamically imported by \S*?(src\/\w+\/\w+\.js)/g)].map((m) => `${m[1]} is dynamically imported by ${m[2]}`);
    assert.deepEqual(ineffective.sort(), [
      'src/x/callee.js is dynamically imported by src/x/caller.js',
      'src/y/revenantCard.js is dynamically imported by src/y/notHudLayout.js',
    ], `the warnings the build printed:\n${warned.join('\n')}`);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
