#!/usr/bin/env node
// QL5-QL10: ONE FAMILY'S SHEETS AND BRANCHES, CHECKED - what test/systems/questlines/ql1_sheets.test.js holds, for one
// family alone, so a wave's writer reads only their own quests' problems: each sheet against its script (as the game
// reads it, the branch patched in), each quest of the family that has no sheet, each flagship quest of it with no branch
// or with outcomes that pay alike, and each of its branch patches - applies, words from QL_MESSAGE_BASE, tasks `_ql..._`.
//
//   node tools/qlCheck.mjs <Family>        problems, one a line; exit 1 if any
import { isMain } from './lib/isMain.mjs';
import { SHEETS, SHEET_FAMILIES } from '../src/systems/questlines/qlSheets.js';
import { sheetProblems } from './qlSheetLaw.mjs';
import { LIST_GROUP_FAMILY, UNLISTED_FAMILY } from '../src/systems/questlines/qlFamilies.js';
import { lineQuestNames } from '../src/systems/questlines/qlLines.js';
import { QL_PATCH_FAMILIES, QL_MESSAGE_BASE } from '../src/systems/questlines/qlPatches.js';
import { QUEST_FILES, packMachine, parsedQuest, questSource, baseText, classicRows } from '../test/qlSources.mjs';

export function familyQuests(family) {
  const out = new Set();
  for (const r of classicRows()) if (LIST_GROUP_FAMILY[r.group] === family) out.add(r.name.toUpperCase());
  if (family === 'FightersGuild') out.add('CUSTOM01');
  for (const n of UNLISTED_FAMILY[family] ?? []) out.add(n);
  if (family === 'Questlines') for (const n of lineQuestNames()) out.add(n);
  for (const f of QUEST_FILES.values()) {
    if (family === 'MainQuest' && f.dir === 'dfu' && (/^S0000/i.test(f.name) || f.name.toUpperCase() === '_BRISIEN')) out.add(f.name.toUpperCase());
    if (family === 'Mods' && (f.dir === 'roleplay-realism' || (f.dir === 'foraging' && /^FetchWood/i.test(f.name)))) out.add(f.name.toUpperCase());
  }
  return out;
}

export function flagshipOf(family) {
  const set = new Set();
  for (const r of classicRows()) {
    if (LIST_GROUP_FAMILY[r.group] !== family) continue;
    const text = baseText(r.name) ?? '';
    const qbn = text.slice(Math.max(0, text.search(/^\s*QBN:/im)));
    if (/^\s*prompt /im.test(qbn) || (r.minReq >= 4 && r.minReq < 10) || r.flag === '1') set.add(r.name.toUpperCase());
  }
  return set;
}

export function checkFamily(family) {
  const out = [];
  const file = SHEET_FAMILIES.find((f) => f.family === family);
  if (!file) return [`${family}: no such family`];
  const machine = packMachine();
  for (const sheet of file.sheets) {
    const parsed = parsedQuest(sheet.quest, machine);
    if (!parsed) { out.push(`${sheet.quest}: the pack holds no such quest`); continue; }
    out.push(...sheetProblems(sheet, parsed));
  }
  const want = familyQuests(family);
  for (const n of [...want].sort()) if (!SHEETS.has(n)) out.push(`${n}: no sheet yet`);
  for (const s of file.sheets) if (!want.has(String(s.quest).toUpperCase())) out.push(`${s.quest}: not a ${family} quest`);
  for (const n of [...flagshipOf(family)].sort()) {
    const sheet = SHEETS.get(n);
    if (!sheet) continue;
    if (!(sheet.branches ?? []).length) out.push(`${n}: flagship, no branch`);
    const ends = (sheet.outcomes ?? []).filter((o) => !o.failure);
    if (ends.length < 2) out.push(`${n}: flagship, one outcome`);
    else if (new Set(ends.map((o) => JSON.stringify([o.pay, o.standing ?? {}, o.legal ?? 0]))).size < 2) out.push(`${n}: flagship, its outcomes pay alike`);
  }
  const fam = QL_PATCH_FAMILIES.find((f) => f.family === family);
  for (const [name, patches] of Object.entries(fam?.patches ?? {})) {
    const base = baseText(name);
    if (base == null) { out.push(`${name}: patched, but the pack holds no such quest`); continue; }
    if (!flagshipOf(family).has(name.toUpperCase())) out.push(`${name}: patched, but no flagship quest`);
    const on = questSource(name, true);
    if (on.join('\n') === base.split(/\r?\n/).join('\n')) out.push(`${name}: the patch did not apply (see the warning above)`);
    for (const p of patches) {
      for (const m of p.new.matchAll(/Message:\s+(\d+)/g)) if (!p.old.includes(m[0]) && Number(m[1]) < QL_MESSAGE_BASE) out.push(`${name}: a new message ${m[1]} below ${QL_MESSAGE_BASE}`);
      for (const m of p.new.matchAll(/(?:^|\s)(_[a-zA-Z0-9.]+_)\s+task:/gm)) if (!p.old.includes(m[1]) && !/^_ql/.test(m[1])) out.push(`${name}: a new task ${m[1]} not named _ql..._`);
    }
    const parsed = parsedQuest(name, machine);
    const shipped = parsedQuest(name, machine, false);
    if (!parsed) { out.push(`${name}: does not parse patched`); continue; }
    const before = new Set([...shipped.quest.tasks.values()].flatMap((t) => t.pendingActionLines.map((l) => l.trim())));
    for (const t of parsed.quest.tasks.values()) for (const l of t.pendingActionLines) if (l.trim() && !before.has(l.trim())) out.push(`${name}: the patch says a line no template claims - "${l.trim()}"`);
  }
  return out;
}

if (isMain(import.meta.url)) {
  const family = process.argv[2];
  if (!family) { console.error('usage: node tools/qlCheck.mjs <Family>'); process.exit(1); }
  const problems = checkFamily(family);
  console.log(problems.length ? problems.join('\n') : `${family}: clean (${SHEET_FAMILIES.find((f) => f.family === family)?.sheets.length ?? 0} sheets, ${flagshipOf(family).size} flagship)`);
  process.exit(problems.length ? 1 : 0);
}
