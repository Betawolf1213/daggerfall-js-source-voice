#!/usr/bin/env node
// QL4 (bible/06-Systems/Questlines-Arc.md section 2.3): THE HAND-IN BRANCH, MADE EXACT. A flagship quest whose story
// holds no decision of its own is given one where its reward is handed over: the questor asks how the player will be
// paid, and the two answers end it differently (the sheet's outcomes - its own pay, standing, legal). The kit reads the
// reward task's text exactly as the game reads the script (the port's patches first - test/qlSources.mjs baseText) and
// writes the three patches (systems/questlines/qlPatches.js), each checked to occur exactly once before it is written:
//
//   1. the reward task waits for the first answer - its trigger line becomes `when _qlkeep_`;
//   2. the question and the two answers, messages QL_MESSAGE_BASE.. before `QBN:`;
//   3. at the script's end: `_qlask_` asks when the reward task's own condition holds; `_qlkeep_` and `_qlalt_` are the
//      answers; `_qlaltpath_` is the second answer's ending - `ql paid` (the quest a success and its outcome's gear
//      waiting, without the QuestComplete box `give pc nothing` raises: that box is the script's words for the reward
//      the player just turned down) and the reward task's own lines that end the quest, without its gold or comments.
//
//   node tools/qlPatchKit.mjs handin <QUEST> <_rewardTask_> --ask "<question>" --keep "<answer 1>" --alt "<answer 2>"
//       [--family <Name>] [--write]      print the patches (and, --write, merge them into patches/<family>.json)
//
// A reward task whose trigger is not one `when` line is refused - that quest's branch is written by hand.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMain } from './lib/isMain.mjs';
import { baseText, ROOT } from '../test/qlSources.mjs';
import { QL_MESSAGE_BASE } from '../src/systems/questlines/qlPatches.js';
import { formatFamily } from './qlFormat.mjs';

const count = (hay, needle) => hay.split(needle).length - 1;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The message lines of one answer or question: DFU's own form (`<ce>` centred for a spoken question). */
const messageBlock = (id, text, centred) => [`Message:  ${id}`, ...String(text).split('\n').map((l) => (centred ? `<ce> ${l}` : l)), ''].join('\n');

/**
 * The hand-in patches for `quest`'s reward task `task` - `[{ old, new, count }]` - or throws with why not.
 * @param {string} quest @param {string} task @param {{ ask: string, keep: string, alt: string }} words
 */
export function handinPatches(quest, task, { ask, keep, alt }) {
  const text = (baseText(quest) ?? '').replace(/\r\n?/g, '\n');
  if (!text) throw new Error(`${quest}: the pack holds no such quest`);
  if (!ask || !keep || !alt) throw new Error('--ask, --keep and --alt are each required');
  const head = new RegExp(`(^|\\n)(${esc(task)} task:[^\\n]*\\n)([^\\n]*\\bwhen\\b[^\\n]*)\\n`);
  const m = head.exec(text);
  if (!m) throw new Error(`${quest}: no "${task} task:" whose first line is a "when" - write this branch by hand`);
  const header = m[2], whenLine = m[3];
  const cond = whenLine.replace(/^\s*when\s+/, '').trimEnd();
  // the task's body after its trigger, up to the next task header or blank line
  const start = m.index + m[0].length;
  const rest = text.slice(start);
  const stop = rest.search(/\n\s*\n|\n(?=_[A-Za-z0-9.]+_ task:)|\n(?=variable )|\n(?=until )/);
  const body = (stop < 0 ? rest : rest.slice(0, stop)).split('\n').map((l) => l.trim()).filter(Boolean);
  if (body.some((l) => /^(when|clicked|killed|toting|pc at|injured|daily)\b/i.test(l))) throw new Error(`${quest}: ${task} has more than one trigger - write this branch by hand`);
  const ending = body.filter((l) => !/^give pc\b/i.test(l) && !/^--/.test(l));
  if (!body.some((l) => /^give pc\b/i.test(l))) throw new Error(`${quest}: ${task} gives nothing - no hand-in to branch`);
  if (/_ql[a-z]/i.test(text)) throw new Error(`${quest}: already carries a questlines branch`);
  const [q, a, b] = [QL_MESSAGE_BASE, QL_MESSAGE_BASE + 1, QL_MESSAGE_BASE + 2];
  // 1. the reward task waits for the first answer
  const p1 = { old: `${header}${whenLine}\n`, new: `${header}\twhen _qlkeep_\n`, count: 1 };
  // 2. the words, before QBN:
  if (count(text, '\nQBN:') !== 1) throw new Error(`${quest}: "QBN:" is not on one line alone`);
  const words = [messageBlock(q, ask, true), messageBlock(a, keep, false), messageBlock(b, alt, false)].join('\n');
  const p2 = { old: '\nQBN:', new: `\n${words}\nQBN:`, count: 1 };
  // 3. the tasks, at the end - anchored on the script's last two lines
  const trimmed = text.replace(/\s+$/, '');
  const tailLines = trimmed.split('\n').slice(-2).join('\n');
  if (count(text, tailLines) !== 1) throw new Error(`${quest}: its last two lines are not unique - write this branch by hand`);
  const tasks = [
    '', '', '_qlask_ task:', `\twhen ${cond}`, `\task ${q} choices ${a} _qlkeep_ ${b} _qlalt_`,
    '', 'variable _qlkeep_', 'variable _qlalt_',
    '', '_qlaltpath_ task:', '\twhen _qlalt_', '\tql paid', ...ending.map((l) => `\t${l}`),
  ].join('\n');
  const p3 = { old: tailLines, new: `${tailLines}${tasks}`, count: 1 };
  return [p1, p2, p3];
}

/** Merge `patches` for `quest` into `family`'s file (one quest's patches replace any it had). */
export function writePatches(family, quest, patches) {
  const file = join(ROOT, 'src/systems/questlines/patches', `${family[0].toLowerCase()}${family.slice(1)}.json`);
  const data = JSON.parse(readFileSync(file, 'utf8'));
  if (data.family !== family) throw new Error(`${file} is ${data.family}'s`);
  data.patches[quest] = patches;
  writeFileSync(file, formatFamily(data, 'patches'));
  return file;
}

if (isMain(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (k) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : undefined; };
  if (args[0] !== 'handin' || !args[1] || !args[2]) {
    console.error('usage: node tools/qlPatchKit.mjs handin <QUEST> <_rewardTask_> --ask "..." --keep "..." --alt "..." [--family <Name>] [--write]');
    process.exit(1);
  }
  const patches = handinPatches(args[1], args[2], { ask: opt('ask'), keep: opt('keep'), alt: opt('alt') });
  if (args.includes('--write')) {
    const fam = opt('family');
    if (!fam) { console.error('--write needs --family'); process.exit(1); }
    console.log(`written: ${writePatches(fam, args[1], patches)}`);
  } else console.log(JSON.stringify({ [args[1]]: patches }, null, 2));
  console.log(`sheet: branches [{ "id": "payment", "text": <the question>, "choices": [{ "id": "keep", "text": <answer 1>, "sets": "_qlkeep_" }, { "id": "alt", "text": <answer 2>, "sets": "_qlalt_" }] }]`);
  console.log('       outcomes bound { "task": "_qlkeep_" } and { "task": "_qlalt_" }, each with its own pay or standing, before the failure.');
}
