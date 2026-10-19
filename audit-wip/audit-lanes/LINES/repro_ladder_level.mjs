// REPRO: the Mages Guild and the knightly orders offer a member the quests of their LEVEL when it is above their rank
// (MagesGuild.cs IsSatisfyQuestReqByLevel - guilds.js questRankFor, offerFlow.js "Effective rank"); the ladder reads the
// rank alone (qlLadders.js `reached: m.rank >= rank`) and is never told the level. A level-12 Apprentice of the Mages
// Guild is offered N0B40Y07 (a rank-4 flagship) by the guild hall, while their ladder draws its rung "(not yet)".
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { ladders } = await import(SNAP + '/src/systems/questlines/qlLadders.js');
const { classicRows, loadTables } = await import(SNAP + '/test/qlSources.mjs');
const { GUILD_GROUPS } = await import(SNAP + '/src/formats/factionFile.js');
const { GUILDS, questRankFor } = await import(SNAP + '/src/systems/guild/guilds.js');
loadTables();
const MG = GUILD_GROUPS.MagesGuild;
const pool = classicRows().filter((r) => r.group === 'MagesGuild');
const [l] = ladders({ memberships: { [MG]: { guild: 'MagesGuild', rank: 0 } }, pools: new Map([[MG, pool]]) });
const level = 12;
const offerRank = questRankFor(GUILDS.MagesGuild, 0, level);
const offered = pool.filter((r) => r.membership === 'M' && r.minReq < 10 && r.minReq <= offerRank).map((r) => r.name);
console.log(`the hall's offer rank for a level-${level} Apprentice:`, offerRank, '- offers', offered.length, 'member quests, N0B40Y07 among them:', offered.includes('N0B40Y07'));
console.log('the ladder:', l.rungs.map((r) => `rank ${r.rank} ${r.reached ? 'reached' : '(not yet)'}: ${r.quests.map((q) => q.name).join(' ')}`).join(' | '));
