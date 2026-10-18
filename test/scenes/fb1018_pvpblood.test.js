// FIELD BUGS 2026-10-18 PVP-BLOOD (bible/01-Overview/bugs/Field-Bugs-2026-10-18.md, found reading Anon-e-moose's
// "Gradual FPS loss then crash" and left in its first pass). A duel's blow and the open zone's both splashed into the
// street's pool (`hitEffects`), which only the street's frame ticks and draws, and whose marks are the street's ring on
// the street's collider. A blow of mine in a room or the zone's halls bled nowhere I stood: the splash sat frozen until
// I stepped out, and its mark went into the street's ring at the room's coordinates. A peer's blow already took the
// pool I stand in (`modes.liveHitEffects`, PEERFX2); these take it too. Source pins: bootWorld is not run in Node.
import '../modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rd = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const LIVE = '(modes?.liveHitEffects?.() ?? hitEffects).showBloodSplash(';
const BARE = /(?<![\w.)])hitEffects\.showBloodSplash\(/g;
/** The body of the arrow `head` opens in world.js, to the first line that closes it at its own indent. */
const body = (src, head) => {
  const at = src.indexOf(head);
  assert.ok(at > 0, `${head} is in world.js`);
  const end = src.indexOf('\n  };\n', at);
  assert.ok(end > at, `${head} closes`);
  return src.slice(at, end);
};

test('PVP-BLOOD THE POOL I STAND IN: a duel\'s blow and the open zone\'s splash through the live pool (the room\'s indoors, the dungeon\'s in a dungeon, the street\'s outside), as a peer\'s blow does - never into the street\'s pool from wherever I stand', () => {
  const src = rd('src/scenes/world.js');
  for (const head of ['const duelHpIn = (g) => {', 'const wildHpIn = (g) => {']) {
    const b = body(src, head);
    assert.ok(b.includes(LIVE), `${head} splashes into the live pool`);
    assert.doesNotMatch(b, BARE, `${head} splashes into the street's pool`);
  }
  // the seam both take, and the peer's blows beside them
  const modes = rd('src/scenes/worldModes.js');
  assert.match(modes, /liveHitEffects\(\) \{ return mode === 'dungeon' \? \(dungeonCtx\?\.hitEffects \?\? null\) : mode === 'interior' \? interiorHitEffects : null; \},/);
  assert.equal(src.split('(modes?.liveHitEffects?.() ?? hitEffects).showBloodSplash(').length - 1, 4, 'the peer\'s blow and hurt, the duel\'s and the zone\'s');
});

test('PVP-BLOOD THE STREET\'S OWN: the only splashes world.js sends straight to the street\'s pool are on paths that run in the street alone - a road traveller struck down (livingStrikeRoad, refused off the exterior) and a horse\'s trample (rrRiding)', () => {
  const src = rd('src/scenes/world.js');
  const at = [...src.matchAll(BARE)].map((m) => m.index);
  assert.equal(at.length, 2, 'a new splash straight into the street\'s pool - is its path the street\'s alone?');
  const road = body(src, 'const livingStrikeRoad = (eye, dir) => {');
  assert.match(road, /_mode\(\) !== 'exterior'\) return false;/);
  assert.ok(at[0] > src.indexOf('const livingStrikeRoad = (eye, dir) => {') && at[0] < src.indexOf('const livingStrikeRoad = (eye, dir) => {') + road.length);
  assert.ok(src.lastIndexOf('const rrRiding = createRrRidingContacts({', at[1]) > at[0]);
  assert.match(src.slice(at[1] - 40, at[1]), /splashBlood: \(pos, fwd\) => $/);
});
