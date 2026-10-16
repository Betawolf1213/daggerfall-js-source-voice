import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  TOWN_ECON_TYPES, isEconTown, townKeyOf, TOWN_BASE, TOWN_SIZE, TOWN_CYCLE, TOWN_STANDING_DIV, TOWN_EDICT_TERMS, TOWN_RAID_TERM,
  TOWN_PLAYERS_MAX, TOWN_BANDS, TOWN_PRICE_SWING, TOWN_FACTOR_FLOOR, TOWN_DAY_MS, townDayOf, townCycle, townSeatTerm, townProsperity,
  townBandOf, townBuyFactor, townSaleFactor, townShopFactor, townTrendWord, townPriceLine, townReasonLine, TOWN_REASONS, townAreaLine,
  townTipOf,
} from '../src/net/townEconLaw.js';
import { seatShopFactor, seatTipOf, EDICTS } from '../src/net/townSeatLaw.js';
import { LOCATION_TYPES } from '../src/formats/mapsFile.js';
import { ONLINE_SALE_SHARE } from '../src/systems/shopStock.js';
import { createTownEcon } from '../src/systems/townEcon.js';
import { readTip, TOWN_TIP_LINES_MAX, TIP_LINES_MAX, SEAT_TIP_TEXT_MAX } from '../src/ui/eventMapMarks.js';

// TOWN-ECON TE1 (2026-10-16, bible/06-Systems/Town-Economy-Arc.md; Mac: "give every city and village a dynamic economy
// system, where even players can affect the influence. Allowing players to hover over towns and see an economy tooltip
// along with guild control"): the law, the client's reading, and the wiring into the counters and both maps' cards.

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(join(root, p), 'utf8');
const SH = Object.freeze({ id: 'g1', name: 'the Silver Hand', tag: 'SH' });
const KEY = townKeyOf(212, 151);
const DAY = 20000;

test('TOWN-ECON the law\'s numbers: the towns are MAPS\' three town types, keyed by their pixel; the scale, the sizes, the cycle, the seat\'s and the raid\'s terms, the players\' bound, the bands, the swing and the floor are TE0\'s (mutants: TOWNECON-types, TOWNECON-key, TOWNECON-size, TOWNECON-cycle-amp, TOWNECON-cycle-days, TOWNECON-edict, TOWNECON-raid, TOWNECON-bands, TOWNECON-swing)', () => {
  assert.deepEqual(TOWN_ECON_TYPES, [LOCATION_TYPES.TownCity, LOCATION_TYPES.TownHamlet, LOCATION_TYPES.TownVillage]);
  assert.equal(isEconTown(LOCATION_TYPES.TownVillage), true);
  assert.equal(isEconTown(LOCATION_TYPES.DungeonLabyrinth), false);
  assert.equal(isEconTown(undefined), false);
  assert.equal(KEY, 151212, 'py * 1000 + px - the relay\'s receipts\' and the boards\' own pixel');
  assert.equal(TOWN_BASE, 50);
  assert.deepEqual(TOWN_SIZE, { 0: 6, 1: 2, 2: -2 });
  assert.deepEqual(TOWN_CYCLE, [{ amp: 12, days: 11 }, { amp: 6, days: 29 }]);
  assert.equal(TOWN_STANDING_DIV, 5);
  assert.deepEqual(TOWN_EDICT_TERMS, { 'market-day': 6, festival: 8, 'open-gates': 3, levy: -6, curfew: -4 });
  for (const id of Object.keys(TOWN_EDICT_TERMS)) assert.ok(EDICTS[id], `${id} is one of the seats' own Edicts`);
  assert.equal(TOWN_RAID_TERM, -15);
  assert.equal(TOWN_PLAYERS_MAX, 30);
  assert.deepEqual(TOWN_BANDS, [['Booming', 85], ['Thriving', 65], ['Steady', 35], ['Struggling', 15], ['Destitute', 0]]);
  assert.equal(TOWN_PRICE_SWING, 0.25);
  assert.equal(TOWN_DAY_MS, 86_400_000);
  assert.equal(townDayOf(DAY * TOWN_DAY_MS + TOWN_DAY_MS - 1), DAY, 'the real UTC day, not the sky\'s');
});

test('TOWN-ECON the market cycle: a closed form over real days, phased by the town - the same day reads the same anywhere, the waves repeat on their own periods, never past their amplitudes together, and two towns differ (mutants: TOWNECON-cycle-amp, TOWNECON-cycle-days, TOWNECON-cycle-unphased)', () => {
  assert.deepEqual([DAY, DAY + 1, DAY + 5].map((d) => townCycle(KEY, d).toFixed(4)), ['5.0706', '9.2042', '-5.6117']);
  assert.equal(townCycle(KEY, DAY + 11 * 29).toFixed(6), townCycle(KEY, DAY).toFixed(6), 'both waves home again after 11 x 29 days');
  let most = 0;
  for (let d = 0; d < 1200; d++) most = Math.max(most, Math.abs(townCycle(KEY, d)));
  assert.ok(most <= 18 && most > 17, `the two waves together, ${most}`);
  assert.notEqual(townCycle(KEY, DAY).toFixed(4), townCycle(townKeyOf(213, 151), DAY).toFixed(4), 'a town\'s own phase');
});

test('TOWN-ECON a town\'s Prosperity: the base, its size, its cycle, its seat (Standing and Edict, an unheld seat nothing), a raid at its gates and the players\' share bounded to TOWN_PLAYERS_MAX - a whole number held to 0..100 (mutants: TOWNECON-size, TOWNECON-standing, TOWNECON-raid, TOWNECON-players-unbounded, TOWNECON-unheld-counts, TOWNECON-unclamped)', () => {
  assert.equal(townProsperity({ key: KEY, type: 0, day: DAY }), 61, '50 + 6 + 5.07');
  assert.equal(townProsperity({ key: KEY, type: 2, day: DAY }), 53, '50 - 2 + 5.07');
  const seat = (standing, edict = null) => ({ tier: 'palace', holder: { guild: SH, standing, edict } });
  assert.equal(townSeatTerm(seat(80, 'market-day')), 12, '(80 - 50) / 5 + 6');
  assert.equal(townSeatTerm(seat(20, 'levy')), -12, '(20 - 50) / 5 - 6');
  assert.equal(townSeatTerm({ tier: 'palace', holder: null }), 0, 'an unheld seat');
  assert.equal(townSeatTerm(null), 0);
  assert.equal(townSeatTerm(seat(50, 'bounty')), 0, 'an Edict that does not move trade');
  assert.equal(townProsperity({ key: KEY, type: 0, day: DAY, seat: seat(80, 'market-day') }), 73);
  assert.equal(townProsperity({ key: KEY, type: 0, day: DAY, raided: true }), 46);
  assert.equal(townProsperity({ key: KEY, type: 0, day: DAY, players: 12 }), 73);
  assert.equal(townProsperity({ key: KEY, type: 0, day: DAY, players: 500 }), 91, 'the share bounded at 30');
  assert.equal(townProsperity({ key: KEY, type: 0, day: DAY, players: -40 }), 61, 'and never below nothing');
  assert.equal(townProsperity({ key: KEY, type: 0, day: DAY, players: NaN }), 61);
  assert.equal(townProsperity({ key: KEY, type: 0, day: DAY, seat: seat(100, 'festival'), players: 30 }), 100, 'held at the top');
  assert.equal(townProsperity({ key: KEY, type: 2, day: DAY + 5, seat: seat(0, 'levy'), raided: true }), 11, '50 - 2 - 5.61 - 10 - 6 - 15');
  assert.equal(townProsperity({ key: KEY, type: 2, day: DAY + 5, seat: seat(-100, 'levy'), raided: true }), 0, 'held at the bottom');
});

test('TOWN-ECON the bands: Destitute, Struggling, Steady, Thriving, Booming at 0, 15, 35, 65 and 85 (mutants: TOWNECON-bands)', () => {
  const at = (ps) => ps.map(townBandOf);
  assert.deepEqual(at([0, 14, 15, 34, 35, 64, 65, 84, 85, 100]),
    ['Destitute', 'Destitute', 'Struggling', 'Struggling', 'Steady', 'Steady', 'Thriving', 'Thriving', 'Booming', 'Booming']);
  assert.equal(townBandOf(-5), 'Destitute');
  assert.equal(townBandOf(140), 'Booming');
});

test('TOWN-ECON the price (TE0 decision 4, Mac: "Wider swings, ±25%+"): a counter asks a quarter less at 100 and a quarter more at 0; what it pays falls below the middle and NEVER rises above 1 - so the town adds no gold to a sale - and a town\'s and a seat\'s asking factors together never go below the seats\' own deepest (mutants: TOWNECON-swing, TOWNECON-sale-rises, TOWNECON-floor-lost, TOWNECON-floor-number, TOWNECON-seat-on-sale, TOWNECON-mode-open)', () => {
  assert.equal(townBuyFactor(100), 0.75);
  assert.equal(townBuyFactor(0), 1.25);
  assert.equal(townBuyFactor(50), 1);
  assert.equal(townBuyFactor(75), 0.875);
  assert.equal(townSaleFactor(0), 0.75);
  assert.equal(townSaleFactor(25), 0.875);
  assert.equal(townSaleFactor(50), 1);
  assert.equal(townSaleFactor(100), 1, 'a Booming town pays the region\'s - never more');
  for (let p = -10; p <= 110; p++) assert.ok(townSaleFactor(p) <= 1, `p ${p}`);
  // the floor IS the seats' deepest: a crown's loved member on Market Day
  const deepest = seatShopFactor({ tier: 'crown', holder: { guild: SH, standing: 100, edict: 'market-day' } }, SH.id);
  assert.equal(TOWN_FACTOR_FLOOR.toFixed(2), deepest.toFixed(2));
  assert.equal(TOWN_FACTOR_FLOOR, 0.7);
  for (const s of [1, 0.9, 0.85, 0.75, deepest]) for (let p = 0; p <= 100; p += 5) {
    assert.ok(townShopFactor(p, 'Buy', s) >= TOWN_FACTOR_FLOOR, `Buy p ${p} seat ${s}`);
    assert.ok(townShopFactor(p, 'Repair', s) >= TOWN_FACTOR_FLOOR, `Repair p ${p} seat ${s}`);
  }
  assert.equal(townShopFactor(100, 'Buy', 0.9), 0.7, '0.75 x 0.9 = 0.675, held at the floor');
  assert.equal(townShopFactor(50, 'Buy', 0.9), 0.9, 'a Steady town leaves the seat\'s');
  assert.equal(townShopFactor(0, 'Repair', 1), 1.25);
  assert.equal(townShopFactor(25, 'Sell', 0.7), 0.875, 'a sale is the town\'s paying factor alone - a seat moves no sale');
  assert.equal(townShopFactor(90, 'Sell', 0.7), 1);
  assert.equal(townShopFactor(100, 'Identify', 0.8), 1, 'a mode that is not a counter\'s trade');
  // the bound the floor and the sale's rule give: within one counter's region and quality, no town's discount makes a
  // buy-here-sell-there profit the online sale share (REALM P0.4) did not already allow
  const cheapestAsk = Math.min(...Array.from({ length: 101 }, (_, p) => townShopFactor(p, 'Buy', deepest)));
  const dearestPay = Math.max(...Array.from({ length: 101 }, (_, p) => townShopFactor(p, 'Sell')));
  assert.ok(ONLINE_SALE_SHARE * dearestPay < cheapestAsk, `${ONLINE_SALE_SHARE} x ${dearestPay} < ${cheapestAsk}`);
});

test('TOWN-ECON the card\'s words: the economy and its trend, the prices as a share of the region\'s, the strongest reason (a raid before the Edict before the players), and the area\'s holder (mutants: TOWNECON-price-words, TOWNECON-trend, TOWNECON-reason-order)', () => {
  assert.deepEqual([townTrendWord(60, 55), townTrendWord(55, 60), townTrendWord(55, 55)], ['rising', 'falling', 'holding']);
  assert.equal(townPriceLine(100), 'Shops ask 25% less than the region\'s.');
  assert.equal(townPriceLine(0), 'Shops ask 25% more and pay 25% less than the region\'s.');
  assert.equal(townPriceLine(50), 'Shops ask the region\'s prices.');
  assert.equal(townPriceLine(48), 'Shops ask 1% more and pay 1% less than the region\'s.');
  assert.equal(townReasonLine({ raided: true, edict: 'festival', players: 3 }), TOWN_REASONS.raid);
  assert.equal(townReasonLine({ edict: 'levy', players: 3 }), 'The Levy weighs on trade.');
  assert.equal(townReasonLine({ edict: 'bounty', players: 3 }), TOWN_REASONS.players, 'an Edict that moves no trade gives no reason');
  assert.equal(townReasonLine({}), null);
  const area = { name: 'Anticlere', tier: 'palace', holder: { guild: SH } };
  assert.equal(townAreaLine(area), 'Under the Charter of Anticlere: held by the Silver Hand <SH>');
  assert.equal(townAreaLine({ ...area, holder: null }), 'Under the Charter of Anticlere: unheld');
  assert.equal(townAreaLine(null), 'No guild holds this area.');
});

test('TOWN-ECON a town\'s card (TE0 decisions 5 and 6): its economy, its prices, one reason, then its guild control - a seat town\'s own SEAT-TIP lines after the town\'s, any other the area\'s holder, nothing of it where the seats are not known; read whole within TOWN_TIP_LINES_MAX (mutants: TOWNECON-area-dropped, TOWNECON-seat-lines-dropped, TOWNECON-lines-cut)', () => {
  const area = { name: 'Anticlere', tier: 'palace', holder: { guild: SH } };
  assert.deepEqual(townTipOf({ name: 'Ripmarket', p: 72, prev: 70, area }), {
    title: 'Ripmarket',
    lines: ['Economy: Thriving (72), rising', 'Shops ask 11% less than the region\'s.', 'Under the Charter of Anticlere: held by the Silver Hand <SH>'],
  });
  assert.deepEqual(townTipOf({ name: 'Ripmarket', p: 20, prev: 20, raided: true, area: null }).lines,
    ['Economy: Struggling (20), holding', 'Shops ask 15% more and pay 15% less than the region\'s.', TOWN_REASONS.raid, 'No guild holds this area.']);
  assert.deepEqual(townTipOf({ name: 'Ripmarket', p: 50, prev: 51 }).lines, ['Economy: Steady (50), falling', 'Shops ask the region\'s prices.'], 'the seats unknown here: no guild line');
  assert.equal(townTipOf({ name: '', p: 50, prev: 50 }), null);
  // a seat town: the seat's own card follows - every one of its lines
  const seat = { key: 7, name: 'Anticlere', tier: 'palace', region: 17, holder: { guild: SH, since: 3, standing: 55, tithe: 6, edict: 'market-day' },
    battle: { kind: 'tourney', guild: { name: 'Ebon Oath', tag: 'EO' }, against: SH } };
  const own = seatTipOf(seat, 0);
  const card = townTipOf({ name: 'Anticlere', p: 80, prev: 79, seat, area }, 0);
  assert.deepEqual(card.lines, ['Economy: Thriving (80), rising', 'Shops ask 15% less than the region\'s.', 'Market Day draws trade.', ...own.lines]);
  assert.ok(card.lines.length <= TOWN_TIP_LINES_MAX, `${card.lines.length} lines`);
  assert.ok(card.lines.length > TIP_LINES_MAX, 'more than any other card holds');
  assert.deepEqual(readTip(card, { textMax: SEAT_TIP_TEXT_MAX, linesMax: TOWN_TIP_LINES_MAX }).lines, card.lines, 'read whole');
  assert.equal(TOWN_TIP_LINES_MAX, 8);
});

test('TOWN-ECON the client\'s reading (systems/townEcon.js): online only - offline a counter keeps the seat\'s factor and no town has a card; a town with no economy has none; a town reads the law on today\'s real day with its seat, its raid and the players\' share, and its card names its area\'s holder (mutants: TOWNECON-offline-runs, TOWNECON-not-a-town, TOWNECON-day, TOWNECON-tipfn-unkept)', () => {
  const towns = new Map([[11, { name: 'Ripmarket', px: 212, py: 151, region: 17, type: 0 }], [12, { name: 'The Crypt', px: 10, py: 10, region: 17, type: 4 }]]);
  const anticlere = { key: 9, name: 'Anticlere', tier: 'palace', region: 17, pixel: [220, 150], holder: { guild: SH, standing: 50, edict: null } };
  let online = true, raided = false, players = 0;
  const econ = createTownEcon({
    online: () => online, townOf: (id) => towns.get(id), seatAt: () => null, seats: () => [anticlere],
    raidedAt: (px, py) => raided && px === 212 && py === 151, nowMs: () => DAY * TOWN_DAY_MS + 3_600_000, players: (key) => (key === KEY ? players : 0),
  });
  assert.equal(econ.prosperityOf(11), townProsperity({ key: KEY, type: 0, day: DAY }));
  assert.equal(econ.prosperityOf(12), null, 'a dungeon has no economy');
  assert.equal(econ.prosperityOf(99), null);
  assert.equal(econ.shopFactor({ townMapId: 11 }, 'Buy', 0.9), townShopFactor(61, 'Buy', 0.9));
  assert.equal(econ.shopFactor({ townMapId: 12 }, 'Buy', 0.9), 0.9, 'no economy: the seat\'s alone');
  assert.equal(econ.shopFactor(null, 'Sell', 1), 1);
  assert.deepEqual(econ.tipAt(11).lines, ['Economy: Steady (61), ' + townTrendWord(61, townProsperity({ key: KEY, type: 0, day: DAY - 1 })),
    townPriceLine(61), 'Under the Charter of Anticlere: held by the Silver Hand <SH>']);
  raided = true; players = 9;
  assert.equal(econ.prosperityOf(11), townProsperity({ key: KEY, type: 0, day: DAY, raided: true, players: 9 }));
  assert.equal(econ.tipAt(11).lines[2], TOWN_REASONS.raid);
  const f = econ.tipFnAt(11);
  assert.equal(typeof f, 'function');
  assert.equal(econ.tipFnAt(11), f, 'one kept a town');
  assert.deepEqual(f(), econ.tipAt(11));
  assert.equal(econ.tipFnAt(12), null);
  online = false;
  assert.equal(econ.prosperityOf(11), null);
  assert.equal(econ.shopFactor({ townMapId: 11 }, 'Buy', 0.9), 0.9, 'offline the counter is DFU\'s, and the seat\'s');
  assert.equal(econ.shopFactor({ townMapId: 11 }, 'Sell', 1), 1);
  assert.equal(econ.tipAt(11), null);
  assert.equal(econ.tipFnAt(11), null);
  // the seats unread: no guild line
  online = true;
  const blind = createTownEcon({ online: () => true, townOf: (id) => towns.get(id), seatAt: () => null, seats: () => null, raidedAt: () => false, nowMs: () => DAY * TOWN_DAY_MS });
  assert.equal(blind.tipAt(11).lines.length, 2);
});

test('TOWN-ECON the wiring: the counter\'s factor in worldModes.js\'s shopAdjustment (the town\'s first, the seat\'s alone without it), the world host\'s town economy and its card on the Held Map and the Overworld, a town\'s type in its row (mutants: TOWNECON-counter-unwired, TOWNECON-sale-seated, TOWNECON-heldmap-unwired, TOWNECON-overworld-seat-only, TOWNECON-type-lost)', () => {
  const wm = rd('src/scenes/worldModes.js');
  assert.match(wm, /const f = host\.townShopFactor\?\.\(b, mode\) \?\? \(mode === 'Buy' \|\| mode === 'Repair' \? host\.seatShopFactor\?\.\(b\) \?\? 1 : 1\);/);
  const w = rd('src/scenes/world.js');
  assert.match(w, /townShopFactor: \(b, mode\) => townEcon\.shopFactor\(b, mode, mode === 'Sell' \? 1 : seatEdicts\.shopFactor\(b\)\),/);
  assert.match(w, /const townEcon = createTownEcon\(\{ online: isOnlinePage, townOf: \(mapId\) => _townOfMapId\.get\(mapId\), seatAt: seatHere,\n\s*seats: \(\) => \(seatBook\?\.open === true \? seatBook\.data\?\.seats \?\? null : null\),[^\n]*\n\s*raidedAt: \(px, py\) => raidingPartiesOn\(\) && raidState\(\)\.raids\.some\(\(r\) => r\.px === px && r\.py === py && raidActive\(r, worldMinutes\(\)\)\) \}\);/);
  assert.match(w, /townTipAt: \(summary\) => townEcon\.tipAt\(summary\?\.mapID \?\? summary\?\.mapId\),/);
  assert.match(w, /const townTipAt = \(mapId\) => townEcon\.tipFnAt\(mapId\);/);
  assert.match(w, /_townOfMapId\.set\(loc\.mapTableData\.mapId >>> 0, \{ name: String\(loc\.name \?\? ''\), px: p\.x, py: p\.y, region: r, type: loc\.mapTableData\.locationType \}\);/);
  assert.doesNotMatch(w, /seatTipAt/, 'SEAT-TIP\'s seat-only maker is gone: the town\'s card carries its lines');
  const tvm = rd('src/scenes/travelViewMarks.js');
  assert.equal((tvm.match(/tip: townTipAt\((p|f)\.summary\.mapId\) \}\);/g) ?? []).length, 2, 'a near plate and a far one');
  assert.match(rd('src/ui/heldMap.js'), /const card = this\.deps\.townTipAt\?\.\(m\.summary\) \?\? \(m\.seat \? seatTipOf\(m\.seat\) : null\);/);
  assert.match(rd('src/ui/travelViewHud.js'), /readTip\(typeof tip === 'function' \? tip\(\) : tip, \{ textMax: SEAT_TIP_TEXT_MAX, linesMax: TOWN_TIP_LINES_MAX \}\)/);
});
