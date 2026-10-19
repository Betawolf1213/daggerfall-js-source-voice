test('QL12 THE BURNING DOORS: an `open` writes the step\'s opening; an `end` reads its witness - a receipt from before the LINE\'s first opening witnesses nothing, one at or after it does - the rite by a rite\'s own receipt or a fighter\'s that broke it, never a plain kill; the breach by a kill, never the rite alone; the Doorwarden once, on the step that completes the line\'s witnessed steps (mutants: `>=` for `>`; the rite\'s embers; the breach\'s rite; the title\'s steps; the title\'s guard)', async (t) => {
  const { S, at, open, ql, gate, row, steps } = await stood(t);
  const me = await S.registered('Doorward');
  // A RECEIPT FROM BEFORE: a breach closed and a rite broken at T0, the line opened after
  await gate(me, 'dealt', 1);
  await gate(me, 'rite');
  at(T0 + 100);
  assert.deepEqual(await open(me, 'burningDoors', 2), { status: 200, body: { opened: true } }, 'the rite\'s step opened');
  assert.deepEqual(await open(me, 'burningDoors', 2), { status: 200, body: { opened: true } }, 'an opening asked again opens once, and pays nothing');
  assert.deepEqual(await ql(me, 'burningDoors', 2), { status: 200, body: { witnessed: false } }, 'the T0 receipts predate the line: nothing witnessed');
  assert.deepEqual(steps(me), [{ line: 'burningDoors', step: 2, opened_at: T0 + 100, done_at: null, seen_at: null, choice: null }], 'one row, opened, nothing written by the unwitnessed end');
  // A PLAIN KILL IS NO RITE
  at(T0 + 200);
  await gate(me, 'dealt');
  assert.deepEqual((await ql(me, 'burningDoors', 2)).body, { witnessed: false }, 'a fighter who broke no rite');
  // THE RITE ALONE IS NO BREACH CLOSED
  at(T0 + 300);
  await gate(me, 'rite');
  assert.deepEqual((await ql(me, 'burningDoors', 2)).body, { witnessed: true }, 'the rite\'s own receipt, after the line\'s opening');
  assert.deepEqual((await open(me, 'burningDoors', 3)).body, { opened: true });
  assert.deepEqual((await ql(me, 'burningDoors', 3)).body, { witnessed: false }, 'the rite alone closes no breach - and the T0+200 kill is older than the rite that witnessed the step before');
  // THE BREACH WITNESSED: the line's witnessed steps complete - the Doorwarden, told once
  at(T0 + 400);
  await gate(me, 'dealt');
  assert.deepEqual((await ql(me, 'burningDoors', 3)).body, { witnessed: true, title: 'doorwarden' }, 'the last witnessed step pays the title');
  assert.equal(row(me).ql_titles, qlTitleBit('doorwarden'));
  assert.deepEqual((await ql(me, 'burningDoors', 3)).body, { witnessed: true }, 'told once');
  assert.deepEqual((await ql(me, 'burningDoors', 2)).body, { witnessed: true }, 'and once on any step');
  assert.deepEqual(steps(me).map((s) => [s.step, s.done_at, s.seen_at]), [[2, T0 + 300, T0 + 300], [3, T0 + 400, T0 + 400]], 'each step the receipt that witnessed it');
  // A KILL AT THE LINE'S OPENING'S OWN SECOND IS AFTER IT
  const me2 = await S.registered('Doorward2');
  at(T0 + 500);
  assert.deepEqual((await open(me2, 'burningDoors', 3)).body, { opened: true });
  await gate(me2, 'dealt');
  assert.deepEqual((await ql(me2, 'burningDoors', 3)).body, { witnessed: true }, 'a receipt written at the opening\'s second counts - the rite not yet, so no title');
  assert.equal(row(me2).ql_titles, 0);
  // ONE FIGHT, ONE STEP (AUDIT QUESTLINES SERVICE-5): a fighter who broke the rite (two embers) witnesses the rite - and
  // that one receipt never the breach as well; the breach is its own fight's
  const f = await S.registered('RiteBreaker');
  at(T0 + 700);
  await open(f, 'burningDoors', 2);
  await gate(f, 'dealt', 1);
  assert.deepEqual((await ql(f, 'burningDoors', 2)).body, { witnessed: true }, 'a fighter\'s receipt that broke the rite');
  await open(f, 'burningDoors', 3);
  assert.deepEqual((await ql(f, 'burningDoors', 3)).body, { witnessed: false }, 'the same receipt witnesses one step');
  at(T0 + 800);
  await gate(f, 'dealt');
  assert.deepEqual((await ql(f, 'burningDoors', 3)).body, { witnessed: true, title: 'doorwarden' });
  // IN THE LINE'S ORDER, WHICHEVER END LANDS FIRST: the breach's end before the rite's - the rite's window closes at the
  // breach's receipt, and the rite before it still witnesses its step
  const o = await S.registered('OutOfOrder');
  at(T0 + 900);
  await open(o, 'burningDoors', 2);
  await gate(o, 'rite');
  at(T0 + 950);
  await gate(o, 'dealt');
  assert.deepEqual((await ql(o, 'burningDoors', 3)).body, { witnessed: true }, 'the breach\'s end first');
  assert.deepEqual((await ql(o, 'burningDoors', 2)).body, { witnessed: true, title: 'doorwarden' }, 'the rite, older than the breach\'s receipt');
  // THE TITLE ON THE ROW: held, on the wardrobe and worn, signed into a token
  assert.ok(titlesHeld({ handle: 'RiteBreaker', ql_titles: qlTitleBit('doorwarden') }, {}).includes('doorwarden'));
  const acct = await (await S.fetch('https://accounts.invalid/v1/account', { headers: { authorization: `Bearer ${f.secret}` } })).json();
  assert.ok(acct.wardrobe.titles.includes('doorwarden'), 'on the wardrobe');
  assert.equal((await S.call('/v1/account/title', { title: 'doorwarden' }, f.secret)).status, 200, 'and worn');
  const tok = (await S.call('/v1/auth/token', { secret: f.secret })).body.token;
  const v = await verifyToken(tok, S.identityPublic, { subtle, nowS: T0 + 950 });
  assert.ok(v.ok, v.why);
  assert.equal(v.claims.t, 'doorwarden', 'the vocabulary signs it, and the relay\'s verifier keeps it');
});

test('QL12 THE WEIR ROAD: a Redoubt\'s row witnesses `redoubt`, a Rehearsal\'s never (its stake says so, or its end where the stake is gone); three Redoubts newer than the one that witnessed the step before witness `redoubts3`; a Valkynaz\'s - every fifth - witnesses `valkynaz`; the Weirwalker after all three (mutants: the Rehearsal\'s stake; its end; the count; the fifth; the order)', async (t) => {
  const { S, raw, at, open, ql, gate, breach, redoubt, end, row } = await stood(t);
  const me = await S.registered('Weirwalker1');
  await gate(me);   // proven, and the first breach's key
  at(T0 + 100);
  assert.deepEqual((await open(me, 'weirRoad', 0)).body, { opened: true });
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
  // THREE REDOUBTS newer than the one that witnessed the step before - that one counts not again
  at(T0 + 86_500);
  assert.deepEqual((await open(me, 'weirRoad', 1)).body, { opened: true });
  await redoubt(me, br, 2);
  await redoubt(me, br, 3);
  assert.deepEqual((await ql(me, 'weirRoad', 1)).body, { witnessed: false }, 'two newer (the first witnessed the step before)');
  await redoubt(me, br, 4);
  assert.deepEqual((await ql(me, 'weirRoad', 1)).body, { witnessed: true }, 'three');
  // A VALKYNAZ'S REDOUBT - every fifth
  at(T0 + 86_600);
  assert.deepEqual((await open(me, 'weirRoad', 2)).body, { opened: true });
  await redoubt(me, br, 9);
  assert.deepEqual((await ql(me, 'weirRoad', 2)).body, { witnessed: false }, 'the ninth is no Valkynaz\'s');
  await redoubt(me, br, 10);
  assert.deepEqual((await ql(me, 'weirRoad', 2)).body, { witnessed: true, title: 'weirwalker' }, 'the tenth is, and the line\'s three are done');
  assert.equal(row(me).ql_titles, qlTitleBit('weirwalker'));
  // the Weirwalker waits on every witnessed step before it
  const you = await S.registered('Weirwalker2');
  await gate(you);
  at(T0 + 86_700);
  await open(you, 'weirRoad', 2);
  const b3 = await breach(you);
  await redoubt(you, b3, 5);
  assert.deepEqual((await ql(you, 'weirRoad', 2)).body, { witnessed: true }, 'the Valkynaz\'s step alone: no title');
  assert.equal(row(you).ql_titles, 0);
});

test('QL12 THE HOUR AND THE OLD COIL: an Hour broken witnesses the Hour\'s step and a serpent slain the Coil\'s, each only after its line\'s opening - and each pays its line\'s title (mutants: the Hour\'s table; the serpent\'s; the opening ignored)', async (t) => {
  const { S, at, open, ql, hour, serpent, row } = await stood(t);
  const me = await S.registered('Witness', { character: CH });
  await hour(me);
  await serpent(me, 363);
  at(T0 + 100);
  assert.deepEqual((await open(me, 'hourThatWasNot', 1)).body, { opened: true });
  assert.deepEqual((await open(me, 'oldCoil', 2)).body, { opened: true });
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

test('QL12 THE COVENS\' HOARD: its last step is witnessed only behind the Burning Doors witnessed whole (the Doorwarden held - never its breach alone); Covenbane on its END, never its opening; the Weir Key once an account - to a player who keeps it, the choice the first end said, never to one who sealed it, and never twice (mutants: the after-gate; the opening paying; the choice; the key\'s guard; the balance)', async (t) => {
  const { S, at, open, ql, gate, row, steps } = await stood(t);
  /** The Burning Doors witnessed whole at `s`: the line opened, a rite, its end, a breach, its end. */
  const doors = async (who, s) => {
    at(s);
    await open(who, 'burningDoors', 2);
    await gate(who, 'rite');
    await ql(who, 'burningDoors', 2);
    at(s + 10);
    await gate(who);
    assert.deepEqual((await ql(who, 'burningDoors', 3)).body, { witnessed: true, title: 'doorwarden' });
  };
  const me = await S.registered('Keeper');
  at(T0 + 100);
  assert.deepEqual((await open(me, 'covensHoard', 2)).body, { opened: true });
  assert.deepEqual((await ql(me, 'covensHoard', 2, 'keep')).body, { witnessed: false }, 'the Burning Doors not yet witnessed');
  assert.deepEqual(row(me), { eg_keys: 0, ql_titles: 0, ql_key: 0 }, 'nothing paid');
  // THE BREACH ALONE IS NOT THE LINE WHOLE (AUDIT QUESTLINES SERVICE-4)
  await open(me, 'burningDoors', 2);
  at(T0 + 120);
  await gate(me, 'rite');
  at(T0 + 150);
  await gate(me);   // the first breach closed: the Spire's certain key
  assert.deepEqual((await ql(me, 'burningDoors', 3)).body, { witnessed: true }, 'the breach witnessed');
  assert.deepEqual((await ql(me, 'covensHoard', 2, 'keep')).body, { witnessed: false }, 'the breach alone: the Doorwarden not held');
  assert.deepEqual((await ql(me, 'burningDoors', 2)).body, { witnessed: true, title: 'doorwarden' }, 'the rite, before the breach: the line whole');
  // AN OPENING ASKED AGAIN PAYS NOTHING (SERVICE-6: Covenbane was told at QLCH03's start)
  assert.deepEqual((await open(me, 'covensHoard', 2)).body, { opened: true });
  assert.equal(row(me).ql_titles & qlTitleBit('covenbane'), 0, 'no Covenbane at the opening');
  const before = row(me).eg_keys;
  const paid = (await ql(me, 'covensHoard', 2, 'keep')).body;
  assert.deepEqual(paid, { witnessed: true, title: 'covenbane', key: true, keys: before + 1 }, 'kept: the key, its balance, and Covenbane');
  assert.deepEqual(row(me), { eg_keys: before + 1, ql_titles: qlTitleBit('doorwarden') | qlTitleBit('covenbane'), ql_key: 1 });
  assert.deepEqual((await ql(me, 'covensHoard', 2, 'keep')).body, { witnessed: true }, 'once an account');
  assert.equal(row(me).eg_keys, before + 1, 'no second key');
  // SEALED: the title, no key - and the choice the first end said stands
  const seal = await S.registered('Sealer');
  await doors(seal, T0 + 300);
  await open(seal, 'covensHoard', 2);
  const k0 = row(seal).eg_keys;
  assert.deepEqual((await ql(seal, 'covensHoard', 2, 'seal')).body, { witnessed: true, title: 'covenbane' });
  assert.deepEqual((await ql(seal, 'covensHoard', 2, 'keep')).body, { witnessed: true }, 'sealed is sealed');
  assert.deepEqual([row(seal).eg_keys, row(seal).ql_key], [k0, 0]);
  assert.equal(steps(seal).find((s) => s.line === 'covensHoard').choice, 'seal');
  // A STEP DONE BY AN END WITH NO CHOICE takes the next end's
  const late = await S.registered('LateKeeper');
  await doors(late, T0 + 400);
  const k1 = row(late).eg_keys;
  assert.deepEqual((await ql(late, 'covensHoard', 2)).body, { witnessed: true, title: 'covenbane' }, 'done, undecided - its opening never landed: the end opens it');
  assert.deepEqual((await ql(late, 'covensHoard', 2, 'keep')).body, { witnessed: true, key: true, keys: k1 + 1 }, 'then kept');
});

test('QL12 THE REFUSALS: a guest\'s opening is written and its end refused, paying nothing; a bad body - a phase missing among them - is 400; a step the service pays nothing is `unpaid`; the switch shut is 403 for everyone, at `dev` for all but the developers (mutants: the guest; the phase; the switch; qlStepClaimed)', async (t) => {
  const { S, raw, open, ql } = await stood(t, { DEVELOPER_HANDLES: 'DevOne' });
  const g = await S.guest();
  assert.deepEqual(await ql(g, 'burningDoors', 3), { status: 200, body: { why: 'guest' } });
  assert.equal(raw.prepare('SELECT COUNT(*) AS n FROM ql_steps').get().n, 0, 'a guest\'s end writes nothing');
  assert.deepEqual(await open(g, 'burningDoors', 3), { status: 200, body: { opened: true } }, 'AUDIT QUESTLINES SERVICE-1: its opening is written - the guest who registers keeps it');
  assert.deepEqual(raw.prepare('SELECT account, done_at FROM ql_steps').all().map((r) => ({ ...r })), [{ account: g.id, done_at: null }]);
  const me = await S.registered('Plain');
  for (const bad of [{}, { line: 'nope', step: 0, phase: 'open' }, { line: 'burningDoors', step: 5, phase: 'open' }, { line: 'burningDoors', step: -1, phase: 'end' }, { line: 'burningDoors', step: '3', phase: 'end' }, { line: 'covensHoard', step: 2, phase: 'end', choice: 'KEEP' }, { line: 'burningDoors', step: 3 }, { line: 'burningDoors', step: 3, phase: 'close' }]) {
    assert.deepEqual(await S.call('/v1/ql/claim', bad, me.secret), { status: 400, body: { error: 'ql-body' } }, JSON.stringify(bad));
  }
  assert.deepEqual(await ql(me, 'burningDoors', 0), { status: 200, body: { why: 'unpaid' } }, 'the letter is the client\'s alone');
  assert.deepEqual(await open(me, 'weirRoad', 3), { status: 200, body: { why: 'unpaid' } });
  assert.equal(raw.prepare('SELECT COUNT(*) AS n FROM ql_steps WHERE account = ?').get(me.id).n, 0);
  // the switch, read as FIRMAMENT_OPEN is
  const ctx = { db: S.env.DB };
  const dev = { id: 'x', handle: 'DevOne' }, plain = { id: 'y', handle: 'Plain' };
  for (const env of [{}, { QUESTLINES_OPEN: 'off' }]) assert.deepEqual(await claimQl({ ...ctx, env }, dev, { line: 'burningDoors', step: 3, phase: 'open' }, T0), { error: 'ql-closed' });
  assert.deepEqual(await claimQl({ ...ctx, env: { QUESTLINES_OPEN: 'dev', DEVELOPER_HANDLES: 'DevOne' } }, plain, { line: 'burningDoors', step: 3, phase: 'open' }, T0), { error: 'ql-closed' });
});

test('QL12 THE SWITCH THROUGH THE WORKER: at `dev` the developers claim and nobody else; `off` is 403 for everyone (mutants: the switch; dev open to all)', async (t) => {
  const D = await stood(t, { QUESTLINES_OPEN: 'dev', DEVELOPER_HANDLES: 'DevOne' });
  const devAcct = await D.S.registered('DevOne'), other = await D.S.registered('NotDev');
  assert.deepEqual(await D.open(other, 'burningDoors', 3), { status: 403, body: { error: 'ql-closed' } });
  assert.deepEqual(await D.open(devAcct, 'burningDoors', 3), { status: 200, body: { opened: true } });
  assert.equal(D.raw.prepare('SELECT COUNT(*) AS n FROM ql_steps').get().n, 1, 'the refused claim wrote nothing');
  const Off = await standService({ QUESTLINES_OPEN: 'off' });
  const anyone = await Off.registered('Anyone');
  assert.deepEqual(await Off.call('/v1/ql/claim', { line: 'burningDoors', step: 3, phase: 'open' }, anyone.secret), { status: 403, body: { error: 'ql-closed' } });
});

