// REWARD: factionIdOf reads Quests-Factions' p2 first ("p2, else p3") - but p2 >= 0 is an OCCUPATION code (Chemist 0 ..
// Questor 21), not a faction id. A sheet naming an occupation row moves a Daedra Prince's standing; a misspelt name moves
// nothing, silently (standingMovesOf filters it out) - and the sheet law (tools/qlSheetLaw.mjs) checks neither.
import { SNAP } from './_env.mjs';
const { factionIdOf, standingMovesOf } = await import(`${SNAP}/src/systems/questlines/qlRewards.js`);
const { factionsTable } = await import(`${SNAP}/src/systems/quest/tables.js`);
const { sheetProblems } = await import(`${SNAP}/tools/qlSheetLaw.mjs`);
const t = factionsTable();
import { readFileSync } from 'node:fs';
const rows = readFileSync(`${SNAP}/vendor/dfu-quests/Tables/Quests-Factions.txt`, 'utf8').split(/\r?\n/).map((l) => l.split(',').map((x) => x.trim())).filter((r) => r.length === 4 && r[2] === '-1');
const nameOf = (id) => rows.find((r) => r[3] === String(id))?.[0] ?? '?';   // the individual faction (p2 -1) of that id
for (const n of ['Noble', 'Smith', 'Group_1', 'Questor', 'The_Mage_Guild']) console.log(`factionIdOf("${n}") = ${factionIdOf(n)}${factionIdOf(n) != null ? ` - which is ${nameOf(factionIdOf(n))}` : ''}`);
const sheet = { quest: 'M0B00Y06', objectives: [{ id: 'a', text: 'x', done: { started: true } }], outcomes: [{ id: 'done', text: 'x', on: { started: true }, pay: 'standard', standing: { Noble: 5, The_Mage_Guild: 5 } }] };
console.log('the sheet law on {Noble: 5, The_Mage_Guild: 5}:', sheetProblems(sheet));
console.log('what the outcome moves:', JSON.stringify(standingMovesOf(sheet.outcomes[0])));
