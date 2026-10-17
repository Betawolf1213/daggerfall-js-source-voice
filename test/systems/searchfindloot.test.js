// OUTDOOR-LOOT, AC9 (2026-10-17): A DUNGEON'S SEARCH FIND IS ONE LIST FOR THE SEARCHER'S PARTY. RED PINS, PHASE 1.
// A searched object's find (`srch:<i>`, SEARCH1) is shared within the searcher's party (GRAVE-PARTY,
// scenes/searchRoom.js), and its room word is WORLD4's WHOLE LIST: scenes/dungeonContext.js `function applyLoot(list,
// from = null)` lands it over the find for every key that is not a room base container (PARTY-LOOT's ROOM_BASE_KINDS is
// loot, corpse and enc), except under the reader's own open window (AUDIT WORLD4 C1), and publishLoot says the whole find
// at the search and at every close. The last writer wins, so - inside one party, today:
//   - two partymates with the find open: the later close republishes a stale list - a piece the first took comes back
//     (a dupe), and a piece put in is erased;
//   - two searches of one object in one breath each mint their own find, and the closes cross: two lists;
//   - LOOT-BULK's Take all makes one stale close resurrect the whole find.
//
// MOUNTED, NOT MATCHED (DESIGN.md section 8.1: partyloot's `peer()` mount, extended with the searchables and a real
// createSearchRoom). Each player is the dungeon host's own loot doors sliced out of src/scenes/dungeonContext.js - the
// search (activateSearchable, whatever it calls at the find), the find's window door (the takeLoot member and the
// host's own openInventory, whose onClose says the close's word), the room word out and in (publishLoot, lootRecords,
// applyLoot, applyActions) - with the PARTY-LOOT block as the host constructs it (scenes/roomLootHost.js
// createRoomLoot, sliced as test/systems/partyloot.test.js slices it), every name they read that the two files import
// bound to the real module's export through their OWN import lists. GRAVE-PARTY's lens is each player's own hub
// picture (net/social.js SocialState, scenes/searchPartyHost.js), as test/systems/fb1016b_graveparty.test.js stands
// it. The relay is a queue of act frames fanned to everyone else in the dungeon. The window is a stand-in for the
// window the host's openInventory mounts (createInventoryWindow's deps: `loot.items()` the find's array, its `onClose`)
// that moves pieces as the loot window's own click does (itemTransfer.js planTake/planStore + applyTransfer), and, for
// Take all, THE REAL ENHANCED WINDOW over those deps (test/ui/lootbulk.test.js's mount), pressed.
//
// Run against the tree at 02706035cf the AC9 pins fail by their assertions; the guard (named so) passes.
import '../modsOff.js';
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as acorn from 'acorn';
import { withDom } from '../invdrag.mjs';
import { mountEnhancedInventory } from '../../src/ui/enhanced/enhancedInventory.js';
import { planTake, planStore, applyTransfer } from '../../src/systems/item/itemTransfer.js';
import { searchableKind, restoreSearchLedger, searchLedgerRecord, setSearchParty, searchPartyLens, _resetSearchLedgerForTests } from '../../src/systems/searchables.js';
import { validSocialFrame, sharedClassicMinutes } from '../../src/net/wire.js';
import { SocialState } from '../../src/net/social.js';
import { createSearchParty } from '../../src/scenes/searchPartyHost.js';
import { setSharedClock } from '../../src/systems/worldTick.js';
import { ActionTextBox } from '../../src/ui/actionText.js';
import { ITEM_TEMPLATES } from '../../src/characters/paperdoll/paperdoll.js';
import { _resetForTests as resetPrefs } from '../../src/systems/uiPrefs.js';
import * as RL from '../../src/systems/roomLoot.js';
import { installRoleplayRealismItems } from '../../src/systems/roleplayRealismItems/rriInstall.js';

installRoleplayRealismItems();   // the hosts' own install (scenes/shared.js): its weapons are among a search's finds
const rd = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const lcg = (seed) => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const clone = (v) => JSON.parse(JSON.stringify(v));
const REAL_RANDOM = Math.random;
const clock = { t: Date.UTC(2027, 3, 1, 12, 0, 0) };
afterEach(() => { Math.random = REAL_RANDOM; setSharedClock(null); _resetSearchLedgerForTests(); setSearchParty(null); });

// ═══ THE DUNGEON HOST'S DOORS, sliced (test/systems/partyloot.test.js's method) ═════════════════════════════════════
const FILES = ['src/scenes/dungeonContext.js', 'src/scenes/roomLootHost.js'].map((p) => { const src = rd(p); return { p, src, ast: acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module' }) }; });
const [DC, RH] = FILES;
function walk(n, fn) {
  if (!n || typeof n.type !== 'string') return;
  fn(n);
  for (const k of Object.keys(n)) { const v = n[k]; if (Array.isArray(v)) v.forEach((x) => walk(x, fn)); else if (v && typeof v.type === 'string') walk(v, fn); }
}
function first(f, pred) { let hit = null; walk(f.ast, (n) => { if (!hit && pred(n)) hit = n; }); return hit; }
const fnSrc = (name) => { const n = first(DC, (x) => x.type === 'FunctionDeclaration' && x.id?.name === name); assert.ok(n, `dungeonContext.js has function ${name}`); return DC.src.slice(n.start, n.end); };
const optFn = (name) => { const n = first(DC, (x) => x.type === 'FunctionDeclaration' && x.id?.name === name); return n ? DC.src.slice(n.start, n.end) : ''; };
const declSrc = (name) => { const n = first(DC, (x) => x.type === 'VariableDeclaration' && x.declarations.some((d) => d.id?.name === name)); assert.ok(n, `dungeonContext.js declares ${name}`); return DC.src.slice(n.start, n.end); };
const memberSrc = (name) => {
  const n = first(DC, (x) => x.type === 'Property' && !x.computed && x.key?.name === name && (x.value.type === 'FunctionExpression' || x.value.type === 'ArrowFunctionExpression'));
  assert.ok(n, `dungeonContext.js has member ${name}`);
  const body = DC.src.slice(n.value.start, n.value.end);
  return n.method ? `function ${body}` : body;
};
/** The PARTY-LOOT block as the dungeon host constructs it (partyloot.test.js's PARTS): the host's counters, the
 *  module's createRoomLoot, and the host's construction of it - whose returns land in the mount's scope. */
const BLOCK = (() => {
  const ctor = first(DC, (x) => x.type === 'VariableDeclaration' && x.declarations.some((d) => d.init?.type === 'CallExpression' && d.init.callee?.name === 'createRoomLoot'));
  const fn = first(RH, (x) => x.type === 'FunctionDeclaration' && x.id?.name === 'createRoomLoot');
  const a = DC.src.indexOf('  let _roomMintHold = 0;');
  assert.ok(ctor && fn && a >= 0 && a < ctor.start, 'the dungeon host constructs the PARTY-LOOT block (scenes/roomLootHost.js createRoomLoot)');
  return `${DC.src.slice(a, ctor.start)}${RH.src.slice(fn.start, fn.end)}\n  ${DC.src.slice(ctor.start, ctor.end)}\n`;
})();
const PLAYER = `
  ${declSrc('_respawnMs')}
  ${declSrc('respawnDue')}
  ${declSrc('LOOT_KEY_RE')}
  ${fnSrc('lootKeyOf')}
  ${fnSrc('lootableBody')}
  ${fnSrc('lootHolder')}
  ${fnSrc('roomLootKey')}
  ${declSrc('_wallNow')}
  ${declSrc('searchRoom')}
  ${fnSrc('lootRecords')}
  ${fnSrc('publishLoot')}
  ${optFn('sayRoomWord')}
  ${fnSrc('applyLoot')}
  ${fnSrc('applyActions')}
  ${BLOCK}
  ${fnSrc('searchLocationKey')}
  ${fnSrc('searchHeard')}
  ${fnSrc('activateSearchable')}
  ${fnSrc('openInventory')}
  const api = { takeLoot: ${memberSrc('takeLoot')} };
  return { api, applyActions, roomClaimTick: typeof roomClaimTick === 'function' ? roomClaimTick : () => {} };
`;
/** Every name the mounted doors read that either file imports, bound to the real module's export. */
const BOUND = await (async () => {
  const map = new Map();
  for (const f of FILES) for (const n of f.ast.body) {
    if (n.type !== 'ImportDeclaration') continue;
    const from = new URL(n.source.value, new URL(`../../${f.p}`, import.meta.url)).href;
    for (const s of n.specifiers) if (!map.has(s.local.name)) map.set(s.local.name, [from, s.type === 'ImportSpecifier' ? (s.imported.name ?? s.imported.value) : s.type === 'ImportDefaultSpecifier' ? 'default' : '*']);
  }
  const names = new Set();
  walk(acorn.parse(`(function () {\n${PLAYER}\n})`, { ecmaVersion: 'latest' }), (n) => { if (n.type === 'Identifier') names.add(n.name); });
  const out = {};
  for (const name of names) {
    const hit = map.get(name);
    if (!hit) continue;
    const mod = await import(hit[0]);
    out[name] = hit[1] === '*' ? mod : mod[hit[1]];
  }
  return out;
})();
const scoped = (state) => new Proxy(state, {
  has: (t, k) => k !== '__s',
  get: (t, k) => (k === Symbol.unscopables ? undefined : (k in t ? t[k] : globalThis[k])),
  set: (t, k, v) => { t[k] = v; return true; },
});
const mount = (body, state) => new Function('__s', `with (__s) { ${body} }`)(scoped(state));

// ═══ THE PARTY IN THE CRYPT ═════════════════════════════════════════════════════════════════════════════════════════
/** A player's hub picture (fb1016b_graveparty.test.js's `picture`): `party` the accounts seated together, the first
 *  its leader. */
const PLAYERS = { 'acct-ann': { name: 'Ann', peer: 'a0a0-0001' }, 'acct-bob': { name: 'Bob', peer: 'b0b0-0002' }, 'acct-dan': { name: 'Dan', peer: 'd0d0-0004' }, 'acct-eve': { name: 'Eve', peer: 'e0e0-0003' } };
const PARTY = ['acct-ann', 'acct-bob', 'acct-dan'];
function picture(social, acct, party = null) {
  const row = (a) => ({ acct: a, name: PLAYERS[a].name, online: true, peers: [PLAYERS[a].peer] });
  const f = validSocialFrame({ t: 'social', k: 'state', acct, name: PLAYERS[acct].name, peers: [PLAYERS[acct].peer], friends: [], in: [], out: [], invites: [],
    party: party ? { id: 'party-0001', leader: party[0], members: party.map(row) } : null });
  assert.ok(f, 'a hub picture the wire takes');
  social.apply(f);
  return social;
}
const ROOM = 'dungeon:m777';   // a Graveyard's Cemetery (dungeonType 18): its crypt's coffins
const COFFIN = 41315;          // TEXTURE.092's low wooden coffin (systems/searchables.js)
/** A searchable as the build mints it (dungeonContext.js: `{ kind, aabb, key, lock: 0, items: [], records }`). */
const coffinAt = (i) => ({ kind: searchableKind(COFFIN), aabb: { min: [i * 3, 0, 0], max: [i * 3 + 0.8, 0.45, 2] }, key: `0:${100 + i}`, lock: 0, items: [], records: false });
function actRoom() {
  const players = [], q = [];
  return {
    players,
    join(p) { players.push(p); },
    send(from, data) { q.push({ from, data: clone(data) }); return true; },
    /** The act frames said so far, landed on everyone else in the dungeon, and each player's claims tick after. */
    flush() {
      for (let guard = 0; q.length && guard < 64; guard++) {
        while (q.length) { const { from, data } = q.shift(); for (const p of players) if (p.id !== from) p.as(() => p.h.applyActions(from, data)); }
        for (const p of players) p.as(() => p.h.roomClaimTick(clock.t));
      }
    },
  };
}
/** One player in the crypt: the host's doors over two coffins, their own dice, ledger and party lens. `host` is the
 *  dungeon's seat (WORLD2's _authority) - the first player in. */
function player(net, acct, { party = PARTY, host = false } = {}) {
  const id = PLAYERS[acct].peer;
  const social = picture(new SocialState({ acct }), acct, party);
  createSearchParty({ social });
  const lens = searchPartyLens();
  const said = [], boxes = [];
  const entity = { level: 6, gender: 'male', name: PLAYERS[acct].name, characterId: `char-${acct}`, career: { name: 'Spellsword' }, stats: { luck: 50, strength: 50, endurance: 48 }, activeEffects: [], items: [], goldPieces: 0 };
  const P = { id, acct, entity, said, boxes, ledger: { rows: [] }, rand: lcg(acct.length * 104729 + acct.charCodeAt(5)), next: null, window: null };
  P.as = (fn) => {
    restoreSearchLedger(P.ledger); setSearchParty(lens);
    Math.random = () => { if (P.next != null) { const v = P.next; P.next = null; return v; } return P.rand(); };
    try { return fn(); } finally { Math.random = REAL_RANDOM; P.ledger = searchLedgerRecord(); }
  };
  const seat = net.players[0]?.id ?? id;
  const state = {
    ...BOUND, ...RL,
    searchables: [coffinAt(0), coffinAt(1)], lootPiles: [], foes: [], _layoutFoes: 0, _sharedById: new Map(),
    _lootSeen: new Set(), _lootUnreadable: new Set(), _lootAt: new Map(), _lootOpenKey: null, _lootTooBig: new Set(),
    _locationKey: ROOM, dfLocation: { name: 'The Tombs of Test', mapTableData: { mapId: 777, dungeonType: 18 } },
    _authority: host, _foesFrom: host ? null : seat, _sharedStamp: `st-${acct}`, _deepCleared: new Set(), _deepFoeCleared: new Set(), _wildDungeon: false, _wildRing: null, _superTier: false,
    playerEntity: entity, activeOverlay: null, _ctxDead: false, enemies: [], lootKey: null,
    opts: { selfId: () => id, onActions: (data) => net.send(id, data), onLootClaimed: () => {}, party: () => [], partyLevels: () => [], roomHost: () => seat },
    onlineRoom: () => true, settleLootFlat: () => {}, _sharedFoe: () => false, fightN: () => 1, eliteLootOpts: () => ({}), rollPileItems: () => [],
    camps: { applyOwner: () => {}, activate: () => false }, roomEncounterAsked: () => false, actions: { applyRemote: () => 0 },
    droppedLoot: { physical: { owns: () => false }, pileFor: () => null, releaseEmptied: () => {} }, droppedTorches: { activate: () => false }, plaqueActionFor: () => null,
    setMidScreenText: (t) => said.push(t), pushDungeonWindow: (w) => boxes.push(w), presentNpcInfoText: (s) => s,
    /** The window the host's openInventory mounts - the stand-in's (below). */
    createInventoryWindow: (deps) => P.window?.open(deps) ?? null,
    surfacePlayer: () => {}, hudText: { add: () => {} }, renderer: { textures: new Map() }, packDoors: {}, useHooks: {}, weaponRig: { playerWeapon: {} },
    silverFindKey: () => null, silverFindAt: () => {}, showPickups: null, lootPile: () => null,
    searchFoeCount: () => 2, searchFoeSpots: () => [], spawnLooseFoe: () => {},
  };
  P.state = state;
  P.h = P.as(() => mount(PLAYER, state));
  net.join(P);
  return P;
}
/** The search: the host's press on a coffin (`search:<i>`, takeLoot's door), its die `roll` (0.5: a find), and - the
 *  message box clicked away - the find's window, opened over the room's list by the box's own onClose. */
function search(P, i, win, roll = 0.5) {
  P.window = win;
  return P.as(() => {
    P.next = roll;
    P.h.api.takeLoot(`search:${i}`, 'grab');
    const box = P.boxes.at(-1);
    assert.ok(box instanceof ActionTextBox, `${P.id}'s search stood its message box`);
    const close = box.onClose; box.onClose = null;
    close?.();
    return win.cur;
  });
}
/** A partymate's press on a searched coffin inside its five hours: the room's find, as it stands, in the window. */
function openFind(P, i, win) { P.window = win; P.as(() => P.h.api.takeLoot(`search:${i}`, 'grab')); return win.cur; }
const find = (P, i = 0) => P.state.searchables[i].items;
const sig = (it) => JSON.stringify(it);
const names = (list) => (list ?? []).map((it) => it.name);
/** THE WINDOW STAND-IN over the deps the host's openInventory hands createInventoryWindow (`loot.items()`, `onClose`). */
function windowOf(P) {
  const w = { cur: null };
  w.open = (deps) => { const win = { done: false, deps }; w.cur = win; deps?.loot?.opened?.(); return win; };
  w.list = () => w.cur?.deps?.loot?.items?.() ?? null;
  w.take = (pick) => {
    const list = w.list(); const it = list?.find(pick);
    assert.ok(it, `${P.id}'s window shows the piece`);
    const plan = planTake(it, { bag: P.entity.items, entity: P.entity, mode: 'remove' });
    assert.ok(plan.ok, `${P.id} may take it`);
    P.as(() => applyTransfer(it, plan, list, P.entity.items, { entity: P.entity, toPlayer: true }));
    return it;
  };
  w.put = (it) => {
    const list = w.list(); const plan = planStore(it, { remote: list });
    assert.ok(plan.ok, `${P.id} may put ${it.name} in`);
    applyTransfer(it, plan, P.entity.items, list, { entity: P.entity, fromLocal: true });
  };
  /** The player's close: the window done and out of the host's slot first, then its own close (the host's onClose
   *  says the close's word). */
  w.close = () => { const win = w.cur; w.cur = null; win.done = true; P.state.activeOverlay = null; win.deps?.loot?.closed?.(); P.as(() => win.deps?.onClose?.()); };
  return w;
}
const crypt = () => {
  setSharedClock(() => sharedClassicMinutes(clock.t));
  const net = actRoom();
  const ann = player(net, 'acct-ann', { host: true });
  const bob = player(net, 'acct-bob');
  const dan = player(net, 'acct-dan');
  return { net, ann, bob, dan, all: [ann, bob, dan] };
};
/** Ann searches coffin 0 and finds; the party hears it; Ann's find window closes again. */
function found() {
  const s = crypt();
  const wa = windowOf(s.ann);
  assert.ok(search(s.ann, 0, wa), 'Ann\'s search found something, and its window opened');
  const theFind = find(s.ann).map((it) => ({ ...it }));
  assert.ok(theFind.length >= 2, `a find of at least two pieces (${JSON.stringify(names(theFind))})`);
  wa.close();
  s.net.flush();
  for (const p of s.all) assert.deepEqual(names(find(p)), names(theFind), `${p.id}: the party's one find (guard)`);
  return { ...s, theFind };
}
const gold = (P) => P.entity.goldPieces | 0;
const holds = (P, it) => (it.group === 'Currency' ? gold(P) : P.entity.items.filter((x) => sig(x) === sig(it)).length);

// ═══ AC9 (a) - A STALE CLOSE NEVER BRINGS BACK A TAKEN PIECE ═══════════════════════════════════════════════════════

test('AC9 (a): two partymates have Ann\'s find open; Ann takes a piece and closes; Bob closes untouched - the piece never comes back in any partymate\'s find, and Ann holds it once', () => {
  const s = found();
  const wa = windowOf(s.ann), wb = windowOf(s.bob);
  assert.ok(openFind(s.bob, 0, wb), 'Bob opens the party\'s find');
  assert.ok(openFind(s.ann, 0, wa), 'Ann opens it again');
  const X = wa.take((it) => it.name === s.theFind[0].name);
  const had = holds(s.ann, X);
  wa.close(); s.net.flush();
  wb.close(); s.net.flush();
  const back = s.all.filter((p) => find(p).some((it) => sig(it) === sig(X))).map((p) => p.id);
  assert.deepEqual(back, [], `AC9 (a): ${X.name}, taken by Ann, is back in the find for ${back.join(', ')} - Bob's untouched close said its stale whole list (publishLoot -> lootRecords) and dungeonContext.js applyLoot landed it over the find (srch: is not a room base container): a dupe`);
  assert.equal(holds(s.ann, X), had, 'and Ann holds it, once');
});

// ═══ AC9 (b) - A STALE CLOSE NEVER ERASES A PUT ═════════════════════════════════════════════════════════════════════

test('AC9 (b): Ann\'s window stands open on the find; Bob opens it, puts a piece in and closes; Ann closes untouched - the piece stays in every partymate\'s find, once, and Bob holds it no more', () => {
  const s = found();
  const t = ITEM_TEMPLATES.find((x) => x.name === 'Mace');
  const Y = { name: t.name, templateIndex: t.index, group: 'Weapons', stackCount: 1, currentCondition: t.hitPoints ?? 50, maxCondition: t.hitPoints ?? 50 };
  s.bob.entity.items.push(Y);
  const wa = windowOf(s.ann), wb = windowOf(s.bob);
  assert.ok(openFind(s.ann, 0, wa), 'Ann opens the find, and leaves it open');
  assert.ok(openFind(s.bob, 0, wb), 'Bob opens it');
  wb.put(Y);
  wb.close(); s.net.flush();
  wa.close(); s.net.flush();
  const lost = s.all.filter((p) => find(p).filter((it) => sig(it) === sig(Y)).length !== 1).map((p) => p.id);
  assert.deepEqual(lost, [], `AC9 (b): the Mace Bob put in is not in the find, once, for ${lost.join(', ')} - Ann's untouched close of a window opened before the put said her stale whole list over the party's: the put is ERASED`);
  assert.equal(s.bob.entity.items.some((it) => sig(it) === sig(Y)), false, 'and Bob holds it no more');
});

// ═══ AC9 (c) - TWO SEARCHES IN ONE BREATH CONVERGE ═════════════════════════════════════════════════════════════════

test('AC9 (c): Ann and Bob search one coffin in one breath (each finds on their own dice); both close their windows - every partymate ends with the same find', () => {
  const s = crypt();
  const wa = windowOf(s.ann), wb = windowOf(s.bob);
  assert.ok(search(s.ann, 1, wa), 'Ann\'s search finds');
  assert.ok(search(s.bob, 1, wb), 'Bob\'s search, in the same breath, finds');
  assert.notDeepEqual(find(s.ann, 1).map(sig), find(s.bob, 1).map(sig), 'two searches, two finds (each player\'s own dice - guard)');
  wa.close(); wb.close();
  s.net.flush();
  const lists = s.all.map((p) => find(p, 1).map(sig));
  assert.deepEqual(lists[1], lists[0], `AC9 (c): Ann and Bob end with different finds - Ann ${JSON.stringify(names(find(s.ann, 1)))}, Bob ${JSON.stringify(names(find(s.bob, 1)))}: each search's whole list landed over the other's (the last writer wins, and the two closes crossed)`);
  assert.deepEqual(lists[2], lists[0], 'and Dan holds that find too');
});

// ═══ LOOT-BULK - Take all through the REAL window ═══════════════════════════════════════════════════════════════════

test('LOOT-BULK (AC9): Ann\'s Take all (the real window\'s bulk walk) under Bob\'s open window - Bob\'s untouched close never brings the find back: every partymate\'s find stays empty, and Ann holds each piece once', () => {
  resetPrefs(); globalThis.location = { search: '?skin=enhanced' };
  withDom((dom) => {
    const s = found();
    const wa = windowOf(s.ann), wb = windowOf(s.bob);
    let view = null, node = null;
    wa.open = (deps) => { node = dom.mk('div'); dom.body.append(node); view = mountEnhancedInventory(node, { entity: s.ann.entity, items: () => s.ann.entity.items, wagonItems: () => (s.ann.entity.wagonItems ??= []), onExit: () => {}, loot: deps.loot }); const win = { done: false, deps }; wa.cur = win; return win; };
    assert.ok(openFind(s.bob, 0, wb), 'Bob opens the find');
    assert.ok(openFind(s.ann, 0, wa), 'Ann opens it, in the real window');
    const b = [...node.querySelectorAll('button')].find((x) => x.textContent === 'Take all');
    assert.ok(b, 'the find\'s window offers Take all');
    s.ann.as(() => b.onclick());
    assert.deepEqual(find(s.ann), [], 'Ann\'s Take all emptied her find (guard)');
    view.unmount();
    wa.close(); s.net.flush();
    wb.close(); s.net.flush();
    const back = s.all.map((p) => [p.id, names(find(p))]).filter(([, l]) => l.length);
    assert.deepEqual(back, [], `LOOT-BULK (AC9): Ann took the whole find, and Bob's untouched close brought it ALL back - ${JSON.stringify(back)}`);
    for (const it of s.theFind) assert.ok(holds(s.ann, it) >= 1, `Ann holds ${it.name}`);
  });
});

// ═══ GUARD ═══════════════════════════════════════════════════════════════════════════════════════════════════════════

test('GRAVE-PARTY (guard - passes today): a stranger\'s search in the same crypt lands nothing on the party - her word is kept, unlanded, and the party\'s find stands as it was', () => {
  const s = found();
  const eve = player(s.net, 'acct-eve', { party: null });
  const we = windowOf(eve);
  assert.ok(search(eve, 0, we), 'Eve, a stranger who never heard Ann\'s word, searches coffin 0 for herself and finds');
  we.close();
  s.net.flush();
  for (const p of s.all) assert.deepEqual(names(find(p)), names(s.theFind), `${p.id}: the party's find, untouched by a stranger's word`);
});
