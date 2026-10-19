// M0B00Y16 (a flagship, the record's own example: "pays by the outcome it ends on"): the merchant rescued, the giant
// dead, the questor clicked. The settled outcome is `rescued` (pay greater: gold x1.25) - but the gold was scaled at
// GivePc by `done` (standard x1), because `rescued` is bound to _S.17_ (`when _success_ and _escortComplete_`), a task
// that comes AFTER _success_ (the task that says `give pc _gold_`) in the script, so it is not yet set at GivePc's moment.
const SNAP = '/home/user/daggerfall-js-source';   // = git archive of the snapshot's HEAD (fe033c256): other lanes' probe mutants edit the shared worktree
const { readFileSync } = await import('node:fs');
const { join } = await import('node:path');
const { createQuestBridge } = await import(`${SNAP}/src/scenes/quest/questBridge.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { questSource, loadTables } = await import(`${SNAP}/test/qlSources.mjs`);
const { sheetFor } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { goldFactor } = await import(`${SNAP}/src/systems/questlines/qlRewards.js`);
loadTables(); setPref('questlines', true);
const VENDOR = join(SNAP, 'vendor', 'dfu-quests');
const warn = console.warn; console.warn = () => {};
let at = null, now = 1000;
const offers = [], added = [];
const b = createQuestBridge({
  data: { readListTable: (n) => { try { return readFileSync(join(VENDOR, 'Tables', `QuestList-${n}.txt`), 'utf8'); } catch { return null; } }, getQuestSourceLines: (n) => questSource(n, true) },
  classicSeconds: () => now, playerEntity: { name: 'P', level: 8, skills: new Array(35).fill(30), career: { weaponArmorShieldsBitfield: 0, forbiddenMaterialsFlags: 0 } },
  addGold: (n) => added.push(n), carriesQuestItem: () => false, showPrompt: (q, m, respond) => respond(true), onQuestlineOffer: (o) => offers.push(o),
});
const q = b.machine.startQuestByName('M0B00Y16', 0);
// the world's half, headless: actions that need a scene finish quietly; the player's place is `at`
for (const t of q.tasks.values()) for (const a of t.actions) if (!a.isTriggerCondition) { const up = a.update.bind(a); a.update = (c) => { try { up(c); } catch { a.setComplete(); } }; }
for (const r of q.resources.values()) if (r.isPlace) r.isPlayerHere = () => at === r.symbol.name;
const fire = (task, type) => { for (const a of q.getTask({ name: task }).actions) if (a.typeName === type) { const c = a.checkTrigger.bind(a); let once = true; a.checkTrigger = (x) => (once ? ((once = false), true) : c(x)); } };
const tick = (n = 1) => { for (let i = 0; i < n; i++) { now += 60; b.machine.tick(); b.questlines.look(); } };
// the merchant held by the giant (the draw's _victim_ arm)
q.getTask({ name: 'victim' }).start(); q.getTask({ name: 'S.09' }).clear?.();
tick(2);
fire('S.10', 'ClickedNpc'); tick(2);            // the merchant clicked: "help me out" - Yes
at = 'store'; tick(2); at = null;              // led to the store: _S.13_, _escortComplete_
fire('S.03', 'KilledFoe'); tick(2);             // the giant dead
const gold = q.getItem({ name: 'gold' }).daggerfallUnityItem;
const minted = gold.stackCount;
fire('clickqgiver', 'ClickedNpc'); tick(4);      // the questor: _success_ gives the gold, _S.17_, _S.18_ ends it
console.warn = warn;
const sheet = sheetFor('M0B00Y16');
const o = sheet.outcomes.find((x) => x.id === q.ql.outcome);
console.log(`escort complete: ${q.getTask({ name: 'escortComplete' }).getTriggerValue()}, success: ${q.questSuccess}`);
console.log(`settled outcome: ${q.ql.outcome} (pay ${o.pay}, gold x${goldFactor(o)})`);
console.log(`settled at the end: ${JSON.stringify(added)}`);
console.log(`gold the script minted ${minted}, paid ${gold.stackCount + added.reduce((a, n) => a + n, 0)} (x${((gold.stackCount + added.reduce((a, n) => a + n, 0)) / minted).toFixed(2)}) - owed ${Math.round(minted * goldFactor(o))}`);
console.log(`gear offer tier ${offers[0]?.tier} (the greater step applied at the end)`);
