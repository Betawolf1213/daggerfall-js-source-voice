// WITCH1 (2026-10-20, bible/06-Systems/Witches-Festival.md): THE WITCHES' FESTIVAL, SERVICE SIDE - the REAL functions over
// the REAL migrations (test/accountDb.mjs, migration 0134): the finds the service's own die decides and a day caps, the
// sales under a request id, the Hearth Offerings set out, filled, taken from once a day and taken in, an orphan's cakes
// sent home, and the festival's wardrobe - the titles, the aura and the profile icon, held only as the rows say.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { standService } from '../accountDb.mjs';
import { ROUTES } from '../../server-account/src/service.js';
import {
  festivalOf, findFestival, buyFestival, festivalTown, setOffering, fillOffering, takeInOffering, takeFromOffering,
  festivalSwitchOf, festivalOpenFor, skyDayAt, FEST_STATUS,
} from '../../server-account/src/festival.js';
import { titlesHeld, aurasHeld, iconsHeld, iconWorn, iconRefusal, HEARTHKEEPER_TITLE, SOULCAKE_ICON } from '../../server-account/src/titles.js';
import {
  FESTIVALS, FIND_ASKS_PER_DAY, FIND_CAKES_PER_DAY, OFFERING_FILL, OFFERING_STOCK_MAX, HEARTHKEEPER_GIVEN, SOULCAKE_TAKEN, festivalNight,
} from '../../src/net/festivalLaw.js';
import { utcDay } from '../../src/net/marksLaw.js';

const ON = { FESTIVAL_OPEN: 'on' };
/** An instant inside the festival that is not a night the dead walk, one that is, and one after it. */
const DAY_S = FESTIVALS[0].fromMs / 1000 + 3600;
const NIGHT_S = (() => { for (let s = FESTIVALS[0].fromMs / 1000; s < FESTIVALS[0].toMs / 1000; s += 600) if (festivalNight(skyDayAt(s))) return s; return null; })();
const AFTER_S = FESTIVALS[0].toMs / 1000 + 60;
/** The die: a hit (every byte 0 - a roll of 0) or a miss (every byte 255). */
const HIT = (/** @type {Uint8Array} */ b) => b.fill(0);
const MISS = (/** @type {Uint8Array} */ b) => b.fill(255);
const MAP = 1234, HOME = 77, HALL = 78, CHAR = 'char-alice';

async function stand() {
  const S = await standService(ON);
  const alice = await S.registered('Alice');
  const bob = await S.registered('Bobby');
  const db = S.env.DB;
  const row = (id) => db._raw.prepare('SELECT * FROM players WHERE id = ?').get(id);
  const player = (who) => ({ ...row(who.id), id: who.id, handle: who.handle });
  const ctx = (nowS = DAY_S, rand = HIT) => ({ db, nowS, rand });
  const cakes = (who, n) => db._raw.prepare('UPDATE players SET fest_cakes = ? WHERE id = ?').run(n, who.id);
  const home = (who, mapId, key, charId, guild = null) => db._raw.prepare(`INSERT INTO homes (map_id, building_key, player, char_id, owner_name, region, price, bought_at, guild_id)
    VALUES (?, ?, ?, ?, ?, 0, 1000, 1, ?)`).run(mapId, key, who.id, charId, who.handle, guild);
  return { S, alice, bob, db, row, player, ctx, cakes, home };
}

test('WITCH1 the routes and the switch: every festival route behind a session, FESTIVAL_OPEN off, dev or on', () => {
  for (const r of ['/v1/festival/mine', '/v1/festival/find', '/v1/festival/buy', '/v1/festival/town', '/v1/festival/offering/set',
    '/v1/festival/offering/fill', '/v1/festival/offering/take-in', '/v1/festival/offering/take', '/v1/account/icon']) assert.ok(ROUTES.has(r), r);
  assert.equal(festivalSwitchOf('on'), 'on');
  assert.equal(festivalSwitchOf('dev'), 'dev');
  assert.equal(festivalSwitchOf('yes'), 'off');
  assert.equal(festivalSwitchOf(undefined), 'off');
  assert.equal(festivalOpenFor({ handle: 'x' }, {}), false, 'unset is shut');
  assert.equal(festivalOpenFor({ handle: 'x' }, ON), true);
  assert.deepEqual(FEST_STATUS, { guest: 403, closed: 409, rate: 429, capped: 429 });
  assert.ok(NIGHT_S != null, 'the festival holds a night the dead walk on the sky\'s clock');
  assert.equal(festivalNight(skyDayAt(DAY_S)), false);
});

test('WITCH1 A FIND: the service\'s die decides at the source\'s odds; a guest, a shut switch, the days\' end and a word that is no source are refused', async () => {
  const { alice, player, ctx, row, S } = await stand();
  const g = await S.guest();
  assert.deepEqual(await findFestival(ctx(), { id: g.id, handle: null }, { source: 'foe' }, ON), { error: 'guest' });
  assert.deepEqual(await findFestival(ctx(), player(alice), { source: 'foe' }, {}), { error: 'closed' });
  assert.deepEqual(await findFestival(ctx(AFTER_S), player(alice), { source: 'foe' }, ON), { error: 'closed' });
  assert.deepEqual(await findFestival(ctx(), player(alice), { source: 'gold' }, ON), { error: 'source' });
  assert.deepEqual(await findFestival(ctx(DAY_S, MISS), player(alice), { source: 'foe' }, ON), { found: 0, cakes: 0 });
  assert.deepEqual(await findFestival(ctx(DAY_S, HIT), player(alice), { source: 'foe' }, ON), { found: 1, cakes: 1 });
  assert.deepEqual(await findFestival(ctx(DAY_S, HIT), player(alice), { source: 'endgame' }, ON), { found: 4, cakes: 5 });
  assert.deepEqual(await findFestival(ctx(NIGHT_S, HIT), player(alice), { source: 'endgame' }, ON), { found: 8, cakes: 13 }, 'twice on a night the dead walk');
  assert.equal(row(alice.id).fest_cakes, 13);
});

test('WITCH1 THE DAY\'S CAPS: FIND_ASKS_PER_DAY asks and FIND_CAKES_PER_DAY cakes - a forged client finds no more than a whole day\'s honest play', async () => {
  const { alice, player, ctx, db, row } = await stand();
  const day = utcDay(DAY_S);
  db._raw.prepare('INSERT INTO fest_finds (account, day, asks, found) VALUES (?, ?, ?, ?)').run(alice.id, day, FIND_ASKS_PER_DAY - 1, FIND_CAKES_PER_DAY - 3);
  // the last ask of the day: the cakes it gives stop at the day's cap
  assert.deepEqual(await findFestival(ctx(), player(alice), { source: 'endgame' }, ON), { found: 3, cakes: 3 });
  assert.deepEqual(await findFestival(ctx(), player(alice), { source: 'foe' }, ON), { error: 'capped', cakes: 3 });
  assert.equal(row(alice.id).fest_cakes, 3);
  // the next UTC day starts afresh
  assert.equal((await findFestival(ctx(DAY_S + 86400), player(alice), { source: 'foe' }, ON)).found, 1);
});

test('WITCH1 A SALE: the price taken only while the cakes cover it; an account ware laid on the row once; the same request id is one sale', async () => {
  const { alice, player, ctx, cakes, row, db } = await stand();
  assert.deepEqual(await buyFestival(ctx(), player(alice), { ware: 'title:witchwarden', rid: 'nope' }, ON), { error: 'rid' });
  assert.deepEqual(await buyFestival(ctx(), player(alice), { ware: 'title:nobody', rid: 'aaaaaaaaaaaa' }, ON), { error: 'ware' });
  assert.deepEqual(await buyFestival(ctx(), player(alice), { ware: 'title:witchwarden', rid: 'aaaaaaaaaaaa' }, ON), { error: 'cakes', cakes: 0 });
  cakes(alice, 100);
  assert.deepEqual(await buyFestival(ctx(), player(alice), { ware: 'title:witchwarden', rid: 'aaaaaaaaaaab' }, ON), { ware: 'title:witchwarden', cakes: 40, wares: ['title:witchwarden'] });
  assert.deepEqual(await buyFestival(ctx(), player(alice), { ware: 'title:witchwarden', rid: 'aaaaaaaaaaab' }, ON), { repeat: true, ware: 'title:witchwarden', cakes: 40, wares: ['title:witchwarden'] }, 'asked again: answered, nothing moved');
  assert.deepEqual(await buyFestival(ctx(), player(alice), { ware: 'title:witchwarden', rid: 'aaaaaaaaaaac' }, ON), { error: 'owned' });
  // a pack's ware is bought as often as the cakes go round
  assert.equal((await buyFestival(ctx(), player(alice), { ware: 'card:warlock', rid: 'aaaaaaaaaaad' }, ON)).cakes, 20);
  assert.equal((await buyFestival(ctx(), player(alice), { ware: 'card:warlock', rid: 'aaaaaaaaaaae' }, ON)).cakes, 0);
  assert.equal(row(alice.id).fest_wares, 'title:witchwarden');
  assert.equal(db._raw.prepare('SELECT COUNT(*) AS n FROM fest_sales WHERE account = ?').get(alice.id).n, 3);
  // the days over: a new sale is closed, a sale asked before it is still answered
  assert.deepEqual(await buyFestival(ctx(AFTER_S), player(alice), { ware: 'card:warlock', rid: 'aaaaaaaaaaaf' }, ON), { error: 'closed' });
  assert.equal((await buyFestival(ctx(AFTER_S), player(alice), { ware: 'card:warlock', rid: 'aaaaaaaaaaae' }, ON)).repeat, true);
});

test('WITCH1 THE HEARTH OFFERING: set out only at a home the character owns (never a hall), filled from the owner\'s cakes, taken from once a day by others, taken in with its cakes', async () => {
  const { alice, bob, player, ctx, cakes, home, row, db } = await stand();
  db._raw.prepare("INSERT INTO guilds (id, name, name_key, tag, ranks, founded_at) VALUES ('g1', 'The Coven', 'the coven', 'CVN', '[]', 1)").run();
  home(alice, MAP, HOME, CHAR);
  home(alice, MAP, HALL, CHAR, 'g1');
  const at = { mapId: MAP, buildingKey: HOME, character: CHAR };
  assert.deepEqual(await setOffering(ctx(), player(bob), at, ON), { error: 'home' }, 'not his home');
  assert.deepEqual(await setOffering(ctx(), player(alice), { ...at, buildingKey: HALL }, ON), { error: 'home' }, 'a guild hall is its guild\'s');
  assert.deepEqual(await setOffering(ctx(), player(alice), { ...at, character: 'char-other' }, ON), { error: 'home' }, 'another character\'s');
  assert.deepEqual(await setOffering(ctx(), player(alice), at, ON), { ok: true, stock: 0 });
  assert.deepEqual(await setOffering(ctx(), player(alice), at, ON), { error: 'set' });
  // the fill: OFFERING_FILL at most, from the owner's count
  assert.deepEqual(await fillOffering(ctx(), player(alice), at, ON), { error: 'cakes', cakes: 0 });
  cakes(alice, 14);
  assert.deepEqual(await fillOffering(ctx(), player(alice), at, ON), { stock: OFFERING_FILL, cakes: 4, moved: OFFERING_FILL });
  assert.deepEqual(await fillOffering(ctx(), player(alice), at, ON), { stock: 14, cakes: 0, moved: 4 });
  // a take: never one's own, once a day each
  const take = { mapId: MAP, buildingKey: HOME };
  assert.deepEqual(await takeFromOffering(ctx(), player(alice), take, ON), { error: 'own' });
  assert.deepEqual(await takeFromOffering(ctx(), player(bob), take, ON), { ok: true, cakes: 1, stock: 13 });
  assert.deepEqual(await takeFromOffering(ctx(), player(bob), take, ON), { error: 'taken' });
  assert.equal((await takeFromOffering(ctx(DAY_S + 86400), player(bob), take, ON)).stock, 12, 'a new day, another cake');
  assert.equal(row(alice.id).fest_given, 2);
  assert.equal(row(bob.id).fest_taken, 2);
  // the town: whose, its cakes, mine, taken today
  assert.deepEqual(await festivalTown(ctx(DAY_S + 86400), player(bob), { mapId: MAP }), { mapId: MAP, offerings: [{ buildingKey: HOME, stock: 12, owner: 'Alice', mine: false, taken: true }] });
  assert.deepEqual((await festivalTown(ctx(), player(alice), { mapId: MAP })).offerings[0].mine, true);
  // taken in after the festival: the bowl's cakes home
  assert.deepEqual(await takeInOffering(ctx(AFTER_S), player(alice), at, ON), { ok: true, returned: 12, cakes: 12 });
  assert.deepEqual(await takeInOffering(ctx(AFTER_S), player(alice), at, ON), { error: 'none' });
  assert.deepEqual(await setOffering(ctx(AFTER_S), player(alice), at, ON), { error: 'closed' });
});

test('WITCH1 a bowl holds OFFERING_STOCK_MAX; an empty bowl gives nothing; one taken in since is `none`', async () => {
  const { alice, bob, player, ctx, cakes, home, db } = await stand();
  home(alice, MAP, HOME, CHAR);
  const at = { mapId: MAP, buildingKey: HOME, character: CHAR };
  await setOffering(ctx(), player(alice), at, ON);
  assert.deepEqual(await takeFromOffering(ctx(), player(bob), { mapId: MAP, buildingKey: HOME }, ON), { error: 'empty' });
  db._raw.prepare('UPDATE fest_offerings SET stock = ?').run(OFFERING_STOCK_MAX);
  cakes(alice, 5);
  assert.deepEqual(await fillOffering(ctx(), player(alice), at, ON), { error: 'full' });
  await takeInOffering(ctx(), player(alice), at, ON);
  assert.deepEqual(await takeFromOffering(ctx(), player(bob), { mapId: MAP, buildingKey: HOME }, ON), { error: 'none' });
});

test('WITCH1 AN OFFERING OUTLIVES NO HOME: its home sold, it stands nowhere and its cakes go back to its account on its next read', async () => {
  const { alice, player, ctx, cakes, home, db } = await stand();
  home(alice, MAP, HOME, CHAR);
  const at = { mapId: MAP, buildingKey: HOME, character: CHAR };
  await setOffering(ctx(), player(alice), at, ON);
  cakes(alice, 9);
  await fillOffering(ctx(), player(alice), at, ON);
  assert.equal((await festivalOf(ctx(), player(alice), ON)).offerings.length, 1);
  db._raw.prepare('DELETE FROM homes WHERE map_id = ? AND building_key = ?').run(MAP, HOME);
  assert.deepEqual((await festivalTown(ctx(), player(alice), { mapId: MAP })).offerings, [], 'standing nowhere');
  const mine = await festivalOf(ctx(), player(alice), ON);
  assert.equal(mine.cakes, 9, 'its cakes came home');
  assert.deepEqual(mine.offerings, []);
  assert.equal(db._raw.prepare('SELECT COUNT(*) AS n FROM fest_offerings').get().n, 0);
});

test('WITCH1 THE WARDROBE: Witchwarden and Witchfire as bought, Hearthkeeper at HEARTHKEEPER_GIVEN given, the icons as bought and the Soul Cake at SOULCAKE_TAKEN taken', async () => {
  const { alice, player, db } = await stand();
  const p = () => player(alice);
  assert.ok(!titlesHeld(p(), ON).includes('witchwarden'));
  assert.deepEqual(iconsHeld(p()), []);
  db._raw.prepare("UPDATE players SET fest_wares = 'title:witchwarden aura:witchfire icon:twinmoons' WHERE id = ?").run(alice.id);
  assert.ok(titlesHeld(p(), ON).includes('witchwarden'));
  assert.ok(aurasHeld(p(), ON).includes('witchfire'));
  assert.deepEqual(iconsHeld(p()), ['twinmoons']);
  db._raw.prepare('UPDATE players SET fest_given = ?, fest_taken = ? WHERE id = ?').run(HEARTHKEEPER_GIVEN - 1, SOULCAKE_TAKEN - 1, alice.id);
  assert.ok(!titlesHeld(p(), ON).includes(HEARTHKEEPER_TITLE));
  assert.ok(!iconsHeld(p()).includes(SOULCAKE_ICON));
  db._raw.prepare('UPDATE players SET fest_given = ?, fest_taken = ? WHERE id = ?').run(HEARTHKEEPER_GIVEN, SOULCAKE_TAKEN, alice.id);
  assert.ok(titlesHeld(p(), ON).includes(HEARTHKEEPER_TITLE));
  assert.deepEqual(iconsHeld(p()), ['twinmoons', 'soulcake']);
  assert.equal(iconRefusal('tallowskull', p()), 'not-held');
  assert.equal(iconRefusal('nothing', p()), 'no-icon');
  assert.equal(iconRefusal(null, p()), null, 'the face is always allowed');
  assert.equal(iconWorn({ ...p(), icon: 'twinmoons' }), 'twinmoons');
  assert.equal(iconWorn({ ...p(), icon: 'tallowskull' }), undefined, 'an icon no longer held is not signed');
});

test('WITCH1 THROUGH THE WORKER: the festival\'s answers and their statuses, and the icon worn rides the token', async (t) => {
  t.after(() => mock.timers.reset());
  mock.timers.enable({ apis: ['Date'], now: DAY_S * 1000 });
  const { S, alice, db } = await stand();
  const mine = await S.call('/v1/festival/mine', {}, alice.secret);
  assert.equal(mine.status, 200);
  assert.equal(mine.body.open, true);
  assert.equal((await S.call('/v1/festival/buy', { ware: 'icon:twinmoons', rid: 'bbbbbbbbbbbb' }, alice.secret)).status, 400, 'cakes short');
  db._raw.prepare('UPDATE players SET fest_cakes = 40 WHERE id = ?').run(alice.id);
  assert.equal((await S.call('/v1/festival/buy', { ware: 'icon:twinmoons', rid: 'bbbbbbbbbbbc' }, alice.secret)).status, 200);
  const worn = await S.call('/v1/account/icon', { icon: 'twinmoons' }, alice.secret);
  assert.equal(worn.status, 200);
  assert.equal(worn.body.icon, 'twinmoons');
  assert.ok(worn.body.icons.includes('twinmoons'));
  assert.equal((await S.call('/v1/account/icon', { icon: 'tallowskull' }, alice.secret)).status, 403, 'not held');
  const g = await S.guest();
  assert.equal((await S.call('/v1/festival/find', { source: 'foe' }, g.secret)).status, 403);
});
