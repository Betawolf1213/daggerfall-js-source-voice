// debugStart.test.js — Q6 gate: URL-param quest start and jump-site selection.
import test from 'node:test';
import assert from 'node:assert/strict';
import { tryDebugStart, debugUrl } from '../src/systems/quest/debugStart.js';

const fakeQuest = (name, resources = []) => ({
  uid: 42, questName: name, resources: new Map(resources.map((r, i) => [i, r])),
});
const fakeMachine = (quests = new Map()) => ({
  startQuestByName(name) { return quests.get(name) ?? null; },
  getAllActiveQuestSites() { return []; },
});

test('no ?quest param: does nothing', () => {
  const r = tryDebugStart({ machine: fakeMachine() }, { search: '?classic=1' });
  assert.equal(r.started, false);
});

test('missing quest source: warns and returns failed', () => {
  const machine = fakeMachine();
  const r = tryDebugStart({ machine }, { search: '?quest=NOPE' });
  assert.equal(r.started, false);
  assert.equal(r.questName, 'NOPE');
  assert.equal(r.note, 'start failed');
});

test('starts the named quest', () => {
  const q = fakeQuest('FORAGB00');
  const machine = fakeMachine(new Map([['FORAGB00', q]]));
  const r = tryDebugStart({ machine }, { search: '?quest=FORAGB00&jump=none' });
  assert.equal(r.started, true);
  assert.equal(r.questName, 'FORAGB00');
  assert.equal(r.site, null);
  assert.equal(r.jump, 'none');
});

test('jump=site returns the first Place site', () => {
  const site = { name: 'Farm', regionName: 'Daggerfall' };
  const q = fakeQuest('FORAGB00', [
    { kind: 'Person', isQuestor: false },
    { kind: 'Place', site },
  ]);
  const machine = fakeMachine(new Map([['FORAGB00', q]]));
  const r = tryDebugStart({ machine }, { search: '?quest=FORAGB00&jump=site' });
  assert.equal(r.started, true);
  assert.equal(r.site?.name, 'Farm');
  assert.equal(r.jump, 'site');
});

test('jump=giver returns the questor person place', () => {
  const giverSite = { name: 'Tavern' };
  const q = fakeQuest('S0000001', [
    { kind: 'Person', isQuestor: true, place: giverSite },
    { kind: 'Place', site: { name: 'Other' } },
  ]);
  const machine = fakeMachine(new Map([['S0000001', q]]));
  const r = tryDebugStart({ machine }, { search: '?quest=S0000001&jump=giver' });
  assert.equal(r.site?.name, 'Tavern');
});

test('jump=giver falls back to first place if giver has no place', () => {
  const q = fakeQuest('S0000001', [
    { kind: 'Person', isQuestor: true },
    { kind: 'Place', site: { name: 'Fallback' } },
  ]);
  const machine = fakeMachine(new Map([['S0000001', q]]));
  const r = tryDebugStart({ machine }, { search: '?quest=S0000001&jump=giver' });
  assert.equal(r.site?.name, 'Fallback');
});

test('jump=none returns null site', () => {
  const q = fakeQuest('FORAGB00');
  const machine = fakeMachine(new Map([['FORAGB00', q]]));
  const r = tryDebugStart({ machine }, { search: '?quest=FORAGB00&jump=none' });
  assert.equal(r.site, null);
  assert.equal(r.jump, 'none');
});

test('debugUrl builds the right query', () => {
  assert.equal(
    debugUrl('http://localhost:5212/', 'FORAGB00'),
    'http://localhost:5212/?classic=1&quest=FORAGB00',
  );
  assert.equal(
    debugUrl('http://localhost:5212/', 'FORAGB00', { jump: 'giver', classic: false }),
    'http://localhost:5212/?quest=FORAGB00&jump=giver',
  );
});
