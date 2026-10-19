// REWARD Q2-Q4: the choice of three, built by the real code - determinism (the same seed rolls the same three), the item
// law (systems/item/itemLaw.js itemFindings - the account service's judge and the wire's door), the copy ledger's key
// (itemIds.js valuablePiece), the class fit, and the named pieces' names against what they are.
import { SNAP } from './_env.mjs';
const { rollRewardChoice, rewardSeed, fitsPlayer, bestWeaponSkills, TIER_FLOORS } = await import(`${SNAP}/src/systems/questlines/qlRewards.js`);
const { itemFindings } = await import(`${SNAP}/src/systems/item/itemLaw.js`);
const { valuablePiece } = await import(`${SNAP}/src/systems/item/itemIds.js`);
const { validLootItem } = await import(`${SNAP}/src/systems/loot/loot.js`);
const { templateByIndex } = await import(`${SNAP}/src/systems/item/itemTemplates.js`);
const { isForbiddenEquip, wearableItem } = await import(`${SNAP}/src/systems/equip.js`);
const { weaponSkillUsed } = await import(`${SNAP}/src/characters/weapons.js`);
const { SKILLS } = await import(`${SNAP}/src/systems/skills.js`);

const skills = (over = {}) => { const s = new Array(35).fill(20); for (const [k, v] of Object.entries(over)) s[SKILLS[k]] = v; return s; };
const ENTITIES = {
  fighter: { level: 10, career: { weaponArmorShieldsBitfield: 0, forbiddenMaterialsFlags: 0 }, skills: skills({ LongBlade: 70, Axe: 50 }) },
  archer: { level: 10, career: { weaponArmorShieldsBitfield: 0, forbiddenMaterialsFlags: 0 }, skills: skills({ Archery: 70, ShortBlade: 50 }) },
  noSkills: { level: 1, career: { weaponArmorShieldsBitfield: 0, forbiddenMaterialsFlags: 0 }, skills: new Array(35).fill(0) },
  // a class barred from every weapon proficiency (bits 0-5) - a custom class may take it
  noWeapons: { level: 10, career: { weaponArmorShieldsBitfield: 0x3f, forbiddenMaterialsFlags: 0 }, skills: skills({ LongBlade: 70 }) },
  // a mage: plate and chain forbidden (armour bits 6-8: leather 1, chain 2, plate 4 -> chain|plate = 6), every shield (bits 9-12)
  mage: { level: 10, career: { weaponArmorShieldsBitfield: (6 << 6) | (0xf << 9), forbiddenMaterialsFlags: 0 }, skills: skills({ ShortBlade: 40, BluntWeapon: 35, Destruction: 80 }) },
  // a class barred from every armour type and shield (custom)
  noArmour: { level: 10, career: { weaponArmorShieldsBitfield: (7 << 6) | (0xf << 9), forbiddenMaterialsFlags: 0 }, skills: skills({ LongBlade: 70 }) },
};
const SEEDS = 300;
let nondet = 0, lawBad = [], wireBad = 0, unfit = [], notValuable = 0, counts = {}, kindsBy = {};
for (const [who, entity] of Object.entries(ENTITIES)) {
  counts[who] = {}; kindsBy[who] = {};
  for (let s = 0; s < SEEDS; s++) for (const tier of [1, 2, 3, 4]) {
    const a = rollRewardChoice({ seed: s * 7919 + tier, level: entity.level, tier, entity });
    const b = rollRewardChoice({ seed: s * 7919 + tier, level: entity.level, tier, entity });
    if (JSON.stringify(a) !== JSON.stringify(b)) nondet++;
    counts[who][a.length] = (counts[who][a.length] ?? 0) + 1;
    const k = a.map((p) => p.kind).join('+'); kindsBy[who][k] = (kindsBy[who][k] ?? 0) + 1;
    for (const p of a) {
      const f = itemFindings(p.item);
      if (f.length) lawBad.push(`${who} t${tier} ${p.item.name}: ${f.join(',')}`);
      if (!validLootItem(JSON.parse(JSON.stringify(p.item)))) wireBad++;
      if (!valuablePiece(p.item)) notValuable++;
      if (!fitsPlayer(p.item, p.kind, entity)) unfit.push(`${who} ${p.kind} ${p.item.name}`);
      if (isForbiddenEquip(entity.career, p.item)) unfit.push(`${who} FORBIDDEN ${p.item.name}`);
      if (!wearableItem(p.item)) unfit.push(`${who} UNWEARABLE ${p.item.name}`);
    }
  }
}
console.log(`rolled ${SEEDS * 4} choices for each of ${Object.keys(ENTITIES).length} players`);
console.log('same seed, different three:', nondet);
console.log('item law findings:', lawBad.length, lawBad.slice(0, 5));
console.log('refused at the wire (validLootItem):', wireBad, '  not a ledger-keyed valuable piece:', notValuable);
console.log('unfit / forbidden / unwearable:', unfit.length, unfit.slice(0, 5));
console.log('pieces per choice, by player:', JSON.stringify(counts));
console.log('kinds, by player:', JSON.stringify(kindsBy));
// the weapons fit the best two skills
const f = ENTITIES.archer; const w = [];
for (let s = 0; s < 200; s++) { const p = rollRewardChoice({ seed: s, level: 10, tier: 2, entity: f }).find((x) => x.kind === 'weapon'); if (p) w.push(weaponSkillUsed(p.item.templateIndex)); }
console.log('archer best skills', bestWeaponSkills(f), ' weapons\' skills seen:', [...new Set(w)]);
