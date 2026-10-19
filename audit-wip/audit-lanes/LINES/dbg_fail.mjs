import { makeBridge, actsOf, noteAct, QL_LINES, RUNNER, DAY, lineById } from './harness.mjs';
const h = makeBridge({ level: 30, online: true });
const recs = {};
for (const o of QL_LINES) recs[o.id] = o.id === 'introArena' ? { step: 0, done: false, wait: 0, outcomes: {}, claims: {} } : { step: o.steps.length, done: true };
h.runner.restore(recs);
h.tick(3);
const q = h.running('QLIA01');
const show = (l) => console.log(l, 'now', h.st.s, JSON.stringify(h.runner.lineState('introArena')), h.any('QLIA01').map((x) => `${x.uid}:${x.questComplete ? 'C' : ''}${x.questTombstoned ? 'T' : ''}:${x.questSuccess}`).join(' '));
show('start');
h.advance(4 * 3600); h.tick(3); show('letter');
for (let d = 0; d < 35 && !q.questComplete; d++) { h.advance(DAY); h.tick(3); }
show('after');
h.tick(5); show('after+5');
