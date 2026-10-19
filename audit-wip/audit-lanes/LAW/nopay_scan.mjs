// Q3: an outcome that pays gear (standard/lesser/greater/double) on a quest whose script can never make it paid or a
// success (no GivePc, TrainPc, `ql paid`) - qlLayer.js ending offers gear only `quest.ql.paid || quest.questSuccess`, so
// the sheet's pay is never paid, while the window shows the tier's piece as what finishing it pays.
const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';
const { SHEET_FAMILIES } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { packMachine, parsedQuest } = await import(`${SNAP}/test/qlSources.mjs`);
const { payProfileOf } = await import(`${SNAP}/src/systems/questlines/qlRewards.js`);
const m = packMachine();
for (const fam of SHEET_FAMILIES) for (const s of fam.sheets) {
  const q = parsedQuest(s.quest, m).quest;
  const payers = [];
  for (const t of q.tasks.values()) for (const a of t.actions) {
    if (a.typeName === 'GivePc' && !(q.resources.get(a.itemSymbol?.name)?.itemName === 'letter' && !a.isNothing)) payers.push(`${t.symbol.name}:give pc`);
    if (a.typeName === 'TrainPc') payers.push(`${t.symbol.name}:train pc`);
    if (a.typeName === 'QlPaid') payers.push(`${t.symbol.name}:ql paid`);
  }
  const gearOuts = (s.outcomes ?? []).filter((o) => !o.failure && payProfileOf(o).gear);
  if (!payers.length && gearOuts.length) console.log(`${s.quest} [${fam.family}]: nothing in the script pays, yet ${gearOuts.map((o) => `${o.id} (${o.pay})`).join(', ')}`);
}
