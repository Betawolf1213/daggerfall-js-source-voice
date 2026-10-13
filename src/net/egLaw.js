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
// EG-FULL (2026-10-11, Mac: "I said I want everything"): THE WHOLE DEPTH - the four bands (the Broken Galleries, the Soul
// Cairn, the Shade Perilous, the Havoc Wellhead without end), the circle law's weights and the variants' memory, every
// hall kind (the Rift-Yard and its five variants, the Span and its band's pieces, the Proving Walk and its champion's
// rank, the Rampart and its five variants, the Athenaeum, the Deepway, the Brink, the Scriptorium) and the twists; the
// lords' draw and every lord's own ground; the decrees' table, the Proclamation and the span decrees in the spec.
//
// EG-FULL, LAYER THREE (section 11): THE FRAGMENTS laid into the spec off their law (net/egFragLaw.js) - each passage of
// its band's library over its chasm and inner course, each chamber's play and signature, the set pieces (the Collapsing
// Tube, and the Brinks' Sinking Stair, Moon Path and Forge Line), THE FORK's High Road and Low Road (each its own course,
// both onto the end plate), and the ground after each run that the solver jumps.
//
// EG-ZC (2026-10-12, Mac: "I said I want everything"; sections 11.1, 11.2 and 22): SPEC LAW 5 - THE LAST FRAGMENTS. The
// Forge kit lays THE COOLING SLAG (net/egFragLaw.js - a crossing its two spouts pour in turn), and the Deepway goes down by a
// SHAFT of its band's kit in place of its three bare ledges (egFragShaft - the Caverns' throat, the Mist Stair's pit, THE
// HOLLOW TRUNK, THE SLAG CHUTE). THE LAW PIN keeps the law before: `egHallOf(seed, h, geo, law)` draws either law (law 4's
// halls byte for byte as they were - test/egz_frag.test.js), the relay a breach's own (`egv` - net/egDurable.js EG_LAWS).
//
// EG6a (2026-10-12; sections 9 and 10.1): THE SPAN GENERATOR - every course of a hall (its runs, its islands, a passage's
// inner course, a set piece's flights, THE FORK's two roads) is drawn by net/egSpanLaw.js egSpanOf off this hall's die and
// laid by courseOf, one course a road: layHall stands the hall about the generator's edge. Laws 4 and 5 lay byte for byte
// the halls they laid before (test/egz_frag.test.js, test/eg6a_span.test.js).
//
// AUDIT EG III (2026-10-13, lane 1 #14; sections 14 and 22): SPEC LAW 6 - THE SPAN DECREES ON EVERY SPAN. Gale-Swept and
// Crumbling Halls lay their sections on every span of a hall (EG_DECREE_LAW): a Span's road, both roads of THE FORK (the Low
// Road had none), and a Proving Walk's second span, the one to its door (it had none); at rank II each lays two sections, not
// one longer. A Gust section stands on an island of its own; a Crumble section is laid straight on from the ground before it
// and brings none (a section and no island: one island fewer than a section brings, two at rank II). Laws 4 and 5 are kept
// byte for byte (their 800 halls hashed whole - test/egz_frag.test.js, test/eg6a_span.test.js) and stay in EG_LAWS their days.
//
// Not a DFU member. Ledger A (ELITE-GATES).
import { sdSeed, sdRng } from './sdBrain.js';
import { egSpanProof, egRoadCross, EG_SPAN_RUN_MPS } from './egSpanLaw.js';   // EG-FULL: THE TIMED SOLVER - a course it refuses is laid again
import { egSpanOf, egDieBetween, EG_GAP_MIN_CM, EG_STEP_DOWN_CM } from './egSpanLaw.js';   // EG6a: THE SPAN GENERATOR - every course laid by it, through courseOf
import { egFragPassage, egFragChamber, egSetPiece, egSetPieceOf, EG_PASSAGE_KITS, EG_CHAMBER_KITS, EG_FRAGS } from './egFragLaw.js';   // EG-FULL LAYER THREE: the fragments
import { egFragShaft, EG_SHAFT_KITS, EG_SLAG_LAW, EG_SLAG_STEP } from './egFragLaw.js';   // EG-ZC: the shafts, the slag's law and its crust
import { gateTrialOf } from './gateMods.js';   // EG5: the gate's boss-general trials the lord family recasts (a leaf - it imports nothing)

/** The spec law's number - a change to any draw below changes it (and the relay's version with it). EG-ZC: 5, the last
 *  fragments (the law before kept - net/egDurable.js EG_LAWS). AUDIT EG III: 6, the span decrees on every span (laws 4 and 5
 *  kept beside it). */
export const EG_SPEC = 6;
/** AUDIT EG III (sections 14 and 22): the spec law from which Gale-Swept and Crumbling Halls lay their sections on every span
 *  (a Proving Walk's second span, THE FORK's Low Road) and two sections at rank II - the laws before lay as they laid. */
export const EG_DECREE_LAW = 6;
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
/** EG-ZI - THE LATE WAKE (section 7): after this many halls in a row that a member woke late (the hall woke before its
 *  `here`), the gather waits only this long after the pull for them. */
export const EG_LATE_HALLS = 2;
export const EG_LATE_ARRIVE_MS = 10_000;
/** EG-ZI - THE PULL'S TOLL (section 10.6): a share of the body for each quarter of the road still ahead of a member's
 *  furthest fair point, at most this many quarters; waived for a member who reached new ground (an island, a fragment's
 *  floor) this long before the pull; the halls it is paid after - those whose closing is the span's, the road crossed in
 *  it (the Span, the Deepway, a Brink, the Proving Walk's second span). */
export const EG_TOLL_STEP = 0.05;
export const EG_TOLL_QUARTERS = 4;
export const EG_TOLL_WAIVE_MS = 15_000;
export const EG_TOLL_KINDS = Object.freeze(['span', 'deepway', 'brink', 'proving']);
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
/** EG-F (section 16.6): THE FIRST HALL OF A BREACH THAT STARTS AT REDOUBT `ew` - the next circle's first (Hall 1 for 0). */
export const egStartHall = (ew) => (Number.isSafeInteger(ew) && ew > 0 ? egFirstHallOf(ew + 1) : 1);

/** THE BANDS (section 7): every 25 halls the torn halls fall further down the legions' road - the Broken Galleries, the
 *  Soul Cairn, the Shade Perilous, and the Havoc Wellhead, which never ends. */
export const EG_BANDS = Object.freeze([
  Object.freeze({ key: 'galleries', name: 'The Broken Galleries', aspect: 'burning', el: 'fire' }),
  Object.freeze({ key: 'cairn', name: 'The Soul Cairn', aspect: 'venom', el: 'poison' }),
  Object.freeze({ key: 'shade', name: 'The Shade Perilous', aspect: 'rime', el: 'frost' }),
  Object.freeze({ key: 'wellhead', name: 'The Havoc Wellhead', aspect: 'burning', el: 'fire' }),
]);
export const EG_BAND_NAMES = Object.freeze(EG_BANDS.map((b) => b.name));
/** Hall h's band (0-3), and a circle's. */
export const egBandOfHall = (h) => (h <= 25 ? 0 : h <= 50 ? 1 : h <= 75 ? 2 : 3);
export const egBandOfCircle = (c) => egBandOfHall(egFirstHallOf(c));
/** The Brink halls: the first hall of each band below the first (section 8.9). */
export const EG_BRINK_HALLS = Object.freeze([26, 51, 76]);
/** EG-E3 (2026-10-12, Mac: "I said I want everything"; section 13.3, THE SEAL): how many bands this deploy opens, from the
 *  top - a band past them is sealed, and a deploy that raises the number lifts its seal (the herald says the first breach
 *  through it: net/egHerald.js, which keeps what the hub first saw open). EG-FULL laid all four bands, so all four are
 *  open and no breach ends at a seal today: the director's `'seal'` end is for a deploy that opens fewer. */
export const EG_OPEN = EG_BANDS.length;

/** The hall kinds (section 8) - the six, the Court, the Brink, and the Scriptorium (a twist in slot 3). */
export const EG_HALL_KINDS = Object.freeze(['yard', 'span', 'proving', 'rampart', 'court', 'athenaeum', 'deepway', 'brink', 'scriptorium']);
/** Each kind's variants, and the band each unlocks at (section 8.1, 8.3). */
export const EG_VARIANTS = Object.freeze({
  yard: Object.freeze(['riftyard', 'wellspring', 'muster', 'holdfast', 'wellmouth']),
  rampart: Object.freeze(['siege', 'fallingwall', 'winch', 'gauntlet', 'forgebridge']),
});
export const EG_VARIANT_BAND = Object.freeze([0, 0, 1, 2, 3]);
/** The variants a band has unlocked for a kind. */
export const egVariantsOf = (kind, band) => (EG_VARIANTS[kind] ?? []).filter((_, i) => EG_VARIANT_BAND[i] <= band);
export const EG_HALL_NAMES = Object.freeze({
  yard: 'The Rift-Yard', span: 'The Span', proving: 'The Proving Walk', rampart: 'The Rampart', court: 'The Court', athenaeum: 'The Athenaeum', deepway: 'The Deepway', brink: 'The Brink', scriptorium: 'The Scriptorium',
  riftyard: 'The Rift-Yard', wellspring: 'The Wellspring', muster: 'The Muster', holdfast: 'The Holdfast', wellmouth: 'The Wellmouth',
  siege: 'The Siege-Walk', fallingwall: 'The Falling Wall', winch: 'The Winch', gauntlet: 'The Gauntlet', forgebridge: 'The Forge Bridge',
});
/** What each hall asks (section 27.3's objective chip), by variant where it has one, else by kind. */
export const EG_OBJECTIVES = Object.freeze({
  yard: 'Close the rifts.', riftyard: 'Close the rifts.', wellspring: 'Break the anchors, then the Wellspring.', muster: 'Fell the standard.', holdfast: 'Hold the relic.', wellmouth: 'Close the wandering rifts.',
  rampart: 'Break the wards at the portcullis.', siege: 'Break the wards at the portcullis.', fallingwall: 'Outrun the falling wall. Break the wards.', winch: 'Hold the winch plates.', gauntlet: 'Silence the casters.', forgebridge: 'Climb the forge bridge. Break the wards.',
  span: 'Cross.', proving: 'Fell the champion.', court: 'Fell the lord.', athenaeum: 'Turn the Orrery true.', deepway: 'Find the way down.', brink: 'Cross into the deep.', scriptorium: 'Rest a moment.',
});
/** The objective for a spec. */
export const egObjectiveOf = (spec) => EG_OBJECTIVES[spec?.variant] ?? EG_OBJECTIVES[spec?.kind] ?? '';

/** The circle law's weights (section 9): slots 1 and 4 draw the Rift-Yard against the Rampart, slot 3 the Proving Walk
 *  against the Athenaeum, by band. */
export const EG_KIND_WEIGHTS = Object.freeze([
  Object.freeze({ yard: 3, rampart: 2, proving: 3, athenaeum: 1 }),
  Object.freeze({ yard: 3, rampart: 3, proving: 2, athenaeum: 1 }),
  Object.freeze({ yard: 2, rampart: 3, proving: 3, athenaeum: 1 }),
  Object.freeze({ yard: 3, rampart: 3, proving: 3, athenaeum: 1 }),
]);

/** THE TWISTS (section 8.7), and the kinds each may turn. */
export const EG_TWISTS = Object.freeze(['vault', 'bargain', 'squad', 'scriptorium', 'ghost', 'deserter', 'mimic', 'captive', 'sutler']);
const TRIAL_KINDS = Object.freeze(['yard', 'span', 'proving', 'rampart', 'athenaeum', 'deepway']);
export const EG_TWIST_ON = Object.freeze({
  vault: Object.freeze(['span', 'proving']), bargain: TRIAL_KINDS, squad: Object.freeze(['yard', 'rampart']), scriptorium: Object.freeze(['proving', 'athenaeum']),
  ghost: TRIAL_KINDS, deserter: Object.freeze(['yard']), mimic: TRIAL_KINDS, captive: TRIAL_KINDS, sutler: TRIAL_KINDS,
});
export const EG_TWIST_NAMES = Object.freeze({
  vault: 'Reliquary Vault', bargain: "Dagon's Bargain", squad: 'Kynval Squad', scriptorium: 'The Scriptorium', ghost: "A Battlemage's Ghost",
  deserter: 'The Deserter', mimic: 'The Kyn Mimic', captive: 'The Captive Battlemage', sutler: 'The Sutler',
});
export const EG_TWIST_LINES = Object.freeze({
  vault: 'A side span leads to a sealed vault.', bargain: 'A shrine to Dagon offers a bargain.', squad: 'A Kynval squad holds this hall.', scriptorium: 'A quiet hall. The Battlemages kept their books here.',
  ghost: "A Battlemage's ghost fights beside you.", deserter: 'A Dremora deserter races you to the rifts.', mimic: 'Not every cache is what it seems.', captive: 'A Battlemage hangs in chains.', sutler: 'The Kyn quartermaster sells for lumen.',
});

// ── the lords (section 13.3) ─────────────────────────────────────────────────────────────────────────────
/** EVERY LORD: its key, its card (name and epithet), its band, its body (a Daggerfall mobile drawn at `scale` - the
 *  gate's BOSS_LOOKS law), its aspect, its ground. The Valkynaz hold every fifth Court. */
export const EG_LORDS = Object.freeze({
  hound: Object.freeze({ key: 'hound', name: 'Grath', epithet: 'the Hound', band: 0, mobile: 27, scale: 3, el: 'fire', ground: 'isles', motif: 0 }),
  spellmaster: Object.freeze({ key: 'spellmaster', name: 'The Last Spellmaster', epithet: 'Raised by the Kyn', band: 0, mobile: 33, scale: 2.5, el: 'shock', ground: 'disc18', motif: 1 }),
  armsmaster: Object.freeze({ key: 'armsmaster', name: 'The Last Armsmaster', epithet: 'Raised by the Kyn', band: 0, mobile: 15, scale: 2.6, el: null, ground: 'disc20', motif: 2 }),
  ilthys: Object.freeze({ key: 'ilthys', name: 'Valkynaz Ilthys', epithet: 'of the Galleries', band: 0, mobile: 31, scale: 3.0, el: 'fire', ground: 'rotunda', valk: 1, motif: 3 }),
  cairnkeeper: Object.freeze({ key: 'cairnkeeper', name: 'The Cairn-Keeper', epithet: 'Warden of the Dead', band: 1, mobile: 32, scale: 3, el: 'poison', ground: 'crypt', motif: 4 }),
  twins: Object.freeze({ key: 'twins', name: 'The Twin Lords', epithet: 'Vael and Isk', band: 1, mobile: 26, scale: 2.6, el: 'fire', ground: 'twins', motif: 5 }),
  morvayn: Object.freeze({ key: 'morvayn', name: 'Valkynaz Morvayn', epithet: 'of the Cairn', band: 1, mobile: 31, scale: 3.3, el: 'poison', ground: 'soulbridge', valk: 1, motif: 6 }),
  dusk: Object.freeze({ key: 'dusk', name: 'The Mother of Dusk', epithet: 'Winged by Dagon', band: 2, mobile: 29, scale: 3, el: 'frost', ground: 'glade', fly: 1, motif: 7 }),
  stalker: Object.freeze({ key: 'stalker', name: 'The Night-Stalker', epithet: 'Who Drinks the Dark', band: 2, mobile: 30, scale: 2.5, el: null, ground: 'disc22', motif: 8 }),
  seyth: Object.freeze({ key: 'seyth', name: 'Valkynaz Seyth', epithet: 'of the Shade', band: 2, mobile: 31, scale: 3.6, el: 'frost', ground: 'vault', valk: 1, motif: 9 }),
  colossus: Object.freeze({ key: 'colossus', name: 'The Bound Colossus', epithet: "The Battlemages' Engine", band: 3, mobile: 36, scale: 4, el: 'shock', ground: 'forge', motif: 10 }),
  wyrm: Object.freeze({ key: 'wyrm', name: 'The Wellhead Wyrm', epithet: 'Of the Molten Deep', band: 3, mobile: 34, scale: 5, el: 'fire', ground: 'perches', fly: 1, motif: 11 }),
  garoth: Object.freeze({ key: 'garoth', name: 'Valkynaz Garoth', epithet: 'of the Wellhead', band: 3, mobile: 31, scale: 4.0, el: 'fire', ground: 'pit', valk: 1, motif: 12 }),
});
/** The Court lords by band (the Valkynaz aside). */
export const EG_BAND_LORDS = Object.freeze([
  Object.freeze(['hound', 'spellmaster', 'armsmaster']), Object.freeze(['cairnkeeper', 'twins']), Object.freeze(['dusk', 'stalker']), Object.freeze(['colossus', 'wyrm']),
]);
export const EG_VALKYNAZ = Object.freeze(['ilthys', 'morvayn', 'seyth', 'garoth']);
/** THE PROVING CHAMPIONS (section 8.5): one per Kyn rank, by band - and each rank's signature. */
export const EG_CHAMPIONS = Object.freeze([
  Object.freeze({ key: 'kynreeve', name: 'The Kynreeve', sig: 'shieldwall', title: 'Shield-Wall' }),
  Object.freeze({ key: 'kynmarcher', name: 'The Kynmarcher', sig: 'citadel', title: 'The Citadel' }),
  Object.freeze({ key: 'markynaz', name: 'The Markynaz', sig: 'decree', title: "The Grand Duke's Decree" }),
  Object.freeze({ key: 'markynaz', name: 'The Markynaz', sig: 'decree', title: "The Grand Duke's Decree" }),
]);

// ── the decrees (section 14) ─────────────────────────────────────────────────────────────────────────────
/** A decree law's numbers are thousandths: 1000 is x1 (an X-keyed law's), 850 a threat pick of 0.85. */
export const EG_LAW_UNIT = 1000;
/** A decree's law by rank - `[rank I's, rank II's]`, frozen. */
const lawRanks = (one, two) => Object.freeze([Object.freeze(one), Object.freeze(two)]);
/** EG5: a gate trial's numbers (net/gateMods.js GATE_TRIALS - read, never copied), and a number in thousandths. */
const trial = (k) => /** @type {any} */ (gateTrialOf(k));
const milli = (v) => Math.round(v * EG_LAW_UNIT);
/** EVERY DECREE: its number, its family, its name, its line (and the lord family's `law` - section 14's merge). */
export const EG_DECREE_FAMILIES = Object.freeze(['blows', 'legion', 'ground', 'covenant', 'lord']);
export const EG_DECREES = Object.freeze([
  Object.freeze({ id: 0, key: 'chained', fam: 'blows', name: 'Chained Blows', line: 'The legion\'s blows chain a second shape.' }),
  Object.freeze({ id: 1, key: 'twincharge', fam: 'blows', name: 'Twin Charge', line: 'A Breaker\'s charge is followed by a second.' }),
  Object.freeze({ id: 2, key: 'pyre', fam: 'blows', name: 'Pyre-Bound', line: 'A slain add bursts into flame.' }),
  Object.freeze({ id: 3, key: 'shades', fam: 'blows', name: 'Vengeful Shades', line: 'A slain add\'s shade follows its slayer.' }),
  Object.freeze({ id: 4, key: 'pack', fam: 'legion', name: 'Hunting Pack', line: 'Harriers hunt every hall.' }),
  Object.freeze({ id: 5, key: 'swarm', fam: 'legion', name: 'Swarm-Mother', line: 'Every wave carries a Binder.' }),
  Object.freeze({ id: 6, key: 'vigil', fam: 'legion', name: "Kyn's Vigil", line: 'The champion waits on every arrival plate.' }),
  Object.freeze({ id: 7, key: 'rally', fam: 'legion', name: "Kyn's Rally", line: 'A slain add strengthens its wave.' }),
  Object.freeze({ id: 8, key: 'soulpools', fam: 'legion', name: 'Soul-Pools', line: 'A slain add leaves a pool that heals its kin.' }),
  Object.freeze({ id: 9, key: 'ashfall', fam: 'ground', name: 'Ashfall', line: 'Fire falls on the courts.' }),
  Object.freeze({ id: 10, key: 'gale', fam: 'ground', name: 'Gale-Swept', line: 'Every span carries a gust.' }),
  Object.freeze({ id: 11, key: 'crumbling', fam: 'ground', name: 'Crumbling Halls', line: 'Every span crumbles.' }),
  Object.freeze({ id: 12, key: 'sparks', fam: 'ground', name: 'Wellhead Sparks', line: 'Sparks rise and burst.' }),
  Object.freeze({ id: 13, key: 'press', fam: 'covenant', name: "The Covenant's Press", line: 'The next Redoubt gives less time.' }),
  Object.freeze({ id: 14, key: 'ashen', fam: 'covenant', name: 'Ashen Vigil', line: 'The next rest heals less.' }),
  // EG5 (2026-10-12; section 14, THE MERGE): the lord family's four are the gate's boss-general trials (net/gateMods.js
  // GATE_TRIALS) RECAST AS X-KEYED LAWS - `law` its rank I's (the trial's own numbers) and its rank II's (the page's), each
  // in thousandths (EG_LAW_UNIT: the law decides in integers); a key ending in X multiplies, any other is the last decree's
  // that names it (egLawFold). Colossal's radii are the page's 1.2 (the Slam 8.4 m, not the gate's 8.5); Unyielding's ward is
  // x2, the trial's 6 s over the gate's SHIELD_MS 3 s, in place of its `shieldMs`
  Object.freeze({ id: 15, key: 'colossal', fam: 'lord', name: 'Colossal', line: 'The lord stands larger.', law: lawRanks({ sizeX: milli(trial('colossal').size), hpX: milli(trial('colossal').hp), radiusX: 1200 }, { sizeX: 1400, hpX: 1400, radiusX: 1300 }) }),
  Object.freeze({ id: 16, key: 'unyielding', fam: 'lord', name: 'Unyielding', line: 'The lord\'s ward holds longer.', law: lawRanks({ shieldX: 2000, hitX: milli(trial('unyielding').hit) }, { shieldX: 3000, hitX: 750 }) }),
  Object.freeze({ id: 17, key: 'vengeful', fam: 'lord', name: 'Vengeful', line: 'The lord strikes harder.', law: lawRanks({ dmgX: milli(trial('vengeful').dmg) }, { dmgX: 1400 }) }),
  Object.freeze({ id: 18, key: 'grudge', fam: 'lord', name: 'Grudge-Bearer', line: 'The lord never forgets.', law: lawRanks({ threatPick: milli(trial('grudge').threatPick), threatDecay: milli(trial('grudge').threatDecay) }, { threatPick: 950, threatDecay: 0 }) }),
]);
export const EG_DECREE_BY_KEY = Object.freeze(Object.fromEntries(EG_DECREES.map((d) => [d.key, d])));
/** How many families a circle draws (section 14): none in the first, then one more every second circle, four at most. */
export const egDecreeCount = (c) => (c <= 1 ? 0 : Math.min(4, 1 + Math.floor((c - 2) / 2)));
/** From circle 10, one decree a circle ranks up to II. */
export const egDecreeRanksUp = (c) => c >= 10;
/** THE PROCLAMATION'S EIGHT (section 20): the week's one rule, at rank I, for every breach that week. */
export const EG_PROCLAMATIONS = Object.freeze(['rally', 'sparks', 'soulpools', 'shades', 'pyre', 'crumbling', 'ashfall', 'pack']);
/** The week's Proclamation (a decree key), by the arena's week. */
export const egProclamationOf = (week) => EG_PROCLAMATIONS[((week % 8) + 8) % 8];
/** The decrees that change a span's course, folded into the spec's `geo` (Gale-Swept's rank and Crumbling Halls'). */
export const egGeoOf = (decrees) => {
  let g = 0, cr = 0;
  for (const [id, rank] of decrees ?? []) { if (id === EG_DECREE_BY_KEY.gale.id) g = Math.max(g, rank); if (id === EG_DECREE_BY_KEY.crumbling.id) cr = Math.max(cr, rank); }
  return g + 3 * cr;
};


/** EG5 (2026-10-12; section 14, THE PROFILE): the most decrees a circle bears - four drawn, a Bargain's, the Proclamation
 *  and three wagered (the frames' nine: net/wire.js `egDecreesW`). */
export const EG_DECREES_MAX = 9;
/** The X-keyed laws' keys (each x1 where no decree names it): the lord family's, from the table. */
export const EG_LAW_X_KEYS = Object.freeze([...new Set(EG_DECREES.flatMap((d) => (/** @type {any} */ (d).law ?? []).flatMap((L) => Object.keys(L))).filter((k) => k.endsWith('X')))]);
/**
 * THE PROFILE'S VALIDATOR: a circle's decrees as the state says them (`[[id, rank], ...]` - net/egRun.js egDecreesInForce) -
 * at most EG_DECREES_MAX, each a known decree at rank 1 or 2, none twice. Answers a fresh copy, or null.
 * @param {unknown} dc
 * @returns {Array<[number, number]>|null}
 */
export function validEgDecrees(dc) {
  if (!Array.isArray(dc) || dc.length > EG_DECREES_MAX) return null;
  const seen = new Set(), out = [];
  for (const p of dc) {
    if (!Array.isArray(p) || p.length !== 2 || !Number.isInteger(p[0]) || !EG_DECREES[p[0]] || (p[1] !== 1 && p[1] !== 2) || seen.has(p[0])) return null;
    seen.add(p[0]);
    out.push([p[0], p[1]]);
  }
  return out;
}
/** How many profiles are kept (the least recently asked dropped first): the Spire's decree sets are not a bounded few, as
 *  the gate's 185 and the Hour's 216 are. */
export const EG_PROFILE_CACHE_MAX = 256;
const _profiles = new Map();
/**
 * THE FOLD (section 14, "The merge" - net/sdMarks.js sdMarksLaw's rule): laws in thousandths, in their order - a key ending
 * in X multiplies (rounded to the thousandth), any other is the last law's that names it; each X-keyed number x1
 * (EG_LAW_UNIT) where none names it. Answers the folded law, in thousandths. Pure.
 * @param {ReadonlyArray<Readonly<Record<string, number>>|undefined|null>} laws
 */
export function egLawFold(laws) {
  /** @type {Record<string, number>} */
  const acc = {};
  for (const k of EG_LAW_X_KEYS) acc[k] = EG_LAW_UNIT;
  for (const L of laws) for (const [k, v] of Object.entries(L ?? {})) acc[k] = k.endsWith('X') ? Math.round(((acc[k] ?? EG_LAW_UNIT) * v) / EG_LAW_UNIT) : v;
  return acc;
}
/**
 * EG5 - THE FIGHT'S PROFILE (section 14): what a circle's decrees `dc` make of the fight its lords run by - net/sdRemnant.js
 * sdFightProfile's fold: every decree's law (egLawFold), in the order of its number. Answers `{ dc, key, law }`:
 * the decrees sorted (null for none), the cache's key (the sorted decree string, `id:rank,...`), and `law` - every
 * X-keyed number (x1 where none names it) and each other a decree named, as numbers (net/egLords.js egLordLaw reads it,
 * with the gate's own threat where none is named). An invalid list is the fight with no decree. Pure, frozen, and kept
 * (LRU, EG_PROFILE_CACHE_MAX) - only the lord family's four carry a law; the other families are read by rank where they
 * act (the legion, the director, the spans).
 * @param {unknown} dc
 */
export function egFightProfile(dc) {
  const ok = validEgDecrees(dc) ?? [];
  ok.sort((a, b) => a[0] - b[0]);
  const key = ok.map(([id, rank]) => `${id}:${rank}`).join(',');
  const had = _profiles.get(key);
  if (had) { _profiles.delete(key); _profiles.set(key, had); return had; }   // the most recently asked kept last
  const acc = egLawFold(ok.map(([id, rank]) => /** @type {any} */ (EG_DECREES[id]).law?.[rank - 1]));
  /** @type {Record<string, number>} */
  const law = {};
  for (const [k, v] of Object.entries(acc)) law[k] = v / EG_LAW_UNIT;
  const P = Object.freeze({ dc: ok.length ? Object.freeze(ok.map((p) => Object.freeze(p))) : null, key, law: Object.freeze(law) });
  if (_profiles.size >= EG_PROFILE_CACHE_MAX) _profiles.delete(_profiles.keys().next().value);
  _profiles.set(key, P);
  return P;
}
/** How many profiles the cache holds now (its bound's pin). */
export const egProfilesKept = () => _profiles.size;

/** Halls stand this far apart across x in a circle's level (m) - far past the fog, so a hall never sees the next. */
export const EG_HALL_PITCH = 500;

/** The breach's seed for a draw (the Hour's mix - net/sdBrain.js sdSeed). */
export const egSeed = (seed, salt) => sdSeed(seed >>> 0, salt >>> 0);
const CIRCLE_SALT = 0x0e6c1c;
const HALL_SALT = 0x0e6a11;
/** A course laid again (THE TIMED SOLVER's redraw) takes this far a sub-seed per try. */
const RELAY_SALT = 0x5a1d;
const LORD_SALT = 0x0e610d;

/**
 * THE CIRCLE'S PLAN (section 7's rhythm, section 9's circle law, section 8.7's twists): its five slots, each
 * `{ kind, variant, twist }` - a fight, the traverse, the mixed, a fight drawn apart from the first, the Court. The
 * first circle is fixed (a Rift-Yard, a Span through an Oblivion Caverns passage, a Proving Walk, a Siege-Walk, Grath's
 * Court); circles 6, 11 and 16 open on a Brink; from circle 3 the traverse is the Deepway one time in three; the
 * Athenaeum takes slot 3 at its weight, never in the first circle; a variant is never one of its kind's last
 * min(2, unlocked - 1) draws; from circle 2 about one hall in four carries a twist, never the Court, never two running.
 * Each circle's draw depends on the ones before it (the variants' memory), so plans are laid in order and kept.
 * @param {number} seed @param {number} c
 * @returns {ReadonlyArray<{kind: string, variant: string|null, twist: string|null}>}
 */
export function egCirclePlan(seed, c) {
  const s = seed >>> 0;
  let rec = _plans.get(s);
  if (!rec) { rec = { plans: [null, FIRST_PLAN], last: { yard: ['riftyard'], rampart: ['siege'] } }; if (_plans.size >= 16) _plans.delete(_plans.keys().next().value); _plans.set(s, rec); }
  for (let k = rec.plans.length; k <= c; k++) rec.plans.push(layPlan(s, k, rec.last));
  return rec.plans[Math.max(1, c)];
}
const _plans = new Map();
const FIRST_PLAN = Object.freeze([
  Object.freeze({ kind: 'yard', variant: 'riftyard', twist: null }), Object.freeze({ kind: 'span', variant: null, twist: null }),
  Object.freeze({ kind: 'proving', variant: null, twist: null }), Object.freeze({ kind: 'rampart', variant: 'siege', twist: null }),
  Object.freeze({ kind: 'court', variant: null, twist: null }),
]);
function layPlan(seed, c, last) {
  const r = sdRng(egSeed(seed, CIRCLE_SALT + c)), band = egBandOfCircle(c), W = EG_KIND_WEIGHTS[band];
  const weighed = (a, b) => (r() * (W[a] + W[b]) < W[a] ? a : b);
  const variant = (kind, not = null) => {
    const open = egVariantsOf(kind, band), mem = Math.min(2, open.length - 1);
    const recent = (last[kind] ?? []).slice(-mem);
    let pool = open.filter((v) => !recent.includes(v) && v !== not);
    if (!pool.length) pool = open.filter((v) => v !== not);
    if (!pool.length) pool = open;
    const v = pool[Math.floor(r() * pool.length)];
    last[kind] = [...(last[kind] ?? []), v].slice(-4);
    return v;
  };
  const slots = [];
  const brink = c === 6 || c === 11 || c === 16;
  const k1 = brink ? 'brink' : weighed('yard', 'rampart');
  const v1 = brink ? null : variant(k1);
  slots.push({ kind: k1, variant: v1, twist: null });
  slots.push({ kind: c >= 3 && r() * 3 < 1 ? 'deepway' : 'span', variant: null, twist: null });
  slots.push({ kind: weighed('proving', 'athenaeum'), variant: null, twist: null });
  const k4 = weighed('yard', 'rampart');
  slots.push({ kind: k4, variant: variant(k4, k4 === k1 ? v1 : null), twist: null });
  slots.push({ kind: 'court', variant: null, twist: null });
  // THE TWISTS: about one hall in four, never the Court or a Brink, never two running; a Bargain at most once a circle
  let prev = false, bargain = false;
  for (let i = 0; i < 4; i++) {
    const sl = slots[i];
    const roll = r(), pickAt = r();
    if (prev || sl.kind === 'brink' || roll >= 0.25) { prev = false; continue; }
    const can = EG_TWISTS.filter((t) => EG_TWIST_ON[t].includes(sl.kind) && !(t === 'bargain' && bargain) && !(t === 'scriptorium' && i !== 2) && !(t === 'deserter' && !['riftyard', 'wellmouth'].includes(sl.variant)));
    if (!can.length) { prev = false; continue; }
    const t = can[Math.floor(pickAt * can.length)];
    sl.twist = t;
    if (t === 'bargain') bargain = true;
    if (t === 'scriptorium') { sl.kind = 'scriptorium'; sl.variant = null; }
    prev = true;
  }
  return Object.freeze(slots.map((sl) => Object.freeze(sl)));
}
/** THE CIRCLE's five kinds (the plan's, read alone). */
export const egCircleOf = (seed, c) => Object.freeze(egCirclePlan(seed, c).map((p) => p.kind));

/**
 * THE COURT'S LORD (section 13.3) for circle c: every fifth Court a Valkynaz's (Ilthys at Redoubt 5, Morvayn at 10, Seyth
 * at 15, Garoth at 20 and every fifth after); the first circle's Grath; else drawn - the band's own lords at weight 2,
 * every earlier band's at weight 1, never one of the last min(2, pool - 1) Courts'. Laid in order and kept.
 */
export function egBossOf(seed, c) {
  if (c % 5 === 0) return EG_VALKYNAZ[Math.min(3, c / 5 - 1)];
  if (c <= 1) return 'hound';
  const s = seed >>> 0;
  let rec = _lords.get(s);
  if (!rec) { rec = ['', 'hound']; if (_lords.size >= 16) _lords.delete(_lords.keys().next().value); _lords.set(s, rec); }
  for (let k = rec.length; k <= c; k++) {
    if (k % 5 === 0) { rec.push(EG_VALKYNAZ[Math.min(3, k / 5 - 1)]); continue; }
    const band = egBandOfCircle(k), pool = [];
    for (let b = 0; b <= band; b++) for (const l of EG_BAND_LORDS[b]) pool.push([l, b === band ? 2 : 1]);
    const drawn = rec.slice(1).filter((l, i) => (i + 1) % 5 !== 0);
    const mem = Math.min(2, pool.length - 1), recent = drawn.slice(-mem);
    const open = pool.filter(([l]) => !recent.includes(l));
    const r = sdRng(egSeed(s, LORD_SALT + k));
    let x = r() * open.reduce((m, [, w]) => m + w, 0), pick = open[open.length - 1][0];
    for (const [l, w] of open) { x -= w; if (x < 0) { pick = l; break; } }
    rec.push(pick);
  }
  return rec[c];
}
const _lords = new Map();
/** A lord's card: its name and epithet. */
export const egLordCard = (key) => EG_LORDS[key] ? { name: EG_LORDS[key].name, epithet: EG_LORDS[key].epithet } : { name: 'The Lord', epithet: '' };

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
/** The integer square root of a whole number (the largest q with q*q <= n) - Newton's, in integers alone. */
export function lawIsqrt(n) {
  const m = Math.trunc(n);
  if (!(m > 0)) return 0;
  let q = m, r = Math.trunc((q + 1) / 2);
  while (r < q) { q = r; r = Math.trunc((q + Math.trunc(m / q)) / 2); }
  return q;
}
/** A point `r` cm from (x, z) at bearing `deg` (the court frame's: 0 along +z, 90 along +x), whole centimetres. */
const polar = (x, z, r, deg) => [x + Math.trunc((r * lawSin(deg)) / 10000), z + Math.trunc((r * lawCos(deg)) / 10000)];

// ── the hall spec (section 9) ──────────────────────────────────────────────────────────────────────────────
/** A die's whole number from lo to hi, both in. */
const between = egDieBetween;
const m = (cm) => cm / 100;
/** The span's pieces, the Steps' sizes and clocks (world/sdSteps.js - pinned equal), in cm and ms. */
export const EG_STEP = Object.freeze({
  drift: Object.freeze({ w: 300, d: 240 }), beat: Object.freeze({ w: 300, d: 260 }), riser: Object.freeze({ w: 300, d: 260 }),
  crumble: Object.freeze({ w: 260, d: 260 }), still: Object.freeze({ w: 300, d: 260 }), ledge: Object.freeze({ w: 240, d: 200 }),
  gust: Object.freeze({ w: 300, d: 260 }), rail: Object.freeze({ w: 300, d: 300 }), pend: Object.freeze({ w: 300, d: 260 }),
  vent: Object.freeze({ w: 420, d: 420 }), drop: Object.freeze({ w: 600, d: 600 }),
  // EG-FULL LAYER THREE: the fragments' own pieces (net/egSpanLaw.js) - a moon-bound branch, a rolling drum, a bone bridge
  // (the Crumble's depth), a flight of the Sinking Stair
  moon: Object.freeze({ w: 280, d: 220 }), drum: Object.freeze({ w: 300, d: 300 }), bone: Object.freeze({ w: 260, d: 260 }), sink: Object.freeze({ w: 300, d: 260 }),
  // EG-ZC: a slag crossing's crust, each spout's lane (net/egFragLaw.js EG_SLAG_STEP - its one home)
  slag: EG_SLAG_STEP,
});
/** Which pieces each band unlocks (section 10.3) - the Galleries' five, the Cairn's Gust and Rail, the Shade's Pendulum,
 *  the Wellhead's Vent. */
export const EG_BAND_PIECES = Object.freeze([
  Object.freeze(['drift', 'beat', 'riser', 'crumble', 'drop']),
  Object.freeze(['drift', 'beat', 'riser', 'crumble', 'drop', 'gust', 'rail']),
  Object.freeze(['drift', 'beat', 'riser', 'crumble', 'drop', 'gust', 'rail', 'pend']),
  Object.freeze(['drift', 'beat', 'riser', 'crumble', 'drop', 'gust', 'rail', 'pend', 'vent']),
]);
/** THE ENVELOPE (section 10.4): a riser's rise, the Beat's half, a gap's range, a step down within a run (under a metre), a
 *  Drop (at most 4.5 m) - EG6a: the span generator's own (net/egSpanLaw.js), said here as they always were. */
export { EG_RISER_CM, EG_BEAT_HALF_MS, EG_GAP_MIN_CM, EG_GAP_MAX_CM, EG_STEP_DOWN_CM, EG_DROP_CM } from './egSpanLaw.js';
/** No hall runs longer than this (m): its fight's every point stays inside the gate's wire bound (net/wire.js
 *  GATE_COURT_BOUND, 160 - pinned under it). */
export const EG_HALL_LEN_MAX = 158;
/** A plate's radius, an island's, a bridge's half-width (cm). */
const PLATE_R = 500, ISLE_R = 300, BRIDGE_HALF = 200;
/** The Oblivion Caverns passage (section 11's first fragment): its floor's half-width, its length, the chasm in it and
 *  the ledges that cross it, its height (cm). */
export const EG_CAVE = Object.freeze({ halfW: 300, len: 2800, chasm: 1000, height: 520 });
/** The fragment kits by band (section 11.2): the passage each band's Brinks are torn from (the rest draw from the band's
 *  whole library - net/egFragLaw.js EG_PASSAGE_KITS). */
export const EG_FRAG_KITS = Object.freeze(['caverns', 'ossuary', 'gloam', 'forge']);
/** THE FORK (section 11.4): from circle 2 every span forks at an island - the High Road over the void, the Low Road this
 *  far across (cm, the hall's x) and a Drop down, through a passage beneath; the High Road meets its height by a Drop. */
export const EG_FORK_FROM_C = 2;
export const EG_LOW_X_CM = 1500;
export const EG_FORK_DROP_CM = 450;
/** The roads: the one course (and the High Road), the Low Road, and an alcove's side way (optional - never proven). */
export const EG_ROAD = Object.freeze({ high: 0, low: 1, side: 2 });
/** The Rampart's waystones (m apart), a Falling Wall's start and pace, a Forge Bridge's belt (section 8.3). */
export const EG_WAYSTONE_EVERY_M = 30;
export const EG_WALL_FALL_AFTER_MS = 20_000;
export const EG_WALL_FALL_MPS = 1.5;
export const EG_BELT_MPS = 1.0;

/**
 * HALL h's SPEC (`geo` the circle's span decrees - net/egLaw.js egGeoOf; EG-ZC: `law` the spec law it is drawn under, this
 * build's EG_SPEC unless a breach of the law before asks its own - net/egBrain.js): its kind, variant, twist, band, circle, slot,
 * name and objective; its geometry in its own frame (metres): the plates (`arrive`, `end`), the walkable discs and bands
 * and lanes (`discs`, `bands`, `lanes`), a span's steps and islands (the Steps' record: `{i, kind, span, x, y, z, w, d,
 * amp, period, phase, beat}`, period and phase in seconds), the fragments' passages (`caves`, each its band's kit), and
 * the trial's own: THE FIGHT FLOOR (`fl` - discs `{t:'d', x, z, r, y}` and lanes `{t:'l', ax, az, bx, bz, hw, y}`, and its
 * bounding disc `fight`), its spots by role (`spots` - rifts, anchors, rally points, the relic, runes, gems, pillars,
 * plates, balconies, braziers...), a Rampart's vents and gate and walkway and waystones, a champion's or a lord's spot
 * (`foe`), the Court's wake ring (`ring`) and its lord (`lord`). Frozen, and cached.
 * @param {number} seed @param {number} h @param {number} [geo]
 */
export function egHallOf(seed, h, geo = 0, law = EG_SPEC) {
  const key = `${seed >>> 0}:${h}:${geo | 0}`;
  const given = _given.get(key);   // EG-H2: a hall the relay drew under the breach's own law (egSpecGive, below)
  if (given) return given;
  const lawKey = law === EG_SPEC ? key : `${key}:${law}`;   // EG-ZC: the law before drawn apart
  const had = _specs.get(lawKey);
  if (had) return had;
  // THE TIMED SOLVER (section 10.5, net/egSpanLaw.js): a course it refuses is laid again from the next sub-seed, at most
  // EG_RELAY_MAX times, then from the band's first two pieces alone
  let spec = layHall(seed >>> 0, h, geo | 0, 0, law), tries = 0;
  while (spec.steps.length && !egSpanProof(spec).ok && tries < EG_RELAY_MAX) spec = layHall(seed >>> 0, h, geo | 0, ++tries, law);
  if (spec.steps.length && !egSpanProof(spec).ok) spec = layHall(seed >>> 0, h, geo | 0, EG_RELAY_MAX + 1, law);
  // THE FORK's two roads' fastest crossings at THE SPAN BUILD (s; the Low Road's bridges across and back run too) - the
  // Low Road's closing reads their difference (section 11.4)
  if (spec.fork) spec.fork = { ...spec.fork, hi: Math.round(egRoadCross(spec, 0, spec.fork.z).fast * 10) / 10, lo: Math.round((egRoadCross(spec, 1).fast + (2 * (spec.fork.lowX - spec.fork.x)) / EG_SPAN_RUN_MPS) * 10) / 10 };
  spec = deepFreeze({ ...spec, laid: tries });
  if (_specs.size >= 48) _specs.delete(_specs.keys().next().value);
  _specs.set(lawKey, spec);
  return spec;
}
const _specs = new Map();
const deepFreeze = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) deepFreeze(v); } return o; };
// EG-H2 (2026-10-12, bible/11-Multiplayer/Elite-Gates.md section 22, THE LAW PIN): A HALL GIVEN. A client whose law is not
// its breach's (`st`'s `egv` - net/egDurable.js EG_LAWS) asks the room `{k:'spec'}` and takes the relay's own bytes: given,
// a hall is read before any draw, so every reader (world/egHall.js, scenes/egSpan.js, scenes/egFight.js, the breach's
// client) builds the breach's own halls. The relay never gives one. A few circles' worth are kept.
const _given = new Map();
/** A hall the relay drew, taken as given - answers whether it was one (its seed, hall and ground whole numbers). */
export function egSpecGive(spec) {
  if (!spec || typeof spec !== 'object' || !Number.isSafeInteger(spec.seed) || !Number.isSafeInteger(spec.h) || spec.h < 1 || !Number.isSafeInteger(spec.geo ?? 0)) return false;
  const key = `${spec.seed >>> 0}:${spec.h}:${(spec.geo ?? 0) | 0}`;
  if (!_given.has(key) && _given.size >= 32) _given.delete(_given.keys().next().value);
  _given.set(key, deepFreeze(JSON.parse(JSON.stringify(spec))));
  return true;
}
/** Every given hall forgotten (out of the breach). */
export function egSpecForget() { _given.clear(); }

/** How often a course the solver refuses is laid again before the band's first two pieces stand alone (section 10.5). */
export const EG_RELAY_MAX = 8;
function layHall(seed, h, geo, attempt = 0, law = EG_SPEC) {
  const c = egCircleOfHall(h), slot = egSlotOfHall(h), plan = egCirclePlan(seed, c)[slot - 1];
  const kind = plan.kind, variant = plan.variant, twist = plan.twist, bnd = egBandOfHall(h);
  const r = sdRng(egSeed(seed, HALL_SALT + h + attempt * RELAY_SALT));
  const plain = attempt > EG_RELAY_MAX;   // the last resort: the band's first two pieces alone
  const gale = geo % 3, crumbling = Math.floor(geo / 3) % 3;
  const L6 = law >= EG_DECREE_LAW;   // AUDIT EG III: the span decrees on every span, a section a rank
  const X = 0;
  /** the hall's parts in cm, said in metres at the end */
  const P = { discs: [], bands: [], lanes: [], steps: [], islands: [], caves: [], rifts: [], vents: [], fl: [], spots: {}, deco: [], gate: null, foe: null, arrive: null, end: null, ring: null, walk: null, waystones: [], chamber: 0,
    // EG-FULL LAYER THREE: the fragments' law halves (net/egFragLaw.js) - each fragment's record, its hazards on the shared
    // clock, its ramps (support, never fight floors), its engines, alcoves, vignettes and lights; the Collapsing Tube; THE FORK
    frags: [], hazards: [], ramps: [], engines: [], alcoves: [], vignettes: [], lights: [], tube: null, fork: null };
  const disc = (x, z, rad, role, y = 0) => { const d = { x, y, z, r: rad, role }; P.discs.push(d); return d; };
  const band = (z0, z1, half, role, y = 0, x = X) => { const b = { x, y, z0, z1, halfW: half, role }; P.bands.push(b); return b; };
  const lane = (ax, az, bx, bz, half, role, y = 0) => { const l = { ax, az, bx, bz, hw: half, role, y }; P.lanes.push(l); return l; };
  const flD = (x, z, rad, y = 0) => P.fl.push({ t: 'd', x, z, r: rad, y });
  const flL = (ax, az, bx, bz, half, y = 0) => P.fl.push({ t: 'l', ax, az, bx, bz, hw: half, y });
  // EG-ZQ (section 9): A SPOT'S HEIGHT IS IN CENTIMETRES. Where a spot carries a `y` (a fragment's anchors, a balcony, the
  // Low Road's niche) it is the law's own centimetres, and the spec says it so: its `x` and `z` are said in metres below and
  // its `y` is not (Seed 1's Hall 22: Lurker spots at y -760 over floors at -7.6 m). Nothing reads it - every body's feet are
  // the fight ground's (net/egWalkGraph.js egFeetAt) - and saying it in metres is a spec law of its own (EG_SPEC, section 22),
  // the change of the first slice that reads it; until then a reader divides by 100.
  const spot = (role, x, z, extra = {}) => { (P.spots[role] ??= []).push({ x, z, ...extra }); };
  let edge = 0, y = 0, road = 0, kitNow = '', xRoad = 0;
  const pieces = plain ? EG_BAND_PIECES[bnd].slice(0, 2) : EG_BAND_PIECES[bnd];
  // EG6a - THE SPAN GENERATOR (net/egSpanLaw.js egSpanOf): every course of this hall, one a road, drawn off this hall's die
  // and laid by courseOf. The hall stands about its edge and tells it where the hall stands before each piece it asks for.
  const S = egSpanOf(seed, h, bnd, { r, sizes: EG_STEP, start: { x: X, y: 0, z: 0, r: PLATE_R }, checkR: ISLE_R });
  /** a step laid `gap` past the edge (its unused fields nought, one shape for every step - the Steps' law): its place */
  const step = (k, gap, o = {}) => { S.at(edge, y); const at = S.step(k, gap, { ...o, x: X + (o.x ?? xRoad), kit: kitNow }); edge = S.edge; return at; };
  const gap = () => S.gap();
  const island = (g = gap(), x = X) => { S.at(edge, y); const z = S.check(g); P.islands.push({ x, y, z, r: ISLE_R, road }); disc(x, z, ISLE_R, 'island', y); edge = S.edge; isleEdge = edge; return z; };
  /** LAW 6: the edge the last island left (a Gust section begun there stands on it - never a second island beside it) */
  let isleEdge = -1;
  /** a run of `n` steps of one piece (section 10.3 - every piece at the Steps' own timing, at every depth) */
  const run = (k, n) => { S.at(edge, y); S.run(k, n, X + xRoad, kitNow); edge = S.edge; y = S.y; };
  /** A fragment's law half laid into the hall (net/egFragLaw.js's plan, in its own frame about (x0, z0, y0)): its hazards,
   *  anchors, alcoves, vignettes and lights, every point moved into the hall's frame. The far floor's (`zB` on) stand at
   *  `yB`. */
  const lay = (Q, x0, z0, y0) => {
    const yAt = (zr) => y0 + (Q.cls === 'passage' && zr >= (Q.zB ?? Infinity) ? Q.yB ?? 0 : 0);
    const at = (q) => [x0 + q[0], z0 + q[1]];
    for (const h of Q.hazards) {
      const z1 = h.sh ? h.sh[1] : h.spots ? h.spots[0][1] : h.lanes ? h.lanes[0][1] : h.path ? h.path[1] : 0;
      const o = { kind: h.kind, i: P.hazards.length, x: x0, z: z0, y: (h.kind === 'mist' ? y0 : yAt(z1)) + (h.kind === 'mist' ? h.y : (h.y ?? 0)), period: h.period ?? 0, phase: h.phase ?? 0, w: h.w ?? 0, r: h.r ?? 0, ring: h.ring ?? 0, sh: null, spots: null, lanes: null, path: null };
      if (h.sh) o.sh = [x0 + h.sh[0], z0 + h.sh[1], x0 + h.sh[2], z0 + h.sh[3]];
      if (h.spots) o.spots = h.spots.map(at);
      if (h.lanes) o.lanes = h.lanes.map((q) => [x0 + q[0], z0 + q[1], x0 + q[2], z0 + q[3]]);
      if (h.path) o.path = [x0 + h.path[0], z0 + h.path[1], h.path[2], h.path[3]];
      P.hazards.push(o);
    }
    for (const [k, list] of Object.entries(Q.anchors ?? {})) for (const q of list) { const [ax, az] = at(q); spot(k, ax, az, { y: yAt(q[1]), road, f: P.frags.length - 1 }); }   // `f` its fragment (P.frags)
    for (const q of Q.alcoves ?? []) P.alcoves.push({ i: P.alcoves.length, x: x0 + q.x, z: z0 + q.z, y: y0 + (q.y ?? 0), seal: q.seal, side: q.side ?? 1, holds: q.holds });
    for (const q of Q.vignettes ?? []) P.vignettes.push({ t: q.t, x: x0 + q.x, z: z0 + q.z, y: y0 + (q.y ?? 0), yaw: q.yaw ?? 0 });
    for (const q of Q.lights ?? []) P.lights.push([x0 + q[0], y0 + q[1], z0 + q[2], q[3]]);
  };
  /** The band's passage kit for this hall (the hall's die - the band's library, section 11.2). */
  const passageKit = () => { const L = EG_PASSAGE_KITS[bnd]; return L[between(r, 0, L.length - 1)]; };
  /** A FRAGMENT'S PASSAGE (section 11): a tunnel of its kit over the course (net/egFragLaw.js egFragPassage - the
   *  Oblivion Caverns' lava tube, the Fallen Stacks, the Broken Colonnade, the Ossuary, the Mist Stair, the Gloam Thicket,
   *  the Forge Gut, the deep Caverns), its floor broken by a chasm crossed on its inner course; its floors its landings
   *  (fight floors - section 11.1), its hazards on the shared clock. `x` its offset across the hall (the Low Road's). */
  const cave = (kit = passageKit(), x = 0) => {
    const Q = egFragPassage(kit, r, { c, deep: bnd, law });
    const X0 = X + x, z0 = edge, zA = z0 + Q.zA, zB = z0 + Q.zB, z1 = z0 + Q.len, y0 = y, role = Q.open ? 'colonnade' : 'cave';
    band(z0, zA, Q.halfW, role, y, X0); flL(X0, z0, X0, zA, Q.halfW, y);
    edge = zA; kitNow = kit;
    for (const it of Q.course) { y += it.dy ?? 0; step(it.k, it.gap, { x: x + (it.x ?? 0), amp: it.amp, period: it.period, phase: it.phase, beat: it.beat != null ? z0 + it.beat : 0 }); }
    kitNow = '';
    band(zB, z1, Q.halfW, role, y, X0); flL(X0, zB, X0, z1, Q.halfW, y);
    P.caves.push({ x: X0, y: y0, yB: y, z0, z1, zA, zB, halfW: Q.halfW, height: Q.height, kit, open: Q.open, road });
    P.frags.push({ kit, cls: 'passage', name: Q.name, x: X0, y: y0, z0, z1, play: '', reverb: Q.reverb, road });
    lay(Q, X0, z0, y0);
    edge = z1;
  };
  /** EG-ZC - A SHAFT (sections 11.1-11.2): the band's way down (net/egFragLaw.js egFragShaft) - its rim and its foot still
   *  ground that is no fight floor (blows land on none of it), its flights, its Drop and the Slag Chute's crust its course;
   *  its walls the passages' (world/egHall.js - running down past its foot), marked `shaft`. */
  const shaft = (kit = EG_SHAFT_KITS[bnd][between(r, 0, EG_SHAFT_KITS[bnd].length - 1)]) => {
    const Q = egFragShaft(kit, r);
    const z0 = edge, zA = z0 + Q.zA, zB = z0 + Q.zB, z1 = z0 + Q.len, y0 = y;
    band(z0, zA, Q.halfW, 'cave', y);
    edge = zA; kitNow = kit;
    for (const it of Q.course) { y += it.dy ?? 0; step(it.k, it.gap, { x: it.x ?? 0, amp: it.amp, period: it.period, phase: it.phase, beat: it.beat != null ? z0 + it.beat : 0 }); }
    kitNow = '';
    band(zB, z1, Q.halfW, 'cave', y);
    P.caves.push({ x: X, y: y0, yB: y, z0, z1, zA, zB, halfW: Q.halfW, height: Q.height, kit, open: 0, road, shaft: 1 });
    P.frags.push({ kit, cls: 'shaft', name: Q.name, x: X, y: y0, z0, z1, play: '', reverb: Q.reverb, road });
    lay(Q, X, z0, y0);
    edge = z1;
  };
  /** A SET PIECE (section 11.3): the band's own passage on the shared clock, proven by the solver like any other - the
   *  Collapsing Tube a passage whose floor falls behind the company; the Sinking Stair's, the Moon Path's and the Forge
   *  Line's flights laid as the course. */
  const setPiece = (kind, short = false) => {
    const Q = egSetPiece(kind, r, { short });
    if (kind === 'tube') {
      const z0 = edge, z1 = z0 + Q.len;
      band(z0, z1, Q.halfW, 'tube', y); flL(X, z0, X, z1, Q.halfW, y);
      P.caves.push({ x: X, y, yB: y, z0, z1, zA: z1, zB: z1, halfW: Q.halfW, height: Q.height, kit: 'caverns', open: 0, road, tube: 1 });
      P.frags.push({ kit: 'caverns', cls: 'passage', name: Q.name, x: X, y, z0, z1, play: 'tube', reverb: 'cave', road });
      P.tube = { x: X, y, z0, z1, halfW: Q.halfW, start: Q.tube.start, mps: Q.tube.mps };
      P.lights.push([X, y + 160, z0 + 300, 'lava'], [X, y + 160, Math.floor((z0 + z1) / 2), 'lava'], [X, y + 160, z1 - 300, 'lava']);
      edge = z1;
      return;
    }
    const z0 = edge, y0 = y;
    kitNow = kind;
    for (const it of Q.course) {
      y += it.dy ?? 0;
      const s0 = step(it.k, it.gap, { x: it.x ?? 0, amp: it.amp, period: it.period, phase: it.phase, beat: it.beatRel != null ? z0 + it.beatRel : 0 });
      // the Forge Line's hammers: one over each conveyor's middle, told 1.4 s (the place's own - judged wherever it lands)
      if (it.hammer) { P.hazards.push({ kind: 'hammerline', i: P.hazards.length, x: X, z: s0.z, y, period: 0, phase: between(r, 0, 49) * 100, w: 0, r: 300, ring: 0, sh: null, spots: [[s0.x, s0.z]], lanes: null, path: null }); }
    }
    kitNow = '';
    P.frags.push({ kit: kind, cls: 'passage', name: Q.name, x: X, y: y0, z0, z1: edge, play: kind, reverb: kind === 'forgeline' ? 'cave' : 'quarry', road });
    for (const h of Q.hazards) P.hazards.push({ kind: h.kind, i: P.hazards.length, x: X, z: z0, y: y0 + h.y, period: 0, phase: h.phase ?? 0, w: 0, r: 0, ring: 0, sh: null, spots: null, lanes: null, path: null });
  };
  /** A chamber (section 11.4): a fight floor in walls - its kit's play (a second floor on its stairs, a chokepoint arch,
   *  its channels surging, an engine) and its signature (net/egFragLaw.js egFragChamber); `kit` null for the trials' own
   *  walled floors (the Athenaeum's, the Scriptorium's: never a fragment). */
  const chamberAt = (zc, R, kit = /** @type {string|null} */ (EG_CHAMBER_KITS[bnd][between(r, 0, EG_CHAMBER_KITS[bnd].length - 1)])) => {
    P.chamber = 1;
    if (!kit) { P.deco.push({ t: 'wall', x: X, z: zc, r: R + 150, h: 900, y }); return; }
    const Q = egFragChamber(kit, r, R);
    const rim = Q.floors.length ? R + 900 : R + 150;
    P.deco.push({ t: 'wall', x: X, z: zc, r: rim, h: kit === 'clanpit' ? 600 : 900, y, kit });
    for (const f of Q.floors) { disc(X + f.x, zc + f.z, f.r, 'balcony', y + f.y); flD(X + f.x, zc + f.z, f.r, y + f.y); spot('balcony', X + f.x, zc + f.z, { y: y + f.y }); }
    for (const q of Q.ramps) P.ramps.push({ ax: X + q.ax, az: zc + q.az, bx: X + q.bx, bz: zc + q.bz, hw: q.hw, y0: y + q.y0, y1: y + q.y1 });
    if (Q.arch) P.deco.push({ t: 'arch', x: X, z: zc + Q.arch.z, w: Q.arch.w, h: Q.arch.h, r: R, y });
    if (Q.engine) P.engines.push({ i: P.engines.length, kind: Q.engine.kind, x: X + Q.engine.x, z: zc + Q.engine.z, y });
    if (Q.horn) spot('horn', X, zc, { r: 600 });
    P.frags.push({ kit, cls: 'chamber', name: Q.name, x: X, y, z0: zc - R, z1: zc + R, play: Q.play, reverb: Q.reverb, road });
    lay(Q, X, zc, y);
  };
  /** The court disc of a fight hall, at z centre `zc`, radius R. */
  const court = (R, role = 'court') => { const zc = edge + 400 + R; band(edge - 50, edge + 450, BRIDGE_HALF, 'bridge', y); disc(X, zc, R, role, y); flD(X, zc, R, y); edge = zc + R; return zc; };
  const downToPlate = () => { if (y > 0) { island(); run('crumble', Math.max(2, Math.ceil(y / EG_STEP_DOWN_CM))); } };
  /** The span decrees' sections (section 14) - never dropped for room ("every span carries a gust"), at least two pieces
   *  each. AUDIT EG III - LAW 6 (EG_DECREE_LAW): each rank its own section - a Gust section on its island (on the road's own
   *  line, `xRoad` - the Low Road's too), a Crumble section laid straight on from the ground before it (no island of its own);
   *  rank I's of three pieces (room allowing, two at least), rank II's two of two each - the second Crumble section stands
   *  elsewhere on the road (crumbleTwo). */
  function decreeSections() {
    if (!L6) {
      if (gale > 0) { island(); run('gust', Math.max(2, Math.min(2 + gale, Math.floor((10200 - edge) / 560)))); }
      if (crumbling > 0) { if (crumbling < 2) island(); run('crumble', Math.max(2, Math.min(2 + crumbling, Math.floor((10200 - edge) / 560)))); }
      return;
    }
    for (let k = 0; k < gale; k++) { if (edge !== isleEdge) island(gap(), X + xRoad); run('gust', sectionOf(gale)); }
    if (crumbling > 0) run('crumble', sectionOf(crumbling));
  }
  /** LAW 6: a decree section's pieces at its decree's rank - rank I three (two at least, as the room past 102 m allows),
   *  rank II two (it lays two sections). */
  const sectionOf = (rank) => (rank >= 2 ? 2 : Math.max(2, Math.min(3, Math.floor((10200 - edge) / 560))));
  /** LAW 6: Crumbling Halls II's second Crumble section, laid straight on from the ground before it, apart from the first by
   *  the road between them (a run, an island, a passage). */
  const crumbleTwo = () => { if (L6 && crumbling >= 2) run('crumble', 2); };
  /**
   * THE FORK (section 11.4): the course forks at an island. THE HIGH ROAD stays over the void - harder (two sections, each
   * at the Steps' own timing), shorter, its cache of Reliquaries at its hardest point - and meets the end plate's height by
   * a Drop. THE LOW ROAD bridges across EG_LOW_X_CM and drops into the deep, through a passage of the band's kit, past its
   * Battlemage's niche (the one niche that heals - and a Memento niche), with fewer falls and more foes. Each road its own
   * course (the Steps' records carry their `road`), proven road by road; both end on the end plate, at the Low Road's height.
   */
  function fork(two, extra) {
    run(two[0], extra > 0 ? 2 : between(r, 3, 4));
    const zc = island(), yF = y, zF = edge;
    spot('fork', X, zc);
    // THE HIGH ROAD (road 0)
    road = EG_ROAD.high;
    run(two[1], 3);
    decreeSections();
    const zCache = island();
    spot('hcache', X, zCache);
    run(pieces[between(r, 0, pieces.length - 1)], extra > 0 ? 2 : 3);
    crumbleTwo();   // LAW 6: Crumbling Halls II's second section, before the High Road's Drop
    y = yF - EG_FORK_DROP_CM;
    step('drop', gap());
    const zHi = edge, yLow = y;
    // THE LOW ROAD (road 1): across, down its Drop, through its passage, past its niche - its own course, from its island
    road = EG_ROAD.low;
    const LX = X + EG_LOW_X_CM;
    S.road(road, { x: LX, y: yF, z: zc, r: ISLE_R });
    lane(X + ISLE_R - 50, zc, LX - ISLE_R + 50, zc, BRIDGE_HALF, 'bridge', yF);
    edge = zc - ISLE_R; y = yF;
    disc(LX, zc, ISLE_R, 'island', yF); P.islands.push({ x: LX, y: yF, z: zc, r: ISLE_R, road });
    edge = zc + ISLE_R;
    y = yLow;
    step('drop', gap(), { x: EG_LOW_X_CM });
    xRoad = EG_LOW_X_CM; crumbleTwo(); xRoad = 0;   // LAW 6: the Low Road's second Crumble section, off its Drop's landing
    cave(EG_PASSAGE_KITS[bnd][0], EG_LOW_X_CM);
    // the Battlemage's niche on a landing past the passage: heals 15% once a member, holds a shard each, takes a Memento
    const zN = edge + 400;
    band(edge, zN + 300, BRIDGE_HALF + 100, 'cave', y, LX); flL(LX, edge, LX, zN + 300, BRIDGE_HALF + 100, y);
    spot('lniche', LX + BRIDGE_HALF, zN, { y });
    spot('niche', LX + BRIDGE_HALF, zN);
    edge = zN + 300;
    for (const g of ['harrier', 'harrier']) spot('lowfoe', LX, zN - 600, { k: g });
    // fewer falls: still ground the rest of the way, then across to the end plate - LAW 6: the span decrees' sections in its
    // place (the Low Road is a span's road: it carries them as the High Road does)
    xRoad = EG_LOW_X_CM;
    if (L6 && extra > 0) decreeSections(); else run('still', 2);
    xRoad = 0;
    const zLo = edge;
    // the roads meet at the end plate (at the Low Road's height): a High Road that ends first is carried on by still
    // ground; a Low Road by its bridge across to the plate
    road = EG_ROAD.high;
    S.road(road);
    edge = zHi; y = yLow;
    while (edge < zLo) step('still', EG_GAP_MIN_CM);
    const zPlate = edge + gap() + PLATE_R;
    lane(LX, zLo, X + PLATE_R - 100, zPlate, BRIDGE_HALF, 'bridge', yLow);
    P.fork = { x: X, z: zF, lowX: LX, y: yF, yLow, plate: zPlate, hi: 0, lo: 0 };
    edge = zPlate - PLATE_R;
  }
  P.arrive = disc(X, 0, PLATE_R, 'arrive');
  edge = PLATE_R;

  if (kind === 'yard') {
    const R = between(r, 22, 26) * 100;
    const zc = court(R);
    if (c >= 2 && r() * 3 < 1) chamberAt(zc, R);
    const turn = between(r, -1, 1) * 5;
    if (variant === 'riftyard' || variant === 'wellmouth') {
      for (const deg of [60, 240, 120, 300, 90]) { const [x, z] = polar(X, zc, R - 300, deg + turn); P.rifts.push({ x, z }); }
      if (variant === 'wellmouth') for (let k = 0; k < 5; k++) for (const off of [-35, 0, 35]) { const [x, z] = polar(X, zc, R - 300, [60, 240, 120, 300, 90][k] + turn + off); spot('socket', x, z, { k }); }
    } else if (variant === 'wellspring') {
      const [gx, gz] = polar(X, zc, Math.floor(R / 3), 0);
      P.rifts.push({ x: gx, z: gz });
      for (const deg of [60, 180, 300]) { const [x, z] = polar(X, zc, R - 400, deg + turn); spot('anchor', x, z); }
    } else if (variant === 'muster') {
      for (const deg of [0, 120, 240]) { const [x, z] = polar(X, zc, R - 500, deg + turn); spot('rally', x, z); }
    } else if (variant === 'holdfast') {
      spot('relic', X, zc, { r: 600 });
      for (const deg of [60, 180, 300, 120, 240]) { const [x, z] = polar(X, zc, R - 300, deg + turn); P.rifts.push({ x, z }); }
    }
    band(edge - 50, edge + 600, BRIDGE_HALF, 'bridge', y);
    edge += 600;
  } else if (kind === 'span' || kind === 'brink') {
    const extra = gale + crumbling;
    const two = c <= 1 ? ['drift', 'beat'] : [pieces[between(r, 0, pieces.length - 1)], pieces[between(r, 0, pieces.length - 1)]];
    const set = plain ? null : egSetPieceOf(c, kind, bnd, egTubeCircle(seed));
    if (kind === 'brink') {
      // the hall tears loose from one realm into the next (section 8.9): the last band's passage, then the new band's set piece
      run('still', 2); island(); cave(EG_FRAG_KITS[Math.max(0, bnd - 1)]); island(between(r, 200, 260)); run(two[0], 3); island();
      if (set) setPiece(set); else cave(EG_FRAG_KITS[bnd]);
      island(between(r, 200, 260)); run(two[1], 2);
    } else if (c >= EG_FORK_FROM_C && !plain && !set) fork(two, extra);
    else {
      // the span decrees' sections take the room of the runs before them; a set piece takes most of the hall
      // LAW 6: under two ranks of the decrees their sections take more of the runs' room - two pieces a run, none with a set piece
      const runN = L6 && extra >= 2 ? 2 : 3;
      if (!(L6 && set && extra >= 2)) run(two[0], set ? 2 : extra > 0 ? runN : c <= 1 ? 6 : between(r, 4, 5));
      if (L6) { crumbleTwo(); island(); }   // LAW 6: Crumbling Halls II's second section, and no island taken for it
      else if (crumbling < 1 || set) island();
      if (set) { setPiece(set, extra > 0); island(between(r, 200, 260)); }
      else if (c <= 2 || r() < 0.5) { cave(); island(between(r, 200, 260)); }   // in circles 1 and 2 every span carries a passage (section 7)
      if (!(set && extra > 0)) run(two[1], set ? 2 : extra > 0 ? runN : c <= 1 ? 6 : between(r, 4, 5));
      decreeSections();
      if (c >= 3 && extra < 2 && edge < 9000 && !set) { island(); run(pieces[between(r, 0, pieces.length - 1)], between(r, 3, 4)); }
      if (twist === 'vault') { const [vx, vz] = [X + 900, edge - 300]; lane(X, edge - 300, vx, vz, BRIDGE_HALF, 'side', y); disc(vx, vz, 350, 'vault', y); spot('vault', vx, vz); }
    }
    if (!P.fork) { downToPlate(); edge += gap(); }   // THE FORK lays its own way onto the plate
  } else if (kind === 'proving') {
    // LAW 6: under the span decrees the first span runs short (four pieces, three under two decrees' ranks) and the second -
    // the one to the door - is the decrees' own, their sections in place of its run: the hall stays inside EG_HALL_LEN_MAX.
    // Crumbling Halls II's second Crumble section ends the first span, apart from the first by the court
    const extra = L6 ? gale + crumbling : 0;
    run(c <= 1 ? 'still' : pieces[between(r, 0, 1)], extra >= 2 ? 3 : extra > 0 ? 4 : between(r, 5, 7));
    if (extra > 0) crumbleTwo();
    const R = 1400, zc = edge + gap() + R;
    disc(X, zc, R, 'court', y); flD(X, zc, R, y);
    if (c >= 2 && r() * 3 < 1) chamberAt(zc, R);   // one proving court in three a chamber (section 11.4) - its play its own
    P.foe = { x: X, z: zc + 400 };
    for (const deg of [0, 120, 240]) { const [x, z] = polar(X, zc, 900, deg + 60); spot('standard', x, z); }
    edge = zc + R;
    if (twist === 'vault') { const [vx, vz] = [X - 900, zc]; lane(X - R, zc, vx - 350, vz, BRIDGE_HALF, 'side', y); disc(vx - 700, vz, 350, 'vault', y); spot('vault', vx - 700, vz); }
    if (extra > 0) decreeSections();   // LAW 6: the second span the decrees' (section 14 - "a Proving Walk's")
    else run(c <= 1 ? 'drift' : pieces[between(r, 0, 2)], between(r, 4, 6));
    downToPlate();
    edge += gap();
  } else if (kind === 'rampart') {
    const L = between(r, 9, 12) * 1000, half = 250;
    const w = band(edge - 50, edge + L, half, variant === 'forgebridge' ? 'belt' : 'walk');
    flL(X, edge - 50, X, edge + L, half);
    P.walk = { x: X, z0: w.z0, z1: w.z1, halfW: half };
    // bastions every 35-45 m, off its sides by turns: the back of the line's fight floors
    let side = r() < 0.5 ? -1 : 1;
    for (let z = edge + between(r, 30, 40) * 100; z < edge + L - 1500; z += between(r, 35, 45) * 100, side = -side) { disc(X + side * (half + 550), z, 600, 'bastion'); flD(X + side * (half + 550), z, 600); }
    // waystones every 30 m (a push off the edge returns a member to the nearest one behind)
    for (let z = edge + EG_WAYSTONE_EVERY_M * 100; z < edge + L; z += EG_WAYSTONE_EVERY_M * 100) P.waystones.push({ x: X, z });
    // vent lanes across it from 20 m in, every 16-22 m, each its own cycle: 1.0 s warned, 0.5 s erupting (none on the Gauntlet)
    if (variant !== 'gauntlet') for (let z = edge + 2000; z < edge + L - 1400; z += between(r, 16, 22) * 100) P.vents.push({ x: X, z, d: 400, halfW: half + 100, cycle: between(r, 40, 60) * 100, phase: between(r, 0, 39) * 100 });
    // caster pillars beside it, 10-18 m out, each reached by a short side span with its plate (six laid; the brain stands
    // as many as the company asks)
    for (let k = 0; k < 6; k++) {
      const s = k % 2 === 0 ? 1 : -1, z = edge + Math.floor(((k + 1) * L) / 7), out = between(r, 10, 18) * 100;
      disc(X + s * out, z, 300, 'pillar', 200);
      lane(X + s * half, z, X + s * (out - 300), z, 150, 'side');
      spot('pillar', X + s * out, z, { plate: [X + s * (half + 300), z] });
    }
    const zg = edge + L - 300;
    P.gate = { x: X, z: zg, halfW: half, bearers: [{ x: X - 150, z: zg - 350 }, { x: X + 150, z: zg - 350 }] };
    if (variant === 'winch') for (const s of [-1, 1]) { disc(X + s * (half + 400), zg - 600, 250, 'winch'); spot('winch', X + s * (half + 400), zg - 600); }
    edge += L;
  } else if (kind === 'athenaeum') {
    run(c <= 1 ? 'still' : pieces[between(r, 0, 1)], between(r, 3, 5));
    const R = 1600, zc = edge + gap() + R;
    disc(X, zc, R, 'court', y); flD(X, zc, R, y);
    chamberAt(zc, R, null);   // never a fragment in the Athenaeum: the lock is the hall (section 11.4)
    spot('orrery', X, zc);
    for (const deg of [30, 90, 150, 210, 270, 330]) { const [x, z] = polar(X, zc, 1100, deg); spot('stone', x, z); }
    edge = zc + R;
    run('still', 2);
    edge += gap();
  } else if (kind === 'deepway') {
    // four fragments end to end (section 8.8): a passage, a chamber, a shaft down, a passage
    cave();
    const R = 1600, zc = edge + 400 + R;
    band(edge - 50, edge + 450, BRIDGE_HALF, 'bridge', y);
    disc(X, zc, R, 'court', y); flD(X, zc, R, y); chamberAt(zc, R);
    const obj = between(r, 0, 2);
    spot('chamber', X, zc, { obj });
    if (obj === 0) for (const deg of [60, 180, 300]) { const [x, z] = polar(X, zc, R - 300, deg); P.rifts.push({ x, z }); }
    else if (obj === 1) P.foe = { x: X, z: zc + 400 };
    else spot('engine', X, zc);
    spot('niche', X + R - 200, zc);
    edge = zc + R;
    // the shaft down - or the Galleries' set piece (section 8.8's third fragment)
    band(edge - 50, edge + 300, BRIDGE_HALF, 'bridge', y);
    edge += 300;
    const set = plain ? null : egSetPieceOf(c, kind, bnd, egTubeCircle(seed));
    if (set) { setPiece(set); island(between(r, 200, 260)); }
    else if (law >= EG_SLAG_LAW) shaft();   // EG-ZC: a shaft of its band's kit - the Hollow Trunk, the Slag Chute
    else for (let q = 0; q < 3; q++) { y -= 150; step('ledge', 150, { x: (q % 2 ? 1 : -1) * 80 }); }   // the law before: down on three ledges
    cave();
    edge += gap();
  } else if (kind === 'scriptorium') {
    run('still', 3);
    const R = 1200, zc = edge + gap() + R;
    disc(X, zc, R, 'court', y); chamberAt(zc, R, null);
    spot('niche', X, zc);
    edge = zc + R;
    run('still', 2);
    edge += gap();
  } else {
    // THE COURT: a short approach of the band's first two pieces, and the lord's own ground
    const lord = egBossOf(seed, c);
    run(c <= 1 ? 'still' : pieces[between(r, 0, 1)], between(r, 3, 5));
    edge += gap();
    layGround(EG_LORDS[lord].ground);
  }
  /** THE LORDS' GROUNDS (section 13.3) - each lord's own, laid past the approach's edge. */
  function layGround(g) {
    const flat = (R) => { const zc = edge + R; disc(X, zc, R, 'court', y); flD(X, zc, R, y); P.foe = { x: X, z: zc }; P.ring = { x: X, z: zc, r: R - 100 }; edge = zc + R; return zc; };
    if (g === 'isles') {
      // Grath's magma chamber: three basalt islands (r 11) joined by bridges 6 m wide over the magma
      const zc = edge + 3100, isles = [[X, zc - 2000], polar(X, zc, 2000, 60), polar(X, zc, 2000, 300)];
      for (const [x, z] of isles) { disc(x, z, 1100, 'isle', y); flD(x, z, 1100, y); spot('isle', x, z); }
      for (const [a, b] of [[0, 1], [1, 2], [2, 0]]) {
        const [ax, az] = isles[a], [bx, bz] = isles[b], d = lawIsqrt((bx - ax) * (bx - ax) + (bz - az) * (bz - az));
        const ox = Math.trunc(((bx - ax) * 1000) / d), oz = Math.trunc(((bz - az) * 1000) / d);
        const p0 = [ax + ox, az + oz], p1 = [bx - ox, bz - oz];
        lane(p0[0], p0[1], p1[0], p1[1], 300, 'bridge', y); flL(p0[0], p0[1], p1[0], p1[1], 300, y); spot('bridge', p0[0], p0[1], { bx: p1[0], bz: p1[1] });
      }
      P.deco.push({ t: 'magma', x: X, z: zc, r: 3600, y: y - 150 });
      P.foe = { x: isles[1][0], z: isles[1][1] }; P.ring = { x: isles[0][0], z: isles[0][1], r: 1000 };
      edge = zc + 2000 + 1100;
    } else if (g === 'disc18' || g === 'disc20' || g === 'disc22') {
      const R = g === 'disc18' ? 1800 : g === 'disc20' ? 2000 : 2200, zc = flat(R);
      if (g === 'disc18') {
        for (const deg of [45, 135, 225, 315]) { const [x, z] = polar(X, zc, R - 150, deg); spot('rune', x, z); }
        for (const deg of [0, 90, 180, 270]) { const [x, z] = polar(X, zc, 1300, deg); spot('haven', x, z); }
      }
      if (g === 'disc20') for (const deg of [0, 120, 240]) { const [x, z] = polar(X, zc, 900, deg + 30); spot('brazier', x, z); }
    } else if (g === 'rotunda') {
      const R = 2400, zc = flat(R);
      for (const deg of [0, 120, 240]) { const [x, z] = polar(X, zc, R + 300, deg); disc(x, z, 500, 'balcony', y + 400); flD(x, z, 500, y + 400); spot('balcony', x, z); }
      P.deco.push({ t: 'wall', x: X, z: zc, r: R + 900, h: 1200, y });
      edge = zc + R + 900;
    } else if (g === 'crypt') {
      const R = 1400, zc = flat(R);
      for (const deg of [45, 135, 225, 315]) { const [x, z] = polar(X, zc, R - 150, deg); spot('gem', x, z); }
      P.deco.push({ t: 'wall', x: X, z: zc, r: R + 150, h: 800, y });
    } else if (g === 'twins') {
      const zA = edge + 1400, zB = zA + 1400 + 2400 + 1400;
      disc(X, zA, 1400, 'court', y); flD(X, zA, 1400, y); disc(X, zB, 1400, 'court', y); flD(X, zB, 1400, y);
      band(zA + 1400, zB - 1400, 300, 'bridge', y); flL(X, zA + 1400, X, zB - 1400, 300, y);
      spot('court', X, zA); spot('court', X, zB);
      P.foe = { x: X, z: zA + 500 }; P.ring = { x: X, z: zA, r: 1300 };
      edge = zB + 1400;
    } else if (g === 'soulbridge') {
      const zA = edge + 1400, zB = zA + 1400 + 3000 + 1400;
      disc(X, zA, 1400, 'court', y); flD(X, zA, 1400, y); disc(X, zB, 1400, 'court', y); flD(X, zB, 1400, y);
      band(zA + 1400, zB - 1400, 300, 'bridge', y); flL(X, zA + 1400, X, zB - 1400, 300, y);
      spot('court', X, zA); spot('court', X, zB);
      P.foe = { x: X, z: (zA + zB) / 2 }; P.ring = { x: X, z: zA, r: 1300 };
      edge = zB + 1400;
    } else if (g === 'glade') {
      const R = 2200, zc = flat(R);
      for (const deg of [0, 120, 240]) { const [x, z] = polar(X, zc, R - 200, deg); spot('anchor', x, z); }
      for (const deg of [30, 90, 150, 210, 270, 330]) { const [x, z] = polar(X, zc, R + 100, deg); spot('brazier', x, z); }
    } else if (g === 'vault') {
      const R = 2200, zc = flat(R);
      spot('shafts', X, zc, { r: 1200 });
      P.deco.push({ t: 'wall', x: X, z: zc, r: R + 150, h: 1100, y });
    } else if (g === 'forge') {
      // the Forge Gut's long chamber: 55 m, the Colossus's route along it
      const z0 = edge, z1 = z0 + 5500;   // EG-FULL LAYER THREE: from the approach's own gap (the solver now jumps the real gap - 3 m more was unreachable)
      band(z0, z1, 1000, 'court', y); flL(X, z0, X, z1, 1000, y);
      P.foe = { x: X, z: z0 + 800 }; P.ring = { x: X, z: z0 + 600, r: 900 };
      spot('route', X, z0 + 800, { z1: z1 - 800 });
      P.deco.push({ t: 'hall', x: X, z0, z1, hw: 1150, h: 1200, y });
      edge = z1;
    } else if (g === 'perches') {
      const R = 2200, zc = flat(R);
      for (const deg of [0, 120, 240]) {
        const [px, pz] = polar(X, zc, R + 800, deg), [ex, ez] = polar(X, zc, R - 50, deg), [fx, fz] = polar(X, zc, R + 450, deg);
        disc(px, pz, 350, 'perch', y + 300); flD(px, pz, 350, y + 300); lane(ex, ez, fx, fz, 200, 'side', y); flL(ex, ez, fx, fz, 200, y);
        spot('pillar', px, pz);
      }
      edge = zc + R + 1200;
    } else {
      const R = 2200, zc = flat(R);
      P.deco.push({ t: 'tiers', x: X, z: zc, r: R + 200, h: 600, y });
      spot('pit', X, zc);
    }
  }
  if (!['court'].includes(kind)) { const z = edge + PLATE_R; P.end = disc(X, z, PLATE_R, 'end', y); edge = z + PLATE_R; }
  if (twist === 'sutler') spot('sutler', X + 300, 0);
  if (twist === 'bargain') spot('shrine', X - 300, 0);
  if (twist === 'captive') { const f0 = P.fl[0]; if (f0?.t === 'd') for (const deg of [0, 120, 240]) { const [x, z] = polar(f0.x, f0.z, Math.floor(f0.r / 2), deg); spot('chain', x, z); } else spot('chain', X, Math.floor(edge / 2)); }
  if (slot === 3 || kind === 'scriptorium') spot('niche', X - 350, 0);
  // the cache on every trial hall's end plate (section 17.1)
  if (P.end && kind !== 'brink') spot('cache', P.end.x, P.end.z - 200);
  // EG6a: THE HALL'S STEPS ARE ITS COURSES, laid by courseOf (net/egSpanLaw.js) - one a road, in the hall's one count
  P.steps = S.lay();
  // THE GROUND AFTER EACH RUN (net/egSpanLaw.js egSpanPairs): each step no step of its road follows knows how far on its
  // road's next still ground begins - an island, a plate, a passage's floor - so the solver jumps the real gap
  for (const s of P.steps) {
    const far = s.z + s.d / 2, next = P.steps.find((q) => q.road === s.road && q.i > s.i);
    if (next && Math.abs(next.z - next.d / 2 - next.gap - far) < 1) continue;
    let best = Infinity;
    for (const d of P.discs) if (Math.abs(d.x - s.x) <= d.r + s.w && d.z - d.r >= far - 1) best = Math.min(best, d.z - d.r - far);
    for (const b of P.bands) if (Math.abs(b.x - s.x) <= b.halfW + s.w && b.z0 >= far - 1) best = Math.min(best, b.z0 - far);
    for (const l of P.lanes) { const lz = Math.min(l.az, l.bz); if (Math.abs(l.ax - s.x) <= l.hw + s.w && lz >= far - 1) best = Math.min(best, lz - far); }
    s.after = Number.isFinite(best) ? Math.max(0, best) : 0;
  }
  // the fight's bounding disc (the telegraph pass's floor, the wire's bound)
  let fight = null;
  if (P.fl.length) {
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    for (const f of P.fl) {
      if (f.t === 'd') { x0 = Math.min(x0, f.x - f.r); x1 = Math.max(x1, f.x + f.r); z0 = Math.min(z0, f.z - f.r); z1 = Math.max(z1, f.z + f.r); }
      else { x0 = Math.min(x0, f.ax - f.hw, f.bx - f.hw); x1 = Math.max(x1, f.ax + f.hw, f.bx + f.hw); z0 = Math.min(z0, f.az, f.bz); z1 = Math.max(z1, f.az, f.bz); }
    }
    const cx = Math.round((x0 + x1) / 2), cz = Math.round((z0 + z1) / 2);
    fight = { x: cx, y: 0, z: cz, r: Math.ceil((lawIsqrt((x1 - x0) * (x1 - x0) + (z1 - z0) * (z1 - z0)) + 1) / 2), role: kind === 'rampart' ? 'walk' : 'court' };
  }
  // said in metres
  const pt = (q) => (q ? { ...q, x: m(q.x), y: m(q.y ?? 0), z: m(q.z), ...(q.r != null ? { r: m(q.r) } : {}) } : null);
  const spots = {};   // EG-ZQ: a spot's `y` stays in centimetres (the law's - see `spot`, above)
  for (const [k, v] of Object.entries(P.spots)) spots[k] = v.map((q) => { const o = { ...q, x: m(q.x), z: m(q.z) }; if (q.r != null) o.r = m(q.r); if (q.plate) o.plate = [m(q.plate[0]), m(q.plate[1])]; if (q.bx != null) { o.bx = m(q.bx); o.bz = m(q.bz); } if (q.z1 != null) o.z1 = m(q.z1); return o; });
  const lord = kind === 'court' ? egBossOf(seed, c) : null;
  return {
    v: law, seed, h, c, slot, kind, variant, twist, band: bnd, geo, lord,
    champ: kind === 'proving' || (kind === 'deepway' && P.foe) ? EG_CHAMPIONS[bnd].key : null,
    name: kind === 'court' ? `${EG_LORDS[lord].name}, ${EG_LORDS[lord].epithet}` : EG_HALL_NAMES[variant ?? kind], objective: EG_OBJECTIVES[variant ?? kind],
    x0: (slot - 1) * EG_HALL_PITCH, len: m(edge),
    arrive: pt(P.arrive), end: pt(P.end),
    discs: P.discs.map(pt),
    bands: P.bands.map((b) => ({ x: m(b.x), y: m(b.y), z0: m(b.z0), z1: m(b.z1), halfW: m(b.halfW), role: b.role })),
    lanes: P.lanes.map((l) => ({ ax: m(l.ax), az: m(l.az), bx: m(l.bx), bz: m(l.bz), hw: m(l.hw), role: l.role, y: m(l.y) })),
    steps: P.steps.map((s) => ({ i: s.i, kind: s.kind, span: s.span, x: m(s.x), y: m(s.y), z: m(s.z), w: m(s.w), d: m(s.d), amp: m(s.amp), period: s.period / 1000, phase: s.phase / 1000, beat: s.kind === 'moon' ? m(s.beat) : s.beat / 1000, gap: m(s.gap), road: s.road, kit: s.kit, after: m(s.after) })),
    islands: P.islands.map(pt),
    caves: P.caves.map((q) => ({ x: m(q.x), y: m(q.y), yB: m(q.yB), z0: m(q.z0), z1: m(q.z1), zA: m(q.zA), zB: m(q.zB), halfW: m(q.halfW), height: m(q.height), kit: q.kit, open: q.open, road: q.road, tube: q.tube ?? 0, ...(q.shaft ? { shaft: 1 } : {}) })),   // EG-ZC: a shaft's walls marked
    // EG-FULL LAYER THREE: the fragments (net/egFragLaw.js) - metres and seconds, the hall's frame
    frags: P.frags.map((q) => ({ ...q, x: m(q.x), y: m(q.y), z0: m(q.z0), z1: m(q.z1) })),
    hazards: P.hazards.map((q) => ({ kind: q.kind, i: q.i, x: m(q.x), z: m(q.z), y: m(q.y), period: q.period / 1000, phase: q.phase / 1000, w: m(q.w), r: m(q.r), ring: m(q.ring),
      sh: q.sh ? q.sh.map(m) : null, spots: q.spots ? q.spots.map((p) => p.map(m)) : null, lanes: q.lanes ? q.lanes.map((p) => p.map(m)) : null, path: q.path ? q.path.map(m) : null })),
    ramps: P.ramps.map((q) => ({ ax: m(q.ax), az: m(q.az), bx: m(q.bx), bz: m(q.bz), hw: m(q.hw), y0: m(q.y0), y1: m(q.y1) })),
    engines: P.engines.map((q) => ({ i: q.i, kind: q.kind, x: m(q.x), z: m(q.z), y: m(q.y) })),
    alcoves: P.alcoves.map((q) => ({ i: q.i, x: m(q.x), z: m(q.z), y: m(q.y), seal: q.seal, side: q.side, holds: q.holds })),
    vignettes: P.vignettes.map((q) => ({ t: q.t, x: m(q.x), z: m(q.z), y: m(q.y), yaw: q.yaw })),
    lights: P.lights.map((q) => [m(q[0]), m(q[1]), m(q[2]), q[3]]),
    tube: P.tube ? { x: m(P.tube.x), y: m(P.tube.y), z0: m(P.tube.z0), z1: m(P.tube.z1), halfW: m(P.tube.halfW), start: P.tube.start / 1000, mps: P.tube.mps } : null,
    fork: P.fork ? { x: m(P.fork.x), z: m(P.fork.z), lowX: m(P.fork.lowX), y: m(P.fork.y), yLow: m(P.fork.yLow), plate: m(P.fork.plate), hi: 0, lo: 0 } : null,
    fl: P.fl.map((f) => (f.t === 'd' ? { t: 'd', x: m(f.x), z: m(f.z), r: m(f.r), y: m(f.y) } : { t: 'l', ax: m(f.ax), az: m(f.az), bx: m(f.bx), bz: m(f.bz), hw: m(f.hw), y: m(f.y) })),
    fight: pt(fight), foe: P.foe ? { x: m(P.foe.x), z: m(P.foe.z) } : null, ring: pt(P.ring), spots, chamber: P.chamber,
    deco: P.deco.map((d) => Object.fromEntries(Object.entries(d).map(([k, v]) => [k, typeof v === 'number' ? m(v) : v]))),
    rifts: P.rifts.map((q) => ({ x: m(q.x), z: m(q.z) })),
    vents: P.vents.map((q) => ({ x: m(q.x), z: m(q.z), d: m(q.d), halfW: m(q.halfW), cycle: q.cycle, phase: q.phase })),
    gate: P.gate ? { x: m(P.gate.x), z: m(P.gate.z), halfW: m(P.gate.halfW), bearers: P.gate.bearers.map((q) => ({ x: m(q.x), z: m(q.z) })) } : null,
    walk: P.walk ? { x: m(P.walk.x), z0: m(P.walk.z0), z1: m(P.walk.z1), halfW: m(P.walk.halfW) } : null,
    waystones: P.waystones.map((q) => ({ x: m(q.x), z: m(q.z) })),
  };
}

/** THE COLLAPSING TUBE's circle (section 11.3 - the Galleries' set piece): the first circle from the third whose
 *  traversal is a span. */
export function egTubeCircle(seed) {
  for (let c = 3; c <= 5; c++) if (egCirclePlan(seed, c)[1]?.kind === 'span') return c;
  return 0;
}
/** A circle's five specs, in slot order (`geo` its span decrees; EG-ZC: `law` the spec law, this build's unless named). */
export const egCircleSpecs = (seed, c, geo = 0, law = EG_SPEC) => [1, 2, 3, 4, 5].map((s) => egHallOf(seed, egFirstHallOf(c) + s - 1, geo, law));

/** The spec's digest (section 9's `sd`): FNV-1a over its JSON - one seed, one digest, on every machine. */
export function egSpecDigest(spec) {
  const s = JSON.stringify(spec);
  let hsh = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { hsh ^= s.charCodeAt(i); hsh = Math.imul(hsh, 0x01000193); }
  return hsh >>> 0;
}

// ── where a body stands (the relay's judgements and the motor's edge) ─────────────────────────────────────
const segD = (px, pz, ax, az, bx, bz) => {
  const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz;
  const t = L > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / L)) : 0;
  return { d: Math.hypot(px - (ax + dx * t), pz - (az + dz * t)), x: ax + dx * t, z: az + dz * t };
};
/** Is (x, z) (the hall's own frame, as every helper below) on one of the spec's floors - its discs, its bands, its lanes,
 *  its steps at rest - within `pad` m? */
export function egOnFloor(spec, x, z, pad = 0) {
  for (const d of spec.discs) if (Math.hypot(x - d.x, z - d.z) <= d.r + pad) return true;
  for (const b of spec.bands) if (z >= b.z0 - pad && z <= b.z1 + pad && Math.abs(x - b.x) <= b.halfW + pad) return true;
  for (const l of spec.lanes ?? []) if (segD(x, z, l.ax, l.az, l.bx, l.bz).d <= l.hw + pad) return true;
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
/** Is (x, z) on THE FIGHT FLOOR (its discs and lanes - section 11.7), `pad` m about? */
export function egOnFight(spec, x, z, pad = 0) {
  for (const f of spec.fl ?? []) {
    if (f.t === 'd' ? Math.hypot(x - f.x, z - f.z) <= f.r + pad : segD(x, z, f.ax, f.az, f.bx, f.bz).d <= f.hw + pad) return true;
  }
  return false;
}
/** The fight floor's piece under (x, z) (pad m about), or null. */
export const egFightPieceAt = (spec, x, z, pad = 0) => (spec.fl ?? []).find((f) => (f.t === 'd' ? Math.hypot(x - f.x, z - f.z) <= f.r + pad : segD(x, z, f.ax, f.az, f.bx, f.bz).d <= f.hw + pad)) ?? null;
/** The nearest point of the fight floor to (x, z), `inset` m inside its edge (the legion and the lord keep to it). */
export function egKeepOnFight(spec, x, z, inset = 0) {
  if (!spec.fl?.length) return [x, z];
  if (egOnFight(spec, x, z, -inset)) return [x, z];
  let best = null, bd = Infinity;
  for (const f of spec.fl) {
    let px, pz, d;
    if (f.t === 'd') {
      const dx = x - f.x, dz = z - f.z, dd = Math.hypot(dx, dz), R = Math.max(0, f.r - inset);
      px = dd <= R ? x : f.x + (dx / (dd || 1)) * R; pz = dd <= R ? z : f.z + (dz / (dd || 1)) * R; d = Math.max(0, dd - R);
    } else {
      const s = segD(x, z, f.ax, f.az, f.bx, f.bz), W = Math.max(0, f.hw - inset);
      if (s.d <= W) { px = x; pz = z; d = 0; } else { px = s.x + ((x - s.x) / (s.d || 1)) * W; pz = s.z + ((z - s.z) / (s.d || 1)) * W; d = s.d - W; }
    }
    if (d < bd) { bd = d; best = [px, pz]; }
  }
  return best ?? [x, z];
}
/** Hall `spec`'s fight floor as a test (net/egFloor.js egUnionHolds' `onFloor` - EG-H1 moved it there). */
export const egFloorTest = (spec) => (x, z) => egOnFight(spec, x, z);
/** A FALLING WALL's fallen edge at `now` (section 8.3): the walkway behind it is gone - 20 s after the wake, 1.5 m/s. */
export const egWallFallenZ = (spec, wokeAt, now) => (spec.variant === 'fallingwall' && spec.walk && wokeAt > 0 ? spec.walk.z0 + Math.max(0, now - wokeAt - EG_WALL_FALL_AFTER_MS) * (EG_WALL_FALL_MPS / 1000) : -Infinity);
/** The waystone a member pushed off the walkway returns to: the nearest behind (z) - else the arrival plate. */
export const egWaystoneFor = (spec, z) => { let w = null; for (const s of spec.waystones ?? []) if (s.z <= z && (!w || s.z > w.z)) w = s; return w; };

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
  // ── EG-F (2026-10-12; section 5): the key's refusals EG-PLAY's arm lacked (3, 4 and 8, in the page's order), the start
  // window's words, the arch's plaque - scenes/egArch.js, ui/egStartWindow.js, scenes/egCall.js ──
  holds: Object.freeze({ busy: 'You cannot turn the key right now.', duel: 'You cannot open a breach in a duel.', siege: 'The wards of this battle hold the key cold.',
    enemies: 'You cannot open a breach with enemies nearby.', journey: 'You cannot open a breach while you travel.' }),
  water: 'The key will not turn in the water.',
  aboard: 'The key will not turn aboard a boat.',
  within: (place) => `Not within ${place}.`,
  room: 'There is no room for it here.',
  startHall: 'Hall 1',
  startRedoubt: (w, band) => `Redoubt ${w} - ${band}`,
  stake: (n) => `Weir Keys: ${n} - one will be staked.`,
  without: (names) => `Go without ${names}?`,
  questDue: 'A quest falls due before the breach can close.',
  notStart: (w) => `You have not taken Redoubt ${w} this season.`,
  wager: (names) => (names ? `The Wager: ${names}` : 'The Wager: none'),
  wagerDone: 'Done',
  wagerFamily: 'The Wager takes one decree of a family.',
  wagerFull: 'The Wager takes three decrees at most.',
  plaqueSub: 'The Battlespire',
  company: (opener) => `${opener}'s company`,
  sight: 'an Elite Breach',
  // ── end EG-F ──
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
