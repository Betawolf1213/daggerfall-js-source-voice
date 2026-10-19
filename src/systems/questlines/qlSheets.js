// @ts-check
// QL1 (bible/06-Systems/Questlines-Arc.md section 2.2): THE OBJECTIVE SHEETS - one a quest, data the port writes, filed
// by family (sheets/<family>.json), and the law that checks a sheet against the shape and against its own script.
//
// A SHEET NAMES ONLY WHAT ITS SCRIPT HAS (section 2.5). sheetProblems answers every way a sheet can lie: a binding of a
// kind the law does not read, a task, item, clock or foe the parsed quest does not hold, a journal step its script never
// writes, a choice task nothing in the script can set, an outcome that names a pay the rewards do not know. The pins
// (test/systems/questlines/ql1_sheets.test.js) run it over every sheet and its quest, so a sheet that would show a player
// a line the machine cannot honour fails where it is written.
//
// The sheets are quest text (decision 3: Daggerfall's words stay, the port's are added): their lines are English and
// read in a translation's words where a pack carries them (qlText's table, Internal_Questlines), as DFU's own quest
// messages read their -LOC files - not the Port_Strings catalog, which is the port's interface.
import { BINDING_KINDS, bindingSymbols, symName } from './qlLaw.js';
import { QL_FAMILY_NAMES } from './qlFamilies.js';
import FIGHTERS_GUILD from './sheets/fightersGuild.json' with { type: 'json' };
import KNIGHTLY_ORDERS from './sheets/knightlyOrders.json' with { type: 'json' };
import MAGES_GUILD from './sheets/magesGuild.json' with { type: 'json' };
import THIEVES_GUILD from './sheets/thievesGuild.json' with { type: 'json' };
import DARK_BROTHERHOOD from './sheets/darkBrotherhood.json' with { type: 'json' };
import HOLY_ORDERS from './sheets/holyOrders.json' with { type: 'json' };
import NOBILITY from './sheets/nobility.json' with { type: 'json' };
import MERCHANTS from './sheets/merchants.json' with { type: 'json' };
import COMMONERS from './sheets/commoners.json' with { type: 'json' };
import WITCHES from './sheets/witches.json' with { type: 'json' };
import VAMPIRES from './sheets/vampires.json' with { type: 'json' };
import DAEDRA from './sheets/daedra.json' with { type: 'json' };
import MAIN_QUEST from './sheets/mainQuest.json' with { type: 'json' };
import MODS from './sheets/mods.json' with { type: 'json' };
import QUESTLINES from './sheets/questlines.json' with { type: 'json' };

/** Every family's sheets, in the order the waves wrote them (Questlines-Arc.md section 9) - qlFamilies.js's order. */
export const SHEET_FAMILIES = Object.freeze([FIGHTERS_GUILD, KNIGHTLY_ORDERS, MAGES_GUILD, THIEVES_GUILD, DARK_BROTHERHOOD, HOLY_ORDERS, NOBILITY, MERCHANTS, COMMONERS, WITCHES, VAMPIRES, DAEDRA, MAIN_QUEST, MODS, QUESTLINES]);
if (SHEET_FAMILIES.map((f) => f.family).join() !== QL_FAMILY_NAMES.join()) throw new Error('qlSheets: the families\' files and QL_FAMILY_NAMES disagree');

/** The pay an outcome may name (systems/questlines/qlRewards.js PAY_PROFILES - written here so the law that checks a
 *  sheet never imports the rewards' makers). */
export const PAY_NAMES = Object.freeze(['standard', 'lesser', 'greater', 'double', 'betrayal', 'own', 'none']);

/** The quest names whose sheets stand: upper-case name -> the sheet, frozen. */
export const SHEETS = (() => {
  const map = new Map();
  for (const fam of SHEET_FAMILIES) {
    for (const s of fam.sheets ?? []) {
      const key = String(s.quest ?? '').toUpperCase();
      if (!key || map.has(key)) continue;   // sheetProblems names a duplicate; the first stands
      map.set(key, Object.freeze({ ...s, family: fam.family }));
    }
  }
  return map;
})();

/** The quest's sheet, or null (DFU's journal alone). */
export const sheetFor = (questName) => SHEETS.get(String(questName ?? '').toUpperCase()) ?? null;

const ID = /^[a-z][a-zA-Z0-9-]{0,31}$/;
const isText = (s) => typeof s === 'string' && s.trim().length > 0 && s.length <= 160;

/** A binding's own shape: one known kind, its value of the kind's type. */
function bindingShape(b, where, out) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) { out.push(`${where}: not a binding`); return; }
  const keys = Object.keys(b).filter((k) => k !== 'n');
  if (keys.length !== 1 || !BINDING_KINDS.includes(keys[0])) { out.push(`${where}: names ${keys.join(', ') || 'nothing'} - one of ${BINDING_KINDS.join(', ')}`); return; }
  const [k] = keys, v = b[k];
  if (k === 'all' || k === 'any') {
    if (!Array.isArray(v) || !v.length) out.push(`${where}.${k}: an empty list`);
    else v.forEach((x, i) => bindingShape(x, `${where}.${k}[${i}]`, out));
  } else if (k === 'not') bindingShape(v, `${where}.not`, out);
  else if (k === 'started' || k === 'ended' || k === 'success') { if (v !== true) out.push(`${where}.${k}: must be true`); }
  else if (k === 'step' || k === 'global') { if (!Number.isSafeInteger(v) || v < 0) out.push(`${where}.${k}: not a whole number`); }
  else if (k === 'choice') { if (!v || typeof v.branch !== 'string' || typeof v.is !== 'string') out.push(`${where}.choice: { branch, is }`); }
  else if (typeof v !== 'string' || !v) out.push(`${where}.${k}: not a symbol`);
  if (b.n != null && (!Number.isSafeInteger(b.n) || b.n < 1)) out.push(`${where}.n: not a count`);
}

/**
 * Every problem with `sheet` - its shape alone, or (`quest`, `lines`) against the parsed quest and its script's lines as
 * well. An empty list is a sheet that ships.
 * @param {any} sheet
 * @param {{ quest?: any, lines?: string[] }} [against]
 * @returns {string[]}
 */
export function sheetProblems(sheet, { quest = null, lines = null } = {}) {
  const out = [];
  const name = String(sheet?.quest ?? '?');
  const at = (s) => `${name} ${s}`;
  if (!sheet || typeof sheet.quest !== 'string' || !sheet.quest) return ['a sheet names no quest'];
  if (sheet.tier != null && (!Number.isSafeInteger(sheet.tier) || sheet.tier < 1 || sheet.tier > 4)) out.push(at('tier: 1 to 4'));
  const objectives = Array.isArray(sheet.objectives) ? sheet.objectives : [];
  if (!objectives.length) out.push(at('has no objective'));
  const ids = new Set();
  for (const [i, o] of objectives.entries()) {
    const w = `objectives[${i}]`;
    if (!ID.test(o?.id ?? '')) out.push(at(`${w}: id "${o?.id}"`));
    else if (ids.has(o.id)) out.push(at(`${w}: id "${o.id}" twice`));
    ids.add(o?.id);
    if (!isText(o?.text)) out.push(at(`${w}: no text`));
    if (o?.open != null) bindingShape(o.open, at(`${w}.open`), out);
    if (o?.done == null) out.push(at(`${w}: no done`)); else bindingShape(o.done, at(`${w}.done`), out);
    if (o?.fail != null) bindingShape(o.fail, at(`${w}.fail`), out);
    if (o?.group != null && !ID.test(o.group)) out.push(at(`${w}.group: "${o.group}"`));
    if (o?.any != null && !ID.test(o.any)) out.push(at(`${w}.any: "${o.any}"`));
  }
  const branchIds = new Set();
  for (const [i, b] of (sheet.branches ?? []).entries()) {
    const w = `branches[${i}]`;
    if (!ID.test(b?.id ?? '') || branchIds.has(b.id)) out.push(at(`${w}: id "${b?.id}"`));
    branchIds.add(b?.id);
    if (!isText(b?.text)) out.push(at(`${w}: no text`));
    const choices = Array.isArray(b?.choices) ? b.choices : [];
    if (choices.length < 2 || choices.length > 4) out.push(at(`${w}: ${choices.length} choices - two to four`));
    const cids = new Set();
    for (const [j, c] of choices.entries()) {
      if (!ID.test(c?.id ?? '') || cids.has(c.id)) out.push(at(`${w}.choices[${j}]: id "${c?.id}"`));
      cids.add(c?.id);
      if (!isText(c?.text)) out.push(at(`${w}.choices[${j}]: no text`));
      if (typeof c?.sets !== 'string' || !c.sets) out.push(at(`${w}.choices[${j}]: sets no task`));
    }
  }
  const outcomes = Array.isArray(sheet.outcomes) ? sheet.outcomes : [];
  if (!outcomes.length) out.push(at('has no outcome'));
  const oids = new Set();
  for (const [i, o] of outcomes.entries()) {
    const w = `outcomes[${i}]`;
    if (!ID.test(o?.id ?? '') || oids.has(o.id)) out.push(at(`${w}: id "${o?.id}"`));
    oids.add(o?.id);
    if (!isText(o?.text)) out.push(at(`${w}: no text`));
    if (o?.on == null) out.push(at(`${w}: no on`)); else bindingShape(o.on, at(`${w}.on`), out);
    if (!PAY_NAMES.includes(o?.pay)) out.push(at(`${w}.pay: "${o?.pay}" - one of ${PAY_NAMES.join(', ')}`));
    if (o?.standing != null) {
      if (typeof o.standing !== 'object' || Array.isArray(o.standing)) out.push(at(`${w}.standing: not a map`));
      else for (const [f, v] of Object.entries(o.standing)) if (!Number.isSafeInteger(v) || v === 0 || Math.abs(v) > 10) out.push(at(`${w}.standing.${f}: a whole number, -10 to 10, not 0`));
    }
    if (o?.legal != null && (!Number.isSafeInteger(o.legal) || Math.abs(o.legal) > 10)) out.push(at(`${w}.legal: -10 to 10`));
    // QL3 (section 5.2): an outcome's NAMED PIECE - one of its three cards carries a name of its own: a questline's
    // ending alone (a flagship quest of DFU's keeps the ladder's names), an outcome that pays gear, a kind the choice deals
    if (o?.named != null) {
      const n = o.named;
      if (!n || typeof n !== 'object' || typeof n.name !== 'string' || !/^[A-Z][A-Za-z' -]{2,39}$/.test(n.name)) out.push(at(`${w}.named.name: a name, 3-40 letters, capitalised`));
      if (!['weapon', 'armor', 'jewel'].includes(n?.kind)) out.push(at(`${w}.named.kind: weapon, armor or jewel`));
      if (o.failure || ['betrayal', 'own', 'none'].includes(o.pay)) out.push(at(`${w}.named: an outcome that pays no gear names no piece`));
      if (!/^QL[A-Z]{2}\d{2}$/.test(String(sheet.quest ?? ''))) out.push(at(`${w}.named: a questline's outcome alone`));
    }
  }
  // choice bindings name branches the sheet has
  const walk = (b, w) => {
    if (!b || typeof b !== 'object') return;
    if (b.choice && (!branchIds.has(b.choice.branch) || !(sheet.branches ?? []).find((x) => x.id === b.choice.branch)?.choices?.some((c) => c.id === b.choice.is))) out.push(at(`${w}: names no branch choice ${b.choice.branch}/${b.choice.is}`));
    for (const k of ['all', 'any']) if (Array.isArray(b[k])) b[k].forEach((x) => walk(x, w));
    if (b.not) walk(b.not, w);
  };
  for (const [i, o] of objectives.entries()) for (const k of ['open', 'done', 'fail']) walk(o?.[k], `objectives[${i}].${k}`);
  for (const [i, o] of outcomes.entries()) walk(o?.on, `outcomes[${i}].on`);
  if (quest) out.push(...scriptProblems(sheet, quest, lines).map(at));
  return out;
}

/** The script half: every symbol bound names a resource or task of its kind; every step bound is one the script logs;
 *  every task a choice sets or an outcome waits on can be set by something in the script. */
function scriptProblems(sheet, quest, lines) {
  const out = [];
  const kindOk = { task: (n) => quest.tasks?.has?.(n), item: (n) => !!quest.resources?.get?.(n)?.isItem, clock: (n) => !!quest.resources?.get?.(n)?.isClock, clockDone: (n) => !!quest.resources?.get?.(n)?.isClock, foeDead: (n) => !!quest.resources?.get?.(n)?.isFoe };
  const bindings = [];
  for (const [i, o] of (sheet.objectives ?? []).entries()) for (const k of ['open', 'done', 'fail']) if (o?.[k]) bindings.push([`objectives[${i}].${k}`, o[k]]);
  for (const [i, o] of (sheet.outcomes ?? []).entries()) if (o?.on) bindings.push([`outcomes[${i}].on`, o.on]);
  for (const [w, b] of bindings) for (const s of bindingSymbols(b)) if (!kindOk[s.kind]?.(s.name)) out.push(`${w}: the script has no ${s.kind === 'task' ? 'task' : s.kind === 'foeDead' ? 'foe' : s.kind === 'clockDone' ? 'clock' : s.kind} "${s.name}"`);
  const steps = new Set();
  for (const l of lines ?? []) { const m = /\blog\s+\d+\s+step\s+(\d+)/i.exec(l); if (m) steps.add(Number(m[1])); }
  const stepsIn = (b, w) => {
    if (!b || typeof b !== 'object') return;
    if (b.step != null && lines && !steps.has(b.step)) out.push(`${w}: the script logs no step ${b.step}`);
    for (const k of ['all', 'any']) if (Array.isArray(b[k])) b[k].forEach((x) => stepsIn(x, w));
    if (b.not) stepsIn(b.not, w);
  };
  for (const [w, b] of bindings) stepsIn(b, w);
  for (const [i, o] of (sheet.objectives ?? []).entries()) {
    if (o?.mark && !quest.resources?.has?.(symName(o.mark))) out.push(`objectives[${i}].mark: the script has no resource "${symName(o.mark)}"`);
  }
  for (const [i, b] of (sheet.branches ?? []).entries()) {
    for (const [j, c] of (b?.choices ?? []).entries()) {
      const n = symName(c?.sets);
      if (!quest.tasks?.has?.(n)) out.push(`branches[${i}].choices[${j}]: the script has no task "${n}"`);
      else if (lines && !settable(quest, n, lines)) out.push(`branches[${i}].choices[${j}]: nothing in the script can set "${n}"`);
    }
  }
  for (const [w, b] of bindings) {
    for (const s of bindingSymbols(b)) {
      if (s.kind === 'task' && quest.tasks?.has?.(s.name) && lines && !settable(quest, s.name, lines)) out.push(`${w}: nothing in the script can set "${s.name}"`);
    }
  }
  return out;
}

/**
 * Whether anything in the script can set task `name`: a task with a trigger of its own (`when`, `clicked`, `killed`,
 * `toting` ...), a global-variable link, or a name another line of the script says - `start task`, `setvar`, a prompt's
 * yes or no, `pick one of`, a `do` arm, `run quest`. A task only its own header names is dead, and a sheet bound to it
 * would wait forever.
 */
export function settable(quest, name, lines) {
  const task = quest.tasks?.get?.(name);
  if (!task) return false;
  if (task.hasTriggerConditions || task.globalVarLink !== -1 || task.type === 'headless' || task.type === 'persistUntil') return true;
  const sym = new RegExp(`(^|[^A-Za-z0-9_.])_${name.replace(/\./g, '\\.')}_($|[^A-Za-z0-9_.])`);
  const header = new RegExp(`^\\s*(_${name.replace(/\./g, '\\.')}_\\s+task:|variable\\s+_${name.replace(/\./g, '\\.')}_\\s*$)`);
  let inQbn = false;
  for (const l of lines) {
    if (/^\s*QBN:/i.test(l)) { inQbn = true; continue; }
    if (!inQbn || header.test(l) || READS_ONLY.test(l)) continue;
    if (sym.test(l)) return true;
  }
  return false;
}
/** A line that names a task only to READ it (a trigger's `when`, a persist-until header) or to clear it - never a set. */
const READS_ONLY = /^\s*(when\b|until\b|clear\b|unset\b|drop\b)/i;
