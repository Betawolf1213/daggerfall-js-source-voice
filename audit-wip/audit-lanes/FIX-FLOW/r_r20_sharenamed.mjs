// REWARD: a questline's last step is a quest like any other to the share law (questShare.js canReceiveSharedQuest refuses
// the main quest alone) - shared to a member who never walked the line, its ending pays that member the line's NAMED
// piece and its choice of gear (qlLayer.ending; the runner ignores a step it never began). Three members, three
// "Ysolde's Ember-Rod"s, from one walk of The Burning Doors.
import { makeBridge, tick } from './r__bridge.mjs';
import { SNAP } from './r__env.mjs';
const { prepareQuestShare, receiveSharedQuest } = await import(`${SNAP}/src/systems/quest/questShare.js`);
const sender = makeBridge({ level: 20 });
const s = sender.bridge.machine.startQuestByName('QLBD05', 0);
for (const t of s.tasks.values()) for (const a of t.actions) if (a.typeName === 'PlaceNpc') a.isComplete = true;
const env = prepareQuestShare(sender.bridge.machine, s.uid);
console.log('QLBD05 shareable:', env.ok);
console.log('QLBD05 sender refusal:', env.reason);
// FIX-FLOW: an envelope built past the sender's gate is refused on receipt too
const m = makeBridge({ level: 3 });
const got = receiveSharedQuest(m.bridge.machine, m.bridge.questLists, 'QLBD05', JSON.parse(JSON.stringify(sender.bridge.machine.getShareableQuestData(s.uid))), { online: false });
console.log('QLBD05 hand-built envelope, receiver:', JSON.stringify({ ok: got.ok, reason: got.reason }), '| offers paid:', m.rec.offers.length);
