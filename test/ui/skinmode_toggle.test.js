// LAYERED-GEAR, THE LOOK TOGGLE (2026-10-19, the owner, merging the Layered Gearing package: "These need a proper
// toggle in the account profile for players to either equip skins or use this integration").
//
// The profile's Skin card (ui/skinCard.js) opens on Look: Skins | Layered Gearing (WIP), a radio pair. Skins is the
// card as SKIN2 laid it out - On foot and Mounted. Layered Gearing writes Graphics.LayeredGear (1 female, 2 male), puts
// the On foot panel away (it is not what the player is drawn as on foot), offers the two bodies as pictures, and keeps
// the Mounted panel (a rider has no layered art). Turned on, it wears the body last chosen this session, else the
// character's own; turned off it writes 0, and the on-foot skin chosen before is worn again, untouched.
// Pinned through the real card over a fake document, as SKIN2's pins drive it (bible/04-Characters/Layered-Gearing.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { modSetting, setModSetting, _resetModSettings } from '../../src/systems/modSettings.js';
import { skinCard, layeredBodyToWear, _resetSkinCardBody } from '../../src/ui/skinCard.js';
import { ENHANCED_CSS } from '../../src/ui/enhanced/enhancedStyle.js';

const V = 'eye-of-the-beholder';
const LG = 'Graphics.LayeredGear';

function fakeEl(tag) {
  let text = '';
  const n = {
    tag, children: [], className: '', title: '', attrs: {}, type: '', src: '', alt: '',
    get textContent() { return text; },
    set textContent(v) { text = v; n.children.length = 0; },
    append(...cs) { for (const c of cs) { n.children.push(c); c.parent = n; } },
    setAttribute(k, v) { n.attrs[k] = v; },
  };
  return n;
}
const doc = /** @type {any} */ ({ createElement: fakeEl });
const find = (n, cls, out = []) => {
  if (typeof n.className === 'string' && n.className.split(/\s+/).includes(cls)) out.push(n);
  for (const c of n.children ?? []) find(c, cls, out);
  return out;
};
const fresh = () => { _resetModSettings(); _resetSkinCardBody(); };
/** The card's parts, read off its tree as a player sees it. */
const parts = (card) => ({
  radios: find(card.root, 'skinmodebtn'),
  checked: find(card.root, 'skinmodebtn').filter((b) => b.attrs['aria-checked'] === 'true').map((b) => b.textContent),
  panels: find(card.root, 'skinhead').map((h) => find(h, 'fieldlabel')[0].textContent),
  bodies: find(card.root, 'skingrid').filter((g) => g.attrs['aria-label'] === 'Body').flatMap((g) => g.children),
});
const radio = (card, word) => parts(card).radios.find((b) => b.textContent === word);
const body = (card, word) => parts(card).bodies.find((b) => find(b, 'skinname')[0].textContent === word);

test('SKIN-MODE THE TOGGLE: the card opens on Look - Skins and Layered Gearing (WIP), a radio pair, Skins chosen while the setting is 0; Skins is the On foot and Mounted panels and no body (mutants: SKINMODE-onfoot-in-layered, SKINMODE-toggle-gone)', () => {
  fresh();
  const card = skinCard(doc);
  const set = find(card.root, 'skinmodeset')[0];
  assert.equal(set.attrs.role, 'radiogroup');
  assert.equal(set.attrs['aria-label'], 'Look');
  assert.equal(find(card.root, 'skinmode')[0].children[0].textContent, 'Look', 'the label a player reads');
  const p = parts(card);
  assert.deepEqual(p.radios.map((b) => b.textContent), ['Skins', 'Layered Gearing (WIP)']);
  assert.deepEqual(p.radios.map((b) => b.attrs.role), ['radio', 'radio']);
  assert.deepEqual(p.checked, ['Skins']);
  assert.ok(p.radios[0].className.includes('on') && !p.radios[1].className.includes('on'), 'the chosen one in brass');
  assert.deepEqual(p.panels, ['On foot', 'Mounted'], 'Skins: the card SKIN2 laid out');
  assert.equal(p.bodies.length, 0, 'no body to choose');
  fresh();
});

test('SKIN-MODE LAYERED GEARING: pressed, it wears the character\'s own body; the On foot panel is put away, the two bodies offered as pictures and the worn one marked, Mounted kept; a body pressed is worn (mutants: SKINMODE-on-writes-off, SKINMODE-gender-unread, SKINMODE-body-grid-gone)', () => {
  fresh();
  const card = skinCard(doc, { gender: () => 'male' });
  radio(card, 'Layered Gearing (WIP)').onclick();
  assert.equal(modSetting(V, LG), 2, 'the character\'s own body: male');
  let p = parts(card);
  assert.deepEqual(p.checked, ['Layered Gearing (WIP)']);
  assert.deepEqual(p.panels, ['Mounted'], 'the On foot panel put away; Mounted as ever');
  assert.deepEqual(p.bodies.map((b) => find(b, 'skinname')[0].textContent), ['Female', 'Male'], 'the two bodies, never "Off"');
  assert.deepEqual(p.bodies.map((b) => b.attrs['aria-pressed']), ['false', 'true']);
  assert.ok(find(card.root, 'meta').some((m) => /helmet, chest and leg armor you wear/.test(m.textContent)), 'it says what it draws');
  assert.equal(find(card.root, 'skinhint').length, 0, 'the class hint is the Skins look\'s');
  body(card, 'Female').onclick();
  assert.equal(modSetting(V, LG), 1);
  p = parts(card);
  assert.deepEqual(p.bodies.map((b) => b.attrs['aria-pressed']), ['true', 'false']);
  // the other way: a female character
  fresh();
  const her = skinCard(doc, { gender: () => 'female' });
  radio(her, 'Layered Gearing (WIP)').onclick();
  assert.equal(modSetting(V, LG), 1);
  fresh();
});

test('SKIN-MODE BACK TO SKINS AND ON AGAIN: Skins writes 0 and the on-foot skin chosen before is still worn; Layered Gearing again wears the body last chosen, not the character\'s; a press on the chosen radio changes nothing; no character, the female body (mutants: SKINMODE-off-writes-body, SKINMODE-last-body-forgotten)', () => {
  fresh();
  setModSetting(V, 'Graphics.OnFoot', 5);
  const card = skinCard(doc, { gender: () => 'male' });
  radio(card, 'Layered Gearing (WIP)').onclick();
  body(card, 'Female').onclick();
  radio(card, 'Skins').onclick();
  assert.equal(modSetting(V, LG), 0, 'off');
  assert.equal(modSetting(V, 'Graphics.OnFoot'), 5, 'the on-foot skin untouched');
  assert.deepEqual(parts(card).panels, ['On foot', 'Mounted']);
  radio(card, 'Skins').onclick();
  assert.equal(modSetting(V, LG), 0, 'the chosen radio pressed: nothing');
  radio(card, 'Layered Gearing (WIP)').onclick();
  assert.equal(modSetting(V, LG), 1, 'the body last chosen this session, not the male character\'s own');
  // and a card opened later in the session remembers it too
  setModSetting(V, LG, 0);
  const later = skinCard(doc, { gender: () => 'male' });
  radio(later, 'Layered Gearing (WIP)').onclick();
  assert.equal(modSetting(V, LG), 1);
  // a stored choice opens the card on Layered Gearing, and is the one remembered
  fresh();
  setModSetting(V, LG, 2);
  const stored = skinCard(doc, { gender: () => 'female' });
  assert.deepEqual(parts(stored).checked, ['Layered Gearing (WIP)']);
  radio(stored, 'Skins').onclick();
  radio(stored, 'Layered Gearing (WIP)').onclick();
  assert.equal(modSetting(V, LG), 2);
  fresh();
  assert.equal(layeredBodyToWear(undefined), 1, 'no character: the female body');
  assert.equal(layeredBodyToWear('male'), 2);
  fresh();
});

test('SKIN-MODE with the mod off: no toggle - the card offers the switch alone, as before', () => {
  fresh();
  setModSetting(V, 'Enabled', false);
  const card = skinCard(doc);
  assert.equal(find(card.root, 'skinmode').length, 0);
  assert.equal(find(card.root, 'skinhead').length, 0);
  fresh();
});

test('SKIN-MODE the toggle is styled: two presses side by side, the chosen one in brass, a focus ring', () => {
  const rule = (sel) => {
    const m = ENHANCED_CSS.match(new RegExp(`(?:^|\\n)${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`));
    assert.ok(m, `${sel} is styled`);
    return m[1];
  };
  assert.match(rule('.card .skinmodeset'), /display: flex;/);
  assert.match(rule('.card button.skinmodebtn.on'), /border-color: var\(--brass\);/);
  assert.match(rule('.card button.skinmodebtn:focus-visible'), /outline: 2px solid var\(--brass\);/);
});
