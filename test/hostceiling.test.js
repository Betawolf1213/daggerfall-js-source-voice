// HOST-SPLIT (2026-10-15, bible/01-Overview/Host-Split.md) - THE HOSTS DO NOT GROW.
//
// Each host keeps its whole state in ONE function's scope, and that scope grew
// faster than anyone could take it apart: bootWorld went from 8,897 lines to
// 35,251 in the month to 2026-10-14. Moving code out of a scope that grows
// ~850 lines a day is a race that cannot be won, so the hosts get ceilings: new
// behaviour goes into a module the host wires (the 31 `*Host.js` modules are the
// shape - `fishHost.js`, `navalHost.js`), and the host's own function does not
// lengthen. Measured with tools/hostScope.mjs's own finder, so the ceiling and
// the map read the same function.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseModule, findHostFunction, lines } from '../tools/hostScope.mjs';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

/** The room a ceiling leaves above its host - a fix's worth, not a feature's. */
const ROOM = 250;
/** Each host's one-scope function and its ceiling: its length when HOST-SPLIT opened, plus ROOM. A slice that moves
 *  code OUT lowers its ceiling in the same change (the second test makes it). Raise one only with the reason written
 *  beside it: the ceiling is the line between wiring a module in and growing the knot. */
const CEILINGS = [
  ['src/scenes/world.js', 'bootWorld', 35_501],
  ['src/scenes/worldModes.js', 'createWorldModes', 13_755],
  ['src/scenes/dungeonContext.js', 'buildDungeonContext', 10_473],
  ['src/scenes/exterior.js', 'bootExterior', 6_333],
  ['server/src/index.js', '_message', 1_678],   // the relay's Room is 473 methods already - its knot is the one dispatcher
];

const measure = (file, fn) => {
  const host = findHostFunction(parseModule(readFileSync(join(ROOT, file), 'utf8')), fn);
  assert.ok(host, `${file} has no function ${fn} - a host renamed is a ceiling to move with it`);
  return lines(host.fn);
};

test('HOST-SPLIT THE HOSTS DO NOT GROW: bootWorld, createWorldModes, buildDungeonContext, bootExterior and the relay\'s _message each stay under their ceiling - new behaviour goes into a module the host wires, not into the host\'s own scope (mutants: a ceiling under its host)', () => {
  const over = [];
  for (const [file, fn, ceiling] of CEILINGS) {
    const n = measure(file, fn);
    if (n > ceiling) over.push(`${file} ${fn}: ${n} lines, over its ceiling ${ceiling} by ${n - ceiling}. Put the new code in a module the host wires (bible/01-Overview/Host-Split.md, THE HOSTS DO NOT GROW; fishHost.js is the shape) - or, for a fix that cannot live elsewhere, raise the ceiling in test/hostceiling.test.js with the reason beside it`);
  }
  assert.deepEqual(over, []);
});

test('HOST-SPLIT A CEILING COMES DOWN WITH ITS HOST: no ceiling stands more than twice ROOM over its host - a slice that moves code out lowers the ceiling in the same change, or the room it freed becomes room to grow back into (mutants: a ceiling left high)', () => {
  const slack = [];
  for (const [file, fn, ceiling] of CEILINGS) {
    const n = measure(file, fn);
    if (ceiling - n > 2 * ROOM) slack.push(`${file} ${fn}: ${n} lines under a ceiling of ${ceiling} - lower it to ${n + ROOM}`);
  }
  assert.deepEqual(slack, []);
});
