// DOC lane: the mutant records the branch re-aimed (changed against origin/main, ql12_claim.json aside - run whole), as one
// list for tools/mutate.mjs.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const git = (...a) => execFileSync('git', ['-C', SNAP, ...a], { encoding: 'utf8', maxBuffer: 1 << 26 });
const out = [];
for (const f of git('diff', '--name-only', 'origin/main...HEAD', '--', 'tools/mutants/').trim().split('\n')) {
  if (f.endsWith('ql12_claim.json')) continue;
  const head = JSON.parse(readFileSync(`${SNAP}/${f}`, 'utf8'));
  const base = new Map(JSON.parse(git('show', `origin/main:${f}`)).map((r) => [r.name, r]));
  for (const r of head) { const b = base.get(r.name); if (!b || b.old !== r.old || b.new !== r.new || b.file !== r.file) out.push(r); }
}
writeFileSync(new URL('./reaimed.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(out.length, 'records;', [...new Set(out.flatMap((r) => r.tests))].length, 'test files');
