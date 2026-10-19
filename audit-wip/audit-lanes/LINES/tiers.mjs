// Each step's sheet tier against its line's tier, and each script's gold range against the brief's band for that tier
// (tier 1 ~100-200, 2 ~200-400, 3 ~300-600, 4 ~500-900).
import { readFileSync } from 'node:fs';
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { QL_LINES } = await import(SNAP + '/src/systems/questlines/qlLines.js');
const { sheetFor } = await import(SNAP + '/src/systems/questlines/qlSheets.js');
const BAND = { 1: [100, 200], 2: [200, 400], 3: [300, 600], 4: [500, 900] };
for (const l of QL_LINES) for (const s of l.steps) {
  const sh = sheetFor(s.quest);
  const text = readFileSync(`${SNAP}/src/systems/questlines/quests/${s.quest}.txt`, 'utf8');
  const g = /Item _gold_ gold range (\d+) to (\d+)/.exec(text);
  const band = BAND[l.tier];
  const flag = [];
  if (sh.tier !== l.tier) flag.push(`sheet tier ${sh.tier} != line tier ${l.tier}`);
  if (!g) flag.push('no gold range');
  else if (+g[1] !== band[0] || +g[2] !== band[1]) flag.push(`gold ${g[1]}-${g[2]} vs band ${band.join('-')}`);
  if (flag.length) console.log(l.id, s.quest, flag.join('; '));
}
console.log('done');
