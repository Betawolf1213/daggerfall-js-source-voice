// REWARD Q2: what a quest's choice is worth against the game's own ladder - a dungeon's corpse and chest at the player's
// level (lootRarity.js rarityChances, per 1000), and what the quickest repeatable quests pay (the tier's floor).
import { SNAP } from './_env.mjs';
const { rarityChances } = await import(`${SNAP}/src/systems/loot/lootRarity.js`);
const { TIER_FLOORS, rollRewardChoice, pieceRarity } = await import(`${SNAP}/src/systems/questlines/qlRewards.js`);
const { questTierOf } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
const { itemWorth } = await import(`${SNAP}/src/systems/item/itemLaw.js`);
const { seededRng } = await import(`${SNAP}/src/systems/wind/wind.js`);
for (const tier of [5, 10, 15, 21]) for (const kind of ['corpse', 'chest']) {
  const c = rarityChances({ kind, tier, luck: 50 });
  console.log(`dungeon ${kind} at tier ${tier}: magic+ ${(c.magic / 10).toFixed(1)}%  rare+ ${(c.rare / 10).toFixed(1)}%  legendary ${(c.legendary / 10).toFixed(2)}%`);
}
console.log('\na social quest (Commoners, Merchants, Nobility: the level band) - tier by level:', [1, 7, 14, 21, 30].map((l) => `L${l}=t${questTierOf({ minReq: 0, social: true, level: l })}`).join(' '));
console.log('a guild quest by rank:', [0, 2, 4, 6, 9].map((r) => `rank${r}=t${questTierOf({ minReq: r, level: 30 })}`).join(' '));
for (const t of [1, 2, 3, 4]) {
  const rolls = seededRng(t);
  const n = 20000, got = { magic: 0, rare: 0, legendary: 0 };
  for (let i = 0; i < n; i++) got[pieceRarity(t, rolls)]++;
  let worth = 0, k = 0;
  for (let s = 0; s < 300; s++) for (const p of rollRewardChoice({ seed: s, level: 21, tier: t, entity: null })) { worth += itemWorth(p.item); k++; }
  console.log(`tier ${t}: each of the three pieces magic ${(got.magic / n * 100).toFixed(1)}%  rare ${(got.rare / n * 100).toFixed(1)}%  legendary ${(got.legendary / n * 100).toFixed(1)}%  - a piece's mean worth (judge) at L21 ${Math.round(worth / k)}`);
}
// the choice: the player keeps the best of three - how often a choice HOLDS a piece of each tier
const e = { level: 21, career: { weaponArmorShieldsBitfield: 0, forbiddenMaterialsFlags: 0 }, skills: new Array(35).fill(40) };
for (const t of [1, 2, 3, 4]) {
  let leg = 0, rare = 0; const N = 2000;
  for (let s = 0; s < N; s++) { const p = rollRewardChoice({ seed: s * 31 + t, level: 21, tier: t, entity: e }); if (p.some((x) => x.tier === 'legendary')) leg++; if (p.some((x) => x.tier === 'rare' || x.tier === 'legendary')) rare++; }
  console.log(`tier ${t}: a choice of three holds a Rare-or-better ${(rare / N * 100).toFixed(1)}%, a Legendary ${(leg / N * 100).toFixed(1)}%`);
}
