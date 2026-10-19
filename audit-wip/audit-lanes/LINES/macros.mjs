// Every macro in every questline script's QRC text and every sheet text, against the resources its QBN declares:
// `_x_` (Place: building, Person: name, Foe: type, Item: name), `__x_` (Place: town, Person: building), `___x_` (Person:
// town, Place: town), `=x_` (Foe: its name, Person: a caption, Clock: days); a symbol no resource declares expands to
// nothing in a player's box.
import { readFileSync, readdirSync } from 'node:fs';
const SNAP = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-audit';
const dir = SNAP + '/src/systems/questlines/quests/';
const sheets = JSON.parse(readFileSync(SNAP + '/src/systems/questlines/sheets/questlines.json', 'utf8')).sheets;
const problems = [];
for (const f of readdirSync(dir).sort()) {
  const text = readFileSync(dir + f, 'utf8');
  const name = f.replace('.txt', '');
  const at = text.search(/^QBN:/m);
  const qbn = text.slice(at);
  const kinds = {};
  for (const m of qbn.matchAll(/^\s*(Item|Person|Place|Foe|Clock)\s+_([a-zA-Z0-9.]+)_/gm)) kinds[m[2]] = m[1];
  const qrcBody = text.slice(0, at).split(/\r?\n/).filter((l) => !/^\s*--/.test(l)).join('\n');
  const sheet = sheets.find((s) => s.quest === name);
  const sheetTexts = JSON.stringify(sheet ?? {}).match(/"text":"[^"]*"/g) ?? [];
  for (const [where, body] of [['qrc', qrcBody], ['sheet', sheetTexts.join('\n')]]) {
    for (const m of body.matchAll(/(^|[^A-Za-z0-9_=])(=|_{1,4})([A-Za-z][A-Za-z0-9.]*)_(?![A-Za-z0-9])/g)) {
      const pre = m[2], sym = m[3];
      const k = kinds[sym];
      if (!k) { problems.push(`${name} ${where}: ${pre}${sym}_ - no resource`); continue; }
      const ok = pre === '_' ? true
        : pre === '__' ? (k === 'Place' || k === 'Person')
        : pre === '___' ? (k === 'Place' || k === 'Person')
        : pre === '=' ? (k === 'Foe' || k === 'Clock' || k === 'Person' || k === 'Item') : false;
      if (!ok) problems.push(`${name} ${where}: ${pre}${sym}_ on a ${k}`);
      if (pre === '__' && k === 'Person') problems.push(`${name} ${where}: __${sym}_ is the PERSON's building (NameMacro2), not a town`);
    }
  }
  // a person or place macro in a message a person is never placed for
}
console.log(problems.length ? problems.join('\n') : 'every macro names a resource of a kind that answers it');
