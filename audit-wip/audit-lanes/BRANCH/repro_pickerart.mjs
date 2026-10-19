// BRANCH: the host's real box chain (questBridge.js choiceBoxes in ui/guildServiceWindows.js ServiceFlowWindow) when the
// list picker's art (PICK00I0.IMG) is not loaded: the pick step is skipped with no answer and no cancel, the window closes,
// and QlAsk's `asking` latch is never released - the question is never asked again (until a load), the quest waits forever.
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { ServiceFlowWindow } = await import(`${SNAP}/src/ui/guildServiceWindows.js`);
const { _setListPickerArtForTests, listPickerArtLoaded } = await import(`${SNAP}/src/ui/listPicker.js`);
const { choiceBoxes } = await import(`${SNAP}/src/scenes/quest/questBridge.js`);
const { makeBridge, askTasks, forceTask, stubWorld, FACTION } = await import('./harness.mjs');
console.warn = () => {};

_setListPickerArtForTests(null);   // as on a page that has not yet entered an interior, a dungeon or the travel map
const env = makeBridge({ on: true });
let shown = 0, win = null;
// the world host's showChoice, minus the mount: showQuestBox(choiceBoxes(...)) -> new ServiceFlowWindow([box])
env.bridge.machine.deps.showChoice = (q, message, choices, respond) => {
  shown++;
  win = new ServiceFlowWindow([choiceBoxes(q, message, choices, respond)], { onClose: () => {} });
};
const quest = env.bridge.machine.startQuestByName('L0B40Y04', FACTION);
stubWorld(quest);
for (let i = 0; i < 2; i++) env.bridge.tick(1);
for (const t of askTasks(quest)) forceTask(t);
env.bridge.tick(1);
console.log('art loaded:', listPickerArtLoaded(), '| asked:', shown);
win.click(160, 100);          // the question read, clicked through -> the pick
console.log('top is the pick:', !!win.top?.picker);
win.draw(null, null, null);   // the frame draws the pick: no art -> _advance() with no answer
console.log('window done:', win.done, '| boxes left:', win.boxes.length);
for (let i = 0; i < 50; i++) env.bridge.tick(1);
const ask = askTasks(quest)[0].actions.find((a) => a.typeName === 'QlAsk');
console.log('after 50 ticks - asked:', shown, '| ask.asking:', ask.asking, '| ask complete:', ask.isComplete, '| quest ended:', quest.questComplete || quest.ticksToEnd > 0);
