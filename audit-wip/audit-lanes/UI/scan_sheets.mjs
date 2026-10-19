import { readFileSync, readdirSync } from 'node:fs';
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const dir = `${SNAP}/src/systems/questlines/sheets`;
let nAny = 0, nOpt = 0, optFirst = [], anyGroups = [];
for (const f of readdirSync(dir)) {
  const d = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  for (const s of d.sheets ?? []) {
    const objs = s.objectives ?? [];
    const groups = {};
    objs.forEach((o, i) => { if (o.any) (groups[o.any] ??= []).push(i); if (o.optional) nOpt++; });
    for (const [g, idx] of Object.entries(groups)) { nAny++; anyGroups.push(`${s.quest}:${g}[${idx.map(i=>objs[i].id).join(',')}] of ${objs.length}; after=${objs.slice(Math.max(...idx)+1).map(o=>o.id).join(',')}`);
      // non-adjacent?
      for (let k=1;k<idx.length;k++) if (idx[k]!==idx[k-1]+1) console.log('NONADJACENT any group', s.quest, g, idx);
    }
    objs.forEach((o, i) => { if (o.optional && objs.slice(i+1).some((x) => !x.optional)) optFirst.push(`${s.quest}:${o.id}(open=${JSON.stringify(o.open??'always')}) before ${objs.slice(i+1).filter(x=>!x.optional).map(x=>x.id).join(',')}`); });
  }
}
console.log('any groups', nAny); console.log(anyGroups.join('\n'));
console.log('\noptional count', nOpt, '; optional listed before a required one:', optFirst.length); console.log(optFirst.join('\n'));
