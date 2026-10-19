// ACTS lane repro 1: a guest's witnessed step - the runner records the step OPENED on the service's `{ why: 'guest' }`
// (nothing written), so once the guest registers no open is ever asked again; the gate receipt counted then moves the
// client's quest (noteAct 'rite-broken'), and the step's end claim OPENS the step after the receipt's row - the service
// never witnesses it. The real Worker over node:sqlite (test/accountDb.mjs), the real line runner, the real gate queue.
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { standService, T0 } = await import(`${SNAP}/test/accountDb.mjs`);
const { mintReceipt } = await import(`${SNAP}/src/net/gate/gateReceipt.js`);
const { createGateClaims } = await import(`${SNAP}/src/net/gate/gateClaims.js`);
const { createLineRunner } = await import(`${SNAP}/src/systems/questlines/qlLineRunner.js`);
const { setActSink } = await import(`${SNAP}/src/systems/questlines/qlActs.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { ACCEPTED } = await import(`${SNAP}/src/net/legalLaw.js`);
const { subtle } = globalThis.crypto;

let clock = T0 * 1000;
Date.now = () => clock;
const S = await standService({ QUESTLINES_OPEN: 'on' });
const raw = S.env.DB._raw;
setPref('questlines', true);

// a guest account, signed in (a guest's session has an id: questlineHost.js serviceReady answers true)
const g = await S.guest();
const door = { claim: async (body) => { const r = await S.call('/v1/ql/claim', body, g.secret); return r.status === 200 ? { ok: true, data: r.body } : { ok: false, error: r.body?.error }; } };
const machine = { quests: new Map(), questsToInvoke: [], scheduleQuestByName(name) { const q = { questName: name, questComplete: false, questTombstoned: false }; this.questsToInvoke.push(q); return q; } };
let ms = 0;
const runner = createLineRunner({ machine, service: door, nowMs: () => ms, ctx: { level: () => 20, online: () => true, nowSeconds: () => 1e6 } });
// the Burning Doors at its third step (QLBD03, witness `rite`), as a save carries it
runner.restore({ burningDoors: { step: 2, done: false, wait: 0, outcomes: { 0: { id: 'done' }, 1: { id: 'sealed' } }, claims: {} } });
runner.look();                    // starts QLBD03 and sends its OPEN claim
await new Promise((r) => setTimeout(r, 20));
console.log('1. guest opens QLBD03:      runner claims =', JSON.stringify(runner.lineState('burningDoors').claims), ' ql_steps rows =', raw.prepare('SELECT COUNT(*) n FROM ql_steps').get().n);

// the guest registers (same account id)
const reg = await S.call('/v1/auth/register', { handle: 'Ashlander', password: 'a good long one', ...ACCEPTED }, g.secret);
console.log('2. registers:               status', reg.status);

// a page load: the runner restored from the save - is the open asked again?
const snap = runner.snapshot();
const runner2 = createLineRunner({ machine, service: door, nowMs: () => ms, ctx: { level: () => 20, online: () => true, nowSeconds: () => 1e6 } });
runner2.restore(snap);
console.log('3. reload: claims =', JSON.stringify(runner2.lineState('burningDoors').claims), '(no open re-queued: claims[2] says opened)');

// an hour later the player breaks a rite: the relay's receipt, carried by the real gate queue
clock += 3600_000;
const heard = [];
setActSink((kind, n) => { heard.push(kind); return 1; });
const nowS = () => Math.floor(clock / 1000);
const q = createGateClaims({ claim: async (r) => { const x = await S.call('/v1/gate/claim', { receipt: r }, g.secret); return x.status === 200 ? { ok: true, data: x.body } : { ok: false, ...x.body }; }, nowS, nowMs: () => clock, me: () => g.id });
q.add(await mintReceipt({ d: 700, b: 'ruhn', s: g.id, c: 4242, x: 'rite' }, S.gatePriv, { subtle, nowS: nowS() }));
await new Promise((r) => setTimeout(r, 50));
console.log('4. rite receipt claimed:    acts heard =', JSON.stringify(heard), ' gate_kills =', JSON.stringify(raw.prepare('SELECT earned, at FROM gate_kills').all()));

// the client's QLBD03 completes on that act (ql act rite-broken 1) and ends well: the runner sends the END claim
clock += 60_000;
runner2.ended({ questName: 'QLBD03', questSuccess: true }, { id: 'done' });
for (let i = 0; i < 7; i++) { runner2.look(); await new Promise((r) => setTimeout(r, 20)); ms += 61_000; clock += 61_000; }
console.log('5. end claims sent:         claims =', JSON.stringify(runner2.lineState('burningDoors').claims));
console.log('   ql_steps =', JSON.stringify(raw.prepare('SELECT line, step, opened_at, done_at FROM ql_steps').all()));
const row = raw.prepare('SELECT opened_at FROM ql_steps WHERE line = ? AND step = ?').get('burningDoors', 2);
const kill = raw.prepare('SELECT at FROM gate_kills').get();
console.log(`   the receipt's row at ${kill.at} < the step opened at ${row.opened_at}: the witness (g.at >= opened_at) can never read it`);
console.log('   a direct claim now:', JSON.stringify((await door.claim({ line: 'burningDoors', step: 2, choice: 'done' })).data));
