// BRANCH Q1: every patched quest's patch applies (no fallback warning), the result parses, and every line the patch
// adds is claimed by a template (the unclaimed lines with the switch on are exactly DFU's own unclaimed lines).
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { QL_PATCHES, applyQuestlinePatches } = await import(`${SNAP}/src/systems/questlines/qlPatches.js`);
const { questSource, baseText, packMachine } = await import(`${SNAP}/test/qlSources.mjs`);
const warns = []; console.warn = (...a) => warns.push(a.join(' '));
const machine = packMachine();
const unclaimed = (q) => [...q.tasks.values()].flatMap((t) => t.pendingActionLines.map((l) => l.trim()).filter((l) => l && !l.startsWith('-')));
let bad = 0;
for (const name of QL_PATCHES.keys()) {
  let applied = true;
  try { applyQuestlinePatches(name, baseText(name)); } catch (e) { applied = false; console.log(name, 'PATCH DOES NOT APPLY:', e.message); }
  const on = machine.parseQuestForLists(questSource(name, true), 0, { rolls: () => 0, headless: true });
  const off = machine.parseQuestForLists(questSource(name, false), 0, { rolls: () => 0, headless: true });
  if (!on) { bad++; console.log(name, 'patched script does not parse'); continue; }
  const uOn = unclaimed(on), uOff = unclaimed(off);
  const added = uOn.filter((l) => !uOff.includes(l));
  if (!applied || added.length) { bad++; console.log(name, 'unclaimed lines the patch added:', added); }
  if (uOff.length) console.log(`   ${name}: DFU's own unclaimed lines (as shipped): ${JSON.stringify(uOff)}`);
}
console.log(`patched quests: ${QL_PATCHES.size}, problems: ${bad}; fallback warnings: ${warns.filter((w) => /read without its branch/.test(w)).length}`);
