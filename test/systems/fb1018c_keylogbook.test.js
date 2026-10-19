// FB1018C KEY-LOGBOOK - the journal keys' rows name the window they open.
//
// The report (Discord #bug-reports, kvassdrit, "L opens chronicles instead of Quest tab"): "Function does not match
// description in keybinding menu". The Controls row for L read "Quest log"; on Enhanced Plus L opens the Chronicle on
// its Quests. That is the recorded decision - PX24d sent both journal doors through ui/chronicleDoor.js, MAC-K2 landed
// L on Quests and N on Notes - so the row's words were what was wrong, and they name each skin's window now.
//
// EXECUTED, not matched. Every scenes host that defines an L or N arm is read for the mode that arm passes (a derived
// population - MAC-K2's lesson: a hand-written host list cannot see the host that is missing), each building host's
// section mapping is RUN on that mode, and the real door (createChronicleWindow) is opened on the answer under the
// minimal DOM. The row must carry the heading that window draws and the name of the page it opened on: a heading
// renamed, a page moved or an arm re-aimed fails here, as the old words do.
import '../chargenDom.mjs';   // the minimal DOM - globals
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { ACTION_GROUPS, actionLabel } from '../../src/systems/inputActions.js';
import { SKIN_NAMES } from '../../src/systems/uiSkin.js';
import { dpadChoiceWord } from '../../src/ui/plus/plusPad.js';
import { createChronicleWindow } from '../../src/ui/chronicleDoor.js';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const SCENES = readdirSync(new URL('../../src/scenes/', import.meta.url), { recursive: true })
  .filter((f) => f.endsWith('.js')).map((f) => `src/scenes/${f.replace(/\\/g, '/')}`);

/** Every `<arm>() {` or `<arm>: () =>` a scenes host defines, with the journal mode its line hands on. */
function armModes(arm) {
  const out = [];
  for (const f of SCENES) {
    for (const m of read(f).matchAll(new RegExp(`\\b${arm}(?:\\(\\) \\{|: \\(\\) =>)([^\\n]*)`, 'g'))) {
      const mode = /\('(\w+)'\)/.exec(m[1])?.[1];
      assert.ok(mode, `${f}: ${arm} names the journal mode it opens`);
      out.push({ file: f, mode, builds: read(f).includes('createChronicleWindow(') });
    }
  }
  return out;
}

/** A building host's own mode -> section mapping, run: the expression its createChronicleWindow call hands `section`. */
function sectionOf(file) {
  const src = read(file);
  const call = src.indexOf('createChronicleWindow({');
  assert.ok(call >= 0, `${file} builds the chronicle`);
  const at = src.indexOf('section: ', call) + 'section: '.length;
  const expr = src.slice(at, src.indexOf(',\n', at));
  // eslint-disable-next-line no-new-func
  return new Function('mode', `return (${expr});`);
}

/** Where a host's arm lands: its own mapping, or - a host that builds none - every outer host's that hands it one. */
function landed(arm) {
  const outer = SCENES.filter((f) => /makeJournal: \(mode\) => makeJournalWindow\(mode\)/.test(read(f)));
  const arms = armModes(arm);
  // THE FOUR HOSTS, as a floor under the derived population: an arm the reading misses must fail, not pass unread
  for (const h of ['exterior', 'world', 'worldModes', 'dungeonContext']) {
    assert.ok(arms.some((a) => a.file === `src/scenes/${h}.js`), `${h}.js's ${arm} is read`);
  }
  const pages = new Set();
  for (const a of arms) for (const f of a.builds ? [a.file] : outer) pages.add(sectionOf(f)(a.mode));
  return [...pages];
}

/** Open the real door on `section` and read what it draws: the window's heading and the page it opened on. */
async function drawn(section) {
  globalThis.window ??= globalThis;
  const w = createChronicleWindow({ section });
  assert.ok(w, 'the enhanced skin opens the chronicle');
  for (let i = 0; i < 20; i++) await new Promise((r) => setImmediate(r));   // the window's lazy chunk
  try {
    const nodes = globalThis.document.body.querySelectorAll('*');
    const heads = nodes.filter((n) => n.tagName === 'H2').map((n) => n.textContent);
    const on = nodes.filter((n) => /\bcr-row\b/.test(n.className) && /\bon\b/.test(n.className));
    assert.equal(heads.length, 1);
    assert.equal(on.length, 1);
    const [row] = on, first = row.children[0], last = row.children[row.children.length - 1];
    return { heading: heads[0], page: row.textContent.slice(first.textContent.length, row.textContent.length - last.textContent.length) };
  } finally { w.close(); }
}

test('FB1018C KEY-LOGBOOK: L\'s row names the window L opens on each skin - the Chronicle on its Quests, and the classic logbook', async () => {
  const pages = landed('toggleLogbook');
  assert.equal(pages.length, 1, `every host's L lands on one page: ${pages}`);
  const { heading, page } = await drawn(pages[0]);
  const label = actionLabel('LogBook');
  assert.ok(label.startsWith(`${heading}: ${page} (${SKIN_NAMES.enhanced}) / `),
    `the row names the window L opens on Enhanced Plus (${heading}, on ${page}): "${label}"`);
  assert.ok(label.endsWith(` / logbook (${SKIN_NAMES.classic})`), `and the classic logbook as it stands: "${label}"`);
  // the pane draws the group's row and the held-key question reads actionLabel - one set of words
  const row = ACTION_GROUPS.flatMap((g) => g.rows).find((r) => r.action === 'LogBook');
  assert.equal(row.label, label);
  // the Controller bindings window is Enhanced Plus only, so its d-pad word is that skin's half alone
  assert.equal(dpadChoiceWord('LogBook'), `${heading}: ${page}`);
});

test('FB1018C KEY-LOGBOOK: N\'s row names the window N opens on each skin - the Chronicle on its Notes, and the classic notebook', async () => {
  const pages = landed('toggleNotebook');
  assert.equal(pages.length, 1, `every host's N lands on one page: ${pages}`);
  const { heading, page } = await drawn(pages[0]);
  const label = actionLabel('NoteBook');
  assert.ok(label.startsWith(`${heading}: ${page} (${SKIN_NAMES.enhanced}) / `),
    `the row names the window N opens on Enhanced Plus (${heading}, on ${page}): "${label}"`);
  assert.ok(label.endsWith(` / notebook (${SKIN_NAMES.classic})`), `and the classic logbook's Notebook page: "${label}"`);
});
