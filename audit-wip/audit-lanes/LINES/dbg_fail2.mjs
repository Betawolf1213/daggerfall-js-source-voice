import { makeBridge, actsOf, noteAct, QL_LINES, RUNNER, DAY, lineById } from './harness.mjs';
const h = makeBridge({ level: 30, online: true });
const recs = {};
for (const o of QL_LINES) recs[o.id] = o.id === 'introArena' ? { step: 0, done: false, wait: 0, outcomes: {}, claims: {} } : { step: o.steps.length, done: true };
h.runner.restore(recs);
const orig = h.runner.ended;
h.runner.ended = (q, o) => { const r = orig(q, o); console.log('ENDED', q.questName, q.uid, o?.id, 'now', h.st.s, JSON.stringify(r), JSON.stringify(h.runner.lineState('introArena'))); return r; };
const origLook = h.runner.look;
h.tick(3);
const q = h.running('QLIA01');
h.advance(4 * 3600); h.tick(3);
for (let d = 0; d < 35 && !q.questComplete; d++) { h.advance(DAY); for (let k = 0; k < 3; k++) { h.tick(1); if (q.ql?.outcome || q.questComplete) console.log(' d', d, 'k', k, 'outcome', q.ql?.outcome, 'complete', q.questComplete, JSON.stringify(h.runner.lineState('introArena'))); } }
