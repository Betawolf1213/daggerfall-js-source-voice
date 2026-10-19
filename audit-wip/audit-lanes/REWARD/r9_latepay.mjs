// REWARD: every outcome that scales gold (lesser 0.75 / greater 1.25) whose binding can only come true AFTER the gold is
// handed over - its task is a `when` over the very task that says `give pc <gold>` - so at GivePc's moment (the only
// moment qlLayer.reward scales) the quest reads as another outcome and the scale is never applied. Static, over the
// scripts as the game reads them (patched, the switch on).
import { SNAP } from './_env.mjs';
const { questSource, loadTables } = await import(`${SNAP}/test/qlSources.mjs`);
const { SHEETS } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { PAY_PROFILES } = await import(`${SNAP}/src/systems/questlines/qlRewards.js`);
const { symName } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
loadTables();
const parseTasks = (lines) => {
  const tasks = new Map(); let cur = null, inQbn = false;
  for (const l of lines) {
    if (/^\s*QBN:/i.test(l)) { inQbn = true; continue; }
    if (!inQbn) continue;
    const h = /^\s*(_[A-Za-z0-9_.]+_)\s+task:/.exec(l);
    if (h) { cur = { name: symName(h[1]), body: [] }; tasks.set(cur.name, cur); continue; }
    if (/^\s*variable\s/.test(l) || /^\s*until\s/.test(l)) { cur = null; continue; }
    if (cur) cur.body.push(l);
  }
  return tasks;
};
const findings = [];
for (const [name, sheet] of SHEETS) {
  const scaled = (sheet.outcomes ?? []).filter((o) => PAY_PROFILES[o.pay] && PAY_PROFILES[o.pay].gold !== 1);
  if (!scaled.length) continue;
  const lines = questSource(name, true); if (!lines) continue;
  const kinds = new Map(); for (const l of lines) { const m = /^\s*Item\s+(\S+)\s+(\S+)/.exec(l); if (m) kinds.set(symName(m[1]), m[2]); }
  const tasks = parseTasks(lines);
  const goldTasks = new Set([...tasks.values()].filter((t) => t.body.some((l) => { const m = /^\s*give pc\s+(\S+)/.exec(l); return m && kinds.get(symName(m[1])) === 'gold'; })).map((t) => t.name));
  if (!goldTasks.size) continue;
  // a task that can only be set after a gold task ran: its `when` names one (and is no `or` around it)
  const after = (tn) => { const t = tasks.get(tn); const w = t?.body.find((l) => /^\s*when\s/.test(l)); if (!w) return false; if (/\bor\b/.test(w)) return false; return [...goldTasks].some((g) => new RegExp(`(^|\\s)_${g.replace('.', '\\.')}_(\\s|$)`).test(w) && !new RegExp(`not\\s+_${g.replace('.', '\\.')}_`).test(w)); };
  const needsAfter = (b) => {
    if (!b || typeof b !== 'object') return false;
    if (b.task) return after(symName(b.task));
    if (Array.isArray(b.all)) return b.all.some(needsAfter);
    if (Array.isArray(b.any)) return b.any.length > 0 && b.any.every(needsAfter);
    return false;
  };
  for (const o of scaled) if (needsAfter(o.on)) findings.push(`${name}.${o.id} (${o.pay}, x${PAY_PROFILES[o.pay].gold}) on ${JSON.stringify(o.on)}; gold given in task(s) ${[...goldTasks].join(',')}`);
}
console.log('scaled outcomes that can never hold at GivePc (their gold factor is never applied):', findings.length);
for (const f of findings) console.log('  ', f);
// and the second shape: the outcome's task started (or setvar'd) by the gold task itself, on a line AFTER its give pc
const late2 = [];
for (const [name, sheet] of SHEETS) {
  const scaled = (sheet.outcomes ?? []).filter((o) => PAY_PROFILES[o.pay] && PAY_PROFILES[o.pay].gold !== 1);
  if (!scaled.length) continue;
  const lines = questSource(name, true); if (!lines) continue;
  const kinds = new Map(); for (const l of lines) { const m = /^\s*Item\s+(\S+)\s+(\S+)/.exec(l); if (m) kinds.set(symName(m[1]), m[2]); }
  const tasks = parseTasks(lines);
  for (const t of tasks.values()) {
    const gi = t.body.findIndex((l) => { const m = /^\s*give pc\s+(\S+)/.exec(l); return m && kinds.get(symName(m[1])) === 'gold'; });
    if (gi < 0) continue;
    const startedAfter = new Set(t.body.slice(gi + 1).flatMap((l) => [...l.matchAll(/(?:start task|setvar)\s+(_[A-Za-z0-9_.]+_)/g)].map((m) => symName(m[1]))));
    for (const o of scaled) { const syms = JSON.stringify(o.on).match(/_[A-Za-z0-9_.]+_/g) ?? []; if (syms.some((s) => startedAfter.has(symName(s)))) late2.push(`${name}.${o.id} (${o.pay}): ${JSON.stringify(o.on)} started after the give in ${t.name}`); }
  }
}
console.log('outcomes started by the gold task after its give:', late2.length, late2);
