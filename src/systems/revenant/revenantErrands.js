// @ts-check
// RVN-ERRAND (2026-10-17, the owner: "Add the ability to send revnants off on timed missions to anywhere within tamriel
// (They disappear and come back brining rewards like loot, crafting materials, currency, etc)") - A SWORN ONE ABROAD.
// From the Companions page (ui/companionRoster.js) the player sends a sworn revenant on an errand to one of Tamriel's
// nine provinces (world/tamriel/tamrielGeography.js PROVINCES - a city of it named for the errand, drawn on its seed),
// for one of three ventures: PLUNDER (loot first), FORAGE (crafting materials first) or SELL-SWORD (gold first). It
// leaves through its portal, is gone the province's days on the character's own clock (worldTick.js ownMinutes - online
// it stands while the player is away, and a rest or a journey carries it on), and comes back with its haul into the
// player's purse, pack and Materials Bag. The law is here; the acts are systems/revenant/revenantCompanions.js
// (sendOnErrand, recallFromErrand, the party's wake).
//
//  - THE PLACES (ERRAND_PLACES): the Bay's own two a day off, the far shores four; each a DANGER (1-5) and the goods
//    its land gives - Skyrim's orichalcum and pelts, Morrowind's ebony and the Dwemer's metal, Black Marsh's venom.
//  - ITS ODDS (errandOdds): its rank and its kit (revenantGear.js gearPower) against the place's danger, ODDS.BASE +
//    ODDS.PER a point over it, within ODDS.MIN..ODDS.MAX, a Devoted one ODDS.DEVOTED more. Won, its whole haul and
//    WON_LOYALTY; HARD-WON, HARD_SHARE of it, and it comes back hurt - resting (revenantCompanions.js REVENANT_REST_MIN).
//    Never lost: an errand is no way to lose a companion - only its own loyalty is (RVN11b's desertion runs as ever).
//  - THE HAUL (errandHaul): drawn on the errand's own seed when it comes back, so a reload of the save it left in
//    brings back the same haul at the same minute. Gold by the player's level, the days, the danger and its rank; units
//    of the place's goods, the cheaper more often; pieces minted as an elite's are (eliteFoes.js tieredGear), a tier each
//    (Common with Loot rarity off).
//  - BALANCED: at most ERRAND.MAX abroad at once; gold a day well under a revenant's own drop (Revenants.md section 4:
//    level x rank x 15-40 a kill), a far errand's days the price of its better goods.
//  - INVENTORY AS ITS PACK IS: an errand is the save's (revenant.js ensureMirror) - the mirror never brings back an errand
//    begun after the save, and a save made while it was abroad sends it abroad again, to return as it would have.

import { PROVINCES, CITIES } from '../../world/tamriel/tamrielGeography.js';
import { idStream, isDevoted } from './revenantFeud.js';
import { gearPower } from './revenantGear.js';
import { tieredGear } from '../eliteFoes.js';
import { lootRarityOn } from '../loot/lootRarity.js';
import { materialOf } from '../../net/professionLaw.js';
import { addGoldPieces, addItem } from '../inventory.js';
import { giveCarried } from '../materialsBag.js';
import { MINUTES_PER_DAY } from '../gameDate.js';
import { t } from '../textManager.js';   // L10N4: the page's and the card's words through the text core

/** Every number. MAX abroad at once; WON_LOYALTY for an errand won; GOLD per level a day (a range); DANGER_GOLD and
 *  RANK_HAUL the haul's rise a danger and a rank past the first; ODDS its chance (BASE + PER a point of strength over the
 *  danger, MIN..MAX, DEVOTED more); HARD_SHARE a hard-won errand's share; UNITS a day (BASE + PER_DANGER a danger); TIERS
 *  a piece's (MAGIC its chance, else Common; RARE and LEGENDARY each [base, a danger, a rank past the first]). */
export const ERRAND = Object.freeze({
  MAX: 2,
  WON_LOYALTY: 4,
  GOLD: Object.freeze([10, 18]),
  DANGER_GOLD: 0.25,
  RANK_HAUL: 0.1,
  ODDS: Object.freeze({ BASE: 0.55, PER: 0.1, MIN: 0.3, MAX: 0.95, DEVOTED: 0.05 }),
  HARD_SHARE: 0.5,
  UNITS: Object.freeze({ BASE: 3, PER_DANGER: 2 }),
  TIERS: Object.freeze({ MAGIC: 0.5, RARE: Object.freeze([0.12, 0.05, 0.03]), LEGENDARY: Object.freeze([0.02, 0.015, 0.01]) }),
});

/** The ventures: each its haul's lean - `gold` and `units` shares of the whole, `items` a piece's chance (a number) or
 *  PLUNDER's many (1 + a piece every three of the days and the danger together). */
export const VENTURES = Object.freeze({
  plunder: Object.freeze({ get label() { return t('rvn.errand.venture.plunder', 'Plunder'); }, get blurb() { return t('rvn.errand.venture.plunderBlurb', 'Loot first'); }, gold: 0.4, units: 0.35, items: 'many' }),
  forage: Object.freeze({ get label() { return t('rvn.errand.venture.forage', 'Forage'); }, get blurb() { return t('rvn.errand.venture.forageBlurb', 'Crafting materials first'); }, gold: 0.15, units: 1, items: 0.2 }),
  contract: Object.freeze({ get label() { return t('rvn.errand.venture.contract', 'Sell-sword'); }, get blurb() { return t('rvn.errand.venture.contractBlurb', 'Gold first'); }, gold: 1, units: 0, items: 0.25 }),
});
export const VENTURE_KEYS = Object.freeze(Object.keys(VENTURES));
export const isVenture = (v) => typeof v === 'string' && Object.prototype.hasOwnProperty.call(VENTURES, v);

const place = (key, days, danger, goods) => {
  const p = PROVINCES.find((x) => x.key === key);
  return Object.freeze({ key, name: p?.name ?? key, days, danger, goods: Object.freeze(goods) });
};
/** THE PLACES: Tamriel's nine provinces - how many days there and back, how dangerous, and what its land gives. */
export const ERRAND_PLACES = Object.freeze([
  place('HighRock', 1, 1, ['log:oak', 'metal:iron', 'ingot:steel', 'cloth:wool', 'hide:bear', 'gem:jade']),
  place('Hammerfell', 1, 2, ['metal:copper', 'metal:sulphur', 'gem:amber', 'hide:scorpion', 'cloth:linen', 'metal:gold']),
  place('Imperial', 2, 2, ['metal:silver', 'metal:gold', 'cloth:silk', 'log:cherry', 'gem:emerald', 'ingot:steel']),
  place('Skyrim', 2, 3, ['metal:iron', 'ore:orichalcum', 'hide:bear', 'hide:tiger', 'log:pine', 'gem:sapphire']),
  place('Valenwood', 2, 3, ['hide:spider', 'wood:heartwood', 'part:venom', 'hide:bat', 'wood:resin', 'gem:jade']),
  place('Sumurset', 3, 3, ['ore:moonstone', 'ingot:moonstone', 'gem:pearl', 'gem:malachite', 'cloth:silk', 'ingot:mithril']),
  place('Elsweyr', 3, 3, ['cloth:silk', 'gem:amber', 'hide:tiger', 'metal:gold', 'gem:turquoise', 'part:tooth']),
  place('Morrowind', 3, 4, ['ore:ebony', 'ore:dwarven', 'ingot:dwarven', 'hide:dreugh', 'gem:diamond', 'cloth:silk']),
  place('BlackMarsh', 4, 5, ['hide:slaughterfish', 'part:venom', 'part:stinger', 'wood:resin', 'log:ghostwood', 'gem:pearl']),
]);
export const errandPlace = (key) => ERRAND_PLACES.find((p) => p.key === key) ?? null;

/** Its strength abroad: its rank and its kit's weight. */
export const errandPower = (r) => Math.max(1, r?.rank | 0) + gearPower(r);
/** Its chance to come back with the whole haul from `p` (a place). */
export function errandOdds(r, p) {
  if (!p) return 0;
  const O = ERRAND.ODDS;
  const odds = O.BASE + O.PER * (errandPower(r) - p.danger) + (isDevoted(r?.companion?.loyalty) ? O.DEVOTED : 0);
  return Math.round(Math.max(O.MIN, Math.min(O.MAX, odds)) * 1000) / 1000;
}
/** The odds' kind - 'good', 'fair' or 'grim' (the page's chip). */
export const oddsKind = (odds) => (odds >= 0.75 ? 'good' : odds >= 0.5 ? 'fair' : 'grim');
/** The odds in the page's words. */
export function oddsWord(odds) {
  const k = oddsKind(odds);
  return k === 'good' ? t('rvn.errand.odds.good', 'Good odds') : k === 'fair' ? t('rvn.errand.odds.fair', 'Fair odds') : t('rvn.errand.odds.grim', 'Grim odds');
}

/** A new errand for `r` to place `key` on venture `venture`, from minute `now` - its city drawn on `seed` (a whole number
 *  the caller draws). Null for an unknown place or venture. */
export function newErrand(r, key, venture, now, seed) {
  const p = errandPlace(key);
  if (!p || !isVenture(venture) || !Number.isFinite(now)) return null;
  const s = Number.isInteger(seed) && seed >= 0 ? seed >>> 0 : 0;
  const cities = CITIES.filter((c) => c.province === key);
  const city = cities.length ? cities[Math.min(cities.length - 1, Math.floor(idStream(`${r?.id}`, `errand-city:${s}`)() * cities.length))].name : null;
  return { place: key, venture, city, at: Math.floor(now), until: Math.floor(now) + p.days * MINUTES_PER_DAY, seed: s };
}
/** An errand read back (a save, the mirror): its place and venture known, its minutes whole and in order, else none. */
export function sanitizeErrand(e) {
  if (!e || typeof e !== 'object' || !errandPlace(e.place) || !isVenture(e.venture)) return null;
  if (!Number.isInteger(e.at) || !Number.isInteger(e.until) || e.until < e.at) return null;
  return { place: e.place, venture: e.venture, city: typeof e.city === 'string' && e.city ? e.city.slice(0, 40) : null, at: e.at, until: e.until, seed: Number.isInteger(e.seed) && e.seed >= 0 ? e.seed >>> 0 : 0 };
}
/** When it is back - never more than its place's days from `now` (an older clock under the record reads its days as
 *  more, as a rest's would - revenantCompanions.js restUntil). */
export function errandUntil(e, now) {
  const p = errandPlace(e?.place);
  if (!p || !Number.isFinite(e?.until)) return now;
  return Number.isFinite(now) && e.until - now > p.days * MINUTES_PER_DAY ? now + p.days * MINUTES_PER_DAY : e.until;
}

/** A material's draw weight - the cheaper more often (one over its tier). */
const goodsWeight = (key) => 1 / Math.max(1, materialOf(key, () => 1)?.tier ?? 1);
/** A material in the haul's words - "Orichalcum Ore", "Bear Hide", "Jade". */
const NOUN = Object.freeze({ ore: 'Ore', ingot: 'Ingot', hide: 'Hide', log: 'Log', plank: 'Plank', cloth: 'Cloth', leather: 'Leather' });
export function goodsName(key) {
  const [fam, what = ''] = String(key).split(':');
  const w = what.split('-').map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(' ');
  return NOUN[fam] ? `${w} ${NOUN[fam]}` : w;
}
/** One piece's tier, on `rolls`: Legendary, Rare, Magic or Common by the place's danger and its rank. */
function pieceTier(danger, rank, rolls) {
  const T = ERRAND.TIERS, x = rolls(), up = Math.max(0, rank - 1);
  const leg = T.LEGENDARY[0] + T.LEGENDARY[1] * danger + T.LEGENDARY[2] * up;
  const rare = T.RARE[0] + T.RARE[1] * danger + T.RARE[2] * up;
  if (x < leg) return 'legendary';
  if (x < leg + rare) return 'rare';
  return x < leg + rare + T.MAGIC ? 'magic' : 'common';
}

/**
 * THE HAUL of `r`'s errand `e`, drawn on its seed: `{ won, gold, units: [[key, n], ...], items }` - won on its odds, else
 * hard-won (HARD_SHARE of each). `level` the player's (the haul's scale); `rarity` Loot rarity's switch (off: Common).
 * @param {any} r @param {any} e @param {{ level?: number, rarity?: boolean }} [o]
 */
export function errandHaul(r, e, { level = 1, rarity = lootRarityOn() } = {}) {
  const p = errandPlace(e?.place), v = VENTURES[e?.venture];
  if (!p || !v) return { won: false, gold: 0, units: [], items: [] };
  const rolls = idStream(`${r?.id}`, `errand:${e.seed >>> 0}`);
  const rank = Math.max(1, Math.min(5, r?.rank | 0)), lv = Math.max(1, level | 0);
  const won = rolls() < errandOdds(r, p);
  const share = won ? 1 : ERRAND.HARD_SHARE;
  const scale = (1 + ERRAND.DANGER_GOLD * (p.danger - 1)) * (1 + ERRAND.RANK_HAUL * (rank - 1));
  const [lo, hi] = ERRAND.GOLD;
  const gold = Math.floor(lv * p.days * (lo + rolls() * (hi - lo)) * scale * v.gold * share);
  const n = Math.floor((ERRAND.UNITS.BASE + ERRAND.UNITS.PER_DANGER * p.danger) * p.days * v.units * share);
  const weights = p.goods.map(goodsWeight), total = weights.reduce((a, b) => a + b, 0);
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (let i = 0; i < n; i++) {
    let x = rolls() * total, k = p.goods[p.goods.length - 1];
    for (let j = 0; j < p.goods.length; j++) { if ((x -= weights[j]) < 0) { k = p.goods[j]; break; } }
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const want = v.items === 'many' ? 1 + Math.floor((p.days + p.danger) / 3) : rolls() < Number(v.items) ? 1 : 0;
  const pieces = Math.round(want * share);   // hard-won: half, a lone piece kept (a half rounds up)
  const items = [];
  for (let i = 0; i < pieces; i++) {
    const tier = rarity ? pieceTier(p.danger, rank, rolls) : 'common';
    const it = tieredGear(lv, tier, rolls);
    if (it) items.push(it);
  }
  return { won, gold, units: [...counts.entries()], items };
}

/** Its haul into the player's hands: gold to the purse, pieces to the pack, materials to the Materials Bag (then the
 *  pack - any overflow forced in, as a writ's are: nothing brought back is left on the road). Answers the haul. */
export function deliverHaul(player, haul) {
  if (!player || !haul) return haul;
  if (haul.gold > 0) addGoldPieces(player, haul.gold);
  player.items ??= [];
  for (const it of haul.items ?? []) addItem(player.items, it);
  for (const [key, n] of haul.units ?? []) { try { giveCarried(player, key, n); } catch { /* a unit with no pack form is nobody's loss to report */ } }
  return haul;
}

/** The haul in words - "412 gold, 6 Orichalcum Ore, 2 Bear Hide and 2 pieces of gear" - or "nothing". */
export function errandHaulWords(haul) {
  const parts = [];
  if (haul?.gold > 0) parts.push(t('rvn.errand.haul.gold', '{n} gold', { n: haul.gold }));
  for (const [key, n] of haul?.units ?? []) parts.push(t('rvn.errand.haul.goods', '{n} {what}', { n, what: goodsName(key) }));
  const k = haul?.items?.length ?? 0;
  if (k) parts.push(t('rvn.errand.haul.pieces', '{k, plural, one {a piece of gear} other {# pieces of gear}}', { k }));
  if (!parts.length) return t('rvn.errand.haul.nothing', 'nothing');
  return parts.length === 1 ? parts[0] : t('rvn.errand.haul.list', '{most} and {last}', { most: parts.slice(0, -1).join(', '), last: parts[parts.length - 1] });
}
/** How long yet, in the page's words. */
export function errandLeftWords(until, now) {
  const h = Math.ceil(Math.max(0, until - now) / 60);
  if (h <= 1) return t('rvn.errand.left.hour', 'back within the hour');
  if (h < 48) return t('rvn.errand.left.hours', 'back in about {h} hours', { h });
  return t('rvn.errand.left.days', 'back in about {d} days', { d: Math.round(h / 24) });
}
/** Where it is, in the page's words - "In Solitude, Skyrim (Plunder) - back in about 9 hours". */
export function errandWords(e, now) {
  const p = errandPlace(e?.place);
  if (!p) return t('rvn.errand.abroad', 'Abroad');
  const where = e.city ? t('rvn.errand.cityOf', '{city}, {province}', { city: e.city, province: p.name }) : p.name;
  return t('rvn.errand.where', 'In {where} ({venture}) - {left}', { where, venture: VENTURES[e.venture]?.label ?? e.venture, left: errandLeftWords(errandUntil(e, now), now) });
}
