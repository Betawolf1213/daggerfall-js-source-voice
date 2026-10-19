// Shared setup: the snapshot's real quest tables loaded, as the tests load them.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
// The snapshot (ql-audit, fe033c256). QL_ROOT=clean reads this lane's byte-identical export of the snapshot's HEAD
// (`git -C ql-audit archive HEAD src vendor test tools package.json locales`) - other lanes edit the shared snapshot's
// files for their probe mutants while these run, and a repro must read the code as committed.
export const SNAP = process.env.QL_ROOT === 'clean' ? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/REWARD/clean' : '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
export const VENDOR = join(SNAP, 'vendor', 'dfu-quests');
export const read = (p) => readFileSync(p, 'utf8').replace(/^﻿/, '');
const { loadQuestTables } = await import(`${SNAP}/src/systems/quest/tables.js`);
const sources = {};
for (const f of readdirSync(join(VENDOR, 'Tables'))) if (f.endsWith('.txt')) sources[f.replace('.txt', '')] = read(join(VENDOR, 'Tables', f));
loadQuestTables(sources);
export const questFile = new Map(readdirSync(join(VENDOR, 'Quests')).map((f) => [f.replace(/\.txt$/i, '').toUpperCase(), join(VENDOR, 'Quests', f)]));
for (const f of readdirSync(join(SNAP, 'src/systems/questlines/quests'))) questFile.set(f.replace(/\.txt$/i, '').toUpperCase(), join(SNAP, 'src/systems/questlines/quests', f));
export const questLines = (name) => { const f = questFile.get(String(name).toUpperCase()); return f ? read(f).split(/\r?\n/) : null; };
