const LIVE = '/home/user/daggerfall-js-source';
const { prepareQuestShare, shapeMismatch } = await import(`${LIVE}/src/systems/quest/questShare.js`);
const { makeBridge } = await import('./b_harness.mjs');
console.warn = () => {};
for (const on of [false, true]) {
  const s = makeBridge({ on });
  const quest = s.bridge.machine.startQuestByName('A0C01Y03', 0);
  s.bridge.machine.tick();
  const env = prepareQuestShare(s.bridge.machine, quest.uid); console.log('prepared', env.ok, env.reason, quest.questComplete, quest.ticksToEnd);
  const r = makeBridge({ on: true });
  const local = r.bridge.machine.parseQuestShape('A0C01Y03', env.data.factionId, { questlines: env.data.ql?.stamp === 1 });
  const ref = local.getSaveData();
  console.log('sharer on', on, 'shape:', shapeMismatch(local, env.data));
  const t = env.data.tasks;
  for (let i = 0; i < t.length; i++) { if (t[i].type !== ref.tasks[i].type || t[i].symbol.original !== ref.tasks[i].symbol.original) console.log(' task', i, t[i].symbol.original, ref.tasks[i]?.symbol?.original); }
  const res = env.data.resources.map((x) => x.symbol.original); const want = ref.resources.map((x) => x.symbol.original);
  console.log(' extra res:', res.filter((x) => !want.includes(x)), 'missing:', want.filter((x) => !res.includes(x)));
}
