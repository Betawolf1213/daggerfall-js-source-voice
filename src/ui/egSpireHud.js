// @ts-check
// EG-G1 (2026-10-12, Mac: "I said I want everything"; bible/11-Multiplayer/Elite-Gates.md sections 27.1, 27.2, 27.3,
// 27.8 and 25.7): THE SPIRE'S HUD, BY FORM FACTOR - what a member reads inside a breach, laid out for the screen in hand:
//   THE LAYOUTS (`egFormFactor`, pinned at 1280x720, 390x844 and 844x390): a desk - the count's chip and the Reliquaries'
//     beside the compass, the decrees under them, the potion pip, the objective chip, the lord's bar only in a Court; a
//     phone held upright - one 18 px tabular chip (the count and the Reliquaries), the decrees folded to a tappable
//     *4 decrees*; a phone held sideways - the count's chip and a 44 px lord's bar, the decrees on each arrival card.
//     The company's state is the party rows' (ui/egParty.js), never a second row here; the hall and its band only on the
//     arrival card. Every part reads `--hud-scale` (the port's own HUD scale, copied off `.hud` as the arena's bar does).
//   THE COUNT CHIP (`egCountChip`, section 27.2): mm:ss in tabular figures at 18 px - gold above 10:00, white to 2:00,
//     red below, pulsing at 1 Hz in the last 30 s; *Held* with a pause glyph while the count holds, its reason shown on
//     the chip (the Redoubt, a respite, the door, the stair, a hold) and never said; the last word's figure with a seal
//     when it is nearer than the count. Gains fly in (`egGainText`): *+15:00*, *+10:00 - the Covenant's Press*, *+3:00 -
//     the last word*, *+1:00* for THE GOLD RUN, *Surplus +1* in blue. The warnings (`egChipWarnings`), each once a count
//     and never again after a Redoubt raises it: *The Covenant presses. Five minutes.* at 5:00, a toll at 1:00 and at
//     0:10, and *The count will not hold through the next Court.* when the count left is short of the reference time to
//     the Court's fall (section 18's model - `egCourtNeedMs`).
//   THE ARRIVAL CARD (`egArrivalCard`, section 27.3): *Hall 12 - the Broken Galleries*, the hall's name over it, the
//     objective beneath, the twist as a second line, the decrees in force; at a band's first hall (or the breach's own
//     first) its band's card; *Hall 15 - the Court* and the lord's card at a Court. It wears the gate's title card's
//     own sheet (ui/gateTitleCard.js TITLE_CARD_CSS) on a node of its own - the gate's card is the fight's (a lord's
//     wake and fall, scenes/egFight.js), and the two never stand together.
//   THE OBJECTIVE, THE DOOR, THE LORD'S BAR: the objective chip with its progress (ui/egHud.js egProgressText); the
//     door's screen-edge marker (`egDoorMarker`: the way down's bearing off my facing, on the screen's edge while it is
//     not ahead, with its metres); the lord's name, health and phase in a Court (`egLordBar`).
//   TOUCH AND THE PAD (section 27.8): the witness's Q and E, forsaking and the way home as touch buttons
//     (`egTouchButtons`); the panel's cards and choices and the witness's eye on the pad's d-pad (`egPadAct` - left and
//     right choose, up takes, down says no; a witness's left and right change whom, a held down forsakes), told by the
//     prompt bar (`egPadPrompts`).
//   BOTH SKINS: the HUD is DOM in every skin, as the gate's bar, the arena's and the sea's are (a readout, not a
//     native window - the native-window rule binds DFU's windows); the classic skin dresses it in DFU's own text colour
//     and its shadow (DaggerfallUI.DefaultTextColor / DefaultShadowColor - ui/nativePanel.js DEFAULT_TEXT_COLOR and
//     DEFAULT_SHADOW_COLOR) over the gate's classic face, the enhanced skin in its pixel face on the kit's plates.
//   ACCESSIBILITY (section 25.7, ui/egAccess.js): the danger palette's red on the chip, reduced motion's stillness (no
//     pulse, no flight, no rise), and the beats' words in a polite live region.
//
// One node each, UPDATED, NOT REBUILT, hidden with the HUD. The models are pure.
//
// Not a DFU member. Ledger A (ELITE-GATES).
import { egHallOf, egCircleOfHall, egSlotOfHall, egCountText, egObjectiveOf, EG_LAST_WORD_MS, EG_COUNT_START_MS, EG_REDOUBT_HOLD_MS, EG_BANDS, EG_DECREES, EG_DECREE_BY_KEY, EG_TWIST_LINES, EG_TEXT } from '../net/egLaw.js';
import { egCountAt, egLivingCount, egMemberOf, egRunOfMember } from '../net/egLink.js';
import { EG_ROLE, EG_FL } from '../net/egBodies.js';
import { EG_BOSS_KEYS, egBossName, egTtkRef } from '../net/egLords.js';
import { egProgressText, EG_MARK_NAMES, EG_POTIONS_PER_HALL } from './egHud.js';
import { EG_PRES_TEXT, EG_BAND_LINES } from './egBeats.js';
import { EG_PARTY_CSS } from './egParty.js';
import { titleCardModel, TITLE_CARD_CSS, TITLE_CARD_STYLE_ID } from './gateTitleCard.js';
import { DEFAULT_TEXT_COLOR, DEFAULT_SHADOW_COLOR } from './nativePanel.js';
import { PIXEL_FONT_CSS } from './pixelifyFive.js';
import { injectEnhancedFonts } from './enhancedStyle.js';

// ── the layouts (section 27.1) ────────────────────────────────────────────────────────────────────────────────
/** A phone is a screen whose short side is this or less (CSS px - the party panel's and the arena's own line). */
export const EG_PHONE_SHORT_PX = 560;
/** The three layouts. */
export const EG_FORM_FACTORS = Object.freeze(['desktop', 'upright', 'sideways']);
/** Which layout a screen of `w` x `h` CSS px wears (pure). */
export function egFormFactor({ w = 1280, h = 720 } = {}) {
  if (!(Math.min(w, h) <= EG_PHONE_SHORT_PX)) return 'desktop';
  return h >= w ? 'upright' : 'sideways';
}
/** What each layout shows (pinned): the decrees as a row, folded to a press, or kept for the cards; the lord's bar's
 *  height (px); the Reliquaries in the count's own chip; the potion pip and how many stand, a desk's alone. */
export const EG_LAYOUTS = Object.freeze({
  desktop: Object.freeze({ dec: 'row', lordH: 30, relInChip: false, potion: true, standing: true }),
  upright: Object.freeze({ dec: 'fold', lordH: 30, relInChip: true, potion: false, standing: false }),
  sideways: Object.freeze({ dec: 'card', lordH: 44, relInChip: false, potion: false, standing: false }),
});

// ── THE COUNT CHIP (section 27.2) ─────────────────────────────────────────────────────────────────────────────
/** Above this the chip is gold, under this red, under this it pulses (ms). */
export const EG_CHIP_GOLD_MS = 10 * 60_000;
export const EG_CHIP_RED_MS = 2 * 60_000;
export const EG_CHIP_PULSE_MS = 30_000;
/** The chip's glyphs: the pause while it holds, the seal of the last word. */
export const EG_CHIP_GLYPHS = Object.freeze({ held: '❚❚', seal: '◈' });
/** A hold's reason as the chip shows it (section 6.2 - shown, never said). */
export const EG_HOLD_WORDS = Object.freeze({ rest: 'Redoubt', respite: 'Respite', closing: 'Door', stair: 'Stair', hold: 'Held' });

/** Why the count holds now, or '' while it runs (pure): a rest's, a respite's (the room's `respite` line still running),
 *  the closing's, the pull's to the wake, or a hold's. */
export function egHoldWhy(E, now) {
  if (E.ca > 0 || !(E.wk > 0) || E.end) return '';
  const resp = (E.fight?.says ?? []).filter((s) => s.w === 'respite').at(-1);
  if (resp && now < resp.at + (Number(resp.t) || 0) * 1000) return 'respite';
  if (E.sg === 'rest') return 'rest';
  if (E.sg === 'closing') return 'closing';
  if (E.sg === 'arrive' || E.sg === 'wait') return 'stair';
  return 'hold';
}
/**
 * THE COUNT CHIP (pure): `{ text, tone ('gold' | 'white' | 'red'), pulse, held, why, seal, glyph, label }` - the figure
 * shown (the last word's when it is nearer), its tone by what is left, the pulse in the last 30 s of a running count,
 * the pause glyph and the hold's reason, the seal. Null at the end.
 * @param {any} E @param {number} now
 */
export function egCountChip(E, now) {
  if (!E?.b || E.end) return null;
  const left = E.wk > 0 ? egCountAt(E, now) : EG_COUNT_START_MS;
  const lastWord = Math.max(0, E.op + EG_LAST_WORD_MS - now);
  const seal = lastWord < left;
  const shown = seal ? lastWord : left;
  const held = !(E.ca > 0);
  const why = held ? egHoldWhy(E, now) || 'stair' : '';
  const tone = shown > EG_CHIP_GOLD_MS ? 'gold' : shown >= EG_CHIP_RED_MS ? 'white' : 'red';
  const text = egCountText(shown);
  return { text, tone, pulse: !held && shown < EG_CHIP_PULSE_MS, held, why, seal, glyph: seal ? EG_CHIP_GLYPHS.seal : held ? EG_CHIP_GLYPHS.held : '',
    label: `${seal ? `${EG_PRES_TEXT.lastWhy}: ` : 'The count: '}${text}${held ? ` - ${EG_PRES_TEXT.held}` : ''}` };
}
/**
 * A Redoubt's gain as it flies in (pure), or null (the Covenant spoke: no time): `g` the count gained (ms), `press`
 * whether the Covenant's Press stood when it was taken, `leftAfter` the count after it and `lastWordLeft` the last
 * word's time then (ms). The full fifteen minutes alone; less, its reason.
 */
export function egGainText({ g = 0, cov = 0 } = {}, { press = false, leftAfter = 0, lastWordLeft = Infinity } = {}) {
  if (cov || !(g > 0)) return null;
  const t = egCountText(g);
  if (g >= EG_REDOUBT_HOLD_MS) return EG_PRES_TEXT.gain(t, '');
  if (press) return EG_PRES_TEXT.gain(t, EG_PRES_TEXT.pressWhy);
  if (leftAfter >= lastWordLeft - 1000) return EG_PRES_TEXT.gain(t, EG_PRES_TEXT.lastWhy);
  return EG_PRES_TEXT.gain(t, '');
}
/** Whether the Covenant's Press stands among the decrees in force. */
export const egPressInForce = (E) => (E?.dc ?? []).some(([id]) => id === EG_DECREE_BY_KEY.press.id);
/** A gain's flight (ms). */
export const EG_GAIN_MS = 2600;
/** THE COURT'S CLOCK at reference (section 18's model): a trial's fixed part, its damage part and its counted closing;
 *  a Court's approach before its lord's `ttkRef`. */
export const EG_HALL_REF_MS = (55 + 70 + 15) * 1000;
export const EG_COURT_APPROACH_MS = 26_000;
/** The reference time from hall `h`'s trial to its circle's Court's fall (pure): the trials left, this one counted
 *  whole, and the Court. 0 in a Court. */
export function egCourtNeedMs(h) {
  const slot = egSlotOfHall(h);
  if (slot === 5) return 0;
  return (5 - slot) * EG_HALL_REF_MS + EG_COURT_APPROACH_MS + Math.round(egTtkRef(egCircleOfHall(h)) * 1000);
}
/** The warnings (section 27.2): words at 5:00 and when the Court is out of reach, a toll at 1:00 and at 0:10. */
export const EG_CHIP_WARNINGS = Object.freeze({
  press5: Object.freeze({ at: 5 * 60_000, words: () => EG_PRES_TEXT.press5, toll: false }),
  toll1: Object.freeze({ at: 60_000, words: null, toll: true }),
  toll10: Object.freeze({ at: 10_000, words: null, toll: true }),
  court: Object.freeze({ at: 0, words: () => EG_PRES_TEXT.courtShort, toll: false }),
});
/**
 * The warnings due now (pure but for `said`, the set of those said this breach): each once a count - a Redoubt that
 * raises the count past its line never arms it again. Only while the count runs.
 * @param {Set<string>} said @param {any} E @param {number} now
 */
export function egChipWarnings(said, E, now) {
  const due = [];
  if (!E?.b || E.end || !(E.wk > 0) || !(E.ca > 0)) return due;
  const left = egCountAt(E, now);
  for (const k of ['press5', 'toll1', 'toll10']) if (!said.has(k) && left <= EG_CHIP_WARNINGS[k].at && left > 0) { said.add(k); due.push(k); }
  if (!said.has('court') && E.sg === 'trial' && E.h > 0 && egSlotOfHall(E.h) !== 5 && left < egCourtNeedMs(E.h)) { said.add('court'); due.push('court'); }
  return due;
}

// ── THE ARRIVAL CARD (section 27.3) ───────────────────────────────────────────────────────────────────────────
/** A card stands this long from the arrival (ms). */
export const EG_CARD_MS = 4800;
/** The first hall of each band (section 7). */
export const EG_BAND_FIRST_HALLS = Object.freeze([1, 26, 51, 76]);
const theOf = (name) => String(name ?? '').replace(/^The /, 'the ');
/**
 * What hall `E.h`'s arrival card says (pure): `{ kicker, main, sub, twist, dec, band }` - the hall's name (the band's at a
 * Court) over *Hall 12 - the Broken Galleries* (*Hall 15 - the Court*), the objective (the lord's card - its name and
 * epithet - at a Court) beneath, the twist's line, the decrees in force, and at a band's first hall (or `first`, the
 * breach's own first) the band's card: its name over, its line under.
 * @param {any} E @param {{ first?: boolean }} [o]
 */
export function egArrivalCard(E, { first = false } = {}) {
  if (!E?.b || !(E.h > 0)) return null;
  const spec = egHallOf(E.seed, E.h, E.geo ?? 0), band = EG_BANDS[spec.band];
  const court = spec.kind === 'court';
  const dec = (E.dc ?? []).map(([id, rank]) => `${EG_DECREES[id]?.name ?? ''}${rank >= 2 ? ' II' : ''}`).filter(Boolean);
  const bandCard = first || EG_BAND_FIRST_HALLS.includes(E.h);
  return {
    kicker: bandCard || court ? band?.name ?? '' : spec.name,
    main: court ? EG_PRES_TEXT.hallCourt(E.h) : EG_PRES_TEXT.hallBand(E.h, theOf(band?.name)),
    sub: court ? spec.name : egObjectiveOf(spec),
    twist: spec.twist ? EG_TWIST_LINES[spec.twist] ?? '' : '',
    dec: dec.length ? dec.join(' - ') : '',
    band: bandCard ? EG_BAND_LINES[spec.band] ?? '' : '',
  };
}
/** The card's fade over its stand (the gate card's law - ui/gateTitleCard.js titleCardModel), or null. */
export function egArrivalShown(card, at, now) {
  if (!card) return null;
  const m = titleCardModel({ kind: 'arrive', at, until: at + EG_CARD_MS, kicker: card.kicker, main: card.main, sub: card.sub }, now);
  return m ? { ...card, key: m.key, alpha: m.alpha, fresh: m.fresh } : null;
}

// ── THE DOOR (sections 7 and 27.3) ────────────────────────────────────────────────────────────────────────────
/** Within this of straight ahead the way down is on the screen (rad), and the marker rides the top. */
export const EG_DOOR_AHEAD_RAD = 0.6;
/**
 * The door's marker (pure): my place and the door's in the hall's frame (metres), my facing (`yaw`, 0 down +z - the
 * motor's forward (sin, cos)). `{ rel, ahead, x, y, dist }` - its bearing off my facing (rad, + to the right), whether it
 * is ahead, where the marker stands on the screen (0-1 of its width and height) and how far it is.
 */
export function egDoorMarker(me, door, yaw) {
  const dx = door.x - me.x, dz = door.z - me.z;
  const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const rel = Math.atan2(dx * rx + dz * rz, dx * fx + dz * fz);
  const ahead = Math.abs(rel) <= EG_DOOR_AHEAD_RAD;
  const x = ahead ? 0.5 + 0.4 * (rel / EG_DOOR_AHEAD_RAD) : 0.5 + 0.46 * Math.sin(rel);
  const y = ahead ? 0.14 : 0.5 - 0.42 * Math.cos(rel);
  return { rel, ahead, x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000, dist: Math.round(Math.hypot(dx, dz)) };
}

// ── THE LORD'S BAR ────────────────────────────────────────────────────────────────────────────────────────────
/** The lord's bar in a Court (pure): its name, its epithet, its health's share and its phase - the first true lord
 *  awake (never a mirror image, never a friend). Null elsewhere. */
export function egLordBar(E) {
  if (!E?.b || !(E.h > 0) || E.fight?.h !== E.h) return null;
  const L = (E.fight.bodies ?? []).find((b) => b.role === EG_ROLE.lord && b.ph > 0 && (b.fl & (EG_FL.mirror | EG_FL.friend)) === 0);
  if (!L) return null;
  const key = EG_BOSS_KEYS[L.k] ?? '';
  const spec = egHallOf(E.seed, E.h, E.geo ?? 0);
  return { name: egBossName(key, L.pt), court: spec.kind === 'court', frac: L.max > 0 ? Math.round(Math.max(0, Math.min(1, L.hp / L.max)) * 1000) / 1000 : 0, phase: ['', 'I', 'II', 'III'][L.ph] ?? '' };
}

// ── THE STAGE'S LINE ──────────────────────────────────────────────────────────────────────────────────────────
function stageLine(E, now) {
  const left = E.su > 0 ? Math.max(0, E.su - now) : 0;
  switch (E.sg) {
    case 'arrive': return left > 0 ? `${EG_TEXT.wakes.replace('.', '')} in ${egCountText(left)}.` : 'Gather on the arrival plate.';
    case 'closing': return `${EG_TEXT.door} Step through the door.`;
    case 'rest': return left > 0 ? `${EG_TEXT.descend.replace('.', '')} in ${egCountText(left)} - or take the way home.` : EG_TEXT.descend;
    default: return '';
  }
}

// ── TOUCH AND THE PAD (section 27.8) ──────────────────────────────────────────────────────────────────────────
/** The touch buttons a moment asks for (pure): a witness's eye before and after, and forsaking; a Redoubt's way home. */
export function egTouchButtons({ witness = false, rest = false } = {}) {
  const T = EG_PRES_TEXT.touch;
  if (witness) return [{ id: 'prev', label: T.prev }, { id: 'next', label: T.next }, { id: 'forsake', label: T.forsake }];
  if (rest) return [{ id: 'home', label: T.home }];
  return [];
}
/** The d-pad's codes (systems/inputActions.js DEFAULT_SECONDARY_BINDINGS' diamond; ui/plusPad.js HELM_DPAD). */
export const EG_PAD_DIRS = Object.freeze({ JoystickAxis7Button0: 'up', JoystickAxis7Button1: 'down', JoystickAxis6Button1: 'left', JoystickAxis6Button0: 'right' });
const PAD_OF_DIR = Object.freeze(Object.fromEntries(Object.entries(EG_PAD_DIRS).map(([c, d]) => [d, c])));
/** Whether the d-pad is the Spire's now: a recap standing, the panel open, or a witness's eye. */
export const egPadUp = ({ recap = false, panel = false, witness = false } = {}) => !!(recap || panel || witness);
/**
 * A d-pad press in the Spire (pure): `dir` up | down | left | right, `kind` tap | hold | release. The recap closes on any
 * tap; the panel's choices move left and right, up takes, down says no; a witness's left and right change whom, a held
 * down forsakes. Null: not the Spire's.
 */
export function egPadAct(dir, kind, { recap = false, panel = false, witness = false } = {}) {
  if (kind === 'release') return null;
  if (recap && kind === 'tap') return { k: 'close' };
  if (panel && kind === 'tap') return dir === 'left' ? { k: 'focus', d: -1 } : dir === 'right' ? { k: 'focus', d: 1 } : dir === 'up' ? { k: 'take' } : { k: 'no' };
  if (witness) {
    if (kind === 'tap' && (dir === 'left' || dir === 'right')) return { k: 'watch', d: dir === 'left' ? -1 : 1 };
    if (kind === 'hold' && dir === 'down') return { k: 'forsake' };
  }
  return null;
}
/** The prompt bar's rows while the d-pad is the Spire's (the helm's shape - ui/enhancedHelm.js helmPadPrompts). */
export function egPadPrompts({ recap = false, panel = false, witness = false } = {}) {
  const P = EG_PRES_TEXT.pad;
  if (recap) return [[[PAD_OF_DIR.up], P.close]];
  if (panel) return [[[PAD_OF_DIR.left, PAD_OF_DIR.right], P.choose], [[PAD_OF_DIR.up], P.take], [[PAD_OF_DIR.down], P.no]];
  if (witness) return [[[PAD_OF_DIR.left, PAD_OF_DIR.right], P.watch], [[PAD_OF_DIR.down], P.forsake]];
  return null;
}

// ── THE MODEL ─────────────────────────────────────────────────────────────────────────────────────────────────
/**
 * WHAT THE SPIRE'S HUD SAYS NOW (pure), or null outside a breach's halls: the layout, the count chip, the Reliquaries, how
 * many stand, the potion pip, the recall in hand, the decrees, the objective and its progress, the stage's line, a
 * witness's line, my marks, the lord's bar, the touch buttons - and what the client hands in: a gain in flight, a
 * teaching line, the door's marker, a live line for a screen reader.
 * @param {any} E @param {string|null} me @param {number} now
 * @param {{ ff?: string, witness?: boolean, potions?: number, gain?: { text: string, blue?: boolean }|null, first?: string, door?: any, live?: string, touch?: boolean, foldOpen?: boolean }} [o]
 */
export function egSpireHudModel(E, me, now, { ff = 'desktop', witness = false, potions = EG_POTIONS_PER_HALL, gain = null, first = '', door = null, live = '', touch = false, foldOpen = false } = {}) {
  if (!E?.b || !(E.h > 0) || E.end) return null;
  const L = EG_LAYOUTS[ff] ?? EG_LAYOUTS.desktop;
  const spec = egHallOf(E.seed, E.h, E.geo ?? 0);
  const run = me ? egRunOfMember(E, me) : null, mine = me ? egMemberOf(E, me) : null;
  const dec = (E.dc ?? []).map(([id, rank]) => `${EG_DECREES[id]?.name ?? ''}${rank >= 2 ? ' II' : ''}`).filter(Boolean);
  const watching = witness || !!mine?.wit;
  const memento = me ? (E.mm ?? []).find((q) => q[0] === me) : null;
  const witLine = watching ? (mine?.recall ? (memento ? `Your Memento lies in Hall ${memento[1]}. You will be called back at Redoubt ${egCircleOfHall(E.h)}.` : `You will be called back at Redoubt ${egCircleOfHall(E.h)}.`) : `${EG_TEXT.fallen} /breach forsake leaves for good.`) : '';
  const marks = (E.fight?.mk ?? []).filter((m) => m[0] === me && m[2] > now).map((m) => `${EG_MARK_NAMES[m[1]] ?? ''} ${Math.ceil((m[2] - now) / 1000)}s`);
  const n = E.co.length;
  return {
    ff, chip: egCountChip(E, now), rel: run ? EG_PRES_TEXT.reliquaries(run.rel) : '', relInChip: L.relInChip,
    standing: L.standing && n > 1 ? EG_PRES_TEXT.standing(egLivingCount(E), n) : '',
    potion: L.potion ? `${potions}/${EG_POTIONS_PER_HALL}` : '',
    recall: mine && mine.alive && !mine.home && !mine.recall ? EG_PRES_TEXT.recallSpent : '',   // my last life (PARTY8-B's law: a fact when it is actionable)
    dec: L.dec === 'card' ? [] : dec, decFold: L.dec === 'fold' && dec.length > 0 ? EG_PRES_TEXT.decrees(dec.length) : '', foldOpen,
    objective: E.sg === 'trial' && !watching ? egObjectiveOf(spec) : '', progress: E.sg === 'trial' && !watching ? egProgressText(spec, E.fight?.pg) : '',
    stage: watching ? witLine : stageLine(E, now), marks: marks.join(' - '),
    lord: egLordBar(E)?.court ? egLordBar(E) : null, lordH: L.lordH,   // only in a Court (a Proving Walk's champion has none)
    gain, first, door, live, touch: touch ? egTouchButtons({ witness: watching, rest: E.sg === 'rest' }) : [],
  };
}

// ── THE DRAWING ───────────────────────────────────────────────────────────────────────────────────────────────
export const EG_SPIRE_STYLE_ID = 'dagger-eg-spire-style';
const rgbCss = (c) => `rgb(${Math.round(c[0] * 255)}, ${Math.round(c[1] * 255)}, ${Math.round(c[2] * 255)})`;
/** The classic skin's text and shadow - DFU's own (ui/nativePanel.js). */
export const EG_CLASSIC_TEXT_CSS = rgbCss(DEFAULT_TEXT_COLOR);
export const EG_CLASSIC_SHADOW_CSS = rgbCss(DEFAULT_SHADOW_COLOR);
export const EG_SPIRE_CSS = `
.eg-spire { position: fixed; inset: 0; pointer-events: none; z-index: 30; --s: var(--hud-scale, 1); --eg-danger: #ff5a3a; }
.eg-spire.enhanced { ${PIXEL_FONT_CSS} color: #efe8d6; text-shadow: 2px 2px 0 rgba(0,0,0,0.85); }
.eg-spire.classic { font: 600 15px 'Cormorant', Georgia, serif; color: ${EG_CLASSIC_TEXT_CSS}; text-shadow: 1px 1px 0 ${EG_CLASSIC_SHADOW_CSS}; }
.eg-col { position: absolute; top: 18px; left: calc(50% + min(260px, 30vw) * var(--s) + 14px); transform: scale(var(--s)); transform-origin: top left;
  display: flex; flex-direction: column; align-items: flex-start; gap: 4px; max-width: 300px; }
.eg-chips { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.eg-chip { padding: 2px 7px; font-size: 13px; line-height: 20px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.eg-spire.enhanced .eg-chip { background: rgba(12,14,18,0.78); border: 2px solid #5a5446; }
.eg-spire.classic .eg-chip { background: rgba(0,0,0,0.55); border: 1px solid ${EG_CLASSIC_SHADOW_CSS}; }
.eg-chip:empty { display: none; }
.eg-count { font-size: 18px; letter-spacing: 0.04em; }
.eg-count .eg-glyph:empty, .eg-count .eg-why:empty { display: none; }
.eg-count .eg-glyph { margin-right: 5px; font-size: 13px; }
.eg-count .eg-why { margin-left: 6px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.85; }
.eg-count.gold .eg-time { color: #e8c473; }
.eg-count.white .eg-time { color: #f4efe4; }
.eg-count.red .eg-time { color: var(--eg-danger); }
.eg-count.pulse .eg-time { animation: eg-chip-pulse 1s steps(2, jump-none) infinite; }
@keyframes eg-chip-pulse { 50% { opacity: 0.45; } }
.eg-gain { font-size: 15px; color: #e8c473; min-height: 0; }
.eg-gain.blue { color: #6f9dff; }
.eg-gain:empty { display: none; }
.eg-gain.fly { animation: eg-gain-in 600ms cubic-bezier(.2,.7,.3,1); }
@keyframes eg-gain-in { from { opacity: 0; transform: translateY(-10px); } }
.eg-dec, .eg-obj, .eg-stage, .eg-marks, .eg-first { font-size: 13px; line-height: 1.3; }
.eg-dec:empty, .eg-obj:empty, .eg-stage:empty, .eg-marks:empty, .eg-first:empty, .eg-prog:empty { display: none; }
.eg-obj { font-size: 15px; }
.eg-prog { display: block; font-size: 12px; opacity: 0.85; }
.eg-marks { color: var(--eg-danger); }
.eg-first { color: #b9d0ff; font-style: italic; }
.eg-fold { pointer-events: auto; font: inherit; color: inherit; background: rgba(12,14,18,0.78); border: 1px solid #5a5446; padding: 2px 8px; cursor: pointer; }
.eg-fold:empty { display: none; }
.eg-lord { position: absolute; left: 50%; top: calc(18px + 28px * var(--s) + 12px); transform: translateX(-50%) scale(var(--s)); transform-origin: top center; width: 460px; max-width: 88vw; display: none; }
.eg-lord.on { display: block; }
.eg-lord-name { text-align: center; font-size: 15px; letter-spacing: 0.08em; }
.eg-lord-track { position: relative; height: 10px; margin-top: 3px; background: rgba(8,6,6,0.8); border: 1px solid #5a2a20; }
.eg-lord-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: linear-gradient(180deg, #d9463c, #7d1b15); }
.eg-door { position: absolute; transform: translate(-50%, -50%); display: none; text-align: center; font-size: 12px; color: #e8c473; }
.eg-door.on { display: block; }
.eg-door-arrow { display: block; font-size: 22px; line-height: 22px; }
.eg-touch { position: absolute; left: 50%; bottom: calc(96px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); display: flex; gap: 10px; }
.eg-touch:empty { display: none; }
.eg-touch button { pointer-events: auto; min-width: 88px; min-height: 44px; font: inherit; color: inherit; background: rgba(12,14,18,0.82); border: 2px solid #5a5446; }
.eg-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.eg-spire.upright .eg-col { left: 50%; top: calc(10px + 28px * var(--s) + 8px); transform: translateX(-50%) scale(var(--s)); transform-origin: top center; align-items: center; max-width: 92vw; }
.eg-spire.upright .eg-count { font-size: 18px; }
.eg-spire.sideways .eg-col { top: 10px; }
.eg-spire.sideways .eg-lord { width: 380px; }
.eg-spire.sideways .eg-lord-track { height: 14px; }
.eg-spire.still .eg-count.pulse .eg-time, .eg-spire.still .eg-gain.fly { animation: none; }
${EG_PARTY_CSS}`;

let root = null, P = null;
let card = null, cardP = null;
const SHOWN = () => ({ cls: '', vals: {}, chipCls: '', lordW: '', doorL: '', doorT: '', doorR: '', touchKey: null, decKey: null, gainKey: null, danger: '', scale: '' });
let shown = SHOWN(), cardShown = { key: '', alpha: -1, vis: '', cls: '' };

function ensureStyle(doc) {
  if (doc.getElementById && !doc.getElementById(EG_SPIRE_STYLE_ID)) {
    const st = doc.createElement('style');
    st.id = EG_SPIRE_STYLE_ID;
    st.textContent = EG_SPIRE_CSS;
    (doc.head ?? doc.body)?.append(st);
    if (doc.head) injectEnhancedFonts(doc);
  }
}
function build(doc) {
  ensureStyle(doc);
  const el = (tag, cls) => { const n = doc.createElement(tag); n.className = cls; return n; };
  root = el('div', 'eg-spire');
  root.setAttribute?.('aria-hidden', 'false');
  const col = el('div', 'eg-col'), chips = el('div', 'eg-chips');
  const count = el('div', 'eg-chip eg-count'), glyph = el('span', 'eg-glyph'), time = el('span', 'eg-time'), why = el('span', 'eg-why');
  count.append(glyph, time, why);
  const rel = el('div', 'eg-chip eg-rel'), standing = el('div', 'eg-chip eg-standing'), potion = el('div', 'eg-chip eg-potion'), recall = el('div', 'eg-chip eg-recall');
  chips.append(count, rel, standing, potion, recall);
  const gain = el('div', 'eg-gain'), dec = el('div', 'eg-dec'), fold = el('button', 'eg-fold');
  const obj = el('div', 'eg-obj'), objLine = el('span', 'eg-objline'), prog = el('span', 'eg-prog');
  obj.append(objLine, prog);
  const stage = el('div', 'eg-stage'), marks = el('div', 'eg-marks'), first = el('div', 'eg-first');
  col.append(chips, gain, dec, fold, obj, stage, marks, first);
  const lord = el('div', 'eg-lord'), lordName = el('div', 'eg-lord-name'), track = el('div', 'eg-lord-track'), fill = el('div', 'eg-lord-fill');
  track.append(fill); lord.append(lordName, track);
  const door = el('div', 'eg-door'), arrow = el('span', 'eg-door-arrow'), doorText = el('span', 'eg-door-text');
  arrow.textContent = '▲';
  door.append(arrow, doorText);
  const touch = el('div', 'eg-touch'), live = el('div', 'eg-live');
  live.setAttribute?.('aria-live', 'polite');
  root.append(col, lord, door, touch, live);
  (doc.body ?? doc.documentElement)?.append(root);
  P = { col, chips, count, glyph, time, why, rel, standing, potion, recall, gain, dec, fold, obj, objLine, prog, stage, marks, first, lord, lordName, fill, door, arrow, doorText, touch, live };
}

/**
 * Draw the Spire's HUD for a model (null hides it). `skin` 'classic' | 'enhanced', `still` reduced motion, `danger` the
 * palette's danger colour (CSS), `scale` the HUD's scale; `onTouch(id)` a touch button's press, `onFold()` the folded
 * decrees' press.
 * @param {any} model
 * @param {{ hidden?: boolean, doc?: any, skin?: string, still?: boolean, danger?: string, scale?: string|number, onTouch?: (id: string) => void, onFold?: () => void }} [o]
 */
export function drawEgSpireHud(model, { hidden = false, doc = globalThis.document, skin = 'enhanced', still = false, danger = '', scale = '', onTouch = () => {}, onFold = () => {} } = {}) {
  const want = !hidden && !!model;
  if (!root) { if (!want || !doc?.createElement) return; build(doc); }
  if (!want) { if (root.style.display !== 'none') root.style.display = 'none'; return; }
  if (root.style.display === 'none') root.style.display = '';
  const cls = `eg-spire ${model.ff} ${skin === 'classic' ? 'classic' : 'enhanced'}${still ? ' still' : ''}`;
  if (cls !== shown.cls) { shown.cls = cls; root.className = cls; }
  if (danger && danger !== shown.danger) { shown.danger = danger; root.style.setProperty?.('--eg-danger', danger); }
  const sc = String(scale || '');
  if (sc && sc !== shown.scale) { shown.scale = sc; root.style.setProperty?.('--hud-scale', sc); }
  const put = (k, node, v) => { const s = v ?? ''; if (shown.vals[k] !== s) { shown.vals[k] = s; node.textContent = s; } };
  const c = model.chip;
  put('glyph', P.glyph, c?.glyph); put('time', P.time, c ? (model.relInChip && model.rel ? `${c.text} - ${model.rel.replace('Reliquaries ', 'R')}` : c.text) : '');
  put('why', P.why, c?.held ? EG_HOLD_WORDS[c.why] ?? EG_PRES_TEXT.held : '');
  const chipCls = `eg-chip eg-count${c ? ` ${c.tone}` : ''}${c?.pulse ? ' pulse' : ''}${c?.held ? ' held' : ''}${c?.seal ? ' seal' : ''}`;
  if (chipCls !== shown.chipCls) { shown.chipCls = chipCls; P.count.className = chipCls; P.count.setAttribute?.('aria-label', c?.label ?? ''); }
  put('rel', P.rel, model.relInChip ? '' : model.rel); put('standing', P.standing, model.standing); put('potion', P.potion, model.potion); put('recall', P.recall, model.recall);
  const gk = model.gain ? `${model.gain.text}@${model.gain.at ?? 0}` : '';
  if (gk !== shown.gainKey) { shown.gainKey = gk; P.gain.textContent = model.gain?.text ?? ''; P.gain.className = `eg-gain${model.gain?.blue ? ' blue' : ''}${model.gain ? ' fly' : ''}`; }
  put('dec', P.dec, model.decFold && !model.foldOpen ? '' : model.dec.join(' - '));
  if (model.decFold !== shown.decKey) { shown.decKey = model.decFold; P.fold.textContent = model.decFold; if (!P.fold.egWired) { P.fold.egWired = true; P.fold.addEventListener?.('click', () => onFold()); } }
  put('obj', P.objLine, model.objective); put('prog', P.prog, model.progress);
  put('stage', P.stage, model.stage); put('marks', P.marks, model.marks); put('first', P.first, model.first); put('live', P.live, model.live);
  // the lord's bar
  const L = model.lord;
  const lordCls = `eg-lord${L ? ' on' : ''}`;
  if (P.lord.className !== lordCls) P.lord.className = lordCls;
  put('lord', P.lordName, L ? `${L.name}${L.phase ? ` - ${L.phase}` : ''}` : '');
  const lw = L ? `${(L.frac * 100).toFixed(1)}%` : '0%';
  if (lw !== shown.lordW) { shown.lordW = lw; P.fill.style.width = lw; }
  // the door's marker
  const D = model.door;
  const doorCls = `eg-door${D ? ' on' : ''}`;
  if (P.door.className !== doorCls) P.door.className = doorCls;
  if (D) {
    const l = `${(D.x * 100).toFixed(1)}%`, t = `${(D.y * 100).toFixed(1)}%`, r = `rotate(${Math.round((D.rel * 180) / Math.PI)}deg)`;
    if (l !== shown.doorL) { shown.doorL = l; P.door.style.left = l; }
    if (t !== shown.doorT) { shown.doorT = t; P.door.style.top = t; }
    if (r !== shown.doorR) { shown.doorR = r; P.arrow.style.transform = r; }
    put('door', P.doorText, EG_PRES_TEXT.wayDown(D.dist));
  }
  // the touch buttons
  const tk = model.touch.map((b) => b.id).join(',');
  if (tk !== shown.touchKey) {
    shown.touchKey = tk;
    P.touch.replaceChildren?.();
    for (const b of model.touch) { const n = doc.createElement('button'); n.className = `eg-touch-${b.id}`; n.textContent = b.label; n.addEventListener?.('click', () => onTouch(b.id)); P.touch.append(n); }
  }
}

/** Draw the arrival card for a shown card (egArrivalShown; null hides it). */
export function drawEgArrivalCard(m, { hidden = false, doc = globalThis.document, still = false } = {}) {
  const want = !hidden && !!m;
  if (!card) {
    if (!want || !doc?.createElement) return;
    if (doc.getElementById && !doc.getElementById(TITLE_CARD_STYLE_ID)) { const st = doc.createElement('style'); st.id = TITLE_CARD_STYLE_ID; st.textContent = TITLE_CARD_CSS; (doc.head ?? doc.body)?.append(st); }
    ensureStyle(doc);
    const el = (cls) => { const n = doc.createElement('div'); n.className = cls; return n; };
    card = el('wb-title-card eg-card');
    card.setAttribute?.('aria-hidden', 'true');   // the live line says it in words
    cardP = { kicker: el('wb-title-kicker'), main: el('wb-title-main'), rule: el('wb-title-rule'), sub: el('wb-title-sub'), twist: el('wb-title-sub eg-card-twist'), dec: el('wb-title-sub eg-card-dec'), band: el('wb-title-sub eg-card-band') };
    card.append(cardP.kicker, cardP.main, cardP.rule, cardP.sub, cardP.twist, cardP.dec, cardP.band);
    (doc.body ?? doc.documentElement)?.append(card);
  }
  const vis = want ? 'on' : 'off';
  if (vis !== cardShown.vis) { cardShown.vis = vis; card.style.display = want ? '' : 'none'; }
  if (!want || !m) return;
  if (m.key !== cardShown.key) {
    cardShown.key = m.key;
    for (const k of ['kicker', 'main', 'sub', 'twist', 'dec', 'band']) cardP[k].textContent = m[k] ?? '';
  }
  const cls = `wb-title-card eg-card on${m.fresh && !still ? ' in' : ''}`;
  if (cls !== cardShown.cls) { cardShown.cls = cls; card.className = cls; }
  if (m.alpha !== cardShown.alpha) { cardShown.alpha = m.alpha; card.style.opacity = String(m.alpha); }
}

/** The page is going (a test's reset): the nodes leave with it. */
export function destroyEgSpireHud() {
  root?.remove?.(); card?.remove?.();
  root = null; P = null; card = null; cardP = null;
  shown = SHOWN(); cardShown = { key: '', alpha: -1, vis: '', cls: '' };
}
