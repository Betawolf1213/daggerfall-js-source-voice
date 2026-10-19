// UI REPRO: THE TUTORIALS' "QUESTLINES" PAGE POPS AT CHARACTER CREATION. A new character's two start quests
// (questBridge.js GAME_START_QUESTS, started by initAtGameStart through machine.startQuestImmediate, which asks the
// layer's stamp) include _BRISIEN, which has a sheet - so the page fires before the player has taken any quest, ahead of
// the basic "Quests" page (which waits for the first quest news), whatever its trigger line says.
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const tut = await import(`${SNAP}/src/systems/tutorials.js`);
const { createQuestlines } = await import(`${SNAP}/src/systems/questlines/qlLayer.js`);
const { GAME_START_QUESTS } = await import(`${SNAP}/src/scenes/quest/questBridge.js`);
const { sheetFor } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { tutorialById } = tut;
setPref('questlines', true);
const popped = [];
tut.setTutorialHandler((id) => { popped.push(id); tut.markTutorialSeen(id); return true; });
const layer = createQuestlines({ machine: { quests: new Map() } });
console.log('GAME_START_QUESTS:', GAME_START_QUESTS, '- with a sheet:', GAME_START_QUESTS.filter((n) => sheetFor(n)));
for (const questName of GAME_START_QUESTS) layer.stamp({ questName });   // what initAtGameStart's two starts ask
console.log('pages popped at the game start:', popped);
console.log('the page says it pops:', JSON.stringify(tutorialById('questlines').trigger));
