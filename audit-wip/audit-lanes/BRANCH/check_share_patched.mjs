// BRANCH: a patched DFU quest shared under its question and after its answer - QlAsk carries no runtime field, so it passes
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { prepareQuestShare, receiveSharedQuest } = await import(`${SNAP}/src/systems/quest/questShare.js`);
const { makeBridge, askTasks, forceTask, stubWorld } = await import('./harness.mjs');
console.warn = () => {};
for (const name of ['L0B40Y04', 'R0C11Y26', 'C0B00Y02']) {
  for (const phase of ['asking', 'answered']) {
    const s = makeBridge({ on: true });
    const quest = s.bridge.machine.startQuestByName(name, 108);
    stubWorld(quest);
    for (let i = 0; i < 2; i++) s.bridge.machine.tick();
    for (const t of askTasks(quest)) forceTask(t);
    s.bridge.machine.tick();
    if (phase === 'answered') s.rec.asked[0].respond(0);
    const env = prepareQuestShare(s.bridge.machine, quest.uid);
    const r = makeBridge({ on: true });
    const got = env.ok ? receiveSharedQuest(r.bridge.machine, r.bridge.questLists, name, env.data, {}) : env;
    console.log(name, phase, JSON.stringify({ ok: got.ok, reason: got.reason ?? null }));
  }
}
