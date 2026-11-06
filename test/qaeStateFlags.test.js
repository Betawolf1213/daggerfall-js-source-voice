// test/qaeStateFlags.test.js — CurrentStateIs mapping + symbol bridge.
import test from 'node:test';
import assert from 'node:assert/strict';
import { playerStateFlag, innerSymbolName } from '../src/systems/quest/qaeStateFlags.js';

test('playerStateFlag reads the matching fact', () => {
  assert.equal(playerStateFlag('godMode', { godMode: true }), true);
  assert.equal(playerStateFlag('resting', { resting: true }), true);
  assert.equal(playerStateFlag('vampire', { vampire: true }), true);
  assert.equal(playerStateFlag('werewolf', { werewolf: true }), true);
});

test('playerStateFlag is false when the fact is absent', () => {
  assert.equal(playerStateFlag('godMode', {}), false);
  assert.equal(playerStateFlag('resting', {}), false);
});

test('playerStateFlag unknown flag is false', () => {
  assert.equal(playerStateFlag('flying', { flying: true }), false);
});

test('playerStateFlag does not cross-read another flag', () => {
  assert.equal(playerStateFlag('resting', { godMode: true }), false);
});

test('innerSymbolName strips outer underscores', () => {
  assert.equal(innerSymbolName('_aFoe_'), 'aFoe');
  assert.equal(innerSymbolName('_cellar_'), 'cellar');
  assert.equal(innerSymbolName('plain'), 'plain');
  assert.equal(innerSymbolName(''), '');
});
