// @ts-check
// RVN-STARS (2026-10-17, the owner: "develop a firmament style tree for revenants. Just like we did for ships and
// characters"; bible/06-Systems/Revenants.md section 44) - A SWORN REVENANT'S STARS. The port's own; pure.
//
// EACH SWORN ONE GROWS ITS OWN SKY. Its level is earned at the player's side and kept on its oath (`companion.xp` - a
// fight won beside the player, by the foe's level; an errand come home, by its days and its danger), up a curve to
// RVN_LEVEL_MAX (`rvnLevelOf`). A POINT A LEVEL past the first, and one for each rank past the first it was sworn at (a
// revenant that killed the player four times comes to the oath with four), buys a star on its sky - the Firmament's shape
// (bible/06-Systems/Firmament.md) as CAPTAIN-TREE made it a sky of its own (systems/naval/captainTree.js): a start in the
// middle, paths of small stars to notables and keystones, a star bought only beside one held.
//
// THE OATH in the middle (held by every sworn one), and three aspects about it:
//   THE BLADE (above) - its body: its health and its blows;
//   THE GRAVE (right) - its art: its weight and how soon it comes again, and AWAKENED ART, which teaches an art of its
//     kind to one born without (systems/revenant/revenantArts.js artOf);
//   THE ROAD (left) - its errands and its oath: the odds and the haul abroad, the road's days, the loyalty it loses, the
//     rest it needs.
// Each path runs small stars to a notable and on to a KEYSTONE that gives much and costs a little; the six notables are
// joined in a ring (Awakened Art the Grave's own link between its two).
//
// A STAR TAKEN BACK takes with it every star joined to the Oath only through it - free, at any time but abroad (its sky is
// set at the player's side): CAPTAIN-TREE's law, a revenant's sky relearned on the road, not bought back.
//
// WHAT THE STARS DO is one sum of stats (`rvnStarStats`, each a share, each kept under its RVN_STAR_MOST), read where the
// revenant's own numbers are read - never written into its record: its health and blows where its body stands
// (revenantCompanions.js applySwornStrength), its art's weight and its cooldowns (revenantArts.js swornArtStep,
// swornMendStep), its odds, its haul and its road (revenantErrands.js), its loyalty's losses and its rests
// (revenantCompanions.js, revenant.js's day). A hostile revenant has no oath, so none.

/** What a level is earned by: WON a fight won at the player's side, and WON_PER more a level of the foe it fought (to
 *  WON_LEVEL_MOST); ERRAND an errand come home, a day abroad a danger (HARD_SHARE of it for a hard road - the errand's own
 *  law, revenantErrands.js ERRAND.HARD_SHARE). */
export const RVN_XP = Object.freeze({ WON: 5, WON_PER: 1, WON_LEVEL_MOST: 30, ERRAND: 15, HARD_SHARE: 0.5 });
export const RVN_LEVEL_MAX = 20;

const n0 = (v) => (Number.isFinite(v) && v > 0 ? v : 0);
/** The XP a fight won is worth, by the level of the foe fought. */
export const rvnXpWon = (foeLevel) => RVN_XP.WON + RVN_XP.WON_PER * Math.min(RVN_XP.WON_LEVEL_MOST, Math.max(1, Math.floor(n0(foeLevel)) || 1));
/** The XP an errand home is worth: its place's days times its danger (revenantErrands.js ERRAND_PLACES), half a hard road's. */
export const rvnXpErrand = (place, won) => Math.floor(RVN_XP.ERRAND * n0(place?.days) * n0(place?.danger) * (won ? 1 : RVN_XP.HARD_SHARE));
/** The XP level `L` begins at - 50 x (L - 1)^1.7: level 2 at 50, 5 at 528, 10 at 2,095, 15 at 4,440, 20 at 7,462. */
export const rvnXpForLevel = (L) => (L <= 1 ? 0 : Math.round(50 * (L - 1) ** 1.7));
/** A sworn one's level for its XP, 1 to RVN_LEVEL_MAX. */
export function rvnLevelOf(xp) {
  let L = 1;
  while (L < RVN_LEVEL_MAX && n0(xp) >= rvnXpForLevel(L + 1)) L++;
  return L;
}
/** The points a level and a rank give: one a level past the first, one a rank past the first (rank 1 to 5). */
export const rvnStarPoints = (level, rank) => Math.max(0, Math.min(RVN_LEVEL_MAX, level | 0) - 1) + Math.max(0, Math.min(5, rank | 0) - 1);
/** A sworn one's whole reading: `{ xp, level, points, next, set }` - `next` the XP its next level begins at (null at the
 *  top), `set` the stars it holds past the Oath. A record with no oath is level 1 with its rank's points. */
export function rvnStarsOf(r) {
  const xp = Math.floor(n0(r?.companion?.xp)), level = rvnLevelOf(xp);
  const held = Array.isArray(r?.companion?.stars) ? r.companion.stars : ['oath'];
  return { xp, level, points: rvnStarPoints(level, r?.rank ?? 1), next: level < RVN_LEVEL_MAX ? rvnXpForLevel(level + 1) : null, set: Math.max(0, held.length - 1) };
}

/**
 * THE STATS a star can carry: `health` a share of its health, `blows` of its blows' harm; `art` its art's weight (a
 * heal's share, a ward's or a cry's points, a strike's harm), `haste` a share off its art's cooldowns, `awaken` an art
 * taught to one born without; `odds` its strength abroad (revenantErrands.js errandPower - ERRAND.ODDS.PER a point), `haul`
 * a share more of an errand's gold and goods (never its pieces), `road` a share off an errand's days, `loyal` a share off
 * every loyalty it loses, `rest` a share off every rest it needs.
 */
export const RVN_STAR_STATS = Object.freeze(['health', 'blows', 'art', 'haste', 'awaken', 'odds', 'haul', 'road', 'loyal', 'rest']);
/** The most a whole sky gives of each - a keystone's price may take it under 0, never a sum past these. */
export const RVN_STAR_MOST = Object.freeze({ art: 0.4, haste: 0.25, awaken: 1, odds: 0.5, haul: 0.35, road: 0.25, loyal: 0.5, rest: 0.5 });

/** Where a path's stars stand: each star's distance out (CAPTAIN-TREE's rings). */
const RING = Object.freeze([150, 270, 390, 510, 640]);
const at = (deg, r) => { const a = (deg * Math.PI) / 180; return [Math.round(Math.sin(a) * r), Math.round(-Math.cos(a) * r)]; };
/** A path's stars: `[id, kind, stats]` from the Oath out along bearing `deg`, each joined to the one before. */
function path(sec, deg, stars) {
  return stars.map(([id, kind, stats], i) => ({ id, sec, kind, stats: Object.freeze(stats), pos: at(deg, RING[i]), links: [i === 0 ? 'oath' : stars[i - 1][0]] }));
}
/**
 * THE SKY: THE OATH, and six paths - THE BLADE's two above (its flesh, its fury), THE GRAVE's two to the right (its art's
 * power, its rite's haste) with AWAKENED ART between their notables, THE ROAD's two to the left (the road abroad, the
 * oath kept). Each star `{ id, sec, kind, stats, pos: [x, y], links }`.
 */
export const RVN_STARS = Object.freeze([
  { id: 'oath', sec: 'oath', kind: 'start', stats: Object.freeze({}), pos: [0, 0], links: [] },
  // THE BLADE
  ...path('blade', 330, [['b_hp1', 'small', { health: 0.05 }], ['b_hp2', 'small', { health: 0.05 }], ['b_iron', 'notable', { health: 0.1 }], ['b_hp3', 'small', { health: 0.05 }], ['b_deathless', 'keystone', { health: 0.25, blows: -0.1 }]]),
  ...path('blade', 30, [['b_bl1', 'small', { blows: 0.04 }], ['b_bl2', 'small', { blows: 0.04 }], ['b_relent', 'notable', { blows: 0.08 }], ['b_bl3', 'small', { blows: 0.04 }], ['b_rage', 'keystone', { blows: 0.2, health: -0.1 }]]),
  // THE GRAVE
  ...path('grave', 90, [['g_pow1', 'small', { art: 0.05 }], ['g_pow2', 'small', { art: 0.05 }], ['g_focus', 'notable', { art: 0.1 }], ['g_pow3', 'small', { art: 0.05 }], ['g_pact', 'keystone', { art: 0.15, health: -0.1 }]]),
  ...path('grave', 150, [['g_hst1', 'small', { haste: 0.05 }], ['g_hst2', 'small', { haste: 0.05 }], ['g_rite', 'notable', { haste: 0.1 }], ['g_hst3', 'small', { haste: 0.05 }]]),
  { id: 'g_wake', sec: 'grave', kind: 'notable', stats: Object.freeze({ awaken: 1 }), pos: at(120, 470), links: ['g_focus', 'g_rite'] },
  // THE ROAD
  ...path('road', 210, [['r_odd1', 'small', { odds: 0.3 }], ['r_haul1', 'small', { haul: 0.05 }], ['r_far', 'notable', { road: 0.15, odds: 0.2 }], ['r_haul2', 'small', { haul: 0.05 }], ['r_fortune', 'keystone', { haul: 0.25, road: 0.1, odds: -0.5 }]]),
  ...path('road', 270, [['r_loy1', 'small', { loyal: 0.1 }], ['r_rest1', 'small', { rest: 0.1 }], ['r_bound', 'notable', { loyal: 0.2 }], ['r_rest2', 'small', { rest: 0.1 }], ['r_vigil', 'keystone', { rest: 0.3, loyal: 0.2, road: -0.1 }]]),
].map((s) => Object.freeze({ ...s, pos: Object.freeze(s.pos), links: Object.freeze(s.links) })));
/** The notables' ring: each aspect's two joined, and each aspect to the next (the Grave's through Awakened Art). */
export const RVN_STAR_CROSS = Object.freeze([['b_iron', 'b_relent'], ['b_relent', 'g_focus'], ['g_rite', 'r_far'], ['r_far', 'r_bound'], ['r_bound', 'b_iron']]);
const BY_ID = new Map(RVN_STARS.map((s) => [s.id, s]));
/** A star by its id, or null. */
export const rvnStarOf = (id) => BY_ID.get(id) ?? null;
/** Every line of the sky, `[a, b]` once each. */
export const RVN_STAR_EDGES = Object.freeze([...RVN_STARS.flatMap((s) => s.links.map((l) => Object.freeze([l, s.id]))), ...RVN_STAR_CROSS.map((e) => Object.freeze([...e]))]);
const NEIGHBOURS = new Map(RVN_STARS.map((s) => [s.id, new Set()]));
for (const [a, b] of RVN_STAR_EDGES) { NEIGHBOURS.get(a).add(b); NEIGHBOURS.get(b).add(a); }
/** The stars beside `id`. */
export const rvnNeighboursOf = (id) => [...(NEIGHBOURS.get(id) ?? [])];

/** A held sky through its door: the Oath, and only known stars, once each, each joined to the Oath through held stars -
 *  no more than `points` past the Oath, the earliest asked first, in an order it could have set them in (CAPTAIN-TREE's
 *  heldStars). Pure. */
export function rvnHeldStars(ids, points = Infinity) {
  const want = [];
  for (const id of Array.isArray(ids) ? ids : []) if (typeof id === 'string' && id !== 'oath' && BY_ID.has(id) && !want.includes(id)) want.push(id);
  const out = ['oath'];
  const seen = new Set(out);
  for (let grew = true; grew && out.length - 1 < points;) {
    grew = false;
    for (const id of want) {
      if (out.length - 1 >= points) break;
      if (seen.has(id) || !rvnNeighboursOf(id).some((n) => seen.has(n))) continue;
      seen.add(id); out.push(id); grew = true;
    }
  }
  return out;
}
/** The stars a star given back takes with it: itself first, then every held star joined to the Oath only through it - []
 *  for the Oath, or a star not held. Pure. */
export function rvnTakesBack(held, id) {
  const h = new Set(rvnHeldStars(held));
  if (id === 'oath' || !h.has(id)) return [];
  h.delete(id);
  const reach = new Set(['oath']);
  const stack = ['oath'];
  while (stack.length) for (const n of rvnNeighboursOf(stack.pop())) if (h.has(n) && !reach.has(n)) { reach.add(n); stack.push(n); }
  return [id, ...[...h].filter((x) => !reach.has(x))];
}
/** The shortest way from the held sky to `id` (the stars to take, nearest first) - [] when held, null where none. */
export function rvnWayTo(held, id) {
  const h = new Set(rvnHeldStars(held));
  if (!BY_ID.has(id)) return null;
  if (h.has(id)) return [];
  const from = new Map();
  const queue = [...h];
  for (const q of queue) from.set(q, null);
  while (queue.length) {
    const cur = queue.shift();
    for (const n of rvnNeighboursOf(cur)) {
      if (from.has(n)) continue;
      from.set(n, cur);
      if (n === id) { const way = []; for (let x = n; x && !h.has(x); x = from.get(x)) way.unshift(x); return way; }
      queue.push(n);
    }
  }
  return null;
}
/** THE STATS of a held sky - each of RVN_STAR_STATS summed over its stars, kept under its RVN_STAR_MOST (0 where none). */
export function rvnStarStats(held) {
  const out = Object.fromEntries(RVN_STAR_STATS.map((k) => [k, 0]));
  for (const id of rvnHeldStars(held)) for (const [k, v] of Object.entries(rvnStarOf(id).stats)) out[k] = Math.round((out[k] + v) * 10000) / 10000;
  for (const [k, most] of Object.entries(RVN_STAR_MOST)) out[k] = Math.min(most, out[k]);
  return Object.freeze(out);
}
const NONE = rvnStarStats(['oath']);
/** What a record's stars do - its oath's sky (none for a record not sworn). */
export const rvnStatsOf = (r) => (r?.sworn && Array.isArray(r.companion?.stars) ? rvnStarStats(r.companion.stars) : NONE);
/** A stat's multiple of the revenant's own number (1 + its share, never under 0.1) - what the seams multiply by. */
export const rvnStatScale = (stats, key) => Math.max(0.1, 1 + (Number(stats?.[key]) || 0));
/** Whether a record's sky holds Awakened Art (its stored sky went through the door - the Oath joined). */
export const rvnAwakened = (r) => !!r?.sworn && Array.isArray(r.companion?.stars) && r.companion.stars.includes('g_wake');
/** A loyalty move `d` as its oath bears it: a loss less by its `loyal` share, a gain whole. */
export const rvnLoyaltyMove = (r, d) => (d < 0 ? d * (1 - rvnStatsOf(r).loyal) : d);
/** A rest of `minutes` as its sky shortens it (`rest`), whole minutes. */
export const rvnRestMinutes = (r, minutes) => Math.round(minutes * (1 - rvnStatsOf(r).rest));
