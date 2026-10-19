// LANE LAW: every sheet, mechanically - the classes of error qlSheetLaw does not look for.
// run: cd $SNAP && node <this file>
const SNAP = process.env.SNAP_DIR ?? '/tmp/claude-0/-home-user-daggerfall-js-source/3623cd79-09cc-592b-97d8-4abfb43f9e1e/scratchpad/audit-lanes/LAW/head';   // = git archive of the snapshot's HEAD (fe033c256): other lanes' probe mutants edit the shared worktree
const { SHEET_FAMILIES } = await import(`${SNAP}/src/systems/questlines/qlSheets.js`);
const { packMachine, parsedQuest } = await import(`${SNAP}/test/qlSources.mjs`);
const { getMacro, MACRO_TYPES } = await import(`${SNAP}/src/systems/quest/questMacros.js`);
const { ACT_IDS } = await import(`${SNAP}/src/systems/questlines/qlActs.js`);
const { symName } = await import(`${SNAP}/src/systems/questlines/qlLaw.js`);

const machine = packMachine();
const out = {};
const add = (cls, s) => (out[cls] ??= []).push(s);
const SHEET_KEYS = new Set(['quest', 'objectives', 'outcomes', 'branches', 'tier', 'family']);
const OBJ_KEYS = new Set(['id', 'text', 'open', 'done', 'fail', 'optional', 'group', 'any', 'mark']);
const OUT_KEYS = new Set(['id', 'text', 'on', 'pay', 'failure', 'standing', 'legal', 'named']);
const BR_KEYS = new Set(['id', 'text', 'choices']);
const CH_KEYS = new Set(['id', 'text', 'sets']);
const kindOf = (r) => (r.isPlace ? 'Place' : r.isPerson ? 'Person' : r.isItem ? 'Item' : r.isFoe ? 'Foe' : r.isClock ? 'Clock' : 'Other');
let total = 0;
const walk = (b, fn) => { if (!b || typeof b !== 'object') return; fn(b); for (const k of ['all', 'any']) if (Array.isArray(b[k])) b[k].forEach((x) => walk(x, fn)); if (b.not) walk(b.not, fn); };
for (const fam of SHEET_FAMILIES) {
  for (const sheet of fam.sheets) {
    total++;
    const name = sheet.quest;
    const p = parsedQuest(name, machine, true);
    if (!p) { add('noparse', name); continue; }
    const q = p.quest;
    for (const k of Object.keys(sheet)) if (!SHEET_KEYS.has(k)) add('unknown sheet key', `${name}.${k}`);
    // failure outcome
    if (!(sheet.outcomes ?? []).some((o) => o.failure)) add('no failure outcome', name);
    // catch-all position
    const outs = sheet.outcomes ?? [];
    const ci = outs.findIndex((o) => o.on && Object.keys(o.on).length === 1 && o.on.ended === true);
    if (ci >= 0 && ci < outs.length - 1) add('outcome after the catch-all (unreachable at the end)', `${name}: ${outs.slice(ci + 1).map((o) => o.id).join(',')} after ${outs[ci].id}`);
    if (ci >= 0 && !outs[ci].failure) add('catch-all that is no failure', `${name}: ${outs[ci].id} pay ${outs[ci].pay}`);
    // texts' macros
    const texts = [];
    for (const o of sheet.objectives ?? []) { texts.push([`obj ${o.id}`, o.text]); for (const k of Object.keys(o)) if (!OBJ_KEYS.has(k)) add('unknown objective key', `${name}.${o.id}.${k}`); }
    for (const o of outs) { texts.push([`out ${o.id}`, o.text]); for (const k of Object.keys(o)) if (!OUT_KEYS.has(k)) add('unknown outcome key', `${name}.${o.id}.${k}`); }
    for (const b of sheet.branches ?? []) {
      texts.push([`branch ${b.id}`, b.text]);
      for (const k of Object.keys(b)) if (!BR_KEYS.has(k)) add('unknown branch key', `${name}.${b.id}.${k}`);
      for (const c of b.choices ?? []) { texts.push([`choice ${b.id}.${c.id}`, c.text]); for (const k of Object.keys(c)) if (!CH_KEYS.has(k)) add('unknown choice key', `${name}.${b.id}.${c.id}.${k}`); }
    }
    for (const [w, t] of texts) {
      if (typeof t !== 'string') continue;
      for (const word of t.split(/[\s,;:!?()"']+/)) {
        const m = getMacro(word);
        if (m.type === MACRO_TYPES.None || m.type === MACRO_TYPES.ContextMacro) continue;
        const r = q.resources.get(m.symbol);
        if (!r) add('text names a resource the script lacks', `${name} ${w}: "${m.token}" in "${t}"`);
        else if ((m.type === MACRO_TYPES.NameMacro2 || m.type === MACRO_TYPES.NameMacro3) && !(r.isPlace || r.isPerson || r.isFoe || r.isItem)) add('place macro on a non-place', `${name} ${w}: ${m.token} (${kindOf(r)})`);
        else if (m.type === MACRO_TYPES.DetailsMacro && !r.isClock && !r.isPerson && !r.isPlace && !r.isFoe && !r.isItem) add('details macro odd', `${name} ${w}: ${m.token} (${kindOf(r)})`);
      }
      if (/%\w+/.test(t)) add('context macro in a sheet text', `${name} ${w}: ${t}`);
      if (/\b_[A-Za-z]/.test(t.replace(/_+[a-zA-Z0-9.]+_/g, ''))) add('a stray underscore', `${name} ${w}: ${t}`);
    }
    // acts
    for (const o of sheet.objectives ?? []) for (const k of ['open', 'done', 'fail']) walk(o[k], (b) => { if (b.act != null && !ACT_IDS.includes(b.act)) add('act kind no feature says', `${name}.${o.id}.${k}: ${b.act}`); if (b.n != null && b.act == null) add('n on a non-act binding', `${name}.${o.id}.${k}`); });
    for (const o of outs) walk(o.on, (b) => { if (b.act != null && !ACT_IDS.includes(b.act)) add('act kind no feature says', `${name}.${o.id}: ${b.act}`); if (b.n != null && b.act == null) add('n on a non-act binding', `${name}.${o.id}.on`); });
    // marks
    for (const o of sheet.objectives ?? []) if (o.mark) { const r = q.resources.get(symName(o.mark)); if (r && !(r.isPlace || r.isPerson)) add('mark on a non-place/person', `${name}.${o.id}: ${o.mark} (${kindOf(r)})`); }
    // done == started, done == open
    for (const o of sheet.objectives ?? []) {
      if (o.done && o.done.started) add('objective done at start', `${name}.${o.id}`);
      if (o.open && o.done && JSON.stringify(o.open) === JSON.stringify(o.done)) add('objective opens and is done on the same state', `${name}.${o.id}`);
      if (o.done && JSON.stringify(o.done) === '{"ended":true}') add('objective done only at the end', `${name}.${o.id}`);
    }
    // outcome bindings that are identical
    const seen = new Map();
    for (const o of outs) { const k = JSON.stringify(o.on); if (seen.has(k)) add('two outcomes, one binding (the second unreachable)', `${name}: ${seen.get(k)} and ${o.id} on ${k}`); else seen.set(k, o.id); }
    // ids of outcomes named done/failed (the fallback reads them by name)
    if (!outs.some((o) => o.id === 'done')) add('no outcome named done (success fallback: first non-failure)', `${name}: ${outs.map((o) => o.id + (o.failure ? '!' : '')).join(',')}`);
    if (!outs.some((o) => o.id === 'failed')) add('no outcome named failed (failure fallback: first failure)', `${name}: ${outs.map((o) => o.id + (o.failure ? '!' : '')).join(',')}`);
    // a success that pays none / a failure that pays
    for (const o of outs) {
      if (o.failure && o.pay !== 'none') add('a failure that pays', `${name}.${o.id}: ${o.pay}`);
      if (!o.failure && o.pay === 'none') add('a non-failure outcome that pays none', `${name}.${o.id}`);
    }
    // text lengths
    for (const [w, t] of texts) if (typeof t === 'string' && t.length > 120) add('text over 120 chars', `${name} ${w}: ${t.length}`);
  }
}
console.log('sheets:', total);
for (const [k, v] of Object.entries(out)) { console.log(`\n## ${k} (${v.length})`); for (const s of v.slice(0, 400)) console.log('  ' + s); }
