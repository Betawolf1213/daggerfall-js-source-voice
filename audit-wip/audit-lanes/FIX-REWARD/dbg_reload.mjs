import { makeBridge, tick } from './_bridge.mjs';
const { bridge, rec } = makeBridge({ level: 12 });
const q = bridge.machine.startQuestByName('QLWR04', 0);
for (const t of q.tasks.values()) for (const a of t.actions) if (a.typeName === 'PlaceNpc') a.isComplete = true;
q.getTask({ name: 'tomercy' }).start(); tick(bridge, 1);
const snap = bridge.snapshot();
console.log('quests', [...bridge.machine.quests.keys()], 'gold', JSON.stringify(snap.questlines.gold), 'paid', q.ql.paid);
