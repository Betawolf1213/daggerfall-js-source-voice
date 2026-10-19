// REWARD: a shared copy's reward TIER is the sender's (qlState.js receivedState keeps the envelope's `tier`; a received
// copy never passes the layer's stamp, which reads the holder's rank or level). A level-21 sharer's town errand (a
// social quest: tier by LEVEL band - 4) shared to a level-1 member pays the level-1 member a tier-4 choice. Each
// member's copy pays its own full choice (the gold is split by shareQuestGold; the gear is not).
import { makeBridge, tick } from './r__bridge.mjs';
import { SNAP } from './r__env.mjs';
const { prepareQuestShare, receiveSharedQuest } = await import(`${SNAP}/src/systems/quest/questShare.js`);
const { questTierOf } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
const sender = makeBridge({ level: 21 });
const s = sender.bridge.machine.startQuestByName('R0C10Y10', 0);
console.log(`sender (level 21) R0C10Y10: tier ${s.ql.tier}`);
const env = prepareQuestShare(sender.bridge.machine, s.uid);
const receiver = makeBridge({ level: 1 });
const got = receiveSharedQuest(receiver.bridge.machine, receiver.bridge.questLists, 'R0C10Y10', env.data, { online: false });
const q = got.quest;
console.log(`receiver (level 1): received ${got.ok}; its copy's tier ${q.ql.tier} - its own stamp would read tier ${questTierOf({ minReq: 1, social: true, level: 1 })}`);
// the receiver hands the weapon over: the reward task runs (`toting _weapon_ and _contact_ clicked` -> give pc, end quest)
q.getTask({ name: 'pcgetsgold' }).start();
tick(receiver.bridge, 6);
const o = receiver.rec.offers[0];
console.log(`receiver's offer: tier ${o?.tier}, pieces ${o?.pieces.map((p) => `${p.tier} ${p.item.name}`).join(' | ')}`);
