// Every guild's ladder as a top-rank member, off the real classic list and the real sheets: each rung's quests, the
// flagship marks (a sheet with a branch), against the record's flagship 66 (Questlines-Arc.md section 3).
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { ladders } = await import(SNAP + '/src/systems/questlines/qlLadders.js');
const { classicRows, loadTables } = await import(SNAP + '/test/qlSources.mjs');
const { GUILD_GROUPS } = await import(SNAP + '/src/formats/factionFile.js');
const { GUILDS } = await import(SNAP + '/src/systems/guild/guilds.js');
loadTables();
const rows = classicRows();
const pools = new Map();
for (const r of rows) { const g = GUILD_GROUPS[r.group]; if (g == null) continue; if (!pools.has(g)) pools.set(g, []); pools.get(g).push(r); }
const FLAG66 = 'R0C10Y00 R0C10Y01 R0C10Y02 R0C10Y18 R0C11Y03 R0C11Y16 R0C11Y19 R0C11Y26 R0C11Y28 R0C20Y22 R0C4XY23 R0C60Y24 A0C00Y10 A0C00Y14 A0C00Y15 A0C00Y17 A0C01Y01 A0C01Y03 A0C01Y06 A0C01Y09 A0C01Y13 A0C0XY04 A0C41Y18 B0B40Y08 B0B40Y09 B0B50Y11 B0B60Y12 B0B70Y14 B0B70Y16 B0B71Y03 B0B80Y17 B0B81Y02 K0C00Y00 K0C00Y03 K0C00Y05 K0C00Y07 K0C01Y00 K0C01Y10 K0C30Y03 M0B00Y16 M0B11Y18 M0B21Y19 M0B40Y05 M0B50Y09 M0B60Y10 N0B00Y09 N0B00Y17 N0B11Y18 N0B21Y14 N0B40Y07 L0A01L00 L0B40Y04 L0B50Y11 L0B60Y10 O0B00Y00 O0B00Y01 O0B00Y11 O0B10Y00 P0A01L00 P0B00L06 P0B01L02 P0B10L08 C0B00Y02 C0B3XY09 C0C00Y10 Q0C4XY04'.split(' ');
const memberships = {};
for (const g of Object.values(GUILDS)) memberships[g.guildGroup] = { guild: g.name, rank: 9 };
memberships[GUILD_GROUPS.HolyOrder] = { guild: 'Temple:Arkay', rank: 9 };
memberships[GUILD_GROUPS.KnightlyOrder] = { guild: 'Order:Raven', rank: 9 };
for (const l of ladders({ memberships, pools })) {
  const qs = l.rungs.flatMap((r) => r.quests);
  const missing = FLAG66.filter((n) => rows.find((r) => r.name === n && GUILD_GROUPS[r.group] === l.group && r.membership === 'M') && !qs.find((q) => q.name === n && q.flagship));
  console.log(l.key, 'rungs', l.rungs.map((r) => `${r.rank}:${r.quests.length}`).join(' '), '| flagship marked', qs.filter((q) => q.flagship).map((q) => q.name).join(' '), missing.length ? `| a flagship member quest NOT marked: ${missing.join(' ')}` : '');
}
