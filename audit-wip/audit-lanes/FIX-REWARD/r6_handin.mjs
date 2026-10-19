// The hand-in branches (pattern C/D: `_qlkeep_` - "take your pay" - against `_qlalt_`): what the KEEP path actually
// gives. A keep path whose reward task says `give pc nothing` asks the player to take pay that does not exist.
import { SNAP } from './_env.mjs';
const { questSource, loadTables } = await import(`${SNAP}/test/qlSources.mjs`);
const { QL_PATCHES } = await import(`${SNAP}/src/systems/questlines/qlPatches.js`);
loadTables();
for (const [name] of QL_PATCHES) {
  const lines = questSource(name, true);
  if (!lines.some((l) => /_qlkeep_/.test(l))) continue;
  const kinds = new Map();
  for (const l of lines) { const m = /^\s*Item\s+(\S+)\s+(\S+)/.exec(l); if (m) kinds.set(m[1], m[2]); }
  // the task(s) triggered by `when _qlkeep_`
  const gives = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*when\b.*_qlkeep_/.test(lines[i])) continue;
    for (let j = i + 1; j < lines.length && !/task:\s*$/.test(lines[j]) && !/^\s*variable /.test(lines[j]); j++) {
      const m = /^\s*give pc\s+(\S+)/.exec(lines[j]); if (m) gives.push(m[1] === 'nothing' ? 'nothing' : `${m[1]}:${kinds.get(m[1]) ?? '?'}`);
    }
  }
  const msgAt = lines.findIndex((l) => /^Message:\s+1900\b/.test(l));
  const ask = msgAt >= 0 ? lines.slice(msgAt + 1, msgAt + 5).join(' ').replace(/<ce>/g, '').replace(/\s+/g, ' ').trim() : '';
  const c1 = lines.findIndex((l) => /^Message:\s+1901\b/.test(l));
  console.log(`${gives.every((g) => g === 'nothing') ? '!!' : '  '} ${name}: keep gives [${gives.join(', ')}]`);
  if (gives.every((g) => g === 'nothing')) console.log(`      asks: "${ask.slice(0, 150)}"  keep: "${(lines[c1 + 1] ?? '').trim()}"`);
}
