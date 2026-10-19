// DOC lane: is every questlines data file already in qlFormat's one form? (formatFamily in memory - nothing written)
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { formatFamily } = await import(`${SNAP}/tools/qlFormat.mjs`);
const ROOT = join(SNAP, 'src/systems/questlines');
for (const [dir, key] of [['sheets', 'sheets'], ['patches', 'patches']]) {
  for (const f of readdirSync(join(ROOT, dir))) {
    const p = join(ROOT, dir, f);
    const text = readFileSync(p, 'utf8');
    const out = formatFamily(JSON.parse(text), key);
    console.log(`${dir}/${f}`, out === text ? 'formatted' : `DIFFERS (${text.length} vs ${out.length})`);
  }
}
