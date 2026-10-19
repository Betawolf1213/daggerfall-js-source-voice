// DOC lane: every mutant record the branch added or re-aimed - does `old` match exactly once in its file, and what moved.
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const git = (...a) => execFileSync('git', ['-C', SNAP, ...a], { encoding: 'utf8', maxBuffer: 1 << 26 });
const files = git('diff', '--name-only', 'origin/main...HEAD', '--', 'tools/mutants/').trim().split('\n');
const count = (hay, needle) => { let n = 0, i = 0; while ((i = hay.indexOf(needle, i)) >= 0) { n++; i += needle.length || 1; } return n; };
let changed = 0;
for (const f of files) {
  const head = JSON.parse(readFileSync(`${SNAP}/${f}`, 'utf8'));
  let base = [];
  try { base = JSON.parse(git('show', `origin/main:${f}`)); } catch {}
  const byName = new Map(base.map((r) => [r.name, r]));
  for (const r of head) {
    const b = byName.get(r.name);
    if (b && b.old === r.old && b.new === r.new && b.file === r.file && JSON.stringify(b.tests) === JSON.stringify(r.tests) && b.note === r.note) continue;
    changed++;
    const path = `${SNAP}/${r.file}`;
    const src = existsSync(path) ? readFileSync(path, 'utf8') : null;
    const n = src == null ? 'NOFILE' : count(src, r.old);
    const moved = !b ? 'NEW' : [b.old !== r.old && 'old', b.new !== r.new && 'new', b.file !== r.file && 'file', b.note !== r.note && 'note', JSON.stringify(b.tests) !== JSON.stringify(r.tests) && 'tests'].filter(Boolean).join('+');
    const flag = n === 1 ? '' : '  <<<<<';
    console.log(`${f.split('/').pop()} | ${r.name} | ${moved} | matches=${n}${flag}${r.new === r.old ? ' NEW==OLD' : ''}`);
    if (b && b.old !== r.old) console.log(`    old- ${b.old.slice(0, 160)}\n    old+ ${r.old.slice(0, 160)}\n    new  ${r.new.slice(0, 160)}`);
    if (b && b.note !== r.note) console.log(`    note+ ${String(r.note ?? '').slice(0, 300)}`);
  }
}
console.log('records added or changed:', changed);
