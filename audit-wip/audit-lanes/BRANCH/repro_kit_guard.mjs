// BRANCH Q6: the kit's "already carries a questlines branch" guard reads baseText - the text BEFORE the questlines'
// patches - so it can never fire: re-running the kit on a quest whose branch is already filed (even a hand-written D
// pattern) answers fresh patches without a word, and --write replaces the filed ones.
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { handinPatches } = await import(`${SNAP}/tools/qlPatchKit.mjs`);
const { hasQuestlinePatch } = await import(`${SNAP}/src/systems/questlines/qlPatches.js`);
for (const [q, t] of [['M0B50Y09', '_victory_'], ['R0C11Y03', '_pcgetsgold_'], ['L0B40Y04', '_pcgetsgold_']]) {
  let r; try { r = `answered ${handinPatches(q, t, { ask: 'Q?', keep: 'K', alt: 'A' }).length} patches`; } catch (e) { r = `refused: ${e.message}`; }
  console.log(`${q} (already patched: ${hasQuestlinePatch(q)}) -> kit ${r}`);
}
