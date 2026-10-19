// REPRO: a temple member's ladder leaves out the one quest the classic list keeps for that temple's own members. The
// list offers a Temple of Akatosh member every 'M' row AND the 'T' row (questLists.js getGuildQuestPool: status is the
// deity's letter, tplMemb folds it to 'M'); qlLadders.js keeps `r.membership === 'M'` alone.
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { ladders } = await import(SNAP + '/src/systems/questlines/qlLadders.js');
const { classicRows, loadTables } = await import(SNAP + '/test/qlSources.mjs');
const { GUILD_GROUPS } = await import(SNAP + '/src/formats/factionFile.js');
loadTables();
const HO = GUILD_GROUPS.HolyOrder;
const pool = classicRows().filter((r) => r.group === 'HolyOrder');
const pools = new Map([[HO, pool]]);
const [l] = ladders({ memberships: { [HO]: { guild: 'Temple:Akatosh', rank: 3 } }, pools });
const onLadder = l.rungs.flatMap((r) => r.quests.map((q) => q.name));
console.log('ladder', l.key, 'rank', l.rank, 'quests on it:', onLadder.join(' '));
console.log('Akatosh member row (membership T):', pool.filter((r) => r.membership === 'T').map((r) => r.name).join(' '), '-> on the ladder?', onLadder.includes('D0B00Y00'));
