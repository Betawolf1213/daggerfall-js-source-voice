// EG-E (2026-10-12, the Elite Gates arc; bible/11-Multiplayer/Elite-Gates.md section 19, REWARDS AND THE ECONOMY): A
// REDOUBT'S SPOILS - the lords' named Legendaries (systems/egLordArms.js) and the lords' own cards (net/iliacCards.js,
// systems/bossCards.js BOSS_CARDS by lord key).
import test from 'node:test';
import assert from 'node:assert/strict';
import { EG_LORD_ARMS, egLordArm } from '../src/systems/egLordArms.js';
import { BOSS_CARDS, BOSS_CARD_PER_MILLE, bossCardRoll } from '../src/systems/bossCards.js';
import { cardById } from '../src/net/iliacCards.js';
import { EG_LORDS } from '../src/net/egLaw.js';
import { templateByIndex } from '../src/systems/itemTemplates.js';
import { validLootItem } from '../src/systems/loot.js';
import { seededRng } from '../src/systems/wind.js';

const LORDS = Object.keys(EG_LORDS);

test('EG-E THE LORDS\' NAMED LEGENDARIES (section 19): each of the thirteen lords one piece, its fixed base and name - Legendary, known, a weapon of its own template, the name over the ladder\'s, a crash record\'s door takes it; a champion none (mutants: the ladder\'s name kept; a lesser tier; a base swapped)', () => {
  assert.deepEqual(Object.keys(EG_LORD_ARMS).sort(), [...LORDS].sort(), 'every lord its piece');
  const base = (k) => templateByIndex(EG_LORD_ARMS[k].template)?.name;
  assert.deepEqual(LORDS.map((k) => [EG_LORD_ARMS[k].name, base(k)]), [
    ['The Houndfang', 'Saber'], ["The Examiner's Staff", 'Staff'], ['The Last Lesson', 'Longsword'], ['Conquest', 'War Axe'],
    ['Tithe', 'Mace'], ['Rivalry', 'Dai-katana'], ['Soulchain', 'Flail'], ['Duskwing', 'Long Bow'], ['Bloodmoon', 'Tanto'],
    ['Mirrorshard', 'Shortsword'], ["The Engine's Heart", 'Warhammer'], ['Wyrmbreath', 'Claymore'], ['The Clan-Breaker', 'Battle Axe'],
  ]);
  for (const k of LORDS) {
    for (let s = 1; s <= 6; s++) {
      const it = egLordArm(k, 20, seededRng(s * 7919 + k.length));
      assert.ok(it, k);
      assert.equal(it.name, EG_LORD_ARMS[k].name);
      assert.equal(it.templateIndex, EG_LORD_ARMS[k].template);
      assert.equal(it.group, 'Weapons');
      assert.equal(it.rarity, 'legendary', `${k}: Legendary`);
      assert.equal(it.isIdentified, true);
      assert.ok(validLootItem(JSON.parse(JSON.stringify(it))), `${k}: the crash record's door takes it`);
    }
  }
  assert.equal(egLordArm('kynreeve', 20, seededRng(1)), null, 'a champion drops none');
});

test('EG-E THE LORDS\' CARDS (section 19): each lord its own aetheric unit card by its key in BOSS_CARDS, at the gate\'s rate (200 per mille), one draw whatever it answers; a champion\'s key draws once and finds none (mutants: a lord\'s rate; a card past the tier)', () => {
  for (const k of LORDS) {
    const id = BOSS_CARDS[k];
    assert.ok(id, `${k}: its card`);
    const c = cardById(id);
    assert.equal(c.tier, 'aetheric', id);
    assert.equal(c.kind, 'unit', id);
    assert.equal(BOSS_CARD_PER_MILLE[k], 200, `${k}: the gate's rate`);
    let n = 0;
    const yes = () => { n++; return 0.1999; };
    assert.equal(bossCardRoll(k, yes)?.card, id);
    assert.equal(bossCardRoll(k, () => { n++; return 0.2; }), null);
    assert.equal(n, 2, 'one draw each');
  }
  assert.equal(new Set(LORDS.map((k) => BOSS_CARDS[k])).size, LORDS.length, 'thirteen cards, no two the same');
  let n = 0;
  assert.equal(bossCardRoll('kynreeve', () => { n++; return 0; }), null);
  assert.equal(n, 1);
});
