const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { handinPatches } = await import(`${SNAP}/tools/qlPatchKit.mjs`);
const { QL_PATCHES } = await import(`${SNAP}/src/systems/questlines/qlPatches.js`);
const { SHEETS } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { baseText } = await import(`${SNAP}/test/qlSources.mjs`);
for (const [name, task] of [['B0B40Y09', '_success_'], ['B0B70Y16', '_success_'], ['R0C11Y03', '_pcgetsgold_'], ['P0A01L00', '_pcgetsgold_'], ['P0B10L08', '_reward_']]) {
  const list = QL_PATCHES.get(name);
  const gen = handinPatches(name, task, { ask: 'a', keep: 'b', alt: 'c' });
  const alt = (s) => s.slice(s.indexOf('_qlaltpath_ task:'));
  console.log(`== ${name}\n shipped: ${JSON.stringify(alt(list[2].new))}\n kit:     ${JSON.stringify(alt(gen[2].new))}`);
  const t = baseText(name); const i = t.indexOf(`${task} task:`); console.log(' reward task:', JSON.stringify(t.slice(i, i + 260)));
  const s = SHEETS.get(name); console.log(' outcomes:', s.outcomes.map((o) => `${o.id}/${o.pay}/${JSON.stringify(o.standing ?? {})}`).join(' '));
}
