// Every outcome id a paid step's end claim can carry as `choice`, checked against the shared law's body test (qlClaimOf).
import { readFileSync } from 'node:fs';
import { QL_LINES } from '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit/src/systems/questlines/qlLines.js';
import { qlStepClaimed, qlClaimOf } from '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit/src/net/questlineClaims.js';
const sheets = JSON.parse(readFileSync('/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit/src/systems/questlines/sheets/questlines.json', 'utf8')).sheets;
for (const l of QL_LINES) l.steps.forEach((s, i) => {
  if (!qlStepClaimed(l.id, i)) return;
  const sh = sheets.find((x) => x.quest === s.quest);
  const ids = (sh?.outcomes ?? []).filter((o) => !o.failure).map((o) => o.id);
  for (const id of [...ids, null]) console.log(l.id, i, s.quest, JSON.stringify(id), qlClaimOf({ line: l.id, step: i, ...(id ? { choice: id } : {}) }) ? 'ok' : 'REFUSED ql-body');
});
