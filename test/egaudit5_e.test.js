// AUDIT EG V (2026-10-15, the Elite Gates arc's fifth audit; bible/11-Multiplayer/Elite-Gates.md sections 11.9, 15, 25 and
// 29) - FIX GROUP E, "render": the spans' collider, the passes' GL objects and their owner, pinned through the real
// producers (the dungeon host's own collider wrapper, a recording GL under the real passes and the breach client):
//   L6-10  a Spirebridge's plank leaves the collider at its end through the dungeon host's own wrapper (egSpanCollider);
//   L6-7   egSpan's clear names the Beat's pictures' owner (egBeatTellDown, the breach's end);
//   L6-5   the fight's telegraph and crystal passes freed on every way out of the Spire (egFight.js leave), and every GL
//          object the breach client makes back to its baseline after ten halls and every exit kind;
//   GLSH   (lane 6's UNVERIFIED shader objects) glProgram.js buildProgram deletes its two shaders once the link is read,
//          and a failed build frees its program and both shaders.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { egHallOf, egCircleOfHall, EG_SEALED_MS } from '../src/net/egLaw.js';
import { egBridgeOf, egBridgeY } from '../src/net/egSpanLaw.js';
import { createEgSpan, egSpanCollider } from '../src/scenes/egSpan.js';
import { registerSpireObjs } from '../src/systems/spireKit.js';
import { realmToDungeon } from '../src/net/sdBrain.js';
import { Collider } from '../src/player/collider.js';

const rd = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

// ── L6-10 ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
test('AUDIT EG V L6-10 A SPIREBRIDGE\'S PLANK LEAVES THE COLLIDER AT ITS END, through the dungeon host\'s own wrapper (sections 15 and 21: "known to the fair trail" - the relay holds the plank as ground until its end, so every screen must too): the spans stood through egSpanCollider - the wrapper scenes/dungeonContext.js egSpanRide hands them - take a plank\'s bucket out at its end, nothing under the gap after, and its key leaves the host\'s list (egRecircle takes the rest at THE SWAP); the host hands no wrapper of its own (mutants: the wrapper\'s removeBucket dropped; the key kept on the list; the host\'s literal wrapper back)', () => {
  const SEED = 1, HALL = 7, spec = egHallOf(SEED, HALL, 0), b0 = egBridgeOf(spec, 0);
  // the host's own line: the spans stand through egSpanCollider, and no hand-built `{ addMesh }` wrapper is left
  const DC = rd('src/scenes/dungeonContext.js');
  const ride = DC.slice(DC.indexOf('function egSpanRide('), DC.indexOf('function egRecircle('));
  assert.match(ride, /egSpan\.stand\(\{ dynamicDraws, collider: egSpanCollider\(collider, keys\) \}\)/, 'the dungeon host stands the spans through egSpanCollider');
  assert.doesNotMatch(ride, /collider: \{ addMesh/, 'no wrapper of the host\'s own');
  assert.match(DC.slice(DC.indexOf('function egRecircle('), DC.indexOf('function egRecircle(') + 900), /for \(const k of keys\) collider\.removeBucket\(k\);/, 'THE SWAP takes what the list still holds');
  const R = { createMesh: (m) => ({ subMeshes: m.subMeshes }), destroyMesh: () => {} };
  const span = createEgSpan({ renderer: R, seed: SEED, c: spec.c }), dynamicDraws = [], collider = new Collider(), keys = [];
  span.stand({ dynamicDraws, collider: egSpanCollider(collider, keys) });
  const nSteps = keys.length;
  assert.ok(nSteps > 20 && keys.every((k) => collider._buckets.has(k)), 'every step\'s bucket stood, and its key kept');
  const objs = { h: HALL, objs: [], br: [{ g: 0, from: 10_000, until: 16_000 }] };
  registerSpireObjs(() => objs);
  try {
    const mid = (b0.z0 + b0.z1) / 2, top = realmToDungeon(spec.x0 + b0.x, egBridgeY(b0, mid), mid);
    const under = () => collider.raycast([top[0], top[1] + 2, top[2]], [0, -1, 0], 2.5);
    span.ride(10.5, 0.016, null, false);
    assert.ok(Math.abs(under() - 2) < 0.02, 'standing: its top under the gap');
    assert.ok(collider._buckets.has('eg:bridge:7:0:10000') && keys.includes('eg:bridge:7:0:10000'), 'its bucket in, its key kept');
    span.ride(16.0, 0.016, null, false);
    assert.equal(span.planks.length, 0, 'gone at its end');
    assert.equal(collider._buckets.has('eg:bridge:7:0:10000'), false, 'its bucket out of the collider');
    assert.ok(!Number.isFinite(under()), 'nothing under the gap');
    assert.equal(keys.includes('eg:bridge:7:0:10000'), false, 'its key off the host\'s list');
    assert.equal(keys.length, nSteps, 'the steps\' keys kept for THE SWAP');
    span.ride(40, 0.016, null, false);
    assert.ok(!Number.isFinite(under()), 'and never again');
  } finally { registerSpireObjs(null); }
});

// ── L6-7 ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
test('AUDIT EG V L6-7 egSpan\'s clear names the Beat\'s pictures\' owner as egBeatTellUp\'s doc does - the breach\'s end (egBeatTellDown), never "the session\'s"', () => {
  const S = rd('src/scenes/egSpan.js'), clear = S.slice(S.indexOf('    clear() {'));
  assert.match(clear, /the Beat's pictures are the breach's, freed at its end - egBeatTellDown/);
  assert.doesNotMatch(S, /the Beat's pictures are the session's/);
});
