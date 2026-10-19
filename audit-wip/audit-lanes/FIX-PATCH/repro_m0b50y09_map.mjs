// BRANCH: M0B50Y09's other reward. Half the draws (`pick one of _map_ _nomap_`) the questor adds a map to a second
// dungeon on the hand-in - DFU's `_S.06_ task: when _map_ and _victory_ / reveal _newdung_ readmap / say 1080`. The patch
// moves `_victory_` behind the keep answer; the waived path (`_qlaltpath_`: ql paid, start timer _end_) never sets it,
// so a player who waives the FEE also loses the MAP (and its words, 1080) - nothing in the question says so.
import { makeBridge, askTasks, forceTask, stubWorld, FACTION } from './harness.mjs';
console.warn = () => {};
for (const [label, on, answer] of [['switch off (DFU)', false, null], ['keep (the fee)', true, 0], ['alt (waive the fee)', true, 1]]) {
  const { bridge, rec } = makeBridge({ on });
  const quest = bridge.machine.startQuestByName('M0B50Y09', FACTION);
  stubWorld(quest);
  bridge.machine.tick();
  quest.getTask({ name: 'map' }).start(); quest.getTask({ name: 'nomap' }).clear();   // the draw: the map
  quest.getTask({ name: 'S.01' }).start(); quest.getTask({ name: 'qgclicked' }).start();
  for (const t of askTasks(quest)) forceTask(t);
  bridge.machine.tick();
  if (answer != null) rec.asked[0].respond(answer);
  for (let i = 0; i < 6; i++) bridge.machine.tick();
  const s06 = quest.getTask({ name: 'S.06' }).getTriggerValue() || !quest.getTask({ name: 'qlaltS06' }) ? quest.getTask({ name: 'S.06' }) : quest.getTask({ name: 'qlaltS06' });   // FIX-PATCH: the second answer's own copy
  const reveal = s06.actions.find((a) => a.typeName === 'RevealLocation' || /Reveal/.test(a.typeName));
  console.log(`${label}: _${s06.symbol.name}_ (the map) ran=${s06.getTriggerValue()} reveal done=${!!reveal?.isComplete} say 1080 shown=${rec.popups.some((p) => /sweeten/.test(p))}`);
}
