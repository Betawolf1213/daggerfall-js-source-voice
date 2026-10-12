// @ts-check
// EG-ZG (2026-10-12, Mac: "I said I want everything"; bible/11-Multiplayer/Elite-Gates.md sections 11.7, 25.2, 25.4, 25.5,
// 25.6 and 25.8 - EG6b, and what EG-G2, EG-G1 and EG-H1 left for the screen): THE TELEGRAPHS AS WRITTEN, AS LAW - every
// rule the Spire's fight draws its warnings by, pure, so a test holds each one and a pass only draws it:
//   THE TELEGRAPHS PER FIGHT FLOOR (section 11.7) - each fight floor (`spec.fl`) triangulated once (a disc's 48 sides, the
//     drawn rim's own - world/sdRealm.js SD_ISLAND_SIDES; a lane's rectangle and its two round ends, the floor test's own
//     capsule - net/egLaw.js egOnFight), each shape drawn on every floor it covers - clipped on the CPU to the shape's bounds
//     (render/gateTelegraph.js telegraphBounds), only at the heights it lands on (the relay's own rule: the floors whose plan
//     holds its anchor, net/bossRef.js floorsUnder) - at most THE TELEGRAPH BUDGET's 32 shape-floor draws a frame, in its
//     order (mine and what holds my feet first, then the blows in net/egShape.js egShapeOrder's rank, then the nearest);
//   THE PERIL ARROW (section 25.5) - the soonest blow on my feet, its way out searched over my own fight floor (never across
//     a wall or an open edge), preferring a bearing that clears every other pending shape, and a CHECK with no exit its
//     order instead;
//   THE TWO TETHER GRAMMARS, A SPIRE POOL, THE ECLIPSE (sections 25.2 and 25.5), the marks' sigils over heads (section 13.2),
//     a Vestige aura's ring (section 25.4), THE SHADE'S RIM LIGHT (section 25.6), and WEIGHT (section 25.8): the heavy blows'
//     shakes, allies' hits at 0.4, a Drop's thud and dust.
//   EG-ZJ (2026-10-12): A HAZARD'S OWN SURFACE (egHazardSurface) - the traversal ground's hazards and the Cooling Slag's spill
//     drawn as one quad at their own height, never clipped onto a fight floor near them.
//
// Not a DFU member. Ledger A (ELITE-GATES).
import { telegraphBounds, telegraphField, TELEGRAPH_KIND, TELEGRAPH_NOW_MS } from '../render/gateTelegraph.js';
import { egInShape, segDist } from '../net/egShape.js';
import { egHazardParts, EG_HAZARDS } from '../net/egFragLaw.js';
import { egFightFloorAt } from '../net/egFair.js';
import { EG_FL } from '../net/egBodies.js';
import { EG_VESTIGES } from '../net/egVestige.js';
import { gateHitFlash } from './gateBoss.js';
import { EG_BAND_RAMPS } from './egBandArt.js';
import { SD_ISLAND_SIDES } from './sdRealm.js';

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// ── THE TELEGRAPHS PER FIGHT FLOOR (section 11.7, EG6b) ─────────────────────────────────────────────────────────
/** THE TELEGRAPH BUDGET's floor half (section 25.4): the most shape-floor draws a frame; a lane's round ends' sides each;
 *  how far past a floor's plan a shape's anchor still lands on it (m - the relay's own margin, net/bossRef.js floorsUnder). */
export const EG_FLOOR_DRAWS_MAX = 32;
export const EG_FLOOR_CAP_SIDES = 12;
export const EG_FLOOR_NEAR_M = 1;
/** Does fight floor piece `f` (spec.fl's - a disc `d` or a lane `l`) hold (x, z), `pad` m about? */
const holds = (f, x, z, pad = 0) => (f.t === 'd' ? Math.hypot(x - f.x, z - f.z) <= f.r + pad : segDist(x, z, f.ax, f.az, f.bx, f.bz) <= f.hw + pad);

/**
 * EACH FIGHT FLOOR, TRIANGULATED ONCE (the hall's frame - x, z pairs, three a triangle): `[{ y, tris, box, cx, cz, R, piece,
 * over }]` - `box` [x0, z0, x1, z1], (`cx`, `cz`) and `R` the circle the floor stands in (its rim for a disc, its ends for a
 * lane), `over` that circle as the telegraph pass's court for the floor's draws (its `floor` - { r, courts }). A disc is its
 * drawn rim's 48 sides; a lane its rectangle and two round ends (net/egLaw.js egOnFight's capsule). None for a hall with no
 * fight floor. Pure.
 */
export function egFightFloors(spec) {
  const out = [];
  for (const f of spec?.fl ?? []) {
    const v = [];
    const tri = (ax, az, bx, bz, cx, cz) => v.push(ax, az, bx, bz, cx, cz);
    const fan = (x, z, r, a0, a1, n) => { for (let k = 0; k < n; k++) { const p = a0 + ((a1 - a0) * k) / n, q = a0 + ((a1 - a0) * (k + 1)) / n; tri(x, z, x + Math.sin(p) * r, z + Math.cos(p) * r, x + Math.sin(q) * r, z + Math.cos(q) * r); } };
    if (f.t === 'd') {
      fan(f.x, f.z, f.r, 0, Math.PI * 2, SD_ISLAND_SIDES);
      out.push({ y: f.y ?? 0, tris: new Float32Array(v), box: [f.x - f.r, f.z - f.r, f.x + f.r, f.z + f.r], cx: f.x, cz: f.z, R: f.r, piece: f, over: Object.freeze({ r: f.r, courts: Object.freeze([Object.freeze([f.x, f.z])]) }) });
      continue;
    }
    const dx = f.bx - f.ax, dz = f.bz - f.az, L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L, nx = -uz * f.hw, nz = ux * f.hw;
    tri(f.ax + nx, f.az + nz, f.bx + nx, f.bz + nz, f.bx - nx, f.bz - nz);
    tri(f.ax + nx, f.az + nz, f.bx - nx, f.bz - nz, f.ax - nx, f.az - nz);
    const head = Math.atan2(ux, uz);
    fan(f.bx, f.bz, f.hw, head - Math.PI / 2, head + Math.PI / 2, EG_FLOOR_CAP_SIDES);   // its far end, round
    fan(f.ax, f.az, f.hw, head + Math.PI / 2, head + (Math.PI * 3) / 2, EG_FLOOR_CAP_SIDES);   // its near end
    const cx = (f.ax + f.bx) / 2, cz = (f.az + f.bz) / 2, R = L / 2 + f.hw;
    out.push({ y: f.y ?? 0, tris: new Float32Array(v), box: [Math.min(f.ax, f.bx) - f.hw, Math.min(f.az, f.bz) - f.hw, Math.max(f.ax, f.bx) + f.hw, Math.max(f.az, f.bz) + f.hw],
      cx, cz, R, piece: f, over: Object.freeze({ r: R, courts: Object.freeze([Object.freeze([cx, cz])]) }) });
  }
  return out;
}

const _pa = [], _pb = [];
/** One polygon (x, z flat in `src`, `n` points) cut to the side of axis `ax` (0 x, 1 z) where `sign` * (v - `at`) >= 0, into
 *  `dst`. Answers its points. */
function cutPoly(src, n, dst, ax, at, sign) {
  let m = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, a = src[i * 2 + ax], b = src[j * 2 + ax], ina = sign * (a - at) >= 0, inb = sign * (b - at) >= 0;
    if (ina) { dst[m * 2] = src[i * 2]; dst[m * 2 + 1] = src[i * 2 + 1]; m++; }
    if (ina !== inb) {
      const k = (at - a) / (b - a);
      dst[m * 2] = src[i * 2] + (src[j * 2] - src[i * 2]) * k; dst[m * 2 + 1] = src[i * 2 + 1] + (src[j * 2 + 1] - src[i * 2 + 1]) * k;
      dst[m * 2 + ax] = at; m++;
    }
  }
  return m;
}
/**
 * A floor's triangles (`tris`, x, z pairs) clipped to `box` [x0, z0, x1, z1] (null: whole) into `out` from float `at` -
 * each triangle cut to the box's four sides (Sutherland-Hodgman) and fanned back to triangles. `out` must hold five
 * triangles a triangle more. Answers the next float. Pure but for `out`.
 * @param {Float32Array|number[]} tris @param {number[]|null} box @param {Float32Array} out @param {number} at
 */
export function egClipTris(tris, box, out, at) {
  let w = at;
  for (let t = 0; t + 5 < tris.length; t += 6) {
    if (!box) { for (let k = 0; k < 6; k++) out[w++] = tris[t + k]; continue; }
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    for (let k = 0; k < 6; k += 2) { x0 = Math.min(x0, tris[t + k]); x1 = Math.max(x1, tris[t + k]); z0 = Math.min(z0, tris[t + k + 1]); z1 = Math.max(z1, tris[t + k + 1]); }
    if (x1 < box[0] || x0 > box[2] || z1 < box[1] || z0 > box[3]) continue;
    if (x0 >= box[0] && x1 <= box[2] && z0 >= box[1] && z1 <= box[3]) { for (let k = 0; k < 6; k++) out[w++] = tris[t + k]; continue; }
    for (let k = 0; k < 6; k++) _pa[k] = tris[t + k];
    let n = cutPoly(_pa, 3, _pb, 0, box[0], 1);
    n = cutPoly(_pb, n, _pa, 0, box[2], -1);
    n = cutPoly(_pa, n, _pb, 1, box[1], 1);
    n = cutPoly(_pb, n, _pa, 1, box[3], -1);
    for (let k = 1; k + 1 < n; k++) { out[w++] = _pa[0]; out[w++] = _pa[1]; out[w++] = _pa[k * 2]; out[w++] = _pa[k * 2 + 1]; out[w++] = _pa[k * 2 + 2]; out[w++] = _pa[k * 2 + 3]; }
  }
  return w;
}

/**
 * The fight floors' heights a shape lands on - those whose plan holds its anchor within EG_FLOOR_NEAR_M (its centre; a
 * lane's two ends; each of a discs' points) - as the relay judges a blow (net/bossRef.js floorsUnder); null: any (the
 * whole floor's, the spokes', or an anchor over no floor's plan). Pure.
 * @param {ReturnType<typeof egFightFloors>} floors @param {any} sh
 * @returns {Set<number>|null}
 */
export function egShapeYs(floors, sh) {
  if (sh.kind === TELEGRAPH_KIND.all || sh.kind === TELEGRAPH_KIND.spokes) return null;
  const pts = sh.kind === TELEGRAPH_KIND.discs ? sh.points : sh.kind === TELEGRAPH_KIND.lane ? [sh.origin, sh.end] : [sh.origin];
  const ys = new Set();
  for (const f of floors) for (const p of pts) if (holds(f.piece, p[0], p[1], EG_FLOOR_NEAR_M)) ys.add(f.y);
  return ys.size ? ys : null;
}

/**
 * EG-ZJ (section 11.7; EG-ZC's shafts) - A HAZARD'S OWN SURFACE: the height a fragment hazard's telegraph draws at as one quad
 * of its own (scenes/egFight.js `sh.y` - egFloorPlan's own-surface draw), or NaN for one drawn on the fight floors it covers.
 * A hazard of the traversal ground (`aim` 'trav': a fire fall, the Forge Line's hammers), and THE COOLING SLAG's spill, whose
 * lanes pour over a crossing's crust (a step of the course, never a fight floor) and its lip - in a Forge Gut's chasm and
 * down a Wellhead Deepway's Slag Chute, where no fight floor stands at all. Pure.
 * @param {any} hz the hazard as the spec says it
 */
export const egHazardSurface = (hz) => (EG_HAZARDS[hz?.kind]?.aim === 'trav' || hz?.kind === 'slag' ? hz.y ?? 0 : NaN);
/** How far my feet stand from a shape's ground (its bounds' box; nought inside it or for a whole floor's). */
function nearOf(sh, feet) {
  const B = telegraphBounds(sh);
  if (!B) return 0;
  return Math.hypot(Math.max(B[0] - feet[0], 0, feet[0] - B[2]), Math.max(B[1] - feet[1], 0, feet[1] - B[3]));
}
/**
 * THE FLOOR BUDGET (sections 11.7 and 25.4): the frame's shape-floor draws and every floor's clipped triangles in one
 * buffer. `shapes` the frame's (the look laid on - scenes/egFight.js egLookShapes), `floors` egFightFloors's, `feet` mine
 * [x, z] (the hall's frame; null: none), `buf` the kept buffer (grown here). Taken in THE TELEGRAPH BUDGET's order - mine and
 * every shape whose field holds my feet first, then the blows by egShapeOrder's rank (`sh.order` - a CHECK's havens keep
 * their CHECK's), then the nearest my feet, ties by place - each shape on every floor it covers at the heights it lands on,
 * until `max` draws. A shape with its own surface (`sh.y` - a span piece's, a holder's feet) is one draw of its own quad at
 * that height (`over` its own circle); in a hall with no fight floor every shape is (the hall's court, `over` null). Answers
 * `{ draws, buf, n }`: each draw `{ sh, f, first, count, over }` (`f` the floor, its vertices first..first+count; null: the
 * quad), mine last; `n` the floats written. Pure but for `buf`.
 * @param {any[]} shapes @param {ReturnType<typeof egFightFloors>} floors @param {number[]|null} feet @param {Float32Array|null} buf
 */
export function egFloorPlan(shapes, floors, feet, buf, max = EG_FLOOR_DRAWS_MAX) {
  const ranked = shapes.map((sh, i) => ({ sh, i, k0: sh.mine || (feet && telegraphField(sh, feet[0], feet[1]).inside) ? 0 : 1, k1: Number.isFinite(sh.order) ? sh.order : Infinity, k2: feet ? nearOf(sh, feet) : 0 }));
  ranked.sort((a, b) => a.k0 - b.k0 || a.k1 - b.k1 || a.k2 - b.k2 || a.i - b.i);
  let out = buf ?? new Float32Array(4096), n = 0;
  const draws = [];
  for (const r of ranked) {
    if (draws.length >= max) break;
    const sh = r.sh;
    if (!(sh.alpha > 0.001)) continue;
    const B = telegraphBounds(sh);
    if (Number.isFinite(sh.y) || !floors.length) {
      const over = Number.isFinite(sh.y) && B ? { r: Math.hypot(B[2] - B[0], B[3] - B[1]) / 2, courts: [[(B[0] + B[2]) / 2, (B[1] + B[3]) / 2]] } : null;
      draws.push({ sh, f: null, first: 0, count: 0, over, i: r.i });
      continue;
    }
    const ys = egShapeYs(floors, sh);
    for (const f of floors) {
      if (draws.length >= max) break;
      if (ys && !ys.has(f.y)) continue;
      if (B && (B[2] < f.box[0] || B[0] > f.box[2] || B[3] < f.box[1] || B[1] > f.box[3])) continue;
      if (out.length < n + f.tris.length * 5) { const grown = new Float32Array(Math.max(out.length * 2, n + f.tris.length * 5)); grown.set(out.subarray(0, n)); out = grown; }
      const at = n;
      n = egClipTris(f.tris, B, out, n);
      if (n > at) draws.push({ sh, f, first: at / 2, count: (n - at) / 2, over: null, i: r.i });
    }
  }
  draws.sort((a, b) => (a.sh.mine ? 1 : 0) - (b.sh.mine ? 1 : 0) || a.i - b.i);
  return { draws, buf: out, n };
}

// ── THE PERIL ARROW (section 25.5) ─────────────────────────────────────────────────────────────────────────────
/** THE PERIL ARROW's search: bearings, its step and reach (m), how far inside a floor's edge it keeps (m) - the gate's own
 *  numbers (scenes/gateCourt.js PERIL_BEARINGS, PERIL_STEP_M, PERIL_REACH_M, PERIL_RIM_M, restated here so this law never
 *  loads the court's scene; test/egz_telegraph.test.js holds them equal) - and a blow's last moment (TELEGRAPH_NOW_MS). */
export const EG_PERIL = Object.freeze({ bearings: 24, step: 0.25, reach: 20, rim: 0.4, nowMs: TELEGRAPH_NOW_MS });
/** A CHECK's order, shown in place of the arrow when no light is in reach (section 25.5). */
export const EG_CHECK_ORDER = 'Stand in the light!';
/** Is (x, z) on a fight floor at height `y`, `inset` m inside its edges? Pure. */
export function egOnFloorAt(spec, x, z, y, inset = 0) {
  for (const f of spec?.fl ?? []) if ((f.y ?? 0) === y && holds(f, x, z, -inset)) return true;
  return false;
}
const inStamps = (b, x, z) => b.s.some((s) => s[0] !== 'a' && egInShape(s, x, z));
/**
 * THE PERIL ARROW (section 25.5): of `pending` (`[{ s, at, wu, nm, ch }]` - the blows and the place's told hazards, each its
 * stamps), the soonest still to land whose shape holds my feet `f` ([x, z], the hall's frame; `fy` their height) - never a
 * whole floor's (no step escapes it) - and its way out, searched over MY fight floor along EG_PERIL's bearings: a bearing
 * stops at a wall or an open edge (the floor's own edge, never crossed), its exit the first point out of the shape, and a
 * bearing that also clears every other pending shape is preferred over a nearer one that does not. Answers `{ name, t, now,
 * check, dir, m }` (`dir` [dx, dz] or null - no way out in reach; `check` a CHECK, its order shown with no way) or null:
 * nothing on me, or I stand on no fight floor (traversal ground: no blow lands there). Pure.
 */
export function egPerilOf(pending, f, fy, spec, now) {
  if (!f || !spec) return null;
  const fl = egFightFloorAt(spec, f[0], fy, f[1]);
  if (!fl) return null;
  let best = null;
  for (const b of pending ?? []) {
    if (!(now < b.at) || now < b.at - b.wu || !inStamps(b, f[0], f[1])) continue;
    if (!best || b.at < best.at) best = b;
  }
  if (!best) return null;
  const y0 = fl.y ?? 0, P = EG_PERIL, others = (pending ?? []).filter((b) => b !== best && now < b.at);
  let exit = null, clear = null;
  for (let k = 0; k < P.bearings; k++) {
    const a = (k / P.bearings) * Math.PI * 2, dx = Math.sin(a), dz = Math.cos(a);
    let out = false;
    for (let m = P.step; m <= P.reach + 1e-9; m += P.step) {
      if (clear && m >= clear.m) break;
      const x = f[0] + dx * m, z = f[1] + dz * m;
      if (!egOnFloorAt(spec, x, z, y0, P.rim)) break;   // a wall, an open edge: never crossed
      if (!out && !inStamps(best, x, z)) { out = true; if (!exit || m < exit.m) exit = { dx, dz, m }; }
      if (out && !inStamps(best, x, z) && !others.some((b) => inStamps(b, x, z))) { if (!clear || m < clear.m) clear = { dx, dz, m }; break; }
    }
  }
  const way = clear ?? exit;
  return { name: best.nm || '', t: best.wu > 0 ? clamp01((now - (best.at - best.wu)) / best.wu) : 1, now: best.at - now <= P.nowMs, check: !!best.ch || best.s.some((s) => s[0] === 'h'),
    dir: way ? [way.dx, way.dz] : null, m: way ? way.m : null };
}

// ── THE TETHERS' TWO GRAMMARS (section 25.5) ───────────────────────────────────────────────────────────────────
/** A tether's grammar by its kind (`tx[2]` - net/egLegion.js, net/egLords.js): 0 a Wraith's drain and 1 a Blood Tether pull
 *  apart, 2 Morvayn's Chaining stays close; the stay-close's slack and break (m), the pull-apart's width at rest and at the
 *  break (its share of itself), how far past the break's tick its lane runs (m), the chain's half width (m), and how near
 *  its break a pull-apart of mine must have stood to SNAP when it goes (its glass - the share of the break). */
export const EG_TETHER = Object.freeze({ slack: 6, taut: 8, half: 0.35, thin: 0.25, past: 0.6, chainHalf: 0.3, snap: 0.85 });
export const egTetherKind = (tx) => (tx?.[2] === 2 ? 'close' : 'pull');
/** A tether's break (m): a drain's packs its reach and its break (`r` x 100 + `brk`, net/egLegion.js), the rest carry cm. */
export const egTetherBreak = (tx) => (tx?.[2] === 0 ? tx[3] % 100 : (tx?.[3] ?? 0) / 100);
/**
 * A PULL-APART TETHER between `a` and `b` ([x, z]), breaking at `brk` m: the shape's numbers - its lane run along the pair
 * from the middle as far as the pair or the break's tick (whichever is further), `r` the line's own half (the pair's), `r1`
 * the break's half (the tick), `halfW` thinning to EG_TETHER.thin of itself as the pair nears the break. Pure.
 */
export function egPullLook(a, b, brk) {
  const dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz), ux = d > 1e-6 ? dx / d : 1, uz = d > 1e-6 ? dz / d : 0;
  const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, half = Math.max(d / 2, brk / 2 + EG_TETHER.past);
  return { origin: [mx - ux * half, mz - uz * half], end: [mx + ux * half, mz + uz * half], r: d / 2, r1: brk / 2, d, halfW: EG_TETHER.half * (EG_TETHER.thin + (1 - EG_TETHER.thin) * clamp01(1 - d / Math.max(brk, 1e-3))) };
}
/** A STAY-CLOSE TETHER at `d` m: how taut (0 slack under 6 m, to 1 at 8 m - the shader's links brighten and throb with it)
 *  and its chip, *6.8/8 m*. Pure. */
export const egChainLook = (d) => ({ taut: clamp01((d - EG_TETHER.slack) / (EG_TETHER.taut - EG_TETHER.slack)), chip: `${d.toFixed(1)}/${EG_TETHER.taut} m` });
/** The words under the crosshair while I am chained (section 25.5). */
export const egChainWords = (name, d) => `Chained to ${name || 'another'} - ${egChainLook(d).chip}`;

// ── A SPIRE POOL (section 25.2) ────────────────────────────────────────────────────────────────────────────────
/** Which of each band's ramps its pools take (world/egBandArt.js EG_BAND_RAMPS - the fire-sea's, the Cairn's slate violet,
 *  the Shade's quicksilver, the Wellhead's molten), the step, and how far it is darkened. */
export const EG_POOL_RAMP = Object.freeze(['liquid', 'stone', 'liquid', 'liquid']);
export const EG_POOL_STEP = 2;
export const EG_POOL_DARK = 0.5;
/** Band `band`'s pool colour (display rgb 0-1): its ramp's step, darkened - never POOL_COLOR, never blue. Pure. */
export function egPoolRgb(band) {
  const b = Math.max(0, Math.min(3, band | 0)), c = EG_BAND_RAMPS[b][EG_POOL_RAMP[b]][EG_POOL_STEP];
  return [(c[0] / 255) * EG_POOL_DARK, (c[1] / 255) * EG_POOL_DARK, (c[2] / 255) * EG_POOL_DARK];
}

// ── THE ECLIPSE (section 25.5) ─────────────────────────────────────────────────────────────────────────────────
/** The Eclipse's look: the darkening's last seconds, the wind's, how deep it darkens; its wind and its toll (Daggerfall's
 *  own records - systems/soundClips.js AmbientWindBlow1, and the bell ui/egBeats.js EG_BEAT_SOUNDS.toll plays). */
export const EG_ECLIPSE_LOOK = Object.freeze({ dark: 2, wind: 3, deep: 0.62, windSound: Object.freeze({ rec: 70, vol: 0.9, pitch: 0.8 }), tollSound: Object.freeze({ rec: 107, vol: 1, pitch: 0.75 }) });
/** Hall `spec`'s Eclipse at `t` (the shared clock, s): `{ secs, live, havens, r, key }` while it is told or striking, else
 *  null. Pure. */
export function egEclipseAt(spec, t) {
  for (const hz of spec?.hazards ?? []) {
    if (hz.kind !== 'eclipse') continue;
    for (const p of egHazardParts(hz, t)) {
      const havens = [];
      for (let k = 1; k + 2 < p.sh.length; k += 3) havens.push([p.sh[k], p.sh[k + 1]]);
      return { secs: p.st === 'tell' ? (1 - p.k) * (EG_HAZARDS.eclipse.tell / 1000) : 0, live: p.st === 'live', havens, r: EG_HAZARDS.eclipse.r, key: p.key };
    }
  }
  return null;
}
/** The bar's chip, *The Eclipse - 5*, while it is told; nothing else. Pure. */
export const egEclipseChip = (e) => (e && !e.live ? `The Eclipse - ${Math.max(1, Math.ceil(e.secs - 1e-9))}` : '');
/** How dark the floor is (0-1): from its last 2 s to the strike, the havens kept. Pure. */
export const egEclipseDark = (e) => (!e ? 0 : e.live ? 1 : clamp01(1 - e.secs / EG_ECLIPSE_LOOK.dark));

// ── THE MARKS OVER HEADS (sections 13.2 and 25.5) ──────────────────────────────────────────────────────────────
/** Each mark's sigil (net/egLords.js egMark's kinds; ui/egHud.js EG_MARK_NAMES): a hound's tooth (the Scent), a gem with its
 *  seconds (a soul-mark), a flame and a snowflake (Fire- and Frost-touched, their rims tinted), a chain, a cage, the
 *  challenge's ring, an eye (hunted), a knot (bound) - each its own shape, Dagon red. */
export const EG_SIGILS = Object.freeze(['tooth', 'gem', 'flame', 'flake', 'chain', 'cage', 'ring', 'eye', 'knot']);
/** The tinted rims (Fire-touched's fire, Frost-touched's frost - scenes/egFight.js's elements' colours). */
export const EG_SIGIL_RIM = Object.freeze({ 2: Object.freeze([1.0, 0.45, 0.1]), 3: Object.freeze([0.62, 0.78, 0.82]) });
/** How far over a member's eye their sigils hang (m - over the head, never on it). */
export const EG_SIGIL_UP_M = 0.6;
/** Member `sub`'s live marks at `now` (`F.mk`'s `[sub, kind, until, n]`): `[{ k, sigil, secs, n, rim }]`, by kind. Pure. */
export function egSigilsOf(mk, sub, now) {
  const out = [];
  for (const m of mk ?? []) if (m[0] === sub && m[2] > now && EG_SIGILS[m[1]]) out.push({ k: m[1], sigil: EG_SIGILS[m[1]], secs: Math.ceil((m[2] - now) / 1000), n: m[3] | 0, rim: EG_SIGIL_RIM[m[1]] ?? null });
  return out.sort((a, b) => a.k - b.k);
}
/** Where point `p` (the scene's frame) stands on the screen under the view-projection `vp` (column-major): [x, y] in 0..1
 *  (y down), or null behind the eye or off the screen. Pure. */
export function egScreenAt(vp, p) {
  const x = vp[0] * p[0] + vp[4] * p[1] + vp[8] * p[2] + vp[12], y = vp[1] * p[0] + vp[5] * p[1] + vp[9] * p[2] + vp[13], w = vp[3] * p[0] + vp[7] * p[1] + vp[11] * p[2] + vp[15];
  if (!(w > 1e-3)) return null;
  const sx = 0.5 + (0.5 * x) / w, sy = 0.5 - (0.5 * y) / w;
  return sx >= 0 && sx <= 1 && sy >= 0 && sy <= 1 ? [sx, sy] : null;
}
/** The camera's yaw (the port's: ahead [sin, cos] - scenes/gateCourt.js screenBearing's) read off a view matrix
 *  (world/mat4.js lookAt's: the eye looks down its -z). Pure. */
export const egViewYaw = (view) => Math.atan2(-view[2], -view[10]);

// ── A VESTIGE AURA (sections 15 and 25.4) ──────────────────────────────────────────────────────────────────────
/** A Vestige aura's ring: its radius (m) and its Battlemage blue (the Galleries' accent ramp's [92, 124, 196]). */
export const EG_AURA_RING = Object.freeze({ r: 0.6, color: Object.freeze([92 / 255, 124 / 255, 196 / 255]) });
const AURA_IDS = new Set(EG_VESTIGES.filter((v) => /** @type {any} */ (v).aura > 0).map((v) => v.id));   // the table's own field (its type names it not)
/** Who of the company holds an aura Vestige (net/egVestige.js's with `aura` - Bastion, the Spire's Standard): their subs,
 *  from the room's runs (`E.ms`). Pure. */
export const egAuraHolders = (E) => (E?.ms ?? []).filter((r) => (r[6] ?? []).some((v) => AURA_IDS.has(v[0]))).map((r) => r[0]);

// ── READABLE IN THE DARK (section 25.6) ────────────────────────────────────────────────────────────────────────
/** THE SHADE'S RIM LIGHT: the band it burns in, and the outline - moon-silver (the Shade's metal ramp, [187, 193, 202]),
 *  as a glint (systems/hitFlash.js setBatchGlint's [r, g, b, strength]: the sprite's outline, the body lifted a little
 *  toward it). */
export const EG_SHADE_BAND = 2;
export const EG_SHADE_RIM = Object.freeze([187 / 255, 193 / 255, 202 / 255, 0.3]);
/** A body's rim light: every foe's in the Shade (never a friend's), the dormant Lurker aside (section 12); null elsewhere.
 *  Pure. */
export const egRimOf = (band, fl) => (band === EG_SHADE_BAND && (fl & (EG_FL.dormant | EG_FL.friend)) === 0 ? EG_SHADE_RIM : null);

// ── WEIGHT (section 25.8) ──────────────────────────────────────────────────────────────────────────────────────
/** THE HEAVY BLOWS' SHAKES: by name (net/egLords.js's Savage, Gore, Whirl and Maul, net/egLegion.js's Smash), the shake at
 *  nought metres and the reach it fades to nothing over - the gate's LAND_SHAKE law (world/gateBoss.js landShake), within
 *  8-10 m, under the player's own maxShake (systems/betterAmbience.js weaponKick). */
export const EG_HEAVY_SHAKE = Object.freeze({ Savage: Object.freeze([2.5, 10]), Gore: Object.freeze([3, 10]), Whirl: Object.freeze([2.5, 10]), Smash: Object.freeze([2, 8]), Maul: Object.freeze([2.5, 8]) });
/** How far (x, z) stands from where stamp `s` lands (its centre, a lane's line; nought for the whole floor's). */
const stampDist = (s, x, z) => (s[0] === 'l' ? segDist(x, z, s[1], s[2], s[3], s[4]) : s[0] === 'a' || s[0] === 'h' ? 0 : Math.hypot(x - s[1], z - s[2]));
/** The shake a heavy blow's landing gives feet at (x, z) - its nearest stamp - times `motion` (egShakeMotion). Pure. */
export function egHeavyShake(blow, x, z, motion = 1) {
  const w = EG_HEAVY_SHAKE[blow?.nm];
  if (!w || !(motion > 0)) return 0;
  let d = Infinity;
  for (const s of blow.s ?? []) d = Math.min(d, stampDist(s, x, z));
  return w[0] * Math.max(0, 1 - d / w[1]) * Math.min(1, motion);
}
/** How much the screen may move: nothing under reduced motion (the shelf's row or the system's - ui/egAccess.js
 *  egReducedMotion), else the port's own Technique camera motion (0-1, systems/uiPrefs.js techniqueMotion - read as
 *  combat/techniqueFx.js techniqueMotion reads it). Pure. */
export const egShakeMotion = (still, technique) => { if (still) return 0; const v = Number(technique); return Number.isFinite(v) ? clamp01(v) : 1; };
/** An hp drop this soon after my own blow on a body is my blow's own word back (the relay's `ehp`), never an ally's. */
export const EG_MINE_ECHO_MS = 400;
/**
 * A body's hit flash at `t` (section 25.8 - WB13d's decision kept, no hit-stop): my own blow flashes it fully, anyone
 * else's (an ally's, the relay's word of a drop I did not strike) at 0.4 - the gate's own law (world/gateBoss.js
 * gateHitFlash, GATE_FLASH_COURT); a fallen body none. `b.mineAt` my last blow's moment, `b.hurtAt` the last drop's. Pure.
 */
export function egBodyFlash(b, t) {
  if (!b || b.fellAt) return 0;
  const mine = b.mineAt ?? -Infinity, hurt = b.hurtAt ?? -Infinity;
  return gateHitFlash(mine, hurt >= mine && hurt - mine <= EG_MINE_ECHO_MS ? -Infinity : hurt, t);
}
/** A DROP'S LANDING (section 25.8): a landing counts from this far over a Drop's top (m), as far as its fall and a hop
 *  over it; the dust thrown out across its landing (m, ms); the thud - Daggerfall's own records, layered and pitched down
 *  (systems/soundClips.js BodyFall and DungeonDoorClose) - never DFU's hard-landing grunt (FallHard). */
export const EG_DROP_THUD = Object.freeze({ min: 1, over: 6, r0: 0.6, r1: 3.2, ms: 700,
  sounds: Object.freeze([Object.freeze({ rec: 15, vol: 1, pitch: 0.6 }), Object.freeze({ rec: 24, vol: 0.55, pitch: 0.5 })]) });
/** The Drop (`spec.steps` kind `drop`) whose landing lies under feet at (x, y, z) (the hall's frame), at most
 *  EG_DROP_THUD.over over its top - or null. Pure. */
export function egDropUnder(spec, x, y, z) {
  for (const s of spec?.steps ?? []) if (s.kind === 'drop' && Math.abs(x - s.x) <= s.w / 2 && Math.abs(z - s.z) <= s.d / 2 && y >= s.y - 0.3 && y - s.y <= EG_DROP_THUD.over) return s;
  return null;
}
/** Am I falling onto a Drop the course asked for - over its landing by EG_DROP_THUD.min or more? Pure. */
export const egOverDrop = (spec, x, y, z) => { const s = egDropUnder(spec, x, y, z); return !!s && y - s.y >= EG_DROP_THUD.min; };
