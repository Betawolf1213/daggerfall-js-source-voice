// REWARD: M0B00Y16 (Fighters Guild, the giant and the merchant) - the record's own example of "a quest that pays
// before it ends ... pays by the outcome it ends on". Its `rescued` outcome is `greater` (gold x1.25, a rung up). Run the
// rescue path through the real bridge, both orders (escort first, claim first), and compare the gold to the script's.
import { makeBridge, tick } from './_bridge.mjs';
for (const order of ['escort, then claim', 'claim, then escort']) {
  const { bridge, rec } = makeBridge();
  const quest = bridge.machine.startQuestByName('M0B00Y16', 41);
  for (const task of quest.tasks.values()) for (const a of task.actions) if (['PlaceFoe', 'PlaceNpc', 'HideNpc', 'RevealLocation'].includes(a.typeName)) a.isComplete = true;
  tick(bridge, 2);
  // the draw: the merchant is there (`_victim_`), no map, no magic item - forced as the pick would
  quest.getTask({ name: 'victim' }).start(); quest.getTask({ name: 'S.09' }).clear();
  const gold = quest.getItem({ name: 'gold' }).daggerfallUnityItem;
  const minted = gold.stackCount;
  quest.getTask({ name: 'S.03' }).start();     // the giant killed
  quest.getTask({ name: 'S.10' }).start();     // the merchant clicked ...
  quest.getTask({ name: 'yes' }).start();      // ... "lead me out": yes
  tick(bridge, 2);
  // at the store: `pc at _store_ set _S.13_` (PcAt starts S.13 when the player stands there - and clears it until then)
  const escort = () => { for (const a of quest.getTask({ name: 'yes' }).actions) if (a.typeName === 'PcAt') a.isComplete = true; const s13 = quest.getTask({ name: 'S.13' }); for (const a of s13.actions) if (a.typeName === 'PlaceNpc') a.isComplete = true; s13.start(); tick(bridge, 3); };
  const claim = () => { quest.getTask({ name: 'clickqgiver' }).start(); tick(bridge, 3); };
  if (order.startsWith('escort')) { escort(); claim(); } else { claim(); escort(); }
  tick(bridge, 6);
  const set = ['S.15','S.16','S.17','S.19','escortComplete','success'].filter((n) => quest.getTask({ name: n })?.triggered);
  console.log('   tasks set at the end:', set.join(' '));
  const paid = rec.rewards.filter((i) => i.group === 'Currency').reduce((a, i) => a + i.stackCount, 0) + rec.gold.reduce((a, n) => a + n, 0);
  console.log(`  settled at the end: ${JSON.stringify(rec.gold)} HUD ${JSON.stringify(rec.hud.filter((h) => /gold/.test(h)))}`);
  console.log(`${order}: outcome=${quest.ql.outcome} (sheet pay: greater = gold x1.25)  script minted ${minted} gold, player paid ${paid} - x${(paid / minted).toFixed(2)}; gear tier ${rec.offers[0]?.tier} (stamped ${quest.ql.tier}); ended ${quest.questComplete}`);
}
// control: the same harness, a `greater` outcome whose binding holds at GivePc (QLWR04's mercy) - scaled x1.25
{
  const { bridge, rec } = makeBridge({ level: 20 });
  const q = bridge.machine.startQuestByName('QLWR04', 0);
  for (const t of q.tasks.values()) for (const a of t.actions) if (a.typeName === 'PlaceNpc') a.isComplete = true;
  const gold = q.getItem({ name: 'gold' }).daggerfallUnityItem; const minted = gold.stackCount;
  q.getTask({ name: 'tomercy' }).start(); tick(bridge, 6);
  const paid = rec.rewards.filter((i) => i.group === 'Currency').reduce((a, i) => a + i.stackCount, 0);
  console.log(`control QLWR04 mercy: outcome=${q.ql.outcome}  minted ${minted}, paid ${paid} - x${(paid / minted).toFixed(2)}`);
}
