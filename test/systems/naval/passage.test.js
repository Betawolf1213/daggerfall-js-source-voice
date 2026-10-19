// PASSAGE (2026-10-19; the owner: "Add the ability to buy and ride a friendly boat (if one is docked) at any port. You
// can have the ability to choose where you want to sail. A new form of immersive travel"; bible/03-World/Passage.md) -
// THE LAW (systems/naval/passage.js). Pinned here:
//   - THE HULLS: a sail to cross a sea - the Large Boat, the Small Ship, the Carrack; never the Rowboat or the galley.
//   - THE FARE: Daggerfall's ship (travel.js calculateTripCost's travelShip arm) over every pixel of the voyage - 25 gold
//     a 24 pixels and 25 more, never under 25; the longest axis counted, as the travel walk counts.
//   - THE PORTS: every port the player knows but the one they stand at, nearest first and then by name, each with its
//     fare and its bearing in the eight winds.
//   - THE RECORD: what a save hands back is read through charterRecord - a port's name and pixel, or nothing.

import '../../modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PASSAGE_HULLS, PASSAGE_LEAVE_M, PASSAGE_RESUMES, passagePixels, passageFare, passageWind, passageDestinations, charterRecord, PASSAGE_TEXT, passageHintText,
} from '../../../src/systems/naval/passage.js';
import { HULL } from '../../../src/systems/naval/navalShips.js';
import { calculateTripCost } from '../../../src/systems/travel/travel.js';
import { BERTH_HULLS } from '../../../src/systems/naval/shipLife.js';
import { FOOT_BOARD_M } from '../../../src/scenes/naval/navalHost.js';

test('PASSAGE: the hulls that carry a passenger - a sail to cross a sea, and a berth to lie at (mutants: the Rowboat carried; the galley carried)', () => {
  assert.deepEqual([...PASSAGE_HULLS], [HULL.LargeBoat, HULL.SmallShip, HULL.Carrack]);
  assert.ok(!PASSAGE_HULLS.includes(HULL.Rowboat), 'her lone rower tires a kilometre out');
  assert.ok(!PASSAGE_HULLS.includes(HULL.LargeGalley), 'a galley never moors');
  for (const h of PASSAGE_HULLS) assert.ok(BERTH_HULLS.includes(h), `hull ${h} lies at a berth`);
  assert.ok(PASSAGE_LEAVE_M > FOOT_BOARD_M, 'a step onto the quay to look back at her is not leaving her');
  assert.ok(PASSAGE_RESUMES >= 1);
});

test('PASSAGE: the fare is Daggerfall\'s ship over every pixel of the voyage - 25 gold a 24 pixels and 25 more, the longest axis counted (mutants: the ocean\'s share alone; the shorter axis; no floor)', () => {
  const from = { x: 100, y: 200 };
  assert.equal(passagePixels(from, { x: 110, y: 230 }), 30, 'the longest axis');
  assert.equal(passagePixels(from, { x: 70, y: 205 }), 30);
  for (const d of [1, 23, 24, 47, 48, 100]) {
    assert.equal(passageFare(from, { x: 100 + d, y: 200 }), calculateTripCost(0, d, { travelShip: true }).totalCost, `${d} pixels: the travel law's own`);
    assert.equal(passageFare(from, { x: 100 + d, y: 200 }), 25 * (Math.trunc(d / 24) + 1));
  }
  assert.equal(passageFare(from, from), 25, 'never under one sea day');
  assert.equal(passageFare(from, { x: 148, y: 230 }), 75, '48 pixels on its longest axis');
});

test('PASSAGE: the eight winds - north up the map (y runs south), a quarter turn east (mutants: y read north; the winds turned)', () => {
  const o = { x: 50, y: 50 };
  const at = (dx, dy) => passageWind(o, { x: 50 + dx, y: 50 + dy });
  assert.deepEqual([at(0, -9), at(9, -9), at(9, 0), at(9, 9), at(0, 9), at(-9, 9), at(-9, 0), at(-9, -9)],
    ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west']);
  assert.equal(at(9, -2), 'east', 'nearest wind');
  assert.equal(at(0, 0), '');
});

test('PASSAGE: her master\'s ports - every port known but the one I stand at, nearest first then by name, each with its fare and bearing (mutants: the port I stand at listed; an unknown one listed; the far first)', () => {
  const ports = [
    { key: '130,100', name: 'Sentinel', px: 130, py: 100 },
    { key: '100,100', name: 'Daggerfall', px: 100, py: 100 },
    { key: '100,90', name: 'Anticlere', px: 100, py: 90 },
    { key: '90,100', name: 'Betony', px: 90, py: 100 },
    { key: '160,40', name: 'Wayrest', px: 160, py: 40 },
    { key: '0,0', name: '', px: 0, py: 0 },
    null,
  ];
  const here = { x: 100, y: 100 };
  const list = passageDestinations(ports, here, { hereKey: '100,100', known: (p) => p.name !== 'Wayrest' });
  assert.deepEqual(list.map((d) => d.port.name), ['Anticlere', 'Betony', 'Sentinel'], 'never the port I stand at, an unknown one or a nameless one; ties by name');
  assert.deepEqual(list.map((d) => [d.pixels, d.fare, d.bearing]), [[10, 25, 'north'], [10, 25, 'west'], [30, 50, 'east']]);
  assert.deepEqual(passageDestinations(ports, here).map((d) => d.port.name), ['Daggerfall', 'Anticlere', 'Betony', 'Sentinel', 'Wayrest'], 'no port held back: every port');
  assert.deepEqual(passageDestinations(null, here), []);
  assert.equal(PASSAGE_TEXT.row(list[2]), 'Sentinel - east, 50 gold');
});

test('PASSAGE: the voyage\'s record is a port\'s name and pixel, or nothing - what a save hands back is read through it (mutants: a nameless port kept; the pixel unread)', () => {
  assert.deepEqual(charterRecord({ to: { name: 'Sentinel', px: 130.7, py: 100 }, ship: 'The Fair Silk', captain: 'Ana Rhea', fare: 50.9 }),
    { to: { name: 'Sentinel', px: 130, py: 100 }, ship: 'The Fair Silk', captain: 'Ana Rhea', fare: 50 });
  assert.deepEqual(charterRecord({ to: { name: 'Sentinel', px: 1, py: 2 } }), { to: { name: 'Sentinel', px: 1, py: 2 }, ship: null, captain: null, fare: 0 });
  for (const bad of [null, {}, { to: {} }, { to: { name: '', px: 1, py: 1 } }, { to: { name: 'X', px: NaN, py: 1 } }, { to: { name: 'X', px: 1 } }]) assert.equal(charterRecord(bad), null, JSON.stringify(bad));
});

test('PASSAGE: the words - her name with its own article, the purse beside the fare, the passage\'s end said in the question', () => {
  assert.equal(passageHintText('The Fair Silk'), 'The Fair Silk lies at her berth - Activate to book passage.');
  assert.equal(passageHintText(null), 'The ship lies at her berth - Activate to book passage.');
  const ask = PASSAGE_TEXT.ask('Dibella\'s Grace', 'Sentinel', 50, 120);
  assert.equal(ask[0], 'Book passage on Dibella\'s Grace to Sentinel?');
  assert.equal(ask[1], 'The fare is 50 gold. You have 120.');
  assert.match(ask[2], /Step off her and the passage ends/);
  assert.equal(PASSAGE_TEXT.booked('The Fair Silk', 'Ana Rhea', 50, 'Sentinel'), 'Captain Ana Rhea takes your 50 gold. The Fair Silk sails for Sentinel.');
  assert.equal(PASSAGE_TEXT.booked(null, null, 25, 'Sentinel'), 'Her master takes your 25 gold. The ship sails for Sentinel.');
});
