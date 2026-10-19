// Q3, semantic: B's task needs (its `when X and Y` chain, closed) a task an EARLIER outcome A is bound to - so whenever
// B holds, A holds (unless A's task is cleared again), and B can never be settled.
const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';
const { SHEET_FAMILIES } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { packMachine, parsedQuest } = await import(`${SNAP}/test/qlSources.mjs`);
const { symName } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
const m = packMachine();
for (const fam of SHEET_FAMILIES) for (const s of fam.sheets) {
  const q = parsedQuest(s.quest, m).quest;
  const needs = (t, seen = new Set()) => {
    if (seen.has(t)) return seen; seen.add(t);
    const task = q.tasks.get(t);
    const w = task?.actions.find((a) => a.typeName === 'WhenTask');
    if (!w || w.evaluations.some((e) => e.op === 'or' || e.op === 'orNot') || task.actions.filter((a) => a.isTriggerCondition).length > 1) return seen;
    for (const e of w.evaluations) if (e.op === 'when' || e.op === 'and') needs(symName(e.task), seen);
    return seen;
  };
  const conj = (b) => (b.task ? [symName(b.task)] : b.all ? b.all.filter((x) => x.task).map((x) => symName(x.task)) : []);
  const outs = s.outcomes ?? [];
  for (let j = 0; j < outs.length; j++) {
    const B = outs[j];
    const closure = new Set(); for (const t of conj(B.on)) for (const n of needs(t)) closure.add(n);
    for (let i = 0; i < j; i++) {
      const A = outs[i];
      const at = A.on.task ? [symName(A.on.task)] : A.on.any ? A.on.any.filter((x) => x.task).map((x) => symName(x.task)) : A.on.all ? null : [];
      if (!at || !at.length) { if (A.on.all && A.on.all.every((x) => x.task && closure.has(symName(x.task)))) console.log(`${s.quest}: ${B.id} needs every task of earlier ${A.id} ${JSON.stringify(A.on)}`); continue; }
      const hit = at.find((t) => closure.has(t));
      if (hit) console.log(`${s.quest}: outcome ${B.id} (${JSON.stringify(B.on)}) needs _${hit}_ - earlier outcome ${A.id} (${JSON.stringify(A.on)}) holds first`);
    }
  }
}
