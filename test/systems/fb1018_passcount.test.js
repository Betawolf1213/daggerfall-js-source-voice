// FIELD BUGS 2026-10-18 PASS-COUNT (bible/01-Overview/bugs/Field-Bugs-2026-10-18.md, MADMAN0037: "The Mouse and Fawn
// tavern in Sentinel, graphics settings preset ultra, Gpu fans turn into jet turbines", over a counter that read
// "198 fps ... draws 67 binds 77"). The counter counted the room's own pass alone: a building's view out through its
// windows (renderer.outsideViewFrame, drawn BEFORE the room's beginFrame, whose reset lost its draws) and the shadow
// maps' replays (their own stats) were nowhere on it, and nothing said what held the frame rate. The counter EXECUTES
// against a stub document; the renderer is text-pinned (its constructor needs a real GL), as PERF3's pins are.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mountFpsCounter, paceLine, drawsLine } from '../../src/ui/fpsCounter.js';
import { _resetFrameClock } from '../../src/systems/frameClock.js';
import { _resetFrameCap } from '../../src/systems/frameCap.js';
import { setValue, _resetForTests } from '../../src/systems/settings/settings.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const stubEl = () => ({ id: '', textContent: '', style: { cssText: '', display: '' }, children: [], appendChild(c) { this.children.push(c); return c; }, remove() { this.removed = true; } });

/** One second and a frame of `frame()` through a mounted counter; answers its text. */
function second(frame) {
  const c = mountFpsCounter({ enabled: () => true, raf: null, stats: frame });
  let t = 0;
  for (let i = 0; i <= 61; i++) { c.tick(t); t += 1000 / 60; }
  const text = c.el.textContent;
  c.dispose();
  return text;
}

test('PASS-COUNT THE COUNTER SHOWS THE PASSES THE DRAW COUNT MISSED: the view out\'s and the shadow maps\' draws ride the draws line as per-frame means when a second held any, and the line is as it was when none did (mutants: the view unsummed; the shadows unsummed; the means not reset each second)', () => {
  const prev = globalThis.document;
  globalThis.document = { createElement: stubEl, body: stubEl() };
  try {
    _resetFrameClock();
    assert.match(second(() => ({ draws: 67, texBinds: 77, viewDraws: 1210, shadowDraws: 340 })), /\ndraws 67 {2}binds 77 {2}view 1210 {2}shadow 340$/m);
    assert.match(second(() => ({ draws: 67, texBinds: 77, viewDraws: 0, shadowDraws: 0 })), /\ndraws 67 {2}binds 77$/m, 'none held: the line as before');
    let i = 0;
    const text = second(() => ({ draws: 10, texBinds: 1, viewDraws: (i++ % 2) * 100, shadowDraws: 0 }));
    assert.match(text, /\ndraws 10 {2}binds 1 {2}view 5\d$/m, `every other frame's view out, a mean: ${JSON.stringify(text)}`);
    // one counter over two seconds: the street seen through the glass in the first, the player gone out of the room in
    // the second - its own means
    let frame = { draws: 67, texBinds: 77, viewDraws: 1210, shadowDraws: 340 };
    const c = mountFpsCounter({ enabled: () => true, raf: null, stats: () => frame });
    let t = 0;
    for (let k = 0; k <= 61; k++) { c.tick(t); t += 1000 / 60; }
    assert.match(c.el.textContent, /view 1210 {2}shadow 340$/m);
    frame = { draws: 300, texBinds: 120, viewDraws: 0, shadowDraws: 0 };
    for (let k = 0; k <= 61; k++) { c.tick(t); t += 1000 / 60; }
    assert.match(c.el.textContent, /\ndraws 300 {2}binds 120$/m, `a new second, its own means: ${JSON.stringify(c.el.textContent)}`);
    c.dispose();
    assert.equal(drawsLine(67, 77, 0.4, 0), '\ndraws 67  binds 77', 'under half a draw a frame is none');
  } finally { globalThis.document = prev; _resetFrameClock(); }
});

test('PASS-COUNT THE COUNTER SAYS WHAT HOLDS THE FRAME RATE: "vsync off" where the desktop shell lifted the display\'s wait, the Frame Rate Cap\'s fps where one is set, and no line at the defaults - the display\'s own pace, uncapped (mutants: the shell\'s word unread; the cap unread; a line at the defaults)', () => {
  assert.equal(paceLine(false, 0), '');
  assert.equal(paceLine(true, 0), '\nvsync off  no cap');
  assert.equal(paceLine(false, 144), '\nvsync  cap 144');
  assert.equal(paceLine(true, 60), '\nvsync off  cap 60');
  const prev = { d: globalThis.document, w: globalThis.window };
  globalThis.document = { createElement: stubEl, body: stubEl() };
  globalThis.window = { daggerShell: { framesLifted: true } };
  _resetForTests(); _resetFrameCap();
  try {
    _resetFrameClock();
    assert.match(second(() => ({ draws: 1, texBinds: 1 })), /\nvsync off {2}no cap$/m, 'the desktop shell, VSync off');
    setValue('Video', 'TargetFrameRate', '144'); _resetFrameCap();
    globalThis.window = {};
    // a capped run counts only the frames the cap let through - the line is what matters here
    const c = mountFpsCounter({ enabled: () => true, raf: null, stats: () => ({ draws: 1, texBinds: 1 }) });
    for (let t = 0; t < 2100; t += 1) c.tick(t);
    assert.match(c.el.textContent, /\nvsync {2}cap 144$/m, `the cap: ${JSON.stringify(c.el.textContent)}`);
    c.dispose();
  } finally { globalThis.document = prev.d; globalThis.window = prev.w; _resetForTests(); _resetFrameCap(); _resetFrameClock(); }
});

test('PASS-COUNT THE RENDERER COUNTS THEM: the room\'s beginFrame takes the view out\'s draws (its own nested begin inside the view out takes none, and leaves them for the room) and the lane\'s shadow render writes the maps\' replays - both zeroed for a frame that drew neither (mutants: the view out\'s count reset under the nested begin; the shadow count never written)', () => {
  const r = read('src/render/renderer.js');
  assert.match(r, /s\.viewDraws = this\._rwOutside \? 0 : this\._rwViewDraws; s\.shadowDraws = 0;\n\s+if \(!this\._rwOutside\) this\._rwViewDraws = 0;/);
  assert.match(r, /this\.stats\.shadowDraws = \(sp\.stats\.sunDraws \| 0\) \+ \(sp\.stats\.pointDraws \| 0\);/);
  assert.match(r, /this\._rwViewDraws = this\.stats\.draws;\n\s+drew = true;/, 'the view out keeps its own count as it closes');
  // the order the count relies on: the interior host asks for the view out before its own beginFrame
  const modes = read('src/scenes/worldModes.js');
  const out = modes.indexOf('viewOutFrame(');
  assert.ok(out > 0 && modes.indexOf('renderer.beginFrame(', out) > out, 'the view out is drawn before the room begins its frame');
});
