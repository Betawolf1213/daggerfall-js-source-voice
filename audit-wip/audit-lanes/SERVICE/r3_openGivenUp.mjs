// R3: AN OPEN GIVEN UP IS A STEP NEVER PAID. The runner asks a step's OPEN CLAIM_TRIES (5) times a minute apart and
// then drops it until the next page load. If the service is unreachable for those five minutes when the step starts,
// and the player does the deed in the same page session (the receipt claimed - by gateClaims' own retry - once the
// service is back), the step's END claim is the service's first: it opens the step AFTER the receipt row, and the
// step can never be witnessed - the line's title is lost (a reload re-asks only the end: `witnessed: false` for good).
import { stood, T0, SNAP } from './harness.mjs';
const { accountQuestlines, SESSION_KEY, SERVICE_KEY } = await import(`${SNAP}/src/net/accountClient.js`);
const { createLineRunner, CLAIM_RETRY_MS, CLAIM_TRIES, STEP_GAP_S } = await import(`${SNAP}/src/systems/questlines/qlLineRunner.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { QUESTLINES_PREF } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);

const H = await stood();
const { S, at, now, row, steps } = H;
const me = await S.registered('Unlucky', { character: 'char-0001' });
const kv = new Map([[SESSION_KEY, JSON.stringify({ secret: me.secret, id: me.id })], [SERVICE_KEY, 'https://accounts.invalid']]);
const storage = { getItem: (k) => kv.get(k) ?? null, setItem: (k, v) => kv.set(k, v), removeItem: (k) => kv.delete(k) };
let down = true;
const fetch = async (u, i) => { if (down) throw new TypeError('fetch failed'); return S.fetch(u, i); };
const service = accountQuestlines({ fetch, storage });
const wire = [];
const svc = { account: service.account, claim: async (b) => { const a = await service.claim(b); wire.push([b.step, a?.ok ? a.data : a.error]); return a; } };
setPref(QUESTLINES_PREF, true);
let uid = 1;
const machine = { quests: new Map(), questsToInvoke: [],
  scheduleQuestByName(name) { const q = { uid: uid++, questName: name, questComplete: false, questTombstoned: false }; machine.questsToInvoke.push(q); return q; },
  tick() { for (const q of machine.questsToInvoke.splice(0)) machine.quests.set(q.uid, q); },
  end(name) { for (const q of machine.quests.values()) if (q.questName === name && !q.questComplete) { q.questComplete = true; q.questSuccess = true; return q; } return null; } };
const clock = { s: 1000, ms: 0 };
const runner = createLineRunner({ machine, service: svc, nowMs: () => clock.ms, ctx: { level: () => 30, online: () => true, nowSeconds: () => clock.s, onHonour: () => {} } });
const settle = () => new Promise((r) => setTimeout(r, 5));
const tick = async () => { runner.look(); machine.tick(); await settle(); };
// the Hour That Was Not: QLHR01 the client's own; QLHR02 starts while the service cannot be reached
await tick(); runner.ended(machine.end('QLHR01'), { id: 'done', failure: false }); clock.s += STEP_GAP_S;
for (let i = 0; i < CLAIM_TRIES + 2; i++) { await tick(); clock.ms += CLAIM_RETRY_MS; at(now() + 60); }
console.log('the open, while the service was unreachable:', JSON.stringify(wire), '- given up:', JSON.stringify(runner.lineState('hourThatWasNot').claims));
down = false;
// the player breaks an Hour; its receipt is claimed once the service is back (sdClaims keeps and re-sends it), the act ends the quest
at(now() + 60);
console.log('hour recorded:', (await H.claimHour(me, await H.hourReceipt(me))).recorded);
at(now() + 60);
runner.ended(machine.end('QLHR02'), { id: 'wayrest', failure: false });
for (let i = 0; i < CLAIM_TRIES + 1; i++) { await tick(); clock.ms += CLAIM_RETRY_MS; at(now() + 60); }
console.log('the end claims:', JSON.stringify(wire.slice(CLAIM_TRIES)));
console.log('service row:', JSON.stringify(steps(me)), '| Hour receipt at:', H.raw.prepare('SELECT at FROM sd_kills WHERE account = ?').get(me.id).at, '| ql_titles:', row(me).ql_titles);
H.restore();
