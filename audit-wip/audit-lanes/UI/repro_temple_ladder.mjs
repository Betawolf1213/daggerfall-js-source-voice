// UI REPRO: A TEMPLE'S LADDER LEAVES OUT ITS OWN DIVINE'S QUEST. DFU offers a temple member the HolyOrder rows of its
// own temple's letter (QuestList-Classic.txt: E0B00Y00 'A' Arkay, D0B00Y00 'T' Akatosh, ...) beside the 'M' rows -
// questLists.js getGuildQuestPool folds the temple status to Member and takes either. qlLadders.js keeps 'M' alone.
// The REAL list (parsed as questLists reads it: name, group, membership's first letter, minReq), the REAL ladders().
import { readFileSync } from 'node:fs';
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { ladders } = await import(`${SNAP}/src/systems/questlines/qlLadders.js`);
const { GUILD_GROUPS } = await import(`${SNAP}/src/formats/factionFile.js`);
const rows = readFileSync(`${SNAP}/vendor/dfu-quests/Tables/QuestList-Classic.txt`, 'utf8').split('\n')
  .filter((l) => /^[A-Z0-9$_]+, HolyOrder,/.test(l)).map((l) => l.split(/,\s*/)).map(([name, , m, minReq]) => ({ name, membership: m[0], minReq: Number(minReq) }));
const group = GUILD_GROUPS?.HolyOrder;
const ladder = ladders({ memberships: { [group]: { guild: 'Temple:Arkay', rank: 3 } }, pools: new Map([[group, rows]]) })[0];
const onLadder = ladder.rungs.flatMap((r) => r.quests.map((q) => q.name));
const offeredByDfu = rows.filter((r) => (r.membership === 'M' || r.membership === 'A') && r.minReq < 10).map((r) => r.name);
console.log('rungs:', ladder.rungs.map((r) => `${r.title}: ${r.quests.map((q) => q.name).join(' ')}`));
console.log('Temple of Arkay ladder holds', onLadder.length, 'quests; DFU offers an Arkay member', offeredByDfu.length);
console.log('missing from the ladder:', offeredByDfu.filter((n) => !onLadder.includes(n)));
