// What a reward waiting's three pieces carry, rolled by the real producer - and what the card in the Quests tab shows of
// each (qlJournal.js qlOfferDetail): its name, tier, kind and affix lines.
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { rollRewardChoice } = await import(`${SNAP}/src/systems/questlines/qlRewards.js`);
const { affixLine } = await import(`${SNAP}/src/systems/loot/lootRarity.js`);
const pieces = rollRewardChoice({ seed: 12345, level: 12, tier: 3, entity: null });
for (const p of pieces) {
  const it = p.item;
  console.log(p.kind, p.tier, JSON.stringify(it.name), 'tpl', it.itemGroup ?? it.group, it.templateIndex, 'mat', it.nativeMaterialValue,
    'affixes', (it.affixes ?? []).length, '-> lines', (it.affixes ?? []).map((_, j) => affixLine(it, j)));
  console.log('   keys on item:', Object.keys(it).filter((k) => !k.startsWith('_')).join(','));
}
