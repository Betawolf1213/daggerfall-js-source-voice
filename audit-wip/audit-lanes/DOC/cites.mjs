// DOC lane: every file the record names (in backticks) exists; every code name it cites (a backticked identifier, and a
// bare `name` after a `file.js`) is defined in the code; each "file.js name" pair - the name is in THAT file.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const doc = readFileSync(`${SNAP}/${process.argv[2] ?? 'bible/06-Systems/Questlines-Arc.md'}`, 'utf8');
const files = execFileSync('git', ['-C', SNAP, 'ls-files'], { encoding: 'utf8', maxBuffer: 1 << 26 }).split('\n').filter(Boolean);
const bySuffix = (p) => files.filter((f) => f === p || f.endsWith('/' + p));
const missing = new Set(), pairs = [];
for (const m of doc.matchAll(/`([A-Za-z0-9_$./<>-]+\.(?:js|mjs|sql|toml|txt|json|md|yml))`(?:\s+\(?`?([A-Za-z_$][A-Za-z0-9_$]*)`?)?/g)) {
  const p = m[1];
  if (p.includes('<')) continue;
  const hits = bySuffix(p);
  if (!hits.length) missing.add(p);
  else if (m[2] && /^[A-Za-z_$][A-Za-z0-9_$]{3,}$/.test(m[2])) pairs.push([p, m[2], hits]);
}
console.log('files named that do not exist:', [...missing].join(', ') || 'none');
for (const [p, name, hits] of pairs) {
  const ok = hits.some((h) => readFileSync(`${SNAP}/${h}`, 'utf8').includes(name));
  if (!ok) console.log(`PAIR MISS: \`${p}\` ${name}`);
}
console.log('pairs checked', pairs.length);
