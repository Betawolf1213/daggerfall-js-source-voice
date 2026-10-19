const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { QL_LINES } = await import(`${SNAP}/src/systems/questlines/qlLines.js`);
const { sheetFor } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { QL_SERVICE_LINES } = await import(`${SNAP}/src/net/questlineClaims.js`);
for (const l of QL_LINES) {
  const tiers = l.steps.map((s) => sheetFor(s.quest)?.tier);
  const mism = tiers.some((t) => t !== l.tier);
  console.log(l.id.padEnd(16), 'line tier', l.tier, 'sheet tiers', tiers.join(','), mism ? '<<< differs' : '', 'opens', JSON.stringify(l.opens), 'svc', !!QL_SERVICE_LINES[l.id]);
}
