// ACTS lane repro 5: a line whose step waits on an act whose ONLY producer sits behind a Features switch the player
// holds is started with that switch off - the runner's gate (qlLines.js lineOpens) reads level, `after` and online, never
// the feature. The King's Gambit row is the player's ONLINE too (features.js `online: 'player'`): with it off no table
// offers the game, so `gambit-won` (QLIT02, A Seat at the Table's second step) can never be said. Offline, Loot rarity
// off refuses every socket and reforge (reforge.js socketWork 'off'), so The Smith's Secrets (introGear) can never move.
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { createLineRunner } = await import(`${SNAP}/src/systems/questlines/qlLineRunner.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { gambitTableOn } = await import(`${SNAP}/src/scenes/gambitTableGame.js`).catch(() => ({ gambitTableOn: null }));
const { KINGS_GAMBIT_KEY, FEATURES } = await import(`${SNAP}/src/systems/features.js`);
const LR = await import(`${SNAP}/src/systems/loot/lootRarity.js`);
const { setGemPieceRefusal, setGemRefusal } = await import(`${SNAP}/src/systems/reforge.js`);

setPref('questlines', true);
setPref(KINGS_GAMBIT_KEY, false);
setPref('lootRarity', false);
const row = (FEATURES ?? []).find?.((f) => f.id === 'mod-kings-gambit');
console.log("King's Gambit row online:", JSON.stringify(row?.control?.online), ' gambitTableOn() =', gambitTableOn ? gambitTableOn() : '(n/a)', ' lootRarityOn() =', LR.lootRarityOn());
const machine = { quests: new Map(), questsToInvoke: [], scheduleQuestByName(name) { const q = { questName: name, questComplete: false, questTombstoned: false }; this.questsToInvoke.push(q); return q; } };
const runner = createLineRunner({ machine, service: null, nowMs: () => 0, ctx: { level: () => 10, online: () => false, nowSeconds: () => 1e6 } });
runner.restore({ introTables: { step: 1, done: false, wait: 0, outcomes: { 0: { id: 'done' } }, claims: {} } });
runner.look();
console.log('scheduled with the switches off:', JSON.stringify(machine.questsToInvoke.map((q) => q.questName)));
const piece = { isIdentified: true, rarity: 'rare', sockets: [LR.SOCKET_EMPTY] };
console.log('a gem set with Loot rarity off:', setGemRefusal(piece, 'ruby', { items: [] }));
