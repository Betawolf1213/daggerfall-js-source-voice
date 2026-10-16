// ARENA-WAIT (FIELD BUGS 2026-10-16, bible/01-Overview/Field-Bugs-2026-10-16b.md; the Discord: "I reloaded my game near the
// arena, and I saw that there was the option to fight from the Arena master guy (I've done all 40 fights already for this
// season), so I hit fight, and it reset my rank, and when I look at the season it doesn't have a number"). On the online
// lane, before the relay has said whether its arena is open - no session yet, or one no welcome has answered - every
// arena door read `live()` false as OFFLINE: the Herald offered Fight off the save's ladder (the online climb never
// writes it), the bout was this screen's and paid its purse here, and the window drew the save's season ("Season of 3E
// 406"), title and record. Now the arena WAITS, as it does for the board. Over the real OnlineSession's welcome, the real
// arena online and the real gate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { OnlineSession } from '../src/net/online.js';
import { createArenaOnline } from '../src/scenes/arenaOnline.js';
import { createArenaGate } from '../src/scenes/arenaGate.js';
import { ARENA_TEXT } from '../src/systems/arenaText.js';
import { arenaSeasonOf, arenaSeasonDay, arenaLadderOf } from '../src/net/arenaLaw.js';
import { ARENA_RELAY_MIN } from '../src/net/wire.js';
import { exhibitionFor } from '../src/systems/arenaLadder.js';
import * as BK from '../src/systems/arenaBook.js';
import { fighterIdentity } from '../src/systems/arenaFighters.js';

const rd = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const O = ARENA_TEXT.online;
const NOON = 600 * 1440 + 12 * 60;
const NOW_S = 1_792_000_000;   // a wall clock well inside the realm's seasons
const names = (seed) => (i, mob) => fighterIdentity(seed, i, mob);
const bouts = () => ({ ask() { this.asked = (this.asked ?? 0) + 1; }, relay: () => null, dismiss() {}, exhibitionWord: () => true, relayWord: () => true, holds: () => false, setRealm() {} });
/** The account's board: a Grand Champion's climb, 40 won. */
const grandBoard = () => {
  const L = { ...arenaLadderOf([]), grand: true };
  return { season: arenaSeasonOf(NOW_S), day: arenaSeasonDay(NOW_S), me: { ladder: L, grand: true, banner: null }, team: { standings: { red: 0, blue: 0 }, rosters: {}, members: {}, laurel: null }, pve: { rows: [], pinned: null, total: 0 }, pvp: { rows: [], pinned: null, total: 0 }, fast: { rows: [], pinned: null, total: 0 }, hall: [] };
};
function fakeSocketClass() {
  const sockets = [];
  class FakeWS {
    constructor(url) { this.url = url; this.sent = []; this.closed = null; sockets.push(this); }
    send(s) { this.sent.push(JSON.parse(s)); }
    close(code, reason) { this.closed = { code, reason }; }
    open() { this.onopen?.(); }
    receive(o) { this.onmessage?.({ data: typeof o === 'string' ? o : JSON.stringify(o) }); }
  }
  return { FakeWS, sockets };
}

test('ARENA-WAIT: on the online lane before the relay\'s word, the Herald offers no Fight, Fight is refused at every door, the window draws the realm\'s season and nothing of the save\'s, no wager settles by the house - then the welcome makes it the account\'s', async () => {
  const { FakeWS, sockets } = fakeSocketClass();
  /** @type {any} */
  let session = null;   // world.js: the session starts once the player stands in the world
  let boardAsked = 0;
  const said = [];
  const B = bouts();
  const A = createArenaOnline({ now: () => 0, nowS: () => NOW_S, session: () => session, lane: () => true, bouts: B, names, say: (l) => said.push(l),
    makeHall: () => ({ status: 'open', join() {}, leave() {}, sendArena: () => true }),
    account: { board: async () => { boardAsked++; return { ok: true, data: grandBoard() }; }, claim: async () => ({ ok: true, data: {} }), me: () => 'acct-spartank', team: async () => ({ ok: true }) },
    enterFloor: () => true });
  let gm = NOON + 2;
  // the save's own ladder: what an offline climb last left (the online climb never writes it) - a fresh Pit
  const P = { goldPieces: 1000, items: [], arenaLeague: null, arenaLadder: null, health: 100, maxHealth: 100, name: 'spartank' };
  const fought = [];
  const gate = createArenaGate({ playerEntity: P, gameMinutes: () => gm, showOverlay() {}, liveHour: () => null, begun: () => false, online: () => A, openWindow: null,
    atGate: () => true, heraldAct: (a) => fought.push(a) });

  for (const phase of ['no session', 'not welcomed']) {
    if (phase === 'not welcomed') {
      session = new OnlineSession({ url: 'wss://relay.test', name: 'spartank', id: 'spar-0001', secret: 'secret-of-spar-0001', WebSocketImpl: FakeWS, now: () => 1000 });
      session.join('world:0:0', { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, mv: 0 });
      sockets[0].open();
      assert.equal(session.status, 'open', 'the socket open, no welcome yet');
      assert.deepEqual([session.arenaOk, session.arenaHeard], [false, false], 'the session minted: nothing said');
    }
    assert.deepEqual([A.live(), A.waiting()], [false, true], `${phase}: neither online nor offline - waiting`);
    const ch = gate.heraldChoice({ cityBout: null, healthShare: 1, league: null });
    assert.ok(!ch.options.some((o) => o.act === 'fight'), `${phase}: no Fight off the save's ladder`);
    assert.ok(ch.lines.includes(O.climbWait), `${phase}: the Herald says the climb is on its way`);
    assert.deepEqual(gate.windowAct('fight'), { ok: false, text: O.climbWait }, `${phase}: the window's Fight waits`);
    assert.deepEqual(fought, [], 'no bout');
    assert.deepEqual(A.fightLadder(), { ok: false, text: O.climbWait }, `${phase}: the host's Fight (world.js arenaHeraldAct) waits`);
    assert.deepEqual(A.act('queue'), { ok: false, text: O.hallWait }, `${phase}: a challenge waits, never "Online only"`);
    assert.equal(A.watchExhibition(exhibitionFor(gm)), false, `${phase}: the hour's bout is the relay's, waited for`);
    assert.equal(said.at(-1), O.hallWait);
    assert.equal(await A.team('red'), null, `${phase}: a banner is the account's, waited for`);
    assert.equal(said.at(-1), O.climbWait, 'said, never a silent press');
    const m = gate.board();
    assert.equal(m.header.season, O.seasonLine(arenaSeasonOf(NOW_S), arenaSeasonDay(NOW_S)), `${phase}: the realm's season, numbered (never "Season of 3E 406")`);
    assert.match(m.header.season, /^Season \d+, day \d+ of 56$/);
    assert.deepEqual([m.header.title, m.header.record, m.header.banner, m.header.purses ?? null], [null, '', null, null], `${phase}: no title, record or banner of the save's`);
    assert.deepEqual(m.team.lines, [O.rollWait], 'the banners on their way');
    for (const k of ['pve', 'fast', 'pvp', 'team']) assert.deepEqual([m.boards[k].rows, m.boards[k].pinned, m.boards[k].empty], [[], null, O.rollWait], `${phase}: the ${k} board - nobody of the save's roster`);
    assert.equal(m.boards.pvp.champion, undefined);
    assert.equal(m.ladder.next, null, 'no next bout offered');
    assert.equal(m.ladder.online, O.climbWait);
    assert.ok(m.bouts.cards.find((c) => c.kind === 'ladder').acts.find((a) => a.act === 'fight').why, 'the ladder card\'s Fight shut');
  }
  assert.equal(boardAsked, 0, 'nothing asked of the service before the relay\'s word');

  // a wager placed while waiting, its hour out: never settled by the house's seeded record
  const EX = exhibitionFor(gm);
  const house = BK.houseOutcome(EX);
  assert.equal(gate.wager(EX.hour, house === 0 ? 1 : 0, 100).ok, true);
  gm = NOON + 70;
  gate.settle();
  assert.equal(P.arenaLeague.book.wagers[0].status, 'open', 'the wager waits for the relay\'s verdict');

  // THE WELCOME: a relay with the arena's rooms - online, the account's climb
  sockets[0].receive({ t: 'welcome', id: 'spar-0001', peers: [], host: 'spar-0001', now: Date.now(), v: `world${ARENA_RELAY_MIN}` });
  assert.deepEqual([session.arenaOk, session.arenaHeard], [true, true]);
  assert.deepEqual([A.live(), A.waiting()], [true, false]);
  await A.fetchBoard();
  const ch = gate.heraldChoice({ cityBout: null, healthShare: 1, league: null });
  assert.ok(!ch.options.some((o) => o.act === 'fight'), 'the Grand Champion: nobody left to beat');
  assert.deepEqual(A.fightLadder(), { ok: false, text: ARENA_TEXT.herald.ladderDone });
  assert.equal(P.arenaLadder, null, 'the save\'s ladder never touched');
});

test('ARENA-WAIT: what is not waiting - off the online lane the save\'s arena as ever (Fight offered); a relay that said no (an older one) and a seat given up are offline (O9); and the host wires the lane, its three doors through the online arm', () => {
  const { FakeWS, sockets } = fakeSocketClass();
  let session = null;
  let lane = false;
  const A = createArenaOnline({ now: () => 0, session: () => session, lane: () => lane, bouts: bouts(), names, account: { board: async () => ({ ok: false }), claim: async () => ({ ok: true, data: {} }), me: () => null }, enterFloor: () => true });
  const P = { goldPieces: 1000, items: [], arenaLeague: null, arenaLadder: null, health: 100, maxHealth: 100, name: 'Alva' };
  const gate = createArenaGate({ playerEntity: P, gameMinutes: () => NOON + 2, showOverlay() {}, liveHour: () => null, begun: () => false, online: () => A, openWindow: null, atGate: () => true, heraldAct() {} });
  assert.equal(A.waiting(), false, 'an offline character waits for nothing');
  assert.ok(gate.heraldChoice({ cityBout: null, healthShare: 1, league: null }).options.some((o) => o.act === 'fight'), 'offline: the save\'s ladder, Fight offered');
  assert.match(gate.board().header.season, /^Season of 3E \d+, day \d+ of 360$/, 'offline: the save\'s season');
  lane = true;
  session = new OnlineSession({ url: 'wss://relay.test', name: 'Alva', id: 'alva-0001', secret: 'secret-of-alva-0001', WebSocketImpl: FakeWS, now: () => 1000 });
  session.join('world:0:0', { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, mv: 0 });
  sockets[0].open();
  assert.equal(A.waiting(), true);
  sockets[0].receive({ t: 'welcome', id: 'alva-0001', peers: [], host: 'alva-0001', now: Date.now(), v: `world${ARENA_RELAY_MIN - 1}` });
  assert.deepEqual([session.arenaOk, session.arenaHeard, A.live(), A.waiting()], [false, true, false, false], 'a relay without the arena said so: offline');
  assert.ok(gate.heraldChoice({ cityBout: null, healthShare: 1, league: null }).options.some((o) => o.act === 'fight'));
  const S = { arenaOk: false, arenaHeard: false, superseded: true };
  session = S;
  assert.equal(A.waiting(), false, 'a seat given up is offline (AUDIT PRE-MERGE 1003 O9)');
  // world.js: the lane and the clock handed in; Fight, the city's sand and the Herald's Watch take the online arm while waiting
  const w = rd('src/scenes/world.js');
  assert.match(w, /session: \(\) => online, lane: \(\) => onlineOn, nowS: \(\) => relayNowS\(\) \?\? Date\.now\(\) \/ 1000,/);
  assert.match(w, /if \(arenaOnline\?\.live\(\) \|\| arenaOnline\?\.waiting\(\)\) \{ const r = arenaOnline\.fightLadder\(\);/);
  assert.match(w, /if \(arenaOnline\?\.exhibitions\?\.\(\) \|\| arenaOnline\?\.waiting\?\.\(\)\) arenaOnline\.watchCity\(ex\);/);
  assert.match(w, /if \(arenaOnline\?\.exhibitions\?\.\(\) \|\| arenaOnline\?\.waiting\?\.\(\)\) \{ arenaBouts\.dismiss\(\); arenaOnline\.watchExhibition\(ex\); return; \}/);
});
