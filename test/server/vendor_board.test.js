// VENDOR-BOARD (2026-10-19, the account database overloaded again: the region's traders the read most asked again in the
// 18:05 overload; bible/11-Multiplayer/Scale-Arc.md VENDOR-BOARD; migration 0135) - A REGION'S TRADERS READ AS ONE ROW:
// the board every caller reads alike is kept in `market_vendor_boards` at a version the database moves on every trader
// listing, trader, trader's house and patron sale written, until its first listing runs out; the caller's own door (its
// own house, its guild's, a room it rents) is read off its own rows.
//
// The proof is an oracle: the board's two statements as they stood before this slice (their text kept here, its caller's
// door asked in SQL of every row), against the service's answer, through listings put up, bought, cancelled and run
// out, traders made and moved off their station, houses changing hands, doors, guilds and regions, houses released,
// guilds joined and left, rooms rented and patrons' sales - every caller of every region, each read kept or not.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

import { d1, T0 } from '../accountDb.mjs';
import { marketVendors, vendorBoard, vendorBoardOf, VENDOR_BOARD_READ, VENDOR_BOARD_MAX_CHARS, VENDOR_BOARD_KEPT_S, PATRON_TOLD_S, PATRON_TOLD_SQL } from '../../server-account/src/market.js';
import { VENDOR_STATION, VENDOR_BOARD_SHOWN } from '../../src/net/vendorLaw.js';

const src = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const lcg = (seed) => { let x = seed % 2147483647 || 1; return () => (x = (x * 48271) % 2147483647) / 2147483647; };
const ENV = { PROFESSIONS_OPEN: 'on', MARKS_OPEN: 'on', BOARD_OPEN: 'on' };
const REGIONS = [17, 23];
const PEOPLE = ['p-ana', 'p-bo', 'p-cy', 'p-di'];
const CHARS = (p) => [`${p}-c1`, `${p}-c2`];
const place = (station) => JSON.stringify({ pos: [1, 0, 1], rot: [0, 0, 0], scale: 1, light: null, storage: false, paid: 0, ...(station ? { station } : {}) });
const ITEM = JSON.stringify({ t: 1, n: 'Iron Longsword' });

/** THE ORACLE: the board as it was read before VENDOR-BOARD - its two statements with the caller's door asked of every
 *  row (market.js marketVendors at the merge base), and the region's patron sales of the day. */
async function before(db, player, region, me, nowS) {
  const columns = `l.*, d.map_id AS v_map, d.id AS v_id, h.building_key AS v_key, h.owner_name AS v_owner, h.player AS v_player,
      h.entry AS v_entry, (h.player = ?3 AND h.char_id = ?4) AS v_mine,
      (h.entry = 'guild' AND EXISTS (SELECT 1 FROM guild_members a JOIN guild_members b ON b.guild_id = a.guild_id
        WHERE a.player = h.player AND a.char_id = h.char_id AND b.player = ?3 AND b.char_id = ?4)) AS v_guildmate,
      (SELECT MAX(r.until) FROM home_rooms r WHERE r.map_id = h.map_id AND r.building_key = h.building_key AND r.tenant = ?3 AND r.tenant_char = ?4 AND r.until > ?1) AS v_tenancy`;
  const HOME = `h.entry = 'public' AND h.player = l.seller AND d.yard = 0 AND h.guild_id IS NULL
  AND json_extract(d.place, '$.station') = '${VENDOR_STATION}'`;
  const { results: newest = [] } = await db.prepare(`SELECT ${columns}
    FROM market_listings l JOIN home_decor d ON d.map_id = l.vendor_map AND d.id = l.vendor_id
    JOIN homes h ON h.map_id = d.map_id AND h.building_key = d.building_key
    WHERE l.state = 'open' AND l.expires_at > ?1 AND l.vendor_id IS NOT NULL AND l.region = ?2 AND h.region = ?2 AND h.player = l.seller AND d.yard = 0
      AND h.guild_id IS NULL AND json_extract(d.place, '$.station') = '${VENDOR_STATION}'
    ORDER BY l.at DESC LIMIT ${VENDOR_BOARD_SHOWN}`).bind(nowS, region, player.id, me).all();
  const { results: houses = [] } = await db.prepare(`SELECT * FROM (SELECT ${columns},
      ROW_NUMBER() OVER (PARTITION BY d.map_id, d.building_key, d.id ORDER BY l.at DESC, l.id) AS v_rank
    FROM market_listings l JOIN home_decor d ON d.map_id = l.vendor_map AND d.id = l.vendor_id
  JOIN homes h ON h.map_id = d.map_id AND h.building_key = d.building_key WHERE l.state = 'open' AND l.vendor_id IS NOT NULL AND l.currency = 'gold' AND l.kind = 'item' AND ${HOME} AND l.expires_at > ?1 AND l.region = ?2 AND h.region = ?2) WHERE v_rank = 1
    ORDER BY at DESC LIMIT ${VENDOR_BOARD_SHOWN}`).bind(nowS, region, player.id, me).all();
  const traderOf = (l) => `${l.v_map}:${l.v_key}:${l.v_id}`;
  const shown = new Set(newest.map(traderOf));
  const results = [...newest, ...houses.filter((l) => !shown.has(traderOf(l)))];
  const { results: patrons = [] } = await db.prepare(PATRON_TOLD_SQL('s.region = ?2')).bind(nowS - PATRON_TOLD_S, region).all();
  return {
    patrons: patrons.map((r) => [r.listing, Number(r.at)]),
    rows: results.map((l) => [l.id, Number(l.v_map), Number(l.v_key), l.v_id, l.v_owner, {
      owner: l.v_owner, entry: l.v_entry, mine: Number(l.v_mine) === 1,
      ...(Number(l.v_guildmate) === 1 ? { guildmate: true } : {}), ...(Number.isSafeInteger(l.v_tenancy) && l.v_tenancy > nowS ? { tenant: Number(l.v_tenancy) } : {}) }]),
  };
}
const after = (a) => ({ patrons: a.patrons.map((p) => [p.listing, p.at]), rows: a.rows.map((r) => [r.id, r.map, r.buildingKey, r.vendor.id, r.owner, r.home]) });

/** A world: four people with two characters each, two guilds, houses in both regions with traders and chairs. */
function world() {
  const db = d1();
  const raw = db._raw;
  for (const p of PEOPLE) raw.prepare('INSERT INTO players (id, guest_name, handle, created_at, last_seen, registered_at) VALUES (?, ?, ?, 0, 0, 0)').run(p, p, p.slice(2));
  for (const g of [1, 2]) raw.prepare("INSERT INTO guilds (id, name, name_key, tag, ranks, founded_at) VALUES (?, ?, ?, ?, '[]', 0)").run(`g${g}`, `Guild${g}`, `guild${g}`, `G${g}`);
  return { db, raw };
}
const put = (raw, s, r) => {
  const pick = (a) => a[Math.floor(r() * a.length)];
  return {
    pick,
    home(map, key) {
      const owner = pick(PEOPLE);
      raw.prepare("INSERT OR REPLACE INTO homes (map_id, building_key, player, char_id, owner_name, region, entry, price, bought_at, guild_id) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?)")
        .run(map, key, owner, pick(CHARS(owner)), owner.slice(2), pick(REGIONS), pick(['public', 'public', 'guild', 'private']), r() < 0.15 ? 'g1' : null);
      raw.prepare('INSERT OR IGNORE INTO home_decor (map_id, building_key, id, model, place, placed_at, paid, yard) VALUES (?, ?, ?, 41000, ?, 1, 0, 0)').run(map, key, `t${key}`, place(VENDOR_STATION));
      raw.prepare('INSERT OR IGNORE INTO home_decor (map_id, building_key, id, model, place, placed_at, paid, yard) VALUES (?, ?, ?, 41000, ?, 1, 0, 0)').run(map, key, `chair${key}`, place(null));
    },
    listing(id, nowS) {
      const h = raw.prepare('SELECT * FROM homes ORDER BY map_id, building_key LIMIT 1 OFFSET ?').get(Math.floor(r() * 6));
      if (!h) return;
      const seller = r() < 0.85 ? h.player : pick(PEOPLE);
      const item = r() < 0.9;   // a pack's piece for gold, else a material for Marks (the market's own CHECK)
      raw.prepare(`INSERT INTO market_listings (id, seller, char_id, region, kind, material, units, own, bought, price, fee, at, expires_at, state, rid, n, currency, item, vendor_map, vendor_id)
        VALUES (?, ?, ?, ?, ?, ?, 1, 1, 0, ?, 1, ?, ?, 'open', ?, 'n', ?, ?, ?, ?)`).run(id, seller, pick(CHARS(seller)), r() < 0.9 ? h.region : pick(REGIONS), item ? 'item' : 'material', item ? null : 'iron',
        10 + Math.floor(r() * 90), nowS - Math.floor(r() * 50), nowS + 5 + Math.floor(r() * 120), `rid-${id}`, item ? 'gold' : 'marks', item ? ITEM : null, h.map_id, r() < 0.9 ? `t${h.building_key}` : `chair${h.building_key}`);
    },
  };
};

test('VENDOR-BOARD the oracle: through listings put up, bought, cancelled and run out, traders made and moved off their station, houses changing hands, doors, guilds and regions, houses released, guilds joined and left, rooms rented and patrons\' sales, every caller\'s board is the board the two statements read, kept or read again (mutants: each write that moves a board unmoved, a run-out board kept, a patron\'s sale kept past its day, the caller\'s door)', async () => {
  for (let seed = 1; seed <= 12; seed++) {
    const { db, raw } = world();
    const r = lcg(seed * 15485863);
    const w = put(raw, seed, r);
    let nowS = T0, ids = 0;
    for (let k = 0; k < 6; k++) w.home(1000 + (k % 3), 300 + k);
    for (let i = 0; i < 25; i++) w.listing(`L${ids++}`, nowS);
    for (let op = 0; op < 70; op++) {
      const x = r();
      if (x < 0.2) w.listing(`L${ids++}`, nowS);
      else if (x < 0.32) raw.prepare("UPDATE market_listings SET state = ? WHERE id = ?").run(w.pick(['sold', 'cancelled']), `L${Math.floor(r() * ids)}`);
      else if (x < 0.42) nowS += Math.floor(r() * 40);   // listings run out
      else if (x < 0.45) raw.prepare('UPDATE home_decor SET place = ? WHERE id = ?').run(place(r() < 0.5 ? VENDOR_STATION : null), `t${300 + Math.floor(r() * 6)}`);
      else if (x < 0.48) raw.prepare('UPDATE market_listings SET region = ? WHERE id = ?').run(w.pick(REGIONS), `L${Math.floor(r() * ids)}`);   // no route moves one; the database's law holds if one does
      else if (x < 0.58) {
        const h = raw.prepare('SELECT map_id, building_key FROM homes ORDER BY building_key LIMIT 1 OFFSET ?').get(Math.floor(r() * 6));
        if (h) {
          const col = w.pick(['entry', 'guild_id', 'region', 'player', 'owner_name']);
          const val = col === 'entry' ? w.pick(['public', 'guild', 'private']) : col === 'guild_id' ? (r() < 0.5 ? null : 'g2') : col === 'region' ? w.pick(REGIONS) : col === 'player' ? w.pick(PEOPLE) : `Name${op}`;
          try { raw.prepare(`UPDATE homes SET ${col} = ? WHERE map_id = ? AND building_key = ?`).run(val, h.map_id, h.building_key); } catch { /* a player change a key forbids */ }
        }
      } else if (x < 0.62) {
        raw.prepare('DELETE FROM homes WHERE building_key = ?').run(300 + Math.floor(r() * 6));
        w.home(1000 + Math.floor(r() * 3), 300 + Math.floor(r() * 6));
      } else if (x < 0.72) {
        const p = w.pick(PEOPLE);
        raw.prepare('INSERT OR REPLACE INTO guild_members (player, char_id, guild_id, rank, name, joined_at) VALUES (?, ?, ?, 0, ?, 0)').run(p, w.pick(CHARS(p)), w.pick(['g1', 'g2']), p);
      } else if (x < 0.76) raw.prepare('DELETE FROM guild_members WHERE player = ?').run(w.pick(PEOPLE));
      else if (x < 0.84) {
        const h = raw.prepare('SELECT map_id, building_key FROM homes ORDER BY building_key LIMIT 1 OFFSET ?').get(Math.floor(r() * 6));
        const p = w.pick(PEOPLE);
        if (h) raw.prepare('INSERT OR REPLACE INTO home_rooms (map_id, building_key, room, anchor, price, tenant, tenant_char, until) VALUES (?, ?, ?, 1, 1, ?, ?, ?)')
          .run(h.map_id, h.building_key, Math.floor(r() * 2), p, w.pick(CHARS(p)), nowS + Math.floor(r() * 60) - 20);
      } else {
        const l = raw.prepare("SELECT * FROM market_listings WHERE vendor_id IS NOT NULL ORDER BY id LIMIT 1 OFFSET ?").get(Math.floor(r() * ids));
        if (l) raw.prepare(`INSERT OR IGNORE INTO market_patron_sales (listing, map, hour, minute, seed, seller, char_id, region, price, tax, fee, gets, at, day, building_key)
          VALUES (?, ?, 1, 2, 3, ?, ?, ?, ?, 0, 0, ?, ?, 1, 300)`).run(l.id, l.vendor_map, l.seller, l.char_id, l.region, l.price, l.price, nowS - Math.floor(r() * 2 * PATRON_TOLD_S));
      }
      if (r() < 0.25) nowS += Math.floor(r() * PATRON_TOLD_S / 4);   // the patrons' day passing
      for (const region of REGIONS) {
        const p = w.pick(PEOPLE), me = r() < 0.15 ? null : w.pick(CHARS(p));
        const player = { id: p, handle: p.slice(2), registered_at: 0 };
        const got = await marketVendors({ db, nowS }, player, ENV, { region, character: me });
        assert.equal(got.ok, true, JSON.stringify(got));
        assert.deepEqual(after(got), await before(db, player, region, me ?? '', nowS), `seed ${seed} op ${op} region ${region}`);
      }
    }
  }
});

test('VENDOR-BOARD a kept board is one statement and the caller\'s own two rows; a write moves it, and the next caller reads it again and keeps it; a board whose first listing has run out is read again; a version moved while it was read is not kept (mutants: the version unread, the run-out unread, the keep unguarded)', async () => {
  const { db, raw } = world();
  const r = lcg(7);
  const w = put(raw, 0, r);
  for (let k = 0; k < 6; k++) w.home(1000 + (k % 3), 300 + k);
  raw.prepare('UPDATE homes SET region = 17, entry = \'public\', guild_id = NULL').run();
  for (let i = 0; i < 20; i++) w.listing(`L${i}`, T0);
  const asked = [];
  const counted = Object.create(db);
  counted.prepare = (sql) => { asked.push(sql); return db.prepare(sql); };
  counted.batch = (list) => { asked.push(`BATCH(${list.length})`); return db.batch(list); };
  const player = { id: 'p-ana', handle: 'ana', registered_at: 0 };
  await marketVendors({ db: counted, nowS: T0 }, player, ENV, { region: 17, character: 'p-ana-c1' });
  assert.ok(asked.some((s) => s.startsWith('INSERT OR IGNORE INTO market_vendor_boards')), 'the region\'s first read makes its row');
  const row = () => raw.prepare('SELECT ver, built, until FROM market_vendor_boards WHERE region = 17').get();
  assert.equal(row().built, row().ver, 'and keeps the board');
  const next = raw.prepare("SELECT MIN(expires_at) AS n FROM market_listings WHERE state = 'open' AND vendor_id IS NOT NULL AND region = 17 AND expires_at > ?").get(T0).n;
  assert.equal(row().until, next, 'until its first listing runs out');
  asked.length = 0;
  await marketVendors({ db: counted, nowS: T0 + 1 }, player, ENV, { region: 17, character: 'p-ana-c1' });
  assert.deepEqual(asked.filter((s) => !/guild_members|home_rooms/.test(s)), [VENDOR_BOARD_READ, 'BATCH(2)'], 'kept: the row, and the caller\'s own two rows in one batch');
  asked.length = 0;
  await marketVendors({ db: counted, nowS: T0 + 1 }, player, ENV, { region: 17, character: null });
  assert.deepEqual(asked, [VENDOR_BOARD_READ], 'no character: no door to read');
  // a write moves it; the next caller reads and keeps it again
  raw.prepare("UPDATE market_listings SET region = 17 WHERE id = 'L3'").run();
  const v0 = row().ver;
  raw.prepare("UPDATE market_listings SET state = 'sold' WHERE id = 'L3'").run();
  assert.equal(row().ver, v0 + 1);
  asked.length = 0;
  await marketVendors({ db: counted, nowS: T0 + 2 }, player, ENV, { region: 17, character: null });
  assert.ok(asked.includes('BATCH(5)'), 'read again');
  assert.equal(row().built, row().ver, 'and kept');
  // run out: read again at its `until`
  asked.length = 0;
  await vendorBoard({ db: counted, nowS: row().until }, 17);
  assert.ok(asked.includes('BATCH(5)'), 'its first listing run out: read again');
  // a trader taken off its station moves its region's board
  await vendorBoard({ db, nowS: T0 + 3 }, 17);
  const v2 = row().ver;
  raw.prepare('UPDATE home_decor SET place = ? WHERE id = ?').run(place(null), 't300');
  assert.equal(row().ver, v2 + 1, 'off its station: moved');
  // a version moved between the read and the keep: kept at the version read, so the next caller reads again; and a slow
  // reader's board never stands over the newer one another reader kept meanwhile
  raw.prepare("UPDATE market_listings SET region = 17 WHERE id IN ('L4', 'L5')").run();
  const v1 = row().ver;
  const racing = Object.create(db);
  racing.batch = async (list) => {
    const out = await db.batch(list);
    raw.prepare("UPDATE market_listings SET price = price + 1 WHERE id = 'L4'").run();
    await vendorBoard({ db, nowS: T0 + 3 }, 17);   // another caller, reading after the write, keeps the newer board
    return out;
  };
  raw.prepare("UPDATE market_listings SET price = price + 1 WHERE id = 'L5'").run();
  await vendorBoard({ db: racing, nowS: T0 + 3 }, 17);
  assert.equal(row().ver, v1 + 2);
  assert.equal(row().built, row().ver, 'the newer board stands: the slow reader\'s older one was not put over it');
  const keptText = raw.prepare('SELECT rows FROM market_vendor_boards WHERE region = 17').get().rows;
  raw.prepare('UPDATE market_vendor_boards SET built = -1 WHERE region = 17').run();
  assert.deepEqual(JSON.parse(keptText), JSON.parse(JSON.stringify(await vendorBoard({ db, nowS: T0 + 3 }, 17))), 'and it is the board after the write');
  // bounds
  assert.equal(VENDOR_BOARD_MAX_CHARS, 1_500_000);
  assert.equal(VENDOR_BOARD_KEPT_S, 86_400);
  assert.equal(vendorBoardOf('{"newest":[],"houses":[]}'), null, 'not a board');
  assert.deepEqual(vendorBoardOf('{"newest":[],"houses":[],"patrons":[]}'), { newest: [], houses: [], patrons: [] });
});

test('VENDOR-BOARD the writes that move a board are the database\'s own - every listing, trader, house and patron write of the region, by any route, a cascade or a sweep - and stand after every migration (mutant: a trigger dropped)', () => {
  const { raw } = world();
  const triggers = raw.prepare("SELECT name FROM sqlite_master WHERE type = 'trigger' AND name LIKE 'vendor_board_%' ORDER BY name").all().map((t) => t.name);
  assert.deepEqual(triggers, ['vendor_board_house', 'vendor_board_house_gone', 'vendor_board_listed', 'vendor_board_listing', 'vendor_board_patron', 'vendor_board_trader', 'vendor_board_trader_in', 'vendor_board_trader_out', 'vendor_board_unlisted']);
  assert.match(src('server-account/migrations/0135_vendor_board.sql'), new RegExp(`'\\$\\.station'\\) END = '${VENDOR_STATION}'`), 'the station the board reads');
  // a piece whose place is not JSON is no piece (decor.js) - its write is never refused by a trigger asking its station
  raw.prepare("INSERT INTO homes (map_id, building_key, player, char_id, owner_name, region, price, bought_at) VALUES (5, 5, 'p-ana', 'c', 'Ana', 17, 1, 1)").run();
  assert.doesNotThrow(() => raw.prepare("INSERT INTO home_decor (map_id, building_key, id, model, place, placed_at, paid, yard) VALUES (5, 5, 'bad', 1, 'not json', 1, 0, 0)").run());
  assert.doesNotThrow(() => raw.prepare("UPDATE home_decor SET place = 'still not' WHERE id = 'bad'").run());
  assert.doesNotThrow(() => raw.prepare("DELETE FROM home_decor WHERE id = 'bad'").run());
  const files = readdirSync(new URL('../../server-account/migrations', import.meta.url)).filter((f) => f > '0135');
  for (const f of files) assert.doesNotMatch(src(`server-account/migrations/${f}`), /DROP TABLE (market_listings|home_decor|homes|market_patron_sales)\b/, `${f} rebuilds a table the board's triggers stand on - make them again in it`);
});
