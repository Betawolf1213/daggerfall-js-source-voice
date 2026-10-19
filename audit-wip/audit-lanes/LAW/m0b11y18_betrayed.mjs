// M0B11Y18 (Fighters Guild flagship, "Lord K'avar"): the player gives the dying man's letter to the QUEEN (_S.18_: her
// gold - DFU's success), takes her hunt (_S.23_), and the traitor is not caught before `_gettraitor_` (30 days) runs out:
// _S.39_ -> _S.41_ `end quest`. No outcome row holds at the end but the catch-all; observe's yield takes the success
// fallback - the FIRST non-failure row, since the sheet has no `done` - which is `betrayed`: "You sold the dead man's
// letter to the traitor it named", the Queen -5, Lord K'avar +5, no gear.
const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';
const { readFileSync } = await import('node:fs');
const { join } = await import('node:path');
const { createQuestBridge } = await import(`${SNAP}/src/scenes/quest/questBridge.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { questSource, loadTables } = await import(`${SNAP}/test/qlSources.mjs`);
const { sheetFor } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { holds } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
loadTables(); setPref('questlines', true);
const VENDOR = join(SNAP, 'vendor', 'dfu-quests');
const warn = console.warn; console.warn = () => {};
let now = 1000;
const rep = [], offers = [];
const b = createQuestBridge({
  data: { readListTable: (n) => { try { return readFileSync(join(VENDOR, 'Tables', `QuestList-${n}.txt`), 'utf8'); } catch { return null; } }, getQuestSourceLines: (n) => questSource(n, true) },
  classicSeconds: () => now, nowSeconds: () => now, worldSeconds: () => now, playerEntity: { name: 'P', level: 6, skills: new Array(35).fill(30), career: { weaponArmorShieldsBitfield: 0, forbiddenMaterialsFlags: 0 } },
  carriesQuestItem: () => true, showPrompt: (q, m, respond) => respond(true),
  changeReputation: (fid, amount, propagate) => rep.push({ fid, amount, propagate }), onQuestlineOffer: (o) => offers.push(o),
});
const q = b.machine.startQuestByName('M0B11Y18', 0);
for (const t of q.tasks.values()) for (const a of t.actions) if (!a.isTriggerCondition) { const up = a.update.bind(a); a.update = (c) => { try { up(c); } catch { a.setComplete(); } }; }
const sheet = sheetFor('M0B11Y18');
let heldAtEnd = null;
const ending = b.questlines.ending.bind(b.questlines);
b.questlines.ending = (qq) => { heldAtEnd ??= sheet.outcomes.filter((o) => holds(qq, o.on, { ending: true })).map((o) => o.id); return ending(qq); };
const tick = (n = 1) => { for (let i = 0; i < n; i++) { now += 60; b.machine.tick(); b.questlines.look(); } };
const once = (task, type) => { const a = q.getTask({ name: task }).actions.find((x) => x.typeName === type); a.checkTrigger = () => { a.checkTrigger = () => false; return true; }; };
tick(2);
q.resources.get('S.02').remainingTimeInSeconds = 0; tick(2);            // the traitor leaves the palace for his fortress (_S.02_)
once('S.16', 'TotingItemAndClickedNpc'); tick(4);                          // the letter to the Queen: Yes - _S.18_ pays her gold
once('S.16', 'TotingItemAndClickedNpc');
console.log(`after the Queen: success ${q.questSuccess}, choices ${JSON.stringify(q.ql.choices)}`);
q.resources.get('gettraitor').remainingTimeInSeconds = 0; tick(6);       // her hunt taken (prompt 1051 Yes); the traitor not caught in time
console.warn = warn;
const o = sheet.outcomes.find((x) => x.id === q.ql.outcome);
console.log(`ended: complete ${q.questComplete}, DFU success ${q.questSuccess}, choices ${JSON.stringify(q.ql.choices)}`);
console.log(`outcome rows holding at the end: ${JSON.stringify(heldAtEnd)} -> settled "${q.ql.outcome}": "${o.text}"`);
console.log(`the layer's standing moves (propagate false): ${JSON.stringify(rep.filter((r) => r.propagate === false))}; gear offers: ${offers.length}`);
