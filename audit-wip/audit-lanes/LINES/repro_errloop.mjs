// REPRO: a line step whose quest ERRORS (an exception in its update - the machine error-terminates and removes it, no
// `end quest`, so the layer's ending never runs) is started again by the runner on the very next look, every tick,
// with no RETRY_GAP_S - each a fresh parse and start. Here the error is a `place npc` with no world under it (any
// exception in a step's update takes the same road: machine.js tick -> removeQuest -> tombstoneQuest without `ended`).
import { makeBridge, QL_LINES } from './harness.mjs';
const h = makeBridge({ level: 30, online: true });
// the world's part NOT marked done this time: undo the harness's onQuestStarted marking for PlaceNpc
h.bridge.machine.deps.onQuestStarted = (q) => { h.st.started.push(q.questName); };
const recs = {};
for (const o of QL_LINES) recs[o.id] = o.id === 'burningDoors' ? { step: 0, done: false, wait: 0 } : { step: o.steps.length, done: true };
h.runner.restore(recs);
const errors = [];
const warn = console.warn;
console.warn = (...a) => { const s = a.join(' '); if (/exception in quest QLBD01/.test(s)) errors.push(s.slice(0, 120)); };
for (let i = 0; i < 20; i++) h.tick(1);
console.log('ticks: 20  QLBD01 started:', h.st.started.filter((n) => n === 'QLBD01').length, ' error-terminated:', errors.length);
console.log('first error:', errors[0]);
console.log('line record:', JSON.stringify(h.runner.lineState('burningDoors')));
