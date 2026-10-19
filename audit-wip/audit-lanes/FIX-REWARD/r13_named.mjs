// REWARD Q4: every `named` in the sheets, built as qlLayer.ending builds it (the card of the named kind takes the name)
// over the real roll - what base the name lands on, and what the inventory shows (itemInfo.js itemLongName).
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
const named = [];
for (const fam of SHEET_FAMILIES) for (const s of fam.sheets) for (const o of s.outcomes ?? []) if (o.named) named.push({ quest: s.quest, tier: s.tier ?? 3, o });
const N = 200;
for (const { quest, tier, o } of named) {
  const bases = {}; let law = 0, wrongKind = 0; const shown = new Set();
  for (const [who, e] of Object.entries(players)) {
    for (let seed = 0; seed < N; seed++) {
      const pieces = rollRewardChoice({ seed: seed * 104729 + 17, level: e.level, tier: rewardTier(tier, o), entity: e });
      const p = pieces.find((x) => x.named) ?? pieces.find((x) => x.kind === o.named.kind) ?? pieces[0];
      if (p.kind !== o.named.kind) wrongKind++;
      p.item.name = o.named.name;
      if (itemFindings(p.item).length) law++;
      const base = templateByIndex(p.item.templateIndex)?.name ?? '?';
      bases[base] = (bases[base] ?? 0) + 1;
      if (shown.size < 3) shown.add(itemLongName(p.item));
    }
  }
  const top = Object.entries(bases).sort((a, b) => b[1] - a[1]);
  console.log(`${quest}.${o.id} "${o.named.name}" (${o.named.kind}): ${top.length} bases - ${top.slice(0, 8).map(([b, n]) => `${b} ${n}`).join(', ')}${top.length > 8 ? ', ...' : ''}`);
  console.log(`      law findings ${law}; named onto another kind (no ${o.named.kind} in the three) ${wrongKind}; the pack shows e.g. ${[...shown].map((s) => `"${s}"`).join(', ')}`);
}
