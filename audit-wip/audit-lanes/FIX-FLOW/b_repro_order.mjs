// BRANCH Q3 (the ask while another popup is open): the host STACKS quest boxes, newest in front (world.js showQuestBox ->
// ServiceFlowWindow.push unshifts; quest.js _showPendingTaskMessages pops its stack so a task's own `say`s come out in
// order). `ask` does not ride that stack - QlAsk calls hooks.showChoice at once - so an ask in a task that runs AFTER
// another task's `say` in the same tick lands IN FRONT of that say: the player is asked before being told why.
//   A0C41Y18: _S.06_ says 1025 (the sage: the curse, and that destroying the mummy ends it) and starts _qlask_, which asks
//             1900 ("Of course, there is the coward's way...") - shown first.
//   A0C01Y06: _findtraitor_ says 1013 (the go-between: "Don't hurt me! ... %g's moved to __hidingplace_") and _qlask_
//             (when _findtraitor_) asks 1900 ("Look - finish off _master_ ...") - shown first.
const SNAP = '/home/user/daggerfall-js-source';
const { ServiceFlowWindow } = await import(`${SNAP}/src/ui/guildServiceWindows.js`);
const { choiceBoxes, tokensToRows } = await import(`${SNAP}/src/scenes/quest/questBridge.js`);
const { makeBridge, stubWorld } = await import('./b_harness.mjs');
console.warn = () => {};

function host() {
  let win = null;
  const show = (box) => { if (win && !win.done) win.push([box]); else win = new ServiceFlowWindow([box]); };
  return {
    show,
    showPopup: (_q, tokens) => { const rows = tokensToRows(tokens); if (rows.length) show({ rows }); },
    showChoice: (q, m, c, respond) => show(choiceBoxes(q, m, c, respond)),
    order: () => (win?.boxes ?? []).map((b) => (b.picker ? '[pick]' : b.onClick ? `[question] ${b.rows.join(' ').slice(0, 50)}` : b.rows.join(' ').slice(0, 50))),
  };
}
const fire = (q, n) => { const t = q.getTask({ name: n }); t.actions.forEach((a) => { if (a.isTriggerCondition) a.isComplete = true; }); t.start(); };

{
  const h = host();
  const { bridge } = makeBridge({ on: true });
  bridge.machine.deps.showPopup = h.showPopup; bridge.machine.deps.showChoice = h.showChoice;
  const q = bridge.machine.startQuestByName('A0C41Y18', 0);
  stubWorld(q);
  bridge.machine.tick();
  fire(q, 'S.04'); q.getTask({ name: 'S.07' }).start();   // the sage clicked with the finger in the pack
  for (let i = 0; i < 3; i++) bridge.machine.tick();   // 0.3 s of the machine's ticks - the player has not yet read 1025
  console.log('A0C41Y18 - the boxes in the order the player reads them:'); h.order().forEach((s, i) => console.log(`   ${i + 1}. ${s}`));
}
{
  const h = host();
  const { bridge } = makeBridge({ on: true });
  bridge.machine.deps.showPopup = h.showPopup; bridge.machine.deps.showChoice = h.showChoice;
  const q = bridge.machine.startQuestByName('A0C01Y06', 0);
  stubWorld(q);
  bridge.machine.tick();
  const tp = q.getTask({ name: 'teleportpc' }); tp.actions.forEach((a) => { a.isComplete = true; }); tp.start();   // teleported (done by hand: no world)
  fire(q, 'clickqgiver');   // back in town, the go-between clicked
  for (let i = 0; i < 3; i++) bridge.machine.tick();
  console.log('A0C01Y06 - the boxes in the order the player reads them:'); h.order().forEach((s, i) => console.log(`   ${i + 1}. ${s}`));
}
