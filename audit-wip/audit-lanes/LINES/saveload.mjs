// A step across a save and a load (the bridge's own snapshot/restore): QLWR02 (three Redoubts) with two taken, saved,
// loaded into a new page's bridge - the runner adopts the restored step (no second copy), the third Redoubt finishes it.
import { makeBridge, noteAct, QL_LINES } from './harness.mjs';
const a = makeBridge({ level: 30, online: true });
const recs = {};
for (const o of QL_LINES) recs[o.id] = o.id === 'weirRoad' ? { step: 1, done: false, wait: 0, outcomes: { 0: { id: 'done' } }, claims: { 0: 'witnessed' } } : { step: o.steps.length, done: true };
a.runner.restore(recs);
a.tick(3); await a.settle();
let q = a.running('QLWR02');
noteAct('redoubt-taken', 2); a.tick(2);
const save = JSON.parse(JSON.stringify(a.bridge.snapshot()));
console.log('saved: acts', JSON.stringify(q.ql.acts), 'line', JSON.stringify(save.questlines.lines.weirRoad));
// a new page
const b = makeBridge({ level: 30, online: true });
b.bridge.restore(save);
b.tick(3); await b.settle();
const copies = b.any('QLWR02');
q = b.running('QLWR02');
console.log('after load: QLWR02 copies on the machine', copies.length, 'acts', JSON.stringify(q?.ql?.acts), 'claims queued:', JSON.stringify(b.st.claims));
noteAct('redoubt-taken', 1); b.tick(3);
console.log('third Redoubt: taken task', q.getTask({ name: 'taken' })?.getTriggerValue());
b.click(q); b.tick(6); await b.settle();
console.log('complete', q.questComplete, 'success', q.questSuccess, 'line', JSON.stringify(b.runner.lineState('weirRoad')));
