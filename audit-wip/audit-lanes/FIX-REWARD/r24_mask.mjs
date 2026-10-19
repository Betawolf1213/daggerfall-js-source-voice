import { SNAP } from './_env.mjs';
const { maskText } = await import(`${SNAP}/src/net/nameFilter.js`);
const { SHEET_FAMILIES } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
for (const fam of SHEET_FAMILIES) for (const s of fam.sheets) for (const o of s.outcomes ?? []) if (o.named && maskText(o.named.name) !== o.named.name) console.log('STARRED:', o.named.name, '->', maskText(o.named.name));
console.log('done');
