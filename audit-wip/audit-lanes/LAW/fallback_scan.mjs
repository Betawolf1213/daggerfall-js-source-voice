// The success fallback (qlLaw.js fallbackOutcome: the outcome named `done`, else the FIRST that is no failure) - what a
// success whose own row missed settles to (observe's catch-all yield), and what reward() scales gold by when no row
// holds at GivePc. Where the sheet has no `done`, the first non-failure is whatever the writer listed first.
const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';
const { SHEET_FAMILIES } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { fallbackOutcome } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);
const { payProfileOf, goldFactor } = await import(`${SNAP}/src/systems/questlines/qlRewards.js`);
for (const fam of SHEET_FAMILIES) for (const s of fam.sheets) {
  const fb = fallbackOutcome({ questSuccess: true }, s);
  if (!fb) { console.log(`${s.quest}: no success fallback`); continue; }
  const p = payProfileOf(fb);
  if (fb.id !== 'done' && (goldFactor(fb) !== 1 || !p.gear || p.step)) console.log(`${s.quest}: success fallback = ${fb.id} (pay ${fb.pay}: gold x${goldFactor(fb)}, gear ${p.gear}, step ${p.step}) standing ${JSON.stringify(fb.standing ?? {})}`);
}
