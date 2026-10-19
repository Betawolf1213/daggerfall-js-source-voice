// REWARD: the layer offers gear only "on a quest that paid (its script's `give pc`, `ql paid`, or a success)" -
// qlLayer.js ending: `!(quest.ql.paid || quest.questSuccess)` returns no offer. questSuccess is set by GivePc alone
// (quest/actions.js _offerWithQuestComplete) or `ql paid`. A sheet whose outcomes pay gear over a script that never
// says `give pc` / `ql paid` on that path ends its success outcome with no choice of gear.
import { SNAP } from './_env.mjs';
const { questSource, loadTables } = await import(`${SNAP}/test/qlSources.mjs`);
const { SHEETS } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { PAY_PROFILES } = await import(`${SNAP}/src/systems/questlines/qlRewards.js`);
loadTables();
for (const [name, sheet] of SHEETS) {
  const lines = questSource(name, true);
  if (!lines) continue;
  const qbn = lines.slice(Math.max(0, lines.findIndex((l) => /^\s*QBN:/i.test(l))));
  const pays = qbn.some((l) => /^\s*(give pc\s|ql paid\b)/.test(l));
  const getsGold = qbn.filter((l) => /^\s*get item\s/.test(l)).map((l) => l.trim());
  const gearOutcomes = (sheet.outcomes ?? []).filter((o) => !o.failure && PAY_PROFILES[o.pay]?.gear);
  if (!pays && gearOutcomes.length) console.log(`${name.padEnd(10)} ${sheet.family.padEnd(14)} gear outcomes: ${gearOutcomes.map((o) => `${o.id}:${o.pay}`).join(' ')}   ${getsGold.length ? 'pays by: ' + getsGold.join(' | ') : ''}`);
}
