import { makeBridge, actsOf, noteAct, QL_LINES, lineById, RUNNER, DAY } from './harness.mjs';
const h = makeBridge({ level: 30, online: true });
const others = {};
for (const o of QL_LINES) if (o.id !== 'burningDoors') others[o.id] = { step: o.steps.length, done: true };
h.runner.restore(others);
const show = (q, label) => console.log(label, q.questName, [...q.tasks.values()].map((t) => `${t.symbol?.name}:${t.getTriggerValue() ? 1 : 0}`).join(' '), 'C', q.questComplete, 'T', q.questTombstoned, 'asked', h.st.asked.length, 'pack', h.st.pack.size);
for (let i = 0; i < 14; i++) {
  h.advance(2 * 3600); h.tick(3); await h.settle();
  const r = h.runner.lineState('burningDoors');
  console.log(i, 'rec', JSON.stringify({ step: r.step, wait: r.wait, done: r.done }), 'now', h.st.s, [...h.bridge.machine.quests.values()].map((q) => `${q.questName}:${q.uid}:${q.questComplete ? 'C' : ''}${q.questTombstoned ? 'T' : ''}`).join(' '));
  const q = h.running(lineById('burningDoors').steps[r.step].quest);
  if (!q) continue;
  show(q, ' before');
  if (i === 3) { h.kill(q); h.tick(3); show(q, ' killed'); }
  while (h.st.asked.length) { h.answer(0); h.tick(2); }
  h.click(q); h.tick(4); show(q, ' clicked');
}
