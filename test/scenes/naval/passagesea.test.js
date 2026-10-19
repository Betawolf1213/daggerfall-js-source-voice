// PASSAGE (2026-10-19; bible/03-World/Passage.md) - THE SHIP AT HER BERTH (scenes/naval/navalHost.js passageShip,
// charter, charterSailed), over the real host and Come Sail Away's real pool (test/navalSea.mjs): a harbour's own
// friendly ship, moored, on foot within reach and the look on her, takes Activate and asks the passage door; her boat is
// placed at her berth from a deed of her hull, the voyage written on it, and she lies there still until the voyage is
// under way - then she is let go, and not stood at her berth again today.

import '../../modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sea } from '../../navalSea.mjs';
import { PASSAGE_HULLS, PASSAGE_TEXT } from '../../../src/systems/naval/passage.js';
import { BOAT_DEED_TEMPLATE } from '../../../src/systems/shipyards.js';
import { hullBuild } from '../../../src/systems/naval/navalShips.js';

const coast = (x, z) => !(z > 200 || (x > 300 && x < 400 && z > -300));
const PORT = { key: 'port:1', rect: { minX: -100, maxX: 100, minZ: 220, maxZ: 420 } };
const moored = (w) => [...w.host._sea.values()].filter((e) => e.ship.errand?.kind === 'moored' && e.fromHarbour);

/** A port with its ships at their berths, the passage door recording, and a Come Sail Away runtime that places a deed's
 *  boat as a record. Answers the sea and the first ship of a passage hull. */
async function port() {
  const w = await sea({ hull: null, water: coast });
  const asked = [], placed = [];
  w.deps.passage = (ship) => asked.push(ship);
  w.deps.board.mintUid = () => 4242;
  w.deps.csa = () => ({
    state: { AllBoats: [] }, isSailing: () => false,
    LaunchFromDeed: (deed, list, pos, dir) => { placed.push({ deed, list, pos, dir }); return { uid: deed.UID, hull: Math.floor(deed.message / 10), GameObject: { position: pos } }; },
  });
  w.view.feet = [0, 0, 300]; w.deps.harbourNear = () => PORT;
  w.run(1);
  const e = moored(w).find((x) => PASSAGE_HULLS.includes(x.ship.hull));
  assert.ok(e, 'a ship of a passage hull at her berth');
  return { w, e, asked, placed };
}
/** On foot beside her, the look on her (or `away` from her). */
function standBy(w, e, { away = false } = {}) {
  const s = e.ship.pos, beam = hullBuild(e.ship.hull).beam;
  const feet = [s[0] + beam + 4, 0, s[2]];
  w.view.feet = feet;
  w.view.look = { origin: [feet[0], 1.6, feet[2]], dir: away ? [1, 0, 0] : [-1, 0, 0] };
}

test('PASSAGE sea: a harbour\'s own friendly ship at her berth takes Activate on foot and asks the passage door - her number, name, captain and hull; never with the look off her, out of reach, or at a helm (mutants: the look unread; the reach unread; no door asked)', async () => {
  const { w, e, asked } = await port();
  standBy(w, e, { away: true });
  assert.equal(w.host.passageShip(), null, 'the look off her');
  standBy(w, e);
  assert.equal(w.host.passageShip(), e);
  assert.equal(w.host.takesActivate(), true, 'the street hears it as the sea\'s press');
  assert.equal(w.host.activate(), true);
  assert.deepEqual(asked, [{ id: e.id, name: e.ship.names?.name ?? null, captain: e.ship.names?.captain ?? null, hull: e.ship.hull, faction: e.ship.cls.faction }]);
  w.view.feet = [e.ship.pos[0] + hullBuild(e.ship.hull).beam + 40, 0, e.ship.pos[2]];
  w.view.look = { origin: [w.view.feet[0], 1.6, w.view.feet[2]], dir: [-1, 0, 0] };
  assert.equal(w.host.passageShip(), null, 'out of reach');
  w.deps.passage = undefined;
  standBy(w, e);
  assert.equal(w.host.passageShip(), null, 'no door: no ship to book');
});

test('PASSAGE sea: her word as the look comes onto her, once a ship (mutants: never said; said every frame)', async () => {
  const { w, e } = await port();
  standBy(w, e);
  w.run(0.5);
  const hint = PASSAGE_TEXT.hint(e.ship.names?.name ?? null);
  assert.equal(w.log.say.filter((t) => t === hint).length, 1);
});

test('PASSAGE sea: a ship that is not hers to carry me is no passage - a packet, a pirate, one fading out, one under way (mutants: the harbour\'s mark unread; the stance unread; the mooring unread)', async () => {
  const { w, e } = await port();
  standBy(w, e);
  e.fromHarbour = null;
  assert.equal(w.host.passageShip(), null, 'not a harbour\'s own');
  e.fromHarbour = PORT.key;
  const cls = e.ship.cls;
  e.ship.cls = { ...cls, faction: 'pirate' };
  assert.equal(w.host.passageShip(), null, 'no lawful master');
  e.ship.cls = cls;
  e.retiring = true;
  assert.equal(w.host.passageShip(), null, 'fading out');
  e.retiring = false;
  const errand = e.ship.errand;
  e.ship.errand = { ...errand, kind: 'depart' };
  assert.equal(w.host.passageShip(), null, 'under way');
  e.ship.errand = errand;
  assert.equal(w.host.passageShip(), e, 'and herself again');
});

test('PASSAGE sea: her boat at her berth from a deed of her own hull, never into the pack, the voyage written on it - and she lies there still until the voyage is under way; then let go and not stood again today (mutants: the record unwritten; she dropped at the placing; never let go; stood again after a door)', async () => {
  const { w, e, placed } = await port();
  const record = { to: { name: 'Sentinel', px: 130, py: 100 }, ship: 'x', captain: null, fare: 50 };
  const boat = w.host.charter(e.id, record);
  assert.ok(boat);
  assert.equal(boat.charter, record);
  assert.equal(boat.packable, false, 'she never packs - the crossing plans no second launch of her');
  assert.equal(placed.length, 1);
  assert.equal(placed[0].deed.templateIndex, BOAT_DEED_TEMPLATE);
  assert.equal(Math.floor(placed[0].deed.message / 10), e.ship.hull, 'her own hull');
  assert.deepEqual(placed[0].list, [placed[0].deed], 'a list of its own - never the pack or the Fleet\'s book');
  assert.ok(Math.hypot(placed[0].pos[0] - e.ship.pos[0], placed[0].pos[2] - e.ship.pos[2]) < 1, 'at her berth, as she lies');
  assert.ok(w.host._sea.has(e.id), 'she lies there still');
  assert.equal(w.host.charter('nobody', record), null, 'a ship gone: nothing placed');
  const seed = e.ship.seed;
  assert.equal(w.host.charterSailed(e.id), true);
  assert.ok(!w.host._sea.has(e.id), 'let go');
  w.host.clear();   // a door
  w.run(1);
  assert.ok(!moored(w).some((x) => x.ship.seed === seed), 'not stood at her berth again today');
  assert.equal(w.host.charterSailed(e.id), false);
});
