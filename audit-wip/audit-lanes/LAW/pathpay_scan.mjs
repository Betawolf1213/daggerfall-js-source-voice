// A gear-paying outcome (standard/lesser/greater/double) bound to a task that ENDS the quest with no GivePc/`ql paid`/
// TrainPc of its own (its money, if any, by `get item`): on that path DFU never calls the quest paid or a success, so
// qlLayer.js ending's gate refuses the gear the outcome names (and the window promised).
const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';
const { SHEET_FAMILIES } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { packMachine, parsedQuest } = await import(`${SNAP}/test/qlSources.mjs`);
const { symName } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
const { payProfileOf } = await import(`${SNAP}/src/systems/questlines/qlRewards.js`);
const m = packMachine();
const PAYS = new Set(['GivePc', 'QlPaid', 'TrainPc']);
for (const fam of SHEET_FAMILIES) for (const s of fam.sheets) {
  const q = parsedQuest(s.quest, m).quest;
  const anyPayer = [...q.tasks.values()].some((t) => t.actions.some((a) => PAYS.has(a.typeName) && !(a.typeName === 'GivePc' && !a.isNothing && q.resources.get(a.itemSymbol?.name)?.itemName === 'letter')));
  if (!anyPayer) continue;   // the whole-quest case is brisien_gear.mjs's
  for (const o of s.outcomes ?? []) {
    if (o.failure || !payProfileOf(o).gear || !o.on.task) continue;
    const t = q.tasks.get(symName(o.on.task));
    if (!t) continue;
    const ends = t.actions.some((a) => a.typeName === 'EndQuest');
    const pays = t.actions.some((a) => PAYS.has(a.typeName));
    const getsGold = t.actions.filter((a) => a.typeName === 'GetItem').map((a) => a.itemSymbol?.name ?? a.targetItem?.name ?? '?');
    if (ends && !pays) console.log(`${s.quest} [${fam.family}] ${o.id} (${o.pay}) on _${t.symbol.name}_: ends the quest without paying${getsGold.length ? ` (get item ${getsGold.join(', ')})` : ''}`);
  }
}
