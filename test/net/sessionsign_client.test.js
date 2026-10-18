// SESSION-SIGN (2026-10-18; bible/11-Multiplayer/Scale-Arc.md THE PLAN PAST 1,000, decision 4): THE PAGE'S SIDE OF THE
// SESSION'S PASS (net/accountClient.js). The page keeps the pass an answer handed it, with the secret it rides with, sends
// it with that secret's calls alone - the one door and the realm's checkpoint (systems/realmSaves.js) - and lets it go on a
// sign-out, a refusal of the session and a call that could not be made, so a page is never left sending a header a
// service it was not handed by refuses at the preflight.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { call, sessionPassFor, forgetSessionPass, forgetSession, SESSION_PASS_HEADER, SESSION_KEY } from '../../src/net/accountClient.js';
import { realmList } from '../../src/systems/realmSaves.js';

/** A door that answers `{ ok: true }` with `pass` in its header (or none), and remembers every request's headers. */
function door() {
  const d = { pass: /** @type {string|null} */ (null), status: 200, body: { ok: true }, throws: false, sent: /** @type {any[]} */ ([]) };
  d.fetch = async (_url, init) => {
    d.sent.push(init.headers);
    if (d.throws) throw new TypeError('network');
    const headers = new Headers(d.pass ? { [SESSION_PASS_HEADER]: d.pass, 'content-type': 'application/json' } : { 'content-type': 'application/json' });
    return new Response(JSON.stringify(d.body), { status: d.status, headers });
  };
  return d;
}
const last = (d) => d.sent[d.sent.length - 1]?.[SESSION_PASS_HEADER] ?? null;

test('SESSION-SIGN the page keeps the pass an answer handed it, with its secret, and sends it with that secret\'s calls alone; an answer with none keeps the one held; a call that could not be made, a refusal of the session and a sign-out let it go (mutants: kept for any secret; never sent; kept past an offline call; kept past `auth`; kept past a sign-out)', async () => {
  forgetSessionPass();
  const d = door();
  await call({ fetch: d.fetch, secret: 'secret-of-eve-0001' }, '/v1/heartbeat', { mail: true });
  assert.equal(last(d), null, 'none held: none sent');
  d.pass = 'p1.eve.mac';
  await call({ fetch: d.fetch, secret: 'secret-of-eve-0001' }, '/v1/heartbeat', { mail: true });
  assert.equal(sessionPassFor('secret-of-eve-0001'), 'p1.eve.mac', 'kept');
  d.pass = null;
  await call({ fetch: d.fetch, secret: 'secret-of-eve-0001' }, '/v1/heartbeat', { mail: true });
  assert.equal(last(d), 'p1.eve.mac', 'sent with its secret');
  assert.equal(sessionPassFor('secret-of-eve-0001'), 'p1.eve.mac', 'an answer with none keeps it');
  await call({ fetch: d.fetch, secret: 'secret-of-bob-0002' }, '/v1/heartbeat', { mail: true });
  assert.equal(last(d), null, 'never with another secret');
  await call({ fetch: d.fetch, secret: null }, '/v1/health');
  assert.equal(last(d), null, 'nor with none');
  // a call that could not be made - a preflight refusing the header, a service rolled back past SESSION-SIGN
  d.throws = true;
  assert.equal((await call({ fetch: d.fetch, secret: 'secret-of-eve-0001' }, '/v1/heartbeat', { mail: true })).error, 'offline');
  d.throws = false;
  assert.equal(sessionPassFor('secret-of-eve-0001'), null, 'let go on a call that could not be made');
  // a refusal of the session
  d.pass = 'p1.eve.mac2';
  await call({ fetch: d.fetch, secret: 'secret-of-eve-0001' }, '/v1/heartbeat', { mail: true });
  d.pass = null; d.status = 401; d.body = { error: 'auth' };
  await call({ fetch: d.fetch, secret: 'secret-of-eve-0001' }, '/v1/heartbeat', { mail: true });
  assert.equal(sessionPassFor('secret-of-eve-0001'), null, 'let go on `auth`');
  // a sign-out
  d.status = 200; d.body = { ok: true }; d.pass = 'p1.eve.mac3';
  await call({ fetch: d.fetch, secret: 'secret-of-eve-0001' }, '/v1/heartbeat', { mail: true });
  forgetSession({ removeItem() {} });
  assert.equal(sessionPassFor('secret-of-eve-0001'), null, 'let go on a sign-out');
});

test('SESSION-SIGN the realm\'s own door carries the pass too - the checkpoint is a hot route - and keeps the one its answer hands (mutants: the realm\'s door sends none; keeps none)', async () => {
  forgetSessionPass();
  const d = door();
  const storage = { getItem: (k) => (k === SESSION_KEY ? JSON.stringify({ secret: 'secret-of-eve-0001', id: 'p-eve' }) : null), setItem() {}, removeItem() {} };
  const io = { fetch: d.fetch, base: 'https://accounts.invalid', secret: 'secret-of-eve-0001', storage };
  d.body = { characters: [], max: 6 };
  d.pass = 'p1.realm.mac';
  await realmList(io);
  assert.equal(sessionPassFor('secret-of-eve-0001'), 'p1.realm.mac', 'its answer\'s pass kept');
  d.pass = null;
  await realmList(io);
  assert.equal(last(d), 'p1.realm.mac', 'and sent with the realm\'s next ask');
});
