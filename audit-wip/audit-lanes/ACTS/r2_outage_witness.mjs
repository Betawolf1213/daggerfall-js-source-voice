// ACTS lane repro 2: a REGISTERED player. The step's open claim meets five minutes without the account service
// (CLAIM_TRIES x CLAIM_RETRY_MS) and is dropped until the next page load; the service comes back, the breach receipt is
// counted (the client's QLBD04 hears `breach-closed` and ends), and the step's END claim is the one that opens it - after
// the receipt's row. The client's step is done; the service never witnesses it (and Doorwarden is never paid).
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { standService, T0 } = await import(`${SNAP}/test/accountDb.mjs`);
const { mintReceipt } = await import(`${SNAP}/src/net/gate/gateReceipt.js`);
const { createGateClaims } = await import(`${SNAP}/src/net/gate/gateClaims.js`);
const { createLineRunner, CLAIM_TRIES, CLAIM_RETRY_MS } = await import(`${SNAP}/src/systems/questlines/qlLineRunner.js`);
const { setActSink } = await import(`${SNAP}/src/systems/questlines/qlActs.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { subtle } = globalThis.crypto;

let clock = T0 * 1000;
Date.now = () => clock;
const S = await standService({ QUESTLINES_OPEN: 'on' });
const raw = S.env.DB._raw;
setPref('questlines', true);
const who = await S.registered('Ysmir');
// QLBD03 (step 2, the rite) already witnessed on the service, as a player who reached QLBD04 has it
raw.prepare('INSERT INTO ql_steps (account, line, step, opened_at, done_at) VALUES (?, ?, ?, ?, ?)').run(who.id, 'burningDoors', 2, T0 - 100, T0 - 50);
let down = true;   // the service unreachable while the step starts
const door = { claim: async (body) => { if (down) return { ok: false, error: 'offline' }; const r = await S.call('/v1/ql/claim', body, who.secret); return r.status === 200 ? { ok: true, data: r.body } : { ok: false, error: r.body?.error }; } };
const machine = { quests: new Map(), questsToInvoke: [], scheduleQuestByName(name) { const q = { questName: name, questComplete: false, questTombstoned: false }; this.questsToInvoke.push(q); return q; } };
let ms = 0;
const tick = async () => { runner.look(); await new Promise((r) => setTimeout(r, 15)); };
const runner = createLineRunner({ machine, service: door, nowMs: () => ms, ctx: { level: () => 20, online: () => true, nowSeconds: () => 1e6 } });
runner.restore({ burningDoors: { step: 3, done: false, wait: 0, outcomes: { 0: { id: 'done' }, 1: { id: 'sealed' }, 2: { id: 'done' } }, claims: { 2: 'witnessed' } } });
for (let i = 0; i < CLAIM_TRIES + 2; i++) { await tick(); ms += CLAIM_RETRY_MS + 1; clock += CLAIM_RETRY_MS + 1; }
console.log(`1. QLBD04 started, ${CLAIM_TRIES} open claims unanswered (service down): claims =`, JSON.stringify(runner.lineState('burningDoors').claims), ' step 3 rows =', raw.prepare('SELECT COUNT(*) n FROM ql_steps WHERE step = 3').get().n);
down = false;
for (let i = 0; i < 3; i++) { await tick(); ms += CLAIM_RETRY_MS + 1; }
console.log('2. service back, the same page: open asked again?', raw.prepare('SELECT COUNT(*) n FROM ql_steps WHERE step = 3').get().n ? 'yes' : 'no (dropped until the next load)');

const heard = [];
setActSink((kind) => { heard.push(kind); return 1; });
clock += 600_000;
const nowS = () => Math.floor(clock / 1000);
const q = createGateClaims({ claim: async (r) => { const x = await S.call('/v1/gate/claim', { receipt: r }, who.secret); return x.status === 200 ? { ok: true, data: x.body } : { ok: false, ...x.body }; }, nowS, nowMs: () => clock, me: () => who.id });
q.add(await mintReceipt({ d: 701, b: 'ruhn', s: who.id, c: 4242, x: 'dealt' }, S.gatePriv, { subtle, nowS: nowS() }));
await new Promise((r) => setTimeout(r, 50));
console.log('3. breach closed, receipt counted: acts heard =', JSON.stringify(heard));
clock += 60_000;
runner.ended({ questName: 'QLBD04', questSuccess: true }, { id: 'done' });
for (let i = 0; i < CLAIM_TRIES + 2; i++) { await tick(); ms += CLAIM_RETRY_MS + 1; clock += CLAIM_RETRY_MS + 1; }
console.log('4. QLBD04 ended well, end claims asked: claims =', JSON.stringify(runner.lineState('burningDoors').claims));
console.log('   ql_steps =', JSON.stringify(raw.prepare('SELECT step, opened_at, done_at FROM ql_steps').all()), ' gate_kills.at =', raw.prepare('SELECT at FROM gate_kills').get().at);
console.log('   ql_titles =', raw.prepare('SELECT ql_titles FROM players WHERE id = ?').get(who.id).ql_titles, '(Doorwarden, bit 1 - its steps 2 and 3: unpaid)');
// the next page load asks the end again - still never witnessed
const r2 = createLineRunner({ machine, service: door, nowMs: () => ms, ctx: { level: () => 20, online: () => true, nowSeconds: () => 1e6 } });
r2.restore(runner.snapshot());
for (let i = 0; i < 3; i++) { r2.look(); await new Promise((r) => setTimeout(r, 15)); ms += CLAIM_RETRY_MS + 1; }
console.log('5. next load, end asked again: claims =', JSON.stringify(r2.lineState('burningDoors').claims), ' done_at =', raw.prepare('SELECT done_at FROM ql_steps WHERE step = 3').get().done_at);
// ...and the Covens' Hoard behind it: its last step (the Weir Key kept, Covenbane) is witnessed only by the Burning
// Doors' step 3 done on the row - which never comes
clock += 3600_000;
const o = (await door.claim({ line: 'covensHoard', step: 2 })).data;
clock += 60_000;
const e = (await door.claim({ line: 'covensHoard', step: 2, choice: 'keep' })).data;
console.log('6. the Covens\' Hoard step 3 (key kept): open ->', JSON.stringify(o), ' end ->', JSON.stringify(e), ' players row =', JSON.stringify({ ...raw.prepare('SELECT eg_keys, ql_key, ql_titles FROM players WHERE id = ?').get(who.id) }), '(ql_key 0: the questline\'s key never paid; eg_keys 1 is the breach claim\'s own key roll)');
