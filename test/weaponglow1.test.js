// WEAPON-GLOW1 (2026-10-16, Mac: "What if we designed our own sort of animated outline for each element? And even
// introduced the same, more detailed design for the morrowind weapons?" ... "this is your baby"; bible/05-Combat/
// Weapon-Glow.md). The laws pinned here:
//   - THE ELEMENT IS THE BLOW'S: a weapon's `elemental` lines, rolled or socketed, read as the blow reads them
//     (lootRarity.js readLines - lootPowers.js linesOf is the same reader); the most of one element shows, a tie in
//     PROC_ELEMENTS' order; its level the band its total reads in; nothing for a piece not yet identified, with the
//     switch off, or with the ladder off; the Morrowind hand's arcane look for an enchanted weapon with none showing.
//   - THE CLASSIC HAND swings the plain sheet while an element shows (plainWeaponType) and draws the outline over the
//     frame, on its rect and its mirror; the clone and the Thunderlock the same.
//   - THE RENDERER: drawScreenQuadGlow is the fourth 2D primitive (its program, its blend, its run left open); the
//     Morrowind pass draws the rings BEFORE the body and the charge after, the weapon's shown ranges alone, in a sprite
//     pass alone, and hands every state back.
//   - THE WIRE carries a held weapon's glow as a word, a weapon's alone, omitted when none; a peer's body reads it.
//   - THE CLOCK: every scroll is whole over GLOW_CLOCK_PERIOD (its noise periodic over exactly the rows it scrolls),
//     every pulse a whole number of turns.

import './modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setPref, _resetForTests } from '../src/systems/uiPrefs.js';
import * as LR from '../src/systems/lootRarity.js';
import * as LP from '../src/systems/lootPowers.js';
import * as WG from '../src/systems/weaponGlow.js';
import * as GL from '../src/render/weaponGlowGlsl.js';
import { createWeapon } from '../src/combat/enemyEquipment.js';
import { equipItem } from '../src/systems/equip.js';
import { WEAPON_TYPES, plainWeaponType, weaponTypeForItem, drawFpsWeapon, getWeaponAnims } from '../src/combat/fpsWeapon.js';
import { atlasFileName, moddedWeaponFilename } from '../src/combat/diverseWeapons.js';
import { validLookItem, validLook, LOOK_GLOW_RE } from '../src/net/wire.js';
import { composeLook, peerStubEntity } from '../src/net/remotePlayers.js';
import { Renderer } from '../src/render/renderer.js';
import { FEATURES } from '../src/systems/features.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
const on = () => { _resetForTests(); setPref('lootRarity', true); };
const lcg = (seed) => () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return (seed >>> 8) / 0x800000; };
const ELEMENT_ROLL = { fire: 0, frost: 0.4, shock: 0.8 };
const sword = () => createWeapon(120, 0, () => 0.5);   // a Longsword, as a body drops it

/** A Magic longsword minted at a door whose last pass took a line of `element` at the band's top - the producer's own
 *  shape (applyRarity, then addProcLine: the kind, the value, the param). */
function mintMagic(element, top = true) {
  const it = sword();
  LR.applyRarity(it, 'magic', lcg(7));
  const seq = [0, top ? 0.99 : 0, ELEMENT_ROLL[element]];
  let i = 0;
  const line = LR.addProcLine(it, () => seq[i++]);
  return { it, line };
}
/** A Rare longsword, identified, two sockets empty. */
function mintRare() {
  const it = sword();
  LR.applyRarity(it, 'rare', lcg(11));
  it.isIdentified = true;
  it.sockets = [LR.SOCKET_EMPTY, LR.SOCKET_EMPTY];
  return it;
}

test('WEAPON-GLOW1: the element is the blow\'s - a minted line names it, at the band it reads in', () => {
  on();
  for (const el of LR.PROC_ELEMENTS) {
    const { it, line } = mintMagic(el);
    assert.deepEqual([line.id, line.param, line.value], ['elemental', el, LR.AFFIX_RANGES.elemental.magic[1]]);
    assert.deepEqual(WG.weaponElement(it), { element: el, total: 3 });
    assert.deepEqual(WG.weaponGlow(it, { on: true }), { look: el, level: 1 });
    // the blow's own reader agrees on the number
    assert.equal(LP.linesOf(it, 'elemental').filter((a) => a.param === el).reduce((n, a) => n + a.value, 0), 3);
  }
  // law 3: the bands' own edges
  assert.deepEqual(GL.GLOW_SPRITE_WINDOW.fire.length, 3);
  assert.deepEqual(WG.GLOW_LEVEL_EDGES, [LR.AFFIX_RANGES.elemental.magic[1], LR.AFFIX_RANGES.elemental.rare[1]]);
  assert.deepEqual([1, 3, 4, 6, 7, 10, 16].map(WG.glowLevel), [1, 1, 2, 2, 3, 3, 3]);
  // a weapon with no element shows nothing, and no other kind names one
  const plain = sword();
  LR.applyRarity(plain, 'magic', lcg(7));
  let i = 0; const seq = [0.3, 0.5];   // leech, the second kind
  assert.equal(LR.addProcLine(plain, () => seq[i++]).id, 'leech');
  assert.equal(WG.weaponElement(plain), null);
  assert.equal(WG.weaponGlow(plain, { on: true }), null);
});

test('WEAPON-GLOW1: gems count as the blow reads them - capped; the most wins, a tie in PROC_ELEMENTS\' order', () => {
  on();
  const tie = mintRare();
  LR.setGem(tie, 'sapphire'); LR.setGem(tie, 'ruby');   // frost 3 then fire 3: a tie, and fire is first
  assert.deepEqual(WG.weaponElement(tie), { element: 'fire', total: 3 });
  const more = mintRare();
  LR.setGem(more, 'ruby'); LR.setGem(more, 'perfect-sapphire');   // fire 3, frost 6
  assert.deepEqual(WG.weaponElement(more), { element: 'frost', total: 6 });
  assert.deepEqual(WG.weaponGlow(more, { on: true }), { look: 'frost', level: 2 });
  const capped = mintRare();
  LR.setGem(capped, 'perfect-ruby'); LR.setGem(capped, 'perfect-ruby');   // 6 + 6, and law 6 holds the gems to one Rare line
  assert.deepEqual(WG.weaponElement(capped), { element: 'fire', total: LR.gemPieceCap('elemental') });
  // a line and its gem together read past the Rare band: the Legendary's strength
  const { it } = mintMagic('fire');
  it.sockets = [LR.SOCKET_EMPTY];
  LR.setGem(it, 'perfect-ruby');
  assert.deepEqual(WG.weaponGlow(it, { on: true }), { look: 'fire', level: 3 });
});

test('WEAPON-GLOW1: law 4 - the outline says no more than the card; law 5 - the Morrowind hand\'s arcane', () => {
  on();
  const it = mintRare();
  LR.setGem(it, 'ruby');
  it.isIdentified = false;
  assert.ok(LR.isEnchanted?.(it) ?? (it.enchantments?.length > 0), 'a Rare carries its DFU enchantment');
  assert.equal(WG.weaponElement(it), null, 'unidentified, its lines are hidden');
  assert.equal(WG.spriteGlow(it, { on: true }), null, 'the classic hand swings what DFU swings');
  assert.equal(WG.meshGlow(it, { on: true }).look, 'arcane', 'the Morrowind hand glows as enchanted');
  it.isIdentified = true;
  assert.equal(WG.spriteGlow(it, { on: true }).look, 'fire');
  assert.equal(WG.meshGlow(it, { on: true }).look, 'fire');
  // a Magic piece carries no enchantment: no arcane for it, ever
  const plain = sword();
  LR.applyRarity(plain, 'magic', lcg(7));
  assert.equal(WG.meshGlow(plain, { on: true }), null);
});

test('WEAPON-GLOW1: the switch, its kill door and the ladder\'s own switch', () => {
  on();
  const { it } = mintMagic('shock');
  assert.ok(WG.weaponGlow(it));
  setPref(WG.WEAPON_GLOW_PREF, false);
  assert.equal(WG.weaponGlowOn(''), false);
  assert.equal(WG.weaponGlow(it), null);
  assert.equal(WG.spriteGlow(it), null);
  setPref(WG.WEAPON_GLOW_PREF, true);
  assert.equal(WG.weaponGlowOn(''), true);
  assert.equal(WG.weaponGlowOn('?weaponglow=off'), false, 'the kill door');
  assert.equal(WG.weaponGlow(it, { ladder: false }), null, 'the ladder off reads no line');
  // the Features row stores the switch's own key, on by default, the player's own online
  const row = FEATURES.find((f) => f.id === 'weapon-glow');
  assert.deepEqual([row.control.key, row.control.initial, row.control.online], [WG.WEAPON_GLOW_PREF, true, 'player']);
});

test('WEAPON-GLOW1: a spec is built once a look and level - the frame asks and allocates nothing', () => {
  const a = WG.glowSpec('fire', 2), b = WG.glowSpec('fire', 2);
  assert.equal(a, b);
  assert.ok(Object.isFrozen(a));
  assert.deepEqual([a.code, a.level, [...a.ramp], a.win], [WG.GLOW_CODE.fire, 2, WG.GLOW_RAMPS.fire.flat().map(Math.fround), GL.GLOW_SPRITE_WINDOW.fire]);
  assert.equal(WG.glowSpec('none', 1), null);
  assert.equal(WG.glowSpec('poison', 1), null, 'no element but the blow\'s three and the arcane');
  assert.deepEqual(WG.GLOW_LOOKS, ['none', 'fire', 'frost', 'shock', 'arcane']);
  for (const look of ['fire', 'frost', 'shock', 'arcane']) {
    const r = WG.GLOW_RAMPS[look];
    assert.equal(r.length, 4);
    const lum = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
    for (let i = 1; i < 4; i++) assert.ok(lum(r[i]) > lum(r[i - 1]), `${look}: the ramp climbs, dark to hot`);
  }
});

test('WEAPON-GLOW1: the classic hand swings the PLAIN sheet while an element shows', () => {
  const T = WEAPON_TYPES;
  assert.deepEqual(
    ['LongBlade', 'Staff', 'Dagger', 'Mace', 'Flail', 'Warhammer', 'Battleaxe', 'Thunderlock'].map((k) => plainWeaponType(T[`${k}_Magic`])),
    ['LongBlade', 'Staff', 'Dagger', 'Mace', 'Flail', 'Warhammer', 'Battleaxe', 'Thunderlock'].map((k) => T[k]));
  for (const k of ['LongBlade', 'Bow', 'Melee', 'Werecreature', 'None']) assert.equal(plainWeaponType(T[k]), T[k]);
  // Diverse Weapons asks its plain set too, and the item's own answer is unchanged when nothing is said
  on();
  const it = mintRare();
  assert.equal(weaponTypeForItem(it), T.LongBlade_Magic);
  assert.equal(moddedWeaponFilename(it), 'LONGSWORDMAGIC.CIF');
  assert.equal(moddedWeaponFilename(it, false), 'LONGSWORD.CIF');
  assert.equal(atlasFileName(it, 'WEAPON04.CIF', true, false), 'LONGSWORD.CIF');
  assert.equal(atlasFileName(it, 'WEAPON04.CIF', true), 'LONGSWORDMAGIC.CIF');
  // the rig: one ask a frame, the art's type and key and loader all off it, the clone told the plain set
  const rig = strip(read('src/combat/weaponRig.js'));
  assert.match(rig, /const askHeld = \(\) => \{ heldFor = playerWeapon\.weapon; heldGlow = spriteGlow\(heldFor\); \};/);
  assert.match(rig, /const glowOf = \(item\) => \(item && item === heldFor \? heldGlow : spriteGlow\(item\)\);/, 'the weapon it was asked of, never another\'s');
  assert.match(rig, /const heldGlowNow = \(\) => \{ if \(playerWeapon\.weapon !== heldFor\) askHeld\(\); return heldGlow; \};/);
  assert.match(rig, /syncWorn\(\);[^\n]*\n\s*askHeld\(\);/, 'asked once a frame, after the hand is synced');
  assert.match(rig, /const heldType = \(item\) => \(glowOf\(item\) \? plainWeaponType\(weaponTypeForItem\(item\)\) : weaponTypeForItem\(item\)\);/);
  assert.match(rig, /const plain = !!glowOf\(item\);\s*const type = heldType\(item\);/);
  assert.match(rig, /atlasFileName\(item, WEAPON_FILE\[type\] \?\? '', undefined, plain \? false : undefined\)/);
  assert.match(rig, /loadFpsWeaponArt\(fetchBytes, palette, renderer, type, item\?\.material \?\? 0, item, \{ plain \}\)/);
  assert.match(rig, /weaponType: heldType\(playerWeapon\.weapon\), material: playerWeapon\.weapon\?\.material \?\? -1, glow: heldGlowNow\(\),/, 'the clone told the set and the outline');
  assert.match(rig, /renderer\.drawScreenQuad\(tex, rect, undefined, lit \?\? undefined\);\s*const elementGlow = heldGlowNow\(\);[^\n]*\n\s*if \(elementGlow\) renderer\.drawScreenQuadGlow\?\.\(tex, rect, undefined, elementGlow\);/, 'the Thunderlock\'s frame, then its outline');
  assert.match(rig, /\{ tint: fpTint, offsetHeight: weaponOffsetHeight\(\) - climbDrop\(_climbLower, c\.height\), glow: heldGlowNow\(\) \}/);
  const widget = strip(read('src/combat/weaponWidget.js'));
  assert.match(widget, /renderer\.drawScreenQuad\(tex, getWeaponRect\(\), w\.curAnimRect, tint \?\? undefined\);\s*if \(ctx\.glow\) renderer\.drawScreenQuadGlow\?\.\(tex, getWeaponRect\(\), w\.curAnimRect, ctx\.glow\);/, 'the clone\'s frame, then its outline, on its rect and mirror');
  assert.match(rig, /fpArm\.setWeaponGlow\?\.\(meshGlow\(playerWeapon\.weapon\)\);/);
  assert.match(strip(read('src/combat/weaponWidget.js')), /atlasFileName\(w\.specificWeapon, classic, undefined, ctx\?\.glow \? false : undefined\)/);
});

test('WEAPON-GLOW1: drawFpsWeapon draws the outline over the frame - its rect, its mirror, after the frame', () => {
  const calls = [];
  const renderer = {
    drawScreenQuad: (tex, rect, src, tint) => calls.push(['quad', tex, rect, src, tint]),
    drawScreenQuadGlow: (tex, rect, src, glow) => calls.push(['glow', tex, rect, src, glow]),
  };
  const art = { weaponType: WEAPON_TYPES.LongBlade, anims: getWeaponAnims(WEAPON_TYPES.LongBlade), records: Array.from({ length: 7 }, (_, r) => ({ width: 100, height: 80, frames: [`r${r}f0`, `r${r}f1`, `r${r}f2`, `r${r}f3`, `r${r}f4`] })) };
  const spec = WG.glowSpec('fire', 2);
  drawFpsWeapon(renderer, { width: 640, height: 400 }, art, 'Idle', 0, { flipHorizontal: true, offsetHeight: 0, tint: [0.5, 0.5, 0.5], glow: spec });
  assert.deepEqual(calls.map((c) => c[0]), ['quad', 'glow']);
  assert.equal(calls[1][1], calls[0][1], 'the same frame');
  assert.deepEqual(calls[1][2], calls[0][2], 'the same rect');
  assert.deepEqual(calls[1][3], calls[0][3], 'the same mirror');
  assert.deepEqual(calls[1][3], { u0: 1, v0: 0, u1: 0, v1: 1 });
  assert.equal(calls[1][4], spec);
  calls.length = 0;
  drawFpsWeapon(renderer, { width: 640, height: 400 }, art, 'Idle', 0, { flipHorizontal: false, offsetHeight: 0 });
  assert.deepEqual(calls.map((c) => c[0]), ['quad'], 'no glow, no second draw');
});

/** A WebGL2 stub that RECORDS: every call's name and arguments, an enum read as its own name. */
function loggingRenderer() {
  const log = [];
  let id = 0;
  const stub = new Proxy({}, {
    get: (o, k) => {
      if (k === 'getProgramParameter' || k === 'getShaderParameter') return () => true;
      if (k === 'getUniformLocation') return (p, name) => ({ uniform: name });
      if (k === 'getAttribLocation') return () => 0;
      if (typeof k === 'string' && k.startsWith('create')) return () => ({ id: ++id, kind: k });
      if (k === 'drawingBufferWidth') return 800;
      if (k === 'drawingBufferHeight') return 600;
      if (typeof k === 'string' && k.toUpperCase() === k) return k;
      return (...args) => { log.push([k, ...args]); };
    },
  });
  const canvas = { getContext: () => stub, clientWidth: 800, clientHeight: 600, width: 800, height: 600 };
  return { r: new Renderer(canvas), log };
}
const I = () => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

test('WEAPON-GLOW1: drawScreenQuadGlow - the fourth 2D primitive: its program, the window as its pad, premultiplied', () => {
  const { r, log } = loggingRenderer();
  r.beginFrame(I(), I(), new Float32Array([0, 1, 0]));
  const tex = { id: 'frame' };
  const spec = WG.glowSpec('fire', 3);
  r.setScreenOffset?.(10, 20);
  log.length = 0;
  r.drawScreenQuadGlow(tex, { x: 100, y: 50, w: 300, h: 240 }, { u0: 1, v0: 0, u1: 0, v1: 1 }, spec);
  const names = log.map((c) => c[0]);
  const draw = names.indexOf('drawElements');
  assert.ok(draw > 0, 'it draws');
  assert.equal(names.filter((n) => n === 'drawElements').length, 1);
  const uni = (name) => log.find((c) => c[1]?.uniform === name);
  assert.deepEqual(uni('uDst').slice(2), [110, 70, 300, 240], 'the rect, the screen offset on it');
  assert.deepEqual(uni('uSrc').slice(2), [1, 0, 0, 1], 'the mirror');
  const [wx, up, down] = GL.GLOW_SPRITE_WINDOW.fire;
  assert.deepEqual(uni('uWin').slice(2), [wx, up, down]);
  assert.deepEqual(uni('uPad').slice(2), [wx, down, wx, up], 'the top grows by the rows a texel looks down');
  assert.deepEqual([uni('uLook')[2], uni('uLevel')[2]], [WG.GLOW_CODE.fire, 3]);
  assert.equal(uni('uRamp')[2], spec.ramp);
  const blendAt = log.findIndex((c) => c[0] === 'blendFunc' && c[1] === 'ONE' && c[2] === 'ONE_MINUS_SRC_ALPHA');
  assert.ok(blendAt >= 0 && blendAt < draw, 'premultiplied, set before the draw');
  assert.ok(log.slice(draw).some((c) => c[0] === 'blendFunc' && c[1] === 'SRC_ALPHA'), 'and the blend handed back');
  assert.ok(log.slice(draw).some((c) => c[0] === 'disable' && c[1] === 'BLEND'));
  assert.ok(log.slice(0, draw).some((c) => c[0] === 'useProgram' && c[1] === r.weaponGlowQuadProgram), 'its own program');
  // nothing to draw without a glow, a texture or a look
  log.length = 0;
  r.drawScreenQuadGlow(tex, { x: 0, y: 0, w: 1, h: 1 }, undefined, null);
  r.drawScreenQuadGlow(null, { x: 0, y: 0, w: 1, h: 1 }, undefined, spec);
  assert.equal(log.filter((c) => c[0] === 'drawElements').length, 0);
  // the source law's own list knows it
  assert.match(read('test/glstate.test.js'), /'drawScreenQuadGlow'/);
});

test('WEAPON-GLOW1: the Morrowind pass - rings before the body, the charge after, the weapon\'s shown ranges alone', () => {
  const { r, log } = loggingRenderer();
  r.beginFrame(I(), I(), new Float32Array([0, 1, 0]));
  const ranges = [
    { first: 0, count: 30, slot: 'body', tex: null },
    { first: 30, count: 12, slot: 'weapon', tex: null },
    { first: 42, count: 6, slot: 'arrow', tex: null },
    { first: 48, count: 9, slot: 'weapon', tex: null, hidden: true },
  ];
  const mesh = { vao: { id: 'arm' }, ranges, weaponGlow: WG.glowSpec('fire', 2) };
  const draws = () => log.filter((c) => c[0] === 'drawArrays').map((c) => [c[2], c[3]]);
  // outside a sprite pass (the world pass): none
  log.length = 0;
  r.drawCharacter(mesh, I());
  assert.deepEqual(draws(), [[0, 30], [30, 12], [42, 6]], 'the world pass draws the body alone');
  // in the real sprite pass (the arm's picture, a third-person body's)
  log.length = 0;
  r.renderCharacterSprite(mesh, I(), I(), I(), 800, 600);
  const ringDraws = GL.glowRingDraws('fire').length;
  const got = draws();
  assert.deepEqual(got.slice(0, ringDraws), Array(ringDraws).fill([30, 12]), 'every ring draw is the shown weapon range');
  assert.deepEqual(got.slice(ringDraws, ringDraws + 3), [[0, 30], [30, 12], [42, 6]], 'then the body');
  assert.deepEqual(got.slice(ringDraws + 3), [[30, 12]], 'then the charge');
  const firstBody = log.findIndex((c) => c[0] === 'drawArrays' && c[2] === 0);
  const charge = log.findLastIndex((c) => c[0] === 'drawArrays');
  const between = log.slice(firstBody, charge);
  assert.ok(between.some((c) => c[0] === 'colorMask' && c[4] === false), 'the charge leaves alpha alone');
  assert.ok(between.some((c) => c[0] === 'blendFunc' && c[1] === 'ONE' && c[2] === 'ONE'), 'additive');
  assert.ok(between.some((c) => c[0] === 'depthFunc' && c[1] === 'LEQUAL'));
  const after = log.slice(charge);
  for (const want of [['depthFunc', 'LESS'], ['depthMask', true], ['colorMask', true, true, true, true], ['disable', 'BLEND']]) {
    assert.ok(after.some((c) => want.every((v, i) => c[i] === v)), `handed back: ${want.join(' ')}`);
  }
  assert.ok(after.some((c) => c[0] === 'useProgram' && c[1] === r.charProgram), 'charProgram back for drawCharacter\'s own lines');
  // each ring's depth is at the back of the pass, an outer one farther
  const fars = log.filter((c) => c[0] === 'uniform1f' && c[1]?.uniform === 'uGlowFar').map((c) => c[2]);
  const ringFars = fars.slice(0, GL.GLOW_RINGS.length * GL.GLOW_DIRS).filter((_, i) => i % GL.GLOW_DIRS === 0);
  assert.deepEqual(ringFars, GL.GLOW_RINGS.map((d) => GL.GLOW_RING_FAR + d * GL.GLOW_RING_STEP));
  assert.ok(ringFars.every((f, i) => i === 0 || f < ringFars[i - 1]) && ringFars.every((f) => f < 1), 'outer first, farther; inside the clip');
  // the weapon sheathed: nothing of the glow
  log.length = 0;
  r.renderCharacterSprite({ ...mesh, ranges: ranges.map((x) => (x.slot === 'weapon' ? { ...x, hidden: true } : x)) }, I(), I(), I(), 800, 600);
  assert.deepEqual(draws(), [[0, 30], [42, 6]]);
  // a picture read back (the inventory's figure, an icon - the studio bake) is a still: no glow is baked into it
  log.length = 0;
  try { r.renderCharacterSpriteImage(mesh, I(), I(), I(), 800, 600); } catch { /* the stub reads back no pixels to make an image of */ }
  assert.deepEqual(draws(), [[0, 30], [30, 12], [42, 6]], 'a read-back draws the body alone');
  // and after the passes, the world's draw is the body alone again
  log.length = 0;
  r.drawCharacter(mesh, I());
  assert.deepEqual(draws(), [[0, 30], [30, 12], [42, 6]], 'the passes leave nothing on');
  // the two sprite passes say their pixels before they draw
  const rs = strip(read('src/render/renderer.js'));
  assert.match(rs, /this\._glowVpW = pw; this\._glowVpH = ph;[^\n]*\n\s*try \{\s*this\.drawCharacter\(mesh, modelMatrix\);/);
  assert.match(rs, /this\._glowVpW = it\.pw; this\._glowVpH = it\.ph;[^\n]*\n\s*this\.drawCharacter\(it\.mesh, it\.model\);/);
});

test('WEAPON-GLOW1: the rings - outermost first, round every direction, fire stretched up, its embers last', () => {
  for (const look of ['frost', 'shock', 'arcane']) {
    const d = GL.glowRingDraws(look);
    assert.equal(d.length, GL.GLOW_RINGS.length * GL.GLOW_DIRS);
    for (let k = 0; k < GL.GLOW_RINGS.length; k++) {
      const ring = d.slice(k * GL.GLOW_DIRS, (k + 1) * GL.GLOW_DIRS);
      assert.ok(ring.every((x) => x.ring === GL.GLOW_RINGS[k]));
      assert.ok(ring.every((x) => Math.abs(Math.hypot(...x.shift) - x.ring) < 1e-9), `${look}: a ring is round`);
    }
  }
  assert.deepEqual([...GL.GLOW_RINGS], [...GL.GLOW_RINGS].sort((a, b) => b - a), 'outermost first');
  const fire = GL.glowRingDraws('fire');
  const up = fire.find((x) => x.ring === 1 && Math.abs(x.shift[0]) < 1e-9 && x.shift[1] > 0);
  const down = fire.find((x) => x.ring === 1 && Math.abs(x.shift[0]) < 1e-9 && x.shift[1] < 0);
  assert.ok(Math.abs(up.shift[1] - GL.GLOW_FIRE_UP) < 1e-9 && Math.abs(down.shift[1] + GL.GLOW_FIRE_DOWN) < 1e-9);
  const embers = fire.filter((x) => x.ring === -1);
  assert.equal(embers.length, GL.GLOW_EMBER_RISE.length * 3);
  assert.deepEqual(fire.slice(-embers.length), embers, 'the embers last');
  // the third-person window has room for the reach it draws
  assert.ok(GL.GLOW_BOX_GROW / 2 >= Math.max(GL.GLOW_RINGS[0] * GL.GLOW_FIRE_UP, ...GL.GLOW_EMBER_RISE) / GL.GLOW_UNIT_ROWS);
});

test('WEAPON-GLOW1: the Morrowind vertex shader is the body\'s own, shifted after - and refuses a source it cannot edit', () => {
  const body = 'out vec3 vEmissive;\nvoid main() {\n  vec4 world = vec4(0.0);\n  gl_Position = uProj * uView * world;\n}';
  const vs = GL.glowMeshVs(body);
  const at = vs.indexOf('gl_Position = uProj * uView * world;');
  assert.ok(at > 0 && vs.indexOf('gl_Position.xy += uGlowShift * gl_Position.w;') > at, 'the body\'s expression first');
  assert.match(vs, /uniform vec2 uGlowShift;\nuniform float uGlowFar;\nuniform float uGlowPull;/);
  assert.throws(() => GL.glowMeshVs('void main() {}'), /WEAPON-GLOW1/);
  assert.throws(() => GL.glowMeshVs(`${body}\n${body}`), /WEAPON-GLOW1/);
  // and the renderer's own vertex shader carries both needles once (it builds from it)
  assert.match(read('src/render/renderer.js'), /this\._buildProgram\(glowMeshVs\(CHAR_SKIN_VS\), GLOW_MESH_FS\)/);
});

test('WEAPON-GLOW1: the clock - every scroll whole over the period, its noise periodic over the rows it scrolls', () => {
  const P = GL.GLOW_CLOCK_PERIOD;
  const src = GL.GLOW_LOOK_GLSL;
  // a scroll: `... - t * K), py)` - K x P rows a period, and the noise repeats over exactly those
  const scrolls = [...src.matchAll(/- t \* ([\d.]+)\), ([\d.]+)\)/g)].map((m) => [Number(m[1]), Number(m[2])]);
  assert.ok(scrolls.length >= 4, `the scrolls are found (${scrolls.length})`);
  for (const [k, py] of scrolls) assert.equal(k * P, py, `a scroll of ${k} a second wraps at ${py} rows`);
  // a pulse: sin(t * w ...) - a whole number of turns a period
  const pulses = [...src.matchAll(/sin\(t \* ([\d.]+)/g)].map((m) => Number(m[1]));
  assert.ok(pulses.length >= 3);
  for (const w of pulses) { const turns = (w * P) / (2 * Math.PI); assert.ok(Math.abs(turns - Math.round(turns)) < 1e-4, `${w}: ${turns} turns`); }
  // a step: floor(t * n) - whole steps a period
  for (const m of src.matchAll(/floor\(t \* ([\d.]+)\)/g)) assert.equal((Number(m[1]) * P) % 1, 0);
  // the embers' rise counts its steps over the same modulus
  assert.match(src, /mod\(floor\(c\.y\) - floor\(t \* 6\.0\), 1440\.0\)/);
  assert.equal(6 * P, 1440);
  // and the renderer wraps its seconds there
  assert.ok(read('src/render/renderer.js').includes('export const glowSeconds = (now = globalThis.performance?.now?.() ?? Date.now()) => (now / 1000) % GLOW_CLOCK_PERIOD;'));
});

test('WEAPON-GLOW1: the wire carries the word - a weapon\'s alone, omitted when none; a peer\'s body reads it', () => {
  on();
  const base = { templateIndex: 120, group: 'Weapons', equipSlot: 3 };
  assert.equal(validLookItem({ ...base, glow: 'fire2' }).glow, 'fire2');
  for (const bad of ['fire4', 'poison1', 'FIRE2', ' fire2', 2, null]) assert.equal('glow' in validLookItem({ ...base, glow: bad }), false, String(bad));
  assert.equal('glow' in validLookItem({ templateIndex: 102, group: 'Armor', equipSlot: 1, glow: 'fire2' }), false, 'a weapon\'s alone');
  assert.deepEqual(Object.keys(validLookItem(base)), ['templateIndex', 'group', 'equipSlot'], 'a plain weapon keeps its bytes');
  assert.deepEqual(['fire1', 'frost2', 'shock3', 'arcane2'].map((w) => LOOK_GLOW_RE.test(w)), [true, true, true, true]);
  // the owner's look says it - from the card, whatever the owner's own switch
  const body = () => ({ isPlayer: true, items: [], race: 'Breton', gender: 'male', faceIndex: 0, stats: {}, skills: new Array(35).fill(30), career: {}, activeEffects: [] });
  const me = body();
  const { it } = mintMagic('frost');
  me.items.push(it); equipItem(me, it);
  setPref(WG.WEAPON_GLOW_PREF, false);
  const look = validLook(composeLook(me, { eotbSet: null }));
  const held = look.items.find((x) => x.group === 'Weapons');
  assert.equal(held.glow, 'frost1');
  assert.equal(held.glow, WG.glowWord(WG.meshGlow(it, { on: true })));
  setPref(WG.WEAPON_GLOW_PREF, true);
  // a foe's look says nothing - its kit's record carries no glow, so no screen draws one
  const foe = { ...body(), isPlayer: false };
  const { it: foeSword } = mintMagic('fire');
  foe.items.push(foeSword); equipItem(foe, foeSword);
  assert.equal('glow' in composeLook(foe, { eotbSet: null }).items.find((x) => x.group === 'Weapons'), false);
  // a plain weapon says nothing
  const you = body();
  const bare = sword(); you.items.push(bare); equipItem(you, bare);
  assert.equal('glow' in composeLook(you, { eotbSet: null }).items.find((x) => x.group === 'Weapons'), false);
  // the peer's stand-in keeps it, and the word reads back to the spec
  const stub = peerStubEntity(look);
  assert.equal(stub.items.find((x) => x.group === 'Weapons').glow, 'frost1');
  assert.equal(WG.glowFromWord('frost1'), WG.glowSpec('frost', 1));
  assert.equal(WG.glowFromWord('frost9'), null);
  // and the body reads it off the look now, by MY switch
  const pb = strip(read('src/net/peerBodies.js'));
  assert.match(pb, /const heldNow = look && !look\.creature && !b\.wolf && !tool \? peerWeaponOf\(look, shown\) : null;/);
  assert.match(pb, /b\.rig\.setWeaponGlow\?\.\(heldNow && weaponGlowOn\(\) \? glowFromWord\(heldNow\.glow\) : null\);/);
});

test('WEAPON-GLOW1: the arm lays the glow on the mesh it draws - first person and third', () => {
  const arm = strip(read('src/combat/fpArm.js'));
  assert.match(arm, /setWeaponGlow\(spec\) \{ weaponGlowSpec = spec \?\? null; \},/);
  assert.match(arm, /mesh\.weaponGlow = weaponGlowSpec;\s*const tex = renderer\.renderCharacterSprite\(mesh,/);
  assert.match(arm, /thirdMesh\.weaponGlow = weaponGlowSpec;\s*const glowGrow = weaponGlowSpec \? GLOW_BOX_GROW : 0;/);
  assert.match(arm, /const halfH = halfH0 \* \(1 \+ glowGrow\);/);
});
