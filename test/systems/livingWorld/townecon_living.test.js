import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { synthTown } from '../../lwTown.mjs';
import { LivingTown } from '../../../src/systems/livingWorld/livingTown.js';
import { townEconNews, TOWN_ECON_NEWS_DAYS, newsScript } from '../../../src/systems/livingWorld/lines.js';
import { setLocale, patchLocaleTable, clearLocaleTables } from '../../../src/systems/textManager.js';
import { marketDay, marketTrip, MARKET_BOOM_DAY, MARKET_DESTITUTE_WEEKS } from '../../../src/systems/livingWorld/trips.js';
import { DAY_MIN, DAY_START_MIN } from '../../../src/systems/livingWorld/dayPlan.js';
import { TOWN_BANDS, townTipOf } from '../../../src/net/townEconLaw.js';
import { createChapterSheet } from '../../../src/net/chapterSheet.js';
import { HIDDEN_HALL_FACTIONS } from '../../../src/net/npcChapterLaw.js';
import { createTownEconHost } from '../../../src/scenes/townEconHost.js';
import { CLASSIC_MINUTES_PER_SECOND } from '../../../src/systems/worldTick.js';
import { PERSON_MOVE_SPEED } from '../../../src/characters/mobile/mobilePerson.js';
import { hostText } from '../../hostText.mjs';   // HOST-SPLIT 2: the world host whole

// TOWN-ECON TE3 (2026-10-18, bible/06-Systems/Town-Economy-Arc.md section 5; Mac: "Everything") - THE LIVING WORLD READS
// THE BAND: the townsfolk's talk of trade, the market days, and the chapters' patrons on the town's card.

const src = (p) => readFileSync(new URL(`../../../${p}`, import.meta.url), 'utf8');
const MPM = PERSON_MOVE_SPEED / CLASSIC_MINUTES_PER_SECOND;
const TOWN = Object.freeze({ mapId: 4242, blocks: 36, region: 17, people: 3, port: false });
const BANDS = TOWN_BANDS.map(([b]) => b);

test('TOWN-ECON TE3 the market days: a Steady town\'s (and every town with no band - offline) one day in seven as LW9 left it; a Booming town\'s a second, MARKET_BOOM_DAY after it; a Destitute town\'s its own day every MARKET_DESTITUTE_WEEKS weeks - the other bands LW9\'s (mutants: TOWNECON3-boom-day, TOWNECON3-destitute-weeks, TOWNECON3-band-unread)', () => {
  assert.deepEqual([MARKET_BOOM_DAY, MARKET_DESTITUTE_WEEKS], [4, 2]);
  for (const mapId of [1, 77, 4242, 0xfffffff0]) {
    const t = { mapId };
    const days = (band) => Array.from({ length: 28 }, (_, i) => 700 + i).filter((d) => marketDay(t, d, band));
    const lw9 = days(null);
    assert.equal(lw9.length, 4, 'one day in seven');
    assert.deepEqual(days(undefined), lw9);
    for (const band of ['Thriving', 'Steady', 'Struggling']) assert.deepEqual(days(band), lw9, band);
    const boom = days('Booming');
    assert.equal(boom.length, 8);
    assert.ok(lw9.every((d) => boom.includes(d)), 'its own day kept');
    assert.ok(boom.filter((d) => !lw9.includes(d)).every((d) => marketDay(t, d - MARKET_BOOM_DAY)), 'the second four days after its own');
    const poor = days('Destitute');
    assert.equal(poor.length, 2);
    assert.ok(poor.every((d) => lw9.includes(d)) && poor[1] - poor[0] === 14, 'its own day, a fortnight apart');
  }
});

test('TOWN-ECON TE3 a carter\'s day to market reads the market town\'s band on that day from the trips\' world (`marketBandOf`) - none asked, LW9\'s days (mutants: TOWNECON3-band-unread)', () => {
  const home = { mapId: 1, px: 100, py: 100, blocks: 9, type: 2 };
  const to = { mapId: 2, px: 101, py: 100, blocks: 16, type: 0 };
  const asked = [];
  const world = {
    townsNear: () => [home, to], routeOf: () => ({ pixels: [[100, 100], [101, 100]], len: 800 }), dryAt: () => true,
    marketBandOf: (t, d) => { asked.push([t.mapId, d]); return 'Booming'; },
  };
  const res = { id: 'carter-1', job: 'carter' };
  const start = 700, len = 7;
  const trip = marketTrip(res, home, 0, world, { start, len, pace: 1, rng: () => 0 });
  assert.ok(asked.length >= 1 && asked.every(([m]) => m === 2), 'the market town\'s band');
  const first = Array.from({ length: len }, (_, i) => start + i).find((d) => marketDay(to, d, 'Booming'));
  if (trip) assert.equal(Math.floor(trip.outT0 / DAY_MIN), first, 'the first market day of a Booming town');
  const plain = marketTrip(res, home, 0, { ...world, marketBandOf: undefined }, { start, len, pace: 1, rng: () => 0 });
  const lw9 = Array.from({ length: len }, (_, i) => start + i).find((d) => marketDay(to, d));
  if (plain) assert.equal(Math.floor(plain.outT0 / DAY_MIN), lw9, 'none asked: LW9\'s');
});

test('TOWN-ECON TE3 the town\'s talk of trade: its band\'s news (lines.js townEconNews) on TOWN_ECON_NEWS_DAYS of the week, its own drawn on the seed; a Steady town, a band it does not know and an offline town (no band) none; every reader the same; the words through the text core, `{town}` its name (mutants: TOWNECON3-news-days, TOWNECON3-news-steady, TOWNECON3-news-pool, TOWNECON3-news-unread)', () => {
  const NEWS = townEconNews();
  assert.deepEqual(Object.keys(NEWS).sort(), ['booming', 'destitute', 'struggling', 'thriving'], 'every band but Steady');
  assert.deepEqual(BANDS.map((b) => b.toLowerCase()).filter((b) => b !== 'steady').sort(), Object.keys(NEWS).sort(), 'the law\'s bands');
  assert.equal(TOWN_ECON_NEWS_DAYS, 3);
  for (const k of Object.keys(NEWS)) for (const s of NEWS[k]) assert.ok(s.length === 2 && s[0].includes('{town}'), k);
  assert.equal(townEconNews(), NEWS, 'kept while the language holds - a script is its pool\'s own');
  assert.deepEqual(NEWS.destitute[0], ['Half the shops in {town} have shut.', 'Hard times. Hard times.']);
  const fx = synthTown({ blocksW: 6, blocksH: 6 });
  const t = { now: 300 * DAY_MIN + DAY_START_MIN + 600 };
  const town = (band) => new LivingTown(fx.nav, { town: TOWN, buildings: fx.buildings, doors: fx.doors, makePerson: () => null, clock: () => t.now, rate: () => CLASSIC_MINUTES_PER_SECOND, mpm: MPM,
    ...(band !== undefined ? { econBandOf: () => band } : {}) });
  const week = (lt) => Array.from({ length: 7 }, (_, i) => lt.econNews((300 + i) * DAY_MIN + DAY_START_MIN + 600));
  for (const band of ['Booming', 'Thriving', 'Struggling', 'Destitute']) {
    const w = week(town(band));
    assert.equal(w.filter((n) => n.length).length, TOWN_ECON_NEWS_DAYS, band);
    assert.ok(w.flat().every((n) => n.kind === band.toLowerCase() && n.econ === true));
    assert.deepEqual(week(town(band)), w, 'every reader the same');
  }
  for (const band of ['Steady', 'Flourishing', null]) assert.deepEqual(week(town(band)).flat(), [], String(band));
  assert.deepEqual(week(town(undefined)).flat(), [], 'offline: no band');
  // the talk's context carries it, beside the town's other news, and a meeting tells the band's own words
  const lt = town('Destitute');
  const day = [300, 301, 302, 303, 304, 305, 306].find((d) => lt.econNews(d * DAY_MIN + DAY_START_MIN).length);
  const ctx = lt.lineCtx(day * DAY_MIN + DAY_START_MIN);
  assert.ok(ctx.news.some((n) => n.econ && n.kind === 'destitute'));
  const item = ctx.news.find((n) => n.econ);
  let got = null;
  for (let seed = 0; seed < 200 && !got; seed++) got = newsScript(seed, [item]);
  assert.ok(got && townEconNews().destitute.includes(got.script), 'a Destitute town\'s own words');
  // in the player's language, read when told
  patchLocaleTable('de', 'Port_Strings', [['lw.econ.destitute.a', 'Die Hälfte der Läden in {town} hat geschlossen.']]);
  setLocale('de');
  try { assert.equal(townEconNews().destitute[0][0], 'Die Hälfte der Läden in {town} hat geschlossen.', 'the German catalog\'s'); } finally { setLocale('en'); clearLocaleTables('de'); }
  assert.equal(townEconNews().destitute[0][0], NEWS.destitute[0][0], 'and English again');
});

test('TOWN-ECON TE3 the chapters\' patrons on the town\'s card: the region\'s chapters that have a patron, hidden guilds\' never, each guild once by name, three at most, after its guild control; none with no sheet (mutants: TOWNECON3-patrons-hidden, TOWNECON3-patrons-unread, TOWNECON3-patrons-max)', async () => {
  const PAT = (id, name, tag) => ({ id: `g${id.padStart(10, '0')}`, name, tag });   // guildLaw.js GUILD_ID_RE
  const sheet = createChapterSheet({ door: { list: async () => ({ ok: true, data: { chapters: [
    { f: 40, region: 17, strength: 50, patron: PAT('g1', 'Iron Wolves', 'IW') },
    { f: 41, region: 17, strength: 50, patron: PAT('g2', 'Ebon Oath', 'EO') },
    { f: 42, region: 17, strength: 50, patron: PAT('g1', 'Iron Wolves', 'IW') },
    { f: 43, region: 18, strength: 50, patron: PAT('g3', 'Far Away', 'FA') },
    { f: 44, region: 17, strength: 50, patron: null },
    { f: HIDDEN_HALL_FACTIONS[0], region: 17, strength: 50, patron: PAT('h9', 'Night Hands', 'NH') },   // a hidden guild's chapter
  ] } }) } });
  sheet.refresh();
  await new Promise((r) => setTimeout(r, 0)); await new Promise((r) => setTimeout(r, 0));
  assert.deepEqual(sheet.patronsIn(17).map((p) => p.name), ['Ebon Oath', 'Iron Wolves'], 'each guild once, by name; another region\'s and a hidden guild\'s chapter\'s not');
  const towns = new Map([[11, { name: 'Ripmarket', px: 212, py: 151, region: 17, type: 0, location: 5 }]]);
  const host = createTownEconHost({ online: () => true, townOf: (id) => towns.get(id), seatAt: () => null, seats: () => [], raidedAt: () => false, nowMs: () => 1_800_000_000_000,
    door: null, chapters: sheet });
  const card = host.tipAt(11);
  assert.match(card.lines.at(-1), /^Chapter patrons in the area: Ebon Oath <EO>, Iron Wolves <IW>$/);
  const bare = createTownEconHost({ online: () => true, townOf: (id) => towns.get(id), seatAt: () => null, seats: () => [], raidedAt: () => false, nowMs: () => 1_800_000_000_000, door: null });
  assert.ok(!bare.tipAt(11).lines.some((l) => l.startsWith('Chapter patrons')), 'no sheet, no line');
  const many = townTipOf({ name: 'X', p: 50, prev: 50, area: null, patrons: [PAT('a', 'A', 'A'), PAT('b', 'B', 'B'), PAT('c', 'C', 'C'), PAT('d', 'D', 'D')] });
  assert.equal(many.lines.at(-1), 'Chapter patrons in the area: A <A>, B <B>, C <C>', 'three at most');
});

test('TOWN-ECON TE3 the host: the band frozen a town a day for the market days (a day\'s plans never change under it), the band read live for the talk; the world host hands the trips\' world the market band and the living town its band (mutants: TOWNECON3-market-unfrozen, TOWNECON3-trips-unwired, TOWNECON3-living-unwired)', () => {
  let p = 'Booming';
  const towns = new Map([[11, { name: 'Ripmarket', px: 212, py: 151, region: 17, type: 0, location: 5 }]]);
  const host = createTownEconHost({ online: () => true, townOf: (id) => towns.get(id), seatAt: () => null, seats: () => [], raidedAt: () => false, nowMs: () => 1_800_000_000_000, door: null });
  host.bandOf = () => p;   // the reading's band, as the market's freeze reads it
  assert.equal(host.marketBandOf({ mapId: 11 }, 700), 'Booming');
  p = 'Destitute';
  assert.equal(host.marketBandOf({ mapId: 11 }, 700), 'Booming', 'frozen for the day');
  assert.equal(host.marketBandOf({ mapId: 11 }, 701), 'Destitute', 'the next day read again');
  const w = hostText('src/scenes/world.js');
  assert.match(w, /townsIn: \(region\) => livingTownsOfRegion\(region\), marketBandOf: townEcon\.marketBandOf,/);
  assert.match(src('src/scenes/pixelBuild.js'), /econBandOf: \(\) => townEcon\.bandOf\(livingTown\.mapId\),/);
});
