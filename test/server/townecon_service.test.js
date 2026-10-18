import '../chargenDom.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { standService, T0 } from '../accountDb.mjs';
import { seatRealm } from '../realmSeat.mjs';
import { mintWatchReceipt } from '../../src/net/watchReceipt.js';
import { mintRaidReceipt } from '../../src/net/raid/raidReceipt.js';
import { WITNESS } from '../../src/net/nodeLaw.js';
import { validLootList, generateRandomLoot, LOOT_MATRICES } from '../../src/systems/loot/loot.js';
import { ARROW_TEMPLATE } from '../../src/systems/inventory.js';
import { seededRng } from '../../src/systems/wind/wind.js';
import { itemWorth } from '../../src/systems/item/itemLaw.js';
import { patronCap, patronWorth } from '../../src/net/patronLaw.js';
import {
  TOWN_ECON_CAPS, TOWN_ECON_DAYS, TOWN_ECON_KEPT_S, TOWN_WATCH_CLAIM_MAX, TOWN_WITNESS_HOUR, townActivity, townPlayersShare, townShareShown,
} from '../../src/net/townEconLaw.js';
import { HOUR_JOBS, runCron, CRON_HOUR } from '../../server-account/src/cron.js';

// TOWN-ECON TE2 (2026-10-18, bible/06-Systems/Town-Economy-Arc.md section 4): the account service's half of the players'
// share - the town registry, the four witnessed sources (footsteps, a trader's sale, a patron's, a raid driven off),
// each account capped a town a day, the read and the sweep.

const { subtle } = globalThis.crypto;
let _now = T0;
const realNow = Date.now;
Date.now = () => _now * 1000;
test.after(() => { Date.now = realNow; });
const DAY = 86_400;
const today = () => Math.floor(_now / DAY);
let _rid = 0;
const rid = () => `te2-${String(++_rid).padStart(6, '0')}`;
const DF = 17, WR = 23;
const HUBS = { [DF]: [207, 212], [WR]: [590, 166] };
const MAP = 1001, KEY = 4242, PIECE = 'trader1';
const VENDOR = { map: MAP, id: PIECE };
/** Daggerfall's own town as a client reports it: its map id, pixel, region and location index. */
const TOWN = Object.freeze({ map: MAP, px: 207, py: 212, region: DF, location: 5 });
const plain = (it) => JSON.parse(JSON.stringify(it));
const place = (station = null) => JSON.stringify({ pos: [1, 0, 1], rot: [0, 0, 0], scale: 1, light: null, storage: false, paid: 0, ...(station ? { station } : {}) });
const rd = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

/** Pieces to sell - weapons off the loot tables, each one the loot law stands behind. */
function goods(n = 8) {
  const out = [];
  for (let seed = 1; out.length < n && seed < 300; seed++) {
    const items = generateRandomLoot({ ...LOOT_MATRICES['-'], MinGold: 5, MaxGold: 5, WP: 100, AM: 100 }, { level: 10, gender: 'male' }, seededRng(seed));
    for (const it of items) if (it.group === 'Weapons' && it.templateIndex !== ARROW_TEMPLATE && validLootList([plain(it)])?.[0]) out.push(it);
  }
  return out.slice(0, n);
}

async function stand() {
  const s = await standService({ PROFESSIONS_OPEN: 'on', MARKS_OPEN: 'on', BOARD_OPEN: 'on' });
  const raw = s.env.DB._raw;
  /** A registered account a week old - a witness (nodeLaw.js WITNESS.ageS). */
  const aged = async (handle) => {
    const who = await s.registered(handle);
    raw.prepare('UPDATE players SET registered_at = ? WHERE id = ?').run(_now - WITNESS.ageS - DAY, who.id);
    return who;
  };
  const seated = async (handle, save = {}, { old = true } = {}) => {
    const who = await s.registered(handle);
    const R = await seatRealm(s.env, who.secret, handle, { name: handle, level: 5, items: [], goldPieces: 0, ...save });
    who.character = R.id; who.at = R.at;
    if (old) raw.prepare('UPDATE players SET registered_at = ? WHERE id = ?').run(_now - WITNESS.ageS - DAY, who.id);
    return who;
  };
  const witness = (who, town = TOWN) => s.call('/v1/towns/witness', { town }, who.secret);
  const confirm = async (town = TOWN) => { for (const h of ['Wita', 'Witb', 'Witc']) await witness(await aged(`${h}${town.map}`), town); };
  const tick = (who, x = TOWN.px, y = TOWN.py, c = 1) => mintWatchReceipt({ s: who.id, x, y, c }, s.gateKey, { subtle, nowS: _now });
  const watch = (who, receipts) => s.call('/v1/towns/watch', { receipts }, who.secret);
  const econ = (who) => s.call('/v1/towns/econ', {}, who.secret);
  const acts = (who) => raw.prepare('SELECT map, day, src, n FROM town_econ_acts WHERE account = ? ORDER BY src').all(who.id).map((r) => ({ ...r }));
  const days = () => raw.prepare('SELECT map, day, src, n FROM town_econ_days ORDER BY map, day, src').all().map((r) => ({ ...r }));
  const record = (who) => {
    const row = raw.prepare('SELECT obj, seq FROM realm_characters WHERE id = ?').get(who.character);
    return { seq: Number(row.seq), save: JSON.parse(new TextDecoder().decode(s.env.SAVES._map.get(row.obj))) };
  };
  /** A home of `who`'s in Daggerfall with a trader. */
  const home = (who) => {
    raw.prepare(`INSERT INTO homes (map_id, building_key, player, char_id, owner_name, region, entry, price, bought_at) VALUES (?, ?, ?, ?, ?, ?, 'public', 1000, ?)`)
      .run(MAP, KEY, who.id, who.character, who.handle, DF, _now);
    raw.prepare(`INSERT INTO home_decor (map_id, building_key, id, model, flat_archive, flat_record, place, placed_at, item, paid, yard)
      VALUES (?, ?, ?, NULL, 182, 3, ?, ?, NULL, 0, 0)`).run(MAP, KEY, PIECE, place('vendor'), _now);
  };
  const list = (who, price = 50, vendor = VENDOR) => s.call('/v1/market/list', {
    character: who.character, region: WR, kind: 'item', item: validLootList([record(who).save.items[0]])?.[0] ?? null, pick: 0, price, hubs: HUBS, rid: rid(),
    currency: 'gold', realm: who.at(), ...(vendor ? { vendor } : {}),
  }, who.secret);
  const buy = (who, l) => s.call('/v1/market/buy', {
    character: who.character, region: DF, listing: l.id, units: 1, max: l.price, hubs: HUBS, rid: rid(), realm: who.at(), vendor: VENDOR,
  }, who.secret);
  return { ...s, raw, aged, seated, witness, confirm, tick, watch, econ, acts, days, record, home, list, buy };
}

test('TOWN-ECON TE2 the town registry (POST /v1/towns/witness): a town is the clients\' word, agreed - three accounts a week registered giving the same report confirm it, and a confirmed town takes no more; a guest is refused, a young account not counted, a bad report refused, the hour\'s reports bounded; a second town at a confirmed pixel never stands (mutants: TOWNECON2-witness-young, TOWNECON2-witness-known, TOWNECON2-confirm-early)', async () => {
  _now = T0;
  const s = await stand();
  const guest = await s.guest();
  assert.equal((await s.witness(guest)).body.error, 'towns-need-account');
  const young = await s.registered('Yoon');
  assert.deepEqual((await s.witness(young)).body, { ok: true, counted: false, why: 'young' });
  const a = await s.aged('Ada'), b = await s.aged('Bel'), c = await s.aged('Cyr'), d = await s.aged('Dov');
  assert.equal((await s.witness(a, { ...TOWN, px: 1000 })).body.error, 'bad-town');
  assert.equal((await s.witness(a, { ...TOWN, map: 0 })).body.error, 'bad-town');
  assert.deepEqual((await s.witness(a)).body, { ok: true, counted: true, confirmed: false });
  assert.deepEqual((await s.witness(b, { ...TOWN, location: 6 })).body, { ok: true, counted: true, confirmed: false }, 'a dissent');
  assert.deepEqual((await s.witness(b)).body, { ok: true, counted: true, confirmed: false }, 'an account\'s first answer stands');
  assert.deepEqual((await s.witness(c)).body, { ok: true, counted: true, confirmed: false }, 'two agree');
  assert.deepEqual(s.raw.prepare('SELECT * FROM town_econ_towns').all(), []);
  assert.deepEqual((await s.witness(d)).body, { ok: true, counted: true, confirmed: true }, 'three');
  assert.deepEqual({ ...s.raw.prepare('SELECT map, px, py, region, location FROM town_econ_towns').get() }, { ...TOWN });
  assert.deepEqual((await s.witness(await s.aged('Eve'))).body, { ok: true, counted: false, why: 'known' }, 'confirmed: no more reports');
  // another map id at the confirmed pixel never stands - the first confirmed holds the pixel
  const other = { ...TOWN, map: 1002 };
  for (const h of ['Fen', 'Gus', 'Hal']) await s.witness(await s.aged(h), other);
  assert.equal(s.raw.prepare('SELECT COUNT(*) AS n FROM town_econ_towns').get().n, 1);
  // the hour's reports
  const r = await s.aged('Ivo');
  for (let i = 0; i < TOWN_WITNESS_HOUR; i++) await s.witness(r, { ...TOWN, map: 5000 + i, px: i, py: 1, location: 100 + i });
  assert.equal((await s.witness(r, { ...TOWN, map: 9000, px: 900 })).body.error, 'towns-rate');
});

test('TOWN-ECON TE2 footsteps (POST /v1/towns/watch): the relay\'s signed Watch ticks, claimed by the account they name, count at the confirmed town of their pixel on their own day - once each, at most TOWN_ECON_CAPS.watch a town a day; another\'s tick, an unsigned one, one at no confirmed town, a young account\'s and a claim too large count nothing (mutants: TOWNECON2-watch-cap, TOWNECON2-watch-seen, TOWNECON2-watch-yours, TOWNECON2-watch-young, TOWNECON2-days-uncounted)', async () => {
  _now = T0;
  const s = await stand();
  const w = await s.aged('Walker'), other = await s.aged('Other');
  assert.deepEqual((await s.watch(w, [await s.tick(w)])).body, { ok: true, counted: 0, why: { 'no-town': 1 } }, 'no town confirmed there yet');
  await s.confirm();
  assert.equal((await s.watch(w, [])).body.error, 'bad-watch');
  assert.equal((await s.watch(w, Array.from({ length: TOWN_WATCH_CLAIM_MAX + 1 }, () => 'k1.x.y'))).body.error, 'bad-watch');
  const r1 = await s.tick(w, TOWN.px, TOWN.py, 1);
  assert.deepEqual((await s.watch(w, [r1])).body, { ok: true, counted: 1, why: {} });
  assert.deepEqual((await s.watch(w, [r1])).body, { ok: true, counted: 0, why: { capped: 1 } }, 'once each');
  assert.deepEqual((await s.watch(w, [await s.tick(other)])).body.why, { 'not-yours': 1 });
  assert.equal((await s.watch(w, [(await s.tick(w)).replace(/\.[^.]+$/, '.')])).body.counted, 0, 'unsigned');
  assert.deepEqual((await s.watch(w, [await s.tick(w, 500, 100)])).body.why, { 'no-town': 1 });
  const young = await s.registered('Newcomer');
  assert.deepEqual((await s.watch(young, [await s.tick(young)])).body, { ok: true, counted: 0, why: { young: 1 } });
  // the day's cap: the walker's 2..40 - twelve a claim
  let counted = 1;
  for (let c = 2; c <= 40; c += TOWN_WATCH_CLAIM_MAX) {
    const batch = [];
    for (let k = c; k < Math.min(41, c + TOWN_WATCH_CLAIM_MAX); k++) batch.push(await s.tick(w, TOWN.px, TOWN.py, k));
    counted += (await s.watch(w, batch)).body.counted;
  }
  assert.equal(counted, TOWN_ECON_CAPS.watch, 'an hour\'s walking a town a day');
  assert.deepEqual(s.acts(w), [{ map: MAP, day: today(), src: 'watch', n: TOWN_ECON_CAPS.watch }]);
  assert.deepEqual(s.days(), [{ map: MAP, day: today(), src: 'watch', n: TOWN_ECON_CAPS.watch }], 'the town\'s day counts what the account\'s did');
  // the next day is another day's cap
  _now += DAY;
  assert.equal((await s.watch(w, [await s.tick(w, TOWN.px, TOWN.py, 99)])).body.counted, 1);
  assert.equal(s.days().length, 2);
});

test('TOWN-ECON TE2 the read (POST /v1/towns/econ): every town whose players\' share is one or more, one decimal, by the law over the days kept - kept by the isolate TOWN_ECON_KEPT_S; any session reads it (mutants: TOWNECON2-read-unkept, TOWNECON2-read-least)', async () => {
  _now = T0;
  const s = await stand();
  const g = await s.guest();
  assert.deepEqual((await s.econ(g)).body, { ok: true, towns: [] });
  const t = today();
  s.raw.prepare('INSERT INTO town_econ_days (map, day, src, n) VALUES (?, ?, ?, ?)').run(MAP, t, 'watch', 60);
  s.raw.prepare('INSERT INTO town_econ_days (map, day, src, n) VALUES (?, ?, ?, ?)').run(MAP, t - 2, 'trade', 10);
  s.raw.prepare('INSERT INTO town_econ_days (map, day, src, n) VALUES (?, ?, ?, ?)').run(MAP, t - TOWN_ECON_DAYS, 'raid', 9);   // past the days kept
  s.raw.prepare('INSERT INTO town_econ_days (map, day, src, n) VALUES (?, ?, ?, ?)').run(2002, t, 'watch', 2);   // a share under one
  _now += TOWN_ECON_KEPT_S;
  const r = (await s.econ(g)).body;
  const share = townShareShown(townPlayersShare(townActivity([{ day: t, src: 'watch', n: 60 }, { day: t - 2, src: 'trade', n: 10 }], t)));
  assert.ok(share > 10 && share < 20, `${share}`);
  assert.deepEqual(r, { ok: true, towns: [[MAP, share]] }, 'the law\'s share; the old day and the small town left out');
  s.raw.prepare('INSERT INTO town_econ_days (map, day, src, n) VALUES (?, ?, ?, ?)').run(3003, t, 'raid', 30);
  assert.deepEqual((await s.econ(g)).body.towns.map(([m]) => m), [MAP], 'kept');
  _now += TOWN_ECON_KEPT_S;
  assert.deepEqual((await s.econ(g)).body.towns.map(([m]) => m), [MAP, 3003], 'read again past the keeping');
});

test('TOWN-ECON TE2 trade: a sale at a trader counts at its town for its buyer, under the day\'s cap; a buyer under a week registered, and a sale on a board, count nothing; a patron\'s purchase counts for the trader\'s seller (mutants: TOWNECON2-trade-gold, TOWNECON2-trade-young, TOWNECON2-patron)', async () => {
  _now = T0;
  const s = await stand();
  const eve = await s.seated('Eve', { items: goods(3).map(plain) });
  const tom = await s.seated('Tom', { goldPieces: 1000 });
  const kid = await s.seated('Kid', { goldPieces: 1000 }, { old: false });
  s.home(eve);
  const sell = async () => { const l = await s.list(eve); assert.equal(l.status, 200, JSON.stringify(l.body)); return (await s.call('/v1/market/vendor', { vendor: VENDOR }, tom.secret)).body.rows.at(-1); };
  const b1 = await s.buy(tom, await sell());
  assert.equal(b1.status, 200, JSON.stringify(b1.body));
  assert.deepEqual(s.acts(tom), [{ map: MAP, day: today(), src: 'trade', n: 1 }], 'the buyer\'s act at the trader\'s town');
  assert.deepEqual(s.days(), [{ map: MAP, day: today(), src: 'trade', n: 1 }]);
  assert.equal((await s.buy(kid, await sell())).status, 200);
  assert.deepEqual(s.acts(kid), [], 'a young buyer counts nothing');
  // the cap, by the table's own guard
  s.raw.prepare('UPDATE town_econ_acts SET n = ? WHERE account = ?').run(TOWN_ECON_CAPS.trade, tom.id);
  assert.equal((await s.buy(tom, await sell())).status, 200);
  assert.deepEqual(s.acts(tom)[0].n, TOWN_ECON_CAPS.trade);
  assert.deepEqual(s.days(), [{ map: MAP, day: today(), src: 'trade', n: 1 }], 'a capped act moves no day');
  // both currencies' batches carry it, and the patron's
  const m = rd('server-account/src/market.js');
  assert.equal((m.match(/\.\.\.tradeActStatements\(db, player, nowS, vend\?\.map \?\? null, 'EXISTS \(SELECT 1 FROM market_sales WHERE buyer = \?6 AND rid = \?7 AND n = \?8\)', \[me, rid, nonce\]\)/g) ?? []).length, 2);
  assert.match(m, /\.\.\.patronActStatements\(db, l\.seller, map, day\),/);
});

test('TOWN-ECON TE2 a patron\'s purchase counts at its town for the trader\'s seller, on the hour\'s own day (mutants: TOWNECON2-patron)', async () => {
  _now = T0;
  const s = await stand();
  const eve = await s.seated('Eve', { items: goods(8).map(plain) });
  s.home(eve);
  for (let i = 0; i < 8; i++) {
    const item = s.record(eve).save.items[0];
    const price = Math.max(1, Math.floor(patronCap(patronWorth(item, itemWorth)) * 0.45));
    const r = await s.call('/v1/market/list', { character: eve.character, region: DF, kind: 'item', item: validLootList([item])?.[0] ?? null, pick: 0, price, hubs: HUBS, rid: rid(), currency: 'gold', realm: eve.at(), vendor: VENDOR }, eve.secret);
    assert.equal(r.status, 200, JSON.stringify(r.body));
  }
  _now = T0 + 40 * 3600;
  assert.equal((await s.call('/v1/market/vendor', { vendor: VENDOR }, eve.secret)).status, 200);
  const sales = s.raw.prepare('SELECT day, COUNT(*) AS n FROM market_patron_sales GROUP BY day ORDER BY day').all();
  assert.ok(sales.length >= 1, 'the patrons bought');
  const want = sales.map((r) => ({ map: MAP, day: Number(r.day), src: 'trade', n: Math.min(TOWN_ECON_CAPS.trade, Number(r.n)) }));
  assert.deepEqual(s.raw.prepare('SELECT map, day, src, n FROM town_econ_acts WHERE account = ? ORDER BY day').all(eve.id).map((r) => ({ ...r })), want);
});

test('TOWN-ECON TE2 a raid driven off counts at the confirmed town its key names, for the account that claims it - one a town a day, a young account none, a town not confirmed none (mutants: TOWNECON2-raid, TOWNECON2-raid-young, TOWNECON2-raid-cap)', async () => {
  _now = T0;
  const s = await stand();
  const hero = await s.seated('Hero');
  const raid = async (who, key) => s.call('/v1/raid/claim', {
    receipt: await mintRaidReceipt({ w: key, s: who.id, c: 777, y: 2 }, s.gateKey, { subtle, nowS: _now }), character: who.character, name: who.handle,
  }, who.secret);
  const r0 = await raid(hero, `${DF}:${TOWN.location}:1000`);
  assert.equal(r0.status, 200, JSON.stringify(r0.body));
  assert.deepEqual(s.acts(hero), [], 'no town confirmed at that place');
  await s.confirm();
  assert.equal((await raid(hero, `${DF}:${TOWN.location}:1001`)).body.recorded, true);
  assert.deepEqual(s.acts(hero), [{ map: MAP, day: today(), src: 'raid', n: 1 }]);
  assert.deepEqual(s.days(), [{ map: MAP, day: today(), src: 'raid', n: 1 }]);
  assert.equal((await raid(hero, `${DF}:${TOWN.location}:1002`)).body.recorded, true);
  assert.deepEqual(s.days(), [{ map: MAP, day: today(), src: 'raid', n: TOWN_ECON_CAPS.raid }], 'one a town a day');
  const kid = await s.seated('Kid', {}, { old: false });
  assert.equal((await raid(kid, `${DF}:${TOWN.location}:1003`)).body.recorded, true);
  assert.deepEqual(s.acts(kid), [], 'a young account none');
});

test('TOWN-ECON TE2 the sweep: a town\'s days, its accounts\' acts and the ticks seen go once past the days the share weighs, in the hourly clock (mutants: TOWNECON2-sweep-days)', async () => {
  _now = T0;
  const s = await stand();
  const w = await s.aged('Walker');
  const t = today();
  for (const d of [t, t - TOWN_ECON_DAYS + 1, t - TOWN_ECON_DAYS]) {
    s.raw.prepare('INSERT INTO town_econ_days (map, day, src, n) VALUES (?, ?, ?, 1)').run(MAP, d, 'watch');
    s.raw.prepare('INSERT INTO town_econ_acts (account, map, day, src, n) VALUES (?, ?, ?, ?, 1)').run(w.id, MAP, d, 'watch');
    s.raw.prepare('INSERT INTO town_econ_seen (ref, day) VALUES (?, ?)').run(`r${d}`, d);
  }
  assert.ok(HOUR_JOBS.some(([name]) => name === 'town-econ'));
  await runCron(s.env, { cron: CRON_HOUR, nowS: _now });
  for (const table of ['town_econ_days', 'town_econ_acts', 'town_econ_seen']) {
    assert.deepEqual(s.raw.prepare(`SELECT day FROM ${table} ORDER BY day`).all().map((r) => r.day), [t - TOWN_ECON_DAYS + 1, t], table);
  }
});
