// QL11 (bible/06-Systems/Questlines-Arc.md section 4.5): THE ACTS - what the player did in one of the game's features,
// said in one line where it is FINISHED (systems/questlines/qlActs.js noteAct) and heard by every running stamped quest.
// The pins: the sweep, both ways (every kind has its producer, every producer names a kind, and every call names its
// kind as a literal - so this sweep can read it); the leaf's own law; and the producers whose moment a node can drive,
// each heard once, and nothing heard when the moment did not come.
import '../../modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto } from 'node:crypto';

import { parseModule } from '../../../tools/hostScope.mjs';
import { ACT_KINDS, ACT_IDS, noteAct, setActSink } from '../../../src/systems/questlines/qlActs.js';
import { setPref, _resetForTests } from '../../../src/systems/uiPrefs.js';
import * as LR from '../../../src/systems/loot/lootRarity.js';
import { mintGem } from '../../../src/systems/gems.js';
import { reforgePiece, setGemPiece, unsetGemPiece } from '../../../src/systems/reforge.js';
import { welkyndShards } from '../../../src/systems/gate/gateSpoils.js';
import { createWeapon } from '../../../src/combat/enemyEquipment.js';
import { createFirmamentBook } from '../../../src/net/firmament/firmamentBook.js';
import { createHarbourOffice, PORT_VOYAGE_M } from '../../../src/scenes/harbourOffice.js';
import { createCaptainLedger } from '../../../src/systems/naval/captainLedger.js';
import { boardFor, takeContract } from '../../../src/systems/naval/harbourBoard.js';
import { createGateClaims } from '../../../src/net/gate/gateClaims.js';
import { mintReceipt } from '../../../src/net/gate/gateReceipt.js';
import { RemoteCardTable } from '../../../src/systems/card/cardRemoteTable.js';
import { RemoteIliacTable } from '../../../src/systems/iliac/iliacRemoteTable.js';
import { herbKind } from '../../../src/scenes/herbHost.js';
import { mineKind } from '../../../src/scenes/mineHost.js';
import { treeKind } from '../../../src/scenes/treeHost.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const LEAF = 'src/systems/questlines/qlActs.js';

/** What the sink heard, `[kind, n]` each - the bridge's own shape (scenes/quest/questBridge.js setActSink). */
const heard = [];
const listen = () => { heard.length = 0; setActSink((kind, n) => { heard.push([kind, n]); return 1; }); };
const done = () => setActSink(null);
const tick = () => new Promise((r) => setTimeout(r, 0));

// ── THE SWEEP ──────────────────────────────────────────────────

function srcFiles(dir) {
  const out = [];
  for (const f of readdirSync(join(ROOT, dir))) {
    const p = `${dir}/${f}`;
    if (statSync(join(ROOT, p)).isDirectory()) out.push(...srcFiles(p));
    else if (f.endsWith('.js')) out.push(p);
  }
  return out;
}
function walk(n, fn) {
  if (!n || typeof n.type !== 'string') return;
  fn(n);
  for (const k of Object.keys(n)) {
    const v = n[k];
    if (Array.isArray(v)) for (const c of v) walk(c, fn);
    else if (v && typeof v.type === 'string') walk(v, fn);
  }
}
/** Every `noteAct(...)` call in src/ (the leaf aside), read off the parse - never a comment's mention: kind -> files,
 *  and the calls whose kind is no literal; and every file that imports noteAct, with the name it binds. */
function sweep() {
  const kinds = new Map(), loose = [], imports = [];
  for (const f of srcFiles('src')) {
    if (f === LEAF) continue;
    const text = readFileSync(join(ROOT, f), 'utf8');
    if (!text.includes('noteAct')) continue;
    walk(parseModule(text), (n) => {
      if (n.type === 'ImportDeclaration' && /questlines\/qlActs\.js$/.test(n.source.value)) {
        for (const s of n.specifiers) if (s.imported?.name === 'noteAct') imports.push([f, s.local.name]);
      }
      if (n.type !== 'CallExpression' || n.callee.type !== 'Identifier' || n.callee.name !== 'noteAct') return;
      const a = n.arguments[0];
      if (a?.type === 'Literal' && typeof a.value === 'string') {
        if (!kinds.has(a.value)) kinds.set(a.value, new Set());
        kinds.get(a.value).add(f);
      } else loose.push(`${f}:${n.loc.start.line}`);
    });
  }
  return { kinds, loose, imports };
}

test('QL11 THE SWEEP, both ways: every kind has a producer in src/; every producer names a kind; every call names it as a literal; noteAct is imported from the leaf under its own name (mutants: a kind with no producer; a producer\'s kind misspelt; a kind passed in a variable; an alias)', () => {
  const { kinds, loose, imports } = sweep();
  assert.deepEqual(loose, [], 'a kind is a literal at its call, so this sweep reads it');
  const unknown = [...kinds.keys()].filter((k) => !Object.hasOwn(ACT_KINDS, k)).map((k) => `${[...kinds.get(k)].join(', ')}: noteAct('${k}')`);
  assert.deepEqual(unknown, [], 'every producer names a kind the leaf holds');
  assert.deepEqual(ACT_IDS.filter((k) => !kinds.has(k)), [], 'every kind the leaf holds is said somewhere');
  assert.deepEqual(imports.filter(([, name]) => name !== 'noteAct'), [], 'no alias - a call under another name would pass this sweep unread');
  const callers = new Set([...kinds.values()].flatMap((s) => [...s]));
  assert.deepEqual([...callers].filter((f) => !imports.some(([g]) => g === f)), [], 'each caller imports the leaf\'s noteAct');
  // WHERE EACH IS SAID (the slice's record): the feature's own module where one knows the moment; a host only where the
  // host alone does (navalHost's struck colours, the dungeon's tier) - one line each
  const where = Object.fromEntries([...kinds].map(([k, s]) => [k, [...s].sort()]).sort(([a], [b]) => (a < b ? -1 : 1)));
  assert.deepEqual(where, {
    'arena-won': ['src/scenes/arena/arenaBouts.js'],
    'breach-closed': ['src/net/gate/gateClaims.js'],
    'cards-won': ['src/systems/card/cardRemoteTable.js', 'src/systems/card/cardTableSession.js', 'src/systems/iliac/iliacRemoteTable.js', 'src/systems/iliac/iliacTableSession.js'],
    'cargo-delivered': ['src/scenes/harbourOffice.js'],
    'elite-foe-slain': ['src/scenes/dungeonContext.js'],
    'fish-caught': ['src/scenes/deepWater/deepWatersFish.js', 'src/scenes/fishHost.js', 'src/systems/foraging/foragingInstall.js'],
    'gambit-won': ['src/scenes/gambitTableGame.js'],
    'gem-socketed': ['src/systems/reforge.js'],
    'herb-gathered': ['src/scenes/herbHost.js', 'src/systems/foraging/foragingInstall.js'],
    'hour-broken': ['src/net/superDungeon/sdClaims.js'],
    'ore-mined': ['src/scenes/mineHost.js'],
    'piece-crafted': ['src/net/profBook.js'],
    'piece-reforged': ['src/systems/reforge.js'],
    'port-reached': ['src/scenes/harbourOffice.js'],
    'raid-repelled': ['src/systems/raidingParties.js'],
    'redoubt-taken': ['src/scenes/eliteGates/egClient.js'],
    'revenant-knelt': ['src/systems/revenant/revenantFate.js'],
    'rite-broken': ['src/net/gate/gateClaims.js'],
    'serpent-slain': ['src/net/serpent/serpentClaims.js'],
    'ship-struck': ['src/scenes/naval/navalHost.js'],
    'star-taken': ['src/net/firmament/firmamentBook.js'],
    'valkynaz-felled': ['src/scenes/eliteGates/egClient.js'],
    'wood-chopped': ['src/scenes/treeHost.js', 'src/systems/foraging/foragingInstall.js'],
  });
  // the hosts that carry one: a line each, never more (test/scenes/hostceiling.test.js holds their length)
  const lines = (f) => readFileSync(join(ROOT, f), 'utf8').split('\n').filter((l) => /\bnoteAct\(/.test(l) && !/^\s*(\/\/|\*)/.test(l)).length;
  assert.deepEqual(['src/scenes/naval/navalHost.js', 'src/scenes/dungeonContext.js'].map(lines), [1, 1]);
  for (const host of ['src/scenes/world.js', 'src/scenes/worldModes.js', 'src/scenes/exterior.js', 'src/systems/comeSailAway/comeSailAway.js']) assert.ok(!callers.has(host), `${host} says no act`);
});

test('QL11 the kinds: ACT_IDS is the leaf\'s keys, frozen; each kind lower-case words (a script\'s `ql act <kind>` reads them); a wagon\'s load is no kind - nothing in the game finishes one (mutants: the list unfrozen; a kind re-added with no producer)', () => {
  assert.deepEqual(ACT_IDS, Object.keys(ACT_KINDS));
  assert.ok(Object.isFrozen(ACT_KINDS) && Object.isFrozen(ACT_IDS));
  for (const k of ACT_IDS) assert.match(k, /^[a-z]+(-[a-z]+)*$/, k);
  for (const k of ACT_IDS) assert.ok(typeof ACT_KINDS[k] === 'string' && ACT_KINDS[k].length > 0, `${k} has its words`);
  assert.equal(ACT_IDS.length, 23);
  assert.ok(!Object.hasOwn(ACT_KINDS, 'wagon-hauled'), 'no feature sells a wagon\'s load (qlActs.js says why)');
  assert.ok(Object.hasOwn(ACT_KINDS, 'valkynaz-felled'), 'the Weir Road\'s third step waits on it');
});

// ── THE LEAF'S LAW ─────────────────────────────────────────────

test('QL11 noteAct: an unknown kind is refused with a warning and never reaches the sink; no sink counts nothing; `n` floored, and none or less is no act; the sink\'s answer is the count (a whole number); a throwing sink costs only the act; a non-function unregisters (mutants: an unknown kind counted; n unfloored; a throw carried out)', () => {
  const warned = [];
  const was = console.warn;
  console.warn = (...a) => warned.push(a.join(' '));
  try {
    setActSink(null);
    assert.equal(noteAct('fish-caught'), 0, 'no sink - a page with no quests hears nothing');
    listen();
    assert.equal(noteAct('fish-cought'), 0);
    assert.equal(noteAct(undefined), 0);
    assert.equal(noteAct('toString'), 0, 'an own kind only - never the prototype\'s');
    assert.deepEqual(heard, [], 'a refused kind never reaches the sink');
    assert.equal(warned.length, 3);
    assert.match(warned[0], /no act "fish-cought"/);
    warned.length = 0;
    assert.equal(noteAct('fish-caught'), 1);
    assert.equal(noteAct('ore-mined', 2.9), 1);
    assert.equal(noteAct('star-taken', '3'), 1);
    for (const n of [0, -2, 0.5, NaN, 'x', null]) assert.equal(noteAct('fish-caught', n), 0, `n ${n}`);
    assert.deepEqual(heard, [['fish-caught', 1], ['ore-mined', 2], ['star-taken', 3]], 'n floored; none or less is no act');
    setActSink(() => 2.7);
    assert.equal(noteAct('cards-won'), 2, 'the count a whole number');
    setActSink(() => undefined);
    assert.equal(noteAct('cards-won'), 0);
    setActSink(() => { throw new Error('a layer broke'); });
    assert.doesNotThrow(() => noteAct('arena-won'));
    assert.equal(noteAct('arena-won'), 0);
    assert.match(warned.at(-1), /the act "arena-won" was not heard \(a layer broke\)/);
    listen();
    setActSink('not a function');
    assert.equal(noteAct('fish-caught'), 0, 'unregistered');
    assert.deepEqual(heard, []);
  } finally {
    console.warn = was;
    done();
  }
});

// ── THE PRODUCERS, DRIVEN ──────────────────────────────────────

const lcg = (seed) => () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return (seed >>> 8) / 0x800000; };
const known = (it) => Object.assign(it, { isIdentified: true });
const lootOn = () => { _resetForTests(); setPref('lootRarity', true); LR._setSocketForTests(null); LR._setWeaponSocketsForTests(null); };

test('QL11 piece-reforged (systems/reforge.js reforgePiece): heard once when the line is rolled again and paid; a refused reforge says nothing (mutants: the act before the refusals)', () => {
  lootOn();
  listen();
  try {
    const piece = known(LR.applyRarity(createWeapon(113, 1), 'rare', lcg(7)));
    const me = { items: [piece, welkyndShards(3)], goldPieces: 1000 };
    assert.equal(reforgePiece(piece, 2, me, lcg(2)).ok, false, 'too few shards');
    assert.deepEqual(heard, [], 'refused: no act');
    me.items.push(welkyndShards(5));
    assert.equal(reforgePiece(piece, 2, me, lcg(2)).ok, true);
    assert.deepEqual(heard, [['piece-reforged', 1]]);
  } finally { done(); _resetForTests(); }
});

test('QL11 gem-socketed (systems/reforge.js setGemPiece): heard once when the gem is set; no gem to set says nothing; an unsetting is no setting (mutants: the act before the refusals; unset saying it)', () => {
  lootOn();
  listen();
  try {
    const holder = known(LR.applyRarity(createWeapon(122, 1), 'rare', lcg(3)));
    holder.sockets = Array(LR.socketMax(holder)).fill(LR.SOCKET_EMPTY);
    const me = { isPlayer: true, items: [holder], goldPieces: 0 };
    assert.equal(setGemPiece(holder, 'ruby', me, 0).ok, false, 'no Ruby in the pack');
    assert.deepEqual(heard, []);
    me.items.push(mintGem('ruby'));
    assert.equal(setGemPiece(holder, 'ruby', me, 0).ok, true);
    assert.deepEqual(heard, [['gem-socketed', 1]]);
    assert.equal(unsetGemPiece(holder, me, 0).ok, true);
    assert.deepEqual(heard, [['gem-socketed', 1]], 'the gem shattered out is no gem set');
  } finally { done(); _resetForTests(); }
});

/** A door over a pretend Firmament service (test/net/firmament/firm1_book.test.js's shape). */
function firmDoor({ refuse = null } = {}) {
  let tree = '';
  const answer = (t) => ({ ok: true, data: { tree: t, renown: 20, stars: 19, craft: 4, ranks: {}, refund: { freeBelow: 10, perStar: 10 } } });
  return {
    account: () => 'acct-1',
    state: async () => answer(tree),
    set: async (_c, t) => { if (refuse) return { ok: false, error: refuse }; tree = t; return answer(t); },
  };
}

test('QL11 star-taken (net/firmament/firmamentBook.js): each star the service now holds that it did not, counted once on its answer; a star given back, the same sky again or a refused change, none (mutants: every key counted; the act before the answer)', async () => {
  listen();
  try {
    let n = 0;
    const b = createFirmamentBook({ door: firmDoor(), character: () => 'char-1', rid: () => `fql11test${String(++n).padStart(4, '0')}` });
    await b.read();
    assert.equal((await b.commit({ start: 'wr.start', keys: ['wr.s1'] })).ok, true);
    assert.equal((await b.commit({ start: 'wr.start', keys: ['wr.s1', 'wr.s2', 'wr.g'] })).ok, true);
    assert.equal((await b.commit({ start: 'wr.start', keys: ['wr.s1', 'wr.s2', 'wr.g'] })).ok, true);
    assert.equal((await b.commit({ start: 'wr.start', keys: ['wr.s1'] })).ok, true);
    assert.deepEqual(heard, [['star-taken', 1], ['star-taken', 2]], 'the first star, then two more; the same sky and a star given back are none');
    heard.length = 0;
    const r = createFirmamentBook({ door: firmDoor({ refuse: 'firm-law' }), character: () => 'char-1', rid: () => `fql11test${String(++n).padStart(4, '0')}` });
    await r.read();
    assert.equal((await r.commit({ start: 'wr.start', keys: ['wr.s1'] })).ok, false);
    assert.deepEqual(heard, [], 'refused: no star taken');
  } finally { done(); }
});

const WAYREST = { key: '100,100', name: 'Wayrest', px: 100, py: 100, region: 23, crown: 'Wayrest' };
const SENTINEL = { key: '120,100', name: 'Sentinel', px: 120, py: 100, region: 20, crown: 'Sentinel' };
const PORTS = [WAYREST, SENTINEL, { key: '103,100', name: 'Near', px: 103, py: 100, region: 23, crown: 'Wayrest' }];
const seaAt = (x, y) => x >= 100 || y >= 104;
const officeOver = (ledger) => createHarbourOffice({
  ledger, now: () => 0, day: () => 3, level: () => 5, gold: () => 10000, pay: () => {}, credit: () => {}, say: () => {}, mid: () => {},
  notorietyOf: () => 0, port: () => WAYREST, ports: () => PORTS, seaAt, waters: () => 'Wayrest',
});
const berth = (office, port) => office.event({ type: 'berth', port: port.key, boat: 42 });

test('QL11 port-reached (scenes/harbourOffice.js): a berth at another port than the last, a quarter league of way made at the helm since - never the first berth, one lying at the quay (a berth a second), a short hop, a return to the same port, nor the first after a load (mutants: the threshold; the port test; the load\'s log)', () => {
  assert.equal(PORT_VOYAGE_M, 4828 / 4, 'a quarter league');
  listen();
  try {
    const L = createCaptainLedger();
    const o = officeOver(L);
    berth(o, WAYREST);
    assert.deepEqual(heard, [], 'the first berth marks where she lies');
    L.sailed(PORT_VOYAGE_M - 1);
    berth(o, SENTINEL);
    assert.deepEqual(heard, [], 'short of a quarter league');
    L.sailed(PORT_VOYAGE_M);
    berth(o, WAYREST);
    assert.deepEqual(heard, [['port-reached', 1]]);
    berth(o, WAYREST); L.sailed(2); berth(o, WAYREST);
    assert.equal(heard.length, 1, 'lying at the quay, a berth a second: no voyage');
    L.sailed(PORT_VOYAGE_M * 4);
    berth(o, WAYREST);
    assert.equal(heard.length, 1, 'out and home to the same port: no port reached');
    // a load lays a new log - its way is the save's, never a voyage of this session's
    L.restoreSaveData({ ...L.getSaveData(), log: { ...L.getSaveData().log, sailed: 1e6 } });
    berth(o, SENTINEL);
    assert.equal(heard.length, 1, 'the first berth after a load marks where she lies');
    L.sailed(PORT_VOYAGE_M);
    berth(o, WAYREST);
    assert.deepEqual(heard, [['port-reached', 1], ['port-reached', 1]]);
  } finally { done(); }
});

test('QL11 cargo-delivered (scenes/harbourOffice.js): a delivery\'s contract done at its port, paid by its harbourmaster - once; another kind done, or a cargo berthed at another port, none (mutants: every contract done counted; the act on the berth alone)', () => {
  listen();
  try {
    const L = createCaptainLedger();
    const o = officeOver(L);
    const offers = boardFor({ port: WAYREST, crown: 'Wayrest', day: 3, level: 5, perks: { offers: 2 }, ports: PORTS, seaAt, regionIndex: 23 });
    const del = offers.find((x) => x.kind === 'delivery');
    const hunt = offers.find((x) => x.kind === 'hunt');
    assert.ok(del && hunt, 'the board posts a cargo and a hunt');
    assert.equal(L.holdContract(takeContract(del, { now: 0, boat: 42 })), true);
    assert.equal(L.holdContract(takeContract({ ...hunt, need: 1 }, { now: 0 })), true);
    const away = PORTS.find((p) => p.key !== del.to.key && p.key !== WAYREST.key);
    o.event({ type: 'berth', port: away.key, boat: 42 });
    assert.deepEqual(heard, [], 'berthed elsewhere: the cargo still in her hold');
    assert.equal(o.event({ type: 'end', act: 'sink', faction: 'pirate', crown: hunt.crown }).done.length, 1, 'the hunt done');
    assert.deepEqual(heard, [], 'a hunt is no cargo');
    assert.equal(o.event({ type: 'berth', port: del.to.key, boat: 42 }).done.length, 1);
    assert.deepEqual(heard.filter(([k]) => k === 'cargo-delivered'), [['cargo-delivered', 1]]);
    o.event({ type: 'berth', port: del.to.key, boat: 42 });
    assert.equal(heard.filter(([k]) => k === 'cargo-delivered').length, 1, 'delivered once');
  } finally { done(); }
});

test('QL11 breach-closed and rite-broken (net/gate/gateClaims.js): said off the receipt the service counted (`recorded`) - a fight\'s closed the breach, its `r` broke the rite too, a rite\'s own broke the rite alone; one counted before, none (mutants: the rite as a breach; `r` unread; a re-claim counted)', async () => {
  const { subtle } = webcrypto;
  const kp = await subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const T0 = 1_800_000_000;
  const receipt = (d, x, r) => mintReceipt({ d, b: 'ruhn', s: 'acct-me', c: 4242, x, ...(r ? { r } : {}) }, kp.privateKey, { subtle, nowS: T0 });
  // the service as server-account/src/accounts.js claimGate answers: a receipt counted once (`recorded`), and `claimed`
  // every time after - its embers (`stones`) said either way, so the queue lets it go
  const counted = new Set();
  const claim = async (r) => {
    if (counted.has(r)) return { ok: true, data: { recorded: false, why: 'claimed', stones: 1, closed: counted.size } };
    counted.add(r);
    return { ok: true, data: { recorded: true, stones: 1, closed: counted.size } };
  };
  const q = createGateClaims({ claim, nowS: () => T0 + 10, nowMs: () => 0, me: () => 'acct-me' });
  listen();
  try {
    const kinds = async (r) => { heard.length = 0; assert.equal(q.add(r), true); await tick(); await tick(); return heard.map(([k]) => k); };
    assert.deepEqual(await kinds(await receipt(701, 'dealt')), ['breach-closed']);
    assert.deepEqual(await kinds(await receipt(702, 'stood', 1)), ['breach-closed', 'rite-broken']);
    assert.deepEqual(await kinds(await receipt(703, 'rite')), ['rite-broken']);
    const before = await receipt(704, 'dealt');
    counted.add(before);
    assert.deepEqual(await kinds(before), [], 'counted before (another device, a lost answer): no act');
  } finally { done(); }
});

test('QL11 cards-won (the relay\'s tables, systems/card/cardRemoteTable.js and systems/iliac/iliacRemoteTable.js): a showdown whose main pot my chair takes, an end that names my seat - once each; a hand lost, a watcher, a game voided, none (mutants: any showdown counted; the main pot\'s winners unread; any end counted)', () => {
  listen();
  try {
    const showdown = (winners) => ({ t: 'showdown', hand: 4, seats: [0, 1], result: { shown: true, pots: [{ amount: 20, eligible: [0, 1], winners }], payouts: [0, 0], hands: {} } });
    const frame = (events) => ({ state: { seats: [{ id: 'them' }, { id: 'me' }], handNo: 4, hand: null, handSeats: [0, 1], button: 0, sb: 1, bb: 2 }, events, now: 0, at: 0 });
    const t = new RemoteCardTable({ myId: 'me', chair: 1 });
    t.ingest(frame([showdown([0])]));
    assert.deepEqual(heard, [], 'the pot went to the other chair');
    t.ingest(frame([showdown([1])]));
    assert.deepEqual(heard, [['cards-won', 1]]);
    const watcher = new RemoteCardTable({ myId: 'someone', chair: -1 });
    watcher.ingest(frame([showdown([1])]));
    assert.equal(heard.length, 1, 'a watcher wins nothing');
    heard.length = 0;
    const state = { seats: [{ id: 'me' }, { id: 'them' }], gameNo: 1 };
    const i = new RemoteIliacTable({ myId: 'me' });
    i.apply({ state, events: [{ t: 'end', gameNo: 1, winner: 1, how: 'board' }] }, 0);
    i.apply({ state, events: [{ t: 'end', gameNo: 1, winner: null, how: 'void' }] }, 0);
    assert.deepEqual(heard, [], 'lost, and no contest');
    i.apply({ state, events: [{ t: 'end', gameNo: 1, winner: 0, how: 'board' }] }, 0);
    assert.deepEqual(heard, [['cards-won', 1]]);
    new RemoteIliacTable({ myId: 'watching' }).apply({ state, events: [{ t: 'end', gameNo: 1, winner: 0, how: 'board' }] }, 0);
    assert.equal(heard.length, 1, 'a watcher sits in no seat');
  } finally { done(); }
});

test('QL11 herb-gathered, ore-mined, wood-chopped (the gathering kinds\' `answered`, which the gathering host calls once for each harvest the service answered): each its own kind, once (mutants: a kind\'s act swapped; the Motherlode alone counted)', () => {
  listen();
  try {
    herbKind({ book: {} }).answered?.({ kind: 'herbs' }, () => {});
    mineKind({ book: {} }).answered?.({ kind: 'ore' }, () => {});
    mineKind({ book: {} }).answered?.({ kind: 'stone' }, () => {});
    treeKind({ book: {} }).answered?.({ kind: 'logs' }, () => {});
    assert.deepEqual(heard, [['herb-gathered', 1], ['ore-mined', 1], ['ore-mined', 1], ['wood-chopped', 1]]);
  } finally { done(); }
});
