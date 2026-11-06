// test/killTracker.test.js — QAE3 class-level kill tally.
import test from 'node:test';
import assert from 'node:assert/strict';
import { KillTracker, globalKillTracker, setGlobalKillTracker, setKillPlaceProvider } from '../src/systems/quest/killTracker.js';

test('recordKill increments the class count', () => {
  const t = new KillTracker();
  t.recordKill('Giant_rat', null);
  t.recordKill('Giant_rat', null);
  assert.equal(t.killCount('Giant_rat'), 2);
});

test('killCount with a place only counts that place', () => {
  const t = new KillTracker();
  t.recordKill('Giant_rat', 'cellar');
  t.recordKill('Giant_rat', 'cave');
  t.recordKill('Giant_rat', 'cellar');
  assert.equal(t.killCount('Giant_rat'), 3);          // anywhere
  assert.equal(t.killCount('Giant_rat', 'cellar'), 2); // at cellar
  assert.equal(t.killCount('Giant_rat', 'cave'), 1);
  assert.equal(t.killCount('Giant_rat', 'attic'), 0);
});

test('place provider tags kills automatically', () => {
  const t = new KillTracker();
  setGlobalKillTracker(t);
  setKillPlaceProvider(() => 'dungeon0');
  t.recordKill('Giant_rat'); // place from provider
  assert.equal(t.killCount('Giant_rat', 'dungeon0'), 1);
  setKillPlaceProvider(null);
});

test('explicit place overrides the provider', () => {
  const t = new KillTracker();
  setKillPlaceProvider(() => 'providerPlace');
  t.recordKill('Giant_rat', 'explicit');
  assert.equal(t.killCount('Giant_rat', 'explicit'), 1);
  assert.equal(t.killCount('Giant_rat', 'providerPlace'), 0);
  setKillPlaceProvider(null);
});

test('save/restore round-trips', () => {
  const t = new KillTracker();
  t.recordKill('Giant_rat', 'cellar');
  t.recordKill('Orc', null);
  const data = t.getSaveData();
  const t2 = new KillTracker();
  t2.restoreSaveData(JSON.parse(JSON.stringify(data)));
  assert.equal(t2.killCount('Giant_rat', 'cellar'), 1);
  assert.equal(t2.killCount('Orc'), 1);
});

test('killCount ignores empty class', () => {
  const t = new KillTracker();
  t.recordKill('', null);
  assert.equal(t.killCount(''), 0);
});
