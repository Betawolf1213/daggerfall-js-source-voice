// ACTS lane check 6 (Q3, no defect expected): how `ql act` counts through the REAL bridge and machine - from the quest's
// first tick (before any objective opens), two quests waiting on one kind both hear one act, a save/load keeps the count
// and its start, a switch flipped off after the start changes nothing (the stamp is for life), a shelved quest hears none.
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
import { readFileSync, readdirSync } from 'node:fs';
const { loadQuestTables } = await import(`${SNAP}/src/systems/quest/tables.js`);
const { createQuestBridge } = await import(`${SNAP}/src/scenes/quest/questBridge.js`);
const { noteAct } = await import(`${SNAP}/src/systems/questlines/qlActs.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const VENDOR = `${SNAP}/vendor/dfu-quests/Tables`;
const src = {}; for (const f of readdirSync(VENDOR)) if (f.endsWith('.txt')) src[f.replace('.txt', '')] = readFileSync(`${VENDOR}/${f}`, 'utf8').replace(/^﻿/, '');
loadQuestTables(src);
const quest = (name) => [`Quest: ${name}`, 'DisplayName: Probe', 'QRC:', '', 'QuestLogEntry:  [1010]', 'x', '', 'QBN:', '', '_gate_ task:', '\twhen _never_', '', 'variable _never_', '', '_fish_ task:', '\tql act fish-caught 2', ''];
setPref('questlines', true);
const data = { readListTable: () => null, getQuestSourceLines: (n) => (n === '__QLA' || n === '__QLB' ? quest(n) : null) };
const bridge = createQuestBridge({ data, classicSeconds: () => 0, showChoice: () => {} });
const A = bridge.machine.startQuestByName('__QLA');
const B = bridge.machine.startQuestByName('__QLB');
bridge.tick(1);
const fired = (q) => q.getTask({ name: 'fish' }).getTriggerValue();
console.log('heard by', noteAct('fish-caught'), 'quests; after one fish: A', fired(A), 'B', fired(B));
setPref('questlines', false);   // the switch flipped after the start
const save = bridge.machine.getSaveData();
const bridge2 = createQuestBridge({ data, classicSeconds: () => 0, showChoice: () => {} });   // a reload (the sink is the new bridge's)
bridge2.machine.restoreSaveData(save);
const [A2, B2] = [...bridge2.machine.quests.values()];
B2.shelvedAt = 1;
console.log('after a load, switch off, B shelved: heard by', noteAct('fish-caught'), 'quest(s)');
bridge2.tick(1);
console.log('second fish: A', fired(A2), '(acts', JSON.stringify(A2.ql.acts), ') B', fired(B2), '(acts', JSON.stringify(B2.ql.acts), ')');
