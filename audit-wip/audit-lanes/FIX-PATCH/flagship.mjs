import { SHEETS } from '/home/user/daggerfall-js-source/src/systems/questlines/qlSheets.js';
import { flagshipProblem, branchOutcomes, outcomeEffect } from '/home/user/daggerfall-js-source/tools/qlSheetLaw.mjs';
import { flagshipOf } from '/home/user/daggerfall-js-source/tools/qlCheck.mjs';
import { QL_FAMILY_NAMES } from '/home/user/daggerfall-js-source/src/systems/questlines/qlFamilies.js';
import { packMachine, parsedQuest } from '/home/user/daggerfall-js-source/test/qlSources.mjs';
console.warn = () => {};
const m = packMachine();
const set = new Set(QL_FAMILY_NAMES.flatMap((f) => [...flagshipOf(f)]));
const verbose = process.argv[2];
for (const name of [...set].sort()) {
  const s = SHEETS.get(name); const p = parsedQuest(name, m);
  const prob = flagshipProblem(s, p.quest, p.lines);
  if (prob) console.log(`BAD ${name}: ${prob}`);
  if (verbose && (verbose === 'all' || verbose === name)) for (const r of branchOutcomes(s, p.quest, p.lines)) console.log(`   ${r.branch}/${r.choice} -> ${r.outcome?.id} ${r.outcome ? outcomeEffect(r.outcome, p.quest) : ''}`);
}
console.log(set.size, 'flagship');
