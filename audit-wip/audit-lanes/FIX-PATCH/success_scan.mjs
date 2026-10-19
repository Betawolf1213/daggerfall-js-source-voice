// FIX-PATCH LAW-1: every sheet - can its script succeed, has it a `done`, and which non-failure outcomes are plain
// (no choice, no ask/prompt task, no betrayal)?
import { SHEET_FAMILIES } from '/home/user/daggerfall-js-source/src/systems/questlines/qlSheets.js';
import { packMachine, parsedQuest } from '/home/user/daggerfall-js-source/test/qlSources.mjs';
import { symName } from '/home/user/daggerfall-js-source/src/systems/questlines/qlLaw.js';
console.warn = () => {};
const m = packMachine();
const symsOf = (b, neg = false, out = []) => {
  if (!b || typeof b !== 'object') return out;
  for (const [k, v] of Object.entries(b)) {
    if (k === 'all' || k === 'any') v.forEach((x) => symsOf(x, neg, out));
    else if (k === 'not') symsOf(v, !neg, out);
    else if (k === 'choice') out.push({ kind: 'choice', neg });
    else if (k === 'task') out.push({ kind: 'task', name: symName(v), neg });
  }
  return out;
};
let n = 0;
for (const fam of SHEET_FAMILIES) for (const s of fam.sheets) {
  const q = parsedQuest(s.quest, m)?.quest;
  if (!q) continue;
  const chosen = new Set();
  let canSucceed = false;
  for (const t of q.tasks.values()) for (const a of t.actions) {
    if (a.typeName === 'QlAsk') a.choiceTasks.forEach((x) => chosen.add(x.name));
    if (a.typeName === 'Prompt') { chosen.add(a.yesTaskSymbol?.name); chosen.add(a.noTaskSymbol?.name); }
    if (a.typeName === 'PromptMulti') [a.opt1TaskSymbol, a.opt2TaskSymbol, a.opt3TaskSymbol, a.opt4TaskSymbol].forEach((x) => x && chosen.add(x.name));
    if ((a.typeName === 'GivePc' && (a.isNothing || (!a.textId && !a.silently))) || a.typeName === 'TrainPc' || a.typeName === 'QlPaid') canSucceed = true;
  }
  const hasDone = (s.outcomes ?? []).some((o) => o.id === 'done');
  if (hasDone && !s.success) continue;
  const rows = (s.outcomes ?? []).filter((o) => !o.failure).map((o) => {
    const syms = symsOf(o.on).filter((x) => !x.neg);
    const choice = syms.some((x) => x.kind === 'choice' || (x.kind === 'task' && chosen.has(x.name)));
    return `${o.id}:${o.pay}${choice ? '/CHOICE' : ''}${o.pay === 'betrayal' ? '/BETRAY' : ''} ${JSON.stringify(o.on)}`;
  });
  n++;
  console.log(`${s.quest} [${fam.family}] canSucceed=${canSucceed}\n   ${rows.join('\n   ')}`);
}
console.log(n, 'sheets without done');
