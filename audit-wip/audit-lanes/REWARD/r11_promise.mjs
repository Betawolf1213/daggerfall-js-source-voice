// REWARD: the Quests tab promises every running stamped quest "Finish it to choose one of 3 pieces of gear fitted to
// you" (qlJournal.js qlObjectivesBlock: `!ended && ql.tier` - the tier is always 1..4). Which sheets can never pay it:
// no outcome that pays gear (own / none / betrayal only). Drawn through the real block with a fake document.
import { SNAP } from './_env.mjs';
const { SHEETS } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { PAY_PROFILES } = await import(`${SNAP}/src/systems/questlines/qlRewards.js`);
const { qlObjectivesBlock } = await import(`${SNAP}/src/ui/questlines/qlJournal.js`);
const never = [];
for (const [name, sheet] of SHEETS) if (!(sheet.outcomes ?? []).some((o) => !o.failure && PAY_PROFILES[o.pay]?.gear)) never.push(`${name}(${(sheet.outcomes ?? []).filter((o) => !o.failure).map((o) => o.pay).join('/')})`);
console.log('sheets with NO outcome that pays gear:', never.length);
console.log('  ', never.join(' '));
// the block, drawn: a minimal document
const node = (tag) => ({ tag, className: '', textContent: '', children: [], append(...c) { this.children.push(...c); }, setAttribute() {} });
const doc = { createElement: node };
const text = (n) => [n.textContent, ...(n.children ?? []).map(text)].join(' ');
const row = { tier: 2, objectives: [{ id: 'x', text: 'Summon the Prince', state: 'open' }], choices: [], outcome: null };
console.log('\nthe Quests tab draws, for one of them (tier 2, running):', text(qlObjectivesBlock(doc, row)).replace(/\s+/g, ' ').trim());
