// FIELD BUGS 2026-10-18b, STAKE-ROW (bible/01-Overview/bugs/Field-Bugs-2026-10-18b.md; Mac: "The top option doesnt work
// when using the Weir key"): the start window's top row - the stake, "Weir Keys: 3 - one will be staked." - and the quest
// warning under it are words, not choices; picked, DFU's list picker (ui/listPicker.js) has already closed itself
// (`_pick` raises `done`, the host's slot drains it), so the window asks its list again - never no window and a flow that
// still asks (the key's "The Spire already asks where you begin." until the screen let go).
//
// THE SHAPE THE PRODUCER MINTS (Home.md): the real ListPickerWindow, in a slot shaped as the exterior's (scenes/townTalk.js
// - a mount refused while it is held, an identity-guarded close, a done occupant drained after its input), behind the
// host's own two doors as scenes/world.js writes them (`egStartWindow`'s openList and closeList).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ListPickerWindow, PICKER_X, PICKER_Y, PICKER_RECTS } from '../../../src/ui/listPicker.js';
import { openEgStartWindow } from '../../../src/ui/eliteGates/egStartWindow.js';
import { EG_TEXT } from '../../../src/net/eliteGates/egLaw.js';

const ME = 'acct-mac';
/** The exterior's one-window slot (townTalk): mount refused while held, close by identity, the done drain after input. */
function slot() {
  let held = null;
  return {
    get win() { return held; },
    mount(w) { if (held) return false; held = w; return true; },
    close(w) { if (w && held !== w) return false; held = null; return true; },
    input(code) { const w = held; w?.input(code); if (held?.done) held = null; },
    click(vx, vy) { const w = held; w?.click(vx, vy); if (held?.done) held = null; },
  };
}
/** A tap on the list's top row: the enhanced skin's row press replays DFU's double click on the classic row
 *  (ui/enhanced/enhancedPicker.js pickRow - the same point), and the classic list takes the double click itself. */
const TOP_ROW = [PICKER_X + PICKER_RECTS.list[0] + 10, PICKER_Y + PICKER_RECTS.list[1] + 3];
const tap = (s) => { s.click(...TOP_ROW); s.click(...TOP_ROW); };
/** The start window over the host's doors (world.js egStartWindow), the slot under them. */
function open(o = {}) {
  const s = slot(), log = [];
  const w = openEgStartWindow({ keys: 3, me: ME, members: [{ sub: ME, name: 'Mac' }], starts: { [ME]: [7, 0] }, rehearsal: true, questDue: false, ...o,
    openList: (labels, onPick, onCancel) => { const win = new ListPickerWindow({ items: labels, backdrop: 'none', onPick: (i) => onPick(i), onCancel: () => onCancel() }); return s.mount(win) ? win : null; },
    closeList: (win) => { if (win) s.close(win); },
    ask: () => { throw new Error('no question here'); },
    onChoose: (c) => log.push(['choose', c]), onCancel: () => log.push('cancel') });
  return { s, w, log };
}

test('STAKE-ROW: the stake picked (a tap, Enter on the first highlight, its digit) leaves the start window up, its list asked again in the slot - the window still asking, nothing chosen or cancelled; a start picked after it is the choice (mutant: the bare return - no window, the flow left asking)', () => {
  for (const press of [['tap'], ['Enter'], ['Digit1'], ['ArrowUp', 'Enter']]) {
    const { s, w, log } = open();
    const first = s.win;
    assert.ok(first instanceof ListPickerWindow, 'the list in the slot');
    assert.equal(first.items[0], EG_TEXT.stake(3), 'the top row is the stake');
    assert.equal(first.selectedIndex, 0, "DFU's picker opens on its first row");
    for (const code of press) { if (code === 'tap') tap(s); else s.input(code); }
    assert.equal(first.done, true, 'the picker closed itself on the pick');
    assert.ok(s.win instanceof ListPickerWindow && s.win !== first && !s.win.done, `${press.join('+')}: a list in the slot again`);
    assert.deepEqual(s.win.items, first.items, 'the same rows');
    assert.equal(w.state().done, false, 'the window still asks');
    assert.deepEqual(log, [], 'nothing chosen, nothing cancelled');
    // and the window works on: Hall 1 is the choice
    s.input('ArrowDown'); s.input('ArrowDown'); s.input('Enter');
    assert.deepEqual(log, [['choose', { ew: 0, wg: [], rh: false }]]);
    assert.equal(s.win, null, 'the slot emptied by the choice');
  }
});

test('STAKE-ROW: the quest warning is words as the stake is - picked, the list again; Escape after it is the cancel, told once', () => {
  const { s, w, log } = open({ questDue: true });
  assert.equal(s.win.items[1], EG_TEXT.questDue);
  s.input('ArrowDown'); s.input('Enter');
  assert.ok(s.win && !s.win.done, 'a list in the slot again');
  assert.equal(w.state().done, false);
  s.input('Escape');
  assert.deepEqual(log, ['cancel']);
  assert.equal(s.win, null);
  assert.equal(w.state().done, true);
});

test('STAKE-ROW: world.js hands the start window DFU\'s picker on the mode machine\'s slot - the doors this pin stands in for', () => {
  const src = readFileSync(new URL('../../../src/scenes/world.js', import.meta.url), 'utf8');
  const at = src.indexOf('const egStartWindow = (o) => openEgStartWindow({');
  assert.ok(at > 0);
  const body = src.slice(at, src.indexOf('ask: egStartAsk(', at));
  assert.match(body, /new ListPickerWindow\(\{ items: labels, backdrop: 'none', onPick: \(i\) => onPick\(i\), onCancel: \(\) => onCancel\(\) \}\)/);
  assert.match(body, /if \(modes\?\.mountWindow\?\.\(win\)\) return win;/);
  assert.match(body, /closeList: \(win\) => \{ if \(win\) modes\?\.closeWindow\?\.\(win\); \}/);
  // and the picker closes itself on any pick - the half that makes a bare return strand the window
  const lp = readFileSync(new URL('../../../src/ui/listPicker.js', import.meta.url), 'utf8');
  assert.match(lp, /_pick\(index\) \{\n\s+if \(index < 0 \|\| index >= this\.items\.length\) return;\n\s+this\.done = true;/);
});
