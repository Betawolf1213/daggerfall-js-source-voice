// BRANCH Q3 (a party, the other way): the member answers first; their copy's state syncs back to the sharer, whose copy
// takes the member's answer and ends by it while the sharer's own box is still up; the sharer then answers that box.
const SNAP = '/home/user/daggerfall-js-source';
const { prepareQuestShare, receiveSharedQuest } = await import(`${SNAP}/src/systems/quest/questShare.js`);
const { makeBridge, stubWorld, goldOf } = await import('./b_harness.mjs');
console.warn = () => {};
const name = process.argv[2] ?? 'R0C11Y26';
const [memberAnswer, sharerAnswer] = [Number(process.argv[3] ?? 1), Number(process.argv[4] ?? 0)];
const A = makeBridge({ on: true }), B = makeBridge({ on: true });
const qa = A.bridge.machine.startQuestByName(name, 0);
stubWorld(qa);
A.bridge.machine.tick();
const qb = receiveSharedQuest(B.bridge.machine, B.bridge.questLists, name, prepareQuestShare(A.bridge.machine, qa.uid).data, {}).quest;
A.bridge.machine.sharedQuestNames?.add?.(name);
qa.getTask({ name: 'S.00' }).start(); qa.getTask({ name: 'qgclicked' }).start();
A.bridge.machine.tick();                                         // the sharer is asked
receiveSharedQuest(B.bridge.machine, B.bridge.questLists, name, prepareQuestShare(A.bridge.machine, qa.uid).data, {});
B.bridge.machine.tick();                                         // the member is asked
B.rec.asked[0].respond(memberAnswer);                            // the member answers first
B.bridge.machine.tick();
const back = receiveSharedQuest(A.bridge.machine, A.bridge.questLists, name, prepareQuestShare(B.bridge.machine, qb.uid).data, {});
console.log('member -> sharer sync:', JSON.stringify({ ok: back.ok, resync: back.resync ?? null, reason: back.reason ?? null }));
A.bridge.machine.tick();
console.log(`sharer, box still up: ended=${qa.questComplete || qa.ticksToEnd > 0} tasks qlkeep=${qa.getTask({ name: 'qlkeep' }).getTriggerValue()} qlalt=${qa.getTask({ name: 'qlalt' }).getTriggerValue()}`);
A.rec.asked[0].respond(sharerAnswer);                            // and now the sharer answers their own box
for (let i = 0; i < 5; i++) A.bridge.machine.tick();
console.log(`sharer: outcome=${qa.ql.outcome} success=${qa.questSuccess} gold=${JSON.stringify(goldOf(A.rec.rewards))} rep=${JSON.stringify(A.rec.rep)} offers=${A.rec.offers.length}`);
console.log(`member: outcome=${qb.ql?.outcome} gold=${JSON.stringify(goldOf(B.rec.rewards))} offers=${B.rec.offers.length}`);
