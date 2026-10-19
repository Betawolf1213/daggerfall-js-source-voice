// _BRISIEN, the game's first quest: its sheet's `met` outcome pays `standard` (gear), and the window draws the reward
// line under it the whole way (qlJournal.js qlObjectivesBlock: `!ended && ql.tier` -> rewardWords). But the script has no
// GivePc/TrainPc/`ql paid` and DFU never makes it a success, so qlLayer.js ending's gate (`quest.ql.paid ||
// quest.questSuccess`) offers nothing. The same for 15 more main-quest sheets, and 24 sheets whose every ending pays no
// gear (`own`/`none`/`betrayal`) show the line too.
const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';
const { readFileSync } = await import('node:fs');
const { join } = await import('node:path');
const { createQuestBridge } = await import(`${SNAP}/src/scenes/quest/questBridge.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { questSource, loadTables } = await import(`${SNAP}/test/qlSources.mjs`);
const { rewardWords } = await import(`${SNAP}/src/ui/questlines/qlJournal.js`);
loadTables(); setPref('questlines', true);
const VENDOR = join(SNAP, 'vendor', 'dfu-quests');
const warn = console.warn; console.warn = () => {};
let now = Number(process.env.START ?? 1000), at = null;
const offers = [];
const b = createQuestBridge({
  data: { readListTable: (n) => { try { return readFileSync(join(VENDOR, 'Tables', `QuestList-${n}.txt`), 'utf8'); } catch { return null; } }, getQuestSourceLines: (n) => questSource(n, true) },
  classicSeconds: () => now, nowSeconds: () => now, worldSeconds: () => now, playerEntity: { name: 'P', level: 1, skills: new Array(35).fill(30), career: {} },
  isPlayerInTown: () => !!process.env.IN_TOWN, skySeconds: () => now, carriesQuestItem: () => false, onQuestlineOffer: (o) => offers.push(o),
});
const q = b.machine.startQuestByName('_BRISIEN', 0);
for (const t of q.tasks.values()) for (const a of t.actions) if (!a.isTriggerCondition) { const up = a.update.bind(a); a.update = (c) => { try { up(c); } catch { a.setComplete(); } }; }
for (const r of q.resources.values()) if (r.isPlace) r.isPlayerHere = () => at === r.symbol.name;
const tick = (n = 1) => { for (let i = 0; i < n; i++) { now += Number(process.env.STEP ?? 3600); b.machine.tick(); b.questlines.look(); } };
at = 'PiratesHold'; tick(2); at = null; tick(2);                  // out of the cave
const inv = q.resources.get('invitepc'); inv.remainingTimeInSeconds = 0; tick(2);   // her letter comes
const row = b.questlines.rowOf(q);
console.log(`while running: tier ${row.tier}, outcome ${row.outcome}, the window draws: "${rewardWords(row.tier)}"`);
const click = q.getTask({ name: 'meetladyb' }).actions.find((a) => a.typeName === 'ClickedNpc'); click.checkTrigger = () => true;
tick(2); click.checkTrigger = () => false;
const one = q.resources.get('oneday'); one.remainingTimeInSeconds = 0; tick(4);
console.warn = warn;
console.log(`ended: complete ${q.questComplete}, DFU success ${q.questSuccess}, paid ${q.ql.paid}, outcome ${q.ql.outcome} (pay standard) - gear offers made: ${offers.length}`);
