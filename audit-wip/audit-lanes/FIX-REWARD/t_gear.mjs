import { makeBridge } from './_bridge.mjs';
const { SHEETS } = await import('/home/user/daggerfall-js-source/src/systems/questlines/qlSheets.js');
const { bridge } = makeBridge({ level: 10 });
const out = { true: [], false: [], fail: [] };
const warn = console.warn; console.warn = () => {};
for (const name of SHEETS.keys()) {
  let q = null;
  try { q = bridge.machine.startQuestByName(name, 0); } catch { out.fail.push(name); continue; }
  if (!q) { out.fail.push(name); continue; }
  const row = bridge.questlines.rowOf(q);
  out[String(!!row?.gear)].push(name);
}
console.warn = warn;
console.log('gear false:', out.false.length, out.false.join(' '));
console.log('gear true:', out.true.length);
console.log('could not start:', out.fail.length, out.fail.join(' '));
