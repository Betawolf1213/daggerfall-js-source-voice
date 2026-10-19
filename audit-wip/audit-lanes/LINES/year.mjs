// The online world's year on given dates (net/wire.js sharedClassicMinutes -> gameDate.js).
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { sharedClassicMinutes } = await import(SNAP + '/src/net/wire.js');
const { dateFromClassicMinutes } = await import(SNAP + '/src/systems/gameDate.js');
for (const d of ['2026-09-14', '2026-10-19', '2026-12-01', '2027-03-01', '2027-06-01', '2027-10-19', '2028-06-01']) {
  const dt = dateFromClassicMinutes(sharedClassicMinutes(Date.parse(d + 'T00:00:00Z')));
  console.log(d, '-> 3E', dt.year, 'month', dt.month + 1);
}
