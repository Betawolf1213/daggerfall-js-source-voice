// ALLOC1 (2026-10-14) - THE ALLOCATION MEASURE CANNOT RACE THE COMPILER.
// test/allocChild.mjs carries the flags every allocation-measuring child is
// spawned with; this suite holds the flags to their purpose and the suites to
// the flags (bible/09-Testing/Testing.md, ALLOC1).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALLOC_CHILD_ARGS } from './allocChild.mjs';

const TEST_DIR = fileURLToPath(new URL('.', import.meta.url));

// A frame that makes nothing once optimised and boxes a number a frame before:
// the measure's own shape (warm-up, gc twice, the least of eight windows).
const SCRIPT = `
  const out = new Float64Array(4), src = Array.from({ length: 64 }, (_, i) => i * 1.25); src.push('tagged');
  let k = 0;
  const fn = () => { const a = src[(k = (k + 1) & 63)]; out[0] = Math.sqrt(a * a + 1.5) * 0.5 + a / 3; };
  for (let f = 0; f < 200000; f++) fn();
  let least = Infinity;
  for (let w = 0; w < 8; w++) {
    globalThis.gc(); globalThis.gc();
    const h0 = process.memoryUsage().heapUsed;
    for (let f = 0; f < 5000; f++) fn();
    least = Math.min(least, (process.memoryUsage().heapUsed - h0) / 5000);
  }
  console.log(least);
`;
const bytes = (args) => {
  const run = spawnSync(process.execPath, [...args, '--input-type=module', '-e', SCRIPT], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  return Number(run.stdout.trim().split('\n').pop());
};

test('ALLOC1 THE MEASURE OUTLASTS A STARVED COMPILER: with the optimising thread held back five seconds (--concurrent-recompilation-delay, a loaded machine made certain), a frame that makes nothing measures under 2 bytes through ALLOC_CHILD_ARGS - and the control, the same flags without --no-concurrent-recompilation, must show the boxing, or the delay starved nothing and the pin is blind', () => {
  const starve = '--concurrent-recompilation-delay=5000';
  const control = bytes([...ALLOC_CHILD_ARGS.filter((a) => a !== '--no-concurrent-recompilation'), starve]);
  assert.ok(control >= 40, `the control made ${control.toFixed(2)} bytes a frame - the starved compiler never showed`);
  const measured = bytes([...ALLOC_CHILD_ARGS, starve]);
  assert.ok(measured < 2, `${measured.toFixed(2)} bytes a frame through ALLOC_CHILD_ARGS with the compiler starved (the control ${control.toFixed(2)})`);
});

test('ALLOC1 ONE HOME FOR THE CHILD\'S FLAGS: every suite that spawns an allocation-measuring child (--expose-gc) imports ALLOC_CHILD_ARGS from test/allocChild.mjs and spells none of its flags itself - a suite that writes its own list is the one that forgets the compiler', () => {
  const stray = [];
  let measuring = 0;
  for (const f of readdirSync(TEST_DIR).filter((n) => n.endsWith('.test.js') && n !== 'allocchild.test.js').sort()) {
    const src = readFileSync(join(TEST_DIR, f), 'utf8');
    // a measuring child is one that can call gc() - perfcrowd1's '--max-semi-space-size=32' is the desktop shell's own switch, not a child's
    if (!/ALLOC_CHILD_ARGS|'--expose-gc'/.test(src)) continue;
    measuring++;
    if (!/import \{[^}]*\bALLOC_CHILD_ARGS\b[^}]*\} from '\.\/allocChild\.mjs';/.test(src)) stray.push(`${f}: does not import ALLOC_CHILD_ARGS`);
    if (/'--expose-gc'|'--(min|max)-semi-space-size=/.test(src)) stray.push(`${f}: spells a child flag itself`);
  }
  assert.deepEqual(stray, []);
  assert.ok(measuring >= 10, `only ${measuring} measuring suites found - the sweep is reading the wrong tree`);
});
