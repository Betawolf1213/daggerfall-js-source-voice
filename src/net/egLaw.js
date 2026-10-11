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
// Not a DFU member. Ledger A (ELITE-GATES).
import { sdSeed, sdRng } from './sdBrain.js';

/** The spec law's number - a change to any draw below changes it (and the relay's version with it). */
export const EG_SPEC = 2;
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
/** EVERY DECREE: its number, its family, its name, its line. */
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
  Object.freeze({ id: 15, key: 'colossal', fam: 'lord', name: 'Colossal', line: 'The lord stands larger.' }),
  Object.freeze({ id: 16, key: 'unyielding', fam: 'lord', name: 'Unyielding', line: 'The lord\'s ward holds longer.' }),
  Object.freeze({ id: 17, key: 'vengeful', fam: 'lord', name: 'Vengeful', line: 'The lord strikes harder.' }),
  Object.freeze({ id: 18, key: 'grudge', fam: 'lord', name: 'Grudge-Bearer', line: 'The lord never forgets.' }),
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

/** Halls stand this far apart across x in a circle's level (m) - far past the fog, so a hall never sees the next. */
export const EG_HALL_PITCH = 500;

/** The breach's seed for a draw (the Hour's mix - net/sdBrain.js sdSeed). */
export const egSeed = (seed, salt) => sdSeed(seed >>> 0, salt >>> 0);
const CIRCLE_SALT = 0x0e6c1c;
const HALL_SALT = 0x0e6a11;
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
const between = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const m = (cm) => cm / 100;
/** The span's pieces, the Steps' sizes and clocks (world/sdSteps.js - pinned equal), in cm and ms. */
export const EG_STEP = Object.freeze({
  drift: Object.freeze({ w: 300, d: 240 }), beat: Object.freeze({ w: 300, d: 260 }), riser: Object.freeze({ w: 300, d: 260 }),
  crumble: Object.freeze({ w: 260, d: 260 }), still: Object.freeze({ w: 300, d: 260 }), ledge: Object.freeze({ w: 240, d: 200 }),
  gust: Object.freeze({ w: 300, d: 260 }), rail: Object.freeze({ w: 300, d: 300 }), pend: Object.freeze({ w: 300, d: 260 }),
  vent: Object.freeze({ w: 420, d: 420 }), drop: Object.freeze({ w: 600, d: 600 }),
});
/** Which pieces each band unlocks (section 10.3) - the Galleries' five, the Cairn's Gust and Rail, the Shade's Pendulum,
 *  the Wellhead's Vent. */
export const EG_BAND_PIECES = Object.freeze([
  Object.freeze(['drift', 'beat', 'riser', 'crumble', 'drop']),
  Object.freeze(['drift', 'beat', 'riser', 'crumble', 'drop', 'gust', 'rail']),
  Object.freeze(['drift', 'beat', 'riser', 'crumble', 'drop', 'gust', 'rail', 'pend']),
  Object.freeze(['drift', 'beat', 'riser', 'crumble', 'drop', 'gust', 'rail', 'pend', 'vent']),
]);
export const EG_RISER_CM = 230;
export const EG_BEAT_HALF_MS = 1800;
export const EG_GAP_MIN_CM = 240;
export const EG_GAP_MAX_CM = 320;
/** A step down within a run is under a metre (THE ENVELOPE, section 10.4); a Drop at most 4.5 m. */
export const EG_STEP_DOWN_CM = 95;
export const EG_DROP_CM = 450;
/** No hall runs longer than this (m): its fight's every point stays inside the gate's wire bound (net/wire.js
 *  GATE_COURT_BOUND, 160 - pinned under it). */
export const EG_HALL_LEN_MAX = 158;
/** A plate's radius, an island's, a bridge's half-width (cm). */
const PLATE_R = 500, ISLE_R = 300, BRIDGE_HALF = 200;
/** The Oblivion Caverns passage (section 11's first fragment): its floor's half-width, its length, the chasm in it and
 *  the ledges that cross it, its height (cm). */
export const EG_CAVE = Object.freeze({ halfW: 300, len: 2800, chasm: 1000, height: 520 });
/** The fragment kits by band (section 11.2): the passage each band's spans and Deepways run through. */
export const EG_FRAG_KITS = Object.freeze(['caverns', 'ossuary', 'gloam', 'forge']);
/** The Rampart's waystones (m apart), a Falling Wall's start and pace, a Forge Bridge's belt (section 8.3). */
export const EG_WAYSTONE_EVERY_M = 30;
export const EG_WALL_FALL_AFTER_MS = 20_000;
export const EG_WALL_FALL_MPS = 1.5;
export const EG_BELT_MPS = 1.0;

/**
 * HALL h's SPEC (`geo` the circle's span decrees - net/egLaw.js egGeoOf): its kind, variant, twist, band, circle, slot,
 * name and objective; its geometry in its own frame (metres): the plates (`arrive`, `end`), the walkable discs and bands
 * and lanes (`discs`, `bands`, `lanes`), a span's steps and islands (the Steps' record: `{i, kind, span, x, y, z, w, d,
 * amp, period, phase, beat}`, period and phase in seconds), the fragments' passages (`caves`, each its band's kit), and
 * the trial's own: THE FIGHT FLOOR (`fl` - discs `{t:'d', x, z, r, y}` and lanes `{t:'l', ax, az, bx, bz, hw, y}`, and its
 * bounding disc `fight`), its spots by role (`spots` - rifts, anchors, rally points, the relic, runes, gems, pillars,
 * plates, balconies, braziers...), a Rampart's vents and gate and walkway and waystones, a champion's or a lord's spot
 * (`foe`), the Court's wake ring (`ring`) and its lord (`lord`). Frozen, and cached.
 * @param {number} seed @param {number} h @param {number} [geo]
 */
export function egHallOf(seed, h, geo = 0) {
  const key = `${seed >>> 0}:${h}:${geo | 0}`;
  const had = _specs.get(key);
  if (had) return had;
  const spec = deepFreeze(layHall(seed >>> 0, h, geo | 0));
  if (_specs.size >= 48) _specs.delete(_specs.keys().next().value);
  _specs.set(key, spec);
  return spec;
}
const _specs = new Map();
const deepFreeze = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) deepFreeze(v); } return o; };

function layHall(seed, h, geo) {
  const c = egCircleOfHall(h), slot = egSlotOfHall(h), plan = egCirclePlan(seed, c)[slot - 1];
  const kind = plan.kind, variant = plan.variant, twist = plan.twist, bnd = egBandOfHall(h);
  const r = sdRng(egSeed(seed, HALL_SALT + h));
  const gale = geo % 3, crumbling = Math.floor(geo / 3) % 3;
  const X = 0;
  /** the hall's parts in cm, said in metres at the end */
  const P = { discs: [], bands: [], lanes: [], steps: [], islands: [], caves: [], rifts: [], vents: [], fl: [], spots: {}, deco: [], gate: null, foe: null, arrive: null, end: null, ring: null, walk: null, waystones: [], chamber: 0 };
  const disc = (x, z, rad, role, y = 0) => { const d = { x, y, z, r: rad, role }; P.discs.push(d); return d; };
  const band = (z0, z1, half, role, y = 0, x = X) => { const b = { x, y, z0, z1, halfW: half, role }; P.bands.push(b); return b; };
  const lane = (ax, az, bx, bz, half, role, y = 0) => { const l = { ax, az, bx, bz, hw: half, role, y }; P.lanes.push(l); return l; };
  const flD = (x, z, rad, y = 0) => P.fl.push({ t: 'd', x, z, r: rad, y });
  const flL = (ax, az, bx, bz, half, y = 0) => P.fl.push({ t: 'l', ax, az, bx, bz, hw: half, y });
  const spot = (role, x, z, extra = {}) => { (P.spots[role] ??= []).push({ x, z, ...extra }); };
  let edge = 0, y = 0, span = 0, risen = false;
  const pieces = EG_BAND_PIECES[bnd];
  /** a step laid `gap` past the edge (its unused fields nought, one shape for every step - the Steps' law) */
  const step = (k, gap, o = {}) => {
    const S = EG_STEP[k];
    const z = edge + gap + S.d / 2;
    P.steps.push({ i: P.steps.length, kind: k, span, x: X + (o.x ?? 0), y, z, w: S.w, d: S.d, amp: o.amp ?? 0, period: o.period ?? 0, phase: o.phase ?? 0, beat: o.beat ?? 0 });
    edge = z + S.d / 2;
  };
  const gap = () => between(r, EG_GAP_MIN_CM, EG_GAP_MAX_CM);
  const island = (g = gap()) => { const z = edge + g + ISLE_R; P.islands.push({ x: X, y, z, r: ISLE_R }); disc(X, z, ISLE_R, 'island', y); edge = z + ISLE_R; span++; };
  /** a run of `n` steps of one piece (section 10.3 - every piece at the Steps' own timing, at every depth) */
  const run = (k, n) => {
    if (k === 'drift') for (let q = 0; q < n; q++) step('drift', gap(), { amp: between(r, 100, 200), period: between(r, 40, 70) * 100, phase: q * 900 });
    else if (k === 'beat' || k === 'riser') {
      const riserAt = n >= 5 && !risen ? between(r, 2, n - 2) : -1;   // one riser a hall: the climb down after it stays short
      let b = 0;
      for (let q = 0; q < n; q++) {
        if (q === riserAt) { y += EG_RISER_CM; risen = true; step('riser', 0); continue; }
        step('beat', gap(), { beat: (b++ % 2) * EG_BEAT_HALF_MS });
      }
    } else if (k === 'crumble') {
      const drop = Math.ceil(y / Math.max(1, n));
      for (let q = 0; q < n; q++) { y = Math.max(0, y - drop); step('crumble', gap()); }
    } else if (k === 'gust') for (let q = 0; q < n; q++) step('gust', gap(), { period: 6000, phase: q * 0 });
    else if (k === 'rail') for (let q = 0; q < n; q++) step('rail', gap(), { amp: between(r, 150, 250), period: between(r, 60, 90) * 100, phase: q * 1500 });
    else if (k === 'pend') for (let q = 0; q < n; q++) step('pend', gap(), { amp: 0, period: between(r, 30, 50) * 100, phase: q * 700 });
    else if (k === 'vent') for (let q = 0; q < n; q++) step('vent', gap(), { period: between(r, 40, 60) * 100, phase: between(r, 0, 39) * 100 });
    else if (k === 'drop' && y < 200) for (let q = 0; q < n; q++) step('still', gap());
    else if (k === 'drop') { const fall = Math.min(EG_DROP_CM, Math.max(200, y)); y = Math.max(0, y - fall); step('drop', gap()); }
    else for (let q = 0; q < n; q++) step('still', gap());
  };
  /** A FRAGMENT'S PASSAGE (section 11): a tunnel of its band's kit over the course, its floor broken by a chasm crossed
   *  on ledges (the Oblivion Caverns' in the Galleries; the Ossuary's bone vault, the Gloam Thicket, the Forge Gut below). */
  const cave = (kit = EG_FRAG_KITS[bnd]) => {
    const z0 = edge, zA = z0 + Math.floor((EG_CAVE.len - EG_CAVE.chasm) / 2), zB = zA + EG_CAVE.chasm, z1 = z0 + EG_CAVE.len;
    band(z0, zA, EG_CAVE.halfW, 'cave', y);
    edge = zA;
    const ledges = 3, lgap = Math.floor((EG_CAVE.chasm - ledges * EG_STEP.ledge.d) / (ledges + 1));
    for (let q = 0; q < ledges; q++) step('ledge', lgap, { x: (q % 2 === 0 ? -1 : 1) * 60 });
    band(zB, z1, EG_CAVE.halfW, 'cave', y);
    P.caves.push({ x: X, y, z0, z1, zA, zB, halfW: EG_CAVE.halfW, height: EG_CAVE.height, curtain: zA - 120, kit });
    edge = z1;
  };
  /** A chamber (section 11.4): a fight floor in walls - its disc, its walls' ring, its second floor where it has one. */
  const chamberAt = (zc, R) => { P.chamber = 1; P.deco.push({ t: 'wall', x: X, z: zc, r: R + 150, h: 900, y }); };
  /** The court disc of a fight hall, at z centre `zc`, radius R. */
  const court = (R, role = 'court') => { const zc = edge + 400 + R; band(edge - 50, edge + 450, BRIDGE_HALF, 'bridge', y); disc(X, zc, R, role, y); flD(X, zc, R, y); edge = zc + R; return zc; };
  const downToPlate = () => { if (y > 0) { island(); run('crumble', Math.max(2, Math.ceil(y / EG_STEP_DOWN_CM))); } };
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
    if (kind === 'brink') { run('still', 2); island(); cave(EG_FRAG_KITS[Math.max(0, bnd - 1)]); island(between(r, 200, 260)); run(two[0], 3); island(); cave(EG_FRAG_KITS[bnd]); island(between(r, 200, 260)); run(two[1], 2); }
    else {
      run(two[0], extra > 0 ? 3 : c <= 1 ? 6 : between(r, 4, 5));   // the span decrees' sections take the room of the runs before them
      if (crumbling < 1) island();
      if (c <= 2 || r() < 0.5) { cave(); island(between(r, 200, 260)); }   // in circles 1 and 2 every span carries a passage (section 7)
      run(two[1], extra > 0 ? 3 : c <= 1 ? 6 : between(r, 4, 5));
      // the span decrees' sections are never dropped for room (section 12: "every span carries a gust") - at least two pieces each
      if (gale > 0) { island(); run('gust', Math.max(2, Math.min(2 + gale, Math.floor((10200 - edge) / 560)))); }
      if (crumbling > 0) { if (crumbling < 2) island(); run('crumble', Math.max(2, Math.min(2 + crumbling, Math.floor((10200 - edge) / 560)))); }
      if (c >= 3 && extra < 2 && edge < 9000) { island(); run(pieces[between(r, 0, pieces.length - 1)], between(r, 3, 4)); }
      if (twist === 'vault') { const [vx, vz] = [X + 900, edge - 300]; lane(X, edge - 300, vx, vz, BRIDGE_HALF, 'side', y); disc(vx, vz, 350, 'vault', y); spot('vault', vx, vz); }
    }
    downToPlate();
    edge += gap();
  } else if (kind === 'proving') {
    run(c <= 1 ? 'still' : pieces[between(r, 0, 1)], between(r, 5, 7));
    const R = 1400, zc = edge + gap() + R;
    disc(X, zc, R, 'court', y); flD(X, zc, R, y);
    if (c >= 2 && r() * 3 < 1) { chamberAt(zc, R); for (const s of [-1, 1]) { disc(X + s * (R + 200), zc, 400, 'balcony', y + 350); spot('balcony', X + s * (R + 200), zc); } }
    P.foe = { x: X, z: zc + 400 };
    for (const deg of [0, 120, 240]) { const [x, z] = polar(X, zc, 900, deg + 60); spot('standard', x, z); }
    edge = zc + R;
    if (twist === 'vault') { const [vx, vz] = [X - 900, zc]; lane(X - R, zc, vx - 350, vz, BRIDGE_HALF, 'side', y); disc(vx - 700, vz, 350, 'vault', y); spot('vault', vx - 700, vz); }
    run(c <= 1 ? 'drift' : pieces[between(r, 0, 2)], between(r, 4, 6));
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
    chamberAt(zc, R);
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
    // the shaft: ledges down
    band(edge - 50, edge + 300, BRIDGE_HALF, 'bridge', y);
    edge += 300;
    for (let q = 0; q < 3; q++) { y -= 150; step('ledge', 150, { x: (q % 2 ? 1 : -1) * 80 }); }   // the shaft: down on its ledges
    cave();
    edge += gap();
  } else if (kind === 'scriptorium') {
    run('still', 3);
    const R = 1200, zc = edge + gap() + R;
    disc(X, zc, R, 'court', y); chamberAt(zc, R);
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
      const z0 = edge + 300, z1 = z0 + 5500;
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
  const spots = {};
  for (const [k, v] of Object.entries(P.spots)) spots[k] = v.map((q) => { const o = { ...q, x: m(q.x), z: m(q.z) }; if (q.r != null) o.r = m(q.r); if (q.plate) o.plate = [m(q.plate[0]), m(q.plate[1])]; if (q.bx != null) { o.bx = m(q.bx); o.bz = m(q.bz); } if (q.z1 != null) o.z1 = m(q.z1); return o; });
  const lord = kind === 'court' ? egBossOf(seed, c) : null;
  return {
    v: EG_SPEC, seed, h, c, slot, kind, variant, twist, band: bnd, geo, lord,
    champ: kind === 'proving' || (kind === 'deepway' && P.foe) ? EG_CHAMPIONS[bnd].key : null,
    name: kind === 'court' ? `${EG_LORDS[lord].name}, ${EG_LORDS[lord].epithet}` : EG_HALL_NAMES[variant ?? kind], objective: EG_OBJECTIVES[variant ?? kind],
    x0: (slot - 1) * EG_HALL_PITCH, len: m(edge),
    arrive: pt(P.arrive), end: pt(P.end),
    discs: P.discs.map(pt),
    bands: P.bands.map((b) => ({ x: m(b.x), y: m(b.y), z0: m(b.z0), z1: m(b.z1), halfW: m(b.halfW), role: b.role })),
    lanes: P.lanes.map((l) => ({ ax: m(l.ax), az: m(l.az), bx: m(l.bx), bz: m(l.bz), hw: m(l.hw), role: l.role, y: m(l.y) })),
    steps: P.steps.map((s) => ({ i: s.i, kind: s.kind, span: s.span, x: m(s.x), y: m(s.y), z: m(s.z), w: m(s.w), d: m(s.d), amp: m(s.amp), period: s.period / 1000, phase: s.phase / 1000, beat: s.beat / 1000 })),
    islands: P.islands.map(pt),
    caves: P.caves.map((q) => ({ x: m(q.x), y: m(q.y), z0: m(q.z0), z1: m(q.z1), zA: m(q.zA), zB: m(q.zB), halfW: m(q.halfW), height: m(q.height), curtain: m(q.curtain), kit: q.kit })),
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

/** A circle's five specs, in slot order (`geo` its span decrees). */
export const egCircleSpecs = (seed, c, geo = 0) => [1, 2, 3, 4, 5].map((s) => egHallOf(seed, egFirstHallOf(c) + s - 1, geo));

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
/** Hall `spec`'s fight floor as a test (net/egShape.js egUnionHolds' `onFloor`). */
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
