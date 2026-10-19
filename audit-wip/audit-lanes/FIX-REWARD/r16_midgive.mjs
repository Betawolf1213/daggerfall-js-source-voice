// REWARD: a `give pc` that is NOT the quest's pay (a tool handed over mid-quest, a reward of one side before another)
// marks the quest `paid` (qlLayer.reward: everything but a `letter` is pay) and spends the one gold scaling. List every
// sheeted quest's give pc whose task does not end the quest, with its item's kind.
import { SNAP } from './_env.mjs';
const { questSource, loadTables } = await import(`${SNAP}/test/qlSources.mjs`);
const { SHEETS } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { symName } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
loadTables();
for (const [name] of SHEETS) {
  const lines = questSource(name, true); if (!lines) continue;
  const kinds = new Map(); for (const l of lines) { const m = /^\s*Item\s+(\S+)\s+(\S+)/.exec(l); if (m) kinds.set(symName(m[1]), m[2]); }
  let task = '(start-up)', body = [], tasks = [], inQbn = false;
  for (const l of lines) {
    if (/^\s*QBN:/i.test(l)) { inQbn = true; continue; }
    if (!inQbn) continue;
    const h = /^\s*(_[A-Za-z0-9_.]+_)\s+task:/.exec(l) ?? /^\s*(variable)\s/.exec(l);
    if (h) { tasks.push({ task, body }); task = h[1]; body = []; continue; }
    body.push(l);
  }
  tasks.push({ task, body });
  for (const t of tasks) {
    const gives = t.body.map((l) => /^\s*give pc\s+(\S+)/.exec(l)?.[1]).filter(Boolean).filter((s) => s !== 'nothing' && kinds.get(symName(s)) !== 'letter');
    if (!gives.length) continue;
    const ends = t.body.some((l) => /^\s*end quest/.test(l));
    if (!ends) console.log(`${name.padEnd(9)} ${t.task.padEnd(16)} gives ${gives.map((g) => `${g}:${kinds.get(symName(g)) ?? '?'}`).join(' ')}  (task does not end the quest)`);
  }
}
