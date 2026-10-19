// LAIR-WALK (FIELD BUGS 2026-10-19; bible/01-Overview/bugs/Field-Bugs-2026-10-19.md): A REVENANT AT HOME STANDS WHERE A
// WALK FROM THE WAY IN REACHES. LAIR-REACH took the lair's end off the border caps (SD-REACH's candidates - an interior
// block's enemy markers, out of the water); an interior marker could still stand in a pocket no walk reaches, which only a
// walk over the floor can tell. The dungeon bakes that floor already (ENHANCED AI 3b's navmesh - on by default, and always
// online): the lair waits for it (LAIR_WALK_WAIT_MS at most), asks a path on it from where I came in to each candidate,
// the farthest first (ai/nav/navmesh.js findPath - the navmesh's one entry point; LAIR_WALK_TRIES of them at most), and
// stands its revenant at the first one a path reaches (world/dungeon/dungeonEnd.js reachableEndOf).
// With no navmesh - the Enhanced AI off offline, a bake that failed or never landed - or none on it, SD-REACH's end, the
// Rift's own. The Rift keeps SD-REACH alone: it stands the same on every client, and a client's bake is anchored on its own
// feet. tools/mutants/lair_walk.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { findPath } from '../../../src/ai/nav/navmesh.js';
import { bakeNavFromCollider } from '../../../src/ai/nav/navBake.js';
import { reachableEndOf, dungeonEndOf, LAIR_WALK_WAIT_MS, LAIR_WALK_TRIES } from '../../../src/world/dungeon/dungeonEnd.js';

const IDENTITY = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
const read = (p) => readFileSync(new URL(`../../../${p}`, import.meta.url), 'utf8');

/** A triangle soup (test/ai/nav/audit0928_nav.test.js's): a floor quad, and a room - floor, ceiling and four walls. */
function soup() {
  const P = [], I = [];
  const quad = (a, b, c, d) => { const s = P.length / 3; P.push(...a, ...b, ...c, ...d); I.push(s, s + 1, s + 2, s, s + 2, s + 3); };
  const room = (x0, x1, z0, z1, y, h = 3) => {
    quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]); quad([x0, y + h, z0], [x0, y + h, z1], [x1, y + h, z1], [x1, y + h, z0]);
    for (const [a, b] of [[[x0, z0], [x1, z0]], [[x1, z0], [x1, z1]], [[x1, z1], [x0, z1]], [[x0, z1], [x0, z0]]]) quad([a[0], y, a[1]], [b[0], y, b[1]], [b[0], y + h, b[1]], [a[0], y + h, a[1]]);
  };
  return { P, I, quad, room };
}
async function colliderOf(s) {
  const { Collider } = await import('../../../src/player/collider.js');
  const c = new Collider(() => -Infinity);
  c.addMesh('dungeon', new Float32Array(s.P), new Uint32Array(s.I), IDENTITY);
  return c;
}

test('LAIR-WALK the walk the lair asks, on a real bake: a path from the way in reaches the far end of the hall it opens on - never a sealed room beside it, though the bake keeps that room (a marker anchors it)', async () => {
  const s = soup();
  s.quad([0, 0, 0], [40, 0, 0], [40, 0, 10], [0, 0, 10]);   // the hall: the way in at one end, a marker at the other
  s.room(60, 70, 0, 10, 0);                                 // a sealed room: a marker in it, no way to it
  const collider = await colliderOf(s);
  const IN = [2, 0, 5], FAR = [36, 0, 5], SEALED = [65, 0, 5];
  const bake = bakeNavFromCollider(collider, { anchor: IN, anchors: [FAR, SEALED] });
  const walk = (p) => !!findPath(bake.chf, IN, p);
  assert.deepEqual([walk(FAR), walk(SEALED)], [true, false], 'the hall\'s far end, never the sealed room');
  assert.equal(reachableEndOf({ x: IN[0], z: IN[2] }, [{ x: 36, y: 0, z: 5 }, { x: 65, y: 0, z: 5 }], (m) => walk([m.x, m.y, m.z])).x, 36, 'the lair\'s end on it: the hall\'s, though the sealed room is farther');
});

test('LAIR-WALK the end a walk reaches: the farthest candidate the walk reaches, the farthest asked first, a tie keeping the list\'s order, LAIR_WALK_TRIES asked at most; none reaching, none; no walk, the marker law (dungeonEndOf) (mutants: the walk unread; the nearest first; a tie reordered; the tries unbounded)', () => {
  const from = { x: 0, z: 0 };
  const near = { x: 10, z: 0 }, mid = { x: 20, z: 0 }, tieA = { x: 0, z: 30 }, tieB = { x: 30, z: 0 }, sealed = { x: 50, z: 0 };
  const marks = [near, tieA, mid, sealed, tieB];
  const asked = [];
  const reaches = (m) => { asked.push(m); return m !== sealed; };
  assert.equal(reachableEndOf(from, marks, reaches), tieA, 'the sealed one passed by; of two as far, the first listed');
  assert.deepEqual(asked, [sealed, tieA], 'the farthest asked first, and no more than needed');
  assert.equal(reachableEndOf(from, marks, () => false), null, 'none reaches: none');
  assert.equal(reachableEndOf(from, marks, null), dungeonEndOf(from, marks), 'no walk: the marker law');
  assert.equal(reachableEndOf(from, marks), sealed);
  assert.equal(reachableEndOf(from, [{ x: NaN, z: 0 }, near], () => true), near, 'a placeless marker none');
  assert.equal(reachableEndOf(from, marks, reaches, { tries: 1 }), null, 'one try: the farthest alone, and it is sealed');
  const many = Array.from({ length: 20 }, (_, i) => ({ x: 100 - i, z: 0 }));
  let n = 0;
  assert.equal(reachableEndOf(from, many, () => { n++; return false; }), null);
  assert.equal(n, LAIR_WALK_TRIES, 'a failing walk asked LAIR_WALK_TRIES times, never every marker');
  assert.deepEqual([LAIR_WALK_WAIT_MS, LAIR_WALK_TRIES], [20000, 6]);
});

test('LAIR-WALK the host: the bake anchored where I came in and said landed or failed; the lair asked once that has happened - or at once with no bake coming, or past LAIR_WALK_WAIT_MS; its end the farthest a walk reaches, else SD-REACH\'s; the Rift\'s end never the walk\'s (mutants: the lair not waiting; no bound; never landed; no anchor; the walk unasked; the Rift on a client\'s own walk)', () => {
  const D = read('src/scenes/dungeonContext.js');
  assert.match(D, /enhancedNav\.requested = true;\n\s*enhancedNav\.anchor = \[playerFeet\[0\], playerFeet\[1\], playerFeet\[2\]\];/);
  assert.match(D, /\.catch\(\(e\) => console\.warn\('\[enhanced-ai\] navmesh bake failed - classic motor stands:', e\?\.message \?\? e\)\)\n\s*\.finally\(\(\) => \{ enhancedNav\.settled = true; \}\);/);
  const bakeAt = D.indexOf('enhancedNav.requested = true;'), askAt = D.indexOf('{ _lairAsked = true; standLairRevenant().catch(() => null); }');
  assert.ok(bakeAt > 0 && askAt > bakeAt, 'the lair asked after the bake is asked for, in the frame');
  assert.match(D, /if \(playerFeet && !_lairAsked && \(!enhancedNav\.requested \|\| enhancedNav\.settled \|\| Date\.now\(\) - \(_lairWaitFrom \?\?= Date\.now\(\)\) > LAIR_WALK_WAIT_MS\)\) \{ _lairAsked = true; standLairRevenant\(\)\.catch\(\(\) => null\); \}/);
  assert.equal(D.match(/standLairRevenant\(\)\.catch/g)?.length, 1, 'asked in one place');
  const lair = D.slice(D.indexOf('async function standLairRevenant() {'), D.indexOf('function standDungeonBand('));
  assert.match(lair, /const walk = enhancedNav\.chf && enhancedNav\.anchor \? \(m\) => !!findPath\(enhancedNav\.chf, enhancedNav\.anchor, floorLanding\(collider, \[m\.x, m\.y \+ 0\.2, m\.z\]\)\) : null;\n\s*const far = \(walk && dungeonEnd\(walk\)\) \|\| dungeonEnd\(\);/);
  assert.match(D, /function dungeonEnd\(reaches = null\) \{\n\s*return reachableEndOf\(dungeon\.enterMarker \?\? dungeon\.startMarker \?\? null, sdEndMarks\(_layoutEnemies, dungeon\.blocks, \(m\) => floorLanding\(collider, \[m\.x, m\.y \+ 0\.2, m\.z\]\)\[1\]\), reaches\);/);
  const rift = D.slice(D.indexOf('function standSdEnd() {'), D.indexOf('const probe = {', D.indexOf('function standSdEnd() {')));
  assert.match(rift, /const end = dungeonEnd\(\);/, 'the Rift: the same on every client, never one client\'s walk');
});
