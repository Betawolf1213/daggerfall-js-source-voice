// What the surviving letter mutant breaks: QLWR04's courier letter (`give pc _letter_ notify 1012`, the step's first
// give) marks the quest paid, so the `mercy` (greater) gold is never scaled. Run with the mutant applied to clean/.
import { makeBridge, tick } from './_bridge.mjs';
const { bridge, rec } = makeBridge({ level: 20 });
const q = bridge.machine.startQuestByName('QLWR04', 0);
for (const t of q.tasks.values()) for (const a of t.actions) if (a.typeName === 'PlaceNpc') a.isComplete = true;
for (const a of q.getTask({ name: 'courier' }).actions) if (a.typeName === 'GivePc') { a.offerImmediatelyNow(); }
q.getTask({ name: 'courier' }).start(); tick(bridge, 3);   // the courier's letter arrives
console.log('after the letter: paid =', q.ql.paid);
const gold = q.getItem({ name: 'gold' }).daggerfallUnityItem; const minted = gold.stackCount;
q.getTask({ name: 'tomercy' }).start(); tick(bridge, 6);
console.log(`mercy (greater): minted ${minted}, paid ${gold.stackCount} - x${(gold.stackCount / minted).toFixed(2)}`);
