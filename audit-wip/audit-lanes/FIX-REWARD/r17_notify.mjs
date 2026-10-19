// REWARD: GivePc's notify / silently forms never set questSuccess (quest/actions.js: only _offerWithQuestComplete does);
// qlLaw.observe lets the catch-all failure row yield to a success only on `quest.questSuccess` - not on the layer's own
// `paid`. List every sheeted quest whose (non-letter) pay is a notify/silently give, and the outcome the pay's task binds.
import { SNAP } from './_env.mjs';
const { questSource, loadTables } = await import(`${SNAP}/test/qlSources.mjs`);
const { SHEETS } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { symName } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
loadTables();
for (const [name, sheet] of SHEETS) {
  const lines = questSource(name, true); if (!lines) continue;
  const kinds = new Map(); for (const l of lines) { const m = /^\s*Item\s+(\S+)\s+(\S+)/.exec(l); if (m) kinds.set(symName(m[1]), m[2]); }
  const quiet = lines.filter((l) => { const m = /^\s*give pc\s+(\S+)\s+(notify|silently)/.exec(l); return m && kinds.get(symName(m[1])) !== 'letter'; });
  const plain = lines.filter((l) => /^\s*give pc\s+(\S+)\s*$/.test(l) || /^\s*give pc nothing/.test(l) || /^\s*ql paid/.test(l));
  if (quiet.length && !plain.length) console.log(`${name.padEnd(9)} pays only quietly: ${quiet.map((l) => l.trim()).join(' | ')}  outcomes: ${(sheet.outcomes ?? []).map((o) => `${o.id}:${o.pay}${o.failure ? '(F)' : ''}=${JSON.stringify(o.on)}`).join('  ')}`);
}
