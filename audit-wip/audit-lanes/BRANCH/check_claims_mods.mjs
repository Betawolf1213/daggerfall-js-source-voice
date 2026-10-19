// BRANCH: ql4_actions pins that the questlines' templates claim no line of DFU's vendored quests; the pack also reads the
// mods' quests (Roleplay & Realism, Warm Ashes, Foraging) and the port's own patched texts. Swept here: which lines of
// those a questlines template claims, and whether any DFU template (or Jagget's four) claims a questlines line.
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { QUEST_FILES, baseText, packMachine } = await import(`${SNAP}/test/qlSources.mjs`);
const { questlineActionTemplates } = await import(`${SNAP}/src/systems/questlines/qlActions.js`);
const m = packMachine();
const ours = new Set(m.actionTemplates.filter((t) => /^Ql/.test(t.typeName)));
const claimed = [];
let n = 0;
for (const [, f] of QUEST_FILES) {
  if (f.dir === 'questlines') continue;
  let inQbn = false;
  for (const line of baseText(f.name).split(/\r?\n/)) {
    if (/^\s*QBN:/i.test(line)) { inQbn = true; continue; }
    if (!inQbn || !line.trim() || /^\s*-/.test(line)) continue;
    n++;
    const t = m.getActionTemplate(line);
    if (t && ours.has(t)) claimed.push(`${f.dir}/${f.name}: ${line.trim()}`);
  }
}
console.log(`lines read: ${n}; claimed by a questlines template: ${claimed.length}`, claimed.slice(0, 5));
