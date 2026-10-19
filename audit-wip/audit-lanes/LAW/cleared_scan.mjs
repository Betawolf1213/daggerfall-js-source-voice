// Outcomes are read at the END (qlLaw.js observe settle), never latched before. An outcome bound to a task the script
// clears/unsets (or to a `when` task whose input the script clears) may no longer hold when `end quest` runs.
const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';
const { SHEET_FAMILIES } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { packMachine, parsedQuest } = await import(`${SNAP}/test/qlSources.mjs`);
const { symName, bindingSymbols } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
const m = packMachine();
for (const fam of SHEET_FAMILIES) for (const s of fam.sheets) {
  const q = parsedQuest(s.quest, m).quest;
  const cleared = new Map();   // task -> where
  for (const t of q.tasks.values()) for (const a of t.actions) {
    if (['ClearTask', 'UnsetTask', 'DropTask'].includes(a.typeName)) for (const sym of a.taskSymbols ?? []) cleared.set(sym.name, `${a.typeName} in _${t.symbol.name}_`);
    if (a.typeName === 'PcAt' && a.taskSymbol) cleared.set(a.taskSymbol.name, `pc at (cleared when away) in _${t.symbol.name}_`);
  }
  const whenInputs = (t) => { const w = q.tasks.get(t)?.actions.find((a) => a.typeName === 'WhenTask'); return w ? w.evaluations.filter((e) => e.op === 'when' || e.op === 'and').map((e) => symName(e.task)) : []; };
  for (const o of s.outcomes ?? []) {
    for (const sym of bindingSymbols(o.on)) {
      if (sym.kind !== 'task') continue;
      if (cleared.has(sym.name)) console.log(`${s.quest} ${o.id}${o.failure ? '!' : ''} (${o.pay}): _${sym.name}_ itself - ${cleared.get(sym.name)}`);
      else for (const i of whenInputs(sym.name)) if (cleared.has(i)) console.log(`${s.quest} ${o.id}${o.failure ? '!' : ''} (${o.pay}): _${sym.name}_ needs _${i}_ - ${cleared.get(i)}`);
    }
  }
}
