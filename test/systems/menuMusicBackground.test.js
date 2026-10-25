// B-027: REDESIGN BACKGROUND MUSIC — source sweep.
//
// The actual audio lifecycle is proven in a browser by
// tools/uiRedesignProbe.mjs; this file holds the structural rules that
// a source sweep CAN hold: the helpers exist, the mute button is
// accessible, the session is torn down, and the redesign CSS carries
// the button's rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

test('enhancedMenu imports the intro theme and exposes music helpers', () => {
  const src = read('src/ui/enhanced/enhancedMenu.js');
  assert.match(src, /import \{ IntroTheme, MENU_THEME_GAIN \} from '\.\.\/\.\.\/systems\/introTheme\.js'/);
  assert.match(src, /function ensureMusic\(\)/);
  assert.match(src, /async function unlockMusic\(\)/);
  assert.match(src, /function toggleMute\(\)/);
  assert.match(src, /function muteButton\(\)/);
});

test('enhancedMenu creates an accessible mute button', () => {
  const src = read('src/ui/enhanced/enhancedMenu.js');
  const body = src.slice(src.indexOf('function muteButton'), src.indexOf('function renderHome'));
  assert.match(body, /aria-label/);
  assert.match(body, /aria-pressed/);
  assert.match(body, /px-mute/);
});

test('enhancedMenu disposes the music session on unmount', () => {
  const src = read('src/ui/enhanced/enhancedMenu.js');
  assert.match(src, /if \(introTheme\) \{ introTheme\.dispose\(\); introTheme = null; musicMuted = false; \}/);
});

test('enhancedChargen also imports the intro theme and exposes music helpers', () => {
  const src = read('src/ui/enhanced/enhancedChargen.js');
  assert.match(src, /import \{ IntroTheme, MENU_THEME_GAIN \} from '\.\.\/\.\.\/systems\/introTheme\.js'/);
  assert.match(src, /function ensureMusic\(\)/);
  assert.match(src, /function muteButton\(\)/);
  assert.match(src, /if \(introTheme\) \{ introTheme\.dispose\(\); introTheme = null; musicMuted = false; \}/);
});

test('redesign CSS carries the mute button and fog ground rules', () => {
  const src = read('src/ui/enhanced/enhancedStyle.js');
  const css = src.slice(src.indexOf('export const REDESIGN_CSS'));
  assert.match(css, /\.redesign \.px-mute/);
  assert.match(css, /\.redesign \.px-ground/);
  assert.match(css, /\.redesign \.px-fog/);
  assert.match(css, /redesign \.px-wordmark/);
});

test('enhancedStyle exposes a redesign predicate and redesign font URL', () => {
  const src = read('src/ui/enhanced/enhancedStyle.js');
  assert.match(src, /export const REDESIGN_FONTS_URL/);
  assert.match(src, /export const isRedesign/);
  assert.match(src, /isRedesign\(search\) \? REDESIGN_CSS : ''/);
});
