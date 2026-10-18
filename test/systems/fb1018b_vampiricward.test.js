// FIELD BUGS 2026-10-18b VAMPIRIC-WARD (Low_Poly_Gaming, "Weir Key Generated Elite Breach bugs": "Its an exploit for heals if
// you have a vampiric weapon to heal yourself during the breach run"). Vampiric Effect when strikes heals the wearer every
// point a blow DEALS (systems/enchantments.js - VampiricEffect.cs; bible/05-Combat/Balance-Arc.md BAL7). A blow on a body a
// referee holds is resolved against its stand-in, and a ward the referee keeps turns it whole - the stand-in says so
// (`warded`: the Warden's ward and the Brass Remnant shut, scenes/dungeonContext.js gateBossBody; the Spire's turned blows,
// scenes/eliteGates/egFight.js TURNED-BLOW). Every other heal and power of a landed blow already refused one (the leech since
// AUDIT WORLD-REWARDS B3); the payload alone healed the whole claim. Driven through the real payload dispatcher and the real
// formula, on the real Legendary that carries it (Gortwog's Cleaver, systems/loot/lootRarity.js) against the Warden's own
// stand-in (world/gate/gateBoss.js bossStandIn). On the code before the fix the warded blows heal their whole damage.
import '../modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { doItemEnchantmentPayloads, PAYLOAD, ENCHANTMENT_TYPES } from '../../src/systems/enchantments.js';
import { calculateAttackDamage } from '../../src/combat/formulas.js';
import { bossStandIn, bossLookOf } from '../../src/world/gate/gateBoss.js';
import { createWeapon } from '../../src/combat/enemyEquipment.js';
import * as LR from '../../src/systems/loot/lootRarity.js';

const T = ENCHANTMENT_TYPES;
const lcg = (seed) => () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return (seed >>> 8) / 0x800000; };
const me = () => ({ isPlayer: true, level: 30, items: [], career: {}, activeEffects: [], skills: new Array(35).fill(60), skillUses: new Array(35).fill(0), armor: 0, health: 100, maxHealth: 1000, magicka: 0, maxMagicka: 100,
  stats: { strength: 75, agility: 50, luck: 50, speed: 50, endurance: 50, willpower: 50, intelligence: 50, personality: 50 } });

test('VAMPIRIC-WARD THE PAYLOAD: Vampiric Effect when strikes heals the damage a blow deals - on a warded target, none; on any other the whole of it (E1\'s own pin beside it); at range it is unmoved (mutants: the ward unread)', () => {
  const blade = { name: 'Blade', templateIndex: 120, group: 3, currentCondition: 100, maxCondition: 100, enchantments: [{ type: T.VampiricEffect, param: 1 }] };
  const w = { health: 20, maxHealth: 30 };
  doItemEnchantmentPayloads(PAYLOAD.Strikes, blade, { entity: w, target: { mobileType: 3, warded: true }, damage: 7 });
  assert.equal(w.health, 20, 'a blow the ward turns dealt nothing, and heals nothing');
  doItemEnchantmentPayloads(PAYLOAD.Strikes, blade, { entity: w, target: { mobileType: 3, warded: false }, damage: 7 });
  assert.equal(w.health, 27, 'a blow that lands heals what it dealt');
  doItemEnchantmentPayloads(PAYLOAD.Strikes, { ...blade, enchantments: [{ type: T.VampiricEffect, param: 0 }] }, { entity: w, target: { warded: false }, damage: 7 });
  assert.equal(w.health, 27, 'the at-range param heals nothing on a strike');
});

test('VAMPIRIC-WARD GORTWOG\'S CLEAVER ON THE WARDEN: the Legendary as the loot maker mints it, swung through the real formula at the Warden\'s own stand-in - while his ward stands (the stand-in warded, as the court\'s door marks it) twenty blows heal nothing; with it down each heals its whole damage', () => {
  const rec = LR.legendaryById('gortwogs-cleaver');
  assert.deepEqual(rec.enchantment, { type: T.VampiricEffect, param: 1 }, 'the Cleaver carries Vampiric Effect when strikes');
  const cleaver = LR.applyRarity(createWeapon(rec.templates[0], 0, () => 0.5), 'legendary', lcg(1), [rec]);
  cleaver.isIdentified = true;
  assert.ok((cleaver.enchantments ?? []).some((e) => e.type === T.VampiricEffect && e.param === 1), 'minted with it');
  const warden = bossStandIn(bossLookOf('warden'), 'The Warden');
  const swing = (k) => { const p = me(), d = calculateAttackDamage(p, warden, { weapon: cleaver, toHitMod: 1000, rolls: () => (k + 0.5) / 20 }); return { d, healed: p.health - 100 }; };
  warden.warded = true;
  let claimed = 0;
  for (let k = 0; k < 20; k++) { const { d, healed } = swing(k); claimed += d; assert.equal(healed, 0, `a blow of ${d} into his ward heals nothing`); }
  assert.ok(claimed > 100, `the blows claimed ${claimed}`);
  warden.warded = false;
  let landed = 0;
  for (let k = 0; k < 20; k++) { const { d, healed } = swing(k); if (d > 0) { landed++; assert.equal(healed, d, `a blow of ${d} heals ${d}`); } }
  assert.ok(landed > 0);
});
