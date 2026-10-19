// DOC lane: does tools/qlPatchKit.mjs reproduce the hand-in patches the branch shipped? For each patched quest of the kit's
// shape, read back its reward task and its three words, regenerate, and compare byte for byte.
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { handinPatches } = await import(`${SNAP}/tools/qlPatchKit.mjs`);
const { QL_PATCHES } = await import(`${SNAP}/src/systems/questlines/qlPatches.js`);
const words = (block) => {
  const parts = block.split(/\nMessage:\s+\d+\n/).slice(1).map((s) => s.replace(/\n+$/, ''));
  return parts.map((p) => p.split('\n').map((l) => l.replace(/^<ce> /, '')).join('\n'));
};
let same = 0, differ = 0, refused = 0;
for (const [name, list] of QL_PATCHES) {
  if (list.length !== 3 || !/_qlkeep_/.test(list[0].new)) continue;
  const task = /(_[A-Za-z0-9.]+_) task:/.exec(list[0].old)?.[1];
  const [ask, keep, alt] = words('\n' + list[1].new.replace(/\nQBN:$/, '\n'));
  try {
    const gen = handinPatches(name, task, { ask, keep, alt });
    const ok = JSON.stringify(gen) === JSON.stringify(list.map((p) => ({ old: p.old, new: p.new, count: p.count })));
    if (ok) same++; else { differ++; console.log(`${name} (${task}): DIFFERS`); gen.forEach((g, i) => { if (g.old !== list[i].old || g.new !== list[i].new) console.log(`  patch ${i + 1}\n   shipped new: ${JSON.stringify(list[i].new).slice(0, 300)}\n   kit new:     ${JSON.stringify(g.new).slice(0, 300)}`); }); }
  } catch (e) { refused++; console.log(`${name} (${task}): kit refuses - ${e.message}`); }
}
console.log({ same, differ, refused });
