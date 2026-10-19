const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { QL_PATCHES, QL_PATCH_FAMILIES } = await import(`${SNAP}/src/systems/questlines/qlPatches.js`);
const { SHEETS } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const D = ['M0B21Y19', 'B0B50Y11', 'K0C01Y10', 'R0C11Y16', 'A0C01Y03', 'A0C01Y06', 'A0C01Y13', 'A0C41Y18', 'C0B00Y02', 'Q0C4XY04', 'P0B01L02'];
const rows = [];
for (const [name, list] of QL_PATCHES) {
  const all = list.map((p) => p.new).join('\n');
  const kit = /_qlkeep_/.test(all) && /_qlask_/.test(all) && /_qlaltpath_/.test(all);
  rows.push({ name, n: list.length, kit, d: D.includes(name), ask: /\bask \d+ choices/.test(all), qlpaid: /ql paid/.test(all), family: SHEETS.get(name)?.family });
}
for (const r of rows) console.log(r.name.padEnd(9), r.family?.padEnd(16), 'patches', r.n, 'kit', r.kit, 'D', r.d, 'ask', r.ask, 'qlpaid', r.qlpaid);
console.log('kit (C or D shape):', rows.filter((r) => r.kit).length, 'D listed:', rows.filter((r) => r.d).length, 'kit not D:', rows.filter((r) => r.kit && !r.d).length, 'not kit:', rows.filter((r) => !r.kit).map((r) => r.name).join(' '));
console.log('D listed but not patched:', D.filter((d) => !QL_PATCHES.has(d)).join(' ') || 'none');
for (const f of QL_PATCH_FAMILIES) console.log(f.family, Object.keys(f.patches).length, Object.keys(f).join(','));
