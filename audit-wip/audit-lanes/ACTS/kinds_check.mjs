const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
import { readFileSync, readdirSync } from 'node:fs';
const { ACT_IDS } = await import(`${SNAP}/src/systems/questlines/qlActs.js`);
const dir = `${SNAP}/src/systems/questlines/quests`;
const waited = new Map();
for (const f of readdirSync(dir)) for (const m of readFileSync(`${dir}/${f}`, 'utf8').matchAll(/^\s*ql act ([a-z0-9-]+) (\d+)\s*$/gm)) { if (!waited.has(m[1])) waited.set(m[1], []); waited.get(m[1]).push(`${f.replace('.txt','')}:${m[2]}`); }
const sheets = JSON.parse(readFileSync(`${SNAP}/src/systems/questlines/sheets/questlines.json`, 'utf8'));
const bound = new Set(JSON.stringify(sheets).match(/"act":"[a-z-]+"/g).map((s) => s.slice(7, -1)));
console.log('kinds declared:', ACT_IDS.length, ' kinds a script waits on:', waited.size);
console.log('declared, no script waits:', ACT_IDS.filter((k) => !waited.has(k)));
console.log('waited, not declared:', [...waited.keys()].filter((k) => !ACT_IDS.includes(k)));
console.log('sheet act bindings not declared:', [...bound].filter((k) => !ACT_IDS.includes(k)));
for (const [k, v] of waited) console.log(' ', k.padEnd(16), v.join(' '));
