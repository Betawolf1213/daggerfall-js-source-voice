import { makeBridge, actsOf, noteAct, QL_LINES, lineById, RUNNER, DAY } from './harness.mjs';
const h = makeBridge({ level: 30, online: true });
const others = {};
for (const o of QL_LINES) if (o.id !== 'introBay') others[o.id] = { step: o.steps.length, done: true };
h.runner.restore(others);
for (let i = 0; i < 12; i++) {
  h.advance(2 * 3600); h.tick(3); await h.settle();
  const r = h.runner.lineState('introBay');
  const qs = [...h.bridge.machine.quests.values()].map((q) => `${q.questName}:${q.questComplete ? 'C' : ''}${q.questTombstoned ? 'T' : ''}`);
  console.log(i, JSON.stringify(r), qs.join(' '));
  const step = r && lineById('introBay').steps[r.step];
  const q = step && h.running(step.quest);
  if (q && i === 2) { for (const [k, n] of actsOf(q)) console.log('act', k, n, noteAct(k, n)); h.click(q); h.tick(3); }
  if (q && i === 6) { for (const [k, n] of actsOf(q)) console.log('act', k, n, noteAct(k, n)); h.tick(3); }
}
console.log(h.st.ended);
