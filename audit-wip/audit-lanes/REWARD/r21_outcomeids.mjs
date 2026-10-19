// REWARD: every `outcome _x_` a script (or a branch patch) says must name an outcome its sheet has - qlLayer.ending pays
// (standing, gear, named piece) only through outcomeOf, which finds the latched id in the sheet or answers null.
import { SNAP } from './_env.mjs';
const { questSource, loadTables } = await import(`${SNAP}/test/qlSources.mjs`);
const { SHEETS } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { symName } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
loadTables();
let n = 0; const bad = [];
for (const [name, sheet] of SHEETS) {
  const lines = questSource(name, true) ?? [];
  for (const l of lines) {
    const m = /^\s*outcome\s+(\S+)\s*$/.exec(l); if (!m) continue; n++;
    const id = symName(m[1]);
    if (!(sheet.outcomes ?? []).some((o) => o.id === id)) bad.push(`${name}: "outcome ${m[1]}" -> id "${id}", sheet has ${(sheet.outcomes ?? []).map((o) => o.id).join(',')}`);
  }
}
console.log('outcome lines:', n, ' naming no sheet outcome:', bad.length ? bad : 'none');
