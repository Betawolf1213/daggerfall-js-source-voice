// OUTDOOR-LOOT, AC8 (2026-10-17): A BUILDING'S CUPBOARD IS ONE LIST FOR EVERYONE IN THE BUILDING. RED PINS, PHASE 1.
// Since WORLD6a a building is a world room and a stranger's cupboard is the room's from its first open
// (world/interior/interiorShared.js): the room's word is the WHOLE list, and the last writer wins -
// `applyInteriorLoot` lands a list over the container (`t.items.length = 0; ... push`) except under the reader's own
// open window (AUDIT WORLD4 C1), `interiorLootRecords` says whole lists, and worldModes.js says one at the open and one
// at the close (`interiorPublishLoot`, `interiorLootOpened`, the frame's `interiorLootSettle`). So, today:
//   - two players with one cupboard open: the later close republishes a stale list - a piece the first took comes back
//     for everyone (a dupe; AUTO-HOLD's `withoutCarried` misses coin), and a piece put in is erased;
//   - two first-opens at once each roll their own stock (WORLD5 rolls at the open) and the last close wins;
//   - LOOT-BULK (#970) makes one stale close resurrect or erase a whole cupboard, and CONTAINER-PEEK (#970) paints the
//     resurrected list on every plaque.
//
// MOUNTED, NOT MATCHED. Each player is the interior host's own doors sliced out of src/scenes/worldModes.js - the
// container arm of the press (tryExit's `key.startsWith('container:')` arm, whatever it calls), the frame's loot settle,
// the bag's mint at the building's mount, the act and memory members the world host calls (applyPlaceActions,
// placeSharedWorld, restorePlaceSharedWorld), the plaque's peek (createInteriorPeek as the host builds it) - over the
// real pure half and the real producers (shopStock.js stockHouseContainer on each player's own dice), every name they
// read that the host imports resolved through the host's OWN import list, so a door that moves into a module the host
// imports is followed. Today's open, close and settle (`interiorPublishLoot`, `interiorLootOpened`,
// `interiorLootSettle`) are sliced where they still stand in the host; DESIGN.md section 4.9 moves them into the pure
// half, and a mount that no longer finds them reads the moved doors through the host's imports. The relay is a queue of
// act frames fanned to everyone else in the building. The window is a stand-in over the hooks the arm opens -
// `loot.items()` is the cupboard's array, a click the loot window's own transfer (itemTransfer.js planTake/planStore +
// applyTransfer, with the arm's `stolenFrom`) - and, for Take all and Stash all, THE REAL ENHANCED WINDOW
// (enhancedInventory.js mountEnhancedInventory in test/invdrag.mjs's DOM, test/ui/lootbulk.test.js's mount), pressed.
//
// Run against the tree at 02706035cf the AC8 pins fail by their assertions; the guards (named so) pass.
import '../modsOff.js';
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as acorn from 'acorn';
import { withDom } from '../invdrag.mjs';
import { movedOutOf } from '../hostText.mjs';
import { mountEnhancedInventory } from '../../src/ui/enhanced/enhancedInventory.js';
import { planTake, planStore, applyTransfer } from '../../src/systems/item/itemTransfer.js';
import { runBulk, bulkVerdict, listAtCap, CONTAINER_LIST_CAP, containerFull } from '../../src/ui/storeBulk.js';
import { resolveHover } from '../../src/systems/worldHover.js';
import { houseContainerHover } from '../../src/systems/worldTooltips.js';
import { foldQuickLoot, quickLootTake, resetQuickLoot } from '../../src/systems/quickLoot.js';
import { setPref, _resetForTests as resetPrefs } from '../../src/systems/uiPrefs.js';
import { isStolen } from '../../src/systems/stolenGoods.js';
import { setSeed } from '../../src/formats/dfRandom.js';
import { ITEM_TEMPLATES } from '../../src/characters/paperdoll/paperdoll.js';
import { BUILDING_TYPES } from '../../src/world/buildingNames.js';

const rd = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const lcg = (seed) => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const clone = (v) => JSON.parse(JSON.stringify(v));
const REAL_RANDOM = Math.random;
afterEach(() => { Math.random = REAL_RANDOM; resetQuickLoot(); });

// ═══ THE HOST'S DOORS, sliced (test/systems/partyloot.test.js's method) ═══════════════════════════════════════════════
const HOST = 'src/scenes/worldModes.js';
const FILES = [HOST, ...movedOutOf(HOST)].map((p) => { const src = rd(p); return { p, src, ast: acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module' }) }; });
function walk(n, fn) {
  if (!n || typeof n.type !== 'string') return;
  fn(n);
  for (const k of Object.keys(n)) { const v = n[k]; if (Array.isArray(v)) v.forEach((x) => walk(x, fn)); else if (v && typeof v.type === 'string') walk(v, fn); }
}
/** Every node of the host (and of the modules moved out of it) the predicate takes, with its file. */
function nodes(pred) { const out = []; for (const f of FILES) walk(f.ast, (n) => { if (pred(n, f.src)) out.push({ f, n }); }); return out; }
const text = ({ f, n }) => f.src.slice(n.start, n.end);
const named = (type, name) => (n) => n.type === type && n.id?.name === name;
const fnOf = (name) => nodes(named('FunctionDeclaration', name)).map(text)[0] ?? '';   // '' where the door has moved out of the host
const declOf = (name) => { const hit = nodes((n) => n.type === 'VariableDeclaration' && n.declarations.some((d) => d.id?.name === name)).map(text)[0]; assert.ok(hit, `${HOST} declares ${name}`); return hit; };
const memberOf = (name) => {
  const hit = nodes((n) => n.type === 'Property' && !n.computed && n.key?.name === name && (n.value.type === 'FunctionExpression' || n.value.type === 'ArrowFunctionExpression'))[0];
  assert.ok(hit, `${HOST} has the member ${name} (the world host's door)`);
  const body = hit.f.src.slice(hit.n.value.start, hit.n.value.end);
  return hit.n.method ? `function ${body}` : body;
};
/** The press's container arm: tryExit's `if (key.startsWith('container:')) { ... }` that opens the cupboard's window. */
const ARM = (() => {
  const hits = nodes((n, src) => n.type === 'IfStatement' && src.slice(n.test.start, n.test.end) === "key.startsWith('container:')" && /interiorInventory\(/.test(src.slice(n.consequent.start, n.consequent.end)));
  assert.equal(hits.length, 1, 'the host has ONE container arm that opens a cupboard\'s window (tryExit)');
  return text({ f: hits[0].f, n: hits[0].n.consequent });
})();
/** The frame's loot settle: `if (mode === 'interior') interiorLoot...(...)` - the close's word, every interior frame. */
const SETTLE = (() => {
  const hits = nodes((n, src) => n.type === 'IfStatement' && src.slice(n.test.start, n.test.end) === "mode === 'interior'" && /^interiorLoot\w*\(/.test(src.slice(n.consequent.start, n.consequent.end)));
  assert.equal(hits.length, 1, 'the host\'s frame runs ONE interior loot settle');
  return text(hits[0]);
})();
/** The building's room, minted at the mount: the block that mints `_intShared` (WORLD6a's bag) for the context. */
const MINT = (() => {
  const hits = nodes((n, src) => n.type === 'BlockStatement' && src.slice(n.start, n.end).includes('_intShared = mintInteriorShared(')).sort((a, b) => (a.n.end - a.n.start) - (b.n.end - b.n.start));
  assert.ok(hits.length, 'the host mints the building\'s bag');
  return text(hits[0]);
})();
const CLIENT = `
  ${fnOf('interiorPublishLoot')}
  ${fnOf('interiorLootOpened')}
  ${fnOf('interiorLootSettle')}
  ${declOf('ownsThisInterior')}
  ${declOf('interiorPeek')}
  ${MINT}
  const members = { applyPlaceActions: ${memberOf('applyPlaceActions')}, placeSharedWorld: ${memberOf('placeSharedWorld')}, restorePlaceSharedWorld: ${memberOf('restorePlaceSharedWorld')} };
  return {
    members,
    press: (key) => { ${ARM} },
    frame: () => { ${SETTLE} },
    peek: (key) => interiorPeek(key),
    bag: () => _intShared,
  };
`;
/** Every name the mounted doors read that the host IMPORTS, bound to the module's own export (the host's import list,
 *  resolved from its own folder) - so the doors run on the real modules, and a callee a fix moves into one is found. */
const IMPORTS = (() => {
  const map = new Map();
  for (const f of FILES) for (const n of f.ast.body) {
    if (n.type !== 'ImportDeclaration') continue;
    const from = new URL(n.source.value, new URL(`../../${f.p}`, import.meta.url)).href;
    for (const s of n.specifiers) if (!map.has(s.local.name)) map.set(s.local.name, [from, s.type === 'ImportSpecifier' ? (s.imported.name ?? s.imported.value) : s.type === 'ImportDefaultSpecifier' ? 'default' : '*']);
  }
  return map;
})();
const BOUND = await (async () => {
  const names = new Set();
  walk(acorn.parse(`(function () {\n${CLIENT}\n})`, { ecmaVersion: 'latest' }), (n) => { if (n.type === 'Identifier') names.add(n.name); });
  const out = {};
  for (const name of names) {
    const hit = IMPORTS.get(name);
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

// ═══ THE BUILDING: a relay of act frames, and the players in it ═════════════════════════════════════════════════════
const TODAY = 2026 * 1000 + 290;   // shopStock.js createStockedDate's shape: year * 1000 + the day of the year
const KEY = 'container:0';
/** A stranger's cupboard as interiorContext builds one (a house's chest model; never stocked: `items` null). */
const cupboard = () => ({ modelIdNum: 41000, stockedDate: 0, items: null });
function relay() {
  const players = [];
  const q = [];
  return {
    players,
    join(p) { players.push(p); },
    send(from, data) { q.push({ from, data: clone(data) }); return true; },
    /** Every act frame said so far, landed on everyone in the building but its author (world.js online.onActions ->
     *  modes.applyPlaceActions). */
    flush() { while (q.length) { const { from, data } = q.shift(); for (const p of players) if (p.id !== from && p.here) p.as(() => p.h.members.applyPlaceActions(from, data)); } },
    frames: q,
  };
}
/** One player in the building: their own copy of the interior (one cupboard), the host's doors over it, their dice. */
function player(net, id, { seed, home = null } = {}) {
  const entity = { name: id, level: 5, gender: 'male', career: { name: 'Spellsword' }, stats: { strength: 50, endurance: 48, luck: 50, agility: 50 }, skills: new Array(40).fill(20), skillUses: new Array(40).fill(0), items: [], goldPieces: 0, activeEffects: [] };
  const said = [];
  const open = new Set();
  const ctx = { containers: [cupboard()], shelves: [], actions: { applyRemote: () => 0, collectSaveData: () => [], onChanged: null } };
  const p = { id, entity, said, ctx, open, here: true, window: null, rand: lcg(seed), dfSeed: seed * 7919 };
  p.as = (fn) => {
    Math.random = p.rand;
    setSeed(p.dfSeed);
    try { return fn(); } finally { p.dfSeed = (p.dfSeed * 1103515245 + 12345) >>> 0; Math.random = REAL_RANDOM; }
  };
  const state = {
    ...BOUND,
    mode: 'interior', interiorCtx: ctx, ctx, _intShared: null, playerEntity: entity,
    interiorBuilding: { buildingKey: 7, buildingType: BUILDING_TYPES.House2, quality: 10 },
    interiorHome: home, interiorSeatHall: null, privateVisitRoom: null, interiorCabin: null, interiorDecor: null,
    questSceneCtx: () => ({ mapId: 1 }), visitLayoutNow: () => null,
    stockedToday: () => TODAY, hallMemberHere: () => false, caravanGuestHere: () => false, openHallChest: () => {},
    houseOwnedAt: () => false,   // the player owns no house here: a stranger's cupboard (worldModes.js "const houseOwnedAt = (b, key) =>")
    host: { onActions: (data) => (p.here ? net.send(id, data) : false), onLootClaimed: () => {}, spawnCityGuards: () => {}, roomHost: () => net.players[0]?.id ?? null, selfId: () => id },
    /** The window the press opens over the cupboard - the stand-in's (below), recorded in the building's window stack. */
    interiorInventory: (deps) => p.window?.open(deps) ?? null,
    interiorWindows: { containsWindow: (w) => open.has(w) },
    interiorOverlay: null, mountInterior: () => {},
    setMidScreenText: (t) => said.push(t), say: (t) => said.push(t), townTalk: null,
  };
  p.state = state;
  p.h = mount(CLIENT, state);
  net.join(p);
  return p;
}
/** The press on the cupboard through the host's own arm, and the player's Yes to the private-property question. */
function pressYes(p, win) {
  p.window = win;
  p.as(() => {
    p.h.press(KEY);
    const box = p.state.interiorOverlay;
    if (box && typeof box.onYes === 'function' && !win.cur) { p.state.interiorOverlay = null; box.onYes(); }
  });
  return win.cur;
}
/** The interior's frame - the settle that says a closed window's word. */
const frame = (p) => p.as(() => p.h.frame());
const items = (p) => p.ctx.containers[0].items;
/** What a piece IS, whatever its holder: its record, less the marks a holder adds (a theft's, a ledger's). */
const sig = (it) => { const { stolen: _s, stolenFrom: _f, ...rest } = it ?? {}; return JSON.stringify(rest); };
const names = (list) => (list ?? []).map((it) => it.name);
/** A piece as the templates mint it (test/ui/lootbulk.test.js's `mk`). */
const tmpl = (name) => ITEM_TEMPLATES.find((t) => t.name === name);
const mk = (name, group = 'Weapons') => { const t = tmpl(name); assert.ok(t, `${name} is a template`); return { name: t.name, templateIndex: t.index, group, stackCount: 1, currentCondition: t.hitPoints ?? 50, maxCondition: t.hitPoints ?? 50 }; };
/** The plaque over the cupboard: the real resolveHover over the host's peek and the house container's own namer. */
const plaque = (p) => resolveHover({ key: KEY, distance: 1, reach: 3 }, { name: (k) => (k.startsWith('container:') ? houseContainerHover('Cupboard', { owned: false }) : null), contents: (k) => p.as(() => p.h.peek(k)) });
const peekNames = (p) => { const f = plaque(p); return f?.kind === 'items' ? f.rows.map((r) => r.name) : []; };
/** How many of a piece a list holds (two pieces of one record are one piece twice). */
const count = (list, it) => (list ?? []).filter((x) => sig(x) === sig(it)).length;

/** THE WINDOW STAND-IN: records the window the arm opens (its deps: `loot.items()` the cupboard's array, the arm's
 *  `stolenFrom`, its `onClose`), and moves pieces through it as the loot window's own click does. Closing it is the
 *  player's close: gone from the window stack first, then the window's own hooks. */
function windowOf(p) {
  const w = { cur: null, opened: 0 };
  w.open = (deps) => { const win = { done: false, deps }; w.cur = win; w.opened++; p.open.add(win); deps?.loot?.opened?.(); return win; };
  w.list = () => w.cur?.deps?.loot?.items?.() ?? null;
  w.take = (pick) => {
    const list = w.list();
    const it = list?.find(pick);
    assert.ok(it, `${p.id}'s window shows the piece to take`);
    const plan = planTake(it, { bag: p.entity.items, entity: p.entity, mode: 'remove' });
    assert.ok(plan.ok, `${p.id} may take it`);
    applyTransfer(it, plan, list, p.entity.items, { entity: p.entity, toPlayer: true, stolenFrom: w.cur.deps.loot.stolenFrom ?? null });
    return it;
  };
  w.put = (it) => {
    const list = w.list();
    const plan = planStore(it, { remote: list });
    assert.ok(plan.ok, `${p.id} may put ${it.name} in`);
    applyTransfer(it, plan, p.entity.items, list, { entity: p.entity, fromLocal: true, returnTo: w.cur.deps.loot.stolenFrom ?? null });
  };
  w.close = () => {
    const win = w.cur;
    w.cur = null;
    win.done = true;
    p.open.delete(win);
    win.deps?.loot?.closed?.();
    p.as(() => win.deps?.onClose?.());
  };
  return w;
}
/** The building: A, the room's first (the seat - the relay's longest socket), B and C; A's first open stocks the cupboard
 *  on A's dice and says it, and everyone has heard it. */
function building(n = 3) {
  const net = relay();
  const ps = ['aaaa-0001', 'bbbb-0002', 'cccc-0003', 'dddd-0004'].slice(0, n).map((id, i) => player(net, id, { seed: 11 + i * 17 }));
  return { net, A: ps[0], B: ps[1], C: ps[2] ?? null, D: ps[3] ?? null, ps };
}
function stocked(n = 3) {
  const s = building(n);
  const wa = windowOf(s.A);
  assert.ok(pressYes(s.A, wa), 'A\'s press opened the cupboard');
  const stock = items(s.A).map((it) => ({ ...it }));
  assert.ok(stock.length >= 2, `A's first open stocked it on A's dice (${JSON.stringify(names(stock))})`);
  wa.close(); frame(s.A); s.net.flush();
  for (const p of s.ps) assert.deepEqual(names(items(p)), names(stock), `${p.id} holds the room's one list (guard)`);
  return { ...s, stock };
}
/** A memory, as the seat publishes it, restored by a player walking in later (world.js worldPublish -> the relay's room
 *  memory -> restorePlaceSharedWorld). */
function joiner(s, id) {
  const memory = s.A.as(() => s.A.h.members.placeSharedWorld());
  const D = player(s.net, id, { seed: 97 });
  D.as(() => D.h.members.restorePlaceSharedWorld(clone(memory)));
  return D;
}

// ═══ AC8 (a) - A STALE CLOSE NEVER BRINGS BACK A TAKEN PIECE ═══════════════════════════════════════════════════════

test('AC8 (a): both players open one cupboard; A takes a piece and closes; B closes untouched - the piece never comes back in anyone\'s list or peek, nor in the memory a later player walks in on, and A holds it once', () => {
  const s = stocked();
  const wa = windowOf(s.A), wb = windowOf(s.B);
  assert.ok(pressYes(s.B, wb), 'B opens the cupboard');
  assert.ok(pressYes(s.A, wa), 'A opens the cupboard');
  const X = wa.take((it) => it.name === s.stock[0].name);
  wa.close(); frame(s.A); s.net.flush();
  wb.close(); frame(s.B); s.net.flush();
  const D = joiner(s, 'dddd-0004');
  const left = count(s.stock, X) - 1;   // what the cupboard holds of it once A's take is the room's
  const back = [s.A, s.B, s.C, D].filter((p) => count(items(p), X) > left || peekNames(p).filter((n) => n === X.name).length > left).map((p) => p.id);
  assert.deepEqual(back, [], `AC8 (a): ${X.name}, taken by A, is back in the cupboard for ${back.join(', ')} - B's untouched close republished its stale whole list (worldModes.js interiorPublishLoot -> interiorLootRecords) and applyInteriorLoot landed it over the room's (last writer wins): a dupe`);
  assert.equal(s.A.entity.items.filter((it) => sig(it) === sig(X)).length, 1, 'and A holds it, once');
});

// ═══ AC8 (b) - A STALE CLOSE NEVER ERASES A PUT ═════════════════════════════════════════════════════════════════════

test('AC8 (b): A\'s window stands open on the cupboard; B opens it, puts a piece in and closes; A closes untouched - the piece stays in every list, once, and B holds it no more', () => {
  const s = stocked();
  const wa = windowOf(s.A), wb = windowOf(s.B);
  assert.ok(pressYes(s.A, wa), 'A opens the cupboard, and leaves it open');
  const Y = mk('Mace');
  s.B.entity.items.push(Y);
  assert.ok(pressYes(s.B, wb), 'B opens the cupboard');
  wb.put(Y);
  wb.close(); frame(s.B); s.net.flush();
  wa.close(); frame(s.A); s.net.flush();
  const D = joiner(s, 'dddd-0004');
  const want = count(s.stock, Y) + 1;
  const lost = [s.A, s.B, s.C, D].filter((p) => count(items(p), Y) !== want).map((p) => p.id);
  assert.deepEqual(lost, [], `AC8 (b): the Mace B put in is not in the cupboard, once, for ${lost.join(', ')} - A's untouched close of a window opened before the put republished A's stale whole list over the room's: the put is ERASED`);
  assert.equal(s.B.entity.items.some((it) => sig(it) === sig(Y)), false, 'and B holds it no more');
});

// ═══ AC8 (c) - TWO FIRST-OPENS CONVERGE ════════════════════════════════════════════════════════════════════════════

test('AC8 (c): A and B first-open the unrolled cupboard in one breath (each stocks it on their own dice, both say Yes); A takes a piece; both close - both end with the same list, and every piece A holds is a piece of that list\'s roll', () => {
  const s = building(3);
  const wa = windowOf(s.A), wb = windowOf(s.B);
  assert.ok(pressYes(s.A, wa), 'A opens - its own roll');
  assert.ok(pressYes(s.B, wb), 'B opens in the same breath - its own roll');
  const rollA = items(s.A).map(sig), rollB = items(s.B).map(sig);
  assert.notDeepEqual(rollA, rollB, 'two rolls, two stocks (the producer on two players\' dice - guard)');
  const P = wa.take(() => true);
  wa.close(); wb.close(); frame(s.A); frame(s.B);
  s.net.flush();
  const lists = [s.A, s.B, s.C].map((p) => (items(p) ?? []).map(sig));
  assert.deepEqual(lists[1], lists[0], `AC8 (c): A and B end with different lists - A sees ${JSON.stringify(names(items(s.A)))}, B sees ${JSON.stringify(names(items(s.B)))}: each first open rolled its own stock and each close's whole list landed over the other's (the last writer wins, and the two closes crossed)`);
  assert.deepEqual(lists[2], lists[0], 'and C sees that list too');
  // the roll everyone ended with is one of the two; A holds P only if P was a piece of it
  const held = s.A.entity.items.some((it) => sig(it) === sig(P));
  const won = [...lists[0], ...(held ? [sig(P)] : [])].sort();
  assert.ok(JSON.stringify(won) === JSON.stringify([...rollA].sort()) || JSON.stringify(won) === JSON.stringify([...rollB].sort()), `AC8 (c): the list everyone ended with${held ? ', with the piece A holds,' : ''} is neither first open's roll - A holds a piece of a roll that was never the room's`);
});

// ═══ LOOT-BULK - Take all and Stash all through the REAL window, still said only at its close ═══════════════════════
/** THE REAL WINDOW: the enhanced pack mounted over the hooks the host's arm opens (test/ui/lootbulk.test.js's mount),
 *  its buttons pressed as a player presses them. */
function realWindowOf(p, dom) {
  const w = windowOf(p);
  w.open = (deps) => {
    const node = dom.mk('div');
    dom.body.append(node);
    const view = mountEnhancedInventory(node, { entity: p.entity, items: () => p.entity.items, wagonItems: () => (p.entity.wagonItems ??= []), onExit: () => {}, loot: deps.loot });
    const win = { done: false, deps, view, node };
    w.cur = win; w.opened++; p.open.add(win); deps?.loot?.opened?.();
    return win;
  };
  w.press = (label) => { const b = [...w.cur.node.querySelectorAll('button')].find((x) => x.textContent === label); assert.ok(b, `the window has ${label}`); b.onclick(); };
  const close = w.close;
  w.close = () => { w.cur.view.unmount(); close(); };
  return w;
}
const bulk = (fn) => { resetPrefs(); globalThis.location = { search: '?skin=enhanced' }; return withDom(fn); };

test('LOOT-BULK (AC8): A\'s Take all (the real window\'s bulk walk) under B\'s open window - B\'s untouched close never brings the cupboard back: every list and peek stays empty of what A took, and A holds each piece once', () => bulk((dom) => {
  const s = stocked();
  const wa = realWindowOf(s.A, dom), wb = windowOf(s.B);
  assert.ok(pressYes(s.B, wb), 'B opens the cupboard');
  assert.ok(pressYes(s.A, wa), 'A opens the cupboard');
  wa.press('Take all');
  assert.deepEqual(items(s.A), [], 'A\'s Take all emptied A\'s list (guard)');
  wa.close(); frame(s.A); s.net.flush();
  wb.close(); frame(s.B); s.net.flush();
  const D = joiner(s, 'dddd-0004');
  const back = [s.A, s.B, s.C, D].map((p) => [p.id, names(items(p)), peekNames(p)]).filter(([, l, pk]) => l.length || pk.length);
  assert.deepEqual(back, [], `LOOT-BULK: A took the whole cupboard, and B's untouched close brought it ALL back - ${JSON.stringify(back)}: one stale close resurrects a whole cupboard`);
  for (const it of s.stock) assert.equal(s.A.entity.items.filter((x) => sig(x) === sig(it)).length, s.stock.filter((x) => sig(x) === sig(it)).length, `A holds ${it.name} as often as the cupboard did`);
}));

/** STASH ALL, through bulkMove's own operations (enhancedInventory.js `function bulkMove(dir)`, its 'stash' arm): the
 *  pack page top to bottom, each row the single click's plan (planStore), the container's cap (listAtCap), the walk
 *  (runBulk, bulkVerdict) and the transfer (applyTransfer, the owner's keeping as `returnTo`). The enhanced window does
 *  not OFFER the button over a stranger's cupboard - a loot session is take-only there (MAC-M2: the pack opens beside a
 *  loot target only for the player's own storage) - so the walk is driven over the window's own lists; the classic
 *  window puts into it two-way, a piece at a time (AC8 (b)). */
function stashAll(p, w) {
  const from = p.entity.items, to = w.list();
  return runBulk([...from], (item) => {
    if (!from.includes(item)) return { verdict: 'skip' };
    if (listAtCap(to, item, CONTAINER_LIST_CAP)) return { verdict: 'stop', refusal: { text: containerFull() } };
    const plan = planStore(item, { remote: to });
    return { verdict: bulkVerdict(item, plan), refusal: plan.refusal, plan };
  }, (item, d) => { applyTransfer(item, { ...d.plan, amount: d.plan.amount }, from, to, { entity: p.entity, fromLocal: true, toPlayer: false, returnTo: w.cur.deps.loot.stolenFrom ?? null }); });
}

test('LOOT-BULK (AC8): B\'s Stash all (bulkMove\'s own walk over the window\'s lists) while A\'s window stands open - A\'s untouched close never erases it: B\'s pieces stay in every list, once, and B holds them no more', () => {
  const s = stocked();
  const stash = [mk('Dagger'), mk('Mace')];
  s.B.entity.items.push(...stash);
  const wa = windowOf(s.A), wb = windowOf(s.B);
  assert.ok(pressYes(s.A, wa), 'A opens the cupboard, and leaves it open');
  assert.ok(pressYes(s.B, wb), 'B opens the cupboard');
  assert.equal(stashAll(s.B, wb).moved, 2, 'B\'s Stash all moved both');
  assert.ok(stash.every((it) => items(s.B).includes(it)), 'B\'s Stash all put both in B\'s list (guard)');
  wb.close(); frame(s.B); s.net.flush();
  wa.close(); frame(s.A); s.net.flush();
  const D = joiner(s, 'dddd-0004');
  const lost = [s.A, s.B, s.C, D].flatMap((p) => stash.filter((it) => count(items(p), it) !== count(s.stock, it) + 1).map((it) => `${p.id}: ${it.name}`));
  assert.deepEqual(lost, [], `LOOT-BULK: B's Stash all is ERASED by A's untouched close of a window opened before it - missing ${JSON.stringify(lost)}`);
  assert.equal(s.B.entity.items.some((it) => stash.some((x) => sig(x) === sig(it))), false, 'and B holds none of it');
});

// ═══ GUARDS - what stands, and must stand through the fix ══════════════════════════════════════════════════════════

test('CONTAINER-PEEK (guard - passes today): a cupboard\'s plaque is never "Empty" over a list that was not rolled - unstocked, due to restock, in someone else\'s home and in a hall it is the name alone; stocked, it lists the room\'s pieces as a glance', () => {
  const s = building(1);
  const name = (p) => plaque(p);
  let f = name(s.A);
  assert.equal(f?.kind, 'name', 'unstocked: the name alone');
  s.A.ctx.containers[0] = { ...cupboard(), items: [mk('Dagger')], stockedDate: TODAY - 1 };
  f = name(s.A);
  assert.equal(f?.kind, 'name', 'due to restock: the name alone');
  s.A.ctx.containers[0].stockedDate = TODAY;
  f = name(s.A);
  assert.equal(f?.kind, 'items', 'stocked today: a list');
  assert.equal(f.preview, true, 'a glance');
  assert.deepEqual(f.rows.map((r) => r.name), ['Dagger']);
  s.A.state.interiorHome = { own: false, owner: 'Someone' };
  assert.equal(name(s.A)?.kind, 'name', 'in someone else\'s home: the name alone');
  s.A.state.interiorHome = null;
  s.A.state.hallMemberHere = () => true;
  assert.equal(name(s.A)?.kind, 'name', 'in a hall: the name alone (the press opens the Stores chest)');
});

test('CONTAINER-PEEK (guard - passes today): a cupboard\'s preview never arms a quick take - folding its frame lights no row, and the quick door takes nothing from it', () => {
  setPref('quickLoot', true);
  try {
    const s = building(1);
    s.A.ctx.containers[0] = { ...cupboard(), items: [mk('Dagger'), mk('Mace')], stockedDate: TODAY };
    const f = plaque(s.A);
    assert.equal(f?.kind, 'items'); assert.equal(f.preview, true);
    resetQuickLoot();
    foldQuickLoot(f);
    assert.equal(quickLootTake(KEY, { items: () => s.A.ctx.containers[0].items }, s.A.entity, () => {}), null, 'the quick door takes nothing off a glance');
    assert.equal(s.A.ctx.containers[0].items.length, 2, 'the cupboard keeps both');
    assert.equal(s.A.entity.items.length, 0);
  } finally { setPref('quickLoot', false); }
});

test('HOME1 (guard - passes today): a home\'s cupboards are its owner\'s alone - the owner\'s close says nothing to the room, and a word about one lands on nobody', () => {
  const net = relay();
  const owner = player(net, 'aaaa-0001', { seed: 3, home: { own: true, owner: 'aaaa' } });
  const guest = player(net, 'bbbb-0002', { seed: 5, home: { own: false, owner: 'aaaa' } });
  assert.equal(owner.as(() => owner.h.bag()).home, true, 'the building\'s bag knows it is a home');
  owner.ctx.containers[0] = { ...cupboard(), items: [mk('Dagger')], stockedDate: 1 };
  const w = windowOf(owner);
  owner.window = w;
  owner.as(() => owner.h.press(KEY));
  assert.ok(w.cur, 'the owner opens their own storage');
  w.take((it) => it.name === 'Dagger');
  w.close(); frame(owner);
  assert.equal(net.frames.length, 0, 'the owner\'s close says nothing to the room');
  guest.ctx.containers[0] = { ...cupboard(), items: [mk('Mace')], stockedDate: 1 };
  net.send('cccc-0003', { k: owner.as(() => owner.h.bag()).locationKey, l: [{ k: KEY, r: [mk('Katana')], d: TODAY }] });
  net.flush();
  assert.deepEqual(names(items(owner)), [], 'nothing landed on the owner\'s cupboard');
  assert.deepEqual(names(items(guest)), ['Mace'], 'nor on the guest\'s');
});

test('STOLEN-GOODS (guard - passes today): Take all off a stranger\'s cupboard, through the host\'s own arm and the real window, marks every piece it takes as a theft, as a single take does', () => bulk((dom) => {
  const s = building(1);
  const w = realWindowOf(s.A, dom);
  assert.ok(pressYes(s.A, w), 'A opens a stranger\'s cupboard (the private-property question answered Yes)');
  assert.ok(w.cur.deps.loot.stolenFrom instanceof Set && w.cur.deps.loot.stolenFrom.size > 0, 'the arm hands the owner\'s keeping');
  const n = items(s.A).length;
  w.press('Take all');
  assert.equal(s.A.entity.items.length, n, 'every piece taken');
  assert.ok(s.A.entity.items.every((it) => isStolen(it)), 'and every one marked a theft');
  w.close(); frame(s.A);
}));
