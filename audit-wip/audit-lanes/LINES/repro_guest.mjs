// REPRO (end to end, the real Worker over node:sqlite - test/accountDb.mjs - and the real bridge, layer and line
// runner - harness.mjs): A GUEST ON THE BURNING DOORS.
//  (1) a guest is "online" to the runner (serviceReady = an account id), so the endgame line runs for them; the
//      rite's step (QLBD03) waits on `ql act rite-broken`, and the act is said only for a receipt the service RECORDED
//      (net/gate/gateClaims.js flush) - which it never does for a guest (accounts.js claimGate `why: 'guest'`). The
//      step cannot finish while they are a guest; it fails at 60 days and comes again, for ever.
//  (2) the runner records the step's OPEN claim answered `{ why: 'guest' }` as 'opened' (qlLineRunner.js ask) and never
//      asks it again. The guest registers (the gate's own line asks them to: "Add a username within a week to keep
//      it"), the kept receipt is claimed and recorded, the act fires, the quest ends - and the end claim is the step's
//      FIRST claim on the service: it opens the row AFTER the receipt, so the witness (`g.at >= opened_at`) never sees
//      it. The Doorwarden (and the Covens' Hoard's key and title, which wait on this line's breach step) is not paid.
import { makeBridge, noteAct, QL_LINES, DAY } from './harness.mjs';
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { standService, T0 } = await import(SNAP + '/test/accountDb.mjs');
const { mintReceipt } = await import(SNAP + '/src/net/gate/gateReceipt.js');
const { ACCEPTED } = await import(SNAP + '/src/net/legalLaw.js');
const { subtle } = globalThis.crypto;

let clockMs = T0 * 1000;
Date.now = () => clockMs;
const S = await standService({ QUESTLINES_OPEN: 'on' });
const nowS = () => Math.floor(clockMs / 1000);
const g = await S.guest();
let secret = g.secret;
const log = [];
// the runner's door, shaped as net/accountClient.js accountQuestlines answers (call(): 2xx -> ok, else error)
const service = {
  account: () => g.id,
  claim: async (body) => {
    const r = await S.call('/v1/ql/claim', body, secret);
    log.push(`claim ${JSON.stringify(body)} -> ${r.status} ${JSON.stringify(r.body)}`);
    return r.status < 400 ? { ok: true, data: r.body } : { ok: false, error: r.body?.error ?? 'server' };
  },
};
const h = makeBridge({ level: 30, service });
const recs = {};
for (const o of QL_LINES) recs[o.id] = o.id === 'burningDoors' ? { step: 2, done: false, wait: 0, outcomes: { 0: { id: 'met' }, 1: { id: 'sealed' } } } : { step: o.steps.length, done: true };
h.runner.restore(recs);
const settle = async () => { for (let i = 0; i < 5; i++) await new Promise((r) => setImmediate(r)); };

// the step starts; its open claim goes, as a guest
h.tick(3); await settle();
const q = h.running('QLBD03');
console.log('QLBD03 running:', !!q, ' claims after the open:', JSON.stringify(h.runner.lineState('burningDoors').claims));

// (1) the rite broken as a guest: the gate's claim, as gateClaims.js flush makes it - the act only when `recorded`
clockMs += 120_000;
const receipt = await mintReceipt({ d: 700, b: 'ruhn', s: g.id, c: 4242, x: 'rite' }, S.gatePriv, { subtle, nowS: nowS() });
const asGuest = await S.call('/v1/gate/claim', { receipt }, secret);
if (asGuest.body?.recorded === true) noteAct('rite-broken');
h.tick(3);
console.log('(1) gate claim as a guest ->', JSON.stringify(asGuest.body), '| QLBD03 heard rite-broken:', q.ql.acts['rite-broken'] ?? 0);

// (2) the guest registers, and the kept receipt is claimed again (gateClaimVerdict keeps a guest's for its week)
clockMs += 120_000;
const reg = await S.call('/v1/auth/register', { handle: 'Doorguest', password: 'a good long one', ...ACCEPTED }, secret);
console.log('    registered:', reg.status);
clockMs += 60_000;
const after = await S.call('/v1/gate/claim', { receipt }, secret);
if (after.body?.recorded === true) noteAct('rite-broken');
h.tick(3);
console.log('    gate claim registered ->', JSON.stringify({ recorded: after.body?.recorded }), '| QLBD03 heard rite-broken:', q.ql.acts['rite-broken'] ?? 0);
// the courier, Ysolde, her purse: the step ends well - the player rides to her hall (ten real minutes)
clockMs += 600_000;
h.advance(4 * 3600); h.tick(4);
h.click(q); h.tick(6); await settle();
console.log('    QLBD03 complete:', q.questComplete, 'success:', q.questSuccess, ' line step now:', h.runner.lineState('burningDoors').step);
// the runner's end claim, and its retries a minute apart (CLAIM_RETRY_MS) - five
for (let i = 0; i < 6; i++) { clockMs += 61_000; h.tick(3); await settle(); await new Promise((r) => setTimeout(r, 20)); }
console.log('    claims record:', JSON.stringify(h.runner.lineState('burningDoors').claims));
const row = S.env.DB._raw.prepare("SELECT step, opened_at, done_at FROM ql_steps WHERE account = ? AND line = 'burningDoors'").all(g.id).map((r) => ({ ...r }));
const kill = S.env.DB._raw.prepare('SELECT earned, at FROM gate_kills WHERE account = ?').all(g.id).map((r) => ({ ...r }));
console.log('    ql_steps:', JSON.stringify(row), ' gate_kills:', JSON.stringify(kill));
console.log('--- the service as the runner heard it:');
for (const l of log) console.log('   ', l);
