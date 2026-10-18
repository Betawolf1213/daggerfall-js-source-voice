// FIELD BUGS 2026-10-18b HELD-BASE (SuperDaddy, #bug-reports, "Leaping effect on store bought magic items.": "Says it
// enhances dragonish, but appears on things you can't equip like wands. More than likely supposed to be Cast on Use -
// Jumping. Same case with magic items for sale that have the suffix 'Venom spitting' but cast levitation.").
//
// Both halves are MAGIC.DEF's own rows, the two names crossed in the report: "Leaping %it" is Cast When Used, spell 4,
// Levitate; "%it of Venom Spitting" is Enhances Skill, param 7, Dragonish - classic's file and DFU's table alike
// (test/dfuMagicItems.mjs). A name and its power come from ONE record (the guard below). What was wrong is the base:
// ItemBuilder.CreateRegularMagicItem (ItemBuilder.cs:555-582) draws it off the template's group byte and never asks what
// the power needs - group 0 holds the religious items and the Jewellery, group 1 the Jewellery, and no slot takes a
// religious item or the Wand (equip.js wearableItem) - so a power read on a worn piece alone was minted where it could
// never reach its holder. Driven on the real producer (loot.js createRegularMagicItem over readMagicDef's records), the
// real guild shelf (shopStock.js stockGuildMagicItems), the real equip table and enchantment fold, the real U window's
// list and info box, and the save's real repair runner (save.js repairItemLists).
import '../../modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readMagicDef, MAGIC_ITEM_RECORD_SIZE, ENCHANTMENT_TYPES as T } from '../../../src/formats/magicDef.js';
import { createRegularMagicItem, createArtifact, createRandomArmor, repairMagicBases, MAGIC_BASE_DRAWS } from '../../../src/systems/loot/loot.js';
import { stockGuildMagicItems } from '../../../src/systems/shopStock.js';
import { wearableItem, equipItem } from '../../../src/systems/equip.js';
import { computeEnchantmentMods, worksUnworn } from '../../../src/systems/enchantments.js';
import { usableMagicItems } from '../../../src/ui/useMagicItemWindow.js';
import { magicPowersLines } from '../../../src/systems/item/itemPowers.js';
import { repairItemLists } from '../../../src/systems/save/save.js';
import { applyEnchantments } from '../../../src/systems/enchanting.js';
import { enchantmentSettings } from '../../../src/systems/enchantmentCatalogue.js';
import { DFU_MAGIC_ITEMS } from '../../dfuMagicItems.mjs';

/** MAGIC.DEF's bytes from DFU's table - the tree carries no ARENA2 (test/honestItems.mjs's craft). */
function craft(records) {
  const buf = new Uint8Array(4 + records.length * MAGIC_ITEM_RECORD_SIZE);
  const v = new DataView(buf.buffer);
  v.setInt32(0, records.length, true);
  let o = 4;
  for (const r of records) {
    for (let i = 0; i < r.name.length && i < 31; i++) buf[o + i] = r.name.charCodeAt(i);
    o += 32;
    buf[o++] = r.type; buf[o++] = r.group; buf[o++] = r.groupIndex ?? 0;
    for (let i = 0; i < 10; i++) { v.setInt8(o++, r.ench?.[i]?.[0] ?? -1); v.setInt8(o++, r.ench?.[i]?.[1] ?? 0); }
    v.setInt16(o, r.uses ?? 100, true); o += 2;
    v.setInt32(o, r.value ?? 0, true); o += 4;
    buf[o++] = r.material ?? 0;
  }
  return buf;
}
const TEMPLATES = readMagicDef(craft(DFU_MAGIC_ITEMS));
const REGULAR = TEMPLATES.filter((t) => t.type === 0);
const subclass = (name) => REGULAR.findIndex((t) => t.name === name);
const VENOM = subclass('%it of Venom Spitting'), WISE = subclass('%it of the Wise'), LEAPING = subclass('Leaping %it'), SILENT = subclass('Silent %it');
const HOLY_TOME = 271, WAND = 140, AMULET = 133;
/** A stream of the given rolls, its last repeated; `taken()` counts the draws. */
function seq(...v) {
  let i = 0;
  const f = () => v[Math.min(i++, v.length - 1)];
  f.taken = () => i;
  return f;
}
// group 0's seven (ItemBuilder.cs:533): 2, 3, 6, 10, 12, 14, 25 - a roll of 0.5 is the religious items, 0.9 the
// Jewellery; group 1's five: 2, 3, 6, 12, 25 - 0.9 is the Jewellery. Thirteen religious items (0.99: the Holy Tome) and
// eight jewels (0: the Amulet, 0.99: the Wand).
const usedCast = (it) => it.enchantments.some((e) => e.type === T.CastWhenUsed);

test('HELD-BASE THE GUILD SHELF: every piece a Buy Magic Items shelf holds whose powers need wearing sits on a base a slot takes - DFU\'s draw put "%it of Venom Spitting" on a Holy Tome or a Wand one in six and the Cast When Held rows on a Wand one in forty; a Used cast still lands on any base (mutants: the redraw, the guard)', () => {
  let held = 0, unwornCasts = 0;
  for (let day = 0; day < 600; day++) {
    for (const it of stockGuildMagicItems({ quality: 10, gameMinutes: day * 1440 }, { magicItemTemplates: TEMPLATES, playerLevel: 12, gender: 'male' })) {
      if (it.magic !== true) continue;
      if (!usedCast(it)) {
        held++;
        assert.ok(wearableItem(it), `day ${day}: ${it.name} on ${it.group} ${it.templateIndex} - a power read on a worn piece, minted on a base no slot takes`);
      } else if (!wearableItem(it)) unwornCasts++;
    }
  }
  assert.ok(held > 1000, `the shelves held the worn powers (${held})`);
  assert.ok(unwornCasts > 100, `a Used cast on a Holy Tome or a Wand is DFU's draw, kept (${unwornCasts})`);
});

test('HELD-BASE THE DRAW: a held power drawn on a religious item and then a Wand is drawn again, in DFU\'s order, until a slot takes it - and the Venom Spitting piece then gives its +15 Dragonish worn (Enhances Skill), where the Holy Tome could never be worn; a draw that was wearable is the draw it was, no roll more (mutants: the redraw, a redraw on a wearable base, the loop\'s start)', () => {
  const r = seq(0.5, 0.99, 0.9, 0.99, 0.9, 0);
  const venom = createRegularMagicItem(TEMPLATES, 1, 'male', r, VENOM);
  assert.deepEqual([venom.group, venom.templateIndex, venom.name], ['Jewellery', AMULET, '%it of Venom Spitting'], 'the Holy Tome, the Wand, then the Amulet');
  assert.equal(r.taken(), 6, 'three draws of two rolls');
  assert.deepEqual(venom.enchantments, [{ type: T.EnhancesSkill, param: 7 }]);
  const wearer = { isPlayer: true, items: [venom] };
  assert.notEqual(equipItem(wearer, venom), null, 'worn');
  assert.equal(computeEnchantmentMods(wearer).skillMods[7], 15, 'Enhances Skill: Dragonish reaches its holder');
  // the Wise (Cast When Held, group 1) on its first draw's Amulet: DFU's draw, two rolls
  const w = seq(0.9, 0);
  const wise = createRegularMagicItem(TEMPLATES, 1, 'male', w, WISE);
  assert.deepEqual([wise.group, wise.templateIndex, w.taken()], ['Jewellery', AMULET, 2]);
  // and on a Wand it is drawn again: the Wand, then armour (group 1's first)
  const ww = seq(0.9, 0.99, 0, 0, 0);
  assert.equal(createRegularMagicItem(TEMPLATES, 1, 'male', ww, WISE).group, 'Armor');
});

test('HELD-BASE A USED CAST KEEPS ANY BASE: "Leaping %it" (Cast When Used, spell 4 - Levitate) on its Wand stays a Wand, the U window lists it and its box says so; "Silent %it" on a Holy Tome stays one; a record with no row at all is DFU\'s draw (mutants: the guard, the empty record)', () => {
  const r = seq(0.9, 0.99);
  const leaping = createRegularMagicItem(TEMPLATES, 1, 'male', r, LEAPING);
  assert.deepEqual([leaping.group, leaping.templateIndex, r.taken()], ['Jewellery', WAND, 2]);
  leaping.isIdentified = true;
  assert.deepEqual(usableMagicItems([leaping]), [leaping], 'used from the pack');
  assert.deepEqual(magicPowersLines(leaping), ['Cast when used: Levitate']);
  const silent = createRegularMagicItem(TEMPLATES, 1, 'male', seq(0.5, 0.99), SILENT);
  assert.deepEqual([silent.group, silent.templateIndex], ['ReligiousItems', HOLY_TOME]);
  const bare = createRegularMagicItem(readMagicDef(craft([{ name: 'Ring of Luck', type: 0, group: 1 }])), 1, 'male', seq(0.9, 0.99));
  assert.deepEqual([bare.group, bare.templateIndex, bare.enchantments], ['Jewellery', WAND, []], 'no power to need a slot');
});

test('HELD-BASE A DEAD STREAM ENDS: a stream that only ever draws the Wand is drawn MAGIC_BASE_DRAWS times - the soul trap\'s 64 - and the piece then takes armour, every set\'s first group and every piece of it worn (mutants: the bound, the fallback, the loop\'s start)', () => {
  assert.equal(MAGIC_BASE_DRAWS, 64);
  const r = seq(0.99);
  const it = createRegularMagicItem(TEMPLATES, 1, 'male', r, VENOM);
  const a = seq(0.99);
  const armour = createRandomArmor(1, a);
  assert.equal(it.group, 'Armor');
  assert.equal(it.templateIndex, armour.templateIndex);
  assert.ok(wearableItem(it));
  assert.equal(r.taken(), 2 * 64 + a.taken(), 'sixty-four draws of two rolls, then the armour\'s');
});

test('HELD-BASE ONE RECORD, ONE PIECE (the report\'s question - a guard): every regular row of the table mints its own name and its own rows, and the box reads them - "Leaping %it" casts Levitate, "%it of Venom Spitting" enhances Dragonish and is no use from the pack; worksUnworn answers the Used payload alone (mutant: the predicate)', () => {
  REGULAR.forEach((rec, i) => {
    const it = createRegularMagicItem(TEMPLATES, 5, 'male', seq(0.3, 0.4, 0.5), i);
    assert.equal(it.name, rec.name);
    assert.deepEqual(it.enchantments, rec.enchantments.filter((e) => e.type !== -1), rec.name);
  });
  const venom = createRegularMagicItem(TEMPLATES, 1, 'male', seq(0, 0), VENOM);
  venom.isIdentified = true;
  assert.deepEqual(magicPowersLines(venom), ['Enhances skill Dragonish']);
  assert.deepEqual(usableMagicItems([venom]), [], 'no Cast When Used - not in the U window');
  assert.deepEqual([T.CastWhenUsed, T.CastWhenHeld, T.CastWhenStrikes, T.VampiricEffect, T.AbsorbsSpells, T.EnhancesSkill].map((type) => worksUnworn({ type, param: 0 })),
    [true, false, false, false, false, false]);
});

test('HELD-BASE THE PIECES A SAVE KEPT: a load moves a MAGIC.DEF piece minted on a Holy Tome or a Wand, its powers all worn ones, to the Amulet - its name, rows, uses and price its own; a Used cast\'s Wand, one already worn, a Wand the item maker enchanted, an artifact, a quest\'s piece and a frozen one stay; a second load moves nothing (mutants: the runner\'s call, each guard, the home)', () => {
  // the pre-fix mint's own shape: the producer's piece on the base DFU's draw gave it
  const tome = { ...createRegularMagicItem(TEMPLATES, 1, 'male', seq(0, 0), VENOM), group: 'ReligiousItems', templateIndex: HOLY_TOME, isIdentified: true };
  const wand = { ...createRegularMagicItem(TEMPLATES, 1, 'male', seq(0, 0), WISE), group: 'Jewellery', templateIndex: WAND };
  const was = { ...tome };
  const leaping = createRegularMagicItem(TEMPLATES, 1, 'male', seq(0.9, 0.99), LEAPING);
  const worn = createRegularMagicItem(TEMPLATES, 1, 'male', seq(0, 0), VENOM);   // armour (group 0's first)
  const wornAt = worn.templateIndex;
  assert.equal(worn.group, 'Armor');
  // the player's own choice at the item maker - DFU's maker takes a Wand and a held power (enchanting.js applyEnchantments)
  const made = { group: 'Jewellery', templateIndex: WAND, name: 'Wand', value: 10, maxCondition: 800, currentCondition: 800 };
  applyEnchantments(made, [enchantmentSettings('CastWhenHeld', 83)]);
  assert.deepEqual(made.enchantments.map((e) => e.type), [T.CastWhenHeld]);
  const quest = { ...wand, questItem: true };
  const frozen = Object.freeze({ ...tome });
  // an artifact whose record names a Wand and a held power (none of DFU's does - its template is its record's, AUDIT INT)
  const art = createArtifact(readMagicDef(craft([{ name: 'Held Wand', type: 2, group: 25, groupIndex: 7, ench: [[1, 83]], uses: 1500, value: 50000 }])), 0);
  assert.equal(art.templateIndex, WAND);
  const list = [tome, wand, leaping, worn, made, quest, frozen, art];
  repairItemLists([list]);
  assert.deepEqual([tome.group, tome.templateIndex, wand.group, wand.templateIndex], ['Jewellery', AMULET, 'Jewellery', AMULET]);
  assert.deepEqual({ ...tome, group: was.group, templateIndex: was.templateIndex }, was, 'nothing else of it moves');
  assert.ok(wearableItem(tome) && wearableItem(wand));
  assert.deepEqual([leaping.templateIndex, worn.group, worn.templateIndex, made.templateIndex, quest.templateIndex, frozen.templateIndex, art.templateIndex],
    [WAND, 'Armor', wornAt, WAND, WAND, HOLY_TOME, WAND]);
  assert.equal(repairMagicBases(list), 0, 'a second load finds nothing');
});
