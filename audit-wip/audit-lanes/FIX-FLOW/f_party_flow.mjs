// FIX-FLOW: BRANCH-1 after the fix, the production flow - a party of two (partySize 2, as world.js wires it), the sharer
// answers, the party's sync carries it (never from EndQuest's grace - world.js questSyncTick), the member's copy follows.
const LIVE = '/home/user/daggerfall-js-source';
const { prepareQuestShare, prepareShareData, receiveSharedQuest } = await import(`${LIVE}/src/systems/quest/questShare.js`);
const { makeBridge, stubWorld, goldOf } = await import('./b_harness.mjs');
console.warn = () => {};
const name = 'R0C11Y26';
for (const answer of [0, 1]) {
  const A = makeBridge({ on: true }), B = makeBridge({ on: true });
  A.bridge.machine.deps.partySize = () => 2; B.bridge.machine.deps.partySize = () => 2;
  const qa = A.bridge.machine.startQuestByName(name, 0);
  stubWorld(qa);
  A.bridge.machine.tick();
  A.bridge.machine.markQuestShared(name);
  const qb = receiveSharedQuest(B.bridge.machine, B.bridge.questLists, name, prepareQuestShare(A.bridge.machine, qa.uid).data, {}).quest;
  qa.getTask({ name: 'S.00' }).start(); qa.getTask({ name: 'qgclicked' }).start();
  A.bridge.machine.tick();
  const syncAB = () => { if (qa.ticksToEnd > 0) return null; const p = prepareQuestShare(A.bridge.machine, qa.uid); return p.ok ? receiveSharedQuest(B.bridge.machine, B.bridge.questLists, name, p.data, {}) : p; };
  syncAB(); B.bridge.machine.tick(); B.bridge.machine.tick();
  console.log(`answer ${answer}: sharer asked ${A.rec.asked.length}, member asked ${B.rec.asked.length} (received ${qb.ql.received})`);
  A.rec.asked[0].respond(answer);
  A.bridge.machine.tick();
  const s = syncAB();
  let fin = null;
  for (let i = 0; i < 6; i++) {
    A.bridge.machine.tick(); B.bridge.machine.tick();
    for (let d = A.bridge.machine.nextFinishedShare?.(); d; d = A.bridge.machine.nextFinishedShare()) {   // world.js questSyncTick's final
      const p = prepareShareData(d);
      fin = p.ok ? receiveSharedQuest(B.bridge.machine, B.bridge.questLists, name, { ...p.data, sync: 1, final: 1 }, {}) : p;
      A.bridge.machine.settleFinishedShare(d);
    }
  }
  console.log(`   the final: ${JSON.stringify({ ok: fin?.ok, resync: fin?.resync, reason: fin?.reason })}`);
  console.log(`   sync after the answer: ${JSON.stringify({ ok: s?.ok, resync: s?.resync, reason: s?.reason })}`);
  console.log(`   sharer: outcome=${qa.ql.outcome} ended=${qa.questComplete || qa.questTombstoned || qa.ticksToEnd > 0} gold=${JSON.stringify(goldOf(A.rec.rewards))} rep=${JSON.stringify(A.rec.rep)} offers=${A.rec.offers.length}`);
  console.log(`   member: outcome=${qb.ql.outcome} ended=${qb.questComplete || qb.questTombstoned || qb.ticksToEnd > 0} gold=${JSON.stringify(goldOf(B.rec.rewards))} rep=${JSON.stringify(B.rec.rep)} offers=${B.rec.offers.length} asked=${B.rec.asked.length}`);
}
