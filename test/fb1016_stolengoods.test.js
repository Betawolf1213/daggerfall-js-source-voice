// STOLEN-GOODS (FIELD BUGS 2026-10-16, the Discord's "A bug related to infinite..."): "you steal something from the
// shelf and can sell it back to an NPC, and he'll put the item back on the shelf again, and it just goes in a circle ...
// completely disrupts the economy ... Also, when you're sent to prison, all the stolen items stay with you and aren't
// taken away."
//
// Driven over the real producers and doors: a smith's and a general store's shelves as the shop stocks them
// (shopStock.js stockShopShelf), the real Steal on both skins (ui/nativeTrade.js, ui/enhancedTrade.js), the real Sell
// window and its confirm, the real inventory windows over a shut shop's shelf (ui/nativeInventory.js,
// ui/enhancedInventory.js), the save, the wire and a realm trade's record, and the real arrest flow and court
// (scenes/arrestFlow.js over systems/court.js) from the surrender to the release. The host's two sale arms and two theft
// targets (scenes/worldModes.js, which no test can stand up whole) are read by source.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { stockShopShelf } from '../src/systems/shopStock.js';
import { BUILDING_TYPES } from '../src/world/buildingNames.js';
import { createWeapon } from '../src/combat/enemyEquipment.js';
import { ARROW_TEMPLATE, addItem, splitStack } from '../src/systems/inventory.js';
import { applyTransfer } from '../src/systems/itemTransfer.js';
import { NativeTradeWindow, TRADE_RECTS } from '../src/ui/nativeTrade.js';
import { NativeInventoryWindow } from '../src/ui/nativeInventory.js';
import { mountEnhancedTrade } from '../src/ui/enhancedTrade.js';
import { mountEnhancedInventory } from '../src/ui/enhancedInventory.js';
import { withDom } from './invdrag.mjs';
import { isStolen, landSold, confiscatedText, stolenLine } from '../src/systems/stolenGoods.js';
import { ITEM_FIELDS } from '../src/systems/itemFields.js';
import { validLootItem } from '../src/systems/loot.js';
import { RECEIVER_MARKS, takeTradeGoods } from '../src/net/realmTradeLaw.js';
import { snapshotPlayer, restorePlayer } from '../src/systems/save.js';
import { createArrestFlow } from '../src/scenes/arrestFlow.js';
import { CRIMES, addGold, totalGoldAmount, THIEVES_GUILD_FACTION_ID } from '../src/systems/court.js';
import { PrisonScreenWindow, PRISON_UPDATE_INTERVAL } from '../src/ui/prisonScreen.js';
import { equipItem, equipTableOf, isEquipped } from '../src/systems/equip.js';
import { isLightSource } from '../src/systems/useItem.js';
import { setLightSource } from '../src/systems/lightSource.js';
import { setSeed, getSeed, rand } from '../src/formats/dfRandom.js';

const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const ICONS = { getTexture: async () => ({ recordCount: 0 }), uploadRecord: () => {}, textures: new Map() };
const DAGGER = 113;

/** A weaponsmith's first shelf and a general store's, as worldModes.js openShelf stocks them. */
const smithShelf = () => stockShopShelf({ buildingType: BUILDING_TYPES.WeaponSmith, quality: 10 }, { items: [], level: 1 }, { rolls: () => 0.5, shelfIndex: 0, torchesFromItems: false });
const storeShelf = () => stockShopShelf({ buildingType: BUILDING_TYPES.GeneralStore, quality: 20 }, { items: [], level: 1 }, { rolls: () => 0.2, shelfIndex: 0, torchesFromItems: false });
const thief = (over = {}) => ({ name: 'Mack', stats: { strength: 80, endurance: 50, willpower: 50, personality: 50 }, items: [], bagItems: [], goldPieces: 0, level: 1, ...over });

/** The counter, as worldModes.js openTradeWindow hands it over: the live shelf and the live pack, the steal's sinks, and a
 *  Sell that concludes as commitTrade's Sell arm does (the coin to the counter, each piece out of the pack and to
 *  landSold - the host's one line, pinned by source below). */
function counter(mode, shelf, player, said = []) {
  return new NativeTradeWindow({
    mode, shelfItems: () => shelf, packItems: () => player.items, otherItems: () => [], isEquipped: (it) => isEquipped(it), accepts: () => true,
    enchanted: () => false, priceCtx: () => ({ quality: 10, priceAdjustment: 1000, skills: { mercantile: 50, personality: 50 } }),   // a region's par index
    gold: () => totalGoldAmount(player), rows: () => [], weight: () => ({ carriedWeightKg: 0, maxEncumbranceKg: 1e6 }),
    commit: (m, staged, price) => {
      addGold(player, price);
      for (const it of staged) { const i = player.items.indexOf(it); if (i >= 0) player.items.splice(i, 1); landSold(shelf, it); }
      return true;
    },
    icons: ICONS, entity: player, pickpocketSkill: () => 50, tallyPickpocket: () => {}, tallyCrimeGuild: () => {},
    crimeTheft: () => said.push('crime'), spawnCityGuards: () => {}, say: (l) => said.push(l),
  });
}
/** The real Steal (DoSteal), got away with: the pieces staged off the shelf, the button pressed, the roll a clean one. */
function steal(shelf, player, pieces) {
  const w = counter('Buy', shelf, player);
  for (const it of pieces) w._pickRemote(shelf.indexOf(it));
  assert.deepEqual(w.basket, pieces, 'staged whole');
  const real = Math.random;
  Math.random = () => 0.99;
  try { const [x, y, rw, rh] = TRADE_RECTS.steal; w.click(x + rw / 2, y + rh / 2); } finally { Math.random = real; }
  assert.equal(w.done, true);
  return pieces;
}
/** The real Sell: the piece staged off the pack's list, the mode action, Yes. Answers the price paid. */
function sell(shelf, player, item) {
  const w = counter('Sell', shelf, player);
  const at = w.localList().indexOf(item);
  assert.ok(at >= 0, 'the counter lists it');
  w._pickLocal(at);
  const before = totalGoldAmount(player);
  w._modeAction();
  assert.equal(w.box?.buttons, 'YesNo');
  w.input('KeyY');
  return totalGoldAmount(player) - before;
}

test('STOLEN-GOODS the report: a piece stolen off a smith\'s shelf (the real Steal) and sold back is paid for and GONE - the shelf as it was, nothing to buy back and steal again; an honest sale still lands on the shelf, so a mistake can be bought back (mutants: the steal unmarked, the stolen piece shelved, the mark not the item law\'s)', () => {
  const shelf = smithShelf();
  const player = thief();
  const [dagger] = steal(shelf, player, [shelf.find((it) => it.templateIndex === DAGGER)]);
  assert.deepEqual(player.items, [dagger], 'carried off');
  assert.equal(isStolen(dagger), true, 'and marked stolen');
  assert.equal(dagger.stolen, true, 'the field itself, as the save and the wire carry it');
  assert.equal(ITEM_FIELDS.stolen.kind, 'bool', 'a declared field (itemFields.js): the save, the wire and the item law know it');
  const shelfBefore = [...shelf];
  const paid = sell(shelf, player, dagger);
  assert.ok(paid > 0, `the merchant pays for it (${paid} gold)`);
  assert.deepEqual(player.items, [], 'out of the pack');
  assert.deepEqual(shelf, shelfBefore, 'and NOT on the shelf: the circle is broken');
  // an honest piece - one the world handed over (a body's dagger) - still lands on the open shelf (Port-Ledger T2)
  const found = createWeapon(DAGGER, 0, () => 0.5);
  player.items.push(found);
  assert.equal(isStolen(found), false);
  assert.ok(sell(shelf, player, found) > 0);
  assert.equal(shelf.at(-1), found, 'shelved, to be bought back');
  assert.equal(shelf.length, shelfBefore.length + 1);
});

test('STOLEN-GOODS the enhanced counter\'s Steal marks what it carries off - the one piece picked, and a basket of arrows, which stay a stack of their own beside the pack\'s (mutants: the enhanced steal unmarked)', () => {
  const run = (stage) => withDom((dom) => {
    const host = dom.mk('div'); dom.body.append(host);
    const shelf = smithShelf();
    const mine = createWeapon(ARROW_TEMPLATE, 0, () => 0.5);
    const player = thief({ items: [mine] });
    const view = mountEnhancedTrade(host, {
      mode: 'Buy', shelfItems: () => shelf, packItems: () => player.items, accepts: () => true, enchanted: () => false,
      priceCtx: () => ({ quality: 10, skills: { mercantile: 50, personality: 50 } }), gold: () => 0, rows: (id) => [{ text: `#${id}`, center: true }],
      weight: () => ({ carriedWeightKg: 0, maxEncumbranceKg: 1e6 }), commit: () => {}, icons: ICONS, entity: player,
      pickpocketSkill: () => 50, tallyPickpocket: () => {}, tallyCrimeGuild: () => {}, crimeTheft: () => {}, spawnCityGuards: () => {}, say: () => {},
    });
    const named = (r) => r.querySelector('.itemname')?.children?.[0]?.textContent ?? '';
    const piece = stage(host, named, shelf);
    host.querySelectorAll('button').find((b) => b.textContent === 'Steal').onclick();
    const real = Math.random;
    Math.random = () => 0.99;
    try { host.querySelectorAll('button').find((b) => b.textContent === 'Yes').onclick(); } finally { Math.random = real; }
    view.unmount();
    return { player, mine, piece };
  });
  // the one piece picked (stealTargets' selection arm)
  const one = run((host, named, shelf) => {
    host.querySelectorAll('.itemrow').find((r) => named(r).startsWith('Dagger')).onclick({ timeStamp: 1000 });   // one click: picked, not moved
    return shelf.find((it) => it.templateIndex === DAGGER);
  });
  assert.deepEqual(one.player.items, [one.mine, one.piece], 'carried off');
  assert.equal(isStolen(one.piece), true, 'and marked');
  // a basket: the arrows staged with the counter's own button, then stolen
  const lot = run((host, named, shelf) => {
    const arrows = shelf.find((it) => it.templateIndex === ARROW_TEMPLATE);
    host.querySelectorAll('.itemrow').find((r) => named(r) === `Arrow ×${arrows.stackCount}`).onclick({ timeStamp: 1000 });   // the shelf's, not the pack's own
    host.querySelectorAll('.act.primary').find((b) => b.textContent === 'Buy').onclick();   // into the basket
    assert.equal(shelf.includes(arrows), false, 'staged');
    return arrows;
  });
  assert.deepEqual(lot.player.items.map((it) => [it.stackCount, isStolen(it)]), [[lot.mine.stackCount, false], [85, true]], 'the basket marked before it merged into the pack');
});

test('STOLEN-GOODS a shut shop\'s shelf: a take through the inventory window (both skins) is marked BEFORE it lands, so eighty-five arrows off the shelf stay a stack of their own beside the pack\'s eleven; put back, a piece is the owner\'s again; an honest pile and the wagon mark nothing (mutants: the take unmarked, marked after the merge, the put-back kept, every loot a theft, the wagon a theft)', () => {
  const ownArrows = () => createWeapon(ARROW_TEMPLATE, 0, () => 0.5);
  // the classic window
  const shelf = smithShelf();
  const arrows = shelf.find((it) => it.templateIndex === ARROW_TEMPLATE);
  const mine = ownArrows();
  const player = thief({ items: [mine] });
  const w = new NativeInventoryWindow({ items: () => player.items, icons: ICONS, entity: player, loot: { items: () => shelf, stolen: true } });
  w._pickRemote(shelf.indexOf(arrows), 'remove');
  assert.equal(shelf.includes(arrows), false, 'taken off the shelf');
  assert.deepEqual(player.items.map((it) => [it.stackCount, isStolen(it)]), [[mine.stackCount, false], [85, true]],
    'two stacks: the pack\'s own arrows untouched, the shelf\'s marked - never one stack of either');
  w._pick(w._filtered().indexOf(arrows), 'remove');   // put back
  assert.equal(shelf.at(-1), arrows, 'back on the shelf');
  assert.equal(isStolen(arrows), false, 'its owner\'s again');
  assert.deepEqual(player.items, [mine]);
  // an honest pile: the same take merges as it always did, and nothing is marked
  const pile = [ownArrows()];
  const had = mine.stackCount + pile[0].stackCount;
  const honest = new NativeInventoryWindow({ items: () => player.items, icons: ICONS, entity: player, loot: { items: () => pile } });
  honest._pickRemote(0, 'remove');
  assert.deepEqual(player.items.map((it) => [it.stackCount, isStolen(it)]), [[had, false]], 'merged, clean');
  // the wagon, shown while the shelf is the loot target, is the player's own
  const wagonItems = [ownArrows()];
  const p2 = thief();
  const wagonWin = new NativeInventoryWindow({ items: () => p2.items, wagonItems: () => wagonItems, icons: ICONS, entity: p2, loot: { items: () => smithShelf(), stolen: true } });
  wagonWin.usingWagon = true;
  const fromWagon = wagonItems[0];
  wagonWin._pickRemote(0, 'remove');
  assert.deepEqual([p2.items[0], isStolen(fromWagon)], [fromWagon, false], 'a take out of the wagon is no theft');
  // the enhanced pack: the same take, a press on the container's row
  withDom((dom) => {
    const host = dom.mk('div'); dom.body.append(host);
    const s2 = smithShelf();
    const a2 = s2.find((it) => it.templateIndex === ARROW_TEMPLATE);
    const m2 = ownArrows();
    const e = thief({ items: [m2] });
    let view = null;
    view = mountEnhancedInventory(host, { entity: e, items: () => e.items, loot: { items: () => s2, stolen: true }, onExit: () => view.unmount() });
    const named = (r) => r.querySelector('.itemname')?.children?.[0]?.textContent ?? '';
    host.querySelectorAll('.itemrow').find((r) => r.closest('.loot-win') && named(r).startsWith('Arrow')).onclick();   // a container's row: a press takes it
    assert.deepEqual(e.items.map((it) => [it.stackCount, isStolen(it)]), [[m2.stackCount, false], [85, true]], 'marked as it landed, its own stack');
    assert.equal(e.items[1], a2);
    view.unmount();
  });
});

test('STOLEN-GOODS the mark rides: a stolen piece stacks with stolen kin alone and a split keeps it; the save keeps it; the wire and a realm trade\'s record carry it to the next owner - a hand-off launders nothing (mutants: a stolen stack merged into a clean one, the split clean, the mark a receiver\'s)', () => {
  const shelf = smithShelf();
  const player = thief();
  const [arrows, dagger] = steal(shelf, player, [shelf.find((it) => it.templateIndex === ARROW_TEMPLATE), shelf.find((it) => it.templateIndex === DAGGER)]);
  // the pack's stacks
  const clean = createWeapon(ARROW_TEMPLATE, 0, () => 0.5);
  addItem(player.items, clean);
  assert.equal(player.items.length, 3, 'clean arrows do not join the stolen stack');
  const more = createWeapon(ARROW_TEMPLATE, 0, () => 0.5);
  more.stolen = true;
  addItem(player.items, more);
  assert.equal(arrows.stackCount, 85 + more.stackCount, 'stolen arrows join the stolen stack');
  const part = splitStack(player.items, arrows, 5);
  assert.deepEqual([part.stackCount, isStolen(part)], [5, true], 'a split is no way out of the mark');
  // the save
  const snap = JSON.parse(JSON.stringify(snapshotPlayer(player, {})));
  const back = thief();
  restorePlayer(back, snap);
  assert.deepEqual(back.items.map((it) => isStolen(it)), player.items.map((it) => isStolen(it)), 'every mark as it was');
  assert.equal(back.items.filter(isStolen).length, 3);
  // the wire: a dropped piece, a pile's record
  assert.equal(RECEIVER_MARKS.includes('stolen'), false, 'never the receiver\'s mark');
  assert.equal(validLootItem(JSON.parse(JSON.stringify(dagger)))?.stolen, true, 'a peer\'s copy of the record keeps it');
  // a realm trade: the record as it leaves the giver's save
  const save = { items: [JSON.parse(JSON.stringify(dagger))], goldPieces: 0 };
  const moved = takeTradeGoods(save, { items: [JSON.parse(JSON.stringify(dagger))], gold: 0 }, [0]);
  assert.equal(moved?.[0]?.stolen, true, 'and the buyer\'s copy is stolen too');
});

// ─── THE COURT ───────────────────────────────────────────────────────────────────────────────────────────────────────

/** The town host's one overlay slot, as townTalk.frame drains it (prisonrelease.test.js's). */
function mkTalk() {
  const slot = { win: null, onClosed: null };
  return {
    slot, texts: () => null, overlay: null, factionDict: null, locationName: 'Daggerfall',
    showOverlay(win, onClosed = null) { slot.win = win; slot.onClosed = onClosed; },
    pushOverlay(win, onClosed = null) { slot.win = win; slot.onClosed = onClosed; },
    close() { const cb = slot.onClosed; slot.win = null; slot.onClosed = null; cb?.(); },
  };
}
/** A defendant who robbed a smith and a general store with the real Steal: a stolen dagger worn in the hand, a stolen
 *  torch lit, stolen arrows and rations in the pack, a stolen bundle in the Materials Bag - and honest goods beside them. */
function defendant({ crime = CRIMES.Theft, gold = 0, legal = 0 } = {}) {
  const p = thief({
    health: 1, maxHealth: 40, fatigue: 0, maxFatigue: 100, magicka: 0, maxMagicka: 20,
    crimeCommitted: crime, chargedCrime: crime, legalRep: { 17: legal }, skills: 30, skillUses: [],
    haveShownSurrenderDialogue: true, arrested: false,
  });
  const smith = smithShelf(), store = storeShelf();
  const [dagger, arrows] = steal(smith, p, [smith.find((it) => it.templateIndex === DAGGER), smith.find((it) => it.templateIndex === ARROW_TEMPLATE)]);
  const [torch, rations, bread] = steal(store, p, [store.find(isLightSource), store.find((it) => it.name === 'Rations'), store.find((it) => it.name === 'Bread')]);
  applyTransfer(bread, { amount: 1 }, p.items, p.bagItems);   // into the Materials Bag, as its store moves it
  const honest = [createWeapon(120, 0, () => 0.5), createWeapon(ARROW_TEMPLATE, 0, () => 0.5)];   // a Longsword and arrows found, never stolen
  for (const it of honest) addItem(p.items, it);
  assert.ok(equipItem(p, dagger) !== null && isEquipped(dagger), 'the stolen dagger in hand');
  setLightSource(p, torch);
  p.goldPieces = gold;   // after the theft: a purse's weight is no part of the steal's carry gate here
  return { p, stolen: [dagger, arrows, torch, rations, bread], honest };
}
function flowFor(p, { rolls = () => 0.99, guildRankOf = () => null } = {}) {
  const townTalk = mkTalk();
  const said = [];
  const flow = createArrestFlow({ townTalk, playerEntity: p, regionIndex: 17, rolls, guildRankOf, advanceDays: () => {}, advanceMinutes: () => {}, say: (l) => said.push(l) });
  return { townTalk, flow, said };
}
const carriedStolen = (p) => [...p.items, ...p.bagItems].filter(isStolen);
const takenLine = confiscatedText(1 + 85 + 1 + 99 + 1);   // the dagger, the arrows, the torch, the rations, the bread

test('STOLEN-GOODS the court: a sentence served takes every stolen piece carried - the worn dagger taken off its hand, the lit torch out, the pack\'s and the Materials Bag\'s - and keeps every honest one; the line is said once, at the release (mutants: nothing taken, the worn piece left in its slot, the torch left lit, the bag unsearched, the count by records, the line unsaid)', () => {
  const { p, stolen, honest } = defendant();
  const { townTalk, flow, said } = flowFor(p);
  flow.startCourtFlow();
  townTalk.slot.win.input('KeyG');   // guilty, no coin: the whole sentence in days
  assert.ok(townTalk.slot.win instanceof PrisonScreenWindow, 'to prison');
  assert.deepEqual(carriedStolen(p), [], 'taken at the verdict');
  assert.deepEqual(p.items, honest, 'and every honest piece kept');
  assert.equal(equipTableOf(p).includes(stolen[0]), false, 'the dagger off its hand first');
  assert.equal(stolen[0].equipSlot, undefined);
  assert.equal(p.lightSource ?? null, null, 'the torch out');
  assert.deepEqual(said, [], 'said at the release, not under the prison screen');
  const w = townTalk.slot.win;
  for (let i = 0; i < w.daysInPrison; i++) w.tick(PRISON_UPDATE_INTERVAL);
  townTalk.close();
  assert.deepEqual(said, [takenLine], 'once, the pieces counted');
  assert.equal(takenLine, 'The guards take the stolen goods you carried (187 items).');
  assert.equal(confiscatedText(1), 'The guards take the stolen goods you carried (1 item).');
});

test('STOLEN-GOODS the court: every guilty exit takes them - a fine paid with no days, banishment, the failed defence\'s sentence - and an acquittal and a guild\'s rescue take nothing (mutants: the confiscation at every release, the fine\'s exit free)', () => {
  // a fine paid in full, no days: every coin flip of the court's penalty a fine
  const seed = getSeed();
  try {
    const flips = 12;   // a Theft at standing 0: 500 / 40
    let s = 1;
    for (; s < 1e6; s++) { setSeed(s); let all = true; for (let i = 0; i < flips; i++) if ((rand() & 1) === 0) { all = false; break; } if (all) break; }
    const fined = defendant({ gold: 100000 });
    const f = flowFor(fined.p);
    setSeed(s);
    f.flow.startCourtFlow();
    f.townTalk.slot.win.input('KeyG');
    assert.ok(fined.p.goldPieces < 100000, 'the fine paid');
    assert.equal(fined.p.arrested, false, 'released with no days');
    assert.deepEqual([carriedStolen(fined.p), fined.p.items], [[], fined.honest]);
    assert.deepEqual(f.said, [takenLine]);
  } finally { setSeed(seed); }
  // banished: a Murder, a name the court can banish for
  const banished = defendant({ crime: CRIMES.Murder, legal: -60 });
  const b = flowFor(banished.p, { rolls: () => 0 });
  b.flow.startCourtFlow();
  b.townTalk.slot.win.input('KeyG');
  assert.match(b.townTalk.slot.win.lines.join(' '), /banished/i, 'banished');
  assert.deepEqual([carriedStolen(banished.p), banished.p.items], [[], banished.honest], 'banishment takes them');
  assert.deepEqual(b.said, [takenLine]);
  // the failed defence: guilty after a lie, the verdict's box, the sentence
  const lied = defendant();
  const l = flowFor(lied.p, { rolls: () => 0.99 });
  l.flow.startCourtFlow();
  l.townTalk.slot.win.input('KeyN');
  l.townTalk.slot.win.input('KeyL');
  assert.equal(carriedStolen(lied.p).length, 5, 'nothing taken while the verdict\'s words stand');
  l.townTalk.close();   // the found-guilty box: its close is the sentence
  assert.deepEqual(carriedStolen(lied.p), [], 'the sentence takes them');
  // acquitted: no crime found, nothing taken
  const freed = defendant();
  const a = flowFor(freed.p, { rolls: () => 0 });
  a.flow.startCourtFlow();
  a.townTalk.slot.win.input('KeyN');
  a.townTalk.slot.win.input('KeyD');
  assert.equal(freed.p.arrested, false, 'free to go');
  assert.equal(carriedStolen(freed.p).length, 5, 'an acquittal takes nothing');
  assert.deepEqual(a.said, []);
  // the Thieves Guild's rescue: a member's break-in, the guild got them out
  const member = defendant({ crime: CRIMES.Breaking_And_Entering });
  const r = flowFor(member.p, { rolls: () => 0, guildRankOf: (id) => (id === THIEVES_GUILD_FACTION_ID ? 9 : null) });
  r.flow.startCourtFlow();
  assert.equal(member.p.arrested, false, 'rescued before any plea');
  assert.equal(carriedStolen(member.p).length, 5, 'a rescue takes nothing');
  assert.deepEqual(r.said, []);
});

test('STOLEN-GOODS wired (worldModes.js, by source): both sale arms land a piece through landSold - the counter\'s commitTrade and the keyed doSell - and neither pushes onto the shelf; the shut shop\'s shelf and a stranger\'s cupboard are loot targets marked stolen, a cupboard of one\'s own is not; the enhanced card says what the mark means (mutants: either arm shelving, either target unmarked)', () => {
  const wm = src('src/scenes/worldModes.js');
  const sellArm = wm.slice(wm.indexOf("} else if (mode === 'Sell' || mode === 'SellMagic') {"), wm.indexOf("} else if (mode === 'Repair') {"));
  assert.match(sellArm, /for \(const it of staged\) \{\n\s+const i = playerEntity\.items\.indexOf\(it\);\n\s+if \(i >= 0\) playerEntity\.items\.splice\(i, 1\);\n\s+landSold\(shelf\.items, it\);/, 'the counter');
  const doSell = wm.slice(wm.indexOf('function doSell(shelf, it) {'), wm.indexOf('function itemValue(it)'));
  assert.match(doSell, /playerEntity\.items\.splice\(playerEntity\.items\.indexOf\(it\), 1\);\n\s+landSold\(shelf\.items, it\);/, 'the keyed list');
  for (const [name, body] of [['the counter', sellArm], ['the keyed list', doSell]]) assert.doesNotMatch(body, /shelf\.items\.push\(/, `${name} pushes nothing onto the shelf`);
  assert.match(wm, /import \{ landSold \} from '\.\.\/systems\/stolenGoods\.js';/);
  const shelfArm = wm.slice(wm.indexOf('function openShelf'), wm.indexOf('function openMerchantSell'));
  assert.match(shelfArm, /if \(b\.insideOpenShop === false\) \{[\s\S]*loot: \{ items: \(\) => shelf\.items, stolen: true \},/, 'a shut shop\'s shelf');
  assert.match(wm, /const openLoot = \(privateProperty = false\) => \{[\s\S]{0,200}loot: \{ items: \(\) => c\.items, storage: !privateProperty, stolen: privateProperty \},/, 'a stranger\'s cupboard - the theft arm alone');
  // the enhanced pack's put-back: it shows a container alone (a body's frame - shipstore.test.js), so no row of the pack
  // can reach a shelf today; its stow still asks the same question the classic window's does, should a layout ever offer it
  assert.match(src('src/ui/enhancedInventory.js'), /applyTransfer\(item, \{ \.\.\.plan, amount \}, deps\.items\?\.\(\) \?\? \[\], to, \{ entity: deps\.entity, fromLocal: true, putBack: theftTarget\(deps, sessionState\(\)\) \}\);/);
  withDom((dom) => {
    const host = dom.mk('div'); dom.body.append(host);
    const shelf = smithShelf();
    const player = thief();
    const [dagger] = steal(shelf, player, [shelf.find((it) => it.templateIndex === DAGGER)]);
    let view = null;
    view = mountEnhancedInventory(host, { entity: player, items: () => player.items, onExit: () => view.unmount() });
    host.querySelectorAll('.itemrow')[0].onclick({ timeStamp: 1 });
    const words = (n) => [n.textContent ?? '', ...(n.children ?? []).map(words)].join(' ');
    assert.ok(words(host).includes(stolenLine()), 'the stolen piece\'s card says it');
    assert.equal(isStolen(dagger), true);
    view.unmount();
  });
});
