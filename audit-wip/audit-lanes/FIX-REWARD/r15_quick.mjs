// REWARD Q2: the social quests (tier by the player's LEVEL band - qlLaw.js questTierOf) that never send the player to a
// dungeon - town errands - and pay gear: at level 21 each is tier 4 (a Legendary in the choice 40% of the time).
import { SNAP } from './_env.mjs';
const { classicRows, questSource, loadTables } = await import(`${SNAP}/test/qlSources.mjs`);
const { SHEETS } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { PAY_PROFILES } = await import(`${SNAP}/src/systems/questlines/qlRewards.js`);
loadTables();
const social = new Set(['Commoners', 'Merchants', 'Nobility']);
const out = [];
for (const r of classicRows()) {
  if (!social.has(r.group)) continue;
  const lines = questSource(r.name, true) ?? [];
  const places = lines.filter((l) => /^\s*Place\s/.test(l));
  const dungeon = places.some((l) => /dungeon/i.test(l));
  const foes = lines.some((l) => /^\s*Foe\s/.test(l));
  const sheet = SHEETS.get(r.name.toUpperCase());
  const gear = (sheet?.outcomes ?? []).some((o) => !o.failure && PAY_PROFILES[o.pay]?.gear);
  const pays = lines.some((l) => /^\s*(give pc\s|ql paid\b)/.test(l));
  if (!dungeon && !foes && gear && pays) out.push(`${r.name} ${r.group} minReq ${r.minReq} ${places.length} places: ${places.map((l) => l.trim().replace(/^Place\s+/, '')).join(' | ')}`);
}
console.log('town errands that pay a choice of gear, tiered by level:', out.length);
for (const l of out) console.log('  ', l);
