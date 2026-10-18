// SPEC-RESET (2026-10-18, the owner: "Lets allow players to reset their ingame builds for a high cost"; asked, the owner
// chose the specialisations and 200k; bible/10-UI/Growth.md section 10). Pinned here:
//   the law     a family's path given up for SPEC_RESET_GOLD (systems/specReset.js) - paid as every purchase is paid
//               (court.js deductGold: the coins, else the letters and then the coins), refused short of coins and letters
//               together or with nothing held; the masteries, the other family and the spellbook untouched
//   the save    a reset path saves as none and loads as none - no mirror or witness gives it back
//   the guide   the chosen path's Reset (ui/growth/specGuide.js): its ask, what it leaves, its refusals, driven in the
//               pause window over the fake document (last: its globals stand for the rest of the file)
import '../../modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { playerEntity } from '../../../src/characters/playerEntity.js';
import { createCharacter } from '../../../src/systems/chargen.js';
import { SKILLS } from '../../../src/systems/skills.js';
import { masterSkill } from '../../../src/systems/masterSkills.js';
import { LETTER_OF_CREDIT_TEMPLATE } from '../../../src/systems/inventory.js';
import { totalGoldAmount } from '../../../src/systems/court.js';
import * as AP from '../../../src/systems/arcanePaths.js';
import * as MP from '../../../src/systems/martialPaths.js';
import { specResetRefusal, resetSpec, resetHeld } from '../../../src/systems/specReset.js';
import { signatureSpell } from '../../../src/systems/signatureSpells.js';
import { snapshotPlayer, restorePlayer } from '../../../src/systems/save/save.js';
import { specGuideModel } from '../../../src/ui/growth/specGuide.js';
import { growthDue } from '../../../src/ui/growth/growthTab.js';
import { dropStage } from '../../../src/ui/growth/growthStage.js';
import { _resetForTests } from '../../../src/systems/uiPrefs.js';

const { LongBlade: LB, ShortBlade: SB, Archery: AR, Axe: AX, Destruction: DES, Restoration: RES, Alteration: ALT, Mysticism: MYS, Illusion: ILL } = SKILLS;

/** A made character of the given career groups, every skill at 30, `mastered` mastered (growth1_tab's hero). */
function hero({ primary, major, minor, mastered = [] }) {
  const p = structuredClone(playerEntity);
  createCharacter(p, { name: 'Tester', hp: 12, primarySkills: primary, majorSkills: major, minorSkills: minor,
    stats: { strength: 50, intelligence: 50, willpower: 50, agility: 50, endurance: 50, personality: 50, speed: 50, luck: 50 } }, -1, { rolls: () => 0.5 });
  p.career = { ...p.career, primarySkills: primary, majorSkills: major, minorSkills: minor };
  p._online = true; p.level = 20;
  p.skills = p.skills.map(() => 30);
  for (const s of mastered) { p.skills[s] = 100; assert.equal(masterSkill(p, s).ok, true, `master ${s}`); }
  return p;
}
/** A spellsword: Long Blade, Archery and Destruction primary; Restoration, Alteration and Axe major; Mysticism, Illusion
 *  and Short Blade minor - so with the two primaries and two majors mastered, the one minor slot left still reaches a
 *  second path of each family (Restoration and Mysticism; Long Blade and Short Blade). */
const spellsword = (o = {}) => hero({ primary: [LB, AR, DES], major: [RES, ALT, AX], minor: [MYS, ILL, SB], ...o });
const letter = (value) => ({ group: 'MiscItems', templateIndex: LETTER_OF_CREDIT_TEMPLATE, name: 'Letter of Credit', value, stackCount: 1 });
const family = (m, id) => m.families.find((f) => f.id === id);
/** A spellsword holding the Warden (Restoration and Alteration) and the Ranger (Long Blade and Archery), `gold` coins. */
function held(gold, o = {}) {
  const e = spellsword({ mastered: [LB, AR, RES, ALT], ...o });
  assert.equal(AP.choosePath(e, 'warden').ok, true);
  assert.equal(MP.chooseMartialPath(e, 'ranger').ok, true);
  e.goldPieces = gold;
  e.items = [];
  return e;
}

// ── the law ─────────────────────────────────────────────────────────────────────────────────────────────────────────

test('SPEC-RESET THE PRICE: 200,000 gold a family, one constant both laws\' boxes name - the arcane box, the martial box and both several-open boxes say it where they said "cannot be undone" (mutants: the price moved; a box\'s words left permanent)', () => {
  assert.equal(AP.SPEC_RESET_GOLD, 200000);
  const e = spellsword({ mastered: [LB, AR, RES, ALT] });
  assert.equal(AP.pathChoiceRows(e, 'warden').at(-1), 'Resetting it later costs 200,000 gold.');
  assert.equal(MP.martialChoiceRows(e, 'ranger').at(-1), 'Resetting it later costs 200,000 gold.');
  for (const rows of [AP.pathChoiceRows(e, 'warden'), MP.martialChoiceRows(e, 'ranger'), AP.pathsOpenRows([AP.PATH_BY_ID.warden]), MP.martialOpenRows([MP.MARTIAL_BY_ID.ranger], { growth: true })]) {
    assert.ok(!rows.join(' ').includes('cannot be undone'), rows.join(' | '));
  }
});

test('SPEC-RESET THE LAW: a held path given up for exactly the price - the coins first, then a letter of credit and the coins after (court.js deductGold); the family\'s path cleared and nothing else: the other family, the masteries and the spellbook stand; the Growth rail counts the choice open again (mutants: the price unpaid; the wrong family cleared; the masteries taken)', () => {
  const e = held(200000);
  e.spells = [signatureSpell('warden')];
  const mastered = [...e.masteredSkills];
  assert.equal(specResetRefusal(e, 'arcane'), null);
  assert.deepEqual(resetSpec(e, 'arcane'), { ok: true, text: 'Warden reset. You can choose a new specialisation.' });
  assert.equal(e.arcanePath, null);
  assert.equal(e.goldPieces, 0, 'every coin of the price');
  assert.equal(e.martialPath, 'ranger', 'the other family stands');
  assert.deepEqual(e.masteredSkills, mastered, 'the masteries stand');
  assert.deepEqual(e.spells.map((s) => s.path), ['warden'], 'the signature spell stays in the book');
  assert.equal(AP.pathCastSchool(e, e.spells[0], ILL), ILL, '...as an ordinary spell, cast in its own schools');
  assert.deepEqual(AP.pathChoices(e).map((p) => p.id), ['warden'], 'its pair still mastered: open again');
  assert.equal(growthDue({ entity: e }).specs, 1, 'the rail counts the choice waiting');
  // the martial family, paid with a letter and coins: the letter first (DFU's order when the purse alone falls short)
  e.goldPieces = 60000; e.items = [letter(150000)];
  assert.equal(totalGoldAmount(e), 210000);
  assert.equal(resetSpec(e, 'martial').ok, true);
  assert.equal(e.martialPath, null);
  assert.equal(e.items.length, 0, 'the letter spent whole');
  assert.equal(e.goldPieces, 10000, 'the coins pay what the letter left');
});

test('SPEC-RESET THE REFUSALS: short of the price by one (coins and letters together), nothing held, no such family - each refused with nothing moved (mutants: the gold unasked; the purse alone counted; a refusal that still clears or charges)', () => {
  const e = held(99999);
  e.items = [letter(100000)];
  assert.equal(specResetRefusal(e, 'arcane'), 'Resetting costs 200,000 gold. You have 199,999.');
  assert.deepEqual(resetSpec(e, 'arcane'), { ok: false, text: 'Resetting costs 200,000 gold. You have 199,999.' });
  assert.deepEqual([e.arcanePath, e.goldPieces, e.items[0].value], ['warden', 99999, 100000], 'nothing moved');
  e.goldPieces = 100000;
  assert.equal(specResetRefusal(e, 'arcane'), null, 'a letter is legal tender');
  const none = spellsword({ mastered: [LB, AR] });
  none.goldPieces = 500000;
  assert.equal(resetHeld(none, 'martial'), null);
  assert.equal(resetSpec(none, 'martial').text, 'You have no specialisation of this kind to reset.');
  assert.equal(none.goldPieces, 500000);
  assert.equal(resetSpec(none, 'firmament').text, 'No such specialisation.');
});

test('SPEC-RESET THE SAVE: a reset path saves as none and loads as none - the martial mirror goes with it, and the old signature spell in the book is no witness to a newer save\'s own null (mutants: the mirror kept; the witness read)', () => {
  const e = held(400000);
  e.spells = [signatureSpell('warden')];
  assert.equal(resetSpec(e, 'arcane').ok, true);
  assert.equal(resetSpec(e, 'martial').ok, true);
  const snap = JSON.parse(JSON.stringify(snapshotPlayer(e)));
  assert.deepEqual([snap.arcanePath, snap.martialPath, snap.goldPieces], [null, null, 0]);
  assert.equal(snap.career.martialMirror, undefined, 'no mirror of a path given up');
  const back = structuredClone(playerEntity);
  restorePlayer(back, snap);
  assert.deepEqual([back.arcanePath, back.martialPath], [null, null]);
});

// ── the guide ───────────────────────────────────────────────────────────────────────────────────────────────────────

test('SPEC-RESET THE GUIDE\'S MODEL: a held path\'s Reset - none with nothing held; its ask names the price, what goes, what stays and the paths then open (the held one among them); refused short of the gold, or where no other path of the family could ever open (mutants: the ask\'s lines; the only-path guard dropped; the guard read on the held path)', () => {
  const e = held(250000);
  const m = specGuideModel(e);
  assert.equal(family(specGuideModel(spellsword({ mastered: [LB, AR] })), 'arcane').reset, null, 'nothing held, no reset');
  const arc = family(m, 'arcane');
  assert.equal(arc.reset.refusal, null);
  assert.deepEqual(arc.reset.rows(), ['Reset Warden for 200,000 gold?', '',
    'You lose its passive. Its signature spell stays in your spellbook as an ordinary spell.', 'Your mastered skills stay mastered.', '',
    'Then you can choose: Warden.', 'More paths unlock as you master more skills.']);
  assert.deepEqual(family(m, 'martial').reset.rows().slice(2, 4), ['You lose its passive and its signature technique.', 'Your mastered skills stay mastered.']);
  // three schools mastered (every slot spent): the other two paths open at once, and none left to reach
  const three = held(250000, { mastered: [LB, AR, RES, ALT, MYS] });
  assert.equal(family(specGuideModel(three), 'arcane').reset.rows().at(-1), 'Then you can choose: Riftwalker, Warden, Necromancer.');
  assert.equal(three.arcanePath, 'warden', 'the model read it with nothing held, and wrote nothing');
  // the last slot spent on Short Blade: no other school can be mastered, so an arcane reset buys back the same path -
  // refused, and says so; the martial family, its third weapon mastered, may reset
  const spent = held(250000, { mastered: [LB, AR, RES, ALT, SB] });
  assert.equal(family(specGuideModel(spent), 'arcane').reset.refusal, 'No other arcane path can open for you, so a reset would only let you choose Warden again.');
  assert.equal(family(specGuideModel(spent), 'martial').reset.refusal, null);
  assert.equal(resetSpec(spent, 'arcane').ok, true, 'the guard is the guide\'s: the law itself pays and clears');
  // Master Skills off (offline): allowed, and the ask says how to choose again
  const off = held(250000);
  off._online = false; off.masterSkills = false;
  assert.equal(family(specGuideModel(off), 'arcane').reset.refusal, null);
  assert.equal(family(specGuideModel(off), 'arcane').reset.rows().at(-1), 'Master Skills is off. Turn it on to choose a specialisation again.');
  // short of the gold: the law's refusal
  const poor = held(5);
  assert.equal(family(specGuideModel(poor), 'arcane').reset.refusal, 'Resetting costs 200,000 gold. You have 5.');
  // the reset itself is the law's
  assert.equal(arc.reset.go().ok, true);
  assert.equal(e.arcanePath, null);
  assert.equal(e.goldPieces, 50000);
});

test('SPEC-RESET THE GUIDE, DRIVEN: the chosen path\'s Reset press names the price; it asks in the window\'s Yes/No card, No keeps the path and the gold, Yes resets and says so, and the family\'s paths stand open again; short of the gold the press stands disabled and says why (mutants: the press drawn for a path not held; no ask; the refusal undrawn)', async () => {
  await import('../../chargenDom.mjs');
  _resetForTests();
  const { mountEnhancedMenu } = await import('../../../src/ui/enhanced/enhancedMenu.js');
  const kept = { ...playerEntity };
  const restore = () => { for (const k of Object.keys(playerEntity)) if (!(k in kept)) delete playerEntity[k]; Object.assign(playerEntity, kept); };
  try {
    Object.assign(playerEntity, held(200500));
    const host = globalThis.document.createElement('div');
    const menu = mountEnhancedMenu(host, { mode: 'pause', hooks: {}, onAction: () => {}, at: 'specs:martial' });
    const btn = (text) => host.querySelectorAll('button').find((b) => b.textContent.startsWith(text));
    const bar = (name) => host.querySelectorAll('button').find((b) => String(b.className).includes('gr-pathbar') && b.textContent.includes(name));
    const ask = () => globalThis.document.body.querySelectorAll('div').find((d) => String(d.className).includes('px-master-ask'));
    try {
      bar('Blademaster').onclick();
      assert.equal(btn('Reset · 200,000 gold'), undefined, 'a path not held has no Reset');
      bar('Ranger').onclick();
      const reset = btn('Reset · 200,000 gold');
      assert.ok(reset, 'the chosen path\'s Reset');
      assert.equal(reset.disabled, false);
      reset.onclick();
      assert.match(ask().textContent, /Reset Ranger for 200,000 gold\?/);
      ask().querySelectorAll('button').find((b) => b.textContent === 'No').onclick();
      assert.deepEqual([playerEntity.martialPath, playerEntity.goldPieces], ['ranger', 200500], 'No keeps both');
      btn('Reset · 200,000 gold').onclick();
      ask().querySelectorAll('button').find((b) => b.textContent === 'Yes').onclick();
      assert.deepEqual([playerEntity.martialPath, playerEntity.goldPieces], [null, 500]);
      assert.ok(host.textContent.includes('Ranger reset. You can choose a new specialisation.'), 'the note says so');
      assert.equal(btn('Reset · 200,000 gold'), undefined, 'nothing held: no Reset');
      bar('Ranger').onclick();
      assert.ok(btn('Choose Ranger'), 'open again');
      // the arcane family's Reset, short of the gold now
      host.querySelectorAll('button').find((b) => String(b.className).includes('gr-fam') && b.textContent.startsWith('Arcane')).onclick();
      bar('Warden').onclick();
      assert.equal(btn('Reset · 200,000 gold').disabled, true);
      assert.ok(host.textContent.includes('Resetting costs 200,000 gold. You have 500.'), 'the press says why');
      btn('Reset · 200,000 gold').onclick();
      assert.equal(ask(), undefined, 'a refused press asks nothing');
    } finally { menu.unmount(); }
  } finally { restore(); dropStage(); }
});
