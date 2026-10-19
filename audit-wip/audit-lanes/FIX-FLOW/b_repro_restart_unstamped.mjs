// BRANCH: `ql act` is false forever on an unstamped quest (QlAct.checkTrigger: `if (!isStamped(quest)) return false`).
// A questline step restarted from the journal (QUEST-RESET, machine.restartQuest -> startQuestImmediate: a fresh stamp,
// read off the switch NOW) while the player's switch is off offline is unstamped for life - its act can never count,
// and turning the switch back on does not help (the stamp is for life). The step cannot be finished.
const SNAP = '/home/user/daggerfall-js-source';
const { setPref } = await import(`${SNAP}/src/systems/uiPrefs.js`);
const { QUESTLINES_PREF } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
const { makeBridge } = await import('./b_harness.mjs');
console.warn = () => {};
const { bridge } = makeBridge({ on: true });
const q = bridge.machine.startQuestByName('QLOC02', 0);
for (let i = 0; i < 2; i++) bridge.tick(1);
console.log('started on: stamped', q.ql?.stamp === 1, '| restart allowed:', bridge.journalClean?.canRestart?.(q.uid) ?? bridge.machine.restartRefusal(q.uid) === null);
setPref(QUESTLINES_PREF, false);                       // offline, the player's switch off
const r = bridge.machine.restartQuest(q.uid);
setPref(QUESTLINES_PREF, true);                        // and on again
const q2 = r.quest;
for (let i = 0; i < 2; i++) bridge.tick(1);
const heard = bridge.questlines.act('port-reached', 5);
for (let i = 0; i < 4; i++) bridge.tick(1);
const lanes = q2.getTask({ name: 'lanes' });
console.log(`restarted: ok=${r.ok} stamped=${q2.ql?.stamp === 1} | 5 ports reached, heard by ${heard} quests | the act's task set: ${lanes.getTriggerValue()}`);
