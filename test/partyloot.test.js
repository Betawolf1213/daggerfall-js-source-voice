// PARTY-LOOT (2026-10-14, a player: "When in a party, if a monster is killed, loot drops for one player but the other
// player sees "Empty". If that player clicks "Empty" it wipes out the loot for the other player"). Every copy of a
// dungeon body rolled its own list and the first OPENER's became the room's (WORLD4), so a party member whose own roll
// came up empty opened "Empty", claimed it, and emptied the killer's body for everyone.
//
// Mounted, not matched: two clients of one dungeon room - the host, who runs the room's foes, and a joiner - each built
// from the REAL kill door (damageFoe's death arm), the host's stream (foesFrame, roomRecord), the joiner's stream door
// (applyFoesFrame, applyFoeRecord, setFoeDead, spawnCorpse), the room's loot (publishLoot, applyLoot, applyActions and
// PARTY-LOOT's doors), takeLoot and the inventory window's own onClose, sliced out of src/scenes/dungeonContext.js and
// wired together by a relay that delivers in order, holds an act frame back (the act bucket) or loses one (a runner
// that says nothing at the death - an older build). The stand-ins are the doors no loot law reads: the body's flat
// (spawnCorpseNow), the window itself (openInventory answers a window whose close runs the real onClose), the kit's and
// the sigils' dice, and the death's handlers (raiseEnemyDeath adds one find, as a handler's find lands on the body).
// Recorded in bible/06-Systems/Online-Arc.md (PARTY-LOOT); mutants: tools/mutants/partyloot.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as acorn from 'acorn';
import { validFoeRecord, respawnDue, FOE_HEALTH_MAX, FOE_LEVEL_MAX, FOES_FRAME_MAX } from '../src/net/wire.js';
import { validLootList, LOOT_LIST_MAX, LOOT_NEWER_TEXT } from '../src/systems/loot.js';
import { peerHanded } from '../src/systems/peerWord.js';
import { goldStack } from '../src/systems/inventory.js';
import { createWeapon } from '../src/combat/enemyEquipment.js';
import { ARENA_PUPPET_OWNER } from '../src/net/arenaLaw.js';

const D = readFileSync(new URL('../src/scenes/dungeonContext.js', import.meta.url), 'utf8');
const AST = acorn.parse(D, { ecmaVersion: 'latest', sourceType: 'module' });

function find(pred, root = AST) {
  let hit = null;
  (function walk(n) {
    if (!n || typeof n.type !== 'string' || hit) return;
    if (pred(n)) { hit = n; return; }
    for (const k of Object.keys(n)) { const v = n[k]; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === 'string') walk(v); }
  })(root);
  return hit;
}
const fnNode = (name) => {
  const n = find((x) => x.type === 'FunctionDeclaration' && x.id?.name === name);
  assert.ok(n, `src has function ${name}`);
  return n;
};
const fnSrc = (name) => { const n = fnNode(name); return D.slice(n.start, n.end); };
const declSrc = (name) => {
  const n = find((x) => x.type === 'VariableDeclaration' && x.declarations.some((d) => d.id?.name === name));
  assert.ok(n, `src declares ${name}`);
  return D.slice(n.start, n.end);
};
/** The api's takeLoot, a method: its value is the function from its parameters on. */
const takeLootSrc = () => {
  const n = find((x) => x.type === 'Property' && !x.computed && x.key?.name === 'takeLoot' && x.value.type === 'FunctionExpression');
  assert.ok(n, 'src has the api\'s takeLoot');
  return `function ${D.slice(n.value.start, n.value.end)}`;
};
/** The Physical Items layer's bodies, as the dungeon hands them to it (droppedLoot.physical.attach's `corpses`). */
const physicalBodiesSrc = () => {
  const n = find((x) => x.type === 'Property' && !x.computed && x.key?.name === 'corpses' && x.value.type === 'ArrowFunctionExpression' && D.slice(x.value.start, x.value.end).includes('lootableBody'));
  assert.ok(n, 'the dungeon hands the Physical Items layer its bodies');
  return D.slice(n.value.start, n.value.end);
};
/** The inventory window's close, as openInventory hands it to the window. */
const onCloseSrc = () => {
  const n = find((x) => x.type === 'Property' && !x.computed && x.key?.name === 'onClose', fnNode('openInventory'));
  assert.ok(n, 'openInventory hands its window an onClose');
  return D.slice(n.value.start, n.value.end);
};
const scoped = (state) => new Proxy(state, {
  has: (t, k) => k !== '__s',
  get: (t, k) => (k === Symbol.unscopables ? undefined : (k in t ? t[k] : globalThis[k])),
  set: (t, k, v) => { t[k] = v; return true; },
});
const mount = (body, state) => new Function('__s', `with (__s) { ${body} }`)(scoped(state));

const LOOT = ['LOOT_KEY_RE', '_lootSeen', '_lootUnreadable', '_lootAt', '_lootOpenKey', '_lootTooBig',
  'LOOT_WORD_WAIT_MS', 'LOOT_EARLY_MS', 'LOOT_EARLY_MAX', '_lootEarly', '_lootHeld', '_lootOpenSig', '_lootOpenMissed'];
const K = mount(`${declSrc('LOOT_WORD_WAIT_MS')} ${declSrc('LOOT_EARLY_MS')} ${declSrc('LOOT_EARLY_MAX')} return { LOOT_WORD_WAIT_MS, LOOT_EARLY_MS, LOOT_EARLY_MAX };`, {});

/** The room's one layout foe as each copy builds it - a Rat at the same marker, each copy's own spawn roll on it. */
const rat = (items = []) => ({
  mobileType: 0, gender: 'male', dead: false, corpse: false, batch: null, src: { mobileType: 0 },
  entity: { mobileType: 0, health: 6, maxHealth: 6, level: 1, items, activeEffects: [], stats: { willpower: 50 }, career: {}, skills: {}, team: 'PlayerEnemy' },
  ai: { feet: [2, 0, 3], yaw: 0, moving: false, target: null, isHostile: true },
});
/** A death handler's find, as one lands on the body (CARDS9's card, SURV2's food - each pushes onto the items). */
const FIND = { ...createWeapon(113, 0), name: 'the handler\'s find' };
const names = (items) => items.map((it) => it.name);

/** One client of the room. `relay.send` is its wire out; what the other copy says reaches `applyActions`. */
function copy(id, { authority, relay, items = [] }) {
  const foes = [rat(items)];
  const windows = [];
  const state = {
    foes, _layoutFoes: 1, _sharedById: new Map(), lootPiles: [], searchables: [], _authority: authority, _locationKey: 'dungeon:7',
    opts: { selfId: () => id, onActions: (d) => relay.send(id, d), onLootClaimed: () => {}, onFoeHit: () => assert.fail('the host applies its own blows') },
    performance: { now: () => relay.clock },
    _wallNow: () => null,   // no shared clock: no stamps, nothing due back (WORLD8's hour is not this seam)
    validLootList, LOOT_LIST_MAX, LOOT_NEWER_TEXT, peerHanded, respawnDue, validFoeRecord, FOE_HEALTH_MAX, FOE_LEVEL_MAX, FOES_FRAME_MAX, ARENA_PUPPET_OWNER,
    // the kill door's neighbours (test/loot7check.test.js's killDoor): nothing here reads a loot law
    feudWeakBlow: () => false, blowClassOf: () => null, lastPlayerFeet: [0, 0, 0], _ecvT: 0, foeDeps: null, audio: {}, playerEntity: { isPlayer: true, items: [] },
    renownFoeStruck: () => {}, renownFoeDied: () => {}, reportPlayerKill: () => {}, takeWholeBlow: () => false, markFoeStruck: () => {}, markConcealedHit: () => {},
    handleAttackFromPlayer: () => {}, damageShieldPool: (e, n) => n, noteFighter: () => {}, PARTY_ME: 'me', partyFoeLoses: (f, n) => n, _sharedFoe: () => false, fightN: () => 1,
    peerSoulTrapOf: () => null, attemptSoulTrap: () => ({ allowDeath: true }), isAzurasStarEquipped: () => false, fillEmptyTrap: () => false,
    hudText: { add: () => {} }, SOUL_TRAP_TEXT: {}, setEnemyAlert: () => {}, sayEnemyDied: () => null, liveStat: () => 50,
    playRareDrop: () => {}, stampWonWeapons: () => 0, rollCorpseKit: () => [], addCorpseFood: () => {}, dropFoeCard: () => null, capFoeLoot: () => [],
    raiseEnemyDeath: (entity) => { entity.items.push({ ...FIND }); },
    spawnCorpseNow: async (f) => { f.corpsePos = [f.ai.feet[0], f.ai.feet[1], f.ai.feet[2]]; },   // the flat's mint (where the body lies, before its await); the body's flag is spawnCorpse's own
    // the joiner's stream door around the record (test/seatheal.test.js's): no surplus, no encounters, one species
    _foesSeq: 0, _foesSeqIn: -1, _foesFrom: null, _keyMismatchSaid: false, _retypeFails: new Map(), RETYPE_TRIES: 3, GENDER_BIT: ['male', 'female'], _retyping: new Set(),
    _surplus: new Map(), _surplusPending: new Map(), clearSurplus: () => {}, hideBeyondHostLayout: () => {}, surplusRecord: () => {}, dropSurplus: () => {},
    applySharedRecords: () => {}, retypeFoe: async () => assert.fail('one species at the marker'), console,
    // the press and the window
    droppedLoot: { physical: { owns: () => false }, releaseEmptied: () => {} }, surfacePlayer: () => {}, ENEMY_BASICS: {}, setMidScreenText: () => {},
    activeOverlay: null, silverFindKey: () => null, silverFindAt: () => {}, quickLootTake: () => false, lootPile: () => null, pileBody: () => null, showPickups: () => {},
    camps: { applyOwner: () => {} }, actions: { applyRemote: () => 0 }, ownRides: () => false,
    windows,
  };
  const api = mount(`
    ${LOOT.map(declSrc).join('\n')}
    ${declSrc('onlineRoom')}
    ${declSrc('isRoomFoe')}
    ${declSrc('REMOTE_KILL')}
    ${declSrc('SHARED_FOES_MAX')} ${declSrc('q2')} ${declSrc('q3')}
    ${declSrc('FOES_FRAME_SLACK')} ${declSrc('FOE_MAX_PER_FRAME')} ${declSrc('_maxLeft')} ${declSrc('foeMaxOf')}
    ${['lootKeyOf', 'lootableBody', 'lootHolder', 'roomLootKey', 'lootRecords', 'publishLoot', 'applyLoot',
      'holdEarlyLoot', 'sayBodyLoot', 'streamLaidBody', 'lootWordDue', 'heldLootTick', 'lootSig', 'sameLoot', 'lootOpened', 'lootClosed',
      'applyActions', '_runsFoe', 'damageFoe', 'spawnCorpse', 'freeCorpse', 'setFoeDead', 'applyFoeRecord',
      'fitMaxima', 'roomRecord', 'foesFrame', 'applyFoesFrame'].map(fnSrc).join('\n')}
    function openInventory(lootItems, onEmptied = null, { lootHooks = null, lootKey = null } = {}) {
      const onClose = ${onCloseSrc()};
      const w = { done: false, items: lootItems, lootKey, close: () => { if (w.done) return; w.done = true; onClose(); } };
      windows.push(w);
      return w;
    }
    const api = { takeLoot: ${takeLootSrc()} };
    const physicalBodies = ${physicalBodiesSrc()};
    return {
      api, damageFoe, foesFrame, applyFoesFrame, applyActions, heldLootTick, holdEarlyLoot, lootWordDue, physicalBodies,
      seen: () => _lootSeen, early: () => _lootEarly, held: () => _lootHeld,
    };
  `, state);
  return { id, foes, windows, state, ...api, body: () => foes[0].entity.items };
}

/** Two clients and the relay between them: an act frame reaches the other copy, in order, when the relay flushes - a
 *  frame streamed before the flush is one the act bucket held back - unless the relay loses that copy's acts (a runner
 *  that says nothing at the death). */
function room({ hostItems = [createWeapon(113, 2), goldStack(250)], joinerItems = [] } = {}) {
  const r = { clock: 1000, queue: [], lose: new Set(), sent: [] };
  r.send = (from, data) => { r.sent.push([from, data]); if (!r.lose.has(from)) r.queue.push([from, data]); return true; };
  r.flush = () => { while (r.queue.length) { const [from, data] = r.queue.shift(); (from === 'H' ? r.joiner : r.host).applyActions(from, data); } };
  r.saidBy = (who) => r.sent.filter(([from]) => from === who).map(([, d]) => d);
  r.host = copy('H', { authority: true, relay: r, items: hostItems });
  r.joiner = copy('J', { authority: false, relay: r, items: joinerItems });
  /** The host's next stream frame, through the joiner's door. */
  r.stream = () => r.joiner.applyFoesFrame(r.host.foesFrame(true), 'H');
  return r;
}

test('PARTY-LOOT: the report - the killer\'s body is the room\'s from its death; a party member whose own roll came up empty sees the killer\'s list, opens it without a claim, and its close leaves the killer\'s loot where it lay (mutants: no word at the death; the word before the handlers\' finds; an early word dropped; the laid body never handed its word)', () => {
  const r = room();
  const H = r.host, J = r.joiner;
  H.damageFoe(H.foes[0], 99);
  assert.equal(H.foes[0].dead && H.foes[0].corpse, true, 'the host laid the body');
  assert.deepEqual(names(H.body()), ['Dagger', 'Gold Pieces', 'the handler\'s find'], 'the host\'s list: its roll and the death\'s find');
  const said = r.saidBy('H');
  assert.equal(said.length, 1, 'the runner said the body at its death');
  assert.deepEqual(said[0].l.map((rec) => rec.k), ['corpse:0']);
  assert.deepEqual(said[0].l[0].r.map((it) => it.name), names(H.body()), 'its whole list - the handlers\' finds and all');
  assert.equal(H.seen().has('corpse:0'), true, 'the room has spoken about it');
  // the word goes out at the death, the frame that lays the body after it - the joiner hears the word first
  r.flush();
  assert.equal(J.foes[0].dead, false, 'the joiner\'s copy still stands');
  assert.equal(J.early().has('corpse:0'), true, 'so the word waits for the body');
  r.stream();
  assert.equal(J.foes[0].dead && J.foes[0].corpse, true, 'the host\'s frame laid it');
  assert.deepEqual(J.body(), H.body(), 'and it holds the host\'s list, not the joiner\'s own empty roll');
  assert.equal(J.seen().has('corpse:0'), true);
  assert.equal(J.early().size, 0, 'the word was spent on the body');
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
});

test('PARTY-LOOT: a word the act bucket held back - the body the stream laid first waits for it; a press inside the wait opens nothing and claims nothing, and opens on the room\'s list the frame the word lands; its Physical Items stand only then (mutants: no wait; the held press dropped; the held press never opened; the physical body stood early)', () => {
  const r = room();
  const H = r.host, J = r.joiner;
  H.damageFoe(H.foes[0], 99);
  r.stream();   // the frame before the word
  assert.deepEqual(J.body(), [], 'laid with the joiner\'s own roll - "Empty"');
  assert.equal(J.lootWordDue(J.foes[0], 'corpse:0'), true, 'the runner\'s word is due');
  assert.equal(J.api.takeLoot('corpse:0'), 0, 'the press waits');
  assert.equal(J.windows.length, 0, 'no window on the copy\'s own roll');
  assert.deepEqual(r.saidBy('J'), [], 'and no claim of it');
  assert.deepEqual(J.physicalBodies(), [], 'nor does the body stand its own roll as Physical Items');
  assert.equal(J.heldLootTick(), false, 'still due');
  r.clock += 200;
  r.flush();   // the bucket lets it go
  assert.deepEqual(J.body(), H.body(), 'the word landed on the laid body');
  assert.deepEqual(J.physicalBodies().map((b) => [b.key, b.entity.items]), [['corpse:0', H.body()]], 'its items stand now, the room\'s');
  assert.equal(J.heldLootTick(), true, 'the held press opens now');
  assert.equal(J.windows.length, 1);
  assert.deepEqual(J.windows[0].items, H.body(), 'on the room\'s list');
  assert.deepEqual(r.saidBy('J'), [], 'with no claim');
  assert.equal(J.held(), null, 'once');
  assert.equal(J.heldLootTick(), false);
});

test('PARTY-LOOT: a runner that says nothing at the death (an older build) - the joiner\'s press waits LOOT_WORD_WAIT_MS and then opens and claims its own roll, as the room always did (mutants: the wait never ends)', () => {
  const r = room({ joinerItems: [goldStack(5)] });
  const H = r.host, J = r.joiner;
  r.lose.add('H');
  H.damageFoe(H.foes[0], 99);
  r.stream();
  J.api.takeLoot('corpse:0');
  assert.equal(J.windows.length, 0, 'held');
  r.clock += K.LOOT_WORD_WAIT_MS - 1;
  assert.equal(J.heldLootTick(), false, 'inside the wait');
  r.clock += 2;
  assert.equal(J.heldLootTick(), true, 'past it: the press opens');
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
  const dagger = hw.items.splice(0, 1)[0];
  hw.close();
  r.flush();
  assert.deepEqual(names(J.body()), [dagger.name, 'Gold Pieces', 'the handler\'s find'], 'C1: the host\'s word waits at the joiner\'s open window');
  const before = r.sent.length;
  jw.close();
  assert.equal(r.sent.length, before, 'the joiner moved nothing and says nothing');
  assert.deepEqual(names(J.body()), ['Gold Pieces', 'the handler\'s find'], 'the held word landed at the close');
  r.flush();
  assert.deepEqual(names(H.body()), ['Gold Pieces', 'the handler\'s find'], 'and the dagger the host took stays taken');
  // a window that moves something is the room's newest word, as WORLD4's close always was
  J.api.takeLoot('corpse:0');
  const gold = J.windows[1].items.splice(0, 1)[0];
  assert.equal(gold.name, 'Gold Pieces');
  J.windows[1].close();
  r.flush();
  assert.deepEqual(names(H.body()), ['the handler\'s find'], 'the joiner\'s take is the room\'s');
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

test('PARTY-LOOT: a word held for a body is bounded - only a body the layout can lay (never a pile, a search, a body past the run), the newest LOOT_EARLY_MAX bodies, and none past LOOT_EARLY_MS (mutants: no cap; no age; any key held)', () => {
  const r = room();
  const J = r.joiner;
  const word = (k, items = [goldStack(1)]) => ({ k: 'dungeon:7', l: [{ k, r: items }] });
  for (const k of ['loot:0', 'srch:0', 'corpse:1', 'corpse:99999']) J.applyActions('H', word(k));
  assert.deepEqual([...J.early().keys()], [], 'nothing this layout lays');
  for (let n = 0; n < K.LOOT_EARLY_MAX + 6; n++) J.applyActions('H', word(`enc:${n + 1}`));
  assert.equal(J.early().size, K.LOOT_EARLY_MAX, 'at most LOOT_EARLY_MAX');
  assert.equal(J.early().has('enc:1'), false, 'the oldest go first');
  assert.equal(J.early().has(`enc:${K.LOOT_EARLY_MAX + 6}`), true);
  // a word older than LOOT_EARLY_MS is not landed on the body - the body waits for the runner's own
  J.applyActions('H', word('corpse:0', [goldStack(77)]));
  r.clock += K.LOOT_EARLY_MS + 1;
  r.host.damageFoe(r.host.foes[0], 99);   // its own word waits on the relay
  r.stream();
  assert.deepEqual(J.body(), [], 'the stale word stayed off the body');
  assert.equal(J.lootWordDue(J.foes[0], 'corpse:0'), true, 'which waits for the runner\'s word');
});

test('PARTY-LOOT: the runner says nothing offline, nothing for a body that is not the room\'s, and nothing over a word the room has already said (mutants: said offline)', () => {
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

test('PARTY-LOOT: a held press is the latest press, and is dropped when the player is at another window by the time the word lands (mutants: the held press over another window)', () => {
  const r = room();
  const H = r.host, J = r.joiner;
  H.damageFoe(H.foes[0], 99);
  r.stream();
  J.api.takeLoot('corpse:0', 'steal');
  assert.deepEqual(J.held(), { key: 'corpse:0', mode: 'steal', pileKeys: null }, 'the press and its mode');
  J.state.activeOverlay = { done: false };   // the player opened something else meanwhile
  r.flush();
  assert.equal(J.heldLootTick(), false, 'not over another window');
  assert.equal(J.held(), null, 'and not later either');
  J.state.activeOverlay = null;
  assert.equal(J.windows.length, 0);
});

test('PARTY-LOOT, by source: one door claims and one door closes - `_lootOpenKey` is written by lootOpened and lootClosed alone; the window\'s mount claims through lootOpened and its close says through lootClosed; the kill door says the body after the death\'s handlers; the joiner\'s stream door hands the body it laid its word; a body whose word is due stands no physical items', () => {
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
  const corpses = find((x) => x.type === 'Property' && !x.computed && x.key?.name === 'corpses' && x.value.type === 'ArrowFunctionExpression' && D.slice(x.value.start, x.value.end).includes('lootableBody'));
  assert.ok(corpses, 'the Physical Items layer\'s bodies');
  assert.match(D.slice(corpses.value.start, corpses.value.end), /if \(lootWordDue\(f, u\)\) return null;/, 'a body whose word is due stands nothing of its own roll');
  assert.match(fnSrc('drawFoes'), /respawnSweep\(_ecvT\);[^\n]*\n\s*heldLootTick\(\);/, 'and the held press is asked every frame');
});
