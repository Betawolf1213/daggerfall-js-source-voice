// RVN-STARS (bible/06-Systems/Revenants.md section 44; the owner, 2026-10-17: "develop a firnanament style tree for
// revnants. Just like we did for ships and characters"). Each sworn revenant grows a sky of its own: a level earned at my
// side (a fight won, by the foe's level; an errand home, by its days and danger - once an errand), a point a level and a
// rank past the first, and thirty stars about the Oath in three aspects - the Blade (its health, its blows), the Grave
// (its art's weight and haste, and Awakened Art), the Road (its odds, haul and road abroad, its loyalty's losses, its
// rests). Read where its numbers are read; set from the Companions page in the one sky window (ui/skyWindow.js - the
// captain's stars drawn in it too), never abroad.
// Pinned: the level law; the sky's shape and its sums; the door, the cascade, the way; the record and the save; the XP
// earned and said; each seam; the act and its refusal; the window; the page; the doors.
import '../../modsOff.js';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const _store = new Map();
globalThis.localStorage = {
  getItem: (k) => (_store.has(k) ? _store.get(k) : null), setItem: (k, v) => { _store.set(k, String(v)); },
  removeItem: (k) => { _store.delete(k); }, clear: () => _store.clear(), key: (i) => [..._store.keys()][i] ?? null, get length() { return _store.size; },
};

const N = await import('../../../src/systems/revenant/revenant.js');
const ST = await import('../../../src/systems/revenant/revenantStars.js');
const E = await import('../../../src/systems/revenant/revenantErrands.js');
const A = await import('../../../src/systems/revenant/revenantArts.js');
const RC = await import('../../../src/systems/revenant/revenantCompanions.js');
const S = await import('../../../src/systems/companionSlots.js');
const { setPref, _resetForTests } = await import('../../../src/systems/uiPrefs.js');
const WT = await import('../../../src/systems/worldTick.js');
const { MOBILE_TYPES: M } = await import('../../../src/characters/mobile/mobileTypes.js');
const { modSaveRecords, restoreModSaveRecords } = await import('../../../src/systems/modSaveData.js');
const { registerPresenter, _resetNotifyForTests } = await import('../../../src/systems/notify.js');
const { signatureFamily } = await import('../../../src/systems/revenant/revenantFeud.js');
const { mountRevenantStarsWindow, rvnStarName, rvnStarKindWords, rvnStarStatWords, rvnSkySummary, rvnStarRefusal, rvnArtNote } = await import('../../../src/ui/revenantStarsWindow.js');
const { drawCompanionsPage, _resetCompanionRosterForTests, _setCompanionRosterIconForTests } = await import('../../../src/ui/companionRoster.js');

const read = (p) => readFileSync(new URL(`../../../${p}`, import.meta.url), 'utf8');
const DAY = 1440, T0 = DAY * 10;
let me, heard;
beforeEach(() => {
  _resetForTests(); setPref('lootRarity', true); WT.setSharedClock(null);
  N._resetRevenantForTests(); RC._resetRetinueForTests(); S._resetCompanionSlotsForTests(); A._resetArtsForTests(); _store.clear();
  S.registerCompanionCount('revenant', () => RC.revenantsWithYou().length);
  me = { isPlayer: true, name: 'Ayla Stormwind', characterId: 'char-rvnstars', level: 12, health: 100, maxHealth: 100, items: [], goldPieces: 0 };
  RC.setRetinuePlayer(me);
  WT.setWorldMinutes(T0);
  N.setRevenantPresenter(() => true);
  _resetNotifyForTests();
  heard = [];
  registerPresenter({ hudText: (t) => { heard.push(t); return true; } });
});
function sworn({ mobileType = M.Orc, rank = 1, state = 'with', loyalty = 60, xp = 0 } = {}) {
  const r = N.revenantDeed(me, { mobileType, level: 6, champion: 'mighty', health: 5, maxHealth: 50, team: 'Monster' }, 'fled', { mobileType, rolls: () => 0 });
  r.rank = rank;
  const s = N.revenantSpared(me, { revenant: { id: r.id } }, { state });
  N.revenantCompanionUpdate(me, s.id, (c) => { c.loyalty = loyalty; c.xp = xp; });
  return N.revenantById(s.id);
}
const rec = (r) => N.revenantById(r.id);
/** A record read back as a save holds it (`companion` its oath's, `art` the art its id draws or null). */
function saved({ rank = 1, xp = 0, stars = ['oath'], art = undefined, mobileType = M.Orc, sworn: isSworn = true } = {}) {
  let id = null;
  for (let i = 0; i < 20000 && !id; i++) { const c = `rvstar-${rank}-${xp}-${i}`; if (art === undefined || A.drawArt(c, mobileType) === art) id = c; }
  const r = { id, rev: 1, mobileType, gender: 'male', given: 'Grushnak', epithet: 'the Butcher', name: 'Grushnak the Butcher', rank, born: 0, dueAt: 0,
    ...(isSworn ? { sworn: true, fate: 'sworn', companion: { state: 'with', xp, stars } } : {}) };
  restoreModSaveRecords({ [N.REVENANT_SAVE]: { v: 1, list: [r], lastDay: null } });
  return N.revenantById(id);
}

// ── the law ─────────────────────────────────────────────────────────

test('RVN-STARS THE LEVEL: earned by a fight won (5 and a foe\'s level, to 30) and an errand home (15 a day a danger, half a hard road\'s - the errand\'s own share), up 50 x (L - 1)^1.7 to level 20; a point a level and a rank past the first (mutants: a weight moved; the curve; the rank\'s points; the cap)', () => {
  assert.deepEqual({ ...ST.RVN_XP }, { WON: 5, WON_PER: 1, WON_LEVEL_MOST: 30, ERRAND: 15, HARD_SHARE: 0.5 });
  assert.equal(ST.RVN_XP.HARD_SHARE, E.ERRAND.HARD_SHARE, 'a hard road\'s share, the errand\'s');
  assert.equal(ST.RVN_LEVEL_MAX, 20);
  assert.deepEqual([1, 2, 5, 10, 15, 20].map(ST.rvnXpForLevel), [0, 50, 528, 2095, 4440, 7462]);
  assert.deepEqual([0, 49, 50, 527, 528, 7461, 7462, 1e9, NaN, -5].map(ST.rvnLevelOf), [1, 1, 2, 4, 5, 19, 20, 20, 1, 1]);
  assert.deepEqual([[1, 1], [5, 1], [5, 3], [20, 5], [99, 9], [0, 0]].map(([l, r]) => ST.rvnStarPoints(l, r)), [0, 4, 6, 23, 23, 0]);
  assert.deepEqual([0, 1, 12, 30, 99, NaN].map(ST.rvnXpWon), [6, 6, 17, 35, 35, 6]);
  assert.deepEqual([ST.rvnXpErrand({ days: 4, danger: 5 }, true), ST.rvnXpErrand({ days: 4, danger: 5 }, false), ST.rvnXpErrand({ days: 1, danger: 1 }, false), ST.rvnXpErrand(null, true)], [300, 150, 7, 0]);
  assert.deepEqual(ST.rvnStarsOf(null), { xp: 0, level: 1, points: 0, next: 50, set: 0 });
  assert.deepEqual(ST.rvnStarsOf({ rank: 3, companion: { xp: 600, stars: ['oath', 'b_hp1'] } }), { xp: 600, level: 5, points: 6, next: ST.rvnXpForLevel(6), set: 1 });
  assert.equal(ST.rvnStarsOf({ rank: 1, companion: { xp: 99999 } }).next, null, 'at the top');
});

test('RVN-STARS THE SKY: the Oath in the middle, ten stars an aspect - the Blade above, the Grave right, the Road left - each joined to the Oath; five keystones, each a gain and a price; the notables a ring, Awakened Art the Grave\'s link; more stars than the most points; every stat one the seams read; the whole sky\'s sums, each at most its RVN_STAR_MOST; no line through a star (mutants: a link, a stat, a sum)', () => {
  assert.equal(ST.RVN_STARS.length, 31);
  assert.deepEqual(ST.rvnStarOf('oath'), { id: 'oath', sec: 'oath', kind: 'start', stats: {}, pos: [0, 0], links: [] });
  const by = (sec) => ST.RVN_STARS.filter((s) => s.sec === sec).length;
  assert.deepEqual([by('blade'), by('grave'), by('road')], [10, 10, 10]);
  const ids = ST.RVN_STARS.map((s) => s.id);
  assert.equal(ST.rvnHeldStars(ids).length, 31, 'every star joined to the Oath');
  const keys = ST.RVN_STARS.filter((s) => s.kind === 'keystone');
  assert.deepEqual(keys.map((s) => s.id), ['b_deathless', 'b_rage', 'g_pact', 'r_fortune', 'r_vigil']);
  for (const k of keys) assert.ok(Object.values(k.stats).some((v) => v > 0) && Object.values(k.stats).some((v) => v < 0), `${k.id}: a gain and a price`);
  assert.deepEqual(ST.RVN_STAR_CROSS, [['b_iron', 'b_relent'], ['b_relent', 'g_focus'], ['g_rite', 'r_far'], ['r_far', 'r_bound'], ['r_bound', 'b_iron']]);
  assert.deepEqual(ST.rvnStarOf('g_wake').links, ['g_focus', 'g_rite']);
  assert.deepEqual(ST.rvnNeighboursOf('oath').sort(), ['b_bl1', 'b_hp1', 'g_hst1', 'g_pow1', 'r_loy1', 'r_odd1']);
  assert.ok(ids.length - 1 > ST.rvnStarPoints(ST.RVN_LEVEL_MAX, 5), 'a revenant at the top still chooses');
  for (const s of ST.RVN_STARS) for (const k of Object.keys(s.stats)) assert.ok(ST.RVN_STAR_STATS.includes(k), `${s.id}.${k}`);
  const all = ST.rvnStarStats(ids);
  assert.deepEqual({ ...all }, { health: 0.3, blows: 0.3, art: 0.4, haste: 0.25, awaken: 1, odds: 0, haul: 0.35, road: 0.15, loyal: 0.5, rest: 0.5 });
  for (const [k, most] of Object.entries(ST.RVN_STAR_MOST)) assert.ok(all[k] <= most, k);
  assert.deepEqual(['art', 'haste', 'haul', 'loyal', 'rest'].map((k) => all[k] === ST.RVN_STAR_MOST[k]), [true, true, true, true, true], 'the most a sky gives, each');
  assert.equal(ST.rvnStarStats(ids.filter((id) => id !== 'r_vigil')).road, ST.RVN_STAR_MOST.road, 'the road\'s most, the Vigil left');
  assert.deepEqual({ ...ST.rvnStarStats(['oath']) }, Object.fromEntries(ST.RVN_STAR_STATS.map((k) => [k, 0])));
  // the clean sky (the Firmament's law): no line runs through a star it does not end at
  const R = { small: 9, notable: 16, keystone: 25, start: 30 };
  for (const [a, b] of ST.RVN_STAR_EDGES) {
    const p = ST.rvnStarOf(a).pos, q = ST.rvnStarOf(b).pos, dx = q[0] - p[0], dy = q[1] - p[1];
    for (const s of ST.RVN_STARS) {
      if (s.id === a || s.id === b) continue;
      const u = Math.max(0, Math.min(1, ((s.pos[0] - p[0]) * dx + (s.pos[1] - p[1]) * dy) / (dx * dx + dy * dy)));
      assert.ok(Math.hypot(p[0] + u * dx - s.pos[0], p[1] + u * dy - s.pos[1]) > R[s.kind] + 6, `${a}-${b} through ${s.id}`);
    }
  }
});

test('RVN-STARS HOLDING: through the door only known stars joined to the Oath, once, no more than the points, in an order it could have set them; a star given back takes those joined only through it - the ring keeps the rest; the way to a star its shortest - Awakened Art four from the Oath (mutants: the join, the cap, the cascade, the way)', () => {
  assert.deepEqual(ST.rvnHeldStars(['b_hp2', 'b_hp1', 'g_wake', 'zz', 'b_hp1', 'oath']), ['oath', 'b_hp1', 'b_hp2']);
  assert.deepEqual(ST.rvnHeldStars(['b_hp2', 'b_hp1'], 1), ['oath', 'b_hp1']);
  assert.deepEqual(ST.rvnHeldStars(['b_hp1', 'b_hp2', 'b_iron'], 2), ['oath', 'b_hp1', 'b_hp2'], 'never past its points, even in one pass');
  assert.deepEqual(ST.rvnHeldStars('b_hp1'), ['oath']);
  assert.deepEqual(ST.rvnTakesBack(['oath', 'b_hp1', 'b_hp2', 'b_iron', 'b_relent', 'b_bl2'], 'b_hp1'), ['b_hp1', 'b_hp2', 'b_iron', 'b_relent', 'b_bl2']);
  assert.deepEqual(ST.rvnTakesBack(['oath', 'b_hp1', 'b_hp2', 'b_iron', 'b_bl1', 'b_bl2', 'b_relent'], 'b_hp1'), ['b_hp1'], 'the ring keeps them: Iron Sinew through Relentless');
  assert.deepEqual(ST.rvnTakesBack(['oath', 'b_hp1'], 'oath'), []);
  assert.deepEqual(ST.rvnTakesBack(['oath', 'b_hp1'], 'g_pow1'), []);
  assert.deepEqual(ST.rvnWayTo(['oath'], 'g_wake'), ['g_pow1', 'g_pow2', 'g_focus', 'g_wake']);
  assert.deepEqual(ST.rvnWayTo(['oath', 'g_hst1', 'g_hst2', 'g_rite'], 'g_wake'), ['g_wake']);
  assert.deepEqual(ST.rvnWayTo(['oath', 'b_hp1'], 'b_hp1'), []);
  assert.equal(ST.rvnWayTo(['oath'], 'zz'), null);
});

// ── the record ──────────────────────────────────────────────────────

test('RVN-STARS THE RECORD: its XP and its sky ride its oath - read back through the law (a sky past its points cut, unknown stars dropped, an older record the Oath alone), a rank III oath starts with two points to set, the save round-trips it; a record not sworn reads no stars (mutants: the sky unsanitized; the rank\'s points unread; the save drops it)', () => {
  const r = saved({ rank: 1, xp: 600, stars: ['oath', 'b_hp1', 'b_hp2', 'b_iron', 'b_hp3', 'b_deathless', 'zz'] });
  assert.deepEqual(rec(r).companion.stars, ['oath', 'b_hp1', 'b_hp2', 'b_iron', 'b_hp3'], 'level 5: four points');
  assert.equal(rec(r).companion.xp, 600);
  const odd = saved({ rank: 2, xp: -3 });
  assert.deepEqual([rec(odd).companion.xp, rec(odd).companion.stars], [0, ['oath']]);
  assert.equal(saved({ xp: 12.7 }).companion.xp, 12);
  const old = saved({ stars: undefined });
  assert.deepEqual(old.companion.stars, ['oath']);
  N._resetRevenantForTests();
  const s = sworn({ rank: 3 });
  assert.deepEqual([s.companion.stars, ST.rvnStarsOf(s).points], [['oath'], 2], 'a rank III oath: two points at level 1');
  assert.deepEqual(RC.setSwornStars(s.id, ['b_hp1', 'b_hp2']), ['oath', 'b_hp1', 'b_hp2']);
  const data = JSON.parse(JSON.stringify(modSaveRecords()));
  N._resetRevenantForTests();
  restoreModSaveRecords(data);
  assert.deepEqual(rec(s).companion.stars, ['oath', 'b_hp1', 'b_hp2'], 'the save keeps it');
  assert.deepEqual({ ...ST.rvnStatsOf({ id: 'x', sworn: false, companion: { stars: ['oath', 'b_hp1'] } }) }, { ...ST.rvnStarStats(['oath']) }, 'no oath, no sky');
});

test('RVN-STARS XP EARNED: a fight won at my side (swornFightStep\'s win) is 5 and its foe\'s level, with its loyalty; an errand home its days and danger, once an errand (a save made abroad reloaded pays it no more); a level reached is said (mutants: the foe unweighed; the XP unpaid; paid twice; the word unsaid)', () => {
  const r = sworn({ rank: 1 });
  const foe = { entity: { health: 10, level: 12 }, dead: false };
  const body = { revenantCompanion: r.id, ai: { target: foe } };
  RC.swornFightStep(body);
  foe.entity.health = 0;
  assert.equal(RC.swornFightStep(body), true);
  RC.swornFightWon(r.id);
  assert.deepEqual([rec(r).companion.xp, rec(r).companion.loyalty], [17, 63]);
  RC.swornFightWon(r.id);
  assert.equal(rec(r).companion.xp, 23, 'a win no step weighed: a level-1 foe\'s');
  N.revenantCompanionUpdate(me, r.id, (c) => { c.xp = 45; });
  heard.length = 0;
  RC.swornFightWon(r.id);
  assert.deepEqual(heard, [`${r.given} reaches level 2 - a star to set on the Companions page.`]);
  RC.swornFightWon(r.id);
  assert.equal(heard.length, 1, 'said once a level');
  // an errand home
  const w = sworn({ rank: 2, state: 'away' });
  let seed = 0;
  for (; seed < 500; seed++) if (E.errandHaul(rec(w), E.newErrand(rec(w), 'Skyrim', 'plunder', T0, seed), { level: 12 }).won) break;
  RC.sendOnErrand(w.id, 'Skyrim', 'plunder', { now: T0, seed });
  const save = JSON.parse(JSON.stringify(modSaveRecords()));
  RC.revenantParty().wake(T0 + 2 * DAY);
  assert.equal(rec(w).companion.xp, ST.rvnXpErrand(E.errandPlace('Skyrim'), true), 'two days at danger III: 90');
  restoreModSaveRecords(save);
  RC.revenantParty().wake(T0 + 2 * DAY);
  assert.equal(rec(w).companion.xp, 90, 'the haul again, the XP once');
});

// ── the seams ───────────────────────────────────────────────────────

test('RVN-STARS THE BLADE AND THE ROAD\'S OATH: its health and blows over its rank\'s where its body stands; a loss of loyalty less by its `loyal` - a fall, a day away, a second sending in a day, its kin executed in its sight - and its rest shorter by its `rest` - a fall, a hard road, a recall (mutants: the health unread; the blows unread; each loss whole; each rest whole)', () => {
  const r = sworn({ rank: 2, xp: 200 });   // level 3: two points and one for its rank
  RC.setSwornStars(r.id, ['b_hp1', 'b_hp2', 'b_bl1']);
  const e = { maxHealth: 100, health: 100 };
  RC.applySwornStrength(e, rec(r));
  assert.deepEqual([e.maxHealth, e.healthMult, e.damageScale], [165, 1.5 * 1.1, 1.2 * 1.04]);
  const plain = sworn({ rank: 2 });
  const f = { maxHealth: 100, health: 100 };
  RC.applySwornStrength(f, rec(plain));
  assert.deepEqual([f.maxHealth, f.damageScale], [150, 1.2], 'no stars: its rank\'s alone');
  // its oath: a fall's loss and its rest
  const o = sworn({ rank: 3, loyalty: 60 });
  RC.setSwornStars(o.id, ['r_loy1', 'r_rest1']);
  RC.revenantParty().knock('rv', o.id, T0);
  assert.deepEqual([rec(o).companion.loyalty, rec(o).companion.until], [53, T0 + 432], '-8 x 0.9, eight hours x 0.9');
  const p = sworn({ rank: 3, loyalty: 60 });
  RC.revenantParty().knock('rv', p.id, T0);
  assert.deepEqual([rec(p).companion.loyalty, rec(p).companion.until], [52, T0 + 480]);
  assert.equal(ST.rvnLoyaltyMove(rec(o), 3), 3, 'a gain whole');
  // a recall's rest
  const q = sworn({ rank: 3, state: 'away' });
  RC.setSwornStars(q.id, ['r_loy1', 'r_rest1']);
  RC.sendOnErrand(q.id, 'HighRock', 'forage', { now: T0, seed: 1 });
  RC.recallFromErrand(q.id, T0 + 60);
  assert.equal(rec(q).companion.until, T0 + 60 + 432);
  // a hard road's rest
  const h = sworn({ rank: 3, state: 'away' });
  RC.setSwornStars(h.id, ['r_loy1', 'r_rest1']);
  let seed = 0;
  for (; seed < 500; seed++) if (!E.errandHaul(rec(h), E.newErrand(rec(h), 'BlackMarsh', 'forage', T0, seed), { level: 12 }).won) break;
  RC.sendOnErrand(h.id, 'BlackMarsh', 'forage', { now: T0, seed });
  RC.revenantParty().wake(T0 + 4 * DAY);
  assert.deepEqual([rec(h).companion.state, rec(h).companion.until], ['resting', T0 + 4 * DAY + 432], 'hard-won: its rest x 0.9');
  // a second sending in a day, its kin executed in its sight
  const t2 = sworn({ rank: 3, loyalty: 60 });
  RC.setSwornStars(t2.id, ['r_loy1']);
  RC.sendRevenantAway(t2.id, { now: T0 });
  N.revenantCompanionUpdate(me, t2.id, (c) => { c.state = 'with'; });
  RC.sendRevenantAway(t2.id, { now: T0 + 60 });
  assert.equal(rec(t2).companion.loyalty, 51, '-10 x 0.9');
  N.revenantCompanionUpdate(me, t2.id, (c) => { c.state = 'with'; c.loyalty = 60; });
  RC.setRetinueBodies(() => ({ health: 10 }));
  RC.swornWitness(rec(t2).mobileType);
  assert.equal(rec(t2).companion.loyalty, 47, '-15 x 0.9, rounded');
  // a day away, its oath at its most (Oathbound and the Vigil: half of every loss)
  N._resetRevenantForTests(); RC._resetRetinueForTests(); RC.setRetinuePlayer(me);
  const d1 = sworn({ rank: 5, state: 'away', xp: 50 }), d2 = sworn({ rank: 5, state: 'away' });
  RC.setSwornStars(d1.id, ['r_loy1', 'r_rest1', 'r_bound', 'r_rest2', 'r_vigil']);
  N.revenantFester(me, { now: DAY * 10 });
  N.revenantFester(me, { now: DAY * 12 + 5 });
  assert.deepEqual([rec(d1).companion.loyalty, rec(d2).companion.loyalty], [60, 58], 'a day away: -0.5 rounds to none');
});

test('RVN-STARS THE ROAD ABROAD: `odds` its strength (ERRAND.ODDS.PER a point), `road` a share off the days its errand takes, `haul` a share more of the gold and the goods - never the pieces (mutants: the odds unread; the road unread; the haul unread; the pieces scaled)', () => {
  const r = sworn({ rank: 2, xp: 2100 });   // level 10: nine points and one for its rank
  const p = E.errandPlace('HighRock'), bm = E.errandPlace('BlackMarsh');
  assert.equal(E.errandOdds(rec(r), p), 0.65);
  assert.equal(E.errandMinutes(rec(r), bm), 4 * DAY);
  let seed = 0;
  for (; seed < 500; seed++) if (E.errandHaul(rec(r), E.newErrand(rec(r), 'BlackMarsh', 'forage', T0, seed), { level: 12 }).won) break;
  const e = E.newErrand(rec(r), 'BlackMarsh', 'forage', T0, seed);
  const h0 = E.errandHaul(rec(r), e, { level: 12 });
  RC.setSwornStars(r.id, ['r_odd1', 'r_haul1', 'r_far']);
  assert.equal(E.errandOdds(rec(r), p), 0.7, 'its stars\' half a point: +5%');
  assert.equal(E.errandMinutes(rec(r), bm), Math.round(4 * DAY * 0.85));
  assert.equal(E.newErrand(rec(r), 'BlackMarsh', 'forage', T0, 1).until, T0 + Math.round(4 * DAY * 0.85));
  const h1 = E.errandHaul(rec(r), e, { level: 12 });
  const units = (h) => h.units.reduce((n, [, c]) => n + c, 0);
  assert.equal(h1.won, true);
  assert.deepEqual([units(h0), units(h1)], [52, 54], '(3 + 2 x 5) x 4 days, x 1.05');
  assert.ok(h0.gold > 100 && h1.gold >= Math.floor(h0.gold * 1.05) && h1.gold <= Math.floor((h0.gold + 1) * 1.05), 'its gold x 1.05');
  assert.equal(h1.items.length, h0.items.length, 'never more pieces');
  RC.setSwornStars(r.id, ['r_odd1', 'r_haul1', 'r_far', 'r_haul2', 'r_fortune']);
  assert.equal(ST.rvnStatsOf(rec(r)).haul, 0.35);
  let ps = 0;
  for (; ps < 500; ps++) if (E.errandHaul(rec(r), E.newErrand(rec(r), 'BlackMarsh', 'plunder', T0, ps), { level: 12 }).won) break;
  assert.equal(E.errandHaul(rec(r), E.newErrand(rec(r), 'BlackMarsh', 'plunder', T0, ps), { level: 12 }).items.length, 4, 'a Plunder\'s piece a day - its haul\'s 35% never a fifth');
});

test('RVN-STARS THE GRAVE: `art` more weight on every gift and strike, `haste` off every cooldown (swornArtNumbers - the steps and the page read the same); Awakened Art teaches one born without an art of its family\'s pool, drawn on its id - never one with an art of its own, never a record not sworn (mutants: the weight unread; the haste unread; the awakening unread; the pool)', () => {
  const plain = saved({ rank: 3, art: 'mending' });
  assert.deepEqual(A.swornArtNumbers(plain), { mendShare: 0.18, mendCooldown: 120, wardPoints: 15, wardCooldown: 90, cryPoints: 10, cryCooldown: 90, weight: 0.8, strikeCooldown: [16, 22] });
  N._resetRevenantForTests();
  const m = saved({ rank: 3, xp: 50, art: 'mending', stars: ['oath', 'g_pow1', 'g_hst1'] });   // level 2: one point and two for its rank
  const n = A.swornArtNumbers(m);
  assert.deepEqual([n.mendShare, n.mendCooldown, n.wardPoints, n.cryPoints, n.wardCooldown, n.weight, n.strikeCooldown], [0.18 * 1.05, 114, 16, 11, 85.5, 0.8 * 1.05, [15.2, 20.9]]);
  assert.equal(A.artWords(m, { sworn: true }), 'Art: Mending - when you fall under 40% of your health it heals 19% of it (every 1.9 minutes).');
  me.health = 30; me.maxHealth = 100;
  assert.equal(A.swornMendStep(me, 30, [m], () => true), m);
  assert.equal(me.health, 30 + Math.floor(100 * 0.18 * 1.05), 'a share of my health, 1.05 times its rank\'s');
  // the awakening
  N._resetRevenantForTests();
  const bare = saved({ rank: 5, art: null, stars: ['oath', 'g_pow1', 'g_pow2', 'g_focus'] });
  assert.equal(A.artOf(bare), null, 'born without, not yet awakened');
  RC.setSwornStars(bare.id, ['g_pow1', 'g_pow2', 'g_focus', 'g_wake']);
  const learnt = A.artOf(rec(bare));
  assert.ok(learnt && A.ART_POOL[signatureFamily(bare.mobileType) ?? 'caster'].includes(learnt), 'its family\'s pool');
  assert.equal(learnt, A.taughtArt(bare.id, bare.mobileType), 'drawn on its id');
  assert.equal(A.artOf({ ...rec(bare), sworn: false }), null, 'no oath, no awakening');
  N._resetRevenantForTests();
  const born = saved({ rank: 5, art: 'warcry', stars: ['oath', 'g_pow1', 'g_pow2', 'g_focus', 'g_wake'] });
  assert.equal(A.artOf(born), 'warcry', 'one with an art keeps its own');
  assert.deepEqual(new Set(['Orc', 'Giant', 'Mage', 'Spider'].map((k) => A.taughtArt('rv-x', M[k]))).size > 0, true);
  assert.equal(A.taughtArt('', M.Orc), null);
});

test('RVN-STARS SETTING ITS SKY: through the law and its points; never abroad (said why); a body standing here strikes with its new blows at once, its health at its next stand; the window\'s ledger (mutants: the law skipped; abroad set; the body unread)', () => {
  const r = sworn({ rank: 3 });
  assert.deepEqual(RC.setSwornStars(r.id, ['b_bl1', 'b_bl2', 'b_relent']), ['oath', 'b_bl1', 'b_bl2'], 'two points');
  const body = { maxHealth: 77, health: 77, damageScale: 1 };
  RC.setRetinueBodies((id) => (id === r.id ? body : null));
  RC.setSwornStars(r.id, ['b_bl1']);
  assert.deepEqual([body.damageScale, body.maxHealth], [1.3 * 1.04, 77]);
  const book = RC.swornStarsBook(r.id);
  assert.deepEqual([book.tree(), book.stars().points, book.refusal()], [['oath', 'b_bl1'], 2, null]);
  RC.sendOnErrand(r.id, 'HighRock', 'forage', { now: T0, seed: 1 });
  assert.equal(RC.setSwornStars(r.id, ['b_hp1']), 'It is abroad - set its stars when it is back.');
  assert.deepEqual(rec(r).companion.stars, ['oath', 'b_bl1'], 'unchanged');
  assert.equal(book.refusal(), 'It is abroad - set its stars when it is back.');
  assert.equal(RC.setSwornStars('nobody', ['b_hp1']), 'It is no longer sworn to you.');
});

// ── the window ──────────────────────────────────────────────────────

/** A document enough for the window (the captain's stars' test's). */
function fakeDoc() {
  const listeners = new Map();
  const mk = (tag) => {
    const kids = [];
    const classes = new Set();
    const e = {
      tagName: tag.toUpperCase(), children: kids, style: {}, attrs: {}, dataset: {}, textContent: '', title: '', disabled: false, handlers: {},
      classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c), toggle: (c, on) => { if (on ?? !classes.has(c)) classes.add(c); else classes.delete(c); }, contains: (c) => classes.has(c) },
      set className(v) { classes.clear(); for (const c of String(v).split(/\s+/).filter(Boolean)) classes.add(c); },
      get className() { return [...classes].join(' '); },
      append: (...n) => kids.push(...n), appendChild: (n) => kids.push(n), replaceChildren: (...n) => { kids.length = 0; kids.push(...n); },
      remove() { e.removed = true; }, setAttribute: (k, v) => { e.attrs[k] = v; }, focus() {}, setPointerCapture() {},
      addEventListener: (t, fn) => { e.handlers[t] = fn; }, getBoundingClientRect: () => ({ left: 0, top: 0, right: 1280, bottom: 60, width: 1280, height: 60 }),
      clientWidth: 1280, clientHeight: 760, offsetWidth: 200, offsetHeight: 100,
      getContext: () => new Proxy({}, { get: (_t, k) => (k === 'measureText' ? (s) => ({ width: String(s).length * 7 }) : k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => {}), set: () => true }),
    };
    return e;
  };
  const text = (e) => [e.textContent, ...e.children.map(text)].join('');
  return {
    doc: { createElement: mk, getElementById: () => null, head: mk('head'), documentElement: { dataset: {} } },
    text, mk,
    win: { addEventListener: (t, fn) => listeners.set(t, fn), removeEventListener: (t) => listeners.delete(t), listeners },
  };
}
function withWindow(fn) {
  const f = fakeDoc();
  const saved0 = { add: globalThis.addEventListener, rem: globalThis.removeEventListener, doc: globalThis.document, raf: globalThis.requestAnimationFrame, caf: globalThis.cancelAnimationFrame };
  globalThis.document = /** @type {any} */ (f.doc);
  globalThis.addEventListener = f.win.addEventListener;
  globalThis.removeEventListener = f.win.removeEventListener;
  globalThis.requestAnimationFrame = () => 1;
  globalThis.cancelAnimationFrame = () => {};
  try { fn(f); } finally {
    globalThis.addEventListener = saved0.add; globalThis.removeEventListener = saved0.rem; globalThis.document = saved0.doc;
    globalThis.requestAnimationFrame = saved0.raf; globalThis.cancelAnimationFrame = saved0.caf;
  }
}

test('RVN-STARS THE WINDOW\'S WORDS: every star named, its aspect and kind; a stat\'s line - the odds as the odds\' own percent, the road shorter or longer; the sky\'s sum in the stats\' order; a star refused says why; its art said - its own, awakened, or what Awakened Art would teach (mutants: a name, the units, the points)', () => {
  for (const s of ['oath', 'b_hp1', 'b_hp2', 'b_iron', 'b_hp3', 'b_deathless', 'b_bl1', 'b_bl2', 'b_relent', 'b_bl3', 'b_rage', 'g_pow1', 'g_pow2', 'g_focus', 'g_pow3', 'g_pact', 'g_hst1', 'g_hst2', 'g_rite', 'g_hst3', 'g_wake', 'r_odd1', 'r_haul1', 'r_far', 'r_haul2', 'r_fortune', 'r_loy1', 'r_rest1', 'r_bound', 'r_rest2', 'r_vigil']) assert.notEqual(rvnStarName(s), s, s);
  assert.equal(rvnStarName('g_wake'), 'Awakened Art');
  assert.equal(rvnStarKindWords(ST.rvnStarOf('g_pact')), 'The Grave · keystone');
  assert.equal(rvnStarKindWords(ST.rvnStarOf('r_bound')), 'The Road · notable');
  assert.equal(rvnStarKindWords(ST.rvnStarOf('oath')), 'Starting star');
  assert.deepEqual([['health', 0.05], ['blows', -0.1], ['art', 0.15], ['haste', 0.05], ['odds', 0.3], ['odds', -0.5], ['haul', 0.25], ['road', 0.15], ['road', -0.1], ['loyal', 0.2], ['rest', 0.3]].map(([k, v]) => rvnStarStatWords(k, v)),
    ['Health +5%', 'Damage -10%', 'Art strength +15%', 'Its art recharges 5% faster', 'Mission odds +3%', 'Mission odds -5%', 'Mission gold and materials +25%', 'Missions 15% shorter', 'Missions 10% longer', 'Loyalty losses 20% smaller', 'Recovers 30% faster']);
  assert.deepEqual(rvnSkySummary(['oath', 'b_hp1', 'b_bl1', 'b_bl2', 'b_relent', 'b_bl3', 'b_rage']).map((l) => [l.key, l.neg]), [['health', true], ['blows', false]]);
  assert.equal(rvnStarRefusal(['oath'], 'g_wake', 2), 'Reaching this star costs 4 points. It has 2. It gets one point per level, and one per rank past the first.');
  assert.equal(rvnStarRefusal(['oath'], 'g_wake', 4), null);
  assert.equal(rvnStarRefusal(['oath'], 'zz', 4), 'Unknown star.');
  const own = saved({ art: 'nova', mobileType: M.Giant });
  assert.equal(rvnArtNote(own), 'Its art: Nova. The Grave makes it stronger and quicker.');
  N._resetRevenantForTests();
  const bare = saved({ rank: 5, art: null });
  assert.equal(rvnArtNote(bare), `It was born without an art. Awakened Art would teach it ${A.ART_NAMES[A.taughtArt(bare.id, bare.mobileType)]}.`);
  RC.setSwornStars(bare.id, ['g_pow1', 'g_pow2', 'g_focus', 'g_wake']);
  assert.match(rvnArtNote(rec(bare)), /^Its art: .+, awakened by its stars\./);
});

test('RVN-STARS THE WINDOW: the captain\'s sky window (ui/skyWindow.js) drawing its sky - a star pressed sets the whole way while its points pay; one refused says why; a star taken back takes those joined only through it; Accept gives its oath the sky, the save told; abroad, Accept is refused and the sky stays pending; a close with a change unaccepted asks once (mutants: the way, the points, the cascade, the accept, the refusal, the ask)', () => {
  withWindow((f) => {
    const r = sworn({ rank: 3, xp: 200 });   // level 3: two points and two for its rank
    let exits = 0, changed = 0;
    const host = f.mk('div');
    const w = mountRevenantStarsWindow(/** @type {any} */ (host), { id: r.id, changed: () => changed++, onExit: () => exits++, doc: /** @type {any} */ (f.doc) });
    assert.equal(host.children[0].attrs['aria-label'], `${r.name}'s Stars`);
    assert.match(f.text(host), /Level3200 of 324 XP★4of 4/);
    w.take('b_relent');
    assert.deepEqual(w.model().pending, ['oath', 'b_bl1', 'b_bl2', 'b_relent'], 'the whole way');
    const said = () => host.children[0].children.find((c) => c.className.includes('fmt-say')).textContent;
    w.take('g_pow2');
    assert.equal(w.model().pending.length, 4, 'two more than the one point left: refused');
    assert.match(said(), /Reaching this star costs 2 points\. It has 1\./);
    w.take('g_pow1');
    w.giveBack('b_bl1');
    assert.deepEqual(w.model().pending, ['oath', 'g_pow1'], 'the blade\'s path with it');
    w.take('b_hp1');
    w.accept();
    assert.deepEqual(rec(r).companion.stars, ['oath', 'g_pow1', 'b_hp1']);
    assert.equal(changed, 1);
    assert.equal(said(), 'Stars saved.');
    RC.sendOnErrand(r.id, 'HighRock', 'forage', { now: T0, seed: 1 });
    w.take('b_bl1');
    w.accept();
    assert.equal(said(), 'It is abroad - set its stars when it is back.');
    assert.deepEqual([rec(r).companion.stars, w.model().changes, changed], [['oath', 'g_pow1', 'b_hp1'], { added: 1, removed: 0 }, 1], 'refused: kept pending, nothing told');
    assert.equal(w.tryClose(), false, 'asked first');
    assert.equal(w.tryClose(), true);
    assert.equal(exits, 1);
    assert.equal(f.win.listeners.has('keydown'), false, 'the keyboard given back');
  });
});

// ── the page and the doors ──────────────────────────────────────────

function fakeEl(tag) {
  const classes = new Set();
  const n = {
    tag, children: [], attrs: {}, parent: null, title: '', isConnected: true, style: {},
    classList: { add: (...c) => c.forEach((x) => classes.add(x)), contains: (c) => classes.has(c), remove: (...c) => c.forEach((x) => classes.delete(x)) },
    get className() { return [...classes].join(' '); }, set className(v) { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach((x) => classes.add(x)); },
    _text: '', get textContent() { return n._text + n.children.map((c) => c.textContent ?? '').join(''); }, set textContent(v) { n._text = String(v ?? ''); },
    get firstChild() { return n.children[0] ?? null; },
    append(...cs) { for (const c of cs) { c.parent = n; n.children.push(c); } },
    insertBefore(c, ref) { c.parent = n; const i = ref ? n.children.indexOf(ref) : -1; if (i < 0) n.children.push(c); else n.children.splice(i, 0, c); return c; },
    setAttribute(k, v) { n.attrs[k] = v; },
  };
  return n;
}
function el(t, cls, text) { const n = fakeEl(t); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
function byClass(root, cls) { const out = []; const walk = (x) => { for (const c of x.children ?? []) { if (c.classList?.contains(cls)) out.push(c); walk(c); } }; walk(root); return out; }
function buttons(root, label) { const out = []; const walk = (x) => { for (const c of x.children ?? []) { if (c.tag === 'button' && c.textContent === label) out.push(c); walk(c); } }; walk(root); return out; }

test('RVN-STARS THE PAGE: each sworn one\'s level and the stars it has to set; Stars opens its sky through the door that drew the page (none without one; none abroad); a mission\'s days its road\'s (mutants: the line unsaid; the door unread; the road unread on the page)', () => {
  _resetCompanionRosterForTests();
  _setCompanionRosterIconForTests(() => ({ src: 'data:x', w: 30, h: 40 }));
  globalThis.document = undefined;
  const r = sworn({ rank: 2 });
  const opened = [];
  const draw = (stars = (id) => opened.push(id)) => { const d = el('div', 'px-qdetail'); drawCompanionsPage(d, () => {}, { el, divider: (t) => el('h4', 'px-divider', t), meter: (n, m) => el('div', 'px-meter', `${n}/${m}`), here: () => null, kindName: () => 'Orc', stars }); return d; };
  let d = draw();
  assert.deepEqual(byClass(d, 'cmp-stars').map((x) => [x.textContent, x.classList.contains('is-left')]), [['Level 1 · a star to set', true]]);
  buttons(d, 'Stars')[0].onclick();
  assert.deepEqual(opened, [r.id]);
  assert.equal(buttons(draw(null), 'Stars').length, 0, 'no door, no button');
  RC.setSwornStars(r.id, ['r_odd1']);
  N.revenantCompanionUpdate(me, r.id, (c) => { c.xp = 200; });
  RC.setSwornStars(r.id, ['r_odd1', 'r_haul1', 'r_far']);
  d = draw();
  assert.equal(byClass(d, 'cmp-stars')[0].textContent, 'Level 3 · 3 of 3 stars set');
  buttons(d, 'Mission')[0].onclick();
  d = draw();
  const dests = byClass(d, 'cmp-dest');
  assert.match(dests[0].textContent, /^High Rock - 20 hours, danger I/);
  assert.match(dests[8].textContent, /^Black Marsh - 82 hours, danger V/);
  buttons(d, 'Send')[0].onclick();
  d = draw();
  assert.equal(buttons(d, 'Stars').length, 0, 'abroad: no Stars');
});

test('RVN-STARS THE DOORS: both doors that draw the pause window lay its sky over it (ui/firmamentOver.js revenantStarsOver - the Firmament\'s own door, built once) and put the page back on Companions; the menu lands there and hands its page the door; no host grew (PIN: the doors)', () => {
  const over = read('src/ui/firmamentOver.js');
  assert.match(over, /export function revenantStarsOver\(\{ alive, below, back \}\) \{\n\s+const o = overPage\(\{/);
  assert.match(over, /load: \(\) => import\('\.\/revenantStarsWindow\.js'\),\n\s+mount: \(\{ mountRevenantStarsWindow \}, h, id, onExit\) => mountRevenantStarsWindow\(h, \{ id, onExit \}\),/);
  const pause = read('src/ui/pauseDoor.js');
  assert.match(pause, /get openRevenantStars\(\) \{ return rvnStars\.hook; \},/);
  assert.match(pause, /view = seams\.mountEnhancedMenu\(host, \{ mode: 'pause', hooks, onAction: act, at: 'companions' \}\);/);
  assert.match(pause, /firm\.drop\(\); rvnStars\.drop\(\);/);
  const sheet = read('src/ui/charSheetDoor.js');
  assert.match(sheet, /openRevenantStars: rvnStars\.hook,/);
  assert.match(sheet, /back: \(\) => remountPage\('companions'\),/);
  assert.match(sheet, /rvnStars\.drop\(\);/);
  assert.match(sheet, /\.\.\.\(landing === 'stats' \? \{\} : \{ at: landing \}\),/);
  const menu = read('src/ui/enhanced/enhancedMenu.js');
  assert.match(menu, /else if \(at === 'companions'\) \{ pauseTab = 'holdings'; holdSec = 'companions'; \}/);
  assert.match(menu, /stars: typeof hooks\.openRevenantStars === 'function' \? hooks\.openRevenantStars : null/);
  assert.match(read('src/ui/captainTreeWindow.js'), /return mountSkyWindow\(host, sky, \{ changed, onExit, doc \}\);/, 'the captain\'s stars in the same window');
  for (const host of ['src/scenes/world.js', 'src/scenes/worldModes.js', 'src/scenes/dungeonContext.js', 'src/scenes/exterior.js']) assert.doesNotMatch(read(host), /revenantStars|rvnStar|swornStars/, `${host}: never wired in a host`);
});
