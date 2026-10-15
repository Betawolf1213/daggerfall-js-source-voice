// WAGON-TIERS (2026-10-15, Mac: "Yes, same tiers") - WAGON UPKEEP ON HORSE CARE'S MODEL (bible/06-Systems/Wagon-Upkeep.md,
// systems/upkeepTiers.js): one key, `wagonUpkeep`, three tiers - Off (DFU's plain wagon), Boons (the default: it wears
// and is mended, and wear costs nothing - never worse than DFU's plain wagon) and Hard (the system as it stood) - each
// player's own online (MODS-ONLINE-3's reading), every reader asking the tier through one accessor
// (systems/upkeepSwitch.js wagonUpkeepRules). Driven over the real switch, the real tile, the real shelf, the real
// upkeep, the real counter's sale and the real saddle panel and Stable page reads.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  WAGON_UPKEEP_TIER_IDS, WAGON_UPKEEP_DEFAULT, WAGON_UPKEEP_STORED, WAGON_UPKEEP_RULES, WAGON_UPKEEP_HARD, wagonUpkeepTierOfStored, isStoredWagonUpkeep,
} from '../src/systems/upkeepTiers.js';
import { wagonUpkeepRules, WAGON_UPKEEP_PREF } from '../src/systems/upkeepSwitch.js';
import { getPref, setPref, loadPrefs, _resetForTests as resetPrefs } from '../src/systems/uiPrefs.js';
import { FEATURES, FEATURE_PREF_DEFAULTS } from '../src/systems/features.js';
import { onlineForcedPref, ONLINE_PLAYERS_OWN_PREFS } from '../src/systems/onlineLane.js';
import { tileStates } from '../src/ui/enhancedMenu.js';
import { createUpkeep, registerUpkeepUses } from '../src/systems/upkeepRuntime.js';
import { wagonCondition, wagonPace, wagonSoldWhole, WAGON_UPKEEP_TEXT } from '../src/systems/wagonUpkeep.js';
import { newWagonItem, WAGON_KIND_ORDER } from '../src/systems/wagonKinds.js';
import { mintCondition, setItemFields, itemUseHandler } from '../src/systems/itemTemplates.js';
import { UPKEEP_ITEM } from '../src/systems/upkeepItemRows.js';
import { tradeCost, saleConditionPercentage } from '../src/systems/tradeModes.js';
import { conditionBasedPricesOn } from '../src/systems/rriRealism.js';
import { saddleMeters, saddleHint } from '../src/ui/enhancedSaddle.js';
import { wagonMeterTone } from '../src/ui/holdingsPages.js';

const SRC = fileURLToPath(new URL('../src/', import.meta.url));
const rd = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const ROW = FEATURES.find((f) => f.id === 'wagon-upkeep');
const wagon = (kind = 'cart', condition = null) => { const w = mintCondition(setItemFields(newWagonItem(kind))); if (condition != null) w.currentCondition = condition; return w; };
/** A wagon in each state WAGONS4 and WAGON-MEND name: sound, worn, rickety, failing, at its last point, and at nought
 *  as an older save holds it. */
const STATES = Object.freeze({ sound: 1400, worn: 700, rickety: 300, failing: 100, last: 1, nought: 0 });

/** The enhanced skin (wagon upkeep is the enhanced lane's), offline or online, a fresh shelf; torn down after. */
function onPage(online, fn) {
  const had = Object.hasOwn(globalThis, 'location') ? globalThis.location : undefined;
  globalThis.location = { search: online ? '?skin=enhanced&online' : '?skin=enhanced' };
  resetPrefs();
  try { return fn(); } finally {
    resetPrefs();
    if (had === undefined) delete globalThis.location; else globalThis.location = had;
  }
}
/** The tile's press, as the Settings screen presses it (ui/enhancedMenu.js tileStates). */
const press = (label) => { const st = tileStates(ROW); assert.equal(st.locked, false, 'the tile takes the press'); st.set(st.labels.indexOf(label)); };
const pressed = () => { const st = tileStates(ROW); return st.labels[st.at]; };
/** The upkeep as world.js and exterior.js build it - handed THE accessor - and its kit's Use registered as they do.
 *  Horse care Off: the team's own pace is horse care's (HORSE-TIERS), and these pins read the wagon's alone. */
function hostUpkeep(items, said = []) {
  const up = createUpkeep({ items: () => items, now: () => 1e6, horseCare: () => null, wagonUpkeep: wagonUpkeepRules, say: (t) => said.push(t) });
  registerUpkeepUses(up, { reach: () => ({ near: true, stabled: false, wagonNear: true, who: 'Your horse' }), pass: () => {}, horseCare: () => null, wagonUpkeep: wagonUpkeepRules });
  return up;
}
/** A counter's buying price for `item` (systems/tradeModes.js tradeCost's Sell arm, a quality-10 counter). */
const sale = (item, online = false) => tradeCost('Sell', [item], { quality: 10, online }).cost;

test('WAGON-TIERS THE ONE KEY: Off, Boons and Hard on the `wagonUpkeep` key - the table to the value, the stored values, Boons the default the shelf takes from the row (never stored), and every tier the player\'s online; the row\'s words name the tiers and no longer say online is always on, nor the breakdown WAGON-MEND retired (mutants: the default back to the old system; the row forced online)', () => {
  assert.deepEqual(WAGON_UPKEEP_TIER_IDS, ['off', 'boons', 'hard']);
  assert.equal(WAGON_UPKEEP_DEFAULT, 'boons');
  assert.deepEqual({ ...WAGON_UPKEEP_STORED }, { off: false, boons: 'boons', hard: 'hard' });
  assert.deepEqual(JSON.parse(JSON.stringify(WAGON_UPKEEP_RULES)), {
    boons: { id: 'boons', wearSlows: false, wearPrices: false },
    hard: { id: 'hard', wearSlows: true, wearPrices: true },
  });
  assert.equal(WAGON_UPKEEP_HARD, WAGON_UPKEEP_RULES.hard, 'a law handed no rules runs the system as it stood');
  assert.deepEqual([false, 'boons', 'hard', true, 'Hard', undefined].map(wagonUpkeepTierOfStored), ['off', 'boons', 'hard', 'boons', 'boons', 'boons']);
  assert.deepEqual([false, 'boons', 'hard', true, 'off', 0].map(isStoredWagonUpkeep), [true, true, true, false, false, false]);
  assert.deepEqual(ROW.control.tiers.map(([v]) => v), WAGON_UPKEEP_TIER_IDS.map((k) => WAGON_UPKEEP_STORED[k]));
  assert.deepEqual(ROW.control.tiers.map(([, l]) => l), ['Off', 'Boons', 'Hard']);
  assert.deepEqual([ROW.control.key, ROW.control.initial, ROW.control.online], [WAGON_UPKEEP_PREF, WAGON_UPKEEP_STORED[WAGON_UPKEEP_DEFAULT], 'player']);
  assert.equal(FEATURE_PREF_DEFAULTS.wagonUpkeep, 'boons', 'the shelf takes its default from the row (RF4)');
  assert.equal(onlineForcedPref('wagonUpkeep', '?online'), undefined, 'nothing forced online');
  assert.ok(ONLINE_PLAYERS_OWN_PREFS.includes('wagonUpkeep'), 'the player\'s own, by name');
  assert.ok(!/always on|breaks down/i.test(`${ROW.note} ${ROW.effect}`), 'RETIRING A FLAG DELETES THE SENTENCE');
  assert.match(ROW.note, /On Boons wear costs nothing; on Hard a worn wagon is slower and sells for less; Off is the classic wagon\.$/);
  assert.equal(ROW.effect, 'Takes effect at once. Online, each player picks their own.');
});

test('WAGON-TIERS THE TIER SWITCH ONLINE TAKES EFFECT: on an online page the tile is not locked and every press reaches every door at once, as offline - Off is DFU\'s plain wagon (no wear, its team\'s pace, no card or meter, the kit no use, sold whole), Boons wears and is mended and charges nothing, Hard charges as the system stood (mutants: the row forced online; Off still wearing; the kit used Off)', () => {
  for (const online of [true, false]) {
    onPage(online, () => {
      const items = [];
      const up = hostUpkeep(items);
      const reads = () => {
        const w = wagon('caravan');
        items.length = 0; items.push(w);
        for (let i = 0; i < 100; i++) up.tick(0.016, { mode: 'Cart', metres: 10, road: true, wagonGoes: true });
        const worn = wagonCondition(w) < 1400;
        w.currentCondition = STATES.failing;
        return {
          tier: wagonUpkeepRules()?.id ?? 'off', worn, pace: up.rideScale('Cart'), card: !!up.model().wagon, panel: !!up.saddle('Cart').wagon,
          kit: !!itemUseHandler(UPKEEP_ITEM.WagonKit)?.usable?.(), soldWhole: sale(w, online) === sale(wagon('caravan'), online),
        };
      };
      const where = online ? 'online' : 'offline';
      assert.equal(pressed(), 'Boons', `${where}: Boons, the default`);
      const boons = reads();
      assert.deepEqual(boons, { tier: 'boons', worn: true, pace: 1, card: true, panel: true, kit: true, soldWhole: true }, `${where}: Boons - worn and mended, and a failing wagon at DFU's pace, sold whole`);
      press('Off');
      assert.deepEqual(reads(), { tier: 'off', worn: false, pace: 1, card: false, panel: false, kit: false, soldWhole: true }, `${where}: Off is DFU's plain wagon, at once`);
      assert.equal(getPref(WAGON_UPKEEP_PREF), false, 'Off stored as the old switch\'s own false');
      press('Hard');
      assert.deepEqual(reads(), { tier: 'hard', worn: true, pace: 0.7, card: true, panel: true, kit: true, soldWhole: false }, `${where}: Hard - the failing pace, and a counter prices the wear`);
      press('Boons');
      assert.deepEqual(reads(), boons, `${where}: Boons again`);
      assert.equal(getPref(WAGON_UPKEEP_PREF), 'boons');
    });
  }
});

test('WAGON-TIERS BOONS IS NEVER WORSE THAN DFU\'S PLAIN WAGON: every kind in every state - sound to its last point, and at nought as an older save holds it - empty or loaded, on the road or off: on Boons its team pulls it at DFU\'s pace, a journey and the watch still wear it, and a counter buys it as a whole one; on Hard a rickety or failing wagon is slower and a worn one sells for less (mutants: the pace\'s rules dropped; the law\'s floor; the sale\'s tier unread; the sale\'s law)', () => {
  assert.equal(conditionBasedPricesOn(), true, 'Roleplay & Realism: Items\' condition prices on - the cost Hard charges');
  onPage(false, () => {
    for (const tier of ['boons', 'hard']) {
      setPref(WAGON_UPKEEP_PREF, tier);
      for (const kind of WAGON_KIND_ORDER) {
        const whole = sale(wagon(kind));
        for (const [state, condition] of Object.entries(STATES)) {
          const w = wagon(kind, condition);
          const up = hostUpkeep([w]);
          for (const load of [0, 0.5, 1]) {
            const pace = up.rideScale('Cart', load);
            if (tier === 'boons') assert.equal(pace, 1, `Boons ${kind} ${state} load ${load}: DFU's pace`);
            else assert.equal(pace, { sound: 1, worn: 1, rickety: 0.85, failing: 0.7, last: 0.7, nought: 0.7 }[state], `Hard ${kind} ${state}: the state's pace`);
          }
          if (tier === 'boons') assert.equal(sale(w), whole, `Boons ${kind} ${state}: sold as a whole wagon`);
          else if (condition < 1400) assert.ok(sale(w) < whole, `Hard ${kind} ${state}: the wear priced (${sale(w)} of ${whole})`);
          assert.equal(wagonSoldWhole(w, WAGON_UPKEEP_RULES[tier]), tier === 'boons');
        }
      }
      // the same world: a journey and the watch's throw wear it on Boons as on Hard
      const w = wagon('cart');
      const up = hostUpkeep([w]);
      up.journey(10);
      assert.equal(wagonCondition(w), 1260, `${tier}: ten days on the road, 10%`);
      up.thrown();
      assert.equal(wagonCondition(w), 1120, `${tier}: the watch's throw, 10%`);
    }
  });
  // the laws themselves, handed each tier - and Hard where they are handed none
  const failing = wagon('cart', STATES.failing);
  assert.deepEqual([wagonPace(failing, WAGON_UPKEEP_RULES.boons), wagonPace(failing, WAGON_UPKEEP_RULES.hard), wagonPace(failing)], [1, 0.7, 0.7]);
  assert.deepEqual([wagonSoldWhole(failing, null), wagonSoldWhole(failing, WAGON_UPKEEP_RULES.boons), wagonSoldWhole(failing), wagonSoldWhole({ templateIndex: 130 }, null)], [true, true, false, false], 'Off and Boons sell it whole; Hard, and a call handed none, price the wear; not a wagon, nothing');
  onPage(false, () => {
    setPref(WAGON_UPKEEP_PREF, 'boons');
    assert.equal(saleConditionPercentage(failing), 100, 'the counter\'s read of a Boons wagon: whole');
    setPref(WAGON_UPKEEP_PREF, 'hard');
    assert.equal(saleConditionPercentage(failing), 7, 'Hard: its condition');
  });
});

test('WAGON-TIERS THE OLD SWITCH MIGRATED, through a real shelf: a player who turned wagon upkeep off is on Off with nothing converted (the old switch\'s own false); one who never touched it stored nothing and plays the new default, Boons; an On written to the shelf lands on Hard, written so at the next save; a chosen tier is kept, the default stores nothing, and any other value is dropped at the load (mutants: the old On read as the default; junk kept)', () => {
  const KEY = 'dagger.ui.v1';
  let store = new Map();
  const had = Object.hasOwn(globalThis, 'localStorage'), saved = globalThis.localStorage;
  const loc = Object.hasOwn(globalThis, 'location') ? globalThis.location : undefined;
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
  globalThis.location = { search: '?skin=enhanced' };
  const withShelf = (blob) => { store = new Map([[KEY, JSON.stringify(blob)]]); resetPrefs(); loadPrefs(); };
  const shelf = () => JSON.parse(store.get(KEY) ?? '{}');
  const tier = () => wagonUpkeepRules()?.id ?? 'off';
  try {
    withShelf({ wagonUpkeep: false });
    assert.equal(tier(), 'off', 'turned off before the tiers: Off');
    setPref('showFps', true);
    assert.equal(shelf().wagonUpkeep, false, 'kept as the very value it was');
    withShelf({});
    assert.equal(tier(), 'boons', 'never touched: the new default, Boons');
    withShelf({ wagonUpkeep: true });
    assert.equal(tier(), 'hard', 'an On written to the shelf: the system as it stood');
    setPref('showFps', true);
    assert.equal(shelf().wagonUpkeep, 'hard', 'written as its tier at the next save');
    withShelf(shelf());
    assert.equal(tier(), 'hard', 'and Hard across every reload after');
    withShelf({ wagonUpkeep: 'boons', horseCare: true });
    assert.deepEqual([tier(), getPref('horseCare')], ['boons', 'hard'], 'each key its own: horse care\'s On moved beside it');
    setPref('showFps', true);
    assert.equal(Object.hasOwn(shelf(), 'wagonUpkeep'), false, 'the default stores nothing (PREF1)');
    for (const junk of ['false', 'off', 'Hard', 'casual', 7, null]) {
      withShelf({ wagonUpkeep: junk });
      assert.equal(tier(), WAGON_UPKEEP_DEFAULT, `${JSON.stringify(junk)} names no tier - the default`);
      setPref('showFps', true);
      assert.equal(Object.hasOwn(shelf(), 'wagonUpkeep'), false, `${JSON.stringify(junk)} was dropped at the load`);
    }
  } finally {
    if (had) globalThis.localStorage = saved; else delete globalThis.localStorage;
    if (loc === undefined) delete globalThis.location; else globalThis.location = loc;
    resetPrefs();
  }
});

test('WAGON-TIERS NO RED WHERE WEAR COSTS NOTHING, AND EACH TIER\'S WORDS: on Boons a failing wagon\'s chip on the saddle panel and its bar on the Stable page stop short of red, the panel says no lost pace, the Stable page says it still rolls at its pace, and a step down is said without a slowness it does not have; on Hard as the system stood (mutants: the chip red on Boons; the hint\'s pace on Boons; the bar red on Boons; Boons in Hard\'s words; the step down in Hard\'s words; the card\'s tier unread)', () => {
  const read = (wearSlows) => { const w = { name: 'Caravan', state: 'Failing', stateKey: 'failing', share: 0.07, wearSlows }; return { tone: saddleMeters({ mode: 'Cart', horse: null, wagon: w, load: null }).find((m) => m.key === 'wagon').tone, hint: saddleHint({ mode: 'Cart', horse: null, wagon: w }, { touch: true }), bar: wagonMeterTone(w) }; };
  assert.deepEqual(read(false), { tone: 'warn', hint: '', bar: '' }, 'Boons: amber, no lost pace said, rickety\'s plain bar');
  assert.deepEqual(read(true), { tone: 'low', hint: 'The caravan is failing - mend it to get its pace back', bar: 'blood' }, 'Hard: red, and the pace to get back');
  assert.deepEqual(read(undefined), read(true), 'a read that does not say is the system as it stood');
  onPage(false, () => {
    const said = [];
    const w = wagon('cart', 430);
    const up = hostUpkeep([w], said);
    for (let i = 0; i < 100; i++) up.tick(0.016, { mode: 'Cart', metres: 10, wagonGoes: true });
    w.currentCondition = 145;
    for (let i = 0; i < 100; i++) up.tick(0.016, { mode: 'Cart', metres: 10, wagonGoes: true });
    assert.deepEqual(said, [WAGON_UPKEEP_TEXT.ricketyBoons('Small Cart'), WAGON_UPKEEP_TEXT.failingBoons('Small Cart')], 'Boons: each step down said once, in its words');
    assert.deepEqual(said, ['Your Small Cart is rickety. A Wagon Yard can mend it.', 'Your Small Cart is falling apart. A Wagon Yard or a Wagon Repair Kit will mend it.']);
    assert.deepEqual([up.model().wagon.tier, up.model().wagon.wearSlows, up.saddle('Cart').wagon.wearSlows], ['boons', false, false], 'the card and the panel told the tier');
    setPref(WAGON_UPKEEP_PREF, 'hard');
    assert.deepEqual([up.model().wagon.tier, up.model().wagon.wearSlows, up.saddle('Cart').wagon.wearSlows], ['hard', true, true]);
    said.length = 0;
    const h = wagon('cart', 430);
    const hu = hostUpkeep([h], said);
    for (let i = 0; i < 100; i++) hu.tick(0.016, { mode: 'Cart', metres: 10, wagonGoes: true });
    assert.deepEqual(said, [WAGON_UPKEEP_TEXT.rickety('Small Cart')], 'Hard: in its own words - slow');
  });
  // the Stable page's lines, through its own builder (ui/holdingsPages.js wagonLines, by the page's words)
  const page = rd('src/ui/holdingsPages.js');
  assert.match(page, /const advice = w\.wearSlows === false && \(w\.stateKey === 'failing' \|\| w\.stateKey === 'rickety'\) \? WAGON_ADVICE_BOONS\[w\.stateKey\]/);
  assert.match(page, /get rickety\(\) \{ return t\('holdings\.wagon\.boons\.rickety', 'Rickety - it still rolls at its pace\.'\); \}/);
  assert.match(page, /get failing\(\) \{ return t\('holdings\.wagon\.boons\.failing', 'Failing - it still rolls at its pace\.'\); \}/);
});

test('WAGON-TIERS THE ONE ACCESSOR AND THE FOUR HOSTS: no module but the switch reads the wagon upkeep key, the old boolean switch is gone, and every reader is handed the one accessor - world.js and exterior.js hand it to the upkeep (the wear, the pace, the Stable page, the saddle panel) and to the kit\'s Use, world.js\'s Wagon Yard wright asks it, a counter\'s sale asks it; worldModes.js and dungeonContext.js stand no transport and read nothing', () => {
  const files = [];
  const walk = (dir) => { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p); else if (f.endsWith('.js')) files.push(p); } };
  walk(SRC);
  const rel = (p) => p.slice(SRC.length);
  assert.deepEqual(files.filter((p) => /getPref\((WAGON_UPKEEP_PREF|'wagonUpkeep')\)/.test(readFileSync(p, 'utf8'))).map(rel), ['systems/upkeepSwitch.js'], 'one reader of the key');
  assert.deepEqual(files.filter((p) => /\bwagonUpkeepOn\b/.test(readFileSync(p, 'utf8'))).map(rel), [], 'the boolean switch is gone');
  for (const host of ['world.js', 'exterior.js']) {
    const s = rd(`src/scenes/${host}`);
    assert.match(s, /import \{ horseCareRules, wagonUpkeepRules \} from '\.\.\/systems\/upkeepSwitch\.js';/, host);
    assert.match(s, /horseCare: horseCareRules, wagonUpkeep: wagonUpkeepRules,\n\s*where: /, `${host}: the upkeep`);
    assert.match(s, /reach: \(\) => upkeepReach\(hccRuntimeOn\(\), !!hccRuntimeOn\(\)\), horseCare: horseCareRules, wagonUpkeep: wagonUpkeepRules,/, `${host}: the kit's Use`);
  }
  assert.match(rd('src/scenes/world.js'), /function mendAtYard\(\) \{\n\s*if \(!wagonUpkeepRules\(\)\) \{ setMidScreenText\('The wright has no work for you\.'\); return true; \}/, 'world.js: the Wagon Yard\'s wright');
  assert.match(rd('src/systems/tradeModes.js'), /export function saleConditionPercentage\(item, \{ online = isOnlinePage\(\) \} = \{\}\) \{\n(\s*\/\/[^\n]*\n)*\s*if \(wagonSoldWhole\(item, wagonUpkeepRules\(\)\)\) return 100;/, 'tradeModes.js: a counter\'s sale');
  for (const host of ['worldModes.js', 'dungeonContext.js']) assert.ok(!/wagonUpkeep/.test(rd(`src/scenes/${host}`)), `${host}: no transport`);
});
