// Static: an outcome bound to a `when` task that reads the reward task (the task whose GivePc pays the gold) and stands
// AFTER it in the script cannot hold at GivePc's moment (Quest.update walks the tasks in order; qlLayer.js reward scales
// the gold by outcomeNow THEN). Its gold factor is then never paid: the gold is scaled by whatever holds at the reward
// task, or the success fallback.
const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';
const { SHEET_FAMILIES } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { packMachine, parsedQuest } = await import(`${SNAP}/test/qlSources.mjs`);
const { symName, fallbackOutcome } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
const { goldFactor } = await import(`${SNAP}/src/systems/questlines/qlRewards.js`);
const m = packMachine();
const isCatch = (o) => o.on && Object.keys(o.on).length === 1 && o.on.ended === true;
for (const fam of SHEET_FAMILIES) for (const s of fam.sheets) {
  const p = parsedQuest(s.quest, m); const q = p.quest;
  const order = [...q.tasks.keys()];
  const whenReads = (t) => { const task = q.tasks.get(t); const w = task?.actions.find((a) => a.typeName === 'WhenTask'); return w ? w.evaluations.filter((e) => !/not/i.test(e.op)).map((e) => symName(e.task)) : []; };
  for (const [rName, r] of q.tasks) {
    const gives = r.actions.filter((a) => a.typeName === 'GivePc' && !a.isNothing && q.resources.get(a.itemSymbol?.name)?.isGold);
    if (!gives.length) continue;
    // what holds at R: outcomes bound to R itself (or to tasks before R that R's own `when` needs)
    const before = new Set([rName, ...whenReads(rName)]);
    const holdsAtR = (o) => { const b = o.on; const ts = b.task ? [symName(b.task)] : b.all ? b.all.map((x) => x.task && symName(x.task)) : null; return ts && ts.every((t) => t && (before.has(t) || order.indexOf(t) < order.indexOf(rName) && !whenReads(t).includes(rName))); };
    const atR = s.outcomes.find((o) => !isCatch(o) && holdsAtR(o)) ?? fallbackOutcome({ questSuccess: true }, s);
    for (const o of s.outcomes) {
      if (o.failure || isCatch(o)) continue;
      const t = o.on.task ? symName(o.on.task) : null;
      if (!t || t === rName) continue;
      if (whenReads(t).includes(rName) && order.indexOf(t) > order.indexOf(rName) && goldFactor(o) !== goldFactor(atR)) {
        console.log(`${s.quest}: outcome ${o.id} (${o.pay}, x${goldFactor(o)}) is bound to _${t}_, which reads the reward task _${rName}_ and stands after it - its gold is scaled by ${atR?.id} (${atR?.pay}, x${goldFactor(atR)})`);
      }
    }
  }
}
