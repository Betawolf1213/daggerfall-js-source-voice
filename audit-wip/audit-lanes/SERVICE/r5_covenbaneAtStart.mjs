// R5: COVENBANE IS PAID BY A RE-ASKED OPEN - before the player has met Ysolde or chosen the key's fate. covensHoard's
// last step has no receipt: its witness is the Burning Doors' breach alone, so ANY second claim of it - the runner's own
// open asked again after a load whose save had not caught the first answer (or a first answer lost) - lays done_at and
// pays the title at the step's START. The real runner, the real door, the real Worker.
import { stood, T0, SNAP } from './harness.mjs';
const { accountQuestlines, SESSION_KEY, SERVICE_KEY } = await import(`${SNAP}/src/net/accountClient.js`);
const { createLineRunner, STEP_GAP_S } = await import(`${SNAP}/src/systems/questlines/qlLineRunner.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { QUESTLINES_PREF } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
const H = await stood();
const { S, at, row, steps } = H;
const me = await S.registered('Early');
// the Burning Doors' breach, witnessed (as its own runner would have)
at(T0 + 10); await H.ql(me, 'burningDoors', 3); await H.gate(me); await H.ql(me, 'burningDoors', 3);
const kv = new Map([[SESSION_KEY, JSON.stringify({ secret: me.secret, id: me.id })], [SERVICE_KEY, 'https://accounts.invalid']]);
const storage = { getItem: (k) => kv.get(k) ?? null, setItem: (k, v) => kv.set(k, v), removeItem: (k) => kv.delete(k) };
const door = accountQuestlines({ fetch: S.fetch, storage });
const wire = [];
const svc = { account: door.account, claim: async (b) => { const a = await door.claim(b); wire.push([b.line, b.step, b.choice ?? null, a?.ok ? a.data : a]); return a; } };
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
// the Burning Doors done on this character, then the Covens' Hoard's two client steps
runner.restore({ burningDoors: { step: 5, done: true, outcomes: {}, claims: { 2: 'witnessed', 3: 'witnessed' }, wait: 0 } });
for (const q of ['QLCH01', 'QLCH02']) { await tick(); runner.ended(machine.end(q), { id: 'done', failure: false }); clock.s += STEP_GAP_S; }
const saved = runner.snapshot();   // the game saved here - QLCH03 not begun
await tick();                       // QLCH03 starts: its open asked and answered
console.log('QLCH03 starts:', JSON.stringify(wire.at(-1)));
// the page reloads from the last save (taken before the answer) - the open is asked again
runner = mk(); runner.restore(saved); await tick();
console.log('after a load, the open again:', JSON.stringify(wire.at(-1)));
console.log('told to the player at QLCH03\'s START:', JSON.stringify(honours), '| row:', JSON.stringify(row(me)), '| step:', JSON.stringify(steps(me).find((s) => s.line === 'covensHoard')));
H.restore();
