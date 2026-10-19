// FIX-PATCH: small, exact edits to the questlines' patch and sheet files - each found exactly once, written back in the
// files' one form (tools/qlFormat.mjs formatFamily).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { formatFamily } from '/home/user/daggerfall-js-source/tools/qlFormat.mjs';
import { wrapRows } from '/home/user/daggerfall-js-source/tools/qlPatchKit.mjs';
const QL = '/home/user/daggerfall-js-source/src/systems/questlines';
const files = new Map();
export function fam(dir, file) {
  const p = join(QL, dir, file);
  if (!files.has(p)) files.set(p, { p, dir, data: JSON.parse(readFileSync(p, 'utf8')) });
  return files.get(p).data;
}
export function saveAll() {
  for (const { p, dir, data } of files.values()) writeFileSync(p, formatFamily(data, dir));
}
const count = (h, n) => h.split(n).length - 1;
/** Replace `old` (found exactly once across the quest's patches' `new`) with `nu`. */
export function rep(file, quest, old, nu) {
  const list = fam('patches', file).patches[quest];
  const hits = list.filter((p) => p.new.includes(old));
  const n = list.reduce((k, p) => k + count(p.new, old), 0);
  if (n !== 1) throw new Error(`${quest}: "${old}" found ${n} times`);
  hits[0].new = hits[0].new.replace(old, nu);
}
/** Replace a patch's `old` text field too (patch index i). */
export function setPatch(file, quest, i, patch) { fam('patches', file).patches[quest][i] = patch; }
const block = (id, text, centred) => `Message:  ${id}\n${(centred ? wrapRows(text).map((l) => `<ce> ${l}`) : [text.trim()]).join('\n')}\n`;
/** A message's words, whole. */
export function msg(file, quest, id, text, centred) {
  const list = fam('patches', file).patches[quest];
  const re = new RegExp(`Message:  ${id}\\n(?:[^\\n]+\\n)*`);
  const hits = list.filter((p) => re.test(p.new));
  if (hits.length !== 1) throw new Error(`${quest}: message ${id} in ${hits.length} patches`);
  hits[0].new = hits[0].new.replace(re, block(id, text, centred));
}
/** A new message, before QBN:. */
export function addMsg(file, quest, id, text, centred = true) {
  const list = fam('patches', file).patches[quest];
  const hits = list.filter((p) => p.new.includes('\nQBN:'));
  if (hits.length !== 1 || list.some((p) => p.new.includes(`Message:  ${id}\n`))) throw new Error(`${quest}: cannot add ${id}`);
  hits[0].new = hits[0].new.replace('\nQBN:', `\n${block(id, text, centred)}\nQBN:`);
}
/** One sheet, by quest. */
export function sheet(file, quest) {
  const s = fam('sheets', file).sheets.find((x) => x.quest === quest);
  if (!s) throw new Error(`no sheet ${quest} in ${file}`);
  return s;
}
export const outcome = (s, id) => { const o = s.outcomes.find((x) => x.id === id); if (!o) throw new Error(`${s.quest}: no outcome ${id}`); return o; };
/** Set the sheet's `success`, placed before its outcomes (key order is the file's reading order). */
export function setSuccess(s, id) {
  outcome(s, id);
  const entries = Object.entries(s).filter(([k]) => k !== 'success');
  for (const k of Object.keys(s)) delete s[k];
  for (const [k, v] of entries) { if (k === 'outcomes') s.success = id; s[k] = v; }
}
