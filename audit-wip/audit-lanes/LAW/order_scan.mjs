// Static: in each sheeted quest (patched, as the switch-on game reads it), a task whose `end quest` comes BEFORE the
// line that makes it a success (`give pc`, `ql paid`, `train pc`) - EndQuest sets questBreak, so the rest of the task
// runs a tick later, after the layer has settled the outcome at endQuest.
const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';   // = git archive of the snapshot's HEAD (fe033c256): other lanes' probe mutants edit the shared worktree
const { SHEET_FAMILIES } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { questSource } = await import(`${SNAP}/test/qlSources.mjs`);
const { qbnTasks } = await import(`${SNAP}/tools/qlSheetDraft.mjs`);
for (const fam of SHEET_FAMILIES) for (const s of fam.sheets) {
  const lines = questSource(s.quest, true);
  for (const [t, body] of qbnTasks(lines)) {
    const e = body.findIndex((l) => /^end quest/i.test(l));
    if (e < 0) continue;
    const after = body.slice(e + 1).filter((l) => /^(give pc|ql paid|train pc)/i.test(l));
    if (after.length) console.log(`${s.quest} ${t}: end quest, then ${after.join(' | ')}`);
    const notify = body.slice(0, e).filter((l) => /^give pc \S+ (notify|silently)/i.test(l));
    if (notify.length) console.log(`${s.quest} ${t}: ${notify.join(' | ')} (waits for town/day) before end quest`);
  }
}
