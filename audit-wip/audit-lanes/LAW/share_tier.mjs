// A shared copy's TIER is the sharer's: receivedState keeps the envelope's `tier` (qlState.js receivedState resets
// paid/moved/offer/acts only), and a social quest's tier is the sharer's LEVEL band (qlLaw.js questTierOf: social ->
// levelTier). mergeSharedState's own comment calls "the tier at its start" the holder's own - a received copy never had one.
const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';   // = git archive of the snapshot's HEAD (fe033c256): other lanes' probe mutants edit the shared worktree
const { readFileSync } = await import('node:fs');
const { join } = await import('node:path');
const { createQuestBridge } = await import(`${SNAP}/src/scenes/quest/questBridge.js`);
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { questSource, loadTables } = await import(`${SNAP}/test/qlSources.mjs`);
const { receiveSharedQuest } = await import(`${SNAP}/src/systems/quest/questShare.js`);
loadTables(); setPref('questlines', true);
const VENDOR = join(SNAP, 'vendor', 'dfu-quests');
const warn = console.warn; console.warn = () => {};
const bridge = (level, offers) => createQuestBridge({
  data: { readListTable: (n) => { try { return readFileSync(join(VENDOR, 'Tables', `QuestList-${n}.txt`), 'utf8'); } catch { return null; } }, getQuestSourceLines: (n) => questSource(n, true) },
  classicSeconds: () => 1000, playerEntity: { name: 'P', level, skills: new Array(35).fill(30), career: { weaponArmorShieldsBitfield: 0, forbiddenMaterialsFlags: 0 } },
  carriesQuestItem: () => false, onQuestlineOffer: (o) => offers.push(o),
});
const NAME = 'A0C10Y02';   // a Commoners quest (social: the level band)
const offersHi = [], offersLo = [];
const hi = bridge(25, offersHi), lo = bridge(1, offersLo);
const own = lo.machine.startQuestByName(NAME, 0);
const q = hi.machine.startQuestByName(NAME, 0);
hi.machine.sharedQuestNames.add(NAME);
const env = JSON.parse(JSON.stringify(hi.machine.getShareableQuestData(q.uid)));
lo.machine.removeQuest(own);
const got = receiveSharedQuest(lo.machine, lo.questLists, NAME, env, { online: false });
console.warn = warn;
console.log(`the level-1 player's own ${NAME}: tier ${own.ql.tier}`);
console.log(`the level-25 sharer's ${NAME}: tier ${q.ql.tier}`);
console.log(`the level-1 player's received copy: ok ${got.ok} tier ${got.quest?.ql?.tier}`);
// the copy ends well: what it pays the level-1 holder
const rq = got.quest;
rq.questSuccess = true; rq.ql.paid = true;
const sheetOut = (await import(`${SNAP}/src/systems/questlines/qlSheets.js`)).sheetFor(NAME).outcomes.find((o) => !o.failure && o.pay === 'standard');
rq.ql.outcome = sheetOut.id;
lo.questlines.ending(rq);
console.log(`the level-1 holder's offer: tier ${offersLo[0]?.tier} pieces ${offersLo[0]?.pieces.map((p) => p.tier).join(',')}`);
