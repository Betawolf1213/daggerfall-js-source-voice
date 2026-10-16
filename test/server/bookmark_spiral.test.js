// BOOKMARK-SPIRAL (2026-10-16, the account database's primary "overloaded. Requests queued for too long." from 13:50 UTC,
// every route 5 to 60 s; bible/11-Multiplayer/Scale-Arc.md BOOKMARK-SPIRAL): the six polled display reads, asked with no
// bookmark, start their D1 session at any instance (server-account/src/service.js ANY_REPLICA_ROUTES, REPLICA_ANY) - the
// page lost its bookmark to every slow answer, and each of them had started at the primary. A session lookup that misses
// on such a session asks the primary (accounts.js resolveSession), so a session minted a moment ago is never refused.
// Every other replica read keeps the primary first with no bookmark. Each pin failed on the build before it.
// tools/mutants/bookmark_spiral.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { standService } from '../accountDb.mjs';
import { laggy } from '../laggyD1.mjs';
import { REPLICA_ROUTES, ANY_REPLICA_ROUTES, REPLICA_ANY, REPLICA_CONSTRAINT, PRIMARY_FIRST_ROUTES, DB_ANY, DB_ROOT, routeDb } from '../../server-account/src/service.js';

const MARK = (n) => `${n.toString(16).padStart(8, '0')}-00000000-00000000-${'0'.repeat(32)}`;
const send = (S, path, { method = 'POST', secret, body = {}, mark = null } = {}) => S.fetch(`https://accounts.invalid${path}`, {
  method, headers: { authorization: `Bearer ${secret}`, ...(method === 'POST' ? { 'content-type': 'application/json' } : {}), ...(mark ? { 'x-d1-bookmark': mark } : {}) }, body: method === 'POST' ? JSON.stringify(body) : undefined,
});
const WHO = /FROM sessions s LEFT JOIN players p/;

test('BOOKMARK-SPIRAL: the six polled display reads with no bookmark start at any instance; with one, at it; every other replica read with none, and the mint whatever it carries, at the primary (mutants: the set unread; the constraint the primary\'s; a read past the six)', () => {
  assert.equal(REPLICA_ANY, 'first-unconstrained');
  assert.deepEqual([...ANY_REPLICA_ROUTES], [
    ['/v1/heartbeat', 'POST'], ['/v1/prof/pixels', 'POST'], ['/v1/prof/motherlodes', 'POST'],
    ['/v1/homes/town', 'POST'], ['/v1/market/vendors', 'POST'], ['/v1/arena/board', 'POST'],
  ], 'the six - no read a caller asks back at once after its own write (the decor, a room, its homes, its Marks, its saves, its account, its realm, its trade)');
  for (const [path, method] of ANY_REPLICA_ROUTES) {
    assert.equal(REPLICA_ROUTES.get(path), method, `${path}: a replica route`);
    assert.equal(PRIMARY_FIRST_ROUTES.has(path), false, `${path}: not the mint`);
  }
  const opened = [];
  const raw = { prepare: () => ({}), withSession(c) { if (c === 'refused') throw new Error('D1_ERROR: bad bookmark'); opened.push(c); return { prepare: () => ({}), getBookmark: () => null }; } };
  for (const [path, method] of REPLICA_ROUTES) {
    opened.length = 0;
    const s = routeDb(raw, path, method, null);
    const any = ANY_REPLICA_ROUTES.get(path) === method;
    assert.deepEqual(opened, [any ? REPLICA_ANY : REPLICA_CONSTRAINT], `${path} with no bookmark`);
    assert.equal(s[DB_ANY], any, `${path}: the session says where it began`);
    assert.equal(s[DB_ROOT], raw, `${path}: and the binding beneath it`);
    opened.length = 0;
    routeDb(raw, path, method, MARK(7));
    assert.deepEqual(opened, [PRIMARY_FIRST_ROUTES.has(path) ? REPLICA_CONSTRAINT : MARK(7)], `${path} with a bookmark`);
    opened.length = 0;
    routeDb(raw, path, method, 'refused');
    assert.deepEqual(opened, [any ? REPLICA_ANY : REPLICA_CONSTRAINT], `${path} with a bookmark D1 refuses: as with none`);
  }
  assert.equal(routeDb(raw, '/v1/heartbeat', 'GET', null), raw, 'another method: the binding');
});

/** The primary's own session lookups, counted - `P` accountDb's binding, before laggyD1 wraps it. */
function lookupsOn(P) {
  const n = { who: 0 };
  const prep = P.prepare.bind(P);
  P.prepare = (sql) => { if (WHO.test(sql)) n.who += 1; return prep(sql); };
  return n;
}

test('BOOKMARK-SPIRAL: a heartbeat and a town read with no bookmark look their session up on the replica - none of it the primary\'s; the account view with none still starts at the primary (mutants: the constraint the primary\'s; the primary asked on every lookup; the account view moved)', async () => {
  const S = await standService();
  const primary = lookupsOn(S.env.DB);
  const L = laggy(S.env.DB);
  S.env.DB = L.db;
  try {
    const who = await S.registered('Aldric');
    L.sync();
    primary.who = 0;
    for (const [path, body] of [['/v1/heartbeat', { board: 1 }], ['/v1/homes/town', { mapId: 1 }]]) {
      const r = await send(S, path, { secret: who.secret, body });
      assert.equal(r.status, 200, `${path}: ${await r.clone().text()}`);
      const s = L.log.at(-1);
      assert.equal(s.constraint, REPLICA_ANY, `${path}: any instance`);
      const lookups = s.statements.filter(([, q]) => WHO.test(q));
      assert.deepEqual(lookups.map(([on]) => on), ['replica'], `${path}: the session's lookup the replica's, once`);
      assert.ok(r.headers.get('x-d1-bookmark'), `${path}: its position back, for the page's next read`);
    }
    assert.equal(primary.who, 0, 'the primary asked for neither session');
    const a = await send(S, '/v1/account', { method: 'GET', secret: who.secret });
    assert.equal(a.status, 200);
    assert.equal(L.log.at(-1).constraint, REPLICA_CONSTRAINT, 'the account view with no bookmark: the primary first - the caller\'s own writes read');
    assert.equal(primary.who, 1, 'its lookup the primary\'s');
  } finally { L.close(); }
});

test('BOOKMARK-SPIRAL: a session minted after the replica\'s last catch-up is found - its lookup missed there and asked the primary - and a secret the primary does not hold either is refused (mutant: no primary on a miss)', async () => {
  const S = await standService();
  const primary = lookupsOn(S.env.DB);
  const L = laggy(S.env.DB);
  S.env.DB = L.db;
  try {
    await S.registered('Aldric');
    L.sync();
    const fresh = await S.guest();   // minted on the primary; the replica has not heard of it
    primary.who = 0;
    const r = await send(S, '/v1/heartbeat', { secret: fresh.secret, body: { board: 1 } });
    assert.equal(r.status, 200, `the new guest's heartbeat: ${await r.clone().text()}`);
    const s = L.log.at(-1);
    assert.equal(s.constraint, REPLICA_ANY);
    assert.deepEqual(s.statements.filter(([, q]) => WHO.test(q)).map(([on]) => on), ['replica'], 'the session\'s own lookup the replica\'s - its miss asked beside it, of the binding');
    assert.equal(primary.who, 1, 'and the primary asked once, for the one the replica had not heard of');
    const bad = await send(S, '/v1/heartbeat', { secret: 'not-a-session-anyone-holds-0001', body: { board: 1 } });
    assert.equal(bad.status, 401, 'a secret nobody holds: refused, after both asked');
    assert.equal(primary.who, 2);
  } finally { L.close(); }
});
