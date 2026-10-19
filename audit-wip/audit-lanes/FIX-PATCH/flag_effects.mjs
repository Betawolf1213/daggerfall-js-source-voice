import { SHEETS } from '/home/user/daggerfall-js-source/src/systems/questlines/qlSheets.js';
import { branchOutcomes, outcomeEffect } from '/home/user/daggerfall-js-source/tools/qlSheetLaw.mjs';
import { flagshipOf } from '/home/user/daggerfall-js-source/tools/qlCheck.mjs';
import { QL_FAMILY_NAMES } from '/home/user/daggerfall-js-source/src/systems/questlines/qlFamilies.js';
import { packMachine, parsedQuest } from '/home/user/daggerfall-js-source/test/qlSources.mjs';
console.warn = () => {};
const m = packMachine();
const set = new Set(QL_FAMILY_NAMES.flatMap((f) => [...flagshipOf(f)]));
console.log(set.size);
for (const name of [...set].sort()) {
  const s = SHEETS.get(name); const q = parsedQuest(name, m).quest;
  const bo = branchOutcomes(s);
  const byBranch = {};
  for (const x of bo) (byBranch[x.branch] ??= []).push(`${x.choice}->${x.outcome?.id ?? '-'}${x.outcome ? ' ' + outcomeEffect(x.outcome, q) : ''}`);
  const ok = Object.values(byBranch).some((l) => new Set(l.filter((y) => !/->-$/.test(y)).map((y) => y.split(' ').slice(1).join(' '))).size >= 2);
  console.log(`${ok ? 'ok ' : 'BAD'} ${name}: ${Object.entries(byBranch).map(([b, l]) => `${b}[${l.join(' ; ')}]`).join(' ')}`);
}
