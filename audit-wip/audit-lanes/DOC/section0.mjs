// DOC lane: the record's section 0 / section 3 counts, read off the vendored pack.
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { QUEST_FILES, classicRows, baseText } = await import(`${SNAP}/test/qlSources.mjs`);
const { defaultActionTemplates } = await import(`${SNAP}/src/systems/quest/actions.js`).catch(() => ({}));
const byDir = {};
for (const f of QUEST_FILES.values()) byDir[f.dir] = (byDir[f.dir] ?? 0) + 1;
console.log('files by dir', byDir);
const dfu = [...QUEST_FILES.values()].filter((f) => f.dir === 'dfu');
console.log('S0000*', dfu.filter((f) => /^S0000/i.test(f.name)).length, '__DEMO', dfu.filter((f) => /^__DEMO/i.test(f.name)).length);
const rows = classicRows();
const groups = {};
for (const r of rows) groups[r.group] = (groups[r.group] ?? 0) + 1;
console.log('classic rows', rows.length, groups);
const qbn = (t) => t.slice(Math.max(0, t.search(/^\s*QBN:/im)));
let prompt = 0, pick = 0, either = 0, rank4 = 0, onetime = 0;
const set = new Set();
for (const r of rows) {
  const t = qbn(baseText(r.name) ?? '');
  const p = /^\s*prompt /im.test(t), k = /pick one of/i.test(t);
  if (p) prompt++; if (k) pick++; if (p || k) either++;
  if (r.minReq >= 4 && r.minReq < 10) rank4++;
  if (r.flag === '1') onetime++;
  if (p || (r.minReq >= 4 && r.minReq < 10) || r.flag === '1') set.add(r.name);
}
console.log({ prompt, pick, either, rank4, onetime, flagship: set.size });
// flagship by group vs the record's table
const fg = {};
for (const r of rows) if (set.has(r.name)) (fg[r.group] ??= []).push(r.name);
for (const [g, l] of Object.entries(fg)) console.log(g, l.length, l.sort().join(' '));
// the machine's templates
const { QuestMachine } = await import(`${SNAP}/src/systems/quest/machine.js`);
console.log('DFU templates', new QuestMachine({ nowSeconds: () => 0 }).actionTemplates.length);
