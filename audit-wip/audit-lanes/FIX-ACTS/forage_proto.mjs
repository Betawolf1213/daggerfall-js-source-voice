const R = '/home/user/daggerfall-js-source';
await import(`${R}/test/modsOff.js`);
const { setActSink } = await import(`${R}/src/systems/questlines/qlActs.js`);
const { useForagingTool, createForagingItem, setForagingHost, _setForagingRandomForTests } = await import(`${R}/src/systems/foraging/foragingInstall.js`);
const { FT, FORAGING_VENDOR } = await import(`${R}/src/systems/foraging/foragingLaw.js`);
const { setModSetting } = await import(`${R}/src/systems/modSettings.js`);
const { CLIMATES, LOCATION_TYPES } = await import(`${R}/src/formats/mapsFile.js`);
const heard = [];
setActSink((k, n) => { heard.push([k, n]); return 1; });
setModSetting(FORAGING_VENDOR, 'Enabled', true);
const OPEN = { inside: false, insideDungeon: false, insideCastle: false, locationType: LOCATION_TYPES.None, inLocationRect: false, hour: 12, climate: CLIMATES.Woodlands, region: 17, enemiesNear: false, carriedWeight: 10, maxEncumbrance: 100, swimming: false, exteriorWater: 'None' };
const player = () => ({ stats: { intelligence: 62, strength: 55, agility: 50, endurance: 50, luck: 45 }, items: [], wagonItems: [], fatigue: 40 * 64, health: 20, maxHealth: 100, magicka: 5, maxMagicka: 50 });
const draws = (...pairs) => { let i = 0; return () => { const [k, n] = pairs[i++] ?? [0, 1]; return (k + 0.5) / n; }; };
for (const [tool, world, d] of [[FT.WoodAxe, OPEN, [[0, 5]]], [FT.WoodAxe, OPEN, [[3, 5]]], [FT.FishingNet, { ...OPEN, exteriorWater: 'WaterWalking' }, [[0, 6]]], [FT.FishingNet, { ...OPEN, exteriorWater: 'WaterWalking' }, [[5, 6]]], [FT.Basket, OPEN, [[3, 6], [1, 5]]], [FT.Basket, OPEN, [[0, 6], [0, 5]]], [FT.Basket, OPEN, [[5, 6], [4, 5]]]]) {
  heard.length = 0;
  setForagingHost({ world: () => world, monthValue: () => 9, entity: () => null, startQuest: () => true });
  _setForagingRandomForTests(draws(...d));
  const e = player();
  const r = useForagingTool(createForagingItem(tool), [], { entity: e });
  console.log(tool, JSON.stringify(d), r?.text, e.items.length, JSON.stringify(heard));
}
