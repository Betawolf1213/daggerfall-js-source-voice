// The proper names the questlines' strings use, as each locale ALREADY says them elsewhere (keys outside the branch),
// so the branch's words can be read against the locale's own glossary.
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const { parseStringTableCsv } = await import(`${SNAP}/src/systems/textManager.js`);
const diff = execSync(`git -C ${SNAP} diff origin/main...HEAD -- locales/en/Port_Strings.csv`, { encoding: 'utf8' });
const added = new Set(parseStringTableCsv(diff.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1)).join('\n')).map(([k]) => k));
const en = new Map(parseStringTableCsv(readFileSync(`${SNAP}/locales/en/Port_Strings.csv`, 'utf8')));
const TERMS = (process.argv[3] ?? "King’s Gambit|King's Gambit;Weir Key;Battlespire;Dagon’s Breach|Dagon's Breach;Abyss Dungeon;Firmament;Quests tab").split(';');
const lang = process.argv[2];
const tr = new Map(parseStringTableCsv(readFileSync(`${SNAP}/locales/${lang}/Port_Strings.csv`, 'utf8')));
for (const term of TERMS) {
  const re = new RegExp(term, 'i');
  const hits = [...en].filter(([k, v]) => !added.has(k) && re.test(v) && v.length < 90).slice(0, 4);
  console.log(`-- ${term}`);
  for (const [k, v] of hits) console.log(`   ${k}: ${v}  =>  ${tr.get(k)}`);
}
