// ALLOC1 (2026-10-14): THE ALLOCATION MEASURE'S CHILD, ONE HOME. Ten suites
// spawn a child to count the bytes a frame makes (L2 F9's measure: a fixed
// 64 MB young space, the least of several windows, against a control that must
// show) - and each spelled its flags itself. The measure only reads true once
// the function under it is OPTIMISED, and V8 optimises on a background thread:
// on a loaded machine (CI's four shards, each spawning children of its own on
// four cores) that thread can be starved past the whole warm-up, and the
// windows then count the interpreter's boxed numbers instead of the frame.
// sd25_arena's S7 failed so in a full run (marks: 17.32 bytes a frame) and
// passed alone. --no-concurrent-recompilation compiles on the main thread
// when the function turns hot, so the warm-up ends optimised however busy the
// machine is (test/allocchild.test.js proves it under an artificial delay).
// Every suite that measures allocation spawns its child with these.
export const ALLOC_CHILD_ARGS = Object.freeze([
  '--expose-gc',
  '--min-semi-space-size=64',
  '--max-semi-space-size=64',
  '--no-concurrent-recompilation',
]);
