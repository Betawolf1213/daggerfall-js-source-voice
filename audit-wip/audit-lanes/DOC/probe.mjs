// DOC lane: PROBE MUTANTS. Each record { name, file, old, new, tests[] } is applied to the snapshot (old must occur exactly
// once), the tests run, the verdict recorded, and the file RESTORED with `git checkout -- <file>` before the next.
// The snapshot is shared with the other lanes: a probe waits for its own file to be clean before it applies, checks it
// clean after, and notes any OTHER file dirty during its run (another lane's probe) - a death seen then is re-run.
//   node probe.mjs <list.json> [name...]
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const QL_TESTS = ['test/systems/questlines/ql11_acts.test.js', 'test/systems/questlines/ql12_ladders.test.js', 'test/systems/questlines/ql12_lines.test.js', 'test/systems/questlines/ql1_layer.test.js', 'test/systems/questlines/ql1_sheets.test.js', 'test/systems/questlines/ql4_actions.test.js', 'test/systems/questlines/ql4_branches.test.js', 'test/ui/questlines/ql2_journal.test.js', 'test/server/ql12_claim.test.js'];
const args = process.argv.slice(2);
const extra = args.includes('--wide') ? JSON.parse(readFileSync(new URL('./probes/wide.json', import.meta.url), 'utf8')) : [];
const [listPath, ...only] = args.filter((a) => a !== '--wide');
const list = JSON.parse(readFileSync(listPath, 'utf8')).filter((m) => !only.length || only.includes(m.name));
const dirty = () => execFileSync('git', ['-C', SNAP, 'status', '--porcelain'], { encoding: 'utf8' }).trim();
const fileClean = (f) => spawnSync('git', ['-C', SNAP, 'diff', '--quiet', '--', f]).status === 0;
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const results = [];
for (const m of list) {
  for (let i = 0; !fileClean(m.file); i++) { if (i > 120) { console.error(`${m.file} stays dirty (another lane?) - stop`); process.exit(2); } sleep(5000); }
  const path = `${SNAP}/${m.file}`;
  const src = readFileSync(path, 'utf8');
  const n = src.split(m.old).length - 1;
  if (n !== 1) { console.log(`${m.name}: old occurs ${n} times - not applied`); results.push({ name: m.name, verdict: `NOT APPLIED (${n})` }); continue; }
  const tests = [...new Set([...QL_TESTS, ...(m.tests ?? []), ...extra])];
  let verdict, failing = [], others = '';
  try {
    writeFileSync(path, src.replace(m.old, m.new));
    const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...tests], { cwd: SNAP, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 1_800_000 });
    others = dirty().split('\n').filter((l) => l && !l.endsWith(m.file)).join(', ');
    const out = r.stdout + r.stderr;
    const fail = Number(/^# fail (\d+)/m.exec(out)?.[1] ?? NaN);
    failing = [...out.matchAll(/^\s*not ok \d+ - (.*)$/gm)].map((x) => x[1]).filter((t) => !/\.test\.js$/.test(t)).slice(0, 4);
    verdict = fail > 0 ? `DIED (${fail} failing)` : fail === 0 ? 'SURVIVED' : `NO VERDICT (exit ${r.status})`;
  } finally {
    execFileSync('git', ['-C', SNAP, 'checkout', '--', m.file]);
  }
  if (!fileClean(m.file)) { console.error('NOT RESTORED', m.file); process.exit(2); }
  console.log(`${m.name}: ${verdict} [${tests.length} files]${failing.length ? `  <- ${failing.map((f) => f.slice(0, 90)).join(' | ')}` : ''}${others ? `  (others dirty: ${others})` : ''}`);
  results.push({ name: m.name, file: m.file, verdict, failing, tests: tests.length, others });
}
writeFileSync(listPath.replace(/\.json$/, only.length ? '.partial.results.json' : '.results.json'), JSON.stringify(results, null, 1));
