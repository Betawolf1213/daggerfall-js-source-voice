// BRANCH Q2: every message a patch names exists in the patched script; every macro in a patch's words resolves against
// a resource the quest has, of a kind that expands that macro; every context macro is one the machine knows; and each
// symbol macro's FORM is one DFU's own text in that quest already uses ('!' marks one it does not - read by hand).
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { readFileSync } = await import('node:fs');
const { QL_PATCHES } = await import(`${SNAP}/src/systems/questlines/qlPatches.js`);
const { questSource, baseText, packMachine } = await import(`${SNAP}/test/qlSources.mjs`);
const { getMacro, MACRO_TYPES } = await import(`${SNAP}/src/systems/quest/questMacros.js`);
console.warn = () => {};
const src = readFileSync(`${SNAP}/src/systems/quest/questMacros.js`, 'utf8');
const CTX = new Set([...src.matchAll(/^\s*'(%[a-z0-9]+)':/gim)].map((m) => m[1].toLowerCase()));
const KIND_TYPES = { Person: [1, 2, 3, 4, 5, 6], Place: [1, 2, 3, 4], Foe: [1, 5], Item: [1, 5], Clock: [1, 5] };
const kindOf = (r) => (r.isPerson ? 'Person' : r.isPlace ? 'Place' : r.isFoe ? 'Foe' : r.isItem ? 'Item' : r.isClock ? 'Clock' : '?');
const machine = packMachine();
let issues = 0;
for (const name of QL_PATCHES.keys()) {
  const lines = questSource(name, true);
  const quest = machine.parseQuestForLists(lines, 0, { rolls: () => 0, headless: true });
  const base = baseText(name);
  const patchText = QL_PATCHES.get(name).map((p) => p.new).join('\n');
  const named = new Set();
  for (const m of patchText.matchAll(/\b(?:say|log)\s+(\d+)/g)) named.add(+m[1]);
  for (const m of patchText.matchAll(/\bask\s+(\d+)\s+choices((?:\s+\d+\s+_[^\s]+_)+)/g)) {
    named.add(+m[1]);
    for (const x of m[2].matchAll(/(\d+)\s+_/g)) named.add(+x[1]);
  }
  for (const id of named) if (!quest.getMessage(id)) { issues++; console.log(`${name}: names message ${id} the script does not have`); }
  const seen = [];
  for (const id of quest.messages.keys()) {
    if (id < 1900 || id > 1999) continue;
    const at = lines.findIndex((l) => new RegExp(`^Message:\\s+${id}\\b`).test(l));
    const body = [];
    for (let i = at + 1; i < lines.length && lines[i].trim(); i++) body.push(lines[i]);
    for (const word of body.join(' ').split(/\s+/)) {
      const m = getMacro(word);
      if (m.type === MACRO_TYPES.None) continue;
      if (m.type === MACRO_TYPES.ContextMacro) {
        const key = m.token.toLowerCase().replace(/[^%a-z0-9]/g, '');
        if (!CTX.has(key)) { issues++; console.log(`${name} ${id}: context macro ${m.token} unknown to the machine`); }
        seen.push(key);
        continue;
      }
      const r = quest.resources.get(m.symbol);
      if (!r) { issues++; console.log(`${name} ${id}: ${m.token} names no resource`); continue; }
      const k = kindOf(r);
      if (!KIND_TYPES[k]?.includes(m.type)) { issues++; console.log(`${name} ${id}: ${m.token} - a ${k} does not expand macro type ${m.type}`); }
      seen.push(`${m.token}(${k})${base.includes(m.token) ? '' : '!'}`);
    }
  }
  console.log(`${name}: named ${[...named].sort().join(',')} | ${[...new Set(seen)].join(' ')}`);
}
console.log(`message/macro problems: ${issues}`);
