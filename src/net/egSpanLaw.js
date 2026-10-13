// @ts-check
// EG-FULL, LAYER TWO (2026-10-11, Mac: "I said I want everything"; bible/11-Multiplayer/Elite-Gates.md sections 10.3-10.5):
// THE SPANS' LAW - where every piece of a span stands at a moment of the shared clock, and THE TIMED SOLVER that lets the
// generator lay only courses a player can cross. One law for the relay's hall spec (net/egLaw.js asks the solver while it
// lays a hall) and every screen (scenes/egSpan.js moves the pieces by it, scenes/egFight.js draws their tells by it).
//
// THE PIECES (metres and seconds, a hall's own frame; every number at every depth - NOTHING GETS FASTER):
//   Drift     swings across the course, `amp` either side, over `period` (the Steps' stepAt).
//   Beat      stands SD_BEAT_SOLID of every SD_BEAT_CYCLE, alternate steps half a cycle apart (the Steps' beatStands).
//   Crumble   falls SD_CRUMBLE_DELAY after a foot and comes back (each member's own - no shared motion).
//   Rail      travels along the course, `amp` either way, over `period` - ridden.
//   Pendulum  a chained weight swinging across the GAP before its step, EG_PEND_REACH either side, over `period`; a touch
//             is a cast-back (Iron Footing III shrugs it).
//   Vent      a disc EG_VENT_R across under a platform at least EG_VENT_MIN_W wide, erupting EG_VENT_FIRE_S of every
//             `period` (the Rampart's 20% fire), told by a ring closing over its last EG_VENT_TELL_S.
//   Drop      a walled landing at most 4.5 m down, at least 6 m deep.
//   Gust      the Steps' breath (world/sdSteps.js gustAt), span-wide, on the islands about its pieces.
//
// THE TIMED SOLVER (section 10.5): THE SPAN BUILD's running jump (Speed 10, Running 0, Jumping 0 - the motor's closed
// form, held under the real motor's measured reach) from each piece's far edge to the next, over the pieces' positions at the launch and the
// landing: every pair a launch window of at least EG_WINDOW_MIN in every 12 s, the next window never more than EG_WAIT_MAX
// away, a Pendulum's gap a clear EG_PEND_CLEAR_MIN to cross in, a Crumble left before it falls, a Vent's platform wide
// enough to stand clear of its disc, a Drop's landing deep enough to take a running body. A course the solver refuses is
// laid again (net/egLaw.js).
//
// EG-FULL, LAYER THREE (section 11): the fragments' own pieces (a Moon branch under its beams, a rolling Drum, a Bone
// bridge, a Sinking flight), proofs road by road (THE FORK), the real gap after each run, and THE MEDIAN (egRoadCross).
//
// EG-ZC (2026-10-12, Mac: "I said I want everything"; sections 10.5 and 11.2): THE COOLING SLAG - a crossing whose crusts
// stand only after a spill, two spouts pouring in turn (egSlagState, egSlagLane), each landing on a crust held through its
// crossing and each crust left onto still ground; and THE SHAFTS' bound, a shaft crossed inside EG_SHAFT_MAX_S.
//
// EG-H3 (2026-10-12; sections 10.1 and 29, EG4): THE PLATFORM CLOCK, ONE HOME - the Unmoored Steps' stepAt, beatStands,
// beatBlinks and beatWarned moved here whole on the two laws the Spire's pieces move by (egDriftDx, egBeatAt), with the
// Beat's and the Crumble's numbers; world/sdSteps.js re-exports them, so the Hour and the Spire keep one clock. And THE
// COURSE AS DATA: courseOf lays a course record (`{ steps, checkpoints, end }`, the Steps' uniform step) from a spec -
// the Hour's is world/sdSteps.js courseOf(SD_COURSE_SPEC), byte for byte the course it froze at import.
//
// The motor's numbers are pinned here, not imported (this module is in the relay's bundle; test/egfull_span.test.js
// holds them equal to player/motor.js). Pure. Not a DFU member. Ledger A (ELITE-GATES).

/** THE SPAN BUILD's run (Speed 10, Running 0): player/motor.js runSpeed(10, 0). */
export const EG_SPAN_RUN_MPS = ((10 + 150) / 39.5) * 1.35;
/** EG6a - THE FAST BUILD (section 10.2: Speed 100, Running 100, Jumping 100, Fleetfoot III, athleticism improved, the Jump
 *  spell): its run, player/motor.js runSpeed(100, 100) x Fleetfoot III's 1.1 (THE FAIR TRAIL's speed - net/egFair.js says
 *  it), and its jump's multiplier, systems/skills.js jumpSpeedMultiplier (1 + Jumping x 0.5, the spell's 0.6, athleticism's
 *  0.1 and its improvement's 0.1 - a 2.68 m apex) - pinned equal by test/eg6a_span.test.js. It steers in the air. */
export const EG_FAST_RUN_MPS = ((100 + 150) / 39.5) * (1.35 + 100 / 200) * 1.1;
export const EG_FAST_JUMP_X = 1 + (100 * 0.5) / 100 + 0.6 + 0.1 + 0.1;
/** THE CROSSING'S BOUND (section 10.5): the fast build's fastest crossing less this share. */
export const EG_CROSS_SLACK = 0.15;
/** The motor's jump (player/motor.js JUMP_SPEED, GRAVITY, JUMP_FWD_BOOST, CAPSULE_RADIUS), and how much a drop below
 *  the takeoff adds to the widest gap (m a metre down - under the real motor's gain at every height measured). */
export const EG_JUMP_MPS = 4.5;
export const EG_JUMP_G = 20;
export const EG_JUMP_FWD = 0.05;
export const EG_BODY_R = 0.35;
export const EG_DROP_GAIN = 0.45;
/** The Steps' Beat (its cycle, its solid share, the warning blink before it goes) and Crumble (the delay under a foot) -
 *  THEIR ONE HOME since EG-H3: world/sdSteps.js says them as SD_BEAT_CYCLE, SD_BEAT_SOLID, SD_BEAT_BLINK and
 *  SD_CRUMBLE_DELAY. */
export const EG_BEAT_CYCLE_S = 3.6;
export const EG_BEAT_SOLID_S = 2.4;
export const EG_BEAT_BLINK_S = 0.4;
export const EG_CRUMBLE_DELAY_S = 0.7;
/** THE TIMED SOLVER's bounds (section 10.5). */
export const EG_WINDOW_MIN = 0.5;
export const EG_WAIT_MAX = 4;
export const EG_SOLVE_HORIZON_S = 36;
export const EG_SOLVE_STEP_S = 0.05;
export const EG_CRUMBLE_SLACK_S = 0.15;
/** The Pendulum: its swing's reach either side of the course, its weight's half-width, the clear time its gap leaves. */
export const EG_PEND_REACH = 2.6;
export const EG_PEND_HALF = 0.5;
export const EG_PEND_CLEAR_MIN = 0.8;
/** The Vent: its disc's radius, its platform's least width, its eruption and its tell (s); its bite is the Rampart's
 *  (net/egLaw.js EG_VENT_PCT - one number for one fire). */
export const EG_VENT_R = 1.5;
export const EG_VENT_MIN_W = 4;
export const EG_VENT_FIRE_S = 0.5;
export const EG_VENT_TELL_S = 1.0;
/** The Rail: the least gap its travel leaves before it and after it (m) - it never closes on what it travels between. */
export const EG_RAIL_CLEAR = 0.3;
/** The Drop: its landing's least depth and its walls' least height over it (m). */
export const EG_DROP_LAND_MIN = 6;
export const EG_DROP_WALL_H = 7.5;
/** EG-FULL LAYER THREE (sections 11.2-11.3) - THE FRAGMENTS' OWN PIECES:
 *   Moon   a black-glass branch of the Gloam Thicket (and the Moon Path), solid only while a moonbeam lies on it: the
 *          beams walk the course at EG_MOON_MPS, one every `period` (EG_MOON_MPS x `period` apart), each lit EG_MOON_HALF
 *          either side of its centre - the Beat's law, driven by the beams (`beat` where a beam stood at nought).
 *   Drum   a column drum of the Broken Colonnade rolling along the course at a fixed EG_DRUM_MPS, out and back - ridden as
 *          a Rail is (`amp` half its roll).
 *   Bone   a bone bridge of the Ossuary: the Crumble's law in its dress.
 *   Sink   a flight of the Sinking Stair: from a foot it sinks into the mist at EG_SINK_MPS (each member's own, as a
 *          Crumble is), gone EG_SINK_GONE_M down, and back after the Crumble's return. A wait on it is never longer than
 *          EG_SINK_WAIT_MAX, and the jump off it is taken EG_SINK_ON_S of sinking low. */
export const EG_MOON_MPS = 2.5;
export const EG_MOON_HALF = 3.5;
export const EG_MOON_EVERY_S = 4;
export const EG_DRUM_MPS = 2.0;
export const EG_SINK_MPS = 0.5;
export const EG_SINK_GONE_M = 3;
export const EG_SINK_WAIT_MAX = 2;
export const EG_SINK_ON_S = 1;
/** The pieces that fall under a foot (the Crumble's law): their depth crossed before the delay, no wait upon them. */
export const EG_CRUMBLE_KINDS = Object.freeze(['crumble', 'bone']);
/** EG-ZC (2026-10-12, Mac: "I said I want everything"; bible/11-Multiplayer/Elite-Gates.md section 11.2) - THE COOLING SLAG,
 *  the Forge Gut's signature and its ONE HOME (net/egFragLaw.js EG_HAZARDS.slag says these numbers): a spill is a lane of
 *  magma 4 m wide, told EG_SLAG_TELL_S, molten EG_SLAG_MOLTEN_S, then a crust that stands EG_SLAG_CRUST_S, every
 *  EG_SLAG_CYCLE_S - the way across exists only after a spill. A `slag` step is a crossing poured by EG_SLAG_SPOUTS spouts
 *  side by side, `amp` either side of its `x`, each `w` wide, the second half a cycle behind the first: a lone crust would
 *  hold the company 10 s at its lip, past THE TIMED SOLVER's EG_WAIT_MAX (section 10.5's "no queues"), so the spouts pour in
 *  turn and one crust stands while the other is told and molten. A landing on a crust is believed only while it holds
 *  through the crossing (its depth at THE SPAN BUILD's run, and the Crumble's slack), and a crust is left onto still ground
 *  (EG_SLAG_AFTER) - nobody waits on a crust for a timed piece. EG_SLAG_WARN_S before it breaks its lane is told in white. */
export const EG_SLAG_TELL_S = 1.2;
export const EG_SLAG_MOLTEN_S = 6;
export const EG_SLAG_CRUST_S = 10;
export const EG_SLAG_CYCLE_S = 20;
export const EG_SLAG_SPOUTS = 2;
export const EG_SLAG_WARN_S = 1;
/** What a crust is left onto: the ground itself, or a step that keeps no time. */
export const EG_SLAG_AFTER = Object.freeze(['still', 'ledge', 'drop']);
/** THE SHAFTS (section 10.5): a shaft takes at most this long at THE SPAN BUILD (s - its median crossing). */
export const EG_SHAFT_MAX_S = 15;

const TAU = 2 * Math.PI;
const wrapT = (t, p) => ((t % p) + p) % p;

// ── EG-H3 (EG4): THE PLATFORM CLOCK ──────────────────────────────────────────────────────────────────────────────
/** A Drift's swing across the course at `t` (shared seconds): `amp` either side over `period`, from `phase` - the Steps'
 *  and the Spire's one swing. */
export const egDriftDx = (s, t) => s.amp * Math.sin((TAU * t) / s.period + s.phase);
/** Where `t` falls in a Beat's cycle, from its own half beat (`beat`): 0 to EG_BEAT_CYCLE_S. */
export const egBeatAt = (s, t) => wrapT(t - s.beat, EG_BEAT_CYCLE_S);
/** A step's top-centre at `t` (the realm's anchored seconds), the realm's frame: the Drift's swing across x. AUDIT SD: into
 *  `out` when one is given - the page's frame makes nothing. */
export function stepAt(s, t, out = [0, 0, 0]) {
  // AUDIT SD II (L2 F9): two stores - a choice between a made number and a whole one was a number made a step a frame
  if (s.kind === 'drift') out[0] = s.x + egDriftDx(s, t);
  else out[0] = s.x;
  out[1] = s.y;
  out[2] = s.z;
  return out;
}
/** Whether a Beat step stands at `t` (the others always do): solid EG_BEAT_SOLID_S of every EG_BEAT_CYCLE_S, from its own
 *  half beat. */
export function beatStands(s, t) {
  if (s.kind !== 'beat') return true;
  return egBeatAt(s, t) < EG_BEAT_SOLID_S;
}
/** Whether a Beat step is blinking at `t` - the last EG_BEAT_BLINK_S of its stand, its warning. */
export function beatBlinks(s, t) {
  if (s.kind !== 'beat') return false;
  const u = egBeatAt(s, t);
  return u >= EG_BEAT_SOLID_S - EG_BEAT_BLINK_S && u < EG_BEAT_SOLID_S;
}
/** SD-FLASH: how long a Beat step has been warning at `t` (s; meaningful while `beatBlinks`) - its falter's own clock. */
export function beatWarned(s, t) {
  return egBeatAt(s, t) - (EG_BEAT_SOLID_S - EG_BEAT_BLINK_S);
}

// ── EG-H3 (EG4): THE COURSE AS DATA ──────────────────────────────────────────────────────────────────────────────
/**
 * A COURSE LAID FROM ITS SPEC - the record the Hour's Unmoored Steps and every reader of a course take: `steps` (each one
 * shape, `{ i, kind, span, x, y, z, w, d, amp, period, phase, beat }` - x, z its top's centre at rest, y its top, its
 * unused fields nought), `checkpoints` (`{ x, y, z, r }`, the first the spec's `start`) and `end` (where the course
 * meets its goal). Laid along +z from the start's far edge, section by section (a section's index is its steps' `span`):
 * each piece `gap` past the last edge, `size` (`{ w, d }`) its top; a piece's `rise` lifts the course before it stands
 * (a riser); a section that `descend`s steps evenly down to nought over its pieces (the Crumble); a section's `check`
 * is the gap to the checkpoint after it. Each spec number is used as the Steps' own arithmetic used it, so the Hour's
 * spec lays the Hour's course byte for byte. Pure.
 *
 * EG6a (section 10.1): THE SPIRE'S COURSES are laid here too - egSpanOf's specs, one a road. A Spire spec says its `road`,
 * and its steps carry the hall law's fields beside the Steps' (`gap`, `road`, `kit`, and `after` - nought, the hall law's
 * to measure). Its pieces may carry their own `x` across the course (the Low Road's, a passage's ledges), their number in
 * the hall's laying (`i`, the roads' steps laid in one count) and their passage's `kit`; a `ground` entry is still ground
 * the course runs over between its pieces (a passage's floor, a court, a bridge - no step), rising by its `rise`; a
 * section may say its `span` (the hall's islands counted across its roads).
 * @param {{ start: { x: number, y?: number, z: number, r: number }, x?: number, checkR: number, toEnd: number, road?: number,
 *   sections: ReadonlyArray<{ pieces: ReadonlyArray<{ kind?: string, gap?: number, size?: { w: number, d: number }, rise?: number,
 *   amp?: number, period?: number, phase?: number, beat?: number, x?: number, i?: number, kit?: string, ground?: number }>,
 *   check?: number | null, descend?: boolean, span?: number }> }} spec
 */
export function courseOf(spec) {
  const steps = [], checkpoints = [{ x: spec.start.x, y: spec.start.y ?? 0, z: spec.start.z, r: spec.start.r }];
  const x0 = spec.x ?? 0, spire = spec.road != null;
  let edge = spec.start.z + spec.start.r, y = spec.start.y ?? 0;
  const put = (kind, span, size, gap, { amp = 0, period = 0, phase = 0, beat = 0, x = null, i = null, kit = '' } = {}) => {
    const z = edge + gap + size.d / 2;
    const s = { i: i ?? steps.length, kind, span, x: x == null ? x0 : x0 + x, y, z, w: size.w, d: size.d, amp, period, phase, beat };
    steps.push(spire ? Object.assign(s, { gap, road: spec.road, kit, after: 0 }) : s);
    edge = z + size.d / 2;
  };
  spec.sections.forEach((sec, k) => {
    const span = sec.span ?? k;
    const drop = sec.descend ? y / sec.pieces.length : 0;
    for (const p of sec.pieces) {
      if (p.rise) y += p.rise;
      if (p.ground != null) { edge += p.ground; continue; }   // EG6a: still ground run over - no step
      if (sec.descend) y = Math.max(0, y - drop);
      put(p.kind, span, p.size, p.gap, p);
    }
    if (sec.check != null) { const z = edge + sec.check + spec.checkR; checkpoints.push({ x: x0, y, z, r: spec.checkR }); edge = z + spec.checkR; }
  });
  return { steps, checkpoints, end: edge + spec.toEnd };
}

// ── EG6a: THE SPAN GENERATOR ─────────────────────────────────────────────────────────────────────────────────────
/** THE ENVELOPE (section 10.4) in the law's integers - every number a bound, never a target: a gap's least and most (cm),
 *  a riser's rise (cm - the Steps' SD_RISER_H), a Beat's half cycle (ms - SD_BEAT_HALF, alternate steps that far apart),
 *  a step down within a run (under it, cm) and a Drop (at most, cm). net/egLaw.js says them as it always did. */
export const EG_GAP_MIN_CM = 240;
export const EG_GAP_MAX_CM = 320;
export const EG_RISER_CM = 230;
export const EG_BEAT_HALF_MS = 1800;
export const EG_STEP_DOWN_CM = 95;
export const EG_DROP_CM = 450;
/** A die's whole number from lo to hi, both in (the hall law's draw - one law for both). */
export const egDieBetween = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));

/**
 * THE SPAN GENERATOR (section 10.1): hall `hall`'s courses in breach `seed`'s band `band`, ONE A ROAD - the one course, or
 * THE FORK's High Road and Low Road (section 11.4) - each a course spec its pieces are drawn into and courseOf lays. It
 * draws off the hall's own die (`r` - net/egLaw.js makes it from the seed and the hall, a sub-seed a try: section 10.5's
 * redraw), in the law's integers (centimetres, milliseconds), as the hall law lays the hall about it: the hall stands its
 * islands, passages and floors where the generator's `edge` says, and tells it where the hall stands before each piece it
 * asks for (`at` - still ground run over, a climb or a fall, recorded in the road's spec). `lay()` lays every road's spec
 * through courseOf and answers the hall's steps in their one count; `courses()` answers each road's course record.
 *
 * The pieces (section 10.3 - the hall law picks them from its band's, or the last resort's first two; `sizes` their tops),
 * each at the Steps' own timing at every depth (NOTHING GETS FASTER): a Drift swinging 1-2 m over 4-7 s, alternate Beats a half cycle
 * apart with one Riser a hall in a run of five or more, Crumbles stepping down toward the plates, a Gust span-wide on the
 * Steps' breath, a Rail travelling 1.5-2 m over 6-9 s, a Pendulum over 3-5 s, a Vent erupting every 4-6 s, a Drop of at
 * most EG_DROP_CM onto its walled landing (still ground where the course stands under 2 m). Every gap EG_GAP_MIN_CM to
 * EG_GAP_MAX_CM. Pure.
 * @param {number} seed @param {number} hall @param {number} band
 * @param {{ r: () => number, sizes: Readonly<Record<string, { w: number, d: number }>>,
 *   start: { x: number, y: number, z: number, r: number }, checkR: number }} o
 */
export function egSpanOf(seed, hall, band, { r, sizes, start, checkR }) {
  /** each road's layer: its course spec, where it stands (`edge`, `y`) and the height its spec has said (`said`) */
  const roads = new Map();
  let L = /** @type {any} */ (null), span = 0, risen = false, n = 0;
  const road = (k, from = start) => {
    if (!roads.has(k)) roads.set(k, { spec: { road: k, start: { ...from }, checkR, toEnd: 0, sections: [{ span, pieces: [] }] }, edge: from.z + from.r, y: from.y, said: from.y });
    L = roads.get(k);
  };
  road(0);
  const sec = () => L.spec.sections[L.spec.sections.length - 1];
  /** an entry said into the road's spec, rising from the height last said */
  const said = (e) => { e.rise = L.y - L.said; L.said = L.y; sec().pieces.push(e); };
  const gap = () => egDieBetween(r, EG_GAP_MIN_CM, EG_GAP_MAX_CM);
  /** a piece `gap` past the edge: its place (cm, the hall's frame) */
  const step = (kind, g, o = {}) => {
    const S = sizes[kind], z = L.edge + g + S.d / 2;
    said({ kind, gap: g, size: S, x: o.x ?? 0, amp: o.amp ?? 0, period: o.period ?? 0, phase: o.phase ?? 0, beat: o.beat ?? 0, i: n++, kit: o.kit ?? '' });
    L.edge = z + S.d / 2;
    return { x: o.x ?? 0, y: L.y, z };
  };
  return {
    seed, hall, band,
    /** where the road stands now - the edge it lays from, its height */
    get edge() { return L.edge; },
    get y() { return L.y; },
    /** THE ROAD laid from here: `k` (its first time from `from`, where it begins - an island) */
    road,
    /** where the hall stands before the next piece (its edge, its height): still ground run over since the last */
    at(edge, y) {
      if (edge !== L.edge) { L.y = y; said({ ground: edge - L.edge }); L.edge = edge; }
      L.y = y;
    },
    gap,
    step,
    /** an island `g` past the edge - the road's checkpoint, the next span begun: its middle's z */
    check(g) {
      if (L.y !== L.said) said({ ground: 0 });
      const z = L.edge + g + checkR;
      sec().check = g;
      L.edge = z + checkR;
      span++;
      L.spec.sections.push({ span, pieces: [] });
      return z;
    },
    /** A RUN of `n` pieces of `kind` along `x` (section 10.3), each drawn off the die at the Steps' own timing. */
    run(kind, count, x = 0, kit = '') {
      if (kind === 'drift') for (let q = 0; q < count; q++) step('drift', gap(), { x, kit, amp: egDieBetween(r, 100, 200), period: egDieBetween(r, 40, 70) * 100, phase: q * 900 });
      else if (kind === 'beat' || kind === 'riser') {
        const riserAt = count >= 5 && !risen ? egDieBetween(r, 2, count - 2) : -1;   // one riser a hall: the climb down after it stays short
        let b = 0;
        for (let q = 0; q < count; q++) {
          if (q === riserAt) { L.y += EG_RISER_CM; risen = true; step('riser', 0, { x, kit }); continue; }
          step('beat', gap(), { x, kit, beat: (b++ % 2) * EG_BEAT_HALF_MS });
        }
      } else if (kind === 'crumble') {
        // down toward the plates' height while above it (never up: a course below it - a Mist Stair's, a Sinking Stair's - stays)
        const drop = L.y > 0 ? Math.ceil(L.y / Math.max(1, count)) : 0;
        for (let q = 0; q < count; q++) { if (L.y > 0) L.y = Math.max(0, L.y - drop); step('crumble', gap(), { x, kit }); }
      } else if (kind === 'gust') for (let q = 0; q < count; q++) step('gust', gap(), { x, kit, period: 6000, phase: q * 0 });
      else if (kind === 'rail') for (let q = 0; q < count; q++) step('rail', gap(), { x, kit, amp: egDieBetween(r, 150, 200), period: egDieBetween(r, 60, 90) * 100, phase: q * 1500 });   // LAYER THREE: its travel under the least gap less EG_RAIL_CLEAR
      else if (kind === 'pend') for (let q = 0; q < count; q++) step('pend', gap(), { x, kit, amp: 0, period: egDieBetween(r, 30, 50) * 100, phase: q * 700 });
      else if (kind === 'vent') for (let q = 0; q < count; q++) step('vent', gap(), { x, kit, period: egDieBetween(r, 40, 60) * 100, phase: egDieBetween(r, 0, 39) * 100 });
      else if (kind === 'drop' && L.y < 200) for (let q = 0; q < count; q++) step('still', gap(), { x, kit });
      else if (kind === 'drop') { const fall = Math.min(EG_DROP_CM, Math.max(200, L.y)); L.y = Math.max(0, L.y - fall); step('drop', gap(), { x, kit }); }
      else for (let q = 0; q < count; q++) step('still', gap(), { x, kit });
    },
    /** Every road's course spec (its sections as said). */
    specs: () => [...roads.values()].map((q) => q.spec),
    /** EVERY ROAD'S COURSE, laid by courseOf - `{ road, steps, checkpoints, end }` (cm, the hall's frame), road 0 first. */
    courses: () => [...roads.values()].map((q) => ({ road: q.spec.road, ...courseOf(q.spec) })),
    /** THE HALL'S STEPS: every road's course laid, in the one count the hall laid them in. */
    lay() { return this.courses().flatMap((c) => c.steps).sort((a, b) => a.i - b.i); },
  };
}
/**
 * EG6a - A HALL'S COURSE ON A ROAD as the Steps' readers take it (section 10.1 - courseOf's record, `{ road, steps,
 * checkpoints, end }`): the course egSpanOf laid, read back off the hall spec in metres, the hall's own frame (a reader adds
 * the hall's slot, `x0`). Its steps are the spec's own steps of that road in order (courseOf's records, said in metres);
 * its checkpoints where the road begins (the arrival plate, or the Low Road's island) and then its islands; its end where it
 * meets its goal (the end plate's edge - a Court's ground's end - or the Low Road's last step's). Null for a road the hall
 * does not lay. Pure.
 * @param {any} spec @param {number} [road]
 */
export function egCourseOf(spec, road = 0) {
  const steps = (spec?.steps ?? []).filter((s) => (s.road ?? 0) === road), isles = (spec?.islands ?? []).filter((q) => (q.road ?? 0) === road);
  const start = road === 0 ? spec?.arrive : isles.shift();
  if (!start || (road !== 0 && !steps.length)) return null;
  const at = (q) => ({ x: q.x, y: q.y ?? 0, z: q.z, r: q.r }), last = steps[steps.length - 1];
  const end = road !== 0 ? last.z + last.d / 2 : spec.end ? spec.end.z - spec.end.r : spec.len;
  return { road, steps, checkpoints: [at(start), ...isles.map(at)], end };
}
/** Out and back at one speed: -amp to amp and home over `period` (s) - a drum's roll, a moonbeam's walk. */
export function egTriAt(amp, period, phase, t) {
  if (!(period > 0)) return 0;
  const u = wrapT(t + phase, period) / period;
  return u < 0.5 ? -amp + 4 * amp * u : 3 * amp - 4 * amp * u;
}
/**
 * EG-ZC - A SLAG CROSSING'S SPOUT `k` at `t` (shared seconds): `{ st, k }` - told (`tell`, the spill coming), `molten` (a
 * lane of magma), `crust` (a platform) or `gone` (the crust broken, the chasm open), and how far through that state (0 to
 * 1). Spout k pours `k` halves of a cycle behind the first.
 * @param {any} s @param {number} k @param {number} t
 * @returns {{ st: 'tell'|'molten'|'crust'|'gone', k: number }}
 */
export function egSlagState(s, k, t) {
  const P = s.period > 0 ? s.period : EG_SLAG_CYCLE_S, u = wrapT(t + (s.phase ?? 0) + (k * P) / EG_SLAG_SPOUTS, P);
  if (u < EG_SLAG_TELL_S) return { st: 'tell', k: u / EG_SLAG_TELL_S };
  if (u < EG_SLAG_TELL_S + EG_SLAG_MOLTEN_S) return { st: 'molten', k: (u - EG_SLAG_TELL_S) / EG_SLAG_MOLTEN_S };
  if (u < EG_SLAG_TELL_S + EG_SLAG_MOLTEN_S + EG_SLAG_CRUST_S) return { st: 'crust', k: (u - EG_SLAG_TELL_S - EG_SLAG_MOLTEN_S) / EG_SLAG_CRUST_S };
  return { st: 'gone', k: (u - EG_SLAG_TELL_S - EG_SLAG_MOLTEN_S - EG_SLAG_CRUST_S) / Math.max(1e-9, P - EG_SLAG_TELL_S - EG_SLAG_MOLTEN_S - EG_SLAG_CRUST_S) };
}
/** The spout whose crust stands at `t` (the first first), or -1 - none. */
export function egSlagLane(s, t) {
  for (let k = 0; k < EG_SLAG_SPOUTS; k++) if (egSlagState(s, k, t).st === 'crust') return k;
  return -1;
}
/** Spout `k`'s lane across the course (its centre's x, the hall's frame): `amp` either side of the step's `x`. */
export const egSlagX = (s, k) => s.x + (k === 0 ? -s.amp : s.amp);

/** The centre of the moonbeam nearest a Moon step at `t` (the beams walk +z at EG_MOON_MPS, `period` apart). */
export function egMoonBeamZ(s, t) {
  const every = EG_MOON_MPS * (s.period > 0 ? s.period : EG_MOON_EVERY_S), c0 = s.beat + EG_MOON_MPS * (t + s.phase);
  return c0 + Math.round((s.z - c0) / every) * every;
}

/**
 * Where a piece stands at `t` (shared seconds): `{ dx, dz, solid }` - its offset from its spec place (a Drift across, a
 * Rail along) and whether it is there (a Beat off its beat is not). A Crumble's fall is its toucher's own (not here).
 */
export function egPieceAt(s, t, out = { dx: 0, dz: 0, solid: true }) {
  out.dx = 0; out.dz = 0; out.solid = true;
  if (s.kind === 'drift' && s.period > 0) out.dx = egDriftDx(s, t);
  else if (s.kind === 'rail' && s.period > 0) out.dz = s.amp * Math.sin((TAU * t) / s.period + s.phase);
  else if (s.kind === 'beat') out.solid = egBeatAt(s, t) < EG_BEAT_SOLID_S;
  else if (s.kind === 'drum') out.dz = egTriAt(s.amp, s.period, s.phase, t);
  else if (s.kind === 'moon') out.solid = Math.abs(s.z - egMoonBeamZ(s, t)) <= EG_MOON_HALF;
  else if (s.kind === 'slag') { const k = egSlagLane(s, t); out.solid = k >= 0; out.dx = k >= 0 ? egSlagX(s, k) - s.x : 0; }   // EG-ZC: the standing crust's lane
  return out;
}
/** A Pendulum's weight at `t`: across the course (x, the hall's frame) over the middle of the gap before its step (z). */
export function egPendAt(s, t) {
  const swing = s.period > 0 ? Math.sin((TAU * t) / s.period + s.phase) : 0;
  return { x: s.x + EG_PEND_REACH * swing, z: s.z - s.d / 2 - (s.gap ?? 0) / 2 };
}
/** Is a body at (x, z), its feet at `y`, inside a Pendulum's weight at `t`? */
export function egPendHits(s, t, x, y, z) {
  const w = egPendAt(s, t);
  return Math.abs(x - w.x) < EG_PEND_HALF + EG_BODY_R && Math.abs(z - w.z) < EG_PEND_HALF + EG_BODY_R && y > s.y - 0.6 && y < s.y + 2.2;
}
/** A Vent's cycle at `t`: `{ tell, fire }` - its ring's progress over its last EG_VENT_TELL_S (0 to 1, 0 when not told) and
 *  whether it erupts. */
export function egVentState(s, t) {
  if (!(s.period > 0)) return { tell: 0, fire: false };
  const u = wrapT(t + s.phase, s.period), fireAt = s.period - EG_VENT_FIRE_S;
  if (u >= fireAt) return { tell: 1, fire: true };
  if (u >= fireAt - EG_VENT_TELL_S) return { tell: (u - (fireAt - EG_VENT_TELL_S)) / EG_VENT_TELL_S, fire: false };
  return { tell: 0, fire: false };
}
/** Is a body at (x, z) inside a Vent's disc (its platform's centre)? */
export const egInVentDisc = (s, x, z) => Math.hypot(x - s.x, z - s.z) <= EG_VENT_R;

/** THE SPAN BUILD's running jump: the widest gap (m, edge to edge) it crosses landing `h` higher (negative lower), 0 when
 *  it cannot rise so far, and how long it is in the air (s) - the closed form's flight plus the capsule over both edges,
 *  a drop's gain held to EG_DROP_GAIN a metre. Under the real motor at every height measured (test/egfull_span.test.js
 *  crosses each with player/motor.js PlayerMotor - 3.26 m flat where the motor clears 3.44): never generous. */
export function egJumpReach(h) {
  const disc = EG_JUMP_MPS * EG_JUMP_MPS - 2 * EG_JUMP_G * h;
  if (disc < 0) return { reach: 0, air: 0 };
  const run = EG_SPAN_RUN_MPS + EG_JUMP_MPS * EG_JUMP_FWD, air = (EG_JUMP_MPS + Math.sqrt(disc)) / EG_JUMP_G;
  const flat = run * ((2 * EG_JUMP_MPS) / EG_JUMP_G) + 2 * EG_BODY_R, reach = run * air + 2 * EG_BODY_R;
  return { reach: h < 0 ? Math.min(reach, flat - EG_DROP_GAIN * h) : reach, air };
}

/** EG6a - THE FAST BUILD's running jump (section 10.2): the widest gap it crosses landing `h` higher and its time in the
 *  air - the closed form at its run with the Jump spell's lift, the capsule over both edges. It steers in the air, so it
 *  lands anywhere within it; never held under a drop's gain (a bound taken at this build must never refuse an honest
 *  crossing). */
export function egFastReach(h) {
  const v = EG_JUMP_MPS * EG_FAST_JUMP_X, disc = v * v - 2 * EG_JUMP_G * h;
  if (disc < 0) return { reach: 0, air: 0 };
  const air = (v + Math.sqrt(disc)) / EG_JUMP_G;
  return { reach: (EG_FAST_RUN_MPS + EG_JUMP_MPS * EG_JUMP_FWD) * air + 2 * EG_BODY_R, air };
}
/** The builds the solver crosses at: THE SPAN BUILD (every window, every proof) and THE FAST BUILD (the crossing's bound). */
const SPAN_BUILD = Object.freeze({ run: EG_SPAN_RUN_MPS, reach: egJumpReach });
const FAST_BUILD = Object.freeze({ run: EG_FAST_RUN_MPS, reach: egFastReach });

/**
 * A course's chain: each step with what stands before it (the step it follows, or the still ground of a plate, an island
 * or a passage) - `{ a, b }` pairs in course order, `a` or `b` null for still ground, the last step's ground after it.
 */
export function egSpanPairs(spec) {
  const steps = spec.steps ?? [], out = [];
  // one road's steps follow one another (THE FORK: each road its own course - section 11.4)
  const meets = (a, b) => !!a && !!b && (a.road ?? 0) === (b.road ?? 0) && Math.abs(a.z + a.d / 2 - (b.z - b.d / 2 - (b.gap ?? 0))) < 1e-6;
  for (let k = 0; k < steps.length; k++) {
    const s = steps[k], prev = steps[k - 1], next = steps[k + 1];
    if (s.road === 2) continue;   // an alcove's side way is optional - never proven, never asked of anyone
    if (s.kind !== 'riser') out.push({ a: meets(prev, s) ? prev : null, b: s, edge: s.z - s.d / 2 - (s.gap ?? 0) });   // a riser is climbed, never jumped onto
    if (!meets(s, next)) out.push({ a: s, b: null, edge: s.z + s.d / 2 + (s.after ?? 0) });   // the still ground's own edge, the real gap on
  }
  return out;
}

const PA = { dx: 0, dz: 0, solid: true }, PB = { dx: 0, dz: 0, solid: true };
/** Does THE SPAN BUILD's jump from `a` (null: still ground) to `b` (null: still ground) launched at `t` land? EG6a: or
 *  another build's (`B` - its run and its reach); a leap past pieces between says its own landing edge (`to`) and the
 *  heights it leaves and lands at (`ay`, `by`). */
function jumpLands(pair, t, B = SPAN_BUILD) {
  const { a, b } = pair;
  if (a) { egPieceAt(a, t, PA); if (!PA.solid) return false; }
  const ay = (pair.ay ?? (a ? a.y : (b ? b.y : 0))) - (a?.kind === 'sink' ? EG_SINK_MPS * EG_SINK_ON_S : 0), by = pair.by ?? (b ? b.y : (a ? a.y : 0));
  const { reach, air } = B.reach(by - ay);
  if (!(reach > 0)) return false;
  if (b) { egPieceAt(b, t + air, PB); if (!PB.solid) return false; }
  // EG-ZC: a crust landed on holds through its crossing - the lane it lands on still a crust at the far edge
  if (b?.kind === 'slag' && egSlagState(b, egSlagLane(b, t + air), t + air + b.d / B.run + EG_CRUMBLE_SLACK_S).st !== 'crust') return false;
  // the launch: the far edge of what I stand on (a step's own, or the ground's edge), anywhere across its width
  const lz = a ? a.z + PA.dz + a.d / 2 : pair.edge;
  const lx0 = a ? a.x + PA.dx - a.w / 2 : -Infinity, lx1 = a ? a.x + PA.dx + a.w / 2 : Infinity;
  // the landing: what I land on, edge to edge (the reach counts the capsule over both edges), anywhere across its width
  const nz0 = b ? b.z + PB.dz - b.d / 2 : pair.to ?? pair.edge, nz1 = b ? b.z + PB.dz + b.d / 2 : Infinity;
  const nx0 = b ? b.x + PB.dx - b.w / 2 : -Infinity, nx1 = b ? b.x + PB.dx + b.w / 2 : Infinity;
  if (nz1 < lz + 0.5) return false;   // it has travelled behind me (or offers no half a metre to land on)
  const dz = Math.max(0, nz0 - lz);
  const dx = Math.max(0, Math.max(nx0, lx0) - Math.min(nx1, lx1));   // the least sideways reach between the two widths
  if (Math.hypot(dx, dz) > reach) return false;
  // a Pendulum over this gap: the body crosses its middle half-way through the flight - clear of the weight then
  if (b?.kind === 'pend') {
    const xs = Math.max(nx0, Math.min(lx1, b.x)), mid = t + air / 2;
    if (egPendHits(b, mid, xs, b.y, egPendAt(b, mid).z)) return false;
  }
  return true;
}

/** EG6a: does THE SPAN BUILD's jump on `pair` launched at shared second `t` land - the solver's own answer, one launch
 *  (tools/egSpanSolve.mjs reads its windows, and the sweep's pilot launches inside them). */
export const egJumpLands = (pair, t) => jumpLands(pair, t);

/**
 * THE TIMED SOLVER on one pair: its windows over EG_SOLVE_HORIZON_S - `{ open, worst12, wait, clearRun }`: the share of
 * time a launch lands, the least open time in any 12 s, the longest closed stretch, the longest open stretch.
 */
export function egPairWindows(pair) {
  const n = Math.round(EG_SOLVE_HORIZON_S / EG_SOLVE_STEP_S), ok = new Uint8Array(n);
  let open = 0;
  for (let k = 0; k < n; k++) if (jumpLands(pair, k * EG_SOLVE_STEP_S)) { ok[k] = 1; open++; }
  const w12 = Math.round(12 / EG_SOLVE_STEP_S);
  let sum = 0, worst = Infinity;
  for (let k = 0; k < n; k++) { sum += ok[k]; if (k >= w12) sum -= ok[k - w12]; if (k >= w12 - 1) worst = Math.min(worst, sum); }
  let wait = 0, clear = 0, run0 = 0, run1 = 0;
  for (let k = 0; k < 2 * n; k++) { if (ok[k % n]) { run1++; run0 = 0; clear = Math.max(clear, Math.min(run1, n)); } else { run0++; run1 = 0; wait = Math.max(wait, Math.min(run0, n)); } }
  return { open: open * EG_SOLVE_STEP_S, worst12: worst * EG_SOLVE_STEP_S, wait: wait * EG_SOLVE_STEP_S, clearRun: clear * EG_SOLVE_STEP_S };
}

/** THE MEDIAN (section 10.5): a road's median crossing, swept over start phases, is at most this many times its fastest. */
export const EG_MEDIAN_X = 1.6;
const CROSS_SAMPLES = 72;
/**
 * A ROAD'S CROSSING (section 10.5): THE SPAN BUILD running the road from its first launch to its last landing, from start
 * phases every EG_SOLVE_HORIZON_S / 72 - each pair waited for in turn (the next window that lands), the still ground run
 * between - `{ fast, median, n }` (s; `n` its pairs). A road with no pairs crosses in nought. `from` its stretch from that
 * far along the hall (THE FORK's roads, from the fork).
 * @param {any} spec @param {number} [road] @param {number} [from]
 */
export function egRoadCross(spec, road = 0, from = -Infinity) {
  const launch = (p) => (p.a ? p.a.z + p.a.d / 2 : p.edge);
  const pairs = egSpanPairs(spec).filter((p) => ((p.b ?? p.a)?.road ?? 0) === road && launch(p) >= from);
  if (!pairs.length) return { fast: 0, median: 0, n: 0 };
  const z0 = launch(pairs[0]), times = [];
  for (let k = 0; k < CROSS_SAMPLES; k++) {
    const t0 = (k * EG_SOLVE_HORIZON_S) / CROSS_SAMPLES;
    let waited = 0;
    for (const p of pairs) {
      const at = t0 + (launch(p) - z0) / EG_SPAN_RUN_MPS + waited;
      let w = 0;
      while (w < EG_SOLVE_HORIZON_S && !jumpLands(p, at + w)) w += EG_SOLVE_STEP_S;
      waited += w;
    }
    const last = pairs[pairs.length - 1];
    times.push((launch(last) - z0) / EG_SPAN_RUN_MPS + waited);
  }
  times.sort((a, b) => a - b);
  return { fast: times[0], median: times[CROSS_SAMPLES >> 1], n: pairs.length };
}

/** EG6a: the farthest a leap past pieces is looked for at THE FAST BUILD (m, launch to landing - past its widest reach
 *  over the deepest fall a course lays). */
export const EG_FAST_LEAP_M = 30;
const _fastCross = new WeakMap();
/** A road's chain at THE FAST BUILD: its pairs (the Low Road's the trunk's to the fork, then its own), where each launches
 *  and where the last lands (`zn`), its length plate to plate and the bridges across and back (s). */
function fastPath(spec, road) {
  const launch = (p) => (p.a ? p.a.z + p.a.d / 2 : p.edge), roadOf = (p) => (p.b ?? p.a)?.road ?? 0;
  const fork = road === 1 && !!spec.fork;
  const path = egSpanPairs(spec).filter((p) => (fork ? roadOf(p) === 1 || (roadOf(p) === 0 && launch(p) < spec.fork.z - 0.01) : roadOf(p) === road));
  const last = path[path.length - 1], zn = [...path.map(launch), last ? (last.b ? last.b.z + last.b.d / 2 : last.edge) : 0];
  const len = Math.max(0, (spec.end?.z ?? spec.len ?? 0) - (spec.arrive?.z ?? 0));
  return { path, zn, roadOf, len, across: fork ? (2 * Math.abs(spec.fork.lowX - spec.fork.x)) / FAST_BUILD.run : 0 };
}
/**
 * EG6a - A ROAD CROSSED AT THE FAST BUILD FROM SHARED SECOND `t0` (section 10.5), seconds: from the arrival plate to the end
 * plate on `road` - the Low Road the trunk to its fork, the bridges across and back, then its own - its course crossed as
 * THE FAST BUILD crosses it: every launch the first that lands (the timed pieces' windows at its own run and reach), and any
 * piece of its road within its jump leapt past (a jump from what it stands on onto any later piece, or the ground after
 * one, EG_FAST_LEAP_M at most). The earliest arrival over the road's chain - every wait allowed, since a later launch never
 * lands sooner - the still ground run at its run. Infinity when no landing comes within the solver's horizon.
 * @param {any} spec @param {number} [road] @param {number} [t0]
 */
export function egFastCrossAt(spec, road = 0, t0 = 0, P = fastPath(spec, road)) {
  const { path, zn, roadOf, len, across } = P, m = path.length, run = FAST_BUILD.run;
  if (!m) return len / run + across;
  const yOf = (p) => (p.a ? p.a.y : (p.b ? p.b.y : 0)), yTo = (p) => (p.b ? p.b.y : (p.a ? p.a.y : 0));
  const E = new Float64Array(m + 1).fill(Infinity);
  E[0] = t0;
  for (let k = 0; k < m; k++) {
    if (E[k] === Infinity) continue;
    for (let j = k; j < m; j++) {
      const pk = path[k], pj = path[j];
      if (j > k && (roadOf(pj) !== roadOf(pk) || (pj.b ? pj.b.z - pj.b.d / 2 : pj.edge) - zn[k] > EG_FAST_LEAP_M)) break;
      const leap = j === k ? pk : { a: pk.a, b: pj.b, edge: pk.edge, to: pj.edge, ay: yOf(pk), by: yTo(pj) };
      let w = 0;
      while (w < EG_SOLVE_HORIZON_S && !jumpLands(leap, E[k] + w, FAST_BUILD)) w += EG_SOLVE_STEP_S;
      if (w >= EG_SOLVE_HORIZON_S) continue;
      const at = E[k] + w + (zn[j + 1] - zn[k]) / run;
      if (at < E[j + 1]) E[j + 1] = at;
    }
  }
  return E[m] === Infinity ? Infinity : E[m] - t0 + Math.max(0, len - (zn[m] - zn[0])) / run + across;
}
/**
 * EG6a - A ROAD'S FASTEST CROSSING AT THE FAST BUILD (section 10.5), seconds: egFastCrossAt's least over start phases every
 * EG_SOLVE_HORIZON_S / 72 - and none can be less than the road's length at its run, so the sweep ends on reaching it. A
 * road the fast build finds no landing on is its length alone. Kept per spec.
 * @param {any} spec @param {number} [road]
 */
export function egFastCross(spec, road = 0) {
  let kept = _fastCross.get(spec);
  if (!kept) { kept = new Map(); _fastCross.set(spec, kept); }
  if (kept.has(road)) return kept.get(road);
  const P = fastPath(spec, road), floor = P.len / FAST_BUILD.run + P.across;
  let best = Infinity;
  for (let q = 0; q < CROSS_SAMPLES && best > floor + 1e-9; q++) best = Math.min(best, egFastCrossAt(spec, road, (q * EG_SOLVE_HORIZON_S) / CROSS_SAMPLES, P));
  if (best === Infinity) best = floor;
  kept.set(road, best);
  return best;
}
/** THE CROSSING'S LOWER BOUND (section 10.5's EG_CROSS_MIN(spec, road)): THE FAST BUILD's fastest crossing of the road less
 *  EG_CROSS_SLACK (ms) - a measure in the receipt's `m`, never a door's gate, until EG21. */
export const egCrossMin = (spec, road = 0) => Math.round(egFastCross(spec, road) * (1 - EG_CROSS_SLACK) * 1000);

/**
 * THE TIMED SOLVER on a hall's course: `{ ok, why }` - every pair's windows, every Crumble left in time, every Vent's
 * platform wide enough, every Drop's landing deep enough. `why` names each failure (the step's number and what failed).
 */
export function egSpanProof(spec) {
  const why = [];
  for (const s of spec.steps ?? []) {
    if (s.kind === 'vent' && Math.min(s.w, s.d) < EG_VENT_MIN_W) why.push(`${s.i}: a Vent's platform under ${EG_VENT_MIN_W} m`);
    if (s.kind === 'drop' && s.d < EG_DROP_LAND_MIN) why.push(`${s.i}: a Drop's landing under ${EG_DROP_LAND_MIN} m`);
    if (EG_CRUMBLE_KINDS.includes(s.kind) && s.d / EG_SPAN_RUN_MPS + EG_CRUMBLE_SLACK_S > EG_CRUMBLE_DELAY_S) why.push(`${s.i}: a Crumble too deep to cross before it falls`);
    if (s.kind === 'rail' || s.kind === 'drum') {
      const next = (spec.steps ?? [])[s.i + 1];
      const after = next && (next.road ?? 0) === (s.road ?? 0) && Math.abs(next.z - next.d / 2 - (next.gap ?? 0) - (s.z + s.d / 2)) < 1e-6 ? next.gap ?? 0 : Infinity;
      if (s.amp > Math.min(s.gap ?? 0, after) - EG_RAIL_CLEAR) why.push(`${s.i}: a Rail's travel closes on what stands beside it`);
    }
    // EG-ZC: a slag crust is left onto still ground - the ground itself, or a step of its road that keeps no time
    if (s.kind === 'slag') {
      const next = (spec.steps ?? [])[s.i + 1];
      const meets = !!next && (next.road ?? 0) === (s.road ?? 0) && Math.abs(next.z - next.d / 2 - (next.gap ?? 0) - (s.z + s.d / 2)) < 1e-6;
      if (meets && !EG_SLAG_AFTER.includes(next.kind)) why.push(`${s.i}: a slag crust left onto a ${next.kind}`);
    }
  }
  for (const pair of egSpanPairs(spec)) {
    const w = egPairWindows(pair), at = pair.b ? pair.b.i : `${pair.a?.i}>ground`;
    if (w.worst12 < EG_WINDOW_MIN) why.push(`${at}: a window of ${w.worst12.toFixed(2)} s in some 12 s`);
    else if (w.wait > EG_WAIT_MAX) why.push(`${at}: a wait of ${w.wait.toFixed(2)} s`);
    if (pair.b?.kind === 'pend' && w.clearRun < EG_PEND_CLEAR_MIN) why.push(`${at}: a Pendulum's gap clear only ${w.clearRun.toFixed(2)} s`);
    if (EG_CRUMBLE_KINDS.includes(pair.a?.kind) && w.wait > EG_CRUMBLE_DELAY_S - EG_CRUMBLE_SLACK_S) why.push(`${at}: a wait on a Crumble`);
    if (pair.a?.kind === 'sink' && w.wait > EG_SINK_WAIT_MAX) why.push(`${at}: a wait of ${w.wait.toFixed(2)} s on a sinking flight`);
  }
  // THE MEDIAN, road by road: no road whose ordinary crossing runs far past its best
  if (!why.length) for (const road of [0, 1]) {
    const c = egRoadCross(spec, road);
    if (c.n && c.fast > 0 && c.median > EG_MEDIAN_X * c.fast) why.push(`road ${road}: a median crossing of ${c.median.toFixed(1)} s past ${EG_MEDIAN_X} x its fastest ${c.fast.toFixed(1)} s`);
  }
  // EG-ZC - THE SHAFTS (section 10.5): each shaft's own steps crossed, at their median, inside EG_SHAFT_MAX_S
  if (!why.length) for (const f of spec.frags ?? []) {
    if (f.cls !== 'shaft') continue;
    const c = egRoadCross({ steps: (spec.steps ?? []).filter((s) => (s.road ?? 0) === (f.road ?? 0) && s.z > f.z0 && s.z < f.z1) }, f.road ?? 0);
    if (c.n && c.median > EG_SHAFT_MAX_S) why.push(`a shaft crossed in ${c.median.toFixed(1)} s, past ${EG_SHAFT_MAX_S} s`);
  }
  return { ok: why.length === 0, why };
}

// ── AUDIT EG III (2026-10-13, lane 1 #7 / lane 3 #10; Elite-Gates.md section 15): SPIREBRIDGE'S PLANK ────────────────
// The Fellowship's Mastery: "once a span, a gold bridge over the next gap for the company, for 6 s". The room picks the gap
// (net/egVestige.js egSpirebridge) and says it (`ebridge`, its gap's number in egSpanPairs' chain); every screen stands the
// plank this law lays over it (scenes/egSpan.js), and the relay's fair trail counts it as ground while it stands
// (net/egFair.js egSupportAt). The solver never sees it: a bridge is a help, never needed - every course is proven without
// one, and running a plank is no faster than jumping its gap.
/** How long a Spirebridge stands (ms), how far ahead of a member its gap may begin (m - "the next gap"), how far behind it may
 *  have begun (m - a member at its edge, or just off it), how far across the road's line a member may stand from it (m), how
 *  far the plank laps onto each side (m), its width's bounds (m), and the most a plank rises or falls across its gap (cm - THE
 *  ENVELOPE's step down: a Drop's fall, a riser's face are spanned by none). */
export const EG_SB_MS = 6000;
export const EG_SB_AHEAD_M = 6;
export const EG_SB_BEHIND_M = 1.5;
export const EG_SB_SIDE_M = 4;
export const EG_SB_LAP_M = 0.3;
export const EG_SB_W_MIN = 1.6;
export const EG_SB_W_MAX = 3;
export const EG_SB_RISE_CM = EG_STEP_DOWN_CM;
/** The floor's height under (x, z) - the highest disc, band or lane of `spec` holding it (m), or null. */
function floorAt(spec, x, z) {
  let y = null;
  const take = (v) => { if (y == null || v > y) y = v; };
  for (const d of spec?.discs ?? []) { const dx = x - d.x, dz = z - d.z; if (dx * dx + dz * dz <= d.r * d.r) take(d.y ?? 0); }
  for (const b of spec?.bands ?? []) if (z >= b.z0 && z <= b.z1 && Math.abs(x - b.x) <= b.halfW) take(b.y ?? 0);
  for (const l of spec?.lanes ?? []) {
    const dx = l.bx - l.ax, dz = l.bz - l.az, L2 = dx * dx + dz * dz, u = L2 > 0 ? Math.max(0, Math.min(1, ((x - l.ax) * dx + (z - l.az) * dz) / L2)) : 0;
    const ex = x - (l.ax + dx * u), ez = z - (l.az + dz * u);
    if (ex * ex + ez * ez <= l.hw * l.hw) take(l.y ?? 0);
  }
  return y;
}
/**
 * SPIREBRIDGE'S PLANK over gap `g` of hall `spec` (its number in egSpanPairs' chain): `{ g, road, x, w, z0, z1, y0, y1 }`
 * (metres, the hall's frame) - along the course at the far piece's rest line (`x`, `w` across), from the near side's edge to
 * the far side's, each lapped by EG_SB_LAP_M, rising from the near side's height `y0` to the far side's `y1` - or null: no such
 * gap, an alcove's side way, or a gap no plank spans (a Drop's fall, a riser's face - past EG_SB_RISE_CM). Pure.
 * @param {any} spec @param {number} g @param {any[]|null} [P] the hall's chain, when the reader holds it
 */
export function egBridgeOf(spec, g, P = null) {
  if (!Number.isInteger(g) || g < 0) return null;
  const p = (P ?? egSpanPairs(spec ?? {}))[g];
  if (!p) return null;
  const a = p.a, b = p.b, on = b ?? a;
  if ((on.road ?? 0) === 2) return null;
  const za = a ? a.z + a.d / 2 : p.edge, zb = b ? b.z - b.d / 2 : p.edge;
  if (!(zb - za > 0.05)) return null;
  const y0 = a ? a.y : floorAt(spec, b.x, za - EG_SB_LAP_M) ?? b.y, y1 = b ? b.y : floorAt(spec, a.x, zb + EG_SB_LAP_M) ?? a.y;
  if (Math.abs(y1 - y0) * 100 > EG_SB_RISE_CM + 1e-6) return null;
  return { g, road: on.road ?? 0, x: on.x, w: Math.max(EG_SB_W_MIN, Math.min(EG_SB_W_MAX, on.w)), z0: za - EG_SB_LAP_M, z1: zb + EG_SB_LAP_M, y0, y1 };
}
/** The plank's top at `z` (m): its near side's height to its far side's across the gap, level past either end. */
export function egBridgeY(br, z) {
  const L = br.z1 - br.z0, u = L > 0 ? Math.max(0, Math.min(1, (z - br.z0) / L)) : 0;
  return br.y0 + (br.y1 - br.y0) * u;
}
/**
 * THE NEXT GAP AHEAD of a member at (x, z) of hall `spec`: the number (in egSpanPairs' chain) of the nearest gap a plank spans
 * on the road whose line the member stands on (within EG_SB_SIDE_M of the plank's - THE FORK's two roads stand 15 m apart),
 * its near edge no more than EG_SB_BEHIND_M behind the member and no more than EG_SB_AHEAD_M ahead, its far edge ahead of it -
 * or -1. Both sides read it: the room picks the gap by it, and a holder's screen offers the ask only while it answers one.
 * Pure.
 * @param {any} spec @param {number} x @param {number} z
 */
export function egBridgeAhead(spec, x, z) {
  const P = egSpanPairs(spec ?? {});
  let best = -1, bz = Infinity;
  for (let g = 0; g < P.length; g++) {
    const br = egBridgeOf(spec, g, P);
    if (!br || Math.abs(x - br.x) > EG_SB_SIDE_M) continue;
    const near = br.z0 + EG_SB_LAP_M, far = br.z1 - EG_SB_LAP_M;
    if (far <= z + EG_BODY_R || near < z - EG_SB_BEHIND_M || near > z + EG_SB_AHEAD_M) continue;
    if (near < bz) { bz = near; best = g; }
  }
  return best;
}
/** Is a body's feet at (x, y, z) (the hall's frame) on plank `br` - its top within the support's heights `up` over and `down`
 *  under it, inside its width and its laps, the capsule `pad` about them? Pure. */
export function egOnBridge(br, x, y, z, up, down, pad = EG_BODY_R) {
  if (!br || Math.abs(x - br.x) > br.w / 2 + pad || z < br.z0 - pad || z > br.z1 + pad) return false;
  const top = egBridgeY(br, z);
  return y <= top + up && y >= top - down;
}
