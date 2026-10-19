// The sheet text edits of fixer SCRIPTS, applied to the LIVE family file under the writers' lock: re-read right before
// the write, each edit a path to one field (never a `named`), each checked against the text it replaces.
//   node sheet_edit.mjs [--dry]
import { readFileSync, writeFileSync, mkdirSync, rmdirSync } from 'node:fs';
import { formatFamily } from '/home/user/daggerfall-js-source/tools/qlFormat.mjs';
const FILE = '/home/user/daggerfall-js-source/src/systems/questlines/sheets/questlines.json';
const LOCK = '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/ql-sheets.lock';
const dry = process.argv.includes('--dry');
// [quest, list, id, field, old, new] - list: objectives | outcomes | branches | choice:<branch id>
const EDITS = [
  ['QLCH03', 'branches', 'key', 'text', 'Keep the Weir Key, or let the Order of the Hour seal it away?', 'Keep the Weir Key - the Guild gives a house one - or let the Order of the Hour seal it away?'],
  ['QLCH03', 'outcomes', 'keep', 'text', "You kept the Weir Key. Its road leads to the Battlespire's torn halls, whenever you are ready to turn it.", "You kept the Weir Key for your house - a house has it once - and took the Guild's fee. Its road leads to the Spire's torn halls."],
  ['QLIW02', 'objectives', 'kneel', 'text', 'Beat a revenant until it kneels', 'See one of your revenants brought to its knees'],
  ['QLIW02', 'objectives', 'word', 'text', 'Wait in a town for word from _captain_', 'Be in a town by day: word from the watch will find you there'],
  ['QLIW02', 'objectives', 'word', 'done', { task: '_heard_' }, { task: '_paid_' }],
  ['QLIW02', 'outcomes', 'done', 'on', { task: '_heard_' }, { task: '_paid_' }],
  ['QLIW02', 'outcomes', 'failed', 'text', 'No word came from _captain_ again.', 'The watch stopped waiting to hear of a revenant brought to its knees.'],
  ['QLWR04', 'outcomes', 'truth', 'text', 'Corvane wrote the whole truth of 3E 398 for the Empire, and dated the page 3E 406 at last.', 'Corvane wrote the whole truth of 3E 398 for the Empire, and dated the page today at last.'],
  ['QLBD05', 'choice:embers', 'order', 'text', 'To the Order of the Hour, keepers of the Covenant', "To the Order of the Hour, Akatosh's own"],
  ['QLBD05', 'outcomes', 'order', 'text', "The embers went to the Order of the Hour, to lie quiet in Akatosh's vaults beside the Covenant they defy.", "The embers went to the Order of the Hour, to lie quiet in the vaults of Akatosh's priests."],
];
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
for (let i = 0; ; i++) { try { mkdirSync(LOCK); break; } catch { if (i > 200) throw new Error('lock held too long'); sleep(50); } }
try {
  const raw = readFileSync(FILE, 'utf8');
  const data = JSON.parse(raw);
  if (formatFamily(data, 'sheets') !== raw) console.log('note: the file is not in formatFamily form as read');
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  let changed = 0;
  for (const [quest, list, id, field, from, to] of EDITS) {
    if (field === 'named') throw new Error('never a named');
    const sheet = data.sheets.find((s) => s.quest === quest);
    const rows = list.startsWith('choice:') ? sheet.branches.find((b) => b.id === list.slice(7)).choices : sheet[list];
    const row = rows.find((r) => r.id === id);
    if (same(row[field], to)) { console.log(`already: ${quest} ${list} ${id}.${field}`); continue; }
    if (!same(row[field], from)) throw new Error(`${quest} ${list} ${id}.${field} is ${JSON.stringify(row[field])}, not the text it replaces`);
    if (typeof to === 'string' && to.length > 160) throw new Error(`${quest} ${id}: ${to.length} chars`);
    row[field] = to; changed++;
  }
  if (!dry && changed) writeFileSync(FILE, formatFamily(data, 'sheets'));
  console.log(dry ? `dry: ${changed} would change` : `wrote ${changed}`);
} finally { rmdirSync(LOCK); }
