// REWARD: GivePc tells a party member their share ("Your share of the party's reward: N gold.", shareQuestGold) BEFORE
// the layer scales the gold by the outcome (qlLayer.reward) - the HUD names one sum and the pile holds another.
import { makeBridge, tick } from './_bridge.mjs';
const { bridge, rec } = makeBridge({ level: 20, over: { partySize: () => 2 } });
const q = bridge.machine.startQuestByName('QLWR04', 0);
for (const t of q.tasks.values()) for (const a of t.actions) if (a.typeName === 'PlaceNpc') a.isComplete = true;
bridge.machine.markQuestShared('QLWR04');   // a quest kept in step with the party (two members)
q.getTask({ name: 'tomercy' }).start();     // the mercy he asks (`greater`: gold x1.25)
tick(bridge, 6);
const gold = rec.rewards.find((i) => i.group === 'Currency');
console.log('HUD:', rec.hud.filter((h) => /share/.test(h)));
console.log('the pile holds:', gold?.stackCount, 'gold; outcome', q.ql.outcome);
