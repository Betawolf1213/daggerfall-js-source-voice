// UI REPRO: THE TRACKER'S "OBJECTIVE NOW" IS THE FIRST OPEN ONE IN SHEET ORDER - AN OPTIONAL ONE OVER THE ONE THE QUEST
// NEEDS. C0B10Y15 (Holy Orders, "Lich"): the relic taken, the quest now asks "Return the _item_ to _questgiver_"; the
// optional "Destroy =lich_" stands before it in the sheet. Real sheet, real layer (rowOf), real lens and tracker.
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { createQuestlines } = await import(`${SNAP}/src/systems/questlines/qlLayer.js`);
const { freshState } = await import(`${SNAP}/src/systems/questlines/qlState.js`);
const { QuestLens, currentObjective } = await import(`${SNAP}/src/ui/quest/questLens.js`);
const { QuestTracker } = await import(`${SNAP}/src/ui/quest/questTracker.js`);
const set = new Set(['_pickupitem_']);   // the relic is taken; the lich (optional) still stands
const quest = { questName: 'C0B10Y15', uid: 7, ql: Object.assign(freshState(), { tier: 2 }), questComplete: false,
  tasks: { get: (n) => ({ getTriggerValue: () => set.has(`_${n}_`) || set.has(n) }) }, resources: new Map(), activeLogMessages: new Map() };
const layer = createQuestlines({ machine: { quests: new Map([[7, quest]]) } });
layer.look();
const ql = layer.rowOf(quest);
console.log('objectives:', ql.objectives.map((o) => `${o.state}${o.optional ? '(optional)' : ''}: ${o.text}`));
console.log('currentObjective ->', JSON.stringify(currentObjective(ql)));
const message = { id: 1010, getTextTokens: () => [{ text: 'Recover the relic.', formatting: 'text' }], parentQuest: null };
const lens = new QuestLens({ questLog: () => ({ active: [{ id: '7', name: 'Lich', questName: 'C0B10Y15', messages: [message], steps: [{ stepID: 0, messageID: 1010, time: 1 }], clocks: [], ql }], ended: [] }) });
const tracker = new QuestTracker(); tracker.pinned = '7';
tracker.hear(lens.look());
console.log("the HUD card's line ->", JSON.stringify(tracker.frame().opening));
