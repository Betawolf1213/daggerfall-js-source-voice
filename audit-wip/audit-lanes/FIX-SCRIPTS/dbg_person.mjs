import { makeBridge } from './harness.mjs';
const h = makeBridge({ level: 30, online: true });
for (const name of ['QLIP01', 'QLIW01', 'QLBD01']) {
  const q = h.bridge.machine.startQuestByName(name);
  for (const r of q.resources.values()) if (r.isPerson) console.log(name, r.symbol.name, JSON.stringify({ displayName: r.displayName, name: r.name, nameMacro: r.expandMacro?.(1) }));
}
