// @ts-check
// EG-G1 (2026-10-12, Mac: "I said I want everything"; bible/11-Multiplayer/Elite-Gates.md sections 27.5, 27.7, 27.8 and
// 27.9): EVERY EVENT IS SEEN, HEARD AND SAID, AND THE FIRST BREACH TEACHES -
//   THE WORDS (`EG_PRES_TEXT`): every line the Spire's HUD, its beats, its cards and its first breach add, worded once
//     (section 27.9: short, in the Elder Scrolls' own voice, WB13b's rules). The breach's law keeps its own words
//     (net/egLaw.js EG_TEXT - in the relay's bundle, so a word added there would move the relay's law hash; these are
//     the client's alone);
//   THE BEATS (`EG_BEATS`, section 27.5's table, pinned): each event's sight, its sound (`EG_BEAT_SOUNDS` - Daggerfall's
//     own records, as the Hour's are played: the bell 107, the chime 364, the drums 374, the fanfare 32, the door 25),
//     its words, and who already says them (the fight's beat line - scenes/egFight.js EG_SAY; the client's own chat line;
//     the veil's own sound; the score's song), so a beat is said once and never twice;
//   THE WATCH (`egBeatWatch`): the beats a breach's state has newly heard - the room's beat lines, the falls, a Redoubt,
//     a gift, a hall's wake (its twist and its fork) and the last word - and the first-time lines they bring due. Pure:
//     what was heard before the first look is never replayed (a reload mid-breach says nothing old);
//   THE FIRST BREACH (`EG_TEXT_FIRST`, section 27.7): nine lines, each at its first occurrence and never in a card
//     before it applies, and the Rehearsal's own teaching line, once (`egFirstDue`). EG-ZF (2026-10-12): ONCE AN ACCOUNT -
//     the account service keeps the bits (`/v1/eg/keys` `first`, written by `/v1/eg/first` as a line is shown) and they
//     are read over the device's own (`egFirstOver`); a device with no account keeps the device's (`eg.first`);
//   THE EXAMINATION HEARD (section 25.7): the Spellmaster's runes tell their order by numerals and light, and by a chime
//     as each lights, pitched up its numeral (`EG_RUNE_CHIME`), its numeral in the live line;
//   THE TOUCH OF IT (`EG_HAPTICS`, section 27.8): 15 ms when the Beat underfoot enters its last 0.4 s, 30 ms on a peril,
//     a pad's dual rumble for the same two, behind the touch layer's own `touchHaptics` (`egBuzz`); `egBeatUnder` and
//     `egPerilsNew` find them, pure.
//
// Not a DFU member. Ledger A (ELITE-GATES).
import { EG_TEXT, EG_TWIST_LINES, egHallOf } from '../net/egLaw.js';
import { EG_TOLL_STEP } from '../net/egLaw.js';   // EG-ZI: the pull's toll, a quarter's share
import { egInShape } from '../net/egShape.js';
import { EG_BEAT_CYCLE_S, EG_BEAT_SOLID_S } from '../net/egSpanLaw.js';
import { EG_OBJ } from '../net/egLords.js';
import { EG_ROLE } from '../net/egBodies.js';

/** EG-ZI: a toll of `q` quarters as a whole percentage of the body. */
const tollPct = (q) => Math.round(q * EG_TOLL_STEP * 100);

/** Every new line, worded once (section 27.9). */
export const EG_PRES_TEXT = Object.freeze({
  castBack: '-10%',
  // EG-ZR (section 15's Featherstep): a cast-back's cost as it was taken - 8, 6 or 4% for its holder
  castBackCost: (share) => `-${Math.round(share * 100)}%`,
  // EG-ZI (section 10.6): the pull's toll - its share on the screen, as the cast-back's, and its line with the pull's
  toll: (q) => `-${tollPct(q)}%`,
  tollLine: (q) => `The Spire takes its toll: ${tollPct(q)}% of your health.`,
  // EG-ZS (section 8.5): the decree the Markynaz lays, on his card; (section 15) the Accord an offer's card would take
  champDecree: (title, decree) => `${title}: ${decree}`,
  takesAccord: (name, vestige) => `Takes an Accord with ${name}'s ${vestige}.`,
  divides: 'The way divides.',
  lastWord: 'The last word. The breach closes.',
  held: 'Held',
  press5: 'The Covenant presses. Five minutes.',
  courtShort: 'The count will not hold through the next Court.',
  gain: (t, why) => (why ? `+${t} - ${why}` : `+${t}`),
  pressWhy: "the Covenant's Press",
  lastWhy: 'the last word',
  surplus: 'Surplus +1',
  decrees: (n) => (n === 1 ? '1 decree' : `${n} decrees`),
  hallBand: (h, band) => `Hall ${h} - ${band}`,
  hallCourt: (h) => `Hall ${h} - the Court`,
  standing: (k, n) => `${k} of ${n}`,
  reliquaries: (n) => `Reliquaries ${n}`,
  wayDown: (m) => `The way down - ${m} m`,
  absent: (s) => `Absent - ${s}s`,
  recallSpent: 'Last life',
  rehearsal: 'A Rehearsal: Halls 1 to 5, the count and one life. Nothing is won here, and nothing is lost.',
  highRoad: 'High Road',
  lowRoad: 'Low Road',
  touch: Object.freeze({ prev: '\u2039 Watch', next: 'Watch \u203A', forsake: 'Forsake', home: 'Walk home', bridge: 'Spirebridge' }),
  pad: Object.freeze({ choose: 'Choose', take: 'Take', no: 'No', watch: 'Watch another', forsake: 'Forsake (hold)', close: 'Close', bridge: 'Spirebridge' }),
  // AUDIT EG III (section 15): SPIREBRIDGE - the ask offered while a gap lies ahead (B, the pad's up, the touch button, or
  // /breach bridge), a plank standing told with its seconds, and the room's word said on every screen
  bridgeReady: 'Spirebridge: B bridges the gap ahead.',
  bridgeStands: (n, s) => `${n}'s Spirebridge - ${s}s`,
  bridgeRaised: (n) => `${n} raises a Spirebridge over the gap ahead.`,
  bridgeMine: 'Your Spirebridge spans the gap ahead.',
  bridgeNone: 'No gap a Spirebridge can span lies ahead.',
  bridgeSpent: 'Your Spirebridge is spent until the next span.',
  bridgeNot: 'You hold no Spirebridge.',
  recapHead: 'The breach is over',
  recapDepth: (h, rd, band) => `Hall ${h} - Redoubt ${rd} - ${band}`,
  recapTime: (t) => `From the first wake: ${t}`,
  recapLeft: Object.freeze({ home: 'walked home', forsaken: 'forsook it', fallen: 'fell', standing: 'stood to the end', away: 'was not there' }),
  recapRecall: Object.freeze({ held: 'recall kept', spent: 'recall spent' }),
  recapReliquaries: (n) => `Reliquaries opened: ${n}`,
  recapAccords: 'Accords',
  recapClose: 'Press Enter to close.',
  // EG-ZF (section 27.6): each member's share and healing on the recap; the board's line; the lord's fall's chart
  recapShare: (s) => `${s} of the damage`,
  recapHealed: (n) => `${n} healed`,
  boardDescent: (bracket, rank) => `The Descent, ${bracket}: ${rank}`,
  boardDepths: (rank) => `The Depths: ${rank}`,
  boardBrackets: Object.freeze({ alone: 'Alone', few: 'the Few', company: 'the Company' }),
  chartLord: 'Lord',
  chartSub: (name, n, plural) => `${name} ${plural ? 'have' : 'has'} fallen - ${n === 1 ? 'one alone' : `a company of ${n}`}`,
});
/** The bands' own lines, on a band's first arrival card (section 7's table). */
export const EG_BAND_LINES = Object.freeze([
  "The academy's upper halls, still over the Deadlands.",
  "Halls fallen into the Ideal Masters' realm of the dead.",
  "Halls fallen into Nocturnal's dusk.",
  'The muster-ground of 3E 398. It has no floor.',
]);

/** THE FIRST BREACH's lines (section 27.7), in their bits' order. */
export const EG_TEXT_FIRST = Object.freeze({
  count: 'The count runs. Take a Redoubt to hold it back.',
  door: 'The first across opens the door. The others have 45 seconds.',
  void: 'The void casts you back.',
  fork: 'High and fast, or low and safe.',
  fury: 'A slow lord turns to fury.',
  decrees: "Choose the circle's decrees.",
  recall: 'A Redoubt can call the fallen back once.',
  memento: "Carry a fallen friend's Memento to a niche.",
  home: 'Walk home to open your Reliquaries.',
});
export const EG_FIRST_KEYS = Object.freeze(Object.keys(EG_TEXT_FIRST));
/** The Rehearsal's own teaching line's bit, after the nine. */
export const EG_FIRST_REHEARSAL_BIT = EG_FIRST_KEYS.length;
/** Where the device keeps the lines it has said (a bit each). */
export const EG_FIRST_KEY = 'eg.first';

/** THE BEATS' SOUNDS: DAGGER.SND records, played as the Hour plays its own (scenes/sdHall.js SD_HALL_SOUNDS - the bell
 *  107, the Concord's chime 364; scenes/sdSteps.js the void's moan 66 at a cast-back), and the arena's (systems/
 *  arenaSound.js ARENA_CLIPS - the drums 374, the fanfare 32), the door's (DungeonDoorOpen 25), the cauldron's chord
 *  (MakePotion 365) and the enchanter's chime that rings a Rare drop (scenes/corpseMarker.js playRareDrop - MakeItem 364).
 *  `by` a sound another part already plays: the veil's close (ui/gateVeil.js) and the score's SPIRREDT (EG17). */
export const EG_BEAT_SOUNDS = Object.freeze({
  rewind: Object.freeze({ rec: 66, vol: 0.85, pitch: 1.25 }),
  veil: Object.freeze({ by: 'veil' }),
  door: Object.freeze({ rec: 25, vol: 1, pitch: 0.8 }),
  chime: Object.freeze({ rec: 364, vol: 0.8, pitch: 1 }),
  softChime: Object.freeze({ rec: 364, vol: 0.45, pitch: 1.2 }),
  bell: Object.freeze({ rec: 107, vol: 0.8, pitch: 1.3 }),
  fanfare: Object.freeze({ rec: 32, vol: 0.9, pitch: 1 }),
  drum: Object.freeze({ rec: 374, vol: 1, pitch: 0.9 }),
  lowToll: Object.freeze({ rec: 107, vol: 0.9, pitch: 0.42 }),   // EG-ZD (section 16.5): a fall's low toll - clip 107 at pitch 0.42, the page's
  toll: Object.freeze({ rec: 107, vol: 1, pitch: 0.75 }),
  rare: Object.freeze({ rec: 364, vol: 1, pitch: 1 }),
  chord: Object.freeze({ rec: 365, vol: 0.9, pitch: 0.9 }),
  score: Object.freeze({ by: 'score' }),
});

/** THE EXAMINATION HEARD (section 25.7): the chime as a rune lights, and how far up each numeral pitches it. */
export const EG_RUNE_CHIME = Object.freeze({ rec: 364, vol: 0.7, pitch: 0.9, step: 0.12 });
export const egRuneChime = (pt) => ({ rec: EG_RUNE_CHIME.rec, vol: EG_RUNE_CHIME.vol, pitch: Math.round(EG_RUNE_CHIME.pitch * (1 + EG_RUNE_CHIME.step * Math.max(0, pt - 1)) * 1000) / 1000 });

/**
 * EVERY EVENT IS SEEN, HEARD AND SAID (section 27.5's table, in its order): `sight` what the screen shows, `sound` a key
 * of EG_BEAT_SOUNDS (null none), `words` the line (a function of the name `n` and the room's word `t`, or null none),
 * `by` who already says the words - 'fight' the fight's beat line on the screen (scenes/egFight.js EG_SAY), 'client' the
 * client's own chat line (scenes/egClient.js), null this beat's own: on the screen, and in the chat where `chat`.
 */
export const EG_BEATS = Object.freeze({
  castBack: Object.freeze({ sight: "a 0.4 s dither cut to the waystone, the Steps' rewind burst", sound: 'rewind', words: (n, t) => t ?? EG_PRES_TEXT.castBack, by: null, chat: false }),   // EG-ZR: `t` the cost taken (Featherstep's)
  pull: Object.freeze({ sight: "the veil's flash", sound: 'veil', words: () => EG_TEXT.pulled, by: 'client', chat: true }),
  door: Object.freeze({ sight: 'the beam, the markers', sound: 'door', words: () => EG_TEXT.door, by: 'fight', chat: false }),
  cache: Object.freeze({ sight: "its icon on the door's plaque; taken: the loot banner", sound: 'chime', words: null, by: 'client', chat: true }),
  fork: Object.freeze({ sight: "two banners on the island: a Reliquary's glint high, a brazier and a stair low", sound: null, words: () => EG_PRES_TEXT.divides, by: null, chat: false }),
  niche: Object.freeze({ sight: 'a blue alcove, dimmed once used', sound: 'softChime', words: null, by: null, chat: false }),
  memento: Object.freeze({ sight: 'a gold mote; carried, it trails the carrier; set, the niche flares', sound: 'bell', words: (n, t) => `${n} carries ${t}'s Memento.`, by: 'fight', chat: true }),
  goldRun: Object.freeze({ sight: "the count's chip", sound: 'fanfare', words: () => 'Gold run. +1:00', by: 'fight', chat: false }),
  phase: Object.freeze({ sight: "the lord's phase card", sound: 'drum', words: (n, t) => t ?? '', by: 'fight', chat: false }),
  fall: Object.freeze({ sight: 'THE FALL (section 16.5)', sound: 'lowToll', words: (n) => EG_TEXT.falls(n), by: 'client', chat: true }),
  recall: Object.freeze({ sight: 'a flare at the beacon, a blue pillar', sound: 'chime', words: (n) => `${n} is called back.`, by: 'fight', chat: true }),
  redoubt: Object.freeze({ sight: 'its sequence (section 16.2)', sound: 'score', words: (n, t) => EG_TEXT.redoubt(t), by: null, chat: false }),
  key: Object.freeze({ sight: 'the Weir Key banner', sound: 'rare', words: null, by: null, chat: false }),
  orrery: Object.freeze({ sight: "the Orrery's light", sound: 'chord', words: () => 'The Orrery turns true. A Vestige waits.', by: 'fight', chat: false }),
  twist: Object.freeze({ sight: "the arrival card's second line", sound: null, words: (n, t) => EG_TWIST_LINES[t] ?? '', by: null, chat: true }),
  home: Object.freeze({ sight: "their row's arch", sound: null, words: (n) => `${n} walks home.`, by: 'fight', chat: true }),
  lastWord: Object.freeze({ sight: "the chip's seal", sound: 'toll', words: () => EG_PRES_TEXT.lastWord, by: 'client', chat: false }),
});
export const EG_BEAT_KEYS = Object.freeze(Object.keys(EG_BEATS));
/** The room's beat lines (`esay`'s `w`) that are beats of the table. */
const SAY_BEAT = Object.freeze({ door: 'door', goldrun: 'goldRun', memento: 'memento', recalled: 'recall', home: 'home', orrerytrue: 'orrery', niche: 'niche', phase: 'phase' });

/**
 * What one beat does now (pure): `{ sound, screen, chat }` - the sound to play (a record, its volume and pitch; null for
 * none or one another part plays), the line for the screen and the line for the chat (null where another already says
 * it, or none).
 * @param {string} k a key of EG_BEATS @param {{ n?: string, t?: any }} [w]
 */
export function egBeatPlan(k, { n = '', t = null } = {}) {
  const B = EG_BEATS[k];
  if (!B) return { sound: null, screen: null, chat: null };
  const S = B.sound ? EG_BEAT_SOUNDS[B.sound] : null;
  const words = B.words ? B.words(n || 'A companion', t) : '';
  const own = B.by === null && !!words;
  return { sound: S && S.rec != null ? S : null, screen: own ? words : null, chat: words && B.chat && B.by !== 'client' ? words : null };
}

/** The watch's memory before anything is heard; how many heard keys it holds before it forgets the ones no longer in
 *  the state (a three-hour run must not grow it without end). */
export const egBeatMemo = () => ({ primed: false, seen: new Set(), h: 0, woke: 0, rd: 0, end: null, mm: 0 });
export const EG_BEAT_SEEN_MAX = 512;
const keyOf = (prefix, at, extra = '') => `${prefix}@${at}:${extra}`;
/**
 * THE WATCH: the beats `E` newly holds since `memo` last looked, the first-time lines they bring due, and the runes of an
 * Examination newly lit (their numerals) - pure but for the memo, which it carries. The first look only learns what is
 * there.
 * @param {any} memo egBeatMemo() @param {any} E net/egLink.js's state @param {string|null} me
 * @returns {{ beats: { k: string, n?: string, t?: any }[], firsts: string[], runes: number[] }}
 */
export function egBeatWatch(memo, E, me) {
  const beats = [], firsts = [], runes = [];
  if (!E?.b) { memo.primed = false; memo.seen.clear(); memo.h = 0; memo.woke = 0; memo.rd = 0; memo.end = null; memo.mm = 0; return { beats, firsts, runes }; }
  const held = [];
  const fresh = (key) => { held.push(key); if (memo.seen.has(key)) return false; memo.seen.add(key); return memo.primed; };
  // the room's beat lines
  for (const s of E.fight?.says ?? []) {
    if (!fresh(keyOf(`say:${s.w}`, s.at, s.n ?? ''))) continue;
    if (SAY_BEAT[s.w]) beats.push({ k: SAY_BEAT[s.w], n: s.n, t: s.t });
    if (s.w === 'fury') firsts.push('fury');
  }
  // the falls
  for (const f of E.falls ?? []) if (fresh(keyOf('fall', f.at, f.s))) { beats.push({ k: 'fall', n: f.n, t: f.fin }); if (!f.fin) firsts.push('recall'); }
  // a gift (a cache, an alcove, a vault) - mine alone
  for (const g of E.got ?? []) if (fresh(keyOf('got', g.at, g.w))) beats.push({ k: 'cache', t: g.w });
  // a Redoubt
  const rdAt = E.redoubt?.at ?? 0;
  if (rdAt && rdAt !== memo.rd) { const was = memo.rd; memo.rd = rdAt; if (memo.primed && was !== rdAt) beats.push({ k: 'redoubt', t: E.redoubt.w }); }
  // a hall's wake: its twist and its fork; the count running
  if (E.h > 0 && E.sg === 'trial' && memo.woke !== E.h) {
    const was = memo.woke; memo.woke = E.h;
    if (memo.primed && was !== E.h) {
      const spec = egHallOf(E.seed, E.h, E.geo ?? 0);
      if (spec.twist) beats.push({ k: 'twist', t: spec.twist });
      if (spec.fork) { beats.push({ k: 'fork' }); firsts.push('fork'); }
    }
  }
  if (memo.primed) {
    if (E.wk > 0 && E.sg === 'trial') firsts.push('count');
    if (E.sg === 'closing' && E.h > 0) { const kind = egHallOf(E.seed, E.h, E.geo ?? 0).kind; if (kind === 'span' || kind === 'deepway' || kind === 'brink') firsts.push('door'); }
    if ((E.as ?? []).some((a) => String(a[0]).startsWith('dec:'))) firsts.push('decrees');
    if ((E.mm ?? []).length > 0) firsts.push('memento');
    if (E.sg === 'rest') firsts.push('home');
  }
  // an Examination's runes, each as it lights
  if (E.fight?.h === E.h) for (const b of E.fight.bodies ?? []) if (b.role === EG_ROLE.obj && b.k === EG_OBJ.rune && b.st === 1 && fresh(keyOf('rune', b.i, E.h))) runes.push(b.pt);
  // the last word
  if (E.end && E.end !== memo.end) { memo.end = E.end; if (memo.primed && E.end === 'last') beats.push({ k: 'lastWord' }); }
  memo.h = E.h;
  memo.primed = true;
  if (memo.seen.size > EG_BEAT_SEEN_MAX) memo.seen = new Set(held);
  void me;
  return { beats, firsts, runes };
}

/**
 * THE FIRST BREACH: which of `wanted` (EG_FIRST_KEYS) are due against the device's bits, and the bits after them (pure).
 * Each is said once; the order is the page's.
 * @param {number} bits @param {string[]} wanted
 */
export function egFirstDue(bits, wanted) {
  let b = bits | 0;
  const due = [];
  for (const k of EG_FIRST_KEYS) {
    const i = EG_FIRST_KEYS.indexOf(k);
    if (wanted.includes(k) && !(b & (1 << i))) { b |= 1 << i; due.push(EG_TEXT_FIRST[k]); }
  }
  return { due, bits: b };
}
/** The Rehearsal's teaching line, once a device: `{ line, bits }` (line null when said before). */
export function egRehearsalDue(bits) {
  const bit = 1 << EG_FIRST_REHEARSAL_BIT;
  return (bits | 0) & bit ? { line: null, bits: bits | 0 } : { line: EG_PRES_TEXT.rehearsal, bits: (bits | 0) | bit };
}
/** EG-ZF (section 27.7, once an account): THE BITS IN FORCE - the account's (the service's answer, a whole number; null
 *  while it has none: no account, a guest, no answer yet) over the device's own, with the lines this screen has shown
 *  since (`shown`) - a line shown is never shown again while its word to the service is still on its way. Pure. */
export const egFirstOver = (device, account, shown = 0) => ((Number.isSafeInteger(account) && account >= 0 ? account : device | 0) | (shown | 0));
/** The device's bits from its store (0 for none or a broken one). */
export const egFirstRead = (store) => { try { const v = Number.parseInt(store?.getItem?.(EG_FIRST_KEY) ?? '0', 10); return Number.isSafeInteger(v) && v >= 0 ? v : 0; } catch { return 0; } };
export const egFirstWrite = (store, bits) => { try { store?.setItem?.(EG_FIRST_KEY, String(bits | 0)); } catch { /* the session's alone */ } };

// ── the touch of it (section 27.8) ────────────────────────────────────────────────────────────────────────────
/** A Beat's warning (s - its last 0.4 s), and each pulse: the phone's milliseconds, the pad's dual rumble. */
export const EG_BEAT_WARN_S = 0.4;
export const EG_HAPTICS = Object.freeze({
  beat: Object.freeze({ ms: 15, weak: 0.35, strong: 0 }),
  peril: Object.freeze({ ms: 30, weak: 0.6, strong: 0.8 }),
});
/**
 * The Beat underfoot entering its last EG_BEAT_WARN_S, as a cycle number (to pulse once a cycle), or -1 (pure). `x`,
 * `y`, `z` my feet in the hall's frame, `tS` the shared clock in seconds (net/egSpanLaw.js's).
 */
export function egBeatUnder(spec, x, y, z, tS) {
  for (const s of spec?.steps ?? []) {
    if (s.kind !== 'beat' || Math.abs(x - s.x) > s.w / 2 + 0.2 || Math.abs(z - s.z) > s.d / 2 + 0.2 || Math.abs(y - s.y) > 1.2) continue;
    const u = tS - s.beat, n = Math.floor(u / EG_BEAT_CYCLE_S), into = u - n * EG_BEAT_CYCLE_S;
    if (into >= EG_BEAT_SOLID_S - EG_BEAT_WARN_S && into < EG_BEAT_SOLID_S) return n * 1000 + s.i;
  }
  return -1;
}
/** The blows newly aimed at my feet (x, z in the hall's frame), still to land at `now` - a peril each, once (pure but
 *  for `seen`). */
export function egPerilsNew(blows, x, z, seen, now = -Infinity) {
  const out = [];
  for (const bl of blows ?? []) {
    if (seen.has(bl.i) || bl.cut || !Array.isArray(bl.s) || bl.at <= now) continue;
    if (bl.s.some((s) => egInShape(s, x, z))) { seen.add(bl.i); out.push(bl.i); }
  }
  return out;
}
/** A pulse behind the touch layer's own switch: the phone's vibration and every pad's dual rumble. Answers whether it
 *  was asked of anything. */
export function egBuzz(kind, { on = true, nav = globalThis.navigator } = {}) {
  const H = EG_HAPTICS[kind];
  if (!H || !on || !nav) return false;
  let asked = false;
  try { if (nav.vibrate) { nav.vibrate(H.ms); asked = true; } } catch { /* a platform without it */ }
  try {
    for (const p of nav.getGamepads?.() ?? []) {
      const a = p?.vibrationActuator;
      if (a?.playEffect) { a.playEffect('dual-rumble', { duration: H.ms, weakMagnitude: H.weak, strongMagnitude: H.strong }).catch?.(() => {}); asked = true; }
    }
  } catch { /* no pad */ }
  return asked;
}
