// FIELD BUGS 2026-10-16 GRAVE-PARTY (bible/01-Overview/Field-Bugs-2026-10-16b.md; the Discord's "A few things": "graveyard
// loot on headstones are able to be looted by others, objects in tombs are un lootable (have not tried dungeons yet)"; Mac's
// SEARCH1-PARTY: "When one player in the party interacted with it no one else can again for 5 hours ... visible for
// everyone in the party the same the looter sees"). A SEARCH IS ITS SEARCHER'S PARTY'S - above ground and below:
//   - above, a headstone's search is said to the cell (net/overworldLaw.js owFoldGraves, the relay's `gr` kind, world208)
//     and every partymate's game locks the stone, by the searcher's name ("Already searched by Ann.") - a stranger's game
//     reads the row and locks nothing (scenes/searchPartyHost.js, over the REAL relay Room and REAL OnlineSessions);
//   - below, a coffin's `srch:<i>` word names its searcher and lands only in the searcher's party - a stranger in the same
//     crypt keeps their own roll, and is never told "You have already searched here." of an object they never touched
//     (scenes/searchRoom.js, over the dungeon host's own doors sliced from scenes/dungeonContext.js);
//   - a searchable's reach is the BODY's, to the nearest point of its box (systems/searchables.js searchReachFor): a coffin
//     on the floor answers from beside it (the dungeon's own lootTargets, the real pick);
//   - a PARTY-LOOT container whose room word this build cannot read is the player's own, no longer unborn for good
//     (scenes/roomLootHost.js roomPersonal, the dungeon's own takeLoot and lootTargets).
// Run against the tree before GRAVE-PARTY every test here fails (no searchedText, no `gr` kind, no searchRoom, a reach
// of SEARCH_REACH from the eye, an unreadable pile unborn).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as acorn from 'acorn';

import {
  searchKey, markSearched, searchCooldownLeft, searchedText, searchedBy, SEARCHED_TEXT, searchLedgerRecord, restoreSearchLedger,
  _resetSearchLedgerForTests, setSearchParty, searchPartyLens, searchKinOf, searchWhoOf, searchSelfAcct, searchAcctOfPeer,
  SEARCH_COOLDOWN_MINUTES, SEARCH_REACH, searchReachFor, searchBodyDistance, searchableKind, isPicked, searchName, rollSearchOutcome,
  mintSearchFind, searchMessage, SEARCH_KINDS, pickSearchUndead, pickRosterFoe, rollSearchElite, SEARCH_LOOT_MAX,
} from '../src/systems/searchables.js';
import {
  owFoldGraves, owGraveKey, owGraveLive, OW_GRAVE_KEEP_MIN, owPrune, toWelcome, owLedgerOf, newOwLedger, owLedgerEmpty,
} from '../src/net/overworldLaw.js';
import {
  validOwIn, validOwOut, OW_KINDS, OW_GRAVE_RELAY_MIN, relaySupportsOwGraves, OW_CELL_GRAVES_MAX, RELAY_VERSION, worldRoom,
  PIXEL_UNITS, sharedClassicMinutes, wallMsForClassicMinutes, parseClient, OW_LEDGER_KEY, respawnDue, validSocialFrame,
} from '../src/net/wire.js';
import { OnlineSession } from '../src/net/online.js';
import { SocialState } from '../src/net/social.js';
import { createSearchParty } from '../src/scenes/searchPartyHost.js';
import { createSearchRoom, SEARCH_FOREIGN_MAX, SEARCH_FOREIGN_PER_OBJECT, SEARCH_FOREIGN_BYTES } from '../src/scenes/searchRoom.js';
import { createRoomLoot } from '../src/scenes/roomLootHost.js';
import { setSharedClock, worldMinutes, sharedClockOn } from '../src/systems/worldTick.js';
import { midScreenText } from '../src/ui/midScreenText.js';
import { ActionTextBox } from '../src/ui/actionText.js';
import { pickActivatableHit, answersPress, rayAabb, RAY_DISTANCE, TREASURE_ACTIVATION_DISTANCE, CORPSE_ACTIVATION_DISTANCE } from '../src/player/activate.js';
import { CAPSULE_HEIGHT } from '../src/player/motor.js';
import { peerHanded } from '../src/systems/peerWord.js';
import { validLootList, LOOT_LIST_MAX, LOOT_NEWER_TEXT } from '../src/systems/loot.js';
import { effectiveLevel } from '../src/systems/mentorMode.js';
import { liveStat } from '../src/systems/statMods.js';
import { dungeonRarityTier, dungeonFamily } from '../src/systems/lootRarity.js';
import { enemyDisplayName, ENEMY_BASICS } from '../src/characters/enemyBasics.js';
import * as RL from '../src/systems/roomLoot.js';
import { installRoleplayRealismItems } from '../src/systems/rriInstall.js';
import { fakeRooms } from './fakeRoom.mjs';
import { fakeSocketClass } from './fakeSocket.mjs';

installRoleplayRealismItems();   // the hosts' own install (scenes/shared.js): its weapons are among a search's finds, and its templates the wire's
const rd = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const quiet = async (fn) => { const info = console.info, warn = console.warn; console.info = () => {}; console.warn = () => {}; try { return await fn(); } finally { console.info = info; console.warn = warn; } };
const lcg = (seed) => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
/** A die that answers `first` and then an lcg: the search's outcome is its first roll (systems/searchables.js rollSearchOutcome). */
const dieFrom = (first, seed) => { const r = lcg(seed); let n = 0; return () => (n++ === 0 ? first : r()); };

// ═══ THE DUNGEON HOST'S OWN DOORS, sliced (as test/partyloot.test.js reads them) ═══════════════════════════════════
const SRC = rd('src/scenes/dungeonContext.js');
const AST = acorn.parse(SRC, { ecmaVersion: 'latest', sourceType: 'module' });
function find(pred) {
  let hit = null;
  (function walk(n) {
    if (!n || typeof n.type !== 'string' || hit) return;
    if (pred(n)) { hit = n; return; }
    for (const k of Object.keys(n)) { const v = n[k]; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === 'string') walk(v); }
  })(AST);
  return hit;
}
const fnSrc = (name) => { const n = find((x) => x.type === 'FunctionDeclaration' && x.id?.name === name); assert.ok(n, `dungeonContext.js has function ${name}`); return SRC.slice(n.start, n.end); };
const declSrc = (name) => { const n = find((x) => x.type === 'VariableDeclaration' && x.declarations.some((d) => d.id?.name === name)); assert.ok(n, `dungeonContext.js declares ${name}`); return SRC.slice(n.start, n.end); };
const memberSrc = (name) => {
  const n = find((x) => x.type === 'Property' && !x.computed && x.key?.name === name && (x.value.type === 'FunctionExpression' || x.value.type === 'ArrowFunctionExpression'));
  assert.ok(n, `dungeonContext.js has member ${name}`);
  const body = SRC.slice(n.value.start, n.value.end);
  return n.method ? `function ${body}` : body;
};
/** The memory's loot, as sharedWorld composes it (its one line, read off the host). */
const MEMORY_RHS = (() => { const l = SRC.split('\n').find((x) => x.startsWith('      w.loot = ')); assert.ok(l, 'the memory composes its loot'); return l.trim().slice('w.loot = '.length).replace(/;$/, ''); })();
const scoped = (state) => new Proxy(state, {
  has: (t, k) => k !== '__s',
  get: (t, k) => (k === Symbol.unscopables ? undefined : (k in t ? t[k] : globalThis[k])),
  set: (t, k, v) => { t[k] = v; return true; },
});
const mount = (body, state) => new Function('__s', `with (__s) { ${body} }`)(scoped(state));

// ═══ THE PLAYERS ═══════════════════════════════════════════════════════════════════════════════════════════════════
/** A player's hub picture (net/social.js SocialState), through the wire's own projection. `party` the accounts seated
 *  with them (names and peer ids from PLAYERS), the first its leader; none, no party. */
const PLAYERS = {
  'acct-ann': { name: 'Ann', peer: 'a0a0-0001' }, 'acct-bob': { name: 'Bob', peer: 'b0b0-0002' }, 'acct-eve': { name: 'Eve', peer: 'e0e0-0003' },
  'acct-dan': { name: 'Dan', peer: 'd0d0-0004' }, 'acct-fay': { name: 'Fay', peer: 'f0f0-0005' },
};
function picture(social, acct, party = null) {
  const row = (a) => ({ acct: a, name: PLAYERS[a].name, online: true, peers: [PLAYERS[a].peer] });
  const f = validSocialFrame({ t: 'social', k: 'state', acct, name: PLAYERS[acct].name, peers: [PLAYERS[acct].peer], friends: [], in: [], out: [], invites: [],
    party: party ? { id: 'party-0001', leader: party[0], members: party.map(row) } : null });
  assert.ok(f, 'a hub picture the wire takes');
  social.apply(f);
  return social;
}
/** The streaming host's search party for a player (its lens captured - one process stands several players). */
function searchParty(host) {
  const sp = createSearchParty(host);
  return { sp, lens: searchPartyLens() };
}
const box = (min, max) => ({ min, max });

// ═══ 1. THE LAW ════════════════════════════════════════════════════════════════════════════════════════════════════

test('GRAVE-PARTY law: a search\'s hours carry WHO searched - mine says SEARCHED_TEXT, a partymate\'s "Already searched by <name>." (kept through the save); the later search holds the hours; the party lens says me, my party or nobody; the reach is the body\'s to the box; the cell keeps a grave row a stone and a searcher, stamped and kept its five hours, said in the welcome only when it holds any; the wire\'s third kind, world208 (mutants: the name dropped or unsaid; an earlier word shortening a search; a stranger taken for the party; the reach from the eye; the row re-taken inside its hours, kept past them or unbounded; an older relay told)', () => {
  _resetSearchLedgerForTests();
  const social = picture(new SocialState({ acct: 'acct-ann' }), 'acct-ann', ['acct-ann', 'acct-bob']);
  const { lens } = searchParty({ social });
  setSearchParty(lens);
  assert.equal(searchSelfAcct(), 'acct-ann');
  assert.deepEqual(['acct-ann', 'acct-bob', 'acct-eve', null, 7].map(searchKinOf), ['me', 'party', null, null, null]);
  assert.equal(searchWhoOf('acct-bob'), 'Bob', 'a partymate by the seat\'s name (the hub\'s)');
  assert.equal(searchWhoOf('acct-ann'), null, 'mine has no name');
  assert.equal(searchWhoOf('acct-eve', 'Eve'), null, 'a stranger is nobody\'s to name');
  assert.equal(searchAcctOfPeer(PLAYERS['acct-bob'].peer), 'acct-bob', 'a partymate\'s tab');
  assert.equal(searchAcctOfPeer(PLAYERS['acct-eve'].peer), null, 'a stranger\'s tab is no account of mine');
  const stone = searchKey('g101,207', '3'), coffin = searchKey('d777', '0:12');
  markSearched(stone, 1000, searchWhoOf('acct-bob'));
  markSearched(coffin, 1000);
  assert.equal(searchedText(stone), 'Already searched by Bob.');
  assert.equal(searchedText(coffin), SEARCHED_TEXT);
  assert.equal(searchedBy(coffin), null);
  markSearched(stone, 900);   // an older word about the same stone (a memory, a welcome)
  assert.equal(searchCooldownLeft(stone, 1000), SEARCH_COOLDOWN_MINUTES, 'the later search holds the hours');
  assert.equal(searchedText(stone), 'Already searched by Bob.', 'and its searcher');
  markSearched(stone, 1100);
  assert.equal(searchedText(stone), SEARCHED_TEXT, 'a later search of mine is mine');
  markSearched(stone, 1200, 'Bob');
  restoreSearchLedger(searchLedgerRecord(1250));
  assert.equal(searchedText(stone), 'Already searched by Bob.', 'the save keeps the name');
  assert.equal(searchCooldownLeft(stone, 1250), SEARCH_COOLDOWN_MINUTES - 50);
  setSearchParty(null);
  assert.equal(searchKinOf('acct-ann'), null, 'no lens: nobody is mine');
  // THE REACH: the body (the feet to the head) to the nearest point of the box
  const lid = box([0, 0, 0], [0.8, 0.45, 2]);   // a coffin on the floor (TEXTURE.092's low 16-20 units)
  assert.equal(searchBodyDistance(lid, [2.0, 0, 1], CAPSULE_HEIGHT), 1.2, 'beside it: the gap across the floor');
  assert.equal(searchReachFor(lid, [2.0, 0, 1], CAPSULE_HEIGHT), RAY_DISTANCE, 'inside SEARCH_REACH of the body: the ray\'s own');
  assert.equal(searchReachFor(lid, [2.5, 0, 1], CAPSULE_HEIGHT), SEARCH_REACH, 'further: the refusal\'s');
  assert.ok(Math.abs(searchBodyDistance(box([0, 2.5, 0], [1, 3, 1]), [0.5, 0, 0.5], 1.8) - 0.7) < 1e-9, 'a shelf over the head: the gap up');
  assert.equal(searchReachFor(lid, null, NaN), SEARCH_REACH, 'no feet known: as it was');
  // THE CELL'S GRAVES
  assert.equal(OW_GRAVE_KEEP_MIN, SEARCH_COOLDOWN_MINUTES, 'pinned equal: the search\'s own hours');
  const M = 900_000, led = newOwLedger();
  assert.deepEqual(owFoldGraves(led, [[101, 207, 3], [101, 207, 3], [101, 207, 4]], 'acct-ann', M), [[101, 207, 3, M, 'acct-ann'], [101, 207, 4, M, 'acct-ann']], 'each stone once, stamped and named by the relay');
  assert.deepEqual(owFoldGraves(led, [[101, 207, 3]], 'acct-ann', M + 10), [], 'inside its hours the same searcher\'s row stands');
  assert.deepEqual(owFoldGraves(led, [[101, 207, 3]], 'acct-eve', M + 10), [[101, 207, 3, M + 10, 'acct-eve']], 'another searcher, a row of their own');
  assert.deepEqual(owFoldGraves(led, [[101, 207, 3]], null, M), [], 'no account, nothing');
  assert.equal(owGraveLive(led.gr[owGraveKey([101, 207, 3, M, 'acct-ann'])], M + OW_GRAVE_KEEP_MIN - 1), true);
  assert.equal(owGraveLive(led.gr[owGraveKey([101, 207, 3, M, 'acct-ann'])], M + OW_GRAVE_KEEP_MIN), false);
  assert.deepEqual(owFoldGraves(led, [[101, 207, 3]], 'acct-ann', M + OW_GRAVE_KEEP_MIN), [[101, 207, 3, M + OW_GRAVE_KEEP_MIN, 'acct-ann']], 'past its hours: taken again, fresh');
  const T = wallMsForClassicMinutes(M + OW_GRAVE_KEEP_MIN + 20);
  assert.deepEqual(toWelcome(led, T).gr, [[101, 207, 3, M + OW_GRAVE_KEEP_MIN, 'acct-ann']], 'the welcome: the rows inside their hours');
  assert.equal(owPrune(led, T), true, 'the prune lets the rest go');
  assert.equal(Object.keys(led.gr).length, 1);
  assert.equal('gr' in toWelcome(newOwLedger(), T), false, 'none held: the welcome as it was');
  assert.deepEqual(owLedgerOf(JSON.parse(JSON.stringify(led))), led, 'stored and read back');
  assert.equal(owLedgerEmpty(led), false);
  const many = newOwLedger();
  for (let i = 0; i < OW_CELL_GRAVES_MAX + 4; i++) owFoldGraves(many, [[101, 207, i]], 'acct-ann', M + i);
  assert.equal(Object.keys(many.gr).length, OW_CELL_GRAVES_MAX, 'bounded');
  assert.ok(!many.gr[owGraveKey([101, 207, 0, M, 'acct-ann'])] && many.gr[owGraveKey([101, 207, OW_CELL_GRAVES_MAX + 3, M + OW_CELL_GRAVES_MAX + 3, 'acct-ann'])], 'the oldest out');
  // THE WIRE
  assert.deepEqual(OW_KINDS, ['sp', 'dg', 'gr']);
  assert.deepEqual(validOwIn({ k: 'gr', rows: [[101, 207, 3], [101, 207, 3]] }), { k: 'gr', rows: [[101, 207, 3]] });
  for (const bad of [{ k: 'gr', rows: [] }, { k: 'gr', rows: [[101, 207]] }, { k: 'gr', rows: [[1000, 207, 3]] }, { k: 'gr', rows: [[101, 207, -1]] }, { k: 'gr', rows: [[101, 207, 3, M, 'acct-ann']] }]) assert.equal(validOwIn(bad), null, JSON.stringify(bad));
  assert.deepEqual(parseClient(JSON.stringify({ t: 'ow', k: 'gr', rows: [[101, 207, 3]] }), { hasHello: true }), { t: 'ow', k: 'gr', rows: [[101, 207, 3]] });
  assert.deepEqual(validOwOut({ k: 'gr', rows: [[101, 207, 3, M, 'acct-ann'], [101, 207, 3], 'x', [101, 207, 3, -1, 'acct-ann'], [101, 207, 3, M, '']] }), { k: 'gr', rows: [[101, 207, 3, M, 'acct-ann']] });
  assert.equal(OW_GRAVE_RELAY_MIN, 208);
  assert.deepEqual(['world207', 'world208', 'world300', 'junk', null].map(relaySupportsOwGraves), [false, true, true, false, false]);
  assert.ok(relaySupportsOwGraves(RELAY_VERSION), 'this build\'s relay keeps them');
});

// ═══ 2. ABOVE GROUND: THE CELL ═════════════════════════════════════════════════════════════════════════════════════
const GPX = 101, GPY = 207, CELL = worldRoom(GPX, GPY);   // a Graveyard location's pixel (The Tombs of Klerd's, the field's)
const ON = { x: GPX * PIXEL_UNITS + 2000, y: 0, z: (499 - GPY) * PIXEL_UNITS + 2000, yaw: 0, pitch: 0, mv: 0 };
/** A headstone as world.js graveTargets mints it: its box in the ray's frame, its pixel's `loc`, its build's number. */
const STONE = { min: [0, 0, 0], max: [0.6, 1.1, 0.25], loc: `g${GPX},${GPY}`, key: '3' };
/** world.js's own routing of the cell's word (its line, read off the host): the graves to the search party, the rest to
 *  the ledger. */
const ROUTE = (() => {
  const l = rd('src/scenes/world.js').split('\n').find((x) => x.includes('online.onOverworld = (msg) =>'));
  assert.ok(l, 'world.js hands the cell\'s word on');
  const arrow = l.slice(l.indexOf('(msg) =>'), l.indexOf(';   //'));
  return (heard, ledger) => new Function('searchPartyHeard', 'overworldLedgerHeard', `return ${arrow};`)(heard, ledger);
})();

/** THE RELAY: an OnlineSession's socket onto the REAL relay Room (server/src/index.js) over test/fakeRoom.mjs's fake
 *  Durable Objects, every frame each way queued and handed on by pump(). */
function relayWorld(clock) {
  const rooms = fakeRooms({ now: () => clock.t });
  const pending = [];
  class BridgeWS {
    constructor(url) {
      this.url = url;
      this.key = decodeURIComponent(/\/room\/([^?]+)/.exec(url)[1]);
      this.r = rooms.room(this.key);
      this.readyState = 0;
      this.out = [];
      const rws = this.r.connect();
      const send = rws.send.bind(rws), close = rws.close.bind(rws);
      rws.send = (s) => { send(s); pending.push(() => { if (this.readyState === 1) this.onmessage?.({ data: s }); }); };
      rws.close = (code, reason) => { close(code, reason); pending.push(() => { if (this.readyState !== 3) { this.readyState = 3; this.onclose?.({ code, reason }); } }); };
      this.rws = rws;
      pending.push(() => { this.readyState = 1; this.onopen?.(); });
    }
    send(s) { if (this.readyState !== 1) throw new Error('not open'); this.out.push(JSON.parse(s)); pending.push(() => this.r.room.webSocketMessage(this.rws, s)); }
    close(code = 1000, reason = '') { if (this.readyState === 3) return; this.readyState = 3; pending.push(async () => { const i = this.r.sockets.indexOf(this.rws); if (i >= 0) this.r.sockets.splice(i, 1); await this.r.room.webSocketClose(this.rws, code, reason); }); }
  }
  async function pump(rounds = 12) { for (let k = 0; k < rounds; k++) { while (pending.length) await pending.shift()(); await new Promise((r) => setTimeout(r, 0)); } }
  function session(acct) {
    const { name, peer } = PLAYERS[acct];
    const s = new OnlineSession({ url: 'wss://relay.test', name, id: peer, secret: 'secret-of-' + peer, WebSocketImpl: BridgeWS, now: () => clock.t });
    s.mintToken = (room) => rooms.room(room).token(peer, { s: acct, n: name });
    return s;
  }
  return { rooms, session, pump };
}

/** A player at the graveyard: their hub picture, their session, the streaming host's search party over both (its lens
 *  captured), their own ledger and dice - swapped in for everything they do (one process stands them all). */
function graveyardPlayer(world, acct, party, first = 0.1) {
  const social = picture(new SocialState({ acct }), acct, party);
  const shown = [];
  const session = world.session(acct);
  const townTalk = { say: (l) => shown.push(l), showOverlay: (w) => shown.push(w) };
  const { sp, lens } = searchParty({ townTalk, droppedLoot: { dropPile: () => null, releaseEmptied: () => {} }, exteriorFoes: { spawnFoe: () => Promise.resolve() }, makeInventoryWindow: () => null, player: { pos: [0, 0, 1], eye: [0, 1.7, 1] }, playerTravelPixel: () => ({ x: GPX, y: GPY }), dropFeet: () => [0, 0, 1], partyNear: () => [], online: session, social });
  const P = { acct, social, session, sp, shown, ledger: { rows: [] }, rand: dieFrom(first, acct.length * 7919) };
  P.as = (fn) => {
    restoreSearchLedger(P.ledger); setSearchParty(lens);
    const real = Math.random; Math.random = P.rand;
    try { return fn(); } finally { Math.random = real; P.ledger = searchLedgerRecord(); }
  };
  const route = ROUTE((msg) => sp.heard(msg), () => {});
  session.onOverworld = (msg) => P.as(() => route(msg));
  /** The press on the stone: what it answered - `searched` (the box stood) or the mid-screen line. */
  P.press = () => P.as(() => { midScreenText.text = ''; const n = shown.length; sp.activateGrave(STONE, 'grab'); return shown.length > n && shown.at(-1) instanceof ActionTextBox ? 'searched' : midScreenText.text; });
  return P;
}

test('GRAVE-PARTY above ground END TO END: Ann searches a headstone; the cell keeps it (the real relay); Bob, her partymate in the cell, is told "Already searched by Ann." - Eve, a stranger there, searches it for herself and locks nothing of Ann\'s; Dan, Ann\'s partymate walking in later, is told by the welcome; Fay, who heard it as a stranger and joined the party since, is told at the stone (mutants: the stone never owed or said; the relay\'s fold, fan or welcome; the row landed for a stranger; the book not read again at the stone; the routing)', async () => {
  const clock = { t: Date.UTC(2027, 3, 1, 12, 0, 0) };
  const realNow = Date.now; Date.now = () => clock.t;
  setSharedClock(() => sharedClassicMinutes(clock.t));
  try {
    await quiet(async () => {
      const world = relayWorld(clock);
      const ann = graveyardPlayer(world, 'acct-ann', ['acct-ann', 'acct-bob', 'acct-dan']);
      const bob = graveyardPlayer(world, 'acct-bob', ['acct-ann', 'acct-bob', 'acct-dan']);
      const eve = graveyardPlayer(world, 'acct-eve', null);
      for (const P of [ann, bob, eve]) P.session.join(CELL, { ...ON });
      await world.pump();
      for (const P of [ann, bob, eve]) { assert.equal(P.session.status, 'open', `${P.acct} stands in the cell`); assert.equal(P.session.owGraveOk, true, 'at a relay that keeps the graves'); }
      assert.equal(ann.press(), 'searched', 'Ann searches the stone');
      ann.sp.frame(performance.now() + 5000);   // the frame's clock is performance.now()'s (requestAnimationFrame's), as the owed stones' own
      await world.pump();
      const kept = world.rooms.room(CELL).store.get(OW_LEDGER_KEY)?.gr ?? {};
      assert.deepEqual(Object.values(kept).map((g) => [g[0], g[1], g[2], g[4]]), [[GPX, GPY, 3, 'acct-ann']], 'the cell keeps the stone and its searcher - the relay\'s verified account');
      assert.equal(bob.press(), 'Already searched by Ann.', 'Bob, her partymate: the party\'s stone, and who searched it');
      assert.equal(bob.press(), 'Already searched by Ann.', 'still');
      assert.equal(eve.press(), 'searched', 'Eve, a stranger: her own search');
      eve.sp.frame(performance.now() + 5000);
      await world.pump();
      assert.equal(eve.press(), SEARCHED_TEXT, 'her own hours, her own words');
      assert.equal(ann.press(), SEARCHED_TEXT, 'Ann\'s stone is still her own search - Eve\'s row named nobody of hers');
      assert.equal(bob.press(), 'Already searched by Ann.', 'and Bob\'s still Ann\'s');
      // Dan walks in later: the welcome
      const dan = graveyardPlayer(world, 'acct-dan', ['acct-ann', 'acct-bob', 'acct-dan']);
      dan.session.join(CELL, { ...ON });
      await world.pump();
      assert.equal(dan.press(), 'Already searched by Ann.', 'Dan, later: the cell\'s welcome said it');
      // Fay hears it as a stranger, then joins Ann's party
      const fay = graveyardPlayer(world, 'acct-fay', null);
      fay.session.join(CELL, { ...ON });
      await world.pump();
      picture(fay.social, 'acct-fay', ['acct-ann', 'acct-fay']);
      assert.equal(fay.press(), 'Already searched by Ann.', 'Fay, of the party now: the stone is the party\'s');
    });
  } finally { Date.now = realNow; setSharedClock(null); _resetSearchLedgerForTests(); setSearchParty(null); }
});

test('GRAVE-PARTY the cell\'s door: a stone is said down the primary cell\'s socket alone, to a relay that keeps the graves - never to an older one (it would close the socket); a stone off the cell\'s widened square is junk at the relay and kept by nobody, one in its margin is taken (mutants: an older relay told; the margin not asked at home or at the relay)', async () => {
  const { FakeWS, sockets } = fakeSocketClass();
  const rig = (v) => {
    const s = new OnlineSession({ url: 'wss://relay.test', name: 'Ann', id: 'a0a0-0001', secret: 'secret-of-a0a0-0001', WebSocketImpl: FakeWS, now: () => 1000 });
    return quiet(() => {
      s.join(CELL, { ...ON });
      const ws = sockets.at(-1); ws.open();
      ws.receive({ t: 'welcome', id: 'a0a0-0001', peers: [], host: 'a0a0-0001', world: null, v });
      return { s, ws, said: () => ws.sent.map((x) => JSON.parse(x)).filter((x) => x.t === 'ow') };
    });
  };
  const old = await rig('world207');
  assert.equal(old.s.owGraveOk, false);
  assert.deepEqual(old.s.sendOverworld('gr', [[GPX, GPY, 3]]), [], 'nothing to a relay that would close the socket');
  assert.deepEqual(old.said(), []);
  const now = await rig(RELAY_VERSION);
  assert.deepEqual(now.s.sendOverworld('gr', [[GPX, GPY, 3], [300, GPY, 4]]), [[GPX, GPY, 3]], 'the cell\'s own law at home: a stone off its square left out');
  assert.deepEqual(now.said(), [{ t: 'ow', k: 'gr', rows: [[GPX, GPY, 3]] }]);
  // the relay's own check
  const clock = { t: Date.UTC(2027, 3, 1, 12, 0, 0) };
  const realNow = Date.now; Date.now = () => clock.t;
  try {
    const r = fakeRooms({ now: () => clock.t }).room(CELL);
    const a = r.connect(), b = r.connect();
    await quiet(async () => { await r.hello(a, 'a0a0-0001', ON, { tokenSub: 'acct-ann', name: 'Ann' }); await r.hello(b, 'b0b0-0002', ON, { tokenSub: 'acct-bob', name: 'Bob' }); });
    const grs = (ws) => ws.sent.filter((m) => m.t === 'ow' && m.k === 'gr');
    await r.raw(a, JSON.stringify({ t: 'ow', k: 'gr', rows: [[300, GPY, 3]] }));
    assert.equal(r.room._meters.get(a)?.junk, 1, 'junk: a stone no honest game in this cell says');
    assert.deepEqual(grs(b), []);
    assert.equal(r.store.get(OW_LEDGER_KEY), undefined, 'nothing kept');
    const edge = Math.floor(GPX / 16) * 16 - 3;   // in the cell's margin
    await r.raw(a, JSON.stringify({ t: 'ow', k: 'gr', rows: [[edge, GPY, 3]] }));
    const M = sharedClassicMinutes(clock.t);
    assert.deepEqual(grs(b), [{ t: 'ow', k: 'gr', rows: [[edge, GPY, 3, M, 'acct-ann']] }], 'a stone over the seam is taken, stamped with the relay\'s minute and the speaker\'s account, and fanned');
    assert.deepEqual(grs(a), grs(b), 'the speaker too');
  } finally { Date.now = realNow; }
});

// ═══ 3. UNDERGROUND: THE TOMB'S ROOM ═══════════════════════════════════════════════════════════════════════════════
const ROOM = 'dungeon:m777';   // a Graveyard's Cemetery (DFRegion dungeonType 18), its crypt blocks' coffins
const COFFIN = 41315;           // TEXTURE.092's low wooden coffin (systems/searchables.js)
/** A searchable as the build mints it (dungeonContext.js: `{ kind, aabb, key: `${bi}:${p.position}`, lock: 0, items: [],
 *  records }` - the build line pinned below). */
const coffinAt = (i) => ({ kind: searchableKind(COFFIN), aabb: box([i * 3, 0, 0], [i * 3 + 0.8, 0.45, 2]), key: `0:${100 + i}`, lock: 0, items: [], records: false });

/** THE ROOM: every act frame queued, then handed to everyone in it but its author (each in their own world). */
function actRoom() {
  const peers = [], q = [];
  return {
    join(p) { peers.push(p); },
    send(from, data) { q.push({ from, data: JSON.parse(JSON.stringify(data)) }); return true; },
    flush() { while (q.length) { const { from, data } = q.shift(); for (const p of peers) if (p.id !== from) p.as(() => p.h.applyActions(from, data)); } },
  };
}
/** A player in the tomb: the dungeon host's own doors over two coffins - its search, its room word out and in, its
 *  memory's loot - with the streaming host's party lens, their own ledger and dice. */
function tombPlayer(net, acct, party) {
  const id = PLAYERS[acct].peer;
  const social = picture(new SocialState({ acct }), acct, party);
  const { lens } = searchParty({ social });
  const said = [], windows = [];
  const player = { level: 6, gender: 'male', name: PLAYERS[acct].name, stats: { luck: 50, strength: 50 }, activeEffects: [], items: [], goldPieces: 0 };
  const P = { id, acct, social, said, windows, ledger: { rows: [] }, rand: lcg(acct.length * 104729), next: null };
  P.as = (fn) => {
    restoreSearchLedger(P.ledger); setSearchParty(lens);
    const real = Math.random;
    Math.random = () => { if (P.next != null) { const v = P.next; P.next = null; return v; } return P.rand(); };
    try { return fn(); } finally { Math.random = real; P.ledger = searchLedgerRecord(); }
  };
  const state = {
    searchables: [coffinAt(0), coffinAt(1)], lootPiles: [], foes: [], _layoutFoes: 0, _sharedById: new Map(),
    _lootSeen: new Set(), _lootUnreadable: new Set(), _lootAt: new Map(), _lootOpenKey: null, _lootTooBig: new Set(),
    _locationKey: ROOM, dfLocation: { name: 'The Tombs of Test', mapTableData: { mapId: 777, dungeonType: 18 } },
    playerEntity: player, activeOverlay: null, _ctxDead: false, enemies: [],
    opts: { onActions: (data) => net.send(id, data), onLootClaimed: () => {}, party: () => [] },
    isRoomBaseContainer: () => false, roomPersonal: () => false, roomUnborn: () => false, roomRecordOf: () => null, sayRoomWord: () => false, landRoomWord: () => 0,
    settleLootFlat: () => {}, camps: { applyOwner: () => {}, activate: () => false }, roomEncounterAsked: () => false, actions: { applyRemote: () => 0 },
    droppedLoot: { physical: { owns: () => false }, pileFor: () => null }, droppedTorches: { activate: () => false }, plaqueActionFor: () => null,
    setMidScreenText: (t) => said.push(t), pushDungeonWindow: (w) => windows.push(w),
    openInventory: (source, onEmptied, o) => { const w = { source, lootKey: o?.lootKey ?? null, done: false }; windows.push(w); return w; },
    quickLootTake: () => false, silverFindKey: () => null, silverFindAt: () => {}, showPickups: null, lootPile: () => null, RANDOM_TREASURE_ARCHIVE: 216, ENEMY_BASICS,
    presentNpcInfoText: (s) => s, LOOT_NEWER_TEXT, LOOT_LIST_MAX,
    searchKey, searchCooldownLeft, markSearched, isPicked, searchedText, searchName, rollSearchOutcome, mintSearchFind, searchMessage, SEARCH_KINDS, pickSearchUndead, pickRosterFoe, rollSearchElite,
    effectiveLevel, liveStat, dungeonRarityTier, dungeonFamily, worldMinutes, sharedClockOn, sharedClassicMinutes, wallMsForClassicMinutes,
    peerHanded, validLootList, respawnDue, createSearchRoom, ActionTextBox, enemyDisplayName,
    searchFoeCount: () => 2, searchFoeSpots: () => [], spawnLooseFoe: () => {},
  };
  P.state = state;
  P.h = P.as(() => mount(`
    ${declSrc('LOOT_KEY_RE')}
    ${fnSrc('lootKeyOf')}
    ${fnSrc('lootableBody')}
    ${fnSrc('lootHolder')}
    ${fnSrc('roomLootKey')}
    ${declSrc('_wallNow')}
    ${declSrc('searchRoom')}
    ${fnSrc('lootRecords')}
    ${fnSrc('publishLoot')}
    ${fnSrc('applyLoot')}
    ${fnSrc('applyActions')}
    ${fnSrc('searchLocationKey')}
    ${fnSrc('searchHeard')}
    ${fnSrc('activateSearchable')}
    const api = { takeLoot: ${memberSrc('takeLoot')} };
    return { api, applyActions, applyLoot, memory: () => (${MEMORY_RHS}), close: (key) => { _lootOpenKey = null; publishLoot(key); } };
  `, state));
  /** The press on coffin `i` (dungeonContext.js takeLoot's `search:` door, as the ray hands it): what it answered -
   *  `searched` (the message box stood), the find opened (its list), or the mid-screen line. `roll` the search's die. */
  P.press = (i, roll = 0.9) => P.as(() => {
    P.next = roll; said.length = 0;
    const n = windows.length;
    P.h.api.takeLoot(`search:${i}`, 'grab');
    const w = windows.length > n ? windows.at(-1) : null;
    if (w instanceof ActionTextBox) return 'searched';
    if (w) { const got = w.source.map((it) => it.name); w.done = true; P.h.close(w.lootKey); return { opened: got }; }   // the window shut again, as its onClose says what is left
    return said.at(-1) ?? null;
  });
  net.join(P);
  return P;
}

test('GRAVE-PARTY underground: a tomb\'s coffin searched by Ann is her PARTY\'s - Bob opens her find, or is told "Already searched by Ann."; Eve, a stranger in the same crypt, is never told so of a coffin she never touched, searches it for herself, and her word lands on nobody of Ann\'s; the room\'s memory carries a stranger\'s search on, so Dan (Ann\'s partymate, walking in later under Eve\'s memory) still hears Ann\'s; Fay, who heard it as a stranger and joined the party since, is told at the coffin (mutants: the word not naming its searcher; a stranger\'s word landed; a word kept but never read again at the coffin; the memory without the strangers\' searches; the name not landed)', () => {
  const clock = { t: Date.UTC(2027, 3, 1, 12, 0, 0) };
  setSharedClock(() => sharedClassicMinutes(clock.t));
  try {
    const net = actRoom();
    const ann = tombPlayer(net, 'acct-ann', ['acct-ann', 'acct-bob', 'acct-dan']);
    const bob = tombPlayer(net, 'acct-bob', ['acct-ann', 'acct-bob', 'acct-dan']);
    const eve = tombPlayer(net, 'acct-eve', null);
    const fay = tombPlayer(net, 'acct-fay', null);
    assert.equal(ann.press(0, 0.5), 'searched', 'Ann: coffin 0 - a find');
    assert.equal(ann.press(1, 0.9), 'searched', 'Ann: coffin 1 - nothing');
    const find = ann.state.searchables[0].items.map((it) => it.name);
    assert.ok(find.length >= 1 && find[0] === 'Gold Pieces', 'a find, gold first');
    net.flush();
    assert.deepEqual(bob.press(0), { opened: find }, 'Bob opens Ann\'s find - the party\'s, the same the looter sees');
    assert.equal(bob.press(1), 'Already searched by Ann.', 'and her empty coffin is hers, by name');
    assert.deepEqual(eve.state.searchables.map((sb) => sb.items.length), [0, 0], 'Eve holds nothing of Ann\'s');
    assert.equal(eve.press(1, 0.9), 'searched', 'Eve searches coffin 1 for herself - no stranger\'s hours');
    assert.equal(eve.press(0, 0.9), 'searched', 'and coffin 0');
    net.flush();
    assert.deepEqual(ann.state.searchables[0].items.map((it) => it.name), find, 'Ann\'s find stands - Eve\'s empty word replaced nothing of hers');
    assert.deepEqual(ann.press(0), { opened: find }, 'Ann opens her own find');
    assert.equal(ann.press(1), SEARCHED_TEXT, 'her own coffin, her own words');
    assert.equal(eve.press(1), SEARCHED_TEXT, 'Eve\'s own hours, her own words');
    // Dan walks in later; Eve publishes the room's memory
    const memory = eve.as(() => eve.h.memory());
    assert.ok(memory.some((r) => r.k === 'srch:0' && r.by === 'acct-ann') && memory.some((r) => r.k === 'srch:0' && r.by === 'acct-eve'), 'the memory carries both searches, each by its searcher');
    const dan = tombPlayer(net, 'acct-dan', ['acct-ann', 'acct-bob', 'acct-dan']);
    dan.as(() => dan.h.applyLoot(memory, null));
    assert.deepEqual(dan.press(0), { opened: find }, 'Dan, later, under a stranger\'s memory: Ann\'s find');
    assert.equal(dan.press(1), 'Already searched by Ann.', 'and Ann\'s empty coffin, by name');
    // Fay heard Ann's words as a stranger; she joins the party
    assert.deepEqual(fay.state.searchables.map((sb) => sb.items.length), [0, 0]);
    picture(fay.social, 'acct-fay', ['acct-ann', 'acct-fay']);
    assert.equal(fay.press(1), 'Already searched by Ann.', 'Fay, of the party now: Ann\'s coffin');
    assert.deepEqual(fay.press(0), { opened: find }, 'and Ann\'s find');
  } finally { setSharedClock(null); _resetSearchLedgerForTests(); setSearchParty(null); }
});

test('GRAVE-PARTY underground, the strangers\' words kept are BOUNDED - they ride the room\'s memory (512 KB a dungeon): an honest find\'s alone (SEARCH_LOOT_MAX pieces through the wire\'s projection, under SEARCH_FOREIGN_BYTES), SEARCH_FOREIGN_PER_OBJECT an object and SEARCH_FOREIGN_MAX in all, the oldest out first; a word past the room\'s hour let go (mutants: a forged list kept; a fat record kept; either cap gone; the hour unasked)', () => {
  const clock = { t: Date.UTC(2027, 3, 1, 12, 0, 0) };
  const social = picture(new SocialState({ acct: 'acct-ann' }), 'acct-ann', ['acct-ann', 'acct-bob']);
  const { lens } = searchParty({ social });
  setSearchParty(lens);
  try {
    const room = createSearchRoom({ respawnDue, wallNow: () => clock.t });
    const gold = (n) => ({ group: 'Currency', templateIndex: 276, name: 'Gold Pieces', value: 1, stackCount: n });
    const word = (by, n = 1, extra = {}) => ({ k: 'srch:0', r: Array.from({ length: n }, (_, i) => gold(10 + i)), t: clock.t, by, rider: 'x'.repeat(64), ...extra });   // `rider`: a field no search word has
    assert.equal(room.ours('srch:0', word('acct-bob'), null)?.kin, 'party', 'a partymate\'s word is to be landed');
    assert.equal(room.records().length, 0, 'and is not a stranger\'s');
    assert.equal(room.ours('srch:0', word('acct-zed', SEARCH_LOOT_MAX + 1), null), null);
    assert.equal(room.records().length, 0, 'a list no search could find: kept by nobody');
    const fat = { ...gold(5), ...Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`note${i}`, 'x'.repeat(120)])) };   // a field nobody declared rides the clamp alone: 128 characters, 48 keys
    assert.equal(room.ours('srch:0', word('acct-zed', 1, { r: [fat] }), null), null);
    assert.equal(room.records().length, 0, 'a record past SEARCH_FOREIGN_BYTES: kept by nobody');
    for (let i = 0; i < SEARCH_FOREIGN_PER_OBJECT + 2; i++) room.ours('srch:0', word(`acct-z${i}`, SEARCH_LOOT_MAX), null);
    assert.deepEqual(room.records().map((r) => r.by), Array.from({ length: SEARCH_FOREIGN_PER_OBJECT }, (_, i) => `acct-z${i + 2}`), 'an object keeps its newest strangers\' words');
    for (let i = 1; i <= SEARCH_FOREIGN_MAX + 3; i++) room.ours(`srch:${i}`, { ...word(`acct-y${i}`), k: `srch:${i}` }, null);
    const kept = room.records();
    assert.equal(kept.length, SEARCH_FOREIGN_MAX, 'and the room its newest in all');
    assert.equal(kept.at(-1).k, `srch:${SEARCH_FOREIGN_MAX + 3}`);
    assert.deepEqual(Object.keys(kept.at(-1)).sort(), ['by', 'k', 'r', 't'], 'its own fields alone - nothing else a word carried rides on');
    clock.t += 24 * 60 * 60 * 1000;
    assert.equal(room.records().length, 0, 'past the room\'s hour: let go');
  } finally { setSearchParty(null); }
});

// ═══ 4. THE REACH ══════════════════════════════════════════════════════════════════════════════════════════════════
/** The dungeon's own target list (dungeonContext.js lootTargets) over one coffin, with the player's capsule where the
 *  frame last left it. */
function tombTargets(feet, coffin = coffinAt(0)) {
  const state = {
    lootPiles: [], foes: [], searchables: [coffin], RAY_DISTANCE, TREASURE_ACTIVATION_DISTANCE, CORPSE_ACTIVATION_DISTANCE,
    droppedLoot: { lootTargets: () => [] }, droppedTorches: { targets: () => [] }, camps: { targets: () => [] }, sdEnd: null, sdHall: null,
    opts: { castleRecordsHere: () => false }, roomUnborn: () => false, searchReachFor, lastPlayerFeet: feet, lastPlayerHeight: CAPSULE_HEIGHT,
  };
  const { lootTargets } = mount(`${fnSrc('lootableBody')}\n${fnSrc('corpseAt')}\n${fnSrc('lootTargets')}\nreturn { lootTargets };`, state);
  return { coffin, targets: lootTargets() };
}
/** The coffin's own mesh to the ray - its box (the collider's first surface and its own). */
const meshOf = (aabb) => ({ raycastHit: (o, d) => ({ dist: rayAabb(o, d, aabb) ?? Infinity, key: null }), raycast: (o, d) => rayAabb(o, d, aabb) ?? Infinity });
/** The ray from the eye over `feet` to a point on the coffin's lid by its near edge. */
const lookAt = (feet, to) => { const eye = [feet[0], feet[1] + 1.7, feet[2]]; const v = [to[0] - eye[0], to[1] - eye[1], to[2] - eye[2]]; const n = Math.hypot(...v); return { eye, dir: v.map((x) => x / n) }; };

test('GRAVE-PARTY the reach: a coffin on a tomb\'s floor answers from beside it - the body\'s reach to the box, SEARCH_REACH - where the eye\'s ray to its lid ran past SEARCH_REACH a pace from the boots and said "too far"; two metres off it still refuses; the street\'s headstones the same (mutants: the reach from the eye again; the bound widened or dropped; the body\'s height unread; the street\'s stones left on the eye)', () => {
  const near = [2.0, 0, 1.0];   // beside the coffin, 1.2 m across the floor from its side
  const { coffin, targets } = tombTargets(near);
  const t = targets.find((x) => x.key === 'search:0');
  assert.ok(t, 'the coffin is a target');
  const { eye, dir } = lookAt(near, [0.7, 0.45, 1.0]);
  const pick = pickActivatableHit(eye, dir, targets, meshOf(coffin.aabb));
  assert.equal(pick?.key, 'search:0', 'the ray meets its lid');
  assert.ok(pick.distance > SEARCH_REACH, `the eye's ray runs ${pick.distance.toFixed(2)} m to it - past SEARCH_REACH`);
  assert.equal(answersPress({ ...pick, reach: SEARCH_REACH }), false, 'the bug: measured from the eye it was too far away');
  assert.equal(answersPress(pick), true, 'measured from the body it answers');
  const far = [2.8, 0, 1.0];   // two metres off
  const b = tombTargets(far);
  const { eye: e2, dir: d2 } = lookAt(far, [0.7, 0.45, 1.0]);
  const p2 = pickActivatableHit(e2, d2, b.targets, meshOf(b.coffin.aabb));
  assert.equal(p2?.key, 'search:0');
  assert.equal(answersPress(p2), false, 'two metres off: too far, as it should be');
  const shelf = { kind: searchableKind(41010), aabb: box([0, 1.2, 0], [0.4, 2.0, 2]), key: '0:7', lock: 0, items: [], records: false };   // a shelf front at the chest, as a crypt's wall holds it
  assert.equal(tombTargets([1.7, 0, 1.0], shelf).targets.find((x) => x.key === 'search:0').reach, RAY_DISTANCE, 'the frame\'s capsule is the body - a shelf at the chest, 1.3 m off, answers (its height is read)');
  assert.equal(tombTargets(null).targets.find((x) => x.key === 'search:0').reach, SEARCH_REACH, 'no frame yet: as it was');
  // the street's headstones (worldModes.js, the streaming host's graveTargets) by the same law, from the body
  assert.match(rd('src/scenes/worldModes.js'), /graves\.forEach\(\(aabb, i\) => targets\.push\(\{ key: `grave:\$\{i\}`, aabb, distance: RAY_DISTANCE, reach: searchReachFor\(aabb, player\.pos, player\.eye\[1\]\) \}\)\);/);
  assert.equal(searchReachFor(STONE, [1.6, 0, 0.1], 1.7), RAY_DISTANCE, 'a headstone from a metre off');
});

// ═══ 5. PARTY-LOOT: A ROOM CONTAINER THIS BUILD CANNOT READ ════════════════════════════════════════════════════════
test('GRAVE-PARTY a PARTY-LOOT pile whose room word this build cannot read (another build\'s, in a mixed room) is the player\'s OWN - a target again (it stood unborn for good: drawn on the floor, no plaque, no press), opened with its own list and one word that says so, its takes never said to the room nor claimed of the host; one it can read is the room\'s again (mutants: roomUnborn holding the unreadable; the M2 refusal standing over it; the word said twice; a take claimed or said; the list recomposed under its taker)', () => {
  const clock = { t: Date.UTC(2027, 3, 1, 12, 0, 0) };
  const frames = [], said = [], windows = [];
  const own = [{ name: 'Gold Pieces', templateIndex: 276, group: 'Currency', value: 1, stackCount: 40 }, { name: 'Torc', templateIndex: 138, group: 'Jewellery', value: 120 }];
  const pile = { pos: [0, 0, 0], record: 0, items: own.map((it) => ({ ...it })), isFixed: false, batch: {}, half: [0.5, 0.5] };
  const state = {
    foes: [], _layoutFoes: 0, _sharedById: new Map(), lootPiles: [pile], searchables: [], _locationKey: ROOM,
    _lootSeen: new Set(), _lootUnreadable: new Set(), _lootAt: new Map(), _lootOpenKey: null, _lootTooBig: new Set(),
    _authority: false, _deepCleared: new Set(), _deepFoeCleared: new Set(), _wildDungeon: false, _wildRing: null,
    opts: { selfId: () => 'b0b0-0002', onActions: (data) => frames.push(data), onLootClaimed: () => {}, partyLevels: () => [], roomHost: () => 'a0a0-0001' },
    _foesFrom: 'a0a0-0001', _sharedStamp: 'st1', _roomClaimN: 0, _roomMintHold: 0, _roomNowMs: 0,
    lootKey: 'N', onlineRoom: () => true, _wallNow: () => clock.t, respawnDue, validLootList, peerHanded, LOOT_LIST_MAX, LOOT_NEWER_TEXT,
    eliteLootOpts: () => ({}), _sharedFoe: () => false, fightN: () => 1, rollPileItems: () => own.map((it) => ({ ...it })), settleLootFlat: () => {}, searchHeard: () => {}, searchRoom: { ours: () => true, fields: () => ({}) },
    createRoomLoot, RAY_DISTANCE, TREASURE_ACTIVATION_DISTANCE, CORPSE_ACTIVATION_DISTANCE, searchReachFor, lastPlayerFeet: null, lastPlayerHeight: CAPSULE_HEIGHT,
    droppedLoot: { lootTargets: () => [], physical: { owns: () => false }, pileFor: () => null }, droppedTorches: { targets: () => [], activate: () => false }, camps: { targets: () => [], activate: () => false }, sdEnd: null, sdHall: null, plaqueActionFor: () => null,
    setMidScreenText: (t) => said.push(t), activeOverlay: null, silverFindKey: () => null, silverFindAt: () => {}, quickLootTake: () => false, showPickups: null, lootPile: () => null, RANDOM_TREASURE_ARCHIVE: 216, ENEMY_BASICS,
    openInventory: (source, onEmptied, o) => { const w = { source, lootKey: o?.lootKey ?? null, done: false }; windows.push(w); return w; },
  };
  // the module, constructed as the host constructs it (its handles: the by-value names and the live ones) - its own
  // mid-screen line (roomLootHost.js imports ui/midScreenText.js) is the label's
  const handles = `{ _deepCleared, _deepFoeCleared, _sharedFoe, _wildDungeon, _wildRing, eliteLootOpts, fightN, foes, lootKeyOf, lootableBody, opts, respawnDue, rollPileItems, roomLootKey, settleLootFlat,
    get _authority() { return _authority; }, get _foesFrom() { return _foesFrom; }, get _layoutFoes() { return _layoutFoes; }, get _locationKey() { return _locationKey; }, get _lootAt() { return _lootAt; }, get _lootOpenKey() { return _lootOpenKey; }, get _lootSeen() { return _lootSeen; }, get _lootTooBig() { return _lootTooBig; }, get _lootUnreadable() { return _lootUnreadable; },
    get _roomClaimN() { return _roomClaimN; }, set _roomClaimN(v) { _roomClaimN = v; }, get _roomMintHold() { return _roomMintHold; }, get _roomNowMs() { return _roomNowMs; }, set _roomNowMs(v) { _roomNowMs = v; }, get _sharedById() { return _sharedById; }, get _sharedStamp() { return _sharedStamp; }, get _wallNow() { return _wallNow; }, get lootKey() { return lootKey; }, get lootPiles() { return lootPiles; }, get onlineRoom() { return onlineRoom; } }`;
  const h = mount(`
    ${declSrc('LOOT_KEY_RE')}
    ${fnSrc('lootKeyOf')}
    ${fnSrc('lootableBody')}
    ${fnSrc('lootHolder')}
    ${fnSrc('roomLootKey')}
    const { _roomState, _roomMine, isRoomBaseContainer, landRoomWord, roomClaimTick, roomPersonal, roomRecordOf, roomSayNow, roomSettle, roomUnborn, settleRoomBonus, holderList, roomBaseHolder, composeRoomContainer, mintUnbornRoom } = createRoomLoot(${handles});
    ${fnSrc('lootRecords')}
    ${fnSrc('publishLoot')}
    ${fnSrc('sayRoomWord')}
    ${fnSrc('applyLoot')}
    ${fnSrc('corpseAt')}
    ${fnSrc('lootTargets')}
    const api = { takeLoot: ${memberSrc('takeLoot')} };
    return { api, applyLoot, lootTargets, roomUnborn, roomClaimTick, mintUnbornRoom, _roomMine, close: (key) => { _lootOpenKey = null; publishLoot(key); } };
  `, state);
  const press = () => {
    midScreenText.text = '';
    said.length = 0;
    const n = windows.length;
    h.api.takeLoot('loot:0', 'grab');
    return windows.length > n ? windows.at(-1) : null;
  };
  assert.equal(h.roomUnborn('loot:0'), true, 'before any word: unborn, waiting for its terms');
  assert.ok(!h.lootTargets().some((t) => t.key === 'loot:0'), 'no target while it waits');
  // another build's word about it - one this build cannot read
  assert.equal(h.applyLoot([{ k: 'loot:0', g: 0, lv: 1, n: 1, tm: clock.t, x: 'from another build', c: [] }], 'a0a0-0001'), 0);
  assert.ok(state._lootUnreadable.has('loot:0'), 'the room has spoken, in words this build cannot read');
  assert.equal(h.roomUnborn('loot:0'), false, 'no longer unborn for good');
  assert.ok(h.lootTargets().some((t) => t.key === 'loot:0'), 'a target again - its plaque, its press');
  const w = press();
  assert.ok(w, 'the press opens it');
  assert.deepEqual(w.source.map((it) => it.name), ['Gold Pieces', 'Torc'], 'its own list, as it stood here');
  assert.equal(midScreenText.text, 'Another version of the game shares this room - what you find here is yours alone.', 'said once');
  assert.ok(!said.includes(LOOT_NEWER_TEXT), 'never the refusal');
  w.source.splice(1, 1);   // the Torc taken
  w.done = true; h.close('loot:0');
  h.roomClaimTick(1000);
  assert.deepEqual(frames, [], 'nothing said to the room - no take, no claim of the host');
  assert.equal(h._roomMine.size, 0, 'no claim waiting');
  const again = press();
  assert.deepEqual(again.source.map((it) => it.name), ['Gold Pieces'], 'what is left of it, still its own');
  assert.equal(midScreenText.text, '', 'the word said once, not at every press');
  again.done = true; h.close('loot:0');
  assert.deepEqual(frames, []);
  // a pile that WAS the room's - its terms minted here, its base composed - when another build's word about it comes
  state.lootPiles.push({ pos: [3, 0, 0], record: 0, items: [], isFixed: false, batch: {}, half: [0.5, 0.5] });
  h.mintUnbornRoom(0); h.mintUnbornRoom(10_000);   // no host word in ROOM_TERMS_WAIT: this client mints its terms
  assert.deepEqual(state.lootPiles[1].items.map((it) => it.name), ['Gold Pieces', 'Torc'], 'the room\'s base, composed');
  frames.length = 0;
  h.applyLoot([{ k: 'loot:1', g: 0, lv: 1, n: 1, tm: clock.t, x: 'from another build', c: [] }], 'a0a0-0001');
  assert.ok(state._lootUnreadable.has('loot:1'));
  const w1 = (() => { said.length = 0; const n = windows.length; h.api.takeLoot('loot:1', 'grab'); return windows.length > n ? windows.at(-1) : null; })();
  assert.ok(w1, 'opened, its own');
  w1.source.splice(0, 1);   // the gold taken
  w1.done = true; h.close('loot:1');
  h.roomClaimTick(2000); h.roomClaimTick(2000 + 60_000);
  assert.deepEqual(frames, [], 'a take from a personal pile is no claim of the host and no word of the room\'s');
  assert.equal(h._roomMine.size, 0);
});

// ═══ 6. THE FOUR HOSTS ═════════════════════════════════════════════════════════════════════════════════════════════
test('GRAVE-PARTY THE FOUR HOSTS: world.js constructs the search party with its live session and hub picture, hands it the cell\'s graves, says its stones every online frame and routes the headstone\'s press to it; worldModes.js stands the headstones at the body\'s reach; dungeonContext.js (both dungeon hosts) constructs the search room, names a find\'s searcher on the wire, asks whose a word is before it lands, reads the kept words again at the coffin and carries the strangers\' in its memory; the bench (exterior.js) stands no headstone (mutants: any of them unwired)', () => {
  const W = rd('src/scenes/world.js'), D = SRC, X = rd('src/scenes/exterior.js');
  assert.match(W, /const \{ activateGrave, frame: searchPartyFrame, heard: searchPartyHeard \} = createSearchParty\(\{[^\n]*\n[^\n]*\n\s*get partyNear\(\) \{ return partyNear; \}, get online\(\) \{ return online; \}, get social\(\) \{ return social; \},\n\s*\}\);/);
  assert.match(W, /hccParkTick\(now\);[^\n]*\n\s*overworldLedgerFrame\(now\); searchPartyFrame\(now\);/);
  assert.match(W, /activateGrave: \(g, mode\) => activateGrave\(g, mode\),/);
  assert.doesNotMatch(W, /function activateGrave\(/, 'the stone\'s search is the module\'s alone');
  assert.match(D, /searchables\.push\(\{ kind: sk, aabb, key: `\$\{bi\}:\$\{p\.position\}`, lock: 0, items: \[\], records: /, 'the build mints the searchable this pin stands');
  assert.match(D, /const searchRoom = createSearchRoom\(\{ respawnDue, wallNow: \(\) => _wallNow\(\) \}\);/);
  assert.match(D, /sb\.items\.push\(\.\.\.find\); sb\.by = searchRoom\.mine\(\);/);
  assert.match(D, /if \(cooling\) \{ setMidScreenText\(searchedText\(key\)\); return 1; \}/);
  assert.doesNotMatch(X, /graveTargets/, 'the bench stands no headstone');
});
