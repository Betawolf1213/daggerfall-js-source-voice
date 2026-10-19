// For each sheet that needs a success fallback: its success-setting tasks, and which a single-task row names
import { SHEET_FAMILIES } from '/home/user/daggerfall-js-source/src/systems/questlines/qlSheets.js';
import { canSucceedUnnamed, successFallback } from '/home/user/daggerfall-js-source/tools/qlSheetLaw.mjs';
import { packMachine, parsedQuest } from '/home/user/daggerfall-js-source/test/qlSources.mjs';
console.warn = () => {};
const m = packMachine();
for (const fam of SHEET_FAMILIES) for (const s of fam.sheets) {
  const p = parsedQuest(s.quest, m); if (!p) continue;
  if (successFallback(s) || !canSucceedUnnamed(s, p.quest, p.lines)) continue;
  const setters = [...p.quest.tasks.values()].filter((t) => t.actions.some((a) => (a.typeName === 'GivePc' && (a.isNothing || (!a.textId && !a.silently))) || a.typeName === 'QlPaid' || a.typeName === 'TrainPc'));
  const rows = new Map((s.outcomes ?? []).filter((o) => !o.failure && o.on.task).map((o) => [o.on.task.replace(/^_|_$/g, ''), o.id]));
  console.log(`${s.quest}: ${setters.map((t) => `${t.symbol.name}${rows.has(t.symbol.name) ? `=${rows.get(t.symbol.name)}` : ''}`).join(' ')}`);
}
