// @ts-check
// EG-FULL (2026-10-11, the Elite Gates arc; bible/11-Multiplayer/Elite-Gates.md sections 11.7, 12, 13 and 21): A HALL'S
// FIGHT AS THE RELAY HOLDS IT - one record for every body a hall stands (its lords and champions, its legion, its
// errands' objects - runes, gems, anchors, banners, hearts, seals, braziers, pillars, the relic, the rifts), the blows in
// flight and the ones THE UNION FLOOR holds, the tethers and the marks on members, and the words every screen draws them
// by:
//   `efs` - the whole fight (its bodies `b`, blows `bl`, tethers `tx`, marks `mk`, progress `pg`), at the wake, a hello
//          and every STATE_SEND_MS;
//   `ead` a body risen, `emv` the beat's walks, `ehp` health as it falls, `edie` gone, `efl` a body's flags;
//   `eb`  a blow (net/egShape.js - its FULL shape stamp), `ecut` a feint cut, `etx` the tethers, `emk` the marks.
//
// A BODY: `{ i, role (0 lord, 1 add, 2 object), k (the lord's, the kind's, the object's number), pt (a part: the twin, a
// mirror, a rune's numeral), x, z, mv, hp, max, fl (flags), r (its radius), ... }`. Its walk is said once and carried by
// every screen (the gate's law - net/gateBrain.js hostAt). A blow is judged on the struck member's machine at its
// landing (co-op's law); a blow ON a body is the gate's hand and purse (spendBlow, spendPurse), a melee blow within
// MELEE_REACH of its body, from the fight floor (or, for an object off it - a pillar, a perch - from beside it).
//
// Pure: a record and a beat in, frames out. In the relay bundle. Not a DFU member. Ledger A (ELITE-GATES).
import { HIT_KINDS, MELEE_REACH, POSE_SLACK, MOVE_RESAY_M, MOVE_RESAY_MS, HP_SEND_MS, HOST_HP_MIN, dpsRef, spendBlow, spendPurse } from './gateBrain.js';
import { egKeepOnFight, egOnFight, egFloorTest, EG_BANDS } from './egLaw.js';
import { egBlowOf, egUnionHolds, egInBlow, EG_UNION_HOLD_TICKS, EG_BLOWS_MAX } from './egShape.js';

/** A body's role. */
export const EG_ROLE = Object.freeze({ lord: 0, add: 1, obj: 2 });
/** A body's flags (`fl`): an elite, a friend of the company, dormant, flying, shielded (its ward up), stunned, a mirror,
 *  hidden (the Night-Stalker vanished), in fury, fallen, a Kynval squad's affixes, grounded. */
export const EG_FL = Object.freeze({ elite: 1, friend: 2, dormant: 4, fly: 8, ward: 16, stun: 32, mirror: 64, hidden: 128, fury: 256, fell: 512, searing: 1024, shielded: 2048, wrathful: 4096, unshaken: 8192, grounded: 16384, lit: 32768 });
/** The most bodies a fight stands at once on the wire (lords, legion and objects together). */
export const EG_BODIES_MAX = 64;
/** How a body left (`edie`'s `w`): slain, raised away or fed (a Sapper reaching its lord), crumbled (the hall's end). */
export const EG_GONE = Object.freeze({ slain: 0, fed: 1, crumbled: 2 });
/** How often the whole fight is said again (ms). */
export const EG_STATE_EVERY_MS = 2000;
/** The depth's weight on every body's health (section 18: 4% a circle). */
export const egDepthX = (c) => 1 + 0.04 * (c - 1);
/** The depth's weight on every blow's share (section 13.2: 2% a circle) - with fury and Vengeful, never past 1.5. */
export const EG_SHARE_X_MAX = 1.5;
export const egShareX = (c, extra = 1) => Math.min(EG_SHARE_X_MAX, (1 + 0.02 * (c - 1)) * extra);

const r2 = (v) => Math.round(v * 100) / 100;
const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);

/**
 * A HALL'S FIGHT, fresh at its wake: its hall, kind, circle and band, the living company that sizes it (`n`, their levels,
 * the company's reference damage `team` and its mean), its depth's weight, and nothing yet standing.
 * @param {any} spec @param {number} now @param {number[]} lvs
 */
export function egFightNew(spec, now, lvs) {
  const L = lvs.length ? lvs : [1], team = L.reduce((s, lv) => s + dpsRef(lv), 0);
  return {
    h: spec.h, kind: spec.kind, variant: spec.variant, c: spec.c, band: spec.band, el: EG_BANDS[spec.band]?.el ?? 'fire', n: L.length, lvs: L, team, mean: team / L.length, X: egDepthX(spec.c),
    wokeAt: now, seq: 0, bl: 0, bodies: [], blows: [], held: [], tethers: [], marks: [], pg: {}, hSent: '', hAt: 0, stateAt: now, moves: [],
    /** a lord's or a hall's own memory (the brains keep their state here) */
    mem: {},
  };
}
/** Health for `s` seconds of the company's MEAN reference damage (an add's), and for `s` of its whole (a team's - shared
 *  over `k`), at the fight's depth; never under HOST_HP_MIN. */
export const egHpMean = (F, s) => Math.max(HOST_HP_MIN, Math.round(s * F.mean * F.X));
export const egHpTeam = (F, s, k = 1) => Math.max(HOST_HP_MIN, Math.round((s * F.team * F.X) / Math.max(1, k)));

/** Where a body stands at `now`: its walk carried from its word, else where it stands. */
export function egBodyAt(b, now) {
  const m = b?.mv;
  if (!m || !(m.v > 0)) return [b.x, b.z];
  const len = Math.hypot(m.tx - m.x, m.tz - m.z);
  if (len < 1e-6) return [m.tx, m.tz];
  const along = Math.min(len, (Math.max(0, now - m.at) / 1000) * m.v);
  return [m.x + ((m.tx - m.x) / len) * along, m.z + ((m.tz - m.z) / len) * along];
}
/** Every body carried to `now` (its place set from its walk). */
export function egCarry(F, now) { for (const b of F.bodies) if (b.mv) { const [x, z] = egBodyAt(b, now); b.x = x; b.z = z; } }
/** A body's array on the wire: `[i, role, k, pt, x, z, hp, max, fl, tx, tz, v, at]`. */
export const egBodyWire = (b) => [b.i, b.role, b.k, b.pt ?? 0, r2(b.x), r2(b.z), Math.max(0, Math.ceil(b.hp)), Math.ceil(b.max), b.fl | 0, b.mv ? b.mv.tx : r2(b.x), b.mv ? b.mv.tz : r2(b.z), b.mv ? b.mv.v : 0, b.mv ? b.mv.at : 0];

/**
 * A body stood: its role, its number in that role's table, where, its health, its radius and flags; said (`ead`).
 * @param {any} F @param {number} role @param {number} k @param {number} x @param {number} z @param {number} hp
 * @param {{ pt?: number, r?: number, fl?: number, up?: number, now?: number, out?: any, [more: string]: any }} [o]
 * @returns {any}
 */
export function egBodyNew(F, role, k, x, z, hp, { pt = 0, r = 0.6, fl = 0, up = 0, now = 0, out = null, ...rest } = {}) {
  if (F.bodies.length >= EG_BODIES_MAX) return null;
  const h = Math.max(1, Math.round(hp));
  const b = { i: ++F.seq, role, k, pt, x: r2(x), z: r2(z), mv: null, hp: h, max: h, r, fl, up: now + up, atk: null, tg: null, tgAt: 0, next: now, at: now, ...rest };
  F.bodies.push(b);
  out?.push({ k: 'ead', a: [egBodyWire(b)], at: now });
  return b;
}
/** Several stood in one word. */
export function egRaise(F, role, k, spots, hp, now, out, o = {}) {
  const made = [];
  for (const [x, z] of spots) { const b = egBodyNew(F, role, k, x, z, hp, { ...o, now }); if (b) made.push(b); }
  if (made.length) out.push({ k: 'ead', a: made.map(egBodyWire), at: now });
  return made;
}
/** A body's walk said to (gx, gz), `stop` short of it, at `speed`, kept to the fight floor `inset` in (none - free: a
 *  flyer, an object) - a new word only when its goal moved past MOVE_RESAY_M or MOVE_RESAY_MS has passed. */
export function egWalk(F, b, gx, gz, stop, speed, now, spec, inset = b.r ?? 0.6, free = false) {
  const dx = gx - b.x, dz = gz - b.z, d = Math.hypot(dx, dz), go = Math.max(0, d - stop);
  let tx = b.x + (d > 0 ? (dx / d) * go : 0), tz = b.z + (d > 0 ? (dz / d) * go : 0);
  if (!free) [tx, tz] = egKeepOnFight(spec, tx, tz, inset);
  const m = b.mv;
  if (m && Math.hypot(m.tx - tx, m.tz - tz) < MOVE_RESAY_M && now - m.at < MOVE_RESAY_MS) return;
  if (!m && Math.hypot(tx - b.x, tz - b.z) < 0.05) return;
  b.mv = { x: r2(b.x), z: r2(b.z), tx: r2(tx), tz: r2(tz), v: speed, at: now };
  b.x = b.mv.x; b.z = b.mv.z;
  if (d > 0) b.yaw = Math.atan2(dx, dz);
  F.moves.push([b.i, b.mv.x, b.mv.z, b.mv.tx, b.mv.tz, speed, now]);
}
/** A body stood still where it is. */
export function egStop(F, b, now) {
  if (!b.mv) return;
  b.mv = null;
  b.x = r2(b.x); b.z = r2(b.z);
  F.moves.push([b.i, b.x, b.z, b.x, b.z, 0, now]);
}
/** A body set down at (x, z) at once (a leap's landing, a blink, a rift's wander) - said as a walk of no speed. */
export function egPlace(F, b, x, z, now) {
  b.mv = null; b.x = r2(x); b.z = r2(z);
  F.moves.push([b.i, b.x, b.z, b.x, b.z, 0, now]);
}
/** The beat's walks in one word. */
export function egMovesOut(F, out) { if (F.moves.length) { out.push({ k: 'emv', m: F.moves }); F.moves = []; } }
/** A body's flags set (said once, when they change). */
export function egFlags(F, b, fl, out) { if ((b.fl | 0) === fl) return; b.fl = fl; out.push({ k: 'efl', i: b.i, fl }); }
export const egHas = (b, f) => ((b?.fl | 0) & f) !== 0;
export const egSetFl = (F, b, f, on, out) => egFlags(F, b, on ? (b.fl | f) : (b.fl & ~f), out);

/** Bodies of a role (the living ones). */
export const egBodiesOf = (F, role, k = null) => F.bodies.filter((b) => b.role === role && b.hp > 0 && (k == null || b.k === k));
export const egBodyById = (F, i) => F.bodies.find((b) => b.i === i) ?? null;

/** Bodies gone in one word (`edie` - by the striker's name, `w` how). */
export function egGone(F, bodies, w, name, now, out) {
  const is = bodies.map((b) => b.i);
  if (!is.length) return;
  F.bodies = F.bodies.filter((b) => !is.includes(b.i));
  F.tethers = F.tethers.filter((t) => !is.includes(t[0]) && !is.includes(t[1]));
  out.push({ k: 'edie', is, w, n: name || '', at: now });
}

/**
 * A BLOW BEGUN (net/egShape.js - its stamps, its wind-up kept at THE WIND-UP FLOOR unless a CHECK): checked against THE
 * UNION FLOOR for every member it could reach (`here`, the hall's frame) - held when it would leave one no floor, tried
 * again each beat, dropped after EG_UNION_HOLD_TICKS - and said (`eb`) when it stands. Answers the blow, or null (held).
 * @param {any} F @param {any} spec @param {any} o the blow (net/egShape.js egBlowOf's) @param {{sub: string, x: number, z: number}[]} here
 * @param {number} now @param {any[]} out
 */
export function egAim(F, spec, o, here, now, out) {
  const blow = egBlowOf({ ...o, i: ++F.bl });
  if (!blow.ch && here.length) {
    const onFloor = egFloorTest(spec), pending = F.blows.filter((b) => !b.ch && b.at > now);
    for (const m of here) {
      if (!blow.s.some((s) => s[0] === 'a' || s[0] === 'h' || (s.length >= 3 && Math.hypot(m.x - s[1], m.z - s[2]) < 40))) continue;
      if (egUnionHolds(pending, blow, m.x, m.z, now, onFloor)) { F.held.push({ o, ticks: 0, at: now }); return null; }
    }
  }
  F.blows.push(blow);
  if (F.blows.length > EG_BLOWS_MAX) F.blows.shift();
  out.push({ k: 'eb', ...blow });
  return blow;
}
/** THE UNION FLOOR's held blows, tried again a beat later (their landing later by the wait), and dropped past their
 *  ticks; the blows long landed forgotten. */
export function egBlowsStep(F, spec, now, here, out) {
  F.blows = F.blows.filter((b) => now <= b.at + Math.max(1, b.sp ?? 0) + 1500);
  if (!F.held.length) return;
  const held = F.held;
  F.held = [];
  for (const h of held) {
    if (++h.ticks > EG_UNION_HOLD_TICKS) continue;
    const wait = now - h.at;
    const got = egAim(F, spec, { ...h.o, at: h.o.at + wait }, here, now, out);
    if (!got) { const last = F.held[F.held.length - 1]; if (last) { last.ticks = h.ticks; last.at = now; last.o = { ...h.o, at: h.o.at + wait }; } }
  }
}
/** A blow cut (a feint, at FEINT_AT - section 13.2): gone, said. */
export function egCut(F, i, out) { F.blows = F.blows.filter((b) => b.i !== i); out.push({ k: 'ecut', i }); }
/** The members a landed blow struck, by the relay's own reckoning of their poses (the census - section 21). */
export const egStruck = (blow, here) => here.filter((m) => egInBlow(blow, m.x, m.z));

/** The health of every body that moved since last said, at most every HP_SEND_MS (`ehp`). */
export function egHpOut(F, now, out, force = false) {
  if (!force && now - F.hAt < HP_SEND_MS) return;
  const key = F.bodies.map((b) => `${b.i}:${Math.ceil(b.hp)}`).join(',');
  if (key === F.hSent) return;
  F.hSent = key; F.hAt = now;
  if (F.bodies.length) out.push({ k: 'ehp', h: F.bodies.map((b) => [b.i, Math.max(0, Math.ceil(b.hp))]) });
}
/** The tethers said (`etx`: `[a, b, kind, r]` - a body to a member's sub or to another body; kind 0 drain, 1 blood,
 *  2 chain, 3 ward, 4 challenge). */
export function egTethersOut(F, out) { out.push({ k: 'etx', t: F.tethers.map((t) => [...t]) }); }
/** The marks on members said (`emk`: `[sub, mark, until, n]` - 0 the Scent, 1 a soul-mark, 2 fire-touched, 3 frost-touched,
 *  4 chained, 5 caged, 6 challenged, 7 hunted, 8 bound). */
export function egMarksOut(F, out) { out.push({ k: 'emk', m: F.marks.map((m) => [...m]) }); }
export const egMarkOf = (F, sub, mark) => F.marks.find((m) => m[0] === sub && m[1] === mark) ?? null;
export function egMark(F, sub, mark, until, n = 0) { F.marks = F.marks.filter((m) => !(m[0] === sub && m[1] === mark)); F.marks.push([sub, mark, until, n]); }
export function egUnmark(F, sub, mark) { F.marks = F.marks.filter((m) => !(m[0] === sub && (mark == null || m[1] === mark))); }

/** THE WHOLE FIGHT (`efs`). */
export function egFightState(F, now) {
  return { k: 'efs', h: F.h, wk: F.wokeAt, b: F.bodies.slice(0, EG_BODIES_MAX).map(egBodyWire), bl: F.blows.filter((b) => b.at + Math.max(1, b.sp ?? 0) + 400 >= now), tx: F.tethers.map((t) => [...t]), mk: F.marks.map((m) => [...m]), pg: { ...F.pg } };
}

/**
 * A BLOW ON A BODY from member purse `p` (the gate's: level, blow rate, bucket), standing at `pose` (the hall's frame),
 * of kind `r`, claiming `d` on body `i`, times `mult` (a stun's, a flank's - before the caps: the bucket still decides
 * what lands): the gate's hand and purse, a melee blow within MELEE_REACH of its body, from the fight floor - or, for a
 * body standing off it (a pillar's perch, a caster's pillar), from within reach of it. Answers what landed and the body.
 */
export function egHitBody(F, spec, p, i, d, r, pose, now, seq = null, mult = 1, bucketX = 1) {
  const b = Number.isSafeInteger(i) ? egBodyById(F, i) : null;
  if (!p || !b || !(b.hp > 0) || !Number.isFinite(d) || !(d > 0) || egHas(b, EG_FL.friend) || egHas(b, EG_FL.hidden)) return { got: 0, b: null };
  if (!spendBlow(p, now, seq, `e${i}`)) return { got: 0, b: null };
  if (!pose || !Number.isFinite(pose.x) || !Number.isFinite(pose.z)) return { got: 0, b: null };
  const [bx, bz] = egBodyAt(b, now), gap = dist(pose.x, pose.z, bx, bz) - (b.r ?? 0.6);
  const onFloor = egOnFight(spec, pose.x, pose.z, POSE_SLACK + 6);
  if (!onFloor && gap > MELEE_REACH + POSE_SLACK + 4) return { got: 0, b: null };
  if (r === HIT_KINDS.Melee && gap > MELEE_REACH + POSE_SLACK) return { got: 0, b: null };
  if (egHas(b, EG_FL.ward) || !(mult > 0)) return { got: 0, b };
  const got = spendPurse(p, d * mult, b.hp, now, bucketX);
  b.hp -= got;
  return { got, b };
}
