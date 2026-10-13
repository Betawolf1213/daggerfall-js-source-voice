// KG3 (2026-10-13, bible/11-Multiplayer/Kings-Gambit.md sections 3, 5.7, 10, 14.3 and 16): THE KING'S GAMBIT ON THE SEAT -
// the host's half (scenes/gambitTableGame.js) driven on a fake page through its own presses, as a player drives it:
// the setup (the regulars in tier order, the stake from the purse, the crown kept on the character), the army, the deal
// (the stake taken and held), a whole game played by presses on the cloth's cells (a careful player's choices) to a win
// and to a loss - the pot paid, the regular's night booked, the result after its beat - the forfeit asked twice, every
// road off the seat a forfeit and a load's road settling nothing, a regular's spent night and an online table playing
// for fun, the keys and the pad on the board's cursor, a press on the cloth read through the frame's own lens (under a
// finger snapped and staged), and every allocation freed at the close.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { openGambitTableGame, regularCrown, gambitRegulars, gambitTableOn, GAMBIT_ARM_MS, GAMBIT_SNAP_PX, GAMBIT_CURSOR_KEYS } from '../src/scenes/gambitTableGame.js';
import { GAMBIT_TIERS, tierFor, regularAction } from '../src/systems/gambitPatrons.js';
import { GAMBIT_RESULT_MS, GAMBIT_NIGHT_MULT, GAMBIT_CROWNS, gambitNightPaid, gambitCrownRestore } from '../src/systems/gambitTableSession.js';
import { KG_POINT_BUDGET, KG_KING_CELL, pieceById, pieceAt, reachable } from '../src/net/kingsGambit.js';
import { barkInvite } from '../src/ui/gambitTableWords.js';
import { CARD_TABLE_W, CARD_TABLE_D } from '../src/world/cardTableProp.js';
import { perspective, mirrorProjectionX, lookAt } from '../src/world/mat4.js';
import { projectToScreen } from '../src/player/tapRay.js';
import { DPAD_CODES } from '../src/ui/plusPad.js';
import { BARK_MS } from '../src/world/cardRegulars.js';
import { getPref, _resetForTests as resetPrefs } from '../src/systems/uiPrefs.js';
import { xorshift } from '../tools/kgMeasure.mjs';
import { fakeDoc, fakeWin, all } from './decorFakes.mjs';
import { readFileSync } from 'node:fs';
import { setPref } from '../src/systems/uiPrefs.js';
import { KINGS_GAMBIT_KEY } from '../src/systems/features.js';
import { stakedSaveRefusal, resultGold } from '../src/ui/gambitTableWords.js';
import { nearestFreeSeat, takenSeats } from '../src/world/cardTables.js';
import { RemoteCardTable } from '../src/systems/cardRemoteTable.js';
import * as court from '../src/systems/court.js';
import * as sess from '../src/systems/cardTableSession.js';
import * as hudm from '../src/ui/cardTableHud.js';
import * as hand from '../src/world/cardHand.js';
import { CARD_W, CARD_L, chipDiscs } from '../src/world/cardMotion.js';
import { cardMatrix } from '../src/render/cardTableDraw.js';
import { holdCursor } from '../src/player/pointerLock.js';
import { rayDirFromScreen } from '../src/player/tapRay.js';
import { regularsToStand, regularBark, regularLook } from '../src/world/cardRegulars.js';
import { seatTopByte } from '../src/player/seatPose.js';
import { cardPackPrice, buyCardPack } from '../src/systems/cardSources.js';
import { openIliacTableGame } from '../src/scenes/iliacTableGame.js';
import { iliacGrade } from '../src/systems/iliacPatrons.js';
import { giveBinderAtChargen } from '../src/systems/iliacItems.js';
import { skillValue, SKILLS } from '../src/systems/skills.js';
import { liveStat } from '../src/systems/statMods.js';

beforeEach(() => resetPrefs());

const seedOf = (key, from = 1) => { for (let s = from; ; s++) if (tierFor(s).key === key) return s; };
const AMATEUR_SEED = seedOf('amateur'), SEASONED_SEED = seedOf('seasoned'), VETERAN_SEED = seedOf('veteran');
const FRAME = { centre: [0, 0.8, 0], axisYaw: Math.PI / 2, halfLong: CARD_TABLE_W / 2, halfShort: CARD_TABLE_D / 2 };
const FEET = [0, 0, -0.9];
const W = 1280, H = 720;
/** The seat's lens: the eye over the host's chair, looking down at the board's middle - the frame's own matrices. */
const CAM = (() => {
  const eye = [0, 1.25, -0.7];
  const proj = mirrorProjectionX(perspective((65 * Math.PI) / 180, W / H, 0.05, 100));
  return { proj, view: lookAt(eye, [0, 0.8, 0], [0, 1, 0]), eye };
})();

function rig(o = {}) {
  let now = 0;
  const said = [], roads = [], relocked = [];
  const entity = { name: 'Ves', items: [], goldPieces: o.gold ?? 5000, gambitPurses: o.book, gambitCrown: o.crown };
  const made = [], freed = [], released = [], drawn = [];
  const renderer = { createMesh: (m) => { made.push(m); return { m }; }, drawMesh: (m) => drawn.push(m), destroyMesh: (m) => freed.push(m), uploadTexture() {}, releaseTexture: (a, r) => released.push([a, r]) };
  const doc = fakeDoc();
  if (o.paint) {
    const own = { measureText: (t) => ({ width: String(t).length * 5 }), getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) };
    const ctx = new Proxy(own, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
    const make = doc.createElement;
    doc.createElement = (tag) => { const n = make(tag); if (tag === 'canvas') n.getContext = () => ctx; return n; };
  }
  const regulars = o.regulars ?? [{ name: 'Cael', seed: VETERAN_SEED, chair: 3 }, { name: 'Ana', seed: AMATEUR_SEED, chair: 1 }, { name: 'Bors', seed: SEASONED_SEED, chair: 2 }];
  let holds = 0;
  const g = openGambitTableGame({
    doc, renderer, entity, say: (t) => said.push(t), holdCursor: () => { holds++; return () => true; }, relock: () => relocked.push(1),
    rand32: xorshift(o.seed ?? 7), now: () => now, day: () => o.day ?? 100, key: 'town:7:0', friendly: !!o.friendly, regulars,
    frame: FRAME, mySeatFeet: FEET, touch: () => !!o.touch,
    onHoldem: () => roads.push('holdem'), onIliac: () => roads.push('iliac'), onStand: () => { roads.push('stand'); g.close(); },
  });
  const tick = (ms = 100) => { now += ms; g.frame(now); };
  return { g, entity, said, roads, relocked, made, freed, released, drawn, tick, get now() { return now; }, get holds() { return holds; }, doc };
}
/** Through the setup and the army to the deal: regular `i` of the panel's list, stake pick `mult`, an Auto-filled army. */
function toBattle(r, { regular = 1, mult = 2 } = {}) {
  r.g.press('regular', regular);
  if (mult) r.g.press('stake', mult);
  r.g.press('next');
  r.g.press('autofill');
  r.g.press('start');
}
/** A careful player's game, pressed on the cloth's cells: the choice the regulars' own careful rules make for side 0,
 *  each a select and a cell (a strike a foe's cell), a potion Drink, the end End turn. Answers the session's end. */
function playByPresses(r, seed, cap = 30_000) {
  const rnd = xorshift(seed);
  for (let i = 0; i < cap && r.g.g.phase === 'battle'; i++) {
    const s = r.g.g.session;
    if (s.playing() && s.state.turn === 0 && !s.state.ending) {
      const cmd = regularAction(s.state, 0, { blunder: 0 }, rnd) ?? { type: 'end' };
      const pc = cmd.piece != null ? pieceById(s.state, cmd.piece) : null;
      if (pc && r.g.g.selected !== pc.id) r.g.press('cell', [pc.col, pc.row]);
      if (cmd.type === 'move') r.g.press('cell', [cmd.col, cmd.row]);
      else if (cmd.type === 'attack') { const t = pieceById(s.state, cmd.target); r.g.press('cell', [t.col, t.row]); }
      else if (cmd.type === 'potion') r.g.press('drink');
      else r.g.press('end');
    }
    r.tick(100);
  }
  return r.g.g.session.over;
}

test('KG3 the table opens on the setup: the cursor held, the regulars in tier order then by chair, the crown off the save (Daggerfall the first time), nothing chosen for the player; the other games and Stand up its roads (mutants: the order; the crown\'s default; a regular pre-chosen)', () => {
  const r = rig({ crown: 'nowhere' });
  assert.equal(r.holds, 1, 'the cursor held free for the panel');
  assert.deepEqual(r.g.g.regs.map((x) => [x.name, x.tier.key]), [['Ana', 'amateur'], ['Bors', 'seasoned'], ['Cael', 'veteran']]);
  assert.deepEqual(gambitRegulars([{ name: 'B', seed: SEASONED_SEED, chair: 5 }, { name: 'A', seed: seedOf('seasoned', SEASONED_SEED + 1), chair: 2 }]).map((x) => x.name), ['A', 'B'], 'a tier\'s ties by chair');
  assert.deepEqual(gambitRegulars([{ name: 'V', seed: VETERAN_SEED, chair: 1 }, { name: 'S', seed: SEASONED_SEED, chair: 2 }, { name: 'A', seed: AMATEUR_SEED, chair: 4 }]).map((x) => x.name), ['A', 'S', 'V'], 'the tier first, whatever the chair');
  assert.equal(r.g.g.crown, 'daggerfall');
  assert.deepEqual(['sentinel', 'nowhere', null, 7].map(gambitCrownRestore), ['sentinel', 'daggerfall', 'daggerfall', 'daggerfall'], 'the save\'s crown: one of the four, else Daggerfall');
  assert.equal(r.g.g.regular, null, 'the choice is the difficulty: the player\'s');
  assert.equal(r.g.g.phase, 'setup');
  for (const road of ['holdem', 'iliac']) r.g.press(road);
  r.g.press('stand');
  assert.deepEqual(r.roads, ['holdem', 'iliac', 'stand'], 'no game under way: Stand up at once');
  assert.equal(r.relocked.length, 1, 'the close gave the cursor back');
});

test('KG3 the setup\'s presses: a regular chosen (and the invitation over their head), the stake picked only as the purse and the night allow, the crown kept on the character, Build your army only when ready (mutants: the stake unchecked; the crown unkept; the bark)', () => {
  const r = rig({ gold: 120 });
  r.g.press('next');
  assert.equal(r.g.g.phase, 'setup', 'nothing chosen: no army yet');
  r.g.press('regular', 1);
  assert.equal(r.g.g.regs[1].name, 'Bors');
  assert.deepEqual(r.g.regularsNow(r.now).map((x) => [x.name, x.say]), [['Ana', null], ['Bors', barkInvite()], ['Cael', null]]);
  assert.deepEqual(r.g.regularsNow(r.now + BARK_MS).map((x) => x.say), [null, null, null], 'for BARK_MS');
  r.g.press('stake', 5);   // 250 gold: past the purse of 120 - the panel refuses it before the press, and the host's word holds
  r.g.press('next');
  assert.equal(r.g.g.phase, 'setup', 'a stake the purse does not hold is no stake');
  r.g.press('stake', 2);
  r.g.press('crown', 1);
  assert.equal(r.entity.gambitCrown, 'sentinel', 'kept on the character');
  r.g.press('next');
  assert.equal(r.g.g.phase, 'army');
  r.g.press('back');
  r.g.press('regular', 2);
  assert.equal(r.g.g.stakeMult, null, 'another regular: the stake chosen again (another tier, another least)');
});

test('KG3 the army\'s presses: a unit joins, a unit too dear or one past the twelve is refused in words and shown large, Remove, Clear, Auto-fill to the points (mutants: the refusal; the remove\'s index)', () => {
  const r = rig();
  r.g.press('regular', 0); r.g.press('stake', 1); r.g.press('next');
  r.g.press('unit', 0);
  assert.deepEqual(r.g.g.army, [0]);
  assert.equal(r.g.g.said, 'Rat joins your army.');
  r.g.press('unit', 36);   // the Iron Atronach, 50 points - six of them leave too little for a seventh
  for (let i = 0; i < 6; i++) r.g.press('unit', 36);
  assert.match(r.g.g.said, /^Iron Atronach costs 50 points; you have \d+ left\.$/);
  assert.equal(r.g.g.why, r.g.g.said, 'the line says it too, until the next press');
  const before = r.g.g.army.slice();
  r.g.press('remove', 0);
  assert.equal(r.g.g.said, 'Rat leaves your army.');
  assert.deepEqual(r.g.g.army, before.slice(1), 'the row pressed is the unit taken');
  r.g.press('clear');
  assert.deepEqual(r.g.g.army, []);
  r.g.press('autofill');
  const cost = r.g.g.army.reduce((s, id) => s + (id === undefined ? 0 : 1), 0);
  assert.ok(cost > 0 && r.g.g.army.length <= 12);
  r.g.g.army = Array(12).fill(0);
  r.g.press('unit', 0);
  assert.equal(r.g.g.said, 'Your army is full: 12 units.');
});

test('KG3 THE DEAL: the stake leaves the purse and the table holds it, the regular\'s crown the seed\'s (the next when it is the player\'s), the cursor on the player\'s king; the save waits while it is down (mutants: the stake untaken; the crown\'s clash; the staked flag)', () => {
  const r = rig({ gold: 1000 });
  toBattle(r, { regular: 1, mult: 2 });
  assert.equal(r.g.g.phase, 'battle');
  assert.equal(r.entity.goldPieces, 900, 'the stake taken at the deal');
  assert.equal(r.said.at(-1), 'You put down 100 gold and sit down to The King\'s Gambit with Bors.');
  assert.ok(r.g.staked() && r.g.playing());
  const [mine, theirs] = r.g.g.game.crowns;
  assert.equal(mine, 'daggerfall');
  assert.equal(theirs, regularCrown(SEASONED_SEED, 'daggerfall'));
  assert.notEqual(theirs, mine);
  for (let s = 0; s < 8; s++) for (const c of GAMBIT_CROWNS) assert.notEqual(regularCrown(s, c), c, 'never the player\'s crown');
  const king = r.g.g.session.state.pieces.find((p) => p.side === 0 && p.king);
  assert.deepEqual(r.g.g.cursor, [king.col, king.row]);
  assert.deepEqual([...KG_KING_CELL], [king.col, king.row], 'the host\'s king at its cell');
});

test('KG3 A GAME PLAYED BY PRESSES to a win and to a loss: the pot paid and the night booked at the decision, the result after its beat, the guide folded once the player has finished a game; the regular\'s word at the end (mutants: the pay; the book\'s sign; the beat; the played flag)', () => {
  // a win off the Amateur (Ana), a loss to the Veteran (Cael) - a careful player wins the one nearly always and loses
  // to the other more often than not (section 12's measure)
  let win = null, loss = null;
  for (let seed = 1; seed < 40 && !win; seed++) {
    const r = rig({ gold: 1000, seed });
    toBattle(r, { regular: 0, mult: 1 });
    if (playByPresses(r, seed + 500)?.winner === 0) win = r;
  }
  for (let seed = 1; seed < 40 && !loss; seed++) {
    const r = rig({ gold: 1000, seed });
    toBattle(r, { regular: 2, mult: 1 });
    if (playByPresses(r, seed + 900)?.winner === 1) loss = r;
  }
  assert.ok(win && loss, 'both ends played');
  const [ana, cael] = [GAMBIT_TIERS[0].stake, GAMBIT_TIERS[2].stake];
  assert.equal(win.entity.goldPieces, 1000 - ana + 2 * ana, 'the pot: the stake back and as much again');
  assert.equal(gambitNightPaid(win.entity.gambitPurses, 'town:7:0', 100, 'Ana'), ana, 'the regular paid out tonight');
  assert.equal(loss.entity.goldPieces, 1000 - cael, 'the stake the regular\'s');
  assert.equal(gambitNightPaid(loss.entity.gambitPurses, 'town:7:0', 100, 'Cael'), -cael, 'won back');
  for (const r of [win, loss]) {
    assert.equal(r.g.g.phase, 'over', 'the result shown after its beat');
    assert.equal(r.g.staked(), false);
    assert.ok(r.g.regularsNow(r.now - 1).some((x) => x.say), 'the regular\'s word at the end');
  }
  assert.equal(getPref('gambitPlayed'), true, 'the player has finished a game');
  // Play again deals at once with the same regular, army and stake
  const before = win.entity.goldPieces;
  win.g.press('again');
  assert.equal(win.g.g.phase, 'battle');
  assert.equal(win.entity.goldPieces, before - ana);
});

test('KG3 the result\'s beat: the game decided, the panel shows the board until GAMBIT_RESULT_MS has passed (mutant: the result at once)', () => {
  const r = rig({ gold: 1000 });
  toBattle(r);
  r.g.press('forfeit'); r.g.press('forfeit');
  assert.equal(r.g.g.phase, 'battle', 'decided, not yet shown');
  r.tick(GAMBIT_RESULT_MS - 1);
  assert.equal(r.g.g.phase, 'battle');
  r.tick(1);
  assert.equal(r.g.g.phase, 'over');
});

test('KG3 A PRESS THAT COSTS GOLD ASKS TWICE: Forfeit and Stand up arm on the first press, act on the second, disarm on any other press or after GAMBIT_ARM_MS - Escape with nothing to cancel is the Stand up press (mutants: one press; the arm kept; Escape standing up at once)', () => {
  const r = rig({ gold: 1000 });
  toBattle(r);
  r.g.press('forfeit');
  assert.equal(r.g.g.armed, 'forfeit');
  r.g.press('words', true);
  assert.equal(r.g.g.armed, null, 'any other press disarms');
  r.g.press('forfeit');
  r.tick(GAMBIT_ARM_MS);
  assert.equal(r.g.g.armed, null, 'the arm runs out');
  assert.ok(r.g.playing());
  assert.equal(r.g.key('Escape'), true);
  assert.equal(r.g.g.armed, 'stand', 'Escape asks Stand up');
  assert.deepEqual(r.roads, []);
  assert.equal(r.g.key('Escape'), true);
  assert.deepEqual(r.roads, ['stand'], 'the second press stands up');
  assert.equal(r.entity.goldPieces, 900, 'standing up mid-game forfeits the stake');
  assert.equal(gambitNightPaid(r.entity.gambitPurses, 'town:7:0', 100, 'Bors'), -100);
});

test('KG3 every road off the seat: the close forfeits a game under way (the stake the regular\'s); a load\'s road settles nothing; closed twice, once (mutants: the concession; the load\'s road; the slot)', () => {
  const a = rig({ gold: 1000 });
  toBattle(a);
  a.g.close();
  assert.equal(a.g.staked(), false);
  assert.equal(a.entity.goldPieces, 900);
  assert.equal(gambitNightPaid(a.entity.gambitPurses, 'town:7:0', 100, 'Bors'), -100);
  const freedOnce = a.freed.length;
  a.g.close();
  assert.equal(a.freed.length, freedOnce, 'once');
  const b = rig({ gold: 1000 });
  toBattle(b);
  b.g.close({ concede: false });
  assert.equal(b.entity.goldPieces, 900, 'the load\'s purse is the save\'s: nothing paid back here');
  assert.equal(b.entity.gambitPurses, undefined, 'nothing booked');
  assert.equal(b.g.g.session.playing(), true, 'the session left as it stood - the load throws it away');
  b.g.close();
  assert.deepEqual([b.entity.goldPieces, b.entity.gambitPurses], [900, undefined], 'closed twice, once: the second close forfeits nothing');
});

test('KG3 A REGULAR\'S NIGHT: a regular who has paid out the night plays for fun - no stake taken, none paid, nothing booked; an online table plays the regulars for fun (mutants: the night unread; the friendly table\'s gold)', () => {
  const spent = { 'town:7:0': { day: 100, net: { Ana: GAMBIT_TIERS[0].stake * GAMBIT_NIGHT_MULT } } };
  const r = rig({ gold: 500, book: spent });
  toBattle(r, { regular: 0, mult: 0 });
  assert.equal(r.g.g.phase, 'battle', 'for fun: no stake to pick');
  assert.equal(r.g.g.game.stake, 0);
  assert.equal(r.entity.goldPieces, 500);
  assert.equal(r.g.staked(), false, 'nothing down: the save need not wait');
  r.g.close();
  assert.equal(r.entity.goldPieces, 500);
  assert.deepEqual(r.entity.gambitPurses, spent, 'nothing booked');
  const tomorrow = rig({ gold: 500, book: spent, day: 101 });
  toBattle(tomorrow, { regular: 0, mult: 1 });
  assert.equal(tomorrow.g.g.game.stake, GAMBIT_TIERS[0].stake, 'a new night: the regular plays for gold again');
  const online = rig({ gold: 500, friendly: true });
  toBattle(online, { regular: 1, mult: 0 });
  assert.equal(online.g.g.game.stake, 0);
  online.g.press('forfeit'); online.g.press('forfeit');
  assert.equal(online.entity.goldPieces, 500);
  assert.equal(online.entity.gambitPurses, undefined);
});

test('KG3 THE KEYS AND THE PAD ON THE BOARD (14.3): the arrows and the d-pad walk the cursor and fill the information box, Enter or Space or the pad\'s A press its cell (a piece chosen, then a lit cell moved to), Escape or the pad\'s B cancel; none taken outside the battle (mutants: the d-pad; the press; the cancel; a key taken in the setup)', () => {
  const r = rig({ gold: 1000 });
  assert.equal(r.g.key('ArrowUp'), false, 'the setup takes no board key');
  toBattle(r);
  const st = () => r.g.g.session.state;
  assert.deepEqual(Object.keys(GAMBIT_CURSOR_KEYS).filter((k) => k.startsWith('Joystick')).sort(), Object.values(DPAD_CODES).sort());
  const king = st().pieces.find((p) => p.side === 0 && p.king);
  assert.equal(r.g.key('Enter'), true);
  assert.equal(r.g.g.selected, king.id, 'the cursor\'s cell pressed: the king chosen');
  assert.equal(r.g.key('Escape'), true);
  assert.equal(r.g.g.selected, null, 'Escape lets it go');
  // walk the cursor by the pad's d-pad and the arrows
  const walk = (c, row) => {
    let guard = 0;
    while (r.g.g.cursor[0] !== c && guard++ < 20) r.g.key(r.g.g.cursor[0] < c ? DPAD_CODES.right : 'ArrowLeft');
    while (r.g.g.cursor[1] !== row && guard++ < 40) r.g.key(r.g.g.cursor[1] < row ? 'ArrowDown' : DPAD_CODES.up);
    assert.deepEqual(r.g.g.cursor, [c, row]);
  };
  const mover = st().pieces.find((p) => p.side === 0 && reachable(st(), p).length);
  assert.ok(mover, 'a piece that can move at the deal');
  walk(mover.col, mover.row);
  assert.equal(r.g.key('JoystickButton0'), true);
  assert.equal(r.g.g.selected, mover.id, 'the pad\'s A pressed the cursor\'s cell: the piece chosen');
  const [c, row] = reachable(st(), mover)[0];
  walk(c, row);
  assert.deepEqual(r.g.g.info, pieceAt(st(), c, row) ? { piece: pieceAt(st(), c, row).id } : { cell: [c, row] }, 'the box reads the cursor');
  assert.equal(r.g.key('Space'), true);
  assert.deepEqual([pieceById(st(), mover.id).col, pieceById(st(), mover.id).row], [c, row], 'Space moved it there');
  assert.equal(r.g.g.selected, st().turn === 0 && !st().ending ? mover.id : null, 'a piece with its side\'s action still to come stays chosen');
  assert.ok(st().turn === 0 && !st().ending, 'an action is left');
  const own = st().pieces.find((p) => p.side === 0 && p.id !== r.g.g.selected);
  r.g.press('cell', [own.col, own.row]);
  assert.equal(r.g.g.selected, own.id);
  assert.equal(r.g.key('JoystickButton1'), true);
  assert.equal(r.g.g.selected, null, 'the pad\'s B cancels');
  assert.equal(r.g.key('KeyQ'), false, 'a key the board does not read is not taken');
});

test('KG3 A PRESS ON THE CLOTH is a cell through the frame\'s own lens - a fine pointer acts at once; under a finger it snaps within GAMBIT_SNAP_PX and stages (Move here, Cancel); the felt round the board is taken and presses nothing; off the table the seat\'s (mutants: the lens; the snap\'s radius; the stage; the felt)', () => {
  const r = rig({ gold: 1000, touch: true });
  toBattle(r);
  r.g.draw(0, CAM);
  const st = () => r.g.g.session.state;
  const P = r.g.g.places;
  const screen = (c, row) => { const s = projectToScreen(P.at(c, row), W, H, CAM.proj, CAM.view, null); assert.ok(s.front); return [s.x, s.y]; };
  const mover = st().pieces.find((p) => p.side === 0 && reachable(st(), p).length);
  assert.ok(mover, 'a piece that can move at the deal');
  // PAST THE RADIUS a finger is not snapped. The radius decides where a cell is small on the screen - a phone's (14.3:
  // fifteen columns across 390 px are 26 px a column at best) - so the lens at a third of the size: a point over an empty
  // cell, a few px past GAMBIT_SNAP_PX from the nearest of the player's pieces (the only candidates while none is
  // chosen), presses that cell and takes no piece
  const VW = W / 3, VH = H / 3;
  const small = (c, row) => { const s = projectToScreen(P.at(c, row), VW, VH, CAM.proj, CAM.view, null); return [s.x, s.y]; };
  /** The cell a screen point lies over, read through the lens as the game reads it. */
  const under = ([x, y]) => { const ray = rayDirFromScreen(x, y, VW, VH, CAM.proj, CAM.view, CAM.eye, null); const p = ray ? hand.tablePoint(CAM.eye, ray, P.top) : null; return p ? P.cellAt(p) : null; };
  const own = st().pieces.filter((p) => p.side === 0).map((p) => small(p.col, p.row));
  let far = null;
  for (const [ox, oy] of own) for (let a = 0; a < 16 && !far; a++) for (const d of [24, 26, 28]) {
    const pt = [ox + d * Math.cos((a * Math.PI) / 8), oy + d * Math.sin((a * Math.PI) / 8)];
    const near = Math.min(...own.map(([x, y]) => Math.hypot(x - pt[0], y - pt[1])));
    const cell = under(pt);
    if (near > GAMBIT_SNAP_PX + 1 && near < 30 && cell && !pieceAt(st(), cell[0], cell[1])) { far = pt; break; }
  }
  assert.ok(far, 'an empty cell beside a piece, past the radius');
  assert.equal(r.g.pointer(far, { w: VW, h: VH }, { touch: true }), true);
  assert.equal(r.g.g.selected, null, 'past the radius: the cell under the finger, no piece taken');
  // a finger a little off a piece's cell still takes it
  const [mx, my] = screen(mover.col, mover.row);
  assert.equal(r.g.pointer([mx + GAMBIT_SNAP_PX - 4, my], { w: W, h: H }, { touch: true }), true);
  assert.equal(r.g.g.selected, mover.id, 'snapped to the player\'s own piece');
  // under a finger a move stages, and Move here commits it
  const [c, row] = reachable(st(), mover)[0];
  r.g.pointer(screen(c, row), { w: W, h: H }, { touch: true });
  assert.deepEqual(r.g.g.staged, { kind: 'move', col: c, row }, 'under a finger a move stages');
  assert.deepEqual([pieceById(st(), mover.id).col, pieceById(st(), mover.id).row], [mover.col, mover.row], 'and nothing has moved yet');
  r.g.press('move');
  assert.deepEqual([pieceById(st(), mover.id).col, pieceById(st(), mover.id).row], [c, row], 'Move here commits it');
  // the felt round the board: taken, nothing pressed
  const felt = projectToScreen([FRAME.centre[0] + FRAME.halfLong - 0.03, P.top, FRAME.centre[2]], W, H, CAM.proj, CAM.view, null);
  const sel = r.g.g.selected;
  assert.equal(r.g.pointer([felt.x, felt.y], { w: W, h: H }, { touch: false }), true, 'the table is the table\'s');
  assert.equal(r.g.g.selected, sel);
  // off the table: the seat's
  assert.equal(r.g.pointer([2, 2], { w: W, h: H }, {}), false);
  // a fine pointer acts at once
  const m = rig({ gold: 1000 });
  toBattle(m);
  m.g.draw(0, CAM);
  const ms = () => m.g.g.session.state;
  const mv = ms().pieces.find((p) => p.side === 0 && reachable(ms(), p).length);
  const s2 = projectToScreen(m.g.g.places.at(mv.col, mv.row), W, H, CAM.proj, CAM.view, null);
  m.g.pointer([s2.x, s2.y], { w: W, h: H }, {});
  assert.equal(m.g.g.selected, mv.id);
  const to = reachable(ms(), mv)[0];
  const t = projectToScreen(m.g.g.places.at(to[0], to[1]), W, H, CAM.proj, CAM.view, null);
  m.g.pointer([t.x, t.y], { w: W, h: H }, {});
  assert.equal(m.g.g.staged, null, 'no stage under a fine pointer');
  assert.deepEqual([pieceById(ms(), mv.id).col, pieceById(ms(), mv.id).row], to, 'moved at once');
  // another button on the table cancels, never the swing
  const k2 = ms().pieces.find((p) => p.side === 0 && p.king);
  m.g.press('cell', [k2.col, k2.row]);
  const s3 = projectToScreen(m.g.g.places.at(k2.col, k2.row), W, H, CAM.proj, CAM.view, null);
  assert.equal(m.g.pointer([s3.x, s3.y], { w: W, h: H }, { button: 2 }), true);
  assert.equal(m.g.g.staged, null);
});

test('KG3 the board drawn and freed: the mat and the pieces\' plates made as the battle is drawn, nothing before; the close frees every mesh and both textures (EVERY ALLOCATION HAS AN OWNER) (mutants: the free; a draw after the close)', () => {
  const r = rig({ gold: 1000, paint: true });
  r.g.draw(0, CAM);
  assert.equal(r.made.length, 0, 'no board before a game');
  toBattle(r);
  r.g.draw(16, CAM);
  assert.ok(r.made.length >= 2, 'the mat and the plates');
  assert.ok(r.drawn.length > r.g.g.session.state.pieces.length, 'the mat and every piece drawn');
  const madeAt = r.made.length;
  r.g.draw(32, CAM);
  assert.equal(r.made.length, madeAt, 'made once, drawn every frame');
  r.g.close();
  assert.equal(r.freed.length, r.made.length, 'every mesh freed');
  assert.deepEqual(r.released.map((x) => x[1]).sort(), ['atlas', 'mat'], 'both textures let go');
  const after = r.drawn.length;
  r.g.draw(48, CAM);
  assert.equal(r.drawn.length, after, 'nothing drawn after the close');
  assert.equal(all(r.doc.body, 'dfgambit').length, 1);
  assert.ok(all(r.doc.body, 'dfgambit')[0].removed, 'the panel gone');
});

// ── THE HOST'S WIRING: scenes/worldModes.js's card block (`let cardSeat = null;` to the hurt listener), run as the six
// harness tests run it (test/auditcards6_e.test.js's way), offline, over the real panels and the real game ──────────────
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const grab = (src, re, what) => { const m = re.exec(src); assert.ok(m, `${what} is no longer where this pin reads it`); return m[1]; };
const WM = read('src/scenes/worldModes.js'), WORLD = read('src/scenes/world.js');
const BLOCK = WM.slice(WM.indexOf('  let cardSeat = null;'), WM.indexOf('\n', WM.indexOf("registerPlayerHurtListener('cards-seat'")));
const STAKED = grab(WM, /\n {4}gambitStaked: (\(\) => [^\n]*?),   \/\/ KG3/, "worldModes' gambitStaked");
const SAVE_DOOR = grab(WORLD, /\n {4}(if \(modes\?\.gambitStaked\?\.\(\)[^\n]*?return false; \})/, "world.js's quick save's KG3 door");
const SAVE_PREVENTED = grab(WORLD, /\n {4}savingPrevented: (\(\) => [^\n]*?),   \/\/ AUDIT NAV1/, "world.js's savingPrevented");

function cardHost({ friendly = false } = {}) {
  const doc = fakeDoc(), win = fakeWin();
  const playerEntity = { name: 'Mac', goldPieces: 5000, items: [], health: 50 };
  giveBinderAtChargen(playerEntity);
  const said = [];
  const seatList = Array.from({ length: 4 }, (_, k) => ({ x: k * 2, z: 0, eye: [k * 2, 1, 0], feet: [k * 2, 0, 0], yaw: 0, pitch: 0, top: 0.8 }));
  const scope = {
    isTavern: () => true, BUILDING_TYPES: { None: 0 },
    cardTableSeats: () => seatList, seatFloorOk: () => true, SEAT_FLOOR_PROBE: 1, nearestFreeSeat, takenSeats,
    player: { pos: [0, 0, 0], eyeAt: () => [0, 1.6, 0] },
    host: { realmAct: friendly ? { realm: true } : null, relock: () => {}, seatedPeers: () => [], cardOnline: null, iliacOnline: null, iliacRanked: { why: () => '', vouch: async () => ({ ok: false }), board: async () => ({ ok: false }) }, iliacClaims: { add: () => {} } },
    say: (x) => said.push(x), cam: { yaw: 0, pitch: 0, pos: null },
    getNameBankOfRegion: () => 0, residentName: (seed, bank, g) => `R${seed}:${g}`,
    stakesFor: sess.stakesFor, buyInRange: sess.buyInRange, goldAmount: court.goldAmount,
    holdCursor, renderer: {},
    createCardTableDraw: () => ({ draw() {}, destroy() {} }),
    createCardTableHud: (p) => hudm.createCardTableHud({ ...p, doc }), cardHudModel: hudm.cardHudModel, eventLine: hudm.eventLine,
    deductGold: court.deductGold, addGold: court.addGold, playerEntity,
    CardTableSession: sess.CardTableSession, seatPatrons: sess.seatPatrons, regularsFor: sess.regularsFor, regularsAfter: sess.regularsAfter,
    CardScene: class { constructor(o) { this.places = o.places; } onEvent() {} poses() { return { cards: [], chips: [] }; } settledAt() { return 0; } },
    tablePlaces: () => ({ seatOf: [], board: [], table: FRAME, seats: [] }), tableFrame: () => FRAME, hashSeed: (...x) => x.join(':'),
    buildingDirectory: () => ({ locationName: 'Daggerfall' }), registerPlayerHurtListener: () => {},
    isOnlinePage: () => false, mwViewFirstPerson: () => {}, homeTownOf: (b) => b?.townMapId || 0, worldMinutes: () => 0, MINUTES_PER_DAY: 1440,
    RemoteCardTable, mode: 'interior', regularsToStand, regularBark, BARK_MS, showdownWinners: hudm.showdownWinners, HOLDEM_REFUSALS: hudm.HOLDEM_REFUSALS,
    cardPackPrice, buyCardPack, openIliacTableGame: (o) => openIliacTableGame({ ...o, doc }), iliacGrade, skillValue, SKILLS, liveStat,
    gambitTableOn, openGambitTableGame: (o) => openGambitTableGame({ ...o, doc }), isTouchDevice: () => false, regularLook, seatTopByte, cursorKeyClaimed: () => false,
    canvas: { clientWidth: W, clientHeight: H, getBoundingClientRect: () => ({ left: 0, top: 0 }), setPointerCapture() {} }, ...hand, CARD_W, CARD_L, chipDiscs, cardMatrix,
    worldViewportRect: () => null, rayDirFromScreen, projectToScreen, performance,
    // the cloth's listeners want a window: the page's own, faked - and the two things that silence them, quiet
    window: win, interiorPaused: () => false, townTalk: null,
  };
  const state = { interiorCtx: { tables: [{ aabb: {} }], collider: null }, interiorBuilding: { buildingKey: 7, quality: 10, regionIndex: 17, townMapId: 1111 } };
  const api = new Function('S', ...Object.keys(scope), `let interiorCtx = S.interiorCtx, interiorBuilding = S.interiorBuilding;\n${BLOCK}\n
    return { sitAtCardTable, standFromCardTable, cardRegularsNow, gambitStaked: ${STAKED},
      get cardGame() { return cardGame; }, get iliacGame() { return iliacGame; }, get gambitGame() { return gambitGame; } };`)(state, ...Object.values(scope));
  const walk = (n, f, out = []) => { if (!n) return out; if (f(n)) out.push(n); for (const c of n.children ?? []) walk(c, f, out); return out; };
  const panels = () => doc.body.children.filter((n) => /^df(cards|iliac|gambit)\b/.test(n.className) && !n.removed);
  const buttons = () => panels().flatMap((p) => walk(p, (n) => n.tag === 'button').map((b) => b.textContent));
  const press = (label) => { const b = panels().flatMap((p) => walk(p, (n) => n.tag === 'button' && n.textContent.startsWith(label)))[0]; assert.ok(b, `a "${label}" button: ${buttons()}`); b.fire('click'); };
  return { api, said, win, playerEntity, panels, buttons, press, keys: () => (win.on.keydown ?? []).length };
}

test('KG3 THE HOST\'S WIRING (scenes/worldModes.js\'s card block, run as the six harness tests run it): Hold\'em\'s and Iliac Hand\'s panels offer The King\'s Gambit while its Features switch is on and its press opens it on the seat, the other game gone - one game a cloth - and its own presses open the other two; a stake down holds the save at both of world.js\'s doors, in words; its regulars stand in the chairs its setup lists; standing up forfeits it and takes its listeners off the window; the switch off, no panel offers it (mutants: a press unwired; the slot unemptied; the concession; the staked flag; the save\'s door; the listeners kept; the switch unread)', () => {
  const h = cardHost();
  const keys0 = h.keys();
  h.api.sitAtCardTable(0);
  assert.deepEqual(h.panels().map((p) => p.className), ['dfcards'], 'sitting down opens Hold\'em\'s buy-in');
  h.press('Play The King\'s Gambit');
  const kind = () => h.panels().map((p) => p.className.split(' ')[0]);
  assert.ok(h.api.gambitGame && !h.api.cardGame && !h.api.iliacGame, 'from Hold\'em: the gambit on the seat, Hold\'em gone');
  assert.deepEqual(kind(), ['dfgambit']);
  assert.equal(h.keys(), keys0 + 1, 'its keys on the window while it stands');
  h.press('Play Iliac Hand instead');
  assert.ok(h.api.iliacGame && !h.api.gambitGame, 'its own press opens Iliac Hand');
  assert.deepEqual(kind(), ['dfiliac']);
  assert.equal(h.keys(), keys0, 'gone with it');
  h.press('Play The King\'s Gambit');
  assert.ok(h.api.gambitGame && !h.api.iliacGame, 'from Iliac Hand');
  h.press('Play Hold\'em instead');
  assert.ok(h.api.cardGame && !h.api.gambitGame, 'and Hold\'em from it');
  assert.deepEqual(kind(), ['dfcards']);
  h.press('Play The King\'s Gambit');
  // a stake down
  const gg = h.api.gambitGame;
  assert.equal(h.api.gambitStaked(), false, 'nothing staked at the setup');
  toBattle({ g: gg });
  const stake = gg.g.game.stake;
  assert.ok(stake > 0 && h.api.gambitStaked(), 'staked');
  assert.equal(h.playerEntity.goldPieces, 5000 - stake);
  const door = new Function('modes', 'townTalk', 'quiet', 'stakedSaveRefusal', `${SAVE_DOOR}\nreturn true;`);
  const told = [];
  assert.equal(door({ gambitStaked: h.api.gambitStaked }, { say: (x) => told.push(x) }, false, stakedSaveRefusal), false, 'the quick save refused');
  assert.equal(door({ gambitStaked: h.api.gambitStaked }, { say: (x) => told.push(x) }, true, stakedSaveRefusal), false, 'the quiet checkpoint too');
  assert.deepEqual(told, [stakedSaveRefusal()], 'said once, to the save pressed');
  assert.equal(new Function('naval', 'modes', `return (${SAVE_PREVENTED})();`)(null, { gambitStaked: h.api.gambitStaked }), true, 'the pause\'s Save says why');
  // its regulars in the chairs its setup lists (the seat's free chairs, 1 to 3)
  const standing = h.api.cardRegularsNow(0);
  assert.deepEqual(standing.map((r) => [r.key.split(':')[0], Number(r.key.split(':').pop())]).sort(), [['gambit', 1], ['gambit', 2], ['gambit', 3]], 'a regular in each free chair');
  assert.ok(standing.every((r) => r.st === seatTopByte(0.8) && r.res.look && r.feet?.length === 3), 'each dressed off the namer\'s seed, at their chair\'s feet and height');
  // standing up forfeits the stake: the regular keeps it, said, and booked against their night
  const name = gg.g.game.name;
  h.api.standFromCardTable();
  assert.ok(!h.api.gambitGame && !h.api.gambitStaked(), 'the slot emptied, nothing staked');
  assert.deepEqual(h.panels(), [], 'the panel gone');
  assert.equal(h.playerEntity.goldPieces, 5000 - stake, 'the stake the regular\'s');
  assert.equal(h.said.at(-1), resultGold({ winner: 1, by: 'forfeit' }, stake, name), 'the forfeit said');
  assert.ok(h.playerEntity.gambitPurses, 'and booked');
  assert.equal(h.keys(), keys0, 'its listeners off the window');
  // a load's road settles nothing: the game the load threw away
  h.api.sitAtCardTable(0);
  h.press('Play The King\'s Gambit');
  toBattle({ g: h.api.gambitGame });
  const book = structuredClone(h.playerEntity.gambitPurses), heard = h.said.length;
  h.api.standFromCardTable({ cashOut: false });
  assert.ok(!h.api.gambitGame && h.said.length === heard && JSON.stringify(h.playerEntity.gambitPurses) === JSON.stringify(book), 'nothing said, nothing booked');
  // the switch off: no panel offers it
  setPref(KINGS_GAMBIT_KEY, false);
  h.api.sitAtCardTable(0);
  assert.ok(!h.buttons().some((b) => b.startsWith('Play The King\'s Gambit')), `Hold'em: ${h.buttons()}`);
  h.press('Play Iliac Hand');
  assert.ok(h.api.iliacGame && !h.buttons().some((b) => b.startsWith('Play The King\'s Gambit')), `Iliac Hand: ${h.buttons()}`);
  h.api.standFromCardTable();
  // a game for fun (a realm character's table) is under way and holds no gold: the save need not wait
  setPref(KINGS_GAMBIT_KEY, true);
  const f = cardHost({ friendly: true });
  f.api.sitAtCardTable(0);
  f.press('Play The King\'s Gambit');
  const fg = f.api.gambitGame;
  fg.press('regular', 1); fg.press('next'); fg.press('autofill'); fg.press('start');
  assert.ok(fg.playing() && fg.g.game.stake === 0, 'a game for fun under way');
  assert.equal(f.api.gambitStaked(), false, 'nothing staked');
  assert.equal(door({ gambitStaked: f.api.gambitStaked }, { say: () => {} }, false, stakedSaveRefusal), true, 'the save goes on');
  f.api.standFromCardTable();
});
