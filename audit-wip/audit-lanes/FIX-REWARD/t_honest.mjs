const { honestItems, honestItemsSkipped } = await import('/home/user/daggerfall-js-source/test/honestItems.mjs');
const { itemFindings } = await import('/home/user/daggerfall-js-source/src/systems/item/itemLaw.js');
const t0 = Date.now();
const sweep = honestItems({ seeds: 4 });
const srcs = new Set(sweep.map((x) => x.source));
const mine = sweep.filter((x) => x.source.startsWith('qlRewards'));
console.log('sources', srcs.size, 'ql items', mine.length, 'named', mine.filter((x) => x.item.qlNamed).length, 'findings', mine.filter((x) => itemFindings(x.item).length).length, 'skipped', JSON.stringify(honestItemsSkipped), (Date.now() - t0) + 'ms');
