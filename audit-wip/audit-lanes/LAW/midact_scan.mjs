// Non-failure outcomes bound to a task that neither pays (GivePc/`ql paid`) nor ends the quest, on a quest that ALSO has
// a timer that ends it: a timeout after that task settles the outcome as a success while DFU files a failure.
const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';
const { SHEET_FAMILIES } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { packMachine, parsedQuest } = await import(`${SNAP}/test/qlSources.mjs`);
const { symName } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
const m = packMachine();
const out = [];
for (const fam of SHEET_FAMILIES) for (const s of fam.sheets) {
  const q = parsedQuest(s.quest, m).quest;
  const clockEnds = [...q.tasks.values()].some((t) => q.resources.get(t.symbol.name)?.isClock && t.actions.some((a) => a.typeName === 'EndQuest'));
  if (!clockEnds) continue;
  const paysOrEnds = (name, seen = new Set()) => {
    if (seen.has(name)) return false; seen.add(name);
    const t = q.tasks.get(name); if (!t) return false;
    if (t.actions.some((a) => ['GivePc', 'QlPaid', 'EndQuest', 'TrainPc'].includes(a.typeName))) return true;
    return false;
  };
  for (const o of s.outcomes ?? []) {
    if (o.failure || !o.on.task) continue;
    const n = symName(o.on.task);
    if (!paysOrEnds(n)) out.push(`${s.quest} ${o.id} (${o.pay}) on _${n}_`);
  }
}
console.log(out.length, 'outcomes'); console.log(out.join('\n'));
