// Q1/pay: quests with more than one GivePc (or ql paid) - the layer scales gold only at the FIRST (qlLayer.js reward:
// `!quest.ql.paid`), and a non-letter item handed with `give pc` marks the quest paid.
const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';   // = git archive of the snapshot's HEAD (fe033c256): other lanes' probe mutants edit the shared worktree
const { SHEET_FAMILIES } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { questSource, packMachine, parsedQuest } = await import(`${SNAP}/test/qlSources.mjs`);
const m = packMachine();
for (const fam of SHEET_FAMILIES) for (const s of fam.sheets) {
  const p = parsedQuest(s.quest, m);
  const gives = [];
  for (const t of p.quest.tasks.values()) for (const a of t.actions) {
    if (a.typeName === 'GivePc') {
      const r = a.isNothing ? null : p.quest.resources.get(a.itemSymbol?.name);
      gives.push(`${t.symbol.name}:${a.isNothing ? 'nothing' : `${a.itemSymbol?.name}${r?.isGold ? '(gold)' : r?.itemName === 'letter' ? '(letter)' : `(${r?.itemName || 'item'})`}${a.textId ? ' notify' : a.silently ? ' silently' : ''}`}`);
    }
    if (a.typeName === 'QlPaid') gives.push(`${t.symbol.name}:ql paid`);
  }
  const pays = new Set((s.outcomes ?? []).filter((o) => !o.failure).map((o) => o.pay));
  const nonLetter = gives.filter((g) => !/\(letter\)/.test(g));
  if (nonLetter.length > 1) console.log(`${s.quest} [${[...pays]}]: ${gives.join(', ')}`);
}
