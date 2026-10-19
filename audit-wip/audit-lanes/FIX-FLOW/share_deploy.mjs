// Q1 (a save from BEFORE this branch): a flagship quest taken before the deploy is DFU's script (no branch patch, no
// `ql`). After the deploy the switch is forced on online, so every receiver's REFERENCE parse of that quest
// (machine.parseQuestShape -> getQuestSourceLines -> questlineLines) is the PATCHED script, and questShare.js
// shapeMismatch holds the pre-deploy envelope to it: a fresh share is refused, and so is every resync of a copy the
// party already shares - its live sync stops for good.
const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';   // = git archive of the snapshot's HEAD (fe033c256): other lanes' probe mutants edit the shared worktree
const { QuestMachine } = await import(`${SNAP}/src/systems/quest/machine.js`);
const { receiveSharedQuest } = await import(`${SNAP}/src/systems/quest/questShare.js`);
const { questSource, loadTables } = await import(`${SNAP}/test/qlSources.mjs`);
const { questlineActionTemplates } = await import(`${SNAP}/src/systems/questlines/qlActions.js`);
loadTables();
const warn = console.warn; console.warn = () => {};
const lists = { findQuestMeta: () => null, hasAcceptedOneTime: () => false, markOneTimeAccepted() {} };
let deployed = false;   // the page reloads onto the new build: the switch exists, forced on online
const mk = () => { const m = new QuestMachine({ nowSeconds: () => 1000, getQuestSourceLines: (n, on) => questSource(n, on ?? deployed) }); for (const t of questlineActionTemplates()) m.registerAction(t); return m; };
const NAME = 'A0C01Y01';   // a Commoners flagship quest with a branch patch (no guild gate on receipt)
const sender = mk(), mate = mk(), late = mk();
const q = sender.startQuestByName(NAME, 0);
sender.sharedQuestNames.add(NAME);
const env0 = JSON.parse(JSON.stringify(sender.getShareableQuestData(q.uid)));
const first = receiveSharedQuest(mate, lists, NAME, env0, { online: false });
console.warn = warn;
console.log('before the deploy - shared to a mate:', first.ok, first.reason ?? '', '| sender ql:', q.ql);
deployed = true;
console.warn = () => {};
const env1 = JSON.parse(JSON.stringify(sender.getShareableQuestData(q.uid)));
const resync = receiveSharedQuest(mate, lists, NAME, env1, { online: false });
const fresh = receiveSharedQuest(late, lists, NAME, env1, { online: false });
console.warn = warn;
console.log('after the deploy - the same quest resynced to that mate:', resync.ok, resync.reason ?? '');
console.log('after the deploy - shared to a new mate:', fresh.ok, fresh.reason ?? '');
console.log('tasks in the envelope vs the receiver\'s reference parse:', env1.tasks.length, mate.parseQuestShape(NAME).tasks.size);
