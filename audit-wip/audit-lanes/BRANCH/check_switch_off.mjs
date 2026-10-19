// BRANCH Q5: with the switch off no patch applies and DFU's script is read whole - every patched quest, mechanically:
// the read is the base text line for line (the very array, for the browser's loader), the started quest carries no
// `_ql..._` task, no message from 1900, no QL action, and its stamp is null.
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { QL_PATCHES, questlineLines } = await import(`${SNAP}/src/systems/questlines/qlPatches.js`);
const { baseText } = await import(`${SNAP}/test/qlSources.mjs`);
const { makeBridge } = await import('./harness.mjs');
console.warn = () => {};
let bad = 0, n = 0;
for (const name of QL_PATCHES.keys()) {
  n++;
  const base = baseText(name).split(/\r?\n/);
  const same = questlineLines(name, base, false) === base;           // the very array: nothing copied, nothing changed
  const { bridge } = makeBridge({ on: false });
  const q = bridge.machine.startQuestByName(name, 0);
  const qlTasks = q ? [...q.tasks.keys()].filter((k) => /^ql/.test(k)) : ['(did not start)'];
  const qlMsgs = q ? [...q.messages.keys()].filter((id) => id >= 1900 && id <= 1999) : [];   // the questlines' range (A0C01Y13 numbers its OWN 2000, 2001, 2005)
  const qlActs = q ? [...q.tasks.values()].flatMap((t) => t.actions).filter((a) => /^Ql/.test(a.typeName)).map((a) => a.typeName) : [];
  const ok = same && q && q.ql === null && !qlTasks.length && !qlMsgs.length && !qlActs.length;
  if (!ok) { bad++; console.log('NOT CLEAN', name, { same, ql: q?.ql, qlTasks, qlMsgs, qlActs }); }
  // and on: the branch is there
  const on = makeBridge({ on: true }).bridge.machine.startQuestByName(name, 0);
  const onTasks = on ? [...on.tasks.keys()].filter((k) => /^ql/.test(k)).length : -1;
  if (!(on?.ql?.stamp === 1)) console.log('ON NOT STAMPED', name);
  if (!onTasks && !['B0B71Y03', 'K0C01Y00'].includes(name)) console.log('ON HAS NO ql TASK', name);
}
console.log(`switch off: ${n - bad}/${n} patched quests read and started as DFU's script whole`);
