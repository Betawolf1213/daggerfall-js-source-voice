// Q3: outcomes the sheet's ORDER makes unreachable - outcomeNow takes the first that holds, so a later outcome whose
// binding implies an earlier one's can never be settled (syntactic implication: B's `all` contains A's task, or A's
// `any` contains B's binding, or the same binding). qlSheetLaw does not look at order.
const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';
const { SHEET_FAMILIES } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const key = (b) => JSON.stringify(b);
const conj = (b) => (b.all ? b.all.map(key) : [key(b)]);          // B holds => every conjunct holds
const disj = (b) => (b.any ? b.any.map(key) : [key(b)]);          // A holds <= any disjunct holds
const implies = (b, a) => { const cb = new Set(conj(b)); return disj(a).some((d) => cb.has(d)) || (a.all && a.all.every((x) => cb.has(key(x)))); };
for (const fam of SHEET_FAMILIES) for (const s of fam.sheets) {
  const outs = s.outcomes ?? [];
  for (let j = 0; j < outs.length; j++) for (let i = 0; i < j; i++) {
    const A = outs[i], B = outs[j];
    if (B.on?.ended === true && Object.keys(B.on).length === 1) continue;
    if (implies(B.on, A.on)) console.log(`${s.quest}: outcome ${B.id} ${key(B.on)} can never be settled - ${A.id} ${key(A.on)} comes first and holds whenever it does`);
  }
  // objectives: done implies open is fine; an objective whose fail is implied by its done is odd
}
