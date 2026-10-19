import { SHEET_FAMILIES } from '/home/user/daggerfall-js-source/src/systems/questlines/qlSheets.js';
import { canSucceedUnnamed, choiceTasks, successFallback } from '/home/user/daggerfall-js-source/tools/qlSheetLaw.mjs';
import { packMachine, parsedQuest } from '/home/user/daggerfall-js-source/test/qlSources.mjs';
import { symName } from '/home/user/daggerfall-js-source/src/systems/questlines/qlLaw.js';
console.warn = () => {};
const m = packMachine();
const pos = (b, neg = false, out = []) => { if (!b || typeof b !== 'object') return out; for (const [k, v] of Object.entries(b)) { if (k === 'all' || k === 'any') v.forEach((x) => pos(x, neg, out)); else if (k === 'not') pos(v, !neg, out); else if (!neg) out.push([k, typeof v === 'string' ? symName(v) : v]); } return out; };
for (const fam of SHEET_FAMILIES) for (const s of fam.sheets) {
  const p = parsedQuest(s.quest, m); if (!p) continue;
  if (successFallback(s) || !canSucceedUnnamed(s, p.quest, p.lines)) continue;
  const chosen = choiceTasks(p.quest);
  const c = (s.outcomes ?? []).filter((o) => !o.failure && o.pay !== 'betrayal' && !pos(o.on).some(([k, v]) => k === 'choice' || (k === 'task' && chosen.has(v))));
  console.log(`${s.quest} [${fam.family}] -> ${c.map((o) => `${o.id}:${o.pay}${o.standing ? JSON.stringify(o.standing) : ''} ${JSON.stringify(o.on)}`).join(' | ') || 'NONE'}`);
}
