// Mechanical scan of every sheet's pay fields: failure outcomes that move standing/legal, pays and their counts,
// named pieces, outcomes that pay gear on a failure, and the catch-all rows.
import { SNAP } from './_env.mjs';
const { SHEET_FAMILIES } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { PAY_PROFILES } = await import(`${SNAP}/src/systems/questlines/qlRewards.js`);
const pays = {}; const failMoves = []; const namedRows = []; const failPays = [];
let sheets = 0, outcomes = 0;
for (const fam of SHEET_FAMILIES) for (const s of fam.sheets) {
  sheets++;
  for (const o of s.outcomes ?? []) {
    outcomes++;
    pays[o.pay] = (pays[o.pay] ?? 0) + 1;
    if (o.failure && (Object.values(o.standing ?? {}).some((v) => v < 0) || (o.legal ?? 0) < 0)) failMoves.push(`${s.quest}.${o.id} ${JSON.stringify(o.standing ?? {})} legal ${o.legal ?? 0}`);
    if (o.failure && PAY_PROFILES[o.pay]?.gear) failPays.push(`${s.quest}.${o.id} pay ${o.pay}`);
    if (o.named) namedRows.push(`${s.quest}.${o.id} ${o.pay} ${o.named.kind} "${o.named.name}"`);
  }
}
console.log({ sheets, outcomes, pays });
console.log('failure outcomes that COST standing/legal (QFAIL-FREE reads these):', failMoves.length, failMoves);
console.log('failure outcomes whose pay names gear:', failPays.length, failPays);
console.log('named:', namedRows.length); for (const r of namedRows) console.log('  ', r);
