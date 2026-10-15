// @ts-check
// EG-ZB (2026-10-12, Mac: "I said I want everything"; bible/11-Multiplayer/Elite-Gates.md sections 8.2 and 11.7): WHERE THE
// LEGION WALKS AND WHERE A BLOW STANDS - three readings of a hall spec's own geometry, derived at runtime (the spec gains
// no field: EG_SPEC's law, and so net/egDurable.js EG_LAWS, are unchanged), each cached on the frozen spec it reads.
//
//   THE FIGHT GROUND (egFightView, egGroundAt). THE FIGHT FLOOR (`spec.fl`, section 11.7) and, beside it, the ground the page
//     names as fought on though the spec lays it as a plain disc: on a SPAN its islands and its two plates (section 8.2 -
//     the Harriers bite only there, and the Divers dive there), and in any hall the pillars a Rampart's Casters stand on
//     ("reach them by short side spans", section 8.3) and its winch plates (an errand stood on under the march). A blow is
//     struck from it, a blow is aimed at a member standing on it, and the census judges a body on it (net/bossRef.js reads
//     the view as its spec). Everything else - stairs, ledges, platforms, side spans, bridges - is traversal ground.
//   THE WALK GRAPH (egWalkGraph, egWalkNext - section 11.7, "the legion walks the graph"). The fight ground's pieces are its
//     REGIONS (a disc, a lane's capsule - each convex, so a straight walk inside one never leaves it); a chokepoint ARCH
//     (a chamber's `deco` arch, 6 m wide, whose wall crosses its disc) splits its disc into two halves joined only at its
//     gap. Its NODES: where two pieces at one height overlap or touch (a portal, both ways), where a higher piece overlies
//     or borders a lower one within a drop (a ledge stepped off, one way - a balcony's lip, a perch's edge), a STAIR's foot
//     and top (`spec.ramps`, both ways: how a second floor is climbed), and an arch's gap. A ground walker (and a Harrier,
//     which hovers ALONG the graph) goes straight within its region and from region to region by the shortest way over a
//     dozen nodes; a chasm (a passage's two floors), the void between a span's islands, a perch with no stair up stays
//     uncrossed - with no way, it walks to the point of its own region nearest its goal.
//   THE AIR (egAirNext, egAirKeep - "Harriers hover along the graph, never through rock"; "Divers dive only in fragments
//     open to the sky"). A flier goes straight unless rock stands between: a covered passage's walls (its rock mass,
//     EG_ROCK_M either side of its tunnel), a chokepoint arch's wall, a chamber's wall ring (open only where the course
//     comes in and goes on) - then by the fewest metres over their mouths, corners and gaps.
//   EG-ZJ (2026-10-12; sections 11.7 and 23): A BODY'S FEET on the wire (egFeetAt, egWalkFeet) - the fight ground under a body
//     (section 11.7's band about where it stood, else the lowest that holds it), and a graph walker's floor now and at its
//     next walk's end; every screen draws each body at its own height (net/egBodies.js egBodyWire carries it).
//   EG-ZQ (2026-10-12; sections 8.3, 11.7 and 12): THE WAY ON KEPT ONLY WHILE IT IS WALKED (egWayOn - EG-ZK's rule for the
//     lords, the graph's own now: a walker set down off its walk keeps no node to walk straight to through a wall), and A
//     PINNED WALKER keeps to its own region (a Rampart's Caster on its pillar, whatever the pillar's plan meets).
//
//   EG-HERO-LAY (2026-10-13; spec law 7, sections 11.5 and 11.7): A HERO'S GROUND. A hero fragment's fight floors stand in
//     the fight floor as polygons (`{ t: 'p', poly, y }`): each a region of its own, met by the pieces about it where their
//     plans meet (a portal, as any two pieces meet - egPortalOf), its stairs the hall's ramps. A polygon need not be convex,
//     so within one a walk goes straight only where the way stays on it (egSeesIn) - else over its nodes; and its LAW's walk
//     graph joins the hall's (`spec.heroes`): every node of it on its fight ground a node of the graph, every edge of it an
//     edge, and a node at each of its sockets' feet, where the course comes in and goes on.
//   AUDIT EG V (2026-10-15; section 11.7): A HERO'S STAIR JOINED AT ITS OWN EDGES - its foot and top read off the stair's own
//     low and high edges (the points of them that stand on a floor of their height), not the middle of its low corners (which
//     hangs off its floor where a stair runs along an open chord - the Eclipse Vault's galleries stood cut off). The graph is
//     derived, not law: every hall walks it so, whatever law laid the hall.
//
// Pure, deterministic (no die), in the relay bundle (net/egLegion.js, net/egBrain.js). Not a DFU member. Ledger A
// (ELITE-GATES).
import { segDist, egPolyIn, egPolyDist, egPolyKeep } from './egShape.js';

/** A blow is struck from the fight ground within this of its plan (m - the pose's age and the capsule), and a member is off
 *  it past this (section 11.7's hunt). */
export const EG_STRIKE_PAD_M = 1.5;
/** A body is on a floor while its feet lie at most this under it and this over it (m - section 11.7's band). */
export const EG_GROUND_UNDER_M = 0.5;
export const EG_GROUND_OVER_M = 3.0;
/** Two pieces within this of each other (m) touch; within this in height (m) they are one level; a higher piece within this
 *  over a lower one (m - THE DROP, net/egLaw.js EG_DROP_CM) is stepped off. */
export const EG_PIECE_TOUCH_M = 0.3;
export const EG_LEVEL_M = 0.6;
export const EG_DROP_M = 4.6;
/** A node is reached within this (m). */
export const EG_NODE_REACH_M = 0.7;
/** A covered passage's rock mass either side of its tunnel (m), and how far off a wall a flier's way keeps (m). */
export const EG_ROCK_M = 3;
export const EG_AIR_CLEAR_M = 1;

const _views = new WeakMap(), _graphs = new WeakMap(), _airs = new WeakMap();
const disc = (d, g) => ({ t: 'd', x: d.x, z: d.z, r: d.r, y: d.y ?? 0, g });

/**
 * THE FIGHT GROUND of hall `spec`: the spec itself where its fight floor is all of it, else a view - the spec with `fl`
 * widened by a span's islands and plates and any hall's caster pillars and winch plates (each `{t:'d', x, z, r, y, g}`, `g`
 * what it is). Pure, cached on the spec.
 * @param {any} spec
 */
export function egFightView(spec) {
  if (!spec || typeof spec !== 'object') return spec;
  const had = _views.get(spec);
  if (had) return had;
  const extra = [];
  if (spec.kind === 'span') {
    for (const d of spec.islands ?? []) extra.push(disc(d, 'island'));
    for (const d of [spec.arrive, spec.end]) if (d) extra.push(disc(d, 'plate'));
  }
  for (const d of spec.discs ?? []) if (d.role === 'pillar' || d.role === 'winch') extra.push(disc(d, d.role));
  const view = extra.length ? { ...spec, fl: [...(spec.fl ?? []), ...extra] } : spec;
  _views.set(spec, view);
  return view;
}
/** Does piece `f` hold (x, z) in plan, `pad` m about? */
const holds = (f, x, z, pad = 0) => (f.t === 'p' ? egPolyIn(f.poly, x, z, pad) : f.t === 'd' ? Math.hypot(x - f.x, z - f.z) <= f.r + pad : segDist(x, z, f.ax, f.az, f.bx, f.bz) <= f.hw + pad);
/** EG-HERO-LAY: how often (m) a straight walk inside a polygon is looked along (egSeesIn). */
export const EG_SEE_STEP_M = 0.5;
/** EG-HERO-LAY: does the straight walk from (ax, az) to (bx, bz) stay on polygon `poly` (each point along it every
 *  EG_SEE_STEP_M, EG_PIECE_TOUCH_M about its outline - a node at a portal stands on its edge)? A convex floor's every walk
 *  does; a notched one's may not. */
export function egSeesIn(poly, ax, az, bx, bz) {
  const n = Math.max(2, Math.ceil(Math.hypot(bx - ax, bz - az) / EG_SEE_STEP_M));
  for (let k = 1; k < n; k++) if (!egPolyIn(poly, ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n, EG_PIECE_TOUCH_M)) return false;
  return true;
}
/** EG-HERO-LAY: where a polygon piece meets another piece (any kind) in plan, or null - of their corners, edges' middles,
 *  centres and each one's nearest point to the other's, those both hold (EG_PIECE_TOUCH_M about), the one nearest their
 *  middle. */
function polyPortal(a, b) {
  const pts = [];
  const own = (f) => {
    if (f.t === 'p') f.poly.forEach((p, i) => { const q = f.poly[(i + 1) % f.poly.length]; pts.push([p[0], p[1]], [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]); });
    else if (f.t === 'd') pts.push([f.x, f.z]);
    else pts.push([f.ax, f.az], [f.bx, f.bz], [(f.ax + f.bx) / 2, (f.az + f.bz) / 2]);
  };
  own(a); own(b);
  const toward = (f, g) => { if (f.t !== 'p') return; for (const p of [...pts]) if (holds(g, p[0], p[1], EG_PIECE_TOUCH_M)) pts.push(egPolyKeep(f.poly, p[0], p[1], 0)); };
  toward(a, b); toward(b, a);
  const both = pts.filter((p) => holds(a, p[0], p[1], EG_PIECE_TOUCH_M) && holds(b, p[0], p[1], EG_PIECE_TOUCH_M));
  if (!both.length) return null;
  const mx = both.reduce((v, p) => v + p[0], 0) / both.length, mz = both.reduce((v, p) => v + p[1], 0) / both.length;
  let best = both[0], bd = Infinity;
  for (const p of both) { const d = Math.hypot(p[0] - mx, p[1] - mz); if (d < bd - 1e-9) { bd = d; best = p; } }
  return [best[0], best[1]];
}
/**
 * The fight-ground piece a body's feet at (x, y, z) stand on, `pad` m about its plan: with a height, the highest at or below
 * it plus EG_GROUND_UNDER_M whose top it is no more than EG_GROUND_OVER_M over (section 11.7's band - a member on a
 * chamber's arch, over its floor's plan, stands on none); with none (NaN), the lowest that holds it. Null: traversal ground.
 * @param {any} view @param {number} x @param {number} y @param {number} z @param {number} [pad]
 */
export function egGroundAt(view, x, y, z, pad = 0) {
  let best = null;
  const high = Number.isFinite(y);
  for (const f of view?.fl ?? []) {
    const fy = f.y ?? 0;
    if (high && !(fy <= y + EG_GROUND_UNDER_M && y - fy <= EG_GROUND_OVER_M)) continue;
    if (!holds(f, x, z, pad)) continue;
    if (!best || (high ? fy > (best.y ?? 0) : fy < (best.y ?? 0))) best = f;
  }
  return best;
}
/** EG-ZJ (section 23): a height on the wire is whole centimetres, as the law lays every height (section 9). */
const cm = (v) => Math.round(v * 100) / 100;
/**
 * EG-ZJ (sections 11.7 and 23) - A BODY'S FEET at (x, z) in hall `view` (egFightView's, or the spec): the fight ground under
 * it (egGroundAt, EG_PIECE_TOUCH_M about its plan) - in section 11.7's band about `y0`, where it stood, and with none in that
 * band the lowest that holds the plan (a leap up onto a perch, a fall off a lip); with no fight ground under it at all (a
 * body over the void, an object in a wall's alcove), `y0` kept, else `none`. Whole centimetres. Pure.
 * @param {any} view @param {number} x @param {number} z @param {number} [y0] @param {number} [none]
 */
export function egFeetAt(view, x, z, y0 = NaN, none = 0) {
  const f = (Number.isFinite(y0) ? egGroundAt(view, x, y0, z, EG_PIECE_TOUCH_M) : null) ?? egGroundAt(view, x, NaN, z, EG_PIECE_TOUCH_M);
  return cm(f ? f.y ?? 0 : Number.isFinite(y0) ? y0 : none);
}

// ── THE WALK GRAPH ──────────────────────────────────────────────────────────────────────────────────────────
/** The closest points of two pieces' cores (a disc's centre, a lane's segment): `[ax, az, bx, bz]`. */
function closest(a, b) {
  const seg = (f) => (f.t === 'd' ? [f.x, f.z, f.x, f.z] : [f.ax, f.az, f.bx, f.bz]);
  const [p1x, p1z, q1x, q1z] = seg(a), [p2x, p2z, q2x, q2z] = seg(b);
  const d1x = q1x - p1x, d1z = q1z - p1z, d2x = q2x - p2x, d2z = q2z - p2z, rx = p1x - p2x, rz = p1z - p2z;
  const A = d1x * d1x + d1z * d1z, E = d2x * d2x + d2z * d2z, Fv = d2x * rx + d2z * rz;
  let s = 0, t = 0;
  const cl = (v) => Math.max(0, Math.min(1, v));
  if (A <= 1e-9 && E <= 1e-9) { s = 0; t = 0; }
  else if (A <= 1e-9) { s = 0; t = cl(Fv / E); }
  else {
    const C = d1x * rx + d1z * rz;
    if (E <= 1e-9) { t = 0; s = cl(-C / A); }
    else {
      const Bv = d1x * d2x + d1z * d2z, den = A * E - Bv * Bv;
      s = den > 1e-9 ? cl((Bv * Fv - C * E) / den) : 0;
      t = (Bv * s + Fv) / E;
      if (t < 0) { t = 0; s = cl(-C / A); } else if (t > 1) { t = 1; s = cl((Bv - C) / A); }
    }
  }
  return [p1x + d1x * s, p1z + d1z * s, p2x + d2x * t, p2z + d2z * t];
}
const radius = (f) => (f.t === 'd' ? f.r : f.hw);
/** Where two pieces meet in plan (the middle of their overlap on the line between their cores), or null (apart). */
export function egPortalOf(a, b) {
  if (a.t === 'p' || b.t === 'p') return polyPortal(a, b);   // EG-HERO-LAY: a hero's fight floor
  const [ax, az, bx, bz] = closest(a, b), d = Math.hypot(bx - ax, bz - az), ra = radius(a), rb = radius(b);
  if (d > ra + rb + EG_PIECE_TOUCH_M) return null;
  if (d < 1e-6) return [ax, az];
  const k = Math.max(0, Math.min(d, (d - rb + ra) / 2)) / d;
  return [ax + (bx - ax) * k, az + (bz - az) * k];
}
/**
 * THE WALK GRAPH of a fight view (egFightView): its regions (`rg` - `{ f, side }`: a piece's index in `fl` and, for a disc
 * an arch splits, the half it is: -1 before the arch's wall in z, +1 past it, 0 unsplit), its nodes (`{ x, z, rg }`) and
 * their edges (`adj[i]` - `[j, metres]`; a drop's one way). Pure, cached on the view.
 * @param {any} view
 */
export function egWalkGraph(view) {
  const had = _graphs.get(view);
  if (had) return had;
  const fl = view?.fl ?? [];
  const arches = (view?.deco ?? []).filter((d) => d.t === 'arch');
  /** @type {{ f: number, side: number }[]} */
  const rg = [];
  /** the arch splitting piece f, if any */
  const archOf = fl.map((f) => (f.t === 'd' ? arches.find((d) => Math.abs(d.x - f.x) < 0.05 && Math.abs(d.z - f.z) < 0.05) ?? null : null));
  const rgOf = fl.map((f, i) => (archOf[i] ? [rg.push({ f: i, side: -1 }) - 1, rg.push({ f: i, side: 1 }) - 1] : [rg.push({ f: i, side: 0 }) - 1]));
  /** the region of piece i a point stands in (an arch's half by its z) */
  const regionIn = (i, z) => (archOf[i] ? rgOf[i][z < archOf[i].z ? 0 : 1] : rgOf[i][0]);
  /** @type {{ x: number, z: number, rg: number }[]} */
  const nodes = [];
  /** @type {Array<Array<[number, number]>>} */
  const adj = [];
  const node = (x, z, r) => { nodes.push({ x, z, rg: r }); adj.push([]); return nodes.length - 1; };
  const edge = (a, b, w, both = true) => { adj[a].push([b, w]); if (both) adj[b].push([a, w]); };
  for (let a = 0; a < fl.length; a++) for (let b = a + 1; b < fl.length; b++) {
    const A = fl[a], Bp = fl[b], dy = (A.y ?? 0) - (Bp.y ?? 0);
    if (Math.abs(dy) > EG_DROP_M) continue;
    const P = egPortalOf(A, Bp);
    if (!P) continue;
    const na = node(P[0], P[1], regionIn(a, P[1])), nb = node(P[0], P[1], regionIn(b, P[1]));
    if (Math.abs(dy) <= EG_LEVEL_M) edge(na, nb, 0);
    else edge(dy > 0 ? na : nb, dy > 0 ? nb : na, 0.5, false);   // the higher stepped off onto the lower, never climbed
  }
  // a stair: its foot on the floor at its low end, its top on the floor at its high end
  const at = (x, z, y, pad = EG_PIECE_TOUCH_M + 0.3) => { let k = -1; for (let i = 0; i < fl.length; i++) if (Math.abs((fl[i].y ?? 0) - y) <= EG_LEVEL_M && holds(fl[i], x, z, pad) && (k < 0 || (fl[i].y ?? 0) > (fl[k].y ?? 0))) k = i; return k; };
  const inHero = (x, z) => (view?.heroes ?? []).some((h) => x >= h.box[0] && x <= h.box[3] && z >= h.box[2] && z <= h.box[5]);
  for (const q of view?.ramps ?? []) {
    if (inHero((q.ax + q.bx) / 2, (q.az + q.bz) / 2)) continue;   // AUDIT EG V: a hero's stair is joined by its own corners (below)
    const lo = at(q.ax, q.az, q.y0), hi = at(q.bx, q.bz, q.y1);
    if (lo < 0 || hi < 0) continue;
    edge(node(q.ax, q.az, regionIn(lo, q.az)), node(q.bx, q.bz, regionIn(hi, q.bz)), Math.hypot(q.bx - q.ax, q.bz - q.az));
  }
  // AUDIT EG V (lane5 #1; section 11.7): A HERO'S STAIR JOINED AT ITS OWN EDGES - its foot the point of its low edge nearest the
  // edge's middle that stands on a floor of its height (EG_PIECE_TOUCH_M about), its top the same of its high edge: the Eclipse
  // Vault's stairs run along their floor's open chord, so the middle of their low corners (the spec's `ramps`) hangs 1.5 m off
  // the floor, and its galleries stood cut off from every walker
  const ALONG = [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8, 0.1, 0.9, 0, 1];
  const edgeFoot = (ps, y) => {
    if (ps.length < 2) return null;
    for (const t of ALONG) { const x = ps[0][0] + (ps[1][0] - ps[0][0]) * t, z = ps[0][2] + (ps[1][2] - ps[0][2]) * t, k = at(x, z, y, EG_PIECE_TOUCH_M); if (k >= 0) return [x, z, k]; }
    return null;
  };
  for (const h of view?.heroes ?? []) for (const q of h.ramps ?? []) {
    const ys = q.poly.map((p) => p[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const lo = edgeFoot(q.poly.filter((p) => p[1] === y0), y0), hi = edgeFoot(q.poly.filter((p) => p[1] === y1), y1);
    if (!lo || !hi) continue;
    edge(node(lo[0], lo[1], regionIn(lo[2], lo[1])), node(hi[0], hi[1], regionIn(hi[2], hi[1])), Math.hypot(hi[0] - lo[0], hi[1] - lo[1]));
  }
  // an arch's gap: its two halves meet there alone
  for (let i = 0; i < fl.length; i++) if (archOf[i]) { const d = archOf[i]; edge(node(d.x, d.z - 0.8, rgOf[i][0]), node(d.x, d.z + 0.8, rgOf[i][1]), 1.6); }
  // EG-HERO-LAY: a hero's law graph joined - its nodes on its fight ground, its edges, a node at each socket's foot
  const heroRg = (x, z, y) => { let k = -1; for (let i = 0; i < fl.length; i++) if (fl[i].t === 'p' && Math.abs((fl[i].y ?? 0) - y) <= EG_LEVEL_M && holds(fl[i], x, z, EG_PIECE_TOUCH_M) && (k < 0 || (fl[i].y ?? 0) > (fl[k].y ?? 0))) k = i; return k < 0 ? -1 : rgOf[k][0]; };
  for (const q of view?.heroes ?? []) {
    const at = q.graph.nodes.map(([x, y, z]) => { const k = heroRg(x, z, y); return k < 0 ? -1 : node(x, z, k); });
    for (const [a, b] of q.graph.edges) if (at[a] >= 0 && at[b] >= 0) edge(at[a], at[b], Math.hypot(nodes[at[b]].x - nodes[at[a]].x, nodes[at[b]].z - nodes[at[a]].z));
    for (const so of [q.sockets.in, ...q.sockets.out]) { const k = heroRg(so.x, so.z, so.y); if (k >= 0) node(so.x, so.z, k); }
  }
  // within a region every node sees every other (each disc and lane is convex; EG-HERO-LAY: a polygon's where the way stays
  // on it): a straight walk between them
  for (let a = 0; a < nodes.length; a++) for (let b = a + 1; b < nodes.length; b++) if (nodes[a].rg === nodes[b].rg && seesRg(view, rg, nodes[a].rg, nodes[a].x, nodes[a].z, nodes[b].x, nodes[b].z)) edge(a, b, Math.hypot(nodes[b].x - nodes[a].x, nodes[b].z - nodes[a].z));
  const G = { rg, nodes, adj, archOf };
  _graphs.set(view, G);
  return G;
}
/** EG-HERO-LAY: does a straight walk inside region k (of regions `rg`) stay on it - always on a disc or a lane (each convex),
 *  on a polygon where egSeesIn says so? */
function seesRg(view, rg, k, ax, az, bx, bz) { const f = view.fl[rg[k].f]; return f.t !== 'p' || egSeesIn(f.poly, ax, az, bx, bz); }
/** Does region k of graph G hold (x, z), `pad` m about? */
function inRegion(view, G, k, x, z, pad = 0) {
  const R = G.rg[k], f = view.fl[R.f];
  if (!f || !holds(f, x, z, pad)) return false;
  return R.side === 0 || (R.side < 0 ? z <= G.archOf[R.f].z + pad : z >= G.archOf[R.f].z - pad);
}
/**
 * The region a point stands in: `hint` when it still holds it, EG_NODE_REACH_M about (AUDIT EG IV: a node on a region's very
 * rim - a Deepway champion chamber's stair's top on its balcony's - is reached from that far off it, and its region is the
 * body's then; held any closer, the body was told the floor's and walked back down the stair for ever); else by plan (with a
 * height, section 11.7's band - the highest; with none, the lowest). With none holding it, the nearest region (a body over the void, a member off the
 * floors) - `[k, inside]`.
 * @param {any} view @param {any} G @param {number} x @param {number} z @param {number} [y] @param {number} [hint]
 */
export function egRegionAt(view, G, x, z, y = NaN, hint = -1) {
  if (hint >= 0 && hint < G.rg.length && inRegion(view, G, hint, x, z, EG_NODE_REACH_M)) return [hint, true];
  let best = -1, bestY = 0;
  const high = Number.isFinite(y);
  for (let k = 0; k < G.rg.length; k++) {
    if (!inRegion(view, G, k, x, z, 0.3)) continue;
    const fy = view.fl[G.rg[k].f].y ?? 0;
    if (high && !(fy <= y + EG_GROUND_UNDER_M && y - fy <= EG_GROUND_OVER_M)) continue;
    if (best < 0 || (high ? fy > bestY : fy < bestY)) { best = k; bestY = fy; }
  }
  if (best >= 0) return [best, true];
  let bd = Infinity;
  for (let k = 0; k < G.rg.length; k++) {
    const f = view.fl[G.rg[k].f], d = f.t === 'p' ? egPolyDist(f.poly, x, z) : f.t === 'd' ? Math.hypot(x - f.x, z - f.z) - f.r : segDist(x, z, f.ax, f.az, f.bx, f.bz) - f.hw;
    const dz = G.rg[k].side === 0 ? 0 : Math.max(0, G.rg[k].side < 0 ? z - G.archOf[G.rg[k].f].z : G.archOf[G.rg[k].f].z - z);
    if (Math.max(d, dz) < bd) { bd = Math.max(d, dz); best = k; }
  }
  return [best, false];
}
/** The point of region k nearest (x, z), `inset` m inside its edge (and off its arch's wall). */
export function egKeepInRegion(view, G, k, x, z, inset = 0) {
  const R = G.rg[k], f = view.fl[R.f];
  let px = x, pz = z;
  if (f.t === 'p') [px, pz] = egPolyKeep(f.poly, x, z, inset);   // EG-HERO-LAY: a hero's fight floor
  else if (f.t === 'd') {
    const dx = x - f.x, dz = z - f.z, d = Math.hypot(dx, dz), r = Math.max(0, f.r - inset);
    if (d > r) { px = f.x + (dx / (d || 1)) * r; pz = f.z + (dz / (d || 1)) * r; }
  } else {
    const ex = f.bx - f.ax, ez = f.bz - f.az, L2 = ex * ex + ez * ez, t = L2 > 0 ? Math.max(0, Math.min(1, ((x - f.ax) * ex + (z - f.az) * ez) / L2)) : 0;
    const sx = f.ax + ex * t, sz = f.az + ez * t, d = Math.hypot(x - sx, z - sz), w = Math.max(0, f.hw - inset);
    if (d > w) { px = sx + ((x - sx) / (d || 1)) * w; pz = sz + ((z - sz) / (d || 1)) * w; }
  }
  if (R.side !== 0) { const az = G.archOf[R.f].z, m = 0.4 + inset; pz = R.side < 0 ? Math.min(pz, az - m) : Math.max(pz, az + m); }
  return [px, pz];
}
/**
 * EG-ZK's rule, given its one home here by EG-ZQ (section 11.7; EG-ZK's departure 7) - THE WAY ON IS KEPT ONLY WHILE IT IS
 * WALKED: the node body `b` headed to (`b.wn`) is a way on only while its walk (`b.mv`) still goes to it. Set down since - a
 * Breaker's charge cut at an arch's wall, a push, a pull, a lord's blow, leap or blink, a straight walk - it keeps none, so
 * egWalkNext never walks it straight from where it stands to a far gap node through the wall; one it stands at is reached:
 * its region the body's now (a stair's top, its upper floor's) and its feet on that floor. Every graph walker asks it before
 * its next step, the legion (net/egLegion.js walkGraph) and the lords (net/egLords.js lordWalk) alike. Moves `b.wn`, `b.fr`
 * and `b.y` in place.
 * @param {any} view @param {any} b @param {any} [G]
 */
export function egWayOn(view, b, G = egWalkGraph(view)) {
  const wn = Number.isInteger(b.wn) && b.wn >= 0 ? G.nodes[b.wn] ?? null : null;
  if (!wn || (b.mv && Math.abs(b.mv.tx - wn.x) <= 0.011 && Math.abs(b.mv.tz - wn.z) <= 0.011)) return;
  if (Math.hypot(wn.x - b.x, wn.z - b.z) <= EG_NODE_REACH_M) { b.fr = wn.rg; b.y = cm(view.fl[G.rg[wn.rg].f]?.y ?? 0); }
  b.wn = -1;
}
/**
 * THE LEGION'S NEXT STEP over hall `view`'s walk graph: where body `b` (at b.x, b.z, its region kept on it as `b.fr` and
 * the node it walks to as `b.wn`)
 * walks next toward (gx, gz) (`gy` its height when known - a member's feet): the goal (kept `inset` inside the region it
 * stands in) when that is the body's region; else the first node of the shortest way, each node it has reached moving
 * `b.fr` on; with no way, the point of its own region nearest the goal. Answers `[x, z, last]` - `last` true when it is
 * the goal (or the nearest it can come).
 * EG-ZQ (sections 8.3 and 12): a PINNED walker (`b.pinned` - a Rampart's Caster on its pillar) keeps to the region it stands
 * in, whatever that region's edge overlaps or overlies: its goal is kept inside it and no way off is walked (a pillar whose
 * plan meets a bastion's has a lip onto it).
 * A view with no fight ground answers the goal (free). Moves `b.fr` in place.
 * @param {any} view @param {any} b @param {number} gx @param {number} gz @param {number} [gy] @param {number} [inset]
 * @returns {[number, number, boolean]}
 */
export function egWalkNext(view, b, gx, gz, gy = NaN, inset = 0) {
  if (!view?.fl?.length) return [gx, gz, true];
  const G = egWalkGraph(view);
  // the node it was walking to, reached: it stands in that node's region now (a stair's top is its upper floor's, though the
  // floor below holds the same plan)
  const wi = Number.isInteger(b.wn) ? b.wn : -1;
  let wn = wi >= 0 ? G.nodes[wi] ?? null : null;
  if (wn && Math.hypot(wn.x - b.x, wn.z - b.z) <= EG_NODE_REACH_M) { b.fr = wn.rg; wn = null; }
  b.wn = -1;
  const [from] = egRegionAt(view, G, b.x, b.z, Number.isFinite(b.y) ? b.y : NaN, Number.isInteger(b.fr) ? b.fr : -1);   // EG-ZJ: by its own feet (a Caster on its pillar's top, never the walkway its plan overlaps)
  b.fr = from;
  const to = b.pinned ? from : egRegionAt(view, G, gx, gz, gy)[0];   // EG-ZQ: a pinned walker's ground is its own region
  const goal = egKeepInRegion(view, G, to, gx, gz, inset);   // `inset` in, as net/egLaw.js egKeepOnFight keeps a walker
  const sees = (k, ax, az, bx, bz) => seesRg(view, G.rg, k, ax, az, bx, bz);   // EG-HERO-LAY: a polygon's way straight only where it stays on it
  if (to === from && sees(from, b.x, b.z, goal[0], goal[1])) return [goal[0], goal[1], true];
  // Dijkstra from the body (a source joined to every node of its region it sees) to the goal (joined from every node of its
  // own that sees it)
  const N = G.nodes.length, dist = new Array(N).fill(Infinity), prev = new Array(N).fill(-1), done = new Array(N).fill(false);
  for (let i = 0; i < N; i++) if (G.nodes[i].rg === from && sees(from, b.x, b.z, G.nodes[i].x, G.nodes[i].z)) dist[i] = Math.hypot(G.nodes[i].x - b.x, G.nodes[i].z - b.z);
  // the node it was already walking to (along a stair, out of a portal) is a way on from where it stands
  if (wn && dist[wi] > Math.hypot(wn.x - b.x, wn.z - b.z)) dist[wi] = Math.hypot(wn.x - b.x, wn.z - b.z);
  let end = -1, endCost = Infinity;
  for (;;) {
    let u = -1;
    for (let i = 0; i < N; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || dist[u] >= endCost) break;
    done[u] = true;
    if (G.nodes[u].rg === to && sees(to, G.nodes[u].x, G.nodes[u].z, goal[0], goal[1])) { const c = dist[u] + Math.hypot(goal[0] - G.nodes[u].x, goal[1] - G.nodes[u].z); if (c < endCost) { endCost = c; end = u; } }
    for (const [v, w] of G.adj[u]) if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; }
  }
  if (end < 0) { const p = egKeepInRegion(view, G, from, gx, gz, inset); return [p[0], p[1], true]; }
  const path = [];
  for (let u = end; u >= 0; u = prev[u]) path.unshift(u);
  for (const u of path) {
    const n = G.nodes[u];
    if (Math.hypot(n.x - b.x, n.z - b.z) > EG_NODE_REACH_M) { b.wn = u; return [n.x, n.z, false]; }
    b.fr = n.rg;   // reached: the body stands in the node's region now
  }
  return [goal[0], goal[1], true];
}
/**
 * EG-ZJ (sections 11.7 and 23) - A GRAPH WALKER'S FEET once egWalkNext has moved it on: the floor of the region it stands in
 * (`b.fr`) and the floor its next walk ends on - its node's region (`b.wn`: a stair's top, a portal past a lip), else its own
 * (egWalkNext keeps the goal inside the region it stands in) - `[y, ty]`, whole centimetres; null with no region (a view
 * with no fight ground). A stair's walk climbs from the one to the other. Pure.
 * @param {any} view @param {any} b
 * @returns {[number, number] | null}
 */
export function egWalkFeet(view, b) {
  if (!view?.fl?.length || !Number.isInteger(b?.fr) || b.fr < 0) return null;
  const G = egWalkGraph(view), at = (k) => cm(view.fl[G.rg[k]?.f]?.y ?? 0), n = Number.isInteger(b.wn) && b.wn >= 0 ? G.nodes[b.wn] ?? null : null;
  return [at(b.fr), at(n ? n.rg : b.fr)];
}
/** Does the straight walk from (ax, az) to (bx, bz) cross an arch's wall? Where it first meets one, else null (a
 *  Breaker's run is cut there). */
export function egArchCut(view, ax, az, bx, bz) {
  let best = null, bt = Infinity;
  for (const d of (view?.deco ?? []).filter((q) => q.t === 'arch')) {
    if ((az - d.z) * (bz - d.z) >= 0 || Math.abs(bz - az) < 1e-9) continue;
    const t = (d.z - az) / (bz - az), x = ax + (bx - ax) * t;
    if (Math.abs(x - d.x) <= d.w / 2 || Math.abs(x - d.x) > d.r + 1) continue;
    if (t < bt) { bt = t; best = [ax + (bx - ax) * t, d.z]; }
  }
  return best;
}

// ── THE AIR ──────────────────────────────────────────────────────────────────────────────────────────────────
/**
 * THE AIR of hall `spec`: the rock a flier cannot pass, as wall segments (`[ax, az, bx, bz]`) - each covered passage's rock
 * mass beside its tunnel, each arch's wall either side of its gap, each chamber's wall ring but where the course comes in
 * and goes on - and the ways about them (`ways` - the mouths, the rock's corners, the gaps, EG_AIR_CLEAR_M off), with the
 * ways' sight of each other. Pure, cached on the spec.
 * @param {any} spec
 */
export function egAirOf(spec) {
  const had = _airs.get(spec);
  if (had) return had;
  /** @type {number[][]} */
  const walls = [], ways = [];
  const C = EG_AIR_CLEAR_M;
  for (const q of spec?.caves ?? []) {
    if (q.open) continue;
    for (const s of [-1, 1]) {
      const x0 = q.x + s * q.halfW, x1 = q.x + s * (q.halfW + EG_ROCK_M);
      walls.push([x0, q.z0, x0, q.z1], [x1, q.z0, x1, q.z1], [x0, q.z0, x1, q.z0], [x0, q.z1, x1, q.z1]);
      ways.push([x1 + s * C, q.z0 - C], [x1 + s * C, q.z1 + C]);
    }
    ways.push([q.x, q.z0 - C], [q.x, q.z1 + C]);
  }
  for (const d of spec?.deco ?? []) {
    if (d.t === 'arch') {
      // its wall runs to the disc's rim and a metre past (world/egHall.js archParts), met by the ring's - no slot between
      for (const s of [-1, 1]) walls.push([d.x + s * (d.w / 2), d.z, d.x + s * (d.r + 2), d.z]);
      ways.push([d.x, d.z - C], [d.x, d.z + C]);
    } else if (d.t === 'wall') {
      // the ring as drawn (world/egHall.js): 32 faces, but those where the course comes in (-z) and goes on (+z)
      for (let k = 0; k < 32; k++) {
        const a0 = (k / 32) * Math.PI * 2, a1 = ((k + 1) / 32) * Math.PI * 2;
        if (Math.abs(Math.sin((a0 + a1) / 2)) < 0.2) continue;
        walls.push([d.x + Math.sin(a0) * d.r, d.z + Math.cos(a0) * d.r, d.x + Math.sin(a1) * d.r, d.z + Math.cos(a1) * d.r]);
      }
      for (const s of [-1, 1]) ways.push([d.x, d.z + s * (d.r - C)], [d.x, d.z + s * (d.r + C)]);
    }
  }
  // EG-HERO-LAY: a hero's walls - every edge of its floors its law does not open - and the ways in and out at its sockets
  for (const q of spec?.heroes ?? []) {
    const open = new Set(q.open.map((e) => `${e[0]}:${e[1]}`));
    q.floors.forEach((f, fi) => f.poly.forEach((p, e) => { if (!open.has(`${fi}:${e}`)) { const n = f.poly[(e + 1) % f.poly.length]; walls.push([p[0], p[1], n[0], n[1]]); } }));
    ways.push([q.sockets.in.x, q.sockets.in.z - C], [q.sockets.in.x, q.sockets.in.z + C]);
    for (const o of q.sockets.out) ways.push([o.x, o.z - C], [o.x, o.z + C]);
  }
  const A = { walls, ways, sees: /** @type {boolean[][]} */ ([]) };
  A.sees = ways.map((p) => ways.map((q) => egAirClear(A, p[0], p[1], q[0], q[1])));
  _airs.set(spec, A);
  return A;
}
/** Do two segments cross (their interiors - touching at an end is no crossing)? */
function crosses(ax, az, bx, bz, cx, cz, dx, dz) {
  const o = (px, pz, qx, qz, rx, rz) => (qx - px) * (rz - pz) - (qz - pz) * (rx - px);
  const d1 = o(cx, cz, dx, dz, ax, az), d2 = o(cx, cz, dx, dz, bx, bz), d3 = o(ax, az, bx, bz, cx, cz), d4 = o(ax, az, bx, bz, dx, dz);
  return ((d1 > 1e-9 && d2 < -1e-9) || (d1 < -1e-9 && d2 > 1e-9)) && ((d3 > 1e-9 && d4 < -1e-9) || (d3 < -1e-9 && d4 > 1e-9));
}
/** Is the air between two points clear of every wall of `air` (egAirOf)? */
export function egAirClear(air, ax, az, bx, bz) {
  for (const w of air.walls) if (crosses(ax, az, bx, bz, w[0], w[1], w[2], w[3])) return false;
  return true;
}
/**
 * A FLIER'S NEXT POINT from (fx, fz) toward (tx, tz) over hall `spec`: the target when the air between is clear, else the
 * first way of the fewest metres about the rock (each way's sight of the next clear); with no way, the target (the flier
 * presses on and the next beat tries again). `[x, z]`.
 * @param {any} spec @param {number} fx @param {number} fz @param {number} tx @param {number} tz
 * @returns {[number, number]}
 */
export function egAirNext(spec, fx, fz, tx, tz) {
  const A = egAirOf(spec);
  if (!A.walls.length || egAirClear(A, fx, fz, tx, tz)) return [tx, tz];
  const W = A.ways, N = W.length, dist = new Array(N).fill(Infinity), prev = new Array(N).fill(-1), done = new Array(N).fill(false);
  for (let i = 0; i < N; i++) if (egAirClear(A, fx, fz, W[i][0], W[i][1])) dist[i] = Math.hypot(W[i][0] - fx, W[i][1] - fz);
  let end = -1, endCost = Infinity;
  for (;;) {
    let u = -1;
    for (let i = 0; i < N; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || dist[u] >= endCost) break;
    done[u] = true;
    if (egAirClear(A, W[u][0], W[u][1], tx, tz)) { const c = dist[u] + Math.hypot(tx - W[u][0], tz - W[u][1]); if (c < endCost) { endCost = c; end = u; } }
    for (let v = 0; v < N; v++) if (v !== u && A.sees[u][v]) { const c = dist[u] + Math.hypot(W[v][0] - W[u][0], W[v][1] - W[u][1]); if (c < dist[v]) { dist[v] = c; prev[v] = u; } }
  }
  if (end < 0) return [tx, tz];
  let u = end;
  while (prev[u] >= 0) u = prev[u];
  return [W[u][0], W[u][1]];
}
/** A point kept out of a covered passage's rock (a flier's spot or goal): inside its rock mass, moved into its tunnel. */
export function egAirKeep(spec, x, z) {
  for (const q of spec?.caves ?? []) {
    if (q.open || z < q.z0 || z > q.z1) continue;
    const d = x - q.x;
    if (Math.abs(d) > q.halfW && Math.abs(d) < q.halfW + EG_ROCK_M) return [q.x + Math.sign(d) * Math.max(0, q.halfW - 0.6), z];
  }
  return [x, z];
}
