// RAID-WON (FIELD BUGS 2026-10-19, the Discord, [IMB]Monday: "If you get boarded.. repel the attackers.. board them..
// etc. You can use overview as your crew class as enemies"; bible/01-Overview/bugs/Field-Bugs-2026-10-19.md) - A RAID
// WON AT SEA ENDS. The sea fight starts Warm Ashes' raid on a crewed boat (scenes/naval/navalHost.js beginFight): the
// small raid's waves come with five `_ally_` Warriors in my crew's place. Won - its leader down, or its wave killed and
// its Leave Ship the sea fight's ('naval') - it ran on: the small raid until its hour, the pirate attack until its
// `_reset_`, and nothing in either script removes `_ally_`. Their team was set to mine (`change foe _ally_ team 1`) but
// their mobile team - the law the enemies-near question reads (systems/encounters.js areEnemiesNearby, DFU's
// GameManager :709) - is a Warrior's, so the Overworld ("You cannot survey the land with enemies nearby"), a rest and a
// journey were refused for as long as I stayed aboard. Now a won raid ends as one thrown back ashore does
// (scenes/raidAshore.js `won`, through world.js endRaid's `won`): its living foes withdrawn, its quest ended as its own
// `end quest` ends one. tools/mutants/raidwon.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

import { QuestMachine } from '../../../src/systems/quest/machine.js';
import { loadQuestTables } from '../../../src/systems/quest/tables.js';
import { QuestResourceBehaviour } from '../../../src/systems/quest/resourceBehaviour.js';
import { LeaveShip, setWarmAshesHost, _resetWarmAshesShips } from '../../../src/systems/warmAshesShips.js';
import { createRaidAshore } from '../../../src/scenes/raidAshore.js';
import { areEnemiesNearby } from '../../../src/systems/encounters.js';
import { ENEMY_BASICS } from '../../../src/characters/enemy/enemyBasics.js';
import { hostText } from '../../hostText.mjs';

const rd = (p) => readFileSync(new URL(`../../../${p}`, import.meta.url), 'utf8');
const T = new URL('../../../vendor/dfu-quests/Tables/', import.meta.url);
loadQuestTables(Object.fromEntries(readdirSync(T).map((f) => [f.replace(/\.txt$/, ''), readFileSync(new URL(f, T), 'utf8')])));
const RAID = rd('vendor/warm-ashes-ships/Quests/WAQ_SHIP_SMALLRAID.txt').split(/\r?\n/);

/**
 * The author's small raid through the real machine at sea, its waves placed on a deck pool shaped as the street's (a
 * foe's quest behaviour; its entity's species row; a motor that would spawn it near me), Warm Ashes' Leave Ship asking
 * the sea fight's gate - which answers 'naval' as navalHost.js leaveShipGate does, having won the boarding: `won` true,
 * the raid ended as the naval host now ends it (raidAshore.js `won`); false, the record of the bug.
 */
function raidAtSea({ roll, won }) {
  const pool = [];
  let now = 12 * 3600;
  const ashore = createRaidAshore({ pools: () => [{ foes: () => pool, remove: (f) => { const i = pool.indexOf(f); if (i >= 0) pool.splice(i, 1); } }] });
  const m = new QuestMachine({
    nowSeconds: () => now,
    questFoeInstances: (sym) => pool.filter((f) => !f.dead && f.questBehaviour?.targetSymbol?.name === sym?.name),
    onQuestEnded: (q) => ashore.questEnded(q),
  });
  m.registerAction(new LeaveShip(null));
  _resetWarmAshesShips();
  let quest = null;
  setWarmAshesHost({
    currentRegionIndex: () => 23, ownsShip: () => true, setTransportModeShip: () => {}, setBlockVariant: () => {},
    leaveShipGate: () => { if (won) ashore.won(quest); return 'naval'; },
  });
  quest = m.scheduleQuest(RAID, 0, { rolls: () => roll });
  quest.hooks = {
    ...quest.hooks,
    world: {
      currentRegionIndex: () => 23,
      createFoeGameObjects: (foe, count) => Array.from({ length: count }, () => ({ foe })),
      tryPlaceFoe: (h) => {
        const qrb = new QuestResourceBehaviour(m);
        qrb.questUID = h.foe.parentQuest.uid; qrb.targetSymbol = h.foe.symbol;
        const mt = h.foe.foeType;
        pool.push({ sym: h.foe.symbol.name, foe: h.foe, questBehaviour: qrb, dead: false, mobileType: mt,
          entity: { basics: ENEMY_BASICS[mt] }, ai: { isHostile: true, wouldBeSpawned: true } });
        return true;
      },
    },
  };
  const tick = (n, dt = 1) => { for (let i = 0; i < n; i++) { now += dt; m.tick(); } };
  const standing = () => pool.filter((f) => !f.dead).reduce((o, f) => ({ ...o, [f.sym]: (o[f.sym] ?? 0) + 1 }), {});
  const kill = (sym, n) => { for (const f of pool.filter((x) => !x.dead && x.sym === sym).slice(0, n)) { f.dead = true; f.foe.incrementKills(); } };
  const win = () => { kill('warrior', 8); kill('barb', 8); kill('orc', 6); kill('orcs', 2); };
  return { quest, pool, ashore, tick, standing, win };
}

test('RAID-WON the small raid won at sea ENDS: each of its three outcomes - its crew withdrawn with the raid, its dead lying, the quest ended and tombstoned, nothing called again in its hour, and no enemy near; the record - the same win with the raid left running keeps five Warriors on my deck that the enemies-near law counts (mutants: the won raid left running; its foes kept)', () => {
  for (const roll of [0, 0.2, 0.4]) {
    const bug = raidAtSea({ roll, won: false });
    bug.tick(20);
    assert.equal(bug.standing().ally, 5, `roll ${roll}: its crew stood`);
    bug.win();
    bug.tick(10);
    assert.deepEqual(bug.standing(), { ally: 5 }, `roll ${roll}: the record - won, its crew left standing`);
    assert.equal(bug.quest.questTombstoned, false, 'and its quest running on');
    assert.equal(areEnemiesNearby(bug.pool), true, 'five Warriors on my deck count as enemies near');

    const r = raidAtSea({ roll, won: true });
    r.tick(20);
    const dead = Object.values(r.standing()).reduce((a, b) => a + b, 0) - 5;
    r.win();
    r.tick(10);
    assert.deepEqual(r.standing(), {}, `roll ${roll}: nothing of the raid stands`);
    assert.equal(r.pool.length, dead, 'its dead lie where they fell');
    assert.equal(r.quest.questTombstoned, true, 'its quest ended');
    assert.equal(r.ashore.ending, 0, 'its end swept, and let go');
    assert.equal(areEnemiesNearby(r.pool), false, 'no enemy near');
    r.tick(40, 300);
    assert.deepEqual(r.standing(), {}, 'no crew called again in the hour it would have run');
  }
});

test('RAID-WON `won`\'s own law: a raid not yet ended - its foes withdrawn now and again at its end, its quest ended as `end quest` ends one; one already ending - never its grace begun again; one already ended - its foes withdrawn once, nothing waiting on its end (mutants: no end; the grace restarted; the ended one held)', () => {
  const quest = (o = {}) => ({ uid: 7, questTombstoned: false, questComplete: false, ticksToEnd: 0, questBreak: false, ends: 0, endQuest() { this.ends++; this.ticksToEnd = 2; }, ...o });
  const pool = [];
  const mk = (q) => ({ dead: false, questBehaviour: { questUID: q.uid } });
  const ashore = createRaidAshore({ pools: () => [{ foes: () => pool, remove: (f) => pool.splice(pool.indexOf(f), 1) }] });
  const q = quest();
  pool.push(mk(q), mk(q), { dead: true, questBehaviour: { questUID: 7 } }, mk({ uid: 8 }));
  assert.equal(ashore.won(q), 2, 'its two living foes');
  assert.deepEqual([q.ends, q.questBreak, ashore.ending, pool.length], [1, true, 1, 2], 'ended its own way, its end awaited for a second sweep');
  assert.equal(ashore.won(q), 0);
  assert.equal(q.ends, 1, 'already ending: its grace not begun again');
  const gone = quest({ uid: 9, questTombstoned: true });
  pool.push(mk(gone));
  assert.equal(ashore.won(gone), 1, 'already ended: its foes withdrawn');
  assert.deepEqual([gone.ends, ashore.ending], [0, 1], 'nothing ended twice, nothing waiting on an end that came');
  assert.equal(ashore.won(null), 0);
});

test('RAID-WON the hosts: the naval host ends a raid its throw-back won - after the boarding\'s end, on both of the throw-back\'s branches (a legend\'s first wave too) - and the world host\'s endRaid ends a won one through raidAshore\'s `won` (mutants: either branch unended; the world host\'s arm unwired)', () => {
  const N = rd('src/scenes/naval/navalHost.js');
  const w = N.slice(N.indexOf('  function wonRaid(quest) {'), N.indexOf('  /** The fight won: a boarding\'s prize, or boarders thrown back. */'));
  assert.match(w, /if \(quest\) deps\.board\?\.endRaid\?\.\(quest, \{ won: true \}\);/);
  assert.doesNotMatch(w, /raidUids\.delete/, 'its uid kept until the quest ends - a late Leave Ship or wave still the sea fight\'s');
  const win = N.slice(N.indexOf('  function winBoarding(b, entry) {'), N.indexOf('    b.win();'));
  assert.match(win, /endBoarding\(\);\n\s*wonRaid\(b\.quest\);[^\n]*\n\s*deps\.mid\?\.\(`The boarders are thrown back - and/, 'a legend\'s first wave');
  assert.match(win, /entry\.ship\.boarded = false;\n\s*endBoarding\(\);\n\s*wonRaid\(b\.quest\);[^\n]*\n\s*return;\n\s*\}\n\s*$/, 'thrown back');
  const W = hostText('src/scenes/world.js');
  assert.match(W, /endRaid: \(quest, \{ withdraw = false, won = false \} = \{\}\) => \{\n\s*if \(!quest \|\| !questBridge\) return;\n\s*if \(won\) \{ raidAshore\.won\(quest\); return; \}/);
});
