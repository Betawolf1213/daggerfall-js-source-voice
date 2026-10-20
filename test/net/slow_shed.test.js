// SLOW-SHED (2026-10-19, the account database overloaded again, 18:05-18:25 UTC: the median request waited 10 s and D1
// refused almost nothing; bible/11-Multiplayer/Scale-Arc.md SLOW-SHED) - A DATABASE TOO SLOW TO ANSWER IS SHED AS ONE
// THAT REFUSES: each isolate hears its requests' D1 wait over their round trips (metrics.js measured) and, while its last
// SLOW_SHED_SPAN_MS of them average SLOW_SHED_WAIT_MS a trip over SLOW_SHED_MIN requests, sheds the reads an overload
// sheds; and the page's gate takes a display read that timed out as the overload's word, a stall once.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  noteD1Wait, shedding, _resetBusyShed, SLOW_SHED_WAIT_MS, SLOW_SHED_TRIP_CAP_MS, SLOW_SHED_SPAN_MS, SLOW_SHED_MIN,
} from '../../server-account/src/service.js';
import { measured } from '../../server-account/src/metrics.js';
import { BUSY_SHED_MS, BUSY_READS, BUSY_BASE_MS, BUSY_RETRY_AFTER_S } from '../../src/net/busyLaw.js';
import { call, busyUntil, _resetBusyForTests } from '../../src/net/accountClient.js';
import { standService, T0 } from '../accountDb.mjs';

const src = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const T = T0 * 1000;
const TOWN = '/v1/homes/town';
/** The warnings said while `fn` runs. */
async function warned(fn) {
  const said = [];
  const real = console.warn;
  console.warn = (...a) => { said.push(a.join(' ')); };
  try { await fn(); } finally { console.warn = real; }
  return said;
}

test('SLOW-SHED the law: SLOW_SHED_MIN requests in SLOW_SHED_SPAN_MS averaging SLOW_SHED_WAIT_MS a trip or more open the shed for BUSY_SHED_MS - the reads busyLaw.js names alone - and say so once; fewer, quicker or older requests, a request that asked nothing, and one heavy statement in a quiet isolate open none (mutants: the floor, the threshold\'s side, the span, the mean unweighted, a shed read counted, the cap, a quick request keeping it open, the word unsaid)', async () => {
  assert.equal(SLOW_SHED_WAIT_MS, 1_000, 'measured: a healthy service at most some 820 ms a trip, every overload 1,212 or more (Scale-Arc SLOW-SHED, AUDIT LEAN-READS C2)');
  assert.equal(SLOW_SHED_TRIP_CAP_MS, 5_000);
  assert.equal(SLOW_SHED_SPAN_MS, 30_000);
  assert.equal(SLOW_SHED_MIN, 16);
  _resetBusyShed();
  for (let i = 0; i < SLOW_SHED_MIN - 1; i++) noteD1Wait(3 * SLOW_SHED_WAIT_MS, 3, T + i);
  assert.equal(shedding(TOWN, 'POST', T + 20), false, 'one fewer than the floor: no shed');
  for (let i = 0; i < 40; i++) noteD1Wait(0, 0, T + 20);
  assert.equal(shedding(TOWN, 'POST', T + 20), false, 'a request that asked nothing says nothing');
  const said = await warned(() => { noteD1Wait(3 * SLOW_SHED_WAIT_MS, 3, T + 30); noteD1Wait(3 * SLOW_SHED_WAIT_MS, 3, T + 31); });
  assert.equal(shedding(TOWN, 'POST', T + 30), true, 'the floor: shed');
  assert.equal(said.filter((w) => w.startsWith('[busy] slow: the shed opened')).length, 1, 'said once, as it opened (AUDIT LEAN-READS C6)');
  assert.equal(shedding('/v1/market/buy', 'POST', T + 30), false, 'an act is never shed');
  assert.equal(shedding(TOWN, 'POST', T + 31 + BUSY_SHED_MS), false, 'BUSY_SHED_MS on, closed');
  // the mean is the database's wait over its trips, a request of many weighing as many: fifteen requests of one trip at
  // 600 ms and one of a hundred at 1,100 ms a trip - 1,047 ms a trip (a request's mean: 631)
  _resetBusyShed();
  for (let i = 0; i < SLOW_SHED_MIN - 1; i++) noteD1Wait(600, 1, T + i);
  noteD1Wait(100 * 1_100, 100, T + 20);
  assert.equal(shedding(TOWN, 'POST', T + 20), true, 'the trips\' wait, not the requests\'');
  // exactly the threshold sheds; a hair under does not
  _resetBusyShed();
  for (let i = 0; i < SLOW_SHED_MIN; i++) noteD1Wait(SLOW_SHED_WAIT_MS, 1, T + i);
  assert.equal(shedding(TOWN, 'POST', T + 20), true, 'at the threshold');
  _resetBusyShed();
  for (let i = 0; i < SLOW_SHED_MIN; i++) noteD1Wait(SLOW_SHED_WAIT_MS - 1, 1, T + i);
  assert.equal(shedding(TOWN, 'POST', T + 20), false, 'under it');
  // AUDIT LEAN-READS C4: a quiet isolate's one heavy statement - fifteen quick requests and a 25 s measure - is no queue
  _resetBusyShed();
  for (let i = 0; i < SLOW_SHED_MIN - 1; i++) noteD1Wait(60, 1, T + i);
  noteD1Wait(25_000, 1, T + 20);
  assert.equal(shedding(TOWN, 'POST', T + 20), false, 'a trip counts SLOW_SHED_TRIP_CAP_MS at most');
  // the span: slow requests older than SLOW_SHED_SPAN_MS are forgotten
  _resetBusyShed();
  for (let i = 0; i < SLOW_SHED_MIN - 1; i++) noteD1Wait(4 * SLOW_SHED_WAIT_MS, 1, T);
  noteD1Wait(4 * SLOW_SHED_WAIT_MS, 1, T + SLOW_SHED_SPAN_MS + 1);
  assert.equal(shedding(TOWN, 'POST', T + SLOW_SHED_SPAN_MS + 1), false, 'the slow ones a span ago are gone');
  // the database drained: quick requests keep nothing open - closed BUSY_SHED_MS after the last slow one
  _resetBusyShed();
  for (let i = 0; i < SLOW_SHED_MIN; i++) noteD1Wait(4 * SLOW_SHED_WAIT_MS, 1, T + i);
  for (let i = 0; i < 4 * SLOW_SHED_MIN; i++) noteD1Wait(10, 1, T + 100 + i);
  assert.equal(shedding(TOWN, 'POST', T + 15 + BUSY_SHED_MS), false, 'quick again: closed on time');
  _resetBusyShed();
});

test('SLOW-SHED the service hears its own wait a trip at a time - a batch is one trip, whatever it carries - and a shed town read is answered `server` 503 with its Retry-After and no statement; production binds the metrics that hear it (mutants: the wait unheard, a batch counted by its statements, a batch or a statement untripped)', async () => {
  assert.match(src('server-account/wrangler.toml'), /\[\[analytics_engine_datasets\]\]\nbinding = "METRICS"/, 'measured() hears the wait where METRICS is bound (AUDIT LEAN-READS C5)');
  const svc = await standService();   // a fresh isolate - nothing shed
  const g = await svc.guest();
  _resetBusyShed();
  const realNow = Date.now;
  let clock = T;
  Date.now = () => clock;
  try {
    // each request one batch of twelve statements, waiting 2.4 x the threshold: 200 ms a statement, 2,400 ms a trip
    const slow = async () => { clock += Math.round(2.4 * SLOW_SHED_WAIT_MS); };
    const st = { bind() { return st; }, first: async () => { await slow(); return null; } };
    const env = { DB: { prepare: () => st, batch: async (l) => { await slow(); return l.map(() => ({ results: [] })); } }, METRICS: { writeDataPoint() {} } };
    const moment = (ask) => Promise.all(Array.from({ length: SLOW_SHED_MIN }, () => measured(new Request('https://accounts.invalid/v1/account/played'), env,
      async (_r, e) => { await ask(e.DB); return new Response('{}'); })));
    // a moment's requests, together - as an isolate serves them, each waiting on the one queue
    await moment((db) => db.batch(Array.from({ length: 12 }, () => db.prepare('SELECT 1'))));
    assert.equal(shedding(TOWN, 'POST', clock), true, 'the isolate sheds: a batch is the queue\'s one trip (AUDIT LEAN-READS C1)');
    _resetBusyShed();
    await moment((db) => db.prepare('SELECT 1').first());
    assert.equal(shedding(TOWN, 'POST', clock), true, 'and a statement awaited alone is one');
    let asked = 0;
    const base = svc.env.DB;
    svc.env.DB = Object.create(base);
    svc.env.DB.prepare = (sql) => { asked++; return base.prepare(sql); };
    const res = await svc.fetch('https://accounts.invalid' + TOWN, { method: 'POST', headers: { authorization: `Bearer ${g.secret}`, 'content-type': 'application/json' }, body: JSON.stringify({ mapId: 7 }) });
    assert.equal(res.status, 503);
    assert.equal((await res.json()).error, 'server');
    assert.equal(res.headers.get('retry-after'), String(BUSY_RETRY_AFTER_S), 'with its Retry-After (AUDIT LEAN-READS C7)');
    assert.equal(asked, 0, 'no statement');
  } finally { Date.now = realNow; _resetBusyShed(); }
});

test('SLOW-SHED the page: a display read that timed out holds the reads as an overload answer does - a stall once, however many reads it caught - doubling while they keep timing out after it; a write, a sign-in or an act that times out, and a call that could not be made, hold nothing (mutants: the timeout unheard, every read held, an act held, a stall counted per read, no doubling)', async () => {
  let at = 1_000_000;
  const now = () => at;
  const timeout = async () => { throw new DOMException('the wait ran out', 'TimeoutError'); };
  const unreachable = async () => { throw new TypeError('Failed to fetch'); };
  _resetBusyForTests();
  assert.ok(BUSY_READS.has('/v1/market/vendors'));
  assert.equal((await call({ fetch: timeout, now, rand: () => 1 }, '/v1/market/vendors', { region: 17 })).error, 'offline');
  assert.equal(busyUntil(), at + BUSY_BASE_MS, 'the reads held the first wait');
  assert.equal((await call({ fetch: timeout, now, rand: () => 1, hold: async () => {} }, '/v1/homes/town', { mapId: 1 })).busy, true, 'and the next is held');
  // AUDIT LEAN-READS C3: one stall, seven reads out together - one word
  _resetBusyForTests();
  let release;
  const stalled = () => new Promise((_, reject) => { const prev = release; release = () => { prev?.(); reject(new DOMException('the wait ran out', 'TimeoutError')); }; });
  const out = Array.from({ length: 7 }, (_, i) => call({ fetch: stalled, now, rand: () => 1 }, i % 2 ? '/v1/homes/town' : '/v1/market/vendors', { region: 17 }));
  release();
  await Promise.all(out);
  assert.equal(busyUntil(), at + BUSY_BASE_MS, 'a stall holds the first wait, not seven doublings');
  // and after the hold, still timing out: doubled
  at += BUSY_BASE_MS;
  await call({ fetch: timeout, now, rand: () => 1 }, '/v1/market/vendors', { region: 17 });
  assert.equal(busyUntil(), at + 2 * BUSY_BASE_MS, 'doubled');
  for (const [path, body] of [['/v1/market/buy', { listing: 'x' }], ['/v1/auth/login', { handle: 'a' }], ['/v1/prof/harvest', { node: 'n' }]]) {
    _resetBusyForTests();
    await call({ fetch: timeout, now, rand: () => 0 }, path, body);
    assert.equal(busyUntil(), 0, `${path} timed out: nothing held`);
  }
  _resetBusyForTests();
  await call({ fetch: unreachable, now, rand: () => 0 }, '/v1/market/vendors', { region: 17 });
  assert.equal(busyUntil(), 0, 'a call that could not be made is the player\'s own line - nothing held');
  _resetBusyForTests();
});
