// REWARD: a questline's last step is a quest like any other to the share law (questShare.js canReceiveSharedQuest refuses
// the main quest alone) - shared to a member who never walked the line, its ending pays that member the line's NAMED
// piece and its choice of gear (qlLayer.ending; the runner ignores a step it never began). Three members, three
// "Ysolde's Ember-Rod"s, from one walk of The Burning Doors.
import { makeBridge, tick } from './_bridge.mjs';
import { SNAP } from './_env.mjs';
const { prepareQuestShare, receiveSharedQuest } = await import(`${SNAP}/src/systems/quest/questShare.js`);
const sender = makeBridge({ level: 20 });
const s = sender.bridge.machine.startQuestByName('QLBD05', 0);
for (const t of s.tasks.values()) for (const a of t.actions) if (a.typeName === 'PlaceNpc') a.isComplete = true;
const env = prepareQuestShare(sender.bridge.machine, s.uid);
console.log('QLBD05 shareable:', env.ok);
for (const who of ['member A (never began the line)', 'member B (never began the line)']) {
  const m = makeBridge({ level: 3 });
  const got = receiveSharedQuest(m.bridge.machine, m.bridge.questLists, 'QLBD05', env.data, { online: false });
  const q = got.quest;
  // the world's part (Ysolde stood in her hall) is no part of this proof - no world here to stand her in: done by hand
  for (const t of q.tasks.values()) for (const a of t.actions) if (a.typeName === 'PlaceNpc') a.isComplete = true;
  q.getTask({ name: 'toguild' }).start();   // the embers to the Guild (the sharer's choice, carried on the resync)
  tick(m.bridge, 8);
  const o = m.rec.offers[0];
  const lines = m.bridge.questlines.lineRows().find((l) => l.id === 'burningDoors');
  console.log(`${who}: outcome ${q.ql.outcome}; offer tier ${o?.tier}: ${o?.pieces.map((p) => `${p.named ? '[NAMED] ' : ''}${p.item.name} (${p.tier})`).join(' | ')}; their Burning Doors line: ${lines?.state}`);
}
