// UI REPRO: "Finish it to choose one of 3 pieces of gear" ON A QUEST THAT CAN PAY NO GEAR. The Quests tab's block
// (qlJournal.js qlObjectivesBlock) draws rewardWords(tier) under EVERY stamped quest not yet ended - but a quest offers its
// choice only when its outcome's pay gives gear (qlLayer.js ending: payProfileOf(outcome).gear). Every sheet scanned: those
// whose outcomes can NEVER pay gear, yet whose block promises it.
import { readFileSync, readdirSync } from 'node:fs';
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { PAY_PROFILES } = await import(`${SNAP}/src/systems/questlines/qlRewards.js`);
const { qlObjectivesBlock } = await import(`${SNAP}/src/ui/questlines/qlJournal.js`);
const { fakePage } = await import(`${SNAP}/test/hudPage.mjs`);
const never = [], some = [];
for (const f of readdirSync(`${SNAP}/src/systems/questlines/sheets`)) {
  const d = JSON.parse(readFileSync(`${SNAP}/src/systems/questlines/sheets/${f}`, 'utf8'));
  for (const s of d.sheets ?? []) {
    const paying = (s.outcomes ?? []).filter((o) => !o.failure && PAY_PROFILES[o.pay]?.gear);
    if (!paying.length) never.push(`${s.quest} (${d.family}: ${(s.outcomes ?? []).map((o) => `${o.id}=${o.pay}`).join(', ')})`);
    else some.push(s.quest);
  }
}
console.log(`sheets whose every outcome pays NO gear: ${never.length}`);
console.log('  ' + never.join('\n  '));
const doc = fakePage();
const block = qlObjectivesBlock(doc, { tier: 2, objectives: [{ id: 'summon', text: 'Do the Prince\'s bidding', state: 'open' }], choices: [], outcome: null });
console.log('\nthe block such a quest draws ends with:', JSON.stringify(block.querySelector('.px-qobj-reward').textContent));
