// QL12 (2026-10-19, the owner: "New questlines tying into and introduced the oblivion gates, abyss dungeons, elite
// dungeons and elite breaches"; bible/06-Systems/Questlines-Arc.md sections 1 (decision 8) and 5.3): THE QUESTLINES'
// CLAIM, as the account service pays it - `POST /v1/ql/claim` (server-account/src/questlines.js claimQl). Pinned here:
// a step opened by its first claim and witnessed by a later one only against the place's own receipt row written at or
// after the opening (each witness kind - the rite, the breach, a Redoubt and no Rehearsal's, three of them, a Valkynaz's,
// an Hour, the Sea Serpent); a line's title once, and only behind its earlier witnessed steps; the Covens' Hoard's Weir
// Key once an account, kept, behind the Burning Doors' breach; a guest writes nothing; a bad body, a step paid nothing,
// the switch shut or at `dev`; the route listed and reachable; the vocabulary, its words and its colours. The real
// Worker over node:sqlite with every migration (test/accountDb.mjs), each receipt minted by its own producer and
// claimed through its own route, so the SQL itself is what is tested.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { standService, T0 } from '../accountDb.mjs';
import { mintReceipt } from '../../src/net/gate/gateReceipt.js';
import { mintEgReceipt } from '../../src/net/eliteGates/egReceipt.js';
import { mintSdReceipt } from '../../src/net/superDungeon/sdReceipt.js';
import { mintSerpentReceipt } from '../../src/net/serpent/serpentReceipt.js';
import { egValkRedoubt } from '../../src/net/eliteGates/egPay.js';
import { QL_SERVICE_LINES, QL_TITLES, QL_WITNESS_KINDS, qlTitleBit, qlStepClaimed } from '../../src/net/questlineClaims.js';
import { claimQl, QL_WITNESS_SQL, QL_STATUS, qlTitleSteps, qlSwitchOf, questlinesOpenFor } from '../../server-account/src/questlines.js';
import { titlesHeld } from '../../server-account/src/titles.js';
import { ROUTES, OPEN_ROUTES } from '../../server-account/src/service.js';
import { TITLES, verifyToken } from '../../src/net/identityToken.js';
import { TITLE_TEXT, TITLE_RGBA, cssRgba } from '../../src/ui/playerBadge.js';
import { honourEntry } from '../../src/ui/lootBanner.js';

const { subtle } = globalThis.crypto;
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const CH = 'char-0001';

/** A service standing with the questlines open (unless `extra` says otherwise), the clock at T0 and moved by `at`; each
 *  receipt minted by its producer at the clock's second and carried to its own route. */
async function stood(t, extra = {}) {
  let clock = T0 * 1000;
  t.mock.method(Date, 'now', () => clock);
  const S = await standService({ QUESTLINES_OPEN: 'on', ...extra });
  const raw = S.env.DB._raw;
  const now = () => Math.floor(clock / 1000);
  const at = (s) => { clock = s * 1000; };
  const ql = (who, line, step, choice) => S.call('/v1/ql/claim', { line, step, ...(choice !== undefined ? { choice } : {}) }, who.secret);
  let day = 600, slot = 7, rq = 0;
  /** A Dagon's Breach receipt claimed - a fighter's ('dealt'), a rite's own ('rite'), a fighter who broke the rite (r 1). */
  const gate = async (who, x = 'dealt', r = undefined) => {
    const res = await S.call('/v1/gate/claim', { receipt: await mintReceipt({ d: day++, b: 'ruhn', s: who.id, c: 4242, x, ...(r ? { r } : {}) }, S.gatePriv, { subtle, nowS: now() }) }, who.secret);
    assert.equal(res.body.recorded, true, `the gate's row is written (${JSON.stringify(res.body)})`);
    return res.body;
  };
  /** An Elite Breach opened (a key staked, or the day's Rehearsal), its live breach cleared so the next may open. */
  const breach = async (who, rh = 0) => {
    const o = (await S.call('/v1/eg/open', { rq: `rq${String(++rq).padStart(16, '0')}`, ...(rh ? { rh: 1 } : {}) }, who.secret)).body;
    assert.match(o.b ?? '', /^[0-9a-f]{16}$/, `opened (${JSON.stringify(o)})`);
    raw.prepare('UPDATE players SET eg_live_b = NULL, eg_live_until = 0 WHERE id = ?').run(who.id);
    return { b: o.b, ez: o.ez, rh };
  };
  /** A Redoubt's receipt claimed (its `eg_redoubts` row), a Rehearsal's carrying `rh`. */
  const redoubt = async (who, br, w) => {
    const receipt = await mintEgReceipt({ q: 'w', b: br.b, s: who.id, z: br.ez, c: 77 + w, w, h: w * 5, t: 900, n: 1, ew: 0, l: 12, ...(br.rh ? { rh: 1 } : {}) }, S.gatePriv, { subtle, nowS: now() });
    const res = await S.call('/v1/eg/claim', { receipt }, who.secret);
    assert.equal(res.body.recorded, true, `the Redoubt's row is written (${JSON.stringify(res.body)})`);
  };
  /** A breach's end claimed - a Rehearsal's carries `rh` onto its `eg_runs` row. */
  const end = async (who, br) => {
    const receipt = await mintEgReceipt({ q: 'x', b: br.b, s: who.id, z: br.ez, c: 5, h: 5, t: 960, n: 1, ew: 0, l: 12, why: br.rh ? 'rehearsal' : 'home', ...(br.rh ? { rh: 1 } : {}) }, S.gatePriv, { subtle, nowS: now() });
    assert.equal((await S.call('/v1/eg/claim', { receipt }, who.secret)).body.recorded, true);
  };
  /** An Hour broken - a Brass Remnant's receipt claimed (its `sd_kills` row). */
  const hour = async (who) => {
    const res = await S.call('/v1/sd/claim', { receipt: await mintSdReceipt({ d: slot++, s: who.id, c: 1, x: 'dealt', l: 30 }, S.gatePriv, { subtle, nowS: now() }) }, who.secret);
    assert.equal(res.body.recorded, true);
  };
  /** The Sea Serpent slain - its receipt claimed (its `serpent_kills` row). */
  const serpent = async (who, d = 363) => {
    const res = await S.call('/v1/serpent/claim', { receipt: await mintSerpentReceipt({ d, b: 'sethrakul', s: who.id, c: 99, x: 'dealt', h: 4, l: 20 }, S.gatePriv, { subtle, nowS: now() }), character: CH, name: who.handle }, who.secret);
    assert.equal(res.body.recorded, true, `the serpent's row is written (${JSON.stringify(res.body)})`);
  };
  const row = (who) => ({ ...raw.prepare('SELECT eg_keys, ql_titles, ql_key FROM players WHERE id = ?').get(who.id) });
  const steps = (who) => raw.prepare('SELECT line, step, opened_at, done_at, choice FROM ql_steps WHERE account = ? ORDER BY line, step').all(who.id).map((r) => ({ ...r }));
  return { S, raw, at, now, ql, gate, breach, redoubt, end, hour, serpent, row, steps };
}

test('QL12 THE LAW: every step the service pays is witnessable - by a kind this module reads or its line\'s `after` - and each kind has its SQL; a line\'s title waits on its witnessed steps before it; the switch reads off, dev and on; the Valkynaz\'s SQL is egValkRedoubt (mutants: a kind unread; the title\'s steps; the fifth)', async (t) => {
  for (const k of QL_WITNESS_KINDS) assert.equal(typeof QL_WITNESS_SQL[k], 'string', `${k} has a witness`);
  assert.deepEqual(Object.keys(QL_WITNESS_SQL).sort(), [...QL_WITNESS_KINDS].sort());
  for (const [line, l] of Object.entries(QL_SERVICE_LINES)) {
    for (let s = 0; s < l.steps; s++) {
      if (!qlStepClaimed(line, s)) continue;
      assert.ok(Object.hasOwn(l.witness, s) || l.after, `${line} step ${s}: paid, and witnessed by a receipt or its line's after - never the client's word`);
    }
  }
  assert.deepEqual(qlTitleSteps('burningDoors'), [2, 3], 'the rite, then the breach');
  assert.deepEqual(qlTitleSteps('covensHoard'), [2]);
  assert.deepEqual(qlTitleSteps('weirRoad'), [0, 1, 2]);
  assert.deepEqual(qlTitleSteps('hourThatWasNot'), [1]);
  assert.deepEqual(qlTitleSteps('oldCoil'), [2]);
  assert.deepEqual(qlTitleSteps('nope'), []);
  assert.deepEqual([qlSwitchOf('on'), qlSwitchOf('dev'), qlSwitchOf('off'), qlSwitchOf(undefined), qlSwitchOf('yes')], ['on', 'dev', 'off', 'off', 'off']);
  const dev = { handle: 'Mac' }, env = (v) => ({ QUESTLINES_OPEN: v, DEVELOPER_HANDLES: 'Mac' });
  assert.deepEqual([questlinesOpenFor(dev, env('on')), questlinesOpenFor({ handle: 'Ann' }, env('on'))], [true, true]);
  assert.deepEqual([questlinesOpenFor(dev, env('dev')), questlinesOpenFor({ handle: 'Ann' }, env('dev'))], [true, false], 'dev: the developers alone');
  assert.deepEqual([questlinesOpenFor(dev, env('off')), questlinesOpenFor(dev, {})], [false, false], 'off, and off by default');
  assert.deepEqual({ ...QL_STATUS }, { 'ql-closed': 403, 'ql-body': 400 });
  // the Valkynaz's witness is egPay.js egValkRedoubt in SQL - asked of the real tables, one Redoubt's row at a time, every
  // Redoubt a receipt may name to 60
  const { S, raw } = await stood(t);
  const me = await S.registered('ValkProbe');
  raw.prepare("INSERT INTO ql_steps (account, line, step, opened_at) VALUES (?, 'probe', 0, 10)").run(me.id);
  const ask = raw.prepare(`SELECT ${QL_WITNESS_SQL.valkynaz} AS ok FROM ql_steps WHERE account = ?1 AND line = 'probe' AND step = 0`);
  for (let w = 1; w <= 60; w++) {
    raw.prepare('DELETE FROM eg_redoubts WHERE account = ?').run(me.id);
    raw.prepare("INSERT INTO eg_redoubts (b, account, w, h, t, at) VALUES ('0123456789abcdef', ?, ?, 1, 1, 10)").run(me.id, w);
    assert.equal(ask.get(me.id).ok === 1, egValkRedoubt(w), `w ${w}`);
  }
});

test('QL12 THE BURNING DOORS: the first claim opens a step; a receipt from before the opening witnesses nothing, one at or after it does - the rite by a rite\'s own receipt or a fighter\'s that broke it, never a plain kill; the breach by a kill, never the rite alone; the Doorwarden once, on the step that completes the line\'s witnessed steps (mutants: `>=` for `>`; the rite\'s embers; the breach\'s rite; the title\'s steps; the title\'s guard)', async (t) => {
  const { S, at, ql, gate, row, steps } = await stood(t);
  const me = await S.registered('Doorward');
  // A RECEIPT FROM BEFORE: a breach closed and a rite broken at T0, the steps opened after
  await gate(me, 'dealt', 1);
  await gate(me, 'rite');
  at(T0 + 100);
  assert.deepEqual(await ql(me, 'burningDoors', 2), { status: 200, body: { opened: true } }, 'the rite\'s step opened');
  assert.deepEqual(await ql(me, 'burningDoors', 2), { status: 200, body: { witnessed: false } }, 'the T0 receipts predate it: nothing witnessed');
  assert.deepEqual(steps(me), [{ line: 'burningDoors', step: 2, opened_at: T0 + 100, done_at: null, choice: null }], 'one row, opened, nothing written by the unwitnessed claim');
  // A PLAIN KILL IS NO RITE
  at(T0 + 200);
  await gate(me, 'dealt');
  assert.deepEqual((await ql(me, 'burningDoors', 2)).body, { witnessed: false }, 'a fighter who broke no rite');
  // THE BREACH'S STEP opened, and witnessed out of order - before the rite's: no title yet
  at(T0 + 300);
  assert.deepEqual((await ql(me, 'burningDoors', 3)).body, { opened: true });
  at(T0 + 301);
  assert.deepEqual((await ql(me, 'burningDoors', 3)).body, { witnessed: false }, 'the T0+200 kill predates the breach\'s opening');
  // THE RITE ALONE IS NO BREACH CLOSED
  at(T0 + 400);
  await gate(me, 'rite');
  assert.deepEqual((await ql(me, 'burningDoors', 3)).body, { witnessed: false }, 'the rite alone closes no breach');
  // A KILL AT THE OPENING'S OWN SECOND IS AFTER IT - and the breach is witnessed, the rite still not: no Doorwarden yet
  const me2 = await S.registered('Doorward2');
  at(T0 + 500);
  assert.deepEqual((await ql(me2, 'burningDoors', 3)).body, { opened: true });
  await gate(me2, 'dealt');
  assert.deepEqual((await ql(me2, 'burningDoors', 3)).body, { witnessed: true }, 'a receipt written at the opening\'s second counts');
  at(T0 + 600);
  await gate(me, 'dealt');
  assert.deepEqual((await ql(me, 'burningDoors', 3)).body, { witnessed: true }, 'the breach witnessed - the rite not yet, so no title');
  assert.equal(row(me).ql_titles, 0);
  // THE RITE WITNESSED by the T0+400 rite's own receipt (after the T0+100 opening) - the line's witnessed steps complete:
  // the Doorwarden, told once
  assert.deepEqual((await ql(me, 'burningDoors', 2)).body, { witnessed: true, title: 'doorwarden' }, 'the last witnessed step pays the title');
  assert.equal(row(me).ql_titles, qlTitleBit('doorwarden'));
  assert.deepEqual((await ql(me, 'burningDoors', 2)).body, { witnessed: true }, 'told once');
  assert.deepEqual((await ql(me, 'burningDoors', 3)).body, { witnessed: true }, 'and once on any step');
  assert.deepEqual(steps(me).map((s) => [s.step, s.done_at]), [[2, T0 + 600], [3, T0 + 600]]);
  // A FIGHTER WHO BROKE THE RITE (two embers) witnesses it too; in order, the title comes on the breach's step
  const f = await S.registered('RiteBreaker');
  at(T0 + 700);
  await ql(f, 'burningDoors', 2);
  await gate(f, 'dealt', 1);
  assert.deepEqual((await ql(f, 'burningDoors', 2)).body, { witnessed: true }, 'a fighter\'s receipt that broke the rite');
  at(T0 + 800);
  await ql(f, 'burningDoors', 3);
  await gate(f, 'dealt');
  assert.deepEqual((await ql(f, 'burningDoors', 3)).body, { witnessed: true, title: 'doorwarden' });
  // THE TITLE ON THE ROW: held, on the wardrobe and worn, signed into a token
  assert.ok(titlesHeld({ handle: 'RiteBreaker', ql_titles: qlTitleBit('doorwarden') }, {}).includes('doorwarden'));
  const acct = await (await S.fetch('https://accounts.invalid/v1/account', { headers: { authorization: `Bearer ${f.secret}` } })).json();
  assert.ok(acct.wardrobe.titles.includes('doorwarden'), 'on the wardrobe');
  assert.equal((await S.call('/v1/account/title', { title: 'doorwarden' }, f.secret)).status, 200, 'and worn');
  const tok = (await S.call('/v1/auth/token', { secret: f.secret })).body.token;
  const v = await verifyToken(tok, S.identityPublic, { subtle, nowS: T0 + 800 });
  assert.ok(v.ok, v.why);
  assert.equal(v.claims.t, 'doorwarden', 'the vocabulary signs it, and the relay\'s verifier keeps it');
});

test('QL12 THE WEIR ROAD: a Redoubt\'s row witnesses `redoubt`, a Rehearsal\'s never (its stake says so, or its end where the stake is gone); three Redoubts witness `redoubts3`; a Valkynaz\'s - every fifth - witnesses `valkynaz`; the Weirwalker after all three (mutants: the Rehearsal\'s stake; its end; the count; the fifth)', async (t) => {
  const { S, raw, at, ql, gate, breach, redoubt, end, row } = await stood(t);
  const me = await S.registered('Weirwalker1');
  await gate(me);   // proven, and the first breach's key
  at(T0 + 100);
  assert.deepEqual((await ql(me, 'weirRoad', 0)).body, { opened: true });
  // A REHEARSAL'S REDOUBT witnesses nothing - its stake is a Rehearsal's
  at(T0 + 200);
  const rh = await breach(me, 1);
  await redoubt(me, rh, 1);
  assert.deepEqual((await ql(me, 'weirRoad', 0)).body, { witnessed: false }, 'a Rehearsal\'s Redoubt');
  // and where its stake is gone (its opener's account gone with it), its end says so
  await redoubt(me, rh, 2);
  await end(me, rh);
  raw.prepare('DELETE FROM eg_stakes WHERE b = ?').run(rh.b);
  assert.deepEqual((await ql(me, 'weirRoad', 0)).body, { witnessed: false }, 'a Rehearsal\'s Redoubt with no stake: its end');
  // A BREACH'S REDOUBT witnesses it
  at(T0 + 86_400);
  const br = await breach(me);
  await redoubt(me, br, 1);
  assert.deepEqual((await ql(me, 'weirRoad', 0)).body, { witnessed: true });
  // THREE REDOUBTS since the step opened - the one before the opening counts not
  at(T0 + 86_500);
  assert.deepEqual((await ql(me, 'weirRoad', 1)).body, { opened: true });
  await redoubt(me, br, 2);
  await redoubt(me, br, 3);
  assert.deepEqual((await ql(me, 'weirRoad', 1)).body, { witnessed: false }, 'two since the opening (the first was before it)');
  await redoubt(me, br, 4);
  assert.deepEqual((await ql(me, 'weirRoad', 1)).body, { witnessed: true }, 'three');
  // A VALKYNAZ'S REDOUBT - every fifth
  at(T0 + 86_600);
  assert.deepEqual((await ql(me, 'weirRoad', 2)).body, { opened: true });
  await redoubt(me, br, 9);
  assert.deepEqual((await ql(me, 'weirRoad', 2)).body, { witnessed: false }, 'the ninth is no Valkynaz\'s');
  await redoubt(me, br, 10);
  assert.deepEqual((await ql(me, 'weirRoad', 2)).body, { witnessed: true, title: 'weirwalker' }, 'the tenth is, and the line\'s three are done');
  assert.equal(row(me).ql_titles, qlTitleBit('weirwalker'));
  // the Weirwalker waits on every witnessed step before it
  const you = await S.registered('Weirwalker2');
  await gate(you);
  at(T0 + 86_700);
  await ql(you, 'weirRoad', 2);
  const b3 = await breach(you);
  await redoubt(you, b3, 5);
  assert.deepEqual((await ql(you, 'weirRoad', 2)).body, { witnessed: true }, 'the Valkynaz\'s step alone: no title');
  assert.equal(row(you).ql_titles, 0);
});

test('QL12 THE HOUR AND THE OLD COIL: an Hour broken witnesses the Hour\'s step and a serpent slain the Coil\'s, each only after its opening - and each pays its line\'s title (mutants: the Hour\'s table; the serpent\'s; the opening ignored)', async (t) => {
  const { S, at, ql, hour, serpent, row } = await stood(t);
  const me = await S.registered('Witness', { character: CH });
  await hour(me);
  await serpent(me, 363);
  at(T0 + 100);
  assert.deepEqual((await ql(me, 'hourThatWasNot', 1)).body, { opened: true });
  assert.deepEqual((await ql(me, 'oldCoil', 2)).body, { opened: true });
  assert.deepEqual((await ql(me, 'hourThatWasNot', 1)).body, { witnessed: false }, 'the Hour broken before');
  assert.deepEqual((await ql(me, 'oldCoil', 2)).body, { witnessed: false }, 'the serpent slain before');
  at(T0 + 200);
  await hour(me);
  assert.deepEqual((await ql(me, 'oldCoil', 2)).body, { witnessed: false }, 'an Hour is no serpent');
  assert.deepEqual((await ql(me, 'hourThatWasNot', 1)).body, { witnessed: true, title: 'hourwitness' });
  at(T0 + 2 * 86_400 + 200);
  await serpent(me, 365);
  assert.deepEqual((await ql(me, 'oldCoil', 2)).body, { witnessed: true, title: 'satakalwitness' });
  assert.equal(row(me).ql_titles, qlTitleBit('hourwitness') | qlTitleBit('satakalwitness'));
  assert.deepEqual(titlesHeld({ handle: 'Witness', ql_titles: row(me).ql_titles }, {}).filter((x) => QL_TITLES.includes(x)), ['hourwitness', 'satakalwitness']);
});

test('QL12 THE COVENS\' HOARD: its last step is witnessed only behind the Burning Doors\' breach; Covenbane on it; the Weir Key once an account - to a player who keeps it, the choice the first one said, never to one who sealed it, and never twice (mutants: the after-gate; the choice; the key\'s guard; the balance)', async (t) => {
  const { S, at, ql, gate, row, steps } = await stood(t);
  const me = await S.registered('Keeper');
  at(T0 + 100);
  assert.deepEqual((await ql(me, 'covensHoard', 2, 'keep')).body, { opened: true });
  assert.deepEqual((await ql(me, 'covensHoard', 2, 'keep')).body, { witnessed: false }, 'the Burning Doors\' breach not yet witnessed');
  assert.deepEqual(row(me), { eg_keys: 0, ql_titles: 0, ql_key: 0 }, 'nothing paid');
  await ql(me, 'burningDoors', 3);
  at(T0 + 200);
  await gate(me);   // the first breach closed: the Spire's certain key
  assert.deepEqual((await ql(me, 'burningDoors', 3)).body, { witnessed: true });
  const before = row(me).eg_keys;
  const paid = (await ql(me, 'covensHoard', 2, 'keep')).body;
  assert.deepEqual(paid, { witnessed: true, title: 'covenbane', key: true, keys: before + 1 }, 'kept: the key, its balance, and Covenbane');
  assert.deepEqual(row(me), { eg_keys: before + 1, ql_titles: qlTitleBit('covenbane'), ql_key: 1 });
  assert.deepEqual((await ql(me, 'covensHoard', 2, 'keep')).body, { witnessed: true }, 'once an account');
  assert.equal(row(me).eg_keys, before + 1, 'no second key');
  // SEALED: the title, no key - and the choice the first claim said stands
  const seal = await S.registered('Sealer');
  at(T0 + 300);
  await ql(seal, 'burningDoors', 3);
  await gate(seal);
  await ql(seal, 'burningDoors', 3);
  await ql(seal, 'covensHoard', 2);
  const k0 = row(seal).eg_keys;
  assert.deepEqual((await ql(seal, 'covensHoard', 2, 'seal')).body, { witnessed: true, title: 'covenbane' });
  assert.deepEqual((await ql(seal, 'covensHoard', 2, 'keep')).body, { witnessed: true }, 'sealed is sealed');
  assert.deepEqual([row(seal).eg_keys, row(seal).ql_key], [k0, 0]);
  assert.equal(steps(seal).find((s) => s.line === 'covensHoard').choice, 'seal');
  // A STEP DONE BY A CLAIM WITH NO CHOICE (an opening asked again) takes the next claim's
  const late = await S.registered('LateKeeper');
  at(T0 + 400);
  await ql(late, 'burningDoors', 3);
  await gate(late);
  await ql(late, 'burningDoors', 3);
  await ql(late, 'covensHoard', 2);
  const k1 = row(late).eg_keys;
  assert.deepEqual((await ql(late, 'covensHoard', 2)).body, { witnessed: true, title: 'covenbane' }, 'done, undecided');
  assert.deepEqual((await ql(late, 'covensHoard', 2, 'keep')).body, { witnessed: true, key: true, keys: k1 + 1 }, 'then kept');
});

test('QL12 THE REFUSALS: a guest writes nothing; a bad body is 400; a step the service pays nothing is `unpaid`; the switch shut is 403 for everyone, at `dev` for all but the developers (mutants: the guest; the switch; qlStepClaimed)', async (t) => {
  const { S, raw, ql } = await stood(t, { DEVELOPER_HANDLES: 'DevOne' });
  const g = await S.guest();
  assert.deepEqual(await ql(g, 'burningDoors', 3), { status: 200, body: { why: 'guest' } });
  assert.equal(raw.prepare('SELECT COUNT(*) AS n FROM ql_steps').get().n, 0, 'a guest writes nothing');
  const me = await S.registered('Plain');
  for (const bad of [{}, { line: 'nope', step: 0 }, { line: 'burningDoors', step: 5 }, { line: 'burningDoors', step: -1 }, { line: 'burningDoors', step: '3' }, { line: 'covensHoard', step: 2, choice: 'KEEP' }]) {
    assert.deepEqual(await S.call('/v1/ql/claim', bad, me.secret), { status: 400, body: { error: 'ql-body' } }, JSON.stringify(bad));
  }
  assert.deepEqual(await ql(me, 'burningDoors', 0), { status: 200, body: { why: 'unpaid' } }, 'the letter is the client\'s alone');
  assert.deepEqual(await ql(me, 'weirRoad', 3), { status: 200, body: { why: 'unpaid' } });
  assert.equal(raw.prepare('SELECT COUNT(*) AS n FROM ql_steps').get().n, 0);
  // the switch, read as FIRMAMENT_OPEN is
  const ctx = { db: S.env.DB };
  const dev = { id: 'x', handle: 'DevOne' }, plain = { id: 'y', handle: 'Plain' };
  for (const env of [{}, { QUESTLINES_OPEN: 'off' }]) assert.deepEqual(await claimQl({ ...ctx, env }, dev, { line: 'burningDoors', step: 3 }, T0), { error: 'ql-closed' });
  assert.deepEqual(await claimQl({ ...ctx, env: { QUESTLINES_OPEN: 'dev', DEVELOPER_HANDLES: 'DevOne' } }, plain, { line: 'burningDoors', step: 3 }, T0), { error: 'ql-closed' });
});

test('QL12 THE SWITCH THROUGH THE WORKER: at `dev` the developers claim and nobody else; `off` is 403 for everyone (mutants: the switch; dev open to all)', async (t) => {
  const D = await stood(t, { QUESTLINES_OPEN: 'dev', DEVELOPER_HANDLES: 'DevOne' });
  const devAcct = await D.S.registered('DevOne'), other = await D.S.registered('NotDev');
  assert.deepEqual(await D.ql(other, 'burningDoors', 3), { status: 403, body: { error: 'ql-closed' } });
  assert.deepEqual(await D.ql(devAcct, 'burningDoors', 3), { status: 200, body: { opened: true } });
  assert.equal(D.raw.prepare('SELECT COUNT(*) AS n FROM ql_steps').get().n, 1, 'the refused claim wrote nothing');
  const Off = await standService({ QUESTLINES_OPEN: 'off' });
  const anyone = await Off.registered('Anyone');
  assert.deepEqual(await Off.call('/v1/ql/claim', { line: 'burningDoors', step: 3 }, anyone.secret), { status: 403, body: { error: 'ql-closed' } });
});

test('QL12 THE ROUTE (AUDIT FIVE-ASKS A1\'s lesson): /v1/ql/claim is listed, behind a session and never open; a stranger is refused; the header names it; the config opens it; the migration lays its table and columns', async (t) => {
  assert.ok(ROUTES.has('/v1/ql/claim') && !OPEN_ROUTES.has('/v1/ql/claim'), 'a route the worker answers, behind a session');
  const { S } = await stood(t);
  assert.equal((await S.call('/v1/ql/claim', { line: 'burningDoors', step: 3 })).status, 401, 'a stranger claims nothing');
  const index = read('server-account/src/index.js');
  assert.match(index, /\/\/ {3}POST \/v1\/ql\/claim {4}\{ line, step, choice\? \}/, 'the header\'s route list');
  assert.match(index, /if \(path === '\/v1\/ql\/claim' && request\.method === 'POST'\) \{/);
  assert.match(read('server-account/wrangler.toml'), /^QUESTLINES_OPEN = "on"$/m);
  const sql = read('server-account/migrations/0133_questlines.sql');
  assert.match(sql, /^CREATE TABLE IF NOT EXISTS ql_steps \(/m);
  assert.match(sql, /^ {2}PRIMARY KEY \(account, line, step\),$/m);
  assert.match(sql, /^ALTER TABLE players ADD COLUMN ql_titles INTEGER NOT NULL DEFAULT 0;$/m);
  assert.match(sql, /^ALTER TABLE players ADD COLUMN ql_key INTEGER NOT NULL DEFAULT 0;$/m);
  assert.match(read('.github/workflows/account-deploy.yml'), /^ {6}- "src\/net\/questlineClaims\.js"$/m, 'the shared law deploys the service');
});

test('QL12 THE VOCABULARY: the five join TITLES last, in QL_TITLES\' order; a registered row holds each by its bit and a guest none; their words; their colours - each its own, more than 40 from every title\'s; a title\'s loot banner (mutants: the order; the guest; a word)', () => {
  assert.deepEqual(TITLES.slice(-5), [...QL_TITLES]);
  assert.deepEqual([...QL_TITLES], ['doorwarden', 'covenbane', 'weirwalker', 'hourwitness', 'satakalwitness']);
  for (const t of QL_TITLES) {
    assert.deepEqual(titlesHeld({ handle: 'Mac', ql_titles: qlTitleBit(t) }, {}), [t], `${t} by its bit alone`);
    assert.deepEqual(titlesHeld({ handle: null, ql_titles: 31 }, {}), [], 'a guest row holds none');
  }
  assert.deepEqual(titlesHeld({ handle: 'Mac', ql_titles: 31 }, {}), [...QL_TITLES], 'all five, in the lines\' order');
  assert.deepEqual(QL_TITLES.map((t) => TITLE_TEXT[t]), ['Doorwarden', 'Covenbane', 'Weirwalker', 'Witness of the Hour', "Satakal's Witness"]);
  assert.deepEqual(QL_TITLES.map((t) => cssRgba(TITLE_RGBA[t])), ['#e8400c', '#d0aa10', '#1f5fff', '#ada530', '#12b8b8'], 'the ember, the coven\'s gold, the Spire\'s blue, Akatosh\'s brass, the sea\'s teal');
  const apart = (a, b) => Math.hypot(...[0, 1, 2].map((i) => (a[i] - b[i]) * 255));
  for (const t of QL_TITLES) {
    for (const o of TITLES.filter((x) => x !== t)) assert.ok(apart(TITLE_RGBA[t], TITLE_RGBA[o]) > 40, `${t} apart from the ${o}'s (${apart(TITLE_RGBA[t], TITLE_RGBA[o]).toFixed(0)})`);
  }
  const e = honourEntry({ kind: 'title', key: 'satakalwitness' });
  assert.deepEqual([e.name, e.kicker, e.honour.rgba], ["Satakal's Witness", 'New Title', TITLE_RGBA.satakalwitness], 'its loot banner');
});
