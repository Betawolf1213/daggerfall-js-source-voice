import '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/FIX-REWARD/_env.mjs';
const R = await import('/home/user/daggerfall-js-source/src/systems/questlines/qlRewards.js');
const { itemLongName, itemNameParts } = await import('/home/user/daggerfall-js-source/src/systems/item/itemInfo.js');
const { itemFindings } = await import('/home/user/daggerfall-js-source/src/systems/item/itemLaw.js');
for (const n of [{ kind: 'weapon', base: 'Longsword' }, { kind: 'armor', base: 'Helm' }, { kind: 'jewel', base: 'Ring' }, { kind: 'jewel', base: 'Wand' }, { kind: 'armor', base: 'Longsword' }, { kind: 'weapon', base: 'Arrow' }]) console.log(n.kind, n.base, R.namedBaseOf(n));
const e = { level: 10, career: { weaponArmorShieldsBitfield: 0, forbiddenMaterialsFlags: 0 }, skills: Object.assign(new Array(35).fill(10), { 29: 60, 31: 40 }) };
for (let s = 0; s < 4; s++) {
  const p = R.rollRewardChoice({ seed: s, level: 10, tier: 3, entity: e, named: { name: "Corvane's Spire-Blade", kind: 'weapon', base: 'Longsword' } });
  console.log(p.map((x) => `${x.kind}:${x.tier}:${x.named ? 'N ' : ''}${itemLongName(x.item)} [${JSON.stringify(itemNameParts(x.item))}] law=${itemFindings(x.item)}`).join(' | '));
}
