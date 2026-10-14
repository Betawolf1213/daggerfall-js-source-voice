// PARTY-LOOT's rig: two clients of one dungeon room, mounted from the REAL source (test/partyloot.test.js's header says
// what is real and what stands in, and why). test/partyloot.test.js drives them over a relay of its own;
// test/partyloot_wire.test.js over the real wire - net/online.js sessions, world.js's own act and foes doors, and the
// relay's own Room. One home for the copy, so the two suites cannot drift apart (AUDIT WORLD D10's law for fakes).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as acorn from 'acorn';
import { validFoeRecord, respawnDue, FOE_HEALTH_MAX, FOE_LEVEL_MAX, FOES_FRAME_MAX } from '../src/net/wire.js';
import { validLootList, LOOT_LIST_MAX, LOOT_NEWER_TEXT } from '../src/systems/loot.js';
import { peerHanded } from '../src/systems/peerWord.js';
import { goldStack } from '../src/systems/inventory.js';
import { planTake, planStore, applyTransfer } from '../src/systems/itemTransfer.js';
import { createWeapon } from '../src/combat/enemyEquipment.js';
import { ARENA_PUPPET_OWNER } from '../src/net/arenaLaw.js';
import { foeSeed, applyWireLook } from '../src/characters/foeBodies.js';

export const D = readFileSync(new URL('../src/scenes/dungeonContext.js', import.meta.url), 'utf8');
export const AST = acorn.parse(D, { ecmaVersion: 'latest', sourceType: 'module' });

export function find(pred, root = AST) {
  let hit = null;
  (function walk(n) {
    if (!n || typeof n.type !== 'string' || hit) return;
    if (pred(n)) { hit = n; return; }
    for (const k of Object.keys(n)) { const v = n[k]; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === 'string') walk(v); }
  })(root);
  return hit;
}
export const fnNode = (name) => {
  const n = find((x) => x.type === 'FunctionDeclaration' && x.id?.name === name);
  assert.ok(n, `src has function ${name}`);
  return n;
};
export const fnSrc = (name) => { const n = fnNode(name); return D.slice(n.start, n.end); };
export const declSrc = (name) => {
  const n = find((x) => x.type === 'VariableDeclaration' && x.declarations.some((d) => d.id?.name === name));
  assert.ok(n, `src declares ${name}`);
  return D.slice(n.start, n.end);
};
/** One of the context api's methods: its value is the function from its parameters on. */
export const memberSrc = (name) => {
  const n = find((x) => x.type === 'Property' && !x.computed && x.key?.name === name && x.method && x.value.type === 'FunctionExpression');
  assert.ok(n, `src has the api's ${name}`);
  return `function ${D.slice(n.value.start, n.value.end)}`;
};
/** The Physical Items layer's bodies, as the dungeon hands them to it (droppedLoot.physical.attach's `corpses`). */
export const physicalBodiesSrc = () => {
  const n = find((x) => x.type === 'Property' && !x.computed && x.key?.name === 'corpses' && x.value.type === 'ArrowFunctionExpression' && D.slice(x.value.start, x.value.end).includes('lootableBody'));
  assert.ok(n, 'the dungeon hands the Physical Items layer its bodies');
  return D.slice(n.value.start, n.value.end);
};
/** The inventory window's close, as openInventory hands it to the window. */
export const onCloseSrc = () => {
  const n = find((x) => x.type === 'Property' && !x.computed && x.key?.name === 'onClose', fnNode('openInventory'));
  assert.ok(n, 'openInventory hands its window an onClose');
  return D.slice(n.value.start, n.value.end);
};
export const scoped = (state) => new Proxy(state, {
  has: (t, k) => k !== '__s',
  get: (t, k) => (k === Symbol.unscopables ? undefined : (k in t ? t[k] : globalThis[k])),
  set: (t, k, v) => { t[k] = v; return true; },
});
export const mount = (body, state) => new Function('__s', `with (__s) { ${body} }`)(scoped(state));

const LOOT = ['LOOT_KEY_RE', '_lootSeen', '_lootUnreadable', '_lootAt', '_lootOpenKey', '_lootTooBig',
  'LOOT_WORD_WAIT_MS', 'LOOT_EARLY_MS', 'LOOT_EARLY_MAX', 'LOOT_HELD_GRACE_MS', '_lootEarly', '_lootHeld', '_lootOpenSig', '_lootOpenMissed'];
export const K = mount(`${['LOOT_WORD_WAIT_MS', 'LOOT_EARLY_MS', 'LOOT_EARLY_MAX', 'LOOT_HELD_GRACE_MS'].map(declSrc).join(' ')} return { LOOT_WORD_WAIT_MS, LOOT_EARLY_MS, LOOT_EARLY_MAX, LOOT_HELD_GRACE_MS };`, {});

/** A foe as each copy builds it - a Rat at the same marker, each copy's own spawn roll on it. */
export const rat = (items = []) => ({
  mobileType: 0, gender: 'male', dead: false, corpse: false, batch: null, src: { mobileType: 0 },
  entity: { mobileType: 0, health: 6, maxHealth: 6, level: 1, items, activeEffects: [], stats: { willpower: 50 }, career: {}, skills: {}, team: 'PlayerEnemy' },
  ai: { feet: [2, 0, 3], yaw: 0, moving: false, target: null, isHostile: true },
});
/** A death handler's find, as one lands on the body (CARDS9's card, SURV2's food - each pushes onto the items). */
export const FIND = { ...createWeapon(113, 0), name: 'the handler\'s find' };
export const names = (items) => items.map((it) => it.name);
export const counts = (items) => items.map((it) => it.stackCount ?? 1);
/** The window's take, as its click makes it: the plan, then the transfer (a partial take is the split popup's count). */
export const take = (list, item, pack, amount = null) => { const plan = planTake(item, { bag: pack }); assert.ok(plan.ok); return applyTransfer(item, amount == null ? plan : { ...plan, amount }, list, pack, {}); };
/** ...and its store, from the pack into the container. */
export const store = (list, item, pack) => { pack.push(item); const plan = planStore(item, { remote: list }); assert.ok(plan.ok); return applyTransfer(item, plan, pack, list, { fromLocal: true }); };

/** One client of the room. `relay.send` is its wire out (`relay.clock` its clock, `relay.wall` the shared clock on);
 *  what the other copy says reaches `applyActions`, the host's stream `applyFoes`. `layout` is the room's layout foes,
 *  each copy's own spawn roll on each (one foe with `items` without it). */
export function copy(id, { authority, relay, items = [], layout = null, enc = null }) {
  const foes = (layout ?? [items]).map((it) => rat(it));
  const sharedById = new Map();
  if (enc) { const e = Object.assign(rat(enc.items), { _encId: enc.id }); foes.push(e); sharedById.set(enc.id, e); }   // REST-SYNC: a rest's encounter, the room's by its number, past the layout's run
  const windows = [], claimed = { n: 0 }, pack = [];
  const state = {
    foes, _layoutFoes: (layout ?? [items]).length, _sharedById: sharedById, lootPiles: [], searchables: [], _authority: authority, _locationKey: 'dungeon:7',
    opts: { selfId: () => id, onActions: (d) => relay.send(id, d), onLootClaimed: () => { claimed.n++; }, onFoeHit: () => assert.fail('the host applies its own blows') },
    performance: { now: () => relay.clock },
    _wallNow: relay.wall ? () => relay.clock : () => null,   // WORLD8's shared clock - on, a word's stamp rides it; off, nothing is stamped
    validLootList, LOOT_LIST_MAX, LOOT_NEWER_TEXT, peerHanded, respawnDue, validFoeRecord, FOE_HEALTH_MAX, FOE_LEVEL_MAX, FOES_FRAME_MAX, ARENA_PUPPET_OWNER, foeSeed, applyWireLook,
    // the kill door's neighbours (test/loot7check.test.js's killDoor): nothing here reads a loot law
    feudWeakBlow: () => false, blowClassOf: () => null, lastPlayerFeet: [0, 0, 0], _ecvT: 0, foeDeps: null, audio: {}, playerEntity: { isPlayer: true, items: pack },
    renownFoeStruck: () => {}, renownFoeDied: () => {}, reportPlayerKill: () => {}, takeWholeBlow: () => false, markFoeStruck: () => {}, markConcealedHit: () => {},
    handleAttackFromPlayer: () => {}, damageShieldPool: (e, n) => n, noteFighter: () => {}, PARTY_ME: 'me', partyFoeLoses: (f, n) => n, _sharedFoe: () => false, fightN: () => 1,
    peerSoulTrapOf: () => null, attemptSoulTrap: () => ({ allowDeath: true }), isAzurasStarEquipped: () => false, fillEmptyTrap: () => false,
    hudText: { add: () => {} }, SOUL_TRAP_TEXT: {}, setEnemyAlert: () => {}, sayEnemyDied: () => null, liveStat: () => 50,
    playRareDrop: () => {}, stampWonWeapons: () => 0, rollCorpseKit: () => [], addCorpseFood: () => {}, dropFoeCard: () => null, capFoeLoot: () => [],
    raiseEnemyDeath: (entity) => { entity.items.push({ ...FIND }); },
    spawnCorpseNow: async (f) => { f.corpsePos = [f.ai.feet[0], f.ai.feet[1], f.ai.feet[2]]; },   // the flat's mint (where the body lies, before its await); the body's flag is spawnCorpse's own
    // the joiner's stream doors around the records (test/seatheal.test.js's, test/restsync.test.js's): no surplus, one species
    _foesSeq: 0, _foesSeqIn: -1, _foesFrom: null, _keyMismatchSaid: false, _retypeFails: new Map(), RETYPE_TRIES: 3, GENDER_BIT: ['male', 'female'], _retyping: new Set(),
    _surplus: new Map(), _surplusPending: new Map(), clearSurplus: () => {}, hideBeyondHostLayout: () => {}, surplusRecord: () => {}, dropSurplus: () => {},
    _sharedSeq: 0, _sharedPending: new Map(), canStandFoe: () => true,
    standSharedPuppet: async () => assert.fail('the encounter stands here already'), dropSharedFoe: () => assert.fail('the room lists its encounter'),
    retypeFoe: async () => assert.fail('one species at the marker'), console,
    setAuthority: () => assert.fail('the seat does not move here'),   // applyFoes' arm for a frame that reaches the seat's holder
    // the press and the window
    droppedLoot: { physical: { owns: () => false }, releaseEmptied: () => {} }, surfacePlayer: () => {}, ENEMY_BASICS: {}, setMidScreenText: () => {},
    activeOverlay: null, silverFindKey: () => null, silverFindAt: () => {}, quickLootTake: () => false, lootPile: () => null, pileBody: () => null, showPickups: () => {},
    camps: { applyOwner: () => {} }, actions: { applyRemote: () => 0, collectSaveData: () => [] }, sharedRecord: (r) => r, ownRides: () => false,
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
      'fitMaxima', 'roomRecord', 'foesFrame', 'applyFoesFrame', 'applySharedRecords', 'applyFoes'].map(fnSrc).join('\n')}
    function openInventory(lootItems, onEmptied = null, { lootHooks = null, lootKey = null } = {}) {
      const onClose = ${onCloseSrc()};
      const w = { done: false, items: lootItems, lootKey, close: () => { if (w.done) return; w.done = true; onClose(); } };
      windows.push(w);
      return w;
    }
    const api = { takeLoot: ${memberSrc('takeLoot')} };
    const actionRecords = ${memberSrc('actionRecords')};
    const physicalBodies = ${physicalBodiesSrc()};
    return {
      api, damageFoe, foesFrame, applyFoesFrame, applyFoes, applyActions, actionRecords, heldLootTick, lootWordDue, physicalBodies,
      seen: () => _lootSeen, early: () => _lootEarly, held: () => _lootHeld,
    };
  `, state);
  return { id, foes, windows, state, claimed, pack, ...api, body: (i = 0) => foes[i].entity.items };
}

/** Two clients and the relay between them. An act frame reaches the other copy, in order, when the relay flushes - a
 *  frame streamed before the flush is one the wire had not delivered yet. A copy the relay REFUSES is world.js's act
 *  bucket saying no: the send answers false and the keys wait, and `heal` re-reads them through that copy's own
 *  actionRecords (actFlush -> placeActionRecords). A copy it LOSES says nothing the other hears. */
export function room({ hostItems = [createWeapon(113, 2), goldStack(250)], joinerItems = [], wall = false, enc = null } = {}) {
  const r = { clock: 1000, wall, queue: [], lose: new Set(), refuse: new Set(), pending: new Map(), sent: [] };
  r.send = (from, data) => {
    if (r.refuse.has(from)) { const p = r.pending.get(from) ?? new Set(); for (const rec of data.l ?? []) p.add(rec.k); r.pending.set(from, p); return false; }
    r.sent.push([from, data]);
    if (!r.lose.has(from)) r.queue.push([from, data]);
    return true;
  };
  r.heal = (from) => {
    r.refuse.delete(from);
    const keys = [...(r.pending.get(from) ?? [])];
    r.pending.delete(from);
    const data = (from === 'H' ? r.host : r.joiner).actionRecords(keys);
    if (data) r.send(from, data);
  };
  r.flush = () => { while (r.queue.length) { const [from, data] = r.queue.shift(); (from === 'H' ? r.joiner : r.host).applyActions(from, data); } };
  r.saidBy = (who) => r.sent.filter(([from]) => from === who).map(([, d]) => d);
  r.host = copy('H', { authority: true, relay: r, items: hostItems, enc: enc && { id: enc.id, items: enc.hostItems } });
  r.joiner = copy('J', { authority: false, relay: r, items: joinerItems, enc: enc && { id: enc.id, items: enc.joinerItems ?? [] } });
  /** The host's next stream frame, through the joiner's door. */
  r.stream = () => r.joiner.applyFoesFrame(r.host.foesFrame(true), 'H');
  return r;
}

/** THE OTHER HOSTS' OWN STATEMENTS, sliced as this file slices the dungeon's: `fn` a function, `decl` the declaration
 *  that names a variable, `member` an object's method (as a function), `assigned` the right side of an assignment named
 *  by its left side's text. Each asks for ONE site - a name that stood twice would mount whichever came first. */
const _sources = new Map();
export function sourceOf(path) {
  if (_sources.has(path)) return _sources.get(path);
  const text = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
  const ast = acorn.parse(text, { ecmaVersion: 'latest', sourceType: 'module' });
  const all = (pred) => {
    const hits = [];
    (function walk(n) {
      if (!n || typeof n.type !== 'string') return;
      if (pred(n)) hits.push(n);
      for (const k of Object.keys(n)) { const v = n[k]; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === 'string') walk(v); }
    })(ast);
    return hits;
  };
  const one = (pred, what) => { const hits = all(pred); assert.equal(hits.length, 1, `${path}: ${what} stands once`); return hits[0]; };
  const slice = (n) => text.slice(n.start, n.end);
  const src = {
    text,
    fn: (name) => slice(one((x) => x.type === 'FunctionDeclaration' && x.id?.name === name, `function ${name}`)),
    decl: (name) => slice(one((x) => x.type === 'VariableDeclaration' && x.declarations.some((d) => d.id?.name === name), `the declaration of ${name}`)),
    member: (name) => { const n = one((x) => x.type === 'Property' && !x.computed && x.key?.name === name && x.method, `the method ${name}`); return `function ${slice(n.value)}`; },
    assigned: (lhs) => slice(one((x) => x.type === 'AssignmentExpression' && slice(x.left) === lhs, `the assignment to ${lhs}`).right),
  };
  _sources.set(path, src);
  return src;
}
