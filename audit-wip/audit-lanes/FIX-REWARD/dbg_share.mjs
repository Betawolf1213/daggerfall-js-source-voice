import { makeBridge, tick } from './_bridge.mjs';
import { SNAP } from './_env.mjs';
const { prepareQuestShare, receiveSharedQuest } = await import(`${SNAP}/src/systems/quest/questShare.js`);
const sender = makeBridge({ level: 20 });
const s = sender.bridge.machine.startQuestByName('QLBD05', 0);
const env = prepareQuestShare(sender.bridge.machine, s.uid);
const m = makeBridge({ level: 3 });
const got = receiveSharedQuest(m.bridge.machine, m.bridge.questLists, 'QLBD05', env.data, { online: false });
console.log('got', got.ok, got.reason);
const q = got.quest;
q.getTask({ name: 'toguild' }).start();
tick(m.bridge, 8);
for (const n of ['toguild', 'guildway']) { const t = q.getTask({ name: n }); console.log(n, t?.triggered, t?.actions.map((a) => `${a.typeName}:${a.isComplete}`).join(' ')); }
console.log('complete', q.questComplete, 'ql', JSON.stringify(q.ql), 'machine has', m.bridge.machine.quests.size, 'tombstoned', q.questTombstoned);
