// REPRO: an introduction is begun whatever its feature's switch says. Offline the Loot rarity row is the player's
// (features.js lootRarity: initial true, online forced) - off, no gem is set and no piece reforged (reforge.js socketWork
// 'off'), so introGear's QLIG01/QLIG02 can never finish; yet lineOpens begins the line at level 4 and the runner
// offers each failed step again a day later, for ever. (The King's Gambit row is `online: 'player'` - off, QLIT02 the
// same, online too; naval combat off offline, QLIS03.)
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { setPref } = await import(SNAP + '/src/systems/uiPrefs.js');
const { lootRarityOn } = await import(SNAP + '/src/systems/loot/lootRarity.js');
const { setGemPiece, setGemRefusal } = await import(SNAP + '/src/systems/reforge.js');
const { lineById, lineOpens } = await import(SNAP + '/src/systems/questlines/qlLines.js');
const { setActSink } = await import(SNAP + '/src/systems/questlines/qlActs.js');
const heard = [];
setActSink((k, n) => { heard.push(k); return 1; });
setPref('lootRarity', false);
console.log('loot rarity on:', lootRarityOn());
const piece = { name: 'Steel Longsword', sockets: ['empty'], identified: true, rarity: 'magic' };
const player = { items: [piece, { templateIndex: 0, name: 'Ruby', gem: 'ruby' }] };
console.log('set a gem:', JSON.stringify(setGemPiece(piece, 'ruby', player)), '| acts heard:', JSON.stringify(heard));
console.log('introGear opens at level 9 offline:', lineOpens(lineById('introGear'), { level: () => 9, online: () => false, lineDone: () => false }));
