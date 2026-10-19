// BRANCH: `ql act`'s count-from (`from`, QlAct's saved field) is runtime progress the share law does not list
// (quest/shareActions.js sharedActionMatches: "every field is immutable unless explicitly listed ... new actions fail
// closed"). The receiver's own parse holds `from: null`; once the sharer's trigger has been checked a single time it holds
// a number - and the envelope is refused as a forged script ('mismatch'): a fresh share and every resync of a party copy.
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { prepareQuestShare, receiveSharedQuest } = await import(`${SNAP}/src/systems/quest/questShare.js`);
const { makeBridge } = await import('./harness.mjs');
console.warn = () => {};
const NAMES = ['QLOC02', 'QLBD03', 'QLBD04', 'QLWR01', 'QLIF01', 'QLIT01', 'QLIS01'];
for (const name of NAMES) {
  for (const ticks of [0, 3]) {
    const s = makeBridge({ on: true });
    const quest = s.bridge.machine.startQuestByName(name, 0);
    if (!quest) { console.log(name, 'did not start'); continue; }
    for (let i = 0; i < ticks; i++) s.bridge.machine.tick();
    const acts = [...quest.tasks.values()].flatMap((t) => t.actions).filter((a) => a.typeName === 'QlAct').map((a) => a.from);
    const env = prepareQuestShare(s.bridge.machine, quest.uid);
    if (!env.ok) { console.log(`${name} after ${ticks} ticks: sender cannot prepare (${env.reason}) - ended headless, skipped`); continue; }
    const r = makeBridge({ on: true });
    const got = receiveSharedQuest(r.bridge.machine, r.bridge.questLists, name, env.data, {});
    console.log(`${name} shared after ${ticks} ticks: QlAct.from=${JSON.stringify(acts)} -> receiver ${JSON.stringify({ ok: got.ok, reason: got.reason ?? null })}`);
  }
}
