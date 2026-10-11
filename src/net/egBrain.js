// @ts-check
// EG-PLAY (2026-10-11, the Elite Gates arc; bible/11-Multiplayer/Elite-Gates.md sections 6, 7, 8 and 16): THE DIRECTOR -
// an Elite Breach as its relay room runs it. One record (`B`) holds the breach: the company frozen at the open, each
// member's admission, life and purse, the hall the company stands in and its stage, THE COUNT, the Redoubts taken, the
// end; and the hall's fight (`B.F`: its legion - net/egHost.js, its rifts, its champion or lord - net/egLord.js). The room
// (server/src/index.js `_egTick`) steps it every BRAIN_TICK_MS over the members' bodies and fans what it answers; it
// mints the receipts the record owes (`B.owe`) with the relay's key.
//
// ONE HALL AT A TIME, THE COMPANY TOGETHER (section 7): `arrive` (each member stepping onto the hall's arrival plate is
// `here`; the hall wakes EG_GATHER_MS after the last, or EG_ARRIVE_MAX_MS after the pull - the first hall when the whole
// company stands there, or at the open window's end), `trial` (the hall's kind: rifts closed, the far plate reached, a
// champion felled, a gate's Ward-Bearers broken, a lord felled), `closing` (the door open - each member steps through it,
// `down`; EG_CLOSING_FIGHT_MS or, after a span, EG_CLOSING_SPAN_MS), then the pull to the next hall. A Court's fall takes
// the circle's Redoubt for every living member at once: its receipts, the count's fifteen minutes, the `rest` (the count
// held), then the next circle - or the way home.
//
// THE COUNT (section 6.2): thirty minutes from the first wake, fifteen more a Redoubt (thirty in hand at most, never past
// the last word); it runs through a trial and the closing's first EG_CLOSING_COUNT_MS, and holds through the rest and the
// pull - but never more than EG_STAIR_HOLD_MS of a pull. Spent in a trial or a closing, the Covenant tears the breach.
//
// ONE LIFE (section 16.5): a death in the breach (the pose's `dd`), or EG_ABSENT_TRIAL_MS gone in a trial, is a member's
// fall - its end receipt minted. No living member, and the breach ends.
//
// What EG-PLAY leaves (section 31, EG-PLAY): the recall and the witness view, Vestiges, decrees, twists, caches and
// Reliquaries, the Gold Run, the company's word, THE COVENANT'S PATIENCE (a count spent in a Court tears it), THE FAIR
// TRAIL and the body count in `eg:` rooms.
//
// Pure: a record and a beat in, frames out. Not a DFU member. Ledger A (ELITE-GATES).
import { EG_SPEC, EG_SEALED_MS, EG_GATHER_MS, EG_ARRIVE_MAX_MS, EG_CLOSING_FIGHT_MS, EG_CLOSING_SPAN_MS, EG_CLOSING_COUNT_MS, EG_STAIR_HOLD_MS, EG_REST_MS,
  EG_WAKE_RING_MS, EG_ABSENT_TRIAL_MS, EG_LAST_WORD_MS, egHallOf, egCircleOfHall, egFirstHallOf, egTimes, egAdmits, egCountNew, egCountLeft, egCountRun, egCountHold,
  egCountRedoubt, egInHall, egLocalX, egOnArrive, egAtDoor, egOnFight, egSpecDigest } from './egLaw.js';
import { egHostNew, egRaise, egHostGone, egHostStep, egHostHit, egHostCount } from './egHost.js';
import { egLordNew, egLordWake, egLordStep, egLordHit, EG_PROVE_HP_S, EG_COURT_HP_S } from './egLord.js';
import { HOST, HOST_GONE, HOST_HP_MIN, CRYSTAL_R, BUCKET_DEPTH_X, GATE_HIT_HZ_MAX, MELEE_REACH, POSE_SLACK, HIT_KINDS, HP_SEND_MS, STATE_SEND_MS,
  dpsRef, clampLv, harrierCountFor, harrierHpFor, hostTeamHpFor, hostStateOf, atkFrame, wrapYaw, spendBlow, spendPurse } from './gateBrain.js';

/** The rifts together hold this many seconds of the company's reference damage (section 8.1). */
export const EG_RIFT_TEAM_S = 36;
/** A Rampart's gate's two Ward-Bearers together hold this many (section 8.3). */
export const EG_GATE_TEAM_S = 12;
/** How often each rift pours a wave at circle c (section 8.1 - never under nine seconds), a Rampart's march, a Court's
 *  escort (ms). */
export const egWaveEveryMs = (c) => Math.max(9000, 20_000 - 500 * (c - 1));
export const EG_MARCH_EVERY_MS = 12_000;
export const EG_ESCORT_EVERY_MS = 25_000;
/** The rifts a company of n living members faces, and the legion's cap (section 8.1). */
export const egRiftsFor = (n) => Math.max(3, Math.min(5, 2 + Math.ceil(n / 3)));
export const egLegionCap = (n, c) => Math.min(14, 2 + Math.ceil(1.5 * n) + Math.floor((c - 1) / 5));
/** The depth's weight on every health (section 18's first knob - a Redoubt deeper, 4% more). */
export const egDepthX = (c) => 1 + 0.04 * (c - 1);
/** The most of the legion standing at once on the wire (net/wire.js GATE_HOST_MAX - pinned equal). */
export const EG_STANDING_MAX = 16;
/** The names on the foes' cards (EG-PLAY's champion's kit: the Proving Walk's, and the Court's until EG13's lords). */
export const EG_FOE_NAMES = Object.freeze({ champion: 'The Kynreeve', lord: 'The Kynreeve Castellan' });

const secs = (ms) => Math.max(0, Math.floor(ms / 1000));
const purseOf = (lv, now) => ({ lv, rate: GATE_HIT_HZ_MAX, rateAt: now, bucket: BUCKET_DEPTH_X * dpsRef(lv), bucketAt: now, clipped: 0, dealt: 0, bq: null, bqAt: 0, bqWho: [] });

/**
 * A breach opened: the hub's verified open (net/wire.js validEgOpenTell) at `now`, the room's own record from here.
 * @param {ReturnType<typeof import('./wire.js').validEgOpenTell>} t
 */
export function egBreachNew(t) {
  return {
    v: 1, b: t.b, ez: t.ez, s: t.s, o: t.o, ew: t.ew, rh: t.rh, seed: t.seed >>> 0, egv: EG_SPEC, op: t.op, site: t.site,
    co: t.co.map(([sub, name, n]) => ({ sub, name, n })),
    /** @type {Record<string, any>} each member admitted: its name, numeral, level (frozen at the first admission), life, purse */
    mem: {},
    h: 0, sg: 'wait', sa: t.op, su: t.op + EG_SEALED_MS, hw: 0, dn: 0, pulledAt: 0, gatherAt: 0, cleared: 0,
    wk: 0, cnt: egCountNew(), rd: 0, end: null, endAt: 0,
    /** @type {any} the hall's fight */
    F: null,
    /** @type {any[]} the receipts owed: `{ sub, claims }` - the room fills each one's seed and signs it */
    owe: [],
    /** @type {string[]} the admission orders spent (their `ez`) */
    zs: [],
    lastStateAt: 0,
  };
}
/** The breach as the clock's law reads one (net/egLaw.js egTimes, egPhase). */
const clockRec = (B) => ({ openedAt: B.op, wokeAt: B.wk, endAt: B.endAt, why: B.end });
const living = (B) => Object.entries(B.mem).filter(([, m]) => m.in && m.alive && !m.home);
const memberName = (B, sub) => B.mem[sub]?.name ?? B.co.find((c) => c.sub === sub)?.name ?? '';

/** May `sub` enter breach `B` at `now` - null, or the refusal's words (net/wire.js EG_NO_WORDS). */
export function egAdmitWord(B, sub, now) {
  if (!B.co.some((c) => c.sub === sub)) return 'the breach answers only to its company';
  if (B.end) return 'the breach is closed';
  const m = B.mem[sub];
  if (m?.fellAt) return 'you have fallen';
  if (m?.home) return 'you went home';
  if (m?.in) return null;   // a reload: back into the hall it stands in
  return egAdmits(clockRec(B), now) ? null : 'the breach is closed';
}
/** A member's admission, its order verified by the room (`ez` its id): spent once; its level frozen at the first. Answers
 *  null, or the refusal's words. */
export function egEnter(B, sub, ez, lv, now) {
  const no = egAdmitWord(B, sub, now);
  if (no) return no;
  if (B.zs.includes(ez)) return 'the order is spent';
  B.zs = [...B.zs, ez].slice(-64);
  const c = B.co.find((x) => x.sub === sub);
  if (!B.mem[sub]) B.mem[sub] = { name: c.name, n: c.n, in: 1, lv: clampLv(lv), alive: 1, home: 0, fellAt: 0, hereH: 0, downH: 0, dh: 0, dc: 0, act: 0, seenAt: now, x: 0, ...purseOf(clampLv(lv), now) };
  else B.mem[sub].seenAt = now;
  return null;
}

/** The count's word: what was left when it last began to run (`cl`, whole ms) and that instant (`ca`; 0 while it holds -
 *  `cl` is then what is left) - every screen counts it down from there (net/egLink.js egCountAt). */
const countWord = (B, now) => ({ cl: Math.round(B.cnt.at > 0 ? B.cnt.left : egCountLeft(B.cnt, now)), ca: B.cnt.at });
/** The stage's word (`sg`). */
export const egStageWord = (B, now) => ({ k: 'sg', h: B.h, sg: B.sg, sa: B.sa, su: B.su, ...countWord(B, now), hw: B.hw, dn: B.dn });
/** The company as the room says it: `[sub, name, numeral, alive, home, in]`. */
export const egCompanyOf = (B) => B.co.map((c) => { const m = B.mem[c.sub]; return [c.sub, c.name, c.n, m ? m.alive : 1, m?.home ? 1 : 0, m?.in ? 1 : 0]; });
/** The breach's whole state (`st`). */
export function egStateOf(B, now) {
  return { ...egStageWord(B, now), k: 'st', b: B.b, seed: B.seed, egv: B.egv, op: B.op, wk: B.wk, co: egCompanyOf(B), rd: B.rd, rh: B.rh,
    dg: B.h > 0 ? egSpecDigest(egHallOf(B.seed, B.h)) : 0, end: B.end };
}
/** The hall's fight as the gate's `st` says one (net/wire.js validGateOut) - its champion or lord (none: `b` 'none'), its
 *  rifts as the Reckoning's crystals, its legion. Null when the hall holds no fight. */
export function egFightStateOf(B) {
  const F = B.F;
  if (!F) return null;
  const L = F.lord;
  return { k: 'fst', h: F.h, f: {
    d: F.h, b: L ? 'kynreeve' : 'none', ph: 1, h: L ? Math.round(L.hp) : 0, m: L ? L.max : 0, x: L ? L.pos[0] : 0, z: L ? L.pos[1] : 0, yw: L ? wrapYaw(L.yaw) : 0,
    mv: L?.move ?? null, atk: L?.atk ? atkFrame(L.atk) : null, sh: 0, wr: B.op + EG_LAST_WORD_MS, n: living(B).length,
    fell: L?.fell ? { at: L.fell.at, top: L.fell.top, n: L.fell.n } : null, wrath: null, md: null, ct: 0, xa: [],
    cx: F.rifts ? { i: F.rifts.i, m: F.rifts.m, c: F.rifts.c.map((q) => [q.x, q.z, Math.max(0, Math.ceil(q.h))]) } : null, su: 0, rk: 0,
    lg: hostStateOf(F.lg), op: F.wokeAt,
  } };
}

/** A member's body in the hall's own frame, or null when it stands in no part of hall `spec`. */
const local = (spec, b) => (b && egInHall(spec, b.sx, b.z) ? { sub: b.sub, x: egLocalX(spec, b.sx), z: b.z } : null);

/** A receipt owed - its seed the room's own draw. */
function owe(B, sub, claims) { B.owe.push({ sub, claims: { b: B.b, s: sub, z: B.ez, ...claims } }); }
/** A member's end receipt (`x`), once: why it ended, the deepest hall cleared. */
function oweEnd(B, sub, why, now) {
  const m = B.mem[sub];
  if (m?.x) return;
  if (m) m.x = 1;
  owe(B, sub, { q: 'x', h: B.cleared, t: B.wk ? secs(now - B.wk) : 0, n: Object.values(B.mem).filter((x) => x.in).length, ew: B.ew, l: m?.lv ?? 1, why, ...(B.rh ? { rh: 1 } : {}) });
}

/** A member falls (section 16.5): its life gone, its end receipt owed, said to all. */
export function egFall(B, sub, now, out) {
  const m = B.mem[sub];
  if (!m || !m.alive || m.home || B.end) return;
  m.alive = 0; m.fellAt = now;
  oweEnd(B, sub, 'fall', now);
  out.push({ k: 'fall', s: sub, n: m.name, at: now }, { k: 'co', co: egCompanyOf(B) });
}
/** A member takes the way home at a Redoubt's rest: its end receipt owed. Answers whether it went. */
export function egHome(B, sub, now, out) {
  const m = B.mem[sub];
  if (!m || !m.alive || m.home || B.end || B.sg !== 'rest') return false;
  m.home = now;
  oweEnd(B, sub, 'home', now);
  out.push({ k: 'co', co: egCompanyOf(B) });
  return true;
}
/** THE END (section 22): every member still in it owed its end, said to all. */
export function egEnd(B, why, now, out) {
  if (B.end) return;
  B.end = why; B.endAt = now; B.sg = 'end'; B.sa = now; B.su = 0;
  B.cnt = egCountHold(B.cnt, now);
  if (B.F?.lg?.ads?.length) egHostGone(B.F.lg, now, out, HOST_GONE.crumbled);
  B.F = null;
  for (const [sub, m] of Object.entries(B.mem)) if (m.in && m.alive && !m.home) oweEnd(B, sub, why, now);
  if (why === 'empty' && !B.mem[B.s]) oweEnd(B, B.s, 'empty', now);   // the opener's stake settles even when nobody came
  out.push({ k: 'end', why, at: now }, egStageWord(B, now));
}

/** The hall woken: the trial begins, the count runs (from thirty minutes at the breach's first wake), its fight stood. */
function wake(B, now, rng, out) {
  const spec = egHallOf(B.seed, B.h);
  B.sg = 'trial'; B.sa = now; B.su = 0; B.hw = now; B.dn = 0; B.gatherAt = 0;
  if (!B.wk) { B.wk = now; B.cnt = { left: egCountNew().left, at: now }; } else B.cnt = egCountRun(B.cnt, now);
  for (const [, m] of living(B)) m.downH = 0;
  B.F = standFight(B, spec, now, rng, out);
  out.push(egStageWord(B, now));
  const fst = egFightStateOf(B);
  if (fst) out.push(fst);
}
/** A hall's fight stood at its wake, sized by its living company (n, their levels) and its depth. */
function standFight(B, spec, now, rng, out) {
  const L = living(B), n = Math.max(1, L.length), lvs = L.map(([, m]) => m.lv), team = lvs.reduce((s, lv) => s + dpsRef(lv), 0), X = egDepthX(spec.c);
  const F = { h: B.h, kind: spec.kind, c: spec.c, n, lvs, wokeAt: now, lg: egHostNew(), rifts: null, lord: null, waveAt: 0, ringAt: 0, rhSent: '', rhAt: 0, lastStateAt: now };
  const harrierHp = Math.round(harrierHpFor(lvs.length ? lvs : [1]) * X);
  if (spec.kind === 'yard') {
    const k = Math.min(egRiftsFor(n), spec.rifts.length), hp = Math.max(HOST_HP_MIN, Math.round(((EG_RIFT_TEAM_S / k) * team) * X));
    F.rifts = { i: B.h, m: hp, c: spec.rifts.slice(0, k).map((q) => ({ x: q.x, z: q.z, h: hp })) };
    out.push({ k: 'cx', i: F.rifts.i, m: hp, c: F.rifts.c.map((q) => [q.x, q.z]) });
    F.waveAt = now + 4000;
  } else if (spec.kind === 'proving') {
    F.lord = egLordNew('champion', EG_FOE_NAMES.champion, spec.foe.x, spec.foe.z, EG_PROVE_HP_S * team * X, now);
    egLordWake(F.lord, now);
    const k = 1 + Math.ceil(n / 3), spots = [];
    for (let i = 0; i < k; i++) { const a = (i / k) * 2 * Math.PI + rng(); spots.push([spec.foe.x + Math.sin(a) * 5, spec.foe.z + Math.cos(a) * 5]); }
    egRaise(F.lg, HOST.harrier, spots, harrierHp, now, out);
  } else if (spec.kind === 'rampart') {
    const hp = Math.max(HOST_HP_MIN, Math.round(hostTeamHpFor(EG_GATE_TEAM_S, lvs.length ? lvs : [1], 2) * X));
    egRaise(F.lg, HOST.bearer, spec.gate.bearers.map((q) => [q.x, q.z]), hp, now, out);
    F.waveAt = now + 6000;
  } else if (spec.kind === 'court') {
    F.lord = egLordNew('lord', EG_FOE_NAMES.lord, spec.foe.x, spec.foe.z, EG_COURT_HP_S * team * X, now);
  }
  F.harrierHp = harrierHp;
  return F;
}

/** The door opens (section 7): the closing begins. */
function door(B, spec, now, out) {
  B.cleared = Math.max(B.cleared, B.h);
  if (B.F?.lg?.ads?.length) egHostGone(B.F.lg, now, out, HOST_GONE.crumbled);
  B.sg = 'closing'; B.sa = now; B.dn = now; B.su = now + (spec.kind === 'span' ? EG_CLOSING_SPAN_MS : EG_CLOSING_FIGHT_MS);
  out.push(egStageWord(B, now));
}
/** A hall's part in the circle counted for each living member: blows landed in it, or a step through its door. */
function countPart(B) {
  for (const [, m] of living(B)) { if (m.dh > 0 || m.downH === B.h) m.act++; m.dh = 0; }
}
/** THE PULL: every living member to the next hall, its arrival begun, the count held (at most the stair's hold). */
function pull(B, now, out) {
  countPart(B);
  B.h += 1; B.F = null;
  B.sg = 'arrive'; B.sa = now; B.su = now + EG_ARRIVE_MAX_MS; B.pulledAt = now; B.hw = 0; B.dn = 0; B.gatherAt = 0;
  B.cnt = egCountHold(B.cnt, now);
  out.push(egStageWord(B, now));
}
/** THE REDOUBT (section 16): the Court fell - its receipts for every earner, the count's fifteen minutes, the rest. A
 *  Rehearsal ends here instead. */
function redoubt(B, now, out) {
  B.cleared = Math.max(B.cleared, B.h);
  countPart(B);
  if (B.F?.lg?.ads?.length) egHostGone(B.F.lg, now, out, HOST_GONE.crumbled);
  if (B.rh) { egEnd(B, 'rehearsal', now, out); return; }
  const w = egCircleOfHall(B.h), L = living(B), total = L.reduce((s, [, m]) => s + m.dc, 0), n = Math.max(1, L.length);
  // an EARNER: a share of the circle's damage, or a part in three of its five halls (section 16.1)
  const earners = L.filter(([, m]) => m.dc >= total / (2 * n) || m.act >= 3);
  B.rd = w;
  B.cnt = egCountHold(egCountRedoubt(B.cnt, now, Math.max(0, B.op + EG_LAST_WORD_MS - now)), now);
  for (const [sub, m] of earners) owe(B, sub, { q: 'w', w, h: B.h, t: secs(now - B.wk), n: earners.length, ew: B.ew, l: m.lv });
  for (const [, m] of L) { m.dc = 0; m.act = 0; }
  B.F = null;
  B.sg = 'rest'; B.sa = now; B.su = now + EG_REST_MS; B.hw = 0; B.dn = 0;
  out.push({ k: 'rd', w, h: B.h, at: now, cl: Math.round(egCountLeft(B.cnt, now)) }, egStageWord(B, now));
}
/** The rest over: the next circle's first hall (every screen builds it under the veil), or the end when nobody stays. */
function nextCircle(B, now, out) {
  if (!living(B).length) { egEnd(B, 'gone', now, out); return; }
  B.h = egFirstHallOf(egCircleOfHall(B.h) + 1);
  B.sg = 'arrive'; B.sa = now; B.su = now + EG_ARRIVE_MAX_MS; B.pulledAt = now; B.hw = 0; B.dn = 0; B.gatherAt = 0;
  for (const [, m] of living(B)) m.hereH = 0;
  out.push(egStageWord(B, now));
}

/**
 * ONE BEAT of the breach: `bodies` the members' newest fresh poses (`{sub, sx, z, dead, at}` - the Spire's frame:
 * net/sdBrain.js dungeonToRealm's), `rng` a [0,1) source. Moves the record in place; answers the frames to fan, in order.
 * @param {any} B @param {number} now @param {{sub: string, sx: number, z: number, dead: boolean, at?: number}[]} bodies
 * @param {() => number} rng
 */
export function egStep(B, now, bodies, rng) {
  const out = [];
  if (B.end) return out;
  if (now >= B.op + EG_LAST_WORD_MS) { egEnd(B, 'last', now, out); return out; }
  for (const b of bodies) {
    const m = B.mem[b.sub];
    if (!m || !m.in || !m.alive || m.home) continue;
    m.seenAt = Math.max(m.seenAt, b.at ?? now);
    if (b.dead) egFall(B, b.sub, now, out);
  }
  if (B.sg === 'trial') for (const [sub, m] of living(B)) if (now - m.seenAt > EG_ABSENT_TRIAL_MS) egFall(B, sub, now, out);
  if (B.wk && !living(B).length) { egEnd(B, 'wipe', now, out); return out; }
  const T = egTimes(clockRec(B)), alive = bodies.filter((b) => { const m = B.mem[b.sub]; return m && m.in && m.alive && !m.home && !b.dead; });
  if (B.sg === 'wait') {
    if (now >= B.su) { B.h = 1; B.sg = 'arrive'; B.sa = now; B.su = T.admitUntil; B.pulledAt = now; out.push(egStageWord(B, now)); }
    return out;
  }
  const spec = egHallOf(B.seed, B.h);
  const inHall = alive.map((b) => local(spec, b)).filter(Boolean);
  if (B.sg === 'arrive') {
    for (const b of inHall) if (egOnArrive(spec, b.x, b.z, 1.5)) B.mem[b.sub].hereH = B.h;
    const L = living(B);
    const all = B.wk ? L.length > 0 && L.every(([, m]) => m.hereH === B.h) : B.co.every((c) => B.mem[c.sub]?.in && B.mem[c.sub].alive && B.mem[c.sub].hereH === B.h);
    if (all && !B.gatherAt) { B.gatherAt = now; B.su = now + EG_GATHER_MS; out.push(egStageWord(B, now)); }
    if (B.gatherAt && now >= B.gatherAt + EG_GATHER_MS) { wake(B, now, rng, out); return out; }
    if (!B.wk && now >= T.admitUntil) { if (L.length) wake(B, now, rng, out); else egEnd(B, 'empty', now, out); return out; }
    if (B.wk && now >= B.pulledAt + EG_ARRIVE_MAX_MS) { wake(B, now, rng, out); return out; }
    if (B.wk && B.cnt.at === 0 && now >= B.pulledAt + EG_STAIR_HOLD_MS) { B.cnt = egCountRun(B.cnt, now); out.push(egStageWord(B, now)); }
    return out;
  }
  if (B.sg === 'rest') { if (now >= B.su) nextCircle(B, now, out); return out; }
  if (B.sg === 'closing') {
    if (B.cnt.at > 0 && now >= B.dn + EG_CLOSING_COUNT_MS) { B.cnt = egCountHold(B.cnt, now); out.push(egStageWord(B, now)); }
    if (B.cnt.at > 0 && egCountLeft(B.cnt, now) <= 0) { egEnd(B, 'tear', now, out); return out; }
    const L = living(B);
    if (now >= B.su || (L.length && L.every(([, m]) => m.downH === B.h))) pull(B, now, out);
    return out;
  }
  // THE TRIAL
  if (egCountLeft(B.cnt, now) <= 0) { egEnd(B, 'tear', now, out); return out; }
  trial(B, spec, now, inHall, rng, out);
  return out;
}

/** The trial's beat, by the hall's kind. `inHall` the living members standing in the hall (its own frame). */
function trial(B, spec, now, inHall, rng, out) {
  const F = B.F;
  if (!F) return;
  const here = inHall.filter((b) => egOnFight(spec, b.x, b.z, 4));
  const cap = Math.min(EG_STANDING_MAX - egHostCount(F.lg), egLegionCap(F.n, F.c) - egHostCount(F.lg));
  if (spec.kind === 'span') {
    if (inHall.some((b) => egAtDoor(spec, b.x, b.z))) door(B, spec, now, out);
    return;
  }
  if (spec.kind === 'yard') {
    const standing = F.rifts.c.filter((q) => q.h > 0);
    if (!standing.length) { door(B, spec, now, out); return; }
    if (now >= F.waveAt) {
      F.waveAt = now + egWaveEveryMs(F.c);
      let left = cap;
      const each = Math.max(1, Math.ceil(harrierCountFor(F.n) / 2));
      for (const q of standing) {
        if (left <= 0) break;
        const k = Math.min(each, left), toward = Math.atan2(spec.fight.x - q.x, spec.fight.z - q.z), spots = [];
        for (let i = 0; i < k; i++) { const a = toward + (i - (k - 1) / 2) * 0.6; spots.push([q.x + Math.sin(a) * 2.2, q.z + Math.cos(a) * 2.2]); }
        egRaise(F.lg, HOST.harrier, spots, F.harrierHp, now, out);
        left -= k;
      }
    }
    riftHealth(F, now, out);
  } else if (spec.kind === 'proving') {
    egLordStep(F.lord, spec, now, here, rng, out);
    if (F.lord.fell) { door(B, spec, now, out); return; }
  } else if (spec.kind === 'rampart') {
    if (!F.lg.ads.some((a) => a.k === HOST.bearer)) { door(B, spec, now, out); return; }
    if (now >= F.waveAt) {
      F.waveAt = now + EG_MARCH_EVERY_MS;
      const k = Math.min(harrierCountFor(F.n), cap), spots = [];
      for (let i = 0; i < k; i++) spots.push([(i - (k - 1) / 2) * 1.4, spec.gate.z - 8 - (i % 2) * 1.5]);
      if (k > 0) egRaise(F.lg, HOST.harrier, spots, F.harrierHp, now, out);
    }
  } else if (spec.kind === 'court') {
    const L = F.lord;
    if (!L.up) {
      const inRing = inHall.filter((b) => Math.hypot(b.x - spec.ring.x, b.z - spec.ring.z) <= spec.ring.r);
      if (inRing.length && !F.ringAt) F.ringAt = now;
      if ((inRing.length && inRing.length === inHall.length) || (F.ringAt && now >= F.ringAt + EG_WAKE_RING_MS)) { egLordWake(L, now); F.waveAt = now + EG_ESCORT_EVERY_MS; out.push({ k: 'hp', h: L.max, m: L.max }); }
    } else {
      egLordStep(L, spec, now, here, rng, out);
      if (L.fell) { redoubt(B, now, out); return; }
      if (now >= F.waveAt) {
        F.waveAt = now + EG_ESCORT_EVERY_MS;
        const k = Math.min(harrierCountFor(F.n), cap), spots = [];
        for (let i = 0; i < k; i++) { const a = (i / Math.max(1, k)) * 2 * Math.PI + rng(); spots.push([spec.fight.x + Math.sin(a) * (spec.fight.r - 3), spec.fight.z + Math.cos(a) * (spec.fight.r - 3)]); }
        if (k > 0) egRaise(F.lg, HOST.harrier, spots, F.harrierHp, now, out);
      }
    }
  }
  egHostStep(F.lg, spec, now, here, out);
  if (now - F.lastStateAt >= STATE_SEND_MS) { F.lastStateAt = now; const fst = egFightStateOf(B); if (fst) out.push(fst); }
}
/** The rifts' health, at most every HP_SEND_MS, when it has moved (`cxh` - the gate's crystals' word). */
function riftHealth(F, now, out) {
  if (!F.rifts || now - F.rhAt < HP_SEND_MS) return;
  const key = F.rifts.c.map((q) => Math.ceil(Math.max(0, q.h))).join(',');
  if (key === F.rhSent) return;
  F.rhSent = key; F.rhAt = now;
  out.push({ k: 'cxh', i: F.rifts.i, h: F.rifts.c.map((q) => Math.max(0, Math.ceil(q.h))) });
}

/** The best three of the hall by what they dealt in it - a fall's word. */
const topOf = (B) => Object.values(B.mem).filter((m) => m.in && m.dh > 0).sort((a, b) => b.dh - a.dh).slice(0, 3).map((m) => m.name);

/**
 * A MEMBER'S BLOW (`m` the wire's `hit`, `ahit` or `xhit`), from where its own pose stands (`pose` - the Spire's frame
 * `{sx, z}`), judged by the gate's hand and purse: only in a trial, from a living member, in the hall. Answers the frames.
 */
export function egBlow(B, sub, m, pose, now) {
  const out = [];
  const mm = B.mem[sub], F = B.F;
  if (!mm || !mm.in || !mm.alive || mm.home || B.sg !== 'trial' || !F || !pose) return out;
  const spec = egHallOf(B.seed, B.h), p = local(spec, { sub, sx: pose.sx, z: pose.z, dead: false });
  if (!p) return out;
  let got = 0;
  if (m.k === 'hit' && F.lord) {
    const r = egLordHit(F.lord, spec, mm, sub, m.d, m.r, p, now, m.q, () => topOf(B));
    out.push(...r.out); got = r.got;
  } else if (m.k === 'ahit') {
    const r = egHostHit(F.lg, spec, mm, mm.name, m.i, m.d, m.r, p, now, m.q);
    out.push(...r.out); got = r.got;
  } else if (m.k === 'xhit' && F.rifts) {
    const q = F.rifts.c[m.c];
    if (q && q.h > 0 && spendBlow(mm, now, m.q, `x${m.c}`) && egOnFight(spec, p.x, p.z, POSE_SLACK + 6)
      && !(m.r === HIT_KINDS.Melee && Math.hypot(p.x - q.x, p.z - q.z) - CRYSTAL_R > MELEE_REACH + POSE_SLACK)) {
      got = spendPurse(mm, m.d, q.h, now);
      q.h -= got;
      if (q.h <= 1e-6) { q.h = 0; out.push({ k: 'cxb', i: F.rifts.i, c: m.c, n: mm.name, at: now }); }
    }
  }
  mm.dh += got; mm.dc += got;
  return out;
}
/** A member's step through the door (`down`): in the closing of hall `h`, from a living member standing at it. Answers
 *  whether it was believed. */
export function egDown(B, sub, h, pose, now) {
  const mm = B.mem[sub];
  if (!mm || !mm.in || !mm.alive || mm.home || B.sg !== 'closing' || h !== B.h || !pose) return false;
  const spec = egHallOf(B.seed, B.h), p = local(spec, { sub, sx: pose.sx, z: pose.z, dead: false });
  if (!p || !egAtDoor(spec, p.x, p.z, 2)) return false;
  mm.downH = h;
  return true;
}
/** Is the breach still running at `now` (its room's beat wanted)? */
export const egLive = (B, now) => !!B && !B.end && now < B.op + EG_LAST_WORD_MS;
