// QL1/QL5-QL10 (bible/06-Systems/Questlines-Arc.md sections 2.5 and 3): THE SHEETS AND THE BRANCHES, HELD TO THEIR
// SCRIPTS. Every sheet is checked against the quest it names, parsed as the game reads it (test/qlSources.mjs, the pack
// loader's node twin): a binding of a kind the law reads, a task, item, clock or foe the script holds, a step it logs, a
// choice task something in it can set (tools/qlSheetLaw.mjs sheetProblems). And the sets are exact: every quest a player can be
// given has one sheet, in its family's file; every flagship quest (the rule, section 3) has a branch; every branch patch
// applies, numbers its words from QL_MESSAGE_BASE and names its tasks `_ql..._`, and reads as DFU's with the switch off.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { SHEETS, SHEET_FAMILIES } from '../../../src/systems/questlines/qlSheets.js';
import { sheetProblems } from '../../../tools/qlSheetLaw.mjs';
import { QL_FAMILY_NAMES, LIST_GROUP_FAMILY, UNLISTED_FAMILY } from '../../../src/systems/questlines/qlFamilies.js';
import { lineQuestNames } from '../../../src/systems/questlines/qlLines.js';
import { QL_PATCHES, QL_MESSAGE_BASE } from '../../../src/systems/questlines/qlPatches.js';
import { QUEST_FILES, packMachine, parsedQuest, questSource, baseText, classicRows } from '../../qlSources.mjs';

/** The quests the pack holds that no one gives - each named, with why it has no sheet. */
const EXCLUDED = Object.freeze({
  // DFU's own: not offered
  ...Object.fromEntries([...QUEST_FILES.values()].filter((f) => /^__DEMO/i.test(f.name)).map((f) => [f.name.toUpperCase(), 'a DFU demo script, offered by nothing'])),
  _TUTOR__: 'DFU\'s tutorial, retired by TUT1 (questBridge.js RETIRED_TUTORIAL_QUEST)',
  K0C00Y06: 'disabled in QuestList-Classic.txt (its `-` row)',
  R0C11Y27: 'a duplicate of R0C10Y17 (its `-` row)',
  // the mods' mechanics
  ...Object.fromEntries([...QUEST_FILES.values()].filter((f) => f.dir === 'foraging' && !/^FetchWood/i.test(f.name)).map((f) => [f.name.toUpperCase(), 'a Foraging tool\'s bonus roll - no journal entry, nothing paid, no one gives it'])),
  ...Object.fromEntries([...QUEST_FILES.values()].filter((f) => f.dir === 'warm-ashes-ships').map((f) => [f.name.toUpperCase(), 'the sea\'s own event (warmAshesShips.js), run by the world - no journal entry'])),
});

/** Every quest a player can be given, by family. */
function reachable() {
  const fam = new Map();
  const add = (name, family) => fam.set(name.toUpperCase(), family);
  for (const r of classicRows()) add(r.name, LIST_GROUP_FAMILY[r.group]);
  add('CUSTOM01', 'FightersGuild');   // QuestList-DFU.txt's one row: FightersGuild
  for (const [family, names] of Object.entries(UNLISTED_FAMILY)) for (const n of names) add(n, family);
  for (const f of QUEST_FILES.values()) {
    if (f.dir === 'dfu' && (/^S0000/i.test(f.name) || f.name.toUpperCase() === '_BRISIEN')) add(f.name, 'MainQuest');
    if (f.dir === 'roleplay-realism' || (f.dir === 'foraging' && /^FetchWood/i.test(f.name))) add(f.name, 'Mods');
  }
  for (const n of lineQuestNames()) add(n, 'Questlines');   // QL12-QL16: each line's steps, started by its runner
  return fam;
}

/** The flagship rule (section 3): a listed quest that asks a `prompt`, one offered at rank 4 or above, a one-time one. */
function flagship() {
  const set = new Set();
  for (const r of classicRows()) {
    const text = baseText(r.name) ?? '';
    const qbn = text.slice(Math.max(0, text.search(/^\s*QBN:/im)));
    if (/^\s*prompt /im.test(qbn) || (r.minReq >= 4 && r.minReq < 10) || r.flag === '1') set.add(r.name.toUpperCase());
  }
  return set;
}

test('QL1 the families: one file of sheets each, in qlFamilies.js\'s order, and every sheet in its own family\'s file', () => {
  assert.deepEqual(SHEET_FAMILIES.map((f) => f.family), [...QL_FAMILY_NAMES]);
  const fam = reachable();
  const wrong = [];
  for (const f of SHEET_FAMILIES) {
    for (const s of f.sheets) {
      const want = fam.get(String(s.quest).toUpperCase());
      if (want && want !== f.family) wrong.push(`${s.quest} is ${want}'s, filed in ${f.family}`);
    }
  }
  assert.deepEqual(wrong, []);
  const twice = [];
  const seen = new Set();
  for (const f of SHEET_FAMILIES) for (const s of f.sheets) { const k = String(s.quest).toUpperCase(); if (seen.has(k)) twice.push(s.quest); seen.add(k); }
  assert.deepEqual(twice, [], 'one sheet a quest');
});

for (const family of QL_FAMILY_NAMES) {
  test(`QL1 the ${family} sheets: each names only what its script has - every binding, mark and choice`, () => {
    const machine = packMachine();
    const file = SHEET_FAMILIES.find((f) => f.family === family);
    const problems = [];
    for (const sheet of file.sheets) {
      const parsed = parsedQuest(sheet.quest, machine);
      if (!parsed) { problems.push(`${sheet.quest}: the pack holds no such quest`); continue; }
      problems.push(...sheetProblems(sheet, parsed));
    }
    assert.deepEqual(problems, []);
  });
}

test('QL1 the set is exact: every quest a player can be given has its sheet, and nothing else has one', () => {
  const fam = reachable();
  for (const name of fam.keys()) assert.ok(QUEST_FILES.has(name), `${name}: a quest the lists offer that the pack does not hold`);
  const missing = [...fam.keys()].filter((n) => !SHEETS.has(n)).sort();
  const extra = [...SHEETS.keys()].filter((n) => !fam.has(n)).sort();
  assert.deepEqual(extra, [], 'a sheet for a quest no one gives');
  assert.deepEqual(missing, [], `${missing.length} of ${fam.size} quests have no sheet yet`);
  // every quest the pack holds is either given or named here with why not
  const unaccounted = [...QUEST_FILES.values()].filter((f) => f.dir !== 'questlines' && !fam.has(f.name.toUpperCase()) && !EXCLUDED[f.name.toUpperCase()]).map((f) => f.name);
  assert.deepEqual(unaccounted, []);
  assert.equal([...fam.values()].filter((f) => f !== 'Questlines').length, 248, 'the scope (Questlines-Arc.md decision 3)');
  assert.equal([...fam.values()].filter((f) => f === 'Questlines').length, lineQuestNames().length, 'and the questlines\' own, every step of every line');
});

test('QL1 the flagship set is the rule\'s 66, and each has a branch whose choices end it differently', () => {
  const set = flagship();
  assert.equal(set.size, 66, 'the rule, read off the list and the scripts');
  const thin = [];
  for (const name of [...set].sort()) {
    const sheet = SHEETS.get(name);
    if (!sheet) { thin.push(`${name}: no sheet`); continue; }
    if (!(sheet.branches ?? []).length) thin.push(`${name}: no branch`);
    const outcomes = (sheet.outcomes ?? []).filter((o) => !o.failure);
    if (outcomes.length < 2) thin.push(`${name}: one outcome - a branch that ends it the same way is no branch`);
    else if (new Set(outcomes.map((o) => JSON.stringify([o.pay, o.standing ?? {}, o.legal ?? 0]))).size < 2) thin.push(`${name}: its outcomes pay alike`);
  }
  assert.deepEqual(thin, []);
});

test('QL4 the branch patches: each a flagship quest\'s, each applies, its words numbered from QL_MESSAGE_BASE, its tasks `_ql..._`, every line claimed - and the switch off reads DFU\'s script', () => {
  const set = flagship();
  const machine = packMachine();
  const problems = [];
  for (const [name, patches] of QL_PATCHES) {
    if (!set.has(name)) problems.push(`${name}: patched, but no flagship quest`);
    const base = baseText(name);
    if (base == null) { problems.push(`${name}: the pack holds no such quest`); continue; }
    const on = questSource(name, true), off = questSource(name, false);
    if (off.join('\n') !== base.split(/\r?\n/).join('\n')) problems.push(`${name}: the switch off does not read the script as shipped`);
    if (on.join('\n') === off.join('\n')) { problems.push(`${name}: a patch that changes nothing (or did not apply)`); continue; }
    for (const p of patches) {
      for (const m of p.new.matchAll(/Message:\s+(\d+)/g)) if (!p.old.includes(m[0]) && Number(m[1]) < QL_MESSAGE_BASE) problems.push(`${name}: a new message ${m[1]} below ${QL_MESSAGE_BASE}`);
      for (const m of p.new.matchAll(/(?:^|\s)(_[a-zA-Z0-9.]+_)\s+task:/gm)) if (!p.old.includes(m[1]) && !/^_ql/.test(m[1])) problems.push(`${name}: a new task ${m[1]} not named _ql..._`);
    }
    const parsed = parsedQuest(name, machine);
    if (!parsed) { problems.push(`${name}: does not parse patched`); continue; }
    const pending = [...parsed.quest.tasks.values()].flatMap((t) => t.pendingActionLines.map((l) => l.trim())).filter(Boolean);
    const shipped = parsedQuest(name, machine, false);
    const before = new Set([...shipped.quest.tasks.values()].flatMap((t) => t.pendingActionLines.map((l) => l.trim())));
    for (const l of pending) if (!before.has(l)) problems.push(`${name}: the patch says a line no template claims - "${l}"`);
  }
  assert.deepEqual(problems, []);
});
