// BRANCH Q3: the ask across a save and load, through the real bridge (bridge.tick, so the layer's latch runs too).
//   (a) saved under the question, loaded: asked afresh, answered, the quest ends by that answer
//   (b) answered, saved the same tick (before the reward task ran), loaded: the choice stands and pays
//   (c) the box closed by the classic picker's Cancel: asked again (the chain shows the question again, respond never null)
import { makeBridge, askTasks, forceTask, stubWorld, goldOf, FACTION } from './harness.mjs';
console.warn = () => {};
const T = (b, n = 1) => { for (let i = 0; i < n; i++) b.tick(1); };

function startAsked(name) {
  const env = makeBridge({ on: true });
  const quest = env.bridge.machine.startQuestByName(name, FACTION);
  stubWorld(quest);
  T(env.bridge, 2);
  for (const t of askTasks(quest)) forceTask(t);
  T(env.bridge, 1);
  return { ...env, quest };
}

for (const name of ['L0B40Y04', 'R0C11Y26']) {
  // (a)
  {
    const a = startAsked(name);
    const save = JSON.parse(JSON.stringify(a.bridge.snapshot()));
    const b = makeBridge({ on: true });
    b.bridge.restore(save);
    T(b.bridge, 1);
    const q = b.bridge.machine.quests.get(a.quest.uid);
    const askedAgain = b.rec.asked.length;
    b.rec.asked[0]?.respond(1);
    T(b.bridge, 6);
    console.log(`${name} (a) saved under the question: asked before save=${a.rec.asked.length}, asked after load=${askedAgain}, ended=${q.questComplete || q.ticksToEnd > 0}, outcome=${q.ql?.outcome}, choices=${JSON.stringify(q.ql?.choices)}, gold=${JSON.stringify(goldOf(b.rec.rewards))}`);
  }
  // (b)
  {
    const a = startAsked(name);
    a.rec.asked[0].respond(0);
    const save = JSON.parse(JSON.stringify(a.bridge.snapshot()));   // same tick as the answer
    const b = makeBridge({ on: true });
    b.bridge.restore(save);
    T(b.bridge, 6);
    const q = b.bridge.machine.quests.get(a.quest.uid);
    console.log(`${name} (b) answered then saved at once: asked after load=${b.rec.asked.length}, ended=${q.questComplete || q.ticksToEnd > 0}, outcome=${q.ql?.outcome}, gold=${JSON.stringify(goldOf(b.rec.rewards))}`);
  }
}
