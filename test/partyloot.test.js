// PARTY-LOOT (2026-10-14, a player: "When in a party, if a monster is killed, loot drops for one player but the other
// player sees "Empty". If that player clicks "Empty" it wipes out the loot for the other player"). Every copy of a
// dungeon body rolled its own list and the first OPENER's became the room's (WORLD4), so a party member whose own roll
// came up empty opened "Empty", claimed it, and emptied the killer's body for everyone.
//
// Mounted, not matched: two clients of one dungeon room - the host, who runs the room's foes, and a joiner - each built
// from the REAL kill door (damageFoe's death arm), the host's stream (foesFrame, roomRecord), the joiner's stream doors
// (applyFoesFrame, applySharedRecords, applyFoeRecord, setFoeDead, spawnCorpse), the room's loot (publishLoot,
// applyLoot, applyActions, actionRecords and PARTY-LOOT's doors), takeLoot, the inventory window's own onClose and the
// Physical Items layer's bodies, sliced out of src/scenes/dungeonContext.js. Takes and stores go through the real
// transfer (systems/itemTransfer.js planTake/planStore/applyTransfer - a whole take splices the item out, a partial take
// leaves the remainder in place, a store appends). A relay joins the two: it delivers in order when flushed, refuses a
// copy's acts the way world.js's act bucket does and heals them through the sender's own actionRecords (the re-read
// actFlush makes), or loses a copy's acts (a runner that says nothing at the death - an older build).
//
// The stand-ins are the doors no loot law reads, and are named: the window itself (openInventory answers a window whose
// close runs the real onClose), the body's flat (spawnCorpseNow), the kit's, food's, card's and sigils' dice, the
// death's handlers (raiseEnemyDeath adds one find, as a handler's find lands on the body), the clock (a fake
// performance.now, and the shared wall clock on or off), and world.js's act path itself (the relay above).
// Recorded in bible/06-Systems/Online-Arc.md (PARTY-LOOT); mutants: tools/mutants/partyloot.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { goldStack } from '../src/systems/inventory.js';
import { createWeapon } from '../src/combat/enemyEquipment.js';
import { D, AST, fnSrc, physicalBodiesSrc, onCloseSrc, K, rat, names, counts, take, store, room } from './partyLootRig.mjs';

test('PARTY-LOOT: the report - the killer\'s body is the room\'s from its death; a party member whose own roll came up empty sees the killer\'s list, opens it without a claim, and its close leaves the killer\'s loot where it lay; with the shared clock off and on (mutants: no word at the death; the word before the handlers\' finds; an early word dropped; the laid body never handed its word)', () => {
  for (const wall of [false, true]) {
    const r = room({ wall });
    const H = r.host, J = r.joiner;
    H.damageFoe(H.foes[0], 99);
    assert.equal(H.foes[0].dead && H.foes[0].corpse, true, 'the host laid the body');
    assert.deepEqual(names(H.body()), ['Dagger', 'Gold Pieces', 'the handler\'s find'], 'the host\'s list: its roll and the death\'s find');
    const said = r.saidBy('H');
    assert.equal(said.length, 1, 'the runner said the body at its death');
    assert.deepEqual(said[0].l.map((rec) => rec.k), ['corpse:0']);
    assert.deepEqual(said[0].l[0].r.map((it) => it.name), names(H.body()), 'its whole list - the handlers\' finds and all');
    assert.equal(said[0].l[0].t, wall ? r.clock : undefined, 'stamped by the shared clock when it runs (WORLD8)');
    assert.equal(H.seen().has('corpse:0'), true, 'the room has spoken about it');
    assert.equal(H.claimed.n, 1, 'and the room\'s memory falls due (AUDIT WORLD4 D5) - a joiner arriving after the kill reads the list');
    // the word leaves at the death, the frame that lays the body after it - the joiner hears the word first
    r.flush();
    assert.equal(J.foes[0].dead, false, 'the joiner\'s copy still stands');
    assert.equal(J.early().has('corpse:0'), true, 'so the word waits for the body');
    r.stream();
    assert.equal(J.foes[0].dead && J.foes[0].corpse, true, 'the host\'s frame laid it');
    assert.deepEqual(J.body(), H.body(), 'and it holds the host\'s list, not the joiner\'s own empty roll');
    assert.equal(J.seen().has('corpse:0'), true);
    assert.equal(J.early().size, 0, 'the word was spent on the body');
    r.stream();   // the host streams its dead foe on every full frame
    assert.deepEqual(J.body(), H.body(), 'a frame of a body it holds changes nothing');
    assert.equal(J.lootWordDue(J.foes[0], 'corpse:0'), false, 'and nothing waits for a word it has');
    // the press: the window opens on the room's list, and claims nothing - the room has spoken
    const before = r.sent.length;
    J.api.takeLoot('corpse:0');
    assert.equal(J.windows.length, 1, 'the window stood');
    assert.deepEqual(J.windows[0].items, H.body());
    assert.equal(r.sent.length, before, 'no claim at the open');
    J.windows[0].close();
    r.flush();
    assert.deepEqual(names(H.body()), ['Dagger', 'Gold Pieces', 'the handler\'s find'], 'the killer\'s loot is where it lay');
    assert.equal(H.body()[1].stackCount, 250);
  }
});

test('PARTY-LOOT: a word the act bucket refused - the body the stream laid first waits for it; a press inside the wait opens nothing and claims nothing; the heal re-reads the host\'s list and the press opens on it; its Physical Items stand only then (mutants: no wait; a word heard ignored by the wait; the held press dropped; the held press never opened; the physical body stood early)', () => {
  const r = room();
  const H = r.host, J = r.joiner;
  r.refuse.add('H');
  H.damageFoe(H.foes[0], 99);
  assert.deepEqual(r.saidBy('H'), [], 'the bucket said no');
  assert.equal(H.seen().has('corpse:0'), true, 'the host has spoken all the same - its heal will say it');
  r.stream();
  assert.deepEqual(J.body(), [], 'laid with the joiner\'s own roll - "Empty"');
  assert.equal(J.lootWordDue(J.foes[0], 'corpse:0'), true, 'the runner\'s word is due');
  assert.equal(J.api.takeLoot('corpse:0'), 0, 'the press waits');
  assert.equal(J.windows.length, 0, 'no window on the copy\'s own roll');
  assert.deepEqual(r.saidBy('J'), [], 'and no claim of it');
  assert.deepEqual(J.physicalBodies(), [], 'nor does the body stand its own roll as Physical Items');
  assert.equal(J.heldLootTick(), false, 'still due');
  r.clock += 200;
  r.heal('H');   // a token again: the pending key, re-read from the host's body as it stands now
  r.flush();
  assert.deepEqual(J.body(), H.body(), 'the word landed on the laid body');
  assert.equal(J.lootWordDue(J.foes[0], 'corpse:0'), false, 'and the wait is over the moment it lands');
  assert.deepEqual(J.physicalBodies().map((b) => [b.key, b.entity.items]), [['corpse:0', H.body()]], 'its items stand now, the room\'s');
  assert.equal(J.heldLootTick(), true, 'the held press opens now');
  assert.equal(J.windows.length, 1);
  assert.deepEqual(J.windows[0].items, H.body(), 'on the room\'s list');
  assert.deepEqual(r.saidBy('J'), [], 'with no claim');
  assert.equal(J.held(), null, 'once');
  assert.equal(J.heldLootTick(), false);
});

test('PARTY-LOOT: a runner that says nothing at the death (an older build) - the joiner\'s press waits LOOT_WORD_WAIT_MS from the laying, however often the host streams the body, and then opens and claims its own roll, as the room always did (mutants: the wait never ends; every dead frame a laying)', () => {
  const r = room({ joinerItems: [goldStack(5)] });
  const H = r.host, J = r.joiner;
  r.lose.add('H');
  H.damageFoe(H.foes[0], 99);
  r.stream();
  J.api.takeLoot('corpse:0');
  assert.equal(J.windows.length, 0, 'held');
  r.clock += K.LOOT_WORD_WAIT_MS - 1;
  r.stream();   // the host's next full frame of its dead foe
  assert.equal(J.heldLootTick(), false, 'inside the wait');
  r.clock += 2;
  r.stream();
  assert.equal(J.heldLootTick(), true, 'past it: the press opens - the frames since the laying never armed it again');
  assert.deepEqual(names(J.windows[0].items), ['Gold Pieces'], 'on the copy\'s own roll');
  const claims = r.saidBy('J');
  assert.equal(claims.length, 1, 'and claims it for the room');
  assert.deepEqual(claims[0].l[0].r.map((it) => it.stackCount), [5]);
});

test('PARTY-LOOT: a window that moved nothing does not speak over the word the room said while it stood open - the held word lands at its close (the old close put back what the host had taken); a window that moved something still says what is left (mutants: the close always speaks; the open keeps no list; the word under the window not kept; the mount claims around lootOpened; the close says around lootClosed)', () => {
  const r = room();
  const H = r.host, J = r.joiner;
  H.damageFoe(H.foes[0], 99);
  r.flush();
  r.stream();
  J.api.takeLoot('corpse:0');
  const jw = J.windows[0];
  // the host opens its own body and takes the dagger while the joiner's window stands
  H.api.takeLoot('corpse:0');
  const hw = H.windows[0];
  take(hw.items, hw.items[0], H.pack);
  assert.deepEqual(names(H.pack), ['Dagger']);
  hw.close();
  r.flush();
  assert.deepEqual(names(J.body()), ['Dagger', 'Gold Pieces', 'the handler\'s find'], 'C1: the host\'s word waits at the joiner\'s open window');
  const before = r.sent.length;
  jw.close();
  assert.equal(r.sent.length, before, 'the joiner moved nothing and says nothing');
  assert.deepEqual(names(J.body()), ['Gold Pieces', 'the handler\'s find'], 'the held word landed at the close');
  r.flush();
  assert.deepEqual(names(H.body()), ['Gold Pieces', 'the handler\'s find'], 'and the dagger the host took stays taken');
  // a window that moves something is the room's newest word, as WORLD4's close always was
  J.api.takeLoot('corpse:0');
  take(J.windows[1].items, J.windows[1].items[0], J.pack);
  J.windows[1].close();
  r.flush();
  assert.deepEqual(names(H.body()), ['the handler\'s find'], 'the joiner\'s take is the room\'s');
});

test('PARTY-LOOT: what "moved nothing" reads - part of a stack taken (the item stays, its count falls) and a piece swapped for another (the count stays, the item changes) are moves, and such a close says its list over the word it heard (mutants: the stack\'s count unread; the item\'s identity unread)', () => {
  for (const move of ['part of a stack', 'a piece swapped']) {
    const r = room();
    const H = r.host, J = r.joiner;
    H.damageFoe(H.foes[0], 99);
    r.flush();
    r.stream();
    J.api.takeLoot('corpse:0');
    const jw = J.windows[0];
    // a word the room says while the joiner's window stands: the host takes its own find
    H.api.takeLoot('corpse:0');
    take(H.windows[0].items, H.windows[0].items[2], H.pack);
    H.windows[0].close();
    r.flush();
    if (move === 'part of a stack') {
      take(jw.items, jw.items[1], J.pack, 100);
      assert.deepEqual(counts(jw.items), [1, 150, 1], 'the remainder stays where it lay (systems/itemTransfer.js\'s split)');
    } else {
      take(jw.items, jw.items[2], J.pack);
      store(jw.items, createWeapon(118, 1), J.pack);
      assert.deepEqual(names(jw.items), ['Dagger', 'Gold Pieces', 'Broadsword'], 'as many pieces, each count as it was');
    }
    const before = r.saidBy('J').length;
    jw.close();
    const said = r.saidBy('J');
    assert.equal(said.length, before + 1, `${move}: the close speaks`);
    assert.deepEqual([names(said.at(-1).l[0].r), counts(said.at(-1).l[0].r)], [names(J.body()), counts(J.body())], `${move}: and says what is left`);
  }
});

test('PARTY-LOOT: a window whose open was the claim (the runner\'s word late past the wait) still says its list at the close - a word that crossed the claim is another claim, and the close settles the two, so both copies end on one list (mutants: the claim\'s window keeps its list)', () => {
  const r = room({ joinerItems: [goldStack(5)] });
  const H = r.host, J = r.joiner;
  H.damageFoe(H.foes[0], 99);   // its word waits on the relay, past the wait
  r.stream();
  J.api.takeLoot('corpse:0');
  r.clock += K.LOOT_WORD_WAIT_MS + 1;
  assert.equal(J.heldLootTick(), true, 'the wait is over: the joiner opens on its own roll');
  assert.equal(r.saidBy('J').length, 1, 'and claims it');
  r.flush();   // the runner's word reaches the joiner under its window, the joiner's claim reaches the runner
  assert.deepEqual(names(H.body()), ['Gold Pieces'], 'the runner adopted the claim');
  J.windows[0].close();   // moving nothing
  r.flush();
  assert.equal(r.saidBy('J').length, 2, 'the claim\'s window says its list at the close');
  assert.deepEqual(J.body(), H.body(), 'one list on both copies');
});

test('PARTY-LOOT: a word held for a body is bounded - only a body the layout can lay (never a pile, a search, a body past the run), the newest LOOT_EARLY_MAX bodies (a body heard again is the newest), and none past LOOT_EARLY_MS (mutants: no cap; no age; any key held; a word heard again not the newest)', () => {
  const r = room();
  const J = r.joiner;
  const word = (k, items = [goldStack(1)]) => ({ k: 'dungeon:7', l: [{ k, r: items }] });
  for (const k of ['loot:0', 'srch:0', 'corpse:1', 'corpse:99999']) J.applyActions('H', word(k));
  assert.deepEqual([...J.early().keys()], [], 'nothing this layout lays');
  for (let n = 1; n <= K.LOOT_EARLY_MAX + 6; n++) J.applyActions('H', word(`enc:${n}`));
  assert.equal(J.early().size, K.LOOT_EARLY_MAX, 'at most LOOT_EARLY_MAX');
  assert.equal(J.early().has('enc:6') || J.early().has('enc:1'), false, 'the oldest go first');
  assert.equal(J.early().has('enc:7'), true);
  J.applyActions('H', word('enc:7'));   // heard again: the newest now
  J.applyActions('H', word(`enc:${K.LOOT_EARLY_MAX + 7}`));
  assert.equal(J.early().has('enc:7'), true, 'a body heard again is not the next to go');
  assert.equal(J.early().has('enc:8'), false, 'the oldest after it is');
  // a word older than LOOT_EARLY_MS is not landed on the body - the body waits for the runner's own
  J.applyActions('H', word('corpse:0', [goldStack(77)]));
  r.clock += K.LOOT_EARLY_MS + 1;
  r.host.damageFoe(r.host.foes[0], 99);   // its own word waits on the relay
  r.stream();
  assert.deepEqual(J.body(), [], 'the stale word stayed off the body');
  assert.equal(J.lootWordDue(J.foes[0], 'corpse:0'), true, 'which waits for the runner\'s word');
});

test('PARTY-LOOT: the runner says nothing offline, nothing for a body that is not the room\'s, and nothing over a word the room has already said (mutants: said offline; the death\'s word not a claim)', () => {
  const r = room();
  r.host.state.opts.selfId = () => null;   // offline: no room
  r.host.damageFoe(r.host.foes[0], 99);
  assert.deepEqual(r.sent, [], 'offline the body is this player\'s own');
  const q = room();
  const quest = rat([goldStack(9)]);
  q.host.foes.push(quest);   // past the layout's run: a quest spawn's body is its runner's own
  q.host.damageFoe(quest, 99);
  assert.equal(quest.dead, true);
  assert.deepEqual(q.sent, [], 'no key names it');
  const s = room();
  s.host.seen().add('corpse:0');   // the room has spoken about this body
  s.host.damageFoe(s.host.foes[0], 99);
  assert.deepEqual(s.sent, [], 'a claim never speaks over the room\'s word (AUDIT WORLD4 C2)');
});

test('PARTY-LOOT: a held press is the latest press, with its mode, and is dropped when the player is at another window by the time the word lands - or when the frame loop stood still past the wait, as it does under a window or the pause, so the body never opens long after the press (mutants: the held press over another window; the press\'s mode forgotten; the stale press opened)', () => {
  {
    const r = room();
    const H = r.host, J = r.joiner;
    r.refuse.add('H');
    H.damageFoe(H.foes[0], 99);
    r.stream();
    J.api.takeLoot('corpse:0');
    J.api.takeLoot('corpse:0', 'steal');
    assert.deepEqual(J.held(), { key: 'corpse:0', mode: 'steal', pileKeys: null, at: r.clock }, 'the latest press and its mode');
    J.state.activeOverlay = { done: false };   // the player opened something else meanwhile
    r.heal('H');
    r.flush();
    assert.equal(J.heldLootTick(), false, 'not over another window');
    assert.equal(J.held(), null, 'and not later either');
    J.state.activeOverlay = null;
    assert.equal(J.heldLootTick(), false);
    assert.equal(J.windows.length, 0);
  }
  {
    const r = room();
    const H = r.host, J = r.joiner;
    r.refuse.add('H');
    H.damageFoe(H.foes[0], 99);
    r.stream();
    J.api.takeLoot('corpse:0');
    r.clock += K.LOOT_WORD_WAIT_MS + K.LOOT_HELD_GRACE_MS + 1;   // no frame drew the foes meanwhile: a window stood, then closed
    r.heal('H');
    r.flush();
    assert.deepEqual(J.body(), H.body(), 'the word landed');
    assert.equal(J.heldLootTick(), false, 'but a press that old is not reopened');
    assert.equal(J.held(), null);
    assert.equal(J.windows.length, 0);
  }
});

test('PARTY-LOOT: a rest\'s encounter - the room\'s by its number, past the layout\'s run - is said by its number at its death, held for the joiner\'s puppet, and landed when the host\'s frame lays it (mutants: the death\'s word by the pool\'s index; the laid body looked up by the pool\'s index)', () => {
  const r = room({ enc: { id: 3, hostItems: [goldStack(40)] } });
  const H = r.host, J = r.joiner;
  H.damageFoe(H.foes[1], 99);
  const said = r.saidBy('H');
  assert.deepEqual(said.map((d) => d.l.map((rec) => rec.k)), [['enc:3']], 'by the room\'s number, never this pool\'s index');
  r.flush();
  assert.equal(J.early().has('enc:3'), true, 'held for the puppet');
  r.stream();
  assert.equal(J.foes[1].dead && J.foes[1].corpse, true, 'the frame laid the puppet\'s body');
  assert.deepEqual(J.body(1), H.body(1), 'with the host\'s list');
  assert.deepEqual(names(J.body(1)), ['Gold Pieces', 'the handler\'s find']);
  assert.equal(J.seen().has('enc:3'), true);
  J.api.takeLoot('corpse:1');
  assert.deepEqual(J.windows[0].items, H.body(1), 'the press opens it at once - its word has landed');
});

test('PARTY-LOOT, by source: one door claims and one door closes - `_lootOpenKey` is written by lootOpened and lootClosed alone; the window\'s mount claims through lootOpened and its close says through lootClosed; the kill door says the body after the death\'s handlers; the joiner\'s stream door hands the body it laid its word; a body whose word is due stands no physical items; the held press is asked every frame (mutants: the held press never asked)', () => {
  const writers = [];
  (function walk(n, fn) {
    if (!n || typeof n.type !== 'string') return;
    if (n.type === 'FunctionDeclaration') fn = n.id?.name;
    if (n.type === 'AssignmentExpression' && n.left.type === 'Identifier' && n.left.name === '_lootOpenKey') writers.push(fn);
    for (const k of Object.keys(n)) { const v = n[k]; if (Array.isArray(v)) v.forEach((c) => walk(c, fn)); else if (v && typeof v.type === 'string') walk(v, fn); }
  })(AST, null);
  assert.deepEqual(writers.sort(), ['lootClosed', 'lootOpened'], 'the open window\'s key has two writers');
  assert.match(D, /const _w = openInventory\(source, onEmptied, \{ lootHooks, lootKey: _k \}\);\s*if \(_w\) activeOverlay = _w;[^\n]*\n\s*if \(_w && _k\) lootOpened\(_k, source\);/, 'the mount claims');
  assert.match(onCloseSrc(), /^\(\) => \{ onEmptied\?\.\(\); if \(lootKey\) lootClosed\(lootKey\);/, 'the close says');
  const kill = fnSrc('damageFoe');
  assert.match(kill, /raiseEnemyDeath\(foe\.entity, [^\n]*\n\s*sayBodyLoot\(foe\);[^\n]*\n\s*return;/, 'the body is said once its handlers have found what they find, and capped');
  const door = fnSrc('applyFoeRecord');
  assert.match(door, /const laid = r\.d === 1 && !f\.dead;/, 'the frame that lays it');
  assert.match(door, /if \(laid\) streamLaidBody\(f\);[^\n]*\n\s*\}$/, 'its word handed on last, once the body stands');
  assert.match(physicalBodiesSrc(), /if \(lootWordDue\(f, u\)\) return null;/, 'a body whose word is due stands nothing of its own roll');
  assert.match(fnSrc('drawFoes'), /respawnSweep\(_ecvT\);[^\n]*\n\s*heldLootTick\(\);/, 'and the held press is asked every frame');
});
