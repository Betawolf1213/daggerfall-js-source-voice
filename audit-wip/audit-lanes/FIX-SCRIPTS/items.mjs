// The quest items the scripts hand over, as the pack names them.
import { makeBridge } from './harness.mjs';
const SNAP = '/home/user/daggerfall-js-source';
const { itemLongName } = await import(SNAP + '/src/systems/item/itemNames.js').catch(() => ({}));
const h = makeBridge({ level: 30, online: true });
for (const [name, syms] of [['QLBD02', ['ritebook', 'letter']], ['QLCH02', ['weirkey']], ['QLIR01', ['load']], ['QLIT01', ['card']], ['QLIA01', ['sheet']]]) {
  const q = h.bridge.machine.startQuestByName(name);
  for (const s of syms) {
    const it = q.getItem({ name: s })?.daggerfallUnityItem;
    console.log(name, s, '->', JSON.stringify({ shortName: it?.shortName, name: it?.name, group: it?.itemGroup, index: it?.groupIndex, tpl: it?.templateIndex, weight: it?.weightInKg }));
  }
}
