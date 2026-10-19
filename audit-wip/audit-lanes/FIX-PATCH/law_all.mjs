import { SHEET_FAMILIES } from '/home/user/daggerfall-js-source/src/systems/questlines/qlSheets.js';
import { sheetProblems } from '/home/user/daggerfall-js-source/tools/qlSheetLaw.mjs';
import { packMachine, parsedQuest } from '/home/user/daggerfall-js-source/test/qlSources.mjs';
console.warn = () => {};
const m = packMachine();
let n = 0;
for (const fam of SHEET_FAMILIES) for (const s of fam.sheets) {
  const parsed = parsedQuest(s.quest, m);
  for (const p of sheetProblems(s, parsed ?? {})) { n++; console.log(`[${fam.family}] ${p}`); }
}
console.log(n, 'problems');
