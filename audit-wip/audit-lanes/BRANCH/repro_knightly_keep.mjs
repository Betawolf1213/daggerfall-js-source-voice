// BRANCH: the Knightly Orders' hand-ins whose ask OFFERS the player something to take - the herders' purse (B0B40Y09),
// the orcs' plunder (B0B40Y08), the grave goods (B0B60Y12), the Mages Guild's "good coin" for the lich's books (B0B80Y17).
// The keep answer's path is DFU's own reward task, which gives NOTHING (`give pc nothing`): no purse, no plunder, no goods,
// no coin. Both answers pay the same choice of gear at the same tier (standard and lesser differ only in a gold factor
// over gold that does not exist), and the refusal adds standing - so taking what is offered pays strictly less.
import { makeBridge, askTasks, forceTask, stubWorld, goldOf } from './harness.mjs';
console.warn = () => {};
for (const name of ['B0B40Y09', 'B0B40Y08', 'B0B60Y12', 'B0B80Y17']) {
  const rows = [];
  for (const c of [0, 1]) {
    const { bridge, rec } = makeBridge({ on: true });
    const q = bridge.machine.startQuestByName(name, 0);
    stubWorld(q);
    for (let i = 0; i < 2; i++) bridge.machine.tick();
    for (const t of askTasks(q)) forceTask(t);
    bridge.machine.tick();
    const question = rec.asked[0].message.getTextTokens(-1, () => 0).map((t) => t.text).join(' ').replace(/\s+/g, ' ').slice(0, 70);
    const choice = rec.asked[0].choices[c].getTextTokens(-1, () => 0).map((t) => t.text).join(' ').replace(/\s+/g, ' ').slice(0, 40);
    rec.asked[0].respond(c);
    for (let i = 0; i < 6; i++) bridge.machine.tick();
    if (c === 0) console.log(`${name}: "${question}..."`);
    console.log(`   ${c === 0 ? 'keep' : 'alt '} "${choice}" -> outcome=${q.ql.outcome} given=${JSON.stringify(goldOf(rec.rewards))} gear tier=${rec.offers[0]?.tier} standing=${JSON.stringify(rec.rep.filter(([f]) => f !== 0))} script repute lines=${JSON.stringify(rec.rep.filter(([f]) => f === 0))}`);
  }
}
