// @ts-check
// EG-PLAY (2026-10-11, the Elite Gates arc; bible/11-Multiplayer/Elite-Gates.md sections 6, 7, 8, 9 and 23): THE
// ELITE BREACH'S LAW - its room, its clock and the count, the circle's rhythm and every hall's spec. Pure, and read
// alike by the relay (net/egBrain.js runs the halls off it) and every client (world/egHall.js builds them off it): one
// seed and one hall number give one hall on every machine.
//
// THE LAW DECIDES IN INTEGERS (section 9): every length is drawn in centimetres and every time in milliseconds off the
// port's seeded die (net/sdBrain.js sdRng), and its trigonometry is the table below (`lawSin`, `lawCos` - whole degrees
// in steps of 5, sines times 10,000). No transcendental runs here: V8's and JavaScriptCore's can differ in the last bit,
// and one flipped draw would give the relay and a phone different halls. A source sweep holds it
// (test/egplay_law.test.js).
//
// THE SPIRE'S FRAME is the gate's court frame (net/gateBrain.js COURT_CENTRE, the made block's middle - the Hour's
// SD_REALM_ORIGIN too): metres, floors at y 0, the dungeon's own x and z less [25.6, 0, 25.6]. A circle is one made
// level: its five halls stand side by side, hall slot `s`'s origin at x `x0` = (s - 1) * EG_HALL_PITCH. Every position a
// spec says is in its HALL'S OWN FRAME - about that origin, laid along +z from its arrival plate at (0, 0) - so a hall's
// fight stands inside the gate's wire bounds (net/wire.js GATE_COURT_BOUND) and the gate's own client pieces (the
// legion's bodies, the blows' verdicts, the telegraph pass) read the Spire's fights about the hall's centre unchanged.
//
// What EG-PLAY's law holds, and what it leaves (Elite-Gates.md section 31, EG-PLAY): the Broken Galleries' four hall
// kinds (the Rift-Yard, the Span, the Proving Walk, the Rampart) and the Court, in their first variants, at every depth;
// the first circle fixed (section 7); a Span's Oblivion Caverns passage in circles 1 and 2. The Athenaeum, the twists,
// the decrees, the later bands, the fork and the timed solver are later slices'.
//
// Not a DFU member. Ledger A (ELITE-GATES).
import { sdSeed, sdRng } from './sdBrain.js';

/** The spec law's number - a change to any draw below changes it (and the relay's version with it). */
export const EG_SPEC = 1;
/** The most a company holds (the party's own PARTY_MAX, net/wire.js - pinned equal). */
export const EG_PARTY_MAX = 8;

// ── the room ──────────────────────────────────────────────────────────────────────────────────────────────
/** A breach's id: 16 hex, the service's draw at the open (the arena bout's shape). */
export const EG_BREACH_RE = /^[0-9a-f]{16}$/;
/** An order's id (`ez`), and the client's request id an open is idempotent on (`rq`). */
export const EG_ORDER_ID_RE = /^[a-z0-9]{16,32}$/;
/** The breach's room: `eg:<16hex>`. */
export const EG_ROOM = /^eg:[0-9a-f]{16}$/;
export const egRoomKey = (b) => `eg:${b}`;
export const isEgRoom = (key) => typeof key === 'string' && EG_ROOM.test(key);
export const egBreachOfRoom = (key) => (isEgRoom(key) ? key.slice(3) : null);

// ── the clock (section 6.2) ────────────────────────────────────────────────────────────────────────────────
/** A game minute in real ms (the shared clock's TimeScale 12 - net/wire.js sharedClassicMinutes). */
export const EG_GAME_MIN_MS = 5000;
/** The arch's climb out of the ground (the gate's GATE_RISE_MS). */
export const EG_RISE_MS = 20_000;
/** From the opening to the open: the sealed hour (60 game minutes). */
export const EG_RISE_MIN = 60;
export const EG_SEALED_MS = EG_RISE_MIN * EG_GAME_MIN_MS;
/** The open window: at most this long after the open for the first hall to wake. */
export const EG_ADMIT_MAX_MIN = 60;
export const EG_ADMIT_MAX_MS = EG_ADMIT_MAX_MIN * EG_GAME_MIN_MS;
/** The count: where it starts at the first wake, what a Redoubt adds, the most it holds. */
export const EG_COUNT_START_MIN = 360;
export const EG_REDOUBT_HOLD_MIN = 180;
export const EG_COUNT_CAP_MIN = 360;
export const EG_COUNT_START_MS = EG_COUNT_START_MIN * EG_GAME_MIN_MS;
export const EG_REDOUBT_HOLD_MS = EG_REDOUBT_HOLD_MIN * EG_GAME_MIN_MS;
export const EG_COUNT_CAP_MS = EG_COUNT_CAP_MIN * EG_GAME_MIN_MS;
/** The last word: no breach outlives its opening by more (36 game hours, three real ones). */
export const EG_LAST_WORD_MIN = 2160;
export const EG_LAST_WORD_MS = EG_LAST_WORD_MIN * EG_GAME_MIN_MS;
/** A Redoubt's rest (the count held). */
export const EG_REST_S = 90;
export const EG_REST_MS = EG_REST_S * 1000;
/** The closing runs the count its first seconds, then holds it; the pull to the next wake holds it at most this long. */
export const EG_CLOSING_COUNT_S = 15;
export const EG_CLOSING_COUNT_MS = EG_CLOSING_COUNT_S * 1000;
export const EG_STAIR_HOLD_S = 40;
export const EG_STAIR_HOLD_MS = EG_STAIR_HOLD_S * 1000;
/** A hall's stages (section 7): the longest the gather waits after the pull, the gather after the last `here`, the
 *  closing after a fight and after a span, how near the door a step through is believed. */
export const EG_ARRIVE_MAX_MS = 30_000;
export const EG_GATHER_MS = 8000;
export const EG_CLOSING_FIGHT_MS = 20_000;
export const EG_CLOSING_SPAN_MS = 45_000;
export const EG_DOOR_REACH_M = 3;
/** The Court's wake ring: the lord wakes when every living member stands in it, or this long after the first does. */
export const EG_WAKE_RING_MS = 20_000;
/** The void's cost (section 8): a tenth of the body's health, never below a quarter of it. */
export const EG_CAST_BACK_LOSS = 0.1;
export const EG_CAST_BACK_FLOOR = 0.25;
/** Below this (the Spire's y) the void has a body - the Hour's SD_VOID_Y. */
export const EG_VOID_Y = -30;
/** Absent this long in a trial, a member is counted fallen (section 6.1). */
export const EG_ABSENT_TRIAL_MS = 180_000;

/**
 * A breach's instants, relay-clock ms, from its opening (the moment the room accepted the open): the arch risen, the
 * open, the open window's end, the last word.
 * @param {{ openedAt: number }} rec
 */
export function egTimes(rec) {
  const o = rec.openedAt;
  return { openedAt: o, risenAt: o + EG_RISE_MS, openAt: o + EG_SEALED_MS, admitUntil: o + EG_SEALED_MS + EG_ADMIT_MAX_MS, lastWordAt: o + EG_LAST_WORD_MS };
}
/**
 * The breach's phase at `now` (section 6.2): 'rising' | 'sealed' | 'open' | 'deep' | 'torn' | 'ended'. `wokeAt` the
 * first hall's wake (0 none yet), `endAt`/`why` its end (0 none) - a torn breach is 'torn' from its end on.
 * @param {{ openedAt: number, wokeAt?: number, endAt?: number, why?: string|null }} rec @param {number} now
 */
export function egPhase(rec, now) {
  if (rec.endAt > 0 && now >= rec.endAt) return rec.why === 'tear' ? 'torn' : 'ended';
  const T = egTimes(rec);
  if (now >= T.lastWordAt) return 'ended';
  if (rec.wokeAt > 0) return 'deep';
  if (now < T.risenAt) return 'rising';
  if (now < T.openAt) return 'sealed';
  return now < T.admitUntil ? 'open' : 'ended';
}
/** Does the breach still take members through its door at `now` (its open window, before the first wake)? */
export const egAdmits = (rec, now) => egPhase(rec, now) === 'open';

/**
 * THE COUNT (section 6.2) as the relay keeps it: what is `left` (ms) and, while it runs, the instant it last began to
 * (`at`; 0 while it holds). Every screen draws the same from the frames' `cl`/`ca`.
 */
export const egCountNew = () => ({ left: EG_COUNT_START_MS, at: 0 });
/** What is left at `now`. */
export const egCountLeft = (c, now) => (c.at > 0 ? Math.max(0, c.left - Math.max(0, now - c.at)) : c.left);
/** The count set running at `now` (one already running is unchanged). */
export const egCountRun = (c, now) => (c.at > 0 ? c : { left: c.left, at: now });
/** The count held at `now`, what is left kept. */
export const egCountHold = (c, now) => (c.at > 0 ? { left: egCountLeft(c, now), at: 0 } : c);
/** A Redoubt taken at `now`: EG_REDOUBT_HOLD_MS more, never past the cap nor the last word (`lastWordLeft`, ms) -
 *  `remaining = min(remaining + hold, cap, lastWord - elapsed)`. It runs or holds as it did. */
export function egCountRedoubt(c, now, lastWordLeft) {
  const left = Math.max(0, Math.min(egCountLeft(c, now) + EG_REDOUBT_HOLD_MS, EG_COUNT_CAP_MS, lastWordLeft));
  return { left, at: c.at > 0 ? now : 0 };
}
/** The count as the chip says it: `m:ss`, the minutes uncapped (1:05:00 never - the cap is thirty). */
export function egCountText(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ── the halls and circles (section 7) ──────────────────────────────────────────────────────────────────────
/** Hall h's circle, its slot (1-5), and whether it is a Court. */
export const egCircleOfHall = (h) => Math.ceil(h / 5);
export const egSlotOfHall = (h) => ((h - 1) % 5) + 1;
export const egIsCourt = (h) => h % 5 === 0;
/** A circle's first hall. */
export const egFirstHallOf = (c) => 5 * (c - 1) + 1;
/** The kinds EG-PLAY holds, and each one's words. */
export const EG_HALL_KINDS = Object.freeze(['yard', 'span', 'proving', 'rampart', 'court']);
export const EG_HALL_NAMES = Object.freeze({ yard: 'The Rift-Yard', span: 'The Span', proving: 'The Proving Walk', rampart: 'The Rampart', court: 'The Court' });
export const EG_OBJECTIVES = Object.freeze({ yard: 'Close the rifts.', span: 'Cross to the far plate.', proving: 'Defeat the champion.', rampart: 'Break the gate.', court: 'Defeat the lord.' });
/** The band - EG-PLAY's halls are all the Broken Galleries' (the later bands are EG18-EG20's). */
export const EG_BAND_NAMES = Object.freeze(['The Broken Galleries']);
/** Halls stand this far apart across x in a circle's level (m) - far past the fog, so a hall never sees the next. */
export const EG_HALL_PITCH = 500;

/** The breach's seed for a draw (the Hour's mix - net/sdBrain.js sdSeed). */
export const egSeed = (seed, salt) => sdSeed(seed >>> 0, salt >>> 0);
const CIRCLE_SALT = 0x0e6c1c;
const HALL_SALT = 0x0e6a11;

/**
 * THE CIRCLE (section 7's rhythm): its five slots' kinds - a fight, the traverse, the mixed, a fight drawn apart from the
 * first, the Court. The first circle is fixed: a Rift-Yard, a Span through an Oblivion Caverns passage, a Proving Walk,
 * a Rampart and the Court. Deeper, slot 1 is the Rift-Yard or the Rampart at the Galleries' weights (3 to 2) and slot 4
 * the other.
 * @param {number} seed @param {number} c
 * @returns {ReadonlyArray<string>}
 */
export function egCircleOf(seed, c) {
  if (c <= 1) return FIRST_CIRCLE;
  const r = sdRng(egSeed(seed, CIRCLE_SALT + c));
  const one = r() * 5 < 3 ? 'yard' : 'rampart';
  return Object.freeze([one, 'span', 'proving', one === 'yard' ? 'rampart' : 'yard', 'court']);
}
const FIRST_CIRCLE = Object.freeze(['yard', 'span', 'proving', 'rampart', 'court']);

// ── the law's trigonometry: whole degrees in steps of 5, sines times 10,000 ────────────────────────────────
const SIN_Q = Object.freeze([0, 872, 1736, 2588, 3420, 4226, 5000, 5736, 6428, 7071, 7660, 8192, 8660, 9063, 9397, 9659, 9848, 9962, 10000]);
/** The sine of `deg` (a multiple of 5) times 10,000, exact in integers. */
export function lawSin(deg) {
  const d = (((deg | 0) % 360) + 360) % 360;
  if (d % 5 !== 0) throw new Error(`lawSin: ${deg} is not a multiple of 5`);
  const q = d / 5;
  if (q <= 18) return SIN_Q[q];
  if (q <= 36) return SIN_Q[36 - q];
  if (q <= 54) return -SIN_Q[q - 36];
  return -SIN_Q[72 - q];
}
export const lawCos = (deg) => lawSin((deg | 0) + 90);
/** A point `r` cm from (x, z) at bearing `deg` (the court frame's: 0 along +z, 90 along +x), whole centimetres. */
const polar = (x, z, r, deg) => [x + Math.trunc((r * lawSin(deg)) / 10000), z + Math.trunc((r * lawCos(deg)) / 10000)];

// ── the hall spec (section 9) ──────────────────────────────────────────────────────────────────────────────
/** A die's whole number from lo to hi, both in. */
const between = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const m = (cm) => cm / 100;
/** The span's pieces, the Steps' sizes and clocks (world/sdSteps.js - pinned equal), in cm and ms. */
export const EG_STEP = Object.freeze({
  drift: Object.freeze({ w: 300, d: 240 }), beat: Object.freeze({ w: 300, d: 260 }), riser: Object.freeze({ w: 300, d: 260 }),
  crumble: Object.freeze({ w: 260, d: 260 }), still: Object.freeze({ w: 300, d: 260 }), ledge: Object.freeze({ w: 240, d: 200 }),
});
export const EG_RISER_CM = 230;
export const EG_BEAT_HALF_MS = 1800;
export const EG_GAP_MIN_CM = 240;
export const EG_GAP_MAX_CM = 320;
/** A step down within a run is under a metre (THE ENVELOPE, section 10.4). */
export const EG_STEP_DOWN_CM = 95;
/** No hall runs longer than this (m): its fight's every point stays inside the gate's wire bound (net/wire.js
 *  GATE_COURT_BOUND, 160 - pinned under it). */
export const EG_HALL_LEN_MAX = 158;
/** A plate's radius, an island's, a bridge's half-width (cm). */
const PLATE_R = 500, ISLE_R = 300, BRIDGE_HALF = 200;
/** The Oblivion Caverns passage (section 11's first fragment, EG-PLAY's form): its floor's half-width, its length, the
 *  chasm in it and the ledges that cross it, its height (cm). */
export const EG_CAVE = Object.freeze({ halfW: 300, len: 2800, chasm: 1000, height: 520 });

/**
 * HALL h's SPEC: its kind, circle, slot, name and objective; its geometry in the Spire's frame (metres) - the plates
 * (`arrive`, `end`), the walkable discs and bands (`discs`, `bands`), a span's steps and islands (the Steps' record:
 * `{i, kind, span, x, y, z, w, d, amp, period, phase, beat}`, period and phase in seconds), the Oblivion Caverns
 * passages (`caves`), and the trial's own: the fight floor (`fight`), a Yard's rift sockets (`rifts`), a Rampart's vent
 * lanes (`vents`, ms) and its gate (`gate`, its Ward-Bearers' spots), a champion's or a lord's spot (`foe`). Frozen,
 * and cached (the relay and every frame ask it often).
 * @param {number} seed @param {number} h
 */
export function egHallOf(seed, h) {
  const key = `${seed >>> 0}:${h}`;
  const had = _specs.get(key);
  if (had) return had;
  const spec = deepFreeze(layHall(seed >>> 0, h));
  if (_specs.size >= 32) _specs.delete(_specs.keys().next().value);
  _specs.set(key, spec);
  return spec;
}
const _specs = new Map();
const deepFreeze = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) deepFreeze(v); } return o; };

function layHall(seed, h) {
  const c = egCircleOfHall(h), slot = egSlotOfHall(h), kind = egCircleOf(seed, c)[slot - 1];
  const r = sdRng(egSeed(seed, HALL_SALT + h));
  const X = 0;   // the hall's own frame: its origin is `x0`
  /** the hall's parts in cm, said in metres at the end */
  const P = { discs: [], bands: [], steps: [], islands: [], caves: [], rifts: [], vents: [], fight: null, gate: null, foe: null, arrive: null, end: null, ring: null };
  const disc = (x, z, rad, role, y = 0) => { const d = { x, y, z, r: rad, role }; P.discs.push(d); return d; };
  const band = (z0, z1, half, role, y = 0) => { const b = { x: X, y, z0, z1, halfW: half, role }; P.bands.push(b); return b; };
  let edge = 0, y = 0, span = 0, risen = false;
  /** a step laid `gap` past the edge (its unused fields nought, one shape for every step - the Steps' law) */
  const step = (kind, gap, o = {}) => {
    const S = EG_STEP[kind];
    const z = edge + gap + S.d / 2;
    P.steps.push({ i: P.steps.length, kind, span, x: X + (o.x ?? 0), y, z, w: S.w, d: S.d, amp: o.amp ?? 0, period: o.period ?? 0, phase: o.phase ?? 0, beat: o.beat ?? 0 });
    edge = z + S.d / 2;
  };
  const gap = () => between(r, EG_GAP_MIN_CM, EG_GAP_MAX_CM);
  const island = (g = gap()) => { const z = edge + g + ISLE_R; P.islands.push({ x: X, y, z, r: ISLE_R }); disc(X, z, ISLE_R, 'island', y); edge = z + ISLE_R; span++; };
  /** a run of `n` steps of one kind (a Drift's swing, a Beat's alternate halves and its risers, a Crumble's steps down) */
  const run = (kind, n) => {
    if (kind === 'drift') for (let k = 0; k < n; k++) step('drift', gap(), { amp: between(r, 100, 200), period: between(r, 40, 70) * 100, phase: k * 900 });
    else if (kind === 'beat') {
      const riserAt = n >= 5 && !risen ? between(r, 2, n - 2) : -1;   // one riser a hall: the climb down after it stays short
      let b = 0;
      for (let k = 0; k < n; k++) {
        if (k === riserAt) { y += EG_RISER_CM; risen = true; step('riser', 0); continue; }
        step('beat', gap(), { beat: (b++ % 2) * EG_BEAT_HALF_MS });
      }
    } else if (kind === 'crumble') {
      const drop = Math.ceil(y / Math.max(1, n));
      for (let k = 0; k < n; k++) { y = Math.max(0, y - drop); step('crumble', gap()); }
    } else for (let k = 0; k < n; k++) step('still', gap());
  };
  /** THE OBLIVION CAVERNS PASSAGE: a tunnel of basalt over the course, its floor broken by a chasm crossed on ledges */
  const cave = () => {
    const z0 = edge, zA = z0 + Math.floor((EG_CAVE.len - EG_CAVE.chasm) / 2), zB = zA + EG_CAVE.chasm, z1 = z0 + EG_CAVE.len;
    band(z0, zA, EG_CAVE.halfW, 'cave', y);
    edge = zA;
    const ledges = 3, lgap = Math.floor((EG_CAVE.chasm - ledges * EG_STEP.ledge.d) / (ledges + 1));
    for (let k = 0; k < ledges; k++) step('ledge', lgap, { x: (k % 2 === 0 ? -1 : 1) * 60 });
    band(zB, z1, EG_CAVE.halfW, 'cave', y);
    P.caves.push({ x: X, y, z0, z1, zA, zB, halfW: EG_CAVE.halfW, height: EG_CAVE.height, curtain: zA - 120 });
    edge = z1;
  };
  P.arrive = disc(X, 0, PLATE_R, 'arrive');
  edge = PLATE_R;
  if (kind === 'yard') {
    const R = between(r, 22, 26) * 100;
    band(edge - 50, edge + 450, BRIDGE_HALF, 'bridge');
    const zc = edge + 400 + R;
    P.fight = disc(X, zc, R, 'court');
    // five sockets on the rim, three on one side and two on the other, clear of both bridges; the first k are used
    const turn = between(r, -1, 1) * 5;
    for (const deg of [60, 240, 120, 300, 90]) { const [x, z] = polar(X, zc, R - 300, deg + turn); P.rifts.push({ x, z }); }
    edge = zc + R;
    band(edge - 50, edge + 600, BRIDGE_HALF, 'bridge');
    edge += 600;
  } else if (kind === 'span') {
    const kinds = c <= 1 ? ['drift', 'beat'] : [['drift', 'beat', 'crumble'][between(r, 0, 2)], ['beat', 'crumble', 'drift'][between(r, 0, 2)]];
    run(kinds[0], c <= 1 ? 6 : between(r, 4, 5));
    island();
    if (c <= 2) { cave(); island(between(r, 200, 260)); }   // in circles 1 and 2 every span carries a passage (section 7)
    run(kinds[1], c <= 1 ? 6 : between(r, 4, 5));
    if (c >= 3) { island(); run(['drift', 'crumble', 'beat'][between(r, 0, 2)], between(r, 3, 4)); }
    if (y > 0) { island(); run('crumble', Math.max(2, Math.ceil(y / EG_STEP_DOWN_CM))); }   // down to the plate's level, a step at a time
    edge += gap();
  } else if (kind === 'proving') {
    run(c <= 1 ? 'still' : 'drift', between(r, 5, 7));
    const R = 1400, zc = edge + gap() + R;
    P.fight = disc(X, zc, R, 'court', y);
    P.foe = { x: X, z: zc + 400 };
    edge = zc + R;
    run(c <= 1 ? 'drift' : ['drift', 'beat'][between(r, 0, 1)], between(r, 4, 6));
    if (y > 0) { island(); run('crumble', Math.max(2, Math.ceil(y / EG_STEP_DOWN_CM))); }
    edge += gap();
  } else if (kind === 'rampart') {
    const L = between(r, 9, 12) * 1000, half = 250;
    const w = band(edge - 50, edge + L, half, 'walk');
    // bastions every 35-45 m, off its sides by turns: the back of the line's fight floors
    let side = r() < 0.5 ? -1 : 1;
    for (let z = edge + between(r, 30, 40) * 100; z < edge + L - 1500; z += between(r, 35, 45) * 100, side = -side) disc(X + side * (half + 550), z, 600, 'bastion');
    // vent lanes across it from 20 m in, every 16-22 m, each its own cycle: 1.0 s warned, 0.5 s erupting
    for (let z = edge + 2000; z < edge + L - 1400; z += between(r, 16, 22) * 100) P.vents.push({ x: X, z, d: 400, halfW: half + 100, cycle: between(r, 40, 60) * 100, phase: between(r, 0, 39) * 100 });
    const zg = edge + L - 300;
    P.gate = { x: X, z: zg, halfW: half, bearers: [{ x: X - 150, z: zg - 350 }, { x: X + 150, z: zg - 350 }] };
    P.fight = { x: X, y: 0, z: edge + L / 2, r: Math.floor(L / 2) + 600, role: 'walk' };
    P.walk = { x: X, z0: w.z0, z1: w.z1, halfW: half };
    edge += L;
  } else {
    run(c <= 1 ? 'still' : 'drift', between(r, 3, 5));
    const R = 2600, zc = edge + gap() + R;
    P.fight = disc(X, zc, R, 'court', y);
    P.foe = { x: X, z: zc };
    P.ring = { x: X, z: zc, r: R - 100 };
    edge = zc + R;
  }
  if (kind !== 'court') { const z = edge + PLATE_R; P.end = disc(X, z, PLATE_R, 'end', y); edge = z + PLATE_R; }
  // said in metres
  const pt = (q) => (q ? { ...q, x: m(q.x), y: m(q.y ?? 0), z: m(q.z), ...(q.r != null ? { r: m(q.r) } : {}) } : null);
  return {
    v: EG_SPEC, seed, h, c, slot, kind, band: 0, name: EG_HALL_NAMES[kind], objective: EG_OBJECTIVES[kind],
    x0: (slot - 1) * EG_HALL_PITCH, len: m(edge),
    arrive: pt(P.arrive), end: pt(P.end),
    discs: P.discs.map(pt),
    bands: P.bands.map((b) => ({ x: m(b.x), y: m(b.y), z0: m(b.z0), z1: m(b.z1), halfW: m(b.halfW), role: b.role })),
    steps: P.steps.map((s) => ({ i: s.i, kind: s.kind, span: s.span, x: m(s.x), y: m(s.y), z: m(s.z), w: m(s.w), d: m(s.d), amp: m(s.amp), period: s.period / 1000, phase: s.phase / 1000, beat: s.beat / 1000 })),
    islands: P.islands.map(pt),
    caves: P.caves.map((q) => ({ x: m(q.x), y: m(q.y), z0: m(q.z0), z1: m(q.z1), zA: m(q.zA), zB: m(q.zB), halfW: m(q.halfW), height: m(q.height), curtain: m(q.curtain) })),
    fight: pt(P.fight), foe: P.foe ? { x: m(P.foe.x), z: m(P.foe.z) } : null, ring: pt(P.ring),
    rifts: P.rifts.map((q) => ({ x: m(q.x), z: m(q.z) })),
    vents: P.vents.map((q) => ({ x: m(q.x), z: m(q.z), d: m(q.d), halfW: m(q.halfW), cycle: q.cycle, phase: q.phase })),
    gate: P.gate ? { x: m(P.gate.x), z: m(P.gate.z), halfW: m(P.gate.halfW), bearers: P.gate.bearers.map((q) => ({ x: m(q.x), z: m(q.z) })) } : null,
    walk: P.walk ? { x: m(P.walk.x), z0: m(P.walk.z0), z1: m(P.walk.z1), halfW: m(P.walk.halfW) } : null,
  };
}

/** A circle's five specs, in slot order. */
export const egCircleSpecs = (seed, c) => [1, 2, 3, 4, 5].map((s) => egHallOf(seed, egFirstHallOf(c) + s - 1));

/** The spec's digest (section 9's `sd`): FNV-1a over its JSON - one seed, one digest, on every machine. */
export function egSpecDigest(spec) {
  const s = JSON.stringify(spec);
  let hsh = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { hsh ^= s.charCodeAt(i); hsh = Math.imul(hsh, 0x01000193); }
  return hsh >>> 0;
}

// ── where a body stands (the relay's judgements and the motor's edge) ─────────────────────────────────────
/** Is (x, z) (the hall's own frame, as every helper below) on one of the spec's floors - its discs, its bands, its steps
 *  at rest - within `pad` m? */
export function egOnFloor(spec, x, z, pad = 0) {
  for (const d of spec.discs) if (Math.hypot(x - d.x, z - d.z) <= d.r + pad) return true;
  for (const b of spec.bands) if (z >= b.z0 - pad && z <= b.z1 + pad && Math.abs(x - b.x) <= b.halfW + pad) return true;
  for (const s of spec.steps) if (Math.abs(z - s.z) <= s.d / 2 + pad && Math.abs(x - s.x) <= s.w / 2 + s.amp + pad) return true;
  return false;
}
/** Is the Spire-frame point (sx, z) within hall `spec`'s ground at all (its x strip about its origin and its length,
 *  `pad` m about) - a member is in a hall when their pose is. */
export const egInHall = (spec, sx, z, pad = 40) => Math.abs(sx - spec.x0) <= 120 + pad && z >= -pad && z <= spec.len + pad;
/** A Spire-frame x in a hall's own frame, and back. */
export const egLocalX = (spec, sx) => sx - spec.x0;
export const egSpireX = (spec, x) => x + spec.x0;
/** Which slot's hall (1-5) of a circle a pose stands in, by its x; 0 none. */
export function egSlotAt(x) {
  const s = Math.round(x / EG_HALL_PITCH) + 1;
  return s >= 1 && s <= 5 && Math.abs(x - (s - 1) * EG_HALL_PITCH) <= EG_HALL_PITCH / 2 ? s : 0;
}
/** Is (x, z) on the hall's arrival plate (pad m about)? On its end plate, at its door? */
export const egOnArrive = (spec, x, z, pad = 1) => !!spec.arrive && Math.hypot(x - spec.arrive.x, z - spec.arrive.z) <= spec.arrive.r + pad;
export const egAtDoor = (spec, x, z, pad = 0) => !!spec.end && Math.hypot(x - spec.end.x, z - spec.end.z) <= EG_DOOR_REACH_M + pad;
/** Is (x, z) inside the trial's fight floor, `pad` m about (a Rampart's: its walkway and bastions)? */
export function egOnFight(spec, x, z, pad = 0) {
  if (!spec.fight) return false;
  if (spec.walk) {
    if (z >= spec.walk.z0 - pad && z <= spec.walk.z1 + pad && Math.abs(x - spec.walk.x) <= spec.walk.halfW + pad) return true;
    return spec.discs.some((d) => d.role === 'bastion' && Math.hypot(x - d.x, z - d.z) <= d.r + pad);
  }
  return Math.hypot(x - spec.fight.x, z - spec.fight.z) <= spec.fight.r + pad;
}
/** The nearest point of the fight floor to (x, z), `inset` m inside its edge (the legion and the lord keep to it). */
export function egKeepOnFight(spec, x, z, inset = 0) {
  if (!spec.fight) return [x, z];
  if (spec.walk) {
    const W = spec.walk;
    if (egOnFight(spec, x, z, -inset)) return [x, z];
    return [Math.max(W.x - W.halfW + inset, Math.min(W.x + W.halfW - inset, x)), Math.max(W.z0 + inset, Math.min(W.z1 - inset, z))];
  }
  const F = spec.fight, dx = x - F.x, dz = z - F.z, d = Math.hypot(dx, dz), R = Math.max(0, F.r - inset);
  return d <= R ? [x, z] : [F.x + (dx / d) * R, F.z + (dz / d) * R];
}

// ── the Rampart's vents, on the relay's clock from the hall's wake ────────────────────────────────────────
/** A vent's warning and its eruption (ms) - 1.0 s told, half a second of fire. */
export const EG_VENT_WARN_MS = 1000;
export const EG_VENT_FIRE_MS = 500;
/** A vent's stroke: 20% of the struck body's health, fire. */
export const EG_VENT_PCT = 0.2;
/** Where vent `v`'s cycle stands at `now` from the hall's wake `wokeAt`: 'quiet' | 'warn' | 'fire', and the eruption
 *  this cycle is (its instant - one verdict a stroke). */
export function egVentAt(v, wokeAt, now) {
  if (!(wokeAt > 0) || now < wokeAt) return { st: 'quiet', at: 0, k: 0 };
  const t = now - wokeAt + v.phase, n = Math.floor(t / v.cycle), u = t - n * v.cycle;
  const fireAt = v.cycle - EG_VENT_FIRE_MS;
  const at = wokeAt - v.phase + n * v.cycle + fireAt;
  if (u >= fireAt) return { st: 'fire', at, k: (u - fireAt) / EG_VENT_FIRE_MS };
  if (u >= fireAt - EG_VENT_WARN_MS) return { st: 'warn', at, k: (u - (fireAt - EG_VENT_WARN_MS)) / EG_VENT_WARN_MS };
  return { st: 'quiet', at, k: 0 };
}
/** Is (x, z) in vent `v`'s lane? */
export const egInVent = (v, x, z) => Math.abs(z - v.z) <= v.d / 2 && Math.abs(x - v.x) <= v.halfW;

// ── the words ──────────────────────────────────────────────────────────────────────────────────────────────
export const EG_TEXT = Object.freeze({
  name: 'Elite Breach',
  keyName: 'Weir Key',
  keyLine: "One of the Spire's portal keys, surrendered to the Kyn in 3E 398. It opens the Weir Gate's road from this side.",
  cold: 'The key is cold here.',
  sky: 'The key wants open sky.',
  near: 'Another breach stands near.',
  held: 'You hold a breach already.',
  shut: "The Spire's road is shut. Try again soon.",
  rust: 'The key turns to rust.',
  noKeys: 'You hold no Weir Key.',
  guest: 'Sign in to open an Elite Breach.',
  opening: 'The Weir Key turns. The Spire answers.',
  call: (opener) => `${opener} opens an Elite Breach.`,
  answer: (left) => `Answer the call - ${left}`,
  sealed: (left) => `The breach opens in ${left}.`,
  opens: 'The breach is open. Step through.',
  late: (opener) => `The breach has closed behind ${opener}'s company.`,
  outside: (opener) => `The breach answers only to ${opener}'s company.`,
  indoors: 'Answer from open ground.',
  gather: (k, n) => `${k} of ${n} here`,
  wakes: 'The hall wakes.',
  door: 'The way down opens.',
  pulled: 'The Spire pulls you down.',
  count: (left) => `The count: ${left}`,
  torn: 'The Covenant tears the breach shut.',
  falls: (who) => `${who} falls.`,
  fallen: 'The Spire will not take you back.',
  castBack: 'The void casts you back.',
  redoubt: (w) => `Redoubt ${w}`,
  redoubtSub: (band) => band,
  rest: 'The Redoubt holds the count.',
  descend: 'The stair down opens.',
  wayHome: 'The way home',
  walkHome: 'Walk home? The Redoubts you took are kept.',
  ended: 'The breach is over.',
  rehearsal: 'Rehearse - Halls 1-5, no key',
  rehearsalDone: 'The Rehearsal is over. The Spire waits for a key.',
  noSave: 'The Spire keeps no saves.',
  noMap: 'The Spire keeps no map.',
  noRest: 'There is no rest in the Spire but a Redoubt.',
  noRecall: 'The Spire holds you.',
  noCompanions: 'Your companions cannot follow you into the Spire.',
});
