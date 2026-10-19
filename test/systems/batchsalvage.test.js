// BATCH-SALVAGE (2026-10-19; the owner: "We need to add the ability to batch salvage in the inventory";
// bible/06-Systems/Loot-Arc.md section 11, BATCH-SALVAGE). The laws pinned here:
//   - THE LAW (systems/reforge.js salvageMany): each chosen piece through salvagePiece, in the order given - its shards
//     in, it out - so a refusal costs only its own piece; a piece chosen twice breaks once; one refused (worn, locked,
//     gone) is kept and named; `salvageable` lists what would break now.
//   - THE PACK (ui/enhanced/enhancedInventory.js): the header's Batch salvage turns a pack row's press into a tick; a
//     piece that will not break is dimmed and says why; the foot counts the chosen and their shards and sweeps every
//     Magic, Rare or junk piece that would break (never a Legendary); Salvage asks once - Keep keeps them all and the
//     ticks stand, Salvage breaks them all and says so; Back, Cancel or the button again stop the choosing.

import '../modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setPref, _resetForTests } from '../../src/systems/uiPrefs.js';
import * as LR from '../../src/systems/loot/lootRarity.js';
import * as RF from '../../src/systems/reforge.js';
import { setLocked } from '../../src/systems/item/itemLock.js';
import { createWeapon } from '../../src/combat/enemyEquipment.js';
import { equipItem } from '../../src/systems/equip.js';
import { withDom } from '../invdrag.mjs';
import { destroyEnhancedNotice } from '../../src/ui/enhanced/enhancedNotice.js';
import { itemLongName } from '../../src/systems/item/itemInfo.js';
import {
  mountEnhancedInventory, BATCH_LABEL, BATCH_HINT, BATCH_COUNT, BATCH_ASK, BATCH_DONE, BATCH_SWEEPS, batchRefusal, SALVAGE_CLASSIC,
} from '../../src/ui/enhanced/enhancedInventory.js';

const on = () => { _resetForTests(); setPref('lootRarity', true); };
const lcg = (seed) => () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return (seed >>> 8) / 0x800000; };
const known = (it) => Object.assign(it, { isIdentified: true });
const graded = (tier, seed = 1, template = 113) => known(LR.applyRarity(createWeapon(template, 1), tier, lcg(seed)));
const textOf = (n) => `${n.textContent ?? ''}${(n.children ?? []).map(textOf).join('')}`;

test('BATCH-SALVAGE: salvageMany breaks each chosen piece through salvagePiece - its shards in, it out; a refusal costs only its own piece, a piece chosen twice breaks once, one gone is named; salvageable lists what would break now', () => {
  on();
  const magic = graded('magic', 1), rare = graded('rare', 2), legend = graded('legendary', 3), locked = graded('rare', 4), common = createWeapon(113, 1);
  setLocked(locked, true);
  const stranger = graded('magic', 5);   // never in this pack
  const items = [magic, common, rare, locked, legend];
  assert.deepEqual(RF.salvageable(items), [magic, rare, legend], 'the pack\'s order; never the locked piece or a Common one');
  assert.deepEqual(RF.salvageable(null), []);
  const r = RF.salvageMany([rare, magic, magic, locked, stranger], { items });
  assert.deepEqual([r.count, r.shards], [2, RF.SALVAGE_SHARDS.rare + RF.SALVAGE_SHARDS.magic], 'the Rare and the Magic, once each');
  assert.deepEqual(r.refused.map((x) => [x.item, x.reason]), [[locked, 'locked'], [stranger, 'gone']], 'each refusal named, in order');
  assert.deepEqual(items.filter((it) => it.rarity), [locked, legend], 'the two broken, the rest kept');
  assert.equal(RF.shardsHeld(items), 4, 'their shards in the pack');
  assert.deepEqual(RF.salvageMany([], { items }), { count: 0, shards: 0, refused: [] });
  assert.deepEqual(RF.salvageMany(null, { items }), { count: 0, shards: 0, refused: [] });
  _resetForTests(); setPref('lootRarity', false);
  assert.deepEqual(RF.salvageable([legend]), [], 'the tiers off: nothing breaks');
  assert.equal(RF.salvageMany([legend], { items }).refused[0].reason, 'off');
});

test('BATCH-SALVAGE: the refusals in words - the card\'s own where it has them, a line of its own for the rest', () => {
  assert.equal(batchRefusal('Ring', 'classic'), SALVAGE_CLASSIC('Ring'));
  for (const why of ['worn', 'bound', 'quest', 'aetheric', 'gilded', 'artifact', 'not', 'off']) assert.ok(batchRefusal('Ring', why).startsWith('Ring '), why);
  assert.notEqual(batchRefusal('Ring', 'worn'), batchRefusal('Ring', 'bound'));
  assert.deepEqual(BATCH_SWEEPS.map(([label]) => label()), ['All Magic', 'All Rare', 'All junk'], 'never a Legendary sweep');
  assert.equal(BATCH_ASK(1, 3)[0], 'Salvage 1 piece?');
  assert.equal(BATCH_DONE(2, 4, 1), 'Salvaged 2 pieces, for 4 Welkynd Shards. 1 would not break and was kept.');
});

/** The pack mounted over `items`, its rows found by name, its buttons by their words, its keys fired. */
function withPack(items, fn) {
  on();
  destroyEnhancedNotice();
  globalThis.location = { search: '?skin=enhanced' };
  withDom((dom) => {
    const host = dom.mk('div');
    dom.body.append(host);
    const e = { name: 'Aelwyn', career: { name: 'Spellsword' }, stats: { strength: 50, endurance: 48 }, items, goldPieces: 10 };
    const view = mountEnhancedInventory(host, { entity: e, items: () => e.items, onExit: () => {}, dropItem: () => {} });
    let t = 0;
    const press = (b) => b.onclick({ timeStamp: (t += 5000), detail: 1, stopPropagation() {} });
    const act = (label, root = host) => root.querySelectorAll('.act').find((b) => b.textContent === label) ?? null;
    const actStarting = (label) => host.querySelectorAll('.act').find((b) => b.textContent.startsWith(label)) ?? null;
    const rowOf = (item) => {
      for (const tab of host.querySelectorAll('.packtab')) {
        const r = host.querySelectorAll('.itemrow').find((x) => textOf(x).includes(item.name));
        if (r) return r;
        tab.onclick();
      }
      return host.querySelectorAll('.itemrow').find((x) => textOf(x).includes(item.name)) ?? null;
    };
    const dialog = () => dom.doc.querySelectorAll('.inv-salvage-many')[0] ?? null;
    const key = (k, code = '') => dom.win.fire('keydown', { key: k, code, repeat: false, target: null, preventDefault() {}, stopPropagation() {} });
    try { fn({ dom, host, e, press, act, actStarting, rowOf, dialog, key }); } finally { view.unmount(); }
  });
}

test('BATCH-SALVAGE: the pack chooses - Batch salvage ticks rows instead of picking them, a piece that will not break is dimmed and says why, the foot counts the chosen and their shards; Salvage asks once, Keep keeps them all, Salvage breaks them all and says so', () => {
  const magic = graded('magic', 1), rare = graded('rare', 2), legend = graded('legendary', 3), locked = graded('rare', 4);
  setLocked(locked, true);
  withPack([magic, rare, legend, locked, createWeapon(120, 1)], ({ dom, host, e, press, act, rowOf, dialog }) => {
    assert.ok(act(BATCH_LABEL), 'the header offers it');
    assert.equal(host.querySelectorAll('.salvagefoot').length, 0, 'no foot until it chooses');
    press(act(BATCH_LABEL));
    assert.equal(act(BATCH_LABEL).getAttribute('aria-pressed'), 'true');
    assert.ok(textOf(host).includes(BATCH_HINT), 'the foot asks for a choice');
    assert.equal(act('Salvage 0').disabled, true, 'nothing chosen, nothing to press');
    press(rowOf(magic));
    assert.ok(rowOf(magic).classList.contains('salvpick'), 'ticked');
    assert.equal(host.querySelectorAll('.inv-info').length, 0, 'no card opened by the press');
    press(rowOf(legend));
    assert.ok(textOf(host).includes(BATCH_COUNT(2, RF.SALVAGE_SHARDS.magic + RF.SALVAGE_SHARDS.legendary)));
    press(rowOf(legend));
    assert.ok(!rowOf(legend).classList.contains('salvpick'), 'a second press takes the tick off');
    assert.ok(rowOf(locked).classList.contains('salvno'), 'the locked piece dimmed');
    press(rowOf(locked));
    assert.ok(!rowOf(locked).classList.contains('salvpick'), 'and never ticked');
    assert.ok(textOf(dom.body).includes(batchRefusal(itemLongName(locked), 'locked')), 'it says why');
    press(rowOf(rare));
    press(act('Salvage 2'));
    assert.ok(dialog(), 'asked first');
    assert.ok(BATCH_ASK(2, RF.SALVAGE_SHARDS.magic + RF.SALVAGE_SHARDS.rare).every((l) => textOf(dialog()).includes(l)));
    assert.ok(textOf(dialog()).includes(itemLongName(magic)) && textOf(dialog()).includes(itemLongName(rare)), 'the chosen named');
    press(act('Keep', dialog()));
    assert.equal(dialog(), null);
    assert.ok(e.items.includes(magic) && e.items.includes(rare), 'Keep keeps them all');
    assert.ok(rowOf(magic).classList.contains('salvpick'), 'and the ticks stand');
    press(act('Salvage 2'));
    press(act('Salvage', dialog()));
    assert.equal(dialog(), null);
    assert.ok(!e.items.includes(magic) && !e.items.includes(rare), 'both broken');
    assert.ok(e.items.includes(legend) && e.items.includes(locked), 'the rest kept');
    assert.equal(RF.shardsHeld(e.items), RF.SALVAGE_SHARDS.magic + RF.SALVAGE_SHARDS.rare, 'into their shards');
    assert.ok(textOf(dom.body).includes(BATCH_DONE(2, RF.SALVAGE_SHARDS.magic + RF.SALVAGE_SHARDS.rare)), 'and says so');
    assert.equal(host.querySelectorAll('.salvagefoot').length, 0, 'the choosing over');
  });
});

test('BATCH-SALVAGE: the sweeps - All Magic, All Rare and All junk add what would break (never a worn or locked piece, never a Legendary); Clear, Cancel, the button again and Back each stop or empty the choosing', () => {
  const m1 = graded('magic', 1), m2 = graded('magic', 2), lockedMagic = graded('magic', 3), rare = graded('rare', 4), junkRare = Object.assign(graded('rare', 5), { junk: true }), legend = graded('legendary', 6);
  setLocked(lockedMagic, true);
  const worn = graded('magic', 7);
  const items = [m1, m2, lockedMagic, rare, junkRare, legend, worn];
  equipItem({ items }, worn);
  withPack(items, ({ host, e, press, act, actStarting, rowOf, dialog, key }) => {
    press(act(BATCH_LABEL));
    assert.equal(actStarting('All Magic').textContent, 'All Magic (2)', 'the two that would break: never the locked or the worn one');
    assert.equal(actStarting('All Rare').textContent, 'All Rare (2)');
    assert.equal(actStarting('All junk').textContent, 'All junk (1)');
    press(actStarting('All Magic'));
    assert.ok(act('Salvage 2'));
    press(act('Clear'));
    assert.ok(act('Salvage 0'), 'Clear empties it');
    press(actStarting('All junk'));
    press(actStarting('All Rare'));
    assert.ok(act('Salvage 2'), 'the junk Rare once');
    assert.ok(!rowOf(legend).classList.contains('salvpick'), 'no sweep takes a Legendary');
    press(act('Cancel'));
    assert.equal(host.querySelectorAll('.salvagefoot').length, 0, 'Cancel stops it');
    press(act(BATCH_LABEL));
    press(act(BATCH_LABEL));
    assert.equal(host.querySelectorAll('.salvagefoot').length, 0, 'the button again stops it');
    press(act(BATCH_LABEL));
    key('Escape');
    assert.equal(host.querySelectorAll('.salvagefoot').length, 0, 'Back stops it, the pack kept');
    assert.ok(host.querySelectorAll('.itemrow').length > 0);
    press(act(BATCH_LABEL));
    press(actStarting('All Magic'));
    press(act('Salvage 2'));
    press(act('Salvage', dialog()));
    assert.equal(dialog(), null);
    assert.deepEqual(e.items.filter((it) => it.rarity === 'magic'), [lockedMagic, worn], 'broken; the locked and the worn kept');
  });
});

test('BATCH-SALVAGE: the button stands while a piece would break - none for a pack of Common gear', () => {
  withPack([createWeapon(120, 1)], ({ act }) => assert.equal(act(BATCH_LABEL), null));
  withPack([graded('rare', 1)], ({ act }) => assert.ok(act(BATCH_LABEL)));
});
