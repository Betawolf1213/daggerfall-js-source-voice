// REWARD: B0B40Y09 (Knightly Orders, the giant) - its hand-in branch asks "Will you take [the herders' purse]?" and the
// sheet's `paid` outcome says "the herders paid what they could". Run both answers through the real bridge.
import { makeBridge, tick, summary } from './_bridge.mjs';
for (const answer of [0, 1]) {
  const { bridge, rec } = makeBridge();
  const quest = bridge.machine.startQuestByName('B0B40Y09', 0);
  for (const task of quest.tasks.values()) for (const a of task.actions) if (a.typeName === 'PlaceFoe') a.isComplete = true;
  quest.getTask({ name: 'S.01' }).start();   // the giant slain
  quest.getTask({ name: 'S.02' }).start();   // the questor clicked
  tick(bridge, 2);
  console.log(`answer ${answer} ("${answer ? 'Refuse it' : 'I will [take the purse]'}") - asked:`, rec.asked.length);
  rec.asked[0].respond(answer);
  tick(bridge, 6);
  const s = summary(rec, quest);
  console.log('  ', JSON.stringify({ ...s, offers: s.offers.map((o) => ({ outcome: o.outcome, tier: o.tier, rarities: o.pieces.map((p) => p.split(':')[1]) })) }));
  console.log('   gold given:', rec.rewards.filter((i) => i.group === 'Currency').reduce((a, i) => a + (i.stackCount ?? 0), 0), ' popups:', rec.popups.length);
}
