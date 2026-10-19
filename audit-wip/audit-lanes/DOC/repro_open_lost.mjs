// DOC lane REPRO: a witnessed step whose OPENING claim was lost (the account service unreachable for CLAIM_TRIES minutes
// as the step starts) can never be witnessed once the player does the act in the same session: the step's END claim is
// then its first, so the service opens it at the end - after the receipt - and QL_WITNESS_SQL (`at >= opened_at`) never
// holds for the act the player did. The step (and the line's title, which waits on it) is paid only if the player happens
// to break ANOTHER rite after that late opening and the page asks again (a reload) - nothing tells them so.
// Real parts: the line runner (qlLineRunner.js), the account client's door (net/accountClient.js accountQuestlines), the
// account Worker over node:sqlite with every migration (test/accountDb.mjs), a gate receipt minted by its producer.
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { standService, T0, sessionStorageOf } = await import(`${SNAP}/test/accountDb.mjs`);
const { SESSION_KEY, accountQuestlines } = await import(`${SNAP}/src/net/accountClient.js`);
const { createLineRunner, CLAIM_RETRY_MS, CLAIM_TRIES } = await import(`${SNAP}/src/systems/questlines/qlLineRunner.js`);
const { mintReceipt } = await import(`${SNAP}/src/net/gate/gateReceipt.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { subtle } = globalThis.crypto;

let clock = T0 * 1000;
Date.now = () => clock;                       // the service's clock (nowS) and the runner's (nowMs)
setPref('questlines', true);
const S = await standService({ QUESTLINES_OPEN: 'on' });
const me = await S.registered('RiteBreaker');
let down = false;                             // the account service unreachable
const fetch = (u, i) => (down ? Promise.reject(new TypeError('network down')) : S.fetch(u, i));
const door = accountQuestlines({ fetch, storage: sessionStorageOf(SESSION_KEY, me), waitMs: 1000 });
let uid = 1;
const machine = { quests: new Map(), questsToInvoke: [],
  scheduleQuestByName(name) { const q = { uid: uid++, questName: name, questComplete: false, questTombstoned: false }; this.questsToInvoke.push(q); return q; },
  tick() { for (const q of this.questsToInvoke.splice(0)) this.quests.set(q.uid, q); } };
const runner = createLineRunner({ machine, service: door, nowMs: () => clock, ctx: { level: () => 30, online: () => true, nowSeconds: () => Math.floor(clock / 1000), onHonour: (h) => console.log('HONOUR', h) } });
const settle = async () => { for (let i = 0; i < 20; i++) await new Promise((r) => setImmediate(r)); };
const look = async () => { runner.look(); machine.tick(); await settle(); };

// the Burning Doors at its third step (QLBD03, the rite - witnessed), the first two done
runner.restore({ burningDoors: { step: 2, done: false, wait: 0, outcomes: { 0: { id: 'met' }, 1: { id: 'sealed' } }, claims: {} } });
down = true;                                  // the service is down as the step starts: its opening claim fails...
for (let i = 0; i < CLAIM_TRIES + 1; i++) { await look(); clock += CLAIM_RETRY_MS; }
console.log('after', CLAIM_TRIES, 'failed tries, the step\'s claims record:', JSON.stringify(runner.lineState('burningDoors').claims), '(the opening dropped from the queue)');
down = false;                                 // ...and back. The player breaks the faithful's rite (a fighter who broke it, r 1)
clock += 60_000;
const rec = await S.call('/v1/gate/claim', { receipt: await mintReceipt({ d: 600, b: 'ruhn', s: me.id, c: 4242, x: 'dealt', r: 1 }, S.gatePriv, { subtle, nowS: Math.floor(clock / 1000) }) }, me.secret);
console.log('rite receipt claimed at', Math.floor(clock / 1000), '-> recorded', rec.body.recorded);
clock += 60_000;
const q = [...machine.quests.values()].find((x) => x.questName === 'QLBD03');
q.questComplete = true; q.questSuccess = true;
runner.ended(q, { id: 'broken', failure: false });   // the step's quest ends well: its end claim is queued
for (let i = 0; i < CLAIM_TRIES + 1; i++) { await look(); clock += CLAIM_RETRY_MS; }
const save = runner.snapshot();
const r2 = createLineRunner({ machine, service: door, nowMs: () => clock, ctx: { level: () => 30, online: () => true, nowSeconds: () => Math.floor(clock / 1000) } });
r2.restore(save);                             // the next load asks again
for (let i = 0; i < 3; i++) { r2.look(); await settle(); clock += CLAIM_RETRY_MS; }
const row = S.env.DB._raw.prepare("SELECT step, opened_at, done_at FROM ql_steps WHERE account = ? AND line = 'burningDoors'").all(me.id).map((r) => ({ ...r }));
const kill = S.env.DB._raw.prepare('SELECT at, earned, stones FROM gate_kills WHERE account = ?').all(me.id).map((r) => ({ ...r }));
console.log('ql_steps:', JSON.stringify(row));
console.log('gate_kills:', JSON.stringify(kill));
console.log('direct claim now:', JSON.stringify((await door.claim({ line: 'burningDoors', step: 2 })).data));
console.log('runner claims after a load:', JSON.stringify(r2.lineState('burningDoors').claims));
