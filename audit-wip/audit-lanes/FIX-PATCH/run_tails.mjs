// BRANCH: the four patched quests whose chosen path waits on the world - driven to their end.
import { makeBridge, askTasks, forceTask, stubWorld, tickN, runOutNewClocks, runningClocks, goldOf, FACTION } from './harness.mjs';
const warn = console.warn; console.warn = () => {};

function start(name) {
  const env = makeBridge({ on: true });
  const quest = env.bridge.machine.startQuestByName(name, FACTION);
  stubWorld(quest);
  tickN(env.bridge, 3);
  return { ...env, quest };
}
function choose(env, c) {
  for (const t of askTasks(env.quest)) forceTask(t);
  tickN(env.bridge, 1);
  env.rec.asked[0].respond(c);
  tickN(env.bridge, 4);
}
function report(name, c, { quest, rec }) {
  const ended = quest.questComplete || quest.ticksToEnd > 0;
  console.log(`${name} choice ${c}: ended=${ended} success=${!!quest.questSuccess} outcome=${quest.ql?.outcome} gold/items=${JSON.stringify(goldOf(rec.rewards))} rep=${JSON.stringify(rec.rep)} legal=${JSON.stringify(rec.legal)} offers=${rec.offers.length} popups=${JSON.stringify(rec.popups.map((p) => p.slice(0, 50)))}`);
}
const finishClock = (quest, n) => { const r = quest.getClock({ name: n }); r.remainingTimeInSeconds = 0; r._triggerTask(quest); r.clockEnabled = false; r.clockFinished = true; };

// A0C01Y01: the quest ends on its own 27-hour timer, after the hand-in
for (const c of [0, 1]) {
  const env = start('A0C01Y01');
  choose(env, c);
  finishClock(env.quest, 'timer');
  tickN(env.bridge, 5);
  report('A0C01Y01', c, env);
}
// A0C01Y06: asked at _findtraitor_; then the shaman killed, then the S.13 day runs out
for (const c of [0, 1, null]) {
  const env = start('A0C01Y06');
  if (c != null) choose(env, c);
  env.quest.getTask({ name: 'traitordead' }).actions.forEach((a) => { if (a.isTriggerCondition) a.isComplete = true; });
  env.quest.getTask({ name: 'traitordead' }).start();
  tickN(env.bridge, 4);
  finishClock(env.quest, 'S.13');
  tickN(env.bridge, 5);
  report('A0C01Y06', c ?? 'never-asked', env);
}
// A0C41Y18 keep: the mummy destroyed
{
  const env = start('A0C41Y18');
  choose(env, 0);
  const t = env.quest.getTask({ name: 'S.05' });
  t.actions.forEach((a) => { if (a.isTriggerCondition) a.isComplete = true; });
  t.start();
  tickN(env.bridge, 5);
  report('A0C41Y18', 0, env);
}
// C0B00Y02: after the guardian's choice, the questor clicked
for (const c of [0, 1]) {
  const env = start('C0B00Y02');
  // the sham path, as the patch needs it: the draw is the sham, revealed
  env.quest.getTask({ name: 'sham' }).start();
  choose(env, c);
  const q = env.quest.getTask({ name: 'qgclicked' });
  q.actions.forEach((a) => { if (a.isTriggerCondition) a.isComplete = true; });
  q.start();
  tickN(env.bridge, 5);
  report('C0B00Y02', c, env);
}
console.warn = warn;
