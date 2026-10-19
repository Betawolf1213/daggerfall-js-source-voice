// AUDIT PASSAGE (2026-10-19; bible/01-Overview/audits/Audit-Passage-Batch-Salvage.md) - lane B's integration findings,
// pinned: a booked ship is never the DFU bank ship's cabin, never a sailing cabin of mine; the world host counts a
// boarding from her as aboard, holds her through a world's move, tells her master where a journey goes, and asks the
// crossing law of a hull before her master offers her.

import '../../modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bankCabinCandidates } from '../../../src/systems/boatCabinOwnership.js';
import { hasSailingCabin, cabinShipType } from '../../../src/systems/sailingCabin.js';

const read = (p) => readFileSync(new URL(`../../../${p}`, import.meta.url), 'utf8');
const VOYAGE = { to: { name: 'Sentinel', px: 130, py: 100 }, ship: null, captain: null, fare: 25 };

test('AUDIT PASSAGE B1/B4: A BOOKED SHIP IS NO CABIN OF MINE - the DFU bank ship\'s cabin is never linked to her (she was the one candidate, the furnished cabin moved into her and lost when she sailed on), and she has no sailing cabin to put things in (mutants: the bank cabin linked to her; her cabin mine)', () => {
  const hull = [2, 4].find((h) => cabinShipType(h) === 0) ?? 2;
  const type = cabinShipType(hull);
  const booked = { uid: 9001, hull, inside: false, charter: VOYAGE, GameObject: { activeSelf: true } };
  const mine = { uid: 9002, hull, inside: false, charter: null, GameObject: { activeSelf: true } };
  assert.deepEqual(bankCabinCandidates(type, [booked]), [], 'never a candidate');
  assert.deepEqual(bankCabinCandidates(type, [booked, mine]).map((b) => b.uid), [9002], 'a ship of mine is');
  assert.equal(hasSailingCabin(booked), false, 'no cabin of mine in her');
  assert.equal(hasSailingCabin(mine), hasSailingCabin({ ...booked, charter: null }), 'the same hull of mine as ever');
});

test('AUDIT PASSAGE B2/B3/B7 by source: the world host\'s doors - a boarding from her counts as aboard (the naval host\'s boatInPlay), a world\'s move holds her frame, her master is told where the journey goes, and a hull is offered only where this helm crosses a sea in her (mutants: boarding from her off her; the crossing unwired)', () => {
  const world = read('src/scenes/world.js');
  assert.match(world, /aboard: \(b\) => csaRuntime\?\.state\?\.CurrentBoat === b \|\| csaStandsOn\(b\) \|\| naval\?\.boatInPlay\?\.\(\) === b, busy: \(\) => worldMoveBusy\(\), journeyTo: \(\) => tvTrip\.plan\?\.summary\?\.pixel \?\? \(tvTrip\.plan \? 'spot' : null\),/);
  assert.match(world, /passage: \(ship\) => passage\?\.offer\(ship\), passageCrosses: \(h\) => tvSeaCrosses\(csa\.hullRig\?\.\(h\)\),/);
});

test('AUDIT PASSAGE (lane D) by source: my own gangway is the first press at a quay, the passage the next; the fare comes out of the purse by its own law - coins, then letters of credit (court.js deductGold) (mutants: the gangway not first; the fare never deducted)', () => {
  assert.match(read('src/scenes/naval/navalHost.js'), /const p = e \|\| boatTrigger \|\| gangwayInReach\(\) \? null : passageShip\(\);[^\n]*\n {4}if \(p\) \{ deps\.passage\(/);
  assert.match(read('src/scenes/world.js'), /const passage = createPassageHost\(\{[^]*?gold: \(\) => totalGoldAmount\(playerEntity\), pay: \(n\) => \{ deductGold\(playerEntity, n\); surfacePlayer\(\); \}/);
});
