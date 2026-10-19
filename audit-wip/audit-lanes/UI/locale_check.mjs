// The branch's Port_Strings keys, in the 13 required languages: present, not English, placeholders kept, length.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const LANE = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/UI';
const { parseStringTableCsv } = await import(`${SNAP}/src/systems/textManager.js`);
const LANGS = ['bg', 'cs', 'da', 'de', 'es', 'fr', 'id', 'it', 'ko', 'nb', 'pt-BR', 'ro', 'ru'];
const diff = execSync(`git -C ${SNAP} diff origin/main...HEAD -- locales/en/Port_Strings.csv`, { encoding: 'utf8' });
const added = parseStringTableCsv(diff.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1)).join('\n'));
const keys = added.map(([k]) => k);
const en = new Map(added);
console.log('keys added:', keys.length);
const ph = (s) => [...String(s).matchAll(/\{[^{}]+\}/g)].map((m) => m[0]).sort().join(' ');
const out = {};
const problems = [];
for (const lang of LANGS) {
  const rows = new Map(parseStringTableCsv(readFileSync(`${SNAP}/locales/${lang}/Port_Strings.csv`, 'utf8')));
  const meta = JSON.parse(readFileSync(`${SNAP}/locales/${lang}/Port_Strings.meta.json`, 'utf8'));
  out[lang] = {};
  for (const k of keys) {
    const v = rows.get(k);
    out[lang][k] = v;
    if (v == null) { problems.push(`${lang} MISSING ${k}`); continue; }
    if (v === en.get(k) && !/^ql\.journal\.(lineSteps)$/.test(k)) problems.push(`${lang} SAME-AS-EN ${k} = ${v}`);
    if (ph(v) !== ph(en.get(k))) problems.push(`${lang} PLACEHOLDERS ${k}: en[${ph(en.get(k))}] vs [${ph(v)}] :: ${v}`);
    const r = v.length / en.get(k).length;
    if (r > 1.6 && en.get(k).length > 6) problems.push(`${lang} LONG x${r.toFixed(2)} ${k}: ${v}`);
    if (/[A-Za-z]{4,}/.test(v) && ['bg', 'ru', 'ko'].includes(lang)) {
      const latin = v.match(/[A-Za-z][A-Za-z'’-]{3,}/g);
      problems.push(`${lang} LATIN-IN ${k}: ${latin.join(',')} :: ${v}`);
    }
    if (!meta[k]) problems.push(`${lang} NO-META ${k}`);
  }
}
writeFileSync(`${LANE}/locale_table.json`, JSON.stringify({ en: Object.fromEntries(en), ...out }, null, 1));
console.log(problems.join('\n') || 'no mechanical problems');
