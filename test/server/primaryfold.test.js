// PRIMARY-FOLD (2026-10-18; bible/11-Multiplayer/Scale-Arc.md THE PLAN PAST 1,000, PRIMARY-FOLD): THE DOOR'S READS IN ONE
// TRIP. A progression claim asked the account database's one primary four reads of its own - the tombstone of the body's
// `character`, the account's seat, its stream's bucket at the door, and the bucket again at its spend - each a round trip.
// The door asks the three as one statement (server-account/src/door.js doorReads) and the spend takes the door's bucket for
// the route's own stream. These pins hold that it answers as the three did, and that the trips are gone.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { standService, T0 } from '../accountDb.mjs';
import { seatRealm } from '../realmSeat.mjs';
import { doorReads } from '../../server-account/src/door.js';
import { progressRefusal, seatRefusalOf, progressSpent, PROGRESS_LINE } from '../../server-account/src/progress.js';
import { isTombstone } from '../../server-account/src/legacy.js';

/** The bucket's question as it was asked on its own (progress.js bucketOf before PRIMARY-FOLD) - the oracle. */
async function bucketAsked(db, playerId, stream) {
  const row = await db.prepare('SELECT p.played_s AS now, b.allowance, b.played_at FROM players p LEFT JOIN progress_play b ON b.player = p.id AND b.stream = ?2 WHERE p.id = ?1').bind(playerId, stream).first();
  if (!row) return null;
  return { now: Number(row.now) || 0, allowance: row.allowance == null ? null : Number(row.allowance), playedAt: row.played_at == null ? null : Number(row.played_at) };
}

/** A service on the test's clock, an account seated as a realm character. */
async function stand(extra = {}) {
  const realNow = Date.now;
  Date.now = () => T0 * 1000;
  const s = await standService(extra);
  return { s, raw: s.env.DB._raw, db: s.env.DB, eve: await s.seated('eve'), done: () => { Date.now = realNow; } };
}

test('PRIMARY-FOLD the door answers as its three questions did, asked alone: the tombstone of the character named, the seat (none, held, another named, another of the account\'s held, a second account\'s), the stream\'s bucket (none yet, filled, a stream with no row, an account with no row); a request that claims nothing asks the tombstone alone (mutants: the seat always found; its hold another row\'s; the bucket of no account; the tombstone of nothing)', async () => {
  const t = await stand();
  try {
    const { db, raw, eve } = t;
    const claims = [{ named: true, character: eve.character }, { named: true, character: 'char-not-mine' }, { named: false }];
    const check = async (label, playerId, tomb, stream) => {
      const d = await doorReads(db, playerId, { tomb, stream });
      assert.equal(d.dead, tomb != null && (await isTombstone(db, playerId, tomb)), `${label}: the tombstone`);
      if (stream == null) { assert.equal(d.seat, undefined, `${label}: no seat asked`); assert.equal(d.bucket, undefined); return d; }
      for (const c of claims) assert.deepEqual(seatRefusalOf(d.seat, c), await progressRefusal(db, playerId, c), `${label}: the seat, ${JSON.stringify(c)}`);
      assert.deepEqual(d.bucket, await bucketAsked(db, playerId, stream), `${label}: the bucket`);
      assert.equal(d.stream, stream);
      return d;
    };
    await check('seated, no bucket yet', eve.id, eve.character, 'renown');
    raw.prepare("INSERT INTO progress_play (player, stream, allowance, played_at, at) VALUES (?, 'renown', 420, 90, ?)").run(eve.id, T0);
    raw.prepare('UPDATE players SET played_s = 600 WHERE id = ?').run(eve.id);
    const filled = await check('a bucket filled', eve.id, eve.character, 'renown');
    assert.deepEqual(filled.bucket, { now: 600, allowance: 420, playedAt: 90 });
    await check('another stream, no row', eve.id, eve.character, 'prof');
    await check('a claim naming nothing', eve.id, null, 'watch');
    raw.prepare("UPDATE realm_characters SET held = 'law' WHERE id = ?").run(eve.character);
    assert.deepEqual(seatRefusalOf((await check('held', eve.id, eve.character, 'renown')).seat, claims[0]), { error: 'trade-held', held: 'law' });
    raw.prepare('UPDATE realm_characters SET held = NULL, lease = NULL WHERE id = ?').run(eve.character);
    assert.equal((await check('no lease, no seat', eve.id, eve.character, 'renown')).seat, null);
    raw.prepare('UPDATE realm_characters SET dead_at = ? WHERE id = ?').run(T0, eve.character);
    assert.equal((await check('dead', eve.id, eve.character, 'renown')).dead, true);
    assert.equal((await check('dead, claiming nothing', eve.id, eve.character, null)).dead, true);
    // the account's other realm character held, the seat not: the hold is the SEAT's row's (its lease), never another's
    const zed = await t.s.seated('zed');
    const second = await seatRealm(t.s.env, zed.secret, 'Zed Again');   // taken up: the second holds the lease now
    raw.prepare("UPDATE realm_characters SET held = 'law' WHERE id = ?").run(zed.character);
    assert.equal(seatRefusalOf((await check('another character held, the seat not', zed.id, second.id, 'renown')).seat, { named: true, character: second.id }), null);
    const bran = await t.s.seated('bran');
    await check('a second account, naming the first\'s character', bran.id, eve.character, 'renown');
    const nobody = await check('an account with no row', 'no-such-player', 'char-x', 'renown');
    assert.equal(nobody.bucket, null);
    assert.equal(nobody.seat, null);
    assert.equal((await doorReads(db, eve.id, { tomb: null, stream: null })).dead, false, 'nothing asked: no tombstone');
  } finally { t.done(); }
});

/** Every statement the service asks of the database (prepare's SQL, a batch counted once), around one call. */
function counted(env) {
  const db = env.DB, prepare = db.prepare.bind(db), batch = db.batch.bind(db);
  /** @type {string[][]} */
  const trips = [];
  db.prepare = (sql) => { const st = prepare(sql); const one = (fn) => async (...a) => { trips.push([sql]); return fn(...a); }; return Object.assign(st, { first: one(st.first.bind(st)), all: one(st.all.bind(st)), run: one(st.run.bind(st)), _sql: sql }); };
  db.batch = async (list) => { trips.push(list.map((x) => x._sql)); return batch(list); };
  return { trips, off: () => { db.prepare = prepare; db.batch = batch; } };
}

test('PRIMARY-FOLD the trips: an enforced Renown claim asks the door\'s three questions in ONE statement and its bucket nowhere else - neither the enforced room nor the spend reads it again - credited as before; a route that names a character and claims nothing asks the tombstone alone (mutants: the room asks again; the spend asks again; the door asks no stream)', async () => {
  const t = await stand({ DEVELOPER_HANDLES: 'mac', PROFESSIONS_OPEN: 'on' });
  try {
    const mac = await t.s.registered('mac');
    const line = { enforce: true, streams: { ...PROGRESS_LINE.streams, renown: { rate: 3_600, cap: 1_000 } } };
    assert.equal((await t.s.call('/v1/mod/realm-progress', { set: line }, mac.secret)).status, 200);
    const c = counted(t.s.env);
    const r = await t.s.call('/v1/renown/xp', { character: t.eve.character, xp: 5_000, rid: '00000000000000f1' }, t.eve.secret);
    c.off();
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.credited, 1_000, 'the enforced bucket\'s thousand, as the door read it');
    const flat = c.trips.flat();
    assert.equal(flat.filter((q) => q.includes('FROM realm_characters WHERE id = ?2 AND player = ?1 AND dead_at IS NOT NULL')).length, 1, 'the door: one statement');
    assert.equal(flat.filter((q) => /SELECT p\.played_s AS now/.test(q)).length, 0, 'the bucket asked by no one else');
    assert.equal(flat.filter((q) => /SELECT id, held FROM realm_characters WHERE player = \?1 AND lease IS NOT NULL/.test(q)).length, 0, 'the seat asked by no one else');
    const row = t.raw.prepare("SELECT allowance FROM progress_play WHERE player = ? AND stream = 'renown'").get(t.eve.id);
    assert.equal(row.allowance, 0, 'spent from the door\'s bucket: the thousand gone');
    const g = counted(t.s.env);
    assert.equal((await t.s.call('/v1/prof/state', { character: t.eve.character }, t.eve.secret)).status, 200);
    g.off();
    assert.equal(g.trips.flat().filter((q) => q === 'SELECT 1 FROM realm_characters WHERE id = ? AND player = ? AND dead_at IS NOT NULL').length, 1, 'a read naming a character: the tombstone alone');
    assert.equal(g.trips.flat().filter((q) => q.includes('AS seat_id')).length, 0);
  } finally { t.done(); }
});

test('PRIMARY-FOLD the spend takes the door\'s bucket for the route\'s own stream alone: a raid\'s cleanse spends the raid\'s from the door and asks the Renown it paid of its own bucket (mutants: the door\'s bucket handed to every stream; the door unread)', async () => {
  const t = await stand();
  try {
    const { db, raw, eve } = t;
    raw.prepare('UPDATE players SET played_s = 7_200 WHERE id = ?').run(eve.id);
    const door = await doorReads(db, eve.id, { tomb: eve.character, stream: 'raid' });
    raw.prepare('UPDATE players SET played_s = 9_000 WHERE id = ?').run(eve.id);   // the play moved after the door (a heartbeat) - the raid's spend is the door's
    const c = counted(t.s.env);
    await progressSpent({ db, nowS: T0 }, eve.id, '/v1/raid/claim', { recorded: true, renown: { credited: 50 } }, door);
    c.off();
    assert.equal(c.trips.flat().filter((q) => /SELECT p\.played_s AS now/.test(q)).length, 1, 'the Renown it paid reads its own bucket; the raid\'s none');
    const at = (stream) => raw.prepare('SELECT played_at FROM progress_play WHERE player = ? AND stream = ?').get(eve.id, stream)?.played_at;
    assert.equal(at('raid'), 7_200, 'the raid\'s bucket: the door\'s read');
    assert.equal(at('renown'), 9_000, 'the Renown\'s: its own');
    // a door for the Renown on the same answer: the raid, spent first, reads its own - the door's is the Renown's alone
    raw.prepare("DELETE FROM progress_play WHERE player = ?").run(eve.id);
    raw.prepare('UPDATE players SET played_s = 7_200 WHERE id = ?').run(eve.id);
    const renownDoor = await doorReads(db, eve.id, { tomb: eve.character, stream: 'renown' });
    raw.prepare('UPDATE players SET played_s = 9_000 WHERE id = ?').run(eve.id);
    await progressSpent({ db, nowS: T0 + 3_600 }, eve.id, '/v1/raid/claim', { recorded: true, renown: { credited: 50 } }, renownDoor);
    assert.deepEqual([at('raid'), at('renown')], [9_000, 7_200], 'each stream its own bucket, the door\'s to its stream');
  } finally { t.done(); }
});
