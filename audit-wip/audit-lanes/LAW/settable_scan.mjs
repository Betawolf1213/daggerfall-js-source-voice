// Q3: qlSheetLaw settable() reads ANY QBN line naming the task as a setter (bar when/until/clear/unset/drop and the
// header). A stricter reading: the setters the machine has - its own trigger, a start/setvar, a prompt/ask/promptmulti
// answer, a draw, a `do`/`set` arm, a timer that runs out into it, run quest's two tasks. A binding settable only by the
// loose reading is one the checker passes that may never hold.
const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';   // = git archive of the snapshot's HEAD (fe033c256): other lanes' probe mutants edit the shared worktree
const { SHEET_FAMILIES } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { packMachine, parsedQuest } = await import(`${SNAP}/test/qlSources.mjs`);
const { settable } = await import(`${SNAP}/tools/qlSheetLaw.mjs`);
const { bindingSymbols, symName } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
const m = packMachine();
function strict(quest, name) {
  const task = quest.tasks.get(name);
  if (!task) return false;
  if (task.hasTriggerConditions || task.globalVarLink !== -1 || task.type === 'headless' || task.type === 'persistUntil') return 'own';
  for (const t of quest.tasks.values()) for (const a of t.actions) {
    const syms = [];
    for (const k of Object.keys(a)) {
      const v = a[k];
      if (v && typeof v === 'object' && typeof v.name === 'string' && /Symbol|symbol|Task|task/.test(k)) syms.push([k, v.name]);
      if (Array.isArray(v)) for (const x of v) if (x && typeof x.name === 'string') syms.push([k, x.name]);
    }
    if (a.typeName === 'StartStopTimer' && a.isStartTimer && a.targetSymbol?.name === name && quest.resources.get(name)?.isClock) return 'timer';
    if (a.typeName === 'StartStopTimer') continue;
    if (['ClearTask', 'UnsetTask', 'DropTask', 'WhenTask'].includes(a.typeName)) continue;
    if (syms.some(([, n]) => n === name)) return a.typeName;
  }
  return false;
}
for (const fam of SHEET_FAMILIES) for (const s of fam.sheets) {
  const p = parsedQuest(s.quest, m);
  const all = [];
  for (const o of s.objectives ?? []) for (const k of ['open', 'done', 'fail']) if (o[k]) all.push([`${o.id}.${k}`, o[k]]);
  for (const o of s.outcomes ?? []) all.push([`outcome ${o.id}`, o.on]);
  for (const b of s.branches ?? []) for (const c of b.choices) all.push([`choice ${b.id}.${c.id}`, { task: c.sets }]);
  for (const [w, b] of all) for (const sym of bindingSymbols(b)) {
    if (sym.kind !== 'task') continue;
    const loose = settable(p.quest, sym.name, p.lines);
    const st = strict(p.quest, sym.name);
    if (loose && !st) console.log(`${s.quest} ${w}: _${sym.name}_ passes settable() but nothing in the machine sets it`);
  }
}
const tally = {};
for (const fam of SHEET_FAMILIES) for (const s of fam.sheets) {
  const p = parsedQuest(s.quest, m);
  for (const o of [...(s.objectives ?? []).flatMap((o) => [o.open, o.done, o.fail]), ...(s.outcomes ?? []).map((o) => o.on)]) for (const sym of bindingSymbols(o)) if (sym.kind === 'task') { const k = strict(p.quest, sym.name); tally[k] = (tally[k] ?? 0) + 1; }
}
console.log(tally);
