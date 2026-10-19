// BRANCH Q3 (a party): decision 7 / section 10.2 - "who chooses in a shared quest: the sharer ... the copies take it on
// the resync". The `ask` is asked on EVERY copy whose trigger holds - and a resync carries the trigger's task state (the
// sharer's click), so the member is asked the sharer's question on their own screen, without a click of theirs, and their
// answer ends THEIR copy their own way.
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { prepareQuestShare, receiveSharedQuest } = await import(`${SNAP}/src/systems/quest/questShare.js`);
const { makeBridge, askTasks, stubWorld, goldOf } = await import('./harness.mjs');
console.warn = () => {};
const name = 'R0C11Y26';
const A = makeBridge({ on: true });     // the sharer
const qa = A.bridge.machine.startQuestByName(name, 0);
stubWorld(qa);
A.bridge.machine.tick();
const B = makeBridge({ on: true });     // the member
const first = receiveSharedQuest(B.bridge.machine, B.bridge.questLists, name, prepareQuestShare(A.bridge.machine, qa.uid).data, {});
A.bridge.machine.sharedQuestNames?.add?.(name);
const qb = first.quest;
console.log('member received:', first.ok);
// the sharer finishes the job and clicks the questor: their copy asks them
qa.getTask({ name: 'S.00' }).start();
qa.getTask({ name: 'qgclicked' }).start();
A.bridge.machine.tick();
console.log('sharer asked:', A.rec.asked.length);
// the party's sync carries the sharer's state to the member
const sync = receiveSharedQuest(B.bridge.machine, B.bridge.questLists, name, prepareQuestShare(A.bridge.machine, qa.uid).data, {});
console.log('resync:', JSON.stringify({ ok: sync.ok, resync: sync.resync ?? null, reason: sync.reason ?? null }));
B.bridge.machine.tick();
console.log('member asked (no click of theirs):', B.rec.asked.length);
// they answer differently, before the sharer does
B.rec.asked[0]?.respond(1);
for (let i = 0; i < 5; i++) B.bridge.machine.tick();
A.rec.asked[0].respond(0);
for (let i = 0; i < 5; i++) A.bridge.machine.tick();
console.log(`sharer: outcome=${qa.ql.outcome} gold=${JSON.stringify(goldOf(A.rec.rewards))} | member: ended=${qb.questComplete || qb.ticksToEnd > 0} outcome=${qb.ql?.outcome} gold=${JSON.stringify(goldOf(B.rec.rewards))} rep=${JSON.stringify(B.rec.rep)}`);
