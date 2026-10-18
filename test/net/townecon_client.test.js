import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { mintWatchReceipt } from '../../src/net/watchReceipt.js';
import {
  createTownEconBook, TOWN_ECON_WATCH_KEY, TOWN_ECON_WATCH_HELD_MAX, TOWN_ECON_CLAIM_EVERY_MS, TOWN_ECON_REPORTED_KEY, TOWN_ECON_DONE, TOWN_ECON_STOPS,
} from '../../src/net/townEconBook.js';
import { createTownEconHost } from '../../src/scenes/townEconHost.js';
import { accountTowns, SESSION_KEY } from '../../src/net/accountClient.js';
import { TOWN_WATCH_CLAIM_MAX, TOWN_ECON_KEPT_S, townProsperity, townKeyOf, townDayOf, TOWN_DAY_MS } from '../../src/net/townEconLaw.js';

// TOWN-ECON TE2 (2026-10-18, bible/06-Systems/Town-Economy-Arc.md section 4): this device's half of the players' share -
// the shares read and held, the Watch's ticks kept at a town's pixel and claimed, a town witnessed once a day; the host
// module the world host wires, and the door.

const { subtle } = globalThis.crypto;
const ME = 'acct-me';
const T = 1_800_000_000;
const rd = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const memory = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m }; };
const flush = () => new Promise((r) => setTimeout(r, 0));
let _key = null;
const key = async () => (_key ??= (await subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])).privateKey);
const tick = async ({ s = ME, x = 212, y = 151, c = 1, nowS = T } = {}) => mintWatchReceipt({ s, x, y, c }, await key(), { subtle, nowS });

function rig({ answers = {}, now = T * 1000 } = {}) {
  const calls = [];
  const door = {
    econ: async () => { calls.push(['econ']); return answers.econ ?? { ok: true, data: { towns: [] } }; },
    witness: async (t) => { calls.push(['witness', t]); return answers.witness ?? { ok: true, data: { counted: true } }; },
    watch: async (rs) => { calls.push(['watch', rs.length]); return answers.watch ?? { ok: true, data: { counted: rs.length, why: {} } }; },
  };
  const clock = { ms: now };
  const storage = memory();
  const book = createTownEconBook({ door, storage, nowMs: () => clock.ms, me: () => ME, isTownPixel: (x, y) => x === 212 && y === 151, relayNowS: () => Math.floor(clock.ms / 1000) });
  return { book, calls, clock, storage, answers, door };
}

test('TOWN-ECON TE2 the shares: read once a keeping and held, synchronous to every reader, a town\'s map id unsigned; 0 for a town not answered and until the first read; an account\'s refusal stops them for the page (mutants: TOWNECON2-book-unkept, TOWNECON2-book-unstopped)', async () => {
  const r = rig({ answers: { econ: { ok: true, data: { towns: [[11, 12.5], [0xfffffff0, 3], [12, 'x'], [13, 0]] } } } });
  assert.equal(r.book.shareOf(11), 0, 'until the first read answers');
  await flush(); await flush();
  assert.deepEqual([r.book.shareOf(11), r.book.shareOf(-16), r.book.shareOf(12), r.book.shareOf(13), r.book.shareOf(99)], [12.5, 3, 0, 0, 0]);
  r.book.shareOf(11);
  await flush(); await flush();
  assert.equal(r.calls.filter(([k]) => k === 'econ').length, 1, 'held');
  r.clock.ms += TOWN_ECON_KEPT_S * 1000;
  r.book.shareOf(11);
  await flush(); await flush();
  assert.equal(r.calls.filter(([k]) => k === 'econ').length, 2, 'read again past the keeping');
  for (const error of TOWN_ECON_STOPS) {
    const s = rig({ answers: { econ: { ok: false, error } } });
    s.book.shareOf(1); await flush(); await flush();
    s.clock.ms += TOWN_ECON_KEPT_S * 1000;
    s.book.shareOf(1); await flush();
    assert.equal(s.calls.length, 1, `${error}: asked no more`);
    assert.equal(s.book.stopped, true);
  }
});

test('TOWN-ECON TE2 the footsteps: a signed tick for this account at a town\'s pixel, alive, kept once on the device - another\'s, an unsigned one, one off a town and a dead one are not; a claim\'s worth is claimed, or the oldest after TOWN_ECON_CLAIM_EVERY_MS; an answer lets them go, no answer keeps them and waits; a young account\'s ticks are asked no more (mutants: TOWNECON2-book-keep-anywhere, TOWNECON2-book-claim-early, TOWNECON2-book-kept-on-fail)', async () => {
  const r = rig({ answers: { watch: { ok: false, error: 'offline' } } });
  assert.equal(r.book.keepWatch(await tick()), true);
  const again = JSON.parse(r.storage.getItem(TOWN_ECON_WATCH_KEY))[0].r;
  assert.equal(r.book.keepWatch(again), false, 'once');
  assert.equal(r.book.keepWatch(await tick({ s: 'acct-other', c: 2 })), false, 'another account\'s');
  assert.equal(r.book.keepWatch((await tick({ c: 3 })).replace(/\.[^.]+$/, '.')), false, 'unsigned');
  assert.equal(r.book.keepWatch(await tick({ x: 400, c: 4 })), false, 'off a town');
  assert.equal(r.book.keepWatch(await tick({ c: 5, nowS: T - 3 * 86_400 })), false, 'dead by the relay\'s clock');
  assert.equal(r.book.watchHeldCount(), 1);
  assert.equal(await r.book.claim(), null, 'not due: one tick, fresh');
  for (let c = 6; r.book.watchHeldCount() < TOWN_WATCH_CLAIM_MAX; c++) r.book.keepWatch(await tick({ c }));
  await flush();
  assert.deepEqual(r.calls.filter(([k]) => k === 'watch'), [['watch', TOWN_WATCH_CLAIM_MAX]], 'a claim\'s worth, claimed');
  assert.equal(r.book.watchHeldCount(), TOWN_WATCH_CLAIM_MAX, 'no answer keeps them');
  assert.equal(await r.book.claim(), null, 'and waits');
  r.answers.watch = { ok: true, data: { counted: 12, why: {} } };
  r.clock.ms += TOWN_ECON_CLAIM_EVERY_MS;
  assert.deepEqual(await r.book.claim(), { counted: 12, why: {} });
  assert.equal(r.book.watchHeldCount(), 0, 'an answer lets them go');
  // the oldest after its wait
  r.book.keepWatch(await tick({ c: 50, nowS: Math.floor(r.clock.ms / 1000) }));
  assert.equal(await r.book.claim(), null);
  r.clock.ms += TOWN_ECON_CLAIM_EVERY_MS;
  assert.equal((await r.book.claim())?.counted, 12);
  // the most held
  const h = rig({ answers: { watch: { ok: false, error: 'offline' } } });
  for (let c = 1; c <= TOWN_ECON_WATCH_HELD_MAX + 5; c++) h.book.keepWatch(await tick({ c }));
  assert.ok(JSON.parse(h.storage.getItem(TOWN_ECON_WATCH_KEY)).length <= TOWN_ECON_WATCH_HELD_MAX);
  // a young account
  const y = rig({ answers: { watch: { ok: true, data: { counted: 0, why: { young: 12 } } } } });
  for (let c = 1; c <= TOWN_WATCH_CLAIM_MAX; c++) y.book.keepWatch(await tick({ c }));
  await flush(); await flush();
  assert.equal(y.book.keepWatch(await tick({ c: 99 })), false, 'asked no more this page');
});

test('TOWN-ECON TE2 the registry: a town reported once a UTC day, its report canonical; counted or known, never again; a young account or a refusal stops it for the page (mutants: TOWNECON2-book-witness-daily, TOWNECON2-book-witness-done)', async () => {
  const TOWN = { map: 11, px: 212, py: 151, region: 17, location: 5 };
  const r = rig({ answers: { witness: { ok: true, data: { counted: false, why: 'ignored' } } } });
  assert.equal(await r.book.witness({ ...TOWN, px: 1000 }), false, 'no town');
  assert.equal(await r.book.witness(TOWN), true);
  assert.deepEqual(r.calls, [['witness', TOWN]]);
  assert.equal(await r.book.witness(TOWN), false, 'once a day');
  r.clock.ms += 86_400_000;
  assert.equal(await r.book.witness(TOWN), true, 'the next day');
  r.answers.witness = { ok: true, data: { counted: true, confirmed: false } };
  r.clock.ms += 86_400_000;
  await r.book.witness(TOWN);
  assert.ok(JSON.parse(r.storage.getItem(TOWN_ECON_REPORTED_KEY))['11'] >= TOWN_ECON_DONE, 'counted: done');
  r.clock.ms += 86_400_000;
  assert.equal(await r.book.witness(TOWN), false, 'never again');
  const k = rig({ answers: { witness: { ok: true, data: { counted: false, why: 'known' } } } });
  await k.book.witness(TOWN);
  k.clock.ms += 86_400_000;
  assert.equal(await k.book.witness(TOWN), false, 'known: done');
  const y = rig({ answers: { witness: { ok: true, data: { counted: false, why: 'young' } } } });
  await y.book.witness(TOWN);
  assert.equal(await y.book.witness({ ...TOWN, map: 12 }), false, 'young: no more this page');
});

test('TOWN-ECON TE2 the host module (scenes/townEconHost.js): the reading\'s players\' share is the book\'s by the town\'s map id; the Watch\'s tick handed to the book where a town with an economy stands; the town walked into witnessed with its location - a town with an economy alone; offline no book, nothing asked (mutants: TOWNECON2-host-unshared, TOWNECON2-host-witness-any)', async () => {
  const towns = new Map([[11, { name: 'Ripmarket', px: 212, py: 151, region: 17, type: 0, location: 5 }], [12, { name: 'The Crypt', px: 10, py: 10, region: 17, type: 4, location: 6 }]]);
  const r = rig({ answers: { econ: { ok: true, data: { towns: [[11, 20]] } } } });
  const clock = T * 1000;
  const host = createTownEconHost({ online: () => true, townOf: (id) => towns.get(id), seatAt: () => null, seats: () => null, raidedAt: () => false, nowMs: () => clock,
    typeAt: (x, y) => [...towns.values()].find((t) => t.px === x && t.py === y)?.type, door: { ...r.door, me: () => ME }, storage: memory() });
  host.prosperityOf(11);
  await flush(); await flush();
  const day = townDayOf(clock);
  assert.equal(host.prosperityOf(11), townProsperity({ key: townKeyOf(212, 151), type: 0, day, players: 20 }), 'the share read in');
  assert.ok(host.prosperityOf(11) > townProsperity({ key: townKeyOf(212, 151), type: 0, day }));
  assert.equal(host.keepWatch(await tick({ nowS: Math.floor(clock / 1000) })), true, 'a town\'s pixel');
  assert.equal(host.keepWatch(await tick({ x: 10, y: 10, c: 2, nowS: Math.floor(clock / 1000) })), false, 'a dungeon\'s');
  assert.equal(host.witness(11), true);
  assert.equal(host.witness(12), false, 'a dungeon has no economy');
  await flush();
  assert.deepEqual(r.calls.filter(([k]) => k === 'witness'), [['witness', { map: 11, px: 212, py: 151, region: 17, location: 5 }]]);
  const off = createTownEconHost({ online: () => false, townOf: (id) => towns.get(id), seatAt: () => null, seats: () => null, raidedAt: () => false, nowMs: () => clock });
  assert.equal(off.book, null);
  assert.equal(off.witness(11), false);
  assert.equal(off.keepWatch(await tick()), false);
  assert.equal(off.prosperityOf(11), null, 'offline the town economy does not run');
  assert.ok(TOWN_DAY_MS > 0);
});

test('TOWN-ECON TE2 the door and the wiring: the three routes; the world host builds the module with the town\'s location in its row, hands it the Watch beside the seats\' and the Motherlodes\', and witnesses the town at its entry (mutants: TOWNECON2-door-path, TOWNECON2-world-unwatched, TOWNECON2-world-unwitnessed, TOWNECON2-location-lost)', async () => {
  const sent = [];
  const storage = memory();
  storage.setItem(SESSION_KEY, JSON.stringify({ secret: 'sek', id: ME }));
  const door = accountTowns({ fetch: async (u, i) => { sent.push([new URL(u).pathname, JSON.parse(i.body)]); return new Response('{"ok":true,"towns":[]}', { status: 200 }); }, storage });
  assert.equal(door.me(), ME, 'the signed-in account');
  await door.econ();
  await door.witness({ map: 1 });
  await door.watch(['r']);
  assert.deepEqual(sent.map(([p, b]) => [p, Object.keys(b).filter((k) => k !== 'secret')]), [['/v1/towns/econ', []], ['/v1/towns/witness', ['town']], ['/v1/towns/watch', ['receipts']]]);
  const w = rd('src/scenes/world.js');
  assert.match(w, /online\.onWatch = \(r\) => \{ seatBook\?\.keepWatch\(r\); motherlodeBook\?\.watch\(r\); townEcon\.keepWatch\(r\); \};/);
  assert.match(w, /revealMemberGuildHalls\(\{ witness: onlineOn \}\);[^\n]*\n\s*townEcon\.witness\(_musicLoc\?\.mapTableData\?\.mapId\);/);
  assert.match(w, /type: loc\.mapTableData\.locationType, location: l \}\);/);
  assert.match(w, /typeAt: \(x, y\) => locationIndex\.get\(`\$\{x\},\$\{y\}`\)\?\.mapTableData\?\.locationType \}\);/);
  assert.match(rd('src/scenes/townEconHost.js'), /reading\.online\(\) \? accountTowns\(\{ fetch: \(u, i\) => globalThis\.fetch\(u, i\), storage \}\) : null;/, 'the door the page\'s own online');
});
