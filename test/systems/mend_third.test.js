// MEND-THIRD (2026-10-19, the Discord's #feature-feedback "Bring back loot price based on the condition!" - "actively
// discourage players to repair an item in order to maximalize the sell price - like with repair kits at early levels,
// and enchants at higher" - through Mac: "Do it"). SELL-AS-FOUND credited a mend nothing online, and ASF-DEATH brought
// every death drop under it: a kit or Repairs Objects added nothing to a found piece's sale. Now what was mended past
// the mark sells at the share a repair is priced at - REPAIR-RATE's third - so a smith's whole repair is still a loss on
// the sale (Roleplay & Realism: Items' own sum, at its own price), and a kit's or a ring's mend sells for a third of what
// the condition is worth. Every piece from its producer (weaponOfMaterial, armorOfMaterial), worn by Roleplay & Realism:
// Items' own roll (randomConditionLootItems), mended by the real kit (repairKitUse) and the real ring's rounds
// (runMagicRoundsFor), priced through the trade window's own walk. bible/06-Systems/Economy-Arc.md, MEND-THIRD.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { tradeCost, getTradePrice, saleConditionPercentage } from '../../src/systems/tradeModes.js';
import { REPAIR_COST_SCALE, MEND_SALE_SHARE } from '../../src/systems/repairService.js';
import { weaponOfMaterial, armorOfMaterial } from '../../src/combat/enemyEquipment.js';
import { randomConditionLootItems } from '../../src/systems/roleplayRealismItems/rriRealism.js';
import { WEAPONS, WEAPON_MATERIALS } from '../../src/characters/weapons.js';
import { ARMOR_MATERIAL } from '../../src/systems/armorMaterials.js';
import { mintFieldRepairKit, repairKitUse } from '../../src/systems/smithItems.js';
import { ENCHANTMENT_TYPES as T } from '../../src/systems/enchantments.js';
import { runMagicRoundsFor } from '../../src/systems/worldTick.js';
import { equipItem } from '../../src/systems/equip.js';
import { mintCondition, setItemFields } from '../../src/systems/item/itemTemplates.js';

const CUIRASS = 102, BOOTS = 108, RING = 135;
const at = (v) => () => v;
/** The page online for `fn`, as the room is - and back. */
function online(fn) {
  const had = Object.hasOwn(globalThis, 'location') ? globalThis.location : undefined;
  globalThis.location = { search: '?online' };
  try { return fn(); } finally { if (had === undefined) delete globalThis.location; else globalThis.location = had; }
}
/** The counter's word on a lot, through the trade window's own walk. */
const quote = (mode, item, { quality = 10, priceAdjustment = 1000, skills = { mercantile: 30, personality: 40 } } = {}) => {
  const lot = tradeCost(mode, [item], { quality, priceAdjustment });
  return getTradePrice(mode, lot.cost, quality, skills, lot.pieces);
};
/** A piece as Roleplay & Realism: Items hands it over - worn by its roll at `r`, and marked. */
const found = (piece, r) => randomConditionLootItems([piece], at(r))[0];
/** The law, said here so the pins do not read it back from the module: the mark, and a third of what was mended past
 *  it, rounded down. */
const credited = (it) => it.foundCondition + Math.trunc((it.currentCondition - it.foundCondition) / 3);

test('MEND-THIRD: the shape - a mend past the mark counts a third, rounded down; wear below the mark, a piece without one and the offline page read the condition alone (mutants: the share whole; the share nothing; rounded up)', () => {
  assert.equal(MEND_SALE_SHARE, REPAIR_COST_SCALE, 'the share is the repair\'s price');
  assert.equal(MEND_SALE_SHARE, 1 / 3);
  // a Daedric cuirass off the roll's low end (20%), mended by a field kit's 15%: 6,553 + a third of 4,916 is 8,191 of
  // 32,768 - 24%, where a third rounded up (8,192) would read 25
  const plate = found(armorOfMaterial(CUIRASS, ARMOR_MATERIAL.Daedric), 0);
  assert.deepEqual([plate.currentCondition, plate.maxCondition, plate.foundCondition], [6553, 32768, 6553]);
  const pack = [plate, mintFieldRepairKit()];
  repairKitUse(pack[1], pack);
  assert.equal(plate.currentCondition, 11469, 'the kit\'s 15%');
  online(() => {
    assert.equal(saleConditionPercentage(plate), 24, 'the mark and a third of the mend, never rounded up');
    assert.equal(saleConditionPercentage({ ...plate, currentCondition: plate.maxCondition }), 46, 'whole: 6,553 + 8,738');
    assert.equal(saleConditionPercentage({ ...plate, currentCondition: 6553 }), 19, 'at the mark: the mark');
    assert.equal(saleConditionPercentage({ ...plate, currentCondition: 3000 }), 9, 'worn below the mark: its own');
    assert.equal(saleConditionPercentage({ ...plate, foundCondition: undefined }), 35, 'no mark: its own');
  });
  assert.equal(saleConditionPercentage(plate, { online: false }), 35, 'offline: the condition alone, the mod\'s price');
});

test('MEND-THIRD: online a smith\'s whole repair of a found piece never pays on the sale - at every counter, region, haggler, metal and found condition it is a loss from a 20-gold repair up, under nine tenths of its price from a 1,000-gold one, and never a gold over it (mutants: the share whole; a share past the price\'s)', () => {
  const pieces = [];
  for (const t of [WEAPONS.Dagger, WEAPONS.Longsword, WEAPONS.Claymore]) {
    for (const m of [WEAPON_MATERIALS.Iron, WEAPON_MATERIALS.Steel, WEAPON_MATERIALS.Dwarven, WEAPON_MATERIALS.Ebony, WEAPON_MATERIALS.Daedric]) pieces.push(() => weaponOfMaterial(t, m));
  }
  for (const t of [CUIRASS, BOOTS]) {
    for (const m of [ARMOR_MATERIAL.Leather, ARMOR_MATERIAL.Chain, ARMOR_MATERIAL.Iron, ARMOR_MATERIAL.Steel, ARMOR_MATERIAL.Mithril, ARMOR_MATERIAL.Daedric]) pieces.push(() => armorOfMaterial(t, m));
  }
  online(() => {
    let lots = 0, losses = 0, worst = 0;
    for (const make of pieces) {
      for (const r of [0, 0.25, 0.5, 0.75, 0.999]) {
        const piece = found(make(), r);
        const whole = { ...piece, currentCondition: piece.maxCondition };
        for (const quality of [1, 5, 10, 15, 20]) {
          for (const priceAdjustment of [500, 1000, 1500]) {
            for (const mercantile of [0, 50, 100]) {
              for (const personality of [0, 50, 100]) {
                const c = { quality, priceAdjustment, skills: { mercantile, personality } };
                const gain = quote('Sell', whole, c) - quote('Sell', piece, c);
                const repair = quote('Repair', piece, c);
                const at = `${piece.name} ${piece.material} at ${piece.foundCondition}/${piece.maxCondition}, q${quality} adj${priceAdjustment} m${mercantile} p${personality}`;
                assert.ok(gain >= 0 && gain - repair <= 1, `${at}: +${gain} for ${repair} - never a gold over the price`);
                if (repair >= 20) { assert.ok(gain > 0 && gain < repair, `${at}: +${gain} for ${repair} - the mend counts, and is a loss`); losses++; }
                if (repair >= 1000) worst = Math.max(worst, gain / repair);
                lots++;
              }
            }
          }
        }
      }
    }
    assert.equal(lots, 18225);
    assert.equal(losses, 10685, 'the lots whose repair asks 20 gold or more');
    assert.ok(worst > 0.85 && worst < 0.9, `a 1,000-gold repair or more adds at most ${worst.toFixed(4)} of its price (measured 0.8991)`);
  });
});

test('MEND-THIRD: the thread\'s two ways sell again - a field kit on a found Daedric cuirass and a ring of Repairs Objects on a worn steel longsword each lift the online sale by a third of what they mended, where SELL-AS-FOUND lifted it by nothing (mutants: the share nothing; the share whole)', () => {
  // the kit: a Daedric cuirass found at 47% (Mercantile 30, Personality 40, a quality-10 counter)
  const plate = found(armorOfMaterial(CUIRASS, ARMOR_MATERIAL.Daedric), 0.5);
  assert.deepEqual([plate.value, plate.currentCondition, plate.maxCondition], [153600, 15564, 32768]);
  const asFound = online(() => quote('Sell', plate));
  assert.equal(asFound, 22350);
  const pack = [plate, mintFieldRepairKit()];
  assert.equal(repairKitUse(pack[1], pack).text, 'The Daedric Cuirass is mended: 47% to 62%.');
  online(() => {
    assert.equal(quote('Sell', plate), 24727, 'a third of the kit\'s 15% - +2,377');
    assert.equal(quote('Sell', plate), quote('Sell', { ...plate, currentCondition: credited(plate), foundCondition: undefined }));
    assert.ok(quote('Sell', plate) < quote('Sell', { ...plate, foundCondition: undefined }), 'never the whole 62%');
  });
  // the ring: a steel longsword off the roll's low end, worn with a ring of Repairs Objects - an hour of its rounds
  const blade = found(weaponOfMaterial(WEAPONS.Longsword, WEAPON_MATERIALS.Steel), 0);
  const ring = Object.assign(mintCondition(setItemFields({ group: 'Jewellery', templateIndex: RING })), { enchantments: [{ type: T.RepairsObjects, param: -1 }] });
  const p = { isPlayer: true, level: 10, gender: 'male', activeEffects: [], health: 60, maxHealth: 60, items: [blade, ring], spells: [], stats: {}, skills: {}, career: { primarySkills: [], majorSkills: [], luck: 50 } };
  equipItem(p, blade); equipItem(p, ring);
  assert.deepEqual([blade.currentCondition, blade.maxCondition], [480, 2400]);
  const before = online(() => quote('Sell', blade));
  runMagicRoundsFor(p, 0, 60, { sinks: {} });
  assert.equal(blade.currentCondition, 480 + 15 * 48, 'fifteen ticks of a fiftieth');
  online(() => {
    assert.equal(saleConditionPercentage(blade), 30, '480 + a third of 720, of 2,400');
    assert.ok(quote('Sell', blade) > before, 'the ring\'s mend sells');
    assert.equal(quote('Sell', blade), quote('Sell', { ...blade, currentCondition: credited(blade), foundCondition: undefined }));
  });
});
