// Q2: every binding kind against REAL machine objects - M0B11Y18 parsed and started on the real bridge (its tasks, its
// Item, Clock, Foe resources, its journal), driven through the machine's own doors.
const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';
const { readFileSync } = await import('node:fs');
const { join } = await import('node:path');
const { createQuestBridge } = await import(`${SNAP}/src/scenes/quest/questBridge.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { questSource, loadTables } = await import(`${SNAP}/test/qlSources.mjs`);
const { holds, isEnding } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
loadTables(); setPref('questlines', true);
const VENDOR = join(SNAP, 'vendor', 'dfu-quests');
const warn = console.warn; console.warn = () => {};
let now = 100000;
const carried = new Set();
const b = createQuestBridge({
  data: { readListTable: (n) => { try { return readFileSync(join(VENDOR, 'Tables', `QuestList-${n}.txt`), 'utf8'); } catch { return null; } }, getQuestSourceLines: (n) => questSource(n, true) },
  classicSeconds: () => now, nowSeconds: () => now, worldSeconds: () => now, playerEntity: { name: 'P', level: 8, skills: new Array(35).fill(30), career: {} }, carriesQuestItem: (r) => carried.has(r),
});
const q = b.machine.startQuestByName('M0B11Y18', 0);
for (const t of q.tasks.values()) for (const a of t.actions) if (!a.isTriggerCondition) { const up = a.update.bind(a); a.update = (c) => { try { up(c); } catch { a.setComplete(); } }; }
const probe = { carries: (r) => carried.has(r) };
const out = [];
const check = (what, b, want) => { const got = holds(q, b, probe); out.push(`${got === want ? 'ok ' : 'BAD'} ${what}: ${JSON.stringify(b)} -> ${got}`); };
b.machine.tick();
check('started', { started: true }, true);
check('ended (running)', { ended: true }, false);
check('success (running)', { success: true }, false);
check('step 0 (startup logs 1020 step 0)', { step: 0 }, true);
check('step 1 (not yet)', { step: 1 }, false);
check('task, unset', { task: '_S.06_' }, false);
q.getTask({ name: 'S.06' }).start();
check('task, set by start', { task: '_S.06_' }, true);
check('task, inner name', { task: 'S.06' }, true);
const amulet = q.resources.get('amulet');
check('item, not carried', { item: '_amulet_' }, false);
carried.add(amulet);
check('item, carried', { item: '_amulet_' }, true);
check('item names a clock', { item: '_S.35_' }, false);
const clk = q.resources.get('S.35');
check('clock, not started', { clock: '_S.35_' }, false);
clk.startTimer();
check('clock, started', { clock: '_S.35_' }, true);
check('clockDone, running', { clockDone: '_S.35_' }, false);
for (let i = 0; i < 400 && !clk.clockFinished; i++) { now += 60; b.machine.tick(); }
check('clock, run out', { clock: '_S.35_' }, false);
check('clockDone, run out', { clockDone: '_S.35_' }, true);
const archers = q.resources.get('F.00');
out.push(`    (Foe _F.00_ is 3 Archer: spawnCount ${archers.spawnCount})`);
archers.killCount = 2;
check('foeDead, 2 of 3', { foeDead: '_F.00_' }, false);
archers.killCount = 3;
check('foeDead, 3 of 3', { foeDead: '_F.00_' }, true);
b.machine.globalVars.set(30, true);
check('global 30 set', { global: 30 }, true);
check('global 31 unset', { global: 31 }, false);
b.questlines.act('fish-caught', 2);
check('act 2 of 2', { act: 'fish-caught', n: 2 }, true);
check('act 2 of 3', { act: 'fish-caught', n: 3 }, false);
q.ql.choices.letter = 'queen';
check('choice taken', { choice: { branch: 'letter', is: 'queen' } }, true);
check('choice not taken', { choice: { branch: 'letter', is: 'traitor' } }, false);
check('all', { all: [{ task: '_S.06_' }, { item: '_amulet_' }] }, true);
check('any', { any: [{ task: '_S.07_' }, { item: '_amulet_' }] }, true);
check('not', { not: { task: '_S.07_' } }, true);
check('empty all', { all: [] }, false);
check('empty any', { any: [] }, false);
check('unknown kind', { taks: '_S.06_' }, false);
q.endQuest();
check('ended (end quest ran, grace)', { ended: true }, true);
out.push(`    (isEnding ${isEnding(q)}, ticksToEnd ${q.ticksToEnd}, questComplete ${q.questComplete})`);
console.warn = warn;
console.log(out.join('\n'));
