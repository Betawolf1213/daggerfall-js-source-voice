// @ts-check
// ═══════════════════════════════════════════════════════════════════
// TOWN-EXIT (FIELD BUGS 2026-10-19e, a player's private report: leaving a town by the Overworld's journey, or walking
// through one, the way out failed wherever the traveller stood far from a gate, and left them caught in a corner of the
// wall) - A JOURNEY FROM INSIDE A WALLED TOWN LEAVES BY A GATE. bible/06-Systems/Travel-View.md TOWN-EXIT.
//
// THE WALK THAT WAS. A route's legs are the pixels after its first (travelRoute.js routeLegs), so the first leg of a
// journey begun in a town aimed at the next pixel's middle - or, by a road, at a join on the line from the town's own
// middle to it (OW-ROADSIDE) - straight across the town and through its wall. The pass-through ring (OW-TOWN-RING) is
// for a town the route goes THROUGH, never the one it starts in. Between the traveller and the wall there was only the
// steering (TRAVEL-NAV1, travelSteer.js): local feelers and a detour of two hundred metres, which a wall of a city's
// length, and the notch two of its walls make, outlast - "blocked", in the corner.
//
// THE WALK NOW. Begun on a walled town's streets, the journey walks first to a gate, through it, out to the town's
// border ring (the paved ring the painter lays and Travel Options' own circumnavigation walks, travelOptions.js
// ringPoints) and round it the shorter way to the side the route leaves the pixel by, where the road meets the ring;
// the route's own legs go on from there. The gate is the one whose whole walk is shortest - the streets to it, then
// those points - so it is the departing side's unless another's ring is the shorter way. WHERE THE STREETS ARE is the
// town's own navgrid's to say: DFU's CityNavigation carves every block's automap out of it, a wall's and a gate's model
// among them (world/city/cityNavigation.js), so a walled town's streets are a piece of the grid of their own that
// never reaches its edge, and the fields outside the walls do (LW-WALLS, systems/livingWorld/places.js). A traveller in
// the fields - a notch the walls make among them too, inside the box the four gates stand on - walks out as before,
// and so does one in a yard no gate opens onto.
//
// THE GATES are DaggerfallCityGate's (pixelBuild.js `cityGates`, RMBLayout.cs:959-963): each where its model stands, on
// the side its model's +z faces - away from its town: every one of the 260 gates of the 65 cities whose grid and width
// Beautiful Cities' pack names, and each of the 283 cities it names whole stands four, one to a side - and open or shut
// as its model now is. OFFLINE BY NIGHT EVERY GATE IS SHUT: DaggerfallCityGate.Update shuts them all at dusk, and
// SetOpen swaps the MeshCollider with the mesh (world/city/cityGate.js), so the closed model is a wall and the walled
// town is sealed until dawn, classic's own law; online they stand open (OL5). A journey from the streets with no gate
// open is refused, said, and never begun.
//
// PURE but for what a built pixel already holds: its gates, its navgrid and its location's origin.
// ═══════════════════════════════════════════════════════════════════
import { CITY_GATE_OPEN_MODEL_ID } from '../../world/rmbLayout.js';
import { NAV_CELL } from '../../world/city/cityNavigation.js';
import { GLOBAL_SCALE } from '../../world/meshReader.js';
import { worldCoordToMapPixel } from '../../formats/mapsFile.js';
import { mapPixelWorldOrigin, HALF_MP_WORLD_UNITS, P_SIZE } from './travelPaths.js';
import { routeLegs, joinPoint } from './travelRoute.js';
import { ringPoints, ringSideOf, RING_ORDER, ROAD_LEG_KINDS } from './travelOptions.js';

/** How far inside its wall a gate is walked to, and how far outside it the walk through it ends (native): one path's
 *  width (travelPaths.js P_SIZE), so each point's own arrival square (P_SIZE wide, the autopilot's for a leg with a
 *  point of its own) lies wholly off the wall - a wall is 192 units either side of its line (CITY-WALLS) - and the walk
 *  between them is the gate's own line, straight through its passage: a body that arrived anywhere in the inner
 *  square crosses the wall within half that square of the passage's middle, and the steering's nearer edge is the
 *  passage's. */
export const GATE_IN = P_SIZE;
/** How far about a cell a walkable one is looked for (cells, 1.6 m each): the traveller against a house's wall, a gate's
 *  inner point on a doorstep. */
export const STREET_REACH = 4;
/** The way out's points walked on foot before the ring: in to the gate, out through it, out to the ring's band - the
 *  streets and the fields, the open ground's (RATE-LAW); the ring after them on the ground the route leaves by. */
export const EXIT_ON_FOOT = 3;
/** A navgrid cell, native (64 classic units: 1.6 m). */
const CELL_NATIVE = NAV_CELL / GLOBAL_SCALE;
/** The way each side of a town faces out, native (north is +z). */
const OUT = Object.freeze({ n: [0, 1], e: [1, 0], s: [0, -1], w: [-1, 0] });

/**
 * A built pixel's gates (pixelBuild.js `cityGates`: DaggerfallCityGate's placements, each with its pixel-local matrix)
 * in native units: where each stands (whole units - a block's records are), the side of its town it stands on - the
 * way its model's +z faces - and whether it stands OPEN: its model, not its flag, is what blocks (OL5).
 * @param {{ gate: { modelId: number }, local: ArrayLike<number> }[]} cityGates
 * @param {{ x: number, z: number }} origin - the pixel's corner, native
 * @returns {{ x: number, z: number, side: 'n'|'e'|'s'|'w', open: boolean }[]}
 */
export function gatesOf(cityGates, origin) {
  return (cityGates ?? []).map((g) => {
    const m = g.local;
    /** @type {'n'|'e'|'s'|'w'} */
    const side = Math.abs(m[8]) > Math.abs(m[10]) ? (m[8] > 0 ? 'e' : 'w') : (m[10] > 0 ? 'n' : 's');
    return { x: Math.round(origin.x + m[12] / GLOBAL_SCALE), z: Math.round(origin.z + m[14] / GLOBAL_SCALE), side, open: g.gate?.modelId === CITY_GATE_OPEN_MODEL_ID };
  });
}

/** Whether a navgrid cell takes a foot (CityNavigation's weight, the high nibble: a covered cell is 0). */
const walkable = (nav, i) => (nav.grid[i] >> 4) > 0;

/**
 * The walkable cell nearest (gx, gy) within STREET_REACH cells - the nearest first, ring by ring - that `ok` takes, or
 * null.
 * @param {{ width: number, height: number, grid: Uint8Array }} nav
 * @param {number} gx @param {number} gy
 * @param {(i: number) => boolean} [ok]
 * @returns {number|null} the cell's index
 */
export function walkableNear(nav, gx, gy, ok = () => true) {
  for (let r = 0; r <= STREET_REACH; r++) {
    let best = null, bestD = Infinity;
    for (let y = gy - r; y <= gy + r; y++) {
      for (let x = gx - r; x <= gx + r; x++) {
        if (Math.max(Math.abs(x - gx), Math.abs(y - gy)) !== r || x < 0 || y < 0 || x >= nav.width || y >= nav.height) continue;
        const i = y * nav.width + x, d = (x - gx) ** 2 + (y - gy) ** 2;
        if (d < bestD && walkable(nav, i) && ok(i)) { best = i; bestD = d; }
      }
    }
    if (best !== null) return best;
  }
  return null;
}

/**
 * THE STREETS: the walkable cells of a town's navgrid joined to cell `start` (four neighbours, as its walkers step),
 * each with its steps from it (-1: not joined) - and `open`, said the moment they reach the grid's edge: the fields
 * outside a walled town do, its streets never.
 * @param {{ width: number, height: number, grid: Uint8Array }} nav
 * @param {number} start - a walkable cell's index
 * @returns {{ steps: Int32Array, open: boolean }}
 */
export function streetsFrom(nav, start) {
  const W = nav.width, H = nav.height;
  const steps = new Int32Array(W * H).fill(-1), queue = new Int32Array(W * H);
  let head = 0, tail = 0;
  steps[start] = 0;
  queue[tail++] = start;
  while (head < tail) {
    const i = queue[head++], x = i % W, y = (i - x) / W;
    if (x === 0 || y === 0 || x === W - 1 || y === H - 1) return { steps, open: true };
    for (const n of [i - 1, i + 1, i - W, i + W]) {
      if (steps[n] < 0 && walkable(nav, n)) { steps[n] = steps[i] + 1; queue[tail++] = n; }
    }
  }
  return { steps, open: false };
}

/** A walk's length through its points, from `start`. */
const lengthOf = (start, pts) => pts.reduce((s, p, i) => s + Math.hypot(p.x - (i ? pts[i - 1] : start).x, p.z - (i ? pts[i - 1] : start).z), 0);

/**
 * Round the ring from `start` - a point of its band on side `a` - to side `b`'s point (indices into RING_ORDER): the
 * corners passed, then side b's point; the shorter way by length, clockwise on a tie (ringPassPoints' own tie - which
 * counts sides, its two points both on the road's line; a gate stands anywhere along its side).
 * @param {Record<string, {x:number, z:number}>} at - travelOptions.js ringPoints
 * @param {{x:number, z:number}} start @param {number} a @param {number} b
 */
export function ringRound(at, start, a, b) {
  if (a === b) return [at[RING_ORDER[b]]];
  const way = (step) => {
    const out = [];
    for (let i = (a + step + 8) % 8; i !== b; i = (i + step + 8) % 8) if (RING_ORDER[i].length === 2) out.push(at[RING_ORDER[i]]);
    out.push(at[RING_ORDER[b]]);
    return out;
  };
  const cw = way(1), ccw = way(-1);
  return lengthOf(start, ccw) < lengthOf(start, cw) ? ccw : cw;
}

/**
 * TOWN-EXIT: THE WAY OUT of the walled town in a journey's start pixel.
 * `pixel` the built pixel (pixelBuild.js: `px`, `py`, `cityGates`, `population.nav` - the town's CityNavigation - and
 * `locOrigin`, the location frame's origin, pixel-local), `rects` its town's (travelOptions.js locationRectsOf), `me`
 * the traveller (native), `to` the map step the route leaves the pixel by ([dx, dy], map y runs south).
 * Answers null where there is no town's streets to leave - no pixel built, no gate (an open town), no navgrid, the
 * traveller in the fields or in a yard no gate opens onto - and the journey leaves as it always has; `{ shut: true }`
 * where every gate the streets reach is shut; else `{ points }`, native: the gate's inner point and its outer one
 * (GATE_IN either side of its wall, on its own line), the ring's band straight out from it, the ring's corners the
 * shorter way round, and the point where the route's own line leaves the ring (ringPoints') - by the gate whose walk is
 * the shortest (the streets' steps to it, then the points).
 * @param {any} pixel
 * @param {{ locationRect: any, locationBorderRect: any }|null} rects
 * @param {{ x: number, z: number }} me
 * @param {number[]} to
 * @returns {{ points: {x:number, z:number}[] } | { shut: true } | null}
 */
export function townExit(pixel, rects, me, to) {
  const nav = pixel?.population?.nav, lo = pixel?.locOrigin;
  if (!rects || !pixel?.cityGates?.length || !(nav?.grid instanceof Uint8Array) || !lo) return null;
  const origin = mapPixelWorldOrigin(pixel.px, pixel.py);
  const cell = (x, z) => [Math.floor(((x - origin.x) * GLOBAL_SCALE - lo[0]) / NAV_CELL), Math.floor(((z - origin.z) * GLOBAL_SCALE - lo[2]) / NAV_CELL)];
  const [mx, mz] = cell(me.x, me.z);
  const start = walkableNear(nav, mx, mz);
  if (start === null) return null;
  const streets = streetsFrom(nav, start);
  if (streets.open) return null;
  const ways = [];
  for (const g of gatesOf(pixel.cityGates, origin)) {
    const inner = { x: g.x - OUT[g.side][0] * GATE_IN, z: g.z - OUT[g.side][1] * GATE_IN };
    const [ix, iz] = cell(inner.x, inner.z);
    const i = walkableNear(nav, ix, iz, (c) => streets.steps[c] >= 0);
    if (i !== null) ways.push({ g, inner, steps: streets.steps[i] });
  }
  if (!ways.length) return null;
  if (!ways.some((w) => w.g.open)) return { shut: true };
  const L = rects.locationRect;
  const at = ringPoints(L, rects.locationBorderRect, { x: origin.x + HALF_MP_WORLD_UNITS, z: origin.z + HALF_MP_WORLD_UNITS });
  const b = RING_ORDER.indexOf(ringSideOf(to[0], to[1]));
  let best = null, bestLen = Infinity;
  for (const { g, inner, steps } of ways) {
    if (!g.open) continue;
    // through the gate on its own line, and on out to the ring's band on its side
    const outer = { x: g.x + OUT[g.side][0] * GATE_IN, z: g.z + OUT[g.side][1] * GATE_IN };
    const out = g.side === 'n' || g.side === 's'
      ? { x: Math.min(L.xMax, Math.max(L.xMin, g.x)), z: at[g.side].z }
      : { x: at[g.side].x, z: Math.min(L.zMax, Math.max(L.zMin, g.z)) };
    const round = ringRound(at, out, RING_ORDER.indexOf(g.side), b);
    const len = steps * CELL_NATIVE + lengthOf(inner, [outer, out, ...round]);
    if (len < bestLen) { best = [inner, outer, out, ...round]; bestLen = len; }
  }
  return best ? { points: best } : null;
}

/** A pixel's middle, native - the road's own lane runs middle to middle (travelPaths.js). */
const middle = (p) => { const o = mapPixelWorldOrigin(p.x, p.y); return { x: o.x + HALF_MP_WORLD_UNITS, z: o.z + HALF_MP_WORLD_UNITS }; };

/**
 * THE LEGS A JOURNEY WALKS from pixel `from` along `plan` (planRoute's pixels and kinds): the route's own legs
 * (routeLegs, round every town it passes through - OW-TOWN-RING's `ringAt`), begun
 *  - out of the walled town it starts in by a gate (TOWN-EXIT: `exitAt(x, y, to, me)`, the host's townExit) - each
 *    point a leg aimed at it in its own pixel (the autopilot asks a leg's arrival only there), walked point to point
 *    (`ring`: OW-TOWN-RING's flag - a resume in the town skips none and takes none for a road's join, and no road's lane
 *    runs between them), the way in to the gate, through it and out to the ring on foot (EXIT_ON_FOOT), the ring on
 *    the ground the route leaves by;
 *  - else joined to its first road where its first step is a road's or a track's (OW-ROADSIDE: the nearest point of
 *    that first run's line, from the start pixel's middle, to the traveller `me`);
 *  - or null where the town's gates are all shut: no journey.
 * Moved out of world.js's tvJoinedLegs whole (HOST-SPLIT), the join as it was.
 * @param {{x:number, y:number}} from
 * @param {{ pixels: {x:number, y:number}[], kinds: string[] }} plan
 * @param {{ me: {x:number, z:number}, ringAt?: any, exitAt?: ((x:number, y:number, to:number[], me:{x:number, z:number}) => ({ points: {x:number, z:number}[] } | { shut: true } | null))|null }} opts
 */
export function journeyLegs(from, plan, { me, ringAt = null, exitAt = null }) {
  const legs = routeLegs(plan.pixels, plan.kinds, { ringAt });   // OW-TOWN-RING: round a town the route passes through
  const next = plan.pixels[1];
  const exit = next && exitAt ? exitAt(from.x, from.y, [next.x - from.x, next.y - from.y], me) : null;
  if (exit && 'shut' in exit) return null;
  const points = exit && 'points' in exit ? exit.points : [];
  if (points.length) {
    const ground = ROAD_LEG_KINDS.includes(plan.kinds[0]) ? plan.kinds[0] : 'open';
    return [...points.map((at, i) => ({ ...worldCoordToMapPixel(at.x, at.z), kind: i < EXIT_ON_FOOT ? 'open' : ground, at: { x: at.x, z: at.z }, ring: true })), ...legs];
  }
  if (!legs.length || (plan.kinds[0] !== 'road' && plan.kinds[0] !== 'track')) return legs;   // THE MERGE: a launch (OWS2) is no road to join
  return [{ x: from.x, y: from.y, kind: 'open', at: joinPoint(me, middle(from), legs[0].at ?? middle(legs[0])) }, ...legs];   // OW-TOWN-RING: a first leg on a town's ring is joined toward its own point
}
