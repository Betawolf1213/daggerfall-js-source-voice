// AUTO-HOLD (2026-10-16, Mac on the Discord reports - "copies of an item were found. Trading is frozen until staff have
// looked": "We need to figure out a better system for trade banning. I dont want to have to manually review";
// bible/06-Systems/Integrity-Arc.md AUTO-HOLD). Pinned here:
//   - A COPY LOCKS ITS PIECE, NEVER THE CHARACTER: however many copies a record shows it trades on, each copied piece
//     locked (item_dupes) and counted once a checkpoint, never a piece at a time;
//   - A CONTESTED CLAIM IS NO STRIKE: a piece handed through a chest whose giver's game died before its record saw the give
//     (the giver rejoins with it) - the receiver's copy locked, nothing counted, both characters trading;
//   - THE PIECE IS NAMED: a checkpoint answers the locked pieces' keys, the realm session tells each once, and the notice
//     names the piece from the pack (scenes/realmHoldHost.js);
//   - THE LAW'S THIRD HOLD IS TIMED: a week, a month each after it, a clean checkpoint no way out inside it and the first
//     past it lifting it; the count forgotten a month after the last finding (or the timed hold's end); staff's clear and
//     rollback reset it;
//   - 'dupe' RETIRED: a row still holding it lifts at its next checkpoint, and migration 0120 lifts every one standing
//     (written as a staff act) and turns a law hold waiting for staff into the first timed hold;
//   - THE SHOP'S SHELF never lands back a piece its reader carries, nor one piece twice (world/interiorShared.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import worker from '../server-account/src/index.js';
import { standService, T0 } from './accountDb.mjs';
import { seatRealm, freshSave } from './realmSeat.mjs';
import { DUPE_GRACE_S } from '../server-account/src/ledger.js';
import { holdOf, lawCountOf, LAW_HOLD_S, LAW_HOLD_REPEAT_S, LAW_FADE_S } from '../server-account/src/verdict.js';
import { STRIKES_FOR_TIMED } from '../server-account/src/judge.js';
import { tradeHeldNotice, ledgerKeyOf, carriedLedgerKeys, piecesByKey } from '../src/systems/itemIds.js';
import { tradeHeldUntilNotice, heldUntilText } from '../src/net/realmTradeLaw.js';
import { piecesLockedNotice, wireRealmHolds } from '../src/scenes/realmHoldHost.js';
import { itemLongName } from '../src/systems/itemInfo.js';
import { applyInteriorLoot, applyInteriorShared, withoutCarried } from '../src/world/interiorShared.js';
import { SESSION_KEY } from '../src/net/accountClient.js';
import { realmIo, createRealmSession } from '../src/systems/realmSaves.js';
import { createWeapon } from '../src/combat/enemyEquipment.js';
import { applyRarity } from '../src/systems/lootRarity.js';
import { seeded } from './honestItems.mjs';

const rare = (seed = 11, t = 113) => applyRarity(createWeapon(t, 1, seeded(7)), 'rare', seeded(seed));
const withId = (uid, seed = 11, t = 113) => ({ ...rare(seed, t), uid });
const ring = () => ({ templateIndex: 135, group: 'Jewellery', value: 80, hand: 1 });   // 'crafted': a hand on a ring no craft made
const DAY = 24 * 3600;

async function stand(env = {}) {
  let now = T0;
  const realNow = Date.now;
  Date.now = () => now * 1000;
  const s = await standService(env);
  const raw = s.env.DB._raw;
  const seat = async (handle) => {
    const who = await s.registered(handle);
    const R = await seatRealm(s.env, who.secret, handle);
    return { who, R };
  };
  const putSave = async ({ who, R }, save) => {
    const at = R.at();
    const res = await worker.fetch(new Request(`https://accounts.invalid/v1/realm/${R.id}/data`, {
      method: 'PUT', headers: { authorization: `Bearer ${who.secret}`, 'x-realm-lease': at.lease, 'x-realm-seq': String(at.seq + 1), 'x-realm-summary': JSON.stringify({ level: 1 }) },
      body: JSON.stringify(save),
    }), s.env);
    assert.equal(res.status, 200);
    return res.json();
  };
  const put = (c, items) => putSave(c, freshSave({ name: c.who.handle, items }));
  const row = (id) => ({ ...raw.prepare('SELECT held, held_at, held_until, strikes, law_holds, law_at, dupes, judge_rev FROM realm_characters WHERE id = ?').get(id) });
  const copiesOf = (id) => raw.prepare('SELECT uid FROM item_dupes WHERE char_id = ? ORDER BY uid').all(id).map((r) => r.uid);
  const findings = (id, kind) => raw.prepare('SELECT detail FROM realm_findings WHERE char_id = ? AND kind = ? ORDER BY id').all(id, kind).map((r) => JSON.parse(r.detail));
  return { ...s, raw, seat, put, putSave, row, copiesOf, findings, now: () => now, wait: (sec) => { now += sec; }, done: () => { Date.now = realNow; } };
}

test('AUTO-HOLD holdOf, pure: staff\'s stands; the law holds while it finds or a timed hold runs (never at its end); the budget only under enforce; a retired \'dupe\' lifts', () => {
  const v = { prev: null, law: 0, until: null, nowS: 1000, over: 0, enforce: false };
  assert.equal(holdOf({ ...v, prev: 'staff' }), 'staff');
  assert.equal(holdOf({ ...v, prev: 'dupe' }), null, 'retired: no verdict keeps it');
  assert.equal(holdOf({ ...v, law: 1 }), 'law');
  assert.equal(holdOf({ ...v, prev: 'law', until: 1001 }), 'law', 'timed: a clean checkpoint is no way out');
  assert.equal(holdOf({ ...v, prev: 'law', until: 1000 }), null, 'its time out: lifted');
  assert.equal(holdOf({ ...v, prev: 'law' }), null, 'a law hold untimed: a clean checkpoint lifts it');
  assert.equal(holdOf({ ...v, over: 5 }), null);
  assert.equal(holdOf({ ...v, over: 5, enforce: true }), 'budget');
});

test('AUTO-HOLD lawCountOf, pure: the third strike a week\'s hold and none counted after; each after it a month; the fade at LAW_FADE_S from the last finding - or from a timed hold\'s end, never inside it', () => {
  const n = 10_000_000;
  const none = { strikes: null, served: null, until: null, at: null };
  assert.deepEqual(lawCountOf(none, { rising: true, holding: true, nowS: n }), { strikes: 1, served: 0, until: null, at: n });
  assert.deepEqual(lawCountOf({ ...none, strikes: STRIKES_FOR_TIMED - 2, at: n }, { rising: true, holding: true, nowS: n + 5 }), { strikes: STRIKES_FOR_TIMED - 1, served: 0, until: null, at: n + 5 });
  assert.deepEqual(lawCountOf({ ...none, strikes: STRIKES_FOR_TIMED - 1, at: n }, { rising: true, holding: true, nowS: n + 5 }), { strikes: 0, served: 1, until: n + 5 + LAW_HOLD_S, at: n + 5 + LAW_HOLD_S }, 'the first: a week');
  assert.deepEqual(lawCountOf({ strikes: STRIKES_FOR_TIMED - 1, served: 1, until: null, at: n }, { rising: true, holding: true, nowS: n + 5 }), { strikes: 0, served: 2, until: n + 5 + LAW_HOLD_REPEAT_S, at: n + 5 + LAW_HOLD_REPEAT_S }, 'the next: a month');
  // the same piece carried on (no strike) inside a timed hold: the hold and its end stand, the fade counts from its end
  const timed = { strikes: 0, served: 1, until: n + LAW_HOLD_S, at: n + LAW_HOLD_S };
  assert.deepEqual(lawCountOf(timed, { rising: false, holding: true, nowS: n + DAY }), { strikes: 0, served: 1, until: n + LAW_HOLD_S, at: n + LAW_HOLD_S });
  assert.deepEqual(lawCountOf(timed, { rising: false, holding: false, nowS: n + LAW_HOLD_S }), { strikes: 0, served: 1, until: null, at: n + LAW_HOLD_S }, 'run out');
  assert.deepEqual(lawCountOf(timed, { rising: false, holding: false, nowS: n + LAW_HOLD_S + LAW_FADE_S - 1 }).served, 1, 'a second short: remembered');
  assert.deepEqual(lawCountOf(timed, { rising: false, holding: false, nowS: n + LAW_HOLD_S + LAW_FADE_S }), { strikes: 0, served: 0, until: null, at: null }, 'faded');
  assert.deepEqual(lawCountOf({ strikes: 2, served: 0, until: null, at: n }, { rising: true, holding: true, nowS: n + LAW_FADE_S }), { strikes: 1, served: 0, until: null, at: n + LAW_FADE_S }, 'two strikes a month old forgotten: this one the first');
});

test('AUTO-HOLD service: the law\'s third hold is TIMED - a clean checkpoint inside it holds still, the first past it lifts it, the next three a month - and the count fades a month after', async () => {
  const s = await stand();
  try {
    const A = await s.seat('ann');
    const strike = async () => { assert.equal((await s.put(A, [ring()])).tradeHeld, 'law'); return s.put(A, []); };
    for (let i = 0; i < STRIKES_FOR_TIMED - 1; i++) assert.equal((await strike()).tradeHeld, null, `strike ${i + 1}: lifted when gone`);
    const third = await strike();
    const until = s.now() + LAW_HOLD_S;
    assert.deepEqual([third.tradeHeld, third.tradeHeldWhy], ['law', { code: 'until', t: null, until }], 'the piece gone, held a week - and said so');
    assert.deepEqual(s.row(A.R.id), { ...s.row(A.R.id), held: 'law', held_until: until, strikes: 0, law_holds: 1, law_at: until });
    s.wait(LAW_HOLD_S - 1);
    assert.equal((await s.put(A, [])).tradeHeld, 'law', 'a second short: held');
    s.wait(1);
    const out = await s.put(A, []);
    assert.deepEqual([out.tradeHeld, out.tradeHeldWhy], [null, undefined], 'lifted on its own');
    assert.deepEqual([s.row(A.R.id).held_until, s.row(A.R.id).law_holds], [null, 1]);
    // three more inside the month: a month's hold
    for (let i = 0; i < STRIKES_FOR_TIMED - 1; i++) await strike();
    const again = await strike();
    assert.equal(again.tradeHeldWhy.until, s.now() + LAW_HOLD_REPEAT_S, 'a month');
    // ...served, and a month and more clean: forgotten - the next strike the first, no hold past the piece
    s.wait(LAW_HOLD_REPEAT_S + LAW_FADE_S);
    assert.equal((await s.put(A, [])).tradeHeld, null);
    assert.deepEqual([s.row(A.R.id).strikes, s.row(A.R.id).law_holds], [0, 0], 'faded');
    assert.equal((await strike()).tradeHeld, null);
    assert.equal(s.row(A.R.id).strikes, 1);
  } finally { s.done(); }
});

test('AUTO-HOLD service: a contested claim - a piece through a chest, its giver\'s game killed before its record saw the give - locks the RECEIVER\'s copy, counts nothing, holds neither; the receiver\'s next checkpoint names it', async () => {
  const s = await stand();
  try {
    const G = await s.seat('gil'), R = await s.seat('rhe');
    const k = 'a1a1a1a1a1a1a1a1';
    await s.put(G, [withId(k)]);
    // the receiver takes it from the chest and checkpoints; the giver's game dies, and it rejoins from its record - k still in it
    assert.equal((await s.put(R, [withId(k)])).tradeHeld, null);
    s.wait(DUPE_GRACE_S);
    assert.equal((await s.put(G, [withId(k)])).tradeHeld, null, 'the giver trades on');
    assert.deepEqual([s.row(G.R.id).dupes, s.row(R.R.id).dupes, s.row(R.R.id).held], [0, 0, null], 'no strike, no hold');
    assert.deepEqual(s.copiesOf(R.R.id), [k], 'the receiver\'s copy locked');
    assert.deepEqual(s.findings(R.R.id, 'dupe'), [{ keys: [k], count: 1, contested: true }]);
    const next = await s.put(R, [withId(k), withId('b2b2b2b2b2b2b2b2')]);
    assert.deepEqual([next.tradeHeld, next.locked], [null, [k]], 'named in the answer');
    assert.equal((await s.put(R, [])).locked, undefined, 'gone from the record: nothing to name');
  } finally { s.done(); }
});

test('AUTO-HOLD service: three copied pieces in one record are one incident - each locked and named, the character trading (it held the character at once)', async () => {
  const s = await stand();
  try {
    const A = await s.seat('dov');
    const keys = ['1111111111111111', '2222222222222222', '3333333333333333'];
    const r = await s.put(A, keys.flatMap((k) => [withId(k), withId(k)]));
    assert.deepEqual([r.tradeHeld, r.locked], [null, keys]);
    assert.equal(s.row(A.R.id).dupes, 1, 'one incident');
    assert.deepEqual(s.copiesOf(A.R.id), keys);
    const again = await s.put(A, keys.flatMap((k) => [withId(k), withId(k)]));
    assert.deepEqual([again.tradeHeld, again.locked, s.row(A.R.id).dupes, s.row(A.R.id).held], [null, keys, 1, null], 'named again, never counted again - and held never');
  } finally { s.done(); }
});

test('AUTO-HOLD service: a row still held \'dupe\' lifts at its next checkpoint; staff\'s clear and rollback forget the timed hold and its count', async () => {
  const s = await stand({ DEVELOPER_HANDLES: 'mac' });
  try {
    const A = await s.seat('old');
    s.raw.prepare("UPDATE realm_characters SET held = 'dupe', held_at = 1 WHERE id = ?").run(A.R.id);
    assert.equal((await s.put(A, [])).tradeHeld, null);
    const mac = await s.registered('mac');
    s.raw.prepare("UPDATE realm_characters SET held = 'law', held_until = ?, law_holds = 2, law_at = ?, strikes = 1 WHERE id = ?").run(s.now() + DAY, s.now() + DAY, A.R.id);
    assert.equal((await s.call('/v1/mod/realm-clear', { id: A.R.id }, mac.secret)).status, 200);
    assert.deepEqual(s.row(A.R.id), { ...s.row(A.R.id), held: null, held_until: null, strikes: 0, law_holds: 0, law_at: null });
    const review = s.raw.prepare('SELECT held_until, law_holds FROM realm_characters WHERE id = ?').get(A.R.id);
    assert.deepEqual({ ...review }, { held_until: null, law_holds: 0 });
    const src = readFileSync(new URL('../server-account/src/review.js', import.meta.url), 'utf8');
    assert.match(src, / held_until = NULL, strikes = 0, law_holds = 0, law_at = NULL, law_sig = NULL,/, 'the rollback forgets it too');
  } finally { s.done(); }
});

test('AUTO-HOLD migration 0120: every \'dupe\' hold lifted and written as a staff act; a law hold waiting for staff the first timed hold, a week on; nothing else moved', async () => {
  const s = await stand();
  try {
    const D = await s.seat('dup'), L = await s.seat('law'), K = await s.seat('kep'), F = await s.seat('few');
    const set = (c, held, strikes) => s.raw.prepare('UPDATE realm_characters SET held = ?, strikes = ?, held_until = NULL, law_holds = 0, law_at = NULL WHERE id = ?').run(held, strikes, c.R.id);
    set(D, 'dupe', 0); set(L, 'law', 3); set(K, 'staff', 3); set(F, 'law', 1);
    const revs = [D, L, K, F].map((c) => s.row(c.R.id).judge_rev);
    const sql = readFileSync(new URL('../server-account/migrations/0120_auto_hold.sql', import.meta.url), 'utf8');
    const dml = sql.split('\n').filter((l) => !l.startsWith('--') && !l.startsWith('ALTER TABLE')).join('\n');
    const before = Math.floor(realNowS());
    s.raw.exec(dml);
    assert.deepEqual([s.row(D.R.id).held, s.row(D.R.id).judge_rev], [null, revs[0] + 1]);
    assert.deepEqual(s.findings(D.R.id, 'staff'), [{ act: 'clear', by: 'auto-hold', was: 'dupe' }]);
    const l = s.row(L.R.id);
    assert.deepEqual([l.held, l.strikes, l.law_holds, l.judge_rev], ['law', 0, 1, revs[1] + 1]);
    assert.ok(l.held_until >= before + LAW_HOLD_S && l.held_until <= Math.ceil(realNowS()) + LAW_HOLD_S, 'a week from the migration');
    assert.equal(l.law_at, l.held_until);
    assert.deepEqual(s.findings(L.R.id, 'staff').map((f) => f.act), ['timed']);
    assert.deepEqual([s.row(K.R.id).held, s.row(K.R.id).held_until, s.row(K.R.id).judge_rev], ['staff', null, revs[2]], 'staff\'s own untouched');
    assert.deepEqual([s.row(F.R.id).held, s.row(F.R.id).held_until, s.row(F.R.id).judge_rev], ['law', null, revs[3]], 'a law hold under three: untouched');
  } finally { s.done(); }
});
/** The wall clock the migration's SQL reads (`new Date()` is the engine's own - the stand replaces only Date.now). */
const realNowS = () => new Date().getTime() / 1000;

test('AUTO-HOLD client: the realm session tells each locked piece ONCE, and a timed hold with its end; the notices name the piece', async () => {
  let now = T0;
  const realNow = Date.now;
  Date.now = () => now * 1000;
  try {
    const s = await standService();
    const who = await s.registered('told');
    const R = await seatRealm(s.env, who.secret, 'told');
    const kept = new Map([[SESSION_KEY, JSON.stringify({ id: who.id, secret: who.secret })]]);
    const storage = { get length() { return kept.size; }, key: (i) => [...kept.keys()][i] ?? null, getItem: (k) => (kept.has(k) ? kept.get(k) : null), setItem: (k, v) => { kept.set(k, String(v)); }, removeItem: (k) => { kept.delete(k); } };
    const at = R.at();
    const session = createRealmSession({ io: realmIo({ fetch: (u, i) => worker.fetch(new Request(u, i), s.env), storage }), id: at.id, lease: at.lease, seq: at.seq });
    const told = [];
    session.onPiecesLocked = (keys) => told.push(keys);
    const k1 = 'c3c3c3c3c3c3c3c3', k2 = 'd4d4d4d4d4d4d4d4';
    await session.checkpoint(JSON.stringify(freshSave({ name: 'told', items: [withId(k1), withId(k1)] })));
    await session.checkpoint(JSON.stringify(freshSave({ name: 'told', items: [withId(k1), withId(k1)] })));
    await session.checkpoint(JSON.stringify(freshSave({ name: 'told', items: [withId(k1), withId(k1), withId(k2), withId(k2)] })));
    assert.deepEqual(told, [[k1], [k2]], 'each once');
    // and a timed hold heard: told with its end, and told again when the end moves
    const held = [];
    session.onTradeHeld = (prev, now2, why) => held.push([prev, now2, why]);
    for (let i = 0; i < STRIKES_FOR_TIMED; i++) {
      await session.checkpoint(JSON.stringify(freshSave({ name: 'told', items: [ring()] })));
      await session.checkpoint(JSON.stringify(freshSave({ name: 'told' })));
    }
    const until = now + LAW_HOLD_S;
    assert.deepEqual(held.at(-1), [null, 'law', { code: 'until', t: 135, until }], 'the third: timed, said with its end and the piece');
    assert.deepEqual(session.tradeHeldWhy, { code: 'until', t: null, until }, 'the piece gone: the same hold, its end kept for a refusal to say - and not said again');
  } finally { Date.now = realNow; }
  // the notice: named from the pack, counted past three, a piece outside the pack locked all the same
  const a = withId('e5e5e5e5e5e5e5e5'), b = withId('f6f6f6f6f6f6f6f6', 12);
  const entity = { items: [a], wagonItems: [b] };
  assert.deepEqual(piecesByKey(entity, ['f6f6f6f6f6f6f6f6', 'e5e5e5e5e5e5e5e5', '0000000000000009']), [a, b]);
  assert.equal(piecesLockedNotice([itemLongName(a)], 1), `A copy of your ${itemLongName(a)} was found in the realm, so that piece is locked: it cannot be traded, sold to other players or stored for others. Your other pieces and your trading are not affected.`);
  assert.match(piecesLockedNotice([], 1), /^A copy of one of your pieces was found/);
  assert.match(piecesLockedNotice(['A', 'B', 'C', 'D'], 6), /^Copies of 6 of your pieces \(A, B, C, and 3 more\) were found in the realm, so those pieces are locked: they cannot be traded/);
  assert.equal(piecesLockedNotice([], 0), null);
  const said = [];
  const session = {};
  wireRealmHolds(session, { say: (t) => said.push(t), entity });
  session.onPiecesLocked(['e5e5e5e5e5e5e5e5']);
  session.onTradeHeld('law', 'law', { code: 'until', t: null, until: 1_800_000_000 });
  session.onTradeHeld('law', null, null);
  assert.deepEqual(said, [piecesLockedNotice([itemLongName(a)], 1), tradeHeldUntilNotice(1_800_000_000), 'This character\'s trading is open again.']);
  assert.equal(tradeHeldNotice(null, 'law', { code: 'until', until: 1_800_000_000 }), `The realm's law has held this character three times. Its trading is frozen until ${heldUntilText(1_800_000_000)}, then opens on its own.`);
  // the host wires it at one line (HOST-SPLIT)
  const world = readFileSync(new URL('../src/scenes/world.js', import.meta.url), 'utf8');
  assert.match(world, /^  wireRealmHolds\(realmSession, \{ say: \(t\) => townTalk\.say\(t\), entity: playerEntity \}\);$/m);
});

test('AUTO-HOLD shelf: the room\'s word never lands back a piece its reader carries, nor one piece twice; a piece the ledger does not follow lands as it always did; both landings in the interior host hand it the pack\'s keys', () => {
  const k = '7a7a7a7a7a7a7a7a';
  const wire = (it) => JSON.parse(JSON.stringify(it));
  const plain = createWeapon(113, 1, seeded(7));   // no tier: a piece the ledger does not follow
  const shelf = { items: [] };
  const ctx = { shelves: [shelf], containers: [] };
  const word = [{ k: 'shelf:0', r: [wire(withId(k)), wire(plain), wire(withId('8b8b8b8b8b8b8b8b', 12)), wire(withId('8b8b8b8b8b8b8b8b', 12))], d: 1 }];
  const carried = carriedLedgerKeys({ items: [withId(k)] });
  assert.deepEqual([...carried], [k]);
  assert.equal(applyInteriorLoot(ctx, word, { carried }), 1);
  assert.deepEqual(shelf.items.map(ledgerKeyOf), [null, '8b8b8b8b8b8b8b8b'], 'mine not back; the twice-named once; the plain piece as it was');
  assert.equal(shelf.items[0].templateIndex, 113);
  // nothing carried: the word lands whole, twice-named once
  applyInteriorLoot(ctx, word);
  assert.deepEqual(shelf.items.map(ledgerKeyOf), [k, null, '8b8b8b8b8b8b8b8b']);
  // the memory's landing hands it on
  const shelf2 = { items: [] };
  assert.equal(applyInteriorShared({ shelves: [shelf2], containers: [], actions: null }, { locationKey: 'L', stamp: 'x', world: { loot: word, actions: [] } }, { locationKey: 'L', stamp: 'y', carried }), true);
  assert.deepEqual(shelf2.items.map(ledgerKeyOf), [null, '8b8b8b8b8b8b8b8b']);
  assert.deepEqual(withoutCarried([withId(k), withId(k)], null).length, 1);
  const modes = readFileSync(new URL('../src/scenes/worldModes.js', import.meta.url), 'utf8');
  assert.equal(modes.match(/carried: carriedLedgerKeys\(playerEntity\)/g)?.length, 2, 'both landings');
  assert.match(modes, /applyInteriorShared\(interiorCtx, shared, \{ \.\.\._intShared, today: stockedToday\(\), carried: carriedLedgerKeys\(playerEntity\) \}\)/);
  assert.match(modes, /applyInteriorLoot\(interiorCtx, data\.l, \{ seen: _intShared\.seen, openKey: _intShared\.openKey, today: stockedToday\(\), unreadable: _intShared\.unreadable, carried: carriedLedgerKeys\(playerEntity\) \}\)/);
});
