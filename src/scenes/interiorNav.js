// @ts-check
// ═══════════════════════════════════════════════════════════════════
// FIELD BUGS 2026-10-16 INDOOR-WATCH - ENHANCED AI 5's INTERIOR HALF
// (bible/12-Enhanced-AI/Enhanced-AI-Arc.md; the Discord: "If you just sit
// near the wall between the shelves, when you fail to steal something, the
// guard will come running, but they simply can't reach you because they run
// into the wall instead of going through the door. And you can sit like that
// for as long as you like").
//
// A BUILDING'S MESH. The dungeon has baked its collider since ENHANCED AI 3b
// and walked its foes on the routes (AI 4); a building never did - the watch
// called into a shop (cityGuards.js, PlayerEntity.SpawnCityGuards' indoor arm)
// and the building's own foes (worldModes.js makeInteriorFoes) walked the
// classic motor, which steers straight at the player and slides along the
// first wall it meets: a partition between the door and the player held them
// for the whole crime. This module is the interior's: the mode machine
// (worldModes.js) mounts it with the room and releases it with the room, hands
// it to both pools (`nav`: the bake as a thunk and the routes' world, the
// dungeon's own two), and runs its frame before the pools step.
//
// THE BAKE is the dungeon's, through the same NavClient (ai/navClient.js): the
// room's collider, the unlocked action doors left out of the soup (a foe opens
// those - openDoorsStep's own test; a locked one stays a wall), anchored on
// every place an agent lives - the player's arrival, the room's ways in, and
// the spot every static door stands the watch at (cityGuards.js
// indoorWatchSpot) - and on the player's feet when it is asked. Two
// departures from the dungeon's call, both the room's size:
//   - ASKED ON NEED: the first frame after a motor in the room has read the
//     mesh. A building nobody fights in bakes nothing (the switch is on by
//     default, and most doors are a shop's).
//   - NO CACHE: a room is a fraction of a second in the worker (a 30 x 20 m
//     two-storey room, 10,000 triangles: 0.37 s on the main thread in node),
//     and thousands of buildings would each leave an IndexedDB entry nothing
//     evicts.
// A bake is asked again - one at a time, a request in flight coalesced, never
// dropped (ASYNC NEVER DROPS) - when a door's lock changes the soup, and when
// the hunted player stands off every island the mesh kept (a room behind a
// door that was locked when it baked, a loft up a ladder), with the player's
// feet among the anchors.
//
// NO ROUTE. A locked inner door, a ladder: the routes cannot take the watch to
// a player in a room of their own. The crime's watch still comes: a watchman
// hunting the player whose feet stand on another island than the player's for
// CUT_OFF_S is stood on the player's island at the spot nearest where he stood
// - the far side of what stopped him - and walks the rest. Never on the
// player, never in another watchman, never in a model. Departure from DFU,
// named: EnemyMotor has no such arm (its watch is stopped by the same wall).
// The building's own foes route on the mesh but are never stood: a monster a
// locked door holds is a door that held; the watch is the law's answer.
//
// The classic lane (the switch off) bakes nothing and stands nobody: DFU's
// motor, DFU's wall.
// ═══════════════════════════════════════════════════════════════════
import { NavClient } from '../ai/navClient.js';
import { makeNavWorld } from '../ai/enhancedMotor.js';
import { isActionDoorObject } from '../world/actionSystem.js';
import { doorWorldPosition, doorWorldNormal } from '../player/enterExit.js';
import { indoorWatchSpot, GUARD_INDOOR_DOOR_OFFSET } from './cityGuards.js';
import { isPlayerTarget } from '../characters/enemyTargets.js';
import { bodyFits, lodgedIn } from '../characters/foeSpacing.js';
import { CAPSULE_RADIUS, STEP_OFFSET } from '../player/motor.js';
import { getPref } from '../systems/uiPrefs.js';

/** m: a body this far (on the level) from the mesh's nearest poly stands on that poly's island - the narrow gap between
 *  two shelves the bake's erosion trims, a body against a wall. A melee's reach is 2.25. */
export const ISLAND_REACH = 1.5;
/** m: a poly is on a body's level when the body's feet are within this of the poly's own heights. Storeys are 2.5 m and
 *  more apart; a stair's poly spans its rise. */
export const LEVEL_DY = 0.9;
/** s between two reachability reads. */
export const CHECK_S = 0.25;
/** s a hunting watchman is cut off from the player's island before he is stood on it. */
export const CUT_OFF_S = 2;
/** m: a watchman is never stood nearer the player than this, nor nearer another hunting watchman than STAND_CROWD_M. */
export const STAND_CLEAR_M = 1.0;
export const STAND_CROWD_M = 0.8;
/** m a stand spot is drawn into its poly from the poly's edge - the capsule's own radius. */
export const STAND_INSET = CAPSULE_RADIUS;
/** m a stand spot's floor may lie off its poly's own heights - a voxel's rounding, not a crate's top. */
export const STAND_STEP = 0.3;
/** m over the feet a body's line to the mesh is drawn at - a knee, under a counter's top and over a threshold. */
export const KNEE_M = 0.5;
/** The rings round the player's feet the bake is anchored on too (m), each at eight bearings and only where the knee's
 *  line reaches: a body against a wall, between two shelves, stands where the bake's erosion keeps no floor, and an
 *  anchor that does not land is dropped (navBake.js landAnchors) - the room it stands in with it. */
export const FEET_RINGS = Object.freeze([0.5, 1.0]);
/** The most times a room is baked again for the player's feet off the mesh (each a new 2 m cell): a tabletop or a bed
 *  is under the bake's 4 m2 floor and is never kept, so a player walking a table must not bake a room over and over. */
export const MAX_FEET_BAKES = 4;

const DOWN = [0, -1, 0];
const _meshInfo = new WeakMap();

/** The bucket keys the soup leaves out: every action door a foe opens - an unlocked one (openDoorsStep's IsLocked) and
 *  not a special one (isActionDoorObject) - the dungeon's own rule (dungeonContext.js:"isActionDoorObject(o) && !(o.currentLockValue > 0)"). */
export function doorsOutOfSoup(actions) {
  const out = new Set();
  for (const o of actions?.objects?.values?.() ?? []) if (isActionDoorObject(o) && !(o.currentLockValue > 0)) out.add(o.key);
  return out;
}
const soupWord = (actions) => [...doorsOutOfSoup(actions)].sort().join('|');

/** The spot the watch stands at for each of the room's static doors (cityGuards.js's indoor arm: the door's centre, a
 *  player-radius and a tenth out along its normal, walked into the room) - every way the watch and the player come in. */
export function doorArrivals(doors, collider) {
  return (doors ?? []).map((d) => {
    const p = doorWorldPosition(d), n = doorWorldNormal(d);
    return indoorWatchSpot([p[0] + n[0] * GUARD_INDOOR_DOOR_OFFSET, p[1] + n[1] * GUARD_INDOOR_DOOR_OFFSET, p[2] + n[2] * GUARD_INDOOR_DOOR_OFFSET], n, 0, collider);
  });
}

/** A baked mesh's own facts, once a mesh: each poly's island (its neighbour links, flooded), its world corners, its
 *  centre and its height span. */
function meshInfo(chf) {
  const mesh = chf.mesh;
  let info = _meshInfo.get(mesh);
  if (info) return info;
  const n = mesh.polys.length, island = new Int32Array(n).fill(-1);
  for (let s = 0, k = 0; s < n; s++) {
    if (island[s] >= 0) continue;
    const stack = [s]; island[s] = k;
    while (stack.length) { const p = /** @type {number} */ (stack.pop()); for (const q of mesh.polys[p].neis) if (q >= 0 && island[q] < 0) { island[q] = k; stack.push(q); } }
    k++;
  }
  const polys = mesh.polys.map((p) => {
    const pts = p.verts.map((gi) => { const v = mesh.verts[gi]; return [chf.xmin + v.x * chf.cs, v.y, chf.zmin + v.z * chf.cs]; });
    let cx = 0, cz = 0, lo = Infinity, hi = -Infinity;
    for (const q of pts) { cx += q[0]; cz += q[2]; lo = Math.min(lo, q[1]); hi = Math.max(hi, q[1]); }
    return { pts, cx: cx / pts.length, cz: cz / pts.length, lo, hi };
  });
  info = { island, polys };
  _meshInfo.set(mesh, info);
  return info;
}

/** The nearest point of a convex poly to (x, z), in the plane: the point itself inside, else the nearest on its rim. */
function nearestIn(poly, x, z) {
  const pts = poly.pts;
  let pos = 0, neg = 0, best = null, bestD = Infinity;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const ex = b[0] - a[0], ez = b[2] - a[2];
    const cr = ex * (z - a[2]) - (x - a[0]) * ez;
    if (cr > 1e-9) pos++; else if (cr < -1e-9) neg++;
    const l2 = ex * ex + ez * ez;
    let t = l2 ? ((x - a[0]) * ex + (z - a[2]) * ez) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
    const qx = a[0] + t * ex, qz = a[2] + t * ez, d = Math.hypot(x - qx, z - qz);
    if (d < bestD) { bestD = d; best = [qx, qz]; }
  }
  return !pos || !neg ? { x, z, d: 0 } : { x: best[0], z: best[1], d: bestD };
}

/** Whether the knee's line from `from` reaches `to` (both feet) through nothing in `collider` but the buckets `skip` -
 *  the doors the mesh walks through. No collider, no wall. */
function kneeLine(collider, from, to, skip = null) {
  if (!collider) return true;
  const a = [from[0], from[1] + KNEE_M, from[2]];
  const dx = to[0] - a[0], dy = to[1] + KNEE_M - a[1], dz = to[2] - a[2], l = Math.hypot(dx, dy, dz);
  if (l < 1e-6) return true;
  return !(collider.raycast(a, [dx / l, dy / l, dz / l], l, skip ? { skip } : null) < l);
}

/** The poly a body at `feet` stands on - on its level, within ISLAND_REACH in the plane, the nearest; one it stands
 *  beside and not in is its only where the knee's line reaches it (`collider`: never the room behind a wall) - or -1. */
export function polyUnder(chf, feet, { reach = ISLAND_REACH, collider = null, skip = null } = {}) {
  if (!chf?.mesh?.polys?.length || !feet) return -1;
  const { polys } = meshInfo(chf);
  const near = [];
  for (let i = 0; i < polys.length; i++) {
    const p = polys[i];
    const dy = feet[1] < p.lo ? p.lo - feet[1] : feet[1] > p.hi ? feet[1] - p.hi : 0;
    if (dy > LEVEL_DY) continue;
    const q = nearestIn(p, feet[0], feet[2]);
    if (q.d <= reach) near.push({ i, s: q.d + dy, q, y: Math.min(Math.max(feet[1], p.lo), p.hi) });
  }
  near.sort((a, b) => a.s - b.s);
  for (const n of near) if (n.q.d === 0 || kneeLine(collider, feet, [n.q.x, n.y, n.q.z], skip)) return n.i;
  return -1;
}

/** The island a poly is on (its neighbour links, flooded), or -1. */
export const islandOf = (chf, pi) => (pi >= 0 && chf?.mesh?.polys?.length ? meshInfo(chf).island[pi] : -1);

/** Whether two bodies stand on one island of the mesh (null when either stands on none). */
export function sameIsland(chf, a, b, opts = {}) {
  const pa = polyUnder(chf, a, opts), pb = polyUnder(chf, b, opts);
  if (pa < 0 || pb < 0) return null;
  const { island } = meshInfo(chf);
  return island[pa] === island[pb];
}

/** The player's feet as the bake's anchors: the feet, and the FEET_RINGS round them the knee's line reaches. */
export function feetAnchors(collider, feet) {
  const out = [[feet[0], feet[1], feet[2]]];
  for (const r of FEET_RINGS) {
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4, p = [feet[0] + Math.sin(a) * r, feet[1], feet[2] + Math.cos(a) * r];
      if (kneeLine(collider, feet, p)) out.push(p);
    }
  }
  return out;
}

/** Where a body can stand at (x, z) on a poly's floor: the collider's own floor under it (a face that looks up) within
 *  STAND_STEP of the poly's own heights - never a crate's top or a table's set down since the bake - a body's room there,
 *  in no model - or null. */
function floorSpot(collider, poly, x, z) {
  const top = poly.hi + STEP_OFFSET;
  const h = collider.raycastHit([x, top, z], DOWN, top - poly.lo + 1);
  if (!h || !Number.isFinite(h.dist) || h.back === true) return null;
  const spot = [x, top - h.dist, z];
  if (spot[1] < poly.lo - STAND_STEP || spot[1] > poly.hi + STAND_STEP) return null;
  if (!bodyFits(collider, spot) || lodgedIn(collider, spot)) return null;
  return spot;
}

/**
 * NO ROUTE's spot: on island `isl`, the stand nearest `from` (where the watchman stood) - in each of the island's polys
 * the point nearest him, drawn STAND_INSET into the poly, else the poly's centre - clear of the player (STAND_CLEAR_M) and
 * of every other body in `others` (STAND_CROWD_M); null when the island has no such floor.
 */
export function noRouteSpot(chf, collider, isl, from, playerFeet, others = []) {
  const { island, polys } = meshInfo(chf);
  const order = [];
  for (let i = 0; i < polys.length; i++) if (island[i] === isl) order.push({ p: polys[i], near: nearestIn(polys[i], from[0], from[2]) });
  order.sort((a, b) => a.near.d - b.near.d);   // nearest first: no point of a poly is nearer him than its nearest point
  let best = null, bestD = Infinity;
  for (const { p, near } of order) {
    if (near.d >= bestD) break;
    const dx = p.cx - near.x, dz = p.cz - near.z, l = Math.hypot(dx, dz);
    const k = l > 1e-6 ? Math.min(1, STAND_INSET / l) : 0;
    for (const [x, z] of [[near.x + dx * k, near.z + dz * k], [p.cx, p.cz]]) {
      const spot = floorSpot(collider, p, x, z);
      if (!spot) continue;
      if (Math.hypot(spot[0] - playerFeet[0], spot[2] - playerFeet[2]) < STAND_CLEAR_M) continue;
      if (others.some((o) => Math.hypot(spot[0] - o[0], spot[2] - o[2]) < STAND_CROWD_M)) continue;
      const d = Math.hypot(spot[0] - from[0], spot[1] - from[1], spot[2] - from[2]);
      if (d < bestD) { bestD = d; best = spot; }
      break;
    }
  }
  return best;
}

/** A watchman this module may stand: his own (no puppet), the enhanced motor's (it carries standAt), hunting the
 *  player - the crime's pursuit, target the player or none yet, its give-up timer running - and able to act: not dead,
 *  not walking off (WATCH-LEAVES), not running (WERE-FRIGHT), no defender, not talked down. */
export function huntsThePlayer(g) {
  const ai = g?.ai;
  if (!ai || g.dead || g.puppet || g.leaving || g.fleeing || g.defender || typeof ai.standAt !== 'function') return false;
  if (ai.isHostile === false || ai.canAct === false || !(ai.giveUpTimer > 0) || !ai.predictedTargetPos) return false;
  return ai.target == null || isPlayerTarget(ai.target);
}

/**
 * THE INTERIOR'S NAV - one for the mode machine, mounted with each room.
 *   nav.chf()   the room's bake, or null (the motor's thunk - a read marks the room as wanting one)
 *   nav.world   the routes' world: the findPath budget and the nav epoch (makeNavWorld), every motor's
 *   mount(ctx, feet) / release()   the room: its collider, its action doors, its doors and ways in; the player's arrival
 *   frame(dt, playerFeet, watch, grounded)   before the pools step: the budget, the bake, NO ROUTE (answers how many stood)
 * `makeClient` the bake's client (a test's own); `enabled` the switch.
 */
export function createInteriorNav({ makeClient = () => new NavClient({ store: null }), enabled = () => !!getPref('enhancedAI') } = {}) {
  const world = makeNavWorld();
  /** @type {any} */
  let room = null;
  let gen = 0;
  let checkT = 0;
  const cut = new WeakMap();   // a watchman -> seconds cut off from the player's island

  function bake() {
    const r = room;
    if (!r) return;
    if (r.flying) { r.again = true; return; }   // ASYNC NEVER DROPS: the latest soup and anchors, once this one lands
    r.flying = true; r.again = false;
    r.soup = soupWord(r.actions);
    const g = gen;
    if (!r.client) r.client = makeClient();
    Promise.resolve(r.client.bake({ collider: r.collider, anchor: r.anchor, anchors: [...r.anchors, ...r.feet], exclude: doorsOutOfSoup(r.actions), key: 'interior' }))
      .then((b) => { if (g === gen && b?.chf) { r.chf = b.chf; world.navEpoch++; } })   // every held route is re-solved on the new mesh
      .catch((e) => { if (g === gen) console.warn('[enhanced-ai] interior navmesh bake failed - the classic motor stands:', e?.message ?? e); })
      .finally(() => { if (g !== gen) return; r.flying = false; if (r.again) bake(); });
  }

  return {
    world,
    chf: () => { if (room) room.read = true; return room?.chf ?? null; },
    /** The room, as it is mounted: `feet` the player's arrival (the restore's own spot, else the door's landing). */
    mount(ctx, feet) {
      this.release();
      room = {
        collider: ctx.collider, actions: ctx.actions,
        anchor: [feet[0], feet[1], feet[2]],
        anchors: [...(ctx.waysIn ?? []), ...doorArrivals(ctx.doors, ctx.collider)],
        feet: [], tried: new Set(),
        chf: null, client: null, read: false, asked: false, flying: false, again: false, soup: null,
      };
      checkT = 0;
    },
    /** The room's end: the slot emptied first (a bake landing late publishes nothing), then the worker let go. */
    release() {
      const r = room;
      room = null; gen++;
      r?.client?.dispose?.();
    },
    get mounted() { return !!room; },
    get baking() { return !!room?.flying; },
    frame(dt, playerFeet, watch = [], grounded = true) {
      world.pathBudget = world.budgetPerFrame;   // his enemy.js:404, the dungeon's line
      const r = room;
      if (!r || !enabled()) return 0;
      if (!r.asked) {
        if (!r.read) return 0;   // nobody walks the mesh yet: nothing baked
        r.asked = true;
        if (grounded && playerFeet) r.feet.push(...feetAnchors(r.collider, playerFeet));
        bake();
        return 0;
      }
      if ((checkT += dt) < CHECK_S) return 0;
      const step = checkT; checkT = 0;
      if (soupWord(r.actions) !== r.soup) bake();   // a door locked or unlocked since: another soup
      if (!r.chf || !playerFeet) return 0;
      const hunters = (watch ?? []).filter(huntsThePlayer);
      if (!hunters.length) return 0;
      const near = { collider: r.collider, skip: doorsOutOfSoup(r.actions) };
      const me = polyUnder(r.chf, playerFeet, near);
      if (me < 0) {
        // the hunted player stands on no island the mesh kept: bake again with their feet among the anchors
        const cell = `${Math.floor(playerFeet[0] / 2)},${Math.floor(playerFeet[2] / 2)},${Math.round(playerFeet[1])}`;
        if (grounded && !r.flying && r.tried.size < MAX_FEET_BAKES && !r.tried.has(cell)) {
          r.tried.add(cell);
          r.feet.push(...feetAnchors(r.collider, playerFeet));
          bake();
        }
        return 0;
      }
      const { island } = meshInfo(r.chf);
      let stood = 0;
      for (const g of hunters) {
        const at = polyUnder(r.chf, g.ai.feet, near);
        if (at >= 0 && island[at] === island[me]) { cut.delete(g); continue; }
        const t = cut.has(g) ? cut.get(g) + step : 0;   // cut off from this read on
        cut.set(g, t);
        if (t < CUT_OFF_S) continue;
        const others = hunters.filter((o) => o !== g).map((o) => o.ai.feet);
        const spot = noRouteSpot(r.chf, r.collider, island[me], g.ai.feet, playerFeet, others);
        if (!spot) continue;
        g.ai.standAt(spot);
        cut.delete(g);
        stood++;
      }
      return stood;
    },
  };
}
