// Q3: each branch choice's task - what in the script SETS it. A branch is "a choice the player makes" (Arc 2.1: not a
// `pick one of`); flag a choice set only by a draw, by a trigger the player does not choose, or by nothing a player says.
const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';   // = git archive of the snapshot's HEAD (fe033c256): other lanes' probe mutants edit the shared worktree
const { SHEET_FAMILIES } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { questSource, packMachine, parsedQuest } = await import(`${SNAP}/test/qlSources.mjs`);
const { symName } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
const m = packMachine();
const stats = {};
for (const fam of SHEET_FAMILIES) for (const s of fam.sheets) {
  if (!(s.branches ?? []).length) continue;
  const lines = questSource(s.quest, true);
  const p = parsedQuest(s.quest, m);
  for (const b of s.branches) for (const c of b.choices) {
    const n = symName(c.sets);
    const re = new RegExp(`(^|[^A-Za-z0-9_.])_${n.replace(/\./g, '\\.')}_($|[^A-Za-z0-9_.])`);
    const setters = [];
    for (const l of lines) {
      const t = l.trim();
      if (!re.test(t)) continue;
      if (/^prompt\b/i.test(t)) setters.push('prompt');
      else if (/^promptmulti\b/i.test(t)) setters.push('promptmulti');
      else if (/^ask\b/i.test(t)) setters.push('ask');
      else if (/^pick one of\b/i.test(t)) setters.push('pick');
      else if (/^start task\b|^setvar\b/i.test(t)) setters.push('start');
      else if (/ do _| set _/.test(t)) setters.push('do/set');
    }
    const task = p.quest.tasks.get(n);
    const own = task?.hasTriggerConditions ? task.actions.filter((a) => a.isTriggerCondition).map((a) => a.typeName) : [];
    const kinds = new Set([...setters, ...own]);
    const playerChoice = kinds.has('prompt') || kinds.has('ask') || kinds.has('promptmulti');
    const key = playerChoice ? 'player' : [...kinds].join('+') || 'NOTHING';
    (stats[key] ??= []).push(`${s.quest}.${b.id}.${c.id} (${c.sets})`);
  }
}
for (const [k, v] of Object.entries(stats)) console.log(`## ${k}: ${v.length}\n  ${k === 'player' ? '' : v.join('\n  ')}`);
