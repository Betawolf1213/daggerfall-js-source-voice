// @ts-check
// ═══════════════════════════════════════════════════════════════════
// TOWN-ECON (2026-10-16, bible/06-Systems/Town-Economy-Arc.md; Mac: "give every city and village a dynamic economy
// system, where even players can affect the influence. Allowing players to hover over towns and see an economy tooltip
// along with guild control"): THE TOWN ECONOMY'S LAW - one Prosperity a town, 0 to 100, and what it does to the town's
// counters and its card.
//
//  - A TOWN is a MAPS location of type TownCity, TownHamlet or TownVillage (formats/mapsFile.js LOCATION_TYPES 0-2),
//    keyed by its map pixel (`townKeyOf`: the key the relay's receipts and the market's boards already carry - TE2).
//  - THE BASELINE IS PURE (TE0 decision 2): the town's size, its own market cycle over real UTC days (a closed form,
//    phased by its pixel - a player away a month reads what one who stayed reads), its seat's Standing and Edict, and a
//    raid at its gates. THE PLAYERS' SHARE (TE2, the account service's count of witnessed acts) is an argument, bounded
//    here to TOWN_PLAYERS_MAX.
//  - THE PRICE (TE0 decision 4 - Mac: "Wider swings, ±25%+", an exception to the Economy arc's law 5, bounded): what a
//    counter ASKS moves by up to TOWN_PRICE_SWING each way; what it PAYS only ever falls (a Struggling town has less
//    coin), so the town economy adds no gold to a sale; with a seat's factor the product never goes below
//    TOWN_FACTOR_FLOOR, the deepest a seat alone already gives (townSeatLaw.js seatShopFactor). Never through
//    regionPriceAdjustment (Seats-Arc 7.2: quest gold reads that index).
//
// Not a DFU member: DFU prices by region alone (RegionData.PriceAdjustment, FormulaHelper.CalculateCost). Ledger A
// (THE TOWN ECONOMY's row). Pure: no clock, no network, no DOM.
// ═══════════════════════════════════════════════════════════════════

import { charterName, guildWords, seatTipOf } from './townSeatLaw.js';   // TE0 decision 5: a seat town's Charter, its area's holder
import { t } from '../systems/textManager.js';   // L10N4: the card's words in the player's language, each read when it is said

/** The location types that are towns (mapsFile.js LOCATION_TYPES TownCity, TownHamlet, TownVillage). */
export const TOWN_ECON_TYPES = Object.freeze([0, 1, 2]);
/** Whether a MAPS location type is a town with an economy. @param {unknown} type */
export const isEconTown = (type) => TOWN_ECON_TYPES.includes(/** @type {number} */ (type));
/** A town's key: its map pixel, as the relay's receipts and the market's boards name it. @param {number} px @param {number} py */
export const townKeyOf = (px, py) => py * 1000 + px;

/** The middle of the scale, and its ends. */
export const TOWN_BASE = 50;
export const TOWN_PROSPERITY_MAX = 100;
/** The town's size, by its location type: a city, a town, a village. */
export const TOWN_SIZE = Object.freeze({ 0: 6, 1: 2, 2: -2 });
/** The market cycle: two waves over real days, each its amplitude and its period in days. */
export const TOWN_CYCLE = Object.freeze([Object.freeze({ amp: 12, days: 11 }), Object.freeze({ amp: 6, days: 29 })]);
/** A seat town's Standing moves it (Standing - 50) / TOWN_STANDING_DIV. */
export const TOWN_STANDING_DIV = 5;
/** The Edict in force at a seat town, as a term of its Prosperity (townSeatLaw.js EDICTS' ids). */
export const TOWN_EDICT_TERMS = Object.freeze({ 'market-day': 6, festival: 8, 'open-gates': 3, levy: -6, curfew: -4 });
/** A raid running at the town's gates. */
export const TOWN_RAID_TERM = -15;
/** The most the players' share (TE2) adds. */
export const TOWN_PLAYERS_MAX = 30;
/** The bands, highest first: each its name and its least Prosperity. @type {ReadonlyArray<readonly [string, number]>} */
export const TOWN_BANDS = Object.freeze([
  /** @type {readonly [string, number]} */ (Object.freeze(['Booming', 85])), /** @type {readonly [string, number]} */ (Object.freeze(['Thriving', 65])),
  /** @type {readonly [string, number]} */ (Object.freeze(['Steady', 35])), /** @type {readonly [string, number]} */ (Object.freeze(['Struggling', 15])),
  /** @type {readonly [string, number]} */ (Object.freeze(['Destitute', 0])),
]);
/** How far a town moves what its counters ask, each way (Mac: "Wider swings, ±25%+"). */
export const TOWN_PRICE_SWING = 0.25;
/** The deepest a counter's asking factor goes, a town's and a seat's together: a seat's own deepest, a crown's loved
 *  member on Market Day (townSeatLaw.js seatShopFactor: MEMBER_DISCOUNT.crown 0.15, LOVED_DISCOUNT 0.05,
 *  MARKET_DAY_DISCOUNT 0.10). */
export const TOWN_FACTOR_FLOOR = 0.70;
/** A real day, ms - the cycle's day and TE2's tally's. */
export const TOWN_DAY_MS = 86_400_000;
/** The real (UTC) day of an epoch ms. @param {number} ms */
export const townDayOf = (ms) => Math.floor(ms / TOWN_DAY_MS);

/** FNV-1a over a short string (net/patronLaw.js's mix) - a town's phases. @param {string} s */
function fnv(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
}
/** THE MARKET CYCLE: a town's own rise and fall on a real day - each wave phased by the town's key. @param {number} key @param {number} day */
export function townCycle(key, day) {
  let s = 0;
  for (let i = 0; i < TOWN_CYCLE.length; i++) {
    const w = TOWN_CYCLE[i];
    const wave = Math.sin(2 * Math.PI * (day / w.days + fnv(`${key}:${i}`) / 4294967296));   // the wave's angle, never a wrap
    s += w.amp * wave;
  }
  return s;
}
/** A seat town's term: its holder's Standing and the Edict in force - 0 for an unheld seat, or none.
 *  @param {any} seat a dressed seat (net/townSeatBook.js dressed), or null */
export function townSeatTerm(seat) {
  const h = seat?.holder;
  if (!h) return 0;
  const standing = Number.isFinite(h.standing) ? (h.standing - 50) / TOWN_STANDING_DIV : 0;
  return standing + (TOWN_EDICT_TERMS[/** @type {keyof typeof TOWN_EDICT_TERMS} */ (h.edict)] ?? 0);
}
/** A Prosperity held to the scale, a whole number. @param {number} p */
const held = (p) => Math.max(0, Math.min(TOWN_PROSPERITY_MAX, Math.round(Number.isFinite(p) ? p : TOWN_BASE)));
/**
 * A TOWN'S PROSPERITY on a real day, 0 to 100.
 * @param {{ key: number, type: number, day: number, seat?: any, raided?: boolean, players?: number }} t
 *   `seat` the town's own seat, dressed (null for none); `raided` a raid running at its gates; `players` TE2's share
 */
export function townProsperity({ key, type, day, seat = null, raided = false, players = 0 }) {
  const share = Math.max(0, Math.min(TOWN_PLAYERS_MAX, Number.isFinite(players) ? players : 0));
  return held(TOWN_BASE + (TOWN_SIZE[/** @type {0|1|2} */ (type)] ?? 0) + townCycle(key, day) + townSeatTerm(seat) + (raided ? TOWN_RAID_TERM : 0) + share);
}
/** A Prosperity's band. @param {number} p */
export const townBandOf = (p) => (TOWN_BANDS.find(([, least]) => held(p) >= least) ?? TOWN_BANDS[TOWN_BANDS.length - 1])[0];
/** What the town's counters ASK, as a factor of their price - 0.75 Booming at 100 to 1.25 at 0. @param {number} p */
export const townBuyFactor = (p) => 1 - (TOWN_PRICE_SWING * (held(p) - TOWN_BASE)) / TOWN_BASE;
/** What they PAY for a sale - below the middle less, never more than 1. @param {number} p */
export const townSaleFactor = (p) => Math.min(1, 1 - (TOWN_PRICE_SWING * (TOWN_BASE - held(p))) / TOWN_BASE);
/**
 * A COUNTER'S FACTOR in the town, for `mode` (the trade window's: Buy, Repair, Sell) - the town's asking factor times
 * the seat's (`seatFactor`, townSeatLaw.js seatShopFactor, 1 for none), never below TOWN_FACTOR_FLOOR; a sale's, the
 * town's paying factor alone (a seat moves no sale).
 * @param {number} p @param {string} mode @param {number} [seatFactor]
 */
export function townShopFactor(p, mode, seatFactor = 1) {
  if (mode === 'Sell') return townSaleFactor(p);
  if (mode !== 'Buy' && mode !== 'Repair') return 1;
  return Math.max(TOWN_FACTOR_FLOOR, townBuyFactor(p) * seatFactor);
}

/** What a town card's trend is, yesterday to today - its id; the card says it in the player's language (TREND_WORDS).
 *  @param {number} p @param {number} prev */
export const townTrendWord = (p, prev) => (p > prev ? 'rising' : p < prev ? 'falling' : 'holding');
/** L10N4: the card's words in the player's language, each read when it is said (systems/textManager.js t). */
const BAND_WORDS = Object.freeze({
  Booming: () => t('town.econ.band.booming', 'Booming'),
  Thriving: () => t('town.econ.band.thriving', 'Thriving'),
  Steady: () => t('town.econ.band.steady', 'Steady'),
  Struggling: () => t('town.econ.band.struggling', 'Struggling'),
  Destitute: () => t('town.econ.band.destitute', 'Destitute'),
});
const TREND_WORDS = Object.freeze({
  rising: () => t('town.econ.trend.rising', 'rising'),
  falling: () => t('town.econ.trend.falling', 'falling'),
  holding: () => t('town.econ.trend.holding', 'holding'),
});
/** A band in the player's language (its id is townBandOf's). @param {string} band */
export const townBandWord = (band) => BAND_WORDS[/** @type {keyof typeof BAND_WORDS} */ (band)]?.() ?? band;
/** The card's first line: the band, the Prosperity and its trend. @param {number} p @param {number} prev */
export const townEconomyLine = (p, prev) => t('town.econ.line', 'Economy: {band} ({p}), {trend}',
  { band: townBandWord(townBandOf(p)), p: held(p), trend: TREND_WORDS[townTrendWord(held(p), held(prev))]() });
/** The card's price line - the town's own factors, as a share of the region's prices. @param {number} p */
export function townPriceLine(p) {
  const ask = Math.round((townBuyFactor(p) - 1) * 100);
  const pay = Math.round((1 - townSaleFactor(p)) * 100);
  if (ask < 0) return t('town.econ.price.less', 'Shops ask {pct}% less than the region\'s.', { pct: 0 - ask });
  if (ask > 0) {
    return pay > 0 ? t('town.econ.price.moreLess', 'Shops ask {ask}% more and pay {pay}% less than the region\'s.', { ask, pay })
      : t('town.econ.price.more', 'Shops ask {pct}% more than the region\'s.', { pct: ask });
  }
  return t('town.econ.price.same', 'Shops ask the region\'s prices.');
}
/** Why a town stands where it does, in one line - the strongest reason first (townReasonLine), each read when said. */
export const TOWN_REASONS = Object.freeze({
  get raid() { return t('town.econ.reason.raid', 'A raid at its gates is hurting trade.'); },
  get 'market-day'() { return t('town.econ.reason.marketDay', 'Market Day draws trade.'); },
  get festival() { return t('town.econ.reason.festival', 'The Festival draws visitors.'); },
  get 'open-gates'() { return t('town.econ.reason.openGates', 'Open Gates draw trade.'); },
  get levy() { return t('town.econ.reason.levy', 'The Levy weighs on trade.'); },
  get curfew() { return t('town.econ.reason.curfew', 'The Curfew keeps buyers home.'); },
  get players() { return t('town.econ.reason.players', 'Busy with travellers and traders.'); },
});
/** @param {{ raided?: boolean, edict?: string|null, players?: number }} r */
export function townReasonLine({ raided = false, edict = null, players = 0 }) {
  if (raided) return TOWN_REASONS.raid;
  if (edict && Object.prototype.hasOwnProperty.call(TOWN_EDICT_TERMS, edict)) return TOWN_REASONS[/** @type {keyof typeof TOWN_REASONS} */ (edict)];
  return players >= 1 ? TOWN_REASONS.players : null;
}
/** The area's line for a town that is not a seat: the seat whose bailiwick it is in and its holder; no seat, nobody's.
 *  @param {any} area a dressed seat, or null for a region with none */
export function townAreaLine(area) {
  if (!area) return t('town.econ.area.none', 'No guild holds this area.');
  const charter = charterName(area);
  return area.holder?.guild ? t('town.econ.area.held', 'Under {charter}: held by {guild}', { charter, guild: guildWords(area.holder.guild) })
    : t('town.econ.area.unheld', 'Under {charter}: unheld', { charter });
}

/**
 * A TOWN'S CARD for a map's hover (`{ title, lines }`, the EVENT-TIP card - ui/eventMapMarks.js readTip): its economy
 * and trend, its prices, the strongest reason, then its guild control - a seat town's own SEAT-TIP lines, or the area's
 * holder (`area` undefined where the seats are not known here: the line is left out).
 * @param {{ name: string, p: number, prev: number, raided?: boolean, players?: number, seat?: any, area?: any }} t
 * @param {number} [nowMs] the seat card's clock (a called siege)
 */
export function townTipOf({ name, p, prev, raided = false, players = 0, seat = null, area = undefined }, nowMs = Date.now()) {
  if (!name) return null;
  const lines = [townEconomyLine(p, prev), townPriceLine(p)];
  const reason = townReasonLine({ raided, edict: seat?.holder?.edict ?? null, players });
  if (reason) lines.push(reason);
  const card = seat ? seatTipOf(seat, nowMs) : null;
  if (card) lines.push(...card.lines);
  else if (area !== undefined) lines.push(townAreaLine(area));
  return { title: name, lines };
}
