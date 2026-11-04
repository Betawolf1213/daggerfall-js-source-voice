// QAE2: Quest Actions Extension's vitals family in the port - the arithmetic, the clamps, the always-on triggers and
// the ticking reduce. Jagget's mod is the oracle for behaviour (QuestActionsExtension 2.0.0); nothing of it is carried.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ReducePlayerHealth, ReducePlayerMagicka, IncreasePlayerHealth, IncreasePlayerFatigue, IncreasePlayerMagicka,
  WhenHealthLevel, WhenMagickaLevel, WhenFatigueLevel, questActionsExtensionTemplates, setQaeRealClock,
} from '../src/systems/quest/questActionsExtension.js';
import { FATIGUE_MULTIPLIER } from '../src/systems/statMods.js';

/** An entity with the stats maxFatigue() reads (Str 50 + End 50 = 100 x 64 = 6400). */
const entity = (over = {}) => ({
  health: 100, maxHealth: 100, magicka: 80, maxMagicka: 80, fatigue: 6400,
  strength: 50, endurance: 50, stats: { strength: 50, endurance: 50 }, ...over,
});
const quest = (e) => ({ hooks: { playerEntity: () => e } });
const make = (Cls, source, e) => {
  const a = new Cls(null).createNew(source, quest(e));
  assert.ok(a, `createNew failed for "${source}"`);
  return a;
};

test('reduce player health by N: N percent of the MAXIMUM, not of the current', () => {
  const e = entity({ health: 50 });
  make(ReducePlayerHealth, 'reduce player health by 20', e).update(null);
  assert.equal(e.health, 30, '50 - 20% of 100');
});

test('reduce player health on N: an absolute amount', () => {
  const e = entity({ health: 50 });
  make(ReducePlayerHealth, 'reduce player health on 12', e).update(null);
  assert.equal(e.health, 38);
});

test('the floor is 1, and 0 only when the line may kill', () => {
  const e = entity({ health: 5 });
  make(ReducePlayerHealth, 'reduce player health by 90', e).update(null);
  assert.equal(e.health, 1, 'never to zero without can kill');
  const dead = entity({ health: 5 });
  const a = make(ReducePlayerHealth, 'reduce player health by 10 every 1 seconds 1 times can kill', dead);
  a.update(null);
  assert.equal(dead.health, 0, 'can kill lets it reach zero');
});

test('an interval without a count repeats forever (1000000), with one counts down and then completes', () => {
  let t = 100;
  setQaeRealClock(() => t);
  try {
    const forever = make(ReducePlayerHealth, 'reduce player health by 1 every 5 seconds', entity());
    assert.equal(forever.numberOfTimes, 1000000);
    const e = entity();
    const twice = make(ReducePlayerHealth, 'reduce player health by 10 every 5 seconds 2 times', e);
    twice.update(null);
    assert.equal(e.health, 90);
    twice.update(null);                     // too early: the next tick is 5s away
    assert.equal(e.health, 90, 'the wall clock gates the repeat');
    t += 5;
    twice.update(null);
    assert.equal(e.health, 80);
    t += 5;
    twice.update(null);                     // the count is spent: it completes instead of hurting
    assert.equal(e.health, 80);
    assert.equal(twice.isComplete, true);
  } finally {
    setQaeRealClock(() => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000);
  }
});

test('a one-shot form hurts on its first tick and completes on its next, as upstream does', () => {
  const e = entity({ health: 70 });
  const a = make(ReducePlayerHealth, 'reduce player health by 10', e);
  a.update(null);                                   // the count (1) is spent here
  assert.equal(e.health, 60);
  assert.equal(a.isComplete, false, 'ReducePlayerHealth.cs completes on the tick AFTER its last reduction');
  a.update(null);                                   // interval 0, so the next tick is now
  assert.equal(e.health, 60, 'and it never hurts twice');
  assert.equal(a.isComplete, true);
  const saved = a.getActionSaveData();
  assert.equal(saved.type, 'ReducePlayerHealth');
  const back = new ReducePlayerHealth(quest(e));
  back.restoreActionSaveData(saved);
  assert.equal(back.percent, 10);
  assert.equal(back.isComplete, true);
});

test('magicka and fatigue move the same way and never pass their maximum', () => {
  const e = entity({ magicka: 40 });
  make(ReducePlayerMagicka, 'reduce player magicka on 10', e).update(null);
  assert.equal(e.magicka, 30);
  make(IncreasePlayerMagicka, 'increase player magicka by 50', e).update(null);
  assert.equal(e.magicka, 70, '30 + 50% of 80');
  make(IncreasePlayerMagicka, 'increase player magicka on 100', e).update(null);
  assert.equal(e.magicka, 80, 'capped at the maximum');
  const h = entity({ health: 10 });
  make(IncreasePlayerHealth, 'increase player health on 5', h).update(null);
  assert.equal(h.health, 15);
  const f = entity({ fatigue: 1000 });
  make(IncreasePlayerFatigue, 'increase player fatigue by 10', f).update(null);
  assert.equal(f.fatigue, 1640, '1000 + 10% of 6400');
});

test('the vitals triggers are always-on and read <=, the percent arm first', () => {
  const e = entity({ health: 25 });
  const pts = make(WhenHealthLevel, 'player health is less than 30 pt', e);
  assert.equal(pts.isTriggerCondition, true);
  assert.equal(pts.isAlwaysOnTriggerCondition, true);
  assert.equal(pts.checkTrigger(null), true);
  e.health = 31;
  assert.equal(pts.checkTrigger(null), false);
  e.health = 30;
  assert.equal(pts.checkTrigger(null), true, 'the bar itself counts');
  const pct = make(WhenHealthLevel, 'player health is less than 25%', e);
  e.health = 25;
  assert.equal(pct.checkTrigger(null), true);
  e.health = 26;
  assert.equal(pct.checkTrigger(null), false);
});

test("Health Quest Actions' pchealth and pchealthp forms parse to the same trigger", () => {
  const e = entity({ health: 10 });
  assert.equal(make(WhenHealthLevel, 'pchealth lower than 20', e).checkTrigger(null), true);
  assert.equal(make(WhenHealthLevel, 'pchealthp lower than 15', e).checkTrigger(null), true);
  assert.equal(make(WhenHealthLevel, 'pchealthp lower than 5', e).checkTrigger(null), false);
});

test('fatigue points are character-sheet points, multiplied by 64 inside', () => {
  const e = entity({ fatigue: 29 * FATIGUE_MULTIPLIER });
  assert.equal(make(WhenFatigueLevel, 'player fatigue is less than 30 pt', e).checkTrigger(null), true);
  e.fatigue = 31 * FATIGUE_MULTIPLIER;
  assert.equal(make(WhenFatigueLevel, 'player fatigue is less than 30 pt', e).checkTrigger(null), false);
  assert.equal(make(WhenFatigueLevel, 'player fatigue is less than 50%', e).checkTrigger(null), true, '1984 of 6400');
});

test('magicka trigger reads its own pool', () => {
  const e = entity({ magicka: 8 });
  assert.equal(make(WhenMagickaLevel, 'player magicka is less than 10 pt', e).checkTrigger(null), true);
  assert.equal(make(WhenMagickaLevel, 'player magicka is less than 10%', e).checkTrigger(null), true);
  e.magicka = 40;
  assert.equal(make(WhenMagickaLevel, 'player magicka is less than 10%', e).checkTrigger(null), false);
});

test('a line no alternative matches returns null, and a missing entity is survivable', () => {
  assert.equal(new ReducePlayerHealth(null).createNew('reduce player health by lots', quest(entity())), null);
  assert.equal(new WhenHealthLevel(null).createNew('player health is plenty', quest(entity())), null);
  const none = { hooks: { playerEntity: () => null } };
  const a = new ReducePlayerHealth(null).createNew('reduce player health by 10', none);
  a.update(null);                                   // no entity: no throw
  a.update(null);
  assert.equal(a.isComplete, true, 'it still runs its course');
  assert.equal(new WhenHealthLevel(null).createNew('pchealth lower than 5', none).checkTrigger(null), false);
});

test('every template the host registers is distinct and names itself', () => {
  const list = questActionsExtensionTemplates();
  const names = list.map((t) => t.typeName);
  assert.equal(new Set(names).size, names.length);
  assert.equal(list.length, 12);
  for (const t of list) assert.ok(t.pattern instanceof RegExp, `${t.typeName} has a pattern`);
  assert.ok(names.includes('WhenFatigueLevel') && names.includes('PlayerHandsover'));
});
