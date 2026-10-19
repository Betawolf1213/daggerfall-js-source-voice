// SLOW-SHED (2026-10-19, the account database overloaded again, 18:05-18:25 UTC: the median request waited 10 s and D1
// refused almost nothing; bible/11-Multiplayer/Scale-Arc.md SLOW-SHED) - A DATABASE TOO SLOW TO ANSWER IS SHED AS ONE
// THAT REFUSES: each isolate hears its requests' D1 wait (metrics.js measured) and, while its last SLOW_SHED_SPAN_MS of
// them average SLOW_SHED_WAIT_MS a statement over SLOW_SHED_MIN requests, sheds the reads an overload sheds; and the
// page's gate takes a display read that timed out as the overload's word.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  noteD1Wait, shedding, _resetBusyShed, SLOW_SHED_WAIT_MS, SLOW_SHED_SPAN_MS, SLOW_SHED_MIN,
} from '../../server-account/src/service.js';
import { measured } from '../../server-account/src/metrics.js';
import { BUSY_SHED_MS, BUSY_READS } from '../../src/net/busyLaw.js';
import { call, busyUntil, _resetBusyForTests } from '../../src/net/accountClient.js';
import { standService, T0 } from '../accountDb.mjs';

const T = T0 * 1000;
const TOWN = '/v1/homes/town';

test('SLOW-SHED the law: SLOW_SHED_MIN requests in SLOW_SHED_SPAN_MS averaging SLOW_SHED_WAIT_MS a statement or more open the shed for BUSY_SHED_MS - the reads busyLaw.js names alone; fewer, quicker or older requests, and a request that asked nothing, open none (mutants: the floor, the threshold\'s side, the span, the mean unweighted, a shed read counted)', () => {
  assert.equal(SLOW_SHED_WAIT_MS, 1_500, 'measured: healthy 40-680 ms a statement, every overload of thirty hours 1,200-2,400 ms (Scale-Arc SLOW-SHED)');
  assert.equal(SLOW_SHED_SPAN_MS, 30_000);
  assert.equal(SLOW_SHED_MIN, 16);
  _resetBusyShed();
  for (let i = 0; i < SLOW_SHED_MIN - 1; i++) noteD1Wait(3 * SLOW_SHED_WAIT_MS, 3, T + i);
  assert.equal(shedding(TOWN, 'POST', T + 20), false, 'one fewer than the floor: no shed');
  for (let i = 0; i < 40; i++) noteD1Wait(0, 0, T + 20);
  assert.equal(shedding(TOWN, 'POST', T + 20), false, 'a request that asked nothing says nothing');
  noteD1Wait(3 * SLOW_SHED_WAIT_MS, 3, T + 30);
  assert.equal(shedding(TOWN, 'POST', T + 30), true, 'the floor: shed');
  assert.equal(shedding('/v1/market/buy', 'POST', T + 30), false, 'an act is never shed');
  assert.equal(shedding(TOWN, 'POST', T + 30 + BUSY_SHED_MS), false, 'BUSY_SHED_MS on, closed');
  // the mean is the database's wait over its statements, a request of many weighing as many: fifteen requests of one
  // statement at 1,000 ms and one of a hundred at 1,600 ms a statement - 1,522 ms a statement (a request's mean: 1,038)
  _resetBusyShed();
  for (let i = 0; i < SLOW_SHED_MIN - 1; i++) noteD1Wait(1_000, 1, T + i);
  noteD1Wait(100 * 1_600, 100, T + 20);
  assert.equal(shedding(TOWN, 'POST', T + 20), true, 'the statements\' wait, not the requests\'');
  // exactly the threshold sheds; a hair under does not
  _resetBusyShed();
  for (let i = 0; i < SLOW_SHED_MIN; i++) noteD1Wait(SLOW_SHED_WAIT_MS, 1, T + i);
  assert.equal(shedding(TOWN, 'POST', T + 20), true, 'at the threshold');
  _resetBusyShed();
  for (let i = 0; i < SLOW_SHED_MIN; i++) noteD1Wait(SLOW_SHED_WAIT_MS - 1, 1, T + i);
  assert.equal(shedding(TOWN, 'POST', T + 20), false, 'under it');
  // the span: slow requests older than SLOW_SHED_SPAN_MS are forgotten
  _resetBusyShed();
  for (let i = 0; i < SLOW_SHED_MIN - 1; i++) noteD1Wait(10 * SLOW_SHED_WAIT_MS, 1, T);
  noteD1Wait(10 * SLOW_SHED_WAIT_MS, 1, T + SLOW_SHED_SPAN_MS + 1);
  assert.equal(shedding(TOWN, 'POST', T + SLOW_SHED_SPAN_MS + 1), false, 'the slow ones a span ago are gone');
  // the database drained: quick requests close it, BUSY_SHED_MS after the last slow one
  _resetBusyShed();
  for (let i = 0; i < SLOW_SHED_MIN; i++) noteD1Wait(4 * SLOW_SHED_WAIT_MS, 1, T + i);
  for (let i = 0; i < 4 * SLOW_SHED_MIN; i++) noteD1Wait(10, 1, T + 100 + i);
  assert.equal(shedding(TOWN, 'POST', T + 100 + BUSY_SHED_MS), false, 'quick again: closed on time');
  _resetBusyShed();
});

test('SLOW-SHED the service hears its own wait: requests whose statements the database answers slowly open the shed (metrics.js measured), and a shed town read is answered `server` 503 with its Retry-After and no statement (mutants: the wait unheard)', async () => {
  const svc = await standService();   // a fresh isolate - nothing shed
  const g = await svc.guest();
  _resetBusyShed();
  const realNow = Date.now;
  let clock = T;
  Date.now = () => clock;
  try {
    const st = { bind() { return st; }, async all() { clock += 2 * SLOW_SHED_WAIT_MS; return { results: [] }; }, async run() { clock += 2 * SLOW_SHED_WAIT_MS; return { meta: {} }; } };
    const env = { DB: { prepare: () => st, batch: async (l) => l.map(() => ({ results: [] })) }, METRICS: { writeDataPoint() {} } };
    // a moment's requests, together - as an isolate serves them, each waiting on the one queue
    await Promise.all(Array.from({ length: SLOW_SHED_MIN }, () => measured(new Request('https://accounts.invalid/v1/account/played'), env,
      async (_r, e) => { await e.DB.prepare('SELECT 1').all(); return new Response('{}'); })));
    assert.equal(shedding(TOWN, 'POST', clock), true, 'the isolate sheds');
    let asked = 0;
    const base = svc.env.DB;
    svc.env.DB = Object.create(base);
    svc.env.DB.prepare = (sql) => { asked++; return base.prepare(sql); };
    const r = await svc.call(TOWN, { mapId: 7 }, g.secret);
    assert.deepEqual([r.status, r.body.error], [503, 'server']);
    assert.equal(asked, 0, 'no statement');
  } finally { Date.now = realNow; _resetBusyShed(); }
});

test('SLOW-SHED the page: a display read that timed out holds the reads as an overload answer does, doubling while they keep timing out; a write, a sign-in or an act that times out, and a call that could not be made, hold nothing (mutants: the timeout unheard, every read held, an act held)', async () => {
  const at = 1_000_000;
  const now = () => at;
  const timeout = async () => { throw new DOMException('the wait ran out', 'TimeoutError'); };
  const unreachable = async () => { throw new TypeError('Failed to fetch'); };
  _resetBusyForTests();
  assert.ok(BUSY_READS.has('/v1/market/vendors'));
  assert.equal((await call({ fetch: timeout, now, rand: () => 0 }, '/v1/market/vendors', { region: 17 })).error, 'offline');
  const first = busyUntil();
  assert.ok(first > at, 'the reads held');
  assert.equal((await call({ fetch: timeout, now, rand: () => 0, hold: async () => {} }, '/v1/homes/town', { mapId: 1 })).busy, true, 'and the next is held');
  _resetBusyForTests();
  await call({ fetch: timeout, now, rand: () => 0 }, '/v1/market/vendors', { region: 17 });
  await call({ fetch: timeout, now: () => at + 60_000, rand: () => 0 }, '/v1/market/vendors', { region: 17 });
  assert.ok(busyUntil() - (at + 60_000) > first - at, 'doubled');
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
