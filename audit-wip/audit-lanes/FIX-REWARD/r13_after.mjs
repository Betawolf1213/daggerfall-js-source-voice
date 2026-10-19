// REWARD-5 after the fix: every `named` rolled as the live layer rolls it (rollRewardChoice's `named`), 3 players x 200
// seeds - the bases a name lands on, how often a holder who cannot wear the base gets the card unnamed, the pack's name.
import { SNAP } from './_env.mjs';
const { SHEET_FAMILIES } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { rollRewardChoice, rewardTier } = await import(`${SNAP}/src/systems/questlines/qlRewards.js`);
const { templateByIndex } = await import(`${SNAP}/src/systems/item/itemTemplates.js`);
const { itemLongName } = await import(`${SNAP}/src/systems/item/itemInfo.js`);
const { itemFindings } = await import(`${SNAP}/src/systems/item/itemLaw.js`);
const { SKILLS } = await import(`${SNAP}/src/systems/skills.js`);
const sk = (over) => { const s = new Array(35).fill(20); for (const [k, v] of Object.entries(over)) s[SKILLS[k]] = v; return s; };
const players = {
  swordsman: { level: 14, career: { weaponArmorShieldsBitfield: 0, forbiddenMaterialsFlags: 0 }, skills: sk({ LongBlade: 70, ShortBlade: 50 }) },
  archer: { level: 14, career: { weaponArmorShieldsBitfield: 0, forbiddenMaterialsFlags: 0 }, skills: sk({ Archery: 70, BluntWeapon: 50 }) },
  noWeapons: { level: 14, career: { weaponArmorShieldsBitfield: 0x3f, forbiddenMaterialsFlags: 0 }, skills: sk({}) },
};
for (const fam of SHEET_FAMILIES) for (const s of fam.sheets) for (const o of s.outcomes ?? []) if (o.named) {
  const bases = {}; let law = 0, unnamed = 0; const shown = new Set();
  for (const e of Object.values(players)) for (let seed = 0; seed < 200; seed++) {
    const pieces = rollRewardChoice({ seed: seed * 104729 + 17, level: e.level, tier: rewardTier(s.tier ?? 3, o), entity: e, named: o.named });
    const p = pieces.find((x) => x.named);
    if (!p) { unnamed++; if (pieces.some((x) => x.item.name === o.named.name)) law += 1000; continue; }
    if (itemFindings(p.item).length) law++;
    const b = templateByIndex(p.item.templateIndex)?.name; bases[b] = (bases[b] ?? 0) + 1;
    shown.add(itemLongName(p.item));
  }
  console.log(`${s.quest}.${o.id} "${o.named.name}" (${o.named.kind}, base ${o.named.base}): bases ${JSON.stringify(bases)}; unnamed (cannot wear) ${unnamed}/600; law ${law}; shows ${[...shown].map((x) => `"${x}"`).join(', ')}`);
}
