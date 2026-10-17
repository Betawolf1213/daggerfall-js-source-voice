// OUTDOOR-LOOT (2026-10-17, the field: "I can still click on an "Empty" body and wipe out loot for a party member" -
// outdoors, a monster that appeared later). RED PINS, PHASE 1: what a party member's press on ANOTHER player's foe's body
// must do, pinned through the doors the code has today and nothing the fix has yet to name. A foe outdoors is its
// spawner's (WORLD6b); everyone else stands a PUPPET of it, and its body is the owner's roll taken under the owner's word
// (WORLD6b-iii(c), bible/06-Systems/Online-Arc.md). Reproduced on the real pools (test-harness/outdoor-loot, and two real
// browsers over the real relay), today:
//   1. THE PLAQUE - the puppet's contents door answers null (exteriorFoes.js `const hoverContents = (key) =>`), and the
//      plaque draws "Empty" over a full body (worldHover.js resolveHover).
//   2. THE PRESS - the puppet arm of `function takeLoot(key, say2 = () => {}, openWindow = null)` opens no window and asks
//      for the body; the owner's `function grantCorpse(f, to, k)` hands over as much of the WHOLE pile as one frame
//      carries. The clicker chooses nothing, and the owner's body is emptied.
//   3. THE LATE GRANT - `function applyHit(from, data)` refuses a grant more than TAKE_WINDOW_MS (3000) after the ask
//      (`if (!asked) return false;`) and says nothing back; the owner has already taken the pieces off the body, and puts
//      them back only on the frame's `dropped` fate or a `back` frame. The loot is destroyed.
//   4. A BUILDING runs the same pool (worldModes.js `function makeInteriorFoes(ctx)`, its own lane's net), so all three
//      hold indoors.
//
// MOUNTED, NOT MATCHED. Each player here is a real pool (createExteriorFoes over a crafted MONSTER.BSA - the street's as
// test/net/world6biiic.test.js stands it; a building's as worldModes.js wires it, its functions and members sliced out of
// the host), behind the REAL hit queue (net/hitPend.js makeHitPend - LOOT-DUP's), on a controllable clock, joined by a
// relay stand-in that carries the two lanes a pool speaks today - its foes frames (foesFrame -> applyFoes) and its hits
// (onPeerHit -> applyHit, routed by `to`) - each direction with its own lateness, a player able to leave the cell or drop
// off the socket. The plaque is the real resolveHover over the pool's own namer and contents doors (world.js's ladder);
// the press is the pool's own takeLoot (a building's: worldModes.js openInteriorBodyLoot) handed a WINDOW STAND-IN: it
// records any window the press opens and takes ONE chosen piece from it as a click would - the loot window's own
// transfer (itemTransfer.js planTake + applyTransfer) out of the hooks' `items()`, the array a loot window shows and
// mutates. Nothing here reads a frame's fields: every assertion is about where the pieces ARE once every timeout has
// passed - the owner's body, the owner's pack or a taker's pack, each piece in exactly one of them.
//
// Run against the tree at 02706035cf: the AC1, AC4, AC5 and late/leave AC2 pins fail by their assertions; the guards
// (named so) pass, and must stay green through the fix.
import '../modsOff.js';
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as acorn from 'acorn';
import { createExteriorFoes } from '../../src/scenes/exteriorFoes.js';
import { makeHitPend } from '../../src/net/hitPend.js';
import { FOES_MS, FOES_FULL_MS, FOES_STALE_MS } from '../../src/net/online.js';
import { REALM_LETTER_TEMPLATE } from '../../src/net/realm/realmGoldLaw.js';
import { generateItems } from '../../src/systems/loot/loot.js';
import { resolveHover, composeNamer, composeContents } from '../../src/systems/worldHover.js';
import { planTake, applyTransfer } from '../../src/systems/item/itemTransfer.js';
import { quickLootTake, foldQuickLoot, quickLootWheel, resetQuickLoot } from '../../src/systems/quickLoot.js';
import { setPref } from '../../src/systems/uiPrefs.js';
import { isGoldPieces } from '../../src/systems/inventory.js';
import { lootPile } from '../../src/player/lootStack.js';
import { isActionDoorObject } from '../../src/world/actionSystem.js';
import { movedOutOf } from '../hostText.mjs';

const rd = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
function craftCfg() { const b = new Uint8Array(74); const v = new DataView(b.buffer); b[10] = 0x08; v.setUint16(52, 4, true); const attrs = [40, 50, 50, 85, 50, 50, 90, 55]; for (let i = 0; i < 8; i++) v.setUint16(58 + i * 2, attrs[i], true); return b; }
function craftMonsterBsa(records) { const NAME_FIELD = 14, ENTRY = 18; const dataLen = records.reduce((a, [, b]) => a + b.length, 0); const out = new Uint8Array(4 + dataLen + ENTRY * records.length); const v = new DataView(out.buffer); v.setInt16(0, records.length, true); v.setUint16(2, 0x0100, true); let pos = 4; for (const [, bytes] of records) { out.set(bytes, pos); pos += bytes.length; } for (const [name, bytes] of records) { for (let i = 0; i < name.length; i++) out[pos + i] = name.charCodeAt(i); v.setInt32(pos + NAME_FIELD, bytes.length, true); pos += ENTRY; } return out; }
const bsa = craftMonsterBsa([['ENEMY000.CFG', craftCfg()]]);
const stubTex = { getSize: () => ({ width: 64, height: 100 }), getScale: () => ({ width: 0, height: 0 }), recordCount: 8, getFrameCount: () => 1 };
const settle = () => new Promise((r) => setTimeout(r, 0));
const lcg = (seed) => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const clone = (v) => JSON.parse(JSON.stringify(v));
const playerEntity = () => ({ level: 1, reflexes: 2, health: 50, maxHealth: 50, skills: new Array(40).fill(20), skillUses: new Array(40).fill(0), items: [], goldPieces: 0, activeEffects: [], stats: { strength: 50, agility: 50, luck: 50, speed: 50, endurance: 50 }, armorValues: new Array(7).fill(60) });
const collider = () => ({ raycast: () => Infinity, heightAt: () => 0, raycastHit: () => ({ dist: Infinity, normal: null }), sphereOverlaps: () => false, capsuleCast: () => ({ dist: Infinity, key: null }), sphereCast: () => ({ dist: Infinity, key: null }), move: (feet, mx, my, mz) => { feet[0] += mx; feet[2] += mz; return { grounded: true, hitCeiling: false, groundKey: 'floor' }; } });
const senses = (pe) => ({ candidates: () => [], playerEntity: pe, playerHeight: 1.8, playerCrouching: false, playerInvisible: false, movingLessThanHalfSpeed: true });

/** The body the owner's foe falls with: the loot table's own roll (loot.js generateItems, table F) - a purse of coin, a
 *  blade and a piece of armour, three pieces a plain foe's cap keeps (FOE-CAP). */
const PILE = () => generateItems('F', { level: 10, gender: 'male' }, lcg(2)).map((it) => ({ ...it }));
/** What a piece IS, whatever its count or its holder (a rarity roll at the death renames, never re-templates). */
const pieceOf = (it) => `${it.group}:${it.templateIndex}`;
const nameOf = (body, piece) => body.find((it) => pieceOf(it) === piece)?.name ?? piece;
const GREAVES = 'Armor:104', SHORTSWORD = 'Weapons:116', GOLD = 'Currency:276';

// ═══ THE CELL: a clock, a relay stand-in and the players ═══════════════════════════════════════════════════════════
const clock = { t: 1_000_000 };
/** THE RELAY, as far as a pool's two lanes go: a hit is routed to its `to` (the relay reads no further - WORLD6b-iii(c)),
 *  each direction `from>to` as late as the test says; a foes frame goes to everyone else in the cell. The sender's door
 *  is the session's `sendHit`: false while its wire is shut, and false for a `to` not in its roster
 *  (net/online.js `sendHit`: "the owner must be a peer I KNOW"), so the frame waits in the sender's hit queue. A player
 *  away from the cell or off its socket sends nothing and hears nothing - a frame already on the wire to one is lost, as
 *  the relay loses a frame with no target. */
function relay() {
  const players = new Map();
  const q = [];
  const late = new Map();
  const shut = new Set();   // a sender whose wire refuses for now (the rate gate, a socket mid-reconnect): its hit queue holds
  const events = [];   // [at, fn] - what happens to the cell at a time (a socket back)
  return {
    players, late, shut,
    at(t, fn) { events.push([t, fn]); },
    due() { for (let i = 0; i < events.length;) { if (events[i][0] <= clock.t) events.splice(i, 1)[0][1](); else i++; } },
    join(p) { players.set(p.id, p); },
    here: (id) => players.get(id)?.here === true,
    /** Whether `to` is in `from`'s roster: both in the cell (a player across a seam is reported through its halo). */
    reaches(from, to) { return this.here(to) && players.get(to).id !== from; },
    peersOf(id) { return [...players.values()].filter((p) => p.id !== id && p.here).map((p) => ({ id: p.id, feet: [...p.feet], height: 1.8 })); },
    sendHit(from, data) {
      if (!this.here(from) || shut.has(from) || !data || typeof data.to !== 'string' || !this.reaches(from, data.to)) return false;
      q.push({ from, to: data.to, data: clone(data), at: clock.t + (late.get(`${from}>${data.to}`) ?? 0) });
      return true;
    },
    sendFoes(from, frame) { for (const p of players.values()) if (p.id !== from && p.here) p.foes(from, clone(frame)); },
    deliver() {
      for (let i = 0; i < q.length;) {
        const e = q[i];
        if (e.at > clock.t) { i++; continue; }
        q.splice(i, 1);
        if (this.here(e.to)) players.get(e.to).hit(e.from, e.data);
      }
    },
  };
}
/** One player's frame, as world.js runs it: the pool's update, the hit queue flushed, the foes stream (FOES_MS, every
 *  one FOES_FULL_MS apart - world.js foesStream / ownStream), and the owners gone from the cell pruned (an answer only
 *  while the socket is open - AUDIT WORLD6b-iii(b) C3/B5: no answer is not "nobody"). */
function tickPlayer(net, p, ms) {
  p.pool().update(ms / 1000, p.feet, [p.feet[0], 1.6, p.feet[2]], senses(p.entity));
  p.pend.flush(clock.t);
  if (!p.here) return;
  if (clock.t - p.sentAt >= FOES_MS) {
    p.sentAt = clock.t;
    const full = clock.t - p.fullAt >= FOES_FULL_MS;
    const frame = p.frame(full);
    if (frame) { if (full) p.fullAt = clock.t; net.sendFoes(p.id, frame); }
  }
  p.prune(new Set([...net.players.values()].filter((o) => o !== p && o.here).map((o) => o.id)));
}
/** Time passing for the whole cell, 50 ms a frame; every window still standing is offered its click again each frame
 *  (a window the press opens empty and fills when the owner's word comes is clicked when the piece is in it). */
function run(net, ms, windows = []) {
  const end = clock.t + ms;
  while (clock.t < end) {
    clock.t += 50;
    net.due();
    for (const p of net.players.values()) tickPlayer(net, p, 50);
    net.deliver();
    for (const w of windows) w.click();
  }
}

/** A street player: the encounter pool world.js mounts outdoors, its net as world.js's `exteriorFoes.setNet` builds it
 *  (the hit through the pending queue with its own fate - LOOT-DUP), the press the pool's own door. */
function streetPlayer(net, id, feet) {
  const entity = playerEntity(), said = [];
  const pool = createExteriorFoes({
    renderer: { createBillboardBatch: () => ({}), destroyBillboardBatch: () => {}, textures: new Map() }, collider: collider(),
    fetchBytes: async (n) => { if (n === 'MONSTER.BSA') return bsa; throw new Error(`no ${n}`); }, getTexture: async () => stubTex, uploadRecordFrame: () => {},
    currentMinute: () => 0, currentPixelKey: () => '3,12', playerEntity: entity, audio: null, onPlayerHurt: () => {}, rolls: () => 0.5, rand: () => 0.5, spellsByIndex: () => null, say: (l) => said.push(l),
  });
  const p = { id, entity, said, feet, here: true, room: 'world:3,12', halo: new Set(), sentAt: -Infinity, fullAt: -Infinity, pool: () => pool };
  p.pend = makeHitPend({ send: (h) => net.sendHit(id, h), room: () => p.room, now: () => clock.t, warn: () => {} });
  pool.setNet({ room: () => p.room, inRoom: (k) => p.halo.has(k), selfId: () => id, peers: () => net.peersOf(id), now: () => clock.t, staleMs: FOES_STALE_MS, onPeerHit: (h, fate) => p.pend.send(h, fate), toWire: (f) => [f[0], f[1], f[2]], toScene: (q) => [q[0], q[1], q[2]] });
  Object.assign(p, {
    hit: (from, data) => pool.applyHit(from, data),   // world.js online.onHit, a cell's arm
    foes: (from, data) => pool.applyFoes(from, data),
    frame: (full) => pool.foesFrame(full),
    prune: (ids) => pool.pruneOwners(ids, clock.t),
    clear: () => pool.clearPuppets(),   // world.js: a room change that is no seam
    /** The press on a body: the pool's own door, `takeLoot(key, say, openWindow)`, the window the stand-in's. */
    press: (key, win) => pool.takeLoot(key, (l) => said.push(l), (hooks) => win.open(hooks)),
    names: (key) => pool.hoverName?.(key) ?? null,
    holds: (key) => pool.hoverContents?.(key) ?? null,
  });
  net.join(p);
  return p;
}

// ═══ A BUILDING: the interior pool as worldModes.js wires it, sliced out of the host ════════════════════════════════
/** The host and every module moved out of it (HOST-SPLIT), each parsed once. */
const WM = ['src/scenes/worldModes.js', ...movedOutOf('src/scenes/worldModes.js')].map((p) => { const src = rd(p); return { p, src, ast: acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module' }) }; });
function findIn(ast, pred) {
  let hit = null;
  (function walk(n) {
    if (!n || typeof n.type !== 'string' || hit) return;
    if (pred(n)) { hit = n; return; }
    for (const k of Object.keys(n)) { const v = n[k]; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === 'string') walk(v); }
  })(ast);
  return hit;
}
function wmNode(pred, what) {
  for (const f of WM) { const n = findIn(f.ast, pred); if (n) return { f, n }; }
  return assert.fail(`worldModes.js (or a module moved out of it) carries ${what} - the building's body doors this file mounts`);
}
const wmFn = (name) => { const { f, n } = wmNode((x) => x.type === 'FunctionDeclaration' && x.id?.name === name, `function ${name}`); return f.src.slice(n.start, n.end); };
const wmDecl = (name) => { const { f, n } = wmNode((x) => x.type === 'VariableDeclaration' && x.declarations.some((d) => d.id?.name === name), `the declaration of ${name}`); return f.src.slice(n.start, n.end); };
const wmMember = (name) => {
  const { f, n } = wmNode((x) => x.type === 'Property' && !x.computed && x.key?.name === name && (x.value.type === 'FunctionExpression' || x.value.type === 'ArrowFunctionExpression'), `the member ${name}`);
  const body = f.src.slice(n.value.start, n.value.end);
  return n.method ? `function ${body}` : body;
};
const scoped = (state) => new Proxy(state, {
  has: (t, k) => k !== '__s',
  get: (t, k) => (k === Symbol.unscopables ? undefined : (k in t ? t[k] : globalThis[k])),
  set: (t, k, v) => { t[k] = v; return true; },
});
const mount = (body, state) => new Function('__s', `with (__s) { ${body} }`)(scoped(state));
/** The building's body doors, in the host's own words: the pool's mint (`makeInteriorFoes`), its net (`ensureInteriorNet`
 *  over world.js's `interiorFoesNet` - the own lane, OWN1, a hit marked `own`), the press (`openInteriorBodyLoot`, whose
 *  window is the stand-in's), and the members world.js calls on the own lane. */
const BUILDING = () => `
  ${wmFn('makeInteriorFoes')}
  ${wmDecl('_intNetOn')}
  ${wmFn('ensureInteriorNet')}
  ${wmFn('openInteriorBodyLoot')}
  const members = { ownFoesFrame: ${wmMember('ownFoesFrame')}, applyOwnFoes: ${wmMember('applyOwnFoes')}, applyOwnHit: ${wmMember('applyOwnHit')}, pruneOwnOwners: ${wmMember('pruneOwnOwners')}, clearOwnPuppets: ${wmMember('clearOwnPuppets')} };
  interiorFoes = makeInteriorFoes(interiorCtx);   // the building's mount: worldModes.js "interiorFoes = makeInteriorFoes(ctx);"
  _intNetOn = false; ensureInteriorNet();
  return { members, press: openInteriorBodyLoot, pool: () => interiorFoes };
`;
const ROOM_BUILDING = 'interior:m1.7';   // worldModes.js interiorLocationKey's spelling (map 1, building 7)
function buildingPlayer(net, id, feet) {
  const entity = playerEntity(), said = [];
  const p = { id, entity, said, feet, here: true, room: ROOM_BUILDING, sentAt: -Infinity, fullAt: -Infinity, window: null };
  p.pend = makeHitPend({ send: (h) => net.sendHit(id, h), room: () => p.room, now: () => clock.t, warn: () => {} });
  const state = {
    mode: 'interior', interiorFoes: null, interiorGuards: null, dungeonCtx: null,
    interiorCtx: { collider: collider(), actions: { objects: new Map() } }, interiorNav: null,
    renderer: { createBillboardBatch: () => ({}), destroyBillboardBatch: () => {}, textures: new Map() },
    fetchBytes: async (n) => { if (n === 'MONSTER.BSA') return bsa; throw new Error(`no ${n}`); }, getTexture: async () => stubTex, uploadRecordFrame: () => {},
    playerEntity: entity, audio: null, isActionDoorObject, interiorHitEffects: null, interiorDropped: { dropPile: () => {} }, interiorWeapon: { playerWeapon: { sheathed: false } },
    interiorTicker: { ownMinutes: 0, sinks: null }, spellsByIndex: () => null, magic: null, player: { pos: feet, height: 1.8 },
    say: (l) => said.push(l), quickLootTake, showPickups: null, questBridge: null, lootPile, mountInterior: () => {},
    interiorInventory: (deps) => (p.window?.open(deps?.loot, deps) ? { done: false } : null),   // the window the press opens - the stand-in's
    host: {
      // world.js `interiorFoesNet`: the building's own lane - my foes out, a peer's in, a blow (or a take) on a peer's foe
      // to its owner marked `own` (OWN1)
      interiorFoesNet: () => ({ room: () => p.room, inRoom: () => false, selfId: () => id, peers: () => net.peersOf(id), now: () => clock.t, staleMs: FOES_STALE_MS, onPeerHit: (hit, fate) => p.pend.send({ ...hit, own: 1 }, fate), toWire: (f) => [f[0], f[1], f[2]], toScene: (q) => [q[0], q[1], q[2]] }),
      foesQuestShare: () => null,
    },
    createExteriorFoes,
  };
  const h = mount(BUILDING(), state);
  Object.assign(p, {
    pool: h.pool,
    hit: (from, data) => (data?.own === 1 ? h.members.applyOwnHit(from, data) : false),   // world.js online.onHit: `data?.own === 1` -> modes.applyOwnHit
    foes: (from, data) => h.members.applyOwnFoes(from, data),   // world.js online.onOwnFoes
    frame: (full) => h.members.ownFoesFrame(full),   // world.js ownStream
    prune: (ids) => h.members.pruneOwnOwners(ids, clock.t, FOES_STALE_MS),
    clear: () => h.members.clearOwnPuppets(),
    /** The press on a body: the host's own door, openInteriorBodyLoot, whose window is the stand-in's. */
    press: (key, win) => { p.window = win; return h.press(key); },
    names: (key) => h.pool()?.hoverName?.(key) ?? null,   // worldModes.js: "(key) => interiorFoes?.hoverName?.(key) ?? null"
    holds: (key) => h.pool()?.hoverContents?.(key) ?? null,   // worldModes.js: "(key) => interiorFoes?.hoverContents?.(key) ?? null"
  });
  net.join(p);
  return p;
}
/** The building pool rolls on Math.random (its mint hands no dice): seeded for the length of each test that stands a
 *  scene, so a run is one run. */
const REAL_RANDOM = Math.random;
afterEach(() => { Math.random = REAL_RANDOM; });

// ═══ THE SCENE: Bob's foe falls, his party members stand over its body ═════════════════════════════════════════════
/** Bob (the owner) and the takers: Bob's foe stands - the takers see it alive first, as a party member in the field
 *  does - and falls with the PILE; every taker's puppet of it says so. Each taker stands at the body. */
async function scene(where, takers = ['mac-0001'], { extra = [] } = {}) {
  const net = relay();
  const mk = where === 'building' ? buildingPlayer : streetPlayer;
  const bob = mk(net, 'bob-0002', [30, 0, 30]);
  const them = takers.map((id, i) => mk(net, id, [11 + i, 0, 11]));
  Math.random = lcg(7);
  {
    const rat = await bob.pool().spawnFoe(0, [12, 0, 12], { feetGiven: true });
    assert.ok(rat, 'the owner\'s foe stands');
    run(net, 400);
    for (let i = 0; i < 40 && !them.every((t) => t.pool().foes.some((x) => x.puppet === bob.id)); i++) { await settle(); run(net, 50); }
    rat.entity.items = [...PILE(), ...extra.map((it) => ({ ...it }))];
    if (extra.length) delete rat.entity.lootCap;   // FOE-CAP: a body carrying more than a plain foe's three (a revenant's, a boss's)
    bob.pool().damageFoe(rat, 9999, [12, 0, 11]);
    for (let i = 0; i < 40 && !them.every((t) => t.pool().foes.some((x) => x.puppet === bob.id && x.corpse && (x._pup?.o | 0) > 0)); i++) { await settle(); run(net, 200); }
    run(net, FOES_FULL_MS + 400);
    const at = rat.corpseMarker?.pos ?? rat.ai.feet;
    them.forEach((t, i) => { t.feet[0] = at[0] + 0.5 * i; t.feet[1] = at[1]; t.feet[2] = at[2] + 0.5; });   // at the body, inside its reach
    const keyOf = (t) => { const pup = t.pool().foes.find((x) => x.puppet === bob.id && x.corpse); return pup ? `foeCorpse:${pup.uid}` : null; };
    for (const t of them) assert.ok(keyOf(t), `${t.id} stands Bob's foe's body`);
    const body = rat.entity.items.map((it) => ({ ...it }));
    assert.equal(body.length, 3 + extra.length, 'the body holds the pieces it fell with');
    const before = new Map([bob, ...them].map((p) => [p.id, { items: p.entity.items.map(pieceOf), gold: p.entity.goldPieces | 0 }]));
    return { net, bob, them, mac: them[0], eve: them[1] ?? null, rat, body, keyOf, before };
  }
}
/** THE WINDOW STAND-IN (above): records what the press opens, takes ONE piece `choose` picks from it - once - and shuts
 *  it on the next frame, as a player does. The window's own doors are called as a real one calls them: the loot hooks'
 *  `opened()` once it stands and `closed()` once it shuts (ui/inventoryDoor.js createInventoryWindow and
 *  systems/inventorySession.js closeSession - DESIGN.md 3.6), and its deps' `onClose`. A window the press opens before
 *  the piece is in it waits for it, open. */
function windowFor(p, choose) {
  const w = { opened: [], took: [] };
  w.open = (hooks, deps = null) => { w.opened.push({ hooks, deps, took: false, shut: false }); hooks?.opened?.(); w.click(); return true; };
  w.click = () => {
    for (const o of w.opened) {
      if (o.took) { if (!o.shut) { o.shut = true; o.hooks?.closed?.(); o.deps?.onClose?.(); } continue; }
      const list = o.hooks?.items?.();
      if (!Array.isArray(list)) continue;
      const it = list.find((x) => x && choose(x));
      if (!it) continue;
      const plan = planTake(it, { bag: (p.entity.items ??= []), entity: p.entity, mode: 'remove' });
      if (!plan.ok) continue;
      applyTransfer(it, plan, list, p.entity.items, { entity: p.entity, toPlayer: true });
      o.took = true;
      w.took.push(pieceOf(it));
    }
  };
  return w;
}
const choosing = (piece) => (it) => pieceOf(it) === piece;

/** WHERE EVERY PIECE IS: on the owner's body, in the owner's pack, or in a taker's pack (what each holds past what it
 *  held at the press) - a piece's count, or a purse's coin. Answers each place's count per piece of the body. */
function census(s) {
  const places = [['the owner\'s body', s.rat.entity.items ?? [], 0, null], ...[s.bob, ...s.them].map((p) => [`${p.id === s.bob.id ? 'the owner' : p.id}'s pack`, p.entity.items ?? [], (p.entity.goldPieces | 0) - s.before.get(p.id).gold, s.before.get(p.id).items])];
  const out = new Map(s.body.map((it) => [pieceOf(it), []]));
  for (const [where, items, coin, had] of places) {
    const counts = new Map();
    for (const it of items) { if (!it) continue; const k = pieceOf(it); counts.set(k, (counts.get(k) ?? 0) + (it.stackCount ?? 1)); }
    if (had) for (const k of had) counts.set(k, (counts.get(k) ?? 0) - 1);
    if (coin) counts.set(GOLD, (counts.get(GOLD) ?? 0) + coin);
    for (const [k, n] of counts) if (out.has(k) && n > 0) out.get(k).push([where, n]);
  }
  return out;
}
/** The pieces that are not in exactly one place - destroyed (in none, or fewer than the body held) or doubled. */
function misplaced(s) {
  const out = [];
  for (const [k, at] of census(s)) {
    const want = s.body.filter((it) => pieceOf(it) === k).reduce((n, it) => n + (it.stackCount ?? 1), 0);
    const have = at.reduce((n, [, c]) => n + c, 0);
    const name = nameOf(s.body, k);
    if (have < want) out.push(`${name}: ${want - have} of ${want} DESTROYED - in no place (${at.length ? at.map(([w, c]) => `${w} ${c}`).join(', ') : 'nowhere'})`);
    else if (have > want || at.length > 1) out.push(`${name}: ${have > want ? `${have} where the body held ${want} - DUPED` : 'split'} (${at.map(([w, c]) => `${w} ${c}`).join(', ')})`);
  }
  return out;
}
/** The plaque a player sees over a body: the real resolveHover over the pool's own doors, as the hosts' ladders read them. */
const plaque = (p, key) => resolveHover({ key, distance: 1, reach: 3.75 }, { name: composeNamer([(k) => p.names(k)]), contents: composeContents([(k) => p.holds(k)]) });
const saysEmpty = (f) => f?.kind === 'items' && f.empty === true;
const SETTLED_MS = 120_000;   // past every timeout the street has (TAKE_WINDOW_MS, GRANT_BACK_MS, FOES_STALE_MS) and any a fix adds, many times over

// ═══ AC1 - THE PLAQUE ═════════════════════════════════════════════════════════════════════════════════════════════════

test('AC1: a party member\'s plaque over another player\'s foe\'s body never says "Empty" while the owner\'s word says it holds something (record o > 0) - right after the body falls, and after the owner took part of it', async () => {
  const s = await scene('street');
  const key = s.keyOf(s.mac);
  const pup = s.mac.pool().foes.find((x) => x.puppet === s.bob.id && x.corpse);
  assert.equal(pup._pup.o, 3, 'the owner\'s word: the body holds three');
  assert.ok(s.mac.pool().lootTargets().some((t) => t.key === key), 'the body is a loot target, so the plaque stands over it (guard)');
  const f = plaque(s.mac, key);
  assert.ok(f?.title, 'the plaque names the body');
  assert.equal(saysEmpty(f), false, 'AC1: Mac\'s plaque says "Empty" over Bob\'s body while Bob\'s word says it holds 3 - the puppet\'s contents door answers null (exteriorFoes.js hoverContents) and the plaque reads null as empty (worldHover.js resolveHover)');
  // the owner takes the Greaves through his own window; his word falls to two, and Mac's plaque still says it holds something
  const w = windowFor(s.bob, choosing(GREAVES));
  s.bob.press(`foeCorpse:${s.rat.uid}`, w);
  run(s.net, FOES_FULL_MS + 400, [w]);
  assert.equal(pup._pup.o, 2, 'the owner\'s word: two left (guard)');
  assert.equal(saysEmpty(plaque(s.mac, key)), false, 'AC1: after the owner\'s own take his word says 2 and Mac\'s plaque says "Empty"');
});

// ═══ AC4 - NO BLIND GRAB ══════════════════════════════════════════════════════════════════════════════════════════════

test('AC4: no blind grab - a party member\'s press on another player\'s foe\'s body opens a window on it, and the ONE piece taken from that window (the Greaves) is the only piece that leaves the owner\'s body; the coin and the blade stay on it', async () => {
  const s = await scene('street');
  const w = windowFor(s.mac, choosing(GREAVES));
  s.mac.press(s.keyOf(s.mac), w);
  run(s.net, 10_000, [w]);
  assert.deepEqual(misplaced(s), [], 'AC2 holds under it: every piece in exactly one place');
  const onBody = s.rat.entity.items.map(pieceOf).sort();
  const took = census(s);
  assert.ok(w.opened.length >= 1, `AC4: the press opened NO window - exteriorFoes.js takeLoot's puppet arm asks the owner for the body (take: 1) and grantCorpse hands over the whole pile; the owner's body went from ${s.body.length} pieces to ${onBody.length}, and ${s.mac.id} holds ${[...took].filter(([, at]) => at.some(([where]) => where.startsWith(s.mac.id))).map(([k]) => nameOf(s.body, k)).join(', ') || 'nothing'}`);
  assert.deepEqual(onBody, [GOLD, SHORTSWORD].sort(), `AC4: only the chosen piece may leave the owner's body - it holds ${JSON.stringify(s.rat.entity.items.map((it) => it.name))}`);
  assert.deepEqual(took.get(GREAVES), [[`${s.mac.id}'s pack`, 1]], 'and the chosen piece is in the taker\'s pack, once');
});

// ═══ AC2 - NOTHING IS DESTROYED ═══════════════════════════════════════════════════════════════════════════════════════
/** Mac presses Bob's body through the window, choosing the Greaves; the owner's answer (`bob>mac`) or the ask
 *  (`mac>bob`) runs as late as the test says; once every timeout has passed each piece is in exactly one place. */
async function lateCase(where, { answerLate = 0, askLate = 0 } = {}) {
  const s = await scene(where);
  s.net.late.set(`${s.bob.id}>${s.mac.id}`, answerLate);
  s.net.late.set(`${s.mac.id}>${s.bob.id}`, askLate);
  const w = windowFor(s.mac, choosing(GREAVES));
  s.mac.press(s.keyOf(s.mac), w);
  run(s.net, answerLate + askLate + SETTLED_MS, [w]);
  return s;
}

test('AC2 (guard - passes today): the owner\'s answer on time - once every timeout has passed, each piece of the body is in exactly one place (the owner\'s body, the owner\'s pack or the taker\'s pack)', async () => {
  const s = await lateCase('street');
  assert.deepEqual(misplaced(s), [], 'every piece in exactly one place');
});

test('AC2: nothing is destroyed when the owner\'s answer is 3.5 s late (the e2e\'s arm: a grant held 3.5 s destroyed a Wakazashi)', async () => {
  const s = await lateCase('street', { answerLate: 3500 });
  assert.deepEqual(misplaced(s), [], 'AC2: an answer 3.5 s late - the taker refuses a grant past TAKE_WINDOW_MS and says nothing back (exteriorFoes.js applyHit `if (!asked) return false;`), and the owner already took the pieces off the body: destroyed');
});

test('AC2: nothing is destroyed when the owner\'s answer is 10 s late', async () => {
  const s = await lateCase('street', { answerLate: 10_000 });
  assert.deepEqual(misplaced(s), [], 'AC2: an answer 10 s late - refused past TAKE_WINDOW_MS, never returned (GRANT_BACK_MS passed with no `back`): destroyed');
});

test('AC2: nothing is destroyed when the owner\'s answer is 30 s late', async () => {
  const s = await lateCase('street', { answerLate: 30_000 });
  assert.deepEqual(misplaced(s), [], 'AC2: an answer 30 s late - refused past TAKE_WINDOW_MS, never returned: destroyed');
});

test('AC2: nothing is destroyed when the taker\'s ask reaches the owner 10 s late (the owner answers an ask the taker has stopped waiting for)', async () => {
  const s = await lateCase('street', { askLate: 10_000 });
  assert.deepEqual(misplaced(s), [], 'AC2: an ask 10 s late - the owner grants on arrival, the taker\'s ask latch (TAKE_WINDOW_MS from the send) has lapsed and refuses the grant: destroyed');
});

/** Mac presses; the owner's answer is 1.5 s on the wire; `what` happens 300 ms after the press - mid-claim. */
async function midClaim(where, what) {
  const s = await scene(where);
  s.net.late.set(`${s.bob.id}>${s.mac.id}`, 1500);
  const w = windowFor(s.mac, choosing(GREAVES));
  s.mac.press(s.keyOf(s.mac), w);
  run(s.net, 300, [w]);
  what(s);
  run(s.net, SETTLED_MS, [w]);
  return s;
}
/** A player walks out of the cell: another room (its hit queue's room moves, so what it held is ended), its puppets taken
 *  down (world.js's room change), and nothing more of the old cell's reaches it - nor its frames the cell. */
const leave = (p) => { p.here = false; p.room = 'world:9,9'; p.clear(); };
/** A player crosses into the next cell, holding the old one as a halo (WORLD6b-iii(b)): its room moves (its hit queue
 *  ends what it held), its puppets of the old cell are swept, and the old cell's frames still reach it. */
const cross = (p) => { p.room = 'world:4,12'; p.halo.add('world:3,12'); p.clear(); };
/** A player's socket drops for `ms` and comes back to the same cell: nothing sent or heard meanwhile. */
const drop = (net, p, ms) => { p.here = false; net.at(clock.t + ms, () => { p.here = true; }); };

test('AC2: nothing is destroyed when the TAKER crosses into the next cell mid-claim (the owner\'s answer in flight, his cell still held as a halo, the taker\'s puppets of it swept) - the answer lands, and each piece is in exactly one place', async () => {
  const s = await midClaim('street', (x) => cross(x.mac));
  assert.deepEqual(misplaced(s), [], 'AC2: the taker crossed a seam with the owner\'s grant in flight - the grant arrives through the halo, but the grant arm needs the puppet (`_pupIndex.get(pupKey(from, data.i | 0))`), which the crossing swept: refused, and the owner already took the pieces off the body: destroyed');
});

test('AC2 (guard - passes today): the TAKER leaves the cell before the owner\'s answer can leave him (the owner\'s wire held) - the answer waits in the owner\'s queue, ages out, and the pieces are back on the owner\'s body', async () => {
  const s = await scene('street');
  s.net.shut.add(s.bob.id);
  const w = windowFor(s.mac, choosing(GREAVES));
  s.mac.press(s.keyOf(s.mac), w);
  run(s.net, 200, [w]);
  leave(s.mac);
  s.net.shut.delete(s.bob.id);
  run(s.net, SETTLED_MS, [w]);
  assert.deepEqual(misplaced(s), [], 'every piece in exactly one place');
  assert.deepEqual(s.rat.entity.items.map(pieceOf).sort(), s.body.map(pieceOf).sort(), 'the owner\'s body whole again');
});

test('AC2/AC3 (guard - passes today; R1): the TAKER vanishes from the relay the moment the owner\'s answer is on the wire - whatever that costs, never a dupe (whether it may be a loss is DESIGN.md section 11\'s question to the user)', async () => {
  const s = await midClaim('street', (x) => leave(x.mac));
  assert.deepEqual(misplaced(s).filter((m) => /DUPED|split/.test(m)), [], 'no piece in two places');
});

test('AC2: nothing is destroyed when the TAKER\'s socket drops mid-claim and comes back - once every timeout has passed, each piece is in exactly one place', async () => {
  const s = await midClaim('street', (x) => drop(x.net, x.mac, 8000));
  assert.deepEqual(misplaced(s), [], 'AC2: the taker dropped off the socket mid-claim - the grant is lost on the wire and the owner never puts the pieces back: destroyed');
});

test('AC2: nothing is destroyed when the OWNER leaves the cell mid-claim (his answer in flight) - once every timeout has passed, each piece is in exactly one place', async () => {
  const s = await midClaim('street', (x) => leave(x.bob));
  assert.deepEqual(misplaced(s), [], 'AC2: the owner left with his grant in flight - the taker prunes the owner\'s puppets, refuses the grant for a body it no longer stands, and the pieces are on no body and in no pack: destroyed');
});

test('AC2 (guard - passes today): the OWNER leaves the cell before the ask reaches him - his body keeps every piece, and the taker holds none', async () => {
  const s = await scene('street');
  s.net.late.set(`${s.mac.id}>${s.bob.id}`, 1000);
  const w = windowFor(s.mac, choosing(GREAVES));
  s.mac.press(s.keyOf(s.mac), w);
  run(s.net, 100, [w]);
  leave(s.bob);
  run(s.net, SETTLED_MS, [w]);
  assert.deepEqual(misplaced(s), [], 'every piece in exactly one place');
  assert.deepEqual(s.rat.entity.items.map(pieceOf).sort(), s.body.map(pieceOf).sort(), 'the owner\'s body whole');
});

// ═══ AC3 - NO DUPES, AND THE PROTECTIONS STAND ════════════════════════════════════════════════════════════════════════

test('AC3 (guard - passes today): two party members press one body in one breath, each for the same piece - no piece lands twice; each piece is in exactly one place', async () => {
  const s = await scene('street', ['mac-0001', 'eve-0003']);
  const wm = windowFor(s.mac, choosing(GREAVES)), we = windowFor(s.eve, choosing(GREAVES));
  s.mac.press(s.keyOf(s.mac), wm);
  s.eve.press(s.keyOf(s.eve), we);
  run(s.net, SETTLED_MS, [wm, we]);
  assert.deepEqual(misplaced(s), [], 'AC3: one body, two presses in one breath - every piece in exactly one place');
});

test('AC3 (guard - passes today): the same breath with the owner\'s wire shut while both asks arrive (LOOT-DUP\'s state: the answers held in the real hit queue, then sent) - no piece lands twice', async () => {
  const s = await scene('street', ['mac-0001', 'eve-0003']);
  s.net.shut.add(s.bob.id);
  const wm = windowFor(s.mac, choosing(GREAVES)), we = windowFor(s.eve, choosing(SHORTSWORD));
  s.mac.press(s.keyOf(s.mac), wm);
  s.eve.press(s.keyOf(s.eve), we);
  run(s.net, 400, [wm, we]);
  s.net.shut.delete(s.bob.id);
  run(s.net, SETTLED_MS, [wm, we]);
  assert.deepEqual(misplaced(s), [], 'AC3: the owner\'s answers queued behind a shut wire - every piece in exactly one place');
});

test('AC3 (guard - passes today): B1/C1 - a grant nobody asked for lands nothing in a party member\'s pack, and A1/C7 - a member out of the body\'s reach takes nothing of it, however she presses', async () => {
  const s = await scene('street', ['mac-0001', 'eve-0003']);
  // an unasked grant, today's own shape, for the body Mac stands
  const pup = s.mac.pool().foes.find((x) => x.puppet === s.bob.id && x.corpse);
  s.mac.hit(s.bob.id, { to: s.mac.id, k: s.mac.room, i: pup.seq, grant: [{ ...s.body[1] }], n: 99, own: 1 });
  assert.equal(s.mac.entity.items.length, 0, 'B1/C1: no piece landed off a grant Mac never asked for');
  // Eve walks fifty units off and presses
  s.eve.feet[0] += 50; s.eve.feet[2] += 50;
  const w = windowFor(s.eve, choosing(GREAVES));
  s.eve.press(s.keyOf(s.eve), w);
  run(s.net, SETTLED_MS, [w]);
  assert.deepEqual(s.rat.entity.items.map(pieceOf).sort(), s.body.map(pieceOf).sort(), 'A1/C7: the owner\'s body is whole - a taker out of reach takes nothing');
  assert.equal(s.eve.entity.items.length + (s.eve.entity.goldPieces | 0), 0, 'and Eve holds nothing');
});

test('AC3 (guard - passes today): HACKED-GOLD/SS3 - a letter of credit on the owner\'s body never reaches a party member\'s pack, whatever the window offers; it stays on the owner\'s body', async () => {
  const letter = { group: 'MiscItems', templateIndex: REALM_LETTER_TEMPLATE, name: 'Letter of credit', value: 5000, stackCount: 1 };
  const s = await scene('street', ['mac-0001'], { extra: [letter] });   // a revenant carries what it took of its killer's (RVN8)
  const w = windowFor(s.mac, (it) => it.templateIndex === REALM_LETTER_TEMPLATE);
  s.mac.press(s.keyOf(s.mac), w);
  run(s.net, SETTLED_MS, [w]);
  assert.equal(s.mac.entity.items.some((it) => it.templateIndex === REALM_LETTER_TEMPLATE), false, 'no letter in the taker\'s pack');
  assert.equal(s.rat.entity.items.filter((it) => it.templateIndex === REALM_LETTER_TEMPLATE).length, 1, 'and the letter is on the owner\'s body, once');
});

// ═══ AC7 - THE OWNER'S OWN DOORS (guards) ═════════════════════════════════════════════════════════════════════════════

test('AC7 (guard - passes today): the owner\'s own press opens his window on his body, and the one piece he takes from it is the only piece that leaves', async () => {
  const s = await scene('street');
  const key = `foeCorpse:${s.rat.uid}`;
  assert.equal(saysEmpty(plaque(s.bob, key)), false, 'the owner\'s plaque lists his body');
  const w = windowFor(s.bob, choosing(GREAVES));
  s.bob.press(key, w);
  run(s.net, 2000, [w]);
  assert.equal(w.opened.length, 1, 'his window opened');
  assert.deepEqual(s.rat.entity.items.map(pieceOf).sort(), [GOLD, SHORTSWORD].sort(), 'the coin and the blade stay on the body');
  assert.deepEqual(s.bob.entity.items.map(pieceOf), [GREAVES], 'the Greaves in his pack');
  assert.deepEqual(misplaced(s), []);
});

test('AC7 (guard - passes today): the owner\'s own quick take - his plaque lights the Greaves and the press, through the host\'s door (quick loot before the window, world.js openBodyLoot), takes the Greaves alone and opens no window', async () => {
  setPref('quickLoot', true);
  try {
    const s = await scene('street');
    const key = `foeCorpse:${s.rat.uid}`;
    const f = plaque(s.bob, key);
    const row = f.rows.findIndex((r) => pieceOf(r.item) === GREAVES);
    assert.ok(row >= 0, 'the owner\'s plaque lists the Greaves');
    resetQuickLoot();
    foldQuickLoot(f);
    for (let i = 0; i < row; i++) { quickLootWheel(1); foldQuickLoot(f); }
    const w = windowFor(s.bob, () => false);
    s.bob.pool().takeLoot(key, (l) => s.bob.said.push(l), (loot) => (quickLootTake(key, loot, s.bob.entity, (l) => s.bob.said.push(l)) ? true : w.open(loot)));
    assert.equal(w.opened.length, 0, 'no window');
    assert.deepEqual(s.rat.entity.items.map(pieceOf).sort(), [GOLD, SHORTSWORD].sort(), 'the coin and the blade stay on the body');
    assert.deepEqual(s.bob.entity.items.map(pieceOf), [GREAVES], 'the Greaves in his pack');
  } finally { setPref('quickLoot', false); resetQuickLoot(); }
});

// ═══ AC5 - A BUILDING'S FOES: the same laws through the interior pool as worldModes.js wires it ═════════════════════

test('AC5 (AC1): in a building, a party member\'s plaque over another player\'s foe\'s body never says "Empty" while the owner\'s word says it holds something', async () => {
  const s = await scene('building');
  const key = s.keyOf(s.mac);
  assert.ok(s.mac.pool().lootTargets().some((t) => t.key === key), 'the body is a loot target indoors (guard)');
  const f = plaque(s.mac, key);
  assert.ok(f?.title, 'the plaque names the body');
  assert.equal(saysEmpty(f), false, 'AC5/AC1: indoors Mac\'s plaque says "Empty" over Bob\'s full body - the building runs the street\'s pool (worldModes.js makeInteriorFoes) and its puppet\'s contents door answers null');
});

test('AC5 (AC4): in a building, no blind grab - the press (openInteriorBodyLoot) opens a window on another player\'s foe\'s body, and only the one piece taken from it leaves the owner\'s body', async () => {
  const s = await scene('building');
  const w = windowFor(s.mac, choosing(GREAVES));
  s.mac.press(s.keyOf(s.mac), w);
  run(s.net, 10_000, [w]);
  assert.deepEqual(misplaced(s), [], 'every piece in exactly one place');
  assert.ok(w.opened.length >= 1, `AC5/AC4: indoors the press opened NO window - openInteriorBodyLoot -> interiorFoes.takeLoot asks for the whole body, and the owner's body went from ${s.body.length} pieces to ${s.rat.entity.items.length}`);
  assert.deepEqual(s.rat.entity.items.map(pieceOf).sort(), [GOLD, SHORTSWORD].sort(), `AC5/AC4: only the chosen piece may leave the owner's body - it holds ${JSON.stringify(s.rat.entity.items.map((it) => it.name))}`);
});

test('AC5 (AC2): in a building, nothing is destroyed when the owner\'s answer is 3.5 s late', async () => {
  const s = await lateCase('building', { answerLate: 3500 });
  assert.deepEqual(misplaced(s), [], 'AC5/AC2: indoors an answer 3.5 s late - refused past TAKE_WINDOW_MS (interiorFoes.applyHit through applyOwnHit), never returned: destroyed');
});

test('AC5 (AC2, guard - passes today): in a building, the taker walks out before the owner\'s answer can leave (the owner\'s wire held) - the pieces go back to the owner\'s body', async () => {
  const s = await scene('building');
  s.net.shut.add(s.bob.id);
  const w = windowFor(s.mac, choosing(GREAVES));
  s.mac.press(s.keyOf(s.mac), w);
  run(s.net, 200, [w]);
  leave(s.mac);
  s.net.shut.delete(s.bob.id);
  run(s.net, SETTLED_MS, [w]);
  assert.deepEqual(misplaced(s), [], 'every piece in exactly one place');
  assert.deepEqual(s.rat.entity.items.map(pieceOf).sort(), s.body.map(pieceOf).sort(), 'the owner\'s body whole again');
});

test('AC5 (AC3, guard - passes today): in a building, two party members press one body in one breath for the same piece - no piece lands twice', async () => {
  const s = await scene('building', ['mac-0001', 'eve-0003']);
  const wm = windowFor(s.mac, choosing(GREAVES)), we = windowFor(s.eve, choosing(GREAVES));
  s.mac.press(s.keyOf(s.mac), wm);
  s.eve.press(s.keyOf(s.eve), we);
  run(s.net, SETTLED_MS, [wm, we]);
  assert.deepEqual(misplaced(s), [], 'every piece in exactly one place');
});

test('AC5 (AC7, guard - passes today): in a building, the owner\'s own press through openInteriorBodyLoot opens his window, and the one piece he takes is the only one that leaves', async () => {
  const s = await scene('building');
  const key = `foeCorpse:${s.rat.uid}`;
  assert.equal(saysEmpty(plaque(s.bob, key)), false, 'the owner\'s plaque lists his body');
  const w = windowFor(s.bob, choosing(GREAVES));
  s.bob.press(key, w);
  run(s.net, 2000, [w]);
  assert.equal(w.opened.length, 1, 'his window opened');
  assert.deepEqual(s.rat.entity.items.map(pieceOf).sort(), [GOLD, SHORTSWORD].sort(), 'the coin and the blade stay on the body');
  assert.deepEqual(s.bob.entity.items.map(pieceOf), [GREAVES], 'the Greaves in his pack');
});

// keep the coin's own law in view: the purse, not the pack, holds coin (a census reads both)
test('AC2 (guard - passes today): the census itself - the body\'s coin counted in the purse it lands in, a dupe and a loss each named (the rule every AC2/AC3 pin above reads)', () => {
  const body = PILE();
  const s = { body, rat: { entity: { items: body.slice(1).map((it) => ({ ...it })) } }, bob: { id: 'b', entity: { items: [], goldPieces: 0 } }, them: [{ id: 'm', entity: { items: [{ ...body[2] }], goldPieces: body[0].stackCount } }], before: new Map([['b', { items: [], gold: 0 }], ['m', { items: [], gold: 0 }]]) };
  assert.ok(isGoldPieces(body[0]), 'the pile\'s first piece is coin');
  assert.deepEqual(misplaced(s), [`${body[2].name}: 2 where the body held 1 - DUPED (the owner's body 1, m's pack 1)`], 'a piece on the body AND in a pack is a dupe; the coin in the purse is in one place');
  s.them[0].entity.goldPieces = 0;
  assert.match(misplaced(s)[0], /^Gold Pieces: 100 of 100 DESTROYED/, 'coin in no place is destroyed');
});
