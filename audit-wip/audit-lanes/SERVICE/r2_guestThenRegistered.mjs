// R2: A GUEST WHO REGISTERS MID-LINE NEVER GETS THE LINE'S TITLE. The real runner (qlLineRunner.js), the real door
// (accountClient.js accountQuestlines) and the real Worker. The guest's OPEN claim is answered `{ why: 'guest' }` and the
// service writes nothing - but the runner files it as `opened` (ask(): `d.why` answers an open), so it is never asked again,
// not even after a load. The account registers in place (same id); the serpent is slain (now recorded, so the act comes
// and QLOC03 ends); the END claim is the step's first on the service, so it OPENS it (after the receipt) - every later ask
// is `witnessed: false`, forever. Satakal's Witness is never paid.
import { stood, T0, SNAP } from './harness.mjs';
const { accountQuestlines, SESSION_KEY, SERVICE_KEY } = await import(`${SNAP}/src/net/accountClient.js`);
const { createLineRunner, CLAIM_RETRY_MS, STEP_GAP_S } = await import(`${SNAP}/src/systems/questlines/qlLineRunner.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { QUESTLINES_PREF } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
const { ACCEPTED } = await import(`${SNAP}/src/net/legalLaw.js`);

const H = await stood();
const { S, at, now, row, steps } = H;
const g = await S.guest();
const kv = new Map([[SESSION_KEY, JSON.stringify({ secret: g.secret, id: g.id })], [SERVICE_KEY, 'https://accounts.invalid']]);
const storage = { getItem: (k) => kv.get(k) ?? null, setItem: (k, v) => kv.set(k, v), removeItem: (k) => kv.delete(k) };
const service = accountQuestlines({ fetch: S.fetch, storage });
const wire = [];
const svc = { account: service.account, claim: async (b) => { const a = await service.claim(b); wire.push([b.line, b.step, a?.ok ? a.data : a]); return a; } };

setPref(QUESTLINES_PREF, true);
let uid = 1;
const machine = { quests: new Map(), questsToInvoke: [],
  scheduleQuestByName(name) { const q = { uid: uid++, questName: name, questComplete: false, questTombstoned: false }; machine.questsToInvoke.push(q); return q; },
  tick() { for (const q of machine.questsToInvoke.splice(0)) machine.quests.set(q.uid, q); },
  end(name) { for (const q of machine.quests.values()) if (q.questName === name && !q.questComplete) { q.questComplete = true; q.questSuccess = true; return q; } return null; } };
const clock = { s: 1000, ms: 0 };
const honours = [];
const mk = () => createLineRunner({ machine, service: svc, nowMs: () => clock.ms, ctx: { level: () => 30, online: () => true, nowSeconds: () => clock.s, onHonour: (h) => honours.push(h) } });
let runner = mk();
const settle = () => new Promise((r) => setTimeout(r, 5));
const tick = async () => { runner.look(); machine.tick(); await settle(); };
// the Old Coil's first two steps are the client's own; the third (the serpent) is claimed
for (const q of ['QLOC01', 'QLOC02']) { await tick(); runner.ended(machine.end(q), { id: 'done', failure: false }); clock.s += STEP_GAP_S; }
await tick();   // QLOC03 starts: its OPEN is asked - as a guest
console.log('as a guest, the open:', JSON.stringify(wire.at(-1)), '| runner files it as', JSON.stringify(runner.lineState('oldCoil').claims), '| service rows:', steps(g).length);
// the player registers - an upgrade in place, the same account id
at(T0 + 50);
console.log('register:', (await S.call('/v1/auth/register', { handle: 'WasGuest', password: 'a good long one', ...ACCEPTED }, g.secret)).status);
const me = { ...g, handle: 'WasGuest' };
// a load (the page reloaded after signing in): what is re-asked?
const save = runner.snapshot();
runner = mk(); runner.restore(save);
await tick();
console.log('after a load, claims asked:', wire.length, '(still 1: the open is never asked again)');
// the serpent slain and its receipt claimed - now recorded, so the act comes and the step ends
at(T0 + 100);
console.log('serpent recorded:', (await H.claimSerpent(me, await H.serpentReceipt(me))).recorded);
at(T0 + 200);
runner.ended(machine.end('QLOC03'), { id: 'scale', failure: false });
for (let i = 0; i < 6; i++) { await tick(); clock.ms += CLAIM_RETRY_MS; at(now() + 60); }
console.log('end claims:', JSON.stringify(wire.slice(1)));
// and every later load asks again, witnessed false each time
runner = mk(); runner.restore(runner.snapshot() && save);
console.log('service rows:', JSON.stringify(steps(me)), '| ql_titles:', row(me).ql_titles, '| honours told:', JSON.stringify(honours));
H.restore();
