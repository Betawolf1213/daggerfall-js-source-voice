// BRANCH Q6: the hand-in kit (tools/qlPatchKit.mjs handinPatches) checks each patch's anchor against the UNPATCHED text,
// one at a time - never that the three apply in order. Run over every task of every quest in the pack that the kit
// accepts: the ones whose kit output does not apply (applyTextPatches throws), and the ones whose alt path loses a task
// that read the reward task (a second task keyed on it - the kit copies only the reward task's own lines).
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { handinPatches } = await import(`${SNAP}/tools/qlPatchKit.mjs`);
const { applyTextPatches } = await import(`${SNAP}/src/systems/quest/questPatches.js`);
const { QUEST_FILES, baseText } = await import(`${SNAP}/test/qlSources.mjs`);
console.warn = () => {};
let accepted = 0, broken = [], loses = [];
for (const [, f] of QUEST_FILES) {
  if (f.dir !== 'dfu') continue;
  const text = (baseText(f.name) ?? '').replace(/\r\n?/g, '\n');
  for (const m of text.matchAll(/^(_[A-Za-z0-9.]+_) task:\n[^\n]*\bwhen\b/gm)) {
    const task = m[1];
    let patches;
    try { patches = handinPatches(f.name, task, { ask: 'Q?', keep: 'Keep', alt: 'Alt' }); } catch { continue; }
    accepted++;
    try { applyTextPatches('KIT', f.name, patches, text); } catch (e) { broken.push(`${f.name} ${task}: ${e.message.slice(0, 120)}`); }
    // another task keyed on the reward task: `when ... _task_ ...` elsewhere - lost on the alt path
    const readers = text.split('\n').filter((l) => /^\s*when\b/.test(l) && l.includes(task) && !l.startsWith(`${task} task:`));
    const own = new RegExp(`^${task.replace(/\./g, '\\.')} task:\\n\\s*(when[^\\n]*)`, 'm').exec(text)?.[1]?.trim();
    const others = readers.map((l) => l.trim()).filter((l) => l !== own);
    if (others.length) loses.push(`${f.name} ${task}: read by ${JSON.stringify(others)}`);
  }
}
console.log(`kit accepted ${accepted} (quest, reward task) pairs`);
console.log(`- whose patches throw when applied in order: ${broken.length}`); broken.slice(0, 12).forEach((b) => console.log('   ', b));
console.log(`- whose reward task another task reads (lost on the alt path): ${loses.length}`); loses.slice(0, 12).forEach((b) => console.log('   ', b));
