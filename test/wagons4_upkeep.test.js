// WAGONS4 (2026-10-11, the owner: "Wagons have durability and require upkeep to keep from breaking down and becoming
// unusable") - WAGON UPKEEP (bible/06-Systems/Wagon-Upkeep.md): the law (systems/wagonUpkeep.js) - a wagon's soundness
// off the condition it always carried, what wears it, what mends it and what it costs; the runtime's wear by the metres
// rolled and the journey's days (systems/upkeepRuntime.js); a broken wagon refused at every door a short team is
// (systems/horseCart.js teamShort, the hosts' second word), its load still reached, its horse still ridden; the Wagon
// Yard's Mend (systems/merchantYards.js, scenes/merchantYardsHost.js, scenes/world.js mendAtYard) and its kits; a smith's
// counter refusing a horse and a wagon (systems/repairService.js); and the hosts wiring it.
import './modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  wagonCondition, wagonConditionMax, wagonSoundness, wagonState, WAGON_STATES, isBrokenWagon, rollWear, journeyWear, wearWagon,
  createWearAccount, mendPrice, mendWagon, kitMendWagon, wagonBrokenWhy, wagonPace, WAGON_UPKEEP_TEXT, WEAR_A_KM, OFFROAD, LOAD_WEAR,
  KIND_WEAR, JOURNEY_WEAR_A_DAY, JOURNEY_WEAR_MAX, THROWN_WEAR, MEND_SHARE, MEND_LEAST, MEND_FETCH, KIT_MEND, WAGON_KIT_CEILING, KIT_MINUTES,
} from '../src/systems/wagonUpkeep.js';
import { createUpkeep, registerUpkeepUses } from '../src/systems/upkeepRuntime.js';
import { newWagonItem, WAGON_KINDS, wagonTeamShort } from '../src/systems/wagonKinds.js';
import { mintCondition, setItemFields, itemUseHandler } from '../src/systems/itemTemplates.js';
import { UPKEEP_ITEM } from '../src/systems/upkeepItemRows.js';
import { repairRefusal, TRANSPORT_CANNOT_BE_REPAIRED_TEXT } from '../src/systems/repairService.js';
import { yardRowsFor, YARD_ROWS, YARD_MEND_ROW } from '../src/systems/merchantYards.js';
import { TRANSPORT, WAGON_MODE, HORSE_MODE } from '../src/systems/horseCartLaw.js';
import { makeWorld } from './hccWorld.mjs';
import { FEATURES } from '../src/systems/features.js';
import { itemStatRows } from '../src/systems/itemInfo.js';
import { repairsObjectsTarget } from '../src/systems/enchantments.js';

const rd = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const wagon = (kind = 'cart', condition = null) => { const w = mintCondition(setItemFields(newWagonItem(kind))); if (condition != null) w.currentCondition = condition; return w; };

test('WAGONS4 SOUNDNESS: the condition every wagon carried all along (template 93\'s 1400) - none carried is whole; Sound from 60%, Worn from 30, Rickety from 10 (its team 0.85 the pace), Failing (0.7), Broken at nought alone (mutants: the thresholds, the pace, broken at a point left)', () => {
  const w = wagon();
  assert.deepEqual([wagonConditionMax(w), wagonCondition(w), wagonSoundness(w)], [1400, 1400, 1]);
  assert.equal(wagonCondition({ templateIndex: 93 }), 1400, 'a wagon minted before its condition was: whole');
  assert.deepEqual(WAGON_STATES.map((s) => [s.key, s.min, s.pace]), [['sound', 0.6, 1], ['worn', 0.3, 1], ['rickety', 0.1, 0.85], ['failing', 1e-9, 0.7], ['broken', 0, 0]]);
  const at = (c) => wagonState(wagon('cart', c)).key;
  assert.deepEqual([1400, 840, 839, 420, 419, 140, 139, 1, 0].map(at), ['sound', 'sound', 'worn', 'worn', 'rickety', 'rickety', 'failing', 'failing', 'broken']);
  assert.deepEqual([isBrokenWagon(wagon('cart', 0)), isBrokenWagon(wagon('cart', 1)), isBrokenWagon({ templateIndex: 94 })], [true, false, false]);
  assert.deepEqual([wagonPace(wagon('cart', 150)), wagonPace(wagon('cart', 100)), wagonPace({ templateIndex: 94 })], [0.85, 0.7, 1]);
});

test('WAGONS4 WEAR: a kilometre of road 1% of whole, off it 2.5 times, a full load 1.75 times, the bigger wagons built heavier (0.85, 0.7); points come off whole, the metres owed kept; a journey 1% a day to 20%, never to breaking; the watch\'s throw 10% (mutants: the road unread, the load, the kind, the account\'s remainder, the floor)', () => {
  assert.deepEqual([WEAR_A_KM, OFFROAD, LOAD_WEAR, JOURNEY_WEAR_A_DAY, JOURNEY_WEAR_MAX, THROWN_WEAR], [0.01, 2.5, 0.75, 0.01, 0.2, 0.1]);
  assert.deepEqual(KIND_WEAR, { cart: 1, openWagon: 0.85, caravan: 0.7 });
  assert.equal(rollWear(1000), 0.01);
  assert.equal(rollWear(1000, { road: false }), 0.025);
  assert.equal(rollWear(1000, { load: 1 }), 0.0175);
  assert.ok(Math.abs(rollWear(1000, { kind: 'caravan', road: false, load: 0.5 }) - 0.01 * 2.5 * 1.375 * 0.7) < 1e-12);
  assert.deepEqual([rollWear(0), rollWear(-5), rollWear(NaN)], [0, 0, 0]);
  // the account: centimetres a frame, a point at a time
  const w = wagon(), acc = createWearAccount();
  let r = null;
  for (let i = 0; i < 1000; i++) r = acc.add(w, rollWear(0.5)) ?? r;   // half a kilometre in half-metre frames
  assert.equal(w.currentCondition, 1400 - 7, 'half a percent: seven points of 1400');
  assert.ok(acc.owed(w) >= 0 && acc.owed(w) < 1, 'the rest owed, never lost');
  assert.deepEqual([r.before.key, r.after.key], ['sound', 'sound']);
  // a journey: by the day, to its cap, never to nought
  assert.deepEqual([journeyWear(0), journeyWear(5), journeyWear(30)], [0, 0.05, 0.2]);
  const old = wagon('cart', 10);
  const j = wearWagon(old, journeyWear(30), { floor: 1 });
  assert.equal(old.currentCondition, 1, 'a journey always arrives');
  assert.deepEqual([j.before.key, j.after.key], ['failing', 'failing']);
  assert.equal(wearWagon(old, journeyWear(30), { floor: 1 }), null, 'at its floor: no more');
  assert.equal(wearWagon(wagon('cart', 50), THROWN_WEAR).after.key, 'broken', 'a throw can break one');
  assert.equal(wearWagon({ templateIndex: 94 }, 0.5), null, 'a horse is no wagon');
  const fresh = { group: 'Transportation', templateIndex: 93 };
  wearWagon(fresh, 0.5);
  assert.deepEqual([fresh.maxCondition, fresh.currentCondition], [1400, 700], 'its condition minted where it carried none');
  // a 100 km haul of the caravan, half loaded on the road, breaks it
  const caravan = wagon('caravan'), acc2 = createWearAccount();
  let km = 0;
  while (!isBrokenWagon(caravan) && km < 1000) { acc2.add(caravan, rollWear(100, { kind: 'caravan', load: 0.5 })); km += 0.1; }
  assert.ok(km > 90 && km < 120, `a caravan half loaded breaks some 104 km of road from new (${km.toFixed(1)})`);
});

test('WAGONS4 MENDING: the Wagon Yard makes it whole for 12% of its kind\'s value (40 at the least) by what it lacks, half again sent out to it; a kit a quarter of whole to 60% at most - a broken wagon too - an hour\'s work (mutants: the share, the least, the fetch, the ceiling, the kit\'s step)', () => {
  assert.deepEqual([MEND_SHARE, MEND_LEAST, MEND_FETCH, KIT_MEND, WAGON_KIT_CEILING, KIT_MINUTES], [0.12, 40, 0.5, 0.25, 0.6, 60]);
  assert.equal(mendPrice(wagon('caravan', 0)), Math.round(0.12 * WAGON_KINDS.caravan.value), 'whole from broken: 3000');
  assert.equal(mendPrice(wagon('caravan', 700)), 1500);
  assert.equal(mendPrice(wagon('caravan', 700), { away: true }), 2250);
  assert.equal(mendPrice(wagon('openWagon', 0)), 1080);
  assert.equal(mendPrice(wagon('cart', 0)), 40, 'the Small Cart\'s 150 x 12% is under the least');
  assert.equal(mendPrice(wagon('cart', 1390)), 1, 'a scratch: a coin');
  assert.equal(mendPrice(wagon()), 0, 'whole: nothing');
  const w = wagon('openWagon', 0);
  assert.equal(mendWagon(w), 0); assert.equal(w.currentCondition, 1400);
  const k = wagon('caravan', 0);
  const steps = [];
  for (let i = 0; i < 4; i++) { const r = kitMendWagon(k); steps.push([r.ok, k.currentCondition]); }
  assert.deepEqual(steps, [[true, 350], [true, 700], [true, 840], [false, 840]], 'a quarter at a time, to 60%');
  assert.equal(kitMendWagon(k).text, WAGON_UPKEEP_TEXT.kitCeiling('Caravan'));
  assert.deepEqual(kitMendWagon({ templateIndex: 94 }), { ok: false, text: WAGON_UPKEEP_TEXT.noWagon });
});

test('WAGONS4 BROKEN, IT GOES NOWHERE: the word the hosts hand the mod\'s runtime beside a short team\'s - the transport window\'s Cart row dark, the press refused, a team pulling stops where it is (parked, its horse in harness) - while its load is still reached and its horse still ridden away (mutants: the word dropped, the reconcile)', () => {
  const items = [{ group: 'Transportation', templateIndex: 94, horseSeed: 5 }, wagon('cart')];
  assert.equal(wagonBrokenWhy(items), null);
  assert.equal(wagonBrokenWhy([items[0]]), null, 'no wagon: no word');
  const u = createUpkeep({ items: () => items, now: () => 1e6, wagonUpkeep: () => true });
  const { w, rt, step } = makeWorld();
  const host = () => { w.short = wagonTeamShort(items) ?? u.brokenWhy(); };   // the hosts' own composition
  host(); step(2);
  assert.equal(rt.tryUseTransport(TRANSPORT.Cart).succeeded, true, 'sound: driven');
  for (let i = 0; i < 20; i++) { w.pos[2] += 0.1; host(); step(); }
  assert.equal(w.mode, TRANSPORT.Cart);
  // it breaks under its driver
  items[1].currentCondition = 0;
  host(); step(1);
  const why = WAGON_UPKEEP_TEXT.broken('Small Cart');
  assert.equal(u.brokenWhy(), why);
  assert.equal(w.mode, TRANSPORT.Foot, 'afoot');
  assert.deepEqual([rt._state().Mode, rt._state().HorseMode], [WAGON_MODE.Deployed, HORSE_MODE.HitchedToWagon], 'parked where it broke, its horse in harness');
  assert.equal(w.said.at(-1), why);
  const can = rt.canUseTransport(TRANSPORT.Cart);
  assert.deepEqual([can.allowed, can.denialMessage], [false, why], 'the window\'s Cart row dark, said why');
  assert.equal(rt.tryUseTransport(TRANSPORT.Cart).succeeded, false);
  assert.equal(rt.canAccessWagonInventory().allowed, true, 'its load still there to take');
  w.pos = [rt.view().horse.position[0] + 1.2, 0.9, rt.view().horse.position[2]]; step(1);
  assert.equal(rt.tryUseTransport(TRANSPORT.Horse).succeeded, true, 'its horse ridden off for help');
  // mended: driven again
  mendWagon(items[1]); host();
  assert.equal(u.brokenWhy(), null);
  const off = createUpkeep({ items: () => items, now: () => 1e6, wagonUpkeep: () => false });
  items[1].currentCondition = 0;
  assert.equal(off.brokenWhy(), null, 'the switch off: no breakdown');
});

test('WAGONS4 THE RUNTIME\'S WEAR: the driven wagon worn by the metres its team pulls it (driven, or following) - on the road or off, by its load - and nothing when it stays; its state\'s step down said once; a journey\'s days and the watch\'s throw; the cart\'s pace by its state (mutants: the wear when it stays, the road unread, the words every frame)', () => {
  const said = [];
  const w = wagon('cart');
  const items = [w];
  let on = true;
  const u = createUpkeep({ items: () => items, now: () => 1e6, wagonUpkeep: () => on, say: (t) => said.push(t) });
  u.tick(0.016, { mode: 'Foot', metres: 500, wagonGoes: false });
  assert.equal(wagonCondition(w), 1400, 'it stayed: no wear');
  for (let i = 0; i < 100; i++) u.tick(0.016, { mode: 'Cart', metres: 10, road: true, wagonGoes: true });
  assert.equal(wagonCondition(w), 1386, 'a kilometre of road: 1%');
  for (let i = 0; i < 100; i++) u.tick(0.016, { mode: 'Cart', metres: 10, road: false, load: 1, wagonGoes: true });
  assert.equal(wagonCondition(w), 1386 - Math.round(1400 * 0.025 * 1.75), 'off it, fully loaded');
  u.tick(0.016, { mode: 'Cart', metres: 5000, wagonGoes: true });
  assert.equal(wagonCondition(w), 1386 - 61, 'a leap of kilometres in one frame is a placement, never a road');
  assert.deepEqual(said, [], 'sound to worn: nothing to say');
  w.currentCondition = 430;
  for (let i = 0; i < 100; i++) u.tick(0.016, { mode: 'Cart', metres: 10, wagonGoes: true });
  assert.deepEqual(said, [WAGON_UPKEEP_TEXT.rickety('Small Cart')], 'worn to rickety: said once');
  w.currentCondition = 145;
  for (let i = 0; i < 100; i++) u.tick(0.016, { mode: 'Cart', metres: 10, wagonGoes: true });
  assert.deepEqual(said, [WAGON_UPKEEP_TEXT.rickety('Small Cart'), WAGON_UPKEEP_TEXT.failing('Small Cart')], 'rickety to failing: said once');
  assert.equal(u.rideScale('Cart'), 0.7, 'a failing wagon: its team at 0.7');
  w.currentCondition = 1400;
  const j = u.journey(10);
  assert.equal(wagonCondition(w), 1260, 'ten days on the road: 10%');
  assert.equal(j.after.key, 'sound');
  w.currentCondition = 5;
  u.journey(30);
  assert.equal(wagonCondition(w), 1, 'a journey always arrives - never broken on the road');
  w.currentCondition = 100;
  u.thrown();
  assert.equal(wagonCondition(w), 0, 'thrown: 10% of whole off');
  assert.ok(said.includes(WAGON_UPKEEP_TEXT.brokeNow('Small Cart')));
  assert.equal(u.mendPrice(), 40); assert.equal(u.mendPrice(true), 60);
  on = false;
  w.currentCondition = 1400;
  u.tick(0.016, { mode: 'Cart', metres: 900, wagonGoes: true });
  assert.deepEqual([wagonCondition(w), u.journey(10), u.thrown(), u.rideScale('Cart')], [1400, null, null, 1], 'the switch off: no wear, the cart its own pace');
});

test('WAGONS4 THE KIT: a Wagon Repair Kit spent on the wagon where its load is reached - an hour passed, out of the list it was used from; never past 60%; the Stable card\'s button and an inventory\'s Use alike (mutants: the reach unread, the hour, the kit not spent)', () => {
  const w = wagon('openWagon', 0);
  const items = [w, { group: 'UselessItems2', templateIndex: UPKEEP_ITEM.WagonKit, stackCount: 2 }];
  const passed = [];
  const u = createUpkeep({ items: () => items, now: () => 1e6, wagonUpkeep: () => true });
  assert.equal(u.act('kit', 0, { wagonNear: false }).text, WAGON_UPKEEP_TEXT.kitNotNear('Open Wagon'));
  const r = u.act('kit', 0, { pass: (m) => passed.push(m) });
  assert.deepEqual([r.ok, wagonCondition(w), items[1].stackCount, passed], [true, 350, 1, [60]]);
  const m = u.model();
  assert.deepEqual([m.wagon.stateKey, m.wagon.kitWorks, m.kits], ['rickety', true, 1]);
  // the Use, out of the wagon's own load
  const load = [{ group: 'UselessItems2', templateIndex: UPKEEP_ITEM.WagonKit }];
  registerUpkeepUses(u, { reach: () => ({ near: true, stabled: false, wagonNear: true, who: 'Your horse' }), pass: (n) => passed.push(n), horseCare: () => true, wagonUpkeep: () => true });
  const use = itemUseHandler(UPKEEP_ITEM.WagonKit);
  const r2 = use(load[0], load);
  assert.equal(r2.kind, 'upkeep'); assert.match(r2.text, /It is 50% sound\./);
  assert.deepEqual([load.length, items[1].stackCount, passed], [0, 1, [60, 60]], 'the wagon\'s kit spent, the pack\'s kept');
  w.currentCondition = 900;
  assert.equal(u.act('kit').ok, false, 'over 60%: a kit does no more');
  assert.match(itemStatRows(items[1]).map((x) => x.text).join(' '), /Mends 25% of a wagon, to 60% at most - an hour's work\./);
});

test('WAGONS4 THE WAGON YARD MENDS: its keeper\'s third row, the Stable\'s two; the press asks the host\'s wright (mutants: the row on the Stable, the press unread)', async () => {
  assert.deepEqual(yardRowsFor('stable'), [...YARD_ROWS]);
  assert.deepEqual(yardRowsFor('transport'), [...YARD_ROWS, YARD_MEND_ROW]);
  assert.deepEqual(YARD_MEND_ROW, { id: 'mend', label: 'Mend' });
  const host = rd('src/scenes/merchantYardsHost.js');
  assert.match(host, /actions: yardRowsFor\(p\.y\.site\.kind\)\.map\(\(r\) => \(\{ id: r\.id, label: r\.label \}\)\) \};/);
  assert.match(host, /if \(verb === 'mend' && p\.y\.site\.kind === 'transport' && \(p\.what === 'keeper' \|\| p\.what === 'sign'\)\) return mend\(p\.y\.site\) !== false;/);
  const w = rd('src/scenes/world.js');
  assert.match(w, /mend: \(\) => mendAtYard\(\),/);
  assert.match(w, /const away = !!rt\?\.physicalPersistenceEnabled && !rt\.canAccessWagonInventory\?\.\(\)\?\.allowed;\n\s*const price = upkeep\.mendPrice\(away\);/, 'a wright sent out to a wagon out of the counter\'s reach');
  assert.match(w, /if \(totalGoldAmount\(playerEntity\) < price\) \{ townTalk\.say\(WAGON_UPKEEP_TEXT\.poor\(price\)\); return; \}\n\s*deductGold\(playerEntity, price\);\n\s*mendWagon\(w\);/, 'asked, then paid, then mended');
});

test('WAGONS4 A SMITH MENDS NO HORSE AND NO WAGON: a wagon left at a smith\'s counter left the pack for days - its horse and the mod\'s wagon in the world with it - so both are refused first, in their own words, at both counters (mutants: the refusal dropped, its words)', () => {
  assert.equal(repairRefusal({ templateIndex: 93, currentCondition: 10, maxCondition: 1400 }), 'transport');
  assert.equal(repairRefusal({ templateIndex: 94, currentCondition: 10, maxCondition: 100 }), 'transport');
  assert.equal(repairRefusal({ templateIndex: 113, group: 'Weapons', currentCondition: 10, maxCondition: 100 }), null);
  assert.match(TRANSPORT_CANNOT_BE_REPAIRED_TEXT, /Wagon Yard mends wagons/);
  for (const f of ['src/ui/enhancedTrade.js', 'src/ui/nativeTrade.js']) assert.match(rd(f), /transport: \[\{ text: TRANSPORT_CANNOT_BE_REPAIRED_TEXT, center: true \}\],/, f);
  assert.match(rd('src/scenes/worldModes.js'), /: refusal === 'transport' \? \[TRANSPORT_CANNOT_BE_REPAIRED_TEXT\]/);
});

test('WAGONS4 THE SWITCH AND THE HOSTS: a Features row beside horse care, on by default and forced on online; the hosts hand the runtime the broken word beside the short team\'s, the classic window its Cart row, a journey\'s fare no cart, the watch\'s throw its wear (mutants: each door dropped)', () => {
  const f = FEATURES.find((x) => x.id === 'wagon-upkeep');
  assert.deepEqual([f.group, f.kinds, f.control.key, f.control.initial, f.control.online], ['world', ['enhanced'], 'wagonUpkeep', true, true]);
  for (const host of ['src/scenes/world.js', 'src/scenes/exterior.js']) {
    const s = rd(host);
    assert.match(s, /teamShort: \(\) => wagonTeamShort\(playerEntity\.items \?\? \[\]\) \?\? upkeep\.brokenWhy\(\),/, host);
    assert.match(s, /wagonGoes: mode === TRANSPORT_MODES\.Cart \|\| !!hccRuntimeOn\(\)\?\.view\?\.\(\)\?\.teamFollowing,/, `${host}: worn while it rolls with me`);
  }
  const w = rd('src/scenes/world.js');
  assert.match(w, /hasCart: \(\) => hasTransport\(TRANSPORT_SMALL_CART\) && !upkeep\.brokenWhy\(\),/, 'a broken wagon no journey\'s transport');
  assert.match(w, /const upkeepWagonWent = hccOn\(\) \? !!hccRuntimeOn\(\)\?\.wagonGoesOnJourney\?\.\(\) : hasTransport\(TRANSPORT_SMALL_CART\);/);
  assert.match(w, /playerTicker\.advance\(computed\.minutes\);\n\s*if \(upkeepWagonWent\) upkeep\.journey\(travelDays\(computed\.minutes\)\);/, 'the journey\'s days on the wagon that went');
  assert.match(w, /thrown: \(\) => upkeep\.thrown\(\),/);
  assert.match(rd('src/scenes/wagonWardenHost.js'), /notify\(\[WARDEN_TEXT\.thrown\(town\), WARDEN_TEXT\.fetch\]\);\n\s*thrown\(\);/);
  assert.match(rd('src/player/mountRig.js'), /hasCart: rt \? !!rt\.canUseCartFromTransportWindow\(\) : hasCart\(playerEntity\.items \?\? \[\]\) && !cartRefusal\(\),/);
  // the item law: wear is condition alone - a marked wagon's value never falls under its kind's floor
  const worn = wagon('caravan', 0);
  assert.equal(worn.value, WAGON_KINDS.caravan.value);
});

test('AUDIT WAGONS4 BROKEN, GOING NOWHERE, EVERY LANE: a broken wagon\'s pace is none (the motor rolls it nowhere); with Horse Cart and Cargo off the classic cart broken under its driver puts them afoot beside it (the mod\'s own reconcileTeam does it with the mod on); and no held Repairs Objects ever mends a wagon or a horse - the Wagon Yard\'s and the kit\'s alone (mutants: AUDIT-WAGONS4-broken-rolls, AUDIT-WAGONS4-classic-bench, AUDIT-WAGONS4-enchantment-mends)', () => {
  const w = wagon('cart', 0);
  const items = [w, { group: 'Transportation', templateIndex: 94, horseSeed: 7 }];
  const u = createUpkeep({ items: () => items, now: () => 1_000_000, wagonUpkeep: () => true });
  assert.equal(u.rideScale('Cart', 0), 0, 'broken: no pace');
  w.currentCondition = 50;
  assert.ok(u.rideScale('Cart', 0) > 0, 'failing: slow, but it rolls');
  for (const [host, set] of [['src/scenes/world.js', 'setTransportModeHere'], ['src/scenes/exterior.js', 'mountRig.setMode']]) {
    const src = rd(host);
    const at = src.indexOf('saddleHost.motion(gamePaused() ? 0 : dt, metres, galloping);');
    const line = src.indexOf(`if (mode === TRANSPORT_MODES.Cart && !hccRuntimeOn() && upkeep.brokenWhy()) ${set}(TRANSPORT_MODES.Foot);`);
    assert.ok(at > 0 && line > at && line - at < 400, `${host}: the classic bench, in the frame's upkeep`);
  }
  const sword = { group: 'Weapons', templateIndex: 113, currentCondition: 900, maxCondition: 1000 };
  const broken = wagon('caravan', 0);
  const sore = { group: 'Transportation', templateIndex: 94, currentCondition: 10, maxCondition: 100 };
  assert.equal(repairsObjectsTarget([broken, sore, sword]), sword, 'past the wagon and the horse, to the sword');
  assert.equal(repairsObjectsTarget([broken, sore]), null);
});
