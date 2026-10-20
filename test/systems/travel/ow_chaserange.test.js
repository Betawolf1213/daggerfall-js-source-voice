// OW-CHASE-RANGE (2026-10-19, the owner, of the Overworld's gaps: "4. Fix it"; bible/06-Systems/Travel-View.md
// OW-CHASE-RANGE): A CHASE SEEN AS FAR AS ITS BAND IS DRAWN. The relay fans a cell's foes frame - TV7b's chase word on it
// - RANGE_PIXELS (3) about its sender, and the Overworld draws the bands BAND_REACH_PX (6) about the viewer: a player three
// to six pixels off saw a chased band at its own wander. The chaser's region mark (TV3) now carries the word (`bd`,
// world225). Pinned on the wire (net/wire.js: the eighth key, checked whole, its gate), the relay over a real Room (kept,
// fanned, the widest mark inside the runtime's 2 KiB), the session (never `bd` to an older relay), the client's own law
// (systems/travellerMarks.js: said on a change, again while a chase runs), the region's word and its hearing
// (systems/travel/regionChase.js), a word carried end to end through the real laws, and the world host's half (its band
// hearing lifted and run - a region's word stands TRAV_BAND_HOLD_MS, a cell's BAND_WORD_MS).
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  validTravellerMark, validTravellerFrame, parseClient, TRAV_KEYS, TRAV_BANDS_MAX, TRAV_BANDS_RELAY_MIN, relaySupportsTravBands,
  RELAY_VERSION, RANGE_PIXELS, chatRegionRoom, TRAV_SEND_MIN_MS, OW_BAND_ID_RE, OW_RAIDER_ID_RE, NAME_MAX, WORLD_PIXEL_BOUND,
} from '../../../src/net/wire.js';
import { BANDS_WIRE_MAX, BAND_ID_RE, BAND_WORD_MS, BAND_REACH_PX, bandWordOf, validBandWord } from '../../../src/systems/travel/travelBands.js';
import { RAIDER_ID_RE, validRaiderWord } from '../../../src/systems/seaRaiders.js';
import { travellerMarkOf, travellerDue, chaseWordKey, TRAV_CHASE_REFRESH_MS } from '../../../src/systems/travellerMarks.js';
import { regionChaseWord, regionChaseHeard, TRAV_BAND_HOLD_MS } from '../../../src/systems/travel/regionChase.js';
import { fakeRoom } from '../../fakeRoom.mjs';
import { fakeSocketClass } from '../../fakeSocket.mjs';
import { OnlineSession } from '../../../src/net/online.js';
import { hostText } from '../../hostText.mjs';

const quiet = (fn) => { const w = console.warn, l = console.log; console.warn = () => {}; console.log = () => {}; try { return fn(); } finally { console.warn = w; console.log = l; } };
const MARK = Object.freeze({ px: 207, py: 213, fx: 12, fy: 250, h: 64, m: 1, tv: 1 });
const CHASE = Object.freeze([['b103.106.88', 6789000, 9800000, 1], ['r51.53.12', 0, 0, 2]]);

test('OW-CHASE-RANGE the wire: the mark\'s eighth key, `bd` - a chase word checked whole (a band\'s or a raider\'s id, once each; a chase\'s place on the world\'s pixels, a spent one\'s none), at most TRAV_BANDS_MAX - the foes frame\'s own; an empty word no key at all; any fault refuses the mark (mutants: the cap; a stranger\'s id; a spent with a place; a place off the world; a twice-named band)', () => {
  assert.deepEqual(TRAV_KEYS.at(-1), 'bd');
  assert.equal(TRAV_BANDS_MAX, BANDS_WIRE_MAX, 'the foes frame\'s own cap');
  assert.equal(OW_BAND_ID_RE.source, BAND_ID_RE.source, 'a band\'s id, its home\'s');
  assert.equal(OW_RAIDER_ID_RE.source, RAIDER_ID_RE.source, 'a raider\'s, its home\'s');
  assert.deepEqual(validTravellerMark({ ...MARK, bd: CHASE }), { ...MARK, bd: CHASE });
  assert.deepEqual(validTravellerMark({ ...MARK, bd: [] }), MARK, 'nothing to say: no key');
  const eight = Array.from({ length: 8 }, (_, i) => [`b${i}.0.1`, 0, 0, 2]);
  assert.ok(validTravellerMark({ ...MARK, bd: eight }));
  for (const [why, bd] of [
    ['nine', [...eight, ['b9.0.1', 0, 0, 2]]], ['a stranger\'s id', [['x1.2.3', 0, 0, 2]]], ['a spent with a place', [['b1.2.3', 5, 5, 2]]],
    ['a place off the world', [['b1.2.3', 1e12, 0, 1]]], ['a fraction', [['b1.2.3', 1.5, 2, 1]]], ['a third flag', [['b1.2.3', 0, 0, 3]]],
    ['a band named twice', [['b1.2.3', 0, 0, 2], ['b1.2.3', 0, 0, 2]]], ['three fields', [['b1.2.3', 0, 0]]], ['not a list', 'b1.2.3'],
  ]) assert.equal(validTravellerMark({ ...MARK, bd }), null, why);
  assert.deepEqual(parseClient(JSON.stringify({ t: 'trav', p: { ...MARK, bd: CHASE } }), { hasHello: true }), { t: 'trav', p: { ...MARK, bd: CHASE } });
  assert.equal(validTravellerFrame({ t: 'trav', id: 'peer-0002', name: 'Bran', p: { ...MARK, bd: CHASE } }).p.bd.length, 2, 'heard through the reader\'s own door');
  assert.equal(TRAV_BANDS_RELAY_MIN, 225);   // world224 on its branch, renumbered past LAYERED-GEAR's world224 at the merge
  assert.equal(relaySupportsTravBands('world224'), false, 'an older relay refuses the mark whole');
  assert.equal(relaySupportsTravBands('world225'), true);
  assert.equal(relaySupportsTravBands(RELAY_VERSION), true, 'this relay knows it');
});

/** A plain name the name filter passes, by index. */
const nameOf = (i) => `Rider ${String.fromCharCode(65 + Math.floor(i / 26))}${String.fromCharCode(97 + (i % 26))}`;
async function regionRoom(ids, names = ids.map((_, i) => nameOf(i))) {
  const r = fakeRoom(chatRegionRoom(5));
  const ws = [];
  for (const [i, id] of ids.entries()) { const s = r.connect(); await quiet(() => r.hello(s, id, null, { name: names[i] })); ws.push(s); }
  return { r, ws };
}

test('OW-CHASE-RANGE the relay: a mark with its chase word is kept on the attachment and fanned with it; the widest - eight chases of the longest ids under the longest name - fits the runtime\'s 2 KiB (mutants: the word dropped on the relay)', async () => {
  const { r, ws: [a, b] } = await regionRoom(['peer-0001', 'peer-0002']);
  for (const s of [a, b]) s.sent.length = 0;
  await r.raw(a, JSON.stringify({ t: 'trav', p: { ...MARK, bd: CHASE } }));
  assert.deepEqual(a.att.tm.bd, CHASE, 'kept');
  const heard = b.sent.filter((m) => m.t === 'trav');
  assert.equal(heard.length, 1);
  assert.deepEqual(heard[0].p.bd, CHASE, 'fanned with the mark');
  const wide = await regionRoom(['peer-0003'], ['W'.repeat(NAME_MAX)]);
  const far = -(WORLD_PIXEL_BOUND - 1) * 32768;   // the world's widest whole numbers
  const ok = validTravellerMark({ ...MARK, px: -(WORLD_PIXEL_BOUND - 1), py: WORLD_PIXEL_BOUND - 1,
    bd: Array.from({ length: TRAV_BANDS_MAX }, (_, i) => [`b-${1000 + i}.-9999.999999999`, far, -far + 32768 * 499, 1]) });
  assert.ok(ok, 'the widest word is a valid one');
  await wide.r.raw(wide.ws[0], JSON.stringify({ t: 'trav', p: ok }));
  assert.equal(wide.ws[0].att.tm.bd.length, TRAV_BANDS_MAX, 'the widest kept');
  assert.ok(JSON.stringify(wide.ws[0].att).length <= 2048, `the attachment is ${JSON.stringify(wide.ws[0].att).length} bytes`);
});

function regionLink(relayV) {
  const { FakeWS, sockets } = fakeSocketClass();
  const s = new OnlineSession({ url: 'wss://relay.test', name: 'a', id: 'aaaa-0001', secret: 'secret-of-aaaa-0001', presence: false, WebSocketImpl: FakeWS, now: () => 1_000_000 });
  quiet(() => s.join(chatRegionRoom(5)));
  const ws = sockets[0]; ws.open();
  quiet(() => ws.receive({ t: 'welcome', id: 'aaaa-0001', peers: [], n: 1, v: relayV }));
  return { s, out: () => ws.sent.map((x) => JSON.parse(x)).filter((m) => m.t === 'trav') };
}

test('OW-CHASE-RANGE the session: a mark\'s chase word goes only to a relay that knows it - to an older one the mark goes without it, never refused for it (mutants: the word handed to world223)', () => {
  const old = regionLink('world223');
  assert.equal(old.s.travBandsOk, false);
  assert.equal(old.s.sendTraveller({ ...MARK, bd: CHASE }), true, 'the mark still goes');
  assert.deepEqual(old.out().at(-1).p, MARK, 'without its word');
  const now = regionLink(RELAY_VERSION);
  assert.equal(now.s.travBandsOk, true);
  now.s.sendTraveller({ ...MARK, bd: CHASE });
  assert.deepEqual(now.out().at(-1).p.bd, CHASE, 'with it');
});

test('OW-CHASE-RANGE the client\'s law: a mark goes again when its word says another chase or another band spent - never for a chase\'s place alone - and while a chase runs, every TRAV_CHASE_REFRESH_MS (the session\'s floor); a word of spent bands alone waits the keepalive (mutants: the change unheard; the place a change; the refresh never; the refresh for the spent too)', () => {
  assert.equal(TRAV_CHASE_REFRESH_MS, TRAV_SEND_MIN_MS);
  assert.equal(chaseWordKey(CHASE), 'b103.106.88:1,r51.53.12:2');
  assert.equal(chaseWordKey(undefined), '');
  const mark = travellerMarkOf({ x: 207 * 32768 + 100, z: (499 - 213) * 32768 + 100 });
  const st = { last: { ...mark }, at: 0 };
  const due = (bd, now) => travellerDue(st, { now, mark: bd ? { ...mark, bd } : mark, alone: false, shown: true });
  assert.equal(due(null, 1000), null, 'nothing new');
  assert.equal(due([['b1.1.1', 50, 50, 1]], 1000), 'send', 'a chase begun');
  st.last = { ...mark, bd: [['b1.1.1', 50, 50, 1]] };
  st.at = 1000;
  assert.equal(due([['b1.1.1', 90, 90, 1]], 2000), null, 'the band moved: not alone a reason');
  assert.equal(due([['b1.1.1', 90, 90, 1]], 1000 + TRAV_CHASE_REFRESH_MS), 'send', 'the chase running: said again where it runs');
  assert.equal(due([['b1.1.1', 0, 0, 2]], 2000), 'send', 'the band spent');
  st.last = { ...mark, bd: [['b1.1.1', 0, 0, 2]] };
  assert.equal(due([['b1.1.1', 0, 0, 2]], 1000 + TRAV_CHASE_REFRESH_MS), null, 'a spent word alone waits the keepalive');
  assert.equal(due(null, 2000), 'send', 'the word gone: said');
});

test('OW-CHASE-RANGE the region\'s word: the chases first - the bands\' and the raiders\' - then the spent, at most BANDS_WIRE_MAX; heard only from a traveller past the cell\'s reach (within it the foes frame says it every frame), standing TRAV_BAND_HOLD_MS (mutants: the spent first; no cap; heard within the cell; the hold a cell\'s)', () => {
  assert.deepEqual(regionChaseWord([['b1.1.1', 0, 0, 2], ['b2.2.2', 5, 5, 1]], [['r1.1.1', 7, 7, 1]]), [['b2.2.2', 5, 5, 1], ['r1.1.1', 7, 7, 1], ['b1.1.1', 0, 0, 2]]);
  const many = Array.from({ length: 12 }, (_, i) => [`b${i}.0.1`, 0, 0, i < 3 ? 1 : 2]);
  const w = regionChaseWord(many, []);
  assert.equal(w.length, BANDS_WIRE_MAX);
  assert.deepEqual(w.slice(0, 3).map((e) => e[3]), [1, 1, 1], 'every chase kept');
  assert.equal(TRAV_BAND_HOLD_MS, 2.5 * TRAV_CHASE_REFRESH_MS);
  assert.ok(TRAV_BAND_HOLD_MS > BAND_WORD_MS, 'longer than a cell\'s word: the region\'s comes a refresh at a time');
  const f = (dx) => ({ id: 'peer-2', p: { ...MARK, px: 100 + dx, py: 50, bd: CHASE } });
  assert.equal(regionChaseHeard(f(RANGE_PIXELS), { x: 100, y: 50 }), null, 'within the cell\'s reach: its foes frame says it');
  assert.deepEqual(regionChaseHeard(f(RANGE_PIXELS + 1), { x: 100, y: 50 }), CHASE, 'past it: the region\'s word');
  assert.equal(regionChaseHeard({ id: 'p', p: MARK }, { x: 0, y: 0 }), null, 'no word');
  assert.ok(BAND_REACH_PX > RANGE_PIXELS, 'the premise: the bands drawn past the cell\'s reach');
});

test('OW-CHASE-RANGE end to end through the real laws: A, five pixels from B, chases a band - A\'s word on A\'s mark, through the relay\'s door and the reader\'s, heard by B, is the band where A says it runs; and the spent raider spent (mutants: any door dropping the word)', () => {
  const chases = new Map([['b51.53.4000', { pos: { x: 102 * 32768 + 900, z: (499 - 107) * 32768 + 400 } }]]);
  const word = regionChaseWord(bandWordOf(chases, []), [['r51.53.12', 0, 0, 2]]);
  const mark = { ...travellerMarkOf({ x: 102 * 32768 + 500, z: (499 - 107) * 32768 + 500 }), bd: word };
  const sent = parseClient(JSON.stringify({ t: 'trav', p: mark }), { hasHello: true });   // the relay's door
  const heard = validTravellerFrame({ t: 'trav', id: 'peer-000a', name: 'A', p: sent.p });   // the reader's
  const b = { x: 107, y: 107 };
  const bd = regionChaseHeard(heard, b);
  assert.ok(bd, 'five pixels off: heard');
  assert.deepEqual(validBandWord(bd), [['b51.53.4000', 102 * 32768 + 900, (499 - 107) * 32768 + 400, 1]], 'the band where A says it runs');
  assert.deepEqual(validRaiderWord(bd), [['r51.53.12', 0, 0, 2]], 'and the raider A spent');
});

test('OW-CHASE-RANGE the host: my mark carries my chases (the bands\' and the raiders\') through a relay that knows them; a far traveller\'s mark - one heard, or the welcome\'s - heard through the bands\' and the raiders\' own hearing, its word standing TRAV_BAND_HOLD_MS where a cell\'s stands BAND_WORD_MS (lifted and run; mutants: the word unsaid; the region unheard; the welcome unheard; the hold unread)', () => {
  const w = hostText('src/scenes/world.js');
  assert.match(w, /const bd = mark && link\.travBandsOk \? regionChaseWord\(bandWordOf\(_bandChase, _bandSpentAt\), raiderWordOf\(seaRaidHeld\(\), tvRaid\.spentAt\)\) : \[\];[^\n]*\n\s*if \(bd\.length\) mark\.bd = bd;\n\s*const due = travellerDue\(/);
  assert.match(w, /link\.onTraveller = \(f\) => \{ travellerBook\.put\(f, Date\.now\(\)\); regionChaseHear\(f\); \};/);
  assert.match(w, /for \(const f of list \?\? \[\]\) regionChaseHear\(f\); \};/);
  assert.match(w, /function regionChaseHear\(f\) \{\n\s*const word = regionChaseHeard\(f, playerTravelPixel\(\)\);\n\s*if \(word\) \{ bandHear\(f\.id, word, TRAV_BAND_HOLD_MS\); seaRaidHear\(f\.id, word, TRAV_BAND_HOLD_MS\); \}/);
  // the bands' hearing and the peer's chase, lifted and run over the clock
  const lift = (head) => { const at = w.indexOf(head); assert.ok(at >= 0, head); return w.slice(at, w.indexOf('\n  }\n', at) + 4); };
  let now = 1000;
  const env = {
    performance: { now: () => now }, _bandPeer: new Map(), _bandChase: new Map(), _bandSpent: new Set(), validBandWord, bandNearMe: () => true,
    bandPixelOf: (p) => p, playerTravelPixel: () => ({ x: 0, y: 0 }), bandNowMs: () => 0, BAND_LIFE_MS: 1, chaseYields: () => false, online: null, wildBands: { forget() {} }, BAND_WORD_MS,
  };
  const names = Object.keys(env);
  const run = new Function(...names, `${lift('  function bandPeerChase(id) {')}\n${lift('  function bandHear(from, raw, hold = BAND_WORD_MS) {')}\nreturn { bandPeerChase, bandHear };`)(...names.map((k) => env[k]));
  run.bandHear('peer-a', [['b1.1.1', 10, 20, 1]], TRAV_BAND_HOLD_MS);
  run.bandHear('peer-b', [['b2.2.2', 30, 40, 1]]);
  now += BAND_WORD_MS + 1;
  assert.deepEqual([run.bandPeerChase('b1.1.1')?.x, run.bandPeerChase('b2.2.2')], [10, null], 'the region\'s word stands past a cell\'s');
  now += TRAV_BAND_HOLD_MS;
  assert.equal(run.bandPeerChase('b1.1.1'), null, 'and lapses at its own hold');
  // the raiders' the same
  const renv = { performance: { now: () => now }, tvRaid: { peer: new Map(), chase: new Map(), spent: new Set() }, validRaiderWord, raiderNearMe: () => true,
    playerTravelPixel: () => ({ x: 0, y: 0 }), raidNowMs: () => 0, RAIDER_LIFE_MS: 1, chaseYields: () => false, online: null, RAIDER_WORD_MS: 3000 };
  const rn = Object.keys(renv);
  const raid = new Function(...rn, `${lift('  function seaRaidPeerChase(id) {')}\n${lift('  function seaRaidHear(from, raw, hold = RAIDER_WORD_MS) {')}\nreturn { seaRaidPeerChase, seaRaidHear };`)(...rn.map((k) => renv[k]));
  raid.seaRaidHear('peer-a', [['r1.1.1', 10, 20, 1]], TRAV_BAND_HOLD_MS);
  raid.seaRaidHear('peer-b', [['r2.2.2', 30, 40, 1]]);
  now += 3001;
  assert.deepEqual([raid.seaRaidPeerChase('r1.1.1')?.x, raid.seaRaidPeerChase('r2.2.2')], [10, null], 'a raider\'s region word stands past a cell\'s too');
});
