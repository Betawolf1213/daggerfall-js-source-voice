// OUTDOOR-LOOT, SLICE 2 (2026-10-17) - THE EDGES THE WRITTEN PINS DO NOT REACH. test/net/containerloot*.test.js pin the design's laws
// against the doors the interior host calls; the implementation (world/interior/interiorRoomLoot.js) also decides a few things the
// design leaves to it, each one a way a player would otherwise meet the bug again or lose something the old law never lost:
//   - OFFLINE the room is inert: the page has no peer id, so the roll is written as it always was, a take is the player's own and
//     the scene cache's list is the player's own cupboard (set aside online alone);
//   - a roll of NOTHING is the room's at once: "If no contents, do nothing" asks no Yes, so without a birth every press would roll
//     the cupboard again and a player could press until it held something;
//   - NO SEAT KNOWN is no other seat: the dungeon's own rule (WORLD2 dungeonAuthority) - a take is never left waiting on a seat that
//     is not there (a socket dead, a welcome not yet heard);
//   - a minter's birth, said again, is ANSWERED by the seat with the base that stands (the seat's one word may have been lost), and a
//     birth that LOSES is answered the same, so a client that missed the winner's word converges on it;
//   - a NEW DAY's stock replaces yesterday's without taking back what was taken yesterday (only a lost tie-break does).
// Mounted as the cupboard files mount (./containerLootHarness.mjs): the host's own doors over a relay stand-in.
import '../modsOff.js';
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetQuickLoot } from '../../src/systems/quickLoot.js';
import { setSharedClock } from '../../src/systems/worldTick.js';
import {
  REAL_RANDOM, TODAY, clock, items, names, mk, peekNames, packHas, have, windowOf, frame, elapse, quiesce, rolled, firstOpen, pressYes,
  relay, player, plaque,
} from './containerLootHarness.mjs';

afterEach(() => { Math.random = REAL_RANDOM; resetQuickLoot(); setSharedClock(null); });

const STOCK = () => [mk('Dagger'), mk('Mace'), mk('Katana'), mk('Staff')];
/** A building whose cupboard A (the seat) first-opened on `stock`, closed, and everyone has heard. */
function born(n = 3, stock = STOCK(), opts = {}) {
  const s = rolled(n, [stock], opts);
  const wa = firstOpen(s.A);
  wa.close(); frame(s.A); s.net.flush();
  return s;
}
const copies = (s, name) => s.ps.reduce((n, p) => n + packHas(p, name), 0);

test('OFFLINE (no peer id): the room is inert - the roll is written to the cupboard as it always was and listed, a take is the player\'s own at once, nothing is claimed, and the scene cache\'s list is not set aside', () => {
  const net = relay();
  const p = player(net, 'aaaa-0001', { seed: 7, roll: () => [mk('Dagger'), mk('Mace')] });
  p.state.host.selfId = () => null; p.state.host.roomHost = () => null;   // the page is offline: there is no session, no id, no seat
  const room = p.as(() => p.h.bag().room);
  assert.equal(room.live(), false, 'the cupboards\' room is minted with the bag but waits on a peer id');
  const w = windowOf(p);
  assert.ok(pressYes(p, w), 'the press opens the cupboard');
  assert.deepEqual(names(items(p)), ['Dagger', 'Mace'], 'the roll is the cupboard\'s own list');
  assert.equal(p.ctx.containers[0].stockedDate, TODAY, 'dated today');
  w.takeNamed('Mace');
  frame(p);
  assert.equal(packHas(p, 'Mace'), 1, 'a take is the player\'s own - no claim lifts it out of the pack');
  elapse({ ps: [p], net }, 10_000);
  assert.equal(packHas(p, 'Mace'), 1, 'and nothing lapses it back');
  assert.equal(net.words(p).filter((r) => 'q' in r || 'b' in r || 'g' in r).length, 0, 'no word of the room\'s law is said');
  w.close(); frame(p);
  assert.deepEqual(peekNames(p), ['Dagger'], 'the plaque lists the cupboard as it stands');
  p.ctx.containers[0].items = [mk('Flail')];   // what the scene cache laid, offline: the player\'s own cupboard
  p.as(() => room.aside(p.ctx));
  assert.deepEqual(names(items(p)), ['Flail'], 'offline the cache\'s list is kept');
});

test('a roll of NOTHING is the room\'s at once: no Yes is asked and the empty cupboard stands for the day for everyone - a press never rolls it again, here or in another player\'s hands', () => {
  const s = rolled(3, [[], STOCK(), STOCK()]);
  const wa = windowOf(s.A);
  assert.equal(pressYes(s.A, wa), null, 'A rolled nothing: "If no contents, do nothing" - no question, no window');
  s.net.flush();
  for (const p of s.ps) {
    assert.ok(Array.isArray(items(p)), `${p.id} has heard the room: the cupboard is born, and empty`);
    assert.deepEqual(names(items(p)), [], `${p.id}'s list is empty`);
  }
  assert.equal(plaque(s.B)?.kind, 'items', 'B\'s plaque is a (glance at an) empty list, not a name that invites a press');
  const wb = windowOf(s.B);
  assert.equal(pressYes(s.B, wb), null, 'B\'s press does nothing: B\'s own dice would have rolled a stock, and the room\'s empty one stands');
  assert.equal(items(s.B).length, 0);
  for (let i = 0; i < 3; i++) { pressYes(s.A, wa); pressYes(s.C, windowOf(s.C)); }
  assert.deepEqual(names(items(s.A)), [], 'pressed again and again, A\'s cupboard is still empty (it is never rolled again)');
});

test('NO SEAT KNOWN is no other seat: with the relay\'s seat unheard, a take is judged where it stands and lands at once - never left waiting on a seat that is not there', () => {
  const s = born(3);
  s.net.seatId = null;   // a welcome not yet heard, or a socket dead: the session holds no host
  const wb = windowOf(s.B);
  assert.ok(pressYes(s.B, wb), 'B opens the cupboard');
  wb.takeNamed('Mace');
  wb.close(); frame(s.B);
  assert.equal(packHas(s.B, 'Mace'), 1, 'the take stands in B\'s pack at once - no verdict to wait for');
  assert.equal(s.net.words(s.B).filter((r) => Array.isArray(r.q)).length, 0, 'and no claim was said to a seat that is not there');
  assert.equal(have(items(s.B), 'Mace'), 0, 'B\'s list shows it no more');
  elapse(s, 6000);
  assert.equal(packHas(s.B, 'Mace'), 1, 'and nothing lapses it back');
});

test('a minter\'s birth is said again until the seat answers - and the seat ANSWERS the birth it has already adopted, so the one word that was lost is not the end of it', () => {
  const s = rolled(3, [null, [mk('Dagger'), mk('Mace')]]);
  let lost = 0;
  s.net.drop = (from) => from === s.A.id && lost++ < 1;   // the first word the seat says - its answer to B's birth - is lost on the wire
  const wb = firstOpen(s.B);
  s.net.flush();
  assert.equal(lost, 1, 'the seat\'s answer to the birth was lost (guard)');
  elapse(s, 6000);
  assert.ok(wb.cur, 'B\'s window is still open (guard)');
  const answers = s.net.words(s.A).filter((r) => Array.isArray(r.b));
  assert.ok(answers.length >= 2, `the seat answered B's birth ${answers.length} time(s) - the answer that was lost, and the one B's second birth word drew`);
  const births = s.net.words(s.B).filter((r) => Array.isArray(r.b)).length;
  assert.ok(births >= 2 && births <= 4, `B said its birth ${births} times - again until the seat's word was heard, and no longer`);
  for (const p of [s.A, s.C]) assert.deepEqual(names(items(p)), ['Dagger', 'Mace'], `${p.id} has the cupboard's list`);
});

test('a birth that LOSES is answered by the seat with the base that won - a client that missed the winner\'s word converges on it, and its takes from its own roll are refused', () => {
  const s = rolled(3, [[mk('Dagger'), mk('Mace')], null, [mk('Katana'), mk('Staff')]]);
  s.net.cut.add(`${s.A.id}>${s.C.id}`);   // C hears nothing the seat says while A first-opens
  const wa = firstOpen(s.A);
  s.net.flush();
  wa.close(); frame(s.A); s.net.flush();
  assert.equal(items(s.C), null, 'C has heard nothing of the cupboard (guard)');
  s.net.cut.delete(`${s.A.id}>${s.C.id}`);
  clock.t += 5;
  const wc = firstOpen(s.C);   // C opens the cupboard on its own roll, the later mint
  wc.takeNamed('Katana');
  s.net.flush();
  wc.close(); frame(s.C); s.net.flush();
  quiesce(s);
  for (const p of s.ps) assert.deepEqual(names(items(p)), ['Dagger', 'Mace'], `${p.id} ends on the earlier mint's list`);
  assert.equal(packHas(s.C, 'Katana'), 0, 'C holds nothing of its own, losing roll');
});

for (const who of ['another player', 'the seat itself']) {
  test(`a NEW DAY's stock replaces yesterday's without taking back what was taken yesterday [${who} restocks] - only a lost tie-break lifts a piece out of a pack`, () => {
    const s = rolled(3, [STOCK(), [mk('Flail'), mk('Warhammer')]]);
    const wa = firstOpen(s.A);
    wa.takeNamed('Mace');
    wa.close(); frame(s.A); s.net.flush();
    assert.equal(packHas(s.A, 'Mace'), 1, 'A, the seat, took the Mace of yesterday\'s stock (guard)');
    for (const p of s.ps) p.state.stockedToday = () => TODAY + 1;   // the game day turns over
    const opener = who === 'the seat itself' ? s.A : s.B;
    opener.roll = () => [mk('Flail'), mk('Warhammer')];
    const wo = windowOf(opener);
    assert.ok(pressYes(opener, wo), `${opener.id} presses: the cupboard is due to restock, and its roll is the new day's stock`);
    wo.close(); frame(opener); s.net.flush();
    quiesce(s);
    for (const p of s.ps) assert.deepEqual(names(items(p)), ['Flail', 'Warhammer'], `${p.id} has the new day's list`);
    assert.equal(packHas(s.A, 'Mace'), 1, 'A keeps the Mace it took yesterday - the room moved to a new day, it did not lose a tie-break');
    assert.equal(copies(s, 'Mace'), 1);
    assert.equal(s.A.ctx.containers[0].stockedDate, TODAY + 1, 'and the cupboard is dated the new day');
  });
}

test('a PUT made under a roll that has lost the first-open tie-break comes home: the stash is refused with its mint, goes back to the putter\'s pack once the window is shut, and is in no list - not lost, not copied', () => {
  const winRoll = [mk('Dagger'), mk('Mace')], loseRoll = [mk('Katana'), mk('Staff')];
  const s = rolled(3, [winRoll, loseRoll]);
  const ww = firstOpen(s.A);
  clock.t += 5;
  const Y = mk('Flail');
  s.B.entity.items.push(Y);
  const wl = firstOpen(s.B);   // B's roll is the later mint
  s.net.flush();   // the births cross: B's window still shows its own roll
  wl.put(Y);
  assert.equal(packHas(s.B, 'Flail'), 0, 'the Flail is in B\'s window (guard)');
  ww.close(); wl.close();
  quiesce(s);
  assert.equal(packHas(s.B, 'Flail'), 1, 'the stash of a base that is gone is refused and the piece is B\'s again');
  for (const p of s.ps) assert.equal(have(items(p), 'Flail'), 0, `${p.id}'s list shows no Flail`);
  for (const p of s.ps) assert.deepEqual(names(items(p)), ['Dagger', 'Mace'], `${p.id} ends on the earlier mint's list`);
});

test('a stack laid ONTO one of the room\'s stacks is a put of what was added: the others see both rows, the putter holds none, and the room\'s own stack is as it was', () => {
  const s = rolled(3, [[mk('Dagger'), mk('Arrow', 'Weapons', { stackCount: 10 }), mk('Mace')]]);
  const wa = firstOpen(s.A); wa.close(); frame(s.A); s.net.flush();
  const arrows = mk('Arrow', 'Weapons', { stackCount: 5 });
  s.B.entity.items.push(arrows);
  const wb = windowOf(s.B);
  assert.ok(pressYes(s.B, wb), 'B opens the cupboard');
  wb.put(arrows);
  assert.equal(have(items(s.B), 'Arrow'), 15, 'B\'s window shows the stack grown to fifteen (guard)');
  wb.close(); frame(s.B); s.net.flush(); quiesce(s);
  assert.equal(packHas(s.B, 'Arrow'), 0, 'B holds none of the five');
  for (const p of s.ps) assert.equal(have(items(p), 'Arrow'), 15, `${p.id}'s list holds the ten and the five`);
  const wc = windowOf(s.C);
  assert.ok(pressYes(s.C, wc), 'C opens it');
  wc.takeAmount('Arrow', 4); wc.close(); frame(s.C); s.net.flush(); quiesce(s);
  assert.equal(packHas(s.C, 'Arrow'), 4, 'C takes four off the room\'s own stack');
  for (const p of s.ps) assert.equal(have(items(p), 'Arrow'), 11, `${p.id}'s list holds the eleven that are left: six and the five`);
});

test('a birth no seat ever answers (an older build holds the seat, or its socket is dead) is said again a BOUNDED number of times - the minter is not left flooding the room for as long as it stands in the building', () => {
  const s = rolled(3, [null, [mk('Dagger'), mk('Mace')]]);
  s.net.dead.add(s.A.id);   // the seat answers nothing
  const wb = firstOpen(s.B);
  elapse(s, 120_000, { step: 500 });
  assert.ok(wb.cur, 'B\'s window is still open (guard)');
  const births = s.net.words(s.B).filter((r) => Array.isArray(r.b)).length;
  assert.ok(births >= 10 && births <= 41, `B said its birth ${births} times in two minutes - again every ${1500} ms, and then no more`);
  assert.deepEqual(names(items(s.B)), ['Dagger', 'Mace'], 'and B\'s own window shows its roll');
});
